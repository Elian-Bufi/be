# Guía de demo de la entrega — BE (al 2026-10-16: API y website en `main`, APK 0.16.0-candidata.1)

> **Qué cambió desde la versión del 2/10:**
> - **La API ya no se duerme:** Render pasó a planes pagos el 16/10.
> - **El profesional trabaja en un escritorio:** pendientes, asesorados con nombre y una ficha con Resumen, Línea de tiempo y Analizar.
> - **Hay una cohorte de seis personas con historia,** de 6 meses a 3 años.
> - **La APK suma:** Novedades con campana, avisos al teléfono (cuando esté Firebase), recordatorios diarios, «Tu nombre» y «Tus revisiones».
> - **La métrica de la tesis se calcula:** la TVCC-30, con sus doce pruebas, reproducible y guardada (A.7).
>
> El recorrido nuevo, con la cohorte, va primero. El recorrido detallado con las cuentas DEMO (antropometría sobre la figura, pedir información y la revocación) sigue más abajo y sigue valiendo.
>
> **Antes de mostrarlo:** ensayarlo una vez completo con el teléfono de la demo.

## Antes de empezar

| Qué | Dónde |
|---|---|
| Website | `https://be-web-1ngj.onrender.com` |
| API | `https://be-api-hndp.onrender.com/health/ready` → `200`. Desde el 16/10 no se duerme: no hace falta despertarla |
| **APK 0.16.0-candidata.1** | `https://github.com/Elian-Bufi/be/releases/download/be-apk-0.16.0-candidata.1/be-0.16.0-candidata.1-10816ae.apk` · SHA-256 `867f4dd60c4d4f7c8dbef78d3d6d5f4e872a2cac18a9c72212c2f283142e85f2`. El registro de la construcción está en la rama `apk/candidata-0.16.0-1`, en `EVIDENCIA/CANDIDATA-0.16.0-1/LEEME.md`. Se instala encima de la anterior, sin desinstalar (misma firma). Los avisos al teléfono necesitan el proyecto de Firebase (`docs/DESPLIEGUE.md`, «Avisos push»): mientras tanto, Cuenta dice que no están disponibles y las novedades se ven igual en la campana |
| Cuentas de la cohorte | Fuera del repo, en `C:\Users\bufim\BE-datos-locales\cohorte-test\cuentas.env`. `PRO_N` es Lic. Sofía Paz (Nutrición y Antropometría), `PRO_T` es Prof. Martín Acosta (Entrenamiento) y `PRO_A` es Prof. Lucía Benítez (Antropometría). Las personas son `ASE_DIEGO`, `ASE_CAMILA`, `ASE_FEDERICO`, `ASE_NORMA`, `ASE_HECTOR` y `ASE_AGUSTINA` |
| Cuentas DEMO | En `.env.cuentas-demo`, en el clon local de Dirección. DEMO-A01 se llama «Martina Gómez» y DEMO-A02 «Lucas Fernández» |

**Quiénes son las seis personas** (`EVIDENCIA/DASHBOARD-PROFESIONAL/herramientas/datos/cohorte/LEEME.md`):
- **Diego (3 años):** de 104,5 a 80,8 kg, y la sentadilla de 20 a 135 kg.
- **Camila (un año y medio):** recomposición; los pliegues bajan con el peso igual.
- **Federico (2 años):** rugby, con temporadas.
- **Norma (71):** fuerza para no depender de nadie.
- **Héctor (65):** derivado por la glucemia.
- **Agustina (6 meses):** quiere ganar peso.

**Los pendientes corren con el calendario.** Se fijaron el 16/10: ese día la revisión de Norma estaba vencida hace 4 días y la de Diego vencía en 3. Otro día, los números son otros.

## Recorrido con la cohorte (unos 20 minutos)

| # | Quién y dónde | Qué mostrar |
|---|---|---|
| A.1 | La cara pública del website | Qué es BE y **lo que no hace**: no diagnostica, no puntúa personas, no arma planes solo y nadie ve datos sin autorización |
| A.2 | **Sofía Paz** en el website → espacio profesional | **Pendientes:** lo que hay que hacer hoy, como hechos con fecha («revisión vencida hace 4 días»), sin semáforos ni juicios. **Tus asesorados:** las personas por su nombre y «desde el…» de cada vínculo, la fecha real |
| A.3 | La ficha de **Diego** | **Resumen** por área, la **Línea de tiempo** con sus hitos (planes, revisiones, tomas) y **Analizar**: el peso del último año (el período llega hasta 366 días), con las versiones del plan como bandas, y la comparación de etapas; en Entrenamiento, la sentadilla con las mismas bandas |
| A.4 | **Martín Acosta** → la ficha de **Federico** → Entrenamiento | La revisión que vencía, preparada con la evidencia del período («Lo que miraste»). Registrar una revisión nueva: «Lo que observaste», «Lo que decidís» y el porqué. La ayuda avisa que la persona la va a leer completa |
| A.5 | La APK con **Federico** | La **campana** con la novedad: «Prof. Martín Acosta registró una revisión de Entrenamiento». Tocarla abre la revisión completa, con lo que significa para su plan. Con Firebase, además, el teléfono avisa con «BE · Tenés una novedad.», sin nombres ni datos de salud |
| A.6 | La APK con **Diego** | Inicio, Nutrición (el plan de hoy), Entrenamiento (la sesión por serie), Evolución y Novedades. En **Cuenta**: «Tu nombre», que es el que ven sus profesionales, y «Avisos en este teléfono», con los recordatorios de las 15:00 y las 22:00 si ese día no registró nada |
| A.7 | La métrica de la tesis | **TVCC-30**, la North Star: de los ciclos de seguimiento que vencieron en los últimos 30 días, cuántos se cerraron con una revisión aplicada. Con la cohorte, el 16/10 da **5 de 7 (71,4 %)**, y los dos abiertos son los pendientes de A.2. Si en A.4 la revisión de Federico se registra y se aplica, el número sube; mirar pantallas no lo mueve. Es un comando interno (`docs/paquetes/WP-TVCC-30.md` §5), y cada corrida queda guardada con su huella (`EVIDENCIA/TVCC-30`) |
| A.8 | Para cerrar | **Cómo se sabe que es cierto:** la CI con las pruebas contra PostgreSQL real; `docs/DEUDA_LEGAJO.md` con cada decisión; `docs/QUE-FALTA.md` con lo que queda |

**Para la sección A.4:** registrar una revisión deja historia, porque no se borra. Si la demo se ensaya varias veces, conviene usar a Federico o a Norma, que ya tienen una revisión pendiente, y no a Diego, que es el ejemplo de los gráficos.

---

## Recorrido detallado con las cuentas DEMO (del 2/10; sigue valiendo)

> En este recorrido, «Asesorado · c36743» ahora se ve como **Martina Gómez**: es DEMO-A01, que desde el 16/10 tiene nombre. La APK de la tabla «Antes de empezar» de abajo es la del 2/10: usar la 0.16.0-candidata.1.

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

### Antes de empezar

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

### 1 · La cara pública (2 minutos)

| # | Qué hacer | Qué mostrar |
|---|---|---|
| 1.1 | Abrir el website | La landing: **qué es BE** con las palabras del legajo (02 §3.2), qué hace por el profesional y por el asesorado (02 §9) y **lo que BE no hace**: no diagnostica, no puntúa personas, no arma planes solo y nadie ve datos sin autorización (02 §14) |
| 1.2 | Bajar hasta el pie y señalar el aviso | «Ambiente de prueba: usá solo datos sintéticos. No ingreses datos reales de personas.» está en el pie de la cara pública y, con otras palabras, en el registro (08 §33). Desde WP-ESCRITORIO-AMABLE ya no va en la barra de cada pantalla; la APK conserva su franja |
| 1.3 | «Ya tengo una cuenta» | El acceso, en el mismo tema oscuro. Iniciar sesión con **DEMO-PN** |

### 2 · El espacio profesional (4 minutos)

| # | Qué hacer | Qué mostrar |
|---|---|---|
| 2.1 | «Ir al espacio profesional» | Una tarjeta **por asesorado**, con cada alcance y su estado. El vínculo es por alcance; el workspace es uno por persona |
| 2.2 | «Abrir» en la tarjeta «Asesorado · c36743» (DEMO-A01) | El header contextual (nombre, alcances, estado) y las **tarjetas de dominio**: plan vigente, objetivo con quién lo escribió, registros del período, revisiones. **Sin puntaje ni semáforo** (B10-08 §10) |
| 2.3 | «Abrir Nutrición» → Registros | Lo prescripto y lo registrado por día. Un día sin registro dice «Sin registro»: **nunca un cero** (B10-10 §1) |

### 3 · La toma sobre la figura, los cálculos y la lámina (7 minutos): el momento que más suma

Iniciar sesión con **DEMO-PA** → «Asesorado · c36743» → «Abrir Antropometría». Las pestañas son «Tomas», «En preparación», «Evolución» y «Lámina»: arrancar en **En preparación**.

| # | Qué hacer | Qué mostrar |
|---|---|---|
| 3.1 | Si el borrador abre con el «Protocolo de laboratorio (demostración)», elegir **«Pliegues y perímetros (demostración)»** | El protocolo declara qué se mide. Lo que ya estaba cargado pasa a su campo si el protocolo lo declara en esa unidad; lo demás queda «Fuera del protocolo». **Nada se pierde y ninguna unidad se convierte** (B10-07 §17) |
| 3.2 | Mirar la figura | La figura **ubica** cada sitio de toma: el pliegue es un punto y el perímetro un anillo, de frente y de espalda |
| 3.3 | Tocar un punto | Lleva a su campo en la lista, que es la tabla equivalente y el camino del teclado |
| 3.4 | Cargar un pliegue tricipital de **8,5** y uno subescapular de **31**. En la lista, cargar también el peso (**70 kg**) y la talla (**172 cm**), que no tienen sitio en la figura | Los dos puntos se llenan **igual**. La figura dice dónde se midió y que ya hay dato, **nunca si el valor es alto o bajo**. Es RF-048 llevado al color, y lo sostiene una prueba: el punto no recibe el valor. El peso y la talla son para el paso 3.6 |
| 3.5 | «Guardar» y después «Registrar evaluación» | «Guardado» aparece abajo, donde se está mirando. Registrar es un acto aparte: se confirma en un diálogo centrado, «Registrar esta evaluación». Después no se edita: se corrige agregando (RF-050) |
| 3.6 | En «Tomas», abrir la evaluación registrada → «Cálculos» → «Calcular con un método» | El selector separa **«Se pueden calcular con esta toma»** de **«Les faltan datos de esta toma»**. El catálogo de BE tiene **21 métodos**, cada uno con su fuente y su población; en `test` se suma uno sintético de demostración. Elegir **«Índice de masa corporal (IMC)»**: la ficha dice qué da, qué pide con el valor de esta toma y en qué población se validó, y deja plegadas la fuente y la regla. «Calcular»: el aviso de éxito aparece abajo y se va solo. Después elegir un método de Durnin y Womersley: al lado de cada dato que la toma no tiene dice «Falta en esta toma», y «Calcular» queda deshabilitado. BE no calcula con lo que no hay. Si la toma ya tuviera ese resultado calculado con otro método, un aviso lo diría antes de calcular: los dos conviven, BE no elige |
| 3.7 | «Ver lámina» en la misma evaluación → hoja «Pliegues» | La lámina del compositor arma la toma sobre la figura: **ubica cada medida y no califica ningún valor**. El bíceps y la cresta ilíaca tienen su lugar en la figura y aparecen cuando la toma los tiene. Al pie van las dos sumas de pliegues; acá, con dos pliegues, dicen «Sin calcular». «Descargar imagen» baja la lámina como PNG |

### 4 · Información pertinente: pedir no es acceder (3 minutos)

| # | Qué hacer | Qué mostrar |
|---|---|---|
| 4.1 | Con **DEMO-PT**, en el workspace de «Asesorado · c36743»: «Pedir información» | Antes de cualquier acción, el aviso: **pedir no amplía el acceso ni el consentimiento**. El pedido se arma campo por campo, con su propósito. Un campo requerido igual puede quedar sin responder: el asesorado decide (RF-071) |
| 4.2 | «Enviar solicitud» | La solicitud queda «Sin responder», con «No responder también es una opción». Ningún porcentaje de avance |
| 4.3 | En la APK, con **DEMO-A01**: zona **Información** de la barra inferior | La solicitud, con quién la pidió y para qué. Responder un campo y dejar otro en blanco; «Enviar respuesta» |
| 4.4 | Volver al website y actualizar | La respuesta llega rotulada **«Declarado por la persona»**: no es una medición ni un diagnóstico. El campo en blanco no aparece como un incumplimiento |

### 5 · El asesorado en la APK (5 minutos)

Con **DEMO-A01** en el teléfono.

| # | Qué hacer | Qué mostrar |
|---|---|---|
| 5.1 | Abrir la app e iniciar sesión | La bienvenida con el isotipo y la identidad del build al pie: `app 0.13.1 · test · commit 6213ec8`. Al entrar, la APK abre en Nutrición, con la barra de cinco zonas abajo. La zona elegida se marca con una barrita y en negrita, y la barra se esconde mientras el teclado está abierto |
| 5.2 | Zona **Nutrición**: «Tu plan de hoy» | Qué tiene que comer hoy; «Registrar comida» con una comida del plan |
| 5.3 | Zona **Entrenamiento**: «Entrenamiento de hoy» | La sesión del plan; registrar lo que hizo, con desvío o sin él. «Tu historial» muestra lo anterior |
| 5.4 | Zona **Evolución**: «Mi evolución» | La última toma sobre la figura (los perímetros son elipses), los resultados calculados de esa toma con su método (por ejemplo, el IMC del paso 3.6) y la serie de cada medida, con los días sin medición como «Sin dato». Las explicaciones están plegadas en «Cómo se lee», y «La figura, en lista» es la tabla equivalente |
| 5.5 | **Al final, porque deshace el acceso:** zona **Cuenta** → «Vínculos» → el de Nutrición → «Revocar acceso de …» → «Revocar acceso» | En el website, DEMO-PN **actualiza** el workspace: la tarjeta de Nutrición desaparece y queda un único aviso de vista parcial, sin decir por qué. El PDP decide en cada lectura. El profesional no vuelve a ver nada hasta que haya un consentimiento nuevo (el flujo está en `EVIDENCIA/WP-03/`) |

### 6 · Cómo se sabe que todo esto es cierto (3 minutos)

| Pregunta del tribunal | Dónde está la respuesta |
|---|---|
| ¿Cómo prueban lo que dicen? | La CI de `main`, con las pruebas de integración contra PostgreSQL real, por ID de prueba del 11A. La última corrida completa registrada dio **561/561 en 39 suites**, en la CI del PR #126 (`EVIDENCIA/ANTROPOMETRIA-DL111/LEEME.md`). La del 2026-09-24 está en `EVIDENCIA/ENTREGA/` |
| ¿Es accesible? | Una prueba automática de contraste en cada `npm test` y la auditoría axe-core de las pantallas núcleo: **cero violaciones** (`EVIDENCIA/IDENTIDAD/`). TalkBack y la letra del sistema al máximo todavía no se probaron en un Android físico (RNF-ACC-001) |
| ¿Qué quedó afuera y por qué? | `docs/DEUDA_LEGAJO.md`: cada deuda con lo que dice el legajo, las opciones y la decisión. El inventario de lo que falta, en `docs/QUE-FALTA.md` |
| ¿Y las APIs externas? | Open Food Facts y wger están integradas desde el 2026-09-25 (WP-08, PR #72): el profesional importa un alimento o un ejercicio, lo revisa y queda con su procedencia a la vista. No están en este recorrido; el detalle, en `EVIDENCIA/WP-08/` |

### Si algo falla

- **La API tarda o responde 502:** está despertando. Esperar un minuto y recargar.
- **La APK no muestra la barra inferior o no carga una pantalla:** confirmar que es la 0.13.1 (Bienvenida, al pie). La barra y la figura en SVG viajan desde la 0.13.0. Además, los clientes validan cada respuesta con objetos estrictos: una versión vieja rechaza lo que no conoce.
- **El paso 3.6 no ofrece el IMC:** el IMC pide la talla en cm. Si se cargó en metros, la ficha dice «Está en otra unidad en esta toma»: cargarla en cm.
- **Se cerró la sesión del website al recargar:** es a propósito. La sesión vive solo en la memoria de la pestaña (DL-012).
- **Después de un ensayo que llegó al paso 5.5:** el acceso de Nutrición quedó revocado. Para dejar la demo lista otra vez, en la APK: zona Cuenta → «Vínculos» → el de Nutrición → «Autorizar nuevamente» → «Autorizar acceso». Es un consentimiento nuevo; el revocado queda en el historial.
- **Después de un ensayo que llegó al paso 3.5:** la evaluación registrada queda en la historia de DEMO-A01, porque registrar no se deshace. Un ensayo nuevo agrega otra toma; si hace falta, la medición se anula y su historia se conserva (RF-050).
- **«Demasiados intentos» al iniciar sesión:** el límite es de 5 intentos cada 15 minutos por red y cuenta (DL-015). Esperar o usar otra cuenta demo.
