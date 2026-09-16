# Fixtures de pruebas — definición documental v5

Estado: DISEÑADOS, NO IMPLEMENTADOS. Los alias identifican objetos sintéticos, no personas. Fechas T0/T1 son reloj de laboratorio, no evidencia de ejecución. Todos los registros deberán estar marcados como demo/test y excluidos de analítica productiva.

## Reglas de construcción

- T0 = 2026-09-01T12:00:00Z; T1 = T0 + 1 hora salvo indicación del caso. El huso y las ventanas de dominio siguen 07/09, no el huso del ordenador del ejecutor.
- DEMO-A01/A02 son asesorados adultos sintéticos; DEMO-PN, DEMO-PT y DEMO-PA son actores de Nutrición, Entrenamiento y Antropometría; DEMO-ADM es administrador. Sus facultades son específicas del caso. No otorgar permisos globales para facilitar un seed.
- Emails bajo example.invalid, sin entregas de correo real. Credenciales solo locales de test, generadas durante preparación del ambiente y nunca incluidas en este paquete.
- REL-N1 y similares son alias de relaciones, no identificadores que se fuerzan en el esquema físico. El futuro seed publicará su mapa alias→ID generado en evidencia no sensible.
- Cada variante restaura una base aislada. No usar una operación denegada que dejó datos parciales como precondición silenciosa de otro caso.
- Valores de masa, talla, cantidades o cargas son datos ficticios para comprobar persistencia, unidades y relaciones. No son prescripciones, recomendaciones de salud ni resultados reales.
- El ejecutor debe mapear campos conceptuales a los DTO exactos de 09 y a la implementación reconciliada. Si falta ese mapeo, el caso permanece BLOCKED al ejecutarse; no se inventan endpoints o campos del producto. En este documento conserva NOT_EXECUTED.

## MET-DEMO: doble técnico explícito

Para verificar el mecanismo de cálculo sin canonizar una fórmula profesional se define un método de laboratorio MET-DEMO. v1 requiere BODY_WEIGHT de origen DIRECT_MEASUREMENT, unidad kg, y devuelve la entrada sin transformación con precisión de una décima. Ejemplo de oráculo técnico: 72.5 kg → 72.5 kg. v2 de laboratorio devuelve entrada + 1 kg (73.5 kg para esa entrada), únicamente para detectar si una reproducción histórica selecciona una versión incorrecta.

Ambas versiones se marcan TEST_ONLY y se excluyen del catálogo de demo de defensa y de producción. No constituyen un método antropométrico/nutricional clínico, un estado de dominio ni una nueva capacidad de BE. TEST_ONLY es una etiqueta del harness, no un token agregado al canon. Antes de ofrecer métodos profesionales reales, el paquete de implementación de catálogos debe materializar la fuente, versión, inputs, admisibilidad, unidad y precisión del método real conforme a 06/09.

## FT-DEMO y evidencia profesional

FIELD_N y FIELD_X son códigos de campos de la plantilla de laboratorio, autorizados/no autorizados respectivamente para el contexto probado. El fixture mantiene ambos en la misma versión seleccionable de plantilla. El request válido elige solo FIELD_N; el inválido envía ambos. Esto prueba que plantilla y autorización no son equivalentes. No implica que el cliente pueda definir plantillas arbitrarias en P0.

Para verificación profesional, EVID-DEMO contiene un soporte sintético marcado «NO VÁLIDO COMO CREDENCIAL», un alcance declarado, identificador de presentación, versión y referencia de evidencia. Los requisitos de admisibilidad reales del alcance se toman de 08/09; una configuración de test puede satisfacerlos sin suplantar una matrícula real. La variante incompleta omite una referencia obligatoria de evidencia, no un campo clínico arbitrario.

## Evidencia a producir cuando exista ejecución autorizada

Por caso y variante: ID de test, commit/build, ambiente, fecha de ejecución real, snapshot de configuración no secreta, mapa de alias, pasos realizados, resultado esperado y observado, assertions HTTP/DB pertinentes, incidencia/retest y artefactos. Una comparación documental o un script de validación de este paquete no es un PASS de producto en 11B.
