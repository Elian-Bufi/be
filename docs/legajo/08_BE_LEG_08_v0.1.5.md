# 08 — Seguridad, Privacidad y Gobernanza de BE

> **Proyecto:** BE — Plataforma integrada de inteligencia en salud
> **Código documental:** `BE-LEG-08`
> **Versión:** `0.1.5`
> **Estado:** `BORRADOR DE PARCHE TRANSVERSAL POST-BASELINE — NO APROBADO`
> **Fecha de redacción:** v0.1 2026-08-18 · v0.1.1 2026-08-21 · v0.1.2 2026-08-21 · v0.1.3 2026-08-21 · v0.1.4 2026-08-21 · **v0.1.5 2026-09-07 (parche transversal)**
> **Responsable de dirección:** Elian Gastón Bufi
> **Redacción técnica:** Claude Code (v0.1–v0.1.1) · consolidación y contrarrevisión externa: OpenAI ChatGPT (v0.1.2–v0.1.3) · bajo instrucción y decisión de Dirección; **no constituye asesoramiento jurídico**
> **Gate de destino:** `G3` ya regularizado; esta v0.1.5 es reapertura documental controlada por impacto transversal y no reabre G3 ni BE-LEG-07
> **Preguntas bloqueantes propias:** Q-003 · Q-004 · Q-005 — RESUELTAS Y APROBADAS por `ACTA-DIR-019`
> **Baseline:** `BE-LEG-08 v0.1.4` aprobada/custodiada · **Canonización de v0.1.5: NO AUTORIZADA**

---

> **Control de cambio v0.1.5:** `ACTA-DIR-024` aprueba documentalmente BE-LEG-06 v0.1.1 (`7c1950adafbdd3f3c27a04d225ff2844c4fe170a965104407a92e09ecdd4fea1`) y autoriza este parche sobre la baseline BE-LEG-08 v0.1.4 (`21d8e639a49b81cf1b679b4146aeaebd3306544c3c4e0c298d47893fbd1f0e6e`). La baseline §0…§55 se conserva. `§56` agrega exclusivamente gobierno para CAP-MET, CAP-DAT, ANT-DRAFT y ANT-VOID. Las VJR/VD y el gate jurídico de datos reales permanecen vigentes.

## 0. Control documental

| Campo | Valor |
|---|---|
| Rama / HEAD al redactar | `docs/canonical-legajo-to-be` @ `933be6f1133a31cf400497a44a6805b5404a76b9` (canonización BE-LEG-06 / ACTA-DIR-018) — verificado |
| Working tree al iniciar | Limpio salvo los 2 artefactos BORRADOR conocidos del 07 (frontispicio verificado: BORRADOR → tratados como insumo, no canon) |
| Fecha de ejecución | 2026-08-18 (toda la investigación normativa y de proveedores está fechada a este día) |
| Documentos canónicos modificados | NINGUNO |
| Operaciones Git | NINGUNA (sin commit/push/merge/PR/tag/amend) |
| Artefactos de esta redacción | Este documento + área `docs/legajo/_work/08/` (registro de trabajo, matriz legal, inventario de tratamientos, matriz datos/accesos/retención, riesgos y amenazas, autoverificación, revisión adversarial) |
| **Custodia de la consolidación** | La v0.1.1 de Claude queda preservada como fuente comparada con SHA-256 `3912bd6c6c33659cb167a51fcab50a61ffcb3cf46ce523f192dfcaf2184e8a38`. La v0.1.2 queda preservada como candidata consolidada previa a la contrarrevisión final. Esta v0.1.3 es una **nueva candidata BORRADOR**; su SHA-256 se calcula sobre el archivo cerrado y se entrega fuera del propio documento. Ninguna edición modifica retroactivamente la v0.1.1. |
| Declaración de conformidad | **Este documento NO declara que "BE cumple con la Ley 25.326"**. Formula: *el diseño toma como restricciones el marco normativo argentino vigente identificado en esta versión*. La conformidad real exige organización, contratos, proveedores contratados, operaciones, políticas implementadas, controles verificados y asesoramiento jurídico |

### 0.8 Changelog v0.1 → v0.1.1 → v0.1.2 → v0.1.3 → v0.1.4

Corrección quirúrgica posterior a la **contrarrevisión externa de v0.1** (resultado: *NO CONFORME PARA APROBACIÓN — CORREGIBLE SIN REDISEÑO ESTRUCTURAL*; la arquitectura conceptual fue evaluada como sólida y **se preserva íntegra**). La v0.1 se conserva como evidencia en `_work/08/BE_LEG_08_v0.1_PRE_CONTRARREVISION_EXTERNA.md` (SHA-256 `623c463759cf0796aff09946305b3ee4866e058ca648a2b344f9581396e16133`). Detalle hallazgo→decisión→sección→evidencia en `_work/08/BE_LEG_08_CORRECCION_CONTRARREVISION_EXTERNA_v0.1.1_2026-08-21.md`.

| # | Cambio | Secciones |
|---|---|---|
| C-1 | **Acceso de perfiles no sanitarios a información sensible pertinente** (nueva precisión de Dirección): se elimina tanto la prohibición implícita como la habilitación universal; se introduce la categoría de política **"Información relevante para la seguridad del entrenamiento"** con minimización y *mínimo detalle suficiente* | §2.3, §6, §8, §9 (TR-B), §10, §11, §11-bis (nueva), §12.3, §12.4, §13, §27, §42, §50, §52 |
| C-2 | Lenguaje jurídico menos concluyente: se separa **decisión funcional BE** de **conclusión jurídica**; se retira "consentimiento como base única" para no sanitarios | §2.3, §6, §8, §9, §12.3, §12.5, §52 (VJR-1/VJR-4 reformuladas) |
| C-3 | Transferencias: región adecuada **no sustituye** la revisión de subprocesadores y transferencias ulteriores; tres escenarios diferenciados (A adecuada / B no adecuada con mecanismo / C basada en consentimiento); `TRANSFERENCIA_INT` deja de ser requisito universal | §2.4, §12.4, §34, §35, §47 (I-1/I-2) |
| C-4 | Google Maps: se separa **payload deliberado de BE** de **metadatos potencialmente tratados por el proveedor**; se retira "Maps solo recibe C1" | §33-bis, §34 |
| C-5 | Clasificación: nueva clase interna **C6 RESTRINGIDO DE SEGURIDAD Y GOBERNANZA** (auditoría, break-glass, evidencia de incidentes, bitácoras); C5 queda solo para secretos; C4 se explicita como **clase interna protectora**, más conservadora que la calificación jurídica campo por campo | §10, §11, matrices auxiliares |
| C-6 | Inconsistencias mecánicas: conteos revalidados **por conteo real, no por memoria** — valores finales en C-9 | §2.5, §2.6, §42, §46, §55, transversal |
| C-7 | Autoridad y gobierno: **CAND-08-H sigue pendiente** (las decisiones de Dirección están transcriptas, no ratificadas por acta) y se suman **CAND-08-I** (pertinencia) y **CAND-08-J** (transferencias por flujo); la regularización de la clausura de **G3** queda registrada como pendiente de Dirección, **sin resolverla desde el 08** | §4, §46, §55 |
| C-8 | Red-team ampliado con los 10 escenarios de la misión correctiva (acceso pertinente vs no pertinente, revocación por alcance, herencia entre profesionales, cambio legal de matriz, subprocesador fuera de región) | anexo de riesgos |
| **C-9** | **Segunda ronda de corrección**, tras la revisión interna adversarial de la propia v0.1.1 (panel independiente, veredicto inicial **NO APTO** con 5 bloqueantes — ADV2-01…ADV2-18). Se retiró la **cláusula de escape** de §11-bis.2 que reabría el extremo prohibido; se bajó la corrección de transferencias a la **matriz operativa** de §35 y a §12.1/§12.5/§52; se **derogó** la aclaración del gate que permitía operar con VJR-1/4 abiertas; se especificó la matriz de pertinencia para que sea **construible** (§11-bis.4-bis/4-ter); se agregaron la **regla de texto libre** (§11-bis.3-bis), el **caso de la información ausente** (§11-bis.7), la gobernanza del escalamiento de detalle (§11-bis.3), **VD-1** (validación disciplinar, no jurídica), **R-17** (deletion ledger), **R-08-12/R-08-13**, la condición de gate **24** (G-12) y las pruebas **N-8/N-9/A-1…A-4** | §6, §9, §11-bis, §12.1, §12.4, §12.5, §16, §29, §34, §35, §42, §44, §45, §50.1, §52, §54 |
| **C-10** | **Conteos consolidados:** 17 gaps (G-1…G-17) · **17 categorías de retención** (R-01…R-17) · CAND-08-A…J (10) · 22 amenazas (T-01…T-22) · **24 condiciones de gate** · **10 impactos al 07 (I-1…I-10)** · **10 VJR + 1 VD** · **42 escenarios de red-team** · **13 riesgos** (R-08-01…R-08-13) · 6 clases de información (C1…C6) · **20 casos de prueba** en §50.1 | transversal |
| **C-11** | **Consolidación comparativa v0.1.2:** se recupera `I-10` como impacto explícito al 07 para soportar la matriz de pertinencia; la vista vacía usa un mensaje neutral (`sin información disponible para este vínculo/alcance`) para no mentir cuando el dato existe pero no fue autorizado; §27 aclara que BE no oculta información pertinente **solo cuando existe, está autorizada y la matriz la habilita**; se elimina el escalamiento de detalle por consentimiento dato-a-dato del MVP, preservando la granularidad `profesional × Alcance × finalidad × categorías` y dejando cualquier compartición excepcional de documentos como capacidad futura que requeriría diseño propio. | §11-bis.3, §11-bis.7, §27, §29, §47, §50.1 |
| **C-12** | **Contrarrevisión final v0.1.3:** se elimina la excepción que permitía a Dirección habilitar datos reales con VJR-1/VJR-4 abiertas — un acta no sustituye validación jurídica; se cierra la propagación del consentimiento ante cambios de matriz: una reducción aplica inmediatamente, pero una ampliación de categoría o detalle exige **nueva versión B2 y nueva aceptación del titular** para vínculos existentes. Se elimina `consentimiento puntual` post-vínculo, se agrega prueba A-5 y se sincronizan versión, conteos y autoverificación. | §11-bis.4-bis/4-ter, §12.2, §14.1, §42, §45, §50.1, §54, §55 |
| **C-13** | **Transición administrativa v0.1.4:** Dirección aprueba el contenido normativo de v0.1.3 sin cambios sustantivos, resuelve Q-003/Q-004/Q-005, ratifica CAND-08-A…J, regulariza G3 y autoriza canonización. Se corrige además la línea de procedencia editorial para reflejar la consolidación/contrarrevisión externa. | frontispicio, §46, §54, §55 |

## 1. Propósito

Definir la política de seguridad, privacidad y gobernanza de datos del producto BE ya definido por 02–06: quién puede acceder a qué, con qué fundamento, hasta cuándo, qué corta el acceso, qué se conserva y por qué, qué derechos tiene el titular, qué reciben los terceros y bajo qué mecanismo, qué controles son obligatorios antes de datos reales, y qué queda jurídicamente pendiente. Resuelve (como propuesta) las preguntas bloqueantes **Q-003** (alcance del consentimiento), **Q-004** (retención) y **Q-005** (acceso tras finalizar vínculo), y emite impactos vinculantes para la revisión del 07 y obligaciones para 09/10/11A/12.

## 2. Resumen ejecutivo

1. **Marco vigente identificado (a 2026-08-18):** Ley 25.326 + Decreto 1558/2001 + Disposición DNPDP 60-E/2016 (cláusulas modelo) + resoluciones AAIP (47/2018 medidas recomendadas; 126/2024 sanciones; 198/2023 CCM RIPD; 34/2019 lista de adecuación). **No hay reforma sancionada**; el proyecto 2023 perdió estado parlamentario (2025). No existe obligación legal general de notificar incidentes; el Convenio 108+ **no está en vigor** (34/38 ratificaciones verificadas al 15/05/2026; residual de re-verificación al desplegar). **BE trata intensivamente datos sensibles relacionados con la salud dentro de su núcleo longitudinal** (art. 2: "información referente a la salud"), además de datos personales, operativos y técnicos de otras categorías — la calificación jurídica es campo por campo, no una etiqueta global (§10).
2. **El modelo de dos relaciones se formaliza** (Q-003): (A) usuario↔BE — términos + privacidad + tratamiento; (B) asesorado↔profesional — Vínculo + Alcance + consentimiento específico versionado por profesional/alcance/finalidad, exactamente como lo estructura el 06 (T-06-17). Sin consentimiento/autorización vigente **no hay acceso profesional a datos sensibles** (DEC-006); la revocación corta el futuro sin borrar historia; el fin del vínculo corta el acceso del profesional sin destruir la historia del asesorado (Q-005).
3. **Perfiles profesionales heterogéneos y acceso por pertinencia** (precisión de Dirección incorporada en v0.1.1): el art. 8 habilita a "profesionales vinculados a las ciencias de la salud" — el nutricionista matriculado probablemente califica; el entrenador probablemente no. **De ahí no se sigue ni que un entrenador no pueda ver información de salud, ni que el consentimiento le abra todo el expediente.** BE adopta el acceso por **pertinencia a la finalidad autorizada**: un profesional no sanitario accede a la información sensible **estrictamente pertinente y necesaria** para cumplir con seguridad el Alcance que el asesorado le autorizó (diabetes, hipertensión, asma, dolor, lesiones, restricciones, medicación relevante para la práctica física — §11-bis), con **mínimo detalle suficiente** y nunca al expediente completo. La **suficiencia jurídica** del consentimiento como habilitación para cada categoría sensible en manos de perfiles no sanitarios **no se declara resuelta**: es VJR-1/VJR-4, y hasta entonces rige el *safe default* configurable (§11-bis.4) que el sistema puede estrechar sin rediseñar Vínculos, Alcances ni historia.
4. **Transferencias internacionales:** EE.UU. y Brasil **no** son jurisdicciones adecuadas; la UE sí. Toda infraestructura fuera de la lista exige mecanismo documentado (CCM argentinas tal cual → sin aprobación previa; contrato divergente → presentación AAIP en 30 días — VJR-2). **Advertencia incorporada en v0.1.1:** elegir una región primaria en jurisdicción adecuada (p. ej. Frankfurt) **reduce la complejidad regulatoria de la ubicación primaria pero no sustituye** la revisión de subprocesadores, soporte, telemetría, backups, servicios auxiliares y transferencias ulteriores (§35). El consentimiento de transferencia **no es un requisito universal**: se aplica solo al escenario que efectivamente se apoye en él (§35.2, escenario C). **Impacto al 07** (que propuso Render/Virginia): la elección queda **condicionada**, no resuelta (§47 I-1/I-2).
5. **Retención por categoría, no número global** (Q-004): matriz de **17 categorías** (R-01…R-17) con finalidad, evento de inicio/cierre, criterio, tratamiento en backups y estado de certeza; la historia longitudinal del asesorado con cuenta activa se conserva **porque es la finalidad elegida por el titular**; con cuenta cerrada se procesa por categorías (cerrar acceso → verificar → suprimir/anonimizar → conservar solo con fundamento). Varios plazos quedan como **parámetros pendientes de validación jurídica** con evento/mecanismo/propietario definidos.
6. **AS-IS honesto:** hoy no existen revocación, consentimiento granular, MFA, break-glass, exportación, cierre de cuenta, ni auditoría bloqueante; además el vínculo PAUSADO lee como ACTIVO (**17 gaps** con evidencia, §43). Nada de esto invalida la demo sintética; **todo esto condiciona el gate Ready-for-Real-Data** (§42) — la línea que separa la tesis del piloto con datos reales.

## 3. Alcance

**Decide este documento:** política de acceso y autorización (sobre las estructuras del 06), **incluida la política de pertinencia del §11-bis** (qué información sensible es necesaria para cada Alcance y con qué detalle mínimo — como regla de política y de vista de autorización, **sin** crear entidad de dominio, módulo, Alcance ni taxonomía nueva), consentimiento (Q-003), revocación, fin de vínculo (Q-005), retención/supresión/anonimización (Q-004), derechos del titular, exportaciones, fotos/media, analítica, IA, identidad/MFA/sesiones (política), administradores/break-glass, auditoría, logging, cifrado (capacidad), secretos, ambientes (política de datos), terceros y transferencias, obligaciones formales, incidentes, vulnerabilidades, SDLC seguro, threat model, gate de datos reales.
**No decide:** entidades/estados/invariantes (06); arquitectura/plataforma/topología (07 — recibe impactos §47); endpoints/contratos (09); pantallas (10); casos de prueba (11A). **No modifica** ninguna decisión de Dirección (§9 de la instrucción): las incorpora como input y señala incompatibilidades si las hubiera.

## 4. Autoridad y fuentes

Jerarquía aplicada: (A) Gobierno — 00 v0.2.1 + ACTA-DIR-018; (B) Núcleo vinculante — 04 v0.4.1, 05 v0.14, 06 v0.1 (el 08 no puede cambiar actores, estados, Vínculos, Alcances, consentimiento-como-concepto, invariantes ni historia); (C) 02/03; (D) DEC-003…009, 011, 042…047; (E) 07 **BORRADOR** (insumo, no canon); (F) AS-IS auditado + código verificado; (G) normativa argentina en fuente primaria (InfoLeg/AAIP/BO) consultada 2026-08-18; (H) documentación oficial de proveedores.

**Nota de autoridad sobre `[DIRECCIÓN §9.x]`:** las decisiones de Dirección citadas como §9.x provienen de la instrucción de misión del 08 (2026-08-18) y están **transcriptas íntegramente y archivadas** en `_work/08/BE_LEG_08_DECISIONES_DE_DIRECCION_TRANSCRIPTAS_2026-08-18.md` (con hash en el handoff). No son todavía actas canónicas: su ratificación formal es la candidata **CAND-08-H** (§46) — condición previa a la aprobación de este documento.

**Nota de autoridad ampliada (v0.1.1):** la **precisión de Dirección sobre acceso por pertinencia** que funda §11-bis fue recibida el **2026-08-21** en la instrucción de misión correctiva y está transcripta en el mismo archivo como **§9.17**. Rige la misma regla: es `[DIRECCIÓN]` transcripta y verificable, **no acta canónica**; su ratificación es **CAND-08-I** (§46) y es igualmente condición previa a la aprobación. Mientras no haya acta, §11-bis se aplica con el **default conservador de §11-bis.4**. Ninguna política nuclear de este documento se apoya en una instrucción no archivada. Registro completo de fuentes con URLs y confianza: `_work/08/BE_LEG_08_MATRIZ_LEGAL_Y_FUENTES_2026-08-18.md`. Etiquetas usadas en todo el texto: `[CANÓNICO] [DIRECCIÓN] [NORMA VIGENTE] [REGLAMENTACIÓN VIGENTE] [CRITERIO AAIP] [RECOMENDACIÓN AAIP] [ESTÁNDAR] [AS-IS AUDITADO] [IMPLEMENTACIÓN OBSERVADA] [BORRADOR 07] [INVESTIGACIÓN PROVEEDOR] [INFERENCIA] [PROPUESTA BE] [VALIDACIÓN JURÍDICA REQUERIDA]`.

## 5. Metodología legal y técnica

1. Verificación del marco **a la fecha exacta** (2026-08-18) sobre fuentes primarias (texto actualizado InfoLeg, BO, AAIP); prohibido el conocimiento memorizado y las fuentes SEO. 2. Toda obligación citada lleva norma+artículo+fuente+confianza; recomendaciones y criterios AAIP **nunca** se presentan como obligaciones; proyectos de ley **nunca** como derecho vigente. 3. Los puntos de interpretación especializada se marcan VALIDACIÓN JURÍDICA REQUERIDA y el diseño se hace **adaptable sin re-arquitectura destructiva** ante sus resultados — con el límite honesto declarado en §9 y §12.5: adaptable no significa inmune (una lectura maximalista del art. 7.3 impactaría también a TR-C). 4. El AS-IS se verificó contra el código real (citas archivo:línea). 5. Proporcionalidad: rigor de empresa real defendible **sin** fingir SOC 24×7, ISO certificada, DPO permanente ni comités inexistentes; separación explícita de fases DEMO SINTÉTICA → PILOTO CON DATOS REALES AUTORIZADOS → OPERACIÓN COMERCIAL → ESCALA.

**Método de la corrección v0.1.1** (2026-08-21): la v0.1 fue sometida a **contrarrevisión externa** con resultado `NO CONFORME PARA APROBACIÓN — CORREGIBLE SIN REDISEÑO ESTRUCTURAL`. La respuesta correcta a ese veredicto era **corregir, no reescribir**: se preservó la v0.1 byte-idéntica como evidencia (`_work/08/BE_LEG_08_v0.1_PRE_CONTRARREVISION_EXTERNA.md`, SHA-256 `623c4637…16133`), se mapeó cada hallazgo a secciones concretas antes de editar, se editó solo lo señalado, se re-derivaron **contando** todos los conteos mecánicos, se amplió el red-team con 10 escenarios dirigidos contra la política nueva (dos de ellos contra defectos de la propia v0.1) y se re-corrió la revisión interna adversarial. Trazabilidad completa hallazgo→decisión→sección→evidencia en `_work/08/BE_LEG_08_CORRECCION_CONTRARREVISION_EXTERNA_v0.1.1_2026-08-21.md`. **La arquitectura conceptual no se tocó.**

## 6. Contexto argentino y límites

- **[NORMA VIGENTE]** Ley 25.326 (B.O. 2/11/2000) plenamente vigente; datos de BE = **sensibles** (art. 2); tratamiento bajo consentimiento libre, expreso, informado, escrito o equiparable (art. 5; Dec. 1558: revocable en cualquier momento sin efecto retroactivo); información previa del art. 6; prohibición general de formar archivos que revelen datos sensibles (art. 7.3) con la excepción sanitaria del **art. 8** (establecimientos y "profesionales vinculados a las ciencias de la salud", con secreto profesional); deber de seguridad (art. 9 — **obligación**, no recomendación); confidencialidad de todo interviniente (art. 10); cesión con consentimiento (art. 11 — sin excepción amplia para equipos interdisciplinarios: la 11.3.d es solo salud pública/emergencia/epidemiología **con disociación**); transferencia internacional (art. 12, §35); encargo de tratamiento (art. 25 — contrato, no-uso para otro fin, destrucción al fin del contrato con excepción de conservación **hasta 2 años**); Registro Nacional de Bases de Datos **operativo y exigible** (art. 21; TAD/AAIP); sanciones según Res. AAIP 126/2024 (transferir a países no adecuados sin mecanismo = **muy grave**).
- **[CONTEXTO FUTURO]** Reforma de la ley: proyecto PEN 2023 caído (2025); nuevos proyectos sin sanción. 108+ aprobado internamente (Ley 27.699) pero **no vigente internacionalmente**. El diseño de BE es compatible-por-anticipación (notificación 72 h, privacidad desde el diseño) **sin afirmarlas como obligaciones actuales**.
- **[NORMA VIGENTE]** Ley 26.529 (derechos del paciente e historia clínica): plazo de conservación **10 años**, titularidad del paciente, depositario el profesional/establecimiento. Si aplica a los registros que un nutricionista lleva en BE, el obligado sería **el profesional (depositario)** y BE su soporte técnico — con impacto en retención (§16) y exportación (§20). VALIDACIÓN JURÍDICA REQUERIDA. ReNaPDiS (plataformas sanitarias de prescripción/teleasistencia): BE queda en principio **fuera** (no prescribe ni hace teleasistencia); re-evaluar si esas funciones se agregaran.
- **[VALIDACIÓN JURÍDICA REQUERIDA] La tensión art. 7.3 ↔ art. 8 no está resuelta y este documento no la resuelve.** El art. 7.3 prohíbe con carácter general *formar archivos que revelen datos sensibles*; el art. 8 habilita a establecimientos sanitarios y a "profesionales vinculados a las ciencias de la salud" a tratar datos de salud de sus pacientes bajo secreto profesional. Un **entrenador**, un **health coach** o un perfil análogo **no encuadra pacíficamente** en la expresión "profesional vinculado a las ciencias de la salud", y esa calificación **no la decide BE**. Consecuencias que sí corresponde declarar acá:
  - **Ninguna política interna de BE convierte a un perfil no sanitario en sujeto del art. 8.** La política de pertinencia (§11-bis) **no es** una respuesta a esa pregunta jurídica: es una medida de **minimización** que reduce la exposición cualquiera sea la respuesta.
  - La lectura más restrictiva del art. 7.3 impactaría no solo al perfil no sanitario sino a **TR-C** (la historia longitudinal apoyada en consentimiento del titular) — el peor caso y sus rutas de adaptación están en §12.5.
  - La lectura que admite el consentimiento del titular como base (art. 5 + Dec. 1558) es la que BE adopta **como hipótesis de diseño declarada**, no como conclusión jurídica.
  - Esta tensión es exactamente el objeto de **VJR-1** (perfil no sanitario) y **VJR-4** (alcance del consentimiento como base para categorías sensibles pertinentes). Hasta que se resuelvan rige el default seguro de §11-bis.4.
  - **Consecuencia para BE que no debe quedar tácita** (hallazgo ADV2-17): el §9 asigna a BE el rol tentativo de **encargado (art. 25) del profesional** en TR-B. Si VJR-1/VJR-4 concluyeran que un perfil **no sanitario** no puede tratar determinadas categorías, BE no queda al margen: **sería el encargado de un tratamiento sin base suficiente**, posición que no es neutra. La mitigación real es la **matriz conservadora** (§11-bis.4) y el **gate §42**, no el encuadre contractual — un contrato de encargo no sanea la falta de base del responsable.
- **Límites de este análisis:** no es dictamen jurídico; lo incierto está en §52; las fuentes con confianza media/baja están marcadas y listadas para re-verificación.

## 7. Principios de privacidad y seguridad

1. **El dato pertenece al recorrido del asesorado; el acceso depende del vínculo autorizado.** 2. **Conservar historia no implica conservar permisos** (la conservación no autoriza lectura — Dirección §9.4). 3. **Deny by default** y **least privilege + need to know + Alcance**. 4. **Minimización** (RNF-PRI-001) en datos, superficies, logs, terceros y métricas. 5. **Finalidad explícita** — cada tratamiento tiene finalidad declarada (§9); prohibido reutilizar para fines incompatibles (art. 4.3). 6. **Seguridad proporcional al riesgo** (art. 9 + Res. 47/2018 como estándar de referencia). 7. **Privacidad por diseño**: las estructuras del 06 (consentimiento versionado, Alcances, historia por adición) son el mecanismo, no un anexo. 8. **Historia longitudinal con límites**: finalidad legítima elegida por el titular, no excusa de conservación ilimitada. 9. **No monetización de datos** (03 §22). 10. **Cero IA externa identificable en MVP** (§23). 11. **Terceros reciben únicamente lo necesario** (§34). 12. **Una demo sintética no baja el diseño; sí permite fasear la implementación** (§42).

## 8. Modelo de responsabilidades

**Intención de Dirección** `[DIRECCIÓN §9.1]`: BE provee la tecnología; el profesional presta el servicio y responde por sus decisiones y por el uso de la información a la que accede; BE responde por operar su plataforma. **Análisis honesto:** BE **no es un hosting pasivo** — registra usuarios, administra identidades, mantiene historia longitudinal multi-profesional, controla accesos y define funcionalidades. Por eso el encuadre único "BE = mero encargado" **no se sostiene para todos los tratamientos**: se analiza **por finalidad** (§9), preservando la intención donde es jurídicamente sostenible y marcando VJR donde no hay certeza. **BE no queda liberado de responsabilidad sobre datos**: como mínimo responde por seguridad (art. 9), confidencialidad (art. 10), y por los tratamientos cuya finalidad determina (cuenta, seguridad, plataforma longitudinal).

Matriz por actividad (responsabilidad operativa / contractual propuesta / VJR):

| Actividad | BE | Profesional | Asesorado | Tercero | VJR |
|---|---|---|---|---|---|
| Alta y cuenta del usuario | Ejecuta y responde (finalidad propia) | — | Titular | Plataforma (encargo) | Encuadre general |
| Registro de datos de salud en un proceso profesional **sanitario** (nutrición) | Soporte técnico, seguridad, control de acceso | **Decide, registra y responde profesionalmente**; secreto profesional (art. 8) | Titular; consiente por Alcance | — | ¿BE encargado del profesional o corresponsable? **VJR-1** |
| Consulta de información sensible **pertinente** por perfil **no sanitario** (entrenamiento) | Define y aplica la matriz de pertinencia (§11-bis), minimiza, audita | Consulta **solo lo pertinente** a la finalidad; confidencialidad contractual (art. 10); responde por el uso | Titular; autoriza categorías pertinentes; puede revocar | — | Suficiencia del consentimiento por categoría: **VJR-1/VJR-4**; hasta entonces, *safe default* §11-bis.4 |
| Decisión profesional (plan, revisión) | NO decide contenido | **Responsable exclusivo** | Destinatario | — | — |
| Historia longitudinal multi-profesional | **Finalidad de producto de BE** (elegida por el titular) | Accede solo por Alcance vigente | Titular; la elige y la controla | — | Rol de BE en este tratamiento — **VJR-1** |
| Seguridad/auditoría | **Responsable** (art. 9/10) | Custodia sus credenciales | Custodia las suyas | Plataforma bajo DPA | — |
| Almacenamiento/infraestructura | Contrata y controla | — | — | **Encargado/subencargado** (art. 25 + §35) | Mecanismo de transferencia — VJR-2 |
| Exportación | Autoriza, registra, limita | **Responsable de la copia recibida** | Puede exportar lo propio | — | Deslinde fino §20 |
| Incidentes | Detecta, contiene, comunica (§37) | Reporta los suyos (p.ej. credencial comprometida) | Reporta | Notifica ≤72 h (contractual) | Obligaciones de comunicación |
| Cierre/supresión | Ejecuta por categorías (§17) | Pierde acceso | Ejerce derechos | Borra bajo DPA | Retenciones concurrentes (26.529) — VJR-3 |

Sin cláusulas de exoneración absolutas: la asignación contractual definitiva es materia de los términos legales (con asesoramiento) — este documento fija la política que esos términos deben reflejar.

## 9. Inventario de tratamientos (análisis por finalidad)

No se impone una etiqueta jurídica global; cada tratamiento se analiza por quién determina finalidad y medios `[INFERENCIA + VJR]`:

| # | Tratamiento | Finalidad | Quién determina finalidad | Rol tentativo de BE | Base/habilitación tentativa | VJR |
|---|---|---|---|---|---|---|
| TR-A | Cuenta BE (identidad, acceso, perfil) | Operar el servicio | **BE** | Responsable | Consentimiento (términos/privacidad) + art. 5.2.d (relación contractual) | Menor |
| TR-B | Expediente operado por el profesional (evaluaciones, planes, revisiones del proceso) | Prestación del servicio profesional **dentro del Alcance autorizado** | **El profesional** (contenido y uso) sobre la plataforma que BE define | Encargado del profesional (art. 25) — con elementos de corresponsabilidad por definir | **Perfil sanitario:** art. 8 + consentimiento específico. **Perfil no sanitario:** consentimiento específico del titular limitado a las **categorías pertinentes** a la finalidad (§11-bis); su suficiencia jurídica por categoría **no se declara resuelta** | **VJR-1 (la central) + VJR-4** |
| TR-C | Historia longitudinal elegida por el asesorado (persistencia multi-profesional, timeline integral) | Continuidad longitudinal del titular | **BE ofrece la finalidad; el titular la elige** | Responsable (o corresponsable) | Consentimiento específico del titular (tipo dedicado — §12) | VJR-1 |
| TR-D | Seguridad, auditoría y prevención de abuso | Proteger el servicio y los datos | **BE** | Responsable | Obligación legal (arts. 9/10) + interés en el cumplimiento | Menor |
| TR-E | Analítica agregada/anónima de producto | Mejorar el producto | **BE** | (Sobre datos disociados: fuera del régimen si la disociación es real — art. 2) | Disociación efectiva (§22); si no se logra: consentimiento | Estándar de disociación |
| TR-F | Soporte excepcional (break-glass) | Resolver incidencia con acceso mínimo | **BE** | Responsable | Necesidad + política §28 + auditoría; comunicación al titular | Sí — límites |
| TR-G | Verificación profesional (matrículas, evidencia) | Habilitar profesionales | **BE** | Responsable | Consentimiento del profesional + interés legítimo de verificación | Verificación por jurisdicción (VJR-4) |
| TR-H | Transferencia a infraestructura internacional | Alojar/procesar | BE (elige proveedores) | Exportador | Art. 12 + mecanismo §35 | **VJR-2** |

Consecuencias de diseño (válidas ante los resultados **previsibles** de VJR-1 — ver el límite honesto abajo): el consentimiento se estructura por relación y alcance (§12); la historia longitudinal tiene consentimiento propio del titular hacia BE (TR-C) separado del consentimiento hacia cada profesional (TR-B); los contratos BE↔profesional incluyen el encargo del art. 25 (instrucciones, seguridad, confidencialidad, destino de datos) **sin** que el fin del contrato con UN profesional destruya la historia del titular — porque TR-C tiene base y titularidad propias. Esta separación es exactamente lo que evita la tensión "destrucción al fin del encargo vs producto longitudinal".

**Límite honesto de la separación TR-B/TR-C** `[v0.1.1 — sostiene ADV-02 y el hallazgo externo]`: la separación es robusta ante los resultados **previsibles** de VJR-1 (encargado / corresponsable / responsable), pero **no absorbe cualquier resultado**. Una lectura maximalista del art. 7.3 que negara al consentimiento del titular eficacia para sostener un archivo de datos sensibles fuera del art. 8 impactaría **también a TR-C**, no solo al perfil no sanitario. El peor caso y sus tres rutas de adaptación están en **§12.5**; la tensión normativa de fondo, en **§6**.

**Desdoblamiento analítico de TR-B (v0.1.1).** A efectos de la política de acceso, TR-B se lee en dos sub-tratamientos con el mismo titular y distinta habilitación. Es un desdoblamiento **analítico, no estructural**: no crea entidades, módulos ni Alcances, y no modifica la taxonomía del BE-LEG-06.

| | **TR-B1** — Expediente del profesional **sanitario** | **TR-B2** — Encargo del profesional **NO sanitario** |
|---|---|---|
| Perfil | Nutricionista matriculado (perímetro exacto: VJR-4) | Entrenador, health coach y análogos |
| Qué datos | Los de su Alcance, con el detalle que su práctica requiere | **Solo la información pertinente y necesaria al Alcance**, con mínimo detalle suficiente (§11-bis.3) |
| Habilitación tentativa | Art. 8 + consentimiento específico B2 | Consentimiento específico B2 **acotado por pertinencia** — suficiencia jurídica **NO declarada resuelta** (VJR-1/VJR-4) |
| Expediente completo | Dentro de su Alcance | **Nunca** — ninguna ruta del sistema se lo entrega (§11-bis.3, §20) |
| Si la validación jurídica estrecha el perímetro | Sin impacto estructural | **Cambio de configuración** de la matriz §11-bis, sin migración de datos ni reestructuración de Vínculos, Alcances ni historia |
| Exposición propia de BE | Encargado de un tratamiento con base (art. 8) | **Encargado de un tratamiento cuya base está declarada no resuelta** — ver §6, última viñeta. Ser encargado no sanea la falta de base del responsable; por eso el default conservador no es prudencia decorativa |

---

## 10. Clasificación de información

Esquema adoptado (**6 clases** en v0.1.1, proporcionado a BE). **Naturaleza de esta clasificación:** es una **política interna de protección**, no una calificación jurídica campo por campo. En particular, **C4 puede ser deliberadamente más conservadora que el encuadre legal**: BE trata como C4 todo lo que se refiera a salud, hábitos o estado físico del titular aunque un análisis jurídico individual pudiera calificar algún campo de otro modo. La clase determina **cómo se protege**; la licitud del tratamiento se analiza por finalidad (§9) y la pertinencia del acceso por Alcance (§11-bis).

| Clase | Definición | Ejemplos BE |
|---|---|---|
| **C1 PÚBLICA** | Publicada deliberadamente por BE o por un profesional para descubrimiento | Publicación de servicio antropométrico (nombre profesional, servicio, ubicación utilizable — 06 T-06-36); contenido institucional |
| **C2 INTERNA** | Operativa de BE, sin datos personales de usuarios | Configuración no secreta, métricas agregadas anónimas (§22), documentación |
| **C3 PERSONAL** | Dato personal no sensible | Nombre, correo, teléfono, datos de cuenta, IP/user-agent en eventos de identidad, datos profesionales de contacto, matrícula/evidencia de verificación profesional, vínculos y alcances (metadatos de relación), logs con actor pseudorreferenciado |
| **C4 SENSIBLE/SALUD** | Dato personal que revela o se refiere a la salud, hábitos o estado físico del titular | Peso, pliegues, circunferencias, composición, antecedentes, objetivos corporales, dieta/ingestas, planes nutricionales y de entrenamiento aplicados a la persona, ejecuciones, observaciones/notas del profesional sobre el asesorado, **fotografías/evidencia visual del asesorado**, revisiones y decisiones profesionales sobre la persona |
| **C5 SECRETO TÉCNICO** | Material que habilita acceso o compromete el sistema; se protege **principalmente de la lectura** | Credenciales, hashes de contraseña, tokens, secretos de firma, claves de proveedor, material criptográfico, URLs firmadas vigentes |
| **C6 RESTRINGIDO DE SEGURIDAD Y GOBERNANZA** *(nueva en v0.1.1)* | Evidencia de gobernanza que **necesita consulta autorizada, integridad, retención y trazabilidad** — y transparencia hacia el titular en determinados casos (§19.7). No es un secreto: es un registro protegido | Registros de auditoría de acceso (§29), registros de break-glass (§28), evidencia de incidentes (§37), bitácoras administrativas y de acceso extra-aplicación (§28.3-bis), registro de supresiones (§18), registros de exportación (§20) |

**Motivo de la separación C5/C6** (corrección externa): un secreto se protege sobre todo *de ser leído*; la auditoría, en cambio, **debe poder consultarse** por quien corresponda (gobernanza, y el propio titular respecto de los accesos a sus datos), exige **integridad** y **retención larga**, y su valor es probatorio. Tratarlas como una sola clase producía reglas contradictorias (§11).

Criterio de borde: el **plan aplicado a una persona** y toda su ejecución es C4 aunque un plan-plantilla genérico de catálogo sea C2/C3; la **ubicación del servicio profesional publicado** es C1, pero la geolocalización de un asesorado (si alguna función futura la tocara) sería C3/C4 con evaluación nueva (§33-bis). Los **recursos didácticos licenciados** (DEC-047) son C2 con obligaciones de licencia (no dato personal del asesorado).

**Reglas por clase:**

| Regla | C1 | C2 | C3 | C4 | C5 | C6 |
|---|---|---|---|---|---|---|
| Quién accede | Público | Operación BE | Titular + contrapartes necesarias + ADMIN (gestión) | Titular; profesional con Vínculo+Alcance+consentimiento vigentes **y solo en las categorías pertinentes a su finalidad** (§11-bis); ADMIN **solo break-glass** | Solo sistema/operador según función; nunca usuarios | Gobernanza (ADMIN, sin contenido C4) + **el titular respecto de los accesos a sus datos** (§19.7); nunca los profesionales sobre terceros |
| Puede aparecer en logs técnicos | Sí | Sí | Solo ID pseudorreferenciado | **NUNCA** (ni valores ni contenido) | **NUNCA** | No (vive en su propio registro) |
| Puede aparecer en auditoría | Sí (referencia) | Sí | IDs y metadatos | Solo referencias (IDs/categoría), jamás contenido | Jamás valores | Es la auditoría |
| Exportable | N/A | No aplica | En productos previstos | Solo productos previstos §20, auditado | **NUNCA** | No como producto; sí como respuesta a derechos (§19.7) o requerimiento legal (§19.8) |
| Integridad exigida | — | — | Normal | Alta (historia por adición) | Alta | **Máxima: append-only, sin UPDATE/DELETE por ningún flujo de producto** |
| Cifrado | TLS | TLS | TLS + at-rest | TLS + at-rest (+ URL firmada para media) | TLS + at-rest + hash cuando aplique | TLS + at-rest |
| Retención | §16 | §16 | §16 por categoría | §16 por categoría | Mínima (tokens/sesiones: vida corta) | Larga y gobernada (R-09/R-12; §16) |
| Terceros | Mapa (solo lo del §33-bis) | Proveedores de plataforma | Mínimo necesario por función (§34) | **Regla de oro: ningún tercero recibe C4 salvo el propio almacenamiento de plataforma bajo DPA** (§34/§35); prohibición IA §23 | Nunca | Nunca (salvo requerimiento legal §19.8) |

## 11. Matriz de actores y acceso (datos × Alcance)

Principio rector: **el dato pertenece al recorrido del asesorado; el acceso del profesional depende del Vínculo+Alcance+consentimiento vigentes** — nunca de la mera existencia del dato. La visión integral es del asesorado; el profesional la obtiene únicamente si la unión de sus Alcances autorizados la habilita.

Leyenda: ✔ acceso pleno por función · Ⓐ solo con Alcance correspondiente vigente · ✖ sin acceso · BG solo break-glass §28 · (m) metadatos sin contenido.

| Categoría de dato | Clase | Origen | Asesorado (titular) | Prof. Nutrición Ⓐ | Prof. Entrenamiento Ⓐ | Capacidad Antropométrica Ⓐ | ADMIN | Exportable | Auditado | Retención §16 | Tercero posible |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Identidad/cuenta (correo, nombre) | C3 | titular | ✔ | contacto mínimo del vínculo | ídem | ídem | ✔ (gestión) | producto propio | eventos | R-01 | plataforma |
| Credenciales/MFA | C5 | titular | (gestiona) | ✖ | ✖ | ✖ | ✖ (reset sin ver) | ✖ | eventos | R-02 | plataforma (hash) |
| Perfil propio no sensible | C3 | titular | ✔ | Ⓐ si pertinente | Ⓐ | Ⓐ | ✖ contenido | producto | — | R-03 | plataforma |
| Datos profesionales (matrícula, evidencia verificación) | C3 | profesional | ✖ (ve estado verificado) | ✔ propio | ✔ propio | ✔ propio | ✔ (verificación) | ✖ | cambios | R-04 | plataforma |
| Vínculos/Alcances/solicitudes | C3 | ambas partes | ✔ propios | ✔ propios | ✔ propios | ✔ propios | ✔ (m) | ✖ | cambios | R-05 | plataforma |
| Consentimientos/revocaciones | C3 (evidencia) | titular | ✔ propios | estado del propio alcance | ídem | ídem | ✔ (m, gestión) | constancia propia | SIEMPRE | R-06 | plataforma |
| Evaluación/objetivo nutricional | C4 | prof./titular | ✔ | **Ⓐ Nutrición** | ✖ | ✖ | BG | producto §20 | acceso | R-07 | plataforma |
| Plan nutricional aplicado + ingesta | C4 | prof./titular | ✔ | **Ⓐ Nutrición** | ✖ | ✖ | BG | producto | acceso | R-07 | plataforma |
| Plan entrenamiento + ejecución | C4 | prof./titular | ✔ | ✖ | **Ⓐ Entrenamiento** | ✖ | BG | producto | acceso | R-07 | plataforma |
| Mediciones/cálculos antropométricos | C4 | prof. con capacidad | ✔ | Ⓐ si su Alcance lo habilita | Ⓐ ídem | **Ⓐ Antropometría** | BG | producto | acceso | R-07 | plataforma |
| **Condiciones de salud declaradas pertinentes para ejercicio** (diabetes, hipertensión, asma, antecedentes cardiovasculares relevantes) | C4 | titular / prof. | ✔ | **Ⓐ NUT** si pertinente a su finalidad | **Ⓐ ENT — resumen funcional** (§11-bis.3) | Ⓐ si pertinente | BG | producto | **acceso** | R-07 | plataforma |
| **Dolor, lesiones, restricciones y limitaciones funcionales** | C4 | titular / prof. | ✔ | Ⓐ si pertinente | **Ⓐ ENT** | **Ⓐ ANTRO** si pertinente | BG | producto | acceso | R-07 | plataforma |
| **Medicación con relevancia directa para la práctica física** | C4 | titular / prof. | ✔ | Ⓐ si pertinente | **Ⓐ ENT — solo el hecho relevante**, no el historial farmacológico | ✖ | BG | producto | acceso | R-07 | plataforma |
| **Antecedentes y estudios NO pertinentes a la finalidad** (ginecológicos, psiquiátricos, gastrointestinales sin relación, laboratorio no relacionado, informes clínicos completos) | C4 | titular / prof. | ✔ | ✖ salvo pertinencia declarada | **✖ (deny; y deny en caso dudoso — §11-bis.4)** | ✖ | BG | producto del titular | acceso e **intentos denegados** | R-07 | plataforma |
| Revisiones/decisiones profesionales | C4 | profesional | **✔ (sin notas secretas — §9.15)** | Ⓐ del dominio propio | Ⓐ ídem | Ⓐ ídem | BG | producto | acceso | R-07 | plataforma |
| Evidencia visual (fotos) | C4 reforzada | titular (opcional) | ✔ | Ⓐ del dominio + información destacada | Ⓐ ídem | Ⓐ ídem | BG | ✖ por defecto | SIEMPRE | R-08 | storage privado |
| Historia longitudinal integrada (timeline) | C4 | derivada | **✔ (visión integral)** | solo la porción de sus Alcances | ídem | ídem | BG | producto propio del titular | acceso | R-07 | plataforma |
| Auditoría de acceso | **C6** | sistema | accesos sobre sus datos (§19.7) | ✖ (salvo sus propios asientos como actor — §19.9) | ídem | ídem | ✔ (m, gobernanza) | ✖ | SIEMPRE (es la auditoría) | R-09 | plataforma |
| Logs técnicos | C3 mín. | sistema | ✖ | ✖ | ✖ | ✖ | operador | ✖ | — | R-10 | plataforma/monitoreo |
| Incidencias administrativas | C3 | actores | las propias | las propias | las propias | las propias | ✔ | ✖ | cambios | R-11 | plataforma |
| Agregados anónimos (§22) | C2 | derivada | — | — | — | — | ✔ | interno | — | **R-14** | interno |
| Registros de exportación | **C6** | sistema | los propios | los propios | los propios | los propios | ✔ (m, gobernanza) | ✖ | SIEMPRE | R-12 | plataforma |
| Recursos didácticos licenciados | C2+licencia | catálogo | consume | ✔ según ámbito | ✔ | ✔ | ✔ | s/licencia | — | R-13 | CDN/storage |

Notas vinculantes: (1) "contacto mínimo del vínculo" = lo necesario para operar la relación, no el perfil completo; (2) un profesional con **doble Alcance** ve la unión de lo pertinente a cada uno, jamás más; (2-bis) **la marca Ⓐ nunca significa "toda la categoría"**: significa acceso a lo **pertinente a la finalidad de ese Alcance, con mínimo detalle suficiente** (§11-bis.2/11-bis.3); en caso dudoso, deny (§11-bis.4); (3) las filas C4 exigen además consentimiento vigente y **Vínculo ACEPTADO/activo (ni PAUSADO ni FINALIZADO** — §14.1); (4) la columna ADMIN refleja el §28: gestión sin contenido de salud; (5) los IDs de retención R-xx se resuelven en la matriz §16; (6) en la fila fotos, "Exportable ✖ por defecto" aplica al **profesional** — el titular siempre puede exportar su propia historia, fotos incluidas (§19/§20).

---

## 11-bis. Acceso por pertinencia e "Información relevante para la seguridad del entrenamiento"

> Sección incorporada en **v0.1.1** por precisión de Dirección posterior a la v0.1. Es una **regla de clasificación y acceso del 08**: NO crea entidad de dominio, módulo, Alcance ni taxonomía canónica del 06 (que no se toca).

### 11-bis.1 Principio rector

> **Compartir la información necesaria, con la persona autorizada, para la finalidad autorizada, durante el tiempo autorizado, con el mínimo detalle suficiente.**

Dos extremos quedan **prohibidos** por esta política:

| Extremo prohibido | Por qué |
|---|---|
| "Un profesional no sanitario no puede acceder a ningún dato de salud" | Impide cumplir con seguridad la finalidad que el propio titular autorizó (programar ejercicio sin conocer una hipertensión declarada es menos seguro, no más privado) |
| "Si el usuario consintió, el profesional accede a cualquier dato sensible" | Convierte el consentimiento en llave universal, viola minimización (art. 4.1: pertinente y no excesivo) y RNF-SEC-006 (mínimo privilegio) |

Formalización: **dato sensible ≠ prohibido para Entrenamiento** · **consentimiento ≠ acceso universal**.

### 11-bis.2 La categoría de política

Se define la vista de autorización **"Información relevante para la seguridad del entrenamiento"** (y, por analogía, la vista pertinente de cada Alcance). Puede incluir, **según contexto y siempre por pertinencia declarada**:

- condiciones metabólicas relevantes (p. ej. **diabetes tipo 1/2**);
- condiciones cardiovasculares relevantes (p. ej. **hipertensión arterial**, antecedentes cardiovasculares con impacto en el ejercicio);
- condiciones respiratorias relevantes (p. ej. **asma**);
- **dolor** (localización, intensidad, contexto de aparición — p. ej. "dolor lumbar 6/10 al flexionar");
- **lesiones** y cirugías relevantes para la práctica física;
- **restricciones y limitaciones funcionales** (p. ej. "evitar impacto");
- **medicación** cuando tenga relevancia directa para la práctica física;
- recomendaciones o restricciones declaradas por profesionales de la salud que condicionen el ejercicio.

**NO habilita, y el consentimiento no lo suplen:** historia clínica completa · estudios diagnósticos o de laboratorio no relacionados · historia ginecológica, psiquiátrica o gastrointestinal no pertinente · **plan nutricional detallado** · información perteneciente a **otro Alcance** · "todos los datos médicos porque existe un Vínculo".

> **Sin cláusula de escape en tiempo de ejecución** (corrección ADV2-01). La v0.1.1 en su primera pasada escribía "no habilita *automáticamente* (salvo autorización específica y finalidad que lo justifique)". **Esa redacción se retira**: reabría exactamente el extremo prohibido B (§11-bis.1) y contradecía la instrucción de Dirección §9.17, que dice que **el filtro de pertinencia es adicional al consentimiento, no sustituido por él**. La regla vigente es:
>
> **El ancho de lo accesible se cambia SOLO modificando la matriz de pertinencia (§11-bis.4), por decisión de Dirección con acta — nunca por una autorización otorgable caso a caso en tiempo de ejecución, ni por un consentimiento adicional que el titular pudiera firmar en el momento.**
>
> Si en el futuro Dirección quisiera habilitar una categoría hoy excluida, el camino es la vía de gobierno (cambio de matriz versionado y auditado, §11-bis.4.5), con la validación jurídica que corresponda. No existe una "autorización específica" que un profesional pueda pedir y obtener dentro del producto.

### 11-bis.3 Mínimo detalle suficiente

Cuando la finalidad se cumple con el **resumen funcional**, no se entrega el documento completo:

| Suficiente para la finalidad | No corresponde por defecto |
|---|---|
| "Hipertensión — declarada por el asesorado" | Expediente cardiológico completo |
| "Diabetes tipo 1 — declarada" | Historial de laboratorio, glucemias completas |
| "Restricción: evitar impacto" | Informe clínico completo que la origina |
| "Dolor lumbar 6/10 al flexionar" | Estudios de imagen y su informe |

**Cómo se cambia el nivel de detalle normal** (consolidación v0.1.2): para evitar que el consentimiento se convierta en una excepción dato-a-dato, el MVP reconoce **una sola vía de cambio de política**, no otorgable por el profesional ni por una superficie de runtime:

| Vía | Quién la ejerce | Requisitos | Efecto |
|---|---|---|---|
| **Cambio de la matriz de pertinencia** | **Dirección**, por acta (§11-bis.4.5) | Fundamento, validación jurídica y disciplinar cuando corresponda, versionado y auditoría del cambio | Cambia el nivel de detalle **para todos** los vínculos de ese Alcance, hacia adelante |

**No existe en el MVP un escalamiento de detalle por consentimiento dato-a-dato.** El B2 conserva la granularidad definida en §12: `profesional × Alcance × finalidad × categorías pertinentes`, no por campo, lectura ni documento individual. Si en el futuro se quisiera permitir que el titular comparta deliberadamente un informe o dato excluido del nivel normal de detalle, eso constituye una **capacidad nueva de compartición explícita**, que debe diseñarse y aprobarse por separado; no funciona como excepción implícita a esta política.

**Prohibido explícitamente:** que el profesional invoque una "finalidad específica" para obtener mayor detalle; que el sistema conceda escalamiento por decisión propia; que se use el break-glass del §28 (que es de BE, no de profesionales) para acceder a detalle de salud. El cambio de nivel de detalle normal ocurre únicamente mediante la matriz versionada y auditada (§29). Este es el criterio operativo de la minimización (art. 4.1 + RNF-PRI-001) aplicado al acceso, no solo a la recolección.

### 11-bis.3-bis Regla de borde: qué pasa con el texto libre y quién produce el "resumen funcional"

Hueco señalado por la revisión adversarial (ADV2-07): decir "se entrega el resumen, no el documento" no basta si no se dice **de dónde sale el resumen** ni qué ocurre con un registro que mezcla información pertinente y no pertinente (el caso normal de una nota profesional).

1. **El resumen funcional es dato estructurado declarado, no una derivación automática de texto libre.** Sale de campos clasificados (condición + implicancia para la práctica), cargados por el titular o por un profesional dentro de su Alcance. La clasificación por categoría es **metadato de clasificación sobre estructuras que ya existen** — no un modelo de dominio nuevo (§11-bis.2).
2. **Todo registro de texto libre queda FUERA de la vista pertinente por defecto (deny).** Un campo de texto no es clasificable por categoría, de modo que no puede afirmarse que sea pertinente ni que su detalle sea mínimo. Regla: si la información de seguridad importa, se carga en el campo estructurado; si vive solo en una nota, no se expone por esta vía.
3. **Prohibido en MVP generar el resumen automáticamente a partir de texto libre.** Una síntesis automática de una nota clínica sería un dato `INTERPRETADO`/`CALCULADO` presentado como si fuera declarado, y colisiona con el encuadre **no diagnóstico** del proyecto y con la prohibición de IA del §23. Si alguna vez se propusiera, es decisión nueva con evaluación completa.
4. **Consecuencia asumida y declarada:** parte de la información de seguridad puede quedar inaccesible por estar mal ubicada (en una nota en lugar de un campo). La mitigación es de producto — que la UI empuje a cargarla donde corresponde (§49) —, no una excepción de acceso.

### 11-bis.4 Safe default hasta VJR-1/VJR-4

Antes de la validación jurídica, el sistema opera en **modo conservador**:

1. Se autoriza **únicamente** el subconjunto de información sensible cuya **pertinencia esté explícitamente clasificada y documentada** para la finalidad del Alcance (la matriz de pertinencia, mantenida como configuración — no como estructura de dominio).
2. Dato inequívocamente **fuera de finalidad** → **deny**.
3. Caso **dudoso** → **deny hasta clasificación** (denegación conservadora, coherente con UC-I02).
4. La matriz de pertinencia debe poder **modificarse después** (ampliarse o estrecharse, p. ej. si VJR-1/VJR-4 restringen categorías) **sin alterar** Vínculos, Alcances, historia ni datos persistidos — requisito de arquitectura para el 07/09 (§47).

### 11-bis.4-bis Qué es exactamente la matriz de pertinencia (para que sea construible)

Corrección ADV2-06: la v0.1.1 exigía "clasificar la pertinencia" pero prohibía modelarla, sin decir **sobre qué atributo** filtra el PDP. Un ingeniero no podía construirla. Se especifica, **sin crear entidad canónica ni tocar el BE-LEG-06**:

| Aspecto | Definición |
|---|---|
| **Unidad de clasificación** | La **categoría de dato del §11** (la fila de la matriz de actores), no el registro individual ni el campo suelto. La pertinencia se decide por categoría, no dato por dato |
| **Forma de la configuración** | Una tabla de configuración `alcance × categoría → { permitido, nivel_de_detalle }`, con `nivel_de_detalle ∈ { RESUMEN_FUNCIONAL, COMPLETO_DEL_ALCANCE }`. Es **configuración de política**, del mismo orden que la matriz `EspecialidadPermiso` del seed — no una entidad de dominio ni un Alcance nuevo |
| **Ausencia de fila** | **Deny** (§11-bis.4.3): la matriz es una allowlist, nunca una denylist |
| **Dónde se aplica** | En el mismo plano de decisión del PDP (§27.3), **después** de las 7 dimensiones canónicas del 06 y sin sustituir ninguna. Si cualquiera de las 7 deniega, la pertinencia no se evalúa |
| **Propietario** | **Dirección**, por acta. Ni el profesional, ni el asesorado, ni un administrador de BE pueden modificarla desde el producto |
| **Control de cambios** | Versionada. Todo cambio se registra con versión, fecha, fundamento y actor, y **se audita** (§29 — evento agregado a la lista de auditables). Una decisión de acceso registra **qué versión de la matriz** la resolvió, igual que registra la versión de consentimiento (REG-06-50) |
| **Qué NO es** | No es entidad de dominio · no es módulo · no es Alcance · no es una categoría de `EventoSalud` · no modifica la taxonomía del BE-LEG-06 · no es un permiso otorgable en runtime |

**Obligación derivada para 07/09:** esta configuración debe ser desplegable y modificable **sin migración de datos ni reconstrucción de Vínculos/Alcances/historia** (§47). Eso **no significa ampliar un consentimiento existente en silencio**: una reducción de acceso puede aplicarse inmediatamente; una ampliación de categoría o de nivel de detalle exige una **nueva versión B2 y nueva aceptación del titular** para los vínculos ya existentes (§11-bis.4-ter, §12.2). Obligación derivada para 11A: probar que invertir la matriz cambia el resultado de los casos P/N del §50.1, que A-1/A-2 NO cambian, y que una ampliación no habilita datos hasta re-autorizar (A-5).

### 11-bis.4-ter Cambio de la matriz — procedimiento (§11-bis.4.5)

1. Propuesta fundada (qué categoría, qué Alcance, qué nivel de detalle, por qué es *necesaria* para desempeñar el Alcance con seguridad).
2. Validación jurídica cuando la categoría sea sensible y la habilitación dependa de VJR-1/VJR-4.
3. **Acta de Dirección** — no basta una decisión operativa.
4. Nueva versión de la matriz + asiento de auditoría del cambio.
5. Si el cambio **reduce** acceso: aplicación inmediata (no requiere nueva aceptación; es más protector) y registro de auditoría. Si **amplía** acceso —nueva categoría o mayor nivel de detalle—: **no modifica por sí mismo lo ya consentido**. Se publica una nueva versión de B2/texto aplicable, se informa al titular y los vínculos existentes permanecen con el perfil previamente autorizado hasta que el titular **acepte expresamente la nueva versión**. La mera información no amplía un consentimiento anterior.

### 11-bis.5 El usuario sabe para qué carga sus datos

`[DIRECCIÓN]` La información previa (A2/A3, §12.1) debe explicar con claridad que la información de salud que el asesorado carga: (1) construye **su** perfil longitudinal integral; (2) determinadas partes **pertinentes** pueden ser consultadas por profesionales con Vínculo activo; (3) ese acceso depende del **Alcance y la finalidad** autorizados; (4) **él controla** la autorización; (5) puede **revocarla**; (6) **terminar el vínculo corta** el acceso profesional. Se preserva la separación usuario↔BE / asesorado↔profesional: **no se vuelve al checkbox global único**.

*Modelo conceptual para 10 (no es copy legal definitivo):* "La información que cargues puede utilizarse para construir tu perfil integral y, cuando vos lo autorices, ser consultada por los profesionales vinculados únicamente en la medida necesaria para los alcances que habilites."

### 11-bis.6 Recorrido completo (criterio de éxito de la política)

1. El asesorado declara **diabetes**. El dato entra a **su** historia longitudinal (TR-C). **Nadie externo lo ve** por el mero hecho de existir.
2. Acepta un **Vínculo** con un entrenador y autoriza el **Alcance Entrenamiento**.
3. BE le informa que ciertas **condiciones de salud relevantes para la seguridad del ejercicio** podrán ser consultadas por ese profesional, y qué categorías son.
4. El asesorado **autoriza** (consentimiento B2 con categorías pertinentes — §12.4).
5. La diabetes queda **visible como información pertinente** para la finalidad de Entrenamiento, con mínimo detalle suficiente.
6. Eso **no habilita** al entrenador a leer la historia clínica completa, el plan nutricional ni información de otro Alcance.
7. Si el asesorado **revoca** el consentimiento o **finaliza** el vínculo: el entrenador **deja de verla** (§13/§14), y el dato **sigue existiendo** en la historia longitudinal del asesorado.
8. Si una **validación jurídica futura** restringe esa categoría: BE la **quita de la matriz de pertinencia** sin rediseñar historia, Vínculos ni Alcances (§11-bis.4).

### 11-bis.7 El caso incómodo: cuando la información NO está

Hallazgo adversarial ADV2-08, declarado sin suavizarlo: **§11-bis no resuelve el escenario que la motiva.** Si el asesorado **nunca cargó** su hipertensión, o la cargó y **no autorizó** esa categoría, el entrenador sigue "entrenando a ciegas" — el daño exacto que la instrucción §9.17 invoca para fundar toda esta sección. Ninguna política de acceso puede fabricar un dato que no existe.

**Reglas adoptadas:**

1. **No inferencia por ausencia (vinculante).** La ausencia de información **nunca** equivale a "no hay condición". Ninguna superficie de BE puede presentar una vista vacía como "sin condiciones de salud relevantes", ni el profesional puede tratarla así. Obligación de UI para el BE-LEG-10 (§49): la vista pertinente vacía se rotula con un mensaje **neutral y verdadero**, por ejemplo *"sin información disponible para este vínculo/alcance — no significa ausencia de condiciones"*, nunca *"sin condiciones"* ni *"sin información cargada"* (esto último sería falso cuando el dato existe pero no fue autorizado).
2. **No hay indicador de "existe información no autorizada".** Se evaluó ofrecer una señal neutra del tipo *"hay información de seguridad que no te fue autorizada"* y **se decide NO implementarla en el MVP**: revelaría la existencia de un dato sensible sin autorización del titular, contradiciendo la anti-enumeración del §27.8 y la propia lógica de que el titular controla qué comparte. **Consecuencia asumida:** el profesional no puede distinguir "no cargó nada" de "cargó y no me lo autorizó". Se registra como **riesgo residual declarado R-08-12**, no como problema resuelto.
3. **La mitigación es de producto, no de acceso.** El circuito correcto es que la UI del asesorado le pida la información de seguridad **al aceptar un Vínculo de entrenamiento** (§11-bis.5, §49) y que el profesional pueda **solicitarla al asesorado** por el canal de la relación — nunca obtenerla del sistema sin autorización.
4. **El profesional conserva su responsabilidad profesional.** Que BE no le muestre una condición no traslada a BE la decisión de entrenar sin anamnesis: el profesional responde por sus decisiones (§8) e indagar por fuera del sistema sigue siendo parte de su práctica. BE responde por no ocultarle lo que el titular **sí** autorizó.
5. **Prueba (§50.1):** con la información no cargada y con la información cargada-no-autorizada, el resultado observable del profesional debe ser **idéntico**; y la vista vacía debe usar el mensaje neutral definido en el punto 1, sin revelar si el dato no existe o existe pero no fue autorizado.

## 12. Consentimiento — Q-003

### 12.1 Modelo de dos relaciones (formalización)

`[DIRECCIÓN §9.2]` + estructuras del 06 (T-06-15/16/17) + marco legal §6:

**Relación A — usuario ↔ BE** (al crear/activar la cuenta; para asesorados y profesionales):
| Instrumento | Naturaleza | Contenido mínimo |
|---|---|---|
| A1. Términos de servicio | Aceptación contractual | Reglas del servicio; no es consentimiento de datos |
| A2. Política de privacidad + información art. 6 | **Información** (no checkbox mudo) | Responsable e identificación, finalidades por tratamiento (§9), destinatarios/encargados, carácter facultativo/obligatorio de cada dato, consecuencias, derechos y canal (§19), **existencia del acceso excepcional de soporte (break-glass §28) con sus garantías**, y transferencias internacionales (§35) |
| A3. Consentimiento de tratamiento de datos de salud por BE (TR-A/TR-C) | **Consentimiento expreso e informado** | Tratamiento de datos sensibles para operar el servicio y para la **historia longitudinal del titular** (finalidad propia, explicada en lenguaje claro). **Sobre infraestructura internacional (corregido en v0.1.1 — ADV2-05):** A3 incluye la **información** del art. 6 (qué destinos, qué mecanismo, qué proveedores) — **no** un consentimiento de transferencia. El acto `TRANSFERENCIA_INT` se solicita **únicamente** en el escenario C de §35.2 (cuando la transferencia se apoya específicamente en el consentimiento); en los escenarios A y B **no se pide**, para no crear la dependencia operativa del red-team #41 |

**Relación B — asesorado ↔ profesional** (por cada Vínculo por Alcance):
| Instrumento | Naturaleza | Contenido |
|---|---|---|
| B1. Aceptación del Vínculo | Decisión relacional (T-06-15/16) | Aceptar la relación con ESE profesional para ESE Alcance — **no consiente datos** (INV-06-53) |
| B2. Consentimiento específico por Alcance | **Consentimiento sensible específico** (T-06-17) | Autoriza a ESE profesional × ESE Alcance × ESA finalidad × **LAS CATEGORÍAS PERTINENTES a esa finalidad** (§11-bis.2, enumeradas de forma comprensible); **texto diferenciado según el perfil del profesional** (§12.3); versionado; revocable |

**Granularidad de B2 (precisión v0.1.1):** el titular autoriza `PROFESIONAL × ALCANCE × FINALIDAD × CATEGORÍAS PERTINENTES`. **No** es consentimiento por campo, por dato individual ni por lectura: las categorías se presentan agrupadas y comprensibles. *Modelo conceptual para 10 (no es copy legal definitivo):* «**Juan Pérez — Entrenamiento.** Para planificar y supervisar tu entrenamiento de manera segura, podrá consultar: ✓ información de entrenamiento · ✓ objetivos físicos · ✓ lesiones y limitaciones · ✓ dolor relevante · ✓ condiciones de salud relevantes para el ejercicio · ✓ restricciones relacionadas con la actividad física.»

**Reglas duras:** aceptar términos ≠ autorizar tratamiento sensible ≠ autorizar a un profesional (tres actos distintos con evidencia distinta); no hay consentimiento acción-por-acción (el consentimiento es por alcance/finalidad, la autorización sí se evalúa por operación); no hay acceso cross-scope automático; el onboarding puede presentarlos con UX simple **sin perder trazabilidad** (un solo flujo visual puede recolectar A1+A2+A3 como actos separados registrados por separado — obligación para 10).

### 12.2 Evidencia mínima por acto de consentimiento

Alineada con REG-06-50 y UC-P07 (versión **mostrada** y versión **aceptada**): quién (titular; solo el asesorado otorga — INV-06-62) · cuándo (ocurrencia y registro) · **versión del texto aceptado** (identificador + hash del texto) · finalidad · alcance (tipo A3 o Alcance de vínculo B2) · profesional y componente de Vínculo (en B2) · **versión/perfil de matriz de pertinencia y categorías/nivel de detalle efectivamente autorizados en ese acto** · estado (VIGENTE/REVOCADO) · cadena de versiones (aceptar una versión nunca acepta futuras — INV-06-61) · canal/superficie · evidencia técnica (IP/user-agent del acto — clasificados C3, retención según §16). El AS-IS actual (2 tipos con versión "v1" placeholder, sin alcance/profesional/finalidad/hash — `auth.service.ts:36-38`, `schema.prisma:1020-1031`) **no satisface este modelo**: gap G-3 (§43), a cerrar antes de datos reales.

### 12.3 Textos diferenciados por perfil profesional (consecuencia del art. 8)

`[INFERENCIA + VJR-1/VJR-4]`: para profesionales de ciencias de la salud (nutricionista matriculado), el consentimiento B2 informa el tratamiento en el marco de la relación profesional sanitaria (art. 8 + secreto profesional).

Para perfiles **no sanitarios** (entrenador), **decisión funcional de BE** (§11-bis): el consentimiento B2 habilita el acceso a la información sensible **pertinente y necesaria** para la finalidad del Alcance autorizado, con mínimo detalle suficiente — no al expediente completo. El texto debe decir con claridad reforzada: quién es el profesional, **qué no es** (no es profesional de la salud), **qué categorías pertinentes** podrá consultar y para qué finalidad, que puede revocar cuando quiera, y el deber de confidencialidad contractual que BE le impone (art. 10 alcanza a todo interviniente en el tratamiento, sea o no sanitario).

**Conclusión jurídica — separada de la decisión funcional:** la **suficiencia jurídica del consentimiento** como habilitación para cada categoría de dato sensible tratada por un perfil no sanitario **no se declara resuelta** en esta versión. Debe validarse dentro de **VJR-1/VJR-4 antes del piloto con datos reales**. Hasta esa validación rige el *safe default* de §11-bis.4 y el sistema debe poder **restringir categorías sin rediseñar el modelo de Vínculos y Alcances**. Tampoco se afirma lo contrario ("el consentimiento no sirve"): el consentimiento es central en el diseño; lo que queda abierto es su alcance habilitante por categoría. La verificación de credenciales por jurisdicción (Ley 24.301 solo CABA; matrículas provinciales) es VJR-4 y condiciona el flujo de DEC-042.

### 12.4 Actos registrables tipificados (taxonomía Q-003)

Nota: no todos son consentimientos en sentido estricto — `TERMINOS` es aceptación contractual y `PRIVACIDAD_INFO` constancia de información (§12.1); se tipifican juntos porque **todos exigen la evidencia §12.2** (que aplica a TODOS los tipos de esta tabla, no solo A3/B2). `EVIDENCIA_VISUAL` no es un consentimiento por foto: es el **registro de la información destacada** exigida al habilitar la categoría dentro del alcance B2 (§21.3).

| Tipo | Relación | Obligatorio para | Revocable |
|---|---|---|---|
| `TERMINOS` | A1 | Usar BE | Cierre de cuenta |
| `PRIVACIDAD_INFO` | A2 | (constancia de información, no consentimiento) | N/A |
| `DATOS_SALUD_BE` | A3 (TR-A/TR-C) | Registrar cualquier dato de salud en BE | Sí → §13 (equivale a limitar el servicio a cuenta sin contenido sensible o cerrarla) |
| `TRANSFERENCIA_INT` | A3 | **Solo cuando la transferencia se apoye específicamente en el consentimiento** (escenario C de §35.2). En los escenarios A y B **no se solicita**: basta información + mecanismo contractual | Sí (con consecuencias operativas informadas — §35.2) |
| `ALCANCE_PROFESIONAL` (por **profesional × Alcance × finalidad × categorías pertinentes** — §12.2 B2) | B2 | Acceso de ESE profesional a ESE dominio, **acotado a las categorías pertinentes a esa finalidad** (§11-bis) | Sí → §13 |
| `EVIDENCIA_VISUAL` (información destacada por categoría, dentro del alcance) | B2 reforzado | Subir/ver fotos (§21) | Sí |

### 12.5 Q-003 — RESOLUCIÓN PROPUESTA

> **Q-003 (alcance del consentimiento) — PROPUESTA:** BE adopta el modelo de dos relaciones con taxonomía §12.4: consentimiento de tratamiento hacia BE (datos de salud + historia longitudinal, como actos informados separados dentro de un onboarding simple, **con información —no consentimiento— sobre la infraestructura internacional**; el acto `TRANSFERENCIA_INT` solo si aplica el escenario C de §35.2) y consentimiento específico por profesional×Alcance×finalidad hacia cada profesional, versionado conforme T-06-17 con la evidencia §12.2, con textos diferenciados por perfil profesional (§12.3). Ningún acceso profesional a datos sensibles sin B2 vigente (DEC-006). Granularidad menor que "por acción", mayor que "global": **por alcance y finalidad**.
> **Fundamento:** arts. 5/6/7/8 (25.326) + Dec. 1558 (revocabilidad, medios equiparables al escrito) + DEC-003/006 + T-06-17. **Riesgos — declaración honesta del peor caso (VJR-1):** si prosperara una lectura restrictiva del art. 7.2/7.3 según la cual el consentimiento NO es habilitador autónomo de datos sensibles, el impacto no se limita al perfil no sanitario: **TR-C (la historia longitudinal con BE como responsable y consentimiento A3 como base) quedaría comprometida**, porque el art. 8 ampara al profesional sanitario, no a BE. Rutas de adaptación identificadas (ninguna exige re-arquitectura de datos, todas exigen re-encuadre jurídico/contractual): (a) re-encuadrar TR-C como registro del propio titular con BE como encargado de custodia por cuenta del titular; (b) base combinada apoyada en el art. 8 de los profesionales sanitarios intervinientes con BE como su encargado, limitando la vista integral a lo que cada base soporte; (c) esperar el marco de reforma (que amplía bases de licitud) para la finalidad longitudinal plena. La fatiga de consentimiento (mitigable por UX de flujo único con actos separados) es un riesgo menor comparado con éste. **Implicaciones 06:** ninguna estructural (el 06 ya lo modela); la taxonomía §12.4 es la política que T-06-17 referenciaba a 08. **Implicaciones 07:** almacenamiento de evidencia (hash de textos, versiones) — capacidad ya prevista. **Obligaciones 09:** contratos de otorgamiento/consulta/revocación con las conductas de UC-P07/P08. **Pruebas 11A:** §50. **VJR pendientes:** VJR-1, VJR-4, textos legales definitivos.

## 13. Revocación

Política (formaliza DEC-006/§9.3 + UC-P08): la revocación de un consentimiento **corta las operaciones futuras de su alcance de forma inmediata y verificable** — "inmediata" = la siguiente evaluación de autorización la refleja (sin caché de decisiones — UC-I02 E03; el SLA de propagación medible lo fija 09/11A con tope de política: **≤ 1 operación posterior**). No borra historia, no finaliza el Vínculo (asimetría del 06), no notifica contenido al profesional más allá de la pérdida de acceso. **El corte alcanza también a la información sensible pertinente del §11-bis** (condiciones de salud relevantes, dolor, lesiones, restricciones): revocado el consentimiento del Alcance, esas categorías dejan de ser visibles para ese profesional de inmediato, **sin afectar** los demás Alcances del mismo asesorado con otros profesionales ni la permanencia del dato en su historia (TR-C). Si el corte no puede verificarse, la operación protegida **se deniega conservadoramente** (UC-P08 E06). La revocación es siempre re-otorgable (OtorgarNuevamente) por decisión del titular. Toda revocación queda auditada (§29) con su primera denegación posterior verificable.

**Revocación de `DATOS_SALUD_BE` (A3) — flujo único** (alineado con §12.4 y R-07; la revocación no tiene efecto retroactivo pero sí prospectivo — el almacenamiento también es tratamiento): (1) suspensión **inmediata** de toda operación sensible del servicio para ese titular (registro y acceso profesional incluidos); (2) se informa al titular sus opciones (re-otorgar / exportar su historia / cerrar cuenta) y se abre un **plazo de decisión [PARÁMETRO propuesto: 30 días — PROPUESTA BE]**; (3) vencido el plazo sin decisión, se ejecuta el **procesamiento por defecto** del §17 sobre las categorías sensibles (suprimir/anonimizar/conservar bloqueado según la matriz §16), notificándolo. Durante el plazo, los datos permanecen en estado bloqueado (§17), no operativos.

## 14. Finalización del vínculo — Q-005

### 14.1 Política por evento

| Evento | Acceso del profesional a datos del asesorado | Fundamento |
|---|---|---|
| **Vínculo/Alcance FINALIZADO** | **NINGUNO posterior** — ni lectura histórica ("modo lectura" no existe) | `[DIRECCIÓN §9.4]`; REG-06-56 dejaba la decisión a 08: se decide NO |
| Alcance individual finalizado (vínculo con otros alcances vivos) | Corta SOLO ese alcance; los demás siguen | Granularidad por Alcance (T-06-15) |
| Vínculo PAUSADO | Sin acceso mientras dure la pausa (ni lectura), reversible por reanudación | Coherencia con "sin vínculo operativo no hay acceso"; la reanudación no restaura gates externos (REG-06-48) |
| Consentimiento revocado (vínculo vivo) | Corta el alcance revocado (§13) | DEC-006 |
| Verificación profesional SUSPENDIDA/RECHAZADA | Corta toda nueva operación sensible de inmediato | RF-012/DEC-005 |
| Cierre de cuenta del asesorado | Corta todos los accesos profesionales | UC-P27 |
| Cambio de profesional | El nuevo profesional NO hereda acceso: nuevo Vínculo + nuevo consentimiento; ve la historia previa **solo si el titular lo consiente** en el alcance del nuevo consentimiento | REG-06-55; RF-025 |
| Correcciones pendientes al finalizar | No habilitan acceso residual: lo no cerrado queda como está; una corrección posterior exige **nuevo Vínculo/Alcance operativo + B2 vigente**. El MVP no crea un `consentimiento puntual` como atajo post-vínculo | Derivada de la regla general |
| Documentos ya exportados | Fuera del sistema; obligaciones propias del receptor (§20); BE no puede recuperarlos — se informa así al titular | Honestidad de alcance |
| Auditoría histórica | La auditoría de accesos pasados **se conserva** (no es acceso del profesional; es evidencia de BE) | §29 |
| Excepción legalmente justificada (orden judicial, obligación legal) | Solo por el proceso de §19/§28 con registro íntegro; nunca autoatendida por el profesional | Art. 10.2 |

### 14.2 Distinciones formales

**Acceso del profesional** (se corta) ≠ **conservación en BE** (persiste según §16 — la cuenta y la historia del asesorado no se tocan: 03 §15) ≠ **derecho del asesorado** (intacto: ve y exporta su historia siempre) ≠ **evidencia de auditoría** (se conserva por su propia finalidad). **No se crea ninguna ventana post-vínculo de 30/60/90 días**: la necesidad operativa del profesional de conservar constancia se resuelve ANTES de finalizar (exportación de productos previstos §20, con conocimiento del titular), no con acceso residual.

### 14.3 Q-005 — RESOLUCIÓN PROPUESTA

> **Q-005 (lectura tras finalizar vínculo) — PROPUESTA:** finalizado un Vínculo o Alcance, el profesional **no conserva ningún acceso posterior** a los datos del asesorado (tabla §14.1 para todos los eventos vecinos). La conservación del dato en BE y los derechos del titular son independientes del acceso profesional. La ventana de lectura del AS-IS (`permisos.service.ts:193-198`, vínculo FINALIZADO lee `[fechaInicio, fechaFin ?? hoy]` — que además tiene el defecto SEG-10) **queda derogada por esta política**: gap G-13 a corregir. **Fundamento:** DEC de Dirección §9.4 + minimización (art. 4) + asimetrías del 06. **Riesgo:** fricción profesional (mitigada por exportación previa de productos previstos y por re-vinculación consentida). **Implicaciones:** 06 ninguna (decidía 08); 07 ninguna estructural; 09 contratos de finalización; 11A pruebas §50; UI 10 (§49): avisar al profesional el efecto ANTES de finalizar.

## 15. Ciclo de vida del dato

Fases: **captura** (minimización; procedencia; consentimientos vigentes) → **uso activo** (acceso por §11/§27; historia por adición) → **cuenta inactiva** (sin actividad prolongada: los datos permanecen — la finalidad longitudinal elegida subsiste; recordatorio periódico de derechos como política de transparencia `[PROPUESTA BE]`) → **cierre de cuenta** (§9.7: cerrar acceso → verificar identidad → procesar por categorías → suprimir/anonimizar → conservar solo con fundamento; REG-06-24/25: CERRADA sin salida hasta política de reapertura — la reapertura queda **no ofrecida** en MVP, revisable) → **supresión/anonimización** (§17) → **backups** (§18: expiración natural + protección anti-resurrección). El usuario que vuelve años después con cuenta activa encuentra su historia (es la promesa del producto); el que cerró, no (se le informó al cerrar).

## 16. Retención — Q-004

**Método:** por categoría × finalidad; sin número global; "puede ser útil algún día" no es finalidad. Donde el plazo exacto requiere dictamen se declara **parámetro pendiente** con evento/mecanismo/propietario definidos (el diseño queda completo; el número se configura). Tabla (IDs R-xx referenciados por §11):

| ID | Categoría | Finalidad | Inicio | Con cuenta activa | Evento de cierre | Tras el cierre | Backup | Fundamento / certeza |
|---|---|---|---|---|---|---|---|---|
| R-01 | Cuenta/identidad | Operar servicio | Alta | Se conserva | Cierre de cuenta | Suprimir/anonimizar salvo defensa de reclamos: conservar mínimo **[PARÁMETRO: plazo de prescripción aplicable — VJR]** en estado bloqueado (solo defensa) | §18 | Art. 4.7 + necesidad contractual |
| R-02 | Credenciales/MFA/tokens/sesiones | Autenticación | Emisión | Vida corta técnica (tokens/sesiones); credenciales mientras cuenta | Cierre/cambio | **Supresión inmediata** (tokens al expirar; hash de password al cierre) | Sí (expira con backup) | Minimización |
| R-03 | Perfil no sensible | Servicio | Alta | Se conserva | Cierre | Como R-01 | §18 | — |
| R-04 | Verificación profesional (evidencia, matrícula) | Habilitar y demostrar diligencia | Solicitud | Mientras el perfil profesional exista | Baja del profesional | Conservar evidencia mínima de la verificación **[PARÁMETRO — VJR]** (demuestra diligencia de BE); suprimir el resto | §18 | Interés de cumplimiento |
| R-05 | Vínculos/Alcances/solicitudes | Trazabilidad relacional | Creación | Historia por adición (el 06 la exige) | Cierre de cuenta de ambas partes | Anonimizar el lado cerrado; conservar estructura mínima para integridad histórica de la otra parte | §18 | 06 (historia) + minimización |
| R-06 | **Consentimientos/revocaciones (evidencia)** | Probar licitud del tratamiento | Acto | SIEMPRE (mientras el tratamiento que ampararon pueda cuestionarse) | Cierre | **Conservar** en estado bloqueado por el plazo de defensa **[PARÁMETRO — VJR]**; es la prueba de que el tratamiento fue lícito | §18 | Carga probatoria del responsable |
| R-07 | **Historia de salud** (nutrición, entrenamiento, antropometría, revisiones) | Longitudinal del titular (TR-C) + prestación (TR-B) | Registro | **Se conserva mientras el titular mantenga la cuenta y el consentimiento A3** — es la finalidad elegida | Cierre de cuenta o revocación A3 | Procesar por §17: suprimir o anonimizar; **EXCEPCIÓN CONDICIONAL**: si la Ley 26.529 aplica al registro del profesional sanitario, el deber decenal es del profesional (depositario) → BE ofrece exportación completa al profesional ANTES de suprimir + **[VJR-3: si BE debe retener en modo bloqueado en su lugar]** | §18 | Art. 4.7 + 26.529 — **VJR-3** |
| R-08 | Fotos/evidencia visual | La del alcance que la incluyó | Subida | Como R-07, con borrado individual a demanda del titular en cualquier momento | Ídem R-07 | Supresión efectiva (incl. derivados/miniaturas/URLs) | §18 con prioridad | §21 |
| R-09 | **Registros de seguridad y gobernanza (clase C6)**: auditoría de acceso, ciclo de break-glass (§28), bitácora de acceso extra-aplicación del operador (§28.3-bis) y evidencia de incidentes (§37) — *ampliada en v0.1.1 (ADV2-12): la clase C6 introdujo artefactos que ninguna fila cubría* | Trazabilidad y prueba | Emisión de cada registro | Se conserva | — (el plazo corre **por registro, desde su emisión**) | Conservar **[PARÁMETRO propuesto: 5 años desde la emisión — PROPUESTA BE sujeta a VJR]**, luego suprimir/anonimizar; nunca se reabre a operación | §18 | Art. 9 + defensa |
| **R-17** *(nueva en v0.1.1)* | **Registro de supresiones (*deletion ledger*, §18)** — clase C6 | Impedir la resurrección de datos suprimidos tras un restore | Ejecución de una supresión | Mientras exista algún backup capaz de resucitar el dato | Expiración del último backup que lo contenga (§18) + margen | Suprimir el asiento cuando ya no puede cumplir su función. **Tensión propia declarada:** el ledger conserva identificadores pseudonimizados de datos que fueron suprimidos — es un registro *sobre* una supresión, y su retención debe ser **la mínima que garantice el anti-resurrección**, no la de la auditoría general. Contiene **categoría + identificador pseudonimizado + fecha + fundamento**, nunca contenido | Es el mecanismo del §18 | Coherencia con art. 16 (la supresión debe ser efectiva) |
| R-10 | Logs técnicos | Diagnóstico | Emisión | 7–30 días (plataforma) | — | Expiración automática | No aplica | Minimización |
| R-11 | Incidencias administrativas | Gobernanza | Registro | Mientras relevantes | Resolución + plazo corto | Anonimizar | §18 | — |
| R-12 | Registros de exportación | Prueba de entrega | Exportación | Como R-09 | — | Como R-09 | §18 | §20 |
| R-13 | Recursos didácticos (no personales) | Catálogo | Alta | Según licencia | Fin de licencia | Retiro conforme licencia | Normal | DEC-047 |
| R-14 | Datos anonimizados (§22) | Producto | Disociación | Sin límite (no personales SI la disociación es real) | — | — | — | Art. 2 (disociación) |
| R-15 | Backups | Recuperación | Creación | Ventana técnica (07: PITR 3–7 días + dumps 30 días) | Expiración | Borrado automático | — | §18 |
| R-16 | Datos de facturación/comerciales | (Fase comercial) | — | **No existe en MVP** (sin pagos) | — | Se definirá con la operación comercial [PARÁMETRO futuro: plazos fiscales] | — | Fuera de MVP |

**Regla del art. 25 §2** `[NORMA VIGENTE]`: para los tratamientos donde BE actúe como **encargado del profesional** (TR-B según VJR-1), al terminar el encargo los datos del encargo se destruyen, con conservación excepcional de **hasta 2 años** solo con autorización expresa. **El diseño evita el conflicto**: la historia del titular (TR-C) tiene base y titularidad propias — lo que termina con el profesional es SU acceso (§14), no la historia del asesorado. Esta separación es la respuesta arquitectónica a la tensión encargo/longitudinalidad, y es exactamente lo que VJR-1 debe validar.

> **Q-004 (retención tras revocación — y política de retención completa) — RESOLUCIÓN PROPUESTA:** retención por categoría×finalidad según la matriz R-01…R-17. **Respuesta explícita a la pregunta canónica:** (a) revocado un consentimiento **B2** (profesional×alcance), la historia del asesorado **permanece intacta bajo TR-C** — lo que se corta es el acceso de ese profesional, no la conservación (la retención no cambia); (b) revocado el consentimiento **A3** (tratamiento por BE), rige el flujo único del §13: suspensión sensible inmediata → plazo de decisión del titular → procesamiento por defecto §17 por categorías. Además: historia de salud conservada mientras el titular mantenga cuenta y consentimiento (finalidad longitudinal elegida); procesamiento por categorías al cierre (§15/§17); evidencia de consentimientos y auditoría conservadas en estado bloqueado por plazo de defensa; parámetros numéricos pendientes marcados **[PARÁMETRO — VJR]** con evento, mecanismo, propietario (Dirección) y configuración definidos — la incertidumbre jurídica no bloquea el diseño. **No se adopta "2 años" global** (era ejemplo exploratorio) ni ningún otro número único. **Pruebas 11A:** §50. **Impacto 07:** §47 (retención técnica de backups subordinada).

## 17. Supresión y anonimización

- **Cierre de cuenta (modelo §9.7):** cerrar acceso (sesiones invalidadas, sin nuevas operaciones — UC-P27) → **verificar identidad** del solicitante (§19) → procesar por categorías (matriz §16): suprimir lo sin fundamento de conservación, **anonimizar** (disociación real, test §22) lo que alimente agregados, **conservar bloqueado** solo lo con fundamento (evidencia de consentimientos, auditoría, defensa) → informar al titular el resultado por categoría. **Sin DELETE CASCADE indiscriminado** — el procesamiento es dirigido por política, compatible con las FKs Restrict y la historia por adición del 06 (capacidad ya exigida al 07 §59).
- **"Conservar bloqueado"** = fuera de toda operación de producto; acceso solo por proceso de derechos/legal con registro; no aparece en ninguna superficie.
- **Supresión a demanda** (derecho art. 16): por dato/categoría, con las excepciones legales (perjuicio a terceros, obligación de conservar) explicadas al titular en la respuesta (§19).
- **Anonimización:** solo cuenta como supresión si cumple el test §22 (disociación art. 2); si no, es pseudonimización y el dato sigue siendo personal.
- La supresión alcanza derivados (miniaturas, caches de lectura, índices) y se propaga a backups por el régimen §18.

## 18. Backups y supresión (anti-resurrección)

Consume el diseño técnico del 07 (§45–47) y le fija política: **ventana limitada** (PITR de días + dumps de eventos críticos ≤30 días — R-15); **acceso restringido** al operador; **uso exclusivo de recuperación** (jamás dataset operativo/analítico/dev — §33); **cifrados** (at-rest del proveedor; dumps externos cifrados); **expiración automática**.

**Protección anti-resurrección (obligatoria):** BE mantiene un **registro de supresiones** (deletion ledger) mínimo: categoría + identificador pseudonimizado + fecha + fundamento — diseñado para NO ser una nueva base sensible (no guarda el contenido suprimido; guarda la orden). **Procedimiento post-restore obligatorio:** restaurar → **re-aplicar todas las supresiones/anonimizaciones posteriores al punto de restauración** (replay del ledger) → validar → recién entonces volver a producción. Sin este paso, un restore está prohibido como operación de producción. Obligación de prueba: 11A (§50) — el drill de restore del 07 (§46) incorpora este paso (impacto §47).

## 19. Derechos del titular

**Derechos y plazos** `[NORMA VIGENTE — verificados en texto oficial]`: información (art. 13, vía AAIP); **acceso** (art. 14): respuesta en **10 días corridos**, gratuito a intervalos ≥6 meses (salvo interés legítimo), información clara y completa (art. 15); **rectificación/actualización/supresión/bloqueo** (art. 16): **5 días hábiles**, con bloqueo o leyenda "sometida a revisión" durante la verificación; denegación solo fundada (art. 17); habeas data como garantía (CN 43 / arts. 33–43).

**Procedimiento BE (proporcional, auditable — sin plataforma de tickets):**
1. **Canal:** dirección de contacto dedicada (y formulario en producto cuando exista) publicada en la política de privacidad.
2. **Recepción y registro:** cada solicitud abre un registro (fecha, titular declarado, derecho invocado, alcance) — un registro simple versionado alcanza en MVP.
3. **Acreditación de identidad:** verificación proporcional (desde la propia cuenta autenticada = suficiente; fuera de la cuenta: prueba de control del correo + dato de contraste; **nunca** se piden más datos de los necesarios para verificar). Protección de terceros: jamás se entregan datos de otra persona (red-team #23); ante duda, se deniega y se documenta.
4. **Ejecución:** acceso → **exportación de la propia historia como capacidad de producto** (§20 — el mismo producto sirve al derecho); rectificación → corrección trazable del 06 (cadena, sin borrar el original — compatible con art. 16 explicándolo: la rectificación produce la versión vigente correcta); supresión → §17 con excepciones fundadas; bloqueo → estado bloqueado §17.
5. **Respuesta y cierre:** dentro del plazo legal, con constancia de qué se hizo por categoría y las excepciones aplicadas; todo el ciclo auditado (§29).
6. **Rectificación propagada:** la corrección alcanza las vistas derivadas (timeline/read models) — el 06 ya lo garantiza (vista efectiva); prueba en 11A (red-team #24).
7. **Consulta de accesos propios:** el titular puede solicitar (por el canal de derechos; como producto cuando exista) **quién accedió a sus datos** — respuesta construida desde la auditoría §29 (actor profesional, fecha, alcance/categoría; sin revelar datos de terceros). Es la materialización del principio de transparencia referenciado en §11/§29.
8. **Requerimientos de autoridad (orden judicial / obligación legal):** recepción por el canal formal → **validación de autenticidad y alcance** (ante duda, verificación con el juzgado/organismo) → entrega **mínima** estrictamente ordenada → registro íntegro en auditoría §29 → evaluación de información al titular cuando la ley no lo prohíba. Nunca se autoatiende un pedido informal (ni de un profesional ni de terceros). `[VALIDACIÓN JURÍDICA REQUERIDA]` para el protocolo fino en operación comercial.
9. **El profesional como titular:** los profesionales ejercen los mismos derechos sobre SUS datos (cuenta, verificación, asientos de auditoría donde son actor), con la reserva fundada del art. 17: la respuesta nunca revela datos de asesorados; un asiento de auditoría se le muestra en su dimensión de actor (qué hizo, cuándo) sin el contenido del sujeto accedido. La tensión fina art. 14/17 queda anotada para VJR.

El asesorado ve **toda su historia** desde el producto (§9.15 — sin notas secretas) y puede exportarla: el ejercicio del derecho de acceso es, en el caso normal, autoservicio inmediato — el procedimiento formal cubre los casos fuera de cuenta o contenciosos.

---

## 20. Exportaciones

**Política** `[DIRECCIÓN §9.11]` + diseño:

**Permitido:**
- Productos de exportación **previstos por el producto** (informe individual, PDF de plan, CSV específico cuando el producto lo contemple), siempre: dentro del Alcance vigente del actor, sobre sujetos con Vínculo+consentimiento vigentes, auditados (§29).
- **Exportación del propio asesorado sobre su propia historia** — es una capacidad de producto (dirección §9.15) y soporte del derecho de acceso (§19).

**No permitido por defecto:**
- Dump de base; bulk export de "todos los asesorados"; descarga masiva administrativa ("admin download-all"); cualquier endpoint de exportación sin scope por sujeto y Alcance.
- Toda excepción futura (p. ej. migración saliente de un profesional con su cartera) exige decisión de Dirección + diseño específico con autorización por titular — no se habilita acá.

**Límite de pertinencia sobre lo exportable (v0.1.1):** un producto de exportación **no puede contener más de lo que su autor podría leer en pantalla**. Para un perfil **no sanitario**, eso significa que el informe exportable queda acotado a lo pertinente a su Alcance con el mínimo detalle suficiente (§11-bis.3): **no existe ningún producto que le entregue el expediente completo del asesorado**, ni por exportación, ni por listado, ni por endpoint de detalle. La exportación es una **vista de lo ya autorizado**, nunca una vía alternativa de acceso — prueba negativa N-3 (§50.1).

**Registro:** cada exportación sensible audita actor, fecha, tipo de producto, sujeto(s), alcance — **sin copiar el archivo exportado al registro**.

**Responsabilidad sobre copias:** una copia legítimamente exportada queda bajo responsabilidad de quien la recibe (el profesional debe protegerla, no difundirla y suprimirla cuando corresponda — obligación a reflejar en los términos profesionales, §8). Esto **no libera automáticamente a BE de toda responsabilidad**: BE responde por haber autorizado y registrado correctamente la exportación conforme a esta política, y las responsabilidades ulteriores dependen del marco legal (matriz §8; `[VALIDACIÓN JURÍDICA REQUERIDA]` el deslinde fino).

**AS-IS:** no existe ninguna capacidad de exportación implementada (§43) — el riesgo hoy es la ausencia del producto para derechos (§19), no la fuga por endpoints masivos (que tampoco existen).

## 21. Fotografías y media

Dos categorías **distintas** (no se mezclan): (a) **fotografía/evidencia visual del asesorado** (dato personal sensible en contexto de salud — clasificación máxima §10); (b) **recurso didáctico/licenciado** (contenido de catálogo con obligaciones de licencia — DEC-047; no es dato personal del asesorado).

**Política para evidencia visual del asesorado** `[DIRECCIÓN §9.9]`:
1. **Opcional siempre** — ninguna función núcleo exige fotos; el rechazo no degrada el servicio.
2. **Privadas por defecto**, tratamiento igual o más restrictivo que el resto de los datos sensibles: acceso solo por Alcance habilitado + Vínculo + consentimiento vigentes; jamás visibles a otros asesorados; ADMIN sin acceso (solo break-glass §28).
3. **Información destacada:** la categoría se informa de forma visible y específica en el momento de la captura/subida (no enterrada en un texto genérico) — requisito para el BE-LEG-10 (§49, obligaciones de UI). No se exige necesariamente consentimiento por foto: rige el consentimiento del alcance correspondiente con información destacada (Q-003 §12).
4. **Storage:** cuando la función se active — bucket **privado** (nunca público ni indexable), acceso exclusivamente mediado por la API con **URL firmada de corta duración** (PROPUESTA BE: ≤ 15 min), metadata mínima (sin EXIF innecesario — se depura al ingerir), cifrado at-rest del proveedor, backup dentro del régimen §18, borrado efectivo ante supresión (§17) incluyendo derivados/miniaturas.
5. **Registro:** acceso a evidencia visual = acceso sensible auditable (§29).
6. **No activación en MVP sintético:** la función no requiere storage externo hoy (07 BORRADOR §25, faseado — coherente); estos requisitos son **condición de activación**, verificables en el gate §42 si la función entra.

**Política para recursos didácticos** (DEC-047): licencia obligatoria conservada como metadato; procedencia registrada; ámbitos global/profesional según el 06; sus cuotas/retención los fija este documento en §16 (categoría propia, no-personal); el tratamiento técnico (formatos/resolución) es de 07/09.

## 22. Analítica

**Política** `[DIRECCIÓN §9.14]`:
- **Permitido:** estadística **realmente agregada/anonimizada** para mejorar el producto (uso interno): métricas de uso funcional, agregados poblacionales sin re-identificación razonablemente posible.
- **Prohibido:** vender datos personales o de salud; crear perfiles publicitarios; monetizar historia individual; ceder a terceros con fines propios de esos terceros. (Coherente con 03 §22 `[CANÓNICO]`: exclusión de venta de datos como ingreso.)

**Requisitos para llamar "anónimo" a un dataset** (test de anonimización — sin esto, es dato personal):
1. Eliminación de identificadores directos **e** indirectos razonables (combinaciones cuasi-identificadoras: fecha nacimiento + localidad + profesional, etc.);
2. Agregación con umbral mínimo de individuos por celda (PROPUESTA BE: n≥10) o perturbación equivalente;
3. Imposibilidad razonable de re-identificación con medios que BE u otro receptor probable pueda emplear (evaluación documentada por dataset);
4. Sin claves de reversión conservadas junto al dataset.

**Pseudonimización ≠ anonimización:** un dataset con IDs sustituidos pero re-vinculables (tabla de mapeo, hash determinista con clave conocida) **sigue siendo dato personal** y recibe toda la protección de esta política. La definición normativa de "disociación" y su alcance exacto se anclan en la matriz legal (§4/§52; `[VALIDACIÓN JURÍDICA REQUERIDA]` para el estándar de irreversibilidad exigible).

**Minimización de métricas:** el conjunto de métricas de producto se define por finalidad explícita, revisable; prohibido instrumentar recolección "total" por si acaso (§30). Las métricas técnicas (§ logging/observabilidad) no contienen contenido de salud.

## 23. IA

**Regla MVP** `[DIRECCIÓN §9.13]`:

> **Ningún proveedor externo de IA recibe datos de salud identificables de usuarios reales.** Cero excepciones operativas.

- **Permitido:** datos sintéticos; entornos de testing; datos **adecuadamente anonimizados/agregados** (con el test de §22 aprobado por dataset).
- **Vectores identificados a los que aplica la prohibición:** LLMs (API o chat), embeddings, analytics con IA, copilots/asistentes de código con contexto de producción, proveedores de procesamiento de imágenes, herramientas de debugging remoto con payloads reales, y **soporte/desarrollo**: está prohibido pegar expedientes o datos reales en herramientas de IA como práctica de soporte o depuración (§33: debugging con sintéticos/anonimizados).
- **Gate futuro para IA real** (cada uso nuevo exige, antes de activarse): caso de uso y finalidad explícita → minimización (qué campos, por qué) → evaluación del proveedor (§34: DPA, ubicación, subprocesadores, retención de prompts/outputs, uso para entrenamiento) → contrato → análisis de transferencia internacional (§35) → seguridad → base/consentimiento aplicable (`[VALIDACIÓN JURÍDICA REQUERIDA]` según categoría) → evaluación de riesgos → **decisión de Dirección registrada**. Sin ese expediente completo, la respuesta por defecto es NO.
- La prohibición no es "anti-IA para siempre": es una compuerta de gobernanza proporcional a datos sensibles de salud.

---

## 24. Identidad y autenticación

**Política** (el mecanismo/contrato exacto es de 09; el AS-IS se contrasta en §43):

1. BE es la fuente de identidad. La identidad federada (Google Identity) es un **método de acceso** opcional que nunca crea identidad paralela ni reemplaza la cuenta BE `[CANÓNICO]` (RF-003; 06 T-06-03: Método de acceso).
2. Credenciales locales: hash adaptativo (AS-IS: bcrypt costo 10 — se conserva como mínimo; parámetro revisable), nunca en claro, nunca en logs.
3. Alta del asesorado por invitación con token de un solo uso, con expiración, persistido **solo como hash** (AS-IS ya lo cumple: SHA-256 — se preserva).
4. Recuperación de acceso: pruebas temporales de un solo uso con vencimiento, **respuesta neutra anti-enumeración** (RF-005; RNF-SEC-003), sin presuponer canal (el 05 no fija correo/SMS); contingencia asistida documentada. El canal y su proveedor, cuando se activen, entran por el inventario de terceros (§34) con minimización.
5. Anti-abuso: rate limiting en autenticación y recuperación (umbrales en §38 como PROPUESTA BE), lockout progresivo tras intentos fallidos, sin revelar existencia de cuentas en ningún flujo (login, recuperación, invitaciones).
6. Todo evento crítico de identidad es auditable (§29): alta, activación, cambio de credencial, cambio de método de acceso, bloqueo, cierre.
7. **Mayoría de edad (regla ADV-06):** el canon fija asesorado **adulto** (02/03/04); este documento lo asume como supuesto operativo y lo convierte en control: (a) el alta requiere **declaración de fecha de nacimiento/mayoría de edad** (dato C3, finalidad exclusiva de elegibilidad — obligación de UI a 10 §49); (b) BE no ofrece el servicio a menores en MVP; (c) **procedimiento ante descubrimiento de un menor que declaró falsamente**: suspensión inmediata de la cuenta y de todo acceso profesional a sus datos → notificación al titular/vínculos activos → procesamiento prioritario por §17 (los consentimientos de un menor sin capacidad son inválidos: los datos quedan sin base y se suprimen/anonimizan, con conservación bloqueada solo de la evidencia mínima del incidente) → registro §29 e incidente con datos personales §37; (d) la eventual admisión futura de menores (CCyC art. 26, autonomía progresiva, consentimiento de representantes) es **VJR-10** y una decisión de producto nueva — nada del diseño actual la presume. Escenario agregado al red-team (#32) y condición del gate §42 (ítem 22).

## 25. MFA

**Política adoptada por Dirección** `[DIRECCIÓN]` (input de esta misión, §9.12):

| Actor | Regla | Momento |
|---|---|---|
| ADMIN | MFA **obligatorio** | Siempre (condición de Ready-for-Real-Data §42; y para toda operación administrativa) |
| PROFESIONAL | MFA **obligatorio** | Antes de operar con datos reales sensibles (gate §42); opcional en demo sintética |
| ASESORADO | MFA **opcional** | Ofrecido desde el inicio cuando exista; no bloqueante en primera etapa |

Requisitos de política: el segundo factor no puede ser exclusivamente el mismo canal que la credencial primaria; TOTP como línea base preferida sobre SMS `[ESTÁNDAR / BUENA PRÁCTICA]`; códigos de recuperación de un solo uso; el enrolamiento y des-enrolamiento de MFA son eventos auditables; des-enrolar exige re-autenticación. Mecanismo concreto → 09. **AS-IS: no existe MFA** (grep sin resultados — §43); es brecha bloqueante del gate §42, no del MVP sintético.

## 26. Sesiones

**Política:**
1. **Toda sesión es revocable server-side** `[DIRECCIÓN]` — para los tres actores. Un token puramente stateless sin lista de revocación no satisface esta política (el cierre de cuenta UC-P27 exige que "las sesiones activas dejen de ser utilizables" `[CANÓNICO]` 05).
2. Expiración: sesiones de vida corta con renovación controlada; la duración concreta por actor la fija 09 dentro de estos topes de política (PROPUESTA BE): acceso ≤ 24 h sin renovación; renovación revocable; ADMIN con vida útil menor que el resto.
3. Eventos que revocan sesiones: cierre de cuenta (inmediato), cambio de credencial, suspensión de cuenta o de verificación profesional, revocación de MFA, decisión administrativa fundada (auditada), rotación de secretos de firma.
4. La revocación de **consentimiento o vínculo NO depende de la expiración de sesión**: la autorización se evalúa por operación (§27), de modo que el corte es efectivo aunque la sesión siga viva — la sesión autentica, no autoriza.
5. AS-IS: JWT en memoria, expiración 1 día, sin refresh ni revocación (§43); el propio código lo declara decisión temporal de MVP. La política TO-BE exige el paquete de sesiones revocables **antes de datos reales** (gate §42), alineado con el faseo del 07 BORRADOR (§42.3) — que este documento **confirma y vuelve vinculante** (impacto §47).

## 27. Autorización

**Política de acceso** (el modelo estructural — Vínculo, Alcance, consentimiento, 7 dimensiones — es del 06 y no se redefine; acá se fija la política que esas estructuras habilitan):

1. **Deny by default.** Ninguna operación protegida procede sin decisión positiva del plano de autorización. La ausencia de información autoriza a denegar, nunca a permitir (UC-I02: denegación conservadora `[CANÓNICO]`).
2. **Una sola semántica en todas las superficies.** Website, APK y cualquier canal futuro llegan al mismo plano de decisión con el mismo resultado (RNF-SEC-001). Ocultar un botón no es control de acceso.
3. **La decisión se evalúa por operación**, con las 7 dimensiones del 06 (identidad, rol, estado profesional/verificación, Alcance habilitado, Vínculo vigente, consentimiento vigente, finalidad/recurso) **más la dimensión de política que agrega el 08: la _pertinencia del dato concreto para esa finalidad_** (§11-bis). La pertinencia **no modifica las estructuras del 06**: es un filtro de política aplicado sobre el resultado de la evaluación canónica — ninguna de las 7 dimensiones se sustituye ni se relaja. Prohibido reutilizar decisiones previas que no reflejen una revocación reciente (UC-I02 E03) — sin caché de autorización en MVP; si el rendimiento futuro exigiera caché, invalidación inmediata como condición.
4. **Least privilege + need to know + Alcance + pertinencia:** un profesional vinculado NO ve "todo el expediente": ve lo que sus Alcances autorizados habilitan (§11) **y, dentro de eso, solo lo pertinente a la finalidad con el mínimo detalle suficiente** (§11-bis). El recíproco también debe formularse con precisión: **si la información pertinente existe, el titular la autorizó para ese Alcance y la matriz vigente la habilita, BE no la oculta por una prohibición genérica de “datos de salud”**. La ausencia de autorización sigue denegando (§11-bis.7); la pertinencia no sustituye el control del titular. La visión integral pertenece al asesorado (§9.15 de Dirección; 02: el dato pertenece al recorrido del asesorado).
5. **Sin acceso cross-scope automático:** el Alcance de Nutrición no habilita Entrenamiento ni viceversa (RNF-SEC-006); la capacidad antropométrica es transversal pero requiere su propia habilitación + vínculo + consentimiento (DEC-044).
6. **Estados que cortan:** vínculo finalizado/pausado según política §14; consentimiento revocado (§13); verificación profesional SUSPENDIDA o RECHAZADA (corta nuevas operaciones sensibles de inmediato — DEC-005/042); cuenta suspendida/cerrada.
7. **Recursos derivados:** la autorización se resuelve por el **sujeto real del dato** (el asesorado), no por el identificador superficial del recurso (planId/eventoId/mediciones se resuelven a su titular antes de decidir) — cierre estructural de IDOR (defensa en profundidad borde+servicio+contexto+DB; obligación de prueba 11A §50).
8. Anti-enumeración: la denegación no revela existencia, contenido ni terceros (404/respuestas neutras — patrón AS-IS que se preserva).

## 28. Administradores y break-glass

**Política** `[DIRECCIÓN]` (§9.10) + diseño proporcional:

1. **Acceso normal del ADMIN: sin datos de salud.** El rol administra cuentas, verificaciones, incidencias, configuración — nunca contenido sensible de asesorados. La matriz §11 lo hace explícito por categoría.
2. **Break-glass** (acceso excepcional a contenido sensible), proporcional a un equipo unipersonal — sin four-eyes en MVP, con trigger de madurez registrado:
   - actor autenticado con **MFA + step-up** (re-autenticación al momento de activar);
   - **motivo obligatorio** + referencia a caso/incidente;
   - **alcance concreto** (sujeto/recurso determinado — nunca "toda la base");
   - **tiempo limitado** con expiración automática (PROPUESTA BE: ≤ 4 h, renovable con nuevo motivo);
   - **auditoría íntegra e inmutable** de apertura, cada acceso, y cierre (§29);
   - **revisión posterior** registrada (auto-revisión documentada en fase unipersonal; revisión por segundo operador cuando exista);
   - **notificación posterior al usuario afectado** cuando sea apropiado y no comprometa una investigación en curso (PROPUESTA BE — evaluación caso a caso registrada).
3. **Trigger de madurez:** al existir ≥2 operadores con acceso administrativo, se incorpora aprobación de segunda persona (four-eyes) para break-glass y para cambios de permisos administrativos.
3-bis. **Acceso del operador por fuera de la aplicación (regla ADV-04):** el operador de infraestructura (Dirección) posee inevitablemente credenciales de consola y de base de datos que permiten leer C4 **sin pasar por el PDP ni la auditoría de aplicación**. Ese acceso queda **gobernado por este mismo régimen**: se considera excepcional; solo procede por operación técnica justificada (deploy, migración, incidente, drill); toda sesión de consola/SQL sobre datos productivos se registra en **bitácora manual obligatoria** (motivo, alcance, inicio/fin) con asiento posterior en la auditoría (§29); prohibido el uso exploratorio o de soporte sin caso; los dumps se rigen por §18. Condición del gate §42 (ítem 21). Base jurídica del acceso excepcional: **VJR-9** (§52).
3-ter. **Base invocada por tipo de acceso excepcional:** seguridad/integridad del sistema → obligación del art. 9 (25.326); soporte a pedido del titular → el propio pedido documentado; requerimiento de autoridad → el proceso de §19.8 (validación de autenticidad y alcance mínimo). Cualquier otro supuesto: no procede.
4. AS-IS: no existe rol ADMIN operable ni break-glass (§43) — el diseño es TO-BE y condición del gate §42 en lo que respecta a "admin no ve salud por defecto" (la ausencia de admin operable satisface trivialmente la regla hoy, pero el gate exige el diseño completo al operar).

## 29. Auditoría

**Distinción vinculante:** AUDITORÍA DE SEGURIDAD/ACCESO (registro con valor probatorio y de gobernanza, vive en la base, retención larga §16) ≠ LOG TÉCNICO (diagnóstico, efímero, §30). Nunca se mezclan destinos ni retenciones.

**Eventos auditables (política BE — el marco legal exige seguridad y confidencialidad; la granularidad concreta es política `[PROPUESTA BE]` salvo donde la matriz legal indique otra cosa):**

| Evento | Detalle mínimo |
|---|---|
| Acceso a datos sensibles por profesional | actor, sujeto, Alcance, recurso/categoría, resultado |
| Denegaciones significativas (403 sobre datos sensibles, intentos cross-tenant) | actor, sujeto intentado, motivo de denegación |
| Otorgamiento/revocación/re-otorgamiento de consentimiento | titular, tipo, versión de texto, alcance, canal |
| Creación/aceptación/pausa/finalización de Vínculo y cambios de Alcance | partes, alcance, estado |
| Cambios de verificación profesional (PENDIENTE→VERIFICADO/RECHAZADO/SUSPENDIDO) | actor admin, profesional, motivo |
| Exportaciones (§20) | actor, sujeto(s), tipo de producto, alcance |
| Break-glass | ciclo completo (§28) |
| Eventos críticos de identidad/sesión | login fallido reiterado, MFA enrolado/removido, cambio de credencial, revocación de sesiones, cierre de cuenta |
| Supresiones/anonimizaciones ejecutadas (§17) | categoría, fundamento, ejecutor |
| Cambios de rol/permisos administrativos | actor, cambio |
| **Cambios de la matriz de pertinencia (§11-bis.4-ter)** *(v0.1.1)* | versión anterior → nueva, alcance y categoría afectados, fundamento, acta que lo respalda, actor |

**Contenido de cada registro:** quién (actor pseudorreferenciado por ID), qué (operación), sobre quién/qué recurso (IDs, **no contenido**), cuándo (UTC + zona de regla), resultado, motivo/contexto cuando aplique, requestId de correlación. **Prohibido copiar el contenido sensible al registro** (la historia no se duplica en la auditoría).

**Resistencia a manipulación (proporcional):** la auditoría es append-only a nivel de aplicación (sin UPDATE/DELETE por ningún flujo de producto), fuera del alcance de todo endpoint de escritura, con acceso de lectura restringido (ADMIN para gobernanza, sin contenido sensible; el titular puede conocer accesos sobre sus datos — §19); su retención se fija en §16. Integridad criptográfica (hash-chain) queda como evolución si un requisito probatorio lo exige — no baseline (proporcionalidad).

**Acople operativo:** para operaciones sensibles con control obligatorio, la escritura de auditoría es **transaccional y bloqueante** (sin registro no hay operación — UC-I02 E06/UC-I03 `[CANÓNICO]`; consumido también por el 07 BORRADOR §22.7, que este documento confirma). AS-IS: interceptor best-effort, solo éxitos, ciego a recursos derivados (§43) — brecha a cerrar antes de datos reales.

## 30. Logging

**Prohibiciones absolutas en logs técnicos:** tokens, contraseñas, secretos, cuerpos completos de request/response, fotografías, mediciones antropométricas completas, antecedentes, planes completos, cualquier contenido de salud. La sanitización es central (logger/filtro), no por disciplina de cada llamada.

**Contenido permitido:** requestId, ruta **parametrizada** (no valores), método, status, duración, código de error interno, actor pseudorreferenciado (ID) cuando el diagnóstico lo requiera.

**IP y user-agent:** son datos personales a efectos de esta política — clasificados PERSONAL (§10); se registran solo donde tengan finalidad concreta: (a) seguridad de cuenta (eventos de identidad §29, anti-abuso §24.5) — retención corta de logs; (b) **evidencia técnica de actos de consentimiento** (§12.2) — ahí siguen la retención R-06 (larga, bloqueada post-cierre), porque integran la prueba del acto. Fuera de esas finalidades, no se registran.

**Retención:** logs técnicos = efímeros (la de la plataforma, 7–30 días); nada con retención larga vive en logs (§29). No se recolecta "todo por si acaso" — minimización aplicada también a telemetría.

## 31. Cifrado

**Capacidad mínima exigida:**
1. **TLS en tránsito en todas las superficies** (usuario↔BE, BE↔base, BE↔terceros). Sin excepciones en production.
2. **Cifrado at-rest del proveedor** para base, backups y storage de objetos (capacidad estándar de los administrados evaluados en el 07 — se exige como criterio de selección, §47).
3. **Contraseñas:** hash adaptativo (bcrypt vigente; parámetro de costo revisable por política).
4. **Tokens de un solo uso** (activación/recuperación): almacenados solo como hash (patrón AS-IS que se preserva).
5. **Field-level encryption aplicativo: NO se adopta como baseline.** Análisis honesto: la amenaza que resolvería (lectura directa de la base por un actor que ya superó el perímetro del proveedor o un insider del proveedor) está mitigada por el cifrado at-rest + control de acceso + DPA del proveedor (§34); el costo (gestión de claves aplicativas, imposibilidad de queries, complejidad de rotación) es desproporcionado al MVP `[PROPUESTA BE]`. Se re-evalúa si: el análisis de transferencias (§35) lo exigiera como garantía suplementaria, o si se incorporara una categoría de dato de riesgo superior. Las **fotografías** — si se activan — se tratan con la protección reforzada de §21 (storage privado + URL firmada), no con cifrado aplicativo por campo.

## 32. Secretos

Política (consistente con el 07 BORRADOR §28, que este documento confirma): fuera de Git (verificado AS-IS: `.gitignore` excluye `.env*`); por ambiente, sin cruce; gestor write-only de la plataforma en test/production; inventario de secretos en repo SIN valores, con propietario y ambiente; rotación con runbook y disparadores (exposición sospechada, baja de acceso, cadencia anual); **cero secretos en frontend** (verificado AS-IS: sin `NEXT_PUBLIC_*`; la APK solo embebe la URL base, que no es secreto); CI sin impresión de valores. Los secretos de firma de sesión rotan invalidando sesiones (aceptable; con el paquete §26 se hace escalonado).

## 33. Ambientes

Consume DEC-008 `[DIRECCIÓN]` y la materialización del 07 BORRADOR (§26) — este documento fija la **política de datos por ambiente**:

| Ambiente | Datos permitidos | Regla dura |
|---|---|---|
| development | **Sintéticos exclusivamente** | Prohibido apuntar a la base de production como base habitual; prohibido copiar datos reales a máquinas locales |
| test | **Sintéticos exclusivamente** | Los backups productivos NO son dataset de prueba |
| production | Reales SOLO tras el gate Ready-for-Real-Data (§42) | Separación total de credenciales |

Reglas adicionales: no existen "copias productivas de cortesía" en laptops; si el debugging exigiera datos representativos, se usan sintéticos o **anonimización real** (§22 — no pseudonimización casera); el seed demo se niega a correr en production (guard de ambiente — impacto al 07 §47); los datos reales de un incidente se manejan por el proceso §37 (preservación controlada), nunca por copia informal.

---

## 33-bis. Mapas (regla específica)

`[DIRECCIÓN §33]`: un servicio cartográfico no necesita historia de salud. La v0.1 decía "Maps solo recibe C1" — **eso es incorrecto como afirmación técnica** y se corrige acá: BE controla lo que envía deliberadamente, no lo que el proveedor recoge por el hecho de que un navegador cargue su SDK.

**Payload deliberado BE (lo que BE decide enviar — sí está bajo control de BE):**

| Enviado | Clase | Justificación |
|---|---|---|
| Ubicación **pública** del servicio profesional (dirección/coordenada del consultorio o gimnasio) | C1 | Necesario para pintar el marcador |
| Texto de la consulta de geocodificación de esa dirección | C1 | Necesario para resolver dirección → coordenada |

**Prohibido en el payload deliberado:** identidad del asesorado, identificadores internos, vínculos, antropometría, dieta, historia, cualquier dato de salud. Para pintar un mapa no hace falta nada de eso.

**Metadatos potencialmente tratados por el proveedor (fuera del payload deliberado — NO bajo control técnico de BE):**

Al cargar el SDK/tiles de Google Maps, el navegador o la app del usuario establece una conexión directa con el proveedor. Eso implica que el proveedor puede tratar, con independencia de lo que BE envíe: **dirección IP** del dispositivo, **user-agent** y características del dispositivo, **referer** (la URL de BE desde la que se carga el mapa, que puede revelar el contexto de uso), **cookies/identificadores** propios del proveedor si existen en ese navegador, y **patrones de uso** (qué se consultó y cuándo). BE **no puede afirmar** que el proveedor recibe únicamente C1: puede afirmar que **BE no le envía deliberadamente nada distinto de C1**. La distinción es material para la política de privacidad, que debe informar la existencia de esta conexión con un tercero.

**Consecuencias de política:** (a) informar en la política de privacidad que la carga del mapa implica una conexión con Google y qué metadatos puede tratar; (b) no cargar el mapa en pantallas cuyo *referer* revele contexto de salud del titular; (c) evaluar carga diferida bajo acción explícita del usuario ("ver en el mapa") en lugar de carga automática. **VJR-8 se mantiene** (rol jurídico de Google como responsable independiente y suficiencia de la información). El **fallback canónico se preserva**: lista de profesionales + dirección textual, sin mapa embebido (RF-051), disponible como configuración si la validación jurídica lo exigiera. La representación en el dispositivo del asesorado no envía su geolocalización a BE ni a terceros en el MVP; cualquier función futura de geolocalización del asesorado = evaluación nueva completa (§34).

## 34. Terceros y subprocesadores

Inventario cerrado del MVP (nadie más recibe datos; alta de terceros nuevos = proceso de evaluación de esta sección). Matriz completa con fuentes y confianza: `_work/08/BE_LEG_08_MATRIZ_LEGAL_Y_FUENTES_2026-08-18.md` §proveedores. Resumen normativo `[INVESTIGACIÓN PROVEEDOR, consultas 2026-08-18]`:

| Tercero | Qué recibe | Región | DPA | Subproc. publicados | Certificaciones declaradas | Regla BE |
|---|---|---|---|---|---|---|
| Plataforma de cómputo (07: Render propuesto) | Toda la app; datos sensibles en tránsito/proceso | US (sin SA; **tiene Frankfurt/UE**) | Sí (con SCCs) | Sí (AWS/GCP/Cloudflare/ClickHouse, US) | SOC 2 T2, ISO 27001, HIPAA/BAA, DPF | Encargado bajo mecanismo §35; BAA no aplica `[INFERENCIA]` (BE no sería *covered entity* ni *business associate* bajo HIPAA, norma estadounidense ajena al marco argentino) pero señala madurez del proveedor |
| Base de datos (07: Render PG; alternativa Neon) | **La base completa: salud en reposo** | Render: US/UE · **Neon: tiene sa-east-1 São Paulo**; Neon opera bajo marco legal **Databricks** (verificado) | Sí | Sí (Databricks: AWS/MS/Google; +Grafana) | SOC 2 T2, SOC 3, ISO 27001/27701, HIPAA | Ídem; el cambio de marco legal de Neon (Databricks) obliga a re-evaluar su DPA antes de usarlo |
| Google Identity / Firebase Auth | Email/identidad de acceso | Global | Sí (CDPA; in-scope) | Mecanismo CDPA §11 | ISO 27001/17/18, SOC 1/2/3 | Encargado; adaptador con fallback local (RF-003) |
| **Google Maps** | **Payload deliberado BE:** ubicación pública del servicio (C1) + consulta de geocodificación. **Además, por conexión directa del dispositivo:** IP, user-agent, referer, cookies propias, patrones de uso (§33-bis) | Global (US) | **NO es encargado: controlador independiente** (Controller-Controller Terms §4.1 — verificado) | N/A | Las de Google | **Tratamiento aparte** (§33-bis): BE no envía deliberadamente nada distinto de C1, pero **no puede afirmar** que el proveedor solo reciba eso. Se informa la conexión con el tercero en la política de privacidad. Fallback sin mapa embebido disponible (RF-051). VJR-8 |
| Expo (EAS + Push) | Push tokens de asesorados; builds | **Solo US, sin elección de región** | Bajo pedido (MSA/DPA) | Sí (2026-08-17; Apple y Google para push) | SOC 2 T2, DPF | **Prohibido contenido de salud en payloads push** (ya canónico: REG-06-30); el push token es C3 |
| GitHub | Código y CI — **nunca datos personales reales** | US | Sí (SCCs+DPF) | Sí | SOC 1/2, ISO 27001 | Fixtures sintéticos (regla vigente del repo) |
| Open Food Facts / wger | **Nada personal** (BE importa DE ellos) | — | N/A | N/A | N/A | Solo egreso de consultas técnicas; procedencia/licencia al importar |
| Monitoreo externo (07 §42) | URL de health (sin datos personales) | s/proveedor | — | — | — | Solo endpoints sin contenido |

**Reglas de gobernanza de terceros:** evaluación previa documentada (qué recibe, región, DPA, subprocesadores, certificaciones, retención, salida) · suscripción a las listas de subprocesadores de cada proveedor (cambio de subprocesador/país = re-evaluación — red-team #16) · contrato/DPA vigente ANTES del primer dato real (gate §42) · verificación de compromisos de borrado y export a la salida · **ningún tercero recibe C4 salvo la plataforma de cómputo/almacenamiento bajo mecanismo §35**.

**Regla añadida en v0.1.1 — la región primaria no cierra la evaluación (§35.1):** para cada proveedor de esta tabla debe evaluarse **por flujo**, no solo por la ubicación declarada de la región: (a) desde dónde accede el **soporte** del proveedor; (b) a qué región van **telemetría, logs y métricas**; (c) dónde se almacenan **backups y réplicas**; (d) qué **subprocesadores** intervienen y en qué jurisdicción están; (e) qué **transferencias ulteriores** habilita el contrato de encargo. Elegir Frankfurt/UE para la región primaria **no vuelve adecuados** los flujos (a)–(e) si terminan en jurisdicción no adecuada: cada uno se resuelve por el escenario A/B/C de §35.2. Este es el hallazgo externo C-3 y afecta directamente al impacto I-1 sobre el 07 (§47).

**Metadatos potencialmente tratados por el proveedor (nota transversal):** la columna "Qué recibe" describe el **payload deliberado de BE**. Cuando la integración implica que el dispositivo del usuario se conecte directamente con el tercero (hoy: Google Maps; en el futuro cualquier SDK cargado en cliente), el tercero puede tratar metadatos de conexión que BE no controla. Esa distinción debe reflejarse en la política de privacidad de cada integración de ese tipo.

## 35. Transferencias internacionales

**Régimen** `[NORMA VIGENTE + REGLAMENTACIÓN]`: art. 12 (25.326) prohíbe transferir a países sin protección adecuada; excepciones tasadas que **no cubren hosting comercial** (la médica del 12.2.b es para tratamiento del afectado/epidemiología con disociación). Dec. 1558 art. 12: la prohibición no rige con **consentimiento expreso del titular**; y hay adecuación por **cláusulas contractuales** que prevean la protección. Mecanismos operativos vigentes: **CCM 60-E/2016** (Anexos cesión y **encargo**) usadas tal cual = sin aprobación previa; contrato divergente = **presentación AAIP dentro de 30 días corridos de la firma**; **CCM RIPD (Res. 198/2023)** como alternativa (con breach notification ≤72 h y control de subencargados). Transferir a país no adecuado sin mecanismo = infracción **muy grave** (Res. 126/2024).

**Lista de adecuación vigente (Res. AAIP 34/2019)** `[CRITERIO AAIP]`: UE/EEE · Reino Unido · Suiza · Guernsey · Jersey · Isla de Man · Islas Feroe · Canadá (sector privado) · Andorra · Nueva Zelanda · **Uruguay** · Israel (tratamiento automatizado). **NO están: Estados Unidos, Brasil** (ni ningún otro país americano salvo Uruguay/Canadá-privado).

**Decisión de arquitectura (política BE):**

> BE permite infraestructura internacional **únicamente bajo mecanismo documentado y verificable**, evaluado **por flujo de datos** (no solo por la ubicación de la región primaria).

### 35.1 Regla de alcance (corrección v0.1.1)

> **Elegir una región primaria en jurisdicción considerada adecuada reduce la complejidad regulatoria de la ubicación primaria, pero NO sustituye la revisión de subprocesadores y transferencias ulteriores.**

La v0.1 trataba a Frankfurt/UE como si resolviera el problema completo. No lo hace: aunque la región primaria esté en la UE, deben evaluarse por separado — **soporte** (¿desde dónde accede el personal del proveedor?), **telemetría y logs** (¿a qué región se envían?), **subprocesadores** (§34: los de Render son US; los de Neon están bajo el marco Databricks), **backups y réplicas** (¿dónde se almacenan?), **servicios auxiliares** (monitoreo, CDN, correo), y toda **transferencia ulterior** del encargado a un subencargado. Cada uno de esos flujos tiene su propia respuesta bajo el art. 12.

### 35.2 Tres escenarios diferenciados (no acumular mecanismos por defecto)

Encuadre de estas tres filas: `[INFERENCIA + VALIDACIÓN JURÍDICA REQUERIDA — VJR-2(b)]`. Que el mecanismo contractual **por sí solo** habilite la transferencia sin consentimiento adicional es la lectura que BE adopta como diseño; **no se declara resuelta**. Si VJR-2(b) concluyera que el art. 12 exige acumular ambos, revive el problema operativo del §35.2 (red-team #41) y la política cambia.

| Escenario | Mecanismo exigido | Consentimiento de transferencia |
|---|---|---|
| **A. Jurisdicción adecuada** (UE/EEE, UK, Suiza, Uruguay, etc. — lista §35 abajo) | **Información/transparencia** al titular + DPA/contrato de encargo correspondiente (art. 25) | **No requerido** — no hay transferencia prohibida por el art. 12 `[INFERENCIA + VJR-2(b)]`. **Pero la adecuación cubre la ubicación primaria, no los flujos (a)–(e) de §35.1** |
| **B. Jurisdicción NO adecuada con mecanismo contractual válido** (EE.UU., Brasil con CCM 60-E/2016 o RIPD 198/2023, o contrato divergente presentado a AAIP en 30 días) | **Mecanismo contractual** + información al titular | **No se exige como requisito adicional universal**: BE adopta que el mecanismo contractual es la base de la transferencia `[INFERENCIA + VJR-2(b)]` |
| **C. Transferencia apoyada específicamente en el consentimiento** (Dec. 1558 art. 12: la prohibición no rige con consentimiento expreso) | Consentimiento **expreso**, informado, con consecuencias de la revocación explicadas + análisis jurídico específico del caso | **Sí — es la base misma** |

**Por qué importa (problema operacional declarado):** si toda la infraestructura dependiera exclusivamente del consentimiento revocable (escenario C), la **revocación individual de un titular** generaría una obligación técnica difícil o imposible de satisfacer usuario por usuario (habría que dejar de procesar SUS datos en esa infraestructura sin poder segregarlos). Por eso **BE no diseña esa dependencia innecesariamente**: la ruta preferida es A o B, y `TRANSFERENCIA_INT` (§12.4) se mantiene como **acto disponible cuando jurídicamente corresponda**, no como checkbox universal del onboarding. **VJR-2** permanece abierta sobre la suficiencia del DPA estándar frente al estándar reglamentario argentino.

**Matriz de transferencia (estado propuesto MVP):**

| Proveedor | Dato | Rol | Origen→Destino | Jurisdicción | Mecanismo requerido | Evidencia | Pendiente |
|---|---|---|---|---|---|---|---|
| Plataforma cómputo+DB (Render propuesto por 07) | Toda la base (C3+C4) | Encargado | AR→US (o UE si Frankfurt) | US: NO adecuada / UE: adecuada | **US → escenario B:** CCM 60-E/2016 firmadas tal cual, o contrato divergente presentado a AAIP (30 días) — **sin consentimiento adicional**. **UE → escenario A:** información al titular + DPA del art. 25 — **y además evaluación por flujo (a)–(e) de §35.1: la región primaria NO cierra la evaluación** | DPA con SCCs (verificar texto íntegro) + lista de subencargados con jurisdicción | **VJR-2**; decisión de región (§47 I-1); **flujos (a)–(e) NO VERIFICADOS** |
| Google Identity | Email/identidad (C3) | Encargado | AR→Global | No adecuada | **Escenario B** (mecanismo contractual, sin consentimiento adicional) | CDPA | VJR-2; subprocesadores CDPA §11 no extraídos |
| Google Maps | Payload deliberado C1 + metadatos de conexión no controlados por BE (§33-bis) | **Responsable independiente** | AR→US | No adecuada | **No es transferencia de BE como exportador de un encargo**: información al titular sobre la conexión con el tercero + análisis jurídico específico | Controller Terms | **VJR-8** |
| Expo Push | Push tokens (C3) | Encargado | AR→US | No adecuada | **Escenario B**; sin C4 jamás en payloads | Subprocesadores publicados; DPA bajo pedido | Obtener DPA |
| GitHub | Código (sin datos personales) | — | AR→US | — | N/A (no hay datos personales) | Regla de fixtures | — |

**Cómo leer esta matriz (corrección ADV2-02):** la columna "Jurisdicción" describe la **ubicación primaria contratada**, no el destino de todos los flujos. Ninguna fila puede considerarse resuelta sin las cinco respuestas de §35.1 — soporte, telemetría/logs, backups/réplicas, subprocesadores y transferencias ulteriores —, que **hoy están NO VERIFICADAS para todos los proveedores**. Un flujo que termine en jurisdicción no adecuada requiere el escenario B **aunque la región primaria sea la UE**. **En ningún caso el consentimiento se acumula por defecto sobre un mecanismo contractual válido** (§35.2).

## 36. Obligaciones formales / registro

`[NORMA VIGENTE + CRITERIO AAIP]`: el **Registro Nacional de Bases de Datos está operativo** (TAD; primero el responsable, luego cada base); la inscripción es obligación del **responsable**; no inscribir = infracción leve (126/2024). Aplicación a BE: mientras sea tesis con datos sintéticos, no hay base real que inscribir; **la inscripción es condición de PRE-OPERACIÓN COMERCIAL** (y prudentemente del piloto con datos reales — a confirmar en VJR-7 junto con el encuadre de responsables §9: ¿se inscribe BE, el profesional, o ambos según tratamiento?). El trámite no se intenta en esta fase; queda en el runbook de pre-operación con su documentación requerida (identificación del responsable, características/finalidad de las bases, categorías de datos — art. 21.2).

## 37. Incidentes de seguridad

**Estado normativo preciso** `[verificado]`: **no existe hoy obligación legal general** de notificar incidentes a la AAIP o titulares (25.326); la Res. 47/2018 lo trae como **medida recomendada**; las CCM fijan estándar contractual (importador→exportador ≤72 h en CCM RIPD); la colaboración con la AAIP es **atenuante** (126/2024); la obligación legal llegaría con reforma o 108+ vigente `[CONTEXTO FUTURO]`.

**Política BE (más protectora que el mínimo legal — decisión propia):**
- Proceso: **detectar → triage → contener → preservar evidencia → evaluar → erradicar → recuperar → comunicar cuando corresponda → post-mortem** (runbook operativo en el 07 §51 + este ciclo).
- Clasificación: **evento** (anomalía sin impacto confirmado) · **incidente** (compromiso de seguridad sin datos personales) · **incidente con datos personales** (confirmada exposición/alteración/pérdida de C3/C4) · **crítico** (C4 masivo, o compromiso de credenciales/infraestructura).
- **Comunicación responsable** `[PROPUESTA BE]`: incidente con datos personales → comunicar a los titulares afectados **sin demora injustificada** con lenguaje claro (qué pasó, qué datos, qué hicimos, qué puede hacer) y evaluar comunicación voluntaria a la AAIP (atenuante + buena fe); crítico → ambas siempre. Se documenta que esto es **política BE**, no obligación legal vigente — sin fingir el marco de otro país.
- Preservación de evidencia sin ampliar el daño (copias controladas, cadena de custodia mínima proporcional); los datos del incidente no se comparten con herramientas externas (incl. IA — §23).
- Registro de incidentes (bitácora) con retención R-09.

## 38. Vulnerabilidades

Proporcional por fase: **DEMO** — dependencias actualizadas al ritmo del desarrollo; `npm audit` informativo; secret scanning de GitHub activado; **PILOTO REAL** — revisión quincenal de dependencias; CVE crítica en dependencia expuesta: evaluar/parchear ≤ **7 días** `[PROPUESTA BE]`; alta ≤ 30 días; branches protegidas + revisión de cambios sensibles; **COMERCIAL** — además: escaneo automatizado en CI, política formal de parcheo, ventana de mantenimiento. Sin SLA corporativos fingidos: los tiempos son objetivos de una persona operando, declarados como propuestas. Rate limiting y umbrales anti-abuso (RNF-SEC-003): iniciales `[PROPUESTA BE]` — login: 5 intentos/15 min por cuenta+IP con lockout progresivo; recuperación: 3/hora; global por IP: generoso (evitar DoS accidental del piloto) — a calibrar con 09/11A.

## 39. Secure SDLC

Controles seleccionados de ASVS (proporcionalidad del 00 §14; el catálogo mapeado fino es tarea de 11A): revisión de todo cambio sensible (auth/permisos/consentimiento/migraciones) antes de merge; pruebas de autorización **negativa** obligatorias para cada regla de acceso (ya exigidas por 04 y practicadas en el harness); input validation global (AS-IS: ValidationPipe estricto — se preserva) y output encoding en el front; secretos fuera del código (verificado); dependencias con lockfile y `npm ci`; migraciones aditivas revisadas (skill /migrate — vigente); ambientes separados (§33); backups probados (§18); prohibición de datos reales en desarrollo (§33); fixtures sintéticos (regla vigente); **prohibido pegar datos reales en herramientas externas** (incl. IA — §23). El hook anti-destructivo del harness se conserva (y su gap PowerShell — RC-07 de la auditoría — se cierra en Fase 0 del 07).

## 40. Threat model

Método STRIDE como herramienta (no estructura). Amenazas con ID local T-01…T-22 (numeración propia del 08, sin pretensión de ID canónico; no confundir con las tareas de transición del 07, que se citan siempre calificadas como "07/T-xx"). Matriz completa con actor/vector/consecuencia/controles/residual y el red-team de **42 escenarios** (30 de la misión original + 2 de la revisión adversarial interna + **10 de la misión correctiva v0.1.1**) en `_work/08/BE_LEG_08_RIESGOS_Y_AMENAZAS_2026-08-18.md`:

| ID | Amenaza | Control preventivo | Detección | Recuperación | Residual |
|---|---|---|---|---|---|
| T-01 | Account takeover (profesional o asesorado) | MFA (§25), rate limiting, anti-enumeración, lockout | Auditoría de eventos de identidad | Revocación de sesiones + recuperación | Medio hasta MFA (gate §42) |
| T-02 | Credential stuffing | Rate limiting + lockout + MFA | Patrones de fallos en auditoría | Ídem | Medio |
| T-03 | IDOR / adivinación de IDs | Autorización por sujeto real del recurso (§27.7); cuid no secuencial (AS-IS) | Denegaciones auditadas | — | Bajo con prueba 11A |
| T-04 | Bypass de Alcance (entrenador lee antropometría sin alcance) | PDP 7 dimensiones, deny-by-default | Denegaciones auditadas | Corrección de matriz | Bajo con pruebas negativas |
| T-05 | Consentimiento revocado pero acceso vivo | Sin caché de decisiones; corte verificable (§13); denegación conservadora | Auditoría de primera denegación posterior | Incidente si falló | **Hoy ALTO (gap G-1/G-2); bajo en TO-BE** |
| T-06 | Profesional suspendido accediendo | Estados DEC-005 en el PDP; suspensión corta operaciones | Auditoría | Revocación de sesiones | Hoy alto (booleano); bajo TO-BE |
| T-07 | Abuso admin (curiosidad) | Admin sin salud por defecto; break-glass con motivo+alcance+expiración | Auditoría de break-glass + revisión posterior | Sanción/registro | Bajo-medio (unipersonal: honestidad + evidencia) |
| T-08 | Break-glass abierto/olvidado | Expiración automática ≤4 h | Auditoría de cierres | Cierre forzoso | Bajo |
| T-09 | Dump de base / exportación masiva | Sin endpoints masivos (§20); acceso DB restringido; allowlist IP | Auditoría de exportaciones; anomalías | Incidente crítico §37 | Medio (depende del proveedor) |
| T-10 | Secret leak (repo/logs/error) | Secretos fuera de Git; sanitización de logs; filtro 5xx sin internos | Secret scanning; revisión | Rotación §32 | Bajo |
| T-11 | Logs con datos de salud | Prohibiciones §30 + sanitizador central | Revisión de logs en CI/QA (11A) | Purga + incidente | Bajo |
| T-12 | Bucket/foto pública o URL firmada filtrada | Bucket privado + URL firmada corta + acceso mediado (§21) | Auditoría de accesos a media | Invalidar URLs, rotar | Bajo (función no activa aún) |
| T-13 | Backup robado / restore revive borrados | Backups cifrados + acceso restringido + **deletion ledger + replay post-restore** (§18) | Drill verificado | §18 | Bajo con drill |
| T-14 | Tercero comprometido / subprocesador cambia de país | Evaluación §34 + suscripción a cambios + mecanismo §35 | Avisos del proveedor | Re-evaluación / salida (portabilidad) | Medio (inherente a terceros) |
| T-15 | Transferencia no gobernada | Política §35 (mecanismo previo al dato real — gate §42) | Revisión de inventario | Regularización | Bajo con gate |
| T-16 | Dependency/supply-chain compromise | Lockfiles + `npm ci` + scanning + revisión | Alertas | Parcheo §38 | Medio (estándar) |
| T-17 | APK perdida/robada (dispositivo del asesorado) | Token corto + revocación de sesiones + sin datos residuales sensibles en la app más allá de caché mínima | El titular reporta; revocación | Recuperación de cuenta | Medio (inherente a mobile; MFA opcional mitiga) |
| T-18 | JWT robado | Vida corta + revocación (TO-BE §26) + TLS | Anomalías de uso | Revocación/rotación | Medio hasta paquete de sesiones |
| T-19 | CORS/config incorrecta | Allowlist explícita por ambiente; validateEnv | Revisión de despliegue (smoke) | Corrección | Bajo |
| T-20 | Data poisoning / correcciones no autorizadas | Historia por adición + autoría del token + PDP; correcciones trazables | Auditoría de correcciones | Cadena de corrección permite reconstruir | Bajo |
| T-21 | IA recibe expediente (soporte/debug) | Prohibición §23 + práctica §39 | Revisión de prácticas | Incidente con datos §37 | Bajo-medio (humano) |
| T-22 | Support/operador ve datos de más | Admin sin salud; break-glass; datos sintéticos en debug | Auditoría | §37 | Bajo-medio |

## 41. Continuidad

Consumo del 07 (RPO ≤24 h garantizado / RTO ≤4 h propuestos; drill obligatorio) con la política de este documento encima: la continuidad de BE es de **recuperación, no de alta disponibilidad** (honestidad del 07 §43); las ventanas críticas (validación/defensa/piloto) tienen freeze + contingencia; la pérdida máxima aceptable de datos de salud es la del RPO aprobado — y el titular es informado si un restore implicó pérdida (§37, comunicación responsable). La salida ordenada del servicio (si BE cerrara) es parte de la gobernanza: export a titulares + supresión certificada en proveedores — se diseña en fase comercial, se declara desde ahora como compromiso.

## 42. Ready-for-Real-Data (gate local del 08)

**Checklist bloqueante antes del PRIMER dato real sensible** (no es un Quality Gate del 00; es condición operativa; hoy NO se cumple — es futuro):

| # | Condición | Estado AS-IS |
|---|---|---|
| 1 | BE-LEG-08 aprobado (y textos legales redactados con validación jurídica de VJR-1/2/3/4) | BORRADOR |
| 2 | Consentimiento §12 operativo (taxonomía completa, versionado, evidencia, textos por perfil) | Gap G-3 |
| 3 | Revocación efectiva con corte verificable (§13) | Gap G-1/G-2 |
| 4 | Vínculo+Alcance+consentimiento aplicados en el PDP (7 dimensiones) **+ filtro de pertinencia §11-bis cableado en el mismo plano de decisión** (no en la UI ni en el cliente) | Gap G-4 |
| 5 | Q-005 implementada (sin lectura residual post-vínculo; **PAUSADO sin acceso**; SEG-10 corregido) | Gaps G-13, G-17 |
| 6 | MFA admin + MFA profesional operativos | Gap G-7 |
| 7 | Sesiones revocables (los 3 actores) | Gap G-9 |
| 8 | Production separada con datos exclusivos + guard anti-producción en unit suite + seed con guard | Parcial (07 T-01) |
| 9 | Base administrada segura (TLS, allowlist, at-rest) | Depende Q-008/ADR-024 |
| 10 | Backups + **restore probado con replay de supresiones** (§18) | Gap (07 T-06 + ledger) |
| 11 | Auditoría mínima operativa (eventos §29, bloqueante donde es obligatoria, resource-aware) | Gap G-11 |
| 12 | Logging sanitizado verificado (sin C4/C5) | Parcial |
| 13 | Canal de derechos publicado + procedimiento §19 ensayado | Gap G-6 |
| 14 | Incident runbook §37 ensayado | Gap |
| 15 | Proveedores evaluados con DPA vigente (§34) | Pendiente |
| 16 | Transferencia internacional resuelta con mecanismo documentado (§35) | **Pendiente + VJR-2** |
| 17 | Storage privado + URL firmada SI hay fotos activas | N/A hasta activar |
| 18 | Cero IA externa con dato identificable (verificado en prácticas) | Cumplido por ausencia; mantener |
| 19 | Tests negativos de autorización + cross-tenant en verde contra PostgreSQL real | Gap (11A) |
| 20 | Registro de Bases evaluado (VJR-7) y, si corresponde, inscripto | Pendiente |
| 21 | Acceso extra-aplicación del operador gobernado (§28.3-bis: bitácora + asiento §29 ensayados) | Pendiente |
| 22 | Declaración de mayoría de edad en el alta + procedimiento de menor descubierto ensayado (§24.7) | Pendiente |
| 23 | **Matriz de pertinencia (§11-bis) validada (VJR-1/VJR-4 + VD-1) y cableada en el PDP**, con las **20 pruebas de §50.1** en verde, incluida la prueba de inversión de matriz y la prueba de re-autorización tras ampliación | Pendiente |
| 24 | **Estados de verificación profesional operativos** (PENDIENTE/VERIFICADO/RECHAZADO/SUSPENDIDO — DEC-005), con corte de acceso verificable ante SUSPENDIDA/RECHAZADA (§14.1, §27.6) | Gap G-12 |

**Aclaración de la condición 23 — reescrita tras el hallazgo ADV2-04.** La redacción anterior ("el gate no exige que VJR-1/VJR-4 estén resueltas para que el sistema opere") **contradecía la condición 1 de este mismo gate y §12.3**, y en la práctica autorizaba a que datos sensibles reales llegaran a un profesional no sanitario antes de que se respondiera si eso es lícito. **Se deroga.** La regla vigente es:

> **La condición 1 manda: VJR-1/VJR-2/VJR-3/VJR-4 resueltas —o formalmente determinadas como no aplicables al alcance efectivo del piloto por validación jurídica competente— antes del primer dato real sensible.** La condición 23 verifica, además, que la matriz de pertinencia refleje esa conclusión y que su estado sea **verificable por prueba**, no por declaración.
>
> **Esta condición no es dispensable por una mera acta de Dirección.** Dirección puede reconfigurar o reducir el alcance del piloto, posponerlo o mantenerlo en datos sintéticos; no puede sustituir con aceptación interna de riesgo una validación jurídica que el propio documento declaró necesaria para la licitud del tratamiento.

En ningún caso una matriz permisiva ni una asunción interna de riesgo sin validación jurídica pasa el gate.

El sistema actual **no cumple** este gate — y no necesita cumplirlo para la demo sintética. El gate es la línea entre tesis y piloto real.

---

## 43. AS-IS de seguridad (verificado contra código a `933be6f`)

**Fortalezas reales a preservar** `[IMPLEMENTACIÓN OBSERVADA]`: login anti-enumeración con bcrypt cost 10; token de activación hasheado (SHA-256), un solo uso, con expiración; guards globales + ValidationPipe estricto + filtro de error sin fuga de internos; autoría siempre del token; admin sin acceso a salud (por matriz de permisos: `resolverLectura` → `NINGUNO`); índices únicos parciales; historia por eventos con corrección ADR-04 (biometría); secretos fuera de Git; harness de tests con guard anti-producción.

**Los 17 gaps G-1…G-17 (evidencia por grep/lectura — detalle completo en el registro de trabajo):**

| G | Gap | Evidencia |
|---|---|---|
| G-1 | Revocación de consentimiento inexistente | grep `revocar` en src → 0; `revocadoEn` (`schema:1027`) nunca se escribe |
| G-2 | Consentimiento no participa en autorización ("se registra pero no autoriza" — DEC-006 lo describe) | `permisos.service.ts:49-210` sin consulta a Consentimiento |
| G-3 | Consentimiento no granular: 2 tipos, versión "v1" placeholder, sin profesional/alcance/finalidad/hash/actor | `auth.service.ts:36-38,187-205`; `schema:1020-1031` |
| G-4 | Autorización de 3 dimensiones (rol, vínculo, especialidad→dominio) de las 7 exigidas | `permisos.service.ts` completo |
| G-5 | Cierre de cuenta inexistente (sin estado CERRADA, sin invalidación de sesiones) | grep; `schema:72-95` |
| G-6 | Exportación y derechos del titular: 0 implementación (tampoco RF activo — 04:58) | grep `EXPORTACION/supresi/anonimiz` → solo comentario |
| G-7 | MFA inexistente (ni admin) | grep `mfa/totp` → 0 |
| G-8 | Break-glass inexistente | grep → 0 |
| G-9 | Sesiones no revocables (JWT 1d sin jti/refresh/lista) | `auth.module.ts:24`; `jwt-payload.ts` |
| G-10 | Rate limiting/helmet/CORS allowlist: 0 (throttler solo comentario de intención) | grep; `schema:1049-1050` |
| G-11 | Auditoría best-effort, solo éxitos de profesionales con asesoradoId visible; sin denegaciones/EXPORTACION/resultado/versión de consentimiento; ciega a recursos derivados | `auditoria-acceso.interceptor.ts:23-26,41-75` |
| G-12 | Verificación profesional booleana (sin PENDIENTE/VERIFICADO/RECHAZADO/SUSPENDIDO de DEC-005) | `schema:211-214` |
| G-13 | Lectura residual post-vínculo decidida de facto por el código (ventana `[inicio, fechaFin ?? HOY]` — incluye SEG-10) — contraria a la política §14 | `permisos.service.ts:193-198` |
| G-14 | Anti-caché de autorización: claims estáticos hasta re-login | `jwt-payload.ts:6-11` |
| G-15 | Auditoría sin referencia a la versión de consentimiento aplicable (REG-06-50 irreconstruible) | `schema:1074-1087` |
| G-16 | Q-003/Q-004/Q-005 sin resolver (propietario 08 — este documento las propone) | 00:556-558 |
| G-17 | **Vínculo PAUSADO recibe acceso pleno idéntico a ACTIVO** — contrario a la política §14.1 (pausa = sin acceso) | `permisos.service.ts:187-191` (la condición admite `ACTIVO` **o** `PAUSADO` y en ambos casos otorga acceso pleno) — hallazgo ADV-03 de la revisión adversarial interna |

## 44. Matriz AS-IS / TO-BE

| Área | AS-IS (evidencia §43) | Riesgo | TO-BE (sección) | Gap | Prioridad | Prueba | Dueño |
|---|---|---|---|---|---|---|---|
| Autenticación | Local + bcrypt, anti-enumeración; sin federado | Bajo | §24 (+ Google opcional) | Menor | P2 | 11A | 09 |
| MFA | Inexistente | Alto para datos reales | §25 | G-7 | **Gate §42** | 11A | 09/07 |
| Sesiones | JWT 1d sin revocación, en memoria | Alto para datos reales | §26 | G-9, G-14 | **Gate §42** | 11A | 09/07 |
| Autorización | 3/7 dimensiones; deny-by-default parcial | **Alto** | §27 (PDP 7 dim.) | G-2, G-4 | **Gate §42** | 11A negativas | 06→08→09 |
| Consentimiento | Placeholder v1, 2 tipos, sin gestión | **Alto** | §12 (Q-003) | G-1, G-3, G-15 | **Gate §42** | 11A | 08→09 |
| Revocación | Inexistente | **Alto** | §13 | G-1 | **Gate §42** | 11A | 09 |
| Fin de vínculo | Ventana residual de facto + SEG-10; **PAUSADO lee como ACTIVO** | Alto (contradice §14) | §14 (Q-005) | G-13, **G-17** | **Gate §42** | 11A | 09 |
| **Pertinencia del dato (v0.1.1)** | Inexistente: la matriz AS-IS autoriza por especialidad×dominio, sin noción de categoría pertinente ni de detalle mínimo | **Alto en las dos direcciones**: hoy no puede garantizarse ni que el entrenador vea lo necesario para la seguridad, ni que no vea lo no pertinente | **§11-bis** | G-4 (dimensión faltante del PDP) | **Gate §42-23** | 11A: §50.1 (P-1…P-6 y N-1…N-7) | 08→09 |
| Passwords/recuperación | Hash ok; recuperación no implementada (activación sí) | Medio | §24 | Parcial | P1 | 11A | 09 |
| Auditoría | Best-effort parcial | Alto | §29 | G-11, G-15 | **Gate §42** | 11A | 07/09 |
| Logs | Logger default sin estructura | Medio | §30 | Parcial | P1 | 11A | 07 |
| **Verificación profesional** | **Booleano `habilitado`** — no existen PENDIENTE/VERIFICADO/RECHAZADO/SUSPENDIDO | **Alto**: §14.1 y §27.6 mandan cortar el acceso ante SUSPENDIDA/RECHAZADA, estados que hoy **no existen** (DEC-005) | §14.1, §27.6 | **G-12** | **Gate §42-24** | 11A (suspensión corta acceso) | 09 |
| Admin/break-glass | Sin admin operable; sin break-glass | Medio | §28 | G-5(admin), G-8 | P1/gate parcial | 11A | 09 |
| Exportaciones | Inexistentes | Medio (derechos) | §20 | G-6 | P1 | 11A | 09 |
| Storage/fotos | Solo storageKey; sin storage | Bajo (no activa) | §21 | — | Al activar | 11A | 07 |
| Backups | No gobernados | Alto para datos reales | §18 (+07) | — | **Gate §42** | drill | 07 |
| Secrets | Fuera de Git; sin gestor | Medio | §32 | Parcial | P0 (07 T-03) | 11A | 07 |
| Environments | dev↔prod sin guard unitario | Alto | §33 | — | P0 (07 T-01) | 11A | 07 |
| CORS/rate limiting | Inexistentes | Medio-alto | §24.5/§38 (+07 §29) | G-10 | P1/gate | 11A | 07/09 |
| Cierre de cuenta | Inexistente | Alto (derechos) | §15/§17 | G-5 | **Gate §42** | 11A | 09 |
| Supresión/derechos | Inexistentes | Alto (plazos legales) | §17/§19 | G-6 | **Gate §42** | 11A | 08→09 |
| Terceros/DPAs | Sin contratos | Alto para datos reales | §34 | — | **Gate §42** | evidencia | Dirección |
| Transferencias | Sin mecanismo | **Alto** (muy grave 126/2024) | §35 | — | **Gate §42** | evidencia | Dirección+**VJR-2** |
| IA | Sin uso (cumple por ausencia) | Bajo | §23 | — | Mantener | práctica | Dirección |

## 45. Riesgos (locales R-08-xx; matriz completa en `_work/08`)

| ID | Riesgo | Prob. | Impacto | Tratamiento | Trigger | Estado |
|---|---|---|---|---|---|---|
| R-08-01 | VJR-1 (encuadre responsable/encargado) se resuelve contra el modelo asumido | Media | Alto (contratos/consentimientos) | Diseño por finalidad §9 degradable; dictamen antes de operación comercial | Dictamen | ABIERTO |
| R-08-02 | Transferencia a EE.UU. sin mecanismo válido (VJR-2) | Media | **Muy alto** (infracción muy grave) | §35: preferencia UE o CCM; gate §42-16 | Elección de región (07) | ABIERTO |
| R-08-03 | Piloto con datos reales antes del gate §42 | Media | Alto | Gate bloqueante + checklist en el plan de piloto | Agenda de piloto | ABIERTO |
| R-08-04 | Ley 26.529 aplica y nadie retiene los 10 años (VJR-3) | Baja-media | Medio | Export al profesional al cerrar + parámetro bloqueado | Dictamen | ABIERTO |
| R-08-05 | Textos legales (términos/privacidad/consentimientos) sin redacción profesional | Alta (hoy no existen) | Alto | Redacción + validación antes del gate | Gate §42-1 | ABIERTO |
| R-08-06 | Fatiga/abandono en onboarding por consentimientos | Media | Medio | UX de un flujo con actos separados (10) | Validación usuarios (G4) | ABIERTO |
| R-08-07 | Deriva de subprocesadores (país/proveedor) | Media | Medio | Suscripciones + re-evaluación §34 | Aviso del proveedor | GESTIONADO |
| R-08-08 | Operación unipersonal: break-glass sin segunda persona | Cierta | Medio | Diseño §28 + trigger four-eyes | ≥2 operadores | ACEPTADO TEMPORAL |
| R-08-09 | Marco legal cambia (reforma con notificación 72 h, DPO) | Media | Medio | Diseño ya compatible; vigilancia normativa | Sanción de reforma | GESTIONADO |
| R-08-10 | El 07 aprueba región/proveedor antes de resolver VJR-2 | Media | Alto | Impacto vinculante §47 (condición previa) | Aprobación ADR-024 | ABIERTO |
| R-08-11 | Incapacidad del operador único durante piloto real: plazos legales de derechos (10 días corridos / 5 hábiles) e incidentes sin ejecutor | Baja | Alto | Procedimiento de contingencia proporcional: persona de confianza designada + sobre/procedimiento de acceso de emergencia a credenciales (auditado); considerar en el checklist del gate §42 | Agenda de piloto | ABIERTO |
| **R-08-12** *(v0.1.1 — ADV2-08)* | **El profesional no puede distinguir "el titular no cargó información de seguridad" de "la cargó y no me la autorizó"**, porque la anti-enumeración (§27.8) impide señalar la existencia de un dato no autorizado. Riesgo **de seguridad de la persona**, no de privacidad: el entrenador puede creer que no hay condiciones cuando sí las hay | Media | Alto | **Residual ACEPTADO conscientemente** (§11-bis.7): regla de no-inferencia por ausencia + rótulo neutral obligatorio en UI ("sin información disponible para este vínculo/alcance" ≠ "sin condiciones") + circuito de producto para pedirla al aceptar el Vínculo + responsabilidad profesional de anamnesis fuera del sistema. **No se implementa indicador de "hay información no autorizada"**: revelaría la existencia de un dato sensible sin autorización | Diseño de la vista pertinente (10) | **RESIDUAL DECLARADO** |
| **R-08-13** *(reformulado v0.1.3)* | **Intento de iniciar un piloto con datos reales antes de resolver VJR-1/VJR-4**, invocando un default conservador o una aceptación interna de riesgo | Media | Alto | **PROHIBIDO por el gate §42**: Dirección puede reducir/reconfigurar el alcance o mantener datos sintéticos, pero no sustituir la validación jurídica por acta. Solo una validación competente que resuelva o declare no aplicable la VJR al alcance efectivo permite pasar el gate | Agenda/decisión de piloto | **BLOQUEADO** |

## 46. Decisiones de Dirección ratificadas

> **Estado tras ACTA-DIR-019:** CAND-08-A…J quedan **APROBADAS/RATIFICADAS**. Se conservan sus identificadores `CAND-08-*` como trazabilidad histórica; esta acta no inventa IDs DEC globales ni altera la numeración canónica existente.

Sin asignar IDs DEC globales (riesgo de colisión con el 07 BORRADOR; ID GLOBAL: PENDIENTE DE ASIGNACIÓN — integridad > numeración):

| Candidata | Contenido | Sección |
|---|---|---|
| CAND-08-A | Adoptar el modelo de consentimiento §12 (resolución Q-003) | §12.5 |
| CAND-08-B | Adoptar la política de fin de vínculo sin lectura residual (resolución Q-005; deroga la ventana AS-IS) | §14.3 |
| CAND-08-C | Adoptar la matriz de retención R-01…R-17 con parámetros pendientes (resolución Q-004) | §16 |
| CAND-08-D | Política de transferencias §35 con preferencia regulatoria UE y condiciones para EE.UU. | §35 |
| CAND-08-E | Política de incidentes con comunicación responsable (más protectora que el mínimo legal) | §37 |
| CAND-08-F | Gate Ready-for-Real-Data como condición operativa bloqueante | §42 |
| CAND-08-G | Encargar las validaciones jurídicas VJR-1…10 (prioridad: 1, 2, 3, 4, 9) y la **validación disciplinar VD-1** (§52 — no jurídica: criterio de entrenamiento/nutrición/medicina deportiva sobre la matriz de pertinencia) a asesoramiento profesional antes de operación real | §52 |
| CAND-08-H | **Ratificar por acta las decisiones de Dirección §9.1–9.16** transcriptas en `_work/08/BE_LEG_08_DECISIONES_DE_DIRECCION_TRANSCRIPTAS_2026-08-18.md` (fuente de las políticas de MFA, fotos, exportaciones, analítica, IA, admin/break-glass, responsabilidades) — **condición previa a la aprobación del 08** (cierra ADV-01). **RATIFICADA por ACTA-DIR-019** | §4 (nota de autoridad) |
| **CAND-08-I** *(nueva en v0.1.1)* | **Ratificar por acta la precisión de Dirección sobre acceso por pertinencia** (§11-bis): ambos extremos prohibidos; el profesional no sanitario accede a información sensible **pertinente y necesaria** para desempeñar con seguridad el Alcance autorizado, con **detalle mínimo suficiente** y nunca al expediente completo. Transcripta en `_work/08/BE_LEG_08_DECISIONES_DE_DIRECCION_TRANSCRIPTAS_2026-08-18.md` §9.17. **Condición de autoridad CUMPLIDA por ACTA-DIR-019** (misma razón que CAND-08-H: la política nuclear no puede apoyarse en una instrucción de chat sin acta) | §11-bis |
| **CAND-08-J** *(nueva en v0.1.1)* | **Adoptar la regla de transferencias por flujo** (§35.1/§35.2): la región primaria adecuada **no sustituye** la revisión de subprocesadores y transferencias ulteriores; tres escenarios diferenciados; `TRANSFERENCIA_INT` deja de ser requisito universal | §35 |

## 47. Impactos vinculantes para la revisión de BE-LEG-07

**Convención de referencias en esta tabla (aclarada en v0.1.1):** en la columna *"Sección 07 afectada"* los `§` refieren al **BE-LEG-07**; en las columnas *"Decisión 08"* y *"Cambio requerido"* refieren a **este documento**. Donde la ambigüedad era posible se calificó explícitamente ("07 §56").

| # | Decisión 08 | Sección 07 afectada | Cambio requerido | Criticidad |
|---|---|---|---|---|
| I-1 | Transferencias §35: EE.UU. no adecuado; UE sí — **pero la región primaria no cierra la evaluación (§35.1)** | §31 (Q-008/ADR-024, región Virginia) | **Condicionar la aprobación de ADR-024** a un análisis **por flujo**, no por región: (a) ubicación primaria — evaluar Frankfurt (Render la tiene) como preferencia regulatoria midiendo latencia AR↔UE vs presupuestos, o mantener US bajo escenario B de §35.2 (CCM/DPA-presentado, VJR-2); **y además, en cualquiera de los dos casos**: (b) soporte del proveedor (¿desde qué jurisdicción accede?), (c) destino de telemetría/logs, (d) ubicación de backups y réplicas, (e) subprocesadores y sus países, (f) transferencias ulteriores habilitadas por contrato. **Elegir UE no exime de (b)–(f).** El trigger §31.9-a del 07 se amplía: no solo "residencia SA" — también el resultado de VJR-2 y cualquier cambio en (b)–(f). **`TRANSFERENCIA_INT` no se exige como requisito universal**: solo si la transferencia se apoya específicamente en el consentimiento (escenario C, §35.2) | **BLOQUEANTE para datos reales** |
| I-2 | DPA obligatorio por proveedor antes del dato real, **con revisión explícita de subprocesadores y transferencias ulteriores** | §31.8/§34-07 | Agregar a las condiciones de ADR-024: DPA verificado (texto íntegro) + breach ≤72 h + **lista de subencargados con su jurisdicción** + cláusula de aviso previo ante alta/cambio de subencargado + derecho de objeción/salida. La verificación se documenta por proveedor, no por plataforma en bloque (§35.1) | Alta |
| I-3 | Retención técnica de backups subordinada a §16 + ledger §18 | §45-47 | Incorporar el deletion ledger y el **replay post-restore** al drill (el restore no vuelve a producción sin re-aplicar supresiones) | Alta |
| I-4 | Sesiones revocables + MFA como gate §42 (no solo "P1") | §42.3 | El paquete deja de ser calendario indicativo: es **condición bloqueante** del primer dato real; R-07-08 no puede seguir abierto en piloto | Alta |
| I-5 | Auditoría §29 (bloqueante, resource-aware, con versión de consentimiento) | §22.7 | Confirmado y ampliado: la fila audita la referencia a la versión de consentimiento aplicable (REG-06-50) | Media |
| I-6 | Retención de auditoría R-09 (propuesta 5 años) | §22.7/§45 | Dimensionar el crecimiento de la tabla de auditoría con esa retención | Media |
| I-7 | Fotos §21 (URL ≤15 min, EXIF depurado, borrado con derivados) | §25/ADR-028 | Incorporar como requisitos de activación de la fase media | Media |
| I-8 | Ambientes §33 (guard unitario + seed con guard) | §26/T-01 | Confirmado; sin cambios | Baja |
| I-9 | Q-005 §14 deroga la ventana de lectura del AS-IS | **07 §56** (convergencia) | La corrección de `permisos.service.ts` (G-13/SEG-10) entra a la fase de convergencia como cambio de política, no solo bugfix | Alta |
| **I-10** | Política de pertinencia §11-bis: perfiles no sanitarios pueden requerir C4 pertinente sin recibir expediente universal | **PDP / autorización / configuración de política** | La arquitectura del 07 debe soportar una matriz `Alcance × categoría → permitido/nivel_de_detalle`, versionada, auditable y modificable **sin migrar datos ni rehacer Vínculos/Alcances/historia**; la vista mínima no debe duplicar la historia como segunda fuente de verdad | **Alta** |

## 48. Obligaciones de política para BE-LEG-09

Revocación corta acceso de inmediato (contrato de recálculo; sin caché); otorgamiento/consulta/revocación de consentimiento con conductas UC-P07/P08 (versión mostrada vs aceptada; errores sin estados parciales); autorización: misma semántica en Website/APK; denegación uniforme anti-enumeración (inexistente ≡ no autorizado); cierre de cuenta (UC-P27) con invalidación de sesiones; exportaciones con scope por sujeto + registro; derechos del titular: soporte de acceso/rectificación/supresión con los plazos §19 (10 días corridos / 5 días hábiles) como restricción de diseño del flujo; MFA/step-up para admin y break-glass; rate limiting con respuestas neutras; contratos de recuperación de acceso sin enumeración; **ninguna respuesta incluye datos de terceros**; los payloads push jamás contienen C4.

## 49. Obligaciones para BE-LEG-10 (UI/UX)

Onboarding con actos de consentimiento **separados y comprensibles** (A1/A2/A3 — no un checkbox único); texto destacado y diferenciado para fotos (§21) y para perfiles no sanitarios (§12.3); revocación **accesible** (tan fácil revocar como otorgar); pantalla de vínculos/consentimientos propios (RF-023: lo mostrado = autorización efectiva); aviso al profesional del efecto ANTES de finalizar vínculo (§14); exportación de la propia historia visible; configuración de privacidad localizable; lenguaje claro no clínico; sin patrones oscuros (pre-marcado, ocultamiento de revocación, jerga).

**Agregado en v0.1.1 — la pantalla de autorización debe hacer visible la pertinencia (§11-bis):** al autorizar un Alcance, el titular ve **enumeradas y comprensibles** las categorías que ese profesional podrá consultar (modelo conceptual en §12.2 B2), no una fórmula abstracta del tipo "datos de salud". Debe entenderse tanto **qué sí** ("condiciones de salud relevantes para el ejercicio") como **qué no** ("no accede a tu plan nutricional ni a tu historia clínica completa"). Al cargar información de salud, el titular debe poder saber **para qué sirve y quién podría verla** (§11-bis.5), y consultar después **quién accedió** (§19.7). Estas pantallas son la superficie donde la política deja de ser un documento: si la UI no las muestra, la política no existe para el usuario.

## 50. Obligaciones de prueba para BE-LEG-11A

Cross-tenant e IDOR (incl. recursos derivados planId/eventoId→titular); bypass de Alcance (matriz §11 completa en negativo); consentimiento: otorgar/consultar/revocar con versionado y evidencia; **revocación en caliente** (corte ≤1 operación posterior); revocación A3 (flujo §13: suspensión + plazo + procesamiento por defecto); profesional suspendido; fin de vínculo (todas las filas §14.1; verificación de derogación de la ventana AS-IS **y del acceso de PAUSADO — G-17**); declaración de edad + procedimiento de menor descubierto (§24.7); acceso extra-aplicación del operador (bitácora §28.3-bis); admin-no-salud; break-glass (ciclo completo + expiración); auditoría (fila real en DB, bloqueo cuando obligatoria, denegaciones, versión de consentimiento); exportaciones con scope; MFA (enrolamiento/des-enrolamiento/step-up); revocación de sesiones (cierre de cuenta, cambio de credencial); recuperación sin enumeración; logs sin C4/C5 (test de sanitización); secretos ausentes de repo/logs/respuestas; rate limiting; backups/restore **con replay de supresiones** (§18); fotos privadas + URL firmada expirada (al activar); minimización a terceros (payloads push sin C4; **payload deliberado a Maps limitado a C1 — la prueba verifica lo que BE envía, no lo que el proveedor recoge por conexión directa, §33-bis**); prohibición IA (revisión de prácticas); ambientes (guard unitario, seed rechaza production); derechos del titular end-to-end (acceso/rectificación con propagación/supresión con excepciones).

### 50.1 Pruebas de la política de pertinencia (§11-bis) — agregadas en v0.1.1

La política de pertinencia solo es real si **falla en ambas direcciones**. Un set de pruebas que solo verifique denegaciones consagraría el extremo prohibido "el entrenador no ve nada"; uno que solo verifique accesos consagraría el extremo opuesto. **Ambos bloques son obligatorios.**

**A. Pruebas POSITIVAS (deben pasar — el acceso pertinente EXISTE):**

| # | Escenario | Resultado esperado |
|---|---|---|
| P-1 | Entrenador con Vínculo ACTIVO, Alcance ENTRENAMIENTO y consentimiento B2 vigente consulta la condición **diabetes** declarada del asesorado | **PERMITIDO** — con el detalle mínimo suficiente de §11-bis.3 (condición + implicancia para el ejercicio), no el expediente |
| P-2 | Ídem, **hipertensión** declarada | **PERMITIDO** con detalle mínimo |
| P-3 | Ídem, **dolor lumbar / lesión activa / restricción de movimiento** | **PERMITIDO** — es información nuclear para la seguridad del entrenamiento |
| P-4 | Ídem, **medicación relevante para el ejercicio** (p. ej. betabloqueantes que alteran la respuesta de FC) | **PERMITIDO** con detalle mínimo (que existe y su implicancia), **no** el esquema terapéutico completo |
| P-5 | Nutricionista con Alcance NUTRICION consulta la misma condición diabetes | **PERMITIDO** con el detalle que su Alcance requiere (que puede ser mayor que el del entrenador — la pertinencia es **por Alcance**, no global) |
| P-6 | El asesorado consulta **su propia** información de seguridad y **quién la vio** | **PERMITIDO** (§19.7) — la transparencia es parte de la política, no un extra |

**B. Pruebas NEGATIVAS (deben denegar — el acceso NO es ilimitado):**

| # | Escenario | Resultado esperado |
|---|---|---|
| N-1 | Entrenador consulta **antecedentes no pertinentes** al entrenamiento (p. ej. antecedentes de salud mental, ginecológicos, infectológicos sin implicancia declarada para el ejercicio) | **DENEGADO** aunque exista consentimiento B2 — la pertinencia es un filtro **adicional** al consentimiento, no sustituido por él |
| N-2 | Entrenador consulta información pertinente de **otro Alcance** (p. ej. el detalle nutricional completo) | **DENEGADO** — cross-scope (§11-bis.2) |
| N-3 | Entrenador solicita el **informe/expediente clínico completo** o una exportación integral de la historia | **DENEGADO** — ninguna ruta del sistema entrega el expediente completo a un perfil no sanitario (§11-bis.3, §20) |
| N-4 | El asesorado **revoca** el consentimiento B2 y el entrenador vuelve a consultar la condición diabetes | **DENEGADO en la operación siguiente** (§13) — sin cambiar el estado de otros Alcances ni borrar el dato de la historia (TR-C) |
| N-5 | Vínculo **PAUSADO** o **FINALIZADO**: cualquier consulta de información pertinente | **DENEGADO** (§14.1; G-13 y G-17 corregidos) |
| N-6 | Entrenador de **otro** asesorado consulta la información de seguridad de este | **DENEGADO** — cross-tenant, sin excepción por pertinencia |
| N-7 | El sistema está en el **default conservador** (§11-bis.4, VJR-1/VJR-4 sin resolver) y se consulta una categoría no habilitada explícitamente | **DENEGADO por defecto** — la duda deniega, no permite |
| N-8 | Un profesional invoca una "finalidad específica" para obtener mayor detalle sin cambio de matriz | **DENEGADO** — no existe escalamiento otorgable en runtime; el MVP no implementa consentimiento dato-a-dato como excepción (§11-bis.3) |
| N-9 | La información pertinente vive **solo dentro de una nota de texto libre** que mezcla contenido pertinente y no pertinente | **DENEGADO** — el texto libre queda fuera de la vista pertinente por defecto (§11-bis.3-bis.2); no se sintetiza automáticamente |

**C. Pruebas del caso "la información no está" (§11-bis.7):**

| # | Escenario | Resultado esperado |
|---|---|---|
| A-1 | El titular **no cargó** la condición | Vista pertinente vacía |
| A-2 | El titular **cargó** la condición y **no autorizó** esa categoría | **Resultado observable idéntico al de A-1** — el profesional no puede distinguirlos (anti-enumeración §27.8). Si difieren en cualquier señal (mensaje, código, latencia, presencia de campo), hay fuga de existencia |
| A-3 | La vista pertinente está vacía | Se rotula de forma neutral: **"sin información disponible para este vínculo/alcance — no significa ausencia de condiciones"**; nunca "sin condiciones de salud" ni "sin información cargada" |
| A-4 | Cambio de la matriz de pertinencia | Queda **asiento de auditoría** con versión anterior→nueva, fundamento y acta (§29); y la decisión de acceso posterior registra **qué versión** la resolvió |
| A-5 | La matriz amplía una categoría o pasa de `RESUMEN_FUNCIONAL` a mayor detalle para un Alcance con vínculos B2 ya vigentes | **NO se amplía el acceso de esos vínculos** hasta que el titular acepte la nueva versión B2; una reducción sí aplica inmediatamente. La decisión posterior debe registrar nueva versión de consentimiento + nueva versión de matriz |

**Criterio de suficiencia del set:** si al invertir la matriz de pertinencia (habilitar todo / denegar todo) alguno de los casos P/N **no** cambia de resultado, la prueba no está midiendo la política y debe rehacerse. (Los casos A-1…A-4 son la excepción deliberada: A-1/A-2 deben dar **el mismo** resultado bajo cualquier matriz — esa indistinguibilidad es justamente lo que prueban.)

**Total del set §50.1: 20 casos** — 6 positivos (P-1…P-6), 9 negativos (N-1…N-9), 5 de ausencia/cambio de política (A-1…A-5).

## 51. Trazabilidad (consumible por 12)

Cadena: requisito canónico → política 08 → control → componente (07/09) → prueba (11A). Muestra completa en la matriz del registro de trabajo; ejemplos: RNF-SEC-001→§27→PDP 7 dim.→pdp(07 §18)→11A-autorización; RF-022/RNF-PRI-002→§13→corte verificable→pdp+vinculos→11A-revocación; RF-069→§15/§17→cierre por categorías→identidad(09)→11A-cierre; DEC-006→§12/§27→consentimiento como gate→pdp→11A; art. 14/16 (25.326)→§19→flujo de derechos→09→11A-derechos; art. 12→§35→mecanismo por proveedor→Dirección/07→evidencia contractual; REG-06-50→§12.2/§29→versión reconstruible→auditoría→11A.

## 52. Pendientes jurídicos (VALIDACIÓN JURÍDICA REQUERIDA — consolidado)

| VJR | Cuestión | Impacto si cambia | Diseño degradable |
|---|---|---|---|
| **VJR-1** | Encuadre BE por tratamiento (encargado del profesional / responsable / corresponsable; art. 25) **y — reformulado en v0.1.1 — suficiencia del consentimiento del titular (art. 5 + Dec. 1558) como base para que un profesional NO sanitario acceda a información sensible pertinente y necesaria (§11-bis), frente a la prohibición del art. 7.3 y a la excepción del art. 8 que no lo alcanza**. La pregunta **no** es "¿el entrenador accede o no accede?" (ambos extremos están descartados por Dirección, §11-bis.1) sino **"¿hasta qué categorías pertinentes, con qué base y con qué detalle mínimo?"** | Contratos, consentimientos, RNBD, **y el ancho de la matriz de pertinencia §11-bis** | Sí, con límite honesto — la separación TR-B/TR-C aísla la historia longitudinal del encargo profesional y la matriz §11-bis se estrecha **sin tocar** Vínculos, Alcances ni historia; pero una lectura maximalista del art. 7.3 impactaría también a TR-C: peor caso y rutas en §12.5 |
| **VJR-2** | (a) ¿El DPA estándar del proveedor satisface el estándar de cláusulas del Dec. 1558/60-E, o exige CCM firmadas/presentación AAIP 30 días? **(b) — agregado v0.1.1 (ADV2-14):** ¿el mecanismo contractual **por sí solo** habilita la transferencia sin consentimiento del titular (escenario B de §35.2), o el art. 12 exige acumular ambos? De esta respuesta depende que `TRANSFERENCIA_INT` sea o no requisito universal | Elección de región/proveedor (07); **y si (b) resultara que el consentimiento se acumula, revive el problema operativo del §35.2 (revocación individual sobre infraestructura compartida — red-team #41)** | **Parcial** — la preferencia UE resuelve la **ubicación primaria**, no los flujos (b)–(f) de §35.1 (soporte, telemetría, backups, subprocesadores, transferencias ulteriores), que se evalúan por separado (§34, §47 I-1). **La afirmación "preferencia UE elimina el problema" de la v0.1 queda derogada** |
| **VJR-3** | Aplicabilidad de la Ley 26.529 (historia clínica, 10 años) a registros de nutricionistas en BE; depositario | Retención R-07; exportación al cierre | Sí — parámetro bloqueado + export al profesional |
| **VJR-4** | **Reformulada en v0.1.1.** Perímetro del art. 8 (qué perfiles quedan dentro: nutricionista con matrícula probablemente sí; entrenador/health coach probablemente no) **+ validación de la matriz de pertinencia concreta**: ¿qué categorías sensibles son *pertinentes y necesarias* para desempeñar con seguridad cada Alcance no sanitario, con qué **detalle mínimo suficiente** (§11-bis.3), y qué categorías quedan **siempre fuera** aunque el titular quisiera compartirlas? + verificación de matrícula por jurisdicción | Textos §12.3; **ancho y granularidad de la matriz §11-bis**; matriz de dominios de no-sanitarios; DEC-042 | Sí — estrechar o ensanchar la matriz de pertinencia es **cambio de configuración de política**, sin migración de datos ni reestructuración de Vínculos/Alcances/historia (§11-bis.4) |
| **VJR-5** | Circulación intra-equipo: ¿cesión (art. 11), encargo, o mismo responsable? — contenido exacto de `ALCANCE_PROFESIONAL`/compartir | Textos de consentimiento | Sí |
| **VJR-6** | Estándar de disociación exigible (Res. 4/2019 anexo — texto a verificar) | Test §22 | Sí — el test propuesto es conservador |
| **VJR-7** | Inscripción RNBD: quién, cuándo, qué bases (depende de constitución jurídica y VJR-1) | Pre-operación | Sí — runbook §36 |
| **VJR-8** | Google Maps como responsable independiente: suficiencia de la información al titular | §33-bis | Sí — fallback lista/texto ya canónico |
| **VJR-9** | Base jurídica y límites del acceso excepcional (break-glass §28, incl. acceso de operador por consola §28.3-bis): suficiencia de arts. 5.2/9/10 según tipo de incidencia; necesidad de consentimiento/información previa | §28; información A2 | Sí — el régimen ya restringe; un resultado adverso estrecha supuestos |
| **VJR-10** | Régimen de menores si alguna vez se admiten (CCyC art. 26, autonomía progresiva, representantes) — hoy NO se admiten | §24.7 | Sí — hoy inaplicable por diseño |
| *Verificaciones textuales pendientes* (no es un VJR; renombrada en v0.1.1 — colisionaba con VJR-10) | Art. 11.4, art. 16 in fine, CP 117bis/157bis, anexo Dec. 1558 art. 25, Res. 4/2019; re-verificación de la lista de adecuación y del estado del Convenio 108+ al desplegar | Citas de la matriz legal | — |
| **VD-1 — VALIDACIÓN DISCIPLINAR REQUERIDA** *(nueva en v0.1.1; NO es jurídica)* | **¿Qué condiciones de salud son efectivamente relevantes para la seguridad de la práctica de cada Alcance, y con qué detalle mínimo?** La matriz del §11-bis.3 es una **propuesta técnica** redactada sin competencia disciplinar: qué importa para entrenar con seguridad a una persona diabética, hipertensa o con lesión lumbar es una pregunta de **entrenamiento, nutrición y medicina deportiva**, no de derecho. **Nadie con esa competencia la revisó** (H-08-COR-05) | Contenido concreto de la matriz de pertinencia; seguridad real del asesorado | Sí — es cambio de configuración (§11-bis.4-bis), pero **el riesgo mientras tanto no es jurídico sino de seguridad de la persona**: una matriz demasiado estrecha por prudencia jurídica puede ocultarle a un profesional algo que necesitaba saber |

## 53. Criterios de aceptación del documento

Responde las preguntas del criterio de completitud de la misión: qué es dato sensible en BE (§10), quién accede y por qué (§11/§11-bis/§27), **con qué detalle y bajo qué filtro de pertinencia** (§11-bis), hasta cuándo (§16), qué corta el acceso (§13/§14), qué pasa al terminar vínculo (§14) y al cerrar cuenta (§15/§17), qué se conserva y por qué (§16), qué se anonimiza (§17/§22), qué se exporta (§20), qué ve Admin (§28), break-glass (§28), fotos (§21), terceros/países/mecanismos (§34/§35), incidentes (§37), derechos del titular (§19), controles obligatorios antes de datos reales (§42), pendientes jurídicos (§52), cambios requeridos al 07 (§47).

**Criterio de éxito de la consolidación y contrarrevisión final v0.1.3 (recorrido de verificación):** un lector debe poder seguir el caso "asesorado con diabetes contrata un entrenador" de punta a punta sin encontrar contradicciones — §11-bis.6 lo recorre completo, §11-bis.3 fija el detalle mínimo, §11 lo refleja en la matriz, §12.4 lo conecta con el consentimiento B2 granular, §13 explica qué pasa al revocar, §50.1 lo prueba en positivo (P-1) y en negativo (N-1/N-3/N-4), y §52 declara que la pregunta jurídica de fondo (VJR-1/VJR-4) sigue abierta con default conservador en §11-bis.4.

## 54. Autoverificación

La autoverificación de v0.1/v0.1.1 se conserva en `_work/08/BE_LEG_08_AUTOVERIFICACION_2026-08-18.md`; la consolidación v0.1.2 y esta contrarrevisión final v0.1.3 agregan una pasada específica sobre las superficies modificadas. Resultado documental:

1. Q-003/Q-004/Q-005 permanecen coherentes y sin rediseño del 06.
2. 17 gaps AS-IS · 17 categorías de retención · 24 condiciones Ready-for-Real-Data · 10 impactos al 07 · 10 VJR + 1 VD · 13 riesgos · 6 clases de información · **20 casos de prueba §50.1**.
3. La investigación legal original no se reemplaza ni se declara como dictamen; VJR-1/VJR-2/VJR-3/VJR-4 siguen siendo condiciones previas a datos reales según §42.
4. **El gate jurídico no puede ser dispensado por acta de Dirección**: una actuación interna puede reconfigurar el piloto, no tornar lícito un tratamiento cuya base sigue sin validar.
5. La matriz de pertinencia queda versionada y auditable. **Reducir acceso aplica inmediatamente; ampliarlo exige nueva versión B2 y nueva aceptación** para vínculos existentes. Ningún consentimiento previo acepta futuras ampliaciones.
6. El profesional no sanitario puede recibir C4 pertinente y autorizado con mínimo detalle suficiente, pero no existe acceso universal ni escalamiento dato-a-dato en el MVP.
7. La vista “dato inexistente” y “dato existente no autorizado” permanece observacionalmente indistinguible y usa copy neutral.
8. La evaluación de transferencias sigue siendo por flujo; región primaria adecuada no sustituye subprocesadores/soporte/telemetría/backups/transferencias ulteriores.
9. `I-10` explicita hacia 07 la capacidad de matriz `Alcance × categoría → permitido/nivel_de_detalle` sin segunda fuente de verdad.
10. El documento continúa sin declarar cumplimiento legal, sin aprobación, sin canonización y sin implementación.

**Resultado de contrarrevisión final:** **CONFORME**. Dirección resolvió la instancia mediante `ACTA-DIR-019`; las VJR/VD permanecen como condiciones preoperativas para datos reales y no como defectos del documento académico.

## 55. Estado final

`BE-LEG-08 v0.1.4 — APROBADO POR DIRECCIÓN · AUTORIZADO A CANONIZAR`.

### 55.1 Resoluciones formalizadas por ACTA-DIR-019

- **Q-003:** APROBADA — consentimiento y autorización bajo el modelo de dos relaciones; para acceso profesional, `profesional × Alcance × finalidad × categorías pertinentes`, con B2 versionado, revocable y sin acceso universal.
- **Q-004:** APROBADA — retención por categoría y finalidad (`R-01…R-17`), sin plazo global; revocar B2 corta acceso pero no destruye la historia del titular; A3 se procesa conforme §13/§16/§17.
- **Q-005:** APROBADA — `PAUSADO`, `FINALIZADO` o consentimiento revocado no conservan lectura profesional residual; la conservación de la historia del asesorado es independiente del permiso del antiguo profesional.
- **CAND-08-A…J:** APROBADAS/RATIFICADAS; H/I/J quedan formalmente incorporadas a la cadena de autoridad.
- **G3:** REGULARIZADO — se subsana la clausura anticipada asentada por ACTA-DIR-018 sin borrar ni reescribir el hecho histórico.
- **VJR/VD:** NO se consideran resueltas por esta aprobación. Se mantienen como validaciones preoperativas conforme §42/§52; un acta interna no sustituye la validación jurídica que el propio diseño exige antes de datos reales.

### 55.2 Efecto documental

La aprobación no declara que BE cumpla materialmente la Ley 25.326 ni otras normas; aprueba el **diseño documental de seguridad, privacidad y gobernanza** para la tesis y como TO-BE del producto. La operación con datos reales queda subordinada al `Ready-for-Real-Data` de §42.

La canonización será efectiva únicamente cuando se ejecute y verifique el commit autorizado por `ACTA-DIR-019`. Hasta ese momento este archivo está **APROBADO Y AUTORIZADO A CANONIZAR**, pero todavía no es la copia canónica almacenada en Git.

### 55.3 Continuidad

`BE-LEG-07` vuelve a ser el siguiente documento activo. Debe revisar su v0.1 contra los **10 impactos vinculantes de §47**, incluyendo `I-10` (matriz de pertinencia), y mantener `Q-008` abierta hasta decisión de Dirección.

---

## 56. Parche transversal v0.1.5 — gobierno de CAP-MET, CAP-DAT, ANT-DRAFT y ANT-VOID

> **Naturaleza:** `ADICIÓN DE SEGURIDAD/PRIVACIDAD POST-BASELINE`  
> **Autorización:** `ACTA-DIR-024`  
> **Fuente RF:** BE-LEG-04 v0.4.2.1 · `47f0400c1a2843e4e1e0c9bcca8971fb17b17a5217947dad1d234550b685257b`  
> **Fuente UC:** BE-LEG-05 v0.15 · `d6a787bf0485aad00b412da51717bd12a3e6ba029078412aedf686bc599f2fbf`  
> **Fuente dominio:** BE-LEG-06 v0.1.1 · `7c1950adafbdd3f3c27a04d225ff2844c4fe170a965104407a92e09ecdd4fea1`  
> **Auditoría de impacto:** v0.2.1 · `454eae54dd595cef67ff96665713c357648bbbfbcdeffb26afbc045f35e7b35c`  
> **Precedencia:** §56 especializa únicamente las nuevas superficies. Q-003/Q-004/Q-005, §11-bis, §13, §14, §16, §27, §28 y §29 permanecen vigentes y gobiernan en todo lo no especializado.

### 56.1. No se crea un nuevo régimen de consentimiento

Este parche **no agrega tipos de consentimiento**.

Se conservan:

```text
A3 — DATOS_SALUD_BE
B2 — ALCANCE_PROFESIONAL
     profesional × Alcance × finalidad × categorías pertinentes
```

Regla transversal:

```text
método disponible
≠ autorización

ejecución de cálculo
≠ autorización

plantilla
≠ autorización

solicitud
≠ autorización

respuesta existente
≠ autorización
```

CAP-MET y CAP-DAT consumen el mismo PDP de §27.

Si una nueva versión de método/plantilla requiere **más categorías o mayor detalle** que lo autorizado para vínculos existentes:

- reducir categorías/detalle puede aplicar inmediatamente;
- ampliar categorías/detalle exige nueva versión B2 + nueva aceptación del titular conforme §11-bis.4-ter;
- ninguna configuración futura queda pre-consentida.

---

### 56.2. Clasificación de las nuevas superficies

| Superficie | Clasificación protectora |
|---|---|
| Catálogo/metadatos genéricos de métodos y versiones, sin sujeto ni inputs personales | `C2 INTERNO` |
| Ejecución de cálculo vinculada a asesorado, inputs/resultados personalizados | hereda la **clase más restrictiva** de sus inputs/contexto; en los recorridos de salud/rendimiento P0 se trata como `C4` |
| Sugerencia metodológica personalizada / Referencia profesional adoptada | `C4` cuando refiere a una persona |
| Plantilla BE genérica | `C2 INTERNO` |
| Metadatos de solicitud (actor, vínculo, finalidad, templateVersion, estado) | `C3 PERSONAL/PROFESIONAL` |
| Respuesta estructurada | se clasifica por las categorías efectivamente respondidas; si contiene cualquier C4, el contenedor completo se protege como `C4` para acceso/exportación/logging |
| Evaluación antropométrica `EN_PREPARACION` | `C4` |
| Evento/condición de anulación antropométrica y su motivo de dominio | `C4` |
| Asiento de auditoría de ejecución/request/response/draft/anulación | `C6`, con IDs/metadatos y **sin copiar contenido C4** |

Una clasificación protectora no convierte un dato no sensible en diagnóstico; determina únicamente controles de acceso, logging, cifrado y retención.

---

### 56.3. CAP-MET — autorización de inputs y prevención de inferencias

#### 56.3.1. Regla de acceso a inputs

Para ejecutar un método personalizado, **cada input** debe superar de forma independiente:

```text
identidad
+ rol/verificación
+ Alcance
+ Vínculo ACTIVO
+ B2 vigente
+ finalidad
+ categoría pertinente
+ mínimo detalle suficiente
+ admisibilidad de método (06)
```

La admisibilidad metodológica de 06 **no sustituye** la autorización de 08.

```text
dato existente
≠ dato autorizado
≠ dato pertinente
≠ dato admisible
```

Un profesional con varios Alcances puede usar la unión **solo de las categorías que cada Alcance autoriza para la finalidad de esa ejecución**. No existe herencia cross-scope automática.

#### 56.3.2. Prohibición de canal lateral por cálculo

BE no puede usar un input oculto/no autorizado para producir al profesional un resultado que revele indirectamente su existencia, valor o categoría.

Si una ejecución no puede proceder porque falta un input o porque el actor no puede utilizarlo:

- la respuesta observable hacia el profesional debe ser **neutral**;
- no distingue:
  - `dato inexistente`;
  - `dato existente no autorizado`;
  - `dato existente pero no pertinente`;
- puede informar únicamente que **no existen inputs autorizados/admisibles suficientes para esa ejecución**.

Esta regla extiende la anti-enumeración de §27.8 y el patrón A-1/A-2 de §50.1 a CAP-MET.

#### 56.3.3. Sugerencias y referencias

Una sugerencia personalizada o una referencia adoptada:

- no amplía acceso;
- no mantiene acceso después de revocación/pausa/finalización;
- no permite inspeccionar inputs que el profesional no podía consultar;
- no puede contener un resumen que reintroduzca contenido oculto;
- conserva como C4 solo el mínimo necesario para su finalidad.

#### 56.3.4. Auditoría CAP-MET

Se auditan, sin valores sensibles:

- actor;
- sujeto;
- finalidad;
- método/version;
- categorías de input utilizadas;
- resultado de autorización/admisibilidad;
- ejecución creada/fallida;
- adopción/reemplazo de referencia;
- requestId/fecha.

No se copian:

- valores de inputs;
- resultado numérico sensible;
- texto clínico;
- motivo libre que contenga C4.

---

### 56.4. CAP-DAT — solicitud no equivale a permiso

#### 56.4.1. Creación de solicitud

`UC-P32` solo procede cuando, al momento de crear la solicitud:

- profesional activo/verificado;
- Vínculo ACTIVO;
- Alcance pertinente;
- B2 vigente;
- finalidad explícita;
- categorías solicitadas pertinentes;
- versión de plantilla seleccionable.

Una plantilla puede contener campos potenciales que el profesional **no puede solicitar** en ese Alcance. La plantilla no es una whitelist de autorización.

#### 56.4.2. Respuesta y procedencia

Toda respuesta del asesorado conserva `SELF_REPORTED`.

```text
SELF_REPORTED
≠ medición profesional
≠ observación profesional
≠ diagnóstico
```

Si un valor proviene/reutiliza `UC-P25`:

- se conserva su origen;
- la respuesta sigue siendo un acto distinto;
- no se fusionan historia ni procedencia por igualdad de valor.

#### 56.4.3. Cambio de autorización durante el ciclo

El PDP se evalúa:

1. al crear la solicitud;
2. al exponer la solicitud protegida;
3. al entregar/consultar la respuesta al profesional.

Si antes del envío/consulta el Vínculo queda `PAUSADO`/`FINALIZADO`, B2 se revoca o el Alcance deja de habilitar la finalidad:

- el profesional no recibe contenido;
- la existencia de una respuesta no se revela por un canal lateral;
- la Solicitud no “reactiva” acceso;
- cualquier Respuesta ya registrada permanece bajo la política del titular, no bajo permiso residual del profesional.

Para datos C4, una respuesta nueva destinada exclusivamente a un profesional cuyo contexto ya no es válido **no debe utilizarse para recrear ese encargo**. 09/10 deberán resolver la operación con respuesta neutral y sin pérdida de los derechos del titular.

#### 56.4.4. Perfil propio

La reutilización de perfil no autoriza a ampliar la solicitud:

```text
dato en perfil
≠ categoría autorizada para ese profesional
```

El professional no obtiene información de `UC-P25` por el solo hecho de pedirla.

#### 56.4.5. Auditoría CAP-DAT

Eventos mínimos C6:

- solicitud creada/denegada;
- templateVersion;
- finalidad/Alcance;
- categorías solicitadas;
- respuesta enviada/rectificada;
- consulta profesional permitida/denegada;
- versión B2/matriz usada en la decisión.

Nunca se registran valores de respuesta en C6.

---

### 56.5. ANT-DRAFT — gobierno de la evaluación `EN_PREPARACION`

#### 56.5.1. Acceso

Una Evaluación antropométrica `EN_PREPARACION` es C4.

Puede retomarla únicamente un profesional que **en la operación actual** satisfaga:

- identidad profesional válida;
- capacidad antropométrica habilitada;
- Vínculo ACTIVO;
- B2/categorías pertinentes vigentes;
- finalidad compatible;
- PDP positivo.

La autoría histórica del borrador no concede acceso residual.

```text
PAUSADO
FINALIZADO
B2 revocado
profesional suspendido/rechazado
→ SIN RETOMA
→ SIN LECTURA PROFESIONAL
```

#### 56.5.2. Asesorado y derechos

Que el borrador no aparezca en la superficie normal del asesorado como “evaluación registrada” **no elimina los derechos del titular de §19** sobre datos personales ya persistidos.

Por tanto:

- UX 10 puede ocultarlo de la timeline/evaluación confirmada;
- un procedimiento de acceso/rectificación/supresión del titular debe poder localizarlo según §19;
- la respuesta a derechos debe explicar su condición de trabajo no registrado.

#### 56.5.3. Retención específica — `R-18`

Se agrega:

| ID | Categoría | Finalidad | Inicio | Mientras está activa | Evento de salida | Tratamiento posterior | Backup |
|---|---|---|---|---|---|---|---|
| `R-18` | Evaluación antropométrica `EN_PREPARACION` y residuos provisionales no incorporados | Permitir continuidad de una toma profesional no finalizada | Primera persistencia del borrador | Solo mientras exista finalidad operativa y autorización recuperable | (a) registro final; (b) pérdida definitiva del contexto; (c) inactividad/abandono | (a) lo incorporado a `REGISTRADA` pasa a R-07; residuos no incorporados se suprimen. (b)/(c) bloqueados para producto y suprimidos tras **[PARÁMETRO: plazo operativo corto a fijar antes de datos reales]**, salvo fundamento legal específico | §18 |

Reglas:

- R-18 **no** convierte el draft en historia longitudinal;
- no existe conservación indefinida “por si se retoma”;
- el parámetro debe quedar configurado antes del primer dato real;
- la retención de auditoría del acceso al draft sigue R-09.

---

### 56.6. ANT-VOID — autorización y gobierno de anulación

#### 56.6.1. Actor permitido

`UC-E03 / ANULAR` es una operación profesional sensible.

Requiere, en la operación actual:

- identidad profesional válida;
- capacidad antropométrica habilitada;
- Vínculo ACTIVO con el asesorado;
- B2 vigente para Antropometría/categorías pertinentes;
- finalidad de integridad/corrección de la evaluación;
- acceso al recurso sujeto al PDP.

No se exige identidad entre `actor de anulación` y `autor original` como regla universal del 08. Si son distintos:

- la autoría original se preserva;
- se registra actor efectivo;
- se exige motivo;
- no se reasigna la medición.

El asesorado **no ejecuta directamente** esta operación P0, sin perjuicio de poder solicitar rectificación/supresión por §19.

ADMIN no ejecuta una decisión antropométrica. Break-glass permite soporte excepcional conforme §28, pero **no transforma al ADMIN en actor profesional de UC-E03**.

#### 56.6.2. Motivo y minimización

La anulación exige motivo funcional.

Separación:

```text
registro de dominio C4
→ puede conservar justificación necesaria

auditoría C6
→ solo código/categoría de motivo + referencia
→ nunca copiar texto sensible libre
```

#### 56.6.3. Efectos de acceso

`ANULADA`:

- no borra historia;
- no amplía visibilidad;
- no mantiene lectura profesional tras PAUSADO/FINALIZADO/revocación;
- el titular conserva acceso a sus propios datos/historia conforme §19/§20 y a la política de producto que derive 10;
- otro profesional solo puede verla si una operación actual supera su propio PDP.

La anulación permanece dentro de R-07 mientras la historia de salud sea retenida. El asiento de auditoría sigue R-09.

#### 56.6.4. No reversibilidad

08 adopta la conclusión de dominio validada por contrarrevisión:

```text
ANULADA → VIGENTE
NO EXISTE EN ESTA VERSIÓN
```

Razón: no existe RF/UC de reversión. Permitirla desde 08 sería crear conducta.

Si en el futuro Dirección aprueba reversión:

- requerirá RF/UC y semántica de dominio previa;
- deberá volver a auditarse autorización, historia y copy;
- no se puede implementar como “editar estado”.

---

### 56.7. Retención y sensibilidad de CAP-MET/CAP-DAT

#### 56.7.1. CAP-MET

- Método/version genéricos C2: se conservan mientras sean seleccionables y mientras alguna ejecución histórica retenida los referencie.
- Ejecuciones personalizadas y referencias adoptadas C4: siguen R-07 cuando forman parte de evaluación/objetivo/historia del titular.
- Una versión histórica de método no se elimina si es necesaria para reconstruir una Ejecución retenida.
- Auditoría: R-09.

#### 56.7.2. CAP-DAT

- Plantilla/version genérica C2: se conserva mientras sea seleccionable y mientras alguna Solicitud/Respuesta retenida la referencie.
- Metadatos de Solicitud C3: consumen R-05 en cuanto forman parte de la trazabilidad relacional.
- Respuestas:
  - solo C3 → retención de la categoría personal aplicable;
  - cualquier C4 → R-07;
  - el contenedor mixto se protege como C4.
- Rectificaciones preservan historia conforme al régimen de su categoría.
- Auditoría: R-09.

No se introduce un plazo global nuevo para C4.

---

### 56.8. Riesgos nuevos del parche

| ID | Riesgo | Tratamiento | Estado |
|---|---|---|---|
| `R-08-14` | CAP-MET revela por inferencia que existe un input sensible oculto | respuesta neutral + autorización input-por-input + pruebas anti-enumeración §56.11 | ABIERTO HASTA PRUEBA |
| `R-08-15` | una plantilla/request se usa como bypass de B2/pertinencia | PDP en creación/lectura/respuesta + regla “plantilla ≠ permiso” | ABIERTO HASTA PRUEBA |
| `R-08-16` | reutilizar perfil en formulario borra procedencia | `UC-P25 ≠ UC-P33`, referencia/origen preservados | GESTIONADO POR DISEÑO |
| `R-08-17` | borradores C4 quedan indefinidamente o accesibles post-vínculo | R-18 + corte inmediato + derechos del titular | ABIERTO HASTA FIJAR PARÁMETRO |
| `R-08-18` | anulación se implementa como delete o un ADMIN la usa como decisión profesional | C4 aditivo + C6 audit + actor profesional + break-glass no decisorio | BLOQUEADO POR DISEÑO |

---

### 56.9. Extensión del Ready-for-Real-Data

Las 24 condiciones de §42 permanecen.

Se agregan condiciones **si las capacidades correspondientes están activas con datos reales**:

| # | Condición |
|---:|---|
| 25 | CAP-MET: PDP input-por-input + admisibilidad + respuesta neutral están implementados y sus pruebas positivas/negativas/anti-inferencia están en verde |
| 26 | CAP-DAT: plantilla versionada, request sin bypass de B2, `SELF_REPORTED`, corte post-revocación y no exposición residual están probados |
| 27 | ANT-DRAFT: `EN_PREPARACION` no alimenta historia, corte de retoma funciona, procedimiento de derechos incluye drafts y `R-18` tiene parámetro definido |
| 28 | ANT-VOID: autorización profesional, evento aditivo, auditoría sin C4, dependencia post-anulación y prohibición de delete/reversión implícita están probados |

Ninguna de estas condiciones reduce o sustituye las VJR/VD previas de §42/§52.

---

### 56.10. Obligaciones para BE-LEG-09

09 deberá poder materializar, sin cambiar la política:

#### CAP-MET
- descubrir método/version aplicable;
- ejecutar con actor/contexto derivados del servidor;
- devolver denegaciones neutrales cuando falte acceso a inputs;
- consultar ejecuciones y referencia sin revelar inputs ocultos;
- auditar operaciones sensibles;
- invalidar cualquier decisión/caché de autorización ante revocación.

#### CAP-DAT
- crear request bajo PDP vigente;
- listar/consultar requests propias sin enumeración;
- responder request propia;
- consultar response profesional solo bajo autorización vigente;
- rectificar sin overwrite;
- no aceptar `professionalId` cliente como autoridad.

#### ANT-DRAFT
- guardar/retomar/finalizar con re-evaluación de autorización;
- concurrencia;
- no exponer draft como registrado;
- soportar procesamiento R-18.

#### ANT-VOID
- operación explícita de anulación;
- autorización contextual;
- idempotencia/concurrencia;
- audit obligatoria;
- no delete;
- estado incompatible/repetición con resultado neutral y trazable.

---

### 56.11. Obligaciones de prueba para 11A

Casos mínimos adicionales:

#### CAP-MET
1. profesional autorizado ejecuta método con inputs autorizados/admisibles → permitido;
2. input existe pero no fue autorizado → ejecución denegada;
3. input no existe → resultado observable equivalente al caso 2;
4. input autorizado pero no admisible → no ejecución válida;
5. profesional con NUT no consume dato exclusivo ENT;
6. profesional con ambos Alcances usa solo categorías pertinentes a la finalidad;
7. revocación B2 corta nueva ejecución/consulta de referencia;
8. sugerencia/referencia no filtra input oculto.

#### CAP-DAT
9. request con categorías permitidas → creada;
10. request intenta categoría no pertinente → denegada;
11. plantilla contiene campo más amplio pero B2 no → campo no solicitabile;
12. ampliación de template/categorías requiere nueva B2;
13. response queda `SELF_REPORTED`;
14. valor reutilizado de perfil conserva procedencia;
15. PAUSADO/FINALIZADO/revocado → profesional no consulta response;
16. request ajena/response ajena → denegación anti-enumeración.

#### ANT-DRAFT
17. draft persiste sin aparecer en evolución;
18. profesional pierde autorización → no retoma;
19. titular ejerce derecho de acceso → draft localizable y rotulado como no registrado;
20. expiración R-18 no resucita por backup.

#### ANT-VOID
21. profesional autorizado anula → original permanece, condición efectiva cambia;
22. actor distinto del autor original → autoría original preservada + actor real auditado;
23. ADMIN normal intenta anular → denegado;
24. log de anulación no contiene motivo libre C4;
25. input anulado → derivados no siguen vigentes por inercia;
26. doble anulación/reversión implícita → no crea nuevo efecto;
27. finalización/revocación → sin lectura residual del evento/medición por el profesional.

---

### 56.12. Obligaciones para BE-LEG-10

10 deberá:

- mostrar métodos disponibles sin sugerir que disponibilidad = autorización;
- ante insuficiencia por acceso, usar copy neutral que no revele existencia del dato;
- distinguir sugerencia/ejecución/referencia/decisión;
- formularios muestran profesional, finalidad, alcance, requerido/opcional y procedencia;
- nunca presentar respuesta como medición/diagnóstico;
- explicar que una solicitud no amplía permisos;
- no mostrar draft como evaluación registrada;
- permitir que los derechos del titular alcancen datos en draft aunque no estén en timeline;
- en anulación, mostrar acción destructiva **no**: debe explicitar que preserva historia y afecta derivados;
- no ofrecer “desanular” en esta versión.

---

### 56.13. Trazabilidad para Documento 12

```text
RF-070
↔ UC-I13 / UC-P09 / UC-P14 / UC-I09
↔ REG-06-202…208
↔ 08 §56.3 / §56.7 / §56.9
↔ 09 / 10 / 11A

RF-071
↔ UC-P32 / UC-P33
↔ REG-06-209…213
↔ 08 §56.4 / §56.7 / §56.9
↔ 09 / 10 / 11A

RF-047
↔ UC-P19 V04
↔ REG-06-214…216
↔ 08 §56.5 / R-18
↔ 09 / 10 / 11A

RF-050
↔ UC-E03
↔ REG-06-217…221
↔ 08 §56.6
↔ 09 / 10 / 11A
```

---

### 56.14. Autoverificación del parche

| # | Control | Falla si |
|---:|---|---|
| 1 | `sin_consentimiento_nuevo` | CAP-MET/CAP-DAT crean otro consentimiento |
| 2 | `method_no_auth` | método/template otorga acceso |
| 3 | `input_pdp` | cálculo consume input no autorizado |
| 4 | `anti_inference` | resultado revela existencia de dato oculto |
| 5 | `result_class` | cálculo personalizado se trata como no sensible |
| 6 | `request_pdp` | request sobrevive como permiso |
| 7 | `self_reported` | response se convierte en medición/diagnóstico |
| 8 | `profile_provenance` | valor reutilizado fusiona orígenes |
| 9 | `response_no_residual` | profesional finalizado sigue leyendo |
| 10 | `draft_c4` | draft queda fuera de protección C4 |
| 11 | `draft_no_history` | draft aparece como evaluación registrada |
| 12 | `draft_rights` | derechos del titular no encuentran datos persistidos |
| 13 | `draft_retention` | draft queda indefinidamente |
| 14 | `void_actor` | admin ejecuta anulación profesional |
| 15 | `void_no_delete` | anulación borra original |
| 16 | `void_audit_min` | auditoría copia C4 o no registra actor |
| 17 | `void_no_residual` | profesional conserva lectura post-vínculo |
| 18 | `void_no_reverse` | aparece desanulación sin RF/UC |
| 19 | `gate` | se activa capacidad real sin condición §56.9 |
| 20 | `no_07` | se introduce cambio arquitectónico |

---

### 56.15. Estado de salida

```text
BE-LEG-08 v0.1.5
BORRADOR DE PARCHE TRANSVERSAL — NO APROBADO

BASELINE:
v0.1.4
Q-003/Q-004/Q-005 PRESERVADAS
CAND-08-A…J PRESERVADAS
VJR/VD PRESERVADAS

CAP-MET:
GOBERNADO
SIN CONSENTIMIENTO NUEVO
PDP INPUT-POR-INPUT
ANTI-INFERENCIA

CAP-DAT:
GOBERNADO
REQUEST ≠ PERMISO
SELF_REPORTED
SIN LECTURA RESIDUAL

ANT-DRAFT:
C4
SIN RETOMA POST-AUTORIZACIÓN
R-18
DERECHOS DEL TITULAR PRESERVADOS

ANT-VOID:
OPERACIÓN PROFESIONAL
ANULADA ≠ BORRADA
ADMIN ≠ ACTOR PROFESIONAL
AUDITORÍA C6 SIN CONTENIDO C4
SIN REVERSIÓN IMPLÍCITA

READY-FOR-REAL-DATA:
24 CONDICIONES BASELINE
+ 4 CONDICIONES CONDICIONALES DEL PARCHE

07:
SIN CAMBIO

09/10/11A/12:
PENDIENTES DE PROPAGACIÓN

IMPLEMENTACIÓN:
NO AUTORIZADA

CANONIZACIÓN v0.1.5:
NO AUTORIZADA

GIT:
SIN OPERACIONES

SIGUIENTE:
CONTRARREVISIÓN INDEPENDIENTE
```

---

*Fin del parche transversal BE-LEG-08 v0.1.5.*

