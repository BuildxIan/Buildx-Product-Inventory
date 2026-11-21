"use client";

import { useState } from "react";
import { Phone, Store } from "lucide-react";
import Modal from "./Modal";
import type { Shop } from "@/lib/types";
import { formatMobile, isValidMobile } from "@/lib/phone";

type Props = {
  /** An existing shop means "edit its settings"; omit it to create a new one. */
  shop?: Shop;
  shops: Shop[];
  /** False until `shops.mobile` exists — the field is then disabled with a hint. */
  mobileEnabled?: boolean;
  /**
   * Saves the shop and returns the row so the caller can select it. `mobile` is
   * always the raw typed value; the write path normalises and stores it once.
   */
  onSave: (name: string, mobile: string) => Promise<Shop | null>;
  onClose: () => void;
};

/** Normalises a typed name: no leading/trailing space, no doubled spaces. */
export const cleanShopName = (raw: string) => raw.trim().replace(/\s+/g, " ");

/**
 * One dialog for both creating a shop and editing its settings. The contact
 * number lives here because it belongs to the shop: saving it here is what
 * changes the number shown on every product of that shop.
 */
export default function ShopModal({ shop, shops, mobileEnabled = true, onSave, onClose }: Props) {
  const editing = Boolean(shop);
  const [name, setName] = useState(shop?.name ?? "");
  // Stored as E.164; shown the way people read it, so a save without edits is a no-op.
  const [mobile, setMobile] = useState(shop?.mobile ? formatMobile(shop.mobile) : "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = cleanShopName(name);
    const phone = mobile.trim();

    if (!value) {
      setError("Enter a shop name.");
      return;
    }
    // The shop being edited may keep its own name; every other shop must differ.
    if (shops.some((s) => s.id !== shop?.id && s.name.trim().toLowerCase() === value.toLowerCase())) {
      setError(`"${value}" already exists.`);
      return;
    }
    if (phone && !isValidMobile(phone)) {
      setError("Enter a valid mobile number.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      await onSave(value, mobileEnabled ? phone : "");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the shop.");
      setBusy(false);
    }
  }

  return (
    <Modal
      onClose={busy ? () => {} : onClose}
      title={editing ? "Shop settings" : "New shop"}
      subtitle={editing ? "Contact number and name for this shop" : "Add a shop to file products under"}
    >
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

        <div>
          <label className="label" htmlFor="shop-mobile">
            Mobile phone
          </label>
          <div className="relative">
            <Phone
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
            />
            <input
              id="shop-mobile"
              type="tel"
              inputMode="tel"
              className="input pl-9"
              placeholder="e.g. 0917 123 4567"
              value={mobile}
              disabled={!mobileEnabled}
              onChange={(e) => {
                setMobile(e.target.value);
                if (error) setError("");
              }}
            />
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-ink-faint">
            {mobileEnabled
              ? "Shown on every product from this shop. Leave blank to hide it."
              : "Needs the shop-mobile migration (see supabase/migrations)."}
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
