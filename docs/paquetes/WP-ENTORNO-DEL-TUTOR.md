# WP-ENTORNO-DEL-TUTOR — el generador de la muestra que recorre el tutor

> **Lo que decidió Dirección (2026-11-19):** una profesional de demostración, la **Lic. Julieta Arce**, con las tres áreas;
> **cinco personas en profundidad** (Tomás, Valeria, Gustavo, Carolina y Silvia) y **diez livianas**; cada nombre con la
> **inicial del apellido** («Tomás M.»); la muestra se rehace **a pedido**, nunca con una tarea programada, y el generador
> puede **armarla de cero con semilla fija** y **ponerse al día** sin duplicar; la marca de demostración va **solo en la
> guía**; los **casos reales** de Elián en test no se tocan ni se borran; el tutor **no recibe Administración**.
>
> Rama `wp-entorno-del-tutor`, sobre main `0d591613` (la planificación integrada). Registro en `docs/DEUDA_LEGAJO.md`
> (**DL-184**; la 183 es de `wp-graficos-patrones-y-enfoques`). Requisitos: «Requisitos del entorno del tutor»
> (REQ-TUT-01 a 79), con lo de arriba encima. Decisiones de continuador **TUT-D01 a TUT-D14**, a ratificar.

## 1. Qué es

Un generador en `scripts/entorno-del-tutor/` que arma la historia entera de la muestra **como datos** (sin base), la pasa
por un **verificador automático** de verosimilitud y de la matriz de los gráficos y, solo si todo cumple, la **carga** en
una base de BE por el mismo camino que la cohorte de #161.

| Pieza | Qué hace |
| --- | --- |
| `personas.mjs` | Quiénes son: la profesional, sus dos colegas mínimas y las quince personas, con sus fases, curvas, pausas y objetivos, todo en semanas relativas al día de armado |
| `historia.mjs` | La historia día por día, pura y reproducible: planes con versiones, fases, bloques «En vueltas» y calentamiento; sesiones serie por serie con RIR, esfuerzo, tiempos y descansos; objetivos que cierran 4/4/9; comidas con lo indicado, lo informado, las diferentes y los huecos; tomas con 8 pliegues, perímetros y diámetros; revisiones, notas y la historia anterior |
| `herramientas.mjs`, `textos.mjs` | Las herramientas de la profesional (plantillas con versiones, alimentos propios, medidas caseras, recetas, habituales) y todo lo escrito (notas, notas de la sesión, revisiones, coordinación) |
| `reglas.mjs` | El chequeo de verosimilitud: R-TRN-01 a 14, R-NUT-01 a 09, R-ANT-01 a 07, R-PRO-01 y 02, R-TXT-01, la privacidad, el catálogo y las rarezas |
| `matriz.mjs` | La matriz de los gráficos por persona (GR-01 a GR-27, «Patrones» y SP-01 a SP-08): «Luce» y «Ve» exigen el dato, «Vacío» exige que falte |
| `verificar.mjs` | El verificador: arma, verifica, deja el informe y falla si algo no cumple |
| `cargar.mjs` | La carga: `armar`, `al-dia`, `comprobar`, `resumen` y `credenciales` |
| `ci.mjs` | La prueba de punta a punta en la CI, contra un PostgreSQL efímero, con las capturas |
| `scripts/entorno-del-tutor.test.mjs` | Las pruebas (TEST-TUT-01 a 07) |
| `.github/workflows/entorno-del-tutor.yml` | Los dos trabajos de la CI: `verificador` (sin base) y `carga` (con base efímera y capturas) |

## 2. Qué genera, persona por persona

Los valores salen del generador con su ruido; los de abajo son los de una corrida con origen el 19/11.

| Persona | En BE | Áreas | La historia | Lo que trae |
| --- | --- | --- | --- | --- |
| **Tomás M.**, 31 | 14 meses | Las tres con Julieta | Empieza de cero y progresa: Adaptación, Hipertrofia, Fuerza, Descarga de una semana, Hipertrofia 2 y 3 y Fuerza 2, que termina hoy. Brazos «En vueltas»; calentamiento en los básicos; un viaje de 9 días; una vez hizo remo con mancuerna en lugar de con barra | 7 versiones (3 desde plantillas de versiones distintas), unas 200 sesiones con tiempos en las últimas 12 semanas, 2 objetivos, 13 tomas, 6 notas |
| **Valeria Q.**, 38 | 16 meses + 10 de historia anterior | Las tres con Julieta | Diez semanas sin cambios en el press de banca (≈ 51-53 kg) con el RIR que baja de 2 a 0 a igual carga; Descarga; fase 4-6 con 2.300 kcal y 297 g de carbohidratos (antes 2.100 y 236); el press llega a ≈ 55,5 kg. Diez meses con el Prof. Esteban I. antes, autorizados como historia anterior | 5 versiones, unas 240 sesiones, 3 objetivos, 14 tomas, la nota de ayer «La última serie de press me molestó el hombro izquierdo» |
| **Gustavo P.**, 47 | 13 meses | Las tres con Julieta | Cuatro meses activo, diez semanas sin nada por una mudanza (con la nota), vuelve con 2,8 kg más y la sentadilla un 10 por ciento abajo, que recupera en unas 8 semanas; a la vuelta, plan simplificado desde una plantilla; asado los domingos | 4 versiones, unas 110 sesiones, 15 tomas, la revisión de Nutrición vencida hace 3 días |
| **Carolina R.**, 34 | 12 meses | Las tres con Julieta | Ovolactovegetariana: déficit, mantenimiento, déficit y mantenimiento (71,4 → 63,6 kg; 6 pliegues de 148 a ≈ 101 mm; cintura de 84 a ≈ 74,5 cm); la fuerza se sostiene y sube un poco; un tercio de las comidas con foto (marcado en la historia) | 2 versiones de Entrenamiento, 4 objetivos, 14 tomas cada 4 semanas, ningún alimento con carne ni pescado |
| **Silvia D.**, 58 | 5 semanas | Entrenamiento y Antropometría con Julieta; Nutrición con la Lic. Natalia Y. | Indicación médica por osteopenia; plan 1 con máquinas y mancuernas, RIR 3; una semana con gripe; el plan 2 en borrador; comparte con las dos | Formularios, 1 toma, 8 a 10 sesiones de las 15 indicadas, los estados vacíos honestos |
| Diez livianas | 2 a 8 meses | Una o dos áreas | Mariana T., Joaquín S., Rosa E., Nicolás H., Paula N., Ramiro C., Inés V., Facundo L., Daniela K. y Hugo A. (vínculo finalizado hace 17 semanas), de 19 a 72 años, mitad mujeres, con formas de registrar distintas | Un plan con una o dos versiones, dos o tres tomas, los mismos chequeos |

Las herramientas de la profesional: 4 plantillas de Entrenamiento con 2 o 3 versiones, 2 nutricionales, 9 alimentos
propios caseros (uno corregido y uno retirado), 13 medidas caseras, 11 recetas, 5 comidas habituales, 3 sesiones
habituales, 14 ejercicios habituales, 4 vistas de «Analizar» y los 3 enfoques.

## 3. Cómo se verifica

- **El verificador** (`verificar.mjs`) arma la historia y aplica cada regla por persona y la matriz por celda. En la
  corrida del 19/11: 456 de 456 combinaciones de regla y persona y 159 de 159 celdas. La carga se niega a correr con una
  sola falla (salida 2).
- **Las pruebas** (`node --test scripts/entorno-del-tutor.test.mjs`): la misma huella con la misma semilla y el mismo
  día; otro día da la misma forma; ponerse al día contiene lo anterior sin cambiarlo; el verificador da todo bien con
  cuatro orígenes; y **falla** con un descanso de 17 minutos, un RIR de 9, macros que no cierran, pollo en el plan de
  Carolina y «cumplimiento» en una nota.
- **La CI** (`entorno-del-tutor`): el trabajo `carga` arma la muestra con el origen de hace 7 días en un PostgreSQL
  efímero, la pone al día, la vuelve a armar y a poner al día (los conteos no cambian), la comprueba por la base y por la
  API con la cuenta de la profesional y saca las capturas de las pantallas clave de cada persona en Claro a 1920 × 1080
  (artefacto `entorno-del-tutor`).

## 4. Cómo se corre en test (a pedido, con Elián)

Nunca lo corre la CI ni una tarea programada. Hace falta, fuera del repositorio: la URL externa de `be-db-test` con la IP
del operador abierta en Render mientras dura la carga, y un secreto propio para las contraseñas.

```bash
cd <el repo, con las dependencias instaladas>
npm run build:domain && npx prisma generate
export BE_TUTOR_DESTINO=test
export BE_TUTOR_API=https://be-api-hndp.onrender.com   # la guardia exige esta y no otra (en local, solo localhost)
export BE_TUTOR_BASE="$(cat C:/Users/bufim/BE-datos-locales/render-test-db.txt)"
read -rs BE_TUTOR_CLAVE && export BE_TUTOR_CLAVE      # se escribe sin que se vea ni quede en el historial de la terminal
export BE_TUTOR_CONFIRMO_TEST=si
node scripts/entorno-del-tutor/verificar.mjs          # el chequeo, sin tocar nada
node scripts/entorno-del-tutor/cargar.mjs armar       # la primera vez se detiene y muestra BE_DEMO_PROFESIONALES
#   → SUMAR esos tres valores (separados por «;») a BE_DEMO_PROFESIONALES de la API de test en Render, sin borrar los
#     que ya tiene, y esperar el redespliegue
node scripts/entorno-del-tutor/cargar.mjs armar       # completa la muestra
node scripts/entorno-del-tutor/cargar.mjs comprobar   # la base contra la historia y la API de la profesional
node scripts/entorno-del-tutor/cargar.mjs credenciales  # correo y contraseña de Julieta y de Carolina, solo en la terminal
```

- **Ponerse al día** (los días que pasaron desde el armado): `node scripts/entorno-del-tutor/cargar.mjs al-dia`.
- **Correr las fechas a hoy** (la foto del día nueva): `node scripts/entorno-del-tutor/cargar.mjs armar --generacion 2`.
  Son cuentas nuevas (`tutor-g2.*`); las de la generación anterior quedan, sin vínculo con las nuevas (TUT-D05).
- Después de cargar, cerrar la IP del operador en Render.

## 5. Las decisiones de continuador (a ratificar)

| ID | Decisión | Por qué |
| --- | --- | --- |
| TUT-D01 | Los nombres: **Tomás M., Valeria Q., Gustavo P., Carolina R., Silvia D.**; las livianas, arriba; las colegas, **Lic. Natalia Y.** y **Prof. Esteban I.** Se evitaron la B (Bufi) y la G (García) | La inicial del apellido que pidió Elián. El verificador cruza contra los nombres conocidos del proyecto (Franco García, Elián Bufi, la cohorte y la demostración) y, con `BE_TUTOR_NOMBRES_REALES`, contra una lista de Elián fuera del repositorio |
| TUT-D02 | De las diez livianas, **una con el vínculo finalizado** (Hugo A.): la cartera muestra 14 activas y una finalizada | REQ-TUT-13 pedía 15 activas y una más finalizada, pero Elián fijó diez livianas |
| TUT-D03 | **Profesional de 16 meses** (70 semanas), no 14 | Valeria está 16 meses con ella (REQ-TUT-19 a 21) |
| TUT-D04 | **El camino de la cohorte:** lo de hoy por la API pública (cuentas, consentimientos, evaluaciones, borradores, cálculos, plantillas, alimentos, compartir, historia anterior); lo del pasado por SQL con los disparadores activos, cada estado como en la API y cada transición con su hecho | La API no deja registrar en el pasado, a propósito; es el estándar ya probado en #161 y en las capturas. No es SQL a mano: cada fila sale de la historia generada y verificada |
| TUT-D05 | **Rehacer sin borrar.** La base es de historia por adición: nada se borra. «Armar de cero» es una **generación nueva** (cuentas nuevas) o una base nueva; «ponerse al día» agrega lo que registran las personas y deja lo de la profesional hasta el origen (los pendientes envejecen, como en una semana real). REQ-TUT-66 a 68 y 70 (el borrado, la noche, las 12 y las 18) no van | Lo decidió Elián (a pedido) y la base no permite borrar sin apagar sus disparadores, que no se tocan |
| TUT-D06 | **La marca propia:** correos `tutor-gN.<persona>@example.invalid`, la procedencia `DATOS-SINTETICOS` / `SIEMBRA-TUTOR` y los ids UUID v5 de la semilla y la generación. El generador escribe solo para sus cuentas; cada UPDATE lleva el id de una fila suya | Que nunca toque lo que no creó, empezando por los casos reales de Elián |
| TUT-D07 | **Sin franja de demostración en pantalla** (REQ-TUT-44 no va); la guía lo dice | Decisión de Elián |
| TUT-D08 | **Los casos reales no se borran** (REQ-TUT-48 cambia): el tutor no recibe Administración y la guía le dice con qué cuentas probar | Decisión de Elián |
| TUT-D09 | **Cómo se leen las reglas abiertas:** R-TRN-01 con tolerancia de 1 punto más el paso del equipamiento y el tope del comienzo del tramo; R-TRN-04 hasta n + RIR 12 (donde Epley vale), sin la vuelta de una pausa y con ningún RIR de más de 5; R-TRN-11 acepta un rango de repeticiones más alto como explicación; R-NUT-02 con fibra de 20 a 35 g, o 14 g cada 1.000 kcal si es más; R-NUT-04 cuenta aparte el día con una comida diferente; R-NUT-09 con la magnitud a la mitad de la predicha; R-PRO-02 con el promedio de cada uno de los últimos 6 meses; R-ANT-03 con el ruido contra la tendencia de las tomas vecinas | Las reglas tienen número, pero algunas no dicen contra qué se mide; así quedan verificables y escritas |
| TUT-D10 | **Valores orientativos ajustados** para que el balance cierre (R-NUT-09): Tomás con 2.750 → 2.850 kcal y actividad 1,725 (el documento decía 2.900 → 3.100), su 1RM final ≈ 117 / 81 / 142 kg (decía 122 / 84 / 150); Gustavo con 2.250 y 2.200 kcal; Gustavo registra 5 o 6 días por semana (decía 4 o 5, contra R-NUT-04) | Con los valores del documento, sus propias reglas fallan |
| TUT-D11 | **Valeria es intermedia** (tope de 2,5 por ciento por mes) | Con el tope de 1 por ciento de «años de entrenamiento», la subida de ≈ 52 a ≈ 56 kg en 12 semanas que pide REQ-TUT-19 sería imposible |
| TUT-D12 | **Sin la rareza grande** (el descanso de 14 minutos, R-RAR-01) | BE todavía no marca los datos dudosos: así lo pide el propio requisito |
| TUT-D13 | **Lo que va por la API queda con la fecha del armado:** la autorización de la historia anterior, lo que comparte Silvia, el borrador del plan 2, las plantillas y los alimentos propios | La API no acepta fechas pasadas para eso; lo que necesita fecha (vínculos, planes, registros, tomas, revisiones, notas, el vínculo finalizado) va por SQL |
| TUT-D14 | **El esfuerzo de la sesión** se registra en la última serie de cada ejercicio | El contrato no tiene un esfuerzo por sesión: es por serie |

## 6. Los requisitos

| Requisitos | Estado |
| --- | --- |
| REQ-TUT-06, 07, 09 a 11, 13, 15, 16, 18 a 28 | **Cubiertos en la historia y en la carga**, con lo de TUT-D02, D03 y D10 |
| REQ-TUT-17 | **Cubierto:** los formularios de inicio de las cinco se piden y se responden por la API (formato 3), con los campos de texto que la persona puede contestar desde su historia y los demás sin responder; con la fecha del armado (TUT-D13). Las livianas no tienen formularios |
| REQ-TUT-29, 30, 33, 35 a 40, 42, 45, 46 | **Cubiertos por el verificador** (reglas y matriz), con lo de TUT-D09 |
| REQ-TUT-43, 47, 49, 59 a 64 | **Cubiertos** (marca, separación, construcción, semilla, idempotencia, fechas relativas) |
| REQ-TUT-71, 73 | **Cubiertos** (el verificador tiene sus pruebas con casos que fallan; R-TXT-01 con la guardia de BE) |
| REQ-TUT-72, 74 | **Cubiertos en la CI:** capturas de las pantallas clave de cada persona en Claro y Azul noche, a 1920 × 1080 y a 1440 × 900; `comprobar` compara los conteos y «Te toca a vos» renglón por renglón (cada revisión vencida o de hoy tiene su renglón con la fecha acordada, y cada renglón sale de la historia). Las capturas por celda de la matriz siguen siendo de la revisión con Elián |
| REQ-TUT-12, 14 | **Cubiertos**, con la fecha del armado en lo que va por la API (TUT-D13): las notas de coordinación de Silvia, el pedido de información a Silvia que espera respuesta, la invitación a una persona nueva y los vencimientos (Tomás hoy, Gustavo vencida hace 3 días, dos livianas) |
| REQ-TUT-08 | **Cubierto** con 16 meses (TUT-D03) |
| REQ-TUT-31, 32, 34 | **Cubiertos:** 11 recetas de la profesional y, en la última versión del plan de Tomás, Valeria y Carolina, una opción que nace de una receta (con los mismos alimentos y cantidades de la historia, en una porción) |
| REQ-TUT-52 | **Declarado, a decidir por Elián:** las fotos están marcadas en la historia (R-NUT-08: un tercio de las comidas de Carolina, algunas de Valeria) pero no se cargan hasta que Elián elija las imágenes (propias o de un banco con licencia, sin metadatos y con la fuente fuera del repositorio) |
| REQ-TUT-76, 77 | **Cubiertos en la CI:** con la cuenta de la profesional, una cuenta ajena a la muestra da 403 o 404 en cinco pedidos y Administración no entra; el «tutor travieso» crea un borrador del plan de Tomás, escribe y archiva una nota, retira un alimento propio e invita, y después `al-dia` corre igual: no duplica nada, no borra lo del tutor y la cuenta ajena sigue sin vínculos |
| REQ-TUT-65, 75 | **Abiertos:** se corren en test con Elián (el comando de §4) |
| REQ-TUT-44, 48, 66 a 70 | **No van** por las decisiones de Elián (TUT-D05, D07, D08) |
| REQ-TUT-01 a 05, 41, 50, 51, 53 a 58, 78, 79 | **De la guía y de la revisión con Elián**, fuera del generador |

## 7. Lo que queda

- Las fotos (REQ-TUT-52), con las imágenes que elija Elián.
- Las medidas caseras van en los alimentos propios (13, NUA-08): BE no las pone en los alimentos del catálogo base, así que
  el «1 taza de arroz cocido» del plan de Gustavo queda pendiente de Administración.
- Los gráficos que todavía no existen (GR-07 a 10, 15, 17, 19, 21, 22, 25, SP-03 a 08) y los enfoques y «Patrones»
  (por integrar en #277): la matriz verifica que los datos los dejan listos; la guía muestra solo lo que funciona.
- Ratificar TUT-D01 a TUT-D14.
