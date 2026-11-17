# Tesis v1 — registro de avance

> Para retomar después de una interrupción: leer este archivo de arriba abajo, después `LEEME.md`.
> Encargo de Dirección del 2026-10-20 (madrugada): documentación de tesis según «Entregables» de la Escuela Da Vinci,
> versión 2025.05, y base de la defensa. Rama `mesa/tesis-v1`, árbol de trabajo `C:\Users\bufim\BE-tesis`.

## Reglas que gobiernan este trabajo

- Orden obligatorio de los 14 apartados; anexos después del 14.
- Gantt (10) y enlaces (11, 12 y 13): **diferidos por Dirección**. Se conservan los apartados, con «Pendiente de
  incorporación en el cierre». No se deduce el mes de presentación.
- El repositorio es **público**: el logo de la escuela, los correos institucionales y las credenciales no van a Git.
  Viven en `C:\Users\bufim\BE-datos-locales\tesis\` y solo entran en la versión de evaluación del PDF, que se compila
  localmente.
- `docs/legajo/**` y todo lo listado en `docs/MANIFEST.sha256` no se editan. La tesis deriva; no reescribe.
- Producto implementado ≠ aprobado pendiente ≠ propuesta. Comprobación local o de CI ≠ verificación remota.
- No se cambia el producto para que coincida con un gráfico: los defectos van a `DISCREPANCIAS.md` como pendientes.
- Memoria limitada: una tarea pesada por vez, sin navegadores simultáneos, sin vigilantes permanentes.

## Herramientas (fuera del repositorio)

| Herramienta | Versión | Dónde | SHA-256 del archivo bajado |
|---|---|---|---|
| Typst | 0.15.1 | `C:\Users\bufim\BE-herramientas\typst-0.15.1\` | `19ce3551…6736` (`typst-x86_64-pc-windows-msvc.zip`) |
| Inter | 4.1 | copia en `docs/mesa/TESIS/tipografias/` (OFL) | `9883fdd4…b11e` (`Inter-4.1.zip`) |
| JetBrains Mono | 2.304 | copia en `docs/mesa/TESIS/tipografias/` (OFL) | `6f6376c6…7bbf` (`JetBrainsMono-2.304.zip`) |
| Node | 22 (fnm) | el del proyecto | — |

## Hitos

| # | Hito | Estado | Fecha |
|---|---|---|---|
| A | Cierre técnico autorizado (etapas 2 a 5 del encargo por etapas) | **hecho** (ver bitácora); informe en el documento de Claude Docs del encargo, sección «Integración por etapas del 20/10» | 2026-10-20 |
| B | Inventario de fuentes y versión de referencia (`datos/version.json`: main `0fb1bff`) | **hecho** | 2026-10-20 |
| C | Guía visual, motor de láminas y dos láminas patrón (ARQ-02, DER-03) | **hecho** (`c290925`) | 2026-10-20 |
| D | Documento: 14 apartados | **hecho** (1 a 14; 10, 12 y 13 con sus campos diferidos al cierre) | 2026-10-20 |
| E | Anexos A a L: flujos, DFD, secuencias y estados, trazabilidad, diccionario, decisiones, glosario, referencias, discrepancias, convenciones | **hecho** (`5509615` y siguiente) | 2026-10-20 |
| F | Tres pasadas de revisión | **hecho**: cobertura, consistencia y la visual y editorial (un revisor editorial, tres visuales y dos de cierre), aplicadas en `27d7707` a la parte 4 | 2026-10-20 |
| G | Base de la defensa: guion, preguntas, demo, presentación | **hecho** (`dd9c2e0`; presentación en https://claude.ai/artifact/9LiufGdUTJjAbEonGT8t2U) | 2026-10-20 |
| H | Informe final | **hecho** (`INFORME.md`) | 2026-10-20 |

## Bitácora

- **2026-10-20 01:55** — Etapa 2 verificada en test con Chrome 155.0.8059.80: borrador, recarga con texto sin guardar,
  conflicto entre pestañas y navegación sin conexión, 11/11. El vínculo de la persona de verificación quedó finalizado.
- **2026-10-20 02:05** — Rama `mesa/tesis-v1` creada desde `main` `f65cf03`. Typst 0.15.1 probado: respeta Inter y
  JetBrains Mono dentro de los SVG.
- **2026-10-20 02:10** — #189 integrado (`20f1bb7`), CI de main verde, API de test en `20f1bb7` con la migración de
  los cortes aplicada.
- **2026-10-20 02:22** — #192 integrado (`0fb1bff`; solo cambia el website). Revisión de solo lectura de las 16 recetas
  contra la API de test (`20f1bb7`): 16 cargables, 16 verificadas, 0 con foto, 0 en la cuenta de Sofía. Nada escrito.
- **2026-10-20 03:10** — Etapa 5: el agente dejó #198 en borrador (CI verde, `ac1a183`): las APK 0.13.2 y
  0.17.0-candidata.3 leen 82 operaciones distintas (44 y 80); se congelaron sus esquemas y una prueba de integración
  lee respuestas reales con ellos; sin incompatibilidad nueva; DL-152 D-1 a D-5 a ratificar. No se integró.
- **2026-10-20 03:04** — Hito C: guía visual (`estilo/tokens.json`), motor de láminas con revisión automática, ARQ-02 y
  DER-03 aprobadas como patrón (revisadas sueltas y dentro del PDF), plantilla Typst con variante pública y de
  evaluación, portada y esqueleto de los 14 apartados. Commit `c290925`, rama subida.
- Inventario técnico: `herramientas/leer-esquema.mjs` → `datos/esquema.json` (113 modelos, 78 enumeraciones, 212
  relaciones); `herramientas/evidencia-por-requisito.mjs` → `datos/evidencia-rf.json` (69 RF con su evidencia). Contra
  el inventario del 09, 104 de 122 operaciones P0 implementadas (faltan las 13 PRO, DSH-01/02/05, PRJ-02/03).
- **2026-10-20 03:41** — Apartados 2, 3 y 4 escritos (`03e53d9`): acta con competencia y mercado con fuentes
  fechadas; 69 requisitos por superficie con estado y evidencia; 56 casos de uso con la vista general (CU-00), ocho
  vistas por módulo (CU-01 a CU-08) y sus fichas tomadas del 05 v0.15.
- **2026-10-20 04:03** — Apartado 5 escrito. `herramientas/casos-de-prueba.mjs` une DV-05, la conciliación del 2/10 y
  el mapeo del 16/10, y busca cada prueba citada en el repositorio: 223 citas, todas vigentes (4 con título
  actualizado). Resultado en `0fb1bff`: 42 de 59 pasan en la CI, 9 en parte, 8 no ejecutables. Seis casos
  actualizados con fuente (DL-115 corrigió H-1; la línea de tiempo existe desde el 16/10; Google tiene su variante de
  caída). Casos ejecutados fuera de la CI en `datos/casos-ejecutados.json` (V-SES, V-BOR, V-REC, T-GOO, T-INV, T-015,
  T-014), con sus informes y guiones en `evidencia/remota/2026-10-20/`. Todo rótulo del documento pasó a 10 pt como
  mínimo; las tablas dentro de figuras alinean a la izquierda y pueden partirse.
- **Hallazgos para el anexo K:** la fila de DL-115 en la tabla de `docs/DEUDA_LEGAJO.md` dice «sin integrar» (se integró
  con la 0.13.2); el mapeo del 16/10 afirma que no hay línea temporal entre dominios y que push está fuera de alcance
  (las dos cosas ya existían ese día); las pruebas del teléfono del 17/10 (Google e invitaciones) no tienen acta escrita.
- **2026-10-20 04:37** — Apartado 6 (DER) y anexo G (diccionario). Motor: compositor de vistas del DER
  (`laminas/motor/der-vista.mjs`): grilla declarada por vista, medida con la tipografía real, todas las relaciones del
  esquema trazadas solas, carriles ordenados por fuerza bruta para minimizar cruces (y penalizar superposiciones), lazos
  por un lado libre o por arriba, ajuste automático de atributos visibles. Cabeceras de entidad en dos renglones y
  columna de claves adaptativa. Láminas DER-00 (paquetes por dominio, con «pastillas» de cantidad) y DER-01 a DER-14
  (DER-03 sigue siendo la patrón). Cruces inevitables: 2 en DER-04 y 2 en DER-11 (relaciones en sentidos opuestos).
  Cifras de la base verificadas en el catálogo de PostgreSQL 16.14 con las 51 migraciones aplicadas en una base
  temporal (borrada): 113 tablas, 78 enumeraciones, 212 FK (todas RESTRICT), 125 índices únicos (34 parciales), 134
  CHECK, 275 disparadores (16 de restricción), 73 funciones de disparador. **Las cifras anotadas antes (262 disparadores,
  128 únicos, 36 parciales, 133 CHECK) estaban mal y no se usan.** Anexos con letras (A a L) y su propia numeración.
- **2026-10-20 05:10** — Apartados 7 (clases: CL-01 dominio, CL-02 escritura protegida, CL-03 jerarquías), 8 (ARQ-01
  contexto, ARQ-03 despliegue), 9 (COMP-01 sistema, COMP-02 módulos; 191 operaciones en 30 familias), 11 (guion de
  demo), 14 (las 14 cuentas sintéticas entran en test, verificado sin escribir nada; credenciales solo en
  `BE-datos-locales/tesis/privado.json`) y la ficha del apartado 1. Portada con una captura real del website en test.
  La API de test corre 0fb1bff desde las 02:33 (Render la reconstruyó).
- **Para Dirección:** la persona de verificación del 20/10 («Verificación QA», vínculo finalizado) aparece en la cartera de
  Sofía como «Asesorado · bea2eb · Nutrición: Finalizado». Es historia (no se borra); para la demo conviene saberlo.
- **Nota sobre las horas:** hasta el 20/10 a las 06:20, cinco horas de esta bitácora estaban estimadas y adelantadas; se
  corrigieron con la hora de cada commit (`git log`).
- **2026-10-20 05:19** — Anexos A (entrega), F (trazabilidad), H (decisiones y evolución), I (glosario), J
  (referencias), K (discrepancias K1 a K18) y L (convenciones).
- **2026-10-20 05:58** — Láminas de los anexos B, C y D (`5509615`). El motor suma nodos de actividad, estados,
  secuencia y DFD, y carriles; la revisión automática mira la forma real de rombos y círculos, controla los círculos de
  proceso, los nodos que se pisan y los textos libres sobre nodos. El nivel 1 del DFD va en tres láminas (D-01 a D-03)
  con una sola numeración, porque en una sola no se leía a tamaño real.
- **2026-10-20 06:20** — Anexo E (secuencias E-01 activar un plan y E-02 recuperar la sesión; estados E-03 vínculo y
  E-04 consentimiento, plan y proceso) y el texto de los anexos B a E, con «En 30 segundos» por figura. Herramientas
  nuevas: `operaciones-y-casos.mjs` (136 operaciones con el caso de uso que dejan en su procedencia, leído del código),
  `operaciones-detalle.mjs` (método, ruta y resumen del contrato) y `maquinas-de-estado.mjs` (las cinco tablas de
  transición del dominio, copiadas). 44 láminas sin hallazgos automáticos; documento de 352 páginas.
- **2026-10-20 06:48** — Base de la defensa (`dd9c2e0`): guion con tiempos, demo de siete minutos con plan B de doce
  capturas tomadas en test, 22 preguntas con respaldo, presentación de 16 diapositivas con notas del orador y el
  `LEEME.md` de entrada. Prueba de explicación: 20 de 20 entre 37 y 47 segundos.
- **2026-10-20 06:54** — Compilación reproducible (`0e19b1d`): el documento y las láminas fijan la fecha de creación con
  la del commit de referencia; dos compilaciones dan el mismo archivo.
- **2026-10-20 08:05** — Pasada 3, parte 1 (`27d7707`): correcciones de la revisión editorial y de las visuales de las
  páginas 125 a 352 (composición del código sin silabeo, filas que no se parten, fichas con su encabezado, tablas de
  estados más anchas, láminas DER con aire, secuencias con rótulos que entran, glosario, referencias, K19). **Corrección
  de datos:** las herramientas de operaciones no leían los identificadores API-ACC-P1-03 ni API-INT-*-0n, ni las rutas
  escritas como constantes; ahora dan 191 operaciones con detalle y 142 con caso de uso (antes 184 y 136).
- **2026-10-20 08:13** — Informe final (`INFORME.md`, `f4e824a`).
- **2026-10-20 08:28** — Pasada 3, parte 3 (`603fef0`): la revisión de las páginas 45 a 104 (fichas de casos de uso:
  texto del 05 sin marcas de la extracción, encabezados, concordancias, leyendas de las vistas verificadas contra las
  fichas) y la tabla de credenciales de la versión de evaluación, revisada con los datos enmascarados. Ese revisor no
  llegó a las páginas 1 a 44 ni al final del apartado 4: van dos revisores de cierre. PR en borrador #199 (sin
  integrar). **Incidente:** al revisar la versión de evaluación, una salida de consola mostró un fragmento de la
  contraseña de una cuenta sintética de test (Martín Acosta); no quedó en el repositorio ni en ningún archivo.
- **2026-10-20 08:50** — Pasada 3, parte 4: los dos revisores de cierre (páginas 1 a 44 y final del apartado 4). Tabla de
  la competencia en una página apaisada; identificadores, versiones, nombres en camelCase y marcas sin cortes en el
  texto; estados de los entregables («Completo», «Diferido al cierre»); fichas de requisitos con más aire y etiquetas
  de plataforma iguales; criterio de «Verificado en test»; relaciones del 05 que su índice no registra (K20);
  leyendas de las vistas de casos de uso con sistemas externos y la marca «parcial».
- **Cómo seguir:** la tesis v1 está cerrada en la rama `mesa/tesis-v1` (PR en borrador #199). Lo que falta lo completa
  Dirección: ver `INFORME.md`, «Lo que necesita Dirección». Herramientas: `node herramientas/<herramienta>.mjs`; láminas: `node laminas/construir.mjs [ID]`;
  documento: `node construir-documento.mjs [--png <carpeta>] [--evaluacion]`.
