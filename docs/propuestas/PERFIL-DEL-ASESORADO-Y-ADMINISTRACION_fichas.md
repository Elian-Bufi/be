# Fichas para Dirección: perfil del asesorado y administración mínima

> **Nota del 2026-10-05.** La entrega pasó al 2026-10-20. Donde estas fichas dicen «10/10», la dependencia se lee contra el 20/10. Las recomendaciones no se reescribieron.

**Fecha:** 2026-10-02 · **Para:** Dirección (Elián) · **De:** el ejecutor técnico
**Pedido:** «Para perfil del asesorado y administración mínima: presentá una ficha breve (alcance, requisitos, dependencia real) antes de empezar cualquier módulo. No deduzcas que la mesa exige administrador únicamente porque solicita distintos roles.»
**Base:** `main` en `6213ec8`, APK 0.13.1. **No se empezó ningún módulo:** son fichas para decidir.

**Fuentes.** Los RF están en el 04 (no en el 05), los UC en el 05; el 07 es arquitectura.
- **Legajo:** `04` a `08` son los documentos de `docs/legajo/` con ese número. `09` es `docs/legajo/09_BE_LEG_09_v0.16.1.md`, y `09v8`, `docs/legajo/09_AUX/BE_LEG_09_v0.8_CONTRATOS_ACCESO_GOBIERNO_P0_2026-08-31.md`. `B10-03` y `B10-08` están en `docs/legajo/10_UX/`.
- **Deuda:** `DL` es `docs/DEUDA_LEGAJO.md`, con las líneas de `main`.
- **Código:** `api/` es `apps/api/src/`; `dominio/`, `packages/domain/src/`.
- **Mesa:**
  - `DV-05` es `docs/mesa/MESA_02/DV-05/DV-05_CASOS_DE_PRUEBA.md`. La «matriz DV-05» es `MATRIZ_DE_RECONCILIACION_DV-05_2026-10.md`, en la misma carpeta.
  - `Entregables.pdf` es el documento de la escuela (Da Vinci, versión 2025.05). Está fuera de Git, en la copia local de Dirección (`docs/fuente_escolar/LEEME.md`). Se leyó esa copia.

---

## Ficha 1 · Perfil del asesorado con nombre visible

**1. Qué es y qué no es.** Es un solo campo: el asesorado declara y cambia un nombre visible en su perfil propio, con historia. El profesional con vínculo lo ve en lugar de «Asesorado · c36743».

No es un perfil clínico (06 §5.5.1), la mayoría de edad (DL-023), un perfil reutilizable por formularios (DL-095), una búsqueda por nombre (DL-035) ni el nombre del profesional (DL-036).

**2. Requisitos.**

| ID o sección | Qué dice | Fuente |
|---|---|---|
| RF-017 (P0) | Perfil propio del adulto, aun sin vínculo. **No habla de nombre ni de lo que ve el profesional** | 04:277-284 |
| UC-P25 | Registrar la identidad y el perfil propio. Datos mínimos «sin fijar aquí su estructura» | 05:14027-14111 |
| API-ACC-06 (P0) | `PATCH /me/profile` con `expectedVersion`; 409 o 422; auditoría en la misma transacción | 09v8:509-554; 09:2048 |
| 09v8 §3.2 y B10-08 §5.4 | La contraparte va con `displayName`. La cartera lleva «Nombre del asesorado». **El nombre visible sale de acá** | 09v8:161-170; B10-08:214-219 |
| REG-06-20 y 08 §11 | Cada cambio del perfil es una versión. El nombre es C3: el profesional ve el «contacto mínimo del vínculo» | 06:2050; 08:191 |
| DL-009 y DL-040 (abiertas) | No hay campos aprobados. La opción B de DL-009 aprueba «el nombre visible (C3)» | DL:256-275 y 943-960 |

**3. Qué hay hoy.**
- **Perfil:** `PerfilPropio` es 1:1, sin contenido ni versiones (`prisma/schema.prisma:191-204`).
- **Contrato:** `profile` es `{}` estricto en el alta y en `/me` (`dominio/contratos.ts:155-156` y `:208-209`). No hay ACC-06.
- **Profesional:** ve «Asesorado · » y 6 caracteres del identificador. Lo arma `nombreDeAsesorado()` (`api/vinculo/lectura.ts:36-39`), que usan cinco módulos.
- **Asesorado:** no tiene nombre; ve «Tu identificador BE» (`apps/mobile/src/pantallas/cuenta.tsx:89-93`).
- **DEMO-A01** termina en `c36743` (`EVIDENCIA/WP-02/cuentas-demo.txt:11`).

**4. Dependencia real con el 10/10.**
- **La mesa no lo pide.** `Entregables.pdf` no menciona el perfil ni el nombre del asesorado.
- **DV-05 no depende del nombre.** TEST-FRM-004 (P1) y una parte de TEST-RF-071 piden un perfil con datos (una altura, DV-05:1036-1038). Siguen bloqueados por DL-009 (matriz DV-05, D-6).
- **La guía de demo funciona así.** Usa la referencia neutral en la tabla de cuentas y en los pasos 2.2, 3 y 4.1 (`EVIDENCIA/ENTREGA/GUIA-DEMO.md`).
- **Inferencia:** que el tribunal espere nombres (B10-08 §5.4).

**5. Opciones** (tamaños estimados).

| Opción | Tamaño | Qué incluye | Riesgos | Qué decidir |
|---|---|---|---|---|
| A. Referencia neutral | S, sin código | Explicarla en la defensa (DL-040) | RF-017 sigue parcial | Nada |
| B. Nombre visible mínimo | M | El campo con versiones, ACC-06, opcional en el alta; el profesional con vínculo lo ve. Website, APK, pruebas, guía y capturas | `/me` es estricto (`dominio/cliente-http.ts:277-279`): por lectura del código, la APK instalada falla en «Estado de la cuenta» y en «Tu identificador BE». Obliga a una APK nueva y a probarla en el teléfono, y ninguna se probó desde la 0.12.0 | DL-009: el campo y el largo. DL-040: si lo ve en solicitudes pendientes o tras finalizar. La autorización, fuera de «WP-01 a WP-07» (ACTA-DIR-034 §3) |
| C. Perfil con datos | L | B, más altura y nacimiento (DL-023), reutilizables (DL-095) | Datos sensibles sin matriz de pertinencia | DEC-03 del Plan Funcional |

**6. Recomendación del ejecutor (decide Dirección).** B, si hoy se deciden DL-009 y DL-040 y la APK nueva se prueba en el teléfono antes del 10/10. Puede viajar con la APK nueva que haría falta si Dirección elige la opción A de DL-115. Si no se cumplen las dos condiciones, A, y B después de la entrega.

---

## Ficha 2 · Administración mínima: verificación de profesionales y rol administrador

**1. Qué es y qué no es.** Es la «administración mínima» del 02 §11.2 (`docs/legajo/02_Vision_Alcance_y_Plan_Estrategico.md:304-310`), del núcleo no recortable (04:49): revisar perfiles profesionales; validar, observar, rechazar y suspender; consultar estados; gestionar las cuentas demo, y ver evidencia básica de auditoría. En el website, el profesional presenta (UC-P01, UC-E01) y el administrador resuelve (UC-P02, UC-P03).

No es el break-glass (08 §28), las incidencias (RF-068, P1), configurar habilitaciones (RF-066, P1), suspender cuentas (DL-020) ni certificar matrículas (RF-011).

**2. Requisitos.**

| ID o sección | Qué dice | Fuente |
|---|---|---|
| RF-008, 009, 010 y 013 (P0) | Actor: el **profesional**. Perfil, evidencia, presentación, subsanación | 04:164-189 y 209-216 |
| RF-011, 012 y 014 (P0) | Actor: el **administrador**. Revisa; aprueba, rechaza o suspende por alcance; rehabilita | 04:191-207 y 218-225 |
| RF-007 y RF-067 (P0) | «El administrador y el profesional operan en Website». La antropometría usa el mismo circuito | 04:144-151 y 236-243 |
| UC-P01, E01, P02 y P03 | Alta y subsanación. Revisar, resolver, suspender y rehabilitar con «facultad administrativa» | 05:1196, 1820, 1508-1544 y 1967 |
| API-PRO-01 a 13 | Del 01 al 08, el profesional con `SESSION` (PRO-04 sube evidencia a una URL firmada). Del 09 al 13, el administrador con `SESSION_MFA` | 09v8:560-928 y 930-1104 |
| 08 §25 y §28 | ADMIN: MFA obligatorio «Siempre»; para el profesional es opcional en la demo. ADMIN sin datos de salud | 08:580-581 y 612 |
| B10-03 y DL-036 (abierta) | UX de «Verificaciones», en borrador. Hoy resuelve un servicio interno | B10-03:103-110; DL:846-866 |

**3. Qué hay hoy.**
- **No hay rol administrador.** No hay entidad, ni pantalla (`apps/web/src/app/`), ni `SESSION_MFA` (`dominio/openapi.ts:198`), ni operaciones PRO.
- **Verifica y habilita el `SERVICIO_INTERNO_DE_VERIFICACION`** (`api/profesional/verificacion.service.ts:16-37`). Corre al arrancar la API, solo en test o development y solo para las cuentas `@example.invalid` de `BE_DEMO_PROFESIONALES`, que son tres en `render.yaml:57-58`.
- **No hay almacenamiento de objetos:** «NO se aprovisiona en el baseline del MVP» (07:944).

**4. Dependencia real con el 10/10.**
- **La mesa pide distintos roles.** El punto 14 de `Entregables.pdf` (pág. 3) dice: «Usuarios creados para acceder a la APK y al Website con diferentes roles». Hoy hay dos, asesorado en la APK y profesional en el website, con tres perfiles profesionales (`docs/mesa/MESA_01/ESTADO_PUNTOS_11_14_2026-10-02.md`).
- **La mesa no pide un administrador.** La palabra no figura en `Entregables.pdf`. Los «Roles del equipo de desarrollo» del punto 2 son personas. La lectura del tutor no es verificable: no hay devolución suya en el repositorio.
- **Lo pide BE, no la escuela** (inferencias):
  - la matriz MESA-01 propone sembrar «administrador, profesional verificado y asesorado» (hoja `01_Matriz_14`), pero advierte «No agregar exigencias del profesor que el PDF no contiene» (hoja `04_Fuentes`);
  - DV-02 y DV-04 muestran al administrador (`DV-02_ACTA.md:19`; `DV-04_FICHAS.md:23-24`).
- **DV-05: cinco casos P0 no se ejecutan sin esto.** Son TEST-RF-006, 007, 010 y 012, y TEST-AUTH-010 (matriz DV-05, D-2).
  - Solo RF-007, RF-012 y AUTH-010 necesitan un administrador (DEMO-ADM); AUTH-010 pide, además, break-glass.
  - RF-006 y RF-010 necesitan el lado profesional.
- **Guía de demo:** ningún paso usa un administrador.

**5. Opciones** (tamaños estimados).

| Opción | Tamaño | Qué incluye | Riesgos | Qué decidir |
|---|---|---|---|---|
| A. Sin administrador el 10/10 | S, documental | El punto 14 con asesorado y profesional. La respuesta de defensa: 08 §25, 07 §25 y la decisión del 22/9 (`docs/paquetes/WP-CONSOLIDACION.md:5`). Los cinco casos, fuera en 11B | Que el tribunal pida el administrador de DV-02 y DV-04 | D-2 de la matriz DV-05 |
| B. Verificación administrativa mínima | M | Un ADMIN sembrado; «Verificaciones» con PRO-09 a 13; presentaciones sembradas, sin archivos. Destraba RF-007 y RF-012 | Sin MFA contradice el 08 §25: DL-088 #17 vale para el profesional, no para el administrador. Hay que probar que no ve salud | El MFA: con TOTP pasa a L. Quién concede la habilitación (REG-06-33). La autorización fuera de «WP-01 a WP-07» (como WP-08) |
| C. WP-09 completo | L | B, más autoservicio con subida real (PRO-02 a 08) y MFA | Almacenamiento nuevo: proveedor, DPA y región (07 §25.1) | Lo de B, más el proveedor |

**6. Recomendación del ejecutor (decide Dirección).** A para el 10/10: la mesa pide distintos roles, y los que hay la cumplen. Si se quiere el administrador, con MFA (B con TOTP, o C) y después de la entrega, porque sin MFA contradiría el 08 §25.

---

## Fuera de las fichas: lo que no coincide con `docs/QUE-FALTA.md` §2
1. **Fila del perfil.** RF-017 y UC-P25 no están «sin implementar». Desde WP-02, RF-017 está parcial (`docs/paquetes/WP-02.md:38`) y TEST-UC-P25 figura completo, con el perfil creado sin contenido (`:94`). El nombre visible no sale de RF-017, sino de 09v8 §3.2 y de B10-08 §5.4.
2. **Fila de administración.** El administrador es actor solo en RF-011, 012 y 014. Faltan UC-E01, RF-067, el MFA (08 §25) y el almacenamiento (07 §25).
3. **«22 de 122».** El número cuenta bien, pero por ID faltan 21 en `dominio/openapi.ts`. El código usa API-DSH-04 para `GET /me/portfolio` (`dominio/openapi.ts:572-595`), y en el 09 API-DSH-04 es la línea temporal (`docs/legajo/09_AUX/BE_LEG_09_v0.11_CONTRATOS_P0_ANTROPOMETRIA_Y_PROYECCIONES_2026-08-31.md:964-968`). Es de severidad media, de trazabilidad. Quedó registrado como DL-116.
