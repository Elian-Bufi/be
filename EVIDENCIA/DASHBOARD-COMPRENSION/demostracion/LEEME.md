# Demostración local de #154 · la experiencia del profesional

Para revisar, como profesional, el estado actual del PR #154 (WP-DASHBOARD-COMPRENSION con su pasada de corrección y
usabilidad). Todo es local y sintético: ni `test` ni producción, ni personas reales.

## Qué se usa (verificado el 2026-10-09)

| Qué | Valor | Cómo se verificó |
|---|---|---|
| Versión | Rama `wp-dashboard-comprension` en el head del PR #154; el código del producto es el de `269d930` | `git` igual a `origin` y al head del PR; sin diferencias de código entre `269d930` y el head |
| Compilación | API (`apps/api/dist`, 10:11) y web estática (`apps/web/out`, 10:22) | Ningún archivo de código es posterior a la compilación; lo compilado contiene lo de la pasada («Distintas de lo indicado» en la web, `QUANTITIES_DIFFER_FROM_PLAN` en la API) |
| PostgreSQL | El lanzador versionado `herramientas/postgres-local`, con `BE_PG_DATOS` apuntando al clúster que ya existía, en `:55442`. Desde el 9/10 a las 14:23, a su copia persistente: `C:\Users\bufim\BE-datos-locales\postgres-comprension\datos` | Arrancado y apagado con los comandos de abajo, tal cual, sobre el original. La copia es idéntica (misma huella SHA-256, apagado limpio); su primer arranque se verifica con `comprobar-base.mjs` |
| Base | `be_test_comprension` | La API tiene su conexión a esa base y a ninguna otra (`pg_stat_activity`); `/health/ready`: base y migraciones OK |
| Datos | El escenario sintético generado el 9/10 a las 12:36 (recuperado, no regenerado) | Ver «Recuperación» |

El commit no aparece en `/health` ni en el pie: la compilación local no lo estampa.

## Recuperación del 2026-10-09 (13:20)

A las 12:43 Claude Code cortó, por falta de memoria, la tarea que tenía levantado PostgreSQL, y el servidor se cayó sin
apagarse. Se recuperó la base existente, sin regenerar:

1. El clúster estaba entero (PostgreSQL 16), con un `postmaster.pid` viejo de un proceso que ya no existía.
2. PostgreSQL hizo su recuperación automática: «database system was interrupted», «automatic recovery in progress»,
   «redo done», un checkpoint de fin de recuperación y «ready to accept connections». Después se lo apagó y se lo volvió
   a levantar en orden: el segundo arranque ya no necesitó recuperación.
3. Comprobaciones, con la API conectada solo a `be_test_comprension`:
   - **Escenario de comprensión:** 10/10 (`datos/generar.mjs verificar-comprension`): los cortes, la aplicación, la
     próxima revisión, el borrador de Entrenamiento, lo nuevo por clase y el asesorado E.
   - **Datos de las cuatro tareas:** 5/5 (`comprobar-datos.mjs`, en esta carpeta): las dos etapas de Nutrición, el
     contraste por modo de registro y la evidencia de la revisión.
   - **Inicio de sesión y ficha del asesorado A en el navegador:** `humo.mjs` entró por el formulario, abrió el Resumen,
     la Línea de tiempo y Analizar, sin errores en la página.
   - La verificación de la base (`datos/generar.mjs verificar`) **no aplica** después del escenario D: está hecha para
     correr antes de él (en la regeneración va antes), y ahora falla justo en lo que el escenario D agrega (las meriendas
     del 22, 25 y 29 de agosto, sus semanas, las sesiones de la sentadilla, las tomas y la carga tardía).

## Memoria del equipo

El equipo tiene 5,9 GB de RAM. Durante la recuperación había **entre 300 y 550 MB disponibles**, con 16 GB comprometidos:
Windows paginaba mucho. Lo que más ocupa no es de esta demostración (Claude Code, unos 1,9 GB; los servicios del
sistema; un MySQL de unos 600 MB; los agentes de seguridad y del fabricante). Lo de la demostración es chico: la API
(unos 130 MB), la web (50 MB) y PostgreSQL.

**La terminal propia para PostgreSQL no resuelve la falta de RAM.** Lo único que hace es sacarlo de las tareas de
Claude Code, que las corta cuando la memoria es crítica y la sesión está quieta (eso es lo que pasó a las 12:43). Con
este margen la demostración anduvo, pero lenta: si la memoria se agota, Windows puede trabar o cerrar cualquier proceso,
también estos. Lo que daría margen es cerrar programas que no se usan o tener más RAM, y eso lo decidís vos.

La medición del 9/10 a las 14:21, antes de cerrar el proceso de Claude Code abierto desde el 28/9, y cómo compararla en
el proceso nuevo están en `docs/paquetes/REANUDACION-COMPRENSION.md` («Medición de memoria»).

## Arrancar

**1. PostgreSQL, en una terminal propia** (PowerShell; queda abierta mientras dure la demostración):

```powershell
$env:BE_PG_DATOS = 'C:\Users\bufim\BE-datos-locales\postgres-comprension\datos'
Set-Location 'C:\Users\bufim\BE-Best-entrenamiento\EVIDENCIA\DASHBOARD-PROFESIONAL\herramientas\postgres-local'
& 'C:\Users\bufim\AppData\Roaming\fnm\node-versions\v22.23.2\installation\node.exe' iniciar.mjs be_test_comprension
```

Está listo cuando dice «Directorio de datos: C:\Users\bufim\BE-datos-locales\postgres-comprension\datos», «Base
existente: be_test_comprension» y «PostgreSQL 16 listo en :55442». Si el directorio o la base no estuvieran, se niega y
lo dice: no crea nada sin `--crear`.

**2. La API y la web**, si no están arriba (Git Bash; vuelven al instante y siguen en segundo plano):

```bash
cd /c/Users/bufim/BE-Best-entrenamiento/EVIDENCIA/DASHBOARD-PROFESIONAL/herramientas
export PATH="/c/Users/bufim/AppData/Roaming/fnm/node-versions/v22.23.2/installation:$PATH"
export BE_TRABAJO="$PWD/trabajo-comprension"
export BE_E2E_DATABASE_URL=postgresql://be_test:be_test@localhost:55442/be_test_comprension
./entorno.sh api "$(sed -n 's/^BE_DEMO_PROFESIONALES=//p' trabajo-comprension/demo-profesionales.txt)"
./entorno.sh web
```

Si la API ya estaba arriba, se reconecta sola cuando vuelve PostgreSQL: no hace falta reiniciarla.

**Comprobar** (Git Bash, en la misma carpeta y con las mismas exportaciones; solo leen, salvo las capturas de `humo`):

```bash
BE_PG_DATOS='C:\Users\bufim\BE-datos-locales\postgres-comprension\datos' node ../../DASHBOARD-COMPRENSION/demostracion/comprobar-base.mjs
node ../../DASHBOARD-COMPRENSION/demostracion/comprobar-datos.mjs
node humo.mjs
```

El directorio en uso y la base; los datos de las cuatro tareas; el inicio de sesión y la ficha del asesorado A en el
navegador (Chrome sin ventana: va solo, sin otra tarea pesada al mismo tiempo).

**3. Entrar:** `http://localhost:3000/login`, en Chrome o Edge, ventana de escritorio (1440 × 900 o 1280 × 800) y zoom al
100 %. El profesional sintético es el `proCorreo` de `trabajo-comprension/estado.json` (hoy,
`pro-seguimiento-mv14obkf@example.invalid`; cambia si se regenera), con la clave `clave-sintetica-de-prueba-01`. El
asesorado A tiene Nutrición, Entrenamiento y Antropometría; el E, solo Nutrición, sin revisiones y con el plan activado
hoy.

## Apagar

1. **La web y la API** (Git Bash, con las cuatro líneas de exportación de arriba): `./entorno.sh parar-web &&
   ./entorno.sh parar-api`.
2. **PostgreSQL:** Ctrl+C en su terminal. O, desde otra PowerShell, el apagado probado:

   ```powershell
   $env:BE_PG_DATOS = 'C:\Users\bufim\BE-datos-locales\postgres-comprension\datos'
   & 'C:\Users\bufim\AppData\Roaming\fnm\node-versions\v22.23.2\installation\node.exe' 'C:\Users\bufim\BE-Best-entrenamiento\EVIDENCIA\DASHBOARD-PROFESIONAL\herramientas\postgres-local\parar.mjs'
   ```

   Ctrl+C pasa por el mismo apagado ordenado, pero no lo pude ejercitar sin una consola interactiva; `parar.mjs` sí está
   probado. Los datos quedan.

**Dónde están los datos:** el clúster vivía en la carpeta temporal de la sesión de trabajo de Claude, donde una limpieza
de temporales de Windows podía borrarlo. Por pedido de Elián, el 9/10 a las 14:23 se lo copió, con PostgreSQL apagado,
a una carpeta persistente fuera de Temp y del repositorio: `C:\Users\bufim\BE-datos-locales\postgres-comprension\datos`
(al lado, un `LEEME.txt` con su origen y su huella). Desde entonces `BE_PG_DATOS` apunta a la copia. El original
(`…\Temp\claude\C--Users-bufim-BE-Best\3346bb7e-6e05-4c25-8870-f25c09d1d771\scratchpad\pg\datos`) se conserva sin
cambios y ya no se arranca; borrarlo lo decide Elián, después de que la copia pase su primer arranque.

## Cómo usar estos archivos

1. **`TAREAS.md`:** los cuatro objetivos, sin instrucciones. Intentá resolverlos primero así.
2. **`INSTRUCCIONES.md`:** el paso a paso de cada tarea y qué deberías ver. Abrilo solo si te trabás, o al final.
3. **`DIFICULTADES.md`:** donde anotamos lo que cueste, confunda o falle.
4. **`RECARGA-Y-SESION.md`:** por qué recargar la web cierra la sesión (DL-012).
5. **`comprobar-datos.mjs`:** la comprobación de solo lectura de los datos de las tareas.
6. **`comprobar-base.mjs`:** la comprobación de solo lectura del directorio de datos en uso, la base y sus clientes.
7. **`medir-memoria.ps1`:** la medición breve de memoria (RAM disponible, memoria comprometida, `claude.exe` y los
   servicios de la demostración), siempre con las mismas métricas.

## Para tener en cuenta

- **Recargar la página cierra la sesión:** es una decisión documentada (DL-012), no un defecto (ver
  `RECARGA-Y-SESION.md`). Navegá con los enlaces de la pantalla.
- **Cinco intentos de inicio de sesión cada 15 minutos.** Si se bloquea, reiniciar la API lo libera.
- **La tarea 4 cambia los datos:** registrar una revisión mueve el corte de su área. Por eso va última.
- **El escenario está armado para el 9/10:** otro día, lo que dice «hace 20 días» o «hoy» se corre.
- **Pendientes humanos que siguen abiertos:** la prueba con lector de pantalla (`../LECTOR-DE-PANTALLA.md`) y la revisión
  de Dirección de las decisiones de #154. Esta demostración no los cierra.
