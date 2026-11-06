# Biblioteca de recetas de BE · ficha

> **Propuesta para decisión de Dirección** (encargo de consolidación del 2026-10-19: bloque 4, «Separar los productos que
> ya tenemos», y §7.F). No forma parte del legajo y no está implementada: ningún cambio de visibilidad acompaña esta ficha.

## El problema

Cada profesional arma sus recetas desde cero. Las dieciséis recetas de ejemplo
(`EVIDENCIA/DASHBOARD-PROFESIONAL/herramientas/datos/recetas/`) servirían a todos, pero cargadas en la cuenta de Sofía
serían recetas **privadas** de ella: compartirlas con todos cambiaría la visibilidad de lo que hizo una profesional, sin
que ella lo decida. Una biblioteca de BE tiene que acelerar el trabajo sin borrar la autoría ni pisar lo que cada
profesional adaptó.

## El modelo propuesto

1. **El origen.** Dos clases de receta que no se mezclan: la **receta de BE** (de la biblioteca: la cura BE, no es de
   ningún profesional) y la **receta propia** (privada, del profesional que la escribió, como hoy). La de BE sigue las
   mismas reglas que una propia: ingredientes del catálogo por identidad y versión, ninguno de demostración, el estado de
   cada cantidad igual al de su alimento, el cálculo de la API.
2. **La revisión.** Una nutricionista de BE la propone y otra la revisa (cuatro ojos), con la lista que ya prueba el
   manifiesto de las recetas de ejemplo: fuentes, estados, cálculo verificado, decisiones escritas para lo ambiguo y la
   foto con su criterio. Estados: borrador → en revisión → publicada → retirada. Una versión publicada no cambia: una
   corrección es una versión nueva.
3. **La publicación.** Los profesionales de Nutrición verificados la ven en «Biblioteca de BE», de solo lectura, con su
   origen a la vista («Receta de BE · versión 2 · revisada el …») y la fuente de cada ingrediente. La persona no ve la
   biblioteca: ve lo que su profesional le indica.
4. **La copia al espacio propio.** «Usar como base» crea una receta **propia** del profesional, con la procedencia «copiada
   de la receta de BE, versión N». Desde ahí es suya: la adapta como quiere. Cuando la biblioteca publica una versión
   nueva, el profesional ve «Hay una versión nueva de la receta de BE en que se basa la tuya» y decide si la aplica,
   comparando antes: **nunca se actualiza sola**.
5. **Los planes** citan siempre la receta propia (la copia), nunca la de la biblioteca: un cambio en la biblioteca no
   toca ningún plan, como hoy un cambio del catálogo no toca una instantánea.
6. **Las fotos.** La de una receta de BE es un recurso de catálogo, legible por todos los profesionales, separado de las
   fotos privadas de los registros de comida (que nunca pasan a una receta). La copia cita la misma foto, sin duplicar
   los bytes; BE no la borra mientras alguna copia la cite.
7. **El primer contenido:** las dieciséis recetas de ejemplo, después de su revisión.

## Decisiones para Dirección

| | Pregunta | Recomendación |
|---|---|---|
| D-1 | ¿Quién cura la biblioteca? | Una o dos nutricionistas de BE con un rol propio, distinto del de profesional |
| D-2 | ¿Revisión de cuatro ojos? | Sí: quien la propone no la publica |
| D-3 | ¿Copia o referencia en el espacio propio? | Copia, con la procedencia; la referencia viva haría que un cambio de BE pise una adaptación |
| D-4 | ¿De quién es la foto? | De BE, con una finalidad propia de catálogo; la copia la cita |
| D-5 | ¿La persona ve que la receta vino de la biblioteca? | No hace falta: ve la receta de su profesional |

**Alternativas descartadas:**
- compartir las recetas de una profesional con todos (cambia la visibilidad de algo privado y borra la autoría);
- una marca «pública» en las recetas propias (mezcla autoría y curaduría, y una adaptación quedaría expuesta);
- cargar las mismas recetas en la cuenta de cada profesional (se duplican y nunca se actualizan).

## Costo y dependencias

Un agregado nuevo (la receta de BE con sus versiones y su estado), su revisión y su publicación en la API; una sección
en el website («Biblioteca de BE», con «Usar como base»); el rol de curador; la finalidad de medio de catálogo; y las
pruebas. La APK no cambia: los planes siguen citando recetas propias. Depende de decidir D-1 a D-5.
