"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Plus, X } from "lucide-react";
import type { Shop } from "@/lib/types";

type Props = {
  shops: Shop[];
  /** "" = no shop */
  value: string;
  onChange: (id: string) => void;
  /** Opens the shared delete confirmation. The list stays open behind it. */
  onDelete: (shop: Shop) => void;
  onAdd: () => void;
  disabled?: boolean;
};

/**
 * Shop picker for the product form. A native <select> can't hold a delete
 * button per row, so this mirrors the navbar dropdown: name on the left, X on
 * the right, "Add new shop" pinned at the bottom.
 */
export default function ShopSelect({ shops, value, onChange, onDelete, onAdd, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);
  const current = shops.find((s) => s.id === value);

  // Long shop lists can hide the current choice below the fold; bring it into
  // view without scrolling the form behind it.
  useEffect(() => {
    if (!open) return;
    const list = listRef.current;
    const el = selectedRef.current;
    if (!list || !el) return;
    const listRect = list.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    if (elRect.top < listRect.top) list.scrollTop -= listRect.top - elRect.top + 8;
    else if (elRect.bottom > listRect.bottom) list.scrollTop += elRect.bottom - listRect.bottom + 8;
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (wrapRef.current?.contains(target)) return;

      // A dialog opened from this dropdown (confirm / new shop) renders outside
      // the form, so leave the list alone until that dialog is answered.
      const ownDialog = wrapRef.current?.closest('[role="dialog"]');
      if (ownDialog && !ownDialog.contains(target)) return;

      setOpen(false);
    };
    // Capture phase, so Escape closes the list without also closing the form
    // dialog behind it. A dialog opened on top keeps its own Escape handling.
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (document.querySelectorAll('[role="dialog"]').length > 1) return;
      e.stopPropagation();
      setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    window.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      window.removeEventListener("keydown", onKey, true);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        className={`input flex items-center justify-between gap-2 text-left uppercase ${
          open ? "border-ink ring-2 ring-ink/10" : ""
        }`}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Shop"
      >
        <span className="min-w-0 flex-1 truncate">{current ? current.name : "No shop"}</span>
        <ChevronDown
          size={15}
          className={`shrink-0 text-ink-faint transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          className="absolute left-0 right-0 z-30 mt-1 animate-fade overflow-hidden rounded-md border border-ink-line bg-white shadow-lift"
          role="listbox"
          aria-label="Shops"
        >
          <div ref={listRef} className="max-h-[min(45vh,240px)] overflow-y-auto overscroll-contain py-1">
            <button
              type="button"
              role="option"
              aria-selected={value === ""}
              className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm uppercase text-ink transition-colors hover:bg-canvas ${
                value === "" ? "bg-surface-alt" : ""
              }`}
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
            >
              <span className="w-4 shrink-0">{value === "" && <Check size={14} className="text-accent" />}</span>
              <span className="flex-1 truncate">No shop</span>
            </button>

            {shops.length > 0 && <div className="my-1 h-px bg-ink-line/70" />}

            {shops.map((s) => {
              const selected = value === s.id;
              return (
                <div key={s.id} className="flex items-center gap-0.5 pr-1">
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    ref={selected ? selectedRef : undefined}
                    className={`flex min-w-0 flex-1 items-center gap-2 rounded px-3 py-2.5 text-left text-sm uppercase text-ink transition-colors hover:bg-canvas ${
                      selected ? "bg-surface-alt" : ""
                    }`}
                    onClick={() => {
                      onChange(s.id);
                      setOpen(false);
                    }}
                  >
                    <span className="w-4 shrink-0">{selected && <Check size={14} className="text-accent" />}</span>
                    <span className="min-w-0 flex-1 truncate">{s.name}</span>
                  </button>

                  <button
                    type="button"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded text-ink-faint transition-colors hover:bg-danger-soft hover:text-danger sm:h-9 sm:w-9"
                    // The X must never fall through to the row (which would select
                    // the shop) and must not close the list before confirmation.
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onDelete(s);
                    }}
                    aria-label={`Delete ${s.name}`}
                    title={`Delete ${s.name}`}
                  >
                    <X size={15} />
                  </button>
                </div>
              );
            })}

            {shops.length === 0 && <p className="px-3 py-3 text-xs text-ink-faint">No shops yet.</p>}
          </div>

          <button
            type="button"
            className="flex w-full items-center gap-2 border-t border-ink-line px-3 py-3 text-left text-sm uppercase text-ink transition-colors hover:bg-canvas"
            onClick={() => {
              setOpen(false);
              onAdd();
            }}
          >
            <span className="flex w-4 shrink-0 justify-center">
              <Plus size={14} />
            </span>
            Add new shop
          </button>
        </div>
      )}
    </div>
  );
}
