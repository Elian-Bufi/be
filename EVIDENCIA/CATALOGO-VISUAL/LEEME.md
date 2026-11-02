# Catálogo visual · zonas e imágenes de la demostración

> **En dos frases.** Acá están la propuesta de zonas musculares de los 20 ejercicios que usan las cuentas de la
> demostración y las dos herramientas que las cargan, junto con las fotos. Ninguna corrió contra test: por omisión solo
> dicen lo que harían, y escribir pide la autorización de Dirección y `--confirmo-escritura`.

## Qué hay

| Archivo | Qué es |
|---|---|
| `ejercicios-de-la-demo.json` | Los 20 ejercicios por identidad: los 12 de WP-06 por su `exerciseId` (igual en todos los ambientes) y los 8 propios de la cuenta PRO_T (Prof. Martín Acosta), por la versión que guardó la carga de la cohorte en `estado.json`. Nunca por el nombre. |
| `zonas-propuestas.json` | La propuesta de zonas, con su estado (`PROPUESTA` hasta que Dirección la revise). |
| `PROPUESTA-DE-ZONAS.md` | La misma propuesta como tabla, para revisarla (`node herramientas/zonas.mjs tabla`). |
| `imagenes.json` | El manifiesto de las fotos E04 a E23: archivo, texto alternativo, autoría, licencia y revisión técnica. |
| `herramientas/zonas.mjs` | Carga las zonas: las propias por la API (API-EJE-04), las del catálogo con el comando de curaduría de BE. |
| `herramientas/fotos.mjs` | Carga las fotos: las propias por la API (API-MED-01, 02 y API-EJE-02), las del catálogo con el comando. |
| `herramientas/figura-del-website.cjs` | Achica el set de capas de Dirección a `apps/web/public/zonas/` (la figura del website). No escribe en ninguna base. |

## Cómo se usa

Desde `EVIDENCIA/CATALOGO-VISUAL/herramientas`, con Node 22. `--destino` es el de la cohorte (`local` o `test`, con las
guardias de `DASHBOARD-PROFESIONAL/herramientas/datos/cohorte/destino.mjs`): de ahí salen la API, la base, las cuentas y el
estado. Ninguna herramienta imprime una credencial ni la URL de la base.

```bash
node zonas.mjs tabla                              # la propuesta como tabla, sin red
node zonas.mjs revisar --destino local            # solo lee: qué cambiaría
node fotos.mjs revisar                            # solo mira los archivos
node fotos.mjs revisar --destino local            # y qué ejercicio ya tiene foto
```

Para escribir (solo con la autorización de Dirección para ese destino):

```bash
npm run build:api                                 # el comando de curaduría vive en apps/api/dist
node zonas.mjs cargar --destino test --operador "<quién>" --fundamento "<por qué>" --confirmo-escritura
node fotos.mjs cargar --destino test --curador <correo administrador> --operador "<quién>" --fundamento "<por qué>" --confirmo-escritura
```

- `zonas.mjs cargar` se niega mientras la propuesta diga `PROPUESTA`: Dirección la revisa y pone `"estado": "REVISADA"` con su
  nombre y la fecha.
- Las zonas y las fotos de los 12 de WP-06 las escribe el comando de curaduría de BE (`curaduria-comando.js`) en la base del
  destino: en test hay que abrir la IP de be-db-test para esta máquina mientras dura la carga, como con la cohorte.
- Las fotos del catálogo quedan a nombre de una cuenta administradora de BE (`--curador`); la base lo exige.
- Repetir una carga no suma nada: las zonas iguales y la misma imagen se reconocen.

## Lo que falta

- Que Dirección revise la propuesta de zonas.
- Las imágenes (en `C:/Users/bufim/BE-material-visual/ejercicios/nuevas/originales/`, con el código adelante) y los textos
  alternativos de E04 a E15, que están en las fichas de `MATERIAL-VISUAL/EJERCICIOS.md` (PR #219).
- Integrar la rama, desplegar test y correr las dos cargas con autorización.
