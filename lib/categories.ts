import type { Category } from "./types";

/**
 * Category hierarchy helpers.
 *
 * The model is strict and shallow: exactly two levels.
 *
 *   MAIN CATEGORY            parent_id = null
 *   └─ SUBCATEGORY           parent_id = <main category id>
 *
 * Nothing may be filed under a subcategory. The database can physically hold a
 * deeper chain (`parent_id` is just a self-reference), so this module is the
 * single place that decides what a valid shape looks like: it never builds more
 * than two levels, and it flattens anything deeper that already exists in the
 * data instead of hiding or rewriting it.
 *
 * Storage stays flat — one row per category plus a nullable `parent_id` — so no
 * existing record or product association has to change for this to work.
 */

export type CategoryNode = { category: Category; children: CategoryNode[] };

/** A category flattened for a <select>: depth drives the indent (0 or 1). */
export type CategoryOption = { category: Category; depth: number; label: string };

export const NEW_CATEGORY = "__new_category__";

/** Main category = level 1, subcategory = level 2. There is no level 3. */
export const MAX_CATEGORY_LEVEL = 2;

const nameKey = (name: string) => name.trim().toUpperCase();

export function parentOf(category: Category): string | null {
  return category.parent_id ?? null;
}

/** Siblings keep the order the query used: `sort_order`, then name. */
function compareSiblings(a: Category, b: Category) {
  if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
  return nameKey(a.name).localeCompare(nameKey(b.name));
}

/**
 * A category is a main category when it has no parent — or when its parent no
 * longer exists, or points at itself. Those last two can only come from
 * hand-edited rows, and treating them as main categories keeps the row usable.
 */
export function isMainCategory(categories: Category[], category: Category): boolean {
  const parent = parentOf(category);
  if (!parent || parent === category.id) return true;
  return !categories.some((c) => c.id === parent);
}

/**
 * Walks up to the level-1 category that owns this one. Returns the category
 * itself for a main category, and null for a row caught in a parent cycle
 * (which cannot be produced by this app, but must not hang the sidebar).
 */
export function mainOf(categories: Category[], id: string): Category | null {
  const byId = new Map(categories.map((c) => [c.id, c]));
  const seen = new Set<string>();

  let current = byId.get(id);
  while (current) {
    if (seen.has(current.id)) return null;
    seen.add(current.id);

    const parent = parentOf(current);
    if (!parent || parent === current.id) return current;

    const next = byId.get(parent);
    // Dangling parent: the row is effectively a main category.
    if (!next) return current;
    current = next;
  }
  return null;
}

/**
 * Level-2 rows of one main category.
 *
 * Any category whose top-level ancestor is `mainId` belongs here — including
 * rows that sit three or more levels deep in the stored data. They are shown as
 * direct subcategories of that main category (flattened, not moved), which is
 * the only way to keep their products reachable without editing records.
 */
export function subcategoriesOf(categories: Category[], mainId: string): Category[] {
  return categories
    .filter((c) => c.id !== mainId && mainOf(categories, c.id)?.id === mainId)
    .sort(compareSiblings);
}

/**
 * Flat rows -> two-level tree. A main category's `children` are its immediate
 * subcategories and never carry children of their own.
 *
 * Rows that cannot be placed — a parent cycle, or a chain hanging off one —
 * are promoted to main categories so they stay visible and editable.
 */
export function buildCategoryTree(categories: Category[]): CategoryNode[] {
  const nodes: CategoryNode[] = [];
  const placed = new Set<string>();

  for (const main of categories.filter((c) => isMainCategory(categories, c)).sort(compareSiblings)) {
    const children = subcategoriesOf(categories, main.id).map((category) => ({ category, children: [] }));
    placed.add(main.id);
    for (const child of children) placed.add(child.category.id);
    nodes.push({ category: main, children });
  }

  for (const category of categories.filter((c) => !placed.has(c.id)).sort(compareSiblings)) {
    nodes.push({ category, children: [] });
  }

  return nodes;
}

/** Depth-first flattening — used by <select> menus. Never deeper than level 2. */
export function flattenCategoryTree(nodes: CategoryNode[], depth = 0, out: CategoryOption[] = []) {
  for (const node of nodes) {
    out.push({
      category: node.category,
      depth,
      label: `${"— ".repeat(depth)}${node.category.name}`,
    });
    if (depth + 1 < MAX_CATEGORY_LEVEL) flattenCategoryTree(node.children, depth + 1, out);
  }
  return out;
}

/** Tree -> options in one call. */
export function categoryOptions(categories: Category[]): CategoryOption[] {
  return flattenCategoryTree(buildCategoryTree(categories));
}

/**
 * Which categories a selection stands for.
 *
 * - A main category shows its own products plus everything filed under its
 *   subcategories, so opening CONSTRUCTION MATERIALS does not look empty.
 * - A subcategory shows only the products assigned to it.
 *
 * Flattened legacy rows are their own selection, so their products are always
 * reachable through their own sidebar entry.
 */
export function categoryScopeIds(categories: Category[], id: string): Set<string> {
  const category = categories.find((c) => c.id === id);
  if (!category || !isMainCategory(categories, category)) return new Set([id]);

  const scope = new Set<string>([id]);
  for (const child of subcategoriesOf(categories, id)) scope.add(child.id);
  return scope;
}

/**
 * Breadcrumb chain: `[main]` for a main category, `[main, sub]` for a
 * subcategory — never three entries, even for a legacy deeper row, because the
 * sidebar presents that row as a direct subcategory of its main.
 */
export function categoryPath(categories: Category[], id: string): Category[] {
  const self = categories.find((c) => c.id === id);
  if (!self) return [];

  const main = mainOf(categories, id);
  if (!main || main.id === self.id) return [self];
  return [main, self];
}

/** "CONSTRUCTION MATERIALS / CEMENT" — the label used outside the sidebar. */
export function categoryLabel(categories: Category[], id: string, separator = " / "): string {
  return categoryPath(categories, id)
    .map((c) => c.name)
    .join(separator);
}

/**
 * Whether a new category may be filed under `parentId`:
 * null is always allowed (that creates a main category), an id only when it
 * points at a main category. This is what keeps the tree at two levels.
 */
export function canCreateUnder(categories: Category[], parentId: string | null): boolean {
  if (!parentId) return true;
  const parent = categories.find((c) => c.id === parentId);
  return Boolean(parent && isMainCategory(categories, parent));
}

/**
 * Duplicate rule: a name must be unique among its siblings only, so CEMENT can
 * exist under both CONSTRUCTION MATERIALS and something else. Names are
 * compared uppercase, the way they are stored.
 */
export function hasSiblingNamed(
  categories: Category[],
  parentId: string | null,
  name: string,
  exceptId?: string
): boolean {
  const wanted = nameKey(name);
  return categories.some(
    (c) => c.id !== exceptId && parentOf(c) === parentId && nameKey(c.name) === wanted
  );
}

/** Products a category stands for — the number the sidebar shows next to it. */
export function subtreeProductCount(
  categories: Category[],
  counts: Record<string, number>,
  categoryId: string
): number {
  let total = 0;
  for (const id of categoryScopeIds(categories, categoryId)) total += counts[id] ?? 0;
  return total;
}
