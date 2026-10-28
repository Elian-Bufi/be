# Plan de estudio: entender BE en cuatro sesiones

Cuatro sesiones de 20 a 30 minutos, de lo macro a lo micro. Cada una tiene qué leer, una actividad práctica y cómo
comprobar que se entendió. Las respuestas están aparte, en [RESPUESTAS.md](RESPUESTAS.md): conviene mirarlas recién
después de intentar.

Materiales (se arman con `node construir.mjs` desde esta carpeta):

- `salida/BE-guia-central.pdf`: la guía central, 24 páginas. En este plan, «G» y un número es una página de la guía.
- `salida/BE-cuaderno-de-datos.pdf`: el cuaderno de datos, 19 páginas. En este plan, «C» y un número es una página del
  cuaderno.

Commit de referencia: `e4512cb` (`main`, 2026-10-26).

---

## Sesión 1 · Para qué sirve BE y con qué piezas (25 minutos)

**Objetivo.** Poder explicar BE sin pantallas, en un minuto y medio, a alguien que no lo conoce.

**Leer (12 min).** G3 a G9: el nivel 1 (el problema, el ciclo de trabajo y qué valor está demostrado) y el nivel 2 (las
piezas, qué corre dónde, cómo es un pedido y dónde está cada cosa).

**Actividad (8 min): ejercicio 1, «Arquitectura en 90 segundos».** Sin mirar la guía, grabate en el teléfono
explicando BE en 90 segundos. Tiene que aparecer:

1. el problema que resuelve y para quién;
2. las tres superficies y sus tres actores;
3. dónde se decide el acceso;
4. dónde quedan los datos y por qué no se pisan;
5. una cosa que BE todavía no demostró.

Escuchate y marcá qué faltó o qué dijiste de más. Después compará con el modelo de las respuestas.

**Comprobar (5 min).** Contestá en voz alta las preguntas «Para comprobar» de los conceptos 1 a 13 de la guía.

**Si te sobra tiempo.** Abrí `render.yaml` y encontrá los tres servicios que corren en Render y la base de test.

---

## Sesión 2 · Las reglas: sesión, permiso y dónde se hacen cumplir (25 minutos)

**Objetivo.** Distinguir autenticación de autorización, y decir en qué capa se frena cada error.

**Leer (10 min).** G10 a G12: las capas que revisan un pedido, el PDP y dónde vive cada regla. Después, C2 a C5: qué es
una base, cuántas tiene BE, Prisma y por qué hay tantas tablas.

**Actividad (10 min): ejercicio 3, «Permiso o sesión».** Para cada caso, decí qué responde la API (401, 403 o 404),
qué capa lo frena y si queda algo guardado:

1. El token de un profesional venció hace una hora y abre la ficha de una persona.
2. Un profesional con la sesión abierta pide la evaluación de una persona que le revocó la autorización ayer.
3. Un profesional con Nutrición suspendida abre sus plantillas de Nutrición.
4. Un profesional cambia a mano el identificador de la URL por el de una persona con la que no tiene vínculo.
5. Una persona cerró sesión en otro teléfono con «cerrar todas las sesiones», y la APK vieja intenta registrar una comida.
6. Administración suspende Entrenamiento de un profesional; el profesional abre Nutrición de una persona vinculada en
   Nutrición.

**Leer código (3 min).** Abrí `packages/domain/src/autorizacion.ts`, buscá `evaluarAutorizacion` y encontrá las siete
dimensiones. ¿Cuál mira la suspensión?

**Comprobar (2 min).** Preguntas de los conceptos 14 a 19 de la guía y 1 a 7 del cuaderno.

---

## Sesión 3 · Seguir un dato de punta a punta (30 minutos)

**Objetivo.** Contar qué pasa entre que una persona toca «Registrar comida» y el profesional ve el número en
«Analizar», y por qué un catálogo corregido no cambia lo de ayer.

**Leer (12 min).** G13 a G18: los dos recorridos. Después, en el cuaderno, C7 y C8 (Vínculos y Nutrición) y C13 (cuándo
una relación necesita su propia tabla).

**Actividad 1 (10 min): ejercicio 2, «Seguir un dato».** Con G13, G15 y C8 al lado, escribí en una hoja, en orden, por
qué pantalla, operación, regla, tabla y respuesta pasa una comida registrada hasta aparecer en «Analizar». Para cada
tabla, decí si la fila se escribe, se lee o se calcula, y en qué paso.

**Actividad 2 (5 min): ejercicio 5, «El catálogo y el plan activado».** El 25/10 se corrige la composición del arroz en
el catálogo. Contestá:

1. ¿Qué pasa con el plan de Prueba Dos activado el 20/10, y con sus comidas del 22/10?
2. ¿Y con una versión sucesora activada el 26/10?
3. ¿Por qué esto es lo correcto, y no un error?
4. ¿Qué mecanismo de la base lo garantiza, aunque alguien se equivoque en el código?

**Comprobar (3 min).** Preguntas de los conceptos 20 a 25 de la guía y 8 y 9 del cuaderno.

---

## Sesión 4 · Cambios, transacciones y consultas (30 minutos)

**Objetivo.** Explicar qué garantiza una transacción, qué pasa cuando dos pedidos chocan y cómo llega un cambio a test.
Leer una consulta SQL sin ayuda.

**Leer (12 min).** G19 a G23: migraciones, las dos clases de versión, de la rama a test y los tipos de prueba. Después,
C14 a C18: integridad, transacciones y bloqueos, índices e historia, y las consultas.

**Actividad 1 (8 min): ejercicio 4, «La transacción fallida».** Una persona registra un almuerzo. La API ya insertó la
fila en `ingesta_nutricional` y su evento, y en ese momento comprueba que la opción elegida no es del plan.

1. ¿Qué queda guardado en cada una de las seis tablas del recorrido?
2. ¿Qué recibe la APK?
3. Si la APK reintenta con la misma clave, ¿qué pasa?
4. ¿Qué cambiaría si la auditoría se guardara en otra transacción, antes de la comida?

Después, con D-06 (C15) al lado: si Administración suspende Nutrición justo mientras ese pedido está en curso, ¿cuál
termina primero y qué ve el pedido siguiente?

**Actividad 2 (6 min): leer SQL.** Con las filas inventadas de D-05 (C17), escribí el resultado de la consulta 1 sin la
condición de fechas. Después, el de la consulta 4 para esas cuatro comidas. ¿Qué día falta, y qué significa que falte?

**Comprobar (4 min).** Preguntas de los conceptos 26 a 35 de la guía y 10 a 19 del cuaderno.

**Cierre: la defensa (si te sobra tiempo).** Contestá en voz alta, en un minuto cada una, tres preguntas de profesor:

- «¿Cómo sé que un profesional no puede ver datos de alguien que no lo autorizó?»
- «¿Qué pasa si se cae la conexión en el medio de un registro?»
- «¿Qué está probado y qué no?»

---

## Para después

- Repetí el ejercicio 1 al final de la cuarta sesión y compará las dos grabaciones.
- Elegí un PR integrado reciente (por ejemplo, el #216) y ubicalo en G15: ¿en qué estado está cada parte?
- Cuando hagas la prueba breve con profesionales, mirá qué conceptos de la guía aparecen en lo que preguntan.
