# Tesis v1 de BE: informe final

**Fecha:** 2026-10-20. **Rama:** `mesa/tesis-v1` (documental, sin integrar a `main`). **Versión del producto que se
describe:** `main` `0fb1bff`, desplegada en el ambiente test.

## Dónde estamos

La primera versión profesional de la tesis y la base de la defensa están terminadas y revisadas tres veces. Lo que
falta son datos que solo puede poner Dirección (integrantes, correos, mes y año, Gantt y enlaces) y las pruebas en el
teléfono.

## Qué se entregó

| Pieza | Dónde | Estado |
|---|---|---|
| Documento público: los 14 apartados de «Entregables» 2025.05 en su orden, anexos A a L, rótulo, índice navegable y numeración | `salida/BE-tesis-v1.pdf` | Listo; los apartados 10 a 13 conservan sus campos «Pendiente de incorporación en el cierre» |
| Versión de evaluación: lo mismo, con el logotipo de la escuela, la nómina, los correos y las credenciales | `C:/Users/bufim/BE-datos-locales/tesis/salida/BE-tesis-v1-evaluacion.pdf` (fuera del repositorio) | Compila; los correos y el mes siguen vacíos hasta que Dirección los cargue |
| 44 láminas: arquitectura (C4), componentes, clases, casos de uso, DER, flujo integral, flujos por área con carriles, DFD de contexto y de nivel 1, secuencias y estados | `laminas/fuentes/` (una fuente por lámina) y `laminas/exportaciones/` (SVG, PDF y PNG) | Sin hallazgos de la revisión automática; revisadas a ojo a tamaño real |
| Datos del documento, leídos del código y del legajo | `datos/`, generados por `herramientas/` | Al día con `0fb1bff` |
| Base de la defensa: guion con tiempos, demo de siete minutos con plan B, 22 preguntas con respaldo, presentación 16:9 con notas | `defensa/` y https://claude.ai/artifact/9LiufGdUTJjAbEonGT8t2U (privada) | Lista; la presentación se comparte desde su menú |
| Verificaciones contra test del 2026-10-20, con sus guiones | `evidencia/remota/2026-10-20/` | Sesión (Chrome y Edge), borradores (Chrome) y recetas (por la API) |
| Registro de avance | `PROGRESO.md` | Al día |

## Cómo se revisó

1. **Cobertura académica.** Los 14 apartados de la escuela, en su orden, y los nueve puntos del acta; el anexo A
   lleva la lista de control con el estado de cada criterio.
2. **Consistencia técnica.** Cada cifra se comparó con su fuente: el esquema y una base temporal con las 51
   migraciones (113 tablas, 212 claves foráneas, 275 disparadores), el contrato publicado (191 operaciones en 30
   familias), los casos de prueba (59 de DV-05: 42 pasan en la CI, 9 en parte, 8 no ejecutables) y el registro de
   decisiones. Las referencias cruzadas entre apartados, anexos y láminas se recorrieron una por una.
3. **Calidad visual y editorial a tamaño real.** Un revisor editorial y tres visuales, uno por tramo de páginas, más
   la presentación dibujada a 1920 × 1080. Lo que encontraron se corrigió (`27d7707` y siguientes): composición del
   código sin silabeo, filas que no se parten, fichas que no quedan con el encabezado solo, láminas del DER con aire
   entre filas, rótulos de las secuencias que entran en su flecha (un control nuevo del motor lo impide de ahora en
   más), y datos que estaban mal leídos (seis operaciones del contrato y las rutas escritas como constantes).
4. **Prueba de explicación.** Las 20 láminas principales se explican en 37 a 47 segundos cada una
   (`defensa/explicaciones.json`).
5. **Compilación reproducible.** La misma fuente da el mismo PDF, byte a byte; nada privado ni ningún carácter de
   control quedó en el repositorio; el legajo y el manifiesto están íntegros (207 de 208 entradas verificadas; la
   restante no está publicada por decisión de Dirección).

## Lo que necesita Dirección

1. **Completar `privado.json`** (`C:/Users/bufim/BE-datos-locales/tesis/`): la nómina del grupo, los correos
   `@davinci.edu.ar` y el mes y año de presentación. Después: `node construir-documento.mjs --evaluacion`.
2. **El Gantt (apartado 10) y las URL de los apartados 11, 12 y 13.**
3. **Elegir la APK de la demo** (la estable 0.13.2 o la 0.17.0-candidata.3) y probarla en el teléfono: la candidata
   entera, un aviso push recibido, la agenda por días y la sustitución de ejercicios (K1 y K14).
4. **Resolver las decisiones abiertas** que la tesis cita: DL-151 (la regresión de la sustitución),
   DL-152 (la compatibilidad de las APK), DL-135 (D-1 a D-9 de la TVCC-30) y DL-133 (D-1 a D-10 de los avisos).
5. **Compartir la presentación** con quien corresponda (hoy es privada).
6. **Tomar capturas nativas de la candidata** para la portada y el plan B (K17), y probar el website en Safari (K15).
7. **Enviar el PDF** desde el correo institucional de un integrante, con copia al resto, a
   `coordinacion.as@davinci.edu.ar` (anexo A). Este trabajo no envió nada.

## Pendientes y defectos registrados

El anexo K los lista con su severidad (19 puntos). Los de severidad alta: **K1**, la candidata 0.17.0 perdió la
sustitución de ejercicios que tenía la 0.13.2 (DL-151; arreglo en un PR en borrador), y **K14**, la candidata no se
probó entera en el teléfono y ningún aviso push llegó todavía a un teléfono real. El resto son documentos del
repositorio que quedaron atrás de lo integrado o que el 05 no completa (K5 a K12 y K18), pruebas que faltan (K13 y
K15 a K17) y diferencias menores del código con su documentación o con el legajo (K2 a K4 y K19). Ninguno se corrigió en el producto: el encargo pedía
documentar, no cambiar el producto para que coincida con un gráfico.

## A qué prestarle atención

- El repositorio es público: la versión de evaluación, con las credenciales, nunca se sube.
- En la demo, no escribir sobre Diego Sosa (es el ejemplo de los gráficos); para registrar en vivo, Federico o Norma.
- La cartera de Sofía muestra una sexta persona, «Asesorado · bea2eb», de la verificación del 2026-10-20 (K16).
- La TVCC-30 del documento (5 de 7, 71,4 %) es una demostración sobre datos sintéticos, no una medición del servicio.

## Otras opciones que se descartaron

- **draw.io o PlantUML para las láminas:** se eligió un motor propio que escribe SVG desde una fuente por lámina, porque
  permite controlar automáticamente lo que una revisión a ojo deja pasar (tamaño mínimo de letra, textos que se pisan,
  cruces, rótulos más anchos que su flecha) y compilar siempre igual. Las notaciones son las de UML 2.5.1, C4 y
  Yourdon/DeMarco.
- **Numerar todas las tablas:** se numeraron las cinco que resumen una comparación o una medición, y el criterio se
  declara en el apartado 1.4.
- **Renumerar el anexo K:** se mantuvo el número de cada punto (otros documentos los citan) y se aclara que siguen el
  orden en que se encontraron.

## Un concepto

**Compilación reproducible:** que la misma fuente produzca exactamente el mismo archivo. En la tesis, el PDF fija su
fecha interna con la del commit de referencia; así cualquiera puede compilar la rama y comprobar, con una huella
SHA-256, que el PDF entregado sale de esa fuente y no fue retocado a mano. Cuando dirigís a una IA que genera
documentos, pedir compilaciones reproducibles te deja verificar lo entregado sin releerlo entero.
