# Evidencia · Apariencia de la APK: «Azul noche» y «Claro»

**Decisión de Dirección (2026-09-30).**
- La APK tiene dos temas con selector, como el website (#118): «Azul noche», predeterminado, y «Claro».
- Los dos entran en la APK 0.12.1.
- El website se actualiza a estas mismas paletas en un PR aparte, después de integrar #118.

Rama `feat/apk-temas`, apilada sobre #123 (formularios y versión 0.12.1). Para auditoría: **sin integrar, sin desplegar y sin APK construida todavía**.

## De dónde salen los colores
- **Azul noche:** medido píxel a píxel en las pantallas mobile de referencia que armó Dirección (Inicio, Antropometría y Progreso). Es más oscuro que el anterior (`#04213F`). El cian es más intenso, las tarjetas llevan un borde luminoso y el botón principal pasa a ser claro con texto oscuro.
- **Claro:** los colores del compositor de láminas (`docs/direccion/BE-VIS-Compositor_v13.3.html`, tema `light`), idénticos en las láminas de pliegues y circunferencias.
  - Para la app, seis colores van apenas más oscuros, en el mismo tono, porque el texto chico necesita 4,5:1: secundario, unidad, azul como texto sobre el fondo, éxito, alerta y borde de campo.
  - Página con todas las muestras y su contraste: https://claude.ai/artifact/SBQGzDYiqDQvjptghfmdig (privada).

| Color | Azul noche | Claro |
|---|---|---|
| fondo | `#011325` | `#F2F6FC` |
| superficie (tarjetas) | `#052238` | `#FFFFFF` |
| texto | `#FFFFFF` | `#0A1F44` |
| tenue | `#8DCAE5` | `#62728A` |
| acento | `#27D5F9` | `#1465F1` |
| azul (decoración) | `#1D98DE` | `#1E6BF2` |
| botón principal / su texto | `#E8F5FE` / `#011325` | `#1E6BF2` / `#FFFFFF` |
| acción destructiva / su texto | `#FF9B8F` / `#011325` | `#BB4D1C` / `#FFFFFF` |
| borde decorativo · borde de campo | `#0A72A1` · `#4F7FA3` | `#E3ECFF` · `#7B8EA8` |
| error · fondo de error | `#FF9B8F` · `#3B1A25` | `#BB4D1C` · `#FFF4F0` |
| éxito · fondo de éxito | `#6EE7B7` · `#0B3A3A` | `#107F45` · `#EEF8F2` |

## Cómo está hecho
- **`apps/mobile/src/tema.ts`:**
  - Las dos paletas, con los mismos nombres de color que antes.
  - El tema vigente.
  - `COLOR`, que lee la paleta vigente al momento de dibujar.
  - `estilosPorTema`: una hoja de estilos por tema, armada la primera vez que se usa.
- **Hojas de estilo:** las diez (la compartida de `ui.tsx` y las de nueve pantallas y componentes) pasaron de `StyleSheet.create({…})` a `estilosPorTema((COLOR) => ({…}))`, con el contenido intacto.
- **`apps/mobile/src/apariencia.tsx`:** el estado vive en la raíz.
  - Al cambiar el tema, la raíz se vuelve a dibujar y con ella toda la app, sin perder la pantalla ni la sesión.
  - La preferencia se guarda en el teléfono con `@react-native-async-storage/async-storage` 2.2.0, la versión que fija Expo 57. Usa la misma clave que el website, `be-apariencia`.
  - Antes del primer dibujo se lee la preferencia, para que la app no aparezca en un tema y cambie al otro. Se espera como máximo 1,5 s.
  - Si el teléfono no deja leer o guardar, se usa la predeterminada y nada se rompe.
- **Selector:** en Cuenta, sección «Apariencia», con el mismo grupo de opciones accesible del resto de la app (rol `radiogroup`). Tocar lo elegido no lo suelta: siempre hay un tema.
- **Barra del sistema:** íconos claros sobre Azul noche y oscuros sobre Claro.
- **Configuración:** el fondo de arranque pasa al nuevo Azul noche (`app.config.ts`).

## Pruebas
| Prueba | Resultado |
|---|---|
| Contraste (`scripts/contraste.test.cjs`): los 17 pares de la APK en cada tema (texto 4,5:1; bordes de campo y opciones 3:1), los dos temas declaran los mismos colores, y ningún archivo escribe un color fuera de los tokens | **8/8** |
| Typecheck de la APK | ✅ |
| Ninguna lectura de color o estilo a nivel de módulo, que quedaría fija en el tema inicial (búsqueda en todo `apps/mobile`) | ✅ ninguna |

## Límites
- **Validación visual pendiente.** No hay emulador ni capturas automáticas de la APK en esta máquina, así que el aspecto de cada pantalla en los dos temas se valida en el teléfono con la 0.12.1. No está validado.
- **TalkBack y teclado** no se verificaron.
- **Diálogos del sistema** (alertas nativas): quedan oscuros en los dos temas (`userInterfaceStyle: 'dark'`).
- **Logo:** se mantiene la esfera cian, que se ve sobre los dos fondos. El logo con alas de las pantallas de referencia y del compositor es una decisión de marca aparte.
- **Preferencia por dispositivo:** queda en el teléfono, como en el website, y no viaja a la cuenta.
- **Mockup:** de las pantallas de referencia se toma la paleta y el lenguaje visual. No se toman los porcentajes de cumplimiento («Plan del día 60 %», «2/3 tomados»), que el legajo excluye (TEST-PRJ-009), ni secciones fuera del alcance.
