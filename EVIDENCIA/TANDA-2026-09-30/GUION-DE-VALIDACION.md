# Guion de validación · tanda del 2026-09-30 (#116, #117, #118)

Para que Dirección pruebe los tres PR **de una sola vez** y decida. Dura 20–25 minutos en el website. Los tres están abiertos, con CI 4/4 en sus heads finales, **sin integrar, sin desplegar, sin APK**.

| PR | Qué es | Head final |
|---|---|---|
| #117 | El aviso «quedan fuera de la vista» de los gráficos de entrenamiento cuenta lo que de verdad no se ve | `baf8ef7` |
| #116 | Evolución antropométrica visual (puntos en el tiempo, detalle, origen, tabla equivalente, comparación) | `a9039df` (código en `7d30e9f`) |
| #118 | Apariencia del website: «Azul noche» predeterminada y «Claro», preferencia local al navegador | `49d21e4` |

## Antes de empezar

1. **Orden de integración recomendado:** #117 → #116 → #118 (mezclan sin conflictos; el último es el que más CSS toca). Después de cada merge, esperar la CI de `main`. El despliegue en `test` toma `main` solo: no hace falta hacer nada más.
2. **Datos:** con DEMO-PT/DEMO-A01 en `test` alcanza; la evolución necesita un asesorado con **varias evaluaciones antropométricas registradas en fechas distintas** (si no las hay, registrar dos o tres desde «En preparación», con fechas de toma distintas). No tocar los datos que ya son evidencia.
3. Un navegador de escritorio y, si se puede, el teléfono con el website (no la APK).

## Recorrido

### A. Apariencia (#118) — 5 minutos
| Paso | Qué hacer | Qué tiene que pasar | Captura |
|---|---|---|---|
| A1 | Abrir el website en una ventana privada (sin preferencia guardada) | Todo en **Azul noche**: login, registro, legales | `A1-login-azul-noche` |
| A2 | En el encabezado, «Apariencia» → Claro | Cambia todo sin recargar; lo escrito en el formulario de login no se pierde | `A2-login-claro` |
| A3 | Recargar y navegar (login → espacio profesional → un asesorado) | Sigue en Claro; el selector dice «Claro» | — |
| A4 | Entrar a Antropometría → En preparación con un borrador de pliegues | La figura se ve en las dos apariencias; los puntos no cambian de color por valor | `A4-figura` |
| A5 | Volver a Azul noche | Todo vuelve; tablas, foco de teclado y gráficos legibles | — |

**No esperar:** que la preferencia viaje a otro dispositivo o a la APK (es local al navegador); que con JavaScript deshabilitado haya otra cosa que Azul noche.

### B. Evolución antropométrica (#116) — 12 minutos
| Paso | Qué hacer | Qué tiene que pasar | Captura |
|---|---|---|---|
| B1 | Antropometría → Evolución, período que abarque las evaluaciones | Selector de métrica con cantidades; puntos sobre un eje de fechas **a escala**, sin líneas; días sin dato vacíos | `B1-puntos` |
| B2 | Si una métrica tiene dos unidades o protocolos: elegir el grupo | Un eje por grupo; el otro grupo no aparece en el eje; la tabla lista todo y marca «en otro grupo» | `B2-grupos` |
| B3 | Clic en un punto | Detalle: valor, tomada el, registrada el, clase, protocolo (con versión si hay homónimos), corrección, comparabilidad; fila marcada en la tabla | `B3-detalle` |
| B4 | Con el gráfico enfocado: flechas, Inicio, Fin | La observación elegida cambia; el detalle la sigue | — |
| B5 | «Comparar con» otra observación del mismo grupo | «Diferencia: ±X unidad, con N días de calendario entre las fechas» (o «el mismo día»), con la aclaración de que no es progreso | `B5-comparacion` |
| B6 | Elegir como principal la observación que estaba comparada | La comparación se vacía («No comparar»); no hay diferencia consigo misma | — |
| B7 | «Abrir la evaluación de origen» | Evaluaciones con esa evaluación abierta | `B7-origen` |
| B8 | En la URL, cambiar `evaluacion=` por un id inventado | La lista sigue; aviso neutral con «Volver a la lista de evaluaciones»; volver saca el parámetro y abre la más reciente | `B8-no-disponible` |
| B9 | Un período de **un solo día** con una toma de última hora local | El punto aparece dentro del eje; una sola marca con esa fecha; fechas y horas en la zona del período | `B9-un-dia` |
| B10 | Cambiar a un período sin la métrica elegida | Cae a la primera disponible y lo dice; sin detalle viejo | — |

**No esperar:** ver **dos tomas del mismo día** por separado (la API publica una observación efectiva por día y métrica: limitación existente, fuera de esta tanda); tendencias, líneas, promedios o conversión de unidades (excluidos a propósito); que el nombre del método sea «científico» (se muestra la referencia de versión declarada por el contrato).

### C. Aviso de desplazamiento (#117) — 4 minutos
| Paso | Qué hacer | Qué tiene que pasar | Captura |
|---|---|---|---|
| C1 | Entrenamiento → Ejecuciones → abrir una ejecución de **pocas** series (2–3) | **Sin** aviso, aunque el marco tenga un margen | `C1-sin-aviso` |
| C2 | Abrir una de **muchas** series (≥ 8) en una ventana angosta o en el teléfono | «N series quedan fuera de la vista…» desde la primera carga, con N real | `C2-aviso` |
| C3 | Desplazar el gráfico hasta el final | El número sigue a lo que se ve: puede bajar o quedar igual (lo que entra por un lado deja ocultas del otro); desaparece solo cuando todas caben | — |
| C4 | Fin / Inicio con el teclado | La serie elegida queda a la vista | — |

**No esperar:** que desplazar siempre reduzca el número; que cuente barras o puntos (cuenta grupos del eje: series o sesiones).

### D. Cierre — 2 minutos
- Sin errores en la consola del navegador durante el recorrido.
- En el teléfono (website): sin desplazamiento horizontal de la página en las dos apariencias; el selector de apariencia en el encabezado.

## Qué informar al terminar

Por PR: **aprobado / con observaciones** y, si hay observaciones, el paso (A1…C4), lo esperado y lo visto. Las capturas con los nombres de la columna, en una carpeta por PR.

## Decisiones abiertas que la tanda dejó (para la próxima orden)

| # | Decisión | Opciones | Recomendación |
|---|---|---|---|
| 1 | **Varias tomas el mismo día** en la evolución | (a) mantener una observación efectiva por día (hoy); (b) cambiar la lectura de API-ANT-06 para publicar todas, con «1 de 2 del día» (la pantalla ya lo soporta) | (b) si el uso real las tiene (dos tomas en el día son raras pero existen: ayuno/post); es un cambio de contrato chico y documentado |
| 2 | **Preferencia de apariencia** | (a) local al navegador (hoy); (b) en la cuenta, sincronizada con la APK; elimina el parpadeo residual | (a) hasta que la APK tenga apariencia; después (b) |
| 3 | **DL-106** (declarar una serie como no realizada) y el ejercicio registrado fuera de la prescripción («identidad desconocida») | ambos piden que la API informe el dato (contrato) | Resolver juntos en una tanda de entrenamiento; sin ellos la comparación no puede afirmar |
| 4 | **REV-A (#114)** | D1 a D4 de la propuesta de revisiones del asesorado | Decidir D1 (derecho aprobado vs. pendiente) primero; el resto depende |

Y la propuesta nueva de esta semana: **plantillas del profesional** (`docs/propuestas/PLANTILLAS-DEL-PROFESIONAL_ficha.md`, D-1 a D-7), con la crítica de negocio que la fundamenta (`docs/propuestas/CRITICA-DE-NEGOCIO_2026-09-30.md`).
