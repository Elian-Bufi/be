# Evidencia de WP-DASHBOARD-PROFESIONAL

> **Estado:** implementado y verificado en local; PR en borrador, sin merge ni despliegue. La definición del paquete es
> `docs/paquetes/WP-DASHBOARD-PROFESIONAL.md` y la nota de reanudación, `docs/paquetes/REANUDACION-DASHBOARD.md`.

## Documentos

| Documento | Contenido |
|---|---|
| [INVESTIGACION.md](INVESTIGACION.md) | Fuentes primarias (fuente → hallazgo → decisión → limitación), recorridos cognitivos y arquitecturas comparadas |
| [ESPECIFICACION.md](ESPECIFICACION.md) | Mapa de flujo, pantallas, estados y criterios visuales; §6, lo que la implementación ajustó (escritorio primero) |
| [DICCIONARIO-DE-METRICAS.md](DICCIONARIO-DE-METRICAS.md) | Métricas, reglas temporales, fórmulas, cobertura, día en curso y permisos |
| [DATOS-SINTETICOS.md](DATOS-SINTETICOS.md) | Cómo se generan los datos, los casos difíciles con sus resultados esperados a mano y el conjunto de volumen |
| [ACEPTACION.md](ACEPTACION.md) | Matriz PRO-01 a PRO-26: escenario, resultado esperado, evidencia, estado y pendiente; la revisión del head `fbeb256` (cada hallazgo reproducido, su causa, si era del producto o de la evidencia, la corrección y lo obtenido); rendimiento en detalle |
| [GUIA-DE-DEMOSTRACION.md](GUIA-DE-DEMOSTRACION.md) | Guion corto para Dirección y lo que hay que tener presente al interpretar |

## Carpetas

| Carpeta | Contenido |
|---|---|
| `capturas-web/` | Resumen, Línea de tiempo y Analizar a 1440, 1280, 1024, 768 y 390 px, en Azul noche y Claro, y el registro original abierto. Analizar también en superpuestas y cambio relativo (`analizar-superpuestas-*`, `analizar-relativo-*`) a 1440 y 1280 en los dos temas. Del escenario descartable: las clases de dato (`analizar-clases-*`), la revocación en la web del asesorado (`revocacion-asesorado-1440`) y lo que ve el profesional después (`revocado-*`). Las de la línea de tiempo se recortan a sus primeros 2.400 px. Ninguna se toma con `fullPage`, y cada una de Analizar se comprueba dibujada |
| `resultados/` | `01` recorrido funcional · `02` anchos, temas y modos (con el dibujo de cada gráfico) · `03` axe · `04` tiempos de 12 semanas · `05` tiempos de un año · `06` escenario descartable (clases de dato y revocación desde la interfaz) · `07` reproducción de la revisión del head `fbeb256` |
| `herramientas/` | Entorno local (`entorno.sh`), datos (`datos/`), recorrido (`recorrido.mjs`), tiempos (`tiempos.mjs`), humo (`humo.mjs`) y los scripts que reprodujeron la revisión (`revision-fbeb256/`). `herramientas/trabajo/` guarda credenciales y sesiones sintéticas y git lo ignora |

## Estados de la evidencia

Cada resultado declara uno de estos estados, que no se mezclan:
- **implementado;**
- **verificado automáticamente** (dominio, integración, recorrido real en local, CI);
- **observado en una captura real;**
- **solo en maqueta;**
- **pendiente de prueba o revisión humana.**

Las capturas complementan: no prueban persistencia, permisos ni cálculo. Eso lo prueban el dominio, la integración contra
PostgreSQL y el recorrido, que interactúa con los controles y comprueba resultados.
