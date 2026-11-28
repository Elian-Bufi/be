# Referencias de notación y composición — consulta del 2026-10-20

> Las indicadas por Dirección en el encargo, abiertas por un agente de consulta web el 2026-10-20 (HTTP 200, sin
> redirección, salvo lo aclarado). Se registra qué enseña cada una y qué decisión gráfica de la tesis respalda. Lo que no
> se pudo abrir se declara: no se afirma haber consultado nada más.

## 1. Fuentes y lo que aportan

| Fuente | Abierta | Qué se tomó |
|---|---|---|
| OMG, *Unified Modeling Language 2.5.1* — https://www.omg.org/spec/UML/2.5.1 | sí (índice) | Versión 2.5.1, «Document Status: formal», «Publication Date: December 2017»; documento normativo `formal/17-12-05` (https://www.omg.org/spec/UML/2.5.1/PDF). **El PDF no se pudo abrir con la herramienta de consulta** (supera su límite de 10 MiB): las reglas UML puntuales se contrastan contra el PDF cuando se descarga y se lee por cláusula (ver §3) |
| C4, *Diagram review checklist* — https://c4model.com/diagrams/checklist | sí | 21 preguntas: título; tipo y alcance comprensibles; leyenda; nombre, tipo, responsabilidad y tecnología de cada elemento; significado de siglas, colores, formas, íconos, bordes y tamaños; cada flecha con rótulo de intención que coincida con su dirección y, cuando aplica, con su tecnología; significado de puntas y estilos de línea |
| C4, *Notation* — https://c4model.com/diagrams/notation | sí | Notación independiente; cada diagrama debe entenderse solo; título con tipo y alcance; leyenda; tipo explícito y descripción corta por elemento; tecnología en contenedores y componentes; líneas unidireccionales con rótulo específico (evitar «Uses»); colores consistentes entre diagramas y legibles en blanco y negro y con daltonismo |
| C4, *Container diagram* — https://c4model.com/diagrams/container | sí | Zoom dentro del límite de un solo sistema; un contenedor es una aplicación o un almacén de datos; personas y sistemas vecinos como apoyo; no muestra despliegue (agrupamiento, réplicas): para eso, un diagrama de despliegue por ambiente |
| C4, *Deployment diagram* — https://c4model.com/diagrams/deployment | sí | Instancias de sistemas y contenedores sobre nodos de despliegue de un ambiente (producción, staging, desarrollo); nodos anidables (PaaS, contenedor, servidor de base de datos); los íconos de proveedor van en la leyenda |
| draw.io, *Entity relationship tables* — https://www.drawio.com/docs/diagram-types/entity-relationship-tables/ | sí | Entidades como tablas con filas de PK y FK; la notación más común es pata de gallo; no fija estilos |
| draw.io, *UML class diagrams* — https://www.drawio.com/docs/diagram-types/uml/class-diagrams/ | sí | Tres compartimentos (nombre; `atributo: tipo`; `operación(parámetro: tipo): tipo`); visibilidad + - # ~; herencia con triángulo abierto en la clase padre; realización punteada con triángulo; dependencia punteada con flecha abierta; agregación con rombo vacío y composición con rombo lleno del lado del todo; multiplicidades como rótulos |
| PlantUML, *Use case diagram* — https://plantuml.com/use-case-diagram | sí | Actores y casos; agrupación con `rectangle` o `package`; `include` y `extends` con línea punteada y flecha; generalización con triángulo; «left to right direction» suele leerse mejor |
| PlantUML, *Component diagram* — https://plantuml.com/component-diagram | sí | Componentes, interfaces como círculo, dependencias punteadas con rótulo, paquetes y nodos como agrupación, puertos; notación UML 2 por defecto |
| draw.io, *Data flow diagrams* — https://www.drawio.com/docs/diagram-types/data-flow-diagrams/ | sí | Entidad externa como rectángulo, proceso «usually a circle», almacén como rectángulo abierto, flujo como conector con flecha; las flechas son datos, no control; sin rombos de decisión; numeración opcional; nivel 0 = contexto |
| Wikipedia, *Data-flow diagram* (rev. 17/02/2026) — https://en.wikipedia.org/wiki/Data-flow_diagram | sí | Numeración jerárquica (1.1, 1.2…; 2.1.1…) que se mantiene entre niveles; consistencia: cada almacén con entrada y salida y los flujos de un nivel presentes en el diagrama que lo describe; contexto con un único proceso; atribución de la notación a DeMarco (1979) y a Gane y Sarson (1979), libros que **no se consultaron** |
| uml-diagrams.org | **no** | Falla de certificado TLS; no se usó |

## 2. Decisiones gráficas que respaldan

| Decisión de la tesis | Respaldo |
|---|---|
| Cada lámina con título (tipo y alcance), leyenda con muestras reales y rótulo de intención y tecnología en cada relación | C4 checklist y notation |
| El significado no depende solo del color: trazo continuo = BE, discontinuo = externo, punteado = pendiente; el énfasis usa grosor | C4 notation (impresión en blanco y negro y daltonismo) |
| Contenedores (ARQ-02) sin detalles de despliegue; el despliegue real del ambiente `test` en una lámina aparte (ARQ-03) | C4 container y deployment |
| DER en pata de gallo, con PK y FK como filas | draw.io ER |
| Clases en tres compartimentos, visibilidad, triángulo vacío para generalización, rombos del lado del todo | draw.io class (a contrastar con UML 2.5.1) |
| Casos de uso con el sistema como rectángulo límite, include y extend punteados con palabra clave y lectura de izquierda a derecha | PlantUML use case (a contrastar con UML 2.5.1) |
| DFD con la notación de Yourdon y DeMarco (procesos circulares numerados, almacenes abiertos, entidades rectangulares), numeración jerárquica y balanceo entre el contexto y el nivel 1 | draw.io DFD y Wikipedia; el balanceo se declara como regla de la tesis |

## 3. Diferencias entre ejemplos y notación formal

- C4 pide relaciones unidireccionales y rotuladas; el ejemplo de clases de draw.io admite asociaciones sin rótulo y
  bidireccionales. La tesis rotula siempre en C4 y usa multiplicidades en clases.
- PlantUML muestra dos formas de «extends». La tesis sigue la forma de UML: línea punteada desde el caso que extiende
  hacia el extendido, con «extend».
- El almacén de un DFD es un rectángulo abierto en draw.io y «two horizontal lines» en Wikipedia; la tesis usa el
  rectángulo abierto con su identificador (D1, D2…), que se lee igual.
- **Pendiente de contraste:** las reglas puntuales de UML 2.5.1 (casos de uso, componentes, clases, estados, actividades
  e interacciones) se verifican contra el PDF normativo descargado; hasta entonces, la tesis no cita cláusulas.
