# Crítica de diseño del escritorio profesional · 15 oct 2026

Revisión aparte, solo de opinión: otra instancia de Claude, con el rol de director de diseño, miró las capturas a 1440 px
de las 18 pantallas que entran con la integración, en los dos temas. No tocó nada. Lo que sigue es su texto, tal cual.

---

### 1. Impresión general

Es un producto serio y coherente, y transmite lo que tiene que transmitir: prudencia y respeto por el dato. La cabecera, las pestañas y el selector de período se repiten en todas las áreas, la paleta es sobria y el lenguaje es neutral. Hoy está al nivel de una buena herramienta profesional. Para llegar al estándar de Apple le falta acabado, no estructura: todo habla al mismo volumen (negritas y bordes gruesos por todos lados), un mismo control aparece con varios aspectos, se cuelan controles nativos del navegador y algunas pantallas se llenaron de texto que la maqueta no tenía.

### 2. Lo que está muy bien

- **La carga de una toma sobre la figura.** Tiene líneas guía, los sitios sin dato punteados y la aclaración de que la figura ubica y no califica. Es lo más logrado, en los dos temas.
- **Las curvas del Resumen.** Las bandas grises para los días sin registro son honestas y elegantes.
- **La Línea de tiempo.** La columna de fechas funciona, y todas las filas tienen la misma forma: ícono, título, detalle, hora y flecha.
- **El Plan de Nutrición.** Muestra las opciones lado a lado, con las cantidades alineadas a la derecha.
- **La Nueva revisión.** Tiene tres pasos numerados y la barra de acciones fija.
- **Azul noche.** El botón principal es cian con texto oscuro, y las tarjetas se separan sin bordes duros.
- **Detalles generales.** Todos los íconos tienen el mismo trazo y los botones respetan los 44 px.

### 3. Problemas, por prioridad

**Alta**

1. **Todo pesa lo mismo** (en todas las pantallas).
   - Los botones secundarios («Solicitar contexto», «Actualizar», «Abrir», «Validar plan») tienen borde casi negro de 2 px y texto en negrita.
   - «Activo · acceso contextual» y los «7 días sin dato» de Evolución usan ese mismo borde, así que parecen botones.
   - La línea de acceso pone en negrita tanto la etiqueta como el valor.

   Si todo grita, el ojo no encuentra lo principal. Lo resolvería así:
   - Botón secundario con borde de 1 px gris medio (#8792A2 da 3,1:1 sobre blanco) y texto en peso 600.
   - Etiquetas de estado de 24 px de alto, con letra de 13 px en peso 500 y fondo tenue.
   - El peso 700 solo para los títulos y las cifras grandes.

   Con esto se vuelve a la maqueta, que era más liviana.

2. **Controles nativos del navegador** (Nueva toma, Evolución, Lámina, Analizar, Plantillas, Nueva revisión). Las listas desplegables tienen la flecha por defecto, las fechas dicen «dd/mm/aaaa» con el calendario negro y los cuadros de texto muestran la marquita para agrandarlos. Ahí se rompe la sensación de producto terminado, y además se ven distinto en cada navegador. Haría una lista desplegable propia (44 px, borde de 1 px, esquinas de 8 px y la flechita del set de íconos) y escribiría las fechas como «15 oct 2026, 09:23», con el calendario del set. La maqueta 23 ya lo dibuja así.

3. **Un mismo gesto con cuatro aspectos.** Para elegir una opción hay cuatro formas distintas:
   - una botonera azul marino de opciones pegadas (Hombre | Mujer en Nueva toma, las sesiones del plan);
   - píldoras azules sueltas (Lámina);
   - chips (filtros);
   - círculos de opción (revisión).

   Además, el botón secundario aparece con borde oscuro o azul, sin una regla visible: «Más filtros» es oscuro en Espacio y en Línea de tiempo pero azul en Registros de Entrenamiento, y «Cancelar» es azul. La regla que propongo:
   - botonera pegada para elegir cómo se ve algo (los cinco grupos de la Lámina; si esos controles vienen del compositor que aprobó Dirección, consultalo antes);
   - chips solo para filtrar;
   - círculos solo en formularios;
   - un único estilo de botón secundario.

4. **En Azul noche, el texto secundario es azul** (Resumen, Nueva toma, Registros). Los días de la semana, «Sin registro», los encabezados y las unidades salen en celeste, casi del mismo color que los enlaces. No se sabe qué se puede tocar y el tema queda de un solo color. Pasaría el texto secundario a un gris azulado apagado (#A3B1C2 da unos 7:1 sobre las tarjetas) y dejaría el cian solo para enlaces, acentos y datos.

5. **Evolución de Antropometría.** Los puntos son naranja rojizo, un color que no aparece en ninguna otra parte del producto. Se leen como alerta y chocan con «ubicar, nunca calificar». Usá el azul de datos del Resumen; la forma (círculo o rombo) ya distingue lo no comparable. Además hay que corregir:
   - el período se elige con dos fechas vacías aunque ya haya uno aplicado, en vez de usar el selector de la ficha;
   - el eje marca 23-25-27-28, con un paso irregular;
   - cada fecha repite el año y la unidad del eje está girada;
   - en la leyenda falta el símbolo del «punto con centro claro»;
   - hay un párrafo técnico a la vista con «America/Argentina/Buenos_Aires», que debería ir solo para el lector de pantalla o en «Cómo se lee».

**Media**

6. **Resumen denso.** Los pies de los indicadores ocupan cuatro líneas, y los estados de las tarjetas son oraciones en negrita de dos líneas. La maqueta decía «Próxima revisión: 30 sept · en 2 días» y usaba dos líneas por indicador. Volvería a eso y dejaría el detalle para la vista de cada indicador. Además, la maqueta ponía la etiqueta de origen («Medido», «Calculado») en los cuatro indicadores; hoy aparece solo en Peso.

7. **Cabecera de la ficha.** Tiene una fila más que la maqueta, unos 40 px en cada subpágina. La maqueta ponía el acceso en la primera fila, con un «Activo» corto. Recuperarlo ayuda sobre todo a 1024.

8. **Ritmo y grilla.** La separación entre tarjetas es de 14 px en el Resumen, de 18 en Espacio, Analizar y Nueva toma, y de 26 en el Plan. Entre las secciones del Resumen hay de 10 a 20 px, lo mismo que adentro de las tarjetas, así que los grupos no se despegan. Usaría una sola separación de 24 px y de 32 a 40 px entre secciones (esto último se aparta un poco de la maqueta).

9. **Línea de tiempo.** Los días con un solo hecho van sin tarjeta y con la fecha en peso normal. Como se alternan con días en tarjeta, la columna zigzaguea; les daría el mismo trato a todos. Los hitos llevan una barrita negra corta que parece un cursor, mientras que el filtro «Hitos» usa una bandera. Usá la bandera, o una barra de toda la altura de la fila.

10. **Tomas.** La toma elegida tiene un contorno azul que parece el foco del teclado; mejor un fondo tenue con una barra al costado. Además, el ícono ⇄ significa «cambio», pero acá nombra un protocolo.

11. **Botón deshabilitado** («Guardar cambios», «Ver los gráficos»). Tiene texto blanco sobre celeste pálido y casi no se lee; mejor gris neutro con texto gris oscuro. En el plan de Entrenamiento, cuando ya está todo guardado, el que debería pesar es «Activar plan» (fijate si la maqueta 18 lo prevé).

**Baja**

12. **Plantillas.** El contenedor está centrado y el título es más grande que en el resto. Hay un «Estado» a todo el ancho sobre listas vacías; lo ocultaría hasta que haya algo. Los nombres no siguen la misma forma: «Mis habituales de nutrición» frente a «Habituales de entrenamiento».
13. **Información.** El recuadro punteado parece una zona para soltar archivos. Pondría un ícono, una frase y el botón «Pedir información» adentro. Una sola pestaña no es navegación (si la maqueta 26 la tiene, sacarla se aparta poco).
14. **Lámina.** La tarjeta termina en 1183 px y no en el borde de la grilla, y «Cómo se lee esta vista» desaparece de la esquina. En la vista previa, el «cm» queda a unos 8 px. La ayuda dice «compositor de Dirección», que es vocabulario interno.
15. **Plan de Nutrición.** Los tres botones grandes aprietan la cabecera; los dos de plantillas irían a un menú. La «Huella de la instantánea» es un dato técnico que no le sirve al nutricionista.
16. **Analizar.** Cada métrica junta caja, casilla, ícono, nombre y a veces conteo. Sacaría el ícono, que ya está en el grupo.
17. **Nueva revisión.** La frase de la barra fija va en una caja gris que parece un campo deshabilitado.
18. **Desplegables.** Los triangulitos nativos («Más preguntas», «Quién ve tus plantillas») irían con la flechita del set y 44 px de alto.
19. **Lista de asesorados.** Cada fila tiene una flecha de desplegar y además «Abrir» (la maqueta no tenía la flecha). Y «Asesorado ·» se repite bajo una columna que ya se llama así.

### 4. Si tuviera un solo día

1. **Bajar el volumen:** bordes y pesos de botones y etiquetas, desde las variables de estilo. Toca todas las pantallas con poco código y es el salto de calidad más visible.
2. **Pasar el texto secundario de Azul noche a gris azulado.** Es un solo valor; el tema gana jerarquía y queda claro qué es enlace.
3. **Evolución:** azul de datos, ejes limpios, el selector de período de la ficha, la leyenda completa y el párrafo técnico fuera de la vista. Es la única pantalla que hoy contradice una regla del producto.
4. **Listas desplegables y fechas con el estilo de BE, y un único botón secundario,** empezando por «Más filtros» y «Cancelar». Así desaparecen los rastros del navegador.
5. **El Resumen como la maqueta:** pies de una línea, estados cortos y el acceso en la primera fila. Es la primera pantalla que ve el profesional.
