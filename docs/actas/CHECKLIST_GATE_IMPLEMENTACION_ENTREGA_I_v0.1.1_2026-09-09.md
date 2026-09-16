# Paquete de Gate de Implementación — Checklist previo a firma

> **Fecha:** `2026-09-09`  
> **Estado:** `PREPARADO · NO ACTIVO`

## A. Documentación

- [x] 04 requisitos cerrados
- [x] 05 casos de uso cerrados
- [x] 06 dominio cerrado
- [x] 07 arquitectura cerrada
- [x] 08 seguridad/privacidad cerrada
- [x] 09 contratos cerrados
- [x] 10 UX cerrada
- [x] 11A baselineada por ACTA-DIR-033
- [x] 12 baselineada por ACTA-DIR-033
- [ ] 01 aprobado después de contrarrevisión I

## B. Runtime / repo

- [ ] repo exacto verificado
- [ ] base branch verificada
- [ ] base SHA verificado
- [ ] working tree verificado
- [ ] remote verificado

## C. Primer work package

- [ ] ID
- [ ] objetivo
- [ ] RF
- [ ] UC
- [ ] API
- [ ] UX
- [ ] tests 11A
- [ ] out of scope
- [ ] evidencia esperada

## D. Seguridad

- [x] datos reales NO autorizados
- [x] synthetic-only para demo/test inicial
- [ ] ambientes exactos resueltos por intake
- [ ] secretos/config verificados sin exponer ni registrar valores

## E. Git

- [ ] política branch
- [ ] commits
- [ ] push
- [ ] PR
- [ ] merge
- [ ] protección main

## F. Rollback / Recovery

- [ ] estrategia de rollback definida
- [ ] prohibición de force/reset-hard/amend sobre historia compartida confirmada
- [ ] procedimiento de revert de merge defectuoso definido
- [ ] recovery de deploy fallido definido
- [ ] procedimiento ante migración fallida en test/demo definido
- [ ] ensayo de rollback/recovery planificado en ambiente no productivo

## G. Evidencia

- [ ] estructura 11B preparada para el primer WP
- [ ] naming de artifacts
- [ ] CI/evidence location resuelta

## Regla

Si existe un checkbox crítico sin resolver:

```text
NO FIRMAR ACTA-DIR-034
```
