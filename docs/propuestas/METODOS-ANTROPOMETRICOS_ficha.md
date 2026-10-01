# Métodos antropométricos · ficha de fórmulas para el catálogo de BE

> **Estado:** PROPUESTA (2026-10-01). Ficha de investigación para que el ejecutor programe cada fórmula como un método del catálogo antropométrico de BE (DL-110, DL-111). No es legajo ni decisión de Dirección: lo que queda abierto está en §15.
> **Qué trae:** 58 entradas (MA-01 a MA-58): 53 métodos concretos y 5 plantillas de métodos derivados (masa grasa, masa libre de grasa y sus índices), cada uno con fuente, población, entradas con su clave de BE, fórmula exacta, casos de prueba calculados con la cuenta a la vista y límites. Cierra con lo revisado y no incluido (§13), la tabla resumen (§14), las discrepancias entre fuentes y lo que se eligió (§15), el contraste con el borrador que hoy está en el árbol de trabajo (§16) y la bibliografía (§17).
> **Identificadores:** MA-01… y D-1… son locales a esta ficha. Las claves `ant/…@1` son sugeridas; la definitiva la fija quien siembre el catálogo.

## 0. Cómo leer esta ficha

1. **Un método, un resultado.** Si una ecuación encadena pasos (densidad → porcentaje de grasa), el método los hace adentro y devuelve un solo número. Densidad, porcentaje y masa grasa son métodos distintos aunque compartan la ecuación de base.
2. **El sexo no es una entrada:** las ecuaciones por sexo son métodos separados («· hombres», «· mujeres»), y el profesional elige cuál aplicar. La **edad** sí es una entrada: `edad`, en años, admite decimales.
3. **Unidades de BE.** `peso` en kg, `talla` en cm, `edad` en años, pliegues en mm, perímetros y diámetros en cm. Cuando una ecuación pide otra unidad (talla en m, pliegue en cm, diámetro en m), la conversión está escrita en la fórmula del método. Ninguna regla convierte en silencio.
4. **Notación.** `log10` es el logaritmo decimal; ningún método propuesto usa logaritmo natural. `π` es `Math.PI`. `∛x` es la raíz cúbica. En los bloques de fórmula va **punto decimal** (para copiar al código); en el texto y en los casos, **coma decimal**.
5. **Redondeo.** Se calcula en doble precisión, sin redondear los pasos intermedios, y solo el resultado final se redondea a los decimales declarados con el modo `MEDIO_ARRIBA` de BE (`signo · round(|x|)`, como `aplicarPrecision`). En los casos de prueba los intermedios se muestran con hasta 6 u 8 decimales solo para seguir la cuenta; el último número antes de la flecha es el valor sin redondear, y lo que va en negrita es el esperado. Ningún caso cae en el borde de un redondeo (se verificó al generarlos).
6. **Dominio.** Toda entrada tiene que ser mayor que cero. Un resultado sin sentido físico (por ejemplo, un porcentaje de grasa negativo con una densidad mayor que 1,100 g/ml) se trata según D-6.
7. **Sin categorías ni juicios.** Aunque la fuente publique puntos de corte (OMS para el IMC o el ICC, Ashwell para el ICA, categorías del somatotipo), esta ficha no los incluye: el método devuelve el valor, su fuente y su población.
8. **De dónde sale cada número.** Cada método dice si los coeficientes se leyeron en el **original** o, cuando el original no estuvo accesible, en qué **fuentes secundarias** se cruzaron. Lo que no se pudo respaldar está marcado y no se propone sembrar (§13).

## 1. Personas de prueba

Valores sintéticos y plausibles, iguales para todos los métodos, para que el ejecutor arme una sola toma por persona. H1 a H3 son hombres; M1 a M3, mujeres. El `perimetro-muslo` se usa como muslo medio (ver §2 y D-3).

| Clave BE | Unidad | H1 | H2 | H3 | M1 | M2 | M3 |
|---|---|---:|---:|---:|---:|---:|---:|
| sexo (elige el método) | — | hombre | hombre | hombre | mujer | mujer | mujer |
| `edad` | años | 22 | 35 | 55 | 19 | 34 | 47 |
| `peso` | kg | 72,0 | 88,0 | 92,0 | 55,0 | 64,0 | 78,0 |
| `talla` | cm | 176,0 | 178,0 | 172,0 | 162,0 | 166,0 | 160,0 |
| `pliegue-pectoral` | mm | 6,0 | 12,0 | 20,0 | 7,0 | 10,0 | 16,0 |
| `pliegue-axilar-media` | mm | 7,5 | 15,0 | 24,0 | 8,0 | 12,0 | 20,0 |
| `pliegue-triceps` | mm | 8,0 | 12,0 | 16,0 | 15,0 | 19,0 | 26,0 |
| `pliegue-subescapular` | mm | 10,0 | 16,0 | 24,0 | 10,0 | 14,0 | 24,0 |
| `pliegue-biceps` | mm | 4,0 | 6,0 | 9,0 | 6,0 | 8,0 | 13,0 |
| `pliegue-cresta-iliaca` | mm | 12,0 | 22,0 | 30,0 | 14,0 | 20,0 | 28,0 |
| `pliegue-supraespinal` | mm | 7,0 | 14,0 | 20,0 | 10,0 | 14,0 | 20,0 |
| `pliegue-abdominal` | mm | 14,5 | 26,0 | 34,0 | 15,0 | 22,0 | 32,0 |
| `pliegue-muslo-frontal` | mm | 11,0 | 16,0 | 18,0 | 22,0 | 27,0 | 34,0 |
| `pliegue-pantorrilla` | mm | 6,5 | 10,0 | 12,0 | 14,0 | 17,0 | 22,0 |
| `perimetro-cuello` | cm | 37,0 | 40,0 | 42,0 | 31,0 | 33,0 | 35,5 |
| `perimetro-brazo-relajado` | cm | 30,0 | 33,0 | 33,0 | 25,5 | 28,0 | 32,0 |
| `perimetro-brazo-flexionado` | cm | 33,5 | 35,5 | 34,5 | 26,5 | 29,0 | 32,5 |
| `perimetro-antebrazo` | cm | 27,0 | 29,0 | 28,0 | 22,5 | 24,0 | 26,0 |
| `perimetro-pecho` | cm | 95,0 | 104,0 | 108,0 | 84,0 | 90,0 | 100,0 |
| `perimetro-cintura` | cm | 78,0 | 92,0 | 102,0 | 66,0 | 74,0 | 88,0 |
| `perimetro-abdomen` | cm | 80,0 | 95,0 | 106,0 | 72,0 | 82,0 | 96,0 |
| `perimetro-cadera` | cm | 94,0 | 102,0 | 106,0 | 92,0 | 100,0 | 110,0 |
| `perimetro-muslo` | cm | 53,0 | 57,0 | 55,0 | 52,0 | 56,0 | 60,0 |
| `perimetro-pantorrilla` | cm | 37,0 | 39,0 | 38,0 | 34,0 | 36,0 | 38,0 |
| `diametro-humero` | cm | 7,0 | 7,2 | 7,3 | 5,9 | 6,1 | 6,3 |
| `diametro-biestiloideo` | cm | 5,7 | 5,9 | 6,0 | 4,9 | 5,0 | 5,2 |
| `diametro-femur` | cm | 9,6 | 9,9 | 10,0 | 8,6 | 8,9 | 9,2 |

## 2. Sitios de medición: de la fuente a la clave de BE

Las fuentes nombran distinto sitios parecidos. Esta tabla dice qué clave de BE toma cada método y con qué grado de coincidencia. «Coincide» quiere decir que la definición de la fuente y la del sitio de BE describen el mismo lugar; «aproximado», que BE no tiene el sitio exacto y se usa el más cercano.

| Sitio en la fuente | Definición en la fuente | Clave de BE | Coincidencia |
|---|---|---|---|
| Suprailíaco de Durnin y Womersley (1974) | «just above the iliac crest in the mid-axillary line» (D&W 1974, p. 79) | `pliegue-cresta-iliaca` | Coincide: la cresta ilíaca de ISAK se toma inmediatamente por encima de la cresta, en la línea medioaxilar (Pastuszak y col. 2019, que cita el manual ISAK) |
| Suprailíaco de Jackson y Pollock (1978) y de Jackson, Pollock y Ward (1980) | «Diagonal fold; in line with the natural angle of the iliac crest taken in the anterior axillary line immediately superior to the iliac crest» (definición del ACSM, reproducida en Fahey, Insel y Roth 2005, lab A6-3) | `pliegue-cresta-iliaca` | **Aproximado (D-1).** Comparte con la cresta ilíaca de ISAK «inmediatamente por encima de la cresta»; difiere en la línea (axilar anterior, no medioaxilar). El supraespinal queda 5 a 7 cm por encima de la espina ilíaca anterosuperior: más alto. El consenso del GREC (Alvero-Cruz y col. 2010) también lo asigna a la cresta ilíaca («Pl Ileoc») |
| Suprailíaco de Faulkner (1968) | La fuente no describe el sitio: la ecuación aparece en una nota de tabla con el nombre de los cuatro pliegues (Pires Neto y Glaner 2007) | `pliegue-supraespinal` | **Aproximado.** Se sigue al GREC (2009, 2010) y a González-Mendoza y col. (2019), que usan el supraespinal |
| Supraespinal (Heath-Carter, ISAK, Σ6, Σ8, Kerr) | «5-7 cm (depending on the size of the subject) above the anterior superior iliac spine on a line to the anterior axillary border and on a diagonal line going downwards and medially at 45 degrees. (This skinfold was formerly called suprailiac…)» (Carter 2002) | `pliegue-supraespinal` | Coincide |
| Abdominal de Jackson y Pollock | «Vertical fold; 2 cm to the right side of umbilicus» (ACSM, en Fahey y col. 2005) | `pliegue-abdominal` | Aproximado si el protocolo de BE sigue a ISAK, que toma el pliegue vertical más lejos del ombligo. Conviene que el protocolo de BE declare la distancia |
| Pectoral de Jackson y Pollock | «Diagonal fold; one-half the distance between the anterior axillary line and the nipple (men) or one-third of the distance… (women)» (ACSM) | `pliegue-pectoral` | Coincide si el protocolo de BE describe la ubicación por sexo |
| Axilar media de Jackson y Pollock | «Vertical fold; on the midaxillary line at the level of the xiphoid process of the sternum» (ACSM) | `pliegue-axilar-media` | Coincide |
| Muslo de Jackson y Pollock; muslo frontal de ISAK | «Vertical fold; on the anterior midline of the thigh, midway between the proximal border of the patella and the inguinal crease» (ACSM) | `pliegue-muslo-frontal` | Coincide |
| Tríceps | «halfway on a line connecting the acromion and the olecranon processes», cara posterior (Carter 2002; ACSM igual) | `pliegue-triceps` | Coincide |
| Subescapular | «on a line from the inferior angle of the scapula… obliquely downwards and laterally at 45 degrees» (Carter 2002); D&W: «at an angle of about 45° to the vertical» | `pliegue-subescapular` | Coincide |
| Bíceps (D&W, Σ8) | Cara anterior del brazo, sobre el vientre del bíceps (ACSM) | `pliegue-biceps` | Coincide |
| Pantorrilla medial | «vertical skinfold on the medial side of the leg, at the level of the maximum girth of the calf» (Carter 2002) | `pliegue-pantorrilla` | Coincide |
| Perímetro del brazo relajado (Lee, Heymsfield, Kerr) | Brazo relajado, a mitad de la distancia acromion-olécranon (Heymsfield: «midarm circumference»; Lee: «relaxed-arm girth», según González-Mendoza y col. 2019) | `perimetro-brazo-relajado` | Coincide |
| Perímetro del brazo flexionado y contraído (Heath-Carter) | «The subject flexes the shoulder to 90 degrees and the elbow to 45 degrees, clenches the hand, and maximally contracts… greatest girth» (Carter 2002) | `perimetro-brazo-flexionado` | Coincide si el protocolo de BE usa esa posición |
| Perímetro de la pantorrilla | Circunferencia máxima (Carter 2002; Lee: «maximal-calf girth») | `perimetro-pantorrilla` | Coincide |
| Perímetro del muslo (Lee, Martin) | Muslo medio: «el punto entre el pliegue inguinal natural y el borde superior de la rótula… (diferente a la normativa ISAK)» (GREC 2009, nota a Lee); Martin: «mid-thigh» | `perimetro-muslo` | **Solo si el protocolo de BE lo define como muslo medio (D-3).** ISAK tiene además el muslo a 1 cm del pliegue glúteo, que da valores más altos |
| Perímetro del muslo (Kerr) | «thigh girth corrected for front thigh skinfold»; el nivel está en el apéndice A de la tesis, que no se pudo leer | `perimetro-muslo` | **Sin confirmar (D-3)** |
| Perímetro del antebrazo (Martin, Kerr) | Antebrazo, sin corregir por pliegue | `perimetro-antebrazo` | Coincide |
| Perímetro del pecho (Kerr) | «chest girth corrected for subscapular skinfold» | `perimetro-pecho` | Coincide si el protocolo de BE lo toma a nivel mesoesternal (D-3) |
| Cintura de la OMS (ICC, ICA) | «midpoint between the lower margin of the least palpable rib and the top of the iliac crest» (OMS 2011, §2.5) | `perimetro-cintura` | Aproximado si el protocolo de BE usa la cintura mínima de ISAK (D-4). La propia OMS registra que hay protocolos con la cintura mínima, en el ombligo y en la cresta ilíaca |
| Cintura de NHANES (RFM) | «at the level of the uppermost lateral border of the right ilium» (Woolcott y Bergman 2018) | `perimetro-cintura` | **Aproximado (D-4)** |
| Cadera | «around the widest portion of the buttocks» (OMS 2011); Bergman: «at the level of the maximum extension of the buttocks posteriorly» | `perimetro-cadera` | Coincide |
| Diámetros | Biepicondíleo del húmero y del fémur (Carter 2002); biestiloideo y bicondíleo del fémur (Rocha, según GREC) | `diametro-humero`, `diametro-femur`, `diametro-biestiloideo` | Coincide |

Ninguna fórmula de esta ficha usa `pliegue-antebrazo`, `perimetro-hombros`, `perimetro-muneca` ni `perimetro-tobillo`. `perimetro-cuello` y `perimetro-abdomen` solo aparecen en las ecuaciones de la US Navy, que no se proponen (§13).

## 3. Índices y estimaciones con medidas generales

### MA-01 · Índice de masa corporal (Quetelet)

- **Clave:** `ant/imc@1` · **Salida:** `imc`, kg/m², 1 decimal · **Categoría BE:** `INDICES`.
- **Fuente.** Keys A, Fidanza F, Karvonen MJ, Kimura N, Taylor HL. Indices of relative weight and obesity. *J Chronic Dis.* 1972;25(6):329-343. doi:10.1016/0021-9681(72)90027-6 (le da el nombre y lo atribuye a Quetelet). Definición vigente: OMS, *Obesity: preventing and managing the global epidemic*, TRS 894, 2000.
- **Población.** Es un índice, no una ecuación de regresión: no tiene muestra de validación. La OMS lo define para adultos.
- **Entradas.** `peso` (kg); `talla` (cm → m: ÷ 100).
- **Fórmula.**
  ```
  T = talla / 100
  IMC = peso / T^2
  ```
- **Casos de prueba.**
  - **Caso 1 · H1.** `peso` 72,0 kg; `talla` 176,0 cm. T = 176,0 ÷ 100 = 1,76 m; T² = 3,0976; IMC = 72,0 ÷ 3,0976 = 23,243802 → **23,2 kg/m²**.
  - **Caso 2 · M2.** `peso` 64,0 kg; `talla` 166,0 cm. T = 166,0 ÷ 100 = 1,66 m; T² = 2,7556; IMC = 64,0 ÷ 2,7556 = 23,225432 → **23,2 kg/m²**.
  - **Caso 3 · H3.** `peso` 92,0 kg; `talla` 172,0 cm. T = 172,0 ÷ 100 = 1,72 m; T² = 2,9584; IMC = 92,0 ÷ 2,9584 = 31,097891 → **31,1 kg/m²**.
- **Límites.** No distingue masa grasa de masa magra ni dice dónde está la grasa. En menores se interpreta con referencias por edad y sexo, que BE no incluye. Los puntos de corte de la OMS no van (regla 7).

### MA-02 · Índice cintura/cadera (ICC)

- **Clave:** `ant/indice-cintura-cadera@1` · **Salida:** `indice-cintura-cadera`, adimensional, 2 decimales · **Categoría BE:** `INDICES`.
- **Fuente.** World Health Organization. *Waist circumference and waist–hip ratio: report of a WHO expert consultation, Geneva, 8–11 December 2008.* Ginebra: OMS; 2011. ISBN 978 92 4 150149 1. https://www.who.int/publications/i/item/9789241501491
- **Población.** Cociente de dos perímetros; la OMS fija el protocolo: cintura en el punto medio entre el borde inferior de la última costilla palpable y el borde superior de la cresta ilíaca; cadera en la parte más ancha de las nalgas; de pie, al final de una espiración normal, con cinta que ejerza 100 g de tensión.
- **Entradas.** `perimetro-cintura` (cm); `perimetro-cadera` (cm). Misma unidad arriba y abajo.
- **Fórmula.**
  ```
  ICC = perimetro_cintura / perimetro_cadera
  ```
- **Casos de prueba.**
  - **Caso 1 · H2.** `perimetro-cintura` 92,0 cm; `perimetro-cadera` 102,0 cm. ICC = 92,0 ÷ 102,0 = 0,901961 → **0,90**.
  - **Caso 2 · M1.** `perimetro-cintura` 66,0 cm; `perimetro-cadera` 92,0 cm. ICC = 66,0 ÷ 92,0 = 0,717391 → **0,72**.
  - **Caso 3 · M3.** `perimetro-cintura` 88,0 cm; `perimetro-cadera` 110,0 cm. ICC = 88,0 ÷ 110,0 = 0,8 → **0,80**.
- **Límites.** El valor depende del sitio de la cintura (D-4). No dice cuánta grasa hay, solo la proporción entre dos perímetros.

### MA-03 · Índice cintura/talla (ICA)

- **Clave:** `ant/indice-cintura-talla@1` · **Salida:** `indice-cintura-talla`, adimensional, 2 decimales · **Categoría BE:** `INDICES`.
- **Fuente.** Ashwell M, Hsieh SD. Six reasons why the waist-to-height ratio is a rapid and effective global indicator for health risks of obesity… *Int J Food Sci Nutr.* 2005;56(5):303-307. doi:10.1080/09637480500195066. Revisión con metaanálisis en adultos: Ashwell M, Gunn P, Gibson S. *Obes Rev.* 2012;13(3):275-286. doi:10.1111/j.1467-789X.2011.00952.x.
- **Población.** Cociente; el metaanálisis de 2012 reúne estudios en adultos de distintas nacionalidades.
- **Entradas.** `perimetro-cintura` (cm); `talla` (cm). Misma unidad arriba y abajo: no hay conversión.
- **Fórmula.**
  ```
  ICA = perimetro_cintura / talla
  ```
- **Casos de prueba.**
  - **Caso 1 · H1.** `perimetro-cintura` 78,0 cm; `talla` 176,0 cm. ICA = 78,0 ÷ 176,0 = 0,443182 → **0,44**.
  - **Caso 2 · M2.** `perimetro-cintura` 74,0 cm; `talla` 166,0 cm. ICA = 74,0 ÷ 166,0 = 0,445783 → **0,45**.
  - **Caso 3 · H3.** `perimetro-cintura` 102,0 cm; `talla` 172,0 cm. ICA = 102,0 ÷ 172,0 = 0,593023 → **0,59**.
- **Límites.** Igual que el ICC respecto del sitio de la cintura (D-4). Los umbrales que proponen los autores no van.

### MA-04 · Índice de conicidad (Valdez)

- **Clave:** `ant/valdez-indice-conicidad@1` · **Salida:** `indice-conicidad`, adimensional, 2 decimales · **Categoría BE:** `INDICES`.
- **Fuente.** Valdez R. A simple model-based index of abdominal adiposity. *J Clin Epidemiol.* 1991;44(9):955-956. doi:10.1016/0895-4356(91)90059-i (definición). Valdez R, Seidell JC, Ahn YI, Weiss KM. A new index of abdominal adiposity as an indicator of risk for cardiovascular disease. A cross-population study. *Int J Obes Relat Metab Disord.* 1993;17(2):77-82 (aplicación). El texto del original de 1991 no estuvo accesible; la fórmula, con sus unidades, se tomó de Shidfar F, Alborzi F, Salehi M, Nojomi M. *Cardiovasc J Afr.* 2012;23(8):442-445. doi:10.5830/CVJA-2012-038, y coincide con la forma conocida del índice.
- **Población.** Valdez y col. (1993) lo aplicaron en siete poblaciones europeas y dos de Estados Unidos (1280 hombres y 960 mujeres).
- **Entradas.** `perimetro-cintura` (cm → m: ÷ 100); `peso` (kg); `talla` (cm → m: ÷ 100).
- **Fórmula.**
  ```
  C = perimetro_cintura / 100
  T = talla / 100
  IC = C / (0.109 * sqrt(peso / T))
  ```
  El 0,109 es el perímetro de un cilindro con el peso y la talla de la persona y densidad 1050 kg/m³: √(4π/1050) = 0,10940 (verificación propia). De ahí que el valor teórico vaya de 1 (cilindro) a √3 ≈ 1,73 (doble cono).
- **Casos de prueba.**
  - **Caso 1 · H2.** `perimetro-cintura` 92,0 cm; `peso` 88,0 kg; `talla` 178,0 cm. cintura = 0,92 m; T = 1,78 m; peso ÷ T = 49,438202; √ = 7,03123; 0,109 × 7,03123 = 0,766404; IC = 0,92 ÷ 0,766404 = 1,200411 → **1,20**.
  - **Caso 2 · M1.** `perimetro-cintura` 66,0 cm; `peso` 55,0 kg; `talla` 162,0 cm. cintura = 0,66 m; T = 1,62 m; peso ÷ T = 33,950617; √ = 5,826716; 0,109 × 5,826716 = 0,635112; IC = 0,66 ÷ 0,635112 = 1,039187 → **1,04**.
  - **Caso 3 · M3.** `perimetro-cintura` 88,0 cm; `peso` 78,0 kg; `talla` 160,0 cm. cintura = 0,88 m; T = 1,6 m; peso ÷ T = 48,75; √ = 6,98212; 0,109 × 6,98212 = 0,761051; IC = 0,88 ÷ 0,761051 = 1,156296 → **1,16**.
- **Límites.** Mismo problema de sitio de cintura (D-4). La constante supone una densidad corporal fija.

### MA-05 · Índice de adiposidad corporal (BAI, Bergman)

- **Clave:** `ant/bergman-indice-adiposidad@1` · **Salida:** `porcentaje-grasa`, %, 1 decimal · **Categoría BE:** `GRASA_CORPORAL`.
- **Fuente.** Bergman RN, Stefanovski D, Buchanan TA, Sumner AE, Reynolds JC, Sebring NG, Xiang AH, Watanabe RM. A better index of body adiposity. *Obesity (Silver Spring).* 2011;19(5):1083-1089. doi:10.1038/oby.2011.38 (PMC3275633). Unidades del original: cadera en cm, talla en m.
- **Población.** Desarrollo: estudio BetaGene, 1733 adultos mexicano-estadounidenses (61 % mujeres), 18 a 67 años, IMC 17,1 a 71,5. Validación: estudio TARA, 223 afroestadounidenses (43,5 % hombres), 20 a 50 años, IMC 18,5 a 54,7. Referencia: porcentaje de grasa por DXA. Mismo cálculo para hombres y mujeres.
- **Entradas.** `perimetro-cadera` (cm, sin conversión); `talla` (cm → m: ÷ 100).
- **Fórmula.**
  ```
  T = talla / 100
  BAI = perimetro_cadera / T^1.5 - 18
  ```
- **Casos de prueba.**
  - **Caso 1 · H1.** `perimetro-cadera` 94,0 cm; `talla` 176,0 cm. T = 1,76 m; T^1,5 = 2,334904; 94,0 ÷ 2,334904 = 40,258617; BAI = 40,258617 − 18 = 22,258617 → **22,3 %**.
  - **Caso 2 · M2.** `perimetro-cadera` 100,0 cm; `talla` 166,0 cm. T = 1,66 m; T^1,5 = 2,13876; 100,0 ÷ 2,13876 = 46,756056; BAI = 46,756056 − 18 = 28,756056 → **28,8 %**.
  - **Caso 3 · M3.** `perimetro-cadera` 110,0 cm; `talla` 160,0 cm. T = 1,6 m; T^1,5 = 2,023858; 110,0 ÷ 2,023858 = 54,351647; BAI = 54,351647 − 18 = 36,351647 → **36,4 %**.
- **Límites.** Validado en dos grupos étnicos de Estados Unidos y contra DXA. El artículo recibió varias cartas de comentario en *Obesity* (2011 y 2012, según el registro de PubMed). No usa el peso.

### MA-06 y MA-07 · Masa grasa relativa (RFM, Woolcott y Bergman) · hombres y mujeres

- **Claves:** `ant/woolcott-rfm-hombres@1` y `ant/woolcott-rfm-mujeres@1` · **Salida:** `porcentaje-grasa`, %, 1 decimal · **Categoría BE:** `GRASA_CORPORAL`.
- **Fuente.** Woolcott OO, Bergman RN. Relative fat mass (RFM) as a new estimator of whole-body fat percentage ─ A cross-sectional study in American adult individuals. *Sci Rep.* 2018;8:10980. doi:10.1038/s41598-018-29362-1 (PMC6054651). Ecuación original: `64 − (20 × talla/cintura) + (12 × sexo)`, con sexo = 0 en hombres y 1 en mujeres; separada por sexo queda una constante de 64 y otra de 76.
- **Población.** NHANES 1999-2004 para el desarrollo (n = 12 581, 20 a 85 años) y NHANES 2005-2006 para la validación (n = 3456, hasta 69 años, porque el DXA se hizo hasta esa edad). Adultos mexicano-, europeo- y afroestadounidenses. Referencia: DXA.
- **Entradas.** `talla` (cm); `perimetro-cintura` (cm). Misma unidad: el cociente no lleva conversión.
- **Fórmula.**
  ```
  hombres: RFM = 64 - 20 * (talla / perimetro_cintura)
  mujeres: RFM = 76 - 20 * (talla / perimetro_cintura)
  ```
- **Casos de prueba · hombres.**
  - **Caso 1 · H1.** `talla` 176,0 cm; `perimetro-cintura` 78,0 cm. talla ÷ cintura = 176,0 ÷ 78,0 = 2,25641; RFM = 64 − 20 × 2,25641 = 18,871795 → **18,9 %**.
  - **Caso 2 · H2.** `talla` 178,0 cm; `perimetro-cintura` 92,0 cm. talla ÷ cintura = 178,0 ÷ 92,0 = 1,934783; RFM = 64 − 20 × 1,934783 = 25,304348 → **25,3 %**.
  - **Caso 3 · H3.** `talla` 172,0 cm; `perimetro-cintura` 102,0 cm. talla ÷ cintura = 172,0 ÷ 102,0 = 1,686275; RFM = 64 − 20 × 1,686275 = 30,27451 → **30,3 %**.
- **Casos de prueba · mujeres.**
  - **Caso 1 · M1.** `talla` 162,0 cm; `perimetro-cintura` 66,0 cm. talla ÷ cintura = 162,0 ÷ 66,0 = 2,454545; RFM = 76 − 20 × 2,454545 = 26,909091 → **26,9 %**.
  - **Caso 2 · M2.** `talla` 166,0 cm; `perimetro-cintura` 74,0 cm. talla ÷ cintura = 166,0 ÷ 74,0 = 2,243243; RFM = 76 − 20 × 2,243243 = 31,135135 → **31,1 %**.
  - **Caso 3 · M3.** `talla` 160,0 cm; `perimetro-cintura` 88,0 cm. talla ÷ cintura = 160,0 ÷ 88,0 = 1,818182; RFM = 76 − 20 × 1,818182 = 39,636364 → **39,6 %**.
- **Límites.** La cintura de NHANES se toma «at the level of the uppermost lateral border of the right ilium», no en la cintura mínima ni en el punto medio de la OMS (D-4). Los propios autores informan menor capacidad predictiva en personas mayores.

### MA-08 y MA-09 · Porcentaje de grasa desde el IMC (Deurenberg) · hombres y mujeres

- **Claves:** `ant/deurenberg-hombres@1` y `ant/deurenberg-mujeres@1` · **Salida:** `porcentaje-grasa`, %, 1 decimal · **Categoría BE:** `GRASA_CORPORAL`.
- **Fuente.** Deurenberg P, Weststrate JA, Seidell JC. Body mass index as a measure of body fatness: age- and sex-specific prediction formulas. *Br J Nutr.* 1991;65(2):105-114. doi:10.1079/BJN19910073. Ecuación de adultos del resumen: `%G = 1,20 × IMC + 0,23 × edad − 10,8 × sexo − 5,4` (sexo = 1 hombres, 0 mujeres).
- **Población.** 1229 personas (521 hombres, 708 mujeres) de 7 a 83 años, IMC 13,9 a 40,9; referencia: densitometría. La fórmula de adultos vale para mayores de 15 años; la de niños es otra y no se incluye. Error estándar: 4,1 puntos de grasa.
- **Entradas.** `peso` (kg); `talla` (cm → m); `edad` (años).
- **Fórmula.**
  ```
  IMC = peso / (talla / 100)^2
  hombres: %G = 1.20 * IMC + 0.23 * edad - 16.2      (−10,8 − 5,4)
  mujeres: %G = 1.20 * IMC + 0.23 * edad - 5.4
  ```
- **Casos de prueba · hombres.**
  - **Caso 1 · H1.** `peso` 72,0 kg; `talla` 176,0 cm; `edad` 22 años. IMC = 72,0 ÷ 3,0976 = 23,243802; 1,20 × 23,243802 = 27,892562; 0,23 × 22 = 5,06; %G = 27,892562 + 5,06 − 10,8 − 5,4 = 16,752562 → **16,8 %**.
  - **Caso 2 · H2.** `peso` 88,0 kg; `talla` 178,0 cm; `edad` 35 años. IMC = 88,0 ÷ 3,1684 = 27,774271; 1,20 × 27,774271 = 33,329125; 0,23 × 35 = 8,05; %G = 33,329125 + 8,05 − 10,8 − 5,4 = 25,179125 → **25,2 %**.
  - **Caso 3 · H3.** `peso` 92,0 kg; `talla` 172,0 cm; `edad` 55 años. IMC = 92,0 ÷ 2,9584 = 31,097891; 1,20 × 31,097891 = 37,317469; 0,23 × 55 = 12,65; %G = 37,317469 + 12,65 − 10,8 − 5,4 = 33,767469 → **33,8 %**.
- **Casos de prueba · mujeres.**
  - **Caso 1 · M1.** `peso` 55,0 kg; `talla` 162,0 cm; `edad` 19 años. IMC = 55,0 ÷ 2,6244 = 20,957171; 1,20 × 20,957171 = 25,148605; 0,23 × 19 = 4,37; %G = 25,148605 + 4,37 − 5,4 = 24,118605 → **24,1 %**.
  - **Caso 2 · M2.** `peso` 64,0 kg; `talla` 166,0 cm; `edad` 34 años. IMC = 64,0 ÷ 2,7556 = 23,225432; 1,20 × 23,225432 = 27,870518; 0,23 × 34 = 7,82; %G = 27,870518 + 7,82 − 5,4 = 30,290518 → **30,3 %**.
  - **Caso 3 · M3.** `peso` 78,0 kg; `talla` 160,0 cm; `edad` 47 años. IMC = 78,0 ÷ 2,56 = 30,46875; 1,20 × 30,46875 = 36,5625; 0,23 × 47 = 10,81; %G = 36,5625 + 10,81 − 5,4 = 41,9725 → **42,0 %**.
- **Límites.** Según el resumen, en personas con obesidad sobrestima un poco. Hereda los límites del IMC.

## 4. Sumas de pliegues

### MA-10 · Suma de 6 pliegues (ISAK, Carter)

- **Clave:** `ant/suma-6-pliegues-isak@1` · **Salida:** `suma-6-pliegues`, mm, 1 decimal · **Categoría BE:** `SUMAS_DE_PLIEGUES`.
- **Fuente.** Los seis pliegues de Carter (1982) que usa el perfil ISAK: tríceps, subescapular, supraespinal, abdominal, muslo frontal y pantorrilla medial. Definición explícita en Vaquero-Cristóbal R, Albaladejo-Saura M, Luna-Badachi AE, Esparza-Ros F. *Int J Environ Res Public Health.* 2020;17(21):7777. doi:10.3390/ijerph17217777, que mide según ISAK; los mismos seis entran en Carter (1982) y Kerr (1988).
- **Población.** Es una suma: no estima nada y no tiene población. Por eso es la referencia para seguir a la misma persona en el tiempo.
- **Entradas.** `pliegue-triceps`, `pliegue-subescapular`, `pliegue-supraespinal`, `pliegue-abdominal`, `pliegue-muslo-frontal`, `pliegue-pantorrilla` (mm).
- **Fórmula.**
  ```
  Σ6 = triceps + subescapular + supraespinal + abdominal + muslo_frontal + pantorrilla
  ```
- **Casos de prueba.**
  - **Caso 1 · H1.** pliegues en el orden de la fórmula: 8,0 + 10,0 + 7,0 + 14,5 + 11,0 + 6,5 mm. Σ = 57 → **57,0 mm**.
  - **Caso 2 · M2.** pliegues en el orden de la fórmula: 19,0 + 14,0 + 14,0 + 22,0 + 27,0 + 17,0 mm. Σ = 113 → **113,0 mm**.
  - **Caso 3 · H3.** pliegues en el orden de la fórmula: 16,0 + 24,0 + 20,0 + 34,0 + 18,0 + 12,0 mm. Σ = 124 → **124,0 mm**.
- **Límites.** Comparar sumas solo entre tomas del mismo protocolo y, si es posible, del mismo antropometrista y calibre.

### MA-11 · Suma de 8 pliegues (ISAK)

- **Clave:** `ant/suma-8-pliegues-isak@1` · **Salida:** `suma-8-pliegues`, mm, 1 decimal · **Categoría BE:** `SUMAS_DE_PLIEGUES`.
- **Fuente.** Perfil restringido ISAK (Stewart A, Marfell-Jones M, Olds T, de Ridder H. *International Standards for Anthropometric Assessment.* ISAK; 2011): los seis anteriores más bíceps y cresta ilíaca. Definición explícita en Vaquero-Cristóbal y col. (2020).
- **Entradas.** Las seis de MA-10 más `pliegue-biceps` y `pliegue-cresta-iliaca` (mm).
- **Fórmula.**
  ```
  Σ8 = Σ6 + biceps + cresta_iliaca
  ```
- **Casos de prueba.**
  - **Caso 1 · H2.** pliegues en el orden de la fórmula: 12,0 + 16,0 + 14,0 + 26,0 + 16,0 + 10,0 + 6,0 + 22,0 mm. Σ = 122 → **122,0 mm**.
  - **Caso 2 · M1.** pliegues en el orden de la fórmula: 15,0 + 10,0 + 10,0 + 15,0 + 22,0 + 14,0 + 6,0 + 14,0 mm. Σ = 106 → **106,0 mm**.
  - **Caso 3 · M3.** pliegues en el orden de la fórmula: 26,0 + 24,0 + 20,0 + 32,0 + 34,0 + 22,0 + 13,0 + 28,0 mm. Σ = 199 → **199,0 mm**.
- **Límites.** Los de MA-10.

### MA-12 · Suma de 7 pliegues (Jackson y Pollock)

- **Clave:** `ant/suma-7-pliegues-jackson-pollock@1` · **Salida:** `suma-7-pliegues`, mm, 1 decimal · **Categoría BE:** `SUMAS_DE_PLIEGUES`.
- **Fuente.** Jackson AS, Pollock ML. Generalized equations for predicting body density of men. *Br J Nutr.* 1978;40(3):497-504. doi:10.1079/BJN19780152, tabla 4: «X1, sum of chest, axilla, triceps, subscapula, abdomen, suprailium and front thigh skinfolds».
- **Entradas.** `pliegue-pectoral`, `pliegue-axilar-media`, `pliegue-triceps`, `pliegue-subescapular`, `pliegue-abdominal`, `pliegue-cresta-iliaca` (suprailíaco, D-1), `pliegue-muslo-frontal` (mm).
- **Fórmula.**
  ```
  Σ7 = pectoral + axilar_media + triceps + subescapular + abdominal + cresta_iliaca + muslo_frontal
  ```
- **Casos de prueba.**
  - **Caso 1 · H1.** pliegues en el orden de la fórmula: 6,0 + 7,5 + 8,0 + 10,0 + 14,5 + 12,0 + 11,0 mm. Σ = 69 → **69,0 mm**.
  - **Caso 2 · M2.** pliegues en el orden de la fórmula: 10,0 + 12,0 + 19,0 + 14,0 + 22,0 + 20,0 + 27,0 mm. Σ = 124 → **124,0 mm**.
  - **Caso 3 · H3.** pliegues en el orden de la fórmula: 20,0 + 24,0 + 16,0 + 24,0 + 34,0 + 30,0 + 18,0 mm. Σ = 166 → **166,0 mm**.
- **Límites.** El sitio suprailíaco es aproximado (D-1).

## 5. Densidad corporal

La densidad es un resultado en sí (g/ml, que es lo mismo que g/cm³ o kg/L) y el paso previo del porcentaje de grasa de §6. Se proponen como métodos aparte para que el profesional pueda ver la densidad sin elegir todavía la conversión.

### MA-13 · Densidad · Jackson y Pollock, 7 pliegues · hombres

- **Clave:** `ant/jackson-pollock-7-hombres-densidad@1` · **Salida:** `densidad-corporal`, g/ml, 4 decimales · **Categoría BE:** `GRASA_CORPORAL`.
- **Fuente.** Jackson y Pollock (1978), tabla 4, ecuación 1 («S, S², age»), leída en el original escaneado: `BD = 1.11200000 − 0.00043499 (X1) + 0.00000055 (X1)² − 0.00028826 (X3)`, con X1 la suma de 7 pliegues y X3 la edad. R = 0,902; error estándar 0,0078 g/ml.
- **Población.** 308 hombres de 18 a 61 años (muestra de validación) y 95 más para la validación cruzada, de dos laboratorios de Estados Unidos, con composición corporal y hábitos de ejercicio variados. Densidad por pesada hidrostática; grasa de 1 a 33 %; Σ7 de 32 a 272 mm. Calibre Lange.
- **Entradas.** Los siete pliegues de MA-12 (mm) y `edad` (años).
- **Fórmula.**
  ```
  S = Σ7 (MA-12)
  D = 1.112 - 0.00043499 * S + 0.00000055 * S^2 - 0.00028826 * edad
  ```
- **Casos de prueba.**
  - **Caso 1 · H1.** `pliegue-pectoral` 6,0 mm; `pliegue-axilar-media` 7,5 mm; `pliegue-triceps` 8,0 mm; `pliegue-subescapular` 10,0 mm; `pliegue-abdominal` 14,5 mm; `pliegue-cresta-iliaca` 12,0 mm; `pliegue-muslo-frontal` 11,0 mm; `edad` 22 años. S = 6,0 + 7,5 + 8,0 + 10,0 + 14,5 + 12,0 + 11,0 = 69; S² = 4761; D = 1,112 − 0,00043499 × 69 + 0,00000055 × 4761 − 0,00028826 × 22; D = 1,112 − 0,03001431 + 0,00261855 − 0,00634172 = 1,07826252 → **1,0783 g/ml**.
  - **Caso 2 · H2.** `pliegue-pectoral` 12,0 mm; `pliegue-axilar-media` 15,0 mm; `pliegue-triceps` 12,0 mm; `pliegue-subescapular` 16,0 mm; `pliegue-abdominal` 26,0 mm; `pliegue-cresta-iliaca` 22,0 mm; `pliegue-muslo-frontal` 16,0 mm; `edad` 35 años. S = 12,0 + 15,0 + 12,0 + 16,0 + 26,0 + 22,0 + 16,0 = 119; S² = 14161; D = 1,112 − 0,00043499 × 119 + 0,00000055 × 14161 − 0,00028826 × 35; D = 1,112 − 0,05176381 + 0,00778855 − 0,0100891 = 1,05793564 → **1,0579 g/ml**.
  - **Caso 3 · H3.** `pliegue-pectoral` 20,0 mm; `pliegue-axilar-media` 24,0 mm; `pliegue-triceps` 16,0 mm; `pliegue-subescapular` 24,0 mm; `pliegue-abdominal` 34,0 mm; `pliegue-cresta-iliaca` 30,0 mm; `pliegue-muslo-frontal` 18,0 mm; `edad` 55 años. S = 20,0 + 24,0 + 16,0 + 24,0 + 34,0 + 30,0 + 18,0 = 166; S² = 27556; D = 1,112 − 0,00043499 × 166 + 0,00000055 × 27556 − 0,00028826 × 55; D = 1,112 − 0,07220834 + 0,0151558 − 0,0158543 = 1,03909316 → **1,0391 g/ml**.
- **Límites.** Fuera de 18 a 61 años o de 32 a 272 mm se extrapola. Suprailíaco aproximado (D-1); abdominal según el protocolo de BE (§2). El original usó calibre Lange, que tiende a dar lecturas más altas que el Harpenden (Carter 2002).

### MA-14 · Densidad · Jackson y Pollock, 3 pliegues · hombres

- **Clave:** `ant/jackson-pollock-3-hombres-densidad@1` · **Salida:** `densidad-corporal`, g/ml, 4 decimales · **Categoría BE:** `GRASA_CORPORAL`.
- **Fuente.** Jackson y Pollock (1978), tabla 4, ecuación 5: `BD = 1.1093800 − 0.0008267 (X2) + 0.0000016 (X2)² − 0.0002574 (X3)`, con X2 la suma de pecho, abdomen y muslo. R = 0,905; error estándar 0,0077 g/ml.
- **Población.** La de MA-13; Σ3 de 14 a 118 mm.
- **Entradas.** `pliegue-pectoral`, `pliegue-abdominal`, `pliegue-muslo-frontal` (mm); `edad` (años).
- **Fórmula.**
  ```
  S = pectoral + abdominal + muslo_frontal
  D = 1.10938 - 0.0008267 * S + 0.0000016 * S^2 - 0.0002574 * edad
  ```
- **Casos de prueba.**
  - **Caso 1 · H1.** `pliegue-pectoral` 6,0 mm; `pliegue-abdominal` 14,5 mm; `pliegue-muslo-frontal` 11,0 mm; `edad` 22 años. S = 6,0 + 14,5 + 11,0 = 31,5; S² = 992,25; D = 1,10938 − 0,0008267 × 31,5 + 0,0000016 × 992,25 − 0,0002574 × 22; D = 1,10938 − 0,02604105 + 0,0015876 − 0,0056628 = 1,07926375 → **1,0793 g/ml**.
  - **Caso 2 · H2.** `pliegue-pectoral` 12,0 mm; `pliegue-abdominal` 26,0 mm; `pliegue-muslo-frontal` 16,0 mm; `edad` 35 años. S = 12,0 + 26,0 + 16,0 = 54; S² = 2916; D = 1,10938 − 0,0008267 × 54 + 0,0000016 × 2916 − 0,0002574 × 35; D = 1,10938 − 0,0446418 + 0,0046656 − 0,009009 = 1,0603948 → **1,0604 g/ml**.
  - **Caso 3 · H3.** `pliegue-pectoral` 20,0 mm; `pliegue-abdominal` 34,0 mm; `pliegue-muslo-frontal` 18,0 mm; `edad` 55 años. S = 20,0 + 34,0 + 18,0 = 72; S² = 5184; D = 1,10938 − 0,0008267 × 72 + 0,0000016 × 5184 − 0,0002574 × 55; D = 1,10938 − 0,0595224 + 0,0082944 − 0,014157 = 1,043995 → **1,0440 g/ml**.
- **Límites.** Los de MA-13.

### MA-15 · Densidad · Jackson, Pollock y Ward, 7 pliegues · mujeres

- **Clave:** `ant/jackson-pollock-ward-7-mujeres-densidad@1` · **Salida:** `densidad-corporal`, g/ml, 4 decimales · **Categoría BE:** `GRASA_CORPORAL`.
- **Fuente.** Jackson AS, Pollock ML, Ward A. Generalized equations for predicting body density of women. *Med Sci Sports Exerc.* 1980;12(3):175-181. El artículo está detrás de un muro de pago y no se pudo leer; los coeficientes se cruzaron en la hoja de laboratorio de Fahey, Insel y Roth (*Fit and Well*, 6.ª ed., 2005, lab A6-3, que toma Jackson y Pollock 1985 y el ACSM 2000) y en el consenso del GREC 2010, que coinciden salvo una errata del GREC en el coeficiente de la edad (E-2, §15).
- **Población.** Según el resumen: 249 mujeres de 18 a 55 años (31,4 ± 10,8) con 4 a 44 % de grasa (24,1 ± 7,2), densidad por pesada hidrostática; validación cruzada en 82 mujeres. Los autores piden cuidado por encima de los 40 años.
- **Entradas.** Los siete pliegues de MA-12 (mm), con el pectoral a un tercio de la distancia entre la línea axilar anterior y el pezón (§2); `edad` (años).
- **Fórmula.**
  ```
  S = Σ7 (MA-12)
  D = 1.0970 - 0.00046971 * S + 0.00000056 * S^2 - 0.00012828 * edad
  ```
- **Casos de prueba.**
  - **Caso 1 · M1.** `pliegue-pectoral` 7,0 mm; `pliegue-axilar-media` 8,0 mm; `pliegue-triceps` 15,0 mm; `pliegue-subescapular` 10,0 mm; `pliegue-abdominal` 15,0 mm; `pliegue-cresta-iliaca` 14,0 mm; `pliegue-muslo-frontal` 22,0 mm; `edad` 19 años. S = 7,0 + 8,0 + 15,0 + 10,0 + 15,0 + 14,0 + 22,0 = 91; S² = 8281; D = 1,0970 − 0,00046971 × 91 + 0,00000056 × 8281 − 0,00012828 × 19; D = 1,0970 − 0,04274361 + 0,00463736 − 0,00243732 = 1,05645643 → **1,0565 g/ml**.
  - **Caso 2 · M2.** `pliegue-pectoral` 10,0 mm; `pliegue-axilar-media` 12,0 mm; `pliegue-triceps` 19,0 mm; `pliegue-subescapular` 14,0 mm; `pliegue-abdominal` 22,0 mm; `pliegue-cresta-iliaca` 20,0 mm; `pliegue-muslo-frontal` 27,0 mm; `edad` 34 años. S = 10,0 + 12,0 + 19,0 + 14,0 + 22,0 + 20,0 + 27,0 = 124; S² = 15376; D = 1,0970 − 0,00046971 × 124 + 0,00000056 × 15376 − 0,00012828 × 34; D = 1,0970 − 0,05824404 + 0,00861056 − 0,00436152 = 1,043005 → **1,0430 g/ml**.
  - **Caso 3 · M3.** `pliegue-pectoral` 16,0 mm; `pliegue-axilar-media` 20,0 mm; `pliegue-triceps` 26,0 mm; `pliegue-subescapular` 24,0 mm; `pliegue-abdominal` 32,0 mm; `pliegue-cresta-iliaca` 28,0 mm; `pliegue-muslo-frontal` 34,0 mm; `edad` 47 años. S = 16,0 + 20,0 + 26,0 + 24,0 + 32,0 + 28,0 + 34,0 = 180; S² = 32400; D = 1,0970 − 0,00046971 × 180 + 0,00000056 × 32400 − 0,00012828 × 47; D = 1,0970 − 0,0845478 + 0,018144 − 0,00602916 = 1,02456704 → **1,0246 g/ml**.
- **Límites.** Los de MA-13, más la advertencia de los autores sobre las mayores de 40.

### MA-16 · Densidad · Jackson, Pollock y Ward, 3 pliegues · mujeres

- **Clave:** `ant/jackson-pollock-ward-3-mujeres-densidad@1` · **Salida:** `densidad-corporal`, g/ml, 4 decimales · **Categoría BE:** `GRASA_CORPORAL`.
- **Fuente.** Jackson, Pollock y Ward (1980). Coeficientes cruzados en Fahey y col. (2005, lab A6-3) y en Kogure GS y col. *Arch Endocrinol Metab.* 2020;64(3):257-268. doi:10.20945/2359-3997000000246, que la aplica a mujeres brasileñas y la describe como ecuación para mujeres caucásicas no deportistas de 18 a 55 años.
- **Población.** La de MA-15.
- **Entradas.** `pliegue-triceps`, `pliegue-cresta-iliaca` (suprailíaco, D-1), `pliegue-muslo-frontal` (mm); `edad` (años).
- **Fórmula.**
  ```
  S = triceps + cresta_iliaca + muslo_frontal
  D = 1.0994921 - 0.0009929 * S + 0.0000023 * S^2 - 0.0001392 * edad
  ```
- **Casos de prueba.**
  - **Caso 1 · M1.** `pliegue-triceps` 15,0 mm; `pliegue-cresta-iliaca` 14,0 mm; `pliegue-muslo-frontal` 22,0 mm; `edad` 19 años. S = 15,0 + 14,0 + 22,0 = 51; S² = 2601; D = 1,0994921 − 0,0009929 × 51 + 0,0000023 × 2601 − 0,0001392 × 19; D = 1,0994921 − 0,0506379 + 0,0059823 − 0,0026448 = 1,0521917 → **1,0522 g/ml**.
  - **Caso 2 · M2.** `pliegue-triceps` 19,0 mm; `pliegue-cresta-iliaca` 20,0 mm; `pliegue-muslo-frontal` 27,0 mm; `edad` 34 años. S = 19,0 + 20,0 + 27,0 = 66; S² = 4356; D = 1,0994921 − 0,0009929 × 66 + 0,0000023 × 4356 − 0,0001392 × 34; D = 1,0994921 − 0,0655314 + 0,0100188 − 0,0047328 = 1,0392467 → **1,0392 g/ml**.
  - **Caso 3 · M3.** `pliegue-triceps` 26,0 mm; `pliegue-cresta-iliaca` 28,0 mm; `pliegue-muslo-frontal` 34,0 mm; `edad` 47 años. S = 26,0 + 28,0 + 34,0 = 88; S² = 7744; D = 1,0994921 − 0,0009929 × 88 + 0,0000023 × 7744 − 0,0001392 × 47; D = 1,0994921 − 0,0873752 + 0,0178112 − 0,0065424 = 1,0233857 → **1,0234 g/ml**.
- **Límites.** Los de MA-15.

### MA-17 y MA-18 · Densidad · Durnin y Womersley, 4 pliegues · hombres y mujeres

- **Claves:** `ant/durnin-womersley-hombres-densidad@1` y `ant/durnin-womersley-mujeres-densidad@1` · **Salida:** `densidad-corporal`, g/ml, 4 decimales · **Categoría BE:** `GRASA_CORPORAL`.
- **Fuente.** Durnin JVGA, Womersley J. Body fat assessed from total body density and its estimation from skinfold thickness: measurements on 481 men and women aged from 16 to 72 years. *Br J Nutr.* 1974;32(1):77-97. doi:10.1079/BJN19740060. Coeficientes leídos en la imagen escaneada de la **tabla 5** del original (fila «All four skinfolds»), con la forma `densidad = c − m × log skinfold` y logaritmo decimal.
- **Población.** 209 hombres y 272 mujeres sanos, de 16 a 72 años, de Glasgow; «a preponderance of moderately sedentary, middle-class men and women», con voluntarios elegidos para cubrir tipos corporales variados (clínica de obesidad, gimnasios, clubes deportivos, una compañía de ballet). Densidad por pesada hidrostática; calibres Harpenden o Lange; pliegues del lado derecho.
- **Entradas.** `pliegue-biceps`, `pliegue-triceps`, `pliegue-subescapular`, `pliegue-cresta-iliaca` (suprailíaco de D&W, que coincide, §2) (mm); `edad` (años, elige la franja).
- **Coeficientes (tabla 5 del original, completa).**

  | Hombres | c | m | Mujeres | c | m |
  |---|---:|---:|---|---:|---:|
  | 17–19 | 1,1620 | 0,0630 | 16–19 | 1,1549 | 0,0678 |
  | 20–29 | 1,1631 | 0,0632 | 20–29 | 1,1599 | 0,0717 |
  | 30–39 | 1,1422 | 0,0544 | 30–39 | 1,1423 | 0,0632 |
  | 40–49 | 1,1620 | 0,0700 | 40–49 | 1,1333 | 0,0612 |
  | 50 o más | 1,1715 | 0,0779 | 50 o más | 1,1339 | 0,0645 |
  | 17–72 (todas las edades) | 1,1765 | 0,0744 | 16–68 (todas las edades) | 1,1567 | 0,0717 |

  Las franjas se leen como intervalos semiabiertos: 17–19 es `17 ≤ edad < 20`, y así. La fila «todas las edades» es una ecuación aparte; no se propone como método por defecto (D-8).
- **Fórmula.**
  ```
  S = biceps + triceps + subescapular + cresta_iliaca
  (c, m) = franja(sexo del método, edad)        # tabla de arriba
  D = c - m * log10(S)
  edad < 17 (hombres) o < 16 (mujeres): error de dominio, no hay coeficientes
  ```
- **Casos de prueba · hombres.**
  - **Caso 1 · H1.** `pliegue-biceps` 4,0 mm; `pliegue-triceps` 8,0 mm; `pliegue-subescapular` 10,0 mm; `pliegue-cresta-iliaca` 12,0 mm; `edad` 22 años. franja 20–29 → c = 1,1631, m = 0,0632; Σ4 = 4,0 + 8,0 + 10,0 + 12,0 = 34; log10(34) = 1,531479; D = 1,1631 − 0,0632 × 1,531479 = 1,06631053 → **1,0663 g/ml**.
  - **Caso 2 · H2.** `pliegue-biceps` 6,0 mm; `pliegue-triceps` 12,0 mm; `pliegue-subescapular` 16,0 mm; `pliegue-cresta-iliaca` 22,0 mm; `edad` 35 años. franja 30–39 → c = 1,1422, m = 0,0544; Σ4 = 6,0 + 12,0 + 16,0 + 22,0 = 56; log10(56) = 1,748188; D = 1,1422 − 0,0544 × 1,748188 = 1,04709857 → **1,0471 g/ml**.
  - **Caso 3 · H3.** `pliegue-biceps` 9,0 mm; `pliegue-triceps` 16,0 mm; `pliegue-subescapular` 24,0 mm; `pliegue-cresta-iliaca` 30,0 mm; `edad` 55 años. franja 50 o más → c = 1,1715, m = 0,0779; Σ4 = 9,0 + 16,0 + 24,0 + 30,0 = 79; log10(79) = 1,897627; D = 1,1715 − 0,0779 × 1,897627 = 1,02367485 → **1,0237 g/ml**.
  - **Caso 4 · H2 con `edad` 18.** mismos pliegues que H2, edad 18 (franja 17–19). franja 17–19 → c = 1,1620, m = 0,0630; Σ4 = 6,0 + 12,0 + 16,0 + 22,0 = 56; log10(56) = 1,748188; D = 1,1620 − 0,0630 × 1,748188 = 1,05186415; Siri: 495 ÷ 1,05186415 − 450 = 20,593087 → **1,0519 g/ml (Siri: 20,6 %)**.
  - **Caso 5 · H3 con `edad` 45.** mismos pliegues que H3, edad 45 (franja 40–49). franja 40–49 → c = 1,1620, m = 0,0700; Σ4 = 9,0 + 16,0 + 24,0 + 30,0 = 79; log10(79) = 1,897627; D = 1,1620 − 0,0700 × 1,897627 = 1,0291661; Siri: 495 ÷ 1,0291661 − 450 = 30,971923 → **1,0292 g/ml (Siri: 31,0 %)**.
  - **Caso 6 · H1 con `edad` 20.** borde: mismos pliegues que H1, edad exactamente 20 (ya es 20–29). franja 20–29 → c = 1,1631, m = 0,0632; Σ4 = 4,0 + 8,0 + 10,0 + 12,0 = 34; log10(34) = 1,531479; D = 1,1631 − 0,0632 × 1,531479 = 1,06631053; Siri: 495 ÷ 1,06631053 − 450 = 14,217491 → **1,0663 g/ml (Siri: 14,2 %)**.
  - **Caso 7 · H1 con `edad` 16.** mismos pliegues que H1, edad 16 → **sin resultado**: la ecuación no tiene coeficientes para esa edad (error de dominio, no se extrapola).
- **Casos de prueba · mujeres.**
  - **Caso 1 · M1.** `pliegue-biceps` 6,0 mm; `pliegue-triceps` 15,0 mm; `pliegue-subescapular` 10,0 mm; `pliegue-cresta-iliaca` 14,0 mm; `edad` 19 años. franja 16–19 → c = 1,1549, m = 0,0678; Σ4 = 6,0 + 15,0 + 10,0 + 14,0 = 45; log10(45) = 1,653213; D = 1,1549 − 0,0678 × 1,653213 = 1,04281219 → **1,0428 g/ml**.
  - **Caso 2 · M2.** `pliegue-biceps` 8,0 mm; `pliegue-triceps` 19,0 mm; `pliegue-subescapular` 14,0 mm; `pliegue-cresta-iliaca` 20,0 mm; `edad` 34 años. franja 30–39 → c = 1,1423, m = 0,0632; Σ4 = 8,0 + 19,0 + 14,0 + 20,0 = 61; log10(61) = 1,78533; D = 1,1423 − 0,0632 × 1,78533 = 1,02946715 → **1,0295 g/ml**.
  - **Caso 3 · M3.** `pliegue-biceps` 13,0 mm; `pliegue-triceps` 26,0 mm; `pliegue-subescapular` 24,0 mm; `pliegue-cresta-iliaca` 28,0 mm; `edad` 47 años. franja 40–49 → c = 1,1333, m = 0,0612; Σ4 = 13,0 + 26,0 + 24,0 + 28,0 = 91; log10(91) = 1,959041; D = 1,1333 − 0,0612 × 1,959041 = 1,01340667 → **1,0134 g/ml**.
  - **Caso 4 · M2 con `edad` 25.** mismos pliegues que M2, edad 25 (franja 20–29). franja 20–29 → c = 1,1599, m = 0,0717; Σ4 = 8,0 + 19,0 + 14,0 + 20,0 = 61; log10(61) = 1,78533; D = 1,1599 − 0,0717 × 1,78533 = 1,03189185; Siri: 495 ÷ 1,03189185 − 450 = 29,701433 → **1,0319 g/ml (Siri: 29,7 %)**.
  - **Caso 5 · M3 con `edad` 55.** mismos pliegues que M3, edad 55 (franja 50 o más). franja 50 o más → c = 1,1339, m = 0,0645; Σ4 = 13,0 + 26,0 + 24,0 + 28,0 = 91; log10(91) = 1,959041; D = 1,1339 − 0,0645 × 1,959041 = 1,00754183; Siri: 495 ÷ 1,00754183 − 450 = 41,294739 → **1,0075 g/ml (Siri: 41,3 %)**.
  - **Caso 6 · M1 con `edad` 15.** mismos pliegues que M1, edad 15 → **sin resultado**: la ecuación no tiene coeficientes para esa edad (error de dominio, no se extrapola).
- **Límites.** La franja «50 o más» se construyó con personas de hasta 72 años (hombres) y 68 (mujeres): más arriba se extrapola. La población fue escocesa y mayormente sedentaria. El consenso del GREC publica 0,0799 para hombres de 50 a 72; el original dice 0,0779 (E-1, §15).

## 6. Porcentaje de grasa a partir de la densidad (Siri y Brozek)

Cada ecuación de densidad de §5 da dos métodos de porcentaje de grasa, uno por conversión. El método calcula la densidad **sin redondear** y la convierte en un solo paso.

- **Siri.** Siri WE. Body composition from fluid spaces and density: analysis of methods. En: Brozek J, Henschel A, eds. *Techniques for Measuring Body Composition.* Washington: National Academy of Sciences – National Research Council; 1961 (reimpreso en *Nutrition.* 1993;9(5):480-491). Forma: `%G = (4,95/D − 4,50) × 100 = 495/D − 450`. La usan los propios autores de las ecuaciones de densidad: Durnin y Womersley (1974, p. 79: «% fat = (4·95/density − 4·50) × 100», citando a Siri 1956) y Jackson y Pollock (1978, nota de la tabla 1, citando a Siri 1961).
- **Brozek.** Brozek J, Grande F, Anderson JT, Keys A. Densitometric analysis of body composition: revision of some quantitative assumptions. *Ann N Y Acad Sci.* 1963;110:113-140. doi:10.1111/j.1749-6632.1963.tb17079.x. Forma: `%G = (4,570/D − 4,142) × 100 = 457/D − 414,2`. Las dos formas, juntas, en Guerra RS, Amaral TF, Marques E, Mota J, Restivo MT. *J Nutr Health Aging.* 2010;14(9):744-748. doi:10.1007/s12603-010-0112-z.
- **Supuesto común.** Modelo de dos compartimentos: grasa de densidad cercana a 0,90 g/ml y masa libre de grasa de 1,10 g/ml (Durnin y Womersley 1974, introducción). Durnin y Womersley señalan que con Brozek no hay diferencia significativa respecto de Siri en su muestra.
- **Salida de todos:** `porcentaje-grasa`, %, 1 decimal · **Categoría BE:** `GRASA_CORPORAL`. **Población y límites:** los del método de densidad de origen, más el del modelo de dos compartimentos (supone una masa libre de grasa de composición constante; en personas mayores, deportistas muy magros o con poca masa ósea el supuesto se aparta).

| MA | Clave | Densidad de origen | Conversión |
|---|---|---|---|
| MA-19 | `ant/jackson-pollock-7-hombres-siri@1` | MA-13 | Siri |
| MA-20 | `ant/jackson-pollock-7-hombres-brozek@1` | MA-13 | Brozek |
| MA-21 | `ant/jackson-pollock-3-hombres-siri@1` | MA-14 | Siri |
| MA-22 | `ant/jackson-pollock-3-hombres-brozek@1` | MA-14 | Brozek |
| MA-23 | `ant/jackson-pollock-ward-7-mujeres-siri@1` | MA-15 | Siri |
| MA-24 | `ant/jackson-pollock-ward-7-mujeres-brozek@1` | MA-15 | Brozek |
| MA-25 | `ant/jackson-pollock-ward-3-mujeres-siri@1` | MA-16 | Siri |
| MA-26 | `ant/jackson-pollock-ward-3-mujeres-brozek@1` | MA-16 | Brozek |
| MA-27 | `ant/durnin-womersley-hombres-siri@1` | MA-17 | Siri |
| MA-28 | `ant/durnin-womersley-hombres-brozek@1` | MA-17 | Brozek |
| MA-29 | `ant/durnin-womersley-mujeres-siri@1` | MA-18 | Siri |
| MA-30 | `ant/durnin-womersley-mujeres-brozek@1` | MA-18 | Brozek |

```
siri(D)   = 495 / D - 450
brozek(D) = 457 / D - 414.2
```

**MA-19 · Jackson y Pollock 7 · hombres · Siri**
  - **Caso 1 · H1.** mismas entradas que el caso 1 de densidad. D = 1,07826252 (sin redondear); %G = 495 ÷ 1,07826252 − 450 = 459,071878 − 450 = 9,071878 → **9,1 %**.
  - **Caso 2 · H2.** mismas entradas que el caso 2 de densidad. D = 1,05793564 (sin redondear); %G = 495 ÷ 1,05793564 − 450 = 467,892357 − 450 = 17,892357 → **17,9 %**.
  - **Caso 3 · H3.** mismas entradas que el caso 3 de densidad. D = 1,03909316 (sin redondear); %G = 495 ÷ 1,03909316 − 450 = 476,376921 − 450 = 26,376921 → **26,4 %**.

**MA-20 · Jackson y Pollock 7 · hombres · Brozek**
  - **Caso 1 · H1.** mismas entradas que el caso 1 de densidad. D = 1,07826252 (sin redondear); %G = 457 ÷ 1,07826252 − 414,2 = 423,829996 − 414,2 = 9,629996 → **9,6 %**.
  - **Caso 2 · H2.** mismas entradas que el caso 2 de densidad. D = 1,05793564 (sin redondear); %G = 457 ÷ 1,05793564 − 414,2 = 431,973348 − 414,2 = 17,773348 → **17,8 %**.
  - **Caso 3 · H3.** mismas entradas que el caso 3 de densidad. D = 1,03909316 (sin redondear); %G = 457 ÷ 1,03909316 − 414,2 = 439,806571 − 414,2 = 25,606571 → **25,6 %**.

**MA-21 · Jackson y Pollock 3 · hombres · Siri**
  - **Caso 1 · H1.** mismas entradas que el caso 1 de densidad. D = 1,07926375 (sin redondear); %G = 495 ÷ 1,07926375 − 450 = 458,645998 − 450 = 8,645998 → **8,6 %**.
  - **Caso 2 · H2.** mismas entradas que el caso 2 de densidad. D = 1,0603948 (sin redondear); %G = 495 ÷ 1,0603948 − 450 = 466,807268 − 450 = 16,807268 → **16,8 %**.
  - **Caso 3 · H3.** mismas entradas que el caso 3 de densidad. D = 1,043995 (sin redondear); %G = 495 ÷ 1,043995 − 450 = 474,140202 − 450 = 24,140202 → **24,1 %**.

**MA-22 · Jackson y Pollock 3 · hombres · Brozek**
  - **Caso 1 · H1.** mismas entradas que el caso 1 de densidad. D = 1,07926375 (sin redondear); %G = 457 ÷ 1,07926375 − 414,2 = 423,436811 − 414,2 = 9,236811 → **9,2 %**.
  - **Caso 2 · H2.** mismas entradas que el caso 2 de densidad. D = 1,0603948 (sin redondear); %G = 457 ÷ 1,0603948 − 414,2 = 430,971559 − 414,2 = 16,771559 → **16,8 %**.
  - **Caso 3 · H3.** mismas entradas que el caso 3 de densidad. D = 1,043995 (sin redondear); %G = 457 ÷ 1,043995 − 414,2 = 437,74156 − 414,2 = 23,54156 → **23,5 %**.

**MA-23 · Jackson, Pollock y Ward 7 · mujeres · Siri**
  - **Caso 1 · M1.** mismas entradas que el caso 1 de densidad. D = 1,05645643 (sin redondear); %G = 495 ÷ 1,05645643 − 450 = 468,547482 − 450 = 18,547482 → **18,5 %**.
  - **Caso 2 · M2.** mismas entradas que el caso 2 de densidad. D = 1,043005 (sin redondear); %G = 495 ÷ 1,043005 − 450 = 474,590246 − 450 = 24,590246 → **24,6 %**.
  - **Caso 3 · M3.** mismas entradas que el caso 3 de densidad. D = 1,02456704 (sin redondear); %G = 495 ÷ 1,02456704 − 450 = 483,130904 − 450 = 33,130904 → **33,1 %**.

**MA-24 · Jackson, Pollock y Ward 7 · mujeres · Brozek**
  - **Caso 1 · M1.** mismas entradas que el caso 1 de densidad. D = 1,05645643 (sin redondear); %G = 457 ÷ 1,05645643 − 414,2 = 432,57818 − 414,2 = 18,37818 → **18,4 %**.
  - **Caso 2 · M2.** mismas entradas que el caso 2 de densidad. D = 1,043005 (sin redondear); %G = 457 ÷ 1,043005 − 414,2 = 438,157056 − 414,2 = 23,957056 → **24,0 %**.
  - **Caso 3 · M3.** mismas entradas que el caso 3 de densidad. D = 1,02456704 (sin redondear); %G = 457 ÷ 1,02456704 − 414,2 = 446,042067 − 414,2 = 31,842067 → **31,8 %**.

**MA-25 · Jackson, Pollock y Ward 3 · mujeres · Siri**
  - **Caso 1 · M1.** mismas entradas que el caso 1 de densidad. D = 1,0521917 (sin redondear); %G = 495 ÷ 1,0521917 − 450 = 470,446593 − 450 = 20,446593 → **20,4 %**.
  - **Caso 2 · M2.** mismas entradas que el caso 2 de densidad. D = 1,0392467 (sin redondear); %G = 495 ÷ 1,0392467 − 450 = 476,30654 − 450 = 26,30654 → **26,3 %**.
  - **Caso 3 · M3.** mismas entradas que el caso 3 de densidad. D = 1,0233857 (sin redondear); %G = 495 ÷ 1,0233857 − 450 = 483,688603 − 450 = 33,688603 → **33,7 %**.

**MA-26 · Jackson, Pollock y Ward 3 · mujeres · Brozek**
  - **Caso 1 · M1.** mismas entradas que el caso 1 de densidad. D = 1,0521917 (sin redondear); %G = 457 ÷ 1,0521917 − 414,2 = 434,331501 − 414,2 = 20,131501 → **20,1 %**.
  - **Caso 2 · M2.** mismas entradas que el caso 2 de densidad. D = 1,0392467 (sin redondear); %G = 457 ÷ 1,0392467 − 414,2 = 439,741594 − 414,2 = 25,541594 → **25,5 %**.
  - **Caso 3 · M3.** mismas entradas que el caso 3 de densidad. D = 1,0233857 (sin redondear); %G = 457 ÷ 1,0233857 − 414,2 = 446,556953 − 414,2 = 32,356953 → **32,4 %**.

**MA-27 · Durnin y Womersley · hombres · Siri**
  - **Caso 1 · H1.** mismas entradas que el caso 1 de densidad. D = 1,06631053 (sin redondear); %G = 495 ÷ 1,06631053 − 450 = 464,217491 − 450 = 14,217491 → **14,2 %**.
  - **Caso 2 · H2.** mismas entradas que el caso 2 de densidad. D = 1,04709857 (sin redondear); %G = 495 ÷ 1,04709857 − 450 = 472,734863 − 450 = 22,734863 → **22,7 %**.
  - **Caso 3 · H3.** mismas entradas que el caso 3 de densidad. D = 1,02367485 (sin redondear); %G = 495 ÷ 1,02367485 − 450 = 483,55198 − 450 = 33,55198 → **33,6 %**.

Ejemplos resueltos de la fuente. La tabla 9 de Durnin y Womersley (p. 95) publica el porcentaje de grasa, calculado con Siri, para sumas de 4 pliegues de 15 a 210 mm por franja de edad. Se toman celdas de franjas que existen en la tabla 5:
  - **Caso A · fuente, tabla 9.** hombres, `edad` 35; Σ4 = 40 mm (por ejemplo 4,0 + 10,0 + 12,0 + 14,0); la tabla publica **19,2 %**. franja 30–39 → c = 1,1422, m = 0,0544; Σ4 = 4,0 + 10,0 + 12,0 + 14,0 = 40; log10(40) = 1,60206; D = 1,1422 − 0,0544 × 1,60206 = 1,05504794; Siri: 495 ÷ 1,05504794 − 450 = 19,172995 → **19,2 % (coincide con la tabla)**.
  - **Caso B · fuente, tabla 9.** hombres, `edad` 35; Σ4 = 100 mm (por ejemplo 10,0 + 25,0 + 30,0 + 35,0); la tabla publica **29,0 %**. franja 30–39 → c = 1,1422, m = 0,0544; Σ4 = 10,0 + 25,0 + 30,0 + 35,0 = 100; log10(100) = 2; D = 1,1422 − 0,0544 × 2 = 1,0334; Siri: 495 ÷ 1,0334 − 450 = 29,001355 → **29,0 % (coincide con la tabla)**.

Atención con esta tabla: los autores la calcularon con sus coeficientes sin redondear, y con los de la tabla 5 (cuatro decimales) algunas celdas no se reproducen al décimo. Por ejemplo, hombres de 50 o más con Σ4 = 50 mm: D = 1,03915024 y Siri = 26,350755 → 26,4 %, mientras la tabla 9 publica 26,5 %. Si se usa la tabla 9 como control, que sea con tolerancia de ±0,2 puntos (E-10, §15); los casos 1 a 3 y los ejemplos A y B sí se reproducen al décimo. Las columnas «17–29» y «16–29» de la tabla 9 agrupan franjas que la tabla 5 separa, así que no sirven para controlar este método.

**MA-28 · Durnin y Womersley · hombres · Brozek**
  - **Caso 1 · H1.** mismas entradas que el caso 1 de densidad. D = 1,06631053 (sin redondear); %G = 457 ÷ 1,06631053 − 414,2 = 428,580593 − 414,2 = 14,380593 → **14,4 %**.
  - **Caso 2 · H2.** mismas entradas que el caso 2 de densidad. D = 1,04709857 (sin redondear); %G = 457 ÷ 1,04709857 − 414,2 = 436,444106 − 414,2 = 22,244106 → **22,2 %**.
  - **Caso 3 · H3.** mismas entradas que el caso 3 de densidad. D = 1,02367485 (sin redondear); %G = 457 ÷ 1,02367485 − 414,2 = 446,430818 − 414,2 = 32,230818 → **32,2 %**.

**MA-29 · Durnin y Womersley · mujeres · Siri**
  - **Caso 1 · M1.** mismas entradas que el caso 1 de densidad. D = 1,04281219 (sin redondear); %G = 495 ÷ 1,04281219 − 450 = 474,677995 − 450 = 24,677995 → **24,7 %**.
  - **Caso 2 · M2.** mismas entradas que el caso 2 de densidad. D = 1,02946715 (sin redondear); %G = 495 ÷ 1,02946715 − 450 = 480,831271 − 450 = 30,831271 → **30,8 %**.
  - **Caso 3 · M3.** mismas entradas que el caso 3 de densidad. D = 1,01340667 (sin redondear); %G = 495 ÷ 1,01340667 − 450 = 488,451494 − 450 = 38,451494 → **38,5 %**.

Ejemplos resueltos de la fuente (tabla 9, p. 95):
  - **Caso A · fuente, tabla 9.** mujeres, `edad` 45; Σ4 = 60 mm (por ejemplo 8,0 + 20,0 + 15,0 + 17,0); la tabla publica **33,2 %**. franja 40–49 → c = 1,1333, m = 0,0612; Σ4 = 8,0 + 20,0 + 15,0 + 17,0 = 60; log10(60) = 1,778151; D = 1,1333 − 0,0612 × 1,778151 = 1,02447714; Siri: 495 ÷ 1,02447714 − 450 = 33,173298 → **33,2 % (coincide con la tabla)**.
  - **Caso B · fuente, tabla 9.** mujeres, `edad` 35; Σ4 = 40 mm (por ejemplo 5,0 + 13,0 + 10,0 + 12,0); la tabla publica **25,5 %**. franja 30–39 → c = 1,1423, m = 0,0632; Σ4 = 5,0 + 13,0 + 10,0 + 12,0 = 40; log10(40) = 1,60206; D = 1,1423 − 0,0632 × 1,60206 = 1,04104981; Siri: 495 ÷ 1,04104981 − 450 = 25,481572 → **25,5 % (coincide con la tabla)**.

**MA-30 · Durnin y Womersley · mujeres · Brozek**
  - **Caso 1 · M1.** mismas entradas que el caso 1 de densidad. D = 1,04281219 (sin redondear); %G = 457 ÷ 1,04281219 − 414,2 = 438,238068 − 414,2 = 24,038068 → **24,0 %**.
  - **Caso 2 · M2.** mismas entradas que el caso 2 de densidad. D = 1,02946715 (sin redondear); %G = 457 ÷ 1,02946715 − 414,2 = 443,918971 − 414,2 = 29,718971 → **29,7 %**.
  - **Caso 3 · M3.** mismas entradas que el caso 3 de densidad. D = 1,01340667 (sin redondear); %G = 457 ÷ 1,01340667 − 414,2 = 450,954207 − 414,2 = 36,754207 → **36,8 %**.

## 7. Porcentaje de grasa directo desde pliegues

### MA-31 · Porcentaje de grasa · Faulkner (Yuhasz no publicada), 4 pliegues · hombres

- **Clave:** `ant/faulkner-hombres@1` · **Salida:** `porcentaje-grasa`, %, 1 decimal · **Categoría BE:** `GRASA_CORPORAL`.
- **Fuente.** Faulkner JA. Physiology of swimming and diving. En: Falls HB, ed. *Exercise Physiology.* Academic Press; 1968. La ecuación aparece en la nota b de una tabla de ese capítulo (p. 417): «percentual do peso da gordura = 5,783 + (0,153 × S4DC)», con S4DC = tríceps + subescapular + suprailíaco + umbilical. Lo documentan Pires Neto CS, Glaner MF. «Equação de Faulkner» para predizer a gordura corporal: o fim de um mito. *Rev Bras Cineantropom Desempenho Hum.* 2007;9(2):207-213, que reconstruyen su origen: una combinación de las ecuaciones de Yuhasz (tesis, 1962) y, según el propio Faulkner consultado por los autores, hecha por Yuhasz. Los mismos coeficientes en el GREC (2009, 2010) y en González-Mendoza y col. (2019).
- **Población.** La nota remite a datos no publicados de la Universidad de Michigan: 158 universitarios varones y 22 nadadores universitarios, de unos 20 años. No hay ecuación de Faulkner para mujeres (ver §13).
- **Entradas.** `pliegue-triceps`, `pliegue-subescapular`, `pliegue-supraespinal` (suprailíaco, §2), `pliegue-abdominal` (umbilical) (mm).
- **Fórmula.**
  ```
  S = triceps + subescapular + supraespinal + abdominal
  %G = 0.153 * S + 5.783
  ```
- **Casos de prueba.**
  - **Caso 1 · H1.** `pliegue-triceps` 8,0 mm; `pliegue-subescapular` 10,0 mm; `pliegue-supraespinal` 7,0 mm; `pliegue-abdominal` 14,5 mm. Σ4 = 8,0 + 10,0 + 7,0 + 14,5 = 39,5; %G = 0,153 × 39,5 + 5,783 = 6,0435 + 5,783 = 11,8265 → **11,8 %**.
  - **Caso 2 · H2.** `pliegue-triceps` 12,0 mm; `pliegue-subescapular` 16,0 mm; `pliegue-supraespinal` 14,0 mm; `pliegue-abdominal` 26,0 mm. Σ4 = 12,0 + 16,0 + 14,0 + 26,0 = 68; %G = 0,153 × 68 + 5,783 = 10,404 + 5,783 = 16,187 → **16,2 %**.
  - **Caso 3 · H3.** `pliegue-triceps` 16,0 mm; `pliegue-subescapular` 24,0 mm; `pliegue-supraespinal` 20,0 mm; `pliegue-abdominal` 34,0 mm. Σ4 = 16,0 + 24,0 + 20,0 + 34,0 = 94; %G = 0,153 × 94 + 5,783 = 14,382 + 5,783 = 20,165 → **20,2 %**.
- **Límites.** La fuente no describe los sitios. Pires Neto y Glaner la consideran una opción razonable para hombres jóvenes entrenados y sin validez demostrada en otras poblaciones.

### MA-32 y MA-33 · Porcentaje de grasa · Yuhasz modificada por Carter, 6 pliegues · hombres y mujeres

- **Claves:** `ant/yuhasz-carter-hombres@1` y `ant/yuhasz-carter-mujeres@1` · **Salida:** `porcentaje-grasa`, %, 1 decimal · **Categoría BE:** `GRASA_CORPORAL`.
- **Fuente.** Yuhasz MS. *Physical Fitness Manual.* London (Ontario): University of Western Ontario; 1974, y Carter JEL. Body composition of Montreal Olympic athletes. En: Carter JEL, ed. *Physical Structure of Olympic Athletes. Part I.* Basel: Karger; 1982. p. 107-116. **Ninguno de los dos originales estuvo accesible.** Los coeficientes se cruzaron en el GREC 2009 y 2010 («Peso graso Carter»: 0,1051 y 2,58; 0,1548 y 3,58), Rivera-Amézquita LV y col. *PLoS One.* 2025;20(7):e0326524 («Carter»: 2,585 y 3,5803), Escrivá D y col. *J Clin Med.* 2021;10(23):5713 («Yuhasz», mujeres: 3,580) y Vaquero-Cristóbal y col. (2020, que la usa como «Carter»). Constantes elegidas: 2,585 y 3,580 (E-5, §15).
- **Población.** Carter la aplicó a los atletas olímpicos de Montreal 1976; la población original de Yuhasz no se pudo verificar.
- **Entradas.** Los seis pliegues de MA-10 (mm).
- **Fórmula.**
  ```
  S = Σ6 (MA-10)
  hombres: %G = 0.1051 * S + 2.585
  mujeres: %G = 0.1548 * S + 3.580
  ```
- **Casos de prueba · hombres.**
  - **Caso 1 · H1.** `pliegue-triceps` 8,0 mm; `pliegue-subescapular` 10,0 mm; `pliegue-supraespinal` 7,0 mm; `pliegue-abdominal` 14,5 mm; `pliegue-muslo-frontal` 11,0 mm; `pliegue-pantorrilla` 6,5 mm. Σ6 = 8,0 + 10,0 + 7,0 + 14,5 + 11,0 + 6,5 = 57; %G = 0,1051 × 57 + 2,585 = 5,9907 + 2,585 = 8,5757 → **8,6 %**.
  - **Caso 2 · H2.** `pliegue-triceps` 12,0 mm; `pliegue-subescapular` 16,0 mm; `pliegue-supraespinal` 14,0 mm; `pliegue-abdominal` 26,0 mm; `pliegue-muslo-frontal` 16,0 mm; `pliegue-pantorrilla` 10,0 mm. Σ6 = 12,0 + 16,0 + 14,0 + 26,0 + 16,0 + 10,0 = 94; %G = 0,1051 × 94 + 2,585 = 9,8794 + 2,585 = 12,4644 → **12,5 %**.
  - **Caso 3 · H3.** `pliegue-triceps` 16,0 mm; `pliegue-subescapular` 24,0 mm; `pliegue-supraespinal` 20,0 mm; `pliegue-abdominal` 34,0 mm; `pliegue-muslo-frontal` 18,0 mm; `pliegue-pantorrilla` 12,0 mm. Σ6 = 16,0 + 24,0 + 20,0 + 34,0 + 18,0 + 12,0 = 124; %G = 0,1051 × 124 + 2,585 = 13,0324 + 2,585 = 15,6174 → **15,6 %**.
- **Casos de prueba · mujeres.**
  - **Caso 1 · M1.** `pliegue-triceps` 15,0 mm; `pliegue-subescapular` 10,0 mm; `pliegue-supraespinal` 10,0 mm; `pliegue-abdominal` 15,0 mm; `pliegue-muslo-frontal` 22,0 mm; `pliegue-pantorrilla` 14,0 mm. Σ6 = 15,0 + 10,0 + 10,0 + 15,0 + 22,0 + 14,0 = 86; %G = 0,1548 × 86 + 3,580 = 13,3128 + 3,580 = 16,8928 → **16,9 %**.
  - **Caso 2 · M2.** `pliegue-triceps` 19,0 mm; `pliegue-subescapular` 14,0 mm; `pliegue-supraespinal` 14,0 mm; `pliegue-abdominal` 22,0 mm; `pliegue-muslo-frontal` 27,0 mm; `pliegue-pantorrilla` 17,0 mm. Σ6 = 19,0 + 14,0 + 14,0 + 22,0 + 27,0 + 17,0 = 113; %G = 0,1548 × 113 + 3,580 = 17,4924 + 3,580 = 21,0724 → **21,1 %**.
  - **Caso 3 · M3.** `pliegue-triceps` 26,0 mm; `pliegue-subescapular` 24,0 mm; `pliegue-supraespinal` 20,0 mm; `pliegue-abdominal` 32,0 mm; `pliegue-muslo-frontal` 34,0 mm; `pliegue-pantorrilla` 22,0 mm. Σ6 = 26,0 + 24,0 + 20,0 + 32,0 + 34,0 + 22,0 = 158; %G = 0,1548 × 158 + 3,580 = 24,4584 + 3,580 = 28,0384 → **28,0 %**.
- **Límites.** Pensada para deportistas; población original sin verificar. No confundir con las ecuaciones de la tesis de Yuhasz (1962), que usan pecho, tríceps, subescapular, suprailíaco, umbilical y muslo, y son otras (§13).

## 8. Masa grasa, masa libre de grasa y sus índices (métodos derivados)

Son cinco plantillas que se instancian sobre un método de porcentaje de grasa ya elegido (la «base»). Cada instancia es un método propio, con clave `ant/<clave de la base sin @1>-<sufijo>@1`, que calcula la base sin redondear adentro y devuelve un solo número. Qué bases se instancian lo decide Dirección (D-5); acá se prueban sobre MA-19 (Jackson y Pollock 7, hombres, Siri) y MA-25 (Jackson, Pollock y Ward 3, mujeres, Siri).

- **Fuente.** Modelo de dos compartimentos (peso = masa grasa + masa libre de grasa; Durnin y Womersley 1974, introducción). Índices normalizados por la talla: VanItallie TB, Yang MU, Heymsfield SB, Funk RC, Boileau RA. Height-normalized indices of the body's fat-free mass and fat mass: potentially useful indicators of nutritional status. *Am J Clin Nutr.* 1990;52(6):953-959. doi:10.1093/ajcn/52.6.953 («FFM (kg)/height (m)², or FFMI» y «BFM (kg)/height (m)², or BFMI»; población de referencia: 124 hombres jóvenes sanos). Índice normalizado a 1,80 m: Kouri EM, Pope HG Jr, Katz DL, Oliva P. Fat-free mass index in users and nonusers of anabolic-androgenic steroids. *Clin J Sport Med.* 1995;5(4):223-228. doi:10.1097/00042752-199510000-00003 (157 deportistas varones).

| MA | Plantilla | Sufijo de la clave | Salida | Fórmula |
|---|---|---|---|---|
| MA-34 | Masa grasa | `-masa-grasa` | `masa-grasa`, kg, 1 decimal | `MG = peso * %G / 100` |
| MA-35 | Masa libre de grasa | `-masa-libre-de-grasa` | `masa-libre-de-grasa`, kg, 1 decimal | `MLG = peso - MG` |
| MA-36 | Índice de masa grasa (VanItallie) | `-indice-masa-grasa` | `indice-masa-grasa`, kg/m², 1 decimal | `IMG = MG / (talla/100)^2` |
| MA-37 | Índice de masa libre de grasa (VanItallie) | `-indice-masa-libre-de-grasa` | `indice-masa-libre-de-grasa`, kg/m², 1 decimal | `IMLG = MLG / (talla/100)^2` |
| MA-38 | Índice de masa libre de grasa normalizado (Kouri) · solo bases de hombres | `-imlg-normalizado-kouri` | `indice-masa-libre-de-grasa-normalizado`, kg/m², 1 decimal | `IMLGn = IMLG + 6.3 * (1.80 - talla/100)` |

Las entradas de cada instancia son las de la base, más `peso` y, en los índices, `talla`. Categoría BE: `MASAS` (MA-34, MA-35) e `INDICES` (MA-36 a MA-38).

**MA-34 · Masa grasa · base MA-19** (`ant/jackson-pollock-7-hombres-siri-masa-grasa@1`)
  - **Caso 1 · H1.** `peso` 72,0 kg y las entradas del caso 1 de % de grasa. %G = 9,071878 (sin redondear); MG = 72,0 × 9,071878 ÷ 100 = 6,531752 → **6,5 kg**.
  - **Caso 2 · H2.** `peso` 88,0 kg y las entradas del caso 2 de % de grasa. %G = 17,892357 (sin redondear); MG = 88,0 × 17,892357 ÷ 100 = 15,745274 → **15,7 kg**.
  - **Caso 3 · H3.** `peso` 92,0 kg y las entradas del caso 3 de % de grasa. %G = 26,376921 (sin redondear); MG = 92,0 × 26,376921 ÷ 100 = 24,266767 → **24,3 kg**.

**MA-35 · Masa libre de grasa · base MA-19** (`ant/jackson-pollock-7-hombres-siri-masa-libre-de-grasa@1`)
  - **Caso 1 · H1.** ídem. MG = 6,531752 (sin redondear); MLG = 72,0 − 6,531752 = 65,468248 → **65,5 kg**.
  - **Caso 2 · H2.** ídem. MG = 15,745274 (sin redondear); MLG = 88,0 − 15,745274 = 72,254726 → **72,3 kg**.
  - **Caso 3 · H3.** ídem. MG = 24,266767 (sin redondear); MLG = 92,0 − 24,266767 = 67,733233 → **67,7 kg**.

**MA-36 · Índice de masa grasa · base MA-19** (`ant/jackson-pollock-7-hombres-siri-indice-masa-grasa@1`)
  - **Caso 1 · H1.** ídem, más `talla` 176,0 cm. T² = 3,0976; IMG = 6,531752 ÷ 3,0976 = 2,108649 → **2,1 kg/m²**.
  - **Caso 2 · H2.** ídem, más `talla` 178,0 cm. T² = 3,1684; IMG = 15,745274 ÷ 3,1684 = 4,969472 → **5,0 kg/m²**.
  - **Caso 3 · H3.** ídem, más `talla` 172,0 cm. T² = 2,9584; IMG = 24,266767 ÷ 2,9584 = 8,202666 → **8,2 kg/m²**.

**MA-37 · Índice de masa libre de grasa · base MA-19** (`ant/jackson-pollock-7-hombres-siri-indice-masa-libre-de-grasa@1`)
  - **Caso 1 · H1.** ídem, más `talla` 176,0 cm. T² = 3,0976; IMLG = 65,468248 ÷ 3,0976 = 21,135152 → **21,1 kg/m²**.
  - **Caso 2 · H2.** ídem, más `talla` 178,0 cm. T² = 3,1684; IMLG = 72,254726 ÷ 3,1684 = 22,804799 → **22,8 kg/m²**.
  - **Caso 3 · H3.** ídem, más `talla` 172,0 cm. T² = 2,9584; IMLG = 67,733233 ÷ 2,9584 = 22,895225 → **22,9 kg/m²**.

**MA-38 · Índice de masa libre de grasa normalizado (Kouri) · base MA-19** (`ant/jackson-pollock-7-hombres-siri-imlg-normalizado-kouri@1`)
  - **Caso 1 · H1.** ídem. IMLG = 21,135152 (sin redondear); T = 1,76 m; 6,3 × (1,80 − 1,76) = 0,252; IMLG normalizado = 21,135152 + 0,252 = 21,387152 → **21,4 kg/m²**.
  - **Caso 2 · H2.** ídem. IMLG = 22,804799 (sin redondear); T = 1,78 m; 6,3 × (1,80 − 1,78) = 0,126; IMLG normalizado = 22,804799 + 0,126 = 22,930799 → **22,9 kg/m²**.
  - **Caso 3 · H3.** ídem. IMLG = 22,895225 (sin redondear); T = 1,72 m; 6,3 × (1,80 − 1,72) = 0,504; IMLG normalizado = 22,895225 + 0,504 = 23,399225 → **23,4 kg/m²**.

**MA-34 · Masa grasa · base MA-25** (`ant/jackson-pollock-ward-3-mujeres-siri-masa-grasa@1`)
  - **Caso 1 · M1.** `peso` 55,0 kg y las entradas del caso 1 de % de grasa. %G = 20,446593 (sin redondear); MG = 55,0 × 20,446593 ÷ 100 = 11,245626 → **11,2 kg**.
  - **Caso 2 · M2.** `peso` 64,0 kg y las entradas del caso 2 de % de grasa. %G = 26,30654 (sin redondear); MG = 64,0 × 26,30654 ÷ 100 = 16,836186 → **16,8 kg**.
  - **Caso 3 · M3.** `peso` 78,0 kg y las entradas del caso 3 de % de grasa. %G = 33,688603 (sin redondear); MG = 78,0 × 33,688603 ÷ 100 = 26,277111 → **26,3 kg**.

**MA-35 · Masa libre de grasa · base MA-25** (`ant/jackson-pollock-ward-3-mujeres-siri-masa-libre-de-grasa@1`)
  - **Caso 1 · M1.** ídem. MG = 11,245626 (sin redondear); MLG = 55,0 − 11,245626 = 43,754374 → **43,8 kg**.
  - **Caso 2 · M2.** ídem. MG = 16,836186 (sin redondear); MLG = 64,0 − 16,836186 = 47,163814 → **47,2 kg**.
  - **Caso 3 · M3.** ídem. MG = 26,277111 (sin redondear); MLG = 78,0 − 26,277111 = 51,722889 → **51,7 kg**.

**MA-36 · Índice de masa grasa · base MA-25** (`ant/jackson-pollock-ward-3-mujeres-siri-indice-masa-grasa@1`)
  - **Caso 1 · M1.** ídem, más `talla` 162,0 cm. T² = 2,6244; IMG = 11,245626 ÷ 2,6244 = 4,285027 → **4,3 kg/m²**.
  - **Caso 2 · M2.** ídem, más `talla` 166,0 cm. T² = 2,7556; IMG = 16,836186 ÷ 2,7556 = 6,109808 → **6,1 kg/m²**.
  - **Caso 3 · M3.** ídem, más `talla` 160,0 cm. T² = 2,56; IMG = 26,277111 ÷ 2,56 = 10,264496 → **10,3 kg/m²**.

**MA-37 · Índice de masa libre de grasa · base MA-25** (`ant/jackson-pollock-ward-3-mujeres-siri-indice-masa-libre-de-grasa@1`)
  - **Caso 1 · M1.** ídem, más `talla` 162,0 cm. T² = 2,6244; IMLG = 43,754374 ÷ 2,6244 = 16,672144 → **16,7 kg/m²**.
  - **Caso 2 · M2.** ídem, más `talla` 166,0 cm. T² = 2,7556; IMLG = 47,163814 ÷ 2,7556 = 17,115624 → **17,1 kg/m²**.
  - **Caso 3 · M3.** ídem, más `talla` 160,0 cm. T² = 2,56; IMLG = 51,722889 ÷ 2,56 = 20,204254 → **20,2 kg/m²**.

- **Límites.** Heredan todo de la base. Kouri derivó la normalización en hombres deportistas: no se instancia sobre bases de mujeres. El resumen de Kouri dice **6,3**; muchas fuentes secundarias y calculadoras usan 6,1 (E-6, §15). Los valores de corte que proponen VanItallie (percentiles) y Kouri (25) no van.

## 9. Masa muscular

### MA-39 y MA-40 · Masa muscular esquelética · Lee y col., modelo con perímetros · hombres y mujeres

- **Claves:** `ant/lee-perimetros-hombres@1` y `ant/lee-perimetros-mujeres@1` · **Salida:** `masa-muscular-esqueletica`, kg, 1 decimal · **Categoría BE:** `MASAS`.
- **Fuente.** Lee RC, Wang Z, Heo M, Ross R, Janssen I, Heymsfield SB. Total-body skeletal muscle mass: development and cross-validation of anthropometric prediction models. *Am J Clin Nutr.* 2000;72(3):796-803. doi:10.1093/ajcn/72.3.796. Ecuación del resumen (PubMed 10966902): `SM = Ht × (0,00744 × CAG² + 0,00088 × CTG² + 0,00441 × CCG²) + 2,4 × sexo − 0,048 × edad + raza + 7,8`, con talla en m, perímetros corregidos en cm, sexo = 1 hombres y 0 mujeres, raza = −2,0 asiáticos, +1,1 afroestadounidenses y 0 blancos o hispanos. La misma ecuación, con la corrección `perímetro − π × pliegue/10`, en el GREC (2009, 2010). Tiene una fe de erratas (*Am J Clin Nutr.* 2001;73(5):995) que no se pudo leer.
- **Población.** Adultos sanos no obesos (IMC < 30), n = 244, de varios grupos étnicos; referencia: resonancia magnética de cuerpo entero. R² = 0,91; error estándar 2,2 kg.
- **Entradas.** `talla` (cm → m); `edad` (años); `perimetro-brazo-relajado` y `pliegue-triceps`; `perimetro-muslo` (muslo medio, D-3) y `pliegue-muslo-frontal`; `perimetro-pantorrilla` y `pliegue-pantorrilla` (perímetros en cm, pliegues en mm → cm: ÷ 10).
- **Fórmula.**
  ```
  T   = talla / 100
  PBC = perimetro_brazo_relajado - π * pliegue_triceps / 10
  PMC = perimetro_muslo          - π * pliegue_muslo_frontal / 10
  PPC = perimetro_pantorrilla    - π * pliegue_pantorrilla / 10
  hombres: MME = T * (0.00744*PBC^2 + 0.00088*PMC^2 + 0.00441*PPC^2) + 2.4 - 0.048*edad + 0 + 7.8
  mujeres: MME = T * (0.00744*PBC^2 + 0.00088*PMC^2 + 0.00441*PPC^2) + 0   - 0.048*edad + 0 + 7.8
  ```
  El `+ 0` es el término étnico de la muestra blanca e hispana (D-2).
- **Casos de prueba · hombres.**
  - **Caso 1 · H1.** `talla` 176,0 cm; `edad` 22 años; `perimetro-brazo-relajado` 30,0 cm; `pliegue-triceps` 8,0 mm; `perimetro-muslo` 53,0 cm; `pliegue-muslo-frontal` 11,0 mm; `perimetro-pantorrilla` 37,0 cm; `pliegue-pantorrilla` 6,5 mm. PBC = 30,0 − π × 8,0/10 = 27,486726; PMC = 53,0 − π × 11,0/10 = 49,544248; PPC = 37,0 − π × 6,5/10 = 34,957965; 0,00744 × 755,520099 + 0,00088 × 2454,632518 + 0,00441 × 1222,059301 = 13,170428; 1,76 × 13,170428 = 23,179953; MME = 23,179953 + 2,4 − 0,048 × 22 + 0 + 7,8 = 32,323953 → **32,3 kg**.
  - **Caso 2 · H2.** `talla` 178,0 cm; `edad` 35 años; `perimetro-brazo-relajado` 33,0 cm; `pliegue-triceps` 12,0 mm; `perimetro-muslo` 57,0 cm; `pliegue-muslo-frontal` 16,0 mm; `perimetro-pantorrilla` 39,0 cm; `pliegue-pantorrilla` 10,0 mm. PBC = 33,0 − π × 12,0/10 = 29,230089; PMC = 57,0 − π × 16,0/10 = 51,973452; PPC = 39,0 − π × 10,0/10 = 35,858407; 0,00744 × 854,398092 + 0,00088 × 2701,239687 + 0,00441 × 1285,825377 = 14,404303; 1,78 × 14,404303 = 25,639659; MME = 25,639659 + 2,4 − 0,048 × 35 + 0 + 7,8 = 34,159659 → **34,2 kg**.
  - **Caso 3 · H3.** `talla` 172,0 cm; `edad` 55 años; `perimetro-brazo-relajado` 33,0 cm; `pliegue-triceps` 16,0 mm; `perimetro-muslo` 55,0 cm; `pliegue-muslo-frontal` 18,0 mm; `perimetro-pantorrilla` 38,0 cm; `pliegue-pantorrilla` 12,0 mm. PBC = 33,0 − π × 16,0/10 = 27,973452; PMC = 55,0 − π × 18,0/10 = 49,345133; PPC = 38,0 − π × 12,0/10 = 34,230089; 0,00744 × 782,514003 + 0,00088 × 2434,942173 + 0,00441 × 1171,69898 = 13,131846; 1,72 × 13,131846 = 22,586775; MME = 22,586775 + 2,4 − 0,048 × 55 + 0 + 7,8 = 30,146775 → **30,1 kg**.
- **Casos de prueba · mujeres.**
  - **Caso 1 · M1.** `talla` 162,0 cm; `edad` 19 años; `perimetro-brazo-relajado` 25,5 cm; `pliegue-triceps` 15,0 mm; `perimetro-muslo` 52,0 cm; `pliegue-muslo-frontal` 22,0 mm; `perimetro-pantorrilla` 34,0 cm; `pliegue-pantorrilla` 14,0 mm. PBC = 25,5 − π × 15,0/10 = 20,787611; PMC = 52,0 − π × 22,0/10 = 45,088496; PPC = 34,0 − π × 14,0/10 = 29,60177; 0,00744 × 432,124772 + 0,00088 × 2032,972486 + 0,00441 × 876,264804 = 8,868352; 1,62 × 8,868352 = 14,36673; MME = 14,36673 + 0 − 0,048 × 19 + 0 + 7,8 = 21,25473 → **21,3 kg**.
  - **Caso 2 · M2.** `talla` 166,0 cm; `edad` 34 años; `perimetro-brazo-relajado` 28,0 cm; `pliegue-triceps` 19,0 mm; `perimetro-muslo` 56,0 cm; `pliegue-muslo-frontal` 27,0 mm; `perimetro-pantorrilla` 36,0 cm; `pliegue-pantorrilla` 17,0 mm. PBC = 28,0 − π × 19,0/10 = 22,030974; PMC = 56,0 − π × 27,0/10 = 47,5177; PPC = 36,0 − π × 17,0/10 = 30,659292; 0,00744 × 485,363814 + 0,00088 × 2257,931798 + 0,00441 × 939,992216 = 9,743452; 1,66 × 9,743452 = 16,174131; MME = 16,174131 + 0 − 0,048 × 34 + 0 + 7,8 = 22,342131 → **22,3 kg**.
  - **Caso 3 · M3.** `talla` 160,0 cm; `edad` 47 años; `perimetro-brazo-relajado` 32,0 cm; `pliegue-triceps` 26,0 mm; `perimetro-muslo` 60,0 cm; `pliegue-muslo-frontal` 34,0 mm; `perimetro-pantorrilla` 38,0 cm; `pliegue-pantorrilla` 22,0 mm. PBC = 32,0 − π × 26,0/10 = 23,831859; PMC = 60,0 − π × 34,0/10 = 49,318585; PPC = 38,0 − π × 22,0/10 = 31,088496; 0,00744 × 567,957508 + 0,00088 × 2432,322824 + 0,00441 × 966,494594 = 10,628289; 1,6 × 10,628289 = 17,005263; MME = 17,005263 + 0 − 0,048 × 47 + 0 + 7,8 = 22,549263 → **22,5 kg**.
- **Límites.** Solo adultos no obesos. El perímetro del muslo tiene que ser el del muslo medio: el GREC advierte que ese punto difiere de la norma ISAK, y Berral de la Rosa y col. (2010) no pudieron aplicar la ecuación por haber medido otro nivel. El término étnico es una decisión de BE (D-2). Algunos trabajos (González-Mendoza y col. 2019) usan otra ecuación del mismo artículo, con coeficientes 0,00587, 0,00138, 0,00574 y constante 4,4, que no es la que publica el resumen (E-7, §15).

### MA-41 y MA-42 · Masa muscular esquelética · Lee y col., modelo con peso y talla · hombres y mujeres

- **Claves:** `ant/lee-peso-talla-hombres@1` y `ant/lee-peso-talla-mujeres@1` · **Salida:** `masa-muscular-esqueletica`, kg, 1 decimal · **Categoría BE:** `MASAS`.
- **Fuente.** Lee y col. (2000), resumen: `SM = 0,244 × BW + 7,80 × Ht + 6,6 × sexo − 0,098 × edad + raza − 3,3`, con BW en kg y Ht en m; raza = −1,2 asiáticos, +1,4 afroestadounidenses y 0 blancos o hispanos. R² = 0,86; error estándar 2,8 kg.
- **Población.** La de MA-39.
- **Entradas.** `peso` (kg); `talla` (cm → m); `edad` (años).
- **Fórmula.**
  ```
  T = talla / 100
  hombres: MME = 0.244*peso + 7.80*T + 6.6 - 0.098*edad + 0 - 3.3
  mujeres: MME = 0.244*peso + 7.80*T + 0   - 0.098*edad + 0 - 3.3
  ```
- **Casos de prueba · hombres.**
  - **Caso 1 · H1.** `peso` 72,0 kg; `talla` 176,0 cm; `edad` 22 años. 0,244 × 72,0 = 17,568; 7,80 × 1,76 = 13,728; 0,098 × 22 = 2,156; MME = 17,568 + 13,728 + 6,6 − 2,156 + 0 − 3,3 = 32,44 → **32,4 kg**.
  - **Caso 2 · H2.** `peso` 88,0 kg; `talla` 178,0 cm; `edad` 35 años. 0,244 × 88,0 = 21,472; 7,80 × 1,78 = 13,884; 0,098 × 35 = 3,43; MME = 21,472 + 13,884 + 6,6 − 3,43 + 0 − 3,3 = 35,226 → **35,2 kg**.
  - **Caso 3 · H3.** `peso` 92,0 kg; `talla` 172,0 cm; `edad` 55 años. 0,244 × 92,0 = 22,448; 7,80 × 1,72 = 13,416; 0,098 × 55 = 5,39; MME = 22,448 + 13,416 + 6,6 − 5,39 + 0 − 3,3 = 33,774 → **33,8 kg**.
- **Casos de prueba · mujeres.**
  - **Caso 1 · M1.** `peso` 55,0 kg; `talla` 162,0 cm; `edad` 19 años. 0,244 × 55,0 = 13,42; 7,80 × 1,62 = 12,636; 0,098 × 19 = 1,862; MME = 13,42 + 12,636 + 0 − 1,862 + 0 − 3,3 = 20,894 → **20,9 kg**.
  - **Caso 2 · M2.** `peso` 64,0 kg; `talla` 166,0 cm; `edad` 34 años. 0,244 × 64,0 = 15,616; 7,80 × 1,66 = 12,948; 0,098 × 34 = 3,332; MME = 15,616 + 12,948 + 0 − 3,332 + 0 − 3,3 = 21,932 → **21,9 kg**.
  - **Caso 3 · M3.** `peso` 78,0 kg; `talla` 160,0 cm; `edad` 47 años. 0,244 × 78,0 = 19,032; 7,80 × 1,6 = 12,48; 0,098 × 47 = 4,606; MME = 19,032 + 12,48 + 0 − 4,606 + 0 − 3,3 = 23,606 → **23,6 kg**.
- **Límites.** Los de MA-39. Rojano-Ortega y col. (*Sci Rep.* 2024;14:28646) encontraron que sobrestima en una muestra caucásica española frente a DXA.

### MA-43 · Perímetro muscular del brazo (PMB)

- **Clave:** `ant/perimetro-muscular-brazo@1` · **Salida:** `perimetro-muscular-brazo`, cm, 1 decimal · **Categoría BE:** `MASAS`.
- **Fuente.** Heymsfield SB, McManus C, Smith J, Stevens V, Nixon DW. Anthropometric measurement of muscle mass: revised equations for calculating bone-free arm muscle area. *Am J Clin Nutr.* 1982;36(4):680-690. doi:10.1093/ajcn/36.4.680. El resumen escribe el perímetro muscular como `MAC − π × TSF`, con el pliegue del tríceps en cm.
- **Población.** Es un paso geométrico (supone un brazo circular con un anillo de grasa uniforme), no una regresión.
- **Entradas.** `perimetro-brazo-relajado` (cm, «midarm circumference»); `pliegue-triceps` (mm → cm: ÷ 10).
- **Fórmula.**
  ```
  PMB = perimetro_brazo_relajado - π * pliegue_triceps / 10
  ```
- **Casos de prueba.**
  - **Caso 1 · H1.** `perimetro-brazo-relajado` 30,0 cm; `pliegue-triceps` 8,0 mm. π × 8,0 ÷ 10 = 2,513274; PMB = 30,0 − 2,513274 = 27,486726 → **27,5 cm**.
  - **Caso 2 · M2.** `perimetro-brazo-relajado` 28,0 cm; `pliegue-triceps` 19,0 mm. π × 19,0 ÷ 10 = 5,969026; PMB = 28,0 − 5,969026 = 22,030974 → **22,0 cm**.
  - **Caso 3 · H3.** `perimetro-brazo-relajado` 33,0 cm; `pliegue-triceps` 16,0 mm. π × 16,0 ÷ 10 = 5,026548; PMB = 33,0 − 5,026548 = 27,973452 → **28,0 cm**.
- **Límites.** Mismo cálculo para ambos sexos. El modelo circular sobrestima el área (lo que corrige MA-45).

### MA-44 · Área muscular del brazo, sin corregir (AMB)

- **Clave:** `ant/area-muscular-brazo@1` · **Salida:** `area-muscular-brazo`, cm², 1 decimal · **Categoría BE:** `MASAS`.
- **Fuente.** Heymsfield y col. (1982): «Arm muscle area (AMA, cm²) is currently calculated from triceps skinfold thickness (TSF, cm), and midarm circumference (MAC, cm)», es decir `(MAC − π × TSF)² / 4π`. Los autores muestran que esta forma sobrestima el área un 20 a 25 % frente a la tomografía.
- **Entradas.** Las de MA-43.
- **Fórmula.**
  ```
  AMB = PMB^2 / (4 * π)
  ```
- **Casos de prueba.**
  - **Caso 1 · H1.** `perimetro-brazo-relajado` 30,0 cm; `pliegue-triceps` 8,0 mm. PMB = 27,486726 (sin redondear); PMB² = 755,520099; 4π = 12,566371; AMB = 755,520099 ÷ 12,566371 = 60,122379 → **60,1 cm²**.
  - **Caso 2 · M2.** `perimetro-brazo-relajado` 28,0 cm; `pliegue-triceps` 19,0 mm. PMB = 22,030974 (sin redondear); PMB² = 485,363814; 4π = 12,566371; AMB = 485,363814 ÷ 12,566371 = 38,624025 → **38,6 cm²**.
  - **Caso 3 · H3.** `perimetro-brazo-relajado` 33,0 cm; `pliegue-triceps` 16,0 mm. PMB = 27,973452 (sin redondear); PMB² = 782,514003; 4π = 12,566371; AMB = 782,514003 ÷ 12,566371 = 62,270486 → **62,3 cm²**.
- **Límites.** Sobrestima el área (por el supuesto circular y porque incluye el hueso). Se ofrece por ser la forma clásica; la corregida es MA-45 y MA-46.

### MA-45 y MA-46 · Área muscular del brazo corregida (Heymsfield) · hombres y mujeres

- **Claves:** `ant/heymsfield-area-muscular-brazo-hombres@1` y `ant/heymsfield-area-muscular-brazo-mujeres@1` · **Salida:** `area-muscular-brazo-corregida`, cm², 1 decimal · **Categoría BE:** `MASAS`.
- **Fuente.** Heymsfield y col. (1982), resumen: «Corrected AMA equations for men and women were respectively: [(MAC − π × TSF)²/4π] − 10, and [(MAC − π × TSF)²/4π] − 6.5». La resta descuenta el área ósea.
- **Población.** Adultos; el área se validó contra tomografía computada en grupos de estudio del artículo. El error promedio para un paciente fue de 7 a 8 %.
- **Entradas.** Las de MA-43.
- **Fórmula.**
  ```
  hombres: AMBc = PMB^2 / (4 * π) - 10
  mujeres: AMBc = PMB^2 / (4 * π) - 6.5
  ```
- **Casos de prueba · hombres.**
  - **Caso 1 · H1.** `perimetro-brazo-relajado` 30,0 cm; `pliegue-triceps` 8,0 mm. PMB = 27,486726; AMB = 755,520099 ÷ 12,566371 = 60,122379; AMBc = 60,122379 − 10 = 50,122379 → **50,1 cm²**.
  - **Caso 2 · H2.** `perimetro-brazo-relajado` 33,0 cm; `pliegue-triceps` 12,0 mm. PMB = 29,230089; AMB = 854,398092 ÷ 12,566371 = 67,99084; AMBc = 67,99084 − 10 = 57,99084 → **58,0 cm²**.
  - **Caso 3 · H3.** `perimetro-brazo-relajado` 33,0 cm; `pliegue-triceps` 16,0 mm. PMB = 27,973452; AMB = 782,514003 ÷ 12,566371 = 62,270486; AMBc = 62,270486 − 10 = 52,270486 → **52,3 cm²**.
- **Casos de prueba · mujeres.**
  - **Caso 1 · M1.** `perimetro-brazo-relajado` 25,5 cm; `pliegue-triceps` 15,0 mm. PMB = 20,787611; AMB = 432,124772 ÷ 12,566371 = 34,387397; AMBc = 34,387397 − 6,5 = 27,887397 → **27,9 cm²**.
  - **Caso 2 · M2.** `perimetro-brazo-relajado` 28,0 cm; `pliegue-triceps` 19,0 mm. PMB = 22,030974; AMB = 485,363814 ÷ 12,566371 = 38,624025; AMBc = 38,624025 − 6,5 = 32,124025 → **32,1 cm²**.
  - **Caso 3 · M3.** `perimetro-brazo-relajado` 32,0 cm; `pliegue-triceps` 26,0 mm. PMB = 23,831859; AMB = 567,957508 ÷ 12,566371 = 45,196622; AMBc = 45,196622 − 6,5 = 38,696622 → **38,7 cm²**.
- **Límites.** El resumen menciona un rango mínimo compatible con la supervivencia; es un umbral clínico y no va (regla 7).

### MA-47 y MA-48 · Masa muscular total (Heymsfield) · hombres y mujeres

- **Claves:** `ant/heymsfield-masa-muscular-hombres@1` y `ant/heymsfield-masa-muscular-mujeres@1` · **Salida:** `masa-muscular-esqueletica`, kg, 1 decimal · **Categoría BE:** `MASAS`.
- **Fuente.** Heymsfield y col. (1982), resumen de PubMed: «muscle mass (kg) = (ht, cm2) (0.0264 + 0.0029 × corrected AMA)». Con la talla al cuadrado el resultado daría miles de kilos; con la talla en cm da valores de músculo esperables, y así la usan González-Mendoza y col. (2019), que además indican que el método de referencia de Heymsfield fue la creatinina urinaria (E-8, §15).
- **Población.** La del artículo de 1982 (adultos, incluidos pacientes; pensado para la evaluación nutricional al pie de la cama).
- **Entradas.** `talla` (cm); `perimetro-brazo-relajado`; `pliegue-triceps`.
- **Fórmula.**
  ```
  hombres: MM = talla * (0.0264 + 0.0029 * AMBc_hombres)
  mujeres: MM = talla * (0.0264 + 0.0029 * AMBc_mujeres)
  ```
- **Casos de prueba · hombres.**
  - **Caso 1 · H1.** `talla` 176,0 cm; `perimetro-brazo-relajado` 30,0 cm; `pliegue-triceps` 8,0 mm. AMBc = 50,122379 (sin redondear); 0,0029 × 50,122379 = 0,145355; 0,0264 + 0,145355 = 0,171755; MM = 176,0 × 0,171755 = 30,228862 → **30,2 kg**.
  - **Caso 2 · H2.** `talla` 178,0 cm; `perimetro-brazo-relajado` 33,0 cm; `pliegue-triceps` 12,0 mm. AMBc = 57,99084 (sin redondear); 0,0029 × 57,99084 = 0,168173; 0,0264 + 0,168173 = 0,194573; MM = 178,0 × 0,194573 = 34,634072 → **34,6 kg**.
  - **Caso 3 · H3.** `talla` 172,0 cm; `perimetro-brazo-relajado` 33,0 cm; `pliegue-triceps` 16,0 mm. AMBc = 52,270486 (sin redondear); 0,0029 × 52,270486 = 0,151584; 0,0264 + 0,151584 = 0,177984; MM = 172,0 × 0,177984 = 30,613318 → **30,6 kg**.
- **Casos de prueba · mujeres.**
  - **Caso 1 · M1.** `talla` 162,0 cm; `perimetro-brazo-relajado` 25,5 cm; `pliegue-triceps` 15,0 mm. AMBc = 27,887397 (sin redondear); 0,0029 × 27,887397 = 0,080873; 0,0264 + 0,080873 = 0,107273; MM = 162,0 × 0,107273 = 17,378299 → **17,4 kg**.
  - **Caso 2 · M2.** `talla` 166,0 cm; `perimetro-brazo-relajado` 28,0 cm; `pliegue-triceps` 19,0 mm. AMBc = 32,124025 (sin redondear); 0,0029 × 32,124025 = 0,09316; 0,0264 + 0,09316 = 0,11956; MM = 166,0 × 0,11956 = 19,846906 → **19,8 kg**.
  - **Caso 3 · M3.** `talla` 160,0 cm; `perimetro-brazo-relajado` 32,0 cm; `pliegue-triceps` 26,0 mm. AMBc = 38,696622 (sin redondear); 0,0029 × 38,696622 = 0,11222; 0,0264 + 0,11222 = 0,13862; MM = 160,0 × 0,13862 = 22,179233 → **22,2 kg**.
- **Límites.** Estima el músculo de todo el cuerpo a partir de un solo segmento. Berral de la Rosa y col. (2010) la encontraron por debajo de las otras ecuaciones en jugadores de bádminton.

### MA-49 · Masa muscular esquelética · Martin y col. · hombres

- **Clave:** `ant/martin-masa-muscular-hombres@1` · **Salida:** `masa-muscular-esqueletica`, kg, 1 decimal · **Categoría BE:** `MASAS`.
- **Fuente.** Martin AD, Spenst LF, Drinkwater DT, Clarys JP. Anthropometric estimation of muscle mass in men. *Med Sci Sports Exerc.* 1990;22(5):729-733. doi:10.1249/00005768-199010000-00027. Resumen: `MM = STAT (0,0553 CTG² + 0,0987 FG² + 0,0331 CCG²) − 2445`, con STAT en cm, CTG el muslo corregido por el pliegue del muslo frontal, FG el antebrazo sin corregir y CCG la pantorrilla corregida por el pliegue medial, todos en cm. El resultado está en gramos (error estándar 1,53 kg); González-Mendoza y col. (2019) lo divide por 1000.
- **Población.** 12 cadáveres masculinos de 50 a 94 años (estudio de Bruselas); r² = 0,97.
- **Entradas.** `talla` (cm); `perimetro-muslo` (muslo medio, D-3) y `pliegue-muslo-frontal`; `perimetro-antebrazo`; `perimetro-pantorrilla` y `pliegue-pantorrilla`.
- **Fórmula.**
  ```
  PMC = perimetro_muslo       - π * pliegue_muslo_frontal / 10
  PPC = perimetro_pantorrilla - π * pliegue_pantorrilla / 10
  MM  = (talla * (0.0553*PMC^2 + 0.0987*perimetro_antebrazo^2 + 0.0331*PPC^2) - 2445) / 1000
  ```
- **Casos de prueba.**
  - **Caso 1 · H1.** `talla` 176,0 cm; `perimetro-muslo` 53,0 cm; `pliegue-muslo-frontal` 11,0 mm; `perimetro-antebrazo` 27,0 cm; `perimetro-pantorrilla` 37,0 cm; `pliegue-pantorrilla` 6,5 mm. PMC = 53,0 − π × 11,0/10 = 49,544248; PPC = 37,0 − π × 6,5/10 = 34,957965; 0,0553 × 2454,632518 + 0,0987 × 729 + 0,0331 × 1222,059301 = 248,143641; 176,0 × 248,143641 − 2445 = 41228,280836 g; ÷ 1000 = 41,228281 → **41,2 kg**.
  - **Caso 2 · H2.** `talla` 178,0 cm; `perimetro-muslo` 57,0 cm; `pliegue-muslo-frontal` 16,0 mm; `perimetro-antebrazo` 29,0 cm; `perimetro-pantorrilla` 39,0 cm; `pliegue-pantorrilla` 10,0 mm. PMC = 57,0 − π × 16,0/10 = 51,973452; PPC = 39,0 − π × 10,0/10 = 35,858407; 0,0553 × 2701,239687 + 0,0987 × 841 + 0,0331 × 1285,825377 = 274,946075; 178,0 × 274,946075 − 2445 = 46495,401296 g; ÷ 1000 = 46,495401 → **46,5 kg**.
  - **Caso 3 · H3.** `talla` 172,0 cm; `perimetro-muslo` 55,0 cm; `pliegue-muslo-frontal` 18,0 mm; `perimetro-antebrazo` 28,0 cm; `perimetro-pantorrilla` 38,0 cm; `pliegue-pantorrilla` 12,0 mm. PMC = 55,0 − π × 18,0/10 = 49,345133; PPC = 38,0 − π × 12,0/10 = 34,230089; 0,0553 × 2434,942173 + 0,0987 × 784 + 0,0331 × 1171,69898 = 250,816338; 172,0 × 250,816338 − 2445 = 40695,410206 g; ÷ 1000 = 40,69541 → **40,7 kg**.
- **Límites.** Muestra mínima y de edad avanzada; solo hombres. Sobrestimó frente a DXA en futbolistas profesionales (González-Mendoza y col. 2019) y frente a otras ecuaciones en jugadores de bádminton (Berral de la Rosa y col. 2010).

## 10. Masa ósea, masa residual y fraccionamiento en cuatro componentes

### MA-50 · Masa ósea · Von Döbeln modificada por Rocha

- **Clave:** `ant/rocha-masa-osea@1` · **Salida:** `masa-osea`, kg, 1 decimal · **Categoría BE:** `MASAS`.
- **Fuente.** Rocha MSL. *Peso ósseo do brasileiro de ambos os sexos de 17 a 25 anos.* Rio de Janeiro; 1975 (no accesible; así la cita el GREC). Fórmula y unidades del GREC (Alvero-Cruz y col. 2009 y 2010): `Masa ósea (kg) = 3,02 × [Talla² × DM × DF × 400]^0,712`, con talla, diámetro de la muñeca y diámetro del fémur en metros. La misma en González-Mendoza y col. (2019, a partir de diámetros en cm divididos por 100) y en Gris (2001).
- **Población.** 2545 jóvenes brasileños (1517 mujeres y 1028 hombres) de 17 a 25 años, con los diámetros de un solo lado, a diferencia de Von Döbeln, que midió los dos (GREC 2009). Misma ecuación para ambos sexos.
- **Entradas.** `talla` (cm → m); `diametro-biestiloideo` (cm → m); `diametro-femur` (cm → m).
- **Fórmula.**
  ```
  T = talla / 100
  R = diametro_biestiloideo / 100
  F = diametro_femur / 100
  MO = 3.02 * (T^2 * R * F * 400)^0.712
  ```
- **Casos de prueba.**
  - **Caso 1 · H1.** `talla` 176,0 cm; `diametro-biestiloideo` 5,7 cm; `diametro-femur` 9,6 cm. T = 1,76 m; biestiloideo = 0,057 m; fémur = 0,096 m; T² × R × F × 400 = 3,0976 × 0,057 × 0,096 × 400 = 6,78002688; (6,78002688)^0,712 = 3,90694; MO = 3,02 × 3,90694 = 11,79896 → **11,8 kg**.
  - **Caso 2 · M2.** `talla` 166,0 cm; `diametro-biestiloideo` 5,0 cm; `diametro-femur` 8,9 cm. T = 1,66 m; biestiloideo = 0,05 m; fémur = 0,089 m; T² × R × F × 400 = 2,7556 × 0,05 × 0,089 × 400 = 4,904968; (4,904968)^0,712 = 3,102651; MO = 3,02 × 3,102651 = 9,370007 → **9,4 kg**.
  - **Caso 3 · H3.** `talla` 172,0 cm; `diametro-biestiloideo` 6,0 cm; `diametro-femur` 10,0 cm. T = 1,72 m; biestiloideo = 0,06 m; fémur = 0,1 m; T² × R × F × 400 = 2,9584 × 0,06 × 0,1 × 400 = 7,10016; (7,10016)^0,712 = 4,037411; MO = 3,02 × 4,037411 = 12,19298 → **12,2 kg**.
- **Límites.** Validada en adultos jóvenes; el GREC la usa también fuera de ese rango por ser la más difundida.

### MA-51 y MA-52 · Masa residual · Würch · hombres y mujeres

- **Claves:** `ant/wurch-masa-residual-hombres@1` y `ant/wurch-masa-residual-mujeres@1` · **Salida:** `masa-residual`, kg, 1 decimal · **Categoría BE:** `MASAS`.
- **Fuente.** Würch A. La femme et le sport. *Médecine Sportive Française.* 1974 (no accesible). Constantes en Gris GM. Componentes del somatotipo y ecuaciones antropométricas. *Apunts Med Esport.* 2001;36(137):5-16. doi:10.1016/S1886-6581(01)76000-8: «masa residual en hombres (kg) = peso × 24,1/100; en mujeres = peso × 20,9/100». La de hombres también en González-Mendoza y col. (2019) y Rivera-Amézquita y col. (2025).
- **Población.** Proporción fija del peso (órganos, vísceras y líquidos); las fuentes accesibles no describen la muestra original.
- **Entradas.** `peso` (kg).
- **Fórmula.**
  ```
  hombres: MR = peso * 0.241
  mujeres: MR = peso * 0.209
  ```
- **Casos de prueba · hombres.**
  - **Caso 1 · H1.** `peso` 72,0 kg. MR = 72,0 × 0,241 = 17,352 → **17,4 kg**.
  - **Caso 2 · H2.** `peso` 88,0 kg. MR = 88,0 × 0,241 = 21,208 → **21,2 kg**.
  - **Caso 3 · H3.** `peso` 92,0 kg. MR = 92,0 × 0,241 = 22,172 → **22,2 kg**.
- **Casos de prueba · mujeres.**
  - **Caso 1 · M1.** `peso` 55,0 kg. MR = 55,0 × 0,209 = 11,495 → **11,5 kg**.
  - **Caso 2 · M2.** `peso` 64,0 kg. MR = 64,0 × 0,209 = 13,376 → **13,4 kg**.
  - **Caso 3 · M3.** `peso` 78,0 kg. MR = 78,0 × 0,209 = 16,302 → **16,3 kg**.
- **Límites.** Es una constante, no una medición: no cambia con la composición. La de mujeres tiene un solo respaldo secundario revisado por pares (Gris 2001).

### MA-53 · Masa muscular por diferencia · De Rose y Guimarães (cuatro componentes) · hombres

- **Clave:** `ant/de-rose-guimaraes-masa-muscular-hombres@1` · **Salida:** `masa-muscular`, kg, 1 decimal · **Categoría BE:** `MASAS`.
- **Fuente.** De Rose EH, Guimarães ACA. A model for optimization of somatotype in young athletes. En: Ostyn M, Beunen G, Simons J, eds. *Kinanthropometry II.* Baltimore: University Park Press; 1980. p. 77-80 (no accesible). La composición del modelo está en González-Mendoza y col. (2019, tabla 1, «equations listed as reported by De Rose (1980)»): `SMM = BW − (FM + BM + RM)`, con `FM = 0,01 × BW × [(subescapular + tríceps + supraespinal + abdominal) × 0,153 + 5,783]` (Faulkner), `BM` por Rocha y `RM = BW × 0,241` (Würch). Silva, Trindade y De Rose (*Rev Bras Med Esporte.* 2003;9(6):408-412) describen la misma estrategia: grasa por Faulkner, hueso por Von Döbeln modificada por Rocha, residuo por Würch y músculo por diferencia.
- **Población.** No tiene muestra de validación propia: hereda la de cada parte. Como la grasa sale de Faulkner (MA-31, solo hombres), el método se propone solo para hombres (D-11).
- **Entradas.** `peso` (kg); `talla` (cm); los cuatro pliegues de MA-31 (mm); `diametro-biestiloideo` y `diametro-femur` (cm).
- **Fórmula.**
  ```
  MG = peso * (0.153 * (triceps + subescapular + supraespinal + abdominal) + 5.783) / 100
  MO = Rocha (MA-50)
  MR = peso * 0.241
  MM = peso - (MG + MO + MR)
  ```
- **Casos de prueba.**
  - **Caso 1 · H1.** `peso` 72,0 kg; `talla` 176,0 cm; `pliegue-triceps` 8,0 mm; `pliegue-subescapular` 10,0 mm; `pliegue-supraespinal` 7,0 mm; `pliegue-abdominal` 14,5 mm; `diametro-biestiloideo` 5,7 cm; `diametro-femur` 9,6 cm. Faulkner: %G = 0,153 × 39,5 + 5,783 = 11,8265; MG = 72,0 × 11,8265 ÷ 100 = 8,51508; MO (Rocha) = 11,79896; MR = 72,0 × 0,241 = 17,352; MM = 72,0 − 8,51508 − 11,79896 − 17,352 = 34,33396 → **34,3 kg**.
  - **Caso 2 · H2.** `peso` 88,0 kg; `talla` 178,0 cm; `pliegue-triceps` 12,0 mm; `pliegue-subescapular` 16,0 mm; `pliegue-supraespinal` 14,0 mm; `pliegue-abdominal` 26,0 mm; `diametro-biestiloideo` 5,9 cm; `diametro-femur` 9,9 cm. Faulkner: %G = 0,153 × 68 + 5,783 = 16,187; MG = 88,0 × 16,187 ÷ 100 = 14,24456; MO (Rocha) = 12,560607; MR = 88,0 × 0,241 = 21,208; MM = 88,0 − 14,24456 − 12,560607 − 21,208 = 39,986833 → **40,0 kg**.
  - **Caso 3 · H3.** `peso` 92,0 kg; `talla` 172,0 cm; `pliegue-triceps` 16,0 mm; `pliegue-subescapular` 24,0 mm; `pliegue-supraespinal` 20,0 mm; `pliegue-abdominal` 34,0 mm; `diametro-biestiloideo` 6,0 cm; `diametro-femur` 10,0 cm. Faulkner: %G = 0,153 × 94 + 5,783 = 20,165; MG = 92,0 × 20,165 ÷ 100 = 18,5518; MO (Rocha) = 12,19298; MR = 92,0 × 0,241 = 22,172; MM = 92,0 − 18,5518 − 12,19298 − 22,172 = 39,08322 → **39,1 kg**.
- **Límites.** El músculo es «lo que queda»: arrastra los errores de las otras tres partes. Rivera-Amézquita y col. (2025) lo encontraron por debajo del DXA en masa magra, en otra población.

## 11. Somatotipo antropométrico de Heath-Carter

Tres métodos, uno por componente. **Fuente común:** Carter JEL. *The Heath-Carter Anthropometric Somatotype — Instruction Manual.* San Diego State University; 2002 (revisión 2003), archivado en http://web.archive.org/web/20180128063742/http://www.somatotype.org:80/Heath-CarterManual.pdf, que resume a Carter JEL, Heath BH. *Somatotyping: Development and Applications.* Cambridge University Press; 1990. Leído en el original: las tres ecuaciones están en la parte 1, «B. Equations for a decimal anthropometric somatotype». **Población:** el manual lo declara aplicable a ambos sexos, de la infancia a la vejez. **Reglas del manual que valen para los tres:** si un componente da cero o negativo, se asigna 0,1 («by definition ratings cannot be zero or negative»); se redondea a 0,1. **Categoría BE:** `SOMATOTIPO`. **Ejemplo resuelto de la fuente:** el sujeto 573 de la figura 1 (velocista, varón), con resultado publicado 1,6 - 5,4 - 3,2. Sus datos se leyeron en la planilla escaneada, de baja resolución, y se verificaron contra los tres componentes publicados y su índice ponderal (43,4): talla 178,3 cm; peso 69,2 kg; tríceps 6,4; subescapular 7,1; supraespinal 4,6; pantorrilla 5,2 mm; húmero 7,20; fémur 9,75; brazo flexionado 33,9; pantorrilla 37,6 cm. El sujeto B-188 de la figura 2 no se usa: con esa resolución no se pueden leer todos sus datos sin dudas.

### MA-54 · Endomorfia (corregida por la talla)

- **Clave:** `ant/heath-carter-endomorfia@1` · **Salida:** `endomorfia`, adimensional, 1 decimal.
- **Fórmula del manual.** «endomorphy = − 0.7182 + 0.1451 (X) − 0.00068 (X²) + 0.0000014 (X³) where X = (sum of triceps, subscapular and supraspinale skinfolds) multiplied by (170.18/height in cm). This is called height-corrected endomorphy and is the preferred method».
- **Entradas.** `pliegue-triceps`, `pliegue-subescapular`, `pliegue-supraespinal` (mm); `talla` (cm).
- **Fórmula.**
  ```
  X = (triceps + subescapular + supraespinal) * 170.18 / talla
  endo = -0.7182 + 0.1451*X - 0.00068*X^2 + 0.0000014*X^3
  si endo <= 0: endo = 0.1
  ```
- **Casos de prueba.**
  - **Caso 1 · H1.** `pliegue-triceps` 8,0 mm; `pliegue-subescapular` 10,0 mm; `pliegue-supraespinal` 7,0 mm; `talla` 176,0 cm. Σ3 = 25; X = 25 × 170,18 ÷ 176,0 = 24,173295; −0,7182 + 0,1451 × 24,173295 − 0,00068 × 584,348213 + 0,0000014 × 14125,622004 = 2,411764 → **2,4**.
  - **Caso 2 · M2.** `pliegue-triceps` 19,0 mm; `pliegue-subescapular` 14,0 mm; `pliegue-supraespinal` 14,0 mm; `talla` 166,0 cm. Σ3 = 47; X = 47 × 170,18 ÷ 166,0 = 48,183494; −0,7182 + 0,1451 × 48,183494 − 0,00068 × 2321,649092 + 0,0000014 × 111865,165025 = 4,851115 → **4,9**.
  - **Caso 3 · H3.** `pliegue-triceps` 16,0 mm; `pliegue-subescapular` 24,0 mm; `pliegue-supraespinal` 20,0 mm; `talla` 172,0 cm. Σ3 = 60; X = 60 × 170,18 ÷ 172,0 = 59,365116; −0,7182 + 0,1451 × 59,365116 − 0,00068 × 3524,217031 + 0,0000014 × 209215,553828 = 5,792113 → **5,8**.
  - **Caso 4 · límite inferior.** `pliegue-triceps` 2,0 mm; `pliegue-subescapular` 2,0 mm; `pliegue-supraespinal` 1,0 mm; `talla` 170,0 cm. Σ3 = 5; X = 5 × 170,18 ÷ 170,0 = 5,005294; −0,7182 + 0,1451 × 5,005294 − 0,00068 × 25,052969 + 0,0000014 × 125,397479 = −0,008792; ≤ 0 → 0,1 → **0,1**.
  - **Caso F · fuente, sujeto 573 del manual.** `pliegue-triceps` 6,4 mm; `pliegue-subescapular` 7,1 mm; `pliegue-supraespinal` 4,6 mm; `talla` 178,3 cm. Σ3 = 18,1; X = 18,1 × 170,18 ÷ 178,3 = 17,275704; −0,7182 + 0,1451 × 17,275704 − 0,00068 × 298,449944 + 0,0000014 × 5155,932856 = 1,592777 → **1,6**. El manual publica 1,6.
- **Límites.** El pliegue es el **supraespinal**, no la cresta ilíaca: con la cresta ilíaca la endomorfia sale entre 0,46 (hombres) y 0,63 (mujeres) puntos más alta (Pastuszak y col. 2019).

### MA-55 · Mesomorfia

- **Clave:** `ant/heath-carter-mesomorfia@1` · **Salida:** `mesomorfia`, adimensional, 1 decimal.
- **Fórmula del manual.** «mesomorphy = 0.858 × humerus breadth + 0.601 × femur breadth + 0.188 × corrected arm girth + 0.161 × corrected calf girth − height 0.131 + 4.5»; los perímetros se corrigen restando el pliegue en cm (tríceps del brazo flexionado; pantorrilla medial de la pantorrilla), **sin π**.
- **Entradas.** `diametro-humero`, `diametro-femur`, `perimetro-brazo-flexionado`, `perimetro-pantorrilla` (cm); `pliegue-triceps`, `pliegue-pantorrilla` (mm → cm: ÷ 10); `talla` (cm).
- **Fórmula.**
  ```
  brazo = perimetro_brazo_flexionado - pliegue_triceps / 10
  pant  = perimetro_pantorrilla - pliegue_pantorrilla / 10
  meso = 0.858*diametro_humero + 0.601*diametro_femur + 0.188*brazo + 0.161*pant - 0.131*talla + 4.5
  si meso <= 0: meso = 0.1
  ```
- **Casos de prueba.**
  - **Caso 1 · H1.** `diametro-humero` 7,0 cm; `diametro-femur` 9,6 cm; `perimetro-brazo-flexionado` 33,5 cm; `pliegue-triceps` 8,0 mm; `perimetro-pantorrilla` 37,0 cm; `pliegue-pantorrilla` 6,5 mm; `talla` 176,0 cm. brazo corregido = 33,5 − 8,0/10 = 32,7; pantorrilla corregida = 37,0 − 6,5/10 = 36,35; meso = 0,858 × 7,00 + 0,601 × 9,60 + 0,188 × 32,7 + 0,161 × 36,35 − 0,131 × 176,0 + 4,5 = 6,006 + 5,7696 + 6,1476 + 5,85235 − 23,056 + 4,5 = 5,21955 → **5,2**.
  - **Caso 2 · M2.** `diametro-humero` 6,1 cm; `diametro-femur` 8,9 cm; `perimetro-brazo-flexionado` 29,0 cm; `pliegue-triceps` 19,0 mm; `perimetro-pantorrilla` 36,0 cm; `pliegue-pantorrilla` 17,0 mm; `talla` 166,0 cm. brazo corregido = 29,0 − 19,0/10 = 27,1; pantorrilla corregida = 36,0 − 17,0/10 = 34,3; meso = 0,858 × 6,10 + 0,601 × 8,90 + 0,188 × 27,1 + 0,161 × 34,3 − 0,131 × 166,0 + 4,5 = 5,2338 + 5,3489 + 5,0948 + 5,5223 − 21,746 + 4,5 = 3,9538 → **4,0**.
  - **Caso 3 · H3.** `diametro-humero` 7,3 cm; `diametro-femur` 10,0 cm; `perimetro-brazo-flexionado` 34,5 cm; `pliegue-triceps` 16,0 mm; `perimetro-pantorrilla` 38,0 cm; `pliegue-pantorrilla` 12,0 mm; `talla` 172,0 cm. brazo corregido = 34,5 − 16,0/10 = 32,9; pantorrilla corregida = 38,0 − 12,0/10 = 36,8; meso = 0,858 × 7,30 + 0,601 × 10,00 + 0,188 × 32,9 + 0,161 × 36,8 − 0,131 × 172,0 + 4,5 = 6,2634 + 6,01 + 6,1852 + 5,9248 − 22,532 + 4,5 = 6,3514 → **6,4**.
  - **Caso F · fuente, sujeto 573 del manual.** `diametro-humero` 7,2 cm; `diametro-femur` 9,75 cm; `perimetro-brazo-flexionado` 33,9 cm; `pliegue-triceps` 6,4 mm; `perimetro-pantorrilla` 37,6 cm; `pliegue-pantorrilla` 5,2 mm; `talla` 178,3 cm. brazo corregido = 33,9 − 6,4/10 = 33,26; pantorrilla corregida = 37,6 − 5,2/10 = 37,08; meso = 0,858 × 7,20 + 0,601 × 9,75 + 0,188 × 33,26 + 0,161 × 37,08 − 0,131 × 178,3 + 4,5 = 6,1776 + 5,85975 + 6,25288 + 5,96988 − 23,3573 + 4,5 = 5,40281 → **5,4**. El manual publica 5,4.
- **Límites.** El manual usa, cuando puede, el mayor de los lados derecho e izquierdo para diámetros y perímetros; en relevamientos grandes recomienda todo del lado derecho. Los perímetros tienen que medirse en la posición del manual (§2).

### MA-56 · Ectomorfia

- **Clave:** `ant/heath-carter-ectomorfia@1` · **Salida:** `ectomorfia`, adimensional, 1 decimal.
- **Fórmula del manual.** HWR (índice ponderal) = talla / ∛peso. «If HWR is greater than or equal to 40.75 then ectomorphy = 0.732 HWR − 28.58; If HWR is less than 40.75 but greater than 38.25 then ectomorphy = 0.463 HWR − 17.63; If HWR is equal to or less than 38.25 then ectomorphy = 0.1».
- **Entradas.** `talla` (cm); `peso` (kg).
- **Fórmula.**
  ```
  IP = talla / cbrt(peso)
  si IP >= 40.75:        ecto = 0.732*IP - 28.58
  si 38.25 < IP < 40.75: ecto = 0.463*IP - 17.63
  si IP <= 38.25:        ecto = 0.1
  ```
- **Casos de prueba.** Uno por tramo, más el ejemplo de la fuente.
  - **Caso 1 · H1.** `talla` 176,0 cm; `peso` 72,0 kg. ∛72,0 = 4,160168; IP = 176,0 ÷ 4,160168 = 42,305987; IP ≥ 40,75: ecto = 0,732 × 42,305987 − 28,58 = 2,387983 → **2,4**.
  - **Caso 2 · H2.** `talla` 178,0 cm; `peso` 88,0 kg. ∛88,0 = 4,44796; IP = 178,0 ÷ 4,44796 = 40,018344; 38,25 < IP < 40,75: ecto = 0,463 × 40,018344 − 17,63 = 0,898493 → **0,9**.
  - **Caso 3 · M3.** `talla` 160,0 cm; `peso` 78,0 kg. ∛78,0 = 4,272659; IP = 160,0 ÷ 4,272659 = 37,44741; IP ≤ 38,25: ecto = 0,1 → **0,1**.
  - **Caso F · fuente, sujeto 573 del manual.** `talla` 178,3 cm; `peso` 69,2 kg. ∛69,2 = 4,105525; IP = 178,3 ÷ 4,105525 = 43,429282; IP ≥ 40,75: ecto = 0,732 × 43,429282 − 28,58 = 3,210234 → **3,2**. El manual publica 3,2 (IP 43,4).
- **Límites.** Las ramas no empalman exactamente en 40,75 (1,249 por arriba y 1,237 por abajo): es así en la fuente. El manual sugiere revisar los datos cuando un componente da menos de 1, aunque en ectomorfia no es raro.

## 12. Kerr (1988): cinco componentes

**Fuente.** Kerr DA. *An anthropometric method for fractionation of skin, adipose, bone, muscle and residual tissue masses, in males and females age 6 to 77 years* [tesis de maestría, Kinesiología]. Burnaby (BC): Simon Fraser University; 1988. https://summit.sfu.ca/item/5139 (PDF escaneado con texto reconocido; ecuaciones leídas en la tabla 4.3).

**Población.** El método se armó sobre un humano de referencia unisex (el «Phantom») y se probó en 1669 personas vivas de 11 muestras, de 6 a 77 años; el peso predicho (suma de las cinco masas) tuvo un error estándar de 3,00 kg y quedó dentro del 4 % del peso real en todas las muestras salvo fisicoculturistas (8 %). La coherencia anatómica se controló con la disección de 25 cadáveres (12 hombres y 13 mujeres).

**Qué pide cada componente y si BE lo tiene.**

| Componente | Mediciones que pide la tesis | ¿Las tiene BE? |
|---|---|---|
| Piel | Superficie corporal (peso y talla, con constantes propias por sexo y edad), espesor de piel por sexo (2,07 hombres; 1,96 mujeres) y densidad de la piel (1,05) | Sí en las mediciones; la fórmula de superficie está como imagen y no se pudo leer entera: **no se documenta** |
| Tejido adiposo | Talla y seis pliegues: tríceps, subescapular, supraespinal, abdominal, muslo frontal, pantorrilla medial | **Sí → MA-57** |
| Músculo | Talla; brazo relajado corregido por tríceps; antebrazo sin corregir; pecho corregido por subescapular; muslo corregido por muslo frontal; pantorrilla corregida por pantorrilla medial | Sí, con reserva sobre los sitios del muslo y del pecho (D-3) → **MA-58** |
| Hueso | Perímetro de la cabeza; diámetros biacromial, biiliocrestal, húmero y fémur; talla | **No:** faltan perímetro de la cabeza, biacromial y biiliocrestal |
| Residual | Diámetro anteroposterior del tórax, diámetro transverso del tórax, cintura corregida por el pliegue abdominal y **talla sentada** | **No:** faltan los dos diámetros del tórax y la talla sentada |

**Conclusión.** El fraccionamiento completo en cinco componentes **no es viable** con las mediciones de BE: faltan seis (perímetro de la cabeza, diámetros biacromial, biiliocrestal, anteroposterior y transverso del tórax, y talla sentada). Sí se pueden calcular por separado la masa adiposa (MA-57) y, si el protocolo confirma los sitios, la masa muscular (MA-58), que son las dos partes que la literatura usa sueltas (Vaquero-Cristóbal y col. 2020; González-Mendoza y col. 2019). Para el modelo completo haría falta agregar esas seis mediciones al protocolo.

### MA-57 · Masa adiposa · Kerr

- **Clave:** `ant/kerr-masa-adiposa@1` · **Salida:** `masa-adiposa`, kg, 1 decimal · **Categoría BE:** `MASAS`.
- **Fórmula de la tesis.** `ZFAT = ((SFAT × (170.18/HT)) − 116.41) / 34.79`; `ADIPOSE MASS (kg) = ((ZFAT × 5.85) + 25.6) / (170.18/HT)³`, con SFAT la suma de los seis pliegues, 116,41 y 34,79 la suma de referencia del Phantom y su desvío, 25,6 kg y 5,85 kg la masa adiposa de referencia y su desvío. Es **tejido adiposo**, no lípido: por eso da más que las ecuaciones de grasa (Vaquero-Cristóbal y col. 2020).
- **Verificación cruzada.** Con las medias publicadas por Vaquero-Cristóbal y col. (2020): Σ6 = 77,32 mm y talla 173,52 cm dan k = 0,980751, Z = −1,166378 y MA = 19,904077 kg, frente a una media publicada de 19,89 kg (la fórmula no es lineal en la talla, así que la media de los resultados y el resultado de las medias no tienen por qué coincidir al centésimo).
- **Entradas.** `talla` (cm); los seis pliegues de MA-10 (mm).
- **Fórmula.**
  ```
  k = 170.18 / talla
  Z = (Σ6 * k - 116.41) / 34.79
  MA = (Z * 5.85 + 25.6) / k^3
  ```
- **Casos de prueba.**
  - **Caso 1 · H1.** `talla` 176,0 cm; `pliegue-triceps` 8,0 mm; `pliegue-subescapular` 10,0 mm; `pliegue-supraespinal` 7,0 mm; `pliegue-abdominal` 14,5 mm; `pliegue-muslo-frontal` 11,0 mm; `pliegue-pantorrilla` 6,5 mm. Σ6 = 57; k = 170,18 ÷ 176,0 = 0,966932; Z = (57 × 0,966932 − 116,41) ÷ 34,79 = −1,761854; k³ = 0,90404; MA = (−1,761854 × 5,85 + 25,6) ÷ 0,90404 = 16,916464 → **16,9 kg**.
  - **Caso 2 · M2.** `talla` 166,0 cm; `pliegue-triceps` 19,0 mm; `pliegue-subescapular` 14,0 mm; `pliegue-supraespinal` 14,0 mm; `pliegue-abdominal` 22,0 mm; `pliegue-muslo-frontal` 27,0 mm; `pliegue-pantorrilla` 17,0 mm. Σ6 = 113; k = 170,18 ÷ 166,0 = 1,025181; Z = (113 × 1,025181 − 116,41) ÷ 34,79 = −0,016228; k³ = 1,07746; MA = (−0,016228 × 5,85 + 25,6) ÷ 1,07746 = 23,671465 → **23,7 kg**.
  - **Caso 3 · H3.** `talla` 172,0 cm; `pliegue-triceps` 16,0 mm; `pliegue-subescapular` 24,0 mm; `pliegue-supraespinal` 20,0 mm; `pliegue-abdominal` 34,0 mm; `pliegue-muslo-frontal` 18,0 mm; `pliegue-pantorrilla` 12,0 mm. Σ6 = 124; k = 170,18 ÷ 172,0 = 0,989419; Z = (124 × 0,989419 − 116,41) ÷ 34,79 = 0,180451; k³ = 0,968591; MA = (0,180451 × 5,85 + 25,6) ÷ 0,968591 = 27,520031 → **27,5 kg**.
- **Límites.** Mismo cálculo para ambos sexos (el Phantom es unisex). Es una parte de un modelo pensado para que las cinco masas sumen el peso.

### MA-58 · Masa muscular · Kerr (con reserva)

- **Clave:** `ant/kerr-masa-muscular@1` · **Salida:** `masa-muscular-esqueletica`, kg, 1 decimal · **Categoría BE:** `MASAS`.
- **Fórmula de la tesis.** `SMU = CAGR + FAG + CTHG + CCAG + CCHG`; `ZMU = ((SMU × (170.18/HT)) − 207.21) / 13.74`; `MUSCLE (kg) = ((ZMU × 5.4) + 24.5) / (170.18/HT)³`. La corrección de cada perímetro es `perímetro − π × pliegue / 10` («Fat-corrected Girth = Girth − (pi Skinfold / 10)»); el antebrazo no se corrige. La misma forma en González-Mendoza y col. (2019) y Rivera-Amézquita y col. (2025).
- **Entradas.** `talla`; `perimetro-brazo-relajado` y `pliegue-triceps`; `perimetro-antebrazo`; `perimetro-muslo` y `pliegue-muslo-frontal`; `perimetro-pantorrilla` y `pliegue-pantorrilla`; `perimetro-pecho` y `pliegue-subescapular`.
- **Fórmula.**
  ```
  k   = 170.18 / talla
  SMU = (brazo_relajado - π*triceps/10) + antebrazo + (muslo - π*muslo_frontal/10)
        + (pantorrilla - π*pliegue_pantorrilla/10) + (pecho - π*subescapular/10)
  Z   = (SMU * k - 207.21) / 13.74
  MM  = (Z * 5.4 + 24.5) / k^3
  ```
- **Casos de prueba.**
  - **Caso 1 · H1.** `talla` 176,0 cm; `perimetro-brazo-relajado` 30,0 cm; `pliegue-triceps` 8,0 mm; `perimetro-antebrazo` 27,0 cm; `perimetro-muslo` 53,0 cm; `pliegue-muslo-frontal` 11,0 mm; `perimetro-pantorrilla` 37,0 cm; `pliegue-pantorrilla` 6,5 mm; `perimetro-pecho` 95,0 cm; `pliegue-subescapular` 10,0 mm. perímetros corregidos (perímetro − π × pliegue/10): brazo 27,486726, muslo 49,544248, pantorrilla 34,957965, pecho 91,858407; antebrazo sin corregir 27,0; Σ = 230,847346; k = 170,18 ÷ 176,0 = 0,966932; Z = (230,847346 × 0,966932 − 207,21) ÷ 13,74 = 1,164748; k³ = 0,90404; MM = (1,164748 × 5,4 + 24,5) ÷ 0,90404 = 34,057838 → **34,1 kg**.
  - **Caso 2 · M2.** `talla` 166,0 cm; `perimetro-brazo-relajado` 28,0 cm; `pliegue-triceps` 19,0 mm; `perimetro-antebrazo` 24,0 cm; `perimetro-muslo` 56,0 cm; `pliegue-muslo-frontal` 27,0 mm; `perimetro-pantorrilla` 36,0 cm; `pliegue-pantorrilla` 17,0 mm; `perimetro-pecho` 90,0 cm; `pliegue-subescapular` 14,0 mm. perímetros corregidos (perímetro − π × pliegue/10): brazo 22,030974, muslo 47,5177, pantorrilla 30,659292, pecho 85,60177; antebrazo sin corregir 24,0; Σ = 209,809737; k = 170,18 ÷ 166,0 = 1,025181; Z = (209,809737 × 1,025181 − 207,21) ÷ 13,74 = 0,573719; k³ = 1,07746; MM = (0,573719 × 5,4 + 24,5) ÷ 1,07746 = 25,614012 → **25,6 kg**.
  - **Caso 3 · H3.** `talla` 172,0 cm; `perimetro-brazo-relajado` 33,0 cm; `pliegue-triceps` 16,0 mm; `perimetro-antebrazo` 28,0 cm; `perimetro-muslo` 55,0 cm; `pliegue-muslo-frontal` 18,0 mm; `perimetro-pantorrilla` 38,0 cm; `pliegue-pantorrilla` 12,0 mm; `perimetro-pecho` 108,0 cm; `pliegue-subescapular` 24,0 mm. perímetros corregidos (perímetro − π × pliegue/10): brazo 27,973452, muslo 49,345133, pantorrilla 34,230089, pecho 100,460178; antebrazo sin corregir 28,0; Σ = 240,008851; k = 170,18 ÷ 172,0 = 0,989419; Z = (240,008851 × 0,989419 − 207,21) ÷ 13,74 = 2,202272; k³ = 0,968591; MM = (2,202272 × 5,4 + 24,5) ÷ 0,968591 = 37,5724 → **37,6 kg**.
- **Límites.** **No sembrar hasta confirmar** a qué nivel mide Kerr el perímetro del muslo (el apéndice A de la tesis, con la planilla de medición, no se pudo leer) y que el perímetro del pecho de BE sea el mesoesternal (D-3): el sitio del muslo cambia el resultado en varios kilos.

## 13. Revisados y no incluidos

| Qué | Por qué no se propone |
|---|---|
| **Faulkner · mujeres** (`%G = 0,213 × Σ4 + 7,9`) | El GREC (2009, 2010) y Rivera-Amézquita y col. (2025) la atribuyen a Faulkner (1968), pero el capítulo de Faulkner solo trae la ecuación de hombres, en una nota de tabla, para universitarios y nadadores varones; Pires Neto y Glaner (2007) señalan además ecuaciones «de Faulkner» para mujeres que no aparecen en esa fuente. **Sin respaldo en el original.** |
| **US Navy** (Hodgdon y Beckett 1984), hombres y mujeres | Los informes originales del Naval Health Research Center (n.º 84-11 y 84-29) no se pudieron leer (DTIC bloquea el acceso automático). Circulan **dos versiones que no son equivalentes**: una en pulgadas que da el porcentaje directo (hombres: `86,010 × log10(abdomen − cuello) − 70,041 × log10(talla) + 36,76`; mujeres: `163,205 × log10(…) − 97,684 × log10(talla) − 78,387`; Potter y col. 2022, que cita Hodgdon y Beckett 1984a,b y que para mujeres imprime «abdomen − cuello», cuando las demás fuentes usan cintura + cadera − cuello) y otra en centímetros que da la densidad para pasarla por Siri (hombres: `1,0324 − 0,19077 × log10(cintura − cuello) + 0,15456 × log10(talla)`; mujeres: `1,29579 − 0,35004 × log10(cintura + cadera − cuello) + 0,22100 × log10(talla)`; Sungur y col. 2023, que cita el informe 84-11). Para un hombre con abdomen 90 cm, cuello 38 cm y talla 178 cm, la versión en centímetros da 20,1 % y la de pulgadas, 20,3 %. Hasta tener los informes no se puede decir cuál es «la» ecuación. Sitios según esas fuentes: abdomen a la altura del ombligo (hombres), cintura en su parte más angosta y cadera en la mayor protrusión de las nalgas (mujeres), cuello debajo de la laringe. **No respaldada con la fuente primaria.** |
| **Masa ósea · Martin (1991)** (`MO = 0,00006 × talla (cm) × (DH + DM + DF + DT)²`, según el GREC) | Pide el diámetro bimaleolar (tobillo), que BE no tiene (`perimetro-tobillo` es un perímetro, no un diámetro). Además, el original (capítulo en Himes, *Anthropometric Assessment of Nutritional Status*, Wiley-Liss 1991) no estuvo accesible. **No viable con las mediciones de BE.** |
| **De Rose y Guimarães · mujeres** | El esquema original saca la grasa de Faulkner, que es de hombres. Armarlo con otra ecuación de mujeres sería una combinación de BE, no el método de los autores (D-11). |
| **Durnin y Womersley, ecuación de todas las edades** (17–72 y 16–68) | Está en la tabla de MA-17 y MA-18; los autores dan ecuaciones por franja de edad y no hace falta ofrecer las dos por defecto (D-8). |
| **Jackson y Pollock con perímetros de cintura y antebrazo** (ecuaciones 2, 4, 6 y 8 de la tabla 4) | No se pidieron. Además, en el original los perímetros están en metros (tabla 1) y las versiones con logaritmo usan el natural («natural log transformations»); el GREC 2009 las transcribió con «log» y perímetros en cm, y en 2010 las reemplazó. Habría que confirmar unidades antes de usarlas. |
| **Jackson y Pollock, 3 pliegues alternativos** (pecho, tríceps, subescapular) | No están en el artículo de 1978 (vienen de publicaciones posteriores de los mismos autores). |
| **Ecuaciones de la tesis de Yuhasz (1962)** (`3,641 + 0,0970 × Σ6` jóvenes y `4,975 + 0,1066 × Σ6` adultos, con pecho, tríceps, subescapular, suprailíaco, umbilical y muslo) | Tesis no publicada; se conocen por Pires Neto y Glaner (2007). Algunos trabajos la llaman «Yuhasz» (Dimitrijevic y col. 2022) y otros reservan ese nombre para la de 6 pliegues ISAK (MA-32): conviene no mezclarlas. |
| **Kerr: piel, hueso y residual** | Hueso y residual piden mediciones que BE no tiene; la fórmula de la superficie corporal de la piel no se pudo leer entera (§12). |
| **Withers 1987, Slaughter 1988, Poortmans 2005, Weltman 1987-88, Doupe 1997, Drinkwater y Ross 1980** | Aparecen en el GREC y en las revisiones consultadas, pero son para poblaciones específicas (deportistas australianos, niños, personas con obesidad) o piden mediciones que BE no tiene (perímetro supramaleolar, dos perímetros abdominales, perímetro glúteo además de cadera, diámetros del tronco). No se pidieron. |

## 14. Tabla resumen

| MA | Método | Pide (claves de BE) | Da | Fuente |
|---|---|---|---|---|
| 01 | IMC | `peso`, `talla` | `imc` kg/m² | Keys y col. 1972; OMS 2000 |
| 02 | Índice cintura/cadera | `perimetro-cintura`, `perimetro-cadera` | `indice-cintura-cadera` | OMS 2011 |
| 03 | Índice cintura/talla | `perimetro-cintura`, `talla` | `indice-cintura-talla` | Ashwell y Hsieh 2005; Ashwell y col. 2012 |
| 04 | Índice de conicidad | `perimetro-cintura`, `peso`, `talla` | `indice-conicidad` | Valdez 1991; Valdez y col. 1993 |
| 05 | BAI | `perimetro-cadera`, `talla` | `porcentaje-grasa` % | Bergman y col. 2011 |
| 06–07 | RFM · hombres / mujeres | `talla`, `perimetro-cintura` | `porcentaje-grasa` % | Woolcott y Bergman 2018 |
| 08–09 | Deurenberg · hombres / mujeres | `peso`, `talla`, `edad` | `porcentaje-grasa` % | Deurenberg y col. 1991 |
| 10 | Σ6 pliegues ISAK | tríceps, subescapular, supraespinal, abdominal, muslo frontal, pantorrilla | `suma-6-pliegues` mm | Carter 1982; ISAK; Vaquero-Cristóbal y col. 2020 |
| 11 | Σ8 pliegues ISAK | Σ6 + bíceps, cresta ilíaca | `suma-8-pliegues` mm | ISAK; Vaquero-Cristóbal y col. 2020 |
| 12 | Σ7 Jackson y Pollock | pectoral, axilar media, tríceps, subescapular, abdominal, cresta ilíaca, muslo frontal | `suma-7-pliegues` mm | Jackson y Pollock 1978 |
| 13 | Densidad JP 7 · hombres | Σ7 + `edad` | `densidad-corporal` g/ml | Jackson y Pollock 1978 (original) |
| 14 | Densidad JP 3 · hombres | pectoral, abdominal, muslo frontal + `edad` | `densidad-corporal` g/ml | Jackson y Pollock 1978 (original) |
| 15 | Densidad JPW 7 · mujeres | Σ7 + `edad` | `densidad-corporal` g/ml | Jackson, Pollock y Ward 1980 (vía secundarias) |
| 16 | Densidad JPW 3 · mujeres | tríceps, cresta ilíaca, muslo frontal + `edad` | `densidad-corporal` g/ml | Jackson, Pollock y Ward 1980 (vía secundarias) |
| 17–18 | Densidad D&W · hombres / mujeres | bíceps, tríceps, subescapular, cresta ilíaca + `edad` | `densidad-corporal` g/ml | Durnin y Womersley 1974 (original) |
| 19–30 | % de grasa desde densidad (6 densidades × Siri / Brozek) | las de su densidad | `porcentaje-grasa` % | Siri 1961; Brozek y col. 1963 |
| 31 | Faulkner · hombres | tríceps, subescapular, supraespinal, abdominal | `porcentaje-grasa` % | Faulkner 1968; Pires Neto y Glaner 2007 |
| 32–33 | Yuhasz-Carter · hombres / mujeres | Σ6 | `porcentaje-grasa` % | Yuhasz 1974; Carter 1982 (vía secundarias) |
| 34–35 | Masa grasa / libre de grasa (plantillas) | las de la base + `peso` | `masa-grasa`, `masa-libre-de-grasa` kg | Modelo de dos compartimentos |
| 36–37 | Índices de masa grasa / libre de grasa (plantillas) | las de la base + `peso`, `talla` | `indice-masa-grasa`, `indice-masa-libre-de-grasa` kg/m² | VanItallie y col. 1990 |
| 38 | IMLG normalizado (plantilla, solo hombres) | las de la base + `peso`, `talla` | `indice-masa-libre-de-grasa-normalizado` kg/m² | Kouri y col. 1995 |
| 39–40 | Lee, perímetros · hombres / mujeres | `talla`, `edad`, brazo relajado + tríceps, muslo + muslo frontal, pantorrilla + pliegue | `masa-muscular-esqueletica` kg | Lee y col. 2000 |
| 41–42 | Lee, peso y talla · hombres / mujeres | `peso`, `talla`, `edad` | `masa-muscular-esqueletica` kg | Lee y col. 2000 |
| 43 | Perímetro muscular del brazo | brazo relajado, tríceps | `perimetro-muscular-brazo` cm | Heymsfield y col. 1982 |
| 44 | Área muscular del brazo | brazo relajado, tríceps | `area-muscular-brazo` cm² | Heymsfield y col. 1982 |
| 45–46 | Área muscular corregida · hombres / mujeres | brazo relajado, tríceps | `area-muscular-brazo-corregida` cm² | Heymsfield y col. 1982 |
| 47–48 | Masa muscular Heymsfield · hombres / mujeres | `talla`, brazo relajado, tríceps | `masa-muscular-esqueletica` kg | Heymsfield y col. 1982 |
| 49 | Masa muscular Martin · hombres | `talla`, muslo + muslo frontal, antebrazo, pantorrilla + pliegue | `masa-muscular-esqueletica` kg | Martin y col. 1990 |
| 50 | Masa ósea Rocha | `talla`, `diametro-biestiloideo`, `diametro-femur` | `masa-osea` kg | Rocha 1975 (vía GREC) |
| 51–52 | Masa residual Würch · hombres / mujeres | `peso` | `masa-residual` kg | Würch 1974 (vía Gris 2001) |
| 53 | Masa muscular De Rose y Guimarães · hombres | `peso`, `talla`, 4 pliegues de Faulkner, biestiloideo, fémur | `masa-muscular` kg | De Rose y Guimarães 1980 (vía González-Mendoza y col. 2019) |
| 54 | Endomorfia | tríceps, subescapular, supraespinal, `talla` | `endomorfia` | Carter 2002; Carter y Heath 1990 |
| 55 | Mesomorfia | húmero, fémur, brazo flexionado, pantorrilla, tríceps, pliegue pantorrilla, `talla` | `mesomorfia` | Carter 2002 |
| 56 | Ectomorfia | `talla`, `peso` | `ectomorfia` | Carter 2002 |
| 57 | Masa adiposa Kerr | Σ6, `talla` | `masa-adiposa` kg | Kerr 1988 |
| 58 | Masa muscular Kerr (con reserva) | `talla`, brazo relajado + tríceps, antebrazo, muslo + muslo frontal, pantorrilla + pliegue, pecho + subescapular | `masa-muscular-esqueletica` kg | Kerr 1988 |

## 15. Discrepancias y decisiones

### 15.1 Donde las fuentes no coincidían, y qué se eligió

| # | Discrepancia | Elegido | Por qué |
|---|---|---|---|
| E-1 | Durnin y Womersley, hombres de 50 o más: el GREC (2009 y 2010) publica `m = 0,0799`; la tabla 5 del original, `0,0779` | **0,0779** | Es el original, leído en la imagen escaneada. La tabla 9 de los mismos autores lo confirma: para 50 o más y Σ4 = 100 mm publica 37,4 %; con 0,0779 sale 37,3 % (dentro de la tolerancia de E-10) y con 0,0799 saldría 39,3 % |
| E-2 | Jackson, Pollock y Ward, 7 pliegues, coeficiente de la edad: el GREC 2010 publica `0,000128228`; las demás reproducciones, `0,00012828` | **0,00012828** | El GREC es la única fuente con un dígito de más; el resto coincide. El original no estuvo accesible |
| E-3 | Jackson y Pollock, hombres, en el GREC 2009: la de 7 pliegues de hombres aparece bajo «mujeres» y para hombres se publica la versión con perímetros | Tabla 4 del original | El GREC 2010 corrigió las dos cosas, y el original está leído |
| E-4 | Nota de la tabla 1 de Jackson y Pollock (1978): «Fat (%) = [(4·95/BD) + 4·5] 100» | `495/D − 450` | Errata evidente del original (con «+» daría más de 900 %); los mismos autores citan a Siri |
| E-5 | Yuhasz-Carter: constantes 2,585 o 2,58 (hombres) y 3,580, 3,5803 o 3,58 (mujeres) | **2,585 y 3,580** | Los originales no estuvieron accesibles. 2,585 está en Rivera-Amézquita y col. (2025) y 3,580 en Escrivá y col. (2021); el GREC redondea a 2,58 y 3,58, y Rivera-Amézquita da 3,5803 para mujeres. La diferencia entre todas es de 0,005 puntos como máximo |
| E-6 | Kouri: el resumen dice `6,3 × (1,80 − talla)`; muchas fuentes secundarias y calculadoras usan 6,1 | **6,3** | Es lo que dice el original (resumen en PubMed) |
| E-7 | Lee y col. (2000): algunos trabajos (González-Mendoza y col. 2019) usan `0,00587 / 0,00138 / 0,00574`, constante 4,4, edad −0,026 y etnia −1,6 / +1,2, que no es la ecuación del resumen | **La del resumen** (`0,00744 / 0,00088 / 0,00441`, 7,8, −0,048, etnia −2,0 / +1,1) | Es la que los autores presentan como resultado para los 244 no obesos. La otra no está en el resumen; una búsqueda la ubica como la ecuación de un grupo de desarrollo del mismo artículo, pero no se pudo verificar en el texto completo |
| E-8 | Heymsfield: el resumen de PubMed imprime «(ht, cm2)» en la masa muscular | **Talla en cm** | Con la talla al cuadrado el resultado sería de miles de kilos; con cm da valores de músculo esperables y así la usa González-Mendoza y col. (2019) |
| E-9 | Sitio suprailíaco de Faulkner: sin descripción en la fuente; el GREC y González-Mendoza usan el supraespinal, la tradición brasileña dice «supra-ilíaca» | **`pliegue-supraespinal`** | Es lo que usan las dos fuentes que dan sitio explícito |
| E-10 | Tabla 9 de Durnin y Womersley frente a la tabla 5: algunas celdas no se reproducen al décimo con los coeficientes redondeados | Tabla 5 | La tabla 9 se calculó con coeficientes sin redondear; se usa como control con ±0,2 (§6) |
| E-11 | «Yuhasz» designa en la literatura a dos ecuaciones distintas (tesis de 1962 con pecho y suprailíaco; manual de 1974 con los 6 pliegues ISAK) | La de 1974, con el nombre «Yuhasz-Carter» | Para que el nombre del método no se preste a confusión (§13) |

### 15.2 Decisiones abiertas para Dirección

| # | Decisión | Opciones | Recomendación |
|---|---|---|---|
| D-1 | Sitio del suprailíaco de Jackson y Pollock (MA-12, MA-13, MA-15, MA-16, MA-19, MA-20, MA-23 a MA-26 y sus derivados) | A) `pliegue-cresta-iliaca`. B) `pliegue-supraespinal`. C) Agregar al protocolo un sitio «suprailíaco (ACSM)» | **A.** La definición del ACSM dice «immediately superior to the iliac crest», como la cresta ilíaca de ISAK; el supraespinal queda varios centímetros más arriba. El GREC 2010 hace lo mismo. La elección pesa: en H2, Σ7 con cresta ilíaca da 17,9 % de grasa (Siri) y con supraespinal, 16,8 %; en M2 (3 pliegues), 26,3 % y 24,4 %. Pastuszak y col. (2019) midieron 5,4 frente a 9,6 mm (hombres) y 8,9 frente a 15,2 mm (mujeres) entre supraespinal y cresta ilíaca |
| D-2 | Término étnico de Lee (MA-39 a MA-42) | A) Solo el término 0 («blancos o hispanos» en la fuente), con el nombre del método diciéndolo. B) Además, métodos aparte para los términos de personas asiáticas y afroestadounidenses | **A**, con el término escrito en la población del método. BE no registra ni infiere etnia; si se quisiera B, son métodos distintos que elige el profesional |
| D-3 | Sitios de los perímetros de muslo y pecho | Que el protocolo de BE declare si `perimetro-muslo` es el muslo medio (Lee, Martin) o el de 1 cm bajo el pliegue glúteo, y si `perimetro-pecho` es mesoesternal (Kerr) | Habilitar Lee y Martin solo con muslo medio; si el protocolo mide el otro nivel, crear una clave aparte (`perimetro-muslo-medio`). Kerr muscular queda en reserva hasta leer su planilla de medición |
| D-4 | Sitio de la cintura | Un solo `perimetro-cintura` con el sitio que declare el protocolo de BE, y el límite escrito en cada método; o claves separadas (cintura OMS, cintura mínima, cintura en cresta ilíaca) | Una sola clave, con el sitio declarado y el límite a la vista. El RFM es el más sensible (su cintura es la de NHANES, en la cresta ilíaca) |
| D-5 | Qué bases de porcentaje de grasa se instancian en las plantillas MA-34 a MA-38 | Todas las que se siembren, o solo las de pliegues | Instanciar sobre las de pliegues (MA-19 a MA-33) que Dirección siembre; dejar BAI, RFM y Deurenberg sin derivados hasta que se pidan |
| D-6 | Resultados fuera de dominio físico (porcentaje de grasa negativo, masa muscular por diferencia negativa) | Devolver el número o devolver un error «fuera de dominio» | **Error de dominio** con el motivo, como ya hacen las reglas con las entradas en cero. El somatotipo tiene su propia regla (0,1) |
| D-7 | Densidad como método visible (MA-13 a MA-18) | Ofrecerla o dejarla solo como paso interno | Ofrecerla: cuesta poco y es el número que publican las ecuaciones |
| D-8 | Ecuación de Durnin y Womersley para todas las edades | Ofrecerla como método aparte o no | No por defecto: los autores dan las de franja |
| D-9 | Siri y Brozek | Ofrecer las dos conversiones o solo Siri | Las dos, con Siri primero: es la que usaron Durnin y Womersley y Jackson y Pollock |
| D-10 | Faulkner, De Rose y Guimarães y US Navy en el catálogo | Retirarlos, dejarlos solo para hombres o esperar la fuente | Faulkner y De Rose y Guimarães **solo hombres**; US Navy **fuera** hasta leer los informes 84-11 y 84-29 |
| D-11 | De Rose y Guimarães para mujeres | No ofrecer, u ofrecer una combinación de BE (por ejemplo, con Yuhasz-Carter mujeres) rotulada como tal | No ofrecer hasta que Dirección elija la ecuación de grasa con fuente |
| D-12 | Clave de la métrica de salida | Genérica (`porcentaje-grasa`, `masa-muscular-esqueletica`…) o una por método (`grasa-faulkner`…) | Genérica, que es la que sugirió el encargo de esta ficha: la comparabilidad de BE ya exige el mismo método, así que una métrica genérica no mezcla corridas de métodos distintos |

## 16. Contraste con el borrador del árbol de trabajo (2026-10-01)

Mientras se escribía esta ficha, la rama `feat/antropometria-lamina` (todavía no integrada en `main`) sumó el commit `07dc358`, «Antropometría: 29 fórmulas publicadas como métodos del catálogo de BE (DL-111)»: `packages/domain/src/formulas-antropometricas.ts` con 29 reglas `be/…@1` que remiten a esta ficha, y una migración que las siembra. No se tocó nada. Como un método publicado no se edita (REG-06-203), lo que haya que corregir conviene hacerlo antes de integrar la rama; si la migración ya corrió en algún ambiente, va como versión nueva. Lo que coincide y lo que no:

- **Coincide:** IMC, ICC, ICA; sumas ISAK de 6 y 8; coeficientes de Durnin y Womersley por franja (con 0,0779), de Jackson y Pollock y de Jackson, Pollock y Ward; Faulkner; Deurenberg; Rocha; Würch; Lee con término étnico 0; las tres ecuaciones del somatotipo y las tres ramas de la ectomorfia.
- **Difiere:**
  1. El suprailíaco de Jackson y Pollock y de Jackson, Pollock y Ward es `pliegue-supraespinal`; esta ficha recomienda `pliegue-cresta-iliaca` (D-1). Con el borrador no dan los casos de MA-12, MA-13, MA-15, MA-16, MA-19, MA-20, MA-23 a MA-26 ni los derivados de §8.
  2. `be/grasa-faulkner@1`, `be/masa-grasa-faulkner@1` y `be/masa-libre-de-grasa-faulkner@1` no dicen sexo, y la población sembrada dice «Deportistas adultos»; la ecuación es solo de hombres, universitarios y nadadores (MA-31, §13).
  3. `be/masa-muscular-4c-mujeres@1` aplica Faulkner a mujeres: sin respaldo (D-11).
  4. `be/grasa-navy-hombres@1` y `be/grasa-navy-mujeres@1` usan la versión en centímetros, cuya fuente primaria no se pudo verificar (§13).
  5. Endomorfia y mesomorfia no aplican la regla del manual «cero o negativo → 0,1».
  6. El comentario de Durnin y Womersley cita la «tabla 4»: en el original es la tabla 5 (la 4 es la numeración del GREC).
  7. No están los métodos de densidad, las variantes Brozek, conicidad, BAI, RFM, Yuhasz-Carter, Lee con peso y talla, Heymsfield, Martin, Kerr ni los índices de VanItallie y Kouri, que esta ficha agrega.
  8. Las reglas se nombran `be/…@1`; esta ficha sugiere claves de método `ant/…@1`. Pueden convivir si se mapean una a una (la regla es la función; la clave es la del catálogo).
  9. Las métricas de salida son una por método (`grasa-faulkner`…); esta ficha propone genéricas (D-12).

## 17. Fuentes

Marcas: **[O]** original leído (texto completo); **[R]** resumen leído (PubMed o la revista); **[S]** usada como fuente secundaria para cruzar coeficientes o sitios; **[N]** citada sin leer el texto (no accesible, o solo se verificó la cita en PubMed).

**Índices**
- [N] Keys A, Fidanza F, Karvonen MJ, Kimura N, Taylor HL. Indices of relative weight and obesity. *J Chronic Dis.* 1972;25(6):329-343. doi:10.1016/0021-9681(72)90027-6. Reimpreso en *Int J Epidemiol.* 2014;43(3):655-665. doi:10.1093/ije/dyu058.
- [N] World Health Organization. *Obesity: preventing and managing the global epidemic. Report of a WHO consultation.* WHO Technical Report Series 894. Ginebra: OMS; 2000.
- [O] World Health Organization. *Waist circumference and waist–hip ratio: report of a WHO expert consultation, Geneva, 8–11 December 2008.* Ginebra: OMS; 2011. ISBN 978 92 4 150149 1. https://www.who.int/publications/i/item/9789241501491
- [N] Ashwell M, Hsieh SD. Six reasons why the waist-to-height ratio is a rapid and effective global indicator for health risks of obesity and how its use could simplify the international public health message on obesity. *Int J Food Sci Nutr.* 2005;56(5):303-307. doi:10.1080/09637480500195066.
- [N] Ashwell M, Gunn P, Gibson S. Waist-to-height ratio is a better screening tool than waist circumference and BMI for adult cardiometabolic risk factors: systematic review and meta-analysis. *Obes Rev.* 2012;13(3):275-286. doi:10.1111/j.1467-789X.2011.00952.x.
- [N] Valdez R. A simple model-based index of abdominal adiposity. *J Clin Epidemiol.* 1991;44(9):955-956. doi:10.1016/0895-4356(91)90059-i.
- [R] Valdez R, Seidell JC, Ahn YI, Weiss KM. A new index of abdominal adiposity as an indicator of risk for cardiovascular disease. A cross-population study. *Int J Obes Relat Metab Disord.* 1993;17(2):77-82. PMID 8384168.
- [S] Shidfar F, Alborzi F, Salehi M, Nojomi M. Association of waist circumference, body mass index and conicity index with cardiovascular risk factors in postmenopausal women. *Cardiovasc J Afr.* 2012;23(8):442-445. doi:10.5830/CVJA-2012-038.
- [O] Bergman RN, Stefanovski D, Buchanan TA, Sumner AE, Reynolds JC, Sebring NG, Xiang AH, Watanabe RM. A better index of body adiposity. *Obesity (Silver Spring).* 2011;19(5):1083-1089. doi:10.1038/oby.2011.38. PMC3275633.
- [O] Woolcott OO, Bergman RN. Relative fat mass (RFM) as a new estimator of whole-body fat percentage ─ A cross-sectional study in American adult individuals. *Sci Rep.* 2018;8:10980. doi:10.1038/s41598-018-29362-1. PMC6054651.
- [R] Deurenberg P, Weststrate JA, Seidell JC. Body mass index as a measure of body fatness: age- and sex-specific prediction formulas. *Br J Nutr.* 1991;65(2):105-114. doi:10.1079/BJN19910073.

**Pliegues, densidad y porcentaje de grasa**
- [O] Jackson AS, Pollock ML. Generalized equations for predicting body density of men. *Br J Nutr.* 1978;40(3):497-504. doi:10.1079/BJN19780152.
- [R][N] Jackson AS, Pollock ML, Ward A. Generalized equations for predicting body density of women. *Med Sci Sports Exerc.* 1980;12(3):175-181. PMID 7402053.
- [S] Fahey TD, Insel PM, Roth WT. *Fit and Well*, 6.ª ed. McGraw-Hill; 2005. Lab A6-3, «Alternative Skinfold Measurement Formulas to Calculate Percent Body Fat» (toma Jackson y Pollock 1985 y ACSM 2000). https://websites.umich.edu/~exphysio/mvs.240/AdditonalLabs/Pred.Bodyfat.Skinfold.6.3.pdf
- [S] Kogure GS, Silva RC, Ribeiro VB y col. Concordance in prediction body fat percentage of Brazilian women in reproductive age between different methods of evaluation of skinfolds thickness. *Arch Endocrinol Metab.* 2020;64(3):257-268. doi:10.20945/2359-3997000000246.
- [O] Durnin JVGA, Womersley J. Body fat assessed from total body density and its estimation from skinfold thickness: measurements on 481 men and women aged from 16 to 72 years. *Br J Nutr.* 1974;32(1):77-97. doi:10.1079/BJN19740060.
- [N] Siri WE. Body composition from fluid spaces and density: analysis of methods. En: Brozek J, Henschel A, eds. *Techniques for Measuring Body Composition.* Washington: NAS-NRC; 1961. Reimpreso en *Nutrition.* 1993;9(5):480-491. PMID 8286893. (La forma de la ecuación se verificó en Durnin y Womersley 1974 y Jackson y Pollock 1978.)
- [N] Brozek J, Grande F, Anderson JT, Keys A. Densitometric analysis of body composition: revision of some quantitative assumptions. *Ann N Y Acad Sci.* 1963;110:113-140. doi:10.1111/j.1749-6632.1963.tb17079.x. (La forma de la ecuación se tomó de Guerra y col. 2010.)
- [O] Guerra RS, Amaral TF, Marques E, Mota J, Restivo MT. Accuracy of Siri and Brozek equations in the percent body fat estimation in older adults. *J Nutr Health Aging.* 2010;14(9):744-748. doi:10.1007/s12603-010-0112-z.
- [N] Faulkner JA. Physiology of swimming and diving. En: Falls HB, ed. *Exercise Physiology.* Academic Press; 1968.
- [O] Pires Neto CS, Glaner MF. «Equação de Faulkner» para predizer a gordura corporal: o fim de um mito. *Rev Bras Cineantropom Desempenho Hum.* 2007;9(2):207-213.
- [N] Yuhasz MS. *Physical Fitness Manual.* London (Ontario): University of Western Ontario; 1974.
- [N] Carter JEL. Body composition of Montreal Olympic athletes. En: Carter JEL, ed. *Physical Structure of Olympic Athletes. Part I: The Montreal Olympic Games Anthropological Project.* Basel: Karger; 1982. p. 107-116.
- [O][S] Alvero-Cruz JR, Cabañas Armesilla MD, Herrero de Lucas A, Martínez Riaza L, Moreno Pascual C, Porta Manzañido J, Sillero Quintana M, Sirvent Belando JE. Protocolo de valoración de la composición corporal para el reconocimiento médico-deportivo. Documento de consenso del Grupo Español de Cineantropometría (GREC) de la FEMEDE. Versión 2010. *Arch Med Deporte.* 2010;27(139):330-344. Versión 2009: *Arch Med Deporte.* 2009;26(131):166-179.
- [S] Vaquero-Cristóbal R, Albaladejo-Saura M, Luna-Badachi AE, Esparza-Ros F. Differences in fat mass estimation formulas in physically active adult population and relationship with sums of skinfolds. *Int J Environ Res Public Health.* 2020;17(21):7777. doi:10.3390/ijerph17217777.
- [S] Escrivá D, Caplliure-Llopis J, Benet I, Mariscal G, Mampel JV, Barrios C. Differences in adiposity profile and body fat distribution between forwards and backs in sub-elite Spanish female rugby union players. *J Clin Med.* 2021;10(23):5713. doi:10.3390/jcm10235713.
- [S] Rivera-Amézquita LV, Saavedra-Bernal X, Díaz-Moreno S y col. Validity and reliability of anthropometric equations versus Dual X-ray Absorptiometry to estimate body composition in athletes with unilateral lower-limb amputation: a pilot study. *PLoS One.* 2025;20(7):e0326524. doi:10.1371/journal.pone.0326524.
- [S] Dimitrijevic M y col. Body fat evaluation in male athletes from combat sports by comparing anthropometric, bioimpedance, and dual-energy X-ray absorptiometry measurements. *Biomed Res Int.* 2022;2022:3456958. doi:10.1155/2022/3456958.
- [N] Stewart A, Marfell-Jones M, Olds T, de Ridder H. *International Standards for Anthropometric Assessment.* ISAK; 2011. (Definiciones de sitio tomadas de Carter 2002, Pastuszak y col. 2019 y Vaquero-Cristóbal y col. 2020.)
- [O] Pastuszak A, Gajewski J, Buśko K. The impact of skinfolds measurement on somatotype determination in Heath-Carter method. *PLoS One.* 2019;14(9):e0222100. doi:10.1371/journal.pone.0222100.

**Masas e índices de masa**
- [R] VanItallie TB, Yang MU, Heymsfield SB, Funk RC, Boileau RA. Height-normalized indices of the body's fat-free mass and fat mass: potentially useful indicators of nutritional status. *Am J Clin Nutr.* 1990;52(6):953-959. doi:10.1093/ajcn/52.6.953.
- [R] Kouri EM, Pope HG Jr, Katz DL, Oliva P. Fat-free mass index in users and nonusers of anabolic-androgenic steroids. *Clin J Sport Med.* 1995;5(4):223-228. doi:10.1097/00042752-199510000-00003.
- [R] Lee RC, Wang Z, Heo M, Ross R, Janssen I, Heymsfield SB. Total-body skeletal muscle mass: development and cross-validation of anthropometric prediction models. *Am J Clin Nutr.* 2000;72(3):796-803. doi:10.1093/ajcn/72.3.796. Fe de erratas: *Am J Clin Nutr.* 2001;73(5):995 [N].
- [R] Heymsfield SB, McManus C, Smith J, Stevens V, Nixon DW. Anthropometric measurement of muscle mass: revised equations for calculating bone-free arm muscle area. *Am J Clin Nutr.* 1982;36(4):680-690. doi:10.1093/ajcn/36.4.680.
- [R] Martin AD, Spenst LF, Drinkwater DT, Clarys JP. Anthropometric estimation of muscle mass in men. *Med Sci Sports Exerc.* 1990;22(5):729-733. doi:10.1249/00005768-199010000-00027.
- [N] Martin AD. Anthropometric assessment of bone mineral. En: Himes JH, ed. *Anthropometric Assessment of Nutritional Status.* New York: Wiley-Liss; 1991. p. 185-196.
- [S] González-Mendoza RG, Gaytán-González A, Jiménez-Alvarado JA, Villegas-Balcázar M, Jáuregui-Ulloa EE, Torres-Naranjo F, López-Taylor JR. Accuracy of anthropometric equations to estimate DXA-derived skeletal muscle mass in professional male soccer players. *J Sports Med (Hindawi).* 2019;2019:4387636. doi:10.1155/2019/4387636.
- [S] Berral de la Rosa FJ, Rodríguez-Bies EC, Berral de la Rosa CJ, Rojano Ortega D, Lara Padilla E. Comparación de ecuaciones antropométricas para evaluar la masa muscular en jugadores de bádminton. *Int J Morphol.* 2010;28(3):803-810.
- [S] Rojano-Ortega D, Moya-Amaya H, Molina-López A, Berral-Aguilar AJ, Berral-de la Rosa FJ. Development and validation of a new anthropometric equation to predict skeletal muscle mass in a heterogeneous caucasian population. *Sci Rep.* 2024;14:28646. doi:10.1038/s41598-024-77965-8.
- [N] Rocha MSL. *Peso ósseo do brasileiro de ambos os sexos de 17 a 25 anos.* Rio de Janeiro; 1975.
- [N] Würch A. La femme et le sport. *Médecine Sportive Française.* 1974.
- [S] Gris GM. Componentes del somatotipo y ecuaciones antropométricas. *Apunts Med Esport.* 2001;36(137):5-16. doi:10.1016/S1886-6581(01)76000-8.
- [N] De Rose EH, Guimarães ACA. A model for optimization of somatotype in young athletes. En: Ostyn M, Beunen G, Simons J, eds. *Kinanthropometry II.* Baltimore: University Park Press; 1980. p. 77-80.
- [S] Silva PRP, Trindade RS, De Rose EH. Body composition, somatotype and proportionality of elite bodybuilders in Brazil. *Rev Bras Med Esporte.* 2003;9(6):408-412.

**Somatotipo y Kerr**
- [O] Carter JEL. *The Heath-Carter Anthropometric Somatotype — Instruction Manual.* San Diego State University; 2002 (rev. 2003). http://web.archive.org/web/20180128063742/http://www.somatotype.org:80/Heath-CarterManual.pdf
- [N] Carter JEL, Heath BH. *Somatotyping: Development and Applications.* Cambridge: Cambridge University Press; 1990.
- [O] Kerr DA. *An anthropometric method for fractionation of skin, adipose, bone, muscle and residual tissue masses, in males and females age 6 to 77 years* [tesis de maestría]. Burnaby (BC): Simon Fraser University; 1988. https://summit.sfu.ca/item/5139

**US Navy (no propuesta)**
- [N] Hodgdon JA, Beckett MB. *Prediction of percent body fat for U.S. Navy men from body circumferences and height.* Report 84-11; y *… for U.S. Navy women …* Report 84-29. San Diego: Naval Health Research Center; 1984.
- [S] Potter AW, Tharion WJ, Holden LD, Pazmino A, Looney DP, Friedl KE. Circumference-based predictions of body fat revisited: preliminary results from a US Marine Corps body composition survey. *Front Physiol.* 2022;13:868627. doi:10.3389/fphys.2022.868627.
- [S] Sungur A, Sungur MA, Simsek B y col. Body fat percentage and infarct size in patients with non-ST segment elevation myocardial infarction. *North Clin Istanb.* 2023;10(5):567-574. doi:10.14744/nci.2023.87259.
