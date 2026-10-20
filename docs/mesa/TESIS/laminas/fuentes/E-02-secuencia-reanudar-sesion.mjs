// Diagrama de secuencia (UML 2.5) de la reanudación de la sesión del website (DL-147): al cargar la página, el website
// pide un token nuevo de la MISMA sesión con la cookie HttpOnly de la API; el servidor decide y rota el secreto.
// Nombres de clases y métodos de apps/api/src/sesion y apps/web/src/lib/sesion.tsx.
export const meta = {
  id: 'E-02',
  titulo: 'Secuencia · recuperar la sesión del website (DL-147)',
  alcance: 'Qué pasa al recargar: la cookie de reanudación, la rotación del secreto y las respuestas posibles.',
  fuente: 'apps/api/src/sesion (sesiones.controller.ts, reanudacion.service.ts) · apps/web/src/lib/sesion.tsx',
  estado: 'implementado',
  ancho: 750,
  alto: 456,
};

export function dibujar(L) {
  const P = [
    ['web', 'website', 'sistema', 'pestaña del navegador'],
    ['ctl', 'SesionesController'],
    ['rea', 'ReanudacionService'],
    ['bd', 'PostgreSQL'],
  ];
  const hasta = 420;
  const x = {};
  P.forEach(([id, nombre, tipo = 'sistema', detalle], i) => {
    const n = L.lineaDeVida({ id, x: 6 + i * 152, y: 4, w: 120, h: 40, nombre, detalle, hasta, tipo });
    x[id] = n.cx;
  });
  L.activacion({ cx: x.web, y1: 54, y2: 416 });
  L.activacion({ cx: x.ctl, y1: 88, y2: 400 });
  L.activacion({ cx: x.rea, y1: 108, y2: 368 });

  const m = (de, a, y, texto, tipo = 'sinc') => L.mensaje({ x1: x[de] + (x[a] > x[de] ? 4 : -4), x2: x[a] + (x[a] > x[de] ? -4 : 4), y, texto, tipo });
  const propio = (de, y, texto) => L.mensaje({ x1: x[de] + 4, x2: x[de] + 4, y, texto });
  propio('web', 58, 'carga: «Recuperando tu sesión…»');
  m('web', 'ctl', 92, 'POST /auth/sessions/resume');
  m('ctl', 'rea', 112, 'reanudar(cookie, origen)');
  propio('rea', 120, 'superficie WEB y origen permitido');
  m('rea', 'bd', 156, 'BEGIN; huella del secreto; bloquea la sesión');
  L.fragmento({
    x: 30,
    y: 168,
    w: 570,
    h: 226,
    operador: 'alt',
    guardas: [
      { texto: 'es el secreto vigente', y: 168 },
      { texto: 'reemplazado hace menos de 2 minutos: otra pestaña', y: 252, separador: true },
      { texto: 'copia vieja, sesión vencida o cuenta que ya no opera', y: 318, separador: true },
    ],
  });
  m('rea', 'bd', 198, 'secreto nuevo que reemplaza; auditoría; COMMIT');
  m('rea', 'ctl', 220, 'la misma sesión + secreto nuevo', 'retorno');
  m('ctl', 'web', 242, '200: token + cookie nueva', 'retorno');
  m('rea', 'ctl', 286, 'la misma sesión, sin rotar', 'retorno');
  m('ctl', 'web', 306, '200: token', 'retorno');
  m('rea', 'bd', 346, 'revoca la sesión si es una copia', 'sinc');
  m('rea', 'ctl', 364, 'rechazada', 'retorno');
  m('ctl', 'web', 384, '401 y borra la cookie', 'retorno');
  propio('web', 398, 'guarda el token solo en memoria');

  L.nota({
    x: 612,
    y: 50,
    w: 132,
    titulo: 'La cookie',
    texto: 'De la API: HttpOnly, Secure, SameSite=None y Partitioned (CHIPS), solo para /auth/sessions. El JavaScript del website no la ve.',
  });
  L.nota({
    x: 612,
    y: 214,
    w: 132,
    titulo: 'Sin red',
    texto: 'Una falla de red o del servidor se reintenta dos veces; si no hay conexión, se vuelve a pedir al volver.',
  });

  L.leyenda({
    x: 0,
    y: 428,
    w: 750,
    columnas: 4,
    titulo: null,
    items: [
      { muestra: 'linea:flecha_llena', texto: 'llamada' },
      { muestra: 'linea-discontinua:flecha', texto: 'respuesta' },
      { muestra: 'linea-de-vida', texto: 'participante y su línea de vida' },
      { muestra: 'fragmento', texto: 'alt: alternativas con su [guarda]' },
    ],
  });
}
