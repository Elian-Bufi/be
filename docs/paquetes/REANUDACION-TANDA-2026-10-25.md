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
| A · Administración | **en curso**: dominio, base, API, website, pruebas y recorrido hechos; faltan evidencia, guía, guion y revisión de seguridad | `wp-administracion` · `C:/Users/bufim/BE-admin` | #210 (borrador) | `8b2dc99` |
| B · #195 sustitución | sin empezar | `wp-apk-sustitucion` | #195 | — |
| C · comparación de Nutrición | sin empezar | — | — | — |
| Ensayo conjunto | sin empezar | — | — | — |

## Commits de A (en orden)

1. `1cac891` — definición completa (`docs/paquetes/WP-ADMINISTRACION.md`, DL-155/156/157).
2. `fcb2b25` — dominio, migraciones, API, comando interno.
3. `87d0d3f` — 27 pruebas de integración de los diez criterios; corrección de neutralidad en solicitudes de vínculo.
4. `a8360c4` — consola `/admin` del website y recorrido de navegador `administracion`.
5. `8b2dc99` — TEST-CT de la familia ADM (la CI fallaba solo ahí) y la clave del segundo factor en base64 común.

## Comprobaciones hechas

- Dominio 873/873 (local). API unitarias 159 + 1 nueva de la clave (local).
- Integración local (PG embebido :55462, base `be_admin_int`): administración 27/27; contrato 21/21 con el bloque ADM; las
  suites de reanudación, sesiones, Google, concurrencia, novedades, vínculo, cierre, esquema, máquinas, PDP y lecturas de
  las APK pasaron después de los cambios de la API (antes de `a8360c4`).
- CI de `87d0d3f`: verificar, recorridos, imagen y legajo verdes; integración falló solo en TEST-CT (cubierto en `8b2dc99`).
- Recorrido `administracion` local (base `be_recorridos_admin`): pasa en 19 s; capturas revisadas en los dos temas
  (lista, ficha, confirmación, conflicto, historial, seguridad, entrada y segundo factor). Sin QR, clave ni códigos.
- Mutaciones (antes de la consola): 6 de 6 detectadas.

## Siguiente acción

1. Mirar la CI de `8b2dc99`.
2. `EVIDENCIA/ADMINISTRACION/`: capturas, `OPERACION.md` (primer administrador, recuperación, bitácora), guía breve de
   estudio y guion de revisión con las respuestas aparte.
3. Revisión de seguridad (saltear el MFA, lectura indebida, decisión duplicada, conflicto silencioso, automatización que
   pisa una decisión humana) y cierre de A en la nota.
4. Etapa B (#195).

## Entorno de la máquina

- Node 22 con fnm; `gh` en `/c/Program Files/GitHub CLI`. Una tarea pesada por vez (RAM 5,9 GB, ~1 GB libre).
- En el worktree nuevo: `node_modules` movido desde `BE-200` (rama ya integrada), uniones de `@be/*` rehechas y
  `npx prisma generate` corrido (cliente real, 12,7 MB). Dependencia nueva: `otpauth` 9.5.2 en `@be/api`.
- PostgreSQL embebido propio en :55462 (clúster en el scratchpad de la sesión, `pg-admin`), bases `be_admin_shadow`,
  `be_admin_int`, `be_admin_diff` y `be_recorridos_admin`. Se apaga al terminar con `node parar.mjs` y el mismo entorno
  (`BE_PG_DATOS`, `BE_PG_PUERTO=55462`) desde `EVIDENCIA/DASHBOARD-PROFESIONAL/herramientas/postgres-local` de
  `BE-Best-entrenamiento`. No tocar :55432 ni :55442.
- Recorrido local: `npm run build -w @be/api`; `BE_API_BASE_URL=http://localhost:3101 npm run build -w @be/web`;
  `BE_RECORRIDOS_DATABASE_URL=postgresql://…@localhost:55462/be_recorridos_admin node test/navegador/correr.mjs <salida> --solo administracion`.
