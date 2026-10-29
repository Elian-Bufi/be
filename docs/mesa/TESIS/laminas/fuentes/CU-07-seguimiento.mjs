// Casos de uso de seguimiento y coordinación (UML). Fuente: 05 v0.15 §11 (UC-P23, UC-P24, UC-P31, UC-E07) y §13 (UC-S01):
// UC-E07 extiende UC-P24; UC-S01 lo ejecuta el sistema o el responsable de validación (en BE, un comando interno).
import { componerVistaDeCasos } from '../motor/casos.mjs';
import { leyendaDeCasos } from './_leyenda-casos.mjs';

export const meta = {
  id: 'CU-07',
  titulo: 'Casos de uso · Seguimiento y coordinación',
  alcance: 'Cartera y pendientes, ficha con línea de tiempo y notas entre profesionales, progreso propio y la métrica TVCC-30.',
  fuente: '05 v0.15 §11 y §13 · datos/estado.json',
  estado: 'implementado',
  ancho: 728,
  alto: 448,
};

export function dibujar(L) {
  componerVistaDeCasos(L, {
    ancho: meta.ancho,
    marco: { x: 122, y: 6, w: 470, h: 388, titulo: 'BE' },
    anchoCaso: 160,
    posiciones: {
      'UC-P23': { x: 222, y: 78 }, 'UC-P24': { x: 222, y: 176 }, 'UC-P31': { x: 222, y: 330 },
      'UC-E07': { x: 488, y: 176 }, 'UC-S01': { x: 488, y: 330 },
    },
    izquierda: [
      { id: 'pr', nombre: 'Profesional', y: 92 },
      { id: 'as', nombre: 'Asesorado', y: 296 },
    ],
    derecha: [{ id: 'rv', nombre: 'Responsable de validación', anchoTexto: 92, y: 296 }],
    xActorDerecha: 664,
    principales: ['UC-P23', 'UC-P24', 'UC-P31', 'UC-S01'],
    secundarios: [{ uc: 'UC-E07', relacion: 'extend', con: ['UC-P24'] }],
    asociaciones: [
      ['pr', 'UC-P23'],
      ['pr', 'UC-P24'],
      ['as', 'UC-P31'],
      ['rv', 'UC-S01'],
    ],
  });
  leyendaDeCasos(L, { y: 400, extend: true, soloExtend: true, columnas: 2, nota: 'UC-I02 y UC-I03, en cada ficha; UC-S01 es un proceso interno, sin la API' });
}
