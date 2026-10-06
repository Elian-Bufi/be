-- DL-124, precierre del 2026-10-06, §3: la base del reloj monotónico de cada evento de tiempo (`BaseDelRelojApi` del
-- dominio). Con el reloj desde el arranque del teléfono, dos instantes con la misma ancla se restan aunque la app se haya
-- cerrado entre los dos; con el del proceso, no. Dos bases distintas nunca se restan. Migración aditiva.
-- 1. El enum y la columna, generados desde prisma/schema.prisma con `prisma migrate diff`.
-- 2. La base acompaña al ancla: un instante monotónico declara su base, y uno civil o declarado no tiene ninguna. La
--    columna repite la base que dice el contenido, como ya lo hacen la corrida, la secuencia y el identificador.
--    Las filas anteriores (solo en bases locales: esta tabla todavía no se desplegó) se tomaron con `performance.now()` y
--    no declaran base. La tabla es de solo agregar y no se reescribe: la regla se agrega NOT VALID, así rige para toda fila
--    nueva y deja esas como están. La API las lee con la base del proceso (`eventosDeTiempo`, lectura-por-serie.ts).

-- CreateEnum
CREATE TYPE "BaseDelReloj" AS ENUM ('DESDE_EL_ARRANQUE', 'DEL_PROCESO');

-- AlterTable
ALTER TABLE "evento_de_tiempo_de_entrenamiento" ADD COLUMN     "base_del_reloj" "BaseDelReloj";


-- ─── La base del reloj, con su ancla y con el contenido ─────────────────────────────────────────────────────────────
-- `IS NOT DISTINCT FROM`, no `=`: un contenido sin base daría NULL, y un CHECK que da NULL deja pasar la fila.
ALTER TABLE "evento_de_tiempo_de_entrenamiento" ADD CONSTRAINT "evento_de_tiempo_base_del_reloj" CHECK (
  ("ancla_monotonica" IS NULL) = ("base_del_reloj" IS NULL)
  AND (
    "base_del_reloj" IS NULL
    OR "contenido" #>> '{at,monotonic,clock}' IS NOT DISTINCT FROM (CASE "base_del_reloj" WHEN 'DESDE_EL_ARRANQUE' THEN 'ELAPSED_SINCE_BOOT' WHEN 'DEL_PROCESO' THEN 'PROCESS_MONOTONIC' END)
  )
) NOT VALID;
