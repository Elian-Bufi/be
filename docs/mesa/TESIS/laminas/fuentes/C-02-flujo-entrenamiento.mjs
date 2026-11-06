// Diagrama de actividad (UML 2.5) del circuito de entrenamiento: el plan, la agenda que BE calcula desde él, la sesión
// con su borrador en el servidor, el registro serie por serie y la ejecución confirmada que revisa el profesional. La
// sustitución de un ejercicio durante la sesión se marca como pendiente (DL-151).
import { carriles, accion, flujo, LEYENDA_ACTIVIDAD } from './_actividad-comun.mjs';

export const meta = {
  id: 'C-02',
  titulo: 'Flujo de entrenamiento',
  alcance: 'Del plan a la revisión: agenda, sesión con borrador en el servidor, registro por serie y ejecución confirmada.',
  fuente: 'apps/api/src/entrenamiento · packages/domain/src (contratos-entrenamiento, agenda-de-entrenamiento) · prisma/schema.prisma',
  estado: 'implementado; la sustitución en la sesión, pendiente (DL-151)',
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
  accion(L, g, { id: 'p1', carril: 'pro', cx: 150, w: 84, titulo: 'Arma el plan', detalle: 'sesiones, ejercicios y series' });
  accion(L, g, { id: 'p2', carril: 'pro', cx: 242, w: 76, titulo: 'Valida y activa' });
  accion(L, g, { id: 'b1', carril: 'be', cx: 242, w: 84, titulo: 'Activa el plan', detalle: 'congela la instantánea, abre el proceso y avisa' });
  accion(L, g, { id: 'a1', carril: 'ase', cx: 242, w: 84, titulo: 'Ve su agenda', detalle: 'la sesión de hoy y las próximas' });
  accion(L, g, { id: 'a2', carril: 'ase', cx: 334, w: 80, titulo: 'Inicia la sesión' });
  accion(L, g, { id: 'b2', carril: 'be', cx: 334, w: 84, titulo: 'Abre el borrador', detalle: 'uno por sesión y fecha; se retoma si se corta' });
  accion(L, g, { id: 'a3', carril: 'ase', cx: 436, w: 104, titulo: 'Registra cada serie', detalle: 'carga, repeticiones, RIR y esfuerzo' });
  L.decision({ id: 'd1', cx: 512, cy: g.ase.cy, w: 26, h: 26 });
  accion(L, g, { id: 'a4', carril: 'ase', cx: 604, w: 92, titulo: 'Confirma la sesión', detalle: 'realizada, con desvío o no realizada' });
  accion(L, g, { id: 'b3', carril: 'be', cx: 604, w: 90, titulo: 'Registra la ejecución', detalle: 'inmutable; corregir agrega otra' });
  accion(L, g, { id: 'p3', carril: 'pro', cx: 604, w: 90, titulo: 'Revisa y decide', detalle: 'series y tiempos de cada sesión' });
  accion(L, g, { id: 'b4', carril: 'be', cx: 700, w: 88, titulo: 'Aplica la revisión', detalle: 'como en B-01' });
  L.nodoFinal({ id: 'fin', cx: 700, cy: g.be.cy + 52 });

  flujo(L, { de: 'ini', lado: 'e', a: 'p1', ladoA: 'o' });
  flujo(L, { de: 'p1', lado: 'e', a: 'p2', ladoA: 'o' });
  flujo(L, { de: 'p2', lado: 's', a: 'b1', ladoA: 'n' });
  flujo(L, { de: 'b1', lado: 's', a: 'a1', ladoA: 'n', etiqueta: { texto: ['agenda y', 'aviso push'], lado: 'der', auto: true } });
  flujo(L, { de: 'a1', lado: 'e', a: 'a2', ladoA: 'o' });
  flujo(L, { de: 'a2', lado: 'n', a: 'b2', ladoA: 's' });
  flujo(L, { de: 'b2', lado: 'e', a: 'a3', ladoA: 'n' });
  flujo(L, { de: 'a3', lado: 'e', a: 'd1', ladoA: 'o' });
  flujo(L, { de: 'd1', lado: 's', a: 'a3', ladoA: 's', via: [[512, 398], [436, 398]], etiqueta: { texto: ['[quedan series]'], lado: 'abajo', auto: true } });
  flujo(L, { de: 'd1', lado: 'e', a: 'a4', ladoA: 'o', etiqueta: { texto: ['[listo]'], lado: 'arriba', auto: true } });
  flujo(L, { de: 'a4', lado: 'n', a: 'b3', ladoA: 's' });
  flujo(L, { de: 'b3', lado: 'n', a: 'p3', ladoA: 's' });
  flujo(L, { de: 'p3', lado: 'e', a: 'b4', ladoA: 'n' });
  flujo(L, { de: 'b4', lado: 's', a: 'fin', ladoA: 'n' });

  L.nota({
    x: 294,
    y: 14,
    w: 236,
    titulo: 'Pendiente (DL-151)',
    texto: 'Sustituir un ejercicio durante la sesión: la API lo admite y la APK 0.13.2 lo ofrecía; la candidata 0.17.0 todavía no (PR #195, en borrador).',
  });

  L.leyenda({ x: 0, y: 420, w: 750, columnas: 6, titulo: null, items: LEYENDA_ACTIVIDAD });
}
