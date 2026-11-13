-- RF-004 (DEUDA_LEGAJO DL-172, revisión del 2026-11-13; 06 REG-06-21): retirar un método de acceso «registra
-- `MétodoDeAccesoRetirado`». Solo agrega el valor del hecho de dominio. Migración propia, como 20261016220000: PostgreSQL no
-- permite usar un valor de enum en la misma transacción en que se agrega.
ALTER TYPE "TipoDeEventoDeDominio" ADD VALUE 'MetodoDeAccesoRetirado';
