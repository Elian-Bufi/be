-- WP-BUSQUEDA (DEUDA_LEGAJO DL-139): el buscador de los catálogos tolera los errores de tipeo con la similitud de
-- trigramas de pg_trgm («manzna» encuentra «Manzana»). Es una extensión estándar de PostgreSQL (contrib), no de un
-- proveedor: viene con la imagen postgres:16-alpine de la CI y con el PostgreSQL embebido de las pruebas locales, y Render
-- la admite (07 §53 pide «PostgreSQL estándar sin extensiones propietarias», y pg_dump la lleva). Desde PostgreSQL 13 es
-- de confianza: la crea el dueño de la base, sin superusuario.
-- Aditiva: no toca tablas ni datos, ni agrega índices (los catálogos son chicos y se recorren enteros; ver DL-139).
CREATE EXTENSION IF NOT EXISTS pg_trgm;
