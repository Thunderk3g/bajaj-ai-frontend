import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LogViewer } from "@/monitoring/components/LogViewer";
import { client } from "@/monitoring/lib/client";
import type { LogLine } from "@/monitoring/lib/types";
import type { StreamHandlers } from "@/monitoring/lib/client";

/**
 * LogViewer: follows the tail, pauses when the user scrolls up, and resumes via
 * the follow toggle. We drive the stream through a mocked client so emission is
 * deterministic, and we stub the scroll geometry that jsdom does not compute.
 */

// Captured stream handlers so the test can push lines on demand.
let streamHandlers: StreamHandlers | null = null;

beforeEach(() => {
  streamHandlers = null;
  vi.spyOn(client, "getLogs").mockResolvedValue({ name: "c", lines: [] });
  vi.spyOn(client, "streamLogs").mockImplementation((_name, _tail, handlers) => {
    streamHandlers = handlers;
    handlers.onOpen?.();
    return () => {};
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

/** Push a log line through the captured stream handler, wrapped in act(). */
async function emit(text: string) {
  const line: LogLine = { ts: new Date().toISOString(), text };
  await act(async () => {
    streamHandlers?.onLine(line);
    // Let the backfill `.finally(open)` microtasks flush.
    await Promise.resolve();
  });
}

/**
 * Install controllable scroll geometry on the log body. jsdom returns 0 for all
 * of these, so we back them with mutable values and let scrollTop be assignable.
 */
function installScrollGeometry(el: HTMLElement, opts: { scrollHeight: number; clientHeight: number }) {
  let scrollTop = 0;
  Object.defineProperty(el, "scrollHeight", { configurable: true, get: () => opts.scrollHeight });
  Object.defineProperty(el, "clientHeight", { configurable: true, get: () => opts.clientHeight });
  Object.defineProperty(el, "scrollTop", {
    configurable: true,
    get: () => scrollTop,
    set: (v: number) => {
      scrollTop = v;
    },
  });
  return {
    get scrollTop() {
      return scrollTop;
    },
    set scrollTop(v: number) {
      scrollTop = v;
    },
  };
}

function getLogBody(): HTMLElement {
  return screen.getByRole("log");
}

describe("LogViewer follow / pause-on-scroll", () => {
  it("follows the tail: scrolls to bottom as new lines arrive", async () => {
    render(<LogViewer name="c" enabled />);
    // Let backfill resolve and the stream open.
    await act(async () => {
      await Promise.resolve();
    });

    const body = getLogBody();
    const geo = installScrollGeometry(body, { scrollHeight: 1000, clientHeight: 200 });

    await emit("line one");
    await emit("line two");

    // requestAnimationFrame in the follow effect releases the guard; the
    // scrollTop should have been driven to the bottom (scrollHeight).
    expect(geo.scrollTop).toBe(1000);
    expect(screen.getByText("line one")).toBeInTheDocument();
    expect(screen.getByText("line two")).toBeInTheDocument();
  });

  it("pauses following when the user scrolls up, and shows 'Paused'", async () => {
    render(<LogViewer name="c" enabled />);
    await act(async () => {
      await Promise.resolve();
    });

    const body = getLogBody();
    const geo = installScrollGeometry(body, { scrollHeight: 1000, clientHeight: 200 });
    await emit("first");

    // Initially following.
    expect(screen.getByRole("button", { name: /following/i })).toBeInTheDocument();

    // User scrolls up (well away from the bottom) → follow pauses.
    act(() => {
      geo.scrollTop = 100;
      fireEvent.scroll(body);
    });
    expect(screen.getByRole("button", { name: /paused/i })).toBeInTheDocument();

    // A new line must NOT yank the view back to the bottom while paused.
    geo.scrollTop = 100;
    await emit("second while paused");
    expect(geo.scrollTop).toBe(100);
  });

  it("resumes following via the toggle button", async () => {
    const user = userEvent.setup();
    render(<LogViewer name="c" enabled />);
    await act(async () => {
      await Promise.resolve();
    });

    const body = getLogBody();
    const geo = installScrollGeometry(body, { scrollHeight: 1000, clientHeight: 200 });
    await emit("a");

    // Scroll up to pause.
    act(() => {
      geo.scrollTop = 50;
      fireEvent.scroll(body);
    });
    expect(screen.getByRole("button", { name: /paused/i })).toBeInTheDocument();

    // Click toggle to resume following.
    await user.click(screen.getByRole("button", { name: /paused/i }));
    expect(screen.getByRole("button", { name: /following/i })).toBeInTheDocument();

    // New lines now stick to the bottom again.
    await emit("b");
    expect(geo.scrollTop).toBe(1000);
  });
});
