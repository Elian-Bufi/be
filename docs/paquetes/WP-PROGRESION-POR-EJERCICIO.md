# WP-PROGRESION-POR-EJERCICIO · La progresión por ejercicio, en un cuadro ancho (DL-201)

**Estado:** PROGRAMADO en `entrenamiento/progresion-por-ejercicio`, desde `main` (3d3b7e06). PR en borrador, sin
integrar. Las decisiones PE-D01 a PE-D16 están **a ratificar** por Dirección. Registro: **DL-201** en
`docs/DEUDA_LEGAJO.md`.

**Origen.** El pedido de Dirección del 2026-11-26: «Progresión…» se abría en el panel lateral angosto, con
desplazamiento, y la regla era una por fase. Los cuadros configuran; el panel lateral solo muestra.

**Lo que no cambia.** El legajo (`docs/legajo/**`) no se edita. La sesión guardada sigue igual: la regla se lee encima
(DL-196, EE-D30). No hay migración: la planificación es JSON dentro del plan. La APK no se toca.

## 0. En criollo

El profesional abre «Progresión…» desde la fase o desde el «Más» de un ejercicio, y se abre un cuadro ancho al centro.
Arriba, en un renglón: «Progresión · Fuerza · Diego Sosa», con el «?» pegado al título; la X, sola a la derecha. A la
izquierda configura: a qué se aplica (toda la fase o los ejercicios elegidos, agrupados por sesión), el modelo (Sin
progresión, Lineal, Doble u Ondulante, en una fila), sus números y la descarga. A la derecha ve, mientras toca, cómo queda
un ejercicio de muestra semana a semana: el gráfico de la carga (desde 0) y la tabla, con la semana de descarga marcada.
Abajo, en un renglón, la aclaración y «Aplicar a 3 ejercicios» o «Aplicar a la fase».

La regla de la fase la heredan todos sus ejercicios. Si la sentadilla tiene que ir de a 5 kg y el resto de a 2,5, la
sentadilla lleva su regla propia, que pisa la de la fase; si el curl tiene que quedar quieto, lleva «Sin progresión». En
el editor, el ejercicio plegado dice su regla («↑ +5 kg/sem») y la fase dice «· 2 ejercicios con progresión propia».

## 1. Alcance

| # | Qué | Dónde |
|---|---|---|
| PE-01 | El contrato: la regla de la fase (`prescriptionIds` en `null`) y las propias (con ejercicios), sin pisarse, hasta 200. | `packages/domain/src/contratos-entrenamiento.ts` |
| PE-02 | La precedencia y la carga de cada semana por ejercicio; la descarga de la sesión. | `progresiones.ts`, `carga-de-la-semana.ts`; la API en `series.service.ts` |
| PE-03 | El cuadro ancho en dos columnas, con la vista previa en vivo. | `apps/web/.../training/asistente-de-progresion.tsx`, `globals.css` (junto a su tema) |
| PE-04 | «Progresión…» en el «Más» del ejercicio, su regla plegado, la cuenta en la fase, «Deshacer». | `editor.tsx`, `ejercicio-del-editor.tsx`, `deshacer-del-editor.ts`, `progresion-del-editor.ts` |
| PE-05 | «Duplicar fase» y las Plantillas de BE llevan las reglas propias, con los ejercicios nuevos. | `fases-del-plan.ts`, `planificacion-de-la-plantilla.ts` |

## 2. Decisiones del continuador, a ratificar

| # | Decisión | Por qué |
|---|---|---|
| PE-D01 | `prescriptionIds` en `null` es la **regla de la fase**; con ejercicios, una **regla propia** de esos ejercicios. Un plan guardado antes, con una regla de «ejercicios elegidos», se lee ahora como propia de esos ejercicios: el resultado es el mismo (los demás quedan sin regla). | El mismo patrón que la intensidad (ET1-D11), sin migrar nada. |
| PE-D02 | **Sin pisarse:** una sola regla de la fase por fase; un ejercicio, como mucho una regla propia en su fase (ni repetido en la misma). Se valida en el arreglo con `superRefine`, con la clave fase y ejercicio. | Lo pidió Dirección; la clave con la fase evita que una regla que quedó en la fase de antes, al mover un ejercicio, trabe el guardado. |
| PE-D03 | **Precedencia:** la propia del ejercicio; si no, la de la fase; si no, ninguna. «Sin progresión» es una propia sin modelo ni descarga: rige y deja al ejercicio igual todas las semanas. | Lo pidió Dirección. |
| PE-D04 | `progressions` sube de 12 a **200** (`MAXIMO_DE_PROGRESIONES`). | Una por ejercicio en un plan grande, con margen. |
| PE-D05 | Una propia «Sin progresión» se guarda **solo si la fase tiene regla**; si no, esos ejercicios simplemente quedan sin regla propia. | Sin regla de la fase, «Sin progresión» no cambia nada: guardarla sería ruido. |
| PE-D06 | **La descarga de la sesión:** la semana es de descarga para una sesión si a alguno de sus ejercicios le toca por la regla que lo rige. Sin ejercicios a mano (el selector de semanas), si alguna regla de la fase la pone ahí. | Con reglas propias, la descarga puede caer en semanas distintas por ejercicio. |
| PE-D07 | Elegir un ejercicio que ya tiene **otra** regla propia lo pasa a esta (lo saca de la otra; la que queda vacía se va). Lo avisa la ficha «Regla propia · ↑ +2,5 kg/sem» en su casilla y una nota fija debajo de la lista. | Un ejercicio lleva una sola; mejor moverlo que trabar con un error. |
| PE-D08 | **«Duplicar fase»** copia las reglas propias con los ejercicios de la copia. Una propia sin ningún ejercicio traducido no se copia (no pasa a valer para toda la fase). La regla de la fase de la copia se elige en el cuadro que se abre al copiar (E19), como antes. | Lo pidió Dirección; no cambia E19. |
| PE-D09 | **Plantillas de BE:** las cuatro de la semilla ya guardaban su regla para «los principales»; ahora se leen como propias de esos ejercicios, con el mismo efecto. Al aplicar una plantilla, cada ejercicio pasa al suyo del plan nuevo. | Sin tocar la semilla. |
| PE-D10 | El cuadro mide hasta 78rem de ancho, con la configuración en 33rem y la vista previa en el resto; con menos de 60rem de ancho, una columna debajo de la otra. La lista de ejercicios elegidos tiene su propio desplazamiento (hasta 10,5rem de alto). | Entra sin desplazarse a 1280 × 720 con una fase típica. |
| PE-D11 | El **«?»** va pegado al título, a la izquierda, y su texto se abre hacia la derecha, dentro del cuadro. Trae un ejemplo resuelto de cada modelo y de la descarga; no hay otro «?» en el cuadro. | La regla nueva: nunca junto a «Cerrar». |
| PE-D12 | **El ejercicio de muestra:** el ejercicio desde el que se abrió; si no, el primero de los afectados con carga escrita. Se cambia con un desplegable entre los afectados (con «Toda la fase», los que no tienen una propia). | Ver la regla sobre un ejercicio real; los que tienen la suya no la reciben. |
| PE-D13 | Al editar una propia, el pie ofrece **«Usar la de la fase»**: el ejercicio deja la suya y vuelve a heredar. Se deshace con Ctrl+Z. | La salida simple, sin pasar por «Sin progresión». |
| PE-D14 | El **cardio** no ofrece «Progresión…» en su «Más». | La regla mueve carga, repeticiones y series; el cardio no las tiene. |
| PE-D15 | La aclaración del pie dice «Se guarda como regla: la persona ve la carga de cada semana.» | Con la API resolviendo la carga por ejercicio (§3), ya es cierto. |
| PE-D16 | **La regla propia vive con su fase.** Un ejercicio que termina en otra fase deja la suya en la vieja: al guardar (la API y la web, `planificacionPodada` con la fase de cada ejercicio) se le quita; no se lleva a la nueva ni pasa a valer para toda la fase vieja. El que se quita del plan pierde la suya igual (ya pasaba). «Duplicar fase» sigue con PE-D08: la copia apunta a los ejercicios nuevos. Si algún día el editor deja mover un ejercicio de fase, avisa con `COPY_PROGRESIONES.propiaQuitadaAlMover` («La progresión propia de … quedó en «…»; se quitó. Podés armarle una en «…».»), breve, sin bloquear y con «Deshacer», a partir de `reglasPropiasQueQuedaronAtras`. | La fase nueva tiene sus semanas y su regla: llevarla sola cambiaría la carga sin que el profesional lo vea. Hoy el editor no mueve ejercicios entre fases (subir, bajar, arrastrar y Alt+↑/↓ son dentro de la sesión; copiar crea ejercicios nuevos), así que la poda es la red, no un camino de todos los días. |

## 3. Compatibilidad y la APK

- **Sin migración.** La planificación es JSON dentro del plan; el contrato nuevo acepta todo lo guardado antes (una regla
  por fase, con o sin ejercicios elegidos, hasta 12).
- **La app no necesita una APK nueva para ver la carga por ejercicio.** La API resuelve la carga de cada semana con la
  regla que rige para cada ejercicio (`bloquesDeLaSemana`, `prescripcionDeLaSemana`) y manda la semana y la descarga de la
  sesión (`series.service.ts`). La app no lee la planificación: muestra lo que le llega. La app móvil sigue compilando
  contra el dominio nuevo (`tsc --noEmit` en `apps/mobile`).
- La vista «Ver como la persona» (`vista-de-la-persona.tsx`) solo se adaptó para compilar con el modelo nuevo; en
  `ux/zoom-escritorio` (#329) queda apagada.

## 4. Pruebas

- **Dominio** (`packages/domain/src/progresion-por-ejercicio.test.ts`): TEST-PE-01 la precedencia; TEST-PE-02 el contrato
  rechaza que se pisen (dos de la fase, un ejercicio en dos propias, repetido) y acepta hasta 200; TEST-PE-03 aplicar y
  quitar sin pisarse; TEST-PE-04 la carga de la semana por ejercicio; TEST-PE-05 la descarga de la sesión; TEST-PE-06
  «Duplicar fase» y las plantillas; TEST-PE-07 las palabras; TEST-PE-08 la regla propia que queda atrás (PE-D16).
- **Web** (`apps/web/test/progresion-por-ejercicio.test.mjs`): TEST-PE-10 a 14 (el cuadro ancho, las dos columnas, «Se
  aplica a» por sesión, el «Más» del ejercicio, «Deshacer» y «Duplicar fase»).
- Las guardias de siempre: `scripts/contraste.test.cjs`, `scripts/acciones-y-ayudas.test.cjs` y el vocabulario visible.

## 5. Lo que queda

- Ratificar PE-D01 a PE-D16.
- Mirarlo en pantalla con Dirección a 1280 × 720 (con una fase de muchos ejercicios, la lista elegida se desplaza sola).
- Un ejercicio que pasa a otra fase pierde su regla propia de la vieja al guardar (PE-D16). Si Dirección quiere que viaje
  con él, va en otro paquete.
