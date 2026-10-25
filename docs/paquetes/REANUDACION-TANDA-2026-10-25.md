# Reanudación · tanda del 2026-10-25 (A Administración · B #195 · C comparación de Nutrición · ensayo)

Nota única de este encargo: se actualiza en cada hito, no en cada espera. Si el trabajo se corta, se retoma desde
«Siguiente acción».

**Encargos:** el de Administración (2026-10-25, D-1 a D-7 resueltas) y su ampliación del mismo día (A → B → C → ensayo
conjunto en una rama NO INTEGRAR → un solo cierre). Sin merge a `main`, sin despliegues, sin APK, releases ni etiquetas,
sin tocar la demostración compartida ni la tesis, sin reescribir historia publicada, sin regenerar las lecturas
congeladas de las APK.

**Punto de partida:** `main` = `3724d3d` (con #208, #200, #203 y #209). PR abiertos al empezar: #195 (sustitución de
ejercicios, APK), #193 (propuestas, docs), #199 (tesis), #204 (ensayo viejo, no reutilizar).

## Estado por etapa

| Etapa | Estado | Rama · worktree | PR | Último commit |
|---|---|---|---|---|
| A · Administración | **preparada**: definición, base, API, website, comando, pruebas (33 + TEST-CT), recorrido con capturas, procedimiento del operador y revisión de seguridad con sus correcciones | `wp-administracion` · `C:/Users/bufim/BE-admin` (sin `node_modules`: están en BE-comparacion) | #210 (borrador) | `b6dfa09` (CI verde, push y PR) |
| B · #195 sustitución | **preparada**: al día con main, R-5 con sus palabras, guion del teléfono; sin teléfono ni APK | `wp-apk-sustitucion` · `C:/Users/bufim/BE-Best/.claude/worktrees/agent-ad05c75238781c9c6` (sin `node_modules`) | #195 (borrador) | `d7ead1e` (CI verde) |
| C · comparación de Nutrición | **en curso**: definición (`WP-NUTRICION-COMPARACION.md`, DL-158), dominio (`indicado-del-plan.ts`, contrato aditivo de PRJ-01, copy) con 11 pruebas verdes; siguen API, website, recorrido | `wp-nutricion-comparacion` (desde `3724d3d`) · `C:/Users/bufim/BE-comparacion` (con `node_modules`, Prisma generado) | — | sin commits todavía |
| Ensayo conjunto | sin empezar | — | — | — |

## Commits de A (en orden)

1. `1cac891` — definición completa (`docs/paquetes/WP-ADMINISTRACION.md`, DL-155/156/157).
2. `fcb2b25` — dominio, migraciones, API, comando interno.
3. `87d0d3f` — 27 pruebas de integración de los diez criterios; corrección de neutralidad en solicitudes de vínculo.
4. `a8360c4` — consola `/admin` del website y recorrido de navegador `administracion`.
5. `8b2dc99` — TEST-CT de la familia ADM (la CI fallaba solo ahí) y la clave del segundo factor en base64 común.
6. `df2e341` — evidencia (capturas revisadas, `OPERACION.md`) y esta nota.
7. `65be9b3` — revisión de seguridad: F1 bloqueo por fallos seguidos, F2 pedidos simultáneos, F3 el comando y una
   confirmación al mismo tiempo, F4 otras sesiones al renovar, F5 auditoría de los guards, y el código de incorporación
   vigente al confirmar. Seis pruebas, cada una contra su mutación. Migraciones corregidas en el lugar (sin desplegar).
8. `b6dfa09` — la prueba de avisos lee en el orden de registro (en la CI de `8b2dc99`-push salieron invertidos una vez:
   `findMany` sin `orderBy`).

## Commits de B (en orden, sobre `294e1a8`)

1. `19a223d` — merge de main `3724d3d` (conflicto solo en DEUDA_LEGAJO).
2. `33b70b3` — R-5: sin conexión al buscar y sin respuesta al guardar, dichos con sus palabras; prueba nueva.
3. `d7ead1e` — guion del teléfono y revisión de DL-151.

## Comprobaciones hechas

- Dominio 873/873 (local). API unitarias 159 + 1 nueva de la clave (local).
- Integración local (PG embebido :55462, base `be_admin_int`): administración 27/27; contrato 21/21 con el bloque ADM; las
  suites de reanudación, sesiones, Google, concurrencia, novedades, vínculo, cierre, esquema, máquinas, PDP y lecturas de
  las APK pasaron después de los cambios de la API (antes de `a8360c4`).
- CI de `87d0d3f`: verificar, recorridos, imagen y legajo verdes; integración falló solo en TEST-CT (cubierto en `8b2dc99`).
- Recorrido `administracion` local (base `be_recorridos_admin`): pasa en 19 s; capturas revisadas en los dos temas
  (lista, ficha, confirmación, conflicto, historial, seguridad, entrada y segundo factor). Sin QR, clave ni códigos.
- Mutaciones (antes de la consola): 6 de 6 detectadas.

- Revisión de seguridad (otra instancia del modelo, de solo lectura): clases 2 a 5 sin hallazgos; cinco del segundo factor
  corregidos. Integración local después de las correcciones: Administración 33/33; contrato, sesiones, reanudación,
  esquema, máquinas, cierre, novedades, lecturas de las APK y despliegue 177/177; mutaciones 6/6; migrate diff vacío.
- CI de `b6dfa09` (A): las seis comprobaciones verdes en las dos corridas (push 40170723335 y PR 40170726171).
- B: pruebas de la APK 71/71, tipado de la APK, integración de la sustitución y lecturas de las APK 22/22 (con una
  configuración de Jest en el scratchpad: el patrón del repo no entra en la carpeta `.claude`). CI de `d7ead1e` verde.

## Siguiente acción

1. Etapa C, en BE-comparacion: API de PRJ-01 (`fuentes.ts`: macros del objetivo; `lectura-proyecciones.ts`:
   `objectiveSteps` y `planned`), prueba de integración, website (series, lienzo con la tercera capa, lectura, tabla,
   exportación, origen del dato, «Cómo se lee»), recorrido con capturas en los dos temas, DL-158, commit, PR en borrador.
2. Ensayo conjunto en una rama NO INTEGRAR; guía de estudio y guion de tareas con las respuestas aparte; informe final.

## Entorno de la máquina

- Node 22 con fnm; `gh` en `/c/Program Files/GitHub CLI`. Una tarea pesada por vez (RAM 5,9 GB, ~1 GB libre).
- `node_modules` está ahora en `BE-comparacion` (movido desde BE-admin, uniones de `@be/*` rehechas, Prisma generado,
  dominio construido). Para volver a trabajar en A o B, moverlo de nuevo y rehacer las uniones.
- En el worktree nuevo: `node_modules` movido desde `BE-200` (rama ya integrada), uniones de `@be/*` rehechas y
  `npx prisma generate` corrido (cliente real, 12,7 MB). Dependencia nueva: `otpauth` 9.5.2 en `@be/api`.
- PostgreSQL embebido propio en :55462 (clúster en el scratchpad de la sesión, `pg-admin`), bases `be_admin_shadow`,
  `be_admin_int`, `be_admin_diff` y `be_recorridos_admin`. Se apaga al terminar con `node parar.mjs` y el mismo entorno
  (`BE_PG_DATOS`, `BE_PG_PUERTO=55462`) desde `EVIDENCIA/DASHBOARD-PROFESIONAL/herramientas/postgres-local` de
  `BE-Best-entrenamiento`. No tocar :55432 ni :55442.
- Recorrido local: `npm run build -w @be/api`; `BE_API_BASE_URL=http://localhost:3101 npm run build -w @be/web`;
  `BE_RECORRIDOS_DATABASE_URL=postgresql://…@localhost:55462/be_recorridos_admin node test/navegador/correr.mjs <salida> --solo administracion`.
