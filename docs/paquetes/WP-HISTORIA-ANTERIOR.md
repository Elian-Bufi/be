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
| HA-07 | La tarjeta opcional al aceptar a un profesional nuevo | `historia-anterior.tsx`, `pantallas/vinculos.tsx` |
| HA-08 | «Historia anterior» en el website, una ruta propia de la ficha | `apps/web/src/app/pro/advisees/previous-history/` |
| HA-09 | La entrada en «Más» de la ficha | `apps/web/src/app/pro/advisees/workspace.tsx` |
| HA-10 | Cerrar la cuenta retira cada autorización vigente | `apps/api/src/identidad/cierre.service.ts` |

**La persona, en la APK.** En «Quién ve qué» (Perfil), debajo del profesional de cada área, aparece «Tu historia anterior
de Nutrición» cuando antes hubo otro profesional en esa área (o cuando ya decidió algo): una explicación corta («Le
muestra a Lic. Sofía Paz tus planes, registros y decisiones anteriores de Nutrición, con otros profesionales. Sus notas
privadas no se comparten.»), el interruptor «Compartir mi historia anterior», el texto completo plegado y, cuando la miró,
«Miró tu historia anterior el martes 10 a las 18:20». Dejar de compartirla pide confirmación y no borra nada. Al aceptar
a un profesional nuevo de un área en la que ya hubo otro, una tarjeta ofrece lo mismo, con «Compartir mi historia
anterior» y «Ahora no», del mismo peso; por omisión, no se comparte.

**El profesional, en el website.** En la ficha, «Más» → «Historia anterior» abre `/pro/advisees/previous-history` en la
primera de sus áreas aceptadas con esa persona, con las tres áreas en pestañas. Con la autorización: el aviso fijo («Lo
que sigue pasó con otro profesional, antes de tu acompañamiento. Solo lectura.»), el tramo con sus vecinos, las versiones
de los planes con sus fechas y lo que tenían, lo registrado por semana, las tomas con su protocolo y lo calculado con su
método, y las decisiones de las revisiones. Cada cosa lleva «De otro profesional» (con su número si hubo más de uno),
nunca un nombre. Sin la autorización, la página dice cómo pedírsela a la persona, con el mismo texto para cualquier causa
y sin insinuar que haya algo.

## 2. Las operaciones nuevas (familia HIA, DL-175)

| ID | Método y ruta | AuthN | Qué hace |
|---|---|---|---|
| API-HIA-01 | `GET /me/previous-history` | SESSION | Por cada profesional de hoy en un área: si antes hubo otro, qué vería, lo que decidió la persona y la última vez que la miró; el texto que se acepta y las últimas 50 lecturas |
| API-HIA-02 | `PUT /me/previous-history/{relationshipId}` | SESSION + Idempotency-Key | Autorizar, con la versión vista y el texto mostrado; pide el A3 |
| API-HIA-03 | `POST /me/previous-history/{relationshipId}/withdrawal` | SESSION + Idempotency-Key | Retirar, con la versión vigente vista; no pide nada más |
| API-HIA-04 | `GET /advisees/{adviseeId}/previous-history/{area}?periodStart=&periodEnd=` | SESSION | La historia anterior de un área, en solo lectura, por tramos |

Familia propia de BE: el 09 no la tiene (lo nuevo va en operaciones nuevas, DL-137 D-7). La guardia de trazabilidad
(`scripts/trazabilidad-de-operaciones.test.cjs`) la declara con DL-175, y la prueba de contrato (`contrato.int-spec.ts`)
exige que cada código observado esté declarado. Migración `20261115120000_historia_anterior`, que solo agrega: el tipo
`EstadoDeAutorizacionDeHistoriaAnterior` y la tabla `autorizacion_de_historia_anterior`, con sus guardias en la base (solo
se agrega, también frente a TRUNCATE; la da la persona del componente, con su profesional y su área; cada versión sucede
a la última; una VIGENTE lleva su texto y su hash; no se da sobre un vínculo terminado).

## 3. Decisiones de continuador (HA-T01 a HA-T13, a ratificar)

- **HA-T01 · Por omisión, no se comparte.** Sin una decisión de la persona, el profesional nuevo no ve nada. La tarjeta al
  aceptar es opcional y «Ahora no» no escribe nada. En «Quién ve qué», la historia anterior aparece solo si antes hubo
  otro profesional en esa área o si la persona ya decidió algo: sin nadie antes, no hay nada que compartir.
- **HA-T02 · Lo que entra, por área.** Nutrición y Entrenamiento: las versiones activadas de los planes (con su contenido
  como lo vio la persona), lo registrado bajo esos planes y las decisiones de las revisiones. Antropometría no tiene ciclo
  de plan propio (06:6221): sus tomas registradas, con su protocolo y lo calculado con su método. La explicación de la
  APK dice lo de cada área: el texto del encargo («tus planes, registros, tomas y decisiones anteriores de Nutrición»)
  le habría prometido tomas a Nutrición, que no las tiene.
- **HA-T03 · «Anterior» quiere decir antes del acompañamiento de quien lee.** El corte es el comienzo de su componente de
  vínculo en esa área. Lo que otro profesional registró después (porque la acompañaba a la vez) no es historia anterior,
  y una versión que seguía vigente al corte no dice hasta cuándo («Seguía vigente cuando empezó tu acompañamiento»). Lo
  propio de quien lee, de un acompañamiento suyo anterior, tampoco entra: ya lo tiene.
- **HA-T04 · La autorización es de la persona, por profesional y por área.** Una fila por versión del componente de
  vínculo, de solo agregar: darla y retirarla son versiones nuevas, con la versión vista (si no es la última, 409
  `VERSION_CONFLICT`). Autorizar lo ya autorizado responde lo mismo sin otra versión. Darla pide el A3 (DL-115) y un
  vínculo sin terminar; retirarla no pide nada y vale también con el vínculo terminado (RNF-PRI-002). Cerrar la cuenta
  la retira. Nunca se borra nada.
- **HA-T05 · El texto es una propuesta.** Tiene su id y su hash (08 §12.2), y la API acepta solo el vigente (409
  `CONSENT_VERSION_STALE`). No está en el catálogo de textos legales: sumarle un tipo es una revisión legal aparte. Dice
  «Texto propuesto, pendiente de validación jurídica».
- **HA-T06 · «Hubo otro profesional antes», sin decir si dejó datos.** API-HIA-01 dice si antes hubo otro profesional en
  esa área (aunque ya haya terminado): es lo que hace aparecer la tarjeta. No dice si dejó registros: eso le contaría a la
  app algo que nadie autorizó a mirar.
- **HA-T07 · Sin nombre y sin lo que no es una decisión.** Cada cosa lleva `author: { kind: 'OTHER_PROFESSIONAL',
  ordinal }`: «De otro profesional», con su número si hubo más de uno (el 1.º es el que empezó antes). De las revisiones
  van el resultado, el fundamento y la próxima acción (ni la interpretación ni las evidencias); de las comidas, sin las
  fotos; de las tomas, sin el contexto ni las notas internas; las correcciones, sin su autor. Nunca las notas propias
  (PG-16) ni los borradores. El contrato no tiene dónde llevar nada de eso (TEST-HA-010).
- **HA-T08 · Cada lectura queda registrada y la persona la ve.** La lectura del profesional es una decisión del PDP con el
  recurso `HistoriaAnterior`. La persona ve la última por profesional («Miró tu historia anterior el …») y las últimas 50
  en API-HIA-01, como «quién miró» (PG-12).
- **HA-T09 · Para leer hace falta todo, y si falta algo es el 404 de lo inexistente.** El PDP del área (vínculo aceptado,
  B2 vigente, las cuentas y el A3 de la persona) y la autorización vigente para ese componente. Sin la autorización,
  retirada, de otra área, sin el vínculo aceptado o sin el B2: el mismo 404, y el motivo solo en la auditoría. Con el
  vínculo en pausa, la autorización sigue dada pero el profesional no la ve, y la APK lo dice.
- **HA-T10 · Por tramos.** Sin fechas, los últimos 90 días de la historia anterior (o los 90 antes del corte, si no hay
  nada); como mucho, 366 días, con las dos fechas juntas. El website ofrece el tramo de antes y el de después mientras la
  historia siga.
- **HA-T11 · Una familia propia.** HIA, con cuatro operaciones nuevas y una migración que solo agrega, en lugar de sumar
  parámetros a operaciones que la APK instalada ya lee (DL-137 D-7; DL-152).
- **HA-T12 · En el website, una ruta propia y no una vista de la ficha.** `/pro/advisees/previous-history`, desde «Más»,
  con el marco de un área: no choca con las vistas del seguimiento ni con WP-GRAFICOS, que suman las suyas. No toca
  `graficos/**`, «Analizar» ni la cinta (TEST-HA-056). Las pestañas son las tres áreas: en un área que no acompaña, la
  página dice cómo pedirla y que hace falta acompañarla.
- **HA-T13 · La APK lee algo nuevo y se congela después.** API-HIA-01 a 03 se congelan con la próxima candidata
  (DL-152); los fixtures de las lecturas congeladas no se tocaron. «Quién ve qué» sigue sin escribir: la única escritura
  es la del interruptor de la historia anterior, en su pieza (TEST-AVR-009).

## 4. Verificación

| ID | Qué prueba | Dónde |
|---|---|---|
| TEST-HA-001 a 013 | El dominio: el texto y su hash, lo que entra por área, los ordinales, la autorización vigente, los cambios con lo visto, la tarjeta, los tramos, los contratos estrictos, el vocabulario, las semanas y la familia HIA. Cada una con su mutación (15, todas muertas) | `packages/domain/src/historia-anterior.test.ts` |
| TEST-HA-020 a 025 | Sin la autorización, 404; con ella, lo de antes del otro, marcado y sin nombrarlo, sin lo propio de quien lee ni las notas; la idempotencia; la auditoría; las lecturas que ve la persona; retirada, 404 | `test/integration/historia-anterior.int-spec.ts` |
| TEST-HA-026 a 028 | Otra área, 404; sin el vínculo aceptado o sin el B2, 404; lo registrado después del comienzo de quien lee no es anterior; los tramos | ídem |
| TEST-HA-029 | Entrenamiento: el plan de antes con sus bloques y la sesión con su condición | ídem |
| TEST-HA-030 | Lo ajeno, 404; un vínculo terminado no se autoriza pero se retira; sin el A3 no se da; cerrar la cuenta la retira | ídem |
| TEST-HA-031 | La base sostiene lo suyo aunque el código se equivoque | ídem |
| TEST-HA-040 a 045 | La APK: cuándo se muestra, la tarjeta al aceptar, los pedidos con lo visto, los rechazos en palabras, lo que responde una escritura y las pantallas (TalkBack y los dos temas, leyendo el código) | `apps/mobile/src/historia-anterior-en-el-telefono.test.ts` |
| TEST-HA-050 a 056 | El website: la dirección, sin la autorización, las versiones, lo registrado por semana, las tomas, las decisiones y los tramos, la pantalla y la ficha, y el vocabulario | `apps/web/test/historia-anterior.test.mjs` |
| TEST-CT (HIA) | Cada código observado de HIA está declarado en el contrato | `test/integration/contrato.int-spec.ts` |

**Lo que falta:** verlo en test con la cohorte (una persona que cambió de nutricionista), TalkBack en el teléfono, la
evidencia de pantalla y la validación jurídica del texto (HA-T05).

## 5. Segunda etapa (fuera de esta rama)

- **Los gráficos** (WP-GRAFICOS): la historia anterior como un tramo marcado «de otro profesional», antes del inicio del
  acompañamiento, en los gráficos, «Analizar» y la cinta. Es el desafío de GR-D6 y DJ-14, que DL-175 amplía; va cuando
  entren las ramas de los gráficos, para no chocar con ellas.
- **El congelamiento de la APK:** las lecturas nuevas (API-HIA-01 a 03) se congelan con la próxima candidata (DL-152).

## 6. Estado

| Fecha | Qué |
|---|---|
| 2026-11-15 | Programado en `wp-historia-anterior` (PR abierto), con la CI. Falta: la revisión adversaria, ratificar HA-T01 a HA-T13, integrar y verificar en test. |
