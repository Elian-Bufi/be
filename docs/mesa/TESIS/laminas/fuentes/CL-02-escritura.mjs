// Diagrama de clases · nivel de implementación: las clases reales que participan cuando el profesional activa un plan
// nutricional (API-NUT-12), con sus dependencias por inyección (constructores) y la generalización que comparten todos
// los dominios de salud. Nombres y métodos tal como están en apps/api/src y packages/domain/src.
export const meta = {
  id: 'CL-02',
  titulo: 'Clases · Implementación de una escritura protegida',
  alcance: 'Nivel de implementación: las clases de la API que intervienen al activar un plan, con sus dependencias y su generalización.',
  fuente: 'apps/api/src (nutricion, plataforma, autorizacion, sesion, prisma) · packages/domain/src/autorizacion.ts',
  estado: 'implementado',
  ancho: 750,
  alto: 456,
};

export function dibujar(L) {
  const W4 = 165;
  const X4 = [10, 197, 384, 571];
  // Fila de servicios de plataforma (arriba): de ellos depende el esqueleto común.
  L.clase({ id: 'pri', x: X4[0], y: 8, w: W4, nombre: 'PrismaService', operaciones: ['$transaction()'] });
  L.clase({ id: 'ide', x: X4[1], y: 8, w: W4, nombre: 'IdempotenciaService', operaciones: ['ejecutar()'] });
  L.clase({ id: 'aud', x: X4[2], y: 8, w: W4, nombre: 'AuditoriaService', operaciones: ['registrar()'] });
  L.clase({ id: 'pdp', x: X4[3], y: 8, w: W4, nombre: 'PdpService', operaciones: ['decidirEnTransaccion()'] });
  // Fila del medio.
  L.clase({ id: 'ses', x: 10, y: 130, w: W4, nombre: 'SesionGuard', operaciones: ['canActivate()'] });
  L.clase({
    id: 'eje',
    x: 290,
    y: 130,
    w: 250,
    nombre: 'EjecutorDeDominio',
    estereotipo: 'abstract',
    abstracta: true,
    atributos: ['- alcance: Alcance'],
    operaciones: ['+ escribirIdempotente()', '+ escribir()', '+ leer()'],
    enfasis: true,
  });
  L.clase({ id: 'aut', x: X4[3], y: 130, w: W4, nombre: 'autorizacion.ts', estereotipo: 'utility', operaciones: ['evaluarAutorizacion()', 'modoDeAcceso()'] });
  // Fila de abajo: la cadena de la operación.
  L.clase({ id: 'ctl', x: 10, y: 315, w: 150, nombre: 'NutricionController', operaciones: ['activarPlan()'] });
  L.clase({ id: 'pla', x: 180, y: 315, w: 130, nombre: 'PlanesService', operaciones: ['crearBorrador()', 'validar()', 'activar()'] });
  L.clase({ id: 'ejn', x: 335, y: 315, w: 160, nombre: 'EjecutorNutricional', operaciones: ['constructor(…)'] });

  const n = (id) => L.nodos.get(id);
  const dep = (opciones) => L.conector({ estilo: 'discontinuo', fin: 'flecha', ...opciones });
  // La cadena: controlador → servicio → ejecutor del dominio.
  const yCtl = n('ctl').y + 28;
  dep({ de: 'ctl', lado: 'e', t: (yCtl - n('ctl').y) / n('ctl').h, a: 'pla', ladoA: 'o', tA: (yCtl - n('pla').y) / n('pla').h });
  dep({ de: 'pla', lado: 'e', t: (yCtl - n('pla').y) / n('pla').h, a: 'ejn', ladoA: 'o', tA: (yCtl - n('ejn').y) / n('ejn').h });
  dep({ de: 'ctl', lado: 'n', a: 'ses', ladoA: 's', t: 0.4, tA: 0.4 / (n('ses').w / n('ctl').w), etiqueta: { texto: ['@UseGuards'], lado: 'der', pos: 0.5 } });
  // Generalización: el ejecutor nutricional es un EjecutorDeDominio con Alcance NUTRICION.
  L.conector({ de: 'ejn', lado: 'n', a: 'eje', ladoA: 's', t: 0.5, tA: (n('ejn').x + n('ejn').w / 2 - n('eje').x) / n('eje').w, fin: 'triangulo' });
  // El esqueleto común depende de los cuatro servicios de plataforma (carriles a distinta altura para no superponerse).
  const sale = (t) => ({ de: 'eje', lado: 'n', t });
  dep({ ...sale(0.06), a: 'pri', ladoA: 's', tA: 0.7, medio: 112 });
  dep({ ...sale(0.18), a: 'ide', ladoA: 's', tA: 0.7, medio: 102 });
  dep({ ...sale(0.5), a: 'aud', ladoA: 's', tA: (n('eje').x + n('eje').w * 0.5 - n('aud').x) / n('aud').w });
  dep({ ...sale(0.94), a: 'pdp', ladoA: 's', tA: 0.25, medio: 108 });
  dep({ de: 'pdp', lado: 's', t: 0.72, a: 'aut', ladoA: 'n', tA: 0.72 });
  dep({ de: 'ses', lado: 'n', a: 'pri', ladoA: 's', t: 0.3, tA: 0.3 });

  L.nota({
    x: 520,
    y: 300,
    w: 222,
    titulo: 'Lo que no se dibuja',
    texto: 'Otras siete subclases de EjecutorDeDominio (CL-03). PlanesService también usa PdpService, CatalogoService, EvaluacionesService, ProcesoService, las plantillas y las novedades.',
  });
  L.leyenda({
    x: 10,
    y: 408,
    w: 500,
    titulo: null,
    columnas: 2,
    items: [
      { muestra: 'linea-discontinua:flecha', texto: 'dependencia (inyección)' },
      { muestra: 'linea:triangulo', texto: 'generalización' },
    ],
  });
}
