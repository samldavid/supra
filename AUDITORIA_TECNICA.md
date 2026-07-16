# Auditoría técnica — SupraQuím

Fecha de auditoría: 2026-07-16  
Repositorio local analizado: `C:\Users\yailt\Documents\Catalogo Web Digital`  
Repositorio remoto solicitado para producción: `https://github.com/samldavid/supratodo`  
Rama de trabajo: `feature/carrito-admin`  
Rama final solicitada: `main`

## 1. Resumen de arquitectura actual

- **Framework:** Next.js `15.5.9`, App Router.
- **Lenguaje principal:** TypeScript con React `19.2.0`.
- **Estilos:** Tailwind CSS `4.1.17`, componentes propios estilo shadcn/ui mínimo.
- **Rutas públicas actuales:**
  - `/`
  - `/catalogo`
  - `/catalogo/[slug]`
  - `/robots.txt`
  - `/sitemap.xml`
- **Componentes principales:**
  - `SiteHeader`
  - `SiteFooter`
  - `Hero`
  - `CategoryGrid`
  - `CatalogExplorer`
  - `ProductCard`
  - `ProductImageZoom`
  - `FloatingWhatsApp`
- **Fuente actual de productos:** `src/data/generated-products.json`, importado por `src/lib/products.ts`.
- **Datos curados históricos:** `src/data/products.json`.
- **Imágenes de productos:** archivos estáticos en `public/productos`.
- **Tarjetas fuente para sincronización:** archivos de imagen en `catalogo/`.
- **Sincronización actual:** `scripts/sync-products.mjs` escanea tarjetas, extrae datos por OCR para productos nuevos y escribe `src/data/generated-products.json`.
- **WhatsApp:** `src/lib/whatsapp.ts` genera enlaces `https://wa.me/` con `encodeURIComponent`, pero el número está hardcodeado.
- **Diseño responsive:** el sitio actual usa grids y breakpoints de Tailwind; catálogo y fichas son razonablemente responsivos.
- **Estado base antes de cambios:**
  - `pnpm lint`: correcto.
  - `pnpm build`: correcto.
  - Build genera 35 páginas.

## 2. Estructura de carpetas relevante

```txt
catalogo/                     # tarjetas visuales originales
marca/                        # material de marca original
public/marca/                 # logos e imagen de fondo pública
public/productos/             # imágenes públicas de producto
scripts/                      # sincronización OCR y verificación visual
src/app/                      # rutas App Router
src/components/               # componentes UI y comerciales
src/data/                     # JSON de productos actual
src/lib/                      # utilidades de productos, formato y WhatsApp
```

## 3. Dependencias instaladas

Dependencias principales actuales:

- `next`
- `react`
- `react-dom`
- `framer-motion`
- `lucide-react`
- `@radix-ui/react-slot`
- `class-variance-authority`
- `clsx`
- `tailwind-merge`

Dependencias de desarrollo:

- `typescript`
- `eslint`
- `eslint-config-next`
- `tailwindcss`
- `@tailwindcss/postcss`
- `tesseract.js`

## 4. Variables de entorno existentes

No existe `.env.example` ni documentación formal de variables. El código usa:

- `NEXT_PUBLIC_SITE_URL` opcional para metadata, sitemap y robots.

No se encontraron variables configuradas para base de datos, autenticación o almacenamiento.

## 5. Problemas encontrados

### Persistencia y administración

- Los productos viven en JSON estático, no en base de datos.
- No existe backend CRUD para productos.
- No existe panel administrativo.
- No existe autenticación administrativa.
- No existe ruta `/login`.
- No existe ruta protegida `/admin`.
- La sincronización por OCR es útil para precargar catálogo, pero no equivale a persistencia transaccional ni administración segura.

### Seguridad

- No hay control de acceso administrativo porque no hay administración.
- No hay RLS ni políticas de base de datos.
- El número de WhatsApp está hardcodeado, aunque centralizado en un archivo.
- Las imágenes son públicas y estáticas; no hay validación de subida porque no existe subida administrativa.
- No hay `.env.example`, lo que aumenta el riesgo de configurar secretos de forma incorrecta.
- No hay mecanismo para verificar rol administrativo.

### Accesibilidad y UX

- Las rutas públicas tienen buena base semántica general.
- Falta carrito accesible y persistente.
- Falta indicador global de cantidad de productos en carrito.
- Falta confirmación clara de que no se procesan pagos en línea.
- Las acciones destructivas administrativas aún no existen.

### Rendimiento

- Uso correcto de `next/image` para imágenes públicas.
- El catálogo se carga completo en cliente para búsqueda y filtros; con 28 productos es adecuado.
- El fondo global añadido está optimizado como recurso estático, con overlays para legibilidad.
- A futuro, si el catálogo crece mucho, convendrá paginar o buscar en servidor.

### Repositorio

- El repositorio local estaba inicializado con remoto previo `samldavid/supra`.
- El usuario solicitó publicar en `samldavid/supratodo`.
- La consulta del plugin de GitHub a `samldavid/supratodo` devolvió `404 Not Found`; puede indicar repo privado sin permiso del conector, nombre distinto o repositorio no creado.
- No se debe usar `--force` sobre `main`.

## 6. Riesgos técnicos y de seguridad

- Sin Supabase configurado, la app no puede tener persistencia real en producción.
- La clave `SUPABASE_SERVICE_ROLE_KEY`, si se usa para scripts administrativos de seed, debe permanecer fuera del cliente y fuera del repositorio.
- Las políticas RLS deben proteger operaciones CRUD; no basta con ocultar `/admin`.
- Las cargas de imagen requieren validación de tipo, tamaño y nombres seguros.
- En producción, `NEXT_PUBLIC_SUPABASE_ANON_KEY` puede estar en cliente únicamente si RLS está correctamente configurado.
- El catálogo público debe consultar solo productos activos.
- La administración debe bloquear usuarios autenticados que no estén en la tabla/perfil de administradores.

## 7. Archivos que necesitan modificación o creación

### Crear

- `AUDITORIA_TECNICA.md`
- `.env.example`
- `README.md`
- `middleware.ts`
- `supabase/migrations/*.sql`
- Scripts de seed para productos existentes.
- Librerías de Supabase.
- Librerías de carrito.
- Componentes de carrito.
- Componentes y rutas de login/admin.
- API routes protegidas para CRUD e imágenes.
- Pruebas de lógica crítica.

### Modificar

- `package.json`
- `src/lib/products.ts`
- `src/lib/whatsapp.ts`
- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/app/catalogo/page.tsx`
- `src/app/catalogo/[slug]/page.tsx`
- `src/app/sitemap.ts`
- `src/app/robots.ts`
- `src/components/site-header.tsx`
- `src/components/product-card.tsx`
- `src/components/catalog-explorer.tsx`

## 8. Arquitectura propuesta

### Base de datos y autenticación

Usar Supabase como backend administrado:

- PostgreSQL para productos.
- Supabase Auth para sesiones administrativas.
- Tabla `admin_profiles` para autorizar administradores.
- Tabla `products` para catálogo.
- Storage bucket para imágenes subidas desde el panel.
- RLS para visitantes y administradores.

### Productos

El modelo mantendrá los campos actuales:

- `id`
- `slug`
- `nombre`
- `categoria`
- `precio`
- `presentacion`
- `descripcion`
- `usos`
- `caracteristicas`
- `especificaciones`
- `imagen`
- `destacado`
- `informacion_pendiente`
- `source_file`
- `source_hash`

Y añadirá:

- `activo`
- `stock`
- `orden`
- `created_at`
- `updated_at`

### Frontend público

- El catálogo público consultará productos activos desde Supabase cuando existan variables de entorno.
- En desarrollo sin Supabase configurado, se conservará fallback a `generated-products.json` para que el sitio no quede roto antes de configurar la base.
- Las páginas públicas permanecerán con la identidad visual actual.

### Carrito

- Estado de carrito en React Context.
- Persistencia temporal en `localStorage`.
- Drawer responsive.
- Acciones de añadir, aumentar, disminuir, eliminar y vaciar.
- Cálculo de subtotales y total.
- Checkout por WhatsApp con mensaje codificado.

### Administración

- `/login`: acceso administrativo sin registro público.
- `/admin`: protegida con sesión Supabase y rol administrativo.
- API routes bajo `/api/admin/*` con verificación server-side de rol.
- CRUD de productos con RLS.
- Subida de imágenes validada.

## 9. Plan de implementación por fases

1. Documentar auditoría técnica.
2. Añadir configuración Supabase, migraciones y seed de productos.
3. Cambiar lectura pública de productos para usar Supabase con fallback local.
4. Implementar carrito y checkout por WhatsApp.
5. Implementar login administrativo y protección de `/admin`.
6. Implementar panel administrativo con CRUD.
7. Añadir API routes protegidas.
8. Añadir pruebas críticas.
9. Actualizar README y `.env.example`.
10. Ejecutar lint, build y pruebas.
11. Revisar diff y secretos.
12. Integrar en `main` y subir a `samldavid/supratodo` si el remoto existe y permite push.

## 10. Decisiones técnicas

- **Supabase elegido:** no hay backend existente; Supabase cubre PostgreSQL, Auth, Storage y RLS sin reconstruir la app.
- **RLS obligatorio:** las operaciones sensibles no dependen del frontend.
- **Fallback JSON temporal:** permite desarrollo y build sin credenciales, pero producción debe configurar Supabase y ejecutar seed.
- **Admin sin registro:** los administradores se crean manualmente en Supabase Auth y se autorizan con `admin_profiles`.
- **Carrito local:** `localStorage` es suficiente porque no procesa pagos ni credenciales.
- **WhatsApp centralizado:** el número se mueve a configuración reutilizable.
- **No force push:** la publicación final debe traer cambios remotos y hacer merge/fast-forward seguro.
