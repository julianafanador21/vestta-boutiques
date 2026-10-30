export type Category = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
};

export type Product = {
  id: string;
  user_id: string;
  category_id: string | null;
  name: string;
  sku: string | null;
  description: string | null;
  price: number;
  image_url: string | null;
  created_at: string;
};

export type ProductVariant = {
  id: string;
  product_id: string;
  user_id: string;
  color_name: string;
  color_hex: string;
  size: string;
  stock: number;
  image_url: string | null;
};

export type ProductWithMeta = Product & {
  categories: { name: string } | null;
  product_variants: ProductVariant[];
};

export type ColorDraft = {
  key: string;
  color_name: string;
  color_hex: string;
  image_url: string;
  sizes: { size: string; stock: number }[];
};

export const DEFAULT_SIZES = ["XS", "S", "M", "L", "XL"] as const;
