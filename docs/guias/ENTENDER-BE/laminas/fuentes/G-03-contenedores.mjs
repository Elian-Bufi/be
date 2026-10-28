// Guía central · nivel 2: los contenedores de BE (C4, nivel 2) en el commit de referencia. Adaptada de ARQ-02 de la tesis
// (84442b6, del 2026-10-20), con lo que cambió después: Administración (website /admin, con segundo factor) y el operador
// que incorpora administradores por comando en el Shell de be-api. Fuentes: render.yaml (servicios, cron, buildFilter),
// apps/api/src (módulos; medios en PostgreSQL; Expo Push; Google por JWKS; Open Food Facts y wger a pedido),
// apps/api/Dockerfile y scripts/iniciar.sh (migraciones al arrancar), prisma/schema.prisma (118 modelos).
export const meta = {
  id: 'G-03',
  titulo: 'Las piezas de BE (contenedores, C4 nivel 2)',
  alcance: 'Aplicaciones, API, base de datos, tarea programada y servicios externos que la API invoca, en el commit de referencia.',
  fuente: 'render.yaml · apps/api/src · apps/api/Dockerfile · prisma/schema.prisma',
  estado: 'implementado',
  ancho: 750,
  alto: 452,
};

export function dibujar(L) {
  const P = { x: 4, w: 108 };
  const C1 = { x: 198, w: 128 };
  const C2 = { x: 404, w: 128 };
  const X = { x: 610, w: 136 };

  L.marco({ id: 'be', x: 182, y: 6, w: 366, h: 440, titulo: 'BE', subtitulo: 'Sistema de software' });

  L.persona({ id: 'asesorado', x: P.x, y: 26, w: P.w, titulo: 'Asesorado', descripcion: 'Persona con seguimiento profesional.' });
  L.persona({ id: 'profesional', x: P.x, y: 172, w: P.w, titulo: 'Profesional', descripcion: 'Nutrición, entrenamiento o antropometría.' });
  L.persona({ id: 'admin', x: P.x, y: 318, w: P.w, titulo: 'Administración', descripcion: 'Verifica y suspende por área, con segundo factor.' });

  const apk = L.caja({ id: 'apk', x: C1.x, y: 40, w: C1.w, titulo: 'APK', tecnologia: 'Android · Expo 57', descripcion: 'Plan del día, registro y evolución.' });
  const web = L.caja({ id: 'web', x: C1.x, y: 176, w: C1.w, titulo: 'Website', tecnologia: 'Next.js 15 · estático', descripcion: '/pro para profesionales y /admin para Administración.' });
  const cron = L.caja({ id: 'cron', x: C1.x, y: 340, w: C1.w, titulo: 'Recordatorios', tecnologia: 'Tarea programada', descripcion: 'A las 10, 15 y 22 h (Argentina).' });

  const api = L.caja({
    id: 'api',
    x: C2.x,
    y: 52,
    w: C2.w,
    h: 236,
    enfasis: true,
    titulo: 'API de BE',
    tecnologia: 'NestJS 11 · Node 22',
    descripcion: 'Monolito modular REST /api/v1: valida, decide el acceso (PDP), aplica las reglas, audita y evita duplicados.',
  });
  L.cilindro({ id: 'db', x: C2.x, y: 330, w: C2.w, titulo: 'Base de datos', tecnologia: 'PostgreSQL 16', descripcion: '118 tablas con historia; también las fotos.' });

  const ext = (id, yc, props) => L.caja({ id, x: X.x, y: yc - L.altoDeCaja({ w: X.w, ...props }) / 2, w: X.w, tipo: 'externo', ...props });
  const yExpo = api.y + 34;
  const yGoogle = api.y + api.h / 2;
  const yCat = api.y + api.h - 36;
  ext('expo', yExpo, { titulo: 'Expo Push', tecnologia: 'Servicio externo', descripcion: 'Avisos al teléfono, por FCM.' });
  ext('google', yGoogle, { titulo: 'Google', tecnologia: 'Servicio externo', descripcion: 'Claves para verificar el inicio con Google.' });
  ext('cat', yCat, { titulo: 'Catálogos', tecnologia: 'Open Food Facts · wger', descripcion: 'Importación a pedido de un profesional.' });
  L.caja({ id: 'shell', x: X.x, y: 360, w: X.w, tipo: 'externo', titulo: 'Shell de be-api', tecnologia: 'Render', descripcion: 'El operador incorpora administradores por comando.' });

  // Personas → aplicaciones.
  const yA = L.centro('apk');
  L.conector({ de: 'asesorado', lado: 'e', t: L.t('asesorado', yA), a: 'apk', ladoA: 'o', tA: L.t('apk', yA), etiqueta: { texto: ['Registra'], tecnologia: 'Android', lado: 'arriba', pos: 0.45 } });
  const yW = web.y + 30;
  L.conector({ de: 'profesional', lado: 'e', t: L.t('profesional', yW), a: 'web', ladoA: 'o', tA: L.t('web', yW), etiqueta: { texto: ['Evalúa y', 'planifica'], tecnologia: 'navegador', lado: 'arriba', pos: 0.45 } });
  const yAd = web.y + web.h - 14;
  L.conector({ de: 'admin', lado: 'e', t: 0.3, a: 'web', ladoA: 'o', tA: L.t('web', yAd), via: [[150, L.nodos.get('admin').y + L.nodos.get('admin').h * 0.3], [150, yAd]] });

  // Aplicaciones y tarea → API.
  const yAp = apk.y + apk.h - 18;
  L.conector({ de: 'apk', lado: 'e', t: L.t('apk', yAp), a: 'api', ladoA: 'o', tA: L.t('api', yAp), etiqueta: { texto: ['JSON'], tecnologia: 'HTTPS', lado: 'arriba' } });
  const yWe = web.y + 34;
  L.conector({ de: 'web', lado: 'e', t: L.t('web', yWe), a: 'api', ladoA: 'o', tA: L.t('api', yWe), etiqueta: { texto: ['JSON'], tecnologia: 'HTTPS · CORS', lado: 'arriba' } });
  const yCrApi = api.y + api.h - 16;
  L.conector({ de: 'cron', lado: 'e', t: 0.4, a: 'api', ladoA: 'o', tA: L.t('api', yCrApi), via: [[366, cron.y + cron.h * 0.4], [366, yCrApi]], etiqueta: { texto: ['Pide la', 'corrida'], tecnologia: 'secreto', segmento: 1, lado: 'izq', pos: 0.55 } });

  // API → base y externos.
  L.conector({ de: 'api', lado: 's', t: 0.3, a: 'db', ladoA: 'n', tA: 0.3, etiqueta: { texto: ['SQL'], tecnologia: 'Prisma', lado: 'der' } });
  for (const [id, y, texto, tec] of [
    ['expo', yExpo, ['Avisos'], 'HTTPS'],
    ['google', yGoogle, ['Claves'], 'JWKS'],
    ['cat', yCat, ['Importa'], 'HTTPS'],
  ])
    L.conector({ de: 'api', lado: 'e', t: L.t('api', y), a: id, ladoA: 'o', tA: L.t(id, y), etiqueta: { texto, tecnologia: tec, lado: 'arriba', pos: 0.5 } });
  L.conector({ de: 'shell', lado: 'o', t: 0.5, a: 'db', ladoA: 'e', tA: 0.62, estilo: 'discontinuo' });
}
