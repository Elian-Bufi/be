# Propuesta · El asesorado lee sus propias revisiones de entrenamiento y nutrición

> **Estado:** PROPUESTA para decisión de Dirección. **No implementada.** Sale del trabajo condicionado de la tanda del 2026-09-29, y se corrigió en la auditoría de ese mismo día. Los identificadores `REV-A-*` son locales a esta propuesta.

Esta propuesta separa dos cosas:
- **el derecho**, que el legajo ya estableció;
- **el cómo** (contrato, interfaz y los casos que el texto no resuelve), que falta definir.

Que no exista una ruta propia **no vuelve indefinido el derecho**: solo falta implementarlo.

## 1. Lo que ya está establecido (APROBADO)

| Texto vigente | Qué establece |
|---|---|
| 08, matriz §6.2 (`docs/legajo/08_BE_LEG_08_v0.1.5.md:205`): «Revisiones/decisiones profesionales · C4 · profesional · **✔ (sin notas secretas — §9.15)**» en la columna del titular | El titular **lee** las revisiones y decisiones profesionales sobre él |
| 08:495: «El asesorado ve **toda su historia** desde el producto (§9.15 — sin notas secretas) y puede exportarla: el ejercicio del derecho de acceso es, en el caso normal, autoservicio inmediato» | La lectura es **autoservicio**, dentro del producto, y forma parte del derecho de acceso |
| 09 v0.12:844 (`docs/legajo/09_AUX/BE_LEG_09_v0.12_…:844`), entre las reglas de lo que produce el profesional: «no crea “notas secretas” profesionales invisibles al régimen 08» | «Sin notas secretas» es una **garantía para el titular**: no puede haber texto profesional sobre él que el régimen 08 le oculte |
| 04 RF-035 (`04:446`): «el asesorado recibe la situación vigente». RF-046 (`04:556`): «el asesorado ve la situación vigente» | Además, la **situación vigente** que resulta de la revisión le llega al asesorado |
| 08 §14.3 (`08:432`): «La conservación del dato en BE y los derechos del titular son independientes del acceso profesional» | Las suspensiones de §14.1 (vínculo PAUSADO, FINALIZADO y consentimiento revocado) cortan el acceso **del profesional**; la tabla lleva por título «Acceso del profesional a datos del asesorado» (`08:412`) |

**Cómo se lee «sin notas secretas».** La revisión, tal como está hoy en el contrato y en la base, **no tiene un campo de notas privadas**:
- `RevisionDeEntrenamientoSchema` (`packages/domain/src/contratos-entrenamiento.ts:680`) y `RevisionSchema` de nutrición (`contratos-nutricion.ts:483`) traen período, evidencia, `interpretation`, resultado, `rationale`, próxima acción, autor, fecha y aplicación;
- la interpretación y el fundamento son **parte de la revisión**, no notas aparte.

Por eso la lectura que surge del texto es que el titular ve la revisión completa, interpretación y fundamento incluidos. «Sin notas secretas» **no autoriza a ocultarlos**: dice lo contrario, que no hay texto profesional oculto al titular.

## 2. Lo que falta definir (contrato e interfaz)

1. **La operación del titular.** API-TRN-23 (`09 v0.10:1375`) y API-NUT-19 (`09 v0.9:904`) son lecturas del profesional. El titular no tiene operación propia. Es un **hueco de contrato**, no de derecho.
2. **La forma:** lista y detalle, paginación y período, igual que «Tu historial» (API-TRN-19-LISTA, DL-096).
3. **La pantalla:** B10 no tiene una pantalla del asesorado para revisiones, y hoy la APK no las lee.
4. **Qué pasa con las referencias de evidencia** que apuntan a recursos que el titular no abre desde la APK (por ejemplo, una evaluación): mostrarlas como texto con fecha, o enlazar solo lo que ya tiene lectura propia.
5. **La revocación de A3:** el texto dice «suspensión inmediata de toda operación sensible del servicio para ese titular», y durante el plazo de decisión los datos quedan bloqueados (`08:406`). No dice si leer lo propio cuenta como operación sensible. Hay un precedente implementado: «Tu historial» exige A3 (DL-096; `copy-entrenamiento.ts:150`).

## 3. Contraste de las alternativas con el texto vigente

**Cualquier alternativa que dé menos de lo que ya establece el §1 restringe un derecho existente.** No es un detalle de interfaz: es un **cambio de política**, que necesita una decisión expresa de Dirección y un registro en el legajo. Esta tanda **no toma ninguna de estas decisiones**.

| ID | Pregunta | Lo que dice el texto vigente | Alternativas | Qué implica cada una |
|---|---|---|---|---|
| REV-A-D1 | ¿Qué campos ve? | La revisión completa, sin notas secretas (§1) | **A.** Completa: evidencia, interpretación, resultado, fundamento, próxima acción, autor, fecha y aplicación. **B.** Sin interpretación ni fundamento | **A** es el texto vigente. **B restringe un derecho: cambio de política**. Una medida compatible con A: avisar en el website del profesional que el asesorado lee esos textos (es información, no restricción) |
| REV-A-D2 | ¿Desde cuándo? | «Toda su historia», sin distinguir estados; RF-035 y RF-046 hablan de la situación **vigente** | **A.** Desde que se registra, con su estado de aplicación visible. **B.** Recién cuando se aplica | **A** se ajusta al texto. **B** oculta durante un tiempo algo ya registrado sobre el titular: **restricción, cambio de política** |
| REV-A-D3 | ¿Con el vínculo pausado o finalizado, o el B2 revocado? | §14.1 corta el acceso **del profesional**; §14.3: los derechos del titular son independientes | **A.** El titular sigue leyendo lo propio. **B.** Se suspende | **A** es el texto vigente. **B restringe: cambio de política** |
| REV-A-D3-bis | ¿Con A3 revocado? | `08:406`: se suspende toda operación sensible y los datos quedan bloqueados; no dice si leer lo propio es operación sensible | **A.** Se suspende, como «Tu historial» (precedente). **B.** Se mantiene la lectura, que es el ejercicio del derecho de acceso | **Hueco del texto:** cualquiera de las dos es una interpretación que tiene que decidir Dirección, con validación jurídica si hace falta (VJR del 08) |
| REV-A-D4 | ¿Entra en la exportación? | Sí: «puede exportarla» (08:495; §19/§20) | — | Ya está establecido. Se implementa junto con la exportación del titular, que todavía no existe |

## 4. Propuesta técnica (condicionada a las decisiones)

- **REV-A-1 · Contrato.** Operaciones nuevas del titular, con esquema propio y sin modificar ninguna respuesta que ya lee la APK publicada:
  - `GET /me/training/reviews` y `GET /me/training/reviews/{reviewId}`;
  - `GET /me/nutrition/reviews` y `GET /me/nutrition/reviews/{reviewId}`.
  - Los campos, según REV-A-D1.
- **REV-A-2 · Autorización.**
  - El titular lee solo lo suyo. Otro asesorado o un profesional recibe el mismo 404 neutral.
  - Vínculo, B2 y A3, según REV-A-D3 y D3-bis.
  - No se copian las reglas de lectura del profesional: el titular tiene las suyas.
- **REV-A-3 · APK.** Una sección «Revisiones» en Entrenamiento y en Nutrición, sin juicios ni puntajes (REG-06-117 y REG-06-125). Necesita una APK nueva.

## 5. Criterios de aceptación

| Criterio | Riesgo | Prueba |
|---|---|---|
| El titular lee todas sus revisiones y solo las suyas | Leer las de otra persona, o que falte una | Integración: 404 idéntico ante una ajena o inexistente; la lista trae todas las del titular |
| Los campos coinciden con REV-A-D1 | Ocultar sin decisión, o mostrar de más | Contrato: el esquema propio coincide con lo decidido |
| Sin juicios ni puntajes | Calificar a la persona | Control de términos prohibidos (TEST-PRJ-009) |
| La APK publicada no se rompe | Un esquema estricto con propiedades nuevas | Solo operaciones nuevas |
| Vínculo, B2 y A3 según lo decidido | Cortar un derecho, o leer con A3 revocado sin decisión | Integración por evento |

## 6. Archivos que tocaría

- `packages/domain/src/contratos-entrenamiento.ts`, `contratos-nutricion.ts`, `cliente-http.ts` y `openapi.ts`;
- `apps/api/src/entrenamiento/revisiones.service.ts`, `apps/api/src/nutricion/revisiones.service.ts` y sus controladores;
- `apps/mobile/src/pantallas/entrenamiento.tsx`, `nutricion.tsx` y `App.tsx`;
- `test/integration/`: una suite nueva.

**Primer incremento, cuando Dirección decida:**
1. Contrato y API, sin APK.
2. APK, junto con otros cambios de la APK.
