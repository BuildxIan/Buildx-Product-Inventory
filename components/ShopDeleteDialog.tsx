"use client";

import { useState } from "react";
import { AlertTriangle, ArrowRight } from "lucide-react";
import Modal from "./Modal";
import type { Shop } from "@/lib/types";

type Props = {
  shop: Shop;
  /** How many products currently point at this shop. */
  productCount: number;
  /** Every other shop — the places affected products can move to. */
  otherShops: Shop[];
  onConfirm: (reassignTo: string | null) => Promise<void>;
  onCancel: () => void;
};

/**
 * Deleting a shop never deletes products. The FK is `on delete set null`, so
 * they would quietly become unassigned — instead we ask first and move them
 * explicitly, either to another shop or to "No shop".
 */
export default function ShopDeleteDialog({
  shop,
  productCount,
  otherShops,
  onConfirm,
  onCancel,
}: Props) {
  const [reassignTo, setReassignTo] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function confirm() {
    setBusy(true);
    setError("");
    try {
      await onConfirm(reassignTo || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the shop.");
      setBusy(false);
    }
  }

  return (
    <Modal onClose={busy ? () => {} : onCancel}>
      <div className="p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-danger-soft text-danger">
            <AlertTriangle size={19} />
          </span>
          <div className="min-w-0 flex-1 pt-0.5">
            <h2 className="font-display text-lg font-bold uppercase leading-tight tracking-wide text-ink">
              Delete shop?
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
              Are you sure you want to remove this shop? Please note that products assigned to this shop may be
              affected.
            </p>
            <p className="mt-2 text-[13px] font-semibold text-ink">&ldquo;{shop.name}&rdquo;</p>
          </div>
        </div>

        {productCount > 0 ? (
          <div className="mt-4 rounded border border-ink-line bg-canvas p-3">
            <p className="flex items-start gap-2 text-[13px] leading-relaxed text-ink-soft">
              <ArrowRight size={14} className="mt-0.5 shrink-0 text-ink-faint" />
              <span>
                <strong className="font-semibold text-ink">
                  {productCount} product{productCount === 1 ? "" : "s"}
                </strong>{" "}
                will not be deleted. They will be moved to the shop you choose below.
              </span>
            </p>
            <label className="label mt-3" htmlFor="reassign-shop">
              Move them to
            </label>
            <select
              id="reassign-shop"
              className="input"
              value={reassignTo}
              onChange={(e) => setReassignTo(e.target.value)}
              disabled={busy}
            >
              <option value="">No shop (unassigned)</option>
              {otherShops.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <p className="mt-4 rounded border border-ink-line bg-canvas px-3 py-2.5 text-[13px] leading-relaxed text-ink-soft">
            No products use this shop, so nothing else changes.
          </p>
        )}

        {error && (
          <p role="alert" className="mt-3 rounded border border-danger/25 bg-danger-soft px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-ghost" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button className="btn-danger" onClick={confirm} disabled={busy} autoFocus>
            {busy ? "Deleting..." : "Delete shop"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
