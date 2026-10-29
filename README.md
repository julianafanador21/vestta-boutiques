# VESTTA

Mini-app de inventario para boutiques. Estética Ruby Rose, datos por tienda con Supabase Auth.

## Arranque

```bash
npm install
npm run dev
```

Abre la URL que imprime Vite (normalmente `http://localhost:5173`).

## Supabase (obligatorio una vez)

1. Entra al proyecto en [Supabase](https://supabase.com/dashboard).
2. SQL Editor → pega y ejecuta `supabase/schema.sql`.
3. Authentication → Providers: deja Email habilitado.
4. Si quieres evitar confirmar correo en desarrollo: Authentication → Providers → Email → desactiva *Confirm email*.

Las credenciales viven en `.env` (`VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`).

Cada cuenta es una tienda: RLS filtra categorías, prendas y variantes por `auth.uid()`.

## Fotos

- Pega una URL, o
- Sube un archivo al bucket público `product-images` (lo crea el SQL).
