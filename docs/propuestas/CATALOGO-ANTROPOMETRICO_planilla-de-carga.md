# Catálogo antropométrico de BE · planilla de carga (DL-110)

Decisión de Dirección del 2026-09-30: los protocolos y los métodos de cálculo los define **BE**. Dirección pasa el contenido con su fuente y el ejecutor lo siembra en el catálogo (versionado, con procedencia y con pruebas). El profesional elige entre lo cargado; no arma protocolos ni fórmulas propias. Esta planilla dice qué hace falta de cada pieza para cargarla sin inventar nada.

Primeros pedidos de Dirección: protocolos de **9 y 7 componentes**, y métodos simples como **índice cintura-altura** e **IMC**. Más adelante, una sección de **bioimpedancia**, al menos para comparar, aunque los datos lleguen por archivo (CSV).

## Qué ya existe (sintético, para reemplazar o convivir)

| Pieza | Qué tiene | Rótulo |
|---|---|---|
| PROTO-LAB | peso (kg) y talla (m o cm) | sintético |
| PROTO-CUERPO | 16 mediciones: pliegues y perímetros | «no es un catálogo científico» |
| MET-DEMO v1 y v2 | peso ÷ talla² (IMC de demostración), talla en m | sintético |

Lo sintético no se borra: las evaluaciones de prueba lo referencian y la historia no se reescribe. Lo real entra como versiones nuevas o como protocolos nuevos, con su propio rótulo.

## Por cada protocolo de medición

| Dato | Ejemplo | Para qué |
|---|---|---|
| Nombre y versión | «Perfil de 7 pliegues, v1» | Lo que ve el profesional al elegir |
| Fuente | Manual, norma o bibliografía, con edición o año | Procedencia visible (REG-06-151) |
| Lista de mediciones, **en el orden de toma** | tríceps, subescapular, bíceps… | La toma sigue ese orden |
| Por cada medición: nombre, zona (pliegue, perímetro, diámetro, longitud, masa) y lado si corresponde | «Pliegue tricipital, derecho» | Identifica el sitio y lo ubica en la figura |
| Unidad y precisión | mm con 0,1 · cm con 0,1 · kg con 0,1 | Validar y mostrar sin redondeos inventados |
| Requerida u opcional | requerida | Qué falta antes de cerrar la evaluación |
| Repeticiones, si el protocolo las pide | «2 tomas; una 3.ª si difieren más de 5 %» | Hoy la toma registra un valor por medición: si hace falta, es trabajo aparte |
| Si una medición es **la misma** que una de otro protocolo | «El tríceps es el mismo sitio que en el de 9» | Hoy cada protocolo compara solo consigo mismo; esto ordena la comparación futura |

## Por cada método de cálculo (fórmula)

La fórmula se programa y se prueba en el código: el legajo exige métodos preestablecidos y probados (DIR-10-MET-A; REG-06-157), no una fórmula escrita en una planilla.

| Dato | Ejemplo | Para qué |
|---|---|---|
| Nombre, versión y fuente bibliográfica | «Índice cintura-altura, v1 (fuente)» | Procedencia visible |
| Entradas: qué medición, en qué unidad | cintura en cm, talla en cm | Qué habilita el método en una evaluación |
| Fórmula exacta | cintura ÷ talla | Programarla sin interpretar |
| Resultado: unidad y precisión | adimensional, 2 decimales | Mostrar el derivado |
| Población o condición de uso, si la tiene | adultos | Se muestra como límite, no se aplica sola |
| **Tres casos de prueba con el resultado esperado** | 80 cm y 170 cm → 0,47 | Las pruebas del ejecutor, contra la fuente |
| Si el método da **componentes** (9 o 7), la lista de componentes y sus unidades | masa adiposa, muscular, ósea… (kg) | Hoy un cálculo da un valor: varios componentes por ejecución es trabajo aparte |

Nada de «bueno», «malo», rangos de riesgo ni calificaciones: BE muestra el resultado y su fuente (TEST-PRJ-009).

## Bioimpedancia (futuro)

Para planificarla hace falta: equipos o formatos de archivo previstos, qué columnas trae cada archivo, si se compara con la antropometría o se muestra aparte, y quién carga el archivo (el profesional o BE). Hoy no hay importación de mediciones por archivo.

## Qué hace el ejecutor al recibirlo

1. Sembrar cada protocolo y método por migración, versionado y con su fuente.
2. Programar cada fórmula con los casos de prueba que vengan.
3. Cerrar la validación de la toma: al crear una evaluación, solo un protocolo vigente del catálogo; al corregir una vieja, el que ya tenía.
4. Registrar la evidencia y dejar el PR para auditoría.
