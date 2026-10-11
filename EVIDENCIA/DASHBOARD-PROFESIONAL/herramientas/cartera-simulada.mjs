// Una cartera con los siete tipos de pendiente y el aviso de vista parcial, para mirar y comprobar «Pendientes» del
// Espacio profesional (WP-ESCRITORIO-AMABLE, parte 5, E-98).
//
// Los datos de prueba dan dos pendientes (una revisión próxima y un plan en borrador) y dejan en cero las vistas de
// formularios y de evaluaciones. Sumar los otros cinco a los datos principales cambiaría lo que esperan los demás
// recorridos (el Resumen de cada asesorado). Entonces esos tipos se miran con **una respuesta simulada en el
// navegador**: la API y la base no se tocan, y la pantalla la recibe por el mismo camino y la valida con el mismo
// contrato que a una respuesta real (si no lo cumpliera, la pantalla mostraría una falla).
//
// Lo que se ve con esta respuesta es la pantalla, no el sistema: en el acta va como «respuesta simulada».
//
// Uso: `carteraSimulada(estado)` en un recorrido. Sola, escribe el archivo que usa `ver.mjs … #entrega:`:
//   node cartera-simulada.mjs        → $BE_TRABAJO/cartera-simulada.json
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { enTrabajo } from './rutas.mjs';

const ZONA = 'America/Argentina/Buenos_Aires';
const diaMenos = (hoy, n) => new Date(Date.parse(`${hoy}T12:00:00Z`) - n * 86_400_000).toISOString().slice(0, 10);
/** El nombre visible de un asesorado, como lo arma la API: la referencia con los últimos seis caracteres. */
const referencia = (id) => `Asesorado · ${id.slice(-6)}`;

/**
 * Siete pendientes, uno por tipo, en el orden de la urgencia (el que entrega la API), repartidos entre los asesorados
 * del escenario para que «Abrir» lleve a fichas que existen. Dos no tienen ningún registro.
 */
export function carteraSimulada(estado) {
  const hoy = estado.hoy;
  const persona = (id) => ({ identityId: id, displayName: referencia(id) });
  const a = persona(estado.aseId);
  const b = persona(estado.aseBId);
  const c = persona(estado.aseCId ?? estado.aseBId);
  const e = persona(estado.escenarioE?.aseEId ?? estado.aseBId);
  const item = (advisee, domain, kind, view, extra = {}) => ({
    advisee,
    relationshipId: `simulado-${kind}`,
    domain,
    kind,
    since: null,
    daysOverdue: null,
    daysUntil: null,
    lastActivityAt: `${diaMenos(hoy, 1)}T15:00:00.000Z`,
    activityCount: 3,
    open: { view },
    ...extra,
  });
  return {
    data: {
      today: hoy,
      timeZone: ZONA,
      period: { start: null, end: null },
      partialView: true,
      items: [
        item(c, 'training', 'REVIEW_OVERDUE', 'revisiones', { since: diaMenos(hoy, 3), daysOverdue: 3 }),
        item(a, 'nutrition', 'REVIEW_DUE_SOON', 'revisiones', { since: diaMenos(hoy, -2), daysUntil: 2 }),
        item(b, 'nutrition', 'REVIEW_UNDATED', 'revisiones', { since: diaMenos(hoy, 29) }),
        item(a, 'training', 'PLAN_DRAFT_PENDING', 'plan', { since: diaMenos(hoy, 7), lastActivityAt: `${diaMenos(hoy, 2)}T21:30:00.000Z` }),
        item(e, 'nutrition', 'NO_ACTIVE_PLAN', 'plan', { lastActivityAt: null, activityCount: 0 }),
        item(b, 'nutrition', 'FORM_REQUEST_OPEN', 'solicitudes', { since: diaMenos(hoy, 19), lastActivityAt: `${diaMenos(hoy, 3)}T12:00:00.000Z` }),
        item(c, 'anthropometry', 'ANTHRO_DRAFT_PENDING', 'preparacion', { since: diaMenos(hoy, 16), lastActivityAt: null, activityCount: 0 }),
      ],
    },
    page: { limit: 50, nextCursor: null, hasMore: false },
  };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const estado = JSON.parse(fs.readFileSync(enTrabajo('estado.json'), 'utf8'));
  fs.writeFileSync(enTrabajo('cartera-simulada.json'), JSON.stringify(carteraSimulada(estado), null, 2));
  console.log('cartera simulada: siete pendientes, uno por tipo, con el aviso de vista parcial (cartera-simulada.json)');
}
