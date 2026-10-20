// DER · Profesional, capacidad y proceso operativo (M-02 mínimo de WP-03; B-04 y B-05 de WP-04). Filas y relaciones:
// datos/esquema.json. Reglas de la base: como máximo un proceso ABIERTO por (profesional, asesorado, alcance), índice
// parcial (INV-06-74); CERRADO es terminal (INV-06-86); la capacidad se versiona por adición (REG-06-81, 83).
import { dibujarVistaDer, metaDer } from './_der-comun.mjs';

export const meta = metaDer('DER-02', {
  alcance: 'El profesional (verificación, habilitación y capacidad) y el proceso que abre con cada persona en un área.',
  fuente: 'secciones WP-03 · M-02 mínimo y WP-04 · Proceso operativo',
});

export function dibujar(L) {
  dibujarVistaDer(
    L,
    'DER-02',
    {
      area: { x: 8, y: 8, w: 722, h: 400 },
      grilla: {
        EventoDeProceso: [0, 0],
        PerfilProfesional: [0, 1],
        EventoDeVerificacion: [0, 2],
        ProcesoOperativo: [1, 0],
        VerificacionProfesional: [1, 1],
        CapacidadProfesional: [1, 2],
        ProximaRevision: [2, 0],
        Habilitacion: [2, 1],
      },
      maximo: 4,
      separacionFilas: 22,
      enfasis: ['ProcesoOperativo'],
    },
    {
      notas: { columna: 2, desdeFila: 2, limite: 414 },
      propias: [
        {
          titulo: 'Lo que garantiza la base',
          texto: 'A lo sumo un proceso ABIERTO por profesional, asesorado y área; CERRADO es terminal. La capacidad se versiona por adición. En esta entrega la verificación y la habilitación las asigna un servicio interno (DL-036).',
        },
      ],
      leyenda: { x: 8, y: 422, w: 734 },
    },
  );
}
