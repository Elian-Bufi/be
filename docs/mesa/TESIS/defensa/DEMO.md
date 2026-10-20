# Demo de la defensa: website y APK, con su plan B

La demostración de la defensa es una versión corta (7 minutos) del guion del apartado 11 de la tesis. Muestra las dos
plataformas sobre la misma persona sintética, **Diego Sosa**, que tiene tres años de historia. Cada paso tiene su
respaldo: una captura verificada para mostrar si fallan la red, Render o el teléfono.

- **Versión de referencia:** `main` `0fb1bff` (2026-10-20). La API de test responde ese commit desde las 02:33.
- **Respaldo del website:** `respaldo-demo/`, doce capturas tomadas en test el 2026-10-20 entre las 06:30 y las 06:32,
  con la API en `0fb1bff`. Solo se navegó: no se escribió nada. El detalle está en `respaldo-demo/registro.json`.
- **Respaldo de la APK:** no hay capturas nativas de la candidata 0.17.0 (anexo K, K17). Se usan dos fuentes, siempre con
  su rótulo:
  - capturas nativas del teléfono de Dirección con la APK **0.9.1** (2026-09-25): `EVIDENCIA/ENTREGA/capturas-apk/`;
  - vistas del cliente real de la APK dibujadas en el navegador, contra la API real, del 2026-10-06 (llevan una franja roja que
    dice que no son la APK): `EVIDENCIA/NUTRICION-RECETAS/capturas-apk-api-real/` y
    `EVIDENCIA/ENTRENAMIENTO-SERIES/capturas-apk-api-real/`.

## Antes de entrar a la mesa

| Control | Cómo | Si falla |
|---|---|---|
| La API responde con la versión que se presenta | `GET https://be-api-hndp.onrender.com/health/ready`: 200 y `data.version.commit` | Plan B entero con capturas |
| El website abre | `https://be-web-1ngj.onrender.com` | Plan B del website |
| La APK elegida está instalada y entra | Dirección elige la versión (la estable 0.13.2 o la candidata 0.17.0-candidata.3) y la prueba en el teléfono de la demo | Plan B de la APK |
| Las credenciales a mano | Versión de evaluación de la tesis, apartado 14 (nunca en pantalla compartida) | — |
| Un ensayo completo | Con el mismo teléfono y la misma red, el día anterior | — |

## Los siete minutos

| Min. | Quién y dónde | Qué se muestra | Qué demuestra | Plan B |
|---|---|---|---|---|
| 0:00 | Sofía Paz · website | El espacio profesional: los pendientes como hechos con fecha y la cartera. Recargar la página: la sesión sigue. | El trabajo del día; la sesión que sobrevive a la recarga (DL-147) | `respaldo-demo/01-espacio-profesional.png` |
| 0:45 | Sofía · ficha de Diego | Resumen por área, línea de tiempo con comidas, tomas y hechos distintos de lo indicado, y «Analizar» del último año | La historia por adición, leída como hechos | `02-ficha-resumen.png`, `03-ficha-linea-de-tiempo.png`, `04-ficha-analizar.png` |
| 2:00 | Sofía · Nutrición | El plan activo en solo lectura y su historial de cinco versiones; los registros, con la comida diferente | Activar es versionar; nada se pisa | `05-nutricion-plan.png`, `06-nutricion-registros.png`, `07-nutricion-revisiones.png` |
| 3:00 | Sofía · Antropometría | Las tomas y la evolución del peso, con «cómo se obtuvo» cada valor | Tomas inmutables; evolución sin interpolar | `08-antropometria-tomas.png`, `09-antropometria-evolucion.png` |
| 3:45 | Martín Acosta · Entrenamiento | El estado del seguimiento: plan activo, última sesión y revisión pendiente | Lo mismo en otra área, con otro profesional | `10-entrenamiento.png` |
| 4:30 | Diego · APK | El plan del día con el carrusel de opciones, «Comí esta opción» y «Comí algo diferente» | El circuito del asesorado | `EVIDENCIA/NUTRICION-RECETAS/capturas-apk-api-real/40` a `44` (vistas rotuladas) |
| 5:30 | Diego · APK | La sesión por serie: carga, repeticiones y RIR, con el descanso | El registro serie por serie | `EVIDENCIA/ENTRENAMIENTO-SERIES/capturas-apk-api-real/apk-04` a `apk-07` (vistas rotuladas) |
| 6:15 | Diego · website | Sus vínculos, cada uno con sus áreas y cada área con su consentimiento; sus novedades | Consentir es por área y se puede revocar | `12-asesorado-vinculos.png`, `13-asesorado-novedades.png` |

Si sobra tiempo, el paso 8 del apartado 11 (revocar el consentimiento de un área y ver que el profesional pierde el
acceso) es el más fuerte para la pregunta sobre privacidad. Se hace con Federico, nunca con Diego, y después hay que
volver a autorizar el área.

## Cuidados

- **No escribir sobre Diego.** Diego es el ejemplo de los gráficos y su historia es la de la portada. Para registrar o
  revisar en vivo, usar a Federico o a Norma, que tienen revisiones pendientes. Todo lo que se registra queda: no se
  borra.
- **La cartera de Sofía muestra seis personas.** La sexta es «Asesorado · bea2eb», la persona de la verificación del
  2026-10-20, con su vínculo de Nutrición finalizado (anexo K, K16). Si alguien pregunta: es historia, y BE no la borra.
- **Los pendientes cambian con el calendario.** «Revisión vencida hace 8 días» depende del día en que se muestra.
- **«Demasiados intentos» al entrar:** esperar; el límite es por red y por cuenta.
- **Las capturas de la APK no son nativas** (salvo las de la 0.9.1): decirlo al mostrarlas. Si antes de la mesa hay
  capturas nativas de la candidata, reemplazarlas (anexo K, K17).
- **La TVCC-30 no se corre en la mesa:** necesita la consola del servidor. Si la preguntan, mostrar el resultado del
  2026-10-16 (`EVIDENCIA/TVCC-30/LEEME.md`): 5 de 7 ciclos, 71,4 %, sobre la cohorte sintética local, y aclarar que es
  una demostración del cálculo, no una medición del servicio.

## Si algo falla en vivo

1. Decirlo en una frase («Render no responde; sigo con las capturas de esta mañana, tomadas contra la misma versión»).
2. Abrir `respaldo-demo/` en el visor de imágenes, en el orden de la tabla.
3. Para la APK, abrir las vistas rotuladas o las capturas nativas de la 0.9.1, y decir cuál es cuál.
4. Al terminar, si la red volvió, ofrecer mostrar en vivo un solo paso.

## Cómo regenerar el respaldo del website

Con Node 22, desde `docs/mesa/TESIS`:

```text
BE_CUENTAS_COHORTE=<cuentas.env de la cohorte> PUPPETEER_DESDE=<package.json con puppeteer-core> \
CHROME=<chrome.exe> SALIDA=<carpeta> node herramientas/capturar-respaldo-demo.mjs
```

Solo navega: entra con las cuentas sintéticas, recorre las pantallas, cierra cada sesión y escribe `registro.json`. Las
credenciales se leen del archivo local y no se imprimen. La página de la cuenta del asesorado no se captura porque
muestra el identificador completo de la cuenta.
