# Próximas ampliaciones A a F: diseño para decidir

**Bloque 7 del encargo de consolidación del 2026-10-19.** Es una propuesta: nada de esto está implementado. Corregir una pantalla tampoco lo implementa.

Lo contrasté con dos ramas:
- en el checkout `BE-Best-entrenamiento`, `wp-consolidacion-recorridos` (`da6d8f6`);
- para las recetas del bloque 4, `wp-recetas-de-ejemplo`, en `C:/b12`.

Las rutas son del repo y `:N` es el número de línea.

## Cómo leer esto

Cada idea tiene las mismas ocho partes:
1. qué existe, verificado en el código;
2. qué falta;
3. el cambio mínimo completo;
4. dependencias;
5. contratos y pantallas;
6. compatibilidad;
7. criterio de aceptación;
8. decisiones para Dirección.

**(propuesto)** marca toda operación, tabla, campo o pantalla que hoy no existe. Los nombres se fijan al registrar la DL.

Lo que vale para todas las ideas está una sola vez, en «Lo común». Cada decisión trae alternativas y una recomendada. Lo puramente técnico lo resuelve el ejecutor dentro del paquete aprobado.

## Resumen

| Idea | Tamaño | ¿APK nueva? | Dependencia principal | Orden |
|---|---|---|---|---|
| **A** · Formularios de inicio (DL-144) | M | No para funcionar | DL-144 decidida; en Nutrición, citas de PF-04 I1 | 3 |
| **B** · Objetivos por tipo (PF-04 I2) | L | Sí | PF-04 D-5 a D-10; revisor de nutrición | 5 |
| **C** · Objetivo, plan y registros | M | No | Ninguna para lo cuantitativo; B para lo conductual | 1 |
| **D** · Qué cambió y por qué | S web + M persona | Solo para la persona | Ninguna para la parte web | 2 |
| **E** · Alternativas y contexto breve (PF-03) | L | Sí | PF03-D-4 y D-8 | 6 |
| **F** · Biblioteca común de comidas | L | No | Revisor de nutrición; manifiesto de las 16 recetas | 4 |

Los tamaños son relativos:
- **S:** dominio y website.
- **M:** API y website, con una pieza chica de APK como mucho.
- **L:** contrato con migración y todas las capas, o un modelo nuevo.

## Hallazgos que cambian lo que supone el encargo

1. **Las APK candidatas no dejan sustituir un ejercicio.**
   - La 0.13.2 sí deja.
   - Se quitó al rehacer la sesión enfocada (`e6bd769`, 6/10), sin decisión registrada.
   - Sus textos quedaron sin uso (`packages/domain/src/copy-entrenamiento.ts:179-183`).
   - La API la sigue aceptando (REG-06-130).
2. **La evaluación nutricional no cita respuestas.**
   - Solo cita la de entrenamiento (DL-102).
   - La nutricional manda `evidenceReferences: []` (`apps/web/src/app/pro/advisees/nutrition/formularios.tsx:94`).
3. **Las candidatas leen las revisiones (REV-A) con esquema estricto** (`packages/domain/src/cliente-http.ts:1323-1335`).
   - El esquema incluye `nextAction.objective` y los tipos de evidencia (`contratos-nutricion.ts:504-517`).
   - Un objetivo conductual o un tipo de evidencia nuevo rompe esa pantalla.
4. **Comparar versiones por id no siempre funciona.**
   - «Nueva versión del plan» copia los ids de nodo (`apps/api/src/nutricion/planes.service.ts:176-184`).
   - Una versión que sale de una plantilla o de cero tiene ids nuevos (`:167-175, 185-192`).
   - Los ítems de una receta cambian de id con cada versión de la receta (`opciones-de-receta.ts:45-55`).
5. **Lo indicado de cada opción ya se calcula, pero solo para la persona.**
   - Es `planned` de API-ING-01 (`contratos-registro-de-comidas.ts:103-115`).
   - La lectura del plan del profesional no lo trae.
6. **Una fecha puede tener dos objetivos distintos.**
   - Analizar dibuja el objetivo según su vigencia.
   - La persona ve el que cita su plan activado (`apps/api/src/nutricion/ingestas.service.ts:78`).
   - Entre un cambio de objetivo y la activación del plan nuevo, los dos difieren.
7. **Las 16 recetas del bloque 4 son recetas privadas** de la cuenta de prueba de la Lic. Sofía Paz.
   - El manifiesto, sin integrar, está en `EVIDENCIA/DASHBOARD-PROFESIONAL/herramientas/datos/recetas/manifiesto.json`.
   - Un plan solo usa recetas propias (`opciones-de-receta.ts:65-67`).
8. **PF-04 D-4 ya está implementada.** FRM-03 rechaza una plantilla pedida fuera de su área (`apps/api/src/formularios/solicitudes.service.ts:81-86`).
9. **A no cambia nada de lo que lee la persona.** Una solicitud creada por BE es una solicitud FRM común, y toda APK instalada la muestra.

## Lo común

**Lo que leen las APK instaladas.**
- **La 0.13.2.** Sus lecturas están congeladas en `packages/domain/fixtures/respuestas-que-lee-la-apk-instalada.json` (NUT-14 a 16 y 16-LISTA; TRN-08, 09, 13 a 20, 14-PERIODO y 19-LISTA). Lo controla la prueba C01.
- **Fuera de la fixture**, también se leen con esquemas estrictos que nadie congeló:
  - FRM-02, 05 y 06, en todas las APK;
  - en las candidatas 0.15 a 0.17, además, ING-01 a 06, SER-02, AGE-01, REV-A (NUT-19 y TRN-23) y NOV-01 y 02.

  Recomiendo congelarlas también, con la 0.17.0-candidata.3.

**Cómo se extiende sin romperlas.**
- **Lo nuevo va en operaciones nuevas** (DL-137 D-7).
- **Las lecturas del profesional sí pueden crecer**, porque el website sale con la API. Así llegaron `templateOrigin` y `sinceCounts`.
- **Si una APK vieja mostraría algo equivocado, se usa el mecanismo de DL-122:**
  - la APK nueva declara `X-BE-Capabilities`;
  - la API la anota en `capacidad_de_cliente_declarada`;
  - mientras el titular no use una APK capaz, el plan no se activa (`409 CLIENT_CAPABILITY_REQUIRED`).

**Reglas de producto que se respetan:**
- la ausencia no es cero;
- un registro parcial no es el consumo del día;
- las alternativas no se suman;
- no hay puntaje de adherencia;
- que dos cosas coincidan en el tiempo no prueba que una cause la otra;
- no se agregan rangos normativos ni cuestionarios clínicos;
- nada es obligatorio para usar BE;
- la autoría y las versiones quedan claras.

---

## A · Formularios de inicio (DL-144, A con C)

**1. Qué existe**
- **La solicitud FRM** (API-FRM-01 a 08) guarda (`prisma/schema.prisma:2203-2270`):
  - quién pide y a quién;
  - la versión de la plantilla;
  - para qué y en qué área;
  - las preguntas pedidas y las requeridas;
  - la fecha.

  La respuesta queda como `SELF_REPORTED`, y una rectificación se agrega, sin pisar lo anterior.
- **Plantillas.** Hay tres sintéticas. FRM-ENTRENAMIENTO ya se precarga desde la evaluación (`packages/domain/src/formularios.ts:95-99`).
- **Lo pendiente ya se ve:**
  - en la pestaña Información;
  - en Pendientes, como `FORM_REQUEST_OPEN` (`packages/domain/src/cartera.ts:20, 151`);
  - en la APK, por FRM-06.
- **Aceptar un vínculo termina en «Último paso: tus datos de salud»** (DL-143; `apps/mobile/src/paso-que-falta.tsx`).
- **El acceso queda efectivo con tres actos.** El último de los tres lo completa:
  - el vínculo, con API-REL-03;
  - el consentimiento al profesional (B2), con API-CON-02;
  - el tratamiento de datos de salud (A3), con API-CON-06.

**2. Qué falta**
- Una configuración del profesional, con una ejecución que no duplique.
- El estado «recibido» o «pendiente».
- Citas en Nutrición.
- Una actualización ligada al pedido anterior.

**3. Cambio mínimo completo**
- **La configuración (propuesta).** «Formularios de inicio», en el menú de la cuenta.
  - Por área: plantilla, preguntas, cuáles son requeridas y para qué.
  - Arranca vacía, con «Usar la sugerencia de BE».
- **El pedido automático.** Cuando el último de los tres actos deja efectivo el acceso en un área, BE crea las solicitudes en la misma transacción.
  - Valen las reglas de FRM-03, y quien pide sigue siendo el profesional.
  - Lo que ya no aplica se omite y queda informado. Nunca hace fallar el acto de la persona.
- **Sin duplicados.** La tabla (propuesta) `solicitud_de_inicio` lleva un motivo (`INICIO` o `ACTUALIZACION`) y una clave única por componente del vínculo y plantilla cuando el motivo es `INICIO`.
  - Un reintento no vuelve a pedir.
  - Un nuevo B2 o una reanudación del vínculo, tampoco.
- **Para quien ya estaba vinculado.** En la ficha, «Enviar los formularios de inicio» pide solo lo que no está pendiente.
- **El estado, una línea por formulario:**
  - «Pendiente desde el 12 oct · Ver la solicitud»;
  - «Recibido el 14 oct · Citar en la evaluación · Pedir que lo actualice».
- **«Pedir que lo actualice».** Crea otra solicitud igual, y nunca hay dos pendientes a la vez.
  - La evaluación avisa que hay una versión posterior.
  - Ofrece «Nueva evaluación a partir de esta».
- **Las citas en Nutrición** (PF-04 I1). Hoy el módulo de citas fija el área en `'ENTRENAMIENTO'` (`apps/api/src/entrenamiento/citas-de-respuestas.ts`); pasa a recibirla.
- **En la próxima APK, «Para empezar».**
  - Va después del último paso.
  - Lee FRM-06 filtrado por `relationshipId`, sin campos nuevos.

**4. Dependencias**
- Que Dirección decida DL-144.
- En Nutrición, PF-04 D-1 a D-3. Mientras tanto, se usa FRM-HABITOS.

**5. Contratos y pantallas**
- **Operaciones nuevas (propuestas):**
  - INI-01 e INI-02: leer y reemplazar la configuración;
  - INI-03: el estado de los formularios de una persona;
  - INI-04: enviar o pedir la actualización, con Idempotency-Key.
- **Novedad nueva:** `FORM_REQUEST_RECEIVED`. Como `kind` es texto, una APK vieja también la muestra.
- **Lecturas existentes.** FRM-04 suma `origin`. FRM-05 y FRM-06 no cambian.
- **Pantallas:**
  - website: la cuenta, la ficha, Información y la evaluación;
  - APK: «Para empezar».

**6. Compatibilidad**
- Toda APK instalada ve estas solicitudes en Información.
- Lo que ya existe no cambia.

**7. Criterio de aceptación**
- **Integración:**
  - los tres actos, en cualquier orden, crean una solicitud por formulario;
  - un reintento, un nuevo B2 o una reanudación no crean otra;
  - FRM-06 pasa los esquemas de la 0.13.2 y de la candidata.
- **Navegador (CI):** configurar, aceptar, ver «Pendiente», responder, ver «Recibido» y citar.
- **Teléfono:**
  - una persona nueva responde desde «Para empezar»;
  - con la 0.13.2, el pedido aparece en Información.

**8. Decisiones para Dirección**
- **A-D1 · ¿Arranca configurado?**
  - (a) Lo configura el profesional, con la sugerencia a un clic. **Recomendada:** quien pide es él, y el 08 pide juntar solo lo necesario.
  - (b) La sugerencia queda activa por defecto, como se pidió el 18/10. BE pediría en su nombre algo que él no eligió.
- **A-D2 · ¿Se reusan respuestas entre profesionales?**
  - (a) No. **Recomendada:** el encargo dice «no se comparte globalmente por comodidad».
  - (b) La persona copia a mano lo que ya respondió.
- **A-D3 · ¿El teléfono ofrece completarlos ahí mismo, después del A3?**
  - (a) Sí, con «Más tarde» igual de visible. **Recomendada.**
  - (b) Solo desde Inicio.

---

## B · Objetivos nutricionales por tipo (PF-04, incremento 2)

**1. Qué existe**
- **El objetivo exige números:**
  - energía mayor que cero y los tres macronutrientes;
  - fundamento obligatorio (`packages/domain/src/contratos-nutricion.ts:91-108`);
  - campos `NOT NULL` en la base (`prisma/schema.prisma:1249-1276`).
- **La persona lo ve en «Hoy»** (API-NUT-14, `:431-465`), congelado por C01. Toda APK lo muestra en kcal y en gramos (`apps/mobile/src/pantallas/nutricion.tsx:151-155`).
- **CHANGE_OBJECTIVE** guarda el objetivo dentro de la revisión.
- **PF-04 ya propuso la forma:** un tipo, de una a cinco metas y un CHECK por tipo. Las decisiones siguen abiertas.

**2. Qué falta**
- El incremento entero.
- La protección de las APK instaladas.

**3. Cambio mínimo completo**
- **El contrato.** API-NUT-04 recibe `QUANTITATIVE`, `BEHAVIORAL` o `COMBINED`; sin tipo, es cuantitativo.
  - El conductual no lleva números, tampoco un cero.
  - Una meta no lleva contador, porcentaje ni estado de cumplimiento.
- **La base.** Columnas `tipo` (cuantitativo por defecto) y `metas_conductuales`, con un CHECK por tipo. No se reescribe ninguna fila.
- **La revisión.**
  - CHANGE_OBJECTIVE acepta cualquier tipo.
  - «Cómo se revisa» de cada meta se muestra al prepararla: es el criterio que acordó el profesional.
- **La activación.** Un plan se activa con cualquier tipo de objetivo.
  - Si el objetivo no es cuantitativo, exige que la persona ya haya usado una APK que declare `nutrition-objective-kinds-1` (propuesto).
  - Si no la usó, responde el 409 de DL-122.
- **La lectura de la persona.** Nueva (propuesta): API-NUT-14-OBJETIVO, `GET /me/nutrition/today/objective`. En la APK nueva, «Plan actual» muestra las metas, los números o las dos cosas.
- **El website.** Tipo y metas en el objetivo y en la revisión. En Analizar, una versión conductual se rotula, sin escalón.

**4. Dependencias**
- PF-04 D-5 a D-10 (D-9 la resuelve el mecanismo de DL-122).
- DEC-02, o una desviación declarada, como en DL-100.
- Una APK nueva.

**5. Contratos y pantallas**
- **Cambian:**
  - NUT-04 a 06, que solo usa el profesional;
  - NUT-17, 18 y 20;
  - NUT-11 y 12.
- **Nueva:** NUT-14-OBJETIVO. NUT-14 conserva su forma.
- **Pantallas:**
  - website: Resumen y revisión de Nutrición, y Analizar;
  - APK: «Plan actual».

**6. Compatibilidad**
- **El cuantitativo** sale en NUT-14 exactamente igual que hoy.
- **El conductual** no cabe en NUT-14.
  - A una APK sin la capacidad, «Hoy» le dice «no disponible», como en DL-122.
  - El texto que ve la persona («Revisá el estado del vínculo…») queda inexacto. Es un límite que DL-122 ya aceptó.
- **Las revisiones (REV-A).** Al cliente sin la capacidad, NUT-19 le manda la revisión sin `nextAction.objective`, que es opcional.
- **Lo anterior** se lee como cuantitativo.

**7. Criterio de aceptación**
- **Contrato:**
  - el conductual rechaza números;
  - el cuantitativo conserva sus reglas.
- **Integración:**
  - los tres tipos;
  - los datos anteriores a la migración;
  - NUT-14 y NUT-19 contra la 0.13.2 y la candidata;
  - la activación, primero bloqueada y después habilitada.
- **Teléfono:**
  - las metas se ven en la APK nueva;
  - con la 0.13.2, un objetivo cuantitativo sigue abriendo.

**8. Decisiones para Dirección**
- **B-D1** (PF-04 D-5 y D-6) · ¿Se aprueba la unión por tipo? **Recomendado:** sí.
- **B-D2 · ¿El objetivo combinado también exige la APK nueva?**
  - (a) Sí. **Recomendada:** nadie ve los números sin las metas.
  - (b) No: la APK vieja oculta las metas.
- **B-D3 · ¿El profesional puede escribir intervalos?**
  - (a) Sí, sin rangos que sugiera BE. **Recomendada:** habilitan las bandas de C.
  - (b) Todavía no.

  Los rangos por día tipo y por comida que se pidieron el 9/10 van en otro paquete.
- **B-D4 · ¿Se avanza sin revisor de nutrición, como en DL-100, o se lo espera?**

---

## C · Comparación de objetivo, plan e información registrada

**1. Qué existe**
- **API-PRJ-01** trae lo registrado por día y semana, con:
  - cobertura;
  - subtotales;
  - desconocidos;
  - anulados aparte (`packages/domain/src/nutricion-del-analisis.ts`).
- **Lo previsto.** Solo vienen los escalones de energía (`apps/api/src/analisis/lectura-proyecciones.ts:68-79`), y el website los usa solo para las calorías (`apps/web/src/app/pro/advisees/seguimiento/series.ts:41-45, 122`).
- **El lienzo** (`seguimiento/lienzo.tsx:1-30`) ya resuelve:
  - hasta tres métricas en paneles sincronizados;
  - superponer solo con la misma unidad;
  - lo registrado con línea continua y lo planificado con discontinua;
  - huecos que cortan la línea;
  - bandas de vigencia del plan.
- **El contraste** compara cada comida y cada serie con la versión del plan que la indicaba (`seguimiento/contraste.tsx:1-14`).
- **La regla de las alternativas** ya está escrita: no se suman (`nutricion-del-analisis.ts:259-260`).

**2. Qué falta**
- Los macros del objetivo.
- Lo indicado en el plan.
- Los objetivos por serie, dibujados.
- Qué objetivo y qué plan rigieron en cada fecha.

**3. Cambio mínimo completo (sin APK)**
- **Tres capas con nombre**, que se distinguen por el trazo y la forma, no solo por el color:
  - «Objetivo del profesional», con línea discontinua;
  - «Indicado en el plan», con rombos huecos;
  - «Registrado», con línea continua y puntos.
- **El objetivo.** PRJ-01 suma los escalones de los macros en g/día (propuesto: `prescribed.objectiveSteps`, un campo aditivo).
  - Si el macro está expresado como parte de la energía, se dice en texto, sin línea.
  - BE no hace esa conversión.
- **Lo indicado** (propuesto: `prescribed.planned`), calculado con la instantánea de la versión que rigió ese día:
  - por comida registrada, lo indicado de la opción que se eligió, frente a lo registrado;
  - por día, solo si se conoce el día tipo y cada comida tiene una sola opción;
  - si no se puede, se dice: «Esta comida tiene 3 opciones: no hay un indicado del día».
- **Entrenamiento.** El objetivo de cada serie va con línea discontinua, y el rango de repeticiones del profesional, como banda. La carga, las repeticiones y el RIR, cada uno en su panel. PRJ-01 suma esos objetivos como datos; hoy son solo texto en el detalle (`entrenamiento-del-analisis.ts:42-61`).
- **Cada fecha dice qué rigió.** Por ejemplo, «Plan v2 (desde el 3 oct) · objetivo v3». Si coexisten dos objetivos (hallazgo 6), también lo dice.
- **Bandas:** solo con intervalos que haya escrito el profesional.
- **La lectura de cada valor dice:**
  - la cobertura («3 de 4 comidas, 2 con cantidades»);
  - si es un subtotal;
  - la clase del dato.
- **Junto a un hito:** «Coincide en el tiempo: no indica que uno cause el otro».

**4. Dependencias**
- Ninguna para lo cuantitativo.
- B, para lo conductual y para las bandas de macros.

**5. Contratos y pantallas**
- **PRJ-01:** solo campos aditivos, que lee el profesional.
- **Website:**
  - Analizar: el lienzo, la lectura, la tabla y la exportación;
  - el contraste;
  - «Cómo se lee» (`como-se-lee.tsx:42`).

**6. Compatibilidad**
- Ninguna APK lee PRJ-01.
- Una pestaña abierta antes del despliegue puede ver «respuesta no reconocida» hasta recargar.

**7. Criterio de aceptación**
- **Dominio:**
  - con tres opciones sin elegir, el día no tiene indicado;
  - con una sola opción por comida, sí;
  - una prueba confirma que nada suma alternativas;
  - un registro sin cantidades no aporta números.
- **Integración:**
  - los escalones de los macros llevan sus fechas;
  - lo indicado no cambia aunque después cambie el plan.
- **Navegador:**
  - las tres capas;
  - un hueco no se une;
  - la leyenda se lee en escala de grises.
- **TEST-PRJ-009:** sin `score` ni `adherence`.

**8. Decisiones para Dirección**
- **C-D1 · El modo de comparar.**
  - (a) Por comida registrada, y el día cuando la regla lo permite. **Recomendado.**
  - (b) Un mínimo y un máximo posibles del día, armados con las opciones. Parece un rango normativo.
  - (c) Solo el objetivo.
- **C-D2 · El nombre.** «Indicado en el plan», distinto de «Objetivo». **Recomendado.**

---

## D · Qué cambió y por qué

**1. Qué existe**
- **Las versiones activadas** son inmutables y tienen instantánea.
- **Una versión nueva conserva los ids de los nodos.** Pasa con «Nueva versión del plan» y con las revisiones AJUSTAR o SUSTITUIR (`packages/domain/src/nutricion.ts:148-151`; `apps/api/src/nutricion/revisiones.service.ts:378`). Así, cada día tipo, comida, opción, ítem, bloque, sesión y prescripción sigue siendo el mismo elemento.
- **El diálogo de activar** dice qué entra, no qué cambia (`editor-del-plan-de-nutricion.ts:198-221`; `nutrition/editor.tsx:753-788`).
- **La revisión** guarda la evidencia, la decisión y la próxima revisión, y anota la versión que crea (`application.createdPlanId`). La persona la lee en REV-A.

**2. Qué falta**
- Comparar elemento por elemento, incluidos los casos del hallazgo 4.
- Una explicación para la persona.
- Un lugar donde la persona la lea.

**3. Cambio mínimo completo**
- **En el dominio**, `diferenciasEntreVersiones` (propuesto). Compara por id la versión anterior con la nueva y da altas, bajas y cambios con su ruta. Por ejemplo: «Almuerzo › Opción 2 › Arroz: 125 → 150 g».
- **Tres casos tienen su propio texto:**
  - cambió la versión de la receta;
  - el catálogo cambió el nombre;
  - la versión no tiene ids en común con la anterior: se dan solo los conteos.
- **Al activar**, el diálogo muestra «Qué cambia respecto de la versión N».
  - Si la versión vino de una revisión, suma una línea como «Viene de la revisión del 12 oct: Ajustar · 14 registros citados · próxima, 26 oct».
  - Si no vino de una revisión, lo dice, y no obliga a registrarla.
- **En el historial**, «Comparar con la anterior», con lecturas que ya existen. La API no cambia.
- **Una explicación para la persona** (propuesta), opcional y de hasta 1.000 caracteres. Se escribe en el borrador y queda congelada al activar.
- **La persona la lee en la APK nueva** (propuesto), en `GET /me/{área}/plans/{planId}/changes`. El aviso `PLAN_ACTIVATED` abre esa pantalla.

**4. Dependencias**
- La parte del website, ninguna.
- La de la persona, la próxima APK.
- La función se comparte con F.

**5. Contratos y pantallas**
- **NUT-10 y TRN-10:** suman la explicación.
- **Dos lecturas nuevas** para la persona.
- **NUT-09 y TRN-09:** sin cambios.
- **Pantallas:** el diálogo de activar y el historial, en el website; «Qué cambió», en la APK.

**6. Compatibilidad**
- Nada de lo que leen las APK instaladas cambia.
- Una versión vieja dice «Tu profesional no dejó una explicación».

**7. Criterio de aceptación**
- **Dominio:** cada tipo de cambio y los tres casos especiales, sin porcentajes.
- **Integración:**
  - la explicación no cambia después de activar;
  - la lectura de la persona exige el A3 y pasa por el PDP.
- **Navegador y teléfono:**
  - activar muestra los cambios;
  - el aviso abre «Qué cambió».

**8. Decisiones para Dirección**
- **D-D1 · ¿Qué ve la persona?**
  - (a) Los cambios y la explicación. **Recomendada.**
  - (b) Solo la explicación.
- **D-D2 · ¿La explicación es obligatoria?**
  - (a) No, opcional. **Recomendada.**
  - (b) Sí: suma fricción e invita a escribir de relleno.

---

## E · Alternativas de entrenamiento aprobadas y contexto breve (PF-03)

**1. Qué existe**
- **La ejecución** guarda lo prescripto, lo realizado y si hubo sustitución (`packages/domain/src/contratos-entrenamiento.ts:618-672`).
- **Las APK candidatas** no permiten sustituir (hallazgo 1).
- **PF-03:**
  - PF03-D-4 está especificada: hasta 3 alternativas por prescripción.
  - PF03-D-8 está abierta: qué se indica para una alternativa.
- **Para el contexto antes de la revisión ya hay un camino sin contrato nuevo** (PF03-D-7 B):
  - la respuesta se cita en una evaluación;
  - la revisión cita esa evaluación como `EVALUATION`.

  Falta que el website ofrezca `EVALUATION` como evidencia (`apps/web/src/app/pro/advisees/evidencia.ts:9`).

**2. Qué falta**
- La relación entre la prescripción y sus alternativas.
- Poder elegir una alternativa en la APK.
- La marca «Alternativa aprobada».
- El pedido de contexto antes de la revisión.

**3. Cambio mínimo completo**
- **En el plan, `approvedAlternatives`.** Lo reciben TRN-07 y 10, que usa solo el website.
  - Hasta 3 por prescripción, cada una con su ejercicio, la condición de uso y un texto de indicaciones.
  - Se validan y se congelan como el ejercicio prescripto.
  - **No heredan carga, %RM ni RIR.**
- **En la APK nueva vuelve «Cambiar este ejercicio».**
  - Primero ofrece las alternativas aprobadas; después, «Buscar otro».
  - La carga arranca vacía.
  - Se registra con el contrato de hoy.
- **Una lectura nueva (propuesta):** `GET /me/training/occurrences/{id}/alternatives`. SER-02 no cambia.
- **La marca se deduce, no se guarda.** Por ejemplo: «Indicado: Sentadilla · Realizado: Prensa (alternativa aprobada)». Ni la alternativa ni la sustitución libre se marcan como error.
- **El contexto se configura como en A.**
  - La corrida programada de DL-133 crea una solicitud por cada próxima revisión.
  - El website suma `EVALUATION`.
  - No se agrega ningún registro diario.

**4. Dependencias**
- PF03-D-4 y D-8, con DEC-02.
- La idea A.
- Una plantilla de revisión aprobada.
- Una APK nueva.

**5. Contratos y pantallas**
- **Cambian:**
  - TRN-07 y TRN-10: lo que reciben;
  - TRN-11 y TRN-12: dos códigos nuevos, para una alternativa repetida y para una igual al ejercicio prescripto;
  - SER-01: un agregado aditivo.
- **Nueva:** la lectura de alternativas.
- **Sin cambios:** TRN-09, TRN-14, TRN-19 y SER-02.
- **Pantallas:** el editor, Ejecuciones y la evidencia, en el website; la sesión enfocada, en la APK.

**6. Compatibilidad**
- Un plan con alternativas abre igual en todas las APK.
- Las APK viejas no muestran nada equivocado, así que no hace falta bloquear la activación.

**7. Criterio de aceptación**
- **Integración:**
  - C01 pasa con las dos APK;
  - una alternativa registrada lleva su marca;
  - la sustitución libre sigue aceptada.
- **Dominio:** nada copia la carga, el %RM ni el RIR a una alternativa.
- **Teléfono:** cambiar a una alternativa sin carga precargada, y volver al ejercicio prescripto.

**8. Decisiones para Dirección**
- **E-D1 · Qué se indica para una alternativa (PF03-D-8):**
  - (i) Hereda lo indicado del ejercicio prescripto. Descartada: supone equivalencia.
  - (ii) Su propia prescripción.
  - (iii) El ejercicio, la condición y un texto. **Recomendada para empezar.**
- **E-D2 · ¿Se devuelve ya la sustitución libre a la APK?** **Recomendado:** se perdió frente a la 0.13.2 sin que nadie lo decidiera.
- **E-D3 · ¿El contexto antes de la revisión se pide solo?**
  - (a) Automático, configurable y apagado por defecto. **Recomendado.**
  - (b) Solo a mano.

---

## F · Biblioteca común de comidas de BE

**1. Qué existe**
- **Las recetas propias** (DL-119, API-REC-01 a 07) tienen versiones inmutables, con ingredientes, porciones, pasos y cálculo (`prisma/schema.prisma:2703-2747`).
- **La imagen** es un medio privado con procedencia y autoría (DL-120).
- **Un plan solo usa recetas propias.** La imagen la leen el profesional y la persona que tiene ese plan (`apps/api/src/medios/medios.service.ts:380-404`).
- **El catálogo base es el precedente** (DL-141): origen `SIEMBRA_DE_BE`, migraciones revisadas en el PR y versiones que solo se agregan.
- **Las 16 recetas son privadas** (hallazgo 7).

**2. Qué falta**
- Un origen «BE».
- Revisar y publicar.
- Copiar al espacio propio.
- Avisar de versiones nuevas sin pisar lo adaptado.

**3. Cambio mínimo completo (sin APK)**
- **Tablas aparte** (propuestas): `receta_de_biblioteca` y `version_de_receta_de_biblioteca`.
  - Cada receta tiene un estado (`PUBLICADA` o `RETIRADA`) y su revisión.
  - La foto va con la finalidad `LIBRARY_RECIPE_REFERENCE`.
  - Así no cambian las consultas de recetas propias ni de imágenes.
- **Publicar.** Con una migración generada desde un manifiesto revisado en el PR. Corregir es una versión nueva; retirar no borra nada.
- **Leer.** «Biblioteca de BE», en Recetas, para los profesionales de Nutrición. Cada receta dice «Receta de BE · revisada por…».
- **Copiar** (propuesto: API-REC-08). Crea una receta propia:
  - con los mismos ingredientes y las mismas versiones del catálogo;
  - con el cálculo rehecho por la API;
  - con su foto como medio propio;
  - con el origen de la copia: qué receta y qué versión.
- **Versiones nuevas.** El aviso dice «Hay una versión nueva de BE», con las diferencias (la función de D). «Copiar los cambios» nunca es automático.
- **Agregar al plan.** Copia la receta y lo dice: «Se guarda una copia en Mis recetas».
- **Las recetas de Sofía siguen siendo suyas.** La biblioteca se siembra desde el mismo manifiesto.

**4. Dependencias**
- Un revisor de nutrición, o el rótulo «demostración» (como en DL-100).
- El manifiesto del bloque 4.
- La función de D.
- DL-141 D-1.g.

**5. Contratos y pantallas**
- **Nuevas (propuestas):**
  - REC-08;
  - `GET /nutrition/recipe-library` y su detalle.
- **Cambia:** MED-03 suma la regla de lectura de la finalidad nueva.
- **No cambian:** REC-01 a REC-07, NUT-07, NUT-10 ni ING-01.
- **Pantallas:** solo el website.

**6. Compatibilidad**
- La APK ve una copia como cualquier receta propia.
- Ninguna receta privada pasa a la biblioteca.

**7. Criterio de aceptación**
- **Integración:**
  - la biblioteca la ven solo los profesionales de Nutrición;
  - la copia es independiente;
  - una versión nueva o un retiro no cambian copias ni planes.
- **Contenido:** el cálculo coincide con uno independiente.
- **Navegador:** copiar, adaptar y usar en un plan.

**8. Decisiones para Dirección**
- **F-D1 · ¿Copiar o usar la de BE?**
  - (a) Copiar, con aviso de las versiones nuevas. **Recomendada.**
  - (b) Usarla directamente: el plan dependería de algo que BE puede cambiar.
- **F-D2 · ¿Qué pasa con la foto?**
  - (a) Se copia. **Recomendada:** sirve la regla de lectura de hoy.
  - (b) Se comparte: pide otra regla, y un retiro alcanza a todas las copias.
- **F-D3 · ¿Profesionales que proponen recetas?**
  - (a) Todavía no. **Recomendada.**
  - (b) Sí: necesita un rol de revisión que no existe.
- **F-D4 · ¿Se muestra quién la revisó?** Es la decisión de DL-141 D-1.g.

---

## Orden sugerido

1. **C.** Es lo que más ayuda a revisar, y no necesita datos nuevos ni APK.
2. **D en el website.** Es una función y dos pantallas, y protege el acto más delicado: activar.
3. **A.** Apenas se decida DL-144. Funciona con las APK instaladas.
4. **F.** No necesita APK, y aprovecha el manifiesto y la función de D.
5. **B, la lectura de D para la persona, y E**, juntas y con una APK nueva:
   - comparten la APK, la capacidad y las pruebas C01;
   - antes, conviene resolver E-D2.
