# Medidas y métodos que ve el asesorado en la APK: inventario y propuesta de presentación

**Estado:** inventario para revisar con Dirección (cola del 2026-10-04, punto 4). **Es una propuesta:** no se implementó,
y no se eliminó ni se ocultó ningún método, cálculo, resultado ni dato histórico. La selección definitiva se decide con
Dirección. Desde DL-118 (2026-10-05) «Mi evolución» tiene tres vistas, Mapa corporal, Progreso e Indicadores, con todo
lo que ya mostraba (`docs/ux/MI-EVOLUCION-TRES-VISTAS.md`).

**De dónde sale.**
- El catálogo que la APK muestra: `NOMBRE_DE_METRICA`, `FAMILIA_DE_METRICA` y `NOMBRE_DE_METODO`
  (`packages/domain/src/nombres-de-metricas.ts`).
- Las 44 reglas publicadas (10 índices, 20 porcentajes de grasa y 14 masas): `REGLAS_ANTROPOMETRICAS` (`packages/domain/src/formulas-antropometricas.ts`).
- Fuentes, poblaciones, sitios y decisiones de cada fórmula: `docs/propuestas/METODOS-ANTROPOMETRICOS_ficha.md` (MA-01 a
  MA-58). Este inventario no las repite: remite a la ficha.

**Sin datos de uso.** BE no registra qué métodos consulta cada persona, y la base de prueba tiene solo datos sintéticos.
Por eso no se puede decir qué método se usa más. Nada de lo que sigue afirma que un método sea clínicamente preferible:
los criterios son de presentación y se pueden verificar en el código o en la ficha.

## 1. Dónde aparece hoy cada cosa

| Lugar de la APK | Qué muestra |
|---|---|
| Mi evolución → Mapa corporal | Los perímetros y los pliegues que tienen sitio en la lámina, con su nombre y su valor. Al tocar un sitio, su cambio con la fecha y «Ver su progreso» (DL-118) |
| Mi evolución → Mapa corporal → «La figura, en lista» | Plegada: todo lo de la figura, con su valor, su cambio y, si no es un dato medido o fue corregido, su clase |
| Mi evolución → Progreso | Los mismos sitios por familia y por zona (Torso o Piernas): una tarjeta por sitio con su valor, su cambio respecto de la anterior comparable y sus puntos sobre fechas reales. Al tocarla, el gráfico grande y la lista |
| Mi evolución → Indicadores → Mediciones | Peso y talla, en tarjetas |
| Mi evolución → Indicadores → «Resultados de las fórmulas» | **A la vista y sin plegar:** cada resultado de la toma, marcado como estimación y con el método en su nombre, su cambio y sus puntos |
| Mi evolución → Indicadores → «Datos de la toma» | La edad al momento de la toma, como dato, sin gráfico ni diferencia |
| Mi evolución → Indicadores → «Más datos de esta toma» | Plegado: los tres diámetros óseos y lo que BE no clasifica |
| Inicio → Mediciones | Una sola: la primera medida de la última toma en el orden del catálogo (el peso, si está) |

**Restricciones de comparación, para todo.**
- Dos valores se comparan solo si son del mismo grupo de comparabilidad: el mismo protocolo, el mismo método y la misma
  unidad (REG-06-162/164).
- Un resultado de fórmula se compara solo con otro de la **misma versión de método**. Dos estimaciones del mismo concepto
  con métodos distintos (por ejemplo, el porcentaje de grasa de Durnin y Womersley y el de Jackson y Pollock) nunca se
  comparan entre sí.
- Una toma sin el valor, o con otro grupo, es un hueco: no se completa ni se arrastra (REG-06-165/166).

## 2. Mediciones directas (29) y la edad

Son el dato tomado por el profesional. No dependen de ninguna ecuación.

| Familia | Medidas | Qué expresa | Posibles redundancias | Propuesta |
|---|---|---|---|---|
| Masa y estatura | Peso, talla | Masa corporal y estatura | Ninguna | **Visible** (fichas) |
| Perímetros (13) | Cuello, hombros, pecho, brazo relajado, brazo flexionado y contraído, antebrazo, muñeca, cintura, abdomen, cadera, muslo, pantorrilla, tobillo | Circunferencias en sitios del protocolo | Brazo relajado y contraído, y cintura y abdomen, son sitios distintos, no repeticiones. La lámina los dibuja juntos (sitios coincidentes, DL-113) | **Visible** (figura y su lista) |
| Pliegues (11) | Pectoral, axilar medio, tricipital, subescapular, bicipital, cresta ilíaca, supraespinal, abdominal, muslo frontal, pantorrilla, antebrazo | Espesor del pliegue cutáneo, en mm | Ninguna entre sí; son las entradas de las sumas y de las ecuaciones | **Visible** (figura y su lista) |
| Diámetros (3) | Húmero (codo), biestiloideo (muñeca), fémur (rodilla) | Anchura ósea | Ninguna | **Visible** (fichas) |
| Otras | Edad al momento de la toma | La edad que usan algunas ecuaciones | No es una medida corporal: es una entrada de Deurenberg, Jackson y Pollock, Durnin y Womersley y Lee | **Pendiente de revisión:** ¿va en la lista de medidas, en el encabezado de la toma o solo dentro de cada resultado que la usa? |

## 3. Índices: combinan medidas de la toma, sin ecuación de población (10 versiones)

Su valor sale de las medidas a la vista. No dependen de la población, del sexo ni de la edad.

| Resultado (versiones) | Qué expresa | Requiere | Posibles redundancias | Propuesta |
|---|---|---|---|---|
| Índice de masa corporal (1) | Peso en relación con la talla al cuadrado | Peso, talla | Ninguna | **Visible** |
| Índice cintura/cadera (1) | Cociente de dos perímetros | Cintura, cadera | Usa la cintura, como el índice cintura/talla | **Visible** |
| Índice cintura/talla (1) | Cintura en relación con la estatura | Cintura, talla | Ídem | **Visible** |
| Índice de conicidad (1) | Cintura en relación con peso y talla, con la constante 0,109 de Valdez | Cintura, peso, talla | Usa la cintura, como los dos anteriores | **Más indicadores:** su cálculo incluye una constante del método y no se reconstruye a simple vista |
| Suma de 6 pliegues ISAK (1) | Suma de seis espesores | Los 6 pliegues ISAK | Las tres sumas comparten pliegues; Σ8 incluye a Σ6 | **Visible** |
| Suma de 8 pliegues ISAK (1) | Suma de ocho espesores | Σ6, bíceps, cresta ilíaca | Contiene a Σ6 | **Más indicadores:** con Σ6 a la vista, agrega dos sitios |
| Suma de 7 pliegues Jackson y Pollock (1) | Suma de siete espesores | 7 pliegues de Jackson y Pollock | Comparte 5 sitios con Σ6 | **Más indicadores** |
| Somatotipo: endomorfia, mesomorfia, ectomorfia (3) | Calificación descriptiva de la forma corporal (Heath-Carter) | Pliegues, diámetros, perímetros, talla y peso, según el componente | Los tres se leen juntos, no por separado | **Pendiente de revisión:** sin una explicación de cómo se lee, tres números sueltos se prestan a malentendidos |

## 4. Estimaciones por fórmula: ecuaciones de una población

Estiman una magnitud que no se midió: grasa, masas. Dependen de la población de la ecuación y, varias, del sexo y la
edad. Varias estiman lo mismo con resultados distintos.

### 4.1 Porcentaje de grasa (20 versiones)

| Método (versiones) | Requiere | Posibles redundancias | Propuesta |
|---|---|---|---|
| Durnin y Womersley · hombres y mujeres · Siri y Brozek (4) | Bíceps, tríceps, subescapular, cresta ilíaca, edad | Siri y Brozek salen de la **misma densidad**: dos conversiones del mismo cálculo (ficha, D-9) | **Más indicadores** |
| Jackson y Pollock, 7 pliegues · hombres y mujeres · Siri y Brozek (4) | Σ7 de Jackson y Pollock, edad | Siri y Brozek, ídem | **Más indicadores** |
| Jackson y Pollock, 3 pliegues · hombres y mujeres · Siri y Brozek (4) | Los 3 pliegues de su sexo, edad | Siri y Brozek, ídem; es la versión corta de la de 7 | **Más indicadores** |
| Faulkner · hombres (1) | 4 pliegues de Faulkner | Otro porcentaje de grasa | **Pendiente de revisión:** población estrecha, universitarios y nadadores varones (ficha, MA-31 y D-10) |
| Yuhasz-Carter · hombres y mujeres (2) | Σ6 ISAK | Otro porcentaje de grasa, sobre la misma Σ6 que está a la vista | **Más indicadores** |
| RFM · hombres y mujeres (2) | Talla, cintura | Otro porcentaje de grasa | **Pendiente de revisión:** depende del sitio de la cintura, que el protocolo tiene que declarar (ficha, D-4) |
| BAI (1) | Cadera, talla | Otro porcentaje de grasa | **Más indicadores** |
| Deurenberg, desde el IMC · hombres y mujeres (2) | Peso, talla, edad | Se deriva del IMC, que ya está a la vista | **Más indicadores** |

**Redundancia principal:** una misma toma puede tener varios porcentajes de grasa, de métodos distintos, con valores
distintos y que no se comparan entre sí. **Decisión para Dirección:** ¿se muestran todos dentro de «Más indicadores»,
agrupados bajo «Porcentaje de grasa» con el método en cada uno? ¿O se muestra uno por defecto, elegido por el
profesional en la toma, y el resto plegado? La ficha recomienda Siri antes que Brozek porque es la conversión que usaron
los autores de las ecuaciones de densidad (D-9). No es un dato de uso.

### 4.2 Masas (14 versiones)

| Método (versiones) | Requiere | Posibles redundancias | Propuesta |
|---|---|---|---|
| Masa grasa y masa libre de grasa · Durnin y Womersley · hombres y mujeres (4) | Peso y el porcentaje de grasa de su ecuación | La masa libre de grasa es el peso menos la masa grasa: el par dice lo mismo dos veces | **Más indicadores** |
| Masa grasa y masa libre de grasa · Faulkner · hombres (2) | Peso, 4 pliegues de Faulkner | Ídem, y hereda la población de Faulkner | **Pendiente de revisión** (como Faulkner) |
| Masa ósea · Von Döbeln modificada por Rocha (1) | Talla, biestiloideo, fémur | Ninguna | **Más indicadores** |
| Masa residual · Würch · hombres y mujeres (2) | Peso | Es una fracción fija del peso: no agrega información al peso | **Pendiente de revisión:** ¿aporta algo a la persona? |
| Masa muscular en cuatro componentes · De Rose y Guimarães · hombres (1) | Peso, talla, 4 pliegues de Faulkner, biestiloideo, fémur | Depende de Faulkner y de Rocha | **Pendiente de revisión** (D-10 y D-11 de la ficha) |
| Masa muscular esquelética · Lee, perímetros · hombres y mujeres (2) | Talla, edad, perímetros y pliegues de brazo, muslo y pantorrilla | Otra masa muscular | **Pendiente de revisión:** el sitio del muslo tiene que ser el medio (ficha, D-3) |
| Masa muscular esquelética · Lee, peso y talla · hombres y mujeres (2) | Peso, talla, edad | Otra masa muscular, sin pliegues | **Más indicadores** |

## 5. Propuesta de presentación, en resumen

| Grupo | Qué entra | Por qué |
|---|---|---|
| **Visible al abrir la toma** | Las 29 mediciones directas, el IMC, los índices cintura/cadera y cintura/talla, y la suma de 6 pliegues ISAK | Son el dato tomado, o una cuenta que se reconstruye con las medidas a la vista, sin ecuación de población |
| **Dentro de «Más indicadores»**, plegado y con su método | Conicidad, Σ8 y Σ7, y las estimaciones de grasa y de masas sin reserva abierta en la ficha | Dependen de una ecuación de población, o repiten algo que ya está a la vista, y varias estiman lo mismo con resultados distintos |
| **Pendiente de revisión con Dirección** | La edad como medida, el somatotipo, Faulkner y sus masas, el RFM, la masa residual, De Rose y Guimarães, y Lee con perímetros | Tienen una decisión abierta en la ficha (D-3, D-4, D-10, D-11) o no está claro qué le aportan a la persona |

**Lo que no cambia con ninguna opción:**
- el profesional sigue calculando y publicando todos los métodos;
- la historia completa se conserva;
- cualquier métrica con observaciones se sigue viendo en su toma, en Progreso o en Indicadores, con su detalle en el
  tiempo;
- plegar no borra: «Más indicadores» se abre con un toque y el lector de pantalla dice si está abierto.

**Dependencias.** Ninguna de contrato: la APK ya recibe el método de cada resultado (`methodVersionId`). Agrupar
«Porcentaje de grasa» por concepto se puede hacer en la APK con el catálogo, sin cambiar la API.
