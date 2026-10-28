// Guía central · nivel 3: dónde se decide el acceso. El PdpGuard arma los hechos, el PDP bloquea lo que podría cortar
// el acceso, lee los hechos en una sola consulta y evalúa las siete dimensiones (función pura del dominio); permitida o
// denegada, la decisión queda guardada. Fuentes: apps/api/src/autorizacion/pdp.guard.ts y pdp.service.ts,
// packages/domain/src/autorizacion.ts (evaluarAutorizacion), migración 20261003000000_pdp_bloqueos_en_una_llamada.
export const meta = {
  id: 'G-07',
  titulo: 'El PDP: siete dimensiones, una decisión guardada',
  alcance: 'Cada operación sobre datos de una persona pasa por el mismo punto de decisión, que no confía en nada que diga el cliente.',
  fuente: 'apps/api/src/autorizacion · packages/domain/src/autorizacion.ts',
  estado: 'implementado',
  ancho: 750,
  alto: 316,
};

export function dibujar(L) {
  const fila = [
    ['pedido', 'Un pedido protegido', 'Por ejemplo, API-PRJ-01 con la sesión del profesional.', 4, 150],
    ['guard', 'PdpGuard', 'Antes del controlador: pide la decisión al PDP.', 182, 150],
    ['bloqueo', 'Bloquea lo que corta', 'Toma, en modo compartido, las filas que podrían cortar el acceso.', 360, 186],
    ['lee', 'Lee los hechos', 'Una sola consulta y sin caché: cuentas, verificación, vínculo, autorización.', 574, 172],
  ];
  for (const [id, titulo, detalle, x, w] of fila) L.redondeado({ id, x, y: 4, w, h: 74, titulo, detalle });
  L.conector({ de: 'pedido', lado: 'e', a: 'guard', ladoA: 'o' });
  L.conector({ de: 'guard', lado: 'e', a: 'bloqueo', ladoA: 'o' });
  L.conector({ de: 'bloqueo', lado: 'e', a: 'lee', ladoA: 'o' });

  L.marco({ id: 'evaluar', x: 4, y: 100, w: 742, h: 122, titulo: 'evaluarAutorizacion', subtitulo: 'dominio, función pura: recibe esos hechos y evalúa las siete; ninguna sola autoriza' });
  const dims = [
    ['Rol', 'Profesional, y sobre otra persona.'],
    ['Especialidad', 'Verificado en esa área.'],
    ['Situación', 'Cuentas operativas, no suspendido, habilitado, A3 vigente.'],
    ['Vínculo', 'Alcance ACEPTADO: pausado o finalizado cortan.'],
    ['Consentimiento', 'Autorización VIGENTE, con versión.'],
    ['Finalidad', 'La misma en la operación, el vínculo y la autorización.'],
    ['Alcance', 'El área pedida es la del vínculo.'],
  ];
  const w = 98;
  const g = (742 - 16 - 7 * w) / 6;
  dims.forEach(([t, d], i) => L.redondeado({ id: `d${i}`, x: 12 + i * (w + g), y: 126, w, h: 88, titulo: t, detalle: d, radio: 6 }));

  L.decision({ id: 'decide', cx: 375, cy: 250, w: 30, h: 30 });
  L.conector({ de: 'd3', lado: 's', a: 'decide', ladoA: 'n' });
  L.redondeado({ id: 'si', x: 4, y: 230, w: 300, h: 80, titulo: 'Permitida: las siete favorables', detalle: 'La decisión se guarda en la misma transacción, con la autorización y su versión, y la operación sigue.', tipo: 'persona' });
  L.redondeado({ id: 'no', x: 446, y: 230, w: 300, h: 80, titulo: 'Denegada: alguna desfavorable', detalle: 'La decisión se guarda aparte, con las dimensiones que fallaron; la operación se revierte y responde 404 RESOURCE_NOT_FOUND.', tipo: 'pendiente' });
  L.conector({ de: 'decide', lado: 'o', a: 'si', ladoA: 'e' });
  L.conector({ de: 'decide', lado: 'e', a: 'no', ladoA: 'o' });
}
