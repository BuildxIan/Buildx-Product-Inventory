// Photo helpers.
//
// `compressImage` produces the *display* copy: capped at 1280px on the long edge
// and re-encoded as JPEG. It is lossy, so it must never be presented as the
// original — the untouched upload is stored separately (see `originalExtension`
// and the upload path in CatalogApp).

export async function compressImage(file: File, maxSize = 1280, quality = 0.8): Promise<Blob> {
  if (!file.type.startsWith("image/")) return file;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, w, h);
  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", quality));
  return blob ?? file;
}

const MIME_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
  "image/heic": "heic",
  "image/heif": "heif",
  "image/bmp": "bmp",
  "image/tiff": "tif",
  "image/svg+xml": "svg",
};

const KNOWN_EXT = new Set(["jpg", "jpeg", "png", "webp", "gif", "avif", "heic", "heif", "bmp", "tif", "tiff", "svg"]);

/** Extension for the original upload, from its filename, then its MIME type. */
export function originalExtension(file: File): string {
  const fromName = /\.([a-z0-9]{2,5})$/i.exec(file.name)?.[1]?.toLowerCase();
  if (fromName && KNOWN_EXT.has(fromName)) return fromName === "jpeg" ? "jpg" : fromName;
  return MIME_EXT[(file.type || "").toLowerCase()] ?? "jpg";
}
