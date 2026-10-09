# La guía de UX y UI dentro de este encargo

Pedido de Dirección del 2026-10-09: usar `docs/ux/GUIA-UX-UI.md` como base de consistencia, actualizarla dentro del
encargo y verificar el resultado en pantalla; después, aplicar las pautas a lo pendiente, revisar lo ya implementado e
informar qué se cumplía, qué se ajustó y qué contradicciones quedan.

## Cómo quedó la guía

- **Parte I · Principios generales** (website y APK): texto y la regla de «una línea» aclarada, avisos, estados, acceso,
  color y temas, datos y cálculos. Se conservaron todas las garantías de accesibilidad, permisos, integridad de datos y
  manejo de errores.
- **Parte II · Website profesional:** escritorio primero (1440, 1280, 1024), superficies mates, navegación transversal,
  contexto suficiente para decidir, continuidad entre resumen, análisis, origen y acción, los patrones del entorno de
  seguimiento con sus componentes reales, sus estados, y la pestaña Antropometría en su propio apartado.
- **Parte III · APK:** sin cambios de fondo, en su parte. Las reglas del teléfono y de Antropometría no se extienden al
  dashboard.
- **Parte IV · Verificación y lista de control**, separada por superficie.
- **Parte V · Qué cambió:** la tabla de pautas ampliadas, aclaradas o sustituidas, y dónde quedó cada sección de la
  versión anterior (otros documentos la citan por número).

## Pautas que la ficha ya cumplía

Solo tokens de color (la prueba de contraste los mide), explicaciones largas en `Ayuda`, éxitos en `AvisoFlotante` y
confirmaciones modales, tabla equivalente y resumen en texto de cada gráfico, «Sin dato» en vez de cero, nada que
califique (con una prueba de palabras), la fecha del hecho primero, teclado y foco visible, objetivos de 44 px en
botones y controles, los dos temas, la URL con solo identificadores, superficies mates en las secciones.

## Pautas que llevaron a ajustar lo implementado

| Pauta (guía) | Ajuste concreto | Dónde |
|---|---|---|
| Una línea de **explicación**; el contexto para decidir no se pliega (I.2) | La línea de la síntesis quedó en una sola; qué es un subtotal se dice junto a la media; la cobertura dice desde cuándo rige el plan | `resumen.tsx`, `sintesis-del-resumen.ts` |
| Una sola vez lo que vale para un bloque (II.8) | Se quitó la línea de metadatos que repetía el período en «Objetivo y planificación»; el acceso actual se dice una vez si todas las áreas comparten estado | `resumen.tsx`, `workspace.tsx` |
| Escritorio primero; la primera pantalla responde (II.1, II.3) | Tabla con una fila por área: a 1440 × 900 se ven el objetivo, la planificación y la primera observación de la síntesis | `resumen.tsx`, `globals.css` |
| No achicar la letra para que entre (I.5) | Un primer intento achicó la tabla al 95 %: se revirtió y se cambió la composición (textos de una línea) | `globals.css` |
| Superficies mates (II.2) | Las tablas dentro de una sección mostraban dos franjas oscuras (las «tapas» del desplazamiento tenían el color del fondo de la página): ahora toman el de su superficie | `globals.css` (`.desplazable-x`) |
| Navegación transversal y continuidad (II.3, II.5) | El panel de origen lleva `volver` a la pestaña del área; la ficha inicial también tiene a dónde volver; la entrada por preguntas está en el Resumen | `registro-original.tsx`, `estado.ts`, `resumen.tsx` |
| Contexto para decidir (II.4) | La información para revisar muestra el objetivo que se revisa y lleva a lo nuevo desde el corte | `informacion.tsx` |
| Estados (I.4, II.7) | El conflicto conserva lo elegido; lo que falta en la síntesis va primero; un solo «Reintentar»; el acercamiento se suelta al cambiar de análisis | `resumen.tsx`, `sintesis-del-resumen.ts`, `analizar.tsx` |
| Números con su unidad, sin ruido (I.2) | «1 registro», ejes enteros para repeticiones y RIR, la unidad una vez en el título del panel | `series-del-analisis.ts`, `lienzo.tsx` |
| Un mismo dato, un mismo nombre (II.6, nueva) | El número de versión de un plan es su orden de activación en todas las pantallas | `fuentes.ts` (API), `resumen.tsx` |

## Contradicciones encontradas

| Contradicción | Cómo se resolvió |
|---|---|
| «Una línea de contexto, lo demás plegado» (§2) contra «No se pliega lo que hace falta para decidir» (§10) | Aclarada en I.2: la línea es de explicación; el contexto para decidir va junto al dato y no se pliega. |
| «La acción principal visible en 390 px» para todo el website, contra escritorio primero | Sustituida en el profesional (II.1); la regla de 390 px queda para el website del asesorado y Antropometría. |
| La guía nueva decía que las etapas «nunca se eligen por la persona», pero la pantalla sugiere las dos últimas | Se corrigió la guía para que diga lo implementado y lo pedido por el encargo: se sugieren a la vista y se confirman; el ejercicio, la medida y la versión nunca. |
| «44 px para todo objetivo», con enlaces en línea de unos 24 px en todas las pantallas | Aclarada en I.5: un enlace dentro de un texto o una celda sigue la excepción «en línea» de WCAG 2.5.8; las listas de enlaces sueltos llevan el alto. |
| Mi propio intento de achicar la letra para que entre la síntesis, contra I.5 | Revertido; se cambió la composición. |

**Pendientes al cerrar el encargo** (el primero se resolvió en la pasada siguiente):
- ~~**«Lo primero que se ve es el dato principal o la acción» (I.1.1) contra el formulario de revisión**: «Registrar
  revisión» quedaba debajo de una lista de 70 casillas de evidencia.~~ Resuelto en la pasada del 2026-10-09 (D-29):
  la evidencia se marca agrupada por día y por tipo (ver abajo).
- **El lector de pantalla** no se probó con una persona (`LECTOR-DE-PANTALLA.md`): la lista de control (IV.1) lo pide
  para cerrar una pantalla y la guía no lo da por hecho. **Sigue pendiente.**

## Pasada de corrección y usabilidad (2026-10-09, sobre el PR #154)

| Pauta | Qué pasó | Dónde |
|---|---|---|
| Contexto para decidir: la cobertura con su denominador (I.1.6, II.4) | **No se cumplía en nutrición.** La tabla de etapas y «Comparar dos períodos» usaban como denominador los días con registros: «2 de 2 días con valor» en un rango de 14. Ahora los días del rango por categoría; la guía cambió su ejemplo, que tenía el mismo formato engañoso | `series-del-analisis.ts` (`partesDeLaCobertura`), `etapas.tsx`, `analizar.tsx`, `resumen.tsx`; GUIA II.4 |
| Lo primero, el dato o la acción (I.1.1) | Ajustado: la evidencia de una revisión, agrupada, con lo marcado a la vista y nada marcado al abrir | `evidencia-de-revision.tsx`; GUIA II.5 |
| Precisión del texto: un dato no dice más de lo que es (I.2) | Ajustado: «no registraron las porciones del plan» mezclaba el modo de registro con una diferencia; ahora son dos columnas y dos filtros | `contraste.tsx`, `contraste-de-comida.ts`, API-DSH-04; GUIA II.6 |
| Un mismo aviso no se repite (I.2) | Ajustado con la pregunta de etapas: «no se restan» y «no indica causa» estaban tres veces; ahora una | `analizar.tsx`, `etapas.tsx`; GUIA II.6 |
| No achicar la letra (I.5) | Se cumplía; la cobertura de las tablas subió de 0,88 a 0,95 rem porque es contexto para decidir | `globals.css` |
| Objetivos de 44 px (I.5) | Se cumplen en los controles nuevos: «Ver las 4», «Quitar», los resúmenes plegados | `globals.css` |

**Contradicción encontrada y resuelta:** I.1.3 decía «ni semáforos, ni rangos», y el contraste de entrenamiento (dominio,
con prueba) dice «dentro del rango» o «−1 del mínimo» frente al rango prescrito. Se precisó el alcance: se prohíben los
rangos normativos que clasifican a la persona; el rango prescrito y los intervalos descriptivos se muestran como dato.
Las garantías del dominio (`PALABRAS_QUE_CALIFICAN` y las listas de términos prohibidos, con sus pruebas) no cambian.

## Verificación en pantalla

- `recorrido-comprension.mjs mirar` (1440 px, Azul noche, compilación final de la pasada, `269d930`): 20 pantallas nuevas o cambiadas sin desborde, sin violaciones de axe,
  sin doble desplazamiento y sin errores de consola.
- `capturas`: las tres vistas y las pantallas nuevas a 1440, 1280 y 1024 px en los dos temas, y a 768 y 390 px el
  Resumen y una pregunta; la primera pantalla a 1440 × 900 y a 1280 × 800 (GUIA II.1) comprobada.
- `funcional`: las pautas de estados, continuidad y accesibilidad, comprobadas con su resultado esperado (ver
  `ACEPTACION.md`).
