# WP-ANTROPOMETRIA-METODO-Y-KERR · Elegir el método antes de medir y Kerr de cinco componentes

> **La decisión de Dirección (21/11):** Elián, licenciado que mide con Jackson y Pollock de 7 pliegues, ratificó dos cosas:
> sumar el fraccionamiento de Kerr (1988) en cinco componentes, el cálculo que más se usa con ISAK en Argentina, y elegir el
> método **antes** de medir, para que la toma pida solo lo que ese método necesita. Hasta acá había un único protocolo de 30
> mediciones y el método se elegía después de medir.
>
> Rama `wp-antropometria-metodo-y-kerr`, desde `main` (06112f35). Registro: **DL-190** en `docs/DEUDA_LEGAJO.md`. Las
> decisiones de continuador (**AK-D01 a AK-D14**) están **a ratificar**. No se integra sola.

## 0. En criollo

Al empezar una toma, el profesional elige con qué va a calcular: uno o varios métodos, o un conjunto de un toque («Kerr
(1988), cinco componentes», «Somatotipo de Heath y Carter»). La figura y la lista marcan solo lo que piden esos métodos,
más peso, talla y edad. Vienen elegidos los que usó para calcular en su última toma, con cualquier persona; si nunca
calculó, no viene nada y se ve el protocolo entero, como antes. Un punto suelto se suma con «+ Otra medición». Lo que ya
tiene dato nunca se esconde. Al elegir Jackson y Pollock, BE dice dónde toma el suprailíaco (en la cresta ilíaca), para que
el profesional sepa si coincide con su práctica.

Kerr queda entero: las masas de la piel, adiposa, muscular, ósea y residual, cada una con su fuente y su población, y en la
toma un cuadro con el peso de la balanza primero, las cinco masas, su suma (el peso estructurado) y la diferencia con el
peso medido, en kg y en % del peso, que es como Kerr valida el modelo. Para eso BE suma siete mediciones a su catálogo: la
talla sentado, el perímetro de la cabeza, el del muslo a 1 cm del pliegue glúteo y cuatro diámetros (biacromial,
biiliocrestal y los dos del tórax).

## 1. Alcance

| ID | Qué | Dónde |
|---|---|---|
| RP-17 | Kerr (1988), cinco componentes: seis métodos (la piel por sexo; adiposa, muscular, ósea y residual, unisex), con las ecuaciones de la tabla 4.3 de la tesis y los sitios de su apéndice A; las siete mediciones que faltaban, en el catálogo de mediciones; la suma frente al peso medido (diferencia en kg y en %); D-3 resuelta | `formulas-antropometricas.ts`, `fraccionamiento-de-kerr.ts`, `scripts/catalogo-antropometrico/`, `nombres-de-metricas.ts` (generado), migración `20261121150000_kerr_cinco_componentes` (generada), `calculos.tsx` |
| RP-18 | Elegir el método antes de medir: «Qué vas a calcular» en la carga; la unión de lo que piden los métodos, más peso, talla y edad; el método habitual (el de la última toma) elegido de entrada; «+ Otra medición»; la nota de dónde mide BE el suprailíaco de Jackson y Pollock (D-1); al calcular, lo que le falta al método, dicho de una vez. API-MHA-01, familia propia MHA | `metodos-de-la-toma.ts`, `eleccion-de-metodos.tsx`, `preparacion.tsx`, `calculos.tsx`, `ayuda-de-la-carga.tsx`, `metodos.service.ts`, `antropometria.controller.ts`, `contratos-calculo.ts`, `openapi.ts`, `cliente-http.ts`, `docs/api/openapi.json` |

## 2. Kerr (1988), verificado en la fuente

**Fuente primaria.** Kerr DA. *An anthropometric method for fractionation of skin, adipose, bone, muscle and residual tissue
masses, in males and females age 6 to 77 years* [tesis de maestría]. Burnaby: Simon Fraser University; 1988.
https://summit.sfu.ca/item/5139 (PDF escaneado; la página del PDF es la de la tesis más 14). Se leyeron la tabla 4.3
(págs. 65-69), el apéndice A (pág. 122), el apéndice B (págs. 124-126) y las tablas 5.1 (pág. 77) y 5.5 (pág. 91).
**Secundaria:** Ross WD, Kerr DA. Fraccionamiento de la masa corporal: un nuevo método para utilizar en nutrición clínica y
medicina deportiva. *Apunts Med Esport.* 1991;28:175-188.

Las cuatro masas escaladas usan el humano de referencia unisex de Ross y Wilson (el Phantom: talla 170,18 cm, talla sentado
89,92 cm): Z = (Σ · k − media) / desvío y masa = (Z · desvío de la masa + masa del Phantom) / k³, con k = 170,18 / talla
(89,92 / talla sentado para la residual).

| Masa | Lo que suma | Media y desvío del Phantom | Masa y desvío (kg) |
|---|---|---|---|
| Piel | Superficie corporal = C · peso^0,425 · talla^0,725 / 10 000 (m²), C = 68,308 hombres y 73,074 mujeres desde los 12 años, 70,691 antes; × espesor (2,07 mm hombres, 1,96 mujeres) × 1,05 | — | — |
| Adiposa | Σ6: tríceps, subescapular, supraespinal, abdominal, muslo frontal, pantorrilla (mm) | 116,41 ± 34,79 | 25,6 ± 5,85 |
| Muscular | Brazo relajado − π·tríceps/10 + antebrazo + muslo (1 cm glúteo) − π·muslo frontal/10 + pantorrilla − π·pantorrilla/10 + pecho − π·subescapular/10 (cm) | 207,21 ± 13,74 | 24,5 ± 5,4 |
| Ósea | Cabeza: ((perímetro − 56,0) / 1,44) · 0,18 + 1,20, sin escalar. Cuerpo: biacromial + biiliocrestal + 2 · húmero + 2 · fémur (cm) | 98,88 ± 5,33 | 6,70 ± 1,34 |
| Residual | Tórax transverso + tórax anteroposterior + cintura − π·abdominal/10 (cm), con la talla sentado | 109,35 ± 7,08 | 6,10 ± 1,24 |

**Erratas, y lo que se aplica.** La tesis imprime «ZBODY = (SBODY * (170.18/HT)) - 98.88 / 5.33»: al pie de la letra da unos
117 kg de hueso; se aplica (Σ · k − 98,88) / 5,33, la forma de las otras masas, que reproduce las medias de la tabla 5.5.
Dice «SA in m²» sin el /10 000 que hace falta con la talla en cm. Ross y Kerr (1991, pág. 183) imprimen 73,704 para mujeres
(la tesis: 73,074) y «estatura en m» (la tesis: cm).

**D-3, resuelta.**
- **Muslo:** el apéndice A, la planilla de medición, tiene un solo perímetro de muslo, «33. Thigh girth (1 cm dist.
  glut.line)», y la pág. 57 dice «All anthropometric values were obtained according to the protocol of Ross et al. (1987b)».
  El Phantom de Ross y Wilson (1974) tiene un único perímetro de muslo, 55,82 ± 4,23, y con él la suma de perímetros
  corregidos da 207,20 (la tesis publica 207,21); con el muslo medio (53,20, valor que no se pudo verificar en su fuente)
  daría 204,58 y no cierra. **Kerr usa el muslo a 1 cm del pliegue glúteo, no el muslo medio.** BE lo suma como
  `perimetro-muslo-gluteo`; `perimetro-muslo` sigue siendo el muslo medio de Lee. Ross y Kerr (1991) y algunas tesis dicen
  solo «muslo»; una de la UNAM rotula el 55,82 como «1 cm pliegue inguinal» (sic) y mide el muslo medio: la discrepancia
  queda anotada, la planilla de Kerr manda.
- **Pecho:** «30. Chest girth (mesosternale)» en el apéndice A; Phantom 87,86 ± 5,18. Es el `perimetro-pecho` de BE tomado a
  nivel mesoesternal, como ISAK.
- **Cintura:** «31. Waist girth (min.)»: la cintura mínima.

Con esto, Kerr se siembra **publicado** (no «a confirmar»): la duda de la ficha se resolvió con la fuente primaria. Lo que
Elián tiene que mirar es si su práctica coincide (pecho mesoesternal, cintura mínima, muslo a 1 cm del pliegue glúteo).

**Ejemplo de la fuente.** La tesis no trae un sujeto resuelto. Trae las medidas de 25 cadáveres (apéndice B) y las medias
de las masas predichas (tabla 5.5): con las reglas de BE, las medias de piel, adiposa, muscular y ósea de hombres y de
mujeres dan las de la tabla al décimo de kg (hombres 3,61 / 19,29 / 24,75 / 8,66 frente a 3,6 / 19,2 / 24,8 / 8,7; mujeres
3,43 / 23,82 / 17,61 / 7,99 frente a 3,4 / 23,8 / 17,6 / 8,0). La residual no se puede contrastar: el apéndice B no tiene
cintura ni diámetros del tórax. La validación de Kerr en vivo (tabla 5.1): en 1669 personas, la suma dio +1,1 kg
(desvío 3,2), +1,6 % (desvío 5,3); en fisicoculturistas, +6,4 kg (+8,1 %).

## 3. Decisiones del continuador (a ratificar)

- **AK-D01 · Cinco masas, cinco métodos; la suma no es un método.** Un método da un resultado (DL-111, decisión 6): la piel
  por sexo (dos métodos) y las otras cuatro, unisex. El peso estructurado y la diferencia con el peso medido se muestran en
  la toma sumando los resultados registrados (cada uno con un decimal): la cuenta está a la vista y no se guarda aparte.
- **AK-D02 · D-3 resuelta con la fuente primaria y una clave nueva para el muslo de Kerr** (`perimetro-muslo-gluteo`). Los
  sitios se dicen en la descripción del método y en la nota al elegir.
- **AK-D03 · Las siete mediciones nuevas van al catálogo de mediciones del dominio, no a una versión nueva del protocolo.**
  La comparabilidad compara la versión del protocolo (`evaluarComparabilidad`): una versión 2 del «Perfil antropométrico
  completo» marcaría como «otro protocolo» todas las series de las tomas viejas, aunque ningún sitio cambió. Se miden con el
  protocolo de la toma (la API ya lo admitía) y la pantalla las arma con el nombre, la familia y la unidad del catálogo.
  Alternativas: un protocolo nuevo (corta igual) o que una versión que solo agrega no corte la comparabilidad (pide tocar
  la regla de comparabilidad del legajo).
- **AK-D04 · Las erratas del original** (§2): la forma con paréntesis del hueso, el /10 000 de la superficie y 73,074.
- **AK-D05 · Con 12 años cumplidos, la constante de la piel es la de su sexo;** antes, 70,691 para los dos. La tesis dice
  «> 12» y «< 12». El espesor de la piel sigue siendo por sexo también antes de los 12.
- **AK-D06 · Fuera de 6 a 77 años BE calcula igual** y la población del método lo dice, como el resto del catálogo: la
  ecuación existe (a diferencia de Durnin y Womersley debajo de su primera franja).
- **AK-D07 · El método habitual sale de lo calculado, no de una preferencia:** API-MHA-01 (`GET /professional-methods/usual`,
  familia propia MHA) devuelve los métodos de las corridas propias de la última toma del profesional (la creada más
  recientemente que tiene al menos una), con cualquier persona. Solo la identidad del método (`methodId`), nada de la
  persona ni de la toma; como API-MTH-01, la autorización es la capacidad antropométrica y no consume el límite de lecturas
  protegidas. Sin migración.
- **AK-D08 · La elección no se guarda en la toma:** vive en la dirección (`metodos=`, `sueltas=`), como la figura. Al
  reabrir un borrador vienen los habituales y todo lo medido queda a la vista. Si Dirección quiere retomarla igual en otro
  equipo, es aditivo: una tabla y dos operaciones en la familia MHA.
- **AK-D09 · Se elige por familia** (la métrica que da el método): las variantes por sexo piden lo mismo. La ecuación por
  sexo se elige al calcular, con la figura de la toma, que sigue sin guardarse.
- **AK-D10 · Sin método elegido se ve el protocolo entero, como antes; peso, talla y edad van siempre.**
- **AK-D11 · «+ Otra medición»** ofrece lo que el protocolo y el catálogo de BE declaran y no se ve; la carga libre sigue para
  lo que no está en ninguno («Agregar una que no está en la lista»).
- **AK-D12 · La APK 0.31 publicada no se rompe** (§4): las métricas nuevas se publican en la lectura de la persona.
- **AK-D13 · Las notas de sitio** se muestran al elegir y en la lista: el suprailíaco de Jackson y Pollock (cresta ilíaca,
  D-1), el muslo medio de Lee, y el muslo, el pecho y la cintura de Kerr.
- **AK-D14 · Al calcular con un método al que le faltan medidas,** BE las dice todas arriba de la ficha del método (además de
  marcarlas en la lista, como antes) y recuerda que una toma registrada no se completa: se eligen antes de la próxima.

## 4. La APK publicada (0.31)

La APK lee de Antropometría solo API-ANT-06 en su variante propia (`/me/anthropometry/progress`, `miEvolucionAntropometrica`),
con un esquema estricto en la forma pero libre en el código de la métrica: `metricCode` y `unit` son texto, y el método
viaja como `methodVersionId`. Las siete mediciones y las cinco masas de Kerr llegan con códigos nuevos y **no rompen** la
validación (lo fija la lectura congelada, `packages/domain/fixtures/lecturas-de-la-apk/`). La 0.31 no tiene sus nombres en
su dominio: las muestra con el código legible («Perimetro cabeza», «Masa adiposa kerr») y el método como «calculado con el
método declarado», sin inventarle un nombre. La próxima APK, construida con este dominio, las nombra bien.

## 5. Pruebas

- `packages/domain/src/kerr.test.ts`: cada masa con casos calculados a mano (H1 y M2 de la ficha), el Phantom (cada masa da
  la del Phantom), la constante de la piel antes y después de los 12 años, las medias de los 25 cadáveres frente a la tabla
  5.5, los errores por una medición en cero y la suma frente al peso medido.
- `packages/domain/src/metodos-de-la-toma.test.ts`: las familias, la unión, lo medido que no se esconde, las mediciones de
  Kerr que el protocolo no declara, el habitual por método y no por versión, la variante por sexo y la nota del sitio.
- `formulas-antropometricas.test.ts` (50 reglas) y `tomas-de-antropometria.test.ts` (33 mediciones con nombre corto).
- `apps/web/test/antropometria-metodo-y-kerr.test.mjs`: la pantalla usa la elección, guarda todo lo escrito, muestra la nota
  de D-1 y el cuadro de Kerr con lo medido primero.
- `scripts/trazabilidad-de-operaciones.test.cjs`: la familia MHA, con DL-190.
- Integración (corre en la CI): `catalogo-antropometrico.int-spec.ts` (27 métodos vigentes, 20 familias en la evolución,
  API-MHA-01 con la última toma) y `contrato.int-spec.ts` (éxitos y errores de API-MHA-01).

## 6. Lo que queda

- Ratificar AK-D01 a AK-D14.
- Que Elián confirme que su práctica coincide con los sitios de Kerr (pecho mesoesternal, cintura mínima, muslo a 1 cm del
  pliegue glúteo) y con la cresta ilíaca para el suprailíaco de Jackson y Pollock.
- Mirarlo en pantalla (1920 × 1080, Windows al 125 %, navegador al 75 %) y con un lector de pantalla: por la memoria del
  equipo no se corrió `next build` ni el recorrido en el navegador.
- La APK: los nombres de las métricas nuevas llegan con la próxima candidata; congelar sus lecturas entonces (DL-152).
- Calcular las cinco masas de Kerr de un toque (hoy, una por una con «Nuevo cálculo»), y partir el peso en las cinco masas
  en «Composición corporal» y en la lámina.
- La evidencia en pantalla (capturas) del recorrido nuevo.
