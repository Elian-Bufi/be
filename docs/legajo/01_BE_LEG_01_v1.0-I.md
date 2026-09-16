# 01 — Presentación y Sumario Ejecutivo de BE

> **Proyecto:** BE — Plataforma integrada de inteligencia en salud  
> **Código documental:** `BE-LEG-01`  
> **Versión:** `1.0-I`  
> **Fecha:** `2026-09-09`  
> **Estado:** `EN REVISIÓN — CANDIDATO FINAL DE ENTREGA I`  
> **Naturaleza:** presentación ejecutiva del producto especificado y del estado real pre-implementación  
> **Implementación:** `NO AUTORIZADA`  
> **Evidencia 11B:** `NO DISPONIBLE TODAVÍA`

---

# 1. Propósito de este documento

BE-LEG-01 resume el producto **después** de cerrar su especificación.

No crea requisitos, dominio, políticas, contratos, UX ni pruebas.

Su función es responder, de forma ejecutiva:

1. qué problema resuelve BE;
2. quiénes lo usan;
3. qué producto se definió;
4. cuál es el alcance;
5. cómo se organiza funcional y técnicamente;
6. cómo se protege la información;
7. cómo se verificará;
8. qué está especificado y qué todavía no está implementado;
9. qué falta para iniciar la construcción verificable.

---

# 2. Qué es BE

BE es una **plataforma integrada de inteligencia en salud** orientada al seguimiento longitudinal e interdisciplinario.

El modelo objetivo es B2B2C:

```text
Profesional
→ opera desde Website

Asesorado adulto
→ utiliza APK Android

Administrador
→ gobierna verificaciones e incidencias administrativas autorizadas

Proveedor BE
→ opera la infraestructura
```

El producto integra tres áreas del MVP funcional:

```text
Nutrición
Entrenamiento
Antropometría transversal
```

Antropometría no se presenta como tercera especialidad profesional.

---

# 3. Problema que aborda

El seguimiento profesional suele fragmentarse entre:

- mensajería;
- planillas;
- archivos;
- herramientas de nutrición o entrenamiento aisladas;
- registros del usuario sin estructura longitudinal;
- decisiones profesionales difíciles de reconstruir;
- planificación separada de ejecución real.

BE busca convertir esa fragmentación en una historia trazable:

```text
qué se evaluó
→ qué se decidió
→ qué se planificó
→ qué registró el asesorado
→ qué observó el profesional
→ qué decisión tomó después
→ cómo continúa el ciclo
```

El diferencial no es acumular dashboards, sino preservar contexto, autoría, temporalidad y continuidad.

---

# 4. Bucle de valor central

El circuito general TO-BE es:

```text
identidad
→ vínculo
→ consentimientos/autorización
→ evaluación
→ objetivo profesional
→ planificación
→ activación
→ ejecución/registro
→ revisión profesional
→ continuidad / ajuste / cierre
→ lectura longitudinal
```

Separaciones obligatorias:

```text
evaluado ≠ prescripto
prescripto ≠ registrado
planificado ≠ ejecutado
medición directa ≠ cálculo derivado
cálculo ≠ referencia profesional
referencia ≠ decisión
sin dato ≠ cero
sin registro ≠ incumplimiento
```

---

# 5. Actores y autoridad

## 5.1. Asesorado

Es titular de su información y participa activamente en el seguimiento.

Puede, según contratos y políticas aplicables:

- gestionar su identidad/cuenta;
- decidir A3;
- aceptar/rechazar vínculo;
- decidir B2;
- consultar planes;
- registrar ejecución;
- responder formularios;
- consultar progreso propio;
- revocar autorizaciones;
- solicitar cierre de su cuenta P1.

## 5.2. Profesional

Opera únicamente bajo:

```text
identidad profesional
+
Alcance/capacidad
+
estado operativo
+
vínculo
+
consentimiento aplicable
+
PDP
```

Verificación:

```text
PENDIENTE
VERIFICADO
RECHAZADO
SUSPENDIDO
```

por Alcance/capacidad, no global.

## 5.3. Administrador

Administra verificaciones e incidencias autorizadas.

```text
ADMIN ≠ profesional
break-glass ≠ actoría profesional
```

No se usa como mecanismo para prescribir o modificar información profesional.

---

# 6. Consentimiento, privacidad y acceso

BE diferencia:

```text
A1 — Términos
A2 — Información de privacidad
A3 — DATOS_SALUD_BE
B2 — consentimiento/acceso profesional
```

Regla:

```text
A1 ≠ A2 ≠ A3 ≠ B2
```

Registrar una cuenta no presume A3.

Aceptar un vínculo no presume B2.

A3 o B2 por sí solos no sustituyen el resto del PDP.

Revocación:

```text
≠ borrado silencioso
≠ reescritura histórica
```

La lectura profesional futura depende siempre del estado vigente de autorización.

---

# 7. Nutrición

Flujo objetivo:

```text
evaluación
→ objetivo profesional
→ plan borrador
→ validar
→ activar
→ asesorado registra
→ revisión
→ continuidad
```

Reglas centrales:

```text
validar ≠ activar
prescripto ≠ registrado
off-plan tiene registro propio
descripción original se preserva
sin registro ≠ incumplimiento
```

No existe score global de adherencia canónico.

---

# 8. Entrenamiento

Flujo objetivo:

```text
evaluación
→ objetivo
→ plan
→ bloques/microciclo opcional
→ sesiones
→ ejercicios
→ ejecución
→ revisión
```

Preserva:

```text
planned ≠ executed
draft de ejecución ≠ registro definitivo
sustitución conserva prescripto + realizado
corrección ≠ overwrite
```

El esfuerzo puede expresarse según prescripción mediante `%RM` o `RIR`.

---

# 9. Antropometría

Antropometría se modela como capacidad transversal.

Distingue:

```text
protocolo/especificación
medición directa
cálculo derivado
evaluación
evolución
```

Incluye especificación para:

- evaluación `EN_PREPARACION`;
- registro definitivo;
- corrección trazable;
- anulación sin delete;
- controlled import con procedencia;
- comparabilidad longitudinal;
- métodos/cálculos versionados;
- formularios estructurados previos.

---

# 10. Métodos y cálculos

BE permite métodos profesionales versionados.

Regla:

```text
método disponible
≠ recomendado

método elegido
≠ ejecutado

cálculo
≠ referencia profesional

referencia
≠ objetivo/prescripción/plan
```

BE no impone una fórmula como decisión profesional automática.

---

# 11. Formularios estructurados

P0 utiliza templates BE versionados.

No existe builder libre de formularios.

Una respuesta:

```text
SELF_REPORTED
```

mantiene procedencia propia.

Reutilizar un valor no fusiona silenciosamente:

```text
perfil
≠ respuesta a request
```

---

# 12. Cartera, Dashboard y Timeline

## Cartera

Es una herramienta operacional:

```text
cartera ≠ triage clínico
pendiente ≠ gravedad
```

## Dashboard

Es síntesis:

```text
dashboard ≠ fuente de verdad
dashboard ≠ revisión
dashboard ≠ score
```

La decisión UX aprobada es:

```text
Dashboard
= resumen + availability

Análisis
= profundidad
```

## Timeline

Preserva:

```text
occurredAt ≠ recordedAt
proximidad temporal ≠ causalidad
```

---

# 13. Proyecciones

El catálogo profesional profundo está cerrado en ocho proyecciones:

1. volumen por ejercicio;
2. volumen por zona muscular;
3. volumen efectivo vs total;
4. progresión por ejercicio;
5. marcas personales observadas;
6. distribución de trabajo por zona muscular;
7. antropometría longitudinal;
8. nutrición prescripta vs registrada.

Reglas:

```text
8/8
0 extra
sin score
sin interpolación
sin weighting implícito
PR observada ≠ estimada
threshold de volumen efectivo = criterio profesional
```

---

# 14. Experiencia de usuario

La UX convergió:

```text
36 PROTO históricos
+
5 FLOW históricos
=
41 escenarios

→ 14 GPROTO de convergencia
```

Shells principales:

```text
SHELL-PRO
→ Cartera

SHELL-ADV
→ Hoy / Progreso

SHELL-ADM
→ Verificaciones
```

No existe un `/dashboard` universal para todos los actores.

---

# 15. Accesibilidad y copy

Reglas transversales:

```text
color ≠ único canal
tooltip ≠ única fuente esencial
NO_DATA ≠ 0
partialView ≠ error
anular ≠ eliminar
sin registro ≠ incumplimiento
```

Los gráficos requieren equivalente textual/tabular cuando contienen información esencial.

Los consentimientos no utilizan dark patterns.

---

# 16. Arquitectura objetivo

La solución objetivo preserva un enfoque de **monolito modular**, evitando sobrediseño prematuro.

Stack arquitectónico definido para la transición:

```text
Backend:
NestJS

Persistencia:
Prisma + PostgreSQL

Website:
Next.js

APK:
Expo / React Native

API:
REST /api/v1
```

La estrategia de despliegue aprobada en la planificación vigente es:

```text
Render-first
AWS-ready
```

con separación de ambientes y diseño portable.

La arquitectura debe converger desde el AS-IS observado hacia el dominio TO-BE; el código existente no redefine el canon.

---

# 17. Contratos

El inventario contractual actual contiene:

```text
API P0:
122

familias:
15
```

Además existen operaciones P1 explícitas de acceso/cuenta, entre ellas recovery y cierre de cuenta.

Contrato especificado:

```text
≠ endpoint ya implementado
```

---

# 18. Requerimientos y comportamiento

Inventario documental baselineado:

```text
RF activos:
69
  P0 59
  P1 8
  P2 2

RF retirados:
RF-016
RF-063

RNF:
38
  P0 31
  P1 7

UC:
56
  P 33
  I 13
  E 9
  S 1

TR:
5
```

Los IDs retirados no se reutilizan.

---

# 19. Plan de pruebas

BE-LEG-11A define pruebas antes de implementación.

Cobertura:

```text
TEST-RF:
69

TEST-RNF:
38

TEST-UC:
56

TEST-CT API P0:
122/122

TEST-TVCC:
12
```

Estado real:

```text
PASS reales:
0

FAIL reales:
0

11B:
NO PRODUCIDO
```

---

# 20. Trazabilidad y calidad

BE-LEG-12 mantiene separados:

```text
SPECIFIED
IMPLEMENTED
TESTED
```

Una capacidad puede estar completamente especificada y no estar implementada.

Esta distinción es obligatoria para todas las afirmaciones de avance.

---

# 21. TVCC-30

La especificación analítica candidata baselineada es:

```text
SPEC-TVCC30-v1
```

Conceptualmente:

```text
TVCC30 = N / D
```

donde `N` es subconjunto de ciclos elegibles con revisión válida, próxima acción/cierre admitidos y continuidad/cierre materializados.

La definición conserva:

- ventana de 30 fechas locales;
- zona `America/Argentina/Buenos_Aires`;
- universo;
- elegibilidad;
- N;
- D;
- exclusiones;
- unresolved;
- versionado;
- reproducibilidad.

Si `D=0`, no se fabrica `0%`.

Si evidencia potencialmente elegible no puede resolverse, v1 no fabrica la tasa.

TVCC-30 no representa:

- retención;
- adherencia;
- resultado corporal;
- salud;
- score clínico;
- ranking.

---

# 22. Qué está dentro del MVP especificado

El MVP documental cubre el circuito necesario para demostrar el modelo BE:

- identidad y acceso;
- onboarding y A3;
- profesional/verificación/admin;
- vínculo y B2;
- nutrición;
- entrenamiento;
- antropometría;
- métodos/cálculos;
- formularios;
- cartera/dashboard/timeline;
- progreso propio;
- proyecciones;
- seguridad/privacidad;
- despliegue verificable;
- pruebas y trazabilidad.

Esto describe **alcance especificado**, no cobertura implementada actual.

---

# 23. Qué no se debe afirmar todavía

A la fecha de este documento no existe evidencia aprobada que permita afirmar:

```text
MVP P0 implementado completo
122 APIs funcionando
APK instalable
deploy de defensa activo
CI verde
migraciones ejecutadas en ambiente objetivo
TVCC30 calculado sobre runtime
11A ejecutado
pruebas PASS
```

Esas afirmaciones pertenecerán a implementación + 11B.

---

# 24. Fronteras de producto

El MVP evita:

- diagnóstico;
- score global de salud;
- automatización con autoridad clínica;
- marketplace;
- pagos;
- chat general;
- comparación con terceros;
- inferencias causales automáticas;
- IA autónoma que prescriba o modifique planes.

Las capacidades futuras deben ingresar mediante nuevos gates y trazabilidad.

---

# 25. Estado documental

Al aprobar Entrega H:

```text
00:
gobierno vigente

02/03:
visión y negocio aprobados

04:
requisitos cerrados

05:
comportamiento cerrado

06:
dominio cerrado

07:
arquitectura cerrada

08:
seguridad/privacidad cerrada

09:
contratos cerrados

10:
UX cerrada

11A:
BASELINEADO

12:
BASELINEADO

11B:
pendiente de implementación/ejecución

01:
este candidato final
```

---

# 26. Estado de implementación

```text
IMPLEMENTACIÓN CANÓNICA NUEVA:
NO AUTORIZADA

GIT:
NO AUTORIZADO POR ESTA ENTREGA

DATOS REALES DE SALUD:
NO AUTORIZADOS

DATOS PARA BUILD/TEST/DEMO FUTUROS:
SINTÉTICOS
```

---

# 27. Próximo gate

La siguiente decisión no es funcional; es operativa.

Dirección deberá aprobar un acta específica que defina:

- repositorio exacto;
- commit/base SHA;
- rama;
- scope del primer work package;
- ambientes;
- política de datos;
- roles productor/revisor;
- política de PR/merge;
- evidencia obligatoria;
- tratamiento de hallazgos contra el canon.

Hasta ese acto:

```text
CLAUDE CODE
→ NO IMPLEMENT
```

---

# 28. Estrategia de construcción posterior

Una vez autorizado el gate:

```text
intake y baseline técnica
→ operabilidad/foundation
→ spike APK
→ vertical slices
→ hardening
→ 11B en paralelo
→ cierre académico
```

La priorización concreta se determina contra el repo real, no desde este resumen.

---

# 29. Regla para la defensa académica

Debe diferenciarse:

```text
P0 ESPECIFICADO
vs
SLICE IMPLEMENTADO Y DEMOSTRADO
```

Si una capacidad está especificada pero no implementada, se declara explícitamente.

La defensa debe premiar trazabilidad y evidencia real, no cobertura nominal.

---

# 30. Resumen ejecutivo final

BE llega al gate de construcción con:

```text
producto:
definido

comportamiento:
definido

dominio:
definido

seguridad/privacidad:
definida

arquitectura:
definida

contratos:
definidos

UX:
definida

plan de pruebas:
baselineado

trazabilidad:
baselineada

implementación futura:
aún no autorizada

evidencia runtime:
aún no producida
```

El objetivo de la siguiente fase no es diseñar BE otra vez.

Es:

> **convertir la especificación TO-BE baselineada en una implementación demostrablemente conforme, generando 11B como evidencia.**
