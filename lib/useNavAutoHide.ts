"use client";

import { useEffect, useState, type RefObject } from "react";

/** Phones only — the desktop navbar keeps its fixed position. Matches `md` in Tailwind. */
const MOBILE = "(max-width: 767px)";
/** Distance travelled against the scroll direction before the state flips. */
export const DEADBAND = 8;
/** Never hide while the page is still effectively at the top. */
export const TOP_GUARD = 64;
/** Anything closer than this to the top always shows the navbar. */
export const AT_TOP = 12;

export type NavVisibility = { hidden: boolean; anchor: number };

/**
 * The whole hide/show decision, kept pure so it can be reasoned about (and
 * tested) without a browser.
 *
 * `anchor` is the scroll position at which the current state was decided, not
 * the previous event's position. Comparing against it — instead of against the
 * last event — means a slow drag accumulates the 8px deadband instead of being
 * ignored event by event, while a jittery 2px wobble never flips the bar.
 *
 * `guard` is the minimum scroll offset at which hiding is safe. It has to be at
 * least the bar's own height: a sticky element keeps its box in the flow, so
 * sliding it away while the page is scrolled less than one bar-height exposes
 * the empty strip that box leaves behind.
 */
export function nextNavVisibility(
  y: number,
  anchor: number,
  hidden: boolean,
  guard: number = TOP_GUARD
): NavVisibility {
  if (y <= AT_TOP) return { hidden: false, anchor: y };
  if (y > anchor + DEADBAND) return { hidden: y > guard ? true : hidden, anchor: y };
  if (y < anchor - DEADBAND) return { hidden: false, anchor: y };
  return { hidden, anchor };
}

/**
 * Auto-hiding mobile navbar.
 *
 * Returns `true` when the bar should be out of the way: scrolling down hides it,
 * scrolling up brings it back, and the top of the page always shows it.
 *
 * Two details matter on real devices. Scroll events arrive far faster than
 * frames, so the handler only reads `scrollTop` once per animation frame. And
 * while something inside the bar (the search field) has focus it stays put —
 * hiding the field someone is typing into would be a bug, not a feature.
 *
 * `resetKey` re-shows the bar when the view changes (e.g. another category),
 * because the scroll position is no longer the one the user scrolled.
 */
export function useNavAutoHide(
  scrollRef: RefObject<HTMLElement | null>,
  barRef: RefObject<HTMLElement | null>,
  resetKey?: unknown
) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return;

    // A different view (another category) starts from a shown bar, and the
    // internal state has to agree with it — otherwise the next downward scroll
    // would be swallowed as "already hidden".
    setHidden(false);

    const mobile = window.matchMedia(MOBILE);
    let hiddenNow = false;
    let anchor = scroller.scrollTop;
    let frame = 0;
    // Hiding is only safe once the page has scrolled past the bar's own height.
    // Measured on mount and on resize rather than per frame: reading
    // `offsetHeight` mid-scroll would force a layout on every frame.
    let guard = TOP_GUARD;
    const measure = () => {
      guard = Math.max(TOP_GUARD, barRef.current?.offsetHeight ?? 0);
    };
    measure();

    const apply = (next: boolean) => {
      if (next === hiddenNow) return;
      hiddenNow = next;
      setHidden(next);
    };

    const evaluate = () => {
      frame = 0;

      // Desktop keeps its navbar exactly where it was; so does a bar that holds
      // the focused element (the search box).
      const bar = barRef.current;
      if (!mobile.matches || (bar && bar.contains(document.activeElement))) {
        apply(false);
        anchor = scroller.scrollTop;
        return;
      }

      const next = nextNavVisibility(scroller.scrollTop, anchor, hiddenNow, guard);
      anchor = next.anchor;
      apply(next.hidden);
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(evaluate);
    };

    const onBreakpoint = () => {
      apply(false);
      anchor = scroller.scrollTop;
      measure();
    };

    scroller.addEventListener("scroll", onScroll, { passive: true });
    mobile.addEventListener("change", onBreakpoint);
    window.addEventListener("resize", onBreakpoint);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      scroller.removeEventListener("scroll", onScroll);
      mobile.removeEventListener("change", onBreakpoint);
      window.removeEventListener("resize", onBreakpoint);
    };
  }, [scrollRef, barRef, resetKey]);

  return hidden;
}
