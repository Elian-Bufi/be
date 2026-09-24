# MESA-01 — estado de DV-11 tras el tramo de identidad visual y accesibilidad

> Nota de actualización del ejecutor técnico. **No modifica** la matriz ni el informe del 2026-09-10: esos archivos están en `docs/MANIFEST.sha256`, y editarlos rompería la verificación de hashes de la entrega de Dirección.

**Fecha:** 2026-09-24 · **Tramo:** identidad visual y accesibilidad (`docs/paquetes/WP-IDENTIDAD-VISUAL.md`) · **Fuente de exigencia:** `Entregables.pdf` de la escuela. El punto 11 es DV-11: «URL a una DEMO que muestre funcionalidades de APK y Website».

## Punto 11 — Demo de APK y Website

La demo ya no empieza en una pantalla blanca con dos botones. Empieza en una **landing** que dice qué es BE con las palabras del legajo (02 §3.2 y §9), qué no hace (02 §14) y dónde bajar la APK.

| Elemento | Qué cambia para la demo | Dónde |
|---|---|---|
| Cara pública | Landing, acceso, registro y legales en el tema oscuro de las referencias de Dirección, con el isotipo | `/`, `/login`, `/register` |
| Espacio profesional | Tema claro y azul, migas de ubicación, una tarjeta por asesorado con sus tres alcances, el workspace a lo ancho con las tarjetas de dominio en fila | `/pro`, `/pro/advisees?id=…` |
| Toma antropométrica | **Sobre la figura**, como pidió Dirección el 2026-09-20: los puntos de toma del protocolo, la lista por familia al lado, tocar un punto lleva a su campo | Antropometría → En preparación |
| APK | Tema oscuro, isotipo en la bienvenida y en la barra, ícono nuevo. Versión 0.9.0 | teléfono |

### Un momento de demo que suma

**La figura que no califica.** En «En preparación», cargar un pliegue tricipital de 8,5 mm y uno subescapular de 31 mm. Los dos puntos se llenan **igual**: la figura dice dónde se midió y que ya hay dato, nunca si el valor es alto o bajo. Es RF-048 —la antropometría no diagnostica— llevado al color, y lo sostiene una prueba del dominio: el punto no recibe el valor.

La demo completa, con este momento y los de los demás paquetes, está en `EVIDENCIA/ENTREGA/GUIA-DEMO.md`. La APK 0.9.0 se descarga del release permanente `be-apk-0.9.0`, que la landing ofrece en «Descargar la APK de prueba».

## Punto 5 — DV-05 (calidad verificable)

RNF-ACC-001 figuraba «NOT VERIFIED» en el 11A. Ahora tiene:
- una **prueba automática de contraste** dentro de `npm test`, que encontró y corrigió dos defectos de WCAG 1.4.11 que había en `main`;
- una **auditoría axe-core** de las 21 pantallas núcleo del website en escritorio y en celular: **cero violaciones** (`EVIDENCIA/IDENTIDAD/`);
- una revisión manual documentada de la APK.

## Lo que esta nota no dice

No dice que el producto cumpla WCAG entero: RNF-ACC-001 pide «un conjunto declarado de criterios aplicables, sin afirmar certificación integral», y eso es lo que se midió. La prueba en un Android físico con TalkBack va con las capturas de la APK.
