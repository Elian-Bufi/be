// DER · Plataforma: historia, auditoría y medios (Historia del 06 y 08 §29, Idempotency-Key, DL-120 y la compatibilidad
// de clientes de DL-122). Filas y relaciones: datos/esquema.json. Reglas: auditoría, idempotencia y eventos son
// append-only; los bytes de un medio se borran solo cuando el medio ya está SUPRIMIDO (trigger).
import { dibujarVistaDer, metaDer } from './_der-comun.mjs';

export const meta = metaDer('DER-14', {
  alcance: 'Los registros transversales: eventos de dominio, auditoría, idempotencia, medios privados y capacidades de los clientes.',
  fuente: 'secciones Historia, WP-NUTRICION-RECETAS (medios) y Compatibilidad de clientes',
});

export function dibujar(L) {
  dibujarVistaDer(
    L,
    'DER-14',
    {
      area: { x: 8, y: 8, w: 560, h: 404 },
      grilla: {
        EventoDeDominio: [0, 0],
        RegistroDeAuditoria: [0, 1],
        RegistroDeIdempotencia: [1, 0],
        CapacidadDeClienteDeclarada: [1, 1],
        Medio: [2, 0],
        ContenidoDeMedio: [2, 1],
      },
      maximo: { Medio: 6, EventoDeDominio: 5, RegistroDeAuditoria: 5 },
      enfasis: ['Medio'],
    },
    {
      notas: { x: 590, y: 8, w: 152, limite: 414 },
      propias: [
        {
          titulo: 'Solo se agregan filas',
          texto: 'Eventos, auditoría e idempotencia son append-only. La auditoría vive en la base, separada de los logs, sin IP ni identificadores en claro.',
        },
        {
          titulo: 'Fotos en la base',
          texto: 'Los bytes de cada imagen se guardan aparte de sus datos y se borran solo cuando el medio ya fue suprimido (DL-120).',
        },
      ],
      leyenda: { x: 8, y: 422, w: 734 },
    },
  );
}
