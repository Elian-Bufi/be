# Reanudación de WP-DASHBOARD-COMPRENSION

> Nota viva del encargo del 2026-10-09 (evolución del dashboard profesional). Se actualiza en cada hito para poder seguir
> si la sesión se corta. **No es evidencia:** la evidencia está en `EVIDENCIA/DASHBOARD-COMPRENSION/`.
>
> **Última actualización: 2026-10-09, 14:35, cierre ordenado del proceso de Claude Code.** Elián pidió cerrar el proceso
> viejo (abierto desde el 28/9) para bajar el consumo de memoria y seguir en uno nuevo sin perder contexto ni datos. Lo
> que dice esta nota se comprobó entre las 14:20 y las 14:35; lo pendiente está en «Qué se comprobó y qué falta».

## Próximo objetivo: la demostración del dashboard

Hacer con Elián la demostración de #154 (`EVIDENCIA/DASHBOARD-COMPRENSION/demostracion/`). Antes, en la sesión nueva:

1. Leer esta nota y comprobar el estado actual: rama, commit, cambios locales, PR y puertos.
2. Medir la memoria con `medir-memoria.ps1` **antes de levantar nada** (ver «Medición de memoria»).
3. Levantar **solo** la demostración: PostgreSQL desde la copia persistente (en la terminal de Elián), la API y la web.
4. Verificar la base (es el primer arranque de la copia), el inicio de sesión y la ficha del asesorado A.
5. Medir otra vez y comparar con la medición inicial, con las mismas métricas y los mismos servicios.

Sin agregar funciones, sin recompilar (las compilaciones están al día), sin baterías completas, sin merge ni despliegue.
Una tarea pesada por vez: el recorrido con Chrome (`humo.mjs`) va solo, y se mide después de que termine.

## Dónde está el trabajo

| Qué | Valor |
|---|---|
| Carpeta | `C:\Users\bufim\BE-Best-entrenamiento`, un árbol de trabajo de git del repositorio `C:\Users\bufim\BE-Best` |
| Rama | `wp-dashboard-comprension`, igual a `origin` |
| Commit | El que trae esta versión de la nota, sobre `1c02264` (`git log -1`) |
| Cambios locales | Ninguno sin commit. Ignorados que se usan: `apps/api/dist`, `apps/web/out` y `packages/domain/dist` (las compilaciones) y `EVIDENCIA/DASHBOARD-PROFESIONAL/herramientas/trabajo-comprension/` (estado, registros, capturas). No limpiar con `git clean -x` |
| Claude Code | Se abre en `C:\Users\bufim\BE-Best`, donde está la memoria del proyecto. Esa carpeta está en otra rama (`wp-nutricion-recetas`, sin cambios) y no se toca para esto: el trabajo de #154 se hace en `BE-Best-entrenamiento`, con rutas absolutas |
| Decisiones | `docs/paquetes/WP-DASHBOARD-COMPRENSION.md` (§2: D-01 a D-33; §3: hitos); DL-129 y DL-130 en `docs/DEUDA_LEGAJO.md` |
| Guía de UX | `docs/ux/GUIA-UX-UI.md`, reorganizada en este encargo (Parte V: qué cambió) |

## PR #153 y #154 (comprobado con `gh` el 9/10 a las 14:25)

| PR | Rama → base | Estado | Head | CI |
|---|---|---|---|---|
| #153 WP-DASHBOARD-PROFESIONAL | `wp-dashboard-profesional` → `main` | Abierto, en borrador, sin conflictos | `6c8e0b4` | En verde: los cuatro controles |
| #154 WP-DASHBOARD-COMPRENSION | `wp-dashboard-comprension` → `wp-dashboard-profesional` | Abierto, en borrador, sin conflictos | `1c02264`; después, el commit de esta nota | En verde en `1c02264`; el commit nuevo, con `gh pr checks 154` |

#154 está apilado sobre #153: su diferencia se revisa contra `wp-dashboard-profesional`. Ninguno se integra ni se
despliega sin pedido. Cuando #153 se integre: `gh pr edit 154 --base main`; si entró con squash, traer `main` a la rama
con un merge y resolver los conflictos ahí, sin rebase ni reescritura de lo publicado.

## Versión y compilaciones

- El código del producto es el de `269d930`; los commits posteriores son evidencia, herramientas y documentos.
- Compilaciones del 9/10: API (`apps/api/dist`, 10:11), dominio (`packages/domain/dist`, 10:20) y web estática
  (`apps/web/out`, 10:22). A las 14:30 ningún archivo de código era posterior: no hace falta recompilar.
- El commit no aparece en `/health` ni en el pie: la compilación local no lo estampa.

## La base de la demostración

| Qué | Valor |
|---|---|
| Servidor | PostgreSQL 16 con los binarios de `herramientas/postgres-local`, puerto **55442**, usuario `be_test` |
| Base | `be_test_comprension`. El clúster tiene además las otras bases locales de prueba; `be_test_dashboard` es la de #153 y no se toca |
| Directorio de datos | **`C:\Users\bufim\BE-datos-locales\postgres-comprension\datos`**: la copia persistente, fuera de Temp y del repositorio, que se usa desde el 9/10 a las 14:23 |
| Original | `C:\Users\bufim\AppData\Local\Temp\claude\C--Users-bufim-BE-Best\3346bb7e-6e05-4c25-8870-f25c09d1d771\scratchpad\pg\datos`, conservado sin cambios. Ya no se arranca: queda de respaldo hasta que la copia pase su verificación, y borrarlo lo decide Elián |
| La copia | Hecha con PostgreSQL apagado (apagado limpio según `pg_control`) e idéntica al original: 9.243 archivos, 469.774.910 bytes, la misma huella SHA-256 de rutas, tamaños y contenidos (`be94d2cd5df5f996…`). Sin espacios de tablas ni rutas absolutas en la configuración. **Todavía no arrancó:** su recuperación se verifica en el primer arranque. Al lado, un `LEEME.txt` y una copia de `estado.json` y `demo-profesionales.txt` |
| Escenario | El generado el 9/10 a las 12:36 y recuperado a las 13:20. **No regenerar** |
| Variables | `BE_PG_DATOS` (el directorio de datos) para el lanzador y `comprobar-base.mjs`; `BE_TRABAJO` y `BE_E2E_DATABASE_URL` para `entorno.sh` y las comprobaciones; Node 22 en el `PATH` de Git Bash |

**No tocar:** el PostgreSQL de `:55432` (de otra sesión), MySQL, los servicios de Windows y las aplicaciones de Elián.

## Comandos para este equipo

### 1. PostgreSQL, en una terminal propia de Elián (PowerShell)

Va fuera de Claude Code porque Claude Code corta sus tareas de fondo cuando falta memoria (lo hizo el 9/10 a las 12:43).
Esto no resuelve la falta de RAM: solo evita ese corte.

```powershell
$env:BE_PG_DATOS = 'C:\Users\bufim\BE-datos-locales\postgres-comprension\datos'
Set-Location 'C:\Users\bufim\BE-Best-entrenamiento\EVIDENCIA\DASHBOARD-PROFESIONAL\herramientas\postgres-local'
& 'C:\Users\bufim\AppData\Roaming\fnm\node-versions\v22.23.2\installation\node.exe' iniciar.mjs be_test_comprension
```

Está listo cuando muestra `Directorio de datos: C:\Users\bufim\BE-datos-locales\postgres-comprension\datos`, `Base
existente: be_test_comprension` y `PostgreSQL 16 listo en :55442`. Sin `--crear` no crea nada: si falta el directorio
o la base, se niega y lo dice.

### 2. API y web (Git Bash)

```bash
cd /c/Users/bufim/BE-Best-entrenamiento/EVIDENCIA/DASHBOARD-PROFESIONAL/herramientas
export PATH="/c/Users/bufim/AppData/Roaming/fnm/node-versions/v22.23.2/installation:$PATH"
export BE_TRABAJO="$PWD/trabajo-comprension"
export BE_E2E_DATABASE_URL=postgresql://be_test:be_test@localhost:55442/be_test_comprension
./entorno.sh api "$(sed -n 's/^BE_DEMO_PROFESIONALES=//p' trabajo-comprension/demo-profesionales.txt)"
./entorno.sh web
```

PostgreSQL va primero: `entorno.sh api` espera a que la base responda (`/health/ready`). Sin `BE_E2E_DATABASE_URL`,
`entorno.sh` se niega, para no conectarse a la base de #153.

### 3. Verificar (Git Bash, en la misma carpeta y con las mismas exportaciones)

```bash
BE_PG_DATOS='C:\Users\bufim\BE-datos-locales\postgres-comprension\datos' node ../../DASHBOARD-COMPRENSION/demostracion/comprobar-base.mjs
node ../../DASHBOARD-COMPRENSION/demostracion/comprobar-datos.mjs
node humo.mjs
```

- **`comprobar-base.mjs`** (solo lee): que el directorio en uso sea la copia, que exista `be_test_comprension` y que
  los clientes (la API) no usen otra base. Sus consultas se ejercitan por primera vez en este arranque: si fallan por
  el script, corregirlo, no forzar el resultado.
- **`comprobar-datos.mjs`** (solo lee): inicia sesión una vez como el profesional sintético y comprueba los datos de las
  cuatro tareas (5 comprobaciones). Otro día que no sea el 9/10, avisa qué valores se corrieron en lugar de fallar.
- **`humo.mjs`**: entra por el formulario, abre el Resumen, la Línea de tiempo y Analizar del asesorado A y guarda una
  captura de cada uno en `trabajo-comprension/humo/`. Usa Chrome sin ventana: es la tarea pesada, va sola.

Cada una inicia sesión una vez; el límite es de cinco intentos cada 15 minutos (reiniciar la API los libera).

### 4. Apagar

- La web y la API (Git Bash, con las exportaciones del paso 2): `./entorno.sh parar-web && ./entorno.sh parar-api`.
- PostgreSQL: Ctrl+C en su terminal, o desde otra PowerShell (el apagado probado):

```powershell
$env:BE_PG_DATOS = 'C:\Users\bufim\BE-datos-locales\postgres-comprension\datos'
& 'C:\Users\bufim\AppData\Roaming\fnm\node-versions\v22.23.2\installation\node.exe' 'C:\Users\bufim\BE-Best-entrenamiento\EVIDENCIA\DASHBOARD-PROFESIONAL\herramientas\postgres-local\parar.mjs'
```

## La demostración

| Qué | Valor |
|---|---|
| URL | `http://localhost:3000/login`, en Chrome o Edge, ventana de escritorio (1440 × 900 o 1280 × 800), zoom al 100 % |
| Profesional sintético | `pro-seguimiento-mv14obkf@example.invalid`, clave `clave-sintetica-de-prueba-01` («Lic. Sofía Paz (sintética)»). Si el escenario se regenerara, el correo cambia (`proCorreo` de `trabajo-comprension/estado.json`) |
| Asesorado A | «Asesorado · 5db647»: Nutrición, Entrenamiento y Antropometría. El E tiene solo Nutrición, sin revisiones |
| Tareas | `TAREAS.md` tiene solo los objetivos; `INSTRUCCIONES.md`, el paso a paso y las respuestas. 1: comprender qué cambió. 2: comparar etapas. 3: explorar métricas de distintas áreas. 4: preparar una revisión con evidencia (va última: registrar la revisión cambia los datos) |
| Dificultades | Se anotan durante la demostración en `DIFICULTADES.md`, todavía vacío |
| A tener en cuenta | Recargar la página cierra la sesión: es la decisión DL-012, no un defecto (`RECARGA-Y-SESION.md`). El escenario está armado para el 9/10: otro día, lo relativo a «hoy» se corre y algunos números de `INSTRUCCIONES.md` pueden no coincidir; no se regenera por eso |

## Medición de memoria antes de cambiar de proceso

Con `EVIDENCIA/DASHBOARD-COMPRENSION/demostracion/medir-memoria.ps1`, que solo lee (en PowerShell:
`& 'C:\Users\bufim\BE-Best-entrenamiento\EVIDENCIA\DASHBOARD-COMPRENSION\demostracion\medir-memoria.ps1'`).
**Residente:** lo que el proceso ocupa ahora en la RAM física (working set). **Privada:** lo que reservó solo para él,
esté en la RAM o en el archivo de paginación (private bytes; cuenta en la memoria comprometida).

| | A: como estaba | B: después de apagar la API y la web |
|---|---|---|
| Hora | 9/10, 14:21 | 9/10, 14:22 |
| RAM disponible | 665 MB | 685 MB |
| Memoria comprometida / límite | 15,84 / 23,89 GB (66 %) | 15,65 / 23,89 GB (66 %) |
| `claude.exe` (PID 12996, desde el 28/9): residente | 908 MB | 958 MB |
| `claude.exe`: privada | 1.966 MB | 1.959 MB |
| Servicios de la demostración | Web (residente 6 MB, privada 52 MB) y API (16 y 129 MB); PostgreSQL :55442 apagado | Ninguno |

En las dos había un solo `claude.exe`, y estaban encendidos el PostgreSQL :55432 de la otra sesión y MySQL.

**Cómo comparar en la sesión nueva:**

- **Con B, los mismos servicios (ninguno de la demostración):** medir apenas abre la sesión, con el proceso viejo ya
  cerrado y antes de levantar nada. Esta es la comparación que muestra el efecto del proceso nuevo.
- **Con la demostración arriba (C):** medir otra vez después de verificar, con Chrome ya cerrado. Frente a A hay un
  servicio más (PostgreSQL :55442), así que con A solo se comparan las cifras de `claude.exe`, que no dependen de los
  servicios; C se informa aparte, sin restarle nada.
- Con un solo `claude.exe` y con `:55432` y MySQL encendidos, como en A y B. Si algo de eso cambió, decirlo.

## Qué se comprobó y qué falta

**Comprobado el 9/10, entre las 14:20 y las 14:35:**

- La rama, el commit y que no hay cambios sin commit; la rama, igual a `origin`.
- #153 y #154 abiertos, en borrador, sin conflictos y con la CI en verde (en `1c02264`).
- Las compilaciones, posteriores a todo el código.
- La web y la API, apagadas con `entorno.sh`: terminaron sus procesos (también `nohup` y sus consolas) y los puertos
  3000, 3001 y 55442 quedaron libres. PostgreSQL :55442 ya estaba apagado. Siguen intactos `:55432`, MySQL y lo demás.
- La copia del clúster, idéntica al original y con apagado limpio.
- `medir-memoria.ps1`, corrido dos veces (A y B). `comprobar-base.mjs`, solo la sintaxis y su respuesta con PostgreSQL
  apagado.

**Falta, en la sesión nueva:**

- El primer arranque de la copia y su verificación: el directorio en uso es la copia, la base está, la API usa solo
  `be_test_comprension`, y funcionan el inicio de sesión y la ficha del asesorado A.
- Las mediciones en el proceso nuevo y la comparación.
- La demostración con Elián y el registro de sus dificultades.
- Cuando la copia haya pasado: Elián decide si se borra el original de Temp. No se borra sin ese pedido.

**Pendientes humanos (la demostración no los cierra):**

- La prueba con lector de pantalla con una persona (`EVIDENCIA/DASHBOARD-COMPRENSION/LECTOR-DE-PANTALLA.md`; NVDA no
  está instalado).
- La revisión de Dirección: D-01 a D-33, DL-129 y DL-130, y la guía de UX (Parte V).

## Otros pendientes de BE (referencias, para no perderlos)

El detalle está en la memoria del proyecto (`MEMORY.md`, que se carga sola si Claude Code se abre en
`C:\Users\bufim\BE-Best`). Los PR se comprobaron con `gh` el 9/10; lo demás sale de la memoria.

- **PR abiertos:** #151 (la foto de «Comí algo diferente», defecto de la 0.15.0-candidata.1; requiere APK nueva) y #152
  (iniciar una sesión de entrenamiento con otra en curso), listos y sin integrar; #144 y #145, borradores de DL-117 que
  no se integran; #153 y #154, arriba.
- **APK:** la 0.15.0-candidata.1 (prerelease, versionCode 25) espera la validación en el teléfono (DL-118, DL-122 a
  DL-124). En `test`, el plan Piernas A está activado desde el 8/10.
- **Plazos:** la entrega es el 2026-10-20; la base de `test` vence alrededor del 18/10; la excepción de auditoría
  DL-114 (node-forge y braces) vence el 2026-10-31.
- **Decisiones de Dirección pendientes:** DL-126 a DL-128 (#153), DL-129 y DL-130 (#154), DL-125 (EVIDENCIA_VISUAL) y las
  anteriores que lista la memoria.
- **Diferidos:** aplicar las paletas Azul noche y Claro al website; TalkBack y los halos del tronco en la figura del
  teléfono.

## Historia del encargo

| Commit | Qué |
|---|---|
| `c1a23aa` | Dominio y lecturas (hito 2) |
| `cc17ba2`, `96cbb49` | Web: Resumen, preguntas, análisis, etapas y acciones (hitos 3 y 4) |
| `1661c69` | Código del encargo, verificado entonces: `capturas` 73/73, `funcional` 59/59, `revocacion` 6/6, regresión de #153 70/70, `mirar` 18/18; dominio 585, scripts 297, API 80, integración 49 |
| `ea50bb2`, `6afa526`, `643c603` | Documentos, la nota de reanudación y el lanzador de PostgreSQL (D-27) |
| `269d930` | La pasada de corrección y usabilidad (D-28 a D-32), el código vigente: `capturas` 79/79, `funcional` 75/75, regresión de #153 70/70, `mirar` 20/20; dominio 590, scripts 301, API 80, integración 50 |
| `fba1d89` | La evidencia y la matriz de la pasada |
| `1c02264` | La demostración y su disponibilidad: el lanzador sobre un clúster existente (D-33) y los materiales de `demostracion/` |
| el de esta nota | Continuidad: la copia persistente del clúster, `medir-memoria.ps1`, `comprobar-base.mjs` y esta nota |

La pasada de corrección (pedido de Dirección del 9/10) está hecha: cobertura de Nutrición en días del rango (defecto,
D-28), evidencia de la revisión agrupada (D-29), modo de registro y diferencia comprobada (D-30), Analizar con la
pregunta de etapas (D-31) y el alcance de «no calificar» en la guía (D-32); la verificación, en `ACEPTACION.md` (P-1 a
P-5).

Un error mío durante la pasada: la API reiniciada sin `BE_E2E_DATABASE_URL` apuntó a `be_test_dashboard` (la base de
#153) y dejó dos rechazos de inicio de sesión en su auditoría, que no se borran. `entorno.sh` ya no lo permite.

## Si Dirección pide cambios

Levantar la base y los servicios (arriba), cambiar, y repetir solo los recorridos que toca el cambio:
`herramientas/recorrido-comprension.mjs mirar | capturas | funcional | revocacion` y la regresión `recorrido.mjs
funcional`. Reiniciar la API antes (el límite de inicios de sesión está en memoria). `funcional` registra una revisión
sintética, así que las capturas van antes. Para la integración: `TEST_DATABASE_URL=…/be_test_integ_comprension`.
