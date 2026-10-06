# Continuidad de la base de `test` hasta después de la entrega

> **Propuesta para decisión de Dirección** (precierre del 2026-10-06, §6). No recrea, no migra, no borra ni contrata nada:
> cada acción externa de este documento la ejecuta o la autoriza Dirección. Datos: todos sintéticos.

## El problema

- **`be-db-test` es una base gratuita de Render** (PostgreSQL 16, Frankfurt). Según la documentación de Render
  (<https://render.com/docs/free>):
  - vence **30 días después de creada**;
  - después hay **14 días de gracia** para pasarla a un plan pago sin perder datos. Durante la gracia la base queda
    inaccesible, y al terminar se borra con todo;
  - **no tiene ningún respaldo**;
  - **solo puede haber una base gratuita activa por workspace**.
- **La fecha exacta no está en el repositorio.** Hay tres estimaciones (`docs/propuestas/INSUMOS-EXPLORACION-VISUAL_2026-10-05.md`):
  ~16/10, ≈17/10 y ~18/10. La prudente es el **16/10**, porque el WP-01 empezó el 16/9.
- **La entrega es el 20/10**, después de cualquiera de esas fechas.
- **No hay acceso externo a la base** (`ipAllowList: []` en `render.yaml`). Sacar un respaldo desde afuera exige abrirlo,
  que es una excepción de seguridad.
- **Qué hay en la base:** las cuentas demo, los vínculos y consentimientos, los planes, los registros y las imágenes. Las
  imágenes viven en la misma base (`contenido_de_medio`, DL-120), así que un respaldo de la base las incluye.

## El dato que falta

No hay acceso autorizado a Render desde este entorno: ni la CLI de Render ni ninguna credencial. Faltan tres datos, y
los tres están en el dashboard de Render:
1. **La fecha exacta de vencimiento** de `be-db-test` (Dashboard → `be-db-test` → Info).
2. **El tamaño actual de la base**, para el costo del almacenamiento.
3. **El plan del workspace**, porque el precio depende de él.

## Las opciones

| | A. Pasarla a un plan pago | B. Exportar y restaurar en otra base gratuita | C. Recrearla vacía y rehacer el escenario |
|---|---|---|---|
| **Conserva los datos** | Sí, todos, con los mismos identificadores | Sí, si la restauración termina bien | No: cuentas e identificadores nuevos |
| **Costo** | El de un plan pago (abajo) | Ninguno | Ninguno |
| **Riesgo** | Bajo: un cambio de plan en el dashboard | Alto. Hay que borrar la base vieja antes de crear la nueva (una gratuita por workspace), con la API apagada; si algo falla, solo queda el respaldo | Medio: el escenario se rehace por la API pública; las capturas y las guías quedan desactualizadas |
| **Acceso externo** | No hace falta | Hay que abrirlo un rato (excepción de seguridad) | No hace falta |
| **PR y despliegue** | Ninguno | Uno o dos (`ipAllowList`, y quizá el nombre de la base) | Uno: `BE_DEMO_PROFESIONALES` con los identificadores nuevos |
| **Vuelve a vencer** | No | Sí, a los 30 días (mediados de noviembre) | Sí, a los 30 días |

**Costo de A.** Según los precios que Render publicaba a fines de agosto de 2026, citados por fuentes de terceros
(<https://kuberns.com/blogs/render-postgres-pricing-setup-limits/>,
<https://bex.co/blog/2026/09/11/render-postgres-flexible-plans-vs-self-hosted-cost>):
- **Basic-256mb:** US$ 6 por mes de cómputo, más US$ 0,30 por GB-mes de almacenamiento, prorrateado.
- Para una base chica, unos **US$ 6 a 7 por mes**.
- El precio exacto lo muestra el dashboard al elegir el plan: confirmarlo ahí antes de aceptarlo.
- Después de la entrega, Dirección decide si la conserva o la borra.

## Recomendación

**A, antes del 16/10.** Es la única opción que conserva todo sin abrir la base, sin borrar nada y sin despliegues, por un
costo chico y acotado. B solo se justifica si no se puede gastar nada; C, si el escenario actual no importa.

**En cualquier caso, un respaldo antes de tocar nada.** La base gratuita no tiene ninguno. Con A, después del cambio de
plan, revisar en el dashboard si el plan incluye recuperación o exportaciones. Si no incluye, un respaldo con `pg_dump`
exige abrir el acceso externo, como en B.

## Respaldo y restauración, probados en local

Se probó el procedimiento completo con PostgreSQL 16.11 sobre una base local con todo el esquema de BE y datos
sintéticos: 94 tablas, 1.071 filas, 10 imágenes y 27 migraciones. Están en
`EVIDENCIA/ENTRENAMIENTO-SERIES/resultados/09-respaldo-y-restauracion.json`, y se repite con
`EVIDENCIA/ENTRENAMIENTO-SERIES/herramientas/precierre/respaldo-y-restauracion.sh`.

**Hallazgo, corregido.** Una restauración directa del esquema de hoy **falla**.
- **Por qué:** pg_restore carga los datos con la ruta de búsqueda vacía, y los CHECK de finalidad llaman a
  `be_finalidad_de_alcance`, que nombra el tipo `"Finalidad"` sin esquema. El error:
  `COPY failed for table "alcance_de_vinculo": ERROR: type "Finalidad" does not exist`.
- **La corrección:** la migración aditiva `20261006150000_funcion_de_finalidad_restaurable` fija la ruta de búsqueda de esa
  función.
- **Hasta que esa migración llegue a `test`**, un respaldo de `be-db-test` se restaura por secciones.

| Caso | Resultado |
|---|---|
| 1. Restauración directa de un respaldo con el esquema de hoy | **Falla** en `COPY alcance_de_vinculo` |
| 2. Restauración por secciones: esquema, ajuste de la función, datos y el resto | Igual al origen: filas de cada tabla, huella de cada imagen, migraciones, disparadores, funciones y restricciones |
| 3. Restauración directa de un respaldo de una base con la migración | Igual al origen |

**El procedimiento, para la base de test** (lo ejecuta Dirección, que tiene el dashboard; la URL externa nunca se versiona):
1. Abrir el acceso externo de `be-db-test` solo para la IP de quien hace el respaldo.
2. Sacar el respaldo:

   ```bash
   pg_dump -Fc --no-owner --no-acl -f be-db-test-AAAAMMDD.dump "<URL externa del dashboard>"
   ```

   Hace falta el cliente de PostgreSQL 16. Lo usado en la prueba son los binarios oficiales para Windows de EDB.
3. Cerrar el acceso externo.
4. Guardar el archivo fuera del repositorio. Son datos sintéticos, pero es la base entera.
5. Para restaurar en una base vacía, por secciones mientras la base de origen no tenga la migración:

   ```bash
   pg_restore --no-owner --no-acl --exit-on-error --section=pre-data -d "<URL de la base nueva>" respaldo.dump
   psql -c "ALTER FUNCTION public.be_finalidad_de_alcance(public.\"Alcance\") SET search_path = public, pg_catalog" "<URL de la base nueva>"
   pg_restore --no-owner --no-acl --exit-on-error --section=data -d "<URL de la base nueva>" respaldo.dump
   pg_restore --no-owner --no-acl --exit-on-error --section=post-data -d "<URL de la base nueva>" respaldo.dump
   ```

6. Comparar origen y destino con la consulta del script.
7. Levantar la API contra la base restaurada: `/health/ready` tiene que dar 200.

**Lo que no se probó:** la base remota, el acceso externo de Render, ni un respaldo de la base de test real. Nada de eso
se tocó.

## Medios: siguen en PostgreSQL

La decisión operativa del 2026-10-06 (DL-120) sigue: las imágenes quedan en la base, detrás de `AlmacenDeMedios`. Pasar
a S3 no es condición de nada de esto, y con A no cambia nada. El tamaño del almacenamiento sí cuenta: la base gratuita
tiene 1 GB para todo, y las imágenes van de 150 a 400 KB cada una.
