# Guion de tareas · tanda del 2026-10-25

Doce tareas para practicar lo de la [guía](TANDA-2026-10-25.md). Hacelas en orden; cada una dice dónde hacerla. Las
respuestas esperadas están en [`TANDA-2026-10-25-RESPUESTAS.md`](TANDA-2026-10-25-RESPUESTAS.md): no las abras hasta
haber intentado.

**Antes de empezar.** Las tareas de pantalla se hacen en un ambiente local o de prueba con datos sintéticos, nunca con
la demostración compartida. Para Administración hace falta una identidad administrativa incorporada con el comando
(`EVIDENCIA/ADMINISTRACION/OPERACION.md`). No copies en ningún lado el QR, la clave, los códigos de recuperación ni el
código de incorporación.

## A · Administración

1. **En el código.** Encontrá dónde decide BE si un profesional puede operar un área con una persona. ¿Qué dos estados
   de Administración tienen que darse a la vez? ¿Qué otras cuatro cosas mira esa misma decisión?
2. **En `/admin`.** Registrá una observación sobre un área pendiente de un profesional. ¿Cambió el estado del área? ¿Qué
   le llega al profesional y qué queda en el historial?
3. **En `/admin`.** Suspendé un área verificada y después rehabilitala. ¿En qué estado queda la habilitación? Repetí
   retirando antes la habilitación: ¿rehabilitar la vuelve a conceder?
4. **Con la API** (o leyendo las pruebas de integración). ¿Qué responde `POST /api/v1/admin/professionals/query` con una
   sesión de profesional? ¿Y con una sesión administrativa sin el segundo factor vigente? ¿Dónde queda registrado el
   intento?
5. **En `/admin`.** Entrá, completá el segundo factor y dejá la pestaña quieta más de 15 minutos. Recargá. ¿Qué pide la
   pantalla? ¿Por qué la cookie de reanudación no alcanza para seguir?
6. **En `OPERACION.md`.** La persona administradora perdió el teléfono, pero guardó los códigos de recuperación: ¿qué
   pasos sigue? ¿Y si no los guardó? ¿Hay algún camino que deje la cuenta sin segundo factor?
7. **En dos pestañas.** Abrí la misma ficha y decidí sobre la misma área en las dos, una después de la otra, sin
   recargar. ¿Qué ve la segunda? ¿Se pierde lo que escribiste?

## B · Sustitución de ejercicios (con la próxima candidata de la APK)

8. **En el teléfono.** En la sesión del día, registrá dos series de un ejercicio y sustituilo por otro. ¿Qué te dice el
   diálogo antes de confirmar? ¿Qué pasa con el plan del profesional y con el descanso que estaba corriendo? (Seguí el
   guion de `EVIDENCIA/SUSTITUCION-DE-EJERCICIOS/GUION-DEL-TELEFONO.md`.)

## C · Comparación de Nutrición

9. **En Analizar.** Con una persona cuyo plan tiene una sola opción en cada comida, elegí calorías y proteínas por día.
   ¿Qué forma tiene cada capa y dónde dice su nombre? Elegí un día sin rombo: ¿por qué no tiene?
10. **En Analizar.** Con un plan que deja elegir el almuerzo, ¿hay rombos? ¿Dónde ves lo indicado de lo que comió la
    persona ese día?
11. **Pensalo con el código.** Si hoy activás otra versión del plan, ¿cambia lo indicado de ayer? ¿Y el de hoy?
12. **En la descarga.** Bajá el CSV de Analizar con calorías por día. ¿Qué columnas nuevas hay? ¿Qué es una fila que dice
    «sin registros» con el valor vacío?
