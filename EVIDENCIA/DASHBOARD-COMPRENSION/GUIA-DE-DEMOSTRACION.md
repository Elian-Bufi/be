# Guía de demostración · la ficha del asesorado que prepara la consulta

Para recorrer, como profesional, lo que cambió con WP-DASHBOARD-COMPRENSION. Todo es local y sintético: no hay datos de
personas reales ni se escribe nada en `test` ni en producción. Lleva unos 25 minutos.

## Antes de empezar

- Abrí `http://localhost:3000/login` en Chrome o Edge (el comando para levantarlo está al final).
- Entrá con el profesional sintético: su correo es el campo `proCorreo` de
  `EVIDENCIA/DASHBOARD-PROFESIONAL/herramientas/trabajo-comprension/estado.json`, y la clave es
  `clave-sintetica-de-prueba-01`.
- En «Espacio profesional», abrí el asesorado A (el primero de la cartera; su ficha dice «Asesorado · 2fa34a» o el nombre
  que tenga en tu generación).
- El escenario está armado para el día en que se generó: lo que dice «hace 20 días» cuenta desde ese día.

## 1 · Preparar una consulta (5 minutos)

1. **Mirá la primera pantalla sin desplazarte.** Arriba, la persona y el acceso actual en una línea. Debajo, una tabla
   con una fila por área: el objetivo vigente hoy, la planificación (la versión vigente hoy y la que rigió antes en el
   período) y las revisiones. Enseguida, «Para tu próxima revisión».
2. **Leé «Para tu próxima revisión».** Son hechos, no juicios: la próxima revisión acordada, una revisión de
   Entrenamiento registrada que todavía no se aplicó, un borrador que no rige, un cambio de protocolo en el peso. Cada uno
   dice de qué área, desde cuándo, de dónde sale y qué podés abrir. «Ver todas» muestra el resto.
3. **Abrí «Ver en la línea de tiempo (Nutrición)»** en la observación de lo nuevo desde la revisión. La línea de tiempo
   llega filtrada: lo que ocurrió después de la revisión del 19 sept, lo que se cargó después sobre días anteriores (una
   merienda de agosto cargada en octubre) y lo que se corrigió después. El aviso de arriba lo explica y «Ver todo el
   período elegido» lo quita.
4. **Volvé al Resumen y elegí «¿Cómo viene progresando este ejercicio?»** (en «Empezar por una pregunta»). La pantalla
   te pide el ejercicio: no elige el primero por vos. Elegí «Peso muerto» y «Ver la respuesta».
5. **Tocá un punto o usá las flechas en un gráfico**, y «Ver el origen de este dato»: la sesión se abre al costado.
   Cerrala con Esc: la vista sigue igual. Abrila otra vez y seguí «Ver en Entrenamiento · Ejecuciones»; desde ahí,
   «Volver a la ficha, donde estabas» te trae de vuelta a la misma pregunta, con el mismo ejercicio y período.

## 2 · Revisar entrenamiento (5 minutos)

1. En Analizar, elegí «¿Lo registrado coincide con lo indicado?», área Entrenamiento, ejercicio «Peso muerto». Cada
   sesión aparece con lo que indicaba la versión del plan que ejecutó, aunque después se haya activado otra.
2. En el Resumen, «Preparar la revisión de Entrenamiento». El formulario se abre con el período desde la última revisión
   y dice «Preparado por BE para esta revisión». **Todavía no se registró nada.**
3. Marcá una evidencia, escribí una interpretación sintética, elegí «Mantener», completá el fundamento y la próxima
   acción, y «Registrar revisión». Aparece un aviso con «Volver a la ficha, donde estabas».
4. En la ficha, la fila de Entrenamiento ya dice la revisión de hoy, «registrada, sin aplicar», y lo nuevo se cuenta desde
   ella. No hace falta recargar.

## 3 · Nutrición: detectar un faltante y pedir contexto (4 minutos)

1. «¿Lo registrado coincide con lo indicado?», área Nutrición. Es una tabla: una fila por comida, con la opción, las
   cantidades y la versión del plan. Elegí «Solo las que no registraron las porciones del plan»: quedan las comidas con
   cantidades informadas, sin confirmar o diferentes.
2. En una «sin confirmar», «Ver lo indicado y lo registrado»: lo indicado por la opción, ingrediente por ingrediente, y
   las cantidades siguen sin confirmar (no se completan con las del plan).
3. Para preguntarle a la persona, en el Resumen, «Solicitar contexto»: abre el flujo de formularios. Podés salir con
   «Volver a la ficha, donde estabas» sin enviar nada: no se crea ninguna solicitud.

## 4 · Comparar etapas (5 minutos)

1. «Más preguntas» → «¿Qué cambió entre dos etapas?», área Nutrición. La pantalla sugiere las dos últimas versiones;
   confirmalas con «Ver la respuesta».
2. Las tarjetas A y B dicen desde y hasta cuándo rigió cada versión (el día del cambio es de la nueva), su duración y
   cómo terminó. La tabla resume cada métrica con el mismo criterio en las dos etapas, con su cobertura; los registros
   son totales de duraciones distintas y no se restan: lo dice.
3. Debajo están los gráficos. Cambiá «Agrupar por» a «Semana» y acercá un tramo arrastrando sobre un gráfico: el gráfico
   cambia, la tabla no (resume las observaciones originales).
4. En «Vistas guardadas», guardá la vista. Abrila en otro asesorado: las etapas del primero no aplican, la pantalla lo
   dice y te las pide de nuevo.

## 5 · Revocación (con las cuentas descartables, 3 minutos)

Requiere las cuentas descartables (ver el comando técnico). Con la ficha del asesorado descartable abierta en Analizar
(peso e IMC), el asesorado revoca Antropometría desde su web (otra ventana, en modo incógnito). En la ficha del
profesional, «Ver el origen de este dato» dice que ya no está disponible, y en unos segundos la cabecera deja de decir
«Activo» para Antropometría, sin recargar: los gráficos y las acciones de ese alcance se retiran; Nutrición sigue.

## 6 · Recuperación (no se puede provocar a mano sin herramientas)

Lo prueba el recorrido automático: una respuesta lenta de otra persona que llega tarde no se muestra; si una parte de
la síntesis no responde, se dice «No pudimos completar esta parte» arriba de todo; si falla una métrica, las otras siguen
y un solo «Reintentar» trae todo; un conflicto al guardar los indicadores conserva lo que elegiste.

## Qué mirar con ojo crítico

- ¿El primer pantallazo te dice qué buscar en la consulta?
- ¿Algún texto te sobra o te falta para confiar en un número?
- ¿Alguna vez tuviste que buscar al asesorado de nuevo o perdiste lo que estabas mirando?

## Comando técnico mínimo

Desde `EVIDENCIA/DASHBOARD-PROFESIONAL/herramientas`, con Node 22 y el PostgreSQL local de la sesión en :55442:

```sh
export BE_TRABAJO="$PWD/trabajo-comprension"
export BE_E2E_DATABASE_URL=postgresql://be_test:be_test@localhost:55442/be_test_comprension
./entorno.sh compilar-api && ./entorno.sh compilar-web     # una vez, con la API apagada
./datos/regenerar-comprension.sh                            # datos de hoy: base, escenarios D y E (deja la API arriba)
./entorno.sh web                                             # la web en :3000
# Cuentas descartables (recorrido 5):
node datos/generar.mjs descartable-cuentas
./entorno.sh parar-api && ./entorno.sh api "$(sed -n 's/^BE_DEMO_PROFESIONALES=//p' trabajo-comprension/demo-profesionales-descartable.txt)"
node datos/generar.mjs descartable-datos
```
