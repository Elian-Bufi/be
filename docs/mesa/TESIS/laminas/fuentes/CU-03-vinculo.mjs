// Casos de uso del vínculo y el consentimiento (UML). Fuente: 05 v0.15 §6 (UC-P04 a UC-P08).
import { componerVistaDeCasos } from '../motor/casos.mjs';
import { leyendaDeCasos } from './_leyenda-casos.mjs';

export const meta = {
  id: 'CU-03',
  titulo: 'Casos de uso · Vínculo y consentimiento',
  alcance: 'Cómo empieza, se autoriza, cambia y termina la relación entre un profesional y un asesorado.',
  fuente: '05 v0.15 §6 · datos/estado.json',
  estado: 'implementado',
  ancho: 728,
  alto: 448,
};

export function dibujar(L) {
  componerVistaDeCasos(L, {
    ancho: meta.ancho,
    marco: { x: 150, y: 6, w: 428, h: 404, titulo: 'BE' },
    anchoCaso: 170,
    columnas: { principal: 364 },
    izquierda: [{ id: 'pr', nombre: 'Profesional' }],
    derecha: [{ id: 'as', nombre: 'Asesorado' }],
    xActorIzquierda: 64,
    xActorDerecha: 664,
    principales: ['UC-P04', 'UC-P05', 'UC-P07', 'UC-P06', 'UC-P08'],
    asociaciones: [
      ['pr', 'UC-P04'], ['pr', 'UC-P06'],
      ['as', 'UC-P04'], ['as', 'UC-P05'], ['as', 'UC-P07'], ['as', 'UC-P06'], ['as', 'UC-P08'],
    ],
  });
  leyendaDeCasos(L, { y: 418, nota: 'todos incluyen UC-I02 y UC-I03; UC-E04 (vista CU-06) invoca UC-P04' });
}
