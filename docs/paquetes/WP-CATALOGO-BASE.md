# WP-CATALOGO-BASE — El catálogo base de ejercicios y alimentos, los nombres alternativos y lo importado para todos · definición del paquete

> **Lo que aprobó Dirección el 2026-10-16** (tanda 3, entera):
> - «lo importado de OFF y de wger queda para todos los profesionales, con su fuente»;
> - una tabla de nombres alternativos para ejercicios y alimentos: castellano, el de otros países y el inglés;
> - un catálogo base sólido: 300 a 500 alimentos frecuentes en Argentina y 150 a 250 ejercicios, de fuentes libres citadas, empezando por entrenamiento con wger;
> - el orden: primero el buscador (DL-139), después este paquete.
>
> **Legajo:**
> - **04 RF-060:** la importación controlada, con revisión del profesional.
> - **05 UC-I07:** la corrección no oculta la fuente.
> - **06 REG-06-99 a 101 y REG-06-112:** el elemento de catálogo, sus versiones solo agregadas y la instantánea que no se reescribe.
> - **06 INV-06-143:** el catálogo no es una recomendación ni una prescripción.
> - **08:** las licencias de los proveedores.
> - **DL-097, DL-098 y DL-099:** la importación de WP-08.
>
> **Decisiones:** DEUDA_LEGAJO DL-141. El buscador es DL-139 y las notas de coordinación, DL-140.

## 1. Lo que hay hoy

- **El catálogo sembrado es sintético**, de demostración: unos pocos ejercicios y alimentos con la nota «Catálogo de demostración: no es una recomendación ni una prescripción». Lo usan la cohorte, las pruebas y los planes que ya existen.
- **Lo importado es de quien lo importó.** Un ejercicio de wger o un alimento de Open Food Facts que un profesional revisa e incorpora (WP-08, `CONTROLLED_IMPORT`) lo ve solo él. Otro profesional que quiere el mismo ítem lo importa de nuevo, y quedan dos.
- **No hay nombres alternativos.** «Press de banca» no aparece si se busca «bench press», y la «palta» no aparece buscando «aguacate».

## 2. Lo que cambia

**Para el profesional:**
- **El buscador encuentra mucho más**, de fuentes reconocidas, cada ítem con su fuente a la vista («wger · CC BY-SA 4.0»).
- **Lo que importa otro profesional también le sirve,** sin repetir la revisión. Si importa algo que ya está, BE le ofrece el que hay.
- **Busca con el nombre que conoce:** el castellano de acá, el de otro país o el inglés.

**Para la persona:** no cambia nada a la vista. Su plan cita el mismo ítem, con su nombre.

## 3. Las decisiones (DL-141), con sus alternativas

- **D-1 · Lo importado es de todos los profesionales.**
  - Un ítem `CONTROLLED_IMPORT` se ve para todos, con su proveedor, su licencia y quién lo revisó.
  - Hay uno solo por ítem externo (proveedor más identificador externo). Si un profesional importa uno que ya está, la resolución de su candidato apunta al existente: no se crea otro.
  - *Alternativas descartadas:*
    - seguir por profesional (duplica la revisión y los ítems);
    - que lo importado pase a todos recién después de una revisión de BE (no hay nadie que la haga).
- **D-2 · Los nombres alternativos van en su propia tabla.**
  - Cada nombre alternativo de un ejercicio o de un alimento lleva su idioma (`es`, `en`) y, si corresponde, su región (`AR`, `ES`, `MX`…), y de dónde salió: el proveedor, el catálogo base o un profesional.
  - Solo se agregan. Retirar un nombre es un hecho nuevo.
  - El buscador (DL-139) busca también en ellos. La pantalla muestra el nombre principal y, si se encontró por otro, cuál: «Press de banca (bench press)».
  - *Alternativas descartadas:*
    - una lista dentro de la versión del ítem (versionar un nombre alternativo obligaría a versionar el ítem);
    - un campo «nombre en inglés» (se queda corto con los otros países).
- **D-3 · El catálogo base de entrenamiento sale de wger.**
  - Entre 150 y 250 ejercicios frecuentes de wger, cada uno con la licencia que wger declara para esa entrada (Creative Commons; en general, CC BY-SA). Un ejercicio sin licencia declarada no entra. Cada uno lleva:
    - el nombre en castellano: la traducción de wger, revisada, o una propia marcada como tal;
    - el inglés como nombre alternativo;
    - la categoría y los músculos que declara wger.
  - Van como `CONTROLLED_IMPORT` del proveedor WGER, con la licencia y la atribución de cada uno. Las imágenes no entran, porque también tienen licencias por entrada.
  - Se cargan con una migración de datos desde un archivo del repositorio, revisable en el PR, y no se consultan a wger al arrancar.
  - *Alternativas descartadas:*
    - pedirlos a wger en vivo (depende de su disponibilidad y no queda revisado);
    - un catálogo propio escrito a mano (sin fuente citable).
- **D-4 · El catálogo base de alimentos usa la composición de USDA FoodData Central,** que es de dominio público (CC0 1.0; USDA pide citarla como fuente). Lleva nombres curados en castellano rioplatense y el inglés como nombre alternativo.
  - Son entre 300 y 500 alimentos frecuentes en Argentina, crudos o en preparaciones simples.
  - Si un alimento no tiene un equivalente razonable, no entra: no se inventa una composición.
  - *Alternativas descartadas:*
    - la tabla argentina (ARGENFOODS, Universidad Nacional de Luján): no publica una licencia que permita redistribuirla, así que queda para cuando haya permiso de sus autores;
    - Open Food Facts como base: son sobre todo productos de marca, con composición desigual. Sigue disponible para importar uno puntual.
- **D-5 · Lo sintético de demostración se queda,** porque lo citan los planes de la cohorte y de las pruebas. El catálogo base convive con lo sintético.
  - *Alternativa descartada:* retirarlo. Las instantáneas no se reescriben (REG-06-112), así que retirar no cambia nada de lo que ya se citó, pero confunde a la cohorte.
- **D-6 · Las fuentes, a la vista:**
  - cada ítem dice su fuente y su licencia («wger · CC BY-SA 3.0», «USDA FoodData Central · dominio público»);
  - una página «Fuentes del catálogo» reúne las atribuciones que piden las licencias.

## 4. Lo que no entra

- Imágenes de wger, ni composición de productos de marca en el catálogo base.
- Recomendar ejercicios o alimentos (INV-06-143): el catálogo es para elegir, no sugiere.
- La búsqueda en vivo dentro de los proveedores (DL-098), que sigue como está.

## 5. Pruebas

- **Integración:**
  - lo importado lo ve otro profesional;
  - importar lo mismo dos veces no crea un segundo ítem;
  - un nombre alternativo encuentra el ítem;
  - la migración del catálogo base es idempotente y respeta las cadenas de versiones;
  - la persona sigue viendo su plan igual.
- **Contenido:** una prueba que recorre el archivo del catálogo base y exige, en cada ítem, fuente, licencia, nombre en castellano y, en los alimentos, una composición completa.

## 6. Estado (2026-10-17)

Va después del buscador (DL-139), en tres tramos:
1. **D-1 y D-2: IMPLEMENTADO** el 2026-10-17 en `wp-catalogo-base-1`, sobre `wp-busqueda` (#177), sin integrar. Lo importado es de todos, uno por ítem externo, y el buscador usa los nombres alternativos, con una siembra chica para el catálogo de demostración. Lo que hubo que decidir para implementarlo (D-1.a a D-1.g, D-2.a y D-2.b), el contrato, la base y las pruebas están en DEUDA_LEGAJO DL-141. Lo que falta de D-6 (la licencia en cada fila y la página de fuentes) va con los tramos 2 y 3.
2. el catálogo de entrenamiento;
3. el de alimentos.
