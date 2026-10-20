// C4 nivel 1 (contexto): BE como un solo sistema, las personas que lo usan y los sistemas externos con los que se
// relaciona en la versión de referencia. Fuentes: docs/DESPLIEGUE.md (avisos por Expo y FCM, acceso con Google),
// apps/api/src/integraciones (Open Food Facts y wger), RF-058 (TVCC-30). La distribución de la APK y la
// infraestructura están en la vista de despliegue (ARQ-03).
export const meta = {
  id: 'ARQ-01',
  titulo: 'Contexto de BE (C4, nivel 1)',
  alcance: 'BE en su entorno: quién lo usa y con qué sistemas externos se comunica, en la versión de referencia.',
  fuente: 'docs/DESPLIEGUE.md · apps/api/src · RF-058',
  estado: 'implementado',
  ancho: 728,
  alto: 448,
};

export function dibujar(L) {
  const P = { x: 8, w: 138 };
  const X = { x: 590, w: 130 };
  L.persona({ id: 'ase', x: P.x, y: 22, w: P.w, titulo: 'Asesorado', descripcion: 'Sigue su plan, registra y ve su evolución.' });
  L.persona({ id: 'pro', x: P.x, y: 162, w: P.w, titulo: 'Profesional', descripcion: 'Nutrición, entrenamiento o antropometría.' });
  L.persona({ id: 'val', x: P.x, y: 302, w: P.w, titulo: 'Responsable de validación', descripcion: 'Mide la TVCC-30.' });
  const be = L.caja({
    id: 'be',
    x: 262,
    y: 140,
    w: 190,
    h: 140,
    enfasis: true,
    titulo: 'BE',
    tecnologia: 'Sistema de software',
    descripcion: 'Seguimiento profesional en nutrición, entrenamiento y antropometría, con los datos de salud protegidos.',
  });
  const ext = (id, y, props) => L.caja({ id, x: X.x, y, w: X.w, tipo: 'externo', ...props });
  ext('goo', 22, { titulo: 'Google', tecnologia: 'Identidad', descripcion: 'Cuenta de Google para entrar.' });
  ext('exp', 170, { titulo: 'Expo Push y FCM', tecnologia: 'Avisos', descripcion: 'Entregan el aviso al teléfono.' });
  ext('cat', 312, { titulo: 'Open Food Facts y wger', tecnologia: 'Catálogos abiertos', descripcion: 'Alimentos y ejercicios.' });
  L.caja({ id: 'adm', x: 285, y: 338, w: 144, tipo: 'pendiente', titulo: 'Administrador', tecnologia: 'Persona prevista', descripcion: 'Fuera de esta entrega.' });

  const n = (id) => L.nodos.get(id);
  const cy = (id) => n(id).y + n(id).h / 2;
  const t = (id, y) => (y - n(id).y) / n(id).h;
  const izquierda = 248; // calle vertical entre las personas y BE
  const derecha = 470; // calle vertical entre BE y los externos
  // Personas → BE (la calle de la izquierda deja lugar a los rótulos sobre el primer tramo).
  const entra = (id, yBe, texto, tec, lado = 'arriba') => {
    const ys = cy(id) + 6;
    L.conector({ de: id, lado: 'e', t: t(id, ys), a: 'be', ladoA: 'o', tA: t('be', yBe), via: Math.abs(ys - yBe) < 1 ? undefined : [[izquierda, ys], [izquierda, yBe]], etiqueta: { texto, tecnologia: tec, segmento: 0, lado, pos: 0.5 } });
  };
  entra('ase', be.y + 24, ['Registra y', 'consulta'], 'APK y navegador');
  entra('pro', cy('pro') + 6, ['Evalúa, planifica', 'y revisa'], 'navegador');
  entra('val', be.y + be.h - 20, ['Mide la', 'TVCC-30'], 'comando interno', 'abajo');
  // BE → externos (la calle de la derecha; el rótulo va en el último tramo).
  const sale = (id, yBe, texto, tec) => {
    const ye = cy(id);
    L.conector({ de: 'be', lado: 'e', t: t('be', yBe), a: id, ladoA: 'o', tA: t(id, ye), via: Math.abs(yBe - ye) < 1 ? undefined : [[derecha, yBe], [derecha, ye]], etiqueta: { texto, tecnologia: tec, segmento: Math.abs(yBe - ye) < 1 ? 0 : 2, lado: 'arriba', pos: 0.5 } });
  };
  sale('goo', be.y + 18, ['Verifica la', 'identidad'], 'OIDC');
  sale('exp', cy('exp'), ['Envía avisos', 'sin datos'], 'HTTPS');
  sale('cat', be.y + be.h - 18, ['Importa', 'datos'], 'HTTPS');
  // El administrador previsto.
  L.conector({ de: 'adm', lado: 'n', a: 'be', ladoA: 's', t: 0.5, tA: (n('adm').x + n('adm').w / 2 - be.x) / be.w, estilo: 'punteado', etiqueta: { texto: ['Verificaría', 'profesionales'], lado: 'der', pos: 0.5 } });

  L.leyenda({
    x: 8,
    y: 420,
    w: 712,
    titulo: null,
    columnas: 4,
    items: [
      { muestra: 'enfasis', texto: 'el sistema' },
      { muestra: 'persona', texto: 'persona' },
      { muestra: 'externo', texto: 'sistema externo' },
      { muestra: 'pendiente', texto: 'previsto, fuera de esta entrega' },
    ],
  });
}
