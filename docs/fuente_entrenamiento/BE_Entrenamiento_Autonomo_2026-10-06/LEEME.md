# BE · Paquete autónomo de Entrenamiento

Preparado el 06/10/2026 para Elian Bufi. Entrega prevista del proyecto: 20/10/2026.

## Cómo dárselo a Claude Code

Adjuntá el ZIP y el archivo `BE_PROMPT_CLAUDE_ENTRENAMIENTO_2026-10-06.md` de fuera del ZIP (es la misma copia que contiene el paquete). Podés acompañarlo con:

> Continuá desde el estado actual del repositorio con el encargo adjunto. Leé primero LEEME.md y BE_PROMPT_CLAUDE_ENTRENAMIENTO_2026-10-06.md. Implementá el alcance completo de forma autónoma, cerrando antes los pendientes necesarios de Nutrición. No vuelvas a pedir aprobación del diseño elegido. Dejá commits, PR en borrador, pruebas y evidencia reales; continuá con lo independiente ante un bloqueo. No hagas merge, despliegue, publicación de APK ni gastos.

El prompt largo contiene las reglas; este mensaje corto no las reemplaza. El paquete no envía mensajes ni inicia trabajo por sí mismo.

## Contenido

- **Prompt principal:** encargo completo de desarrollo y autonomía.
- **DECISIONES_Y_TIEMPOS.md:** qué significa cada tiempo y qué no puede inferirse.
- **REFERENCIAS_VISUALES.md:** nombres de las imágenes, qué usar y qué no copiar.
- **ESTADO_REVISADO.md:** PR y contratos consultados; no equivale a ejecutar BE.
- **referencias/**: registrar serie/descanso actualizados; carga/reintento; Hoy/Plan como estilo.
- **ejercicios/**: tres PNG originales generados por IA con transparencia, sin textos; catálogo de procedencia e identidad de fixture.
- **datos/**: sesión de tres ejercicios/nueve series, 20 casos de series y 16 de tiempos.
- **ACEPTACION.csv:** 31 criterios funcionales, todos inicialmente pendientes de probar en BE.
- **verificar_paquete.py:** verificación sin red de integridad y expectativas numéricas; requiere Python 3.9 o posterior, sin librerías extra.
- **fuentes/PROMPTS_IMAGENES.json:** especificaciones de generación de los recursos y de la maqueta, realizadas con la herramienta integrada de imágenes.
- **MANIFEST.sha256 / VERIFICACION_PAQUETE.txt:** integridad y resultado de la verificación del paquete.

Para comprobarlo, descomprimí y ejecutá desde la carpeta: `python verificar_paquete.py` (o `python3 verificar_paquete.py`). Si modificás los archivos, el manifiesto original dejará de coincidir; conservá una copia original y no cambies los resultados esperados para hacer pasar BE.

## Cambios que ya quedaron decididos

Vista compacta del ejercicio actual, imagen más clara, objetivos distintos por serie en gris sin rellenar los realizados, RIR opcional y explicado, comparación con el plan, descanso manual sin +15 s, cronómetro de sesión y tiempos con origen explícito. Sin medición de inicio/fin, el tiempo de una serie es desconocido.

Nutrición continúa con PostgreSQL para la demo y claridad sobre comida diferente, manteniendo los controles de acceso/auditoría. El arreglo de seguridad se prepara de manera mínima; main no se modifica directamente. El prompt detalla los límites de lo que puede cerrarse de forma autónoma.

## Límites de estas imágenes y datos

Las maquetas no son capturas de BE funcionando ni pruebas Android. El logo aproximado de las exploraciones no se incorpora: se utiliza el real del repositorio. Las figuras IA permiten reconocer ejercicios y probar carga/visualización; requieren revisión del profesional para usarlas como enseñanza técnica. Los pesos, RIR y descansos son datos de prueba, no una prescripción.

No hay código de BE modificado, APK nueva, merge ni despliegue en esta entrega. Los números de prueba del trabajo anterior de Nutrición están atribuidos a su informe; las pruebas de este ZIP solo comprueban el ZIP y sus fixtures.
