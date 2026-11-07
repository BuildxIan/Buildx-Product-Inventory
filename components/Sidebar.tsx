"use client";

import { useState } from "react";
import { Check, Layers, Pencil, Plus, Trash2 } from "lucide-react";
import type { Category } from "@/lib/types";
import CategoryModal from "./CategoryModal";

type Props = {
  categories: Category[];
  counts: Record<string, number>;
  total: number;
  selectedId: string | null; // null = all products
  isAdmin: boolean;
  open: boolean; // drawer state on mobile, visibility on desktop
  onSelect: (id: string | null) => void;
  onClose: () => void;
  onAdd: (name: string) => Promise<Category | null>;
  onRename: (id: string, name: string) => Promise<void>;
  onDelete: (category: Category) => void;
};

export default function Sidebar({
  categories,
  counts,
  total,
  selectedId,
  isAdmin,
  open,
  onSelect,
  onClose,
  onAdd,
  onRename,
  onDelete,
}: Props) {
  const [editMode, setEditMode] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renameError, setRenameError] = useState("");

  async function submitRename(id: string) {
    const name = renameValue.trim().toUpperCase();
    if (!name) {
      setRenameError("Name can't be empty.");
      return;
    }
    if (categories.some((c) => c.id !== id && c.name.trim().toUpperCase() === name)) {
      setRenameError("That category already exists.");
      return;
    }
    try {
      await onRename(id, name);
      setRenamingId(null);
      setRenameError("");
    } catch (err) {
      setRenameError(err instanceof Error ? err.message : "Rename failed.");
    }
  }

  function startRename(c: Category) {
    setRenamingId(c.id);
    setRenameValue(c.name.toUpperCase());
    setRenameError("");
  }

  const rowBase =
    "relative flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm transition-colors duration-150 lg:gap-2.5 lg:px-3.5 lg:py-2.5 lg:text-[15px]";

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div className="fixed inset-0 z-30 bg-black/45 backdrop-blur-[2px] md:hidden" onClick={onClose} />
      )}

      <aside
        id="category-sidebar"
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-ink-line bg-surface shadow-rail transition-transform duration-200 md:static md:z-auto md:shrink-0 md:transition-[margin] lg:w-80 ${
          open ? "translate-x-0 md:ml-0" : "-translate-x-full md:-ml-72 lg:-ml-80"
        }`}
      >
        {/* Brand — the app title is the lockup, not text. Two assets swap with
            the theme: the navy construction mark on light surfaces, the
            white/orange transparent mark on dark ones. Both are transparent
            PNGs, so they sit directly on the surface with no plate. */}
        <div className="flex items-center border-b border-ink-line px-3 py-3 lg:px-4 lg:py-3.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/BuildX_Logo_Light.png"
            alt="BuildX Product Catalog"
            width={1912}
            height={648}
            className="h-10 w-auto dark:hidden lg:h-11"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/BuildX_Logo_Dark.png"
            alt="BuildX Product Catalog"
            width={1958}
            height={670}
            className="hidden h-10 w-auto dark:block lg:h-11"
          />
        </div>

        {/* Section label and the category tools that used to live in the bar. */}
        <div className="flex items-center gap-1 border-b border-ink-line px-2 py-2 lg:px-3">
          <h2 className="flex-1 px-1 text-[11px] font-bold uppercase tracking-[0.16em] text-ink-soft lg:px-2 lg:text-xs">
            Categories
          </h2>
          {isAdmin && (
            <button
              className="icon-btn h-8 w-8 lg:h-9 lg:w-9"
              onClick={() => setShowAdd(true)}
              aria-label="Add category"
              title="Add category"
            >
              <Plus size={17} />
            </button>
          )}
          {isAdmin && (
            <button
              className={`icon-btn h-8 w-8 lg:h-9 lg:w-9 ${
                editMode ? "bg-ink/10 text-ink" : ""
              }`}
              onClick={() => {
                setEditMode((v) => !v);
                setRenamingId(null);
                setRenameError("");
              }}
              aria-label="Edit categories"
              title="Edit categories"
            >
              <Pencil size={16} />
            </button>
          )}
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto p-2 lg:space-y-1 lg:p-2.5">
          <button
            onClick={() => {
              onSelect(null);
              if (window.innerWidth < 768) onClose();
            }}
            className={`${rowBase} ${
              selectedId === null
                ? "bg-surface-alt font-semibold text-ink"
                : "text-ink-soft hover:bg-surface-alt hover:text-ink"
            }`}
          >
            {selectedId === null && (
              <span className="absolute inset-y-1.5 left-0 w-[3px] rounded-r-full bg-accent" />
            )}
            <Layers size={16} className="shrink-0" />
            <span className="flex-1 truncate">All products</span>
            <span className="text-[11px] font-medium tabular-nums text-ink-faint">{total}</span>
          </button>

          <div className="my-1.5 h-px bg-ink-line/70 lg:my-2" />

          {categories.map((c) => (
            <div key={c.id} className="group flex items-center gap-1">
              {renamingId === c.id ? (
                <div className="w-full">
                  <div className="flex w-full items-center gap-1">
                    <input
                      autoFocus
                      className="input py-1.5 uppercase"
                      value={renameValue}
                      onChange={(e) => {
                        setRenameValue(e.target.value.toUpperCase());
                        if (renameError) setRenameError("");
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") submitRename(c.id);
                        if (e.key === "Escape") {
                          setRenamingId(null);
                          setRenameError("");
                        }
                      }}
                    />
                    <button
                      className="icon-btn shrink-0 text-emerald-600 dark:text-emerald-400"
                      onClick={() => submitRename(c.id)}
                      aria-label="Save"
                    >
                      <Check size={17} />
                    </button>
                  </div>
                  {renameError && <p className="px-1 pt-1 text-[11px] text-danger">{renameError}</p>}
                </div>
              ) : (
                <>
                  <button
                    onClick={() => {
                      onSelect(c.id);
                      if (window.innerWidth < 768) onClose();
                    }}
                    className={`${rowBase} ${
                      selectedId === c.id
                        ? "bg-surface-alt text-ink"
                        : "text-ink-soft hover:bg-surface-alt hover:text-ink"
                    }`}
                  >
                    {selectedId === c.id && (
                      <span className="absolute inset-y-1.5 left-0 w-[3px] rounded-r-full bg-accent" />
                    )}
                    <span
                      className={`flex-1 truncate text-[12.5px] uppercase tracking-[0.04em] lg:text-[13.5px] ${
                        selectedId === c.id ? "font-bold" : "font-semibold"
                      }`}
                    >
                      {c.name}
                    </span>
                    <span className="text-[11px] font-medium tabular-nums text-ink-faint">
                      {counts[c.id] ?? 0}
                    </span>
                  </button>
                  {editMode && (
                    <>
                      <button
                        className="icon-btn shrink-0"
                        onClick={() => startRename(c)}
                        aria-label={`Rename ${c.name}`}
                        title="Rename"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        className="icon-btn shrink-0 text-danger hover:bg-danger-soft"
                        onClick={() => onDelete(c)}
                        aria-label={`Delete ${c.name}`}
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          ))}

          {categories.length === 0 && (
            <p className="px-3 py-6 text-center text-xs text-ink-faint">No categories yet.</p>
          )}
        </nav>
      </aside>

      {/* The collapse/expand control now lives in the page header (see CatalogApp). */}

      {showAdd && (
        <CategoryModal categories={categories} onSave={onAdd} onClose={() => setShowAdd(false)} />
      )}
    </>
  );
}
