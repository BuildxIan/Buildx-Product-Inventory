"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { LogOut, Menu, Package } from "lucide-react";
import { supabase, isConfigured, BUCKET } from "@/lib/supabase";
import { compressImage, originalExtension } from "@/lib/image";
import type { Category, Product, Shop } from "@/lib/types";
import Sidebar from "./Sidebar";
import Navbar, { type Mode } from "./Navbar";
import ProductCard from "./ProductCard";
import ProductModal from "./ProductModal";
import ProductForm, { type FormValues } from "./ProductForm";
import ConfirmDialog from "./ConfirmDialog";
import ShopModal from "./ShopModal";
import ShopDeleteDialog from "./ShopDeleteDialog";

type FormState = { product?: Product } | null;

export default function CatalogApp({ initialAuthed }: { initialAuthed: boolean }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  /** False until the optional `code` column exists, so the form can stay usable. */
  const [hasCodeColumn, setHasCodeColumn] = useState(true);
  /** False until `product_images.original_path` exists — new uploads then skip it. */
  const [hasOriginalColumn, setHasOriginalColumn] = useState(false);

  // Seeded from the server render, so admin controls never flicker on load.
  const [authed, setAuthed] = useState(initialAuthed);
  const isAdmin = authed;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [shopFilter, setShopFilter] = useState("");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const [mode, setMode] = useState<Mode>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [openProductId, setOpenProductId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(null);
  const [deleteTargets, setDeleteTargets] = useState<Product[] | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [showShopModal, setShowShopModal] = useState(false);
  const [shopToDelete, setShopToDelete] = useState<Shop | null>(null);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");

  const flash = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  }, []);

  // Sidebar starts open on desktop, closed on phones.
  useEffect(() => {
    setSidebarOpen(window.innerWidth >= 768);
  }, []);

  // Auth — the server already checked this; we only track later changes
  // (token refresh, sign-out in another tab).
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAuthed(Boolean(data.session)));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => {
      setAuthed(Boolean(s));
      if (!s) {
        setMode(null);
        setSelected(new Set());
      }
    });
    return () => data.subscription.unsubscribe();
  }, []);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim().toLowerCase()), 250);
    return () => clearTimeout(t);
  }, [query]);

  const loadAll = useCallback(async () => {
    if (!isConfigured) {
      setLoading(false);
      return;
    }
    const [c, s, p] = await Promise.all([
      supabase.from("categories").select("*").order("sort_order").order("created_at"),
      supabase.from("shops").select("*").order("name"),
      supabase
        .from("products")
        .select("*, product_images(*), product_variants(*)")
        .order("created_at", { ascending: false }),
    ]);
    const err = c.error || s.error || p.error;
    if (err) setLoadError(err.message);
    else setLoadError("");
    const rows = ((p.data as unknown) as Product[]) ?? [];

    // Both extra columns are optional. select("*") omits a column that doesn't
    // exist yet, so read them off the rows rather than spending a request on a
    // probe that would only come back 400.
    if (rows.length > 0) setHasCodeColumn(Object.prototype.hasOwnProperty.call(rows[0], "code"));

    const firstImage = rows.find((r) => r.product_images?.length)?.product_images[0];
    if (firstImage) {
      setHasOriginalColumn(Object.prototype.hasOwnProperty.call(firstImage, "original_path"));
    } else if (rows.length > 0) {
      // No photos anywhere yet, so there is no row to inspect. Ask once — a
      // schema error means the migration hasn't run.
      const probe = await supabase.from("product_images").select("original_path").limit(1);
      setHasOriginalColumn(!probe.error);
    }

    setCategories((c.data as Category[]) ?? []);
    setShops((s.data as Shop[]) ?? []);
    setProducts(rows);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // A deleted shop can't stay selected in the filter.
  useEffect(() => {
    if (shopFilter && !shops.some((s) => s.id === shopFilter)) setShopFilter("");
  }, [shops, shopFilter]);

  const catName = useMemo(() => new Map(categories.map((c) => [c.id, c.name])), [categories]);
  const shopName = useMemo(() => new Map(shops.map((s) => [s.id, s.name])), [shops]);

  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const p of products) if (p.category_id) m[p.category_id] = (m[p.category_id] ?? 0) + 1;
    return m;
  }, [products]);

  const shopCounts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const p of products) if (p.shop_id) m[p.shop_id] = (m[p.shop_id] ?? 0) + 1;
    return m;
  }, [products]);

  // Category and shop are hard filters; the search runs on top of them and looks at
  // every stored field (name, code, variations, description, notes, shop, category).
  const visible = useMemo(() => {
    const terms = debouncedQuery ? debouncedQuery.split(/\s+/).filter(Boolean) : [];
    return products.filter((p) => {
      if (shopFilter && p.shop_id !== shopFilter) return false;
      if (categoryId && p.category_id !== categoryId) return false;
      if (terms.length === 0) return true;

      const hay = [
        p.name,
        p.code ?? "",
        p.description ?? "",
        p.notes ?? "",
        p.shop_id ? shopName.get(p.shop_id) ?? "" : "",
        p.category_id ? catName.get(p.category_id) ?? "" : "",
        ...p.product_variants.flatMap((v) => [
          v.label,
          v.color_hex ?? "",
          v.price != null ? String(v.price) : "",
        ]),
      ]
        .join(" ")
        .toLowerCase();

      return terms.every((t) => hay.includes(t));
    });
  }, [products, shopFilter, debouncedQuery, categoryId, shopName, catName]);

  const openProduct = products.find((p) => p.id === openProductId) ?? null;

  // ---------- Categories ----------
  // Category names are stored uppercase; errors bubble up to the modal that called this.
  // Returns the created row so callers (e.g. the product form) can select it.
  async function addCategory(name: string): Promise<Category | null> {
    const upper = name.trim().toUpperCase();
    const next = categories.reduce((m, c) => Math.max(m, c.sort_order), 0) + 1;
    const { data, error } = await supabase
      .from("categories")
      .insert({ name: upper, sort_order: next })
      .select("id, name, sort_order")
      .single();
    if (error) throw new Error(error.message);
    await loadAll();
    return (data as Category) ?? null;
  }

  async function renameCategory(id: string, name: string) {
    const upper = name.trim().toUpperCase();
    const { error } = await supabase.from("categories").update({ name: upper }).eq("id", id);
    if (error) throw new Error(error.message);
    await loadAll();
  }

  async function confirmDeleteCategory() {
    if (!categoryToDelete) return;
    setBusy(true);
    const { error } = await supabase.from("categories").delete().eq("id", categoryToDelete.id);
    setBusy(false);
    if (error) return flash(error.message);
    if (categoryId === categoryToDelete.id) setCategoryId(null);
    setCategoryToDelete(null);
    await loadAll();
  }

  // ---------- Shops ----------
  // One creation path for both the header dropdown and the product form. It
  // only writes the row and reloads; selecting the result is the caller's job.
  async function createShop(name: string): Promise<Shop | null> {
    const clean = name.trim().replace(/\s+/g, " ");
    const { data, error } = await supabase
      .from("shops")
      .insert({ name: clean })
      .select("id, name")
      .single();
    if (error) throw new Error(error.message);

    const created = (data as Shop) ?? null;
    await loadAll();
    if (created) flash(`Shop "${created.name}" added.`);
    return created;
  }

  /** Header flow: after creating, filter the catalog by the new shop. */
  async function addShopFromHeader(name: string): Promise<Shop | null> {
    const created = await createShop(name);
    if (created) setShopFilter(created.id);
    return created;
  }

  /**
   * Removes a shop without touching its products: they are explicitly moved to
   * the chosen shop (or to "No shop") *before* the row is deleted, so nothing is
   * left pointing at a missing shop. Callers close their own dialog.
   */
  async function deleteShop(shop: Shop, reassignTo: string | null) {
    const affected = products.filter((p) => p.shop_id === shop.id);

    if (affected.length > 0) {
      const { error } = await supabase
        .from("products")
        .update({ shop_id: reassignTo })
        .in(
          "id",
          affected.map((p) => p.id)
        );
      if (error) throw new Error(`Could not move the products: ${error.message}`);
    }

    const { error } = await supabase.from("shops").delete().eq("id", shop.id);
    if (error) throw new Error(error.message);

    if (shopFilter === shop.id) setShopFilter("");
    await loadAll();
    flash(
      affected.length > 0
        ? `Shop removed. ${affected.length} product${affected.length === 1 ? "" : "s"} moved.`
        : `Shop "${shop.name}" removed.`
    );
  }

  // ---------- Products ----------
  async function saveProduct(values: FormValues, existing?: Product) {
    // The form now creates shops through the modal, so it only ever submits an
    // existing shop id.
    const shopId = values.shop_id;

    // 2. product row. `source_url` is intentionally not written: the listing link is
    // no longer part of the UI, and leaving it out keeps any stored value intact.
    const row = {
      name: values.name,
      price: values.price,
      category_id: values.category_id,
      shop_id: shopId,
      description: values.description || null,
      notes: values.notes || null,
      ...(hasCodeColumn ? { code: values.code.trim() || null } : {}),
    };
    let productId = existing?.id;
    if (existing) {
      const { error } = await supabase.from("products").update(row).eq("id", existing.id);
      if (error) throw error;
    } else {
      const { data, error } = await supabase.from("products").insert(row).select("id").single();
      if (error) throw error;
      productId = data.id as string;
    }
    if (!productId) throw new Error("Could not save product.");

    // 3. photos: remove the ones taken out, re-number the ones kept, upload new ones
    if (existing) {
      const keptIds = new Set(values.keptImages.map((i) => i.id));
      const removed = existing.product_images.filter((i) => !keptIds.has(i.id));
      if (removed.length) {
        // Take the original upload with it when there is one.
        await supabase.storage
          .from(BUCKET)
          .remove(removed.flatMap((i) => (i.original_path ? [i.path, i.original_path] : [i.path])));
        const { error } = await supabase
          .from("product_images")
          .delete()
          .in(
            "id",
            removed.map((i) => i.id)
          );
        if (error) throw error;
      }
      for (let i = 0; i < values.keptImages.length; i++) {
        const img = values.keptImages[i];
        if (img.position !== i) {
          await supabase.from("product_images").update({ position: i }).eq("id", img.id);
        }
      }
    }
    const offset = values.keptImages.length;
    for (let i = 0; i < values.newFiles.length; i++) {
      const file = values.newFiles[i];
      const stamp = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

      // 1. Optimised copy — this is what the cards and the detail view load.
      const display = await compressImage(file);
      const displayPath = `${productId}/${stamp}.jpg`;
      const up = await supabase.storage.from(BUCKET).upload(displayPath, display, {
        contentType: "image/jpeg",
        cacheControl: "31536000",
      });
      if (up.error) throw up.error;

      // 2. The untouched upload, stored next to it. Only when the database has
      //    the `original_path` column; existing rows and files are never touched.
      let originalPath: string | null = null;
      if (hasOriginalColumn) {
        originalPath = `${productId}/${stamp}-original.${originalExtension(file)}`;
        const upOriginal = await supabase.storage.from(BUCKET).upload(originalPath, file, {
          contentType: file.type || "image/jpeg",
          cacheControl: "31536000",
        });
        if (upOriginal.error) throw upOriginal.error;
      }

      const { error } = await supabase.from("product_images").insert({
        product_id: productId,
        path: displayPath,
        position: offset + i,
        ...(hasOriginalColumn ? { original_path: originalPath } : {}),
      });
      if (error) throw error;
    }

    // 4. variations: replace all
    if (existing) {
      const { error } = await supabase.from("product_variants").delete().eq("product_id", productId);
      if (error) throw error;
    }
    if (values.variants.length) {
      const { error } = await supabase.from("product_variants").insert(
        values.variants.map((v, i) => ({
          product_id: productId,
          label: v.label,
          color_hex: v.color_hex,
          price: v.price,
          position: i,
        }))
      );
      if (error) throw error;
    }

    await loadAll();
    setForm(null);
    setMode(null);
    flash(existing ? "Product updated." : "Product added.");
  }

  async function confirmDeleteProducts() {
    if (!deleteTargets) return;
    setBusy(true);
    try {
      const paths = deleteTargets.flatMap((p) =>
        p.product_images.flatMap((i) => (i.original_path ? [i.path, i.original_path] : [i.path]))
      );
      if (paths.length) await supabase.storage.from(BUCKET).remove(paths);
      const { error } = await supabase
        .from("products")
        .delete()
        .in(
          "id",
          deleteTargets.map((p) => p.id)
        );
      if (error) throw error;
      flash(`Deleted ${deleteTargets.length} product${deleteTargets.length > 1 ? "s" : ""}.`);
      setDeleteTargets(null);
      setSelected(new Set());
      setMode(null);
      setOpenProductId(null);
      await loadAll();
    } catch (err) {
      flash(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setBusy(false);
    }
  }

  function onCardClick(p: Product) {
    if (mode === "edit") return setForm({ product: p });
    if (mode === "delete") {
      return setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(p.id)) next.delete(p.id);
        else next.add(p.id);
        return next;
      });
    }
    setOpenProductId(p.id);
  }

  function changeMode(m: Mode) {
    setMode(m);
    setSelected(new Set());
  }

  async function logout() {
    setBusy(true);
    await supabase.auth.signOut();
    setBusy(false);
    setConfirmLogout(false);
    // Full navigation so the server re-runs the middleware with no session.
    window.location.assign("/login");
  }

  // ---------- Render ----------
  if (!isConfigured) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-lg items-center p-6">
        <div className="w-full rounded-md border border-ink-line bg-surface p-6 shadow-panel">
          <span className="mb-4 flex h-11 w-11 items-center justify-center rounded bg-brand text-brand-fg">
            <Package size={20} />
          </span>
          <h1 className="font-display text-xl font-bold uppercase tracking-wide text-ink">
            Supabase is not connected yet
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            Copy <code className="rounded bg-surface-alt px-1 py-0.5 text-xs">.env.local.example</code> to{" "}
            <code className="rounded bg-surface-alt px-1 py-0.5 text-xs">.env.local</code>, fill in your project
            URL and anon key, then restart the dev server. The README has the full steps.
          </p>
        </div>
      </main>
    );
  }

  // Categories display uppercase everywhere (sidebar, dropdowns), so the search
  // scope does too — the stored name of older rows may be lowercase.
  const scopeName = categoryId ? (catName.get(categoryId) ?? "").toUpperCase() || null : null;
  const heading = debouncedQuery
    ? scopeName
      ? `"${query.trim()}" in ${scopeName}`
      : `Search results for "${query.trim()}"`
    : scopeName ?? "All products";

  return (
    <div className="flex h-dvh overflow-hidden">
      <Sidebar
        categories={categories}
        counts={counts}
        total={products.length}
        selectedId={categoryId}
        isAdmin={isAdmin}
        open={sidebarOpen}
        onSelect={setCategoryId}
        onClose={() => setSidebarOpen(false)}
        onAdd={addCategory}
        onRename={renameCategory}
        onDelete={setCategoryToDelete}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar
          query={query}
          onQuery={setQuery}
          searchScope={scopeName}
          shops={shops}
          shopCounts={shopCounts}
          totalProducts={products.length}
          shopFilter={shopFilter}
          onShopFilter={setShopFilter}
          onDeleteShop={setShopToDelete}
          onAddShop={() => setShowShopModal(true)}
          mode={mode}
          onMode={changeMode}
          onAdd={() => setForm({})}
          isAdmin={isAdmin}
          onLogout={() => setConfirmLogout(true)}
        />

        {mode && (
          <div
            className={`flex items-center justify-between gap-2 border-b px-3 py-2 text-[13px] font-medium lg:px-5 ${
              mode === "delete"
                ? "border-danger/20 bg-danger-soft text-danger"
                : "border-ink-line bg-surface-alt text-ink"
            }`}
          >
            <span>
              {mode === "edit"
                ? "Edit mode: tap a product to edit it."
                : `Delete mode: tap products to select (${selected.size} selected).`}
            </span>
            <div className="flex gap-2">
              {mode === "delete" && (
                <button
                  className="btn-danger px-2.5 py-1 text-xs"
                  disabled={selected.size === 0}
                  onClick={() => setDeleteTargets(products.filter((p) => selected.has(p.id)))}
                >
                  Delete ({selected.size})
                </button>
              )}
              <button className="btn-ghost px-2.5 py-1 text-xs" onClick={() => changeMode(null)}>
                Done
              </button>
            </div>
          </div>
        )}

        {/* No side gutter needed any more — the toggle lives in the page header. */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-5 xl:p-6">
          <div className="mb-3 flex items-center justify-between gap-3 lg:mb-4">
            <div className="flex min-w-0 items-center gap-2.5 lg:gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen((v) => !v)}
                aria-label={sidebarOpen ? "Hide categories" : "Show categories"}
                aria-expanded={sidebarOpen}
                aria-controls="category-sidebar"
                title={sidebarOpen ? "Hide categories" : "Show categories"}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded border border-ink-line bg-surface text-ink transition-colors hover:border-ink-mist hover:bg-surface-alt active:bg-surface-alt lg:h-11 lg:w-11"
              >
                <Menu size={18} strokeWidth={1.9} />
              </button>
              <div className="min-w-0">
                <h1
                  className={`truncate font-display text-[22px] font-bold leading-none tracking-wide text-ink sm:text-2xl lg:text-[30px] ${
                    debouncedQuery ? "" : "uppercase"
                  }`}
                >
                  {heading}
                </h1>
              </div>
            </div>
            <span className="shrink-0 text-xs font-medium text-ink-faint lg:text-sm">
              {visible.length} {visible.length === 1 ? "item" : "items"}
            </span>
          </div>

          {loadError && (
            <p className="mb-3 rounded border border-danger/25 bg-danger-soft p-3 text-sm text-danger">
              Could not load data: {loadError}. Did you run <code>supabase/schema.sql</code>?
            </p>
          )}

          {loading ? (
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-[repeat(auto-fill,minmax(190px,1fr))] lg:gap-4 lg:grid-cols-[repeat(auto-fill,minmax(215px,1fr))]">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="overflow-hidden rounded-md border border-ink-line bg-surface"
                >
                  <div className="aspect-square w-full animate-pulse bg-surface-alt" />
                  <div className="space-y-2 p-3">
                    <div className="h-2.5 w-1/3 animate-pulse rounded-sm bg-surface-alt" />
                    <div className="h-3 w-full animate-pulse rounded-sm bg-surface-alt" />
                    <div className="h-3 w-2/3 animate-pulse rounded-sm bg-surface-alt" />
                  </div>
                </div>
              ))}
            </div>
          ) : visible.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-ink-mist bg-surface/60 px-6 py-16 text-center">
              <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-surface-alt text-ink-faint">
                <Package size={22} />
              </span>
              <p className="text-sm font-semibold text-ink">
                {products.length === 0 ? "No products yet" : "No products found"}
              </p>
              <p className="mt-1 max-w-xs text-[13px] text-ink-faint">
                {products.length === 0
                  ? "Tap the + button in the header to add your first product."
                  : "Try a different search term, category or shop filter."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-[repeat(auto-fill,minmax(190px,1fr))] lg:gap-4 lg:grid-cols-[repeat(auto-fill,minmax(215px,1fr))] xl:grid-cols-[repeat(auto-fill,minmax(245px,1fr))] 2xl:grid-cols-[repeat(auto-fill,minmax(270px,1fr))]">
              {visible.map((p, i) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  categoryName={p.category_id ? catName.get(p.category_id) : undefined}
                  shopName={p.shop_id ? shopName.get(p.shop_id) : undefined}
                  index={i}
                  selectMode={mode === "delete"}
                  selected={selected.has(p.id)}
                  onClick={() => onCardClick(p)}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {openProduct && !form && (
        <ProductModal
          key={openProduct.id}
          product={openProduct}
          shop={openProduct.shop_id ? shops.find((s) => s.id === openProduct.shop_id) : undefined}
          category={openProduct.category_id ? categories.find((c) => c.id === openProduct.category_id) : undefined}
          isAdmin={isAdmin}
          onClose={() => setOpenProductId(null)}
          onEdit={() => setForm({ product: openProduct })}
          onDelete={() => setDeleteTargets([openProduct])}
        />
      )}

      {form && (
        <ProductForm
          product={form.product}
          categories={categories}
          shops={shops}
          shopCounts={shopCounts}
          defaultCategoryId={categoryId}
          codeEnabled={hasCodeColumn}
          onAddCategory={addCategory}
          onAddShop={createShop}
          onDeleteShop={deleteShop}
          onSubmit={(v) => saveProduct(v, form.product)}
          onClose={() => setForm(null)}
        />
      )}

      {deleteTargets && (
        <ConfirmDialog
          title="Delete products"
          message={
            deleteTargets.length === 1
              ? `Delete "${deleteTargets[0].name}" and its photos? This cannot be undone.`
              : `Delete ${deleteTargets.length} products and their photos? This cannot be undone.`
          }
          busy={busy}
          onConfirm={confirmDeleteProducts}
          onCancel={() => setDeleteTargets(null)}
        />
      )}

      {categoryToDelete && (
        <ConfirmDialog
          title="Delete category"
          message={
            (counts[categoryToDelete.id] ?? 0) > 0
              ? `"${categoryToDelete.name.toUpperCase()}" has ${counts[categoryToDelete.id]} product(s). They will not be deleted; they become Uncategorized.`
              : `Delete the category "${categoryToDelete.name.toUpperCase()}"?`
          }
          busy={busy}
          onConfirm={confirmDeleteCategory}
          onCancel={() => setCategoryToDelete(null)}
        />
      )}

      {showShopModal && (
        <ShopModal shops={shops} onSave={addShopFromHeader} onClose={() => setShowShopModal(false)} />
      )}

      {shopToDelete && (
        <ShopDeleteDialog
          shop={shopToDelete}
          productCount={shopCounts[shopToDelete.id] ?? 0}
          otherShops={shops.filter((s) => s.id !== shopToDelete.id)}
          onConfirm={async (reassignTo) => {
            await deleteShop(shopToDelete, reassignTo);
            setShopToDelete(null);
          }}
          onCancel={() => setShopToDelete(null)}
        />
      )}

      {confirmLogout && (
        <ConfirmDialog
          title="Log out"
          message="Are you sure you want to log out?"
          confirmLabel="Log Out"
          tone="primary"
          icon={<LogOut size={19} />}
          busy={busy}
          onConfirm={logout}
          onCancel={() => setConfirmLogout(false)}
        />
      )}

      {toast && (
        <div className="fixed bottom-4 left-1/2 z-[60] -translate-x-1/2 animate-rise rounded bg-brand px-4 py-2.5 text-sm font-medium text-brand-fg shadow-lift">
          {toast}
        </div>
      )}
    </div>
  );
}
