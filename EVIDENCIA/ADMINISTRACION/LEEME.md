# Evidencia · Administración (WP-ADMINISTRACION, DL-155)

Qué hay acá: las capturas de la consola `/admin` tomadas por el recorrido de navegador `administracion`
(`test/navegador/recorridos.mjs`), el procedimiento del operador (`OPERACION.md`) y la prueba de concurrencia de la
renovación de códigos (`CONCURRENCIA-DE-LA-RENOVACION.md`). La definición del paquete está en
`docs/paquetes/WP-ADMINISTRACION.md`.

**Estado:** implementado y probado de forma automática (integración, contrato y navegador). **No** está integrado ni
desplegado: vive en la rama `wp-administracion` (PR #210, borrador). Nadie lo usó todavía con un lector de pantalla ni
con personas.

**Alcance de esta entrega:**
- **Administración gestiona perfiles profesionales que ya existen en BE**: los que creó el servicio interno (la siembra
  de `test` o las pruebas), con sus áreas presentadas. Ahí registra observaciones, verifica o rechaza, suspende y
  rehabilita, y concede o retira la habilitación, área por área.
- **El alta completa de profesionales nuevos sigue pendiente**: el registro como profesional, la presentación de
  documentos y la revisión o certificación de matrículas no están en este paquete (`WP-ADMINISTRACION.md`, §2 y §15). Una
  persona que se registra con la intención de ser profesional no aparece en la lista hasta que exista ese circuito.
- «Habilitado para operar en BE» no es «matrícula certificada».

## Las capturas

Tomadas el 2026-10-25 a 1440 × 900, con la API y el website locales de la rama (commit `a8360c4` más los estilos de esa
pasada), sobre una base local descartable. Datos sintéticos de la corrida (`@example.invalid`).

| Archivo | Qué muestra |
|---|---|
| `administracion-entrada-*` | La entrada, después de cerrar la sesión: lo dice arriba del formulario |
| `administracion-segundo-factor-*` | El código del autenticador al volver a entrar, con el plazo de 10 minutos y la salida por un código de recuperación |
| `administracion-lista-*` | La lista: las áreas pendientes de todo BE, la búsqueda, los filtros y el pendiente primero |
| `administracion-ficha-*` | La ficha de un profesional con dos áreas pendientes: verificación y habilitación por separado, las decisiones que admite cada área y lo que no es certificar una matrícula |
| `administracion-confirmacion-*` | La confirmación de «Verificar»: profesional, área, qué cambia, qué sigue igual y a quién se avisa; el foco empieza en el fundamento |
| `administracion-conflicto-azul-noche` | Otra consola suspendió el área con el diálogo abierto: dice cómo está ahora, conserva lo escrito y no deja confirmar |
| `administracion-historial-*` | El historial: autor humano (con su nombre) o automático, estado anterior y posterior, fundamento y texto comunicado |
| `administracion-seguridad-*` | La seguridad del acceso: códigos que quedan, generarlos de nuevo, reemplazar el autenticador y qué pasa si se pierde todo |

- **Sin secretos:** ninguna captura muestra el QR, la clave del autenticador, los códigos de recuperación ni el de
  incorporación. El recorrido los usa en memoria y no los escribe en `estado.json` ni en ningún registro.
- **El tema:** el recorrido cambia la apariencia con el atributo de la página, como el menú, pero sin pasar por él. Por eso
  en Claro el botón «Apariencia» de la entrada sigue mostrando la luna. Elegida desde el menú, el ícono acompaña.

## Cómo se reproducen

```bash
npm run build -w @be/api
BE_API_BASE_URL=http://localhost:3101 npm run build -w @be/web
BE_RECORRIDOS_DATABASE_URL=postgresql://usuario:clave@localhost:<puerto>/be_recorridos_<algo> \
  node test/navegador/correr.mjs <carpeta de salida> --solo administracion
```

La base tiene que ser local y llamarse `be_recorridos…` (la guardia del script lo exige). En la CI corre con el resto de
los recorridos, en el trabajo `recorridos`, y las capturas quedan en el artefacto `resultados-recorridos`.

## Lo que no prueba esta evidencia

- Un lector de pantalla real (NVDA, VoiceOver): el recorrido comprueba el foco y los nombres, no cómo se usa.
- Personas: nadie de Administración usó la consola todavía.
- El ambiente `test`: hace falta `BE_CLAVE_DEL_SEGUNDO_FACTOR` en `be-api`, con el PR de configuración que se integra
  antes (ver `OPERACION.md`, sección 1). Todavía no se incorporó ningún administrador en `test`.
- Que la CI pase no es una validación de profesionales ni una garantía absoluta de seguridad.
