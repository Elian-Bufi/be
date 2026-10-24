# Las decisiones de este encargo, explicadas · 2026-10-23

Cada decisión dice cinco cosas:
- el **problema** que vería alguien usando BE;
- el **concepto** técnico, con su nombre y su traducción;
- la **solución** elegida y la **alternativa** que se descartó;
- la **prueba** que permite confiar en ella;
- el **límite** que todavía queda.

---

## 1. Las comidas esperadas salen del mismo cálculo que la pestaña Registros

- **Problema.** Registros decía «3 de 4 comidas registradas · 1 sin registro». Ese mismo día, Analizar y el Resumen decían «sin faltantes»: dos pantallas contaban distinto el mismo día.
- **Concepto: una sola fuente de verdad** (*single source of truth*). Una regla de negocio se escribe una vez y todos la usan. En criollo: si dos pantallas cuentan lo mismo, que usen la misma cuenta, así no se contradicen.
- **Solución.** Analizar llama a `construirContraste`, la función que ya usaba API-NUT-17 para Registros, con las mismas versiones del plan (DL-153).
- **Alternativa descartada:** escribir una cuenta nueva de «comidas esperadas» para Analizar. Era más rápido, pero tarde o temprano iba a divergir.
- **Prueba.** `completitud-nutricional.test.ts`, caso «Analizar y Registros cuentan igual el mismo día». En la integración, el caso nuevo compara la proyección con API-NUT-17 sobre la base real.
- **Límite.** Si mañana cambia la regla de Registros, Analizar cambia con ella. Es lo buscado, pero hay que saberlo.

## 2. Cambia la clasificación del día, no la media

- **Problema.** «1.854 kcal por día» al lado de un objetivo de 2.350 se leía como «come menos», cuando lo que se sabe es «registró menos».
- **Concepto: subtotal frente a total, y sesgo de subregistro.** Sumar lo que se anotó da un piso, no la ingesta. En criollo: si falta anotar la cena, el número del día está incompleto, y hay que decirlo.
- **Solución.** El día con una comida del plan sin registro pasa a «subtotal», y se dice qué comida falta. La media y su denominador son los de siempre: antes y después, 1.975 kcal de 2 días en el caso de prueba. Lo que se ve dice cuántos subtotales hay y cuántas comidas faltan.
- **Alternativas, que quedan para que decidas (D-1 de DL-153):**
  - sacar los subtotales de la media;
  - mostrar las dos medias.

  Con pocos días completos, la media sin subtotales tiene menos días detrás, y los días que alguien anota completos pueden no ser los típicos. Conviene decidirlo con la prueba con profesionales (tarea T4).
- **Prueba.** Hay una mutación: con la regla nueva quitada del cálculo, fallan 7 de las 16 pruebas. También fijan que la media no cambia.
- **Límite.** Una comida anotada no prueba que se comió eso ni en esa cantidad. BE no afirma adherencia.

## 3. Cuando no se puede saber, se dice «sin determinar»

- **Problema.** En un plan con dos días tipo, si ese día solo hay una comida diferente, no se sabe qué comidas se esperaban.
- **Concepto: imputación de datos faltantes**, lo que BE decide no hacer. Imputar es completar un dato que falta con uno supuesto. En criollo: no adivinar.
- **Solución.** El día dice «sin determinar» y por qué: sin plan vigente, o sin un registro del plan que diga el día tipo. No se cuentan comidas faltantes.
- **Alternativa descartada:** suponer el primer día tipo del plan. El número parecería más completo, pero sería un invento.
- **Prueba.** `completitud-nutricional.test.ts`, los casos «sin plan vigente» y «dos días tipo».
- **Límite.** Una comida diferente guarda el día tipo en el que se registró (DL-121), y no se usa para decidir. Es la D-3 de DL-153: más días conocidos, a cambio de cambiar el contraste en las dos pantallas.

## 4. La evidencia se lee por una operación nueva, no agregándole campos a la revisión

- **Problema.** La revisión ya llega con `evidenceReferences`. Parecía cuestión de dibujarla, pero hacía falta más: qué es cada registro, cuándo ocurrió y si cambió después.
- **Concepto: compatibilidad hacia atrás de un contrato estricto.** Las APK validan cada respuesta con esquemas estrictos (`z.strictObject`), y la candidata lee la forma de la revisión (REV-A). En criollo: si le agregás un campo a una respuesta que una APK vieja revisa con lupa, la APK la rechaza.
- **Solución.** Dos operaciones nuevas, solo del website: API-NUT-19-EVIDENCIA y API-TRN-23-EVIDENCIA. La forma de la revisión no cambia. Es el patrón del proyecto: lo nuevo va en operaciones nuevas.
- **Alternativa descartada:** resolver la evidencia en el website con la línea de tiempo del período. No trae una versión del plan activada antes del período, que es el caso más común.
- **Prueba.**
  - La integración de #204 (`f64083b`) lee con lo que congeló #198 las respuestas de la API combinada: las de las 44 operaciones que llama la 0.13.2 y las de las 80 que llama la candidata.3, todas válidas.
  - La prueba del contrato ejercita las dos operaciones nuevas.
- **Límite.** Cada operación nueva es superficie para mantener. Por eso están declaradas en el OpenAPI y en la guardia de trazabilidad.

## 5. Una referencia vieja no es un permiso

- **Problema.** Una revisión del mes pasado guarda los identificadores de ocho comidas. ¿El profesional puede verlas si hoy la persona le retiró el consentimiento?
- **Concepto: autorización en cada lectura.** Un punto de decisión (el PDP de BE) decide en cada pedido, con el estado de hoy. En criollo: guardar el número de un registro no da derecho a verlo mañana.
- **Solución.** La lectura de la evidencia decide como API-NUT-19. Sin acceso, el mismo 404 que lo inexistente, sin ningún detalle. «Abrir» vuelve a pedir el registro por su propia operación.
- **Alternativa descartada:** mostrar lo que se guardó al revisar. Sería una copia de datos de salud fuera del permiso.
- **Prueba.** `evidencia-de-revision.int-spec.ts`: con el consentimiento revocado, otro profesional o una revisión inexistente, el mismo 404.
- **Límite.** Sin permiso, el profesional tampoco ve su propia revisión: es lo que dice el 08 y lo que ya hacía API-NUT-19.

## 6. Lo que cambió después se avisa; no se reconstruye el pasado

- **Problema.** La persona deshizo una comida dos días después de la revisión. Al abrirla hoy, se ve anulada: ¿la revisión se basó en una comida anulada?
- **Concepto: historia de solo agregar** (*append-only*) **y lectura en un momento dado.** BE no borra: una rectificación o una anulación es un hecho nuevo, con su instante. En criollo: se puede saber qué pasó y cuándo, y comparar con cuándo se revisó.
- **Solución.** Cada elemento dice lo que cambió después de registrada la revisión, con su instante («Se deshizo después de esta revisión (24 oct 2026, 03:19): quedó fuera de los totales»). Lo que se abre es el estado de hoy, y se avisa.
- **Alternativa:** reconstruir el registro tal como estaba al revisar. Se puede, porque la cadena se conserva, pero es otra lectura: queda como D-2 de DL-154, si la prueba con profesionales la pide.
- **Prueba.** `evidencia-de-revision.int-spec.ts` y el recorrido `evidencia`: rectificación, anulación y versión sucesora posteriores, todas con instante posterior al de la revisión.
- **Límite.** No se muestran las cantidades de cuando se revisó.

## 7. La sustitución dice su alcance antes de confirmar

- **Problema.** Al sustituir un ejercicio con dos series ya registradas, las dos pasan a contar como el ejercicio nuevo, y también las que vengan. Sin decirlo, parece que cambia una serie sola.
- **Concepto: el alcance de una acción, dicho antes de hacerla.** El contrato admite un ejercicio realizado por ejercicio, no por serie. En criollo: si el botón cambia más de lo que parece, que lo diga antes.
- **Solución.**
  - La ayuda del diálogo dice «vale para todas las series de este ejercicio en esta sesión: no se puede cambiar una serie sola».
  - Con series registradas, la confirmación suma «y las que registres después también».
  - No se convirtió en una sustitución por serie: eso cambiaría el contrato y las APK instaladas.
- **Prueba.** `sustitucion-de-ejercicio.test.mjs`, el caso del alcance, que también fija que ninguna serie viaja con su propio ejercicio.
- **Límite.** Falta verlo en el teléfono: el diálogo con el teclado, TalkBack y sin conexión.

## 8. Los PR se pusieron al día con un merge, no con un rebase

- **Problema.** #195 y #198 chocaban con `main`.
- **Concepto: no reescribir historia compartida.** Un rebase cambia los commits que otros ya vieron; un merge suma uno. En criollo: se agrega, no se reescribe.
- **Solución.** Un merge de `main` en cada rama. Los conflictos eran de orden: las filas DL de `DEUDA_LEGAJO.md` y la lista de pruebas de `package.json`. Se resolvieron con un script que pone primero lo que ya estaba.
- **Alternativa descartada:** el rebase con `--force-with-lease`, que reescribe ramas de PR publicadas.
- **Prueba.** La CI de cada rama sobre la base nueva, y la de #204 con todo junto.
- **Límite.** La historia queda con commits de merge.

## 9. Seguridad: se corrige lo que tiene corrección, y la excepción se propone

- **Problema.** Desde el 20/10 la auditoría de dependencias falla en toda rama, también en `main`, y frena cualquier integración y despliegue.
- **Concepto: riesgo aceptado con vencimiento.** Cuando un aviso no tiene corrección, se puede exceptuar, por escrito, con motivo y fecha. En criollo: un «por ahora sí» con fecha de vencimiento y alguien que lo firma.
- **Solución.**
  - #201 actualiza Next, zod, multer y body-parser.
  - El zod 3 de la CLI de Expo no tiene corrección. DL-114 dice que Dirección no autoriza ampliar las excepciones, así que va como propuesta aparte (#202): acotada a la APK y con el mismo vencimiento.
- **Alternativa descartada:** agregar la excepción en #201. Habría sido decidir por vos.
- **Prueba.**
  - Con #201 (`1d7bb08`), la CI pasa todo menos la auditoría de la APK.
  - Con #202 (`916cb05`), la auditoría aprueba en los tres espacios. Se comprobó en local, porque la CI no corre en una rama apilada sobre otra.
  - La prueba nueva fija que la excepción acotada no vale en la API ni en el website.
- **Límite.** Las excepciones vigentes vencen el 31/10, igual que la propuesta. Antes hay que revisar node-forge, que sigue sin corrección.
- **Para medir la urgencia: un aviso presente no siempre es alcanzable.** *Alcanzable* quiere decir que el código vulnerable corre en BE. En criollo: tener la pieza fallada no es lo mismo que usarla.
  - El aviso crítico de Next es de la optimización de imágenes. El website se publica como export estático, sin esa optimización (`output: 'export'` e `images.unoptimized`), así que en `test` no se puede explotar.
  - multer llega a la API dentro de `@nestjs/platform-express`, y la API no tiene rutas multipart.
  - body-parser y el zod de `@be/domain` sí corren en cada pedido a la API.
  - El zod 3 de la CLI de Expo se usa al construir y no viaja en la APK.

  Lo urgente es destrabar la CI. La corrección vale igual, porque la auditoría no distingue lo alcanzable.

## 10. Probar la combinación sin integrarla

- **Problema.** Cada PR pasa solo, pero ¿pasan juntos? DL-153 cambia una respuesta y DL-154 suma operaciones, y #198 mira justamente eso.
- **Concepto: rama de integración de prueba.** Se juntan los cambios en una rama propia, solo para correr la CI. En criollo: un ensayo general, no el estreno.
- **Solución.** `wp-integracion-2026-10-23` (#204, «no integrar»). Cada cambio se integra después por su PR, en el orden de `LEEME.md`.
- **Alternativa descartada:** integrar uno por uno en `main` para ver qué pasa. Eso despliega en `test` y no está autorizado.
- **Prueba.** La CI de #204 en `f64083b` (corrida 40058651719):
  - integración, 851/851, con las lecturas congeladas de las dos APK;
  - recorridos, 14/14;
  - imagen y legajo, en verde;
  - `verificar`, en verde salvo la auditoría de la APK, la que resuelve #202.
- **Límite.** Si se integran en otro orden o con otros cambios en el medio, hay que repetir la prueba.
