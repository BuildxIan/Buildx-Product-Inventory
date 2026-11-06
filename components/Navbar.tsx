"use client";

import { LogOut, Plus, Search, Trash2, X } from "lucide-react";
import type { Shop } from "@/lib/types";
import ShopFilter from "./ShopFilter";

export type Mode = "edit" | "delete" | null;

type Props = {
  query: string;
  onQuery: (q: string) => void;
  /** Category the search is limited to (null = all products). */
  searchScope?: string | null;
  shops: Shop[];
  /** Product count per shop, used inside the shop dropdown. */
  shopCounts: Record<string, number>;
  /** Total product count, shown next to "All shops". */
  totalProducts: number;
  shopFilter: string;
  onShopFilter: (id: string) => void;
  onDeleteShop: (shop: Shop) => void;
  onAddShop: () => void;
  mode: Mode;
  onMode: (m: Mode) => void;
  onAdd: () => void;
  isAdmin: boolean;
  onLogout: () => void;
};

export default function Navbar({
  query,
  onQuery,
  searchScope,
  shops,
  shopCounts,
  totalProducts,
  shopFilter,
  onShopFilter,
  onDeleteShop,
  onAddShop,
  mode,
  onMode,
  onAdd,
  isAdmin,
  onLogout,
}: Props) {
  // Every visitor is signed in (see middleware), so the only guard left is for
  // the brief moment before the session state settles.
  const guard = (fn: () => void) => () => {
    if (isAdmin) fn();
  };
  const searchLabel = searchScope ? `Search in ${searchScope}...` : "Search all products...";

  const shopFilterProps = {
    shops,
    counts: shopCounts,
    total: totalProducts,
    value: shopFilter,
    onChange: onShopFilter,
    isAdmin,
    onDelete: onDeleteShop,
    onAdd: onAddShop,
  };

  return (
    <header className="sticky top-0 z-20 border-b border-ink-line bg-white shadow-[0_2px_10px_-8px_rgba(17,37,56,0.45)]">
      <div className="flex items-center gap-1.5 px-2 py-2 sm:gap-2 sm:px-3 lg:gap-3 lg:px-5 lg:py-3">
        <div className="relative min-w-0 flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint lg:left-3.5 lg:h-[18px] lg:w-[18px]"
          />
          <input
            className="h-10 w-full rounded border border-ink-line bg-white pl-9 pr-8 text-sm text-ink outline-none transition placeholder:text-ink-faint focus:border-ink focus:ring-2 focus:ring-ink/10 lg:h-11 lg:pl-10 lg:pr-9 lg:text-[15px]"
            placeholder={searchLabel}
            aria-label={searchLabel}
            value={query}
            onChange={(e) => onQuery(e.target.value)}
          />
          {query && (
            <button
              className="absolute right-1.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-surface-alt hover:text-ink lg:right-2.5 lg:h-7 lg:w-7"
              onClick={() => onQuery("")}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="hidden w-48 shrink-0 lg:block">
          <ShopFilter {...shopFilterProps} />
        </div>

        <div className="flex shrink-0 items-center gap-1.5 lg:gap-2">
          <button
            className="inline-flex h-9 w-9 items-center justify-center rounded bg-accent text-white transition-colors hover:bg-accent-hover lg:h-11 lg:w-11"
            onClick={guard(onAdd)}
            aria-label="Add product"
            title="Add product"
          >
            <Plus size={19} />
          </button>
          <button
            className={`inline-flex h-9 w-9 items-center justify-center rounded border transition-colors lg:h-11 lg:w-11 ${
              mode === "delete"
                ? "border-danger bg-danger-soft text-danger"
                : "border-ink-line bg-white text-ink-soft hover:border-ink-mist hover:text-ink"
            }`}
            onClick={guard(() => onMode(mode === "delete" ? null : "delete"))}
            aria-label="Delete products"
            title="Delete products"
          >
            <Trash2 size={17} />
          </button>
          <button
            className="inline-flex h-9 items-center gap-1.5 rounded border border-ink-line bg-white px-2.5 text-[13px] font-semibold text-ink transition-colors hover:border-ink-mist hover:bg-canvas lg:h-11 lg:px-3.5 lg:text-sm"
            onClick={onLogout}
            aria-label="Log out"
            title="Log out"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Shop filter on phones and tablets */}
      <div className="px-2 pb-2 lg:hidden">
        <ShopFilter {...shopFilterProps} />
      </div>
    </header>
  );
}
