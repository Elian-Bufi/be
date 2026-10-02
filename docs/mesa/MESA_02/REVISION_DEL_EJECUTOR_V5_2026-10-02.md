# MESA-02 · Revisión del ejecutor sobre las correcciones v5

> **REVISIÓN DEL EJECUTOR — NO ES UN DICTAMEN INDEPENDIENTE**
> **Quién la hace:** Claude (Opus 5.5), agente ejecutor del proyecto, por pedido de Dirección. Es un agente distinto del que produjo v5 (ChatGPT/Codex, según `RESOLUCION_HALLAZGOS_v5.md` y `DV-02/DV-02_ACTA.md` §9). Pero no es independiente: trabaja para el mismo proyecto y construyó buena parte de la implementación.
> **Fecha:** 2026-10-02.
> **Qué revisa:** los seis hallazgos que el dictamen v4 dejó abiertos. Para cada uno se ejecutó la verificación que pide `docs/mesa/MESA_02/RESOLUCION_HALLAZGOS_v5.md` (13-09-2026), sobre los artefactos v5 que están en el repositorio.
> **Quién decide:** el cierre formal de cada hallazgo lo decide Dirección.

## 1. Antes de leer

- **El dictamen v4 evaluó v4, no v5.** Fue NO CONFORME, con seis hallazgos abiertos y ocho resueltos. La resolución v5 es posterior y declara su propio estado: «correcciones producidas; cierre independiente pendiente».
- **El dictamen v4 completo no está en el repositorio.** Se buscó en `docs/` y en la copia de la entrega de Dirección (`_docs_origen/`, que git ignora). Solo aparece citado en `RESOLUCION_HALLAZGOS_v5.md`, en `NORMAS/LEER_ESTADOS_HISTORICOS.md` y en `DV-06/NOTA_DERIVACION_DV-06.md`. Tampoco están los artefactos v4. Esta revisión trabaja con lo que dice la resolución v5: el hallazgo, la corrección declarada y la verificación pedida. Hay dos consecuencias:
  - no se puede comprobar que la resolución describa cada hallazgo igual que el dictamen;
  - donde la verificación pide «conservar» algo de v4, se comprueba el estado actual, no la comparación con v4.
- **Faltan otras dos referencias que citan los artefactos v5:**
  - `docs/mesa/00_LEEME_PRIMERO.md`, citado por `NORMAS/LEER_ESTADOS_HISTORICOS.md`;
  - la carpeta `HERRAMIENTAS` con los motores v5, citada por el addendum v5 de `DV-08_09/NOTA_DERIVACION_DV-08_09.md`.

  Sin esos motores, las figuras v5 no se pueden regenerar desde el repositorio. Los scripts `.py` de las carpetas DV-06, DV-07 y DV-08_09 no leen los archivos v5 (`RELACIONES_v5.json`, `ENTIDADES_GRAFICAS_v5.json`).

## 2. Resultado por hallazgo

| Hallazgo | Severidad | Entregable | Resultado de esta revisión | En una línea |
|---|---|---|---|---|
| H-M02-01 | mayor | DV-02 §§7 y 8 | **Verificado** | Las cinco fuentes, abiertas el 2026-10-02, sostienen cada afirmación y cada límite. La de Hexfit cambió de dirección y uno de sus localizadores ya no aparece |
| H-M02-04 | mayor | DV-05 | **Verificado** | 59 IDs, 25 TEST-RF completos, 34 temáticos con el título idéntico al del 11A y 59 NOT_EXECUTED; CSV, MD y JSON sincronizados |
| H-M02-05 | mayor | DV-05, TEST-FRM-001 | **Verificado**, con una parte **no verificable con lo que hay en el repositorio** | El rechazo íntegro está en el oráculo, los pasos y los datos, y lo sostiene 09 §22.3. Que ANT-003 y AUTH-001 conserven las reparaciones de v4 no se puede comparar sin v4 |
| H-M02-07 | mayor | DV-06 y DV-07 | **Parcial** | Registros, pasajes, trazados, etiquetas y cardinalidades del DER verifican. Quedan tres cardinalidades ilegibles, cruces de cajas en la figura índice y en seis conectores de las clases, cinco etiquetas T-06 que no corresponden al término del 06 y dos atributos que no salen del 06 |
| H-M02-13 | menor | DV-07 C0 | **Parcial** | Los carriles inferiores y la desconexión de Especialización y Ámbito están. En el PNG, los dos carriles salen por el mismo tramo que «admite» |
| H-M02-14 | menor | DV-09.1 | **Parcial** | El límite del contenedor y las 16 dependencias coinciden con 07 §18. La matriz no incluye «Analítica TVCC-30», uno de los 18 componentes |

## 3. Detalle por hallazgo

### H-M02-01 · DV-02, mercado y competencia (mayor)

**Corrección declarada en v5.** «DV-02 §§7/8 reemplazados con cinco fuentes primarias; correspondencia afirmación–fuente, NE explícito e hipótesis de posicionamiento. Se retiran afirmaciones no acreditadas de saturación, carencias universales y lanzamiento institucional gratuito.»

**Verificación pedida.** «Abrir fuentes; comprobar que cada afirmación y límite corresponde a lo consultado. No exigir validación estadística que el texto ya no afirma.»

**Qué se miró.**
- `DV-02/DV-02_ACTA.md`: §7 (7.1 a 7.4), §8 (8.1 y 8.2) y la tabla «Fuentes primarias y correspondencia de afirmaciones» (S1 a S5).
- `DV-02/MERCADO_Y_COMPETENCIA_v5.md`.
- Las cinco URL de la tabla de fuentes, abiertas el 2026-10-02 con una herramienta de lectura web.

**Resultado: verificado.**

**Evidencia.**
- §§7 y 8 y la tabla de fuentes son idénticos en el acta y en `MERCADO_Y_COMPETENCIA_v5.md`: se compararon línea por línea.
- Cada fuente frente a lo que DV-02 afirma de ella:

| Fuente | Qué afirma DV-02 | Qué muestra la fuente el 2026-10-02 | ¿Corresponde? |
|---|---|---|---|
| S1 · Nutrium | Documenta planes, diarios y mediciones en la app del cliente. Límite: no acredita consentimiento BE ni inmutabilidad | La página, actualizada el 17-09-2025, lista lo que el cliente puede hacer al entrar: ver su plan, ver las mediciones que registró el profesional y registrar diarios de comida, entre otras cosas. Dice además que el profesional define a qué funciones accede cada cliente | Sí |
| S2 · Hexfit | Presenta creación de programas, seguimiento, nutrición y aplicación móvil. No se usan sus cifras promocionales | La URL citada (`myhexfit.com/en/`) redirige con un 301 a `hexfit.com/en/`. La página presenta creación de programas («Create programs in the blink of an eye»), seguimiento del cliente, un componente de nutrición y la app Hexfit Go. El localizador «Files management» ya no aparece como sección | Sí; el localizador quedó desactualizado |
| S3 · NutriAdmin | Documenta planes, cuestionarios y diarios mediante un portal web, accesible también desde el navegador del smartphone | Los dos primeros párrafos dicen que el portal sirve para compartir planes, informes y cuestionarios, que el cliente completa cuestionarios y diarios, y que se accede con el navegador del smartphone | Sí |
| S4 · Healthie | Documenta equipos de atención, varios prestadores por cliente y permisos configurables; reservas con el equipo en la app | La página, actualizada el 05-09-2025, dice que Care Teams asocia varios prestadores de una organización a un mismo cliente, que los permisos se configuran por miembro y que las reservas con miembros del equipo funcionan en la app | Sí |
| S5 · Practice Better | Presenta gestión de la práctica, registros, protocolos e integración de planificación nutricional; portal y app como funciones | La página tiene la sección «Tools to scale your practice», la integración con That Clean Life y un catálogo de funciones con protocolos, registros clínicos, portal del cliente y app | Sí |

- **Límites (NE).** En lo que devolvió la consulta, ninguna de las cinco páginas trata el consentimiento revocable por finalidad, la separación por finalidad entre profesionales, la ausencia de diagnóstico automático como garantía ni el versionado inmutable con corrección aditiva. Los permisos por miembro de Healthie son de equipo, no por finalidad, y DV-02 ya lo dice así. Las celdas NE corresponden a lo consultado, y DV-02 §8.1 aclara que NE no significa «el producto no lo tiene».
- **Afirmaciones retiradas.** «Saturación», «gratuito», «lanzamiento», «obligatoriedad» y «sincronización total» aparecen una sola vez en DV-02: en la lista de lo retirado (§7.4).
- **Validación estadística.** El texto ya no afirma tamaño de mercado, adopción ni participación (§7.1 y §7.3), así que no se exigió.

**Límites de esta verificación.** La herramienta devuelve el texto procesado de la página, no una captura: las citas son las que devolvió. Las páginas pueden haber cambiado entre el 13-09 y el 02-10.

**Observación fuera de lo pedido.** DV-02 §8.2 dice que BE «permanece especificado y en preparación de implementación» y que no se le atribuyen «despliegue» ni «APK operativa». Era cierto el 13-09; hoy no lo es. Ver `DV-02/RECONCILIACION_TECNOLOGIAS_2026-10.md` §5.

### H-M02-04 · DV-05, casos de prueba (mayor)

**Corrección declarada en v5.** «Los 25 TEST-RF tienen precondiciones, datos sintéticos concretos y pasos con variantes; CSV/MD sincronizados, títulos completos y ficha común de fixtures.»

**Verificación pedida.** «Reproducibilidad de escenarios sin rediseño; preservar 59 IDs, 34 escenarios temáticos y estados NOT_EXECUTED.»

**Qué se miró.** `DV-05/DV-05_CASOS_DE_PRUEBA.csv` (59 filas), `DV-05/DV-05_CASOS_DE_PRUEBA.md`, `DV-05/ESCENARIOS_RF_v5.json`, `DV-05/FICHA_FIXTURES.md` y los títulos de los escenarios en `docs/legajo/11A_BE_LEG_11A_v1.0-H.md`.

**Resultado: verificado.**

**Evidencia.**

| Control | Resultado |
|---|---|
| IDs | 59 filas y 59 IDs distintos |
| Estado | Los 59 están en NOT_EXECUTED. PASS y FAIL no aparecen ni en el CSV ni en el MD |
| Escenarios temáticos | 34: TEST-AUTH 13, TEST-DOM 9, TEST-CAL 4, TEST-FRM 4 y TEST-ANT 4. Los 34 títulos son idénticos a los del 11A |
| TEST-RF | 25. Cada uno tiene precondiciones, datos sintéticos concretos y pasos; todos tienen al menos tres pasos numerados. Los 25 tienen variantes o ramas: caso positivo y negativo, o varias versiones, días o actores |
| Sincronía | Las precondiciones, los pasos, los datos y el oráculo de las 59 filas del CSV aparecen literales en el MD. Los 25 escenarios del JSON son idénticos a sus filas del CSV |
| Ficha común | `FICHA_FIXTURES.md` define lo que usan los casos: el reloj (T0 y T1), los alias DEMO-*, el método técnico MET-DEMO, la plantilla FT-DEMO, la evidencia EVID-DEMO y la regla de restaurar una base aislada para cada variante |

**Reproducibilidad.** Los escenarios se pueden ejecutar sin rediseñarlos: cada uno dice de dónde parte, con qué datos, con qué pasos y qué se espera. Lo único que piden del ejecutor está declarado en la ficha: llevar los campos conceptuales a los contratos del 09. Si falta ese mapeo, el caso queda BLOCKED; no se inventa nada.

**Observación fuera de lo pedido (frente al producto actual, no al documento).** Algunos escenarios no se pueden ejecutar hoy contra el producto, por alcance y no por un defecto del documento:
- los que necesitan un administrador: TEST-RF-007, TEST-RF-010 y TEST-RF-012;
- los que necesitan identidad federada, mapas o push: TEST-RF-059;
- los que necesitan un campo no autorizado: el paso 2 de TEST-RF-071 y TEST-FRM-001, porque la matriz de categorías de la implementación es deliberadamente permisiva (DL-095).

La medición de la entrega cuenta 33 de los 59 casos nombrados por una prueba que pasa en la CI (`docs/mesa/MESA_01/ESTADO_PUNTOS_5_11_14_ENTREGA.md`, punto 5).

### H-M02-05 · DV-05, TEST-FRM-001 (mayor)

**Corrección declarada en v5.** «FRM-001: request mixto se rechaza íntegramente con 422 / FORM_REQUEST_NOT_ALLOWED; request válido separado puede dar 201. Oráculo y pasos citan 09 §22.3.»

**Verificación pedida.** «Comprobar que no queda éxito parcial por recorte de campos; conservar las reparaciones ANT-003/AUTH-001 de v4.»

**Qué se miró.**
- TEST-FRM-001 en `DV-05_CASOS_DE_PRUEBA.csv` y en el MD; el paso 2 de TEST-RF-071; FT-DEMO en `FICHA_FIXTURES.md`.
- `docs/legajo/09_BE_LEG_09_v0.16.1.md` §22.3 (líneas 1489 a 1559).
- TEST-ANT-003 y TEST-AUTH-001 en el CSV; el 09 §23.6 y §20.2.1; los títulos del 11A.

**Resultado: verificado en lo que el repositorio permite comprobar. La conservación de las reparaciones de v4 no es verificable con lo que hay en el repositorio.**

**Evidencia.**
- **Oráculo:** «A se rechaza íntegramente con HTTP 422 / FORM_REQUEST_NOT_ALLOWED y no crea una solicitud parcial ni revela campos ocultos. B […] crea la solicitud con HTTP 201.»
- **Pasos:** el 3 pide «Afirmar HTTP 422 y FORM_REQUEST_NOT_ALLOWED, sin solicitud creada», y el 4, «no aceptar un 201 con FIELD_X eliminado». El 6 aclara que B «es otro request preparado previamente por el cliente, no una corrección automática de A».
- **Datos:** A pide FIELD_N y FIELD_X; B pide solo FIELD_N. Cada uno lleva su clave de idempotencia.
- **Fuente:** el caso cita «BE-LEG-09 v0.16.1 §22.3 / API-FRM-03». El 09 §22.3 pone como precondición que «cada categoría/campo solicitado [esté] autorizado para ese contexto», declara `422 FORM_REQUEST_NOT_ALLOWED` y dice que ese error «no incluye categorías/datos ocultos». El 09 no dice literalmente «íntegramente», pero la precondición vale para cada campo: un pedido con un campo no autorizado no la cumple. El oráculo se deriva del 09 sin forzarlo.
- **Sin éxito parcial en ningún lugar:** el paso 2 de TEST-RF-071 dice lo mismo («rechazar con FORM_REQUEST_NOT_ALLOWED, sin crear solicitud recortada»). Se buscaron «recort», «parcial» y «FIELD_X» en el MD: no queda ninguna frase que admita un éxito parcial.
- **TEST-ANT-003:** el oráculo dice «La transición a REGISTRADA es atómica: o queda registrada completa, o no cambia de estado», con la fuente «06 §13 · 09 §23.6 API-ANT-11». El 09 §23.6 define la frontera transaccional del registro: PDP, versión esperada, validaciones, transición, auditoría y commit. La fuente lo sostiene.
- **TEST-AUTH-001:** el oráculo dice que las dos respuestas «son indistinguibles en código y cuerpo» y que «la comparación de tiempo no se exige: no está especificada en la fuente». Cita «08 §27 · 09 §20.2.1» y aclara que es «DERIVACIÓN MESA». El 09 §20.2.1 fija la precedencia de revelabilidad. Es coherente.
- **No verificable:** que ANT-003 y AUTH-001 conserven las reparaciones de v4. Ni el dictamen v4 ni los artefactos v4 están en el repositorio. Se comprobó que el estado actual es coherente con sus fuentes, no que sea el mismo de v4.

**Observación fuera de lo pedido.** La implementación rechaza el pedido entero, sin recortar campos: `apps/api/src/formularios/solicitudes.service.ts` responde `422 FORM_REQUEST_NOT_ALLOWED` si alguno de los campos no es pertinente. Pero hoy no existe un campo no autorizado con el cual ejecutar FRM-001: la matriz de categorías permite las cuatro en los tres alcances (`packages/domain/src/formularios.ts`, `MATRIZ_DE_PERTINENCIA`; DL-095). Coincide con la medición de la entrega: TEST-FRM-001 no tiene una prueba que lo nombre.

### H-M02-07 · DV-06 y DV-07, relaciones y cardinalidades (mayor)

**Corrección declarada en v5.** «Pasajes completos, explicación de inferencias, corrección de extremos/cardinalidades y sincronización de DER/clases. 62 registros rastreables de v4, una retirada explícita y tres conexiones agregadas: 65 filas / 64 conectores activos. Referencias interárea corregidas.»

**Verificación pedida.** «Contrastar semántica, historia/modalidad y gráficos con evidencia, incluidas celdas cardinales sin fijar. Eliminar una asociación no respaldada es corrección, no prueba de que el canon la prohíba universalmente.»

**Qué se miró.**
- `DV-06/DV-06_RELACIONES.csv`, `RELACIONES_v5.json`, `EVIDENCIA_RELACIONES_v5.md`, `RUTAS_VERIFICADAS_v5.json`, `DV-06_RELACIONES_INTERAREA.csv`, `NOTA_DERIVACION_DV-06.md` y `AJUSTES_CORRESPONDENCIA_v5.md`.
- Las doce figuras del DER, en `DV-06/source/*.svg` y `DV-06/exports/*.png`.
- Las figuras de clases C0 a C8 de DV-07, en SVG y PNG.
- `docs/legajo/06_BE_LEG_06_v0.1.1.md`, en las líneas que cita cada relación.

**Resultado: parcial.**

**Lo que verifica.**

| Control | Resultado |
|---|---|
| Registros | 65 (R001 a R065): 64 activos y 1 retirado (R004). R063, R064 y R065 están agregados y dibujados |
| Pasajes completos | Para las 65 relaciones, el texto de las líneas citadas del 06 (82 rangos) está literal en `texto_literal_fuente`, y los 82 rangos empiezan en un título de sección |
| Trazados | Los 64 conectores activos de `RUTAS_VERIFICADAS_v5.json` tienen su trazado idéntico en el SVG de su figura. R004 no se dibuja, y la nota de DV-06.1 explica el retiro |
| Etiquetas | Las 64 etiquetas de ID están en el SVG, con asterisco exactamente en las relaciones marcadas DERIVACION_JUSTIFICADA |
| Cardinalidades | Las 88 cardinalidades dibujadas junto a los extremos coinciden con el CSV. Los extremos sin fijar (R019, R023, R036, R038, R039 y R065) no llevan número |
| Cajas ajenas | Ningún conector de DV-06.1 a DV-06.11 atraviesa una caja ajena. Se comprobó con un control propio, además del de RUTAS |
| Interárea | Las 15 referencias del CSV (IA01 a IA15) están dibujadas en la figura índice: 12 continuas y 3 punteadas, que son la instanciación del patrón M-06 |
| Semántica (muestra) | R004: el 06 §5.11.1 define la audiencia de la Novedad como «referencia estructural para que 08 evalúe visibilidad», no como titularidad; el retiro está fundado. R007: «Una Identidad puede declarar cero, una o ambas» (06 §6.5) sostiene el 0..2. R065: «Cuando un Plan simple omite Microciclo, la relación Bloque → Sesión aprobada en v0.1 permanece válida» (REG-06-126) |
| Clases | Lo que declara `AJUSTES_CORRESPONDENCIA_v5.md` está: C2 dibuja Vínculo–Alcance 0..N : 1; C4 no fija el máximo de instantáneas; C5 dibuja Evaluación–Medición 1 : 0..N; C7 tiene R065 («R065 · sin Microciclo»). Las 35 operaciones de `DV-07_OPERACIONES.csv` y las dos guardas de `rechazar()` se conservan |

**Lo que no verifica.**
1. **Tres cardinalidades del DER no se leen bien.**
   - DV-06.7, R043 (Relación Ejercicio–Zona → Zona muscular): «0..N» y «1» se superponen en un conector de unos 40 px.
   - DV-06.11, R062 (Recurso didáctico → Elemento de catálogo): «0..N» y «1» están en el mismo lugar y se leen «01N».
   - DV-06.7, R039 (Sesión → Prescripción): el extremo sin fijar queda pegado al «0..N» de R041, que entra en la misma caja, y se lee como si R039 fuera 1 : 0..N. Es una de las celdas sin fijar que la verificación pide revisar.

   Menor: en DV-06.9, el texto del atributo `estadoDato` de Proyección se sale de su caja.
2. **La figura índice (DV-06.0) tiene tres líneas que atraviesan cajas ajenas.** M-11 → M-09 corta la esquina inferior derecha de M-08 (entra 8 px), y las dos punteadas M-06 → M-07 y M-06 → M-08 cruzan M-04 de lado a lado (entran 21 y 24 px). Así, la figura parece mostrar que Proyecciones sale de Entrenamiento y que el patrón M-06 se instancia en Proceso. El control geométrico de `RUTAS_VERIFICADAS_v5.json` cubre solo los 64 conectores de DV-06.1 a DV-06.11, no la figura índice.
3. **En las clases, seis conectores atraviesan cajas ajenas** y crean relaciones aparentes que el DER no tiene:
   - C1: Identidad → Método de acceso pasa por EstadoCuenta, e Identidad → Incidencia pasa por Perfil propio;
   - C4: Versión → Procedencia pasa por Instantánea;
   - C5: Evaluación → Cálculo derivado pasa por Medición directa, y se lee como una asociación Medición–Cálculo, que en el DER es la dependencia R048;
   - C6: Ítem prescripto → Elemento de catálogo pasa por Opción de comida;
   - C8: Revisión → Proyección pasa por la enumeración ResultadoRevisión.

   Entran entre 7 y 41 px en la caja ajena; el cruce de EstadoCuenta corta solo una esquina. C0, C2, C3 y C7 no tienen cruces.
4. **Otras diferencias de lectura entre el DER y las clases.**
   - En C2, la multiplicidad «1» del lado del Vínculo en Vínculo–Consentimiento (R014) existe en el SVG, pero la tapa la franja del invariante: el PNG muestra solo «0..N».
   - En C6, en el extremo del Ítem prescripto, «1..N» (R032) y «0..N» (R033) se superponen.
   - En C7, Prescripción–Ejecución real se dibuja como asociación continua y sin multiplicidades; el DER la trata como dependencia discontinua (R040).
5. **Etiquetas T-06 de algunas cajas del DER (semántica).** Prescripción de ejercicio lleva T-06-29, Bloque lleva T-06-57 y Sesión lleva T-06-61. En el 06 esos términos son «Borrador de plan · Versión activada», «Microciclo» y «Condición de sesión»; las tres estructuras pertenecen a T-06-32. Además, Ingesta registrada lleva T-06-30, el término genérico, cuando el 06 tiene uno propio (T-06-54), y ContinuidadOCierreAplicado lleva T-06-40, el del ciclo cerrado. El detalle está en `DV-06/RECONCILIACION_DER_IMPLEMENTACION_2026-10.md` §7.
6. **Dos atributos de las mismas figuras no salen del 06.** No son relaciones, pero están en los gráficos que la verificación pide contrastar. El Objetivo (nutricional y de entrenamiento) lleva una referencia al proceso, mientras REG-06-98 pide la referencia a la evaluación aplicable, que el DER no dibuja. Y la Ejecución real tiene tres granularidades (serie, ejercicio y sesión), mientras REG-06-132 admite dos: «por serie; o por ejercicio/sesión».

**Qué falta para cerrarlo.** Corregir las tres cardinalidades, sacar de las cajas ajenas los tres conectores de la figura índice y los seis de las clases, y revisar las etiquetas T-06 y los dos atributos del punto 6. Nada de esto cambia los pasajes ni las cardinalidades de los CSV y JSON de relaciones, que verifican.

### H-M02-13 · DV-07, figura C0 del metamodelo (menor)

**Corrección declarada en v5.** «C0: las dos referencias largas desde Entidad de dominio usan carriles inferiores; Persistencia ya no queda conectada a través de Especialización/Ámbito.»

**Verificación pedida.** «Inspección del SVG y PNG con extremos inequívocos.»

**Qué se miró.** Los trazados de `DV-07/source/DV-07_C0_METAMODELO.svg` y `DV-07/exports/DV-07_C0_METAMODELO.png`, en vista completa y en un recorte ampliado del origen.

**Resultado: parcial.**

**Evidencia.**
- **SVG.** «declara» sale de Entidad de dominio en (747, 360), baja por x = 790 hasta el carril y = 710 y entra por la izquierda a Persistencia conceptual, en (1723, 410). «conserva» baja por x = 810 hasta el carril y = 730 y entra a Autoría, en (1723, 530). Ninguno toca Especialización ni Ámbito, y ningún conector de C0 atraviesa una caja ajena.
- **PNG.** Los dos destinos se leen sin ambigüedad.
- **Lo que queda.** En el origen, los dos carriles comparten con «admite» (Entidad de dominio → Especialización) el tramo horizontal de y = 360, entre x = 747 y x = 790 u 810. En el PNG se ven como dos ramas en T que salen de la línea de «admite». Un lector puede entender que «declara» y «conserva» salen de esa relación, o de Especialización. En el PNG, el extremo de origen no es inequívoco.

**Qué falta para cerrarlo.** Que los dos carriles salgan de Entidad de dominio por un punto propio, por ejemplo desde su borde inferior.

### H-M02-14 · DV-09.1, componentes del backend (menor)

**Corrección declarada en v5.** «DV-09.1 reordenado en cinco columnas; 18 componentes preservados dentro de API, PostgreSQL fuera y rótulo visible. Matriz de dependencias conservada.»

**Verificación pedida.** «Cotejar límite del contenedor con 07 §18 y nombres/dependencias con matriz.»

**Qué se miró.** `DV-08_09/exports/DV-09_1_COMPONENTES.png` y su SVG; `DV-08_09/exports/DV-09_2_MATRIZ_DEPENDENCIAS.png` y su SVG; `DV-09_MATRIZ_DEPENDENCIAS.csv` y `DV-09_FAMILIAS.csv`; `docs/legajo/07_BE_LEG_07_v0.1.11.md` §18 (líneas 709 a 753) y §19.

**Resultado: parcial.**

**Evidencia.**
- **Límite del contenedor: coincide.** El 07 §18 declara 18 componentes dentro de `Container_Boundary(api, "API BE (NestJS)")` y PostgreSQL afuera, como `ComponentDb`. DV-09.1 tiene los mismos 18 dentro del contenedor punteado «API BE (NestJS) — un solo despliegue», en cinco columnas (filas de 5, 5, 5 y 3). PostgreSQL queda afuera, con los rótulos «Persistencia externa a API BE» y «PostgreSQL fuera del límite NestJS · Acceso mediante Prisma · 07 §18».
- **Dependencias: coinciden.** El 07 §18 tiene 16 relaciones. Las 16 están en el CSV como PERMITIDA, en la figura de la matriz como celdas verdes y en DV-09.1 como rótulos «→» bajo cada caja. Las 6 prohibiciones del CSV aparecen en la matriz como celdas rojas, con su fundamento.
- **Nombres: no coinciden del todo.** La matriz, en el CSV y en la figura, tiene 17 de los 18 componentes. **Falta «Analítica TVCC-30»**, que está en el 07 §18 y en DV-09.1. Como el 07 §18 no le asigna ninguna relación, su fila y su columna quedarían vacías, pero la matriz ni la nombra.
- Los demás nombres de la matriz son abreviaturas inequívocas de los de la figura: «Emisión», «Motores», «Temporal» y otros. La figura dice «Emisión de eventos» donde el 07 dice «Emisión de acontecimientos».

**Observaciones fuera de lo pedido.**
- La leyenda de la matriz dice que una celda en blanco es una dependencia «que el diseño no contempla». Pero el 07 §19 declara otras dependencias salientes permitidas que la matriz deja en blanco, porque solo toma las de §18. Por ejemplo, identidad, verificación, vínculos, procesos y revisión hacia el PDP y la emisión, y analítica hacia proyecciones y el motor temporal.
- `DV-09_FAMILIAS.csv` asigna la familia PRO a dos componentes («Verificación · Habilitación»), y DV-09.1 muestra [PRO] en las dos cajas. La nota de DV-08 y DV-09 afirma «cero duplicadas».

**Qué falta para cerrarlo.** Agregar «Analítica TVCC-30» a la matriz, aunque su fila y su columna queden vacías.

## 4. Controles de regresión

La resolución v5 enumera lo que debía conservarse. Estado actual:

| Qué debía conservarse | Resultado |
|---|---|
| Fuentes canónicas | `bash scripts/verificar-legajo.sh` termina en «legajo íntegro» (corrida del 2026-10-02, al cerrar esta revisión) |
| Cobertura de 79 términos | `DV-06/DV-06_COBERTURA_TERMINOS.csv` tiene 79 filas |
| Inventario de 35 operaciones | `DV-07/DV-07_OPERACIONES.csv` tiene 35 filas |
| Máquinas y secuencias v4 | `DV-07/DV-07_MAQUINAS.csv` tiene 9 máquinas, con las figuras E1 a E9 y las secuencias S1 y S2 |
| 34 escenarios temáticos | Ver H-M02-04 |
| C3 y las guardas de `rechazar()` | C3 conserva sus seis operaciones con guarda: registrarObservación, presentarSubsanación, verificar, rechazar, suspender y rehabilitar. `rechazar()` mantiene «confirmación explícita» en Solicitud (C2) y «resolución desfavorable» en Verificación (C3), en el CSV y en las figuras |

## 5. Qué queda para Dirección

1. **Decidir el cierre de cada hallazgo.** Recomendación del ejecutor: cerrar H-M02-01, H-M02-04 y H-M02-05, y dejar abiertos H-M02-07, H-M02-13 y H-M02-14 hasta corregir lo que señala §3. Son correcciones gráficas y de nombres, sin cambio de contenido.
2. **Si hace falta una verificación independiente de verdad**, encargarla a un revisor que no haya producido v5 ni la implementación.
3. **Buscar fuera del repositorio** el dictamen v4 y la carpeta `HERRAMIENTAS`, si existen: permitirían comparar con v4 y regenerar las figuras.

## 6. Cómo se hicieron los controles

- **Textos:** lectura directa de los archivos citados.
- **Pasajes del 06:** para cada relación se extrajeron del 06 las líneas Lnnn a Lmmm que cita `regla_fuente`, y se comprobó que ese texto, con los espacios normalizados, está contenido en `texto_literal_fuente`.
- **Trazados, etiquetas y cardinalidades:** se leyeron los `<path>` y los `<text>` de cada SVG y se compararon con `RUTAS_VERIFICADAS_v5.json` y con el CSV. Cada cardinalidad se asoció al extremo de conector más cercano, a menos de 45 px.
- **Cruces de cajas:** se muestreó cada conector y se buscaron puntos dentro de cajas que no son ni su origen ni su destino.
- **Imágenes:** se revisaron los PNG completos y recortes ampliados de las zonas dudosas.
- **Fuentes web:** las cinco URL de DV-02 se abrieron el 2026-10-02.

Los scripts fueron de uso único y no quedan en el repositorio.
