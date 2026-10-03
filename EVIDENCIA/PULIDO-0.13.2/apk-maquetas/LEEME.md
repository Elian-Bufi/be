# Evidencia · Pulido visual de la APK: maquetas de antes y después (2026-10-03)

**Esto no son capturas de la APK.** Son maquetas en el navegador. No se pudo correr la APK en esta máquina: no hay
emulador ni teléfono conectado, y la memoria no alcanza. Las capturas de la APK las tiene que tomar Dirección con la
candidata 0.13.2 (ver la lista de abajo).

**Qué tienen de real.**
- **Después.** La composición sale del **mismo módulo** que usa la APK, `apps/mobile/src/composicion-de-la-figura.ts`:
  dónde van el cuerpo, los sitios, las tarjetas, las filas, los números y las guías. Anillos, puntos y guías salen de
  `dibujo-de-la-figura.ts`, y los colores, de los tokens de `tema.ts`. El render de React Native se imita a mano: el
  texto se escala con la escala de letra simulada, y el contorno es la misma imagen teñida y corrida.
- **Antes.** Es la geometría de la 0.13.1 con su manera de escalar: las letras de la figura con tope de 1,2 y en una
  línea, y los botones sin tope.
- La maqueta de antes con letra ×2 reproduce lo que se ve en la captura 01 de la prueba de Dirección: «Perímet / ros»,
  «Pliegue / s», «Hombr / e» y «Subescapular · pos…». Por eso sirve de referencia.

| Archivo | Qué muestra |
|---|---|
| `01-antes-hombre-pliegues-claro-x1.jpg` | 0.13.1, Claro, letra normal: el cuerpo blanco casi no se distingue del fondo; halos grandes en el tronco y el brazo |
| `02-despues-hombre-pliegues-claro-x1.jpg` | Después: contorno medido, halos y guías más livianos, «Subescapular · posterior» en dos líneas y selectores en píldoras |
| `03-antes-hombre-pliegues-azul-noche-x2.jpg` | 0.13.1, Azul noche, letra ×2: palabras partidas, rótulo cortado y figura que no crece |
| `04-despues-hombre-pliegues-azul-noche-x2.jpg` | Después, letra ×2: la figura pasa a números, que bajan en orden, y los valores van en una lista que crece sin tope |
| `05-despues-hombre-perimetros-azul-noche-x1.6.jpg` | Después, perímetros con letra ×1,6, en números |
| `06-despues-mujer-pliegues-azul-noche-x1.15.jpg` | Después, mujer, letra ×1,15: todavía en tarjetas, con filas a la medida de su texto |

## El contraste del cuerpo en Claro, medido

- **Herramienta.** Un script de PowerShell que lee los píxeles opacos de `hombre-entero.png` y `mujer-entero.png` cada
  3 px y calcula la luminancia relativa y la razón de contraste de WCAG.
- **Sin contorno.** El cuerpo contra el fondo de la lámina en Claro (`#E4ECF8`) da de 1,01:1 a 1,15:1 en los
  percentiles 10, 50 y 90; el borde del cuerpo, de 1,12:1 a 1,19:1. Está muy por debajo de 3:1 (WCAG 1.4.11, objetos
  gráficos).
- **En Azul noche** el cuerpo da unos 11:1 con su fondo (`#0C2E63`).
- **El contorno.** Es nuevo, de 1,25 dp, en el token `laminaContorno`:
  - en Claro, `#64748B`, que da 4,0:1 con el fondo. La prueba de contraste lo verifica (`scripts/contraste.test.cjs`);
  - en Azul noche, del tono del cuerpo, casi invisible.

## Lo que hay que mirar en el teléfono con la candidata

1. «Mi evolución» con la letra al máximo:
   - Perímetros/Pliegues y Hombre/Mujer sin palabras partidas;
   - la figura con números, y la lista de abajo legible.
2. Con la letra normal y con la letra un poco más grande: las tarjetas, con «Subescapular · posterior» entero.
3. En Claro: que la silueta se distinga del fondo.
4. El tronco y el brazo menos cargados. **Las posiciones anatómicas no se cambiaron y siguen sin aprobar.**
5. Las fichas de peso, talla y diámetros óseos, y las filas compactas.
6. El encabezado más bajo con letra grande, y las etiquetas de la barra inferior sin pegarse.
7. El selector de colores de Cuenta, en píldoras.

## Cómo se rehacen las maquetas de después

Desde la raíz, con Node 22 y el dominio construido:
```
node EVIDENCIA/PULIDO-0.13.2/apk-maquetas/herramientas/maqueta-figura.mjs <ancho> <HOMBRE|MUJER> <PERIMETROS|PLIEGUES> <azul-noche|claro> <escala de letra> <salida.html>
```
La página dice arriba, en rojo, que es una maqueta.

## Segunda tanda (2026-10-03): «Mi evolución» por tareas, gráfico de puntos y selección en la figura

**También son maquetas, no la APK.** La geometría del gráfico sale de `apps/mobile/src/grafico-de-evolucion.ts`, el
mismo módulo que usa la APK, y la de la figura, de `composicion-de-la-figura.ts`. Las tipografías, las píldoras y las
tarjetas se imitan a mano. Los valores son sintéticos.

| Archivo | Qué muestra |
|---|---|
| `07-evolucion-azul-noche-x1.jpg` | La vista «Evolución» con letra normal: la medida, los días, el gráfico de puntos sobre un eje a escala, la observación elegida con su etiqueta, el detalle y «Anterior»/«Siguiente» |
| `08-evolucion-claro-x1.6.jpg` | La misma vista en Claro con letra ×1,6: las píldoras bajan enteras, los rótulos del gráfico crecen y se saltean fechas para no pisarse |
| `09-comparar-azul-noche-x1.jpg` | «Comparar»: ahora y antes, medida por medida, con la diferencia neutra. Si una medida se comparó con otra fecha, la fila lo dice |
| `10-comparar-claro-x1.6.jpg` | «Comparar» en Claro con letra ×1,6, con una medida sin anterior comparable y su motivo |
| `11-seleccion-azul.jpg` | La selección coordinada en la figura (subescapular): su fila con borde y negrita, su guía resaltada, las demás atenuadas, su sitio con aro propio y el detalle abajo. En la maqueta el anterior es un texto de muestra |

Para rehacerlas, desde la raíz:
```
node EVIDENCIA/PULIDO-0.13.2/apk-maquetas/herramientas/maqueta-evolucion.mjs <EVOLUCION|COMPARAR> <azul-noche|claro> <escala> <salida.html>
ELEGIDA=pliegue-subescapular node EVIDENCIA/PULIDO-0.13.2/apk-maquetas/herramientas/maqueta-figura.mjs 320 HOMBRE PLIEGUES azul-noche 1 <salida.html>
```

**En el teléfono, con la candidata, falta mirar:**
- las tres vistas con la letra normal y al máximo;
- el toque sobre un punto del gráfico y sobre un sitio de la figura;
- «Anterior» y «Siguiente» con dos tomas del mismo día;
- que al volver a la zona se recuerden la vista, la medida y los días elegidos.

## Tanda de cierre (2026-10-03): objetivos táctiles de 48 dp en la figura

**También son maquetas, no la APK.** La composición y el toque salen del mismo módulo que usa la APK
(`composicion-de-la-figura.ts`: `ALTO_MINIMO_DE_FILA`, `sitioTocado`).

- **Las filas de las tarjetas miden al menos 48 dp.**
  - Con la letra normal medían 44. La letra no cambia: crece el aire de la fila.
  - El lienzo crece de 40 a 52 dp con la letra normal; con ×1,15 o más las filas ya medían 50 y nada cambia.
  - El modo, tarjetas o números, sigue igual en todos los casos.
- **En la figura**, cada sitio responde hasta 24 dp de su dibujo, un objetivo de 48 dp, sin agrandar los marcadores.
  - Un pliegue se mide al punto, y un perímetro, al eje de su anillo.
  - Si otro sitio queda a menos de 8 dp de diferencia, el toque no elige: dice «Ahí quedan juntos … tocá su fila para
    elegir uno». Las filas siempre eligen sin ambigüedad.
- **Sin elección directa en la figura** quedan solo los sitios que coinciden en el dibujo, en todos los casos medidos
  (dos figuras, dos familias, letra de ×1 a ×2, 320 y 360 dp):
  - brazo relajado y brazo contraído, a unos 6 dp en el mismo brazo;
  - tríceps y bíceps;
  - cresta ilíaca y supraespinal.
- **Entre sitios apretados** el área clara se achica. Los anillos del tronco quedan a unos 26 dp: entre dos anillos
  hay una franja pareja, y ahí elige la fila. Nunca se elige el sitio equivocado: una prueba recorre cada figura cada
  3 dp y lo verifica.
- **Cruces de guías con la letra normal: de 8 a 10 en los ocho casos.** Aparecen cintura × abdomen en la figura de
  mujer, hombros × pecho a 320 dp y tríceps × bíceps a 360 dp. Desaparecen dos de pliegues. Es la disposición que ya
  tenía la letra ×1,15. Ningún sitio se movió. La selección coordinada atenúa las demás guías.

| Archivo | Qué muestra |
|---|---|
| `12-mapa-de-toque.jpg` | Qué elige cada punto de la figura, hombre con perímetros (Azul noche) y mujer con pliegues (Claro). Cada color es un sitio, y el gris rayado, un toque parejo que deja elegir a la fila. Lo que tapan las tarjetas no se pinta: ahí el toque es de la fila |
| `13-filas-de-48-antes-y-despues.jpg` | Mujer con perímetros, letra normal, 360 dp: a la izquierda las filas de 44 dp, y a la derecha las de 48 |

Para rehacerlas, desde la raíz:
```
MAPA_DE_TOQUE=1 node EVIDENCIA/PULIDO-0.13.2/apk-maquetas/herramientas/maqueta-figura.mjs 360 HOMBRE PERIMETROS azul-noche 1 <salida.html>
```

**En el teléfono falta mirar:**
- tocar cada sitio aislado y uno de los pares que coinciden, y leer el aviso;
- elegir el par desde su fila;
- todo con la letra normal y al máximo, en los dos temas.
