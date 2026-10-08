# Matriz de aceptación · PRO-01 a PRO-26

**Encargo:** §18. **Paquete:** WP-DASHBOARD-PROFESIONAL, rama `wp-dashboard-profesional`, sin integrar.

## Entorno de las pruebas locales

| Pieza | Detalle |
|---|---|
| Máquina | Windows 11, AMD Ryzen 7 3700U (8 hilos), 6 GB de memoria |
| Base | PostgreSQL 16 local en `:55442`, base `be_test_dashboard` (nunca `test` ni producción) |
| API | La de esta rama, compilada (`apps/api/dist`), en `:3001` con Node 22.23.2 |
| Website | El export estático de esta rama en `:3000`, servido con la CSP de `render.yaml` (`herramientas/servir-web.mjs`) |
| Navegador | Chrome 154 sin interfaz, manejado por `puppeteer-core` |
| Datos | Los sintéticos de `DATOS-SINTETICOS.md`: asesorado A (12 semanas, con los casos difíciles), B (vista parcial), C (un año, volumen), un tercero sin acceso y el escenario descartable (§8: valores reportados y calculados, y la revocación desde la web del asesorado) |

## Cómo se reproduce

```bash
cd EVIDENCIA/DASHBOARD-PROFESIONAL/herramientas      # Node 22 en el PATH; PostgreSQL 16 local en :55442
./entorno.sh compilar-api && ./entorno.sh compilar-web
./datos/regenerar.sh                                 # datos de A, B y C; verifica A (25 de 25); deja la API en :3001
./entorno.sh web                                     # la web estática en :3000
node recorrido.mjs funcional                         # 70 comprobaciones → trabajo/recorrido/resultado-funcional.json
node recorrido.mjs capturas                          # 60 comprobaciones: cinco anchos, dos temas y los tres modos de Analizar
node tiempos.mjs 84 7 A && node tiempos.mjs 366 7 C  # tiempos de 12 semanas y de un año
# El escenario descartable (DATOS-SINTETICOS.md §8): cuentas nuevas, la API reiniciada con su profesional, y el recorrido
node datos/generar.mjs descartable-cuentas && ./entorno.sh parar-api
./entorno.sh api "$(sed -n 's/^BE_DEMO_PROFESIONALES=//p' trabajo/demo-profesionales-descartable.txt)"
node datos/generar.mjs descartable-datos && node recorrido.mjs descartable   # 15 comprobaciones
```

El recorrido interactúa con los controles y comprueba resultados; las fallas (503, 429, sin red) y la respuesta lenta se
simulan interceptando pedidos en el navegador, sin tocar la API ni la base. Un gráfico no se da por bueno por su título:
`comprobarGraficos` mira lo dibujado (superficie, ejes, curvas, marcas sin tapar y la banda de referencia) y, en una
captura de la ventana, los píxeles del color de cada métrica. Las capturas no usan `fullPage` (ver «Revisión del head
fbeb256»). **Antes de cada corrida conviene reiniciar
la API** (`entorno.sh parar-api` y `api`): el límite de inicios de sesión (5 cada 15 minutos) vive en memoria.

## Estados

- **Implementado:** el código está en la rama.
- **Verificado automáticamente:** prueba de dominio, de integración (PostgreSQL real) o el recorrido real en local.
- **Observado en captura:** se ve en `capturas-web/` (las capturas complementan; no prueban permisos ni cálculo).
- **CI:** la integración continua del head del PR (se completa al abrirlo).
- **Pendiente de revisión humana:** lo que ninguna herramienta puede afirmar.

## Matriz

| ID | Escenario | Resultado esperado | Evidencia | Estado | Pendiente |
|---|---|---|---|---|---|
| PRO-01 | Iniciar sesión como profesional, abrir la ficha de A y pasar por las tres pestañas | Resumen, Línea de tiempo y Analizar dentro de la ficha; el asesorado y el período siguen en la URL | `resultados/01` (pestañas; la URL conserva `id` y período) · capturas | Verificado en el recorrido local | Revisión humana del flujo |
| PRO-02 | Resumen de A en 90 días | Cuatro indicadores con unidad, fechas, n, cobertura y la regla («media de 79 de 90 días con valor, 8 subtotales, sin contar hoy»); sin color de juicio; «Sin datos» o «No disponible con tu acceso» cuando corresponde | `resultados/01` · `resumen-*.png` | Verificado en el recorrido local | — |
| PRO-03 | Línea de tiempo de A | Días por fecha del hecho, descendentes; la toma de ayer cargada hoy queda en ayer con «Carga tardía»; el almuerzo rectificado es una sola entrada | `resultados/01` · `analisis.int-spec.ts` (orden, carga tardía) · verificador (317 entradas) | Verificado (dominio, integración y recorrido) | — |
| PRO-04 | Área Nutrición + tipo «Comida registrada», «Ver más» hasta el final, búsqueda «cena» con «Ver más», «Limpiar filtros» | 282 de 319, completos y sin repetir (282 distintos); la búsqueda recorre el período (79 de 79 en 2 páginas) y el texto **no viaja en ninguna URL**, ni de la página ni de la API: va en el cuerpo de API-DSH-04-BUSQUEDA, también al pedir más; el registro de la API no lo tiene; limpiar vuelve a 319 | `resultados/01` · `analisis.int-spec.ts` (cursor; filtros; `q` en la URL es 400; registro de requests) · `contrato.int-spec.ts` · `cliente-http.test.ts` | Verificado (cliente, integración y recorrido) | — |
| PRO-05 | «Abrir registro» desde la línea de tiempo; «Ver el origen de este dato» desde Analizar; ir a Nutrición y volver con «Atrás» | El registro correcto en un panel lateral; al cerrar con Esc, misma posición (57.182 px → 57.182 px) y el foco en el disparador; la URL del análisis (métricas, modo, fecha) sigue igual | `resultados/01` | Verificado en el recorrido local | — |
| PRO-06 | Pregunta de tres métricas; intentar una cuarta | Tres paneles; «Elegí cuál reemplazar»; cancelar conserva las tres (la URL no cambia). Una y dos métricas se recorren al quitar | `resultados/01` · dominio (`MAXIMO_DE_METRICAS`) | Verificado en el recorrido local | — |
| PRO-07 | Energía (kcal), proteínas (g) y peso (kg) en paneles | Un panel por unidad, con el mismo eje y la misma fecha elegida; una sola lectura para las tres | `resultados/01` · `analizar-*.png` | Verificado en el recorrido local | — |
| PRO-08 | Superponer kcal, g y kg; proteínas con carbohidratos; cambio relativo con y sin referencia; acercar, alejar y restablecer; cambiar la referencia | kcal/g/kg: bloqueado, «unidades distintas». Proteínas y carbohidratos: un gráfico, trazos distintos. Relativo: bloqueado si el peso no tiene observaciones en la referencia; si se puede, la referencia se ve (regla, rango, valor, n; «pocas observaciones» si n < 3) y la lectura da % y valor real. Base 0 o negativa: bloqueada. **Los gráficos están dibujados y a la vista** (DOM y píxeles, en los dos temas). **La referencia no cambia con el zoom**; cambia solo con «Aplicar», y queda en la URL | `resultados/01` y `02` · `capturas-web/analizar-*` · dominio (`referenciaElegida`, `FUERA_DEL_PERIODO`, familia y unidad) | Verificado (dominio, recorrido y captura) | — |
| PRO-09 | Recorrer fechas con el teclado hasta un día sin toma de peso | «Sin dato en esta fecha. El más cercano: 7 oct 2026, a 1 día: 79,8 kg. No es simultáneo.» Nada se interpola | `resultados/01` · dominio (`lecturaEnFecha`) | Verificado (dominio y recorrido) | — |
| PRO-10 | Días sin cantidades, cero real, día en curso y exportación; peso reportado por la persona e IMC calculado por un método | Desconocido = vacío/«sin valor conocido» (nunca 0); 0 = 0; subtotal y «sin completar» en columnas propias del CSV; puntos huecos en el gráfico. La clase del dato (medido, reportado, calculado) se dibuja distinta, y la lectura, la tabla y el CSV (columna «Clase de dato») la dicen | dominio (serie nutricional; `exportacion-del-analisis.test.ts`) · `resultados/01` (CSV descargado: zona, generación, columna «Sin completar») · `resultados/06` (escenario descartable) · `capturas-web/analizar-clases-*` | Verificado (dominio, recorrido y captura) | — |
| PRO-11 | Merienda sin confirmar; cena informada; comida diferente; hoy en curso | Subtotal, nunca «ingesta diaria»; lo previsto no es consumido (396 kcal, no 527,2); el día en curso no entra en la media (sin eso, 7 días bajaban ~240 kcal) | verificador (25 de 25) · dominio · `resultados/01` | Verificado (dominio, verificador y recorrido) | — |
| PRO-12 | Media semanal y cobertura | Media de los días con valor con su denominador («5 de 7»); cobertura «80 días de 90»; sin porcentaje global; la opción registrada cuenta, las alternativas no se suman | verificador (13 de 13 semanas) · `resultados/01` | Verificado (verificador y recorrido) | — |
| PRO-13 | Series de la sentadilla en dos etapas; RIR | Cada serie con el objetivo de la versión de ese día; RIR nulo no es punto, 0 sí | dominio (`objetivosDeLaVersionDelPlan`, RIR) · verificador (8 puntos de RIR; nulos fuera) · `analisis.int-spec.ts` (escalones del objetivo) | Verificado (dominio, integración y verificador) | Revisión humana de cómo se lee el objetivo en el gráfico |
| PRO-14 | Banca en kg y en lb; hip thrust en lugar de zancadas | Las unidades no se mezclan (la serie en kg avisa la sesión en lb); un ejercicio sustituto no se suma al prescripto | verificador · dominio | Verificado (dominio y verificador) | — |
| PRO-15 | Dos tomas el mismo día; cambio de protocolo | Dos puntos, no un promedio; la línea del peso se corta en 3 tramos y no hay diferencia a través del corte | verificador · `analisis.int-spec.ts` · `resultados/01` (indicador «3 tomas comparables») | Verificado (integración, verificador y recorrido) | — |
| PRO-16 | Rectificación y anulación | Cuentan una vez y quedan en la historia, marcadas | verificador (2 rectificados una vez, 2 anulados fuera) · `analisis.int-spec.ts` · `resultados/01` | Verificado (integración, verificador y recorrido) | — |
| PRO-17 | Fechas civiles y semanas | Día del hecho y carga tardía en la zona del asesorado; semanas de lunes a domingo; sin corrimientos por UTC | dominio (Buenos Aires y Tokio; las pruebas pasan con el proceso en Buenos Aires, Tokio y UTC: 37 de 37) · exportación (11:30 UTC → 08:30) | Verificado (dominio) | La demostración usa solo `America/Argentina/Buenos_Aires` (DL-009) |
| PRO-18 | «¿Qué cambió entre dos etapas?»; dos rangos que cortan semanas, por día y por semana | Dos rangos explícitos; por métrica, el criterio, n de observaciones, duración y la diferencia descriptiva; sin palabras causales; totales de distinta duración o incompletos no se restan. **Agrupar por semana no cambia la comparación**: es la de los días del rango exacto, igual a la calculada a mano | dominio (`DURACIONES_DISTINTAS`, `PERIODO_INCOMPLETO`, `TRAMOS_NO_COMPARABLES`; coberturas desiguales y cortes a mitad de semana) · `resultados/01` | Verificado (dominio y recorrido) | — |
| PRO-19 | Guardar una vista con una referencia propia; cerrar el navegador; en otra sesión, abrirla y borrarla | La lista dice la referencia de cada vista; reabre la misma configuración (métricas, período **y referencia**) y vuelve a pedir los datos; borrar pide confirmación | `resultados/01` · `analisis.int-spec.ts` (VAN: propias, 404 neutral, conflicto de versión, referencia) | Verificado (integración y recorrido) | — |
| PRO-20 | Asesorado B (vista parcial); tercero; revocación desde la web del asesorado; CSV | Un solo aviso de vista parcial, sin nombrar lo oculto; el selector ofrece solo lo permitido; el tercero ve «No encontramos un recurso disponible» (404 en la API); un alcance revocado no aporta entradas, conteos, búsqueda ni proyección; el CSV sale solo de lo autorizado y sin fórmulas. **Revocado desde la interfaz**, con las pantallas del profesional abiertas: la exportación no saca ningún archivo y dice por qué, el origen de un punto no repite el valor, y los gráficos y la línea de tiempo no traen nada | `resultados/01` y `06` · `analisis.int-spec.ts` (revocación, tercero, anti-enumeración, `periodCounts`) · `capturas-web/revoca*` | Verificado (integración y recorrido, con cuentas descartables) | — |
| PRO-21 | «7 días» lento y enseguida «90 días»; cambiar de A a B con A lento; 503 en el peso; 429; sin red | La respuesta vieja no pisa la nueva; nada de A aparece en B; lo que cargó bien sigue; cada falla con su texto y «Reintentar», nunca «sin datos» | `resultados/01` | Verificado en el recorrido local | — |
| PRO-22 | Teclado, foco, texto al 200 %, tabla, axe | Flechas, Inicio y Fin mueven la fecha; Esc devuelve el foco; sin desborde con el texto al 200 %; tabla de datos y resumen en texto; axe (WCAG 2.2 A/AA) sin violaciones automáticas en Resumen, Línea, registro abierto, Analizar y fallas | `resultados/01` · `resultados/03` | Verificado en el recorrido local | **Lector de pantalla** (NVDA o JAWS) y revisión manual de WCAG 2.2: axe no alcanza para declarar conformidad |
| PRO-23 | Claro y Azul noche a 1440, 1280, 1024, 768 y 390 px; 320 px | Sin desborde de costado, con pestañas y períodos en todos; diseño de escritorio a 1440, 1280 y 1024; los gráficos de Analizar dibujados en cada captura | `resultados/02` (60 de 60) · `capturas-web/` · `resultados/01` (320 px) | Verificado y observado en captura | Revisión visual de Dirección |
| PRO-24 | Presupuesto: 12 semanas (declarado antes de medir) y un año (declarado después de la primera medición del año) | 12 semanas: cada lectura ≤ 300 ms y el Resumen ≤ 2,5 s. Un año: cada lectura ≤ 1 s y el Resumen ≤ 2,5 s. Sin N+1 | `resultados/04` y `05` · `resultados/01` (Resumen en el navegador) · perfil de CPU (abajo) | Verificado en local | Render no se midió: los tiempos locales no son los de Render |
| PRO-25 | Contratos, navegación profesional y sesión | Las suites existentes siguen pasando | Local, con la corrección de la revisión: dominio 563, scripts 291 (con la guardia de trazabilidad), API 79 de 80 en la corrida completa (`health.spec.ts` superó los 30 s con la máquina cargada; sola, 9 de 9 en 23,7 s); integración `analisis`, `contrato`, `pdp` y `dashboard` 63 de 63; typecheck de todos los espacios; OpenAPI al día; legajo 207 de 208, como `main` | Verificado en local | **CI del head del PR** |
| PRO-26 | De la carga sintética al origen de un punto | `regenerar.sh` → verificación 25 de 25 → en Analizar, el punto de energía de hoy abre su registro de comida (n = 1). La interfaz no tiene datos fijos: todo sale de la API | `resultados/01` · `DATOS-SINTETICOS.md` | Verificado en el recorrido local | — |

## Revisión del head fbeb256

Una revisión independiente del head `fbeb256` encontró cinco puntos. Cada uno se reprodujo **antes de corregirlo**, con
ese head compilado y corriendo en local, y los scripts que lo reproducen quedan en `herramientas/revision-fbeb256/`.
Se separa lo que era un defecto del producto de lo que era una insuficiencia de la evidencia.

| # | Hallazgo | Reproducción con `fbeb256` | Causa | Clasificación |
|---|---|---|---|---|
| 1 | Paneles vacíos en `analizar-1440-claro.png` y `analizar-1280-azul-noche.png` (sin ejes ni curvas), con la lectura lateral llena | Con un observador en la página (`reproducir-1-captura.mjs`), una captura `fullPage` de Analizar: la ventana pasa a 1 × 1 por un instante (así captura Puppeteer la página completa), el contenedor de recharts mide 0 y **quita el SVG**, y lo vuelve a dibujar cuando la ventana recupera su tamaño. En la evidencia de `fbeb256`, 2 de las 10 capturas de Analizar (las dos que cita la revisión) se tomaron en ese intervalo. El DOM tenía los tres SVG antes y después de cada captura. Repetido con el script (`resultados/07`): 3 de 5 capturas `fullPage` salieron sin un píxel de las métricas; 0 de 5 con la ventana agrandada | La técnica de captura del arnés. El chequeo PRO-08 miraba el título y la leyenda, no el dibujo, así que una imagen vacía pasaba | **Insuficiencia de la evidencia.** En la pantalla, el gráfico se rearma solo al volver el tamaño; no se encontró un camino de uso real que deje un contenedor en 0 |
| 2 | Resúmenes incorrectos al agrupar por semana | Con el dominio de `fbeb256` (`reproducir-2-semanas.cjs`): del 7 al 20 de septiembre, con un día de 1.000 kcal y siete de 2.000, la serie semanal daba **1.500 (n = 2)** en lugar de 1.875 (n = 8); del 16 al 20, **sin valor** en lugar de 2.000 (n = 5); la comparación de 7-13 con 16-20, **sin diferencia** en lugar de +1.000 | Analizar pasaba la serie que se dibuja (semanal, si se elegía «Por semana») a `resumirPeriodo`, `compararPeriodos` y `referenciaDeLaSerie`, que tratan cada punto como una observación y filtran por la fecha del punto (el lunes de la semana) | **Defecto del producto** |
| 3 | La referencia del cambio relativo se movía con el zoom | `reproducir-3-y-4.mjs`: la referencia de proteínas era «media de los días con valor del 11 jul al 17 jul»; al acercar desde el 1/9 pasaba a calcularse con los primeros 7 días de lo visible (del 1 al 7 de septiembre: otro valor y otro %), y al restablecer volvía | `analizar.tsx` calculaba la referencia como «los primeros N días **de lo que se ve**» | **Defecto del producto** |
| 4 | El texto buscado viajaba en la URL de la API | `reproducir-3-y-4.mjs`: al buscar «cena», `GET /api/v1/advisees/:id/timeline?…&q=cena…` y su `OPTIONS` previo llevaban el texto | `lineaDeTiempo` (cliente) enviaba `q` en la query de API-DSH-04; DL-127 lo había aceptado como riesgo residual | **Defecto del producto** (decisión de diseño revertida) |
| 5 | Faltaba evidencia de valores estimados y de una revocación desde la interfaz | No había un escenario con valores estimados, y la revocación solo se probaba en integración. Al revisar el código: el punto no llevaba su clase (medido, reportado o calculado), así que el gráfico y el CSV no la distinguían; la exportación armaba el archivo con lo que estaba en memoria, y el origen de un punto revocado repetía el valor de la pantalla | — | **Insuficiencia de la evidencia**, y **defectos del producto** encontrados al cubrirla: la clase no se veía ni se exportaba, y la exportación y el origen no volvían a preguntar con el acceso de ese momento |

### Corrección y resultado

| # | Corrección | Cómo se comprueba ahora | Esperado | Obtenido |
|---|---|---|---|---|
| 1 | Las capturas no usan `fullPage`: la ventana se agranda al alto de la página, se espera el dibujo y se captura la ventana tal cual. `comprobarGraficos` mira lo dibujado: SVG con tamaño, los dos ejes con marcas, curvas con trazo, marcas a la vista y sin tapar (`elementFromPoint`), la banda «Referencia» en el modo relativo y, en una captura de la ventana, los píxeles del color de cada métrica | Recorrido funcional (paneles, superpuestas, relativo, semanal) y de capturas (30 comprobaciones de dibujo en capturas); cada captura de Analizar comprueba que sus gráficos estaban dibujados al tomarla y que siguen después. Revisión visual de las capturas en los dos temas | Todos los gráficos dibujados y a la vista, en los dos temas y en las imágenes | Recorrido funcional: paneles, superpuestas, relativo y semanal, dibujados y a la vista. Por ejemplo, los tres paneles: 631 × 192 px cada uno, ejes con 7 y 5 marcas, 2 tramos de curva, 80 de 80 marcas a la vista y sin tapar, y entre 1.700 y 3.400 píxeles del color de su métrica. Capturas: 60 de 60, con los tres modos en escritorio en los dos temas, y las 10 de Analizar con sus tres gráficos al tomarlas y después. Revisión visual: más abajo |
| 2 | Los resúmenes, la comparación y la referencia usan las **observaciones** (`granoDeObservacion`: el día, la sesión o la toma) del rango exacto. Con el gráfico por semana, la web pide además las observaciones (una segunda lectura con el mismo PDP). El dominio rechaza una serie agrupada en esas funciones | Dominio: el caso de la revisión, coberturas desiguales, cortes a mitad de semana en los dos extremos, entrenamiento con un rango que corta semanas, y el rechazo de la serie semanal. Recorrido: la misma comparación por día y por semana, contra la media de los días calculada a mano desde la serie diaria de la API; la referencia, igual por día y por semana | 1.875 (n = 8); 2.000 (n = 5); +1.000. En el recorrido, A y B iguales por día, por semana y a mano | Dominio: 1.875 (n = 8), 2.000 (n = 5), +1.000; la serie semanal, rechazada (con el dominio de `fbeb256`, el mismo script da 1.500, «sin valor» y sin diferencia: `resultados/07`). Recorrido: A «1.150 kcal · n = 13 de 13» y B «1.198 kcal · n = 10 de 10», iguales por día, por semana y a mano |
| 3 | Referencia explícita: los primeros N días **del período** o un rango fijo (`ReferenciaDelCambioSchema`), calculada con `referenciaElegida`, que no recibe el intervalo visible. Cambia solo con «Aplicar»; queda en la URL (`ref`), en pantalla (texto, banda y aviso si quedó fuera de lo visible) y en las vistas guardadas (`reference` reemplaza a `referenceDays`) | Recorrido: acercar arrastrando sobre el gráfico, alejar con las fechas y restablecer; copiar el intervalo sin aplicar; aplicar; restablecer otra vez; guardar la vista y reabrirla en otra sesión | La referencia y el % de una fecha no cambian con el zoom; cambian solo con «Aplicar»; la vista guardada la conserva | Acercado al 29 ago-3 oct y alejado al 30 jul-8 oct: «+38,1 % contra la referencia» las cuatro veces, con la misma referencia. Copiar el intervalo no tocó la URL; «Aplicar» dejó `ref=2026-09-18_2026-10-07`. La vista guardada se reabrió con `ref=2026-09-18_2026-09-24` y «Rango fijo, del 18 sept 2026 al 24 sept 2026» |
| 4 | API-DSH-04-BUSQUEDA: `POST /advisees/{id}/timeline/search` con el texto y los filtros en el cuerpo, validado antes del PDP; mismo PDP, búsqueda en todo el período y la misma paginación (el cursor en el cuerpo). API-DSH-04 ya no acepta `q` (400). El cliente arma la query de la línea de tiempo solo con las claves declaradas | Integración: búsqueda y página siguiente, filtros, 400 por `q` en la URL, por un campo de más, por texto vacío y por cursor, el mismo 404 para un tercero, y la salida estándar y de errores de la API durante una búsqueda y un 400. Contrato: la operación nueva con sus éxitos y errores. Cliente: el texto va en el cuerpo y un `q` de más no llega a la URL. Recorrido: todas las URL que pidió el navegador y el registro de la API de la corrida | Ninguna URL ni línea del registro con el texto; el registro con la ruta parametrizada; la búsqueda completa y sin repetir | 79 de 79 coincidencias en 2 páginas; 4 pedidos a la API durante la búsqueda, ninguno con el texto; 2 POST con el texto en el cuerpo (el de «Ver más», con su cursor); el registro de la API, con `/api/v1/advisees/:adviseeId/timeline/search` y sin «cena» |
| 5 | `dataClass` en cada punto; el gráfico dibuja con contorno cortado lo reportado por la persona y con un punto adentro lo calculado por un método, y la leyenda lo explica; la lectura, la tabla, el resumen en texto y el CSV (columna «Clase de dato») lo dicen con las palabras de la pestaña de Antropometría (Medido, Reportado, Calculado). La exportación vuelve a leer cada serie antes de armar el archivo, y el origen de un punto que el PDP ya no deja leer no repite el valor y vuelve a pedir los gráficos | Escenario descartable (`DATOS-SINTETICOS.md` §8): peso medido, reportado y medido, e IMC calculado por `be/imc@1`, en los dos temas; después, el asesorado revoca desde su web y, con las pantallas del profesional todavía abiertas, se exporta, se abre el origen de un punto y se vuelve a abrir Analizar y la línea de tiempo | Clases distintas en el gráfico, la lectura, la tabla y el CSV. Después de revocar: ningún archivo, ningún valor de antes, gráficos «no está disponible con tu acceso actual» | 15 de 15: contorno cortado en el peso reportado y un punto adentro en el IMC, en los dos temas; la lectura dice «Reportado por la persona, no medido»; la tabla, «(reportado por la persona, no medido)» y «(calculado por un método)»; el CSV, «Medido», «Reportado por la persona, no medido» y «Calculado por un método (estimación)». Después de revocar, con las pantallas del profesional abiertas: la exportación no sacó ningún archivo y dijo «No se descargó ningún archivo: Peso (no está disponible con tu acceso actual); Índice de masa corporal (no está disponible con tu acceso actual)»; el origen: «Esta toma no está disponible con tu acceso actual», sin el valor; los gráficos y la línea de tiempo, sin nada de Antropometría |

**Pruebas nuevas o cambiadas.** Dominio: siete casos nuevos en `analisis-longitudinal.test.ts` (significado semanal,
coberturas desiguales, entrenamiento con cortes, rango de la referencia, referencia elegida, resumen textual del rango y
clase del dato), uno en `exportacion-del-analisis.test.ts` (columna de clase) y uno en `cliente-http.test.ts` (transporte de la
búsqueda). Integración: `analisis.int-spec.ts` (19, con el transporte, el registro y la referencia de una vista) y
`contrato.int-spec.ts` (la operación nueva). Recorrido: 70 comprobaciones funcionales, 60 de capturas y 15
del escenario descartable.

### Revisión visual

Se miraron, una por una, las capturas nuevas de Analizar en los dos temas: paneles a 1440 (Claro) y 1280 (Azul noche),
las dos que citaba la revisión; superpuestas y cambio relativo a 1440 y 1280; las clases de dato, y las pantallas
después de revocar.
- **Paneles, superpuestas y relativo:** ejes, curvas y marcas a la vista en los dos temas, con la lectura fija al
  costado. En el relativo, la referencia se lee arriba del gráfico y en su bloque de opciones, y la banda «Referencia»
  marca sus días al comienzo del período.
- **Clases de dato:** el peso reportado se ve con el contorno cortado (en la captura, la fecha elegida es otra, para que
  el anillo de selección no lo tape) y el IMC calculado, con un punto adentro; la leyenda explica las dos.
- **Después de revocar:** sin gráficos ni valores; «no está disponible con tu acceso actual» por métrica; el aviso de la
  exportación dice por qué no salió un archivo.
- **Lo que se ajustó al mirarlas** (y se volvió a capturar):
  - el motivo de «Cambio relativo» no disponible ahora empareja cada métrica con el suyo;
  - «1 subtotales» y «1 días» en la comparación;
  - un aviso de una descarga anterior que quedaba a la vista sin series;
  - el vocabulario de la clase, igual al de la pestaña de Antropometría.

### Pendientes reales (separados de las decisiones ya resueltas)

| Severidad | Pendiente | Por qué queda afuera |
|---|---|---|
| Baja | La cabecera de la ficha (estado por área) se lee al abrirla y no se refresca con las consultas de Analizar: después de una revocación en la misma sesión sigue diciendo «Activo · acceso contextual» hasta recargar la ficha, que entonces dice «Consentimiento revocado · Acceso no disponible». No muestra datos de salud | Es la cabecera de la ficha de WP-04, anterior a este paquete; refrescarla cuando Analizar detecta un cambio de acceso es un cambio de la ficha |
| Baja | El detalle de un registro de comida (compartido con Nutrición) muestra un error genérico con «Reintentar» si el PDP ya no lo deja leer, en lugar de «no disponible con tu acceso actual», como sí hacen la toma y la sesión | Componente de Nutrición, anterior a este paquete; el escenario de esta pasada revoca Antropometría |
| Baja | Las búsquedas de los catálogos de alimentos y de ejercicios siguen con `?q=` en la URL | Buscan nombres de un catálogo, no registros de una persona; si Dirección quiere la misma regla, es el mismo cambio que API-DSH-04-BUSQUEDA |
| — | Revisión visual de Dirección, lector de pantalla (NVDA o JAWS) y la decisión de DL-126, DL-127 y DL-128 | Revisión humana |

**Decisiones técnicas ya resueltas en esta pasada** (no son pendientes): la búsqueda por POST con su ID de variante
(DL-127), la referencia explícita y los resúmenes sobre observaciones (DL-126), `reference` en lugar de `referenceDays`
en las vistas (DL-128; la rama nunca se publicó, así que no hay vistas viejas), la clase del dato con el vocabulario de
Antropometría y la exportación que vuelve a consultar.

## PRO-24 en detalle

**Presupuesto.** El de 12 semanas se declaró antes de medir: cada lectura ≤ 300 ms (mediana) y el Resumen completo
≤ 2,5 s. Para el año no había uno: se fijó **después** de la primera medición y se dice así, para no esconderlo: cada
lectura ≤ 1 s y el Resumen ≤ 2,5 s.

| Lectura (mediana de 7, después de calentar) | A · 84 días | C · 366 días |
|---|---|---|
| API-DSH-03 resumen por dominio | 56 ms | 44 ms |
| API-DSH-04 línea de tiempo (6, con conteos) | 177 ms | 379 ms |
| API-DSH-04 línea de tiempo (50) | 144 ms | 384 ms |
| API-DSH-04 búsqueda en el período | 139 ms | 372 ms |
| API-PRJ-01 nutrición, registros por día | 78 ms | 230 ms |
| API-PRJ-01 nutrición, energía por semana | 77 ms | 228 ms |
| API-PRJ-01 entrenamiento, ejercicios | 53 ms | 112 ms |
| API-PRJ-01 entrenamiento, carga de la serie 1 | 59 ms | 131 ms |
| API-PRJ-01 antropometría, peso | 53 ms | 112 ms |
| API-VAN-01 vistas guardadas | 12 ms | 16 ms |
| **Resumen completo** (6 + 4 lecturas en dos olas) | **405 ms** | **991 ms** |

En el navegador, el Resumen de A con la API en uso: entre 664 y 797 ms en las últimas corridas (797 ms en la de
`resultados/01`). La primera carga justo después de reiniciar la API tardó entre 1,7 y 2,9 s: es el arranque en frío
de la API y del navegador, se informa y no se evalúa.

**Lo que se hizo para llegar.** El primer Resumen pedía unas 15 lecturas y tardaba más de 4 s. Ahora:
- las sesiones se leen en lote (`ejecucionesApi`), sin una consulta por sesión;
- la línea de tiempo devuelve sus conteos (`periodCounts`) y el Resumen no pide una página por conteo;
- los macros de un registro se calculan una vez por opción y cantidades (con un año, de unas 2.900 veces a una decena).

**Sin N+1.** El tiempo crece lineal con el volumen (línea de tiempo: 130 ms con 330 comidas, unos 380 ms con 1.460). Un
perfil de CPU de la API con la línea de tiempo del año: 48 % esperando a PostgreSQL, 18 % Prisma deserializando y el
resto armando las entradas; ninguna función domina. La línea de tiempo lee todo el período autorizado a propósito: la
búsqueda y los conteos tienen que cubrirlo entero.

**Límite.** Con un año, la línea de tiempo (~380 ms) queda por encima de los 300 ms del presupuesto de 12 semanas. Si
hiciera falta bajarla, el siguiente paso es una lectura propia de la línea de tiempo (menos columnas y relaciones que
`registrosApi`), con su prueba de equivalencia.

## Hallazgos fuera del paquete

- **Baja · CI intermitente:** `apps/api/src/medios/rutas-firmadas.spec.ts` falla 1 de cada 16 veces sin un defecto real
  (altera el último carácter base64url de la firma y a veces solo cambia bits de relleno). Se arregla alterando un
  carácter del medio.
- **Baja · 503 intermitente en local:** una de tres corridas de `analisis.int-spec.ts` dio 503 (P2028) en la proyección
  antropométrica, con la máquina cargada justo después de compilar. No se reprodujo. Se vigila en la CI.
