// Casos de uso de información pertinente, novedades y avisos (UML). Fuente: 05 v0.15 §12 y §14 (UC-P30, UC-P32, UC-P33,
// UC-E08): UC-E08 extiende UC-P30; el aviso sale por Expo Push.
import { componerVistaDeCasos } from '../motor/casos.mjs';
import { leyendaDeCasos } from './_leyenda-casos.mjs';

export const meta = {
  id: 'CU-08',
  titulo: 'Casos de uso · Información, novedades y avisos',
  alcance: 'Pedir y completar información pertinente, consultar novedades y recibir avisos no sensibles en el teléfono.',
  fuente: '05 v0.15 §12 y §14 · datos/estado.json',
  estado: 'implementado; avisos sin probar en un teléfono',
  ancho: 728,
  alto: 448,
};

export function dibujar(L) {
  componerVistaDeCasos(L, {
    ancho: meta.ancho,
    marco: { x: 130, y: 6, w: 468, h: 388, titulo: 'BE' },
    anchoCaso: 168,
    posiciones: {
      'UC-P32': { x: 420, y: 78 }, 'UC-P30': { x: 420, y: 192 }, 'UC-P33': { x: 420, y: 306 },
      'UC-E08': { x: 234, y: 312 },
    },
    izquierda: [
      { id: 'pr', nombre: 'Profesional', y: 102 },
      { id: 'expo', nombre: 'Expo Push', tipo: 'externo', y: 288 },
    ],
    derecha: [{ id: 'as', nombre: 'Asesorado', y: 210 }],
    xActorDerecha: 668,
    principales: ['UC-P32', 'UC-P30', 'UC-P33'],
    secundarios: [{ uc: 'UC-E08', relacion: 'extend', con: ['UC-P30'], angulos: { 'UC-P30': [305, 128] } }],
    asociaciones: [
      ['pr', 'UC-P32'],
      ['pr', 'UC-P30'],
      ['as', 'UC-P30'],
      ['as', 'UC-P33'],
      ['expo', 'UC-E08'],
    ],
  });
  leyendaDeCasos(L, { y: 400, extend: true, soloExtend: true, externos: true, columnas: 2, nota: 'UC-I02 y UC-I03, en cada ficha' });
}
