"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Plus, Store, X } from "lucide-react";
import type { Shop } from "@/lib/types";

type Props = {
  shops: Shop[];
  /** Product count per shop id, shown as a hint next to each name. */
  counts: Record<string, number>;
  total: number;
  value: string; // "" = all shops
  onChange: (id: string) => void;
  isAdmin: boolean;
  /** Opens the delete confirmation. The dropdown deliberately stays open. */
  onDelete: (shop: Shop) => void;
  onAdd: () => void;
};

/**
 * Custom shop filter. A native <select> can't hold a delete button per option,
 * so this renders its own list: one row per shop with an X on the right, plus
 * an "Add new shop" action at the bottom.
 */
export default function ShopFilter({
  shops,
  counts,
  total,
  value,
  onChange,
  isAdmin,
  onDelete,
  onAdd,
}: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const current = shops.find((s) => s.id === value);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement | null;
      // Interactions inside a dialog (the delete confirmation) must not dismiss
      // the list — it should still be there if the user cancels.
      if (target?.closest('[role="dialog"]')) return;
      if (!wrapRef.current?.contains(target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative w-full shrink-0 lg:w-48">
      <button
        type="button"
        className={`flex h-10 w-full items-center gap-2 rounded border bg-surface pl-3 pr-8 text-left text-sm transition-colors lg:h-11 lg:text-[15px] ${
          open ? "border-ink ring-2 ring-ink/10" : "border-ink-line hover:border-ink-mist"
        } ${current ? "text-ink" : "text-ink-soft"}`}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Filter by shop"
      >
        <Store size={14} className="shrink-0 text-ink-faint" />
        <span className="min-w-0 flex-1 truncate">{current ? current.name : "All shops"}</span>
      </button>
      <ChevronDown
        size={15}
        className={`pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-faint transition-transform duration-150 ${
          open ? "rotate-180" : ""
        }`}
      />

      {open && (
        <div
          className="absolute left-0 right-0 z-40 mt-1 animate-fade overflow-hidden rounded-md border border-ink-line bg-surface shadow-lift sm:left-auto sm:w-64"
          role="listbox"
          aria-label="Shops"
        >
          <div className="max-h-[min(58vh,300px)] overflow-y-auto py-1">
            <button
              type="button"
              role="option"
              aria-selected={value === ""}
              className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors hover:bg-surface-alt ${
                value === "" ? "bg-surface-alt font-semibold text-ink" : "text-ink-soft"
              }`}
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
            >
              <span className="w-4 shrink-0">{value === "" && <Check size={14} className="text-accent" />}</span>
              <span className="flex-1 truncate">All shops</span>
              <span className="shrink-0 text-[11px] font-medium tabular-nums text-ink-faint">{total}</span>
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
                    className={`flex min-w-0 flex-1 items-center gap-2 rounded px-3 py-2.5 text-left text-sm transition-colors hover:bg-surface-alt ${
                      selected ? "bg-surface-alt font-semibold text-ink" : "text-ink-soft"
                    }`}
                    onClick={() => {
                      onChange(s.id);
                      setOpen(false);
                    }}
                  >
                    <span className="w-4 shrink-0">{selected && <Check size={14} className="text-accent" />}</span>
                    <span className="min-w-0 flex-1 truncate">{s.name}</span>
                    <span className="shrink-0 text-[11px] font-medium tabular-nums text-ink-faint">
                      {counts[s.id] ?? 0}
                    </span>
                  </button>

                  {isAdmin && (
                    <button
                      type="button"
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded text-ink-faint transition-colors hover:bg-danger-soft hover:text-danger sm:h-9 sm:w-9"
                      // Never let the click fall through to the row or the backdrop:
                      // the shop must not be selected, and the list must stay open
                      // until the confirmation is answered.
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
                  )}
                </div>
              );
            })}

            {shops.length === 0 && <p className="px-3 py-3 text-xs text-ink-faint">No shops yet.</p>}
          </div>

          {/* Pinned below the scroll area so it stays reachable with a long list. */}
          {isAdmin && (
            <button
              type="button"
              className="flex w-full items-center gap-2 border-t border-ink-line px-3 py-3 text-left text-sm font-semibold text-accent-deep transition-colors hover:bg-surface-alt"
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
          )}
        </div>
      )}
    </div>
  );
}
