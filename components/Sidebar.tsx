"use client";

import { useMemo, useState } from "react";
import { Check, ChevronRight, Layers, Pencil, Plus, Trash2, X } from "lucide-react";
import type { Category } from "@/lib/types";
import { buildCategoryTree, hasSiblingNamed, isMainCategory } from "@/lib/categories";
import CategoryModal from "./CategoryModal";

type Props = {
  categories: Category[];
  counts: Record<string, number>;
  total: number;
  selectedId: string | null; // null = all products
  isAdmin: boolean;
  open: boolean; // drawer state on mobile, visibility on desktop
  /** False until `categories.parent_id` exists — subcategories are then unavailable. */
  parentEnabled: boolean;
  onSelect: (id: string | null) => void;
  onClose: () => void;
  /** `parentId` null = main category; an id = subcategory of that main category. */
  onAdd: (name: string, parentId: string | null) => Promise<Category | null>;
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
  parentEnabled,
  onSelect,
  onClose,
  onAdd,
  onRename,
  onDelete,
}: Props) {
  const [editMode, setEditMode] = useState(false);
  /** Which parent the "new category" dialog opens with: null = main category. */
  const [addParent, setAddParent] = useState<{ parentId: string | null } | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renameError, setRenameError] = useState("");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const tree = useMemo(() => buildCategoryTree(categories), [categories]);

  const selected = selectedId ? categories.find((c) => c.id === selectedId) ?? null : null;
  // A subcategory cannot hold categories, so the action only exists one level up.
  const selectedIsMain = selected ? isMainCategory(categories, selected) : false;
  const canAddSubcategory = Boolean(selected && selectedIsMain && parentEnabled);

  /**
   * A main category counts the products of its whole branch; a subcategory
   * counts only its own.
   */
  const displayedCount = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const node of tree) {
      const own = counts[node.category.id] ?? 0;
      totals[node.category.id] = node.children.reduce(
        (sum, child) => sum + (counts[child.category.id] ?? 0),
        own
      );
      for (const child of node.children) totals[child.category.id] = counts[child.category.id] ?? 0;
    }
    return totals;
  }, [tree, counts]);

  async function submitRename(category: Category) {
    const name = renameValue.trim().toUpperCase();
    if (!name) {
      setRenameError("Name can't be empty.");
      return;
    }
    // Duplicates only matter among siblings: CEMENT may exist under two mains.
    if (hasSiblingNamed(categories, category.parent_id ?? null, name, category.id)) {
      setRenameError("That category already exists here.");
      return;
    }
    try {
      await onRename(category.id, name);
      setRenamingId(null);
      setRenameError("");
    } catch (err) {
      setRenameError(err instanceof Error ? err.message : "Rename failed.");
    }
  }

  function startRename(category: Category) {
    setRenamingId(category.id);
    setRenameValue(category.name.toUpperCase());
    setRenameError("");
  }

  function toggle(categoryId: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) next.delete(categoryId);
      else next.add(categoryId);
      return next;
    });
  }

  function expand(categoryId: string) {
    setCollapsed((prev) => {
      if (!prev.has(categoryId)) return prev;
      const next = new Set(prev);
      next.delete(categoryId);
      return next;
    });
  }

  /** Reveal a freshly created subcategory even if its parent was collapsed. */
  function reveal(parentId: string) {
    expand(parentId);
  }

  function openAdd(parentId: string | null) {
    setAddParent({ parentId });
  }

  const rowBase =
    "relative flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm transition-colors duration-150 lg:gap-2.5 lg:px-3.5 lg:py-2.5 lg:text-[15px]";

  const closeOnMobile = () => {
    if (window.innerWidth < 768) onClose();
  };

  /**
   * Main categories are the orange tier; subcategories keep the neutral ink.
   * `accent-deep` is the readable orange — it is #C2410C on the light surface
   * (5.2:1 against white, 4.6:1 against the selected `surface-alt`) and
   * lightens to #FF9458 in dark mode, where it clears 7.9:1. The raw
   * `accent` token is a fill colour and would only reach 3.1:1 as text.
   * Declared on the label itself so it wins over the row's inherited
   * `text-ink` / `text-ink-soft` and stays put across hover, selection and
   * expand/collapse — those still signal through the row background.
   */
  const mainTierText = "text-accent-deep";

  /** One row. `level` 0 = main category, 1 = subcategory (the deepest level). */
  function renderRow(category: Category, level: number) {
    const isSelected = selectedId === category.id;
    const isMain = level === 0;
    const node = tree.find((n) => n.category.id === category.id);
    const hasChildren = isMain && Boolean(node?.children.length);
    const isOpen = !collapsed.has(category.id);

    if (renamingId === category.id) {
      return (
        <div key={category.id} className="flex items-center gap-1">
          <input
            autoFocus
            className="input py-1.5 uppercase"
            value={renameValue}
            onChange={(e) => {
              setRenameValue(e.target.value.toUpperCase());
              if (renameError) setRenameError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitRename(category);
              if (e.key === "Escape") {
                setRenamingId(null);
                setRenameError("");
              }
            }}
          />
          <button
            className="icon-btn shrink-0 text-emerald-600 dark:text-emerald-400"
            onClick={() => submitRename(category)}
            aria-label="Save"
          >
            <Check size={17} />
          </button>
          {renameError && <p className="px-1 pt-1 text-[11px] text-danger">{renameError}</p>}
        </div>
      );
    }

    return (
      <div key={category.id} className="group flex items-center gap-1">
        {isMain &&
          (hasChildren ? (
            <button
              type="button"
              onClick={() => toggle(category.id)}
              className={`flex h-7 w-5 shrink-0 items-center justify-center rounded transition-colors hover:bg-surface-alt ${mainTierText}`}
              aria-label={isOpen ? `Collapse ${category.name}` : `Expand ${category.name}`}
              aria-expanded={isOpen}
            >
              <ChevronRight
                size={13}
                strokeWidth={2.4}
                className={`transition-transform duration-150 ${isOpen ? "rotate-90" : ""}`}
              />
            </button>
          ) : (
            // Keeps a childless main category aligned with the others.
            <span className="w-5 shrink-0" aria-hidden />
          ))}

        <button
          onClick={() => {
            if (isMain) {
              // First click opens the branch; clicking the selected main again
              // folds it back up. Selecting never closes the mobile drawer —
              // the subcategories have to stay reachable.
              if (isSelected) toggle(category.id);
              else {
                onSelect(category.id);
                expand(category.id);
              }
              return;
            }
            onSelect(category.id);
            closeOnMobile();
          }}
          className={`${rowBase} ${
            isSelected ? "bg-surface-alt text-ink" : "text-ink-soft hover:bg-surface-alt hover:text-ink"
          }`}
        >
          {isSelected && <span className="absolute inset-y-1.5 left-0 w-[3px] rounded-r-full bg-accent" />}
          <span
            className={`flex-1 truncate uppercase tracking-[0.04em] ${
              isMain ? `text-[12.5px] lg:text-[13.5px] ${mainTierText}` : "text-[11.5px] lg:text-[12.5px]"
            } ${isSelected ? "font-bold" : "font-semibold"}`}
          >
            {category.name}
          </span>
          <span className="text-[11px] font-medium tabular-nums text-ink-faint">
            {displayedCount[category.id] ?? 0}
          </span>
        </button>

        {/* Delete exists on subcategories only: always visible on touch, revealed
            on hover for pointer devices (see .subcategory-delete). */}
        {!isMain && !editMode && (
          <button
            type="button"
            onClick={() => onDelete(category)}
            className="subcategory-delete mr-1 flex h-7 w-7 shrink-0 items-center justify-center rounded text-ink-faint transition-colors hover:bg-danger-soft hover:text-danger"
            aria-label={`Delete subcategory ${category.name}`}
            title="Delete subcategory"
          >
            <X size={13} strokeWidth={2.4} />
          </button>
        )}

        {editMode && (
          <>
            <button
              className="icon-btn shrink-0"
              onClick={() => startRename(category)}
              aria-label={`Rename ${category.name}`}
              title="Rename"
            >
              <Pencil size={14} />
            </button>
            <button
              className="icon-btn shrink-0 text-danger hover:bg-danger-soft"
              onClick={() => onDelete(category)}
              aria-label={`Delete ${category.name}`}
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          </>
        )}
      </div>
    );
  }

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
          {/* The drawer covers the header toggle while it is open, so the close
              control travels with it. Phones and tablets only. */}
          <button
            type="button"
            onClick={onClose}
            className="icon-btn ml-auto h-9 w-9 shrink-0 md:hidden"
            aria-label="Close categories"
            title="Close categories"
          >
            <X size={18} />
          </button>
        </div>

        {/* Section label and the category tools that used to live in the bar. */}
        <div className="flex items-center gap-1 border-b border-ink-line px-2 py-2 lg:px-3">
          <h2 className="flex-1 px-1 text-[11px] font-bold uppercase tracking-[0.16em] text-ink-soft lg:px-2 lg:text-xs">
            Categories
          </h2>
          {isAdmin && (
            <button
              className="icon-btn h-8 w-8 lg:h-9 lg:w-9"
              // Inside a main category "+" adds a subcategory; anywhere else it
              // adds a main category. A subcategory never gets a child.
              onClick={() => openAdd(canAddSubcategory ? selectedId : null)}
              aria-label={canAddSubcategory ? "Add subcategory" : "Add category"}
              title={canAddSubcategory ? "Add subcategory" : "Add category"}
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
              closeOnMobile();
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
            <Layers size={16} className={`shrink-0 ${mainTierText}`} />
            <span className={`flex-1 truncate ${mainTierText}`}>All products</span>
            <span className="text-[11px] font-medium tabular-nums text-ink-faint">{total}</span>
          </button>

          <div className="my-1.5 h-px bg-ink-line/70 lg:my-2" />

          {tree.map((node) => {
            const isSelectedMain = selectedId === node.category.id;
            const isOpen = !collapsed.has(node.category.id);

            return (
              <div key={node.category.id}>
                {renderRow(node.category, 0)}

                {/* Immediate subcategories only — the tree never goes deeper. */}
                {isOpen && node.children.length > 0 && (
                  <div className="ml-3 mt-0.5 space-y-0.5 border-l border-ink-line/70 pl-3">
                    {node.children.map((child) => renderRow(child.category, 1))}
                  </div>
                )}

                {isSelectedMain && isAdmin && parentEnabled && (
                  <button
                    type="button"
                    onClick={() => openAdd(node.category.id)}
                    className="mb-0.5 mt-1 ml-8 flex w-[calc(100%-2rem)] items-center gap-1.5 rounded border border-dashed border-ink-mist px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-faint transition-colors hover:border-ink hover:text-ink"
                  >
                    <Plus size={12} strokeWidth={2.6} />
                    Add subcategory
                  </button>
                )}
              </div>
            );
          })}

          {categories.length === 0 && (
            <p className="px-3 py-6 text-center text-xs text-ink-faint">No categories yet.</p>
          )}
        </nav>
      </aside>

      {/* The collapse/expand control now lives in the navbar (see Navbar). */}

      {addParent && (
        <CategoryModal
          categories={categories}
          parentId={addParent.parentId}
          onSave={async (name, parentId) => {
            const created = await onAdd(name, parentId);
            if (created?.parent_id) reveal(created.parent_id);
            return created;
          }}
          onClose={() => setAddParent(null)}
        />
      )}
    </>
  );
}
