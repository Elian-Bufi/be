// Cartera por conjuntos · lámina 1: el recorrido de la cartera, de la pantalla a la base. Fuentes:
// apps/web/src/app/pro/espacio-profesional.tsx (DE_LA_CARTERA), apps/web/src/lib/lista-completa.ts,
// apps/api/src/cartera/cartera.controller.ts y lectura-cartera.ts, apps/api/src/autorizacion/pdp.service.ts.
export const meta = {
  id: 'CA-01',
  titulo: 'De la pantalla a la base: cómo se construye la cartera',
  alcance: 'Una página de pendientes es cuatro pasos; el website pide hasta cuatro páginas seguidas, y cada una repite los pasos.',
  fuente: 'apps/web/src/app/pro/espacio-profesional.tsx · apps/api/src/cartera/lectura-cartera.ts',
  estado: 'implementado',
  ancho: 750,
  alto: 330,
};

export function dibujar(L) {
  // Fila 1: quién pide y quién atiende.
  L.persona({ id: 'pro', x: 4, y: 4, w: 118, titulo: 'Profesional', descripcion: 'Abre el espacio profesional.' });
  L.caja({ id: 'web', x: 150, y: 4, w: 176, titulo: 'Website · Pendientes', tecnologia: 'espacio-profesional.tsx', descripcion: 'Pide GET /me/portfolio de a 50 y hasta 4 páginas seguidas; «Ver más» pide otras 4.' });
  L.caja({ id: 'ctl', x: 354, y: 4, w: 176, titulo: 'CarteraController', tecnologia: 'API-CAR-01', descripcion: 'SesionGuard autentica; valida la query (límite, cursor, filtros); límite por actor.' });
  L.caja({ id: 'leer', x: 558, y: 4, w: 188, titulo: 'leerCartera', tecnologia: 'lectura-cartera.ts', descripcion: 'Los cuatro pasos de abajo, en este orden, en cada página.', enfasis: true });
  L.conector({ de: 'pro', lado: 'e', a: 'web', ladoA: 'o' });
  L.conector({ de: 'web', lado: 'e', a: 'ctl', ladoA: 'o', etiqueta: 'HTTP' });
  L.conector({ de: 'ctl', lado: 'e', a: 'leer', ladoA: 'o' });

  // Fila 2: los cuatro pasos.
  const w = 176;
  const xs = [4, 192, 380, 568];
  const pasos = [
    ['p1', '1 · Los vínculos', 'Una consulta: los alcances ACEPTADO del profesional, hasta 200 personas.'],
    ['p2', '2 · El PDP, por persona', 'decidirPorAlcance: bloqueo compartido, hechos, 3 filas de decisión, COMMIT. Con 200 personas, 200 veces.'],
    ['p3', '3 · Los hechos', 'Una transacción de lectura: plan, borrador, Proceso, revisión, solicitud, actividad. Acá cambia la propuesta.'],
    ['p4', '4 · Orden y página', 'ordenarPendientes (dominio), la página pedida y el cursor del último ítem. En memoria.'],
  ];
  pasos.forEach(([id, t, d], i) => L.redondeado({ id, x: xs[i], y: 116, w, h: 84, titulo: t, detalle: d, enfasis: id === 'p3' }));
  L.conector({ de: 'leer', lado: 's', a: 'p1', ladoA: 'n', via: [[652, 104], [92, 104]] });
  L.conector({ de: 'p1', lado: 'e', a: 'p2', ladoA: 'o' });
  L.conector({ de: 'p2', lado: 'e', a: 'p3', ladoA: 'o' });
  L.conector({ de: 'p3', lado: 'e', a: 'p4', ladoA: 'o' });

  // Fila 3: la base y lo que vuelve.
  L.cilindro({ id: 'bd', x: 192, y: 226, w: 364, titulo: 'PostgreSQL', tecnologia: 'una sola base', descripcion: 'Paso 1: 1 sentencia · paso 2: 5 por persona · paso 3: según la versión.' });
  L.conector({ de: 'p1', lado: 's', a: 'bd', ladoA: 'n', tA: 0.12, fin: 'flecha', inicio: 'flecha' });
  L.conector({ de: 'p2', lado: 's', a: 'bd', ladoA: 'n', tA: 0.42, fin: 'flecha', inicio: 'flecha' });
  L.conector({ de: 'p3', lado: 's', a: 'bd', ladoA: 'n', tA: 0.78, fin: 'flecha', inicio: 'flecha' });
  L.nota({ x: 568, y: 226, w: 178, titulo: 'Lo que vuelve', texto: 'Una página: items (hasta 50), partialView, today y page (nextCursor, hasMore). La página siguiente repite los cuatro pasos.' });
}
