export type Category = {
  id: string;
  name: string;
  sort_order: number;
  /**
   * The parent category this one sits under (migration 003). Optional because
   * the app also runs against a database that has not added the column yet —
   * a missing value simply means "top-level".
   */
  parent_id?: string | null;
};
export type Shop = { id: string; name: string };

export type ProductImage = {
  id: string;
  product_id: string;
  /** Optimised copy used on the cards and in the detail view. */
  path: string;
  /** Untouched upload, when the database has the column and the file exists. */
  original_path?: string | null;
  position: number;
};
export type ProductVariant = {
  id: string;
  product_id: string;
  label: string;
  color_hex: string | null;
  price: number | null;
  position: number;
};

export type Product = {
  id: string;
  category_id: string | null;
  shop_id: string | null;
  name: string;
  price: number;
  /** Stock-keeping code (e.g. "TILE-001"). Null until one is entered. */
  code?: string | null;
  description: string | null;
  source_url: string | null;
  notes: string | null;
  created_at: string;
  product_images: ProductImage[];
  product_variants: ProductVariant[];
};
