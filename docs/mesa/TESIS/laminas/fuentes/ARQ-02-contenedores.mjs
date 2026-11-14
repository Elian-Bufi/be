// Lámina patrón de arquitectura: C4 nivel 2 (contenedores) de BE tal como está implementado en la versión de referencia.
// Fuentes: render.yaml (servicios, tarea programada, cabeceras), docs/DESPLIEGUE.md (flujo, avisos, Google, APK),
// apps/api/src (módulos), package.json de cada aplicación (versiones), prisma/schema.prisma (113 modelos).
// La entrega de avisos al teléfono (Expo → FCM → APK) y la obtención del token de Google por los clientes se dibujan en la
// lámina de despliegue (ARQ-03), para que esta vista conserve solo lo que BE invoca.
export const meta = {
  id: 'ARQ-02',
  titulo: 'Contenedores de BE (C4, nivel 2)',
  alcance: 'BE implementado en la versión de referencia: aplicaciones, API, base de datos, tarea programada y servicios externos que la API invoca en ejecución.',
  fuente: 'render.yaml · docs/DESPLIEGUE.md · apps/api/src · package.json',
  estado: 'implementado',
  ancho: 728,
  alto: 448,
};

export function dibujar(L) {
  // Grilla (pt): personas | carril de rótulos | límite de BE [clientes · carriles · API y base] | rótulos | externos.
  const P = { x: 4, w: 108 };
  const C1 = { x: 198, w: 124 };
  const C2 = { x: 404, w: 126 };
  const X = { x: 598, w: 126 };

  L.marco({ id: 'be', x: 182, y: 6, w: 364, h: 406, titulo: 'BE', subtitulo: 'Sistema de software' });

  const asesorado = L.persona({ id: 'asesorado', x: P.x, y: 34, w: P.w, titulo: 'Asesorado', descripcion: 'Persona con seguimiento profesional.' });
  const apk = L.caja({ id: 'apk', x: C1.x, y: 44, w: C1.w, titulo: 'APK', tecnologia: 'Android · Expo 57', descripcion: 'Plan del día, registro y evolución.' });
  const web = L.caja({ id: 'web', x: C1.x, y: 186, w: C1.w, titulo: 'Website', tecnologia: 'Next.js 15 · sitio estático', descripcion: 'Espacio profesional y cuenta.' });
  const profesional = L.persona({ id: 'profesional', x: P.x, y: 206, w: P.w, titulo: 'Profesional', descripcion: 'Nutrición, entrenamiento o antropometría.' });
  const cron = L.caja({ id: 'cron', x: C1.x, y: 318, w: C1.w, titulo: 'Recordatorios', tecnologia: 'Tarea programada', descripcion: 'A las 10, 15 y 22 h.' });

  const api = L.caja({
    id: 'api',
    x: C2.x,
    y: 64,
    w: C2.w,
    h: 220,
    enfasis: true,
    titulo: 'API de BE',
    tecnologia: 'NestJS 11 · Node 22',
    descripcion: 'Monolito modular REST /api/v1: aplica las reglas de cada área, autoriza cada operación, audita y evita duplicados.',
  });
  const db = L.cilindro({ id: 'db', x: C2.x, y: 320, w: C2.w, titulo: 'Base de datos', tecnologia: 'PostgreSQL 16', descripcion: '113 tablas con historia.' });

  // Externos alineados con el lado derecho de la API: cada relación es una recta.
  const yExpo = api.y + 36;
  const yGoogle = api.y + api.h / 2;
  const yCat = api.y + api.h - 38;
  const ext = (id, yc, props) => L.caja({ id, x: X.x, y: yc - L.altoDeCaja({ w: X.w, ...props }) / 2, w: X.w, tipo: 'externo', ...props });
  const expo = ext('expo', yExpo, { titulo: 'Expo Push', tecnologia: 'Servicio externo', descripcion: 'Avisos al teléfono.' });
  const google = ext('google', yGoogle, { titulo: 'Google', tecnologia: 'Servicio externo', descripcion: 'Identidad de Google.' });
  const cat = ext('cat', yCat, { titulo: 'Catálogos', tecnologia: 'Open Food Facts · wger', descripcion: 'Alimentos y ejercicios.' });
  void expo;
  void google;
  void cat;

  // Personas → aplicaciones.
  const yA = L.centro('apk') + 8;
  L.conector({ de: 'asesorado', lado: 'e', t: L.t('asesorado', yA), a: 'apk', ladoA: 'o', tA: L.t('apk', yA), etiqueta: { texto: ['Registra y', 'consulta'], tecnologia: 'Android', lado: 'arriba', pos: (147 - 112) / (198 - 112) } });
  const yW1 = web.y + 22;
  L.conector({ de: 'asesorado', lado: 'e', t: 0.84, a: 'web', ladoA: 'o', tA: L.t('web', yW1), via: [[150, asesorado.y + asesorado.h * 0.84], [150, yW1]], etiqueta: { texto: ['Gestiona', 'su cuenta'], tecnologia: 'navegador', segmento: 1, lado: 'izq', pos: 0.5 } });
  const yW2 = web.y + web.h - 16;
  L.conector({ de: 'profesional', lado: 'e', t: L.t('profesional', yW2), a: 'web', ladoA: 'o', tA: L.t('web', yW2), etiqueta: { texto: ['Evalúa,', 'planifica', 'y revisa'], tecnologia: 'navegador', lado: 'abajo', pos: (147 - 112) / (198 - 112) } });

  // Aplicaciones y tarea → API.
  const yAp = apk.y + apk.h - 22;
  L.conector({ de: 'apk', lado: 'e', t: L.t('apk', yAp), a: 'api', ladoA: 'o', tA: L.t('api', yAp), etiqueta: { texto: ['Lee y registra'], tecnologia: 'JSON/HTTPS', lado: 'arriba' } });
  const yWe = web.y + 30;
  L.conector({ de: 'web', lado: 'e', t: L.t('web', yWe), a: 'api', ladoA: 'o', tA: L.t('api', yWe), etiqueta: { texto: ['Lee y escribe'], tecnologia: 'JSON/HTTPS', lado: 'arriba' } });
  const yCr = L.centro('cron');
  const yCrApi = api.y + api.h - 18;
  L.conector({ de: 'cron', lado: 'e', t: 0.5, a: 'api', ladoA: 'o', tA: L.t('api', yCrApi), via: [[363, yCr], [363, yCrApi]], etiqueta: { texto: ['Pide la', 'corrida'], tecnologia: 'HTTPS', segmento: 1, lado: 'izq', pos: 0.62 } });

  // API → base y externos.
  L.conector({ de: 'api', lado: 's', t: 0.3, a: 'db', ladoA: 'n', tA: 0.3, etiqueta: { texto: ['Lee y escribe'], tecnologia: 'SQL · Prisma', lado: 'der' } });
  for (const [id, y, texto, tec] of [
    ['expo', yExpo, ['Envía', 'avisos'], 'HTTPS'],
    ['google', yGoogle, ['Verifica', 'tokens'], 'OIDC'],
    ['cat', yCat, ['Importa', 'datos'], 'HTTPS'],
  ])
    L.conector({ de: 'api', lado: 'e', t: L.t('api', y), a: id, ladoA: 'o', tA: L.t(id, y), etiqueta: { texto, tecnologia: tec, lado: 'arriba', pos: (572 - 530) / (598 - 530) } });

  L.leyenda({
    x: 4,
    y: 420,
    w: 720,
    titulo: null,
    columnas: 5,
    items: [
      { muestra: 'persona', texto: 'Persona' },
      { muestra: 'sistema', texto: 'Contenedor de BE' },
      { muestra: 'enfasis', texto: 'Contenedor central' },
      { muestra: 'externo', texto: 'Sistema externo' },
      { muestra: 'linea:flecha', texto: 'Relación [tecnología]' },
    ],
  });
}
