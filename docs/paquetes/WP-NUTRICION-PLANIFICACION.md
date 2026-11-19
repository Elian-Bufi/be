# WP-NUTRICION-PLANIFICACION · Planificar Nutrición viendo los números (primer tramo)

> **El pedido de Dirección (16 y 18/11, críticas aprobadas):** al probar el editor del plan de Nutrición del website como
> profesional, faltaban los números donde se decide: lo que aporta cada alimento mientras se escriben los gramos, lo que
> aporta cada comida plegada, dónde queda una opción frente al rango indicado, si la suma de los rangos entra en el
> objetivo, y si los gramos del objetivo suman las kcal que dice. Además, el teclado, la forma de los campos y los cuadros.
>
> Rama `wp-nutricion-planificacion`, desde `main` (e13a5583). **No se integra sola:** Dirección integra la planificación
> entera junta. Las decisiones de continuador (**NUP-D01 a NUP-D12**) están **a ratificar**.

## 0. En criollo

El profesional arma el plan viendo, en el mismo lugar, lo que aporta lo que escribe. Cada alimento dice sus kcal y sus
macros con su cantidad, y cambian mientras se teclean los gramos; la comida plegada dice de cuánto a cuánto aporta según
la opción que se elija; cada opción es un renglón que se abre; y una línea neutra ubica la opción frente al rango de su
comida y del día. Arriba de las comidas, la suma de los rangos indicados se compara con el objetivo del día. El objetivo
avisa si sus gramos no suman las kcal escritas (el caso real: 2.500 kcal con 112 g de proteínas, 80 g de carbohidratos y
335 g de grasas suman unas 3.780 kcal). Nada de esto bloquea ni califica: ubica.

## 1. Alcance de este tramo (NUP-01 a NUP-15)

| ID | Qué | Dónde |
|---|---|---|
| NUP-01 | Lo que aporta cada alimento en su fila, en vivo («420 kcal · P 38 g · C 22 g · G 18 g»); al pasar el mouse o con el foco en la cantidad, su composición cada 100 g y de dónde sale | `comida-del-editor.tsx` (`FilaDeItem`), `planificacion.ts` |
| NUP-02 | La comida plegada: cuántas opciones, lo que aporta de la que menos a la que más («520–700 kcal · P 30–52 g · …») y su rango indicado | `comida-del-editor.tsx` |
| NUP-03 | Cada opción, un renglón plegable con su nombre, sus kcal y sus macros; desplegada, la tabla y las acciones de siempre | `comida-del-editor.tsx`, `editor.tsx` |
| NUP-04 | El rango en vivo: la opción frente al rango de su comida y el día frente al del día, en la opción y en el cuadro de la opción | `planificacion.ts`, `comida-del-editor.tsx`, `cuadro-de-la-opcion.tsx` |
| NUP-05 | Los rangos se ven y se indican mientras se arman los días tipo y las comidas (en cada comida del editor y en los pasos 3, 4 y 5 del asistente), no recién en «Revisar» | `rangos-indicados-del-plan.tsx`, `pasos-del-asistente.tsx` |
| NUP-06 | La suma de los rangos indicados de las comidas frente al objetivo del día, por kcal y por macro, con una franja; separada de lo que aportan las opciones | `planificacion.ts`, `editor.tsx` |
| NUP-07 | El objetivo: las kcal que suman los gramos (4, 4 y 9 kcal por gramo, a la vista), el aviso si no coinciden con las indicadas, y el «%» de las kcal con su base y sus gramos | `formularios.tsx`, `planificacion.ts` |
| NUP-08 | Los detectores del «%»: permitido con su base en el website del profesional; sigue prohibido en la app de la persona | pruebas del website y `scripts/copy-pantallas.test.cjs` |
| NUP-09 | Enter en los formularios: mientras falten datos, pasa al siguiente campo que falta; con todo, envía | `components/formulario.tsx` (pieza común), `validacion-viva.ts` |
| NUP-10 | Proteínas, Carbohidratos y Grasas alineados arriba con un error debajo, sin mover la fila | `globals.css`, `formularios.tsx` |
| NUP-11 | Los cuadros se cierran al tocar afuera, como con Escape; con algo escrito sin guardar, primero preguntan | `components/cuadro-enfocado.tsx`, `components/dialogo.tsx`, `components/panel.tsx`, `components/ayuda-de-vista.tsx`, `components/tocar-afuera.ts` |
| NUP-12 | La comida vacía: «Empezá con: una comida habitual · copiar de otra comida · una receta · alimentos» | `comida-del-editor.tsx` |
| NUP-13 | El paso 5 del asistente ofrece también «+ Opción de receta», «Copiar desde otra comida» y «Usar una comida habitual» | `pasos-del-asistente.tsx`, `editor.tsx` |
| NUP-14 | «Ir a corregirlo en la estación» pasa a «Corregirlo en el plan» («estación» es jerga del código) | `asistente-de-nutricion.ts` |
| NUP-15 | Las capturas en la CI: Claro y Azul noche, a 1280, 1536 y 1920 | `EVIDENCIA/NUTRICION-PLANIFICACION/herramientas/capturas.mjs`, `.github/workflows/capturas-de-la-planificacion.yml` |

**Fuera de este tramo** (el segundo, para después): corregir y retirar alimentos cargados a mano con versiones y el
origen en tres niveles; los platos argentinos; las medidas caseras; los micronutrientes; la imagen de la receta desde el
principio; el rediseño completo del asistente. **El panel de contexto de la persona** lo programa
`wp-contexto-de-la-persona` (DL-179): esta rama no lo duplica ni toca su lugar.

## 2. Decisiones de continuador (a ratificar)

- **NUP-D01 · Una sola cuenta.** Lo que aporta un alimento es la cuenta del dominio (`calcularNutrientes`,
  `SUM_SOURCE_PER_100G_V1`): gramos ÷ 100 × lo que trae la fuente, con las kcal de la fuente. Es la misma que el total de
  la opción, así que la suma de las filas da el total. Los factores 4, 4 y 9 se usan solo donde no hay fuente: el
  objetivo y la suma de los rangos indicados (que no tienen kcal).
- **NUP-D02 · Lo que falta se dice, nunca es cero.** Sin cantidad, en unidades, leyendo la composición o sin
  composición: la fila dice cuál, como ya hacía el total (TEST-EDP-029).
- **NUP-D03 · La composición cada 100 g, en una pista.** Aparece al pasar el mouse por la línea del alimento y al entrar
  con el foco en su cantidad; el lector de pantalla la oye como descripción del campo de la cantidad. Dice de dónde sale
  con el texto breve del origen del catálogo (DL-141 D-6): «USDA», «Demostración», «Cargado por vos»…
- **NUP-D04 · Una opción abierta por comida, o ninguna.** Con una sola opción, nace abierta; con varias, todas
  plegadas, cada una con sus números a la vista. Ir a un problema, duplicar o agregar una opción la abre, como antes la
  elegía. Cada renglón es un botón con `aria-expanded`.
- **NUP-D05 · Ubicar, no calificar.** «dentro del rango», «12 g por encima», «8 g por debajo», sin color ni ícono de
  juicio. Un lado vacío del rango es «sin límite» (como al indicarlo). Se compara con el valor que se muestra (redondeado
  a un decimal), para que nunca diga «0 g por encima». El día va de la opción que menos a la que más aporta: se ubican
  sus dos puntas.
- **NUP-D06 · La suma de los rangos.** Por macro, suma los mínimos (un mínimo vacío cuenta como cero) y los máximos; si
  alguna comida no tiene máximo para ese macro, la suma no tiene tope y se dice cuál. Las kcal de la suma salen de los
  gramos con 4, 4 y 9. Va arriba de las comidas, con su título y una nota que la separa de «Rangos y totales», que es lo
  que aportan las opciones armadas.
- **NUP-D07 · Cuándo coinciden las kcal del objetivo y las de los gramos.** Si la diferencia es de hasta el 5 % de las
  kcal indicadas (los factores 4, 4 y 9 son redondeos). Si no, un aviso neutro con la diferencia en kcal; se puede
  guardar igual.
- **NUP-D08 · El «%» del objetivo.** Su base son las kcal indicadas: «18 % de las 2.500 kcal · 112 g · 448 kcal». Sin
  kcal indicadas, no hay porcentaje. En la app de la persona no cambia nada.
- **NUP-D09 · Enter.** En un campo de una línea, si falta algo en otro campo del formulario, Enter lleva al siguiente que
  falta (y si no hay ninguno después, al primero); si no falta nada, o falta solo el campo donde se está, envía como
  antes. No toca las áreas de texto, las listas ni los botones. Es una pieza común: `useAvisosVivos` la da a todos sus
  formularios (los de Nutrición, la receta, las revisiones y «Solicitar vínculo»), y «Crear a mano» la usa suelta.
- **NUP-D10 · Tocar afuera es Escape.** Vale para las piezas comunes: el cuadro enfocado (y el cajón, que es su forma
  «panel»), el diálogo de confirmación, el panel y la ayuda de la vista. Con algo escrito sin guardar, preguntan en el
  mismo cuadro antes de cerrar: el cuadro enfocado con `conCambios`, como ya hacía con Escape; el diálogo de
  confirmación, si se escribió algo adentro (también con Escape). Un toque que empezó adentro y terminó afuera (al
  seleccionar texto) no cierra. «Volver» y «Cancelar» siguen siendo explícitos.
- **NUP-D11 · El «%» en el website del profesional (decisión de Dirección del 18/11).** Permitido con su base dicha («de
  las 2.500 kcal») y su número real al lado. Los detectores del website pasan a exigir eso; siguen prohibiendo el
  porcentaje de cumplimiento o de adherencia. En la app de la persona, el detector sigue igual.
- **NUP-D12 · La comida vacía empieza por lo que más se usa.** «Una comida habitual · copiar de otra comida · una
  receta · alimentos»: los cuatro abren lo que ya existía (los cuadros de ED-33, el cajón de las recetas y la opción de
  alimentos).

## 3. Pruebas

- **Lógica** (`apps/web/test/planificacion-de-nutricion.test.mjs`): lo que aporta un alimento es la cuenta del dominio
  y la suma de las filas da el total; lo que falta se nombra; la comida de la que menos a la que más; ubicar frente al
  rango (dentro, encima, debajo, sin límite, sin dato); la suma de los rangos frente al objetivo (con el ejemplo de
  Dirección: grasas 50–75 g frente a 335 g); el caso real del objetivo (3.783 kcal frente a 2.500); el «%» con su base;
  Enter (el siguiente que falta, el primero, enviar); tocar afuera (adentro o afuera del cuadro).
- **Del website:** cada prueba fija lo que protege y se verificó con una mutación (con el defecto, falla).
- **Los detectores del «%»** del website exigen la base; el de la app de la persona no cambia.

## 4. Lo que queda abierto

- Los cuadros propios de otras pantallas (invitar, solicitar vínculo, nota de coordinación, la cuenta) cierran con
  Escape sin preguntar: sumarles tocar afuera necesita primero su pregunta. Se anotan para el segundo tramo.
- El recorrido E2E de evidencia (`EVIDENCIA/DASHBOARD-PROFESIONAL/herramientas/recorrido.mjs`) busca las opciones como
  pestañas (`.pestana-de-opcion` con su radio): hay que pasarlo a los renglones nuevos cuando se vuelva a correr.
- WP-GRAFICOS §5.11 sigue diciendo «con Nutrición, sin el signo de porcentaje» para los gráficos: este tramo no toca
  los gráficos; queda para que Dirección diga si el «%» con su base también vale ahí.
- Escribir el reparto en «%» y que BE pase a gramos (con 4, 4 y 9 a la vista) no entra en este tramo: hoy se escribe en
  gramos y se ve el «%».
