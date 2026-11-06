// Guía central · nivel 4, recorrido 1 (lectura): el profesional ve esa comida en «Analizar». Diagrama de secuencia con
// las clases reales. Fuentes: apps/api/src/analisis/analisis.controller.ts (API-PRJ-01), apps/api/src/autorizacion/
// pdp.guard.ts y pdp.service.ts (decidirPorAlcance), apps/api/src/analisis/fuentes.ts y lectura-proyecciones.ts,
// packages/domain/src (calculo-nutricional.ts, nutricion-del-analisis.ts, indicado-del-plan.ts).
export const meta = {
  id: 'G-09',
  titulo: 'Secuencia · ver lo registrado en «Analizar» (API-PRJ-01)',
  alcance: 'El permiso se decide antes del controlador; los números se calculan en cada lectura con la instantánea del plan.',
  fuente: 'apps/api/src/analisis · autorizacion/pdp.guard.ts · packages/domain/src',
  estado: 'implementado',
  ancho: 750,
  alto: 452,
};

export function dibujar(L) {
  const P = [
    ['web', 'Website', 'sistema', 'Analizar'],
    ['ctl', 'AnalisisController', 'sistema', 'con su PdpGuard'],
    ['pdp', 'PdpService'],
    ['fue', 'Fuentes', 'sistema', 'fuentes.ts'],
    ['dom', 'Dominio', 'sistema', 'packages/domain'],
    ['bd', 'PostgreSQL'],
  ];
  const centros = [60, 186, 320, 452, 574, 690];
  const hasta = 418;
  const x = {};
  P.forEach(([id, nombre, tipo = 'sistema', detalle], i) => {
    const n = L.lineaDeVida({ id, x: centros[i] - 54, y: 4, w: 108, h: 48, nombre, detalle, hasta, tipo });
    x[id] = n.cx;
  });
  L.activacion({ cx: x.ctl, y1: 76, y2: 372 });
  L.activacion({ cx: x.pdp, y1: 98, y2: 140 });
  L.activacion({ cx: x.fue, y1: 222, y2: 262 });
  L.activacion({ cx: x.dom, y1: 292, y2: 356 });

  const m = (de, a, y, texto, tipo = 'sinc') => L.mensaje({ x1: x[de] + (x[a] > x[de] ? 4 : -4), x2: x[a] + (x[a] > x[de] ? -4 : 4), y, texto, tipo });
  m('web', 'ctl', 80, 'GET …/projections/…');
  m('ctl', 'pdp', 100, 'decidirPorAlcance()');
  m('pdp', 'bd', 120, ['hechos de las tres áreas;', 'guarda cada decisión']);
  m('pdp', 'ctl', 140, 'Nutrición permitida', 'retorno');
  L.fragmento({ x: 116, y: 152, w: 626, h: 52, operador: 'alt', guardas: [{ texto: 'ninguna área permitida: 404 RESOURCE_NOT_FOUND, sin datos', y: 152 }, { texto: 'Nutrición permitida: sigue', y: 178, separador: true }] });
  m('ctl', 'fue', 224, 'leer el período');
  m('fue', 'bd', 244, ['registros, versiones activadas,', 'instantáneas y objetivos']);
  m('fue', 'ctl', 262, 'filas', 'retorno');
  m('ctl', 'dom', 296, ['calcularNutrientes', '(con la instantánea)']);
  m('ctl', 'dom', 332, ['indicadoDeLosDias,', 'serieNutricional']);
  m('dom', 'ctl', 354, 'tres capas', 'retorno');
  m('ctl', 'web', 372, '200 · result', 'retorno');
  L.mensaje({ x1: x.web + 4, x2: x.web + 4, y: 382, texto: ['dibuja: registrado,', 'objetivo, indicado'] });

  L.leyenda({
    x: 0,
    y: 426,
    w: 750,
    columnas: 4,
    titulo: null,
    items: [
      { muestra: 'linea:flecha_llena', texto: 'llamada' },
      { muestra: 'linea-discontinua:flecha', texto: 'respuesta' },
      { muestra: 'fragmento', texto: 'alt: alternativas con su [guarda]' },
      { muestra: 'linea-de-vida', texto: 'participante' },
    ],
  });
}
