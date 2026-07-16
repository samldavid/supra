# SupraQuím — Catálogo, carrito y administración

Aplicación web de SupraQuím para publicar productos químicos, recibir pedidos por WhatsApp y administrar el catálogo desde un panel protegido.

## Stack

- Next.js 15 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Supabase PostgreSQL, Auth, Storage y RLS
- Carrito en React Context con persistencia temporal en `localStorage`

## Requisitos

- Node.js 20.9 o superior
- pnpm
- Proyecto Supabase
- Git

## Instalación local

```powershell
pnpm install
pnpm dev
```

Abrir:

```txt
http://localhost:3000
```

## Variables de entorno

Copia `.env.example` a `.env.local` y configura:

```txt
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_WHATSAPP_NUMBER=573226450404
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SUPABASE_PRODUCT_IMAGES_BUCKET=product-images
SUPABASE_SERVICE_ROLE_KEY=
```

Notas:

- `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` pueden ser públicas si las políticas RLS están aplicadas.
- `SUPABASE_SERVICE_ROLE_KEY` es solo para scripts administrativos como seed. Nunca debe exponerse en el navegador ni subirse al repositorio.
- No subas `.env.local`, `.env` ni claves privadas.

## Configurar Supabase

1. Crea un proyecto en Supabase.
2. Abre el SQL Editor.
3. Ejecuta la migración:

```txt
supabase/migrations/202607160001_create_admin_products.sql
```

Esta migración crea:

- `public.products`
- `public.admin_profiles`
- función `public.is_admin`
- políticas RLS para lectura pública de productos activos
- políticas RLS para CRUD exclusivo de administradores
- bucket público `product-images`
- políticas de Storage para lectura pública y escritura administrativa

## Migrar productos existentes

Después de configurar `.env.local` con `NEXT_PUBLIC_SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`, ejecuta:

```powershell
pnpm seed:products
```

Esto inserta/actualiza los productos actuales desde `src/data/generated-products.json` hacia Supabase.

## Crear administrador de forma segura

No existe registro público.

1. En Supabase, crea el usuario administrador desde Auth.
2. Copia su UUID.
3. Ejecuta en SQL Editor:

```sql
insert into public.admin_profiles (user_id, role)
values ('UUID_DEL_USUARIO', 'admin')
on conflict (user_id) do update set role = 'admin';
```

No guardes contraseñas ni usuarios administrativos en el código.

## Desarrollo

```powershell
pnpm dev
```

El script de desarrollo sincroniza tarjetas desde `catalogo/` antes de iniciar Next.js.

## Build de producción

```powershell
pnpm build
pnpm start
```

`pnpm build` ejecuta antes:

```powershell
pnpm sync:products
```

## Carrito

El carrito permite:

- Añadir productos desde tarjetas y fichas.
- Aumentar/disminuir cantidades.
- Eliminar productos.
- Vaciar el carrito.
- Mantener el carrito al recargar con `localStorage`.
- Ver subtotales y total estimado.

El carrito no procesa pagos. El pedido se envía por WhatsApp para confirmar disponibilidad, envío y precio final.

## Pedido por WhatsApp

El enlace se genera con `https://wa.me/` y `encodeURIComponent`.

El mensaje incluye:

- Nombre del producto.
- Presentación.
- Cantidad.
- Precio unitario.
- Subtotal.
- Total estimado.
- Nota de confirmación por SupraQuím.

El número se centraliza en:

```txt
NEXT_PUBLIC_WHATSAPP_NUMBER
```

## Acceso administrativo

Ruta:

```txt
/login
```

Incluye:

- Correo.
- Contraseña.
- Validación.
- Estado de carga.
- Mensajes de error.
- Redirección a `/admin` si el usuario es administrador.

## Panel administrativo

Ruta protegida:

```txt
/admin
```

Comportamiento:

- Sin sesión: redirige a `/login`.
- Con sesión sin rol admin: bloquea acceso.
- Con rol admin: permite gestionar productos.

Funcionalidades:

- Dashboard con conteos.
- Listado de productos.
- Búsqueda.
- Filtro por categoría.
- Filtro por estado.
- Crear productos.
- Editar productos.
- Activar/desactivar productos.
- Eliminar con confirmación.
- Subir imágenes PNG, JPG o WebP hasta 5 MB.

Las operaciones CRUD se ejecutan por API routes protegidas y RLS en Supabase.

## Imágenes

Las imágenes históricas siguen en:

```txt
public/productos
```

Las nuevas imágenes subidas desde `/admin` se guardan en Supabase Storage en el bucket:

```txt
product-images
```

## Pruebas y validación

Comandos disponibles:

```powershell
pnpm lint
pnpm test
pnpm build
```

Las pruebas cubren:

- Normalización de cantidades del carrito.
- Añadir y acumular productos.
- Actualizar y eliminar productos.
- Parsear carrito desde almacenamiento.
- Generar mensaje de WhatsApp con subtotales y total.

Las pruebas de CRUD real requieren Supabase configurado y un usuario administrador válido.

## Seguridad

- No hay registro público.
- `/admin` no aparece en menús públicos ni sitemap.
- `robots.txt` desaconseja indexar `/admin` y `/login`.
- La autorización real depende de Supabase Auth + `admin_profiles` + RLS.
- La clave `service_role` solo se usa en scripts administrativos.
- Las cargas de imagen validan tipo y tamaño.
- React escapa contenido renderizado del catálogo.

## Recuperar o cambiar contraseña

Gestiona recuperación y cambio de contraseña desde Supabase Auth:

1. En Supabase, habilita el proveedor Email.
2. Usa el panel de Supabase para enviar recuperación.
3. Mantén la URL pública correcta en la configuración de Auth.

## Despliegue

En producción configura las mismas variables de entorno en el proveedor de hosting.

Antes de desplegar:

```powershell
pnpm lint
pnpm test
pnpm build
```

Después:

1. Ejecuta migración en Supabase.
2. Ejecuta `pnpm seed:products` localmente o desde un entorno seguro.
3. Crea el administrador.
4. Verifica `/catalogo`, `/login` y `/admin`.

## Mantenimiento

- Mantener migraciones SQL versionadas.
- Revisar dependencias periódicamente.
- No editar productos directamente en JSON en producción.
- Usar `/admin` para cambios operativos.
- Mantener copias de seguridad de Supabase.
