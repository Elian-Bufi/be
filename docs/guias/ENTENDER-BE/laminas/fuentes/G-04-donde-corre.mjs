// Guía central · nivel 2: qué corre en el teléfono, qué en el navegador y qué en el servidor, y cómo viajan los datos.
// Fuentes: apps/mobile (Expo, SecureStore), apps/web (export estático, CORS), apps/api/Dockerfile y scripts/iniciar.sh,
// render.yaml (be-api, be-web, be-recordatorios, be-db-test), packages/domain (lo compartido).
export const meta = {
  id: 'G-04',
  titulo: 'Qué corre dónde',
  alcance: 'Tres lugares distintos: el teléfono de la persona, el navegador del profesional y los servidores de Render.',
  fuente: 'apps/mobile · apps/web · apps/api/Dockerfile · render.yaml · packages/domain',
  estado: 'implementado',
  ancho: 750,
  alto: 336,
};

export function dibujar(L) {
  const wCab = 108;
  const x0 = 4;
  const wTotal = 742;
  L.carril({ id: 'tel', x: x0, y: 4, w: wTotal, h: 96, titulo: 'Teléfono', subtitulo: 'Android de la persona', wCabecera: wCab });
  L.carril({ id: 'nav', x: x0, y: 106, w: wTotal, h: 96, titulo: 'Navegador', subtitulo: 'del profesional o de Administración', wCabecera: wCab });
  L.carril({ id: 'srv', x: x0, y: 208, w: wTotal, h: 124, titulo: 'Servidores', subtitulo: 'Render, Frankfurt', wCabecera: wCab });

  const xa = x0 + wCab + 14; // 126
  // Teléfono: la APK queda arriba de la API, así su flecha baja derecho.
  L.caja({ id: 'apk', x: xa + 212, y: 16, w: 196, titulo: 'APK', tecnologia: 'React Native · Hermes', descripcion: 'Pantallas; la sesión queda guardada en el teléfono.' });
  L.caja({ id: 'domA', x: xa + 440, y: 22, w: 170, tipo: 'externo', titulo: 'Dominio compartido', descripcion: 'Una copia compilada dentro de la app.' });
  // Navegador.
  L.caja({ id: 'web', x: xa, y: 118, w: 196, titulo: 'Website', tecnologia: 'HTML, CSS y JS estáticos', descripcion: 'No tiene servidor propio: pide todo a la API.' });
  L.caja({ id: 'domW', x: xa + 440, y: 124, w: 170, tipo: 'externo', titulo: 'Dominio compartido', descripcion: 'Otra copia, en el navegador.' });
  // Servidores.
  L.cilindro({ id: 'db', x: xa, y: 224, w: 140, titulo: 'be-db-test', tecnologia: 'PostgreSQL 16', descripcion: 'Sin acceso desde internet: solo la API, por la red interna.' });
  L.caja({ id: 'api', x: xa + 212, y: 220, w: 196, enfasis: true, titulo: 'be-api', tecnologia: 'contenedor Docker', descripcion: 'NestJS, Prisma y el mismo dominio. Al arrancar aplica las migraciones.' });
  L.caja({ id: 'cron', x: xa + 470, y: 232, w: 140, titulo: 'be-recordatorios', tecnologia: 'cron', descripcion: 'Tres veces al día llama a la API con un secreto.' });

  // Lo que viaja: siempre JSON por HTTPS hacia la API; la API habla con la base por la red interna de Render.
  L.conector({ de: 'apk', lado: 's', t: 0.5, a: 'api', ladoA: 'n', tA: 0.5 });
  L.pastilla({ cx: xa + 310, cy: 160, texto: 'JSON por HTTPS' });
  L.conector({ de: 'web', lado: 's', t: 0.8, a: 'api', ladoA: 'n', tA: 0.15, medio: 210 });
  L.conector({ de: 'api', lado: 'o', t: 0.5, a: 'db', ladoA: 'e', tA: 0.5 });
  L.conector({ de: 'cron', lado: 'o', t: 0.5, a: 'api', ladoA: 'e', tA: 0.5, estilo: 'discontinuo' });
}
