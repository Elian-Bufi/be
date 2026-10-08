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
| [ACEPTACION.md](ACEPTACION.md) | Matriz PRO-01 a PRO-26: escenario, resultado esperado, evidencia, estado y pendiente; rendimiento en detalle |
| [GUIA-DE-DEMOSTRACION.md](GUIA-DE-DEMOSTRACION.md) | Guion corto para Dirección y lo que hay que tener presente al interpretar |

## Carpetas

| Carpeta | Contenido |
|---|---|
| `capturas-web/` | Resumen, Línea de tiempo y Analizar a 1440, 1280, 1024, 768 y 390 px, en Azul noche y Claro, y el registro original abierto. Las de la línea de tiempo se recortan a sus primeros 2.400 px |
| `resultados/` | `01` recorrido funcional · `02` anchos y temas · `03` axe · `04` tiempos de 12 semanas · `05` tiempos de un año |
| `herramientas/` | Entorno local (`entorno.sh`), datos (`datos/`), recorrido (`recorrido.mjs`), tiempos (`tiempos.mjs`) y humo (`humo.mjs`). `herramientas/trabajo/` guarda credenciales y sesiones sintéticas y git lo ignora |

## Estados de la evidencia

Cada resultado declara uno de estos estados, que no se mezclan:
- **implementado;**
- **verificado automáticamente** (dominio, integración, recorrido real en local, CI);
- **observado en una captura real;**
- **solo en maqueta;**
- **pendiente de prueba o revisión humana.**

Las capturas complementan: no prueban persistencia, permisos ni cálculo. Eso lo prueban el dominio, la integración contra
PostgreSQL y el recorrido, que interactúa con los controles y comprueba resultados.
