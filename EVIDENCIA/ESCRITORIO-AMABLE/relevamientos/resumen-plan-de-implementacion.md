# Resumen · plan de implementación (solo lectura: no compilé ni ejecuté nada)

**Alias (rutas absolutas)**
- `REPO` = `C:\Users\bufim\BE-Best-entrenamiento`
- `SEG` = `REPO\apps\web\src\app\pro\advisees\seguimiento` · `ADV` = `REPO\apps\web\src\app\pro\advisees`
- `CSS` = `REPO\apps\web\src\app\globals.css` · `TOK` = `REPO\apps\web\src\app\tokens.css`
- `DOM` = `REPO\packages\domain\src` · `API` = `REPO\apps\api\src`
- `MQ` = `C:\Users\bufim\BE-maquetas\planos-fuente` (cuerpos en `MQ\partes\01-cuerpo.html` y `14-cuerpo.html`; estilos en `MQ\resumen.css` y `MQ\plano.css`; gráficos y datos en `MQ\plano.js`)
- `R` = `REPO\EVIDENCIA\DASHBOARD-PROFESIONAL\herramientas\recorrido.mjs` · `RC` = `…\herramientas\recorrido-comprension.mjs`
- `CRIT` = `REPO\EVIDENCIA\ESCRITORIO-AMABLE\diseno\CRITERIO-Y-AUDITORIA.md` · `WP` = `REPO\docs\paquetes\WP-ESCRITORIO-AMABLE.md` · `GUIA` = `REPO\docs\ux\GUIA-UX-UI.md`
- `ACE-PRO` = `REPO\EVIDENCIA\DASHBOARD-PROFESIONAL\ACEPTACION.md` · `ACE-CP` = `REPO\EVIDENCIA\DASHBOARD-COMPRENSION\ACEPTACION.md` · `ACE` = `REPO\EVIDENCIA\ESCRITORIO-AMABLE\ACEPTACION.md`

Leído sobre `wp-escritorio-amable`, HEAD `8bfaf33`, árbol limpio. **El árbol avanzó mientras leía** (de `af7f984` a `8bfaf33`): cambió un comentario de `DOM\contratos-analisis.ts:311-316` (corre cinco líneas todo lo que sigue en ese archivo: las líneas de abajo ya son las nuevas), `ver.mjs` y `datos\verificar.mjs`. Lo demás no cambió.

Todo lo que afirmo sobre el código lo leí, con su línea. Donde deduzco o calculo sin haber medido, lo marco **[supongo]** o **[estimo]**.

## 1. Lo que condiciona el plan

1. **Las filas de la maqueta reescriben textos que son garantía del dominio.** La síntesis y la cobertura tienen plantillas fijas con prueba propia (`DOM\sintesis-del-resumen.ts:369-423`; `DOM\comprension-del-dashboard.test.ts:536-647`) y `WP` §2 dice que no se reescriben «para que entren en una composición». La maqueta las acortó:

   | La maqueta dice | BE escribe hoy | Dónde |
   |---|---|---|
   | «Desde tu revisión del 10 sept» | «Desde la revisión del 10 sept 2026» | `DOM\sintesis-del-resumen.ts:359-360`; prueba `…test.ts:556` |
   | «En el período elegido» | «En el período seleccionado» | `:361-362`; prueba `:560`; lo exige `RC:766` |
   | «Próxima revisión: 30 sept · en 2 días» | «La próxima revisión acordada es el 30 sept 2026 (en 2 días).» | `:373-378`; prueba `:582` |
   | «Esa revisión está registrada, sin aplicar» | «La revisión del 11 sept 2026 está registrada y su resultado todavía no se aplicó.» | `:371-372`; prueba `:581` |
   | «Hay un plan en borrador: todavía no rige» | «Hay una versión nueva del plan en borrador, creada el 7 oct 2026. No rige hasta que se active.» | `:379-380`; prueba `:583` |
   | «44 comidas nuevas» · «1 comida de antes, cargada después» · «1 registro corregido» (tres filas) | «44 comidas registradas, 1 hecho anterior cargado después y 1 registro anterior corregido o anulado.» (una frase) | `:389-400`; prueba `:555`; el recorrido la lee con tres expresiones (`RC:670-672`) |
   | «El peso cambió de protocolo el 9 sept» | «Una medida cambió de protocolo, método o unidad en el período (Peso): su serie se corta donde cambia.» | `:385-388` |
   | «9 comidas registradas» · «2 comidas sin confirmar las cantidades» (pantalla 14) | «5 de 42 días con algún registro; 9 registros: 7 con cantidades y 2 sin cantidades. El plan rige desde el 20 sept 2026: antes, en el período, no había un plan de este seguimiento.» | `:403-408` y `:274`; prueba `:603-606`; lo exige `RC:766` |
   | «Revisión pendiente desde el 12 sept» (14) | «La próxima revisión acordada era el 12 sept 2026 (hace 15 días).» | `:377` |
   | «42 días: 36 con valor · 6 sin registros» y, debajo, «De los 36, 3 son subtotales» | «42 días: 36 con valor» · «de ellos, 3 son subtotales (falta algún dato)» · «6 sin registros» · «hoy, en curso: fuera de la media» (en ese orden) | `DOM\series-del-analisis.ts:411-423`; pruebas `…test.ts:301, 317, 338-354`; lo exige `R:576` |
   | «6 sesiones con valor» | «6 sesiones: 6 con valor» | `DOM\series-del-analisis.ts:431-434`; prueba `:373` |
   | «5 tomas: 3 con el protocolo nuevo» | «5 tomas: 3 del último tramo comparable» | `:425-430`; prueba `:379` |
   | «¿Cómo viene progresando un ejercicio?» | «¿Cómo viene progresando este ejercicio?» | `DOM\preguntas-profesionales.ts:60`; lo busca `RC:706` |
   | «Peso corporal» | «Peso» | `DOM\nombres-de-metricas.ts:10` |

   Dos de esos textos, además, **dicen algo que en BE no es cierto**: «1 comida de antes, cargada después» (la cuenta es de hechos de cualquier tipo, `DOM\sintesis-del-resumen.ts:250`; en la base de prueba uno es un objetivo, `ACE-CP:33`) y «La línea se corta donde cambió el plan» (punto 5).

   **Lo que propongo:** las filas llevan el texto del dominio, entero. Para tener «la cifra grande y su texto» sin reescribir, sumar al dominio una función que devuelva **las partes** de la misma frase (como ya hace `partesDeLaCobertura`, y como E-32 las eligió para el encabezado de un gráfico): `textoDeObservacion` sigue armándose con ellas y sus pruebas no cambian. Las palabras quedan las del dominio («44 comidas registradas», no «comidas nuevas»). La alternativa (un titular corto por regla, nuevo, con su prueba) es una decisión de quien implementa: §8, DEC-1.

2. **La maqueta no entra en la ventana donde se mide.** Está dibujada a 1440 × **960** (`MQ\generar.mjs:23`) con un marco de 116 px y una barra de 56 (`MQ\plano.css:89, 99, 104`). El producto se mide a 1440 × **900**, con la barra de 65 px y el marco de 143 (`ACE:36, 77-79`; E-10) y 20 px de aire (`CSS:3954-3956`): el contenido empieza cerca de los 228 px (224 medidos en la Parte 1), contra 192 en la maqueta.
   - Con los estilos de la maqueta, el contenido mide unos 758 px: tarjetas 458, preguntas 58, indicadores 242 (suma de `MQ\resumen.css:3-38`; la imagen llega a los 952 px). **[estimo]** En el producto terminaría cerca de los 986 px: **unos 86 px debajo del borde**, con los textos cortos de la maqueta.
   - Con los textos del dominio, cada pendiente ocupa dos o tres renglones en una tarjeta de 448 px, y la cobertura de un indicador de 90 días, tres. **[estimo]** Son entre 40 y 80 px más.
   - `.ficha__cuerpo.secciones` separa los bloques 16 px (`CSS:4091-4093`); la maqueta, 8 y 6 (`MQ\resumen.css:23, 28`).
   - En la pantalla de Dirección (1920 × 1080, `ACE:213`) hay 852 px y tarjetas de 501 px (el cuerpo tiene tope de 100 rem, `CSS:3946-3952`): **[estimo]** entra todo.
   - Consecuencia: «sin desplazarse» (`WP` §1) hay que definirlo con una medición, como hizo E-24. Propuesta en §5, paso 9, y §8, DEC-3.

3. **Los macros del objetivo no llegan en el panel, pero sí por una operación que ya existe.** API-DSH-03 trae solo el requerimiento de calorías (`DOM\contratos-vinculo.ts:307-313`; `API\dashboard\lectura-dashboard.ts:66-73`, y la consulta ni los selecciona, `:145`). Los tres macros están en API-NUT-06, «objetivo efectivo» (`DOM\cliente-http.ts:715-717`; `DOM\contratos-nutricion.ts:112-134`), que ya usan el plan y el editor (`ADV\nutrition\plan.tsx:44`, `editor.tsx:147`). Es **una lectura más**, sin tocar contratos. Cuidado: cada macro puede venir en `g/day` o en `energy_share` (`DOM\contratos-nutricion.ts:92`); hoy solo se escribe `g/day` (`ADV\nutrition\formularios.tsx:201`) y las pantallas que lo muestran ponen «g» sin mirar la unidad (`ADV\nutrition\resumen.tsx:184-185`).

4. **El minigráfico no puede tocar `lienzo.tsx` ni `analizar.tsx`.** `resumen.tsx` se importa de forma estática (`ADV\workspace.tsx:46`; `ADV\page.tsx:5`), así que todo lo que importe entra en la carga inicial de la ficha. `lienzo.tsx` importa recharts (`SEG\lienzo.tsx:28`) y `analizar.tsx` importa valores de `lienzo.tsx` (`SEG\analizar.tsx:74`). Lo que el minigráfico necesita vive justo ahí: `mediodia`, `fechaDeX` y `xDe` (`SEG\lienzo.tsx:36-48`), `diasSinRegistros` y `diaAnterior` (`SEG\analizar.tsx:1534-1545`), `ICONO_DE_CLASE` (`:970`). Hay que mudarlos antes a un módulo sin la biblioteca. `SEG\marca.tsx` (`Punto`, `ESTILOS`) ya está aparte para eso (`:4-6`).
   - **Punto de partida comprobable:** en la compilación que hay en `REPO\apps\web\out` (del 10/10, 19:38), `out\pro\advisees.html` carga 12 archivos de JavaScript y **ninguno** contiene «recharts»; la biblioteca está sola en `_next\static\chunks\6974.*.js` (326 KB). Después de cada compilación, esa cuenta tiene que seguir en cero.
   - **No hacen falta lecturas nuevas para dibujar:** cada indicador ya trae sus puntos, sus huecos y sus tramos en la misma lectura con que se resume (`SEG\series.ts:34-38, 113-123`; `SEG\resumen.tsx:612`).

5. **El tercer indicador de la maqueta contradice tres reglas de BE.**
   - **El valor:** «62,5 kg · Última sesión». La carga se resume con la **mediana** de las sesiones (`DOM\metricas-del-analisis.ts:185`; `DOM\series-del-analisis.ts:356-358`), la misma regla de «Comparar dos períodos» y de las etapas. Con los datos de la propia maqueta (`MQ\plano.js:115`) la mediana es 60 kg.
   - **«La línea se corta donde cambió el plan»:** en BE la línea de lo registrado se corta solo en una sesión sin dato de esa serie (`DOM\comparacion-de-entrenamiento.ts:563-565, 605`; el motivo que escribe la serie es «Una sesión sin dato de esta serie corta la línea.», `DOM\entrenamiento-del-analisis.ts:256`).
   - **La métrica:** por defecto hoy va «Series registradas» del ejercicio más registrado (`SEG\resumen.tsx:568-569`) y el editor no ofrece la carga (`:724`). El contrato sí la admite (`DOM\contratos-analisis.ts:572-576`).

6. **La clase del dato existe solo en Antropometría.** `dataClass` es `null` en comidas y sesiones (`DOM\contratos-analisis.ts:142-147`; `DOM\nutricion-del-analisis.ts:165`; `DOM\entrenamiento-del-analisis.ts:153, 224`). Las etiquetas «Calculado» de calorías y proteínas y «Reportado» de la carga son C-09, fuera de alcance (`WP` §6). «Medido» del peso sí llega.

7. **Tres trampas de los recorridos** (el detalle, en §7):
   - **Negativas que pasarían sin proteger nada** si cambia la clase y no la comprobación: `R:959-960` (lee `.indicador`; con una lista vacía, «nada del anterior» da verdadero), `RC:643-644`, `RC:773` y `RC:1484`.
   - **Una pérdida silenciosa:** `RC:476` busca el enlace «Preparar la revisión de Nutrición» en `.acciones-del-resumen a`; si no lo encuentra, la vista `revision-nutricion` sale de la lista (`RC:478`) y **seis** comprobaciones CP-27 dejan de correr sin fallar.
   - **Las dos funciones `captura`** (`R:541-553`; `RC:315-320`) cuentan `figure.grafico__figura` y esperan en cada una una superficie de recharts con curvas: si el minigráfico usara esa clase, cada captura del Resumen esperaría cinco segundos y CP-27 fallaría en las diez del Resumen (`RC:503` pide dibujadas = figuras). El minigráfico necesita clases propias (E-02).

8. **«Qué se registró en el período» dice cinco cosas que no están en ningún otro lugar.** La síntesis repite su contenido principal (reglas `COBERTURA_*`), pero estos datos solo los escribe `DelPeriodo`: anulados fuera de los totales (`SEG\resumen.tsx:813`), rectificados contados una vez (`:814`), comidas diferentes sin cantidades (`:812`), «Sin calendario prescripto, no hay "sesiones esperadas"» (`:826`) y «Cargado otro día» (`:837-845`). «¿Con qué información cuento…?» dice solo el tercero (`SEG\informacion.tsx:62-63`). Antes de mudar la sección hay que ubicarlos (§4.1).

9. **La próxima revisión hoy está siempre a la vista; en la maqueta, solo si es un pendiente.** La regla `PROXIMA_REVISION` aparece cuando faltan siete días o menos, o ya pasó (`DOM\sintesis-del-resumen.ts:138, 176-190`). La tabla de hoy dice siempre «Próxima acordada: 13 oct 2026» o «sin fecha acordada» (`SEG\resumen.tsx:324`). El botón lleno (C-26) se decide con esa fecha: si la fecha no se ve, el botón lleno no se explica.

10. **El período por defecto es de 90 días** (`SEG\estado.ts:39`) y se puede pedir un año; la maqueta dibuja 42. En un minigráfico de unos 235 px de dibujo, 90 días son 2,6 px por día y un año, 0,6. Los puntos de 2,6 px de radio de la maqueta se pisan. La regla de Analizar vale también acá: no se quita ningún punto, se achica la marca (`SEG\lienzo.tsx:281-300`).

11. **«Actualizar» no vuelve a leer todo lo que el Resumen muestra** (leído en el código; no lo comprobé en pantalla). `consultar` vuelve a pedir el panel y los vínculos (`ADV\workspace.tsx:83-111`). Por efecto del desmontaje se repiten los indicadores (`SEG\resumen.tsx:86, 578-586`) y lo nuevo desde la revisión (su clave pasa por `null`, `:131`). **No** se repiten `useDisponibles` (`SEG\series.ts:233-273`: depende de `versionDeAcceso`, que solo sube en la relectura silenciosa, `ADV\workspace.tsx:104`) ni la lectura del período (`SEG\resumen.tsx:79-81`). Hoy lo disimula la nota «datos consultados a las…» (`:439-442`), que la maqueta quita. Hallazgo fuera de esta parte (es del marco), severidad media: §8, DEC-8.

12. **El orden del documento cambia entre la pantalla 01 y la 14.** En la 01: áreas, preguntas, indicadores (`MQ\partes\01-cuerpo.html:4, 51, 60`). En la 14: el área, los indicadores y después las preguntas (`MQ\partes\14-cuerpo.html:14, 30, 51`). Como el orden del documento tiene que ser el que se ve, hay que dibujar en otro orden según el caso, nunca reordenar con CSS.

13. **Nombres de clase.** Están tomados, con otro uso: `.contexto` (`CSS:1005`), `.tarjeta` (`:1436`, la portada), `.preguntas` (`:3610`), `.indicadores` e `.indicador` (`:3795-3820`), `.cobertura` (`:3826-3856`). Están libres: `.areas`, `.area`, `.hechos`, `.corte`, `.cifra`, `.rejilla`, `.valor`. Ya existen y sirven tal cual: `.etiqueta-de-dato` (`:3398-3409`), `.muestra-de-hueco` (`:3748-3758`), `.estado-de-grafico` (`:4556-4595`), `.tarjeta-de-entrada` (`:4284-4291`) como modelo de tarjeta. **Código huérfano:** `ADV\tarjetas-de-dominio.tsx` (las tarjetas de antes de #153) no lo importa nadie y su CSS sigue en `CSS:1328-1357`: no reusar esa clase.

14. **`WP` §4 llega hasta E-40 en el árbol que leí.** E-41 a E-48 no están escritas ahí. Lo que sé de ellas sale de los recorridos: E-41 y E-42 (la entrada de Analizar, `R:1674-1746`), E-45 y E-46 (el estado de cada métrica en su lugar, `R:1775-1836`) y E-47 (la ayuda de la vista, `R:1866-1876`). De E-43, E-44 y E-48 no encontré nada.

15. **`MQ\partes\01-resumen.md` es de la versión 1** («Energía registrada», «Una sesión por semana», el objetivo sin macros). Contradice a `01-cuerpo.html`: no usarlo.

## 2. Región por región de la maqueta 01 (y la 14)

Lo que sigue es lo que dibuja la maqueta, con sus textos exactos, contra lo que hay. Cuando un texto de la maqueta choca con el punto 1.1, la columna «Qué cambia» dice cuál va.

### 2.0 Marco y esqueleto

| Región | Maqueta | Hoy | Qué cambia |
|---|---|---|---|
| Marco, junto al período | Enlace «Cómo se lee esta vista» | El botón existe y aparece solo si la vista tiene ayuda (`SEG\como-se-lee.tsx:77-79, 89`; `ADV\workspace.tsx:234`). El Resumen no tiene (`R:1864-1868` lo comprueba) | Sumar la ayuda del Resumen: §5, paso 10 |
| Cuerpo | Tres bloques: `section.areas` (tres tarjetas), `section.preguntas`, `section.indicadores` | Un fragmento con cinco bloques hermanos (`SEG\resumen.tsx:90-112`), hijos directos de `.ficha__cuerpo.secciones` | Un contenedor propio, con su separación |
| Títulos | `h2` por área y en «Indicadores»; `h3` en «Empezar por una pregunta» y en cada indicador | `h2`: «Objetivo y planificación», «Para tu próxima revisión», «Acciones», «Indicadores», «Qué se registró en el período», «Lo último que pasó» (`:182, 431, 523, 617, 801, 849`) | Los `h2` pasan a ser las áreas e «Indicadores». Sugiero `h2` también para las preguntas: como `h3` quedaría colgado de «Antropometría» |

### 2.1 Tarjeta de área: cabecera y contexto

| Región | Maqueta (textos exactos) | Hoy | Qué cambia |
|---|---|---|---|
| Cabecera | Ícono del área (24), `h2` «Nutrición», enlace «Abrir Nutrición» con el ícono `abrir`. Igual en «Entrenamiento» y «Antropometría» | Tabla con una fila por área (`SEG\resumen.tsx:186-245`). Solo Antropometría tiene «Abrir Antropometría» (`:237`) | Enlace nuevo en Nutrición y Entrenamiento: a la pestaña del área con `volver` (`:172-173`). Su vista por defecto es «Resumen» (`ADV\nutrition\nutricion.tsx:79`; `ADV\training\entrenamiento.tsx:77`) |
| Objetivo de Nutrición | «Objetivo» · «estimado, por día · desde el 7 sept». Debajo, la tira de dos por dos: «Calorías **2.250 kcal**», «Carbohidratos **255 g**», «Grasas **70 g**», «Proteínas **150 g**», cada uno con su ícono | «1.950 kcal por día (requerimiento energético estimado)» y «Desde el 5 sept 2026 · Lic. Sofía Paz (sintética)» (`:203, 285`) | Tira nueva (C-31), con el orden de C-30. Las calorías salen del panel; los macros, de API-NUT-06 (punto 1.3). El autor se muda (`CRIT` §3). Sobre «estimado»: §8, DEC-9 |
| Objetivo de Entrenamiento | «Objetivo» · «Ganar fuerza en press y sentadilla sin perder técnica» · «desde el 17 ago» | El enunciado, o «Objetivo sin enunciado» (`:214`), con fecha y autor | Igual, sin el autor. Un enunciado largo ocupa varios renglones: §8, DEC-11 |
| Plan | «Plan» · «Versión 2» · «desde el 7 sept · antes, versión 1». En la 14: «Versión 1» · «desde el 20 sept · es la primera» | «Versión 2, desde el 5 sept 2026 · Ver la planificación», y «Antes, en el período: v1 (del 19 jul 2026 al 4 sept 2026)» (`:296-302`). Además: «Sin plan vigente hoy» (`:300`), «Ninguna versión activada toca el período.» (`:303`), «Borrador del…: todavía no rige · Ir al borrador» (`:304-308`) | El número sale de las vigencias de API-PRJ-01 (`:144-147`). «Antes, versión 1» pierde las fechas: propongo que la fila «Plan» abra la planificación, donde están. «Es la primera» se deduce de la etiqueta `v1` (`DOM\contratos-analisis.ts:197-198`) **[supongo]**. El borrador queda como pendiente (2.2) |
| Tomas (Antropometría) | «Tomas» · «5 en el período» · «la última, el 24 sept · medida» | «Última toma: 9 oct 2026, 08:00 · {autor} · Ver la toma · 8 tomas en el período · Abrir Antropometría» (`:226-238`) | «· medida» **no llega** (§3). La fila abre la toma (`PanelDeRegistro`, `:227, 110`) |
| Revisiones (Antropometría) | «Revisiones» · «No tiene revisiones en BE» | El mismo texto (`:241`) | Igual |

### 2.2 El corte y las filas

| Región | Maqueta | Hoy | Qué cambia |
|---|---|---|---|
| Corte | «Desde tu revisión del 10 sept» «· ya aplicada»; «Desde tu revisión del 11 sept»; «En el período elegido»; en la 14, «En el período elegido» «· todavía no registraste una revisión» | El alcance va en cada observación: «**Nutrición** · Desde la revisión del 20 sept 2026» (`:484-486`; `textoDelAlcance`). La última revisión, en la tabla: «Última: … · {autor} · aplicada» o «**registrada, sin aplicar**» (`:313-319`); sin revisiones, «Sin revisiones registradas: lo nuevo se mira en el período elegido.» (`:322`) | Una línea por tarjeta, con el texto del dominio (punto 1.1). «Ya aplicada» sale de `lastReview.application` (`DOM\contratos-vinculo.ts:290-295`). Cada fila conserva su propio alcance (hay filas de «Hoy»): §6 |
| Pendientes (negrita, con ícono) | «Próxima revisión: 30 sept» «en 2 días» (`reloj`); «Esa revisión está registrada, sin aplicar» (`revision`); «Hay un plan en borrador: todavía no rige» (`borrador`); «El peso cambió de protocolo el 9 sept» (`protocolo`) | Observaciones de prioridad 1 y 2 (`DOM\sintesis-del-resumen.ts:164-230, 314-323`), con borde más oscuro en la 1 (`CSS:4187-4189`) | Textos del dominio. También son de prioridad 2, y la maqueta no los dibuja: «El plan vigente se activó el…» y «El objetivo vigente rige desde el…» (`:381-384`) |
| Conteos (cifra y texto) | «44 comidas nuevas», «1 comida de antes, cargada después», «1 registro corregido»; «4 sesiones nuevas»; «3 tomas con el protocolo nuevo»; en la 14, «9 comidas registradas», «2 comidas sin confirmar las cantidades» | Una observación por regla, con su frase (`:389-419`) | Punto 1.1. «3 tomas con el protocolo nuevo» no es una observación: está en la cobertura del indicador del peso |
| Flecha | Cada fila es un renglón entero que abre algo | Un enlace en el pie de cada observación (`SEG\resumen.tsx:404-420, 490-500`), con el área oculta en el nombre (`:493`) | La fila entera es el enlace. Los destinos, en §6. `OBJETIVO_NUEVO_DESPUES_DEL_CORTE` no tiene acción (`DOM\sintesis-del-resumen.ts:223`): esa fila no lleva flecha |
| «Ver todas» | No está | Cuatro a la vista y «Ver todas (9)» (`SEG\resumen.tsx:65, 425, 432-436`) | Por tarjeta: §8, DEC-4 |
| Una parte que falló | No está dibujada en el Resumen (el bloque es el de las pantallas 15 y 19) | «{Área}: No pudimos completar esta parte (…)» antes de la lista, con un «Reintentar» (`:448-459`) | El bloque de estado, primero en la tarjeta de su área |

### 2.3 La acción del área

| Región | Maqueta | Hoy | Qué cambia |
|---|---|---|---|
| Nutrición y Entrenamiento | Botón «Preparar la revisión de Nutrición» (lleno) y «Preparar la revisión de Entrenamiento» (contorno), con el ícono `revision` | En «Acciones», los dos con contorno y una nota debajo: «Abre el formulario con el período desde la última revisión. No registra nada hasta que lo confirmes.» (`SEG\resumen.tsx:525-532`). Solo si el área tiene plan vigente (`:514-515`) | Al pie de su tarjeta. La nota va a la ayuda de la vista. El destino ya dice «Preparado por BE para esta revisión» (`ADV\retorno-y-preparacion.tsx:60-71`) |
| Antropometría | Botón «Preparar una toma» (contorno, ícono `mas`) | No existe en el Resumen | Enlace nuevo a `…/anthropometry?id=…&vista=preparacion` con `volver` (`ADV\anthropometry\antropometria.tsx:30-36, 79`). Abrir esa vista solo lee (`ADV\anthropometry\preparacion.tsx:112-132`); las escrituras están en «Guardar» y «Registrar» (`:310-311, 350`) |
| Un solo botón lleno | El del área con la próxima revisión acordada más cercana (C-26) | No existe | Con `activePlan.nextReviewAt` de cada área (`DOM\contratos-vinculo.ts:283`). Sin ninguna fecha: §8, DEC-6 |
| «Analizar un cambio» | No está | Botón con la nota «Desde que empezó un plan, con sus etapas e hitos.» (`:534-537`) | Es la primera pregunta con otro nombre: sale el botón y queda la pregunta (2.4) |

### 2.4 Las preguntas

| Región | Maqueta | Hoy | Qué cambia |
|---|---|---|---|
| Franja | «Empezar por una pregunta» y cuatro botones en un renglón: «¿Qué cambió desde que empezó este plan?», «¿Lo registrado coincide con lo indicado?», «¿Cómo viene progresando un ejercicio?», «¿Con qué información cuento para revisar el objetivo?»; al final, enlace «Más preguntas» | Tres enlaces en lista y «Más preguntas o análisis personalizado» (`SEG\resumen.tsx:542-554`); la primera pregunta es el botón «Analizar un cambio» | Las cuatro principales de `PREGUNTAS_PROFESIONALES` (`DOM\preguntas-profesionales.ts:43-71`), con su texto («este ejercicio»). El destino de cada una no cambia (`:519-520`); «Más preguntas» va a la entrada de Analizar (`:552`) |
| En la 14 | Tres preguntas (no está la del ejercicio) y no hay «Más preguntas» | Hoy no se filtra por área | §8, DEC-10 |

### 2.5 Los indicadores

| Región | Maqueta | Hoy | Qué cambia |
|---|---|---|---|
| Encabezado | `h2` «Indicadores» · «Del 17 ago al 27 sept · describen lo registrado, sin calificar» · enlace «Elegir indicadores» | «Del … al …. Los elegiste vos.» o «Los de por defecto: podés elegir otros.» «Describen lo registrado, sin calificar.» (`SEG\resumen.tsx:622-624`); botón con `aria-expanded` (`:618-620`) | Fechas cortas (`diaYMesCivil`, `REPO\apps\web\src\lib\formato.ts:30`). «Los elegiste vos / los de por defecto» pasa al editor. El botón sigue siendo un botón con su estado, con piel de enlace |
| Nombre | Ícono y `h3`: «Calorías registradas», «Proteínas registradas», «Press de banca · serie 1», «Peso corporal» | `nombreDeLaReferencia` (`SEG\selector.tsx:27-32`): «Calorías», «Registros», «Peso», «Series registradas · Peso muerto» | Para Nutrición, el nombre largo de la definición (`DOM\metricas-del-analisis.ts:103-107`), como en los gráficos de Analizar. Los íconos están en `SEG\entrada.tsx:29-48`, privados: se mudan |
| Valor | «2.179 kcal por día», «138 g por día», «62,5 kg», «77,9 kg»: el número grande y la unidad chica | `valorParaMostrar` devuelve una sola cadena (`SEG\valores.ts:7-18`; `SEG\resumen.tsx:678, 697`) | Partir número y unidad, como la lectura de Analizar (`SEG\analizar.tsx:1032-1055`). «por día» es nuevo y vale para la media diaria |
| Clase del dato | Etiqueta «Calculado», «Reportado» o «Medido» | No se muestra en el indicador | Solo donde llega: la toma que da el valor (punto 1.6). `.etiqueta-de-dato` y `claseEnPalabras` (`DOM\antropometria-del-analisis.ts:60-63`) |
| Regla | «Media de los 36 días con valor»; «Última sesión, 24 sept · 8 rep · RIR 2»; «Última toma, 24 sept» | «Media ·», «Mediana ·» o «Total ·» delante de la cobertura (`SEG\resumen.tsx:693-694`); en el peso, «Última toma: 9 oct 2026» (`:679`) | La regla es texto de la pantalla; puede decirse como en la tabla de comparación («Media de los días con valor», `SEG\analizar.tsx:1477-1482`). En la carga, la regla es la mediana (punto 1.5) |
| Minigráfico | Puntos y línea de un solo color, dos marcas en el eje vertical, sin fechas | No existe | 2.6 |
| Cobertura | «42 días: 36 con valor · ▮ 6 sin registros» y «De los 36, 3 son subtotales» | Las partes del dominio en una línea (`:694`) | Las mismas partes, en su orden, con la muestra gris junto a «sin registros» solo si el gráfico sombrea (`SEG\lienzo.tsx:396`) |
| Segunda línea del peso | «La línea se corta donde cambió» | «Primera comparable del período: 81,2 kg el 21 sept 2026 · diferencia −0,7 kg (3 tomas comparables)» o «Una sola observación comparable: no hay con qué comparar.» (`:680-687`) | La maqueta no muestra la diferencia: §4.1. La frase del corte ya la escribe la serie (`DOM\antropometria-del-analisis.ts:137`) |
| Enlace «Analizar» | No está | Uno por indicador (`:644-646`) | Se conserva (GUIA II.5, `GUIA:322-323`): propongo que el nombre del indicador sea el enlace |
| Sin más indicadores (14) | «**Sin más indicadores con datos en este período.** Probá con un período más largo o elegí otros indicadores.» | «Sin indicadores con datos en este período» cuando no hay ninguno (`:651-653`) | Texto nuevo para cuando hay menos de cuatro |
| Editor | No está dibujado | Casillas, «Guardar indicadores», «N de 4», el conflicto (`:703-778`) | Queda como está, a un clic |

### 2.6 El minigráfico (pieza nueva)

Lo que dibuja la maqueta (`MQ\plano.js:161-254`, con los parámetros de `MQ\partes\01-cuerpo.html:102-106` y `14-cuerpo.html:70-72`) y de dónde sale cada cosa:

| Qué dibuja | De dónde sale | Regla que ya existe |
|---|---|---|
| Un punto por observación con valor | `serie.points` con `value !== null` (`DOM\contratos-analisis.ts:123-165`) | `Punto` (`SEG\marca.tsx:32-41`): lleno, hueco, contorno cortado o con un punto adentro |
| Punto hueco | `quality === 'PARTIAL'` o `partialBucket` | `SEG\lienzo.tsx:317` |
| La línea, cortada | Une puntos del mismo `segment`; el día en curso va suelto | `SEG\lienzo.tsx:196-213`; los tramos los arma el dominio (`DOM\nutricion-del-analisis.ts:146-152`) |
| Gris en los días sin registros | `serie.gaps`, solo con grano diario y sin el día en curso | `diasSinRegistros` (`SEG\analizar.tsx:1540-1545`); color `--grafico-hueco` al 20 % (`SEG\lienzo.tsx:439`; `TOK:67, 121`) |
| Dos marcas del eje vertical | Mínimo y máximo de lo dibujado | Letra de 12,5 px como mínimo (`SEG\lienzo.tsx:35`). Cómo se redondean: §9 |
| Línea punteada donde empieza el plan (14) | `primerPlanDelPeriodo` (`DOM\sintesis-del-resumen.ts:267-271`) con las vigencias (`SEG\series.ts:204`) | No existe en Analizar |
| El día con registros y sin cantidades (14): ni punto ni gris | Es un punto con `value: null` (`DOM\nutricion-del-analisis.ts:123-125`), y no está en `gaps` (`:234`) | Sale solo de los datos |
| Un solo color | `ESTILOS[0]` (`SEG\marca.tsx:10`) | Acá el color no distingue nada: cada tarjeta dice su métrica |

Cuidados:
- **Colores:** solo tokens. `REPO\scripts\contraste.test.cjs:344-370` falla con un color literal en cualquier `.css`, `.ts` o `.tsx`.
- **Densidad** (punto 1.10): el radio sale del lugar por día, como en `SEG\lienzo.tsx:294-300`.
- **Accesibilidad:** no es interactivo y no recibe foco. Propongo `role="img"` con el resumen que ya escribe el dominio (`resumenTextual`, `DOM\series-del-analisis.ts:472-475`), o `aria-hidden` si el valor, la regla y la cobertura dicen lo mismo al lado.
- **Clases:** nada de `grafico__figura`, `grafico__lienzo`, `grafico__elegible` ni `recharts-*` (punto 1.7).

### 2.7 La pantalla 14: una sola área

- **Composición:** dos columnas, `448px 1fr` (`MQ\partes\14-cuerpo.html:3`). A la izquierda, la tarjeta. A la derecha: «Indicadores» con dos por fila, la línea «Sin más indicadores…» y las preguntas.
- **Textos de la tarjeta:** «estimado, por día · desde el 12 sept»; «1.900 kcal», «210 g», «60 g», «130 g»; «Versión 1» «desde el 20 sept · es la primera»; «En el período elegido» «· todavía no registraste una revisión»; «Revisión pendiente desde el 12 sept»; «9 comidas registradas»; «2 comidas sin confirmar las cantidades»; botón lleno «Preparar la revisión de Nutrición».
- **Indicadores:** «Calorías registradas» «1.870 kcal por día» «Media de los 5 días con valor»; «42 días: 5 con valor · 1 sin cantidades · ▮ 36 sin registros»; «El plan rige desde el 20 sept». Lo mismo en «Proteínas registradas», con «118 g por día».
- **Hoy:** el área sin acceso no dibuja su fila (`SEG\resumen.tsx:197, 210, 219`) y la síntesis recibe `null` para ella (`:360, 368, 389`). El aviso de vista parcial está en el marco (`ADV\workspace.tsx:189-194`).
- **Qué cambia:** la composición. «El plan rige desde…» hoy es parte de la frase de la cobertura del área (`DOM\sintesis-del-resumen.ts:274, 405`); la maqueta lo lleva además a cada indicador, donde es cierto para una media diaria. `RC:766` lo exige en la observación de cobertura.
- **No está dibujado:** dos áreas (es el asesorado B de `R:955-964`, sin Entrenamiento), ni un área disponible y todavía sin datos (`summary: null`, `SEG\resumen.tsx:269-276`).

### 2.8 En 1280 y en 1024 (reglas de `CRIT` §3, sin dibujar)

| Ancho | Regla | Con qué |
|---|---|---|
| 1440 y 1280 | Tres áreas y cuatro indicadores por fila; en 1280 «se desplaza un poco» | `@media (min-width: 80rem)`, que ya se usa (`CSS:3220`). A 1280 cada tarjeta mide unos 395 px **[estimo]** |
| 1024 | Dos áreas por fila y la tercera debajo; indicadores y preguntas de a dos | `@media (min-width: 64rem)` (`CSS:4165`). Dónde va la tercera tarjeta no está dibujado |
| 768 y 390 | No se rompe: una columna | Lo comprueban PRO-23 (`R:2130-2135`), CP-27 (`RC:503`) y el zoom al 200 % (`RC:1299-1301`) |

## 3. Qué dato llega y qué no

| Lo que pide el diseño | ¿Llega? | Dónde | Qué mostrar |
|---|---|---|---|
| Objetivo: calorías | Sí, en el panel | `DOM\contratos-vinculo.ts:309`; `SEG\resumen.tsx:203` | El número |
| Objetivo: desde cuándo rige | Sí | `effectiveFrom`, `:312` | «desde el 7 sept» |
| Objetivo: carbohidratos, grasas y proteínas | **No en el panel.** Sí en API-NUT-06 | `:307-313`; `API\dashboard\lectura-dashboard.ts:66-73, 145`. Operación: `DOM\cliente-http.ts:715-717`; forma: `DOM\contratos-nutricion.ts:121` | Una lectura más, solo si Nutrición está disponible y hay objetivo. Mientras llega, las calorías. Si falla: «No pudimos cargar los macros del objetivo» y «Reintentar»; nunca un cero. Comparar `versionId` (`DOM\contratos-nutricion.ts:114`) con `objectiveVersionId` del panel: si difieren, no mezclar |
| Un macro en `energy_share` | Puede llegar | `DOM\contratos-nutricion.ts:92` | No ponerle «g». Qué escribir: §9 |
| Objetivo de Entrenamiento | Sí (texto libre; puede venir vacío) | `DOM\contratos-vinculo.ts:324`; `API\dashboard\lectura-dashboard.ts:233-236` | El enunciado, o «Objetivo sin enunciado» (`SEG\resumen.tsx:214`) |
| Plan vigente: desde cuándo | Sí | `activePlan.activatedAt`, `DOM\contratos-vinculo.ts:283` | «desde el 7 sept» |
| Plan vigente: número de versión | No en el panel. Sí en API-PRJ-01 | `planVersions[].label` («v2»), `DOM\contratos-analisis.ts:194-198`; se cruza por `planVersionId` (`SEG\resumen.tsx:144-147`) | Mientras carga o si falla: «Versión vigente» (`:146`) |
| Plan anterior | Solo las versiones que tocan el período | `disponibles.vigencias` (`SEG\series.ts:256-262`); `rigieron` (`SEG\resumen.tsx:153-165`) | «Antes, en el período: v1». Una versión anterior al período no llega: no nombrarla |
| «Es la primera» | Se deduce de la etiqueta `v1` **[supongo]** | `DOM\contratos-analisis.ts:197-198` | Solo si la vigente es `v1` |
| Corte de la revisión | Sí | `lastReview.recordedAt`, `DOM\contratos-vinculo.ts:290-295` | La línea del corte |
| «Ya aplicada» | Sí | `lastReview.application` (`:294`) | Hoy distingue «aplicada» de «aplicada el…» (`SEG\resumen.tsx:314-315`) |
| Próxima revisión | Sí (una fecha, o `null`) | `nextReviewAt`, `:283`; es la expectativa vigente del proceso (`API\dashboard\lectura-dashboard.ts:137-138`) | Como pendiente, la frase del dominio. Fuera de los siete días: punto 1.9 |
| «Revisión pendiente desde…» (14) | **No.** `pendingReview.since` está en el contexto de revisión, una lectura pesada | `DOM\contratos-nutricion.ts:565`; `DOM\cliente-http.ts:869-871` | La regla `PROXIMA_REVISION` vencida, que sale del panel |
| Revisión sin aplicar, borrador | Sí | `:294, 303`; reglas en `DOM\sintesis-del-resumen.ts:165-202` | Filas |
| Lo nuevo desde el corte (tres cuentas) | Sí | API-DSH-04 con `since` (`SEG\resumen.tsx:130-139`); `sinceCounts`, `DOM\contratos-analisis.ts:445-449, 464` | Filas |
| Comidas y sesiones del período | Sí | Nutrición: `coverage` de API-PRJ-01 (`DOM\contratos-analisis.ts:240-252`; `SEG\series.ts:267`). Entrenamiento: `periodCounts` (`:424-429`; `SEG\resumen.tsx:353-354, 375-385`) | Filas |
| «2 comidas sin confirmar las cantidades» | Sí, por dos caminos | `recordsWithoutQuantities` (`:245`) o `byQuality` con `QUANTITIES_UNCONFIRMED` (`:371-380, 426`) | No son lo mismo (el primero suma las comidas diferentes sin cantidades): usar el texto del dominio |
| Tomas del período y la última | Sí | `DOM\contratos-vinculo.ts:333-337` | «5 en el período · la última, el 24 sept» |
| «· medida» de la última toma | **No** | El panel trae identificador, fechas y autor (`:334`); el origen es de cada medición (`DOM\contratos-antropometria.ts:117`) | No escribirlo: se ve al abrir la toma (`SEG\registro-original.tsx:178-187`) |
| Qué medida cambió de protocolo | Sí (nombre y cantidad de grupos) | `comparabilityGroups`, `DOM\contratos-analisis.ts:295-305`; `SEG\resumen.tsx:392-396` | La frase del dominio |
| **Cuándo** cambió («el 9 sept») | **No en la síntesis.** Solo en una serie leída | Primer punto del tramo con `breakReason` (`DOM\antropometria-del-analisis.ts:84-88`) | No escribir la fecha en la fila; se ve en Analizar («Cambio de protocolo · 9 sept», E-30) |
| «3 tomas con el protocolo nuevo» | Solo si esa medida es un indicador | `resumirPeriodo` (`DOM\series-del-analisis.ts:361-366`) | En el indicador: «5 tomas: 3 del último tramo comparable» |
| Valor y regla de cada indicador | Sí | `resumirPeriodo` (`:332-368`); `SEG\resumen.tsx:671` | Igual que hoy |
| Clase del dato del indicador | Solo en Antropometría | Punto 1.6; etiquetas en `DOM\copy-antropometria.ts:271-275` | Sin etiqueta en Nutrición ni en Entrenamiento |
| «8 rep · RIR 2» de la última sesión | Sí, como líneas de detalle del punto, si la métrica es la carga | «Repeticiones de la serie» y «RIR» (`DOM\entrenamiento-del-analisis.ts:229-236`) | Se arma con esas líneas. Con «Series registradas» no están (`:158-163`) |
| Serie para el minigráfico | Sí | Punto 1.4 | — |
| Cobertura del indicador | Sí | `partesDeLaCobertura` (`DOM\series-del-analisis.ts:411-435`) | Las partes, sin reescribir |
| Hora de los datos | Dos distintas: la del panel y la de las proyecciones | `consultadoEn` (`ADV\workspace.tsx:95, 175`); `leidoEl` (`SEG\series.ts:263`) | Una sola, la del marco: punto 1.11 |

## 4. Lo que hoy existe y la maqueta no muestra, y al revés

### 4.1 Hoy existe y la maqueta no lo muestra (hay que decidir dónde queda)

| # | Qué | Dónde está hoy | Propuesta |
|---|---|---|---|
| 1 | La cobertura del área cuando hay revisión: días con registro, registros con y sin cantidades; sesiones con cambios, no realizadas y resumidas | Observaciones `COBERTURA_*` (`DOM\sintesis-del-resumen.ts:403-419`) y «Qué se registró en el período» (`SEG\resumen.tsx:806-836`) | En su tarjeta, a un clic. Sin revisión va a la vista, como en la 14. §8, DEC-4 |
| 2 | Anulados, rectificados, comidas diferentes, «sin calendario prescripto», «cargado otro día» | Solo en `SEG\resumen.tsx:812-814, 826, 837-845` | Los cuatro primeros, junto con el 1, al desplegar su tarjeta. «Cargado otro día» es un total de todas las áreas (`recordedLate`, `DOM\contratos-analisis.ts:427`): no es de ninguna tarjeta. Queda a un clic en la Línea de tiempo, que tiene ese filtro (`tardias=1`, `SEG\estado.ts:117`); si se quiere el número en el Resumen, hay que decidir dónde |
| 3 | «Cobertura del registro, no adherencia: qué hay y qué falta, sin calificar.» | `:802` | A «Cómo se lee esta vista» |
| 4 | «Lo último que pasó» y «Ver todo en la línea de tiempo» | `:848-866` | Se muda (`CRIT` §3): es la pestaña. La lectura sigue haciendo falta por sus conteos (`:79-81`); alcanza con `limit: '1'`, como `SEG\informacion.tsx:24` |
| 5 | «Sale de…» en cada observación | `:489`; `FUENTE_DE_LA_REGLA` (`DOM\sintesis-del-resumen.ts:426-438`) | A la ayuda, una vez por regla (C-05). Cambia `GUIA:298-300` |
| 6 | El autor del objetivo, de la revisión y de la toma | `:285, 313, 226` | Se muda (`CRIT` §3). La toma lo dice al abrirla (`SEG\registro-original.tsx:164`) |
| 7 | «Ver la planificación», «Ver revisiones», «Ir al borrador» | `:297, 319, 306` | La fila «Plan» abre el plan; la línea del corte, las revisiones; el borrador ya es un pendiente con ese destino (`:409-410`) |
| 8 | «Próxima acordada: {fecha}» o «sin fecha acordada», siempre | `:324` | Mantenerla a la vista (punto 1.9): §8, DEC-6 |
| 9 | Las fechas de la versión anterior; «unas horas del…»; «Sin plan vigente hoy»; «Ninguna versión activada toca el período.» | `:153-165, 300-303` | Los dos últimos son estados de la fila «Plan»: se conservan. Las fechas, a un clic (fila «Plan») |
| 10 | «Ver todas (N)» | `:432-436` | Por tarjeta: §8, DEC-4 |
| 11 | La ayuda «Cómo se arma esta lista» (dos párrafos) | `:467-476` | A la ayuda de la vista, entera |
| 12 | «(datos consultados a las …)» | `:439-442` | Punto 1.11 |
| 13 | La nota bajo «Preparar la revisión…» | `:530` | A la ayuda; el destino ya lo dice |
| 14 | «Analizar» en cada indicador | `:644-646` | Se conserva (2.5) |
| 15 | «Primera comparable del período… · diferencia…» y «Una sola observación comparable…» | `:680-687`; lo lee `R:577` | Se conserva, en la segunda línea del indicador |
| 16 | «Los elegiste vos» o «Los de por defecto: podés elegir otros» | `:623` | Al editor, cuando se abre |
| 17 | «No pudimos leer los indicadores que elegiste: se muestran los de por defecto. Tu elección sigue guardada.» | `:591` | Se conserva, bajo el encabezado |
| 18 | Los estados de cada indicador: cargando, sin acceso, sin datos, falla con «Reintentar», «Solo hay datos de hoy…» | `:632-642, 672` | Se conservan, con el bloque de estado. PRO-02 pide «Sin datos» o «No disponible con tu acceso» cuando corresponde (`ACE-PRO:52`) |
| 19 | «Ninguna área disponible con tu acceso actual» | `:183` | Se conserva |

### 4.2 La maqueta lo muestra y hoy no existe

**Es solo presentación** (el dato llega o sale de una lectura que ya existe):
- una tarjeta por área, con su ícono y «Abrir {área}»;
- la tira del objetivo (con una lectura más);
- la línea del corte y «ya aplicada»;
- las filas que abren su evidencia, y la cifra grande (con las partes del dominio);
- «Preparar una toma»;
- el botón lleno;
- las cuatro preguntas en un renglón;
- el minigráfico, la muestra gris y la línea del inicio del plan;
- la etiqueta de clase en un indicador de Antropometría;
- la composición de una sola área y «Sin más indicadores…»;
- la ayuda de la vista.

**Pide un dato que no llega o una regla que no existe:**
- «Calculado» y «Reportado» en comidas y series (C-09);
- «· medida» de la última toma;
- la fecha del cambio de protocolo en la fila;
- «Revisión pendiente desde…»;
- «Última sesión» como valor del indicador de carga;
- «La línea se corta donde cambió el plan»;
- «comidas nuevas» y «comida de antes» como palabras.

**Sin dibujar:** dos áreas; un área sin datos; «Elegir indicadores» abierto; cualquier falla dentro de una tarjeta; el Resumen a 1280 y a 1024; la ayuda.

## 5. Pasos, en un orden que deja la vista funcionando

En cada paso se actualizan sus comprobaciones de `R` y `RC` (E-06) y se anota la equivalencia en `ACE`. «Mirar» quiere decir `ver.mjs` con la ruta de la ficha a 1440, 1280 y 1024, para el asesorado A (`{a}`), el B (`{aseBId}`) y el E (`{escenarioE.aseEId}`); admite `#falla:` y `#clic:` (`…\herramientas\ver.mjs:3-12`).

| # | Paso | Archivos | Riesgo | Cómo comprobarlo |
|---|---|---|---|---|
| 0 | **Medir el «antes»** con el marco de hoy (los 2.313 px de `WP` §1 son anteriores a la Parte 1) | — | Ninguno | `ver.mjs` y `paginas.mjs`: alto del Resumen en A, B y E |
| 1 | **Mudanzas sin cambio a la vista.** (a) La geometría y los íconos compartidos, a módulos sin recharts (punto 1.4; `SEG\entrada.tsx:29-48`). (b) El bloque de estado sale de `EstadoDeUnaSerie` (`SEG\analizar.tsx:905-938`) a un componente común; Analizar conserva sus clases. (c) Partir `resumen.tsx` (870 líneas, 12 componentes) en archivos, sin tocar lo que dibuja | `SEG\lienzo.tsx`, `analizar.tsx`, `entrada.tsx`, `resumen.tsx`; `REPO\apps\web\src\components\estados.tsx`; módulos nuevos | Medio: Analizar depende de esas funciones; `RC:1255` y `R:1751-1757` buscan `.estado-de-grafico` | Typecheck; `recorrido.mjs analizar` igual que antes; la cuenta del punto 1.4 en cero |
| 2 | **El minigráfico,** con su geometría en un módulo puro y una prueba en `REPO\scripts` (como `retorno-a-la-ficha.test.mjs`, que importa TypeScript del website). Se monta en las tarjetas `.indicador` de hoy: primer cambio visible, chico | `SEG\minigrafico.tsx` y su geometría; `SEG\resumen.tsx`; `CSS` | Medio: densidad con 90 días y un año; huecos y tramos mal unidos | Comprobación nueva contra la API, a mano: puntos, tramos y zonas grises; ninguna superficie de recharts; `contraste.test.cjs`; mirar los dos temas con `p=7`, `90` y `365` |
| 3 | **Indicadores recompuestos:** nombre con ícono, valor grande, clase si llega, regla, minigráfico, cobertura, segunda línea; rejilla de cuatro, dos o uno; estados con el bloque; el enlace a Analizar; los de por defecto en el orden de las áreas (hoy el peso va antes que el ejercicio, `SEG\resumen.tsx:565-569`). Decisión DEC-2 | Archivo de indicadores; `CSS`; `…\herramientas\tiempos.mjs:94-99` si cambian los de por defecto | Alto: seis comprobaciones leen `.indicador` y sus textos | `R:572-577` (PRO-02, PRO-11, PRO-15), `R:959-960` (PRO-21) y `RC:1262-1275` (R6), adaptadas; axe |
| 4 | **Tarjetas de área, I: cabecera y contexto.** Reemplazan la tabla «Objetivo y planificación». Incluye la tira, con la lectura de API-NUT-06. La síntesis y las acciones siguen debajo, como hoy | Archivo de la tarjeta; `SEG\tira-del-objetivo.tsx` (la van a usar las pantallas 16 y 17); `CSS` | Medio: `RC:519`, `RC:761-773` y `RC:1412-1417` leen `.tabla-de-planificacion`; una lectura más para el presupuesto de 2,5 s | Comprobación nueva: los cuatro números contra `objectives/effective`, en el orden de C-30; `#falla:objectives/effective` deja las calorías; PRO-24 y CP-29 |
| 5 | **Tarjetas de área, II: el corte y las filas.** La síntesis se reparte por área; sale «Para tu próxima revisión». Si se decide DEC-1, antes va la función de partes en el dominio, con su prueba | Archivo de la tarjeta; `DOM\sintesis-del-resumen.ts` y su prueba (si DEC-1); `CSS` | **Alto:** es donde están CP-01 a CP-06 y R1 | `npm test -w @be/domain`; `recorrido-comprension.mjs funcional` (R1, escenario E, R6) y `mirar`; `#falla:since=` |
| 6 | **Tarjetas de área, III: la acción al pie** y el botón lleno; «Preparar una toma»; sale «Acciones» | Archivo de la tarjeta; `CSS` | Medio: cuatro clics de `RC` usan `.acciones-del-resumen a` (`:423, 476, 878, 1357`) | R3, CP-19 y CP-20; la cuenta de `capturas` no baja de 79 (punto 1.7) |
| 7 | **La franja de preguntas** | Archivo de la vista; `CSS` | Bajo: `RC:706` y `RC:1291` | CP-07; CP-28 |
| 8 | **Lo que se muda:** «Qué se registró en el período» (con los cinco datos ubicados, §4.1) y «Lo último que pasó» | `SEG\resumen.tsx`; `CSS` (reglas que quedan sin uso: `:3795-3856, 4081-4258`) | Medio: `R:578-580` | PRO-12 con el texto nuevo; equivalencia de «seis hechos» anotada |
| 9 | **Composición y anchos:** una, dos y tres áreas; 1440, 1280 y 1024; 768 y 390. La medición de la primera pantalla, con su prueba de la prueba | `CSS`; el orden de dibujo (punto 1.12) | Medio | Comprobación nueva al modo de E-24 (`R:1116-1148`); PRO-23 (`R:2130-2135`), CP-27 (`RC:503`), el zoom (`RC:1301`), E-17 (`R:1930-1947`) |
| 10 | **«Cómo se lee esta vista» del Resumen,** con lo de §4.1 (filas 3, 5, 11 y 13) y el minigráfico. La guía (`GUIA:227-234, 298-300, 322-328, 344-347, 419-420` y V.3). `ACE`, `WP` §4 y §8. La prueba de palabras (E-05: `REPO\scripts\copy-pantallas.test.cjs:34-64` todavía no recorre `SEG`) | `SEG\como-se-lee.tsx:77-79`; documentos | Bajo; `R:1864-1868` afirma hoy que el Resumen no tiene la ayuda | E-47 con el Resumen; axe con la ayuda abierta; los siete recorridos sobre una base nueva |

## 6. Comportamiento que hay que conservar

D-01, D-19, D-22 y D-25 son decisiones del paquete anterior (`REPO\docs\paquetes\WP-DASHBOARD-COMPRENSION.md:51, 69, 72, 75`). Las que quedan por tomar en esta parte están en §8 y se llaman DEC-1 a DEC-11.

**Estados de la vista**
- **Panel cargando o con falla:** «Cargando…» y «No pudimos leer el resumen por área. No es una ausencia de datos: reintentá.» (`SEG\resumen.tsx:86-88`). El estado de falla no guarda el motivo (`SEG\contexto.tsx:21`; `ADV\workspace.tsx:96-101`): para decirlo como la pantalla 19 hay que sumarlo.
- **Sin acceso a la ficha:** lo resuelve el marco, con el texto neutral (`ADV\workspace.tsx:201-215`). No se toca.
- **Un área sin acceso no aporta nada:** ni tarjeta, ni filas, ni conteos (`SEG\resumen.tsx:197-219, 360-398`; CP-08). El aviso es uno solo, en el marco.
- **Un área disponible y sin datos** (`summary: null`): hoy «Sin datos registrados todavía.» (`:265-276`). En la tarjeta: lo mismo y, si existe, la acción («Preparar una toma»).
- **Una parte que falló** va primero y dice cuál (D-25; `:448-459`). Las cuatro partes: lo nuevo desde la revisión (`:137`), la cobertura de Nutrición (`:364`), la de Entrenamiento (`:373-374`) y la comparabilidad (`:392-393`).
- **Un solo «Reintentar» trae todo lo que falló** (`:98-103`). Con un botón por tarjeta, cada uno llama a lo mismo.
- **Una falla nunca es «sin datos»:** con la lectura de lo nuevo caída no se escribe «No hay registros nuevos» (CP-06; el dominio lo garantiza, `DOM\sintesis-del-resumen.ts:234-236`).
- **Mientras llega la síntesis** hay un «Cargando…» (`:348, 443`). El contexto de la tarjeta sale del panel y puede verse antes.
- **`quieto()`** espera a que no haya ningún `.cargando` (`R:131-142`; `RC:122-133`): un estado de carga que no se va cuelga los recorridos.

**Indicadores**
- Hasta cuatro, por cuenta, para todos los asesorados (`:64, 752`); la elección se lee al montar (`:578-586`).
- Los estados de cada uno, y los de la lista (§4.1, filas 17 y 18).
- **Conflicto al guardar:** se vuelve a leer la guardada y lo marcado queda (D-22; `:743-746`; `RC:1264-1273`).
- Un indicador guardado con un ejercicio de otra persona se nombra «… · ejercicio» (`SEG\selector.tsx:30`) y dice que no hay registros. Es una limitación de hoy.

**Enlaces y retorno**
- Todo lo que sale de la ficha lleva `volver` (D-19; `conRetorno` y `valorDeRetorno`, `SEG\estado.ts:301-307, 334`; `SEG\resumen.tsx:172-173, 403, 513`).
- **Los destinos de cada regla** (`:404-420`): revisiones del área; planificación del área; línea de tiempo con `areas` y `novedades` y los demás filtros en blanco (`:412`); Antropometría; la pregunta de información o la de etapas, con su área; y la toma, que se abre en el panel (`:497-499`).
- **Los parámetros no cambian** (E-03): `novedades`, `areas`, `pregunta`, `area`, `m`, `p`, `volver`, `preparar`.
- **Una pregunta desde el Resumen arranca limpia:** sin `m` ni `f`, y con el área ya elegida si hay una sola con plan (`:517-520`).
- **«Ver la toma»** es un diálogo: Escape lo cierra y el foco vuelve (`SEG\registro-original.tsx:72-87`). Se carga aparte (`SEG\resumen.tsx:62`).

**Reglas de BE**
- **Abrir la ficha no escribe nada** (CP-03, `RC:678-683`). «Preparar…» tampoco.
- **Cada fila conserva su alcance:** «Hoy», «Desde la revisión del…» o «En el período seleccionado» (`DOM\sintesis-del-resumen.ts:81-84`). La línea del corte dice uno; una fila con otro tiene que decirlo (visible o para el lector de pantalla). CP-02 y CP-03 lo miran.
- **Un corte por área** (D-01); Antropometría no tiene revisiones y se dice (`SEG\resumen.tsx:241`).
- **Sin colores de juicio, sin porcentajes, sin barras de avance.** El botón lleno no dice «urgente»: dice cuál es la fecha más cercana que fijó el profesional.
- **El pendiente se reconoce por su ícono y su peso,** no solo por un color (hoy, por el borde, `CSS:4187-4189`).

**Accesibilidad**
- Un `h1` (el del marco, `ADV\workspace.tsx:161`); orden del documento igual al visual (punto 1.12).
- 44 px: `.boton` (`CSS:504-509`); cada fila que se toca, también (`MQ\resumen.css:16`).
- Ningún enlace ni botón sin nombre (`RC:1315-1316`). La fila-enlace tiene que decir a dónde lleva además del hecho; los íconos que acompañan a un texto no se leen (`REPO\apps\web\src\components\icono.tsx:35-36`).
- Foco visible en todo lo que se alcanza con Tab (`RC:1291`).
- Sin doble desplazamiento (`RC:283-291`): una tarjeta con muchas filas se despliega en el lugar, nunca con barra propia.
- Sin desborde a 768, 390, 320 y con el zoom al 200 %.

**Presupuesto**
- El Resumen, con la API en uso, en 2,5 s o menos (`R:692`; `RC:1334`). Hoy son 9 pedidos y 646 ms (`ACE-CP:57`); la tira suma uno. Las lecturas van de a cuatro (`SEG\contexto.tsx:130-144`).
- `tiempos.mjs` imita las lecturas del Resumen (`…\herramientas\tiempos.mjs:84-99`) y ya no incluye las dos de lo nuevo desde la revisión: si cambia lo que se pide, hay que actualizarlo.

## 7. Las comprobaciones de los recorridos que tocan el Resumen

`R` corta el modo entero en la primera excepción (`R:2339-2340`); `RC` aísla por parte (`RC:55-61`).

### 7.1 `recorrido.mjs`: hay que adaptarlas (8)

| # | Línea | Qué mira | Qué protege | Cómo adaptarla |
|---|---|---|---|---|
| 1 | 572-573 | `.indicador` ×4: `/kcal/`, `/registros/`, `/kg/` con `/Última toma: \d/`, `/series/` | PRO-02: cuatro indicadores con unidad, fecha, cobertura y regla (`ACE-PRO:52`) | Clase nueva. El orden pasa a ser el de las áreas. Si cambian los de por defecto (DEC-2), las unidades esperadas. «Última toma: » si cambia la puntuación |
| 2 | 576 | En el primero: `/hoy, en curso: fuera de la media/` y `/subtotal/` | PRO-11: la media no cuenta el día en curso y dice sus subtotales | Igual, si la cobertura queda entera a la vista. Si una parte queda a un clic, abrirla antes |
| 3 | 577 | En el del peso: `/tomas comparables\|no hay con qué comparar/` | PRO-15: el peso compara solo dentro de su tramo | Igual, si se conserva esa línea (§4.1, fila 15). Si no, `/del último tramo comparable/` |
| 4 | 578-579 | `.cobertura`: `/\d+ días de \d+ con algún registro/` y ningún `%` | PRO-12: la cobertura dice su denominador y no da porcentajes | La sección se muda. El texto del dominio invierte el orden: `/\d+ de \d+ días con algún registro/`, en la fila `COBERTURA_NUTRICIONAL` (después de desplegarla, si quedó a un clic). El `%`, sobre toda la vista |
| 5 | 580 | `.recientes li` ×6 | PRO-02: los últimos hechos del período, a mano | Se muda a la Línea de tiempo. Equivalencia: los primeros hechos de la pestaña, que ya mira `R:591-592`. Anotarla |
| 6 | 959-960 | **Negativa:** ningún `.indicador` de B dice `/Peso muerto\|Sentadilla/` | PRO-21: nada de A aparece en B | Clase nueva **en el mismo cambio**, y sumar la positiva (B tiene al menos un indicador); mirar también las tarjetas de área |
| 7 | 989-993 | Con las proyecciones cortadas: `/no hay conexión con BE/` y **no** `/No hay datos de ninguna área/` | PRO-21: sin red, una falla con su motivo y no «sin datos» ni ceros | La negativa niega un texto que el Resumen no tiene (es de Analizar, `SEG\entrada.tsx:121`): pasarla a los «sin datos» del Resumen. Con el bloque, el motivo empieza en mayúscula (`razonDeFalla`, `SEG\contexto.tsx:126`): la expresión, sin distinguir mayúsculas |
| 8 | 1862-1870 | E-47: el Resumen **no** tiene `.como-se-lee__boton` | Que el marco no crece y que la ayuda aparece donde existe | Se invierte: el Resumen tiene la ayuda. Sumar título, foco, Escape y axe, como `R:1871-1876` |

### 7.2 `recorrido.mjs`: corren sobre el Resumen y tienen que seguir pasando sin tocar el guion

| Línea | Qué mira | Qué protege |
|---|---|---|
| 566-570 | Tiempo de la primera carga (se informa) | PRO-24 |
| 571 | Las tres pestañas | PRO-01 |
| 581 y 1012 | axe en el Resumen | PRO-22 |
| 689-692 | El Resumen con la API en uso, en 2.500 ms o menos | PRO-24: la lectura de más cuenta |
| 963-964 | En B: «Vista parcial según tu acceso actual» | PRO-20 |
| 995 y 1012 | axe en el Resumen con fallas | PRO-22: los bloques de estado nuevos |
| 1010 | Sin errores de JavaScript | PRO-25 |
| 1096-1097, 1862 y 1896 | Ninguna respuesta con error en la sesión de Analizar, que abre el Resumen dos veces | PRO-25: una lectura nueva que devuelva 404 la rompe |
| 1911-1950 | La barra a 1440, 1280, 1024 y 768, con el Resumen debajo: `desborde <= 1` | E-17 |
| 1977 y 1993-1995 | axe con el menú abierto, en los dos temas, sobre el Resumen | E-17 |
| 2117-2135 | `resumen` a cinco anchos y dos temas: sin desborde | PRO-23 (10 comprobaciones) |

### 7.3 `recorrido-comprension.mjs`: hay que adaptarlas (23 comprobaciones y 4 clics de navegación)

| # | Línea | Modo | Qué mira | Qué protege | Cómo adaptarla |
|---|---|---|---|---|---|
| 1 | 383-387 | mirar | «Ver todas» en `.encabezado-de-bloque` | La síntesis entera: sin desborde, axe, sin doble desplazamiento | Desplegar lo oculto de cada tarjeta. Si no hay nada que desplegar, la pantalla se retira y se anota |
| 2 | 388-392 | mirar | Clic en `.observacion[data-regla="NOVEDADES_DESDE_EL_CORTE"] a` | La línea de tiempo filtrada | La fila con ese `data-regla` dentro de la tarjeta de Nutrición. **Conservar `data-regla`** |
| 3 | 420-424 | mirar | Clic en `.acciones-del-resumen a` | La revisión preparada (y las dos pantallas que siguen, `RC:426-442`) | El botón al pie de la tarjeta |
| 4 | 476-478 | capturas | El `href` de ese mismo enlace | Seis CP-27 de `revision-nutricion` | Selector nuevo, y comprobar que el enlace **existe** (hoy, si falta, las seis desaparecen sin fallar) |
| 5-6 | 504-509 | capturas | `.observacion`: termina antes de los 900 px, en los dos temas | CP-01: lo primero se ve sin desplazarse | El primer pendiente de la primera tarjeta; mejor, la medición del paso 9 |
| 7 | 519, 527-531 | capturas | `.tabla-de-planificacion tbody tr` empieza antes de los 800 px a 1280 × 800 | GUIA II.1 | La primera tarjeta de área |
| 8 | 618-626 | funcional | `h2` «Objetivo y planificación» antes que «Para tu próxima revisión»; cero `figure.grafico__figura` | CP-01: persona, objetivo y síntesis «antes de exigir explorar gráficos» (`ACE-CP:29`) | Los `h2` son las áreas; el objetivo y las filas de cada tarjeta van antes que los indicadores. «Sin gráficos» pasa a ser: ninguna superficie de recharts, y los minigráficos después de las tarjetas |
| 9 | 627 | funcional | `.observacion`: antes de los 900 px | CP-01 | Como la 5 |
| 10 | 629-641 | funcional | Cada `.observacion` con `__alcance`, `__texto`, `/Sale de /` y al menos una acción | CP-02: evidencia a mano y regla comprobable (`ACE-CP:30`) | Cada fila: su área (la tarjeta), su alcance, el hecho y su destino. «De dónde sale» pasa a la ayuda: comprobar ahí la fuente de cada regla presente |
| 11 | 642 | funcional | La cuenta de `.observacion` es la de «Ver todas (N)» | CP-02: se dice cuántas hay y se muestran todas | Por tarjeta: a la vista más las que anuncia «Ver N más» |
| 12 | 643-644 | funcional | **Negativa:** ninguna dice mejoró, empeoró, no cumplió, adherencia, bien, mal | CP-02 | Selector nuevo **en el mismo cambio** (con una lista vacía pasa sola) |
| 13 | 647-655 | funcional | El alcance empieza con el área e incluye «Desde la revisión del {fecha con año}» | CP-03: un corte por área | La línea del corte de cada tarjeta. Si la fecha va sin año, cambia `diaDe` (`RC:40`) |
| 14-15 | 658-675 | funcional | Las tres cuentas, leídas de la frase y comparadas con `sinceCounts` | CP-05 | Con las palabras del dominio, las mismas tres expresiones sobre el texto de las filas. Con las de la maqueta, las tres cambian |
| 16 | 686-697 | funcional | Clic en el enlace de la observación que contiene «(Nutrición)» | R1: la observación abre la línea filtrada, con solo el instante y el área en la URL | La fila de la tarjeta de Nutrición |
| 17 | 706 | funcional | Clic en `.preguntas-del-resumen__lista a` con «progresando este ejercicio» | CP-07 | Selector de la franja; el texto no cambia si se respeta el dominio |
| 18 | 759-768 | funcional | En E: ningún alcance «Desde la revisión»; la cobertura con «En el período seleccionado» y «El plan rige desde el»; la tabla dice «Sin revisiones registradas» | CP-04 | La cobertura queda a la vista sin revisión. «Sin revisiones registradas» es texto de la pantalla (`SEG\resumen.tsx:322`): si cambia, cambia acá |
| 19 | 769-775 | funcional | **Negativa:** nada de `Entrenamiento ·`, `Antropometría ·`, sesiones o tomas; ni en la tabla | CP-08: un área sin acceso no aporta ni conteos | Que no exista la tarjeta de esas áreas, más los mismos textos. **En el mismo cambio** |
| 20 | 878 | funcional | Clic en «Preparar la revisión de Nutrición» | Las seis comprobaciones R3 de la evidencia (`RC:899-937`): si el clic no encuentra el enlace, la parte entera se anota como una sola falla | Selector |
| 21 | 1234-1243 | funcional | En `.para-tu-revision`: «No pudimos completar esta parte (lo nuevo desde la revisión)», no «No hay registros nuevos», y `.observaciones__fallas` antes que `.observacion` | CP-06 | Dentro de la tarjeta del área: el bloque de la falla antes que sus filas |
| 22 | 1262-1275 | funcional | «Elegir indicadores»; `.editor-de-indicadores`; cierra con `.encabezado-de-bloque button` «Cerrar» | R6: el conflicto se explica y lo marcado queda | El botón de cierre, si el encabezado cambia de clase |
| 23 | 1291-1297 | funcional | Con Tab se llega a `.observacion`, `.preguntas-del-resumen` o `.acciones-del-resumen`, con foco visible | CP-28 | Los contenedores nuevos |
| 24 | 1316 | funcional | `heading 2: Para tu próxima revisión` | CP-28: los títulos están y nada queda sin nombre | Los `h2` de las áreas y de «Indicadores» |
| 25 | 1357 | funcional | Clic en «Preparar la revisión de Entrenamiento» | CP-19 y todo el recorrido 2 | Selector |
| 26 | 1412-1419 | funcional | La fila de Entrenamiento de la tabla: «Última: {fecha}» y «registrada, sin aplicar» | CP-20: la ficha dice la revisión nueva sin recargar | La tarjeta de Entrenamiento: su corte con la fecha de hoy y la fila `REVISION_SIN_APLICAR` |
| 27 | 1483-1484 | revocación | **Negativa:** el Resumen no dice «Abrir Antropometría» ni «Ver la toma» | CP-23 | «Abrir Antropometría» sigue existiendo. Si «Ver la toma» deja de escribirse, negar lo que la tarjeta escriba («Preparar una toma») |

### 7.4 `recorrido-comprension.mjs`: tienen que seguir pasando sin tocar el guion

| Línea | Qué mira |
|---|---|
| 382, 439-443 | `mirar`: el Resumen, la vuelta desde Nutrición y el escenario E |
| 479, 494-503 | CP-27: `resumen` a cinco anchos y dos temas (10), sin desborde ni doble desplazamiento |
| 586-588 | CP-29: la primera carga (se informa) |
| 678-683 | CP-03: abrir la ficha no escribe |
| 855-866 | R3: «Solicitar contexto», en el marco |
| 1298-1301 | CP-28: zoom al 200 % sin desborde |
| 1333-1334 | CP-29: 2,5 s o menos |

### 7.5 Comprobaciones nuevas que conviene escribir

- La primera pantalla a 1440 × 900, con su prueba de la prueba (paso 9).
- Una tarjeta por área autorizada, en el orden de BE, y ninguna de las otras.
- Los cuatro números del objetivo contra la API, en su orden y cada uno con su palabra.
- Un solo botón lleno, y es el del área con la fecha más cercana según el panel.
- El minigráfico contra la serie de la API (puntos, tramos, zonas grises), en los dos temas.
- La carga inicial de la ficha sin la biblioteca de gráficos.
- La falla de los macros no borra las calorías.
- Ningún `%` en el Resumen.

## 8. Decisiones que quedan para quien implementa

| # | Qué hay que decidir | Recomiendo | La otra opción |
|---|---|---|---|
| DEC-1 | Con qué palabras van las filas | Las del dominio, con una función de partes para las frases que son cuentas | Un titular corto por regla, nuevo, en el dominio y con su prueba (se parece más a la maqueta; suma textos que mantener) |
| DEC-2 | Los indicadores por defecto | Calorías, proteínas, la carga de la serie 1 del ejercicio más registrado y el peso, con la mediana como valor y «Última sesión, 24 sept: 62,5 kg · 8 rep · RIR 2» debajo. Es la convención que ya usa la entrada de Analizar (`SEG\entrada.tsx:57-61`; `R:1637`). Pide ofrecer la carga en el editor | Los de hoy, reordenados por área: no cambia nada del editor |
| DEC-3 | Qué se exige de la primera pantalla | A 1440 × 900: la acción de cada tarjeta, las preguntas y el valor de cada indicador. Se informa dónde terminan los indicadores, y se mide a 1920 × 1080 | Exigir todo a 1440 × 900: pide recortar filas o aire, y con los textos del dominio no sé si alcanza |
| DEC-4 | La cobertura del área cuando hay revisión | En la tarjeta, a un clic, desplegada en el lugar («Ver N más» junto al corte) | Dejarla solo en «¿Con qué información cuento…?», que no dice los cinco datos del punto 1.8 |
| DEC-5 | La fila «Tomas» y la observación `ULTIMA_TOMA` | Una sola cosa: la fila del contexto, que abre la toma | Las dos, repetidas como hoy |
| DEC-6 | El botón lleno y la fecha de la próxima revisión | La fecha siempre a la vista en la tarjeta; lleno el del área con la fecha más temprana; sin ninguna fecha, ninguno lleno | Lleno el primero cuando no hay fechas |
| DEC-7 | Las fechas sin año | Sin año si es el año en curso; con año si no | Siempre con año (no cambia `RC:651-652`) |
| DEC-8 | «Actualizar» | Que suba `versionDeAcceso` también en la relectura manual (`ADV\workspace.tsx:104`): todo lo que depende de ella se vuelve a leer | Dejarlo y conservar una segunda hora en el Resumen |
| DEC-9 | «estimado, por día» sobre la tira | «por día · desde el 7 sept», y «requerimiento energético estimado» junto a las calorías, al menos para el lector de pantalla: los macros los declara el profesional (`DOM\copy-nutricion.ts:52-53`) | El texto de la maqueta |
| DEC-10 | Las preguntas con acceso parcial | Sacar la del ejercicio si Entrenamiento no está disponible; «Más preguntas», siempre | Dejar las cuatro (hoy es así) |
| DEC-11 | El enunciado largo del objetivo de Entrenamiento | Hasta tres renglones a la vista; entero al abrir el área | Entero siempre |

## 9. Lo que no pude determinar leyendo

- **Cuánto mide cada cosa de verdad.** Los altos del punto 1.2 salen de sumar estilos: no medí nada.
- **Si las pruebas y los recorridos pasan hoy.** No ejecuté nada.
- **Cómo se ve el Resumen hoy con el marco y la barra nuevos** a 1280 y 1024: vi solo `REPO\EVIDENCIA\ESCRITORIO-AMABLE\parte-1b\resumen-1440-claro.png`.
- **Qué devuelve API-NUT-06 a un profesional sin acceso a Nutrición:** supongo un 404, como las demás lecturas, y por eso propongo no pedirla sin el área. No leí el servicio (`API\nutricion\evaluaciones.service.ts:244`).
- **Qué quiere decir el valor de un macro en `energy_share`** (fracción o porcentaje): el esquema no lo dice.
- **Si alguna cuenta de prueba tiene indicadores guardados.** `RC:1264-1273` simula el conflicto y no llega a guardar; `R:573` espera los de por defecto.
- **Dónde va la tercera tarjeta a 1024, cómo se acomodan dos áreas** y cómo queda la pantalla 14 a 1280 y a 1024.
- **Cómo se ve «Elegir indicadores» abierto** y el contenido de la ayuda del Resumen.
- **Cómo redondear las dos marcas del eje del minigráfico:** la maqueta las eligió a mano (`MQ\partes\01-cuerpo.html:103-106`).
- **E-41 a E-48:** no están en el `WP` que leí (punto 1.14).
- **Si «es la primera» vale siempre que la etiqueta es `v1`:** lo deduzco del comentario del contrato; no leí cómo numera la API.
- **Si el comportamiento de «Actualizar» del punto 1.11 es el que describo:** lo seguí en el código, sin verlo en pantalla.
- **Los pares en Azul noche de las maquetas 01 y 14:** miré las de Claro.
