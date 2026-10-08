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
| Datos | Los sintéticos de `DATOS-SINTETICOS.md`: asesorado A (12 semanas, con los casos difíciles), B (vista parcial), C (un año, volumen) y un tercero sin acceso |

## Cómo se reproduce

```bash
cd EVIDENCIA/DASHBOARD-PROFESIONAL/herramientas      # Node 22 en el PATH; PostgreSQL 16 local en :55442
./entorno.sh compilar-api && ./entorno.sh compilar-web
./datos/regenerar.sh                                 # datos de A, B y C; verifica A (25 de 25); deja la API en :3001
./entorno.sh web                                     # la web estática en :3000
node recorrido.mjs funcional                         # 57 comprobaciones → trabajo/recorrido/resultado-funcional.json
node recorrido.mjs capturas                          # 30 capturas, cinco anchos y dos temas
node tiempos.mjs 84 7 A && node tiempos.mjs 366 7 C  # tiempos de 12 semanas y de un año
```

El recorrido interactúa con los controles y comprueba resultados; las fallas (503, 429, sin red) y la respuesta lenta se
simulan interceptando pedidos en el navegador, sin tocar la API ni la base. **Antes de cada corrida conviene reiniciar
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
| PRO-04 | Área Nutrición + tipo «Comida registrada», «Ver más» hasta el final, búsqueda «cena», «Limpiar filtros» | 282 de 319, completos y sin repetir (282 distintos); la búsqueda recorre el período y **no viaja en la URL**; limpiar vuelve a 319 | `resultados/01` · `analisis.int-spec.ts` (cursor sin repetir ni perder; filtros sobre el período) | Verificado (integración y recorrido) | — |
| PRO-05 | «Abrir registro» desde la línea de tiempo; «Ver el origen de este dato» desde Analizar; ir a Nutrición y volver con «Atrás» | El registro correcto en un panel lateral; al cerrar con Esc, misma posición (57.182 px → 57.182 px) y el foco en el disparador; la URL del análisis (métricas, modo, fecha) sigue igual | `resultados/01` | Verificado en el recorrido local | — |
| PRO-06 | Pregunta de tres métricas; intentar una cuarta | Tres paneles; «Elegí cuál reemplazar»; cancelar conserva las tres (la URL no cambia). Una y dos métricas se recorren al quitar | `resultados/01` · dominio (`MAXIMO_DE_METRICAS`) | Verificado en el recorrido local | — |
| PRO-07 | Energía (kcal), proteínas (g) y peso (kg) en paneles | Un panel por unidad, con el mismo eje y la misma fecha elegida; una sola lectura para las tres | `resultados/01` · `analizar-*.png` | Verificado en el recorrido local | — |
| PRO-08 | Superponer kcal, g y kg; proteínas con carbohidratos; cambio relativo con y sin referencia | kcal/g/kg: bloqueado, «unidades distintas». Proteínas y carbohidratos: un gráfico, trazos distintos. Relativo: bloqueado si el peso no tiene observaciones en la referencia; si se puede, la referencia se ve (regla, rango, valor, n; «pocas observaciones» si n < 3) y la lectura da % y valor real. Base 0 o negativa: bloqueada | `resultados/01` · dominio (`NO_POSITIVA`, `SIN_OBSERVACIONES`, `ESCALA_NO_ADMITE`, familia y unidad) | Verificado (dominio y recorrido) | — |
| PRO-09 | Recorrer fechas con el teclado hasta un día sin toma de peso | «Sin dato en esta fecha. El más cercano: 7 oct 2026, a 1 día: 79,8 kg. No es simultáneo.» Nada se interpola | `resultados/01` · dominio (`lecturaEnFecha`) | Verificado (dominio y recorrido) | — |
| PRO-10 | Días sin cantidades, cero real, día en curso y exportación | Desconocido = vacío/«sin valor conocido» (nunca 0); 0 = 0; subtotal y «sin completar» en columnas propias del CSV; puntos huecos en el gráfico | dominio (serie nutricional; `exportacion-del-analisis.test.ts`) · `resultados/01` (CSV descargado: zona, generación, columna «Sin completar») | Verificado (dominio y recorrido) | **Estimados:** el conjunto no tiene valores estimados (los métodos antropométricos no se generan, `DATOS-SINTETICOS.md` §6) |
| PRO-11 | Merienda sin confirmar; cena informada; comida diferente; hoy en curso | Subtotal, nunca «ingesta diaria»; lo previsto no es consumido (396 kcal, no 527,2); el día en curso no entra en la media (sin eso, 7 días bajaban ~240 kcal) | verificador (25 de 25) · dominio · `resultados/01` | Verificado (dominio, verificador y recorrido) | — |
| PRO-12 | Media semanal y cobertura | Media de los días con valor con su denominador («5 de 7»); cobertura «80 días de 90»; sin porcentaje global; la opción registrada cuenta, las alternativas no se suman | verificador (13 de 13 semanas) · `resultados/01` | Verificado (verificador y recorrido) | — |
| PRO-13 | Series de la sentadilla en dos etapas; RIR | Cada serie con el objetivo de la versión de ese día; RIR nulo no es punto, 0 sí | dominio (`objetivosDeLaVersionDelPlan`, RIR) · verificador (8 puntos de RIR; nulos fuera) · `analisis.int-spec.ts` (escalones del objetivo) | Verificado (dominio, integración y verificador) | Revisión humana de cómo se lee el objetivo en el gráfico |
| PRO-14 | Banca en kg y en lb; hip thrust en lugar de zancadas | Las unidades no se mezclan (la serie en kg avisa la sesión en lb); un ejercicio sustituto no se suma al prescripto | verificador · dominio | Verificado (dominio y verificador) | — |
| PRO-15 | Dos tomas el mismo día; cambio de protocolo | Dos puntos, no un promedio; la línea del peso se corta en 3 tramos y no hay diferencia a través del corte | verificador · `analisis.int-spec.ts` · `resultados/01` (indicador «3 tomas comparables») | Verificado (integración, verificador y recorrido) | — |
| PRO-16 | Rectificación y anulación | Cuentan una vez y quedan en la historia, marcadas | verificador (2 rectificados una vez, 2 anulados fuera) · `analisis.int-spec.ts` · `resultados/01` | Verificado (integración, verificador y recorrido) | — |
| PRO-17 | Fechas civiles y semanas | Día del hecho y carga tardía en la zona del asesorado; semanas de lunes a domingo; sin corrimientos por UTC | dominio (Buenos Aires y Tokio; las pruebas pasan con el proceso en Buenos Aires, Tokio y UTC: 37 de 37) · exportación (11:30 UTC → 08:30) | Verificado (dominio) | La demostración usa solo `America/Argentina/Buenos_Aires` (DL-009) |
| PRO-18 | «¿Qué cambió entre dos etapas?» | Dos rangos explícitos; por métrica, el criterio, n de observaciones, duración y la diferencia descriptiva; sin palabras causales; totales de distinta duración o incompletos no se restan | dominio (`DURACIONES_DISTINTAS`, `PERIODO_INCOMPLETO`, `TRAMOS_NO_COMPARABLES`) · `resultados/01` | Verificado (dominio y recorrido) | — |
| PRO-19 | Guardar una vista; cerrar el navegador; en otra sesión, abrirla y borrarla | Reabre la misma configuración (métricas, período) y vuelve a pedir los datos; borrar pide confirmación | `resultados/01` · `analisis.int-spec.ts` (VAN: propias, 404 neutral, conflicto de versión) | Verificado (integración y recorrido) | — |
| PRO-20 | Asesorado B (vista parcial); tercero; revocación; CSV | Un solo aviso de vista parcial, sin nombrar lo oculto; el selector ofrece solo lo permitido; el tercero ve «No encontramos un recurso disponible» (404 en la API); un alcance revocado no aporta entradas, conteos, búsqueda ni proyección; el CSV sale solo de lo autorizado y sin fórmulas | `resultados/01` · `analisis.int-spec.ts` (revocación, tercero, anti-enumeración, `periodCounts`) | Verificado (integración y recorrido) | La revocación se prueba en integración, no en el recorrido (para no alterar la demostración) |
| PRO-21 | «7 días» lento y enseguida «90 días»; cambiar de A a B con A lento; 503 en el peso; 429; sin red | La respuesta vieja no pisa la nueva; nada de A aparece en B; lo que cargó bien sigue; cada falla con su texto y «Reintentar», nunca «sin datos» | `resultados/01` | Verificado en el recorrido local | — |
| PRO-22 | Teclado, foco, texto al 200 %, tabla, axe | Flechas, Inicio y Fin mueven la fecha; Esc devuelve el foco; sin desborde con el texto al 200 %; tabla de datos y resumen en texto; axe (WCAG 2.2 A/AA) sin violaciones automáticas en Resumen, Línea, registro abierto, Analizar y fallas | `resultados/01` · `resultados/03` | Verificado en el recorrido local | **Lector de pantalla** (NVDA o JAWS) y revisión manual de WCAG 2.2: axe no alcanza para declarar conformidad |
| PRO-23 | Claro y Azul noche a 1440, 1280, 1024, 768 y 390 px; 320 px | Sin desborde de costado, con pestañas y períodos en todos; diseño de escritorio a 1440, 1280 y 1024 | `resultados/02` (30 de 30) · `capturas-web/` · `resultados/01` (320 px) | Verificado y observado en captura | Revisión visual de Dirección |
| PRO-24 | Presupuesto: 12 semanas (declarado antes de medir) y un año (declarado después de la primera medición del año) | 12 semanas: cada lectura ≤ 300 ms y el Resumen ≤ 2,5 s. Un año: cada lectura ≤ 1 s y el Resumen ≤ 2,5 s. Sin N+1 | `resultados/04` y `05` · `resultados/01` (Resumen en el navegador) · perfil de CPU (abajo) | Verificado en local | Render no se midió: los tiempos locales no son los de Render |
| PRO-25 | Contratos, navegación profesional y sesión | Las suites existentes siguen pasando | Local: dominio 554, scripts 291, API 80; integración `analisis` 18 | Verificado en local | **CI del head del PR** |
| PRO-26 | De la carga sintética al origen de un punto | `regenerar.sh` → verificación 25 de 25 → en Analizar, el punto de energía de hoy abre su registro de comida (n = 1). La interfaz no tiene datos fijos: todo sale de la API | `resultados/01` · `DATOS-SINTETICOS.md` | Verificado en el recorrido local | — |

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
