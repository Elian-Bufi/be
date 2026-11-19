-- DL-178 (decisión de Dirección del 2026-11-18): las series de calentamiento. Migración aditiva: no transforma ni borra nada.
--
-- 1. El tipo de cada serie (`setKind`: WORKING o WARM_UP) no es una columna: las series viven dentro del JSONB de la versión
--    de plan (`contenido`), de su instantánea, del borrador y de la ejecución, como todo lo de cada serie (DL-122, DL-161).
--    El «default WORKING» es la ausencia de la clave: lo indicado y lo registrado antes de esta migración no tiene la clave,
--    se lee efectivo y responde igual. Por eso no se reescribe ninguna fila ni ninguna huella de instantánea, y solo
--    `WARM_UP` se guarda (`tipoGuardado` en packages/domain/src/tipos-de-serie.ts).
-- 2. Lo que sí cambia en la base: la capacidad que declara un cliente que distingue el calentamiento,
--    `training-set-kinds-1`, se suma a las que la tabla acepta. Sin eso no se podría registrar que el titular ya usa esa
--    app, y un plan con calentamiento no se activaría nunca (compatibilidad-de-clientes.ts).

ALTER TABLE "capacidad_de_cliente_declarada" DROP CONSTRAINT "capacidad_de_cliente_declarada_conocida";
ALTER TABLE "capacidad_de_cliente_declarada" ADD CONSTRAINT "capacidad_de_cliente_declarada_conocida" CHECK (
  "capacidad" IN ('training-set-targets-1', 'training-set-kinds-1')
);
