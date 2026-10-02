# DV-01 · Nota de actualización para reemitir la presentación (2026-10-02)

> **Para Dirección.** `DV-01_PRESENTACION.md` está en `docs/MANIFEST.sha256` y no se edita desde el repositorio. Esta
> nota propone el texto que hay que cambiar para reemitirlo. **Es una propuesta del ejecutor:** decide Dirección, y los
> datos personales los completa ella.

## 1. Lo que falta completar (solo Dirección)

| Campo | Hoy dice | Qué va |
|---|---|---|
| Autor | `[NOMBRE Y APELLIDO — TO VERIFY]` | El nombre y apellido de quien entrega |
| Correo | `[correo@davinci.edu.ar — TO VERIFY]` | El correo institucional que pide la escuela (`Entregables.pdf`, punto 1). **El repositorio es público:** decidí si va en la versión publicada o solo en la que se entrega |
| Entrega | `[MES AÑO — TO VERIFY]` | Octubre de 2026, porque la entrega es el 2026-10-10 |

## 2. «El estado»: el texto actual quedó viejo

**Hoy dice:** «La especificación está completa y baselineada. La implementación no está iniciada: no hay código
verificado, ni despliegue, ni prueba ejecutada.»

**Eso era cierto el 2026-09-10.** Desde el 2026-09-16 hay implementación, y el texto propuesto lo cuenta.

**Propuesta:**

> **El estado.** La especificación está completa y baselineada, y la implementación la sigue. Están desplegados en el
> ambiente `test`:
> - el website del profesional;
> - la API;
> - la APK del asesorado, la 0.13.1.
>
> Implementan la identidad y el consentimiento, el vínculo, los circuitos de nutrición, entrenamiento y antropometría,
> la información pertinente y las integraciones con Open Food Facts y wger.
>
> Cada cambio se integró con CI: pruebas de integración contra PostgreSQL, del dominio y de contraste. Lo que el legajo
> pide y no se construyó está declarado, con su motivo, en `docs/DEUDA_LEGAJO.md` y en `docs/QUE-FALTA.md`. Ejemplos:
> el alta y la verificación de profesionales con administrador, y el seguimiento interdisciplinario completo.
>
> Todos los datos son sintéticos.

## 3. El índice de los catorce puntos, al 2026-10-02

| # | Entregable | Estado propuesto | Dónde está |
|---|---|---|---|
| 1 | Presentación | disponible; **a reemitir con esta nota** | este documento + `DV-01_PORTADA` |
| 2 | Acta del proyecto | disponible; **tres frases a actualizar**, entre ellas la de §8.2: «sin despliegue ni APK operativa» | `DV-02_ACTA.md` · `DV-02/RECONCILIACION_TECNOLOGIAS_2026-10.md` |
| 3 | Requisitos funcionales Website y APK | disponible | `DV-03_RF_POR_CANAL` |
| 4 | Casos de uso: diagrama y documentación | disponible | `DV-04` |
| 5 | Casos de prueba | disponible, **con su ejecución**: 35 de 59 casos cubiertos del todo, 15 en parte y 9 no ejecutables con lo que se entrega | `DV-05` · `DV-05/MATRIZ_DE_RECONCILIACION_DV-05_2026-10.md` |
| 6 | Diagrama entidad–relación | disponible, **reconciliado con la base**: 26 de 75 entidades coinciden, 35 difieren y 14 faltan, todas con su fuente | `DV-06` · `DV-06/RECONCILIACION_DER_IMPLEMENTACION_2026-10.md` |
| 7 | Diagrama de clases | disponible; la figura C0 tiene una observación de la v5 abierta | `DV-07` · `REVISION_DEL_EJECUTOR_V5_2026-10-02.md` |
| 8 | Diagrama de arquitectura | disponible | `DV-08` |
| 9 | Diagrama de componentes | disponible; a la matriz le falta «Analítica TVCC-30» (observación de la v5) | `DV-09` |
| 10 | Diagrama de Gantt | **disponible**; se regenera con el corte final | `DV-10` |
| 11 | URL de demo (APK y Website) | **disponible**: website desplegado, APK 0.13.1 y guía de demo de unos 25 minutos | `EVIDENCIA/ENTREGA/GUIA-DEMO.md` |
| 12 | URL de descarga de APK + repositorio | **disponible**, verificada en vivo el 2026-10-02 | `docs/mesa/MESA_01/ESTADO_PUNTOS_11_14_2026-10-02.md` |
| 13 | URL de Website + repositorio | **disponible**, verificada en vivo el 2026-10-02 | la misma nota |
| 14 | Usuarios con distintos roles | **disponible**: asesorado, en la APK, y profesional con tres perfiles (Nutrición, Entrenamiento y la capacidad antropométrica), en el website. La escuela pide «diferentes roles»; no pide un administrador | la misma nota |

## 4. Los rótulos de las figuras

Los rótulos «A RECONCILIAR CON REPOSITORIO» (DV-06, DV-07) y «DESPLIEGUE NO VERIFICADO» o «CÓDIGO NO VERIFICADO» (DV-08, DV-09) eran ciertos el 2026-09-10. Hoy:
- **DV-06 tiene su reconciliación.** Conviene que el rótulo la cite, o que el DER se reemita.
- **DV-08 y DV-09:** el despliegue existe y se verificó (`docs/DESPLIEGUE.md`). El rótulo se puede cambiar por la referencia a esa verificación.

Decide Dirección si se reemiten las figuras o si estas notas van como anexo.
