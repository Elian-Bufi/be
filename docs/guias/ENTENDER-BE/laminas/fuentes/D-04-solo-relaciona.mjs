// Cuaderno de datos · muchos a muchos, caso 2: la tabla intermedia que solo relaciona. Una nota de coordinación llega a
// muchos profesionales y un profesional recibe muchas notas; DestinatarioDeNota guarda el par (su clave primaria es
// compuesta) y el momento. Relaciones dibujadas por el compositor desde datos/esquema.json.
import { componerVistaDer } from '../motor/der-vista.mjs';

export const meta = {
  id: 'D-04',
  titulo: 'Muchos a muchos que solo relaciona: los destinatarios de una nota',
  alcance: 'La clave primaria es el par (nota, destinatario): no hay nada más que decir de esa unión.',
  fuente: 'prisma/schema.prisma · sección WP-NOTAS-DE-COORDINACION',
  estado: 'implementado',
  ancho: 368,
  alto: 280,
};

export function dibujar(L) {
  componerVistaDer(L, {
    vista: ['NotaDeCoordinacion', 'DestinatarioDeNota', 'Identidad'],
    grilla: { NotaDeCoordinacion: [0, 0], DestinatarioDeNota: [1, 0], Identidad: [1, 1] },
    area: { x: 4, y: 24, w: 360, h: 250 },
    maximo: { NotaDeCoordinacion: 0, DestinatarioDeNota: 1, Identidad: 0 },
    enfasis: ['DestinatarioDeNota'],
    separacionFilas: 30,
    anchoLamina: 368,
  });
}
