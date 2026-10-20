# Guion de la defensa

Una exposición de unos 20 minutos, demo incluida, y después las preguntas. El texto de cada diapositiva está en sus
notas del orador; acá va el orden, el tiempo, qué mostrar y de dónde sale cada afirmación. La versión que se presenta es
`main` `0fb1bff` (2026-10-20).

- **Presentación:** el mazo «BE · Defensa de tesis» (16 diapositivas 16:9, con notas del orador), en
  https://claude.ai/artifact/9LiufGdUTJjAbEonGT8t2U. Es privado hasta que Dirección lo comparta, y se descarga como
  PowerPoint o PDF. El contenido, diapositiva por diapositiva, también está en `DIAPOSITIVAS.md`.
- **Demo:** `DEMO.md`, con su plan B.
- **Preguntas probables:** `PREGUNTAS.md`.
- **A mano:** la versión de evaluación de la tesis (con las credenciales del apartado 14), nunca en pantalla compartida.

## Tiempos

| Desde | Diapositiva | Qué mostrar | Respaldo |
|---|---|---|---|
| 0:00 | 1 · Portada | La ficha real de Diego Sosa | Apartado 1 |
| 0:45 | 2 · El problema | Tres frases; decir que es una hipótesis | Apartado 2 |
| 2:00 | 3 · La propuesta | Website, APK y el núcleo que protege | Apartado 2 |
| 2:45 | 4 · Qué hace y qué no | Las cuatro decisiones y los cuatro límites | Apartado 2 (límites) |
| 3:45 | 5 · Con quién habla BE | Personas a la izquierda, sistemas externos a la derecha | Apartado 8, ARQ-01 |
| 4:30 | 6 · El circuito | Los seis pasos y cómo se vuelve | Anexo B, B-01 |
| 5:45 | 7 · Demo | Siete minutos, según `DEMO.md` | Apartado 11 |
| 12:45 | 8 · Por dentro | Cinco piezas y una sola base | Apartado 8, ARQ-02 |
| 13:45 | 9 · Una operación protegida | Los seis pasos de activar un plan | Anexo E, E-01 |
| 15:00 | 10 · Los datos | Las cifras de la base | Apartado 6 |
| 15:45 | 11 · Estados | Proceso y consentimiento | Anexo E, E-03 y E-04 |
| 16:30 | 12 · Cómo se sabe que funciona | Casos, CI y verificaciones en test | Apartado 5, anexo F |
| 17:30 | 13 · Lo que falta | Dicho antes de que lo pregunten | Anexo K |
| 18:30 | 14 · Cómo se trabajó | Legajo, paquetes, CI, decisiones; IA declarada | Apartado 2 (roles) |
| 19:15 | 15 · Lo que sigue | Cuatro pasos | Anexo K, apartado 2 |
| 19:45 | 16 · Preguntas | — | `PREGUNTAS.md` |

Si la demo se alarga, recortar en 10 y 11, que también están en la tesis.

## Antes de la mesa

- Completar en la portada del mazo y de la tesis la nómina del grupo, los correos institucionales y el mes y año.
- Ensayar el guion completo con un reloj, una vez con la demo en vivo y otra con el plan B.
- Revisar `DEMO.md`, sección «Antes de entrar a la mesa».

## Cada lámina en 30 a 60 segundos

La prueba de explicación del encargo: cada figura de la tesis tiene que poder explicarse en 30 a 60 segundos. A un
ritmo de 140 palabras por minuto, eso es entre 70 y 140 palabras. Estos textos sirven para una pregunta sobre una
figura puntual; `node herramientas/prueba-de-explicacion.mjs` cuenta las palabras de cada uno y dice si entra.

### CU-00 · Vista general de los casos de uso

Son los 56 casos de uso del legajo, agrupados en ocho paquetes: acceso, alta profesional, vínculo, nutrición,
entrenamiento, antropometría, seguimiento e información. Profesional y asesorado participan en todos los paquetes, por
eso en esta vista no se trazan sus líneas; los sistemas externos y el administrador previsto se asocian a su paquete.
Abajo está la franja de los casos incluidos que todos comparten: la autorización, la auditoría y los cálculos. Cada caso
lleva su estado en la versión de referencia, y cada paquete remite a su vista de detalle, de CU-01 a CU-08, con sus
fichas.

### DER-00 · Vista general por dominios

La base tiene 113 tablas. Para poder leerla, se agrupan en catorce vistas por dominio, que son los paquetes de esta
figura: identidad y sesión, profesional y proceso, vínculo, consentimiento, tres de nutrición, tres de entrenamiento,
antropometría, información, seguimiento y plataforma. Cada pastilla dice cuántas tablas tiene la vista, y las flechas
entre paquetes son las claves que cruzan de una vista a otra. Cada vista tiene su propia lámina, de DER-01 a DER-14, en
notación de pata de gallo, con las claves y la obligatoriedad de cada relación.

### CL-01 · Modelo de dominio del circuito nutricional

Es el nivel de análisis: las entidades del circuito nutricional tal como las entiende el negocio. Cada clase es una
tabla del DER; sus atributos salen del esquema y sus operaciones son rutas reales de la API, como activar, que es
API-NUT-12. Las multiplicidades salen de las claves foráneas. Los rombos llenos marcan composición: un alcance no existe
sin su vínculo, una versión de plan no existe sin su plan y una próxima revisión no existe sin su proceso. Se recorre
siguiendo el circuito: vínculo y consentimiento, evaluación y objetivo, plan, ingesta y revisión.

### CL-02 · Implementación de una escritura protegida

Son las clases reales que intervienen al activar un plan. El controlador de nutrición recibe el pedido, ya autenticado
por SesionGuard, y lo pasa a PlanesService. PlanesService usa a EjecutorNutricional, que es un EjecutorDeDominio con el
alcance de nutrición: el esqueleto común de todas las escrituras de salud. Ese esqueleto depende de cuatro servicios de
plataforma: Prisma para la transacción, la idempotencia, la auditoría y el PDP, que a su vez usa la regla pura de
autorización del paquete de dominio. Las flechas discontinuas son dependencias por inyección; el triángulo es la
generalización.

### CL-03 · Jerarquías de la API

Son las generalizaciones y realizaciones que existen en el código. El esqueleto abstracto EjecutorDeDominio tiene ocho
subclases, una por dominio o servicio; cinco de ellas le pasan un alcance que no usan, y eso quedó anotado como
discrepancia en el anexo K. Los dos guardas, SesionGuard y PdpGuard, realizan la interfaz CanActivate de NestJS, con
línea discontinua. PrismaService extiende al cliente de Prisma, y los errores propios extienden a Error: una
DenegacionDelPdp es un ErrorDeApi. Todos los nombres son los de la carpeta de la API.

### ARQ-01 · Contexto

Es BE visto desde afuera, en el modelo C4. A la izquierda, las tres personas: el asesorado, que usa la APK y el
navegador; el profesional, que usa el navegador; y el responsable de validación, que mide la TVCC-30 con un comando
interno. A la derecha, con borde discontinuo, los tres sistemas externos: Google para entrar con una cuenta de Google,
Expo Push y FCM para que el aviso llegue al teléfono, y Open Food Facts y wger para importar alimentos y ejercicios.
Abajo, punteado, el administrador que prevé el legajo y que esta entrega no tiene.

### ARQ-02 · Contenedores

Adentro, BE son cinco contenedores: la APK, el website, la API, la base de datos y la tarea programada de
recordatorios. Las aplicaciones nunca hablan con la base: todo pasa por la API. La API es un monolito modular, porque
una operación de salud tiene que ser completa o no ocurrir, y con una sola base alcanza una transacción local. La tarea
programada llama a una interfaz interna de la API, protegida con un secreto. Hacia afuera, la API verifica identidades
con Google, manda los avisos por Expo Push e importa de los catálogos abiertos.

### ARQ-03 · Despliegue

Dónde corre todo: Render, en Frankfurt. El website es un sitio estático; la API, un servicio web en Docker; la base, un
PostgreSQL administrado; y los recordatorios, un cron que corre a las 22, a las 10 y a las 15 de Buenos Aires. Un
cambio llega así: se integra en main por un pull request con la CI en verde, Render despliega solo cuando la CI pasa, y
la API aplica las migraciones al arrancar y recibe tráfico cuando su chequeo de salud responde. La APK no pasa por una
tienda: se publica como release de GitHub, con su huella SHA-256.

### COMP-01 · Componentes del sistema

Son los componentes del software y sus interfaces, en UML. Hay tres aplicaciones, website, APK y API, una tarea
programada y un paquete compartido. La API provee la interfaz REST, dibujada como un chupetín, que el website y la APK
requieren con una dependencia discontinua, y una interfaz de tareas internas que requiere la tarea programada. La API, a
su vez, requiere la base de datos y tres servicios externos. El paquete de dominio no se despliega solo: es una
biblioteca de reglas y contratos que importan las tres aplicaciones, así una regla vale igual en todas.

### COMP-02 · La API por dentro

Son los módulos de la API. Los de plataforma son globales y los usan todos: Prisma, la plataforma con la auditoría y la
idempotencia, la autorización con el PDP, el proceso y las novedades. Los de dominio son los demás: acceso, vínculo,
consentimiento, nutrición, entrenamiento, antropometría, formularios, seguimiento, coordinación y otros, cada uno con
las familias de operaciones que provee. Todos deciden los permisos con el mismo PDP. La tabla del apartado 9 da, para
cada módulo, sus controladores, sus servicios y sus familias de operaciones.

### B-01 · Flujo integral profesional–asesorado

El profesional invita a una persona y BE crea una invitación de un solo uso, con su enlace y su código; el website
dibuja además el QR. El asesorado abre la invitación, acepta el vínculo y autoriza el acceso: recién entonces el
profesional puede evaluarlo, fijar el objetivo y activar un plan. Al activarlo, BE decide si se puede, congela la
versión, abre el proceso y le avisa al asesorado. El asesorado sigue el plan y registra, y BE guarda cada registro sin
borrar nada. El profesional revisa y decide: FINALIZAR cierra el proceso; AJUSTAR o SUSTITUIR crean un borrador
sucesor; cualquier otro resultado sigue con el mismo plan.

### C-01 · Flujo de nutrición

El profesional arma el plan con días tipo, comidas y opciones, que pueden salir de una receta, lo valida y lo activa.
BE congela una instantánea, abre el proceso y le avisa al asesorado. Cada día, el asesorado ve el plan y, para cada
comida, registra una opción del plan con su cantidad o algo diferente, con texto, foto o los dos. BE guarda el registro;
corregir una cantidad o deshacer un registro agrega otro, nunca borra. El profesional revisa y el resultado decide si
sigue el mismo plan, si se ajusta o si el seguimiento termina.

### C-02 · Flujo de entrenamiento

El profesional arma el plan con sesiones, ejercicios y series, lo valida y lo activa. BE no guarda una agenda: la
calcula desde el plan activado cada vez que el asesorado la mira. Al iniciar una sesión, BE abre un borrador en el
servidor, uno por sesión y fecha, que se retoma si la sesión se corta. El asesorado registra cada serie, con carga,
repeticiones, RIR y esfuerzo, todos opcionales y nunca inferidos, y confirma la sesión como realizada, con desvío o no
realizada. Desde ahí la ejecución es inmutable y el profesional la revisa.

### C-03 · Flujo de antropometría

El profesional prepara una toma: elige el protocolo y carga las mediciones sobre la figura. Lo que guarda queda en un
borrador que todavía no es historia: no entra en la evolución. Registrar es un acto aparte, con su confirmación, y
después la toma no se edita: una corrección o una anulación agregan un registro. Con la toma registrada, el profesional
corre un método del catálogo con su versión; los resultados conviven y BE no elige el mejor. El asesorado ve su
evolución con lo registrado, sin interpolar.

### D-00 · DFD de contexto

BE recibe del profesional sus credenciales y sus indicaciones, como invitaciones, planes, tomas y revisiones, y le
devuelve la sesión, la invitación lista para compartir, la ficha de cada asesorado y las novedades. Del asesorado recibe
credenciales, decisiones, registros y preferencias, y le devuelve el plan, la agenda, su evolución y las novedades. Con
los sistemas externos intercambia lo mínimo: las claves públicas de Google, un aviso sin datos de salud para Expo Push y
una consulta por código a los catálogos abiertos. El responsable de validación pide la TVCC-30 y recibe su resultado.

### D-01 a D-03 · DFD de nivel 1

Primero hay que entrar, que es el proceso 1; vincularse y consentir, el 2; y tener de dónde elegir alimentos, recetas
y ejercicios, el 3. Con eso, el profesional planifica en el 4: el plan queda en D5 y el proceso abierto en D2. Lo que
registran el asesorado y el profesional va a D6, en el 5. La revisión, en el 6, lee D6, escribe su resultado y mueve el
proceso. Cada hecho que alguien tiene que ver deja una novedad en D7, que el proceso 7 entrega y avisa por push. El 8
mide la TVCC-30. Son tres láminas con una sola numeración.

### E-01 · Secuencia de activar un plan

El website pide activar una versión de plan con una clave de idempotencia. La API valida el pedido y abre una sola
transacción, bloqueando esa clave. Si es la primera vez, el servicio le pide la decisión al PDP dentro de la
transacción, y solo si es «permitida» escribe: la instantánea, la versión activada, el proceso y la novedad. Después el
esqueleto común registra la auditoría, la idempotencia guarda la respuesta y todo se confirma junto. Si la clave ya
tenía resultado, el PDP vuelve a decidir antes de devolver lo guardado. El aviso push sale después, fuera de la
transacción.

### E-02 · Secuencia de recuperar la sesión

Al recargar, el website no tiene token: lo pide a la API con una cookie que solo la API puede leer. La API verifica que
el pedido venga del website, busca la sesión por la huella del secreto y la bloquea. Si el secreto es el vigente, lo
rota y devuelve un token nuevo de la misma sesión. Si otra pestaña acaba de rotarlo, vale sin rotar de nuevo. Si es una
copia vieja, revoca la sesión. En cualquier rechazo, borra la cookie y responde 401. El token vive solo en la memoria
de la pestaña.

### E-03 · Estados del vínculo

Una solicitud de vínculo nace pendiente y se resuelve una sola vez: el asesorado la acepta o la rechaza, o el sistema
la da por caducada o inválida, y esos cuatro estados no tienen salida. Aceptarla crea el alcance del vínculo para esa
área, que empieza aceptado. El asesorado o el profesional pueden pausarlo y reanudarlo, y cualquiera de los dos, o el
sistema, puede finalizarlo; finalizado no tiene salida. Cada transición está en una tabla del dominio que el servicio
consulta antes de escribir y que la base refuerza.

### E-04 · Estados del consentimiento, del plan y del proceso

El consentimiento lo decide siempre el asesorado: lo otorga, acepta una versión nueva del texto, lo revoca y lo puede
volver a otorgar. Una versión de plan nace en borrador, se guarda las veces que haga falta y, al activarse, queda
activada para siempre: un ajuste crea otra versión. El proceso operativo se abre al activar un plan sin proceso
abierto, sigue abierto con cada revisión que no finaliza y se cierra por una revisión que finaliza, por el fin del
vínculo o por el cierre de la cuenta. Cerrado, no se reabre.
