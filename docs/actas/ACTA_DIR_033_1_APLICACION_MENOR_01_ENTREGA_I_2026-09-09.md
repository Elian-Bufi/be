# ACTA-DIR-033.1 — Aplicación de MENOR-01 a Entrega I

> **Proyecto:** BE — Plataforma integrada de inteligencia en salud  
> **Fecha:** `2026-09-09`  
> **Tipo:** corrección menor del paquete de gate antes del cierre de Entrega I  
> **Implementación:** `NO AUTORIZADA`  
> **Git:** `SIN OPERACIONES`  
> **ACTA-DIR-034:** `SIGUE NO FIRMADA`

## 1. Origen

La contrarrevisión externa de Entrega I concluyó:

```text
CONFORME CON AJUSTES MENORES
ENTREGA I APTA PARA DECISIÓN DE DIRECCIÓN; LEGAJO DOCUMENTAL CERRABLE

MENOR-01:
falta campo rollback/recovery antes de firma
```

No se detectaron hallazgos bloqueantes ni afirmaciones runtime indebidas.

## 2. Alcance de la corrección

Se modifica únicamente el borrador no firmado del gate de implementación y su checklist.

No se modifica:

```text
01
04
05
06
07
08
09
10
11A
12
```

## 3. MENOR-01

Antes de firmar ACTA-DIR-034 debe existir un apartado obligatorio de `ROLLBACK / RECOVERY` con:

1. reversión de cambios sin reescribir historia;
2. prohibición de `force push`, `reset --hard` y `amend` sobre historia compartida;
3. política de revert/recovery para merges defectuosos;
4. tratamiento de deploy fallido;
5. tratamiento de migración fallida en test/demo;
6. ensayo verificable de rollback al menos una vez antes de considerar maduro el flujo operativo.

## 4. Secrets

Se eleva además `secrets/config` desde checklist a condición explícita de firma:

```text
SECRETS / CONFIG:
TO VERIFY
```

No se registran valores secretos en el acta.

## 5. Estado

```text
ENTREGA I:
CORREGIDA
PENDIENTE DE CONTRASTE CORTO

ACTA-DIR-034:
NO FIRMADA

IMPLEMENTACIÓN:
NO AUTORIZADA

GIT:
NO
```
