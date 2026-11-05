"use client";

import { useState } from "react";
import Modal from "./Modal";
import type { Category } from "@/lib/types";

type Props = {
  categories: Category[];
  /** Return value is ignored here; the product form uses it to pre-select the new row. */
  onSave: (name: string) => Promise<unknown>;
  onClose: () => void;
};

// Category names are always stored uppercase; duplicates are rejected ignoring case.
export default function CategoryModal({ categories, onSave, onClose }: Props) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = name.trim().toUpperCase();
    if (!value) {
      setError("Enter a category name.");
      return;
    }
    if (categories.some((c) => c.name.trim().toUpperCase() === value)) {
      setError(`"${value}" already exists.`);
      return;
    }

    setBusy(true);
    setError("");
    try {
      await onSave(value);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the category.");
      setBusy(false);
    }
  }

  return (
    <Modal onClose={busy ? () => {} : onClose} title="New category">
      <form onSubmit={submit} className="space-y-4 p-4 lg:p-5">
        <div>
          <label className="label" htmlFor="category-name">
            Category name
          </label>
          <input
            id="category-name"
            autoFocus
            className="input uppercase"
            placeholder="e.g. TILES"
            value={name}
            onChange={(e) => {
              setName(e.target.value.toUpperCase());
              if (error) setError("");
            }}
          />
          <p className="mt-1.5 text-xs text-ink-faint">Saved in capital letters, e.g. BATHROOM FIXTURES.</p>
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
