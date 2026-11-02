# Respuestas

Para mirar **después** de intentar. Son las respuestas de los cinco ejercicios del [plan de estudio](PLAN-DE-ESTUDIO.md)
y de cada «Para comprobar» de la guía central y del cuaderno de datos, con el número de concepto que trae cada PDF.
Cuando una respuesta depende del código, dice dónde mirarlo. Commit de referencia: `e4512cb`.

Una respuesta tuya puede ser distinta y estar bien. Lo que importa es que nombre la pieza correcta y el porqué.

---

## Los cinco ejercicios

### Ejercicio 1 · Arquitectura en 90 segundos (un modelo)

> BE es una plataforma para que una persona trabaje con varios profesionales de la salud (nutrición, entrenamiento y
> antropometría) sin que su información quede repartida en planillas y chats.
>
> Tiene tres superficies: una APK de Android para la persona, que ve su plan del día y registra lo que hace; un website
> para el profesional, que evalúa, fija objetivos, arma planes y analiza; y una consola de Administración, con segundo
> factor, que verifica y suspende profesionales por área y nunca ve datos de salud.
>
> Las tres le hablan a una sola API, que es la que decide. Cada pedido sobre datos de una persona pasa por un punto de
> decisión, el PDP, que mira siete cosas: rol, especialidad, situación, vínculo, autorización de la persona, finalidad y
> área. Alcanza con una desfavorable para negar.
>
> Los datos viven en PostgreSQL, y la base misma impide pisar la historia: lo registrado solo se agrega, un plan activado
> queda congelado con una instantánea y corregir es agregar otra fila.
>
> Lo que está probado es que el sistema hace cumplir esas reglas: más de 900 pruebas de integración contra una base real.
> Lo que todavía no está probado es que les ahorre tiempo o les mejore las decisiones a los profesionales: esa es la
> hipótesis que sigue.

Lo que suele faltar: el «para quién», y la última frase. Lo que suele sobrar: la lista de tecnologías.

### Ejercicio 2 · Seguir un dato

| Paso | Dónde | Qué pasa con los datos |
|---|---|---|
| 1. Pantalla | APK, «Hoy», «Registrar comida» | Nada todavía. La APK arma el pedido con una clave de idempotencia nueva para este intento. |
| 2. Operación | `POST /me/nutrition/meal-records` (API-ING-02) | Llega con el token y la clave. |
| 3. Sesión | `SesionGuard` | **Lee** `sesion` y `control_de_sesion`. |
| 4. Forma | `validarCuerpo` con `RegistrarComidaRequestSchema` | Nada en la base. |
| 5. Clave | `IdempotenciaService.ejecutar` | Abre la transacción y **lee** `registro_de_idempotencia`. |
| 6. Plan y permiso | `RegistroDeComidasService` y `PdpService` | **Lee** la versión del plan, los hechos del PDP y **escribe** `decision_de_acceso`. |
| 7. Reglas | El servicio | **Lee** el plan vigente y las comidas del día. |
| 8. Escritura | El servicio | **Escribe** `ingesta_nutricional`, `evento_de_nutricion` y, si es una comida diferente con fotos, `evidencia_visual_de_ingesta`. |
| 9. Cierre | Idempotencia y auditoría | **Escribe** `registro_de_auditoria` y `registro_de_idempotencia`. `COMMIT`. |
| 10. Respuesta | 201 | Lo consumido se **calcula** con la instantánea; no se guarda. |
| 11. Lectura | Website, «Analizar», `API-PRJ-01` | El `PdpGuard` decide por área y **escribe** cada decisión. `fuentes.ts` **lee** comidas, versiones, instantáneas y objetivos. |
| 12. Cálculo | `packages/domain` | Registrado, objetivo e indicado se **calculan** en cada lectura. Nada se guarda. |

### Ejercicio 3 · Permiso o sesión

| Caso | Respuesta | Quién lo frena | ¿Queda algo guardado? |
|---|---|---|---|
| 1. Token vencido | 401 `SESSION_EXPIRED` | `SesionGuard` (la firma del token incluye el vencimiento) | No. |
| 2. Autorización revocada | 404 `RESOURCE_NOT_FOUND` | PDP, dimensión CONSENTIMIENTO | La decisión denegada. La sesión sigue abierta. |
| 3. Plantillas con el área suspendida | 403 | La comprobación del área (`puedeOperarArea`): no hay datos de una persona | Ningún dato de una persona. |
| 4. Persona sin vínculo | 404 | PDP, dimensiones VINCULO, CONSENTIMIENTO, FINALIDAD y ALCANCE | La decisión denegada. Para quien prueba, es igual que si la persona no existiera. |
| 5. Todas las sesiones cerradas | 401 `SESSION_REVOKED` | `SesionGuard`: la sesión ya no está ACTIVA | No. |
| 6. Suspendido en Entrenamiento, pide Nutrición | 200 | Nadie: la suspensión es por área | La decisión permitida. |

La regla para recordar: **401 es «no sé quién sos»**; **404 es «no tenés permiso sobre esto, y no te digo si existe»**;
**403 es «sé quién sos, pero no podés usar esta herramienta»**, cuando no hay datos de nadie en juego.

### Ejercicio 4 · La transacción fallida

1. **Nada** de la comida queda: ni `ingesta_nutricional` ni `evento_de_nutricion`. La transacción se revierte entera. La
   respuesta de error tampoco se guarda en `registro_de_idempotencia`: los errores no se guardan. La decisión del PDP
   que se había escrito adentro también se revierte; lo que queda, aparte y después, es el registro del rechazo.
2. 422 `NUTRITION_EXECUTION_INVALID`, con el detalle de qué no es del plan.
3. Como no se guardó ninguna respuesta, el reintento con la misma clave vuelve a ejecutarse desde cero, y vuelve a dar
   422, salvo que algo haya cambiado.
4. Quedaría una auditoría de algo que no pasó, o una comida sin su auditoría si el orden fuera el inverso. Por eso todo va
   en la misma transacción.

**Con la suspensión cruzada (D-06):** el pedido de la persona toma la fila de verificación en modo compartido; la
suspensión la pide en modo exclusivo y espera. El pedido termina primero (con su 422 o su 201), suelta la fila, y la
suspensión se aplica después. El pedido siguiente de esa persona sobre ese plan ya recibe 404: con el área del
profesional suspendida, el PDP niega también los registros propios contra ese plan.

### Ejercicio 5 · El catálogo y el plan activado

1. Nada. La versión 1 tiene su instantánea del 20/10, con la composición vieja del arroz y una huella. Las comidas del
   22/10 se calculan con esa instantánea, hoy y siempre.
2. La sucesora del 26/10 trae el arroz nuevo: al activar, la instantánea copia la última versión disponible de cada
   alimento del catálogo. Una opción que nace de una receta, en cambio, congela las versiones que cita la receta.
3. Porque el plan es lo que el profesional indicó en ese momento, con la información que tenía. Si se reescribiera, los
   gráficos de octubre cambiarían en noviembre y nadie podría reconstruir qué se indicó.
4. Tres cosas: no hay clave foránea del plan al catálogo (el contenido cita alimentos por id y la instantánea copia la
   composición); la instantánea solo se puede insertar al activar; y el disparador de la versión del plan rechaza
   cualquier cambio a una versión ACTIVADA. Además, el catálogo mismo se versiona y solo agrega.

---

## Guía central

1. **Actor y rol.** Porque así, aunque le roben la sesión a Administración, no se filtra salud. Y porque no lo necesita
   para su tarea: verificar y suspender se decide con datos del profesional, no de las personas. Es el principio de
   mínimo privilegio.
2. **Dato sensible.** Más barreras y más registro: autorización explícita y revocable, acceso por área, auditoría de cada
   decisión, nada en los registros técnicos (logs) y mínimo dato en lo que se audita.
3. **Objetivo, indicado y registrado.** Porque el plan deja elegir, y BE no elige por la persona ni suma o promedia las
   alternativas. «Indicado» existe solo si ese día rige una sola versión, se sabe el día tipo y cada comida tiene una
   sola opción (`packages/domain/src/indicado-del-plan.ts`). Si no, dice por qué no hay.
4. **Versión.** La posibilidad de saber qué se indicó: las comidas registradas se calcularían con un plan distinto del
   que la persona vio, y una revisión no tendría con qué comparar.
5. **Ausencia declarada.** Que la persona comió cero, o que se salteó comidas. Lo único que se sabe es que no registró.
6. **Verificación y validación.** Sabés que el código hace lo que esa prueba pide, en esas condiciones. No sabés si la
   prueba pide lo correcto, si cubre los casos que importan, ni si a alguien le sirve.
7. **Hipótesis de valor.** Una tarea real, cronometrada, con y sin BE (por ejemplo, preparar una revisión con datos de
   dos semanas), y una pregunta abierta al final: qué decisión tomaste y con qué dato. Observar sin ayudar, y anotar.
   Tres profesionales no prueban nada estadísticamente, pero muestran si la hipótesis se sostiene.
8. **Cliente y servidor.** La API lo rechaza igual: 422, `OCCURRED_AT_IN_FUTURE`. La regla vive en el servidor, no en la
   pantalla.
9. **Dominio compartido.** Porque cualquiera puede mandar pedidos sin la APK, o con una APK vieja. El dominio en el
   teléfono sirve para ayudar a la persona antes de mandar; el de la API, para decidir.
10. **Contrato.** Detecta errores temprano (un nombre mal escrito no pasa en silencio) y cierra la puerta a mandar
    datos que nadie validó. Un campo ignorado es un campo que alguien cree que se guardó.
11. **Código de estado HTTP.** Porque cada clase de error pide algo distinto: con 401 hay que volver a entrar, con 404
    no insistir, con 409 actualizar y reintentar, con 422 corregir el dato. Un solo código obligaría a leer textos.
12. **Idempotencia.** Una. Los tres reintentos llevan la misma clave: el primero que llega escribe; los otros reciben la
    misma respuesta guardada. Si el primero falló antes del `COMMIT`, no queda nada y el siguiente lo hace de nuevo.
13. **Monorepo.** Que cambie un contrato de un lado y no del otro, y nadie se entere hasta que una pantalla falle en un
    teléfono. Con un solo repositorio, la CI compila y prueba los dos juntos.
14. **Forma y regla de negocio.** «−3 g» es de forma: el contrato exige una cantidad positiva (400). «30/10» con hoy
    28/10 es de regla: la fecha está bien escrita, pero es futura (422).
15. **Defensa en profundidad.** Porque la base solo dice «no» con un error genérico (la persona vería un 500). La prueba
    del servicio asegura el «no» correcto, con su código y su mensaje, y la base queda para lo que nadie previó.
16. **Punto de decisión.** SITUACION: exige que la verificación no esté SUSPENDIDO. ESPECIALIDAD acepta VERIFICADO o
    SUSPENDIDO, porque la especialidad sigue siendo verdad; lo que se suspende es poder operar.
17. **404 en lugar de 403.** Que esa persona existe y tiene datos. Probando identificadores, se podría saber quién usa BE.
18. **Disparador.** Porque el código cambia, tiene defectos y puede haber otro camino que escriba (un script, una
    migración, otra operación). La base protege la historia aunque todo lo demás se equivoque.
19. **Sesión y permiso.** Un 404 en la operación siguiente; el website le muestra que no tiene acceso. No se le cierra la
    sesión: sigue pudiendo trabajar con sus otras personas.
20. **Transacción.** Una comida sin auditoría (si la segunda transacción falla) o una auditoría que no se puede asociar a
    nada. Y una ventana en la que otro pedido ve la comida sin su auditoría.
21. **Auditoría.** Porque no lo necesita para su fin (saber quién hizo qué y cuándo) y porque cada copia de un dato de
    salud es otro lugar donde se puede filtrar. La auditoría apunta al recurso, no lo copia.
22. **Dato derivado.** Nada aparte: la rectificación es una fila nueva y la próxima lectura ya calcula con ella. Si los
    totales estuvieran guardados, habría que recalcularlos y podrían quedar desfasados.
23. **Instantánea.** Cambiarían: el gráfico de octubre diría algo distinto en noviembre, sin que nadie haya registrado
    nada nuevo.
24. **Estado e historia.** «¿Quién lo suspendió, cuándo, por qué, y cuántas veces pasó?». Con el estado solo, solo sabés
    cómo está hoy.
25. **Sin caché de permisos.** Ventaja: un corte vale desde el pedido siguiente, sin esperar a que nada venza. Costo: una
    consulta a la base en cada pedido. En BE es una sola consulta, sin caché a propósito.
26. **Migración.** Qué valor tienen esas filas: un valor por defecto, o un paso que las complete antes de volver
    obligatoria la columna. Si no lo dice, la migración falla en una base con datos (y pasa en una vacía).
27. **Lo aplicado no se edita.** En tu máquina, con una base nueva, corre la versión editada. Test ya tiene la vieja
    anotada como aplicada y no la vuelve a correr: queda con la estructura vieja, y el código espera la nueva. Prisma
    guarda una suma de control de cada archivo, y en desarrollo (`migrate dev`) avisa que una aplicada cambió; el
    despliegue (`migrate deploy`) solo aplica las pendientes, así que no te frena.
28. **Compatibilidad hacia atrás.** Porque la APK valida las respuestas con esquemas estrictos: un campo que no conoce
    hace fallar la lectura entera («respuesta no reconocida»), aunque no lo fuera a mostrar.
29. **Contrato congelado.** La API. El contrato congelado es lo que hace una APK que ya está instalada en teléfonos y que
    nadie va a actualizar. Cambiarlo para que la prueba pase sería esconder la rotura.
30. **Integración continua.** Porque `main` puede haber cambiado desde que corrió la del PR: dos PR que pasan por separado
    pueden romperse juntos. La de `main` prueba lo que de verdad se despliega.
31. **Despliegue condicionado.** Solo `be-web`. El `buildFilter` de `be-api` mira `apps/api`, el dominio, `prisma` y los
    `package*.json`; el del cron, su script.
32. **Prueba de integración.** Cualquiera que dependa de la base: un disparador que rechaza algo, dos pedidos que chocan,
    un índice único que decide una carrera, una transacción que se revierte.
33. **Prueba determinista.** Que depende del tiempo y no del orden real de los hechos: mide «cuánto tarda», no «qué
    pasó». Puede fallar sin defecto, o peor, pasar sin probar nada. Hay que cambiar la espera por una barrera.
34. **Integración (merge).** No. Render despliega solo cuando la CI de ese commit en `main` termina bien
    (`autoDeployTrigger: checksPass`). Test sigue con la versión anterior hasta que haya un commit en verde.
35. **Validación humana.** Porque una prueba automática compara con lo que alguien escribió que tenía que pasar. No puede
    saber si una persona entiende la pantalla, si la palabra elegida confunde o si la tarea tiene sentido.

---

## Cuaderno de datos

1. **SGBD.** La base: el disparador `ingesta_nutricional_solo_agregar` rechaza el `DELETE`, y la transacción se revierte.
2. **Esquema.** Ganaría una separación visible y la posibilidad de dar permisos por esquema. Perdería simplicidad:
   identidad, vínculos, PDP y auditoría cruzan las áreas, y casi todo terminaría consultando entre esquemas. Hoy la
   separación está en el código y en el PDP.
3. **Ambiente.** Porque una prueba escribe y borra datos a propósito. Si apuntara a test, podría pisar la cohorte o los
   escenarios de una prueba con personas. Por eso la prueba local se niega a correr contra una base que no sea local.
4. **Módulo no es ambiente.** Ninguna: el área nueva serían tablas nuevas, por migraciones, en las bases que ya existen.
5. **ORM.** Porque Prisma no escribe disparadores, índices únicos parciales ni funciones: esas reglas se escriben en SQL
   dentro de las migraciones.
6. **Mapeo de nombres.** En `prisma/schema.prisma`, en el campo: `@map("version_de_plan_id")`.
7. **Complejidad necesaria y deuda.** Un ejemplo: juntar `rectificacion_de_cantidades` con `ingesta_nutricional`,
   pisando las cantidades. Rompe «corregir es agregar» y la historia por adición. Otro: fusionar los planes de Nutrición
   y de Entrenamiento en una tabla genérica no rompe una regla, pero mezcla formas distintas en JSON y debilita lo que
   cada disparador puede controlar.
8. **Cardinalidad.** Porque cada fila del lado «muchos» tiene un solo valor del otro lado: cabe en una columna. Del lado
   «uno» harían falta muchas columnas, o una lista.
9. **Tabla intermedia.** Que el hecho de recibir una nota tuviera su propio ciclo: por ejemplo, «leída», «archivada» o
   «respondida» por cada destinatario.
10. **Integridad referencial.** La historia de lo registrado. Por eso todas las claves son `Restrict` y una versión
    activada no se borra.
11. **Restricción.** El único común vale para todas las filas; el parcial, solo para las que cumplen una condición. «Un
    solo proceso ABIERTO por profesional, persona y área» deja tener muchos CERRADO.
12. **Atomicidad y reversión.** Un área suspendida sin quién, cuándo ni por qué: la ficha mostraría un estado sin
    historia, y no habría novedad para avisar.
13. **Bloqueo compartido y exclusivo.** Porque todos los pedidos de todos los profesionales leen esas filas: en modo
    exclusivo irían de a uno y la API se volvería lenta. Compartido alcanza para que una suspensión no pase en el medio.
14. **Índice.** Porque cada índice hay que actualizarlo en cada escritura y ocupa lugar. Se ponen donde hay una búsqueda
    frecuente.
15. **Solo agregar.** Con otra fila: una rectificación de cantidades que apunta a la comida, o una anulación. La lectura
    toma la vista efectiva.
16. **JOIN y LEFT JOIN.** Con `JOIN`, quedarían solo las comidas que tienen anulación; y la condición `a.id IS NULL` las
    descarta a todas. El resultado sería vacío.
17. **Agrupar.** Generar los días del período (`generate_series`) y unirlos con `LEFT JOIN` a la cuenta. Los días sin
    filas aparecen con 0 comidas *registradas*: no quiere decir que no haya comido.
18. **Modelo conceptual.** Porque es el lenguaje de los dos: si una «comida diferente» o una «corrección» se entienden
    distinto, ninguna tabla bien hecha lo arregla después.
19. **Modelo físico.** Que los identificadores sean UUID, que el detalle de un plan sea JSON, los nombres en
    `snake_case`, o que los bytes de las fotos estén en la misma base.
