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
| DL-012 | WP-02 · 2026-09-18 | 07 §43-bis · 08 §26 · 09v8 ACC-02 | Sesión: formato, transporte, TTL y renovación | **DECIDIDA** 2026-10-03 · sin renovación; en la APK, el token en el almacenamiento seguro hasta que vence (#136, sin integrar) |
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
| DL-050 | WP-04 · 2026-09-19 | 09v9:762 · CONS:641-672 · 05:719 (UC-E02) | Corregir una ingesta prescripta: sin operación ni UC | **RESUELTA** 2026-10-05 por DL-121 (opción B, encargo de Dirección), sin integrar |
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
| DL-096 | Consolidación · 2026-09-24 | 08:199 · 08:58 · DL-089 · 09v10 TRN-08/09/19 | La APK no muestra la historia de entrenamiento que DL-089 le garantiza al asesorado | **CERRADA** 2026-09-27 · verificada en dispositivo con la APK 0.11.3 |
| DL-097 | WP-08 · 2026-09-24 | 09v12 §5-§7 (09v12:184-188, 360-364, 369, 390) | Las formas de la importación controlada que el 09 no fija | ABIERTA (hallada al implementar) |
| DL-098 | WP-08 · 2026-09-24 | 09v12:190 · B10-05 §19 · B10-06 §22 | La búsqueda por texto en los proveedores no tiene contrato | ABIERTA |
| DL-099 | WP-08 · 2026-09-24 | 04 RF-060 (04:701-708) · 08 licencias | La procedencia externa llega hasta la elección, no hasta el ítem del plan | ABIERTA (hallada en la revisión de calidad) |
| DL-100 | PF-01/02 · 2026-09-27 | B10-06 §4 (CAND-10-TRN-A) · 04 RF-071 · WP-07 | Plantilla «Antecedentes para entrenamiento» con seis conceptos | **DECIDIDA** 2026-09-27 · ratificada tal cual |
| DL-101 | PF-01/02 · 2026-09-27 | 09v16.1 §22 · DL-095 | Los campos NUMBER aceptaban cualquier número | **DECIDIDA** 2026-09-27 · mínimo, máximo y entero |
| DL-102 | PF-01/02 · 2026-09-27 | 09v10 TRN-01 · CA-FOR-04 del plan | La evaluación de entrenamiento no puede citar respuestas de forma verificable | **DECIDIDA** 2026-09-27 · referencias verificadas (opción A) |
| DL-103 | PF-01/02 · 2026-09-27 | Plan Funcional §12.3 · DEC-04 | Alcance del primer incremento de contexto | **DECIDIDA** 2026-09-27 · solo entrenamiento, equipamiento en texto |
| DL-104 | PF-01/02 · 2026-09-28 | DL-101 · 09v16.1 §22.7/§22.8 · auditoría del PR #100 | Un valor fuera de rango en un formulario no le dice a la persona qué corregir | EN CURSO (opción A integrada y publicada en la APK 0.12.0; falta la validación de Dirección en el teléfono) |
| DL-105 | PF-03 · 2026-09-28 | 04 RF-040/042/045 · 05 UC-P17 · ficha PF-03 (PF03-D-1) | La APK no muestra lo que el profesional planificó, y la web no lo compara con lo registrado | **DECIDIDA** 2026-09-28 · incremento 1 «Lo planificado, visible y comparable», con el contrato actual |
| DL-106 | PF-03 · 2026-09-29 | 06 REG-06-131/132 · 09v10 TRN-15 a 20 · orden de Dirección del 2026-09-29 (comparación visual) | Una serie planificada que falta en un registro por serie no se puede declarar como no realizada | ABIERTA · la comparación la muestra como «sin dato» (provisorio, del lado que no inventa) |
| DL-107 | PF-07 · 2026-09-30 | REG-06-145/150 · B10-08 §8.4 · 10-B04:1171-1176 · ficha `docs/propuestas/PF-07_vista-de-cartera.md` | El profesional no tiene una vista de cartera: entra asesorado por asesorado sin saber a quién mirar hoy | **DECIDIDA** 2026-09-30 · API-DSH-04 «Pendientes», los siete tipos, ventana de 7 días, actividad solo como dato, orden fijo, arriba de «Tus asesorados» · implementada en #120 |
| DL-108 | Plantillas · 2026-09-30 | DL-047 · RF-060 · INV-06-109 · ficha `docs/propuestas/PLANTILLAS-DEL-PROFESIONAL_ficha.md` | Todo plan empieza en blanco o desde el plan anterior de la misma persona: no hay reutilización entre asesorados | **DECIDIDA** 2026-09-30 (D-1, D-2, D-3, D-5) · implementada en #121 (entrenamiento y comidas) |
| DL-109 | PF-09 · 2026-09-30 | ficha «Plantillas del profesional» (mejora C «Mis habituales») · DL-108 · 06 REG-06-111 | Lo que el profesional repite de a pedazos (un ejercicio, un alimento, una sesión, una comida) se vuelve a buscar y a escribir en cada plan | **DECIDIDA** 2026-09-30 · «Mis habituales»: elementos y bloques; reguardar con el mismo nombre reemplaza, con aviso · implementada en #122 |
| DL-110 | Crítica de negocio · 2026-09-30 | REG-06-209 · UC-P32 · WP-07 D-D · T-06-33 · UC-P19 · DIR-10-MET-A · REG-06-151/157/162/168 | Formularios propios (mejora D) y protocolos propios de antropometría (mejora E) | **DECIDIDA** 2026-09-30 · D postergada (exclusión de P0 vigente); E: catálogo real de BE, sin protocolos ni fórmulas del profesional; contenido pendiente de Dirección |
| DL-111 | Pedido de Dirección · 2026-09-30 | DL-110 · DL-073 · 06 REG-06-156/157/162/203/204/205 · RF-048/049 · TEST-PRJ-009 | El catálogo antropométrico real (perfil completo y 40 fórmulas con fuente), la lámina del compositor en el website y la figura con los resultados en la APK | **IMPLEMENTADA, A RATIFICAR** 2026-10-01 · decisiones del ejecutor: sitios de la ficha, métodos por sexo, edad como dato de la toma, una métrica por familia, resultados en la evolución sin cambiar su forma |
| DL-112 | Pedido de Dirección · 2026-10-01 | DL-111 · 06 REG-06-205 · RF-048 · DL-072 (especificaciones de solo agregar) | El catálogo ofrece demasiados métodos para elegir: 40 métodos, 28 resultados | **DECIDIDA** 2026-10-01 (la purga) · la lista la armó el ejecutor, A RATIFICAR · 21 vigentes, 23 retirados y 4 nuevos; lo calculado sigue en la historia |
| DL-113 | Pedido de Dirección · 2026-10-01 | B10-10 · RNF-ACC-001 · TEST-PRJ-009 · 06 REG-06-156/158 · DL-111 | Mucho texto a la vista, avisos fuera de la vista en el teléfono, la APK sin navegación fija y pliegues del catálogo fuera de la figura | **IMPLEMENTADA, A RATIFICAR** 2026-10-01 · pulido y corrección de los puntos anatómicos 2026-10-02 · guía `docs/ux/GUIA-UX-UI.md` · falta la prueba de Dirección en el teléfono |
| DL-114 | CI del PR #128 · 2026-10-01 | WP-01 §2 (auditoría de dependencias: falla con altos o críticos) | Un aviso alto sin versión corregida (node-forge, GHSA-86w9-cpqp-85rv) en la CLI de Expo bloquea toda integración, también `main` | **RATIFICADA** por Dirección el 2026-10-03, hasta el 2026-10-31 · solo GHSA-86w9-cpqp-85rv en node-forge y GHSA-vfj7-8cjw-p6xm en braces, por aviso y paquete |
| DL-115 | Matriz de DV-05 · 2026-10-02 | 08:406 (08 §13) · DL-089 · TEST-AUTH-003 · TEST-AUTH-004 | Revocado el A3, el titular sigue leyendo su evolución antropométrica (API-ANT-06-PROPIA) y el detalle de sus formularios con la respuesta (API-FRM-05). Nutrición y entrenamiento sí lo cortan | **DECIDIDA** 2026-10-02 · opción A · implementada en la rama `fix/a3-titular-antropometria-formularios`, sin integrar: va con la candidata 0.13.2 |
| DL-116 | Fichas de perfil y administración · 2026-10-02 | 09 v0.11 §16 (API-DSH-04, línea temporal) · DL-107 | `openapi.ts` usa API-DSH-04 para «Pendientes» (`GET /me/portfolio`), y en el 09 ese ID es la línea temporal, que no está implementada | **ABIERTA** 2026-10-02 · severidad media (trazabilidad) · espera la decisión de Dirección |
| DL-117 | Decisión de Dirección · 2026-10-04 | B10-10 §9 · 08 §33 · DL-113 · DL-049 · DL-077 · DL-115 | La APK no tiene un Inicio que reúna lo disponible de los módulos, y Cuenta ocupa un lugar de la barra | **DECIDIDA** 2026-10-04 · Inicio personal y barra Inicio, Nutrición, Entrenamiento, Evolución, Información; Cuenta en el avatar. Implementación sin integrar |
| DL-118 | Decisión de Dirección · 2026-10-05 | DL-117 · DL-111 · DL-113 · REG-06-162/165/166 · TEST-PRJ-009 | «Mi evolución» de la APK tiene cuatro vistas con mucho desplazamiento, gráficos ilegibles y vistas vacías; la lectura del asesorado es más técnica de lo necesario | **DECIDIDA** 2026-10-05 · tres vistas (Mapa corporal, Progreso por Torso y Piernas, Indicadores); Comparar sale como apartado móvil. Implementación sin integrar |
| DL-119 | Encargo de Dirección · 2026-10-05 | REG-06-135 (inciso 2) · 06:4228-4394, 4554-4621 · RF-027 | Recetas como preparaciones propias del profesional, catálogo de referencia USDA y método de cálculo de energía y macros | **DECIDIDA** 2026-10-05 · familia REC, método `SUM_SOURCE_PER_100G_V1`. **IMPLEMENTADA** el 2026-10-06 en `wp-nutricion-recetas` (#147, borrador) y **probada localmente**. Sin integrar; pendiente la prueba remota (no hay despliegue) y en Android (no hay APK nueva) |
| DL-120 | Encargo de Dirección · 2026-10-05 | 08 §21 (08:519-531, 395, 451) · 07 §25 (07:939-965) · 09v12 §24 · 09v9 §28 · REG-06-133 · T-06-65 | Medios privados activados en el MVP sintético; almacenamiento en PostgreSQL detrás de una interfaz, en lugar de S3 | **DECIDIDA** 2026-10-05 la activación, con persistencia en la base existente. **IMPLEMENTADA** el 2026-10-06 en `wp-nutricion-recetas` y **probada localmente**. Sin integrar; pendientes la prueba remota y en Android. Para la demo sigue PostgreSQL (decisión del 2026-10-06), y S3 (07 §25) queda abierto. **Pendiente normativo aislado:** el acto `EVIDENCIA_VISUAL` (08 §12.4) tiene desde el precierre del 2026-10-06 un texto **propuesto**, su flujo y su mapeo a MED-01 y MED-03, sin activar (DL-125) |
| DL-121 | Encargo de Dirección · 2026-10-05 | DL-049 · DL-050 · 06:1422-1462 · CONS:564-630 | Registro v2 de comidas: estado de las cantidades, anulación y rectificación del titular, y clave natural con secuencia | **DECIDIDA** 2026-10-05 · familia ING, endpoints nuevos. Resuelve DL-050; lo que lee la APK instalada no cambia. **IMPLEMENTADA** el 2026-10-06 en `wp-nutricion-recetas` y **probada localmente**. Sin integrar; pendientes la prueba remota y en Android (la APK nueva no se compiló). Decidido el 2026-10-06: una entrada efectiva por comida y fecha; en el contraste, fuera de la prescripción y con los dos hechos dichos |
| DL-122 | Encargo de Dirección · 2026-10-06 | REG-06-111, 112, 128 · 09v10 §5-§6 · PF03-D-2 · DL-105 | Objetivos efectivos por serie: RIR, carga sugerida y descanso con herencia, y base de la carga y de las repeticiones | **DECIDIDA** 2026-10-06 por el encargo · familia SER, lecturas nuevas; lo que lee la APK 0.13.2 no cambia. **IMPLEMENTADA** el 2026-10-06 en `wp-entrenamiento-series` y **probada localmente**, con la CI en verde. Sin integrar; pendiente en el teléfono. Precierre del 2026-10-06 (§2): sin versión mínima, un plan que exige objetivos por serie no se activa ni se entrega a una app que no declare la capacidad (`X-BE-Capabilities`); la 0.13.2 y las candidatas reciben «no disponible». **IMPLEMENTADO y probado localmente** (integración y recorrido) |
| DL-123 | Encargo de Dirección · 2026-10-06 | REG-06-134, 135, 136 · 09v10 §9 · DL-120 | Imagen del ejercicio: medio `EXERCISE_REFERENCE`, asociación de solo agregar, licencia honesta, procedencia y revisión técnica | **DECIDIDA** 2026-10-06 por el encargo · familia EJE. **IMPLEMENTADA** el 2026-10-06 en `wp-entrenamiento-series` y **probada localmente** (las tres imágenes del paquete por el flujo real), con la CI en verde. Sin integrar. API-TRN-13 sigue con `didacticResources` vacío |
| DL-124 | Encargo de Dirección · 2026-10-06 | REG-06-130, 131 · paquete de Dirección (DECISIONES_Y_TIEMPOS) | Tiempos de la sesión como eventos idempotentes con calidad: medido, estimado, incompleto o sin dato | **DECIDIDA** 2026-10-06 por el encargo · familia TIE. **IMPLEMENTADA** el 2026-10-06 en `wp-entrenamiento-series` y **probada localmente** (el guion de tiempos del paquete, de punta a punta), con la CI en verde. Sin integrar. Pendiente en Android: pantalla bloqueada, muerte del proceso y reloj monotónico durante la suspensión. Precierre del 2026-10-06 (§1, §3, §4): estados honestos del guardado local, cifrado AES-256-GCM con la clave en el almacén seguro y fuera del respaldo de Android; reloj desde el arranque con su base en cada instante (`ELAPSED_SINCE_BOOT`). **IMPLEMENTADO**; Android pendiente |
| DL-125 | Encargo de Dirección · 2026-10-06 (precierre, §6) | 08 §12.2, §12.4 (08:386, 08:395), §13, §21 · 08:451 · DL-120 · DL-116 | El acto `EVIDENCIA_VISUAL` no tenía texto versionado, ni registro, ni lo exigían MED-01 y MED-03 | **PROPUESTA**, sin activar · texto versionado propuesto (`evidencia-visual-2026-10-propuesta`), acto registrable por alcance de Nutrición, familia propia EVI (API-EVI-01 a 04) y mapeo a MED-01 y MED-03 detrás de `BE_EVIDENCIA_VISUAL_EXIGIDA` (por defecto `false`). **Punto de aprobación pendiente:** Dirección aprueba el texto, con la validación jurídica, y decide activar la exigencia |
| DL-126 | Encargo de Dirección · 2026-10-08 (entorno profesional) | 09 v0.11 §18-§23 · B10-09 §15-§28 · 11A TEST-PRJ-001 · encargo §8-§13 | «Analizar» con hasta tres métricas sobre API-PRJ-01: el 09 define ocho proyecciones con resultado propio, y solo tres tienen una derivación definida en BE | **PROPUESTA** en `wp-dashboard-profesional`, sin integrar · las 8 claves en el contrato; 3 derivadas con el cálculo canónico del dominio; 5 responden `INSUFFICIENT_INFORMATION` con `SPECIFICATION_PENDING`. Diccionario de métricas versionado |
| DL-127 | Encargo de Dirección · 2026-10-08 (entorno profesional) | 09 v0.11 §16 · B10-08 §11-§12 · T-06-24 · DL-054 · DL-116 | API-DSH-04 (línea de tiempo) sin implementar: fuentes, forma de la entrada y filtros que el 09 no fija | **PROPUESTA** en `wp-dashboard-profesional`, sin integrar · ruta del 09; `occurredDate` para los hechos sin hora; extensiones de filtro `state`, `quality`, `planVersionId`, `exerciseId` y `q` |
| DL-128 | Encargo de Dirección · 2026-10-08 (entorno profesional) | encargo §8 y §16 («guardar una vista personal») · 09 sin operación · 08 (preferencias sin datos de salud) | Vistas de análisis guardadas e indicadores fijados del Resumen: no existen en el 09 ni en el modelo | **PROPUESTA** en `wp-dashboard-profesional`, sin integrar · familia propia VAN (API-VAN-01 a 04), tabla aditiva `vista_de_analisis` con configuración sin datos de salud; los permisos se revalidan al abrir |

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

**Prioridad:** media · **Documento:** 07 §43-bis, 07:537, 07:786-789 · 08 §26 · 09v7 T01 · 09v8 ACC-02 · **Estado:** DECIDIDA (2026-10-03)

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

**Nota del 2026-10-03: por qué la APK vuelve a la bienvenida.** Dirección informó, en la prueba de la 0.13.1, que la APK
vuelve a la bienvenida después de cerrarla y también después de un tiempo que no se midió
(`EVIDENCIA/PRUEBA-MANUAL-0.13.1`). Que vuelva a la **bienvenida**, y no a Iniciar sesión con un aviso, quiere decir que
se perdió la memoria de la app. La API no rechazó la sesión. Hay dos causas:
- **El proceso se cierra.** Pasa al cerrar la app desde Recientes, o cuando Android cierra una app en segundo plano para
  liberar memoria, cosa frecuente en teléfonos con poca. Es la opción A de esta deuda, que sigue vigente: el token vive
  solo en memoria.
- **La actividad se recrea.** Android la recrea al cambiar el tamaño de letra o de visualización, el idioma o la negrita
  del sistema. El proceso sigue vivo, pero React vuelve a montar la raíz y la sesión estaba en su estado. **Esta causa
  se corrigió** en la rama `apk/sesion-y-navegacion`, sin integrar: la sesión vive fuera del árbol de React, siempre en
  memoria.

Además:
- La API no transforma una falla pasajera en un rechazo de sesión. El secreto de firma es obligatorio y no se genera al
  arrancar.
- La APK solo sale de la sesión ante un código de sesión. Un 403, un 429, un 5xx o la falta de red no la cierran, y
  ahora una prueba lo fija.
- La sesión vence a las 12 h del inicio, aunque se use, y no por inactividad. Al vencer, la APK lo dice.

**Propuesta, a decidir por Dirección: continuidad en el teléfono dentro de la misma sesión.**
- **Qué se guarda.** El token que ya existe se guarda en el almacenamiento seguro de Android (Keystore, con
  `expo-secure-store`) hasta su `expiresAt`, como mucho 12 h. No se guarda la contraseña.
- **Qué no cambia.** No hay renovación ni otro mecanismo de autenticación. La API sigue verificando la fila de sesión en
  cada request, así que «Cerrar todas las sesiones» y la revocación siguen cortando en el pedido siguiente.
- **Cuándo se borra.** Al cerrar la sesión, al vencer y ante cualquier código de sesión.
- **Qué cambia.** Reiniciar la APK ya no obliga a volver a iniciar sesión, cosa que hoy fija el 07:537. Por eso decide
  Dirección.
- **Qué hace falta.** Una dependencia nativa nueva y una APK nueva. Es la mitad de la opción B (SecureStore sin refresh
  rotativo).
- **Riesgo.** Con el teléfono desbloqueado, alguien que tome la app entra hasta que la sesión venza o se la revoque.
- **Alternativa.** Ratificar A tal como está. Para la demostración, conviene no cerrar la app ni cambiar de aplicación
  por mucho tiempo.

**Decisión de Dirección del 2026-10-03 (tanda de cierre de la candidata 0.13.2).** Se aprueba la propuesta: el token de
sesión se guarda en el almacenamiento seguro del teléfono hasta su vencimiento, sin guardar la contraseña y sin
renovación automática.
- **Qué rige en la APK.** La credencial va a `expo-secure-store` (Keystore de Android), fuera del respaldo automático de
  Android. Son el token, la identidad, `expiresAt` y la vigencia. No se guardan datos de salud ni la pantalla.
- **Un token guardado no es una sesión autorizada.** Al abrir la app se verifica con la API (API-ACC-05, `/me`) antes de
  mostrar nada protegido.
  - Si la API dice que venció o que no sirve, se borra y se va a Iniciar sesión con su aviso.
  - Sin red, con 429 o con 5xx, no se borra: la app dice que no pudo verificarla y deja reintentar.
- **Se borra** al cerrar la sesión, al cerrar todas las sesiones, al vencer y ante cualquier código de sesión.
- **Qué no cambia.**
  - La duración: 12 h desde el inicio, con `renewable: false`.
  - La verificación de la fila de sesión en cada request, y la revocación.
  - El website, que sigue con la opción A: la sesión vive en memoria.
- **Relación con el legajo.** La decisión se aparta de 07:537 («reiniciar el APK obliga a volver a iniciar sesión») y
  de 07:789 («JWT en memoria en el MVP»). Esos textos están protegidos por el manifiesto y no se modifican: la decisión
  rige desde este registro hasta la próxima versión del legajo.
- **Implementación y pruebas.**
  - El código está en `apps/mobile/src/sesion-persistente.ts` y `almacen-seguro.ts`, en la rama
    `apk/sesion-y-navegacion` (#136), sin integrar.
  - `scripts/sesion-persistente.test.mjs` cubre los ocho casos de la tanda con un almacén falso.
  - **Un mock no prueba que Android conserve el valor al cerrar el proceso**: se comprueba en el teléfono con la APK
    0.13.2.
- **Riesgo aceptado.** Con el teléfono desbloqueado, quien tome la app entra hasta que la sesión venza o se la revoque.
  «Cerrar todas las sesiones», desde otro dispositivo, corta en el pedido siguiente.

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

**Resolución (2026-10-05).** El encargo de Dirección pide «completar o corregir» las cantidades y «deshacer registro» con
operaciones autorizadas y auditables. Se toma la opción B por DL-121: la anulación y la rectificación del titular, de solo
agregar, con el patrón de B-06. Queda sin integrar hasta que Dirección apruebe el paquete.

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

> **Nota del 2026-10-02.** La frase «como en nutrición y antropometría» no es cierta para antropometría: su lectura propia no mira el A3. Ver DL-115.

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

**Prioridad:** media · **Documento:** 08:199 · 08:58 · DL-089 · 09v10 (TRN-08, TRN-09, TRN-19) · **Estado:** **CERRADA** 2026-09-27 — opción A autorizada por Dirección el 2026-09-25; implementada (#86) y publicada en la APK 0.11.0; correcciones de la validación en teléfono en la 0.11.1 (#89), la 0.11.2 (#94) y la 0.11.3 (#97); **verificada en dispositivo con la APK 0.11.3**

**Qué dice el legajo.** El titular tiene acceso pleno a «Plan entrenamiento + ejecución» (08:199), y el fin del vínculo no destruye su historia (08:58). DL-089 lo llevó a la API: revocado el B2, el titular sigue leyendo sus ejecuciones, su plan activado y la lista de sus planes.

**Qué pasa hoy.** La garantía existe y está probada en la API, pero **ninguna pantalla de la APK la usa**: la sección de entrenamiento del asesorado es «Hoy» y el registro en diferido, que operan sobre el plan vigente y por eso —correctamente— pasan a «no disponible» con el B2 revocado. Además, el 09 no declara una operación para **listar** las ejecuciones propias: TRN-19 las lee de a una, por identificador, y la única lectura por período (API-TRN-14-PERIODO, DL-078) opera sobre el plan vigente. Nutrición resolvió lo mismo con una lista propia fuera del 09 (API-NUT-16-LISTA, DL-055).

**Opciones.**
- **A.** Una sección «Tu historial» en la APK con lo que el contrato ya da: la lista de planes (TRN-08) y cada plan tal como se aceptó (TRN-09). Para las sesiones registradas, una lectura propia por período exigiendo solo A3, declarada como desvío igual que DL-055.
- **B.** Dejarlo en la API hasta que el 09 declare una lectura de historia del titular.

**Provisorio en código.** B: nada nuevo en la APK. **Recomendación: A**, en el paquete que siga a la entrega, porque es la única forma de que el asesorado **vea** lo que la garantía le reconoce; sin pantalla, el derecho existe pero no se puede ejercer desde el teléfono.

**Decisión (2026-09-25).** Dirección autoriza la **opción A**: acceso del asesorado a sus planes históricos y ejecuciones propias desde la APK, con la lectura propia por período que faltaba.

**Qué se hizo.**
- **API:** `GET /me/training/executions` (**API-TRN-19-LISTA**), lista de las sesiones registradas propias por período. Exige solo el A3 vigente del titular (08:199, 08:58, 08:406; DL-089): no depende de un plan activo ni del acceso del profesional. Es la lista que TRN-19 no da (lee de a una) y que TRN-14-PERIODO tampoco (opera sobre el plan vigente). Declarada como desvío del 09, igual que API-NUT-16-LISTA (DL-055): está en el OpenAPI generado y `contratos-wp06.test.ts` la cuenta. Ventana de hasta un año; no pagina, con un tope de seguridad de filas.
- **APK:** una sección **«Tu historial»** (acceso desde Cuenta, siempre alcanzable): sus **planes** (TRN-08) y cada plan tal como se aceptó (TRN-09), reutilizados sin cambio, y sus **sesiones registradas** por período con su detalle (la pantalla de ejecución existente, TRN-19, que muestra original y correcciones). De solo lectura.
- **Pruebas:** seis casos de integración (titular consulta lo propio; otro usuario no; con B2 revocado se conserva la lectura y «Hoy» pasa a no disponible; A3 revocado da 403; la corrección no oculta el original; sin plan vigente, un período sin registros devuelve la lista vacía).

**Condición de cierre.** No se cierra como verificada hasta la comprobación visual de «Tu historial» en el teléfono. La pantalla está desde la **APK 0.11.0**, y las correcciones de la validación en teléfono (#89), en la **APK 0.11.1** (`be-apk-0.11.1`, commit `44bea3a`). La corrección del período de 21 a 24 h (#94) está en la **APK 0.11.2**, y la del teclado (#97), en la **APK 0.11.3** (`be-apk-0.11.3`, commit `13280e6`). Faltaba esa evidencia en dispositivo con la 0.11.3; se obtuvo el 2026-09-27 (ver «Cierre»). Trazabilidad: `docs/paquetes/WP-HISTORIAL-ENTRENAMIENTO.md`; evidencia de publicación: `EVIDENCIA/HISTORIAL-ENTRENAMIENTO/`.

**Cierre (2026-09-27).** Se cumplió la condición de cierre: Dirección validó «Tu historial» en el teléfono con la **APK 0.11.3** (commit `13280e6`) entre las 21:43 y las 21:50, y confirmó que todos los puntos funcionaron. El registro separa lo observable en las siete capturas, lo confirmado por Dirección y las pruebas automatizadas: `EVIDENCIA/HISTORIAL-ENTRENAMIENTO/validacion-0.11.3.md`. Quedaron cerrados los cinco hallazgos de la validación: volver al origen, fecha civil, área inferior, carga de 21 a 24 h y teclado. **Limitaciones conocidas que se conservan:** ventana automática de 90 días, sin selector de período ni paginación, y el desplazamiento se reinicia al volver del detalle. Van a una revisión funcional posterior (Plan Funcional, PF-07, DEC-09).

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

## DL-100 — Plantilla «Antecedentes para entrenamiento» con seis conceptos

**Prioridad:** alta · **Documento:** B10-06 §4 (CAND-10-TRN-A, «RATIFICAR») · 04 RF-071 · WP-07 · **Estado:** DECIDIDA 2026-09-27

**Qué pasa hoy.** El catálogo de formularios tiene solo FRM-SALUD y FRM-HABITOS, sintéticas y transversales. No hay ninguna plantilla de entrenamiento, aunque B10-06 §4 prevé pedir «Antecedentes para entrenamiento» desde la evaluación.

**Decisión de Dirección.** Se ratifica la plantilla `FRM-ENTRENAMIENTO` v1 tal como la propone `docs/propuestas/PF-01-02_contexto-de-entrenamiento.md` §2:
- **Obligatorios:** objetivo declarado, experiencia, días por semana, minutos por sesión, y lugar y equipamiento.
- **Opcional:** preferencias.

Son preguntas de producto, no un instrumento clínico. Los textos pueden ajustarse después con una versión 2 de la plantilla, si lo pide una revisión profesional.

## DL-101 — Los campos NUMBER aceptaban cualquier número

**Prioridad:** media · **Documento:** 09v16.1 §22 · DL-095 · **Estado:** DECIDIDA 2026-09-27

**Qué pasa hoy.** Un campo `NUMBER` solo exige un número finito (`lectura-formularios.ts`): «9 días por semana» o «-1 minutos» se aceptan.

**Decisión de Dirección.** Se agregan restricciones opcionales al campo `NUMBER` de la plantilla (mínimo, máximo y entero), validadas en el servidor al responder y al rectificar. Para FRM-ENTRENAMIENTO:
- **días por semana:** de 1 a 7, entero;
- **minutos por sesión:** de 1 a 600, entero.

Las plantillas existentes no cambian. Amplía la forma provisoria de DL-095. **El plan proponía admitir 0 días; Dirección fijó el mínimo en 1.**

**Limitación conocida:** el rechazo no dice qué campo ni qué rango, y la APK muestra un mensaje genérico. Queda como **DL-104**.

## DL-102 — La evaluación de entrenamiento no puede citar respuestas de forma verificable

**Prioridad:** alta · **Documento:** 09v10 TRN-01 · CA-FOR-04 del Plan Funcional · **Estado:** DECIDIDA 2026-09-27

**Qué pasa hoy.** `evidenceReferences` de la evaluación es una lista de textos sin validar, y el website siempre la manda vacía. Solo la revisión tiene evidencia tipada, y no incluye respuestas de formulario.

**Opciones.**
- **A.** Un campo nuevo de referencias a respuestas concretas, validado en el servidor. La respuesta tiene que ser de la misma persona y del alcance, y el profesional tiene que poder leerla en ese momento. Al leer la evaluación, cada referencia se resuelve con las reglas de FRM-05, con aviso neutral si ya no es legible.

**Nota de implementación (PR #101).** Las condiciones de una cita (mismo asesorado, Solicitud del mismo profesional, alcance ENTRENAMIENTO) coinciden con las de FRM-05, y la evaluación ya exige el PDP de ENTRENAMIENTO para ese par. Por eso una cita se lee exactamente cuando se lee su evaluación: si se revoca B2 o A3, o se pausa o finaliza el vínculo, la evaluación entera da 404 neutral y no hay un aviso por cita. La base repite la pertenencia en un trigger. La versión vigente al citar la fija la API.

**Precondición de versión (auditoría del PR #102, 2026-09-28).** El website muestra un valor, pero antes enviaba solo `formResponseId` y `fieldCode`: si la persona rectificaba entre la carga de la pantalla y el envío, la API citaba en silencio la versión nueva, un valor distinto del que el profesional eligió. Ahora cada cita puede llevar `expectedVersion`, la versión que el profesional vio (el `version` de FRM-05):
- la API la compara contra **la misma lectura** con la que fija la cita, **después** del PDP y de la pertenencia. Una respuesta ajena o inexistente sigue dando el 422 neutral;
- si cambió, responde **409 `VERSION_CONFLICT`** (issue `FORM_RESPONSE_VERSION_CHANGED`) y **no registra ni la evaluación ni ninguna cita**;
- el website la envía siempre que cita. Ante el conflicto conserva la evaluación escrita, pide actualizar el contexto y desmarca las respuestas que cambiaron, para que el profesional las revise antes de volver a enviar;
- es opcional en el contrato, para los clientes anteriores.

Es distinta de la carrera entre transacciones concurrentes, cuya prueba real sigue pendiente.
- **B.** Una convención sobre los textos libres, que no se valida.
- **C.** Copiar el valor como dato `REPORTED`, que mezcla la declaración con la observación.

**Decisión de Dirección.** A. `evidenceReferences` no se toca.

## DL-103 — Alcance del primer incremento de contexto

**Prioridad:** media · **Documento:** Plan Funcional §12.3 · DEC-04 · **Estado:** DECIDIDA 2026-09-27

**Decisión de Dirección.** El primer incremento cubre solo entrenamiento, con los tipos actuales: lugar y equipamiento van como texto. La selección simple o múltiple y el patrón para nutrición (PF-04) y antropometría (PF-06) quedan para después, reutilizando lo que deje este incremento.

## DL-104 — Un valor fuera de rango en un formulario no le dice a la persona qué corregir

**Prioridad:** media · **Documento:** DL-101 · 09v16.1 §22.7 (FRM-07) y §22.8 (FRM-08) · auditoría del PR #100 (2026-09-28) · **Estado:** EN CURSO (opción A integrada y publicada en la APK 0.12.0; falta la validación de Dirección en el teléfono)

**Qué pasa hoy.**
- Con DL-101, la API rechaza un número fuera de los límites de la plantilla (por ejemplo, «9» en días por semana) con `422 FORM_RESPONSE_INVALID`. La respuesta trae solo el código y un mensaje de texto: **no trae un issue que nombre el campo ni el rango**.
- La APK 0.11.3 no tiene un caso para ese código y muestra el mensaje genérico «El servicio no está disponible en este momento. Probá de nuevo más tarde.».
- La persona solo conoce el rango por el `helpText` del campo, que ve antes de responder. El rechazo no le dice qué dato corregir.
- Pasa igual al responder (FRM-07) y al rectificar (FRM-08).

**Criterio de aceptación.** Ante un valor fuera de rango, la interfaz indica **qué dato corregir y qué rango admite**, tanto **al responder** como **al rectificar**.

**Opciones.**
- **A.** La API agrega al 422 un issue por campo (código de campo y límites), declarado en el contrato. La APK traduce ese issue a un mensaje junto al campo, con el rótulo y el rango. Requiere APK nueva.
- **B.** La APK valida antes de enviar. No es viable sin exponer los límites en FRM-02, y eso rompe a la APK instalada (DL-101).

**Provisorio.** Sin cambios: el rechazo en el servidor protege el dato, y el `helpText` anticipa el rango. Por decisión de Dirección (auditoría del PR #100), **no se amplía el PR #100 ni se construye otra APK por este punto**. **Recomendación: A**, en la próxima tanda que incluya una APK.

**Decisión (Dirección, 2026-09-28): opción A.** Errores estructurados por campo en la API y mensajes comprensibles en la APK. No cambian los rangos aprobados (DL-101) ni la obligatoriedad de los campos.

**Implementación (PR independiente, sin integrar).**
- **API (FRM-07 y FRM-08).**
  - Un número que no respeta los límites de su campo se sigue rechazando con `422 FORM_RESPONSE_INVALID`. Ahora `error.details.issues` trae **un issue por campo, todos a la vez**, con el formato `{ code, path, fieldCode, limits }`.
  - Códigos de issue: `FORM_ANSWER_NOT_INTEGER`, `FORM_ANSWER_BELOW_MINIMUM` y `FORM_ANSWER_ABOVE_MAXIMUM`. `path` apunta a la respuesta enviada (`answers[2].value`), y `limits` son los límites de la plantilla.
  - **No repite el valor enviado.** Los límites son del catálogo, iguales para todos: no revelan nada de nadie. FRM-07/08 son operaciones propias del titular (09:1652-1658).
  - Los demás rechazos del mismo código siguen igual y **sin detalle**: otro tipo de valor, falta un requerido, un campo repetido o no pedido.
- **Contrato.**
  - `ProblemaDeRespuestaSchema` y `DetalleDeRespuestaFueraDeLimitesSchema` están en `contratos-formularios.ts`. OpenAPI los declara en el 422 de API-FRM-07 y API-FRM-08, sobre el `ErrorEnvelope` común.
  - No se amplió el `ValidationIssueSchema` transversal.
  - **Las respuestas exitosas de FRM no cambian.**
- **Compatibilidad con la APK 0.11.3.**
  - El detalle viaja dentro de `error.details`, que ese cliente no valida: sigue reconociendo el `FORM_RESPONSE_INVALID` y muestra lo mismo que antes.
  - Una clave nueva en `error` o en la raíz lo habría convertido en un resultado incierto. Por eso no se usó.
- **APK (`formularios.tsx`, con la lógica pura en `packages/domain/src/errores-de-formulario.ts`).**
  - Cada campo rechazado muestra, junto a él, qué pasó y qué valores admite, con la unidad de la plantilla. Ejemplo: «Es más de lo que se admite. Ingresá un número entero entre 1 y 7 días por semana.».
  - Un resumen junto al botón se anuncia al lector de pantalla («Revisá los campos marcados. Hay 2 datos que necesitan corrección.») y nombra cada campo por su rótulo.
  - Si el 422 no trae un detalle reconocible, dice «No pudimos guardar: hay un dato que no se puede aceptar…», **no** «El servicio no está disponible». La red y el servicio siguen con sus mensajes.
  - Lo escrito se conserva. La clave de idempotencia se renueva después del rechazo (es definitivo) y se conserva solo ante un resultado incierto, con el botón en «Reintentar».

**Qué quedó comprobado y cómo.**
- **Integración, contra PostgreSQL y la API real** (`test/integration/formularios-errores.int-spec.ts`):
  - rechazo al responder y al rectificar;
  - cada límite con su código y los dos campos a la vez;
  - nada escrito en el rechazo;
  - corrección y éxito, también reusando la clave del rechazo;
  - el conflicto de versión antes que los límites;
  - el respaldo sin detalle;
  - las respuestas exitosas de FRM-02, 05, 06, 07 y 08 validadas contra los esquemas estrictos de la APK.
- **Unitarias del dominio** (`errores-de-formulario.test.ts`):
  - qué límite se vulnera;
  - el cuerpo nuevo pasando por **el mismo cliente HTTP que compila la APK 0.11.3**, reconocido y nunca incierto;
  - los mensajes por campo, con el rótulo, el rango y la unidad;
  - el respaldo ante issues no reconocidos;
  - que la red, el servicio o un conflicto no se confunden con un rechazo de datos;
  - los textos sin términos prohibidos.
- **Pantalla de la APK:** revisión del código y typecheck. **No se probó en un dispositivo.** Este repositorio no corre la APK en el navegador, y en esta tanda no se construye otra APK.

**Qué falta para cerrarla.** La comprobación en una APK construida con este cambio, al responder y al rectificar «Antecedentes para entrenamiento»:
1. Con «9» en días por semana, el mensaje aparece junto a ese campo, con el rango, y el resumen se anuncia.
2. Con «9» en días y «45,5» en minutos, se marcan los dos a la vez.
3. Lo escrito sigue en pantalla; al corregir, el mensaje del campo se va y el envío se registra.
4. Sin conexión, el mensaje es «No pudimos confirmar el resultado. Reintentá.» y el botón dice «Reintentar»; no aparece el de dato no aceptado.

Hasta esa comprobación, DL-104 no se declara cerrada.

**Publicación (2026-09-28).** La opción A salió en la APK **0.12.0** (release `be-apk-0.12.0`, commit `33b533d`), junto con PF-03 (DL-105). El recorrido de validación está en `EVIDENCIA/PUBLICACION-0.12.0/LEEME.md`.

## DL-105 — Primer incremento de PF-03: «Lo planificado, visible y comparable»

**Prioridad:** alta · **Documento:** 04 RF-040, RF-042 y RF-045 · 05 UC-P17 · ficha `docs/propuestas/PF-03_profundizacion-de-entrenamiento.md` (PF03-D-1) · **Estado:** DECIDIDA 2026-09-28

**Qué pasa hoy.**
- La APK resume cada prescripción con las repeticiones de la primera serie: una pirámide 10/8/6 aparece como «3 × 10».
- No muestra el descanso ni los demás parámetros, las notas ni la referencia del %RM. Tampoco muestra las indicaciones de la sesión mientras se registra, ni lo planificado en cada serie pendiente.
- La nota por serie existe en el contrato, pero el editor no la ofrece.
- En Ejecuciones, el website reduce lo planificado a «N series».

**Decisión de Dirección (PF03-D-1, opción A).** Mostrar lo planificado de forma fiel y comparable, **con el contrato actual**:
- una presentación compartida de todas las series (iguales, distintas, rangos y repeticiones no fijadas), con las indicaciones de la sesión, la nota de la prescripción, las notas por serie, los parámetros con su unidad, el criterio y la referencia de intensidad, y la carga sugerida;
- **website:** editar y conservar las notas por serie; un atajo de descanso que precarga solo el rótulo y la unidad, **sin inventar un valor**; ayuda para escribir el tempo como texto; y la comparación legible entre lo planificado y lo registrado;
- **APK:** la presentación completa en «Hoy», en la sesión y en el historial, y lo planificado como referencia mientras se registra. **Lo planificado no se carga como realizado.**

Se conservan las instantáneas históricas, la navegación corregida (DL-096) y la separación entre planificación y ejecución.

**No se aprueban con esta decisión:** el descanso estructurado (PF03-D-2), las alternativas preaprobadas (PF03-D-4), los cuestionarios nuevos (PF03-D-6 y D-7), los objetivos nutricionales por tipo (PF-04) ni un cambio global para que el cliente ignore propiedades desconocidas (PF03-D-5 D). Siguen como propuestas.

**Entrega prevista.** Dos PR de código: dominio y website; APK. La APK sale en una única publicación junto con DL-104, que se construye después de auditar los dos PR.

**Estado de la implementación (2026-09-28).** Integrada: #106 (`05eba13`, dominio y website, desplegado en `test`) y #107 (`2cf5091`, APK). Publicada en la APK **0.12.0** (`be-apk-0.12.0`, commit `33b533d`). La decisión está tomada; **la comprobación nativa queda pendiente** hasta la validación de Dirección en el teléfono (`EVIDENCIA/PUBLICACION-0.12.0/LEEME.md`). Hallazgo no bloqueante registrado ahí: las series pendientes se calculan por cantidad y no por índice.

## DL-106 — Una serie que falta no se puede declarar como no realizada

**Prioridad:** media · **Documento:** 06 REG-06-131/132 (condición de la sesión) · 09v10 TRN-15 a 20 (registro por serie y corrección) · orden de Dirección del 2026-09-29 (comparación visual entre lo planificado y lo registrado) · **Estado:** ABIERTA

**Qué pasa hoy.**
- La única declaración de omisión que existe es la de la sesión entera: «No pude realizarla» (`NOT_COMPLETED`).
- En un registro por serie, una serie planificada que no está registrada puede significar dos cosas distintas: que la persona no la hizo, o que no la anotó. El contrato no permite decir cuál.
- La comparación visual (`EVIDENCIA/PF-03/comparacion/LEEME.md`) sigue la regla de Dirección: la muestra como «Sin dato: la serie no está en el registro». Nunca la muestra como «no realizada» ni como cero.
- Tampoco se agregó un flujo de declaración: la orden lo excluye.

**Opciones.**
- **A. Mantenerlo así.** La ausencia de una serie es siempre «sin dato», y solo la sesión entera se declara no realizada. No cambia el contrato, la API ni la APK.
- **B. Extender el registro con una declaración por serie** («no la hice», con un motivo opcional), en el borrador, la confirmación y la corrección (TRN-16 a 20). Así la comparación podría mostrar «no realizada, declarada» en esa serie. Requiere:
  - contrato, API y migración;
  - una pantalla nueva en la APK y una APK nueva;
  - resolver la compatibilidad con las APK publicadas, cuyos esquemas estrictos rechazarían una propiedad nueva en la ejecución (PF03-D-5).

**Recomendación del ejecutor.** A para la entrega. B, si Dirección la quiere, como un incremento propio de PF-03, con su diseño de compatibilidad.

## DL-107 — El profesional no tiene una vista de cartera: no sabe a quién mirar hoy

**Prioridad:** media · **Documento:** 06 REG-06-145/150 (próxima revisión y expectativa del Proceso) · B10-08 §8.4 (no listar lo oculto) · 10-B04:1171-1176 (vista parcial) · ficha `docs/propuestas/PF-07_vista-de-cartera.md` · **Estado:** **DECIDIDA** 2026-09-30

**Qué pasa hoy.**
- El espacio profesional lista los vínculos y las solicitudes; el dashboard existe por asesorado (API-DSH-03). Con veinte asesorados son veinte pantallas para saber quién tiene una revisión vencida o un plan sin activar.
- La expectativa de revisión ya vive en el servidor (`proxima_revision` por Proceso); nadie la agrega.

**Decisión (Elián, 2026-09-30, sobre la ficha PF-07).**
- **D-1 alcance:** los siete tipos de pendiente en el incremento 1: revisión vencida, próxima y sin fecha; plan en borrador; sin plan activo; formulario sin responder; evaluación antropométrica en preparación.
- **D-2 ventana:** «revisión próxima» = hasta 7 días, fijos.
- **D-3 actividad:** «sin registros en el período» es un dato de la fila, nunca un pendiente ni un juicio («inactivo»).
- **D-4 orden:** fijo por urgencia objetiva; filtros por dominio y tipo.
- **D-5 (DEC-09):** el período del historial de la APK queda aparte; acá el período acota solo la actividad.
- **Ubicación:** «Pendientes» arriba de «Tus asesorados» en el espacio profesional, sin navegación nueva.

> **Nota del 2026-10-03 (DL-116).** El ID de esta operación pasa a API-CAR-01: API-DSH-04 es, en el 09, la línea temporal.
> Lo que sigue conserva el ID con el que se decidió.

**Cómo se ejecuta.** API-DSH-04 `GET /me/portfolio` (rama `feat/cartera-profesional`): el PDP decide y registra por asesorado y alcance como en API-DSH-03; un alcance denegado no aparece y deja `partialView`. Sin tablas nuevas, sin APK.

## DL-108 — Todo plan empieza en blanco: no hay reutilización entre asesorados

**Prioridad:** media · **Documento:** DL-047 (nueva versión a partir de la efectiva) · RF-060 (procedencia del catálogo) · INV-06-109 · ficha `docs/propuestas/PLANTILLAS-DEL-PROFESIONAL_ficha.md` · **Estado:** **DECIDIDA** 2026-09-30 · pendiente de implementar

**Qué pasa hoy.** `CrearPlanDeEntrenamientoRequest` y `CrearPlanRequest` solo admiten una estructura escrita o `basedOnPlanId` de la misma persona. El profesional copia a mano de una pestaña a otra.

**Decisión (Elián, 2026-09-30, sobre la ficha TPL).**
- **D-1 propiedad:** las plantillas son solo del profesional que las creó; si deja BE quedan inactivas y los planes aplicados conservan su instantánea.
- **D-2 qué se copia:** la estructura; nada cuantitativo de la persona por defecto (sin cargas sugeridas ni cantidades), con un interruptor apagado que las trae como «referencia de la plantilla» hasta que el profesional las confirme.
- **D-3 notas:** al guardar, cada nota de texto libre se muestra y se confirma o se vacía una por una.
- **D-5 objetivo:** siempre de la persona; la plantilla no lo trae.
- Sin decidir todavía: D-4 (baja del profesional, recomendada (a)), D-6 (catálogo importado, recomendada (a)), D-7 (nombre canónico del paquete).

**Cómo se ejecuta.** Según la ficha, §i: PR-1 dominio + API + Prisma (entrenamiento), PR-2 website, PR-3 nutrición; sin APK.

## DL-109 — «Mis habituales»: los elementos y bloques que el profesional repite

**Prioridad:** media · **Documento:** ficha «Plantillas del profesional» (`docs/propuestas/PLANTILLAS-DEL-PROFESIONAL_ficha.md`, mejora C) · DL-108 (plantillas del profesional) · 06 REG-06-111 (identificadores de nodo por plan) · **Estado:** DECIDIDA 2026-09-30

**Qué pasa hoy.**
- Las plantillas (DL-108) resuelven el plan entero. Lo que el profesional repite de a pedazos (el mismo ejercicio en cada plan, la misma sesión de pierna, el mismo desayuno) se vuelve a buscar y a escribir cada vez.

**Decisiones de Dirección (2026-09-30).**
- **D-1 Alcance: elementos y bloques.** Ejercicios y alimentos habituales (una marca por profesional y elemento, a mano arriba de cada buscador) y sesiones y comidas habituales (un bloque con nombre que se guarda desde el editor y se inserta en cualquier borrador).
- **D-2 Reguardado con el mismo nombre: reemplaza, con aviso.** El website avisa «Ya tenés una sesión habitual «X»: se reemplaza» y pide confirmar. Sin versiones: el bloque es una herramienta de trabajo y ningún plan depende de él (lo insertado ya es del plan). La API exige que el pedido señale qué habitual reemplaza (`replaces`); sin eso, el nombre tomado es 409 `PRESET_NAME_TAKEN`.
- **Heredado de DL-108:** solo lo ve y lo usa el profesional que lo creó (lo ajeno es 404 neutral; otra área o un asesorado, 403); las cargas y las cantidades no se copian salvo pedido; las notas de texto libre se confirman una por una; nada de la persona.
- **Regla técnica:** un bloque habitual se guarda **sin identificadores de nodo** y se inserta sin ellos: el servidor los asigna al guardar el borrador (REG-06-111: por plan, estables). Así el mismo bloque se puede insertar dos veces.
- **Estados como enums** (`EstadoDeHabitual`: ACTIVO, QUITADO): quitar no borra la fila; volver a marcar, o guardar con ese nombre, la reactiva y reemplaza. La historia queda en los eventos de dominio.

**Qué queda afuera.** Habituales compartidos entre profesionales; bloques de más de un nivel (un bloque entero de entrenamiento, un día tipo); la APK (el profesional trabaja en el website).

## DL-110 — Formularios propios y protocolos propios: qué se hace y qué no

**Prioridad:** media · **Documento:** crítica de negocio del 2026-09-30 (mejoras D y E) · 06 REG-06-209 · 05 UC-P32 · WP-07 D-D y §8 · 06 T-06-33 · 05 UC-P19 · 10 DIR-10-MET-A · 06 REG-06-151/157/162/168 · **Estado:** DECIDIDA 2026-09-30

**Qué pasa hoy.**
- Las plantillas de formulario son un catálogo de BE sembrado por migración, con tres tipos de campo. El legajo excluye en P0 que el profesional arme las suyas («P0 no modela un builder libre arbitrario», REG-06-209), y WP-07 registra el editor como descartado por Dirección.
- Los protocolos de medición y los métodos de cálculo son un catálogo sintético (PROTO-LAB, PROTO-CUERPO, MET-DEMO). El legajo deja el protocolo concreto al criterio profesional (T-06-33) pero exige métodos preestablecidos por BE (DIR-10-MET-A).
- La toma acepta hoy como protocolo cualquier versión de especificación, incluso la de un método o una versión reemplazada, y no controla las mediciones ni las unidades declaradas.

**Decisiones de Dirección (2026-09-30).**
- **Mejora D (formularios propios): postergada.** La exclusión de P0 sigue vigente. Si se retoma, una pregunta propia del profesional no puede ser de salud: solo hábitos, preferencias, disponibilidad y logística, hasta que exista la matriz de pertinencia por acta (DL-083, DEC-06).
- **Mejora E: el catálogo antropométrico lo define BE.** Dirección carga el contenido real (primeros pedidos: protocolos de 9 y 7 componentes, índice cintura-altura e IMC; más adelante bioimpedancia, al menos para comparar, aunque los datos lleguen por archivo). El profesional elige entre lo cargado; no arma protocolos ni fórmulas propias. «Mi protocolo» se reevalúa cuando el catálogo real esté cargado y en uso.
- **Carga:** Dirección pasa cada protocolo y cada fórmula con su fuente y casos de prueba; el ejecutor los siembra por migración, versionados y con procedencia, y programa cada fórmula con pruebas contra la fuente. Planilla: `docs/propuestas/CATALOGO-ANTROPOMETRICO_planilla-de-carga.md`.
- **Comparabilidad:** se mantiene la regla actual (cada versión de protocolo es su propio grupo). Comparar por medición exige cambiar la respuesta de la evolución y una APK nueva.
- **Validación de la toma:** se cierra junto con la carga del catálogo (al crear, solo un protocolo vigente del catálogo; al corregir, el que ya tenía).

**Qué queda afuera.** Protocolos y fórmulas del profesional; métodos con varios componentes por ejecución y repeticiones por medición, hasta que el contenido los pida; importación de bioimpedancia por archivo.

**Pendiente de Dirección.** El contenido de cada protocolo y método, según la planilla.

## DL-111 — El catálogo antropométrico de BE: perfil completo, 40 fórmulas, lámina y evolución física en la APK

**Prioridad:** alta · **Documento:** pedido de Dirección del 2026-09-30 (noche) · DL-110 · DL-073 · 06 REG-06-156/157/162/165/166/203/204/205 · RF-048 · RF-049 · INV-06-06 · TEST-PRJ-009 · **Estado:** IMPLEMENTADA, A RATIFICAR por Dirección

**Qué pidió Dirección.** La lámina del compositor (`BE-VIS-Compositor_v13.3.html`) en el website del profesional; la figura con las medidas y la comparación también en la APK, porque hoy la persona ve casi nada; y las fórmulas antropométricas investigadas y programadas, para que el profesional elija el método viendo qué datos pide y qué resultados da, y para que esos resultados lleguen a la APK como progreso físico real. DL-110 había dejado la carga del contenido a Dirección; este pedido la reemplaza por la investigación del ejecutor, con la fuente de cada fórmula a la vista.

**Lo que se hizo y las decisiones que tomó el ejecutor (a ratificar).**
1. **Protocolo «Perfil antropométrico completo»** (migración `20261001000000`): 30 mediciones con los sitios de la lámina de Dirección: peso, talla (en cm), edad, 11 pliegues, 13 perímetros y 3 diámetros. Los protocolos sintéticos quedan como están.
2. **Ficha de investigación** (`docs/propuestas/METODOS-ANTROPOMETRICOS_ficha.md`): 58 entradas con fuente, población, sitios, fórmula y 199 casos de prueba verificados con una segunda implementación. Lo que no tiene fuente primaria verificable no se siembra (§13): US Navy, Faulkner para mujeres, masa ósea de Martin, De Rose y Guimarães para mujeres y las partes de Kerr que BE no puede medir.
3. **40 métodos** (migración `20261001010000`), cada uno con descripción, fuente, población y categoría, y una regla versionada con pruebas contra los casos de la ficha (`formulas-antropometricas.ts`):
   - índices: IMC, cintura/cadera, cintura/talla y conicidad;
   - sumas de pliegues: 6 y 8 de ISAK, 7 de Jackson y Pollock;
   - grasa corporal: Durnin y Womersley, Jackson y Pollock (7 y 3 pliegues), cada una con Siri y con Brozek; Faulkner (hombres), Yuhasz-Carter, RFM, BAI y Deurenberg;
   - masas: grasa y libre de grasa de Faulkner (hombres), ósea de Rocha, residual de Würch, muscular en cuatro componentes (hombres) y muscular esquelética de Lee (con perímetros y con peso y talla);
   - somatotipo de Heath y Carter, con sus tres componentes.
4. **Sitios** (ficha, §2): el suprailíaco de Jackson y Pollock se toma en la **cresta ilíaca**, como el consenso del GREC (D-1); el de Faulkner, en el supraespinal; el de Durnin y Womersley, en la cresta ilíaca. La lámina rotula «Supraespinal» el punto frontal que el compositor llama «Suprailíaco».
5. **Las ecuaciones que difieren por sexo son métodos distintos.** El sexo no es un dato de la toma: lo elige el profesional al elegir el método. **La edad sí es un dato de la toma** (medición «edad», en años).
6. **Un resultado por método.** Las cadenas (densidad y después Siri o Brozek) viven dentro de la regla, sin redondear en el medio. Un porcentaje de grasa o una masa de cero o menos es un error de dominio (D-6), y el somatotipo usa el mínimo de 0,1 del manual.
7. **Una métrica por familia de fórmulas** (por ejemplo «Grasa corporal (Faulkner)»), no una genérica como propone la ficha (D-12): la evolución publica una observación por día y métrica, y con una genérica dos métodos de la misma toma se pisarían.
8. **La evolución incluye los resultados.** Las corridas vigentes de soporte antropométrico entran a API-ANT-06 como puntos de clase calculada, con el momento de sus entradas y agrupados por método. Una corrida reemplazada o con una entrada anulada no aporta punto. La forma de la respuesta no cambia: la APK 0.12.1 sigue funcionando.
9. **Los nombres viajan en el dominio.** El asesorado no consulta el catálogo (API-MTH-01 es del profesional), así que los nombres de mediciones, resultados y métodos salen de un mapa generado del mismo catálogo (`nombres-de-metricas.ts`).
10. **Ficha del método en el website**: al elegir, el profesional ve qué es, qué da, qué pide (y si la toma lo tiene), la fuente y la población; cada dato se asigna solo a la medición vigente de la toma, y se puede cambiar. Las listas de métodos y de corridas se leen completas (venían de a 20).
11. **La lámina y la figura ubican, nunca califican.** No se trajeron los colores de «mejoró» y «empeoró» del modo Serie, ni los textos de «insights», ni el perfil nutricional de «Conclusiones» (es de otro dominio). Una diferencia es una resta con signo.
12. **Lee y col. (2000)** tiene un término por etnia: BE aplica el de la muestra blanca e hispana (0) y lo dice en la población del método (D-2).
13. **REG-06-157** prohibía fijar un catálogo científico desde WP-05. Queda superado por la decisión de Dirección (DL-110 y este pedido): BE ofrece varios métodos con su fuente y el profesional elige; ninguna corrida se adopta sola (REG-06-205).

**Límites declarados.** Ningún profesional de Dirección validó todavía los coeficientes, los sitios ni las poblaciones: están contrastados con las fuentes y con dos implementaciones independientes, no con un caso clínico. La APK no se probó en un teléfono. La validación de la toma (al crear, solo un protocolo vigente del catálogo) sigue abierta, como dice DL-110.

**Pendiente de Dirección.** Ratificar las decisiones 1 a 13. Decidir las abiertas de la ficha (§15.2): sitio del suprailíaco (D-1), término de etnia de Lee (D-2), sitios de muslo, pecho y cintura (D-3, D-4), densidad como resultado visible (D-7), métodos de Heymsfield, Martin y Kerr, y los índices de VanItallie y Kouri. Decidir si «Conclusiones» lleva la TMB y el perfil nutricional, y con qué método.

---

## DL-112 — Purga del catálogo antropométrico: 21 métodos vigentes; los retirados siguen en la historia

**Prioridad:** alta · **Documento:** pedido de Dirección del 2026-10-01 («28 métodos son demasiados, hagamos una purga y dejemos los más usados y los más efectivos») · DL-111 · 06 REG-06-205 · RF-048 · DL-072 · **Estado:** DECIDIDA la purga; la lista, A RATIFICAR por Dirección

**Qué pidió Dirección.** Elegir un método entre 40 (28 resultados distintos) era demasiado. Pidió dejar los más usados y los más efectivos.

**Criterio del ejecutor.** Se quedan:
- los métodos de uso corriente en la consulta;
- los que tienen validación publicada contra un método de referencia;
- los que la lámina de Dirección usa: la suma y el porcentaje de Jackson y Pollock con 7 pliegues.

Salen:
- lo redundante: la variante de Brozek cuando los autores usaron Siri, y Jackson y Pollock con 3 pliegues cuando está el de 7;
- lo de validación débil o con la fuente original no accesible.

Cada retiro lleva su motivo en la migración.

**Vigentes (21).**
- Índices: IMC, cintura/cadera y cintura/talla.
- Sumas de pliegues: 6 de ISAK y 7 de Jackson y Pollock.
- Grasa corporal (Siri):
  - Durnin y Womersley, hombres y mujeres;
  - Jackson y Pollock, 7 pliegues, hombres;
  - Jackson, Pollock y Ward, 7 pliegues, mujeres;
  - RFM, hombres y mujeres.
- Masas:
  - grasa y libre de grasa de Durnin y Womersley, hombres y mujeres;
  - ósea de Rocha;
  - muscular esquelética de Lee con perímetros, hombres y mujeres.
- Somatotipo de Heath y Carter: endomorfia, mesomorfia y ectomorfia.

**Nuevos (4).** Masa grasa y masa libre de grasa de Durnin y Womersley, para hombres y para mujeres. Son el peso por el porcentaje de grasa de la misma ecuación, sin redondear en el medio. Así la composición en kilos no depende de Faulkner, que sale. Sus pruebas usan los casos de la ficha.

**Retirados (23), con su motivo.**
- Conicidad: poco usado.
- Suma de 8 pliegues: quedan la de 6 y la de 7.
- Variantes de Brozek de Durnin y Womersley y de Jackson y Pollock (4): los autores usaron Siri.
- Jackson y Pollock con 3 pliegues, con Siri y con Brozek (4): queda el de 7, más preciso.
- Faulkner, más su masa grasa y su masa libre de grasa (3): una ecuación de nota de tabla, sin validación demostrada y solo para hombres.
- Yuhasz-Carter (2): los originales no estuvieron accesibles.
- BAI: precisión baja frente a DXA.
- Deurenberg (2): la estimación más gruesa del catálogo.
- Masa residual de Würch (2): solo tiene sentido dentro del modelo de cuatro componentes, que sale.
- Masa muscular en cuatro componentes: depende de Faulkner.
- Lee con peso y talla (2): queda el de perímetros, más preciso.

**Cómo se retira sin borrar.** Las especificaciones son de solo agregar (DL-072), así que el retiro es una tabla nueva, `retiro_de_especificacion`, también de solo agregar, con su motivo y su momento. La migración es `20261002000000_purga_del_catalogo_antropometrico`; la `20261001010000`, ya aplicada en test, no cambia.

Un método retirado:
- no se lista en API-MTH-01 ni se ofrece al calcular;
- si se pide una corrida nueva con él, la API responde 422 `METHOD_VERSION_NOT_SELECTABLE` y dice que fue retirado;
- se sigue consultando (API-MTH-02) como histórico;
- las corridas que ya se hicieron con él siguen en la evaluación, en la lámina y en la evolución.

**Pendiente de Dirección.** Ratificar la lista. Para recuperar un retirado, se publica de nuevo como especificación nueva con la misma regla: el retiro no se borra.

---

## DL-113 — UX y UI: navegación inferior en la APK, menos texto a la vista, avisos donde se mira y una guía de buenas prácticas

**Prioridad:** alta · **Documento:** pedido de Dirección del 2026-10-01 · prueba de Dirección del 2026-10-01 en test · B10-10 · RNF-ACC-001 · TEST-PRJ-009 · 06 REG-06-156/158 · DL-111 · **Estado:** IMPLEMENTADA, A RATIFICAR por Dirección; falta la prueba en el teléfono

**Qué pidió Dirección.** «Ya le vayamos poniendo UX y UI.» Pidió también:
- una navegación en la zona baja de la APK, «como en las apps», para pasar de una zona a otra;
- menos texto, porque «si no, se perderán funcionalidades por no verse»;
- dejar planteadas las buenas prácticas que se van a seguir.

En la prueba del mismo día marcó cinco cosas:
- el aviso de «Registrar evaluación» aparecía arriba de todo en el teléfono;
- los óvalos de la figura de la APK se rompían;
- el bíceps no estaba en la figura;
- «suprailíaco» y «supraespinal» confundían;
- el pie de Pliegues decía «—».

**Lo que se hizo, con las decisiones del ejecutor (a ratificar).**

*APK*
1. **Barra inferior con cinco zonas:** Nutrición, Entrenamiento, Evolución, Información y Cuenta.
   - Cada zona mide 56 dp, con texto e ícono y rol de pestaña para TalkBack.
   - La barra se oculta con el teclado.
   - Cuenta deja de ser el menú: quedan vínculos, estado, privacidad, apariencia, sesión y cierre.
   - **La APK abre en Nutrición.** Antes abría en Cuenta, que hacía de menú. Atrás, desde una zona, vuelve a Nutrición; desde Nutrición, sale.
2. **La figura en SVG** (react-native-svg). Los anillos son elipses, con la mitad trasera punteada. Antes eran aproximaciones que se rompían.
3. **Menos texto a la vista.** Quedan plegados:
   - en Mi evolución: «Cómo se lee» y «La figura, en lista», que es el camino del lector de pantalla;
   - el estado de la cuenta;
   - «Registrar otro día»;
   - el historial de A3.

   Lo que se lee antes de aceptar sigue a la vista: registro, consentimiento y A3.

*Website*

4. **Avisos.** Un éxito aparece fijo abajo, donde se está mirando, y se va solo (`AvisoFlotante`). Un error queda junto al formulario, con el foco.
5. **Registrar una evaluación** usa el diálogo modal centrado.
6. **Cálculos.**
   - A la vista quedan el resultado, el método, la fecha y las acciones.
   - Versión, regla, precisión y entradas quedan a un toque, en «Con qué se calculó».
   - **REG-06-156/158 se cumple a un toque, no a la vista**: a ratificar.
   - La ficha del método muestra el valor con el que se va a calcular. Cambiar la medición de un dato es la excepción y queda plegado.
7. **Aviso antes de calcular** cuando la toma ya tiene el mismo resultado con otro método, como las variantes por sexo.
   - Las dos corridas conviven.
   - La evolución muestra las dos, cada una con su método.
   - «Tu última toma» de la APK muestra la registrada al final.
   - Corrige el punto 7 de DL-111, que decía «una observación por día y métrica».
8. **Lámina.**
   - El bíceps y la cresta ilíaca van sobre la figura, con su guía, en las seis figuras. **Las coordenadas son del ejecutor y Dirección las tiene que validar**:
     - el bíceps, en la cara anterior del brazo y un poco más abajo que el tríceps;
     - la cresta ilíaca, en el borde del tronco y un poco más arriba que el supraespinal, para que su punto no quede en el camino de otra guía.
   - Con la cresta ilíaca dibujada al lado del supraespinal, se ve que son dos sitios distintos. Las fichas de Jackson y Pollock ya decían que su suprailíaco se toma en la cresta ilíaca.
   - El pie de Pliegues lleva las sumas de 6 y de 7 pliegues calculadas; sin corrida, dice «Sin calcular».
   - En Serie, una guía que pasaría sobre otro punto entra al sitio de costado. En el compositor ya pasaba con el tríceps y el antebrazo.
9. **El resto del website** sigue el mismo criterio: éxitos flotantes, confirmaciones modales y explicaciones largas plegadas.

*Guía*

10. **`docs/ux/GUIA-UX-UI.md`** reúne las buenas prácticas que se siguen desde ahora y la lista de control de cada pantalla. Cubre:
    - texto;
    - avisos y diálogos;
    - navegación;
    - toque y letra;
    - color;
    - figuras;
    - estados.

**Límites declarados.**
- La prueba en el teléfono la hace Dirección. Nada de esto se probó todavía en un teléfono: la APK se revisó con maquetas HTML de la misma geometría y el website con recorridos automáticos.
- TalkBack y la letra al máximo siguen sin probarse en un Android físico (RNF-ACC-001).
- react-native-svg es nativo: hace falta la APK nueva, porque la 0.12.2 no lo tiene.
- En la figura del teléfono, con muchos pliegues, los halos del tronco se tocan.

**Pendiente de Dirección.**
- Ratificar los puntos 1 a 10.
- Validar en el teléfono:
  - la barra;
  - la figura;
  - los plegados;
  - los avisos;
  - las coordenadas del bíceps y de la cresta ilíaca.
- Decidir si la APK abre en Nutrición o en otra zona.

**Pulido del 2026-10-02 (pedido de Dirección del mismo día).** Dirección pidió elevar la calidad visual y de uso con
implementación concreta, empezando por dos pantallas representativas. Evidencia: `EVIDENCIA/UX-PULIDO-DL113/LEEME.md`.
- **Website, toma antropométrica:**
  - las tomas se nombran por su fecha de ocurrencia;
  - los cálculos van antes que las mediciones, y las mediciones van en filas por familia;
  - la preparación muestra el protocolo completo y tiene las acciones fijas al pie, con el estado del guardado.
  - Con los mismos datos, la página de la toma bajó de 14.124 a 7.525 px de alto en un teléfono de 390 px.
- **Website, todas las pantallas:**
  - el encabezado ocupa tres renglones en el teléfono;
  - las pestañas van en una línea, con la elegida a la vista;
  - la carga y el vacío tienen su estado, y el vacío, su acción.
- **APK, «Mi evolución»:** cada fecha se dice una vez.
- **Piezas compartidas y reglas:** `docs/ux/GUIA-UX-UI.md` §10.

**Corrección del 2026-10-02: los puntos anatómicos no se mueven para resolver cruces (regla de Dirección).**
- El punto 8 corría el bíceps un poco más abajo que el tríceps y la cresta ilíaca un poco más arriba que el
  supraespinal, para que las guías no se cruzaran. **Eso no corresponde, y se revirtió**:
  - el bíceps va a la misma altura que el tríceps: es la cara anterior del brazo, y el tríceps la posterior;
  - la cresta ilíaca va a la misma altura que el supraespinal, sobre la línea medioaxilar.
  - De frente, cada par casi coincide. Sus guías llegan al mismo lugar y las tarjetas dicen cuál es cuál.
- **Los cruces se resuelven sin mover puntos:**
  - **Lámina, Serie:** la guía que pasaría sobre otro punto entra de costado. Ahora es la del tríceps en el hombre y la del bíceps en la mujer.
  - **APK:** las tarjetas se apilan por la altura media de sus sitios, no por su borde de arriba como en el compositor, y los puntos se dibujan encima de las guías.
  - Con todos los pliegues, en el hombre, los cruces bajaron de 4 o 5 a 0 o 1, según el ancho.
  - La lámina del website conserva el orden del compositor.
- **Que no haya cruces no prueba que un sitio esté bien ubicado.** La ubicación la valida Dirección.
- **Observación para Dirección:** el supraespinal del compositor está en el borde del tronco. Por ISAK va sobre la
  línea que une la espina ilíaca anterosuperior con el borde axilar anterior, a la altura de la cresta. De frente, ese
  punto cae algo más adentro que la cresta ilíaca. No se movió, porque es un sitio del compositor.

---

## DL-114 — Excepción declarada en la auditoría de dependencias: node-forge sin versión corregida

**Prioridad:** alta · **Documento:** WP-01 §2 (la auditoría de dependencias de producción falla con avisos altos o críticos) · CI del PR #128 · **Estado:** RATIFICADA por Dirección el 2026-10-03; las dos excepciones vencen el 2026-10-31

**Qué pasó.**
- El 2026-10-01 a las 21:09 UTC, GitHub actualizó el aviso GHSA-86w9-cpqp-85rv de node-forge: la verificación de firmas RSA PKCS#1 v1.5 acepta elementos DigestAlgorithm anidados de más.
- Ahora abarca hasta la 1.4.0, que es la última publicada, y **no hay versión corregida**.
- node-forge entra por `expo` → `@expo/cli`, directamente y a través de `@expo/code-signing-certificates`. Desde ese momento la auditoría de `@be/mobile` falla en cualquier PR, y también fallaría en `main`: el lock de `0308355` tiene los mismos avisos.

**Por qué el riesgo es bajo y acotado, pero no nulo** (revisado el 2026-10-02).
- La CLI usa node-forge en dos caminos, y BE no configura ninguno:
  - `@expo/code-signing-certificates` verifica firmas RSA al firmar los manifiestos de expo-updates;
  - `@expo/cli` lo usa en la firma de iOS (`run:ios`).
- node-forge no viaja en el bundle de la APK. Tampoco está en las dependencias de la API ni del website, que auditan limpias.
- Lo que queda es la cadena de construcción: el código vulnerable está instalado en la CI y en la máquina que construye la APK, aunque BE no ejecute esos caminos.
- **Solución vigente:** no hay. node-forge 1.4.0 es la última versión, y la última `@expo/code-signing-certificates` (0.0.7) sigue dependiendo de ella.

**Lo que se hizo (provisorio).**
- `npm audit --audit-level=high` no admite excepciones, así que la auditoría pasa a `scripts/auditoria-de-dependencias.cjs`.
- Sigue fallando con **cualquier** aviso alto o crítico, salvo los declarados en `EXCEPCIONES`.
- Cada excepción dice el aviso, el paquete, el motivo y la fecha de vencimiento.
- Una excepción vale solo para ese aviso en ese paquete. Vencida, vuelve a fallar.
- Las pruebas están en `scripts/auditoria-de-dependencias.test.cjs`.

**Defecto corregido el 2026-10-02.** Lo detectó y reprodujo una revisión externa (Codex).
- La primera versión del script recorría `reporte.vulnerabilities ?? {}`. Si `npm audit` no podía auditar (por ejemplo, `{"error":{"code":"ENOAUDIT",…}}`), tomaba el error como un informe limpio y aprobaba con código 0.
- Ahora un informe que no se puede leer no aprueba. Eso incluye un error de npm, una salida que no es JSON, un informe sin `vulnerabilities` o sin los conteos, y conteos altos sin ningún aviso.
- Los códigos de salida se distinguen:
  - 0: aprueba;
  - 1: hay vulnerabilidades bloqueantes o una excepción vencida;
  - 2: la auditoría no se pudo hacer.
- Las pruebas recorren el camino real, de la salida de npm al código, con informe limpio, vulnerabilidad bloqueante, excepción vigente, excepción vencida, `ENOAUDIT`, salida vacía o inválida e informe incompleto.

**Qué se puede afirmar de las corridas anteriores.** Esto no prueba que alguna CI haya sufrido el defecto.
- En las cuatro corridas con el script (`e4e75cf`, `0c02326`, `d7867ac` y `d1ddd69`), `@be/mobile` procesó un informe válido: el log muestra el aviso exceptuado.
- Para `@be/api` y `@be/web`, el log no distingue un informe limpio de un error, así que no se afirma ni se invalida nada.
- La auditoría local del 2026-10-02, con el script corregido, aprobó las dos con informes válidos.

**Avisos nuevos del 2026-10-06: corregidos, no exceptuados.** Ese día se publicaron dos avisos que hicieron fallar la
auditoría de producción de `main` y de toda rama que salga de ella (CI 37497698570):
- `sharp` < 0.35.5 · alto · GHSA-wq5f-xc86-pv6w, en `@be/api` y en `@be/web` (por `next`): pasa a 0.35.5;
- `shell-quote` 1.8.4 a 1.10.0 · crítico · GHSA-pqg4-j6r4-53mv, en `@be/mobile` (por `react-native`): pasa a 1.12.0.

Están en #149 (`5144841`) y, para `main`, en #148, que suma `d85caec` al arreglo de `source-map-js`. Las únicas
excepciones siguen siendo las de esta deuda.

**Pendiente de Dirección.**
- Ratificar la excepción o pedir otra salida.
- Antes del 2026-10-31, revisar si node-forge publicó la corrección (entonces se fija con `overrides` y la excepción se borra) o si Expo dejó de depender de node-forge.

**Ampliación del 2026-10-03: braces (GHSA-vfj7-8cjw-p6xm).** El mismo caso, con otro paquete.
- **Qué pasó.** El 2026-10-02 a las 22:36 UTC, GitHub actualizó el aviso de braces (CVE-2026-93687): un patrón con llaves
  muy anidadas agota la pila. Abarca hasta la 3.0.3, la última publicada, y **no hay versión corregida**. Desde ese
  momento la auditoría de `@be/mobile` falla en cualquier PR: #134 y #135 fallaron solo en ese paso. También fallaría en
  `main`, porque el lock tiene la misma versión.
- **Por dónde entra.** `expo` → `@expo/cli` → `@expo/metro-file-map` → `micromatch` → `braces`. Metro y la CLI lo
  usan al construir, para expandir los patrones de archivos de su configuración. No reciben datos de las personas.
- **Riesgo bajo y acotado, pero no nulo.** braces no viaja en el bundle de la APK. Tampoco está en la API ni en el
  website, que auditan limpias. Queda la cadena de construcción: la CI y la máquina que construye la APK.
- **Lo que se hizo.** Una excepción más en `EXCEPCIONES`, solo para este aviso en este paquete, que también vence el
  2026-10-31. El resto de la auditoría sigue igual.
- **Pendiente de Dirección.** Ratificarla junto con la de node-forge. Antes del 2026-10-31, revisar si braces publicó la
  corrección; si la publicó, se fija con `overrides` y la excepción se borra.
- **Revisado de nuevo el 2026-10-03, en las fuentes primarias** (avisos de GitHub y registro de npm). Los dos avisos
  siguen sin versión corregida: node-forge abarca hasta la 1.4.0, que es la última, y la última
  `@expo/code-signing-certificates` (0.0.7) sigue pidiendo `^1.4.0`; braces abarca hasta la 3.0.3, que es la última. Las
  excepciones siguen siendo por aviso y paquete y vencen el 2026-10-31. Un informe que no se puede leer no aprueba. **Ninguna
  está ratificada**: la CI verde de la candidata las incluye.

**Ratificación de Dirección del 2026-10-03** (aprobación de la candidata 0.13.2).
- **Qué se ratifica.** Solo las dos excepciones declaradas, hasta el 2026-10-31, con el alcance y las limitaciones de
  arriba:
  - GHSA-86w9-cpqp-85rv en node-forge;
  - GHSA-vfj7-8cjw-p6xm en braces.
- **Qué no.** Dirección no autoriza ampliarlas ni exceptuar otros avisos.
- **El control no cambia.** `scripts/auditoria-de-dependencias.cjs` sigue fallando en tres casos, y lo prueban sus 12
  pruebas:
  - si una excepción vence;
  - con cualquier otro aviso alto o crítico, incluido el mismo aviso en otro paquete;
  - si la auditoría no se puede hacer: un error de npm, una salida vacía o un informe incompleto.
- **Antes del 2026-10-31** hay que revisar las fuentes primarias. Si apareció una corrección, se fija con `overrides` y la
  excepción se borra. Si no, Dirección decide de nuevo.

---

## DL-115 — Revocado el A3, el titular sigue leyendo su evolución antropométrica y sus formularios

**Prioridad:** alta · **Documento:** 08:406 (08 §13) · DL-089 · TEST-AUTH-003 y TEST-AUTH-004 (DV-05) · **Estado:** ABIERTA. Se encontró el 2026-10-02, al armar la matriz de DV-05 (`docs/mesa/MESA_02/DV-05/MATRIZ_DE_RECONCILIACION_DV-05_2026-10.md`, H-1). Espera la decisión de Dirección

**Qué dice el legajo.**
- 08:406: revocar `DATOS_SALUD_BE` (A3) suspende de inmediato «toda operación sensible del servicio para ese titular (registro y acceso profesional incluidos)». Durante el plazo de decisión, los datos quedan bloqueados, «no operativos».
- DL-089 (opción A, cerrada el 2026-09-24) aplicó ese criterio a la historia del titular en entrenamiento. Dijo además que nutrición y antropometría ya lo hacían.

**Qué pasa hoy.** Se verificó leyendo el código el 2026-10-02.
- **Nutrición y entrenamiento lo cumplen.** La lectura propia de nutrición (`apps/api/src/nutricion/ingestas.service.ts`) y la historia de entrenamiento (`exigirA3Vigente`, en `apps/api/src/entrenamiento/ejecutor.ts`) responden 403 `ACTION_FORBIDDEN` al titular sin A3. La APK lo muestra: «Tu historial» avisa que necesita el A3.
- **Antropometría no lo cumple.** `EvolucionService.titularAutorizado` (`apps/api/src/antropometria/evolucion.service.ts`) devuelve la serie del titular (`/me/anthropometry/progress`, API-ANT-06-PROPIA) sin mirar el A3, y «Mi evolución» la sigue mostrando. **La frase de DL-089 sobre antropometría es incorrecta.**
- **Formularios tampoco.** API-FRM-05 (`consultarDetalle`, en `apps/api/src/formularios/solicitudes.service.ts`) le devuelve al asesorado su solicitud con la respuesta, que puede traer datos de salud, sin mirar el A3.
- Ninguna prueba ejercita estos dos caminos. Por eso, en la matriz de DV-05, TEST-AUTH-004 y la variante del titular de TEST-AUTH-003 quedan cubiertas en parte.
- **No expone datos a terceros:** el PDP sí corta al profesional. Lo que falla es el bloqueo de los datos propios del titular.

**Opciones.**
- **A.** Las dos lecturas exigen el A3 vigente, como nutrición y entrenamiento.
  - El titular sin A3 recibe 403 `ACTION_FORBIDDEN`, y el contrato suma ese 403 a API-ANT-06-PROPIA y a API-FRM-05.
  - En la APK, «Mi evolución» y el detalle del formulario muestran el mismo aviso que «Tu historial».
  - Lleva una prueba de integración por cada lectura (PE-01 de la matriz): sin A3, 403; con A3, 200; lo ajeno y lo inexistente, el mismo 404.
  - Tamaño S, unas tres horas con la APK. Hace falta una APK nueva para el aviso: sin ella, la 0.13.x mostraría un error genérico en lugar de la serie.
- **B.** Declarar la excepción: el titular conserva la lectura de lo propio mientras decide si reotorga el A3, exporta su historia o cierra la cuenta. Habría que justificarla frente a los datos «no operativos» del 08:406 y corregir DL-089.

**Provisorio en código.** B, de hecho y sin declarar.

**Recomendación: A**, por el 08:406 y por coherencia con los otros dos dominios. Además, un tribunal puede probarlo en vivo: revocar el A3 en la APK y abrir «Mi evolución».

**Resolución — DECIDIDA el 2026-10-02, opción A** (Dirección la autorizó el mismo día). Está implementada en la rama
`fix/a3-titular-antropometria-formularios`, **sin integrar**: se integra y se publica con la candidata 0.13.2, cuando
termine la prueba manual de Dirección.
- **API.** El control vive en `apps/api/src/consentimiento/a3-del-titular.ts`, y lo comparten entrenamiento (DL-089),
  antropometría y formularios. El A3 es del titular: sobre un recurso con id, primero se ve si es suyo (lo ajeno y lo
  inexistente siguen dando el mismo 404, como fija TEST-CT de WP-07) y, sobre lo propio, el A3 va antes que cualquier
  otra regla de la operación (09 §36).
  - **Evolución propia** (API-ANT-06-PROPIA, y API-ANT-06 con el propio id): 403 `ACTION_FORBIDDEN` sin A3.
  - **API-FRM-05**, la proyección del asesorado («conforme a 08», 09 §22.5): 403 sin A3. Lo ajeno y lo inexistente
    siguen dando el mismo 404.
  - **API-FRM-07**, responder: 403 sin A3, antes que «ya respondida». El PDP lo vuelve a mirar con el acto bloqueado, en
    el orden único.
  - **API-FRM-08**, rectificar: 403 sin A3. Como no pasa por el PDP, toma el acto A3 en modo compartido; así, una
    revocación en curso también la corta.
  - **API-FRM-06 se conserva.** El contrato la permite y no trae respuestas; sin A3, ninguna solicitud es respondable.
- **Contrato.** `403 ACTION_FORBIDDEN` en API-ANT-06, API-ANT-06-PROPIA y API-FRM-05, 07 y 08. Se regeneró el OpenAPI.
  También lo declaran API-TRN-08, 09 y 19, que lo devolvían desde DL-089 sin que el contrato lo dijera.
- **APK.** «Mi evolución», el detalle de un formulario y la lista de «Información» muestran el aviso con «Ir a
  Privacidad y consentimientos», como «Tu historial».
  - Lo escrito en un formulario se conserva mientras no se sale de la pantalla, y se dice así. No se guarda en el
    teléfono.
  - Cada pantalla vuelve a leer al entrar. Volver a una pantalla después de revocar no muestra lo de antes.
- **Datos previamente cargados.** No se borran: la revocación es prospectiva. Con un A3 nuevo vuelven idénticos, y está
  probado.
- **Pruebas.**
  - `test/integration/a3-del-titular.int-spec.ts` tiene 3 pruebas: la PE-01 de la matriz de DV-05, que cubre
    TEST-AUTH-004 y la variante del titular de TEST-AUTH-003. Se verificaron con una mutación: sin el control, fallan.
  - El dominio suma 4 pruebas, para el reductor y el desenlace del envío.
- **Pendiente:** la APK candidata 0.13.2 y la prueba en el teléfono.

**Hallazgo del 2026-10-03: la premisa sobre nutrición era incompleta.** DL-115 decía que nutrición ya cumplía, y lo
comprobó con la lista propia (API-NUT-16-LISTA). Pero «Tu plan de hoy» (**API-NUT-14**) leía las comidas registradas
del día antes de cualquier control y las devolvía aunque el plan quedara «no disponible». Con el A3 revocado o nunca
otorgado, la APK las mostraba debajo del aviso.
- **Se aplicó la misma opción A ya autorizada.** API-NUT-14 exige el A3 vigente antes de leer y responde 403
  `ACTION_FORBIDDEN` sin él. El contrato lo declara, y la APK muestra el aviso con «Ir a Privacidad y consentimientos».
- **Lo demás no cambia.** La suspensión por el vínculo o el B2, con el A3 vigente, sigue siendo «no disponible»
  (UC-P12 E06), con los registros propios a la vista.
- **Entrenamiento ya cumplía** (API-TRN-14): no devuelve ocurrencias sin pasar por el PDP, que mira el A3.
- **Prueba:** `a3-del-titular.int-spec.ts` suma el caso. Sin A3 da 403, aunque haya una comida registrada hoy; con un
  A3 nuevo, la comida vuelve igual.
- **Si Dirección prefiere otra respuesta**, por ejemplo «no disponible» sin los registros, se cambia la respuesta y la
  prueba; el control queda. Esta implementación es la recomendada: un «sin datos» falso diría algo que no es cierto.

---

## DL-116 — El ID API-DSH-04 nombra dos operaciones distintas

**Prioridad:** media · **Documento:** 09 v0.11 §16 (`docs/legajo/09_AUX/BE_LEG_09_v0.11_CONTRATOS_P0_ANTROPOMETRIA_Y_PROYECCIONES_2026-08-31.md:964`) · DL-107 · **Estado:** ABIERTA. Se encontró el 2026-10-02, al armar las fichas de perfil y administración. Espera la decisión de Dirección

**Qué dice el legajo.** En el 09, API-DSH-04 es la «Timeline longitudinal», la línea temporal del seguimiento profesional (RF-054), que no está implementada.

**Qué pasa hoy.**
- DL-107 (decidida el 2026-09-30) le dio el ID API-DSH-04 a «Pendientes», `GET /me/portfolio`. Así figura en `packages/domain/src/openapi.ts`, en el OpenAPI generado y en las operaciones que registra el PDP.
- Un conteo por ID da por implementada la línea temporal, que no lo está.
  - `docs/QUE-FALTA.md` §2 cuenta bien las 22 operaciones que faltan, porque la cuenta a mano.
  - Pero en `openapi.ts` faltan solo 21 IDs del 09.
- No cambia ningún comportamiento ni ninguna garantía: es un problema de trazabilidad.

**Opciones.**
- **A.** Darle a «Pendientes» un ID propio de BE, marcado como extensión, como `API-ANT-06-PROPIA`.
  - Cambian `openapi.ts`, el OpenAPI generado, las referencias en el código y las pruebas, y DL-107.
  - Las auditorías ya registradas conservan el ID viejo: se aclara en la DL.
  - Tamaño S. No toca la APK.
- **B.** Mantenerlo y declarar en DL-107 que API-DSH-04 nombra en BE otra operación que en el 09.

**Provisorio en código.** B, de hecho y sin declarar.

**Recomendación: A**, porque un tribunal puede contar las operaciones del 09 por ID.

**Solución preparada — 2026-10-03** (Dirección autorizó completar DL-116 en esta tanda). Está en la rama
`trazabilidad/dl116-y-decisiones`, **sin integrar**: va con la candidata 0.13.2.
- **Opción A.** «Pendientes» (`GET /me/portfolio`) pasa a **API-CAR-01**, una familia propia de BE como TPL, TPN, HAB y
  HAN. Cambian:
  - el contrato (`openapi.ts` y el OpenAPI generado), con el 429 de las lecturas protegidas;
  - la operación que registra el PDP (`lectura-cartera.ts`);
  - los comentarios y los títulos de las pruebas.
- **Lo histórico no se reescribe.** Las decisiones de acceso registradas antes conservan «API-DSH-04», porque la columna es
  texto libre y la historia es de solo agregar. La evidencia de CARTERA, el intake, DV-06 y DV-10 citan el ID viejo con su
  fecha; CARTERA lleva una nota.
- **Guardia nueva:** `scripts/trazabilidad-de-operaciones.test.cjs`, que corre en `npm test`. Lee el 09 en solo lectura y
  exige tres cosas:
  - que una operación con un ID del inventario P0 tenga el método y la ruta que el 09 le da;
  - que un ID fuera del inventario sea una extensión declarada de BE, con su familia o su sufijo y su fuente;
  - que ningún ID se repita.
- **Verificación.** Contra el contrato de `main` la guardia falla, y nombra el choque: «API-DSH-04: el contrato dice GET
  /me/portfolio; el 09, GET /advisees/{}/timeline». Con el cambio, pasa. Recorre las 126 operaciones: 100 coinciden con el 09,
  25 son extensiones declaradas y API-CAR-01 es la nueva.
- **El conteo de faltantes no cambia:** siguen faltando 22 de las 122 operaciones P0. La línea temporal (API-DSH-04 del 09)
  sigue sin implementar (D-3 de DV-05).

## DL-117 — Inicio personal y navegación nueva de la APK

**Prioridad:** alta · **Documento:** B10-10 §9 (volver sin depender del sistema) · 08 §33 (el ambiente siempre a la vista)
· DL-113 (la barra de cinco zonas del 2026-10-01) · DL-049 y DL-077 (BE no elige el día tipo ni la sesión) · DL-115 (A3
del titular) · **Estado:** DECIDIDA por Dirección el 2026-10-04

**Qué decidió Dirección.**
- **Barra inferior.** Cinco destinos, en este orden: Inicio, Nutrición, Entrenamiento, Evolución, Información. Cuenta
  pasa al avatar de la cabecera. Reemplaza la barra de DL-113, que tenía Cuenta en lugar de Inicio.
- **Cabecera única.** Menú auxiliar a la izquierda en las pantallas principales, marca BE al centro y avatar a la
  derecha. En un detalle, volver tiene prioridad sobre el menú.
- **Inicio personal.** Reúne lo disponible de los módulos: qué hay para hoy, qué se registró, qué información reciente
  se puede consultar y qué pide atención.
- **Lo que no autoriza.** El dashboard interdisciplinario profesional con notas y coordinación, y una política de
  permisos nueva.

**Cómo se respeta el legajo.**
- Cada dato de Inicio se lee con la misma operación y el mismo permiso que en su módulo. Inicio no escribe nada.
- Abrir un borrador de entrenamiento es una escritura (API-TRN-15): va solo cuando la persona toca «Comenzar» o
  «Continuar».
- BE no elige por la persona la sesión ni el día tipo (DL-077, DL-049): si hay varios, Inicio pide la elección.
- Ningún número califica (TEST-PRJ-009). Las cuentas de registros no se presentan como porcentajes ni como adherencia.
- El avatar y el saludo son neutros: el perfil no tiene nombre ni foto (DL-009, «datos propios mínimos»).

**Diseño y matriz de datos.** En `docs/ux/INICIO-Y-NAVEGACION.md`.

**Dependencias que quedan abiertas.**
- D-1: el agregado de días con registros nutricionales en un período.
- D-2: el nombre o la foto del perfil.
- D-3: listar todas las tomas antropométricas, si la API tapa una evaluación del mismo día.
- D-4: un agregado de la actividad de entrenamiento por período. Hoy Inicio descarga las sesiones de 30 días para
  contarlas (TRN-19-LISTA).

**Cierre del 2026-10-04 (sin integrar).** Lo que se resolvió dentro del alcance decidido, y lo que queda para que
Dirección lo mire en las imágenes y en el teléfono:
- **Mapa corporal e Indicadores** reemplazan a la vista «Toma» de Mi evolución: son la misma toma, partida entre lo que
  tiene sitio en la figura y lo que no. No suman un nivel de navegación. Los sitios no se movieron; Comparar y el gráfico
  detallado por medida siguen igual.
- **La barra en dos filas con letra grande** es una adaptación excepcional y una decisión visual explícita: si las cinco
  etiquetas no entran en una fila con al menos el 90 % de su tamaño, la cápsula pasa a dos filas. Las etiquetas ya no
  tienen tope de crecimiento. **A ratificar por Dirección** (capturas 01 y 10 de `EVIDENCIA/INICIO-Y-NAVEGACION`).
- **D-3, a la vista:** si otra evaluación cayó el mismo día, la toma dice en una línea que puede estar incompleta, y
  «Por qué» cuenta las medidas y los resultados que se ven. «Cómo se lee» dice qué puede no verse de una toma. Sigue
  abierta la ampliación del contrato.
- **D-4, diferida:** en una simulación local (datos sintéticos y red simulada, no una medición en el teléfono ni contra
  la API de test), la tarjeta de actividad baja 105 KB en el caso típico y 539 KB con un historial cargado de
  correcciones. En la misma simulación, comprimir las respuestas (gzip) llevaría toda la visita de 176 a 9 KB y de 1,50 a
  0,62 s en 4G lento, sin un endpoint nuevo ni un cambio de contrato. No se crea el agregado: el primer paso propuesto es
  verificar si Render ya comprime y, si no, decidir la compresión en la API
  (`EVIDENCIA/INICIO-Y-NAVEGACION/herramientas/medir-inicio/resultados.md`).

**Prueba de Dirección en el teléfono (APK 0.14.0-candidata.1, reportada el 2026-10-05).**
- La actualización sobre la 0.13.2 conservó la sesión.
- Funcionaron bien los cinco controles pedidos: reapertura, navegación inferior, retorno desde Cuenta, tarjetas de Inicio
  y retorno desde los detalles.

Se registra como reporte manual de Dirección sobre esa candidata. No es una prueba independiente del ejecutor ni la
aprobación de toda la aplicación. La APK es la prerelease `be-apk-0.14.0-candidata.1`, versionCode 23, construida desde
`0a28dd6`.

**Pulido visual del 2026-10-04 (a la tarde, sin integrar ni construir).** Dirección priorizó la excelencia visual con la
letra de siempre, sin desactivar el escalado. No cambia ninguna función. **A ratificar por Dirección**, con las capturas 12
a 18 de `EVIDENCIA/INICIO-Y-NAVEGACION`, antes de construir la APK candidata:
- el cuerpo grande, arriba y recortado a la derecha, con un tamaño que no depende de cuántas medidas hay;
- la cabecera compacta: pestañas para las vistas, una fecha y un contexto, chips para las tomas y la familia dentro de
  la lámina;
- tarjetas de vidrio con filas de una sola forma y los valores en columna.
Las referencias visuales del pedido no llegaron con el mensaje: se siguió la descripción escrita.

## DL-118 — «Mi evolución» en tres vistas: Mapa corporal, Progreso e Indicadores

**Prioridad:** alta · **Documento:** DL-117 (navegación y «Mi evolución» de la APK) · DL-111 (figura de la lámina) · DL-113
(los sitios no se mueven) · REG-06-162/165/166 (comparabilidad, huecos y sin líneas) · TEST-PRJ-009 (nada califica) ·
**Estado:** DECIDIDA por Dirección el 2026-10-05

**Qué decidió Dirección**, en el documento «BE — Cierre de antropometría y siguiente tramo de producto», versión 2,
después de probar la APK 0.14.0-candidata.1:
- Simplificar la lectura del asesorado. Comparar sale como apartado.
- Tres vistas:
  - **Mapa corporal**, con los últimos datos de una toma y su fecha, sin gráficos chicos;
  - **Progreso**, por Torso y Piernas, como las láminas de tren superior e inferior del compositor;
  - **Indicadores**, con lo disponible y la edad como dato de la toma.
- El torso se divide en dos paneles si concentra demasiadas medidas.
- No hay tomas ni figuras vacías.
- Es el último cierre acotado de antropometría: después, solo defectos que comprometan uso, datos, permisos o
  legibilidad.

**Lo que no autoriza.**
- Eliminar información, métodos, contratos o herramientas profesionales.
- Nuevas fórmulas, umbrales, diagnósticos o totales.
- El tema blanco de las láminas de referencia, ni sus líneas entre puntos.
- Entrenamiento y nutrición, que esperan sus maquetas.

**Diseño, delta y reglas.** En `docs/ux/MI-EVOLUCION-TRES-VISTAS.md`. Las agrupaciones, tamaños y textos son decisiones de
diseño reversibles, tomadas con ese documento y los patrones de BE.

**Cómo se respeta el legajo.**
- Todo sale de la misma lectura de API-ANT-06-PROPIA, con el mismo permiso (A3). No hay pedidos nuevos.
- Cada gráfico tiene un solo grupo de comparabilidad, sin rellenos, y un hueco no es un cero. Desde el ajuste del
  2026-10-05, una línea une solo tomas seguidas del mismo grupo y se corta en cada hueco (abajo).
- Las diferencias son descriptivas: no tienen color de «mejor» o «peor».
- Los sitios se asignan a una zona por su clave de BE, y las figuras de cada tren son las del compositor, con sus puntos
  calibrados por Dirección, sin moverlos.

**Dónde está** (2026-10-05):
- **Implementado** en `3c6ac7c`, rama `apk/navegacion`, PR #146 en borrador.
- **Sin integrar ni desplegar**, y **sin probar en el teléfono**: la APK que lo incluya se construye después de que
  Dirección revise las capturas.
- **Evidencia:** renders de los componentes en el navegador, no capturas de Android, en
  `EVIDENCIA/MI-EVOLUCION-TRES-VISTAS`.

**Ajuste de Dirección después de revisar el cierre** (2026-10-05). Detalle en `docs/ux/MI-EVOLUCION-TRES-VISTAS.md`
§8.
- **Acepta** «La evolución, en lista», el detalle con el período completo y los controles en dos filas cuando el ancho
  o la letra lo piden.
- **Pide** dos cambios:
  - en Progreso, una figura más compacta y más cerca de las tarjetas, sin achicar letra ni zonas de toque y apilada con
    letra grande;
  - sacar de la cabecera «se compara con [fecha]», porque cada medida puede tener otra anterior comparable. Cada
    tarjeta conserva su fecha de comparación.
- **Después pide** acercar los gráficos de las tarjetas a un ejemplo suyo. Se tomaron su jerarquía, las tres líneas de
  referencia, los puntos huecos, la toma bajo cada punto y los valores en fila. No se tomaron las tomas a la misma
  distancia (DL-118 decidió fechas reales). Detalle en §9.
- **Y pide la línea entre los puntos**, como en el ejemplo. Reemplaza la exclusión de las líneas de arriba («Lo que no
  autoriza»).
  - Se usa la regla de la lámina del website (`tramosDeLaSerie`, INV-06-176/177): solo tomas seguidas del mismo grupo
    comparable.
  - Una toma sin la medida, un hueco o un cambio de protocolo, método o unidad la cortan.
  - Cumple con B10-07 («la visualización debe conservar el hueco») y con ADV-10-PRJ-05 y 08: la línea no inventa
    puntos entre sesiones ni une tramos no comparables.
  - No hay áreas ni tendencias.
- **No pide otra APK** hasta revisar este ajuste.

## DL-119 — Recetas como preparaciones propias, catálogo de referencia USDA y método de cálculo

**Prioridad:** alta · **Documento:** REG-06-135 inciso 2 (06:4823-4831) · B-07, catálogo y anclaje (06:4228-4394) ·
jerarquía y factores de conversión (06:4554-4621) · RF-027 · **Estado:** DECIDIDA por el encargo de Dirección del
2026-10-05

**Qué pide el encargo.** El profesional crea y edita recetas con ingredientes del catálogo por identidad y versión,
porciones, preparación e imagen de referencia. Las ofrece como opciones de una comida del plan, con energía y macros
calculados desde una fuente identificada.

**Cómo se respeta el legajo.**
- Una receta es una **preparación propia del profesional**: sus recursos visuales quedan en su ámbito (REG-06-135, inciso
  2). No convierte el catálogo global en un repositorio libre.
- Los ingredientes son elementos del catálogo, con su versión. Un cambio del catálogo o de la receta no reescribe lo
  emitido: la opción del plan activado guarda la versión (REG-06-101, INV-06-115).
- No se convierten estados de preparación ni unidades. Los factores son del catálogo (06:4617-4621), y estas recetas
  pesan cada ingrediente en el estado indicado.

**Decisiones del ejecutor, reversibles:**
- **Familia de operaciones REC:** API-REC-01 a 07, extensión de BE que el 09 no tiene. Se declara en
  `docs/paquetes/WP-NUTRICION-RECETAS.md` §4.
- **Método `SUM_SOURCE_PER_100G_V1`:**
  - la suma de gramos ÷ 100 × valor cada 100 g, con aritmética exacta;
  - las kcal salen de la fuente, sin 4/4/9;
  - se redondea solo al mostrar.
  - BE no tenía un método canónico de totales, así que no hay resultados anteriores que cambiar. Cada cálculo guarda su
    método.
- **Catálogo de referencia:** ocho alimentos de USDA FoodData Central · SR Legacy (CC0), con FDC, NDB, descripción
  original, fecha de publicación y de consulta. Se siembran por migración como importación controlada, con el proveedor
  `USDA_FDC_SR_LEGACY`.
- **Fibra:** es opcional en la composición, y ausente quiere decir desconocida. Un nutriente desconocido deja el total
  «incompleto» y nombra los ingredientes que lo deben.

**Implementación (2026-10-06, rama `wp-nutricion-recetas`, sin integrar).** Evidencia: `EVIDENCIA/NUTRICION-RECETAS`.
- **El cálculo:** los 11 casos del paquete dan exactos en el dominio, en la API y en la pantalla del website.
- **«Global» en el catálogo** pasó a ser lo que no tiene creador (`creado_por_id IS NULL`). Antes era
  `BE_SYNTHETIC_SEED`, y los alimentos de USDA, sembrados como `CONTROLLED_IMPORT`, no se veían.
- **La función `be_importado_con_resolucion`** exime ahora solo lo importado sin creador, que es la siembra. La importación
  de un profesional sigue exigiendo su resolución. No cambia datos.
- **En el plan:** una opción de receta es `{label, items: [], recipeVersionId}`, y la API arma los ítems de una porción.
  Las plantillas y las comidas habituales no la aceptan (422).

**Condición de cierre.** Dirección aprueba el paquete, y el 09 y el 05 incorporan las operaciones de recetas.

## DL-120 — Medios privados activados; almacenamiento en PostgreSQL en lugar de S3

**Prioridad:** alta · **Documento:** 08 §21 (08:519-531), acto `EVIDENCIA_VISUAL` (08:395) y supresión individual
(08:451) · 07 §25 (07:939-965) y 07:256 · 09v12 §24 (09v12:975-1000) · 09v9 §28 (09v9:965-984) · REG-06-133 · T-06-65 ·
**Estado:** DECIDIDA la activación por el encargo de Dirección del 2026-10-05; el almacenamiento S3 queda abierto

**Qué dice el legajo.**
- **08 §21:** la foto del asesorado es un dato C4 reforzado. Exige:
  - un almacenamiento privado;
  - una URL de lectura de 15 minutos como máximo;
  - el EXIF depurado;
  - el acceso auditado;
  - la supresión individual a pedido.
  - No se activa en el MVP sintético.
- **09v12 §24:** los medios privados quedan condicionados a su activación: `POST /me/media/upload-intents` y
  `GET /media/{mediaId}/access`.
- **07 §25:** un almacenamiento de objetos compatible con S3, nunca el disco del contenedor. No está aprovisionado, y
  Render no tiene almacenamiento de objetos disponible en general (07:256).

**Qué decidió Dirección.** El encargo del 2026-10-05 activa las imágenes de receta y las fotos de una comida diferente:
- «Reutilizá almacenamiento persistente existente»;
- «No contrates servicios ni simules persistencia remota con una carpeta efímera del despliegue».

**Cómo se implementa.**
- **Familia de operaciones MED:** API-MED-01 a 05.
  - API-MED-01 y 03 son las rutas que el 09v12 §24 nombra.
  - API-MED-02 y 04 son la subida y la lectura firmadas.
  - API-MED-05 es la supresión a pedido.
- **El almacenamiento** es la interfaz `AlmacenDeMedios`, implementada en PostgreSQL (`contenido_de_medio`, en `bytea`).
  Es la única persistencia que existe: sobrevive a un reinicio y no usa el disco del contenedor. Se elige con
  `BE_MEDIOS_ALMACEN=postgres`.
- **Garantías del 08 §21:**
  - privado: no hay ninguna clave ni URL pública;
  - URL firmadas con HMAC, de 10 minutos para subir y de 15 como máximo para leer;
  - el servidor decodifica y recodifica cada imagen sin metadatos, así que el EXIF y el GPS desaparecen;
  - cada acceso pasa por el PDP y se audita, con el acto `EVIDENCIA_VISUAL` para las fotos de ingesta;
  - la supresión a pedido borra los bytes y deja el registro.
- **Ninguna inferencia.** Una foto no agrega cantidades ni macros (09v9 §28), y no se envía a ninguna IA.

**Lo que queda abierto: S3, según el 07 §25.** Hace falta un bucket privado y sus credenciales, que es un servicio a
contratar. La interfaz queda lista para esa implementación. La base de `test` es gratuita, tiene 1 GB y vence antes de la
entrega (QUE-FALTA §1).

**Implementación (2026-10-06, sin integrar).**
- **El acto `EVIDENCIA_VISUAL` (08:395)** es una etiqueta de auditoría, y no una fila de `acto_registrable`:
  - cada acceso a una foto de comida queda en el registro de auditoría y en la decisión del PDP, con ese recurso;
  - un acto registrable exigiría una versión de texto en el catálogo de textos, y no hay un texto que la persona acepte.
  - **A ratificar.**
- **La lectura (API-MED-04)** responde `Cross-Origin-Resource-Policy: cross-origin` solo en esa ruta, y sin caché.
  - La ruta firmada es la autorización, y vence en 15 minutos como máximo.
  - El website la descarga con CORS y la muestra como data URL, porque la CSP admite solo `img-src 'self' data:`.
- **La persistencia:** después de reiniciar la API, las imágenes se leen con el mismo SHA-256. Está probado en la
  integración y en el recorrido local.
- **Para la prueba remota, en el ambiente `test`,** no falta ningún servicio: con `BE_MEDIOS_ALMACEN=postgres`, que es el
  valor por defecto, las imágenes van a la misma base.
- **La APK nueva suma permisos:** CAMERA y, hasta Android 12, los de almacenamiento, que vienen de `expo-image-picker`.
  RECORD_AUDIO queda bloqueado.

**Decisión operativa del 2026-10-06 (encargo de Dirección).** Para la demostración sigue PostgreSQL con
`AlmacenDeMedios`, sin contratar S3.

**El almacenamiento, tal como queda:**

| Tema | Cómo es | Lo que no cubre |
|---|---|---|
| **Límites** | Se reciben hasta 10 MB y de 64 a 8000 px por lado, con un máximo de 40 megapíxeles. Se guarda un JPEG de calidad 82 y 1600 px como máximo, de unos 150 a 400 KB por imagen. Una comida diferente lleva hasta 3 fotos. La base de `test` es del plan gratuito, con 1 GB para todo | No hay cuota por persona |
| **Respaldo** | El que tenga la base. BE no hace copias aparte de los medios | No está verificado que el plan gratuito de `test` tenga respaldo. El régimen del 08 §18 no está cubierto en la demo |
| **Retención** | Los medios duran lo que dure su base. Una intención que nunca se subió queda `PENDIENTE`, sin bytes | No hay una tarea que limpie los pendientes viejos |
| **Borrado autorizado** | API-MED-05: el titular suprime una foto propia de comida. Se borran los bytes, queda el registro con su momento y motivo, y la supresión se anota en el registro de supresiones | Retirar la imagen de una receta no borra el medio: queda la historia |
| **Cambiar de proveedor** | Se implementa `AlmacenDeMedios` (guardar, leer, suprimir) para S3, se agrega el valor a `BE_MEDIOS_ALMACEN` y se copian los bytes de `contenido_de_medio` con su `mediaId`. Las rutas firmadas, el PDP y la auditoría no cambian | Hace falta un bucket privado y sus credenciales: un servicio a contratar |

**Lo que el reinicio local no prueba:** disponibilidad, respaldo ni persistencia en el despliegue remoto. Nada de esto se
desplegó.

**Bloqueo remoto, independiente del código.** `be-db-test` vence cerca del 2026-10-18 (`docs/DESPLIEGUE.md`), y la
entrega es el 2026-10-20. Seguir con esa base después de esa fecha exige una decisión de servicio de Dirección: pasarla a
un plan pago o recrearla. No se recreó nada ni se pagó nada.

**Pendiente normativo aislado: el acto `EVIDENCIA_VISUAL`.**
- Lo que pide el 08 (§12.4, tabla de actos):
  - es un acto de información destacada por categoría, dentro del alcance B2 (B2 reforzado);
  - es obligatorio para subir y ver fotos (§21), es revocable y exige la evidencia de §12.2;
  - no es un consentimiento por foto (§21.3).
- Lo que hay hoy:
  - BE no tiene un texto versionado de esa información, y no se inventa un acto ni una aceptación;
  - la APK muestra la información en el momento de la subida: «La foto es privada: la ven vos y el profesional que te
    acompaña en Nutrición.»;
  - cada acceso a una foto de comida queda auditado como `EVIDENCIA_VISUAL`, con el PDP de vínculo, B2 y A3.
- Para activar la función con personas reales faltan:
  - el texto aprobado por Dirección, con validación jurídica;
  - su registro como acto, con la evidencia de §12.2;
  - que MED-01 y MED-03 lo exijan.
- Esto no frena el resto del trabajo: la demo es sintética, como todo el MVP.

**Precierre del 2026-10-06 (§6).** El pendiente normativo tiene una propuesta, sin activar: el texto versionado, el acto
con la evidencia del 08 §12.2 y su mapeo a MED-01 y MED-03 están en DL-125. Mientras la exigencia siga apagada, todo queda
como se describe arriba.

**Respaldo y restauración, probados en local** (precierre, §6; `docs/propuestas/CONTINUIDAD-BASE-DE-TEST_2026-10-06.md`).
- Un respaldo de una base con el esquema de hoy no se restauraba de una vez: `pg_restore` carga los datos con la ruta de
  búsqueda vacía, y el CHECK de finalidad llama a `be_finalidad_de_alcance`, que nombraba el tipo sin esquema. La
  migración `20261006150000_funcion_de_finalidad_restaurable` lo corrige; para un respaldo anterior, se restaura por
  secciones.
- Las imágenes vuelven con la misma huella, y una base restaurada como la de `test` se migra hasta el head y la API
  queda lista contra ella (`EVIDENCIA/ENTRENAMIENTO-SERIES/resultados/09` y `11`).

**Condición de cierre.** Dirección decide entre seguir en PostgreSQL y contratar un almacenamiento S3, y aprueba el texto
del acto `EVIDENCIA_VISUAL` (DL-125). El 08 registra la activación.

## DL-121 — Registro v2 de comidas: estado de las cantidades, anulación y rectificación del titular

**Prioridad:** alta · **Documento:** DL-049 (clave de unicidad) · DL-050 (corrección prescripta) · 06:1422-1462
(corrección, vista efectiva y anulación propia del área, inciso 4) · CONS:564-630 · 09v7 T19 y T20 · **Estado:** DECIDIDA
por el encargo de Dirección del 2026-10-05

**Qué pide el encargo.**
- «Comí esta opción» con las cantidades consumidas opcionales y explícitas, y «Comí las porciones del plan» como una
  confirmación que empieza desmarcada.
- Vacío no es cero.
- Idempotencia ante un doble toque.
- «Completar o corregir».
- «Deshacer registro» con un efecto real y auditable, sin un borrado silencioso.

**Cómo se implementa.**
- **Familia de operaciones ING:** API-ING-01 a 06, en endpoints nuevos. Las APK instaladas validan con esquemas
  estrictos, así que API-NUT-14, 15, 16 y 16-LISTA no cambian de forma (09v7 T19 declara compatible un endpoint nuevo).
- **El estado de las cantidades** es uno de tres: `SIN_CONFIRMAR`, `PORCIONES_DEL_PLAN` o `INFORMADAS`, con «no lo comí»
  por ingrediente. Lo previsto nunca se convierte en consumido.
- **La anulación** (`anulacion_de_ingesta`) y **la rectificación de cantidades** (`rectificacion_de_cantidades`) son de
  solo agregar: la ingesta original no se modifica. La vista efectiva sale de la cadena (06:1422-1462).
- **La clave natural de DL-049** suma una secuencia: (versión, fecha, comida, secuencia). Sigue habiendo una sola ingesta
  efectiva por comida y día, y después de deshacer se puede volver a registrar.
- **Lo anulado deja de contar** en «Hoy», el contraste, la revisión, la cartera y el tablero, y no se devuelve por las
  rutas que lee la APK instalada.

**Implementación (2026-10-06, sin integrar).**
- **Una comida diferente registrada en una comida del plan ocupa esa comida:** hay un registro efectivo por comida y día,
  de cualquier clase. Agregar algo más exige deshacer y volver a registrar.
  - En el contraste y en la revisión, esa comida diferente sigue **fuera de la prescripción**: no marca la comida
    prescripta como realizada (CONS:599-612).
  - El website lo explica en el detalle del registro.
  - **A ratificar por Dirección.**
- **Lo anulado deja de contar** también en dos lugares que no estaban en la lista: API-NUT-21 responde 404, y la revisión
  (API-NUT-18) no lo acepta como evidencia.
- **La forma v1** (lo que lee la APK instalada) usa la vista efectiva:
  - las porciones del plan confirmadas, o lo informado;
  - «no lo comí» y lo desconocido no aparecen, porque esa forma exige una cantidad positiva;
  - una comida diferente con solo foto se proyecta con `description: null`.
- **La APK nueva** manda una foto por comida diferente, aunque el contrato admite tres.
- **Decisión del 2026-10-06, ya implementada en el contraste:** haber registrado otra comida no es haber seguido la opción
  prescrita.
  - API-NUT-17 suma, por comida, `differentMealExecutionIds`: las comidas diferentes registradas en su contexto. La
    comida sigue `NO_DATA`, sin opción, y las comidas diferentes siguen en `outsidePrescription`.
  - El website dice los dos hechos, «Sin opción del plan registrada» y «Comida diferente registrada», y en «Fuera del
    plan» nombra la comida («Registrada en “Cena”»).
  - No se tocó ningún consumo ni registro histórico.

**Condición de cierre.** Dirección aprueba el paquete, y el 05 y el 09 incorporan estas operaciones.

## DL-122 — Objetivos efectivos por serie

**Prioridad:** alta · **Documento:** REG-06-111 (unidad y significado identificables) · REG-06-112 (instantánea) ·
REG-06-128 (dos criterios que se excluyen) · 09v10 §5-§6 · PF03-D-2 (descanso con semántica) · DL-105 (incremento 1) ·
**Estado:** DECIDIDA por el encargo de Dirección del 2026-10-06

**Qué pasa hoy.**
- Las repeticiones son por serie, pero el RIR objetivo y la carga sugerida son de la prescripción completa.
- El descanso solo existe como parámetro libre.
- No hay una forma de que una serie herede, sobrescriba o quite un objetivo.

**Qué pide el encargo.**
- Objetivos distintos por serie (repeticiones exactas o en rango, RIR, carga con unidad y descanso).
- La herencia, la sobrescritura y la quita explícita, definidas en el contrato y probadas.
- Que la vista previa web y el teléfono resuelvan el mismo objetivo efectivo, sin reinterpretar en silencio a los
  clientes viejos.

**Cómo se implementa** (`docs/paquetes/WP-ENTRENAMIENTO-SERIES.md` §3).
- **Campos nuevos.**
  - En la serie, `rir`, `suggestedLoad` y `restSeconds`, con tres estados: ausente hereda, `null` quita y un
    valor sobrescribe.
  - En la prescripción, `restSeconds`, `loadBasis` y `repetitionBasis`.
- **Una sola resolución,** `objetivosEfectivos`, para la API, la web y la APK.
- **El RIR por serie** existe solo con criterio RIR, de 0 a 10. El %RM rige para todas las series.
- **Lecturas nuevas:** API-SER-01 (profesional) y API-SER-02 (titular). API-TRN-09, 14 y siguientes no cambian de
  forma: están congeladas por prueba.

**Para decidir.** La APK 0.13.2 lee la prescripción con su forma vieja: si el profesional sobrescribe por serie, esa APK
muestra el valor general de la prescripción. El editor lo avisa.
- **A.** Exigir la APK nueva (versión mínima comunicada) antes de usar objetivos por serie con personas.
- **B.** Negociar por capacidad: la APK declara su versión y la web solo habilita la edición por serie para
  asesorados con la APK nueva. Es una decisión transversal (PF03-D-5 C).

**Recomendación del ejecutor:** A para la entrega, porque hoy no hay asesorados reales. B si el producto crece.

**Lo que decidió el precierre del 2026-10-06 (§2).** «Un aviso solo al entrenador no alcanza»: un cliente que no puede
interpretar el plan nunca muestra los valores generales como objetivos efectivos. Las APK instaladas no muestran textos del
servidor, así que no se les puede pedir «Actualizá BE»: se impide activar y entregar el plan incompatible, y se le explica
al profesional. Sin inventar un versionCode futuro ni usar una versión mínima como única anotación.
- **La capacidad la declara el cliente:** `X-BE-Capabilities: training-set-targets-1`. La APK nueva la manda en cada
  pedido; la 0.13.2 y las dos candidatas no mandan nada, y se las trata igual. Cuando el titular lee API-TRN-14 o API-SER-02
  con la capacidad, queda registrada (`capacidad_de_cliente_declarada`, de mejor esfuerzo y a lo sumo una vez por hora).
- **Activar (API-TRN-12):** un plan con objetivos distintos por serie (RIR o carga distintos de los generales), sin ese
  registro del titular, es 409 `CLIENT_CAPABILITY_REQUIRED`. API-SER-01 informa `setTargetsDelivery`, y el editor del
  website dice antes por qué no se puede y qué hacer; el botón queda deshabilitado con el motivo asociado.
- **Entregar:** sin la capacidad en el pedido, API-TRN-14 y su período responden `NOT_AVAILABLE` sin plan ni ocurrencias,
  una forma que esas APK ya validan; API-TRN-09 y TRN-15 dan el 404 de lo inexistente. El motivo queda en la auditoría.
  Lo que ve la 0.13.2 (y las candidatas): «Tu plan de entrenamiento no está disponible en este momento.», con «Ir a
  Vínculos» (`be-apk-0.13.2:apps/mobile/src/pantallas/entrenamiento.tsx:132`).
- **No cambian** los planes compatibles, la vista del profesional ni lo registrado.
- **Probado:** integración (`compatibilidad-de-clientes`, `entrenamiento-por-serie`, `contrato`) y el recorrido local
  (`EVIDENCIA/ENTRENAMIENTO-SERIES/resultados/01` y `02`).
- **Límites:** el registro no vence (quien usó una vez la APK nueva queda habilitado; si vuelve a una vieja, la entrega
  retenida lo cubre). El «Ir a Vínculos» de la APK vieja no es la causa real; es lo único que esa versión sabe mostrar.

**Condición de cierre.** Dirección aprueba el paquete y la negociación por capacidad; el 05 y el 09 incorporan las
operaciones SER, la cabecera y el 409.

## DL-123 — Imagen del ejercicio con licencia, procedencia y revisión técnica

**Prioridad:** alta · **Documento:** REG-06-134 (recurso versionado, con autoría y licencia obligatoria), 135 (uno
curado vigente en el catálogo global; los propios, en su ámbito) y 136 · 09v10 §9 (`provenance`; sin licencia se
rechaza) · DL-120 (medios privados) · **Estado:** DECIDIDA por el encargo de Dirección del 2026-10-06

**Qué pasa hoy.** El contrato del recurso didáctico existe, pero:
- la API devuelve siempre una lista vacía;
- crear un ejercicio con recursos da 422;
- no hay tabla ni finalidad de medio para ejercicios.

**Cómo se implementa** (`WP-ENTRENAMIENTO-SERIES.md` §4).
- **Medio.** Finalidad `EXERCISE_REFERENCE`, que sube un profesional de Entrenamiento. Se reusa la infraestructura de
  DL-120.
- **Asociación.** Es de solo agregar, al ejercicio propio y a su versión, por identidad y nunca por nombre.
  - Reemplazar es asociar de nuevo y retirar es un registro más. El medio no se borra.
  - Familia EJE: API-EJE-01 a 03.
- **Licencia.** Es obligatoria y nunca tiene un valor por defecto: sin licencia externa, con sus términos de uso, o una
  externa identificada.
  - Las imágenes de IA de la demostración van sin licencia externa, con el uso de `CATALOGO.json`. No se declaran CC0.
- **Revisión técnica.** Hay un estado: pendiente o revisada por el profesional. La UI dice que la imagen ilustra y no
  certifica la técnica.
- **Quién la ve:** el profesional dueño y el asesorado con un plan activado de ese profesional que la incluye, con
  acceso de Entrenamiento vigente.
- **Historia.** Una sesión registrada muestra la imagen vigente al registrar. Si el medio falta, se muestra un ícono de
  respaldo y se conserva su identidad.

**Para decidir o anotar.**
- API-TRN-13 sigue devolviendo `didacticResources` vacío. Poblarlo exige decidir qué identifica `resourceId` frente
  a la asociación; no hace falta para el encargo.
- Las imágenes del catálogo global sembrado (REG-06-135) quedan fuera: aquí solo hay imágenes de ejercicios propios.
- La imagen se resuelve por la identidad del ejercicio y lleva la versión a la que se asoció. Hoy coincide con la
  prescripta, porque no hay una API para versionar ejercicios; si la hubiera, habría que decidir si se filtra por versión.
- Asociar o retirar una imagen no suma un tipo de evento de entrenamiento: el registro es la propia tabla, de solo
  agregar, con autor, momento y procedencia. Si Dirección lo quiere también como evento (como las recetas), es otra
  migración de enum.

**Condición de cierre.** Dirección aprueba el paquete; el 05 y el 09 incorporan la familia EJE y la finalidad nueva.

## DL-124 — Tiempos de la sesión como eventos con calidad

**Prioridad:** alta · **Documento:** REG-06-130, 131 (registro y condición de la sesión) · paquete de Dirección del
2026-10-06 (`DECISIONES_Y_TIEMPOS.md`, `casos_tiempos.json`) · **Estado:** DECIDIDA por el encargo de Dirección del
2026-10-06

**Qué pasa hoy.** No hay campos, tablas ni endpoints para medir la sesión, las pausas, los descansos ni las series. La
APK no tiene cronómetro ni guarda nada localmente.

**Cómo se implementa** (`WP-ENTRENAMIENTO-SERIES.md` §5).
- **Eventos idempotentes** colgados del borrador de ejecución, con:
  - identificador de cliente;
  - corrida;
  - secuencia causal;
  - reloj civil y monotónico con su ancla;
  - origen del instante.
- **Reglas, iguales en la API y en la APK** (`aplicarEventos`).
  - Una sola sesión en curso.
  - A lo sumo una medición abierta.
  - Nada se mide en pausa.
  - Un duplicado no suma, y el mismo identificador con otro contenido es un conflicto.
- **Cálculo** (`calcularTiempos`).
  - Transcurrido, pausas, sin pausas, por ejercicio y sin ejercicio, sobre una sola línea de tiempo.
  - Descansos con su recomendado histórico y la diferencia sin juicio, y series cronometradas.
  - Cada tiempo es medido, estimado, incompleto o sin dato.
  - Nunca se cierra nada a la hora de reabrir.
- **Familia TIE:** API-TIE-01 a 04.

**Límite técnico declarado.** El reloj monotónico que lee la app en Android no avanza mientras el teléfono duerme.
- Si el reloj civil se adelanta más de 2 s, la duración se informa con el civil y como estimada.
- Si el civil retrocede, el monotónico sigue valiendo.
- La verificación con la pantalla bloqueada, la muerte del proceso y el cambio de hora queda pendiente del teléfono.

**Para decidir o anotar.**
- **Datos de la sesión en el teléfono.** Están en AsyncStorage, como pide el encargo, sin cifrar, y podrían entrar en el
  respaldo automático de Android. Dirección decide si se cifran o si se excluyen del respaldo.
- **Una corrida huérfana siempre se puede cerrar.** Es una sesión empezada cuyo profesional perdió el acceso antes de
  que terminara, y bloquearía para siempre cualquier sesión nueva del titular. Por eso:
  - API-TIE-04 la muestra al titular como su propia historia, con su A3;
  - API-TIE-01 acepta sin el acceso del profesional un pedido que solo la deja incompleta.

  No se afirma cuándo terminó.
- Corregir un evento de tiempo no está en el alcance: los tiempos son lo que se marcó, con su calidad.
- Una serie declarada «no realizada» sigue en DL-106.

**Precierre del 2026-10-06 (§1, §3 y §4).**
- **El guardado en el teléfono es honesto** (§1). Cinco estados: en memoria, escritura pendiente, guardado en el teléfono,
  enviado y falla recuperable. «Guardada en el teléfono» se dice recién cuando la escritura terminó bien. Un error de lectura
  o un JSON inválido no es «no hay nada»: lo leído no se pisa, se aparta para recuperarlo y se ofrece reintentar. La falla
  anterior está reproducida contra `58567ec` (`EVIDENCIA/ENTRENAMIENTO-SERIES/resultados/07`).
- **Cifrado y fuera del respaldo** (§4). Lo guardado va cifrado con AES-256-GCM (`expo-crypto`), con una clave por cuenta en
  el almacén seguro; lo anterior en claro se migra sin pérdida, y sin la clave el dato queda apartado, no borrado. Los
  borradores y eventos no entran en el respaldo automático ni en la transferencia entre teléfonos
  (`fullBackupContent` hasta Android 11 y `dataExtractionRules` desde el 12), igual que las credenciales. **Corrección:**
  el texto anterior decía «en AsyncStorage, como pide el encargo»; el encargo no pedía guardarlo sin cifrar.
- **El reloj desde el arranque** (§3). Cada instante dice su base: `ELAPSED_SINCE_BOOT` (el módulo nativo
  `reloj-del-sistema`, con `SystemClock.elapsedRealtime()`, que sigue contando mientras el teléfono duerme, y el número de
  arranque como ancla) o `PROCESS_MONOTONIC` (el navegador o una app sin el módulo). Las bases no se mezclan, y la
  tolerancia de 2 s se aplica solo a la del proceso. Cambiar la hora civil no cambia una duración medida. La recuperación
  sigue siendo explícita: un reloj desde el arranque no dice cuándo terminó una serie abandonada.
- **Probado en local:** el recorrido con las dos bases y anclas del propio recorrido (proceso: 203 408 ms estimados; arranque:
  216 293 ms medidos; los dos a 0 ms de lo esperado), sin eventos repetidos ni duraciones absurdas
  (`EVIDENCIA/ENTRENAMIENTO-SERIES/resultados/03`). El Kotlin del módulo compila contra android-36 y expo-modules-core
  57.0.18 sin Gradle (`resultados/08`).
- **Pendiente en Android, sin darlo por aprobado:** pantalla bloqueada, descarte de la actividad, cierre desde recientes,
  muerte del proceso, reinicio del teléfono, cambio de hora, respaldo excluido (`EVIDENCIA/ENTRENAMIENTO-SERIES/LEEME.md`).

**Condición de cierre.** Dirección aprueba el paquete; el 05 y el 09 incorporan la familia TIE y la base del reloj; la
prueba en el teléfono cubre los casos de Android.

## DL-125 — EVIDENCIA_VISUAL: el texto propuesto, el acto y lo que exigen MED-01 y MED-03

**Prioridad:** alta · **Documento:** 08 §12.2 (evidencia de cada acto) · 08 §12.4 (08:386, 08:395: `EVIDENCIA_VISUAL`,
«información destacada por categoría, dentro del alcance», B2 reforzado, obligatorio para subir y ver fotos, revocable) ·
08 §13 (revocación) · 08 §21 (fotos) · 08:451 (supresión individual) · DL-120 · DL-116 (identificadores del 09) ·
**Estado:** PROPUESTA del precierre del 2026-10-06, sin activar

**Qué pasaba.** El acto era solo una etiqueta de auditoría (DL-120): no había un texto versionado que la persona leyera,
ni un registro con la evidencia del 08 §12.2, y MED-01 y MED-03 no lo exigían.

**Qué pidió el encargo.** «Preparar el texto versionado propuesto, el flujo de aceptación/revocación y su mapeo a
MED-01/MED-03 según el canon. Dejar visible el punto de aprobación pendiente; no insertar aceptaciones de personas reales
ni declarar validación jurídica. En pruebas, usar cuentas y actos sintéticos explícitos.»

**Cómo se implementa.**
- **El texto** (`evidencia-visual-2026-10-propuesta`, tipo de texto nuevo, en el catálogo y en la base): dice que es una
  propuesta pendiente de aprobación de Dirección y de validación jurídica, y cada afirmación es lo que hace la
  implementación (08 §21: opcional, privada, quién la ve, acceso de 15 minutos con su registro, metadatos quitados, sin IA,
  borrado de cada foto y revocación). La API lo informa con `textApproval: 'PENDING_APPROVAL'` y la APK lo muestra.
- **El acto** es un `acto_registrable` por alcance de Nutrición del titular, con versión y hash, finalidad del alcance,
  superficie, actor, autoría y procedencia. La base exige que el alcance sea de Nutrición y del titular, la versión de su
  tipo, uno vigente por alcance, la evidencia inmutable y solo VIGENTE → REVOCADO.
- **Operaciones, en una familia propia de BE (EVI):** el 09 no las define, y tomar números de la familia CON repetiría el
  problema de DL-116. Tienen la forma de CON-01, 02, 07 y 08: requisito (API-EVI-01), registrar con la versión mostrada
  (API-EVI-02), los propios (API-EVI-03) y revocar (API-EVI-04). Registrar pide el vínculo aceptado y su B2 vigente.
- **El mapeo, solo con `BE_EVIDENCIA_VISUAL_EXIGIDA=true`** (por defecto `false`, también en `render.yaml`):
  - **MED-01** (foto de una comida): sin plan de Nutrición vigente, 422 `ACTIVE_PLAN_REQUIRED`; sin el acto del vínculo
    del plan, 403 `VISUAL_EVIDENCE_ACT_REQUIRED` con el vínculo y la versión a mostrar;
  - **MED-03:** el profesional ve una foto solo con el acto vigente; si no, el mismo 404, con la decisión denegada en la
    dimensión del consentimiento. El titular ve las suyas siempre.
  - La imagen de una receta y la de un ejercicio no cambian.
- **La APK:** el texto entero en el momento de la subida, con «Ahora no» igual de visible (la foto y lo escrito siguen, y
  se puede guardar sin la foto); «Fotos de tus comidas» en Privacidad, con la revocación; y «Borrar esta foto» en el
  registro de una comida (API-MED-05 existía sin pantalla, y el texto lo promete).
- **Revocar** corta en la operación siguiente las fotos nuevas para ese profesional y su acceso a las fotos. No borra
  fotos ni registros.

**Probado.** Dominio (el texto contra el 08 §21, contratos, operaciones y cliente HTTP), integración con cuentas y actos
sintéticos (`evidencia-visual` 10/10 y el bloque de `contrato`, con una app con la exigencia) y renders de la APK
(`EVIDENCIA/ENTRENAMIENTO-SERIES/capturas-apk-navegador/22` a `25`). No hay ninguna aceptación de una persona real.

**Límites.**
- Con la exigencia activa, el profesional sin el acto ve en el registro que hay fotos, pero no puede abrirlas (el 404 no
  dice por qué).
- Una versión nueva del texto no invalida los actos de la anterior: siguen vigentes hasta que se revoquen, como B2.
- Cerrar la cuenta no revoca el acto (tampoco el A3): la cuenta cerrada no opera.

**Punto de aprobación pendiente.**
1. Dirección aprueba el texto, con la validación jurídica; la versión aprobada entra como sucesora, con otro id.
2. Dirección decide activar `BE_EVIDENCIA_VISUAL_EXIGIDA` (en `test`, aun con cuentas sintéticas, es una decisión suya).
3. El 08 registra la activación, y el 05 y el 09 incorporan la familia EVI.

**Condición de cierre.** Los tres pasos anteriores.

## DL-126 — «Analizar» con hasta tres métricas sobre API-PRJ-01: tres de las ocho proyecciones tienen derivación

**Prioridad:** alta · **Documento:** 09 v0.11 §18-§23 (`ProjectionKey`, API-PRJ-01, estados longitudinales y vista
parcial) · B10-09 §15-§28 · 11A TEST-PRJ-001 a 010 · encargo del 2026-10-08, §8 a §13 · **Estado:** PROPUESTA, sin
integrar (`wp-dashboard-profesional`)

**Qué dice el legajo.**
- El 09 cierra la taxonomía en ocho proyecciones y pide que `result` sea una unión discriminada por clave.
- Cada proyección se produce solo «si existe especificación de derivación trazable» (09 v0.11 §20.1). El 09 no fija qué
  es una marca personal ni el volumen efectivo, y deja la ponderación por zonas a una especificación futura.
- 11A TEST-PRJ-001 pide «catálogo = 8/8, 0 extra».

**Qué pide el encargo.**
- Una pantalla «Analizar» con hasta tres métricas, tres modos de lectura, presets por pregunta profesional, comparación de
  períodos y vistas guardadas.
- Un diccionario versionado de métricas que clasifique cada una como disponible, derivable, incompleta o futura.
- No inventar valores ni pantallas aparentemente operativas.

**Por qué no tal cual.** Cinco claves dependen de especificaciones que BE no tiene:
- el volumen de carga externa con todas las bases de carga;
- el mapeo de zonas musculares;
- el umbral del profesional;
- la definición de una marca.
Producirlas sería inventar.

**Opciones.**
- **A.** API-PRJ-01 con las 8 claves en el contrato (8/8, ninguna extra).
  - Se derivan las tres que tienen un cálculo canónico en el dominio:
    - `NUTRITION_PRESCRIBED_VS_RECORDED`, con `calcularNutrientes`, sumando lo conocido y declarando lo que falta;
    - `TRAINING_PROGRESSION_BY_EXERCISE`, con `comparacion-de-entrenamiento`;
    - `ANTHROPOMETRY_LONGITUDINAL`, con `construirSerie` de ANT-06.
  - Las otras cinco responden `INSUFFICIENT_INFORMATION` con `SPECIFICATION_PENDING`.
  - Las métricas de «Analizar» son vistas de esas tres claves, descritas en un diccionario versionado.
- **B.** Una operación nueva de BE, «serie de una métrica», paralela a PRJ-01. Duplica el contrato del 09 e introduce un
  modelo canónico paralelo, que el encargo pide evitar.

**Provisorio en código.** A.

**Decisiones reversibles que toma esta propuesta:**
- La semana va de lunes a domingo en la zona civil del asesorado, y una semana parcial se marca.
- El período admite hasta 366 días.
- La media semanal de nutrición es sobre los días con cantidades, con el denominador visible. No hay día «completo»: BE
  no tiene ese mecanismo.
- El RIR es ordinal y se resume con la mediana.
- La carga de la serie más pesada se informa por sesión, sin mezclar kg con lb ni ejercicios distintos, y no se llama 1RM
  ni marca.

**Condición de cierre.**
1. Dirección aprueba el diccionario.
2. El 09 incorpora la forma de los tres resultados.
3. Las especificaciones de las otras cinco claves se definen, o se declaran fuera del alcance de la entrega.

## DL-127 — API-DSH-04 en BE: fuentes, forma de la entrada y filtros que el 09 no fija

**Prioridad:** alta · **Documento:** 09 v0.11 §16 (09v11:964-1010) · B10-08 §11-§12 · 06 T-06-24 · DL-054 · DL-116 ·
**Estado:** PROPUESTA, sin integrar (`wp-dashboard-profesional`)

**Qué dice el legajo.**
- La entrada tiene `timelineEntryId`, `domain`, `eventType`, `source`, `occurredAt`, `recordedAt`, `author`,
  `provenance` y `relations`.
- `occurredAt` y `recordedAt` son independientes; si uno falta, no se copia el otro.
- Solo hay relaciones reconstruibles (plan → ejecución, original → corrección, revisión → acción).
- Los filtros son `domain`, `type`, `periodStart` y `periodEnd`.

**Qué falta en el 09.**
- De qué fuentes sale cada tipo de evento.
- Cómo se representa un hecho que solo tiene fecha.
- Cómo se ordenan los empates y cómo se pagina de forma estable.
- Si hay búsqueda.
- Los filtros que pide el encargo: estado, calidad, versión de plan, ejercicio y texto.

**Opciones.**
- **A.**
  - **Fuentes:** las tablas fuente de cada dominio, acotadas al profesional y a los alcances que el PDP permitió, y los
    eventos de proceso persistidos (cumple la condición de cierre de DL-054 en esta parte).
  - **Unidad de la entrada:** una por registro, sesión, toma, activación, revisión o hecho de proceso; nunca una por
    ítem ni por evento técnico del cronómetro.
  - **Fecha sin hora:** `occurredDate` acompaña a `occurredAt`, que es `null` cuando el hecho no tiene hora.
  - **Orden y paginación:** fecha del hecho descendente, después `recordedAt` y el identificador, con un cursor opaco.
  - **Extensiones de BE**, declaradas: `state`, `quality`, `planVersionId`, `exerciseId` y `q`. `q` busca en el período
    completo del conjunto autorizado.
  - **Rectificaciones y anulaciones:** son relaciones de la entrada original, no entradas de consumo nuevas.
- **B.** Implementar solo los filtros del 09 y dejar la búsqueda y los filtros avanzados para después.

**Provisorio en código.** A.

**Condición de cierre.** Dirección aprueba la forma de la entrada y las extensiones, y el 09 las incorpora.

## DL-128 — Vistas de análisis guardadas e indicadores fijados del Resumen

**Prioridad:** media · **Documento:** encargo del 2026-10-08, §6.2 («indicadores fijados por el profesional»), §8
(«guardar una vista personal y volver a abrirla»), §14 y §16 · 09 sin operación · 08 (los datos de salud no se copian
en preferencias) · **Estado:** PROPUESTA, sin integrar (`wp-dashboard-profesional`)

**Qué pasa.**
- El encargo pide guardar vistas de análisis y fijar indicadores en el Resumen, «por cuenta y con el mecanismo
  adecuado», guardando la configuración y nunca los datos de salud.
- El 09 no tiene ninguna operación de preferencias del profesional, salvo el umbral de PRJ-02 y 03, que tiene otra
  semántica.
- El modelo no tiene preferencias por cuenta.

**Opciones.**
- **A.** Una familia propia de BE, **VAN** (como TPL, HAB, CAR o EVI):
  - API-VAN-01 lista, API-VAN-02 crea, API-VAN-03 reemplaza con versión esperada y API-VAN-04 borra;
  - tabla aditiva `vista_de_analisis`, mutable y del profesional (como «Mis habituales»), con escrituras auditadas;
  - la configuración se valida con un esquema del dominio y no admite datos de salud: solo identificadores de métricas,
    período, modo, grano y capas;
  - abrir una vista vuelve a pasar por el PDP en cada lectura de datos, así que una vista guardada no concede acceso;
  - a lo sumo una configuración de indicadores del Resumen por profesional.
- **B.** Guardar las vistas en el `localStorage` del navegador. No sobrevive a otro dispositivo ni a una sesión nueva en
  otro navegador, y el encargo pide persistencia por cuenta.

**Provisorio en código.** A.

**Condición de cierre.** Dirección aprueba la familia y el 09 la incorpora o la declara extensión de BE.
