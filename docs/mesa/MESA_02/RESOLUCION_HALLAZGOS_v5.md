# MESA-02 v5 — Resolución del productor

**Fecha:** 13-09-2026. **Productor:** ChatGPT/Codex por solicitud de Dirección. **Estado:** correcciones producidas; cierre independiente pendiente. Último dictamen independiente disponible: v4 NO CONFORME, seis abiertos y ocho resueltos.

| Hallazgo abierto en v4 | Corrección materializada en v5 | Verificación requerida para cierre |
|---|---|---|
| H-M02-01 · mayor | DV-02 §§7/8 reemplazados con cinco fuentes primarias; correspondencia afirmación–fuente, NE explícito e hipótesis de posicionamiento. Se retiran afirmaciones no acreditadas de saturación, carencias universales y lanzamiento institucional gratuito. | Abrir fuentes; comprobar que cada afirmación y límite corresponde a lo consultado. No exigir validación estadística que el texto ya no afirma. |
| H-M02-04 · mayor | Los 25 TEST-RF tienen precondiciones, datos sintéticos concretos y pasos con variantes; CSV/MD sincronizados, títulos completos y ficha común de fixtures. | Reproducibilidad de escenarios sin rediseño; preservar 59 IDs, 34 escenarios temáticos y estados NOT_EXECUTED. |
| H-M02-05 · mayor | FRM-001: request mixto se rechaza íntegramente con 422 / FORM_REQUEST_NOT_ALLOWED; request válido separado puede dar 201. Oráculo y pasos citan 09 §22.3. | Comprobar que no queda éxito parcial por recorte de campos; conservar las reparaciones ANT-003/AUTH-001 de v4. |
| H-M02-07 · mayor | Pasajes completos, explicación de inferencias, corrección de extremos/cardinalidades y sincronización de DER/clases. 62 registros rastreables de v4, una retirada explícita y tres conexiones agregadas: 65 filas / 64 conectores activos. Referencias interárea corregidas. | Contrastar semántica, historia/modalidad y gráficos con evidencia, incluidas celdas cardinales sin fijar. Eliminar una asociación no respaldada es corrección, no prueba de que el canon la prohíba universalmente. |
| H-M02-13 · menor | C0: las dos referencias largas desde Entidad de dominio usan carriles inferiores; Persistencia ya no queda conectada a través de Especialización/Ámbito. | Inspección del SVG y PNG con extremos inequívocos. |
| H-M02-14 · menor | DV-09.1 reordenado en cinco columnas; 18 componentes preservados dentro de API, PostgreSQL fuera y rótulo visible. Matriz de dependencias conservada. | Cotejar límite del contenedor con 07 §18 y nombres/dependencias con matriz. |

## Regresiones bajo control

Se conservan fuentes canónicas, cobertura de 79 términos, inventario de 35 operaciones, máquinas/secuencias v4 y los 34 escenarios temáticos. La corrección de relaciones se propaga a C2–C8 cuando afecta su representación; C3 conserva sus seis operaciones y guardas. `Solicitud.rechazar()` mantiene confirmación explícita; `Verificación.rechazar()` mantiene resolución desfavorable. No se reabren los ocho cierres previos salvo regresión concreta.

## Decisiones de modelado explícitas

R004 se retira: Novedad describe audiencia, no titularidad individual demostrada. Capacidad configurada se referencia desde identidad profesional; alcance profesional incluye la capacidad antropométrica independiente de especialidades. Microciclo sigue opcional. Planes refieren versiones de objetivo; snapshots y sucesores no reciben máximos universales que el patrón no fija. Preparación antropométrica no exige una medición antes de poder existir como borrador. La ejecución depende del período/ocurrencia. Referencias adoptadas, respuestas y consentimientos conservan historia.

Las cardinalidades inferidas quedan marcadas y justificadas, y los extremos no fijados se elevan en la nota de derivación. No se convirtió una inferencia en regla canónica ni en DDL autorizado. La reconciliación con código continúa pendiente de intake e implementación.

## Lo que esta entrega permite

Solicitar una reverificación independiente acotada y, si su dictamen permite cierre, avanzar al intake y gate ya preparados. No modifica el estado de ACTA-DIR-034, no crea 11B, no acredita software funcionando ni completa DV-10…14. Mercado es investigación documental, no validación comercial. El esqueleto de MESA-03 no es la entrega escolar final.
