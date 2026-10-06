#!/usr/bin/env bash
# Prueba local del respaldo y la restauración de una base de BE con PostgreSQL 16 (precierre del 2026-10-06, §6): el
# mismo procedimiento que se usaría con be-db-test antes de su vencimiento, contra una base local con datos sintéticos.
#
# Qué hace:
#   1. pg_dump en formato personalizado (-Fc), sin dueños ni permisos, de la base de origen;
#   2. crea una base nueva y la restaura con pg_restore;
#   3. compara origen y destino: filas de cada tabla, la huella de los bytes de cada imagen (contenido_de_medio), las
#      migraciones de Prisma aplicadas, los disparadores, las funciones y las restricciones;
#   4. escribe un resumen JSON (sin datos personales: solo nombres de tablas y conteos).
# Qué no hace: tocar ninguna base remota. Contra Render se corre el paso 1 con la URL externa de la base, que da el
# dashboard y que nunca se versiona (ver docs/propuestas/CONTINUIDAD-BASE-DE-TEST_2026-10-06.md).
# En Windows, psql deja de leer opciones después de la URL de conexión: la URL va siempre al final.
#
# Modos de restauración (4.º argumento):
#   directo   (por omisión): pg_restore de una vez. Sirve para un respaldo de una base que ya tiene la migración
#             20261006150000_funcion_de_finalidad_restaurable;
#   secciones: para un respaldo de una base anterior a esa migración (la de test hoy): restaura el esquema, fija la ruta de
#             búsqueda de be_finalidad_de_alcance y recién después carga los datos y lo demás.
#
# Uso: bash respaldo-y-restauracion.sh <carpeta con pg_dump, pg_restore y psql> <url de la base de origen, local> <salida.json> [directo|secciones]
set -euo pipefail
BIN="${1:?falta la carpeta del cliente de PostgreSQL 16}"
ORIGEN="${2:?falta la URL de la base de origen}"
SALIDA="${3:?falta el archivo de salida}"
MODO="${4:-directo}"
case "$ORIGEN" in *localhost*|*127.0.0.1*) ;; *) echo "Guardia: la base de origen tiene que ser local." >&2; exit 2 ;; esac

TRABAJO="$(mktemp -d)"
DESTINO_DB="be_restaurada_$(date +%H%M%S)"
DESTINO="${ORIGEN%/*}/$DESTINO_DB"
ADMIN="${ORIGEN%/*}/postgres"
trap 'rm -rf "$TRABAJO"' EXIT

"$BIN/pg_dump" --version
inicio=$(date +%s)
"$BIN/pg_dump" -Fc --no-owner --no-acl -f "$TRABAJO/respaldo.dump" "$ORIGEN"
fin_respaldo=$(date +%s)
"$BIN/psql" -q -v ON_ERROR_STOP=1 -c "CREATE DATABASE \"$DESTINO_DB\"" "$ADMIN"
if [ "$MODO" = secciones ]; then
  "$BIN/pg_restore" --no-owner --no-acl --exit-on-error --section=pre-data -d "$DESTINO" "$TRABAJO/respaldo.dump"
  "$BIN/psql" -q -v ON_ERROR_STOP=1 -c "ALTER FUNCTION public.be_finalidad_de_alcance(public.\"Alcance\") SET search_path = public, pg_catalog" "$DESTINO"
  "$BIN/pg_restore" --no-owner --no-acl --exit-on-error --section=data -d "$DESTINO" "$TRABAJO/respaldo.dump"
  "$BIN/pg_restore" --no-owner --no-acl --exit-on-error --section=post-data -d "$DESTINO" "$TRABAJO/respaldo.dump"
else
  "$BIN/pg_restore" --no-owner --no-acl --exit-on-error -d "$DESTINO" "$TRABAJO/respaldo.dump"
fi
fin_restauracion=$(date +%s)

# Lo que se compara: una sola consulta, que devuelve un objeto JSON por base.
CONSULTA=$(cat <<'SQL'
WITH tablas AS (
  SELECT c.relname AS tabla, (xpath('/row/n/text()', query_to_xml(format('SELECT count(*) AS n FROM public.%I', c.relname), false, true, '')))[1]::text::bigint AS filas
  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind = 'r'
)
SELECT json_build_object(
  'tablas', (SELECT json_object_agg(tabla, filas ORDER BY tabla) FROM tablas),
  'huellaDeLasImagenes', (SELECT md5(coalesce(string_agg(md5(bytes), ',' ORDER BY medio_id), '')) FROM contenido_de_medio),
  'imagenes', (SELECT count(*) FROM contenido_de_medio),
  'bytesDeImagenes', (SELECT coalesce(sum(octet_length(bytes)), 0) FROM contenido_de_medio),
  'migraciones', (SELECT json_agg(migration_name ORDER BY migration_name) FROM _prisma_migrations WHERE finished_at IS NOT NULL),
  'disparadores', (SELECT count(*) FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND NOT t.tgisinternal),
  'funciones', (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'public'),
  'restricciones', (SELECT count(*) FROM pg_constraint k JOIN pg_namespace n ON n.oid = k.connamespace WHERE n.nspname = 'public')
);
SQL
)
"$BIN/psql" -At -v ON_ERROR_STOP=1 -c "$CONSULTA" "$ORIGEN" > "$TRABAJO/origen.json"
"$BIN/psql" -At -v ON_ERROR_STOP=1 -c "$CONSULTA" "$DESTINO" > "$TRABAJO/destino.json"
TAMANO=$(stat -c %s "$TRABAJO/respaldo.dump")

MODO="$MODO" node -e '
const fs = require("fs");
const [origen, destino, salida, tamano, segRespaldo, segRestauracion, base] = process.argv.slice(1);
const o = JSON.parse(fs.readFileSync(origen, "utf8"));
const d = JSON.parse(fs.readFileSync(destino, "utf8"));
const iguales = JSON.stringify(o) === JSON.stringify(d);
const resumen = {
  procedimiento: process.env.MODO === "secciones" ? "pg_dump -Fc → CREATE DATABASE → pg_restore --section=pre-data → ALTER FUNCTION be_finalidad_de_alcance SET search_path → --section=data → --section=post-data" : "pg_dump -Fc --no-owner --no-acl → CREATE DATABASE → pg_restore --no-owner --no-acl --exit-on-error",
  modo: process.env.MODO,
  baseRestaurada: base,
  tamanoDelRespaldoBytes: Number(tamano),
  segundos: { respaldo: Number(segRespaldo), restauracion: Number(segRestauracion) },
  tablas: Object.keys(o.tablas).length,
  filas: Object.values(o.tablas).reduce((a, b) => a + Number(b), 0),
  imagenes: o.imagenes,
  bytesDeImagenes: o.bytesDeImagenes,
  migraciones: o.migraciones.length,
  ultimaMigracion: o.migraciones.at(-1),
  disparadores: o.disparadores,
  funciones: o.funciones,
  restricciones: o.restricciones,
  origenIgualADestino: iguales,
  diferencias: iguales ? [] : Object.keys({ ...o, ...d }).filter((k) => JSON.stringify(o[k]) !== JSON.stringify(d[k])),
  porTabla: Object.fromEntries(Object.keys(o.tablas).map((t) => [t, { origen: o.tablas[t], destino: d.tablas?.[t] ?? null }])),
};
fs.writeFileSync(salida, JSON.stringify(resumen, null, 2) + "\n");
console.log(JSON.stringify({ origenIgualADestino: iguales, tablas: resumen.tablas, filas: resumen.filas, imagenes: resumen.imagenes, migraciones: resumen.migraciones, tamanoDelRespaldoBytes: resumen.tamanoDelRespaldoBytes }));
process.exit(iguales ? 0 : 1);
' "$TRABAJO/origen.json" "$TRABAJO/destino.json" "$SALIDA" "$TAMANO" "$((fin_respaldo - inicio))" "$((fin_restauracion - fin_respaldo))" "$DESTINO_DB"
echo "La base restaurada queda como $DESTINO_DB (local), para levantar la API contra ella."
