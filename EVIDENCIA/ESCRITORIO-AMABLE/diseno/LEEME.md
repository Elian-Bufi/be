# Referencia de diseño de WP-ESCRITORIO-AMABLE

Es el diseño contra el que se compara lo que se construye. **No es evidencia de que algo funcione:** una maqueta sola no
cierra ninguna parte del paquete (`docs/paquetes/WP-ESCRITORIO-AMABLE.md`).

| Qué | Dónde | Para qué |
|---|---|---|
| El criterio | `CRITERIO-Y-AUDITORIA.md` | Los ocho criterios, qué queda a la vista y qué a un clic en cada pantalla, las reglas para 1280 y 1024 px y los 81 cambios respecto de hoy (el paquete los cita como C-01 a C-81) |
| Las 29 pantallas | `maquetas/claro/` y `maquetas/azul-noche/` | A 1440 × 960, con datos sintéticos. Las 01 a 15 y la 19 son las de este paquete; las demás, del segundo |
| El catálogo de íconos | `iconos/CATALOGO.md` | Los 105 íconos: el dibujo, qué simboliza, dónde va y con qué cuidado. `iconos/INVENTARIO.md` dice cuáles usa cada pantalla |

## Lo que quedó afuera del repositorio

El taller de diseño está en la máquina de trabajo (`C:\Users\bufim\BE-maquetas`): las fuentes de las maquetas, sus
versiones anteriores, las láminas de íconos, cada ícono suelto en SVG y en PNG, y los generadores. No se trajo porque
necesita un navegador y rutas de esa máquina para regenerarse.

Los íconos que usa el producto no dependen del taller: entran al repositorio en la Parte 0, como datos del dominio
(`packages/domain/src/iconos.ts`), y desde entonces ese archivo es la fuente. Si un dibujo cambia, cambia ahí.

## Cómo se leen las maquetas

- Lo marcado «Propuesta · dato nuevo» pide datos que BE no guarda, y lo marcado «Hoy, solo en la APK» pide una lectura
  que el website no tiene: están fuera del alcance (§6 de la definición).
- El nombre «Ana Ruiz» es un alias de ejemplo: BE muestra hoy la referencia neutral («Asesorado · 5db647») y el alias
  es una decisión abierta del legajo (DL-040).
- En Azul noche la pantalla es la misma: cambian los colores, no la disposición.
