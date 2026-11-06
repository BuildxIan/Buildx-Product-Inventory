"use client";

import { BUCKET, supabase } from "./supabase";
import type { Product, ProductImage } from "./types";

const MIME_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
  "image/heic": "heic",
  "image/heif": "heif",
  "image/bmp": "bmp",
  "image/tiff": "tiff",
  "image/svg+xml": "svg",
};

/** "TILE-001" -> "tile-001"; falls back to the product name, then "product". */
export function productSlug(product: Pick<Product, "code" | "name">): string {
  const raw = (product.code?.trim() || product.name || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return raw || "product";
}

/** Real extension of a stored file, taken from its MIME type, then its path. */
function extensionFor(mime: string, path: string): string {
  const base = (mime || "").split(";")[0].trim().toLowerCase();
  if (MIME_EXT[base]) return MIME_EXT[base];
  const match = /\.([a-z0-9]{2,5})$/i.exec(path);
  return match ? match[1].toLowerCase() : "jpg";
}

/** Hands a Blob to the browser's download machinery, then releases the URL. */
export function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Revoking immediately can cancel the download in some browsers.
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

export type PhotoDownloadResult = { saved: number; names: string[] };

/**
 * Downloads the stored file for each photo — byte for byte.
 *
 * `original_path` holds the untouched upload; when a photo predates that column
 * we fall back to `path`, which is the (already optimised) copy that was
 * uploaded before. Either way we return the stored bytes without re-encoding.
 */
export async function downloadOriginalPhotos(
  product: Product,
  images: ProductImage[],
  onProgress?: (done: number, total: number) => void
): Promise<PhotoDownloadResult> {
  const ordered = [...images].sort((a, b) => a.position - b.position);
  const slug = productSlug(product);
  const seen = new Set<string>();
  const names: string[] = [];
  let saved = 0;

  for (let i = 0; i < ordered.length; i++) {
    const image = ordered[i];
    const path = (image.original_path || image.path).trim();
    // A product can't legitimately contain the same object twice, but guard
    // anyway so a duplicate row never downloads the same file again.
    if (!path || seen.has(path)) continue;
    seen.add(path);

    const { data, error } = await supabase.storage.from(BUCKET).download(path);
    if (error) throw new Error(error.message || `Could not download ${path}.`);

    const ext = extensionFor(data.type, path);
    const filename = `${slug}-${String(i + 1).padStart(2, "0")}.${ext}`;
    saveBlob(data, filename);
    names.push(filename);
    saved += 1;
    onProgress?.(saved, ordered.length);

    // Browsers throttle bursts of downloads; a short gap keeps them all.
    if (saved < ordered.length) await wait(350);
  }

  return { saved, names };
}
