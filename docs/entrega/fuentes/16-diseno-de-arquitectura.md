# 16 · Diseño de arquitectura

*Cómo está armado BE, dónde corre y cómo viaja una operación, en los niveles del modelo C4.*

> Una sola API decide: las aplicaciones nunca hablan con la base.

**Autor:** Elián Bufi
**Carrera:** Analista de Sistemas, Escuela Da Vinci
**Fecha:** Noviembre de 2026

> **Resumen.** Una app Android y un website hablan con una sola API, un monolito modular en NestJS sobre PostgreSQL, desplegada en Render. La app se firma fuera de la nube. De lo general a lo particular: contexto, contenedores, despliegue y el recorrido de una escritura.

**Entregable:** 16 · Diseño de arquitectura
**Fecha:** Noviembre de 2026
**Lo acompaña:** El .docx editable. El detalle de cada pieza está en los entregables 14 (datos), 15 (clases) y 17 (componentes).

# Resumen

*Qué es esta arquitectura, por qué tiene esta forma y cómo se recorre.*

BE son tres aplicaciones que comparten un solo servidor: la app de la persona, el website del profesional y de Administración, y la API, que es la única que toca la base de datos. Importa porque BE guarda datos de salud: cada escritura tiene que pasar por el mismo control de permiso y dejar la misma auditoría, sin excepciones, y eso es más fácil de garantizar con una sola puerta.

- **3** aplicaciones: app, website y API
- **34** módulos: de un monolito modular
- **335** operaciones: en la especificación OpenAPI
- **1** nube: Render, región Frankfurt

*Fuente: El repositorio: apps/api/src (módulos y controladores), docs/api/openapi.json y prisma/schema.prisma.*

![Figura 1: Los cuatro zooms del modelo C4 y en qué entregable está cada uno. Este documento cubre los dos primeros, más el despliegue](pendiente)

> **La idea clave.** Las aplicaciones nunca hablan con la base: **todo pasa por la API, que autoriza, aplica las reglas y audita en la misma transacción.**

# 1. El sistema en su contexto

*Nivel 1 del modelo C4: quién usa BE y con qué servicios de afuera habla, y qué les manda.*

BE tiene tres roles. La persona usa la app para Android: ve lo de hoy, registra lo que hizo y decide quién ve qué. El profesional trabaja desde el website, pensado para el escritorio. Administración también usa el website, con contraseña y segundo factor obligatorio, y habilita a cada profesional por área sin ver datos de salud.

![Figura 2: BE en su contexto. A la izquierda, los tres roles; a la derecha, los servicios externos y lo único que reciben](pendiente)

Hacia afuera, BE manda lo mínimo. Ningún servicio externo recibe datos de salud: el aviso al teléfono dice solo que hay una novedad, y la app la muestra al abrirla. Lo que llega de los catálogos externos no entra directo: el profesional lo revisa antes de importarlo. GitHub no participa de la operación; guarda el código, verifica cada cambio y construye la app.

# 2. Los contenedores

*Nivel 2: las piezas que se ejecutan por separado, con su tecnología y cómo se comunican.*

**Tabla 1.** Cada contenedor, con su tecnología y su responsabilidad.

| Pieza | Tecnología | Qué hace |
| --- | --- | --- |
| App de la persona | Android · React Native y Expo | Cinco pestañas: Inicio, Nutrición, Entrenamiento, Evolución y Perfil. Guarda la sesión en el almacenamiento seguro del teléfono. |
| Website | Next.js · exportación estática | Escritorio del profesional y Administración. No tiene servidor propio: es un sitio estático que pide todo a la API. |
| API | NestJS · TypeScript | Monolito modular de 34 módulos. Autoriza cada operación, aplica las reglas de cada área y audita en la misma transacción. |
| Base de datos | PostgreSQL 16 · Prisma | 163 tablas. Además de guardar, rechaza por sí misma las escrituras que romperían la historia. |
| Recordatorios | Tarea programada | Tres veces por día le pide a la API que envíe los recordatorios del día. |
| @be/domain | Paquete TypeScript | Contratos de cada operación, textos y reglas puras. Lo compilan la app, el website y la API; de él sale la especificación OpenAPI. |

![Figura 3: Los contenedores de BE. Las flechas van de quien pide a quien responde; ninguna se cruza con otra. El sello «@be/domain» marca las tres piezas que se compilan con el paquete compartido](pendiente)

# 3. Despliegue

*Dónde corre cada pieza y cómo llega un cambio, del repositorio a la nube y del repositorio al teléfono.*

BE corre en Render, en la región Frankfurt. La demostración usa datos sintéticos; para operar con datos reales a escala se suma un ambiente de producción separado, con la misma forma (ver el análisis de viabilidad, 24).

![Figura 4: El despliegue: del repositorio a Render, con la verificación como puerta. Las cuatro piezas de Render están en la misma región y la base solo se alcanza por la red privada](pendiente)

## 3.1 Cómo llega un cambio

1. **Rama y pull request**: Todo cambio se trabaja en una rama y entra por un pull request.
2. **Verificación**: GitHub Actions corre cinco trabajos en cada cambio. Cuatro son obligatorios para entrar (legajo, verificación, integración e imagen); los recorridos en el navegador también corren y se miran antes de integrar.
3. **Despliegue**: Con la rama principal en verde, Render despliega el website, la API y la tarea programada.
4. **Puerta de salud**: La API aplica las migraciones al arrancar y recibe tráfico recién cuando `/health/ready` responde.


## 3.2 Cómo llega la app al teléfono

La app se instala desde el website, y la clave con que se firma nunca sale de la computadora del autor ni se sube a la nube.

1. **Construye**: Una rama de versión dispara en GitHub Actions el paquete Android sin firmar, disponible un día.
2. **Verifica la huella**: En la computadora del autor, su huella SHA-256 se compara con la del registro de la construcción.
3. **Firma**: Se firma con la clave de la app, se verifica y se arma la APK, también firmada.
4. **Publica**: La APK se publica en las releases del repositorio, con su huella; el website ofrece siempre la última.


# 4. Una escritura, paso a paso

*Toda operación que escribe datos de salud recorre el mismo camino, porque lo implementa una sola clase: el ejecutor de dominio.*

Dos consecuencias importan. Primero, no hay escritura sin autorización ni auditoría: si la auditoría falla, la operación no ocurre. Segundo, un permiso que la persona retira mientras alguien escribe se respeta: antes de decidir, la transacción toma en modo compartido las filas que un corte modificaría (la función `be_bloquear_lo_que_corta`), y el retiro las toma en modo exclusivo, así que uno espera al otro y la decisión nunca usa un permiso que ya no existe. Las pruebas de concurrencia lo comprueban de forma determinista, esperando a que la base informe los bloqueos en espera. La respuesta a una operación denegada es la misma que a un recurso que no existe, para no revelar nada.

> **Un reintento no duplica.** Si la conexión se corta y la app reintenta con la misma clave, la API devuelve la respuesta guardada; antes vuelve a decidir el permiso, y si ya no se permite, responde el mismo 404.

![Figura 5: El recorrido de una escritura, por ejemplo activar un plan o registrar una comida. Fuente: apps/api/src/plataforma/ejecutor.ts; el código del diagrama está en las fuentes de esta entrega](pendiente)

# 5. Decisiones de arquitectura

*Cada decisión tiene un motivo y un costo. Quedan explícitos porque son los que hay que revisar si BE cambia de escala.*

> **La idea clave.** El monolito modular no es un atajo: es lo que permite que **una operación entre áreas sea atómica** sin coordinar servicios. Se puede separar en servicios si cambian el equipo, la escala o esa necesidad.

## 5.1 Diez decisiones, con su costo

**Tabla 2.** Las decisiones de arquitectura de BE, por qué se tomaron y lo que cuestan.

| Decisión | Por qué | Lo que cuesta |
| --- | --- | --- |
| Monolito modular | Un equipo de una persona, una escala chica y operaciones que tienen que ser atómicas entre áreas. Una sola transacción evita coordinar servicios. | Un solo despliegue: si la API no arranca, no anda nada. |
| Reglas también en la base | Una escritura que esquive la API (un script, una migración, un error) tampoco puede romper la historia. | Migraciones más complejas y pruebas de integración contra un PostgreSQL real. |
| Historia por adición | Se puede reconstruir qué se sabía en cada momento: nada se edita ni se borra en cascada. | La base crece y las lecturas resuelven cadenas de versiones y correcciones. |
| Contratos compartidos | Un solo lugar define la forma de cada operación y sus textos; la verificación controla que la especificación OpenAPI no se desvíe. | La app, el website y la API se compilan juntos contra el mismo paquete. |
| Website estático | Sin servidor de páginas: menos superficie de ataque, menos costo y una CSP estricta. | Todo dato se pide a la API desde el navegador. |
| App fuera de tiendas | Control total de la firma y publicación inmediata de cada versión. | La instalación es manual y no hay actualización automática de tienda. |
| Render como nube | Despliegue desde el repositorio, base administrada y red privada, sin operar servidores. | Un costo mensual y una sola región. |
| La misma función en todos lados | Las cuentas son del dominio compartido: el cálculo del objetivo da lo mismo en el website y en el servidor, que lo rehace al guardar; la conversión entre RIR y RPE y las cuentas de Kerr, también. Lo guardado es siempre una sola medida (el RIR), así que cambiar la notación nunca reescribe la historia. | Cada regla nueva se escribe en el paquete compartido y se publica con las tres piezas. |
| El mismo 404 para lo ajeno | Un dato que no corresponde responde igual que uno que no existe: ni siquiera se filtra que existe. | Por la respuesta no se distingue un dato ajeno de uno inexistente; lo dice la auditoría. |
| Capacidad declarada del cliente | Un campo nuevo del plan sale solo para la app que declara conocerlo, así la app instalada nunca recibe algo que no sabe mostrar. | Cada campo nuevo pide su declaración y su filtro en la API. |

## 5.2 Lo que está resuelto y lo que no

> **Seguridad y privacidad.** - **Sesiones revocables.** El servidor puede cerrar una sesión en cualquier momento; el website la reanuda con una cookie httpOnly y la app la guarda en el almacenamiento seguro.
> - **Autorización en un solo lugar,** con la misma regla para la app y el website.
> - **Segundo factor** obligatorio para Administración, que decide quién opera en BE. El profesional entra con su contraseña o con Google, con el límite de intentos y sesiones que vencen: es una decisión para no sumarle fricción mientras el código por correo no está.
> - **Datos mínimos hacia afuera:** los avisos no llevan datos de salud y las imágenes pierden sus metadatos.

> **Consistencia y fallas.** - **Concurrencia optimista.** Cada escritura declara la versión que leyó; si otro la cambió antes, hay un conflicto que el cliente muestra.
> - **Escrituras repetibles** con la clave de idempotencia.
> - **Catálogos externos con tiempo máximo:** si no responden, sigue el catálogo propio.
> - **Errores con código estable** y un identificador de pedido para buscarlo en el registro de la API.

> **Para operar a escala.** Para operar con datos reales a escala, la arquitectura suma métricas y alertas, una restauración de la base ensayada y un ambiente de producción separado. Si una migración falla al arrancar, Render sigue sirviendo la versión anterior de la API; la base, en cambio, tiene su propio procedimiento de recuperación, que se ensaya antes de operar.

> **Fuentes.** 1. `render.yaml`: recursos, región, horarios y variables.
> 2. `.github/workflows/`: `ci.yml` (los cinco trabajos), `aab-sin-firma.yml`, `apk.yml` y `capturas-del-tablero.yml`.
> 3. `apps/api/src/app.module.ts`, los controladores y `docs/api/openapi.json`.
> 4. `apps/api/src/plataforma/ejecutor.ts` y `apps/api/scripts/iniciar.sh`.
> 5. La protección de la rama principal: los cuatro controles obligatorios (consultada el 15/11/2026).
