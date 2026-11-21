import type { Shop } from "./types";

/**
 * Shop contact numbers.
 *
 * The number lives on the shop and only on the shop. A product detail resolves
 * it through `product.shop_id`, which is why editing a shop's number changes it
 * on every product of that shop at once — there is no per-product copy that
 * could go stale, and no backfill to run when a number is added later.
 *
 * Everything here is pure, so the formatting and the "is there a number at all"
 * rule can be reasoned about without a browser or a database.
 */

/** Digits only — used for dialling and for recognising a number's shape. */
const digits = (raw: string) => raw.replace(/\D/g, "");

/**
 * Canonical storage form.
 *
 * A recognisable PH mobile is stored as E.164 (`+639171234567`) so a `tel:` link
 * works from anywhere, whichever way it was typed. Anything else — a landline,
 * an extension, a foreign number — is kept exactly as typed (trimmed), because
 * guessing at those formats would corrupt them.
 */
export function normalizeMobile(raw: string): string {
  const trimmed = raw.trim().replace(/\s+/g, " ");
  if (!trimmed) return "";

  const d = digits(trimmed);
  if (/^09\d{9}$/.test(d)) return `+63${d.slice(1)}`; // 0917 123 4567
  if (/^639\d{9}$/.test(d)) return `+63${d.slice(2)}`; // 639171234567
  if (/^9\d{9}$/.test(d)) return `+63${d}`; // 917 123 4567
  return trimmed;
}

/**
 * How the number is read on screen: `0917 123 4567` for a PH mobile, which is
 * the form people here actually dial. Anything stored in another shape is shown
 * as it was entered.
 */
export function formatMobile(value: string | null | undefined): string {
  const raw = (value ?? "").trim();
  if (!raw) return "";

  const ph = raw.match(/^\+63(9\d{9})$/);
  if (!ph) return raw;

  const d = ph[1];
  return `0${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
}

/** The `tel:` target behind the number, so tapping it dials. */
export function telHref(value: string | null | undefined): string {
  const raw = (value ?? "").trim();
  const d = digits(raw);
  if (!d) return "";
  return raw.startsWith("+") ? `tel:+${d}` : `tel:${d}`;
}

/**
 * Deliberately permissive: seven digits is enough to catch a half-typed number
 * without rejecting legitimate non-PH formats or extensions.
 */
export function isValidMobile(value: string): boolean {
  return digits(value).length >= 7;
}

/**
 * What a product detail shows for its shop.
 *
 * `null` means "render nothing" — a shop with no number must not leave an empty
 * row behind in the product details.
 */
export function shopMobileDisplay(shop?: Shop | null): string | null {
  const shown = formatMobile(shop?.mobile);
  return shown || null;
}
