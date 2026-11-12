# WP-EDITORES-PROFESIONAL — los oráculos TEST-EDP y RM

> **Qué es esto.** El paquete declara sus oráculos en una línea por parte (`WP-EDITORES-PROFESIONAL.md` §5 y §5.9).
> Acá van escritos con los trece campos que la §6 del 11A declara obligatorios (11A:150-169), como los de
> `WP-FORMULARIOS-DE-INICIO-ORACULOS.md`, **antes del código de cada parte**. Empieza con la definición de terminado de
> diez puntos (ED-00, V3 05 §D).
>
> **Qué no es esto.** No modifica el 11A, protegido por `docs/MANIFEST.sha256`. Cuando Dirección consolide, toma estos
> oráculos y reemite el documento.
>
> **De dónde sale cada oráculo.** Del paquete (las partes, con su Dado/Cuando/Entonces), de DL-167 y DL-171
> (`docs/DEUDA_LEGAJO.md`; aprobadas por Dirección el 2026-11-12) y de las normas que citan. Un oráculo derivado dice qué
> hay que observar para aceptar la prueba; no inventa la regla, la lee.
>
> **Cómo crece.** Este archivo tiene los de la **etapa 1** (§8 del paquete): ED-01 a ED-07, ED-60 a ED-63 y ED-65 en el
> website, y ED-71 en el dominio (RM-01 a RM-35 y RM-43), más las transversales que esos textos ya tienen que cumplir
> (TEST-EDP-044 y 045). Los demás se escriben acá antes del código de su parte (al final, la lista).
>
> **Cada negativa tiene su mutación:** con el defecto, la prueba falla. La mutación se hace sobre una copia del archivo y
> se restaura desde esa copia, nunca con git; el registro de cada una va en el commit de su parte.

---

## La definición de terminado (ED-00; V3 05 §D)

Una parte de este paquete está terminada cuando cumple los diez puntos, y cada uno se dice con su estado de evidencia
(implementado, verificado automáticamente, observado en una captura real, solo en maqueta, pendiente de prueba manual):

1. **Cada botón** tiene su función, su estado (encendido o apagado con su motivo), su alcance (a qué se aplica), su
   permiso (lo decide la API) y su respuesta ante un error, dicha en palabras.
2. **Lo guardado vuelve sin pérdida:** lo que el servidor confirmó se relee igual, y nada se da por guardado sin su
   respuesta. Nada se guarda en el navegador (DL-148 D-5).
3. **Los totales y las cuentas salen de la fuente** (una función del dominio, la misma que usa la API), nunca de un
   texto ni de una suposición; lo que falta dice «Sin dato».
4. **Teclado, foco, lector, contraste y zoom al 200 %:** todo se opera con el teclado; el foco se ve (ámbar) y vuelve
   adonde estaba; los avisos se anuncian (`aria-live` o `role="alert"`); nada depende solo del color; AA en los dos
   temas; al 200 % no se pierde ninguna función.
5. **Capturas a 1280, 1440 y 1920,** en Claro y en Azul noche, de lo que cambió.
6. **Lo que ve la app de la persona** no cambia sin una decisión (DL-152, con la enmienda de DL-169).
7. **El historial:** las versiones activadas no se tocan; una corrección es un registro nuevo.
8. **Los textos** pasan las guardias del repo (T13, las de cada área y la de fuerza), en rioplatense, sin códigos
   internos a la vista y sin calificar.
9. **Las pruebas:** los oráculos de su parte, verdes, cada negativa con su mutación verificada.
10. **La integración con su aprobación:** el PR con la CI verde, integrado cuando Dirección lo autoriza.

---

## TEST-EDP-002 — Descartar la versión en preparación (ED-01)

```text
TEST_ID              TEST-EDP-002
TITLE                Una versión en preparación se descarta con confirmación; la vigente nunca ofrece descartar
LEVEL                Unitario del website (sin React) y recorrido de navegador (CI)
PRIORITY             P0 — un borrador que no sirve traba otra versión y las plantillas (A30, B26)
SOURCES              Paquete ED-01 · DL-163 D-21 (TB-47; API-PLE-05 y API-PLN-07, integradas el 2026-11-07) ·
                     DL-148 (el autoguardado) · UC-P10/UC-P15 (versión privada → revisar → activar)
PRECONDITIONS        Profesional del área con un plan vigente (versión N activada) y una versión en preparación que
                     nunca se activó, sacada de la N.
SYNTHETIC_FIXTURE    La cohorte sintética de los recorridos (test/navegador/preparar.mjs), con cuentas
                     @example.invalid; ningún dato real.
STEPS                1. En el editor, abrir «⋯ → Descartar la versión en preparación».
                     2. Mirar el cuadro: título, de qué versión salió, que no se deshace, el botón enfocado.
                     3. «Cancelar».
                     4. Volver a abrirlo y confirmar; simular que la primera respuesta se pierde y volver a confirmar.
                     5. Volver al plan.
                     6. Abrir el plan vigente (sin borrador) y buscar la acción de descartar.
EXPECTED             2 → el cuadro dice el nombre del plan, «Sale de la versión N», «No se puede deshacer» y, si hay
                     cambios sin guardar, que también se pierden; «Cancelar» tiene el foco. 3 → nada cambió: el
                     borrador sigue. 4 → el borrador deja de existir; el segundo intento reusa la misma
                     Idempotency-Key que el primero. 5 → la vigente no cambió y vuelven «Ajustar el plan» y
                     «Empezar desde una plantilla». 6 → la vigente no ofrece descartar.
NEGATIVE_ASSERTIONS  «Cancelar» o Escape no llaman a la API. Una versión activada nunca muestra «Descartar». Un
                     segundo clic no manda una clave nueva. El cuadro no tiene más de un botón principal.
AUTOMATION           apps/web/test/descartar-el-borrador.test.mjs («TEST-EDP-002 · …») sobre
                     `advisees/descartar-el-borrador.ts` (qué se ofrece y la clave) y la lectura de los editores ·
                     recorrido `descartar` en test/navegador/recorridos.mjs (si entra en la etapa; si no, declarado)
ENVIRONMENT          Local (node --test) y CI (recorridos: website + API + PostgreSQL)
EVIDENCE_EXPECTED    La corrida verde de la CI en el PR; la captura del cuadro en el recorrido
```

---

## TEST-EDP-003 — Salir con cambios sin guardar (ED-02)

```text
TEST_ID              TEST-EDP-003
TITLE                Un enlace interno con cambios sin guardar guarda antes de salir o pregunta; nunca pierde en silencio
LEVEL                Unitario del website (la decisión, sin React) y recorrido de navegador (CI)
PRIORITY             P0 — se pierde lo escrito en los 4 s de la pausa del autoguardado (§4 del paquete)
SOURCES              Paquete ED-02 y ED-D10 (decidida, reescrita) · DL-148 (autoguardado; D-5, nada en el
                     navegador) · DL-145 · `marco-del-area.tsx` (beforeunload)
PRECONDITIONS        Un editor de plan con una versión en preparación.
SYNTHETIC_FIXTURE    La cohorte sintética de los recorridos.
STEPS                1. Escribir un cambio y, antes de la pausa, tocar un enlace interno de la barra («Mis recetas»).
                     2. Volver al editor.
                     3. Escribir un cambio que no se puede guardar (un nombre vacío) y tocar el enlace.
                     4. En el cuadro, «Seguir editando»; después, de nuevo, «Salir sin guardar».
                     5. Con la red cortada, escribir y tocar el enlace.
                     6. Con un 409 de versión al guardar, escribir y tocar el enlace.
EXPECTED             1 → aparece «Guardando antes de salir…» y se sale con la respuesta del servidor. 2 → el cambio
                     está. 3 → no se sale: el cuadro «Tenés cambios sin guardar», con «Seguir editando» (principal)
                     y «Salir sin guardar». 4 → «Seguir editando» deja todo como estaba y el foco vuelve al enlace;
                     «Salir sin guardar» sale. 5 y 6 → el mismo cuadro, sin salir.
NEGATIVE_ASSERTIONS  Nunca se sale con un cambio sin guardar sin el cuadro o sin la respuesta del servidor. Nada se
                     escribe en localStorage ni en sessionStorage. Sin cambios, el enlace navega sin preguntar.
AUTOMATION           apps/web/test/salida-segura.test.mjs («TEST-EDP-003 · …») sobre `lib/salida-segura.ts`
                     (`queHacerAlSalir`) y la lectura de la barra y del marco del área (cada enlace interno pasa por
                     la guardia) · recorrido `salidaSegura` (si entra en la etapa; si no, declarado)
ENVIRONMENT          Local (node --test) y CI
EVIDENCE_EXPECTED    La corrida verde de la CI en el PR
```

«Atrás» del navegador queda como un límite declarado (ED-D10).

---

## TEST-EDP-004 — El estado de guardado, inequívoco, y el error recuperable (ED-03)

```text
TEST_ID              TEST-EDP-004
TITLE                «Guardado» solo con la respuesta del servidor; cada fallo dice qué pasó y ofrece «Reintentar»
LEVEL                Unitario (dominio y website)
PRIORITY             P0 — un profesional que cree guardado lo que no se guardó (A07, B28)
SOURCES              Paquete ED-03 y DJ-6 («Guardar ahora», fijo y secundario) y DJ-10 («Guardado», sin hora,
                     después de recargar) · DL-148 · DL-168 (`falloDeGuardado`, los tres fallos) · `COPY_GUARDADO`
PRECONDITIONS        Un editor de plan con cambios.
SYNTHETIC_FIXTURE    Respuestas simuladas de la API (sin red): 503, sin respuesta, 400 TOO_BIG, 409, 200.
STEPS                1. Recorrer los estados con `estadoDeGuardado` (dominio): guardando, sucio, sin poder guardar,
                        fallo, conflicto y guardado con hora y sin hora.
                     2. Leer `COPY_GUARDADO.noSePudoReintento`.
                     3. Mirar el componente del estado: el texto, el ícono, «Reintentar» y el detalle técnico.
                     4. Mirar la barra de los dos editores: «Guardar ahora» y su motivo cuando no hay nada que guardar.
EXPECTED             1 → cada estado es el texto del dominio; «Guardado a las HH:MM» solo después de una respuesta
                     2xx; después de recargar, «Guardado» sin hora. 2 → nombra «Guardar ahora», no «Guardar
                     cambios». 3 → un fallo muestra su texto, «Reintentar» y, plegado, la operación y el código
                     (sin datos de la persona); el texto lleva ícono, no solo color. 4 → «Guardar ahora» existe en
                     los dos editores, es secundario y, sin nada que guardar, está apagado con `aria-disabled` y su
                     motivo.
NEGATIVE_ASSERTIONS  «Guardado» nunca aparece con un fallo, un conflicto o sin respuesta. Ningún texto de la barra
                     dice «Guardar cambios». El detalle técnico no lleva nombres ni identificadores de la persona.
AUTOMATION           apps/web/test/estado-de-guardado.test.mjs («TEST-EDP-004 · …») ·
                     apps/web/test/guardado-de-planes-grandes.test.mjs (DL-168, sigue verde)
ENVIRONMENT          Local (node --test) y CI (verificar)
EVIDENCE_EXPECTED    La corrida verde de la CI en el PR
```

---

## TEST-EDP-005 — Los avisos se actualizan al corregir (ED-04)

```text
TEST_ID              TEST-EDP-005
TITLE                Un formulario que mostró sus errores los recalcula al corregir, sin mover el foco
LEVEL                Unitario del website (la validación por campo) y lectura de los formularios
PRIORITY             P0 — avisos que siguen a la vista después de corregir (A25, A26, B03, B12-B14, C03, C06, C07,
                     C12; confirmado en código, §4 del paquete)
SOURCES              Paquete ED-04 · B10-10 (accesibilidad y textos) · RNF-ACC-001 · GUIA-UX-UI (formularios)
PRECONDITIONS        Un formulario de los que lista ED-04 que ya se intentó enviar con errores.
SYNTHETIC_FIXTURE    Valores sintéticos en memoria.
STEPS                1. Intentar enviar vacío: aparecen el resumen y los avisos por campo.
                     2. Corregir un campo y salir de él.
                     3. Corregir el último campo con error.
                     4. Escribir de nuevo un valor inválido en un campo ya corregido, sin salir de él.
EXPECTED             2 → el aviso de ese campo se va al salir de él y el resumen se recalcula. 3 → el resumen
                     desaparece y un lector de pantalla oye «Listo para registrar» (región aria-live). 4 → el aviso
                     no aparece mientras se escribe: aparece al salir del campo.
NEGATIVE_ASSERTIONS  El foco no salta mientras se escribe. Antes del primer intento de envío no se muestra ningún
                     error. Un aviso de un campo corregido no sigue a la vista.
AUTOMATION           apps/web/test/avisos-al-corregir.test.mjs («TEST-EDP-005 · …») sobre
                     `components/validacion-viva.ts` y la lectura de los formularios que la usan
ENVIRONMENT          Local (node --test) y CI
EVIDENCE_EXPECTED    La corrida verde de la CI en el PR
```

---

## TEST-EDP-006 — Textos sin códigos internos (ED-05)

```text
TEST_ID              TEST-EDP-006
TITLE                Ningún texto visible del website profesional dice un código interno
LEVEL                Estático (T13 sobre los textos del dominio que usa el website) y unitario del dominio
PRIORITY             P0 — «Sucede a la v2 (DL-165, ronda 2.1)…» a la vista del profesional (C13)
SOURCES              Paquete ED-05 · DL-165 · `packages/domain/src/plantillas-de-inicio.ts` (los propósitos) ·
                     scripts/copy-pantallas.test.cjs (T13)
PRECONDITIONS        Las plantillas de inicio vigentes, con su propósito guardado (inmutable).
SYNTHETIC_FIXTURE    Las plantillas del dominio (sin datos de personas).
STEPS                1. Para cada plantilla, pedir su descripción para el profesional por su clave.
                     2. Recorrer con T13 los textos del dominio que muestra el website y las pantallas de /pro.
                     3. Mutación: agregar «(DL-1)» a una descripción.
EXPECTED             1 → cada plantilla tiene una descripción en palabras para el profesional. 2 → ningún texto
                     dice `DL-`, `TB-`, `RF-`, `UC-`, `API-`, `REG-`, «ronda» ni un código parecido. 3 → la
                     prueba falla.
NEGATIVE_ASSERTIONS  El propósito guardado de una versión de plantilla no cambia (las versiones son inmutables).
                     «Pedir información» no muestra el propósito crudo.
AUTOMATION           packages/domain/src/descripciones-de-plantillas.test.ts · scripts/copy-pantallas.test.cjs
                     (la regla nueva de T13) · apps/web/test/... (la lectura de `forms/pedir.tsx`)
ENVIRONMENT          Local y CI
EVIDENCE_EXPECTED    La corrida verde de la CI en el PR, con la mutación anotada en el commit
```

---

## TEST-EDP-007 — «Persona» en todo el website profesional (ED-06)

```text
TEST_ID              TEST-EDP-007
TITLE                El website profesional dice «persona» (o el nombre) y nunca «asesorado»
LEVEL                Estático (T13)
PRIORITY             P0 — dos palabras para lo mismo en la misma frase (§4 del paquete; ED-D9, decidida)
SOURCES              Paquete ED-06 y ED-D9 · DL-169 (el nombre) · la ficha canónica · `copy-*.ts`
PRECONDITIONS        El código de `apps/web/src/app/pro/**`, sus componentes y los textos del dominio que usa.
SYNTHETIC_FIXTURE    —
STEPS                1. T13 recorre los textos visibles de /pro y los del dominio que muestran.
                     2. Mutación: volver a escribir «Tus asesorados» en un texto.
EXPECTED             1 → ningún texto visible tiene «asesorad», salvo la lista cerrada de excepciones legales con
                     versión (cambian en su versión siguiente). 2 → la prueba falla y nombra el texto.
NEGATIVE_ASSERTIONS  El legajo no cambia. Los identificadores del código (nombres de variables, rutas como
                     /pro/advisees) no son textos visibles y no cuentan.
AUTOMATION           scripts/copy-pantallas.test.cjs (T13, la regla de «asesorad» en /pro)
ENVIRONMENT          Local y CI
EVIDENCE_EXPECTED    La corrida verde de la CI en el PR, con la mutación anotada en el commit
```

---

## TEST-EDP-008 — «Antes de activar»: la validación final sigue siendo de la API (ED-07)

```text
TEST_ID              TEST-EDP-008
TITLE                «Revisar y activar…» abre siempre el cuadro; el principal no se enciende con algo por corregir
LEVEL                Unitario del website (sin React) y lectura de los editores
PRIORITY             P0 — lo que impide activar aparece después de elegir la fecha (A10, A20-A22, B20, B22, B23)
SOURCES              Paquete ED-07 y DJ-6 · UC-P15/UC-P16 · REG-06-145 y TB-15 («Sin fecha por ahora») · DL-148
PRECONDITIONS        Un editor con una versión en preparación (Entrenamiento o Nutrición).
SYNTHETIC_FIXTURE    Borradores sintéticos en memoria: con una sesión sin ejercicios, listo, con cambios sin guardar.
STEPS                1. Con una sesión sin ejercicios, tocar «Revisar y activar…».
                     2. Con cambios sin guardar, abrir el cuadro.
                     3. Con un borrador listo, abrir el cuadro y mirar la fecha.
                     4. Mirar de dónde sale la validación final.
EXPECTED             1 → el cuadro abre con «Tren superior liviano: sin ejercicios · Ir a corregir» y «Activar la
                     versión N de Entrenamiento» apagado, con su motivo («Falta corregir 1 cosa»). 2 → ofrece
                     primero «Guardar ahora», y el principal sigue apagado hasta la respuesta del servidor. 3 →
                     «¿Cuándo la revisás?», con «Sin fecha por ahora» y nada elegido; el principal se enciende
                     recién con una elección. 4 → antes de activar se pide la validación a la API (API-TRN-11 /
                     API-NUT-11) y la activación la decide la API.
NEGATIVE_ASSERTIONS  El principal nunca se enciende con algo por corregir, con cambios sin guardar ni sin una
                     elección de fecha. «Sin fecha por ahora» nunca desaparece. Hay un solo botón principal.
AUTOMATION           apps/web/test/antes-de-activar.test.mjs («TEST-EDP-008 · …») sobre `advisees/antes-de-activar.ts`
                     (el estado del principal y su motivo) y la lectura de los dos editores
ENVIRONMENT          Local (node --test) y CI
EVIDENCE_EXPECTED    La corrida verde de la CI en el PR
```

---

## TEST-EDP-009 — El resumen de «Antes de activar» no califica (ED-07)

```text
TEST_ID              TEST-EDP-009
TITLE                Los contadores salen de la diferencia y nada del resumen califica el plan
LEVEL                Unitario del website (sin React) y estático (T13)
PRIORITY             P0 — «Revisar» no juzga la calidad (§3 del paquete; TEST-PRJ-009)
SOURCES              Paquete ED-07 · TEST-PRJ-009 · B10-06:563-591 · las guardias de Entrenamiento y de Nutrición
PRECONDITIONS        Una vigente y un borrador con cambios conocidos.
SYNTHETIC_FIXTURE    Dos estructuras sintéticas en memoria (la vigente y el borrador).
STEPS                1. Comparar la vigente con el borrador (`comparar-versiones`).
                     2. Pasar los textos del resumen por las guardias.
                     3. Mutación: contar desde un texto en lugar de la diferencia, o sumar «cumplimiento».
EXPECTED             1 → «2 modificados · 1 agregado · 0 quitados» y la lista («+1 sesión · Tren superior liviano»,
                     «Sentadilla: 4×3 → 4×6-8»), contados de la diferencia; sin vigente, todo es «agregado». 2 →
                     ningún texto califica ni lleva color de estado. 3 → la prueba falla.
NEGATIVE_ASSERTIONS  Ningún «óptimo», «mejor», «cumplimiento», «adherencia» ni «racha». Los contadores no salen de
                     un texto. Nada se marca en verde o rojo por bueno o malo.
AUTOMATION           apps/web/test/antes-de-activar.test.mjs («TEST-EDP-009 · …») sobre `advisees/comparar-versiones.ts`
ENVIRONMENT          Local (node --test) y CI
EVIDENCE_EXPECTED    La corrida verde de la CI en el PR
```

---

## TEST-EDP-044 — Ningún texto nuevo dice «cumplimiento», «adherencia» ni «racha» (transversal)

```text
TEST_ID              TEST-EDP-044
TITLE                Los textos nuevos del paquete no dicen «cumplimiento», «adherencia» ni «racha», tampoco en negación
LEVEL                Estático (las guardias de las áreas y T13)
PRIORITY             P0 — B05 del encargo del 23/10
SOURCES              Paquete §3 y §9 · TERMINOS_PROHIBIDOS_DE_ENTRENAMIENTO y de Nutrición · T13
PRECONDITIONS        Los textos nuevos de cada parte, en el dominio o en el website.
SYNTHETIC_FIXTURE    —
STEPS                1. Pasar cada texto nuevo por la guardia de su área (y la de fuerza para ED-71).
                     2. Mutación: una frase con «sin cumplimiento».
EXPECTED             1 → ningún hallazgo. 2 → la guardia la marca.
NEGATIVE_ASSERTIONS  La negación no exime: «no es cumplimiento» también falla.
AUTOMATION           Las pruebas de cada parte (cada una pasa sus textos por su guardia) · scripts/copy-pantallas.test.cjs
ENVIRONMENT          Local y CI
EVIDENCE_EXPECTED    La corrida verde de la CI en el PR
```

## TEST-EDP-045 — Ningún color nuevo dice bien o mal (transversal)

```text
TEST_ID              TEST-EDP-045
TITLE                Los estados nuevos se dicen con texto e ícono; los tokens nuevos tienen su par de contraste
LEVEL                Estático (scripts/contraste.test.cjs) y lectura de los componentes
PRIORITY             P1 — el cuerpo y el plan no se califican con color (§3)
SOURCES              Paquete §3 y ED-18 · GUIA-UX-UI I.6 · RNF-ACC-001 · B10-10
PRECONDITIONS        Los componentes nuevos de la etapa.
SYNTHETIC_FIXTURE    —
STEPS                1. Mirar cada estado nuevo (guardado, fallo, conflicto, impide activar): texto e ícono.
                     2. Si hay un token nuevo, su par en contraste.test.cjs.
EXPECTED             1 → ninguno depende solo del color. 2 → cada token nuevo pasa 4,5:1 (texto) o 3:1 (borde).
NEGATIVE_ASSERTIONS  Ningún verde o rojo dice «bien» o «mal».
AUTOMATION           Las pruebas de cada parte (lectura de los componentes) · scripts/contraste.test.cjs
ENVIRONMENT          Local y CI
EVIDENCE_EXPECTED    La corrida verde de la CI en el PR
```

---

## TEST-EDP-047 — El autoguardado no insiste ante un error que no se arregla solo (ED-60)

```text
TEST_ID              TEST-EDP-047
TITLE                Después de un rechazo permanente no hay otro intento sin un cambio; sin respuesta, la espera crece
LEVEL                Unitario del website, con temporizadores falsos (node:test mock.timers)
PRIORITY             P0 — subidas repetidas de hasta 700 KB y rechazos auditados cada 4 s (V3 PR-B)
SOURCES              Paquete ED-60 · DL-148 (la pausa de 4 s) · DL-168 (`falloDeGuardado`: DEMASIADO_GRANDE,
                     SIN_RESPUESTA, OTRO)
PRECONDITIONS        Un editor habilitado para autoguardar, con cambios.
SYNTHETIC_FIXTURE    Un guardado simulado que falla con cada motivo, sin red.
STEPS                1. Un cambio; a los 4 s, el guardado falla con DEMASIADO_GRANDE; avanzar 10 minutos sin cambios.
                     2. Lo mismo con OTRO.
                     3. Un cambio después del fallo permanente; avanzar 4 s.
                     4. Un guardado que falla con SIN_RESPUESTA una y otra vez; medir las esperas.
                     5. Con la espera en 60 s, el evento `online`; otra vez, un cambio.
EXPECTED             1 y 2 → un solo intento: ninguno más sin un cambio o sin «Reintentar». 3 → un intento a los
                     4 s. 4 → las esperas son 4, 8, 16, 32 y 60 s, y después cada 60 s. 5 → vuelve a 4 s en los
                     dos casos. Con la regla de hoy (un intento cada 4 s), la prueba falla (mutación).
NEGATIVE_ASSERTIONS  Un rechazo permanente nunca se reintenta solo. Sin respuesta, nunca más de un intento por
                     espera.
AUTOMATION           apps/web/test/autoguardado.test.mjs («TEST-EDP-047 · …») sobre
                     `lib/espera-del-autoguardado.ts` y la lectura de `lib/autoguardado.ts` y los dos editores
ENVIRONMENT          Local (node --test) y CI
EVIDENCE_EXPECTED    La corrida verde de la CI en el PR, con la mutación anotada en el commit
```

---

## TEST-EDP-048 — Sin conflicto falso por una respuesta perdida (ED-61)

```text
TEST_ID              TEST-EDP-048
TITLE                Si lo guardado es lo que esta pantalla mandó y no tuvo respuesta, no hay conflicto
LEVEL                Unitario del website (sin React) y lectura de los editores
PRIORITY             P0 — «Cargar la versión guardada» descartaba lo escrito después: pérdida de datos (V3 X-02)
SOURCES              Paquete ED-61 · DL-148 (el conflicto explícito, 409, que no pisa nada) · DJ-9
PRECONDITIONS        Un editor que mandó un guardado cuya respuesta se perdió y siguió escribiendo.
SYNTHETIC_FIXTURE    Estructuras sintéticas de Entrenamiento y de Nutrición en memoria, con y sin identificadores
                     del servidor.
STEPS                1. Comparar la versión releída con el cuerpo que se mandó sin respuesta, sin los
                        identificadores que puso el servidor.
                     2. Comparar con un cuerpo distinto (otra pestaña cambió el borrador).
                     3. Adoptar la versión del servidor: el token y los identificadores, conservando lo escrito
                        después.
                     4. Mutación: comparar con los identificadores incluidos.
                     5. La relectura que sigue al 409 tampoco responde (sin red o un 5xx).
EXPECTED             1 → coincide: el editor adopta la versión, vuelve a mandar lo escrito después y no muestra el
                     conflicto. 2 → no coincide: conflicto real, y «Cargar la versión guardada» avisa que
                     reemplaza lo que está en pantalla. 3 → lo escrito después sigue en pantalla, con los
                     identificadores del servidor en lo que ya existía. 4 → el caso 1 da conflicto: la prueba falla.
                     5 → no hay conflicto: queda el fallo sin respuesta, con su detalle; lo mandado sigue en la
                     lista, y el intento siguiente vuelve a dar 409 y a releer (revisión adversaria de la etapa 1).
NEGATIVE_ASSERTIONS  Un conflicto real nunca se toma por propio. Lo escrito después nunca se pierde al adoptar. Una
                     relectura que no respondió nunca se toma por un conflicto.
AUTOMATION           apps/web/test/es-lo-que-mande.test.mjs («TEST-EDP-048 · …») sobre
                     `advisees/es-lo-que-mande.ts` · el recorrido «respuesta perdida» (si entra en la etapa; si
                     no, declarado)
ENVIRONMENT          Local (node --test) y CI
EVIDENCE_EXPECTED    La corrida verde de la CI en el PR, con la mutación anotada en el commit
```

---

## TEST-EDP-049 — Activar después de un 409 o un 422 (ED-62)

```text
TEST_ID              TEST-EDP-049
TITLE                Un 409, un 422 o una activación sin respuesta releen la versión y dicen lo que pasó
LEVEL                Unitario del website (sin React) y lectura de los editores
PRIORITY             P0 — «No pudimos activar el plan. Probá de nuevo.», y reintentar daba lo mismo (V3 V-02)
SOURCES              Paquete ED-62 · DL-148 · 09 (API-TRN-12, API-NUT-12: Idempotency-Key, expectedVersion) ·
                     `lib/intento.ts`
PRECONDITIONS        «Antes de activar» abierto con una versión lista.
SYNTHETIC_FIXTURE    Respuestas simuladas: 409 VERSION_CONFLICT, 409 de otro motivo, 422 con problemas, sin
                     respuesta; y la versión releída (activada, en preparación con otro token, otra activada).
STEPS                1. Activar y recibir cada rechazo; releer.
                     2. Con el resultado incierto, «Volver» y reintentar.
EXPECTED             1 → «Ya quedó activa» si la versión está activada; el conflicto, si otra pestaña cambió el
                     borrador o activó otra; con un 422, lo que impide activar, con su lugar. Cada código tiene su
                     texto. 2 → la clave de idempotencia se conserva y el intento siguiente la reusa.
NEGATIVE_ASSERTIONS  Nunca «Probá de nuevo» genérico ante un 409 o un 422. Con el resultado incierto, «Volver» no
                     descarta la clave.
AUTOMATION           apps/web/test/activar-tras-un-rechazo.test.mjs («TEST-EDP-049 · …») sobre
                     `advisees/resultado-de-activar.ts` y `lib/intento.ts`
ENVIRONMENT          Local (node --test) y CI
EVIDENCE_EXPECTED    La corrida verde de la CI en el PR
```

---

## TEST-EDP-050 — El RIR de «Analizar» dice de dónde sale (ED-63)

```text
TEST_ID              TEST-EDP-050
TITLE                La métrica del RIR no dice que lo declaró la persona
LEVEL                Unitario del dominio
PRIORITY             P0 — un RIR que pudo venir del plan se presentaba como «declarado» (INV-06-152; TEST-PRJ-004)
SOURCES              Paquete ED-63 · DL-171 (el dato) · `metricas-del-analisis.ts` · `serieAlTildar` de la APK
PRECONDITIONS        El diccionario de métricas de «Analizar».
SYNTHETIC_FIXTURE    —
STEPS                1. Leer el nombre, la explicación y los límites de `entrenamiento.rir`, y la versión del
                        diccionario.
                     2. Mutación: volver a «declaró la persona».
EXPECTED             1 → se llama «RIR registrado en la serie» y dice «Lo escribió la persona o, si dejó el campo
                     vacío, quedó el del plan. Hasta que la app guarde quién escribió cada dato, no se
                     distinguen.»; la versión del diccionario sube. 2 → la prueba falla.
NEGATIVE_ASSERTIONS  Ningún texto de la métrica dice «declaró» ni «declarado».
AUTOMATION           packages/domain/src/metricas-del-analisis.test.ts (o la prueba del diccionario que ya
                     existe), «TEST-EDP-050 · …»
ENVIRONMENT          Local y CI
EVIDENCE_EXPECTED    La corrida verde de la CI en el PR
```

Con ED-70 (etapa 2), la forma del punto según la procedencia se suma a este oráculo.

---

## TEST-EDP-052 — Recetas y plantillas avisan al salir con cambios (ED-65)

```text
TEST_ID              TEST-EDP-052
TITLE                Cada editor del website profesional con cambios tiene la guardia de salida
LEVEL                Unitario del website (la lista de editores) y lectura de los componentes
PRIORITY             P0 — el editor de recetas y las plantillas no avisaban (V3 X-02)
SOURCES              Paquete ED-65 y ED-02 · DL-119 (guardar una receta crea una versión)
PRECONDITIONS        Una receta o una plantilla con cambios.
SYNTHETIC_FIXTURE    —
STEPS                1. Recorrer la lista de editores (planes, recetas, plantillas): cada uno registra sus cambios
                        en la guardia.
                     2. Con una receta con cambios, tocar un enlace interno o recargar.
                     3. Mutación: sacar la guardia de un editor de la lista.
EXPECTED             1 → todos la usan. 2 → «Tenés cambios sin guardar», con «Seguir editando» como principal; la
                     receta no se guarda sola. 3 → la prueba falla y nombra el editor.
NEGATIVE_ASSERTIONS  La receta nunca se guarda sola al salir (guardar crea una versión).
AUTOMATION           apps/web/test/salida-segura.test.mjs («TEST-EDP-052 · …»)
ENVIRONMENT          Local (node --test) y CI
EVIDENCE_EXPECTED    La corrida verde de la CI en el PR, con la mutación anotada en el commit
```

---

## RM-01 a RM-35 y RM-43 — el método Epley v1 (ED-71)

```text
TEST_ID              RM-01 … RM-35 · RM-43
TITLE                El método BE-E1RM v1 (EPLEY_V1): la cuenta, las bandas, lo que entra, la regla por sesión y la vista
LEVEL                Unitario del dominio (sin base ni red)
PRIORITY             P1 (la vertical de fuerza); cada negativa, con su mutación
SOURCES              DL-171 (aprobada el 2026-11-12) · paquete §5.8 (ED-71 y la tabla RM) · ED-D18 (la lista de la
                     v1, por `exerciseId` del catálogo base: migración 20261019120000) · REG-06-158 (mostrar no
                     redondea en silencio) · REG-06-202 a 207 (T-06-N12) · INV-06-192 · B10-08 · DL-126
PRECONDITIONS        Series de entrada armadas en memoria con la forma del método (`SerieParaEstimar`): la fuente
                     (la persona o el profesional), cómo se cargó, la procedencia por campo, la carga con su unidad
                     y su base, las repeticiones con su base, el RIR, si el ejercicio se sustituyó, el `exerciseId` y
                     la fecha civil de la ejecución.
SYNTHETIC_FIXTURE    Las series de la tabla de §5.8, sin personas.
STEPS                Una prueba por fila de la tabla de abajo, con la función pública del método.
EXPECTED             Lo de la columna «Resultado» de cada fila.
NEGATIVE_ASSERTIONS  Ninguna estimación desde lo indicado, ni con un valor del plan, ni sin procedencia; nunca un 0
                     supuesto; nunca «la mayor estimación» de la sesión; nunca kg y lb juntos; ningún texto con
                     «1RM real», «máximo real», «récord», «marca personal», «nuevo máximo», «test de 1RM» ni «probá
                     tu máximo», tampoco en negación; ningún «±» ni intervalo.
AUTOMATION           packages/domain/src/estimacion-de-fuerza.test.ts (una prueba por RM, con su ID en el nombre)
ENVIRONMENT          Local (node --test sobre el dist del dominio) y CI (verificar)
EVIDENCE_EXPECTED    La corrida verde de la CI en el PR, con las mutaciones anotadas en el commit de ED-71
```

| ID | Caso | Resultado esperado |
|---|---|---|
| RM-01 | Una serie que viene de la prescripción (70 × 12, RIR 0), sin registro | Ningún valor: «lo indicado no es fuerza» |
| RM-02 | Escrita por la persona: 70 × 12 con RIR 0, del 11/11 | 98,0 kg (n_eq 12), orientativa, con la fecha civil de la sesión |
| RM-03 | 80 × 6 con RIR 2 | 101,33 (n_eq 8), núcleo; a la vista «≈ 101,5 kg» |
| RM-04 | 70 × 12 con RIR 2 | Fuera (n_eq 14), con su motivo; ni 102,6 ni 102,7 a la vista |
| RM-05 | 90 × 5 con RIR 0 | 105,0 kg, núcleo |
| RM-06 | 100 × 1 con RIR 0 | 100,0 kg (n_eq 1: la carga), nunca 103,3, y nunca «1RM real» |
| RM-07 | 100 × 1 con RIR 2 | 110,0 kg (n_eq 3), núcleo: «estimación», nunca «orientativa» |
| RM-08 | Sin RIR | Fuera («sin RIR»); nunca se supone 0 |
| RM-09 | 15 repeticiones | Fuera (más de 12 equivalentes) |
| RM-10 | Press de banca con barra y press en máquina | Nunca en la misma línea: la identidad es el `exerciseId` (y la máquina no está en la lista) |
| RM-11 | Una corrección cambia la carga de la serie elegida | La de la persona (PERSON) se recalcula; la del profesional, sin procedencia en ese valor, queda fuera con su motivo |
| RM-12 | Un solo punto; después, dos | Con uno, ninguna diferencia; con dos, «estimación: 90 → 98 kg», nunca un % |
| RM-13 | Cualquier texto del método | Nunca «1RM real», «máximo real», «récord» ni «marca personal» |
| RM-14 | Cada valor | Dice la especificación, la versión y el método (BE-E1RM, 1, EPLEY_V1) |
| RM-15 | Una sesión del 11/11 a las 23:30 en la zona de la persona | La fecha del valor es la civil de la ejecución (11 nov), nunca la de UTC |
| RM-16 | Un ejercicio fuera de la lista | Sin valor |
| RM-17 | Una dominada sin carga | Sin valor |
| RM-18 | La misma serie, reproducida | La v1 da el mismo valor; nunca dos valores del mismo método para la misma serie |
| RM-19 | La persona corrige el RIR de 2 a 1 | Un valor nuevo con la corrección; el método no lee el plan |
| RM-20 | El profesional cambia el RIR objetivo | Ninguna estimación cambia: el método no lee la prescripción |
| RM-21 | Cada valor | Dice de dónde sale («la escribió Diego en la app» o «la observó Martín») y su fecha; nunca «validado» |
| RM-22 | Cada vista | Sin intervalo ni «±»; al medio kilo (o la libra entera), con «≈»; la décima, solo en «Cómo se calculó» |
| RM-23 | Una serie de carga rápida (`AS_PLANNED`) | Sin valor |
| RM-24 | La persona escribe solo las repeticiones | Fuera («la carga y el RIR son los del plan») |
| RM-25 | Un ejercicio sustituido en la sesión | Fuera |
| RM-26 | 0 kg | Sin valor |
| RM-27 | 70 × 10 con RIR 2, y 70 × 12 con RIR 0 | n_eq 12 las dos: 98,0 kg, orientativas |
| RM-28 | 80 × 6 con RIR 1,5 | 100,0 kg (n_eq 7,5), núcleo |
| RM-29 | Series en kg y en lb del mismo ejercicio | Dos series aparte; nunca se convierte |
| RM-30 | La carga por implemento, o las repeticiones por lado | Fuera en la v1 |
| RM-31 | Cualquier estimación | Ningún aviso, novedad ni «Te toca a vos»: el método no los produce y sus textos no los nombran |
| RM-32 | Los textos nuevos | Pasan las guardias de Entrenamiento y de fuerza, con su mutación |
| RM-33 | Una serie registrada antes de la procedencia | Fuera, con su motivo |
| RM-34 | En una sesión, 80 × 10 con RIR 1 (109,3) y 95 × 3 con RIR 1 (107,7) | Se toma 95 × 3: 107,7 kg; nunca la mayor estimación |
| RM-35 | Dos series que entran, con la misma carga | La primera de la sesión |
| RM-43 | Una sesión: 70 × 12 RIR 0 y 65 × 8 RIR 2 | Apagado, 65 × 8: 86,67, «≈ 86,5 kg»; encendido, 70 × 12: 98,0 |

RM-36 a RM-42 (la observación, el cálculo de la carga y los permisos) se escriben acá con ED-72, ED-76 y ED-74.

La regla del RIR explicada al profesional (Dirección, 2026-11-12, sobre R3) es un texto del método
(`COPY_FUERZA.reglaDelRir`): RM-32 lo pasa por las guardias, y TEST-EDP-063 y 065 (ED-73 y ED-75) comprueban que está
en «Cómo se calculó» y en el estado vacío de la tarjeta.

---

## Los que se escriben antes de su parte

- **Etapa 2:** TEST-EDP-010 (ED-08), 011 (ED-10), 012 a 014 (ED-11), 015 (ED-12), 016 (ED-13), 017 y 055 (ED-14),
  018 y 054 (ED-15), 019 (ED-16), 020 (ED-17), 053 (ED-18), 021 (ED-20), 022 (ED-21), 023 (ED-22), 024 y 056
  (ED-23), 025 (ED-24), 026 (ED-25), 051 (ED-64), 059 y 060 (ED-70), 061 y 062 (ED-72), 064 (ED-74) y 067.
- **Etapa 3:** TEST-EDP-027 a 035, 057 y 058 (Nutrición, pedir información y vincular), 063 (ED-73), 065 (ED-75) y
  066 (ED-76), con RM-36 a RM-42.
- **Etapa 4:** TEST-EDP-036 a 043 (P2) y TEST-EDP-046.
- **ED-00:** TEST-EDP-001 (las 73 tareas, con su hash), con la corrida de la línea de base.
