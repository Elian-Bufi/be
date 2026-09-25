# DEUDA_LEGAJO — tensiones entre el legajo y la implementación

> Registro del ejecutor técnico. **No resuelve nada**: cada entrada dice qué dice el documento, por qué no se implementó tal cual y dos opciones concretas. Decide Dirección.
> Mientras no haya decisión, la columna «Provisorio en código» indica qué se hizo para no bloquear el paquete, siempre del lado que no viola una garantía.

| ID | Abierta en | Documento | Tema | Estado |
|---|---|---|---|---|
| DL-001 | WP-01 · 2026-09-16 | 07 §0.2 · ACTA-DIR-034 (borrador) | Autorización de implementación no formalizada | **CERRADA** 2026-09-18 · ACTA-DIR-034 v1.0 |
| DL-002 | WP-01 · 2026-09-16 | 07 §13, §15, §34 | Versiones de runtime y frameworks del 07 vs WP-01 | ABIERTA |
| DL-003 | WP-01 · 2026-09-16 | 06 §5.4.2 · INV-06-22 | Estructura mínima de Identidad BE vs schema mínimo de WP-01 | **CERRADA** 2026-09-19 · WP-02, migración `20260918200000_identidad_y_sesiones` |
| DL-004 | WP-01 · 2026-09-16 | 09 §3.1 vs 07 §13.2/§30 | `/health` fuera del prefijo obligatorio `/api/v1` | ABIERTA |
| DL-005 | WP-01 · 2026-09-16 | 09 §3.2 · 09v7 · 09v8 | Código de error para falla interna inesperada | ABIERTA (hallazgo WP-02) |
| DL-006 | WP-01 · 2026-09-16 | 07 §36 | Pre-deploy `prisma migrate deploy` no disponible en plan gratuito de Render | ABIERTA |
| DL-007 | WP-01 · 2026-09-16 | 07 §34 vs CAND-07-J | Runtime del website: imagen Next standalone vs export estático | ABIERTA |
| DL-008 | WP-01 · 2026-09-18 | 07 §36 | La sincronización del Blueprint despliega sin esperar a la CI | ABIERTA |
| DL-009 | WP-02 · 2026-09-18 | 06 §5.5/§5.12 · 05 UC-P25 · 09v8 | Perfil propio sin campos aprobados | ABIERTA |
| DL-010 | WP-02 · 2026-09-18 | 09v8 ACC-01 · 08 §24.5 | El registro distingue identificador nuevo de existente (201/409) | ABIERTA |
| DL-011 | WP-02 · 2026-09-18 | 06 INV-06-24, REG-06-19 · 08 §16 | Unicidad global del identificador, incluye cuentas cerradas | ABIERTA |
| DL-012 | WP-02 · 2026-09-18 | 07 §43-bis · 08 §26 · 09v8 ACC-02 | Sesión: formato, transporte, TTL y renovación | ABIERTA |
| DL-013 | WP-02 · 2026-09-18 | 08 §24.2 | No hay política de contraseñas en el legajo | ABIERTA |
| DL-014 | WP-02 · 2026-09-18 | 09v8 ACC-02 · 09:230 · 04 RF-006 | Neutralidad del login: tolerancia de tiempo y cuentas no operativas | ABIERTA |
| DL-015 | WP-02 · 2026-09-18 | 08 §24.5, §38 · 09v12 | Rate limiting con umbrales provisionales | ABIERTA |
| DL-016 | WP-02 · 2026-09-18 | 09v12 ACC-P1-03/04 · 06 §5.7.4 | Cierre síncrono; ACC-P1-04; forma del contrato de cierre | ABIERTA |
| DL-017 | WP-02 · 2026-09-18 | 09v12 · 09v7 T14 · 08:487 | Step-up del cierre sin MFA | ABIERTA |
| DL-018 | WP-02 · 2026-09-18 | 11A TEST-AUTH-013 | «El cierre finaliza vínculos» no es demostrable sin vínculos | **CERRADA** (WP-03, CI de main `08cdd08`) |
| DL-019 | WP-02 · 2026-09-18 | 08 R-01/R-02/R-03, §17-18 · 06 REG-06-24 | Supresión del hash al cierre y retención posterior | ABIERTA |
| DL-020 | WP-02 · 2026-09-18 | 06 §5.7.4 · 05 · 09 | Suspensión y restablecimiento sin UC ni operación | ABIERTA |
| DL-021 | WP-02 · 2026-09-18 | 08 §12.2/§12.4 · 06 §5.4.2 | Actos A1/A2 y datos del alta fuera del modelo del 06 | ABIERTA |
| DL-022 | WP-02 · 2026-09-18 | 08 §12.2 · 05 UC-I11 · 09v7 T12 | Canal o superficie sin campo contractual | ABIERTA |
| DL-023 | WP-02 · 2026-09-18 | 08 §24.3, §24.7 · 04 RF-001 | Alta por invitación y declaración de mayoría de edad | ABIERTA |
| DL-024 | WP-02 · 2026-09-18 | 10-B02 · 10-ADD · 10-B01 | Desvíos de copy y de UI | ABIERTA |
| DL-025 | WP-02 · 2026-09-18 | 05:1021 · 10-B01 | Superficie web del asesorado | ABIERTA |
| DL-026 | WP-02 · 2026-09-18 | 09:253-262 · 09v7 T07 · 09v8 | Idempotencia y códigos no definidos | ABIERTA |
| DL-027 | WP-02 · 2026-09-18 | 11A · 12 · 05:14230 | Oráculos de prueba ausentes en 11A y traza de UC-P26 | ABIERTA |
| DL-028 | WP-02 · 2026-09-18 | 08 R-08-05, §42-1 | Textos A1, A2, A3 y consecuencias del cierre: sintéticos | ABIERTA |
| DL-029 | WP-02 · 2026-09-19 | 09v8 ACC-03 · 09v7 T14 | Logout idempotente frente a AuthN SESSION | ABIERTA |
| DL-030 | WP-02 · 2026-09-19 | 07 CAND-07-J C · 08 §12.2, §38 | Detrás del rewrite del website, la API no ve la IP del cliente | **DECIDIDA E IMPLEMENTADA** 2026-09-19 · opción B, desvío fundamentado de 07 CAND-07-J C · verificada en `test` · solo falta que el 07 la incorpore |
| DL-031 | WP-03 · 2026-09-19 | 09v11 §15 · 09:2654-2668 · brief WP-03 | Recurso protegido para demostrar el acceso sin dominios de salud | **CERRADA** 2026-09-24 · opción A · condición de cierre cumplida en la consolidación (PR #70) |
| DL-032 | WP-03 · 2026-09-19 | 04:317 · 06:3183-3191 · 08:601, 08:406 · 09:2625-2639 | Las siete dimensiones del PDP y el lugar de A3 | **DECIDIDA** 2026-09-19 · Dirección aceptó el provisorio (opción A) |
| DL-033 | WP-03 · 2026-09-19 | 06:3105-3111 · 04:342, 04:345 · 05:3644 · 09v8:1395-1494 · CONV-06-03 | Máquinas del §7: actor habilitado, motivo y eventos | **DECIDIDA** 2026-09-19 · Dirección aceptó el provisorio (opción A) |
| DL-034 | WP-03 · 2026-09-19 | 06:3014, 06:3091-3093 · 09v8:1267-1270, 1398 | `relationshipId` del 09 frente al Vínculo multialcance del 06 | **DECIDIDA** 2026-09-19 · Dirección aceptó el provisorio (opción A) |
| DL-035 | WP-03 · 2026-09-19 | 09v8:1127-1130 · 10-B04:188 · RF-051 | Cómo identifica el profesional al asesorado | ABIERTA |
| DL-036 | WP-03 · 2026-09-19 | 06 §6.8 · REG-06-33 · 09v8 PRO-09…13 · 08:887 | Verificación y habilitación mínimas sin operación viable | ABIERTA |
| DL-037 | WP-03 · 2026-09-19 | 06:3035-3040 · REG-06-49 · 09v8:1165-1176, 1960 · 09:853 | Solicitud: caducidad sin plazo, invalidación y respuesta al duplicado | ABIERTA |
| DL-038 | WP-03 · 2026-09-19 | 06:3170-3175 · REG-06-50 · 09v8:1570-1660 · 09:2437-2519 | B2: nueva versión y reotorgamiento sin contrato | ABIERTA |
| DL-039 | WP-03 · 2026-09-19 | 06:251, 06:262 · 09v8:1518-1562, 1962 · 08:307, 08:368, 08:374 | Finalidad y categorías pertinentes sin catálogo | **SIMPLIFICACIÓN DECLARADA** 2026-09-19 · consentimiento por alcance y finalidad; categorías especificadas y no implementadas |
| DL-040 | WP-03 · 2026-09-19 | 09v8:161-170, 1523-1526 · 11A:196 · DL-009 | Nombre visible de las partes sin campos de perfil aprobados | ABIERTA |
| DL-041 | WP-03 · 2026-09-19 | 10-B01:645-663, 1019-1031, 1310-1319 · brief WP-03 | El profesional sin Cartera | ABIERTA |
| DL-042 | WP-03 · 2026-09-19 | DV-05 (DV05.md:1116-1133) · brief WP-03 | Casos adversariales de DV-05 que dependen de dominios | **ASIGNADA**: 8 y 7 (variante nutricional) **ejecutables desde WP-04**; 6, 10 y 7 (mediciones) en WP-05, antropometría |
| DL-043 | WP-03 · 2026-09-19 | 09v8:1161-1163, 1208-1220, 1309-1311, 1389, 1447-1490, 1764-1778 | Contratos de REL con forma no definida en el 09 | ABIERTA |
| DL-044 | WP-03 · 2026-09-19 | 08 §13 · 08 §14.1 · 09v8:1385-1391 | Qué ve el profesional de un vínculo finalizado | **DECIDIDA** 2026-09-19 · Dirección aceptó el provisorio (opción B) |
| DL-045 | WP-03 · 2026-09-19 | 05:2840-2845 (UC-P04 V02) · 06 §7.3.2 · INV-06-52 | Solicitud iniciada por el asesorado: el profesional no acepta | **DECIDIDA** 2026-09-19 · Dirección aceptó el provisorio (opción A) |
| DL-046 | WP-04 · 2026-09-19 | 09v9:201-205, 513-562 · 06:4136-4137 (T-06-28/29) | `planId` del 09: Plan o Versión de plan | ABIERTA |
| DL-047 | WP-04 · 2026-09-19 | 05:5869-5873 (UC-P10 V07) · B05:1325-1339 (CAND-NUT-D) · 09v9:476-499 | Versión sucesora fuera de una revisión sin operación en el 09 | ABIERTA |
| DL-048 | WP-04 · 2026-09-19 | 04:360-367 · 06:4183-4201, 4421-4429 · 09v9:158, 345 · B05:229 | Contenido de la evaluación nutricional sin campos definidos | ABIERTA |
| DL-049 | WP-04 · 2026-09-19 | 06:4368-4394, 4447, 4566 · CONS:564-628 · 09v9:680, 1135 · B05:768-782 | Ingesta prescripta: ocurrencia planificada, clave de unicidad y día tipo en «Hoy» | ABIERTA |
| DL-050 | WP-04 · 2026-09-19 | 09v9:762 · CONS:641-672 · 05:719 (UC-E02) | Corregir una ingesta prescripta: sin operación ni UC | ABIERTA |
| DL-051 | WP-04 · 2026-09-19 | 06:3667, 3751-3769, 3961 · 04:681-686 (RF-066 P1) · 05:6053 | Capacidad sin actor que la configure | ABIERTA |
| DL-052 | WP-04 · 2026-09-19 | 06:4405-4411, 5940-5949 · 05:7556, 7564, 7595 · 09v9:925, 938 | Efectos de aplicar AJUSTAR, SUSTITUIR y CAMBIAR_OBJETIVO | ABIERTA |
| DL-053 | WP-04 · 2026-09-19 | 04:446, 04:1141 · 11A:213 · 06:3504, 3612-3619, 7714 | Q-007: abierta en el 04 y el 11A, resuelta en el 06 | ABIERTA |
| DL-054 | WP-04 · 2026-09-19 | 05:7117, 7075-7094 · 06:5967-5982 · brief WP-04 | Pendiente de revisión y timeline sin Cartera | ABIERTA |
| DL-055 | WP-04 · 2026-09-19 | 09v9:158, 175-179, 601-644, 671, 804-806, 862 · CONS:655 | Contratos NUT con forma no definida en el 09 | ABIERTA |
| DL-056 | WP-04 · 2026-09-19 | 04:378-385 (RF-028) · 05:5777, 5921 · brief WP-04 | RF-028 (Open Food Facts), P0 de compromiso académico, sin paquete asignado | **DECIDIDA** 2026-09-19 · opción A: paquete de integraciones posterior a WP-04 |
| DL-057 | WP-04 · 2026-09-20 | 08:145, 08:197-198, 08:215 · 06:4274-4282 (REG-06-102) · 04:463 (RF-025) | Datos nutricionales de otro profesional del mismo alcance | ABIERTA |
| DL-058 | WP-05 · 2026-09-20 | 06:8941-8986 · 04:6, 04:17 · 08:1703-1706 · 10-B10-07:10-12 | El núcleo operable de antropometría vive en material declarado «NO APROBADO» | **DECIDIDA** 2026-09-20 · opción A, por delegación de Dirección en el ejecutor |
| DL-059 | WP-05 · 2026-09-20 | DV-05:1127 · 05:10879-10881 · 09v16:1959-1974 · 11A:581 | Qué responde la segunda anulación de la misma medición | **DECIDIDA** 2026-09-20 · opción A, por delegación de Dirección en el ejecutor |
| DL-060 | WP-05 · 2026-09-20 | 08:200 · 08:304 · 08:603 · 08:1335 | Sin fila de pertinencia para antropometría, y «ausencia de fila: Deny» | **DECIDIDA** 2026-09-20 · opción A, por delegación de Dirección en el ejecutor |
| DL-061 | WP-05 · 2026-09-20 | 09v11:272 · 09v11:202-216 · 09v16 (grep `frmv_`: 0) | `formulaVersionId` obligatorio en el derivado y sin operación que lo descubra | **DECIDIDA** 2026-09-20 · opción A · la regla versionada del método cumple el rol |
| DL-062 | WP-05 · 2026-09-20 | 09v11:309-332 · 09v16:1980-2000 · 06:6507 | `preparationReference` obligatorio en la importación, sin entidad ni API | **DECIDIDA** 2026-09-20 · opción A · el flujo va al paquete de integraciones |
| DL-063 | WP-05 · 2026-09-20 | 08:1368, 08:1374, 08:1482, 08:1497 (R-18) | El borrador antropométrico no tiene plazo de expiración declarado | **DECIDIDA** 2026-09-20 · opción A · el parámetro sigue pendiente de fijar antes del primer dato real |
| DL-064 | WP-05 · 2026-09-20 | 06:6350-6359 · 06:6513 · 09v11:664-706 · 10-B10-07:1051-1062 | La «evaluación de compatibilidad» es obligatoria y no está modelada como objeto | **DECIDIDA** 2026-09-20 · opción A · metadato calculado por tramo |
| DL-065 | WP-05 · 2026-09-20 | 11A:573-587 · 11A:155-169 · DV-05:1144 | Siete de los once TEST-ANT son solo un título de una línea | **DECIDIDA** 2026-09-20 · opción A · se escriben los siete oráculos |
| DL-066 | WP-05 · 2026-09-20 | DV-05:1131 · 08:1330-1341 · 09v16:1764-1775 | El adversarial 10 no tiene test que pruebe el borrador **de otro profesional** | **DECIDIDA** 2026-09-20 · opción A · oráculo derivado TEST-ANT-012 |
| DL-067 | WP-05 · 2026-09-20 | DV-05:1128 · 11A:540, 584, 625 · 06:6388-6398 | El adversarial 7 de mediciones no tiene ID de test asignado | **DECIDIDA** 2026-09-20 · opción A · TEST-ANT-009 y TEST-ANT-010 |
| DL-068 | WP-05 · 2026-09-20 | 08:200, 08:1332, 08:1385, 08:1525 · 09v11:388-400 | Nadie define quién autoriza **crear** y **registrar** la evaluación | **DECIDIDA** 2026-09-20 · opción A · misma lista que la retoma del borrador |
| DL-069 | WP-05 · 2026-09-20 | 09v11:534-538, 563-569, 726-748 | Objetos `{}` vacíos en los contratos de lectura de ANT-03, ANT-04 y ANT-06 | **DECIDIDA** 2026-09-20 · opción A · forma mínima definida y publicada |
| DL-070 | WP-05 · 2026-09-20 | 09v11:713-757 · 04:583 | La evolución devuelve un bloque por métrica y el 09 declara una métrica por respuesta | **DECIDIDA** 2026-09-20 · opción A · se mantiene el array de métricas |
| DL-071 | WP-05 · 2026-09-20 | 09v11:592-605, 664 | ANT-05 no acepta el lote de correcciones ni los metadatos reconstruibles que el 09 admite | **DECIDIDA** 2026-09-20 · opción A · de a una; el lote cuando haya más de un tipo |
| DL-072 | WP-05 · 2026-09-20 | 09v11:336-339 | ANT-01 filtra por `kind` y el 09 declara `status` | **DECIDIDA** 2026-09-20 · opción A · sumar `status`, conservar `kind` (PENDIENTE de implementar) |
| DL-073 | WP-05 · 2026-09-20 | 10-B10-07 · `direccion/UI-ANTROPOMETRIA.md` | El 10 declara la carga en formulario y Dirección pide la carga sobre la figura | **CERRADA** 2026-09-24 · opción A, en el tramo D de `docs/paquetes/WP-IDENTIDAD-VISUAL.md` |
| DL-074 | WP-06 · 2026-09-21 | 05:109-113 · 05:9969 · B10-06:8-10 | El núcleo operable de entrenamiento vive en material no aprobado | **DECIDIDA** 2026-09-21 · opción A, como DL-058 |
| DL-075 | WP-06 · 2026-09-21 | 11A:562-571 · 11A:151-169 · DV-05:1137-1148 | Los seis TEST-TRN son títulos de una línea, y entrenamiento no figura en la matriz de DV-05 | **DECIDIDA** 2026-09-21 · opción A · se escriben los seis oráculos |
| DL-076 | WP-06 · 2026-09-21 | 05:9174 · 05:9318-9319 · 08:421 | Quién puede corregir una ejecución de entrenamiento | ABIERTA |
| DL-077 | WP-06 · 2026-09-21 | 06:5225 · 06:5235 | «Ocurrencia planificada» nunca se define estructuralmente | ABIERTA |
| DL-078 | WP-06 · 2026-09-21 | 09v10:924 · 09v10:886 · 09v10:188-189, 915 | No hay operación para llegar a una ocurrencia que no sea la de hoy | **DECIDIDA** 2026-09-21 · opción A · se suma la operación |
| DL-079 | WP-06 · 2026-09-21 | 09v10:1053, 1089 · 09v10:888 | `prescriptionId` es obligatorio al registrar ejecución y no se puede descubrir | ABIERTA |
| DL-080 | WP-06 · 2026-09-21 | 09v10:549, 612, 328, 330, 1092, 1095, 1244, 1323, 406 | Once objetos `{}` en requests de escritura de entrenamiento | ABIERTA |
| DL-081 | WP-06 · 2026-09-21 | 06:5614-5632 · 06:80, 4103 · 09v12:326-332 | Las 17 zonas musculares no tienen operación de descubrimiento, y DEC-047 no está en el repositorio | ABIERTA |
| DL-082 | WP-06 · 2026-09-21 | 06:4651-4663 · 06:4958-4965 · 06:226 | No existe una regla equivalente a REG-06-125 para entrenamiento | ABIERTA |
| DL-083 | WP-06 · 2026-09-21 | 08:238-246 · 08:304 · 08:291-293 | La matriz de pertinencia del 08 §11-bis no está instanciada para ENTRENAMIENTO | ABIERTA |
| DL-084 | WP-06 · 2026-09-21 | DV-05:1128-1129 · DL-042 | Las variantes de entrenamiento de los adversariales 7 y 8 no tienen ID de test y nunca se ejecutaron | ABIERTA |
| DL-085 | WP-06 · 2026-09-21 | B10-06:46, 773-776 · B10-10:53, 457-461 | Tres vocabularios para la misma distinción entre lo planificado y lo ejecutado | ABIERTA |
| DL-086 | WP-06 · 2026-09-21 | 04:482, 378 · 04:1144 · 04:1130 · DL-056 | wger, Open Food Facts y el compromiso de dos APIs externas | **DECIDIDA** 2026-09-21 · opción A — **sin ejecutar**: wger quedó en WP-08, fuera del rango literal de ACTA-DIR-034 y de la entrega (2026-09-22); el compromiso está en cero (ver actualización del 2026-09-24) |
| DL-087 | WP-06 · 2026-09-21 | 04:511 · 04:681-689 · DL-051 | RF-041 es P0 y su criterio de aceptación depende de RF-066, que es P1 | ABIERTA |
| DL-088 | WP-06 · 2026-09-21 | 09v10 completo · DL-080 | Las formas que el contrato de entrenamiento no fija, decididas al escribirlo | ABIERTA |
| DL-089 | WP-06 · 2026-09-21 | 08:199 · 08:58 · 05:8944 | Revocado el consentimiento, el asesorado deja de ver su propia historia de entrenamiento | **CERRADA** 2026-09-24 · opción A (PR #67) |
| DL-090 | WP-06 · 2026-09-21 | 04:266-275 · B10-06:149-177 · adenda B10 v0.5:1290-1310 | RF-071 es P0 y ningún paquete lo tenía | **CERRADA** 2026-09-22 · WP-07 (PRs #58 a #65) |
| DL-091 | WP-06 · 2026-09-21 | B10-06:1145-1148 · B10-10:36, 164-165, 376 | Cuatro patrones de pantalla corregidos en entrenamiento y no en nutrición ni antropometría | **CERRADA** 2026-09-24 · opción A (PRs #66, #68, #69) |
| DL-092 | WP-07 · 2026-09-21 | 04:1176, 1297-1313 · 05 · 06 §20 · 08 §56 · 09 v0.16.1 · 10 Adenda v0.5 | El núcleo operable de RF-071 vive en seis documentos «NO APROBADO» | **DECIDIDA** 2026-09-21 · opción A |
| DL-093 | WP-07 · 2026-09-21 | 06:8524-8529 (REG-06-210) · 09:1610-1618 | La Solicitud de formulario queda con dos estados, sin cancelar ni rechazar | **DECIDIDA** 2026-09-21 |
| DL-094 | WP-07 · 2026-09-21 | 11A:604-610 · 11A:194, 348-349 | Los siete TEST-FRM eran títulos de una línea | **CERRADA** 2026-09-22 · escritos en `docs/paquetes/WP-07-ORACULOS.md` |
| DL-095 | WP-07 · 2026-09-22 | 09v16.1 §22.1-§22.8 · 08 §11-bis | Contratos de FRM con forma no definida en el 09 | ABIERTA |
| DL-096 | Consolidación · 2026-09-24 | 08:199 · 08:58 · DL-089 · 09v10 TRN-08/09/19 | La APK no muestra la historia de entrenamiento que DL-089 le garantiza al asesorado | ABIERTA |
| DL-097 | WP-08 · 2026-09-24 | 09v12 §5-§7 (09v12:184-188, 360-364, 369, 390) | Las formas de la importación controlada que el 09 no fija | ABIERTA (hallada al implementar) |
| DL-098 | WP-08 · 2026-09-24 | 09v12:190 · B10-05 §19 · B10-06 §22 | La búsqueda por texto en los proveedores no tiene contrato | ABIERTA |
| DL-099 | WP-08 · 2026-09-24 | 04 RF-060 (04:701-708) · 08 licencias | La procedencia externa llega hasta la elección, no hasta el ítem del plan | ABIERTA (hallada en la revisión de calidad) |

---

## DL-001 — Autorización de implementación no formalizada

**Qué dice el legajo.** 07 §0.2: «Autorización de implementación — **NO OTORGADA** por este documento; requiere acto separado». `actas/BORRADOR_ACTA_DIR_034_v0.1.1_GATE_IMPLEMENTACION_NO_FIRMADA_2026-09-09.md`: «Estado: `NO FIRMADA · NO AUTORIZA IMPLEMENTACIÓN`».

**Qué pasó.** WP-01 se ejecutó por orden directa de Dirección del 2026-09-16 (decisión de abandonar `be-health` y arrancar limpio). Además, el paquete WP-01 menciona `ACTA-DIR-001 … 035`, pero la entrega contiene solo `021…033` y el borrador `034`.

**Por qué importa.** Un tribunal puede preguntar con qué acto se autorizó escribir código si el propio 07 dice que no estaba otorgado.

**Opciones.**
- **A.** Firmar ACTA-DIR-034 (o emitir ACTA-DIR-035) que autorice la implementación y deje constancia de WP-01 como primer paquete, con referencia a este registro.
- **B.** Emitir un acta acotada a infraestructura sin datos reales (WP-01) y reservar el gate 034 para el primer paquete con lógica de negocio.

**Provisorio en código.** Ninguno. WP-01 no contiene lógica de negocio ni datos.

**Resolución — CERRADA el 2026-09-18.** Dirección firmó `actas/ACTA_DIR_034_v1.0_GATE_IMPLEMENTACION_FIRMADA_2026-09-18.md`, una variante de la opción A:
- autoriza la implementación en el alcance WP-01 a WP-07, cada paquete con sus IDs fijados antes del primer commit;
- **ratifica** WP-01, que se ejecutó antes de la firma por orden directa de Dirección;
- el borrador v0.1.1 se conserva sin cambios porque integra el manifiesto.

La observación sobre las actas 001–020 no incluidas en la entrega queda como nota de inventario (ACTA-DIR-034 §14, Nota 3) y no bloquea.

---

## DL-002 — Versiones del 07 vs versiones decididas en WP-01

**Qué dice el legajo.** 07 §13.1 y §15 describen Node 20, NestJS 10.4.22, Prisma 5.22.0, Next 15.5.19, TS 5.9.3. 07 §34: «runtime Node 20 slim». 07 §21: PostgreSQL «versión objetivo: la mayor estable soportada por la plataforma» (Render: 18).

**Qué decidió WP-01.** Node 22 LTS, NestJS 11, Prisma 6, Next ≥ 15.5.24 (Next 15.5.19 tiene dos RCE críticas: `GHSA-p293-qw3h-jr36`, `GHSA-2xp9-vwfh-vxw4`), PostgreSQL 16 alineado con el harness.

**Opciones.**
- **A.** Refinar 07 §15/§21/§34 con las versiones de `DECISIONES_TECNICAS.md` (el 07 pasa a reflejar lo desplegado).
- **B.** Declarar 07 §13/§15 como AS-IS histórico de `be-health` y `DECISIONES_TECNICAS.md` como fuente de versiones vigentes, con referencia cruzada.

**Provisorio en código.** Versiones de WP-01 (ver `DECISIONES_TECNICAS.md`).

---

## DL-003 — Estructura mínima de `Identidad BE` vs schema mínimo de WP-01

**Qué dice el legajo.** 06 §5.4.2, estructura conceptual mínima de Identidad BE: identificador de dominio · **referencia a Perfil propio (exactamente una después de un registro exitoso)** · referencias a métodos de acceso · estado operativo de cuenta · **autoría de creación** · momento de ocurrencia · momento de registro · **procedencia**. `INV-06-22`: «Una Identidad BE registrada exitosamente posee un único Perfil propio» — se viola cuando existen cero.

**Qué pidió WP-01.** Solo `Identidad` con estado (`T-06-02`) y par temporal (`T-06-24`); ningún modelo más.

**Por qué no se puede tal cual.** Con solo `Identidad`, cualquier fila creada (incluido un seed) sería una identidad sin Perfil propio, autoría ni procedencia: viola `INV-06-22` y deja incompleto 06 §5.4.2.

**Opciones.**
- **A.** Mantener el schema mínimo de WP-01 y **no crear filas de Identidad** hasta el paquete de M-01 (UC-P25), que incorpora Perfil propio, Método de acceso, autoría y Procedencia (`T-06-23`) en una sola migración aditiva.
- **B.** Ampliar WP-01 con `PerfilPropio` y una estructura mínima de `Procedencia`, para que el seed sintético pueda crear identidades completas.

**Provisorio en código.** Opción A: schema mínimo, **sin seed de Identidad**. La base no está vacía: contiene `_prisma_migrations`.

**Cierre (2026-09-19, WP-02).** La migración aditiva `20260918200000_identidad_y_sesiones` completa la estructura del 06 §5.4.2: Perfil propio (1:1, con INV-06-22 verificado por un constraint trigger diferido), métodos de acceso, autoría de creación y procedencia. La única forma de crear una Identidad es el registro (UC-P25), que crea todo en una transacción. Pruebas: `schema.int-spec.ts` (INV-06-22) y `registro.int-spec.ts` (TEST-UC-P25).

---

## DL-004 — `/health` fuera del prefijo obligatorio `/api/v1`

**Qué dice el legajo.** 09 §3.1: «prefijo obligatorio `/api/v1`». 09 no contrata ninguna operación de salud. 07 §13.2 documenta `api/v1` con `exclude health`, y 07 §30 define `/health`, `/health/live`, `/health/ready`.

**Opciones.**
- **A.** Agregar al 09 una excepción explícita para señales de infraestructura (`/health*`), con su forma de respuesta (la implementada: `{ data: { estado, ambiente, version, dependencias } }` y 503 `DB_UNAVAILABLE` con ErrorEnvelope).
- **B.** Mover las señales a `/api/v1/health*` y ajustar `healthCheckPath` en `render.yaml`.

**Provisorio en código.** Según 07: fuera del prefijo. Cubierto por prueba (`health no queda bajo /api/v1`).

---

## DL-005 — Sin código de error para falla interna inesperada

**Qué dice el legajo.** 09 §3.2 enumera 401, 403, 404, 409, 422, 429 y 503. No hay código para un error interno no previsto (500).

**Opciones.**
- **A.** Agregar `500 INTERNAL_ERROR` al catálogo del 09, con `message` genérico y sin `details`.
- **B.** Declarar que toda falla no prevista se expone como `503 DEPENDENCY_UNAVAILABLE`.

**Provisorio en código.** WP-01 no tiene operaciones que puedan producirlo; se implementó solo el ErrorEnvelope para `404 RESOURCE_NOT_FOUND` y `503 DB_UNAVAILABLE`. No se inventó un código.

**Hallazgo (WP-02, 2026-09-18).** El código sí existe en el legajo, aunque no en el consolidado: el contrato transversal lo lista como «500 | `INTERNAL_ERROR`» (09v7:185), y la semántica «500 | falla no clasificada» está en 09v7:207 y 09v8:1837. Lo que falta es su incorporación al §3.2 consolidado del 09. **Provisorio en WP-02:** `500 INTERNAL_ERROR` con `message` genérico y sin `details`, citando 09v7:185. **Condición de cierre:** el 09 consolida el código en §3.2.

---

## DL-006 — Pre-deploy de migraciones en Render plan gratuito

**Qué dice el legajo.** 07 §36: fases «build → **pre-deploy: `prisma migrate deploy`** (si falla, el deploy aborta y la versión anterior sigue) → readiness gate → switch».

**Por qué no se puede tal cual.** Documentación de Render (consultada 2026-09-16): «The pre-deploy command is available for paid web services». El ambiente `test` usa plan gratuito.

**Qué se implementó.** El contenedor ejecuta `prisma migrate deploy` como primer paso del arranque y solo después levanta la API. Si la migración falla, el proceso termina, `/health/ready` nunca responde 200 y Render cancela el deploy conservando la versión anterior («If any new instance fails to become healthy during this process, Render cancels the entire deploy»). Además `/health/ready` verifica que las migraciones embebidas estén aplicadas.

**Opciones.**
- **A.** Aceptar en 07 §36 la equivalencia «migración en arranque + readiness gate» para planes sin pre-deploy.
- **B.** Pasar la API a instancia paga (Starter) y usar `preDeployCommand`.

---

## DL-007 — Runtime del website

**Qué dice el legajo.** 07 §34: «imagen OCI del Web (Dockerfile multi-stage con `next build` `output: 'standalone'`)». 07 CAND-07-J (aprobada condicionada): preferencia **C → A → B**, C = export estático + ruteo por path de la plataforma.

**Qué se verificó.** Render Static Site admite rewrite de path a URL externa y cabeceras propias (docs Render, 2026-09-16). La app compila con `output: 'export'`.

**Opciones.**
- **A.** Actualizar 07 §34 para reflejar la opción C (sin imagen del web).
- **B.** Volver a la opción A (runtime Next en contenedor) cuando aparezca una necesidad de SSR.

**Provisorio en código.** Opción C: Render Static Site con rewrite `/api/*` hacia la API.

**Nota (2026-09-19).** El export estático se mantiene, pero la topología pasa de la opción C a la **B de CAND-07-J** («export estático + CORS») por decisión de Dirección (DL-030): el website llama a la API directo para que la API vea la IP real (08 §12.2). Con eso, la opción A de esta entrada queda así: actualizar 07 §34 para reflejar la opción B, sin imagen del web y con CORS.

---

## DL-008 — La sincronización del Blueprint despliega sin esperar a la CI

**Qué dice el legajo.** 07 §36: «`test` ← auto-deploy "After CI Checks Pass" sobre main». La CI tiene que pasar antes de que un artefacto llegue a `test`.

**Qué se observó (2026-09-18).** Con el push de `eaf785c` (solo cambiaba `CORS_ALLOWED_ORIGINS` en `render.yaml`), el Blueprint sincronizó la variable y Render reconstruyó `be-api`: `/health` informa `construidoEn: 17:25:44Z`, mientras la CI de ese commit corrió de 17:25:22Z a 17:27:04Z. El deploy que dispara el Blueprint no respeta `autoDeployTrigger: checksPass`, que solo gobierna los deploys por código. Esta vez la CI terminó en verde, así que no hubo daño.

**Por qué importa.** Un cambio en `render.yaml` junto con código roto puede llegar a `test` antes de que la CI lo rechace. La API igual tiene red: si la migración o el arranque fallan, el readiness gate cancela el deploy. Pero una regresión funcional pasaría.

**Opciones.**
- **A.** Aceptar la excepción en 07 §36: los cambios de configuración de plataforma se aplican al integrarse, y el readiness gate es la única barrera. Todo cambio a `render.yaml` va en un PR propio, sin código.
- **B.** Desactivar la sincronización automática del Blueprint y aplicarla a mano («Manual Sync») solo después de que la CI de ese commit esté en verde.

**Provisorio.** Ninguno en código. Hasta la decisión, los cambios de `render.yaml` se integran en commits sin cambios de código.

---

## Entradas abiertas en WP-02 (2026-09-18)

> Formato ampliado desde WP-02, según el 12:402-405: prioridad, condición de cierre y evidencia. Cada entrada cita `archivo:línea` con abreviaturas (09v7 = 09_AUX v0.7, 09v8 = 09_AUX v0.8, 09v12 = 09_AUX v0.12, 10-B02 / 10-ADD / 10-B10 = documentos de UX). Definición del paquete: `docs/paquetes/WP-02.md`.

## DL-009 — Perfil propio sin campos aprobados

**Prioridad:** media · **Documento:** 06 §5.5 y §5.12 · 05 UC-P25 · 09v8 ACC-01/06 · **Estado:** ABIERTA

**Qué dice el legajo.**
- UC-P25 exige que «el perfil propio queda asociado» (05:14047-14053).
- ACC-01 «crea una identidad BE única + perfil propio» (09v8:264).
- INV-06-22 exige exactamente un Perfil propio (06:2435).
- Ningún documento aprueba sus campos: «B-01 no inventa datos personales que 04/05 no aprobaron» (06:2034-2046). 05 dice «sin fijar aquí su estructura» (05:14045), y 09v8 marca los «campos exactos del profile común» como deliberadamente no cerrados (09v8:1955).
- §5.12 fija «Identidad BE — Versión de Perfil propio 1 : 1..N» (06:2397), mientras §5.5.2 dice «exactamente una cuando existe contenido confirmado» (06:2042).

**Por qué no tal cual.** Sin campos no hay contenido que versionar. Crear una versión vacía para cumplir §5.12 sería inventar contenido.

**Opciones.**
- **A.** Perfil propio 1:1 creado en la transacción del alta, sin versión mientras no haya campos aprobados. ACC-06 queda diferida.
- **B.** Aprobar un campo mínimo, por ejemplo el nombre visible (C3), emitir la Versión 1 en el alta y habilitar ACC-06.

**Provisorio en código.** A. `PerfilPropio` existe con `versionEfectivaId = null`; INV-06-22 se cumple y DL-003 se cierra.

**Condición de cierre.** Dirección aprueba los campos del perfil propio, o declara que el perfil no tiene contenido en el MVP y corrige §5.12.

## DL-010 — El registro distingue identificador nuevo de existente (201 frente a 409)

**Prioridad:** alta · **Documento:** 09v8 ACC-01 · 08 §24.5 · 04 RNF-SEC-003 · **Estado:** ABIERTA

**Qué dice el legajo.**
- ACC-01 responde 201 con `identityId` o `409 REGISTRATION_NOT_AVAILABLE`, «deliberadamente neutral» (09v8:271-295).
- También exige que «no se filtra públicamente que una cuenta concreta ya exista» (09v8:269).
- El 08 lo extiende a todos los flujos: «sin revelar existencia de cuentas en ningún flujo» (08:570).

**Por qué no tal cual.** Aunque el mensaje sea neutral, la diferencia 201/409 es un oráculo de existencia. Una salida sin oráculo exige un canal fuera de banda (un correo de confirmación), y el correo no tiene RF activo ni se presupone (08:569).

**Opciones.**
- **A.** Usar el contrato literal: 409 con un mensaje único para cualquier causa, trabajo de hash equivalente en las dos ramas y rate limiting por IP.
- **B.** Responder de forma uniforme sin crear nada y confirmar el alta por un canal fuera de banda. Contradice el 201 de ACC-01 y requiere un RF de canal.

**Provisorio en código.** A.

**Condición de cierre.** Dirección acepta el riesgo residual o aprueba un canal de confirmación.

## DL-011 — Unicidad del identificador: global, incluye cuentas cerradas

**Prioridad:** media · **Documento:** 06 INV-06-24, REG-06-19, §5.7.2 · 08 §16 · **Estado:** ABIERTA

**Qué dice el legajo.**
- CERRADA es terminal y sin reapertura (06:2129; 08:436).
- REG-06-19 manda «conservar la identidad existente» (06:1986-1995).
- Ningún documento decide si el correo de una cuenta cerrada vuelve a estar disponible.

**Opciones.**
- **A.** Índice único global sobre `(tipo, referencia)`. Quien cerró su cuenta no puede volver a registrarse con el mismo correo y recibe el mismo 409 neutral.
- **B.** Índice parcial que excluye las cuentas CERRADAS. Libera el correo, a costa de crear una identidad paralela para la misma persona.

**Provisorio en código.** A: índice `metodo_de_acceso_tipo_referencia_key`.

**Condición de cierre.** El 08 decide la reversibilidad y la liberación del identificador tras el cierre.

## DL-012 — Sesión: formato, transporte, TTL y renovación

**Prioridad:** media · **Documento:** 07 §43-bis, 07:537, 07:786-789 · 08 §26 · 09v7 T01 · 09v8 ACC-02 · **Estado:** ABIERTA

**Qué dice el legajo.**
- Las sesiones son revocables server-side (08:589).
- El 07 aprueba la opción «A+B»: tabla de sesiones más `tokenVersion` (07:1785-1795).
- La revocación «no dependa del TTL del JWT» (07:1799).
- El acceso dura ≤24 h sin renovación (08:590, PROPUESTA BE).
- JWT en memoria en el MVP, «hasta refresh rotativo» (07:789).
- El transporte, cookie o Bearer, queda abierto (09v8:336, 1957).
- ACC-02 devuelve `renewable: true`, pero no existe ninguna operación de renovación.

**Opciones.**
- **A.** JWT corto con la fila de sesión verificada en cada request, Bearer en memoria en website y APK, sin renovación. Recargar el website o reiniciar el APK obliga a volver a iniciar sesión (07:537). No hay superficie de CSRF.
- **B.** Cookie httpOnly en el website y SecureStore en el APK, con refresh rotativo (T-10 del 07).

**Provisorio en código.** A, con TTL de 12 h y `renewable: false`.

**Condición de cierre.** Se implementa el refresh rotativo (T-10) o Dirección ratifica A para el MVP.

## DL-013 — No hay política de contraseñas en el legajo

**Prioridad:** media · **Documento:** 08 §24.2 · 09v8:1953-1964 · **Estado:** ABIERTA

**Qué dice el legajo.** Solo fija el hash: «bcrypt costo 10 — se conserva como mínimo» (08:567). No fija longitud, composición ni listas de contraseñas prohibidas.

**Opciones.**
- **A.** Mínimo técnico provisional: 12 caracteres (OWASP ASVS 2.1.1) y máximo 72 bytes (límite de bcrypt), sin reglas de composición.
- **B.** Que el 08 fije la política y se la adopte.

**Provisorio en código.** A, validado igual en `@be/domain` para la API y los dos clientes. Si no cumple, `400 INVALID_REQUEST` con `issues`.

**Condición de cierre.** El 08 fija la política.

## DL-014 — Neutralidad del login: sin tolerancia de tiempo normada; cuentas no operativas

**Prioridad:** alta · **Documento:** 09v8:361-373, 1849 · 09:230 · 04 RF-006 · 11A:522 · **Estado:** ABIERTA

**Qué dice el legajo.**
- Identificador inexistente y contraseña incorrecta deben ser «observacionalmente neutral» (09v8:1849).
- Las diferencias de timing se admiten «más allá de tolerancias operativas inevitables», sin un umbral (09:230).
- Para una «cuenta no utilizable cuando revelarlo sea sensible», 401 neutral, sin decir cuándo lo es.
- RF-006 pide informar el estado de la cuenta (04:139).

**Opciones.**
- **A.** Todas las ramas ejecutan exactamente una comparación bcrypt (con un hash señuelo si no hay credencial) y una escritura de auditoría, y responden `401 INVALID_CREDENTIALS` con el mismo cuerpo. Esto incluye las cuentas SUSPENDIDA y CERRADA. La prueba compara medianas con una tolerancia declarada: el máximo entre 50 ms y un 35 % de la mediana.
- **B.** Aserción bloqueante solo sobre código y cuerpo, y el tiempo como medición informativa.

**Provisorio en código.** A. La causa real queda solo en la auditoría interna (09v7 T16). El hash señuelo toma el costo **más frecuente entre los hashes guardados**, no el configurado: si `BCRYPT_COST` sube (el 08 lo declara «parámetro revisable»), los hashes existentes conservan su costo, y un señuelo más caro haría que el tiempo delatara qué cuentas existen (hallazgo de la revisión adversarial, 2026-09-19; prueba en `sesiones.int-spec.ts`).

**Condición de cierre.** 11A fija la tolerancia y el 09 decide si una cuenta no operativa tiene código propio.

## DL-015 — Rate limiting con umbrales provisionales

**Prioridad:** media · **Documento:** 08 §24.5 y §38 · 09v12:1000-1018 · 07 R-07-08 · **Estado:** ABIERTA

**Qué dice el legajo.**
- El rate limiting es obligatorio en ACC-02 (09v8:337).
- Umbrales PROPUESTA BE: 5 intentos cada 15 min por cuenta+IP, con lockout progresivo (08:786). Los valores numéricos «pertenecen a configuración/11A» (09v12:1018).
- Un lockout «por cuenta» revelaría existencia si solo se aplicara a cuentas reales.

**Opciones.**
- **A.** Throttler con la clave IP + identificador normalizado, independiente de la existencia de la cuenta, y 429 idéntico. Contadores en la memoria de la instancia única, sin lockout progresivo.
- **B.** Contadores persistentes en PostgreSQL con lockout progresivo.

**Provisorio en código.** A, configurable por entorno:
- login: 5 cada 15 min por red + identificador;
- login: además, **100 cada 15 min por red**, sin importar el identificador (08:786, «global por IP: generoso»). Frena el *password spraying* desde una sola red;
- registro: 10 por hora por red.

«Red» es la dirección IPv4, o el prefijo /64 si es IPv6: quien controla un /64 no obtiene un cupo por dirección. Estos dos puntos (el cupo global y la agregación IPv6) surgieron de la revisión adversarial del 2026-09-19.

**Medido (2026-09-19):** detrás del rewrite `/api/*` del website, la API no ve la IP del cliente. Ver DL-030.

**Condición de cierre.** 11A calibra los umbrales, o se escala a más de una instancia (lo que obliga a B).

## DL-016 — Cierre síncrono; ACC-P1-04 inalcanzable; forma del contrato de cierre

**Prioridad:** media · **Documento:** 09v12:582-617 · 06 §5.7.4 · 08:591 · 10-ADD:57-96 · **Estado:** ABIERTA

**Qué dice el legajo.**
- ACC-P1-03 produce efectos «cuando el cierre se hace efectivo según 06/08» (09v12:597).
- CerrarCuenta ocurre al confirmar (06:2147) y la revocación de sesiones es «inmediata» (08:591).
- El body, la respuesta y los estados de la solicitud no están definidos. El 10 prohíbe «inventar enum/etapas» (10-ADD:88-96).

**Por qué no tal cual.** Si el cierre es inmediato, la sesión que lo ejecuta queda revocada, y ACC-P1-04 («estado actual») solo sería alcanzable antes de cerrar, cuando todavía no hay solicitud.

**Opciones.**
- **A.** Cierre síncrono en una sola transacción. Request `{consequencesAcknowledgement:{versionId}, confirmed:true}` y respuesta `201` con `{id, identityId, accountOperationalState:"CERRADA", requestedAt}`. ACC-P1-04 no se implementa en WP-02.
- **B.** Cierre en dos fases, con un estado pendiente que ni el 06 ni el 09 definen.

**Provisorio en código.** A. El `versionId` de las consecuencias hace verificable la guarda «consecuencias presentadas».

**Condición de cierre.** El 09 cierra el contrato P1 del cierre.

## DL-017 — Step-up del cierre sin MFA

**Prioridad:** media · **Documento:** 09v12:589-593 · 09v7 T14 · 08:487 · 07:1799 · **Estado:** ABIERTA

**Qué dice el legajo.**
- ACC-P1-03 exige `SESSION_STEP_UP` (09v12:589).
- `SESSION_STEP_UP` es una «reautenticación/step-up reciente» (09v7:546-547).
- El 08 considera suficiente la sesión propia (08:487).
- MFA está fuera de alcance, y crear una operación de reautenticación contradice 10-B02:580.

**Opciones.**
- **A.** Step-up por sesión reciente: la sesión se autenticó hace ≤10 minutos; si no, `403 STEP_UP_REQUIRED` y la UI pide volver a iniciar sesión.
- **B.** Enviar la credencial en el body del cierre, un campo no contratado que exige rate limiting propio.

**Provisorio en código.** A.

**Condición de cierre.** Implementación de MFA o de step-up según el 09.

## DL-018 — TEST-AUTH-013 (a): «el cierre finaliza vínculos por eventos» no es demostrable sin vínculos

**Prioridad:** alta · **Documento:** 11A:534 · 06:2191 · 05:14513 · **Estado:** CERRADA (2026-09-19)

**Qué dice el legajo.**
- TEST-AUTH-013 afirma «cierre finaliza vínculos por eventos, no delete silencioso» (11A:534).
- 11A admite solo PASS, FAIL, BLOCKED y NOT_RUN (11A:105-114).
- WP-02 excluye los vínculos.

**Por qué no tal cual.** Sin modelo de vínculos, la parte (a) sería verdadera solo en vacío, y reportar PASS sería falso.

**Opciones.**
- **A.** Reportar TEST-AUTH-013 como **BLOCKED**, con la parte (b) («no delete silencioso») como evidencia parcial ejecutada, y volver a ejecutarla completa en el paquete de vínculos. `CuentaCerrada` queda como hecho consumible.
- **B.** Que 11A la divida en TEST-AUTH-013a y TEST-AUTH-013b.

**Provisorio.** A. La parte (b) tiene su propia prueba automatizada en CI.

**Condición de cierre.** El paquete de vínculos ejecuta la parte (a) completa.

**WP-03 (2026-09-19).** WP-03 es el paquete de vínculos. Ejecuta la parte (a) completa, con dos alcances activos (Nutrición y Entrenamiento) antes del cierre: el cierre finaliza cada alcance con `FinalizarAlcance`, actor sistema y motivo `CIERRE_DE_CUENTA`, e invalida las solicitudes pendientes, en la misma transacción (T13 de `docs/paquetes/WP-03.md`). La deuda se cierra cuando esa prueba pase en CI.

**Cierre (2026-09-19).** TEST-AUTH-013 (a) pasa en la CI de `main` `08cdd08` (corrida 35443841420). Lo prueban:
- `cierre.int-spec.ts`, con dos casos: el cierre del asesorado, con dos alcances vivos (uno pausado) y una solicitud pendiente, y el cierre del profesional;
- `concurrencia-wp03.int-spec.ts`, con el cierre concurrente contra REL-01, REL-03 y pausas en bucle: sin deadlocks ni solicitudes pendientes hacia la cuenta cerrada.

La parte (b) sigue en PASS. Evidencia: `EVIDENCIA/WP-03/resultados-integracion-main-08cdd08.md`.

## DL-019 — Supresión del hash al cierre y retención posterior

**Prioridad:** alta · **Documento:** 08 R-01, R-02, R-03, §17, §18 · 06 REG-06-24, INV-06-29, 06:1578 · **Estado:** ABIERTA

**Qué dice el legajo.**
- R-02 exige «Supresión inmediata (tokens al expirar; hash de password al cierre)» (08:445).
- Toda supresión se asienta en el registro de supresiones y se audita (08:453, 468, 642).
- R-01 y R-03 mandan «Suprimir/anonimizar salvo defensa de reclamos: conservar mínimo [PARÁMETRO — VJR] bloqueado» (08:444-446).
- El 06 exige preservar Identidad, Perfil propio e historia (06:2192-2193, 2442) y pide coordinarlo con el 08 (06:1578).

**Opciones.**
- **A.** En la transacción del cierre: suprimir el hash, asentarlo en un registro de supresiones mínimo (categoría, sujeto, fundamento R-02, ejecutor, momento) y auditarlo. Todo lo demás se preserva y queda fuera de toda superficie. La anonimización de R-01/R-03 se difiere hasta que la VJR fije los plazos.
- **B.** Anonimizar además el identificador local en el mismo acto.

**Provisorio en código.** A, completa: el registro de supresiones y la auditoría (`SUPRESION`, recurso `CredencialLocal`, fundamento R-02) se escriben en la misma transacción del cierre. La auditoría se agregó por un hallazgo de la revisión adversarial del 2026-09-19. Las filas de sesión revocadas se conservan sin el token (el token nunca se persiste), y su purga por R-02 se difiere.

**Condición de cierre.** Los plazos VJR de R-01, R-03 y R-06 y la coordinación 06↔08.

## DL-020 — Suspensión y restablecimiento sin caso de uso ni operación

**Prioridad:** media · **Documento:** 06 §5.7.4 · 05 · 09 · 08 §25 · **Estado:** ABIERTA

**Qué dice el legajo.**
- El actor de SuspenderCuenta y RestablecerCuenta es el «habilitado por la política de 08» (06:2145-2146).
- No hay UC en el 05 ni operación en el 09.
- Una operación administrativa exige MFA (08:580).

**Opciones.**
- **A.** Transiciones solo en el dominio y en un servicio interno, sin endpoint, ejercitadas por pruebas.
- **B.** Endpoint administrativo, que requiere rol, MFA y acta.

**Provisorio en código.** A.

**Condición de cierre.** Exista un UC administrativo aprobado.

## DL-021 — Actos A1/A2 y datos del alta fuera del modelo del 06

**Prioridad:** media · **Documento:** 08 §12.2, §12.4 · 06 §5.4.2, REG-06-24 · **Estado:** ABIERTA

**Qué dice el legajo.**
- El 06 no modela A1, A2 ni A3; su único consentimiento es el B2 por vínculo (06:3127-3137).
- El 08 exige evidencia por acto, con estado VIGENTE/REVOCADO, y declara TERMINOS «Revocable: Cierre de cuenta» (08:374, 390).
- REG-06-24 no incluye esa revocación entre los efectos del cierre.
- `registrationIntent` está en el contrato (09v8:152-157), pero no en la estructura de Identidad (06:1969-1984).

**Opciones.**
- **A.** Tabla `ActoRegistrable` según la taxonomía del 08, inmutable salvo la transición `VIGENTE → REVOCADO`. El cierre revoca A1 con un evento `ActoRevocado`. `registrationIntent` vive en el evento `IdentidadCreada`.
- **B.** Que el 06 incorpore A1/A2 a la estructura de Identidad y liste la revocación de A1 en REG-06-24.

**Provisorio en código.** A.

**Condición de cierre.** El 06 reconcilia su modelo con el 08 §12.4.

**WP-03 (2026-09-19).** A3 pasa a otorgarse, consultarse y revocarse (API-CON-06, 07 y 08). Sigue siendo un acto registrable, no una entidad del 06.
- El reotorgamiento es un acto nuevo que preserva el revocado, como lo modela el 09 (09:2508, 09:2607). B2 sigue otra semántica (DL-038).
- Del flujo único de revocación de A3 (08:406), WP-03 cumple el paso 1: la suspensión inmediata de toda operación sensible del titular, incluido el acceso profesional.
- Quedan pendientes el paso 2 (re-otorgar, exportar o cerrar la cuenta, con plazo de 30 días) y el paso 3 (procesamiento por defecto del §17): no hay exportación ni datos de salud.

## DL-022 — Canal o superficie sin campo contractual

**Prioridad:** baja · **Documento:** 08 §12.2 · 05:14247 · 05:15920 · 09v7 T12 · **Estado:** ABIERTA

**Qué dice el legajo.**
- La evidencia de A1 y A2 y la auditoría de sesión exigen el «canal/superficie» (08:374; 05:14247).
- ACC-01 y ACC-02 no tienen ese campo, y el schema estricto rechaza campos desconocidos.

**Opciones.**
- **A.** Header opcional `X-BE-Surface: WEB|APK`. Es un cambio «normalmente compatible» (09v7 T19). Se registra como procedencia declarada y nunca autoriza.
- **B.** Inferir la superficie en el servidor a partir del proxy.

**Provisorio en código.** A. Si el header falta, la superficie se registra como no declarada (`null`), no como un valor inventado.

**Condición de cierre.** El 09 incorpora el header o un campo equivalente.

## DL-023 — Alta por invitación y declaración de mayoría de edad

**Prioridad:** media · **Documento:** 08 §24.3 y §24.7 · 04 RF-001 · 09v8 ACC-01 · **Estado:** ABIERTA

**Qué dice el legajo.**
- «Alta del asesorado por invitación con token de un solo uso» (08:568), frente a RF-001: «crear una cuenta propia» (04:94).
- «el alta requiere declaración de fecha de nacimiento/mayoría de edad» (08:572), que es condición del gate §42-22 (08:852). ACC-01 no tiene ese campo, y el gate «no necesita cumplirlo para la demo sintética» (08:864).

**Opciones.**
- **A.** Autorregistro abierto, sin declaración de edad, mientras los datos sean sintéticos.
- **B.** Implementar ahora la invitación y la declaración de edad, con campos no contratados.

**Provisorio en código.** A.

**Condición de cierre.** Antes de cualquier dato real (gate 08 §42), el 09 incorpora los campos y el 10 las pantallas.

## DL-024 — Desvíos de copy y de UI

**Prioridad:** baja · **Documento:** 10-B02 · 10-ADD · 10-B01 · **Estado:** ABIERTA

| Desvío | Copy del 10 | Qué se implementa | Motivo |
|---|---|---|---|
| Registro no disponible | «…Podés intentar iniciar sesión o recuperar el acceso.» (10-B02:159-162) | «…Podés intentar iniciar sesión.» | La recuperación está fuera de alcance; «ningún flujo declara éxito sin confirmación» (05:843) |
| Cuenta sin A3 | «…revisá y autorizá el tratamiento correspondiente.» (10-B02:341-343) | Copy literal, **sin CTA** | Otorgar A3 está fuera de alcance |
| Cierre | Copy literal de 10-ADD:75-86 | Se agrega: «El cierre no se puede deshacer.» | 08:436: «la reapertura queda no ofrecida en MVP», y el titular debe estar informado |
| Intención de registro | El 10 la pide «cuando corresponda» (10-B02:117) | La UI registra solo ADVISEE; la API acepta ambos valores por contrato | El onboarding profesional está fuera de alcance (10-B01:935-958) |

**Opciones.**
- **A.** Mantener estos desvíos hasta que existan las capacidades.
- **B.** Corregir el 10 para reflejarlos.

**Condición de cierre.** Existen las capacidades (recuperación y A3) o se corrige el 10.

**WP-03 (2026-09-19).**
- A3 pasa a tener CTA («Autorizar tratamiento de mis datos de salud», 10-B02:274-280). Se cierra la mitad A3 del desvío «Cuenta sin A3: copy literal, sin CTA».
- El 10 no tiene copy para reotorgar un B2 ni para aceptar una versión nueva de B2 (DL-038). Se usa copy neutral, derivado del de A3 («Autorizar nuevamente», 10-B02:429).
- El 10 no tiene copy para `422 RELATIONSHIP_NOT_READY_FOR_CONSENT` ni para los 422 de REL-01. Se usan mensajes neutrales, sin códigos técnicos, como en WP-02.

## DL-025 — Superficie web del asesorado

**Prioridad:** baja · **Documento:** 05:1021 · 10-B01:82-96, 722-771 · 04:148-149 · **Estado:** ABIERTA

**Qué dice el legajo.**
- La superficie del asesorado es el APK; el website es «profesional/administrativo» (05:1021).
- El 10 no define una ruta de Cuenta web para el asesorado.
- WP-02 exige el recorrido completo en los dos canales.

**Opciones.**
- **A.** Identidad y sesión como recorridos transversales, con la ruta web neutral `/account` (no `/dashboard`, `/pro` ni `/admin`). Después del login se aterriza en Cuenta, que funciona como configuración segura (10-B02:525).
- **B.** Cuenta y cierre solo en el APK.

**Provisorio en código.** A.

**Condición de cierre.** El 10 define la jerarquía web de identidad.

**WP-03 (2026-09-19).** Se suman rutas neutrales del asesorado para vínculos, consentimientos y A3, siempre bajo `/account` y nunca bajo `/pro` (10-B01, criterio 11A n.º 1: «asesorado nunca entra al shell profesional»). El APK sigue siendo la superficie primaria del asesorado.

## DL-026 — Idempotencia y códigos no definidos

**Prioridad:** media · **Documento:** 09:253-262 · 09v7 T07 · 09v8 ACC-01 · **Estado:** ABIERTA

**Qué dice el legajo.**
- ACC-01 y ACC-P1-03 marcan `Idempotency-Key` como «required», pero no se define el error cuando falta.
- El namespace es «{actor autenticado × operación}» (09:259-261), y ACC-01 es PUBLIC.
- No se define la respuesta para una key en vuelo concurrente.
- No se define el código para un identificador o una credencial inválidos.

**Opciones.**
- **A.** Cinco reglas:
  1. Key ausente → `400 INVALID_REQUEST` con `details.header`.
  2. Namespace de las operaciones PUBLIC: `operación × key`.
  3. La huella excluye la credencial: nunca se guarda nada derivado de la contraseña salvo su hash bcrypt.
  4. Una key en vuelo se serializa en la base: el índice único bloquea hasta que la primera termina, y después se hace replay.
  5. Datos inválidos → `400 INVALID_REQUEST` con `issues`.
- **B.** Códigos nuevos (`IDEMPOTENCY_KEY_REQUIRED`, `VALIDATION_FAILED`).

**Provisorio en código.** A. Los registros de idempotencia no se purgan en WP-02.

**Condición de cierre.** El 09 fija esos códigos y el TTL de retención.

**WP-03 (2026-09-19).** Las escrituras REL-01, 03, 04, 07, 08 y 09, CON-02 y CON-06 exigen `Idempotency-Key`, con el mismo servicio y el mismo ámbito (el actor autenticado). CON-04 y CON-08 son idempotentes por semántica y no llevan key (09v8:1758; 09:2582-2594).

## DL-027 — Oráculos de prueba ausentes en 11A y traza de UC-P26

**Prioridad:** baja · **Documento:** 11A:257-294, 519-535 · 12:227 · 05:14230 · **Estado:** ABIERTA

**Qué dice el legajo.**
- Los TEST-AUTH son títulos de una línea sin oráculo.
- Los oráculos de TEST-RNF figuran como «NOT VERIFIED — texto no extraído».
- UC-P26 se traza a RF-002/005/006 en 11A y el 12, y a RF-002/006/007 en el 05.

**Opciones.**
- **A.** Los oráculos de WP-02 se derivan del texto normativo citado en cada prueba y se declaran en `DEFENSA/WP-02.md`.
- **B.** Dejar esas pruebas como BLOCKED_BY_SOURCE.

**Provisorio.** A.

**Condición de cierre.** 11A incorpora los oráculos.

**WP-03 (2026-09-19).**
- Los oráculos de TEST-AUTH-003 a 008 y 013 (a) se derivan del texto normativo que cita cada prueba y se declaran en `DEFENSA/WP-03.md`.
- El legajo no fija umbral para el corte. Se reporta el conteo de operaciones permitidas después de revocar (tope del 08 §13: ≤ 1) y los milisegundos hasta la primera denegación.
- ReanudarAlcance, CaducarSolicitud, InvalidarSolicitud, AceptarNuevaVersion y OtorgarNuevamente no tienen prueba en ninguna fuente. Se prueban con oráculo derivado del 06.

## DL-028 — Textos A1, A2, A3 y consecuencias del cierre: sintéticos

**Prioridad:** alta (antes de datos reales) · **Documento:** 08 R-08-05, §42-1, §12.1 · **Estado:** ABIERTA

**Qué dice el legajo.**
- Los textos legales no existen: «Alta (hoy no existen)» (08:931).
- El gate §42-1 los exige antes de datos reales.
- La evidencia exige el id y el hash de la versión mostrada (08:374).

**Opciones.**
- **A.** Textos sintéticos versionados, con id y hash, marcados «texto de demostración, no es texto legal». Viven en `@be/domain` y se siembran por migración.
- **B.** Esperar los textos definitivos.

**Provisorio en código.** A. La API rechaza cualquier versión distinta de la vigente con `422 TERMS_VERSION_NOT_ACCEPTABLE` o `422 PRIVACY_VERSION_NOT_ACCEPTABLE`.

**Condición de cierre.** Textos legales aprobados (VJR).

**WP-03 (2026-09-19).** Se suman los textos sintéticos de B2, uno por perfil profesional (sanitario y no sanitario, 08 §12.3), con id, hash y la misma marca «texto de demostración». El alcance y la finalidad no van dentro del texto: quedan como evidencia propia del consentimiento (08:374).

## DL-029 — Logout idempotente frente a AuthN SESSION

**Prioridad:** baja · **Documento:** 09v8:397-427 (ACC-03) · 09v7 T14 · **Estado:** ABIERTA

**Qué dice el legajo.**
- API-ACC-03 declara AuthN `SESSION` (09v8:397-427). 09v7 T14 define `SESSION` como «Sesión activa y cuenta operativa».
- La misma ficha dice que «repetir después de una pérdida de respuesta es semánticamente idempotente».

**Por qué no se puede tal cual.** Si ACC-03 exigiera una sesión activa, el reintento de un logout que ya se aplicó (se perdió la respuesta) respondería 401. El cliente no sabría si su sesión quedó cerrada, y la idempotencia que pide la misma ficha no se cumpliría.

**Opciones.**
- **A.** ACC-03 reconoce el token (firma válida, sesión existente del mismo titular, aunque esté vencido) y responde 204 aunque la sesión ya no esté activa. Sin token o con uno irreconocible, 401. El no-op no se audita como éxito.
- **B.** AuthN `SESSION` estricta: 401 si la sesión no está activa, y el cliente trata ese 401 como «sesión ya cerrada».

**Provisorio en código.** A (`SesionService.finalizarActual`). El 204 de una sesión que ya no estaba activa queda en la auditoría como `RECHAZO` con motivo `SESION_YA_NO_ACTIVA`, nunca como éxito (hallazgo de la revisión adversarial, 2026-09-19). El OpenAPI declara los 401 reales de la operación.

**Condición de cierre.** El 09 define el AuthN del logout idempotente.

## DL-030 — Detrás del rewrite del website, la API no ve la IP del cliente

**Prioridad:** media · **Documento:** 07 CAND-07-J opción C (07:704-705) · 08 §12.2 (evidencia del acto: IP y user-agent) · 08 §38 (límites por IP) · **Estado:** DECIDIDA por Dirección el 2026-09-19 — opción B

**Qué dice el legajo.**
- El website entra a la API «por el proxy del Web BE (same-origin, sin CORS)». En WP-01, con el export estático (DL-007), ese proxy es el rewrite `/api/*` del sitio estático de Render.
- La evidencia de cada acto registra IP y user-agent (08 §12.2).
- Los límites de intentos son por IP, y por cuenta + IP (08 §38).

**Qué se midió (2026-09-19, ambiente `test`, IPv4 forzado).** Evidencia en `EVIDENCIA/WP-02/medicion-ip-proxy.txt`.
- **A. Directo:** 5 logins fallidos contra un identificador inexistente dan 401 y el 6.º, 429. Un 7.º intento por el rewrite, con el mismo identificador, da **401**: la API lo ve desde otra red.
- **B. Por el rewrite:** 6 logins fallidos contra otro identificador dan **seis 401** y ningún 429. Las requests llegan desde **varias** direcciones del proxy (un pool), no desde una sola.
- **Registro:** después de agotar el cupo directo (429), un registro por el rewrite dio 201.

**Por qué no se puede tal cual.** Con el rewrite, lo que la API ve como IP del cliente es la del proxy:
- la IP que queda como evidencia de A1/A2 en los registros web es del proxy, no de la persona;
- los cupos «por IP» y «por cuenta + IP» se diluyen en el tamaño del pool.

Confiar en más saltos de `X-Forwarded-For` no sirve: la API también recibe tráfico directo (el APK), y ahí el cliente podría falsificar esa cabecera.

**Opciones.**
- **A.** Mantener el rewrite (07 CAND-07-J C) y compensar:
  - un cupo por identificador que no depende de la red (20 cada 15 min, neutral: también para identificadores inexistentes). Acota el ataque a una cuenta desde el pool;
  - declarar que la IP de la evidencia de los actos web es la del proxy.
  - Costo: el *password spraying* contra muchas cuentas por el website queda limitado solo por el pool, y la evidencia web no identifica la red de la persona.
- **B.** El website llama a la API directo (CORS). La API ya admite ese origen (`CORS_ALLOWED_ORIGINS`, WP-01), así que la API vuelve a ver la IP real y los cupos quedan iguales para las dos superficies.
  - Cambios necesarios: `connect-src` de la CSP y la URL de la API en el build del website.
  - Se aparta de «same-origin, sin CORS» de CAND-07-J C.

**Decisión de Dirección (2026-09-19): opción B.** Es un **desvío fundamentado** de 07 CAND-07-J C, no una excepción: **BE se aparta de CAND-07-J C (website same-origin por rewrite, sin CORS) para poder cumplir 08 §12.2. La evidencia de A1/A2 necesita la IP real de la persona**, y detrás del rewrite la API solo ve direcciones del proxy. De las dos reglas en conflicto prevalece la del 08, porque es la que protege al titular: evidencia del acto y límites contra abuso. La del 07 es una preferencia de topología.

**Dentro del propio 07.** La topología resultante es la **opción B de CAND-07-J** («B. Export estático + CORS», 07:817-829), que el 07 deja disponible con la cláusula «B se descarta **salvo necesidad**». La necesidad es 08 §12.2. La opción A (runtime Next como proxy), que el 07 pone como fallback antes que la B, no resuelve el problema: al ser un proxy, también le ocultaría la IP a la API, y además agrega el segundo runtime que CAND-07-J busca evitar. El 07 ya prevé la allowlist de CORS «por ambiente de todos modos» (07:704-707), y está configurada desde WP-01.

**Cómo queda.**
- El website se sigue sirviendo como export estático (CAND-07-J, DL-007). Sus llamadas van directo al origen de la API, con CORS restringido al origen del website (`CORS_ALLOWED_ORIGINS`) y sin cookies (Bearer en memoria).
- `BE_API_BASE_URL` se inyecta en el build de be-web. El build en Render falla si falta, así nunca se publica un website roto.
- La CSP de be-web permite `connect-src` hacia la API.
- El rewrite `/api/*` se retira: dejarlo sería un segundo camino que oculta la IP. La especificación del Blueprint de Render preserva las reglas de ruteo que se omiten del archivo, así que sacarlo de `render.yaml` no alcanza: además hay que **borrar la regla en el dashboard** (be-web → Redirects/Rewrites). Después se verifica en negativo que `/api/*` en el website ya no llega a la API.
- Efecto de la llamada cross-origin, corregido: los errores del body parser (JSON inválido, cuerpo > 16 kB) salían antes del middleware de CORS, y el navegador los habría leído como error de red. En `bootstrap.ts`, CORS y `X-Request-Id` quedan antes del parser, con prueba en `cors.int-spec.ts`.
- El cupo por identificador de la opción A se mantiene como defensa en profundidad.

**Secuencia (regla de DL-008).**
1. PR solo de configuración: CSP y `BE_API_BASE_URL`.
2. PR del website.
3. PR solo de configuración que retira el rewrite de `render.yaml`, y borrado de la regla en el dashboard de Render (Dirección).
4. Medición de nuevo en `test` y verificación negativa del rewrite.

**Condición de cierre.** Se cumplen tres cosas:
1. ✅ (2026-09-19 04:19Z) la medición en `test` muestra que los intentos por el website se agrupan en la red del cliente: 401 ×5 y 429 al 6.º; antes eran seis 401 (`EVIDENCIA/WP-02/medicion-ip-proxy.txt` §3);
2. ✅ (2026-09-19 04:40Z) `/api/*` en el website ya no responde con la API. Dirección borró la regla en el dashboard, y la verificación negativa da 404 del sitio estático sin ninguna cabecera ni cuerpo de la API (`EVIDENCIA/WP-02/dl-030/verificacion-negativa-rewrite.txt`);
3. la próxima revisión del 07 incorpora el paso a la opción B en CAND-07-J (y en §34, DL-007).

## DL-031 — Recurso protegido para demostrar el acceso sin dominios de salud

**Prioridad:** alta · **Documento:** 09v11 §15 (09v11:895-950) · 09:2654-2668 · 11A:526-529 · brief WP-03 · **Estado:** DECIDIDA 2026-09-19 · opción A

**Qué dice el legajo.**
- El PDP evalúa cada operación protegida (04 RF-021; 05 UC-I02). TEST-AUTH-005 a 008 presuponen que el profesional lee algo del asesorado (11A:526-529; DV-05).
- El 09 no tiene ninguna lectura por alcance fuera de los dominios. API-REL-06 la ve cualquier participante, incluso con el vínculo pausado (09v8:1362-1369), y no evalúa B2 ni A3.
- El inventario P0 está cerrado en 122 operaciones (09:2654-2668); una familia contractual nueva es no conformidad (09:2717-2719).
- El brief de WP-03 excluye los dominios de salud.

**Por qué no tal cual.** Sin un recurso protegido, las pruebas del PDP serían verdaderas en vacío, que es lo que DL-018 prohibió reportar como PASS.

**Opciones.**
- **A.** API-DSH-03 (dashboard interdisciplinario) sin datos de dominio.
  - Por cada alcance autorizado muestra el estado del vínculo y del consentimiento, y el dominio «sin datos todavía» (RF-053: «los faltantes se muestran como tales»).
  - Si el PDP no autoriza ningún alcance, responde 404, igual que para un asesorado inexistente.
  - Es una operación del inventario. Suma RF-053 y UC-P24 como parciales.
  - Con datos sintéticos alcanza `SESSION` (08:581; 09:715).
- **B.** Sonda fuera del contrato: una ruta solo en `test`, fuera de `/api/v1` y del OpenAPI, que se retira con el primer dominio.

**Resolución — DECIDIDA el 2026-09-19.** Dirección eligió A.

**Condición de cierre.** El paquete de dominio (WP-04) agrega los resúmenes por dominio de DSH-03 y sus operaciones protegidas propias.

**Condición de cierre cumplida — 2026-09-24** (tramo de consolidación, `docs/paquetes/WP-CONSOLIDACION.md` §4, PR #70). WP-04, WP-05 y WP-06 agregaron cada uno sus operaciones protegidas, pero ninguno volvió a DSH-03: el dashboard siguió respondiendo `summary: null` para los tres dominios hasta este tramo. Ahora cada alcance que el PDP permite trae el resumen factual de su propio read model —plan vigente, objetivo con su autoría, última revisión, próxima revisión, conteo de registros del período— y un dominio sin datos sigue siendo `summary: null` (RF-053). Un alcance denegado no se consulta: no puede filtrar ni un conteo al resumen de otro (`test/integration/dashboard.int-spec.ts`).

**Lo que DSH-03 sigue sin traer, y por qué no es deuda nueva.** El 09 v0.11 §15 incluye también `reviews{}`, `nextActions[]` y `projectionAvailability[]`. No se agregan: pertenecen a la cola de revisiones (B10-08 §6), a la coordinación (§13) y a las proyecciones (B10-09), que son el resto de WP-10 y quedaron fuera de la entrega por la decisión de alcance del 2026-09-22. El contrato los omite en vez de devolverlos vacíos, para que ningún cliente los confunda con «no hay revisiones pendientes».

## DL-032 — Las siete dimensiones del PDP y el lugar de A3

**Prioridad:** alta · **Documento:** 04:317 · 04:231 · 06:3183-3191 · 05:4783-4795 · 08:601, 08:305, 08:406 · 09:2603, 09:2625-2639 · **Estado:** DECIDIDA 2026-09-19 · opción A

**Qué dice el legajo.**
- RF-021 nombra siete dimensiones: «rol, especialidad, estado, vínculo, consentimiento, finalidad y alcance» (04:317). El 06 §7.8 y el 05 UC-I02 repiten la lista con «situación aplicable» en lugar de «estado» (06:3183-3191; 05:4783-4795). El 06 no define «situación aplicable».
- RF-015 enumera otras seis condiciones: «identidad, especialidad verificada, habilitación comercial o académica, vínculo, consentimiento y autorización de datos» (04:231).
- El 08 §27.3 lista «identidad, rol, estado profesional/verificación, Alcance habilitado, Vínculo vigente, consentimiento vigente, finalidad/recurso», con la pertinencia como filtro posterior (08:601, 08:305).
- Ninguna lista nombra A3. El efecto de A3 sobre el acceso profesional sale del 08 §13, «suspensión inmediata de toda operación sensible del servicio para ese titular (registro y acceso profesional incluidos)» (08:406), y del 09: los B2 «quedan sin capacidad efectiva mientras A3 no satisfaga el PDP» (09:2603; precedencia en 09:2625-2639).

**Opciones.**
- **A.** Siete dimensiones con los nombres de RF-021.
  - «Situación» abarca: la cuenta del actor y la del titular, la verificación y la habilitación del alcance, y el A3 del titular.
  - La pertinencia se evalúa después, como filtro.
  - La auditoría registra la dimensión desfavorable.
- **B.** Una lista propia de nueve condiciones, sin agrupar: la unión de RF-015, RF-021 y el 08 §27.3, más A3.

**Provisorio en código.** A. Dirección aprobó los nombres el 2026-09-19.

**Resolución — DECIDIDA el 2026-09-19.** Dirección aceptó el provisorio: opción A. El código no cambia.

**Condición de cierre.** El 08 §27.3 incorpora A3 y el 06 define «situación aplicable».

## DL-033 — Máquinas del §7: actor habilitado, motivo y eventos

**Prioridad:** media · **Documento:** 06:3105-3111 · 06:3272 · 06:367 (CONV-06-03) · 06:2191 · 04:342, 04:345 · 05:3316, 05:3440, 05:3644 · 08:412-424 · 09v8:1395-1494 · **Estado:** DECIDIDA 2026-09-19 · opción A

**Qué dice el legajo.**
- Actor:
  - `PausarAlcance`, `ReanudarAlcance` y `FinalizarAlcance` los ejecuta el «actor habilitado por 08» (06:3108-3111), y el §7.15 manda «actores habilitados → 08» (06:3272).
  - El 08 §14 fija los efectos, no los actores (08:412-424).
  - RF-024: «Profesional o asesorado según política» (04:342); el 05: «Quién puede pausar o finalizar en cada situación: DERIVAR 08» (05:3644).
- Motivo:
  - El 06 lo exige al pausar: «decisión + motivo» (06:3108).
  - El 04 y el 05 lo exigen también al finalizar (04:345; 05:3440).
  - El request de REL-07 es solo `{ expectedVersion }` (09v8:1408-1412), y REL-08 y REL-09 no tienen request definido.
- Eventos: CONV-06-03 exige que toda máquina declare sus eventos (06:367), pero el §7 no los nombra.
- Cierre de cuenta: REG-06-24 inciso 5 exige finalizar los vínculos activos (06:2191), y el 08 §14.1 dice que el cierre «corta todos los accesos profesionales» (08:419). El §7.5.2 no nombra al sistema como actor.

**Opciones.**
- **A.** Actores, motivo y eventos provisorios:
  - pausar y finalizar: cualquiera de los dos participantes;
  - reanudar: solo quien pausó;
  - el sistema finaliza por cierre de cuenta;
  - campo `reason` obligatorio al pausar y al finalizar, de una lista cerrada y sin texto libre (08:646: la auditoría no copia contenido):
    - para pausar: `DECISION_PERSONAL`, `DISPONIBILIDAD`, `OTRO`;
    - para finalizar: `DECISION_PERSONAL`, `OBJETIVO_CUMPLIDO`, `CAMBIO_DE_PROFESIONAL`, `OTRO`;
    - `CIERRE_DE_CUENTA` queda reservado al sistema;
  - eventos con nombres derivados, en participio: `SolicitudDeVinculoCreada`, `AlcanceDeVinculoPausado`, `ConsentimientoRevocado` y los demás.
- **B.** Solo el asesorado pausa, reanuda y finaliza, y el profesional solo puede finalizar. Motivo opcional, en texto libre.

**Provisorio en código.** A.

**Resolución — DECIDIDA el 2026-09-19.** Dirección aceptó el provisorio: opción A. El código no cambia.

**Condición de cierre.** El 08 fija los actores habilitados y el 09 agrega el campo de motivo.

## DL-034 — `relationshipId` del 09 frente al Vínculo multialcance del 06

**Prioridad:** media · **Documento:** 06:3014 · 06:3091-3093 · 06:3115 (REG-06-47) · 06:427 (REG-06-05) · 06:3230 (INV-06-58) · 09v8:1267-1270, 1338-1344, 1398 · **Estado:** DECIDIDA 2026-09-19 · opción A

**Qué dice el legajo.**
- El 06: la solicitud es «atómica por Alcance» (06:3014), el «Vínculo agrupa 1..N componentes de Alcance» y la máquina «opera por Alcance» (06:3091-3093).
- El 09: un `relationshipId` con un solo `scope`, y pausa, reanudación y finalización por `relationshipId` (09v8:1267-1270, 1338-1344, 1398).
- El 06 no declara unicidad del Vínculo ni del componente, y REG-06-05 prohíbe inventarla (06:427). INV-06-58 prohíbe reabrir un componente finalizado (06:3230).

**Opciones.**
- **A.** El `relationshipId` del 09 es el componente de Vínculo por Alcance.
  - El Vínculo agrupa por (profesional, asesorado) y se crea con el primer alcance aceptado.
  - Un índice parcial admite un solo componente no FINALIZADO por (vínculo, alcance).
  - Volver a operar un alcance finalizado exige una solicitud nueva y un componente nuevo.
- **B.** El `relationshipId` es el Vínculo agregador y el alcance pasa a ser parámetro de las operaciones. Cambia las rutas del 09.

**Provisorio en código.** A.

**Resolución — DECIDIDA el 2026-09-19.** Dirección aceptó el provisorio: opción A. El código no cambia.

**Condición de cierre.** El 09 aclara que `relationshipId` designa un componente por alcance.

## DL-035 — Cómo identifica el profesional al asesorado

**Prioridad:** media · **Documento:** 09v8:1127-1130 · 06:3012, 06:3044 · 09:325 (RF-051) · 10-B04:188 · 09v7:589-624 · **Estado:** ABIERTA

**Qué dice el legajo.**
- REL-01 exige el `target.identityId` de la contraparte (09v8:1127-1130).
- No hay descubrimiento en P0 (RF-051 es P1, 09:325), ni invitación por token (DL-023), ni búsqueda por correo.
- El 10 menciona «Buscar asesorado permitido» sin definirlo (10-B04:188).
- Buscar por correo permitiría enumerar cuentas (09v7:589-624).

**Opciones.**
- **A.** El asesorado ve su identificador BE en Cuenta y se lo pasa al profesional por fuera de BE. El identificador es un UUID aleatorio: no se puede adivinar ni enumerar.
- **B.** Búsqueda por correo exacto, con respuesta neutral y límite de intentos.

**Provisorio en código.** A.

**Condición de cierre.** El 09 o el 10 definen el mecanismo: invitación o descubrimiento.

## DL-036 — Verificación y habilitación mínimas sin operación viable

**Prioridad:** alta · **Documento:** 06:207 · 06:2782-2788 · 06:2802 (REG-06-33) · 06:2829-2840 · 09v8:987-1098 (PRO-11…13) · 08:580 · 08:887 (G-12) · **Estado:** ABIERTA

**Qué dice el legajo.**
- La verificación es por (identidad, alcance), con los estados «como mínimo PENDIENTE, VERIFICADO, RECHAZADO, SUSPENDIDO» (06:207; máquina en 06:2829-2840).
- La habilitación es una dimensión separada, que requiere concesión explícita (06:2782-2788; REG-06-33).
- La resolución (PRO-11), la suspensión (PRO-12) y la rehabilitación (PRO-13) son operaciones administrativas con `SESSION_MFA` (09v8:987-1098). No hay operación P0 para conceder la habilitación (RF-066 es P1).
- El 08 declara como gap una verificación booleana (08:887).

**Opciones.**
- **A.** Servicio interno, sin endpoint (el patrón de DL-020).
  - Aplica `VerificarAlcance`, `SuspenderAlcance` y `RehabilitarAlcance` con los estados del 06, y concede o retira la habilitación por (identidad, alcance).
  - El perfil profesional mínimo (tipo sanitario o no sanitario y nombre visible) también lo carga ese servicio.
  - En local y en CI lo invocan las pruebas.
  - En `test`, lo invoca la API al arrancar para una lista de correos `example.invalid` declarada en `render.yaml`. Se niega a correr si `APP_ENV` no es `test` o `development`.
- **B.** Adelantar PRO-09 a 13, con rol administrador y MFA.

**Provisorio en código.** A.

**Condición de cierre.** Existen el caso de uso administrativo de verificación (UC-P01 a P03) y su operación.

## DL-037 — Solicitud: caducidad sin plazo, invalidación y respuesta al duplicado

**Prioridad:** media · **Documento:** 06:3035-3040 (REG-06-45) · 06:3121 (REG-06-49) · 09v8:1165-1176, 1222, 1281-1286, 1960 · 09:853 (CAND-09-S03) · 07:3060 · **Estado:** ABIERTA

**Qué dice el legajo.**
- Caducidad: `CaducarSolicitud` existe (06:3035), pero «B-03 define la transición, no la duración» (06:3040), y el 09 deja abierta la «caducidad exacta de solicitudes» (09v8:1960).
- Invalidación: `InvalidarSolicitud` la ejecuta el «sistema/actor propietario» (06:3036) cuando falla la reevaluación al aceptar (REG-06-49, 06:3121). REL-03 no tiene código propio para ese caso (09v8:1281-1286).
- Duplicado: ante una solicitud equivalente pendiente, el 09 devuelve la existente con `200 deduplicated: true` (09v8:1165-1176). Esa conducta es CAND-09-S03, «PENDIENTE DE RATIFICACIÓN INTEGRAL» (09:853).

**Opciones.**
- **A.** Evaluación perezosa y dedup del 09:
  - Plazo parametrizado: `BE_CADUCIDAD_DE_SOLICITUD_DIAS`, 30 días por defecto.
  - La solicitud vencida pasa a CADUCADA, con actor sistema, en la primera operación que la toca.
  - El sistema invalida al aceptar, si la reevaluación falla, y al cerrar la cuenta.
  - El duplicado responde `200 deduplicated: true`.
- **B.** Job periódico de caducidad; el duplicado responde `409`.

**Provisorio en código.** A. Aceptar o rechazar una solicitud caducada o invalidada responde `422 INVALID_STATE_TRANSITION`.

**Condición de cierre.** El 08 fija el plazo y el 09 ratifica CAND-09-S03.

## DL-038 — B2: nueva versión y reotorgamiento sin contrato

**Prioridad:** media · **Documento:** 06:3170-3175 · 06:3159 (REG-06-50) · 06:1286-1288 · 09v8:1570-1660 · 09:2437-2519, 2607 · 08:404 · 05:4253 · **Estado:** ABIERTA

**Qué dice el legajo.**
- El 06 tiene `AceptarNuevaVersion` (VIGENTE → VIGENTE) y `OtorgarNuevamente` (REVOCADO → VIGENTE) (06:3173-3175). Cada decisión emite una Versión nueva del mismo Consentimiento (REG-06-50), y la vigencia se resuelve por referencia explícita, no por fecha (06:1286-1288).
- CON-02 no dice qué pasa con un B2 activo al aceptar una versión sucesora, ni con el reotorgamiento después de CON-04. Tampoco tiene `CONSENT_ALREADY_ACTIVE` (09v8:1649-1654).
- Para A3, el 09 modela el reotorgamiento como un acto nuevo que preserva el revocado (09:2508, 09:2607), con `409 CONSENT_ALREADY_ACTIVE` (09:2514). El 06 no modela A3 (DL-021).
- El 05 pide distinguir «vigente, revocado o reemplazado» (05:4253).
- El 08: «La revocación es siempre re-otorgable (OtorgarNuevamente) por decisión del titular» (08:404).

**Opciones.**
- **A.** B2 sigue al 06 y A3 sigue al 09:
  - hay un solo Consentimiento por (alcance de vínculo, finalidad), con una cadena lineal de versiones;
  - CON-02 aplica `OtorgarConsentimiento`, `AceptarNuevaVersion` u `OtorgarNuevamente` según el estado, y la versión anterior queda «reemplazada»;
  - si ya está vigente con la misma versión, CON-02 responde 200 con el consentimiento existente;
  - la versión de texto aplicable es la cabeza de una cadena explícita de sucesión (cada versión declara a cuál reemplaza);
  - en A3, cada otorgamiento es un acto nuevo.
- **B.** B2 igual que A3: cada otorgamiento es un Consentimiento nuevo.

**Provisorio en código.** A.

**Condición de cierre.** El 09 define CON-02 para la versión sucesora y el reotorgamiento.

## DL-039 — Finalidad y categorías pertinentes sin catálogo

**Prioridad:** media · **Documento:** 06:251, 06:262 (Q-003 → 08) · 09v8:1518-1562, 1962 · 08:307, 08:368, 08:374 · 07 R-07-19 · **Estado:** SIMPLIFICACIÓN DECLARADA del alcance implementado (Dirección, 2026-09-19)

**Qué dice el legajo.**
- La finalidad es un atributo estructural, y su catálogo pertenece al 08 (Q-003) (06:251, 06:262). El 09 deja abierto el «catálogo exacto de `purpose`» (09v8:1962).
- CON-01 devuelve `pertinentCategories` derivadas de la matriz de pertinencia vigente, con «ausencia de regla = deny» (09v8:1558).
- La evidencia de B2 incluye la versión de la matriz y las categorías autorizadas (08:374), y la decisión de acceso registra la versión de la matriz (08:307).
- Sin dominios no hay categorías ni matriz.

**Opciones.**
- **A.** Una finalidad sintética por alcance, con su etiqueta legible:
  - `ACOMPANAMIENTO_NUTRICIONAL`;
  - `PLANIFICACION_DEL_ENTRENAMIENTO`;
  - `EVALUACION_ANTROPOMETRICA`.

  `pertinentCategories` queda vacío. Los campos de la versión de matriz existen en la evidencia y en la decisión, en nulo.
- **B.** Finalidad en texto libre y categorías sintéticas por alcance.

**Provisorio en código.** A.

**Resolución — SIMPLIFICACIÓN DECLARADA el 2026-09-19.** Dirección confirmó una finalidad por alcance, sin categorías de información, y pidió registrarlo como simplificación del alcance implementado, no como deuda pendiente.

- **Qué se construyó:** el consentimiento es por alcance y finalidad. Cada alcance tiene su finalidad, y cada vínculo por alcance tiene su propio consentimiento B2.
- **Qué quedó especificado y no construido:** la granularidad por categoría de información dentro de un mismo alcance. Requiere la matriz de pertinencia (08 §27.3; 09v8:1558), que el legajo no desarrolla. `pertinentCategories` viaja vacío y los campos de versión de matriz quedan en nulo.
- **Por qué alcanza para el caso que importa:** una profesional de nutrición con capacidad antropométrica opera con dos alcances distintos, cada uno con su consentimiento (DEC-044: el 05 §4.11.3.1, condición 6, exige un «consentimiento específico cuyo alcance sea la capacidad antropométrica»). El asesorado puede autorizar uno y no el otro. Lo que queda fuera es subdividir dentro de un mismo alcance.
- **Dónde se declara:** `DEFENSA/WP-03.md` §4.1 y `docs/mesa/MESA_01/ESTADO_PUNTOS_5_14_WP-03.md`.

**Condición para retomarla.** El 08 publica la matriz de pertinencia. No es condición de cierre de ningún paquete.

## DL-040 — Nombre visible de las partes sin campos de perfil aprobados

**Prioridad:** media · **Documento:** 09v8:161-170 (ActorSummary) · 09v8:1523-1526 · 11A:196 · DL-009 · **Estado:** ABIERTA

**Qué dice el legajo.**
- Los modelos de lectura de REL y CON muestran la contraparte como `ActorSummary { identityId, displayName }` (09v8:161-170), y CON-01 muestra `professional.displayName` (09v8:1523-1526).
- TEST-RF-018: «el destinatario conoce quién solicita y para qué» (11A:196).
- No hay campos de perfil aprobados, ni para el perfil propio ni para el profesional (DL-009).

**Opciones.**
- **A.** Nombre visible y referencia neutral:
  - El perfil profesional mínimo tiene un nombre visible. Lo carga el servicio interno de DL-036 y es sintético en las cuentas demo.
  - El profesional ve al asesorado con una referencia neutral derivada del identificador («Asesorado · a1b2c3»), sin el correo.
- **B.** Mostrar el correo de cada parte.

**Provisorio en código.** A.

**Condición de cierre.** El 04 y el 05 aprueban los campos del perfil propio y del perfil profesional (DL-009).

## DL-041 — El profesional sin Cartera

**Prioridad:** media · **Documento:** 10-B01:645-663 · 10-B01:742-755 · 10-B01:1019-1031 · 10-B01:1310-1319 (CAND-10-NAV-E) · 10-B04:153-177 · brief WP-03 · **Estado:** ABIERTA

**Qué dice el legajo.**
- El profesional entra al asesorado «siempre por Cartera o Revisiones» (10-B01:645-663). La Cartera es API-DSH-01 (RF-052), que el paquete excluye.
- El 10 no tiene una pantalla «mis vínculos» del profesional fuera de la Cartera, y admite «una representación mínima del vínculo en Cartera/estado» (10-B01:1025).
- CAND-10-NAV-E prohíbe una ruta profesional distinta por vínculo o alcance (10-B01:1310-1319). La ruta del workspace es `/pro/advisees/:adviseeId` (10-B01:746).
- El website es un export estático: no puede prerenderizar `/pro/advisees/:adviseeId` para identificadores arbitrarios.

**Opciones.**
- **A.** Lista mínima y workspace por query:
  - `/pro` muestra una lista mínima de vínculos (REL-05) y de solicitudes enviadas (REL-02);
  - el workspace del asesorado vive en `/pro/advisees?id=…`, la forma más cercana a `/pro/advisees/:adviseeId` (10-B01:746) que admite un export estático, con el encabezado del vínculo y el Resumen (DSH-03);
  - no hay Cartera.
- **B.** Implementar DSH-01 mínimo.

**Provisorio en código.** A.

**Condición de cierre.** El paquete de Cartera (DSH-01) reemplaza la lista mínima, y el website define cómo resolver rutas dinámicas.

## DL-042 — Casos adversariales de DV-05 que dependen de dominios

**Prioridad:** alta · **Documento:** DV-05 (DV05.md:1116-1133) · brief WP-03 · **Estado:** ASIGNADA a WP-04 por Dirección (2026-09-19)

**Qué dice el legajo.**
- DV-05 propone diez casos adversariales para ejecutar en vivo ante el tribunal (DV05.md:1116-1133).
- Cuatro necesitan antropometría, planes o evaluaciones (DV05.md:1127-1131):
  - 6: anular dos veces una medición;
  - 7: evolución con un hueco de datos;
  - 8: editar un plan activado;
  - 10: borrador de evaluación de otro profesional.
- El brief de WP-03 excluye los dominios de salud.

**Opciones.**
- **A.** WP-03 habilita seis: 1, 2, 3 (variante profesional), 4, 5 y 9. Los otros cuatro pasan al criterio de cierre del primer paquete de dominio.
- **B.** Adelantar en WP-03 lo mínimo de antropometría y planes para ejecutarlos.

**Resolución — ASIGNADA el 2026-09-19.** Dirección eligió A. Los casos 6, 7, 8 y 10 quedan asignados a WP-04.

**Reasignación — 2026-09-19.** Al leer las fuentes de WP-04 se vio que dos casos no son de nutrición:
- el **6** (anular dos veces una medición) es TEST-ANT-006 (11A:581);
- el **10** (borrador de evaluación de otro profesional) usa el estado `EN_PREPARACION` de la evaluación antropométrica (06:8593-8630; 08 §56.5).

WP-04 habilita el **8** (editar un plan activado) y el **7** en su variante nutricional: un día sin registro se muestra «sin registro», nunca cero (INV-06-135). Dirección dejó el orden de los dominios a criterio del ejecutor: **WP-05 es antropometría**, y ahí van el 6, el 10 y el 7 en su variante de evolución de mediciones (INV-06-176).

**Condición de cierre.** WP-04 deja ejecutables el 8 y el 7 nutricional; WP-05, el 6, el 10 y el 7 de mediciones.

**Estado — 2026-09-20.** La parte de WP-04 está cumplida. El 8 y el 7 nutricional pasan en CI y en vivo contra `test` con `node scripts/adversariales-wp04.mjs` (`EVIDENCIA/WP-04/adversariales-test.json`). La corrida del 7 encontró un defecto del contraste, corregido en el PR #25 (`DEFENSA/WP-04.md` §5). DL-042 se cierra cuando WP-05 deje ejecutables el 6, el 10 y el 7 de mediciones.

## DL-043 — Contratos de REL con forma no definida en el 09

**Prioridad:** media · **Documento:** 09v8:1161-1163 · 09v8:1208-1220 · 09v8:1309-1311 · 09v8:1389 · 09v8:1447-1490 · 09v8:1764-1778 · **Estado:** ABIERTA (hallada al implementar)

**Qué dice el legajo.**
- REL-01: el `201` no tiene body definido; solo el caso deduplicado tiene forma (09v8:1161-1176).
- REL-04 no define la respuesta de éxito ni los errores (09v8:1309-1321). REL-08 y REL-09 no definen request, éxito ni errores (09v8:1447-1490).
- REL-06 describe su contenido («estado relacional, alcance, finalidad, contraparte y resumen de B2/efectividad», 09v8:1389) sin forma JSON.
- El ítem de solicitud no dice quién la inició (09v8:1208-1220). El 10 necesita separar «recibidas» de «enviadas» (10-B04:216-225).
- Las lecturas REL-02, 05 y 06 no declaran clase de auditoría (09v8:1764-1778), aunque 09v7 T18 exige que cada operación la indique.

**Opciones.**
- **A.** Definirlas en `@be/domain` (`contratos-vinculo.ts`), con la forma mínima coherente con el resto del 09:
  - el `201` de REL-01 es un ítem de REL-02;
  - REL-04 devuelve `{ relationshipRequestId, state, version }`;
  - REL-07, 08 y 09 devuelven el ítem de vínculo actualizado;
  - REL-06 es el ítem más `consent` y un historial mínimo;
  - la solicitud agrega `initiatedBy`;
  - las lecturas REL se auditan como `BEST_EFFORT_TECHNICAL` (línea de log técnico), como las lecturas CON.
- **B.** Esperar la próxima versión del 09 y dejar esas operaciones fuera del paquete.

**Provisorio en código.** A. El OpenAPI generado (`docs/api/openapi.json`) publica esas formas y el contract test las verifica.

**Condición de cierre.** El 09 fija las formas de REL-01 (201), REL-04, REL-06, REL-08 y REL-09, y la clase de auditoría de las lecturas REL.

## DL-044 — Qué ve el profesional de un vínculo finalizado

**Prioridad:** media · **Documento:** 08 §13 · 08 §14.1 · 09v8:1385-1391 · **Estado:** DECIDIDA 2026-09-19 · opción B

**Qué dice el legajo.**
- Después de FINALIZADO, el profesional no tiene «ningún acceso posterior, ni lectura histórica» a los datos del asesorado (08 §14.1).
- La revocación «no notifica contenido al profesional más allá de la pérdida de acceso» (08 §13).
- REL-06 muestra a las dos partes el estado relacional, el consentimiento y un historial mínimo (09v8:1385-1391). No distingue qué ve cada parte después de finalizar.

**Qué pasa hoy.** El vínculo finalizado sigue visible para el profesional en REL-05 y REL-06. Si después de finalizar el asesorado revoca el consentimiento, el profesional ve esa revocación y su fecha. No accede a ningún dato del asesorado: el PDP deniega todo.

**Opciones.**
- **A.** Congelar la vista del profesional al finalizar: historial y estado del consentimiento hasta el hecho de finalización. Lo que el asesorado decide después no le llega.
- **B.** Mantener la vista actual: las dos partes ven el estado vigente del vínculo y del consentimiento.

**Provisorio en código.** B. No es acceso a datos del asesorado, y A requiere decidir qué es «notificar» para metadatos del vínculo.

**Resolución — DECIDIDA el 2026-09-19.** Dirección aceptó el provisorio: opción B. El código no cambia.

**Condición de cierre.** Dirección decide si los metadatos del vínculo posteriores a la finalización son «contenido» en el sentido del 08 §13 y §14.1.

## DL-045 — Solicitud iniciada por el asesorado: el profesional no acepta

**Prioridad:** media · **Documento:** 05:2840-2845 (UC-P04 V02) · 06 §7.3.2 · INV-06-52 · **Estado:** DECIDIDA 2026-09-19 · opción A

**Qué dice el legajo.**
- En V02 el asesorado propone el vínculo, y la solicitud queda pendiente de la decisión expresa del asesorado (05:2840-2845).
- Solo el asesorado acepta o rechaza una solicitud (06 §7.3.2; INV-06-52).

**Qué pasa hoy.** Implementado literal: si el asesorado inicia la solicitud y la acepta, y después otorga B2 y A3, el profesional queda con acceso sin haber aceptado el vínculo. En WP-03, V02 existe solo en la API: ninguna pantalla lo ofrece (DL-035).

**Opciones.**
- **A.** Literal. El profesional puede pausar o finalizar el vínculo en cualquier momento.
- **B.** El profesional acepta las solicitudes que inicia el asesorado. Cambia la máquina del 06: `AceptarSolicitud` tendría como actor a la contraparte de quien inició.

**Provisorio en código.** A.

**Resolución — DECIDIDA el 2026-09-19.** Dirección aceptó el provisorio: opción A. El código no cambia.

**Condición de cierre.** El 05 y el 06 definen quién acepta una solicitud iniciada por el asesorado.

## DL-046 — `planId` del 09: Plan o Versión de plan

**Prioridad:** media · **Documento:** 09v9:201-205, 09v9:513-562 · 06:224, 06:4136-4137 (T-06-28, T-06-29) · 06:4274-4282 (REG-06-102) · **Estado:** ABIERTA

**Qué dice el legajo.**
- El 06 distingue el Plan profesional (T-06-28), que agrupa versiones, de la Versión de plan (T-06-29), que tiene el estado `BORRADOR`/`ACTIVADA` (06:4288).
- El 09 tiene una sola ruta, `/nutrition/plans/{planId}`, y el recurso trae `state` y `version` (09v9:201-205). No dice si una versión sucesora es un `planId` nuevo o una versión nueva del mismo.

**Opciones.**
- **A.** El `planId` de las rutas designa una **Versión de plan**, porque tiene estado. La respuesta agrega `nutritionPlanId`, que identifica el Plan que agrupa las versiones. Una sucesora es un `planId` nuevo del mismo `nutritionPlanId`.
- **B.** El `planId` designa el Plan, y la versión viaja como parámetro o en el cuerpo. Cambia las rutas del 09.

**Provisorio en código.** A.

**Condición de cierre.** El 09 aclara qué designa `planId`.

## DL-047 — Versión sucesora fuera de una revisión, sin operación en el 09

**Prioridad:** alta · **Documento:** 05:5869-5873 (UC-P10 V07) · B05:1301-1339 (CAND-NUT-D) · 06:4305-4309 · 09v9:476-499, 914-961 · **Estado:** ABIERTA

**Qué dice el legajo.**
- UC-P10 V07: editar después de activar crea un borrador nuevo (05:5869-5873). B10-05 muestra la versión activada en solo lectura con «Crear nueva versión a partir de esta» «si se habilita» (B05:1325-1339).
- El 06: «una continuidad crea otra Versión» (06:4307-4309).
- El 09 no tiene operación para crear una sucesora desde la versión activa. La única vía es aplicar una revisión con ADJUST o REPLACE, que «crea versiones necesarias» (09v9:938).

**Opciones.**
- **A.** API-NUT-07 acepta un `basedOnPlanId` opcional, que es la versión efectiva. Crea un borrador sucesor con la misma estructura y con `predecessorPlanId`, sin tocar la activada. Aplicar AJUSTAR o SUSTITUIR usa el mismo mecanismo (DL-052).
- **B.** Solo la revisión crea sucesoras. Corregir un error en un plan activado exige registrar y aplicar una revisión.

**Provisorio en código.** A. Es el camino que el 05 y el 10 describen para un error del profesional, y no saltea ninguna garantía: la activación de la sucesora sigue pasando por `ActivarVersion`.

**Condición de cierre.** El 09 define la operación, o decide que la sucesora solo nace de una revisión.

## DL-048 — Contenido de la evaluación nutricional sin campos definidos

**Prioridad:** media · **Documento:** 04:360-367 (RF-026) · 06:4183-4201 (REG-06-97), 06:4421-4429 (REG-06-109) · 09v9:158, 09v9:345 (`assessment:{}`) · B05:229 · **Estado:** ABIERTA

**Qué dice el legajo.**
- La evaluación tiene autoría, ocurrencia, registro, contexto y fuentes. Cada dato marca si es informado, observado o calculado (04:364-366; 06:4425-4427).
- El 09 deja `assessment` como objeto opaco (09v9:345). El 10 pide solo «campos respaldados por dominio» (B05:229). El 05 no fija el contenido mínimo (05:6773-6777).

**Opciones.**
- **A.** La evaluación es una lista de datos. Cada dato tiene `concepto` (texto), `valor`, `unidad` opcional y `fuente` (`INFORMADO`, `OBSERVADO` o `CALCULADO`). Se suman el contexto, las notas profesionales separadas y las referencias de evidencia. Un dato `CALCULADO` exige declarar el método en texto, porque BE no calcula.
- **B.** Un conjunto cerrado de campos nutricionales (antecedentes, hábitos, recordatorio de 24 h, etc.), definido por el ejecutor.

**Provisorio en código.** A. No inventa contenido clínico que el legajo no aprobó (REG-06-110).

**Condición de cierre.** El 06 o el 09 fijan el contenido mínimo de la evaluación.

## DL-049 — Ingesta prescripta: ocurrencia planificada, clave de unicidad y día tipo en «Hoy»

**Prioridad:** alta · **Documento:** 06:4368-4394 (REG-06-106, 107), 06:4447, 06:4566 · CONS:564-628 · 09v9:680, 09v9:1135 · B05:768-782 · **Estado:** ABIERTA

**Qué dice el legajo.**
- La ingesta referencia la Versión activada y «la parte u ocurrencia planificada cuando corresponda». La vertical declara una clave lógica de unicidad (06:4376, 06:4388).
- El Día tipo «no se agenda en fechas» (06:4566). Para `PRESCRIBED`, el CONS exige una «ocurrencia planificada canónica» sin nombrar el campo (CONS:620).
- «Hoy» no elige un día tipo sin regla canónica: expone la decisión pendiente (09v9:680; B05:768-782).

**Opciones.**
- **A.** Una ingesta `PRESCRIBED` referencia versión, `dayTypeId`, `mealId` y `optionId` de la instantánea, y `localDate` en la zona horaria del asesorado. La clave es (asesorado, versión, `localDate`, `mealId`). Si el plan tiene un solo día tipo, «Hoy» lo muestra; si tiene varios, el asesorado elige con un selector explícito, sin que BE elija en silencio.
- **B.** El profesional asigna un día tipo por día de la semana y «Hoy» lo resuelve solo. Agrega una regla que el legajo no tiene.

**Provisorio en código.** A.

**Condición de cierre.** El 09 nombra el campo de la ocurrencia planificada y la clave.

## DL-050 — Corregir una ingesta prescripta: sin operación ni UC

**Prioridad:** media · **Documento:** 09v9:762 · CONS:641-672 · 05:719 (UC-E02, solo entrenamiento) · 06:4468 · **Estado:** ABIERTA

**Qué dice el legajo.**
- No hay operación para editar una ingesta (09v9:762). API-NUT-21 corrige solo las libres (`OUTSIDE_PRESCRIPTION` + `FREE_DESCRIPTION`), como estimación profesional (CONS:641-672).
- El único UC de corrección de ejecución es de entrenamiento (UC-E02, 05:719). La ingesta usa la Corrección trazable de B-06 (06:4468), pero ningún contrato la expone para `PRESCRIBED`.

**Opciones.**
- **A.** En WP-04, una ingesta prescripta no se corrige. Un segundo registro incompatible para la misma comida y fecha devuelve `409 EXECUTION_ALREADY_REGISTERED_INCOMPATIBLY`. Si el asesorado se equivocó, lo cuenta con una ingesta fuera del plan, que queda como hecho aparte.
- **B.** Agregar una corrección de la ingesta prescripta por el asesorado con el patrón de B-06. Es una operación que el 09 no tiene.

**Provisorio en código.** A.

**Condición de cierre.** El 05 y el 09 definen la corrección de la ingesta prescripta.

## DL-051 — Capacidad sin actor que la configure

**Prioridad:** media · **Documento:** 06:3667, 06:3751-3769 (REG-06-82, 83), 06:3961 · 04:681-686 (RF-066, P1) · 05:6053 (UC-P11 → UC-I10) · DV-05 TEST-RF-031 paso 3 · **Estado:** ABIERTA

**Qué dice el legajo.**
- Activar un Proceso nuevo consulta la capacidad (REG-06-104; UC-P11). Sin banda configurada, el modo efectivo es `SIN_LIMITE` (REG-06-82).
- Ningún documento define quién configura la capacidad ni con qué operación: el 06 remite a UC-I10 y a una «configuración académica» (06:3667, 06:3961). RF-066 es P1.
- TEST-RF-031, paso 3, prueba el rechazo con un límite de 1 ya ocupado.

**Opciones.**
- **A.** Capacidad versionada por profesional, con `SIN_LIMITE` por defecto y la regla REG-06-91 completa. La configura un servicio interno. En `test` se declara por identidad demo, como la verificación de WP-03 (DL-036), para demostrar el rechazo.
- **B.** No evaluar la capacidad hasta que exista RF-066 completo. TEST-RF-031 paso 3 queda sin ejecutar.

**Provisorio en código.** A.

**Condición de cierre.** El 05 o el 09 definen quién configura la capacidad y con qué operación.

## DL-052 — Efectos de aplicar AJUSTAR, SUSTITUIR y CAMBIAR_OBJETIVO

**Prioridad:** alta · **Documento:** 06:4405-4411 (REG-06-108), 06:5940-5949 (REG-06-147) · 05:7556, 05:7564, 05:7595 (UC-I06) · 09v9:925, 09v9:938 · **Estado:** ABIERTA

**Qué dice el legajo.**
- REG-06-108 dice que AJUSTAR y SUSTITUIR «preparan» continuidad. REG-06-147 dice que «crea/sucede versión». UC-I06 V02 «inicia el recorrido de nueva versión» y V04 «inicia» el cambio de objetivo.
- El 06 dice que CAMBIAR_OBJETIVO «emite nueva Versión de objetivo» (06:4408, 5948).
- `apply` solo recibe `expectedVersion` y «crea versiones necesarias» (09v9:925, 938). No dice cuáles ni a qué recurso pertenece la versión esperada.

**Opciones.**
- **A.** Al aplicar, en una sola transacción con el evento:
  - AJUSTAR y SUSTITUIR crean un **borrador sucesor** de la versión efectiva, con la misma estructura, y referencian la revisión;
  - CAMBIAR_OBJETIVO emite la nueva versión de objetivo con el contenido que trae `nextAction.objective` de la revisión;
  - MANTENER y REPROGRAMAR_REVISION registran la próxima acción y la próxima revisión;
  - FINALIZAR cierra el Proceso;
  - `expectedVersion` es la versión de la revisión.
- **B.** Aplicar solo registra la intención y el evento. El profesional crea después el borrador o el objetivo con las operaciones de siempre.

**Provisorio en código.** A. Con B, el evento declararía aplicada una consecuencia que todavía no existe, lo que va contra REG-06-75 y REG-06-77.

**Condición de cierre.** El 09 detalla los efectos de `apply` por resultado.

## DL-053 — Q-007: abierta en el 04 y el 11A, resuelta en el 06

**Prioridad:** baja · **Documento:** 04:446, 04:1141 · 11A:213 · 06:3504, 06:3612-3619, 06:7714 · **Estado:** ABIERTA

**Qué dice el legajo.**
- El 04 marca Q-007 como ABIERTA, y RF-035 y TEST-RF-035 dicen que el cierre cumple lo que resuelva Q-007 (04:446, 04:1141; 11A:213).
- El 06 la da por **RESUELTA en M-04**, con el evento `ContinuidadOCierreAplicado` (06:3504, 06:3612-3619, 06:7714).

**Opciones.**
- **A.** Implementar la resolución del 06, el documento de dominio y el más reciente en esto. El oráculo de TEST-RF-035 usa REG-06-74 a 77.
- **B.** Tratar Q-007 como abierta y dejar el cierre sin evento.

**Provisorio en código.** A.

**Condición de cierre.** El 04 y el 11A actualizan el estado de Q-007.

## DL-054 — Pendiente de revisión y timeline sin Cartera

**Prioridad:** media · **Documento:** 05:7117 (UC-P13 paso 1), 05:7075-7094 (postcondiciones 7 a 10) · 06:5967-5982 (REG-06-150) · 06:237 (T-06-41, M-11) · brief WP-04 · **Estado:** ABIERTA

**Qué dice el legajo.**
- UC-P13 empieza en los «ciclos nutricionales pendientes de revisión» (UC-P23, Cartera). Termina actualizando el timeline, resolviendo el pendiente y dejando el evento para UC-S01.
- El brief excluye la Cartera, el dashboard y TVCC-30.

**Opciones.**
- **A.** El predicado REG-06-150 se calcula y se muestra en el Resumen de la pestaña Nutrición («Revisión pendiente desde…»). La revisión se inicia desde ahí. Los eventos (`ProcesoOperativoAbierto`, `ContinuidadOCierreAplicado`, `ProcesoOperativoCerrado`) quedan persistidos y consultables como fuente del futuro timeline y de UC-S01. Sin Cartera.
- **B.** Adelantar API-DSH-01 (Cartera) y el timeline.

**Provisorio en código.** A.

**Condición de cierre.** El paquete de Cartera y timeline consume los eventos persistidos.

## DL-055 — Contratos NUT con forma no definida en el 09

**Prioridad:** media · **Documento:** 09v9:158, 175-179, 308, 601-644, 671, 804-806, 862 · CONS:655 · 09v9:1028 · **Estado:** ABIERTA (mismo patrón que DL-043)

**Qué dice el legajo.**
- Estas operaciones no declaran la respuesta de éxito: NUT-04, 07, 10, 12, 15, 18, 20 y 21.
- Estas otras son solo una ruta, sin errores ni schema: NUT-02, 05, 06, 08 y 13.
- Hay objetos opacos: `assessment`, `macronutrientDistribution`, `activePlan`, `descriptiveContrast`, `nextAction`, `structuredEstimate.items` y `composition`.
- Del contrato de NUT-10 falta la semántica de `changes`, y de NUT-11, los códigos de `issues` (hay un solo ejemplo).
- `OBJECTIVE_NOT_EFFECTIVE_OR_COMPATIBLE` está en el registro de errores, pero ninguna operación lo declara.
- Ningún contrato NUT lista el efecto de A3, aunque la precedencia es obligatoria (CONS:2625-2640).

**Opciones.**
- **A.** Definirlos en `@be/domain` (`contratos-nutricion.ts`) con la forma mínima coherente con el resto del 09:
  - las escrituras devuelven el recurso creado o actualizado;
  - `changes` reemplaza la jerarquía entera;
  - los `issues` usan un catálogo de códigos con su `path`;
  - `OBJECTIVE_NOT_EFFECTIVE_OR_COMPATIBLE` corresponde a NUT-07;
  - A3 ausente produce el mismo 404 que el PDP.

  El OpenAPI generado lo publica y el contract test lo verifica.
- **B.** Esperar la próxima versión del 09.

**Provisorio en código.** A. Además, para cumplir el 10 y el 06 sin inventar reglas:
- `GET /me/nutrition/executions`: la lista de registros propios del asesorado, que pide la pantalla «Registros» del APK (B10-05 NUT-11; 10-B01:351-357) y el 09 no declara;
- `dayTypeId` como parámetro de «Hoy» (API-NUT-14), para que el asesorado elija el día tipo sin que BE lo elija en silencio (DL-049);
- `planState: NOT_AVAILABLE` en «Hoy», cuando hay plan pero el acceso está suspendido (UC-P12 E06);
- `nextReviewAt` en el borrador del plan y en `nextAction`, porque la próxima revisión la fija una versión de plan o una revisión (REG-06-145);
- `objectiveVersionId` en API-NUT-10, para pasar un borrador al objetivo vigente después de CAMBIAR_OBJETIVO;
- el cuerpo de éxito de API-NUT-20 (`{ reviewId, application }`);
- `NUTRITION_SCOPE_NOT_OPERATIONAL` no se emite: la precedencia del 09 (09:213-233) lo vuelve el mismo 404 que el PDP.

El OpenAPI generado publica todo y el contract test lo verifica.

**Condición de cierre.** El 09 fija esas formas.

## DL-056 — RF-028 (Open Food Facts), P0 de compromiso académico, sin paquete asignado

**Prioridad:** alta · **Documento:** 04:378-385 (RF-028) · 05:5777, 05:5921 · 11A:206 · 12 (fila RF-028) · brief WP-04 · **Estado:** ABIERTA

**Qué dice el legajo.**
- RF-028 es P0, «Compromiso académico de integración»: consulta e importación controlada desde Open Food Facts, con fallback a catálogo propio y carga manual.
- El 05 lo hace opcional en cada operación (05:5777), pero lo mantiene como compromiso (05:5921).
- El brief de WP-04 excluye la integración con catálogos externos.

**Opciones.**
- **A.** Asignar RF-028, UC-I07, UC-I08 y API-INT-NUT-02 y 03 a un paquete posterior, antes de la entrega.
- **B.** Incluirlo en WP-04.

**Provisorio en código.** Ninguno: WP-04 deja el catálogo propio y la carga manual, que son el fallback que el mismo RF exige.

**Resolución — DECIDIDA el 2026-09-19.** Dirección eligió A: RF-028, UC-I07, UC-I08 y API-INT-NUT-02 y 03 van a un paquete de integraciones posterior a WP-04, antes de la entrega.

**Condición de cierre.** RF-028 queda asignado a un paquete o se declara fuera de la entrega con fundamento.

## DL-057 — Datos nutricionales de otro profesional del mismo alcance

**Prioridad:** media · **Documento:** 08:145, 08:197-198, 08:215 · 06:4274-4282 (REG-06-102) · 04:463 (RF-025) · **Estado:** ABIERTA (hallada al implementar)

**Qué dice el legajo.**
- El nutricionista accede a los datos «de su Alcance, con el detalle que su práctica requiere» (08:145). La matriz marca Nutrición Ⓐ para evaluación, objetivo, plan e ingesta (08:197-198) y agrega: «en caso dudoso, deny» (08:215).
- El Plan se relaciona con el profesional que lo emitió (REG-06-102), y un profesional nuevo no hereda acceso (RF-025).
- Nada dice qué ve un segundo nutricionista con su propio vínculo, B2 y A3 vigentes con el mismo asesorado: si la evaluación, el plan y la ingesta del primero son «de su Alcance».

**Opciones.**
- **A.** Cada profesional ve solo lo propio: sus evaluaciones, objetivos, planes, las ingestas registradas contra sus planes y sus revisiones. Lo del otro profesional responde el mismo 404 que un recurso inexistente. La decisión queda auditada con el titular, para que el asesorado pueda saber quién lo intentó (08:491). Además, dos nutricionistas no pueden tener planes vigentes a la vez con el mismo asesorado (409 ACTIVE_PLAN_CONFLICT; RF-031: sin vigencias contradictorias).
- **B.** Todo profesional con B2 vigente en Nutrición ve todo lo nutricional del asesorado, también lo del otro profesional.

**Provisorio en código.** A: es el lado que no viola una garantía (08:215).

**Condición de cierre.** El 08 define si los datos de un alcance se comparten entre profesionales del mismo alcance.

## DL-058 — El núcleo operable de antropometría vive en material declarado «NO APROBADO»

**Prioridad:** alta · **Documento:** 06 §20 · 04 v0.4.2.1 · 08 §56 · 10 B10-07 · **Estado:** DECIDIDA 2026-09-20 (opción A)

**Qué dice el legajo.**
- Las dos máquinas que hacen operable el dominio —`EN_PREPARACION → REGISTRADA` (REG-06-214) y `VIGENTE → ANULADA` (REG-06-217/218)— viven íntegras en el parche §20 del 06, que cierra con «BORRADOR DE PARCHE TRANSVERSAL — NO APROBADO» e «IMPLEMENTACIÓN: NO AUTORIZADA» (06:8941-8986).
- El 04 del repositorio es el parche v0.4.2.1: «NO APROBADO», «Canonización de esta versión: NO AUTORIZADA» (04:6, 04:17).
- El §56 del 08 (retoma del borrador, actor de la anulación, no reversibilidad) está en la misma condición (08:1703-1706).
- Y sin embargo el inventario del 09 v0.16.1 y el 11A ya dan esas operaciones y esas pruebas por vigentes.

**Por qué importa.** Sin ese material no hay borrador (adversarial 10), no hay anulación (adversarial 6) y RF-050 —P0, «núcleo no recortable»— queda cubierta a medias.

**Opciones.**
- **A.** Dirección declara por acta del paquete que WP-05 implementa el §20 del 06 y el §56 del 08 como material vigente para implementación, con la cita de cada REG e INV usado. Es el mismo criterio con el que WP-03 y WP-04 usaron el 10, no canónico, aprobado por hash en ACTA-DIR-026.
- **B.** Implementar solo la baseline aprobada: evaluación sin borrador y medición sin anulación. No cierra DL-042 y contradice E2E-06.

**Resolución — 2026-09-20.** Dirección delegó la elección en el ejecutor. Se tomó la **opción A**: WP-05 implementa el §20 del 06 (ANT-DRAFT y ANT-VOID) y el §56 del 08 como material vigente para implementación, con la cita de cada REG e INV en el código y en las pruebas. Es el mismo criterio con el que WP-03 y WP-04 usaron el 10, no canónico. Si Dirección prefiriera la opción B, el cambio es acotado: se quitan las operaciones de borrador y la de anulación, y DL-042 queda sin cerrar.

**Condición de cierre.** El acta del paquete, o la canonización del parche §20.

## DL-059 — Qué responde la segunda anulación de la misma medición

**Prioridad:** alta · **Documento:** DV-05:1127 · 05:10879-10881 · 09v16:1959-1974 · **Estado:** DECIDIDA 2026-09-20 (opción A)

**Qué dice el legajo.**
- DV-05 garantiza, y es uno de los casos que se ejecutan **en vivo ante el tribunal**: «La segunda no produce un segundo efecto ni un error nuevo» (DV-05:1127).
- El 05 dice «BE no produce un segundo efecto silencioso» (05:10879-10881).
- El 09 consolidado tipifica un error para ese caso (09v16:1959-1974), y el 11A lo enuncia como «doble anulación no duplica efecto lógico» (11A:581).

**Por qué importa.** Un 422 en vivo contradice la promesa que el propio documento de defensa le hace al tribunal.

**Opciones.**
- **A.** Idempotencia en dos capas: con la misma `Idempotency-Key` se replica la respuesta original; con una clave nueva sobre una medición ya anulada se responde `200` con la anulación existente, sin segundo evento ni segundo recálculo. El código tipificado del 09 queda para los rechazos reales (medición inexistente, actor sin autorización).
- **B.** Error tipificado siempre (`422 ANTHROPOMETRY_ANNULMENT_NOT_ALLOWED`). Cumple el 09 literal y contradice a DV-05.

**Provisorio en código.** A: es la única lectura que satisface los tres textos a la vez.

**Resolución — 2026-09-20.** Dirección delegó la elección en el ejecutor. Se tomó la **opción A**: idempotencia en dos capas. Con la misma `Idempotency-Key` se replica la respuesta original; con una clave nueva sobre una medición ya anulada se responde `200` con la anulación existente y `alreadyAnnulled: true`, sin segundo evento ni segundo recálculo. El código tipificado del 09 queda reservado para los rechazos reales. Es la única lectura que satisface a la vez a DV-05, al 05 y al 09.

**Condición de cierre.** Dirección elige, o el 09 reconcilia su código de error con DV-05.

## DL-060 — Sin fila de pertinencia para antropometría, y «ausencia de fila: Deny»

**Prioridad:** alta · **Documento:** 08:200 · 08:304 · **Estado:** DECIDIDA 2026-09-20 (opción A)

**Qué dice el legajo.**
- La matriz de acceso del §11 otorga a Prof. Nutrición y a Prof. Entrenamiento «Ⓐ si su Alcance lo habilita» sobre «Mediciones/cálculos antropométricos» (08:200).
- Pero la matriz de pertinencia del §11-bis es una allowlist: «**Ausencia de fila: Deny**» (08:304), y no existe fila para antropometría.
- Esa matriz es «**Propietario: Dirección, por acta**» (08:304): no la define el ejecutor ni el producto.

**Por qué importa.** Define quién ve el dato más sensible del paquete (C4 SENSIBLE/SALUD, 08:162).

**Opciones.**
- **A.** Safe default: registrar, corregir, anular y **leer** exigen capacidad antropométrica habilitada sobre ese asesorado, con vínculo, B2 del alcance ANTROPOMETRIA y A3 vigentes. Un profesional de Nutrición o Entrenamiento sin la capacidad recibe el mismo 404 que ante lo inexistente.
- **B.** Habilitar la lectura por el alcance propio (Nutrición o Entrenamiento), publicando la fila de pertinencia por acta.

**Provisorio en código.** A: es el default que pide el propio 08 y no concede un acceso que nadie escribió.

**Resolución — 2026-09-20.** Dirección delegó la elección en el ejecutor. Se tomó la **opción A**: safe default. Registrar, corregir, anular **y leer** exigen capacidad antropométrica habilitada sobre ese asesorado, con vínculo, B2 del alcance ANTROPOMETRIA y A3 vigentes. Un profesional de Nutrición o Entrenamiento sin la capacidad recibe el mismo 404 que ante lo inexistente. Si Dirección publica la fila de pertinencia habilitando la lectura por alcance propio, el cambio es una condición más en el PDP.

**Condición de cierre.** Dirección publica la fila de pertinencia de antropometría, o ratifica el safe default.

## DL-061 — `formulaVersionId` obligatorio en el derivado y sin operación que lo descubra

**Prioridad:** media · **Documento:** 09v11:272 · 09v11:202-216 · **Estado:** **DECIDIDA** 2026-09-20, opción A (Dirección)

**Qué dice el legajo.** El schema `DerivedAnthropometricResult` obliga a persistir `formulaVersionId` (`frmv_…`, 09v11:272) junto al `methodVersionId`. Ninguna operación lo descubre: `AnthropometrySpecificationSummary` expone `specificationId` y `versionId`, no la fórmula (09v11:202-216). Un grep de `frmv_` sobre el consolidado v0.16 devuelve cero ocurrencias.

**Por qué importa.** Es un campo obligatorio que el cliente no puede obtener de ninguna parte.

**Opciones.**
- **A.** La especificación expone sus fórmulas con su versión, y `formulaVersionId` sale de ahí: API-ANT-01 devuelve, por método, las versiones de fórmula admitidas.
- **B.** `formulaVersionId` es interno: lo resuelve el servidor a partir de `methodVersionId` y no viaja en el request.

**Provisorio en código.** A, porque hace reproducible el resultado sin que el cliente invente identificadores.

**Materializado en WP-05.** La versión de método publica su regla de dominio con identificador versionado (`ruleId`, en API-MTH-01 y API-MTH-02), y la corrida la guarda tal como se aplicó (`ejecucion_de_calculo.regla`). El cliente no inventa nada y no la envía: la elige eligiendo la versión del método. Con eso, REG-06-156 queda satisfecho —«Fórmula/regla de dominio aplicable identificada y versionada»— sin crear un identificador `frmv_` que el legajo no define en ninguna operación. La deuda sigue abierta porque el nombre del campo en el 09v11 es otro; lo que está resuelto es la garantía.

**Decisión de Dirección (2026-09-20): opción A.** La regla versionada que publica el método (`ruleId`) cumple el rol de identificar la fórmula aplicada. REG-06-156 queda satisfecho y auditable. Lo que permanece como diferencia es el **nombre del campo**: el 09v11 lo llama `formulaVersionId` con formato `frmv_…`, y ninguna operación del 09 lo entrega.

## DL-062 — `preparationReference` obligatorio en la importación, sin entidad ni API

**Prioridad:** baja · **Documento:** 09v11:309-332 · 09v16:1980-2000 · 06:6507 · **Estado:** **DECIDIDA** 2026-09-20, opción A (Dirección)

**Qué dice el legajo.** El origen `CONTROLLED_IMPORT` exige `source.preparationReference` (`prep_…`) con procedencia reconstruible, pero el consolidado aclara que el parche «no crea una entidad/API de import-preparation» y que la referencia puede ser opaca. INV-06-167 se viola si se exige un formato o columnas concretas (06:6507).

**Opciones.**
- **A.** WP-05 implementa solo el valor de origen y la conservación de procedencia; el flujo de carga va al paquete de integraciones, con RF-028 (DL-056).
- **B.** Definir acá una entidad de preparación mínima.

**Provisorio en código.** A.

**Decisión de Dirección (2026-09-20): opción A.** El flujo de carga va al paquete de integraciones, junto con RF-028 (DL-056). WP-05 conserva el valor de origen `CONTROLLED_IMPORT` y la referencia de preparación como texto opaco. El legajo **prohíbe** fijar formato o columnas (INV-06-167), así que diseñar la entidad sin un caso real de importación sería inventar una forma que después habría que deshacer.

## DL-063 — El borrador antropométrico no tiene plazo de expiración declarado

**Prioridad:** media · **Documento:** 08:1368, 1374, 1482, 1497 (R-18) · **Estado:** **DECIDIDA** 2026-09-20, opción A (Dirección)

**Qué dice el legajo.** R-18 dice que los residuos de preparación quedan «suprimidos tras [PARÁMETRO: plazo operativo corto a fijar antes de datos reales]» (08:1368) y que «el parámetro debe quedar configurado antes del primer dato real» (08:1374). El riesgo R-08-17 queda abierto.

**Por qué importa.** Un borrador con datos de salud que no expira es un residuo permanente.

**Opciones.**
- **A.** WP-05 no implementa expiración —el ambiente es sintético— y deja el punto declarado, con el campo de momento de creación listo para aplicarla.
- **B.** Fijar un plazo provisorio (por ejemplo, 30 días) y purgar.

**Provisorio en código.** A, con la constancia explícita de que el parámetro debe fijarse antes de cualquier dato real.

**Decisión de Dirección (2026-09-20): opción A.** No se implementa expiración mientras el ambiente sea sintético.

> **Condición que sobrevive a esta decisión.** Es la única deuda del paquete con un vencimiento que no controlamos: el plazo **tiene que quedar fijado antes de que entre el primer dato real de una persona**, y hasta entonces R-08-17 sigue abierto. Decidir «no implementar» no cierra el riesgo, lo posterga con fecha. Si BE sale de datos sintéticos sin este parámetro, un borrador con datos de salud queda como residuo permanente.

## DL-064 — La «evaluación de compatibilidad» es obligatoria y no está modelada como objeto

**Prioridad:** media · **Documento:** 06:6350-6359 · 06:6513 · **Estado:** **DECIDIDA** 2026-09-20, opción A (Dirección)

**Qué dice el legajo.** REG-06-162 exige, para comparar dos observaciones, «una evaluación explícita y justificable de compatibilidad» que conserve especificación, versionado y fundamento sobre protocolo, método, versión y unidad. El 06 no la modela como entidad y el 09 la deja como `comparabilityMetadata: {}` (09v11:664-706).

**Opciones.**
- **A.** Modelarla como metadato calculado por tramo: la serie declara, por cada par de puntos consecutivos, si son comparables y por qué no, sin persistir una entidad nueva.
- **B.** Entidad persistente de evaluación de compatibilidad, con autoría y fundamento.

**Provisorio en código.** A: cubre el invariante (lo no comparable se marca y no se fuerza) sin inventar una entidad que el 06 no declara.

**Decisión de Dirección (2026-09-20): opción A.** La compatibilidad se resuelve como metadato calculado por tramo: cada punto declara su grupo y, si no es comparable con el anterior, por qué no. Cubre el invariante —lo no comparable se marca y no se fuerza— sin crear una entidad que el 06 no declara. La alternativa habría exigido que un profesional firme cada comparación entre dos puntos consecutivos.

## DL-065 — Siete de los once TEST-ANT son solo un título de una línea

**Prioridad:** alta · **Documento:** 11A:573-587 · 11A:155-169 · **Estado:** **DECIDIDA** 2026-09-20, opción A (Dirección)

**Qué dice el legajo.** El 11A §16 enuncia los once escenarios como títulos, sin ninguno de los trece campos que su propia §6 declara obligatorios (11A:155-169). DV-05 materializa cuatro y lo admite: «Antropometría | 4 | 11» (DV-05:1144). TEST-ANT-005 a 011 no tienen oráculo en ninguna parte.

**Por qué importa.** Un paquete P0 no puede cerrarse contra pruebas que no existen.

**Opciones.**
- **A.** WP-05 escribe los siete oráculos faltantes con la plantilla de 11A §6, como entregable de legajo del paquete, y los implementa.
- **B.** Implementar según el título y dejar el oráculo sin escribir.

**Provisorio en código.** A.

**Decisión de Dirección (2026-09-20): opción A.** Se redactan los siete oráculos faltantes (TEST-ANT-005 a 011) con la plantilla de 11A §6 y quedan como entregable de legajo. El comportamiento ya está cubierto por pruebas que pasan; lo que falta es la **declaración de qué tenían que probar**, que es lo que una mesa puede exigir. Queda como trabajo pendiente del próximo tramo.

## DL-066 — El adversarial 10 no tiene test que pruebe el borrador **de otro profesional**

**Prioridad:** alta · **Documento:** DV-05:1131 · 08:1330-1341 · **Estado:** **DECIDIDA** 2026-09-20, opción A (Dirección)

**Qué dice el legajo.** El adversarial 10 («Consultar un borrador de evaluación de otro profesional» → «No aparece: ni como bloqueado, ni como existente») declara como fuente «TEST-ANT-\* · 08 §56.5». Los dos candidatos del 11A —TEST-ANT-002 «draft no aparece como registrada» y TEST-DOM-004 «EN_PREPARACION ≠ REGISTRADA»— prueban otra cosa: que el borrador **propio** no cuenta como registrado, no que el **ajeno** sea indistinguible de inexistente.

**Opciones.**
- **A.** WP-05 deriva el oráculo del 08 §56.5 y lo escribe como TEST-ANT-012, con el mismo criterio de oráculo derivado que WP-04 usó para «reabrir una versión activada falla» (DL-027).
- **B.** Reinterpretar TEST-ANT-002 en sentido amplio.

**Provisorio en código.** A.

**Decisión de Dirección (2026-09-20): opción A.** Se escribe el oráculo derivado del 08 §56.5 como **TEST-ANT-012**, con el mismo criterio que WP-04 usó en DL-027. Ya está implementado y pasa en CI y en vivo (captura `web-19`). Reinterpretar TEST-ANT-002 habría sido afirmar que está probado algo que no lo está, y justo en la garantía de privacidad más fuerte del sistema: la diferencia entre «no lo ves» y «no existe».

## DL-067 — El adversarial 7 de mediciones no tiene ID de test asignado

**Prioridad:** media · **Documento:** DV-05:1128 · 11A:540, 584, 625 · **Estado:** **DECIDIDA** 2026-09-20, opción A (Dirección)

**Qué dice el legajo.** DL-042 asigna a WP-05 «el 7 en su variante de evolución de mediciones (INV-06-176)» sin nombrar un TEST. Hay cuatro candidatos con el mismo invariante detrás: TEST-DOM-001, TEST-ANT-009, TEST-ANT-010 y el de proyecciones.

**Opciones.**
- **A.** El oráculo ejecutable es **TEST-ANT-009** («SIN_DATO no se transforma en cero») complementado con TEST-ANT-010 («no comparable no forma línea continua»), y así se declara en la evidencia.
- **B.** Ejecutar el de proyecciones, que está fuera de alcance.

**Provisorio en código.** A.

**Decisión de Dirección (2026-09-20): opción A.** El oráculo ejecutable es **TEST-ANT-009** complementado con **TEST-ANT-010**, y así queda declarado en la evidencia. El candidato de proyecciones está fuera de alcance: son M-11 e INV-06-182 prohíbe que B-10 modele proyección.

## DL-068 — Nadie define quién autoriza **crear** y **registrar** la evaluación

**Prioridad:** alta · **Documento:** 08:200, 1332, 1385, 1525 · **Estado:** **DECIDIDA** 2026-09-20, opción A (Dirección)

**Qué dice el legajo.** El 08 gobierna con lista de condiciones la retoma del borrador (§56.5.1), la anulación (§56.6.1) y la ejecución de métodos (§56.3.1), pero no hay lista equivalente para el acto de **registrar** la evaluación. La fila del §11 solo declara quién puede ver.

**Opciones.**
- **A.** Se aplica la misma lista que el 08 fija para la retoma del borrador: capacidad antropométrica habilitada, vínculo aceptado, B2 del alcance y A3 vigentes, evaluadas en la transacción de escritura. Es el conjunto que ya evalúa el PDP.
- **B.** Esperar a que el 08 publique la lista.

**Provisorio en código.** A.

**Decisión de Dirección (2026-09-20): opción A.** Se aplica la misma lista que el 08 fija para la retoma del borrador: capacidad antropométrica habilitada, vínculo aceptado, B2 del alcance y A3 vigentes, evaluados dentro de la transacción de escritura. **Registrar es más sensible que retomar**, no menos: es el acto que vuelve el dato inmutable e histórico, y dejarlo con menos gobierno que la operación previa habría sido el peor resultado.

## DL-069 — Objetos `{}` vacíos en los contratos de lectura de ANT-03, ANT-04 y ANT-06

**Prioridad:** media · **Documento:** 09v11:534-538, 563-569, 726-748 · **Estado:** **DECIDIDA** 2026-09-20, opción A (Dirección)

**Qué dice el legajo.** Varias respuestas dejan la forma sin definir: ANT-03 con `author{}` y `summary{}`; ANT-04 con `specification{}` y `comparabilityMetadata{}`; ANT-06 con `period{}` y `comparability{}`. No se puede escribir una prueba de contrato sobre un objeto vacío.

**Opciones.**
- **A.** WP-05 define la forma mínima de cada uno, la declara en el paquete y la publica en `docs/api/openapi.json`, como WP-04 hizo con DL-055.
- **B.** Devolver los objetos vacíos tal cual.

**Provisorio en código.** A, con la forma declarada en esta definición.

**Decisión de Dirección (2026-09-20): opción A.** WP-05 define la forma mínima de cada objeto y la publica en `docs/api/openapi.json`, generado desde `@be/domain`. Mismo criterio que WP-04 con DL-055. Sobre un objeto vacío no se puede escribir una prueba de contrato, y el contrato es la mitad de la evidencia del proyecto.

## DL-070 — La evolución devuelve un bloque por métrica y el 09 declara una por respuesta

**Prioridad:** media · **Documento:** 09v11:713-757 · 04:583 · **Estado:** **DECIDIDA** 2026-09-20, opción A (Dirección)

**Qué dice el legajo.** API-ANT-06 se declara `GET …/progress?metric=&periodStart=&periodEnd=` y su respuesta lleva `metricCode` en la raíz, con una sola serie: una métrica por llamada (09v11:713, 726-748).

**Qué hace BE.** Devuelve `metrics`, un array con un bloque por métrica, cada uno con la forma que el 09 declara para una: `metricCode`, `series`, `gaps` y `comparability.groups`.

**Por qué importa.** No es un capricho: **el asesorado no tiene ninguna operación para descubrir sus métricas**. RF-049 lo nombra como actor de su propia evolución y la APK consume la lectura propia, que es una extensión de BE (04:583) y no está en el inventario del 09. Con una métrica obligatoria por llamada, la app no sabría qué pedir. El profesional sí podría descubrirlas por ANT-03, que publica `summary.metrics`.

**Opciones.**
- **A.** Mantener `metrics[]` en las dos lecturas, como está, y registrar la diferencia.
- **B.** Exigir `metric` en API-ANT-06 y sumar una operación de descubrimiento de métricas para el asesorado, que el 09 no declara.

**Provisorio en código.** A. La forma de cada bloque es exactamente la del 09, así que la diferencia es de cardinalidad, no de modelo: un cliente que pida una métrica recibe un array de uno.

**Decisión de Dirección (2026-09-20): opción A.** Se mantiene `metrics[]` en las dos lecturas. La razón decisiva: **el asesorado no tiene ninguna operación en el 09 para descubrir qué métricas tiene** —el profesional sí, por ANT-03— y la lectura propia es una extensión de BE que el inventario no cubre. Con una métrica obligatoria por llamada, la APK no sabría qué pedir. La forma de cada bloque es exactamente la del 09: la diferencia es de cardinalidad, no de modelo.

## DL-071 — ANT-05 no acepta el lote de correcciones ni los metadatos reconstruibles

**Prioridad:** media · **Documento:** 09v11:592-605, 664 · **Estado:** **DECIDIDA** 2026-09-20, opción A (Dirección)

**Qué dice el legajo.** El request de API-ANT-05 lleva un array `corrections`, cada una con su `targetType` y su `targetId`, y admite corregir «metadatos reconstruibles cuando el patrón canónico lo permita» (09v11:605). Declara además un `422 CORRECTION_CHAIN_NOT_RESOLVABLE` (09v11:664).

**Qué hace BE.** La ruta es la del legajo —sobre la evaluación— y el cuerpo lleva un solo `targetId`, siempre una medición directa. La cadena no resoluble no se emite porque la base impide construirla: no hay forma de bifurcar una cadena de correcciones (índices `una_raiz` y `correccion_previa_id` únicos).

**Opciones.**
- **A.** Sumar el lote y `targetType` en un paquete posterior, cuando exista más de un tipo de objetivo corregible.
- **B.** Implementarlo ahora, con un solo `targetType` posible, que sería una lista de un elemento con un campo constante.

**Provisorio en código.** A: hoy el único objetivo corregible es la medición directa, y un lote de un solo tipo no agrega garantía. El día que haya metadatos corregibles, el cuerpo cambia a la forma del 09.

**Decisión de Dirección (2026-09-20): opción A.** ANT-05 corrige de a un objetivo. El lote y `targetType` entran cuando exista más de un tipo corregible; hoy sería una lista de un elemento con un campo constante. El `422 CORRECTION_CHAIN_NOT_RESOLVABLE` que el 09 declara **no se emite porque la base impide construir el estado**: los índices `una_raiz` y `correccion_previa_id` únicos hacen imposible bifurcar una cadena. Es una garantía más fuerte que el error.

## DL-072 — ANT-01 filtra por `kind` y el 09 declara `status`

**Prioridad:** baja · **Documento:** 09v11:336-339 · **Estado:** **DECIDIDA** 2026-09-20, opción A (Dirección)

**Qué dice el legajo.** `GET /anthropometry/specifications?limit=&cursor=&status=`.

**Qué hace BE.** Publica `kind` con enum `PROTOCOL|METHOD`, que es lo que la pantalla necesita para separar protocolos de métodos, y no publica `status`, porque la vigencia se deriva de la cadena de versiones: el catálogo lista solo las terminales.

**Opciones.**
- **A.** Sumar `status` como filtro y conservar `kind`.
- **B.** Reemplazar `kind` por `status` y separar protocolos de métodos por otra vía.

**Provisorio en código.** A pendiente: hoy está solo `kind`. El costo de sumarlo es bajo, y la decisión de qué significa `status` para una especificación versionada conviene tomarla junto con DL-064.

**Decisión de Dirección (2026-09-20): opción A.** Se suma `status` como filtro y se conserva `kind`. Con DL-064 ya decidida, `status` para una especificación versionada significa vigente o histórica, **derivado de la cadena de versiones**, nunca una columna editable. **Es la única de las trece con trabajo pendiente de implementar**: hoy el catálogo publica solo `kind`.

## DL-073 — El 10 declara la carga en formulario y Dirección pide la carga sobre la figura

**Prioridad:** media · **Documento:** 10-B10-07 · `docs/direccion/UI-ANTROPOMETRIA.md` · **Estado:** **DECIDIDA** 2026-09-20, opción A (Dirección)

**Qué dice el legajo.** El B10-07 declara la toma antropométrica como un formulario: una lista de métricas con su valor y su unidad, con el protocolo y el momento a nivel de la evaluación. Es lo que WP-05 implementó y lo que prueban las capturas `web-04` a `web-08`.

**Qué pide Dirección.** Una silueta con los puntos de toma marcados, donde el valor se escribe en el punto mismo o en un campo pegado a él, con tema claro y azul (`#2E8FFF`). La referencia es `docs/direccion/BE-VIS-Compositor_v13.3.html`, recibida el 2026-09-20, después del cierre funcional de WP-05.

**Por qué es una tensión y no solo un cambio de pantalla.** La figura introduce una superficie donde cada punto del cuerpo puede recibir estado visual, y el paso de «acá va el pliegue subescapular» a «este pliegue está alto» es de un color. RF-048 y INV-06-06 prohíben esa lectura. Cualquier implementación de esta instrucción tiene que dejar la figura como **ubicación**, nunca como **calificación**.

**Opciones.**
- **A.** Implementarla en un paquete de refinamiento de UI posterior al circuito funcional, reutilizando intactos los contratos ANT de WP-05: la figura cambia cómo se escribe el valor, no qué se manda ni qué se garantiza. La prueba de cero juicio se extiende al color y a las etiquetas de la figura.
- **B.** Implementarla ahora, reabriendo las pantallas de WP-05 antes de seguir con las verticales que faltan.

**Provisorio en código.** Ninguno: WP-05 quedó con el formulario del 10, que cumple la garantía. La instrucción queda registrada con su referencia versionada para que el paquete de UI la tome completa. Recomendación del ejecutor: **A**, porque el circuito funcional todavía tiene verticales sin cubrir y la figura no agrega ninguna garantía que el formulario no dé; agrega ergonomía, que rinde más cuando ya están todas las pantallas que la van a usar.

**Decisión de Dirección (2026-09-20): opción A.** La figura entra en un paquete de refinamiento de UI posterior al circuito funcional. WP-05 no se reabre y la vertical de entrenamiento (WP-06) sigue primero.

> **Condición que hereda el paquete de UI.** La figura es **ubicación, nunca calificación**. Un punto del cuerpo pintado por rango —verde, amarillo, rojo— sería el juicio que RF-048 e INV-06-06 prohíben, y llegaría por un camino que ninguna prueba de copy mira hoy, porque el color no es texto. Cuando se implemente, la prueba de cero juicio tiene que extenderse al color y a las etiquetas de la figura, no solo al copy.

**Cierre (2026-09-24, tramo D de `docs/paquetes/WP-IDENTIDAD-VISUAL.md`).** La toma de «En preparación» se hace sobre la figura, y la tensión con el 10 se resolvió con el propio 10: B10-07 §18 admite «ilustraciones, maniquíes, marcadores» como ayuda de interacción, con la regla «asset visual ≠ definición del punto/medición».
- **Qué se mide lo declara el protocolo.** La figura dibuja los puntos de las métricas del protocolo elegido que sabe ubicar (`SITIOS_DE_LA_FIGURA` en `@be/domain`), y nada más. El protocolo de laboratorio de WP-05 solo declara peso y talla, así que se agregó un segundo protocolo sintético, «Pliegues y perímetros (demostración)», con nombre y familia por métrica (B10-07 §15) y el mismo rótulo de REG-06-157 (migración `20260924130000_protocolo_de_pliegues_y_perimetros`).
- **Ubicación, nunca calificación.** `puntosDeLaFigura` recibe qué claves tienen dato, no los valores: por construcción, un punto no puede pintarse por rango. Lleno o vacío, siempre del mismo color; el que se está cargando lleva un halo. La prueba de cero juicio se extendió a la figura (`figura-antropometrica.test.ts`: un punto solo lleva sitio, nombre y si tiene dato), y el recorrido en el navegador verificó que dos pliegues con 8,5 mm y 31 mm se ven idénticos.
- **La tabla equivalente obligatoria** (B10-10 §11) es la lista densa de B10-07 §16, agrupada por familia: es también el camino del teclado y del lector de pantalla. Tocar un punto lleva a su campo.
- **Los contratos de WP-05 no cambiaron.** Lo que el protocolo no declara se sigue cargando libre, en «Otras mediciones».
- Dirección había pedido **tema claro y azul** para esta pantalla: la figura usa el azul de su referencia (`#2E8FFF`) sobre una tarjeta blanca, con su contraste verificado por `scripts/contraste.test.cjs`. La silueta es propia: las imágenes del compositor no se usaron porque su origen y su licencia no están documentados.

## DL-074 — El núcleo operable de entrenamiento vive en material no aprobado

**Prioridad:** alta · **Documento:** 05:109-113 · 05:9969 · B10-06:8-10 · **Estado:** **DECIDIDA** 2026-09-21 · opción A, como DL-058

**Qué dice el legajo.** - El candidato **05 v0.15 está «NO APROBADO / NO CANONIZADO»** (05:109-113), mientras la baseline v0.14 sí está aprobada y canonizada.
- El bloque §9 del 05, que es el circuito entero de entrenamiento, cierra con **«PENDIENTE DE REVISIÓN DE DIRECCIÓN»** (05:9969) y lista diez puntos que Dirección debe confirmar (05:9939-9952). Esa acta no está registrada.
- Los tres documentos de UX son **«BORRADOR UX — NO CANÓNICO»** con **«Implementación: NO AUTORIZADA»** (B10-06:8-10).

**Por qué importa.** Es exactamente la condición que WP-05 resolvió con DL-058: todo el contenido técnico del paquete está ahí, y no hay otro.

**Opciones.**
- **A.** Implementar con el material disponible y declararlo, como en WP-05. La aprobación formal queda como el trámite de Dirección que es, sobre lo ya construido.
- **B.** Esperar la aprobación formal antes de escribir código.

**Decisión de Dirección (2026-09-21): opción A.** Misma solución que DL-058. B detiene el proyecto sin cambiar el contenido de lo que hay que construir.

## DL-075 — Los seis TEST-TRN son títulos de una línea, y entrenamiento no figura en la matriz de DV-05

**Prioridad:** alta · **Documento:** 11A:562-571 · 11A:151-169 · DV-05:1137-1148 · **Estado:** **DECIDIDA** 2026-09-21 · opción A · se escriben los seis oráculos

**Qué dice el legajo.** El 11A §15 enuncia los seis escenarios de entrenamiento como **títulos de una línea** (11A:562-571), sin ninguno de los trece campos que su propia §6 declara obligatorios (11A:151-169). Y la matriz de cobertura de DV-05 (DV-05:1137-1148) enumera nueve alcances: **entrenamiento no es uno de ellos**. La cadena `TEST-TRN` aparece en **un solo archivo de todo el repositorio**.

**Por qué importa.** Es peor que antropometría en proporción —allá eran siete de once y DV-05 al menos declaraba su déficit («Antropometría | 4 | 11»)— aunque el número absoluto sea menor. Acá el hueco es menos visible porque nadie lo declaró, no porque sea menor. Un paquete P0 no puede cerrarse contra pruebas que no existen.

> **Y el problema es más grande que entrenamiento.** Un barrido del repositorio completo muestra que **la §6 del 11A nunca se aplicó a ninguna de las tres familias de dominio**:
>
> | Familia | Estado en el 11A | Qué pasó |
> |---|---|---|
> | `TEST-NUT-001` a `006` (11A:554-559) | Seis títulos de una línea | **WP-04 los materializó a mano sin declarar deuda** |
> | `TEST-ANT-001` a `011` (11A:576-586) | Once títulos; DV-05 materializó cuatro | WP-05 escribió los siete faltantes — DL-065 |
> | `TEST-TRN-001` a `006` (11A:565-570) | Seis títulos de una línea | Esta deuda |
>
> Entrenamiento sería el **tercer paquete consecutivo** en escribir a mano los oráculos que el 11A declara obligatorios y no porta. Eso ya no es una excepción por dominio: es un hueco estructural del propio documento de pruebas, que su DoD no detecta porque exige que todo RF tenga un `TEST-RF` y todo UC un `TEST-UC`, **pero no exige que los escenarios de dominio porten los trece campos de su propia §6** (11A:777-793).
>
> **Condición de cierre de esta deuda, entonces, es más amplia:** que el 11A incorpore los oráculos de las tres familias y corrija su DoD, no solo los seis de entrenamiento.

**Opciones.**
- **A.** WP-06 escribe los seis oráculos con la plantilla de 11A §6, como entregable de legajo del paquete, y los implementa. Mismo formato y método que `docs/paquetes/WP-05-ORACULOS.md`, ya autorizado por DL-065.
- **B.** Implementar según el título y dejar los oráculos sin escribir.

**Decisión de Dirección (2026-09-21): opción A.** Las seis reglas del 06 de las que se derivan existen y son citables (REG-06-113, 115, 116, 129, 130, 131): no hay que inventar norma, hay que leerla y escribir qué se observa.

## DL-076 — Quién puede corregir una ejecución de entrenamiento

**Prioridad:** alta · **Documento:** 05:9174 · 05:9318-9319 · 08:421 · **Estado:** ABIERTA

**Qué dice el legajo.** El 05 declara el actor de UC-E02 como «Asesorado o profesional autorizado, **según la política que defina el Documento 08**» (05:9174) y lo deriva explícitamente en sus decisiones abiertas (05:9318-9319). **El 08 no define esa política.** El único lugar donde menciona corregir en entrenamiento es para negarlo después de finalizado el vínculo (08:421).

**Por qué importa.** Es el mismo patrón de DL-068 en antropometría: una operación de escritura sin lista de condiciones declarada. Sin decisión, UC-E02 no es implementable sin inventar política.

**Opciones.**
- **A.** El asesorado corrige su propia ejecución, y el profesional con alcance ENTRENAMIENTO también, con la misma lista que gobierna cualquier escritura sobre el dato: especialidad habilitada, vínculo aceptado, B2 y A3 vigentes, evaluados dentro de la transacción. Cuando corrige el profesional, **la autoría real se conserva**: el dato no se atribuye al asesorado (05:9209-9224, V02).
- **B.** Solo el asesorado corrige lo suyo. Deja sin resolver el caso en que el profesional detecta un error de carga.

**Provisorio en código.** A. La variante V02 del propio 05 ya describe la corrección por el profesional y exige conservar la autoría real: el legajo la contempla, solo que no dice quién autoriza. Aplicar la lista de la escritura es el precedente de DL-068, ya decidido.

**Implementado** (API-TRN-20): corrigen el asesorado y el profesional del plan, cada uno con el PDP evaluado en la transacción. Cada corrección guarda su autor y su rol (`ADVISEE` / `PROFESSIONAL`), y la del profesional no se le atribuye al asesorado. Otro profesional del mismo asesorado recibe el mismo 404 que lo inexistente. Pruebas en `entrenamiento.int-spec.ts` («DL-076 · el profesional también corrige…»).

## DL-077 — «Ocurrencia planificada» nunca se define estructuralmente

**Prioridad:** alta · **Documento:** 06:5225 · 06:5235 · **Estado:** ABIERTA

**Qué dice el legajo.** REG-06-115 exige **máximo una** ejecución `REGISTRADA` por (asesorado, versión activada, sesión planificada/**ocurrencia identificable**) (06:5225), y aclara: «Un nuevo intento deliberadamente distinto requiere una ocurrencia identificable distinta; **B-08 no la inventa por timestamp**» (06:5235). Pero el 06 nunca dice qué constituye una ocurrencia ni quién la genera.

**Por qué importa.** Es exactamente el dato que falta para la clave única de la base. Sin definirlo no se puede implementar la unicidad que la regla exige.

**Opciones.**
- **A.** La ocurrencia es (sesión planificada + fecha local de ejecución), declarado explícitamente. Dos ejecuciones de la misma sesión el mismo día chocan; en días distintos, no.
- **B.** La ocurrencia la asigna la planificación: cada sesión lleva su ocurrencia prevista y el asesorado ejecuta contra ella.

**Provisorio en código.** A para P0. B es más fiel a un plan con calendario, pero el 06 no fija que la sesión planificada tenga fecha concreta —el 10 advierte justamente que no se confunda sesión con fecha (B10-06:364-375)—, así que B exigiría inventar una estructura que el modelo no declara.

**Es la misma regla que ya rige en nutrición (DL-049).** Allá la ocurrencia de una ingesta prescripta es (asesorado, versión, fecha local, comida), y «Hoy» no elige en silencio cuando hay más de un día tipo: el asesorado elige con un selector explícito. Entrenamiento hace exactamente lo mismo: la ocurrencia es (asesorado, versión activada, sesión planificada, fecha local), y si el plan tiene varias sesiones, «Hoy» las muestra y el asesorado elige cuál hace — BE no decide por él. Dos dominios, una sola regla: es REG-06-07 aplicado.

**Implementado en la base** (migración `20260921100000`): la unicidad por ocurrencia está **dos veces**, como índice único sobre el borrador de ejecución y otro sobre la ejecución registrada, y además la ejecución es única por borrador. Hay una prueba para cada red en `maquinas-wp06.int-spec.ts`.

**Ampliado al cierre** (migración `20260921210000`): la auditoría del paquete encontró que la unicidad por versión dejaba un hueco el día en que se activa una sucesora. La sucesora conserva los identificadores de sesión, así que ese día la misma sesión existía en las dos versiones y se podía registrar dos veces (06:5233: «un reintento no duplica la sesión»). Ahora, para la persona, la ocurrencia es (asesorado, plan, sesión, fecha local):
- «Hoy» y la lectura por período muestran cada sesión **una vez**: la de la versión donde ya se empezó o se registró, y si no, la de la versión más nueva que regía ese día;
- abrir la de la otra versión es `422 OCCURRENCE_NOT_EXECUTABLE` (`SESSION_STARTED_IN_OTHER_VERSION`), y la base lo vuelve a exigir con un trigger y un cerrojo que serializa dos inserciones simultáneas;
- el horario declarado tiene que caer mientras la versión regía, desde su activación hasta la de su sucesora (06:4351): si no, `OCCURRED_AT_OUTSIDE_PLAN_VERSION`.

## DL-078 — No hay operación para llegar a una ocurrencia que no sea la de hoy

**Prioridad:** alta · **Documento:** 09v10:924 · 09v10:886 · 09v10:188-189, 915 · **Estado:** **DECIDIDA** 2026-09-21 · opción A · se suma la operación

**Qué dice el legajo.** `API-TRN-15` exige un `{occurrenceId}` en la ruta (09v10:924) y **la única operación que lo expone es `GET /me/training/today`** (09v10:886). No existe listado de ocurrencias por rango de fechas ni consulta por identificador.

**Por qué importa.** Consecuencia directa: **no se podría registrar la sesión de anteayer.** Eso choca con dos cosas del propio legajo: la doble temporalidad `occurredAt` / `recordedAt` que consagra (09v10:188-189, 1178-1179), y la regla de que la ausencia de registro no es `NOT_COMPLETED` (09v10:915) — si no hay forma de registrar en diferido, la ausencia se vuelve permanente **por limitación técnica, no por un hecho**, que es justo lo que la regla prohíbe.

**Opciones.**
- **A.** Sumar una lectura de ocurrencias por período, declarada como diferencia con el 09.
- **B.** Ceñirse al contrato: solo se registra la sesión del día, y la limitación queda declarada.
- **C.** Ampliar «Hoy» para que devuelva también las ocurrencias sin registrar de los últimos N días, sin crear una operación nueva.

**Decisión de Dirección (2026-09-21): opción A.** C cambia la semántica de una operación que se llama «today», y B convierte una limitación técnica en un hecho sobre la persona. La operación nueva es aditiva y no toca ninguna ruta declarada.

**Implementado** como `GET /me/training/occurrences?periodStart=&periodEnd=` (`API-TRN-14-PERIODO` en el OpenAPI): hasta 31 días, nunca después de hoy, con el mismo `planState` que «Hoy» para que una lista vacía por acceso suspendido no se confunda con un período sin sesiones. Solo lista los días en que el plan regía. La APK lo usa en «Registrar otro día».

**Al cierre:** la lectura no pagina. El tope de 31 días hace de límite, y el OpenAPI lo dice junto a `periodEnd`, que ahora figura como obligatorio igual que `periodStart` (el servidor ya respondía `400 PERIOD_REQUIRED` sin ellos).

## DL-079 — `prescriptionId` es obligatorio al registrar ejecución y no se puede descubrir

**Prioridad:** alta · **Documento:** 09v10:1053, 1089 · 09v10:888 · **Estado:** ABIERTA

**Qué dice el legajo.** Las dos granularidades del borrador de ejecución exigen `prescriptionId` (09v10:1053 y 1089), y la sustitución de ejercicio se apoya en él (09v10:1110). El único lugar donde podría venir es `plannedSession` dentro de la respuesta de «Hoy»… que está declarado como objeto vacío `{}` (09v10:888).

**Por qué importa.** `API-TRN-09` sí reconstruye el plan desde la instantánea, pero eso obligaría al APK a levantar el plan entero y correlacionar a mano, cosa que el contrato no declara en ningún lado. **Es exactamente el tipo de hueco que en WP-05 produjo el desvío de rutas.**

**Opciones.**
- **A.** Declarar la forma mínima de `plannedSession`, incluyendo las prescripciones con su identificador, y publicarla en el OpenAPI. Mismo criterio que DL-069.
- **B.** Dejar que el cliente correlacione contra el plan completo.

**Provisorio en código.** A. B pone en el cliente una correlación que el contrato no describe, y que cada superficie resolvería distinto.

**Implementado**: `plannedSession` es la sesión de la instantánea con sus prescripciones —identificador, ejercicio, series, criterio, carga sugerida y parámetros—, ubicada en su bloque y su microciclo (`SesionDeOcurrenciaSchema`). Está en el OpenAPI.

## DL-080 — Once objetos `{}` en requests de escritura de entrenamiento

**Prioridad:** media · **Documento:** 09v10:549, 612, 328, 330, 1092, 1095, 1244, 1323, 406 · **Estado:** ABIERTA

**Qué dice el legajo.** El contrato declara sin forma: `assessment` (09v10:549), `objective` (612), `intensity.target` y `target.reference` (328, 351), `professionalParameters` (330), `executionSummary` y `sessionSummary` (1092, 1095), `correction` (1244), `nextAction` (1323), `provenance` (406) y `authorship` (505).

**Por qué importa.** Varios son **deliberados y normativos**, no un olvido: «contenido profesional no fijado por 09» (09v10:202), «no se fija número de series, reps, descansos, cargas o frecuencia; el profesional decide» (09v10:339-340). Eso no los hace implementables. Caso aparte y más grave: **`intensity.target` es el corazón de la prescripción** y el contrato exige validar `INTENSITY_CRITERION_INVALID` (09v10:753) sobre una estructura cuya mitad no está definida.

**Opciones.**
- **A.** Una sola política: se persisten como JSON validado por allowlist, salvo donde el 06 fija estructura —criterio de intensidad, condición de sesión, granularidad—, que sí van tipados. Se declara la forma mínima en el OpenAPI.
- **B.** Fijarle forma a los once, inventando estructura donde el legajo decidió no fijarla.

**Provisorio en código.** A. B contradice la decisión explícita del 09 de no fijar contenido profesional.

## DL-081 — Las 17 zonas musculares no tienen operación de descubrimiento, y DEC-047 no está en el repositorio

**Prioridad:** media · **Documento:** 06:5614-5632 · 06:80, 4103 · 09v12:326-332 · **Estado:** ABIERTA

**Qué dice el legajo.** REG-06-137 fija **17 zonas** con identificador estable y la cardinalidad «9 anterior + 10 posterior − 2 ambas» (06:5614), nombra solo antebrazo y deltoides, y remite las otras quince a `DEC-047`: «B-08 no fija en esta revisión la lista concreta de las otras quince denominaciones» (06:5632). **`DEC-047` no está en el repositorio**: solo se lo referencia por hash (06:80, 06:4103). Y `API-INT-TRN-01` exige `muscleZones[].zoneId` en el request (09v12:326-332) sin que **ninguna de las 27 rutas** liste las zonas.

**Por qué importa.** No se puede poblar un selector ni crear el primer ejercicio sin los identificadores, y no se pueden nombrar las zonas sin el documento que las nombra.

**Opciones.**
- **A.** WP-07 implementa la estructura completa (17 zonas, relación versionada con rol `PRINCIPAL`/`SECUNDARIO`) y suma la operación de descubrimiento que falta, con un catálogo **sintético rotulado como demostración**, igual que el de protocolos y métodos de WP-05. Las denominaciones reales entran cuando llegue DEC-047.
- **B.** Pedir DEC-047 a Dirección antes de empezar WP-07.

**Provisorio en código.** A. La estructura es lo que el paquete garantiza; los nombres son contenido, y rotular el catálogo como sintético ya es el precedente de REG-06-157 en WP-05. **Conecta con DL-073**: REG-06-138 declara que la Zona es entidad de dominio y **no un archivo gráfico**, y que el conjunto femenino reutiliza los mismos 17 identificadores (06:5636) — o sea que la silueta que Dirección pidió para antropometría tiene un uso declarado también acá, sin que una silueta obligue a migrar datos.

## DL-082 — No existe una regla equivalente a REG-06-125 para entrenamiento

**Prioridad:** media · **Documento:** 06:4651-4663 · 06:4958-4965 · 06:226 · **Estado:** ABIERTA

**Qué dice el legajo.** REG-06-125 —«Contraste nutricional descriptivo, nunca evaluativo», con sus cuatro prohibiciones (06:4651-4663)— está redactada **específicamente para nutrición**, y **B-08 no la reutiliza**: la lista de reglas que adopta por referencia es REG-06-97 a 108 (06:4958-4965). Lo más cercano en entrenamiento es `T-06-30`, «sin fórmulas de puntuación» (06:226), que es glosario, no regla del bloque.

**Por qué importa.** La prohibición sí existe, pero **en la UX y no en el modelo**: el 10 declara `score de entrenamiento` prohibido (B10-06:920), `score global` prohibido como invariante (B10-10:56) y `Cumplimiento 85 %` con sustituto `Prescripto vs registrado` (B10-10:134). Una garantía que vive solo en la capa de presentación es más frágil que una que vive en el modelo.

**Opciones.**
- **A.** Aplicar la prohibición por analogía con REG-06-125 y con la lista explícita del 10, y declararla en la definición del paquete en vez de dejarla implícita. Se verifica en contratos, en copy y en respuestas reales, como en los otros dos dominios.
- **B.** Aplicar solo lo que el 10 dice, sin extender la regla del modelo.

**Provisorio en código.** A. Los equivalentes funcionales sí están en el modelo, repartidos: REG-06-131 e INV-06-141 (la ausencia de registro no se infiere como condición), REG-06-130 (el desvío no se clasifica como error) e INV-06-153 con el control falsable `sin_M11`. Lo que falta es el enunciado único.

## DL-083 — La matriz de pertinencia del 08 §11-bis no está instanciada para ENTRENAMIENTO

**Prioridad:** alta · **Documento:** 08:238-246 · 08:304 · 08:291-293 · **Estado:** ABIERTA

**Qué dice el legajo.** El §11-bis del 08 se titula literalmente «Acceso por pertinencia e *Información relevante para la seguridad del entrenamiento*» (08:219): **entrenamiento es su caso testigo**. Enumera en prosa las categorías permitidas —condiciones metabólicas, cardiovasculares y respiratorias, dolor, lesiones, restricciones funcionales, medicación con relevancia directa (08:238-246)— y define la *forma* de la tabla `alcance × categoría → {permitido, nivel_de_detalle}` (08:304). **Pero no publica las filas**, y declara: «**Ausencia de fila → Deny. La matriz es una allowlist, nunca una denylist**» (08:304). La matriz es propiedad de **Dirección, por acta**.

**Por qué importa.** Un PDP literal hoy denegaría incluso la diabetes que la propia prueba P-1 exige permitir (08:999). La contradicción prosa↔allowlist es más aguda que en antropometría (DL-060), porque acá sí hay una lista enumerada que el ejecutor podría verse tentado a codificar **sin acta**.

**Opciones.**
- **A.** WP-06 no implementa la matriz de pertinencia: aplica el safe default que el propio 08 fija mientras VJR-1/VJR-4 sigan abiertas (08:291-293) —solo lo explícitamente clasificado, dudoso → deny— y el plan y la ejecución de entrenamiento se gobiernan con la fila C4 del §11 (08:199), que sí existe. La matriz queda pendiente de acta de Dirección.
- **B.** Codificar las categorías que el §11-bis enumera en prosa, como si fueran la matriz.

**Provisorio en código.** A. B sería que el ejecutor fije por su cuenta el ancho de lo accesible sobre datos de salud, que es exactamente lo que el 08 reserva a Dirección: «el ancho de lo accesible se cambia solo modificando la matriz, por acta» (08:251-255).

## DL-084 — Las variantes de entrenamiento de los adversariales 7 y 8 no tienen ID de test y nunca se ejecutaron

**Prioridad:** media · **Documento:** DV-05:1128-1129 · DL-042 · **Estado:** ABIERTA

**Qué dice el legajo.** El adversarial **8** (buscar un plan ya activado e intentar editarlo) es el propio de entrenamiento y cita `INV-06-04` como fuente (DV-05:1129), que es una regla, no un ID de test. Lo mismo el **7** (DV-05:1128), que cita `INV-06-176`.

**Por qué importa.** Lo que se ejecutó del 8 en WP-04 fue la **variante nutricional**: el plan activado que se intenta editar es un plan de nutrición. La variante de entrenamiento (RF-041) nunca corrió. Con el 7 pasa lo mismo: corrió la nutricional en WP-04 y la de mediciones en WP-05, nunca la de progresión de entrenamiento. La afirmación de MESA-01 de que «los 10 adversariales son ejecutables en vivo» es cierta para las variantes asignadas por DL-042; estas dos son adicionales.

**Opciones.**
- **A.** WP-06 ejecuta las dos variantes de entrenamiento y les asigna oráculo derivado, con el mismo criterio de DL-067.
- **B.** Darlas por cubiertas con las variantes ya ejecutadas en los otros dominios.

**Provisorio en código.** A. Es el adversarial propio del dominio: darlo por cubierto con la variante de otra vertical sería afirmar que está probado algo que no se probó.

## DL-085 — Tres vocabularios para la misma distinción entre lo planificado y lo ejecutado

**Prioridad:** baja · **Documento:** B10-06:46, 773-776 · B10-10:53, 457-461 · **Estado:** ABIERTA

**Qué dice el legajo.** El B10-06 enuncia el invariante como `planificado ≠ ejecutado` (B10-06:46) pero la etiqueta de pantalla dice `Prescripto:` / `Realizado:` (B10-06:773-776). El B10-10 declara el invariante como `prescripto ≠ registrado` (B10-10:53) y el léxico de dominio como `Planificado / Ejecutado / Sustituido / Sin registro` (B10-10:457-461).

**Por qué importa.** Hay que elegir uno para el código y para el diccionario de la prueba de copy, o el control de términos se vuelve inconsistente.

**Opciones.**
- **A.** Adoptar el léxico del B10-10, por ser el más tardío y el transversal.
- **B.** Adoptar el del B10-06, por ser el específico del dominio.

**Provisorio en código.** A.

**Implementado** en `packages/domain/src/copy-entrenamiento.ts`: `Planificado`, `Ejecutado`, `Sustituido`, `Sin registro`. Las pantallas del website y de la APK lo toman de ahí.

## DL-086 — wger, Open Food Facts y el compromiso de dos APIs externas

**Prioridad:** alta · **Documento:** 04:482, 378 · 04:1144 · 04:1130 · DL-056 · **Estado:** **DECIDIDA** 2026-09-21 · wger se implementa en WP-07, no se difiere a un paquete indefinido

**Qué dice el legajo.** RF-038 (wger) es **P0 con la etiqueta «Compromiso académico de integración»** (04:482), *la misma etiqueta literal* que RF-028, Open Food Facts (04:378). Q-API-001 fija: «mínimo adoptado: 2 APIs externas; **Open Food Facts y wger satisfacen el compromiso**» (04:1144). La regla transversal 6 los ata juntos: «deberán demostrar importación, procedencia, caída y fallback» (04:1091).

**Por qué importa.** Es un efecto acumulado que ninguna decisión miró de frente. WP-04 difirió Open Food Facts a un paquete de integraciones (DL-056). Si entrenamiento hiciera lo mismo con wger, **el compromiso académico quedaría en cero**, sin que ninguna de las dos decisiones lo hubiera resuelto. Cada una fue razonable por separado.

**Opciones.**
- **A.** wger se implementa en **WP-07**, el paquete inmediatamente siguiente, no en un paquete de integraciones indefinido. El 04 respalda la secuencia: «implementar luego de diseño con catálogo propio y fallback» (04:1130), que es exactamente el corte entre WP-06 y WP-07.
- **B.** Diferir wger junto con Open Food Facts a un paquete de integraciones, aceptando el cero temporal.

**Decisión de Dirección (2026-09-21): opción A.** Con esto, **Open Food Facts queda como la única integración pendiente** después de WP-07, y el compromiso de Q-API-001 se cumple a la mitad con fecha, en vez de quedar en cero sin fecha.

**Actualización del 2026-09-24 — el efecto acumulado volvió a pasar.** Dos hechos posteriores a esta decisión la dejaron sin ejecutar, otra vez sin que ninguno la mirara de frente:
1. El 2026-09-21 RF-071 tomó el número WP-07 (DL-090) y wger pasó a **WP-08**. ACTA-DIR-034 autoriza «WP-01 a WP-07»: cuando se firmó (2026-09-18), el WP-07 de la ruta *era* wger; con la renumeración quedó fuera del rango literal del acta.
2. El 2026-09-22 Dirección eligió «consolidar y pulir» para los nueve días finales y declaró WP-08 fuera de la entrega.

Resultado: **hoy el compromiso de Q-API-001 está en cero** —ni wger ni Open Food Facts—, que es exactamente lo que esta deuda advertía. RF-028 y RF-038 son P0 «Compromiso académico de integración», y el 09 v0.12 §5-§7 tiene sus cuatro operaciones completas (API-INT-NUT-02/03, API-INT-TRN-02/03). **Pendiente de Dirección:** confirmar si la integración entra en la entrega y bajo qué cobertura del acta.

**Preparado el 2026-09-24:** WP-08 (`docs/paquetes/WP-08.md`) implementa las dos integraciones completas —Open Food Facts y wger, con candidato, revisión, procedencia y fallback— en el PR #72, **sin integrar a `main`** hasta esa confirmación (D-A del paquete). Si Dirección lo confirma, el compromiso de Q-API-001 queda cumplido entero.

## DL-087 — RF-041 es P0 y su criterio de aceptación depende de RF-066, que es P1

**Prioridad:** media · **Documento:** 04:511 · 04:681-689 · DL-051 · **Estado:** ABIERTA

**Qué dice el legajo.** La verificación de aceptación de RF-041 dice «la activación de un proceso nuevo se rechaza cuando excede la capacidad configurada en **RF-066**, sin interrumpir procesos vigentes» (04:511). Pero RF-066 es **P1 — Alta prioridad** (04:681-689). El 04 no resuelve qué pasa con RF-041 si RF-066 se difiere.

**Por qué importa.** Un criterio de aceptación P0 no debería depender de un RF diferible. La misma tensión existe en UC-P11 nutricional, así que conviene resolverla una sola vez.

**Opciones.**
- **A.** Se evalúa la capacidad con lo ya implementado en DL-051: capacidad versionada por profesional con `SIN_LIMITE` por defecto, configurada por servicio interno. En `test` se declara un límite por identidad demo para poder demostrar el rechazo, igual que en WP-04.
- **B.** No evaluar capacidad en la activación del plan de entrenamiento hasta que exista RF-066 completo.

**Provisorio en código.** A. Es el mismo provisorio que ya rige en nutrición por DL-051, y reutilizarlo evita dos comportamientos distintos para la misma regla.

## DL-088 — Las formas que el contrato de entrenamiento no fija, decididas al escribirlo

**Prioridad:** media · **Documento:** 09v10 completo · DL-080 · **Estado:** ABIERTA

**Qué dice el legajo.** El 09 v0.10 fija rutas, tokens y errores, pero deja sin forma buena parte de lo que viaja, a veces a propósito («contenido profesional no fijado por 09», 09v10:202) y a veces por omisión. DL-080 fijó la política general —JSON validado por allowlist, salvo donde el 06 fija estructura— y esta entrada registra **cada decisión concreta** que tomó el código al escribir `packages/domain/src/contratos-entrenamiento.ts`, para que ninguna quede implícita.

**Las decisiones, una por una.**

1. **`planId` designa una versión y `trainingPlanId` el Plan**, con `basedOnPlanId` y `nextReviewAt` al crear. Es DL-046, DL-047 y DL-055 aplicadas por homología (REG-06-07): el 09 dice que entrenamiento «reutiliza el patrón vertical común» y que la diferencia vive en los schemas del dominio (09v10:111-122).
2. **El `occurrenceId` es opaco, lo emite el servidor, y no se guarda: se codifica.** Una ocurrencia existe aunque nadie la haya registrado; guardarla al leer «Hoy» haría que una lectura escriba. Decodificarlo no autoriza nada: el servidor verifica igual que la versión sea del asesorado, que estuviera vigente ese día y que la sesión exista en su instantánea.
3. **El identificador de un nodo del plan tiene alfabeto restringido** (`A-Z a-z 0-9 _ -`, hasta 64). El de la sesión forma parte del `occurrenceId`, y un separador adentro lo volvería ambiguo. Nutrición acepta cualquier texto; acá no se puede.
4. **Abrir el borrador de una ocurrencia ya registrada devuelve `200` con el borrador en `REGISTERED` y el `executionId`**, no un error: «repetir la misma intención devuelve el mismo draft lógico» (09v10:933-935), y el APK necesita llegar a la ejecución.
5. **El borrador solo lo ve su titular.** El profesional ve las ejecuciones registradas, nunca los borradores: un borrador no es evidencia (09v10:980).
6. **`occurredAt` es opcional en el borrador y nunca se inventa.** Si no se declara, al confirmar se usa el comienzo del borrador **solo si fue el mismo día local de la ocurrencia**; si no, confirmar pide declararlo (`OCCURRED_AT_REQUIRED`). La base exige además que el instante caiga en la fecha de la ocurrencia.
7. **`NOT_COMPLETED` se registra sin granularidad y sin datos de entrenamiento.** Obligar a elegir «por serie» o «por ejercicio» para decir que no se entrenó sería registrar un hecho que no ocurrió (REG-06-132). La base lo sostiene con un CHECK en las dos direcciones.
8. **La falta de criterio de intensidad no es un problema al validar.** El B10-06 da «falta criterio de intensidad» como ejemplo de issue (B10-06:582), con la salvedad «cuando aplique» (B10-06:408); REG-06-128 es condicional —«cada Prescripción *que declare* criterio»— y el 06 prevalece sobre el ejemplo de UX.
9. **Rangos de significado, no valores prescriptos:** un %RM está en (0, 100], un RIR objetivo en [0, 10], el esfuerzo percibido registrado en [0, 10], y la carga en `kg` o `lb`. El valor concreto lo decide el profesional; el rango solo descarta lo que no significa nada.
10. **Formas mínimas de los `{}`:** las series prescriptas son una lista con repeticiones fijas o en rango; los «parámetros» del profesional son pares etiqueta–valor, con unidad obligatoria si el valor es numérico (REG-06-111); el resumen agregado y el de sesión son texto; el objetivo es un enunciado.
11. **La corrección lleva el registro corregido completo**, validado con las mismas reglas que la confirmación. El original no se toca, y la vista efectiva es la de la corrección terminal (REG-06-16).
12. **Criterio, condición y granularidad viajan como texto en la entrada**, para que un valor fuera de la taxonomía sea el `422` específico que declara el 09 (`INTENSITY_CRITERION_INVALID`, `SESSION_CONDITION_INVALID`, `EXECUTION_GRANULARITY_INVALID`) con su motivo, y no un `400` que no diga qué se violó. Es lo que ya hace `result` en la revisión.
13. **`missingData` son los días del período sin ninguna ejecución registrada**, como en nutrición. Se presentan como «sin registro», nunca como sesiones no realizadas: el plan no fija qué días se entrena.

**Opciones.**
- **A.** Adoptar el conjunto como está, publicado en el OpenAPI y cubierto por pruebas de dominio.
- **B.** Revisarlas una por una antes de exponer las operaciones.

**Provisorio en código.** A. Ninguna agrega una ruta ni cambia una declarada; todas completan formas que el 09 dejó abiertas, y cada una cita la regla que la sostiene. Las que más pesan para la defensa son la 2, la 6 y la 7, porque son las que impiden que BE invente un hecho.

**Sumadas al cierre, después de la auditoría del paquete contra el 09** (cuatro revisores independientes, `DEFENSA/WP-06.md` §5). Son desvíos que el código ya tenía y que solo estaban en comentarios; ahora quedan declarados.

14. **Nombres de campo.** La evaluación devuelve `professional: {identityId, displayName}` en lugar de `professionalId`, y `evidenceReferences` en lugar de `evidence`; el `authoredBy` del objetivo es un objeto con el nombre visible. Es la forma que ya usan nutrición y antropometría para cualquier actor: un identificador suelto obligaría a cada pantalla a pedir el nombre aparte.
15. **Unidades y rangos son forma, no dominio.** Una carga sin unidad, un RIR de 25 o un parámetro numérico sin unidad son `400 INVALID_REQUEST` con la ruta exacta —la validación de forma que el consolidado ubica antes del PDP (09 v0.16.1:231)—, no el `422` del dominio. La decisión 12 es distinta: allá el 09 nombra un código propio para cada taxonomía. Y `order` no se acepta en la entrada: el orden es la posición en el arreglo, y aceptar los dos permitiría que se contradigan.
16. **Aplicar AJUSTAR o SUSTITUIR con un borrador ya abierto no se aplica** (`422 CONTINUITY_ACTION_NOT_APPLICABLE`). El 09 dice «crea/actualiza draft sucesor» (09v10:1409-1411), pero el 05 lo declara excepción: «combinación incompatible» (UC-I06 E02), sin transición parcial ni evento. Se adopta la lectura estrecha del 05 porque «actualizar» un borrador que el profesional está editando pisaría su trabajo sin avisarle. El camino es activar ese borrador o seguir sobre él.
17. **`SESSION_MFA` se sirve con sesión simple, y `TRAINING_SCOPE_NOT_OPERATIONAL` es el 404 no revelador.** Lo primero, porque el 08 §25 deja el segundo factor opcional en la demo sintética (el mismo criterio que WP-04, WP-05 y DL-055). Lo segundo, porque un 422 que diga «tu Especialidad de Entrenamiento está suspendida» sobre un asesorado ajeno revelaría que el recurso existe (09 v0.16.1 §3.2.1).
18. **`isEffective` es la versión efectiva de un seguimiento abierto.** Después de FINALIZAR la versión sigue ACTIVADA —la historia no se reescribe—, pero ya no rige (06:4297), y el contrato define `isEffective` como «la que ve el asesorado». El contexto de revisión tampoco la lista como plan activo de un período posterior al cierre.
19. **TRN-08 tiene la vista del asesorado** (09v10:696, «proyección según actor»): el titular lista solo las versiones ACTIVADAS de los planes cuyo profesional conserva el acceso, nunca un borrador.
20. **Un reintento con la misma Idempotency-Key vuelve a pasar por el PDP.** No es una forma sino una regla de orden (09 v0.16.1:220-221), y el cambio es transversal: vale para nutrición y antropometría. Revocado el consentimiento, el reintento recibe el mismo 404 que cualquier otro pedido, y con otro cuerpo tampoco hay un 409 que confirme nada.

## DL-089 — Revocado el consentimiento, el asesorado deja de ver su propia historia de entrenamiento

**Prioridad:** media · **Documento:** 08:199 · 08:58 · 05:8944 · **Estado:** **CERRADA** 2026-09-24 · opción A (PR #67)

**Qué dice el legajo.** Dos cosas que tiran para lados distintos. La matriz de acceso del 08 le da al titular acceso pleno a «Plan entrenamiento + ejecución» (08:199), y el fin del vínculo corta al profesional «sin destruir la historia del asesorado» (08:58). Pero UC-P17 pide, para ejecutar, «vínculo y consentimiento vigentes» (05:8944).

**Qué pasa hoy.** Las lecturas del titular —su ejecución registrada (TRN-19) y su plan activado (TRN-09)— pasan por el PDP evaluado sobre su profesional. Si revoca B2 o pausa el vínculo, recibe 404 sobre lo que él mismo registró, y «Hoy» pasa a `NOT_AVAILABLE`. Nutrición y antropometría lo resolvieron distinto: su lectura propia exige solo el consentimiento A3 (`nutricion/ingestas.service.ts`, `antropometria/evolucion.service.ts`).

**Opciones.**
- **A.** Las lecturas del historial registrado del titular (TRN-19, y TRN-09 sobre versiones ACTIVADAS) exigen solo A3, como en los otros dos dominios. Lo que opera sobre el plan vigente —«Hoy», abrir un borrador, confirmar, corregir— sigue bajo el PDP de su profesional (UC-P17 E03).
- **B.** Mantenerlo: toda lectura de entrenamiento pasa por el PDP del profesional, y la historia vuelve a verse al reotorgar B2.

**Provisorio en código.** B, que es lo que ya hace y lo más restrictivo. **Recomendación: A**, por coherencia con los otros dos dominios y porque el derecho de acceso del titular a sus propios datos no debería depender de mantener abierto un acceso de terceros. La encontró la auditoría de seguridad del cierre de WP-06.

**Resolución — CERRADA el 2026-09-24, opción A** (PR #67), dentro del tramo de consolidación que Dirección aprobó el 2026-09-22 (`docs/paquetes/WP-CONSOLIDACION.md` §3). Las lecturas de la historia ya registrada del titular exigen solo su A3 vigente, como en nutrición y antropometría: API-TRN-19 (su ejecución), API-TRN-09 sobre una versión ACTIVADA (su plan tal como lo aceptó) y **también API-TRN-08** para el titular. Este último no estaba en el texto de la deuda y se sumó a propósito: sin él, TRN-09 devolvía 200 sobre una versión que la lista ya no ofrecía, y la pantalla habría mostrado vacía una historia que el titular sí conserva. Lo que *opera* sobre el plan vigente —«Hoy», abrir un borrador, confirmar, corregir— sigue bajo el PDP del profesional (UC-P17 E03), y revocado el A3 se corta también lo propio (08:406). Cuatro pruebas nuevas en `test/integration/entrenamiento.int-spec.ts` fijan las cuatro caras.

## DL-090 — RF-071, «Solicitar y completar información profesional pertinente», es P0 y ningún paquete lo tiene

**Prioridad:** alta · **Documento:** 04:266-275 · B10-06:149-177 · adenda B10 v0.5:1290-1310 · **Estado:** **CERRADA** 2026-09-22 · WP-07 (PRs #58 a #65)

**Qué dice el legajo.** RF-071 es **P0 — Núcleo no recortable** (04:269): el profesional le pide al asesorado información estructurada para una finalidad, y el asesorado la completa conservando solicitante, finalidad, versión de la estructura, estado y procedencia. El B10-06 le dedica una pantalla dentro de entrenamiento («Solicitar datos», B10-06:149-177), y la adenda de formularios lo desarrolla (v0.5:1290-1310). El propio 04 lo incorporó como candidato «sujeto a contrarrevisión y aprobación de Dirección» (04:1176).

**Qué pasa hoy.** Ningún paquete lo implementa ni lo declara pendiente. WP-05 lo dejó fuera en su tabla de alcance («CAP-DAT y formularios», `docs/paquetes/WP-05.md:193`) sin abrir una deuda, y WP-06 tampoco lo menciona en su §8. La auditoría de UX del cierre de WP-06 lo encontró al recorrer el B10-06 sección por sección. Hoy la evaluación de entrenamiento registra lo informado por el asesorado como un dato con fuente «Informado por el asesorado», cargado por el profesional: la frontera de procedencia está, pero el acto de pedir y completar no.

**Opciones.**
- **A.** Un paquete propio, transversal (plantillas versionadas, solicitud, respuesta, historia, PDP), antes del cierre de la entrega: es P0 y atraviesa nutrición, entrenamiento y antropometría.
- **B.** Sumarlo a WP-07 junto con el enriquecimiento del catálogo.
- **C.** Declararlo fuera de la entrega de 2026-10-01 con Dirección, apoyándose en que el 04 lo marca como candidato sujeto a aprobación.

**Provisorio en código.** Ninguno: no hay nada implementado. **Recomendación: A**, con la decisión de Dirección sobre si entra en la entrega; B mezclaría una capacidad transversal con un enriquecimiento de dominio.

**Decisión de Elián (2026-09-21): opción A, ahora, antes que todo lo demás.** Dado el plazo (10 días al 2026-10-01) y que RF-071 es P0 núcleo no recortable, entra como paquete propio antes de lo que se venía llamando «WP-07» (zonas musculares, wger), que corre a WP-08. **Cerrada:** ver `docs/paquetes/WP-07.md`, que registra la definición completa.

## DL-091 — Cuatro patrones de pantalla que el cierre de WP-06 corrigió en entrenamiento siguen iguales en nutrición

**Prioridad:** media · **Documento:** B10-06:1145-1148 · B10-10:36, 164-165, 376 · **Estado:** **CERRADA** 2026-09-24 · opción A (PRs #66, #68, #69)

**Qué dice el legajo.** Una operación denegada limpia el contenido en la interacción siguiente (B10-06:1145-1148); un error se asocia a su campo (B10-10:164-165); un error de lectura ofrece la alternativa segura, no un reintento que repite lo mismo (B10-10:376).

**Qué pasa hoy.** La auditoría de UX del cierre encontró en entrenamiento cuatro patrones que se corrigieron ahí y que nutrición comparte, porque las pantallas se escribieron sobre el mismo molde:
1. una **escritura** denegada (404) muestra un aviso pero deja el contenido en pantalla;
2. el período de la revisión no se elige: son los últimos 7 días;
3. los formularios tienen resumen de errores, pero no marcan el campo (`aria-invalid`, error asociado);
4. los números con decimales se muestran con punto («72.5 kg») en todas las pantallas del proyecto, no con la coma del español rioplatense.

**Opciones.**
- **A.** Un PR transversal que lleve los cuatro arreglos a nutrición y antropometría, con el formateo de números en un solo lugar del dominio.
- **B.** Dejarlo para cuando cada dominio vuelva a tocarse.

**Provisorio en código.** Entrenamiento ya tiene 1 y 2, y 3 en el filtro de período. **Recomendación: A**, inmediatamente después de WP-06: son arreglos chicos y conocidos, y dejarlos haría que el mismo producto se comporte distinto según la pestaña.

**Resolución — CERRADA el 2026-09-24, opción A** (PRs #66, #68 y #69), dentro del tramo de consolidación que Dirección aprobó el 2026-09-22 (`docs/paquetes/WP-CONSOLIDACION.md` §2). Los cuatro patrones quedaron en nutrición y antropometría, en el website y en la APK, y el formato de números vive en un solo lugar del dominio (`packages/domain/src/formato-numeros.ts`).

Una revisión de calidad independiente del tramo —escrito en parte por agentes y verificado hasta entonces solo con el compilador— encontró cinco fallas que ninguna prueba cubría, y se corrigieron antes de integrar:
- `leerNumero("1.850")` devolvía 1,85: con la pantalla mostrando «1.850 kcal», copiar el número guardaba un objetivo de 1,85 kcal. Un entero de 1 a 3 cifras seguido de grupos de tres separados por punto ahora es **ambiguo** y se rechaza con un aviso que explica cómo escribirlo.
- El formato redondeaba a 2 decimales por defecto: una talla de 1,755 m se veía 1,76, y un cálculo con 3 decimales declarados perdía uno. REG-06-158 prohíbe el redondeo silencioso; ahora se muestran todos los decimales del dato, y los cálculos, con la precisión que declara el método.
- Una cantidad ilegible en el editor de plan dejaba guardar en silencio el último valor válido; en Formularios de la APK, un número ilegible se omitía como si el campo estuviera vacío. Los dos se señalan ahora en su campo.
- **API-ANT-06 aceptaba cualquier período y cortaba la serie en silencio en el día 92** mientras `period` informaba el rango entero: lo que caía después desaparecía sin figurar siquiera como hueco. Ahora responde `400 PERIOD_TOO_LONG`, como API-NUT-17 y API-TRN-21 (prueba en `antropometria.int-spec.ts`).
- Menores: avisos que quedaban en la fila equivocada al quitar una medición, un valor de parámetro que no dejaba escribir «1,05», una escritura más después de un 404 en la APK, y el lector de pantalla repitiendo el error.

**Lo que no se hizo, y por qué.** La APK de entrenamiento no tenía selector de período, así que no se agregó en nutrición ni en antropometría de la APK: el patrón 2 es de la superficie profesional, donde la revisión elige el período.

## DL-092 — El núcleo operable de RF-071 vive en seis documentos marcados «NO APROBADO»

**Prioridad:** alta · **Documento:** 04:1176, 1297-1313 · 05 v0.15 (encabezado y cierre) · 06 v0.1.1 §20 · 08 v0.1.5 §56 · 09 v0.16.1 (encabezado) · 10 Adenda v0.5 (encabezado) · **Estado:** DECIDIDA 2026-09-21

**Qué dice el legajo.** RF-071 se incorporó por un parche transversal (ACTA-DIR-021 en 04; ACTA-DIR-023 en 06; ACTA-DIR-025 en 08 y 09). Cada uno de los seis documentos propietarios declara, en su propio encabezado y en su cierre, que la versión que contiene el material de RF-071 es `BORRADOR DE PARCHE TRANSVERSAL — NO APROBADO`, `NO CANONIZADO`, con `Implementación: NO AUTORIZADA`. En 04, RF-071 figura puntualmente como `CANDIDATO … sujeto a contrarrevisión y aprobación de Dirección` (04:1176).

**Por qué importa.** Es la misma condición que atravesaron WP-04, WP-05 y WP-06: el contenido técnico más nuevo y más específico del legajo vive, sistemáticamente, en material que el propio legajo todavía no canonizó formalmente.

**Opciones.**
- **A.** Implementar sobre este material, porque es el único contenido técnico que existe, y declararlo.
- **B.** Esperar la aprobación formal de Dirección antes de escribir código.

**Decisión de Elián (2026-09-21): opción A**, la misma que DL-058/074/086. B detiene el paquete sin cambiar el contenido de lo que hay que construir, y con 10 días al 1/10 no es una opción real.

## DL-093 — La máquina de estados de la Solicitud queda con dos estados, sin cancelar ni rechazar

**Prioridad:** media · **Documento:** 06:8524-8529 (REG-06-210) · 09:1610-1618 (API-FRM-06) · **Estado:** DECIDIDA 2026-09-21

**Qué dice el legajo.** REG-06-210 declara «Estados mínimos: PENDIENTE, RESPONDIDA», sin tabla de transiciones, sin actor de creación nombrado y sin estados de caducidad, rechazo o retiro — a diferencia de la Solicitud de vínculo de B-03, que sí tiene cinco eventos con actor y guarda cada uno (06:3010-3040). El 09 no agrega ninguna operación para cancelar, rechazar o hacer caducar una Solicitud: API-FRM-06 expone en cambio `respondable: true/false` como «una proyección calculada con política actual; no crea un estado de dominio nuevo».

**Por qué importa.** Sin esta decisión, no queda claro qué pasa con una Solicitud que el asesorado nunca responde, o que deja de ser respondible porque se pausó el vínculo mientras estaba `PENDIENTE`.

**Opciones.**
- **A.** Dos estados persistidos (`PENDIENTE → RESPONDIDA`, sin retorno) y `respondable` como proyección de solo lectura del PDP, sin agregar un tercer estado.
- **B.** Agregar estados propios de dominio (`CADUCADA`, `RECHAZADA`, `RETIRADA`) que el legajo no declara.

**Decisión de Elián (2026-09-21): opción A.** Es lo que el propio 09 ya resuelve con `respondable` como proyección, y sostiene el patrón «solo agregar» (sin DELETE) que rige el resto de BE. **Registrado** en `docs/paquetes/WP-07.md` §7.2, D-B, y ahora también en código: `packages/domain/src/formularios.ts` declara las dos transiciones con `TransicionDeMaquina` (mismo patrón CONV-06-03 que el resto del proyecto) y `contratos-wp07.test.ts` prueba que no hay retorno ni tercer estado. **Falta sostenerlo en la base** (constraint/trigger de Prisma) y en el servicio de la API — ninguno de los dos existe todavía.

## DL-094 — Los siete TEST-FRM son títulos de una línea, sin los trece campos de 11A §6

**Prioridad:** media · **Documento:** 11A:604-610 (§18, TEST-FRM-001 a 007) · 11A:194, 348-349 (matriz, oráculo genérico) · **Estado:** **CERRADA** 2026-09-22 (oráculos escritos)

**Qué dice el legajo.** Mismo patrón que TEST-TRN (DL-075), TEST-NUT y TEST-ANT (DL-065): `TEST-RF-071`, `TEST-UC-P32` y `TEST-UC-P33` llevan el oráculo-frase genérico compartido con otras 54 filas de la matriz, y los siete `TEST-FRM-001` a `007` de §18 son un título de una línea cada uno, sin `STEPS`/`EXPECTED`/`NEGATIVE_ASSERTIONS`.

**Opciones.**
- **A.** Escribir los siete con el molde completo de 11A §6, mismo formato que `WP-06-ORACULOS.md`.
- **B.** Dejarlos como títulos y cubrir por comportamiento, sin materializar el oráculo.

**Decisión de Elián (2026-09-21): opción A.** Avanza también la condición de cierre de DL-075, que ya señalaba que el hueco de la §6 del 11A era estructural, no exclusivo de un dominio. **Escritos** en `docs/paquetes/WP-07-ORACULOS.md` (2026-09-22): los siete, con los trece campos. Seis con automatización completa; **TEST-FRM-004 quedó declarado como parcial** en su propio campo `AUTOMATION` — `profileSourceRef` se acepta como referencia opaca, sin verificación cruzada contra el dato de origen (ver DL-095). Se dejó el oráculo entero en vez de recortarlo para que coincidiera con lo implementado.

## DL-095 — Contratos de FRM con forma no definida en el 09

**Prioridad:** media · **Documento:** 09v16.1 §22.1-§22.8 · 08 §11-bis · **Estado:** ABIERTA (hallada al implementar)

**Qué dice el legajo.** El contrato de FRM-01 a 08 no tiene huecos de operación (WP-07.md, nota de versiones citables), pero sí deja varias formas de detalle sin fijar:
- `purpose`, tanto de la Plantilla como de la Solicitud, no tiene catálogo cerrado: el único ejemplo del 09 (`"NUTRITION_EVALUATION"`) es conceptual, no un valor literal declarado en ningún enum (09:1500).
- El 08 define una política de pertinencia por categoría (§11-bis) para datos de salud ya almacenados, pero no fija qué categorías aplican a los campos de una Plantilla de FRM ni una matriz alcance×categoría específica para este paquete — y su propia validación clínica/jurídica (VJR-1, VJR-4, VD-1) «no se declara resuelta» (08:382).
- El tipo de dato de un campo de Plantilla no tiene catálogo cerrado en el 09 («tipos/unidades», 09:1479, sin enumerar cuáles).
- La forma exacta del éxito `201` de FRM-08 (rectificar) no está dada: el 09 solo fija Request, Reglas, Errores y Audit (09:1628-1644), sin JSON de éxito.
- El segundo token de estado de la Solicitud no tiene forma literal en el 09: el único ejemplo dado es `"status": "PENDING"` (09:1508); el que sigue a `RESPONDIDA` (REG-06-210) no aparece escrito en inglés en ningún lado.

**Opciones.**
- **A.** Definirlas en `@be/domain` (`contratos-formularios.ts`, `formularios.ts`), con la forma mínima coherente con el resto del proyecto:
  - `purpose` es texto libre acotado (300 caracteres en la Solicitud), sin enum;
  - categorías cerradas en cuatro valores (`SALUD_Y_SEGURIDAD`, `HABITOS_Y_CONTEXTO`, `OBJETIVOS_Y_PREFERENCIAS`, `DATOS_GENERALES`), con una matriz alcance×categoría explícita y **maximally permissive** en P0 — clasifica, no filtra por criterio clínico que nadie con competencia clínica revisó (§9.5 de WP-07.md ya acepta el riesgo residual R-08-12 en los mismos términos que el 08); el límite de acceso real sigue siendo Vínculo+Alcance+B2+PDP, nunca esta matriz;
  - tipo de campo cerrado en `TEXT`/`NUMBER`/`BOOLEAN`, sin `CHOICE` ni multi-select (WP-07.md §9.3);
  - éxito de FRM-08 simétrico al de una corrección de entrenamiento: `{ formResponseId, rectificationId, version, recordedAt }`, con `expectedVersion` agregado al request para sostener el `409 VERSION_CONFLICT` que el 09 sí declara;
  - segundo token de estado: `RESPONDED`, par natural en inglés de `PENDING`;
  - `422 FORM_RESPONSE_INVALID` también en FRM-07 (09:1585-1593 solo lo declara para FRM-08): la misma validación de forma — cada `fieldCode` existe en la plantilla y tiene el tipo declarado, sin duplicados, sin exceder lo solicitado — se aplica al enviar y al rectificar, y no tendría sentido rechazar una forma inválida solo la segunda vez;
  - `templateId` en la Solicitud, además de `templateVersionId`: sin él, quien responde no puede pedirle su estructura a FRM-02. Apareció al escribir la pantalla de la APK, no antes;
  - **`profileSourceRef` se acepta como referencia opaca**, sin verificar que apunte a un dato propio del actor y de tipo compatible (09:1583-1585 lo pide; P0 no lo implementa). Es lo que deja a `TEST-FRM-004` declarado como parcial en `docs/paquetes/WP-07-ORACULOS.md`.
- **B.** Esperar una versión del 09 que fije estas formas y dejar el paquete sin avanzar.

**Provisorio en código.** A. El OpenAPI generado (`docs/api/openapi.json`) publica esas formas y `contratos-wp07.test.ts` las verifica, incluida la matriz maximally-permissive y el rechazo de `value: null` en una respuesta.

**Condición de cierre.** El 09 fija las formas listadas, o VJR-1/VJR-4/VD-1 se resuelven y el 08 publica una matriz de pertinencia específica para FRM que reemplace la provisoria.

## DL-096 — La APK no muestra la historia de entrenamiento que DL-089 le garantiza al asesorado

**Prioridad:** media · **Documento:** 08:199 · 08:58 · DL-089 · 09v10 (TRN-08, TRN-09, TRN-19) · **Estado:** ABIERTA (hallada al cerrar la consolidación)

**Qué dice el legajo.** El titular tiene acceso pleno a «Plan entrenamiento + ejecución» (08:199), y el fin del vínculo no destruye su historia (08:58). DL-089 lo llevó a la API: revocado el B2, el titular sigue leyendo sus ejecuciones, su plan activado y la lista de sus planes.

**Qué pasa hoy.** La garantía existe y está probada en la API, pero **ninguna pantalla de la APK la usa**: la sección de entrenamiento del asesorado es «Hoy» y el registro en diferido, que operan sobre el plan vigente y por eso —correctamente— pasan a «no disponible» con el B2 revocado. Además, el 09 no declara una operación para **listar** las ejecuciones propias: TRN-19 las lee de a una, por identificador, y la única lectura por período (API-TRN-14-PERIODO, DL-078) opera sobre el plan vigente. Nutrición resolvió lo mismo con una lista propia fuera del 09 (API-NUT-16-LISTA, DL-055).

**Opciones.**
- **A.** Una sección «Tu historial» en la APK con lo que el contrato ya da: la lista de planes (TRN-08) y cada plan tal como se aceptó (TRN-09). Para las sesiones registradas, una lectura propia por período exigiendo solo A3, declarada como desvío igual que DL-055.
- **B.** Dejarlo en la API hasta que el 09 declare una lectura de historia del titular.

**Provisorio en código.** B: nada nuevo en la APK. **Recomendación: A**, en el paquete que siga a la entrega, porque es la única forma de que el asesorado **vea** lo que la garantía le reconoce; sin pantalla, el derecho existe pero no se puede ejercer desde el teléfono.

## DL-097 — Las formas de la importación controlada que el 09 no fija

**Prioridad:** media · **Documento:** 09v12 §5-§7 (09v12:184-188, 360-364, 369, 390) · **Estado:** ABIERTA (hallada al implementar WP-08)

**Qué dice el legajo.** El 09 v0.12 da el request y el éxito de API-INT-NUT-02/03 y dice «mismo patrón» para API-INT-TRN-02/03 (09v12:369, 390). No fija el formato del identificador externo de cada proveedor, la forma del contenido del candidato ni la del contenido revisado, el éxito de TRN-03, ni qué responde BE cuando el proveedor contesta que no conoce el identificador.

**Opciones.**
- **A.** Definirlas en `@be/domain` (`contratos-integraciones.ts`), con la forma mínima coherente con el resto del contrato:
  - identificador: código de barras de 8, 12, 13 o 14 dígitos en Open Food Facts; entero positivo en wger;
  - candidato con `null` en cada dato que el proveedor no trajo —también la base, cada 100 g o cada 100 ml, cuando el proveedor no la declara sin ambigüedad—, y `expiresAt` además de lo que muestra el 09;
  - contenido revisado con la misma forma que el candidato, y su completitud validada en el servicio: así un faltante da el `422 REVIEWED_CONTENT_INVALID` del 09 con la ruta de lo que falta, en vez de un `400` de forma;
  - éxito de NUT-03 = el del 09 más `candidateId`, `correctedFields` y `resolvedAt`; el de TRN-03, con `exercise: { exerciseId, versionId }`;
  - identificador desconocido: `422 IMPORT_SOURCE_NOT_FOUND`, código nuevo, porque no es una caída y el profesional tiene que poder distinguirlo;
  - `externalSource` en cada elemento de los dos catálogos (`null` en lo sembrado y lo manual), para la procedencia visible de RF-060.
- **B.** Esperar una versión del 09 que las fije.

**Provisorio en código.** A, en el PR #72 (WP-08). El OpenAPI generado publica las formas y `contratos-wp08.test.ts` las fija.

**Condición de cierre.** El 09 fija estas formas, o Dirección ratifica las de `@be/domain`.

## DL-098 — La búsqueda por texto en los proveedores no tiene contrato

**Prioridad:** media · **Documento:** 09v12:190 · B10-05 §19 («buscar/importar candidato») · B10-06 §22 («buscar candidato») · **Estado:** ABIERTA

**Qué dice el legajo.** El 10 pide «buscar candidato» en los dos dominios, y el 09 admite «búsqueda first-party mediante parámetros allowlist sin convertir la API BE en passthrough del proveedor» (09v12:190), pero no la especifica: el único `lookup` definido es `externalId`.

**Qué pasa hoy.** WP-08 consulta por identificador: el código de barras del envase en Open Food Facts y el número del ejercicio en wger. Es suficiente para el circuito y para el compromiso académico, pero encontrar un ejercicio de wger exige ir a buscar su número a wger.de. Agregar una búsqueda por texto sin contrato sería una familia contractual nueva, que el 09 prohíbe (09:2717-2719).

**Opciones.**
- **A.** Especificar la búsqueda en el 09 —parámetros permitidos, cuántos resultados, qué se muestra de cada uno— e implementarla en un paquete posterior.
- **B.** Dejar la consulta por identificador como la única forma.

**Provisorio en código.** B, con la ayuda en pantalla de dónde encontrar el identificador. **Recomendación: A**, porque es lo que el 10 describe y lo que hace usable la importación de ejercicios.

## DL-099 — La procedencia externa llega hasta la elección, no hasta el ítem del plan

**Prioridad:** media · **Documento:** 04 RF-060 (04:701-708) · 08 (licencias) · **Estado:** ABIERTA (hallada en la revisión de calidad de WP-08)

**Qué dice el legajo.** RF-060: BE tiene que «permitir identificar proveedor, fecha y referencia suficiente de un dato externo **en los contextos donde se utiliza**», para el profesional, el asesorado o el administrador «según autorización». Las licencias de los dos proveedores (ODbL en Open Food Facts; CC BY-SA en wger, con su autor) piden citar la fuente donde se muestra el contenido.

**Qué pasa hoy.** WP-08 muestra la procedencia donde el elemento **se elige**: el buscador del catálogo en los dos editores y el sustituto de un ejercicio en la APK dicen «Importado de Open Food Facts» o «de wger», con la fecha. Una vez en el plan, el ítem no la muestra —ni en el editor, ni en el plan activado, ni en lo que ve el asesorado—, porque las respuestas del plan (`ItemPrescripto`, `Prescripcion`) llevan el nombre y la versión del catálogo, no su fuente. La procedencia no se pierde: está en la versión del catálogo que el plan cita.

**Opciones.**
- **A.** Sumar `externalSource` al ítem prescripto y a la prescripción, resuelto desde la versión del catálogo que el plan congela, y mostrarlo en el editor, en el plan y en las pantallas del asesorado, con el identificador, la licencia y el autor. Es un cambio aditivo en respuestas estrictas: se despliega con la APK nueva, como el resto de WP-08 (§9 de `docs/paquetes/WP-08.md`).
- **B.** Dejar la procedencia en el punto de elección y en el catálogo.

**Provisorio en código.** B. **Recomendación: A**, en el mismo paquete que integre WP-08 o en el siguiente: es lo que RF-060 describe y lo que las licencias piden.

