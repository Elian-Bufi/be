# BE — MESA-01 · Matriz oficial de cobertura para Mesa de Tesis

**Fecha:** 2026-09-10  
**Fuente de requisitos de entrega:** `Entregables.pdf` — Escuela Da Vinci, Analista de Sistemas, versión 2025.05.  
**Objeto:** inventariar los 14 entregables obligatorios, sus subcriterios y los criterios generales de presentación, cruzándolos con el legajo BE vigente.

## Veredicto ejecutivo

MESA-01 queda **completa como matriz de control**.

- Entregables obligatorios inventariados: **14/14**.
- Subcriterios explícitos del punto 3: **31**.
- Criterios generales/transversales: **6**.
- Entregables que requieren runtime para cerrarse: **4** (`DV-11` a `DV-14`).
- Tramo documental pre-implementación de BE: **cerrado**.
- MESA-01 **no declara** que la entrega de tesis esté completa; declara que ya sabemos exactamente qué existe, qué falta y cómo se cierra.

## Clasificación práctica

### A. Fuente documental cerrada; falta empaquetado/gráfico
`DV-03`, `DV-04`, `DV-05`, `DV-08`, `DV-09`.

### B. Puede producirse ahora, pero requiere datos/ensamblado
`DV-01`, `DV-07`.

### C. Mixto; necesita reconciliación posterior
`DV-02`, `DV-06`, `DV-10`.

- `DV-02`: tecnologías **utilizadas** deben verificarse contra el repo/runtime real; mercado y competencia deben actualizarse.
- `DV-06`: el DER lógico puede salir de 06, pero el DER final debe contrastarse contra Prisma/migraciones.
- `DV-10`: el Gantt puede construirse ahora, pero debe actualizarse con avance real.

### D. Solo puede cerrarse con runtime
`DV-11`, `DV-12`, `DV-13`, `DV-14`.

## Próximo movimiento

La fase recomendada es **MESA-02A**, sin tocar implementación:

1. portada académica;
2. requisitos por Website/APK;
3. diagramas de casos de uso;
4. casos de prueba en formato de mesa;
5. diagrama de clases;
6. arquitectura;
7. componentes.

En paralelo puede iniciarse **MESA-02B**:
- acta consolidada;
- investigación de mercado/competencia;
- Gantt 2026.

Después, el intake técnico resolverá lo que depende del repo real antes de firmar el gate de implementación.

## Regla de gobierno

La capa MESA **deriva** del legajo 00–12; no lo reescribe.  
Si el formato académico requiere condensar o dibujar algo, se transforma la presentación, **no la semántica canónica**.
