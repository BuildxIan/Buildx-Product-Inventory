"use client";

import { useEffect, useState, type RefObject } from "react";

/** Tailwind's `lg` breakpoint — at or above it the navbar never moves. */
const DESKTOP_QUERY = "(min-width: 1024px)";

/** Ignore 1–2px jitter from trackpads, momentum and rubber-band bounce. */
const DIRECTION_THRESHOLD = 8;

/** Inside this distance from the top the navbar is always visible. */
const TOP_ZONE = 24;

/**
 * Hides the navbar while the user scrolls, on phones only.
 *
 * The page itself never scrolls — `<main>` is the scroll container (see
 * `CatalogApp`), so the listener goes on that element rather than `window`.
 *
 * Direction mapping is the one the product spec asks for: moving back up the
 * page hides the bar, moving down the page brings it back. Near the top it is
 * pinned visible, so a short page or a fresh load never starts hidden.
 *
 * Returns `hidden`; the caller owns the transition.
 */
export function useHideOnScroll(scrollRef: RefObject<HTMLElement | null>) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return;

    const desktop = window.matchMedia(DESKTOP_QUERY);

    // Anchor: the last position where we committed to a state. Comparing
    // against it — instead of the previous event — lets a slow drag accumulate
    // until it is unmistakably a direction change.
    let anchor = scroller.scrollTop;
    let frame = 0;

    const evaluate = () => {
      frame = 0;

      // Desktop keeps its static navbar; drop any state left from a resize.
      if (desktop.matches) {
        setHidden(false);
        anchor = scroller.scrollTop;
        return;
      }

      const top = scroller.scrollTop;

      // Top of the list: always visible, and reset the anchor so the first
      // downward flick is measured from here.
      if (top <= TOP_ZONE) {
        setHidden(false);
        anchor = top;
        return;
      }

      const delta = top - anchor;
      if (delta > DIRECTION_THRESHOLD) {
        setHidden(false);
        anchor = top;
      } else if (delta < -DIRECTION_THRESHOLD) {
        setHidden(true);
        anchor = top;
      }
    };

    // Scroll fires far more often than the browser paints; collapse the burst
    // into one evaluation per frame.
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(evaluate);
    };

    scroller.addEventListener("scroll", onScroll, { passive: true });
    desktop.addEventListener("change", evaluate);
    evaluate();

    return () => {
      scroller.removeEventListener("scroll", onScroll);
      desktop.removeEventListener("change", evaluate);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [scrollRef]);

  return hidden;
}
