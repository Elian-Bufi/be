/**
 * WP-RECETARIO-E-IMAGENES (DL-191) · sin React: lo que las pantallas del recetario y de las imágenes tienen que hacer.
 * La lógica vive en el dominio (`recetario.ts`, `contratos-medios.ts`) y tiene sus pruebas allá (TEST-REC-030 a 036);
 * acá se fija que el website la use y lo que dice. TEST-REC-020 a 027.
 *
 * Uso: npm run test -w @be/web (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import * as D from '@be/domain';

const leer = (r) => readFileSync(new URL(`../src/${r}`, import.meta.url), 'utf8');
const MEDIOS = leer('lib/medios.ts');
const IMAGEN = leer('app/pro/recipes/imagen-de-receta.tsx');
const MIS_RECETAS = leer('app/pro/recipes/mis-recetas.tsx');
const RECETARIO = leer('app/pro/recipes/recetario-de-be.tsx');
const CAJON = leer('app/pro/recipes/receta-en-el-cajon.tsx');
const PROPONER = leer('app/pro/recipes/proponer-al-recetario.tsx');
const EDITOR_DE_RECETA = leer('app/pro/recipes/editor-de-receta.tsx');
const EDITOR_DEL_PLAN = leer('app/pro/advisees/nutrition/editor.tsx');
const ADMIN = leer('app/admin/recipes/propuestas-al-recetario.tsx');
const MENU = leer('app/admin/menu-administrativo.tsx');
const ESTILOS = leer('app/globals.css');

test('TEST-REC-020 · antes de subir, el navegador achica la imagen a 1600 px en WebP (o JPEG) una sola vez, y sube eso', () => {
  assert.match(MEDIOS, /medidasAlAchicar\(ancho, alto\)/);
  assert.match(MEDIOS, /createImageBitmap\(archivo, \{ resizeWidth: medidas\.ancho, resizeHeight: medidas\.alto/);
  assert.match(MEDIOS, /codificar\('image\/webp'\)[\s\S]*codificar\('image\/jpeg'\)/);
  // Se achica al elegirla (`revisarImagen`), no al subir: el reintento con la misma clave sube los mismos bytes.
  assert.match(MEDIOS, /const achicada = await achicarAntesDeSubir\(archivo, medidas\.ancho, medidas\.alto\);/);
  assert.match(MEDIOS, /const contenido = imagen\.paraSubir\?\.contenido \?\? imagen\.archivo;/);
  assert.match(MEDIOS, /byteSize: contenido\.size/);
  assert.equal(D.LIMITES_DE_MEDIO.ladoAlAchicarEnElCliente, 1600);
});

test('TEST-REC-021 · las listas piden la miniatura y el detalle la grande; el recetario trae la ruta firmada y no pide acceso', () => {
  assert.match(IMAGEN, /variante: variante \?\? \(chica \? 'thumbnail' : 'large'\)/);
  assert.match(IMAGEN, /rutas=\{guardada\.paths \?\? null\}/);
  assert.match(MEDIOS, /api\.accederAMedio\(token, medioId, variante \?\? undefined\)/);
  assert.match(MEDIOS, /if \(ruta\) return \{ acceso: SIN_ACCESO, dataUrl: await bajar\(ruta\) \};/);
  // La clave de la memoria de la pestaña lleva la variante: la miniatura no pisa a la grande.
  assert.match(MEDIOS, /\$\{token\}\|\$\{medioId\}\|\$\{variante \?\? 'guardada'\}/);
  assert.match(RECETARIO, /chica rutas=\{r\.image\?\.paths \?\? null\}/);
  assert.match(RECETARIO, /variante="large" rutas=\{r\.image\.paths \?\? null\}/);
  // «Mis recetas» y el cajón del plan usan las rutas que trae la lista (API-REC-02): no piden un acceso por miniatura, que
  // con muchas fotos llegaba al límite de consultas por minuto.
  assert.match(MIS_RECETAS, /sesionPerdida=\{sesionPerdida\} chica rutas=\{r\.image\?\.paths \?\? null\}/);
  assert.match(CAJON, /chica rutas=\{receta\.image\?\.paths \?\? null\}/);
});

test('TEST-REC-022 · «Recetas» tiene dos pestañas; el recetario se lee, se abre de solo lectura y se copia a Mis recetas', () => {
  assert.match(MIS_RECETAS, /clave: 'recetario', texto: COPY_RECETARIO\.recetarioDeBe/);
  assert.match(MIS_RECETAS, /<DetalleDelRecetario /);
  assert.match(MIS_RECETAS, /<RecetarioDeBe /);
  // La copia se abre en el editor y lo dice el aviso flotante, que no corre nada.
  assert.match(MIS_RECETAS, /setAviso\(COPY_RECETARIO\.copiada\(copia\.name\)\);/);
  assert.match(RECETARIO, /api\.recetarioDeBe\(token, \{ limit: '50'/);
  assert.match(RECETARIO, /api\.copiarRecetaDelRecetario\(token, origen\.recipeId, intento\.actual\(origen\.recipeId\)\)/);
  // Una receta del recetario no se edita en el editor de recetas.
  assert.match(EDITOR_DE_RECETA, /if \(d\.origin === 'BE_RECIPE_BOOK'\) return setLectura\('del-recetario'\);/);
  assert.match(IMAGEN, /if \(receta\.origin === 'BE_RECIPE_BOOK'\) \{/);
});

test('TEST-REC-023 · en el cajón del plan: la miniatura de cada receta, cargar su imagen ahí mismo y el Recetario de BE', () => {
  const elegir = EDITOR_DEL_PLAN.slice(EDITOR_DEL_PLAN.indexOf('function ElegirReceta('));
  assert.match(elegir, /<ImagenEnElCajon token=\{token\} sesionPerdida=\{sesionPerdida\} receta=\{r\} onCambio=\{actualizar\} \/>/);
  assert.match(elegir, /<RecetarioEnElCajon token=\{token\} sesionPerdida=\{sesionPerdida\} texto=\{texto\} orden=\{ordenar\} extra=\{frenteDe\} onElegir=\{onElegir\} onCopiada=\{actualizar\} \/>/);
  // El mismo recuadro de la imagen de siempre: la imagen es de la receta.
  assert.match(CAJON, /<ImagenDeReceta token=\{token\} receta=\{receta\} sesionPerdida=\{sesionPerdida\} onCambio=\{\(r\) => onCambio\(r\)\} \/>/);
  assert.match(CAJON, /COPY_RECETARIO\.laImagenEsDeLaReceta/);
  // El recetario del cajón se lee solo si se elige esa pestaña.
  assert.match(elegir, /\{origen === 'recetario' \? \(\n\s+<>/);
});

test('TEST-REC-024 · proponer: la cesión de la foto entera, con su casilla; sin la casilla no se envía', () => {
  assert.match(PROPONER, /<p>\{CESION_DE_LA_FOTO\.texto\}<\/p>/);
  assert.match(PROPONER, /if \(conFoto && !acepto\) return setFalta\(true\);/);
  assert.match(PROPONER, /photoAssignment: conFoto \? \{ textVersion: CESION_DE_LA_FOTO\.version, accepted: true as const \} : null/);
  assert.match(PROPONER, /motivoParaNoProponer\(receta\)/);
  assert.match(EDITOR_DE_RECETA, /<ProponerAlRecetario/);
});

test('TEST-REC-025 · Administración ve el autor, las parecidas y la cesión, y suma o no; el menú lleva a la consola', () => {
  assert.match(ADMIN, /apiAdministrativa\.propuestasAlRecetario\(token, \{ state: estado, limit: 50 \}\)/);
  assert.match(ADMIN, /apiAdministrativa\.decidirPropuesta\(sesion\.token, p\.proposalId/);
  assert.match(ADMIN, /C\.propuestaPor\(p\.proposedBy\.displayName\)/);
  assert.match(ADMIN, /data-parecidas/);
  assert.match(ADMIN, /C\.conCesion\(p\.photoAssignment\.textVersion/);
  assert.match(MENU, /href="\/admin\/recipes"/);
});

test('TEST-REC-026 · RP-19: lo que aparece (un error, lo copiado, lo decidido) va en un renglón que ya ocupa su lugar', () => {
  for (const [nombre, fuente] of Object.entries({ RECETARIO, CAJON, PROPONER, ADMIN })) assert.match(fuente, /recetario__lugar-del-aviso/, nombre);
  assert.match(ESTILOS, /\.recetario__lugar-del-aviso \{\n\s+min-height: 1\.5em;/);
  // El estado de la propuesta está siempre: proponer lo cambia sin agregar un renglón.
  assert.match(PROPONER, /data-estado-de-la-propuesta=\{ultima\?\.status \?\? 'NINGUNA'\}/);
});

test('TEST-REC-027 · las pantallas nuevas no dicen «cumplimiento», «adherencia», «racha», «puntaje», «asesorado» ni «estación»', () => {
  for (const [nombre, fuente] of Object.entries({ RECETARIO, CAJON, PROPONER, ADMIN })) {
    const textos = [...fuente.matchAll(/>([^<>{}]+)</g)].map((m) => m[1]).join(' ');
    assert.doesNotMatch(textos, /cumplimiento|adherencia|racha|puntaje|asesorad|estaci[oó]n/i, nombre);
    assert.doesNotMatch(textos, /\d\s?%/, `${nombre}: un «%» sin su base`);
  }
});
