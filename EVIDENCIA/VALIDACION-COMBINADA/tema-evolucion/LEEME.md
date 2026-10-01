# Validación combinada · apariencia configurable (#118) + evolución antropométrica visual (#116)

Los dos PR están abiertos y sin integrar. Esta carpeta guarda la verificación de su **interacción** (el gráfico de evolución en las dos apariencias), hecha sobre una rama temporal local que no se subió.

- **Composición:** `feat/evolucion-antropometrica-visual` en `7d30e9f` + `feat/apariencia-configurable` en `782b91e`, mezcladas con `git merge` sin conflictos (merge local `55ee7af`, rama `tmp/combinada-tanda2`, borrada después). Base común: `main` en `53cc70e`.
- **Fecha:** 2026-09-30. Entorno local: API compilada de `main`, PostgreSQL 16 embebido, `next dev`, Chrome sin interfaz, datos sintéticos (los de `EVIDENCIA/ANTROPOMETRIA-EVOLUCION/`, tanda 2). **No es el ambiente `test` desplegado.**
- **Controles:** `recorrido-tema.mjs --con-evolucion`, **21/21**: los 20 de la apariencia (primera visita, HTML servido, selector accesible, conserva lo escrito, cara pública, persistencia, figura, valor inválido, almacenamiento bloqueado con navegación al espacio profesional, móvil) más el de la combinación:

| Control | Claro → Azul noche | Resultado |
|---|---|---|
| El gráfico de evolución cambia punto, cuadrícula, rótulos de los ejes y fondo del lienzo con la apariencia | punto `rgb(194,65,12)` → `rgb(255,155,92)`; cuadrícula `rgb(213,222,234)` → `rgb(30,68,112)`; rótulos `rgb(71,85,105)` → `rgb(169,193,218)`; fondo `rgb(255,255,255)` → `rgb(10,46,82)` | ✅ |

Capturas: `03-evolucion-claro.png` y `04-evolucion-azul-noche.png` (la misma serie de cintura, con dos grupos homónimos y el rombo de no comparabilidad, en cada apariencia); `01-login-azul-noche.png` y `05-figura-azul-noche.png` como contexto de la misma corrida.

Al integrar los dos PR, esta verificación se repite sobre `main` si cambia alguno de los dos heads.
