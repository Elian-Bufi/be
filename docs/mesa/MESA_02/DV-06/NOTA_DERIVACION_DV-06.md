# Nota de derivación — DV-06 v5

Producción documental: ChatGPT/Codex, a pedido de Dirección, 13-09-2026. Estado: candidato a reverificación independiente de MESA-02; no es una aprobación del modelo físico.

El Documento 06 v0.1.1 conserva autoridad y bytes originales. Se corrige su derivación académica. Las doce figuras, incluida la figura índice, tienen SVG editable y PNG; la tabla de cobertura conserva sus 79 términos originales. Las cajas nuevas son referencias contextuales a conceptos existentes, no nuevos términos del canon.

La fuente de cada conector está en `DV-06_RELACIONES.csv` y, en lectura extendida, `EVIDENCIA_RELACIONES_v5.md`. Se extrae el apartado completo del 06, con título y contenido, para evitar citas cortadas justo antes de la estructura que deben demostrar. `RUTAS_VERIFICADAS_v5.json` registra los 64 conectores activos y el control geométrico de cajas ajenas.

## Qué cambió

Se mantienen los 62 registros de v4 con identificadores estables por su orden original, R001–R062. R004 se retira de la figura: audiencia de Novedad no prueba titularidad individual ni `titularRef`. R063–R065 agregan Identidad–Perfil profesional, Identidad–Alcance profesional y la alternativa Bloque–Sesión sin Microciclo. Resultado: 65 registros de auditoría, 64 conexiones activas.

Se corrigen los propietarios de especialidad, capacidad antropométrica y capacidad configurada; la verificación se representa por alcance profesional y por ciclos de presentación. Capacidad configurada pertenece a identidad profesional, común a especialidades, y no a una habilitación individual. Planes referencian versiones de objetivo. Atlas pertenece al catálogo global; recurso didáctico refiere al elemento de catálogo. La historia de respuestas/adopciones no queda artificialmente limitada a un registro.

Se distinguen estructura emitida de plan y borrador, ejecución por período/ocurrencia y prescripción, consentimiento efectivo e historia, instantánea y versión. Evolución, autorización y analítica se dibujan como dependencias donde no hay cardinalidad persistente autorizada. Las quince referencias interárea incorporan pasajes y explicación de su sentido; M-11 consume serie antropométrica y no se justifica con una regla ajena de métodos.

## Cómo leer las cardinalidades

| Marca | Significado |
|---|---|
| EXPRESA | El pasaje declara la estructura/multiplicidad; se conserva su contexto. |
| Asterisco / DERIVACION_JUSTIFICADA | La nota distingue la parte expresa y el razonamiento de la inversa, historia o condición. No es una restricción física aprobada. |
| Extremo sin número | La fuente no fija ese extremo; no significa cero, opcionalidad implícita ni muchos. |
| Dependencia discontinua | Uso, referencia o derivación; no propiedad de datos ni autorización de borrado. |
| RETIRADA | Registro conservado para auditoría; no se dibuja ni debe implementarse como si estuviera aprobado. |

Se elevan explícitamente los extremos no fijados en R019, R023, R036, R038, R039 y R065. Se resuelve la representación retirando el número sin respaldo. El ejecutor debe consultar la regla/contrato del área al decidir el esquema; si todavía falta un límite funcional que afecte comportamiento, debe presentar la brecha concreta, sin inventarlo ni reabrir todo el 06. Las dependencias sin números no son restricciones incompletas de una tabla SQL.

`PK` y `FK` son notación de clave/referencia conceptual. Una composición no permite borrado en cascada que destruya historia. Los nombres de atributos son representación MESA, no nombres obligatorios de columnas.

## Correspondencia y límites

La tabla de 79 términos y el vocabulario original se conservan. Las correcciones de referencia a identidad, versión de objetivo y contenedor de sesión deben acompañar la reconciliación DER–clases–repositorio. `AJUSTES_CORRESPONDENCIA_v5.md` explicita esos cambios para impedir que se elija un atributo viejo de una figura como autoridad sobre la evidencia de v5 y el 06.

El antecedente B-11 / H-07-DOM-01 exige reconciliar modelo conceptual con el repositorio. No se afirma que el esquema actual tenga estos atributos, claves o relaciones. Los 45 modelos Prisma citados en documentación histórica no son un conteo actualizado. Ninguna figura acredita migraciones ejecutadas, controles de acceso funcionando o resultados 11B.

## Control realizado

Control del productor: conservación de fuentes, extracción literal, correspondencia ID de conector–CSV y recorrido sin atravesar cajas ajenas. Se inspeccionan las exportaciones para legibilidad. Esta autoverificación no reemplaza el dictamen independiente solicitado para cerrar MESA-02 ni audita todas las decisiones de modelado del legajo.
