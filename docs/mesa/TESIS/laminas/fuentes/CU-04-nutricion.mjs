// Casos de uso del circuito de nutrición (UML). Fuente: 05 v0.15 §7 (fichas UC-P09 a UC-P13 e incluidos), índice del 05
// (relaciones include), datos/estado.json (estado de cada caso). Se dibuja el actor principal de cada caso; Open Food
// Facts, secundario de UC-P10 en el 05, se asocia al incluido UC-I07, que es donde interviene (la importación).
import { componerVistaDeCasos } from '../motor/casos.mjs';

export const meta = {
  id: 'CU-04',
  titulo: 'Casos de uso · Nutrición',
  alcance: 'Del registro de la evaluación a la revisión con decisión de continuidad: arriba el trabajo del profesional, abajo el registro de la persona.',
  fuente: '05 v0.15 §7 y su índice de relaciones · datos/estado.json',
  estado: 'implementado',
  ancho: 728,
  alto: 448,
};

export function dibujar(L) {
  componerVistaDeCasos(L, {
    ancho: meta.ancho,
    marco: { x: 122, y: 6, w: 474, h: 404, titulo: 'BE' },
    anchoCaso: 152,
    separacion: 48,
    izquierda: [
      { id: 'pn', nombre: 'Profesional de Nutrición' },
      { id: 'as', nombre: 'Asesorado' },
    ],
    derecha: [{ id: 'off', nombre: 'Open Food Facts', tipo: 'externo' }],
    principales: ['UC-P09', 'UC-P10', 'UC-P11', 'UC-P13', 'UC-P12'],
    secundarios: [
      { uc: 'UC-I13', relacion: 'include', con: ['UC-P09'] },
      { uc: 'UC-I07', relacion: 'include', con: ['UC-P10'] },
      { uc: 'UC-I08', relacion: 'include', con: ['UC-P10'] },
      { uc: 'UC-I04', relacion: 'include', con: ['UC-P11'] },
      { uc: 'UC-I10', relacion: 'include', con: ['UC-P11'] },
      { uc: 'UC-I05', relacion: 'include', con: ['UC-P13'] },
      { uc: 'UC-I06', relacion: 'include', con: ['UC-P13'] },
    ],
    asociaciones: [
      ['pn', 'UC-P09'],
      ['pn', 'UC-P10'],
      ['pn', 'UC-P11'],
      ['pn', 'UC-P13'],
      ['as', 'UC-P12'],
      ['off', 'UC-I07'],
    ],
  });
  L.leyenda({
    x: 6,
    y: 418,
    w: 716,
    titulo: null,
    columnas: 3,
    items: [
      { muestra: 'linea', texto: 'asociación (actor principal)' },
      { muestra: 'linea-discontinua:flecha', texto: '«include»' },
      { muestra: 'nota', texto: 'UC-I02, UC-I03 y UC-I11, en cada ficha' },
    ],
  });
}
