// Guía central · nivel 4, recorrido 2: suspender Nutrición de un profesional desde Administración, y lo que pasa en su
// próximo pedido. Diagrama de secuencia con las clases reales. Fuentes: apps/api/src/administracion/
// administracion.controller.ts (API-ADM-13, con SesionAdministrativaGuard y SegundoFactorGuard),
// administracion.service.ts (decidir y aplicar), packages/domain/src/administracion.ts (evaluarDecision),
// apps/api/src/plataforma/idempotencia.service.ts, apps/api/src/autorizacion/pdp.service.ts y la migración
// 20260919200100_vinculo_consentimiento_y_pdp (las transiciones que acepta la base).
export const meta = {
  id: 'G-10',
  titulo: 'Secuencia · suspender un área (API-ADM-13) y el pedido siguiente',
  alcance: 'La decisión cambia una fila de verificación y deja su historia; el corte se nota en el pedido siguiente, sin cerrar la sesión.',
  fuente: 'apps/api/src/administracion · plataforma/idempotencia.service.ts · autorizacion/pdp.service.ts',
  estado: 'implementado',
  ancho: 750,
  alto: 452,
};

export function dibujar(L) {
  const P = [
    ['web', 'Website', 'sistema', '/admin y /pro'],
    ['ctl', 'AdministracionController', 'sistema', 'sesión y 2.º factor'],
    ['srv', 'AdministracionService'],
    ['ide', 'IdempotenciaService'],
    ['pdp', 'PdpService'],
    ['bd', 'PostgreSQL'],
  ];
  const centros = [60, 186, 320, 452, 574, 690];
  const hasta = 424;
  const x = {};
  P.forEach(([id, nombre, tipo = 'sistema', detalle], i) => {
    const n = L.lineaDeVida({ id, x: centros[i] - 54, y: 4, w: 108, h: 48, nombre, detalle, hasta, tipo });
    x[id] = n.cx;
  });
  L.activacion({ cx: x.ctl, y1: 72, y2: 310 });
  L.activacion({ cx: x.srv, y1: 92, y2: 296 });
  L.activacion({ cx: x.ide, y1: 110, y2: 292 });
  L.activacion({ cx: x.pdp, y1: 376, y2: 416 });

  const m = (de, a, y, texto, tipo = 'sinc') => L.mensaje({ x1: x[de] + (x[a] > x[de] ? 4 : -4), x2: x[a] + (x[a] > x[de] ? -4 : 4), y, texto, tipo });
  m('web', 'ctl', 76, 'POST …/decisions');
  m('ctl', 'srv', 94, 'decidir()');
  m('srv', 'ide', 112, 'ejecutar()');
  m('ide', 'bd', 130, 'BEGIN · bloqueo por la clave');
  m('ide', 'srv', 148, 'aplicar(tx)');
  m('srv', 'bd', 176, ['FOR NO KEY UPDATE:', 'verificación y habilitación']);
  L.mensaje({ x1: x.srv + 4, x2: x.srv + 4, y: 184, texto: ['versión (409) y', 'regla (422)'] });
  m('srv', 'bd', 242, ['verificación → SUSPENDIDO', '(el disparador valida)']);
  m('srv', 'bd', 272, ['evento, novedades', 'y auditoría']);
  m('ide', 'bd', 292, 'guarda la respuesta · COMMIT');
  m('ctl', 'web', 310, '200 · decidido', 'retorno');

  L.nota({ x: 4, y: 322, w: 742, texto: 'Más tarde: el profesional sigue con su sesión abierta y hace su próximo pedido sobre una persona de esa área.' });
  m('web', 'pdp', 378, 'GET … (profesional)');
  m('pdp', 'bd', 398, ['hechos: verificación', 'SUSPENDIDO']);
  m('pdp', 'web', 416, '404 RESOURCE_NOT_FOUND', 'retorno');

  L.leyenda({
    x: 0,
    y: 432,
    w: 750,
    columnas: 4,
    titulo: null,
    items: [
      { muestra: 'linea:flecha_llena', texto: 'llamada' },
      { muestra: 'linea-discontinua:flecha', texto: 'respuesta' },
      { muestra: 'nota', texto: 'nota: lo que pasa después' },
      { muestra: 'linea-de-vida', texto: 'participante' },
    ],
  });
}
