"use client";

import { useEffect, useRef } from "react";
import { createDistortRenderer, type DistortRenderer } from "@/lib/distort-gl";
import { cn } from "@/lib/utils";
import { Wordmark } from "./wordmark";

const MAX_DPR = 2;
/** Effect radius as a share of the wordmark width, capped so phones-in-landscape stay calm. */
const RADIUS_SHARE = 0.18;
const RADIUS_MAX = 260;

/** Rasterises the h1's spans (position, font, token colour) into a 2D canvas. */
function paintWordmark(h1: Element, canvas: HTMLCanvasElement, dpr: number): HTMLCanvasElement | null {
  const box = canvas.getBoundingClientRect();
  const style = getComputedStyle(h1);
  const layer = document.createElement("canvas");
  layer.width = Math.round(box.width * dpr);
  layer.height = Math.round(box.height * dpr);
  const ctx = layer.getContext("2d");
  if (!ctx) return null;

  ctx.scale(dpr, dpr);
  ctx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  ctx.fillStyle = getComputedStyle(canvas).color;
  ctx.textBaseline = "alphabetic";

  h1.querySelectorAll("span").forEach((span) => {
    const text = (span.textContent ?? "").toUpperCase();
    const range = document.createRange();
    range.selectNodeContents(span);
    const rect = range.getClientRects()[0];
    if (!rect) return;
    const ascent = ctx.measureText(text).fontBoundingBoxAscent;
    ctx.fillText(text, rect.left - box.left, rect.top - box.top + ascent);
  });
  return layer;
}

/**
 * Home-hero wordmark: the real `h1` stays in the DOM (SEO, selection, no-JS), and on
 * fine-pointer devices a WebGL canvas takes over drawing it so the letters melt
 * around the cursor. Touch devices and `prefers-reduced-motion` keep the plain text.
 */
export function DistortWordmark({ className }: { className?: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const renderer: DistortRenderer | null = createDistortRenderer(canvas);
    if (!renderer) return;

    const state = { x: 0, y: 0, tx: 0, ty: 0, power: 0, target: 0, radius: RADIUS_MAX };
    let frame = 0;
    let build = 0;
    let disposed = false;

    const draw = (time: number) =>
      renderer.render({ pointer: [state.x, state.y], power: state.power, time, radius: state.radius });

    const tick = (now: number) => {
      state.x += (state.tx - state.x) * 0.18;
      state.y += (state.ty - state.y) * 0.18;
      state.power += (state.target - state.power) * 0.1;
      if (state.target === 0 && state.power < 0.005) {
        state.power = 0;
        frame = 0;
        draw(now / 1000);
        return;
      }
      draw(now / 1000);
      frame = requestAnimationFrame(tick);
    };

    const start = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };

    const rebuild = async () => {
      const h1 = wrap.querySelector("h1");
      if (!h1) return;
      const id = ++build;
      const style = getComputedStyle(h1);
      await document.fonts.load(`${style.fontWeight} ${style.fontSize} ${style.fontFamily}`);
      if (disposed || id !== build) return;

      const box = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      renderer.resize(box.width, box.height, dpr);
      state.radius = Math.min(RADIUS_MAX, box.width * RADIUS_SHARE);
      const layer = paintWordmark(h1, canvas, dpr);
      if (!layer) return;
      renderer.setTexture(layer);
      draw(performance.now() / 1000);
      wrap.dataset.ready = "true";
    };

    const onMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      const box = canvas.getBoundingClientRect();
      state.tx = event.clientX - box.left;
      state.ty = event.clientY - box.top;
      if (state.target === 0 && state.power === 0) {
        state.x = state.tx;
        state.y = state.ty;
      }
      state.target = 1;
      start();
    };
    const onLeave = () => {
      state.target = 0;
      start();
    };

    renderer.onContextLost(() => {
      delete wrap.dataset.ready;
    });
    const observer = new ResizeObserver(() => void rebuild());
    observer.observe(wrap);
    wrap.addEventListener("pointermove", onMove);
    wrap.addEventListener("pointerleave", onLeave);

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      wrap.removeEventListener("pointermove", onMove);
      wrap.removeEventListener("pointerleave", onLeave);
      delete wrap.dataset.ready;
      renderer.destroy();
    };
  }, []);

  return (
    <div ref={wrapRef} className={cn("group relative data-[ready=true]:[&_h1]:text-transparent", className)}>
      <Wordmark as="h1" />
      {/* Oversized so the smeared edges are not clipped; colour is read from `text-rust`. */}
      <div aria-hidden className="pointer-events-none absolute -inset-x-6 -inset-y-10">
        <canvas ref={canvasRef} className="block size-full text-rust opacity-0 group-data-[ready=true]:opacity-100" />
      </div>
    </div>
  );
}
