# Apariencia configurable del website: «Azul noche» y «Claro»

Orden de Dirección del 2026-09-30 (avance principal 2). Rama `feat/apariencia-configurable`, sobre `main` (`53cc70e`). Para auditoría, **sin integrar, sin desplegar y sin APK**.

## La decisión, y cómo evolucionó

- **2026-09-20 / 2026-09-21** (`docs/paquetes/WP-IDENTIDAD-VISUAL.md`, tramo A): un tema por superficie, claro y azul en el espacio de trabajo, oscuro en la cara pública; un selector de tema para la persona quedó fuera de alcance (§10).
- **2026-09-30 (esta orden):** Dirección autoriza un **selector de apariencia para todo el website**, con **«Azul noche» como predeterminada** y «Claro» como alternativa, inspirado en la referencia `1000155398.png`. Esta instrucción actualiza la elección del tema claro fijo y supera la exclusión de §10. El paquete de identidad no se reescribe: queda esta nota como registro de la evolución.
- La preferencia es **local al navegador** en este incremento; la extensión al móvil queda para después. No hay tablas, endpoints ni sincronización para guardarla.

## Qué puede hacer la persona

En el encabezado de cualquier página hay un control «Apariencia» con dos opciones. Elegir una:
- cambia el website entero, incluidas las pantallas de trabajo, la cara pública, la figura de la toma y los gráficos;
- se conserva entre navegación y recarga (`localStorage`, clave `be-apariencia`);
- no toca datos, permisos, validaciones ni lo escrito en un formulario;
- si el navegador no guarda preferencias, vale por esta visita y el control lo dice.

Sin preferencia guardada, o con un valor desconocido, la apariencia es Azul noche.

## Cómo está hecho

- `data-tema` en `<html>`; los tokens de cada apariencia en `apps/web/src/app/tokens.css` (`:root` = Claro, `[data-tema='azul-noche']` = Azul noche, que redefine el conjunto entero: figura y gráficos incluidos).
- Un script en línea en `<head>` (`SCRIPT_DE_INICIO`, `apps/web/src/lib/apariencia.ts`) pone el atributo antes del primer dibujo. La CSP del despliegue ya admite scripts en línea; no se debilitó nada. `suppressHydrationWarning` cubre solo ese atributo.
- Las cinco páginas públicas dejan de forzar `.tema-oscuro` y pasan a `.cara-publica`, que sigue al tema. Su degradé baja del 22 % al **10 %** de azul: con el 22 %, en Claro el texto de error y de éxito no llegaba a 4,5:1 sobre el velo (la prueba de contraste lo detectó).
- Tomado de la referencia: fondo azul profundo, superficies navy con jerarquía, acentos cian y azul, texto claro, bordes definidos, degradados moderados. **No** se tomó: porcentajes, puntuaciones, suplementos, agua, sueño, inicio nuevo, navegación móvil nueva, composición corporal, logo nuevo. Sin motor 3D ni dependencias nuevas.
- Sin cambios en la APK.

## Pruebas

| Prueba | Resultado |
|---|---|
| Contraste (`scripts/contraste.test.cjs`): el conjunto completo de pares, figura y gráficos incluidos, en **las dos apariencias**; y el texto de la cara pública sobre todo el degradé, en las dos | 14/14 |
| Copy de pantallas (T13) | sin hallazgos |
| Recorrido web local (`recorrido-tema.mjs`), escritorio, almacenamiento bloqueado y móvil 390 px: primera visita sin preferencia; HTML servido con el atributo y el script antes del cuerpo; selector con nombre accesible, estado y aviso; cambiar de tema conserva lo escrito; la cara pública sigue al tema; persistencia en recarga y navegación; figura en Azul noche con el relleno del tema y un solo matiz en los puntos; entrenamiento carga; valor inválido → predeterminado; almacenamiento bloqueado → vale por la visita y el control avisa; sin desplazamiento horizontal | ver el PR |
| `npm test`, typecheck, OpenAPI (sin cambios), legajo y build | ver el PR |

**El gráfico de evolución antropométrica en las dos apariencias** existe solo con el PR de evolución (#116): se verifica en la combinación de las dos ramas, registrada en el PR.

Capturas: `apariencia/01-login-azul-noche.png`, `02-login-claro.png`, `03-evolucion-claro.png`, `04-evolucion-azul-noche.png`, `05-figura-azul-noche.png`, `06-movil-login-claro.png`.

## Límites

- **Parpadeo residual:** el HTML servido lleva Azul noche y el script corrige antes del primer dibujo; en un navegador con JavaScript deshabilitado queda Azul noche siempre. No se puede eliminar del todo sin mover la preferencia al servidor, que esta orden excluye.
- La preferencia no viaja entre dispositivos ni a la APK.
- No validado por Dirección, no desplegado.
