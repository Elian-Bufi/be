# Evidencia de WP-ENTRENAMIENTO-SERIES

> **Encargo:** «BE · Cierre de Nutrición y Entrenamiento por serie», de Dirección, del 2026-10-06, con el paquete
> `BE_Entrenamiento_Autonomo_2026-10-06`. La entrega prevista es el 2026-10-20.
> - Definición: [`docs/paquetes/WP-ENTRENAMIENTO-SERIES.md`](../../docs/paquetes/WP-ENTRENAMIENTO-SERIES.md).
> - Deudas: DL-122, DL-123 y DL-124.
> - Rama `wp-entrenamiento-series`. El PR en borrador va apilado sobre `wp-nutricion-recetas` (#147).
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
| **Implementado** | Sí. Los commits son, en orden: `ffd42af` (definición y dominio), `ce4c1b1` (dominio), `033bfa1` (API), `65a7d6a` (website), `e6bd769` (APK) y el de esta evidencia |
| **CI** | En verde en `e6bd769`: las cuatro tareas (legajo, verificar, integración e imagen de la API). El commit intermedio `ffd42af` falló en la prueba de contrato (TEST-CT) porque declaraba las 9 operaciones nuevas antes de implementarlas; `033bfa1` lo resolvió |
| **Publicado** | No. No se construyó ni se publicó una APK, ni hubo merge ni despliegue: el encargo los deja fuera |
| **Verificado en el teléfono** | **No.** Lo que solo se puede verificar en Android está más abajo, con los pasos de la próxima prueba |

## Cierre de Nutrición (encargo §2)

- **Contraste de la comida diferente.** Dice los dos hechos, «Sin opción del plan registrada» y «Comida diferente
  registrada», sin falso cumplimiento. Está en `9bf832b` (rama `wp-nutricion-recetas`, #147).
- **Almacenamiento.** Sigue en PostgreSQL, detrás de `AlmacenDeMedios`, con límites, respaldo, retención, borrado
  autorizado y cambio de proveedor documentados en DL-120.
- **Bloqueo remoto aislado:** la base de test vence cerca del 2026-10-18. Seguir con ella es una decisión de servicio; no
  se recreó ni se pagó nada.
- **Pendiente normativo aislado:** el acto `EVIDENCIA_VISUAL` (08 §12.4) no tiene texto versionado. No se creó ningún acto
  ni aceptación ficticia.
- **Seguridad, `source-map-js` 1.2.2:**
  - en #146, con `6004c32`;
  - en un PR propio contra `main`, #148 (`a9b8406`), en borrador.

  Son tres líneas del lock y ninguna excepción de auditoría; la auditoría pasa con el cambio y falla sin él.
- **DL-119, DL-120 y DL-121:** implementadas y probadas localmente, sin integrar.

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
| 4 | Arma «Piernas A»: lo común en la prescripción y lo distinto en cada serie, con las bases de carga y repeticiones | ídem | «Así lo ve tu asesorado» coincide serie por serie con `sesion_demo.json`. Con «Sin objetivo», la tercera serie de la zancada no tiene descanso | `04`, `05`, `resultados/01` |
| 5 | Guarda, valida y activa | ídem | El editor releído con API-SER-01 conserva las 9 series. El aviso de la APK 0.13.2 aparece. La validación no tiene problemas | `resultados/01` |
| 6 | El plan activo, leído con API-SER-01 | ídem | Dice lo mismo que el paquete y muestra la imagen de cada ejercicio | `06`, `resultados/01` |
| 7 | El asesorado lee la sesión de hoy (API-SER-02) | script contra la API | **P01:** las 9 series llegan exactamente como en el paquete. Las tres imágenes se descargan en JPEG. **C01:** API-TRN-14 conserva la forma estricta de la APK 0.13.2 y no trae claves nuevas | `resultados/02` |
| 8 | Otro asesorado y otro profesional | ídem | **P05:** no leen las imágenes ni el plan, y no pueden cambiar una imagen (404). El titular tampoco lee API-SER-01 | `resultados/02` |
| 9 | La APK, en «Recuperación de prueba» | render de la APK contra la API real | La primera vez explica los tiempos. Con un descanso abierto se recarga la página (un proceso nuevo). Al volver, la APK no lo cierra sola: pregunta. Se deja incompleto y se finaliza | `capturas-apk-api-real/01` a `03`, `resultados/03` |
| 10 | La APK, en «Piernas A», con el guion de `DECISIONES_Y_TIEMPOS.md` | ídem | Series A1 y A2 cronometradas; descansos ligados a su serie; A1 a A3 registradas (A3 sin cronometrar); peso muerto activo; pausa de 120 s; B1 registrada; finalización a los 900 s con la condición declarada | `04` a `07`, `resultados/03` |
| 11 | El profesional ve lo persistido | puppeteer contra la web | El plan histórico de cada serie frente a lo registrado y los tiempos con su certeza. El login vuelve a la pestaña Entrenamiento | `capturas-web/07`, `08`, `resultados/04` |
| 12 | Se reinicia la API | script contra la API | Después del reinicio, todo lo del paso 7 y el 8 da igual: imágenes, objetivos y permisos | `resultados/05` |

**Resultado:** 101 controles aprobados de 101 en la corrida limpia (20, 26, 8, 21 y 26).

### El reloj de la APK en el recorrido

El reloj de la sesión del render es el **inyectable** del encargo (§9), en `shims/reloj-controlado.ts`.
- **Cómo avanza.** Solo cuando el recorrido lo adelanta, para reproducir el guion sin esperar. React y la red siguen con
  el reloj real.
- **Al recargar.** Cada carga es un proceso nuevo, con otra ancla. El reloj civil sigue donde estaba, como en el teléfono.
- **Qué prueba y qué no.** Prueba la lógica de los tiempos de la APK, la API y la web de punta a punta. No prueba el reloj
  de Android.

### Lo que se corrigió durante el recorrido

Ninguno de estos arreglos tocó el producto:
- **Una primera corrida** dio 7 de 8 en la APK y 19 de 21 en la vista del profesional. El problema estaba en el script:
  borraba el adelanto del reloj en cada documento nuevo, también al recargar. Se corrigió y se repitió todo con cuentas
  nuevas.
- **En la corrida limpia,** la sesión de prueba dio «03:24 · estimado» y el control esperaba 03:20. El producto hace lo
  correcto: después de un cierre de la app la duración se estima con el reloj civil, que siguió corriendo entre las dos
  cargas (200 s del guion y unos 4 s reales). El criterio del control pasó a ser la calidad y un piso de 200 s, y la
  corrección consta en `resultados/03` (`notaDelCriterio`).
- **El control de las imágenes del plan activo** contaba antes de que terminaran de descargarse. Ahora espera.

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
| Recuperación de prueba | Descanso de la serie 1 | Incompleto · 01:30 recomendado | **incompleto** | La app se cerró con el descanso abierto y la persona eligió «Dejarla incompleta» |
| Recuperación de prueba | Transcurrido · sin pausas | 03:24 | **estimado** | El inicio y el fin están en procesos distintos: la duración sale del reloj civil |

Los oráculos del paquete (`casos_tiempos.json`: 16 casos; el ejemplo 900/120/780 y 440/330/10) se prueban contra el
dominio con un reloj inyectado, en `packages/domain/src/tiempos-y-series.test.ts` y `entrenamiento-por-serie.test.ts`.

## Pruebas

| Dónde | Qué | Resultado |
|---|---|---|
| Local | Dominio (contratos, objetivos por serie, eventos, tiempos, comparación, formas congeladas de la APK 0.13.2) | 503/503 |
| Local | Scripts (APK: sesión enfocada, tiempos en el teléfono, recuperación, sesión persistente; retorno seguro; contraste; copy) | 245/245 |
| Local | API unitaria | 71/71 |
| Local | Integración de la API contra PostgreSQL 16 | `entrenamiento-por-serie` 24/24, `entrenamiento` 93/93 y `contrato` 14/14 en la última corrida; además, `a3-del-titular` 5/5 y, en la corrida anterior, `medios` 13/13, `recetas` 9/9, `schema` 52/52 (con la deriva) y `plantillas` 7/7 |
| Local | Typecheck de los cuatro paquetes, export estático del website y OpenAPI regenerado | Sin errores |
| Local | Recorrido de punta a punta (este documento) | 101/101 |
| Local | Renders de componentes de la APK: 37 capturas, entre ellas la matriz de 360, 390 y 412 dp × Azul noche y Claro × letra 1, 1,3 y 2 | `capturas-apk-navegador/` |
| Remoto | CI de la rama en cada push: legajo, verificar (typecheck, unitarias, build y auditoría), integración completa e imagen de la API con `migrate deploy` | En verde en `e6bd769` |
| Android | Teclado, TalkBack, pantalla bloqueada, muerte del proceso, cambio de hora, zona segura, botón atrás, superficie mate en Yoga, `expo-crypto` | **Pendiente:** no hay una APK nueva; no se sustituye por renders del navegador |

## Límites y bloqueos

- **APK instalada (DL-122).** La 0.13.2 lee la prescripción con su forma vieja: muestra los valores generales, no los de
  cada serie. El editor lo avisa. Dirección decide entre exigir una versión mínima de la APK o negociar por capacidad.
- **Datos en el teléfono.** La sesión en curso queda en AsyncStorage, como pide el encargo. No está cifrada y podría
  entrar en el respaldo automático de Android. A decidir por Dirección.
- **Reloj de Android.** Mientras el teléfono duerme, el monotónico no avanza. Si el civil se adelanta más de 2 s, la
  duración se informa como estimada (DL-124). Falta verlo en el teléfono.
- **Base de test remota.** Vence cerca del 2026-10-18 (DL-120). Sin despliegue no hubo prueba remota.
- **Sin cubrir en este paquete:**
  - una serie declarada «no realizada» (DL-106);
  - un RIR o %RM por serie con otro criterio;
  - el video;
  - `didacticResources` en API-TRN-13;
  - la corrección de eventos de tiempo.
- **Hallazgos fuera del paquete, ya corregidos con su prueba:**
  - **severidad media:** `numero(n, 0)` mostraba 10 como «1»;
  - **severidad baja:** después del login no se podía volver a la pestaña Entrenamiento de un asesorado.

## La próxima prueba en el teléfono (sin construir ni publicar en este encargo)

**Requisito.** Una APK candidata de esta rama, compilada con una autorización aparte. Para la prueba:
- **Cuentas:** un profesional de Entrenamiento y un asesorado con vínculo, B2 y A3, en el ambiente de test.
- **Plan:** «Piernas A» con los objetivos de `sesion_demo.json`, armado y activado desde el website.
- **Imágenes:** las tres del paquete, cargadas en «Mis ejercicios».

**Pasos.**
1. **Recuperación de sesión.** Abrir la app con la red cortada. Tiene que decir «Sin conexión» y no cerrar la sesión. Con
   la red lenta, «Está tardando más de lo habitual» a los 5 s. «Reintentar» funciona.
2. **Sesión de hoy.**
   - En Entrenamiento → Hoy → «Iniciar entrenamiento», la explicación de los tiempos aparece una sola vez.
   - En la tabla: el teclado decimal en la carga y el RIR, el entero en las repeticiones, y que la barra o el teclado no
     tapen «Registrar serie».
3. **Descanso con la pantalla bloqueada.** Iniciar un descanso, bloquear la pantalla 2 minutos y volver. El conteo tiene
   que dar el tiempo real, sin reiniciar. Si el teléfono durmió, el profesional lo ve como estimado.
4. **Muerte del proceso.** Con un descanso abierto, cerrar la app desde recientes y volver a abrir. La app tiene que
   preguntar «Terminó ahora» o «Dejarla incompleta», y nunca cerrarla sola.
5. **Cambio de hora.** Con un descanso abierto, adelantar la hora del teléfono 1 minuto y finalizar. El descanso queda
   estimado; atrasar la hora no altera un descanso medido.
6. **TalkBack.** Los nombres de los campos dicen la serie y su plan. El conteo no se anuncia cada segundo. «Ver técnica» y
   «Ver rutina» se pueden alcanzar.
7. **Superficies.** En Azul noche, las tarjetas de Progreso, Indicadores y la lámina del mapa corporal no muestran la placa
   luminosa recortada.
8. **Profesional.** Finalizar y revisar en el website: Ejecuciones → la sesión → plan por serie, descansos y tiempos con su
   certeza.

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
   `node recorrido-web-ejecuciones.mjs` y otra vez `node recorrido-api.mjs`.
5. **Al terminar.** `bash entorno.sh parar-api` y `bash entorno.sh parar-web`, y cerrar el servidor del arnés.
