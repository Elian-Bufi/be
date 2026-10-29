// Componentes UML · el sistema: las tres aplicaciones, la tarea programada, el paquete de dominio compartido, la base y
// los servicios externos, con las interfaces que provee cada uno y quién las requiere. Rutas del repositorio:
// apps/web, apps/mobile, apps/api, packages/domain, prisma/; render.yaml para la tarea programada.
export const meta = {
  id: 'COMP-01',
  titulo: 'Componentes · El sistema y sus interfaces',
  alcance: 'Las piezas de software de BE, la interfaz que provee cada una y quién la requiere, con su ubicación en el repositorio.',
  fuente: 'apps/web · apps/mobile · apps/api · packages/domain · prisma/schema.prisma · render.yaml',
  estado: 'implementado',
  ancho: 728,
  alto: 448,
};

export function dibujar(L) {
  // Clientes a la izquierda.
  L.componente({ id: 'web', x: 10, y: 30, w: 170, nombre: 'Website', detalle: 'apps/web · Next.js 15, exportado como sitio estático' });
  L.componente({ id: 'apk', x: 10, y: 150, w: 170, nombre: 'APK', detalle: 'apps/mobile · Expo SDK 57 · React Native 0.86' });
  L.componente({ id: 'cro', x: 10, y: 270, w: 170, nombre: 'Recordatorios', detalle: 'tarea programada de render.yaml' });
  // La API en el centro.
  const api = L.componente({ id: 'api', x: 290, y: 60, w: 170, h: 250, nombre: 'API', detalle: 'apps/api · NestJS 11 · 22 módulos (COMP-02) · monolito modular', enfasis: true });
  const rest = L.interfaz({ id: 'rest', de: 'api', lado: 'o', t: 0.3, largo: 34, nombre: 'REST /api/v1', ladoRotulo: 'arriba' });
  const tareas = L.interfaz({ id: 'tar', de: 'api', lado: 'o', t: 0.86, largo: 34, nombre: 'tareas internas', ladoRotulo: 'abajo' });
  // Paquete de dominio debajo de la API.
  L.componente({ id: 'dom', x: 290, y: 350, w: 170, nombre: '@be/domain', estereotipo: 'library', detalle: 'packages/domain · reglas, contratos y textos' });
  // Base y servicios externos a la derecha, cada uno con la interfaz que provee.
  L.componente({ id: 'db', x: 560, y: 30, w: 158, nombre: 'Base de datos', estereotipo: 'database', detalle: 'PostgreSQL 16 · prisma/' });
  L.componente({ id: 'exp', x: 560, y: 130, w: 158, nombre: 'Expo Push', tipo: 'externo', detalle: 'avisos por FCM' });
  L.componente({ id: 'goo', x: 560, y: 220, w: 158, nombre: 'Google', tipo: 'externo', detalle: 'claves públicas (JWKS)' });
  L.componente({ id: 'cat', x: 560, y: 310, w: 158, nombre: 'Open Food Facts · wger', tipo: 'externo', detalle: 'API HTTP de catálogos' });
  const i = {
    db: L.interfaz({ id: 'i-db', de: 'db', lado: 'o', t: 0.5, largo: 30, nombre: 'SQL', ladoRotulo: 'arriba' }),
    exp: L.interfaz({ id: 'i-exp', de: 'exp', lado: 'o', t: 0.5, largo: 30, nombre: 'Push', ladoRotulo: 'arriba' }),
    goo: L.interfaz({ id: 'i-goo', de: 'goo', lado: 'o', t: 0.5, largo: 30, nombre: 'JWKS', ladoRotulo: 'arriba' }),
    cat: L.interfaz({ id: 'i-cat', de: 'cat', lado: 'o', t: 0.5, largo: 30, nombre: 'HTTP', ladoRotulo: 'arriba' }),
  };
  void i;

  const n = (id) => L.nodos.get(id);
  const cy = (id) => n(id).y + n(id).h / 2;
  const t = (id, y) => (y - n(id).y) / n(id).h;
  const usa = (opciones) => L.conector({ estilo: 'discontinuo', fin: 'flecha', ...opciones });
  // Los clientes requieren la interfaz REST; la tarea programada, la interfaz de tareas internas.
  const yRest = rest.y + rest.h / 2;
  usa({ de: 'web', lado: 'e', t: t('web', cy('web')), a: 'rest', ladoA: 'o', via: [[200, cy('web')], [200, yRest]] });
  usa({ de: 'apk', lado: 'e', t: t('apk', cy('apk')), a: 'rest', ladoA: 'o', via: [[200, cy('apk')], [200, yRest]] });
  const yTar = tareas.y + tareas.h / 2;
  usa({ de: 'cro', lado: 'e', t: t('cro', cy('cro')), a: 'tar', ladoA: 'o', via: [[200, cy('cro')], [200, yTar]] });
  // La API requiere las interfaces de la base y de los externos.
  for (const [id, ii] of [['db', 'i-db'], ['exp', 'i-exp'], ['goo', 'i-goo'], ['cat', 'i-cat']]) {
    const yI = n(ii).y + n(ii).h / 2;
    const yA = Math.max(api.y + 12, Math.min(api.y + api.h - 12, yI));
    usa({ de: 'api', lado: 'e', t: t('api', yA), a: ii, ladoA: 'o', via: Math.abs(yA - yI) < 1 ? undefined : [[505, yA], [505, yI]] });
    void id;
  }
  // La API usa el paquete de dominio.
  usa({ de: 'api', lado: 's', a: 'dom', ladoA: 'n' });

  L.nota({
    x: 10,
    y: 370,
    w: 250,
    titulo: null,
    texto: 'El website y la APK también importan @be/domain: los contratos y los textos son los mismos en las tres superficies.',
  });
  L.leyenda({
    x: 490,
    y: 400,
    w: 228,
    titulo: null,
    columnas: 1,
    items: [
      { muestra: 'interfaz', texto: 'interfaz provista' },
      { muestra: 'linea-discontinua:flecha', texto: 'la requiere' },
    ],
  });
}
