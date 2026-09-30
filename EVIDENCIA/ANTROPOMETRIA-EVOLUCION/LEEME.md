# Evidencia · Evolución antropométrica visual (website profesional)

Orden de Dirección del 2026-09-30 (avance principal 1). Convierte la lectura de API-ANT-06 (RF-049; UC-P20) en una herramienta para explorar cambios en el tiempo, **sin cambiar contratos, API ni base**.

- **Rama:** `feat/evolucion-antropometrica-visual`, sobre `main` (`53cc70e`).
- **Estado:** para auditoría, **sin integrar, sin desplegar y sin APK**.
- **Dependencias:** ninguna con los otros PR de la tanda. Comparte dos ayudas de teclado y puntero con los gráficos de entrenamiento (`apps/web/src/lib/graficos.ts`): nada más.

## Qué puede hacer el profesional

En **Antropometría → Evolución**:

1. Elige el período (hasta 92 días) con el mecanismo existente.
2. Elige una **métrica** de las que trae la respuesta, con su cantidad de observaciones.
3. Si la métrica tiene observaciones con otro protocolo, método o unidad, elige el **grupo de comparabilidad** que ve: cada grupo tiene su propio eje, nunca se mezclan unidades.
4. Ve sus observaciones como **puntos sobre un eje temporal a escala**: un mes con dos mediciones se ve como un mes. Sin líneas: los días sin observación quedan vacíos.
5. Elige un punto con **clic, toque o teclado** (flechas, Inicio, Fin), o desde la tabla con «Ver en el gráfico».
6. Ve el **valor exacto y su contexto**: valor y unidad, momento de la toma, fecha de registro, clase (medido, reportado, calculado), protocolo, método si lo hay, si el valor vigente viene de una corrección, y por qué no es comparable con el anterior.
7. Abre la **evaluación de origen** en Evaluaciones, por la ruta y la lectura existentes.
8. Puede consultar una **tabla equivalente** con las mismas observaciones y los mismos huecos.
9. Puede **comparar** dos observaciones del mismo grupo: una resta con signo, unidad y días entre ambas, marcada como descriptiva.

## Cómo se lee (una sola interpretación)

Toda la lógica está en `packages/domain/src/evolucion-antropometrica.ts`. El gráfico, el panel y la tabla se dibujan con lo mismo.

| Tema | Regla |
|---|---|
| Identidad | Cada observación se identifica por `sourceId`. La selección sigue a la identidad, no a la fecha ni al índice |
| Mismo día | Si el contrato publica dos observaciones el mismo día, son dos puntos («1 de 2 del día»). Hoy la API publica **una observación vigente por día y métrica** (checkpoint diario, 09v11 §11): la pantalla no inventa la otra |
| Huecos | Siguen siendo tramos sin observación (`gaps`), en la tabla con su rango y sus días. No se completan, no se unen |
| Cero | Un cero registrado es cero: se dibuja y se lista como valor |
| Grupos | Mismo protocolo, método y unidad (REG-06-162). Un eje por grupo; el vigente al abrir es el de la observación más reciente; un grupo que ya no existe cae a ese. Sin conversión de unidades |
| No comparabilidad | Rombo en el gráfico y motivo en palabras en la tabla y el detalle (REG-06-164). Forma y texto, no solo color |
| Corrección | Rige el valor vigente (REG-06-16); se marca «Corregida» en la tabla y con centro claro en el punto; el original se conserva en la evaluación |
| Métrica al cambiar de período | Si sigue en la respuesta, se conserva; si no, se pasa a la primera y se dice. Sin detalle viejo ni filtro obsoleto |
| Diferencia | Solo dentro del mismo grupo; aritmética y descriptiva («−1,5 kg en 10 días»). No es progreso ni resultado clínico |
| Vista parcial | `partialView` se muestra: hay evaluaciones de otro profesional que existen y no se ven |
| Origen | Abre Evaluaciones con `evaluacion=` en la URL; la lectura y la autorización son las de siempre |

## Lo que no hace

- No interpola, imputa, arrastra, suaviza ni calcula tendencias.
- No convierte unidades ni normaliza valores.
- No agrega doble eje, anillos de composición, porcentajes de cumplimiento ni fórmulas.
- No agrega endpoints, migraciones ni campos.

## Pruebas

| Prueba | Qué cubre | Resultado |
|---|---|---|
| Unitarias del dominio (`evolucion-antropometrica.test.ts`, 10, con datos validados contra el esquema estricto) | serie vacía y un punto; cero registrado; huecos iniciales, intermedios y finales; dos observaciones el mismo día; selección por `sourceId`; cambio de protocolo, método y unidad; corrección; métrica que deja de estar; diferencia solo en el mismo grupo; copy sin términos prohibidos | ver el PR |
| Integración `evolucion-antropometrica.int-spec.ts` (4), por los flujos reales contra PostgreSQL | dos evaluaciones el mismo día (la API publica una por día) y la corrección vigente; medición anulada y borrador excluidos, huecos; otra unidad como otro grupo; `partialView` con otro profesional y el origen accesible | **4/4** |
| Recorrido web local, escritorio 1280 px y móvil 390 px | ver la tabla siguiente | **18/18 y 18/18** |
| `npm test`, typecheck, OpenAPI (sin cambios), legajo y build del website | | ver el PR |

### Recorrido web local

Entorno: la API compilada de `main`, PostgreSQL 16 embebido, `next dev` y Chrome sin interfaz, el 2026-09-30, con datos sintéticos sembrados por los flujos reales (siete evaluaciones de peso, dos el mismo día, una corregida, una en libras; una cintura; una talla anulada; un borrador sin registrar; una evaluación de otro profesional). **No es el ambiente `test` desplegado.**

| Control | Resultado |
|---|---|
| Vista parcial visible por la evaluación de otro profesional | ✅ |
| Métricas de la respuesta con su cantidad; la anulada aparece con 0 | ✅ |
| Peso: dos grupos (kg y lb), selector y aviso; el vigente es el de la observación más reciente | ✅ |
| Puntos sin líneas: 5 en kg; la de lb no está en ese eje | ✅ |
| La tabla tiene las 6 observaciones (la de lb señalada «en otro grupo») y los huecos | ✅ |
| La corrección se marca igual en la tabla («Corregida») y en el punto (centro claro) | ✅ |
| Clic sobre un punto: el detalle es el de esa observación, con valor, momento, registro, clase, protocolo, corrección y comparabilidad; marcado en la tabla | ✅ |
| Comparación: resta con signo, unidad y días, con la aclaración | ✅ |
| Teclado: Inicio, flechas y Fin cambian la observación elegida | ✅ |
| Grupo lb: un punto, el aviso de una sola observación, sin detalle viejo | ✅ |
| Cintura: un grupo, sin selector, sin rombos | ✅ |
| Abrir el origen: Evaluaciones con la evaluación en la URL y su detalle cargado | ✅ |
| Cambiar a un período sin la métrica: cae a la primera disponible y se dice; sin detalle viejo | ✅ |
| Sin la API: «Reintentar», sin gráfico viejo, período editable | ✅ |
| Sin errores de consola (salvo el corte deliberado de la API) | ✅ |
| Móvil: los mismos controles, sin desplazamiento horizontal de la página | ✅ |

Capturas en esta carpeta: `01` puntos en kg con tabla; `02` detalle de la observación; `03` comparación; `04` grupo en libras con un punto; `05` la evaluación de origen abierta; `06` error con «Reintentar»; `movil-*` las mismas en 390 px.

## Límites

- **Una observación por día y métrica** es lo que publica la API (checkpoint diario). Si dos evaluaciones del mismo día deben verse por separado, es un cambio de la lectura, fuera de esta orden. La presentación ya lo soporta.
- **El método** se identifica por su versión en el contrato; la pantalla no inventa su nombre («calculado con un método declarado»).
- **La métrica** se muestra por su código (`peso`, `cintura`), como en la lectura existente.
- **Teclado en PC:** verificado con automatización; no equivale a la prueba manual de Dirección.
- No validado por Dirección, no desplegado.
