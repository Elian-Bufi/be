# Reanudación · tanda del 2026-10-25 (Administración · comparación de Nutrición · sustitución · guía)

Nota única de la tanda. Se actualiza en cada hito, no en cada espera. Si el trabajo se corta, se retoma desde «Siguiente
acción».

**Estado al 2026-10-26, 20:35 UTC: el entorno de la validación de uso está listo. La prueba con personas no se hizo.**
La tanda se integró el 2026-10-25. El 2026-10-26, con dos autorizaciones de Dirección:
- se publicó la candidata `0.18.0-candidata.1` como prerelease;
- se integraron #215 (el profesional descartable) y #216 (las lecturas congeladas de la candidata), y test sirve `e4512cb`;
- se cargaron y verificaron los escenarios descartables, y la base volvió a quedar cerrada al exterior;
- se preparó la prueba breve.

Falta lo que hace Dirección:
- su acceso administrativo;
- la prueba breve;
- el guion completo del teléfono.

Está en «Siguiente acción», más abajo.

**Integración (2026-10-25, entre las 19:12 y las 20:15 UTC).** Test sirve `0be86b3` (#195) en la API y en el website.
#212, la guía y esta nota, es solo documentación: no entra en ningún filtro de Render y no redespliega nada.
`be-recordatorios` sigue con su build, porque su script no cambia desde `b6a79cb` (16/10). Ese día no se construyó
ninguna APK ni se crearon releases, etiquetas o administradores.

## Validación de uso (2026-10-26)

**Autorizaciones de Dirección del 2026-10-26:**
- **a la mañana:** «Autorizo construir y publicar la APK "0.18.0-candidata.1" como prerelease, y preparar datos sintéticos
  descartables en test para comprobar Administración, la comparación y la sustitución. La estable no cambia.» No incluía
  merges de producto.
- **a la tarde:** «Autorizo integrar #215 y después #216 en main, incluidos los despliegues automáticos que correspondan».
  Autorizó también el acceso temporal a be-db-test, solo desde la IP de esta máquina, para cargar la historia
  sintética, y completar los datos de las seis cuentas «Prueba». La candidata sigue como prerelease.

| Qué | Estado |
|---|---|
| **La candidata** | **Publicada** el 2026-10-26 a las 09:51 (hora de Buenos Aires): `be-apk-0.18.0-candidata.1`, `be-0.18.0-candidata.1-b64d0c4.apk`, SHA-256 `e9686aee…2ce5`, versionCode 30. Commit `b64d0c4` = `main` en `2c4d445` más la versión (rama `apk/candidata-0.18.0-1`). Gradle, 39 min 54 s. Controles, publicación y descarga: `EVIDENCIA/PUBLICACION-0.18.0-candidata.1/` (en #216). La estable sigue siendo la 0.13.2 |
| **Las lecturas congeladas (DL-152)** | **Integradas** (#216, `e4512cb`). La nueva lee 81 operaciones: las 80 de la candidata.3, con la misma forma, más API-TRN-13-BUSQUEDA. CI de la cabeza: 909 de 909, con las tres APK leídas contra la API de hoy |
| **El profesional descartable** | **Integrado** (#215, `b40421d`): «Lic. Prueba Dos Áreas» en `BE_DEMO_PROFESIONALES`, a continuación de las ocho entradas anteriores, sin cambiarlas. Opera Nutrición y Entrenamiento |
| **Los datos descartables** | **Cargados y verificados.** Uno, Cuatro y Cinco, por la API. La historia de Nutrición de Dos y Tres, por SQL, con la IP de esta máquina habilitada de 19:57 a 20:26 UTC. La fase `verificar`, ahora estricta, comprobó los 6 escenarios sin diferencias; en pantalla, 48 de 48 controles. Detalle: `EVIDENCIA/PRUEBA-BREVE-2026-10-26/LEEME.md` y su carpeta `preparacion/` |
| **La prueba breve** | Preparada: `GUION.md` para quien prueba y `OBSERVADOR.md` para quien observa, con los valores confirmados y lo que queda para las personas. **No se hizo todavía:** no hay validación de uso con personas |

Las credenciales de las cuentas «Prueba» viven solo en `C:\Users\bufim\BE-datos-locales\prueba-test\cuentas.env`.

## Integración del 2026-10-26

| Paso | PR | Cabeza integrada (al día con `main`) | CI de la cabeza (los cinco trabajos) | Merge | CI de `main` | Despliegue en test |
|---|---|---|---|---|---|---|
| 1 | #215 · el profesional descartable | `ae3a7b8` | PR 40318120859 | `b40421d` (19:11 UTC) | 40384466745 | be-api, por la sincronización del Blueprint: sirve `b40421d` desde las 19:12:50 UTC. El website siguió en `0be86b3` |
| 2 | #216 · las lecturas de la candidata | `1a17538` | push 40385187377 · PR 40385194871 (integración 909/909) | `e4512cb` (19:30 UTC) | 40387350649 | API y website: sirven `e4512cb` desde las 19:43 UTC. No cambia el comportamiento |

- **#215:** antes del merge se comprobó que las ocho entradas anteriores siguen iguales y en su lugar, y que se agregan
  solo las dos del profesional descartable.
- **#216:** se puso al día con `main` después de #215. Corrigió dos frases que dejaban de ser ciertas, como «en un PR en
  borrador». Los congelados de la 0.13.2 y de la candidata.3 no cambiaron.
- **Después de los dos:**
  - readiness, base y migraciones en OK;
  - el profesional de prueba opera las dos áreas;
  - la cohorte sigue funcionando: solo lectura, una entrada por profesional y sin Diego Sosa.

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
- El push de #215 sincronizó el Blueprint: be-api se redesplegó con la entrada nueva, y la lista de IP de be-db-test
  quedó vacía (`ipAllowList: []`).
- **El acceso temporal del 2026-10-26** (`186.123.136.127/32`, para cargar la historia) se abrió y se cerró a mano en
  be-db-test → Networking → *PostgreSQL Inbound IP Rules*.
  - **Para vaciar la lista, Render pide dos pasos:** «Save», y después escribir «block all internet traffic to
    PostgreSQL». Sin el segundo, la entrada sigue vigente.
  - La regla del workspace («0.0.0.0/0 · everywhere») es aparte y no se toca. Con la lista de la base vacía, la base no
    se alcanza desde internet.
  - Cerrado y comprobado a las 20:26:48 UTC, con una conexión nueva que se rechaza. La API siguió conectada.

## Siguiente acción

### 1. Tu acceso administrativo en test (lo hacés vos)

El código de incorporación, la contraseña, el QR y los códigos de recuperación no pasan por el chat, por el repositorio ni
por quien te acompaña. El procedimiento es `EVIDENCIA/ADMINISTRACION/OPERACION.md` §2.

1. **La cuenta.** En `https://be-web-1ngj.onrender.com/register`:
   - el correo propuesto, `elian.administracion@example.invalid`, u otro que termine en `@example.invalid`;
   - una contraseña nueva de 12 caracteres o más, en tu gestor;
   - las tres casillas.

   Esa cuenta no se vincula con nada.
2. **El comando,** en Render → `be-api` → Shell, sin un despliegue en curso:

   ```bash
   cd /app
   node apps/api/dist/administracion/comando.js incorporar --correo elian.administracion@example.invalid --nombre "Elián Bufi (Dirección)" --fundamento "Primer administrador de test, autorizado por Dirección el 2026-10-26" --operador "Elián Bufi"
   ```

   Muestra una sola vez el código de incorporación, que vence a las 24 h.
   - Si el Shell se corta antes de verlo y la cuenta ya es administradora, `restablecer-segundo-factor` con la misma
     cuenta da otro.
3. **La entrada,** en `/admin`:
   - el correo, la contraseña y el código;
   - el QR en la aplicación de códigos;
   - un código para confirmar;
   - los diez códigos de recuperación, que se guardan fuera de la computadora.
4. **Comprobar** (OPERACION.md §2): no ve datos de salud, y con esa cuenta el website profesional no entra. **No decidir
   sobre los profesionales de la demostración ni de la cohorte:** el único que se puede suspender es «Lic. Prueba Dos
   Áreas».

### 2. La prueba breve (los datos ya están cargados)

`EVIDENCIA/PRUEBA-BREVE-2026-10-26/GUION.md`, de 25 a 30 minutos, con `OBSERVADOR.md` para quien observa:
- Administración: suspender y rehabilitar Nutrición de «Lic. Prueba Dos Áreas» (necesita el punto 1);
- Nutrición: Prueba Dos y Prueba Tres en «Analizar», con la cuenta del profesional descartable;
- el teléfono: actualizar a la candidata y sustituir un ejercicio con Prueba Uno.

Si se hace otro día:
- el período de «Analizar» va del 18/10 al día de la prueba;
- Uno tiene la sesión disponible ese día, sin empezar;
- antes, `escenarios.mjs verificar` (solo lectura) dice si todo sigue como se preparó.

### 3. Después de la prueba breve

- El guion completo del teléfono (`EVIDENCIA/SUSTITUCION-DE-EJERCICIOS/GUION-DEL-TELEFONO.md`, T1 a T14 y R1 a R3), con
  TalkBack en T13. La prueba breve no lo reemplaza.
- La decisión de promover la candidata. Por DL-152 no pasa a estable sin esas pruebas. #216 ya está integrado.

## Pendientes registrados

- **Las tres propuestas de la pasada de cierre**, en `docs/paquetes/WP-ADMINISTRACION.md` §14, sin implementar:
  - F2 y F3 sin pausas;
  - una prueba de carrera para dos reemplazos del autenticador;
  - auditar los rechazos que ocurren dentro de la transacción.
- **Las pruebas humanas:**
  - la prueba breve (preparada y con los datos cargados el 2026-10-26, sin hacer);
  - el teléfono, con la candidata `0.18.0-candidata.1` (publicada);
  - un lector de pantalla y profesionales (DL-153, DL-154 y DL-158);
  - personas con Administración, empezando por el primer administrador.
- **A observar en la prueba breve, sin cambio de producto:** en la leyenda de «Analizar», «Hueco» nombra el punto vacío
  de un subtotal, y no el día sin registros, que se ve en gris. Está en `OBSERVADOR.md`, fila B3.
- **DL-114** vence el 2026-12-01 00:00 UTC (21:00 ART del 30/11): revisar antes y llevarlo a Dirección, sin prorrogarlo.

## Ramas y evidencia

- **Ramas integradas**, que quedan en el remoto porque no se borran solas: `config/clave-del-segundo-factor`,
  `wp-administracion`, `wp-nutricion-comparacion`, `wp-apk-sustitucion` y `wp-tanda-guia`; y, el 2026-10-26,
  `config/profesional-de-prueba` (#215) y `wp-lecturas-apk-0.18.0-candidata.1` (#216).
- **#217** (la prueba breve, esta nota y la evidencia de la preparación) sigue **en borrador**: es documentación y
  herramientas, y lo integra Dirección cuando quiera.
- La candidata se construyó desde la rama `apk/candidata-0.18.0-1` (`b64d0c4`), que queda en el remoto como la de las
  candidatas anteriores.
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
4. **Validación de uso** (2026-10-26, a la mañana): Dirección autorizó la candidata y los datos descartables.
   - Se publicó la candidata y se congelaron sus lecturas (#216).
   - Se preparó la prueba breve.
   - Se pidió el PR de configuración #215.
5. **Preparación del entorno** (mismo día, a la tarde): Dirección autorizó integrar #215 y #216 y el acceso temporal a
   la base.
   - Se integraron los dos, y test sirve `e4512cb`.
   - El verificador pasó a ser estricto.
   - Se cargaron y verificaron los escenarios.
   - La base volvió a quedar cerrada al exterior.

## Entorno de la máquina

- Node 22 con fnm, y `gh`. Una tarea pesada por vez: hay 5,9 GB de RAM, y durante la integración quedaron entre 0,3 y 1 GB
  libres. Con poca memoria, Claude Code corta las tareas de fondo, así que las esperas de la CI y de Render se hicieron
  en primer plano.
- El PostgreSQL local de la tanda (:55462) está apagado: la integración no lo usó.
- `node_modules` está en el worktree de #195 (`.claude/worktrees/agent-ad05c75238781c9c6`), que ahora tiene la rama de
  #216 (`wp-lecturas-apk-0.18.0-candidata.1`, integrada). Es el `BE_REPO` de las herramientas de la prueba breve. La
  candidata se construyó en `C:\b11`, con su propio `node_modules`.
- Los daemons de Gradle se apagaron al terminar la construcción.
- **La IP pública de esta máquina cambia:** el 2026-10-26 era `186.123.136.127`, y antes había sido `181.171.85.152`.
  Hay que comprobarla con dos servicios antes de pedir el acceso a la base.
- Con poca memoria, Claude Code cortó el vigilante que esperaba la IP. Las esperas que dependen de Dirección se resuelven
  con su aviso («IP lista», «guardado»).
