# AV2-18 · La muestra en el teléfono de Dirección (WP-APP-VUELTA-2 §5.4)

> **Estado (2026-11-12): se arma.** La etapa A (AV2-01 a AV2-17) está programada en #255, en borrador y sin
> integrar. Por la numeración que decidió Dirección el 2026-11-11, la candidata de la muestra es la
> **0.25.0-candidata.1** (la 0.24, con el nombre obligatorio de UF-01, es la «latest» que ofrece el website). Se arma
> por el circuito de siempre (`docs/DESPLIEGUE.md`): la rama `aab/candidata-0.25.0-1` (esta rama, con `main` traído,
> más un commit con la versión y el `versionCode` 39), el AAB sin firma en GitHub Actions, la firma y la verificación
> en la PC de Dirección y la APK con `apk-desde-aab.mjs`. Por AV2-D11 se publica **aparte, como prerelease y no
> «latest»**: la familia sigue con la 0.24.
>
> Lo coordina el agente principal; esta carpeta deja escrito qué mirar y dónde queda la respuesta.

## Antes de mirarla: lo que se va a ver distinto de la maqueta (§1.2)

- **Los números son los de la persona**, no los de la imagen: la tira marca con la tilde solo los días con una sesión
  realizada (la maqueta marcaba días que todavía no llegaron), y «N sesiones realizadas esta semana» y la actividad de 30
  días salen de la misma lectura, así que no se contradicen.
- **La tilde del día, en Azul noche, va oscura** sobre el verde: la blanca de la maqueta da 1,52:1 y un gráfico que
  comunica necesita 3:1 (AV2-T8). En Claro va blanca.
- **«vas por la serie 3»** se escribe con el ejercicio: «Sentadilla goblet · serie 3», y solo si la sesión corre en este
  teléfono.
- **El brillo de arriba de las tarjetas** se apaga a 12 dp, dentro del relleno, y no al 45 % del alto: con el brillo
  debajo, la etiqueta de estado bajaba a 4,00:1 (AV2-T14, a ratificar).
- **El vidrio está prendido solo en Inicio** (§3.3): en las demás pantallas cambian el fondo, la cabecera, la barra, los
  colores (el tenue, el botón principal), la etiqueta de estado, los enlaces con flecha, las fechas y las horas, pero las
  tarjetas siguen opacas hasta el visto bueno (AV2-26).
- **Inicio ya no lleva «Ver tu historial»** (la tarjeta «Actividad» no se toca, como en la maqueta) ni el «Cómo se lee»
  de la medida destacada, que pasa a Evolución con AV2-20.
- **En un teléfono de 360 dp, las dos tarjetas chicas llevan el ícono arriba del título**, no al lado como en la maqueta:
  al lado, «Mediciones» (el título mientras carga) no entra y se partía. En uno de 412 dp va al lado (AV2-T18).

## Qué mirar, y cómo

Con la candidata instalada encima de la 0.23 (el mismo certificado y un `versionCode` mayor), con los datos de Dirección
o con una cuenta sintética de la cohorte:

1. **Inicio en Azul noche y en Claro** (Perfil → Apariencia): el fondo con luz, las tarjetas de vidrio con el borde y la
   sombra, el botón «Continuar» con degradé y brillo, la cabecera con el logo a la izquierda y la campana con el punto, y
   la barra más fina.
2. **Con letra ×1,3** (Ajustes de Android → Tamaño de fuente; es la de los ajustes la que importa, porque Android la
   manda como 1,2999999523…, AV2-T17): las fichas de las comidas y las dos tarjetas chicas en una columna; nada cortado
   ni achicado; la barra en dos filas. **Y también con ×1 y con ×1,15, en 360 dp** (o con «Tamaño de la pantalla»
   aumentado, que achica los dp): ninguna palabra partida en las fichas ni en los títulos, mientras carga («Mediciones»)
   y con una cuenta sin tomas.
3. **Con TalkBack**, lo que tiene que decir (§3.4): «BE» una vez; «Novedades, N sin leer, botón»; el título como
   encabezado; la tira en una sola etiqueta («Esta semana: … con sesión realizada. Hoy, …»); «Estado: en curso»; cada
   ficha («Almuerzo, registrado a las 13:10, botón»); la medida («Peso, 80,9 kilos, sin cambio desde el 2 de septiembre.
   Ver la evolución, botón»); la actividad («Actividad de los últimos 30 días: …»); el fondo y los brillos, nada.
4. **Con el «Texto de alto contraste»** (Accesibilidad de Android): el fondo liso y las tarjetas opacas.
5. **Lo que solo el teléfono confirma:** que el degradé radial y el brillo recortado al radio se dibujan (si el degradé no
   se dibuja, se pasa al plan B de §3.2 antes de seguir); «Cómo se lee» con el (?) centrado (AV2-11); la hora en 24 h con
   el `Intl` de Hermes; con una sesión en curso, que Inicio muestre solo esa y Entrenamiento no ofrezca empezar otra; y
   que tocar «Merienda · Registrar» abra la Merienda.
6. **El rendimiento**, con `EVIDENCIA/APP-VUELTA-2/rendimiento/` (AV2-16): la medición «después», contra la «antes».

## La respuesta de Dirección

> Pendiente. Acá se escribe la fecha, el visto bueno o las correcciones, y en qué teléfono y con qué cuenta se miró.
> Recién con el visto bueno empieza la etapa B (AV2-19 a AV2-26). TalkBack se escribe como hecho o como pendiente: no se da
> por aprobado sin la prueba en el teléfono.
