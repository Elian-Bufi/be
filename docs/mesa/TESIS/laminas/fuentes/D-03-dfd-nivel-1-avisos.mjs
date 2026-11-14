// DFD de nivel 1 (Yourdon y DeMarco), tercera parte: procesos 7 y 8 (informar y avisar; medir la TVCC-30), con sus
// almacenes. La numeración es una sola para todo el nivel (D-01 a D-03).
import { flujoDeDatos, LEYENDA_DFD } from './_dfd-comun.mjs';

export const meta = {
  id: 'D-03',
  titulo: 'DFD de nivel 1 · avisos y medición',
  alcance: 'Procesos 7 y 8 del nivel 1: novedades y avisos push, y la medición de la TVCC-30; con sus almacenes.',
  fuente: 'apps/api/src/novedades (publicador, despachador, canal-expo, recordatorios) · apps/api/src/analitica/tvcc30.ts · render.yaml',
  estado: 'implementado',
  ancho: 750,
  alto: 456,
};

export function dibujar(L) {
  L.proceso({ id: 'p7', cx: 292, cy: 210, r: 46, numero: 7, nombre: 'Informar y avisar' });
  L.proceso({ id: 'p8', cx: 476, cy: 215, r: 46, numero: 8, nombre: 'Medir la TVCC-30' });
  L.caja({ id: 'pro', x: 16, y: 24, w: 150, tipo: 'persona', titulo: 'Profesional', tecnologia: 'website' });
  L.caja({ id: 'exp', x: 16, y: 183, w: 132, tipo: 'externo', titulo: 'Expo Push y FCM', tecnologia: 'avisos' });
  L.caja({ id: 'ase', x: 16, y: 340, w: 130, tipo: 'persona', titulo: 'Asesorado', tecnologia: 'APK' });
  L.caja({ id: 'val', x: 600, y: 14, w: 144, tipo: 'persona', titulo: 'Responsable de validación', tecnologia: 'comando interno' });
  L.almacen({ id: 'd7', x: 300, y: 352, w: 176, codigo: 'D7', nombre: 'Seguimiento y novedades' });
  L.almacen({ id: 'd2', x: 404, y: 70, w: 186, codigo: 'D2', nombre: 'Profesionales y procesos' });
  L.almacen({ id: 'd3', x: 548, y: 200, w: 196, codigo: 'D3', nombre: 'Vínculos y consentimientos' });
  L.almacen({ id: 'd6', x: 572, y: 300, w: 160, codigo: 'D6', nombre: 'Registros y revisiones' });

  // 7 · Informar y avisar
  flujoDeDatos(L, 'p7', 'pro', 'novedades');
  flujoDeDatos(L, 'p7', 'exp', ['aviso sin datos', 'de salud'], { desplazamiento: 7 });
  flujoDeDatos(L, 'exp', 'p7', ['resultado', 'del envío'], { desplazamiento: 7 });
  flujoDeDatos(L, 'ase', 'p7', ['suscripción y', 'preferencias'], { desplazamiento: 7 });
  flujoDeDatos(L, 'p7', 'ase', 'novedades', { desplazamiento: 7 });
  flujoDeDatos(L, 'p7', 'd7', ['novedades', 'y avisos'], { doble: true });
  // 8 · Medir la TVCC-30
  flujoDeDatos(L, 'val', 'p8', ['pedido de', 'medición'], { desplazamiento: 7 });
  flujoDeDatos(L, 'p8', 'val', ['resultado de', 'la TVCC-30'], { desplazamiento: 7 });
  flujoDeDatos(L, 'd2', 'p8', ['procesos y', 'próximas revisiones']);
  // Sin nombre: lleva registros completos del almacén (convención de Yourdon).
  L.relacion({ de: 'd3', a: 'p8', fin: 'flecha' });
  flujoDeDatos(L, 'd6', 'p8', ['revisiones', 'aplicadas']);
  flujoDeDatos(L, 'p8', 'd7', ['resultado', 'conservado']);

  L.nota({
    x: 186,
    y: 14,
    w: 206,
    titulo: 'Evento temporal',
    texto: 'Además de los hechos de 2, 4 y 6, el proceso 7 corre por tiempo: la tarea programada pide los recordatorios a las 10, 15 y 22 h.',
  });
  L.leyenda({ x: 0, y: 422, w: 750, columnas: 5, titulo: null, items: LEYENDA_DFD });
}
