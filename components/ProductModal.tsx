"use client";

import { useState } from "react";
import { Download, Pencil, Trash2 } from "lucide-react";
import Modal from "./Modal";
import DownloadDialog from "./DownloadDialog";
import type { Product, Shop, Category } from "@/lib/types";
import { imageUrl } from "@/lib/supabase";
import { formatPeso } from "@/lib/format";

type Props = {
  product: Product;
  shop?: Shop;
  category?: Category;
  isAdmin: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

/** One row of the product information list (label on the left, value on the right). */
function InfoRow({
  label,
  value,
  mono,
  upper,
}: {
  label: string;
  value: string;
  mono?: boolean;
  upper?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2">
      <dt className="shrink-0 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-faint">{label}</dt>
      <dd
        className={`min-w-0 truncate text-right text-[13px] text-ink ${mono ? "font-mono font-semibold" : "font-medium"} ${
          upper ? "uppercase" : ""
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

export default function ProductModal({ product, shop, category, isAdmin, onClose, onEdit, onDelete }: Props) {
  const images = [...product.product_images].sort((a, b) => a.position - b.position);
  const variants = [...product.product_variants].sort((a, b) => a.position - b.position);
  const [idx, setIdx] = useState(0);
  const [showDownload, setShowDownload] = useState(false);

  return (
    <Modal onClose={onClose} wide mobileFullScreen>
      <div className="grid gap-0 md:grid-cols-2">
        {/* Photos */}
        <div className="flex flex-col border-b border-ink-line bg-canvas md:border-b-0 md:border-r">
          <div className="relative aspect-square w-full">
            {images.length > 0 ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl(images[idx].path)}
                alt={product.name}
                className="absolute inset-0 h-full w-full object-contain p-4 lg:p-6"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-ink-faint">No photo</div>
            )}

            {/* Download sits opposite the close button so both stay reachable on phones. */}
            <button
              className="absolute left-3 top-3 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border border-ink-line bg-white/95 text-ink-soft shadow-panel transition-colors hover:bg-white hover:text-ink sm:h-9 sm:w-9"
              onClick={() => setShowDownload(true)}
              aria-label="Download photos and product details"
              title="Download"
            >
              <Download size={17} />
            </button>
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto px-3 pb-3">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setIdx(i)}
                  className={`h-14 w-14 shrink-0 overflow-hidden rounded border bg-white transition ${
                    i === idx ? "border-accent ring-1 ring-accent" : "border-ink-line hover:border-ink-mist"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageUrl(img.path)} alt="" className="h-full w-full object-contain p-1" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col gap-4 p-5 pr-12 lg:gap-5 lg:p-6 lg:pr-14">
          <div>
            <h2 className="font-display text-2xl font-bold leading-[1.1] tracking-wide text-ink lg:text-3xl">
              {product.name}
            </h2>
            <p className="mt-2.5 text-2xl font-bold leading-none text-ink lg:text-[28px]">
              {formatPeso(product.price)}
            </p>

            {/* Fixed reading order: name, price, product code, category, shop. */}
            <dl className="mt-4 divide-y divide-ink-line/70 border-y border-ink-line">
              <InfoRow label="Product code" value={product.code?.trim() || "Not set"} mono />
              <InfoRow label="Category" value={category?.name || "Uncategorized"} upper />
              <InfoRow label="Shop" value={shop?.name || "No shop"} />
            </dl>
          </div>

          {variants.length > 0 && (
            <div>
              <h3 className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-faint">
                Colors / variations
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {variants.map((v) => (
                  <span
                    key={v.id}
                    className="inline-flex items-center gap-1.5 rounded border border-ink-line bg-white px-2.5 py-1.5 text-[13px] text-ink"
                  >
                    {v.color_hex && (
                      <span
                        className="h-3.5 w-3.5 rounded-full ring-1 ring-inset ring-ink/15"
                        style={{ backgroundColor: v.color_hex }}
                      />
                    )}
                    {v.label}
                    {v.price != null && v.price > 0 && (
                      <span className="text-[11px] text-ink-faint">{formatPeso(v.price)}</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}

          {product.description && (
            <div>
              <h3 className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-faint">Details</h3>
              <p className="whitespace-pre-wrap text-[13.5px] leading-relaxed text-ink-soft">
                {product.description}
              </p>
            </div>
          )}

          {product.notes && (
            <div className="rounded border border-ink-line bg-canvas px-3 py-2.5">
              <h3 className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-faint">Notes</h3>
              <p className="whitespace-pre-wrap text-xs leading-relaxed text-ink-soft">{product.notes}</p>
            </div>
          )}

          {isAdmin && (
            <div className="mt-auto flex gap-2 pt-1">
              <button className="btn-primary flex-1" onClick={onEdit}>
                <Pencil size={15} /> Edit
              </button>
              <button className="btn-danger-ghost flex-1" onClick={onDelete}>
                <Trash2 size={15} /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {showDownload && (
        <DownloadDialog
          product={product}
          categoryName={category?.name}
          shopName={shop?.name}
          // The gallery's current index, not the stored cover photo.
          selectedImageId={images[idx]?.id}
          onClose={() => setShowDownload(false)}
        />
      )}
    </Modal>
  );
}
