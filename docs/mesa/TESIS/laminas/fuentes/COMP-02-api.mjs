// Componentes UML · la API por dentro: los 22 módulos de NestJS agrupados por responsabilidad, las familias de operaciones
// que expone cada uno y sus dependencias entre módulos (los «imports» de cada *.module.ts). Datos:
// datos/modulos-api.json (herramientas/leer-modulos-api.mjs, que lee apps/api/src).
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const datos = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../../datos/modulos-api.json'), 'utf8')).carpetas.filter((m) => m.modulo);
const familias = (modulo) => {
  const m = datos.find((x) => x.modulo === modulo);
  if (!m) throw new Error(`no existe ${modulo}`);
  const f = [...new Set(m.controladores.flatMap((c) => c.operaciones.map((o) => o.replace(/^API-/, '').replace(/-.*$/, ''))))];
  return f.length ? f.join(' · ') : 'sin rutas propias';
};

export const meta = {
  id: 'COMP-02',
  titulo: 'Componentes · Los módulos de la API',
  alcance: 'Los 22 módulos de NestJS agrupados por responsabilidad, las familias de operaciones que expone cada uno y sus dependencias.',
  fuente: 'apps/api/src/*/*.module.ts · datos/modulos-api.json',
  estado: 'implementado',
  ancho: 750,
  alto: 456,
};

export function dibujar(L) {
  const caja = (id, modulo, x, y, w = 112, detalle) => L.componente({ id, x, y, w, h: 50, nombre: modulo.replace('Module', ''), estereotipo: null, detalle: detalle ?? familias(modulo) });
  // Comunes: los cinco globales, disponibles para todos sin importarlos, y el de salud del servicio.
  L.paquete({ id: 'p-com', x: 8, y: 8, w: 734, h: 82, titulo: 'Comunes (cinco globales y Health)' });
  const com = [
    ['PrismaModule', 'acceso a la base'],
    ['PlataformaModule', 'auditoría e idempotencia'],
    ['AutorizacionModule', 'PDP'],
    ['ProcesoModule', 'proceso y revisiones'],
    ['NovedadesModule'],
    ['HealthModule', '/health/ready'],
  ];
  com.forEach(([m, d], i) => caja(`c${i}`, m, 18 + i * 120, 32, 112, d));
  // Acceso, vínculo y seguimiento.
  L.paquete({ id: 'p-acc', x: 8, y: 102, w: 250, h: 138, titulo: 'Acceso' });
  caja('ses', 'SesionModule', 18, 126);
  caja('ide', 'IdentidadModule', 136, 126);
  caja('goo', 'AccesoGoogleModule', 18, 184);
  caja('pro', 'ProfesionalModule', 136, 184, 112, 'habilitación (DL-036)');
  L.paquete({ id: 'p-vin', x: 270, y: 102, w: 132, h: 138, titulo: 'Vínculo' });
  caja('vin', 'VinculoModule', 278, 126, 118);
  caja('con', 'ConsentimientoModule', 278, 184, 118);
  L.paquete({ id: 'p-seg', x: 414, y: 102, w: 328, h: 138, titulo: 'Seguimiento' });
  caja('car', 'CarteraModule', 424, 126, 150);
  caja('das', 'DashboardModule', 582, 126, 150);
  caja('ana', 'AnalisisModule', 424, 184, 150);
  caja('crd', 'CoordinacionModule', 582, 184, 150);
  // Dominios de salud.
  L.paquete({ id: 'p-dom', x: 8, y: 270, w: 734, h: 128, titulo: 'Dominios de salud y apoyo' });
  caja('med', 'MediosModule', 18, 312);
  caja('nut', 'NutricionModule', 138, 312, 150);
  caja('ent', 'EntrenamientoModule', 300, 312, 170);
  caja('int', 'IntegracionesModule', 482, 312, 112, 'Open Food Facts, wger');
  caja('ant', 'AntropometriaModule', 604, 294, 128);
  caja('frm', 'FormulariosModule', 604, 346, 128);

  const n = (id) => L.nodos.get(id);
  const dep = (o) => L.conector({ estilo: 'discontinuo', fin: 'flecha', ...o });
  // Dependencias entre módulos («imports» de cada *.module.ts), sin las de SesionModule (casi todos la importan).
  dep({ de: 'ide', lado: 'e', t: 0.5, a: 'vin', ladoA: 'o', tA: 0.5 });
  dep({ de: 'goo', lado: 'n', t: 0.8, a: 'ide', ladoA: 's', tA: 0.2, medio: 180 });
  dep({ de: 'ana', lado: 's', t: 0.6, a: 'ent', ladoA: 'n', tA: 0.85, medio: 290 });
  dep({ de: 'nut', lado: 'o', t: 0.5, a: 'med', ladoA: 'e', tA: 0.5 });
  dep({ de: 'ent', lado: 'e', t: 0.5, a: 'int', ladoA: 'o', tA: 0.5 });
  const nut = n('nut');
  const ent = n('ent');
  const med = n('med');
  const int = n('int');
  dep({ de: 'nut', lado: 's', t: 0.7, a: 'int', ladoA: 's', tA: 0.4, via: [[nut.x + nut.w * 0.7, 382], [int.x + int.w * 0.4, 382]] });
  dep({ de: 'ent', lado: 'n', t: 0.2, a: 'med', ladoA: 'n', tA: 0.6, via: [[ent.x + ent.w * 0.2, 300], [med.x + med.w * 0.6, 300]] });
  void ent;

  L.nota({
    x: 8,
    y: 408,
    w: 500,
    titulo: null,
    texto: 'Las flechas son «imports» entre módulos. Casi todos importan SesionModule (no se dibuja) y todos usan los globales. Sin módulo: config, http y la TVCC-30 (comando).',
  });
  L.leyenda({ x: 520, y: 408, w: 222, titulo: null, columnas: 1, items: [{ muestra: 'componente', texto: 'módulo de NestJS' }, { muestra: 'linea-discontinua:flecha', texto: 'importa (depende de)' }] });
}
