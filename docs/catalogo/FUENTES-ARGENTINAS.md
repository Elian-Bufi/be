# Alimentos argentinos que el catálogo base no tiene: de dónde podrían salir

> Encargo de consolidación de Dirección del 2026-10-19, bloque 4 («Pendientes concretos del catálogo»), y DEUDA_LEGAJO
> DL-141 (D-4, «lo que queda»). **Es una propuesta.** No se importó nada, no se escribió nada en ninguna base y no se
> envió ningún pedido de permiso: eso espera la decisión de Dirección. Fuentes consultadas el 2026-10-19.

## Qué falta

SR Legacy (USDA) no tiene registros razonables para varios alimentos de todos los días en la Argentina, y el catálogo
base no los inventa (`prisma/datos/catalogo-base/LEEME.md`):

- **la yerba mate** (ni seca ni como mate cebado);
- **cortes vacunos con su composición propia:** el vacío entero, la entraña gruesa, el cuadril con su colita. Hoy el
  catálogo tiene las piezas de USDA con su nombre fiel (el bife de vacío, la entraña fina, el cuadril sin colita), y la
  tabla de esa correspondencia está en `FUENTES.md`;
- **quesos argentinos:** cremoso, cuartirolo, por salut, reggianito, sardo. El parmesano y el port-salut de USDA son
  otros quesos (por eso se retiraron los nombres «Queso rallado» y «Queso por salut»);
- **otros:** el dulce de membrillo, el matambre, el pejerrey.

## Las opciones

| | ARGENFOODS (UNLu) | SARA 2 (Ministerio de Salud) | Rótulos (Open Food Facts) | Carga del profesional |
|---|---|---|---|---|
| **Qué es** | La tabla de composición de alimentos de la Universidad Nacional de Luján, capítulo argentino de INFOODS (FAO y Universidad de las Naciones Unidas). «Todos los datos que contiene son analíticos o calculados a partir de esos valores» | «SARA 2: Tabla de composición química de alimentos para Argentina. Compilación para ENNyS 2», Dirección de Salud Perinatal y Niñez, julio de 2022 (ISBN 978-950-38-0313-4) | Lo que declara el envase de un producto, cargado por la comunidad | Lo que escribe el profesional (hoy, «Cargado por vos») |
| **Qué trae que nos falta** | Cortes de novillito por pieza (bola de lomo, colita, corazón y tapa de cuadril, asado, nalga, peceto, lomo, bife angosto) y quesos argentinos (cremoso, cuartirolo, por salut, reggianito, sardo, Tandil, Mar del Plata), dulce de leche. No trae la yerba mate ni el vacío ni la entraña | Quesos (cremoso, reggianito), dulce de leche y de membrillo, matambre (fiambre), pejerrey. La carne vacuna va como **promedios por categoría** («Vacuno, cortes grasos/magros/semigrasos, PROMEDIO»), no por pieza. No trae la yerba mate | Productos envasados: yerba mate, dulces, quesos de marca. Uno por código de barras | Cualquier cosa, sin fuente |
| **Carbohidratos** | Dos columnas: «totales por diferencia» = 100 − (agua + proteína + grasa + cenizas) (`CHOCDF` de INFOODS) y «asimilables» = lo mismo menos la fibra. Los totales son **compatibles con lo que ya tiene el catálogo** (USDA «by difference») | Dos columnas: «CHO disponibles» (sin la fibra; es la que usa para la ingesta) y «CHO totales» («se mantendrá para fines comparativos») | Los del rótulo argentino son **disponibles** (sin la fibra) | Los que escriba |
| **Energía** | Factores generales: 4 kcal/g para proteína y carbohidratos, 9 para lípidos | 4 kcal/g sobre los CHO **disponibles**, 4 proteínas, 9 lípidos, 7 alcohol | La del rótulo | La que escriba |
| **Faltantes** | Las tablas de carnes y de lácteos no tienen fibra: quedaría desconocida (`null`), nunca cero | «Valor asumido como cero» para lo que el alimento no suele tener, y en blanco lo que no se pudo estimar | Lo que el rótulo no declara | — |
| **De dónde sale cada valor** | De la base nacional de la UNLu, con trece orígenes declarados: el INTA, el INTI, el INIDEP, el CITEP, seis universidades, la tabla del Instituto Nacional de Nutrición de 1945, la industria y la literatura científica | **Es una compilación:** cada nutriente viene de Argenfoods, de USDA, de la tabla inglesa (CoFID), de FNDDS, de rótulos u otras fuentes (también las tablas alemana, española, brasileña, peruana y del INCAP). La fuente de cada valor se marca **con el color de la celda** del PDF. Lo cocido se estimó con factores de rendimiento y de retención | El producto | El profesional |
| **Condiciones** | «© 2010, Universidad Nacional de Luján. Queda hecho el depósito que establece la ley 11723. No se permite la reproducción total o parcial de esta obra, ni su incorporación a un sistema informático, […] con fines comerciales. Para su uso comercial se deberá requerir el permiso o consentimiento por escrito del titular del derecho de autor». Sin fines comerciales: «se autoriza su uso sin mutilaciones de la obra», citando a los autores, los titulares y la referencia electrónica completa | Sin licencia expresa. El Ministerio dice que difunde «en forma libre y gratuita» las herramientas de la ENNyS «para la comunidad científica y académica». Como compilación, cada valor **arrastra las condiciones de su fuente** (Argenfoods tiene las de la UNLu; la tabla alemana es privativa) | ODbL 1.0, ya integrada (WP-08), con la importación controlada | — |
| **Contacto** | UNLu, Ruta 5 y Avenida Constitución (6700) Luján, Buenos Aires. Correo que publica la tabla: bdca_unlu@yahoo.com.ar; teléfono 02323-420380, interno 391 | Área de nutrición de la Dirección de Salud Perinatal y Niñez del Ministerio de Salud de la Nación (en 2022 coordinaron la actualización Gabriela Figueroa, Guadalupe Mangialavori y Mariela Tenisi). El PDF no publica un correo | — | — |
| **Dónde está** | https://www.argenfood.unlu.edu.ar/ (sin «s»): tablas por grupo en PDF y Excel, actualizadas al 10/01/2011. La dirección con «s» que cita SARA 2 (www.argenfoods.unlu.edu.ar) no tiene un certificado válido y muestra la portada de la UNLu | https://iah.salud.gob.ar/doc/720.pdf (SHA-256 `14706a46e0262e2223b0c44d4c77c31090e3554cf63602fe58ab765f32b81c7f`, 142 páginas). Solo PDF: no encontramos la base en un formato de datos | La API de Open Food Facts | — |

## Antes de mezclar fuentes

- **Carbohidratos totales y disponibles no se suman ni se comparan como si fueran lo mismo.** En el catálogo,
  `carbohydrateG` es hoy el total por diferencia de USDA (incluye la fibra). ARGENFOODS da el mismo total; SARA 2 da los
  dos; un rótulo argentino da el disponible. Pasar de disponible a total (total = disponible + fibra) solo vale si la
  fibra está declarada. Propuesta: entrar siempre el total por diferencia, y si una fuente da solo el disponible,
  declararlo (un campo nuevo del dominio, la base de los carbohidratos) en lugar de convertirlo sin decirlo.
- **La energía no se recalcula.** Cada fuente usa otros factores (USDA, factores específicos por alimento; ARGENFOODS,
  4-4-9; SARA 2, 4-4-9-7 sobre los disponibles). Se guarda la de la fuente y la procedencia dice el método.
- **Un faltante sigue siendo un faltante.** En BE, una fibra ausente quiere decir desconocida, nunca cero. Un «valor
  asumido como cero» de SARA 2 tiene que quedar como asumido, no como medido.
- **Un ítem, una fuente.** Si un alimento necesitara valores de dos fuentes, la procedencia tendría que decir la de
  cada nutriente. SARA 2 lo hace con colores de celda: para usarla habría que pedir la base con esa información, porque
  leer los colores de un PDF no es confiable.
- **Crudo y cocido, con su nombre.** Lo cocido de SARA 2 es calculado (rendimiento y retención); ARGENFOODS es, en su
  mayoría, «fresco, crudo». El nombre dice el estado y la procedencia, si es calculado.

## Qué recomendamos

1. **Pedir permiso a la UNLu para ARGENFOODS**, para los cortes vacunos, los quesos y el dulce de leche argentinos: son
   datos analíticos argentinos, con su autoría clara, y sus carbohidratos son los mismos que ya usa el catálogo. Sus
   condiciones prohíben incorporarlos a un sistema informático con fines comerciales sin permiso escrito, y BE los
   incorporaría a uno.
2. **Consultar al Ministerio por SARA 2** solo si hace falta lo que ARGENFOODS no trae (el matambre, el pejerrey, el
   membrillo): sus condiciones de reutilización y, si las hay, la base con la fuente de cada nutriente.
3. **Mientras tanto**, la yerba mate y lo demás siguen como hoy: un producto envasado por Open Food Facts, o la carga
   del profesional.

**Lo que decide Dirección:** si se pide el permiso, quién lo firma y si el uso de BE es comercial (las condiciones de
ARGENFOODS distinguen los dos casos).

## Borrador del pedido de permiso a la UNLu (sin enviar)

> **Para:** bdca_unlu@yahoo.com.ar — Programa de Composición de Alimentos y Base de Datos de Composición, Universidad
> Nacional de Luján
>
> **Asunto:** Pedido de autorización para usar datos de la Tabla de Composición de Alimentos (ARGENFOODS) en BE
>
> De nuestra consideración:
>
> Les escribimos por BE, [una plataforma de seguimiento nutricional y de entrenamiento para profesionales y sus
> personas — a completar por Dirección: qué es BE y si su uso es comercial]. BE tiene un catálogo de alimentos para que
> el profesional arme planes y recetas; hoy sus datos salen de USDA FoodData Central (dominio público), y cada alimento
> dice su fuente y su licencia donde se elige, con una página pública que reúne las atribuciones.
>
> Nos falta la composición de alimentos argentinos que las tablas extranjeras no describen bien: cortes vacunos (bola
> de lomo, colita, corazón y tapa de cuadril, asado, nalga, peceto, lomo, bife angosto), quesos (cremoso, cuartirolo,
> por salut, reggianito, sardo) y el dulce de leche. Querríamos incorporar, para esos alimentos, los valores de
> energía, proteínas, grasa total, carbohidratos totales por diferencia y fibra de la Tabla de Composición de Alimentos
> de la UNLu, **sin modificarlos**:
>
> - cada alimento citaría a la UNLu y a ARGENFOODS como su fuente, con la referencia electrónica completa, en la
>   pantalla donde se elige y en la página de fuentes;
> - un valor que la tabla no informa quedaría como desconocido, nunca completado;
> - no los republicaríamos como una tabla ni los venderíamos por separado.
>
> Les pedimos su autorización por escrito para ese uso, y que nos digan cómo prefieren que se los cite y si hay
> condiciones que debamos cumplir. Si les sirve, les mandamos la lista exacta de alimentos y cómo se verían en BE.
>
> Muchas gracias.
>
> [Nombre, cargo y contacto de quien firma — a completar por Dirección]

## Borrador de la consulta al Ministerio por SARA 2 (sin enviar)

> **Para:** Área de nutrición, Dirección de Salud Perinatal y Niñez, Ministerio de Salud de la Nación
>
> **Asunto:** Condiciones de reutilización de la Tabla SARA 2
>
> Estamos evaluando usar algunos valores de «SARA 2: Tabla de composición química de alimentos para Argentina.
> Compilación para ENNyS 2» (2022) en BE, [qué es BE — a completar por Dirección], citándola como sugiere la
> propia tabla. Antes queremos saber: ¿con qué condiciones se puede reutilizar? Como la tabla compila datos de varias fuentes,
> ¿existe la base con la fuente de cada nutriente (los colores de las celdas) en un formato de datos? Nos interesan el
> matambre, el pejerrey y el dulce de membrillo. [Firma — a completar por Dirección]
