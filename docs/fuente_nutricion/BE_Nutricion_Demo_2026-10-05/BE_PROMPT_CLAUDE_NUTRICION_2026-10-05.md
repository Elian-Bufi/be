# BE · Implementación de Nutrición con recetas, fotos y macros verificables

Fecha del encargo: 5 de octubre de 2026. Dirección: Elian Bufi. Entrega prevista: 20 de octubre de 2026.

## Encargo y resultado esperado

Implementá el flujo de Nutrición aprobado en las cuatro imágenes de referencias de este paquete. Debe funcionar de punta a punta: un profesional crea o edita una receta en la web, carga su foto, incorpora alimentos y cantidades con fuente nutricional identificada, guarda la receta y la ofrece como opción de un plan. El asesorado ve esa opción en el carrusel de la app, consulta el detalle y registra lo que comió. Debe funcionar también el registro de una comida diferente mediante descripción, foto o ambas.

Las fotos de comidas incluidas son archivos originales generados por IA para esta demostración. Usalas como contenido que el profesional carga mediante el flujo real. La demostración debe acreditar persistencia, permisos y cálculo; la presencia de imágenes fijas en una maqueta no acredita la funcionalidad de carga.

Trabajá de manera autónoma hasta dejar implementación, pruebas, evidencia y documentación revisables. La dirección visual ya está elegida; no pidas otra aprobación de la misma maqueta. Resolvé las decisiones reversibles de implementación con criterio y documentalas. Informá únicamente bloqueos reales de acceso, servicios, coste o incompatibilidades no resolubles dentro del alcance.

## Insumos y precedencia

1. Las cuatro imágenes en referencias/ son las capturas que Elian adjuntó al aprobar esta configuración: carrusel, detalle, confirmación del registro y comida diferente.
2. fotos/ contiene tres PNG originales, sin textos: pollo, salmón y lentejas. Cada archivo tiene una receta asociada en datos/recetas_demo.json y una ficha en RECETAS_Y_CALCULOS.md.
3. datos/alimentos_usda_100g.json contiene ocho alimentos seleccionados, su estado de preparación, identificadores FDC/NDB y nutrientes por 100 g. datos/usda_fuentes_completas.json conserva sus registros de origen.
4. datos/casos_calculo.json contiene resultados esperados; verificar_calculos.py comprueba la aritmética del paquete sin red y sin depender de la aplicación.
5. Este texto define comportamiento y precisión. Los números de las capturas (por ejemplo 530 kcal, 56 g, 14 g, 45 g) eran ficticios: no son objetivos de cálculo ni constantes a introducir en la app. Aplicá los valores del paquete para sus alimentos y método específicos.

Las capturas mezclan pequeñas variantes de iconos y textos de la exploración. Conservá los cinco destinos reales de BE, el logo actual y los componentes de navegación existentes. Aplicá la aclaración de UX acordada: botón «Comí esta opción», cantidades consumidas opcionales y explícitas, y explicación de que los macros previos corresponden a las porciones del plan.

## 1. Relevamiento acotado y delta

Leé las instrucciones del repositorio y los contratos vigentes de Nutrición, catálogo, medios, permisos, unidades y versionado. Confirmá el estado actual de la rama y preservá cambios ajenos. No uses los hashes de conversaciones anteriores como si fueran el estado remoto actual.

Identificá qué ya existe y el mínimo delta requerido para recetas, preparación, imagen de referencia, imagen de un registro real y cálculo por opción. En la revisión anterior las fotos de registros no estaban habilitadas y los contratos eran estrictos: verificar el estado presente y no asumir que agregar un campo de respuesta es compatible con APK anteriores.

Registrá el delta, incluyendo rutas nuevas o versionadas, migración aditiva si corresponde, compatibilidad de clientes, representación del origen de datos y del método de cálculo. Reutilizá servicios, unidades y permisos existentes. No alteres retroactivamente planes o registros para hacerlos coincidir con la nueva UI. Resolver la implementación del alcance autorizado no requiere iniciar nuevas mesas de diseño por cuestiones ya definidas aquí.

## 2. Flujo profesional: receta e imagen reales

- El profesional autorizado puede crear, editar y revisar una receta: nombre, ingredientes de catálogo, cantidades, unidades, número de porciones, preparación opcional e imagen de referencia opcional.
- Los ingredientes se seleccionan por identidad y versión. No se resuelven mediante coincidencias aproximadas de nombres.
- Diferenciar alimento crudo de cocido, peso comestible de peso con descarte y gramos de mililitros. Para estas tres recetas todas las cantidades son gramos del estado indicado. No inferir densidades ni pesos unitarios.
- Mostrar energía y macros estimados a partir de ingredientes, por receta y por porción. Mostrar qué falta cuando no se puede completar un cálculo.
- Foto: seleccionar archivo, vista previa, cargar, guardar asociación con receta y recuperar la imagen tras recargar sesión o reiniciar el servicio. Permitir reemplazarla o retirarla sin afectar ingredientes ni historia de consumo.
- La foto de referencia no mide el tamaño de una porción ni demuestra consumo. Mantener el texto «Imagen de referencia». Conservar metadatos de autoría/procedencia cuando el modelo lo soporte; declarar que estas tres son generadas por IA.
- Probar el flujo desde una cuenta profesional de prueba, con las tres imágenes y recetas. El resultado debe poder asignarse a un plan de demostración como tres opciones de almuerzo. No afirmar que las tres son equivalentes nutricionales.

## 3. Móvil: Hoy y carrusel

- Mantener la identidad azul noche y cian, logo actual, cinco destinos y temas soportados por la aplicación.
- Hoy, Plan y Registros conservan su función. Fecha civil correcta para el usuario. Las categorías de comidas provienen del plan; desayuno/almuerzo/merienda/cena son ejemplos, no una lista fija obligatoria.
- Al elegir Almuerzo se muestra un carrusel manual de opciones, con una pequeña porción de la siguiente tarjeta visible. Contador y flechas accesibles; sin avance automático. Una sola opción no necesita controles de desplazamiento.
- Cada tarjeta muestra foto o icono de respaldo, nombre y franja con Calorías, Carbohidratos, Grasas y Proteínas. Etiqueta «Estimación para las porciones del plan». En ancho reducido o texto grande la franja puede pasar a dos por dos sin recortar.
- «Ver detalle» abre la misma opción; «Comí esta opción» permite registrar desde el carrusel. Deslizar no registra ni cambia el plan.
- «Comí algo diferente» queda debajo del carrusel y conserva el contexto de fecha y momento de comida.
- Volver del detalle recupera opción, fecha y posición. Un fallo de la imagen muestra un respaldo sin ocultar el contenido ni bloquear el registro.

## 4. Detalle y registro sin datos inventados

El detalle muestra foto, nombre, macros previstos, ingredientes con cantidades y estados de preparación, e instrucciones cuando existan. Las cantidades del plan son lectura; no parecen campos ya completados por el usuario.

Separar claramente «Porciones del plan» y «¿Cuánto comiste?». La persona puede:

- Registrar solamente que comió esta opción, dejando cantidades consumidas sin confirmar.
- Confirmar expresamente «Comí las porciones del plan» (control inicialmente desmarcado).
- Introducir cantidades realmente consumidas. Vacío no significa cero. Si el contrato no admite cero como cantidad, retirar el ingrediente mediante la operación correspondiente; no ocultar el caso.

El mismo comando de registro se invoca desde el carrusel y el detalle, con contexto estable e idempotencia ante doble toque/reintento. Almacenar la identidad/versiones de opción y datos usados para conservar la historia. Si una receta cambia después, el registro anterior conserva su significado.

Éxito confirmado: «Almuerzo registrado», opción elegida, «Cantidades sin confirmar» cuando corresponda, y acceso a completar o corregir. Nunca transformar cantidades previstas en consumidas por defecto ni sumar macros previstos como consumo real.

Usar las operaciones autorizadas de rectificación/anulación del dominio. «Deshacer registro» debe tener un efecto real y auditable; si el contrato exige rectificación, implementá el comportamiento con esa semántica y explicalo en la evidencia, sin borrado irreversible silencioso.

## 5. Comida diferente y fotos privadas

- Permitir descripción, foto o ambas; exigir al menos un contenido válido. Cantidad aproximada opcional, sin convertir texto libre automáticamente en cantidades de catálogo.
- Captura/galería con permisos solicitados al usarlas; cancelación no elimina el borrador. Admitir retirar o sustituir la imagen antes de guardar.
- No inferir ingredientes, calorías o macros desde una foto o descripción libre. Mostrar «Macros sin calcular» cuando falten datos; no mostrar cero ni un porcentaje ficticio.
- Conservar el texto si la carga de la foto falla. Distinguir subiendo, guardando, error recuperable y guardado confirmado. No anunciar éxito si todavía falta la persistencia que la operación promete.
- Las fotos de consumo pertenecen al usuario y requieren permisos de lectura acordes con los vínculos y finalidades del producto. No reutilizarlas como imágenes públicas de recetas.

## 6. Almacenamiento, permisos y continuidad

Reutilizá almacenamiento persistente existente. Si no existe, implementá una interfaz de almacenamiento con pruebas y una opción de configuración concreta; informá qué servicio/configuración falta para la prueba remota. No contrates servicios ni simules persistencia remota con una carpeta efímera del despliegue.

Validar archivos en servidor y cliente con límites documentados de bytes/dimensiones, tipos admitidos y decodificación. Separar identidad del recurso y acceso autorizado de la URL temporal. No exponer claves o credenciales en la APK, archivos del repositorio o evidencia. Eliminar metadatos de ubicación innecesarios de las fotos aportadas por personas.

Probar que un usuario no autorizado no puede cargar sobre otra receta ni leer una foto privada ajena. Mantener compatible la APK anterior mediante contratos adecuados; no flexibilizar validaciones estrictas globalmente para esquivar una incompatibilidad.

Para red lenta/interrumpida: conservar borrador, permitir reintento y no duplicar registros. No introducir cierre de sesión como solución a errores de subida o consulta. Distinguir pruebas locales, contra entorno de prueba y pruebas en Android.

## 7. Cálculo reproducible

La especificación exacta de este conjunto está en RECETAS_Y_CALCULOS.md y sus JSON. Fuente: USDA FoodData Central, SR Legacy. Para cada nutriente, sumar gramos/100 multiplicados por el dato por 100 g. Las kcal de este conjunto se suman desde la energía de la fuente; no se sustituyen automáticamente por 4/4/9. Mantener precisión interna y redondear al presentar.

Si el método canónico vigente de BE difiere, documentá la diferencia y versioná la nueva interpretación antes de usarla. No cambies globalmente resultados antiguos ni modifiques los resultados esperados para que una prueba pase. Estos resultados verifican esta fuente, estos alimentos y este método, no cualquier alimento homónimo.

Datos ausentes son desconocidos, no cero. No confundir porcentajes de distribución energética con gramos. Recalcular al cambiar ingredientes, cantidades, porciones o versión nutricional. La API debe ser una fuente confiable del resultado, no aceptar un total arbitrario enviado por el cliente sin validación.

## 8. Pruebas y evidencia de aceptación

La entrega deberá demostrar, con datos sintéticos:

1. Crear/editar receta desde la web profesional, subir cada PNG, guardar, recargar y ver la misma foto en el móvil autorizado.
2. Tres opciones, una opción, opción sin imagen y fallo de descarga. Cambio por gesto y por flecha; abrir detalle y volver a la misma tarjeta.
3. Resultados base de las tres recetas y todos los casos numéricos de datos/casos_calculo.json. Mostrar el recálculo al cambiar arroz de 160 a 200 g y al retirar 8 g de aceite del pollo.
4. Registro rápido sin cantidades, confirmación de cantidades previstas y cantidades modificadas. Mismo resultado funcional desde carrusel y detalle; sin duplicación por doble toque o respuesta tardía.
5. Comida diferente con solo texto, solo foto, ambas, formulario vacío, cancelación de cámara, archivo inválido y fallo de subida después de escribir.
6. Cantidades desconocidas y nutrientes incompletos permanecen identificados. Una foto no agrega macros. Una receta modificada no reescribe consumos anteriores.
7. Permisos de receta y de foto privada con cuentas distintas. Persistencia tras reiniciar el servicio donde se vaya a demostrar.
8. Compatibilidad de clientes anteriores y regresión de navegación, sesión y fecha civil.
9. Visual en anchos 360, 390 y 412 dp, tema claro/azul noche y letra ×1, ×1,3, ×2. En Android validar gestos, teclado, cámara/galería, barra inferior y último contenido alcanzable. Si no hay dispositivo, dejar esas pruebas pendientes de forma explícita.

Ejecutar primero verificar_calculos.py para comprobar el conjunto entregado. Ese script no prueba BE. Las pruebas de BE deben atravesar sus servicios y UI, con verificación de resultados persistidos. No sustituir pruebas funcionales por capturas estáticas.

## 9. Entrega y autonomía

Implementar en una rama aislada basada en el estado de trabajo adecuado, sin sobrescribir trabajo ajeno. Mantener PR revisable/en borrador con commits claros y CI. Dejar evidencia con cuentas sintéticas, sin credenciales ni fotos privadas. Registrar qué se implementó, qué se probó realmente, límites y pasos exactos para reproducir.

Este encargo autoriza el desarrollo y sus pruebas reversibles. La publicación de una APK, el merge, el despliegue y cualquier gasto externo siguen fuera de esta entrega de diseño/desarrollo y se gestionan con el procedimiento del proyecto. No tocar infraestructura ni versiones ajenas para hacer una demo aparentar éxito.

La evidencia final debe permitir ver el recorrido completo profesional → receta/foto → plan → carrusel/detalle → registro → consulta del resultado, y distinguir claramente los pasos aún no comprobados. No detenerse tras generar una pantalla ni presentar una lista de tareas como si fuera la implementación terminada.
