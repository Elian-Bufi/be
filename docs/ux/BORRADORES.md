# Borradores del espacio profesional: qué persiste cada editor

**Fecha:** 2026-10-19. **Encargo:** consolidación del espacio profesional, bloque 3 («Borradores, en una unidad separada si
corresponde»). **Registro:** DEUDA_LEGAJO DL-148. **Va con:** DL-147, que mantiene la sesión después de recargar.

## La regla

- **«Guardado» solo con la respuesta del servidor.** Los cuatro estados son los mismos en todos los editores con borrador:
  «Guardando…», «Guardado a las…», «Pendiente de guardar» y «No se pudo guardar» (`estadoDeGuardado`, en el dominio).
- **El autoguardado guarda la preparación:** no activa planes, no registra revisiones ni confirma actos profesionales.
  Usa la operación de borrador que ya existía y su control de versión (`expectedVersion`).
- **Nada se guarda en el navegador.** Un borrador es información de salud, y lo que nunca llegó al servidor no se promete
  recuperar después de cerrar la página. Mientras dura la pantalla, lo escrito sigue ahí. Recargar o cerrar la pestaña
  con algo sin guardar pide confirmar (el aviso del navegador); «Actualizar» también pregunta.
- **Dos pestañas no se pisan.** Un 409 por versión no sobrescribe nada: el editor lo dice y ofrece «Cargar la versión
  guardada», y lo escrito sigue en pantalla para copiarlo.
- **Un reintento no duplica.** Crear un borrador usa la misma clave de idempotencia en cada intento, y editarlo es un
  PATCH con versión: repetirlo no crea otro. Si un guardado se perdió en la red y el siguiente choca con la versión, el
  editor relee: si lo guardado es lo suyo, no hay conflicto.
- **Lo escrito mientras viaja un guardado no se pisa** con la respuesta: queda pendiente y viaja en el siguiente.
- **Si la sesión vence,** la acción no se confirma sola después de entrar: la página vuelve a montarse con lo guardado.

## El inventario

| Editor | Qué persiste y cómo | Autoguardado | Otra pestaña | Límite |
|---|---|---|---|---|
| **Plan de Nutrición**, versión en preparación | Borrador en el servidor: PATCH con `expectedVersion` | **Sí**, en la primera pausa de 4 s, si no falta completar nada | Aviso de conflicto y «Cargar la versión guardada» | Activar sigue siendo un acto aparte, con su confirmación |
| **Plan de Entrenamiento**, versión en preparación | Borrador en el servidor, con la agenda: PATCH con `expectedVersion` | **Sí**, igual que Nutrición | Igual | Igual |
| **Toma antropométrica** en preparación | Borrador en el servidor: se crea con clave de idempotencia y se guarda con `expectedVersion` | No: se guarda con «Guardar». Tiene los cuatro estados y el conflicto explícito | Aviso de conflicto; «Actualizar» trae lo guardado | Registrar la toma es un acto aparte |
| **Revisión** en preparación | Nada hasta «Registrar» | No | — | Registrar es un acto profesional. Un borrador de revisión pide una operación nueva: queda como propuesta. Mientras tanto, «Actualizar» pregunta y recargar pide confirmar |
| **Evaluación** (Nutrición y Entrenamiento) | Nada hasta «Registrar evaluación» | No | — | Igual que la revisión: un formulario corto, sin borrador en la API |
| **Objetivo** | Nada hasta emitirlo | No | — | Igual |
| **Receta** | Una versión al guardar, con clave de idempotencia | No | La versión vista viaja en la edición | Cada guardado es una versión, no un borrador |
| **Plantillas y habituales** | Al guardar, desde el plan o la sesión | No | — | Se guardan de una vez, desde lo que ya está guardado |
| **Pedir información** | Nada hasta enviar | No | — | Un pedido a medio armar no se retoma después de entrar de nuevo |
| **Nota de coordinación** | Nada hasta enviar | No | — | Igual |
| **Nombre visible** (Cuenta) | PATCH con `expectedVersion` | No | Conflicto por versión | — |

## Cómo se verifica

- **El dominio** prueba la regla de los cuatro estados (`packages/domain/src/estado-de-guardado.test.ts`).
- **El recorrido de navegador en la CI** (bloque 6) retoma un borrador después de recargar y resuelve un conflicto entre
  dos pestañas: que se conserve lo confirmado por el servidor, que no se duplique y que el conflicto se diga.
