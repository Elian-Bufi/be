# WP-06 — Guía de demo del circuito de entrenamiento

El recorrido completo, paso a paso: el profesional evalúa, fija el objetivo, planifica y activa en el website; el asesorado entrena y registra en la APK; el profesional ve lo registrado, revisa y ajusta. Para cada paso dice qué cuenta usar, qué datos cargar y qué tiene que verse.

- **Website:** lo capturó un navegador automatizado contra `test`, en `web/`, con una cuenta de asesorado sintética nueva.
- **APK:** lo captura Dirección en su teléfono, con esta misma guía y con DEMO-A01. Los nombres `apk-…` son los que corresponden a cada paso.

Duración: unos 25 minutos. La parte del teléfono, sola, son 10.

## Antes de empezar

| Qué | Dónde |
|---|---|
| Website | `https://be-web-1ngj.onrender.com` |
| API (despertarla un minuto antes) | `https://be-api-hndp.onrender.com/health/ready` → tiene que responder `200` con `"aplicacion":"0.6.0"` |
| **APK 0.6.0** | `https://github.com/Elian-Bufi/be/releases/download/be-apk-0.6.0/be-0.6.0-c50fdd9.apk` · SHA-256 `6df67cac5a23181a7d078bdeb9805127e166af184909a8542b132d3568427b9c`. Se instala encima de cualquier versión anterior |

> **Tiene que ser la 0.6.0.** Las versiones anteriores no tienen la pantalla de Entrenamiento: en Cuenta no aparece el botón «Entrenamiento: Entrenamiento de hoy».

**Cuentas.** Las contraseñas están en `.env.cuentas-demo`, en el clon local de Dirección; no están en el repositorio.

| Alias | Qué es | Dónde se usa |
|---|---|---|
| **DEMO-PT** | Profesional de Entrenamiento («Prof. Demo Entrenamiento»), con la Especialidad verificada | Website |
| **DEMO-A01** | Asesorado | APK, en el teléfono |

Todos los datos que se cargan son sintéticos. El catálogo de ejercicios está rotulado **de demostración** y lo dice en pantalla: «no es una recomendación».

**El plan del teléfono ya está preparado.** Para que la parte de la APK no dependa de repetir la del website, DEMO-PT ya tiene con DEMO-A01 un vínculo de Entrenamiento con B2 y A3, una evaluación, un objetivo y **un plan activado** con dos sesiones:

- **Sesión A** — Press de banca 3 × 8, criterio RIR 2, carga sugerida 60 kg, descanso 90 s · Sentadilla 2 × 6-8 al 75 % RM, con la referencia de la repetición máxima declarada.
- **Sesión B** — Dominadas 2 × 5, sin criterio de intensidad.

## Parte 1 — Resumen: evaluar y fijar el objetivo (website)

| # | Qué hacer y qué datos cargar | Qué tiene que verse | Captura |
|---|---|---|---|
| 1.1 | DEMO-PT: «Ir al espacio profesional» → el asesorado | El workspace con el enlace **«Abrir Entrenamiento»** | `web-01` |
| 1.2 | «Abrir Entrenamiento» | Cuatro secciones: **Resumen · Plan · Ejecuciones · Revisiones**. Nunca «Bloques» o «Series» como módulos sueltos. El estado del seguimiento dice «Empieza al activar el primer plan» | `web-02` |
| 1.3 | «Nueva evaluación». Dato 1: «Experiencia en entrenamiento de fuerza» = «Un año, tres veces por semana», fuente **Informado por el asesorado**. Dato 2: «Movilidad de hombro» = «Sin limitaciones en la prueba de la consulta», fuente **Observado por el profesional** | Cada dato pide su **fuente**: lo informado por el asesorado no es un diagnóstico | `web-03` |
| 1.4 | «Registrar evaluación» | «Evaluación registrada.» y la evaluación con la fuente de cada dato a la vista | `web-04` |
| 1.5 | «Nueva versión de objetivo»: el objetivo y su fundamento | La evaluación de referencia se elige. **No existe «Editar objetivo»**: la versión anterior queda en el historial | `web-05` |
| 1.6 | «Emitir nueva versión» | «Nueva versión del objetivo emitida. La anterior se conserva en el historial.» | `web-06` |

## Parte 2 — Plan: borrador, validación y activación (website)

| # | Qué hacer y qué datos cargar | Qué tiene que verse | Captura |
|---|---|---|---|
| 2.1 | Sección **Plan** | «Crear plan» y «Todavía no hay un plan activo.» | `web-07` |
| 2.2 | «Crear plan» | «Borrador creado. No es visible para el asesorado hasta que lo actives.» La insignia **Borrador** | `web-08` |
| 2.3 | «Validar plan» sin cargar nada | «Bloque 1 → falta al menos una sesión». Validar **ubica** el problema y no juzga: «Validar revisa la forma del plan, no su calidad» | `web-09` |
| 2.4 | «Agregar sesión» → «Agregar ejercicio» → buscar «press» | El catálogo con la advertencia «Catálogo de demostración: no es una recomendación.» | `web-10` |
| 2.5 | Press de banca: 3 series de 8, criterio **RIR**, objetivo 2, carga sugerida **62.5** kg, parámetro «Descanso 90 s». Sentadilla: **6-8**, criterio **% RM**, objetivo 75, referencia de la RM. Sesión B: «Crear manualmente» → «Remo con banda elástica», 12 repeticiones, sin criterio | Se elige **% RM o RIR, nunca los dos**. La carga sugerida va aparte y lo dice: «no es el criterio de intensidad». Un rango y una carga con decimales se escriben sin que el campo los borre | `web-11` |
| 2.6 | Escribir «ocho» en las repeticiones de la sesión B → «Guardar borrador» | «Hay elementos del plan que no se pueden guardar.» → «Bloque 1 → Sesión B → Ejercicio 1 → falta un número o no se entiende lo escrito». **Lo que no se entiende no se guarda como otra cosa** | `web-12` |
| 2.7 | Volver a 12 → «Guardar borrador» → «Validar plan» | «El borrador no tiene problemas de estructura.» Validar **no activa** | `web-13` |
| 2.8 | «Activar plan» | Un paso aparte, con su consecuencia: «Esta versión pasará a ser la planificación vigente del asesorado y la anterior se conservará.» | `web-14` |
| 2.9 | «Activar esta versión» | «Plan activado.» La versión activa en **solo lectura**, con la **huella de la instantánea**: lo que ve el asesorado. Para cambiarla: «Crear nueva versión a partir de esta» | `web-15` |

## Parte 3 — El asesorado entrena y registra (APK)

| # | Qué hacer | Qué tiene que verse | Captura |
|---|---|---|---|
| 3.1 | DEMO-A01 · APK: abrir la app | Bienvenida con `app 0.6.0 · test · commit …` | `apk-01-bienvenida-0.6.0` |
| 3.2 | Iniciar sesión → Cuenta | Entre los botones está **«Entrenamiento: Entrenamiento de hoy»** | `apk-02-cuenta` |
| 3.3 | «Entrenamiento: Entrenamiento de hoy» | Las dos sesiones, cada una **«No iniciada»**, con lo planificado: «3 × 8 · RIR 2 · Carga sugerida 60 kg…». **Nunca «No realizada»**: nadie registró nada todavía | `apk-03-hoy-no-iniciadas` |
| 3.4 | Sesión A → «Comenzar sesión» → «Por serie». En Press de banca: carga 60, reps 8, RIR 2 → «+ Registrar serie». Repetir: 60 × 8 RIR 2, y 60 × 7 RIR 1 | Cada serie queda «Registrada en borrador», **en la misma pantalla**: no se abre una pantalla por serie | `apk-04-series-en-borrador` |
| 3.5 | En Sentadilla: «Sustituir ejercicio» → buscar «mancuernas» → «Confirmar sustitución: Press con mancuernas». Registrar 20 × 10, dos veces | «Planificado: Sentadilla» · «Ejecutado: Press con mancuernas» · insignia **Sustituido**. Se conservan las dos cosas | `apk-05-sustitucion` |
| 3.6 | Condición: «Realizada con desvío», motivo «Me molestaba la rodilla.» → «Revisar sesión» | El resumen y el aviso: «Al confirmar, la sesión queda registrada. Si después detectás un error, se corrige sin borrar el registro original.» | `apk-06-revisar-sesion` |
| 3.7 | «Confirmar sesión» | «Sesión registrada» y el **Registro original** | `apk-07-sesion-registrada` |
| 3.8 | Volver → Sesión B → «Comenzar sesión» → «No pude realizarla» (sin motivo) → «Revisar sesión» → «Confirmar sesión» | Se registra sin pedir explicación: «No pude realizarla» **es un acto**, no una ausencia | — |
| 3.9 | Volver a «Entrenamiento de hoy» | «Registrada · Realizada con desvío» y «Registrada · No realizada». **«No realizada» aparece solo porque el asesorado lo declaró** | `apk-08-hoy-registradas` |
| 3.10 | Sesión A → «Ver registro» → «Corregir registro»: la tercera serie de press pasa a 62,5 kg, motivo «La tercera serie fue con 62,5 kg.» | **Corrección vigente** («Corregido por vos», con el motivo) y, abajo, el **Registro original** intacto con 60 kg | `apk-09-correccion` |
| 3.11 | «Registrar otro día» → la fecha de ayer → «Ver sesiones de ese día» | Si el plan se activó hoy: «Ese día tu plan no estaba vigente.» Si ya regía: las sesiones de ese día **«Sin registro»**, que se pueden registrar ahora con la hora en que se hicieron | `apk-10-otro-dia` |

## Parte 4 — El profesional ve lo registrado, revisa y ajusta (website)

| # | Qué hacer | Qué tiene que verse | Captura |
|---|---|---|---|
| 4.1 | DEMO-PT → el asesorado → Entrenamiento → **Ejecuciones** → «Ver detalle» | **Planificado** al lado de lo registrado; la sentadilla «Planificado: Sentadilla · Ejecutado: Press con mancuernas» **Sustituido**; la **Corrección vigente** con su autor y, abajo, el **Registro original**; la sesión B «No realizada»; y **Días sin registro**: «Sin registro no quiere decir que no haya entrenado: no hay dato.» No hay porcentaje de cumplimiento en ningún lado | `web-16` |
| 4.2 | **Revisiones** | «Ver el contexto no registra una revisión.» | `web-17` |
| 4.3 | «Registrar revisión»: marcar la sesión A como evidencia, interpretación, resultado **Ajustar**, fundamento y próxima acción | Los seis resultados con su **efecto visible**. «Una progresión que conserva la estructura se registra como «Ajustar»»: **no hay un séptimo resultado «Progresar»** | `web-18` |
| 4.4 | «Registrar revisión» | «Revisión registrada. Todavía no se aplicó: aplicala desde la lista.» Registrar y aplicar son dos actos | `web-19` |
| 4.5 | «Aplicar próxima acción» | «Próxima acción aplicada: se preparó una nueva versión del plan en borrador. **La versión activa no cambió.**» | `web-20` |
| 4.6 | «Abrir el borrador en Plan» | El borrador sucesor, con la misma estructura, y la versión 1 todavía activa abajo | `web-21` |
| 4.7 | **Resumen** | El estado del seguimiento: plan activo, última sesión registrada y última revisión «Ajustar» con su próxima acción | `web-22` |

## Qué mirar si hay que resumir en una frase

Que **BE conserva lo planificado y lo ejecutado por separado, y nunca convierte la falta de registro en un juicio**: una sesión sin registro dice «Sin registro», «No realizada» aparece solo si la persona lo declaró, una sustitución muestra las dos cosas, corregir no borra el original, y la progresión es una decisión del profesional —«Ajustar»—, no un cálculo del sistema.
