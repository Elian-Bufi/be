# WP-04 — Guía de demo del circuito nutricional

El recorrido completo, paso a paso. Para cada paso dice qué cuenta usar, qué datos cargar y qué tiene que verse en pantalla. No hay video: por instrucción de Dirección, la evidencia son esta guía y las capturas del estado final de cada paso.

- **Website:** lo capturó un navegador automatizado contra `test` el 2026-09-19, en `web/` (19 capturas).
- **APK:** lo captura Dirección en su teléfono, con esta misma guía. Los nombres `apk-…` son los que corresponden a cada paso.

Duración: unos 25 minutos.

## Antes de empezar

| Qué | Dónde |
|---|---|
| Website | `https://be-web-1ngj.onrender.com` |
| API (despertarla un minuto antes) | `https://be-api-hndp.onrender.com/health/ready` → tiene que responder `200` |
| APK 0.4.0 | `https://github.com/Elian-Bufi/be/releases/download/be-apk-0.4.0/be-0.4.0-7b21cc7.apk` · SHA-256 `446a60c72a9f2c972ef8203b9988e19a2dcb2edf9b25f11993d8ce30e020a99b`. Se instala encima de la 0.3.0 |

**Cuentas.** Las contraseñas están en `.env.cuentas-demo`, en el clon local de Dirección; no están en el repositorio.

| Alias | Rol | Dónde se usa |
|---|---|---|
| **DEMO-PN** | Profesional de Nutrición (perfil sanitario) | Website, en la computadora |
| **DEMO-A01** | Asesorado | APK, en el teléfono |
| **DEMO-PT** | Profesional de Entrenamiento (perfil no sanitario) | Website, solo en la parte 5 |

Todos los datos que se cargan son sintéticos. El catálogo de alimentos tiene valores **sintéticos de demostración** y lo dice en pantalla.

## Parte 0 — Vínculo y consentimientos (flujo de WP-03)

Sin vínculo aceptado, B2 y A3, el profesional no ve nada: es la garantía de WP-03, y hay que cumplirla antes de empezar.

| # | Cuenta · superficie | Qué hacer | Qué tiene que verse |
|---|---|---|---|
| 0.1 | DEMO-A01 · APK | Abrir la app | Bienvenida con `app 0.4.0 · test · commit 7b21cc7` (`apk-01-bienvenida-0.4.0`) |
| 0.2 | DEMO-A01 · APK | Iniciar sesión → Cuenta | El primer botón es «Nutrición: Hoy», y está la sección «Tu identificador BE» |
| 0.3 | DEMO-PN · website | Iniciar sesión → «Ir al espacio profesional» → «Solicitar vínculo», con el identificador de DEMO-A01 y alcance Nutrición | «Solicitud enviada» |
| 0.4 | DEMO-A01 · APK | Cuenta → «Vínculos» → la solicitud → «Aceptar vínculo» → «Revisar consentimiento» → «Autorizar acceso» | «Acceso autorizado» |
| 0.5 | DEMO-A01 · APK | Cuenta → «Privacidad y consentimientos». Si el tratamiento de datos de salud (A3) no está otorgado, «Autorizar tratamiento de mis datos de salud» | A3 otorgado |
| 0.6 | DEMO-A01 · APK | Cuenta → «Nutrición: Hoy» | «Actualmente no tenés un plan activo de Nutrición.» (`apk-02-hoy-sin-plan`) |

## Parte 1 — El profesional evalúa, fija el objetivo, planifica y activa (website)

| # | Qué hacer y qué datos cargar | Qué tiene que verse | Captura |
|---|---|---|---|
| 1.1 | DEMO-PN: «Tus asesorados» → «Abrir» en DEMO-A01 | El workspace del asesorado con el enlace «Abrir Nutrición» | `web-01` |
| 1.2 | «Abrir Nutrición» | Pestañas Resumen · Plan · Registros · Revisiones. «Estado del seguimiento»: todavía no empezó, sin plan activo, sin evaluaciones. «Todavía no hay un objetivo definido.» | `web-02` |
| 1.3 | «Nueva evaluación». Datos: «Comidas por día» = 4 (unidad «comidas», informado por el asesorado); «Hidratación» = «Menos de un litro de agua por día» (informado); «Actividad observada en la consulta» = «Sin limitaciones» (observado por el profesional). Contexto: «Consulta inicial sintética.» | Cada dato con su fuente | `web-03` |
| 1.4 | «Registrar evaluación» | «Evaluación registrada», y en el Resumen, la fecha de la última evaluación | `web-04` |
| 1.5 | «Definir objetivo». Evaluación: la recién registrada. 2200 kcal por día; proteínas 110 g, carbohidratos 270 g y grasas 70 g por día; distribución «Cuatro comidas.»; fundamento «Fundamento profesional sintético: sostener la energía con cuatro comidas.» | El aviso «BE no calcula requerimientos: el objetivo es una decisión profesional con su fundamento.» | `web-05` |
| 1.6 | «Guardar nueva versión» | «Objetivo declarado por el profesional», con los valores cargados. Ningún texto dice «BE recomienda» | `web-06` |
| 1.7 | Pestaña Plan → «Crear nuevo plan» → «Agregar comida» (Almuerzo) → «Agregar opción» → «Agregar comida» (Cena) → «Guardar cambios» → «Validar plan» | «Borrador creado», no «Plan creado». Al validar: «Hay elementos por corregir» (la opción del almuerzo y la cena no tienen ítems). **Validar no activa** | `web-07` |
| 1.8 | Almuerzo, opción «Arroz con pollo»: «Agregar ítem» → buscar «Arroz blanco» → 100 g, cocido; «Pechuga de pollo» → 120 g, cocido. Cena, opción «Pollo con verduras»: «Pechuga de pollo» 150 g, cocido; «Zapallo» 100 g, cocido | La jerarquía Día tipo → Comida → Opción → Ítem, con cantidad, unidad y estado de preparación | `web-08` |
| 1.9 | «Guardar cambios» → «Validar plan» | «Plan válido». El borrador sigue siendo borrador | `web-09` |
| 1.10 | «Activar plan» | El diálogo «Activar plan»: «Estás por activar esta versión. El asesorado pasará a consultar esta planificación como vigente. La versión anterior se conservará en el historial.» | `web-10` |
| 1.11 | «Activar esta versión» | «Versión activada. El asesorado ya ve esta planificación como vigente.» La versión 1 aparece como «Solo lectura», con la huella de la instantánea, y **no tiene ningún botón de edición**: solo «Crear nueva versión a partir de esta» | `web-11` |

## Parte 2 — El asesorado ve su plan y registra lo que comió (APK)

| # | Qué hacer y qué datos cargar | Qué tiene que verse | Captura |
|---|---|---|---|
| 2.1 | DEMO-A01: Cuenta → «Nutrición: Hoy» | «Tu plan de hoy» → «Comidas del plan»: Almuerzo (Arroz con pollo: arroz blanco 100 g cocido, pechuga de pollo 120 g cocido) y Cena. Abajo: «Todavía no registraste comidas hoy.» | `apk-03-hoy-plan-vigente` |
| 2.2 | En Almuerzo, «Registrar comida». Cantidad de arroz: 80. Observación: «Me sobró un poco de arroz.» | Las cantidades dicen «opcional» y muestran lo indicado («Indicado: 100 g») | `apk-04-registrar-almuerzo` |
| 2.3 | «Guardar» | «Comida registrada». El almuerzo muestra «Registrado». **Nunca dice «Cumplido»**, y no hay porcentajes ni puntajes | `apk-05-almuerzo-registrado` |
| 2.4 | «Agregar comida fuera del plan». ¿Qué comiste?: «Una porción de tarta de verdura a la tarde.» Porción: «Una porción» | «Contanos qué comiste.» y «Podés describirlo con tus palabras. No hace falta que sea una medición exacta.» | `apk-06-fuera-del-plan` |
| 2.5 | «Guardar» | «Registros de hoy» lista dos registros: «DEL PLAN · Almuerzo» y «FUERA DEL PLAN · «Una porción de tarta…»». La cena sigue sin registro, sin ninguna marca de falta | `apk-07-registros-de-hoy` |
| 2.6 | «Plan actual» | La versión vigente, desde qué fecha rige y el «Objetivo declarado por el profesional» | `apk-08-plan-actual` |
| 2.7 | Volver a Hoy → «Ver todos mis registros» → el registro fuera del plan | «Tu descripción original» con el texto tal cual se escribió | `apk-09-detalle-registro` |

## Parte 3 — El profesional revisa y decide la continuidad (website)

| # | Qué hacer y qué datos cargar | Qué tiene que verse | Captura |
|---|---|---|---|
| 3.1 | DEMO-PN: pestaña Registros | El contraste del período. Hoy: Almuerzo «Registrado», con «prescripto 100 g · registrado 80 g · −20 g» como diferencia observada; Cena «Sin registro». La comida fuera del plan va aparte, con su registro original. Los días anteriores dicen «Sin registro»: **sin dato, no cero ni incumplimiento** | `web-12` |
| 3.2 | En la comida fuera del plan, «Agregar estimación»: «Tarta de verdura», 150 g → «Agregar estimación» | «Estimación profesional», y el registro original se conserva | `web-13` |
| 3.3 | Pestaña Revisiones → «Nueva revisión». Evidencia: los dos registros. Interpretación: «Registró el almuerzo con menos arroz que lo prescripto y una comida fuera del plan. Descripción, no diagnóstico.» Resultado: **Ajustar**. Fundamento: «Ajustar la porción de arroz a lo que efectivamente consume.» Próxima acción: «Preparar una nueva versión con 90 g de arroz.» | Los seis resultados posibles, cada uno con su efecto explicado. «La interpretación describe lo observado. No es un diagnóstico.» | `web-14` |
| 3.4 | «Registrar revisión» | «Revisión registrada. Todavía no se aplicó»: **registrar no cambia nada** | `web-15` |
| 3.5 | «Aplicar continuidad» | Se preparó una nueva versión del plan en borrador. La versión activa no cambió | `web-16` |
| 3.6 | «Abrir el borrador en Plan» → arroz 90 g → «Guardar cambios» | Arriba, el borrador sucesor, editable. Abajo, la versión 1 activa, en solo lectura | `web-17` |
| 3.7 | «Activar plan» → «Activar esta versión» | La versión 2 vigente. En el historial, «Versión 1 · anterior, conservada» | `web-18` |

## Parte 4 — El asesorado ve la versión nueva (APK)

| # | Qué hacer | Qué tiene que verse | Captura |
|---|---|---|---|
| 4.1 | DEMO-A01: Hoy → «Actualizar» | El almuerzo ahora indica arroz 90 g. El almuerzo ya registrado sigue «Registrado»: lo que se registró contra la versión 1 no se pierde | `apk-10-hoy-version-nueva` |

## Parte 5 — Otro alcance no ve nada de nutrición (website)

| # | Cuenta · superficie | Qué hacer | Qué tiene que verse | Captura |
|---|---|---|---|---|
| 5.1 | DEMO-PT · website y DEMO-A01 · APK | Repetir la parte 0 con DEMO-PT y alcance Entrenamiento (vínculo, «Autorizar acceso») | El workspace de DEMO-A01 del lado de DEMO-PT, sin «Abrir Nutrición» | — |
| 5.2 | DEMO-PT · website | Entrar a `/pro/advisees/nutrition?id=<identificador de DEMO-A01>` | «No encontramos un recurso disponible para esta acción»: lo mismo que ante un asesorado inexistente | `web-19` |

## Casos adversariales en vivo

Frente al tribunal, en una terminal con el repositorio y `.env.cuentas-demo`:

```bash
node scripts/adversariales-wp04.mjs
```

Imprime PASA o FALLA para cada caso:
- **8:** intentar editar, validar o reactivar la versión activada, y corregirla con una sucesora.
- **7 nutricional:** los días sin registro son «sin dato».
- **D9:** DEMO-PT recibe en las 18 operaciones el mismo 404 que ante lo inexistente.
- **Cero puntaje:** ninguna respuesta de la corrida lo tiene.

Crea un asesorado sintético nuevo en cada corrida y al final finaliza sus vínculos. Tarda alrededor de un minuto, más el despertar de la API. La corrida del 2026-09-19 está en `adversariales-test.json`.

## Si algo no sale como dice la guía

- **Error 404 en el workspace después de mucho tiempo sin uso.** La sesión vive solo en memoria (DL-012): volvé a iniciar sesión.
- **«No pudimos confirmar si se guardó» en el APK.** Es el resultado incierto: tocar «Reintentar» usa la misma clave y no duplica el registro.
- **«Tu plan de Nutrición no está disponible en este momento».** Falta B2 o A3 del lado del asesorado (parte 0).
