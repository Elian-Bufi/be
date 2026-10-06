# Medición local de Inicio

Generado por `medir-inicio.mjs` el 2026-10-04. **Datos sintéticos, servidor local y red simulada: no es una medición en el teléfono ni contra la API de test.**

- El cliente real de @be/domain y las lecturas reales de la APK. Tiempo del servidor por lectura: 60 ms (supuesto). Encabezados: 420 B de subida y 380 B de bajada por solicitud (supuesto).
- Redes: 4G lento (ida y vuelta 150 ms, 1,6 Mb/s de bajada); 3G lento (ida y vuelta 400 ms, 0,4 Mb/s de bajada); Wi-Fi (ida y vuelta 40 ms, 20 Mb/s de bajada).
- «En frío»: todas las solicitudes esperan a que se abra la conexión (dos viajes). «Con la conexión abierta»: volver a Inicio.
- «Utilizable»: llegó y se validó la respuesta que la tarjeta necesita para mostrar sus datos. Cada tiempo es la mediana de tres corridas.
- Bytes: el JSON tal como sale de la API, que hoy no comprime; entre paréntesis, cuánto pesaría con gzip.

## Típico

Registros de comida hoy, tres tomas recientes y 12 sesiones en 30 días, 3 de ellas corregidas.

| Tarjeta | Solicitudes | Bytes | 4G lento, en frío | 3G lento, en frío | Wi-Fi, en frío | 4G lento, con la conexión abierta |
|---|---|---|---|---|---|---|
| Para responder | 2 | 2,1 KB (1,0 KB) | 0,62 s | 1,51 s | 0,25 s | 0,29 s |
| Entrenamiento de hoy | 1 | 7,8 KB (0,9 KB) | 0,77 s | 2,06 s | 0,25 s | 0,44 s |
| Nutrición de hoy | 1 | 14,4 KB (1,4 KB) | 0,86 s | 2,47 s | 0,26 s | 0,53 s |
| Mediciones | 1 | 46,7 KB (2,5 KB) | 1,20 s | 3,79 s | 0,29 s | 0,87 s |
| Tu actividad | 1 | 105,1 KB (2,7 KB) | 1,50 s | 4,99 s | 0,31 s | 1,18 s |
| **Toda la visita** | **6** | **176,1 KB** (8,5 KB) | **1,50 s** | **4,99 s** | **0,31 s** | **1,18 s** |

## Sin registros de comida hoy

Como el típico, sin registros hoy: el último registro se pide aparte, después de «Hoy».

| Tarjeta | Solicitudes | Bytes | 4G lento, en frío | 3G lento, en frío | Wi-Fi, en frío | 4G lento, con la conexión abierta |
|---|---|---|---|---|---|---|
| Para responder | 2 | 2,1 KB (1,0 KB) | 0,60 s | 1,49 s | 0,25 s | 0,31 s |
| Entrenamiento de hoy | 1 | 7,8 KB (0,9 KB) | 0,74 s | 2,03 s | 0,25 s | 0,46 s |
| Nutrición de hoy | 1 | 13,3 KB (1,1 KB) | 0,82 s | 2,37 s | 0,27 s | 0,54 s |
| Nutrición · renglón del último registro | 1 | 0,7 KB (0,4 KB) | 1,09 s | 2,94 s | 0,44 s | 0,81 s |
| Mediciones | 1 | 46,7 KB (2,5 KB) | 1,17 s | 3,76 s | 0,30 s | 0,89 s |
| Tu actividad | 1 | 105,1 KB (2,7 KB) | 1,48 s | 4,96 s | 0,32 s | 1,19 s |
| **Toda la visita** | **7** | **175,6 KB** (8,6 KB) | **1,48 s** | **4,96 s** | **0,44 s** | **1,19 s** |

## Sin mediciones recientes

La última toma es de hace casi un año: Mi evolución mira hacia atrás, de a 90 días, hasta encontrarla.

| Tarjeta | Solicitudes | Bytes | 4G lento, en frío | 3G lento, en frío | Wi-Fi, en frío | 4G lento, con la conexión abierta |
|---|---|---|---|---|---|---|
| Para responder | 2 | 2,1 KB (1,0 KB) | 0,60 s | 1,47 s | 0,25 s | 0,30 s |
| Entrenamiento de hoy | 1 | 7,8 KB (0,9 KB) | 0,70 s | 1,87 s | 0,25 s | 0,40 s |
| Nutrición de hoy | 1 | 14,4 KB (1,4 KB) | 0,78 s | 2,15 s | 0,26 s | 0,47 s |
| Tu actividad | 1 | 105,1 KB (2,7 KB) | 1,25 s | 4,75 s | 0,30 s | 0,94 s |
| Mediciones | 4 | 35,2 KB (2,5 KB) | 1,52 s | 4,37 s | 0,73 s | 1,22 s |
| **Toda la visita** | **9** | **164,6 KB** (8,5 KB) | **1,52 s** | **4,75 s** | **0,73 s** | **1,22 s** |

## Historial con muchas correcciones

60 sesiones en 30 días, 20 de ellas corregidas, algunas dos veces.

| Tarjeta | Solicitudes | Bytes | 4G lento, en frío | 3G lento, en frío | Wi-Fi, en frío | 4G lento, con la conexión abierta |
|---|---|---|---|---|---|---|
| Para responder | 2 | 2,1 KB (1,0 KB) | 0,63 s | 1,52 s | 0,27 s | 0,32 s |
| Entrenamiento de hoy | 1 | 7,8 KB (0,9 KB) | 0,78 s | 2,06 s | 0,27 s | 0,47 s |
| Nutrición de hoy | 1 | 14,4 KB (1,4 KB) | 0,87 s | 2,48 s | 0,28 s | 0,56 s |
| Mediciones | 1 | 46,7 KB (2,5 KB) | 1,21 s | 3,80 s | 0,31 s | 0,90 s |
| Tu actividad | 1 | 538,6 KB (8,1 KB) | 3,75 s | 13,90 s | 0,53 s | 3,43 s |
| **Toda la visita** | **6** | **609,6 KB** (13,9 KB) | **3,75 s** | **13,90 s** | **0,53 s** | **3,43 s** |

## Alternativas medidas, no implementadas

En frío. Cada fila compara lo que hace hoy la APK con la alternativa, en la tarjeta afectada o en toda la visita.

| Alternativa | Red | Qué | Hoy | Con la alternativa |
|---|---|---|---|---|
| Mirar hacia atrás en paralelo (las tres ventanas anteriores juntas) | 4G lento | Mediciones | 1,52 s · 4 sol. · 35,2 KB | 1,19 s · 4 sol. · 35,2 KB |
| Mirar hacia atrás en paralelo (las tres ventanas anteriores juntas) | 3G lento | Mediciones | 4,37 s · 4 sol. · 35,2 KB | 3,46 s · 4 sol. · 35,2 KB |
| Mirar hacia atrás guiado por la sesión (visita posterior: las ventanas conocidas juntas) | 4G lento | Mediciones | 1,52 s · 4 sol. · 35,2 KB | 1,08 s · 4 sol. · 35,2 KB |
| Mirar hacia atrás guiado por la sesión (visita posterior: las ventanas conocidas juntas) | 3G lento | Mediciones | 4,37 s · 4 sol. · 35,2 KB | 3,30 s · 4 sol. · 35,2 KB |
| Resumen agregado de la actividad (D-4), típico | 4G lento | Tu actividad | 1,50 s · 1 sol. · 105,1 KB | 0,58 s · 1 sol. · 0,2 KB |
| Resumen agregado de la actividad (D-4), típico | 3G lento | Tu actividad | 4,99 s · 1 sol. · 105,1 KB | 1,38 s · 1 sol. · 0,2 KB |
| Resumen agregado de la actividad (D-4), historial pesado | 4G lento | Tu actividad | 3,75 s · 1 sol. · 538,6 KB | 0,59 s · 1 sol. · 0,2 KB |
| Resumen agregado de la actividad (D-4), historial pesado | 3G lento | Tu actividad | 13,90 s · 1 sol. · 538,6 KB | 1,39 s · 1 sol. · 0,2 KB |
| Respuestas comprimidas con gzip, típico | 4G lento | Toda la visita | 1,50 s · 6 sol. · 176,1 KB | 0,62 s · 6 sol. · 8,5 KB transferidos |
| Respuestas comprimidas con gzip, típico | 3G lento | Toda la visita | 4,99 s · 6 sol. · 176,1 KB | 1,53 s · 6 sol. · 8,5 KB transferidos |
| Respuestas comprimidas con gzip, historial pesado | 4G lento | Toda la visita | 3,75 s · 6 sol. · 609,6 KB | 0,69 s · 6 sol. · 13,9 KB transferidos |
| Respuestas comprimidas con gzip, historial pesado | 3G lento | Toda la visita | 13,90 s · 6 sol. · 609,6 KB | 1,69 s · 6 sol. · 13,9 KB transferidos |
