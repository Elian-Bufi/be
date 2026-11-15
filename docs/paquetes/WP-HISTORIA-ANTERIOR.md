# WP-HISTORIA-ANTERIOR — tu historia anterior, para el profesional nuevo

> Decisión de Dirección del 2026-11-15 («Programarlo»): si la persona cambia de profesional, con BE no empieza de cero;
> el nuevo puede ver lo que pasó antes en esa misma área, **solo si ella lo autoriza**. Rama `wp-historia-anterior`, PR
> abierto; **no se integra sin la revisión adversaria**. Registro en `docs/DEUDA_LEGAJO.md` (DL-175).

## 0. Legajo que cita

- **08 §14.1, la fila «Cambio de profesional»:** «El nuevo profesional NO hereda acceso: nuevo Vínculo + nuevo
  consentimiento; ve la historia previa **solo si el titular lo consiente** en el alcance del nuevo consentimiento»
  (REG-06-55; RF-025).
- **06 REG-06-55** (§7.9): la identidad de la persona permanece, la autoría y la procedencia históricas no cambian, y el
  nuevo profesional necesita solicitud, aceptación, consentimiento y autorización propias.
- **04 RF-025** (P0): conservar la identidad y la procedencia «sin transferir acceso automáticamente a otro profesional»;
  «cada profesional solo consulta lo autorizado». 05 §5.8.2.1.4 (escenario 4): «el nuevo profesional solo accede a lo
  autorizado específicamente».
- **08 §12.2** (el texto que se muestra es el que se acepta), **08 §19.7** (la persona ve quién accedió), **RNF-PRI-002**
  (retirar corta desde ese momento).
- **Precedentes de BE:** API-RES (DL-163 D-13: lo que la persona comparte de otras áreas, con sus lecturas a la vista),
  la autorización de los hábitos (DL-165 D-9) y el PDP (lo ajeno o lo no autorizado responde igual que lo inexistente).
  «Quién miró» (PG-12, DL-173) y las notas propias (PG-16).

## 1. Lo que quedó (programado en esta rama)

| Pieza | Qué es | Dónde |
|---|---|---|
| HA-01 | La autorización de la persona, versionada por componente de vínculo, de solo agregar | `prisma/migrations/20261115120000_historia_anterior`, `apps/api/src/historia-anterior/autorizaciones.ts` |
| HA-02 | Lo que decidió la persona y quién la miró (API-HIA-01) | `historia-anterior.service.ts` |
| HA-03 | Autorizar y retirar (API-HIA-02 y 03), con Idempotency-Key | `historia-anterior.service.ts`, `historia-anterior.controller.ts` |
| HA-04 | La historia anterior de un área, para el profesional (API-HIA-04), por tramos | `lectura-historia-anterior.ts` |
| HA-05 | Los contratos estrictos y los textos | `packages/domain/src/contratos-historia-anterior.ts`, `historia-anterior.ts` |
| HA-06 | «Tu historia anterior de …» en «Quién ve qué» | `apps/mobile/src/historia-anterior.tsx`, `pantallas/quien-ve-que.tsx` |
| HA-07 | ~~La tarjeta opcional al aceptar a un profesional nuevo, por Vínculos o por invitación~~ **Retirada por DL-176 (WP-COMPARTIR):** al aceptar, la historia anterior es una cosa más de la pantalla única de consentimiento, marcada si antes hubo otro profesional en esa área | `pantallas/consentimiento.tsx` (antes `historia-anterior.tsx`, `pantallas/vinculos.tsx`, `pantallas/invitacion.tsx`) |
| HA-08 | «Historia anterior» en el website, una ruta propia de la ficha | `apps/web/src/app/pro/advisees/previous-history/` |
| HA-09 | La entrada en «Más» de la ficha | `apps/web/src/app/pro/advisees/workspace.tsx` |
| HA-10 | Cerrar la cuenta y revocar el B2 de un componente retiran la autorización vigente | `apps/api/src/identidad/cierre.service.ts`, `apps/api/src/consentimiento/consentimiento-profesional.service.ts` |

**La persona, en la APK.** En «Quién ve qué» (Perfil), debajo del profesional de cada área, aparece «Tu historia anterior
de Nutrición» cuando antes hubo otro profesional en esa área (o cuando ya decidió algo): una explicación corta
(«Compartirla le muestra a Lic. Sofía Paz lo que pasó antes en Nutrición con otros profesionales: tus planes, lo que
registraste y las decisiones de las revisiones. Las notas privadas de esos profesionales no se comparten.»), el
interruptor «Compartir mi historia anterior», el texto completo plegado y, cuando la miró, «Miró tu historia anterior el
martes 10 a las 18:20». Compartirla abre el texto entero, con «Compartir mi historia anterior» y «Ahora no» del mismo
peso; dejar de compartirla pide confirmación y no borra nada. El estado dice «La ve desde el …» solo si hoy tiene acceso a
esa área; en pausa, sin el B2 o sin el A3, dice que no la ve (HA-T15). Un vínculo terminado con el que la miraron queda en
solo lectura, con cuándo la miró. Al aceptar a un profesional nuevo de un área en la que ya hubo otro (desde Vínculos o
por invitación), desde DL-176 (WP-COMPARTIR) la historia anterior es una de las cosas de la pantalla única de
consentimiento, **marcada**, con su texto plegado en la misma pantalla: «Aceptar y compartir» la comparte junto con lo
demás, y «Elegir qué compartir» deja desmarcarla (HA-T01, actualizada). La tarjeta opcional se retiró.

**El profesional, en el website.** En la ficha, «Más» → «Historia anterior» abre `/pro/advisees/previous-history` en la
primera de sus áreas aceptadas con esa persona, con las tres áreas en pestañas. Con la autorización: el aviso fijo («Lo
que sigue pasó con otro profesional, antes de tu acompañamiento. Solo lectura.»), el tramo con sus vecinos, las versiones
de los planes con sus fechas y lo que tenían, lo registrado por semana, las tomas con su protocolo, de dónde salió cada
medición que no midió el profesional («Lo informó la persona») y lo calculado con su método, y las decisiones de las
revisiones. Cada cosa lleva «De otro profesional» (con su número si hubo más de uno), nunca un nombre. Si no hay nada de
antes, solo eso, sin el aviso. Sin la autorización, la página dice primero lo que hace falta (acompañarla en esa área y
que ella la autorice) y después dónde la autoriza ella, con el mismo texto para cualquier causa y sin insinuar que haya
algo.

## 2. Las operaciones nuevas (familia HIA, DL-175)

| ID | Método y ruta | AuthN | Qué hace |
|---|---|---|---|
| API-HIA-01 | `GET /me/previous-history` | SESSION | Por cada profesional de hoy en un área (y por cada vínculo terminado con el que la miraron): si antes hubo otro, qué vería, lo que decidió la persona, si hoy tiene acceso a esa área y la última vez que la miró con ese componente; el texto que se acepta y las últimas 50 lecturas |
| API-HIA-02 | `PUT /me/previous-history/{relationshipId}` | SESSION + Idempotency-Key | Autorizar, con la versión vista y el texto mostrado; pide el A3 |
| API-HIA-03 | `POST /me/previous-history/{relationshipId}/withdrawal` | SESSION + Idempotency-Key | Retirar, con la versión vigente vista; no pide nada más |
| API-HIA-04 | `GET /advisees/{adviseeId}/previous-history/{area}?periodStart=&periodEnd=` | SESSION | La historia anterior de un área, en solo lectura, por tramos |

Familia propia de BE: el 09 no la tiene (lo nuevo va en operaciones nuevas, DL-137 D-7). La guardia de trazabilidad
(`scripts/trazabilidad-de-operaciones.test.cjs`) la declara con DL-175, y la prueba de contrato (`contrato.int-spec.ts`)
exige que cada código observado esté declarado. Migración `20261115120000_historia_anterior`, que solo agrega: el tipo
`EstadoDeAutorizacionDeHistoriaAnterior`, la tabla `autorizacion_de_historia_anterior`, con sus guardias en la base (solo
se agrega, también frente a TRUNCATE; la da la persona del componente, con su profesional y su área; cada versión sucede
a la última y cambia su estado, y la primera la da; una VIGENTE lleva su texto y su hash; no se da sobre un vínculo
terminado, con el componente tomado en modo compartido), y un índice parcial de `decision_de_acceso` para las lecturas
que ve la persona. API-CON-04 (revocar el B2), que ya existía, ahora también retira la historia anterior de ese
componente (HA-T14): cambia lo que hace, no su contrato.

## 3. Decisiones de continuador (HA-T01 a HA-T16, a ratificar)

- **HA-T01 · ~~Por omisión, no se comparte~~ Preseleccionada en la pantalla única (actualizada por DL-176, WP-COMPARTIR,
  2026-11-15).** Sigue valiendo que sin una decisión de la persona el profesional nuevo no ve nada: nada se escribe sin
  tocar «Aceptar y compartir». Lo que cambia es la pantalla: al aceptar a un profesional nuevo de un área en la que ya hubo
  otro, la historia anterior va **marcada** en la pantalla única de consentimiento (CMP-D2 y CMP-D16), con su texto en la
  misma pantalla, y se desmarca con «Elegir qué compartir»; la tarjeta opcional con «Ahora no» por omisión se retiró. Una
  historia anterior que la persona retiró antes no vuelve marcada (CMP-D3). En «Quién ve qué», la historia anterior
  aparece solo si antes hubo otro profesional en esa área o si la persona ya decidió algo: sin nadie antes, no hay nada que
  compartir. Antes de DL-176 decía: «Por omisión, no se comparte. La tarjeta al aceptar es opcional y ‹Ahora no› no
  escribe nada.»
- **HA-T02 · Lo que entra, por área.** Nutrición y Entrenamiento: las versiones activadas de los planes (con su contenido
  como lo vio la persona), lo registrado bajo esos planes y las decisiones de las revisiones. Antropometría no tiene ciclo
  de plan propio (06:6221): sus tomas registradas, con su protocolo, el origen de cada medición y lo calculado **para el
  soporte antropométrico** con su método (lo que la persona ve en su evolución; la corrida para el soporte de un objetivo
  nutricional no entra). La explicación de la APK dice lo de cada área: el texto del encargo («tus planes, registros,
  tomas y decisiones anteriores de Nutrición») le habría prometido tomas a Nutrición, que no las tiene.
- **HA-T03 · «Anterior» quiere decir antes del acompañamiento de quien lee, y como estaba entonces.** El corte es el
  comienzo de su componente de vínculo en esa área. Lo que otro profesional registró después (porque la acompañaba a la
  vez) no es historia anterior, y una versión que seguía vigente al corte no dice hasta cuándo («Seguía vigente cuando
  empezó tu acompañamiento»). Tampoco entra lo que cambió después sobre lo de antes: las correcciones, anulaciones,
  rectificaciones y recálculos registrados después del corte (los haga quien los haga) no se ven, y cada cosa se ve como
  estaba cuando empezó el acompañamiento de quien lee. El texto que acepta la persona lo dice («Lo ve como estaba cuando
  empezó a acompañarte»). Lo propio de quien lee, de un acompañamiento suyo anterior, tampoco entra: ya lo tiene.
- **HA-T04 · La autorización es de la persona, por profesional y por área.** Una fila por versión del componente de
  vínculo, de solo agregar: darla y retirarla son versiones nuevas, con la versión vista (si no es la última, 409
  `VERSION_CONFLICT`). Autorizar lo ya autorizado responde lo mismo sin otra versión. Darla pide el A3 (DL-115) y un
  vínculo sin terminar; retirarla no pide nada y vale también con el vínculo terminado (RNF-PRI-002). Cerrar la cuenta
  y revocar el B2 de ese componente la retiran (HA-T14). Nunca se borra nada.
- **HA-T05 · El texto es una propuesta.** Tiene su id y su hash (08 §12.2), y la API acepta solo el vigente (409
  `CONSENT_VERSION_STALE`). No está en el catálogo de textos legales: sumarle un tipo es una revisión legal aparte. Dice
  «Texto propuesto, pendiente de validación jurídica». La revisión lo ajustó antes de integrar (sin el «él», con lo de
  «como estaba», el retiro con el B2 y la última lectura en «Quién ve qué»), con su hash nuevo: ninguna base tenía
  todavía una autorización con el texto anterior, así que el id no cambia.
- **HA-T06 · «Hubo otro profesional antes», sin decir si dejó datos.** API-HIA-01 dice si antes hubo otro profesional en
  esa área (aunque ya haya terminado): es lo que hace aparecer la tarjeta. No dice si dejó registros: eso le contaría a la
  app algo que nadie autorizó a mirar.
- **HA-T07 · Sin nombre y sin lo que no es una decisión.** Cada cosa lleva `author: { kind: 'OTHER_PROFESSIONAL',
  ordinal }`: «De otro profesional», con su número si hubo más de uno (el 1.º es el que empezó antes). De las revisiones
  van el resultado, el fundamento y la próxima acción (ni la interpretación ni las evidencias); de las comidas, sin las
  fotos; de las tomas, sin el contexto ni las notas internas; las correcciones, sin su autor. Nunca las notas propias
  (PG-16) ni los borradores. El contrato no tiene dónde llevar nada de eso (TEST-HA-010). En una decisión «Cambiar
  objetivo», la próxima acción va con su descripción y su fecha, **sin el objetivo nuevo**: los objetivos no están en lo
  que decidió Dirección, y mostrarlo es elegir un formato para una prescripción entera (el requerimiento, la distribución
  de macronutrientes, su propio fundamento), con la regla de Nutrición sin «%». Queda para decidir aparte.
- **HA-T08 · Cada lectura queda registrada y la persona la ve.** La lectura del profesional es una decisión del PDP con el
  recurso `HistoriaAnterior` y su componente de vínculo. La persona ve la última **por componente** («Miró tu historia
  anterior el …»: la de un vínculo anterior con el mismo profesional no aparece debajo del nuevo, que nunca la autorizó)
  y las últimas 50 en API-HIA-01, como «quién miró» (PG-12). Un vínculo terminado con el que la miraron sigue en
  API-HIA-01 y en «Quién ve qué», en solo lectura («El vínculo terminó: ya no la ve» y cuándo la miró): la persona no deja
  de saberlo cuando el vínculo termina. No se dibuja la lista entera de lecturas (PG-D7 eligió no mostrar contadores), y
  el texto que se acepta dice eso: «ves la última vez que la miró».
- **HA-T09 · Para leer hace falta todo, y si falta algo es el 404 de lo inexistente.** El PDP del área (vínculo aceptado,
  B2 vigente, las cuentas y el A3 de la persona) y la autorización vigente para ese componente. Sin la autorización,
  retirada, de otra área, sin el vínculo aceptado o sin el B2: el mismo 404, y el motivo solo en la auditoría. Con el
  vínculo en pausa, sin el A3 o con una cuenta suspendida, la autorización sigue dada pero el profesional no la ve, y la
  APK lo dice (HA-T15).
- **HA-T10 · Por tramos.** Sin fechas, los últimos 90 días de la historia anterior (o los 90 antes del corte, si no hay
  nada); como mucho, 366 días, con las dos fechas juntas. El website ofrece el tramo de antes y el de después mientras la
  historia siga, y una dirección escrita a mano con más de 90 días vuelve al tramo por omisión: la lectura de un año
  entero queda para la segunda etapa, y su volumen se mide con la cohorte (§4, «Lo que falta»).
- **HA-T11 · Una familia propia.** HIA, con cuatro operaciones nuevas y una migración que solo agrega, en lugar de sumar
  parámetros a operaciones que la APK instalada ya lee (DL-137 D-7; DL-152).
- **HA-T12 · En el website, una ruta propia y no una vista de la ficha.** `/pro/advisees/previous-history`, desde «Más»,
  con el marco de un área: no choca con las vistas del seguimiento ni con WP-GRAFICOS, que suman las suyas. No toca
  `graficos/**`, «Analizar» ni la cinta (TEST-HA-056). Las pestañas son las tres áreas: en un área que no acompaña, el
  marco ya muestra su acceso actual, y la página dice primero que hace falta acompañarla en esa área y después dónde la
  autoriza ella, con un condicional (no insinúa que haya habido alguien). La pista de «Más» tampoco da por hecho que hubo
  otro profesional.
- **HA-T13 · La APK lee algo nuevo y se congela después.** API-HIA-01 a 03 se congelan con la próxima candidata
  (DL-152); los fixtures de las lecturas congeladas no se tocaron. «Quién ve qué» sigue sin escribir: la única escritura
  es la del interruptor de la historia anterior, en su pieza (TEST-AVR-009).
- **HA-T14 · Revocar el B2 de un componente retira su historia anterior; el A3, no.** El 08 §14.1 ata la historia previa
  «al alcance del nuevo consentimiento». Revocar el B2 (API-CON-04) agrega, en la misma transacción y con la persona como
  actor, una versión RETIRADA de la autorización de ese componente si estaba VIGENTE: otorgar el B2 de nuevo (API-CON-02,
  OtorgarNuevamente sobre el mismo componente) devuelve el acceso, no la historia, y la persona la vuelve a compartir si
  quiere. Revocar el A3 **no** la retira: el A3 es de todo BE (los hábitos y lo de otras áreas tampoco se retiran con él),
  y mientras falta el profesional no la ve y la APK lo dice (HA-T15). La pausa tampoco: es la misma persona que decide
  reanudar. Alternativa para Dirección: retirarla también con el A3 (más estricta, distinta de los hábitos y de RES).
- **HA-T15 · Compartida no es lo mismo que vista.** API-HIA-01 dice por componente si hoy ese profesional tiene acceso a
  esa área (`accessInEffect`: la misma evaluación del PDP, sin registrar, como el modo de acceso de las listas, RF-023).
  La APK dice «La ve desde el …» solo con acceso; en pausa, «Con el vínculo en pausa no la ve»; sin el B2, sin el A3 o con
  una cuenta suspendida, «La compartís, pero mientras no tenga acceso a tus datos de Nutrición no la ve». El aviso de
  éxito dice lo mismo: «puede ver» solo con acceso; al aceptar a alguien nuevo (sin el B2 todavía), «la va a poder ver
  cuando tenga acceso a tus datos de Nutrición». TalkBack lee el estado en la etiqueta del interruptor, no solo en la
  sugerencia.
- **HA-T16 · Compartirla es leer el texto entero.** Como los hábitos (`mis-habitos.tsx`: lo que se acepta no se pliega),
  tocar el interruptor o «Compartir mi historia anterior» abre un diálogo con el texto entero a la vista y dos respuestas
  del mismo peso, «Compartir mi historia anterior» y «Ahora no». Recién al confirmar sale API-HIA-02, que guarda el id y
  el hash de ese texto. Retirar sigue pidiendo confirmación. Si algo cambió mientras se miraba, «Actualizar» vuelve a
  leer; sin el A3, «Ir a Privacidad».

## 4. Verificación

| ID | Qué prueba | Dónde |
|---|---|---|
| TEST-HA-001 a 014 | El dominio: el texto y su hash, lo que entra por área, los ordinales, la autorización vigente, los cambios con lo visto, la tarjeta, los tramos, los contratos estrictos (con `accessInEffect`), el vocabulario, las semanas, la familia HIA y las correcciones como estaban en el corte. Cada una con su mutación | `packages/domain/src/historia-anterior.test.ts` |
| TEST-HA-020 a 025 | Sin la autorización, 404; con ella, lo de antes del otro, marcado y sin nombrarlo, sin lo propio de quien lee ni las notas; la idempotencia; la auditoría; las lecturas que ve la persona; retirada, 404 | `test/integration/historia-anterior.int-spec.ts` |
| TEST-HA-026 a 028 | Otra área, 404; sin el vínculo aceptado o sin el B2, 404 (y revocar el B2 la retira: otorgarlo de nuevo no la devuelve); lo registrado después del comienzo de quien lee no es anterior, y lo de antes se ve como estaba (sin la corrección, el recálculo ni la anulación posteriores); solo el cálculo del soporte antropométrico; los tramos | ídem |
| TEST-HA-029 | Entrenamiento: el plan de antes con sus bloques y la sesión con su condición | ídem |
| TEST-HA-030 | Lo ajeno, 404; un vínculo terminado no se autoriza pero se retira; sin el A3 no se da, y hoy no hay acceso; cerrar la cuenta la retira | ídem |
| TEST-HA-031 | La base sostiene lo suyo aunque el código se equivoque: también dos versiones seguidas con el mismo estado y una primera retirada | ídem |
| TEST-HA-032 | La última lectura es del componente, no del par profesional–área; un vínculo terminado con el que la miraron queda en API-HIA-01 | ídem |
| TEST-HA-033 | Las carreras, ordenadas por la base (`soporte-concurrencia.ts`): autorizar espera a quien termina el componente; un retiro y una lectura no se cruzan, en los dos sentidos; el retiro de un cierre lleva la hora de después del cerrojo | ídem |
| TEST-HA-034 | Las lecturas de API-HIA-01 usan el índice parcial (el plan, con el recorrido secuencial apagado); el índice que nadie usaba no está | ídem |
| TEST-HA-040 a 046 | La APK: cuándo se muestra (también un vínculo terminado), la tarjeta al aceptar (por Vínculos y por invitación), los pedidos con lo visto, los rechazos en palabras (con «Actualizar» e «Ir a Privacidad»), lo que responde una escritura, las pantallas (el diálogo con el texto entero, TalkBack con el estado en la etiqueta y los dos temas, leyendo el código) y compartida no es lo mismo que vista | `apps/mobile/src/historia-anterior-en-el-telefono.test.ts` |
| TEST-HA-050 a 056 | El website: la dirección (con el tramo de hasta 90 días), sin la autorización (lo que hace falta, después dónde), las versiones, lo registrado por semana, las tomas (con el origen de lo que no midió el profesional), las decisiones y los tramos, la pantalla (sin el aviso cuando no hay nada de antes) y la ficha, y el vocabulario | `apps/web/test/historia-anterior.test.mjs` |
| TEST-CT (HIA) | Cada código observado de HIA está declarado en el contrato | `test/integration/contrato.int-spec.ts` |

**Lo que falta:** verlo en test con la cohorte (una persona que cambió de nutricionista), y ahí medir el tramo más largo
(366 días por la API, con unas seis comidas por día) contra el tiempo de la transacción; TalkBack en el teléfono; la
evidencia de pantalla y la validación jurídica del texto (HA-T05).

## 5. Segunda etapa (fuera de esta rama)

- **Los gráficos** (WP-GRAFICOS): la historia anterior como un tramo marcado «de otro profesional», antes del inicio del
  acompañamiento, en los gráficos, «Analizar» y la cinta. Es el desafío de GR-D6 y DJ-14, que DL-175 amplía; va cuando
  entren las ramas de los gráficos, para no chocar con ellas.
- **El congelamiento de la APK:** las lecturas nuevas (API-HIA-01 a 03) se congelan con la próxima candidata (DL-152).

## 6. La revisión adversaria (2026-11-15)

Veinticuatro hallazgos, de tres miradas (privacidad, datos y experiencia). Los repetidos entre miradas van en una fila.

| Hallazgo | Severidad | Qué se hizo |
|---|---|---|
| La última lectura era del par profesional–área: un componente nuevo mostraba la lectura de un vínculo anterior | media (privacidad y datos) | Por componente de vínculo (`alcance_de_vinculo_id` de la decisión del PDP). TEST-HA-032 |
| La autorización sobrevivía a la revocación del B2 y volvía sola al otorgarlo de nuevo | media | HA-T14: revocar el B2 la retira en la misma transacción; el A3 no (se dice en la APK). TEST-HA-027. A ratificar |
| La APK decía «La ve» con el B2 o el A3 revocados (API-HIA-01 no decía si había acceso) | media (datos y experiencia) | HA-T15: `accessInEffect` con el PDP sin registrar; el estado y el aviso de éxito dependen de él. TEST-HA-027, 030 y 046 |
| Las lecturas de API-HIA-01 recorrían `decision_de_acceso`; el índice `lector` no lo usaba nadie | media | Índice parcial `decision_de_acceso_lecturas_de_la_historia_anterior`, consultas con constantes; el `lector` se sacó. TEST-HA-034 |
| La tarjeta no aparecía al aceptar por invitación (enlace, QR o código) | media | Se dibuja en `invitacion.tsx`, igual que en Vínculos. TEST-HA-045 |
| Se autorizaba con un toque y con el texto plegado | media | HA-T16: diálogo con el texto entero y dos respuestas del mismo peso. TEST-HA-045 |
| El texto prometía «lo ves ahí mismo» y con el vínculo terminado no se veía nada | media | El terminado con lecturas queda en solo lectura; el texto dice «ves la última vez que la miró» (hash nuevo). TEST-HA-001, 032 y 040 |
| El website no decía el origen de cada medición | media | «· Lo informó la persona» o «· Importado con procedencia», como el resto del website. TEST-HA-054 |
| Correcciones, anulaciones y recálculos posteriores al corte entraban en lo de antes | baja (dos miradas) | HA-T03: todo como estaba en el corte (`correccionesAlCorte` y los filtros por `momentoDeRegistro`). TEST-HA-014 y 028 |
| Entraba el cálculo del soporte de un objetivo nutricional | baja | Solo `SOPORTE_ANTROPOMETRICO`, como la evolución de la persona. TEST-HA-026 |
| La base aceptaba dos versiones seguidas con el mismo estado | baja | El trigger lo rechaza; y la primera tiene que darla. TEST-HA-031 |
| Autorizar y terminar el vínculo a la vez podía dejar una VIGENTE sobre un componente terminado | baja | El componente se toma `FOR SHARE` al empezar (servicio y trigger). TEST-HA-033 |
| El retiro del cierre llevaba la hora de llegada | baja | La hora de la base con el cerrojo tomado. TEST-HA-033. Hábitos y RES tienen el mismo patrón: queda anotado abajo |
| Sin tope de filas: un tramo de 366 días en una sola transacción | baja | El website pide hasta 90 días; la API sigue con 366, como el análisis (`analisis/vistas.service.ts`). Medirlo con la cohorte queda en «Lo que falta». TEST-HA-050 |
| No había prueba de la carrera entre retirar y leer | baja | TEST-HA-033, en los dos sentidos, con la barrera de `soporte-concurrencia.ts` |
| La tarjeta al aceptar no tenía «Actualizar» ni el camino a Privacidad | baja | Los dos botones, en la tarjeta y en el diálogo. TEST-HA-043 y 045 |
| Redacción: «Sus notas», «con su método, con otros», «él», sin sujeto | baja | «Compartirla le muestra a … Las notas privadas de esos profesionales…»; «cada una con su método»; sin género. TEST-HA-002 |
| TalkBack: el estado iba solo en la sugerencia | baja | El estado que se ve (también «Compartiendo…») va en la etiqueta; la sugerencia dice qué pasa al tocar. TEST-HA-045 y 046 |
| Textos del website que daban por hecho lo que no sabían | baja | La pista dice «si los hubo»; sin autorización, primero lo que hace falta; sin nada de antes, sin el aviso. TEST-HA-011, 051 y 056 |
| «Cambiar objetivo» sin el objetivo nuevo | baja | No se sumó: queda declarado en HA-T07 para decidir aparte |

**Fuera del paquete (para anotar, severidad baja):** el retiro de los hábitos y el de lo de otras áreas al cerrar la
cuenta (`retirarAutorizacionDeHabitosPorCierre` y `retirarAutorizacionDeResumenesPorCierre`) también llevan la hora de
llegada del pedido y no la de la base después del cerrojo. No expone nada (la lectura en curso ya terminó cuando el retiro
se escribe), pero ordena mal en el tiempo; se arregla igual que acá, en su paquete.

## 7. Estado

| Fecha | Qué |
|---|---|
| 2026-11-15 | Programado en `wp-historia-anterior` (PR abierto), con la CI. |
| 2026-11-15 | DL-176 (WP-COMPARTIR) actualiza HA-T01: la historia anterior va preseleccionada en la pantalla única de consentimiento; la tarjeta opcional al aceptar (HA-07) se retira. |
| 2026-11-15 | Revisión adversaria: los nueve hallazgos medios y los bajos, arreglados con su prueba, salvo dos: el tope de filas (mitigado en el website; la medición, con la cohorte) y el objetivo nuevo de «Cambiar objetivo» (declarado en HA-T07). HA-T14 a HA-T16, nuevas. Falta: ratificar HA-T01 a HA-T16, integrar y verificar en test. |
