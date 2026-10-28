// Cartera por conjuntos · lámina 4: qué pasa con los permisos y las transacciones. El paso 2 (una transacción por
// persona, con bloqueos compartidos y la decisión registrada) no cambia; la lectura por conjuntos sigue después, en su
// propia transacción, más corta. Fuentes: apps/api/src/autorizacion/pdp.service.ts (decidirPorAlcance,
// be_bloquear_lo_que_corta), prisma/concurrencia.ts, apps/api/src/cartera/lectura-cartera.ts.
export const meta = {
  id: 'CA-04',
  titulo: 'Los permisos no cambian: la decisión sigue siendo por persona, antes de leer',
  alcance: 'Una revocación que llega en el medio espera a la decisión en curso, y la siguiente ya la ve. Igual que antes.',
  fuente: 'apps/api/src/autorizacion/pdp.service.ts · prisma/concurrencia.ts · apps/api/src/cartera/lectura-cartera.ts',
  estado: 'implementado',
  ancho: 750,
  alto: 300,
};

export function dibujar(L) {
  const fila = (y, titulo, subtitulo, lecturaW, lecturaDetalle) => {
    const sufijo = titulo === 'Antes' ? 'a' : 'd';
    L.carril({ id: `c${sufijo}`, x: 4, y, w: 742, h: 96, titulo, subtitulo, wCabecera: 70 });
    const decisiones = ['Ana', 'Bruno', '…', 'Zoe'];
    decisiones.forEach((n, i) => L.redondeado({ id: `${sufijo}${i}`, x: 84 + i * 108, y: y + 14, w: 100, h: 68, titulo: `PDP · ${n}`, detalle: 'BEGIN · bloqueo compartido · hechos · 3 filas · COMMIT', radio: 6 }));
    L.redondeado({ id: `l${sufijo}`, x: 84 + 4 * 108 + 8, y: y + 14, w: lecturaW, h: 68, titulo: 'Lectura', detalle: lecturaDetalle, enfasis: titulo !== 'Antes', radio: 6 });
    for (let i = 0; i < 3; i++) L.conector({ de: `${sufijo}${i}`, lado: 'e', a: `${sufijo}${i + 1}`, ladoA: 'o', fin: 'flecha' });
    L.conector({ de: `${sufijo}3`, lado: 'e', a: `l${sufijo}`, ladoA: 'o', fin: 'flecha' });
  };
  fila(4, 'Antes', 'e4512cb', 222, 'una transacción: ~1.320 sentencias con 200 personas, 880 ms');
  fila(112, 'Después', 'propuesta', 222, 'la misma transacción: ~11 sentencias, cualquiera sea la cantidad de personas');

  // El corte que llega en el medio: la misma regla en las dos filas.
  L.nota({ x: 4, y: 222, w: 362, titulo: 'Un corte en el medio (revocar, pausar, suspender)', texto: 'Toma en modo exclusivo las mismas filas que la decisión toma en modo compartido: espera a que termine la decisión en curso, y la decisión siguiente ya lo ve. Eso es el paso 2, que no cambia.' });
  L.nota({ x: 384, y: 222, w: 362, titulo: 'La lectura nunca decide', texto: 'Lee solo los pares ya permitidos. Si un corte llega durante la lectura, esa página ya estaba decidida (antes y después); la próxima página vuelve a decidir. Lo único que cambia es que la lectura dura menos.' });
}
