# MESA-01 — estado de DV-11 y de DV-05 tras WP-06

> Nota de actualización del ejecutor técnico. **No modifica** la matriz ni el informe del 2026-09-10: esos archivos están en `docs/MANIFEST.sha256`, y editarlos rompería la verificación de hashes de la entrega de Dirección. Cuando Dirección quiera consolidar, reemplaza los archivos y reemite el manifiesto.

**Fecha:** 2026-09-21 · **Paquete:** WP-06 «Circuito de entrenamiento» · **Fuente de exigencia:** `Entregables.pdf` de la escuela. El punto 11 es DV-11 en la matriz: «URL a una DEMO que muestre funcionalidades de APK y Website».

## Punto 11 — Demo de APK y Website

### Qué cambió respecto de WP-05

| Elemento | Estado tras WP-06 | Dónde |
|---|---|---|
| Aplicación ejecutable | ✅ Website y API **0.6.0** en `test`, y APK **0.6.0** en un release permanente. Se suma el **tercer circuito**: entrenamiento, de punta a punta | `EVIDENCIA/WP-06/verificacion-urls.txt` · `apk.txt` |
| Usuarios demo | ✅ **DEMO-PT** (profesional de Entrenamiento) entra por primera vez a un circuito completo. DEMO-A01 queda con un plan de entrenamiento activo, además de sus vínculos de nutrición y antropometría: **una misma persona en los tres dominios** | `GUIA-DEMO.md` «Antes de empezar» |
| Datos sintéticos | ✅ Catálogo de ejercicios rotulado «de demostración: no es una recomendación», con identificadores estables, más la carga manual de ejercicios del profesional | migración `20260921100000_circuito_de_entrenamiento` |
| Guion | ✅ `EVIDENCIA/WP-06/GUIA-DEMO.md`: cuatro partes, con la cuenta, los datos a cargar y lo que tiene que verse en cada paso | — |
| Grabación | **No se hizo**, por el mismo motivo que en WP-04 y WP-05. En su lugar, capturas del estado final: 22 del website, automatizadas contra `test`, y las del APK en un Android real de Dirección | `EVIDENCIA/WP-06/web/` · `apk/` |

### Qué suma la demo

Es el circuito que la regla transversal 4 del 04 exige demostrar entre las dos superficies (04:1089), y el único E2E del 11A que **cruza la APK** (E2E-05):

1. **El profesional planifica y activa en el website.** Bloques y sesiones, % RM o RIR —nunca los dos—, y una carga sugerida que la pantalla dice que no es el criterio. Validar y activar son dos actos; activar congela una instantánea con su huella.
2. **El asesorado entrena y registra en la APK.** Serie por serie en la misma pantalla, con la posibilidad de sustituir un ejercicio y de decir «No pude realizarla» sin dar explicaciones.
3. **El profesional ve lo registrado sin juicio.** Lo planificado al lado de lo ejecutado, la corrección con su autor y el original intacto, y los días sin registro como «sin dato»: nunca como sesiones no realizadas, y sin ningún porcentaje de cumplimiento.
4. **La progresión es una decisión del profesional, no un cálculo.** La revisión se registra como AJUSTAR y prepara un borrador sucesor; la versión activa no cambia hasta que se active la nueva.

### Estado de DV-11

| | Antes de WP-06 | Ahora |
|---|---|---|
| **DV-11** | Demostrable con dos circuitos de salud | **Demostrable con los tres circuitos del producto** —nutrición, antropometría y entrenamiento—, con evidencia real de las dos superficies |

## Punto 5 — Casos de prueba

### Los adversariales 7 y 8, en su variante de entrenamiento

DL-084: las variantes de entrenamiento de los adversariales 7 y 8 **nunca se habían ejecutado** —en WP-04 y WP-05 corrieron la nutricional y la de mediciones—. Ahora corren en CI y en vivo:

| # | Caso | Estado en CI | Estado en `test` (2026-09-21, API 0.6.0 `c50fdd9`) |
|---|---|---|---|
| 8 | Editar un plan de entrenamiento ya activado: `422 PLAN_NOT_EDITABLE`; la activada sigue igual antes y después de crear la sucesora | PASS (INV-06-109) | **PASA** |
| 7 | Una sesión sin registro es sin dato: `NOT_STARTED`, sin condición, sin cero ni porcentaje, y los días sin nada registrado son «sin dato» | PASS (H-09-TRN-01, TEST-RF-045) | **PASA** |

Y cinco casos más de la misma corrida: «Comenzar» dos veces da el mismo borrador (S10-TRN-01), el borrador no es evidencia (el mismo 404 que lo inexistente), «No pude realizarla» es un acto (TEST-TRN-004), el esfuerzo percibido no es criterio (REG-06-129) y cero juicio sobre 36 respuestas. Todo en `EVIDENCIA/WP-06/adversariales-test.json`.

### Casos del catálogo que WP-06 ejecuta

CI sobre el commit final (`c50fdd9`): integración **414/414** en PostgreSQL 16 real, 22 suites, 0 fallos. El detalle por ID está en `EVIDENCIA/WP-06/resultados-integracion-c50fdd9.md`.

| Caso | Oráculo | Estado |
|---|---|---|
| **E2E-05** | Plan → ejecución en la APK → revisión: evaluar, fijar objetivo, planificar, activar, registrar desde la APK, corregir, revisar, aplicar y continuar | PASS |
| **TEST-TRN-001** | Lo planificado y lo ejecutado son dos estructuras distintas: registrar no modifica la prescripción ni la instantánea | PASS |
| **TEST-TRN-002** | El borrador de ejecución no es un registro definitivo: no es evidencia, y confirmarlo crea un recurso nuevo | PASS |
| **TEST-TRN-003** | La sustitución preserva lo prescripto y lo realizado, y no es un error | PASS |
| **TEST-TRN-004** | Sin registro no es «no realizado»: en contrato, base, pantallas (guardia estructural) y en vivo | PASS |
| **TEST-TRN-005** | Corrección trazable: el original queda, la autoría es la real, la vista efectiva sale de la relación | PASS |
| **TEST-TRN-006** | RIR y % RM conservan la semántica declarada: exactamente uno o ninguno, sin conversión ni 1RM estimado | PASS |
| **TEST-RF-036, 039, 041, 045** | Evaluación con fuentes; borrador que no es vigente; activación que abre el Proceso y congela la instantánea; contexto que no es revisión | PASS |
| **TEST-CT (WP-06)** | Las 26 operaciones de entrenamiento, cada una ejercitada con sus éxitos y errores; ninguna queda «en construcción» | PASS |
| **TEST-PRJ-009** | Cero juicio: schemas, OpenAPI, copy de las pantallas, 36 respuestas en vivo y 22 capturas | PASS |
| **REG-06-115** | Una ejecución por ocurrencia, incluido el día en que se activa una sucesora (el hallazgo del cierre) | PASS |

Los seis oráculos TEST-TRN se escribieron con los trece campos de 11A §6, porque el 11A solo traía sus títulos (DL-075): `docs/paquetes/WP-06-ORACULOS.md`. Cada uno cita la prueba que lo ejecuta y la evidencia que lo muestra.

### La auditoría del cierre

Antes de cerrar, cuatro revisores independientes auditaron el paquete contra el legajo (seguridad, contrato, dominio, UX). Lo que sobrevivió al intento de refutarlo se corrigió en el PR #55, con una prueba por hallazgo, o quedó declarado (DL-089 a DL-091). El más serio era transversal —un reintento idempotente que esquivaba el PDP— y se corrigió también para nutrición y antropometría. Detalle en `DEFENSA/WP-06.md` §5.4.
