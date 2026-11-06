#!/usr/bin/env node
// Las zonas musculares de los ejercicios de la demostración (DL-081): los 12 de WP-06 y los propios del Prof. Martín
// Acosta, desde `zonas-propuestas.json` y por identidad (`ejercicios-de-la-demo.json`).
//
//   node zonas.mjs tabla                                   la propuesta como tabla en Markdown (sin red ni base)
//   node zonas.mjs revisar --destino local|test             solo lee: qué cambiaría en cada ejercicio
//   node zonas.mjs cargar  --destino local|test --operador "<quién>" --fundamento "<por qué>" --confirmo-escritura
//
// - **revisar** (y cualquier modo sin --confirmo-escritura) no escribe nada: inicia sesión con la cuenta PRO_T, valida
//   cada zona con API-ZON-01, resuelve los ejercicios por identidad y compara con sus zonas vigentes (API-EJE-05).
// - **cargar** exige que la propuesta diga «estado»: «REVISADA» (la revisó Dirección) y --confirmo-escritura. Los propios
//   van por la API como PRO_T (API-EJE-04); los del catálogo de todos, con el comando de curaduría de BE
//   (`curaduria-comando.js zonas`), que lee la base del destino. Repetirlo no suma nada.
// Nunca imprime credenciales ni la URL de la base. No corre contra test sin la autorización de Dirección.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { archivoDeTrabajo, CARPETA, claveDe, clienteDe, correrComando, destinoDe, ejerciciosDeLaDemo, ESCRIBIR_EXIGE, leerArgumentos, leerJson, REPO, sesionDeEntrenamiento } from './comun.mjs';

const USO = `Uso:
  node zonas.mjs tabla [--propuesta <json>]
  node zonas.mjs revisar --destino local|test [--propuesta <json>]
  node zonas.mjs cargar  --destino local|test --operador "<quién>" --fundamento "<por qué>" --confirmo-escritura [--propuesta <json>]`;

/** Las 17 zonas, leídas de la fuente del dominio (`zonas-musculares.ts`), para la tabla sin red. */
export function zonasDelDominio() {
  const fuente = fs.readFileSync(path.join(REPO, 'packages/domain/src/zonas-musculares.ts'), 'utf8');
  const zonas = [...fuente.matchAll(/\{ zoneId: '([a-z-]+)', name: '([^']+)', anatomicalViews: \[([^\]]+)\] \}/g)].map((m) => ({ zoneId: m[1], name: m[2], vistas: m[3] }));
  if (zonas.length !== 17) throw new Error(`Se esperaban 17 zonas en el dominio y hay ${zonas.length}.`);
  return zonas;
}

/** La propuesta unida a las identidades, con cada zona como `{ zoneId, role }`. */
export function leerPropuesta(ruta = path.join(CARPETA, 'zonas-propuestas.json')) {
  const propuesta = leerJson(ruta);
  const demo = leerJson(path.join(CARPETA, 'ejercicios-de-la-demo.json'));
  const porClave = new Map(demo.ejercicios.map((e) => [e.clave, e]));
  const ejercicios = propuesta.ejercicios.map((p) => {
    const e = porClave.get(p.clave);
    if (!e) throw new Error(`La propuesta cita «${p.clave}», que no está en ejercicios-de-la-demo.json.`);
    return { ...e, ...p, muscleZones: [...p.principales.map((zoneId) => ({ zoneId, role: 'PRIMARY' })), ...p.secundarias.map((zoneId) => ({ zoneId, role: 'SECONDARY' }))] };
  });
  return { ...propuesta, ejercicios };
}

/** Lo que no pasa en la propuesta: una zona que no es de las 17, repetida o principal y secundaria a la vez. */
export function problemasDeLaPropuesta(propuesta, idsDeZonas) {
  const problemas = [];
  for (const e of propuesta.ejercicios) {
    const vistas = new Set();
    for (const z of e.muscleZones) {
      if (!idsDeZonas.has(z.zoneId)) problemas.push(`${e.nombre}: «${z.zoneId}» no es una de las 17 zonas`);
      if (vistas.has(z.zoneId)) problemas.push(`${e.nombre}: «${z.zoneId}» aparece dos veces`);
      vistas.add(z.zoneId);
    }
  }
  return problemas;
}

const enTexto = (zonas, nombres) => (zonas.length === 0 ? '—' : zonas.map((z) => nombres.get(z.zoneId) ?? z.zoneId).join(', '));

function tabla(opciones) {
  const zonas = zonasDelDominio();
  const nombres = new Map(zonas.map((z) => [z.zoneId, z.name]));
  const propuesta = leerPropuesta(opciones.propuesta);
  const problemas = problemasDeLaPropuesta(propuesta, new Set(nombres.keys()));
  if (problemas.length > 0) throw new Error(problemas.join('\n'));
  const fila = (e) =>
    `| ${e.nombre} | ${e.ambito === 'CATALOGO' ? 'catálogo (WP-06)' : 'propio de Martín Acosta'} | ${enTexto(e.muscleZones.filter((z) => z.role === 'PRIMARY'), nombres)} | ${enTexto(e.muscleZones.filter((z) => z.role === 'SECONDARY'), nombres)} | ${e.nota ?? ''} |`;
  const lineas = [
    `**Estado: ${propuesta.estado}.** ${propuesta.estado === 'REVISADA' ? `Revisada por ${propuesta.revision.por} el ${propuesta.revision.fecha}.` : 'Sin revisar: la herramienta no la carga hasta que Dirección la marque como REVISADA.'}`,
    '',
    '| Ejercicio | De dónde es | Zonas principales | Zonas secundarias | Nota |',
    '|---|---|---|---|---|',
    ...propuesta.ejercicios.map(fila),
  ];
  process.stdout.write(`${lineas.join('\n')}\n`);
}

async function revisar(opciones, { escribir = false } = {}) {
  const d = destinoDe(opciones.destino, USO);
  const api = clienteDe(d.api);
  const token = await sesionDeEntrenamiento(api, d);
  const zonas = (await api.pedir('GET', '/training/muscle-zones', { token })).data;
  const nombres = new Map(zonas.map((z) => [z.zoneId, z.name]));
  const propuesta = leerPropuesta(opciones.propuesta);
  const problemas = problemasDeLaPropuesta(propuesta, new Set(nombres.keys()));
  if (problemas.length > 0) throw new Error(`La propuesta tiene problemas:\n${problemas.join('\n')}`);
  const ejercicios = await ejerciciosDeLaDemo(api, token, d, propuesta);
  const orden = (lista) => [...lista].sort((a, b) => (a.role === b.role ? zonas.findIndex((z) => z.zoneId === a.zoneId) - zonas.findIndex((z) => z.zoneId === b.zoneId) : a.role === 'PRIMARY' ? -1 : 1));
  const plan = ejercicios.map((e) => {
    const despues = orden(e.muscleZones);
    const antes = e.ficha?.muscleZones ?? [];
    const igual = e.ficha && JSON.stringify(antes) === JSON.stringify(despues) && (e.ficha.zonesVersion > 0 ? e.ficha.zonesExerciseVersionId === e.ficha.versionId : despues.length === 0);
    return { ...e, despues, antes, accion: !e.encontrado ? 'NO_ENCONTRADO' : igual ? 'SIN_CAMBIOS' : 'ASIGNAR' };
  });
  for (const p of plan) {
    const marca = { NO_ENCONTRADO: '✗ no está', SIN_CAMBIOS: '=', ASIGNAR: escribir ? '→' : '→ asignaría' }[p.accion];
    process.stdout.write(`${marca}  ${p.nombre} (${p.ambito === 'CATALOGO' ? 'catálogo' : 'propio'}): ${enTexto(p.despues, nombres)}${p.accion === 'ASIGNAR' ? `  (hoy: ${enTexto(p.antes, nombres)})` : ''}${p.nombreDistinto ? `  [en la base se llama «${p.nombreDistinto}»]` : ''}\n`);
  }
  return { d, api, token, plan, propuesta };
}

async function cargar(opciones) {
  if (!opciones['confirmo-escritura'] || !opciones.operador || !opciones.fundamento) throw new Error(`${ESCRIBIR_EXIGE}\n${USO}`);
  const { d, api, token, plan, propuesta } = await revisar(opciones, { escribir: true });
  if (propuesta.estado !== 'REVISADA' || !propuesta.revision?.por || !propuesta.revision?.fecha) {
    throw new Error('La propuesta no está revisada: Dirección tiene que revisarla y marcar «estado»: «REVISADA», con su nombre y la fecha. No se escribió nada.');
  }
  const faltan = plan.filter((p) => p.accion === 'NO_ENCONTRADO');
  if (faltan.length > 0) throw new Error(`No se encontraron por identidad: ${faltan.map((p) => p.nombre).join(', ')}. No se escribió nada.`);
  for (const p of plan.filter((x) => x.accion === 'ASIGNAR' && x.ambito === 'PROPIO')) {
    const cuerpo = { exerciseVersionId: p.ficha.versionId, expectedZonesVersion: p.ficha.zonesVersion, muscleZones: p.despues };
    await api.pedir('PUT', `/training/exercises/${p.exerciseId}/muscle-zones`, { token, cuerpo, clave: claveDe('zonas', p.exerciseId, JSON.stringify(cuerpo)) });
    process.stdout.write(`✓ ${p.nombre}: asignadas por la API (API-EJE-04)\n`);
  }
  const delCatalogo = plan.filter((x) => x.ambito === 'CATALOGO' && x.accion === 'ASIGNAR');
  if (delCatalogo.length > 0) {
    const archivo = archivoDeTrabajo('zonas-del-catalogo.json', { ejercicios: delCatalogo.map((p) => ({ exerciseId: p.exerciseId, muscleZones: p.despues })) });
    const r = correrComando(d, 'zonas', archivo, { operador: opciones.operador, fundamento: opciones.fundamento, escribir: true });
    for (const x of r.resultados) process.stdout.write(`${x.escrito ? '✓' : '='} ${x.nombre}: ${x.escrito ? 'curadas por BE' : 'ya tenía esas zonas'}\n`);
  }
  process.stdout.write('Listo.\n');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const opciones = leerArgumentos(process.argv.slice(2), { modos: ['tabla', 'revisar', 'cargar'], valores: ['destino', 'propuesta', 'operador', 'fundamento'], banderas: ['confirmo-escritura'], uso: USO });
    if (opciones.modo === 'tabla') tabla(opciones);
    else if (opciones.modo === 'revisar') await revisar(opciones);
    else await cargar(opciones);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
