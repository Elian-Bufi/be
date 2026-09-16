# MESA-02-00 — Kit de convenciones gráficas

> **Proyecto:** BE — Plataforma integrada de inteligencia en salud  
> **Fase:** MESA-02 · artefactos académicos estáticos  
> **Fecha:** 2026-09-10  
> **Estado:** BASELINE DE PRESENTACIÓN PARA MESA-02  
> **Runtime:** NO EVIDENCIADO / NO REQUERIDO EN ESTA FASE  
> **Git:** SIN OPERACIONES  
> **Regla rectora:** derivar el legajo; nunca reescribirlo.

## 1. Propósito

Este kit fija las convenciones comunes para los artefactos gráficos y documentales de MESA-02.  
No crea requisitos, casos de uso, entidades, endpoints, estados, políticas, reglas ni decisiones.

La capa MESA transforma **representación**, no semántica.

## 2. Paleta única

Solo se permiten estos seis valores cromáticos:

| Uso | Color |
|---|---|
| Fondo | `#FFFFFF` |
| Tinta / texto principal | `#0F1C2E` |
| Elementos estructurales del sistema | `#1F5FBF` |
| Actores humanos y validación | `#1FA97A` |
| Elementos externos, diferidos o a reconciliar | `#C98F2C` |
| Notas, aclaraciones y metadatos | `#6B7A90` |

**Prohibición:** no introducir colores adicionales, gradientes, transparencias cromáticas decorativas ni codificaciones alternativas por entregable.

## 3. Tipografía

- Una sola familia sans serif: **Inter** o equivalente sans disponible en el sistema.
- Serif: prohibida.
- Monoespaciada: solo para identificadores canónicos (`RF-`, `UC-`, `M-`, `API-`, `REG-`, `INV-`, `TEST-`, etc.).
- Jerarquía por tamaño, peso y espaciado; no por cambio de familia.

## 4. Rotulado obligatorio de figuras

Encabezado:

```text
Figura DV-0X.n — Título
```

Pie:

```text
Derivado de BE-LEG-xx vX.Y · sin cambio semántico · estado: [BASELINE | CONCEPTUAL — A RECONCILIAR]
```

Cuando una figura consuma más de una fuente:

```text
Derivado de BE-LEG-xx vX.Y + BE-LEG-yy vA.B · sin cambio semántico · estado: [...]
```

Si una fuente necesaria no está disponible como objeto verificable:

```text
FUENTE NO EVIDENCIADA — FIGURA NO CERRABLE
```

No se reconstruye la fuente.

## 5. Estados visuales permitidos

### `BASELINE`

Usar cuando la representación deriva de fuentes documentales vigentes y no depende de reconciliación con repositorio.

### `CONCEPTUAL — A RECONCILIAR`

Obligatorio en:

- `DV-06` — DER;
- `DV-07` — diagrama de clases;
- la sección `DV-02.6` — tecnologías objetivo hasta intake.

No se omite por razones estéticas.

## 6. Leyenda estándar reutilizable

La misma leyenda debe acompañar UML, C4 y DER cuando aplique:

| Semántica | Representación |
|---|---|
| Sistema, módulo, contenedor, entidad/clase del sistema | borde/relleno estructural `#1F5FBF` |
| Actor humano o elemento de validación | `#1FA97A` |
| Sistema externo, dependencia externa, diferido o elemento a reconciliar | `#C98F2C` |
| Nota, metadato, referencia, aclaración no ejecutable | `#6B7A90` |
| Texto principal | `#0F1C2E` |
| Fondo | `#FFFFFF` |

La forma geométrica depende de la notación; el color conserva siempre la misma semántica.

## 7. Densidad máxima

Por figura:

```text
NODOS <= 25
CONECTORES <= 40
```

Si cualquiera de los dos límites se supera:

1. detener el crecimiento de la figura;
2. particionar por vista o dominio;
3. producir un diagrama índice;
4. referenciar las vistas;
5. mantener IDs canónicos en todas las vistas.

No se reduce tipografía para forzar contenido dentro de una única figura.

## 8. Formatos editables obligatorios

| Tipo de artefacto | Fuente editable |
|---|---|
| UML casos de uso | PlantUML |
| UML clases | PlantUML |
| UML/componentes | PlantUML |
| C4 contexto/contenedores/componentes | PlantUML + C4-Standard |
| DER crow's foot | Mermaid `erDiagram` |
| Gantt | Mermaid `gantt` |

Cada figura debe entregar:

```text
fuente textual editable
+ export SVG
+ export PNG
```

El SVG es el export vectorial primario; el PNG es un derivado de visualización.

## 9. Reglas de gobierno de MESA-02

### 9.1 Derivar, no reescribir

Toda figura declara su fuente del legajo, versión y hash.  
Condensar o particionar no autoriza modificar nombres, IDs, relaciones, prioridades ni semántica.

### 9.2 `SPECIFIED != IMPLEMENTED != TESTED`

MESA-02 describe el sistema especificado.

Usar formulaciones como:

- `BE especifica que...`
- `el diseño prevé...`
- `BE-LEG-11A define...`

No usar como afirmación del estado actual:

- `BE funciona...`
- `los usuarios pueden...`
- `se implementó...`
- `está desplegado...`
- `está probado...`

### 9.3 Datos del equipo y calendario

Los siguientes valores son siempre `TO VERIFY` hasta que Dirección los complete:

- integrantes;
- nombres y apellidos;
- correos `@davinci.edu.ar`;
- roles reales del grupo;
- remitente de la entrega;
- mes/año de mesa o entrega.

No se colocan valores plausibles.

### 9.4 Reconciliación

`DV-06`, `DV-07` y `DV-02.6` deben declarar su reconciliación pendiente con el repositorio.

La ausencia del rótulo invalida el artefacto.

## 10. Diagramas permitidos y prohibidos

Permitidos:

- UML;
- C4;
- DER;
- Gantt;
- tablas y leyendas estrictamente trazables.

Prohibidos:

- ilustraciones decorativas;
- renders;
- imágenes conceptuales sin fuente semántica;
- iconografía que introduzca actores o componentes no canónicos;
- diagramas “mejorados” con objetos no presentes en la fuente.

## 11. Regla de nombres

Todo nombre de actor, área o familia API debe tomarse de:

```text
MESA_02_00_NOMBRES_CANONICOS.md
```

Si el nombre requerido no está allí:

```text
DETENER ESA ETIQUETA
→ volver a la fuente propietaria
→ verificar
→ actualizar el kit solo mediante revisión explícita
```

## 12. Regla de handoff

Cada DV debe seguir:

```text
MESA_02_00_FORMATO_HANDOFF.md
```

Un artefacto sin fuente editable, exports, nota de derivación, manifiesto y misión de contrarrevisión es **handoff incompleto**.

## 13. Autocontrol mínimo de cada figura

Antes de empaquetar:

- [ ] título `Figura DV-0X.n`;
- [ ] pie de derivación;
- [ ] versión de fuente;
- [ ] hash de fuente;
- [ ] nombres solo desde tabla canónica;
- [ ] `<=25` nodos;
- [ ] `<=40` conectores;
- [ ] fuente editable presente;
- [ ] SVG presente;
- [ ] PNG presente;
- [ ] sin afirmaciones runtime;
- [ ] sin objetos inventados;
- [ ] reconciliación visible cuando corresponda.
