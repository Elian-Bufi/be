// Casos de uso del circuito de entrenamiento (UML). Fuente: 05 v0.15 §9 (UC-P14 a UC-P18, UC-E02 e incluidos).
// Página vertical: nueve casos secundarios no entran a 10 pt en una apaisada. wger, secundario de UC-P15 en el 05, se
// asocia al incluido UC-I07, donde interviene (la importación). UC-P14 incluye UC-I12 según el 05 §9.6.17.
import { componerVistaDeCasos } from '../motor/casos.mjs';
import { leyendaDeCasos } from './_leyenda-casos.mjs';

export const meta = {
  id: 'CU-05',
  titulo: 'Casos de uso · Entrenamiento',
  alcance: 'De la evaluación a la revisión con decisión de continuidad, y la corrección de lo registrado.',
  fuente: '05 v0.15 §9 y su índice de relaciones · datos/estado.json',
  estado: 'implementado con un defecto abierto',
  ancho: 482,
  alto: 668,
};

export function dibujar(L) {
  const X1 = 82 + 14 + 65;
  const X2 = 82 + 346 - 14 - 65;
  const pos = {
    'UC-P14': { x: X1, y: 72 }, 'UC-P15': { x: X1, y: 172 }, 'UC-P16': { x: X1, y: 294 }, 'UC-P18': { x: X1, y: 416 },
    'UC-P17': { x: X1, y: 498 }, 'UC-E02': { x: X1, y: 568 },
    'UC-I13': { x: X2, y: 72 }, 'UC-I07': { x: X2, y: 142 }, 'UC-I08': { x: X2, y: 202 }, 'UC-I04': { x: X2, y: 264 },
    'UC-I10': { x: X2, y: 324 }, 'UC-I05': { x: X2, y: 386 }, 'UC-I06': { x: X2, y: 446 }, 'UC-I12': { x: X2, y: 568 },
  };
  componerVistaDeCasos(L, {
    ancho: meta.ancho,
    marco: { x: 82, y: 6, w: 346, h: 600, titulo: 'BE' },
    anchoCaso: 130,
    posiciones: pos,
    xActorIzquierda: 40,
    xActorDerecha: 455,
    izquierda: [
      { id: 'pe', nombre: 'Profesional de Entrenamiento', anchoTexto: 78 },
      { id: 'as', nombre: 'Asesorado', anchoTexto: 78, y: 472 },
    ],
    derecha: [{ id: 'wger', nombre: 'wger', tipo: 'externo', anchoTexto: 50, y: 116 }],
    principales: ['UC-P14', 'UC-P15', 'UC-P16', 'UC-P18', 'UC-P17'],
    secundarios: [
      { uc: 'UC-I13', relacion: 'include', con: ['UC-P14'] },
      { uc: 'UC-I07', relacion: 'include', con: ['UC-P15'] },
      { uc: 'UC-I08', relacion: 'include', con: ['UC-P15'] },
      { uc: 'UC-I04', relacion: 'include', con: ['UC-P16'] },
      { uc: 'UC-I10', relacion: 'include', con: ['UC-P16'] },
      { uc: 'UC-I05', relacion: 'include', con: ['UC-P18'] },
      { uc: 'UC-I06', relacion: 'include', con: ['UC-P18'] },
      { uc: 'UC-E02', relacion: 'extend', con: ['UC-P17'] },
      { uc: 'UC-I12', relacion: 'include', con: ['UC-E02'] },
    ],
    asociaciones: [
      ['pe', 'UC-P14'],
      ['pe', 'UC-P15'],
      ['pe', 'UC-P16'],
      ['pe', 'UC-P18'],
      ['as', 'UC-P17'],
      ['wger', 'UC-I07'],
    ],
  });
  leyendaDeCasos(L, { y: 614, w: 470, extend: true, columnas: 2, nota: 'incluyen UC-I02 y UC-I03; UC-P14 incluye UC-I12' });
}
