# 00 — Gobierno del Legajo Canónico de BE

> **Proyecto:** BE — Plataforma integrada de inteligencia en salud  
> **Código documental:** `BE-LEG-00`  
> **Versión:** `0.2.1`  
> **Estado:** `APROBADO`  
> **Fecha:** 2026-07-18  
> **Responsable de dirección:** Elian Gastón Bufi  
> **Propietario documental:** Dirección de producto BE  
> **Revisión cruzada:** obligatoria según criticidad  
> **Canon:** `docs/legajo/00_Gobierno_del_Legajo.md` en la rama documental aprobada  
> **Antecedentes:** auditoría AS-IS; revisiones externas de v0.1, segunda vuelta y tercera vuelta condicionada

---

## 1. Propósito y alcance

Este documento define las reglas operativas para diseñar, revisar, aprobar, versionar, implementar y mantener el legajo canónico TO-BE de BE.

Su objetivo es evitar dos fallas simétricas:

1. desarrollar funcionalidades desconectadas y documentarlas después;
2. producir una documentación extensa sin validar tempranamente el sistema real.

El gobierno debe asegurar una cadena verificable:

```text
problema
→ visión
→ objetivo
→ actor
→ requisito
→ caso de uso
→ regla de negocio
→ dominio
→ seguridad
→ arquitectura
→ API
→ UI
→ prueba
→ evidencia
```

Este archivo solo conserva secciones que producen:

- una regla operativa;
- una decisión;
- una pregunta bloqueante;
- un criterio verificable.

---

## 2. Capas oficiales y regla de precedencia

BE mantiene tres capas separadas:

| Capa | Función | Regla |
|---|---|---|
| **Auditoría AS-IS** | Describe el sistema observado en un SHA determinado | Es evidencia temporal, no especificación futura |
| **Legajo canónico TO-BE** | Define el producto que debe construirse | Es la fuente de verdad de producto, dominio, seguridad y solución |
| **Implementación** | Código, datos, UI, infraestructura y pruebas | Debe demostrar conformidad con el legajo baselineado |

Ante una contradicción:

```text
decisión TO-BE aprobada
→ brecha registrada
→ transición planificada
→ implementación trazable
```

Ningún comportamiento existente queda legitimado únicamente porque ya esté implementado.

---

## 3. Canon documental y repositorio

### 3.1 Fuente única

La única versión canónica es la almacenada en Git:

```text
docs/legajo/
```

El sandbox, ChatGPT, Google Drive, Notion y otras herramientas son áreas de trabajo o espejos.

### 3.2 Procedimiento de canonización

```text
redacción de trabajo
→ revisión
→ aprobación de dirección
→ copia a docs/legajo/
→ validación de formato, IDs y referencias
→ commit documental
→ versión del repositorio pasa a ser canónica
```

Un archivo fuera del repositorio no se considera vigente.

### 3.3 Rama documental

Rama sugerida:

```text
docs/canonical-legajo-to-be
```

No se hará push, PR o merge sin autorización explícita.

---

## 4. Corpus canónico

```text
00_Gobierno_del_Legajo.md
01_Presentacion_y_Sumario_Ejecutivo.md
02_Vision_Alcance_y_Plan_Estrategico.md
03_Modelo_de_Negocio.md
04_Requerimientos_RF_RNF.md
05_Casos_de_Uso_e_Historias.md
06_Modelo_de_Dominio_y_Datos.md
07_Arquitectura_y_Despliegue.md
08_Seguridad_Privacidad_y_Gobernanza.md
09_Interfaces_y_Contratos_API.md
10_Diseno_UI_UX_y_Prototipos.md
11A_Plan_y_Estrategia_de_Pruebas.md
11B_Resultados_y_Evidencia_de_Pruebas.md
12_Trazabilidad_y_Control_de_Calidad.md
```

`11A` y `11B` son **dos archivos distintos**, con estados independientes:

- `11A` se aprueba antes de la implementación canónica;
- `11B` se completa con resultados reales y evidencia.

### 4.1 Fuente de verdad por tema

| Tema | Documento propietario |
|---|---|
| Gobierno, gates y cambios | 00 |
| Visión, alcance, MVP y roadmap | 02 |
| Negocio, actores y operación | 03 |
| Requisitos funcionales y no funcionales | 04 |
| Casos de uso y flujos | 05 |
| Dominio, estados y datos | 06 |
| Arquitectura, ambientes y despliegue | 07 |
| Seguridad, consentimiento y gobernanza | 08 |
| Contratos API y compatibilidad | 09 |
| UI/UX y prototipos | 10 |
| Estrategia y diseño de pruebas | 11A |
| Resultados y evidencia | 11B |
| Trazabilidad y calidad | 12 |

Un documento puede referenciar o resumir una decisión ajena, pero **no puede redefinirla**. Todo cambio sustantivo se realiza en el documento propietario y se propaga por trazabilidad.

### 4.2 Roles operativos

| Rol | Responsabilidad vinculante |
|---|---|
| Dirección — Elian | Aprueba decisiones, gates, baselines, alcance y cambios sustantivos |
| Redacción y consultoría — ChatGPT | Estructura, redacta, fundamenta, detecta contradicciones y declara disensos |
| Revisión cruzada — modelo/tutor/usuarios según criticidad | Critica con independencia y deja evidencia `REV-###` |
| Implementación — Claude Code | Verifica el repositorio e implementa únicamente decisiones aprobadas y trazables |

---

## 5. Taxonomía canónica de estados

Los únicos estados documentales permitidos son:

```text
NO INICIADO
BORRADOR
EN REVISIÓN
APROBADO
BASELINEADO
SUPERADO
ARCHIVADO
```

### 5.1 Definiciones

| Estado | Significado |
|---|---|
| `NO INICIADO` | El artefacto está planificado pero no redactado |
| `BORRADOR` | Existe contenido incompleto |
| `EN REVISIÓN` | El contenido está desarrollado y sometido a crítica |
| `APROBADO` | Dirección acepta la decisión o documento |
| `BASELINEADO` | La versión se congela como referencia de implementación |
| `SUPERADO` | Fue reemplazado por otra versión |
| `ARCHIVADO` | Se conserva únicamente por historia |

No se utilizarán estados como `DIFERIDO`, `BORRADOR PARA APROBACIÓN` o equivalentes.

---

## 6. Orden de elaboración y niveles de rigor

### 6.1 Orden

```text
00
→ 02
→ 03
→ 04
→ 05
→ 06
→ 08
→ 07
→ 09
→ 10
→ 11A
→ 12
→ implementación y 11B
→ 01 definitivo
```

### 6.2 Niveles de proceso

#### Rigor completo

Documentos:

```text
02, 04, 06, 08
```

Proceso:

```text
preparación
→ estructura
→ redacción
→ revisión adversarial
→ contraste AS-IS
→ revisión transversal
→ dirección
→ aprobación
→ baseline
```

#### Rigor intermedio

Documentos:

```text
03, 05, 07, 09, 10
```

Proceso:

```text
preparación + estructura
→ redacción
→ contraste AS-IS cuando corresponda
→ revisión crítica consolidada
→ revisión transversal
→ dirección
→ aprobación
```

Reglas especiales:

- `07` y `09` siempre incluyen contraste AS-IS/TO-BE;
- `05`, `07` o `10` suben a rigor completo si introducen una decisión crítica según §18.2;
- esa elevación consume la reserva de dirección, no amplía silenciosamente la caja.

#### Rigor compacto

Documentos:

```text
00, 01, 11A, 11B, 12
```

Proceso:

```text
preparación
→ redacción
→ revisión consolidada
→ aprobación
```

---

## 7. Timeboxes y calendario

Se adopta `TB-A`.

### 7.1 Cajas documentales

| Nivel | Documentos | Caja máxima |
|---|---|---:|
| Completo | 02, 04, 06, 08 | 3 sesiones cada uno |
| Intermedio | 03, 05, 07, 09, 10 | 2 sesiones cada uno |
| Compacto | 00, 01, 11A, 11B, 12 | 1 sesión cada uno |

Una sesión equivale a entre 90 y 120 minutos de trabajo efectivo.

### 7.2 Reserva de dirección

Se reservan **4 sesiones adicionales** asignables a:

- 06;
- 08;
- elevación de rigor de 05, 07 o 10;
- una contradicción que bloquee un gate.

La reserva requiere registro explícito. No se amplía una caja sin consumir reserva.

### 7.3 Cláusula de cierre

Cuando se agota una caja:

1. se recorta alcance secundario;
2. se registran preguntas abiertas;
3. se separan anexos;
4. el documento pasa a revisión.

No se extiende indefinidamente.

### 7.4 Mapeo a calendario y cadencia aprobada

Cadencia de dirección:

```text
bloques diarios mínimos: 3 horas
frecuencia: 5 días por semana
planificación prudente: 1,5 sesiones efectivas por día
capacidad nominal: 7,5 sesiones por semana
```

Presupuesto total vigente:

```text
27 sesiones documentales
+ 4 de reserva
+ 4–6 EXP
= 35–37 sesiones
```

Horizonte nominal: **5 semanas**; horizonte con contingencia: **6 semanas**.

La **primera sesión de 02** debe registrar:

- fecha objetivo de G4;
- fecha de entrega o defensa, si existe;
- distribución semanal efectiva;
- margen de contingencia;
- recalculo hacia atrás si la fecha académica es anterior al horizonte.

El reclutamiento corre en tiempo calendario. Con G2 previsto aproximadamente hacia la semana 2, la ejecución del plan de reclutamiento comienza al cerrar G2; no se limita a redactar y archivar el plan.

### 7.5 Presupuesto de la bala trazadora

La bala trazadora dispone de una caja separada:

```text
4 a 6 sesiones EXP
```

No consume ni oculta sesiones documentales.

---

## 8. Quality gates y clausura transitiva

Un gate hereda todos los gates previos. La tabla expresa requisitos directos y clausura completa.

| Gate | Propósito | Requisitos directos | Clausura transitiva |
|---|---|---|---|
| **G0** | Gobierno operativo | 00 aprobado | `{00}` |
| **G1** | Producto definido | 02 y 03 aprobados; Q-000, Q-001, Q-009 y Q-010 RESUELTAS | `{00, 02, 03}` |
| **G2** | Comportamiento definido | 04 y 05 aprobados; plan de reclutamiento disponible; Q-002 y Q-006 resueltas provisionalmente por dirección | `{00, 02, 03, 04, 05}` |
| **G3** | Fundamentos definidos | 06 y 08 aprobados | `{00, 02, 03, 04, 05, 06, 08}` |
| **G4** | Solución diseñada | 07, 09 y 10 aprobados; validación inicial con usuarios realizada; Q-002 y Q-006 confirmadas o revisadas | `{00, 02, 03, 04, 05, 06, 07, 08, 09, 10}` |
| **G5** | Implementación verificable autorizada | 11A y estructura de 12 baselineadas | `{00, 02, 03, 04, 05, 06, 07, 08, 09, 10, 11A, 12}` |
| **G6** | Cierre y aceptación | 11B, 01 y 12 completos; evidencia y trazabilidad cerradas | corpus canónico completo |

### 8.1 Regla de seguridad y datos

En la línea canónica no se planifican ni implementan cambios sobre:

- modelos persistentes;
- estados de dominio;
- autorización;
- consentimiento;
- retención;
- segregación;
- auditoría de acceso;

hasta superar G3.

### 8.2 Implementación de UI

No se implementan pantallas, navegación o shells canónicos antes de G4.

### 8.3 Excepción experimental

La prohibición anterior no aplica automáticamente a un experimento `EXP-###` autorizado bajo el régimen de la sección 10. Esa excepción no permite mergear a `main` ni convertir el experimento en implementación canónica.

### 8.4 Ciclo de vida de 12

El baseline exigido en G5 cubre la **estructura de trazabilidad y la trazabilidad de diseño**. La incorporación posterior de resultados y evidencia es un cambio editorial de registro que no rompe ese baseline. G6 exige el documento 12 completo y actualizado con evidencia real.

### 8.5 Bloqueo por preguntas

Ningún gate puede cerrarse si existe una pregunta cuyo `gate límite` sea ese gate y su estado sea `ABIERTA` o `EN INVESTIGACIÓN`.

---

## 9. Regla de descongelamiento

### Antes de G3

Permitido:

- documentación;
- pruebas diagnósticas no destructivas;
- correcciones críticas de seguridad o integridad;
- separación de ambientes;
- tooling documental mínimo;
- experimentos `EXP-###` autorizados.

No permitido:

- nuevas verticales;
- cambios canónicos de dominio;
- migraciones funcionales no urgentes;
- expansión de producto.

### Después de G3

Puede diseñarse la transición de:

- datos;
- estados;
- consentimiento;
- autorización;
- gobernanza.

### Después de G4

Puede implementarse en ramas funcionales la solución diseñada.

### Después de G5

Puede considerarse integración o merge canónico sujeto a pruebas, revisión y autorización.

---

## 10. Régimen experimental `EXP-###`

Se adopta `BT-B`: bala trazadora controlada después de G2.

### 10.1 Objetivo

Validar empíricamente el circuito mínimo:

```text
login por rol
→ asesorado descubre /hoy
→ consulta plan activo
→ registra adherencia
→ profesional visualiza porcentaje y nota
→ registra una decisión mínima
```

### 10.2 Estatutos

Todo experimento tiene:

- ID `EXP-###`;
- propietario;
- hipótesis;
- alcance;
- decisiones provisionales;
- rama experimental;
- caja de 4–6 sesiones;
- criterios de éxito;
- criterios de descarte;
- informe de cierre.

### 10.3 Restricciones obligatorias

- solo datos sintéticos;
- ningún dato personal o de salud real;
- base local o branch Neon descartable;
- prohibido usar `production`;
- sin merge a `main`;
- sin nuevas verticales;
- sin alcance comercial;
- sin IA con autoridad;
- cambios aditivos y reversibles;
- sin cambio canónico de schema antes de G3;
- toda diferencia con el legajo queda marcada como provisional.

### 10.4 Cierre

Al superar G3/G4, el experimento debe:

1. descartarse; o
2. convertirse en implementación trazable mediante un plan explícito.

El experimento nunca se promociona silenciosamente a producto.

---

## 11. Q-000 — definición bloqueante de circuito nutricional cerrado

**Pregunta:**

> ¿Cuándo puede afirmarse objetivamente que el circuito nutricional de BE está cerrado?

G1 no puede superarse sin una respuesta aprobada.

Como mínimo, la definición debe exigir:

1. vínculo aceptado explícitamente;
2. consentimiento de datos de salud vigente;
3. autorización del profesional por especialidad y vínculo;
4. plan nutricional válido y activo;
5. acceso del asesorado sin conocer URLs internas;
6. registro de ejecución o adherencia;
7. acceso profesional a esa evidencia;
8. decisión profesional documentada;
9. continuidad mediante mantenimiento, ajuste, sustitución o cierre;
10. revocación de consentimiento que corte accesos posteriores conforme a la política aprobada;
11. trazabilidad de acceso, revocación, decisión y cambios;
12. pruebas de punta a punta.

---

## 12. Gobierno de preguntas abiertas

Cada pregunta `Q-###` tendrá:

| Campo | Regla |
|---|---|
| Estado | ABIERTA / EN INVESTIGACIÓN / RESUELTA / DESCARTADA |
| Responsable y método | Persona/rol + investigación, dirección, usuarios, tutor o EXP |
| Evidencia | Documento, prueba, entrevista o DEC |
| Límite | Gate y fecha objetivo |
| Impacto | Documentos afectados y salida esperada |

### 12.1 Preguntas iniciales

| ID | Tema | Responsable | Método | Gate límite |
|---|---|---|---|---|
| `Q-000` | Circuito nutricional cerrado | Elian + producto | dirección + auditoría | G1 |
| `Q-001` | Especialidades del MVP | Elian | dirección + negocio | G1 |
| `Q-002` | Alta del profesional | Elian + usuarios | provisional en G2; validar con usuarios antes de G4 | G2 provisional / G4 confirmación |
| `Q-003` | Alcance del consentimiento | Producto + seguridad | análisis legal y técnico | G3 |
| `Q-004` | Retención tras revocación | Seguridad | análisis normativo | G3 |
| `Q-005` | Lectura tras finalizar vínculo | Seguridad + dominio | casos de uso + política | G3 |
| `Q-006` | Definición de revisión profesional | Producto + usuarios | provisional en G2; validar con usuarios antes de G4 | G2 provisional / G4 confirmación |
| `Q-007` | Cierre del seguimiento | Producto + dominio | caso de uso + estados | G3 |
| `Q-008` | Plataforma de despliegue | Arquitectura | comparativa técnica | G4 |
| `Q-009` | North Star definitivo | Elian | dirección estratégica | G1 |
| `Q-010` | Modelo comercial inicial | Elian | dirección comercial | G1 |

Todo documento que resuelva una pregunta bloqueante recibe revisión adversarial.

---

## 13. Gobierno de decisiones

### 13.1 Ciclo de vida

```text
PROPUESTA
→ APROBADA
→ BASELINEADA
→ SUPERADA o REVOCADA
```

Ninguna decisión queda `APROBADA` sin mini-ADR completa.

### 13.2 Plantilla mini-ADR

- contexto real;
- problema;
- alternativas;
- decisión;
- fundamento;
- consecuencias positivas;
- consecuencias negativas;
- riesgos;
- documentos propietarios;
- condición de revisión.

### 13.3 Decisiones iniciales

#### DEC-001 — congelamiento de nuevas features

- **Estado:** APROBADA.
- **Original aprobado:** congelar nuevas features hasta recuperar fundamentos y cerrar el circuito nutricional.
- **Corrección v0.2.1:** se revierte la sustitución silenciosa de v0.2 (“hasta G5”).
- **Contexto/alternativas:** circuito incompleto; continuar Sprint 3, corregir solo bugs o congelar expansión.
- **Decisión:** congelar nuevas features hasta demostrar Q-000 con evidencia. La recuperación del circuito nutricional conforme al legajo no es una nueva feature y fluye por G4/G5.
- **Fundamento:** reparar sin multiplicar deuda.
- **Consecuencias/riesgos:** foco exclusivo en recuperación; posible parálisis, mitigada por TB-A y EXP.
- **Propietarios/revisión:** 02 y 12; revisar al demostrar Q-000.

#### DEC-002 — nutrición como primer circuito cerrado

- **Estado:** APROBADA.
- **Contexto/alternativas:** es la vertical observable más avanzada; alternativas: entrenamiento o multidominio.
- **Decisión/fundamento:** cerrar nutrición primero para validar el modelo de circuito con alcance controlado.
- **Consecuencias/riesgos:** se congelan otras verticales; riesgo de sobreoptimización.
- **Propietarios/revisión:** 02, 05 y 12; revisar al demostrar Q-000.

#### DEC-003 — aceptación explícita del vínculo

- **Estado:** APROBADA.
- **Contexto/alternativas:** hoy nace ACTIVO unilateralmente; alternativas: unilateral, implícito o aceptación expresa.
- **Decisión/fundamento:** el asesorado acepta antes del acceso profesional; alinea confianza, autorización y trazabilidad.
- **Consecuencias/riesgos:** agrega onboarding; posible abandono o confusión.
- **Propietarios/revisión:** 03, 05, 06 y 08; revisar con validación de usuarios.

#### DEC-004 — ADMIN mínimo operable

- **Estado:** APROBADA.
- **Contexto/alternativas:** la gobernanza carece de ejecutor; diferir, operar fuera del sistema o mínimo operable.
- **Decisión/fundamento:** alta segura, revisión, aprobación, rechazo, suspensión y trazabilidad.
- **Consecuencias/riesgos:** aumenta el MVP; evitar convertirlo en consola general.
- **Propietarios/revisión:** 03 y 08.

#### DEC-005 — verificación profesional por estados

- **Estado:** APROBADA.
- **Contexto/alternativas:** el booleano no representa rechazo o suspensión; booleano, estados mínimos o workflow completo.
- **Decisión/fundamento:** PENDIENTE, VERIFICADO, RECHAZADO y SUSPENDIDO como mínimo.
- **Consecuencias/riesgos:** migración aditiva y transición consistente.
- **Propietarios/revisión:** 06 y 08.

#### DEC-006 — consentimiento vigente como gate

- **Estado:** APROBADA.
- **Contexto/alternativas:** se registra pero no autoriza; registro histórico, gate global o por alcance/finalidad.
- **Decisión/fundamento:** ningún acceso profesional sin consentimiento vigente según 08.
- **Consecuencias/riesgos:** mayor complejidad; riesgo de denegación errónea o acceso residual.
- **Propietarios/revisión:** 05, 06 y 08; revisar con Q-003.

#### DEC-007 — zona horaria MVP

- **Estado:** APROBADA.
- **Contexto/alternativas:** ventanas diarias requieren referencia; UTC, offset o zona IANA.
- **Decisión/fundamento:** `America/Argentina/Buenos_Aires`; evita reglas dispersas.
- **Consecuencias/riesgos:** multi-timezone fuera del MVP.
- **Propietarios/revisión:** 06 y 09; revisar antes de operar fuera de Argentina.

#### DEC-008 — ambientes separados

- **Estado:** APROBADA.
- **Contexto/alternativas:** desarrollo estuvo conectado a una branch production; base única, schemas o ambientes separados.
- **Decisión/fundamento:** development, test y production separados.
- **Consecuencias/riesgos:** más configuración; posible deriva entre ambientes.
- **Propietarios/revisión:** 07, 08 y 11A.

#### DEC-009 — despliegue reproducible antes de pilotos

- **Estado:** APROBADA.
- **Contexto/alternativas:** despliegue incompleto; manual, plataforma sin especificar o proceso reproducible.
- **Decisión/fundamento:** artefactos, variables, healthchecks, migraciones y rollback antes de pilotos.
- **Consecuencias/riesgos:** trabajo previo; evitar sobrediseño.
- **Propietarios/revisión:** 07 y 11A; revisar en G4.

#### DEC-010 — congelamiento de otras verticales e IA

- **Estado:** APROBADA.
- **Contexto/alternativas:** backend por delante del producto; expansión simultánea, prototipos o freeze.
- **Decisión/fundamento:** no expandir entrenamiento, bienestar o IA hasta demostrar Q-000.
- **Consecuencias/riesgos:** posterga módulos; preservar contexto mediante ASIS-DELTA.
- **Propietarios/revisión:** 02 y 12.

#### DEC-011 — marco legal argentino transversal

- **Estado:** APROBADA.
- **Contexto/alternativas:** BE trata datos de salud; diferir, tratarlo solo técnicamente o incorporarlo al gobierno.
- **Decisión/fundamento:** 08 incorpora el marco argentino aplicable; seguridad y privacidad son condiciones de producto.
- **Consecuencias/riesgos:** no sustituye asesoramiento jurídico ni prueba cumplimiento total.
- **Propietarios/revisión:** 08 y 12; revisar ante cambios normativos o de alcance.

---

## 14. Marco normativo y estándares adaptados

Referencias adoptadas sin implicar certificación:

| Referencia | Uso |
|---|---|
| Ley argentina 25.326 y criterios de la AAIP | Restricción transversal sobre datos personales y sensibles |
| ISO/IEC/IEEE 29148:2018 | Calidad y trazabilidad de requisitos |
| ISO/IEC 25010:2023 | Atributos de calidad y criterios RNF |
| C4 Model | Comunicación de contexto, contenedores, componentes y despliegue |
| arc42 | Estructura pragmática de documentación arquitectónica |
| OWASP ASVS 5.0 | Catálogo de controles verificables para aplicaciones |

Se aplican proporcionalmente; solo se adopta lo que produzca reglas o evidencia.

---

## 15. Revisión cruzada y validación externa

Se adopta `XR-B`.

### 15.1 Revisión adversarial obligatoria

Aplica a:

- 02;
- 04;
- 06;
- 08;
- toda decisión crítica según §18.2;
- cambios de datos o seguridad;
- documentos que resuelvan una Q bloqueante;
- gates G1, G3 y G6.

### 15.2 Evidencia

Cada revisión crea:

```text
docs/legajo/revisiones/REV-###.md
```

Debe incluir:

- fecha;
- versión;
- revisor;
- hallazgos;
- resolución;
- aceptados;
- ajustados;
- rechazados con fundamento;
- decisión final de Elian.

### 15.3 Regla de disenso

El redactor no acepta automáticamente todo hallazgo.

Cuando considere que un hallazgo es:

- incorrecto;
- desproporcionado;
- fuera de alcance;

debe defender su posición con evidencia. El desacuerdo queda registrado y Elian resuelve.

### 15.4 Tutor y usuarios

Hitos del tutor/director:

```text
G1, G3 y G6
```

Antes de cerrar G2 debe existir un plan de reclutamiento.

Antes de G4 debe existir evidencia de validación con, como mínimo:

- un profesional;
- un asesorado.

Las sesiones usan:

- datos sintéticos; o
- datos del propio participante con consentimiento registrado.

---

## 16. Trazabilidad estructurada

Se adopta `TR-A`: YAML en Git como fuente única.

### 16.1 Estructura v1

```text
docs/legajo/trazabilidad/
  esquemas/
    identificadores.yml
    referencias.yml
  objetivos.yml
  decisiones.yml
  requisitos.yml
  casos_uso.yml
  pruebas.yml
```

Los formatos de `DEC`, `RF`, `RNF`, `RN`, `UC`, `API`, `UI`, `CP`, `RSK`, `ADR`, `NC`, `REV`, `EXP`, `CR` y demás familias se definen **una sola vez** en `esquemas/identificadores.yml`. Este documento no duplica sus patrones.

### 16.2 Validación automática mínima

El tooling v1 aplica los esquemas y solo valida:

1. IDs únicos y conformes al formato canónico;
2. referencias a IDs existentes y permitidas por `referencias.yml`;
3. enlaces internos válidos.

No se construirá un sistema paralelo de gestión.

### 16.3 Freeze

El tooling documental está eximido del freeze de DEC-001.

### 16.4 Notion

Notion funciona como espejo de solo lectura. Se prohíbe la doble escritura manual.

---

## 17. Deltas del AS-IS

La auditoría vale para su SHA. Todo cambio pre-G3 genera:

```text
ASIS-DELTA-###
```

El delta incluye:

- SHA anterior y nuevo;
- motivo;
- componentes modificados;
- hallazgos afectados;
- evidencia actualizada;
- decisión sobre rebaseline.

Cada gate decide si el delta alcanza o si debe rebaselinearse la auditoría.

---

## 18. Control de cambios y versionado

Se adopta `CH-B`.

### 18.1 Clases

| Clase | Ejemplos | Control inmediato | Versión inicial |
|---|---|---|---|
| Editorial | ortografía, formato, enlaces | historial local | Patch |
| Clarificación | redacción más precisa sin cambiar decisión | CR abreviado | Minor |
| Sustantivo | alcance, DEC, requisito, gate, seguridad, dominio o datos | CR completo | Major |
| Urgente/seguridad | exposición activa, corrupción en curso o bloqueo crítico | CR urgente inmediato + retrospectiva | Patch o Minor provisional |

### 18.2 Regla anti-atajo y decisión crítica

Salvo urgencia calificada según §18.1, todo cambio que afecte:

- una DEC;
- un requisito;
- un gate;
- seguridad;
- dominio;
- datos;

se clasifica automáticamente como **sustantivo**. Esa misma lista define qué es una **decisión crítica** en este documento.

En una urgencia calificada procede la clase `Urgente/seguridad`; la retrospectiva completa el CR sustantivo y determina la clasificación y versión definitivas. El revisor cruzado valida la clase.

### 18.3 Retrospectiva urgente

Un cambio urgente debe revisarse retrospectivamente:

```text
dentro de 72 horas o antes del siguiente merge, lo que ocurra primero
```

La retrospectiva debe completar el análisis sustantivo y fijar la versión definitiva según el contenido realmente modificado.

### 18.4 Versionado

- `MAJOR`: cambia alcance, decisión, requisito, gate, seguridad, dominio o datos;
- `MINOR`: clarifica o amplía sin alterar la decisión;
- `PATCH`: corrección editorial.

La versión provisional de un hotfix puede ser Patch o Minor; la retrospectiva determina si corresponde elevarla a Major.

Baseline:

```text
BE-LEG-<DOC>-v<MAJOR>.<MINOR>.<PATCH>-BL<numero>
```

### 18.5 Plantilla mínima de cambio

Todo `CR-###` registra cinco campos:

1. motivo;
2. clase;
3. documentos e IDs afectados;
4. impacto;
5. aprobación.

### 18.6 Cambios sobre decisiones aprobadas

Si una corrección obliga a modificar contenido previamente aprobado, debe presentar:

- formulación original;
- formulación propuesta;
- motivo;
- clasificación del cambio;
- resolución de dirección.

Se prohíbe la mejora silenciosa de una decisión aprobada.

---

## 19. Glosario semilla provisional

El documento 06 será propietario definitivo. Todos los términos de esta versión tienen estado `PROVISIONAL`. Los sinónimos rechazados se registran únicamente cuando existe riesgo real de confusión.

| Término | Estado | Definición provisional |
|---|---|---|
| **BE** | PROVISIONAL | Plataforma de seguimiento integrado |
| **Profesional** | PROVISIONAL | Actor autorizado por dominio |
| **Asesorado** | PROVISIONAL | Titular de datos y destinatario |
| **Vínculo** | PROVISIONAL | Relación aceptada con alcance y estado |
| **Consentimiento** | PROVISIONAL | Autorización informada y revocable |
| **Circuito** | PROVISIONAL | Cadena de valor y evidencia |
| **Vertical** | PROVISIONAL | Dominio funcional |
| **Circuito nutricional** | PROVISIONAL | Evaluación → plan → ejecución → revisión → ajuste |
| **Circuito cerrado** | PROVISIONAL | Q-000 demostrada end-to-end |
| **Plan activo** | PROVISIONAL | Prescripción vigente consultable |
| **Ejecución** | PROVISIONAL | Acción del asesorado |
| **Adherencia** | PROVISIONAL | Relación plan–ejecución |
| **Revisión** | PROVISIONAL | Interpretación de evidencia |
| **Ajuste** | PROVISIONAL | Mantener, modificar, sustituir o cerrar |
| **Profesional verificado** | PROVISIONAL | Profesional validado |
| **Gate** | PROVISIONAL | Condición de salida |
| **Baseline** | PROVISIONAL | Versión de referencia congelada |
| **MVP** | PROVISIONAL | Alcance mínimo demostrable |
| **Evidencia** | PROVISIONAL | Resultado verificable |

**Sinónimos rechazados por confusión:** `vertical nutricional` ≠ `circuito nutricional`. La vertical es el dominio; el circuito es la secuencia de valor dentro de ese dominio.

---

## 20. Definition of Ready del documento

Un documento está listo para redacción cuando:

- propósito definido;
- propietario definido;
- dependencias disponibles;
- fuentes reunidas;
- preguntas enumeradas;
- caja asignada;
- criterio de aprobación definido.

---

## 21. Definition of Done documental

Un documento está terminado cuando:

- cumple su propósito;
- respeta el nivel de rigor asignado;
- diferencia AS-IS y TO-BE;
- distingue hechos, propuestas y decisiones;
- no contradice baselines;
- registra preguntas;
- contiene criterios verificables;
- tiene revisión requerida;
- está aprobado;
- está canonizado en Git.

---

## 22. Autoevaluación de v0.2.1

| Criterio propio | Estado | Evidencia |
|---|---|---|
| Propósito, propietario y dependencias | CUMPLE | cabecera, §§1–4 |
| Fuentes, preguntas, caja y criterio de aprobación | CUMPLE | §§7, 12, 24–25 |
| Rigor proporcional y separación AS-IS/TO-BE | CUMPLE | §§2, 6 |
| Hechos, propuestas y decisiones diferenciados | CUMPLE | §§12–14 |
| Criterios verificables y trazabilidad | CUMPLE | §§8, 16, 20–21 |
| Contradicciones conocidas | CUMPLE | verificación de cierre y `REV-001` |
| Revisión exigida | CUMPLE | tres rondas consolidadas en `REV-001` |
| Aprobación y canonización | APROBACIÓN CUMPLE / CANONIZACIÓN PENDIENTE | aprobación expresa de dirección; canonización mediante commit local |

**Conclusión:** la revisión y la aprobación de dirección están completas. El documento se encuentra `APROBADO`; la condición restante para cerrar operativamente G0 es su canonización mediante estructura, validación y commit local en Git.

---

## 23. Tablero

| Documento | Estado | Gate |
|---|---|---|
| 00 Gobierno | APROBADO | G0 |
| 01 Sumario ejecutivo | NO INICIADO | G6 |
| 02 Visión y alcance | NO INICIADO | G1 |
| 03 Modelo de negocio | NO INICIADO | G1 |
| 04 RF/RNF | NO INICIADO | G2 |
| 05 Casos de uso | NO INICIADO | G2 |
| 06 Dominio y datos | NO INICIADO | G3 |
| 08 Seguridad | NO INICIADO | G3 |
| 07 Arquitectura | NO INICIADO | G4 |
| 09 API | NO INICIADO | G4 |
| 10 UI/UX | NO INICIADO | G4 |
| 11A Plan de pruebas | NO INICIADO | G5 |
| 12 Trazabilidad | NO INICIADO | G5 |
| 11B Resultados | NO INICIADO | G6 |

---

## 24. Criterio de cierre de G0

G0 se cierra cuando:

1. v0.2.1 queda verificada contra la lista T;
2. Elian la aprueba;
3. se copia a `docs/legajo/`;
4. se valida estructura y referencias;
5. se crea commit documental;
6. Git pasa a ser el canon.

---

## 25. Changelog trazable v0.1 → v0.2

| Cambio agrupado | Origen |
|---|---|
| Gates transitivos, UI/UX previa y estados canónicos | C1–C3, N1, N8a |
| Fases y plantillas redundantes eliminadas; 11A/11B separados | C4, C7, C8, N8b |
| Mini-ADR, preguntas y Q-000 con consentimiento | C5, C6, R7, N4, N5 |
| Rigor proporcional, TB-A, reserva y EXP con datos sintéticos | R1, N2, N3, N8d, N9 |
| Revisión cruzada, tutor, usuarios y disenso | R2, N6, N10 |
| YAML/CI mínimo, marco normativo y Git como canon | R3, R4, R9, N7 |
| ASIS-DELTA, CH-B, glosario y autoevaluación | R5, R6, R8, N8c |

### 25.1 Changelog v0.2 → v0.2.1

| Cambio | Hallazgo de origen |
|---|---|
| Excepción calificada para hotfix y versión definitiva en retrospectiva | T1 |
| DEC-001 restituida a la formulación aprobada; recuperación diferenciada de nueva feature | T2 |
| Fuente de verdad, roles, esquemas de ID y plantilla CR restituidos en formato compacto | T3 |
| Ciclo de vida dual de 12 aclarado | T4 — corrección menor 1 |
| Regla genérica de bloqueo por preguntas incorporada | T5 — corrección menor 2 |
| Q-002 y Q-006: decisión provisional en G2 y confirmación antes de G4 | T6 — corrección menor 3 |
| Decisión crítica definida por impacto en DEC, requisito, gate, seguridad, dominio o datos | T7 — corrección menor 4 |
| Glosario con estado explícito y sinónimos rechazados solo ante confusión | T8 — corrección menor 5 |
| Changelog de C4 corregido: las fases fueron eliminadas | T9 — corrección menor 6 |
| Cadencia de 7,5 sesiones semanales y horizonte de 5–6 semanas registrados | T10 — insumo de dirección N9a |
| Regla contra cambios silenciosos de decisiones aprobadas incorporada | T2 / instrucción final de dirección |

---

### 25.2 Registro de aprobación

- **Revisión de cierre:** conforme.
- **Aprobación de dirección:** otorgada por Elian Gastón Bufi el 2026-07-18.
- **Evidencia:** `docs/legajo/revisiones/REV-001.md`.
- **Estado resultante:** `APROBADO`.
- **Condición operativa pendiente:** canonización en Git mediante la rama y el commit definidos en §24.


## 26. Próximo paso

Con v0.2.1 conforme:

```text
cerrar G0
→ canonizar el documento
→ iniciar 02_Vision_Alcance_y_Plan_Estrategico
```

La primera sesión de 02 debe comenzar con:

1. mapeo de calendario usando la cadencia aprobada;
2. fecha objetivo de G4;
3. fecha de entrega o defensa, si existe;
4. agenda bloqueante de G1: Q-000, Q-001, Q-009 y Q-010.
