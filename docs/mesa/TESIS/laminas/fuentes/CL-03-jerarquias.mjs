// Diagrama de clases · nivel de implementación: las jerarquías reales del código de la API. El esqueleto común de los
// dominios (EjecutorDeDominio) y sus ocho subclases; los guardas que implementan CanActivate de NestJS; PrismaService
// sobre el cliente de Prisma; los errores propios sobre Error. Sale de los «extends» e «implements» de apps/api/src.
export const meta = {
  id: 'CL-03',
  titulo: 'Clases · Jerarquías de la API',
  alcance: 'Nivel de implementación: generalizaciones y realizaciones que existen en el código de la API.',
  fuente: 'apps/api/src (plataforma/ejecutor.ts y las subclases de cada dominio, sesion, autorizacion, prisma, http/errores.ts)',
  estado: 'implementado',
  ancho: 750,
  alto: 456,
};

export function dibujar(L) {
  // Arriba a la izquierda: los guardas realizan la interfaz de NestJS.
  L.clase({ id: 'can', x: 95, y: 8, w: 170, nombre: 'CanActivate', estereotipo: 'interface (NestJS)', tipo: 'externo', operaciones: ['canActivate()'] });
  L.clase({ id: 'ses', x: 10, y: 120, w: 160, nombre: 'SesionGuard', operaciones: ['canActivate()'] });
  L.clase({ id: 'pdg', x: 190, y: 120, w: 160, nombre: 'PdpGuard', operaciones: ['canActivate()'] });
  const n = (id) => L.nodos.get(id);
  const can = n('can');
  const xCan = can.x + can.w / 2;
  for (const [i, id] of ['ses', 'pdg'].entries()) {
    const g = n(id);
    L.conector({ de: id, lado: 'n', a: 'can', ladoA: 's', tA: 0.5, estilo: 'discontinuo', fin: i === 0 ? 'triangulo' : null, via: [[g.x + g.w / 2, 100], [xCan, 100]] });
  }
  // Arriba a la derecha: PrismaService extiende el cliente de Prisma; los errores propios extienden Error.
  L.clase({ id: 'pcl', x: 400, y: 8, w: 150, nombre: 'PrismaClient', estereotipo: 'biblioteca', tipo: 'externo' });
  L.clase({ id: 'psv', x: 400, y: 120, w: 150, nombre: 'PrismaService', operaciones: ['onModuleDestroy()'] });
  L.conector({ de: 'psv', lado: 'n', a: 'pcl', ladoA: 's', fin: 'triangulo' });
  L.clase({ id: 'err', x: 580, y: 8, w: 160, nombre: 'Error', estereotipo: 'JavaScript', tipo: 'externo' });
  L.clase({ id: 'eap', x: 580, y: 82, w: 160, nombre: 'ErrorDeApi', atributos: ['status, code', 'mensajeSeguro'] });
  L.clase({ id: 'den', x: 580, y: 175, w: 160, nombre: 'DenegacionDelPdp', atributos: ['decision'] });
  L.conector({ de: 'eap', lado: 'n', a: 'err', ladoA: 's', fin: 'triangulo' });
  L.conector({ de: 'den', lado: 'n', a: 'eap', ladoA: 's', fin: 'triangulo' });

  // Abajo: el esqueleto común de los dominios y sus ocho subclases, en dos columnas que llegan a un mismo triángulo.
  const abs = L.clase({
    id: 'abs',
    x: 290,
    y: 268,
    w: 170,
    nombre: 'EjecutorDeDominio',
    estereotipo: 'abstract',
    abstracta: true,
    atributos: ['- alcance: Alcance'],
    operaciones: ['+ escribirIdempotente()', '+ escribir()', '+ leer()'],
    enfasis: true,
  });
  const izquierda = ['EjecutorNutricional', 'EjecutorDeEntrenamiento', 'EjecutorAntropometrico', 'EjecutorDeFormularios'];
  const derecha = ['EjecutorDeCoordinacion', 'EjecutorDeVistas', 'EjecutorDeMedios', 'EjecutorDePerfilPropio'];
  const yCentro = abs.y + abs.h / 2;
  const columna = (nombres, x, lado, xBus) => {
    nombres.forEach((nombre, i) => {
      const id = `${lado}-${i}`;
      const c = L.clase({ id, x, y: 236 + i * 44, w: 205, nombre });
      L.conector({ de: id, lado: lado === 'izq' ? 'e' : 'o', a: 'abs', ladoA: lado === 'izq' ? 'o' : 'e', tA: 0.5, fin: i === 0 ? 'triangulo' : null, via: [[xBus, c.y + c.h / 2], [xBus, yCentro]] });
    });
  };
  columna(izquierda, 10, 'izq', 255);
  columna(derecha, 535, 'der', 495);

  L.leyenda({
    x: 10,
    y: 418,
    w: 730,
    titulo: null,
    columnas: 3,
    items: [
      { muestra: 'linea:triangulo', texto: 'generalización (extends)' },
      { muestra: 'linea-discontinua:triangulo', texto: 'realización (implements)' },
      { muestra: 'externo', texto: 'clase de una biblioteca' },
    ],
  });
}
