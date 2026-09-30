# Propuestas

Documentos de **propuesta** para decisión de Dirección. **No forman parte del legajo** ni son requisitos aprobados. Sus identificadores (PF, DAT, TRN, NUT, ANT, F, CA, DEC, V) son locales y no reemplazan los RF, UC, API ni DL del legajo.

| Documento | Qué es | Estado |
|---|---|---|
| `BE_Plan_Funcional_Profesional_v1-1.md` | Plan de desarrollo funcional y datos profesionales, preparado por Codex a pedido de Dirección, con corte en `46fd1fa`. Se guarda sin cambios, como lo entregó Dirección | Propuesta para revisión |
| `PF-01-02_contexto-de-entrenamiento.md` | Ficha del primer incremento que recomienda el plan (§16.3): los seis conceptos de entrenamiento contrastados con `main`, el delta por capa y las decisiones D-1 a D-5 | Decisiones tomadas (DL-100 a DL-103). Implementada en `main`: #100, #101 y #102 integrados. Falta el recorrido web → respuesta desde la APK → evaluación en el ambiente desplegado |
| `PF-03_profundizacion-de-entrenamiento.md` | Ficha de PF-03 dentro del circuito de fuerza: instrucciones, descanso, tempo, equipamiento, alternativas preaprobadas, registro y revisión. Distingue lo existente, lo aprobado y lo propuesto, con casos de uso, diccionario, preguntas, cambios por capa, criterios, decisiones PF03-D-1 a D-9 y división en PR | PF03-D-1 aprobada, opción A ([DL-105](../DEUDA_LEGAJO.md)): incremento 1 en implementación. Las demás decisiones siguen como propuesta |
| `PF-04_contexto-y-objetivos-nutricionales.md` | Ficha de PF-04: contexto nutricional (preguntas generales separadas de las sensibles), su cita en la evaluación y objetivos que se puedan representar sin valores energéticos ficticios. Incluye las mismas secciones y las decisiones D-1 a D-11 | Propuesta especificada para decisión; no implementada |
| `CRITICA-DE-NEGOCIO_2026-09-30.md` | Crítica de negocio por tipo de profesional sobre `main` en `53cc70e`: qué existe, dónde pierde tiempo, qué frena la escala y qué mejoras rinden primero (plantillas del profesional, vista de cartera, listas propias del catálogo, formularios propios, protocolos propios). | Propuesta, sin decidir |
| `PLANTILLAS-DEL-PROFESIONAL_ficha.md` | Ficha de plantillas del profesional para planes de entrenamiento y de comidas: guardar una versión como molde, empezar desde un molde, «mis plantillas» versionadas; delta por capa, permisos, criterios y decisiones D-1 a D-7. Sin APK. | Propuesta, sin decidir |
| `PF-07_vista-de-cartera.md` | Ficha de PF-07: «Pendientes» de toda la cartera (revisión vencida o próxima, plan en borrador, sin plan activo, formulario sin responder, evaluación en preparación) con la última actividad como dato, sin puntajes; lectura agregada nueva sobre datos existentes, sin APK; decisiones D-1 a D-6. | Propuesta, sin decidir |

Un paquete pasa a implementarse cuando Dirección decide sobre su ficha y emite la orden. En ese momento, las decisiones aprobadas se registran como DL en `docs/DEUDA_LEGAJO.md`.
