import { FormEvent, useMemo, useState } from "react";
import { resolveImage } from "../lib/images";
import { supabase } from "../lib/supabase";
import {
  DEFAULT_SIZES,
  type Category,
  type ColorDraft,
  type ProductWithMeta,
} from "../types";

type Props = {
  userId: string;
  categories: Category[];
  product?: ProductWithMeta | null;
  onClose: () => void;
  onSaved: () => void;
};

function emptyColor(): ColorDraft {
  return {
    key: crypto.randomUUID(),
    color_name: "Ruby",
    color_hex: "#8E2A3F",
    image_url: "",
    sizes: DEFAULT_SIZES.map((size) => ({ size, stock: 0 })),
  };
}

function draftsFromProduct(product?: ProductWithMeta | null): ColorDraft[] {
  if (!product?.product_variants?.length) return [emptyColor()];
  const grouped = new Map<string, ColorDraft>();
  for (const variant of product.product_variants) {
    const key = `${variant.color_name}-${variant.color_hex}`;
    const current = grouped.get(key) ?? {
      key,
      color_name: variant.color_name,
      color_hex: variant.color_hex,
      image_url: variant.image_url ?? "",
      sizes: DEFAULT_SIZES.map((size) => ({ size, stock: 0 })),
    };
    const sizeRow = current.sizes.find((row) => row.size === variant.size);
    if (sizeRow) sizeRow.stock = variant.stock;
    else current.sizes.push({ size: variant.size, stock: variant.stock });
    grouped.set(key, current);
  }
  return [...grouped.values()];
}

export function ProductForm({
  userId,
  categories,
  product,
  onClose,
  onSaved,
}: Props) {
  const [name, setName] = useState(product?.name ?? "");
  const [sku, setSku] = useState(product?.sku ?? "");
  const [price, setPrice] = useState(String(product?.price ?? "0"));
  const [description, setDescription] = useState(product?.description ?? "");
  const [categoryId, setCategoryId] = useState(product?.category_id ?? "");
  const [imageUrl, setImageUrl] = useState(product?.image_url ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [colors, setColors] = useState<ColorDraft[]>(() =>
    draftsFromProduct(product),
  );
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const preview = useMemo(() => {
    if (file) return URL.createObjectURL(file);
    return imageUrl;
  }, [file, imageUrl]);

  function updateColor(key: string, patch: Partial<ColorDraft>) {
    setColors((rows) =>
      rows.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    );
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setNotice("");
    try {
      const publicUrl = await resolveImage(userId, file, imageUrl);
      const payload = {
        user_id: userId,
        name: name.trim(),
        sku: sku.trim() || null,
        description: description.trim() || null,
        price: Number(price) || 0,
        category_id: categoryId || null,
        image_url: publicUrl,
      };

      let productId = product?.id;
      if (productId) {
        const { error } = await supabase
          .from("products")
          .update(payload)
          .eq("id", productId);
        if (error) throw error;
        await supabase.from("product_variants").delete().eq("product_id", productId);
      } else {
        const { data, error } = await supabase
          .from("products")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;
        productId = data.id;
      }

      const variants = colors.flatMap((color) =>
        color.sizes
          .filter((row) => row.stock >= 0 && row.size.trim())
          .map((row) => ({
            product_id: productId,
            user_id: userId,
            color_name: color.color_name.trim() || "Sin nombre",
            color_hex: color.color_hex || "#8E2A3F",
            size: row.size.trim(),
            stock: Number(row.stock) || 0,
            image_url: color.image_url.trim() || null,
          })),
      );

      if (variants.length) {
        const { error } = await supabase.from("product_variants").insert(variants);
        if (error) throw error;
      }
      onSaved();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "No se pudo guardar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="toolbar">
          <h2 style={{ margin: 0, fontSize: 32 }}>
            {product ? "Editar prenda" : "Nueva prenda"}
          </h2>
          <button className="ghost" type="button" onClick={onClose}>
            Cerrar
          </button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="field">
            <label>Nombre</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="inline">
            <div className="field">
              <label>SKU</label>
              <input value={sku} onChange={(e) => setSku(e.target.value)} />
            </div>
            <div className="field">
              <label>Precio</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
          </div>
          <div className="field">
            <label>Categoría</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">Sin categoría</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Descripción</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="field">
            <label>Foto (URL)</label>
            <input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://…"
            />
          </div>
          <div className="field">
            <label>O subir archivo</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>
          {preview && (
            <div className="photo" style={{ marginBottom: 16, borderRadius: 14, overflow: "hidden" }}>
              <img src={preview} alt="Vista previa" />
            </div>
          )}

          <h3>Colores y tallas</h3>
          {colors.map((color) => (
            <div className="color-block" key={color.key}>
              <div className="inline">
                <div className="field">
                  <label>Color</label>
                  <input
                    value={color.color_name}
                    onChange={(e) =>
                      updateColor(color.key, { color_name: e.target.value })
                    }
                  />
                </div>
                <div className="field">
                  <label>Hex</label>
                  <input
                    type="color"
                    value={color.color_hex}
                    onChange={(e) =>
                      updateColor(color.key, { color_hex: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="field">
                <label>Foto de este color (URL)</label>
                <input
                  value={color.image_url}
                  onChange={(e) =>
                    updateColor(color.key, { image_url: e.target.value })
                  }
                />
              </div>
              {color.sizes.map((row, index) => (
                <div className="size-row" key={row.size}>
                  <input
                    value={row.size}
                    onChange={(e) => {
                      const sizes = color.sizes.map((item, i) =>
                        i === index ? { ...item, size: e.target.value } : item,
                      );
                      updateColor(color.key, { sizes });
                    }}
                  />
                  <input
                    type="number"
                    min="0"
                    value={row.stock}
                    onChange={(e) => {
                      const sizes = color.sizes.map((item, i) =>
                        i === index
                          ? { ...item, stock: Number(e.target.value) }
                          : item,
                      );
                      updateColor(color.key, { sizes });
                    }}
                  />
                </div>
              ))}
              <button
                className="linkish"
                type="button"
                onClick={() =>
                  setColors((rows) => rows.filter((row) => row.key !== color.key))
                }
              >
                Quitar color
              </button>
            </div>
          ))}
          <button
            className="ghost"
            type="button"
            onClick={() => setColors((rows) => [...rows, emptyColor()])}
          >
            Añadir color
          </button>
          <p className="notice">{notice}</p>
          <button className="primary full" disabled={busy} type="submit">
            {busy ? "Guardando…" : "Guardar prenda"}
          </button>
        </form>
      </aside>
    </div>
  );
}
