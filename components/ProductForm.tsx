"use client";

import { useEffect, useMemo, useState } from "react";
import { ImagePlus, Plus, Trash2, X } from "lucide-react";
import Modal from "./Modal";
import CategoryModal from "./CategoryModal";
import ShopModal from "./ShopModal";
import ShopSelect from "./ShopSelect";
import ShopDeleteDialog from "./ShopDeleteDialog";
import type { Category, Product, ProductImage, Shop } from "@/lib/types";
import { imageUrl } from "@/lib/supabase";

export type VariantInput = { label: string; color_hex: string; price: string };

export type FormValues = {
  name: string;
  price: number;
  code: string;
  category_id: string | null;
  shop_id: string | null;
  description: string;
  notes: string;
  variants: { label: string; color_hex: string | null; price: number | null }[];
  keptImages: ProductImage[];
  newFiles: File[];
};

type Props = {
  product?: Product; // undefined = adding
  categories: Category[];
  shops: Shop[];
  /** Product count per shop, so the delete dialog can explain the impact. */
  shopCounts: Record<string, number>;
  defaultCategoryId: string | null;
  /** False until the `code` column exists in the database. */
  codeEnabled: boolean;
  /** Creates a category (uppercased, duplicate-checked) and returns it. */
  onAddCategory: (name: string) => Promise<Category | null>;
  /** Creates a shop (trimmed, duplicate-checked) and returns it. */
  onAddShop: (name: string) => Promise<Shop | null>;
  /** Deletes a shop after moving its products to `reassignTo` (null = none). */
  onDeleteShop: (shop: Shop, reassignTo: string | null) => Promise<void>;
  onSubmit: (values: FormValues) => Promise<void>;
  onClose: () => void;
};

const NEW_CATEGORY = "__new_category__";

export default function ProductForm({
  product,
  categories,
  shops,
  shopCounts,
  defaultCategoryId,
  codeEnabled,
  onAddCategory,
  onAddShop,
  onDeleteShop,
  onSubmit,
  onClose,
}: Props) {
  const [name, setName] = useState(product?.name ?? "");
  const [price, setPrice] = useState(product ? String(product.price) : "");
  const [code, setCode] = useState(product?.code ?? "");
  const [categoryId, setCategoryId] = useState(product?.category_id ?? defaultCategoryId ?? "");
  const [shopChoice, setShopChoice] = useState(product?.shop_id ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [notes, setNotes] = useState(product?.notes ?? "");
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [showNewShop, setShowNewShop] = useState(false);
  const [shopToDelete, setShopToDelete] = useState<Shop | null>(null);
  const [variants, setVariants] = useState<VariantInput[]>(
    [...(product?.product_variants ?? [])]
      .sort((a, b) => a.position - b.position)
      .map((v) => ({
        label: v.label,
        color_hex: v.color_hex ?? "",
        price: v.price != null ? String(v.price) : "",
      }))
  );
  const [keptImages, setKeptImages] = useState<ProductImage[]>(
    [...(product?.product_images ?? [])].sort((a, b) => a.position - b.position)
  );
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const previews = useMemo(() => newFiles.map((f) => URL.createObjectURL(f)), [newFiles]);

  // A shop deleted from the dropdown can't stay selected in this form.
  useEffect(() => {
    if (shopChoice && !shops.some((s) => s.id === shopChoice)) setShopChoice("");
  }, [shops, shopChoice]);

  function updateVariant(i: number, patch: Partial<VariantInput>) {
    setVariants((vs) => vs.map((v, idx) => (idx === i ? { ...v, ...patch } : v)));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const priceNum = Number(price);
    if (!name.trim()) return setError("Product name is required.");
    if (!Number.isFinite(priceNum) || priceNum < 0) return setError("Enter a valid price.");

    setBusy(true);
    try {
      await onSubmit({
        name: name.trim(),
        price: priceNum,
        code: code.trim(),
        category_id: categoryId || null,
        shop_id: shopChoice || null,
        description: description.trim(),
        notes: notes.trim(),
        variants: variants
          .filter((v) => v.label.trim())
          .map((v) => ({
            label: v.label.trim(),
            color_hex: v.color_hex || null,
            price: v.price.trim() !== "" && Number.isFinite(Number(v.price)) ? Number(v.price) : null,
          })),
        keptImages,
        newFiles,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setBusy(false);
    }
  }

  const sectionTitle = "mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-faint";

  return (
    <Modal
      onClose={busy ? () => {} : onClose}
      title={product ? "Edit product" : "Add product"}
      subtitle={product ? "Update the details, photos and variations" : "Add a new item to the catalog"}
      wide
    >
      <form onSubmit={submit} className="space-y-5 p-4 lg:p-5">
        {/* Field order mirrors the product info display: name, price, code, category, shop. */}
        <div className="grid gap-3 sm:grid-cols-2 lg:gap-4">
          <div className="sm:col-span-2">
            <label className="label">Product name *</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="label">Price (₱) *</label>
            <input
              className="input"
              inputMode="decimal"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="label">Product code</label>
            <input
              className="input font-mono"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. TILE-001"
              disabled={!codeEnabled}
            />
            {!codeEnabled && (
              <p className="mt-1 text-[11px] leading-snug text-ink-faint">
                Needs the product-code migration (see <code>supabase/migrations</code>).
              </p>
            )}
          </div>
          <div>
            <label className="label">Category</label>
            <select
              className="input uppercase"
              value={categoryId}
              onChange={(e) => {
                // The sentinel opens the dialog and leaves the selection untouched.
                if (e.target.value === NEW_CATEGORY) return setShowNewCategory(true);
                setCategoryId(e.target.value);
              }}
            >
              <option value="">Uncategorized</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
              <option value={NEW_CATEGORY}>+ Create new category...</option>
            </select>
          </div>
          <div>
            <label className="label">Shop</label>
            <ShopSelect
              shops={shops}
              value={shopChoice}
              onChange={setShopChoice}
              onDelete={setShopToDelete}
              onAdd={() => setShowNewShop(true)}
              disabled={busy}
            />
          </div>
        </div>

        {/* Photos */}
        <div>
          <label className="label">Photos (first one is the cover)</label>
          <div className="flex flex-wrap gap-2">
            {keptImages.map((img) => (
              <div key={img.id} className="relative h-20 w-20 overflow-hidden rounded border border-ink-line bg-canvas">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl(img.path)} alt="" className="h-full w-full object-contain p-1" />
                <button
                  type="button"
                  className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
                  onClick={() => setKeptImages((k) => k.filter((i) => i.id !== img.id))}
                  aria-label="Remove photo"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            {previews.map((src, i) => (
              <div key={src} className="relative h-20 w-20 overflow-hidden rounded border border-accent bg-canvas">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="h-full w-full object-contain p-1" />
                <button
                  type="button"
                  className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
                  onClick={() => setNewFiles((f) => f.filter((_, idx) => idx !== i))}
                  aria-label="Remove photo"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded border border-dashed border-ink-mist text-[11px] font-semibold text-ink-faint transition-colors hover:border-ink hover:text-ink">
              <ImagePlus size={19} />
              Add
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? []);
                  setNewFiles((f) => [...f, ...files]);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
        </div>

        {/* Variants */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className={sectionTitle + " mb-0"}>Colors / variations</h3>
            <button
              type="button"
              className="inline-flex items-center gap-1 text-xs font-semibold text-accent-deep hover:underline"
              onClick={() => setVariants((v) => [...v, { label: "", color_hex: "", price: "" }])}
            >
              <Plus size={13} /> Add
            </button>
          </div>
          <div className="space-y-2">
            {variants.map((v, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  className="input"
                  placeholder="e.g. Black, Size M"
                  value={v.label}
                  onChange={(e) => updateVariant(i, { label: e.target.value })}
                />
                <input
                  type="color"
                  title="Swatch color (optional)"
                  className="h-9 w-10 shrink-0 cursor-pointer rounded border border-ink-line bg-surface p-0.5"
                  value={v.color_hex || "#cccccc"}
                  onChange={(e) => updateVariant(i, { color_hex: e.target.value })}
                />
                <input
                  className="input w-24 shrink-0"
                  inputMode="decimal"
                  placeholder="₱ price"
                  value={v.price}
                  onChange={(e) => updateVariant(i, { price: e.target.value })}
                />
                <button
                  type="button"
                  className="icon-btn shrink-0 text-danger hover:bg-danger-soft"
                  onClick={() => setVariants((vs) => vs.filter((_, idx) => idx !== i))}
                  aria-label="Remove variation"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {variants.length === 0 && (
              <p className="text-xs text-ink-faint">No variations yet — add colors or sizes if the item has them.</p>
            )}
            {variants.some((v) => v.color_hex) && (
              <button
                type="button"
                className="text-xs text-ink-faint underline hover:text-ink"
                onClick={() => setVariants((vs) => vs.map((v) => ({ ...v, color_hex: "" })))}
              >
                Clear all swatch colors
              </button>
            )}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:gap-4">
          <div>
            <label className="label">Details</label>
            <textarea
              className="input min-h-[96px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Notes (private reminders)</label>
            <textarea
              className="input min-h-[96px]"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <p className="rounded border border-danger/25 bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>
        )}

        <div className="sticky bottom-0 -mx-4 -mb-4 flex justify-end gap-2 border-t border-ink-line bg-surface px-4 py-3 lg:-mx-5 lg:-mb-5 lg:px-5">
          <button type="button" className="btn-ghost" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button className="btn-primary" disabled={busy}>
            {busy ? "Saving..." : "Save product"}
          </button>
        </div>
      </form>

      {/* Same dialogs the header uses, so shop rules live in one place. */}
      {showNewShop && (
        <ShopModal
          shops={shops}
          onSave={async (name) => {
            const created = await onAddShop(name);
            if (created) setShopChoice(created.id);
            return created;
          }}
          onClose={() => setShowNewShop(false)}
        />
      )}

      {shopToDelete && (
        <ShopDeleteDialog
          shop={shopToDelete}
          productCount={shopCounts[shopToDelete.id] ?? 0}
          otherShops={shops.filter((s) => s.id !== shopToDelete.id)}
          onConfirm={async (reassignTo) => {
            await onDeleteShop(shopToDelete, reassignTo);
            setShopToDelete(null);
          }}
          onCancel={() => setShopToDelete(null)}
        />
      )}

      {/* Same dialog the sidebar uses, so category rules live in one place. */}
      {showNewCategory && (
        <CategoryModal
          categories={categories}
          onSave={async (name) => {
            const created = await onAddCategory(name);
            if (created) setCategoryId(created.id);
          }}
          onClose={() => setShowNewCategory(false)}
        />
      )}
    </Modal>
  );
}
