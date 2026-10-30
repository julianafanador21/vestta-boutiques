import { useCallback, useEffect, useMemo, useState } from "react";
import { CategoryManager } from "../components/CategoryManager";
import { ProductForm } from "../components/ProductForm";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import type { Category, ProductWithMeta } from "../types";

export function InventoryPage() {
  const { user, storeName, signOut } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<ProductWithMeta[]>([]);
  const [query, setQuery] = useState("");
  const [setupError, setSetupError] = useState("");
  const [editing, setEditing] = useState<ProductWithMeta | null | "new">(null);

  const load = useCallback(async () => {
    if (!user) return;
    const [{ data: cats, error: catError }, { data: items, error: prodError }] =
      await Promise.all([
        supabase.from("categories").select("*").order("name"),
        supabase
          .from("products")
          .select("*, categories(name), product_variants(*)")
          .order("created_at", { ascending: false }),
      ]);

    const message = catError?.message || prodError?.message || "";
    if (message.toLowerCase().includes("schema cache") || message.includes("does not exist")) {
      setSetupError(
        "Supabase aún no tiene las tablas de VESTTA. Ejecuta supabase/schema.sql en el SQL Editor y recarga.",
      );
    } else {
      setSetupError(message);
    }
    setCategories((cats as Category[]) ?? []);
    setProducts((items as ProductWithMeta[]) ?? []);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((item) =>
      [item.name, item.sku, item.categories?.name]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q)),
    );
  }, [products, query]);

  const totalStock = products.reduce(
    (sum, item) =>
      sum + (item.product_variants ?? []).reduce((acc, row) => acc + row.stock, 0),
    0,
  );

  async function removeProduct(id: string) {
    await supabase.from("products").delete().eq("id", id);
    await load();
  }

  return (
    <div className="shell">
      <header className="topbar">
        <div>
          <div className="wordmark" style={{ fontSize: 28 }}>
            Vestta
          </div>
          <small>{storeName}</small>
        </div>
        <button className="ghost" type="button" onClick={() => void signOut()}>
          Salir
        </button>
      </header>

      {setupError && <div className="banner">{setupError}</div>}

      <section className="stats">
        <article className="card stat">
          <span>Prendas</span>
          <strong className="serif">{products.length}</strong>
        </article>
        <article className="card stat">
          <span>Piezas en stock</span>
          <strong className="serif">{totalStock}</strong>
        </article>
        <article className="card stat">
          <span>Categorías</span>
          <strong className="serif">{categories.length}</strong>
        </article>
      </section>

      {user && (
        <CategoryManager
          userId={user.id}
          categories={categories}
          onChange={() => void load()}
        />
      )}

      <div className="toolbar">
        <input
          className="search"
          placeholder="Buscar prenda, SKU o categoría"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button className="primary" type="button" onClick={() => setEditing("new")}>
          Nueva prenda
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="card empty">
          <h2>El armario está en silencio</h2>
          <p className="meta">Añade la primera pieza con foto, color y talla.</p>
        </div>
      ) : (
        <div className="grid">
          {filtered.map((item) => {
            const colors = [
              ...new Map(
                (item.product_variants ?? []).map((row) => [
                  row.color_hex,
                  row,
                ]),
              ).values(),
            ];
            const stock = (item.product_variants ?? []).reduce(
              (acc, row) => acc + row.stock,
              0,
            );
            return (
              <article className="card product" key={item.id}>
                <div className="photo">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} />
                  ) : (
                    <div className="placeholder">Vestta</div>
                  )}
                </div>
                <div className="body">
                  <div className="meta">{item.categories?.name ?? "Sin categoría"}</div>
                  <h3>{item.name}</h3>
                  <div className="meta">
                    {item.sku ? `${item.sku} · ` : ""}
                    {stock} pzas · ${Number(item.price).toFixed(2)}
                  </div>
                  <div className="swatches">
                    {colors.map((color) => (
                      <span
                        key={color.id}
                        className="swatch"
                        title={color.color_name}
                        style={{ background: color.color_hex }}
                      />
                    ))}
                  </div>
                  <div className="row-actions">
                    <button
                      className="ghost"
                      type="button"
                      onClick={() => setEditing(item)}
                    >
                      Editar
                    </button>
                    <button
                      className="danger"
                      type="button"
                      onClick={() => void removeProduct(item.id)}
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {editing && user && (
        <ProductForm
          userId={user.id}
          categories={categories}
          product={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            void load();
          }}
        />
      )}
    </div>
  );
}
