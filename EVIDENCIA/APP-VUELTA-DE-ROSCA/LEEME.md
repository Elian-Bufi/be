# WP-APP-VUELTA-DE-ROSCA — la evidencia de las etapas solo de app y de la APK 0.23.0-candidata.1

> **Estado (2026-11-08):** las etapas 1 y 2 (AV-01 a AV-14, AV-17 y AV-18) están integradas en `main` desde el
> 2026-11-07 (#247, `64508a8`) y publicadas en la APK **0.23.0-candidata.1**, una prerelease para el teléfono de
> Dirección (abajo, «La publicación de la 0.23.0-candidata.1»). La estable sigue siendo la 0.13.2. Esta carpeta junta lo
> que se puede mostrar sin teléfono, la publicación y la guía de la prueba. Las capturas de cada pantalla en los dos temas,
> el antes y el después de Inicio, la medición del alto de la sesión y la prueba en el teléfono (TalkBack, letra al máximo
> y la pantalla bloqueada durante un descanso) son de AV-16 y quedan **pendientes**: ninguna de estas pruebas las da por
> aprobadas.

## Las pruebas y sus mutaciones

Los oráculos están en `docs/paquetes/WP-APP-VUELTA-DE-ROSCA-ORACULOS.md` y sus pruebas en
`scripts/vuelta-de-rosca.test.mjs` (31 casos). Cada una se verificó rompiendo la regla en el código: la prueba tiene que
ponerse en rojo. Las 26 mutaciones dieron rojo, y el código volvió a quedar como estaba.

| Oráculo | Mutación | Resultado |
|---|---|---|
| TEST-AVR-001 | Sacar «estado» de lo que nunca se pliega | Rojo |
| TEST-AVR-002 | Tolerancia de una fila en 0,9 | Rojo |
| TEST-AVR-003 | Borrar «Registros nutricionales» de la tabla | Rojo |
| TEST-AVR-004 | Cerrar mi cuenta antes de Avisos | Rojo |
| TEST-AVR-005 | Contar también los respondidos | Rojo |
| TEST-AVR-006 | Marca sin nada para responder | Rojo |
| TEST-AVR-007 | «No los ve» para quien los recibe | Rojo |
| TEST-AVR-008 | Un vínculo en pausa que «ve» | Rojo |
| TEST-AVR-009 | Una escritura en «Quién ve qué» | Rojo |
| TEST-AVR-010 | Fichas sin el orden del plan | Rojo |
| TEST-AVR-011 | Fichas sin día elegido | Rojo |
| TEST-AVR-012 | El número de la actividad, corrido | Rojo |
| TEST-AVR-013 | El desglose sin las no realizadas | Rojo |
| TEST-AVR-014 | Los ingredientes sin plegar | Rojo |
| TEST-AVR-015 | El reloj de siempre en «Mis hábitos» | Rojo |
| TEST-AVR-016 | Descanso también con el ajuste manual | Rojo |
| TEST-AVR-017 | Descanso en pausa | Rojo |
| TEST-AVR-018 | Tildar sin cerrar la serie cronometrada | Rojo |
| TEST-AVR-019 | Descanso tras la última serie | Rojo |
| TEST-AVR-020 | De fábrica, manual | Rojo |
| TEST-AVR-021 | El ejercicio en el texto del aviso | Rojo |
| TEST-AVR-022 | La alarma exacta sin bloquear | Rojo |
| TEST-AVR-023 | La del medio habilitada en pausa | Rojo |
| TEST-AVR-024 | «Empezar serie N» como «Iniciar descanso» | Rojo |
| TEST-AVR-029 | «Para responder» con cero filas | Rojo |
| TEST-AVR-030 | Esconder la navegación con letra grande | Rojo |

Además siguen verdes, sin cambiar lo que esperan, las pruebas del registro de comidas y de los formularios (TEST-AVR-014)
y la de la corrida (`tiempos-en-el-telefono.test.mjs`). Las de la navegación, la barra, Inicio y los permisos se
actualizaron solo en lo que DL-166 cambió, como pide AV-02 y AV-12.

## Dónde quedó cada cosa (AV-02, AV-03)

La tabla vive en `apps/mobile/src/perfil.ts` (`DONDE_QUEDO_CADA_COSA`) y la prueba busca cada enlace en su archivo.

| Lo que era | Dónde estaba | Dónde está |
|---|---|---|
| Vínculos | Menú | Perfil · Tus profesionales · Vínculos y solicitudes |
| Tu historial de entrenamiento | Menú | Entrenamiento · pestaña Historial |
| Registros nutricionales | Menú | Nutrición · pestaña Registros |
| Notas entre tus profesionales | Cuenta | Perfil · Tu información |
| Tengo un código | Cuenta | Perfil · al pie de Tus profesionales |
| Estado de la cuenta | Cuenta | Perfil · Mis datos |
| Tu nombre | Cuenta | Perfil · Mis datos (y arriba, en quién sos) |
| Tu identificador BE | Cuenta | Perfil · quién sos, con «Compartir» |
| Privacidad y consentimientos | Cuenta | Perfil · Ajustes |
| Apariencia | Cuenta | Perfil · Ajustes, ahí mismo |
| Avisos en este teléfono | Cuenta | Perfil · Ajustes · Avisos |
| Seguridad (cerrar sesión) | Cuenta | Perfil · Ajustes · Sesión y este teléfono |
| Cerrar mi cuenta | Cuenta | Perfil · Ajustes, al final |
| La bandeja de formularios | Información | Perfil · Formularios y pedidos |
| Mis hábitos | Información | Perfil · Tu información |

## Qué se pliega en cada pantalla (AV-01; GUIA-UX-UI III.7)

| Pantalla | A la vista | Plegado |
|---|---|---|
| Inicio · la sesión de hoy | Nombre, estado, «Empezar» y «Ya la hice» | «6 ejercicios · 18 series»: el bloque, la semana y los ejercicios |
| Inicio · «Para responder» | Qué es, quién lo pide, desde cuándo y si se puede responder | Nada |
| Perfil | Todo | Nada: el detalle está en cada destino |
| «Quién ve qué» | Quién, el área, desde cuándo y si ve | «Qué incluye»: la finalidad y el área |
| Registrar una comida | La foto, el nombre, las cifras y «Comí esta opción» | Ingredientes y preparación |
| Responder un formulario | Quién lo pide y «Queda como declarado por vos» | «Para qué lo pide», con «Podés no responder» |
| La sesión · el descanso | El conteo, el recomendado y la barra | «Cómo funciona el descanso», en la hoja del engranaje |

## Los íconos nuevos (AV-09)

La lámina a 18, 20 y 24 dp, en los dos temas, está en `iconos/` con su `LEEME.md`.

## La publicación de la 0.23.0-candidata.1

| Dato | Valor |
|---|---|
| Archivo | `be-0.23.0-candidata.1-6eac0a7.apk` |
| SHA-256 | `00e03b00e85dabb11929d25e516efeb9d3aa834abd9679e4d77ced3319203799` |
| Tamaño | 84.533.669 bytes |
| Versión | `0.23.0-candidata.1`, versionCode 36 (la 0.22.0-candidata.1 tenía 35) |
| Commit construido | `6eac0a7b18c364e7835a3e2063e207bf8460dc9b`, en la rama `aab/candidata-0.23.0-1`: `main` en `64508a8` (#247) + `6eac0a7` (la versión, que solo cambia `apps/mobile/app.config.ts`). Las herramientas del AAB ya están en `main` desde #223, así que esta vez no hizo falta la unión de esa rama |
| Entrega | La prerelease `be-apk-0.23.0-candidata.1`, con el APK y su `.sha256`: https://github.com/Elian-Bufi/be/releases/tag/be-apk-0.23.0-candidata.1 |

El mismo camino que la 0.22: GitHub Actions construye **sin firma** y la PC de Dirección firma y verifica. La keystore no
sale de esa PC.

1. **AAB sin firma** en la corrida 42437557282 de `aab-sin-firma.yml` (push a `aab/candidata-0.23.0-1`), en 13 minutos
   (11 de construcción, según `construccion.json`). `be-0.23.0-candidata.1-6eac0a7-sin-firma.aab`, 57.955.273 bytes,
   SHA-256 `4261532398156f5f56ada7362a85659239facd99030ffc53a7ae7d60f9b34c1f`. Es la misma huella que imprime el
   registro de la corrida, y el artefacto se borró de GitHub.
2. **Firma** con `scripts/aab/firmar-aab.mjs` y la keystore de EAS desde el respaldo de Dirección. Las 1.303 entradas
   quedaron iguales y solo se agregaron `META-INF/MANIFEST.MF`, `BE.SF` y `BE.RSA`. El AAB firmado,
   `be-0.23.0-candidata.1-6eac0a7.aab`, pesa 58.076.606 bytes, con SHA-256
   `a0fec16af7e228e2cef8020c23abad2223f94f66ade8a42dc86de35181c2fe47`, y lleva el certificado `61569691…893e06`.
3. **Verificación del AAB** con `scripts/aab/verificar-aab.mjs`: **todo bien, 21 de 21**, las mismas comprobaciones que en
   la 0.22. Los permisos son los mismos 10: POST_NOTIFICATIONS y VIBRATE ya estaban; las alarmas exactas y el arranque del
   sistema no aparecen (TEST-AVR-035).
4. **La APK universal** con `scripts/aab/apk-desde-aab.mjs`, tomando como referencia la 0.22.0-candidata.1: **todo bien,
   23 de 23.** El mismo certificado y un solo firmante; las 1.266 entradas, iguales a las de la universal; un
   versionCode mayor (36 contra 35); los mismos 10 permisos y las mismas ABI; ninguna credencial entre los 1.266 archivos
   descomprimidos.

   Tardó 19,7 s. Con 1.011 MB libres al empezar (Dirección cerró Chrome: antes había entre 140 y 500 MB y el script se
   negaba a arrancar) se corrió con `--memoria-minima 650`; la mínima entre pasos fue 940 MB.
5. **Publicación.** Se comprobó después:
   - el tag `be-apk-0.23.0-candidata.1` apunta a `6eac0a7`;
   - `releases/latest` sigue en `be-apk-0.13.2`;
   - la descarga pública da el mismo SHA-256, y GitHub informa esa huella para el archivo de la prerelease.

Los registros, sin secretos y con el client ID web de Google tapado, están en `publicacion-0.23.0-candidata.1/`:
`construccion.json`, `esperado.json`, `firma.json`, `verificacion.json` y `verificacion.md` (el AAB), `apk.json` (la
APK) y los tres `.sha256`. Salvo el client ID, son copias exactas de los de la PC de Dirección.

### Las lecturas congeladas de la 0.23 (DL-152)

`packages/domain/fixtures/lecturas-de-la-apk/0.23.0-candidata.1.json`, generado desde el tag con
`scripts/congelar-lo-que-lee-la-apk.mjs`. Se sumó a `VIGENTES` sin sacar ninguna, porque Dirección todavía no actualizó.
- **Lee las mismas 88 operaciones que la 0.22**, cada una con la misma forma: se compararon una por una. Perfil, «Quién ve
  qué», Inicio y el descanso automático usan lecturas que la APK ya hacía, y el descanso que arranca al tildar manda por
  API-TIE-01 los eventos de siempre.
- **Las cabeceras, el sobre de error y los detalles de rechazo son los de la 0.22.** Declara `training-set-targets-1` y
  `forms-format-3`.
- **Los textos suman dos versiones** del tablero del profesional (`RESUMENES_COMPARTIDOS` y
  `RESUMENES_Y_PLAN_COMPARTIDOS`, DL-163): el script congela todas las del dominio del commit, y la APK no manda ninguna
  de las dos.
- **No hizo falta un escenario nuevo** en `lecturas-de-las-apk.int-spec.ts`: la 0.23 corre los de la 0.22.

Los oráculos del cierre, TEST-AVR-034 a 036, están en `docs/paquetes/WP-APP-VUELTA-DE-ROSCA-ORACULOS.md`.

## La prueba de la 0.23

Es la prueba de AV-16 en el teléfono de Dirección. Nada de lo que sigue está aprobado hasta que se haga y se anote en
«Resultados de la 0.23».

**Qué cambia respecto de la 0.22** (DL-166, etapas 1 y 2; `docs/paquetes/WP-APP-VUELTA-DE-ROSCA.md` §4.1 y §4.2):
- **Perfil reemplaza a «Información»** como quinto destino de la barra, y se lleva Cuenta y el menú de la cabecera. La
  cabecera queda con la marca y Novedades. Perfil lleva un punto mientras haya algo para responder.
- **Inicio va por acciones:** «Entrenamiento de hoy» con «Empezar» y «Ya la hice», las comidas como fichas, «Para
  responder» y, al bajar, «Para mirar». El detalle va plegado.
- **«Quién ve qué»**, nueva y solo de lectura, dentro de Perfil.
- **La sesión en curso:** el descanso arranca solo al tildar la serie, con una barra hasta el recomendado y un engranaje
  con sus ajustes; abajo hay una fila fija con «Pausar», «Empezar serie N» y «Siguiente ejercicio».
- **El aviso del descanso con el teléfono bloqueado:** un aviso local, por el canal «El descanso», que vibra y no nombra el
  ejercicio. El permiso de avisos se pide recién en el primer descanso. Las alarmas exactas quedan bloqueadas, así que
  Android puede demorarlo: eso es lo que se mide en la Parte 5.

**Antes de empezar:**
- La 0.23 está publicada como prerelease (arriba, «La publicación de la 0.23.0-candidata.1»). Con la sesión cerrada, la
  bienvenida dice «app 0.23.0-candidata.1 · test · commit 6eac0a7».
- La 0.23 no toca el servidor: el website y la API de `test` siguen como están.
- **Las cuentas** son las de la cohorte de prueba: la persona **DEMO-A01** en el teléfono y su entrenador, **DEMO-PT**, en
  la computadora. Si DEMO-A01 no tuviera un plan de Entrenamiento activo, sirve la persona de la cohorte con más historia
  (Diego Sosa) con su entrenador. Las credenciales están solo en los archivos locales de Dirección, en
  `BE-datos-locales`. Todo con datos inventados.
- **La sesión necesita un descanso recomendado.** La barra, «Llegaste a…» y la vibración salen del «Descanso recomendado»
  que carga el entrenador. Sin ese dato, el bloque dice «Descanso sin duración indicada», cuenta el tiempo sin barra y no
  vibra. Para mirarlo y cargarlo:
  1. **Computadora:** entrar a https://be-web-1ngj.onrender.com/pro con DEMO-PT, abrir a DEMO-A01 y su plan de
     Entrenamiento. En la tabla de cada ejercicio, la columna «Descanso recomendado» tiene que decir un tiempo, no «Sin
     objetivo».
  2. Si falta: «Nueva versión del plan» → en cada ejercicio de la sesión que se va a hacer, «Descanso recomendado» (va como
     02:30 o en segundos; para la prueba conviene uno corto, 01:00) → «Guardar cambios» → «Revisar el plan» → «Activar
     plan».
- **Si quedó una sesión abierta de otra prueba,** Inicio y Entrenamiento lo dicen con «Tenés un entrenamiento sin
  finalizar». Para esta prueba, resolverla primero: continuarla y finalizarla, o «Dejarlo incompleto».
- **El permiso de avisos es de la app, no de la cuenta.** Si en este teléfono ya se le dio a BE (por ejemplo, para las
  novedades, en «Avisos»), la 0.23 no lo vuelve a pedir y la Parte 4 se anota como «ya estaba dado». Si se le negó, el
  bloque dice «Vibra solo con la app abierta. Podés dar el permiso de avisos en Perfil, en «Avisos».», y para la Parte 5
  hay que darlo en los ajustes de Android (Apps → BE → Notificaciones). No hace falta desinstalar: desinstalar borra la
  sesión guardada.
- Para la Parte 5 hace falta un reloj aparte (otro teléfono, un reloj de pulsera o el de la computadora).

Cada rótulo de esta guía se verificó en el código publicado, la APK en `6eac0a7` (el tag): los textos en
`apps/mobile/src/textos-de-la-vuelta.ts`, `textos-del-descanso.ts`, `textos-de-la-sesion.ts` y
`packages/domain/src/copy-entrenamiento-por-serie.ts`; las pantallas en `apps/mobile/src/pantallas/inicio*.tsx`,
`perfil.tsx`, `quien-ve-que.tsx`, `entrenamiento.tsx` y `sesion-enfocada.tsx`; la fila en `fila-fija.tsx`; el aviso en
`avisos-del-telefono.ts` y `descanso-automatico.ts`. Del website se usan solo los rótulos del plan de Entrenamiento
(`packages/domain/src/copy-entrenamiento.ts`).

**Parte 1 · Instalar** (teléfono)
1. Abrir https://github.com/Elian-Bufi/be/releases/tag/be-apk-0.23.0-candidata.1 y bajar
   `be-0.23.0-candidata.1-6eac0a7.apk`.
2. Instalarla encima de lo que haya (la 0.22, la 0.21 o la 0.20), sin desinstalar.
3. Cerrar la sesión no hace falta: si se quiere ver la bienvenida, dice «app 0.23.0-candidata.1 · test · commit 6eac0a7».

**Parte 2 · Inicio, Perfil y su punto, y «Quién ve qué»** (DEMO-A01)
1. **Inicio.** Arriba, «Hola» y la fecha. Después:
   - «Entrenamiento de hoy», con «Empezar» y «Ya la hice» lado a lado. Si el plan no tiene agenda, dice «Tu plan tiene
     varias sesiones. Elegí la que hiciste o vas a hacer.» y cada sesión trae sus botones: BE no elige.
   - Debajo de los botones, plegado, «N ejercicios · M series». Al tocarlo se abre el detalle y no cambia nada de lo de
     arriba.
   - «Comidas»: una ficha por comida del plan. La registrada dice «Registrado · hh:mm»; la que sigue (la primera sin
     registrar en el orden del plan, no por la hora) va con «Registrar».
   - «Para responder», con la cuenta, solo si hay algo: una fila por formulario o pedido de hábitos, con quién lo pide y
     desde cuándo. Sin nada para responder, el bloque no aparece.
   - Al bajar, «Para mirar»: la última toma y «Tu actividad», con «Últimos 30 días» y un número de sesiones registradas,
     sin porcentaje. Debajo, «Ver tu historial».
   - No hay «Ir a Entrenamiento», «Ir a Nutrición» ni «Ir a Información».
2. **La cabecera** tiene la marca y Novedades. Ya no están el avatar ni el menú.
3. **La barra:** el quinto destino es «Perfil», con el ícono de persona.
   - **Con algo en «Para responder»,** Perfil lleva un punto, sin número. Abrir Perfil no lo saca.
   - Para verlo irse: responder lo pendiente (o decirle «No, por ahora» a un pedido de hábitos). Un formulario saca el punto
     solo al responderse: «Eligió no responder» llega con la etapa 3.
   - Si no hay nada para responder, la persona de la computadora (DEMO-PT) puede pedirle un formulario a DEMO-A01, desde
     su ficha, con «Pedir información».
4. **Perfil**, de arriba abajo:
   - el nombre visible (o «Agregá tu nombre», si no tiene), el identificador BE y el botón para compartirlo;
   - «Tu información», con cuatro baldosas: «Mis datos», «Mis hábitos», «Quién ve qué» y «Notas entre tus profesionales»;
   - «Tus profesionales», uno por fila con su área y «desde el …», y al pie «Vínculos y solicitudes» y «Tengo un código»;
   - «Formularios y pedidos», con «Para responder» y «Respondidos» (este, solo si hay alguno);
   - «Ajustes»: «Apariencia», que se cambia ahí mismo; «Avisos»; «Privacidad y consentimientos»; «Sesión y este
     teléfono»; y «Cerrar mi cuenta», al final. **No tocar «Cerrar mi cuenta».**
5. **Lo que se mudó:** «Tu historial» está en Entrenamiento, en la pestaña «Historial», con una línea arriba: «Últimos 30
   días: N realizadas, N con desvío y N no realizadas.», cuyo total es el número de Inicio. Los registros nutricionales
   están en Nutrición, en la pestaña «Registros».
6. **«Quién ve qué»** (Perfil → «Quién ve qué»):
   - arriba, «Tratamiento de tus datos de salud», con «Lo autorizaste. Sin esto, ningún profesional ve tus datos de
     salud.» e «Ir a Privacidad»;
   - una tarjeta por profesional, con «Lo que autorizaste» y una línea por área: «Entrenamiento · desde el …». Un vínculo en
     pausa dice «El vínculo está en pausa: mientras tanto, no ve tus datos.»;
   - «Qué incluye», plegado, con la finalidad, el área y «Solo lo de esa área, mientras el vínculo esté vigente y tu
     autorización siga activa.»;
   - la línea de hábitos: «Tus hábitos: Los ve», «Tus hábitos: Te pidió verlos · No los ve» o «Tus hábitos: No los ve»,
     con ícono y sin colores;
   - «Ver el vínculo» e «Ir a Mis hábitos» llevan a la pantalla de siempre. Esta vista no cambia nada.

**Parte 3 · Una sesión con el descanso automático** (DEMO-A01)
1. Inicio → «Entrenamiento de hoy» → «Empezar» en la sesión que tiene el descanso cargado. Se abre la sesión, ya
   cronometrándose. La primera vez de la cuenta aparece «Guardamos los tiempos que marcás para que vos y tu entrenador
   puedan revisarlos», con «Entendido».
2. **Abajo, la fila fija**, apoyada sobre la barra, también fija y opaca: «Pausar», «Empezar serie 1» y «Siguiente
   ejercicio» (este, si hay otro ejercicio). Al desplazar la pantalla, nada pasa por debajo y lo último se ve entero.
3. Tocar **«Empezar serie 1»**: la serie empieza a medirse y el botón del medio pasa a «Terminar serie 1».
4. Hacer la serie y **tildar la casilla de la serie 1**, al final de su fila. En el mismo toque la serie queda registrada,
   su medición se cierra y **arranca el descanso**. Debajo del ejercicio y arriba de las series aparece el bloque:
   - «Descanso · tras la serie 1» y, al lado, el engranaje;
   - el conteo grande y «de 1:00 recomendado» (o el tiempo que haya cargado el entrenador);
   - la barra, de 0:00 al recomendado;
   - «Al terminar, seguís con la serie 2».
5. **Al llegar al recomendado**, con la app abierta, el teléfono vibra dos veces y la barra queda llena. El conteo sigue,
   sin cambiar de color: llegar al recomendado no corta nada.
6. Con el descanso corriendo, la fila dice **«Empezar serie 2»**. Un toque termina el descanso y arranca la serie 2 a la
   vez: el bloque del descanso se va y el botón pasa a «Terminar serie 2». Probar un doble toque rápido: tiene que contar
   como uno solo.
7. **El engranaje** está al lado del bloque del descanso, no en Perfil: con «Al guardar la serie», se ve mientras corre un
   descanso (al lado de «Descanso · tras la serie …»). Abre «Cómo funciona el descanso», con dos frases y:
   - «Empezar el descanso»: «Al guardar la serie» (viene elegido) o «Lo inicio yo»;
   - «Vibrar al llegar al recomendado», marcado, y debajo «También con el teléfono bloqueado.», marcado;
   - al pie, «Estos ajustes quedan en este teléfono.»
   Se cierra con la cruz («Cerrar los ajustes del descanso»).
8. **Pasarlo a manual:** en el engranaje, «Lo inicio yo», y cerrar. Tildar la serie siguiente: queda registrada y el
   descanso **no** arranca. El bloque dice «Descanso», «Recomendado tras la serie N: …» y el botón «Iniciar descanso».
   Tocarlo: arranca el descanso. Volver a dejar «Al guardar la serie» al terminar esta parte.
9. **La última serie de un ejercicio:** al tildarla no arranca ningún descanso. Lo mismo con la última de la sesión.
10. **Pausar:** «Pausar» en la fila. Arriba aparece «Sesión en pausa»; la fila muestra «Reanudar» a la izquierda y el
    botón del medio queda deshabilitado (TalkBack dice «En pausa no se mide nada: reanudá para seguir.»). Si había un
    descanso corriendo, se cierra. «Reanudar» vuelve a habilitarlo.
11. **Destildar** una serie con su descanso corriendo: el descanso se cierra y la serie vuelve a quedar sin registrar, con
    lo que tenía escrito.
12. **«Siguiente ejercicio»** pasa al ejercicio que sigue. «Finalizar entrenamiento» está al final de la pantalla, no en
    la fila.

**Parte 4 · El permiso de avisos, en el primer descanso** (solo si BE todavía no tiene el permiso en este teléfono)
1. En el primer descanso que arranca, el bloque suma: «Con el teléfono bloqueado, BE vibra con un aviso. Para eso falta tu
   permiso de avisos.», con «Permitir avisos» y «Ahora no». **No aparece al abrir la app**, solo acá.
2. «Ahora no»: el pedido se va y no vuelve en esta sesión de la app.
3. En el descanso siguiente (o en otra sesión de la app), «Permitir avisos»: recién ahí aparece el diálogo de Android.
   Elegir «Permitir».
4. Si se elige «No permitir», el bloque y el engranaje dicen «Vibra solo con la app abierta. Podés dar el permiso de avisos
   en Perfil, en «Avisos».» Para seguir con la Parte 5, darlo en los ajustes de Android.
5. En los ajustes de Android (Apps → BE → Notificaciones) aparece un canal nuevo, «El descanso», además de «Novedades de
   BE».

**Parte 5 · La vibración con la pantalla bloqueada, y cuánto se demora** (con el permiso dado)
1. Con el descanso automático y vibrar encendidos (los de fábrica), tildar una serie que no sea la última del ejercicio.
   Anotar la hora exacta en el reloj aparte (o mirar el conteo del bloque).
2. Bloquear el teléfono con el botón de encendido enseguida y dejarlo quieto, con la pantalla apagada.
3. Cuando vibre, anotar la hora. **La demora** es lo que pasó entre el recomendado y la vibración. Se repite tres veces:
   - con la pantalla bloqueada y el teléfono en reposo sobre la mesa;
   - con la app en segundo plano (ir a otra app, sin bloquear);
   - con la pantalla bloqueada durante un descanso más largo (de 2 minutos o más), si el plan lo tiene.
4. El aviso dice solo «Tu descanso llegó al recomendado»: **no nombra el ejercicio** ni muestra datos. Tocarlo abre BE.
5. **Lo que lo cancela:** empezar la serie antes del recomendado, pausar, destildar o finalizar. En cada caso, bloquear el
   teléfono y comprobar que **no** vibra a la hora del recomendado. Probar al menos una.
6. Con la app abierta en la sesión, al llegar al recomendado vibra la app, sin el aviso en la barra de notificaciones.

**Parte 6 · «Empezar serie» en un toque, «Pausar» y letra grande**
1. Repetir el paso 6 de la Parte 3 con el teléfono en una mano y el pulgar: «Empezar serie N» tiene que quedar a mano, y
   un toque tiene que bastar.
2. **Letra grande:** en Android, Ajustes → Pantalla → Tamaño de la fuente, al máximo. Volver a BE:
   - Inicio: «Empezar» y «Ya la hice» se apilan enteros, uno debajo del otro, sin cortarse;
   - la barra pasa a dos filas, con el punto de Perfil en su lugar;
   - en la sesión, la fila de acciones sigue en una fila (un texto largo baja a dos renglones dentro de su botón), la
     barra va en dos filas debajo, y al abrir se ven el ejercicio y el bloque del descanso entero. Nada se corta ni se
     achica. Es PV-13, a ratificar: si a Dirección no le sirve, la alternativa es esconder la barra durante la sesión con
     letra grande.
   - «Pausar» y «Reanudar» también con letra grande.
3. Volver la letra al tamaño de siempre.

**Parte 7 · TalkBack** (Ajustes → Accesibilidad → TalkBack)
Lo que dice cada pieza, según el código. Es la tabla de §4.0 del paquete; lo que cambia de la tabla está marcado.

| Pieza | Lo que tiene que decir |
|---|---|
| La barra, en Perfil | «Perfil», con la pestaña seleccionada; con algo para responder, «Perfil, hay algo para responder». Sin pendientes no dice nada de más |
| La cabecera | «Novedades, N sin leer» (o «Novedades»). «BE» se lee una vez |
| Una ficha de comida | «Desayuno, registrado a las 8:40» o «Almuerzo, registrar», como botón |
| El desplegable de la sesión | «N ejercicios · M series», contraído; al tocarlo, expandido |
| «Para responder» en Inicio | «Para responder: N» |
| Quién ve qué | «Tus hábitos: no los ve» (o «los ve»). El ícono del ojo no se lee |
| La casilla de una serie | «Registrar la serie N», con su estado; al tildarla, «Serie N registrada» |
| El descanso, al empezar | «Descanso iniciado, recomendado 1 minuto». **Dice solo los minutos enteros:** es el hallazgo de abajo, que se arregla en la próxima candidata |
| El descanso, al recomendado | «Llegaste a 1 minuto». Nada en el medio |
| La barra del descanso | «N segundos de M», solo si se la recorre |
| El engranaje | «Ajustes del descanso», botón. En la hoja, «Empezar el descanso» como grupo de opciones con la elegida marcada, y las dos casillas |
| La fila fija | «Pausar», «Empezar serie N» (o «Terminar serie N») y «Siguiente ejercicio», como botones. En pausa, el del medio dice «Empezar serie N. En pausa no se mide nada: reanudá para seguir.», deshabilitado |

**Lo que se encontró al escribir la guía** (contra el código publicado; no se corrigió en la 0.23, que ya estaba armada):

| Hallazgo | Severidad | Qué pasa | Decisión |
|---|---|---|---|
| TalkBack dice el descanso en minutos enteros | Baja | `duracionParaLeer` (`pantallas/sesion-enfocada.tsx`) redondea para abajo: un recomendado de 1:30 se lee «1 minuto», y uno de 45 segundos, «menos de un minuto» («Llegaste a menos de un minuto»). La tabla de §4.0 pide «1 minuto 30». La pantalla muestra el tiempo exacto | **Dirección, 2026-11-08: va en la próxima candidata.** En la 0.23 se prueba tal como está |
| El pedido de permiso no se puede volver a ver | Informativo | En un teléfono que ya respondió el diálogo de Android («Permitir» o «No permitir»), Android no lo vuelve a mostrar | Ninguna: la Parte 4 vale solo para un teléfono donde BE todavía no pidió permiso de avisos |

### Resultados de la 0.23

| Parte | Qué se mira | Resultado | Nota |
|---|---|---|---|
| 1 | Instala encima, sin desinstalar, y la sesión sigue | pendiente | |
| 2 | Inicio por acciones, sin «Ir a…» | pendiente | |
| 2 | Perfil, su punto y lo que se mudó | pendiente | |
| 2 | «Quién ve qué» | pendiente | |
| 3 | El descanso arranca al tildar, con su barra y «Al terminar, seguís con…» | pendiente | |
| 3 | El engranaje y «Lo inicio yo» | pendiente | |
| 3 | La última serie del ejercicio no arranca descanso | pendiente | |
| 4 | El permiso, en el primer descanso y no al abrir | pendiente | |
| 5 | Vibra con la pantalla bloqueada: demora en reposo | pendiente | |
| 5 | Vibra con la app en segundo plano: demora | pendiente | |
| 5 | El aviso no nombra el ejercicio; lo que lo cancela | pendiente | |
| 6 | «Empezar serie N» en un toque; doble toque, uno solo | pendiente | |
| 6 | «Pausar» y «Reanudar» | pendiente | |
| 6 | Letra al máximo: Inicio, barra y sesión | pendiente | |
| 7 | TalkBack, pieza por pieza | pendiente | |

## Lo que falta (AV-16 y la etapa 3)

- Las capturas de cada pantalla en Claro y Azul noche, y el antes y el después de Inicio (palabras y botones).
- La medición del alto que queda para el contenido en la sesión, a 360 dp con letra ×1, ×1,3 y ×2 (AV-13, AV-18).
- En el teléfono, con la 0.23: la guía de arriba, «La prueba de la 0.23» (TEST-AVR-036), con TalkBack en cada pieza de
  §4.0, la letra al máximo, y la vibración con la pantalla bloqueada durante un descanso, con su demora medida (AVD-5).
- El arreglo de TalkBack en minutos enteros, en la próxima candidata (decidido por Dirección el 2026-11-08).
- Promover a estable sigue la regla de DL-152: no antes de la prueba de punta a punta, y solo con el «pasala a estable» de
  Dirección.
- La etapa 3 (AV-15 «Arranca sola» y AV-19 «Eligió no responder»), con servidor y base. Hasta entonces, la hoja del
  engranaje tiene dos ajustes y un formulario saca la marca de Perfil solo al responderse.
