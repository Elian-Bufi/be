# Evidencia · «Mi evolución» en tres vistas (DL-118)

**Estas capturas no son de la APK.** Son renders de los componentes reales de la APK en el navegador, con
react-native-web y datos sintéticos. Cada imagen lo dice arriba, en rojo. El cierre todavía no se probó en el teléfono:
la APK que lo incluya se construye después de que Dirección revise estas capturas.

- **Decisión:** Dirección, 2026-10-05 (DL-118).
- **Delta:** `docs/ux/MI-EVOLUCION-TRES-VISTAS.md`.
- **Rama:** `apk/navegacion`, PR #146 en borrador.
- **Commits:** `597ffce` (delta), `3c6ac7c` (implementación) y el de esta evidencia.
- **El «antes»:** la candidata probada en el teléfono, `2e53ac8`, que es la APK 0.14.0-candidata.1.

## Las capturas

Las que dicen **individual** tienen una sola pantalla, al doble de píxeles, para verlas en el teléfono sin ampliar.

| Archivo | Qué muestra |
|---|---|
| `capturas/01-mapa-corporal.png` | **Individual.** Mapa corporal, Azul noche, 360 dp: el nombre y el valor de cada sitio, sin gráficos chicos |
| `capturas/02-progreso-torso.png` | **Individual.** Progreso, Perímetros · Torso, panel «Cuello y tronco»: la figura del tren superior con números y una tarjeta por sitio |
| `capturas/03-progreso-pliegues-pecho-y-brazo.png` | **Individual.** Progreso, Pliegues · Torso, «Pecho y brazo», en Claro. El tríceps tiene una medición de otro protocolo, contada aparte |
| `capturas/04-progreso-piernas.png` | **Individual.** Progreso, Piernas: la figura del tren inferior |
| `capturas/05-progreso-detalle.png` | **Individual.** La cintura elegida, con su ficha, su anillo y su tarjeta resaltados. Debajo, el gráfico con fechas, la medición elegida, «Anterior» y «Siguiente» y la lista |
| `capturas/06-indicadores.png` | **Individual.** Indicadores: mediciones, resultados marcados como estimación, la edad como dato de la toma y «Más datos de esta toma» |
| `capturas/07-indicadores-detalle.png` | **Individual.** El peso abierto, en Claro: primero el resumen y después el gráfico |
| `capturas/08-progreso-letra-maxima.png` | **Individual.** Progreso con letra ×2 |
| `capturas/09-mapa-letra-grande.png` | **Individual.** Mapa con letra ×1,3: la figura con números y los valores en la lista |
| `capturas/10-indicadores-letra-maxima.png` | **Individual.** Indicadores con letra ×2, en una columna |
| `capturas/11-ultima-toma-solo-indicadores.png` | **Individual.** La última toma solo tiene indicadores: se abre Indicadores con la T4 |
| `capturas/12-mapa-con-la-toma-anterior.png` | **Individual.** El mapa en ese caso: muestra la T3 y lo dice con las dos fechas |
| `capturas/13-sin-perimetros-ni-pliegues.png` | **Individual.** Sin perímetros ni pliegues en el período: no hay mapa, Progreso ni pestañas vacías |
| `capturas/14-dos-evaluaciones-el-mismo-dia.png` | **Individual.** D-3: el aviso sigue a la vista, y la cintura que tapa la otra evaluación dice «Sin dato en esta toma» |
| `capturas/15-antes-despues-mapa.png` | El mapa, antes y después |
| `capturas/16-antes-despues-comparar-y-progreso.png` | Comparar, antes, y Progreso, después |
| `capturas/17-antes-despues-indicadores.png` | Indicadores con el peso abierto, antes y después |
| `capturas/18-antes-despues-evolucion.png` | La vista Evolución, antes, y el detalle del peso, después |
| `capturas/19-antes-despues-barra.png` | Lo que pasa detrás de la barra, antes y después, en los dos temas |

## Qué se verificó, y dónde

**En pruebas de scripts** (sin teléfono): 181 de 181. Las de este cierre:
- **`scripts/selector-de-tomas.test.mjs`** (8 pruebas):
  - las vistas que aparecen y la que se abre;
  - la toma que muestra cada vista;
  - las rutas viejas de Comparar y Evolución;
  - cada sitio en una sola zona, con su lugar en la figura del tren para los dos sexos;
  - los paneles del torso, que no duplican ni omiten sitios y no dependen de la toma;
  - los cuatro bloques de indicadores, sin perder ninguna medida;
  - la serie de una medida, con el grupo de la toma, el otro grupo aparte y las fechas reales.
- **`scripts/composicion-de-la-figura.test.mjs`** (3 pruebas). Se probaron 3 anchos, 2 sexos, 2 familias y 3 tamaños de letra:
  - la figura de una zona: números de arriba hacia abajo, sitios a la vista, la misma transformación de la lámina, fichas que no se pisan y el mismo cuerpo en los dos paneles;
  - los números sin medir la figura;
  - el mapa sin diferencia, que no mueve sitios ni agranda filas.
- **`scripts/grafico-de-evolucion.test.mjs`:** el gráfico compacto, con fechas a escala, la escala visible, sin salirse y sin dibujarse con una sola observación.

También el typecheck de la APK sin errores y el legajo íntegro.

**En el render del navegador** (componentes):
- **Las capturas de esta carpeta**, en 360, 390 y 412 dp, en los dos temas y con letra ×1, ×1,3 y ×2.
- **Los casos de riesgo:**
  - una toma intermedia;
  - doce tomas;
  - la misma fecha (D-3);
  - solo indicadores;
  - ninguna toma con sitios;
  - un sitio elegido desde el mapa y desde Progreso.
- **El control de cortes** (`herramientas/render-navegador/cortes.js`, en la carpeta de INICIO-Y-NAVEGACION). Compara el ancho de cada texto de una línea con el de su caja. Con el render final, en 18 configuraciones: **ningún texto cortado**.

**En el teléfono:** nada de este cierre todavía. Lo que Dirección probó el 5/10 fue la 0.14.0-candidata.1, que no lo incluye: la actualización con la sesión y los cinco controles de navegación (DL-117).

## Límites del simulador

Valen los de `EVIDENCIA/INICIO-Y-NAVEGACION/LEEME.md`: Roboto web, la escala lineal, y sin la sombra nativa ni TalkBack. Además:
- **Las figuras de los trenes** son PNG de 743 KB y 560 KB por sexo. En el navegador van incluidas en el bundle; en Android las carga `Image`.
- **El velo de la barra** es un degradé de `react-native-svg` detrás de la cápsula. Falta verlo en el teléfono, con gestos y con tres botones.
- **Los toques sobre la figura de una zona** (un número o un sitio) se razonaron con las mismas reglas del mapa y se dibujan igual. No se tocaron en un teléfono.

## Recorrido corto para el teléfono, con la APK que incluya este cierre

1. Mi evolución abre en **Mapa corporal**, con la última toma. Las filas tienen el nombre y el valor. Tocá un sitio: aparecen el cambio con su fecha y «Ver su progreso».
2. Con **«Ver su progreso»**, se abre Progreso en la zona y el panel de ese sitio, con su tarjeta resaltada.
3. En **Progreso**, pasá de Perímetros a Pliegues y de Torso a Piernas. En el torso, pasá de un panel al otro: la fecha y los valores no cambian. Tocá una tarjeta: se abre el gráfico con fechas, con «Anterior», «Siguiente» y la lista.
4. **Elegí la T1:** el mapa, Progreso y los indicadores muestran esa toma. Una tarjeta sin dato en la T1 lo dice, y sus puntos siguen.
5. En **Indicadores**, la edad aparece como dato de la toma y los diámetros, en «Más datos de esta toma». Tocá el peso: primero el resumen, después el gráfico.
6. **Desplazá hasta el final** de cada vista: lo que pasa detrás de la barra queda velado, y el último contenido entero por encima.
7. Repetí con la **letra máxima** y con el **tema Claro**.
8. Desde **Inicio**, «Ver la toma» abre la última toma, y «Ver su evolución» abre la medida destacada en su vista.

## Cómo se rehacen

En `EVIDENCIA/INICIO-Y-NAVEGACION/herramientas/render-navegador`:
- `./capturar-tres-vistas.sh` hace las 19 capturas. Antes hay que armar dos maquetas: la nueva y la de la candidata `2e53ac8`. Los comandos están en la cabecera del script.
- Las escenas nuevas de `shims/api.ts` son sintéticas:
  - la última toma con solo indicadores;
  - ninguna toma con sitios;
  - la edad.
