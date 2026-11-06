"use client";

import { publicImageUrl } from "./config";
import { productSlug } from "./download";
import { formatPeso } from "./format";
import type { Product } from "./types";

// Logical layout is 1080x1350 (a portrait share card); it is drawn at 2x so the
// exported PNG is 2160x2700 and stays crisp on high-density phone screens.
const W = 1080;
const H = 1350;
const SCALE = 2;

const INK = "#112538";
const FAINT = "#8B98A7";
const LINE = "#DDE2E8";
const CANVAS = "#F5F6F8";
const ACCENT_DEEP = "#C2410C";

/** The official lockup, shipped in `public/brand`: 2400x943, white background. */
const LOGO_SRC = "/brand/BuildX_Logo_Horizontal_2400px.png";
const LOGO_RATIO = 2400 / 943;

// White masthead: the logo is centred, with even breathing room above it and a
// wider gap below so it never crowds the product photograph.
const LOGO_W = 400;
const LOGO_H = LOGO_W / LOGO_RATIO;
const HEADER_TOP = 44;
const HEADER_BOTTOM = 40;
const HEADER_H = HEADER_TOP + LOGO_H + HEADER_BOTTOM;
// The photo panel is measured per product so it fills the card now that the
// footer is gone; these bound how far it can stretch.
const PHOTO_MIN_H = 600;
const PHOTO_MAX_H = 860;
const PHOTO_INSET = 28;

const FONT = 'Barlow, "Segoe UI", system-ui, -apple-system, sans-serif';
const font = (size: number, weight = 500) => `${weight} ${size}px ${FONT}`;

type Ctx = CanvasRenderingContext2D;

function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

/** Draws text with manual letter spacing (canvas letterSpacing isn't universal). */
function drawTracked(ctx: Ctx, text: string, x: number, y: number, spacing: number) {
  let cursor = x;
  for (const char of text) {
    ctx.fillText(char, cursor, y);
    cursor += ctx.measureText(char).width + spacing;
  }
}

function truncate(ctx: Ctx, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let out = text;
  while (out.length > 1 && ctx.measureText(`${out}…`).width > maxWidth) out = out.slice(0, -1);
  return `${out.trimEnd()}…`;
}

/** Greedy word wrap, with a character-level fallback for very long words. */
function wrapLines(ctx: Ctx, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";

  const push = () => {
    if (line) lines.push(line);
    line = "";
  };

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      line = candidate;
      continue;
    }
    push();
    if (ctx.measureText(word).width <= maxWidth) {
      line = word;
      continue;
    }
    // Break an over-long word character by character.
    let chunk = "";
    for (const char of word) {
      if (ctx.measureText(chunk + char).width > maxWidth) {
        lines.push(chunk);
        chunk = char;
      } else {
        chunk += char;
      }
    }
    line = chunk;
  }
  push();

  if (lines.length <= maxLines) return lines;
  const kept = lines.slice(0, maxLines);
  kept[maxLines - 1] = truncate(ctx, `${kept[maxLines - 1]} …`, maxWidth);
  return kept;
}

async function loadImage(src: string): Promise<{ image: HTMLImageElement; release: () => void } | null> {
  try {
    // Fetched as a blob so the canvas is never tainted by cross-origin pixels.
    const response = await fetch(src, { mode: "cors" });
    if (!response.ok) return null;
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Could not decode the photo."));
      image.src = objectUrl;
    });
    return { image, release: () => URL.revokeObjectURL(objectUrl) };
  } catch {
    return null;
  }
}

/** Tries each stored path in turn, so a missing full-size copy still exports. */
async function loadFirstAvailable(paths: string[]) {
  for (const path of paths) {
    const loaded = await loadImage(publicImageUrl(path));
    if (loaded) return loaded;
  }
  return null;
}

// The logo is part of the build, so it is fetched once and kept decoded.
let logoPromise: Promise<HTMLImageElement | null> | null = null;

function loadLogo() {
  if (!logoPromise) {
    logoPromise = loadImage(LOGO_SRC).then((loaded) => {
      if (!loaded) return null;
      loaded.release();
      return loaded.image;
    });
  }
  return logoPromise;
}

/** The photo the gallery is showing, falling back to the first one. */
export function pickDetailsImage(product: Product, imageId?: string | null) {
  const ordered = [...product.product_images].sort((a, b) => a.position - b.position);
  if (imageId) {
    const match = ordered.find((image) => image.id === imageId);
    if (match) return match;
  }
  return ordered[0] ?? null;
}

export type DetailsImageInput = {
  product: Product;
  categoryName?: string | null;
  shopName?: string | null;
  /** id of the photo currently open in the gallery — not always the first one. */
  imageId?: string | null;
};

export type DetailsImageResult = { blob: Blob; filename: string };

/**
 * Renders the shareable product card: the selected photo, name, price, code,
 * category, shop and every variation, in the BuildX palette.
 */
export async function buildDetailsPng({
  product,
  categoryName,
  shopName,
  imageId,
}: DetailsImageInput): Promise<DetailsImageResult> {
  if (typeof document === "undefined") throw new Error("This runs in the browser only.");
  if (document.fonts?.ready) await document.fonts.ready.catch(() => undefined);

  const canvas = document.createElement("canvas");
  canvas.width = W * SCALE;
  canvas.height = H * SCALE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("This browser cannot draw the image.");
  ctx.scale(SCALE, SCALE);
  ctx.textBaseline = "top";

  // Measured before drawing: with no footer to close the card, the photo panel
  // grows into whatever space the details do not need.
  ctx.font = font(46, 700);
  const nameLines = wrapLines(ctx, product.name, W - 128, 2);
  const variants = [...product.product_variants].sort((a, b) => a.position - b.position);
  const detailsH =
    26 + nameLines.length * 52 + 14 + 62 + 10 + 150 + 14 + (variants.length > 0 ? 64 : 0);
  const photoH = Math.min(PHOTO_MAX_H, Math.max(PHOTO_MIN_H, H - HEADER_H - 42 - detailsH - 40));

  // Page
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, W, H);

  // ---------- Header ----------
  // Plain white masthead with the official lockup centred across the top. The
  // logo carries its own white background, so it sits on the page seamlessly.
  const logo = await loadLogo();
  if (!logo) throw new Error("The BuildX logo could not be loaded.");

  // Proportional: one dimension is given, the other follows the source ratio.
  ctx.drawImage(logo, (W - LOGO_W) / 2, HEADER_TOP, LOGO_W, LOGO_H);

  // ---------- Photo ----------
  ctx.fillStyle = CANVAS;
  ctx.fillRect(0, HEADER_H, W, photoH);

  const photo = pickDetailsImage(product, imageId);
  const boxX = 56;
  const boxY = HEADER_H + PHOTO_INSET;
  const boxW = W - 112;
  const boxH = photoH - PHOTO_INSET * 2;

  if (photo) {
    const candidates = [photo.original_path, photo.path]
      .map((path) => (path ?? "").trim())
      .filter((path, index, all) => path.length > 0 && all.indexOf(path) === index);

    const loaded = await loadFirstAvailable(candidates);
    if (!loaded) {
      throw new Error("The selected photo could not be loaded. Check your connection and try again.");
    }

    const { image, release } = loaded;
    // contain, never cover: portrait and landscape shots both keep their shape.
    const ratio = Math.min(boxW / image.width, boxH / image.height);
    const drawW = image.width * ratio;
    const drawH = image.height * ratio;
    ctx.drawImage(image, boxX + (boxW - drawW) / 2, boxY + (boxH - drawH) / 2, drawW, drawH);
    release();
  } else {
    ctx.fillStyle = FAINT;
    ctx.font = font(18, 600);
    ctx.textAlign = "center";
    ctx.fillText("NO PHOTO", W / 2, boxY + boxH / 2 - 9);
    ctx.textAlign = "left";
  }

  // ---------- Details ----------
  const left = 64;
  const right = W - 64;
  const innerW = right - left;
  let y = HEADER_H + photoH + 42;

  ctx.fillStyle = ACCENT_DEEP;
  ctx.font = font(14, 700);
  drawTracked(ctx, (categoryName || "UNCATEGORISED").toUpperCase(), left, y, 2.4);
  y += 26;

  ctx.fillStyle = INK;
  ctx.font = font(46, 700);
  for (const line of nameLines) {
    ctx.fillText(line, left, y);
    y += 52;
  }

  y += 14;
  ctx.fillStyle = INK;
  ctx.font = font(52, 700);
  ctx.fillText(formatPeso(product.price), left, y);
  y += 62;

  // Hairline + spec rows
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(left, y + 0.5);
  ctx.lineTo(right, y + 0.5);
  ctx.stroke();
  y += 10;

  const rows: { label: string; value: string }[] = [
    { label: "PRODUCT CODE", value: product.code?.trim() || "Not set" },
    { label: "CATEGORY", value: (categoryName || "Uncategorized").toUpperCase() },
    { label: "SHOP", value: shopName || "No shop" },
  ];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowY = y + i * 50;

    ctx.fillStyle = FAINT;
    ctx.font = font(13, 700);
    drawTracked(ctx, row.label, left, rowY + 16, 1.8);

    ctx.fillStyle = INK;
    ctx.font = font(20, 600);
    ctx.textAlign = "right";
    ctx.fillText(truncate(ctx, row.value, innerW - 240), right, rowY + 11);
    ctx.textAlign = "left";

    if (i < rows.length - 1) {
      ctx.strokeStyle = LINE;
      ctx.beginPath();
      ctx.moveTo(left, rowY + 50 + 0.5);
      ctx.lineTo(right, rowY + 50 + 0.5);
      ctx.stroke();
    }
  }
  y += rows.length * 50 + 14;

  // ---------- Variations ----------
  if (variants.length > 0 && y + 64 <= H - 40) {
    ctx.fillStyle = FAINT;
    ctx.font = font(13, 700);
    drawTracked(ctx, "AVAILABLE COLORS / SIZES", left, y, 1.8);
    y += 26;

    let x = left;
    const chipH = 38;
    for (let i = 0; i < variants.length; i++) {
      const v = variants[i];
      const labelText = truncate(ctx, v.label, 300);
      ctx.font = font(16, 600);
      const dotSpace = v.color_hex ? 22 : 0;
      const chipW = ctx.measureText(labelText).width + 28 + dotSpace;

      if (x + chipW > right) {
        // No room left: summarise the remainder instead of overflowing.
        const rest = variants.length - i;
        ctx.fillStyle = FAINT;
        ctx.font = font(15, 600);
        ctx.fillText(`+${rest} more`, x, y + 9);
        break;
      }

      ctx.fillStyle = "#FFFFFF";
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 1;
      roundRect(ctx, x + 0.5, y + 0.5, chipW - 1, chipH - 1, 19);
      ctx.fill();
      ctx.stroke();

      if (v.color_hex) {
        ctx.beginPath();
        ctx.fillStyle = v.color_hex;
        ctx.arc(x + 19, y + chipH / 2, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(17,37,56,0.18)";
        ctx.stroke();
      }

      ctx.fillStyle = INK;
      ctx.font = font(16, 600);
      ctx.fillText(labelText, x + 14 + dotSpace, y + 9);

      x += chipW + 10;
    }
  }

  // The card ends with the last piece of product information — no footer strip.

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("Could not create the image.");

  return { blob, filename: `${productSlug(product)}-details.png` };
}
