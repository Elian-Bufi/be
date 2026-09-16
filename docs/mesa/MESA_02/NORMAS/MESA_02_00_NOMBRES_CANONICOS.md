# MESA-02-00 — Nombres canónicos

> **Proyecto:** BE — Plataforma integrada de inteligencia en salud  
> **Fecha:** 2026-09-10  
> **Uso:** única tabla de nombres autorizada para diagramas MESA-02  
> **Regla:** esta tabla copia nombres; no crea aliases canónicos.

## 1. Fuentes efectivamente verificadas para este archivo

| Materia | Fuente | Estado | SHA-256 |
|---|---|---|---|
| Áreas `M-00…M-12` | `BE_LEG_06_v0.1.1_MAESTRO_MODELO_DE_DOMINIO_PARCHE_TRANSVERSAL_2026-09-07.md` | VERIFIED | `7c1950adafbdd3f3c27a04d225ff2844c4fe170a965104407a92e09ecdd4fea1` |
| Familias API | `BE_LEG_09_v0.16.1_CORRECCION_CONTRACTUAL_A3_2026-09-07.md` | VERIFIED | `fe49c24ade553cbd385a1d8380d40f6c51bbdc1609d3d59ae2187053e1ebb3b4` |
| Actores comunes MESA-02 | `BE_MESA_02_PROYECTO_DE_PROMPTS_2026-09-10.md` | VERIFIED — instrucción de fase | `SHA CALCULADO SOBRE ARCHIVO ADJUNTO EN EL TURNO: ver manifiesto de entrega si se empaqueta` |

## 2. Actores autorizados

Estos son los únicos rótulos comunes de actor autorizados por el kit:

| Actor |
|---|
| Asesorado |
| Profesional |
| Administrador |
| Proveedor BE |
| Sistema BE |
| Servicios externos |

**Nota de uso:** que un rótulo esté disponible en el kit no implica que deba aparecer en todos los diagramas. Cada DV debe verificar contra su fuente propietaria si ese actor participa en la vista concreta.

## 3. Áreas de dominio `M-00…M-12`

Los nombres siguientes se transcriben del Documento 06 vigente verificado.

| ID | Nombre exacto |
|---|---|
| `M-00` | Gobierno semántico y patrones comunes del dominio |
| `M-01` | Identidad, perfil y ciclo de cuenta |
| `M-02` | Perfil profesional, especialidades, capacidad antropométrica transversal, verificación y habilitación |
| `M-03` | Vínculo profesional–asesorado, alcances y referencias estructurales de consentimiento/autorización |
| `M-04` | Ciclo funcional, coexistencia de procesos, continuidad y cierre |
| `M-05` | Capacidad configurada y admisión de procesos nuevos |
| `M-06` | Versionado, snapshots, correcciones e historia común |
| `M-07` | Nutrición |
| `M-08` | Entrenamiento |
| `M-09` | Antropometría transversal y publicación limitada |
| `M-10` | Revisión profesional válida, taxonomía común y pendientes |
| `M-11` | Cartera, timeline y proyecciones longitudinales |
| `M-12` | TVCC-30 — componentes computables e interfaz con Documento 12 |

Reglas:

- no abreviar el nombre dentro de tablas de trazabilidad;
- si un diagrama requiere una etiqueta corta por densidad, el ID `M-xx` debe permanecer visible y la leyenda debe reproducir el nombre exacto;
- una etiqueta corta de presentación **no adquiere condición canónica**.

## 4. Prefijos de familia API del Documento 09

La fase MESA-02 utiliza exactamente estos quince prefijos:

| Prefijo |
|---|
| `ACC` |
| `PRO` |
| `REL` |
| `CON` |
| `NUT` |
| `TRN` |
| `ANT` |
| `DSH` |
| `PRJ` |
| `INT-NUT` |
| `INT-TRN` |
| `CRD` |
| `MTH` |
| `CAL` |
| `FRM` |

Reglas:

- no expandir el prefijo a un nombre de familia inventado si el Documento 09 no se consulta en ese entregable;
- no crear prefijos adicionales;
- no fusionar `INT-NUT` con `NUT`;
- no fusionar `INT-TRN` con `TRN`;
- no tratar P1 explícitas como parte del conteo P0 por conveniencia gráfica.

## 5. Prohibición de sustitución semántica

No usar:

- sinónimos “más claros” en lugar del nombre canónico;
- traducciones libres;
- nombres heredados de versiones antiguas;
- nombres provenientes del código AS-IS si contradicen el TO-BE;
- nombres recordados de conversaciones.

Ante conflicto:

```text
FUENTE PROPIETARIA
> tabla MESA derivada
> conveniencia gráfica
```

## 6. Control falsable

Para revisar este archivo:

1. comparar las 13 filas `M-00…M-12` contra el 06 de hash `7c1950adafbdd3f3c27a04d225ff2844c4fe170a965104407a92e09ecdd4fea1`;
2. verificar exactamente 15 prefijos API contra el 09 de hash `fe49c24ade553cbd385a1d8380d40f6c51bbdc1609d3d59ae2187053e1ebb3b4`;
3. verificar exactamente 6 actores comunes;
4. buscar áreas o prefijos adicionales: resultado esperado `0`;
5. verificar que no exista ninguna expansión inventada de un prefijo API.
