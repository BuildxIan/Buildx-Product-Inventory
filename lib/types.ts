export type Category = { id: string; name: string; sort_order: number };
export type Shop = { id: string; name: string };

export type ProductImage = { id: string; product_id: string; path: string; position: number };
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
