# El día de la demo (viernes 6/11): la lista y el plan B

**Dónde estamos.** La demo dura unos 2:30 (`DEMO.md`): Sofía Paz con Diego en el website y Prueba Uno en la APK
`0.19.0-candidata.1`, contra test (`b62ce90`). Esta hoja es para que nada dependa de la suerte: lo que se deja listo el
jueves, lo que se mira una hora antes y qué decir si algo falla.

## El jueves a la noche

- [ ] **Bajar el mazo como PDF y como PowerPoint** desde su menú; dejarlos en el escritorio y en un pendrive. Si claude.ai
      no abre, se presenta desde el PDF.
- [ ] **Las capturas del plan B** (`respaldo-demo/2026-11-05/web/` y `apk/`), copiadas al escritorio y al pendrive, y
      abiertas una vez en el visor de fotos, en el orden de `DEMO.md`.
- [ ] **Una grabación del recorrido entero**, como respaldo: en el teléfono, la grabación de pantalla del panel rápido;
      en la notebook, la Barra de juegos de Windows (Win + Alt + R) o la Herramienta Recortes. Mirarla antes de guardarla:
      ni notificaciones, ni correos, ni contraseñas a la vista.
- [ ] **Un ensayo con reloj**, una vez en vivo y otra con el plan B, con el mismo teléfono, el mismo cable y la misma red.
- [ ] Teléfono y notebook al 100 %; en el bolso, el cargador y el cable USB.

## El viernes, una hora antes

- [ ] **La API:** abrir https://be-api-hndp.onrender.com/health/ready. Tiene que decir `"estado":"OK"`, base y migraciones
      en `OK`, y el commit de `DEMO.md` (hoy, `b62ce90`). Si no responde, se arranca con el plan B y se vuelve a mirar.
- [ ] **Entrar con tiempo**, no en el momento: Sofía en una ventana normal y, si se usa, Lic. Prueba Dos Áreas en una
      privada. La sesión del website sobrevive a la recarga (DL-147); la privada se pierde al cerrarla. La API admite **5
      intentos de entrada por cuenta desde la misma red cada 15 minutos** (y 20 desde cualquier red): no probar
      contraseñas a ciegas. Si aparece «Demasiados intentos», no reintentar: esperar los 15 minutos.
- [ ] **La APK:** Prueba Uno ya adentro; en Cuenta, la versión `0.19.0-candidata.1`; en Entrenamiento, la sesión de hoy
      **sin iniciar** y **una pendiente** de otro día. Nada registrado el jueves con Prueba Uno.
- [ ] **La red:** abrir `/health/ready` desde la notebook y desde el teléfono con el wifi del lugar. Si falla o pide un
      portal de acceso, el teléfono pasa a datos móviles y le comparte internet a la notebook (zona wifi). La APK y el
      website hablan con Render por internet: no necesitan estar en la misma red, salvo para espejar sin cable.
- [ ] **No molestar** en el teléfono y en la notebook (en Windows, «No molestar» en el centro de notificaciones); cerrar
      WhatsApp, el correo y ChatGPT; el teléfono en silencio y sin notificaciones en la barra.
- [ ] **El teléfono:** brillo alto, bloqueo de pantalla en 10 minutos o más y el ahorro de batería apagado (corta la red
      en segundo plano).
- [ ] **La notebook:** reiniciada a la mañana y con lo justo abierto (tiene 5,9 GB de memoria).
- [ ] **Las pestañas**, en un solo navegador y en este orden: 1, el mazo en modo presentación; 2, el espacio profesional
      de Sofía (`/pro`); 3, `/health/ready`. Aparte: la ventana privada de Lic. Prueba Dos Áreas en Entrenamiento de
      Prueba Uno, y minimizados el PDF del mazo y el visor con las capturas.

## Cómo se ve el teléfono

- **Con cable, scrcpy** (libre y gratuito): espeja el teléfono en la notebook por USB, usando adb. En esta PC ya está adb
  (`C:\Users\bufim\AppData\Local\Android\Sdk\platform-tools\adb.exe`, versión 1.0.41, fuera del PATH); scrcpy no está
  instalado. Pide activar la depuración por USB en las opciones de desarrollador y aceptar la huella de la PC. Si se usa,
  se prueba el jueves con el mismo cable.
- **Sin cable:** transmitir la pantalla del teléfono (en Samsung, «Smart View») a un televisor o proyector del lugar, o a
  Windows con «Proyectar en esta PC», que pide la función opcional «Pantalla inalámbrica». Los dos en la misma red.
- **Si es por videollamada:** entrar también desde el teléfono y compartir su pantalla.
- **Si nada anda:** el teléfono en la mano, frente a la cámara o al público, y las capturas en pantalla.

## Si algo falla en vivo

| Qué pasa | Qué decir | Qué hacer |
|---|---|---|
| Render o la red no responden | «La API de test no responde desde acá; sigo con las capturas de ayer, tomadas contra la misma versión.» | El visor, en el orden de `DEMO.md`; si vuelve la red, un solo paso en vivo al final |
| «Demasiados intentos» | «Es la protección contra intentos repetidos: cinco por cuenta cada quince minutos.» | Seguir con las capturas de esa parte |
| La APK se traba o se cierra | «Es la candidata que se prueba esta semana.» | Abrirla una vez más: el borrador queda guardado; si no, capturas o grabación |
| El espejado se corta | — | El teléfono en la mano y las capturas |
| Algo inesperado en pantalla | «Lo anoto: es justo lo que una prueba con personas tiene que encontrar.» | Seguir; no improvisar arreglos |

**Nunca:** escribir sobre Diego, mostrar credenciales ni la página de la cuenta, ni decir «cumplió», «bien» o «mal»: se
dice «lo registrado» y «lo indicado».
