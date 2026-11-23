# 11 · Casos de prueba

*Cómo se prueba BE, los casos de prueba diseñados con la prueba automática que los ejercita y su resultado, y los cinco recorridos que demuestran sus reglas centrales.*

> Una regla de BE vale porque una prueba la ejercita en cada cambio, contra la base de datos real.

**Autor:** Elián Bufi  
**Carrera:** Analista de Sistemas, Escuela Da Vinci  
**Fecha:** Noviembre de 2026

> **Resumen.** BE se prueba solo en cada cambio, en cinco trabajos de integración continua. En la última corrida de la rama principal corrieron y pasaron 4.881 casos automáticos, contra un PostgreSQL real y en un navegador. Cada caso de prueba de este documento dice qué requisito cubre, cómo se ejecuta, qué se espera y qué dio.

**Entregable:** 11 · Casos de prueba  
**Fecha:** Noviembre de 2026  
**Lo acompaña:** Los casos de uso de cada caso, en el 10. Los recorridos para hacer a mano, en «Cómo probar BE».

# Resumen

*Qué se prueba de BE, cómo y con qué resultado.*

Un caso de prueba dice qué hay que comprobar de BE, con qué datos, en qué pasos y qué resultado se espera. Este documento reúne los casos de prueba del sistema, cada uno apoyado en sus casos de uso (entregable 10) y en sus requisitos (entregables 12 y 13), y para cada uno nombra **la prueba automática que lo ejercita** y **el resultado que dio**.

BE se prueba solo. Cada cambio pasa por cinco trabajos de integración continua: los tipos y las pruebas unitarias, la integración contra un PostgreSQL 16 real, los recorridos en un navegador, la imagen de la API arrancada con sus migraciones y la integridad de la especificación. Cuatro de ellos son obligatorios: si uno falla, el cambio no entra a la rama principal.

- **4.881** casos automáticos: corrieron y pasaron
- **414** archivos de prueba: en siete capas
- **30** recorridos: en el navegador
- **0** fallas: en los cinco trabajos

*Fuente: Corrida 45207298181 de la CI de la rama principal, 23 de noviembre de 2026.*

Las reglas que más importan no se prueban mirando la pantalla, sino **contra la base de datos**, aunque alguien llame a la API directo: que un permiso retirado deja de valer en ese momento, que la versión activada de un plan no cambia, que un envío repetido no duplica nada y que un guardado que falla no deja cambios a medias. Para eso hay cinco recorridos de la defensa («Cinco recorridos para la defensa»), cada uno con la prueba real que lo demuestra.

> **La idea clave.** Cada resultado de este documento tiene su fuente: el número de la corrida de la CI en que pasó o, para lo que se comprueba en el teléfono, el acta de la prueba manual («El acta de la prueba en el teléfono»).

# 1. Cómo se prueba BE

*Cinco trabajos en cada cambio, de la regla pura al navegador. Cuatro bloquean la entrada a la rama principal.*

> **La idea clave.** Un cambio que rompe una regla no llega a la rama principal: la CI lo frena antes, y el despliegue solo sale con todo en verde.

## 1.1 Los cinco trabajos de la CI

Cada cambio se trabaja en una rama y entra por un pull request. GitHub Actions corre cinco trabajos en paralelo, en cada envío y en cada pull request. La rama principal exige cuatro de ellos en verde para aceptar un cambio; el de los recorridos corre siempre y se mira antes de integrar. Render despliega el website y la API recién cuando la rama principal pasa sus controles.

**Tabla 1.** Los cinco trabajos de la CI y lo que corre cada uno. Fuente: .github/workflows/ci.yml y la protección de la rama principal.

| Trabajo | Qué corre | Para integrar |
| --- | --- | --- |
| **Legajo** | Comprueba que cada documento de la especificación coincide con su huella SHA-256 registrada: la especificación no cambia sin dejar rastro. | Obligatorio |
| **Verificar** | Los tipos de las cuatro partes (dominio, API, website y app); que la especificación OpenAPI y la semilla de los formularios no se desvíen de su fuente; las pruebas unitarias del dominio, de la API, del website, de la app y del repositorio; la compilación de la API y del website, y la auditoría de dependencias, que falla con una vulnerabilidad alta o crítica. | Obligatorio |
| **Integración** | Las pruebas contra un PostgreSQL 16 real, levantado para la corrida, con las migraciones aplicadas igual que en el despliegue. Deja los resultados por prueba como evidencia de la corrida. | Obligatorio |
| **Imagen** | Construye la imagen de la API, la arranca contra un PostgreSQL 16 vacío y exige que aplique sus migraciones, que responda «listo» con la huella del código que se construyó y que una cuenta nueva se registre, entre, se vea a sí misma y salga. Comprueba también que el registro de la API no contiene la contraseña, el correo ni el nombre. | Obligatorio |
| **Recorridos** | Chrome contra el website y la API, compilados y servidos con la misma política de contenido del despliegue, sobre un PostgreSQL propio. Cada recorrido tiene sus propias cuentas sintéticas. | Corre en cada cambio |

## 1.2 Las siete capas y sus cifras

Las pruebas se ordenan de la regla pura, sin servidor, al navegador. Cada capa prueba algo que la anterior no alcanza.

**Tabla 2.** Las capas de prueba, con los archivos de prueba de cada una y los casos que corrieron y pasaron en la corrida 45207298181 (23 de noviembre de 2026).

| Capa | Qué cubre | Archivos | Casos |
| --- | --- | --- | --- |
| Dominio | Las reglas puras y los contratos que comparten la app, el website y la API: qué se puede activar, qué es «sin dato», cómo se calcula cada resultado, qué se ofrece para compartir, las palabras que nunca se muestran. | 114 | 1.364 |
| API | La lógica de cada servicio, sin base de datos ni red. | 30 | 276 |
| Website | Lo que arma cada pantalla del profesional y de Administración: los editores, los gráficos, la historia anterior, los textos. | 78 | 874 |
| App | Lo que arma cada pantalla de la persona: compartir, la historia anterior, las novedades, «La vez pasada». | 20 | 240 |
| Pantallas y repositorio | archivos sobre la lógica de la app (la sesión guiada, el registro de comidas, la navegación), sobre la del website y sobre el repositorio: los catálogos y las recetas de ejemplo, el contraste de los colores, las dependencias, la trazabilidad de las operaciones y que no haya correos en el código. | 62 | 840 |
| Integración con PostgreSQL | El servidor y la base juntos: permisos, versiones, carreras, idempotencia, transacciones, auditoría y las reglas que la base sostiene sola. | 109 | 1.257 |
| Recorridos en el navegador | El trabajo diario del profesional y de Administración, de punta a punta. | 1 | 30 |
| **Total** |   | **414** | **4.881** |

Las cifras salen de dos lados que coinciden: los archivos se cuentan en el código de la rama principal, y los casos, en el registro de la corrida, donde cada capa informa cuántos corrieron, cuántos pasaron y cuántos fallaron. En la corrida 45207298181 fallaron cero.

## 1.3 Cómo están hechas las pruebas

- **1 · Datos sintéticos.** Cada prueba crea sus propias cuentas y datos. Ninguna persona es real, y ninguna prueba usa lo que dejó otra.

- **2 · La base real.** La integración corre contra PostgreSQL 16 con las mismas migraciones del despliegue, no contra una imitación.

- **3 · Carreras sin pausas.** El orden de una carrera lo ponen los bloqueos de la base: la prueba espera a que PostgreSQL informe quién está esperando, nunca un tiempo fijo.

- **4 · La mutación.** Muchas pruebas declaran en su nombre la mutación que las pone en rojo: el error del código que están ahí para atrapar.

- **5 · El resultado, no la forma.** Se mira lo que guardó la base, lo que respondió la API y lo que dice la pantalla; un título o una leyenda no alcanzan.

*Figura 1: Cinco reglas que siguen todas las pruebas de BE.*

# 2. Los casos de prueba

*Un caso por regla, módulo por módulo, en el orden de los casos de uso del entregable 10.*

## 2.1 Cómo se lee cada caso

Cada fila es un caso de prueba diseñado. **Caso** da su número, qué comprueba, el requisito (12 y 13) y el caso de uso (10). **Pasos y resultado esperado** dice qué se hace, con datos sintéticos, y qué tiene que pasar. **Prueba automática** nombra el archivo del repositorio y la prueba que lo ejercita, con su nombre tal como está en el código; cuando el nombre es largo, va el tramo que la identifica. **Resultado** dice qué dio.

**Tabla 3.** Lo que dice la columna «Resultado».

| Resultado | Qué significa |
| --- | --- |
| Pasa · 45207298181 | La prueba corrió y pasó en la corrida 45207298181 de la CI de la rama principal, del 23 de noviembre de 2026. Para la integración, el resultado de cada prueba queda en el archivo de resultados de esa corrida; para las demás capas, en su registro. |
| Prueba manual (acta) | Lo que solo se ve en un teléfono Android con la app instalada. Se ejecuta a mano con la app de la entrega y se asienta en el acta («El acta de la prueba en el teléfono»). La lógica de esa pantalla tiene, además, su prueba automática. |

Las rutas son las del repositorio: `test/integration/` es la integración con PostgreSQL; `packages/domain/src/`, el dominio; `apps/web/test/`, el website; `apps/mobile/src/`, la app; `scripts/`, las pantallas y el repositorio, y `test/navegador/recorridos.mjs`, los recorridos en el navegador.

## 2.2 Acceso y cuenta

**Tabla 4.** Los casos de acceso y cuenta.

| Caso | Pasos y resultado esperado | Prueba automática | Resultado |
| --- | --- | --- | --- |
| **CP-01** · Un correo, una sola cuenta<br>RF-001 · UC-P25 | **Pasos:** ocho altas a la vez con el mismo correo, cada una con su clave de envío; otra con el correo en mayúsculas y con espacios.<br>**Se espera:** una sola cuenta; la base rechaza por sí sola un segundo acceso con el mismo correo. | `test/integration/registro.int-spec.ts` · «TEST-RF-001: 8 registros concurrentes con el mismo correo (keys distintas) crean exactamente 1 identidad» · «TEST-RF-001: mayúsculas y espacios no evaden la unicidad» | Pasa · 45207298181 |
| **CP-02** · Registrarse no da permisos<br>RF-001, RF-020 · UC-P25 | **Pasos:** crear una cuenta nueva y consultar su consentimiento de salud; mandar ese consentimiento dentro del alta.<br>**Se espera:** la cuenta queda con sus aceptaciones del alta y sin ningún permiso sobre datos de salud; el campo de más se rechaza sin crear nada. | `test/integration/registro.int-spec.ts` · «TEST-AUTH-002 — el registro no concede A3» | Pasa · 45207298181 |
| **CP-03** · Un acceso fallido no dice qué falló<br>RF-002 · UC-P26 | **Pasos:** entrar con un correo que no existe y con una contraseña equivocada.<br>**Se espera:** las dos respuestas son iguales en código, cuerpo, encabezados y tiempo, y no se crea ninguna sesión. | `test/integration/sesiones.int-spec.ts` · «TEST-AUTH-001: código, cuerpo y headers indistinguibles; sin details; ninguna sesión creada» · «TEST-AUTH-001: tiempo indistinguible» | Pasa · 45207298181 |
| **CP-04** · El profesional entra sin el código; Administración, no<br>RF-002 · UC-P26 | **Pasos:** un profesional entra con su contraseña y opera; Administración entra con su contraseña y, sin el código, intenta leer o decidir.<br>**Se espera:** el profesional opera con la contraseña, sin que se le pida ni se le ofrezca el autenticador; la contraseña sola de Administración no lee ni decide nada, y con el código sí. | `test/integration/segundo-factor-del-profesional.int-spec.ts` · «la contraseña sola no lee ni decide nada; con el código, sí; 15 minutos sin actividad lo vuelven a pedir» | Pasa · 45207298181 |
| **CP-05** · Recuperar el acceso sin revelar cuentas<br>RF-005 · UC-E09 | **Pasos:** pedir la recuperación para un correo registrado y para uno que no; usar un código que no vale y después el vigente.<br>**Se espera:** las dos respuestas son iguales; el código que no vale no cambia nada; el vigente cambia la contraseña y cierra todas las sesiones. | `test/integration/recuperacion-de-acceso.int-spec.ts` · «TEST-UF-007 · pedir la recuperación responde igual exista o no la cuenta» · «TEST-UF-008 · un código que no vale no cambia nada; el vigente cambia la contraseña y cierra todas las sesiones» | Pasa · 45207298181 |
| **CP-06** · Google, un método más<br>RF-001, RF-003 · UC-E05 | **Pasos:** crear la cuenta con Google; entrar con Google a una cuenta de contraseña del mismo correo; simular que Google no responde.<br>**Se espera:** un correo es de una sola cuenta, también entre métodos; si Google no responde, se informa y el acceso con contraseña sigue. | `test/integration/acceso-google.int-spec.ts` · «RF-001 e INV-06-21 — un correo es de una sola identidad, también entre métodos» · «UC-E05 E01 — Google no disponible: se informa y el acceso local sigue» | Pasa · 45207298181 |
| **CP-07** · Sumar y quitar métodos de acceso<br>RF-004 · UC-E06 | **Pasos:** vincular Google a una cuenta con contraseña, desvincularlo y volver a vincularlo; intentar quitar el único método de una cuenta creada con Google.<br>**Se espera:** la cuenta sigue siendo una; desvincular deja la contraseña y Google ya no entra; nunca queda sin un método, tampoco en la base. | `test/integration/incidencias-y-metodos-de-acceso.int-spec.ts` · «TEST-MET-007 · desvincular Google deja la contraseña» · «TEST-MET-008 · nunca sin un método» | Pasa · 45207298181 |
| **CP-08** · Cerrar la cuenta no borra en silencio<br>RF-069 · UC-P27 | **Pasos:** con sesiones abiertas en la app y en el website, y dos vínculos activos, cerrar la cuenta; volver a entrar.<br>**Se espera:** todas las sesiones dejan de servir en el pedido siguiente y no se abre una nueva; los vínculos se finalizan con su evento; la historia queda, y la base rechaza borrarla. | `test/integration/cierre.int-spec.ts` · «TEST-AUTH-011 — el cierre efectivo no permite una sesión nueva» · «TEST-AUTH-012 — el cierre invalida las sesiones actuales» · «TEST-AUTH-013 — sin borrado silencioso» | Pasa · 45207298181 |
| **CP-09** · Pedir los propios datos<br>RF-069 · UC-P27 | **Pasos:** la persona pide la exportación de sus datos y la baja por la ruta que recibe; después, con la ruta alterada o vencida.<br>**Se espera:** trae lo suyo y nada de terceros, por una ruta firmada y temporal; alterada o vencida, la misma respuesta que algo que no existe. | `test/integration/derechos-del-titular.int-spec.ts` · «TEST-UF-011 · la exportación propia, por una ruta firmada y temporal, sin datos de terceros» · «una ruta alterada o vencida es el mismo 404» | Pasa · 45207298181 |
| **CP-10** · Avisar un problema<br>RF-068 · UC-P28 | **Pasos:** la persona avisa un problema; Administración lo toma, lo resuelve con una respuesta y lo reabre.<br>**Se espera:** cada persona ve solo lo suyo; quien avisó ve el estado y la respuesta; la base no deja borrarlo ni cambiarle el estado sin su registro. | `test/integration/incidencias-y-metodos-de-acceso.int-spec.ts` · «TEST-INC-007 · la persona avisa un problema y ve lo suyo» · «TEST-INC-009 · la base: no se borra» | Pasa · 45207298181 |

## 2.3 Profesionales y Administración

**Tabla 5.** Los casos de los profesionales y de Administración.

| Caso | Pasos y resultado esperado | Prueba automática | Resultado |
| --- | --- | --- | --- |
| **CP-11** · Administración incorpora a un profesional<br>RF-008, RF-015 · UC-P01 | **Pasos:** Administración incorpora a un profesional, y él entra.<br>**Se espera:** entra con su contraseña, y la persona ve su nombre profesional. | `test/integration/incorporacion-de-profesionales.int-spec.ts` · «TEST-UF-009 · API-ADM-14: Administración incorpora a un profesional real» | Pasa · 45207298181 |
| **CP-12** · Verificar un área exige fundamento<br>RF-011, RF-012 · UC-P02 | **Pasos:** Administración verifica, rechaza o suspende un área de un profesional, con y sin fundamento; después lo rehabilita.<br>**Se espera:** cada decisión queda con autor, fecha y fundamento, y toca solo esa área; rehabilitar no concede una habilitación retirada. | `test/integration/administracion.int-spec.ts` · «Decisiones (criterios 4 y 7; TEST-RF-011, TEST-RF-012)» · «rehabilitar no concede una habilitación retirada: son dos decisiones»<br>`test/navegador/recorridos.mjs` · «administracion» | Pasa · 45207298181 |
| **CP-13** · Suspender un área deja de valer en el pedido siguiente<br>RF-014 · UC-P03 | **Pasos:** con la sesión del profesional abierta, Administración suspende su área de Nutrición.<br>**Se espera:** el pedido siguiente en Nutrición se niega y Entrenamiento sigue; el profesional y cada persona vinculada reciben un aviso, sin el fundamento. | `test/integration/administracion.int-spec.ts` · «suspender Nutrición corta esa área desde el pedido siguiente, con la sesión abierta, y no toca Entrenamiento» · «suspender avisa una vez al profesional y a cada persona vinculada» | Pasa · 45207298181 |
| **CP-14** · Cada actor por su canal<br>RF-007 · UC-I11 | **Pasos:** con la sesión de un profesional y con la de una persona, pedir operaciones de Administración; con la de Administración, pedir operaciones de personas, de profesionales y de salud.<br>**Se espera:** las primeras se niegan y no hay forma de asignarse el rol; la sesión administrativa no sirve para ninguna de las otras. | `test/integration/administracion.int-spec.ts` · «Permisos (criterios 2 y 3; TEST-AUTH-010)» · «la sesión administrativa no autentica en ninguna operación de personas ni de profesionales (ni de salud)» | Pasa · 45207298181 |
| **CP-15** · Verificado no es autorizado<br>RF-015 · UC-I10 | **Pasos:** un profesional verificado y habilitado en un área, sin vínculo con la persona, pide sus datos.<br>**Se espera:** no accede, y la auditoría registra que faltó el vínculo. | `test/integration/pdp.int-spec.ts` · «TEST-RF-015: una especialidad verificada y habilitada, sin vínculo, no accede; se atribuye VINCULO» | Pasa · 45207298181 |
| **CP-16** · Sin habilitación no se invita<br>RF-015, RF-018 · UC-P04, UC-I10 | **Pasos:** en el website, un profesional elige para invitar un área en la que no está habilitado; después, una en la que sí.<br>**Se espera:** el servidor rechaza la primera y el error queda junto al campo, que recibe el foco; con el área habilitada, la invitación se crea. | `test/navegador/recorridos.mjs` · «primeraInvitacion»<br>`test/integration/invitaciones.int-spec.ts` · «invita solo quien está verificado y habilitado en ese alcance» | Pasa · 45207298181 |
| **CP-82** · Administración suma al catálogo verificado<br>RF-072 · UC-P36 | **Pasos:** Administración revisa las cargas a mano agrupadas por nombre y suma una al catálogo verificado con su fuente, mientras otro administrador decide sobre la misma carga.<br>**Se espera:** queda una sola decisión, contra la versión que se vio y con su autor; el buscador de quien la cargó le sugiere el verificado. | `test/integration/alimentos-del-catalogo.int-spec.ts` | Pasa · 45207298181 |

## 2.4 Vínculo y permisos

**Tabla 6.** Los casos del vínculo y de los permisos.

| Caso | Pasos y resultado esperado | Prueba automática | Resultado |
| --- | --- | --- | --- |
| **CP-17** · Invitar con un enlace, un QR o un código<br>RF-018 · UC-P04, UC-P05 | **Pasos:** el profesional crea una invitación; la persona la usa; otra persona intenta usarla después; dos la usan a la vez.<br>**Se espera:** vence a los 7 días y es de un solo uso; de dos usos simultáneos gana uno, nunca con un error del servidor; el enlace del website y el de la app llevan a la misma invitación. | `test/integration/invitaciones.int-spec.ts` · «crea una invitación pendiente por 7 días» · «es de un solo uso» · «dos usos simultáneos: exactamente uno gana (201)»<br>`scripts/enlace-de-invitacion.test.mjs` · «el enlace del website (App Link) y el del esquema propio llevan a la misma invitación» | Pasa · 45207298181<br>El QR en el teléfono: Prueba manual (acta) |
| **CP-18** · Aceptar no da el permiso<br>RF-019, RF-020 · UC-P05 | **Pasos:** la persona acepta un vínculo, y el profesional pide sus datos antes de que ella autorice el área.<br>**Se espera:** aceptar crea el vínculo y deja los dos hechos en la misma transacción; sin la autorización, el profesional recibe la respuesta de algo que no existe. | `test/integration/vinculo.int-spec.ts` · «TEST-RF-019: aceptar crea el vínculo por alcance, no concede B2»<br>`test/integration/pdp.int-spec.ts` · «TEST-AUTH-006 — vínculo sin B2 no produce acceso» | Pasa · 45207298181 |
| **CP-19** · El permiso queda con su versión<br>RF-020 · UC-P07 | **Pasos:** la persona autoriza un área.<br>**Se espera:** queda una versión del consentimiento con su texto, su huella, el área, la finalidad, desde dónde se dio y quién lo dio. | `test/integration/consentimiento.int-spec.ts` · «TEST-RF-020: otorgar deja una versión con texto, hash, alcance, finalidad, superficie y actor» | Pasa · 45207298181 |
| **CP-20** · Una condición que falta niega el acceso<br>RF-021 · UC-I02 | **Pasos:** con el vínculo aceptado y los dos permisos, pedir Nutrición y Entrenamiento; quitar una condición por vez; mandar en el pedido campos que dicen quién es el profesional.<br>**Se espera:** ve solo el área autorizada; sin cualquiera de las condiciones, nada; lo que el cliente declara de sí mismo se rechaza. | `test/integration/pdp.int-spec.ts` · «TEST-RF-021 / TEST-UC-I02: con vínculo ACEPTADO, B2 vigente y A3 vigente, el profesional ve Nutrición y nada más» · «TEST-AUTH-003 (variante profesional) y TEST-AUTH-005 — B2 sin A3 no produce acceso» · «TEST-AUTH-009 — lo que el cliente declara no reemplaza al PDP (adversarial 4)» | Pasa · 45207298181 |
| **CP-21** · Retirar el permiso deja de valer desde ese momento<br>RF-022 · UC-P08 | **Pasos:** la persona tiene un profesional de Nutrición y otro de Entrenamiento, y retira el permiso de Entrenamiento; en el website, el de Entrenamiento tenía la ficha abierta.<br>**Se espera:** el de Entrenamiento deja de ver; el de Nutrición sigue; el retiro queda como versión y como hecho, y nada se borra. En el website, la ficha dice «Acceso no disponible». | `test/integration/consentimiento.int-spec.ts` · «TEST-RF-022: revocar B2-T1 no toca B2-N1»<br>`test/navegador/recorridos.mjs` · «accesoRevocado» | Pasa · 45207298181 |
| **CP-22** · Pausar y finalizar sin borrar<br>RF-024 · UC-P06 | **Pasos:** la persona pausa Entrenamiento con un profesional; después finaliza el vínculo; un participante intenta usar un motivo que no le corresponde.<br>**Se espera:** la pausa deja sin acceso ese alcance y no los demás; finalizado, no queda lectura; el vínculo y su historia se conservan; el motivo es obligatorio y de una lista cerrada. | `test/integration/pdp.int-spec.ts` · «TEST-AUTH-007 — PAUSADO corta ese alcance y no los demás» · «TEST-AUTH-008 — FINALIZADO no deja lectura residual»<br>`test/integration/vinculo.int-spec.ts` · «TEST-RF-024: el motivo es obligatorio y de lista cerrada» | Pasa · 45207298181 |
| **CP-23** · Lo que se ve coincide con el acceso real<br>RF-023 · UC-P07 | **Pasos:** el profesional y la persona consultan sus vínculos.<br>**Se espera:** el profesional ve solo los suyos; la persona ve quién tiene acceso y con qué alcance, igual que lo que decide la autorización. | `test/integration/vinculo.int-spec.ts` · «TEST-RF-023 — cada parte ve solo lo propio, coherente con la autorización efectiva» | Pasa · 45207298181 |
| **CP-24** · Un profesional nuevo no hereda el acceso<br>RF-025 · UC-P05, UC-I06 | **Pasos:** la persona finaliza con su nutricionista y se vincula con otra.<br>**Se espera:** la nueva accede solo por su propio vínculo y su propio permiso; nada pasa solo de una a la otra. | `test/integration/vinculo.int-spec.ts` · «TEST-RF-025 — un profesional nuevo no hereda acceso» | Pasa · 45207298181 |

## 2.5 Nutrición

**Tabla 7.** Los casos de Nutrición.

| Caso | Pasos y resultado esperado | Prueba automática | Resultado |
| --- | --- | --- | --- |
| **CP-25** · La evaluación queda en la historia<br>RF-026 · UC-P09 | **Pasos:** la nutricionista registra una evaluación con datos informados, observados y calculados.<br>**Se espera:** queda asociada a la persona y a quien tiene el vínculo, distingue la fuente de cada dato y se consulta en la historia; sobre una persona sin vínculo no crea nada. | `test/integration/nutricion.int-spec.ts` · «TEST-RF-026 · se asocia» | Pasa · 45207298181 |
| **CP-26** · Un plan incompleto no se activa<br>RF-030, RF-031 · UC-P10, UC-P11 | **Pasos:** guardar un borrador incompleto, validarlo e intentar activarlo.<br>**Se espera:** el borrador se guarda; validar dice cada problema con su ubicación; activar no pasa. | `test/integration/nutricion.int-spec.ts` · «un borrador incompleto se guarda; validar informa cada problema con su ruta; activar no pasa» | Pasa · 45207298181 |
| **CP-27** · La versión activada no cambia<br>RF-031 · UC-P11, UC-I04 | **Pasos:** activar un plan; intentar editarlo, validarlo o activarlo otra vez; cambiar después un alimento del catálogo.<br>**Se espera:** todo eso falla y el contenido no cambia; el catálogo no reescribe el plan activado; para cambiarlo, se crea una versión nueva. | `test/integration/nutricion.int-spec.ts` · «editar, validar o volver a activar una versión activada falla, y su contenido no cambia» · «una versión nueva de un alimento no toca la instantánea» | Pasa · 45207298181 |
| **CP-28** · La persona ve lo que rige<br>RF-032 · UC-P12 | **Pasos:** la nutricionista activa un plan con una receta como opción y después edita la receta; la persona abre lo de hoy.<br>**Se espera:** la receta editada después no cambia el plan activado, lo que la persona ve hoy ni lo que registró. | `test/integration/registro-de-comidas.int-spec.ts` · «la receta editada después del plan no cambia el plan activado» | Pasa · 45207298181 |
| **CP-29** · Registrar lo que comió, sin duplicar<br>RF-033 · UC-P12 | **Pasos:** «Comí esta opción» dos veces seguidas; deshacer; «Comí algo diferente» sin texto ni foto, y con foto.<br>**Se espera:** el doble envío no duplica; deshacer anula sin borrar; una comida diferente vacía no se registra; con foto, se registra sin inventar cantidades. | `test/integration/registro-de-comidas.int-spec.ts` · «sin confirmar: queda la opción, sin macros consumidos; un doble envío no duplica» · «deshacer anula sin borrar» · «la base sostiene la comida diferente: sin texto ni foto no se confirma» | Pasa · 45207298181<br>La foto en el teléfono: Prueba manual (acta) |
| **CP-30** · Cuándo pasó y cuándo se registró<br>RF-033, RF-054 · UC-P12, UC-P24 | **Pasos:** registrar hoy una comida de ayer y leer la línea de tiempo.<br>**Se espera:** cada entrada guarda por separado cuándo ocurrió y cuándo se registró, y la carga tardía se dice. | `test/integration/analisis.int-spec.ts` · «una entrada por hecho, con ocurrió y registrado independientes, y la carga tardía dicha»<br>`test/integration/registro.int-spec.ts` · «TEST-DOM-008: ocurrencia y registro se guardan por separado» | Pasa · 45207298181 |
| **CP-31** · «Sin dato» no es cero<br>RF-034 · UC-P13 | **Pasos:** la nutricionista analiza un período con un día sin registros y otro con una comida del plan sin registrar.<br>**Se espera:** el día sin registros es «sin dato», nunca cero; el día incompleto es un subtotal que dice qué comida falta, en el análisis y en el Resumen. | `test/integration/analisis.int-spec.ts` · «sin registros en el período: NO_DATA con su motivo, nunca una serie de ceros» · «una comida del plan sin registro hace del día un subtotal y dice cuál»<br>`test/navegador/recorridos.mjs` · «completitud» | Pasa · 45207298181 |
| **CP-32** · Una revisión válida<br>RF-056 · UC-P13, UC-I05 | **Pasos:** registrar una revisión sin fundamento o sin próxima acción; después, completa, marcando la evidencia que se miró.<br>**Se espera:** la incompleta se rechaza; la completa queda con su período, su autor y la evidencia marcada, que se vuelve a abrir. | `packages/domain/src/dominio-wp04.test.ts` · «TEST-NUT-006 · la revisión válida exige evidencia, interpretación, resultado, fundamento y próxima acción o cierre»<br>`test/navegador/recorridos.mjs` · «evidencia» | Pasa · 45207298181 |
| **CP-78** · La evaluación cita una respuesta con su versión<br>RF-026 · UC-P09 | **Pasos:** citar en la evaluación de Nutrición una respuesta de formulario y después rectificarla.<br>**Se espera:** la cita es una referencia, no una copia, y fija la versión vigente al citar. | `test/integration/contexto-de-la-persona.int-spec.ts` | Pasa · 45207298181 |
| **CP-79** · Corregir un alimento propio crea una versión<br>RF-027 · UC-P10 | **Pasos:** corregir un alimento cargado a mano que ya está en un plan activado y en una receta.<br>**Se espera:** el alimento tiene una versión nueva; el plan activado y la receta conservan la suya. | `test/integration/alimentos-del-catalogo.int-spec.ts` | Pasa · 45207298181 |
| **CP-80** · Retirar un alimento no rompe lo que lo cita<br>RF-027 · UC-P10 | **Pasos:** retirar un alimento propio y buscarlo; abrir un plan que lo usaba.<br>**Se espera:** sale del buscador; lo que lo citaba lo sigue mostrando, marcado. | `test/integration/alimentos-del-catalogo.int-spec.ts` | Pasa · 45207298181 |
| **CP-81** · Lo cargado a mano es propio<br>RF-021, RF-027 · UC-I02 | **Pasos:** otro profesional pide un alimento cargado a mano por un colega.<br>**Se espera:** recibe lo mismo que si no existiera. | `test/integration/alimentos-del-catalogo.int-spec.ts` | Pasa · 45207298181 |
| **CP-83** · La medida casera llega en gramos<br>RF-030, RF-032 · UC-P10, UC-P12 | **Pasos:** indicar una cantidad con una medida casera en el plan y leer el plan desde la app.<br>**Se espera:** el profesional elige la medida y la persona recibe los gramos. | `packages/domain/src/alimentos-del-catalogo.test.ts` · `apps/web/test/planificacion-de-nutricion.test.mjs` | Pasa · 45207298181 |
| **CP-85** · El objetivo avisa si sus gramos no suman sus kcal<br>RF-029 · UC-P09 | **Pasos:** escribir un objetivo cuyos gramos se alejan más del 5 % de las kcal indicadas.<br>**Se espera:** BE avisa y deja guardar igual: la decisión es del profesional. | `apps/web/test/planificacion-de-nutricion.test.mjs` | Pasa · 45207298181 |
| **CP-86** · El calculador da lo mismo que las fórmulas publicadas<br>RF-073 · UC-E10 | **Pasos:** calcular con Mifflin-St Jeor, Harris-Benedict revisada, FAO/OMS/UNU, Katch-McArdle y Cunningham, y con un dato de menos.<br>**Se espera:** cada resultado coincide con su fórmula publicada; si falta un dato, lo avisa y no calcula. | `packages/domain/src/calculador-de-macros.test.ts` | Pasa · 45207298181 |
| **CP-87** · Sin el permiso de Antropometría no hay toma<br>RF-021, RF-073 · UC-E10 | **Pasos:** pedir las tomas para el cálculo sin el permiso de Antropometría.<br>**Se espera:** no aparece ninguna toma, ni su existencia, y el intento queda registrado. | `test/integration/objetivo-y-calculador.int-spec.ts` | Pasa · 45207298181 |
| **CP-88** · Guardar el objetivo con su cálculo<br>RF-029, RF-073 · UC-E10 | **Pasos:** guardar un objetivo calculado; después llega una toma más nueva.<br>**Se espera:** el servidor rehace la cuenta y la guarda en una sola transacción; con la toma nueva, avisa y no recalcula solo. | `test/integration/objetivo-y-calculador.int-spec.ts` | Pasa · 45207298181 |
| **CP-89** · Proponer los rangos no pisa lo escrito<br>RF-030 · UC-P10 | **Pasos:** proponer los rangos de las comidas con un rango ya escrito a mano.<br>**Se espera:** completa lo que falta y no pisa el rango escrito sin la casilla. | `apps/web/test/objetivo-y-calculador.test.mjs` | Pasa · 45207298181 |
| **CP-93** · La evaluación inicial y sus «Anotaciones»<br>RF-026, RF-036, RNF-PRI-001 · UC-P09, UC-P14 | **Pasos:** registrar una evaluación con sus tres bloques y sus «Anotaciones»; leer después todo lo que la persona puede leer.<br>**Se espera:** la fecha es la de ahora y se puede cambiar; las «Anotaciones» no aparecen en ninguna lectura de la persona. | `test/integration/evaluacion-inicial.int-spec.ts` · `packages/domain/src/evaluacion-inicial.test.ts` | Pasa · 45207298181 |
| **CP-97** · El Recetario de BE<br>RF-027, RF-072 · UC-P10, UC-P36 | **Pasos:** copiar una receta del recetario a «Mis recetas»; proponer una receta propia con foto, con y sin la cesión; decidir dos veces la misma propuesta; escribir directo en las tablas del recetario.<br>**Se espera:** la copia reusa la imagen; sin la cesión no hay propuesta con foto; la decisión es una sola; la base no deja cambiar ni borrar lo que solo se agrega. | `test/integration/recetario-e-imagenes.int-spec.ts` · `packages/domain/src/recetario.test.ts` | Pasa · 45207298181 |
| **CP-98** · Las imágenes livianas<br>RF-027 · UC-P10 | **Pasos:** pedir la miniatura y la grande de la imagen de una receta; subir dos veces la misma foto; leer una imagen guardada antes.<br>**Se espera:** cada medida se arma una vez y se guarda; la misma foto del mismo profesional queda una sola vez; la imagen de antes se sigue viendo. | `apps/api/src/medios/procesamiento-de-imagen.spec.ts` · `test/integration/medios.int-spec.ts` | Pasa · 45207298181 |
| **CP-99** · El plan de Nutrición sin el asistente<br>RF-030 · UC-P10 | **Pasos:** empezar un plan de cada una de las cuatro formas y abrir la dirección vieja del asistente.<br>**Se espera:** cada forma llega al mismo editor; la dirección vieja abre la vista del plan. | `apps/web/test/planificacion-de-nutricion.test.mjs` · `apps/web/test/editores-cierre.test.mjs` | Pasa · 45207298181 |
| **CP-100** · Las franjas por comida y el reparto<br>RF-030 · UC-P10 | **Pasos:** tildar opciones de una comida, cambiar un alimento y repartir el día.<br>**Se espera:** la escala y el promedio se recalculan al cambiar una cantidad; cada opción tildada aparece en las cuatro franjas; las partes del día suman 100. | `apps/web/test/franjas-por-comida.test.mjs` · `packages/domain/src/rangos-de-nutricion.test.ts` | Pasa · 45207298181 |

## 2.6 Entrenamiento

**Tabla 8.** Los casos de Entrenamiento.

| Caso | Pasos y resultado esperado | Prueba automática | Resultado |
| --- | --- | --- | --- |
| **CP-33** · La evaluación conserva la fuente<br>RF-036 · UC-P14 | **Pasos:** el entrenador registra una evaluación y, más tarde, otra.<br>**Se espera:** cada dato conserva su fuente, y la posterior no sobrescribe la anterior. | `test/integration/entrenamiento.int-spec.ts` · «TEST-RF-036 · la evaluación conserva la fuente de cada dato, y una posterior no sobrescribe la anterior» | Pasa · 45207298181 |
| **CP-34** · Activar congela el plan<br>RF-041 · UC-P16, UC-I04 | **Pasos:** activar un plan de entrenamiento; intentar editarlo; cambiar el catálogo; crear la versión siguiente.<br>**Se espera:** la activación congela una instantánea; la activada no se edita y el catálogo no la altera; cambiarla exige una versión sucesora. | `test/integration/entrenamiento.int-spec.ts` · «TEST-RF-041 · activar abre un Proceso de ENTRENAMIENTO, congela la instantánea y deja la versión efectiva» · «un cambio posterior del catálogo no altera la instantánea activada»<br>`test/integration/maquinas-wp06.int-spec.ts` · «INV-06-109 · una versión ACTIVADA es inmutable: cambiarla exige una sucesora» | Pasa · 45207298181 |
| **CP-35** · La sesión de hoy, en su estado<br>RF-042 · UC-P17 | **Pasos:** mirar el entrenamiento de hoy sin plan, con la sesión sin empezar y con una sesión de un día pasado sin registrar.<br>**Se espera:** sin plan, no hay sesiones; hoy dice «No iniciada»; un día pasado, «Sin registro»; nunca «No realizada» si nadie lo registró. | `packages/domain/src/contratos-wp06.test.ts` · «TEST-TRN-004 · sin registro nunca se muestra»<br>`test/integration/entrenamiento.int-spec.ts` · «sin plan activado: NO_ACTIVE_PLAN, sin ocurrencias» | Pasa · 45207298181<br>En el teléfono: Prueba manual (acta) |
| **CP-36** · Serie por serie, sin duplicar<br>RF-043 · UC-P17 | **Pasos:** registrar las series de una sesión; repetir el envío de una serie; mandar otro contenido con el mismo identificador; tocar dos veces el botón de la serie.<br>**Se espera:** el reintento no suma; el mismo identificador con otro contenido es un conflicto; un hueco en la secuencia se rechaza; el doble toque es una sola serie y un solo pedido. | `test/integration/entrenamiento-por-serie.int-spec.ts` · «T05 y M04 · un reintento es DUPLICATE y no suma»<br>`scripts/sesion-enfocada.test.mjs` · «4 · un doble toque en» | Pasa · 45207298181<br>En el teléfono: Prueba manual (acta) |
| **CP-37** · Corregir sin borrar<br>RF-044 · UC-E02 | **Pasos:** el entrenador corrige la carga de una serie que registró la persona.<br>**Se espera:** el original queda y la corrección dice quién la hizo; el valor corregido deja de figurar como escrito por la persona, y lo que no cambió sigue como estaba. | `test/integration/entrenamiento.int-spec.ts` · «UC-E02 · corrección trazable (RF-044; API-TRN-19 y 20)»<br>`packages/domain/src/procedencia-por-campo.test.ts` · «TEST-EDP-060 · el profesional corrige la carga: ese valor no puede decir PERSON» | Pasa · 45207298181 |
| **CP-38** · Revisar y decidir cómo sigue<br>RF-045, RF-046 · UC-P18 | **Pasos:** el entrenador abre lo registrado del período, registra una revisión y la aplica dos veces a la vez.<br>**Se espera:** ve juntos objetivo, plan y lo registrado; los días sin registro son «sin dato»; abrirlo no crea una revisión; de las dos aplicaciones, una aplica y la otra se rechaza, nunca con un error del servidor. | `test/integration/entrenamiento.int-spec.ts` · «TEST-RF-045 · reúne objetivo, plan y ejecuciones registradas» · «dos aplicaciones simultáneas de la misma revisión: una aplica, la otra es REVIEW_ALREADY_APPLIED, nunca 500» | Pasa · 45207298181 |
| **CP-74** · El calentamiento se registra y no cuenta<br>RF-043, RF-045 · UC-P17 | **Pasos:** registrar una sesión con series de calentamiento y efectivas.<br>**Se espera:** el calentamiento queda registrado y no entra en la cuenta de series ni en el 1RM estimado. | `test/integration/series-de-calentamiento.int-spec.ts` · `packages/domain/src/tipos-de-serie.test.ts` | Pasa · 45207298181 |
| **CP-75** · El calentamiento va arriba<br>RF-040 · UC-P15 | **Pasos:** indicar una serie de calentamiento después de una efectiva.<br>**Se espera:** se rechaza, sin reordenar lo indicado. | `test/integration/series-de-calentamiento.int-spec.ts` | Pasa · 45207298181 |
| **CP-76** · Los bloques de la sesión<br>RF-039, RF-041 · UC-P16 | **Pasos:** activar un bloque «En vueltas» con un solo ejercicio; guardar un ejercicio fuera de su bloque.<br>**Se espera:** el bloque no se activa y el ejercicio fuera de su bloque no se guarda. | `test/integration/bloques-de-la-sesion.int-spec.ts` | Pasa · 45207298181 |
| **CP-84** · Una plantilla sin persona<br>RF-039 · UC-P37 | **Pasos:** crear una plantilla sin persona, revisarla y guardarla; editarla; pedir la de otro profesional; guardar dos veces a la vez.<br>**Se espera:** se guarda como versión; editarla no toca los planes ya creados; la ajena es inexistente; de dos guardados a la vez queda uno solo. | `test/integration/plantillas-independientes.int-spec.ts` | Pasa · 45207298181 |
| **CP-96** · El RPE<br>RF-040, RF-043, RF-045 · UC-P15, UC-P17 | **Pasos:** convertir de RIR a RPE y de vuelta, con «6 o menos»; estimar la fuerza con series de distintos RPE; registrar desde una app que solo conoce el RIR.<br>**Se espera:** la conversión va y vuelve igual; la estimación usa solo series de RPE 8 a 10; lo guardado es siempre el RIR. | `packages/domain/src/notacion-del-esfuerzo.test.ts` · `test/integration/rpe-y-maximo-estimado.int-spec.ts` · `apps/web/test/rpe-y-maximo-estimado.test.mjs` | Pasa · 45207298181 |

## 2.7 Antropometría

**Tabla 9.** Los casos de Antropometría.

| Caso | Pasos y resultado esperado | Prueba automática | Resultado |
| --- | --- | --- | --- |
| **CP-39** · Registrar una toma, con permiso<br>RF-047 · UC-P19 | **Pasos:** la profesional registra una toma; después, con su habilitación suspendida o el permiso retirado, lo intenta otra vez; intenta registrar una toma sin mediciones.<br>**Se espera:** las mediciones quedan como medidas y lo calculado aparte; sin habilitación o sin permiso no se registra nada; una toma vacía no se registra. | `test/integration/antropometria.int-spec.ts` · «TEST-RF-047 · M1 y M2 quedan directas y el derivado aparte» · «TEST-ANT-003 · una evaluación sin mediciones no se registra» | Pasa · 45207298181 |
| **CP-40** · Un cálculo se puede reproducir<br>RF-048 · UC-I09 | **Pasos:** calcular un resultado con un método; publicar una versión nueva del método; volver a leer la corrida.<br>**Se espera:** la corrida se reproduce con lo que guarda y dice qué método y qué profesional la hicieron; la versión nueva no la reescribe. | `test/integration/calculos.int-spec.ts` · «TEST-RF-048 · una corrida histórica se reproduce con lo que guarda» · «TEST-CAL-001 (parte 2): publicar una versión nueva no reescribe la corrida ya hecha» | Pasa · 45207298181 |
| **CP-41** · Corregir o anular conserva el original<br>RF-050 · UC-E03, UC-I12 | **Pasos:** corregir una medición, también dos veces a la vez; anularla; anularla dos veces a la vez.<br>**Se espera:** la corrección dice quién y cuándo, y dos simultáneas no pisan nada; anular conserva valor, autor y momento; de dos anulaciones queda una, sin error del servidor. | `test/integration/antropometria.int-spec.ts` · «TEST-RF-050 · la corrección dice quién y cuándo» · «TEST-DOM-003 · anular no elimina el original» · «TEST-ANT-006 · adversarial 6, a la vez» | Pasa · 45207298181 |
| **CP-42** · La evolución compara solo lo comparable<br>RF-049 · UC-P20 | **Pasos:** dos tomas de peso en kg, una en otra unidad y un día sin toma en el medio; pedir la evolución sin autorización.<br>**Se espera:** las dos en kg dan una diferencia descriptiva; la otra unidad no se compara; el día sin toma es «sin dato»; sin autorización, la respuesta de lo inexistente; nada califica a la persona. | `test/integration/evolucion-antropometrica.int-spec.ts` · «TEST-RF-049 · EA1 y EA2 dan una diferencia descriptiva de 0,5 kg»<br>`test/integration/antropometria.int-spec.ts` · «TEST-DOM-001 · con mediciones en t0 y t2 y ninguna en t1, el hueco del medio es SIN_DATO» | Pasa · 45207298181 |
| **CP-43** · El borrador no entra en la evolución<br>RF-047, RF-049 · UC-P19, UC-P20 | **Pasos:** con una toma registrada, empezar otra y dejarla en borrador.<br>**Se espera:** la última registrada sigue siendo la registrada, y el borrador no aparece en la evolución. | `test/integration/antropometria.int-spec.ts` · «TEST-DOM-004 · TEST-ANT-002 · con una registrada y un borrador posterior» | Pasa · 45207298181 |
| **CP-44** · Un cálculo adoptado no decide solo<br>RF-070 · UC-I13 | **Pasos:** la profesional adopta un resultado calculado, lo reemplaza y lo vuelve a adoptar.<br>**Se espera:** adoptar es una relación con la corrida, no un objetivo ni una indicación; queda la historia, y las corridas no se tocan. | `packages/domain/src/dominio-calculo.test.ts` · «TEST-CAL-007 · INV-06-05: el resultado de adoptar es una relación, no un objetivo ni una prescripción»<br>`test/integration/calculos.int-spec.ts` · «TEST-CAL-006: adoptar, reemplazar y volver a adoptar dejan historia y no tocan las corridas» | Pasa · 45207298181 |
| **CP-94** · Kerr (1988): las cinco masas<br>RF-048 · UC-P19 | **Pasos:** calcular las cinco masas de Kerr con los datos de la fuente.<br>**Se espera:** cada masa reproduce la fuente, y la suma se compara con el peso medido, en kg y en % del peso medido. | `packages/domain/src/kerr.test.ts` · `apps/web/test/antropometria-metodo-y-kerr.test.mjs` | Pasa · 45207298181 |
| **CP-95** · Elegir los métodos antes de medir<br>RF-047, RF-070 · UC-P19 | **Pasos:** elegir dos métodos que comparten mediciones; abrir una toma nueva de un profesional que ya midió.<br>**Se espera:** la toma pide la unión de lo que necesitan, más peso, talla y edad; vienen elegidos los de su última toma, y lo que ya tiene dato no se esconde. | `packages/domain/src/metodos-de-la-toma.test.ts` · `test/integration/catalogo-antropometrico.int-spec.ts` | Pasa · 45207298181 |

## 2.8 Seguimiento y análisis

**Tabla 10.** Los casos del seguimiento y del análisis.

| Caso | Pasos y resultado esperado | Prueba automática | Resultado |
| --- | --- | --- | --- |
| **CP-45** · La cartera, con lo que necesita atención<br>RF-052, RF-055 · UC-P23 | **Pasos:** personas con una revisión vencida, un plan en borrador, sin plan activo y una toma en preparación.<br>**Se espera:** cada una aparece por un hecho fechado, en orden de urgencia; lo ya registrado es actividad, no algo que atender. | `test/integration/cartera.int-spec.ts` · «nutrición: revisión vencida (desde la expectativa del Proceso), plan en borrador, y sin plan activo; orden por urgencia» · «antropometría: una evaluación en preparación es un pendiente» | Pasa · 45207298181 |
| **CP-46** · La línea de tiempo, en orden y con permiso<br>RF-054 · UC-P24 | **Pasos:** leer la línea de tiempo de una persona, por páginas y con filtros; con un área retirada.<br>**Se espera:** el orden es estable y las páginas no repiten ni pierden entradas; un área retirada no aporta entradas, conteos ni coincidencias de búsqueda. | `test/integration/analisis.int-spec.ts` · «el orden es estable: fecha del hecho descendente, y la paginación por cursor no repite ni pierde entradas» · «un alcance revocado no aporta entradas, conteos ni coincidencias de búsqueda» | Pasa · 45207298181 |
| **CP-47** · La nota de coordinación<br>RF-057 · UC-E07 | **Pasos:** un profesional deja una nota para otro que acompaña a la misma persona; después cambia quién la acompaña.<br>**Se espera:** la nota se escribe y se lee entre quienes corresponde, y queda claro quién la sigue leyendo. | `test/integration/notas-de-coordinacion.int-spec.ts` · «TEST-RF-057 · TEST-UC-E07 · escribir y leer una nota de coordinación» · «TEST-RF-057 · quién la sigue leyendo» | Pasa · 45207298181 |
| **CP-48** · La TVCC-30<br>RF-058 · UC-S01 | **Pasos:** calcular la tasa de ciclos de revisión cerrados a tiempo en 30 días con los hechos de la base; intentar guardar un resultado incoherente.<br>**Se espera:** se calcula con los hechos de la base; la base rechaza un numerador sin denominador, uno mayor que él o una tasa sin denominador. | `test/integration/tvcc30.int-spec.ts` · «TEST-RF-058 · UC-S01 · la TVCC-30 con los hechos de la base» · «la base rechaza un resultado incoherente» | Pasa · 45207298181 |
| **CP-77** · El contexto de la persona, con su permiso<br>RF-021, RF-071 · UC-P10 | **Pasos:** abrir el panel de contexto con permiso en unas áreas y sin permiso en otras.<br>**Se espera:** muestra solo las áreas con permiso; sin permiso, lo mismo que lo inexistente. | `test/integration/contexto-de-la-persona.int-spec.ts` | Pasa · 45207298181 |

## 2.9 Información, novedades y avisos

**Tabla 11.** Los casos de la información, las novedades y los avisos.

| Caso | Pasos y resultado esperado | Prueba automática | Resultado |
| --- | --- | --- | --- |
| **CP-49** · Pedir información sin ampliar permisos<br>RF-071 · UC-P32, UC-P33 | **Pasos:** la nutricionista pide un formulario de Entrenamiento; la persona responde un formulario confirmando lo que le proponía, con una corrección.<br>**Se espera:** la plantilla de otra área se rechaza entera y no escribe nada; confirmar es responder, y cada respuesta queda como declarada por la persona. | `test/integration/formularios-alcance.int-spec.ts` · «API-FRM-03 · plantilla y Alcance»<br>`test/integration/formularios-de-inicio.int-spec.ts` · «TEST-FRI-004 · confirmar es responder (D-4)»<br>`packages/domain/src/contratos-wp07.test.ts` · «TEST-FRM-003 · cada respuesta persistida es SELF_REPORTED» | Pasa · 45207298181 |
| **CP-50** · Las novedades<br>RF-061 · UC-P30 | **Pasos:** la nutricionista activa un plan y registra una revisión; repite la revisión con la misma clave.<br>**Se espera:** cada hecho deja su novedad, con el nombre del profesional y sin su contenido; abrirla la deja leída; el reintento no la duplica. | `test/integration/novedades.int-spec.ts` · «RF-061 · el centro de novedades» · «una revisión deja su novedad (sin su contenido) y reintentarla con la misma clave no la duplica» | Pasa · 45207298181 |
| **CP-51** · Avisos sin datos de salud<br>RF-062 · UC-E08 | **Pasos:** la persona activa los avisos en el teléfono; otra cuenta registra el mismo teléfono; la tarea diaria corre dos veces.<br>**Se espera:** el permiso se pide en ese momento; el teléfono es de una cuenta por vez; el recordatorio llega una vez y sin contenido. | `test/integration/novedades.int-spec.ts` · «RF-062 y DL-133 · los avisos y los recordatorios diarios» · «un teléfono es de una cuenta por vez»<br>`scripts/avisos-del-telefono.test.mjs` · «activar pide el permiso en ese momento» | Pasa · 45207298181<br>Que el aviso llegue: Prueba manual (acta) |
| **CP-52** · Si falla un proveedor, lo esencial sigue<br>RF-059, RF-060 · UC-I07, UC-I08 | **Pasos:** buscar un alimento con Open Food Facts sin responder; importar un alimento y un ejercicio de los catálogos públicos.<br>**Se espera:** sigue el catálogo propio; lo importado pasa por revisión y conserva su procedencia. | `test/integration/integraciones.int-spec.ts` · «TEST-RF-028 · Open Food Facts: importación controlada con procedencia y fallback» · «TEST-RF-038 · wger: importación controlada» | Pasa · 45207298181 |
| **CP-92** · Vincular formularios a la evaluación<br>RF-026, RF-036, RF-071 · UC-E11 | **Pasos:** vincular un formulario respondido a una evaluación, desvincularlo y pedir el de otra persona.<br>**Se espera:** el vínculo es una referencia, no una copia; desvincular deja la marca; lo ajeno responde el mismo 404 que lo inexistente. | `test/integration/evaluacion-y-formularios.int-spec.ts` | Pasa · 45207298181 |

## 2.10 La muestra de evaluación

La muestra con la que se prueba BE (una profesional, sus personas y más de un año de historia en las tres áreas) se arma con un generador propio, y también se prueba.

| Caso | Pasos y resultado esperado | Prueba automática | Resultado |
| --- | --- | --- | --- |
| **CP-91** · La muestra sale igual y es verosímil<br>— · — | **Pasos:** generar la muestra dos veces con la misma semilla y pasarla por el verificador de verosimilitud.<br>**Se espera:** las dos salen iguales y pasan el verificador. | `scripts/entorno-del-tutor.test.mjs` | Pasa · 45207298181 |

# 3. Cinco recorridos para la defensa

*Las cinco reglas que sostienen la historia de la persona, cada una con la prueba real que la demuestra.*

> **La idea clave.** Las cinco se prueban contra un PostgreSQL real y con pedidos directos a la API: lo que demuestran no depende de que la pantalla esconda nada.

Cada recorrido dice la regla, para qué existe, cómo la prueba el código y qué dio. Todas las pruebas que se nombran corrieron y pasaron en la corrida 45207298181 de la CI de la rama principal, del 23 de noviembre de 2026.

## 3.1 El permiso retirado

**La regla.** Cuando la persona deja de compartir algo, el profesional deja de verlo desde ese momento, en el pedido siguiente, y nada de lo anterior se borra.

**Para qué.** El consentimiento es de la persona, y retirarlo tiene que valer de verdad: si una lectura que estaba en curso pudiera terminar con un permiso que ya no existe, el retiro sería una promesa. Que lo anterior quede permite saber después quién vio qué y cuándo.

**Cómo funciona.** Antes de decidir un acceso, la API toma en modo compartido las filas que un retiro modificaría, y el retiro las toma en modo exclusivo: uno espera al otro. Por eso la decisión nunca usa un permiso que ya no está.

**Cómo se prueba.** La carrera se arma con la base, sin pausas: la prueba retiene el cerrojo de las lecturas, manda el retiro y lo suelta recién cuando PostgreSQL informa que el retiro quedó esperando ese cerrojo.

1. **Una lectura en curso**: La prueba abre una transacción y toma el cerrojo compartido que toman las lecturas de lo que se comparte.
2. **Llega el retiro**: La persona deja de compartir el resumen de un área con un profesional.
3. **La base lo informa**: La prueba espera a que PostgreSQL diga que el retiro está esperando ese cerrojo, y comprueba que todavía no terminó.
4. **Se suelta**: La prueba anota la hora de la base y suelta el cerrojo.
5. **Desde ese momento**: El retiro termina con una hora posterior a esa, y el profesional ya no recibe lo retirado.

*Figura 2: Cómo prueba TEST-CMP-027 que un retiro espera a la lectura en curso. Esquema.*

**Tabla 12.** Las pruebas del permiso retirado.

| Prueba | Qué demuestra |
| --- | --- |
| `test/integration/compartir.int-spec.ts` · «TEST-CMP-027 · retirar una cosa espera a la lectura en curso y lleva la hora de después: lo de otras áreas y los hábitos» | El retiro de una cosa compartida espera a la lectura en curso y queda con la hora de después; el profesional deja de recibirlo. Lo hace con el resumen de otra área y con los hábitos. |
| `test/integration/historia-anterior.int-spec.ts` · «TEST-HA-033 · las carreras, por la base» | Lo mismo con la historia anterior: un retiro queda antes o después de cada lectura, nunca en el medio, y autorizar espera a quien termina el vínculo. |
| `test/integration/concurrencia-wp03.int-spec.ts` · «T-PDP-4» | Ocho rondas de dieciséis lecturas, con el retiro del permiso en el medio: ninguna lectura permitida tiene una hora posterior al retiro, toda lectura que empieza después recibe la respuesta de lo inexistente, y la primera negación queda enlazada a la versión del retiro. |
| `test/integration/administracion.int-spec.ts` · «el cruce: una operación profesional en curso termina antes de la decisión; la siguiente ya no pasa» | Lo mismo cuando quien retira es Administración, al suspender un área. |
| `test/integration/concurrencia.int-spec.ts` · «TEST-AUTH-011 en carrera» | Un ingreso con la contraseña correcta que llega mientras se cierra la cuenta se rechaza, sin sesión activa y con el rechazo auditado. |
| `test/integration/consentimiento.int-spec.ts` · «TEST-RF-022: revocar B2-T1 no toca B2-N1» | Retirar un área no toca las otras, y el retiro queda como versión y como hecho. |
| `test/navegador/recorridos.mjs` · «accesoRevocado» | En el navegador, con la ficha abierta: la persona retira el permiso y, al actualizar, la ficha dice «Acceso no disponible» y no ofrece acciones; recargar recupera la sesión, no el permiso. |

## 3.2 La activación de un plan

**La regla.** Activar un plan crea una versión que no cambia más. En cada momento rige una sola versión, y para cambiar el plan se crea la siguiente.

**Para qué.** La historia de la persona se lee contra lo que estaba indicado cuando pasó: si el plan activado pudiera editarse, lo registrado quedaría comparado con algo que nunca se le indicó. Con versiones que no cambian, se puede ver cómo cada cambio del plan fue afectando a la persona.

1. **Borrador**: Se guarda aunque esté incompleto. Hay uno solo por plan.
2. **Validar**: Dice cada problema con su ubicación. Con problemas, no se activa.
3. **Activar**: Congela una instantánea. Es la versión que rige, y la persona ve esa.
4. **La siguiente**: Parte de la instantánea y se edita aparte. La persona sigue viendo la activada.
5. **Activar la siguiente**: La que rige pasa a la nueva. La anterior queda íntegra, con lo registrado contra ella.

*Figura 3: La vida de un plan, con lo que la base exige en cada paso. Esquema.*

**Tabla 13.** Las pruebas de la activación.

| Prueba | Qué demuestra |
| --- | --- |
| `test/integration/maquinas-wp04.int-spec.ts` · «reabrir, editar el contenido, cambiar el objetivo o borrar una versión activada se rechaza en la base» | La base misma rechaza tocar una versión activada, aunque alguien esquive la API. |
| `test/integration/maquinas-wp04.int-spec.ts` · «INV-06-110 · la versión efectiva solo avanza a la sucesora activada de la anterior» | La versión que rige solo puede pasar a la siguiente activada: nunca a un borrador ni a una versión que no la sucede. |
| `test/integration/maquinas-wp04.int-spec.ts` · «REG-06-12: un solo borrador por plan y una sola sucesora por versión» | No hay dos caminos para una misma versión. |
| `test/integration/nutricion.int-spec.ts` · «REG-06-12: diez borradores simultáneos del mismo plan dejan uno solo» | Diez pedidos a la vez dejan un solo borrador. |
| `test/integration/nutricion.int-spec.ts` · «editar, validar o volver a activar una versión activada falla, y su contenido no cambia» | Desde la API, una versión activada no se reabre. |
| `test/integration/maquinas-wp06.int-spec.ts` · «INV-06-109 · una versión ACTIVADA es inmutable: cambiarla exige una sucesora» | Lo mismo en Entrenamiento: una versión activada no vuelve a borrador ni se cambia. |
| `test/integration/comparacion-nutricional.int-spec.ts` · «lo indicado de ayer no cambia al activar otra versión» | Activar una versión nueva no cambia lo que estaba indicado los días anteriores: cada comida se compara con la versión que regía. |

## 3.3 El doble envío con la misma clave

**La regla.** Cada escritura lleva una clave. Si el mismo pedido llega dos veces con la misma clave, el efecto ocurre una vez y las dos respuestas son iguales; la misma clave con otro contenido se rechaza.

**Para qué.** En un teléfono la conexión se corta. La persona toca de nuevo, o la app reintenta sola, y no puede quedar una comida registrada dos veces ni un plan activado dos veces. El reintento, además, vuelve a pasar por la autorización: si en el medio se retiró el permiso, no se cuela.

**Tabla 14.** Las pruebas del doble envío.

| Prueba | Qué demuestra |
| --- | --- |
| `test/integration/registro.int-spec.ts` · «TEST-RNF-REC-002: misma key + mismo payload → mismo resultado sin duplicar efectos» | El mismo envío, dos veces: el mismo resultado y una sola cuenta. |
| `test/integration/registro.int-spec.ts` · «TEST-RNF-REC-002: requests concurrentes con la misma key → una identidad y respuestas idénticas» | Los dos envíos a la vez: una sola cuenta y respuestas idénticas. |
| `test/integration/registro.int-spec.ts` · «TEST-RNF-REC-002: misma key con otro payload → 409 IDEMPOTENCY_KEY_REUSED» | La misma clave con otro contenido se rechaza. |
| `test/integration/nutricion.int-spec.ts` · «activar y aplicar con la misma clave devuelven el mismo resultado sin repetir el efecto» | Activar un plan o aplicar una revisión dos veces deja un solo efecto. |
| `test/integration/entrenamiento.int-spec.ts` · «un reintento con la misma Idempotency-Key vuelve a pasar por el PDP» | Con el permiso retirado entre el envío y el reintento, el reintento recibe la respuesta de lo inexistente. |
| `scripts/registro-de-comidas.test.mjs` · «5 · reintento: después de una respuesta incierta, el mismo pedido sale con la misma clave y el mismo cuerpo» | La app reintenta con la misma clave y el mismo contenido cuando no supo si su pedido llegó. |
| `test/navegador/recorridos.mjs` · «respuestaPerdida» | En el navegador: se pierde la respuesta de un guardado que el servidor sí guardó; el editor relee, reconoce lo que mandó y termina guardado, sin un aviso de conflicto falso. |

## 3.4 El guardado sin cambios a medias

**La regla.** Una operación queda entera o no queda. Cuando una acción escribe varias cosas, se escriben todas en la misma transacción, con su auditoría; si una falla, no queda ninguna.

**Para qué.** El ejemplo es «Aceptar y compartir»: un solo toque autoriza los datos de salud, el área, lo de las otras áreas y la historia anterior. Si se pudiera quedar a medias, la persona creería haber compartido algo que no compartió, o al revés. Lo mismo vale para la auditoría: si no se puede registrar quién hizo qué, la operación no ocurre.

**Tabla 15.** Las pruebas del guardado sin cambios a medias.

| Prueba | Qué demuestra |
| --- | --- |
| `test/integration/compartir.int-spec.ts` · «TEST-CMP-021 · todo o nada: si el último acto falla en la base, no queda ninguno» | La prueba instala en la base una falla en el último acto del toque, la historia anterior. El toque responde con un error del servidor, nunca con un éxito, y no queda ni la autorización de salud, ni la del área, ni lo de las otras áreas, ni la auditoría. Sin la falla, el mismo toque escribe todo. |
| `test/integration/compartir.int-spec.ts` · «TEST-CMP-020 · al aceptar: la propuesta, y un toque que escribe todo lo elegido, con sus textos y su auditoría» | El toque completo: cada acto con su texto y su huella, una fila de auditoría por acto, y después no queda nada para dar. |
| `test/integration/registro.int-spec.ts` · «TEST-RNF-SEC-005: si la auditoría del alta falla, no queda identidad ni efecto alguno» | Sin auditoría no hay operación: un alta cuya auditoría falla no deja la cuenta. |
| `test/integration/vinculo.int-spec.ts` · «TEST-RF-019: aceptar crea el vínculo por alcance, no concede B2 y deja ambos hechos en la misma transacción» | Aceptar un vínculo escribe sus dos hechos juntos. |
| `test/integration/formularios-de-inicio.int-spec.ts` · «cerrar la cuenta retira las pendientes de la persona en la misma transacción» | El cierre de la cuenta arrastra, en la misma transacción, lo que la persona tenía por responder. |

## 3.5 El ciclo completo entre los actores

**La regla.** El circuito de BE funciona de punta a punta: Administración habilita al profesional, el profesional invita, la persona acepta y autoriza, el profesional evalúa y activa un plan, la persona registra, el profesional revisa y decide cómo sigue.

**Para qué.** Cada regla anterior se prueba sola; el ciclo comprueba que juntas forman el seguimiento en el tiempo que BE promete.

**Tabla 16.** Las pruebas del ciclo completo.

| Prueba | Qué demuestra |
| --- | --- |
| `test/integration/nutricion.int-spec.ts` · «E2E-04 · el circuito nutricional completo» | Evaluar, fijar el objetivo, planificar, activar, ver el plan en el día de la persona, registrar, revisar y aplicar la decisión, contra la API y la base. |
| `test/integration/entrenamiento.int-spec.ts` · «evaluar, fijar objetivo, planificar, activar, registrar desde la APK, corregir, revisar, aplicar y continuar» | El mismo ciclo en Entrenamiento, con el registro que hace la app y la corrección del profesional. |
| `test/integration/invitaciones.int-spec.ts` · «la cadena completa: usarla crea la solicitud del profesional para quien la usa» | De la invitación al vínculo aceptado, con el permiso del área y el profesional viendo el vínculo. |
| `test/navegador/recorridos.mjs` · «primerPlan», «borrador», «evidencia» y «administracion» | En el navegador: el primer plan desde la ficha nueva, el borrador que se guarda solo, la revisión con su evidencia y la consola de Administración que habilita y suspende. |
| `.github/workflows/ci.yml` · «Smoke e2e del artefacto» | La API construida arranca contra una base vacía, aplica sus migraciones, y una cuenta nueva se registra, entra, se ve a sí misma y sale. |
| «Cómo probar BE», el recorrido completo | Los ocho pasos con los tres roles, sobre la historia de Diego Sosa, en el teléfono y en el website: Prueba manual (acta). |

# 4. Compartir, la historia anterior y los gráficos

*Las funciones que unen las áreas y el tiempo: compartir entre profesionales, no empezar de cero con uno nuevo y comparar lo que pasó.*

> **La idea clave.** Compartir, la historia anterior y los gráficos se prueban igual que el resto: contra la base, con la respuesta de lo inexistente cuando falta el permiso y sin calificar nunca a la persona.

## 4.1 Compartir entre los profesionales

Cuando Diego Sosa acepta a la Prof. Lucía Benítez, una sola pantalla le muestra todo lo que tiene sentido compartir, ya marcado: sus datos de Antropometría para ella, el resumen y el plan de sus otras áreas, lo de Antropometría para sus otros profesionales y su historia anterior. «Aceptar y compartir» lo autoriza todo en un toque; «Elegir qué compartir» deja decidir cosa por cosa, y en «Quién ve qué» retira cada una cuando quiere.

**Tabla 17.** Los casos de compartir.

| Caso | Pasos y resultado esperado | Prueba automática | Resultado |
| --- | --- | --- | --- |
| **CP-53** · «Aceptar y compartir», en un toque<br>RF-020, RF-023 · UC-P05, UC-P07 | **Pasos:** la persona acepta a una profesional nueva y toca «Aceptar y compartir» con lo que viene marcado; repite el toque con la misma clave.<br>**Se espera:** quedan juntos el permiso de salud, el del área, lo de las otras áreas y la historia anterior, cada uno con su texto, su huella y su fila de auditoría; la misma clave responde lo mismo; después no queda nada para dar. | `test/integration/compartir.int-spec.ts` · «TEST-CMP-020 · al aceptar: la propuesta, y un toque que escribe todo lo elegido, con sus textos y su auditoría»<br>`packages/domain/src/compartir.test.ts` · «TEST-CMP-001 · al aceptar» | Pasa · 45207298181 |
| **CP-54** · Todo o nada<br>RF-020 · UC-P05 | **Pasos:** con una falla instalada en la base en el último acto del toque, la persona toca «Aceptar y compartir»; después, sin la falla, otra vez.<br>**Se espera:** el toque responde con un error del servidor y no queda ninguna autorización ni su auditoría; sin la falla, el mismo toque escribe todo. | `test/integration/compartir.int-spec.ts` · «TEST-CMP-021 · todo o nada: si el último acto falla en la base, no queda ninguno» | Pasa · 45207298181 |
| **CP-55** · Lo marcado es lo que corresponde<br>RF-020, RF-023 · UC-P07 | **Pasos:** la persona retira una cosa y vuelve a la pantalla; elige solo una parte de lo que se ofrece; destilda el permiso de salud.<br>**Se espera:** lo que retiró no vuelve marcado y lo nunca decidido, sí; se comparte solo lo elegido, sin extender en silencio lo que ya estaba; sin el permiso de salud, lo que depende de él no se puede elegir. | `packages/domain/src/compartir.test.ts` · «TEST-CMP-003 · lo que se retiró antes no vuelve marcado; lo nunca decidido, sí (CMP-D3)» · «TEST-CMP-008 · lo de otras áreas: solo lo elegido, sin extender en silencio lo que ya estaba (CMP-D7)» · «TEST-CMP-006 · sin el A3, lo que lo pide no se puede elegir» | Pasa · 45207298181 |
| **CP-56** · Retirar cada cosa, desde ese momento<br>RF-022 · UC-P08 | **Pasos:** en «Quién ve qué», la persona deja de compartir el resumen de un área con un profesional y, después, sus hábitos.<br>**Se espera:** cada retiro vale desde ese momento sin tocar lo demás, también sin el permiso de salud; repetido, da lo mismo. | `test/integration/compartir.int-spec.ts` · «TEST-CMP-022 · retirar cada cosa corta desde ese momento, sin tocar lo demás» · «TEST-CMP-023 · los hábitos: al que se elige; al que no se nombró, no; retirarlos corta» | Pasa · 45207298181 |
| **CP-57** · Lo ajeno responde igual que lo inexistente<br>RF-021 · UC-I02 | **Pasos:** la persona intenta compartir algo de otra cuenta, algo que no existe, o con un texto que ya cambió.<br>**Se espera:** lo ajeno y lo inexistente reciben la misma respuesta; sin el permiso de salud, «prohibido»; si algo cambió desde que lo vio, un conflicto, y no se escribe nada. | `test/integration/compartir.int-spec.ts` · «TEST-CMP-024 · lo ajeno responde igual que lo inexistente; sin el A3, 403; si algo cambió, 409» | Pasa · 45207298181 |
| **CP-58** · Compartir lo que pidió un profesional<br>RF-023 · UC-P07 | **Pasos:** el entrenador pide ver el plan de Nutrición; la persona lo comparte.<br>**Se espera:** compartirlo acepta su pedido. | `test/integration/compartir.int-spec.ts` · «TEST-CMP-025 · compartir el plan de un área con quien lo pidió acepta su pedido» | Pasa · 45207298181 |
| **CP-59** · La pantalla única, en el teléfono<br>RF-020 · UC-P05 | **Pasos:** en la app, aceptar una invitación; tocar «Elegir qué compartir» y destildar el permiso de salud; ver la tarjeta de Inicio.<br>**Se espera:** cada cosa en una línea, con qué, de quién, para quién y para qué; sin el permiso de salud, se destilda lo que depende de él; la tarjeta de Inicio aparece una sola vez por cuenta en ese teléfono. | `apps/mobile/src/compartir-en-el-telefono.test.ts` · «TEST-CMP-044 · cada cosa en una línea: qué, de quién, para quién y para qué» · «TEST-CMP-041 · elegir: desmarcar el A3 desmarca lo que lo pide, y no se puede marcar sin él» · «TEST-CMP-045 · la tarjeta única: con algo para compartir, una sola vez por cuenta en el teléfono» | Pasa · 45207298181<br>En el teléfono: Prueba manual (acta) |

## 4.2 La historia anterior

Si la persona cambia o suma un profesional, no empieza de cero: con su autorización, el profesional nuevo ve lo que pasó antes en esa área con otro profesional, en solo lectura, marcado «De otro profesional» y sin su nombre. La persona ve en «Quién ve qué» cuándo la miró, y la retira cuando quiere.

**Tabla 18.** Los casos de la historia anterior.

| Caso | Pasos y resultado esperado | Prueba automática | Resultado |
| --- | --- | --- | --- |
| **CP-60** · Sin autorización no hay nada; con ella, solo lectura<br>RF-021, RF-025 · UC-P34, UC-P35 | **Pasos:** la profesional nueva pide la historia anterior sin autorización; la persona la autoriza; la pide de nuevo; la persona la retira.<br>**Se espera:** sin autorización, la respuesta de lo inexistente, y la pantalla dice cómo pedirla sin insinuar que haya algo; con ella, lo de antes del otro profesional, marcado y sin nombrarlo, sin lo propio de quien lee ni las notas privadas; cada lectura queda registrada; al retirarla, deja de verla. | `test/integration/historia-anterior.int-spec.ts` · «TEST-HA-020 a 025 · sin la autorización, 404; con ella, lo de antes del otro, marcado y sin nombrarlo»<br>`apps/web/test/historia-anterior.test.mjs` · «TEST-HA-051 · sin la autorización: el 404, por la causa que sea, dice cómo pedírsela, sin un dato ni un número» | Pasa · 45207298181 |
| **CP-61** · Solo esa área y solo lo anterior<br>RF-025 · UC-P35 | **Pasos:** la profesional pide la historia de otra área, sin el vínculo aceptado o sin el permiso del área; después mira lo registrado.<br>**Se espera:** cada pedido recibe la respuesta de lo inexistente; lo registrado después de que ella empezó a acompañarlo no aparece como anterior; en Antropometría entran solo las tomas. | `test/integration/historia-anterior.int-spec.ts` · «TEST-HA-026 a 028 · otra área, 404; sin el vínculo aceptado o sin el B2, 404»<br>`packages/domain/src/historia-anterior.test.ts` · «TEST-HA-002 · lo que entra de cada área» | Pasa · 45207298181 |
| **CP-62** · La autorización solo se agrega<br>RF-020, RF-025 · UC-P34 | **Pasos:** autorizar, retirar y volver a autorizar; intentar autorizar sobre un vínculo terminado; cerrar la cuenta.<br>**Se espera:** cada decisión es una versión nueva que sucede a la anterior, y la base no deja editarla; un vínculo terminado no se autoriza, pero se puede retirar; cerrar la cuenta la retira. | `test/integration/historia-anterior.int-spec.ts` · «TEST-HA-031 · la base: solo se agrega» · «TEST-HA-030 · lo ajeno es 404; un vínculo terminado no se autoriza pero se puede retirar» | Pasa · 45207298181 |
| **CP-63** · Lo que ve la profesional nueva<br>RF-025, RF-053 · UC-P35 | **Pasos:** la profesional abre «Historia anterior» desde la ficha.<br>**Se espera:** un aviso fijo de solo lectura; las versiones de los planes con sus fechas; cada medición con su valor y su unidad, el protocolo una vez y lo calculado con su método. | `apps/web/test/historia-anterior.test.mjs` · «TEST-HA-056 · la pantalla y la ficha: solo lee, dice el aviso fijo» · «TEST-HA-052 · las versiones de los planes: de la más nueva a la más vieja, con sus fechas» · «TEST-HA-054 · las tomas: cada medición con su valor y unidad, el protocolo una vez y lo calculado con su método» | Pasa · 45207298181 |
| **CP-64** · La persona sabe cuándo la miró<br>RF-023, RF-025 · UC-P34 | **Pasos:** en la app, la persona abre «Quién ve qué» después de que la profesional miró su historia anterior.<br>**Se espera:** la tarjeta dice qué comparte, desde cuándo y cuándo la miró; compartida no se presenta como vista. | `apps/mobile/src/historia-anterior-en-el-telefono.test.ts` · «la tarjeta, con el título, la explicación, el estado y cuándo la miró» · «TEST-HA-046 · compartida no es lo mismo que vista» | Pasa · 45207298181<br>En el teléfono: Prueba manual (acta) |

## 4.3 Los gráficos

Los gráficos ponen la historia en el tiempo: lo que la persona hizo la vez pasada, cómo evolucionó el 1RM estimado de un ejercicio con las versiones del plan de fondo, la alimentación día por día y por semana, y cada toma frente a la primera y a la anterior. Se prueban en el dominio y en el website: que dibujen lo que dice la tabla, que «sin dato» nunca sea cero, que no muestren nada de un área sin acceso y que ninguna palabra califique a la persona.

![Figura 4: El historial de la sentadilla de Diego Sosa, como lo ve el Prof. Martín Acosta: el 1RM estimado (Epley v1) sesión a sesión, con la versión del plan de fondo. Captura real del website, en Claro, de la corrida 43768543897 de la herramienta de capturas](pendiente)

**La herramienta de capturas.** Además de las pruebas, un trabajo de la CI levanta la API, el website y la historia sintética de Diego Sosa en un PostgreSQL propio, entra como el Prof. Martín Acosta y como la Lic. Sofía Paz y fotografía cada gráfico **en Claro y en Azul noche, a 1024, 1280, 1440 y 1920 de ancho**. No da un resultado de pasa o falla: deja la evidencia para mirar cómo se ven, con un índice que dice qué es cada imagen y si algo se desborda.

En su corrida 43768543897, del 23 de noviembre de 2026, con el mismo website y la misma API que la rama principal, fotografió 13 pantallas de gráficos en los dos temas y los cuatro anchos, sin ninguna falla.

La herramienta es `EVIDENCIA/GRAFICOS/herramientas/capturas.mjs`, y la corre `.github/workflows/capturas-de-los-graficos.yml`. No bloquea la integración: se corre a pedido.

**Tabla 19.** Los casos de los gráficos.

| Caso | Pasos y resultado esperado | Prueba automática | Resultado |
| --- | --- | --- | --- |
| **CP-65** · «La vez pasada», serie por serie<br>RF-040, RF-045 · UC-P15, UC-P17 | **Pasos:** el entrenador abre un ejercicio que la persona ya hizo; la persona lo ve en su sesión.<br>**Se espera:** las últimas tres veces, de la más reciente a la más vieja, serie por serie; una serie que falta queda sin dato y nunca se completa; sin flechas ni juicios; en la app, la última vez con su fecha. | `packages/domain/src/la-vez-pasada.test.ts` · «TEST-GR-001 · las últimas tres veces, de la más reciente a la más vieja, con lo registrado serie por serie» · «TEST-GR-001 · una serie que falta queda sin dato» · «TEST-GR-001 · sin flechas ni juicios»<br>`apps/mobile/src/la-vez-pasada-en-la-sesion.test.ts` · «la última vez del mismo ejercicio, con su fecha» | Pasa · 45207298181<br>En el teléfono: Prueba manual (acta) |
| **CP-66** · El 1RM estimado, sesión a sesión<br>RF-045 · UC-P15, UC-P18 | **Pasos:** el entrenador abre el historial de un ejercicio con estimación.<br>**Se espera:** una estimación por sesión con la fórmula de Epley versión 1: llena hasta 10 repeticiones equivalentes, hueca de 10 a 12 y en rombo lo observado por el profesional; el eje abarca al menos 10 kg; un RIR sin escribir no se dibuja como cero; la leyenda muestra solo lo que se ve. | `apps/web/test/graficos-entrenamiento.test.mjs` · «TEST-GRF-025 · GR-02: lleno hasta 10 repeticiones equivalentes, hueco de 10 a 12, rombo para lo observado» · «TEST-GRF-024 · GR-02: el eje del 1RM estimado abarca 10 kg (22 lb) como mínimo» · «TEST-GRF-027 · GR-03: un RIR sin escribir no es 0» · «TEST-GRVB-001 · GR-02, GR-03 y GR-05 dibujan los puntos que dice la leyenda» | Pasa · 45207298181 |
| **CP-67** · Las versiones del plan, de fondo<br>RF-045, RF-054 · UC-P18, UC-P24 | **Pasos:** mirar el historial de un ejercicio a lo largo de varias versiones del plan.<br>**Se espera:** cada cambio de versión se marca con una línea; lo que cambió en lo indicado se compara con la versión inmediata anterior, y cada sesión cuenta en la versión que la rigió. | `apps/web/test/graficos-base.test.mjs` · «TEST-GRV-007 · las versiones, discretas: un tono que alterna, una línea en cada cambio» · «TEST-GRV-016 · el cambio de lo indicado es contra la versión inmediata anterior y cada sesión cuenta en la versión que la ejecutó» | Pasa · 45207298181 |
| **CP-68** · La alimentación, día por día y por semana<br>RF-034 · UC-P13 | **Pasos:** la nutricionista mira lo indicado y lo registrado de un período, día por día y por semana.<br>**Se espera:** un día con todo registrado va lleno, un subtotal va hueco y un día sin registros es un hueco; la media de la semana dice con qué días se hizo; con menos de cuatro no hay media, y hoy no cuenta. | `apps/web/test/graficos-nutricion-y-cuerpo.test.mjs` · «TEST-GRF-042 · GR-12: un día lleno con todo registrado, hueco si es un subtotal» · «TEST-GRF-043 · GR-12: la media de la semana dice con qué días se hizo y cuáles quedaron afuera» · «TEST-GRVC-001 · Nutrición por semana» | Pasa · 45207298181 |
| **CP-69** · Gramos por kilo, con el peso medido<br>RF-034, RF-049 · UC-P13, UC-P20 | **Pasos:** mirar las proteínas por kilo de peso en un período con tomas espaciadas.<br>**Se espera:** cada día usa el peso de la última toma de ese día o anterior; sin una toma anterior, no hay valor; solo se ofrece con acceso a Nutrición y a Antropometría. | `apps/web/test/graficos-nutricion-y-cuerpo.test.mjs` · «TEST-GRF-045 · GR-13 en g/kg: cada día con el peso medido de la última toma en ese día o antes»<br>`packages/domain/src/series-disponibles.test.ts` · «TEST-GRF-002 · seriesOfrecidas no ofrece nada de un área sin acceso» | Pasa · 45207298181 |
| **CP-70** · Cada toma, desde el inicio, por sitio y por método<br>RF-049 · UC-P20 | **Pasos:** la profesional abre la última toma, y la evolución por sitio y por método.<br>**Se espera:** cada medida frente a la primera y a la anterior del mismo grupo; por sitio, solo pares comparables, y un sitio sin medir es un hueco; por método, las masas comparten el eje y nada une dos tomas. | `packages/domain/src/desde-el-inicio.test.ts` · «TEST-GR-016 · cada medida contra la primera y la anterior del mismo grupo»<br>`apps/web/test/graficos-nutricion-y-cuerpo.test.mjs` · «TEST-GRF-048 · GR-18: los pares por sitio solo dentro del mismo grupo de comparabilidad» · «TEST-GRF-049 · GR-20: los métodos de una masa comparten el eje» | Pasa · 45207298181 |
| **CP-71** · La tabla dice lo mismo, y sin acceso no hay nada<br>RF-021, RF-053 · UC-P24 | **Pasos:** recorrer un gráfico con el teclado y abrir su tabla; mirar la ficha sin acceso a un área.<br>**Se espera:** la tabla dice lo mismo que el dibujo; el cursor se maneja con las flechas; sin acceso no se dibuja nada, y cada gráfico tiene nombre, resumen y tabla para el lector de pantalla. | `apps/web/test/graficos-base.test.mjs` · «TEST-GRF-012 · la tabla dice lo mismo que el dibujo» · «TEST-GRF-014 · el cursor con el teclado» · «TEST-GRF-015 · SIN_ACCESO no dibuja nada» | Pasa · 45207298181 |
| **CP-72** · La cinta del tiempo<br>RF-054 · UC-P24 | **Pasos:** mirar el historial de un ejercicio con su cinta de lo que pasó en el período.<br>**Se espera:** las versiones como barras y lo que cae junto, agrupado; nada de un área sin acceso, ningún hábito y nada anulado. | `apps/web/test/graficos-base.test.mjs` · «TEST-GRF-019 · la cinta del tiempo (GR-23): nada de un área sin acceso, ningún hábito ni nada anulado» | Pasa · 45207298181 |
| **CP-73** · Legibles en los dos temas, con las palabras de BE<br>RNF-ACC-001, RNF-ACC-002 · UC-P24 | **Pasos:** revisar los colores de los gráficos en Claro y en Azul noche, y sus textos.<br>**Se espera:** cada color llega a un contraste de 3 a 1 contra el fondo en los dos temas; ningún texto usa las palabras que BE no dice. | `apps/web/test/graficos-base.test.mjs` · «TEST-GRF-016 · los tokens nuevos de los gráficos llegan a 3:1 contra la superficie en los dos temas» · «TEST-GRF-018 · los textos comunes de los gráficos pasan la guardia unida de las tres áreas» | Pasa · 45207298181 |
| **CP-90** · Los enfoques<br>RF-053 · UC-P24 | **Pasos:** guardar un enfoque, editarlo y elegirlo para dos personas; pedir el de otro profesional.<br>**Se espera:** avisa en cuántos lugares está elegido; el ajeno es inexistente. | `test/integration/enfoques-de-graficos.int-spec.ts` · `packages/domain/src/enfoques.test.ts` | Pasa · 45207298181 |

# 5. En el teléfono

*Lo que solo se comprueba con la app instalada en un Android, a mano y con su acta.*

La lógica de la app se prueba sola en cada cambio: las 240 pruebas de la capa de la app y los archivos de `scripts/` que prueban sus pantallas (la sesión guiada, el registro de comidas, la navegación, los avisos). Lo que solo un teléfono muestra se comprueba a mano: instalar la app, usar la cámara, recibir un aviso, escuchar una pantalla con TalkBack. Esas pruebas se hacen con la app de la entrega, en un teléfono con Android 7 o posterior, con la cuenta de evaluación de Diego Sosa y siguiendo «Cómo probar BE», y cada una se asienta en el acta («El acta de la prueba en el teléfono»).

**Tabla 20.** Las pruebas manuales en el teléfono, con los casos que completan y dónde están los pasos.

| # | Qué se prueba | Casos | Pasos | Resultado |
| --- | --- | --- | --- | --- |
| T-1 | Instalar la app desde el enlace o el QR de la entrega, sin desactivar ninguna protección, y abrirla. | — | «Cómo probar BE», «Instalar la app» | Prueba manual (acta) |
| T-2 | Entrar con la cuenta de la persona y recorrer Inicio, Nutrición, Entrenamiento, Evolución y Perfil. | CP-28, CP-35 | «Cómo probar BE», «El recorrido corto» | Prueba manual (acta) |
| T-3 | Aceptar una invitación con el código o con el QR, y compartir en la pantalla única con «Aceptar y compartir» y con «Elegir qué compartir». | CP-17, CP-53, CP-59 | «Cómo probar BE», «Aceptar y compartir» | Prueba manual (acta) |
| T-4 | Registrar una comida con «Comí esta opción» y otra con «Comí algo diferente», con una foto de la cámara. | CP-29 | «Cómo probar BE», «Registrar» | Prueba manual (acta) |
| T-5 | Hacer una sesión serie por serie, con el descanso y «La vez pasada» debajo de cada ejercicio, hasta «Finalizar entrenamiento»; registrar otra con «Ya la hice». | CP-35, CP-36, CP-65 | «Cómo probar BE», «Registrar» | Prueba manual (acta) |
| T-6 | En «Quién ve qué», dejar de compartir el resumen y el plan de un área con un profesional, y ver la historia anterior compartida y cuándo la miró la profesional. | CP-56, CP-64 | «Cómo probar BE», «Retirar algo en "Quién ve qué"» y «Ver la historia anterior» | Prueba manual (acta) |
| T-7 | Activar los avisos cuando la app lo pregunta, recibir uno en el teléfono y abrir «Novedades» desde él. | CP-50, CP-51 | «Cómo probar BE», «El recorrido corto» | Prueba manual (acta) |
| T-8 | Escuchar con TalkBack la pantalla única de compartir y la tarjeta de la historia anterior, y verlas en Claro y en Azul noche. | CP-59, CP-64 | «Cómo probar BE», «Aceptar y compartir» | Prueba manual (acta) |
| T-9 | El recorrido completo, con los tres roles, de la invitación a la historia anterior. | CP-53 a CP-64 | «Cómo probar BE», «El recorrido completo» | Prueba manual (acta) |
| T-10 | Una sesión con series de calentamiento y un bloque «En vueltas», y un plan en RPE, también con TalkBack. | CP-74, CP-76, CP-96 | «Cómo probar BE», «Registrar» | Prueba manual (acta) |
| T-11 | Pasar las opciones de una comida con el gesto y con las flechas, escuchar «Opción n de m» con TalkBack y registrar «Comí esta opción». | CP-29 | «Cómo probar BE», «El recorrido corto» | Prueba manual (acta) |

# El acta de la prueba en el teléfono

*El formato con que se asienta cada prueba manual. Se completa con la app y los datos de la entrega.*

Cada prueba manual deja un acta: en qué teléfono, con qué app, con qué datos, qué se hizo, qué se vio y con qué evidencia. Una prueba sin acta no cuenta como hecha.

**Tabla 21.** Los datos del acta, comunes a todas las pruebas de una sesión.

| Campo | Qué se anota | Valor |
| --- | --- | --- |
| Teléfono | Marca y modelo | [COMPLETAR: [completar]] |
| Versión de Android | La que dice «Ajustes», «Acerca del teléfono» | [COMPLETAR: [completar]] |
| Versión de la app | La de la entrega, con la huella SHA-256 del archivo instalado | [COMPLETAR: [completar]] |
| Datos de prueba | Las cuentas de evaluación: Diego Sosa en el teléfono; la Lic. Sofía Paz, el Prof. Martín Acosta y la Prof. Lucía Benítez en el website | [COMPLETAR: [completar]] |
| Fecha y responsable | Cuándo se hizo y quién la hizo | [COMPLETAR: [completar]] |

**Tabla 22.** El registro de cada prueba manual.

| # | Pasos | Resultado observado | Evidencia |
| --- | --- | --- | --- |
| T-1 | Los de «Instalar la app» | [COMPLETAR: [completar]] | [COMPLETAR: [captura o video]] |
| T-2 | Los de «El recorrido corto» | [COMPLETAR: [completar]] | [COMPLETAR: [captura o video]] |
| T-3 | Los de «Aceptar y compartir» | [COMPLETAR: [completar]] | [COMPLETAR: [captura o video]] |
| T-4 | Los de «Registrar», con la comida | [COMPLETAR: [completar]] | [COMPLETAR: [captura o video]] |
| T-5 | Los de «Registrar», con la sesión | [COMPLETAR: [completar]] | [COMPLETAR: [captura o video]] |
| T-6 | Los de «Retirar algo» y «Ver la historia anterior» | [COMPLETAR: [completar]] | [COMPLETAR: [captura o video]] |
| T-7 | Los avisos, desde «¿Te avisamos?» | [COMPLETAR: [completar]] | [COMPLETAR: [captura o video]] |
| T-8 | TalkBack y los dos temas | [COMPLETAR: [completar]] | [COMPLETAR: [captura o video]] |
| T-9 | Los de «El recorrido completo» | [COMPLETAR: [completar]] | [COMPLETAR: [captura o video]] |

El resultado observado se escribe tal cual se vio. Si algo no se comporta como dice el caso, se anota, se corrige el sistema y la prueba se repite con su acta nueva.

# Fuentes

*De dónde sale cada cifra y cada resultado, para verificarlo en el repositorio público del proyecto, github.com/Elian-Bufi/be.*

> **Fuentes.** 1. Los trabajos de la CI: `.github/workflows/ci.yml`. Los cuatro controles obligatorios para integrar: la protección de la rama principal, consultada el 15 de noviembre de 2026.
> 2. Los resultados: la corrida 45207298181 de la CI de la rama principal, del 23 de noviembre de 2026, con sus cinco trabajos en verde. Su registro informa cuántos casos corrieron, pasaron y fallaron en cada capa; el archivo `resultados-integracion` de esa corrida da el resultado de cada prueba de integración (1.134 de 1.134).
> 3. Las cifras por capa: los archivos de prueba de `packages/domain/src`, `apps/api/src`, `apps/web/test`, `apps/mobile/src`, `scripts`, `test/integration` y `test/navegador`, contados en el código de la rama principal, y los casos, en el registro de esa corrida.
> 4. Los recorridos en el navegador: `test/navegador/recorridos.mjs` y `test/navegador/LEEME.md`.
> 5. Las pruebas de carreras sin pausas: `test/integration/soporte-concurrencia.ts`. El mecanismo del retiro: la función `be_bloquear_lo_que_corta` de la base y `apps/api/src/autorizacion/pdp.service.ts`.
> 6. Compartir y la historia anterior: `docs/paquetes/WP-COMPARTIR.md` y `docs/paquetes/WP-HISTORIA-ANTERIOR.md`, con sus tablas de verificación.
> 7. Las capturas de los gráficos: `EVIDENCIA/GRAFICOS/herramientas/capturas.mjs` y su corrida 43768543897, del 23 de noviembre de 2026.
> 8. Los casos de uso, en el entregable 10; los requisitos, en el 12 y el 13; los pasos de las pruebas manuales, en «Cómo probar BE».
