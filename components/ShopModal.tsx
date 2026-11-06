"use client";

import { useState } from "react";
import { Store } from "lucide-react";
import Modal from "./Modal";
import type { Shop } from "@/lib/types";

type Props = {
  shops: Shop[];
  /** Creates the shop and returns the new row so the caller can select it. */
  onSave: (name: string) => Promise<Shop | null>;
  onClose: () => void;
};

/** Normalises a typed name: no leading/trailing space, no doubled spaces. */
export const cleanShopName = (raw: string) => raw.trim().replace(/\s+/g, " ");

export default function ShopModal({ shops, onSave, onClose }: Props) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = cleanShopName(name);

    if (!value) {
      setError("Enter a shop name.");
      return;
    }
    if (shops.some((s) => s.name.trim().toLowerCase() === value.toLowerCase())) {
      setError(`"${value}" already exists.`);
      return;
    }

    setBusy(true);
    setError("");
    try {
      await onSave(value);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the shop.");
      setBusy(false);
    }
  }

  return (
    <Modal onClose={busy ? () => {} : onClose} title="New shop">
      <form onSubmit={submit} className="space-y-4 p-4 lg:p-5">
        <div>
          <label className="label" htmlFor="shop-name">
            Shop name
          </label>
          <div className="relative">
            <Store
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
            />
            <input
              id="shop-name"
              autoFocus
              className="input pl-9"
              placeholder="e.g. Metro Tile Depot"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError("");
              }}
            />
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-ink-faint">
            Spaces are trimmed automatically. Duplicate names are not allowed — letter case is ignored.
          </p>
        </div>

        {error && (
          <p role="alert" className="rounded border border-danger/25 bg-danger-soft px-3 py-2 text-sm text-danger">
            {error}
          </p>
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
