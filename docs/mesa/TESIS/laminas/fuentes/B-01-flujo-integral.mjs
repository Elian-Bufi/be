// Diagrama de actividad (UML 2.5) del circuito completo entre un profesional y un asesorado: la invitación, el vínculo,
// el consentimiento, el plan, los registros y la revisión, que cierra el seguimiento o lo continúa. Cada acción existe en
// la versión de referencia; las fuentes están en el anexo B.
import { carriles, accion, flujo, LEYENDA_ACTIVIDAD } from './_actividad-comun.mjs';

export const meta = {
  id: 'B-01',
  titulo: 'Flujo integral profesional–asesorado',
  alcance: 'Diagrama de actividad con carriles: del primer contacto a la revisión que continúa o cierra el seguimiento.',
  fuente: 'apps/api/src (vinculo, consentimiento, nutricion, entrenamiento, proceso, novedades) · packages/domain/src/revision.ts',
  estado: 'implementado',
  ancho: 750,
  alto: 456,
};

export function dibujar(L) {
  const g = carriles(L, {
    w: 750,
    wCabecera: 74,
    lista: [
      { id: 'pro', titulo: 'Profesional', subtitulo: 'website', h: 128 },
      { id: 'be', titulo: 'BE', subtitulo: 'API y base', h: 136 },
      { id: 'ase', titulo: 'Asesorado', subtitulo: 'APK', h: 128 },
    ],
  });
  const c = [0, 146, 234, 322, 410, 498, 586, 660, 736];

  L.nodoInicial({ id: 'ini', cx: 89, cy: g.pro.cy });
  accion(L, g, { id: 'p1', carril: 'pro', cx: c[1], titulo: 'Invita a una persona', detalle: 'elige el área' });
  accion(L, g, { id: 'b1', carril: 'be', cx: c[1], titulo: 'Crea la invitación', detalle: 'de un solo uso' });
  accion(L, g, { id: 'a1', carril: 'ase', cx: c[1], titulo: 'Abre la invitación y acepta', detalle: 've quién invita y para qué' });
  accion(L, g, { id: 'b2', carril: 'be', cx: c[2], titulo: 'Vínculo aceptado', detalle: 'solicitud creada y aceptada' });
  accion(L, g, { id: 'a3', carril: 'ase', cx: c[3], titulo: 'Autoriza el acceso', detalle: 'consentimiento y datos de salud' });
  accion(L, g, { id: 'b3', carril: 'be', cx: c[3], titulo: 'Acceso habilitado', detalle: 'consentimiento VIGENTE' });
  accion(L, g, { id: 'p2', carril: 'pro', cx: c[3], titulo: 'Evalúa y fija el objetivo' });
  accion(L, g, { id: 'p3', carril: 'pro', cx: c[4], titulo: 'Arma y activa el plan' });
  accion(L, g, { id: 'b4', carril: 'be', cx: c[4], titulo: 'Decide y activa', detalle: 'PDP, plan ACTIVADA, proceso ABIERTO, novedad' });
  accion(L, g, { id: 'a4', carril: 'ase', cx: c[4], titulo: 'Sigue el plan y registra', detalle: 'comidas y sesiones' });
  accion(L, g, { id: 'b5', carril: 'be', cx: c[5], titulo: 'Guarda cada registro', detalle: 'corregir o anular agrega otro' });
  accion(L, g, { id: 'p4', carril: 'pro', cx: c[5], titulo: 'Revisa y decide', detalle: 'resumen y línea de tiempo' });
  accion(L, g, { id: 'b6', carril: 'be', cx: c[6], titulo: 'Aplica la revisión', detalle: 'según el resultado' });
  L.decision({ id: 'd', cx: c[7], cy: g.be.cy, w: 28, h: 28 });
  L.nodoFinal({ id: 'fin', cx: c[7], cy: g.be.cy + 50 });

  flujo(L, { de: 'ini', lado: 'e', a: 'p1', ladoA: 'o' });
  flujo(L, { de: 'p1', lado: 's', a: 'b1', ladoA: 'n' });
  flujo(L, { de: 'b1', lado: 's', a: 'a1', ladoA: 'n', etiqueta: { texto: ['el profesional', 'lo comparte'], lado: 'der', auto: true } });
  flujo(L, { de: 'a1', lado: 'e', a: 'b2', ladoA: 's', tA: 0.3 });
  flujo(L, { de: 'b2', lado: 's', t: 0.72, a: 'a3', ladoA: 'o' });
  flujo(L, { de: 'a3', lado: 'n', a: 'b3', ladoA: 's' });
  flujo(L, { de: 'b3', lado: 'n', a: 'p2', ladoA: 's' });
  flujo(L, { de: 'p2', lado: 'e', a: 'p3', ladoA: 'o' });
  flujo(L, { de: 'p3', lado: 's', a: 'b4', ladoA: 'n' });
  flujo(L, { de: 'b4', lado: 's', a: 'a4', ladoA: 'n', etiqueta: { texto: ['plan vigente', 'y aviso push'], lado: 'der', auto: true } });
  flujo(L, { de: 'a4', lado: 'e', a: 'b5', ladoA: 's' });
  flujo(L, { de: 'b5', lado: 'n', a: 'p4', ladoA: 's' });
  flujo(L, { de: 'p4', lado: 'e', a: 'b6', ladoA: 'n' });
  flujo(L, { de: 'b6', lado: 'e', a: 'd', ladoA: 'o' });
  // Las tres salidas de la decisión: cierre, borrador sucesor y continuidad con el mismo plan.
  flujo(L, { de: 'd', lado: 's', a: 'fin', ladoA: 'n', etiqueta: { texto: ['[FINALIZAR]'], lado: 'der', pos: 0.5 } });
  flujo(L, { de: 'd', lado: 'n', a: 'p3', ladoA: 'n', via: [[c[7], 14], [c[4], 14]], etiqueta: { texto: ['[AJUSTAR o SUSTITUIR] borrador sucesor'], lado: 'abajo', auto: true } });
  flujo(L, { de: 'd', lado: 'e', a: 'a4', ladoA: 's', via: [[c[8], g.be.cy], [c[8], 380], [c[4], 380]], etiqueta: { texto: ['[MANTENER, REPROGRAMAR o', 'CAMBIAR OBJETIVO]', 'sigue el mismo plan'], lado: 'arriba', pos: 0.4, auto: true } });

  L.leyenda({ x: 0, y: 404, w: 750, columnas: 6, titulo: null, items: LEYENDA_ACTIVIDAD });
}
