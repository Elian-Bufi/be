# Evidencia de WP-NUTRICION-RECETAS

> **Encargo:** «BE · Implementación de Nutrición con recetas, fotos y macros verificables», de Dirección, del 2026-10-05.
> La entrega prevista es el 2026-10-20.
> - Definición: [`docs/paquetes/WP-NUTRICION-RECETAS.md`](../../docs/paquetes/WP-NUTRICION-RECETAS.md).
> - Deudas: DL-119, DL-120 y DL-121.
> - Rama `wp-nutricion-recetas`, PR #147 en borrador.
>
> **Datos:** todos sintéticos. Las cuentas son `@example.invalid`, creadas por la API pública en una base local. Las tres
> fotos de recetas son las del paquete de Dirección, generadas por IA. Las fotos de las comidas son imágenes sintéticas
> armadas en la prueba. No hay credenciales reales, sesiones ni fotos privadas de personas.

## Estado, en los cuatro planos

| Plano | Estado |
|---|---|
| **Implementado** | Sí. Los commits son, en orden: `4c9e452` (definición), `3a0ae66` (dominio), `fd259e4` (API), `2a6a942` (website), `744a26f` (APK) y `c618508` (correcciones del recorrido) |
| **CI** | Ver el PR #147: cada push de la rama corre las cuatro tareas |
| **Publicado** | No. No se publicó una APK ni se integró ni se desplegó: el encargo los deja fuera |
| **Verificado en el teléfono** | **No.** La APK nueva necesita una compilación propia (suma `expo-image-picker`). Lo pendiente en Android está más abajo |

## El recorrido completo, paso por paso

Se corrió con lo mismo que en producción, pero local:
- la API compilada;
- una base PostgreSQL 16 propia;
- el website como export estático, servido con **la misma CSP de `render.yaml`** (`img-src 'self' data:`), apuntada a la
  API local.

| # | Paso | Dónde se probó | Resultado | Evidencia |
|---|---|---|---|---|
| 1 | La profesional crea las tres recetas del paquete en el website: ingredientes USDA por búsqueda, gramos, estado y pasos | puppeteer contra la web y la API locales | El cálculo que muestra la pantalla es el del paquete en las tres, en el total y en la porción | `capturas-web/00` a `03c`, `resultados/01` |
| 2 | Carga la foto de cada una por el flujo real: archivo, vista previa, procedencia «Generada por IA», autoría y «Cargar imagen» | ídem | BE la guarda en JPEG y la muestra como «Imagen de referencia · Generada por IA» | `01b`, `01c`, `02c`, `03c` |
| 3 | Edita: arroz de 160 a 200 g y el pollo sin los 8 g de aceite | ídem | Los recálculos en vivo son los dos casos del paquete. Una edición guardada crea la versión 2, y la foto sigue | `04a` a `04c` |
| 4 | Recarga la página | ídem | Hay que volver a entrar (DL-012). Después del login vuelve a la misma receta, con su foto | `07`, `resultados/01` |
| 5 | Arma el plan y lo activa: Almuerzo con las tres recetas, Merienda con una opción manual sin imagen y Cena con una receta | ídem | El borrador y el plan activado nombran la receta y su versión. Los ítems son los de una porción | `05`, `06a` a `06c` |
| 6 | El asesorado lee «Hoy» con opciones (API-ING-01), como la APK | script contra la API | Los macros de las porciones del plan son **exactamente** los del paquete. Lee la foto que cargó la profesional: JPEG sin EXIF, de 1600 px como máximo, sin caché, con una ruta que vence en 15 minutos. Una ruta alterada da 404 | `resultados/02` |
| 7 | Registra de las tres formas, con doble toque y reintento | ídem | Un solo registro. Otra opción en la misma comida da 409. «Comí las porciones del plan» calcula con el plan. Con un ingrediente vacío, el total es desconocido, no cero | `resultados/02` |
| 8 | Deshace y vuelve a registrar | ídem | La anulación queda y la comida se libera. Lo deshecho no cuenta en «Hoy» ni en la lista de la APK instalada | `resultados/02` |
| 9 | «Comí algo diferente» con una foto con GPS, con texto y foto, solo foto, vacía y con un archivo inválido | ídem | Lo guardado no tiene EXIF ni GPS. Texto y foto, y solo foto, se guardan con «Macros sin calcular». Vacía da 400 y el archivo inválido, 422 | `resultados/02` |
| 10 | Permisos con otras cuentas | ídem | Otro asesorado no lee la foto ni el registro (404, como si no existiera) y no la usa en su registro. Una foto de comida no se puede usar como imagen de receta | `resultados/02` |
| 11 | La receta cambia después del registro | ídem | Hay otra versión de la receta. El registro y el plan activado conservan la suya | `resultados/02` |
| 12 | Las pantallas reales de la APK, contra la API real | render en el navegador con el cliente real de la APK (**no es Android**) | El carrusel muestra las fotos que cargó la web. Un toque en «Comí esta opción» quedó registrado en la API, con la primera opción y las cantidades sin confirmar | `capturas-apk-api-real/40` a `44`, `resultados/05` |
| 13 | La profesional ve lo registrado | puppeteer | «Ver registro» muestra el estado de las cantidades, lo consumido estimado y las fotos privadas | `08`, `resultados/03` |
| 14 | El website a 390 px de ancho | ídem | «Mis recetas», el editor y el plan no se desplazan de costado | `09` a `11` |
| 15 | Reiniciar la API | API y puppeteer | Las tres fotos de receta y la foto privada se leen con el mismo SHA-256, y el website las vuelve a mostrar | `resultados/03` y `04` |

Los cinco archivos de `resultados/` suman **78 de 78 controles**. La primera corrida tuvo cinco fallas, todas del script de
prueba, y se corrigieron:
- una carrera al abrir el editor;
- un reintento armado con otra hora: la API respondió bien, con 409 `IDEMPOTENCY_KEY_REUSED`;
- una página armada sin `limit`;
- un filtro que leía «cortados» en una lista vacía;
- el retorno después del login, que no volvía a «Mis recetas». Ese sí era un error de la web, y se corrigió en `c618508`.

## Pruebas automáticas

**Unitarias** (`npm test`):

| Suite | Resultado |
|---|---|
| Dominio | 475/475 |
| Scripts | 214/214 |
| API unitaria | 71/71 |

El dominio incluye los 11 casos numéricos del paquete, exactos, y la compatibilidad congelada de lo que lee la APK
instalada. Los scripts incluyen el registro de la APK (26) y el retorno seguro (3).

**Integración** con PostgreSQL 16 local, sobre una base nueva:

| Archivo | Resultado |
|---|---|
| `recetas` | 9/9 |
| `medios` | 13/13 |
| `registro-de-comidas` | 12/12 |
| `contrato` | 13/13, con las 18 operaciones nuevas observadas |

- El resto de la suite, 43 archivos, pasó de a uno.
- `consentimiento` y `concurrencia-wp03` fallaron una vez en la cadena larga, con la máquina cargada, y pasaron solos.
- `medios` falló una vez justo después de la suite unitaria y no se reprodujo en tres corridas seguidas.

**El paquete:** `verificar_calculos.py` dio OK, con un Python embebible fuera del repositorio. Acredita los datos del
paquete, no a BE.

**APK, renders con datos sintéticos:** 32 capturas en `capturas-apk/`, con su propio LEEME. Cubren 360, 390 y 412 dp,
Azul noche y Claro, y letra ×1, ×1,3 y ×2.

## Lo que no se probó, y los límites

- **Android:**
  - deslizar el carrusel con el dedo;
  - TalkBack;
  - volver del detalle a la misma opción;
  - doble toque y reintento sin red;
  - el teclado decimal;
  - cámara y galería: permisos, cancelar, reemplazar y que Android cierre la app con la cámara abierta;
  - leer y subir una foto real del teléfono;
  - la barra con gestos y con botones, y el último contenido;
  - la letra máxima del sistema.

  Nada de esto se puede afirmar sin compilar y probar la APK.
- **El ambiente `test` de Render:** no se probó. No hay despliegue en este paquete.
  - Para la prueba remota no falta ningún servicio: con `BE_MEDIOS_ALMACEN=postgres`, que es el valor por defecto, las
    imágenes se guardan en la misma base.
  - Para usar S3, que es lo que pide el 07 §25, hacen falta un bucket privado compatible, sus credenciales y la
    implementación S3 de `AlmacenDeMedios` (DL-120). No se contrató nada.
- **La APK nueva suma permisos:**
  - CAMERA;
  - READ y WRITE_EXTERNAL_STORAGE solo hasta Android 12, que vienen del módulo `expo-image-picker`;
  - RECORD_AUDIO queda bloqueado.

  Hay que verificarlos en el manifiesto de la próxima APK.
- **Decisiones de producto que conviene que Dirección mire** (DL-121):
  - Una comida diferente registrada en una comida del plan ocupa esa comida, con un registro por comida y día. Agregar
    algo más exige deshacer y volver a registrar.
  - En el contraste y la revisión, esa comida diferente sigue **fuera de la prescripción** (CONS:599-612): no marca la
    comida prescripta como realizada, y la web lo explica.
  - La APK manda una foto por comida diferente, aunque el contrato admite tres.
  - Las plantillas y las comidas habituales no aceptan opciones de receta.
- **El website** muestra cada imagen como data URL, porque la CSP no admite `blob:`. La ruta firmada no se guarda.

## Hallazgos fuera del paquete

| Severidad | Hallazgo | Estado |
|---|---|---|
| Alta (bloquea la CI) | `source-map-js` 1.2.1, transitiva de Next y postcss, quedó con el aviso GHSA-68fv-2mgg-jv7q, publicado después de `9021c47`. La auditoría de la CI falla en cualquier rama con ese lock | Corregido acá, en el lock (1.2.2). `main` y #146 lo necesitan igual |
| Baja | La APK 0.13.2 instalada rearma la hora al reintentar con la misma clave. Si se pierde la primera respuesta, la API contesta 409 en lugar del registro: no duplica, pero muestra un error genérico | La APK nueva repite el cuerpo idéntico |
| Baja | El retorno después del login no incluía /pro/templates | Corregido en `c618508` |

## Cómo reproducir

Hace falta Node 22, un PostgreSQL 16 local con una base vacía para el recorrido y Chrome. Las rutas son relativas al
repo.

1. `npm ci`, `npm run build:domain` y `npx prisma generate`.
2. **Integración:**
   `TEST_DATABASE_URL=postgresql://<usuario>:<clave>@localhost:<puerto>/<base> npx jest --config apps/api/jest.integration.config.js --runInBand test/integration/<archivo>.int-spec.ts`.
3. **Recorrido** (`herramientas/recorrido/`):
   1. `npm install`, una vez.
   2. `BE_E2E_DATABASE_URL=… bash entorno.sh compilar`, después `bash entorno.sh migrar`.
   3. En otra terminal: `bash api-en-primer-plano.sh`.
   4. `node preparar.mjs cuentas http://localhost:3001`. Imprime `BE_DEMO_PROFESIONALES=…`: reiniciá la API con
      `bash api-en-primer-plano.sh "<valor>"`.
   5. `node preparar.mjs vinculo http://localhost:3001`.
   6. `node servir-web.mjs` (el website en :3000, con la CSP de producción).
   7. `node recorrido-web.mjs`, después `node recorrido-api.mjs registrar` y `node recorrido-web-registros.mjs registros`.
   8. Reiniciá la API. Después corré `node recorrido-api.mjs persistencia` y `node recorrido-web-registros.mjs tras-reinicio`.
   9. **La APK contra la API:** en `herramientas/render-navegador`, `npm install` y `API_REAL=1 node construir.mjs`.
      Después `node ../recorrido/servir-arnes.mjs salida 3002 http://localhost:3001` y `node ../recorrido/apk-con-la-api-real.mjs`.

El estado, las sesiones y las capturas de cada corrida quedan en `herramientas/recorrido/trabajo/`, que git ignora. La
contraseña de las cuentas es sintética y solo sirve para esa base local.
