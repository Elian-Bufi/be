// Diagrama de actividad (UML 2.5) del circuito de nutrición: el plan, su activación, el registro de cada comida (una
// opción del plan o algo diferente) y la revisión. Las acciones y los estados son los de la versión de referencia.
import { carriles, accion, flujo, LEYENDA_ACTIVIDAD } from './_actividad-comun.mjs';

export const meta = {
  id: 'C-01',
  titulo: 'Flujo de nutrición',
  alcance: 'Del plan a la revisión: activación, registro de comidas por opción del plan o diferente, y el resultado de la revisión.',
  fuente: 'apps/api/src/nutricion (planes, ingestas, revisiones) · apps/mobile/src/pantallas (nutricion-hoy, comida-diferente) · packages/domain/src/revision.ts',
  estado: 'implementado',
  ancho: 750,
  alto: 456,
};

export function dibujar(L) {
  const g = carriles(L, {
    w: 750,
    wCabecera: 74,
    lista: [
      { id: 'pro', titulo: 'Profesional', subtitulo: 'website', h: 120 },
      { id: 'be', titulo: 'BE', subtitulo: 'API y base', h: 132 },
      { id: 'ase', titulo: 'Asesorado', subtitulo: 'APK', h: 160 },
    ],
  });

  L.nodoInicial({ id: 'ini', cx: 86, cy: g.pro.cy });
  accion(L, g, { id: 'p1', carril: 'pro', cx: 150, w: 84, titulo: 'Arma el plan', detalle: 'días tipo, comidas y opciones' });
  accion(L, g, { id: 'p2', carril: 'pro', cx: 242, w: 76, titulo: 'Valida y activa' });
  accion(L, g, { id: 'b1', carril: 'be', cx: 242, w: 84, titulo: 'Activa el plan', detalle: 'congela la instantánea, abre el proceso y avisa' });
  accion(L, g, { id: 'a1', carril: 'ase', cx: 242, w: 84, titulo: 'Ve el plan del día', detalle: 'opciones de cada comida' });
  L.decision({ id: 'd1', cx: 312, cy: g.ase.cy, w: 26, h: 26 });
  accion(L, g, { id: 'a2', carril: 'ase', cx: 412, dy: -34, w: 122, titulo: 'Registra una opción', detalle: 'del plan y su cantidad' });
  accion(L, g, { id: 'a3', carril: 'ase', cx: 412, dy: 34, w: 122, titulo: 'Registra otra comida', detalle: 'texto, foto o los dos' });
  L.decision({ id: 'm', cx: 500, cy: g.ase.cy, w: 26, h: 26 });
  accion(L, g, { id: 'b2', carril: 'be', cx: 552, w: 82, titulo: 'Guarda el registro', detalle: 'corregir o anular agrega otro' });
  accion(L, g, { id: 'p3', carril: 'pro', cx: 552, w: 82, titulo: 'Revisa y decide', detalle: 'resumen y línea de tiempo' });
  accion(L, g, { id: 'b3', carril: 'be', cx: 642, w: 80, titulo: 'Aplica la revisión' });
  L.decision({ id: 'd2', cx: 712, cy: g.be.cy, w: 28, h: 28 });
  L.nodoFinal({ id: 'fin', cx: 712, cy: g.be.cy + 54 });

  flujo(L, { de: 'ini', lado: 'e', a: 'p1', ladoA: 'o' });
  flujo(L, { de: 'p1', lado: 'e', a: 'p2', ladoA: 'o' });
  flujo(L, { de: 'p2', lado: 's', a: 'b1', ladoA: 'n' });
  flujo(L, { de: 'b1', lado: 's', a: 'a1', ladoA: 'n', etiqueta: { texto: ['plan del día', 'y aviso push'], lado: 'der', auto: true } });
  flujo(L, { de: 'a1', lado: 'e', a: 'd1', ladoA: 'o' });
  flujo(L, { de: 'd1', lado: 'n', a: 'a2', ladoA: 'o', etiqueta: { texto: ['[del plan]'], lado: 'arriba', auto: true } });
  flujo(L, { de: 'd1', lado: 's', a: 'a3', ladoA: 'o', etiqueta: { texto: ['[otra cosa]'], lado: 'abajo', auto: true } });
  flujo(L, { de: 'a2', lado: 'e', a: 'm', ladoA: 'n' });
  flujo(L, { de: 'a3', lado: 'e', a: 'm', ladoA: 's' });
  flujo(L, { de: 'm', lado: 'e', a: 'b2', ladoA: 's' });
  flujo(L, { de: 'b2', lado: 'n', a: 'p3', ladoA: 's' });
  flujo(L, { de: 'p3', lado: 'e', a: 'b3', ladoA: 'n' });
  flujo(L, { de: 'b3', lado: 'e', a: 'd2', ladoA: 'o' });
  flujo(L, { de: 'd2', lado: 's', a: 'fin', ladoA: 'n', etiqueta: { texto: ['[FINALIZAR]'], lado: 'izq', pos: 0.5 } });
  flujo(L, { de: 'd2', lado: 'n', a: 'p1', ladoA: 'n', via: [[712, 10], [150, 10]], etiqueta: { texto: ['[AJUSTAR o SUSTITUIR] borrador sucesor'], lado: 'abajo', auto: true } });
  flujo(L, { de: 'd2', lado: 'e', a: 'a1', ladoA: 's', via: [[744, g.be.cy], [744, 404], [242, 404]], etiqueta: { texto: ['[MANTENER, REPROGRAMAR o', 'CAMBIAR OBJETIVO]', 'sigue el mismo plan'], lado: 'arriba', pos: 0.25, auto: true } });

  L.leyenda({ x: 0, y: 420, w: 750, columnas: 6, titulo: null, items: LEYENDA_ACTIVIDAD });
}
