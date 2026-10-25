# Reanudación · tanda del 2026-10-25 (Administración · comparación de Nutrición · sustitución · guía)

Nota única de la tanda. Se actualiza en cada hito, no en cada espera. Si el trabajo se corta, se retoma desde «Siguiente
acción».

**Estado: INTEGRADA en `main` y desplegada en test** (2026-10-25, entre las 19:12 y las 20:15 UTC), por autorización de
Dirección del mismo día. Test sirve `0be86b3` (#195) en la API y en el website. #212, la guía y esta nota, es solo
documentación: no entra en ningún filtro de Render y no redespliega nada. `be-recordatorios` sigue con su build, porque su
script no cambia desde `b6a79cb` (16/10). **No se construyó ninguna APK** ni se crearon releases, etiquetas o
administradores.

## Integración

| Paso | PR | Cabeza integrada (al día con `main`) | CI de la cabeza (los cinco trabajos) | Merge | CI de `main` | Despliegue en test |
|---|---|---|---|---|---|---|
| 1 | #214 · la clave del segundo factor | `0ff474f` | PR 40207639292 | `20a7152` | 40224934648 | be-api, por la sincronización del Blueprint (19:13 UTC); el website siguió en `3724d3d` |
| 2 | #210 · Administración | `7550f73` | push 40225009441 · PR 40225012541 (integración 890/890) | `ea70404` | 40226065383 | API (19:39 UTC, dos migraciones) y website |
| 3 | #211 · comparación de Nutrición | `91ec9d8` | push 40226157518 · PR 40226160764 (894/894) | `7079677` | 40227393381 | API (19:54 UTC) y website |
| 4 | #195 · sustitución en la APK | `73e46d1` | push 40227443168 · PR 40227446552 (898/898) | `0be86b3` | 40228864190 | API (20:11 UTC) y website (`package.json` y comentarios; el servidor no cambia) |
| 5 | #212 · guía y esta nota | ver el PR | ver el PR | ver el PR | ver el PR | ninguno: solo `docs/` |

- Antes de cada merge se comprobaron la cabeza exacta (`--match-head-commit`), el diff contra la base, que la rama
  estuviera al día y la CI. Ninguna corrida se repitió.
- #211 y #195 pasaron su base a `main` después de integrar #210, y cada uno se puso al día con un merge sin conflictos.
  Cada árbol fue igual al de una simulación previa de toda la cadena.
- En cada cabeza siguieron la corrección de la concurrencia, los cruces permanentes y las lecturas congeladas de las APK,
  idénticas a las de antes de la tanda. El legajo y el manifiesto no cambiaron.
- El árbol final de `main` es el del ensayo conjunto (#213, 898/898), más `render.yaml`, `docs/DESPLIEGUE.md` y esta
  documentación.

## Qué se comprobó en test, y qué no

Con un guion de solo lectura (fuera del repositorio), las cuentas sintéticas de la cohorte (PRO_N y PRO_T) y una sola
entrada por etapa. Bloquea en el navegador toda escritura que no sea abrir o cerrar la sesión:

- **Antes de empezar** (`3724d3d`): readiness, base, migraciones, el inicio de sesión, la cartera y la ficha.
- **En todas las etapas:** readiness, base y migraciones OK; el commit que sirven la API y el website; un rechazo de
  validación sin escritura; la entrada, la cartera, la ficha, cero errores de la API, de JavaScript o de consola, y el
  cierre de la sesión.
- **Desde #210:**
  - Administración sin sesión responde 401 y no 503: la clave del segundo factor está configurada y es válida. Se
    comprobó sin leer su valor;
  - `/admin` muestra «Entrar a Administración»;
  - con la sesión de una cuenta común, sus operaciones responden 403 `ACTION_FORBIDDEN`, sin datos;
  - la entrada administrativa con la contraseña de una cuenta común da el 401 neutral, sin abrir sesión. Esos rechazos
    quedaron auditados, como corresponde.
- **#211**, con los datos de la cohorte:
  - la comparación por la API, para las 5 personas de Nutrición, da un indicado por día con su motivo;
  - en «Analizar», con alternativas, la leyenda nombra las capas que se dibujan y no hay rombos, con la explicación de
    por qué;
  - la lectura del día da el motivo, y «Ver origen» trae cada comida con lo indicado de su opción;
  - no aparece «cumplimiento», «adherencia» ni un porcentaje.

  En test, todos los planes tienen alternativas o varios días tipo, así que los rombos los prueba la CI (recorrido
  `comparacion`). La comprobación necesitó tres intentos, ninguno por el producto:
  - el primero falló por falta de memoria en la máquina que comprueba (0,29 GB libres); la entrada directa por la API dio
    201;
  - el segundo encontró un error del guion: el botón dice «Ver origen de Calorías»;
  - el tercero pasó entero. El detalle está en #211.
- **#195**, con PRO_T: la búsqueda de ejercicios que usa la sustitución responde 200, con el origen en cada fila.
- **No se cambió ningún estado:** no se suspendió a nadie, no se creó ninguna cuenta ni ningún administrador, y no se tocó
  la cohorte ni a Diego Sosa. Suspender y rehabilitar, sus efectos en Nutrición y en Entrenamiento, y que no resuciten
  consentimientos ni vínculos quedan probados por la CI hasta preparar cuentas descartables.
- **No es una validación con personas.** La CI y estas comprobaciones prueban los casos escritos, no reemplazan a los
  profesionales ni a un lector de pantalla, y no son una garantía absoluta de seguridad.

## Configuración

- `BE_CLAVE_DEL_SEGUNDO_FACTOR` la creó Render al sincronizar el Blueprint con #214. En el panel, be-api → Environment la
  muestra con el valor oculto. Reemplazarla obliga a restablecer el segundo factor de cada administrador
  (`EVIDENCIA/ADMINISTRACION/OPERACION.md` §1).
- El push de #214 tocó `render.yaml`, así que una IP del operador habilitada a mano en be-db-test quedó cerrada.

## Siguiente acción (la decide Dirección)

### 1. Tu acceso administrativo en test

Lo hacés vos. El código de incorporación, la contraseña, el QR y los códigos de recuperación no pasan por el chat, por el
repositorio ni por mí. El detalle está en `EVIDENCIA/ADMINISTRACION/OPERACION.md` §2.

1. **La cuenta.** Creá una cuenta común en el website de test con un correo sintético que elijas
   (`<algo>@example.invalid`: en test, el comando solo acepta esos) y una contraseña nueva, guardada en tu gestor. No puede
   ser de un profesional ni de la demostración, ni tener vínculos o invitaciones.
2. **El comando.** En el Shell de be-api (panel de Render → be-api → Shell), sin un despliegue en curso:

   ```bash
   cd /app
   node apps/api/dist/administracion/comando.js incorporar \
     --correo <la cuenta> --nombre "<cómo querés figurar en el historial>" \
     --fundamento "Primer administrador de test, autorizado por Dirección" --operador "<vos>"
   ```

   Muestra **una sola vez** el código de incorporación, que tiene un solo uso y vence a las 24 horas. No lo copies:
   escribilo directo en el paso 3. Si vence sin usarlo, `restablecer-segundo-factor` con la misma cuenta da otro (§4).
3. **La entrada,** en `https://be-web-1ngj.onrender.com/admin`:
   - el correo, la contraseña y el código;
   - el QR en tu aplicación de códigos, o su clave a mano;
   - un código de seis dígitos para confirmar;
   - los diez códigos de recuperación, que se guardan fuera de esa computadora porque no se vuelven a mostrar.
4. **Que no ve datos de salud** (§2, «Comprobar que no accede a datos de salud»):
   - la ficha de un profesional muestra su perfil, la verificación y la habilitación por área y el historial;
   - de las personas, solo cuántas recibirían un aviso;
   - con esa cuenta, la entrada del website profesional dice que el correo o la contraseña no son válidos.
5. **La bitácora del operador:** fecha, quién, la cuenta, el fundamento y el resultado, sin el código. Después avisame:
   vuelvo a correr la comprobación de solo lectura.
6. **Suspender y rehabilitar en test** (si querés verlo en el ambiente) necesita un profesional descartable propio, nunca
   Sofía Paz, Martín Acosta, Lucía Benítez, los DEMO-P* ni Diego Sosa. Es un paso aparte, que conviene preparar junto con
   los datos de la candidata.

### 2. La candidata de la APK (la sustitución en el teléfono)

**Qué trae:** la sustitución de ejercicios (DL-151, #195: 4 archivos de `apps/mobile`) y el dominio compartido de `main`.
Desde la base de la candidata.3 (`4091d5e`), `main` no cambió nada más de la APK. La estable sigue siendo la 0.13.2.

Cada paso necesita tu autorización:
1. **Versión.** Propongo `0.18.0-candidata.1` (versionCode 30), porque trae una función nueva. La otra opción es
   `0.17.0-candidata.4`, si preferís que la próxima estable sea la 0.17.0.
2. **Rama:** `apk/candidata-0.18.0-1`, que es `main` más un commit que solo sube la versión en `apps/mobile/app.config.ts`.
   Nunca `package.json` ni el lock, que redesplegarían la API y el website.
3. **Construcción, en esta máquina y sola:**
   - `npm ci`;
   - `expo prebuild --clean` con las variables de test (la API, el website y el commit), y Firebase y el client ID de
     Google desde `BE-datos-locales`;
   - Gradle con un solo worker: la candidata.3 tardó 23 minutos con 0,9 GB libres, y con menos memoria puede pasar de una
     hora. Conviene cerrar antes lo pesado que no uses.
4. **Controles del artefacto,** como en la candidata.3:
   - la firma y el certificado (61569691…893e06);
   - el paquete y la versión;
   - los diez permisos;
   - el App Link de `/invitacion`;
   - Firebase y el client ID;
   - ninguna credencial adentro;
   - el commit embebido.
5. **Publicación:** prerelease `be-apk-0.18.0-candidata.1`, con el APK y su `.sha256`. `releases/latest` no se toca y
   sigue siendo la 0.13.2. Después se comprueba que el tag apunte al commit, que la estable no cambió y que la descarga
   pública dé el mismo SHA-256.
6. **Lecturas congeladas (DL-152):** al publicarla, un PR agrega lo que lee esa APK, con la búsqueda de la sustitución
   (API-TRN-13-BUSQUEDA). Las lecturas de la 0.13.2 y de la candidata.3 no se tocan.
7. **Datos para la prueba:** una persona y un profesional descartables, con «Prueba» en el nombre y correos
   `@example.invalid`; nunca la cohorte ni Diego Sosa. Un profesional nuevo en test sale del servicio interno, como los
   de la cohorte (DL-036), así que es un paso aparte que te propongo con lo que necesita.
8. **En el teléfono:** `EVIDENCIA/SUSTITUCION-DE-EJERCICIOS/GUION-DEL-TELEFONO.md` (T1 a T14 y R1 a R3), con TalkBack en
   T13. Con eso, decidís si pasa a estable.

## Pendientes registrados

- **Las tres propuestas de la pasada de cierre**, en `docs/paquetes/WP-ADMINISTRACION.md` §14, sin implementar:
  - F2 y F3 sin pausas;
  - una prueba de carrera para dos reemplazos del autenticador;
  - auditar los rechazos que ocurren dentro de la transacción.
- **Las pruebas humanas:**
  - el teléfono, con la candidata;
  - un lector de pantalla y profesionales (DL-153, DL-154 y DL-158);
  - personas con Administración, empezando por el primer administrador.
- **DL-114** vence el 2026-12-01 00:00 UTC (21:00 ART del 30/11): revisar antes y llevarlo a Dirección, sin prorrogarlo.

## Ramas y evidencia

- **Ramas integradas**, que quedan en el remoto porque no se borran solas: `config/clave-del-segundo-factor`,
  `wp-administracion`, `wp-nutricion-comparacion`, `wp-apk-sustitucion` y `wp-tanda-guia`.
- **#213** (ensayo conjunto) se cierra sin integrar. La rama `ensayo/tanda-2026-10-25-no-integrar` queda como evidencia,
  con su CI de 898/898 sobre el mismo código. Su prueba de diagnóstico ya no está: sus cruces viven en #211 y #195.
- **Evidencia de la tanda:**
  - `EVIDENCIA/ADMINISTRACION/` (`LEEME.md`, `OPERACION.md` y `CONCURRENCIA-DE-LA-RENOVACION.md`);
  - `EVIDENCIA/NUTRICION-COMPARACION/`;
  - `EVIDENCIA/SUSTITUCION-DE-EJERCICIOS/`;
  - la guía (`docs/guias/TANDA-2026-10-25*.md`);
  - las descripciones de los PR, con cada corrida y cada comprobación.

## Historia de la tanda

1. **Administración** (encargo del 2026-10-25, D-1 a D-7 resueltas) y su ampliación del mismo día: la sustitución (#195),
   la comparación de Nutrición (#211), la guía (#212) y el ensayo conjunto (#213, no se integra).
2. **Pasada de cierre** (mismo día):
   - la concurrencia al renovar los códigos de recuperación, confirmada y corregida;
   - los cruces del ensayo como pruebas permanentes en #211 y #195;
   - la clave del segundo factor en un PR de configuración (#214);
   - el alcance escrito.
3. **Integración** (mismo día, a la noche): Dirección ratificó el alcance y las reglas (DL-151, DL-155 a DL-158 y el
   segundo factor; ver DEUDA_LEGAJO) y autorizó integrar en el orden de arriba y desplegar en test.

## Entorno de la máquina

- Node 22 con fnm, y `gh`. Una tarea pesada por vez: hay 5,9 GB de RAM, y durante la integración quedaron entre 0,3 y 1 GB
  libres. Con poca memoria, Claude Code corta las tareas de fondo, así que las esperas de la CI y de Render se hicieron
  en primer plano.
- El PostgreSQL local de la tanda (:55462) está apagado: la integración no lo usó.
- `node_modules` está en el worktree de #195 (`.claude/worktrees/agent-ad05c75238781c9c6`).
