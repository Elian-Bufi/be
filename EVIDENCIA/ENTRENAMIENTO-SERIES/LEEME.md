# Evidencia de WP-ENTRENAMIENTO-SERIES

> **Encargos de Dirección del 2026-10-06:**
> - «BE · Cierre de Nutrición y Entrenamiento por serie», con el paquete `BE_Entrenamiento_Autonomo_2026-10-06`;
> - «BE · Cierre técnico antes de la próxima candidata» (el **precierre**): una pasada acotada de robustez y preparación,
>   sin funcionalidades nuevas de entrenamiento.
>
> La entrega prevista es el 2026-10-20.
> - Definición: [`docs/paquetes/WP-ENTRENAMIENTO-SERIES.md`](../../docs/paquetes/WP-ENTRENAMIENTO-SERIES.md).
> - Deudas: DL-122, DL-123 y DL-124, y DL-125 (EVIDENCIA_VISUAL, del precierre).
> - Rama `wp-entrenamiento-series`, PR #149 en borrador, apilado sobre `wp-nutricion-recetas` (#147).
>
> **Datos:** todos sintéticos.
> - Las cuentas son `@example.invalid`, creadas por la API pública en una base local.
> - Las tres imágenes de ejercicios son las del paquete de Dirección, generadas por IA.
> - Los números son los de `sesion_demo.json`.
> - No hay credenciales reales, sesiones ni fotos de personas. Las sesiones de la corrida quedaron en la carpeta de trabajo,
>   fuera del repositorio.

## Estado, en los cuatro planos

| Plano | Estado |
|---|---|
| **Implementado** | Sí. El paquete: `ffd42af` (definición y dominio), `ce4c1b1` (dominio), `033bfa1` (API), `65a7d6a` (website) y `e6bd769` (APK). El precierre: `7ea47fb` (dominio), `0edd9a6` (API), `b54cf74` (website), `98bf34b` (APK), `4812d6f` (respaldo, continuidad de test y plan de publicación), `0186110` (EVIDENCIA_VISUAL), `5144841` (seguridad de dependencias) y el commit de esta evidencia |
| **CI** | **En verde en `5144841`**, el último commit de código (corrida 37506943559): legajo, verificar (typecheck, unitarias, build y auditoría), la integración completa contra PostgreSQL 16 y la imagen de la API con `migrate deploy`. `4812d6f` falló solo en la auditoría, por dos avisos publicados ese día (sharp y shell-quote); `5144841` los corrige sin excepciones. Las corridas canceladas de `936eb44` y `4badaaa` fueron reemplazadas por la siguiente y no cuentan |
| **Publicado** | No. No se construyó ni se publicó una APK, ni hubo merge ni despliegue: los encargos los dejan fuera |
| **Verificado en el teléfono** | **No.** Lo que solo se puede verificar en Android está en «Casos de Android» y en «La próxima prueba en el teléfono» |

## El precierre, punto por punto

| § | Lo que se encontró | Reproducido | Corregido | Prueba |
|---|---|---|---|---|
| 1 | `persistir()` fallaba en silencio; un error de lectura valía como «no hay nada» y se pisaba lo guardado; «Guardada en el teléfono» aparecía antes de escribir | Sí, contra `58567ec`: el texto aparece con el teléfono vacío, y un error de lectura pisa el borrador (`resultados/07`) | `98bf34b`: cinco estados honestos, lo ilegible se aparta y se ofrece reintentar | `scripts/guardado-local.test.mjs` (16): escritura rechazada, lectura rechazada con datos, JSON inválido, reintento, cambio de cuenta durante la escritura y la lectura, cierre antes de terminar; el estado y el texto de la pantalla |
| 2 | Una APK que no muestra objetivos por serie recibía el plan y mostraba los valores generales como si fueran los de cada serie | Sí: las tres APK instaladas leen la forma vieja | `7ea47fb`, `0edd9a6` y `b54cf74`: no se activa ni se entrega a una app que no declare la capacidad; el editor explica por qué | Integración y recorrido (pasos 5, 7 y 8): la APK vieja recibe «no disponible»; la nueva, los objetivos exactos |
| 3 | El reloj del proceso no avanza con el teléfono dormido y cambia con cada proceso | Sí (límite declarado en DL-124) | `7ea47fb` y `98bf34b`: módulo nativo con `SystemClock.elapsedRealtime()`, la base en cada instante, sin mezclar bases | Recorrido con las dos bases y anclas propias (pasos 9 y 10); dominio; Kotlin compilado sin Gradle (`resultados/08`) |
| 4 | La sesión en curso, sin cifrar y dentro del respaldo de Android | Sí: `allowBackup` sin reglas | `98bf34b`: AES-256-GCM con la clave en el almacén seguro; borradores, eventos y credenciales fuera del respaldo y de la transferencia | `scripts/guardado-local.test.mjs`, `respaldo-de-android.test.cjs` (3) y el manifiesto introspectado |
| 5 | Imagen: sin imagen y descarga fallida se veían igual; una respuesta tardía podía reaparecer; la ilustración se recortaba. Reconexión: «Reintentar» superponía pedidos y 20 s no alcanzaban para la API dormida | Sí | `98bf34b`: una sola renovación y respaldo final; la respuesta tardía se descarta; la ilustración entera; un pedido a la vez, hasta 75 s | `imagen-de-medio.test.mjs` (7), `reconexion.test.mjs` (10), la reconexión con demoras reales (`resultados/12`) y el recorrido (paso 10) |
| 6 | EVIDENCIA_VISUAL sin texto ni acto; la base de `test` vence antes de la entrega; un respaldo no se restauraba de una vez | Sí (`resultados/09`, caso 1) | `0186110` (la propuesta, sin activar) y `4812d6f` (la migración que permite restaurar) | Integración `evidencia-visual` (10) y `contrato`; restauración en cuatro casos (`resultados/09` y `11`) |

Hallazgo fuera de los puntos, ya corregido: **dos avisos de seguridad publicados el 2026-10-06** (`sharp`, alto;
`shell-quote`, crítico) hacían fallar la auditoría de `main` y de toda rama. Están en `5144841` y, para `main`, en #148
(`d85caec`). Severidad: alta, porque bloqueaba cualquier integración.

## Cierre de Nutrición (primer encargo, §2)

- **Contraste de la comida diferente.** Dice los dos hechos, «Sin opción del plan registrada» y «Comida diferente
  registrada», sin falso cumplimiento. Está en `9bf832b` (rama `wp-nutricion-recetas`, #147).
- **Almacenamiento.** Sigue en PostgreSQL, detrás de `AlmacenDeMedios`, con límites, respaldo, retención, borrado
  autorizado y cambio de proveedor documentados en DL-120.
- **Bloqueo remoto aislado:** la base de test vence cerca del 2026-10-18. Seguir con ella es una decisión de servicio; no
  se recreó ni se pagó nada (`docs/propuestas/CONTINUIDAD-BASE-DE-TEST_2026-10-06.md`).
- **EVIDENCIA_VISUAL** (08 §12.4): desde el precierre hay un texto **propuesto**, su aceptación y revocación, y su mapeo a
  MED-01 y MED-03, detrás de `BE_EVIDENCIA_VISUAL_EXIGIDA`, que sigue en `false`. No se insertó ninguna aceptación de una
  persona real y no se declara validación jurídica (DL-125).
- **Seguridad de dependencias:** `source-map-js` 1.2.2 (#146 y #148), y `sharp` 0.35.5 con `shell-quote` 1.12.0 (#149 y
  #148). Ninguna excepción de auditoría nueva.

## El recorrido completo, paso por paso

Se corrió con lo mismo que en producción, pero local:
- la API compilada;
- una base PostgreSQL 16 propia;
- el website como export estático, con **la misma CSP de `render.yaml`**;
- la APK como render de sus pantallas reales en el navegador, contra la API real.

| # | Paso | Dónde se probó | Resultado | Evidencia |
|---|---|---|---|---|
| 1 | El profesional crea los tres ejercicios del paquete en «Mis ejercicios» y carga cada imagen por el flujo real: archivo, vista previa, procedencia «Generada por IA», autoría, texto alternativo, sin licencia externa con sus términos de uso y revisión pendiente | puppeteer contra la web y la API locales | BE guarda cada imagen en JPEG y la muestra con su procedencia, su autoría, su licencia y su revisión. El texto alternativo es el declarado | `capturas-web/01` a `03`, `resultados/01` |
| 2 | Reemplaza la imagen de la sentadilla, la retira y la vuelve a cargar | ídem | Cada paso responde sin conflictos; retirar deja el ejercicio sin imagen y no borra el medio | `03b`, `resultados/01` |
| 3 | Recarga la página | ídem | Los tres ejercicios siguen con su imagen | `resultados/01` |
| 4 | Arma «Piernas A»: lo común en la prescripción y lo distinto en cada serie, con las bases de carga y repeticiones; y dos sesiones cortas para la recuperación | ídem | «Así lo ve tu asesorado» coincide serie por serie con `sesion_demo.json`. Con «Sin objetivo», la tercera serie de la zancada no tiene descanso | `04`, `05`, `resultados/01` |
| 5 | Guarda y valida. **Precierre §2:** el asesorado todavía no usó la APK nueva | ídem | El editor dice «Todavía no podés activar este plan», por qué y qué hacer; «Activar plan» queda deshabilitado, con el motivo asociado. El asesorado abre Entrenamiento con la APK nueva (API-TRN-14 con la capacidad), el editor dice que ya se puede y se activa | `05b`, `05c`, `resultados/01` |
| 6 | El plan activo, leído con API-SER-01 | ídem | Dice lo mismo que el paquete y muestra la imagen de cada ejercicio | `06`, `resultados/01` |
| 7 | **Precierre §2:** la APK sin la capacidad y la nueva leen «Hoy» | script contra la API | Sin la capacidad (la 0.13.2 y las candidatas no declaran nada): `NOT_AVAILABLE`, sin plan ni ocurrencias, con la forma estricta que validan. Con la capacidad: el plan y sus tres sesiones. **P01:** API-SER-02 entrega las 9 series exactamente como en el paquete; las tres imágenes se descargan en JPEG | `resultados/02` |
| 8 | Otro asesorado y otro profesional | ídem | **P05:** no leen las imágenes ni el plan, y no pueden cambiar una imagen (404). El titular tampoco lee API-SER-01 | `resultados/02` |
| 9 | La APK, en «Recuperación de prueba», con el **reloj del proceso** | render de la APK contra la API real | La primera vez explica los tiempos. Con un descanso abierto se recarga la página (un proceso nuevo). Al volver, la APK pregunta qué pasó; se deja incompleto, se registra y se envía la serie y se finaliza. **El total queda estimado y coincide con las anclas del recorrido: 203 408 ms calculados = 3 408 ms entre las cargas + 200 000 ms de reloj (0 ms de diferencia, tolerancia 1 000 ms).** Cinco eventos, ninguno repetido, todos con la base del proceso y dos anclas; ninguna duración absurda | `capturas-apk-api-real/01`, `02`, `04-proceso`, `resultados/03` |
| 10 | La APK, en «Recuperación con el reloj del arranque», con el **reloj del arranque** y **la imagen que no baja** | ídem | La imagen falla siempre: un acceso y una sola renovación, ningún pedido más, y el respaldo «La imagen no se pudo mostrar.»; la serie se registra y se envía igual. Al volver de la recarga, la APK pregunta igual. **El total queda medido: 216 293 ms = 16 293 + 200 000 (0 ms de diferencia).** Todos los eventos con la base del arranque y una sola ancla | `03-arranque`, `04-arranque`, `resultados/03` |
| 11 | La APK, en «Piernas A», con el guion de `DECISIONES_Y_TIEMPOS.md` | ídem | Series A1 y A2 cronometradas; descansos ligados a su serie; A1 a A3 registradas (A3 sin cronometrar); peso muerto activo; pausa de 120 s; B1 registrada y enviada; finalización a los 900 s con la condición declarada | `04` a `07`, `resultados/03` |
| 12 | El profesional ve lo persistido | puppeteer contra la web | El plan histórico de cada serie frente a lo registrado y los tiempos con su certeza. Las dos recuperaciones muestran exactamente lo que calculó la API: «03:23 · estimado» y «03:36 · medido». El login vuelve a la pestaña Entrenamiento | `capturas-web/07` a `09`, `resultados/04` |
| 13 | Se reinicia la API | script contra la API | Todo lo del paso 7 y el 8 da igual: compatibilidad, objetivos, imágenes y permisos | `resultados/05` |
| 14 | **Precierre §5:** la reconexión con demoras reales | el módulo real de la APK contra la API real, con un proxy | 30 s de demora: «está tardando» a los 5 013 ms y la sesión recuperada a los 30 090 ms, con un solo pedido. Dos 503: tres pedidos de a uno, separados 2 033 y 4 022 ms. 80 s: «tiempo agotado» a los 75 017 ms, ese pedido cortado y ninguno más. Sin conexión: su causa, enseguida. En ningún caso se borra la credencial ni se inicia sesión | `resultados/12` |
| 15 | **M05:** con lo escrito en la serie 1, abrir «Ver técnica» y volver; desde «Ver rutina», abrir la técnica del peso muerto y volver | render de componentes de la APK con datos sintéticos | La fila, lo escrito (14 repeticiones, RIR 2,5) y el ejercicio activo no cambian; la técnica que se abre es la del peso muerto | `capturas-apk-tecnica/`, `resultados/06` |

**Resultado de la corrida final, en el head del precierre:** 162 controles aprobados de 162 (web 23, API 30, APK 37,
profesional 25, API después del reinicio 30, reconexión 12 y M05 5).

### El reloj de la APK en el recorrido

El reloj de la sesión del render es el **inyectable** del primer encargo (§9), en `shims/reloj-controlado.ts`.
- **Cómo avanza.** Solo cuando el recorrido lo adelanta, para reproducir el guion sin esperar. React y la red siguen con
  el reloj real.
- **Dos bases** (precierre §3), según `?reloj=`: la del proceso, que empieza de nuevo en cada carga, con otra ancla; y la
  del arranque simulado, que sigue contando entre cargas, con la misma ancla, como el módulo nativo.
- **Las anclas del recorrido.** El recorrido anota el instante civil de cada carga, que lee del arnés, y cada adelanto que
  aplica. Con eso calcula lo esperado y lo compara con lo que calculó la API, con una tolerancia de 1 000 ms. Ya no hay
  pisos: el control anterior aceptaba cualquier valor de al menos 200 s, y el precierre pidió no hacerlo.
- **Qué prueba y qué no.** Prueba la lógica de los tiempos de la APK, la API y la web de punta a punta, con las dos bases.
  No prueba el reloj de Android: eso es del teléfono.

## Qué tiempos son medidos y cuáles no

| Sesión | Tiempo | Valor | Certeza | Por qué |
|---|---|---|---|---|
| Piernas A | Transcurrido | 15:00 | **medido** | Inicio y fin en el mismo proceso |
| Piernas A | Pausas · sin pausas | 02:00 · 13:00 | **medido** | Pausa explícita de 500 a 620 s |
| Piernas A | Sentadilla goblet · peso muerto rumano | 07:30 · 05:30 | **medido** | La sentadilla se activa al iniciar, de 0 a 450 s (en el ejemplo del paquete es desde los 10 s, y por eso allí da 7:20); el peso muerto, de 450 a 900 s sin la pausa |
| Piernas A | Sin ejercicio asignado | 00:00 | **medido** | Iniciar activa el primer ejercicio en el mismo instante |
| Piernas A | Descanso A1 | 01:30 registrado · 01:30 recomendado · ±00:00 | **medido** | Recomendado histórico de la serie 1 |
| Piernas A | Descanso A2 | 02:15 registrado · 02:00 recomendado · +00:15 | **medido** | Recomendado histórico de la serie 2 |
| Piernas A | Series A1 y A2 | Duración medida 00:40 | **medido** | «Cronometrar serie», con inicio y fin |
| Piernas A | Serie A3 y serie B1 | Duración desconocida | — | Se registraron sin cronometrar: hay datos, pero no hay duración |
| Las dos recuperaciones | Descanso de la serie 1 | Incompleto · 01:30 recomendado | **incompleto** | La app se cerró con el descanso abierto y la persona eligió «Dejarla incompleta»: ningún reloj dice cuándo terminó |
| Recuperación de prueba (reloj del proceso) | Transcurrido · sin pausas | 03:23 | **estimado** | El inicio y el fin están en procesos distintos: la duración sale del reloj civil |
| Recuperación con el reloj del arranque | Transcurrido · sin pausas | 03:36 | **medido** | El arranque no cambió: el inicio y el fin están en la misma base y la misma ancla |

Los oráculos del paquete (`casos_tiempos.json`: 16 casos; el ejemplo 900/120/780 y 440/330/10) se prueban contra el
dominio con un reloj inyectado, en `packages/domain/src/tiempos-y-series.test.ts` y `entrenamiento-por-serie.test.ts`,
ahora con las dos bases. Ningún oráculo cambió.

## Compatibilidad: qué ve cada APK (precierre §2)

| Cliente | Plan sin objetivos distintos por serie | Plan con objetivos distintos por serie |
|---|---|---|
| **0.13.2** y las candidatas 0.14.0-1 y 2 (versionCode 22 a 24): no declaran la capacidad | Lo ve como siempre | No se puede activar mientras el asesorado no use la APK nueva. Si ya estaba activo, recibe «no disponible»: «Tu plan de entrenamiento no está disponible en este momento.», con «Ir a Vínculos» (`be-apk-0.13.2:apps/mobile/src/pantallas/entrenamiento.tsx:132`). Nunca los valores generales como si fueran los de la serie |
| **APK nueva** (la próxima candidata, versionCode 25 en adelante): declara `training-set-targets-1` | Lo ve como siempre | Recibe el plan y los objetivos exactos de cada serie (API-SER-02) |
| Website del profesional | — | Antes de activar, dice por qué no se puede y qué hacer; después, «Tu asesorado ya usa una versión de BE que muestra los objetivos de cada serie.» |

No se inventó ningún versionCode: la capacidad es lo que el cliente declara, y no se usa una versión mínima.

## El guardado en el teléfono (precierre §1 y §4)

- **Estados:** en memoria (solo en la app), escritura pendiente, guardado en el teléfono, enviado («Enviado: está
  guardado en BE.») y falla recuperable, con el texto de qué se pierde si se cierra la app y «Reintentar guardar».
- **Lectura que falla o JSON inválido:** no es «no hay nada». Lo guardado no se pisa: se aparta en una clave de
  recuperación, sin imprimir datos, y se ofrece «Reintentar». No se borra el borrador.
- **Cifrado:** AES-256-GCM de `expo-crypto`, con una clave por cuenta en el almacén seguro (Keystore) y el nombre de la
  entrada como dato asociado. Lo anterior en claro se migra sin pérdida. Sin la clave (por ejemplo, después de restaurar
  el teléfono), lo guardado queda apartado y la app lo dice; no se descifra a la fuerza ni se borra.
- **Fuera del respaldo y de la transferencia:** borradores, eventos y credenciales (`fullBackupContent` hasta Android 11,
  `dataExtractionRules` desde el 12). El almacén seguro tampoco entra (`configureAndroidBackup: false`).
- **Corrección de la atribución anterior:** este documento decía que la sesión quedaba en AsyncStorage sin cifrar «como
  pide el encargo». El encargo no pedía eso: guardar sin cifrar fue una elección de la implementación, y el precierre la
  corrige.

## Respaldo y restauración (precierre §6)

| Caso | Resultado |
|---|---|
| 1 · Respaldo con el esquema de hoy, restaurado de una vez | **Falla:** `pg_restore` carga con la ruta de búsqueda vacía y la función del CHECK de finalidad no encuentra su tipo |
| 2 · El mismo respaldo, restaurado por secciones | Igual al origen: 94 tablas, 1 071 filas y 10 imágenes con la misma huella |
| 3 · Respaldo de una base con la migración `20261006150000`, restaurado de una vez | Igual al origen |
| 4 · Una base restaurada como la de `test` hoy, migrada hasta el head | Las 5 migraciones de esta rama se aplican y la API arranca contra ella: `/health/ready` responde base y migraciones en OK |

Herramientas: `herramientas/precierre/respaldo-y-restauracion.sh` y `restauracion-migrada.sh`, solo con bases locales.
Resultados: `resultados/09` y `11`. La propuesta de continuidad de la base remota, con costos, está en
`docs/propuestas/CONTINUIDAD-BASE-DE-TEST_2026-10-06.md`.

## Pruebas

| Dónde | Qué | Resultado |
|---|---|---|
| Local | Dominio (contratos, objetivos por serie, eventos, tiempos con las dos bases, compatibilidad, EVIDENCIA_VISUAL, formas congeladas de la APK 0.13.2) | 516/516 |
| Local | Scripts (APK: guardado local, reloj del teléfono, compatibilidad, imagen, reconexión, respaldo de Android, sesión enfocada, tiempos, recuperación; trazabilidad de operaciones; contraste; copy) | 288/288 |
| Local | API unitaria | 80/80 |
| Local | Integración de la API contra PostgreSQL 16, en este precierre | `evidencia-visual` 10/10 (nueva), `contrato` 15/15 y otras ocho suites afectadas, 149/149; con `sharp` 0.35.5, las cuatro que procesan imágenes, 58/58. Antes, `compatibilidad-de-clientes` 4/4 (nueva) y `entrenamiento-por-serie` 26/26 |
| Local | Recorrido de punta a punta, reconexión real y M05 (este documento) | 162/162 |
| Local | Renders de componentes de la APK: 42 capturas, entre ellas la matriz de 360, 390 y 412 dp × Azul noche y Claro × letra 1, 1,3 y 2, la ilustración entera en los dos temas, la recuperación y EVIDENCIA_VISUAL | `capturas-apk-navegador/` |
| Local | Kotlin del módulo nativo contra android-36 y expo-modules-core 57.0.18, sin Gradle; autolinking y manifiesto introspectado | `resultados/08` |
| Remoto | CI de la rama: legajo, verificar, la integración completa e imagen de la API | En verde en `5144841` |
| Android | Ver «Casos de Android» | **Pendiente:** no hay una APK nueva; no se sustituye por renders del navegador |

## Casos de Android

El navegador no es Android. Cada caso se separa porque deja la memoria, el almacenamiento y el reloj en otro estado.

| Caso | Qué queda | Probado en | Lo que tiene que pasar en el teléfono |
|---|---|---|---|
| Recarga del navegador (el arnés) | Otro proceso, mismo almacenamiento; reloj del proceso o arranque simulado | Recorrido, pasos 9 y 10 | — |
| Descarte de la actividad («No conservar actividades», en las opciones de desarrollador) | El proceso puede seguir vivo, con la memoria | **Pendiente** | La sesión sigue como estaba; si el proceso siguió, la medición abierta es del mismo proceso y no pregunta |
| Cierre desde recientes | Proceso nuevo; lo guardado sigue, cifrado | **Pendiente** | «Continuar entrenamiento» y la pregunta por la medición abierta; los tiempos, medidos con el reloj del arranque |
| Muerte del proceso por el sistema (`adb shell am kill be.app` con la app en segundo plano) | Igual que recientes, sin intervención | **Pendiente** | Igual que recientes |
| Reinicio del teléfono | Otro arranque: otra ancla y el reloj desde cero | **Pendiente** | Pregunta por la medición abierta; lo que cruza el reinicio no se mide (estimado o incompleto), y nunca se mezclan anclas |
| Pantalla bloqueada o teléfono dormido | `elapsedRealtime` sigue contando | **Pendiente** | Un descanso con la pantalla bloqueada se mide bien |
| Cambio de la hora civil | El reloj desde el arranque no cambia | **Pendiente** | Las duraciones medidas no cambian; la hora civil solo ordena |
| Respaldo y transferencia | Borradores, eventos y credenciales excluidos | **Pendiente** (prueba técnica, opcional) | Después de restaurar en otro teléfono, no aparece la sesión en curso ni la credencial |

## Límites y bloqueos

- **Compatibilidad (DL-122).** La APK vieja, con un plan que exige objetivos por serie, dice «no disponible» con «Ir a
  Vínculos»: es lo único que esa versión sabe mostrar, y no es la causa real. El registro de la capacidad no vence.
- **Reloj de Android (DL-124).** El módulo nativo compila, pero no se ejecutó en un teléfono. Sin él (el navegador, Expo
  Go), la base es la del proceso y vale el límite anterior: si el civil se adelanta más de 2 s, la duración queda estimada.
- **EVIDENCIA_VISUAL (DL-125).** Es una propuesta: el texto espera la aprobación de Dirección y la validación jurídica, y
  la exigencia sigue apagada.
- **Base de test remota.** Vence cerca del 2026-10-18 (DL-120). Sin despliegue no hubo prueba remota: ninguna familia
  nueva existe en `test`, que sigue en `2f0c140` (`resultados/10`, medido de nuevo al cerrar el precierre, también EVI).
- **Sin cubrir en este paquete:**
  - una serie declarada «no realizada» (DL-106);
  - un RIR o %RM por serie con otro criterio;
  - el video;
  - `didacticResources` en API-TRN-13;
  - la corrección de eventos de tiempo.
- **Hallazgos fuera del paquete, ya corregidos con su prueba:**
  - **severidad alta:** dos avisos de seguridad del 2026-10-06 bloqueaban la auditoría (`5144841` y #148);
  - **severidad media:** `numero(n, 0)` mostraba 10 como «1»;
  - **severidad baja:** después del login no se podía volver a la pestaña Entrenamiento de un asesorado.

## La próxima prueba en el teléfono

**Requisito.** La API y el website de esta rama desplegados en `test`, y una candidata compilada después, con autorización
aparte (`docs/propuestas/PLAN-DE-PUBLICACION-Y-CANDIDATA_2026-10-06.md`). Una APK compilada antes del despliegue no sirve:
hablaría con una API que no tiene las operaciones nuevas.
- **Cuentas:** un profesional de Entrenamiento y un asesorado con vínculo, B2 y A3, en el ambiente de test.
- **Plan:** «Piernas A» con los objetivos de `sesion_demo.json`, armado desde el website.
- **Imágenes:** las tres del paquete, cargadas en «Mis ejercicios».

**Recorrido para Elián** (unos 30 minutos).
1. **Antes de abrir la APK nueva.** En el website, el plan con objetivos por serie dice «Todavía no podés activar este
   plan». Abrir Entrenamiento en el teléfono con la APK nueva y volver al website: ya se puede activar.
2. **Reconexión.** Con la API dormida (la primera visita del día), abrir la app: a los 5 s dice «Está tardando más de lo
   habitual» sin ofrecer «Reintentar», y entra sola. Con el modo avión: «Parece que no hay conexión», sin cerrar la sesión.
3. **Sesión de hoy.** «Iniciar entrenamiento»: la explicación de los tiempos aparece una sola vez. Teclado decimal en la
   carga y el RIR, entero en las repeticiones; nada tapa «Registrar serie». Cada serie registrada pasa a «Enviado».
4. **Descanso con la pantalla bloqueada.** Iniciar un descanso, bloquear 2 minutos y volver: el conteo da el tiempo real.
   En el website, ese descanso figura como medido.
5. **Cierre desde recientes.** Con un descanso abierto, cerrar la app desde recientes y abrirla: «Continuar
   entrenamiento», y la app pregunta qué pasó; nunca lo cierra sola.
6. **Reinicio del teléfono.** Con otro descanso abierto, reiniciar: la app pregunta igual, y lo que cruzó el reinicio no
   figura como medido.
7. **Cambio de hora.** Con un descanso abierto, adelantar la hora 1 minuto y finalizarlo: la duración no cambia.
8. **Imagen.** La ilustración de cada ejercicio se ve entera, sin recortar, en Azul noche y en Claro (el Plan y «Ver
   técnica»).
9. **Sin red.** Con la sesión abierta, activar el modo avión y registrar una serie: dice «Guardado en el teléfono; falta
   enviarlo.». Al volver la red, «Enviado: está guardado en BE.».
10. **TalkBack.** Los campos dicen la serie y su plan; el conteo no se anuncia cada segundo; «Ver técnica» y «Ver rutina» se
   alcanzan.
11. **Profesional.** En el website: Ejecuciones → la sesión → plan por serie, descansos y tiempos con su certeza.

## Lo que se corrigió durante los recorridos

Ninguno de estos arreglos tocó el producto.
- **Primer encargo.**
  - Una primera corrida dio 7 de 8 en la APK y 19 de 21 en la vista del profesional: el script borraba el adelanto del
    reloj en cada documento nuevo, también al recargar. Se corrigió y se repitió todo con cuentas nuevas.
  - El control de las imágenes del plan activo contaba antes de que terminaran de descargarse. Ahora espera.
  - La prueba de M05 dio verde la primera vez sin probar lo que decía: su selector abría la técnica del ejercicio activo.
    El selector ahora es preciso, y un control exige que la técnica abierta sea la del peso muerto.
- **Precierre.** Hubo dos corridas parciales antes de la final, cortadas por el arnés:
  - recargar la página del website cierra la sesión, porque se guarda solo en memoria (DL-012): el script ahora navega
    dentro de la app para que el editor se vuelva a leer;
  - el recorrido esperaba el texto de «enviado» anterior, que el precierre cambió: ahora lo lee de la fuente de la APK;
  - el control de la imagen contaba descargas, pero el navegador puede pedir dos veces la misma ruta y dos accesos en el
    mismo segundo firman la misma ruta: ahora exige un acceso, una renovación y ningún pedido más.

  La corrida final, con cuentas nuevas, es la de la tabla.

## Cómo reproducir el recorrido

Desde `EVIDENCIA/ENTRENAMIENTO-SERIES/herramientas/recorrido`. Hace falta Node 22, Chrome y un PostgreSQL 16 local en
`localhost:55442`.

1. **Preparar el entorno.** Con `BE_TRABAJO` en una carpeta fuera del repositorio:
   - `bash entorno.sh compilar`, `bash entorno.sh migrar` y `bash entorno.sh api`;
   - `node preparar.mjs cuentas`. Imprime `BE_DEMO_PROFESIONALES`;
   - `bash entorno.sh parar-api`, `bash entorno.sh api "<BE_DEMO_PROFESIONALES>"` y `node preparar.mjs vinculo`.
2. **Recorridos del profesional y de la API.** `bash entorno.sh web`, `node recorrido-web.mjs` y `node recorrido-api.mjs`.
3. **Recorrido de la APK.**
   - El render real se arma en una copia del arnés, con sus dependencias instaladas:
     `BE_REPO=<repo> API_REAL=1 node construir.mjs`.
   - Se sirve con `node servir-arnes.mjs <arnés>/salida 3002 http://localhost:3001`.
   - Después, `node recorrido-apk.mjs`.
4. **Verificación final.** Reiniciar la API (el límite de inicios de sesión vive en memoria). Después,
   `node recorrido-web-ejecuciones.mjs`, otra vez `node recorrido-api.mjs`, `BE_ARNES=<copia del arnés> node
   reconexion-real.mjs` y `node tecnica-y-vuelta.mjs <arnés sin API_REAL>/salida`.
5. **Respaldo y restauración.** `bash ../precierre/respaldo-y-restauracion.sh` y `bash ../precierre/restauracion-migrada.sh`,
   solo contra bases locales.
6. **Al terminar.** `bash entorno.sh parar-api` y `bash entorno.sh parar-web`, y cerrar el servidor del arnés.
