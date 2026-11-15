# WP-COMPARTIR — compartir casi por omisión, con una sola pantalla de consentimiento

> Decisión de Dirección del 2026-11-15, textual: «tiene que ser algo casi por default, o que la opción sea súper sencilla,
> lo único que tiene que generar rozamiento debería ser el conectar con el profesional, sea por QR, link, o lo que sea,
> pero después los permisos para que vean los datos y que puedan compartir los datos de otras áreas etc… sea casi como
> aceptar todo, pero es el centro de la app casi, que se pueda ver el historial para planificar con conciencia de otras
> áreas… simplemente el permiso es por el área legal y su consentimiento de datos de salud».
>
> Rama `wp-compartir`, desde `main` con #284 (la historia anterior). Registro en `docs/DEUDA_LEGAJO.md` (DL-176). Las
> decisiones de continuador (CMP-D1 a CMP-D16) están **a ratificar**.

## 0. Lo que había y lo que cita

**El problema.**
- **Compartir entre áreas no tenía pantalla.** La API lo permitía (API-RES-02 y 03, y API-RES-09 y 10 para los pedidos),
  pero la APK solo lo leía («quién miró», PG-12) y nadie lo escribía: solo lo tenían las cuentas de la cohorte, cargadas así.
- **La historia anterior se pidió como algo aparte y opcional** (DL-175, HA-T01: «Ahora no» era lo por omisión).
- **Aceptar a un profesional eran varios actos separados:** aceptar el vínculo, después autorizar su área (B2), si faltaba
  el tratamiento de los datos de salud (A3) otro más, y los hábitos en «Mis hábitos».

**Lo que cita.**
- **Ley 25.326, art. 5:** el consentimiento libre, expreso e informado (y art. 7, los datos sensibles).
- **08 §12.2** (el texto que se muestra es el que se acepta), **08 §12.3** (el aviso del perfil del profesional), **08 C-12**
  (ampliar es una aceptación nueva), **08 §14.1** (la historia previa, con el consentimiento de la persona), **RNF-PRI-002**
  (retirar corta desde ese momento).
- **10-B04 §7-§9:** «Aceptar vínculo» y la prohibición de «Aceptar y compartir datos» **al aceptar el vínculo**, «porque
  fusiona vínculo + B2»; CAND-10-CON-A (el B2 es un acto explícito, sin casilla premarcada). **INV-06-53:** la aceptación no
  crea el B2. **10-B02 §7:** el A3 es un acto aparte.
- **Precedentes de BE:** DL-163 D-13 (lo de otras áreas), DL-165 D-9 y D-25 (los hábitos y sus pedidos), DL-175 (la historia
  anterior, HA-T01 y HA-T16), DL-115 (el A3 con el acto tomado), DL-137 D-7 (lo nuevo va en operaciones nuevas), DL-152 (las
  lecturas de la APK se congelan con su candidata).

## 1. Lo que quedó

| Pieza | Qué es | Dónde |
|---|---|---|
| CMP-P1 | La lógica pura: qué se puede compartir, qué va marcado, qué depende de qué, la versión de lo que se vio y lo que escribe cada acto | `packages/domain/src/compartir.ts` |
| CMP-P2 | Los contratos estrictos de la familia CMP y los textos de las pantallas | `contratos-compartir.ts`, `copy-compartir.ts` |
| CMP-P3 | La API: la lectura de todo lo de la persona, el toque único en una transacción y el retiro de una cosa | `apps/api/src/compartir/` |
| CMP-P4 | El B2 y el A3 se pueden otorgar dentro de otra transacción, con la misma lógica de siempre (API-CON-02 y 06 la usan igual) | `consentimiento-profesional.service.ts` (`otorgarB2EnTransaccion`), `consentimiento-de-salud.service.ts` (`otorgarA3EnTransaccion`) |
| CMP-P5 | La pantalla única de consentimiento, en la ruta de siempre del consentimiento | `apps/mobile/src/pantallas/consentimiento.tsx` |
| CMP-P6 | Aceptar en Vínculos o por invitación (enlace, QR o código) lleva enseguida a la pantalla única | `pantallas/vinculos.tsx`, `pantallas/invitacion.tsx` |
| CMP-P7 | La tarjeta única de Inicio, para quien ya tiene vínculos: «Compartir todo con tus profesionales» | `apps/mobile/src/compartir.tsx`, `pantallas/inicio.tsx`, ruta `compartir-todo` |
| CMP-P8 | «Quién ve qué»: un interruptor por cosa debajo de cada profesional, y los pedidos para responder | `compartir.tsx`, `pantallas/quien-ve-que.tsx` |
| CMP-P9 | El OpenAPI, el cliente, la guardia de trazabilidad y la prueba de contrato | `openapi.ts`, `cliente-http.ts`, `scripts/trazabilidad-de-operaciones.test.cjs`, `test/integration/contrato.int-spec.ts` |

**La persona, en la APK.** Conecta con el profesional como siempre: en Vínculos toca «Aceptar vínculo», o abre el enlace o
el QR, o escribe el código, y toca «Aceptar vínculo». Enseguida ve la pantalla única, «Qué compartís con Lic. Sofía Paz»,
con «Vínculo aceptado» arriba y, en pocas líneas, qué ve el profesional y para qué («Lic. Sofía Paz te va a acompañar en
Nutrición. Para eso necesita ver tus datos de Nutrición. Y para planificar teniendo en cuenta todo lo tuyo, sirve que vea el
resumen y el plan vigente de tus otras áreas, y que tus otros profesionales vean lo de Nutrición.»). Después, el aviso de su
perfil (08 §12.3) y la aclaración de 10-B04:398, y «Lo que vas a compartir», una línea por cosa:
- «Tus datos de salud en BE: que BE los guarde y los use para acompañarte. Sin esto, ningún profesional ve tus datos de
  salud.» (solo si falta el A3);
- «Tus datos de Nutrición, para Lic. Sofía Paz: para acompañamiento nutricional.»;
- «El resumen y el plan vigente de Entrenamiento (de Prof. Martín Ruiz), para Lic. Sofía Paz.» y «El resumen de
  Antropometría (de …), para Lic. Sofía Paz.»;
- «El resumen y el plan vigente de Nutrición (de Lic. Sofía Paz), para Prof. Martín Ruiz.» (lo recíproco);
- «Tu historia anterior de Nutrición, para Lic. Sofía Paz: lo que pasó antes en Nutrición con otros profesionales.» (si la
  hubo);
- «Tus hábitos, para Lic. Sofía Paz.» (si corresponde).

Debajo: «Las notas privadas de tus profesionales nunca se comparten.», que todo se retira en «Quién ve qué» desde ese
momento, y «Al tocar "Aceptar y compartir" aceptás los textos de lo que compartís:», con cada texto completo plegado (su
versión, su vigencia y su huella) y el aviso de las propuestas. Los botones: **«Aceptar y compartir»** (el principal),
**«Elegir qué compartir»** (despliega un interruptor por cosa; desmarcar el A3 apaga lo que lo pide, y lo dice) y «Ahora
no» (un enlace, que no escribe nada). Al compartir: «Listo: quedó registrado lo que compartís.», con lo que se compartió,
«Ver vínculo» e «Ir a "Quién ve qué"»; si quedó faltando el A3, el último paso de siempre, con el bloque de Privacidad.

Quien ya tenía vínculos ve en Inicio, debajo del paso que falta, la tarjeta «Compartí lo tuyo entre tus profesionales» con
«Compartir todo con tus profesionales» (la misma pantalla, con todo lo de todos) y «Ahora no». Aparece una sola vez: tocar
cualquiera de los dos la da por vista en ese teléfono, para esa cuenta. En «Quién ve qué», debajo de cada profesional, «Lo
que ve de tus otras áreas»: un interruptor por cada área que se le puede compartir y otro para los hábitos, con «Lo ve
desde el …» o «No lo ve». Prenderlo abre el texto entero con «Sí, compartir»; apagarlo pide confirmación. Arriba, «Pedidos
para responder»: «Prof. Martín Ruiz te pidió ver el resumen y el plan de Nutrición, para acompañarte en Entrenamiento.», con
«Sí, compartir» y «Ahora no», del mismo peso.

## 2. Las operaciones nuevas (familia CMP, DL-176)

| ID | Método y ruta | AuthN | Qué hace |
|---|---|---|---|
| API-CMP-01 | `GET /me/sharing-proposal[?relationshipId=]` | SESSION | Lo que la persona puede compartir y lo que ya comparte, cada cosa con su clave, si está dada (y desde cuándo), si se puede dar, si va marcada y su texto; lo de otras áreas, además, el nivel que se da (`level`) y el que se ve hoy (`givenLevel`); con `relationshipId`, solo lo que toca a ese componente. La versión de lo que se ve y los textos vigentes, con su hash. No pide el A3 |
| API-CMP-02 | `POST /me/sharing-choices` | SESSION + Idempotency-Key | Un toque: todo lo elegido en una sola transacción (el A3, el B2 de cada área, lo de otras áreas, los hábitos y la historia anterior), cada acto con su texto, su versión, su hecho y su fila de auditoría. Con la versión vista y los textos mostrados |
| API-CMP-03 | `POST /me/sharing-choices/withdrawal` | SESSION + Idempotency-Key | Dejar de compartir una cosa (lo de un área con un profesional, o los hábitos con uno), desde ahora. Sin el A3 ni la versión |

Familia propia de BE: el 09 no la tiene (DL-137 D-7). La guardia de trazabilidad la declara con DL-176, y la prueba de
contrato exige cada código observado declarado (TEST-CT). Sin migración: los actos escriben en sus tablas de siempre
(`acto_registrable`, `consentimiento` y `version_de_consentimiento`, `autorizacion_de_resumenes`, `autorizacion_de_habitos`
y `autorizacion_de_historia_anterior`), con sus guardias de la base. Los cerrojos, en el orden único
(`prisma/concurrencia.ts`): la identidad (si se da el A3), los componentes que se tocan en orden de id, el acto A3 y, al
final, los de las autorizaciones, en el orden del cierre de cuenta (hábitos, lo de otras áreas, la historia anterior).
Ninguna operación de siempre cambia su contrato.

## 3. Decisiones de continuador (CMP-D1 a CMP-D16, a ratificar)

- **CMP-D1 · El vínculo se sigue aceptando aparte; la pantalla única aparece enseguida.** Conectar (aceptar el vínculo, por
  Vínculos, el enlace, el QR o el código) es el único paso aparte, como pidió Dirección. «Aceptar y compartir» es el botón de
  la pantalla de consentimiento, no el de aceptar el vínculo: 10-B04 prohíbe «Aceptar y compartir datos» al aceptar el
  vínculo porque fusiona vínculo y B2, e INV-06-53 dice que aceptar no crea el B2. Son los mismos dos toques que fusionarlos
  (ver la solicitud o la invitación, y compartir), sin tocar la regla. Alternativa: un solo toque que acepte el vínculo y
  comparta, con una operación que también lo acepte (cambia 10-B04 e INV-06-53).
- **CMP-D2 · Qué trae marcado al aceptar.** Su área (el B2); el A3, si falta; el resumen y el plan vigente de cada otra área
  de la persona para este profesional y, recíprocamente, lo de su área para cada otro profesional (el resumen solo, en
  Antropometría, que no tiene plan; el plan, con la matriz de TA-87, «todos con todos»); la historia anterior de su área, si
  antes hubo otro profesional en ella; y los hábitos, si corresponde. Al aceptar, solo lo que toca a ese vínculo; la tarjeta
  única y «Quién ve qué», todo lo de todos.
- **CMP-D3 · Lo nunca decidido va marcado; lo retirado antes, no.** Un A3 revocado, un B2 revocado, lo de otras áreas o los
  hábitos retirados (o un «no» a un profesional), y una historia anterior retirada se ofrecen sin marcar: «casi por
  omisión» no pisa una decisión de la persona. Un B2 vigente con una versión vieja del texto se ofrece marcado. **Desde la
  revisión del PR**, «retirado» no se lee solo de la versión vigente (que no lo dice si quedan otras cosas compartidas):
  API-CMP-01 lee cada renglón que tuvo alguna versión de lo de otras áreas y de los hábitos, y el último pedido de cada
  profesional. No vuelve marcado lo de un área que la persona compartió y hoy no comparte en ese nivel (lo retiró de a una
  cosa, lo retiró todo o lo bajó de nivel), lo de un pedido al que dijo «Ahora no» (mientras no lo comparta), ni los
  hábitos de un profesional que alguna versión nombró. Un renglón que se fue porque el vínculo de origen terminó no cuenta:
  el profesional nuevo del área se ofrece marcado, porque la persona no decidió nada sobre él.
- **CMP-D4 · El A3, en la misma pantalla.** «Simplemente el permiso es por el área legal y su consentimiento de datos de
  salud»: si falta el A3, es una cosa más de la pantalla, con su texto (sin él, ningún profesional ve nada). Lo de otras
  áreas, la historia anterior y los hábitos lo piden, como sus operaciones de siempre: sin el A3 dado ni marcado, no se
  pueden marcar, y la pantalla lo dice. El B2 no lo pide (API-CON-02 tampoco).
- **CMP-D5 · Los hábitos, «si corresponde».** Se ofrecen si la persona ya los comparte con alguien o si tiene hábitos
  registrados (una versión con alguna respuesta). Sin hábitos y sin compartirlos, no hay nada que compartir todavía; «Mis
  hábitos» le pregunta después, como siempre.
- **CMP-D6 · La versión de lo que se vio.** API-CMP-01 da una versión opaca de todo lo que mira (los vínculos, el A3, cada
  B2, las tres autorizaciones y si hay hábitos); API-CMP-02 la compara con los cerrojos tomados: si algo cambió, 409
  VERSION_CONFLICT y la app vuelve a leer. Los textos se comparan aparte: uno que no es el vigente, 409
  CONSENT_VERSION_STALE; uno que falta, 422 SHARING_TEXT_REQUIRED.
- **CMP-D7 · Solo lo elegido.** Lo de otras áreas se escribe renglón por renglón: lo que ya valía queda igual y se suman los
  pares elegidos (un renglón por cada componente de quien recibe y cada componente de origen). No es como API-RES-02, que
  rearma la lista desde los permisos y extendería en silencio un par ya dado a un profesional nuevo del área de origen. En
  los hábitos, los que ya los reciben siguen y se suman los elegidos; lo no elegido queda como estaba (el toque no sabe qué
  vio la persona, por ejemplo con un interruptor de «Quién ve qué», así que no dice «no» por ella).
- **CMP-D8 · Los textos, en capas.** La pantalla dice cada cosa en una línea y deja los textos completos de lo marcado en la
  misma pantalla, plegados, cada uno con su versión y su huella; el botón dice que tocarlo los acepta. Es distinto de HA-T16
  (compartir la historia anterior abría el texto entero), que sigue valiendo en «Quién ve qué»: prender un interruptor ahí
  muestra el texto entero antes de compartir. Alternativa: abrir todos los textos enteros antes de «Aceptar y compartir»
  (más fricción, que Dirección pidió evitar).
- **CMP-D9 · Retirar una cosa.** API-CMP-03 retira lo de un área con un profesional (todos sus renglones) o los hábitos con
  uno, en una versión nueva que no lo nombra (sin nadie, retirada), con la hora de la base tomado el cerrojo. No pide el A3
  ni la versión vista; dos veces, lo mismo, sin escribir. El A3, el B2 y la historia anterior se retiran con su operación
  de siempre (Privacidad, el vínculo, el interruptor de la historia), que ya cortan hacia adelante.
- **CMP-D10 · Lo ajeno responde igual que lo inexistente.** Un componente que no es de la persona (en API-CMP-01 y 02) y un
  profesional que nunca la acompañó (en API-CMP-03): el 404 de siempre. Una cosa elegida que hoy no se puede dar (ya dada,
  ajena o inexistente): el mismo 422, con el mismo cuerpo.
- **CMP-D11 · La auditoría, por acto.** Cada acto deja su fila de auditoría con API-CMP-02 y su recurso (el acto A3, el
  consentimiento, cada autorización), más la del toque; y cada uno queda como lo dejaría su operación de siempre: el texto
  con su hash, la versión, el hecho y la procedencia. Si cualquiera falla, no queda ninguno (TEST-CMP-021).
- **CMP-D12 · La tarjeta única, en el teléfono.** Se marca vista en el teléfono, por cuenta (como la explicación de los
  tiempos, AV2-33), al tocar cualquiera de sus botones; y solo aparece si hay algo de lo de otras áreas, la historia
  anterior o los hábitos para compartir marcado (el A3 y el B2 pendientes ya los recuerda Inicio con su aviso).
  Alternativa: guardar la marca en la base (una sola vez en todos los teléfonos), con una migración.
- **CMP-D13 · «Quién ve qué» deja de ser solo de lectura.** Es lo que pidió Dirección («cada cosa se puede retirar o volver a
  dar con un interruptor»). Escribe solo en sus piezas (`compartir.tsx` y la historia anterior); el B2 y el A3 se siguen
  cambiando en el vínculo y en Privacidad, que tienen sus confirmaciones. TEST-AVR-009 se actualizó.
- **CMP-D14 · Los pedidos.** «Sí, compartir» es dar esa cosa con API-CMP-02, que además acepta el pedido (como API-RES-02 y
  API-HBT-03); «Ahora no» es el NOT_NOW de siempre (API-RES-10 o API-HBT-09). Sin el A3, «Sí, compartir» no se ofrece y se
  dice por qué.
- **CMP-D15 · Una familia propia.** CMP, con tres operaciones nuevas y sin migración, en lugar de sumar parámetros a
  operaciones que la APK instalada ya lee (DL-137 D-7; DL-152). Las lecturas nuevas de la APK se congelan con la próxima
  candidata.
- **CMP-D16 · La historia anterior cambia de HA-T01.** Al aceptar a un profesional nuevo, la historia anterior es una de las
  cosas de la pantalla única, **marcada** si antes hubo otro profesional en esa área (antes: una tarjeta opcional, con «Ahora
  no» por omisión). La tarjeta opcional (HA-07) se retiró. Todo lo demás de DL-175 sigue igual.

## 4. Verificación

| ID | Qué prueba | Dónde |
|---|---|---|
| TEST-CMP-001 a 012 | El dominio: qué se ofrece al aceptar y en todo, lo retirado sin marcar, lo dado y lo completo, la historia anterior y los hábitos «si corresponde», el A3 como condición, la revisión de la elección (lo ajeno igual que lo inexistente), solo lo elegido en lo de otras áreas y en los hábitos, la versión, los contratos estrictos y el vocabulario. Cada una con su mutación | `packages/domain/src/compartir.test.ts` |
| TEST-CMP-013 | La familia CMP son tres operaciones, citan DL-176 y el 09 no la usa | `scripts/trazabilidad-de-operaciones.test.cjs` |
| TEST-CMP-014 | (De la revisión.) Lo retirado de a una cosa, lo bajado de nivel, un «Ahora no» y los hábitos de antes de un retiro de todo no vuelven marcados; lo que se fue porque un vínculo terminó, sí; el nivel que se ve hoy | `packages/domain/src/compartir.test.ts` |
| TEST-CMP-020 | Al aceptar: la propuesta y un toque que escribe todo, cada acto con su texto y su hash, la auditoría por acto, solo lo elegido; después no queda nada para dar, y la misma clave responde lo mismo | `test/integration/compartir.int-spec.ts` |
| TEST-CMP-021 | Todo o nada: con una falla de la base en el último acto, no queda ninguno; después, el mismo toque escribe todo | ídem |
| TEST-CMP-022 | Retirar cada cosa corta desde ese momento sin tocar lo demás (también sin el A3); dos veces, lo mismo; lo retirado vuelve sin marcar y pide el A3 | ídem |
| TEST-CMP-023 | Los hábitos: al elegido sí, al que no se nombró no; retirarlos corta | ídem |
| TEST-CMP-024 | Lo ajeno igual que lo inexistente (404 y 422 con el mismo cuerpo); sin el A3, 403; el texto viejo y lo que cambió, 409, sin escribir nada | ídem |
| TEST-CMP-025 | Compartir el plan con quien lo pidió acepta su pedido | ídem |
| TEST-CMP-026 | (De la revisión.) Con la autorización todavía activa, lo retirado de a una cosa y un «Ahora no» a un pedido no vuelven marcados; lo nunca decidido, sí; cada cosa dice el nivel en que se ve | ídem |
| TEST-CMP-027 | (De la revisión.) Retirar una cosa espera a la lectura en curso (el mismo cerrojo que las lecturas) y lleva la hora de la base de después, en lo de otras áreas y en los hábitos; sin pausas, con `pg_stat_activity` | ídem |
| TEST-CT (CMP) | Cada código observado de CMP-01 a 03 está declarado en el contrato | `test/integration/contrato.int-spec.ts` |
| TEST-CMP-040 a 047 | La APK: lo marcado al entrar, elegir con el A3 como condición, lo que manda el toque, los rechazos en palabras, cada cosa en una línea, la tarjeta una sola vez, los interruptores y los pedidos de «Quién ve qué», y las pantallas (TalkBack, los dos temas) | `apps/mobile/src/compartir-en-el-telefono.test.ts` |
| TEST-AVR-009, TEST-HA-045 | Las guardias que cambian: «Quién ve qué» escribe solo en sus piezas; aceptar lleva a la pantalla única y no dibuja la tarjeta opcional de la historia anterior | `scripts/vuelta-de-rosca.test.mjs`, `apps/mobile/src/historia-anterior-en-el-telefono.test.ts` |

## 5. Las dudas legales (para la validación jurídica)

1. **Lo preseleccionado y un solo botón.** El consentimiento de la Ley 25.326 tiene que ser libre, expreso e informado. Acá
   el acto expreso es tocar «Aceptar y compartir», con cada cosa dicha en una línea a la vista y la opción real de elegir
   («Elegir qué compartir») o de no hacer nada («Ahora no»). La práctica europea (el caso Planet49 del TJUE) no acepta
   casillas premarcadas como consentimiento; acá no hay casillas marcadas que se acepten por quedarse quietas, sino un
   botón que dice qué acepta. ¿Alcanza para el art. 5 y, sobre todo, para los datos sensibles del art. 7? CAND-10-CON-A
   (10-B04) pedía el B2 «sin casilla premarcada»: se tensiona. **Además (lo declara la revisión del PR):** los botones no
   pesan lo mismo. «Aceptar y compartir» es el principal, «Elegir qué compartir» el secundario y «Ahora no» un enlace, más
   discreto; en los pedidos de «Quién ve qué», en cambio, «Sí, compartir» y «Ahora no» pesan igual. Si el «libre» pide que
   decir que no sea tan fácil como decir que sí, «Ahora no» tiene que subir a un botón del mismo peso.
2. **Varios consentimientos en un toque.** Cada acto queda separado (con su texto, su versión y su auditoría), pero se dan
   juntos. ¿Es suficientemente granular, o hace falta un toque por finalidad (la del área, la de las otras áreas, la de la
   historia anterior, la de los hábitos)?
3. **El A3 en la misma pantalla.** 10-B02 lo trata como un acto aparte; acá es una cosa más de la pantalla única, marcada si
   nunca se dio. ¿Puede ir junto al B2 y a lo de otras áreas, o tiene que pedirse antes, solo?
4. **Los textos en capas.** El resumen en líneas y los textos completos plegados en la misma pantalla (CMP-D8). ¿Cumple el
   «informado» y 08 §12.2 (la mostrada es la aceptada), o hay que abrir los textos enteros antes del botón?
5. **Lo recíproco.** Aceptar a un profesional comparte lo de su área con los otros profesionales de la persona: es la
   persona la que comparte lo suyo, pero el contenido (el plan) lo escribió ese profesional. ¿Hace falta que el profesional
   lo sepa o lo acepte?
6. **Los textos siguen siendo propuestas.** Los de lo de otras áreas, los hábitos y la historia anterior tienen su id y su
   hash y dicen «Texto propuesto, pendiente de validación jurídica»; los del A3 y el B2 son los de demostración del
   catálogo. No se escribió ningún texto legal nuevo: el resumen de la pantalla es texto de la interfaz.

## 6. Lo que queda para después

- **El congelamiento:** las lecturas nuevas de la APK (API-CMP-01 a 03, y API-RES-09 y 10, que ahora lee y escribe) se
  congelan con la próxima candidata (DL-152).
- **Verlo en el teléfono:** TalkBack, la letra grande y los dos temas en un teléfono real, y la evidencia de pantalla.
- **La validación jurídica** de las dudas del §5 (si pide que decir que no pese lo mismo, «Ahora no» pasa a ser un botón
  como «Elegir qué compartir»: es un cambio de una línea).
- **El website:** no cambia (el profesional sigue viendo lo compartido por API-RES-04 y 06 y la historia anterior); la
  pantalla de la persona en el website (si se suma) es otro paquete.
- **La marca de la tarjeta en la base** (CMP-D12), si Dirección la quiere en todos los teléfonos.
- **Subir de nivel desde «Quién ve qué»:** un interruptor prendido con el resumen solo (cuando el área tiene plan) no ofrece
  sumar el plan desde ahí; lo ofrecen la tarjeta y la pantalla al aceptar.
- **El pendiente de DL-175** sobre la hora del retiro de los hábitos y de lo de otras áreas al cerrar la cuenta sigue como
  estaba (severidad baja).

## 7. Estado

| Fecha | Qué |
|---|---|
| 2026-11-15 | Programado en `wp-compartir` (PR abierto), con la CI. CMP-D1 a CMP-D16, a ratificar. |
| 2026-11-15 | Revisión adversaria (privacidad, datos y experiencia): lo retirado de a una cosa volvía marcado (alta), «Quién ve qué» decía «el resumen y el plan» de lo que se ve solo con el resumen (media) y tres detalles de TalkBack y de textos (bajas); arreglados en la rama, con TEST-CMP-014 y 026 y las pruebas de la APK ampliadas. La tabla, en el PR. |
