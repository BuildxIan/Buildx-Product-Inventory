"use client";

import { useMemo, useState } from "react";
import Modal from "./Modal";
import type { Category } from "@/lib/types";
import { categoryLabel, hasSiblingNamed } from "@/lib/categories";

type Props = {
  categories: Category[];
  /**
   * Where the new category is filed, decided by the screen that opened the
   * dialog — never by the user:
   *   null  -> a new main category (opened from All products)
   *   <id>  -> a subcategory of that main category (opened inside it)
   *
   * There is deliberately no parent selector: the tree has two levels, so
   * there is nothing to choose.
   */
  parentId?: string | null;
  /** Return value is used by the callers to pre-select the new row. */
  onSave: (name: string, parentId: string | null) => Promise<unknown>;
  onClose: () => void;
};

// Category names are always stored uppercase; duplicates are rejected among
// siblings only, so the same name may exist under two different main categories.
export default function CategoryModal({ categories, parentId = null, onSave, onClose }: Props) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const parent = useMemo(
    () => (parentId ? categories.find((c) => c.id === parentId) ?? null : null),
    [categories, parentId]
  );
  const isSub = Boolean(parent);
  const parentPath = parent ? categoryLabel(categories, parent.id) : "";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = name.trim().toUpperCase();
    if (!value) {
      setError(isSub ? "Enter a subcategory name." : "Enter a category name.");
      return;
    }
    if (hasSiblingNamed(categories, parentId, value)) {
      setError(
        isSub
          ? `"${value}" already exists in ${parentPath}.`
          : `"${value}" already exists as a main category.`
      );
      return;
    }

    setBusy(true);
    setError("");
    try {
      await onSave(value, parentId);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the category.");
      setBusy(false);
    }
  }

  return (
    <Modal
      onClose={busy ? () => {} : onClose}
      title={isSub ? "New subcategory" : "New category"}
      subtitle={isSub ? `Under ${parentPath}` : undefined}
    >
      <form onSubmit={submit} className="space-y-4 p-4 lg:p-5">
        <div>
          <label className="label" htmlFor="category-name">
            {isSub ? "Subcategory name" : "Category name"}
          </label>
          <input
            id="category-name"
            autoFocus
            className="input uppercase"
            placeholder={isSub ? "e.g. CEMENT" : "e.g. TILES"}
            value={name}
            onChange={(e) => {
              setName(e.target.value.toUpperCase());
              if (error) setError("");
            }}
          />
          <p className="mt-1.5 text-xs text-ink-faint">Saved in capital letters, e.g. BATHROOM FIXTURES.</p>
        </div>

        {/* The parent is stated, not offered — it is whatever the user is
            browsing. That is what keeps the tree at two levels by construction. */}
        <div className="rounded border border-ink-line bg-surface-alt px-3 py-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-faint">
            {isSub ? "Parent category" : "Level"}
          </p>
          <p className="mt-0.5 text-sm font-semibold uppercase text-ink">
            {isSub ? parentPath : "Main category"}
          </p>
        </div>

        {error && (
          <p className="rounded border border-danger/25 bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>
        )}

        <div className="flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button className="btn-primary" disabled={busy}>
            {busy ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
