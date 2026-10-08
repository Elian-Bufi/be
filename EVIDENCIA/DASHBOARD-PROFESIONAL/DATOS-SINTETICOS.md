# Datos sintéticos · 12 semanas y un año de volumen

**Encargo:** §17. **Herramientas:** `EVIDENCIA/DASHBOARD-PROFESIONAL/herramientas/datos/` (escenario, generador y
verificador). **Base:** solo local (`be_test_dashboard` en el PostgreSQL 16 de la máquina). Nunca `test` ni producción:
el generador aborta si la base no es `localhost`.

Ningún dato es de una persona real. Las cuentas son `@example.invalid`, los asesorados se ven con el seudónimo de BE
(«Asesorado · 3f9c1a») y las credenciales quedan en `herramientas/trabajo/`, que git ignora.

## 1. Cómo se genera y cómo se verifica

```bash
# Node 22 en el PATH; PostgreSQL 16 local en :55442 (usuario be_test)
cd EVIDENCIA/DASHBOARD-PROFESIONAL/herramientas
./entorno.sh compilar-api        # dominio + API (apps/api/dist)
./datos/regenerar.sh             # base nueva, cuentas, historia, recientes, verificación y volumen
```

`regenerar.sh` deja la API local corriendo en `:3001`, con los profesionales sintéticos verificados. Corre seis fases:

| Fase | Por dónde | Qué hace |
|---|---|---|
| `cuentas` | API real | Registra al profesional, a otro profesional y a los asesorados A y B, como cualquier cuenta. La verificación profesional sale de `BE_DEMO_PROFESIONALES` (DL-036): por eso la API se reinicia |
| `base` | API real | Vínculos, B2, A3, evaluaciones, objetivos (vigentes desde D-84) y los borradores de la etapa 1 |
| `historia` | SQL documentado | Activa las dos etapas en el pasado y escribe 12 semanas de comidas, sesiones y tomas |
| `recientes` | API real, hoy | Comidas de ayer y de hoy, la toma de ayer cargada hoy, la sesión de hoy y el asesorado B |
| `verificar` | API real, como el profesional | Compara con los resultados esperados (§5) |
| `volumen` | API real (cuenta, vínculos y planes) y SQL documentado (historia) | El asesorado C, con un año denso para medir (§7). Termina reiniciando la API: las fases inician sesión varias veces y el límite (5 cada 15 minutos) vive en memoria |

**Por qué hay una fase por SQL.** La API registra todo en el instante en que ocurre: una activación siempre queda «ahora»
y el momento de registro sale de la base. Para tener 12 semanas de historia con fechas reales, la fase `historia`
escribe con fechas explícitas, igual que los soportes de las pruebas de integración (`soporte-entrenamiento.ts`,
`soporte-antropometria.ts`). Lo hace con estas reglas:
- **No desactiva los disparadores.** La base verifica cada inserción: versión activada, instantánea antes de la
  vigencia, sucesión de versiones, ejecución desde su borrador, la ejecución en la fecha de su ocurrencia y
  solo-agregar.
- **Escribe el hecho de cada acto en la misma transacción,** como la API: activación, apertura del seguimiento, registro,
  rectificación, anulación, corrección y emisión del objetivo.
- **Arma la instantánea con la misma función del dominio** que usa la API al activar (`construirInstantanea` y
  `construirInstantaneaDeEntrenamiento`), sobre el contenido que la API validó al guardar el borrador.

## 2. Cuentas y permisos

| Cuenta | Alcances | Para qué |
|---|---|---|
| Lic. Sofía Paz (sintética) | Nutrición, Entrenamiento y Antropometría | El profesional de la demostración: el análisis entre áreas es legítimo porque tiene los tres vínculos con consentimiento |
| Asesorado A | Los tres, con este profesional | La historia de 12 semanas |
| Asesorado B | Nutrición y Antropometría | **Vista parcial** sin revocar nada: este profesional no trabaja Entrenamiento con B |
| Asesorado C | Los tres, con este profesional | **Volumen** para medir (§7): un año, no una historia para leer |
| Lic. Tercera (sintética) | Nutrición, sin vínculos | **Tercero sin acceso:** recibe 404, igual que con un asesorado inexistente |

La **revocación** de un consentimiento se prueba en `test/integration/analisis.int-spec.ts`, en un escenario aparte,
para que la demostración no cambie.

## 3. La historia de A, semana por semana

D0 es el día de la generación (en esta corrida, el jueves 8/10/2026). La semana 1 es D-83..D-77 y la 12, D-6..D0.

| Semanas | Nutrición | Entrenamiento | Antropometría |
|---|---|---|---|
| 1-3 | Etapa 1 (2100 kcal), desde D-83. Cuatro comidas por día con las porciones del plan; la merienda de los miércoles, sin confirmar | Etapa 1 «Fuerza base», desde D-83: A los lunes (sentadilla, peso muerto, zancadas) y B los jueves (banca, remo, dominadas) | D-82, perfil completo |
| 4 | **D-62..D-59 sin registros (hueco)**; después, como S1 | Lunes con cambios: **hip thrust en lugar de zancadas** | D-61: la cintura se **tipeó 95,0 y se corrige** a 90,5 |
| 5-7 | Sin merienda. Martes: **cena informada** (papa a la mitad, sin aceite). Sábados: **comida diferente solo con texto** | Jueves de S5: **banca en libras**. Jueves de S6: **no realizada** (viaje). Lunes de S7: **registro resumido** | D-40: **otro protocolo (laboratorio), que parece un salto** |
| 8-12 | **Etapa 2 (1950 kcal), desde D-35 a las 09:30**: el desayuno de D-35 todavía es de la etapa 1. Lunes **cargados al día siguiente**. D-30: **sin confirmar y rectificado** el D-29. D-11: merienda **anulada** | **Etapa 2 «Fuerza progresión», desde D-35**. Jueves de S9: **cargada al día siguiente** | D-19: **dos tomas el mismo día** (08:00 y 19:30); el **pliegue del bíceps, anulado** |
| 10 | **Solo almuerzo y cena: baja la cobertura, no las cantidades** | **Sin sesiones** (vacaciones) | — |
| Recientes | D-1: desayuno; almuerzo **rectificado hoy**; merienda **anulada**; cena **diferente**. D0: desayuno | Hoy, por la API: la sesión A | D-1, **cargada hoy** por la API (carga tardía) |

**Asesorado B:** plan activado hoy por la API, dos comidas de hoy (una sin confirmar) y una toma de D-10.

### Energía de cada opción, calculada a mano (kcal)

Composición del catálogo sembrado, por 100 g o 100 ml. Los alimentos del catálogo sintético de WP-04 (avena, leche,
yogur, manzana, pan integral, queso) **no tienen fibra**: la fibra de esas comidas es desconocida, no cero.

| Etapa | Comida | Opción | Cuenta | kcal |
|---|---|---|---|---|
| 1 | Desayuno | Avena con leche | avena 50 g × 3,79 = 189,5 + leche 200 ml × 0,35 = 70 | **259,5** |
| 1 | Almuerzo | 1 · Arroz con pollo y brócoli | arroz 150 × 1,30 = 195 + pollo 120 × 1,65 = 198 + brócoli 100 × 0,35 = 35 | **428** |
| 1 | Almuerzo | 2 · Lentejas con zanahoria | lentejas 200 × 1,16 = 232 + zanahoria 100 × 0,35 = 35 + aceite 10 × 8,84 = 88,4 | **355,4** |
| 1 | Merienda | Yogur con manzana | yogur 200 × 0,61 = 122 + manzana 150 × 0,52 = 78 | **200** |
| 1 | Cena | Salmón con papa | salmón 150 × 2,06 = 309 + papa 200 × 0,87 = 174 + aceite 5 × 8,84 = 44,2 | **527,2** |
| 1 | Cena informada | papa a la mitad, sin aceite | 309 + 100 × 0,87 = 87 + 0 | **396** |
| 2 | Desayuno | 1 · Avena con leche | avena 40 × 3,79 = 151,6 + 70 | **221,6** |
| 2 | Desayuno | 2 · Tostadas con queso | pan integral 60 × 2,47 = 148,2 + queso 30 × 2,64 = 79,2 | **227,4** |
| 2 | Almuerzo | 1 · Arroz con pollo y brócoli | 120 × 1,30 = 156 + 140 × 1,65 = 231 + 150 × 0,35 = 52,5 | **439,5** |
| 2 | Almuerzo | 2 · Lentejas con zanahoria | 232 + 35 + aceite 5 × 8,84 = 44,2 | **311,2** |
| 2 | Merienda | Yogur con manzana | 122 + 78 | **200** |
| 2 | Cena | Salmón con papa | 309 + papa 150 × 0,87 = 130,5 + 44,2 | **483,7** |

## 4. Casos difíciles y su resultado esperado

| Caso | Dónde | Resultado esperado (independiente de la implementación) | Criterio |
|---|---|---|---|
| Subtotal, no total | Merienda sin confirmar de los miércoles (S1-S4) | Día = desayuno + almuerzo + cena, con calidad **parcial** y «1 registro sin cantidades». Ej.: 259,5 + 428 + 527,2 = **1214,7 kcal, subtotal** | PRO-11 |
| Comida diferente | Sábados S5-S7 y la cena de D-1 | Sin calorías ni macros; el día es un subtotal y la cobertura cuenta 4 comidas diferentes sin cantidades | PRO-10, PRO-11 |
| Cantidades informadas | Cena de los martes S5-S7 | 396 kcal, no 527,2 (lo previsto no es lo consumido) | PRO-11 |
| Alternativas | Dos opciones de almuerzo; dos desayunos en la etapa 2 | Se cuenta la opción registrada; las alternativas no se suman como objetivo del día | PRO-12 |
| Media semanal | Toda semana con días sin valor | Media de los **días con valor**, con su denominador («5 de 7 días»); nunca la suma dividida por 7 | PRO-12 |
| Baja la cobertura, no las cantidades | Semana 10: solo almuerzo y cena | Cada comida registrada vale lo mismo que antes, pero el día baja a 923,2 o 794,9 kcal (según la opción del almuerzo) porque hay **2 registros, no 4**: la cobertura lo dice y no se lee como «comió menos» | PRO-12, §17 |
| Hueco | D-62..D-59 | Un hueco de 4 días, no ceros; la línea se corta | PRO-10 |
| Rectificación | D-30 (S8) y el almuerzo de D-1 | Cuenta **una vez**, con la versión rectificada; la línea de tiempo la muestra como relación de la misma entrada | PRO-16, PRO-03 |
| Anulación | Merienda de D-11 y de D-1 | Fuera de los agregados, en el historial marcada «Anulado» | PRO-16 |
| Carga tardía | Comidas de los lunes S8-S12; sesión del jueves de S9; toma de D-1 | Ordenadas por el día del hecho, con la marca de carga tardía | PRO-03 |
| Dos etapas | D-35 | Bandas de vigencia v1 y v2; requerimiento 2100 kcal hasta D-35 y 1950 desde D-35, como escalones contiguos | PRO-18 |
| Objetivo histórico | Sesiones de las dos etapas | Cada serie se compara con el objetivo de la versión que rigió ese día | PRO-13 |
| RIR nulo y RIR 0 | Serie 3 de la sentadilla en semanas impares; serie 4 de la etapa 2 | El nulo no es punto («sin dato de esta serie»); el 0 es un punto | PRO-13 |
| Corrección | Sentadilla, serie 2, S3 | **65 kg**, no 650: cuenta la corrección vigente | PRO-16 |
| Unidades incompatibles | Banca en lb (S5) | La serie en kg no la incluye y avisa «1 sesión registró la carga en lb» | PRO-14 |
| Sustitución | Hip thrust en S4 | Hip thrust es otro ejercicio (1 sesión); no se suma a zancadas | PRO-14 |
| Registro resumido | Lunes de S7 | Sin puntos de series: no se sintetizan series desde un resumen | PRO-10 |
| No realizada | Jueves de S6 | 0 series registradas, con su condición; no es un hueco ni un cero de carga | PRO-10 |
| Cambio de protocolo | Peso de D-40 (79,4 kg) | Otro tramo: la línea se corta y **no hay diferencia ni cambio relativo** a través del corte, aunque parezca un salto de 2,2 kg | PRO-15, §17 |
| Dos tomas en un día | D-19 (80,2 y 80,9 kg) | Dos puntos, «Toma del día 1 de 2» y «2 de 2»; ni un promedio ni uno solo | PRO-15 |
| Corrección de una medición | Cintura de D-61 | 90,5 cm, marcada como corregida | PRO-16 |
| Sitio anulado | Pliegue del bíceps de D-19 | Sin punto; queda en el historial | PRO-15 |
| Vista parcial | Asesorado B | Aviso único de vista parcial; ningún dato ni conteo de Entrenamiento | PRO-20 |
| Tercero | Lic. Tercera | 404 en la línea de tiempo y en las proyecciones, igual que con un asesorado inexistente | PRO-20 |
| Muchos eventos | Cualquier semana de 4 comidas + sesiones | 317 entradas en 12 semanas; la página de la línea de tiempo trae 20 o 50 y el resto se pide con el cursor | PRO-04, PRO-24 |

## 5. Lo que comprueba el verificador

`datos/verificar.mjs` lee por la API, como el profesional, y compara con resultados que **no salen del código de BE**:
la energía de cada opción está escrita a mano (§3) y los conteos salen de las reglas del escenario. La corrida del
2026-10-08 dio **25 de 25**:

| Comprobación | Valor de la corrida |
|---|---|
| Cobertura de 84 días | 280 registros efectivos, 272 con cantidades, 4 comidas diferentes, 2 anulados excluidos, 2 rectificados una vez, 80 días con registros |
| Hueco | 7/8/2026 a 10/8/2026 (4 días) |
| Cada día: suma de lo conocido, calidad y n | 80 de 80 días |
| Cada semana: media de los días con valor y su denominador | 13 de 13 semanas (las de los extremos, parciales) |
| Escalones del requerimiento | 2100 kcal del 16/7 al 3/9; 1950 kcal desde el 3/9 |
| Sentadilla, serie 2 | 60, 62,5, **65** (corregida), 67,5, 70, 72,5, 77,5, 80, … 87,5 (hoy), sin la semana resumida |
| RIR de la serie 3 | 8 puntos; los nulos no son puntos ni ceros |
| Banca | kg y lb separados; la serie en kg avisa la sesión en lb |
| Peso | 82,4 · 81,6 · **79,4** (otro protocolo) · 80,2 · 80,9 (mismo día) · 79,8 → tres tramos |
| Cintura | 92 · **90,5** (corregida) · 89 · 88,2 |
| Línea de tiempo de 12 semanas | 317 entradas: 282 comidas (con las anuladas, marcadas), 22 sesiones, 6 tomas, 4 activaciones, el objetivo de D-35 y 2 aperturas de seguimiento |
| Permisos | B con vista parcial (Nutrición y Antropometría); el tercero, 404 |

**El verificador detecta errores:** con la cena de la etapa 1 cambiada a 527,3 kcal, la corrida da 23 de 71 y lista
cada día afectado. Se restauró el valor; no se tocan valores esperados para que algo pase.

## 6. Límites

- **Descansos medidos, estimados y sin dato (§17):** no están. La métrica de descanso es derivable pero no entra en esta
  versión del diccionario, y cargar datos que ninguna pantalla consume no prueba nada. Queda para cuando se implemente.
- **Resultados de métodos** (sumatorias, porcentaje de grasa): no están en A, B ni C. Los valores estimados por un
  método y los reportados por la persona se prueban en el escenario descartable (§8), con sus propias cuentas.
- **Fotos:** la comida diferente de los sábados es solo texto. No se suben imágenes al conjunto: las fotos privadas se
  prueban en el paquete de Nutrición con recetas.
- **Revisiones:** no hay revisiones registradas. Tampoco hay una revisión que dé origen a la etapa 2: el objetivo de la
  etapa 2 se inserta con su predecesora y su hecho, como lo dejaría la API.
- **Zona horaria:** la de la demostración, `America/Argentina/Buenos_Aires` (UTC−3, sin horario de verano), como el resto
  de BE (DL-009).
- **Reproducibilidad:** el escenario es relativo al día de la generación. Generado otro día, cambian las fechas y los
  días de la semana, pero no las reglas ni los valores por opción. El verificador recalcula lo esperado para ese día.

## 7. Conjunto de volumen (PRO-24)

El encargo pide medir con el conjunto de 12 semanas **y con otro de mayor volumen**. El asesorado C tiene un año entero
(D-365 a D-1), con la etapa 1 de los dos planes activada en D-366:

| Área | Qué hay | Cuánto |
|---|---|---|
| Nutrición | Cuatro comidas por día con las porciones del plan; la merienda de cada noveno día sin confirmar y la cena de cada decimotercero informada | 1.460 registros |
| Entrenamiento | A los lunes y viernes, B los miércoles; la carga sube 2,5 kg por semana en ciclos de 8 semanas | 157 sesiones, cada una con 9 series |
| Antropometría | Una toma cada dos semanas, con el perfil completo | 26 tomas |

Es volumen, no un caso de lectura: no tiene resultados esperados a mano (esos son los de A) y la demostración no lo
usa. Se mide con `herramientas/tiempos.mjs 366 7 C` (período máximo de 366 días); ver `ACEPTACION.md`, PRO-24.

## 8. Escenario descartable: valores estimados y revocación desde la interfaz

La revisión independiente del head fbeb256 pidió dos pruebas que A, B y C no podían cubrir sin alterarse: valores
antropométricos estimados y una revocación hecha por el asesorado desde su web. Se hacen con **cuentas sintéticas
separadas y descartables**, nuevas en cada corrida. Las de A, B y C, la demostración de DEMO-A01 y la base de test no se
tocan.

```bash
node datos/generar.mjs descartable-cuentas     # profesional y asesorado nuevos; escribe trabajo/demo-profesionales-descartable.txt
./entorno.sh parar-api
./entorno.sh api "$(sed -n 's/^BE_DEMO_PROFESIONALES=//p' trabajo/demo-profesionales-descartable.txt)"
node datos/generar.mjs descartable-datos       # vínculos, tres tomas y dos corridas del IMC, por la API
node recorrido.mjs descartable                 # gráficos, lectura, tabla, CSV y la revocación desde la web
```

| Qué | Cómo se carga | Resultado esperado |
|---|---|---|
| Cuentas | `descartable-cuentas`, por la API: `pro-descartable-<sufijo>` y `ase-descartable-<sufijo>` en `example.invalid`. El profesional, «Lic. Descartable (sintética)», se verifica con `BE_DEMO_PROFESIONALES` en Nutrición y Antropometría | — |
| Vínculos | `descartable-datos`: Nutrición y Antropometría, con B2 y A3 | Dos vínculos activos |
| Peso medido | Toma de D-20 (captura directa): peso 81,2 kg y talla 178,0 cm | Punto lleno; «Medido» |
| Peso reportado | Toma de D-12 con origen `SELF_REPORTED`: peso 80,5 kg | Contorno cortado; «Reportado por la persona, no medido» en la lectura, la tabla y el CSV; «Reportado» en la toma |
| Peso medido | Toma de D-4 (captura directa): peso 79,9 kg y talla 178,0 cm | Punto lleno |
| IMC calculado | Dos corridas de `be/imc@1` (API-CAL-01) sobre las tomas medidas | 25,6 y 25,2 kg/m² (25,60 y 25,20 en el CSV, con los decimales fijos de la métrica); un punto adentro; «Calculado por un método (estimación)» |
| Revocación | La hace el asesorado en el recorrido, desde `/account/relationships/detail` (Antropometría): «Revocar acceso de Lic. Descartable (sintética)» → «Revocar acceso» | Después, el origen de un punto, la exportación y los gráficos dicen «no está disponible con tu acceso actual», sin un valor de antes |

Cada corrida crea cuentas nuevas: las de corridas anteriores quedan en la base local (`be_test_dashboard`), revocadas,
y se descartan con ella (`regenerar.sh` crea una base nueva).

