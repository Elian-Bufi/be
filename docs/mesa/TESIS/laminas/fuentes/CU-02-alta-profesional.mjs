// Casos de uso del alta profesional y la administración (UML): previstos en el 05 v0.15 §5 y §12, FUERA DE ALCANCE de esta
// entrega (WP-09 no autorizado; los profesionales sintéticos se habilitan con un servicio interno, DL-036).
import { componerVistaDeCasos } from '../motor/casos.mjs';
import { leyendaDeCasos } from './_leyenda-casos.mjs';

export const meta = {
  id: 'CU-02',
  titulo: 'Casos de uso · Alta profesional y administración',
  alcance: 'Previstos en el legajo y fuera de alcance de esta entrega: se dibujan para mostrar la frontera de lo implementado.',
  fuente: '05 v0.15 §5 y §12 · datos/estado.json',
  estado: 'fuera de alcance (UC-P29 e UC-I10, parciales)',
  ancho: 728,
  alto: 448,
};

export function dibujar(L) {
  componerVistaDeCasos(L, {
    ancho: meta.ancho,
    marco: { x: 122, y: 6, w: 474, h: 388, titulo: 'BE' },
    anchoCaso: 152,
    posiciones: {
      'UC-P01': { x: 213, y: 82 }, 'UC-P28': { x: 213, y: 158 }, 'UC-P02': { x: 213, y: 234 }, 'UC-P03': { x: 213, y: 300 }, 'UC-P29': { x: 213, y: 366 },
      'UC-I01': { x: 505, y: 82 }, 'UC-E01': { x: 505, y: 172 }, 'UC-I10': { x: 505, y: 366 },
    },
    izquierda: [
      { id: 'pr', nombre: 'Profesional' },
      { id: 'ad', nombre: 'Administrador', tipo: 'pendiente' },
    ],
    principales: ['UC-P01', 'UC-P28', 'UC-P02', 'UC-P03', 'UC-P29'],
    secundarios: [
      { uc: 'UC-E01', relacion: 'extend', con: ['UC-P01', 'UC-P02'] },
      { uc: 'UC-I01', relacion: 'include', con: ['UC-P01', 'UC-E01'] },
      { uc: 'UC-I10', relacion: 'include', con: ['UC-P29'] },
    ],
    asociaciones: [
      ['pr', 'UC-P01'], ['pr', 'UC-P28'],
      ['ad', 'UC-P28'], ['ad', 'UC-P02'], ['ad', 'UC-P03'], ['ad', 'UC-P29'],
    ],
  });
  leyendaDeCasos(L, { y: 400, extend: true, estados: true, columnas: 2 });
}
