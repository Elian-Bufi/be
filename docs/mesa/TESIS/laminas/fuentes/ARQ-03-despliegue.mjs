// C4 · despliegue del ambiente test (el único desplegado). Fuentes: render.yaml (servicios, región, planes, tarea
// programada, cabeceras), docs/DESPLIEGUE.md (flujo de la CI, avisos por Expo y FCM, acceso con Google, APK publicada
// como release de GitHub) y .github/workflows/ci.yml.
export const meta = {
  id: 'ARQ-03',
  titulo: 'Despliegue del ambiente test (C4)',
  alcance: 'Dónde corre cada contenedor en la versión de referencia, cómo llega un cambio y por dónde viaja un aviso.',
  fuente: 'render.yaml · docs/DESPLIEGUE.md · .github/workflows/ci.yml',
  estado: 'implementado',
  ancho: 750,
  alto: 456,
};

export function dibujar(L) {
  const A = { x: 8, w: 130 }; // clientes y GitHub
  const R = { x: 200, w: 312 }; // Render
  const E = { x: 582, w: 160 }; // teléfono y externos
  // Izquierda: el navegador y GitHub.
  L.marco({ id: 'nav', x: A.x, y: 8, w: A.w, h: 100, titulo: 'Navegador' });
  L.caja({ id: 'sit', x: A.x + 10, y: 36, w: A.w - 20, h: 60, titulo: 'Website', tecnologia: 'JavaScript' });
  L.marco({ id: 'git', x: A.x, y: 128, w: A.w, h: 228, titulo: 'GitHub' });
  L.caja({ id: 'act', x: A.x + 10, y: 158, w: A.w - 20, h: 70, titulo: 'Actions', tecnologia: 'CI', descripcion: 'Pruebas e imagen.' });
  L.caja({ id: 'rel', x: A.x + 10, y: 268, w: A.w - 20, h: 76, titulo: 'Releases', tecnologia: 'Distribución', descripcion: 'La APK con su SHA-256.' });
  // Centro: Render.
  L.marco({ id: 'ren', x: R.x, y: 8, w: R.w, h: 348, titulo: 'Render · Frankfurt · test' });
  L.caja({ id: 'web', x: R.x + 12, y: 36, w: 130, h: 62, titulo: 'be-web', tecnologia: 'Sitio estático · CDN' });
  L.cilindro({ id: 'db', x: R.x + 12, y: 152, w: 130, titulo: 'be-db-test', tecnologia: 'PostgreSQL 16' });
  L.caja({ id: 'cro', x: R.x + 12, y: 270, w: 130, h: 70, titulo: 'be-recordatorios', tecnologia: 'Tarea programada', descripcion: '01, 13 y 18 UTC.' });
  L.caja({ id: 'api', x: R.x + 190, y: 36, w: 110, h: 308, enfasis: true, titulo: 'be-api', tecnologia: 'Docker · Node 22', descripcion: 'Migra al arrancar y espera /health/ready.' });
  // Derecha: el teléfono y los servicios externos.
  L.marco({ id: 'tel', x: E.x, y: 8, w: E.w, h: 100, titulo: 'Teléfono Android' });
  L.caja({ id: 'apk', x: E.x + 10, y: 36, w: E.w - 20, h: 60, titulo: 'APK', tecnologia: 'Expo SDK 57' });
  const ext = (id, y, props) => L.caja({ id, x: E.x, y, w: E.w, h: 52, tipo: 'externo', ...props });
  ext('fcm', 122, { titulo: 'Firebase (FCM)', tecnologia: 'entrega al teléfono' });
  ext('exp', 184, { titulo: 'Expo Push', tecnologia: 'servicio de avisos' });
  ext('goo', 246, { titulo: 'Google', tecnologia: 'claves públicas' });
  ext('cat', 306, { titulo: 'Open Food Facts · wger', tecnologia: 'catálogos' });

  const n = (id) => L.nodos.get(id);
  const cy = (id) => n(id).y + n(id).h / 2;
  const t = (id, y) => (y - n(id).y) / n(id).h;
  const recto = (de, a, y, opciones = {}) => {
    const ladoDe = n(de).x < n(a).x ? 'e' : 'o';
    return L.conector({ de, lado: ladoDe, t: t(de, y), a, ladoA: ladoDe === 'e' ? 'o' : 'e', tA: t(a, y), ...opciones });
  };
  // be-web sirve el sitio al navegador; el sitio y la APK hablan con la API.
  recto('web', 'sit', cy('sit'), { etiqueta: { texto: ['Sirve'], tecnologia: 'HTTPS', lado: 'arriba', pos: 0.5 } });
  const yPasillo = 118;
  L.conector({ de: 'sit', lado: 's', t: 0.5, a: 'api', ladoA: 'o', tA: t('api', yPasillo), via: [[A.x + A.w / 2, yPasillo]], etiqueta: { texto: ['JSON'], tecnologia: 'HTTPS · CORS', segmento: 1, lado: 'abajo', pos: 0.64 } });
  recto('apk', 'api', cy('apk'), { etiqueta: { texto: ['JSON'], tecnologia: 'HTTPS', lado: 'arriba', pos: 0.5 } });
  // Dentro de Render.
  recto('api', 'db', cy('db'), { etiqueta: { texto: ['SQL'], tecnologia: 'Prisma', lado: 'arriba', pos: 0.5 } });
  recto('cro', 'api', cy('cro'), { etiqueta: { texto: ['Corrida'], tecnologia: 'HTTPS', lado: 'arriba', pos: 0.5 } });
  // Avisos: la API los entrega a Expo, Expo a FCM y FCM al teléfono.
  recto('api', 'exp', cy('exp'), { etiqueta: { texto: ['Aviso'], tecnologia: 'HTTPS', lado: 'arriba', pos: 0.5 } });
  L.conector({ de: 'exp', lado: 'n', a: 'fcm', ladoA: 's' });
  L.conector({ de: 'fcm', lado: 'n', a: 'apk', ladoA: 's' });
  // Google y catálogos.
  recto('api', 'goo', cy('goo'), { etiqueta: { texto: ['Verifica'], tecnologia: 'JWKS', lado: 'arriba', pos: 0.5 } });
  recto('api', 'cat', cy('cat'), { etiqueta: { texto: ['Importa'], tecnologia: 'HTTPS', lado: 'arriba', pos: 0.5 } });
  // La CI despliega en Render cuando los controles pasan.
  L.conector({ de: 'act', lado: 'e', t: 0.5, a: 'ren', ladoA: 'o', tA: t('ren', cy('act')), etiqueta: { texto: ['Despliega'], lado: 'abajo', pos: 0.5 } });

  L.nota({
    x: R.x,
    y: 370,
    w: 542,
    titulo: null,
    texto: 'La APK se construye con EAS o con Gradle local y se publica como release de GitHub; la persona la instala desde ahí. Render despliega solo cuando la CI de main pasa (autoDeployTrigger: checksPass).',
  });
  L.leyenda({
    x: 8,
    y: 370,
    w: 180,
    titulo: null,
    columnas: 1,
    items: [
      { muestra: 'marco', texto: 'nodo' },
      { muestra: 'enfasis', texto: 'contenedor central' },
      { muestra: 'externo', texto: 'servicio externo' },
    ],
  });
}
