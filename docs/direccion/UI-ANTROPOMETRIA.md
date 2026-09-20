# Dirección — cómo tiene que verse y funcionar la toma antropométrica

**Fecha:** 2026-09-20 · **Origen:** instrucción de Dirección con referencia visual adjunta
**Referencia:** `BE-VIS-Compositor_v13.3.html` (en esta misma carpeta)
**Estado:** recibida después del cierre funcional de WP-05. **No se implementó en WP-05.** Entra como insumo del paquete de refinamiento de UI.

## Qué dijo Dirección, textual

> «Asi será aproximadamente las medidas antropometricas, usaremos la apariencia claro y azul… lo único es que lo ideal seria que la carga sea en el campo o un campo cerca de la toma de la medida. Y luego lo de abrir csv era una prueba, la app tal vez tenga la opción el profecional de agregarlas asi, pero por el momento no.»

## Qué significa, en tres puntos

### 1. La toma se carga sobre la figura, no en una tabla aparte

Es el cambio de fondo. Hoy WP-05 muestra una **tabla de filas** (métrica, valor, unidad), que es lo que declara el 10 y lo que hacía falta para probar el circuito. La referencia propone otra cosa: una **silueta con los puntos de toma marcados**, y el valor se escribe **en el punto mismo o en un campo pegado a él**. El profesional ve dónde está midiendo mientras anota.

Por qué importa más allá de lo estético: la antropometría se toma con el calibre en la mano, mirando el cuerpo. Una tabla obliga a traducir «pliegue subescapular» a una fila de una lista; la figura elimina esa traducción y con ella el error de cargar un valor en la métrica equivocada.

### 2. Tema claro y azul

De la referencia, las variables que fijan la identidad:

| Token | Valor | Uso en la referencia |
|---|---|---|
| `--be` | `#2E8FFF` | azul principal |
| `--cy` | `#5FD4F0` | cian de apoyo |
| `--ring` | `#C4F0FF` | halo de los puntos de toma |

El compositor trae también tema oscuro; **no se usa**: Dirección eligió claro.

### 3. El CSV era una prueba, no un requisito

La referencia incluye «Abrir CSV…» e «Importar posiciones». Eso era experimentación de Dirección sobre el compositor, no una función pedida. Puede volver más adelante como una vía para que el profesional cargue mediciones en lote, **pero no ahora**.

Cuando vuelva, hay que resolverlo con lo que el legajo ya exige y WP-05 ya implementa: toda medición importada necesita su `source.type = CONTROLLED_IMPORT` con la referencia de preparación (06 §13; ver DL-062, que ya está abierta por esto mismo). O sea: el CSV no puede ser un atajo que se saltee la procedencia.

## Lo que no cambia

La referencia es de **presentación y carga**. No toca nada de lo que WP-05 dejó garantizado por debajo, y el paquete de UI no puede usarla para aflojar ninguna de estas:

- la evaluación sigue teniendo su frontera de registro (REG-06-215): lo que se carga sobre la figura está **en preparación** hasta que se registra;
- cada medición sigue llevando protocolo, unidad de origen y momento de la toma (RNF-DAT-002);
- corregir y anular siguen siendo actos separados y conservadores (RF-050);
- sigue sin haber diagnóstico, puntaje ni zona de color sobre la figura. Una silueta pintada de verde/amarillo/rojo por rango sería exactamente el juicio que RF-048 prohíbe: la figura ubica el punto de toma, no lo califica.

## Qué queda por decidir

Está anotado en `docs/DEUDA_LEGAJO.md` como **DL-073**, con sus dos opciones: el 10 (B10-07) declara la carga en formulario, y esta instrucción pide la carga sobre la figura.
