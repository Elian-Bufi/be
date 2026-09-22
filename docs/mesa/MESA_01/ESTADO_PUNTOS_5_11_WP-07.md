# MESA-01 — estado de DV-11 y de DV-05 tras WP-07

> Nota de actualización del ejecutor técnico. **No modifica** la matriz ni el informe del 2026-09-10: esos archivos están en `docs/MANIFEST.sha256`, y editarlos rompería la verificación de hashes de la entrega de Dirección. Cuando Dirección quiera consolidar, reemplaza los archivos y reemite el manifiesto.

**Fecha:** 2026-09-22 · **Paquete:** WP-07 «Información profesional pertinente» (RF-071) · **Fuente de exigencia:** `Entregables.pdf` de la escuela. El punto 11 es DV-11 en la matriz: «URL a una DEMO que muestre funcionalidades de APK y Website».

## Por qué este paquete no estaba en el plan

El plan de cierre del 2026-09-10 no lo contemplaba, y conviene decir por qué apareció: **la auditoría de UX del cierre de WP-06 encontró que RF-071 es P0 —«núcleo no recortable»— y que ningún paquete lo cubría**. WP-05 lo había dejado fuera de su tabla de alcance sin declararlo como deuda. Quedó registrado como DL-090 y Dirección decidió el 2026-09-21 construirlo antes que todo lo demás.

Es el tipo de hallazgo que la matriz de cobertura existe para prevenir, y que se encontró revisando el producto, no el papel.

## Punto 11 — Demo de APK y Website

### Qué cambió respecto de WP-06

| Elemento | Estado tras WP-07 | Dónde |
|---|---|---|
| Aplicación ejecutable | ✅ Website y API **0.7.0** en `test`, y APK **0.7.0** en un release permanente. Se suma el **primer circuito transversal**: no pertenece a ningún alcance, atraviesa los tres | `EVIDENCIA/WP-07/verificacion-urls.txt` · `apk.txt` |
| Usuarios demo | ✅ DEMO-PT pide información y la recibe; el asesorado responde y corrige desde la APK. Es el primer circuito donde **el asesorado aporta contenido estructurado**, no solo registros de su plan | `GUIA-DEMO.md` |
| Datos sintéticos | ✅ Catálogo de dos formularios rotulado «de demostración: no es un catálogo clínico», con identificadores estables | migración `20260921220000_formularios_de_informacion_profesional` |
| Grabación | **No se hizo**, por el mismo motivo que en WP-04, WP-05 y WP-06. En su lugar, capturas del estado final: 9 del website, automatizadas contra `test` | `EVIDENCIA/WP-07/web/` |

### Qué suma la demo

Un circuito corto pero que muestra algo que los otros tres no podían mostrar: **el asesorado como origen de información, con control sobre ella**.

1. **El profesional pide, y pedir no concede.** Elige campos de un formulario versionado —no el formulario entero—, declara para qué los necesita, y la pantalla dice antes de enviar que eso no amplía su acceso ni el consentimiento.
2. **El asesorado decide.** Ve quién le pide qué y para qué, completa lo que quiere y deja el resto en blanco. No hay barra de avance, ni recordatorio, ni nada que presente el silencio como incumplimiento.
3. **Lo que responde es suyo y se dice.** Cada dato lleva «Declarado por la persona», y el detalle abre aclarando que no es una medición ni un diagnóstico.
4. **Corregir no borra.** La respuesta original queda visible y fechada; la corrección se agrega con su motivo y la vigente se marca por relación, no por fecha.
5. **Si el consentimiento se revoca, el profesional deja de ver; el titular no.** El mismo recurso responde 404 para uno y 200 para el otro.

### Estado de DV-11

| | Antes de WP-07 | Ahora |
|---|---|---|
| Circuitos demostrables de punta a punta | 3 (nutrición, antropometría, entrenamiento) | **4**, y el cuarto es transversal a los tres |
| Superficies | Website + APK | Igual, con la APK sumando una pantalla donde el asesorado **aporta** información, no solo registra su plan |
| Cobertura del punto | Cubierto | **Cubierto, con más superficie**: el punto pide mostrar funcionalidades de las dos superficies, y este circuito las necesita a las dos para completarse |

## Punto 5 — DV-05

Sin cambios de fondo: WP-07 no toca identidad, sesiones ni el modelo de autorización. Lo que sí hace es **ejercitar el PDP desde un ángulo nuevo**: por primera vez una lectura se decide con el Alcance **de la fila**, no con uno fijo del módulo, porque una misma pantalla lista solicitudes de alcances distintos. El PDP no necesitó ningún cambio para eso.

## Lo que esta nota no dice

No dice que el sistema esté completo. Los agujeros conocidos siguen donde estaban y están declarados: no hay verificación profesional real ni rol administrador (DL-036), el dashboard no muestra contenido de los dominios (DL-031), y no hay recuperación de contraseña (fuera de alcance desde WP-02 §8). La decisión de alcance del 2026-09-22 los deja explícitamente fuera de la entrega, con su fundamento, en vez de dejarlos a medio construir.
