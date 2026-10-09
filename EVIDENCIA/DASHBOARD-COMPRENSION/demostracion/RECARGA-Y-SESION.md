# Por qué recargar la web cierra la sesión

Registro aparte, pedido el 2026-10-09 durante la preparación de la demostración de #154. **No se cambió la
autenticación**: esto solo dice qué es y de dónde sale.

## Clasificación: decisión documentada, no un defecto ni una limitación local

| Pregunta | Respuesta |
|---|---|
| ¿Es una limitación del entorno local? | **No.** Pasa igual en `test` (Render): no depende de la máquina, del puerto ni de la base. |
| ¿Es un defecto? | **No.** Es el comportamiento decidido para el website: el token de la sesión vive solo en la memoria de la página, y recargarla la vacía. |
| ¿Dónde está la decisión? | **DL-012** («Sesión: formato, transporte, TTL y renovación»), en `docs/DEUDA_LEGAJO.md`, **DECIDIDA el 2026-10-03**. |

## Qué dice la decisión

- **Opción A, la vigente en el website:** un JWT corto, con la fila de sesión verificada en cada pedido, que el cliente
  guarda solo en memoria (Bearer), sin renovación. El legajo lo dice así: «Recargar el website o reiniciar el APK obliga
  a volver a iniciar sesión» (07:537), y «JWT en memoria en el MVP» (07:789).
- **La decisión del 2026-10-03** cambió solo la APK: el token pasa al almacenamiento seguro del teléfono hasta que
  vence. Para el website dice, textual: «El website, que sigue con la opción A: la sesión vive en memoria».
- **Lo que no cambia:** la sesión dura 12 h desde el inicio, sin renovación (`renewable: false`), y la API verifica la
  fila de sesión en cada pedido, así que cerrar sesión o revocar corta en el pedido siguiente.
- **A favor de A:** no hay superficie de CSRF (no hay cookie) y nada de la sesión queda guardado en el navegador.
- **El costo:** recargar con F5, abrir un enlace en una pestaña nueva o volver a escribir la dirección obliga a volver a
  iniciar sesión. En la demostración se navega con los enlaces de la pantalla (la herramienta de humo hace lo mismo).

## Qué la cambiaría (no es de este encargo)

La condición de cierre de DL-012 es implementar el refresh rotativo (la opción B: cookie httpOnly en el website, con
renovación) o que Dirección ratifique A para el MVP. Cualquiera de las dos es una decisión de Dirección y un cambio de
autenticación; acá no se tocó.

## Si molesta durante la demostración

Se anota en `DIFICULTADES.md` como lo que es: una consecuencia de DL-012, con su impacto en la tarea. Sirve como dato
para esa decisión, no como un defecto a corregir en #154.
