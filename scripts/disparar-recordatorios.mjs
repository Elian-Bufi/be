#!/usr/bin/env node
/**
 * La tarea programada de los recordatorios diarios de registro (WP-NOVEDADES-Y-AVISOS, DEUDA_LEGAJO DL-133). La corre
 * Render (servicio cron `be-recordatorios` de render.yaml) a las 15:00 y a las 22:00 de Argentina. 07 §24: «un cron
 * administrado de la plataforma llamando un endpoint interno idempotente».
 * - Solo llama a la API: la API decide la franja por su hora, a quién recordarle y qué avisar. Repetirla no duplica nada.
 * - Necesita `BE_API_URL` y `BE_SECRETO_DE_TAREAS` (el mismo que genera Render para be-api). Nunca los imprime.
 * - Lo que imprime es la respuesta: el día, la franja y cuántos recordatorios y avisos hubo, sin datos de nadie.
 * - Sin dependencias: corre con el `fetch` de Node 22, sin `npm install`.
 */
const base = (process.env.BE_API_URL ?? '').trim().replace(/\/+$/, '');
const secreto = (process.env.BE_SECRETO_DE_TAREAS ?? '').trim();
if (!/^https?:\/\/[a-z0-9.:-]+$/i.test(base) || secreto.length < 32) {
  console.error('Falta BE_API_URL (un origen, sin ruta) o BE_SECRETO_DE_TAREAS (32 caracteres como mínimo).');
  process.exit(1);
}

try {
  const r = await fetch(`${base}/internal/reminder-runs`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${secreto}`, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: '{}',
    redirect: 'manual',
    signal: AbortSignal.timeout(120_000),
  });
  const texto = (await r.text()).slice(0, 600);
  if (!r.ok) {
    console.error(`La corrida de recordatorios respondió ${r.status}.`);
    process.exit(1);
  }
  console.log(texto);
} catch (e) {
  console.error(`La corrida de recordatorios no respondió (${e instanceof Error ? e.name : 'error'}).`);
  process.exit(1);
}
