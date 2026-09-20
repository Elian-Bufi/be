# MESA-01 — estado de DV-11 y de DV-05 tras WP-05

> Nota de actualización del ejecutor técnico. **No modifica** la matriz ni el informe del 2026-09-10: esos archivos están en `docs/MANIFEST.sha256`, y editarlos rompería la verificación de hashes de la entrega de Dirección. Cuando Dirección quiera consolidar, reemplaza los archivos y reemite el manifiesto.

**Fecha:** 2026-09-20 · **Paquete:** WP-05 «Antropometría, métodos y cálculos» · **Fuente de exigencia:** `Entregables.pdf` de la escuela. El punto 11 es DV-11 en la matriz: «URL a una DEMO que muestre funcionalidades de APK y Website».

## Punto 11 — Demo de APK y Website

### Qué cambió respecto de WP-04

| Elemento | Estado tras WP-05 | Dónde |
|---|---|---|
| Aplicación ejecutable | ✅ Website y API **0.5.1** en `test`, y APK **0.5.1** en un release permanente. Al circuito nutricional se le suma el antropométrico, de punta a punta | `EVIDENCIA/WP-05/verificacion-urls.txt` · `apk.txt` |
| Usuarios demo | ✅ Se suma **DEMO-PA**, un profesional **sin ninguna Especialidad** y solo con capacidad antropométrica. Es la cuenta que prueba que la capacidad es transversal y no un permiso de nutrición. DEMO-PN suma la misma capacidad a la suya | `GUIA-DEMO.md` Parte 0 |
| Datos sintéticos | ✅ Catálogo de especificaciones: un protocolo y un método con **dos versiones**, que es lo que hace demostrable «la versión exacta queda conservada». Rotulado en la propia fila: «no es un catálogo científico» (REG-06-157) | migraciones `20260920200000_antropometria` y `20260920220000_metodos_y_calculos` |
| Guion | ✅ `EVIDENCIA/WP-05/GUIA-DEMO.md`: seis partes, con la cuenta, los datos a cargar y lo que tiene que verse en cada paso | — |
| Grabación | **Pendiente de Dirección.** Están las 19 capturas del website, automatizadas contra `test`. Las del APK las toma Dirección sobre un Android real | `EVIDENCIA/WP-05/web/` · `apk/` |
| Hosting del video o link | La demo se muestra en vivo sobre las URLs de `test`, siguiendo la guía. No hay link a un video | — |

### URLs de la demo

| Recurso | URL |
|---|---|
| Website | `https://be-web-1ngj.onrender.com` |
| APK 0.5.1 | `https://github.com/Elian-Bufi/be/releases/download/be-apk-0.5.1/be-0.5.1-0193a3d.apk` (SHA-256 `482170b8…1ce386b`, no expira) |
| API (salud) | `https://be-api-hndp.onrender.com/health/ready` |

> **La 0.5.1 reemplaza a la 0.5.0.** El contrato de la evolución se realineó con el 09 y el cliente valida con objetos estrictos, así que un APK 0.5.0 instalado rechaza la respuesta. Para la demo hay que tener la 0.5.1.

### Qué suma la demo

Al circuito nutricional se le agregan cuatro momentos que ninguna otra parte del producto mostraba todavía:

1. **Un borrador que no es historia.** El profesional carga las mediciones, sale, vuelve, y recién cuando **registra** el contenido se vuelve inmutable. La demo muestra las dos caras: editable antes, no editable después.
2. **Un cálculo que se puede reproducir.** El método, su versión exacta, la regla y la precisión están a la vista. Dos corridas del mismo método conviven sin que el sistema elija una. Dejar una como referencia es un acto del profesional.
3. **Corregir y anular, que no son lo mismo.** Corregir conserva el original y **recalcula** los derivados, dejando el cálculo anterior marcado como reemplazado. Anular saca la medición de la serie sin borrar su historia.
4. **Una serie que no miente.** En el APK, el asesorado ve su evolución con los días sin medición agrupados en tramos «Sin dato». No hay línea que los cruce, ni cero, ni valor arrastrado.

### Estado de DV-11

| | Antes de WP-05 | Ahora |
|---|---|---|
| **DV-11** | Demostrable con el circuito nutricional | **Demostrable con dos circuitos de salud completos**, uno con cálculo profesional reproducible. La demo del APK depende de que Dirección instale la 0.5.1 y tome las capturas |

El dominio de entrenamiento (WP-06) va a sumar la tercera parte. La guía está pensada para crecer por partes.

## Punto 5 — Casos de prueba: se cierran los adversariales de DL-042

WP-04 dejó tres casos del catálogo asignados a este paquete. Los tres pasan, en CI y en vivo:

| # | Caso | Estado en CI | Estado en `test` (2026-09-20, API 0.5.1 `0193a3d`) |
|---|---|---|---|
| 6 | Anular dos veces la misma medición: la segunda no crea un segundo efecto ni un error nuevo | PASS (TEST-ANT-006, en `antropometria.int-spec.ts` y `maquinas-wp05.int-spec.ts`) | **PASA** |
| 7 | (variante de mediciones) Evolución con un hueco: el checkpoint sin medición es «sin dato» y no lleva valor; un cero **medido** sí es un punto | PASS (TEST-ANT-009) | **PASA** |
| 10 | Borrador de evaluación de otro profesional: no existe, no está bloqueado | PASS (`contrato.int-spec.ts`) | **PASA** |

Con esto, **los 10 adversariales de DV-05 son ejecutables en vivo**. Era el objetivo que la mesa del 2026-09-10 puso como condición de DV-05, y queda cumplido: `EVIDENCIA/WP-04/adversariales-test.json` (1 a 5, 7 nutricional, 8, 9) y `EVIDENCIA/WP-05/adversariales-test.json` (6, 7 de mediciones, 10).

### Casos del catálogo que WP-05 ejecuta

CI sobre el commit final (`02c252f`): integración **293/293** en PostgreSQL 16 real, 20 suites, 0 fallos. El detalle por ID está en `EVIDENCIA/WP-05/resultados-integracion-02c252f.md`.

| Caso | Oráculo | Estado |
|---|---|---|
| **E2E-06** | Del borrador a la evolución: el borrador no es historia, registrar es un acto explícito y la serie sale de lo registrado | PASS |
| **TEST-ANT-003** | Una evaluación sin mediciones no se registra | PASS |
| **TEST-ANT-004** | Corregir preserva el original y resuelve la vista efectiva por relación | PASS |
| **TEST-ANT-006** | Adversarial 6: la segunda anulación no produce un segundo efecto ni un error nuevo | PASS |
| **TEST-ANT-007** | No hay reversión: una medición anulada no admite corrección | PASS |
| **TEST-ANT-009** | Adversarial 7: la serie no miente. Incluye INV-06-177 (una medición de la tarde del último día del período aparece) | PASS |
| **TEST-CAL-001** | Solo la versión vigente se ofrece; la histórica se consulta y dice que lo es. Publicar una versión nueva no reescribe la corrida ya hecha | PASS |
| **TEST-CAL-002** | REG-06-204: el mismo dato es admisible para una versión y no para otra | PASS |
| **TEST-CAL-003** | Un `sourceRef` ajeno responde igual que uno inexistente | PASS |
| **TEST-CAL-004 y 005** | Dos corridas del mismo método coexisten, sin promedio ni ganadora | PASS |
| **TEST-CAL-006** | Adoptar, reemplazar y volver a adoptar dejan historia y no tocan las corridas | PASS |
| **TEST-PRJ-009** | Cero juicio: schemas, OpenAPI, copy de las pantallas y 51 respuestas en vivo | PASS |
| **TEST-AUTH-001 a 013** | La capacidad antropométrica se declara, se verifica y se resuelve; sin resolución habilitante no se registran evaluaciones | PASS |
| **REG-06-161** | Corregir una medición recalcula los derivados; si las entradas dejan de ser admisibles, no se inventa un sucesor | PASS |
| **REG-06-214/215** | La frontera de inmutabilidad es el registro, no el nacimiento del dato | PASS |
| **REG-06-15/16** | La cadena de correcciones no se puede bifurcar: la base rechaza la segunda raíz y el segundo sucesor | PASS |

### Deuda de oráculos que sigue abierta

**DL-065:** siete de los once TEST-ANT del 11A son un título de una línea, sin oráculo. Los cubiertos por comportamiento son los cinco de arriba. Los otros quedan sin ID formal hasta que Dirección resuelva si se redactan o si se dan por cubiertos por E2E-06. Que las pruebas existan y pasen no cierra la deuda: lo que falta es la definición de qué tenían que probar.
