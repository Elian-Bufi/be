// Máquinas de estados (UML 2.5) de la solicitud de vínculo y del alcance del vínculo, copiadas de las tablas de
// transición del dominio (packages/domain/src/vinculo.ts): cada flecha es una transición con su nombre y quién puede
// dispararla. El servicio consulta esa tabla antes de escribir y la base la refuerza.
export const meta = {
  id: 'E-03',
  titulo: 'Estados · solicitud y alcance del vínculo',
  alcance: 'Las dos máquinas del vínculo: la solicitud que se resuelve una sola vez y el alcance que se pausa, se reanuda y se finaliza.',
  fuente: 'packages/domain/src/vinculo.ts (TRANSICIONES_DE_SOLICITUD_DE_VINCULO y TRANSICIONES_DE_ALCANCE_DE_VINCULO)',
  estado: 'implementado',
  ancho: 750,
  alto: 456,
};

export function dibujar(L) {
  const estado = (id, cx, cy, nombre, w = 112) => L.redondeado({ id, x: cx - w / 2, y: cy - 17, w, h: 34, titulo: nombre, radio: 14 });
  const t = (opciones) => L.conector({ fin: 'flecha', ruta: 'recta', ...opciones });

  // ─── Solicitud de vínculo ───────────────────────────────────────────────────────────────────
  L.marco({ id: 'mS', x: 4, y: 4, w: 366, h: 412, titulo: 'Solicitud de vínculo', subtitulo: 'sus cuatro finales no tienen salida' });
  L.nodoInicial({ id: 'iS', cx: 22, cy: 210 });
  estado('pend', 196, 210, 'PENDIENTE', 116);
  estado('inva', 76, 70, 'INVALIDADA', 118);
  estado('acep', 300, 70, 'ACEPTADA', 112);
  estado('cadu', 76, 350, 'CADUCADA', 112);
  estado('rech', 300, 350, 'RECHAZADA', 116);
  L.conector({ de: 'iS', lado: 'e', a: 'pend', ladoA: 'o', fin: 'flecha', etiqueta: { texto: ['CrearSolicitud', 'profesional o', 'asesorado'], lado: 'arriba', pos: 0.5 } });
  const r = (a, texto, lado) => L.relacion({ de: 'pend', a, fin: 'flecha', etiqueta: texto[0], rotulo: { texto, lado } });
  r('acep', ['AceptarSolicitud', 'asesorado'], 'der');
  r('rech', ['RechazarSolicitud', 'asesorado'], 'der');
  r('cadu', ['CaducarSolicitud', 'sistema'], 'izq');
  r('inva', ['InvalidarSolicitud', 'sistema'], 'izq');

  // ─── Alcance del vínculo ────────────────────────────────────────────────────────────────────
  L.marco({ id: 'mA', x: 380, y: 4, w: 366, h: 412, titulo: 'Alcance del vínculo', subtitulo: 'uno por área' });
  L.nodoInicial({ id: 'iA', cx: 450, cy: 66 });
  estado('ok', 450, 176, 'ACEPTADO', 108);
  estado('pau', 666, 176, 'PAUSADO', 104);
  estado('fin', 558, 318, 'FINALIZADO', 116);
  L.nodoFinal({ id: 'fA', cx: 558, cy: 392 });
  L.conector({ de: 'iA', lado: 's', a: 'ok', ladoA: 'n', fin: 'flecha', etiqueta: { texto: ['AceptarAlcanceDeVinculo', 'asesorado'], lado: 'der', auto: true } });
  L.conector({ de: 'ok', lado: 'e', t: 0.3, a: 'pau', ladoA: 'o', tA: 0.3, fin: 'flecha', etiqueta: { texto: ['PausarAlcance'], lado: 'arriba', pos: 0.5 } });
  L.conector({ de: 'pau', lado: 'o', t: 0.7, a: 'ok', ladoA: 'e', tA: 0.7, fin: 'flecha', etiqueta: { texto: ['ReanudarAlcance'], lado: 'abajo', pos: 0.5 } });
  t({ de: 'ok', lado: 's', a: 'fin', ladoA: 'o', tA: 0.5, etiqueta: { texto: ['FinalizarAlcance'], lado: 'izq', auto: true } });
  t({ de: 'pau', lado: 's', a: 'fin', ladoA: 'e', tA: 0.5, etiqueta: { texto: ['FinalizarAlcance'], lado: 'der', auto: true } });
  L.conector({ de: 'fin', lado: 's', a: 'fA', ladoA: 'n', fin: 'flecha' });
  L.nota({ x: 572, y: 40, w: 164, texto: 'Pausar y reanudar: el asesorado o el profesional. Finalizar: cualquiera de los dos o el sistema.' });

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
