# Correspondencia DER–clases v5

Estas correcciones forman parte de H-M02-07 y su control de regresión; no modifican el canon ni la lista blanca de operaciones.

| Concepto | Corrección aplicada | Reflejo en clases |
|---|---|---|
| Especialidad, capacidad antropométrica y capacidad configurada | Referencia a Identidad BE profesional; configuración efectiva común | C3 reconstruida con los mismos extremos de R007–R012/R063–R064; conserva operaciones y guardas |
| Verificación | Alcance contextual y sucesión de presentaciones | C3; estados y lista blanca siguen en E2 |
| Componente de vínculo–Alcance | Varios componentes pueden usar el mismo alcance | C2: 0..N : 1, R016 |
| Instantánea | Una versión exacta; límite inverso según área | C4 retira máximo universal 0..1, R019 |
| Evaluación–Medición | Preparación incompleta admitida; registrabilidad contractual | C5: 1 : 0..N, R044 |
| Plan nutricional | Referencia a versión de objetivo; jerarquía de versión emitida | C6 precisa atributo y contexto; retira multiplicidad obligatoria de Ingesta–Comida |
| Entrenamiento | Microciclo opcional y referencia directa Bloque–Sesión | C7 agrega R065; retira mínimos no declarados y límite global 0..1 de ejecución |
| TVCC | Dependencia de conjuntos de ciclos, sin propiedad exclusiva | C8 retira multiplicidades persistentes de esa dependencia |
| Atributos nominales | DER detalla; clases pueden condensar la representación | Se retira la afirmación no demostrada de identidad textual de todos los atributos en C1 |

Las 35 filas de `DV-07_OPERACIONES.csv` y las dos guardas diferenciadas de `rechazar()` se preservan. Los controles de v5 comparan esas guardas, los estados y las operaciones para detectar regresiones. El alcance no equivale a una nueva auditoría integral de todas las clases ni del futuro esquema físico.
