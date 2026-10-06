# BE · Cierre de Nutrición y Entrenamiento por serie

Encargo del 6 de octubre de 2026 · Dirección: Elian Bufi · Entrega prevista: 20/10/2026.

## Encargo, autonomía y resultado

Continuá el proyecto de BE de forma autónoma. Primero cerrá los pendientes concretos de Nutrición que sean necesarios para continuar; después implementá el flujo de Entrenamiento descrito aquí de punta a punta: profesional configura el plan y los objetivos de cada serie, carga recursos de ejercicios, asesorado entrena y registra, profesional consulta lo planificado frente a lo realizado y los tiempos con su grado de certeza.

La dirección visual está elegida. La variante compacta de registrar series, con los ajustes de este documento, es la seleccionada. No vuelvas a pedir aprobación de esa elección. Tomá las decisiones reversibles de implementación, registralas y seguí. No te detengas después del relevamiento, de una pantalla o de una lista de tareas. Dejá código, pruebas, evidencia y documentación revisables. Trabajá hasta completar el alcance o identificar un bloqueo externo real; no prolongues el trabajo artificialmente para llenar horas.

Este encargo autoriza desarrollo, migraciones aditivas en bases locales de prueba, pruebas reversibles, commits, push y PR en borrador. No autoriza merge, push directo a main, despliegue, modificación de bases remotas, publicación de APK ni gasto externo. Un merge puede disparar despliegues. No vuelvas a pedir permisos para lo ya autorizado; si falta acceso, servicio o una decisión verdaderamente irreversible, completá todo lo independiente y dejá el bloqueo concreto documentado.

## 1. Insumos, precedencia y base real

Leé las instrucciones del repositorio y los contratos aplicables. Este texto y los JSON del paquete definen el comportamiento; las imágenes son referencias de composición, no especificaciones de contratos ni evidencia de funcionamiento. Leé también `DECISIONES_Y_TIEMPOS.md`, `REFERENCIAS_VISUALES.md`, `ESTADO_REVISADO.md`, `ejercicios/CATALOGO.json` y `datos/`.

La referencia principal es `referencias/01_series_y_descanso_actualizado.png`. Sustituye la comparación con el entrenamiento anterior, las otras tarjetas de ejercicios en la vista compacta y el botón +15 s. Las otras referencias son de apoyo y tienen excepciones explícitas en el índice. Nunca extraigas datos o lógica desde los píxeles.

Consultá el estado remoto y el árbol local antes de elegir la base. La lectura preparatoria encontró #147 en borrador, rama `wp-nutricion-recetas`, head `de37f62a7ed5b2941e43dabbbcf8ce338a52bff7`, basado en `apk/navegacion`; #146 seguía en borrador en `9021c47c1b9a2fe6f28774245e4e95db97e55588`. Son referencias de la lectura, no órdenes de reset ni sustitutos de comprobar el estado actual. Preservá trabajo ajeno.

Preferí una rama de Entrenamiento basada en el head vigente de Nutrición después de los cierres necesarios. Dejá un PR apilado con base en la rama de Nutrición si sigue sin integrar, para revisar solamente el delta. Documentá la dependencia y el futuro cambio de base. No mezcles el paquete entero en #146 ni reescribas historia ajena.

Hay capacidades existentes que debés reutilizar: rangos de repeticiones por serie, RIR realizado por serie, borradores de ejecución, registro definitivo, versiones de ejercicios, snapshots de plan, correcciones y permisos. En la revisión preparatoria, intensidad y carga sugerida eran de la prescripción completa; el descanso por serie y la medición temporal estructurada requerían un delta. Verificá esto contra el head actual.

No agregues campos a respuestas antiguas que las APK validan estrictamente. Registrá el mínimo delta aditivo/versionado para objetivos por serie, medios de ejercicios y tiempos; conservá endpoints y forma de los contratos antiguos. No flexibilices globalmente validaciones estrictas para esquivar incompatibilidades. Respetá archivos canónicos y manifiestos protegidos del legajo y el procedimiento de deltas del proyecto.

## 2. Cerrar lo necesario de Nutrición sin rehacerlo

Usá el informe de #147 y su evidencia como punto de partida. Sus 78 controles son resultados reportados por el trabajo anterior; no los inventes de nuevo ni los presentes como pruebas Android. Revisá la CI del head vigente. Repetí pruebas únicamente si un cambio o riesgo concreto lo requiere.

Decisiones operativas para este desarrollo:

- **Almacenamiento:** conservar PostgreSQL y `AlmacenDeMedios` para la demostración, sin contratar S3. Documentar límites, respaldo, retención, borrado autorizado y cómo sustituir el proveedor. El reinicio local demostrado no prueba disponibilidad, respaldo ni persistencia en el despliegue remoto. Verificar el vencimiento de la base de prueba antes de la entrega; si necesita una decisión de servicio, dejarla como bloqueo remoto independiente, sin recrear ni pagar nada.
- **Comida diferente:** mantener una entrada efectiva por comida y fecha según el modelo implementado, con contexto explícito. Haber registrado otra comida no significa haber seguido la opción prescrita. En el contraste conservarla fuera de prescripción y aclarar ambos hechos, por ejemplo: «Sin opción del plan registrada» y «Comida diferente registrada». No mostrar solamente «Sin registro» donde eso resulte engañoso. No alterar consumos históricos para hacer coincidir una etiqueta.
- **Auditoría:** continuar con la clasificación `EVIDENCIA_VISUAL` de DL-120 para el acceso a medios si conserva los controles de acceso, finalidad, trazabilidad y auditoría exigidos. No crear ficticiamente un acto registrable ni una aceptación de consentimiento. Si el contrato canónico exige un consentimiento o aprobación normativa que no existe, aislar ese pendiente y explicarlo; no eludirlo ni detener por ello el trabajo independiente de Entrenamiento.
- **Seguridad:** comprobar el hallazgo de `source-map-js` reportado y su arreglo en el lockfile. Llevar el cambio mínimo a la rama de #146 si todavía lo necesita y preparar un PR separado de seguridad contra main. No copiar todo `c618508`, que incluye otros cambios; no integrar ni desplegar. Ejecutar la verificación pertinente y documentar si la advertencia ya cambió. No agregar excepciones de auditoría para evitar arreglarla.

Actualizá los estados de DL-119/120/121 con precisión: implementado, probado localmente, pendiente remoto/Android, según corresponda. No declares integración ni aceptación global. No bloquees este encargo por la falta de autorización de una nueva APK: la construcción/publicación queda para el procedimiento posterior.

## 3. Profesional: objetivos y recursos reales por serie

En el editor del plan, cada serie puede tener repeticiones exactas o un rango, RIR objetivo, carga sugerida con unidad y descanso recomendado. Habilitá valores distintos en cada fila. Ejemplo sintético de sentadilla goblet:

| Serie | Repeticiones | Carga sugerida | RIR objetivo | Descanso posterior |
|---|---|---|---|---|
| 1 | 12–16 | 16 kg | 3 | 90 s |
| 2 | 10–12 | 18 kg | 2 | 120 s |
| 3 | 8–10 | 20 kg | 1 | 150 s |

Estos valores prueban la interfaz; no son una recomendación de entrenamiento para una persona real. El editor debe facilitar que el entrenador complete los objetivos, pero permitir que un campo no esté prescrito cuando corresponda. Un dato ausente no significa cero.

Si se conserva un valor general heredable, hacer inequívoco qué se hereda y qué se sobrescribe por serie. Diferenciar ausencia de sobrescritura de una eliminación explícita; definirlo en contrato y probarlo. La vista previa profesional y el móvil deben resolver el mismo objetivo efectivo. Los clientes antiguos siguen interpretando su prescripción anterior sin reinterpretaciones silenciosas. No parsear notas libres para inventar descansos o intensidades.

Mantener los criterios de intensidad existentes. RIR objetivo es un criterio de intensidad; carga sugerida es un complemento informativo, no un tercer criterio. Si el plan usa porcentaje de RM, conservar su semántica y su referencia; no convertirlo automáticamente a kilos, RIR o RPE. RIR informado por el asesorado sigue siendo un dato diferente. Respetar límites reales del contrato; no reducir arbitrariamente RIR a 0–5 ni convertirlo a RPE.

El profesional autorizado carga, previsualiza, guarda, sustituye y retira la imagen de un ejercicio mediante un flujo real. Usar las tres imágenes de `ejercicios/` como contenido de demostración subido por ese flujo, asociado a identidad y versión explícitas del catálogo. No basta importarlas como constantes dentro de una maqueta. No resolver ejercicios por coincidencia aproximada de nombres.

Reutilizar la infraestructura de medios de Nutrición adaptando finalidad, permisos, validación, persistencia y acceso para recursos didácticos. No usar el permiso o propósito «foto privada de comida» como atajo. Conservar origen IA, autoría declarada, licencia/procedencia y estado de revisión técnica mediante el modelo o metadatos versionados compatibles. No inventar una licencia de terceros. Si el catálogo exige licencia normalizada, registrar honestamente el origen aportado para la demo mediante el delta permitido; no atribuirle CC0 sin fundamento.

Las imágenes incluidas sirven para reconocer ejercicios y probar medios, no acreditan técnica certificada. El profesional puede revisarlas y sustituirlas; los textos de técnica de la demo son borradores. Un video solo aparece si hay un recurso de video real y soportado; no convertir un PNG en una supuesta demostración reproducible.

## 4. Entrada, plan y sesión enfocada

Mantener los cinco destinos reales de BE y la navegación existente. Dentro de Entrenamiento: Hoy, Plan e Historial, con sus datos reales. Fecha civil del usuario; una sesión seleccionada no debe presentarse como asignada a un día si el modelo no contiene esa asignación. El calendario semanal de una referencia es ilustrativo: si no hay agenda real, mostrar las sesiones y el orden del plan. No inventar días de descanso por huecos de calendario.

Hoy permite revisar la sesión y sus ejercicios y empezar explícitamente con «Iniciar entrenamiento». Si hay una sesión en curso, ofrecer «Continuar entrenamiento», no crear otra. Plan muestra objetivos de la versión asignada. Historial distingue borradores, registros definitivos y rectificaciones según contrato.

Durante el entrenamiento, una vista enfocada muestra solamente el ejercicio activo, su imagen algo mayor, «Ver técnica», el cronómetro discreto de sesión y la tabla compacta de series. «Ver rutina» permite consultar o elegir otro ejercicio mediante una acción explícita. No mantener las tarjetas de todos los ejercicios debajo de la tabla. Ver la técnica de otro ejercicio no cambia por sí solo el ejercicio que se está cronometrando.

Imagen aproximadamente de 100–140 dp de alto, adaptable: suficientemente clara para identificar el ejercicio sin desplazar los campos fuera de alcance. Sin foto o con fallo de descarga, usar un icono de respaldo del sistema existente y mantener nombre, objetivos y registro utilizables. No asignar automáticamente una imagen de otro ejercicio.

## 5. Registrar series: previsto y realizado separados

Tabla compacta: Serie, Carga con unidad, Repeticiones, RIR. La fila activa se identifica también con texto/estado, no solo color. Con letra grande pasa a tarjetas apiladas por serie conservando orden y acciones.

Los campos vacíos muestran en gris accesible los objetivos de ESA serie: «12–16», «10–12», «8–10», RIR y carga si están definidos. Son placeholders, nunca valores del formulario, nunca números enviados al registrar. Si no hay objetivo, usar «Sin objetivo» en la referencia persistente y un campo vacío; no inventarlo. Mantener una banda «Plan de la serie N» con los objetivos visibles incluso después de escribir, porque el placeholder desaparece. La comparación principal es contra lo planificado, no contra la serie anterior.

El RIR realizado es opcional en cada serie. Ayuda: «Cuántas repeticiones más creés que podrías haber hecho manteniendo la técnica». Ejemplo breve: «RIR 2: creés que te quedaban 2 repeticiones». No exigirlo para guardar repeticiones/carga. Vacío significa no informado; RIR 0 es un valor válido y explícito. Respetar el dominio vigente, incluido decimal si está admitido. No calcular RIR desde carga, repeticiones, tiempo o una fórmula RPE.

Mostrar carga con significado claro: en goblet es la única mancuerna; en rumano con dos mancuernas, indicar si es por mancuerna. La ficha de demo fija esa base para que no haya doble conteo. En ejercicios sin carga externa, diferenciar 0 kg informado, sin carga prescrita y carga no informada. Conservar unidades; no comparar kilos y libras sin conversión explícita del dominio.

«Registrar serie N» guarda únicamente datos informados de esa fila. Si todos están vacíos, no registrar los placeholders al pulsar: pedir al menos un dato o una confirmación explícita «Realizada sin detalle», únicamente si la semántica del dominio permite representar ese hecho. Si no lo permite, mantener la serie sin dato y ofrecer la operación compatible; nunca fabricar una serie completa. Dejar constancia de la decisión. Una serie sin datos no es automáticamente una serie omitida ni incumplida.

Reutilizar el borrador de ejecución durante la sesión. «Serie guardada en esta sesión» no debe confundirse con la confirmación definitiva de toda la ejecución. Guardado local pendiente, sincronizado y error recuperable son estados distintos. La finalización usa el comando canónico, snapshot de plan y autoría; las correcciones posteriores usan las operaciones auditables, sin sobrescribir la historia.

No adelantar automáticamente de ejercicio por haber editado una fila. Mantener datos y foco al ir a técnica y volver. Doble toque y reintento deben producir una sola operación efectiva. Resolver conflictos de versión sin sobreescribir cambios silenciosamente.

## 6. Descanso y cronómetros útiles, sin inventar actividad

La sesión comienza con «Iniciar entrenamiento» y termina con una acción explícita. Cronómetro discreto y accesible; poder pausar y reanudar. Mostrar tiempo transcurrido total y, en el resumen/profesional, pausas explícitas y tiempo sin esas pausas. «Tiempo activo» significa tiempo de sesión sin pausas declaradas, no tiempo haciendo esfuerzo físico.

Registrar intervalos asociados al ejercicio activo por acciones de entrenamiento. Una visita a Plan, Historial o Técnica no reasigna actividad. Una sesión puede volver al mismo ejercicio: acumular intervalos sin duplicar ni perder la identidad de prescripción/versión. El tiempo asociado incluye descansos y carga de datos mientras ese ejercicio estaba activo; no presentarlo como tiempo de contracción muscular.

Descanso: «Iniciar descanso» y «Finalizar descanso». Cerca del temporizador, «Recomendado tras la serie N: 01:30» con el valor correcto de esa serie. Cronómetro ascendente, no +15 s. Llegar al objetivo no termina el descanso automáticamente. Permitir finalizar antes o después, sin castigos visuales. Guardar objetivo histórico, inicio, fin, tiempo medido y origen de cada evento. Mostrar al profesional «01:45 registrado · 01:30 recomendado · +00:15» de manera neutral; no concluir que respetó físicamente el descanso solo porque corrió un reloj.

Guardar una serie no inicia su descanso automáticamente. Iniciar descanso no marca la serie como realizada. Se puede completar la carga de datos de una serie durante su descanso. Seleccionar la fila siguiente no debe cambiar la referencia del descanso en curso: queda ligado a la serie que lo originó. Si no hay objetivo, decir «Descanso sin duración indicada» y permitir medir.

**Tiempo de serie:** con registro al final solamente NO puede saberse cuándo empezó. Ofrecer una acción secundaria «Cronometrar serie», opcional, que abre inicio/fin claros y no estorba al registro rápido. Solo un par válido inicio/fin produce «Duración medida de la serie». Sin esos eventos, duración desconocida. El intervalo entre dos registros puede guardarse como intervalo de interacción si es necesario, pero nunca llamarse tiempo de la serie ni tiempo de descanso. No agregar un botón obligatorio a todos para simular un seguimiento silencioso.

Evitar intervalos incompatibles: una sola sesión activa por alcance definido, un ejercicio activo, un descanso activo y una serie medida a la vez. Al intentar empezar una serie medida mientras corre un descanso, ofrecer terminar explícitamente el descanso y empezar la serie; la acción compuesta debe quedar auditable. Al pausar o finalizar la sesión con un intervalo abierto, resolverlo de manera visible: pausar/cerrar según la acción del usuario o marcar incompleto. Nunca inventar un fin fisiológico.

Explicar discretamente al iniciar por primera vez: «Guardamos los tiempos que marcás para que vos y tu entrenador puedan revisarlos». Ofrecer detalle de qué se mide y quién lo ve. «Silencioso» significa pocos pasos y poco ruido visual, no seguimiento oculto. No incorporar GPS, micrófono, análisis de cámara, sensores ni analítica comercial para medir esto. Aplicar finalidad, vínculos y permisos del producto.

Implementar eventos persistentes e idempotentes con identificadores, reloj monotónico para intervalos en el mismo proceso y timestamps para recuperación/sincronización. No depender de un setInterval decrementando un contador. La pantalla bloqueada o el segundo plano no deben reiniciar el reloj. Tras matar el proceso, cambios de reloj, huecos o conflictos entre dispositivos, recuperar el estado y etiquetar tiempos estimados/incompletos; no atribuir precisión de medición continua. Si se recupera un intervalo por reloj civil, distinguirlo de una duración medida fiable. No finalizar a la hora de reapertura como si se conociera el fin real.

No escribir en la API cada segundo. Persistir transiciones y checkpoints justificados. No trasladar duraciones a días civiles equivocados al cruzar medianoche. Las fixtures son un contrato de expectativas para este encargo; adaptar nombres al modelo existente sin cambiar su significado.

## 7. Vista profesional, cierre e historia

Completar el recorrido profesional: abrir una ejecución del asesorado vinculado y ver, por ejercicio y serie, objetivos históricos frente a carga, repeticiones y RIR informados. Mostrar tiempos de sesión, pausas, tiempo asociado al ejercicio, descansos y duraciones de series cuando están medidos. Distinguir medido, estimado, incompleto y no informado con texto.

No introducir puntuaciones de cumplimiento, volúmenes, equivalencias automáticas o recomendaciones de carga que el dominio no tenga. Estar por encima o debajo del rango no implica éxito o fracaso. Los campos faltantes no son ceros. No comparar contra una receta actual del plan si la ejecución corresponde a una versión anterior.

Antes de finalizar, resumen legible: qué se registró, qué quedó sin datos, duración y comentarios opcionales. Omitir una serie requiere el acto/semántica admitidos; no convertir ausencia de registro en omisión explícita. Enviar la condición de sesión que corresponda al comando y a lo declarado por la persona, no derivarla de cuántas filas hay.

Historial permite consultar y corregir mediante el flujo vigente. Una modificación posterior del plan, ejercicio o imagen no reescribe el sentido de ejecuciones anteriores. Si un medio ya no está disponible, conservar la identidad histórica y un respaldo, sin mostrar silenciosamente una variante técnica diferente.

## 8. Reconexión, carga y acabado visual

Revisar si #147 ya resolvió la pantalla de recuperación de sesión. Si falta, reemplazar los cuadros vacíos por la composición de `referencias/02_carga_y_reintento.png`: identidad real de BE, estado «Comprobando tu sesión» y espera indeterminada. Después de un umbral documentado, mostrar demora y reintento. Sin porcentajes ficticios ni mensajes de éxito antes de confirmar.

Distinguir sin conexión, timeout, servicio no disponible y autenticación realmente inválida. Un fallo de red no elimina credenciales ni fuerza logout. Coordinar reintentos sin bucles infinitos, solicitudes paralelas duplicadas o respuestas viejas que pisan el estado nuevo. Reutilizar la política de autenticación del proyecto para invalidación real. Mostrar contenido protegido solo cuando corresponda; conservar borradores con aislamiento por cuenta y no exponerlos al cambiar de usuario.

Si la sesión vuelve, restaurar el ejercicio, fila, datos y estado de sincronización. El cronómetro mide tiempo según sus eventos; no se reinicia por render o consulta fallida. Guardado local no equivale a guardado remoto y el texto debe decirlo.

Conservar azul noche y tema claro, componentes, logo e iconos reales. Corregir el brillo rectangular interno que Elian señaló: superficie estable y mate o gradiente suave que cubra todo el contenedor y siga sus bordes, sin una segunda tarjeta luminosa recortada. Sin otra revisión de la arquitectura de antropometría.

Accesibilidad: objetivos legibles, etiquetas persistentes además de placeholders, controles táctiles suficientes, lector de pantalla con serie/unidad/objetivo, foco correcto, teclado decimal para carga/RIR si corresponde e integer para repeticiones. No anunciar el cronómetro cada segundo a TalkBack. Reducir movimiento según preferencias. La barra inferior y el teclado no deben ocultar acciones o el último contenido; la sesión enfocada puede seguir el patrón sin barra de la referencia conservando salida y retorno seguros.

## 9. Datos, pruebas y evidencia real

Ejecutá primero `python verificar_paquete.py`. Verifica integridad, datos y aritmética del paquete sin red; **no prueba BE**. Crear datos sintéticos mediante los flujos/API autorizados y conservar identidades devueltas, nunca pegar IDs ficticios del paquete en producción. No usar datos personales ni credenciales en capturas, logs o Git.

La demo mínima atraviesa: profesional crea/revisa tres ejercicios y carga PNG → configura una sesión de tres ejercicios y objetivos por serie → asigna/publica la versión según dominio → móvil autorizado recibe exactamente esos objetivos e imágenes → inicia sesión de entrenamiento → registra series y RIR → mide descansos/una serie → finaliza → profesional consulta los resultados persistidos.

Usar `datos/sesion_demo.json`, `datos/casos_series.json`, `datos/casos_tiempos.json` y `ACEPTACION.csv`. Probar como mínimo:

1. Rangos 12–16 / 10–12 / 8–10, RIR/carga/descansos distintos; objetivo ausente y herencia/sobrescritura si se usa.
2. Placeholders nunca enviados. Actual distinto del objetivo. RIR vacío, 0 y decimal admitido; carga cero explícita; datos parciales. Plan por porcentaje de RM conserva su interpretación.
3. Mismo ejercicio/serie y snapshot al volver de técnica. Imagen visible después de recargar/reiniciar el servicio. Sin imagen, imagen inválida y descarga fallida. Permisos entre profesionales/asesorados.
4. Descanso 90 s frente a 90 s; 135 s frente a 120 s; no medido; sin objetivo; cerrar antes; sobrepasar; evitar doble inicio/fin. No inferir descanso del tiempo entre registros.
5. Sesión total 900 s, pausa 120 s, sin pausas 780 s; tiempos de ejercicio 440/330 s y 10 s sin ejercicio asignado en la fixture. No sumar descansos encima del total, porque están incluidos.
6. Serie explícitamente cronometrada y serie sin inicio. Bloqueo de pantalla, segundo plano, proceso cerrado, cambio del reloj, doble evento, sincronización repetida, eventos tardíos, cierre con intervalo abierto y conflicto entre dispositivos.
7. Guardar borrador, perder respuesta y reintentar sin duplicar; confirmar ejecución una sola vez. Desconexión no cierra la sesión de acceso. Recuperación del borrador con aislamiento de cuenta.
8. Profesional ve datos históricos y estados de certeza. Cambiar plan o recurso no cambia registros anteriores. Rectificar conserva trazabilidad.
9. Regresión de Nutrición, sesión, navegación, fecha civil y contratos estrictos de las APK anteriores. No presentar un endpoint nuevo como disponible en una API remota no desplegada.
10. Visual: 360/390/412 dp, claro/azul noche y letra ×1/×1,3/×2. Probar tabla o tarjetas, teclado, safe areas, textos largos y estados vacíos/errores. Contraste de objetivos medido en componentes, no supuesto a partir del PNG.

En Android validar cronómetros al bloquear y reabrir, pausa/reanudación, muerte del proceso, teclado, TalkBack, navegación y persistencia. Si no hay dispositivo o APK nueva disponible, dejar esos casos como pendientes Android y demostrar lo verificable con componentes reales y API local. No sustituirlos por renders del navegador ni afirmar que un temporizador web demuestra comportamiento nativo.

Probar el reloj con un reloj inyectable para los casos temporales, sin esperas reales de 15 minutos. Si aparece una falla intermitente, investigar/registrar condiciones; no borrar el resultado fallido ni obtener verde a fuerza de repeticiones ciegas.

## 10. Ejecución con pocos recursos y entrega

Usá un árbol aislado y una sola tarea pesada a la vez. No arranques Gradle ni construyas otra APK en este encargo. La base local detenida por falta de memoria puede reiniciarse si hace falta repetir un recorrido y se conserva su directorio; no recrear datos ni detener procesos ajenos. Los servidores que abras deben quedar identificados y apagarse al terminar, preservando lo que sea necesario para reanudar.

Dejá checkpoints en un archivo de reanudación: rama, commit, qué cambió, pruebas exactas, qué falta y cómo levantar tus servicios. Guardar después de cada hito lógico para sobrevivir a un corte de sesión o de memoria. Evitar logs enormes, consultas de CI continuas o procesos de espera huérfanos. Continuar por tareas independientes si un servicio remoto está bloqueado.

Antes del cierre, comprobar el diff, secretos, rutas personales, tamaño de imágenes y evidencia. No versionar APK, claves, bases, tokens ni fotos privadas. Conservar fuentes originales de recursos y variantes optimizadas con correspondencia documentada; no cargar los PNG grandes completos si el móvil necesita miniaturas. No prometer mejora de rendimiento sin medir.

Entrega final breve y verificable:

- Rama, commits, PR y estado real de sus controles.
- Recorrido profesional → plan → móvil → registro → consulta, con capturas de componentes reales y resultados persistidos.
- Qué quedó cerrado de Nutrición y dónde quedó el arreglo de seguridad.
- Qué tiempos están medidos y qué situaciones siguen incompletas/estimadas.
- Pruebas ejecutadas con resultados, distinguiendo local, remoto y Android.
- Límites y bloqueos reales, sin presentar una lista pendiente como implementación final.
- Pasos exactos para la próxima prueba en teléfono y preparación de la candidata futura, sin construir/publicar todavía.

No necesito supervisar decisiones reversibles mientras duermo. Resolvé, documentá y avanzá. Si un paso requiere una autorización fuera de este alcance, prepará todo para que la decisión posterior sea concreta y revisable; no dejes frenado el resto del trabajo.
