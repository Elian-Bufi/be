# WP-ADMINISTRACION · el próximo paquete funcional, a definir

**Registrado el 2026-10-23**, por el encargo de consolidación de Dirección (punto 8).

**Estado: a definir. No está autorizado a implementarse.** Este documento solo dice qué hay, de qué depende y qué falta decidir. Siguiendo la regla de ACTA-DIR-034, antes del primer commit hace falta una definición con sus IDs: RF, UC, API, UX, pruebas y lo que queda afuera.

## La intención

Dirección quiere un paquete de **administración de profesionales**:
- habilitar a un profesional por área;
- registrar observaciones;
- suspender y restablecer;
- con auditoría y con una autenticación acorde al proyecto.

**Dos reglas que lo enmarcan:**
- **Administrar cuentas no concede acceso a datos de salud.** El administrador decide sobre profesionales, no ve a las personas (08 §28).
- **La exclusión vieja no anula esta intención.** El 2026-09-22 WP-09 quedó fuera de alcance (ruta de paquetes y `docs/QUE-FALTA.md` §2). La intención de hoy la reemplaza.

## Lo que ya existe (comprobado en `main` `0fb1bff`)

| Pieza | Qué hay | Dónde |
|---|---|---|
| Modelo de datos | Por área: la verificación del profesional (`PENDIENTE`, `VERIFICADO`, `RECHAZADO`, `SUSPENDIDO`) y la habilitación (`CONCEDIDA`, `RETIRADA`). Además, el perfil profesional y su nombre visible | `prisma/schema.prisma`: `PerfilProfesional`, `VerificacionProfesional`, `Habilitacion` |
| Historia | Cada cambio es un hecho con su estado anterior y el nuevo, su fundamento y quién actuó. Ya están los tipos `ObservacionRegistrada`, `SubsanacionPresentada`, `AlcanceSuspendido`, `AlcanceRehabilitado`, `HabilitacionConcedida` y `HabilitacionRetirada` | `EventoDeVerificacion` y `TipoDeEventoDeVerificacion` |
| Reglas | Las transiciones permitidas, en una lista blanca del dominio y en disparadores de la base que rechazan cualquier otra | `evaluarTransicionDeVerificacion` y `evaluarTransicionDeHabilitacion` (`@be/domain`) · `apps/api/src/profesional/verificacion.service.ts` |
| Quién lo opera hoy | **Un servicio interno**, `SERVICIO_INTERNO_DE_VERIFICACION`, al arrancar la API, solo en `test` o `development`, para las cuentas de `BE_DEMO_PROFESIONALES` | DL-036 · `apps/api/src/config/entorno.ts` |
| El efecto en el acceso | El PDP ya deniega a un profesional con el área sin verificar, rechazada, suspendida o con la habilitación retirada, y lo audita | Pruebas del PDP (V2 y V3) · `RegistroDeAuditoria` |
| Suspender una cuenta | Solo por el servicio interno | DL-020 |
| El contrato del 09 | API-PRO-01 a 08 (el profesional se presenta y subsana) y API-PRO-09 a 13 (el administrador resuelve, con `SESSION_MFA`). **No existen en el contrato de BE**: son 13 de los 18 IDs P0 sin operación (conteo del 2026-10-23) | 09v8:560-1104 |
| UX | La pantalla «Verificaciones», en borrador | B10-03 |
| Ficha anterior | El análisis del 2026-10-02, con tres opciones (A sin administrador, B verificación mínima, C WP-09 completo) | `docs/propuestas/PERFIL-DEL-ASESORADO-Y-ADMINISTRACION_fichas.md`, ficha 2 |

**Lo que no existe:** el rol administrador, sus pantallas, las operaciones PRO, el MFA y un almacenamiento de documentos.

## De qué depende

1. **MFA para el administrador.** El 08 §25 lo pide «siempre», y BE no tiene MFA. Sin él, el rol contradice al legajo: DL-088 #17 vale para el profesional, no para el administrador.
2. **El primer administrador.** Cómo se crea, sin dejar una puerta trasera, y con su alta auditada.
3. **Que no vea salud.** El PDP tiene que denegarle todo alcance de salud, y sus pantallas no muestran datos de las personas. Hay que probarlo.
4. **Qué pasa con los vínculos vigentes.** Al suspender un área o retirar una habilitación, el PDP corta el acceso del profesional. Falta decidir qué se le avisa a él y a las personas.
5. **La convivencia con la siembra de `test`.** `BE_DEMO_PROFESIONALES` no debe pisar una decisión del administrador.
6. **Los documentos del profesional**, como una matrícula, si entran. Necesitan un almacenamiento que hoy no está aprovisionado (07:944), con proveedor, DPA y región.

## Lo que falta decidir

Cada decisión trae una recomendación del ejecutor; decide Dirección.

| # | Decisión | Opciones | Recomendación |
|---|---|---|---|
| D-1 | El alcance de la primera entrega | **A.** El administrador habilita, observa, suspende y restablece por área a profesionales ya registrados. **B.** A más la presentación del profesional (PRO-01 a 08). **C.** B más documentos | **A**: cubre la intención sin almacenamiento nuevo |
| D-2 | El segundo factor | **A.** TOTP, una aplicación de códigos. **B.** Llave de seguridad (WebAuthn). **C.** Sin MFA mientras los datos sean sintéticos | **A**, sin proveedor externo. **C** contradice el 08 §25 |
| D-3 | El primer administrador | **A.** Un comando interno que lo crea y deja el hecho auditado. **B.** Una variable de entorno, como `BE_DEMO_PROFESIONALES` | **A**: no queda la puerta abierta en cada arranque |
| D-4 | Suspender la cuenta entera (DL-020) | Dentro o fuera de la primera entrega | Fuera: es otra acción, con otros efectos |
| D-5 | Qué ve el administrador | Solo la identidad profesional, los estados y los hechos | Eso, y nunca datos de las personas |
| D-6 | A quién se avisa | Al profesional (observación, suspensión) por Novedades; a las personas vinculadas cuando el profesional queda suspendido en su área | Al profesional siempre; a las personas, con un texto que decida Dirección |
| D-7 | La siembra de `test` | **A.** Deja de habilitar cuando hay un administrador. **B.** Conviven, sin pisarse | **B** mientras dure la demo |

**IDs a declarar en la definición:**
- **Requisitos y casos de uso:** RF-007 a RF-014, RF-067; UC-P01 a UC-P03 y UC-E01.
- **Operaciones:** API-PRO-09 a 13 y, con D-1 B, API-PRO-01 a 08.
- **Legajo y deuda:** 08 §25 y §28; DL-036 y DL-020; B10-03.
- **Pruebas del 11A:** TEST-RF-007, TEST-RF-012 y TEST-AUTH-010.

**Fuera, aunque estén cerca:**
- el break-glass (08 §28);
- las incidencias (RF-068, P1);
- la capacidad del profesional (RF-066);
- certificar matrículas (RF-011).
