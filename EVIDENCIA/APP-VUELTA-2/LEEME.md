# WP-APP-VUELTA-2 — la evidencia de la etapa A (AV2-01 a AV2-18)

> **Estado (2026-11-11):** la etapa A está **programada** en la rama `wp-app-vuelta-2` (#255, en borrador), **sin
> integrar** ni publicar. Lo que se puede verificar sin teléfono está verificado automáticamente (abajo). Lo que solo se ve
> en el teléfono —el degradé, la sombra y el vidrio dibujados por Android, TalkBack, la letra ×1,3 y el rendimiento— queda
> **pendiente de la muestra** (AV2-18, `muestra/LEEME.md`) y de la medición (AV2-16, `rendimiento/LEEME.md`): ninguna de
> estas pruebas lo da por aprobado.

| Qué | Estado |
|---|---|
| Implementado (AV2-01 a AV2-15) | Sí, en #255 |
| Verificado automáticamente (pruebas y mutaciones) | Sí: `npm test` (la parte de `scripts/` y el jest de la APK) y el typecheck de la APK |
| La guía y los documentos al día (AV2-17) | Sí, en el mismo PR |
| Medido en el teléfono (AV2-16) | Pendiente: procedimiento listo, sin teléfono conectado |
| La muestra en el teléfono de Dirección (AV2-18) | Pendiente: la candidata se arma después de integrar |
| TalkBack | Pendiente de prueba manual |

## Las pruebas y sus mutaciones

Los oráculos están en `docs/paquetes/WP-APP-VUELTA-2-ORACULOS.md`, escritos antes del código. Cada prueba se verificó
rompiendo la regla en el código: la prueba tiene que ponerse en rojo. Las mutaciones se aplicaron con un ayudante que
restaura el archivo desde su copia y verifica que quedó igual; las 16 dieron rojo.

| Oráculo | Prueba | Mutación | Resultado |
|---|---|---|---|
| TEST-AV2-001 | `scripts/contraste.test.cjs` | Los destellos de Azul noche al 14 % y al 18 % (el tenue directo baja a 4,16:1 y el error a 4,47:1) | Rojo |
| TEST-AV2-002 | `scripts/vuelta-de-rosca.test.mjs` | La sombra también en el nivel 2 | Rojo |
| TEST-AV2-003 | `scripts/vuelta-de-rosca.test.mjs` | `elevation: 3` en el nivel 1 | Rojo |
| TEST-AV2-004 | `scripts/vuelta-de-rosca.test.mjs` | El fondo sin `pointerEvents="none"` | Rojo |
| TEST-AV2-005 | `scripts/vuelta-de-rosca.test.mjs` | El resplandor también con el botón deshabilitado | Rojo |
| TEST-AV2-006 | `scripts/vuelta-de-rosca.test.mjs` | El número dibujado dentro de la campana | Rojo |
| TEST-AV2-007 | `scripts/barra-de-zonas.test.mjs` | La barra fija con `barraVidrio` | Rojo |
| TEST-AV2-008 | `scripts/vuelta-de-rosca.test.mjs` | El nombre del día con un solo tipo de día | Rojo |
| TEST-AV2-009 | `scripts/vuelta-de-rosca.test.mjs` | La tilde en un día con solo una «No realizada» | Rojo |
| TEST-AV2-010 | `scripts/vuelta-de-rosca.test.mjs` | `sePuedeIniciar` siempre verdadero | Rojo |
| TEST-AV2-011 | `scripts/vuelta-de-rosca.test.mjs` | Anclar en la primera registrada y no en la última | Rojo |
| TEST-AV2-012 | `scripts/vuelta-de-rosca.test.mjs` | `flex: 1` de vuelta en `tituloDeAyuda` | Rojo |
| TEST-AV2-013 | `scripts/vuelta-de-rosca.test.mjs` | Volver a imprimir «0 con desvío» | Rojo |
| TEST-AV2-014 | `scripts/vuelta-de-rosca.test.mjs` | Contar la comida diferente como «fuera del plan» | Rojo |
| TEST-AV2-015 | `scripts/vuelta-de-rosca.test.mjs` | Perder la comida al armar la ruta | Rojo |
| TEST-AV2-016 | `scripts/vuelta-de-rosca.test.mjs` | La hora en 12 h | Rojo |
| TEST-AV2-026 | `scripts/copy-pantallas.test.cjs` | «racha» en un texto de la tira | Rojo |

Las pruebas vigentes que cambiaron lo hicieron por una decisión ratificada y piden la regla nueva, nunca para pasar:
TEST-AVR-010 (AV2-D1), TEST-AVR-012 y 013 (AV2-D2), y las de Inicio que fijaban «Hola», la lectura de API-NUT-14, la clave
de la lectura de hoy y «Ver tu historial» (AV2-07 y AV2-13). La de la fecha civil compara con un día de 1999 para que el
año salga y se vea que el día no se corre (AV2-15).

### La revisión de la etapa A (2026-11-12)

Una revisión adversarial encontró defectos que las pruebas de arriba no veían (`WP-APP-VUELTA-2.md` §10.4). Cada
arreglo tiene su prueba, y cada prueba, su mutación, con el mismo ayudante: todas dieron rojo, y el archivo volvió a
quedar igual.

| Hallazgo | Oráculo | Mutación | Resultado |
|---|---|---|---|
| Con la letra ×1,3 de Android (1,2999999523…), Inicio seguía en dos columnas (AV2-T17) | TEST-AV2-008 | Volver a comparar la escala con el literal (`>= 1.3`) | Rojo |
| Una palabra larga no entraba en media ficha (AV2-T18) | TEST-AV2-008 | Las fichas sin mirar los nombres (siempre dos columnas) | Rojo |
| «Mediciones» se partía al lado del ícono a 360 dp (AV2-T18) | TEST-AV2-008 | El ícono siempre al lado | Rojo |
| El círculo del día medía 17 dp a 360 dp (AV2-T18) | TEST-AV2-008 | La columna de la tira, de media tarjeta | Rojo |

## El contraste, medido en el peor punto (TEST-AV2-001)

Con la fórmula de `scripts/contraste.test.cjs` (WCAG 2.2). El peor punto es el mínimo sobre los tres puntos del degradé,
con cada destello solo y con los dos juntos; el vidrio y el nivel 2, encima de cada uno. Los números los imprime la
prueba (`t.diagnostic`) y coinciden con §5.2 del paquete, salvo el nivel 1, que acá se mide también con el brillo de
arriba debajo (sin el brillo: 12,64 · 5,79 · 7,21 · 8,29 · 6,22 en Azul noche, como §5.2).

| Par | Azul noche | Claro |
|---|---|---|
| Directo sobre el fondo: texto · tenue · acento · éxito · error | 9,92 · 4,55 · 5,66 · 6,51 · 4,88 | 14,73 · 4,92 · 4,57 · 4,59 · 4,54 |
| Sobre el vidrio (nivel 1), con el brillo de arriba | 10,95 · 5,02 · 6,24 · 7,18 · 5,39 | 15,96 · 5,33 · 4,96 · 4,98 · 4,92 |
| Sobre el nivel 2 | 10,66 · 4,89 · 6,08 · 6,99 · 5,25 | 16,25 · 5,43 · 5,05 · 5,07 · 5,01 |
| `botonTexto` sobre el botón principal, arriba y abajo | 10,68 · 7,78 | 4,73 · 6,75 |
| `bordeControl` sobre el vidrio y el nivel 2 (mínimo 3) | 3,40 | 3,29 |
| La tilde sobre `exito` · el círculo · el aro de hoy (mínimo 3) | 12,29 · 8,29 · 7,21 | 5,07 · 4,98 · 4,96 |
| `tenue` sobre la etiqueta de estado (y la tilde de lo hecho) | 4,60 (6,58) | 4,75 (4,44) |
| «La que sigue»: acento · tenue · texto | 6,11 · 4,91 · 10,72 | 4,60 · 4,95 · 14,81 |
| La barra al 88 %: `barraTexto` · `barraElegido`, con cualquier color del tema detrás | 4,58 · 5,70 | 5,51 · 5,29 |

- **Lo que encontró la medición** (AV2-T14): §5.2 había medido sin el brillo de arriba. Con el brillo al 5 % debajo, en
  Azul noche la etiqueta de estado bajaba a 4,00:1, el tenue sobre el nivel 2 a 4,24:1 y el borde de un campo a 2,95:1.
  El brillo se apaga a 12 dp, dentro del relleno más chico de un nivel 1, y no queda debajo de ningún contenido; el texto
  de nivel 1 se mide igual con el brillo debajo (5,02 o más).
- **La etiqueta de estado** lleva relleno solo sobre una tarjeta de nivel 1: directo sobre el fondo con los destellos, el
  tenue sobre ella bajaba a 3,69:1, y dentro de un nivel 2 también quedaba por debajo.
- **El borde de un campo** sobre el vidrio con los destellos: con el de antes (#4F7FA3), 2,49:1; con #6497BD, 3,40:1.

## Lo que no se pudo hacer sin teléfono

- Ver el degradé, el brillo, la sombra y el vidrio dibujados por Android: el render del navegador no usa Yoga ni dibuja
  estas propiedades. Si el degradé no se dibuja, se pasa al plan B (§3.2).
- TalkBack, la letra ×1,3 y el alto contraste en el teléfono.
- La medición de rendimiento (AV2-16).
- La hora con el `Intl` de Hermes: la APK ya no depende de él para escribir los meses ni la hora, pero se confirma igual.
