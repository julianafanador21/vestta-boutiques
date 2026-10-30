import { FormEvent, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Category } from "../types";

type Props = {
  userId: string;
  categories: Category[];
  onChange: () => void;
};

export function CategoryManager({ userId, categories, onChange }: Props) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  async function addCategory(event: FormEvent) {
    event.preventDefault();
    setError("");
    const { error: insertError } = await supabase.from("categories").insert({
      user_id: userId,
      name: name.trim(),
    });
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setName("");
    onChange();
  }

  async function remove(id: string) {
    await supabase.from("categories").delete().eq("id", id);
    onChange();
  }

  return (
    <section className="card" style={{ padding: 18, marginBottom: 22 }}>
      <h2 style={{ margin: "0 0 12px", fontSize: 28 }}>Categorías</h2>
      <form onSubmit={addCategory} className="toolbar" style={{ marginBottom: 12 }}>
        <input
          className="search"
          placeholder="Vestidos, blusas, abrigos…"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <button className="primary" type="submit">
          Añadir
        </button>
      </form>
      <p className="notice">{error}</p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {categories.map((category) => (
          <span
            key={category.id}
            className="ghost"
            style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
          >
            {category.name}
            <button
              className="linkish"
              type="button"
              onClick={() => remove(category.id)}
              aria-label={`Eliminar ${category.name}`}
            >
              ×
            </button>
          </span>
        ))}
        {categories.length === 0 && (
          <span className="meta">Sin categorías todavía.</span>
        )}
      </div>
    </section>
  );
}
