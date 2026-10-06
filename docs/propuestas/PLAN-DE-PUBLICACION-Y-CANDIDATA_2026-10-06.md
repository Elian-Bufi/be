# Plan de publicación en `test` y de la próxima candidata de la APK

> **Propuesta para autorizar** (precierre del 2026-10-06, §6). Nada de esto se ejecutó: este encargo no autoriza merge,
> despliegue, publicación de APK ni gastos. Un merge a `main` despliega solo (Render, `autoDeployTrigger: checksPass`):
> no se integra como trámite de documentación.

## Dónde está cada cosa hoy (verificado el 2026-10-06)

| | Estado | Cómo se verificó |
|---|---|---|
| **API y website de `test`** | `2f0c140`. `main` está en `63cba8e`, con cambios solo de documentación | `GET /health/ready` |
| **Las 27 operaciones nuevas** | **Ninguna existe en `test`**: las 18 de #147 (ING, MED y REC) y las 9 de #149 (SER, TIE y EJE) responden 404 | `EVIDENCIA/ENTRENAMIENTO-SERIES/resultados/10-operaciones-en-test.json`, con lecturas GET sin credenciales |
| **Arranque en frío de la API** | 43 s | La misma sonda: la primera respuesta del día |
| **APK vigente** | 0.13.2, versionCode 22 | Tag `be-apk-0.13.2`, release «Latest» |
| **Candidatas instaladas** | 0.14.0-candidata.1 (versionCode 23) y candidata.2 (versionCode 24), prereleases | Tags `be-apk-0.14.0-candidata.1` y `.2` |
| **Contratos de entrenamiento de esas tres APK** | Idénticos | `git diff be-apk-0.13.2 be-apk-0.14.0-candidata.{1,2}` sobre los contratos: sin cambios |

**Consecuencia:** una APK construida desde #149 no puede probarse contra `test` hasta que la API y el website de #149
estén desplegados. Primero el despliegue; después la candidata.

## La cadena de PR

| PR | Rama → base | Qué trae | Migraciones | Operaciones nuevas |
|---|---|---|---|---|
| **#146** | `apk/navegacion` → `main` | Inicio y navegación de la APK (DL-117) y su cierre (DL-118); el arreglo de seguridad `source-map-js` 1.2.2 (`6004c32`) | Ninguna | Ninguna |
| **#147** | `wp-nutricion-recetas` → `apk/navegacion` | Recetas, medios privados en PostgreSQL y registro v2 de comidas (DL-119, DL-120 y DL-121) | `20261005120000_recetas_medios_y_registro_v2` | 18: ING-01 a 06, MED-01 a 05 y REC-01 a 07 |
| **#149** | `wp-entrenamiento-series` → `wp-nutricion-recetas` | Entrenamiento por serie (DL-122, DL-123 y DL-124) y este precierre | `20261006100000`, `20261006100100`, `20261006130000`, `20261006130100` y `20261006150000` (más las de EVIDENCIA_VISUAL, si se integra) | 9: SER-01 y 02, TIE-01 a 04 y EJE-01 a 03 |
| **#148** | `seguridad/source-map-js-1.2.2` → `main` | Solo el arreglo de seguridad: tres líneas del lock | Ninguna | Ninguna |

**#148 y #146 traen el mismo cambio del lock.** Si se integra #148 primero, el de #146 queda idéntico y no genera
conflicto. Si se integra #146 primero, #148 queda vacío y se cierra. Al cambiar la base de cada PR, revisar el diff para
no duplicar el arreglo.

## Cómo integrar, cuando se autorice

**Recomendado: un solo despliegue con todo.** Se integra la cadena de abajo hacia arriba, cada PR en su base, con la CI
en verde en cada paso:
1. #149 en `wp-nutricion-recetas`. No despliega: no es `main`.
2. #147 en `apk/navegacion`. Tampoco despliega.
3. #146 en `main`, con los cuatro checks en verde y la rama al día (`gh pr update-branch`). **Despliega** la API y el
   website de `test` con todo.

La alternativa son tres despliegues: #146, después #147 retargeteado a `main`, y después #149. Cada estado intermedio es
compatible con las APK instaladas, cuyos contratos están congelados por prueba, pero suma dos despliegues y dos ventanas
de prueba.

**Antes de integrar:**
- Resolver la base de `test` (`CONTINUIDAD-BASE-DE-TEST_2026-10-06.md`): si vence en medio, el despliegue queda sin base.
- Si se puede, un respaldo de la base antes del despliegue.

## Las migraciones, en orden

Todas son aditivas. La API las aplica sola al arrancar (`prisma migrate deploy`).

| Migración | Qué hace | Si hay que volver atrás la aplicación |
|---|---|---|
| `20261005120000_recetas_medios_y_registro_v2` | Recetas, medios en `bytea`, registro v2 de comidas, `EVIDENCIA_VISUAL` en el enum de actos | `2f0c140` no lee esas tablas: volver es seguro |
| `20261006100000_finalidad_referencia_de_ejercicio` | Valor nuevo del enum de finalidad del medio | Sin medios en `2f0c140`: seguro. Con #147 desplegado, el código de #147 no conoce ese valor: hay que volver con #147 entero |
| `20261006100100_imagen_y_tiempos_de_entrenamiento` | Imagen del ejercicio y eventos de tiempo | Tablas nuevas que el código anterior no lee: seguro |
| `20261006130000_capacidades_de_cliente` | Registro de la capacidad declarada por la app | Tabla nueva: seguro |
| `20261006130100_base_del_reloj_de_los_tiempos` | Columna de la base del reloj en los eventos | Columna nueva: seguro |
| `20261006150000_funcion_de_finalidad_restaurable` | Fija la ruta de búsqueda de `be_finalidad_de_alcance`, para que un respaldo se restaure | No cambia datos ni resultados: seguro |

El esquema no se revierte nunca (07 §39): `/health/ready` acepta una base con migraciones más nuevas que el artefacto. Para
volver atrás la aplicación: Render → `be-api` → Events → Rollback, como en `docs/DESPLIEGUE.md`.

## Verificación después del despliegue

1. `GET /health/ready`: 200, con el commit integrado.
2. `node EVIDENCIA/ENTRENAMIENTO-SERIES/herramientas/precierre/operaciones-en-test.mjs https://be-api-hndp.onrender.com`:
   las 27 operaciones tienen que responder 401 (existen y piden sesión), no 404.
3. En el website, con una cuenta profesional sintética:
   - «Mis ejercicios» con una imagen;
   - un plan con objetivos por serie que diga que no se puede activar mientras el asesorado no tenga la app capaz.
4. **La APK 0.13.2 instalada sigue andando:**
   - un plan sin objetivos por serie se ve como siempre;
   - uno que los exige dice «Tu plan de entrenamiento no está disponible en este momento» y no muestra valores generales.

## La candidata de la APK

**Requisito:** la API y el website de #149 desplegados en `test`, y verificados con lo anterior.

1. **Número de versión.** El próximo **versionCode es el 25**: el 22, el 23 y el 24 ya están usados (tags de la 0.13.2 y
   de las dos candidatas). El nombre, por ejemplo `0.15.0-candidata.1`, lo decide Dirección. Se fija en
   `apps/mobile/app.config.ts` en el commit de la candidata.
2. **Antes de compilar, sin Gradle:**
   - `npx expo-modules-autolinking resolve -p android` tiene que listar `reloj-del-sistema`;
   - `npx expo config --type introspect` tiene que mostrar `android:fullBackupContent="@xml/be_reglas_de_respaldo"` y
     `android:dataExtractionRules="@xml/be_reglas_de_extraccion"`.
3. **Compilar.** Build local con Gradle, un solo worker y la keystore existente, con el procedimiento de
   `EVIDENCIA/HISTORIAL-ENTRENAMIENTO/build-local-0.11.1.md`. Nunca una clave nueva: otra firma no se instala como
   actualización. Es la primera candidata con un módulo nativo propio (`modules/reloj-del-sistema`); su Kotlin ya compila
   contra expo-modules-core 57.0.18 y android-36 (`EVIDENCIA/ENTRENAMIENTO-SERIES/resultados/08-compilacion-del-modulo-nativo.txt`).
4. **Verificar el artefacto:**
   - `aapt dump badging` muestra el versionCode y el nombre;
   - `apksigner verify --print-certs` muestra el mismo certificado que la 0.13.2;
   - el manifiesto empaquetado tiene las dos reglas de respaldo.
5. **Publicar como prerelease** de GitHub (`be-apk-<versión>`), con su SHA-256, sin tocar `releases/latest`. Requiere
   autorización.

## La prueba en Android

Los pasos están en `EVIDENCIA/ENTRENAMIENTO-SERIES/LEEME.md` («La próxima prueba en el teléfono»). Cubren:
- la reconexión con la API dormida;
- el guardado local y su aviso;
- el descanso con la pantalla bloqueada;
- el descarte de la actividad, el cierre desde recientes, la muerte del proceso y el reinicio del teléfono;
- el cambio de hora;
- la imagen sin recortar;
- TalkBack;
- la exclusión del respaldo.

## Acciones externas y costos, en una sola lista

| # | Acción | Quién | Costo | Cuándo |
|---|---|---|---|---|
| 1 | Pasar `be-db-test` a un plan pago (`CONTINUIDAD-BASE-DE-TEST_2026-10-06.md`, opción A), o elegir B o C | Dirección, en el dashboard de Render | A: unos US$ 6 a 7 por mes (confirmar en el dashboard). B y C: ninguno | Antes del 16/10 |
| 2 | (Opcional) Abrir un rato el acceso externo de la base para un respaldo previo | Dirección | Ninguno | Antes del despliegue |
| 3 | Integrar #149, #147 y #146, en ese orden, y decidir #148 | Dirección autoriza; el merge a `main` despliega solo | Ninguno | Después de 1 |
| 4 | Verificar `test` después del despliegue | Ejecutor | Ninguno | Después de 3 |
| 5 | Compilar la candidata (versionCode 25) y publicarla como prerelease | Dirección autoriza; build local | Ninguno | Después de 4 |
| 6 | Probar en el teléfono | Elián | Ninguno | Después de 5 |
| 7 | (Si se quiere probar EVIDENCIA_VISUAL en `test`) Activar la exigencia del acto con su variable | Dirección | Ninguno | Cuando decida; el texto sigue propuesto |

No hay otros gastos: ni S3, ni servicios nuevos, ni EAS.
