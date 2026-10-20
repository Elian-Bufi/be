// Diagrama de clases · nivel de análisis: el modelo de dominio del circuito nutricional, de punta a punta (vínculo,
// consentimiento, proceso, evaluación, objetivo, plan, registro y revisión). Cada clase es una entidad persistida
// (tabla del DER); los atributos son los del esquema; las operaciones son las que la API expone sobre esa entidad
// (cada una es una ruta real de apps/api/src/*/…controller.ts). Las multiplicidades salen de las claves foráneas.
export const meta = {
  id: 'CL-01',
  titulo: 'Clases · Modelo de dominio del circuito nutricional',
  alcance: 'Nivel de análisis: entidades del dominio con sus atributos principales, sus operaciones expuestas y sus asociaciones.',
  fuente: 'prisma/schema.prisma · rutas de los controladores de la API · datos/esquema.json',
  estado: 'implementado',
  ancho: 750,
  alto: 456,
};

const COL = [10, 205, 400, 595];
const W = 145;
const FIL = [8, 150, 300];

export function dibujar(L) {
  const C = (id, c, f, d) => L.clase({ id, x: COL[c], y: FIL[f], w: W, ...d });
  // Fila 0: vínculo, alcance y consentimiento.
  C('vin', 0, 0, { nombre: 'Vinculo', atributos: [] });
  C('alc', 1, 0, { nombre: 'AlcanceDeVinculo', atributos: ['alcance, finalidad', 'estado'], operaciones: ['pausar()', 'reanudar()', 'finalizar()'] });
  C('con', 2, 0, { nombre: 'Consentimiento', atributos: ['finalidad', 'situacion, version'], operaciones: ['otorgar()', 'revocar()'] });
  // Fila 1: evaluación, objetivo, versión del plan y plan.
  C('eva', 0, 1, { nombre: 'EvaluacionNutricional', atributos: ['valoracion', 'referencias'] });
  C('obj', 1, 1, { nombre: 'VersionDeObjetivo', estereotipo: 'nutricional', atributos: ['vigenteDesde', 'requerimientoEnergetico'] });
  C('ver', 2, 1, { nombre: 'VersionDePlan', estereotipo: 'nutricional', atributos: ['version', 'estado'], operaciones: ['validar()', 'activar()'], enfasis: true });
  C('pla', 3, 1, { nombre: 'PlanNutricional', atributos: [] });
  // Fila 2: próxima revisión, proceso, revisión e ingesta.
  C('pro', 0, 2, { nombre: 'ProximaRevision', atributos: ['fechaObjetivo', 'fuente'] });
  C('prc', 1, 2, { nombre: 'ProcesoOperativo', atributos: ['alcance', 'estado'] });
  C('rev', 2, 2, { nombre: 'RevisionNutricional', atributos: ['periodoInicio, periodoFin', 'resultado'], operaciones: ['registrar()', 'aplicar()'] });
  C('ing', 3, 2, { nombre: 'IngestaNutricional', atributos: ['origen, modo', 'fechaLocal'], operaciones: ['registrar()', 'corregir()', 'anular()'] });

  const n = (id) => L.nodos.get(id);
  // Conector horizontal recto entre dos clases de la misma fila, a la altura absoluta y.
  const recto = (de, a, y, extra) => {
    const A = n(de);
    const B = n(a);
    const ladoDe = A.x < B.x ? 'e' : 'o';
    const ladoA = ladoDe === 'e' ? 'o' : 'e';
    return L.conector({ de, lado: ladoDe, t: (y - A.y) / A.h, a, ladoA, tA: (y - B.y) / B.h, fin: null, ...extra });
  };
  const yCab = (f) => FIL[f] + 26;
  // El vínculo agrupa sus alcances (composición, 06:3091); cada alcance tiene a lo sumo un consentimiento de su finalidad.
  recto('alc', 'vin', yCab(0), { fin: 'rombo_lleno', multiplicidad: { inicio: '1..*', fin: '1', ladoInicio: 'arriba', ladoFin: 'abajo' } });
  recto('con', 'alc', yCab(0), { multiplicidad: { inicio: '0..1', fin: '1', ladoInicio: 'arriba', ladoFin: 'abajo' } });
  // Circuito del plan: el objetivo se apoya en una evaluación; la versión del plan, en una versión del objetivo.
  recto('obj', 'eva', yCab(1) + 13, { multiplicidad: { inicio: '0..*', fin: '1', ladoInicio: 'arriba', ladoFin: 'abajo' } });
  recto('ver', 'obj', yCab(1) + 13, { multiplicidad: { inicio: '0..*', fin: '1', ladoInicio: 'arriba', ladoFin: 'abajo' } });
  recto('ver', 'pla', yCab(1) + 13, { fin: 'rombo_lleno', multiplicidad: { inicio: '1..*', fin: '1', ladoInicio: 'arriba', ladoFin: 'abajo' } });
  // El proceso: sus próximas revisiones (composición) y sus revisiones.
  recto('pro', 'prc', yCab(2), { fin: 'rombo_lleno', multiplicidad: { inicio: '0..*', fin: '1', ladoInicio: 'arriba', ladoFin: 'abajo' } });
  recto('rev', 'prc', yCab(2), { multiplicidad: { inicio: '0..*', fin: '1', ladoInicio: 'arriba', ladoFin: 'abajo' } });
  // Una revisión puede originar la versión siguiente del plan.
  L.conector({ de: 'ver', lado: 's', a: 'rev', ladoA: 'n', fin: null, multiplicidad: { inicio: '0..*', fin: '0..1', ladoInicio: 'der', ladoFin: 'der' }, etiqueta: { texto: ['origina'], lado: 'izq', pos: 0.5 } });
  // Lo que la persona registra ejecuta una versión activada del plan.
  const v = n('ver');
  const i = n('ing');
  const yLlega = v.y + v.h - 14;
  L.conector({ de: 'ing', lado: 'n', a: 'ver', ladoA: 'e', tA: (yLlega - v.y) / v.h, fin: null, via: [[i.x + i.w / 2, yLlega]], multiplicidad: { inicio: '0..*', fin: '1', ladoInicio: 'der', ladoFin: 'abajo' }, etiqueta: { texto: ['ejecuta'], segmento: 1, lado: 'der', pos: 0.55 } });

  L.nota({
    x: COL[3],
    y: FIL[0],
    w: W,
    titulo: 'Identidad',
    texto: 'Todas estas clases se asocian con Identidad como profesional o como asesorado; no se dibuja para que se lea el circuito (ver DER-01 a DER-07).',
  });
  L.leyenda({
    x: 10,
    y: 404,
    w: 730,
    titulo: null,
    columnas: 3,
    items: [
      { muestra: 'linea', texto: 'asociación, con su multiplicidad' },
      { muestra: 'linea:rombo_lleno', texto: 'composición (el rombo, del lado del todo)' },
      { muestra: 'enfasis', texto: 'versión que se activa' },
    ],
  });
}
