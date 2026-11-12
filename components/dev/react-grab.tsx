"use client";

import { useEffect } from "react";

/**
 * React Grab (dev only): hover an element in `next dev` and press Cmd/Ctrl+C to copy its component name, file and HTML to
 * paste into Claude Code. The package loads on demand and only in development, so it never reaches a production bundle.
 */
export function ReactGrab() {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") void import("react-grab");
  }, []);
  return null;
}
