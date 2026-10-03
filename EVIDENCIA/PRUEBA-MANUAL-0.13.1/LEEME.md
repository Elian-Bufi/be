# Prueba manual de Dirección · APK 0.13.1 y website (2026-10-02 y 03)

**Qué es:** el registro de la prueba que hizo Dirección en un Android real, con la APK `0.13.1` (commit `6213ec8`; captura 06)
y el website de `test` en el navegador del mismo teléfono.

**Cómo leerlo.** Cada punto dice de dónde sale:
- **Observado:** se ve en una de las capturas de `capturas/`;
- **Informado:** lo contó Dirección y no hay captura que lo muestre;
- **Pendiente:** no se hizo.

Estas capturas no aprueban las posiciones anatómicas ni la accesibilidad.

**Ojo con el tamaño de letra:** las capturas en Claro (04, 05 y 06) tienen la letra del sistema bastante más chica que las de
Azul noche (01 a 03). Una diferencia entre esas capturas puede deberse al tamaño de letra y no al tema.

## Lo que funcionó

| Punto | Fuente |
|---|---|
| «Mi evolución» muestra la toma del 1/10, comparada con la del 24/9: 30 medidas y 28 resultados de fórmulas | Observado (01) |
| Se ven Perímetros y Pliegues, con las dos figuras, Hombre y Mujer | Observado (02 a 05) |
| Los valores no cambian al cambiar de figura | Informado |
| Desplazando la pantalla se llega al final de la lámina y a sus selectores | Observado (03) |
| Se ven Claro y Azul noche | Observado (01 a 05) |
| Claro se conserva al cerrar la APK y volver a abrirla | Informado |
| En el website se ven las evaluaciones, el detalle, los resultados y la lámina | Observado (07 a 10) |
| La imagen exportada sale completa, con los diámetros óseos | Observado (11) |
| Algunos valores de la toma anterior exportada coinciden con la APK, con sus diferencias. **Es una comprobación parcial: no vale para todos los datos** | Informado |
| Con el teclado abierto, el campo enfocado queda a la vista | Observado (13) |
| Con el teclado abierto, «Guardar» se alcanza desplazándose hasta el final | Observado (14) |

## Problemas y mejoras

| Punto | Fuente |
|---|---|
| Con la letra al máximo, «Perímetros» y «Pliegues» se cortan dentro de la palabra | Observado (01) |
| «Subescapular · posterior» aparece truncado en algunas configuraciones | Informado (en 04 se ve entero, con letra chica) |
| El texto de la figura no parece crecer con el texto de la interfaz | Observado (01 a 03: las tarjetas de la figura no siguen al resto). Hay que verificarlo en la implementación |
| El encabezado fijo ocupa mucho espacio con letra grande | Observado (01 a 03) |
| Las etiquetas de la barra inferior quedan apretadas | Observado (01 a 03) |
| En el tronco y el brazo se amontonan puntos, halos y guías | Observado (04) |
| En Claro, el cuerpo blanco se distingue poco del fondo. **Hay que medir el contraste antes de afirmar un incumplimiento** | Observado (04 y 05) |
| En el teléfono, los controles y las explicaciones de la lámina empujan hacia abajo lo principal | Observado (09 y 10) |
| La lista de tomas pone la del 24/9 antes que la del 1/10, y abre en la del 24/9 | Observado (07) |
| «Guardar» no queda siempre a la vista con el teclado abierto. La promesa de «siempre a la vista» no quedó validada | Observado (13, contra 14) |
| La lámina exportada tiene mucho espacio vacío arriba, y su texto se ve chico en el teléfono | Observado (11) |

## Rendimiento y sesión, informados

Son estimaciones manuales, no mediciones instrumentadas.
- Entrar a «Mi evolución» tarda unos 3 s; las otras secciones, 1 s o menos. La espera vuelve a sentirse al cambiar de
  sección.
- La APK vuelve a la bienvenida y pide iniciar sesión después de cerrarla, y también después de un tiempo que no se midió.
  **No hay una medición confiable del vencimiento.**

## Lo que no se hizo en esta ronda

- **TalkBack:** Dirección decidió no probarlo. Queda como no realizado, no aprobado. La accesibilidad no está demostrada.
- **Las posiciones anatómicas** no quedan aprobadas por estas capturas.
- **El website en una computadora** no se verificó a mano.
- **No se guardaron datos** al probar el teclado.
- **Las correcciones de #133 (DL-115) y #134 (P2028)** todavía no se probaron en el teléfono: necesitan una APK nueva y el
  despliegue.

## Las capturas

| Archivo | Qué muestra |
|---|---|
| `01-apk-azul-mi-evolucion-letra-grande.jpg` | «Mi evolución» con letra grande. Los selectores cortados |
| `02-apk-azul-perimetros-hombre.jpg` | La figura de Perímetros, Hombre |
| `03-apk-azul-pie-de-la-figura-hombre-mujer.jpg` | El final de la figura y el selector Hombre/Mujer |
| `04-apk-claro-pliegues.jpg` | La figura de Pliegues en Claro, con letra chica |
| `05-apk-claro-perimetros.jpg` | La figura de Perímetros en Claro |
| `06-apk-claro-bienvenida-0.13.1.jpg` | La bienvenida: app 0.13.1, test, commit 6213ec8 |
| `07-web-tomas-registradas.jpg` | La lista de tomas, que abre en la del 24/9 |
| `08-web-detalle-de-la-toma.jpg` | El detalle de una toma, con sus cálculos |
| `09-web-lamina-controles.jpg` | Los controles de la lámina en el teléfono |
| `10-web-lamina-tema-y-toma.jpg` | El tema, la toma y la vista previa de la lámina |
| `11-web-lamina-exportada.jpg` | La imagen exportada, reducida a 1080 px de ancho; el original es de 2160 × 3840 |
| `12-web-preparacion-guardar.jpg` | La preparación, con «Guardar» al pie |
| `13-web-preparacion-teclado-campo-enfocado.jpg` | Con el teclado abierto: el campo enfocado a la vista y «Guardar» tapado |
| `14-web-preparacion-teclado-guardar-al-final.jpg` | Con el teclado abierto: «Guardar» al final del formulario |

Las capturas están reducidas a 540 px de ancho, salvo la exportada.
