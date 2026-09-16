# BE-LEG-10 v0.9-F — B10-10 · Accesibilidad, copy, responsive y coherencia transversal

> **Proyecto:** BE — Plataforma integrada de inteligencia en salud  
> **Documento:** BE-LEG-10  
> **Entrega:** `F`  
> **Bloque:** `B10-10`  
> **Fecha:** `2026-09-07`  
> **Estado:** `BORRADOR DE ENTREGA F — NO APROBADO · NO CANÓNICO`  
> **Naturaleza:** reglas transversales; no crea conductas de negocio  
> **Inventario contractual:** `122 API P0`  
> **Implementación:** `NO AUTORIZADA`

---

# 0. Objetivo

Consolidar en una sola fuente las reglas de:

- accesibilidad;
- copy;
- estados globales;
- privacidad visual;
- responsive;
- formularios;
- visualizaciones;
- feedback;
- consistencia entre Website profesional/admin y APK asesorado.

B10-10 no reemplaza los flujos B10-02…09.

---

# 1. Invariantes transversales

```text
color ≠ único canal
icono ≠ único significado
tooltip ≠ único acceso a información esencial

loading ≠ NO_DATA
error ≠ NO_DATA
partialView ≠ error

NO_DATA ≠ 0
NOT_COMPARABLE ≠ tendencia

no revelable
≠ “existe pero no tenés permiso”

anular
≠ eliminar

prescripto ≠ registrado
sin registro ≠ incumplimiento

score global
= prohibido

lenguaje diagnóstico no sustentado
= prohibido

consentimiento
≠ dark pattern
```

---

# 2. Taxonomía global de estados de presentación

| Estado UX | Uso | Copy base | No implica |
|---|---|---|---|
| Loading | request en curso | skeleton/progreso | NO_DATA |
| Empty | colección legítimamente vacía | “Todavía no…” | error |
| Error | fallo técnico | “No pudimos…” | ausencia de datos |
| `NO_DATA` | sin datos para criterio/período | “No hay datos…” | cero |
| `NOT_COMPARABLE` | datos existentes incompatibles | “No pueden mostrarse como una misma tendencia…” | error |
| `INSUFFICIENT_INFORMATION` | insumos insuficientes | “No hay información suficiente…” | dato oculto existente |
| `partialView` | vista autorizada incompleta | “Vista parcial según tu acceso actual.” | qué está oculto |
| No revelable | recurso no visible | respuesta/routing neutral | existencia |
| Offline/transporte | fallo de conectividad cliente | “Sin conexión / Reintentar” | nuevo estado de dominio |

`Offline` es estado de interfaz/transporte, no contrato de negocio.

---

# 3. Copy — principios

## 3.1. Neutralidad

Preferir descripción de hechos:

```text
Revisión pendiente
No hay datos
No se puede completar esta acción
Vista parcial
```

Evitar interpretación moral/clínica:

```text
incumplidor
mala adherencia
paciente crítico
riesgo alto
está mal
fallaste
```

salvo fuente propietaria explícita.

## 3.2. Agencia

Acciones sensibles nombran el efecto:

```text
Aceptar vínculo
Revocar acceso
Revocar autorización de datos de salud
Pausar vínculo
Finalizar vínculo
Anular medición
```

No botones genéricos `Aceptar` cuando la consecuencia es sensible.

---

# 4. Diccionario de copy prohibido

| Prohibido | Motivo | Sustituto contextual |
|---|---|---|
| Eliminar medición | ANT-VOID conserva historia | Anular medición |
| Cumplimiento 85% | score no canónico | Prescripto vs registrado |
| Mala adherencia | inferencia/culpa | Sin registro / diferencia observada |
| Riesgo alto | triage no aprobado | pendiente operativo real |
| Datos bloqueados de X | fuga partialView | Vista parcial según tu acceso actual |
| El usuario sí tiene el dato pero… | oráculo | datos suficientes no disponibles |
| Profesional aprobado | globaliza verificación | Verificado en [ámbito] |
| Especialidad Antropometría | viola DEC-044 | Capacidad antropométrica |
| Aceptar todo | dark pattern | actos separados |
| Todos tus datos fueron borrados | falso tras revoke A3 | autorización revocada; procesamiento según política |

---

# 5. Consentimiento y dark patterns

Obligaciones visuales:

- ningún consentimiento sensible premarcado;
- rechazo/“ahora no” localizable;
- otorgar y revocar con dificultad comparable;
- versión/texto accesibles;
- no encadenar A3 a creación de identidad como obligación falsa;
- no usar colores/emoción para penalizar rechazo;
- B2 y A3 no se mezclan.

---

# 6. Errores anunciables

Todo error de formulario debe:

1. tener resumen textual;
2. asociarse al campo correspondiente;
3. conservar valor del usuario cuando sea seguro;
4. poder recorrerse por teclado/lector;
5. no depender solo de borde rojo;
6. no revelar información protegida.

Ejemplo:

> **Revisá los campos marcados.**  
> Hay 2 datos que necesitan corrección.

---

# 7. Foco y teclado

Website PRO/ADM:

- orden de foco coincide con orden lógico;
- modal/drawer retiene foco mientras está abierto;
- cierre devuelve foco al disparador;
- acciones destructivas/sensibles no se ejecutan con foco accidental;
- no interacción mouse-only;
- skip/atajos de navegación cuando la densidad lo justifique.

APK:

- orden de lectura semántico;
- controles con nombre accesible;
- targets táctiles suficientes;
- no gestos exclusivos sin alternativa.

Valores exactos de tamaño/tokens pertenecen al sistema visual/prototipo, no se inventan aquí.

---

# 8. Formularios

Reglas:

- label persistente; placeholder no sustituye label;
- requerido/opcional visible;
- unidad junto al valor;
- ayuda antes del error cuando sea predecible;
- valor faltante no se autocompleta con cero;
- confirmación solo cuando la consecuencia lo justifica;
- `SELF_REPORTED` visible donde sea relevante;
- provenance no se borra por reutilización.

---

# 9. Responsive — principio

No diseñar “desktop reducido”.

Transformar jerarquía preservando:

```text
acción primaria
contexto
estado
datos críticos
acciones secundarias
```

## PRO desktop

- navegación lateral/superior;
- densidad alta permitida;
- tablas para cartera/listas complejas;
- detalle contextual.

## PRO responsive

Tabla puede transformarse en cards si:

- conserva columnas semánticas;
- no oculta estado/acción;
- orden/filtro siguen accesibles.

## ADM

Prioridad a cola/detalle de verificación.

No llevar admin a APK como requisito P0.

## ADV APK

Navegación mobile-first.

No replicar shell profesional.

---

# 10. Modales, drawers y páginas

Regla:

- confirmación breve → modal/dialog;
- edición compleja → pantalla/drawer según prototipo;
- no encerrar formularios extensos en modal por conveniencia.

Esta es guía de composición, no requisito normativo.

---

# 11. Visualizaciones

Toda visualización debe tener:

- título;
- período;
- unidad;
- equivalente textual/tabular para valores esenciales;
- leyenda comprensible;
- patrones además de color para gaps/estados;
- no tooltips como única evidencia;
- foco/lectura accesible cuando corresponda.

Mapa corporal:

```text
→ tabla equivalente obligatoria
```

PRIMARY/SECONDARY:

```text
→ diferenciación no solo por color
```

---

# 12. Color y semántica

No usar:

```text
rojo = malo
verde = bueno
```

como única lectura para:

- persona;
- adherencia;
- riesgo;
- verificación;
- datos.

Estados deben incluir texto/iconografía/estructura.

---

# 13. Zoom y escalado de texto

La estructura debe tolerar:

- incremento de texto;
- reflow;
- controles sin superposición;
- contenidos críticos sin truncado irreversible.

No fijar tamaños pixel-perfect como obligación documental.

---

# 14. Targets táctiles

Controles táctiles:

- área suficiente para uso móvil;
- separación razonable;
- acciones sensibles no pegadas a acciones frecuentes.

El valor final se fija en sistema visual/prototipo.

---

# 15. Loading

Usar skeleton/progreso solo donde represente estructura real.

Prohibido:

- skeleton con valores ficticios;
- mostrar 0 antes de cargar;
- convertir timeout en empty state.

---

# 16. Empty

Empty state describe ausencia legítima:

> **No hay revisiones pendientes para los filtros actuales.**

No concluye:

> “Todo está bien”.

---

# 17. Error técnico

Patrón:

```text
No pudimos cargar esta vista.
[Reintentar]
```

Si existe acción alternativa segura, ofrecerla.

No exponer stack, IDs internos o detalle sensible.

---

# 18. partialView

Copy base:

> **Vista parcial según tu acceso actual.**

No:

- cards con candado de dominios ocultos;
- lista de datos restringidos;
- “faltan datos de Antropometría” si revela existencia.

---

# 19. No revelable / 404

UX profesional:

```text
404 / no revelable
→ recurso no disponible
```

Copy:

> **No encontramos un recurso disponible para esta acción.**

No distinguir:

- inexistente;
- ajeno;
- revocado;
- finalizado.

Cuando el titular consulta un recurso propio y la política permite mayor detalle, el copy puede ser más específico sin romper anti-enumeración.

---

# 20. Concurrencia

Cuando `409 VERSION_CONFLICT` sea revelable:

> **Este contenido cambió desde que lo abriste. Actualizá la vista antes de volver a intentar.**

No merge silencioso.

---

# 21. Idempotencia

El usuario no debe ver duplicados por retry.

Ante incertidumbre de red:

> **Estamos verificando si la acción se completó.**

La UI no reenvía automáticamente con nueva idempotency key.

---

# 22. Copy de dominio sensible consolidado

## Nutrición

```text
Prescripto
Registrado
Fuera del plan
Sin registro
```

No “trampa”, “malo”, “falló”.

## Entrenamiento

```text
Planificado
Ejecutado
Sustituido
Sin registro
```

No equiparar falta de registro con no realizado.

## Antropometría

```text
Medición
Cálculo derivado
En preparación
Registrada
Corregida
Anulada
No comparable
```

No “borrada” cuando es anulada.

---

# 23. Estado profesional

Usar cuatro estados mínimos por ámbito:

```text
Pendiente
Verificado
Rechazado
Suspendido
```

Observación:

```text
Se requiere subsanación
```

como tarea/resultado, no estado.

---

# 24. Accesibilidad de consentimiento

Los textos A1/A2/A3/B2 deben:

- ser navegables;
- tener encabezados;
- permitir volver al resumen;
- mantener CTA y alternativa claramente etiquetados;
- no forzar scroll artificial para habilitar el botón;
- no depender de checkbox sin contexto.

---

# 25. Binding contractual

B10-10:

```text
NO CREA API
```

Se aplica transversalmente a las **122 operaciones P0** de 09 v0.16.1.

Inventario de control:

```text
INVENTARIO_API_P0_BE_LEG_09_v0.16.1_122_OPERACIONES_2026-09-07.md
SHA c9cc4bc177785a8b42b99f53b4d2f084be12eae570f83f9ebc5573f67b79f928
```

Errores/códigos concretos se consumen del contrato propietario de cada flujo.

---

# 26. Candidatas

| ID | Tema | Estado |
|---|---|---|
| `CAND-10-X-01` | taxonomía global de estados | RATIFICABLE |
| `CAND-10-X-02` | diccionario de copy prohibido | RATIFICABLE |
| `CAND-10-X-03` | tabla/card responsive con semántica preservada | PROTOTIPO |
| `CAND-10-X-04` | error summary + field association | RATIFICABLE |
| `CAND-10-X-05` | tabla equivalente para charts/mapa | RATIFICABLE |
| `CAND-10-X-06` | partialView banner neutral único | RATIFICABLE |
| `CAND-10-X-07` | patrón de conflicto de versión | RATIFICABLE |
| `CAND-10-X-08` | pauta de idempotency uncertainty | PROTOTIPO |

---

# 27. Escenarios adversariales

## `ADV-10-X-01 — Color-only`
Falla si el estado solo se distingue por color.

## `ADV-10-X-02 — Placeholder como label`
Falla si desaparece el significado al escribir.

## `ADV-10-X-03 — Error no anunciado`
Falla si solo hay borde rojo.

## `ADV-10-X-04 — partialView filtra`
Falla si enumera dominios ocultos.

## `ADV-10-X-05 — NO_DATA como 0`
Falla si aparece valor cero artificial.

## `ADV-10-X-06 — Dark pattern A3`
Falla si rechazo es menos visible o consentimiento premarcado.

## `ADV-10-X-07 — Delete por anulación`
Falla si copy dice borrar.

## `ADV-10-X-08 — Score global`
Falla si un resumen puntúa a la persona.

## `ADV-10-X-09 — Responsive pierde semántica`
Falla si card móvil omite estado/acción crítica.

## `ADV-10-X-10 — Tooltip exclusivo`
Falla si dato esencial solo existe en hover.

## `ADV-10-X-11 — Version conflict overwrite`
Falla si el cliente pisa contenido stale.

## `ADV-10-X-12 — Retry duplica`
Falla si una incertidumbre genera nueva operación lógica.

---

# 28. Prototipos transversales

B10-10 no exige una pantalla independiente.

Debe auditarse dentro de prototipos B10-11:

- onboarding;
- verificación;
- cartera;
- formularios;
- antropometría;
- proyecciones;
- APK.

Matriz accesible requerida por prototipo:

```text
teclado/foco
label
error
color
responsive
copy
privacy
```

---

# 29. Deudas downstream

- tokens visuales definitivos → prototipos/sistema visual;
- pruebas WCAG/automatizadas/manuales → 11A;
- evidencia real → 11B;
- layout pixel-perfect → B10-11/prototipo;
- no se cambia política 08.

---

# 30. DoD

No cerrar si:

- falta taxonomía global;
- copy contradictorio permanece entre bloques;
- partialView filtra;
- visualizaciones carecen de alternativa;
- A3 tiene dark pattern;
- responsive cambia semántica;
- se fija un endpoint/política/estado nuevo;
- B10-10 se convierte en rediseño funcional.
