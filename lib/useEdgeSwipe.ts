"use client";

import { useEffect, useRef } from "react";

/** A swipe has to start within this many pixels of the left edge. */
export const EDGE_ZONE = 20;
/** Horizontal distance that actually commits the gesture. */
export const SWIPE_THRESHOLD = 64;
/** Movement below this is not yet a direction — it is a finger resting. */
export const DIRECTION_SLOP = 10;

/** Matches `md` in Tailwind: the drawer only exists below it. */
const MOBILE = "(max-width: 767px)";

export type SwipeAxis = "pending" | "horizontal" | "vertical";

/**
 * Which way a touch is going. Kept separate from the DOM so the rule can be
 * reasoned about (and tested) on its own.
 *
 * A gesture stays `pending` until it clears the slop, so a resting finger or a
 * 3px wobble never counts as a swipe. After that, whichever axis moved further
 * owns the gesture — a vertical scroll is never stolen by the drawer.
 */
export function swipeAxis(dx: number, dy: number): SwipeAxis {
  const horizontal = Math.abs(dx);
  const vertical = Math.abs(dy);
  if (horizontal < DIRECTION_SLOP && vertical < DIRECTION_SLOP) return "pending";
  return horizontal > vertical ? "horizontal" : "vertical";
}

/**
 * Whether the horizontal travel commits the gesture.
 * `opening` = the drawer is closed and this swipe would open it (rightward);
 * otherwise the swipe is a closing one (leftward).
 */
export function swipeCommits(dx: number, opening: boolean, threshold = SWIPE_THRESHOLD): boolean {
  return opening ? dx >= threshold : dx <= -threshold;
}

type Options = {
  /** The drawer's existing open state — this hook never owns navigation. */
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  /** Set false to disable the gesture entirely. */
  enabled?: boolean;
};

/**
 * Edge-swipe drawer gestures for phones and small tablets.
 *
 * - Closed: a touch starting in the first `EDGE_ZONE` px that travels right
 *   past `SWIPE_THRESHOLD` opens the drawer, at any scroll position.
 * - Open: a leftward swipe anywhere on the drawer or its backdrop closes it.
 *
 * Two details keep this out of the way of the rest of the page:
 *
 * 1. The `touchmove` listener is only attached once a candidate gesture has
 *    started, and it is the only non-passive listener. Ordinary scrolling
 *    therefore never waits for JavaScript, and a vertical drag drops out of
 *    tracking before it can prevent anything.
 * 2. Nothing is intercepted until the gesture is proven horizontal, so product
 *    cards, galleries and the category list keep their own touch behaviour.
 *
 * The drawer is fixed and the page scroll is untouched, so opening and closing
 * preserves the reader's scroll position by construction.
 */
export function useEdgeSwipe({ isOpen, onOpen, onClose, enabled = true }: Options) {
  // Read through refs so the listeners can be attached once, without
  // re-subscribing on every open/close render.
  const openRef = useRef(isOpen);
  const openCallback = useRef(onOpen);
  const closeCallback = useRef(onClose);
  openRef.current = isOpen;
  openCallback.current = onOpen;
  closeCallback.current = onClose;

  useEffect(() => {
    if (!enabled) return;

    const mobile = window.matchMedia(MOBILE);
    let startX = 0;
    let startY = 0;
    let tracking = false;
    let decided = false;

    function stopTracking() {
      tracking = false;
      decided = false;
      document.removeEventListener("touchmove", onMove);
    }

    function onMove(event: TouchEvent) {
      if (!tracking) return;
      const touch = event.touches[0];
      if (!touch) return;

      const dx = touch.clientX - startX;
      const dy = touch.clientY - startY;

      if (!decided) {
        const axis = swipeAxis(dx, dy);
        if (axis === "pending") return;
        if (axis === "vertical") {
          // The reader is scrolling; the drawer stays out of it.
          stopTracking();
          return;
        }
        // Horizontal, but does it point the way the drawer needs to go?
        const opening = !openRef.current;
        if (opening ? dx <= 0 : dx >= 0) {
          stopTracking();
          return;
        }
        decided = true;
      }

      // From here the gesture is ours: stop the page panning and stop the
      // browser's own edge gesture from taking over.
      if (event.cancelable) event.preventDefault();

      if (swipeCommits(dx, !openRef.current)) {
        const wasOpen = openRef.current;
        stopTracking();
        if (wasOpen) closeCallback.current();
        else openCallback.current();
      }
    }

    function onStart(event: TouchEvent) {
      if (!mobile.matches || event.touches.length !== 1) return;

      const touch = event.touches[0];
      const target = event.target as Element | null;
      // Never hijack a dialog, a form control or a text selection.
      if (target?.closest('[role="dialog"], input, textarea, select')) return;

      // Closed: the gesture must begin at the edge. Open: anywhere is fine,
      // because the only thing a horizontal drag can do there is close.
      if (!openRef.current && touch.clientX > EDGE_ZONE) return;

      startX = touch.clientX;
      startY = touch.clientY;
      tracking = true;
      decided = false;

      // Non-passive, but only while a candidate is in flight — see the note
      // above about keeping normal scrolling on the browser's fast path.
      document.addEventListener("touchmove", onMove, { passive: false });
    }

    document.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchend", stopTracking, { passive: true });
    document.addEventListener("touchcancel", stopTracking, { passive: true });

    return () => {
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchend", stopTracking);
      document.removeEventListener("touchcancel", stopTracking);
      document.removeEventListener("touchmove", onMove);
    };
  }, [enabled]);
}
