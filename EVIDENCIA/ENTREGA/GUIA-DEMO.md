# Guía de demo de la entrega — BE (APK 0.13.1 · API y website en `6213ec8`)

La demo para el tribunal (DV-11), en un solo recorrido de unos 25 minutos:
- qué es BE;
- cómo trabaja el profesional en las tres especialidades;
- cómo participa el asesorado desde la APK;
- por qué nada de eso se convierte en un diagnóstico.

El detalle de cada circuito está en la guía de su paquete (`EVIDENCIA/WP-04/GUIA-DEMO.md`, `WP-05/`, `WP-06/`) y en `EVIDENCIA/WP-07/LEEME.md`. Lo nuevo de la 0.13.0 y la 0.13.1 está en cuatro evidencias:
- **la barra inferior de la APK y los avisos:** `EVIDENCIA/UX-DL113/LEEME.md`;
- **el catálogo de 21 métodos y la lámina:** `EVIDENCIA/ANTROPOMETRIA-DL111/LEEME.md` y la misma `UX-DL113`;
- **el pulido del 2/10, con la toma por fecha y «Mi evolución» más clara:** `EVIDENCIA/UX-PULIDO-DL113/LEEME.md`;
- **la publicación:** `EVIDENCIA/PUBLICACION-0.13.1/LEEME.md`.

Esta guía los junta. Las capturas de referencia del website están en `capturas-web/`. Son del 2026-09-24, anteriores a la lámina y a los avisos nuevos.

## Antes de empezar

| Qué | Dónde |
|---|---|
| Website | `https://be-web-1ngj.onrender.com` |
| API (despertarla dos minutos antes: el plan gratuito duerme; el 2026-10-02 tardó 33 s en responder) | `https://be-api-hndp.onrender.com/health/ready` → `200` con `"aplicacion":"0.11.1"` y `"commit":"6213ec8…"` |
| **APK 0.13.1** | `https://github.com/Elian-Bufi/be/releases/download/be-apk-0.13.1/be-0.13.1-6213ec8.apk` · SHA-256 `177834d21fca796acbe24409210eb62d8f3c8847535e81ef7e3a5b0a63229802`. Se instala encima de la anterior, sin desinstalar (misma firma). Trae la barra inferior con cinco zonas (Nutrición, Entrenamiento, Evolución, Información y Cuenta) y abre en Nutrición. Dibuja la figura de «Mi evolución» en SVG, con el bíceps y la cresta ilíaca a su altura anatómica, y dice cada fecha una vez. La landing la ofrece en «Descargar la APK de prueba», que apunta a `releases/latest` |

**La 0.13.1 todavía no se validó en un teléfono.** El recorrido de validación está en `EVIDENCIA/PUBLICACION-0.13.1/LEEME.md`. Hacer el ensayo completo con el teléfono de la demo antes de presentarla.

**Cuentas.** Las contraseñas están en `.env.cuentas-demo`, en el clon local de Dirección, no en el repositorio. Todos los datos son sintéticos, y las pantallas lo dicen.

| Alias | Qué es | Dónde |
|---|---|---|
| **DEMO-PN** | Profesional de Nutrición | Website |
| **DEMO-PT** | Profesional de Entrenamiento | Website |
| **DEMO-PA** | Profesional con la capacidad antropométrica | Website |
| **DEMO-A01** | Asesorado, vinculado con los tres (verificado en `test` el 2026-09-24: vínculo aceptado y consentimiento activo en Nutrición, Entrenamiento y Antropometría). En el website aparece como **«Asesorado · c36743»**, el final de su identificador BE | APK, en el teléfono |

## 1 · La cara pública (2 minutos)

| # | Qué hacer | Qué mostrar |
|---|---|---|
| 1.1 | Abrir el website | La landing: **qué es BE** con las palabras del legajo (02 §3.2), qué hace por el profesional y por el asesorado (02 §9) y **lo que BE no hace**: no diagnostica, no puntúa personas, no arma planes solo y nadie ve datos sin autorización (02 §14) |
| 1.2 | Bajar hasta el pie y señalar el aviso | «Ambiente de prueba: usá solo datos sintéticos. No ingreses datos reales de personas.» está en el pie de la cara pública y, con otras palabras, en el registro (08 §33). Desde WP-ESCRITORIO-AMABLE ya no va en la barra de cada pantalla; la APK conserva su franja |
| 1.3 | «Ya tengo una cuenta» | El acceso, en el mismo tema oscuro. Iniciar sesión con **DEMO-PN** |

## 2 · El espacio profesional (4 minutos)

| # | Qué hacer | Qué mostrar |
|---|---|---|
| 2.1 | «Ir al espacio profesional» | Una tarjeta **por asesorado**, con cada alcance y su estado. El vínculo es por alcance; el workspace es uno por persona |
| 2.2 | «Abrir» en la tarjeta «Asesorado · c36743» (DEMO-A01) | El header contextual (nombre, alcances, estado) y las **tarjetas de dominio**: plan vigente, objetivo con quién lo escribió, registros del período, revisiones. **Sin puntaje ni semáforo** (B10-08 §10) |
| 2.3 | «Abrir Nutrición» → Registros | Lo prescripto y lo registrado por día. Un día sin registro dice «Sin registro»: **nunca un cero** (B10-10 §1) |

## 3 · La toma sobre la figura, los cálculos y la lámina (7 minutos): el momento que más suma

Iniciar sesión con **DEMO-PA** → «Asesorado · c36743» → «Abrir Antropometría». Las pestañas son «Evaluaciones», «En preparación», «Evolución» y «Lámina»: arrancar en **En preparación**.

| # | Qué hacer | Qué mostrar |
|---|---|---|
| 3.1 | Si el borrador abre con el «Protocolo de laboratorio (demostración)», elegir **«Pliegues y perímetros (demostración)»** | El protocolo declara qué se mide. Lo que ya estaba cargado pasa a su campo si el protocolo lo declara en esa unidad; lo demás queda «Fuera del protocolo». **Nada se pierde y ninguna unidad se convierte** (B10-07 §17) |
| 3.2 | Mirar la figura | La figura **ubica** cada sitio de toma: el pliegue es un punto y el perímetro un anillo, de frente y de espalda |
| 3.3 | Tocar un punto | Lleva a su campo en la lista, que es la tabla equivalente y el camino del teclado |
| 3.4 | Cargar un pliegue tricipital de **8,5** y uno subescapular de **31**. En la lista, cargar también el peso (**70 kg**) y la talla (**172 cm**), que no tienen sitio en la figura | Los dos puntos se llenan **igual**. La figura dice dónde se midió y que ya hay dato, **nunca si el valor es alto o bajo**. Es RF-048 llevado al color, y lo sostiene una prueba: el punto no recibe el valor. El peso y la talla son para el paso 3.6 |
| 3.5 | «Guardar» y después «Registrar evaluación» | «Guardado» aparece abajo, donde se está mirando. Registrar es un acto aparte: se confirma en un diálogo centrado, «Registrar esta evaluación». Después no se edita: se corrige agregando (RF-050) |
| 3.6 | En «Evaluaciones», abrir la evaluación registrada → «Cálculos» → «Calcular con un método» | El selector separa **«Se pueden calcular con esta toma»** de **«Les faltan datos de esta toma»**. El catálogo de BE tiene **21 métodos**, cada uno con su fuente y su población; en `test` se suma uno sintético de demostración. Elegir **«Índice de masa corporal (IMC)»**: la ficha dice qué da, qué pide con el valor de esta toma y en qué población se validó, y deja plegadas la fuente y la regla. «Calcular»: el aviso de éxito aparece abajo y se va solo. Después elegir un método de Durnin y Womersley: al lado de cada dato que la toma no tiene dice «Falta en esta toma», y «Calcular» queda deshabilitado. BE no calcula con lo que no hay. Si la toma ya tuviera ese resultado calculado con otro método, un aviso lo diría antes de calcular: los dos conviven, BE no elige |
| 3.7 | «Ver lámina» en la misma evaluación → hoja «Pliegues» | La lámina del compositor arma la toma sobre la figura: **ubica cada medida y no califica ningún valor**. El bíceps y la cresta ilíaca tienen su lugar en la figura y aparecen cuando la toma los tiene. Al pie van las dos sumas de pliegues; acá, con dos pliegues, dicen «Sin calcular». «Descargar imagen» baja la lámina como PNG |

## 4 · Información pertinente: pedir no es acceder (3 minutos)

| # | Qué hacer | Qué mostrar |
|---|---|---|
| 4.1 | Con **DEMO-PT**, en el workspace de «Asesorado · c36743»: «Pedir información» | Antes de cualquier acción, el aviso: **pedir no amplía el acceso ni el consentimiento**. El pedido se arma campo por campo, con su propósito. Un campo requerido igual puede quedar sin responder: el asesorado decide (RF-071) |
| 4.2 | «Enviar solicitud» | La solicitud queda «Sin responder», con «No responder también es una opción». Ningún porcentaje de avance |
| 4.3 | En la APK, con **DEMO-A01**: zona **Información** de la barra inferior | La solicitud, con quién la pidió y para qué. Responder un campo y dejar otro en blanco; «Enviar respuesta» |
| 4.4 | Volver al website y actualizar | La respuesta llega rotulada **«Declarado por la persona»**: no es una medición ni un diagnóstico. El campo en blanco no aparece como un incumplimiento |

## 5 · El asesorado en la APK (5 minutos)

Con **DEMO-A01** en el teléfono.

| # | Qué hacer | Qué mostrar |
|---|---|---|
| 5.1 | Abrir la app e iniciar sesión | La bienvenida con el isotipo y la identidad del build al pie: `app 0.13.1 · test · commit 6213ec8`. Al entrar, la APK abre en Nutrición, con la barra de cinco zonas abajo. La zona elegida se marca con una barrita y en negrita, y la barra se esconde mientras el teclado está abierto |
| 5.2 | Zona **Nutrición**: «Tu plan de hoy» | Qué tiene que comer hoy; «Registrar comida» con una comida del plan |
| 5.3 | Zona **Entrenamiento**: «Entrenamiento de hoy» | La sesión del plan; registrar lo que hizo, con desvío o sin él. «Tu historial» muestra lo anterior |
| 5.4 | Zona **Evolución**: «Mi evolución» | La última toma sobre la figura (los perímetros son elipses), los resultados calculados de esa toma con su método (por ejemplo, el IMC del paso 3.6) y la serie de cada medida, con los días sin medición como «Sin dato». Las explicaciones están plegadas en «Cómo se lee», y «La figura, en lista» es la tabla equivalente |
| 5.5 | **Al final, porque deshace el acceso:** zona **Cuenta** → «Vínculos» → el de Nutrición → «Revocar acceso de …» → «Revocar acceso» | En el website, DEMO-PN **actualiza** el workspace: la tarjeta de Nutrición desaparece y queda un único aviso de vista parcial, sin decir por qué. El PDP decide en cada lectura. El profesional no vuelve a ver nada hasta que haya un consentimiento nuevo (el flujo está en `EVIDENCIA/WP-03/`) |

## 6 · Cómo se sabe que todo esto es cierto (3 minutos)

| Pregunta del tribunal | Dónde está la respuesta |
|---|---|
| ¿Cómo prueban lo que dicen? | La CI de `main`, con las pruebas de integración contra PostgreSQL real, por ID de prueba del 11A. La última corrida completa registrada dio **561/561 en 39 suites**, en la CI del PR #126 (`EVIDENCIA/ANTROPOMETRIA-DL111/LEEME.md`). La del 2026-09-24 está en `EVIDENCIA/ENTREGA/` |
| ¿Es accesible? | Una prueba automática de contraste en cada `npm test` y la auditoría axe-core de las pantallas núcleo: **cero violaciones** (`EVIDENCIA/IDENTIDAD/`). TalkBack y la letra del sistema al máximo todavía no se probaron en un Android físico (RNF-ACC-001) |
| ¿Qué quedó afuera y por qué? | `docs/DEUDA_LEGAJO.md`: cada deuda con lo que dice el legajo, las opciones y la decisión. El inventario de lo que falta, en `docs/QUE-FALTA.md` |
| ¿Y las APIs externas? | Open Food Facts y wger están integradas desde el 2026-09-25 (WP-08, PR #72): el profesional importa un alimento o un ejercicio, lo revisa y queda con su procedencia a la vista. No están en este recorrido; el detalle, en `EVIDENCIA/WP-08/` |

## Si algo falla

- **La API tarda o responde 502:** está despertando. Esperar un minuto y recargar.
- **La APK no muestra la barra inferior o no carga una pantalla:** confirmar que es la 0.13.1 (Bienvenida, al pie). La barra y la figura en SVG viajan desde la 0.13.0. Además, los clientes validan cada respuesta con objetos estrictos: una versión vieja rechaza lo que no conoce.
- **El paso 3.6 no ofrece el IMC:** el IMC pide la talla en cm. Si se cargó en metros, la ficha dice «Está en otra unidad en esta toma»: cargarla en cm.
- **Se cerró la sesión del website al recargar:** es a propósito. La sesión vive solo en la memoria de la pestaña (DL-012).
- **Después de un ensayo que llegó al paso 5.5:** el acceso de Nutrición quedó revocado. Para dejar la demo lista otra vez, en la APK: zona Cuenta → «Vínculos» → el de Nutrición → «Autorizar nuevamente» → «Autorizar acceso». Es un consentimiento nuevo; el revocado queda en el historial.
- **Después de un ensayo que llegó al paso 3.5:** la evaluación registrada queda en la historia de DEMO-A01, porque registrar no se deshace. Un ensayo nuevo agrega otra toma; si hace falta, la medición se anula y su historia se conserva (RF-050).
- **«Demasiados intentos» al iniciar sesión:** el límite es de 5 intentos cada 15 minutos por red y cuenta (DL-015). Esperar o usar otra cuenta demo.
