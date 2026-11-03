# Qué cambió desde el corte de la tesis (20/10 → 3/11)

**Dónde estamos.** El documento de la tesis describe `main` `0fb1bff` (20/10). Desde entonces entraron 18 integraciones
a `main` (24 y 25/10, 26/10, 2/11 y una de solo evidencia el 3/11); test sirve `b62ce90` (2/11) y la APK para probar es
la `0.19.0-candidata.1` (3/11). La estable sigue siendo la 0.13.2. Sale de `git log --first-parent 0fb1bff..8883e88`.

## La persona, en la APK

- **Vuelve sustituir un ejercicio durante la sesión**, como en la 0.13.2: vale para todas las series de ese ejercicio en
  esa sesión y no cambia el plan (DL-151, ratificada el 25/10; #195; llegó al teléfono con la 0.18.0-candidata.1).
- **La sesión, serie por serie:** cada serie tiene su casilla al final de la fila; arriba se ve en qué ejercicio y serie
  va, y el tiempo de la sesión y del ejercicio. Lo escrito queda a la vista y se guarda al salir de la pantalla o al
  pasar a segundo plano: es la respuesta al defecto D-C1 de la prueba del 29/10 (#226), y en el teléfono se prueba el
  miércoles 4/11.
- **«Ya la hice»:** un registro de dos a cinco pasos cortos. «Hice todo lo planificado» va directo al último cuadro, con
  los valores del plan a la vista, y «Cambiar» deja decir que hubo una serie menos o una distinta (#228). Vale también
  para el mismo día: los cronómetros son una ayuda, no una obligación (DL-160, decidida el 2/11).
- **Corregir una sesión registrada** ya no es un formulario: suma lo que faltó y quita una serie destildándola; lo
  registrado antes no se borra (#227). Entran también los íconos en las pantallas de la demo y los defectos D-C2 a D-C4.
- **Las APK ya instaladas siguen funcionando** con la API de hoy: lo que lee cada versión quedó congelado y se prueba en
  la CI (DL-152, integrada el 24/10; #198 y #216).

## El profesional, en el website

- **Nutrición:** el número del día dice qué representa y qué comida del plan falta registrar (DL-153); cada revisión
  registrada dice en qué evidencia se apoyó (DL-154); «Analizar» muestra en un mismo gráfico lo registrado, el objetivo
  del profesional y lo indicado en el plan, sin presentarlo como adherencia (DL-158). Las tres, ratificadas e integradas
  el 24 y el 25/10 (#200, #203, #209 y #211).
- **Entrenamiento:** cada sesión dice cómo se cargó (completa, rápida, rápida con cambios, resumida o no realizada) y
  cada serie, si se escribió o se tildó como el plan. Lo tildado sin escribir va con punto hueco y no se compara con lo
  indicado (DL-161, integrada el 2/11 en #224 con #230; las decisiones I-1 a I-10, **a ratificar**).
- **Catálogo visual:** las 17 zonas musculares en el escritorio (DL-081, cerrada el 2/11) y las fotos de los ejercicios
  del catálogo de todos, que cura BE (DL-162, D-1 a D-5 **a ratificar**; #225). En test, los 20 ejercicios de la demo ya
  tienen sus zonas (3/11; #231).
- **Recetas:** 50 nuevas, 66 en total, cargadas en test en la cuenta de Sofía Paz, sin foto (#220, dentro de #229).

## Administración

- **Habilita, suspende y rehabilita a cada profesional por área**, con una identidad administrativa separada y segundo
  factor (DL-155, integrado el 25/10; #210 y #214). Suspender un área no corta las otras ni cierra las sesiones del
  profesional (DL-157, ratificada); cada resolución cita la versión del área que se revisó (DL-156, ratificada).
- Elián entró como administrador con el segundo factor el 27/10 e hizo la parte A de la prueba breve: 7 de 7.
- Suman las pruebas de carrera sin pausas, dos reemplazos del autenticador al mismo tiempo y los rechazos dentro de la
  transacción (#218, dentro de #229). **Falta** el alta pública de profesionales nuevos.

## La calidad

- **CI de `b62ce90`** (corrida 41515338177): 922 pruebas de dominio, 934 de integración con PostgreSQL, 159 de la API,
  561 de scripts y 17 de 17 recorridos de navegador, en verde. Al 26/10 eran 887, 909, 159, 481 y 17.
- **Seguridad:** Next 15.5.28, zod 4.6.6, multer 2.5.0 y body-parser 2.4.0 (#201); la validación de cuerpos ya no junta
  miles de errores (#206); node-forge pasa a 1.4.2. La excepción de auditoría DL-114 (el zod 3 de Expo, solo en la APK)
  **vence el 30/11 a las 21:00** y no se renueva sola: va a Dirección antes.
- **Con personas:** la prueba breve hizo la parte A (27/10) y C2 y C3 en el teléfono (29/10). Faltan la parte B, C4 a C9
  y la APK nueva de punta a punta (miércoles 4/11), TalkBack, un aviso push en un teléfono real y la prueba con
  profesionales reales.
- **Hallazgo abierto:** cargar las zonas de un ejercicio en una sola transacción excede los 5 segundos contra la base de
  Render (P2028); se cargaron de a uno, y el arreglo se deja para después de la demo, para no mover `main`.
