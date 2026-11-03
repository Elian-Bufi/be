# Base de la defensa

Lo necesario para presentar y defender BE. El documento de la tesis es de `main` `0fb1bff` (2026-10-20); el mazo, el
guion y la demo se actualizaron el 2026-11-02 para la presentación del viernes 6/11, con las cifras de `main` `e4512cb`
(26/10) y lugares marcados «[se completa el jueves: …]» para lo que sale de la integración del miércoles.

| Archivo | Qué es |
|---|---|
| `GUION.md` | El orden y los tiempos (unos 11 minutos), la sección de respaldo, la lista de lo que se completa el jueves y, para cada lámina de la tesis, cómo explicarla en 30 a 60 segundos |
| `DEMO.md` | La demo de unos 2:30 (website con Diego, APK con Prueba Uno), su plan B y las capturas que se toman el jueves |
| `PREGUNTAS.md` | 25 preguntas probables, cada una con su respuesta y su respaldo |
| `DIAPOSITIVAS.md` | El texto de las 18 diapositivas y sus notas del orador (generado desde la fuente) |
| `presentacion/project/` | La fuente editable de la presentación: el índice y una sección HTML por diapositiva |
| `respaldo-demo/` | 12 capturas del website en test del 20/10 (API `0fb1bff`) y su `registro.json`; las del jueves van en `respaldo-demo/2026-11-05/` |
| `explicaciones.json` | El resultado de la prueba de explicación: palabras y segundos de cada lámina |

**La presentación** está en https://claude.ai/artifact/9LiufGdUTJjAbEonGT8t2U: 13 diapositivas 16:9 para exponer, la de
preguntas y 4 de respaldo (con quién habla BE, una operación protegida, los datos y los estados), con notas del orador y
letra de 18 pt como mínimo en proyección (36 px en un lienzo de 1920 × 1080). No se compila: se abre en ese enlace, se
presenta desde ahí y se descarga como PowerPoint o PDF desde el menú del mazo. Es privada hasta que Dirección la
comparta. La fuente de este repositorio y el mazo publicado son iguales, salvo la portada: la publicada suma el correo
de Elián y el nombre y el correo del tutor, que no van en este repositorio porque es público. Si se cambia uno, se
publica o se copia el otro, sin pisar esa portada.

**Regenerar:** `node herramientas/prueba-de-explicacion.mjs` (la prueba de explicación),
`node herramientas/esquema-de-diapositivas.mjs` (`DIAPOSITIVAS.md`, si cambia la fuente del mazo) y
`node herramientas/capturar-respaldo-demo.mjs` (las capturas del website; ver `DEMO.md`).

**Antes del viernes, a cargo de Dirección:** la decisión sobre TalkBack (probarlo o declararlo como límite); las capturas nativas de la APK nueva; y un ensayo completo
con el mismo teléfono y la misma red. El resto de lo que se completa el jueves está en `GUION.md`.
