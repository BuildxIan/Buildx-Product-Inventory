"use client";

import { useRef } from "react";
import { Check, Store } from "lucide-react";
import type { Product } from "@/lib/types";
import { imageUrl } from "@/lib/supabase";
import { formatPeso } from "@/lib/format";

type Props = {
  product: Product;
  categoryName?: string;
  shopName?: string;
  selectMode: boolean;
  selected: boolean;
  onClick: () => void;
  index?: number;
};

const MAX_TILT = 8; // degrees

export default function ProductCard({
  product,
  categoryName,
  shopName,
  selectMode,
  selected,
  onClick,
  index = 0,
}: Props) {
  const ref = useRef<HTMLButtonElement>(null);

  const images = [...product.product_images].sort((a, b) => a.position - b.position);
  const cover = images[0];
  const variants = [...product.product_variants].sort((a, b) => a.position - b.position);
  const swatches = variants.filter((v) => v.color_hex);
  const chips = variants.filter((v) => !v.color_hex);

  // Tilt the card toward the cursor and move the highlight with it.
  function handleMove(e: React.MouseEvent<HTMLButtonElement>) {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(hover: none)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;

    el.style.setProperty("--rx", `${(-py * MAX_TILT).toFixed(2)}deg`);
    el.style.setProperty("--ry", `${(px * MAX_TILT).toFixed(2)}deg`);
  }

  function handleLeave() {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  }

  return (
    <div className="h-full animate-rise" style={{ animationDelay: `${Math.min(index, 8) * 24}ms` }}>
      <button
        ref={ref}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        onClick={onClick}
        className={`tilt-card group relative flex h-full w-full flex-col overflow-hidden rounded-md border bg-surface text-left shadow-card hover:z-10 ${
          selected ? "border-accent ring-1 ring-accent" : "border-ink-line hover:border-ink/20 hover:shadow-lift"
        }`}
      >
        {/* Uniform 1:1 image well — recessed, contained, never cropped or stretched */}
        <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden border-b border-ink-line/70 bg-gradient-to-b from-surface-alt to-canvas p-3 shadow-well lg:p-4">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl(cover.path)}
              alt={product.name}
              loading="lazy"
              className="h-full w-full object-contain drop-shadow-[0_6px_10px_rgba(17,37,56,0.14)]"
            />
          ) : (
            <span className="text-[11px] uppercase tracking-wider text-ink-faint">No photo</span>
          )}

          {selectMode && (
            <span
              className={`absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors ${
                selected ? "border-accent bg-accent text-white" : "border-white bg-black/35"
              }`}
            >
              {selected && <Check size={13} />}
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-1 p-3 lg:gap-1.5 lg:p-3.5">
          {categoryName && <span className="eyebrow truncate">{categoryName}</span>}

          <h3 className="line-clamp-2 min-h-[2.6em] text-[13.5px] font-semibold leading-[1.3] text-ink lg:text-[15px]">
            {product.name}
          </h3>

          {/* Reading order matches the detail view: name, price, code, category, shop. */}
          <p className="pt-0.5 text-[17px] font-bold leading-none text-ink lg:text-[19px]">
            {formatPeso(product.price)}
          </p>

          {product.code && (
            <p className="truncate font-mono text-[10.5px] font-medium tracking-tight text-ink-faint">
              {product.code}
            </p>
          )}

          {shopName && (
            <p className="flex items-center gap-1 truncate text-[11.5px] text-ink-faint">
              <Store size={11} className="shrink-0" />
              <span className="truncate">{shopName}</span>
            </p>
          )}

          <div className="mt-auto flex min-h-[1.4rem] flex-wrap items-center gap-1 pt-1.5">
            {swatches.slice(0, 6).map((v) => (
              <span
                key={v.id}
                title={v.label}
                className="h-3.5 w-3.5 rounded-full shadow-[0_1px_2px_rgba(17,37,56,0.25)] ring-1 ring-inset ring-ink/15"
                style={{ backgroundColor: v.color_hex ?? undefined }}
              />
            ))}
            {chips.slice(0, 2).map((v) => (
              <span
                key={v.id}
                className="rounded-sm bg-surface-alt px-1.5 py-0.5 text-[10.5px] font-medium text-ink-soft"
              >
                {v.label}
              </span>
            ))}
            {swatches.length + chips.length > 8 && (
              <span className="text-[10.5px] text-ink-faint">+more</span>
            )}
          </div>
        </div>
      </button>
    </div>
  );
}
