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
3. **La evidencia viene sin nada marcado y agrupada:** la planificación y el objetivo arriba, y las sesiones por día, una
   fila por día. Marcá la versión del plan y un día entero («marcar las 2 sesiones»): el resumen dice «Marcaste 3 de…».
   Con «Ver las 2» desmarcás una sesión sola, y «Lo que marcaste» lista lo marcado con «Quitar». Marcar no es haber
   examinado: dejá marcado solo lo que miraste.
4. Escribí una interpretación sintética, elegí «Mantener», completá el fundamento y la próxima acción, y «Registrar
   revisión». Aparece un aviso con «Volver a la ficha, donde estabas».
5. En la ficha, la fila de Entrenamiento ya dice la revisión de hoy, «registrada, sin aplicar», y lo nuevo se cuenta desde
   ella. No hace falta recargar.

## 3 · Nutrición: detectar un faltante y pedir contexto (5 minutos)

1. «¿Lo registrado coincide con lo indicado?», área Nutrición. Es una tabla: una fila por comida, con la opción, **cómo
   se registraron las cantidades** (el modo) y **qué se comprobó frente a lo indicado**, y la versión del plan.
2. Elegí «Distintas de lo indicado»: quedan solo las comidas cuyas cantidades informadas no coinciden con la opción, y
   cada una dice en cuántos ingredientes. Elegí «Con cantidades informadas a mano»: aparece también una merienda
   informada a mano con las mismas cantidades de la opción, que dice «Igual a lo indicado». El modo no es una diferencia.
3. Elegí «Sin confirmar o comidas diferentes»: no se pueden comparar, y lo dicen («No se puede comprobar: sin
   confirmar», «No se compara: fuera de lo indicado»). En una sin confirmar, «Ver lo indicado y lo registrado»: lo
   indicado por la opción, ingrediente por ingrediente, y las cantidades siguen sin confirmar.
4. En el Resumen, «Preparar la revisión de Nutrición»: las comidas del período aparecen por día (una fila por día, no
   una casilla por comida), sin nada marcado. No hace falta registrar: «Cancelar» no escribe nada.
5. Para preguntarle a la persona, en el Resumen, «Solicitar contexto»: abre el flujo de formularios. Podés salir con
   «Volver a la ficha, donde estabas» sin enviar nada: no se crea ninguna solicitud.

## 4 · Comparar etapas (5 minutos)

1. «Más preguntas» → «¿Qué cambió entre dos etapas?», área Nutrición. La pantalla sugiere las dos últimas versiones;
   confirmalas con «Ver la respuesta».
2. Las tarjetas A y B dicen desde y hasta cuándo rigió cada versión (el día del cambio es de la nueva), su duración y
   cómo terminó. La tabla resume cada métrica con el mismo criterio en las dos etapas, con su cobertura **en días de la
   etapa**: la etapa A dice cuántos de sus días tienen valor y cuántos no tienen registros (hay un hueco de cuatro días),
   y la B dice que hoy sigue en curso y queda fuera de la media. Los registros son totales de duraciones distintas y no
   se restan: lo dice.
3. Justo debajo de la tabla, «Comparar otros dos períodos, con fechas elegidas a mano» está plegado: es una opción
   secundaria con esta pregunta. Abrilo si querés comparar otras fechas.
4. Debajo están los gráficos. Cambiá «Agrupar por» a «Semana» y acercá un tramo arrastrando sobre un gráfico: el gráfico
   cambia, la tabla no (resume las observaciones originales).
5. En «Vistas guardadas», guardá la vista. Abrila en otro asesorado: las etapas del primero no aplican, la pantalla lo
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

En el repositorio con sus dependencias (`npm ci` en la raíz), Node 22 y Git Bash. **PostgreSQL 16 local, sin Docker**,
en una terminal aparte que queda abierta. El lanzador no crea nada sin pedirlo: un clúster nuevo se crea con `--crear`
(en `postgres-local/datos`), y uno que ya existe se indica con `BE_PG_DATOS`; si falta el clúster o la base, no arranca y
lo dice (D-33):

```sh
cd EVIDENCIA/DASHBOARD-PROFESIONAL/herramientas/postgres-local
npm ci                                                   # una vez: descarga PostgreSQL 16
node iniciar.mjs --crear                                 # desde cero: crea el clúster y la base be_test_comprension
BE_PG_DATOS=<directorio del clúster> node iniciar.mjs    # o un clúster que ya existe (no crea nada)
```

La demostración preparada del 2026-10-09 usa un clúster que ya existe: sus comandos exactos, en PowerShell, están en
`demostracion/LEEME.md`.

En otra terminal, desde `EVIDENCIA/DASHBOARD-PROFESIONAL/herramientas`:

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

Para terminar: `./entorno.sh parar-web && ./entorno.sh parar-api`, y Ctrl+C en la terminal de PostgreSQL (o, desde
cualquier terminal y con el mismo `BE_PG_DATOS`, `node postgres-local/parar.mjs`). Los datos quedan;
`./datos/regenerar-comprension.sh` los vuelve a armar para el día.
