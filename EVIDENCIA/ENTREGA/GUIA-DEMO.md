# Guía de demo de la entrega — BE 0.9.0

La demo para el tribunal (DV-11), en un solo recorrido de unos 22 minutos:
- qué es BE;
- cómo trabaja el profesional en las tres especialidades;
- cómo participa el asesorado desde la APK;
- por qué nada de eso se convierte en un diagnóstico.

El detalle de cada circuito está en la guía de su paquete (`EVIDENCIA/WP-04/GUIA-DEMO.md`, `WP-05/`, `WP-06/`) y en `EVIDENCIA/WP-07/LEEME.md`. Esta guía los junta. Las capturas de referencia del website están en `capturas-web/`.

## Antes de empezar

| Qué | Dónde |
|---|---|
| Website | `https://be-web-1ngj.onrender.com` |
| API (despertarla dos minutos antes: el plan gratuito duerme) | `https://be-api-hndp.onrender.com/health/ready` → `200` con `"aplicacion":"0.9.0"` |
| **APK 0.9.0** | `https://github.com/Elian-Bufi/be/releases/download/be-apk-0.9.0/be-0.9.0-fd08380.apk` · SHA-256 `021af7b1a21f5ac90b342000f5f5f23e0f818a0256d345d5e033c6cf82e4551d`. Se instala encima de cualquier versión anterior. Es la primera con el tema oscuro y el ícono nuevo. La landing la ofrece en «Descargar la APK de prueba» |

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
| 1.2 | Señalar el aviso del encabezado | «Ambiente de prueba · solo datos sintéticos» está en todas las pantallas (08 §33) |
| 1.3 | «Ya tengo una cuenta» | El acceso, en el mismo tema oscuro. Iniciar sesión con **DEMO-PN** |

## 2 · El espacio profesional (4 minutos)

| # | Qué hacer | Qué mostrar |
|---|---|---|
| 2.1 | «Ir al espacio profesional» | Una tarjeta **por asesorado**, con cada alcance y su estado. El vínculo es por alcance; el workspace es uno por persona |
| 2.2 | «Abrir» en la tarjeta «Asesorado · c36743» (DEMO-A01) | El header contextual (nombre, alcances, estado) y las **tarjetas de dominio**: plan vigente, objetivo con quién lo escribió, registros del período, revisiones. **Sin puntaje ni semáforo** (B10-08 §10) |
| 2.3 | «Abrir Nutrición» → Registros | Lo prescripto y lo registrado por día. Un día sin registro dice «Sin registro»: **nunca un cero** (B10-10 §1) |

## 3 · La toma antropométrica sobre la figura (4 minutos): el momento que más suma

Iniciar sesión con **DEMO-PA** → «Asesorado · c36743» → «Abrir Antropometría» → **En preparación**.

| # | Qué hacer | Qué mostrar |
|---|---|---|
| 3.1 | Si el borrador abre con el «Protocolo de laboratorio (demostración)», elegir **«Pliegues y perímetros (demostración)»** | El protocolo declara qué se mide. Lo que ya estaba cargado pasa a su campo si el protocolo lo declara en esa unidad; lo demás queda «Fuera del protocolo». **Nada se pierde y ninguna unidad se convierte** (B10-07 §17) |
| 3.2 | Mirar la figura | La figura **ubica** cada sitio de toma: el pliegue es un punto y el perímetro un anillo, de frente y de espalda |
| 3.3 | Tocar un punto | Lleva a su campo en la lista, que es la tabla equivalente y el camino del teclado |
| 3.4 | Cargar un pliegue tricipital de **8,5** y uno subescapular de **31** | Los dos puntos se llenan **igual**. La figura dice dónde se midió y que ya hay dato, **nunca si el valor es alto o bajo**. Es RF-048 llevado al color, y lo sostiene una prueba: el punto no recibe el valor |
| 3.5 | «Guardar» y después «Registrar evaluación» | Registrar es un acto aparte, con su confirmación. Después no se edita: se corrige agregando (RF-050) |

## 4 · Información pertinente: pedir no es acceder (3 minutos)

| # | Qué hacer | Qué mostrar |
|---|---|---|
| 4.1 | Con **DEMO-PT**, en el workspace de «Asesorado · c36743»: «Pedir información» | Antes de cualquier acción, el aviso: **pedir no amplía el acceso ni el consentimiento**. El pedido se arma campo por campo, con su propósito. Un campo requerido igual puede quedar sin responder: el asesorado decide (RF-071) |
| 4.2 | «Enviar solicitud» | La solicitud queda «Sin responder», con «No responder también es una opción». Ningún porcentaje de avance |
| 4.3 | En la APK, con **DEMO-A01**: Cuenta → «Información» | La solicitud, con quién la pidió y para qué. Responder un campo y dejar otro en blanco; «Enviar respuesta» |
| 4.4 | Volver al website y actualizar | La respuesta llega rotulada **«Declarado por la persona»**: no es una medición ni un diagnóstico. El campo en blanco no aparece como un incumplimiento |

## 5 · El asesorado en la APK (5 minutos)

Con **DEMO-A01** en el teléfono.

| # | Qué hacer | Qué mostrar |
|---|---|---|
| 5.1 | Abrir la app | La bienvenida con el isotipo y la identidad del build: versión, ambiente y commit |
| 5.2 | Cuenta → Nutrición: **Hoy** | Qué tiene que comer hoy; registrar una comida del plan |
| 5.3 | Cuenta → **Entrenamiento de hoy** | La sesión del plan; registrar lo que hizo, con desvío o sin él |
| 5.4 | Cuenta → **Mi evolución** | La serie de sus mediciones, con los días sin medición como «Sin dato» |
| 5.5 | **Al final, porque deshace el acceso:** Cuenta → Vínculos → el de Nutrición → «Revocar acceso de …» → «Revocar acceso» | En el website, DEMO-PN **actualiza** el workspace: la tarjeta de Nutrición desaparece y queda un único aviso de vista parcial, sin decir por qué. El PDP decide en cada lectura. El profesional no vuelve a ver nada hasta que haya un consentimiento nuevo (el flujo está en `EVIDENCIA/WP-03/`) |

## 6 · Cómo se sabe que todo esto es cierto (3 minutos)

| Pregunta del tribunal | Dónde está la respuesta |
|---|---|
| ¿Cómo prueban lo que dicen? | La CI de `main`: más de 420 pruebas de integración contra PostgreSQL real, por ID de prueba del 11A (`EVIDENCIA/*/resultados-integracion-*.md`; la del estado entregado, en `EVIDENCIA/ENTREGA/`) |
| ¿Es accesible? | Una prueba automática de contraste en cada `npm test` y la auditoría axe-core de las pantallas núcleo: **cero violaciones** (`EVIDENCIA/IDENTIDAD/`) |
| ¿Qué quedó afuera y por qué? | `docs/DEUDA_LEGAJO.md`: cada deuda con lo que dice el legajo, las opciones y la decisión |
| ¿Por qué no hay integraciones externas en la demo? | Están implementadas y probadas en el PR #72 (Open Food Facts y wger), a la espera de que Dirección confirme la cobertura del acta (`DEFENSA/WP-08.md` en esa rama) |

## Si algo falla

- **La API tarda o responde 502:** está despertando. Esperar un minuto y recargar.
- **La APK no carga una pantalla:** confirmar que es la 0.9.0 (Bienvenida, al pie). Los clientes validan cada respuesta con objetos estrictos: una versión vieja rechaza lo que no conoce.
- **Se cerró la sesión del website al recargar:** es a propósito. La sesión vive solo en la memoria de la pestaña (DL-012).
- **Después de un ensayo que llegó al paso 5.5:** el acceso de Nutrición quedó revocado. Para dejar la demo lista otra vez, en la APK: Cuenta → Vínculos → el de Nutrición → «Autorizar nuevamente» → «Autorizar acceso». Es un consentimiento nuevo; el revocado queda en el historial.
- **«Demasiados intentos» al iniciar sesión:** el límite es de 5 intentos cada 15 minutos por red y cuenta (DL-015). Esperar o usar otra cuenta demo.
