/**
 * Las capas de la figura de zonas del website (WP-CATALOGO-VISUAL, etapa 2): achica el set de Dirección
 * («BE-TRAIN · set de capas musculares», modelo masculino, v1 del 2026-08-13) a lo que el website necesita.
 *
 * - **El mismo recorte para todo:** la caja de los dos cuerpos en la grilla de 1024 × 1536 (x 283-740, y 36-1443), con
 *   margen, llevada a 320 × 944. Cuerpo y máscaras siguen superpuestos sin reposicionar.
 * - **Cuerpos en WebP** (el de frente pesaba 2,1 MB; queda en ~65 KB) y **máscaras en PNG con paleta**, blancas con su
 *   alfa: el color lo pone el CSS con `mask-image`, como pide el LEEME del set. Ninguna capa se guarda coloreada.
 * - Los nombres son los del set: `be-body-m-{front|back}` y `be-mask-m-{front|back}-{zona}`. La zona es la del dominio
 *   (`ZONAS_MUSCULARES`); `scripts/figura-de-zonas.test.cjs` comprueba que no sobre ni falte ninguna.
 *
 * Uso (con `sharp`, que ya trae el árbol de dependencias del repositorio; no instala nada):
 *   node EVIDENCIA/CATALOGO-VISUAL/herramientas/figura-del-website.cjs <carpeta del set> apps/web/public/zonas
 * donde <carpeta del set> tiene `BE-TRAIN-masculino-frontal-v1/BE-TRAIN-masculino-frontal-v1/` y la posterior.
 */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const [origen, destino] = process.argv.slice(2);
if (!origen || !destino) {
  console.error('Uso: node figura-del-website.cjs <carpeta del set> <carpeta de destino>');
  process.exit(2);
}
const RECORTE = { left: 268, top: 22, width: 488, height: 1440 };
const ANCHO = 320;
const ALTO = 944;
const sets = ['BE-TRAIN-masculino-frontal-v1', 'BE-TRAIN-masculino-posterior-v1'].map((s) => path.join(origen, s, s));

(async () => {
  sharp.concurrency(1);
  sharp.cache(false);
  fs.mkdirSync(destino, { recursive: true });
  for (const set of sets) {
    for (const archivo of fs.readdirSync(path.join(set, 'bodies'))) {
      const salida = path.join(destino, archivo.replace(/\.png$/, '.webp'));
      await sharp(path.join(set, 'bodies', archivo)).extract(RECORTE).resize(ANCHO, ALTO).webp({ quality: 82, alphaQuality: 90, effort: 6 }).toFile(salida);
      console.log(path.basename(salida), fs.statSync(salida).size);
    }
    for (const archivo of fs.readdirSync(path.join(set, 'masks'))) {
      const salida = path.join(destino, archivo);
      // Solo importa el alfa: blanco con el alfa de la capa, en paleta.
      const alfa = await sharp(path.join(set, 'masks', archivo)).extract(RECORTE).resize(ANCHO, ALTO).extractChannel(3).toBuffer();
      await sharp({ create: { width: ANCHO, height: ALTO, channels: 3, background: '#ffffff' } }).joinChannel(alfa).png({ palette: true, colors: 64, compressionLevel: 9, effort: 10 }).toFile(salida);
      console.log(path.basename(salida), fs.statSync(salida).size);
    }
  }
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
