// Diagrama de actividad (UML 2.5) del circuito de antropometría: la toma se prepara en un borrador que todavía no es
// historia, se registra en un acto aparte y queda inmutable; los cálculos se corren con un método y una versión del
// catálogo, y conviven. Antropometría no tiene plan ni proceso: no hay revisión con resultado.
import { carriles, accion, flujo, LEYENDA_ACTIVIDAD } from './_actividad-comun.mjs';

export const meta = {
  id: 'C-03',
  titulo: 'Flujo de antropometría',
  alcance: 'De la toma en preparación a la evolución: borrador, registro inmutable, cálculos por método y lo que ve el asesorado.',
  fuente: 'apps/api/src/antropometria · apps/web/src/app/pro/advisees/anthropometry (preparacion, calculos) · packages/domain/src/contratos-antropometria.ts',
  estado: 'implementado',
  ancho: 750,
  alto: 456,
};

export function dibujar(L) {
  const g = carriles(L, {
    w: 750,
    wCabecera: 74,
    lista: [
      { id: 'pro', titulo: 'Profesional', subtitulo: 'website', h: 150 },
      { id: 'be', titulo: 'BE', subtitulo: 'API y base', h: 140 },
      { id: 'ase', titulo: 'Asesorado', subtitulo: 'APK', h: 122 },
    ],
  });

  L.nodoInicial({ id: 'ini', cx: 86, cy: g.pro.cy });
  accion(L, g, { id: 'p1', carril: 'pro', cx: 150, w: 88, titulo: 'Prepara una toma', detalle: 'protocolo y mediciones sobre la figura' });
  accion(L, g, { id: 'b1', carril: 'be', cx: 150, w: 88, titulo: 'Guarda el borrador', detalle: 'todavía no es historia' });
  L.decision({ id: 'd1', cx: 244, cy: g.pro.cy, w: 26, h: 26 });
  accion(L, g, { id: 'p2', carril: 'pro', cx: 356, w: 88, titulo: 'Registra la toma', detalle: 'acto aparte; después no se edita' });
  accion(L, g, { id: 'b2', carril: 'be', cx: 356, w: 88, titulo: 'Registra la toma', detalle: 'inmutable; entra en la evolución' });
  accion(L, g, { id: 'p3', carril: 'pro', cx: 478, w: 92, titulo: 'Calcula con un método', detalle: 'del catálogo, con su versión' });
  accion(L, g, { id: 'b3', carril: 'be', cx: 604, w: 96, titulo: 'Guarda la corrida', detalle: 'método, versión, regla y entradas' });
  accion(L, g, { id: 'a1', carril: 'ase', cx: 604, w: 96, titulo: 'Ve su evolución', detalle: 'medidas registradas, sin interpolar' });
  L.nodoFinal({ id: 'fin', cx: 700, cy: g.ase.cy });

  flujo(L, { de: 'ini', lado: 'e', a: 'p1', ladoA: 'o' });
  flujo(L, { de: 'p1', lado: 's', a: 'b1', ladoA: 'n' });
  flujo(L, { de: 'b1', lado: 'e', a: 'd1', ladoA: 's' });
  flujo(L, { de: 'd1', lado: 'n', a: 'p1', ladoA: 'n', via: [[244, 12], [150, 12]], etiqueta: { texto: ['[falta cargar]'], lado: 'abajo', auto: true } });
  flujo(L, { de: 'd1', lado: 'e', a: 'p2', ladoA: 'o', etiqueta: { texto: ['[lista]'], lado: 'arriba', auto: true } });
  flujo(L, { de: 'p2', lado: 's', a: 'b2', ladoA: 'n' });
  flujo(L, { de: 'b2', lado: 'e', a: 'p3', ladoA: 's' });
  flujo(L, { de: 'p3', lado: 'e', a: 'b3', ladoA: 'n' });
  flujo(L, { de: 'b3', lado: 's', a: 'a1', ladoA: 'n' });
  flujo(L, { de: 'a1', lado: 'e', a: 'fin', ladoA: 'o' });

  L.nota({
    x: 88,
    y: g.ase.y + 12,
    w: 186,
    titulo: 'Corregir sin borrar',
    texto: 'Una toma registrada no se edita: corregir o anular una medición agrega un registro (API-ANT-05 y 12).',
  });
  L.nota({
    x: 284,
    y: g.ase.y + 12,
    w: 186,
    titulo: 'Los cálculos conviven',
    texto: 'BE no elige el mejor. El profesional puede marcar uno como referencia, que no es una decisión clínica.',
  });

  L.leyenda({ x: 0, y: 420, w: 750, columnas: 6, titulo: null, items: LEYENDA_ACTIVIDAD });
}
