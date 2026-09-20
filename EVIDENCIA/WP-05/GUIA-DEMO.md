# WP-05 — Guía de demo de antropometría, métodos y cálculos

El recorrido completo, paso a paso. Para cada paso dice qué cuenta usar, qué datos cargar y qué tiene que verse en pantalla.

- **Website:** lo capturó un navegador automatizado contra `test`, en `web/`.
- **APK:** lo captura Dirección en su teléfono, con esta misma guía. Los nombres `apk-…` son los que corresponden a cada paso.

Duración: unos 20 minutos. La parte del teléfono, sola, son 5.

## Antes de empezar

| Qué | Dónde |
|---|---|
| Website | `https://be-web-1ngj.onrender.com` |
| API (despertarla un minuto antes) | `https://be-api-hndp.onrender.com/health/ready` → tiene que responder `200` con `"aplicacion":"0.5.1"` |
| **APK 0.5.1** | `https://github.com/Elian-Bufi/be/releases/download/be-apk-0.5.1/be-0.5.1-0193a3d.apk` · SHA-256 `482170b86014dec9ade11ca2d4277a58df29937ba87cf38135c3c0f211ce386b`. Se instala encima de la 0.4.0 o de la 0.5.0 |

> **Ojo: tiene que ser la 0.5.1, no la 0.5.0.** La respuesta de la evolución cambió de forma para alinearse con el 09, y el cliente del APK valida el contrato con objetos estrictos: una 0.5.0 instalada rechaza la respuesta entera y «Mi evolución» no carga. Si ya tenés la 0.5.0 en el teléfono, instalar la 0.5.1 encima alcanza.

**Cuentas.** Las contraseñas están en `.env.cuentas-demo`, en el clon local de Dirección; no están en el repositorio.

| Alias | Qué es | Dónde se usa |
|---|---|---|
| **DEMO-PA** | Profesional **sin ninguna Especialidad**, con la capacidad antropométrica verificada y habilitada. Es la identidad válida de 06 §8.10, y existe para poder mostrarla | Website |
| **DEMO-A01** | Asesorado | APK, en el teléfono |
| **DEMO-PN** | Profesional de Nutrición, que **además** tiene la capacidad antropométrica: es transversal, nunca una tercera Especialidad (06:2774) | Website, solo en la parte 4 |

Todos los datos que se cargan son sintéticos. El catálogo de protocolos y métodos está rotulado como **de demostración** y lo dice en pantalla: BE no fija una fórmula profesional universal (REG-06-208).

## Parte 0 — Vínculo y consentimientos (flujo de WP-03)

Sin vínculo aceptado, B2 y A3, el profesional no ve nada. Es la garantía de WP-03 y hay que cumplirla antes de empezar.

| # | Cuenta · superficie | Qué hacer | Qué tiene que verse |
|---|---|---|---|
| 0.1 | DEMO-A01 · APK | Abrir la app | Bienvenida con `app 0.5.1 · test · commit 0193a3d` (`apk-01-bienvenida-0.5.1`) |
| 0.2 | DEMO-A01 · APK | Iniciar sesión → Cuenta | Entre los botones de arriba está **«Antropometría: Mi evolución»** (`apk-02-cuenta`) |
| 0.3 | DEMO-PA · website | Iniciar sesión → «Ir al espacio profesional» → «Solicitar vínculo», con el identificador de DEMO-A01 y alcance **Antropometría** | «Solicitud enviada» |
| 0.4 | DEMO-A01 · APK | Cuenta → «Vínculos» → la solicitud → «Aceptar vínculo» → «Revisar consentimiento» → «Autorizar acceso» | «Acceso autorizado» |
| 0.5 | DEMO-A01 · APK | Cuenta → «Privacidad y consentimientos». Si el tratamiento de datos de salud (A3) no está otorgado, autorizarlo | A3 otorgado |
| 0.6 | DEMO-A01 · APK | Cuenta → «Antropometría: Mi evolución» | «Todavía no hay mediciones registradas en este período.» (`apk-03-evolucion-vacia`) |

## Parte 1 — El profesional prepara y registra una evaluación (website)

| # | Qué hacer y qué datos cargar | Qué tiene que verse | Captura |
|---|---|---|---|
| 1.1 | DEMO-PA: «Tus asesorados» → «Abrir» en DEMO-A01 | El workspace con el enlace **«Abrir Antropometría»** | `web-02` |
| 1.2 | «Abrir Antropometría» | Pestañas Evaluaciones · En preparación · Evolución | `web-03` |
| 1.3 | Pestaña **En preparación** | El aviso de que **una evaluación en preparación no forma parte de la historia**: no aparece en la evolución ni como última evaluación registrada | `web-04` |
| 1.4 | «Agregar medición» dos veces. Peso = 72,5 kg; talla = 1,75 m. Las dos, «Medición del profesional», protocolo «Protocolo de laboratorio (demostración)», con su momento de toma | Cada medición con su **unidad de origen** y su **momento**, que es de la toma y no del guardado | `web-05` |
| 1.5 | «Guardar» | «Guardado». El borrador existe, y sigue sin ser historia | `web-06` |
| 1.6 | «Registrar evaluación» | El aviso: «Al registrarla pasa a formar parte de la historia del asesorado y de su evolución. Después no se edita: si hace falta cambiar un valor, se corrige o se anula la medición, y queda constancia.» | `web-07` |
| 1.7 | «Registrar esta evaluación» | «Evaluación registrada. Ya forma parte de la evolución.» | `web-08` |

## Parte 2 — Medido, calculado y la referencia profesional (website)

| # | Qué hacer y qué datos cargar | Qué tiene que verse | Captura |
|---|---|---|---|
| 2.1 | Pestaña **Evaluaciones** | La evaluación con la insignia **«Solo lectura»**, cada medición rotulada **Medido** y **Vigente**, y el protocolo a la vista | `web-09` |
| 2.2 | «Calcular con un método» | El aviso de admisibilidad: «Que una medición exista no alcanza: cada versión del método declara qué necesita, en qué unidad y obtenida de qué manera.» El método dice su **versión**, su **regla** y su **precisión declarada** | `web-10` |
| 2.3 | Elegir peso y talla como entradas → «Calcular» | «Cálculo registrado.» El resultado aparece rotulado **Calculado**, con método, versión, regla y decimales | `web-11` |
| 2.4 | «Dejar como referencia» | El aviso: «Dejar un cálculo como referencia no cambia el cálculo ni borra los otros, y no crea un objetivo ni una prescripción.» | `web-12` |
| 2.5 | Confirmar | El cálculo queda con la insignia **Referencia**. Los demás cálculos siguen ahí, sin marca | `web-13` |

**Lo que se está mostrando:** BE no promedia, no ordena por «mejor» y no elige. Si hay dos cálculos, conviven. Dejar uno como referencia es un acto del profesional, con su fecha y su autor, y no toca ninguno.

## Parte 3 — Corregir y anular son dos actos distintos (website)

| # | Qué hacer | Qué tiene que verse | Captura |
|---|---|---|---|
| 3.1 | En el peso, «Corregir medición». Valor 73,1 kg, motivo «Se leyó mal la balanza en la toma.» | El formulario pide el motivo: una corrección sin motivo no existe | `web-14` |
| 3.2 | Confirmar | «Corrección registrada. El valor original se conserva.» En «Correcciones» están el valor original y el vigente | `web-15` |
| 3.3 | En la talla, «Anular medición» | El aviso: «Anular no borra nada: la medición y su historia se conservan, con el motivo y quién la anuló. Deja de contar para la evolución y para los cálculos.» **No es un botón de peligro** | `web-16` |
| 3.4 | Motivo «Se midió con el calzado puesto.» → «Anular esta medición» | «Medición anulada. Su historia se conserva.» La medición sigue visible, rotulada **Anulada**, con su valor original | `web-17` |
| 3.5 | Mirar el cálculo de la parte 2 | Quedó rotulado **Sin efecto**: una de sus entradas se anuló. El resultado se conserva porque es parte de la historia | `web-17` |

## Parte 4 — Lo que el otro profesional no ve (website)

| # | Qué hacer | Qué tiene que verse | Captura |
|---|---|---|---|
| 4.1 | DEMO-PA deja un borrador sin registrar (una medición de perímetro de cintura) | El borrador aparece en «En preparación» | — |
| 4.2 | Entrar con **DEMO-PN**, que también tiene capacidad antropométrica y vínculo activo con la misma persona → «Abrir Antropometría» → «En preparación» | **«No hay ninguna evaluación en preparación.»** El borrador del otro profesional no existe para él: ni bloqueado, ni existente | `web-19` |

## Parte 5 — El asesorado ve su evolución (APK)

| # | Qué hacer | Qué tiene que verse | Captura |
|---|---|---|---|
| 5.1 | DEMO-A01 · APK: Cuenta → «Antropometría: Mi evolución» | El período, y el aviso «Los días sin medición aparecen como “Sin dato”. No se completan con cero ni se unen con una línea.» | `apk-04-mi-evolucion` |
| 5.2 | Mirar la lista | Los días con medición muestran su valor y su unidad, rotulados **Medido**. Los días sin medición dicen **«Sin dato»**, sin ningún número al lado | `apk-05-sin-dato` |
| 5.3 | Buscar la talla | No aparece: quedó anulada en el paso 3.4, y una medición anulada deja de aportar punto. **No aparece como cero** | `apk-05-sin-dato` |
| 5.4 | Volver | «Volver a Cuenta» como enlace visible, no solo el gesto del sistema | — |

**Lo que se está mostrando, y es el corazón del paquete:** no hay gráfico de línea. Una línea tendría que inventar el tramo que falta, y eso es justo lo que el legajo prohíbe (INV-06-177). La lista es la forma honesta de mostrar una serie con huecos.

## Qué mirar si hay que resumir en una frase

Que **BE no completa lo que no sabe y no decide por el profesional**: un hueco se ve como hueco, un derivado se ve con su método y su versión a la vista, anular conserva la historia y elegir una referencia es un acto de la persona, no del sistema.
