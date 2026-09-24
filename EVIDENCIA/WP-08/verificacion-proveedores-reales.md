# WP-08 · verificación contra los proveedores reales

**Fecha:** 2026-09-24 · **Entorno:** API y website locales (código de la rama `wp-08/integraciones`), PostgreSQL 16 embebido, **Open Food Facts y wger públicos** · **Navegador:** Chrome real por puppeteer, con una cuenta profesional sintética.

Las pruebas automáticas usan un proveedor falso local (D-H de `docs/paquetes/WP-08.md`): la CI nunca depende de un tercero. Esta verificación es la otra mitad: que contra los proveedores de verdad el circuito funciona igual. Se hizo una vez, a mano, desde los editores de plan.

## Lo que se importó

| | Open Food Facts | wger |
|---|---|---|
| Identificador | código de barras `3017624010701` | ejercicio `56` |
| Recibido | 2026-09-24 05:01:20 UTC | 2026-09-24 05:04:56 UTC |
| Vence (7 días, D-C) | 2026-10-01 05:01:20 UTC | 2026-10-01 05:04:56 UTC |
| SHA-256 de lo recibido | `babd22a2c2e12cb6bee710d4caac99d71dc9d8aa00f8523c25e180ae2697ff5e` | `0474b8f305dc4b20899fbf8fa94a4af9781b0610c197f1ebed4a302a8b80284c` |
| Licencia | Open Database License (ODbL) 1.0 · Colaboradores de Open Food Facts | Creative Commons Attribution Share Alike 4.0 · con su autor (ver nota) |
| Candidato normalizado | «Nutella» · 539 kcal · 6,3 g proteínas · 57,5 g carbohidratos · 30,9 g grasas, cada 100 g | «Estabilización abdominal» (en español) · categoría Abs · músculos Rectus abdominis, Obliquus externus abdominis · material Gym mat |
| Decisión | IMPORTAR, sin correcciones | IMPORTAR, sin correcciones |
| En el catálogo | procedencia `CONTROLLED_IMPORT`, «Importado de Open Food Facts» al buscarlo | procedencia `CONTROLLED_IMPORT`, **sin zonas BE** |

**Nota sobre la autoría de wger.** La licencia CC BY-SA exige citar al autor de cada texto, así que BE guarda y muestra el nombre de usuario que wger informa. En este documento no se reproduce: es el identificador público de una persona real, y el repositorio no publica datos de personas.

## Lo que se observó en la red

Recorrido de nutrición: 36 llamadas a la API, todas 2xx. Recorrido de entrenamiento: 35 llamadas, todas 2xx. Sin errores de consola en ninguno de los dos. Las llamadas propias de la importación:

```text
POST /api/v1/nutrition/catalog-import-candidates                    201
POST /api/v1/nutrition/catalog-import-candidates/{id}/resolve       200
GET  /api/v1/nutrition/catalog-items                                200
POST /api/v1/training/catalog-import-candidates                     201
POST /api/v1/training/catalog-import-candidates/{id}/resolve        200
```

## Lo que se verificó en pantalla

- El candidato se presenta como **«Candidato para revisar»**, con el aviso de que todavía no está en el catálogo BE. Ningún texto dice «Importado» antes de resolver (B10-05 §19).
- Cada dato muestra debajo **«Dato del proveedor: …»**, y el campo editable al lado (dato del proveedor · dato corregido · dato final).
- La fuente, el identificador, la fecha de recepción, la licencia y el vencimiento están a la vista, junto con «Dato de un proveedor externo, revisado por un profesional: no es un dato verificado por BE» (RF-060).
- En wger, los músculos aparecen como **«Músculos según wger (dato del proveedor; no se copian como zonas BE)»**.

Las capturas de estas pantallas se toman al final de la entrega, junto con las demás, por decisión de Dirección del 2026-09-22.
