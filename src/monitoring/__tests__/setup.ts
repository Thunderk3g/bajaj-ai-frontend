import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
});

// jsdom backs requestAnimationFrame with a ~16ms timer, which makes the
// LogViewer's "release the auto-scroll guard" callback fire asynchronously and
// nondeterministically in tests. Run it synchronously so scroll-driven state
// (follow/pause) is observable right after a programmatic scroll.
globalThis.requestAnimationFrame = ((cb: FrameRequestCallback): number => {
  cb(0);
  return 0;
}) as typeof globalThis.requestAnimationFrame;
globalThis.cancelAnimationFrame = (() => {}) as typeof globalThis.cancelAnimationFrame;
