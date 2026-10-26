# Reanudación · tanda del 2026-10-25 (Administración · comparación de Nutrición · sustitución · guía)

Nota única de la tanda. Se actualiza en cada hito, no en cada espera. Si el trabajo se corta, se retoma desde «Siguiente
acción».

**Estado al 2026-10-26: validación de uso en preparación.** La tanda se integró el 2026-10-25 y está desplegada en test
(abajo). El 2026-10-26, con autorización de Dirección:
- se publicó la candidata `0.18.0-candidata.1` como prerelease;
- se preparó la prueba breve;
- se crearon las cuentas descartables.

Falta lo que hace Dirección: su acceso administrativo, integrar el PR de configuración #215 y la prueba con personas
(«Validación de uso», más abajo).

**Integración (2026-10-25, entre las 19:12 y las 20:15 UTC).** Test sirve `0be86b3` (#195) en la API y en el website.
#212, la guía y esta nota, es solo documentación: no entra en ningún filtro de Render y no redespliega nada.
`be-recordatorios` sigue con su build, porque su script no cambia desde `b6a79cb` (16/10). Ese día no se construyó
ninguna APK ni se crearon releases, etiquetas o administradores.

## Validación de uso (2026-10-26)

**Autorización de Dirección:** «Autorizo construir y publicar la APK "0.18.0-candidata.1" como prerelease, y preparar datos
sintéticos descartables en test para comprobar Administración, la comparación y la sustitución. La estable no cambia.»
No incluye merges de producto.

| Qué | Estado |
|---|---|
| **La candidata** | **Publicada** el 2026-10-26 a las 09:51 (hora de Buenos Aires): `be-apk-0.18.0-candidata.1`, `be-0.18.0-candidata.1-b64d0c4.apk`, SHA-256 `e9686aee…2ce5`, versionCode 30. Commit `b64d0c4` = `main` en `2c4d445` más la versión (rama `apk/candidata-0.18.0-1`). Gradle, 39 min 54 s. Controles, publicación y descarga: `EVIDENCIA/PUBLICACION-0.18.0-candidata.1/` (en #216). La estable sigue siendo la 0.13.2 |
| **Las lecturas congeladas (DL-152)** | **#216, en borrador**, con la CI en verde (909 de 909; las tres APK leídas contra la API de hoy). La nueva lee 81 operaciones: las 80 de la candidata.3, con la misma forma, más API-TRN-13-BUSQUEDA |
| **El profesional descartable** | **#215**, solo configuración: suma a «Lic. Prueba Dos Áreas» a `BE_DEMO_PROFESIONALES`, sin cambiar las ocho entradas anteriores. CI en verde (40318120859). **El merge lo hace Dirección:** el control de permisos de la sesión frenó el mío porque despliega |
| **Los datos descartables** | Hecha la fase `cuentas` (las seis altas, A3 y los nombres). Lo demás espera a que el profesional exista, o sea a #215. Cuentas, escenarios y cómo se cargaron: `EVIDENCIA/PRUEBA-BREVE-2026-10-26/LEEME.md` |
| **La prueba breve** | Preparada: `GUION.md` (quien prueba) y `OBSERVADOR.md` (las respuestas esperadas, calculadas aparte). **No se hizo todavía:** no hay validación de uso con personas |

**Lo que hace Dirección, en orden:**
1. **Su acceso administrativo:** «Siguiente acción», punto 1.
2. **Integrar #215** y esperar que `be-api` diga *Live*.
3. **Habilitar `181.171.85.152/32` en be-db-test → Networking** mientras se carga la historia de Nutrición (unos 10
   minutos), y quitarla después.
4. **La prueba breve.**

Las credenciales de las cuentas «Prueba» viven solo en `C:\Users\bufim\BE-datos-locales\prueba-test\cuentas.env`.

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

### 2. Los datos de la prueba (después de #215)

Con #215 integrado y la IP habilitada:
- `escenarios.mjs api`, `pasado` y `verificar`, con `BE_REPO` en el worktree que tiene `node_modules` (el de #195), desde
  `EVIDENCIA/PRUEBA-BREVE-2026-10-26/herramientas`;
- la comprobación en pantalla (`ver-prueba.mjs`, fuera del repo);
- `llenar-guion.mjs`, que completa `OBSERVADOR.md` con los valores confirmados.

Cada fase retoma lo hecho, sin repetirlo.

### 3. La prueba breve y el teléfono

- **La prueba breve** (`EVIDENCIA/PRUEBA-BREVE-2026-10-26/GUION.md`, 25 a 30 minutos):
  - Administración: suspender y rehabilitar Nutrición de «Lic. Prueba Dos Áreas»;
  - Nutrición: Prueba Dos y Prueba Tres en «Analizar»;
  - el teléfono: actualizar a la candidata y sustituir un ejercicio con Prueba Uno.
- **Después**, el guion completo del teléfono (`EVIDENCIA/SUSTITUCION-DE-EJERCICIOS/GUION-DEL-TELEFONO.md`, T1 a T14 y
  R1 a R3) con TalkBack, y la decisión de promover la candidata. Por DL-152 no pasa a estable sin esas pruebas y con #216
  integrado.

## Pendientes registrados

- **Las tres propuestas de la pasada de cierre**, en `docs/paquetes/WP-ADMINISTRACION.md` §14, sin implementar:
  - F2 y F3 sin pausas;
  - una prueba de carrera para dos reemplazos del autenticador;
  - auditar los rechazos que ocurren dentro de la transacción.
- **Las pruebas humanas:**
  - la prueba breve (preparada el 2026-10-26, sin hacer);
  - el teléfono, con la candidata `0.18.0-candidata.1` (publicada);
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
4. **Validación de uso** (2026-10-26): Dirección autorizó la candidata y los datos descartables. Se publicó la candidata,
   se congelaron sus lecturas (#216, en borrador), se preparó la prueba breve y se pidió el PR de configuración #215.

## Entorno de la máquina

- Node 22 con fnm, y `gh`. Una tarea pesada por vez: hay 5,9 GB de RAM, y durante la integración quedaron entre 0,3 y 1 GB
  libres. Con poca memoria, Claude Code corta las tareas de fondo, así que las esperas de la CI y de Render se hicieron
  en primer plano.
- El PostgreSQL local de la tanda (:55462) está apagado: la integración no lo usó.
- `node_modules` está en el worktree de #195 (`.claude/worktrees/agent-ad05c75238781c9c6`), que ahora tiene la rama de
  #216 (`wp-lecturas-apk-0.18.0-candidata.1`). La candidata se construyó en `C:\b11`, con su propio `node_modules`.
- Los daemons de Gradle se apagaron al terminar la construcción.
