# Insumos para la exploración visual de Entrenamiento y Nutrición, e infraestructura (2026-10-05)

> Pedido de Dirección en el documento «BE — Cierre de antropometría y siguiente tramo de producto», versión 2, §7.
> Son insumos breves para que Codex prepare los prompts y Dirección genere las maquetas. **No son una orden de
> implementación**: Entrenamiento y Nutrición esperan la dirección visual elegida. Cada afirmación cita su fuente en el
> repositorio; lo que no se pudo confirmar leyendo el repositorio se dice como tal.

## Entrenamiento: qué puede alimentar una maqueta

**Recursos didácticos de tipo IMAGE**
- El contrato tiene `RecursoDidacticoSchema` (`packages/domain/src/contratos-entrenamiento.ts:380-386`), con estos campos:
  - `resourceId` y `resourceVersionId`;
  - `type`, que solo admite `'IMAGE'`;
  - `authorship.name`;
  - `license.id` y `license.label`.
- No hay URL ni localizador del archivo.
- Viaja solo en el catálogo de ejercicios. No va en la prescripción de «Hoy», del plan ni del historial.
- La API lo manda vacío y rechaza uno nuevo (`apps/api/src/entrenamiento/catalogo.service.ts`). La APK no lo muestra: muestra el nombre y el texto del ejercicio.

**De punta a punta solo existe el campo.**
- Faltan el almacenamiento, la resolución del recurso, los permisos y la alternativa cuando no hay imagen.
- Mostrar imágenes exigiría:
  - un localizador en el contrato;
  - dónde guardarlas;
  - abrir la CSP del website;
  - una APK nueva.
- Como el recurso es opcional (0..N), el texto actual es una alternativa válida para la maqueta.

**Datos de ejemplo**
- Hay 12 ejercicios sintéticos rotulados «de demostración», en la migración del circuito de entrenamiento.
- El plan de DEMO-A01 vive en la base de test: press de banca 3×8, sentadilla 2×6-8 y dominadas 2×5 (`EVIDENCIA/WP-06/GUIA-DEMO.md`).
- No hay imágenes de ejercicios en el repositorio.

**Límites para la maqueta**
- **DL-081** (`docs/DEUDA_LEGAJO.md`, abierta). De las 17 zonas musculares, el repositorio nombra solo antebrazo y deltoides. Cualquier otro nombre en una maqueta sería inventado. Se marca zona principal o secundaria, sin porcentajes.
- **DL-099** (abierta). La procedencia de un ejercicio se ve al elegirlo, no en el ítem del plan. Mostrarla en el plan exige un campo nuevo y una APK nueva.
- **Circuitos.** Están fuera del alcance declarado (`docs/QUE-FALTA.md`): el modelo no agrupa ejercicios.

## Nutrición: capacidades actuales frente a PF-04 y PF-05

**Lo que hay hoy**
- Día tipo, comidas, opciones e ítems con cantidad (g, ml o unidad) y preparación.
- Se registra una comida del plan (opción, cantidades opcionales y observación) o una comida libre.
- Estados: «con datos» o «sin datos», y por comida «registrada» o «sin datos». No existe «no consumido».
- No hay fotos: el contrato rechaza `visualEvidenceUploadIds` (`packages/domain/src/contratos-nutricion.ts:317`).
- «Mis habituales» (DL-109) es del profesional, en el website.

**Objetivos con números obligatorios.** `estimatedEnergyRequirement` y `macronutrientDistribution` son obligatorios en el contrato vigente (`contratos-nutricion.ts:100-101` y `:120-121`). Hoy, un objetivo conductual obligaría a inventar números.

**Lo propuesto, sin implementar**
- PF-04 (`docs/propuestas/PF-04_contexto-y-objetivos-nutricionales.md`): objetivo cuantitativo, conductual o combinado, con metas en texto.
- PF-05, en el plan funcional: plan práctico, sustituciones y revisión, con medidas domésticas.

**Solo presentación, sin contrato nuevo**
- Rediseñar «Tu plan de hoy» y «Plan actual» con lo que ya llega.
- Hallazgo de severidad baja: la APK escribe los macronutrientes siempre en «g», aunque el contrato admite también la proporción de la energía.

**Exigen contrato o migración**
- Objetivos por tipo.
- Medidas caseras con equivalencias definidas.
- El estado «no consumido».
- Fotos, que suman almacenamiento, permisos y retención.

Cualquier campo nuevo en una respuesta rompe las APK instaladas, porque validan con esquemas estrictos.

## Infraestructura: vencimiento de `be-db-test` y continuidad para la entrega

**Tres estimaciones del vencimiento.** Después de cualquiera de ellas vienen 14 días de gracia.

| Fecha | Fuente |
|---|---|
| ~2026-10-16 | `DECISIONES_TECNICAS.md:55` |
| ≈2026-10-17 | `DEFENSA/WP-01.md` |
| ~2026-10-18 | `docs/DESPLIEGUE.md:120` |

- **La fecha prudente es el 16/10.** La del 18/10 supone que la base se creó con el Blueprint del 18/9, pero el WP-01 empezó el 16/9.
- **La fecha real no está en el repositorio.**
- **Fecha de entrega: 2026-10-20**, por instrucción de Dirección del 2026-10-05 (antes, 2026-10-10). La base vence antes de la entrega.

**Qué exige el dashboard de Render**
- Ver la fecha real y el plan.
- Cambiar de plan.
- Gestionar backups.
- Obtener la cadena de conexión.

La base no tiene acceso externo (`ipAllowList: []`). Sin el dashboard solo se puede preparar un guion que rehaga el escenario por la API y actualizar las guías.

**Opciones, sin contratar ni recrear nada.** Cada una requiere una decisión de Dirección:
1. **Subir de plan.** Conserva todo. Hay que decidir el costo y la cuenta.
2. **Exportar y restaurar.** Conserva los identificadores. Exige abrir el acceso externo con un PR, que es una excepción de seguridad. Si la base nueva también es gratuita, vuelve a vencer.
3. **Recrear la base y volver a cargar los datos sintéticos** (`docs/DESPLIEGUE.md`).
   - Implica cuentas nuevas, rehacer vínculos, planes, registros y tomas, y un PR de `BE_DEMO_PROFESIONALES`.
   - Cambian las etiquetas del escenario demo y las capturas quedan desactualizadas.
   - Hay que elegir el momento.
4. **Base externa.** Exige cambiar `fromDatabase` en `render.yaml`, un secreto, un PR y una DL o un acta. Se aparta de Render-first.

Ninguna opción exige una APK nueva: la APK apunta a la API, no a la base.
