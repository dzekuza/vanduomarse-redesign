"use client";

import { forwardRef, useImperativeHandle, useRef, useState } from "react";

export interface SignaturePadHandle {
  clear: () => void;
  toBlob: () => Promise<Blob | null>;
}

interface SignaturePadProps {
  onChange?: (hasInk: boolean) => void;
}

/** A plain pointer-events canvas signature pad — no library, just draw-to-canvas. */
export const SignaturePad = forwardRef<SignaturePadHandle, SignaturePadProps>(function SignaturePad({ onChange }, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [hasInk, setHasInk] = useState(false);

  function point(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  }

  function start(e: React.PointerEvent<HTMLCanvasElement>) {
    const ctx = canvasRef.current?.getContext("2d");
    const p = point(e);
    if (!ctx || !p) return;
    drawing.current = true;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    canvasRef.current?.setPointerCapture(e.pointerId);
  }

  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    const p = point(e);
    if (!ctx || !p) return;
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    // design-check-ignore-next-line color-value: canvas 2D strokeStyle needs a literal colour; pen ink on a white signature panel
    ctx.strokeStyle = "#1a1a1a";
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    if (!hasInk) {
      setHasInk(true);
      onChange?.(true);
    }
  }

  function end() {
    drawing.current = false;
  }

  useImperativeHandle(ref, () => ({
    clear: () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasInk(false);
      onChange?.(false);
    },
    toBlob: () =>
      new Promise((resolve) => {
        canvasRef.current?.toBlob((blob) => resolve(blob), "image/png");
      }),
  }));

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={220}
      onPointerDown={start}
      onPointerMove={move}
      onPointerUp={end}
      onPointerLeave={end}
      className="h-[150px] w-full touch-none rounded-lg border border-border bg-background"
    />
  );
});
