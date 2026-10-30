import { supabase } from "./supabase";

export async function resolveImage(
  userId: string,
  file: File | null,
  url: string,
): Promise<string | null> {
  const trimmed = url.trim();
  if (file) {
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from("product-images")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (error) {
      throw new Error(
        error.message.includes("Bucket")
          ? "El bucket product-images no existe. Ejecuta supabase/schema.sql."
          : error.message,
      );
    }
    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    return data.publicUrl;
  }
  return trimmed || null;
}
