# Publicación preparada · APK 0.12.0 (PF-03 incremento 1 + DL-104)

**Estado: PREPARADA, NO CONSTRUIDA NI PUBLICADA.** Es una sola publicación que reúne dos cambios de la APK. Se construye recién cuando Dirección audite e integre los PR de PF-03 y dé la orden. Mientras tanto, la APK vigente sigue siendo la **0.11.3** (`be-apk-0.11.3`, versionCode 16).

## Qué incluye

| Cambio | Decisión | Estado en `main` |
|---|---|---|
| El rechazo de un formulario dice qué campo corregir y qué valores admite | DL-104, opción A | Integrado (#104, `db9fcda`); EN CURSO hasta esta comprobación |
| Lo planificado, visible y comparable: «Hoy», la sesión y el historial con la prescripción completa, y lo planificado como referencia al registrar | DL-105 (PF03-D-1 A) | PR-1 (#106, dominio y website) y PR-2 (APK), para auditoría |

**No incluye:** descanso estructurado, alternativas preaprobadas, cuestionarios nuevos, objetivos nutricionales por tipo ni tolerancia del cliente a propiedades desconocidas. Ninguno está aprobado.

**Compatibilidad.** Ninguno de los dos cambios toca las respuestas que lee la APK: la 0.11.3 sigue funcionando igual contra la API actual. Quien no actualice ve el resumen reducido de siempre y el mensaje genérico ante un número fuera de rango.

## Prerrequisitos

1. Los dos PR de PF-03 integrados en `main`, con la CI verde sobre el commit de `main` que se va a construir.
2. El árbol de trabajo limpio en ese commit: el commit queda embebido en la APK (07 §34, TEST-APK-008).
3. La orden de Dirección para construir y publicar.

## Versión

- En `apps/mobile/app.config.ts`, **solamente**: `VERSION = '0.12.0'` y `versionCode: 17`.
- **No** se tocan `apps/mobile/package.json` ni el lockfile: un cambio ahí vuelve a desplegar la API y el website (`buildFilter` de `render.yaml`), y la publicación no lo necesita.
- La subida de versión va en un PR propio, integrado con la CI verde, y el build se hace sobre ese commit de `main`.

## Construcción (build local con Gradle, misma firma)

- Procedimiento: [`EVIDENCIA/HISTORIAL-ENTRENAMIENTO/build-local-0.11.1.md`](../HISTORIAL-ENTRENAMIENTO/build-local-0.11.1.md) y sus repeticiones de 0.11.2 y 0.11.3. Gradle nativo en Windows, en un worktree limpio del commit, porque la cuota de EAS no alcanza y `eas build --local` no corre en Windows.
- **Firma:** la existente, con las variables de entorno del procedimiento (`BE_FIRMA_*`) y el respaldo protegido fuera del repositorio. **No se genera ni se reemplaza la clave.** El certificado tiene que ser el mismo que el de la 0.11.3.
- Si Gradle se queda sin recursos, se repite con `org.gradle.workers.max=1`. No se corren pruebas ni agentes en paralelo con Gradle.

## Verificación del artefacto, antes de publicar

- `versionName` 0.12.0 · `versionCode` 17.
- Commit embebido igual al de `main` que se construyó.
- Mismo certificado de firma que la 0.11.3 (`apksigner verify --print-certs`). Si no coincide, no se publica.
- Control de secretos del procedimiento sobre el bundle y `assets/app.config`.
- SHA-256 del archivo, anotado.

## Publicación

- Release permanente `be-apk-0.12.0` con el archivo `be-0.12.0-<commit corto>.apk`, marcado Latest. Se conservan las anteriores.
- Fila APK de `docs/DESPLIEGUE.md` actualizada: vigente, SHA-256, «construida localmente con Gradle».
- La API y el website no cambian con la publicación.

## Comprobación en el teléfono (Dirección)

Cada paso se informa con la hora y una captura. «Implementado», «CI verde», «publicado» y «verificado en el teléfono» se informan por separado.

**A · Antes de actualizar, con la 0.11.3.**
1. «Hoy» abre con un plan que tiene una pirámide y notas por serie. Muestra el resumen reducido de siempre, sin errores: la 0.11.3 no se rompe.

**B · DL-104, con la 0.12.0**, en «Antecedentes para entrenamiento», al responder y al corregir:
2. Con «9» en días por semana, junto al campo dice «Es más de lo que se admite. Ingresá un número entero entre 1 y 7 días por semana.», y el resumen se anuncia.
3. Con «9» días y «45,5» minutos, se marcan los dos campos a la vez.
4. Lo escrito sigue en pantalla. Al corregir, el mensaje del campo se va y el envío se registra.
5. Sin conexión aparece «No pudimos confirmar el resultado. Reintentá.», con el botón «Reintentar». No aparece el mensaje de dato no aceptado.

**C · PF-03, con la 0.12.0:**
6. «Hoy» muestra la pirámide serie por serie («Serie 1: 10», «Serie 2: 8 · pausa de 2 s abajo», «Serie 3: 6»). También la intensidad con su referencia, la carga sugerida, los parámetros con su unidad y la nota.
7. Al entrar a la sesión, arriba aparecen «Indicaciones de la sesión».
8. Registrando por serie, cada serie pendiente dice «Pendiente · planificadas N repeticiones». **El campo de repeticiones está vacío.** Si se registra otro número, queda el que escribió la persona.
9. «Tu historial» muestra lo planificado completo de cada sesión.
10. El motivo de la sesión muestra la ayuda «Si cambiaste algo de lo planificado o no pudiste entrenar, podés contar por qué.».

**D · Regresión:**
11. Volver desde «Tu historial» y desde «Hoy», con el botón y con el gesto (DL-096): sigue igual.
12. Responder un formulario dentro del rango sigue funcionando.

Con A a D en verde se cierran DL-104 y la parte de APK de PF-03 (DL-105).

Solo datos sintéticos. Sin credenciales.
