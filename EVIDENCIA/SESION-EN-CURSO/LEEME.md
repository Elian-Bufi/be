# Una sesión abierta de otro día no frenaba el inicio de otra (APK 0.15.0-candidata.1)

**Estado (2026-10-08): causa comprobada y corrección implementada en la rama `arreglo/sesion-en-curso-al-iniciar`.**
- Las pruebas locales dan 296 de 296 y el tipado pasa.
- **Falta probarlo en el teléfono, con una APK nueva.** La API y el website no cambian.

## Lo que se vio en el teléfono

En `test`, DEMO-A01 tenía abierta una «Sesión A» del 6/10: la empezó Dirección en una prueba de ese día. El 7/10, Inicio
mostraba «Iniciar entrenamiento». Se pudo entrar a una sesión nueva, y el conflicto apareció después, al registrar una
serie.

Lo que hay en la API (lecturas del 2026-10-08):

| Borrador | Estado |
|---|---|
| Sesión A del 6/10 (`c44e0c15`) | Corrida en curso con 18 eventos. El último descanso (de la serie 1 de `rx-banca`) quedó abierto. API-TIE-04 la informa como la sesión en curso |
| Sesión A del 7/10 (`c9d4e5f1`) | Borrador creado, **sin ningún evento**: la API rechazó su inicio (`ANOTHER_SESSION_IN_PROGRESS`). Sin series guardadas |

## La causa

- **La regla de la API está bien.** API-TIE-01 no deja iniciar una sesión si el titular tiene otra empezada y sin
  terminar, de cualquier día.
- **`useAbrirOcurrencia.abrir()`, el circuito compartido de Inicio y Entrenamiento, miraba solo el teléfono.** Buscaba
  otra sesión abierta en el almacén local. La del 6/10 no estaba ahí como abierta, así que creaba el borrador nuevo
  (API-TRN-15) y empezaba la corrida.
- **El inicio se mandaba sin esperar.** La pantalla seguía, y el rechazo aparecía más tarde, en el estado del envío.
- **Inicio ni siquiera mostraba la sesión en curso de otro día.** Entrenamiento sí la mostraba, pero dejaba tocar
  «Iniciar» igual.
- **La salida era incómoda.** La sesión enfocada mandaba a resolverlo «desde Entrenamiento» y reintentar a mano. Un
  «Dejarlo incompleto» sobre una sesión con el inicio rechazado quedaba cerrado en el teléfono pero sin enviar.

## La corrección (solo la APK)

- **`apps/mobile/src/sesion-en-curso.ts`:** antes de iniciar se mira primero la sesión en curso que informa la API
  (API-TIE-04), de cualquier día y dispositivo, y después el teléfono. La misma ocurrencia se retoma. Es lógica pura.
- **`abrir()`:** consulta antes de abrir el borrador. Si hay otra sesión, **no crea nada** y la tarjeta ofrece
  «Continuar entrenamiento» o «Dejarlo incompleto», con el motivo. Dejada incompleta, vuelve a intentar el inicio.
- **Inicio:**
  - lee la sesión en curso con la misma clave que Entrenamiento;
  - muestra la de otro día arriba, con las dos acciones;
  - marca «Continuar» en la sesión que está en curso.
- **Lo que se muestra va primero por la API**, en Inicio y en Entrenamiento: esa es la sesión que bloquea. Resuelta, se
  muestra la del teléfono, si queda alguna.
- **En la sesión enfocada,** con el inicio rechazado, el aviso dice cuál es la otra sesión y permite continuarla o
  dejarla incompleta desde ahí. Después reenvía los mismos eventos de esta.
- **«Dejarlo incompleto»** reintenta lo pendiente de esa sesión antes de esperar el envío.
- **Lo escrito se conserva:**
  - las series viajan con API-TRN-17 aunque los tiempos estén frenados;
  - los eventos rechazados quedan pendientes y se reenvían iguales, con sus instantes de entonces;
  - un reenvío de lo ya guardado es `DUPLICATE`.

## Pruebas

- `scripts/sesion-en-curso.test.mjs` (nuevo), 7 de 7:
  - la decisión y lo que se muestra;
  - en el almacén, con la regla del dominio de API-TIE-01: el inicio rechazado no pierde nada, la serie escrita viaja
    igual, el reintento manda los mismos eventos sin duplicar, y «Dejarlo incompleto» sobre el inicio rechazado guarda la
    sesión entera, con el fin declarado y no afirmado;
  - el código de las tres pantallas.
- `scripts/inicio.test.mjs`, ajustada por la lectura nueva de Inicio. Todas las pruebas de `scripts/`: 296 de 296.
- **Con datos reales de `test`, solo lectura:** con la respuesta actual de API-TIE-04, iniciar la «Sesión A» de hoy
  queda bloqueado por la del 6/10, y eso es lo que muestran Inicio y Entrenamiento.
- **No es el teléfono:** hace falta una APK nueva.

## En el mismo pedido, sin cambiar código

- **Plan con «Piernas A»:**
  - la capacidad estaba registrada (`adviseeClientCapable: true`);
  - se activó como DEMO-PT el 2026-10-08 a las 10:54:45 UTC (versión `284a9858`);
  - los borradores del 6/10 y del 7/10 siguen intactos, leídos por su id;
  - confirmar un borrador acepta cualquier versión activada del seguimiento, así que se pueden cerrar o registrar.
- **«Descanso: 90 s»:**
  - en `rx-banca` (Sesión A), los 90 s son un **parámetro del profesional**: un rótulo libre, como «Tempo». No son un
    objetivo estructurado (`restSeconds` es `null`), así que el control de descanso dice bien «sin duración indicada», y
    no se deduce nada del texto;
  - «Piernas A» sí tiene descansos estructurados: 90 s, con 120 y 150 s en algunas series.
