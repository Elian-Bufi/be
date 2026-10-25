# Respuestas esperadas · tanda del 2026-10-25

Las respuestas del [guion de tareas](TANDA-2026-10-25-TAREAS.md), con dónde se ve en el código o en las pruebas. Si en la
pantalla ves otra cosa, anotala: puede ser un defecto o un caso que la definición no previó.

## A · Administración

1. **Dónde se decide.** En [`evaluarAutorizacion`](../../packages/domain/src/autorizacion.ts#L93), que el PDP llama en
   cada pedido. Las dos de Administración: la verificación del área en `VERIFICADO` (no suspendida) **y** la habilitación
   `CONCEDIDA` (dimensiones `ESPECIALIDAD_O_CAPACIDAD` y `SITUACION`). Además mira el rol (perfil profesional), las
   cuentas operativas y el A3, el vínculo `ACEPTADO`, el consentimiento `VIGENTE`, y que la finalidad y el alcance de la
   operación correspondan. Ninguna se cachea: la decisión vale desde el pedido siguiente.
2. **Observación.** El área **sigue `PENDIENTE`**: una observación no suspende ni rechaza (REG-06-37). Al profesional le
   llega una novedad de Administración con el texto que se le comunicó (nunca el fundamento interno). En el historial
   queda el hecho con autor, fundamento, texto comunicado, estado anterior y posterior (iguales) y momento.
3. **Suspender y rehabilitar.** Rehabilitar vuelve la verificación a `VERIFICADO` y la habilitación **queda como
   estaba** (`CONCEDIDA`). Si antes se había retirado, **sigue `RETIRADA`**: rehabilitar no concede. Para volver a
   operar hace falta conceder la habilitación, explícitamente. Las personas vinculadas reciben un aviso cuando el
   profesional deja de poder operar el área y otro cuando vuelve a poder.
4. **Sin permiso.** Con una sesión de profesional: `403 ACTION_FORBIDDEN`. Con una sesión administrativa sin el segundo
   factor vigente: `403 MFA_REQUIRED`. Los dos rechazos quedan en `RegistroDeAuditoria` con la operación que se intentó
   (`SESION_NO_ADMINISTRATIVA`, `MFA_REQUERIDO:…`), porque los guards los auditan
   ([`sesion-administrativa.guard.ts`](../../apps/api/src/administracion/sesion-administrativa.guard.ts)). Lo prueban
   las pruebas de integración de Administración.
5. **Quince minutos quieta.** La pantalla pide **un código nuevo** del autenticador (no la contraseña). La cookie de
   reanudación solo devuelve un token de la misma sesión; lo que dice del segundo factor lo decide **la base**
   (`SegundoFactorDeSesion`), y venció por inactividad. Reanudar nunca valida un segundo factor. A las 8 h vence la
   sesión entera y hay que entrar de nuevo.
6. **Perdió el teléfono.** Con códigos: entra con la contraseña y un código de recuperación (ese código ya no vuelve a
   valer) y, en «Seguridad», reemplaza el autenticador con la contraseña otra vez; salen diez códigos nuevos y las otras
   sesiones administrativas terminan. Sin códigos: el operador corre `restablecer-segundo-factor`, que revoca el
   autenticador, los códigos y las sesiones y emite un código de incorporación nuevo; la persona configura todo como la
   primera vez. **No hay ningún camino sin segundo factor**: sin completar la configuración, no hay acceso. Si además
   perdió la contraseña, el operador retira el rol e incorpora otra identidad.
7. **Dos pestañas.** La segunda recibe `409 VERSION_CONFLICT`: la decisión no se guarda, lo escrito **se conserva** en
   el diálogo, la ficha se vuelve a leer y se muestra la situación actual para decidir de nuevo. Un doble clic con la
   misma `Idempotency-Key` devuelve la misma respuesta sin repetir la decisión ni los avisos.

## B · Sustitución de ejercicios

8. **El diálogo** dice, antes de confirmar, cuántas series ya registradas pasan a contar como el ejecutado («Las 2 series
   que ya registraste de «…» pasan a contar como «…»»). **El plan del profesional no cambia**: solo viaja el ejercicio
   realizado y la API marca «Sustituido». El descanso o la serie cronometrada que estaba corriendo **sigue igual**. Sin
   conexión, se dice que sustituir la necesita; si no llega la respuesta, que no se sabe si se guardó, sin perder lo
   elegido. Esto se prueba en el teléfono con una candidata: hasta entonces queda **pendiente**.

## C · Comparación de Nutrición

9. **Las capas.** Registrado: línea continua con puntos. Objetivo del profesional: línea discontinua (un escalón por
   versión del objetivo; en proteínas, en gramos). Indicado en el plan: rombos huecos, uno por día. Los nombres van en la
   leyenda del encabezado de cada panel. **Un día sin rombo** es un día en que la regla no determina lo indicado: no
   regía ningún plan, ese día cambió la versión, no se sabe el día tipo o alguna comida tiene varias opciones. La
   lectura de ese día dice el motivo.
10. **Con alternativas.** No hay rombos, y debajo del gráfico se dice por qué. Lo indicado de lo que comió la persona
    está en **«Ver origen»**: cada comida registrada dice «Indicado en el plan: … kcal» de la opción que eligió; una
    comida diferente dice que no es una opción del plan.
11. **Otra versión hoy.** Lo indicado de ayer **no cambia**: sale de la instantánea de la versión que regía ayer. Hoy
    rigieron dos versiones, así que **no hay un indicado del día**; cada comida de hoy lo tiene con la versión que cita su
    registro. Lo prueba `comparacion-nutricional.int-spec.ts`.
12. **La descarga.** Dos columnas al final: «Objetivo del profesional (por día)» e «Indicado en el plan». Una fila
    «sin registros» con el valor vacío es **un día sin registros que tiene indicado** (el gráfico le dibuja un rombo): el
    valor vacío no es un cero. Las columnas de antes no se movieron.
