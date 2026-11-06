// Guía central · nivel 5: «versión» quiere decir dos cosas distintas en BE. La versión de un plan es un dato del
// negocio, que se congela al activar; la versión del software es un programa, y varias conviven a la vez. Fuentes:
// migración 20260920100000_circuito_nutricional (instantánea y disparadores), packages/domain/fixtures/
// lecturas-de-la-apk y test/integration/lecturas-de-las-apk.int-spec.ts (DL-152), apps/api/package.json (0.11.1),
// apps/mobile/app.config.ts (0.13.2 en main) y el tag de la candidata 0.18.0-candidata.1.
export const meta = {
  id: 'G-13',
  titulo: 'Dos clases de versión: la de un plan y la del software',
  alcance: 'Una se congela para conservar la historia; la otra convive con las anteriores sin romperlas.',
  fuente: 'prisma/migrations · packages/domain/fixtures/lecturas-de-la-apk · test/integration/lecturas-de-las-apk.int-spec.ts',
  estado: 'implementado',
  ancho: 750,
  alto: 318,
};

export function dibujar(L) {
  L.marco({ id: 'mp', x: 4, y: 4, w: 366, h: 286, titulo: 'Versiones de un plan', subtitulo: 'un dato del negocio' });
  L.redondeado({ id: 'cat', x: 18, y: 50, w: 338, h: 50, titulo: 'Catálogo de alimentos', detalle: 'El 25/10 se corrige la composición del arroz.', tipo: 'externo', radio: 6 });
  L.redondeado({ id: 'v1', x: 18, y: 130, w: 160, h: 64, titulo: 'Versión 1 · ACTIVADA', detalle: 'Activada el 20/10: su instantánea no cambia.', radio: 6 });
  L.redondeado({ id: 'v2', x: 196, y: 130, w: 160, h: 64, titulo: 'Versión 2 · ACTIVADA', detalle: 'Sucesora del 26/10: ya trae el arroz nuevo.', radio: 6 });
  L.conector({ de: 'cat', lado: 's', t: 0.75, a: 'v2', ladoA: 'n' });
  L.redondeado({ id: 'r1', x: 18, y: 222, w: 160, h: 56, titulo: 'Comidas del 22/10', detalle: 'Se calculan con la 1.', tipo: 'persona', radio: 6 });
  L.redondeado({ id: 'r2', x: 196, y: 222, w: 160, h: 56, titulo: 'Comidas del 27/10', detalle: 'Se calculan con la 2.', tipo: 'persona', radio: 6 });
  L.conector({ de: 'r1', lado: 'n', a: 'v1', ladoA: 's' });
  L.conector({ de: 'r2', lado: 'n', a: 'v2', ladoA: 's' });

  L.marco({ id: 'ms', x: 380, y: 4, w: 366, h: 286, titulo: 'Versiones del software', subtitulo: 'programas que conviven' });
  L.redondeado({ id: 'api', x: 394, y: 50, w: 338, h: 50, titulo: 'API 0.11.1 · commit e4512cb', detalle: 'Una sola en test; el website sale del mismo commit.', enfasis: true, radio: 6 });
  const apks = [
    ['a1', 'APK 0.13.2', 'estable'],
    ['a2', 'APK 0.17.0', 'candidata.3'],
    ['a3', 'APK 0.18.0', 'candidata.1'],
  ];
  apks.forEach(([id, titulo, detalle], i) => {
    L.redondeado({ id, x: 394 + i * 116, y: 130, w: 106, h: 50, titulo, detalle, radio: 6 });
    L.conector({ de: id, lado: 'n', a: 'api', ladoA: 's', tA: (i * 116 + 53) / 338, estilo: 'discontinuo' });
  });
  L.nota({ x: 394, y: 206, w: 338, texto: 'Lo que lee cada APK publicada quedó congelado en packages/domain/fixtures y se prueba contra la API de hoy (DL-152).' });

  L.leyenda({
    x: 0,
    y: 296,
    w: 750,
    columnas: 2,
    titulo: null,
    items: [
      { muestra: 'linea:flecha', texto: 'toma sus datos de' },
      { muestra: 'linea-discontinua:flecha', texto: 'le pide y lee con su propio esquema' },
    ],
  });
}
