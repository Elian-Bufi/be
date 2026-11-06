// Guía central · nivel 4, recorrido 1 (escritura): registrar una comida desde la APK. Diagrama de secuencia (UML 2.5) con
// las clases reales. Fuentes: packages/domain/src/cliente-http.ts (registrarComida), apps/api/src/nutricion/
// registro-de-comidas.controller.ts y .service.ts (API-ING-02), apps/api/src/plataforma/ejecutor.ts e
// idempotencia.service.ts, apps/api/src/autorizacion/pdp.service.ts, migración 20260920100000_circuito_nutricional.
export const meta = {
  id: 'G-08',
  titulo: 'Secuencia · registrar una comida (API-ING-02)',
  alcance: 'De la pantalla de la APK a la fila en la base: sesión, forma, idempotencia, PDP, reglas y escritura, en una transacción.',
  fuente: 'apps/api/src/nutricion/registro-de-comidas.* · plataforma/ejecutor.ts · autorizacion/pdp.service.ts',
  estado: 'implementado',
  ancho: 750,
  alto: 452,
};

export function dibujar(L) {
  const P = [
    ['apk', 'APK', 'persona', 'registro de comidas'],
    ['ctl', 'RegistroDeComidasController'],
    ['srv', 'RegistroDeComidasService'],
    ['ide', 'IdempotenciaService', 'sistema', 'vía el ejecutor'],
    ['pdp', 'PdpService'],
    ['bd', 'PostgreSQL'],
  ];
  const centros = [60, 186, 320, 452, 574, 690];
  const hasta = 418;
  const x = {};
  P.forEach(([id, nombre, tipo = 'sistema', detalle], i) => {
    const n = L.lineaDeVida({ id, x: centros[i] - 54, y: 4, w: 108, h: 48, nombre, detalle, hasta, tipo: tipo === 'persona' ? 'sistema' : tipo });
    x[id] = n.cx;
  });
  L.activacion({ cx: x.ctl, y1: 76, y2: 406 });
  L.activacion({ cx: x.srv, y1: 98, y2: 388 });
  L.activacion({ cx: x.ide, y1: 120, y2: 380 });
  L.activacion({ cx: x.pdp, y1: 214, y2: 252 });

  const m = (de, a, y, texto, tipo = 'sinc') => L.mensaje({ x1: x[de] + (x[a] > x[de] ? 4 : -4), x2: x[a] + (x[a] > x[de] ? -4 : 4), y, texto, tipo });
  m('apk', 'ctl', 80, 'POST …/meal-records');
  m('ctl', 'srv', 100, 'registrar()');
  m('srv', 'ide', 122, 'ejecutar()');
  m('ide', 'bd', 142, 'BEGIN · bloqueo por la clave');
  L.fragmento({ x: 116, y: 152, w: 626, h: 220, operador: 'alt', guardas: [{ texto: 'primera vez con esta clave', y: 152 }, { texto: 'reintento con la misma clave', y: 342, separador: true }] });
  m('ide', 'srv', 182, 'efecto(tx)');
  m('srv', 'bd', 200, '¿plan ACTIVADA y propio?');
  m('srv', 'pdp', 218, 'decidir(NUTRICION)');
  m('pdp', 'bd', 240, ['hechos', 'y decisión']);
  m('pdp', 'srv', 256, 'permitida', 'retorno');
  L.mensaje({ x1: x.srv + 4, x2: x.srv + 4, y: 264, texto: ['reglas: vigente,', 'no futura,', 'opción e ítems'] });
  m('srv', 'bd', 330, ['INSERT ingesta + evento', 'IngestaRegistrada']);
  m('ide', 'bd', 366, ['misma respuesta,', 'sin repetir efectos']);
  m('ide', 'bd', 390, 'guarda la respuesta · COMMIT');
  m('ctl', 'apk', 406, '201 · registrada', 'retorno');

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
