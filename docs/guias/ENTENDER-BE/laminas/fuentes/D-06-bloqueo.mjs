// Cuaderno de datos · parte 3: dos transacciones que se cruzan. El PDP toma la fila de verificación en modo compartido
// (FOR SHARE, en be_bloquear_lo_que_corta); la suspensión la pide en modo exclusivo (FOR NO KEY UPDATE) y espera hasta
// que el pedido en curso confirma. El pedido siguiente ya lee SUSPENDIDO. Fuentes: migración
// 20261003000000_pdp_bloqueos_en_una_llamada, apps/api/src/administracion/administracion.service.ts (leerYBloquear) y la
// prueba «el cruce» de test/integration/administracion.int-spec.ts.
export const meta = {
  id: 'D-06',
  titulo: 'Dos transacciones a la vez: una espera a la otra',
  alcance: 'La suspensión no corta un pedido a la mitad: espera que termine, y el siguiente ya ve el cambio.',
  fuente: 'migración 20261003000000_pdp_bloqueos_en_una_llamada · administracion.service.ts · administracion.int-spec.ts',
  estado: 'implementado',
  ancho: 750,
  alto: 286,
};

export function dibujar(L) {
  const P = [
    ['p1', 'Pedido 1', 'sistema', 'del profesional'],
    ['bd', 'PostgreSQL', 'sistema', 'fila de verificación'],
    ['adm', 'Suspensión', 'sistema', 'de Administración'],
    ['p2', 'Pedido 2', 'sistema', 'del profesional'],
  ];
  const centros = [80, 300, 520, 680];
  const hasta = 252;
  const x = {};
  P.forEach(([id, nombre, tipo, detalle], i) => {
    const n = L.lineaDeVida({ id, x: centros[i] - 60, y: 4, w: 120, h: 46, nombre, detalle, hasta, tipo });
    x[id] = n.cx;
  });
  L.activacion({ cx: x.p1, y1: 64, y2: 150 });
  L.activacion({ cx: x.adm, y1: 92, y2: 194 });
  L.activacion({ cx: x.p2, y1: 214, y2: 244 });

  const m = (de, a, y, texto, tipo = 'sinc') => L.mensaje({ x1: x[de] + (x[a] > x[de] ? 4 : -4), x2: x[a] + (x[a] > x[de] ? -4 : 4), y, texto, tipo });
  m('p1', 'bd', 74, 'BEGIN · la toma en modo compartido');
  m('adm', 'bd', 100, 'BEGIN · la pide en modo exclusivo');
  L.mensaje({ x1: x.adm + 4, x2: x.adm + 4, y: 106, texto: ['espera:', 'está tomada'] });
  m('p1', 'bd', 128, 'lee los hechos: permitida');
  m('p1', 'bd', 150, 'COMMIT: la suelta');
  m('bd', 'adm', 172, 'ahora es suya', 'retorno');
  m('adm', 'bd', 194, 'SUSPENDIDO · COMMIT');
  m('p2', 'bd', 222, 'BEGIN · la toma en modo compartido');
  m('bd', 'p2', 244, 'SUSPENDIDO: el PDP niega (404)', 'retorno');
  L.leyenda({
    x: 0,
    y: 262,
    w: 750,
    columnas: 3,
    titulo: null,
    items: [
      { muestra: 'linea:flecha_llena', texto: 'pedido a la base' },
      { muestra: 'linea-discontinua:flecha', texto: 'respuesta de la base' },
      { muestra: 'linea-de-vida', texto: 'transacción (la barra: mientras dura)' },
    ],
  });
}
