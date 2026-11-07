"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

type Props = {
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  wide?: boolean;
  size?: "sm" | "md" | "lg";
  /** Optional small line under the title (e.g. a category or shop). */
  subtitle?: string;
  /** Edge-to-edge sheet on phones; reverts to a centred dialog from `sm` up. */
  mobileFullScreen?: boolean;
};

const SIZES = { sm: "sm:max-w-md", md: "sm:max-w-2xl", lg: "sm:max-w-4xl" };

// Only the top-most modal answers Escape, so a dialog opened from inside another
// dialog (e.g. "New category" from the product form) doesn't dismiss both.
const openModals: symbol[] = [];

// Blurred backdrop; clicking the backdrop or pressing Esc closes it.
// Rendered in a portal: the parent dialog panel is animated with a transform,
// which would otherwise become the containing block for `fixed` and trap a
// nested dialog inside it.
export default function Modal({ onClose, children, title, wide, size, subtitle, mobileFullScreen }: Props) {
  useEffect(() => {
    const id = Symbol("modal");
    openModals.push(id);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && openModals[openModals.length - 1] === id) onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      const i = openModals.indexOf(id);
      if (i !== -1) openModals.splice(i, 1);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  if (typeof document === "undefined") return null;

  // Built conditionally rather than overridden, so conflicting radius/border
  // utilities never end up in the same class list.
  const panelShape = mobileFullScreen
    ? "h-[100dvh] max-h-[100dvh] rounded-none border-0 sm:h-auto sm:max-h-[92vh] sm:rounded-xl sm:border"
    : "max-h-[92vh] rounded-t-2xl border sm:rounded-xl";

  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex animate-fade justify-center bg-black/55 p-0 backdrop-blur-[3px] [perspective:1400px] sm:items-center sm:p-4 ${
        mobileFullScreen ? "items-stretch" : "items-end"
      }`}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={`relative w-full animate-pop overflow-y-auto border-ink-line bg-surface shadow-modal ${panelShape} ${
          size ? SIZES[size] : wide ? SIZES.lg : SIZES.sm
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-ink-line bg-surface px-4 py-3.5 lg:px-5">
            <div className="min-w-0">
              <h2 className="font-display text-lg font-bold uppercase tracking-wide leading-tight text-ink">
                {title}
              </h2>
              {subtitle && <p className="mt-0.5 truncate text-xs text-ink-faint">{subtitle}</p>}
            </div>
            <button
              className="icon-btn -mr-1 shrink-0"
              onClick={onClose}
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        )}
        {!title && (
          <button
            className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border border-ink-line bg-surface/95 text-ink-soft shadow-panel transition-colors hover:bg-surface hover:text-ink"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        )}
        {children}
      </div>
    </div>,
    document.body
  );
}
