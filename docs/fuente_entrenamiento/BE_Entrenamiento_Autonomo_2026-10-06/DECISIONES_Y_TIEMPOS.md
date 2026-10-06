# Decisiones y semántica de tiempos

Este documento complementa el encargo. Los nombres de eventos son conceptuales para las fixtures, no un contrato API existente. La implementación debe mapearlos a entidades versionadas de BE.

## Lo que se puede afirmar

| Dato | Evidencia mínima | Nombre honesto | Lo que no demuestra |
|---|---|---|---|
| Sesión | Inicio y fin explícitos | Tiempo transcurrido de la sesión | Minutos de esfuerzo físico |
| Sesión sin pausas | Inicio/fin y pausas declaradas | Tiempo de sesión sin pausas | Tiempo bajo tensión |
| Ejercicio | Elección explícita de ejercicio activo y cambios | Tiempo asociado al ejercicio | Tiempo ejecutando repeticiones |
| Descanso | Inicio y fin explícitos, ligados a la serie | Descanso registrado | Que no entrenó mientras corría el reloj |
| Serie | Inicio y fin explícitos de esa serie | Duración medida de la serie | Cadencia o calidad técnica |
| Intervalo entre registros | Dos timestamps de interacción | Tiempo entre registros | Duración de serie o descanso |
| Intervalo sin cierre fiable | Inicio y hueco sin fin verificable | Incompleto; estimado si hay una estimación defendible | Una duración medida exacta |

**No confundir origen y calidad.** Un intervalo introducido a mano es informado por el usuario, aunque tenga segundos exactos; no es medido por la app. Un intervalo reconstruido por reloj civil tras reiniciar tiene una incertidumbre diferente de uno medido con reloj monotónico en el mismo proceso.

## Convenciones

- Intervalos semiabiertos [inicio, fin), en segundos enteros en la fixture. En BE mantener la resolución interna apropiada y redondear al mostrar.
- Total de sesión = fin − inicio. Pausas = unión de intervalos válidos de pausa; sin pausas = total − pausas. Descansos están DENTRO del total y del tiempo del ejercicio, no se suman de nuevo.
- Tiempo asociado al ejercicio = unión de intervalos de ejercicio activo, intersectada con sesión y descontando pausas explícitas. El tiempo sin ejercicio asignado se conserva por separado. La suma de ambos debe cuadrar con la sesión sin pausas para una captura completa.
- Abrir una pantalla de técnica no inicia entrenamiento ni cambia ejercicio activo. Cambiar de ejercicio activo sí cierra un tramo y abre otro; volver al primero crea un nuevo tramo, no pisa el previo.
- Un descanso conserva `exerciseId`, identidad de la prescripción, serie e identidad del objetivo histórico, aunque el usuario enfoque después la fila siguiente.
- Pausar sesión suspende una medición activa por una acción explícita. Finalizar sesión con mediciones abiertas solicita resolverlas: finalizar ahora por declaración o dejarlas incompletas. Esas dos elecciones no son equivalentes.
- No crear un descanso o una serie medida retroactivamente porque ya hay dos registros de carga/repeticiones.
- Reintentos con el mismo evento no suman tiempo. Evento repetido con payload distinto es conflicto, no reemplazo silencioso.
- Eventos recibidos tarde conservan orden causal y tiempos de origen; `receivedAt` no sustituye el reloj de la sesión. Corregir un evento requiere trazabilidad.
- Cambios de reloj civil dentro de un proceso no alteran una duración monotónica válida. Tras muerte del proceso o falta de ancla fiable, no continuar el monotónico del proceso anterior.
- Nunca terminar una sesión abandonada automáticamente a la hora de reapertura y etiquetarla como entrenamiento exacto. Presentar recuperación y permitir resolverla. Las políticas de expiración pueden marcar un estado incompleto sin inventar el final físico.
- Dispositivos simultáneos necesitan identidad de sesión, control de versión y resolución explícita; no unir intervalos de relojes diferentes sin criterio documentado.

## Ejemplo reproducible principal

Todo es sintético. Se expresa con offsets desde un inicio arbitrario para evitar confundir fecha de fixture con una sesión real de hoy.

| Segundo | Evento |
|---:|---|
| 0 | Iniciar sesión |
| 10 | Activar ejercicio A |
| 20–60 | Medir serie A1: 40 s |
| 65–155 | Descanso A1: 90 s, objetivo 90 s |
| 70 | Registrar resultados A1 durante el descanso |
| 170–210 | Medir serie A2: 40 s |
| 215–350 | Descanso A2: 135 s, objetivo 120 s |
| 220 | Registrar resultados A2 |
| 400 | Registrar A3 sin haber medido su inicio/fin |
| 450 | Activar ejercicio B |
| 500–620 | Pausa explícita de sesión: 120 s |
| 900 | Finalizar sesión |

Resultado: total 900 s (15:00), pausa 120 s (2:00), sin pausas 780 s (13:00). Ejercicio A: 440 s (7:20). Ejercicio B: 330 s (5:30). Sin ejercicio asignado: 10 s. Serie A3: duración desconocida, aunque existe el registro de repeticiones. Descanso A2: +15 s respecto del objetivo, con redacción neutral.

Estos tiempos asociados incluyen interacción y descanso. No son calorías, volumen, adherencia ni una evaluación del esfuerzo. El entrenador interpreta los datos con el resto del contexto.

## Comparación contra el plan

La serie activa siempre conserva su objetivo efectivo histórico. Los placeholders son solo presentación. Si el usuario registra 14 repeticiones frente a 12–16, el dato real es 14, el rango es el objetivo. Si registra 9 frente a 10–12, el dato es 9; la UI puede mostrarlo junto al rango sin puntuarlo. Un RIR informado 0 no se elimina por un chequeo de falsedad. Una carga 0 explícita no se convierte en null. Los campos vacíos siguen null.

Los rangos son inclusivos. Solo comparar valores con semántica y unidades compatibles. No convertir «dos mancuernas de 12 kg» en «24 kg» para la UI sin la base de carga explícita. No convertir repeticiones por pierna en totales. Si falta ese contrato, conservar la descripción y evitar cálculos derivados.

## RIR y privacidad

Ayuda de producto: «Cuántas repeticiones más creés que podrías haber hecho manteniendo la técnica». Es una estimación subjetiva del usuario, no un resultado calculado. No se deduce de un porcentaje de RM, ni se transforma automáticamente en RPE.

Los tiempos se presentan al asesorado y al profesional autorizado con vínculo/finalidad vigentes. No se publican ni se usan como vigilancia oculta. No se necesita capturar ubicación, audio, video del usuario ni datos de terceros para este alcance. Mantener el borrador y los tiempos aislados por cuenta.

Referencia consultada para la definición, no para prescribir el entrenamiento: NASM, «Reps in Reserve: Coaching Intensity With RIR», https://www.nasm.org/resource-center/blog/training/reps-in-reserve-coaching-intensity-with-rir (consulta: 06/10/2026). La definición se parafrasea; no se adopta su conversión RPE ni sus recomendaciones de intensidad como reglas nuevas de BE.
