# Recorridos de navegador

Bloque 6 del encargo de consolidación del espacio profesional (2026-10-19): «una selección pequeña de recorridos de navegador en la CI», que protegen el trabajo diario del profesional. Usan Chrome contra el website y la API locales. El website es el export estático, servido con la misma política de contenido de `render.yaml`. La base es PostgreSQL, local y declarada.

## Qué recorren

| Recorrido | Qué comprueba | De qué protege |
|---|---|---|
| `sesion` | Entrar, recargar en `/pro` y en la ficha (con vista y período) y abrir otra pestaña sin volver a entrar. Revisa la cookie de reanudación: HttpOnly, Secure, SameSite=None, particionada y solo en las rutas de sesión. Comprueba que ningún token ni nada con forma de token quede en localStorage o sessionStorage. Al salir en una pestaña, la otra también sale y la cookie se borra. | DL-147 |
| `pistas` | La pista de «Actualizar» con el mouse: aparece con una pausa, se puede pasar por encima y Escape la cierra. Con el teclado: aparece enseguida, el foco se ve y Escape la cierra sin mover el foco. Comprueba que la pista no sale de la ventana ni tapa el control, también al 200 % (720 × 450). Comprueba el árbol de accesibilidad: el nombre es «Actualizar» y la pista es su descripción. Con el dedo, la pista no queda pegada. | DL-146 y bloque 5 |
| `borrador` | Desde la ficha, «Seguir el borrador». Un cambio se guarda solo: «Guardado a las…» aparece solo con la respuesta del servidor. Sigue ahí al recargar, y recargar no pregunta. | DL-148 |
| `conflicto` | Dos pestañas sobre el mismo borrador. La segunda no pisa lo de la primera: dice que no se pudo guardar, conserva lo suyo en pantalla y «Cargar la versión guardada» trae lo de la primera. | DL-148 |
| `primerPlan` | Ficha nueva → «Empezar el plan» → evaluación → objetivo (propone la evaluación recién registrada) → plan. De vuelta en la ficha, la acción es «Seguir el borrador». | DL-145 y bloque 5 |
| `retorno` | Desde la Línea de tiempo de 30 días, «Preparar la revisión de Nutrición» y después «Volver a la ficha, donde estabas»: vuelve a la misma vista y el mismo período. | Bloque 5 |
| `grafico` | El gráfico de evolución dibuja los tres pesos a la altura de su valor, leída con las marcas del eje. El tiempo está a escala, no hay rombos (todo es comparable), la tabla dice lo mismo, e Inicio y Fin eligen la primera y la última toma. | B10-07 |
| `primeraInvitacion` | Sin vínculos, «Invitar a una persona» no elige un área. Un área en la que la cuenta no está habilitada se rechaza en el servidor y el error queda junto al campo, que se marca y recibe el foco. Con un área habilitada, la invitación se crea. | Bloque 5 |
| `areaSugerida` | Con vínculos en una sola de sus dos áreas, esa viene elegida y dice que es una sugerencia, también en la descripción accesible del campo. Se puede cambiar, y la invitación se crea con la otra área. | Bloque 5 |

## Cómo están hechos

- **Cada recorrido tiene sus cuentas y sus datos.** `preparar.mjs` registra un profesional y una persona por recorrido, con correos nuevos en cada corrida (`@example.invalid`). Ningún recorrido usa lo que deja otro. Se pueden correr solos (`--solo`) y en cualquier orden.
- **La habilitación profesional se declara al arrancar la API** (`BE_DEMO_PROFESIONALES`, DL-036). Por eso la API arranca dos veces: una para registrar las cuentas y otra, con esos profesionales habilitados, antes de preparar los datos y de cualquier recorrido. No es un reinicio para esconder una falla ni para vaciar un límite.
- **Límites:** son los de siempre, salvo el de altas (`RATE_LIMIT_REGISTRO_MAX=200`), porque cada corrida registra dos cuentas por recorrido desde la misma dirección. El limitador se prueba en las pruebas de integración.
- **Los datos pasan por la API**, como los cargaría cada persona: el profesional desde el website y la persona desde la APK. No hay SQL ni disparadores apagados.
- **Las comprobaciones miran resultados:** la dirección, lo que dice la pantalla, lo que guardó el servidor, la cookie, el árbol de accesibilidad y, en el gráfico, dónde quedó cada punto. Un título o una leyenda no alcanzan.
- **Una falla deja evidencia:** una captura y el texto de cada pestaña del recorrido, `resultados.json` y el registro de la API. En la CI se suben como artefacto `resultados-recorridos`.

## Correrlos

En la CI corren en el trabajo `recorridos` de `.github/workflows/ci.yml`. A mano:

```bash
npm run build:api
BE_API_BASE_URL=http://localhost:3101 npm run build:web
BE_RECORRIDOS_DATABASE_URL=postgresql://usuario:clave@localhost:5432/be_recorridos node test/navegador/correr.mjs resultados-recorridos [--solo sesion,pistas]
```

- **La base se declara siempre.** Tiene que ser local y llamarse `be_recorridos…`; si no, el script se detiene antes de hacer nada. Las migraciones se aplican ahí.
- La API usa el puerto 3101 y el website, el 3100.
- `CHROME` indica el navegador. Por omisión, `/usr/bin/google-chrome` en Linux y el Chrome instalado en Windows.

## Lo que no cubren

- **El teléfono.** Las pruebas de la candidata.3 que requieren el teléfono siguen pendientes. Son la aceptación con las dos decisiones del consentimiento, el regreso por «Completar», el acceso efectivo, los días de entrenamiento y los avisos. Ningún recorrido de acá las reemplaza.
- **Un lector de pantalla real.** El árbol de accesibilidad prueba que la descripción llega, no cómo la usa una persona con NVDA o TalkBack.
- **Personas.** La prueba con profesionales está en `docs/ux/PRUEBA-CON-PROFESIONALES.md`.
