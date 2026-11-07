/**
 * CardScanner — framework-agnostic USB keyboard-wedge IC/RFID reader handler.
 *
 * Reverse-engineered from Grabby's (app.begrabby.com) `TagWatcherService`, with a
 * layout-robust fix added: digits are derived from `event.code` (Digit0..9 / Numpad0..9)
 * so scanning works under ANY keyboard layout — including Lithuanian, where the number
 * row types `ąčęėįšųū„“` instead of `1234567890` and Grabby's original digit filter breaks.
 *
 * How keyboard-wedge readers work: tapping a bracelet emits its UID as a burst of
 * keystrokes, usually terminated by Enter. Some readers omit Enter, so we also treat a
 * short idle gap as the end of a scan.
 */

export interface CardScannerOptions {
  /** End-of-scan idle gap in ms. Grabby uses 500. */
  idleTimeoutMs?: number;
  /** Minimum digit count for an idle-terminated scan to count (noise filter). Grabby: >5 (i.e. 6). */
  minDigits?: number;
  /**
   * How to interpret a completed buffer:
   *  - 'digits'  : strip to digits only (recommended for numeric IC/RFID cards).
   *  - 'raw'     : emit the buffer as typed (after stripping a leading '%' sentinel).
   * Grabby uses 'raw' on the Enter path and 'digits' on the idle path; 'digits' is the
   * safe default for a purely numeric reader.
   */
  mode?: "digits" | "raw";
  /** Strip a leading '%' (magstripe start sentinel) before emitting. Grabby does this. Default true. */
  stripPercentPrefix?: boolean;
  /** Called with the final card number when a scan completes. */
  onScan?: (cardNumber: string, meta: ScanMeta) => void;
  /** Called with the raw buffer for non-card bursts (e.g. "command" cards). Optional. */
  onCommand?: (raw: string) => void;
  /** Target to listen on. Default: document. */
  target?: Document | HTMLElement;
}

export interface ScanMeta {
  /** 'enter' if an Enter key ended the scan, 'idle' if the idle timeout did. */
  terminator: "enter" | "idle";
  /** The raw buffer before digit-stripping / sentinel removal. */
  raw: string;
}

const DIGIT_CODE = /^(?:Digit|Numpad)([0-9])$/;

export class CardScanner {
  private readonly idleTimeoutMs: number;
  private readonly minDigits: number;
  private readonly mode: "digits" | "raw";
  private readonly stripPercentPrefix: boolean;
  private readonly target: Document | HTMLElement;

  private onScan?: (cardNumber: string, meta: ScanMeta) => void;
  private onCommand?: (raw: string) => void;

  /** refcount, mirrors Grabby's `running`: listener only reacts while > 0. */
  private running = 0;
  private buffer = "";
  private idleTimer: ReturnType<typeof setTimeout> | null = null;
  private bound = false;

  constructor(opts: CardScannerOptions = {}) {
    this.idleTimeoutMs = opts.idleTimeoutMs ?? 500;
    this.minDigits = opts.minDigits ?? 6; // Grabby: digits.length > 5
    this.mode = opts.mode ?? "digits";
    this.stripPercentPrefix = opts.stripPercentPrefix ?? true;
    this.target = opts.target ?? (typeof document !== "undefined" ? document : (undefined as never));
    this.onScan = opts.onScan;
    this.onCommand = opts.onCommand;
  }

  /** Begin listening (refcounted). Call when a scan screen opens. Binds the DOM listener lazily. */
  start(): void {
    if (!this.bound) {
      this.target.addEventListener("keydown", this.handleKeyDown as EventListener);
      this.bound = true;
    }
    this.running++;
    this.clear();
  }

  /** Stop one `start()`. The listener stays bound but goes inert once running hits 0. */
  stop(): void {
    this.running = Math.max(0, this.running - 1);
  }

  /** Force-reset the refcount to 0 (inert). */
  reset(): void {
    this.running = 0;
    this.clear();
  }

  isRunning(): boolean {
    return this.running > 0;
  }

  /** Fully unbind the DOM listener. Call on teardown/unmount. */
  destroy(): void {
    if (this.bound) {
      this.target.removeEventListener("keydown", this.handleKeyDown as EventListener);
      this.bound = false;
    }
    this.reset();
  }

  private clear(): void {
    this.buffer = "";
    if (this.idleTimer !== null) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
  }

  /** Arrow fn so `this` is bound and add/removeEventListener match. */
  private handleKeyDown = (event: KeyboardEvent): void => {
    const { key, code, ctrlKey } = event;
    if (!key || ctrlKey) return;

    // (Re)arm the idle terminator on every keystroke.
    if (this.idleTimer !== null) clearTimeout(this.idleTimer);
    this.idleTimer = setTimeout(() => this.onIdle(), this.idleTimeoutMs);

    if (this.running <= 0) return;

    // Enter terminates the scan immediately.
    if (key === "Enter" && this.buffer.length > 0) {
      this.emit("enter");
      return;
    }

    // Accumulate a single character. Prefer the layout-independent digit from `code`.
    const digit = code.match(DIGIT_CODE)?.[1];
    if (digit) {
      this.buffer += digit;
    } else if (key.length === 1) {
      this.buffer += key;
    }
  };

  private onIdle(): void {
    this.idleTimer = null;
    if (this.running <= 0) {
      this.buffer = "";
      return;
    }
    if (this.buffer.length === 0) return;
    this.emit("idle");
  }

  private emit(terminator: "enter" | "idle"): void {
    const raw = this.buffer;
    this.clear();

    // Non-card bursts: let callers react to "command" cards if they want.
    this.onCommand?.(raw);

    let value = raw;
    if (this.stripPercentPrefix && value.startsWith("%")) {
      value = value.slice(1);
    }

    if (this.mode === "digits") {
      value = value.replace(/\D/g, "");
    }

    // Noise filter: idle-terminated scans must clear the digit floor.
    // (Enter is an explicit terminator, so we trust shorter values there.)
    const digitCount = value.replace(/\D/g, "").length;
    if (terminator === "idle" && digitCount < this.minDigits) return;
    if (value.length === 0) return;

    this.onScan?.(value, { terminator, raw });
  }
}
