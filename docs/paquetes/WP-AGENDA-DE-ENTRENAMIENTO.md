# WP-AGENDA-DE-ENTRENAMIENTO — Las fechas de las sesiones, lo pendiente y los avisos de entrenamiento · definición del paquete

> **Lo que pidió y decidió Dirección el 2026-10-16:**
> - «El plan de entrenamiento, solo los días que tendría que haber entrenado o que lo tenía planificado». La nutrición sigue con el recordatorio de todos los días.
> - La persona puede saltear el día o pasarlo: «el miércoles me tocaba pierna […] lo voy a pasar para mañana», o «fue directamente al tercer día planificado».
> - «Todavía no metería más algoritmos en eso, más que pasar el entrenamiento o el recordatorio».
> - El aviso del día; si no la hizo ni la salteó, al día siguiente le vuelve a llegar que tiene una sesión pendiente, y decide si la hace o la saltea.
> - «Avisa a las 10 am sobre el entrenamiento si es nuevo o atrasado, y a la noche en el caso de no haberlo cargado, 10 pm».
> - «Ya podría arrancar con fechas exactas».
>
> **Legajo:**
> - **06 B-08:** REG-06-111 (la jerarquía del plan, sin tiempo), REG-06-114 (la ejecución conserva su ocurrencia de referencia), REG-06-115 (como mucho una ejecución por ocurrencia identificable), REG-06-126 (el microciclo es la unidad de repetición semanal, sin duración fija) y REG-06-131 (no realizada no es lo mismo que sin registro, y no se infiere de la ausencia).
> - **DL-077:** su opción B, «cada sesión lleva su ocurrencia prevista», se había dejado de lado solo porque el 06 no fijaba fechas.
> - **B10-06:375:** «no confundir con una fecha concreta si el modelo no la fija». Con este paquete, el modelo la fija.
> - **WP-06 §9.2:** «No realizada» sale solo de un acto explícito.
> - **DL-106.**
>
> **Decisiones:** DEUDA_LEGAJO DL-137. También cambia DL-133 D-5, de la opción A a la C.

## 1. Qué cambia para cada uno

**El profesional**, en el editor del plan:
- elige los días de la semana de cada sesión (torso el lunes, piernas el miércoles) y la fecha de inicio del plan;
- BE arma el calendario con las fechas exactas, que se ve antes de activar;
- si una fecha suelta no le sirve, la mueve.

**La persona**, en la APK:
- **Hoy** dice qué sesión le toca, y abajo lo que le quedó pendiente de los días anteriores: «Piernas A, del miércoles».
- Una pendiente se puede **hacer hoy** o **saltear**. Saltear es un botón que toca ella y queda registrado como no realizada (WP-06 §9.2). BE nunca lo supone.
- Las otras sesiones del plan siguen a mano, porque se puede entrenar fuera del calendario.

**Los avisos de entrenamiento:**
- **a las 10:00**, si hay una sesión para hoy o una atrasada: «Hoy te toca Piernas A» o «Te quedó pendiente Piernas A del miércoles»;
- **a las 22:00**, si la sesión de hoy no está registrada ni salteada;
- **un plan sin agenda no tiene aviso de entrenamiento:** antes llegaba todos los días.

## 2. El modelo (DL-137)

| Pieza | Dónde | Qué es |
|---|---|---|
| La agenda | En el contenido de la versión del plan, junto a `blocks` | `startDate` (fecha civil), `weekdays` de cada sesión y `moves`, la lista de fechas movidas a mano. Se versiona con el plan: activada, no se edita; cambiarla es una versión nueva, como cualquier cambio del plan |
| La ocurrencia planificada | Derivada, no se guarda | (sesión, fecha prevista), para cada fecha desde `startDate` hasta la próxima revisión o el reemplazo de la versión, con los movimientos aplicados |
| La resolución | Derivada | Una ocurrencia planificada (S, P) queda resuelta por la primera ejecución registrada de S con fecha entre P y la próxima fecha prevista de S, en cualquier condición: hecha, hecha con cambios o no realizada. Así, hacerla el jueves resuelve la del miércoles. Si no hay, la resuelve una anterior a P y posterior a la prevista anterior: la adelantó. Cada ejecución resuelve una sola fecha |
| La pendiente | Derivada | Una planificada vencida y sin resolver |
| Saltear | Ya existe | Registrar S como `NOT_COMPLETED` en su fecha prevista P (DL-106: la sesión entera, explícita). Para una no realizada de un día pasado, la API ya no pide la hora, porque no pasó nada que tenga hora: rige el último instante de ese día local, un instante convencional que las pantallas no muestran como hora |

**La ejecución no cambia.** Sigue siendo una por sesión y por fecha local de ejecución (DL-077, opción A). La agenda agrega la ocurrencia prevista arriba de esa clave, sin reemplazarla: la opción B se toma como capa de planificación, no como otra clave.

## 3. Compatibilidad: operaciones nuevas, no campos nuevos

Las APK instaladas leen el plan (API-TRN-09) y «Hoy» (API-TRN-14) con esquemas estrictos, y la regla del proyecto es que esas respuestas no cambian de forma (WP-ENTRENAMIENTO-SERIES; la prueba C01). Por eso:
- **el profesional** guarda la agenda con la edición del borrador (API-TRN-10, que la APK no usa) y la lee en el detalle del plan (API-SER-01);
- **la persona** la lee en una operación nueva, **API-AGE-01** `GET /me/training/agenda`: lo de hoy, lo pendiente y lo que viene, cada fecha con su ocurrencia. Los nombres de las sesiones están en las ocurrencias de «Hoy»;
- **las APK instaladas** no la ven y siguen igual.

Al principio se pensó en un campo opcional que solo viajara a quien declarara una capacidad en `X-BE-Capabilities`. Funcionaba, pero la prueba C01 lo frenó con razón.

## 4. Lo que no entra

- Ningún algoritmo que reprograme solo, sugiera días o redistribuya el plan.
- Recordatorios por persona a la hora que elija: las franjas son de BE, a las 10, 15 y 22.
- Dos sesiones el mismo día para la misma persona sigue siendo como hoy: se elige cuál se hizo.

## 5. Las decisiones (DL-137), con sus alternativas

- **D-1 · Días de la semana más fecha de inicio, y movimientos sueltos.**
  - *Alternativas descartadas:* cargar cada fecha a mano (treinta fechas por plan); una fecha por microciclo (el 06 no fija su duración).
- **D-2 · La agenda va en el contenido de la versión.** Se versiona y queda en la instantánea, como el resto del plan.
  - *Alternativa descartada:* una tabla aparte, que se podría editar sin versión, contra B-06.
- **D-3 · La ocurrencia planificada se deriva y no se guarda.**
  - *Alternativa descartada:* materializar las fechas al activar, que duplica el plan y obliga a migrarlo cuando cambia.
- **D-4 · Hacerla otro día la resuelve.** La resuelve hacerla entre su fecha y la próxima de esa misma sesión, o adelantarla después de la prevista anterior. Es la regla «pasarla para mañana» de Dirección.
  - *Alternativa descartada:* una ocurrencia nueva por cada movimiento de la persona. Es más fina, pero agrega un acto que Dirección no pidió («no metería más algoritmos»).
- **D-5 · Saltear es registrarla no realizada en su fecha prevista**, sin hora: la API pone el último instante de ese día.
  - *Alternativas descartadas:* un estado «salteada» nuevo, que sería un tercer valor sin respaldo en el 06; que cada cliente mande una hora inventada.
- **D-6 · Avisos de entrenamiento:**
  - a las 10:00, por una sesión nueva o atrasada;
  - a las 22:00, solo si la de hoy sigue sin registrar;
  - una pendiente se recuerda dos días como mucho;
  - un plan sin agenda no avisa.
  - *Alternativa descartada:* seguir avisando todos los días, que fue la opción A de DL-133 D-5 y Dirección la cambió.
- **D-7 · Operaciones nuevas, no campos nuevos** (§3).
  - *Alternativa descartada:* el campo opcional con una capacidad declarada.
- **D-8 · Qué no se guarda:** una sesión que no está en el plan o repetida, un día repetido, y un movimiento que no parte de una fecha prevista, se repite, cae antes del inicio o choca. Es 422 `TRAINING_PLAN_STRUCTURE_INVALID` con los códigos `AGENDA_*`. Al sacar una sesión del plan, su agenda se poda sola.
- **D-9 · Los textos no nombran la sesión:** dicen el día de la semana de la fecha prevista. La novedad no guarda contenido del plan (DL-133).

## 6. Pruebas

- **Dominio:**
  - el calendario: la fecha de inicio, los días y los movimientos;
  - la resolución: hecha el mismo día, hecha después, no realizada, sin registro;
  - la pendiente y la ventana de dos días;
  - los textos: sin juicios ni «cumplimiento» (la lista de términos prohibidos de entrenamiento).
- **Integración:**
  - el plan con agenda se guarda, se activa y queda en la instantánea;
  - la agenda del día (API-AGE-01) trae lo planificado, lo pendiente y lo que viene, y «Hoy» responde como siempre;
  - saltear registra la no realizada de la fecha prevista sin hora;
  - los recordatorios de las 10 y las 22 salen solo cuando corresponde, y uno por franja.
- **Web y APK:** el editor y «Hoy», con capturas al final.

## 7. Estado (2026-10-16)

- **Dominio y API: hechos**, con sus pruebas (DL-137 en DEUDA_LEGAJO).
- **Sigue:** el editor del website; después la APK, con la próxima construcción.
