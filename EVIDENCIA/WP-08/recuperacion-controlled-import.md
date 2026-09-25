# Hallazgo · volver a un código anterior a WP-08 después de importar no tiene recuperación validada

**Qué se probó, y qué NO se probó.** Este documento es evidencia histórica de una limitación, no un runbook. No contiene SQL para ejecutar.

## El hallazgo

La migración `20260924100000` agrega el valor de enum `CONTROLLED_IMPORT` a `ProcedenciaDeCatalogo`, que es **columna enum nativa** en `elemento_de_catalogo_nutricional` y `ejercicio_de_catalogo`. Una vez que un profesional importa, esas filas quedan con `procedencia = 'CONTROLLED_IMPORT'`.

El código anterior a WP-08 (API 0.9.1 y antes) no conoce ese valor. Al leer el catálogo, la fila importada llega a la respuesta con `CONTROLLED_IMPORT` y el contrato/cliente lo rechaza. Además, **PostgreSQL no permite quitar un valor de enum** (verificado en un PostgreSQL aislado con pglite: `dropping an enum value is not implemented`), así que la migración no se puede revertir tal cual.

**Conclusión:** volver el código de la API a una revisión anterior a WP-08, después de que exista al menos una importación, **no tiene una recuperación validada que preserve la procedencia visible**. Agregar estructura de forma aditiva (expand→contract) es condición necesaria pero **no suficiente**: el dato lleva un valor de enum nuevo que el código viejo no sabe presentar.

## Por qué el remapeo NO es una recuperación recomendada

Se evaluó remapear `CONTROLLED_IMPORT → PROFESSIONAL_MANUAL` en las dos tablas de catálogo antes de arrancar el código viejo. Ese remapeo conserva las **filas** (nada se borra; el candidato y la resolución quedan intactos) y es reversible en el sentido de que la relación `resolucion_de_candidato` sigue diciendo qué elemento fue importado.

**Pero conservar las filas no es una recuperación funcionalmente correcta.** El remapeo cambia la procedencia que el código anterior **presenta**: un elemento importado se mostraría como «cargado manualmente por el profesional», que es falso. La procedencia visible —justamente lo que RF-060 exige— queda incorrecta mientras corra el código viejo. Que el remapeo sea reversible no demuestra que el estado intermedio sea correcto. Por eso **no se recomienda** y **no se deja SQL ejecutable** para hacerlo.

## Respuesta operativa preferida

Ante un problema en producción con WP-08 ya publicado, la respuesta preferida **no es volver a 0.9.1**, sino una **corrección hacia adelante sobre 0.10.0** que conserve su contrato (incluida la procedencia `CONTROLLED_IMPORT` y `externalSource`) y los datos originales de las importaciones. El rollback de aplicación a una revisión anterior a WP-08 se considera **sin recuperación validada** en presencia de datos importados, y no debe usarse como plan de contingencia para este paquete.

## Registro de lo verificado

- En un PostgreSQL aislado (pglite): el enum no admite `DROP VALUE`; el código viejo devuelve `CONTROLLED_IMPORT` a su lector; el remapeo preserva filas. **No** se verificó —ni es cierto— que el estado remapeado preserve la procedencia visible correcta.
- No se ejecutó ningún cambio de datos contra `test`. Las importaciones reales de la publicación (Nutella, «Estabilización abdominal») siguen con su procedencia `CONTROLLED_IMPORT` intacta.
