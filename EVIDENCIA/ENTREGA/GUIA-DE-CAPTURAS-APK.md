# Guía de capturas y pruebas en el teléfono — APK 0.9.0

Lo que falta para cerrar la evidencia de la entrega son las capturas que solo se pueden tomar en un Android real. Esta guía dice, paso por paso, qué instalar, con qué cuenta entrar, qué tocar, qué capturar y — esto es lo importante — **qué mirar en cada pantalla**, porque varias capturas no valen por la pantalla sino por lo que demuestran.

> **Las contraseñas no están acá.** Están en `.env.cuentas-demo`, en tu clon local, que git ignora. Al lado de esta guía tenés `credenciales-para-capturas.txt` (fuera del repositorio) con los correos y las claves ya resueltos, listos para copiar.

---

## 0. Antes de empezar

### 0.1 Despertá la API

El plan gratuito de Render apaga la API a los 15 minutos sin tráfico, y la primera respuesta tarda unos 25 segundos. Abrí esto en el navegador del teléfono y esperá a que responda:

```
https://be-api-hndp.onrender.com/health/ready
```

Tiene que decir `"estado":"OK"` y `"aplicacion":"0.9.0"`. Si tarda, recargá una vez y esperá.

### 0.2 Instalá la APK

```
https://github.com/Elian-Bufi/be/releases/download/be-apk-0.9.0/be-0.9.0-fd08380.apk
```

- Se instala **encima** de cualquier versión anterior; no hace falta desinstalar.
- Android va a avisar que es de origen desconocido: hay que permitirlo para esta instalación.
- Es la primera versión con el tema oscuro y el ícono nuevo. Si la pantalla se ve clara, la instalación no se aplicó.

### 0.3 Configurá el teléfono para que las capturas sirvan

| Qué | Por qué |
|---|---|
| **Modo oscuro del sistema: no importa** | La app fuerza su propio tema oscuro. Si ves fondo blanco, es que quedó la versión vieja. |
| **Brillo alto** | Las capturas con brillo bajo pierden contraste y no sirven para mostrar accesibilidad. |
| **Barra de estado limpia** | Sacá notificaciones personales antes de capturar. Nada de nombres reales ni de WhatsApp en la barra. |
| **Sin datos personales en pantalla** | Todas las cuentas son sintéticas. Si aparece algo tuyo real, esa captura no va al repositorio. |

### 0.4 Cómo nombrar y dónde dejar las capturas

Nombrá cada archivo con el número del paso, así: `apk-01-bienvenida.jpg`, `apk-02-cuenta.jpg`, etc. Los números están en cada paso de esta guía.

Cuando termines, dejá todo en una carpeta y avisame: yo les quito los metadatos EXIF antes de versionarlas (los teléfonos guardan ubicación GPS y modelo en cada foto, y eso no puede entrar al repositorio).

---

## 1. Identidad visual 0.9.0 — el tema oscuro (4 capturas)

**Qué demuestra:** el tramo de identidad visual llegó a la APK. Hasta la 0.7.0 la app era de tema claro genérico; la 0.9.0 lleva el tema oscuro de las referencias que pasaste, el isotipo y el ícono nuevo.

### Paso 1.1 — El ícono en el cajón de aplicaciones
**Cuenta:** ninguna todavía.
**Qué hacer:** abrí el cajón de aplicaciones de Android y buscá «BE».
**Capturá:** `apk-01-icono.jpg` — el ícono de BE entre las demás apps.
**Mirá que:** el ícono sea el isotipo sobre fondo navy, no el ícono genérico de Expo.

### Paso 1.2 — La bienvenida
**Qué hacer:** abrí la app. No inicies sesión todavía.
**Capturá:** `apk-02-bienvenida.jpg` — pantalla completa.
**Mirá que:**
- el fondo sea **oscuro** (navy, no blanco);
- aparezca el **isotipo** de BE;
- diga el lema **«BE · Better Everyday»**;
- al pie diga la identidad del build: **`app 0.9.0 · test · commit fd08380`**. Este dato es el que prueba que la captura es de esta versión y no de otra.

> Si el pie dice otra versión u otro commit, la instalación no se actualizó. Volvé al paso 0.2.

### Paso 1.3 — Iniciar sesión
**Qué hacer:** tocá «Iniciar sesión». **No escribas nada todavía.**
**Capturá:** `apk-03-login-vacio.jpg`.
**Mirá que:** los campos y el botón se lean bien sobre el fondo oscuro; el contraste del texto de ayuda sea legible.

### Paso 1.4 — Entrá con el asesorado
**Cuenta:** **DEMO-A01** (correo y clave en `credenciales-para-capturas.txt`).
**Qué hacer:** escribí el correo y la clave, y entrá.
**Capturá:** `apk-04-cuenta.jpg` — la pantalla «Cuenta» completa.
**Mirá que:** se vean los cinco accesos, en este orden exacto:
- Nutrición: Hoy
- Entrenamiento: Entrenamiento de hoy
- Antropometría: Mi evolución
- Información: Información
- Vínculos

Y más abajo: «Tu identificador BE», «Privacidad y consentimientos», «Cerrar sesión» y «Cerrar mi cuenta».

---

## 2. Información profesional pertinente — WP-07 (6 capturas)

**Qué demuestra:** RF-071, el único requisito P0 que no tenía ninguna captura de APK. Es el paquete que más peso tiene acá porque **la pantalla del asesorado es donde se ve que pedir no es obtener**.

**Ya te dejé preparadas dos solicitudes reales en `test`**, para que la pantalla no esté vacía:

| Quién la pidió | Plantilla | Qué hacer con ella |
|---|---|---|
| **Prof. Demo Entrenamiento** | Hábitos y contexto (3 campos) | **Respondela** y después **corregila** |
| **Lic. Demo Nutrición** | Antecedentes de salud declarados (3 campos) | **Dejala sin responder, a propósito** |

### Paso 2.1 — La lista de solicitudes
**Qué hacer:** en Cuenta, tocá **«Información: Información»**.
**Capturá:** `apk-05-informacion-lista.jpg`.
**Mirá que:**
- aparezcan las **dos** solicitudes, las dos con la etiqueta **«Sin responder»**;
- cada una diga **«Pedido por»** y el nombre del profesional;
- arriba diga **«Podés no responder. No pasa nada si dejás esta solicitud sin completar.»**

> Esto es lo que hay que poder mostrarle al tribunal: no hay barra de progreso, no hay porcentaje de completitud, no dice «pendiente» como si fuera una deuda. Dice que podés no responder.

### Paso 2.2 — Abrir la solicitud de Entrenamiento
**Qué hacer:** tocá la solicitud de **Prof. Demo Entrenamiento** («Hábitos y contexto»), y después **«Completar»**.
**Capturá:** `apk-06-informacion-responder.jpg`.
**Mirá que:**
- arriba diga el **propósito** que escribió el profesional («Conocer tu rutina y tus hábitos para ajustar la planificación del entrenamiento»);
- diga **«Lo que respondas queda registrado como declarado por vos.»**;
- los campos sean: **Horas de sueño habituales** (número, unidad h), **Nivel de actividad física habitual** (texto) y **Fuma actualmente** (sí/no);
- los campos opcionales digan **«Podés dejarlo en blanco.»**

### Paso 2.3 — PRUEBA: el campo sí/no (esto es una prueba, no solo una captura)

Antes de responder bien, quiero que **pruebes un caso que sospecho que está roto** y que solo se puede verificar en el teléfono.

**Qué hacer:** en el campo **«Fuma actualmente»**, escribí exactamente **`No fumo`** (así, con espacio y en ese orden). Dejá los otros campos como estén. Tocá **«Enviar respuesta»**.

**Qué mirar y capturar:** `apk-07-prueba-booleano.jpg`, la pantalla justo después de enviar.

Hay dos resultados posibles y los dos me sirven:

| Si pasa esto | Qué significa | Qué hacer |
|---|---|---|
| Te marca un **error en el campo** pidiendo sí o no | Está bien: no acepta lo que no entiende | Capturá el error y seguí |
| **Lo acepta** y después la respuesta figura como **«No»** | **Es el bug que sospecho:** interpretó un texto libre como un «no» sin avisarte | Capturá las dos pantallas (el envío y cómo quedó guardado) y avisame |

> Este es el hallazgo FRM-2/NUM-6 de la auditoría, que quedó sin verificar. Si se confirma, lo arreglo antes de la entrega. Es un dato que se guarda mal sin avisar, así que importa.

### Paso 2.4 — Responder de verdad
**Qué hacer:** completá los campos así:
- **Horas de sueño habituales:** `7`
- **Nivel de actividad física habitual:** `Camino todos los días y entreno tres veces por semana`
- **Fuma actualmente:** `No` (o destildado, según cómo lo muestre)

Tocá **«Enviar respuesta»**.
**Capturá:** `apk-08-informacion-respondida.jpg` — la confirmación **«Respuesta enviada.»** y la solicitud ya como **«Respondida»**.

### Paso 2.5 — Corregir la respuesta
**Qué hacer:** entrá otra vez a esa solicitud y tocá **«Corregir mi respuesta»**. Cambiá las horas de sueño de `7` a `6`. En **«Por qué lo corregís»** escribí: `Me equivoqué al cargar, duermo seis horas.` Enviá.
**Capturá:** `apk-09-informacion-corregida.jpg`.
**Mirá que:**
- diga **«Corrección enviada.»**;
- se siga viendo la **«Respuesta original»** con el `7`;
- diga **«La respuesta anterior se conserva: la corrección se agrega, no la reemplaza.»**

> Esta es la captura más valiosa de la sección: demuestra que corregir **agrega** y no borra. Es el mismo principio que en antropometría y en las ejecuciones de entrenamiento.

### Paso 2.6 — La que queda sin responder
**Qué hacer:** volvé a la lista de «Información». **No toques** la solicitud de Nutrición.
**Capturá:** `apk-10-informacion-sin-responder.jpg`.
**Mirá que:** conviven una **«Respondida»** y una **«Sin responder»**, y que la que quedó sin responder no aparece marcada como error, ni en rojo, ni con un aviso de que falta algo.

---

## 3. Entrenamiento — WP-06 (5 capturas)

**Qué demuestra:** el circuito de entrenamiento tampoco tiene ninguna captura de APK. El asesorado tiene hoy un plan activo con **dos sesiones**.

### Paso 3.1 — Entrenamiento de hoy
**Qué hacer:** Cuenta → **«Entrenamiento: Entrenamiento de hoy»**.
**Capturá:** `apk-11-entrenamiento-hoy.jpg`.
**Mirá que:** aparezcan las sesiones del día con su nombre, y que se distinga claramente **una sesión pendiente** de una ya registrada.

### Paso 3.2 — Abrir una sesión
**Qué hacer:** tocá la primera sesión para abrir su registro.
**Capturá:** `apk-12-entrenamiento-sesion.jpg`.
**Mirá que:**
- se vean los ejercicios prescriptos con sus series y la carga sugerida;
- se pueda elegir registrar **por serie** o **por ejercicio**;
- exista la opción **«No pude realizarla»**.

### Paso 3.3 — PRUEBA: la unidad de la carga

**Qué hacer:** en el primer ejercicio, cargá una serie y **fijate si podés elegir la unidad** (kg / lb) al lado del valor.
**Capturá:** `apk-13-entrenamiento-unidad.jpg` — el campo de carga con su selector de unidad visible.
**Mirá que:** la unidad **viaje con el valor** y no esté fija en kg. En WP-06 se encontró y corrigió que 135 lb se guardaban como 135 kg; esta captura es la que muestra que quedó arreglado.

### Paso 3.4 — Registrar la sesión
**Qué hacer:** completá al menos una serie del primer ejercicio y confirmá el registro.
**Capturá:** `apk-14-entrenamiento-registrado.jpg` — la sesión ya registrada.
**Mirá que:** la lista de hoy ahora muestre esa sesión como registrada, y la otra siga pendiente.

### Paso 3.5 — PRUEBA: «No pude realizarla»
**Qué hacer:** abrí la **segunda** sesión y elegí **«No pude realizarla»**. Confirmá.
**Capturá:** `apk-15-entrenamiento-no-realizada.jpg`.
**Mirá que:** quede registrada como un **acto**, con su propia etiqueta, y **no** como un cero, un incumplimiento ni un porcentaje. No responder y no poder son cosas distintas de fallar.

---

## 4. Nutrición y antropometría — refresco en 0.9.0 (4 capturas)

**Qué demuestra:** estos circuitos ya tienen capturas de versiones anteriores (0.4.0 y 0.5.1), pero con el **tema claro viejo**. Estas capturas los muestran en la identidad visual nueva.

### Paso 4.1 — Nutrición: Hoy
**Qué hacer:** Cuenta → **«Nutrición: Hoy»**.
**Capturá:** `apk-16-nutricion-hoy.jpg`.
**Mirá que:** se vean las comidas del día (hay **2**) con lo prescripto, en el tema oscuro.

### Paso 4.2 — PRUEBA: registrar una comida con decimales

**Qué hacer:** registrá una comida del plan. Si te deja editar cantidades, escribí un valor con **coma decimal**, por ejemplo `120,5`.
**Capturá:** `apk-17-nutricion-registrar.jpg`.
**Mirá que:** acepte la **coma** como separador decimal y no la rechace ni la convierta en otra cosa. En la consolidación se encontró que `1.850` se leía como `1,85`; los números con coma son el patrón que quedó arreglado.

### Paso 4.3 — Mi evolución
**Qué hacer:** Cuenta → **«Antropometría: Mi evolución»**.
**Capturá:** `apk-18-mi-evolucion.jpg`.
**Mirá que:**
- aparezcan las series de **peso** y **talla** (hay 5 evaluaciones registradas);
- los días sin medición digan **«Sin dato»** y **no** cero;
- **no** haya ningún puntaje, semáforo, color de riesgo ni flecha de «mejoró/empeoró». La evolución muestra, no califica.

### Paso 4.4 — Vínculos
**Qué hacer:** Cuenta → **«Vínculos»**.
**Capturá:** `apk-19-vinculos.jpg`.
**Mirá que:** se vean los **tres** vínculos (Nutrición, Entrenamiento, Antropometría), cada uno con su estado y su profesional.

---

## 5. Accesibilidad — RNF-ACC-001 (3 capturas + 1 prueba)

**Qué demuestra:** la parte de accesibilidad que **ninguna herramienta automática puede medir**. La auditoría axe-core cubrió el website; el 11A pide además una revisión manual, y esto es lo único que la cierra.

### Paso 5.1 — Letra del sistema al máximo
**Qué hacer:** Ajustes de Android → Pantalla → Tamaño de fuente → **el máximo**. Volvé a la app, a la pantalla «Cuenta».
**Capturá:** `apk-20-letra-maxima.jpg`.
**Mirá que:**
- **no se corte** ningún texto de botón;
- no haya texto encimado;
- se pueda seguir llegando a todos los accesos haciendo scroll.

> Si algo se rompe acá, quiero saberlo: es un arreglo de CSS y hay tiempo.

### Paso 5.2 — Letra máxima en una pantalla con formulario
**Qué hacer:** con la letra todavía al máximo, entrá a **Información** y abrí la solicitud de Nutrición (la que quedó sin responder).
**Capturá:** `apk-21-letra-maxima-formulario.jpg`.
**Mirá que:** las etiquetas de los campos y los textos de ayuda se sigan leyendo completos.

*(Podés volver la letra a normal después de esta captura.)*

### Paso 5.3 — PRUEBA con TalkBack

TalkBack es el lector de pantalla de Android. Es la prueba que el 11A pide y que no tenemos.

**Cómo activarlo:** Ajustes → Accesibilidad → TalkBack → activar. (Con TalkBack activo se navega distinto: un toque **selecciona y lee**, dos toques **activan**. Para salir, volvé a Ajustes y desactivalo.)

**Qué hacer:** con TalkBack activo, recorré la pantalla **Cuenta** deslizando hacia la derecha para ir elemento por elemento, y después entrá a **Información**.

**Capturá:** `apk-22-talkback.jpg` — cualquier pantalla con el recuadro verde de TalkBack sobre un elemento enfocado.

**Anotá y decime** (esto vale más que la captura):

1. ¿Los **botones** se anuncian con su nombre completo? Por ejemplo, ¿dice «Nutrición: Hoy, botón» o dice solo «botón»?
2. En el formulario, ¿los campos se anuncian con **su etiqueta**? ¿Dice «Horas de sueño habituales, campo de edición» o dice «campo de edición» a secas?
3. El campo **sí/no**, ¿se anuncia como casilla con su estado, o como algo sin nombre?
4. ¿Hay algún elemento que se anuncie solo como **«on»**, «botón» o «imagen» sin decir qué es?

> El punto 4 es el que más me importa: en WP-07 se encontró exactamente ese problema en el website (los checkboxes se anunciaban como «on») y se corrigió ahí. Si pasa lo mismo en la APK, lo arreglo.

---

## 6. Cierre — lo que mandás

Cuando termines, juntá las 22 capturas y pasame además:

1. **El resultado de las tres pruebas marcadas:**
   - Paso 2.3 — el campo sí/no con `No fumo`: ¿lo rechazó o lo guardó como «No»?
   - Paso 3.3 — la carga de entrenamiento: ¿pudiste elegir kg/lb?
   - Paso 4.2 — la cantidad con coma: ¿la aceptó?
2. **Las cuatro respuestas de TalkBack** del paso 5.3.
3. **Cualquier cosa que te haya parecido rara**, aunque no esté en la lista. Vos vas a ver la app con ojos de usuario, no de quien la escribió; eso encuentra cosas que las pruebas no.

Yo me encargo de: quitarles el EXIF, ordenarlas en `EVIDENCIA/WP-06/apk/`, `EVIDENCIA/WP-07/apk/` y `EVIDENCIA/IDENTIDAD/apk/`, escribir el `LEEME.md` de cada carpeta explicando qué demuestra cada una, y actualizar las notas de MESA que dicen «las capturas las toma Dirección».

---

## Resumen: las 22 capturas

| # | Archivo | Pantalla | Qué demuestra |
|---|---|---|---|
| 1 | `apk-01-icono.jpg` | Cajón de apps | Ícono nuevo |
| 2 | `apk-02-bienvenida.jpg` | Bienvenida | Tema oscuro, isotipo, identidad del build |
| 3 | `apk-03-login-vacio.jpg` | Iniciar sesión | Contraste del tema oscuro |
| 4 | `apk-04-cuenta.jpg` | Cuenta | Los cinco accesos |
| 5 | `apk-05-informacion-lista.jpg` | Información | Dos solicitudes, «podés no responder» |
| 6 | `apk-06-informacion-responder.jpg` | Responder | Propósito, procedencia declarada |
| 7 | `apk-07-prueba-booleano.jpg` | Responder | **Prueba:** el campo sí/no |
| 8 | `apk-08-informacion-respondida.jpg` | Información | «Respuesta enviada» |
| 9 | `apk-09-informacion-corregida.jpg` | Corrección | La original se conserva |
| 10 | `apk-10-informacion-sin-responder.jpg` | Información | Sin responder no es incumplir |
| 11 | `apk-11-entrenamiento-hoy.jpg` | Entrenamiento | Sesiones del día |
| 12 | `apk-12-entrenamiento-sesion.jpg` | Sesión | Prescripción, granularidad |
| 13 | `apk-13-entrenamiento-unidad.jpg` | Sesión | **Prueba:** kg/lb |
| 14 | `apk-14-entrenamiento-registrado.jpg` | Entrenamiento | Sesión registrada |
| 15 | `apk-15-entrenamiento-no-realizada.jpg` | Sesión | «No pude realizarla» es un acto |
| 16 | `apk-16-nutricion-hoy.jpg` | Nutrición | Plan del día en tema oscuro |
| 17 | `apk-17-nutricion-registrar.jpg` | Registrar | **Prueba:** coma decimal |
| 18 | `apk-18-mi-evolucion.jpg` | Mi evolución | «Sin dato», sin puntaje |
| 19 | `apk-19-vinculos.jpg` | Vínculos | Los tres alcances |
| 20 | `apk-20-letra-maxima.jpg` | Cuenta | Letra del sistema al máximo |
| 21 | `apk-21-letra-maxima-formulario.jpg` | Responder | Formulario con letra máxima |
| 22 | `apk-22-talkback.jpg` | Cualquiera | TalkBack activo |

---

## Lo que NO hay que hacer

- **No revoques ningún consentimiento** desde la APK. El recorrido de revocación ya tiene su evidencia (WP-03), y si lo revocás ahora, el profesional pierde el acceso y hay que rearmar el escenario antes de la demo.
- **No cierres la cuenta** de DEMO-A01. Esa pantalla ya está capturada en WP-02 y el cierre es irreversible.
- **No uses cuentas ni datos reales.** Todo lo de esta guía es sintético y tiene que seguir siéndolo.
