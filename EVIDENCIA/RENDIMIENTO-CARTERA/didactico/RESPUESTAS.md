# Respuestas de las tres preguntas (lámina 6 de «La cartera, leída por conjuntos»)

Aparte, para mirarlas después de intentar.

## 1. 120 personas en Nutrición, 40 de ellas también en Entrenamiento

- **Transacciones del PDP:** 120 antes y 120 después. El PDP decide **por persona** (no por par): una transacción por
  persona, con los tres alcances del catálogo adentro y tres filas de decisión. Eso no cambia con la propuesta.
- **Sentencias del paso 3, antes:** hay 160 pares permitidos (120 de Nutrición + 40 de Entrenamiento) y cada par costaba
  entre 5 y 7 consultas (el plan y su versión efectiva, el borrador, el Proceso, la expectativa si hay Proceso, la
  solicitud y la actividad): del orden de **1.000** sentencias.
- **Sentencias del paso 3, después:** una por tipo de hecho para toda la cartera, con los dos alcances presentes: dos de
  borradores (una por alcance de plan), una de Procesos abiertos, una de expectativas, una de solicitudes, dos de
  actividad (comidas y sesiones), más BEGIN y COMMIT: **unas once**, cualquiera sea la cantidad de personas. (Si ninguna
  persona tuviera Antropometría, las consultas de ese alcance no se hacen.)

## 2. Una persona permitida en Nutrición y denegada en Entrenamiento

- Su identificador entra **solo en las consultas de Nutrición**: los borradores de plan nutricional, los Procesos y
  solicitudes con `alcance = NUTRICION`, y la actividad de comidas. No entra en las de Entrenamiento (borradores de plan
  de entrenamiento, Procesos y solicitudes de ese alcance, sesiones) ni en las de Antropometría, porque cada consulta
  recibe la lista de asesorados que el PDP permitió **en ese alcance** (`ids[alcance]`).
- Importa más que filtrar después por dos razones. Una de garantía: lo que no está permitido no se lee de la base, así
  que no existe un instante en que la API tenga en memoria datos de un área denegada (la regla del 08: cada acceso a
  datos de salud pasa por una decisión positiva; «traer todo y filtrar» sería leer sin decisión). Y una de costo: leer de
  más para tirarlo es trabajo que crece con lo denegado, y las carteras con cortes serían más lentas, no más rápidas.

## 3. «Calcular la cartera una vez y servir las páginas siguientes de lo calculado»

- Choca con la regla de **decidir en cada pedido, sin caché de autorización** (08 §27.3 y 08:601: prohibido reutilizar
  una decisión previa que no refleje una revocación reciente). Servir la página 2 de lo calculado en la página 1 es servir
  datos con las decisiones de la página 1.
- Con una revocación entre la página 1 y la página 2: hoy, la página 2 vuelve a decidir por cada persona y la revocada
  **desaparece** (y `partialView` lo avisa). Con la cartera calculada una vez, la página 2 seguiría mostrando a esa
  persona hasta que el cálculo caducara: una ventana de acceso después de la revocación, que es exactamente lo que el
  diseño del PDP evita. Por eso esa alternativa está en «lo que queda como propuesta» y es una decisión de Dirección y
  del legajo, no una optimización.
