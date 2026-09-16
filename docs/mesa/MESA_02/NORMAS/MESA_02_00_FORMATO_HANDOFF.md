# MESA-02-00 — Formato obligatorio de handoff

> **Fase:** MESA-02  
> **Aplicación:** todos los prompts `MESA-02-01…10`  
> **Objeto:** asegurar que cada entregable DV sea reproducible, verificable y contrarrevisable.

## 1. Estructura de carpeta

Cada entregable se entrega dentro de:

```text
MESA_02_0X_DV-XX/
```

Estructura mínima:

```text
MESA_02_0X_DV-XX/
├── README_DV-XX.md
├── [DOCUMENTO_PRINCIPAL].md
├── source/
│   ├── [figura_1].[puml|mmd]
│   └── [...]
├── exports/
│   ├── [figura_1].svg
│   ├── [figura_1].png
│   └── [...]
├── NOTA_DERIVACION_DV-XX.md
├── AUTOVERIFICACION_DV-XX.md
├── MISION_CONTRARREVISION_DV-XX.md
└── MANIFEST.sha256
```

Si el DV no contiene figura, las carpetas `source/` y `exports/` pueden omitirse **solo si el prompt específico no exige gráfico**. La nota debe declararlo.

## 2. Fuente editable

Obligatoria para cada figura.

Formatos autorizados:

```text
PlantUML:
casos de uso
clases
componentes
C4-Standard

Mermaid:
DER erDiagram
Gantt
```

No se acepta como fuente editable:

- PNG;
- SVG sin fuente textual;
- captura;
- PDF;
- imagen generada;
- diagrama pegado sin código fuente.

## 3. Exports

Cada figura debe tener:

```text
SVG
+
PNG
```

Controles:

- mismo título/ID que la fuente;
- sin recorte;
- texto legible;
- pie de derivación visible;
- estado de reconciliación visible si aplica;
- mismos nodos y relaciones que la fuente editable.

El export no es una nueva fuente semántica.

## 4. Nota de derivación

Debe instanciar:

```text
MESA_02_00_PLANTILLA_DERIVACION.md
```

Campos obligatorios:

- DV;
- fuentes + versión + hash;
- condensación;
- omisiones;
- declaración de no cambio;
- reconciliación;
- `TO VERIFY`;
- IDs canónicos;
- figuras y densidad;
- autocontrol de léxico.

Si falta una fuente:

```text
NO EVIDENCIADO
```

y se explicita qué parte queda no cerrable.

## 5. README del entregable

Debe responder en menos de una página:

1. qué exige Da Vinci;
2. qué objeto produjo MESA;
3. de qué fuentes deriva;
4. qué estado tiene;
5. qué debe mirar primero el revisor;
6. qué queda `TO VERIFY` o a reconciliar.

No replica la nota completa.

## 6. Autoverificación falsable

`AUTOVERIFICACION_DV-XX.md` debe contener controles que puedan fallar.

Ejemplos:

```text
conteo esperado vs real
IDs únicos
IDs faltantes
IDs extra
nombres byte-idénticos
prioridades byte-idénticas
relaciones contra fuente
nodos <= 25
conectores <= 40
rótulos presentes
fuentes presentes
exports presentes
runtime claims = 0
```

No basta con declarar `CONFORME`: se publican los conteos/resultados.

## 7. Misión de contrarrevisión

`MISION_CONTRARREVISION_DV-XX.md` debe ser ejecutable por un revisor independiente.

Debe incluir:

### 7.1 Custodia
- verificar `MANIFEST.sha256`;
- identificar objeto exacto;
- detener si el hash no coincide.

### 7.2 Fuentes
- enumerar fuentes obligatorias;
- exigir lectura primaria;
- marcar faltantes `NO EVIDENCIADO`.

### 7.3 Pregunta principal a falsificar
Ejemplo:

```text
Intentar demostrar que el diagrama creó,
omitió o renombró un elemento canónico.
```

### 7.4 Controles cuantitativos
Los que correspondan al DV.

### 7.5 Controles semánticos
- nombres;
- relaciones;
- prioridades;
- actoría;
- fronteras documentales;
- reconciliación.

### 7.6 Barrido de estado
Intentar encontrar afirmaciones no sustentadas de:

```text
IMPLEMENTED
DEPLOYED
PASS
RUNTIME VERIFIED
```

### 7.7 Veredicto
Definir salidas cerradas, por ejemplo:

```text
CONFORME — DV-XX APTO PARA MESA
CONFORME CON AJUSTES MENORES
NO CONFORME — CORREGIBLE SIN CAMBIO CANÓNICO
NO CONFORME — POSIBLE CAMBIO CANÓNICO / DETENER
```

## 8. MANIFEST.sha256

Se genera **al final**, sobre los bytes finales.

Formato:

```text
<sha256 64 hex><dos espacios><ruta relativa>
```

Reglas:

- una fila por archivo del handoff, excepto el propio `MANIFEST.sha256` si la herramienta de generación no admite manifiesto autorreferente;
- orden lexicográfico por ruta;
- no aceptar hashes copiados de una versión anterior;
- la misión debe recalcularlos.

## 9. Nombres canónicos

Todos los diagramas consumen:

```text
MESA_02_00_NOMBRES_CANONICOS.md
```

No crean un glosario paralelo.

## 10. Figuras

Rotulado obligatorio:

```text
Figura DV-0X.n — Título
```

Pie obligatorio:

```text
Derivado de BE-LEG-xx vX.Y · sin cambio semántico · estado: [...]
```

Densidad:

```text
<= 25 nodos
<= 40 conectores
```

Superado el límite:

```text
PARTICIONAR
+
CREAR VISTA ÍNDICE
```

## 11. Reconciliación

Para `DV-06`, `DV-07` y el tratamiento de tecnologías de `DV-02.6`:

```text
ESTADO: CONCEPTUAL — A RECONCILIAR CON REPOSITORIO
```

Debe existir en:

- documento principal;
- figura o sección afectada;
- nota de derivación;
- misión de contrarrevisión.

## 12. Prohibiciones

El handoff no puede:

- modificar 01–12;
- introducir una decisión canónica;
- crear RF/RNF/UC;
- inventar entidades o relaciones;
- inventar endpoints;
- cambiar prioridades;
- usar mercado histórico como vigente;
- inventar equipo/calendario;
- usar datos reales;
- afirmar runtime;
- operar Git.

## 13. Criterio de completitud del handoff

Un DV queda `HANDOFF COMPLETO` solo si:

- [ ] objeto principal presente;
- [ ] fuentes editables presentes cuando aplica;
- [ ] SVG y PNG presentes cuando aplica;
- [ ] nota de derivación presente;
- [ ] autoverificación presente;
- [ ] misión independiente presente;
- [ ] manifiesto presente;
- [ ] todos los hashes recalculables;
- [ ] todos los `TO VERIFY` visibles;
- [ ] no hay fuente requerida reconstruida.

Si falla cualquiera:

```text
HANDOFF INCOMPLETO
```

No se eleva a contrarrevisión como si estuviera cerrado.
