// Diagrama de secuencia (UML 2.5) de API-NUT-12, activar una versión de plan nutricional, tal como lo ejecuta la API:
// todo pasa en UNA transacción (la decisión del PDP, las escrituras, la novedad y la auditoría), y el aviso push sale
// después de confirmar, fuera de ella. Nombres de clases y métodos de apps/api/src.
export const meta = {
  id: 'E-01',
  titulo: 'Secuencia · activar un plan (API-NUT-12)',
  alcance: 'Las llamadas reales entre clases, con la idempotencia, la decisión del PDP y la auditoría en una transacción.',
  fuente: 'apps/api/src (nutricion/planes.service.ts, plataforma/ejecutor.ts e idempotencia.service.ts, autorizacion/pdp.service.ts, novedades)',
  estado: 'implementado',
  ancho: 750,
  alto: 456,
};

export function dibujar(L) {
  const P = [
    ['web', 'website', 'sistema', 'profesional'],
    ['pla', 'PlanesService'],
    ['eje', 'EjecutorNutricional'],
    ['ide', 'IdempotenciaService'],
    ['pdp', 'PdpService'],
    ['bd', 'PostgreSQL'],
    ['des', 'DespachadorDeAvisos'],
    ['exp', 'Expo Push', 'externo'],
  ];
  const paso = 93.6;
  const hasta = 420;
  const x = {};
  P.forEach(([id, nombre, tipo = 'sistema', detalle], i) => {
    const n = L.lineaDeVida({ id, x: 4 + i * paso, y: 4, w: 84, h: 40, nombre, detalle, hasta, tipo });
    x[id] = n.cx;
  });
  // Barras de ejecución de los participantes que trabajan a lo largo del pedido.
  L.activacion({ cx: x.pla, y1: 60, y2: 400 });
  L.activacion({ cx: x.eje, y1: 80, y2: 326 });
  L.activacion({ cx: x.ide, y1: 100, y2: 384 });
  L.activacion({ cx: x.pdp, y1: 194, y2: 236 });
  L.activacion({ cx: x.des, y1: 274, y2: 290 });
  L.activacion({ cx: x.des, y1: 404, y2: 418 });

  const m = (de, a, y, texto, tipo = 'sinc') => L.mensaje({ x1: x[de] + (x[a] > x[de] ? 4 : -4), x2: x[a] + (x[a] > x[de] ? -4 : 4), y, texto, tipo });
  m('web', 'pla', 62, 'POST /plans/{id}/activate');
  m('pla', 'eje', 82, 'escribirIdempotente()');
  m('eje', 'ide', 102, 'ejecutar(clave, fn)');
  m('ide', 'bd', 122, 'BEGIN; bloquea la clave');
  L.fragmento({ x: 96, y: 132, w: 562, h: 230, operador: 'alt', guardas: [{ texto: 'primera vez con esta clave', y: 132 }, { texto: 'reintento con la misma clave', y: 330, separador: true }] });
  m('ide', 'eje', 164, 'fn(tx)');
  m('eje', 'pla', 180, 'efecto(tx)');
  m('pla', 'pdp', 200, 'decidirEnTransaccion()');
  m('pdp', 'bd', 220, 'hechos; guarda la decisión');
  m('pdp', 'pla', 240, 'permitida', 'retorno');
  m('pla', 'bd', 260, 'instantánea, ACTIVADA, proceso, novedad');
  m('pla', 'des', 280, 'programar()', 'asinc');
  m('pla', 'eje', 300, 'resultado', 'retorno');
  m('eje', 'bd', 320, 'auditoría de éxito');
  m('ide', 'pdp', 356, 'reautorizar()');
  m('ide', 'bd', 380, 'guarda la respuesta; COMMIT');
  m('pla', 'web', 400, '200 · ACTIVATED', 'retorno');
  m('des', 'exp', 412, 'aviso sin datos', 'asinc');
  L.texto({ x: x.des - 8, y: 402, texto: '2 s después', ancla: 'end', estilo: L.TX.meta });

  L.leyenda({
    x: 0,
    y: 428,
    w: 750,
    columnas: 4,
    titulo: null,
    items: [
      { muestra: 'linea:flecha_llena', texto: 'llamada' },
      { muestra: 'linea-discontinua:flecha', texto: 'respuesta' },
      { muestra: 'linea:flecha', texto: 'asíncrono, después' },
      { muestra: 'fragmento', texto: 'alt: alternativas con su [guarda]' },
    ],
  });
}
