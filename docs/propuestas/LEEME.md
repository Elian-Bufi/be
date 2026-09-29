# Propuestas

Documentos de **propuesta** para decisión de Dirección. **No forman parte del legajo** ni son requisitos aprobados. Sus identificadores (PF, DAT, TRN, NUT, ANT, F, CA, DEC, V) son locales y no reemplazan los RF, UC, API ni DL del legajo.

| Documento | Qué es | Estado |
|---|---|---|
| `BE_Plan_Funcional_Profesional_v1-1.md` | Plan de desarrollo funcional y datos profesionales, preparado por Codex a pedido de Dirección, con corte en `46fd1fa`. Se guarda sin cambios, como lo entregó Dirección | Propuesta para revisión |
| `PF-01-02_contexto-de-entrenamiento.md` | Ficha del primer incremento que recomienda el plan (§16.3): los seis conceptos de entrenamiento contrastados con `main`, el delta por capa y las decisiones D-1 a D-5 | Decisiones tomadas (DL-100 a DL-103). Implementada en `main`: #100, #101 y #102 integrados. Falta el recorrido web → respuesta desde la APK → evaluación en el ambiente desplegado |
| `PF-03_profundizacion-de-entrenamiento.md` | Ficha de PF-03 dentro del circuito de fuerza: instrucciones, descanso, tempo, equipamiento, alternativas preaprobadas, registro y revisión. Distingue lo existente, lo aprobado y lo propuesto, con casos de uso, diccionario, preguntas, cambios por capa, criterios, decisiones PF03-D-1 a D-9 y división en PR | PF03-D-1 aprobada, opción A ([DL-105](../DEUDA_LEGAJO.md)): incremento 1 en implementación. Las demás decisiones siguen como propuesta |
| `PF-04_contexto-y-objetivos-nutricionales.md` | Ficha de PF-04: contexto nutricional (preguntas generales separadas de las sensibles), su cita en la evaluación y objetivos que se puedan representar sin valores energéticos ficticios. Incluye las mismas secciones y las decisiones D-1 a D-11 | Propuesta especificada para decisión; no implementada |
| `REV-A_revisiones-del-asesorado.md` | Propuesta: el asesorado lee sus propias revisiones de entrenamiento y nutrición. El 08 le da acceso («sin notas secretas»), pero el contrato, qué campos ve y desde cuándo no están definidos. Trae las decisiones REV-A-D1 a D4 | Propuesta para decisión; no implementada |

Un paquete pasa a implementarse cuando Dirección decide sobre su ficha y emite la orden. En ese momento, las decisiones aprobadas se registran como DL en `docs/DEUDA_LEGAJO.md`.
