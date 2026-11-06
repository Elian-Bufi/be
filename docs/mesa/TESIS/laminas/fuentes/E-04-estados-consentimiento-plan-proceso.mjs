// Máquinas de estados (UML 2.5) del consentimiento, de la versión de plan y del proceso operativo, copiadas de las
// tablas de transición del dominio. Cada flecha es una transición con quién la dispara; las que no cambian de estado
// (aceptar una versión nueva del texto, guardar un borrador, aplicar la continuidad) son transiciones a sí mismo.
export const meta = {
  id: 'E-04',
  titulo: 'Estados · consentimiento, versión de plan y proceso',
  alcance: 'Tres máquinas reales del dominio: el consentimiento que se revoca y se vuelve a otorgar, el plan que se activa y el proceso que se cierra.',
  fuente: 'packages/domain/src (consentimiento-profesional.ts, nutricion.ts, proceso.ts) · prisma/schema.prisma (EstadoDeVersionDePlan)',
  estado: 'implementado',
  ancho: 750,
  alto: 456,
};

export function dibujar(L) {
  const estado = (id, cx, cy, nombre, w = 112) => L.redondeado({ id, x: cx - w / 2, y: cy - 16, w, h: 32, titulo: nombre, radio: 14 });
  const n = (id) => L.nodos.get(id);
  // Transición a sí mismo: sale por la derecha y vuelve por arriba.
  const aSiMismo = (id, texto, alto = 24, ancho = 24) => {
    const s = n(id);
    const y0 = s.y + s.h * 0.3;
    const x1 = s.x + s.w * 0.8;
    L.conector({ de: id, lado: 'e', t: 0.3, a: id, ladoA: 'n', tA: 0.8, via: [[s.x + s.w + ancho, y0], [s.x + s.w + ancho, s.y - alto], [x1, s.y - alto]], fin: 'flecha', etiqueta: { texto, lado: 'arriba', segmento: 2, pos: 0.5 } });
  };

  // ─── Consentimiento profesional ─────────────────────────────────────────────────────────────
  L.marco({ id: 'mC', x: 4, y: 4, w: 366, h: 204, titulo: 'Consentimiento' });
  L.nodoInicial({ id: 'iC', cx: 28, cy: 82 });
  estado('vig', 216, 82, 'VIGENTE', 104);
  estado('rev', 216, 158, 'REVOCADO', 108);
  L.conector({ de: 'iC', lado: 'e', a: 'vig', ladoA: 'o', fin: 'flecha', etiqueta: { texto: ['OtorgarConsentimiento'], lado: 'arriba', pos: 0.5 } });
  aSiMismo('vig', ['AceptarNuevaVersion']);
  L.conector({ de: 'vig', lado: 's', t: 0.25, a: 'rev', ladoA: 'n', tA: 0.26, fin: 'flecha', etiqueta: { texto: ['RevocarConsentimiento'], lado: 'izq', pos: 0.5 } });
  L.conector({ de: 'rev', lado: 'n', t: 0.74, a: 'vig', ladoA: 's', tA: 0.75, fin: 'flecha', etiqueta: { texto: ['OtorgarNuevamente'], lado: 'der', pos: 0.5 } });
  L.texto({ x: 14, y: 199, texto: 'Todas las decide el asesorado.', estilo: L.TX.meta });

  // ─── Versión de plan ────────────────────────────────────────────────────────────────────────
  L.marco({ id: 'mP', x: 380, y: 4, w: 366, h: 204, titulo: 'Versión de plan', subtitulo: 'nutrición y entrenamiento' });
  L.nodoInicial({ id: 'iP', cx: 404, cy: 82 });
  estado('bor', 552, 82, 'BORRADOR', 110);
  estado('act', 552, 158, 'ACTIVADA', 104);
  L.conector({ de: 'iP', lado: 'e', a: 'bor', ladoA: 'o', fin: 'flecha', etiqueta: { texto: ['CrearBorrador'], lado: 'arriba', pos: 0.5 } });
  aSiMismo('bor', ['GuardarBorrador']);
  L.conector({ de: 'bor', lado: 's', a: 'act', ladoA: 'n', fin: 'flecha', etiqueta: { texto: ['ActivarVersion'], lado: 'izq', pos: 0.5 } });
  L.nota({ x: 618, y: 120, w: 122, texto: 'Validar es condición de activar, no un estado.' });
  L.texto({ x: 390, y: 199, texto: 'Todas las decide el profesional.', estilo: L.TX.meta });

  // ─── Proceso operativo ──────────────────────────────────────────────────────────────────────
  L.marco({ id: 'mR', x: 4, y: 216, w: 742, h: 202, titulo: 'Proceso operativo', subtitulo: 'uno abierto por profesional, asesorado y área' });
  L.nodoInicial({ id: 'iR', cx: 28, cy: 318 });
  estado('abi', 236, 318, 'ABIERTO', 104);
  estado('cer', 560, 318, 'CERRADO', 104);
  L.nodoFinal({ id: 'fR', cx: 700, cy: 318 });
  L.conector({ de: 'iR', lado: 'e', a: 'abi', ladoA: 'o', fin: 'flecha', etiqueta: { texto: ['AbrirProceso: profesional,', 'al activar un plan sin', 'proceso abierto'], lado: 'arriba', pos: 0.5 } });
  aSiMismo('abi', ['AplicarContinuidad: profesional, al aplicar', 'una revisión que no finaliza'], 26, 30);
  L.conector({ de: 'abi', lado: 'e', a: 'cer', ladoA: 'o', fin: 'flecha', etiqueta: { texto: ['CerrarPorRevision: profesional (FINALIZAR)', 'CerrarPorFinalizacionVinculo: sistema', 'CerrarPorCierreCuenta: sistema'], lado: 'abajo', pos: 0.5 } });
  L.conector({ de: 'cer', lado: 'e', a: 'fR', ladoA: 'o', fin: 'flecha' });
  L.texto({ x: 14, y: 408, texto: 'CERRADO es terminal: no se reabre. Una relación nueva abre otro proceso.', estilo: L.TX.meta });

  L.leyenda({
    x: 0,
    y: 426,
    w: 750,
    columnas: 4,
    titulo: null,
    items: [
      { muestra: 'inicio', texto: 'estado inicial' },
      { muestra: 'estado', texto: 'estado' },
      { muestra: 'linea:flecha', texto: 'transición y quién la dispara' },
      { muestra: 'final', texto: 'fin' },
    ],
  });
}
