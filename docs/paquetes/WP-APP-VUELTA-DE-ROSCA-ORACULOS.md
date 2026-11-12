# WP-APP-VUELTA-DE-ROSCA — los oráculos TEST-AVR de las partes solo de app

> **Qué es esto.** El paquete (`WP-APP-VUELTA-DE-ROSCA.md` §8) declaró los oráculos TEST-AVR-001 a 033 en una línea
> cada uno. Acá van escritos con los trece campos que la §6 del 11A declara obligatorios (11A:150-169), igual que los
> TEST-FR2 de `WP-FORMULARIOS-RONDA-2-ORACULOS.md`. Este archivo trae los de las partes **solo de app**, que Dirección
> autorizó el 2026-11-07 («Sí, primero lo que es solo app»): etapa 1 (AV-01 a AV-09 y AV-17) y etapa 2 (AV-10 a AV-14 y
> AV-18).
>
> **Qué no es esto.** No modifica el 11A, protegido por `docs/MANIFEST.sha256`. Los TEST-AVR-025 a 028 («Arranca sola»,
> AV-15) y 031 a 033 («Eligió no responder», AV-19) tocan servidor y base, y se escriben con su tanda.
>
> **De dónde sale cada oráculo.** De DL-166 (`docs/DEUDA_LEGAJO.md`:7051, decidida y ratificada por Dirección el
> 2026-11-07), del paquete (con referencia `archivo:línea`) y de la GUIA-UX-UI III.7 (`docs/ux/GUIA-UX-UI.md`:1323). Un
> oráculo dice qué hay que observar para aceptar la prueba: no inventa la regla, la lee.
>
> **Cómo se escribieron.** Cada oráculo se escribió antes del código de su parte, y su prueba se verificó con una
> mutación: se rompe a propósito la regla en el código, la prueba se pone en rojo, y se vuelve atrás. La mutación de cada
> uno está en su campo AUTOMATION, y el resultado de las 26 corridas (todas en rojo), en
> `EVIDENCIA/APP-VUELTA-DE-ROSCA/LEEME.md`.
>
> **Lo que solo se ve en el teléfono** (TalkBack, la vibración con la pantalla bloqueada, la letra al máximo) se dice en
> EVIDENCE_EXPECTED y queda para la candidata (AV-16): ninguna de estas pruebas lo da por aprobado.
>
> **Enmienda del 2026-11-11 (WP-USO-FINAL, DL-169; UF-01 y UF-08).** Dirección cambió dos cosas que estos oráculos
> fijaban, y sus pruebas (`scripts/vuelta-de-rosca.test.mjs` y `scripts/historial-navegacion.test.mjs`) piden lo nuevo:
> - **TEST-AVR-002:** la franja del ambiente de prueba ya no va siempre. Su texto sale del dominio
>   (`AVISOS_DE_PRUEBA.franja`) y se muestra solo si `AVISOS_DE_PRUEBA_VISIBLES` (TEST-UF-012).
> - **TEST-AVR-004 y TEST-AVR-029:** «Agregá tu nombre» ya no se ofrece. El nombre es obligatorio: la cuenta nace con él,
>   y una anterior sin nombre lo completa en «Antes de seguir» antes de llegar a Perfil (TEST-UF-005). Si igual faltara,
>   Perfil muestra la referencia, sin ofrecer agregarlo.

---

## TEST-AVR-001 — Lo que hace falta para decidir nunca está plegado

```text
TEST_ID              TEST-AVR-001
TITLE                Un solo desplegable en la APK; el estado, la fecha, quién y si se puede responder, siempre a la vista
LEVEL                APK (lógica pura y estructura del código)
PRIORITY             P1 — la regla fija de la guía (III.7)
SOURCES              PV-4 (WP-APP-VUELTA-DE-ROSCA.md:142-143) · AV-01 (:220) · GUIA-UX-UI III.7 (:1323-1341)
PRECONDITIONS        La pieza común `apps/mobile/src/desplegable.ts` y las vistas armadas por las partes del paquete
                     (Inicio, Perfil, «Quién ve qué»).
SYNTHETIC_FIXTURE    Las vistas armadas con la cohorte sintética de las pruebas: una sesión con 6 ejercicios, una
                     tarjeta de «Quién ve qué» con A3 y sin A3.
STEPS                1. Pedir las propiedades de accesibilidad del desplegable, abierto y cerrado.
                     2. Recorrer el código de la APK buscando estados «expanded» declarados fuera de la pieza.
                     3. Armar cada vista del paquete y revisar qué clase de dato quedó en lo plegado.
EXPECTED             1 → rol «button», `expanded` igual al estado y un nombre que dice qué guarda («6 ejercicios ·
                     18 series»). 2 → ningún archivo declara `expanded` por su cuenta: todos usan la pieza común.
                     3 → lo plegado de cada vista solo tiene clases que explican (para qué, qué incluye, detalle,
                     cómo funciona); el estado, la fecha, quién y si se puede responder están en lo visible.
NEGATIVE_ASSERTIONS  Abrir un desplegable no llama a la API ni escribe en el teléfono: la pieza no recibe el
                     cliente ni el almacén. Ninguna vista pliega una clase de las que hacen falta para decidir.
AUTOMATION           scripts/vuelta-de-rosca.test.mjs («TEST-AVR-001 · …»). Mutación: sacar 'estado' de
                     LO_QUE_NUNCA_SE_PLIEGA → la prueba falla.
ENVIRONMENT          `npm test`
EVIDENCE_EXPECTED    La CI verde; la tabla «qué se pliega» de cada pantalla, en EVIDENCIA/APP-VUELTA-DE-ROSCA (AV-16)
```

---

## TEST-AVR-002 — La barra con Perfil

```text
TEST_ID              TEST-AVR-002
TITLE                Perfil es el quinto destino; la cabecera tiene la marca y Novedades, sin menú ni avatar
LEVEL                APK (lógica pura de la navegación y estructura del código)
PRIORITY             P1
SOURCES              PV-1 (WP-APP-VUELTA-DE-ROSCA.md:135-137) · AV-02 (:221) · §4.0 (:213-214) · DL-117
PRECONDITIONS        `navegacion.ts`, `barra-de-zonas.tsx`, `cabecera.tsx`, `disposicion-de-la-barra.ts`.
SYNTHETIC_FIXTURE    Todas las rutas con sesión de la APK.
STEPS                1. Leer los cinco destinos.
                     2. Pedir la raíz y el destino resaltado de cada pantalla de Perfil (Mis datos, Avisos, Quién ve
                        qué, Vínculos, Privacidad, Mis hábitos, una solicitud).
                     3. Disponer la barra a 360 dp con letra ×1 y ×1,3.
                     4. Leer la cabecera.
EXPECTED             1 → Inicio, Nutrición, Entrenamiento, Evolución y Perfil, en ese orden; Perfil abre la raíz
                     `perfil` con el ícono de persona. 2 → todas resaltan Perfil y Atrás vuelve como antes (al
                     origen o a la madre). 3 → ×1: una fila sin achicar; ×1,3: dos filas, Evolución y Perfil abajo,
                     sin achicar la letra. 4 → la marca y Novedades; ni «Abrir el menú» ni «Cuenta»; la franja del
                     ambiente de prueba sigue.
NEGATIVE_ASSERTIONS  No queda un destino «Información». En una fila, ninguna etiqueta se achica (×1,3 ya no se
                     resuelve achicando la letra al 97 %).
AUTOMATION           scripts/historial-navegacion.test.mjs y scripts/barra-de-zonas.test.mjs, actualizadas como pide
                     AV-02 · scripts/vuelta-de-rosca.test.mjs («TEST-AVR-002 · …»). Mutación: volver a poner
                     TOLERANCIA_EN_UNA_FILA en 0,9 → 360 dp ×1,3 queda en una fila y la prueba falla.
ENVIRONMENT          `npm test`
EVIDENCE_EXPECTED    La CI verde; en el teléfono, TalkBack dice «Perfil, pestaña, 5 de 5, seleccionada» (AV-16)
```

---

## TEST-AVR-003 — Dónde quedó cada cosa

```text
TEST_ID              TEST-AVR-003
TITLE                Ninguna entrada del menú, de Cuenta ni de «Información» se pierde ni queda en dos lugares
LEVEL                APK (lógica pura y estructura del código)
PRIORITY             P1 — «la parte más fácil de hacer mal» (§7, :350-351)
SOURCES              PV-1 (:135-137) · AV-02 (:221) · AV-03 (:222) · menú auxiliar y Cuenta de DL-117
PRECONDITIONS        La tabla `DONDE_QUEDO_CADA_COSA` de `apps/mobile/src/perfil.ts`.
SYNTHETIC_FIXTURE    Las entradas de antes: las tres del menú (Vínculos, Tu historial, Registros nutricionales),
                     las secciones de Cuenta y lo de «Información» (la bandeja y Mis hábitos).
STEPS                1. Recorrer la tabla.
                     2. Buscar, en el archivo del lugar nuevo, el enlace a cada destino.
EXPECTED             1 → cada entrada de antes aparece una sola vez, con un lugar nuevo. 2 → el lugar nuevo abre
                     la pantalla (Vínculos y «Tengo un código» en Perfil, Tu historial en Entrenamiento, los
                     registros en Nutrición, Mis datos, Avisos, Sesión y este teléfono y Cerrar mi cuenta en
                     Perfil).
NEGATIVE_ASSERTIONS  El menú auxiliar ya no existe. Ninguna entrada tiene dos lugares nuevos.
AUTOMATION           scripts/vuelta-de-rosca.test.mjs («TEST-AVR-003 · …»). Mutación: borrar la fila de
                     «Registros nutricionales» de la tabla → la prueba falla.
ENVIRONMENT          `npm test`
EVIDENCE_EXPECTED    La CI verde; la tabla, copiada en EVIDENCIA/APP-VUELTA-DE-ROSCA (AV-16)
```

---

## TEST-AVR-004 — Perfil

```text
TEST_ID              TEST-AVR-004
TITLE                Perfil muestra quién sos, tu información, tus profesionales, formularios y los ajustes, con
                     Cerrar mi cuenta al final
LEVEL                APK (lógica pura)
PRIORITY             P1
SOURCES              AV-03 (WP-APP-VUELTA-DE-ROSCA.md:222) · maqueta 02 (:75-81) · DL-009 y DL-040 (el nombre)
PRECONDITIONS        `bloquesDePerfil` de `perfil.ts`.
SYNTHETIC_FIXTURE    Diego Sosa (cohorte sintética): nombre, identificador BE, tres profesionales, un formulario y
                     un pedido de hábitos para responder, cuatro respondidos.
STEPS                1. Armar Perfil con todo leído.
                     2. Armarlo sin nombre.
                     3. Armarlo con la reautenticación pedida por Cerrar mi cuenta.
EXPECTED             1 → en orden: quién sos, las cuatro baldosas (Mis datos, Mis hábitos, Quién ve qué, Notas
                     entre tus profesionales), tus profesionales con su área y «Tengo un código» al pie,
                     «Formularios y pedidos» («Para responder» 2, «Respondidos» 4) y los ajustes (Apariencia,
                     Avisos, Privacidad y consentimientos, Sesión y este teléfono y, último, Cerrar mi cuenta).
                     2 → «Agregá tu nombre» en el lugar del nombre. 3 → al volver a entrar, la APK abre Cerrar mi
                     cuenta, no una pantalla general.
NEGATIVE_ASSERTIONS  «Podés no responder» no está en Perfil: se dice una vez, adentro de «Para responder».
AUTOMATION           scripts/vuelta-de-rosca.test.mjs («TEST-AVR-004 · …»). Mutación: mover Cerrar mi cuenta antes
                     de Avisos → la prueba falla.
ENVIRONMENT          `npm test`
EVIDENCE_EXPECTED    La CI verde; la captura de Perfil en los dos temas (AV-16)
```

---

## TEST-AVR-005 y TEST-AVR-006 — La marca de Perfil

```text
TEST_ID              TEST-AVR-005 · TEST-AVR-006
TITLE                El punto aparece con algo para responder y se va al responder o al negarse, no por abrir
                     Perfil; Inicio y Perfil cuentan lo mismo
LEVEL                APK (lógica pura)
PRIORITY             P1
SOURCES              PV-6 (WP-APP-VUELTA-DE-ROSCA.md:146-148) · AV-04 (:223) · §4.0 (:209) · AVD-1 (:277-282)
PRECONDITIONS        `paraResponder` y `marcaDePerfil` de `perfil.ts`.
SYNTHETIC_FIXTURE    Un formulario pendiente, uno para confirmar, uno respondido, un pedido de hábitos pendiente y
                     un profesional nuevo por el que preguntar.
STEPS                1. Contar «Para responder» con todo eso.
                     2. Responder el formulario; contestar «No, por ahora» al pedido de hábitos.
                     3. Abrir Perfil sin responder nada.
EXPECTED             1 → cuentan el formulario pendiente, el de confirmar y el pedido; el profesional nuevo va
                     solo si no hay pedidos (como hoy); la marca está; el texto para el lector es «hay algo para
                     responder». 2 → responder y negarse sacan cada uno su fila; sin filas, no hay marca y el
                     lector no dice nada de más. 3 → abrir no cambia la cuenta.
NEGATIVE_ASSERTIONS  La marca no tiene número. Un formulario saca la marca solo al responderse (decir que no a un
                     formulario llega con AV-19). La cuenta de Inicio y la de Perfil salen de la misma función.
AUTOMATION           scripts/vuelta-de-rosca.test.mjs («TEST-AVR-005 · …», «TEST-AVR-006 · …»). Mutación: contar
                     también los respondidos → la prueba falla.
ENVIRONMENT          `npm test`
EVIDENCE_EXPECTED    La CI verde; en el teléfono, la barra con y sin punto y lo que dice TalkBack (AV-16)
```

---

## TEST-AVR-007 a TEST-AVR-009 — «Quién ve qué»

```text
TEST_ID              TEST-AVR-007 · TEST-AVR-008 · TEST-AVR-009
TITLE                «Quién ve qué» lee lo que ya existe, no escribe y no dice nada que prohíba 10-B04; en pausa,
                     terminado y sin A3
LEVEL                APK (lógica pura y estructura del código)
PRIORITY             P1 — privacidad (08) y textos de acceso (10-B04)
SOURCES              PV-3 (WP-APP-VUELTA-DE-ROSCA.md:140-141) · AV-05 (:224) · §4.0 (:212) · 10-B04 (:32)
PRECONDITIONS        `quienVeQue` de `quien-ve-que.ts` y la pantalla `pantallas/quien-ve-que.tsx`.
SYNTHETIC_FIXTURE    Tres vínculos (aceptado con consentimiento, en pausa, finalizado), el A3 otorgado y no
                     otorgado, hábitos compartidos (RECEIVES, DOES_NOT_RECEIVE, NOT_ASKED) y un pedido.
STEPS                1. Armar la vista con A3 y sin A3.
                     2. Armarla con un vínculo en pausa y otro finalizado.
                     3. Armarla con los hábitos compartidos, retirados y pedidos.
                     4. Leer las llamadas a la API de la pantalla.
EXPECTED             1 → arriba, el tratamiento de los datos de salud; sin A3, dice que ningún profesional ve tus
                     datos. 2 → una tarjeta por profesional con su área y desde cuándo; en pausa o terminado dice
                     que no ve, y por qué. 3 → «Los ve», «Te pidió verlos · No los ve» o «No los ve». 4 → solo
                     lecturas (vínculos, consentimientos, A3, hábitos y pedidos); «Cambiar» lleva al vínculo, a
                     Privacidad o a Mis hábitos.
NEGATIVE_ASSERTIONS  Ningún texto dice «puede ver todos tus datos» ni promete más de lo autorizado (10-B04). La
                     pantalla no llama a ninguna operación que escriba. «Qué incluye» sale del Alcance (su
                     finalidad), no de un texto escrito a mano por pantalla.
AUTOMATION           scripts/vuelta-de-rosca.test.mjs («TEST-AVR-007 · …» a «TEST-AVR-009 · …»). Mutación: decir
                     «Lo ve» para un vínculo en pausa → la prueba falla.
ENVIRONMENT          `npm test`
EVIDENCE_EXPECTED    La CI verde; la revisión de los textos contra 10-B04, anotada en la evidencia (AV-16)
```

---

## TEST-AVR-010 a TEST-AVR-012 — Inicio (TEST-AVR-010 y 012, enmendados por DL-170 el 2026-11-11: AV2-D1 paso 1 y AV2-D2; las pruebas piden la regla nueva)

```text
TEST_ID              TEST-AVR-010 · TEST-AVR-011 · TEST-AVR-012
TITLE                «La que sigue» por el orden del plan; BE no elige el día tipo ni la sesión; los 30 días como
                     un número
LEVEL                APK (lógica pura)
PRIORITY             P1
SOURCES              PV-2 (WP-APP-VUELTA-DE-ROSCA.md:138-139) · PV-5 (:144-145) · AV-06 (:225) · DL-049 · DL-077
PRECONDITIONS        `fichasDeComidas`, `laQueSigue` y `actividadEnUnNumero` de `inicio-de-hoy.ts`.
SYNTHETIC_FIXTURE    Un día tipo con Desayuno, Almuerzo, Merienda y Cena; registros fuera de orden (la cena
                     antes que el almuerzo) y uno fuera del plan; la actividad de 30 días de Diego (11 sesiones).
STEPS                1. Armar las fichas con el desayuno registrado.
                     2. Registrar la cena antes del almuerzo; sumar un registro fuera del plan.
                     3. Armar las fichas con el día tipo sin elegir.
                     4. Contar la actividad.
EXPECTED             1 → el desayuno con su marca y su hora; «la que sigue» es el almuerzo. 2 → sigue siendo el
                     almuerzo (el orden del plan, nunca la hora); el registro fuera del plan no es una comida del
                     plan. 3 → no hay fichas: Inicio pide elegir el día. 4 → «11 sesiones registradas · últimos 30
                     días».
NEGATIVE_ASSERTIONS  La hora del teléfono no cambia «la que sigue». Con el día sin elegir, BE no elige uno. La
                     actividad no lleva porcentaje ni calificación.
AUTOMATION           scripts/vuelta-de-rosca.test.mjs («TEST-AVR-010 · …» a «TEST-AVR-012 · …»). Mutaciones: dejar
                     las comidas en el orden en que llegan, sin el del plan (010); armar fichas sin día elegido (011);
                     restarle uno al número de la actividad (012) → la prueba falla.
ENVIRONMENT          `npm test`
EVIDENCE_EXPECTED    La CI verde; el conteo de palabras y botones de Inicio, antes y después (AV-16)
```

---

## TEST-AVR-013 — El número de Inicio y el desglose de «Tu historial» (enmendado por DL-170 el 2026-11-11, AV2-D2: Inicio ya no da un total)

```text
TEST_ID              TEST-AVR-013
TITLE                El total del desglose de 30 días en «Tu historial» es el número de Inicio
LEVEL                APK (lógica pura y estructura del código)
PRIORITY             P2
SOURCES              PV-5 (:144-145) · AV-07 (:226) · AVD-2 (:283-286) · DL-106 (la ausencia no es «no realizada»)
PRECONDITIONS        `desgloseDeActividad` de `inicio-de-hoy.ts`; Inicio y `historial.tsx`.
SYNTHETIC_FIXTURE    Sesiones realizadas, con desvío y no realizadas, una corregida.
STEPS                1. Armar el número de Inicio y el desglose con la misma actividad.
                     2. Buscar en Inicio y en «Tu historial» la función que los arma.
EXPECTED             1 → realizadas + con desvío + no realizadas = el número de Inicio. 2 → los dos usan
                     `leerActividadDeEntrenamiento` y la misma función de texto.
NEGATIVE_ASSERTIONS  Un día sin registro no cuenta como «no realizada».
AUTOMATION           scripts/vuelta-de-rosca.test.mjs («TEST-AVR-013 · …»). Mutación: dejar fuera las no
                     realizadas del total → la prueba falla.
ENVIRONMENT          `npm test`
EVIDENCE_EXPECTED    La CI verde
```

---

## TEST-AVR-014 — Registrar una comida y responder un formulario no cambian de regla

```text
TEST_ID              TEST-AVR-014
TITLE                Plegar el detalle no cambia lo que registra «Comí esta opción» ni lo que guarda un formulario
LEVEL                APK (lógica pura) — las pruebas que ya existen
PRIORITY             P1
SOURCES              AV-08 (WP-APP-VUELTA-DE-ROSCA.md:227) · DL-165 D-1 y D-2
PRECONDITIONS        Las pruebas de `opcion-de-comida` y de las partes del formulario, sin cambios.
SYNTHETIC_FIXTURE    Los de esas pruebas.
STEPS                1. Correr las pruebas de registro de comidas y de formularios.
                     2. Revisar que la pantalla de la opción use el desplegable común para ingredientes,
                        preparación y «Comí otra cantidad», y que la solicitud pliegue «Para qué lo pide».
EXPECTED             1 → verdes, sin cambiar lo que esperan. 2 → los tres plegados con la pieza común; «Comí esta
                     opción» fuera de todo desplegable; «Queda como declarado por vos» se dice una vez, al
                     empezar, fuera de lo plegado.
NEGATIVE_ASSERTIONS  Ninguna prueba existente se modificó para esta parte.
AUTOMATION           scripts/registro-de-comidas.test.mjs, apps/mobile/src/formulario-v2.test.ts (sin cambios) ·
                     scripts/vuelta-de-rosca.test.mjs («TEST-AVR-014 · …»). Mutación: volver a dejar los
                     ingredientes en una sección a la vista, sin plegar → la prueba falla.
ENVIRONMENT          `npm test`
EVIDENCE_EXPECTED    La CI verde
```

---

## TEST-AVR-015 — Los íconos nuevos

```text
TEST_ID              TEST-AVR-015
TITLE                El de «Mis hábitos» y el engranaje son de la familia y tienen nombre
LEVEL                Dominio (la familia) y APK (dónde se usan)
PRIORITY             P2
SOURCES              AV-09 (WP-APP-VUELTA-DE-ROSCA.md:228) · PV «el ícono de Mis hábitos» (:149-150) · GUIA I.8
PRECONDITIONS        `packages/domain/src/iconos.ts` con `habitos` y `engranaje`.
SYNTHETIC_FIXTURE    —
STEPS                1. Correr las reglas de la familia con los dos nuevos.
                     2. Buscar dónde se usan en la APK.
EXPECTED             1 → trazo de la familia, dentro del lienzo, sin color propio y nada lleno salvo puntos. 2 →
                     el de hábitos en Inicio, en Perfil y en «Quién ve qué»; el engranaje junto al descanso, en un
                     botón con nombre («Ajustes del descanso»).
NEGATIVE_ASSERTIONS  Ningún ícono nuevo va solo, sin palabra ni nombre para el lector.
AUTOMATION           packages/domain/src/iconos.test.ts (las reglas de la familia, sin cambios) ·
                     scripts/vuelta-de-rosca.test.mjs («TEST-AVR-015 · …»). Mutación: usar el reloj de siempre en la
                     baldosa de «Mis hábitos» → la prueba falla.
ENVIRONMENT          `npm test`
EVIDENCE_EXPECTED    La lámina a 18, 20 y 24 px en los dos temas, en EVIDENCIA/APP-VUELTA-DE-ROSCA/iconos
```

---

## TEST-AVR-016 a TEST-AVR-019 — El descanso al tildar

```text
TEST_ID              TEST-AVR-016 · TEST-AVR-017 · TEST-AVR-018 · TEST-AVR-019
TITLE                El descanso al tildar: automático, manual, en pausa, con una medición abierta, sin
                     recomendado, la última serie, y destildar con el descanso corriendo
LEVEL                APK (lógica pura de la corrida) y dominio (`aplicarEventos`)
PRIORITY             P1 — cambia §7.3 y §7.4 de WP-ENTRENAMIENTO-SERIES
SOURCES              PV-7 (WP-APP-VUELTA-DE-ROSCA.md:151-152) · AV-10 (:235) · AVD-3 (:287-292) · DL-124
PRECONDITIONS        `accionesAlTildar` y `accionesAlDestildar` de `descanso-automatico.ts`, sobre
                     `armarAccion` de `corrida-de-entrenamiento.ts`.
SYNTHETIC_FIXTURE    Sentadilla con 4 series y 1:30 de descanso recomendado; un segundo ejercicio; el reloj de
                     sesión inyectado.
STEPS                1. Con el ajuste automático, tildar la serie 2.
                     2. Con el ajuste manual, tildar la serie 2.
                     3. En pausa, tildar.
                     4. Con la serie 3 cronometrada, tildarla.
                     5. Tildar la última serie del ejercicio y la última de la sesión.
                     6. Destildar la serie 2 con su descanso corriendo.
                     7. Sin recomendado, tildar.
EXPECTED             1 → `REST_STARTED` ligado a la serie 2. 2 → ningún evento. 3 → ningún evento (nada se mide en
                     pausa). 4 → primero `SET_TIMING_FINISHED`, después `REST_STARTED`, con el mismo instante y la
                     misma acción compuesta. 5 → ningún descanso (AVD-3). 6 → `REST_FINISHED` de ese descanso.
                     7 → el descanso arranca igual, con conteo sin barra y sin vibrar. `aplicarEventos` acepta
                     cada secuencia.
NEGATIVE_ASSERTIONS  Ningún evento se borra. Pasado el 100 % no se cierra nada.
AUTOMATION           scripts/vuelta-de-rosca.test.mjs («TEST-AVR-016 · …» a «TEST-AVR-019 · …»). Mutación:
                     arrancar el descanso también tras la última serie → la prueba falla.
ENVIRONMENT          `npm test`
EVIDENCE_EXPECTED    La CI verde; en el teléfono, la sesión con el descanso automático (AV-16)
```

---

## TEST-AVR-020 — Los ajustes del descanso, en el teléfono

```text
TEST_ID              TEST-AVR-020
TITLE                Los ajustes del descanso se guardan en el teléfono, con los de fábrica si la lectura falla
LEVEL                APK (lógica pura)
PRIORITY             P2
SOURCES              PV-10 (WP-APP-VUELTA-DE-ROSCA.md:166) · AV-11 (:236) · los valores de fábrica (:164-165)
PRECONDITIONS        `crearAjustesDelDescanso` de `descanso-automatico.ts`, con un almacenamiento inyectado.
SYNTHETIC_FIXTURE    Un almacenamiento en memoria, uno que falla al leer y uno con un valor viejo o roto.
STEPS                1. Leer sin nada guardado.
                     2. Cambiar a manual y releer en un almacén nuevo.
                     3. Leer con un almacenamiento que falla, o con basura guardada.
EXPECTED             1 → automático, vibrar encendido y también con el teléfono bloqueado. 2 → manual. 3 → los
                     de fábrica, sin error.
NEGATIVE_ASSERTIONS  No hay ajuste de «la serie siguiente» hasta AV-15: no se ofrece una opción que no funciona.
                     Los ajustes no viajan a la API.
AUTOMATION           scripts/vuelta-de-rosca.test.mjs («TEST-AVR-020 · …»). Mutación: cambiar el de fábrica a
                     manual → la prueba falla.
ENVIRONMENT          `npm test`
EVIDENCE_EXPECTED    La CI verde
```

---

## TEST-AVR-021 y TEST-AVR-022 — La vibración y los permisos

```text
TEST_ID              TEST-AVR-021 · TEST-AVR-022
TITLE                Cuándo se programa el aviso del 100 % y cuándo se cancela; el permiso en contexto; la lista
                     de permisos
LEVEL                APK (lógica pura y configuración)
PRIORITY             P1 — cambia la garantía «BE no programa avisos locales»
SOURCES              PV-9 (WP-APP-VUELTA-DE-ROSCA.md:158-162) · AV-12 (:237) · AVD-5 (:298-303) · AVD-8 (:313-317)
                     · 08, minimización
PRECONDITIONS        `planDelAviso` y `pedidoDelPermiso` de `descanso-automatico.ts`; `app.config.ts`;
                     `scripts/avisos-del-telefono.test.mjs`.
SYNTHETIC_FIXTURE    Un descanso de 90 s empezado hace 12 s; los tres estados del permiso.
STEPS                1. Planear el aviso con vibrar encendido, apagado y sin recomendado.
                     2. Terminar el descanso antes, pausar, destildar, finalizar y cerrar la sesión.
                     3. Pedir qué hacer con el permiso dado, sin pedir y negado, en el primer descanso.
                     4. Leer el texto del aviso y la lista de permisos.
EXPECTED             1 → con vibrar, un aviso para dentro de 78 s; apagado o sin recomendado, ninguno. 2 → en cada
                     caso, se cancela. 3 → dado: nada que pedir; sin pedir: el bloque explica para qué y ofrece
                     «Permitir avisos»; negado: una línea dice que vibra solo con la app abierta. Si se cierra sin
                     elegir, no se vuelve a preguntar en esa sesión. 4 → el aviso no nombra el ejercicio ni tiene
                     datos; los permisos son los de antes y la vibración, sin alarma exacta ni arranque al
                     encender.
NEGATIVE_ASSERTIONS  El permiso nunca se pide al abrir la app. No se pide `SCHEDULE_EXACT_ALARM`, `USE_EXACT_ALARM`
                     ni `RECEIVE_BOOT_COMPLETED`.
AUTOMATION           scripts/vuelta-de-rosca.test.mjs («TEST-AVR-021 · …», «TEST-AVR-022 · …») ·
                     scripts/avisos-del-telefono.test.mjs (la lista de permisos, cambiada en lo que esto usa).
                     Mutación: poner el nombre del ejercicio en el texto del aviso → la prueba falla.
ENVIRONMENT          `npm test`; el teléfono de Dirección con Android 13 o posterior
EVIDENCE_EXPECTED    La CI verde; en el teléfono: bloqueado, en reposo y en segundo plano, con la demora medida
```

---

## TEST-AVR-023 — La acción del momento

```text
TEST_ID              TEST-AVR-023
TITLE                La fila fija tiene Pausar o Reanudar, la acción del momento y Siguiente ejercicio
LEVEL                APK (lógica pura)
PRIORITY             P1
SOURCES              PV-11 (WP-APP-VUELTA-DE-ROSCA.md:167-168) · AV-13 (:238) · AVD-4 (:293-297)
PRECONDITIONS        `filaDeAcciones` de `descanso-automatico.ts`.
SYNTHETIC_FIXTURE    La sesión en cada estado: sin empezar, con un descanso corriendo, con una serie cronometrada,
                     sin nada abierto, en pausa, sin serie que empezar y en el último ejercicio.
STEPS                1. Pedir la fila en cada estado.
EXPECTED             Descanso corriendo → «Empezar serie N». Serie cronometrada → «Terminar serie N». Nada
                     abierto → «Empezar serie N». En pausa → «Reanudar» a la izquierda y la del medio
                     deshabilitada, con su motivo. En el último ejercicio, «Siguiente ejercicio» no se ofrece.
NEGATIVE_ASSERTIONS  «Finalizar entrenamiento» no está en la fila: queda al final de la pantalla y en «Ver rutina».
AUTOMATION           scripts/vuelta-de-rosca.test.mjs («TEST-AVR-023 · …»). Mutación: habilitar la del medio en
                     pausa → la prueba falla.
ENVIRONMENT          `npm test`
EVIDENCE_EXPECTED    La CI verde; la medición del alto que queda para el contenido (AV-13)
```

---

## TEST-AVR-024 — «Empezar serie N»

```text
TEST_ID              TEST-AVR-024
TITLE                Con un descanso corriendo, un toque termina el descanso y arranca la serie, en el mismo
                     instante y con una sola acción compuesta
LEVEL                APK (lógica pura) y dominio (`calcularTiempos`)
PRIORITY             P1
SOURCES              PV-12 (WP-APP-VUELTA-DE-ROSCA.md:169-170) · AV-14 (:239) · WP-ENTRENAMIENTO-SERIES §7.4
PRECONDITIONS        `accionDeEmpezarSerie` de `descanso-automatico.ts` y `armarAccion`.
SYNTHETIC_FIXTURE    Un descanso tras la serie 2, abierto hace 72 s.
STEPS                1. Tocar «Empezar serie 3».
                     2. Tocarlo dos veces seguidas.
                     3. Calcular los tiempos.
EXPECTED             1 → `REST_FINISHED` y `SET_TIMING_STARTED` con el mismo `at` y el mismo `compoundActionId`.
                     2 → la segunda vez no agrega eventos. 3 → el descanso medido y la serie medida, sin hueco.
NEGATIVE_ASSERTIONS  Sin descanso, «Empezar serie N» arranca solo la medición de la serie.
AUTOMATION           scripts/vuelta-de-rosca.test.mjs («TEST-AVR-024 · …»). Mutación: armar «Empezar serie N» como
                     «Iniciar descanso» en lugar de la acción compuesta de la serie → la prueba falla.
ENVIRONMENT          `npm test`
EVIDENCE_EXPECTED    La CI verde
```

---

## TEST-AVR-029 — Una cuenta nueva

```text
TEST_ID              TEST-AVR-029
TITLE                Sin bloques vacíos: el paso que falta primero, una línea por área sin plan y Perfil sin punto
LEVEL                APK (lógica pura)
PRIORITY             P2
SOURCES              AV-17 (WP-APP-VUELTA-DE-ROSCA.md:229) · maqueta 09 (:106-110) · DL-143
PRECONDITIONS        `bloquesDeInicio` de `inicio-de-hoy.ts` y `bloquesDePerfil` de `perfil.ts`.
SYNTHETIC_FIXTURE    Una persona que recién aceptó a su nutricionista: sin planes, sin pedidos, sin nombre.
STEPS                1. Armar Inicio.
                     2. Armar Perfil.
EXPECTED             1 → primero el paso que falta para el acceso; después una línea por área sin plan; no hay
                     «Para responder». 2 → «Agregá tu nombre»; cada baldosa dice su estado en palabras; sin
                     punto.
NEGATIVE_ASSERTIONS  No hay tarjetas vacías ni ceros: lo que no tiene nada no se dibuja.
AUTOMATION           scripts/vuelta-de-rosca.test.mjs («TEST-AVR-029 · …»). Mutación: dibujar «Para responder»
                     con cero filas → la prueba falla.
ENVIRONMENT          `npm test`
EVIDENCE_EXPECTED    La captura de la cuenta nueva sintética (AV-16)
```

---

## TEST-AVR-030 — La sesión con letra grande

```text
TEST_ID              TEST-AVR-030
TITLE                Con letra ×1,3 o más, la fila de acciones sigue en una fila y la navegación pasa a dos, las dos
                     fijas
LEVEL                APK (lógica pura de la disposición)
PRIORITY             P2 — PV-13, a ratificar
SOURCES              PV-13 (WP-APP-VUELTA-DE-ROSCA.md:172-179) · AV-18 (:240) · maqueta 08 (:101-105)
PRECONDITIONS        `disposicionDeLaSesion` de `descanso-automatico.ts` y `disposicionDeLaBarra`.
SYNTHETIC_FIXTURE    360 dp con letra ×1, ×1,3 y ×2.
STEPS                1. Pedir la disposición en cada escala.
EXPECTED             ×1 → acciones en una fila, navegación en una. ×1,3 y ×2 → acciones en una fila (los textos
                     largos bajan a dos renglones dentro de su botón, sin cortarse), navegación en dos; las dos
                     fijas; nada se esconde.
NEGATIVE_ASSERTIONS  Ninguna escala esconde la navegación (eso sería la alternativa de PV-13, que no se eligió).
AUTOMATION           scripts/vuelta-de-rosca.test.mjs («TEST-AVR-030 · …»). Mutación: esconder la navegación con
                     ×2 → la prueba falla.
ENVIRONMENT          `npm test`; la medición del alto, en el render y en el teléfono
EVIDENCE_EXPECTED    La medición de AV-13 con ×1,3 y ×2 (AV-16)
```

---

## TEST-AVR-034 a TEST-AVR-036 — La candidata 0.23.0-candidata.1 (AV-16)

> Se escribieron con el cierre de la candidata (2026-11-08), en la rama `wp-app-vuelta-de-rosca-cierre-0.23`, después de
> publicarla. Son los oráculos de AV-16 que el paquete no numeraba en §8: lo que lee la candidata, lo que pide al
> instalarse y la prueba en el teléfono. Los dos primeros quedan probados por la CI y por las herramientas del AAB; el
> tercero es manual y queda **pendiente** hasta que Dirección haga la prueba.
>
> La 0.23.0-candidata.2 (2026-11-11, con el arreglo #250, solo de la app) lee lo mismo que la .1: se comparó tag contra
> tag (`EVIDENCIA/APP-VUELTA-DE-ROSCA/LEEME.md`, «La 0.23.0-candidata.2»). TEST-AVR-034 la cubre con lo congelado de la
> .1; TEST-AVR-035 quedó registrado con los artefactos de la .1; TEST-AVR-036 se hace con la .2.

## TEST-AVR-034 — Lo que lee la 0.23, congelado y vigente

```text
TEST_ID              TEST-AVR-034
TITLE                La 0.23.0-candidata.1 queda congelada desde su tag y en VIGENTES, y la API de hoy le responde
                     con la forma que espera
LEVEL                Dominio e integración (PostgreSQL real)
PRIORITY             P1 — DL-152: una lectura rota deja una pantalla sin abrir en el teléfono
SOURCES              AV-16 (WP-APP-VUELTA-DE-ROSCA.md:255) · DL-152 (docs/DEUDA_LEGAJO.md:5428) · §7, «Las lecturas
                     congeladas de las APK» (WP-APP-VUELTA-DE-ROSCA.md:381-385)
PRECONDITIONS        El tag `be-apk-0.23.0-candidata.1` en `6eac0a7`; `scripts/congelar-lo-que-lee-la-apk.mjs`.
SYNTHETIC_FIXTURE    `packages/domain/fixtures/lecturas-de-la-apk/0.23.0-candidata.1.json`, generado desde el tag
                     (no se edita a mano); las cuentas sintéticas de `lecturas-de-las-apk.int-spec.ts`.
STEPS                1. Congelar la 0.23 desde su tag.
                     2. Compararla con la 0.22: operaciones, forma de cada lectura, cabeceras, textos y errores.
                     3. Correr la prueba del dominio y la de integración con las cinco vigentes.
EXPECTED             1 → el archivo dice versión 0.23.0-candidata.1, versionCode 36 y el commit 6eac0a7. 2 → las
                     mismas 88 operaciones que la 0.22, cada una con la misma forma; las mismas cabeceras
                     (`training-set-targets-1,forms-format-3`) y el mismo sobre de error; los textos suman las dos
                     versiones nuevas del dominio (`RESUMENES_COMPARTIDOS` y `RESUMENES_Y_PLAN_COMPARTIDOS`), que
                     la APK no manda. 3 → VIGENTES es 0.13.2, 0.20, 0.21, 0.22 y 0.23, y cada lectura de la 0.23
                     tiene escenario y pasa.
NEGATIVE_ASSERTIONS  No se saca ninguna versión de VIGENTES (Dirección no actualizó todavía). No se edita lo
                     congelado de ninguna APK.
AUTOMATION           packages/domain/src/lecturas-de-la-apk.test.ts («DL-152 · están congeladas…») ·
                     packages/domain/src/habitos-de-la-persona.test.ts (la 0.23 lee solo las HBT de la persona) ·
                     test/integration/lecturas-de-las-apk.int-spec.ts. Mutación: sacar la 0.23 de VIGENTES → la
                     prueba del dominio falla.
ENVIRONMENT          `npm test` y la integración de la CI
EVIDENCE_EXPECTED    La CI verde del PR del cierre
```

---

## TEST-AVR-035 — Lo que pide la APK al instalarse

```text
TEST_ID              TEST-AVR-035
TITLE                La APK publicada pide los mismos permisos que la 0.22, sin alarmas exactas ni arranque al
                     encender, con el certificado de siempre y un versionCode mayor
LEVEL                Artefacto (AAB firmado y APK universal)
PRIORITY             P1 — 08, minimización; instalar encima sin desinstalar
SOURCES              AV-12 (WP-APP-VUELTA-DE-ROSCA.md:239) · AVD-5 (:300-305) · 08, minimización (:33) · §7, «Los
                     permisos» (:398-400)
PRECONDITIONS        El AAB sin firma de Actions, firmado en la PC de Dirección; la 0.22.0-candidata.1 como
                     referencia.
SYNTHETIC_FIXTURE    No usa datos: lee el artefacto.
STEPS                1. Verificar el AAB firmado (`verificar-aab.mjs`).
                     2. Armar y verificar la APK universal (`apk-desde-aab.mjs`, referencia 0.22).
EXPECTED             1 → todo bien, 21 de 21; 10 permisos, entre ellos POST_NOTIFICATIONS y VIBRATE. 2 → todo bien,
                     23 de 23: el certificado 61569691…893e06, un solo firmante, versionCode 36 contra 35 y los
                     mismos 10 permisos que la 0.22.
NEGATIVE_ASSERTIONS  El manifiesto no tiene SCHEDULE_EXACT_ALARM, USE_EXACT_ALARM ni RECEIVE_BOOT_COMPLETED. Ningún
                     archivo del bundle ni de la APK lleva credenciales.
AUTOMATION           scripts/aab/verificar-aab.mjs y scripts/aab/apk-desde-aab.mjs (se niegan a dar «todo bien» si
                     cambia un permiso) · scripts/avisos-del-telefono.test.mjs (la lista en el código).
ENVIRONMENT          La PC de Dirección, con las herramientas de `scripts/aab/`
EVIDENCE_EXPECTED    `verificacion.md` y `apk.json` en `EVIDENCIA/APP-VUELTA-DE-ROSCA/publicacion-0.23.0-candidata.1/`
```

---

## TEST-AVR-036 — La prueba en el teléfono

```text
TEST_ID              TEST-AVR-036
TITLE                En el teléfono de Dirección: Inicio, Perfil y «Quién ve qué»; la sesión con el descanso
                     automático; el permiso en el primer descanso; la vibración bloqueado; letra grande y TalkBack
LEVEL                Manual, en un teléfono Android 13 o posterior
PRIORITY             P1 — AV-16: nada de esto se aprueba sin el teléfono
SOURCES              AV-16 (WP-APP-VUELTA-DE-ROSCA.md:255) · §4.0, lo que dice TalkBack (:202-216) · AV-10 a AV-14 y
                     AV-18 (:237-242) · AVD-5 y AVD-8 (:300-318)
PRECONDITIONS        La 0.23 instalada encima de la anterior; la persona de prueba DEMO-A01 con un plan de
                     Entrenamiento activo con «Descanso recomendado» en la sesión que se hace.
SYNTHETIC_FIXTURE    La cohorte sintética de `test` (DEMO-A01 y su entrenador, DEMO-PT).
STEPS                Las Partes 1 a 7 de «La prueba de la 0.23», en EVIDENCIA/APP-VUELTA-DE-ROSCA/LEEME.md.
EXPECTED             Lo que dice cada parte de la guía, con los rótulos verificados en el código del tag. La
                     demora de la vibración bloqueado, medida en tres situaciones y anotada.
NEGATIVE_ASSERTIONS  El permiso de avisos nunca se pide al abrir la app. El aviso no nombra el ejercicio. Ningún
                     texto se corta con la letra al máximo. Ningún número califica.
AUTOMATION           Ninguna: es la prueba de una persona con el teléfono.
ENVIRONMENT          El teléfono de Dirección, con `test`
EVIDENCE_EXPECTED    La tabla «Resultados de la 0.23» completa, con hecho o pendiente en cada fila
```
