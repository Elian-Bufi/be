# MESA-02-00 · ADDENDUM DE LEGIBILIDAD — v1

> **Emite:** contrarrevisión externa · **Fecha:** 2026-09-10
> **Complementa a:** `MESA_02_00_KIT_CONVENCIONES.md` (`95b76c2ade2abe33…`)
> **Naturaleza:** reglas de presentación. **No modifica el legajo, ni nombres canónicos, ni relaciones.**
> **Estado:** propuesto a Dirección · aplicable a DV-04 retroactivamente y a DV-06…DV-09 desde su producción
> **Evidencia:** prueba comparativa ejecutada sobre `DV-04.4 — Nutrición`, ver §7

---

## 1. Problema que este addendum corrige

El kit vigente verifica **fidelidad** —nombres canónicos, densidad, paleta, rotulado— y no verifica **legibilidad**. Por eso un diagrama puede aprobar los nueve controles de `§13` y seguir siendo ilegible para un tribunal.

Caso constatado: `DV-04.4 — Nutrición` cumplía 17 nodos y 23 conectores (dentro de límite), colores correctos y nombres exactos, y aun así presentaba elipses de relación de aspecto 9:1, diecinueve conectores cruzados en diagonal y el estereotipo `<<include>>` repetido diecisiete veces. La figura era verificable y no comunicable.

**Principio que se agrega al kit:** una figura que pasa los conteos pero no permite entender quién hace qué y en qué orden **no está terminada**.

---

## 2. `LEG-01` — Rótulo corto en figura, nombre canónico en tabla

En elipses, cajas y nodos, el rótulo es:

```text
ID canónico
2 a 4 palabras
```

Ejemplo: `UC-P09 / Evaluación y objetivo`, no `UC-P09 — Registrar evaluación y objetivo nutricional`.

El **nombre canónico completo** vive en la tabla índice del entregable (`DV-0X_*_INDICE.md`), que ya es obligatoria. Esta regla **no viola la regla de nombres canónicos** del kit: `NOMBRES_CANONICOS §3` ya establece que una etiqueta corta de presentación no adquiere condición canónica **siempre que el ID permanezca visible**. Acá el ID siempre está.

**Motivo técnico:** PlantUML deforma la elipse para contener el texto. Un rótulo de 50 caracteres produce una forma de relación 9:1 que deja de leerse como caso de uso.

---

## 3. `LEG-02` — Invocaciones transversales por nota, no por flecha

Cuando un caso incluido es invocado por **cuatro o más** casos de la misma vista —típicamente `UC-I02` autorización y `UC-I03` auditoría—, **no se dibuja la flecha**. Se declara en una nota:

```text
Invocación transversal: los N casos principales de esta vista
incluyen además UC-I02 y UC-I03. No se dibujan para preservar
legibilidad; están en DV-0X_RELACIONES_UML.csv.
```

**La relación no desaparece del entregable:** sigue en el CSV de relaciones, que es el artefacto verificable. Lo que desaparece es su representación gráfica redundante.

**Efecto medido:** en `DV-04.4`, los conectores bajan de 19 a 8 sin perder una sola relación declarada.

---

## 4. `LEG-03` — El layout cuenta la secuencia

Cuando la vista representa un circuito con orden —evaluar, diseñar, activar, registrar, revisar— el layout debe mostrarlo:

- `left to right direction`;
- casos principales alineados en secuencia horizontal;
- **conectores de secuencia en verde `#1FA97A`** entre casos consecutivos, con la aclaración en leyenda de que representan orden del proceso, no relación UML;
- casos incluidos dispuestos alrededor, no intercalados;
- actor pegado a su primer caso.

Si la vista **no** tiene secuencia natural —por ejemplo la de casos incluidos transversales— se declara en la nota y se dispone por agrupación temática.

**Prohibido:** `skinparam linetype ortho`. Probado: en la vista de nutrición duplicó la altura (637 → 1049 px) y alejó los incluidos a una columna remota.

---

## 5. `LEG-04` — Leyenda en vez de estereotipo repetido

El rótulo `<<include>>` **no se escribe en cada flecha**. Se declara una vez en la leyenda de la figura:

```text
Línea punteada → «include»
Línea punteada con flecha hueca → «extend»
Flecha verde → secuencia del proceso (no es relación UML)
```

Las flechas conservan su sintaxis `..>` en la fuente `.puml`, de modo que el conteo automático de `<<include>>` sigue siendo posible sobre el archivo. Lo que se omite es el texto renderizado.

**Excepción:** si una vista mezcla include y extend entre los mismos pares de nodos, se rotula solo el extend.

---

## 6. `LEG-05` — Tres controles nuevos de legibilidad

Se agregan al autocontrol de `KIT §13`:

| Control | Umbral | Cómo se mide |
|---|---|---|
| Relación de aspecto de nodo | `≤ 4:1` ancho/alto | inspección del export; si se excede, el rótulo es demasiado largo → aplicar `LEG-01` |
| Cruces de conectores evitables | `0` | inspección visual; si dos líneas se cruzan y reordenar los nodos lo evita, es evitable |
| Altura del export | `≤ 900 px` a escala nativa por vista | medición del PNG; si se excede, particionar o revisar layout |

Y un **control final obligatorio, de respuesta escrita**, que el productor debe incluir en su autoverificación:

> **Prueba de los treinta segundos.** ¿Un lector que no conoce el proyecto puede, mirando esta figura durante treinta segundos, decir quién hace qué y en qué orden? Respondé `SÍ` o `NO` con una frase de fundamento. Un `NO` obliga a rehacer el layout antes de empaquetar, aunque todos los conteos cierren.

---

## 7. Evidencia comparativa

Prueba ejecutada sobre la misma vista, mismo contenido, mismas relaciones declaradas:

| Métrica | `DV-04.4` v0.1.1 | Con addendum |
|---|---|---|
| Conectores dibujados | 19 | **8** |
| Etiquetas `<<include>>` renderizadas | 17 | **0** (leyenda) |
| Relación de aspecto máxima de elipse | ≈ 9:1 | **≈ 2:1** |
| Secuencia del circuito visible | no | **sí** (cadena verde) |
| Altura del export | 812 px | **637 px** |
| Relaciones declaradas en el entregable | 19 | **19** (8 dibujadas + 11 en nota y CSV) |
| Nombres canónicos alterados | 0 | **0** |
| Casos hogar | 5 | **5** |

**Ninguna relación se perdió.** Cambió qué se dibuja, no qué se declara.

Archivos de la prueba: `DEMO_DV-04_04_NUTRICION_MEJORADA.puml` y `.png`.

---

## 8. Alcance de aplicación

| Entregable | Aplicación |
|---|---|
| `DV-04` | **retroactiva** — reemisión de las 8 vistas + índice bajo `LEG-01…05` |
| `DV-06` DER | desde producción — `LEG-01`, `LEG-03`, `LEG-05` |
| `DV-07` clases | desde producción — `LEG-01`, `LEG-05`; `LEG-02` para invariantes repetidos |
| `DV-08`, `DV-09` C4 | desde producción — `LEG-01`, `LEG-04`, `LEG-05` |
| `DV-10` Gantt | `LEG-05` (altura y legibilidad) |
| `DV-01`, `DV-02`, `DV-03`, `DV-05` | no aplica (no son diagramas) |

---

## 9. Lo que este addendum NO autoriza

No autoriza omitir una relación del entregable: `LEG-02` cambia su representación, no su existencia. No autoriza abreviar el nombre canónico en tablas de trazabilidad. No autoriza colores fuera de la paleta: el verde de secuencia es el `#1FA97A` ya definido, con semántica declarada en leyenda. No autoriza reducir tipografía para forzar contenido —eso ya lo prohíbe `KIT §7`—. No autoriza modificar el legajo por ningún motivo.

---

## 10. Verificación de este addendum

Un revisor debe poder comprobar: que `LEG-01` conserve el ID visible en todos los nodos; que toda relación omitida por `LEG-02` aparezca en el CSV de relaciones del entregable; que el conteo de `<<include>>` sobre los `.puml` siga dando el número canónico; que los tres umbrales de `LEG-05` se cumplan; y que la prueba de los treinta segundos esté respondida por escrito.
