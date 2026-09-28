# Publicación · APK 0.12.0 (PF-03 incremento 1 + DL-104)

**Estado: PUBLICADA el 2026-09-28. Falta la validación de Dirección en el teléfono.**
- **Release permanente:** https://github.com/Elian-Bufi/be/releases/tag/be-apk-0.12.0, marcada Latest. Las anteriores se conservan.
- **Descarga directa:** `https://github.com/Elian-Bufi/be/releases/download/be-apk-0.12.0/be-0.12.0-33b533d.apk`
- **SHA-256:** `077ed0f7b09e2ae794d02e6b0ec321df9b43dd313d5ac08b1cfc684127e79281` · **tamaño:** 70.711.403 bytes
- **Versión:** 0.12.0 · versionCode 17
- **Commit construido:** `33b533dd484db4c3d21679f74798e377bca8dba1` (`main`, merge de #108), con CI 4/4 verde, embebido en la app.

DL-104 y la comprobación nativa de DL-105 siguen **pendientes** hasta la validación de Dirección en el teléfono. DL-096 sigue cerrada.

## Qué incluye

| Cambio | Decisión | En `main` |
|---|---|---|
| El rechazo de un formulario dice qué campo corregir y qué valores admite | DL-104, opción A | #104 (`db9fcda`) |
| Lo planificado, visible y comparable: «Hoy», la sesión y el historial con la prescripción completa, y lo planificado como referencia al registrar | DL-105 (PF03-D-1 A) | #106 (`05eba13`) y #107 (`2cf5091`) |
| Versión 0.12.0, versionCode 17 (solo `apps/mobile/app.config.ts`) | Autorización de Dirección | #108 (`33b533d`) |

**No incluye:** descanso estructurado, alternativas preaprobadas, cuestionarios nuevos, objetivos nutricionales por tipo ni tolerancia del cliente a propiedades desconocidas. Ninguno está aprobado.

**Compatibilidad.** Ninguno de los dos cambios toca las respuestas que lee la APK. La 0.11.3 sigue funcionando contra la API actual: muestra el resumen reducido de siempre y el mensaje genérico ante un número fuera de rango.

## Qué está desplegado (cada cosa por separado)

| Pieza | Commit | Cómo se comprobó |
|---|---|---|
| **API** (`be-api-hndp`) | `05eba136b33d61c864832459a2c0263ce29d5985` (#106) | `/health/ready` el 2026-09-28: `commit` ese SHA, base de datos OK, migraciones OK. #107 y #108 solo tocan la APK y no la redespliegan (`buildFilter` de `render.yaml`) |
| **Website** (`be-web-1ngj`) | el mismo despliegue de `05eba13` | El paquete que sirve Entrenamiento contiene los textos de PF-03 (por ejemplo, «Agregar descanso») |
| **APK** | `33b533dd484db4c3d21679f74798e377bca8dba1` (#108) | Commit embebido en `assets/app.config` |

## Construcción

- **Procedimiento:** el local ya aprobado, con Gradle nativo en Windows y la firma existente ([`build-local-0.11.1.md`](../HISTORIAL-ENTRENAMIENTO/build-local-0.11.1.md), sección «Repetición para la 0.12.0»). **Un solo worker de Gradle desde el comienzo**, sin pruebas ni otros trabajos en paralelo.
- **Tiempo y resultado:** `BUILD SUCCESSFUL in 18m 43s`, en el primer intento.
- **Firma:** la keystore existente administrada por EAS, leída del respaldo protegido fuera del repositorio y pasada a Gradle por entorno. No se generó ni se reemplazó ninguna clave, y las credenciales no aparecen en pantalla, en logs ni en el repositorio.
- **Antes del build**, en la máquina no estaba instalado Node 22.23.2, que exige el repositorio: el primer intento se cortó en `npm ci` con `EBADENGINE`, sin compilar nada. Se reinstaló esa misma versión con fnm y se repitió.

## Verificación del artefacto

| Control | Resultado |
|---|---|
| `applicationId` | `com.elianbufi.be` (`aapt2 dump badging`) |
| Versión | `versionName` 0.12.0 · `versionCode` 17 |
| Firma | `apksigner verify`: válida, 1 firmante, esquema v2 |
| Certificado | SHA-256 `61569691bd47300fc18f32c37a8480ffa51ec54e9647b6125af440535c893e06`, **idéntico al de la 0.11.3**: se instala como actualización |
| Arquitecturas | `lib/arm64-v8a`, `lib/armeabi-v7a`, `lib/x86`, `lib/x86_64` |
| Valores efectivos embebidos (`assets/app.config`) | `appEnv` `test` · `apiBaseUrl` `https://be-api-hndp.onrender.com` · `commit` `33b533dd484db4c3d21679f74798e377bca8dba1` · `construidoEn` `2026-09-28T19:19:01.327Z` |
| Código nuevo incluido | El hash del bundle JS difiere del de la 0.11.3. El bundle contiene `FORM_ANSWER_ABOVE_MAXIMUM` y `FORM_ANSWER_NOT_INTEGER` (DL-104) y «planificadas» y «Agregar descanso» (PF-03) |
| Credenciales privadas | Ninguna: las 1142 entradas, descomprimidas, sin contraseñas ni alias (ASCII y UTF-16LE), sin `PRIVATE KEY` ni el inicio de la keystore, y sin archivos `credentials.json`, `.jks`, `.keystore` ni `.env` |
| Archivo publicado | Se descargó de la release y se volvió a calcular: SHA-256 y tamaño idénticos al construido. `releases/latest` redirige a `be-apk-0.12.0` |

## Escenario sintético preparado en `test`

- **Cuentas:** las demo de siempre, con credenciales en `.env.cuentas-demo`, que no se versiona.
  - **DEMO-PT:** profesional de Entrenamiento, en el website.
  - **DEMO-A01:** «Asesorado · c36743», en la APK.
  - Tienen vínculo aceptado y B2 activo en Entrenamiento.
- **Plan:** el 2026-09-28 se activó una **versión sucesora** del plan de DEMO-A01, con la misma estructura y como continuidad del mismo proceso. Cambia solo el press de banca de la Sesión A:
  - «Serie 1: 10», «Serie 2: 8 · pausa de 2 s abajo», «Serie 3: 6»;
  - «RIR 2», «Carga sugerida: 60 kg», «Descanso: 90 s», «Tempo: bajar en 3 s, subir en 1 s»;
  - «Notas: Espalda neutra en todo el recorrido».
- **Lo que no cambió:**
  - la versión anterior, del 21/9, prescribía «3 × 8», y sus ejecuciones, como la de la Sesión A del 25/9, la conservan;
  - la sentadilla sigue en «2 × 6-8 · 75 % RM (1RM estimado en la evaluación (dato sintético))»;
  - la Sesión A tiene como indicaciones «Entrada en calor de 10 minutos.».
- **No se sembró nada de PF-02 ni de DL-104:** la solicitud, la respuesta, la cita y la corrección las hace Dirección en el recorrido.

## Recorrido de validación (una sola tanda)

Anotá la hora de cada paso, sacá una captura donde se indica, y avisá cualquier diferencia con lo esperado. Iniciá sesión **una sola vez por cuenta**: el límite es de 5 intentos cada 15 minutos. La API se duerme a los 15 minutos, así que la primera pantalla puede tardar unos 25 segundos.

### Fase 1 · Website, DEMO-PT: pedir contexto (PF-02)

1. `https://be-web-1ngj.onrender.com` → iniciar sesión con DEMO-PT → «Asesorado · c36743» → **Entrenamiento** → **«Solicitar contexto»**.
   - **Esperado:** abre «Pedir información» con «Antecedentes para entrenamiento», seis campos, cinco requeridos (preferencias es opcional), el propósito «Planificar tu entrenamiento», el alcance Entrenamiento y el aviso «Viniste desde Entrenamiento…».
   - Tocá **Enviar**: vuelve a Entrenamiento. *Captura 1.*

### Fase 2 · APK **0.11.3** (todavía sin actualizar), DEMO-A01

**Hacé esta fase con la 0.11.3 instalada, antes de instalar la 0.12.0.**

2. **Compatibilidad.** Pantalla **Hoy** → tarjeta de la Sesión A.
   - **Esperado:** abre sin error. En «Press de banca» aparece el resumen de siempre, **«3 × 10 · RIR 2 · Carga sugerida 60 kg»**: la 0.11.3 no conoce la presentación nueva, pero no se rompe. *Captura 2.*
3. **Línea de base de DL-104.** Pestaña **Información** → la solicitud nueva «Antecedentes para entrenamiento» → completá los cinco requeridos, con **«9»** en «Cuántos días por semana…» y «45» en minutos → «Enviar respuesta».
   - **Esperado:** el mensaje genérico «El servicio no está disponible en este momento…». **La respuesta no se guarda**, así que la solicitud sigue pendiente para la fase 4. *Captura 3.*

### Fase 3 · Instalar la 0.12.0 encima

4. Descargá la APK del enlace directo de arriba e instalala **encima**, sin desinstalar la 0.11.3.
   - **Esperado:** se instala como actualización. Al abrir, al pie dice **«app 0.12.0 · test · commit 33b533d»**. Si pide iniciar sesión, usá DEMO-A01. *Captura 4.*

### Fase 4 · APK 0.12.0: DL-104 y la respuesta de PF-02

5. **Información** → la misma solicitud → **«9»** en días y **«45,5»** en minutos, más los otros requeridos → «Enviar respuesta».
   - **Esperado:**
     - junto a días: «⚠ Es más de lo que se admite. Ingresá un número entero entre 1 y 7 días por semana.»;
     - junto a minutos: «⚠ Sin decimales. Ingresá un número entero entre 1 y 600 min.»;
     - junto al botón, un resumen «Revisá los campos marcados. Hay 2 datos que necesitan corrección.» con el rótulo de cada campo;
     - **todo lo escrito sigue en pantalla**. *Captura 5.*
6. Tocá el campo de días y corregí a **3**.
   - **Esperado:** el mensaje de ese campo desaparece al editarlo.
   - Corregí minutos a **45** → «Enviar respuesta» → «Respuesta enviada.». *Captura 6.*

### Fase 5 · Website, DEMO-PT: citar (PF-02)

7. Entrenamiento → **«Nueva evaluación»** → «Contexto declarado por la persona».
   - **Esperado:** las respuestas aparecen con «Declarado por la persona» y su fecha, más el contador «Marcaste 0 de 20».
   - Marcá «Cuántos días por semana…» (**3 días por semana**) y «Qué te gustaría poder hacer…», escribí un dato de la evaluación y **Registrar evaluación**.
   - **Esperado:** la evaluación muestra **«Contexto citado»** con los dos valores. *Captura 7.*

### Fase 6 · APK 0.12.0: corregir (DL-104 al rectificar y PF-02)

8. **Información** → la solicitud → **«Corregir mi respuesta»** → **«8»** en días, con un motivo.
9. **Sin conexión:** activá el modo avión y tocá enviar.
   - **Esperado:** «No pudimos confirmar el resultado. Reintentá.» y el botón pasa a **«Reintentar»**, nunca el mensaje de dato no aceptado. Lo escrito sigue.
   - Desactivá el modo avión y tocá **«Reintentar»**.
   - **Esperado:** el mensaje junto a días con el rango de 1 a 7, y el motivo y lo escrito conservados. *Captura 8.*
10. Cambiá a **4** → enviar → «Corrección enviada.».

### Fase 7 · Website, DEMO-PT: lo citado no cambia (PF-02)

11. Volvé a Entrenamiento → Resumen con las pestañas de la página. **No recargues el navegador:** la sesión del website vive en la pestaña y recargar la cierra (DL-012).
   - **Esperado:** la evaluación sigue citando **«3 días por semana»**, con el aviso «La persona actualizó esta respuesta después de la evaluación; acá se muestra lo que se citó.». *Captura 9.*

### Fase 8 · APK 0.12.0: PF-03

12. **Hoy** → tarjeta de la Sesión A.
   - **Esperado:** «Press de banca» muestra una línea por dato: «Serie 1: 10», «Serie 2: 8 · pausa de 2 s abajo», «Serie 3: 6», «RIR 2», «Carga sugerida: 60 kg», «Descanso: 90 s», «Tempo: bajar en 3 s, subir en 1 s», «Notas: Espalda neutra en todo el recorrido». **Ya no dice «3 × 10».** *Captura 10.*
13. **Comenzar sesión** → arriba aparece **«Indicaciones de la sesión: Entrada en calor de 10 minutos.»** → elegí **registro por serie**.
   - **Esperado:** en press de banca, las series pendientes dicen «Serie 1: Pendiente · planificadas 10 repeticiones», «Serie 2: Pendiente · planificadas 8 repeticiones · pausa de 2 s abajo» y «Serie 3: Pendiente · planificadas 6 repeticiones».
   - **El campo «Reps» está vacío.** *Captura 11.*
14. Registrá la serie 1 con 60 kg × **10**, la 2 con **8** y la 3 con **5**, distinto de lo planificado a propósito.
   - **Esperado:** cada serie guardada dice lo que escribiste, y la 3 queda en **5**, no en 6.
   - «Motivo (opcional)» muestra la ayuda «Si cambiaste algo de lo planificado o no pudiste entrenar, podés contar por qué.».
   - Marcá «Realizada» → «Revisar sesión» → «Confirmar sesión». *Captura 12.*
15. **Tu historial** → «Tus planes» → la versión vigente.
   - **Esperado:** la prescripción completa, igual que en Hoy. *Captura 13.*

### Fase 9 · Website, DEMO-PT: comparación histórica (PF-03)

16. Entrenamiento → **Ejecuciones** → la sesión de hoy → «Ver detalle».
   - **Esperado:** «Planificado» muestra las indicaciones y la pirámide completa.
   - En «Registro original»: «Serie 1: 60 kg × 10 reps · … · planificadas 10», «Serie 2: … 8 reps … · planificadas 8» y «Serie 3: … 5 reps … · planificadas 6».
   - Sin porcentajes ni calificaciones. *Captura 14.*
17. En el período, la **Sesión A del 25 de sept** → «Ver detalle».
   - **Esperado:** «Planificado» muestra la prescripción **de aquella versión**, «3 × 8» con «RIR 2», «Carga sugerida: 60 kg» y «Descanso: 90 s», **no la pirámide**.
   - Las series registradas dicen «planificadas 8». *Captura 15.*
18. **Plan** → el plan activo muestra la pirámide. El historial lista dos versiones activadas.

### Fase 10 · Regresión breve (APK 0.12.0)

19. **Tu historial** → una sesión registrada → volver con el enlace «Volver a Tu historial» y, otra vez, con el **gesto o botón Atrás**.
   - **Esperado:** vuelve a Tu historial en los dos casos (DL-096).
20. **Hoy** → «Ver registro» de la sesión de hoy → volver: vuelve a Hoy.
21. En el detalle de una ejecución → **«Corregir registro»** → tocá «Reps» y «RIR».
   - **Esperado:** con el teclado abierto, los campos se ven y «Registrar corrección» es alcanzable.
   - No hace falta guardar. *Captura 16.*

**Qué cierra esta tanda.**
- Con las fases 4, 6 y 7 en verde, se puede cerrar **DL-104**.
- Con las fases 8 y 9, la parte de APK de **DL-105**.
- Con las fases 1, 4, 5 y 7, el recorrido de **PF-02** en el ambiente desplegado.
- «Implementado», «CI verde», «publicado» y «verificado en el teléfono» se informan por separado.

## Hallazgo no bloqueante registrado (no se corrige en esta tanda)

**Media-baja · series pendientes con numeración discontinua.**
- **Dónde:** la APK calcula las series pendientes por cantidad de registros: `p.sets.slice(registradas)`, numeradas `registradas + i + 1` ([`apps/mobile/src/pantallas/entrenamiento.tsx:614`](../../apps/mobile/src/pantallas/entrenamiento.tsx) y `:645`).
- **Qué falla:** si un borrador llega con índices discontinuos (por ejemplo, solo la serie 3 registrada), la pantalla muestra como pendientes las series 2 y 3 en lugar de la 1 y la 2, con lo planificado corrido.
- **Alcance:** no altera lo guardado ni lo que ve el profesional. Es previo a PF-03, que solo agregó lo planificado a esas líneas. Lo detectó la auditoría de los #106 y #107.
- **Corrección propuesta, para otra tanda:** calcular las pendientes por `setIndex` (las planificadas cuyo índice no está registrado), con una prueba de un borrador con índices discontinuos.

Solo datos sintéticos. Sin credenciales.
