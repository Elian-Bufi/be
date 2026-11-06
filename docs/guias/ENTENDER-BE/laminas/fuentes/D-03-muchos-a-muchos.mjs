// Cuaderno de datos · muchos a muchos, caso 1: la tabla intermedia que además es un hecho del negocio. Un profesional
// tiene muchas personas y una persona muchos profesionales: el vínculo los une, y por área (alcance) tiene estado,
// versión e historia propia. Relaciones dibujadas por el compositor desde datos/esquema.json.
import { componerVistaDer } from '../motor/der-vista.mjs';

export const meta = {
  id: 'D-03',
  titulo: 'Muchos a muchos con vida propia: el vínculo',
  alcance: 'Profesional y persona son dos identidades; el vínculo las une y cada alcance (área) tiene estado y versión.',
  fuente: 'prisma/schema.prisma · sección WP-03 (M-03)',
  estado: 'implementado',
  ancho: 368,
  alto: 262,
};

export function dibujar(L) {
  componerVistaDer(L, {
    vista: ['Identidad', 'Vinculo', 'AlcanceDeVinculo'],
    grilla: { Identidad: [0, 0], Vinculo: [1, 0], AlcanceDeVinculo: [1, 1] },
    area: { x: 4, y: 6, w: 360, h: 250 },
    maximo: { Identidad: 1, Vinculo: 0, AlcanceDeVinculo: 3 },
    incluir: { AlcanceDeVinculo: ['alcance', 'estado'] },
    enfasis: ['Vinculo'],
    separacionFilas: 30,
    anchoLamina: 368,
  });
}
