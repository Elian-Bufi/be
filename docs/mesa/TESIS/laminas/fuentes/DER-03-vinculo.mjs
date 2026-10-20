// Lámina patrón del DER (nivel lógico): vínculo profesional–asesorado e invitación. M-03 del 06, WP-03 y WP-INVITACION.
// Filas y cardinalidades: datos/esquema.json (prisma/schema.prisma). Reglas que no expresa Prisma, verificadas en
// prisma/migrations/20260919200100_vinculo_consentimiento_y_pdp/migration.sql: índices únicos parciales (líneas 402 y 405)
// y listas blancas de estados (solicitud 533-563, alcance 566-620).
import { filasDe, relacionesEntre, puntas } from '../motor/der.mjs';

export const meta = {
  id: 'DER-03',
  titulo: 'DER · Vínculo e invitación',
  alcance: 'Cómo nace y cambia la relación entre un profesional y un asesorado: invitación, solicitud, vínculo y alcance por área.',
  fuente: 'prisma/schema.prisma (sección M-03 y WP-INVITACION) · migraciones 20260919200100 y 20261016180000',
  estado: 'implementado',
  ancho: 728,
  alto: 448,
};

const VISTA = ['InvitacionDeVinculo', 'ResolucionDeInvitacion', 'SolicitudDeVinculo', 'Vinculo', 'AlcanceDeVinculo'];

export function dibujar(L) {
  const W = 196;
  const c = [8, 266, 524];
  const fila1 = 8;
  const fila2 = 200;
  const ent = (id, modelo, x, y, opciones = {}) => {
    const { filas, omitidos } = filasDe(modelo, { vista: VISTA, ...opciones });
    return L.entidad({ id, x, y, w: W, nombre: modelo, filas, omitidos, enfasis: opciones.enfasis });
  };
  ent('inv', 'InvitacionDeVinculo', c[0], fila1, { maximo: 7 });
  ent('res', 'ResolucionDeInvitacion', c[1], fila1);
  ent('vin', 'Vinculo', c[2], fila1);
  const sol = ent('sol', 'SolicitudDeVinculo', c[1], fila2, { maximo: 10, enfasis: true });
  ent('alc', 'AlcanceDeVinculo', c[2], fila2, { maximo: 9 });

  // Relaciones del esquema dentro de la vista, con su ruta.
  const nodoDe = { InvitacionDeVinculo: 'inv', ResolucionDeInvitacion: 'res', SolicitudDeVinculo: 'sol', Vinculo: 'vin', AlcanceDeVinculo: 'alc' };
  const rutas = {
    'ResolucionDeInvitacion.invitacionId': { lado: 'o', ladoA: 'e', campoA: 'id' },
    'ResolucionDeInvitacion.solicitudDeVinculoId': { lado: 's', ladoA: 'n', sinCampo: true },
    'SolicitudDeVinculo.antecedenteId': { lado: 'o', ladoA: 'o', campoA: 'id', lazo: -18 },
    'AlcanceDeVinculo.solicitudDeOrigenId': { lado: 'o', ladoA: 'e', campoA: 'id', medio: (c[1] + W + c[2]) / 2 },
    'AlcanceDeVinculo.vinculoId': { lado: 'n', ladoA: 's', sinCampo: true },
  };
  for (const r of relacionesEntre(VISTA)) {
    const clave = `${r.desde}.${r.clavesForaneas[0]}`;
    const ruta = rutas[clave];
    if (!ruta) throw new Error(`relación sin ruta: ${clave}`);
    const { hija, padre } = puntas(r);
    const de = nodoDe[r.desde];
    const a = nodoDe[r.hacia];
    const base = { de, a, lado: ruta.lado, ladoA: ruta.ladoA, inicio: hija, fin: padre, medio: ruta.medio };
    if (!ruta.sinCampo) {
      base.campo = r.clavesForaneas[0];
      base.campoA = ruta.campoA;
    }
    if (ruta.lazo) {
      const yFk = sol.anclaFila(r.clavesForaneas[0], 'o').y;
      const yPk = sol.anclaFila('id', 'o').y;
      base.via = [[sol.x + ruta.lazo, yFk], [sol.x + ruta.lazo, yPk]];
    }
    L.conector(base);
  }

  // Notas: cómo leer las filas, los estados y lo que garantiza la base (lo que el tribunal pregunta).
  const xN = c[0];
  const wN = 228;
  let y = 172;
  y +=
    8 +
    L.nota({
      x: xN,
      y,
      w: wN,
      titulo: 'Cómo leer las filas',
      texto: ['PK clave primaria · FK clave foránea', 'UK única · U1 parte de una unicidad compuesta', '* obligatorio · o opcional', '↗ otra vista: profesionalId, asesoradoId y actorId → Identidad (DER-01).'].join('\n'),
    });
  y += 8 + L.nota({ x: xN, y, w: wN, titulo: 'Estados', texto: 'La solicitud nace PENDIENTE y pasa a ACEPTADA, RECHAZADA, CADUCADA o INVALIDADA. El alcance nace ACEPTADO, se pausa y se reanuda, y termina FINALIZADO.' });
  L.nota({ x: xN, y, w: wN, titulo: 'La base lo garantiza', texto: 'Una sola solicitud PENDIENTE equivalente; un solo alcance no FINALIZADO por vínculo y área; nada se borra.' });

  L.leyenda({
    x: 266,
    y: 412,
    w: 454,
    titulo: null,
    columnas: 3,
    items: [
      { muestra: 'linea:uno', texto: 'uno y solo uno' },
      { muestra: 'linea:cero_o_uno', texto: 'cero o uno' },
      { muestra: 'linea:cero_o_muchos', texto: 'cero o muchos' },
    ],
  });
}
