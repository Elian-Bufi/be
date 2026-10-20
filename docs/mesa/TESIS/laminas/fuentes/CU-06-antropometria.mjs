// Casos de uso de antropometría (UML). Fuente: 05 v0.15 §10 y su índice de relaciones: UC-E03 extiende UC-P19 y UC-P20 e
// incluye UC-I09 y UC-I12; UC-I09 incluye UC-I13; UC-E04 extiende UC-P22 (e invoca UC-P04); UC-P19 y UC-P21 incluyen
// UC-I10, que el 05 califica de «incluido compacto transversal» y se declara en la nota para no cruzar la lámina.
import { componerVistaDeCasos } from '../motor/casos.mjs';
import { leyendaDeCasos } from './_leyenda-casos.mjs';

export const meta = {
  id: 'CU-06',
  titulo: 'Casos de uso · Antropometría',
  alcance: 'Registrar y corregir mediciones con cálculos reproducibles, consultar la evolución; publicar y descubrir servicios (pendiente).',
  fuente: '05 v0.15 §10 y su índice de relaciones · datos/estado.json',
  estado: 'implementado; publicar y descubrir, pendientes',
  ancho: 728,
  alto: 448,
};

export function dibujar(L) {
  const X1 = 200;
  const X2 = 384;
  const X3 = 568;
  componerVistaDeCasos(L, {
    ancho: meta.ancho,
    marco: { x: 118, y: 6, w: 536, h: 388, titulo: 'BE' },
    anchoCaso: 140,
    posiciones: {
      'UC-P19': { x: X1, y: 78 }, 'UC-P21': { x: X1, y: 168 }, 'UC-P20': { x: X1, y: 262 }, 'UC-P22': { x: X1, y: 350 },
      'UC-E03': { x: X2, y: 170 }, 'UC-E04': { x: X2 + 46, y: 350 },
      'UC-I09': { x: X3, y: 78 }, 'UC-I13': { x: X3, y: 160 }, 'UC-I12': { x: X3, y: 250 },
    },
    xActorIzquierda: 52,
    izquierda: [
      { id: 'pa', nombre: 'Profesional con capacidad antropométrica', anchoTexto: 96, y: 110 },
      { id: 'as', nombre: 'Asesorado', y: 280 },
    ],
    principales: ['UC-P19', 'UC-P21', 'UC-P20', 'UC-P22'],
    secundarios: [
      { uc: 'UC-E03', relacion: 'extend', con: ['UC-P19', 'UC-P20'] },
      { uc: 'UC-E04', relacion: 'extend', con: ['UC-P22'] },
      { uc: 'UC-I09', relacion: 'include', con: ['UC-P19', 'UC-E03'] },
      { uc: 'UC-I13', relacion: 'include', con: ['UC-I09'] },
      { uc: 'UC-I12', relacion: 'include', con: ['UC-E03'] },
    ],
    asociaciones: [
      ['pa', 'UC-P19'],
      ['pa', 'UC-P21'],
      ['pa', 'UC-P20'],
      ['as', 'UC-P20'],
      ['as', 'UC-P22'],
    ],
  });
  leyendaDeCasos(L, { y: 400, extend: true, estados: true, columnas: 2, nota: 'UC-P19 y UC-P21 incluyen UC-I10; todos, UC-I02 y UC-I03' });
}
