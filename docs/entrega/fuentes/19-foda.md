# 19 · FODA

*Qué tiene BE a favor y en contra, qué pasa afuera que lo empuja o lo frena, y qué se hace con cada cosa.*

> Escrito sin defenderlo: cada debilidad tiene su respuesta y su momento.

**Autor:** Elián Bufi  
**Carrera:** Analista de Sistemas, Escuela Da Vinci  
**Fecha:** Noviembre de 2026

> **Resumen.** Un FODA de BE como producto. Lo fuerte es la historia de la persona entre áreas, con el porqué de cada cambio; lo débil, lo propio de un producto nuevo de un solo autor. Termina en cuatro estrategias y un orden.

**Entregable:** 19 · FODA  
**Fecha:** Noviembre de 2026

# Resumen

*Lo fuerte de BE es la historia de la persona entre áreas. Lo débil, lo propio de un producto nuevo.*

Este FODA mira a BE como producto. Adentro (fortalezas y debilidades) va lo que depende del proyecto y se puede comprobar en el sistema. Afuera (oportunidades y amenazas), lo que pasa en el mercado, en la ley y en la economía, con su fuente.

### F · Fortalezas

- La historia de la persona entre áreas, en el tiempo.
- Cada cambio de plan, unido a lo que pasó.
- Comparativas para encontrar patrones.
- Ayuda a decidir sin decidir: el objetivo calculado muestra el método, la fórmula y la cita, y el profesional decide.

### D · Debilidades

- El precio se fija en el piloto con profesionales.
- Un solo autor sostiene el desarrollo.
- Por ahora, solo Android.

### O · Oportunidades

- Profesionales que atienden en más de un lugar.
- Duplas que hoy se coordinan por mensajería.
- La ley pide consentimiento para datos de salud.

### A · Amenazas

- Competidores maduros, con planes gratis.
- La costumbre: mensajería, planilla y PDF.
- Costos en dólares e ingresos en pesos.

*Figura 1: BE en cuatro cuadrantes. Cada punto se desarrolla en su capítulo.*

> **La idea clave.** El FODA termina en un orden: **primero el piloto con profesionales**, después el precio, y con eso la operación con datos reales.

# 1. El punto de partida

*Qué es BE y qué parte del análisis es un hecho del sistema y qué parte sale de fuentes públicas.*

BE es software para profesionales de nutrición, entrenamiento y antropometría que acompañan a una misma persona a lo largo del tiempo. Cada uno trabaja en su área, todos sobre la misma historia, y la persona decide qué ve cada uno. El principio de producto es ubicar, nunca calificar: BE muestra dónde está la persona respecto de su plan y de sus tomas anteriores, sin juicios.

## 1.1 El circuito que se analiza

El FODA no mira una lista de pantallas sino un circuito. Lo que BE hace bien o mal se entiende en qué paso del circuito ayuda o frena.

1. **Medir**: Evaluación inicial y tomas con protocolo y método con versión.
2. **Planificar**: El profesional arma el plan en el website y lo activa con «Revisar y activar…».
3. **Ejecutar**: La persona ve lo de hoy en la app y registra comidas y sesiones.
4. **Revisar**: El profesional compara lo indicado con lo registrado y decide.
5. **Ajustar**: Crea una versión nueva del plan; la anterior queda como historia.

*Figura 2: El circuito de BE: la columna del producto y de este análisis.*

> **De dónde sale cada cuadrante.** Las fortalezas y las debilidades son hechos del sistema y de cómo se trabaja: se comprueban en el producto y en el código. Las oportunidades y las amenazas se apoyan en fuentes públicas, citadas al final. La voz de los profesionales llega con el piloto, y por eso es el primer paso del orden.

# 2. Fortalezas

*Seis hechos del sistema, cada uno con dónde se ve.*

> **La idea clave.** Ninguna fortaleza es una promesa: todas se pueden abrir en el producto o leer en el código.

## 2.1 Lo que BE ya tiene

![Figura 3: Las seis fortalezas, con la evidencia y el entregable donde se ve en detalle](pendiente)

> **Texto de la figura:**
> - F1
> - La historia de la persona entre áreas
> - Nutrición, Entrenamiento y Antropometría sobre la misma persona y el mismo eje del tiempo: el profesional entiende el cuerpo como un sistema y no arranca de cero en cada plan.
> - 03 Acta · 09 Manual del profesional
> - F2
> - Cada cambio de plan, unido a lo que pasó
> - Un plan activado queda como versión, lo registrado va aparte y corregir no borra: se ve cómo cada cambio fue afectando a la persona. Lo garantiza la base de datos, no solo la aplicación.
> - 14 DER · 15 Diagrama de clases
> - F3
> - Comparativas para encontrar patrones
> - Gráficos de distintas áreas, alineados o superpuestos sobre el mismo eje, con la frase que aclara que coincidir no es causar.
> - 12 RF Web · 09 Manual del profesional
> - F4
> - La historia sigue a la persona
> - La persona decide quién ve cada área y, si cambia de profesional, puede autorizar al nuevo a ver su historia anterior.
> - 13 RF Mobile · 10 Casos de uso
> - F5
> - Ubica, no califica
> - Ni calificaciones ni colores que juzguen. La evolución se muestra con valores y diferencias escritas, y la persona registra sin miedo a quedar en falta.
> - 09 Manual de la persona
> - F6
> - Calidad verificable y costo bajo
> - Cada requisito se sigue hasta su prueba, y cada cambio pasa por tipos, pruebas y recorridos en el navegador. La infraestructura en la nube cuesta poco.
> - 11 Casos de prueba · 24 Análisis de viabilidad

## 2.2 Por qué estas y no otras

Quedó afuera lo que cualquier producto del rubro tiene (una app para la persona, un panel para el profesional), y quedó lo que cuesta copiar. F1 y F2 son las que más pesan: leer a la persona entre áreas y a lo largo del tiempo, con cada cambio unido a lo que pasó, es una decisión de diseño que atraviesa la base de datos entera, no una función que se agrega al final.

**Tabla 1.** Cada fortaleza, en qué paso del circuito ayuda.

|   | Fortaleza | Dónde se nota en el circuito |
| --- | --- | --- |
| F1 | La historia entre áreas | En todos los pasos: cada medición, plan, registro y revisión cae en la misma historia. |
| F2 | Cada cambio, unido a lo que pasó | Planificar y ajustar: el plan activado no se toca; ajustar crea una versión nueva y la anterior queda con lo que se registró. |
| F3 | Comparativas | Revisar: el profesional compara períodos y áreas antes de decidir. |
| F4 | La historia sigue a la persona | Medir y revisar: el profesional nuevo empieza con contexto, si la persona lo autoriza. |
| F5 | Ubica, no califica | Ejecutar: la persona registra sin miedo a quedar en falta. |
| F6 | Calidad y costo | Fuera del circuito: cada cambio se verifica antes de entrar, y se puede arrancar chico. |

# 3. Debilidades

*Siete, ordenadas por cuánto frenan hoy, no por comodidad.*

> **La idea clave.** La debilidad que más condiciona a las demás es la primera: **el precio y la adopción se fijan con profesionales reales, en el piloto**.

## 3.1 Las siete

**Tabla 2.** Las debilidades y por qué importan.

|   | Debilidad | Por qué importa |
| --- | --- | --- |
| D1 | El precio y la adopción se fijan en el piloto | El problema sale de la experiencia del autor como coach; los ARS 35.000 por mes son una referencia para hacer cuentas, no una respuesta del mercado. El piloto con profesionales los confirma o los corrige. |
| D2 | Un solo autor | Construir, sostener, dar soporte y vender depende de una persona. Para crecer hace falta sumar a alguien al equipo. |
| D3 | El alta del profesional pasa por Administración | El profesional no se registra solo: Administración verifica la matrícula fuera de BE y lo da de alta con su fundamento. Es más seguro con datos de salud, pero cada alta es trabajo manual. |
| D4 | Solo Android | No hay versión para iPhone. Toda persona con iPhone queda afuera y, con ella, su profesional, que no va a usar dos sistemas. |
| D5 | Operar con datos reales pide condiciones propias | Con datos reales hacen falta la revisión legal, un ambiente de producción separado y una restauración de la base probada. |
| D6 | Presencia mínima | Sin publicación en Google Play: la app se instala desde un archivo descargado. |
| D7 | Menos funciones comerciales que la competencia | Sin turnos, cobros, videollamada, chat ni conexión con relojes. Es una decisión de alcance, pero en una comparación de listas de funciones BE pierde. |

## 3.2 Cuáles van primero

Para ordenarlas, cada una se ubica en dos ejes: cuánto frena a BE como producto y cuánto tarda resolverla. Es una lectura, no una medición, y está escrita para que se pueda discutir.

![Figura 4: Las debilidades según cuánto frenan hoy y cuánto tarda resolverlas. Arriba a la izquierda, lo que conviene atacar primero](pendiente)

> **Texto de la figura:**
> - Primero
> - Con un plan
> - De paso
> - Cuando haga falta
> - CUÁNTO FRENA HOY →
> - **D1**Precio y adopción, en el piloto
> - **D3**Alta por Administración
> - **D5**Condiciones para operar con datos reales
> - **D2**Un solo autor
> - **D4**Solo Android
> - **D6**Presencia mínima
> - **D7**Menos funciones comerciales
> - SE RESUELVE EN SEMANASLLEVA MESES →

D1 se resuelve en semanas con el piloto y ordena todo lo demás: es el primer paso. D3 se alivia con un circuito de alta claro. D5 y D2 llevan meses, así que tienen un plan propio (la revisión legal, un ambiente de producción, alguien más en el equipo). D6 se resuelve de paso, al publicar en Google Play. D7 no se ataca: es una decisión de alcance, y el benchmarking (22) muestra que competir por cantidad de funciones es perder; la respuesta está en la estrategia FA (Figura 6).

# 4. Oportunidades

*Cinco cosas que pasan afuera y empujan a favor, cada una con su dato y su fuente.*

> **La idea clave.** Los profesionales trabajan cada vez más repartidos y entre áreas, y hoy se coordinan por mensajería: **la historia de la persona no tiene dónde vivir**.

## 4.1 Los datos

- **9.721** profesionales de nutrición: respondieron el censo de 2023
- **56 %** tenía más de un empleo: entre quienes trabajaban
- **43,8 %** trabaja en consultorio particular: el lugar más mencionado
- **66,1 %** de las personas adultas: con exceso de peso
- **44,2 %** con actividad física baja: en la misma encuesta
- **0 de 9** productos relevados: dejan a la persona decidir el acceso por área

*Fuente: Censo Nacional de Profesionales en Nutrición 2023 (Diaeta, 2025). 4.ª Encuesta Nacional de Factores de Riesgo (INDEC, 2019). Relevamiento propio de nueve productos (20/10/2026).*

## 4.2 Las cinco

**Tabla 3.** Las oportunidades y lo que cada una significa para BE.

|   | Oportunidad | Qué dice el dato y qué significa |
| --- | --- | --- |
| O1 | Profesionales con el trabajo repartido | En el censo de nutrición de 2023 el lugar más mencionado fue el consultorio particular y más de la mitad tenía más de un empleo. Quien atiende en varios lugares necesita tener el seguimiento en uno solo. |
| O2 | Demanda de acompañamiento sostenido | Dos de cada tres personas adultas tienen exceso de peso y más de cuatro de cada diez hacen poca actividad física. No mide disposición a pagar, pero sí el tamaño del problema de fondo. |
| O3 | La competencia cobra en dólares | Las plataformas internacionales cobran entre USD 49 y USD 69 por mes para 20 personas; la local relevada cobra ARS 15.000, pero se centra en el consultorio de nutrición. Hay lugar para un precio en pesos con tres áreas. |
| O4 | Duplas que hoy se coordinan por mensajería | Una nutricionista y un entrenador que acompañan a la misma persona no tienen dónde ver juntos su historia, con el permiso de ella. En los nueve productos relevados, el acceso lo decide el profesional o quien administra la cuenta. |
| O5 | La ley pide consentimiento para datos de salud | La Ley 25.326 considera sensibles los datos de salud y exige consentimiento libre, expreso e informado. BE ya pide el consentimiento por área y lo registra. |

> **Lo que estos datos no dicen.** El censo no cubre todo el país y la participación fue voluntaria. La encuesta de factores de riesgo mide el problema, no si alguien pagaría por acompañamiento. Por eso O1 y O2 orientan el piloto y no un pronóstico de ventas.

# 5. Amenazas

*Seis riesgos de afuera. Para cada uno, desde cuándo pesa y qué se hace.*

> **La idea clave.** La amenaza más cara no es un competidor: es **un incidente con datos de salud**. Por eso BE opera con datos reales solo con la revisión legal y un ambiente de producción separado.

## 5.1 Las seis

**Tabla 4.** Las amenazas, cuándo pesan y la respuesta de BE.

|   | Amenaza | Cuándo pesa | Qué hago |
| --- | --- | --- | --- |
| A1 | Competidores maduros | Desde el primer día | Tienen años de producto y planes gratis para empezar (ABC Trainerize, Everfit, Practice Better y MediFlow). BE no compite por cantidad de funciones sino por la historia de la persona entre áreas, con el porqué de cada cambio. |
| A2 | La costumbre | Desde el primer día | Mensajería, planilla y PDF no cuestan nada y todos los saben usar. BE baja el costo de empezar: invitación con un link, un QR o un código, y registro en pocos toques para la persona. |
| A3 | Costos en dólares, ingresos en pesos | Al cobrar | La infraestructura se paga en dólares; con ingresos en pesos, el tipo de cambio mueve el margen. El costo de la infraestructura es chico y se revisa en cada cambio de precio. |
| A4 | Un incidente con datos de salud | Con datos reales | Permiso por área en cada operación, registro de quién hizo qué y segundo factor para Administración; el profesional entra con su contraseña o con Google, con límite de intentos. Para operar con datos reales: la revisión legal y un ambiente de producción separado. |
| A5 | Dependencia de proveedores | Desde el primer día | BE depende de Render (servidor y base), de Google (acceso con la cuenta y la tienda) y de Expo (avisos al teléfono). Cambiar de proveedor es posible pero lleva trabajo; se revisa cuando cambian sus precios o sus políticas. |
| A6 | Planes automáticos con IA | Al crecer | Si se instala la idea de que el profesional sobra, BE compite cuesta arriba. La respuesta es la propuesta misma: BE no decide por el profesional, le ordena la información. |

## 5.2 Desde cuándo pesa cada una

![Figura 5: Las amenazas en el tiempo: cuáles pesan hoy y cuáles aparecen al crecer](pendiente)

> **Texto de la figura:**
> - Hoy
> - A1, A2 y A5
> - Competidores maduros, la costumbre y los proveedores: pesan desde el primer profesional.
> - Al cobrar
> - A3
> - El tipo de cambio entra en la cuenta con el primer ingreso.
> - Al salir a competir
> - A6
> - La comparación con los planes automáticos pesa cuando BE salga al mercado.
> - Con datos reales
> - A4
> - El riesgo de un incidente es el más caro: por eso va último y con condiciones.

# 6. Qué se hace con esto

*El FODA sirve si termina en decisiones: cada cuadrante, cruzado con los demás, y un orden.*

> **La idea clave.** BE no compite por cantidad de funciones. Compite por **la historia de la persona entre áreas**: cada cambio con su porqué, las comparativas en el tiempo y la continuidad, ubicando sin calificar.

## 6.1 Las cuatro estrategias cruzadas

![Figura 6: La matriz de estrategias: cada cruce, con los puntos del FODA que combina](pendiente)

> **Texto de la figura:**
> - Con las fortalezas
> - Con las debilidades
> - Ante las oportunidades
> - Atacar · FO
> - Presentar BE a duplas que ya comparten personas
> - El mensaje no es «otra app»: es «tu plan, lo que la persona registró y sus tomas, en una ficha, con el permiso de ella».
> - F1F4O4O5
> - Corregir · DO
> - Fijar el precio con el piloto, antes de sumar funciones
> - Entrevistas a profesionales con el buyer persona como guion, y las cuatro preguntas de precio en pesos.
> - D1O1O3
> - Ante las amenazas
> - Defender · FA
> - No competir por cantidad de funciones
> - Competir por lo que los demás no hacen: la historia entre áreas, el porqué de cada cambio y ubicar sin calificar.
> - F1F2F5A1A6
> - Cuidarse · DA
> - Crecer con datos reales con sus condiciones
> - La revisión legal y un ambiente de producción separado, antes de operar con datos reales.
> - D5A4

## 6.2 El orden

1. **El piloto**: Cinco a ocho profesionales con sus personas, para confirmar el uso y el rango de precio (D1).
2. **Precio y modelo**: Con las respuestas, elegir suscripción, tramos o un monto por persona (O3).
3. **Duplas**: Presentar BE a duplas que ya comparten personas (F1 y O4).
4. **Datos reales**: Revisión legal y ambiente de producción separado (A4 y D5).

*Figura 7: Qué va primero: cada paso habilita al siguiente.*

La demostración usa datos sintéticos. El detalle de cada paso está en el mapa de empatía (20), el buyer persona (21) y el análisis de viabilidad (24).

> **Fuentes.** 1. Barbero L. y otros. «Censo Nacional de Profesionales en Nutrición. Resultados de 2023». *Diaeta* (B. Aires) 2025;43:e25043011. diaeta.aalen.org.ar/index.php/2022/article/view/101 (consultado el 20/10/2026). El censo no cubre todo el país y la participación es voluntaria.
> 2. INDEC y Secretaría de Gobierno de Salud. «4.° Encuesta Nacional de Factores de Riesgo. Resultados definitivos», octubre de 2019. indec.gob.ar/ftp/cuadros/publicaciones/enfr_2018_resultados_definitivos.pdf (consultado el 20/10/2026).
> 3. Ley 25.326 de Protección de los Datos Personales, artículos 2 y 5. argentina.gob.ar/normativa/nacional/64790/texto (consultado el 12/11/2026).
> 4. Páginas de funciones y de precios de cada producto, relevadas el 20/10/2026 y el 12/11/2026 y revisadas el 13/11/2026. Detalle y enlaces en «22 Benchmarking».
