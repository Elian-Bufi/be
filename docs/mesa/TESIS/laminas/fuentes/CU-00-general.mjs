// Vista general de los casos de uso por paquetes (UML, paquetes de casos de uso). Cada uno de los 56 casos del 05 v0.15 está
// en un solo paquete; los incluidos que comparten varios circuitos van en la franja de compartidos. Profesional y asesorado
// participan en los ocho paquetes (el asesorado también en UC-P28, incidencias): se dicen en la leyenda y sus asociaciones
// están en CU-01 a CU-08. Los sistemas externos y el administrador se unen a su paquete. Estados: datos/estado.json.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const estado = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../../datos/estado.json'), 'utf8')).casos;

export const meta = {
  id: 'CU-00',
  titulo: 'Casos de uso · Vista general por paquetes',
  alcance: 'Los 56 casos de uso del legajo en ocho paquetes y una franja de incluidos compartidos, con su estado y sus actores.',
  fuente: '05 v0.15 (índice de casos) · datos/estado.json',
  estado: 'implementado con pendientes',
  ancho: 728,
  alto: 448,
};

const PAQUETES = [
  { id: 'vin', titulo: 'CU-03 · Vínculo y consentimiento', casos: ['UC-P04', 'UC-P05', 'UC-P06', 'UC-P07', 'UC-P08'], ids: 'P04 · P05 · P06 · P07 · P08' },
  { id: 'acc', titulo: 'CU-01 · Acceso y cuenta', casos: ['UC-P25', 'UC-P26', 'UC-P27', 'UC-E05', 'UC-E06', 'UC-E09', 'UC-I11'], ids: 'P25–P27 · E05 · E06 · E09 · I11' },
  { id: 'ant', titulo: 'CU-06 · Antropometría', casos: ['UC-P19', 'UC-P20', 'UC-P21', 'UC-P22', 'UC-E03', 'UC-E04', 'UC-I09'], ids: 'P19–P22 · E03 · E04 · I09' },
  { id: 'nut', titulo: 'CU-04 · Nutrición', casos: ['UC-P09', 'UC-P10', 'UC-P11', 'UC-P12', 'UC-P13'], ids: 'P09–P13' },
  { id: 'seg', titulo: 'CU-07 · Seguimiento y coordinación', casos: ['UC-P23', 'UC-P24', 'UC-P31', 'UC-E07', 'UC-S01'], ids: 'P23 · P24 · P31 · E07 · S01' },
  { id: 'ent', titulo: 'CU-05 · Entrenamiento', casos: ['UC-P14', 'UC-P15', 'UC-P16', 'UC-P17', 'UC-P18', 'UC-E02'], ids: 'P14–P18 · E02' },
  { id: 'alt', titulo: 'CU-02 · Alta profesional y administración', casos: ['UC-P01', 'UC-P02', 'UC-P03', 'UC-P28', 'UC-P29', 'UC-E01', 'UC-I01'], ids: 'P01–P03 · P28 · P29 · E01 · I01' },
  { id: 'inf', titulo: 'CU-08 · Información, novedades y avisos', casos: ['UC-P30', 'UC-P32', 'UC-P33', 'UC-E08'], ids: 'P30 · P32 · P33 · E08' },
];
const COMPARTIDOS = ['UC-I02', 'UC-I03', 'UC-I04', 'UC-I05', 'UC-I06', 'UC-I07', 'UC-I08', 'UC-I10', 'UC-I12', 'UC-I13'];

function resumen(casos) {
  const c = { listo: 0, parcial: 0, pendiente: 0, fuera: 0 };
  for (const uc of casos) {
    const e = estado[uc]?.estado;
    if (e === 'implementado' || e === 'verificado') c.listo++;
    else if (e === 'parcial') c.parcial++;
    else if (e === 'fuera') c.fuera++;
    else c.pendiente++;
  }
  const partes = [];
  if (c.listo) partes.push(`${c.listo} implementado${c.listo === 1 ? '' : 's'}`);
  if (c.parcial) partes.push(`${c.parcial} parcial${c.parcial === 1 ? '' : 'es'}`);
  if (c.pendiente) partes.push(`${c.pendiente} pendiente${c.pendiente === 1 ? '' : 's'}`);
  if (c.fuera) partes.push(`${c.fuera} fuera de alcance`);
  return { texto: partes.join(' · '), mayoriaPendiente: c.pendiente + c.fuera > c.listo + c.parcial };
}

export function dibujar(L) {
  const B = { x: 92, y: 6, w: 540, h: 384 };
  L.marco({ id: 'limite', ...B, titulo: 'BE', subtitulo: 'límite del sistema' });
  const colW = (B.w - 14 * 2 - 12) / 2;
  const xs = [B.x + 14, B.x + 14 + colW + 12];
  const filaH = 62;
  const y0 = B.y + 28;
  PAQUETES.forEach((p, i) => {
    const x = xs[i % 2];
    const y = y0 + Math.floor(i / 2) * (filaH + 6);
    const r = resumen(p.casos);
    L.paquete({ id: p.id, x, y, w: colW, h: filaH, titulo: p.titulo, tipo: r.mayoriaPendiente ? 'pendiente' : 'sistema' });
    L.texto({ x: x + 9, y: y + 34, texto: p.ids, estilo: L.TX.id, color: L.T.color.sistema.trazo, de: `${p.id}-ids` });
    L.texto({ x: x + 9, y: y + 52, texto: r.texto, color: L.T.color.tinta, de: `${p.id}-estado` });
  });
  const yF = y0 + 4 * (filaH + 6);
  const rF = resumen(COMPARTIDOS);
  L.paquete({ id: 'com', x: xs[0], y: yF, w: B.w - 28, h: B.y + B.h - yF - 8, titulo: 'Incluidos compartidos por varios circuitos' });
  L.texto({ x: xs[0] + 9, y: yF + 34, texto: 'I02 autorización · I03 auditoría · I04 · I05 · I06 · I07 · I08 · I10 · I12 · I13', estilo: L.TX.id, color: L.T.color.sistema.trazo, de: 'com-ids' });
  L.texto({ x: xs[0] + 9, y: yF + 52, texto: `${rF.texto} · I02 e I03 los incluye todo caso protegido`, color: L.T.color.tinta, de: 'com-estado' });

  L.actor({ id: 'pr', cx: 46, y: 86, nombre: 'Profesional', anchoTexto: 84 });
  L.actor({ id: 'as', cx: 46, y: 200, nombre: 'Asesorado', anchoTexto: 84 });
  L.actor({ id: 'ad', cx: 46, y: 300, nombre: 'Administrador', tipo: 'pendiente', anchoTexto: 84 });
  const caja = (id) => {
    const n = L.nodos.get(id);
    const borde = { id: `${id}-borde`, x: n.x, y: n.y + 17, w: n.w, h: n.h - 17, rect: false, forma: 'caja' };
    L.nodos.set(borde.id, borde);
    return borde;
  };
  const externos = [
    ['google', 'Google', 'acc'],
    ['off', 'Open Food Facts', 'nut'],
    ['wger', 'wger', 'ent'],
    ['expo', 'Expo Push', 'inf'],
  ];
  for (const [id, nombre, paquete] of externos) {
    const b = caja(paquete);
    L.actor({ id, cx: 682, y: b.y + b.h / 2 - 24, nombre, tipo: 'externo', anchoTexto: 92, escala: 0.62 });
    L.relacion({ de: id, a: b.id, extremoA: 'e' });
  }
  L.relacion({ de: 'ad', a: caja('alt').id, extremoA: 'o' });

  L.leyenda({
    x: 6,
    y: 398,
    w: 716,
    titulo: null,
    columnas: 2,
    items: [
      { muestra: 'marco', texto: 'paquete: vista de detalle y nombre en la solapa' },
      { muestra: 'pendiente', texto: 'paquete mayormente pendiente o fuera de alcance' },
      { muestra: 'linea', texto: 'asociación de un sistema externo o del administrador' },
      { muestra: 'nota', texto: 'profesional y asesorado participan en los ocho paquetes' },
    ],
  });
}
