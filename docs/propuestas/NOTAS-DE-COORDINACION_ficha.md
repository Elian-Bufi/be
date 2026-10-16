# Propuesta · Notas de coordinación entre los profesionales de una persona (RF-057 · UC-E07 · API-CRD-01)

> **Estado (2026-10-16):** PROPUESTA para decisión de Dirección. **No implementada.** La escribió el ejecutor con el mandato del 16/10 («que vayas haciendo los casos de uso y los requisitos funcionales que faltan»).
>
> **Por qué no se implementó en el mismo día:**
> - es P0, pero obliga a decidir quién lee una nota de texto libre sobre una persona, y el 08 tiene dos reglas que tiran para lados distintos (§2);
> - la regla del proyecto es «fichas antes de módulos».
>
> Los identificadores `CRD-D*` son locales a esta propuesta.

## 1. Lo que ya está establecido

| Texto vigente | Qué establece |
|---|---|
| 04 RF-057 (P0, núcleo no recortable) | Documentar contexto de coordinación **sin transferir responsabilidad ni facultades** entre especialidades. La nota conserva autor, destinatarios o alcance y dominio. No modifica planes ajenos. Solo la consultan actores autorizados |
| 05 UC-E07 (§11.8), extensión de UC-P24 | Se coordina **desde el tablero**. El autor elige destinatario o alcance de visibilidad permitido. BE muestra los límites: no prescribir, no modificar, no decidir sobre otro dominio, no transferir responsabilidad. La nota no cierra ciclos, no cambia la próxima acción de otro, no es un chat, y una referencia protegida no se vuelve visible por nombrarla |
| 06 T-06-43 (M-11) | Entidad trazable: autor, destinatario, alcance y pertinencia, sin transferencia de responsabilidad |
| 09 §11.6 | `POST /api/v1/advisees/{adviseeId}/coordination-notes` (API-CRD-01). **No hay un GET propio:** la nota se lee en la línea de tiempo y en el tablero. Con el vínculo pausado o finalizado, los profesionales dejan de leerla, y eso es política (08 Q-005, §14), no un hueco |
| 08 §9.15 y 08:495 | El asesorado ve **toda su historia**: sin notas secretas |
| 08 §11-bis y N-9 | El texto libre queda **fuera de la vista pertinente por defecto**. No se resume automáticamente |
| 11A | TEST-RF-057 y TEST-UC-E07 |
| Plan Funcional §3.4 y §8.2 | Una síntesis compartible escrita por el profesional, con alcance, destinatario y finalidad. Ejemplo: «restricción operativa a considerar en la planificación», con responsable y fecha de revisión |

**Lo que BE ya tiene para apoyarla:**
- la ficha del asesorado con Resumen, Línea de tiempo y Analizar;
- el PDP por alcance y consentimiento;
- las novedades (DL-133);
- los nombres visibles (DL-040).

## 2. Lo que falta decidir

**CRD-D1 · Quién la lee entre los profesionales.**
- **A (recomendada):** el autor elige entre «todos los profesionales que acompañan a la persona» y uno en particular. En los dos casos, solo los que tienen ese día un vínculo ACEPTADO y el B2 VIGENTE con la persona, en cualquier alcance.
- **B:** siempre todos.
- **C:** por alcance («quien lleve Nutrición»).
- *Por qué A:* es lo que pide UC-E07 («destinatario o alcance de visibilidad permitido»), y C se rompe cuando una misma persona lleva dos áreas.

**CRD-D2 · La lee la persona.**
- **A (recomendada):** sí, en la APK y en su historia. Es lo que manda el 08 §9.15: no hay notas secretas sobre el titular. Al escribirla, el profesional ve el aviso «la persona también la lee», como en REV-A.
- **B:** solo por la exportación de sus datos. Se aparta del autoservicio del 08:495.

**CRD-D3 · El texto libre frente al 08 §11-bis.**
- **A (recomendada):** se admite.
  - *Por qué:* la nota no es un registro de un dominio compartido por pertinencia. Es una comunicación que el autor escribe a propósito para otro profesional, y el 08 §11-bis apunta a lo primero.
  - *Las barreras:*
    - el texto se limita a 600 caracteres;
    - al escribirla se muestra el aviso «escribí solo lo que el otro profesional necesita para su trabajo»;
    - no lleva adjuntos;
    - BE no resume nada automáticamente.
- **B:** sin texto libre, solo plantillas cerradas («restricción operativa», «cambio de plan en mi área», «pedido de coordinación») con campos estructurados. Es más seguro, pero limita lo que se puede decir.

**CRD-D4 · Finalidad y dominio.**
- **Recomendada:** una lista cerrada de finalidades:
  - «Contexto para tu área»;
  - «Cambio en mi área que conviene que sepas»;
  - «Pedido de coordinación».
- El dominio de origen es el alcance del autor con esa persona. Si el autor tiene dos alcances, elige uno.

**CRD-D5 · Referencias.**
- **Recomendada:** solo recursos del propio dominio del autor (una versión de plan, una revisión, una toma), por identificador.
- El destinatario ve que existe la referencia («Plan de Nutrición del 10/10»), pero solo la abre si ya tenía permiso: nombrarla no da acceso (UC-E07).

**CRD-D6 · Aviso al destinatario.**
- **Recomendada:** sí, una novedad de la familia NOV (DL-133): «Lic. Sofía Paz dejó una nota de coordinación sobre Diego Sosa».
- El push sigue genérico («Tenés una novedad.»).

**CRD-D7 · Corregir o retirar.**
- **Recomendada:** la nota no se edita ni se borra. Solo admite agregar, como toda la historia (08 §29).
- Para corregir, se escribe otra nota que la cita («Corrige la del 12/10»).

**CRD-D8 · Dónde aparece.**
- **Recomendada:**
  - en la **Línea de tiempo** de la ficha, como un hito «Nota de coordinación», con autor, finalidad y fecha, y el texto al abrirla;
  - en **Resumen**, como «Notas recientes del equipo» (las tres últimas);
  - en la **APK**, si CRD-D2 es A, en una pantalla «Notas entre tus profesionales».

## 3. Propuesta técnica, si se eligen las recomendadas

- **Modelo:** las tablas `nota_de_coordinacion` (solo agregar) y `destinatario_de_nota` (las identidades concretas al momento de escribirla, para que la visibilidad no cambie sola si después se suma otro profesional).
- **API:**
  - API-CRD-01 `POST /advisees/{id}/coordination-notes`, con idempotencia. Se autoriza en dos tiempos, para el autor y para cada destinatario (UC-I02, pasos 3 y 5).
  - La lectura va dentro de la línea de tiempo del profesional y, para la persona, en una variante «-PROPIA» como en REV-A. Esa variante necesita declararse en el contrato, con su DL.
- **Website:** «Escribir una nota de coordinación» desde la ficha, con los cuatro límites a la vista y el aviso de CRD-D2.
- **APK:** la lista de notas sobre la persona, si CRD-D2 es A.
- **Pruebas:** TEST-RF-057 y TEST-UC-E07 contra PostgreSQL.
  - autor sin vínculo: 403;
  - destinatario que pierde el vínculo: deja de verla;
  - pausa y finalización;
  - una referencia ajena no se abre;
  - el texto no aparece en el push;
  - lo que se registró no se puede modificar ni borrar.
- **Tamaño:** M, alrededor de un día con la interfaz y sus capturas.

## 4. Lo que no entra

- Un chat, respuestas en hilo o mensajes entre la persona y el profesional (UC-E07: «no existe chat general»).
- Notas privadas del profesional sobre la persona. Serían «notas secretas» (08 §9.15).
- Resúmenes automáticos de una nota (08 §11-bis).
