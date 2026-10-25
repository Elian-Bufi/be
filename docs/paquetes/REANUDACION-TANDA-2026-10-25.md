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
| A · Administración | **en curso**: definición escrita | `wp-administracion` · `C:/Users/bufim/BE-admin` | — | — |
| B · #195 sustitución | sin empezar | `wp-apk-sustitucion` | #195 | — |
| C · comparación de Nutrición | sin empezar | — | — | — |
| Ensayo conjunto | sin empezar | — | — | — |

## Comprobaciones hechas

- (ninguna todavía)

## Siguiente acción

Implementar A: dominio (decisiones, vigencias, contratos, copy), migración, API (acceso administrativo con TOTP,
decisiones, avisos, siembra), comando interno, pruebas de integración; después el website y el recorrido.

## Entorno de la máquina

- Node 22 con fnm; `gh` en `/c/Program Files/GitHub CLI`. Una tarea pesada por vez (RAM 5,9 GB, ~0,8 GB libres).
- En el worktree nuevo: `node_modules` movido desde `BE-200` (rama ya integrada), uniones de `@be/*` rehechas y
  `npx prisma generate` corrido (cliente real, 12,7 MB). Dependencia nueva: `otpauth` 9.5.2 en `@be/api`.
