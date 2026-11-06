#!/usr/bin/env node
// Las recetas de ejemplo de la cohorte (encargo de Dirección del 2026-10-19, bloque 4), desde el manifiesto congelado
// (`manifiesto.json`): cada ingrediente, un alimento del catálogo por identidad y versión, resuelto a mano y nunca por el
// primer resultado de una búsqueda.
//
//   node recetas.mjs revisar --origen <API> --cuentas <cuentas.env> [--fotos <carpeta>] [--informe <archivo.json>]
//   node recetas.mjs cargar  --origen <API> --cuentas <cuentas.env> --fotos <carpeta> --estado <carpeta> --confirmo-escritura [--solo-con-foto]
//
// - **revisar** solo lee: inicia una sesión con la cuenta PRO_N (Lic. Sofía Paz), mira qué recetas tiene, busca cada
//   alimento en el catálogo (que exista, que sea la versión vigente, de USDA y con el nombre del manifiesto), calcula
//   cada receta con API-REC-07 (que no guarda) y lo compara con el cálculo hecho de nuevo sin la lógica de BE, también
//   con otra cantidad de porciones y con un ingrediente cambiado, y revisa las fotos. No escribe nada.
// - **cargar** escribe en la cuenta: necesita la autorización de Dirección y `--confirmo-escritura`. Repite la revisión y,
//   si no hay problemas, crea cada receta que falte y le asocia su foto. Se puede cortar y retomar: una receta que ya
//   está (por su nombre) no se crea de nuevo, cada escritura lleva una clave de idempotencia que sale de lo que manda, y
//   lo hecho queda en `--estado`. Sin foto, la receta se carga igual (salvo `--solo-con-foto`) y la foto se asocia en
//   una corrida posterior.
//
// El origen de la API y el archivo de cuentas van siempre explícitos: la herramienta no tiene valores por omisión, así que
// no puede caer en silencio en otra API. Las credenciales se leen con `leerCuentas` y nunca se imprimen. Solo módulos
// nativos de Node 22: no necesita compilar el dominio.
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { leerCuentas } from '../cohorte/destino.mjs';
import {
  calculoIndependiente,
  claveDeIdempotencia,
  coinciden,
  fotoDe,
  leerManifiesto,
  medidasDeImagen,
  NUTRIENTES,
  pedidoDeCalculo,
  pedidoDeCreacion,
  problemasDeLaFoto,
  problemasDelManifiesto,
} from './manifiesto.mjs';

const USO = `Uso:
  node recetas.mjs revisar --origen <API> --cuentas <cuentas.env> [--fotos <carpeta>] [--informe <archivo.json>]
  node recetas.mjs cargar  --origen <API> --cuentas <cuentas.env> --fotos <carpeta> --estado <carpeta> --confirmo-escritura [--solo-con-foto]
El origen es la API sin ruta (https://…, o http://localhost:3001 en local). No hay valores por omisión.`;

/** Las recetas que se calculan además con otra cantidad de porciones y con un ingrediente cambiado. */
export const REPRESENTATIVAS = [1, 9, 13];

export function leerArgumentos(argv) {
  const [modo, ...resto] = argv;
  const opciones = { modo };
  for (let i = 0; i < resto.length; i++) {
    const a = resto[i];
    if (a === '--confirmo-escritura') opciones.confirmoEscritura = true;
    else if (a === '--solo-con-foto') opciones.soloConFoto = true;
    else if (['--origen', '--cuentas', '--fotos', '--informe', '--estado'].includes(a)) opciones[a.slice(2)] = resto[++i];
    else throw new Error(`No conozco «${a}».\n${USO}`);
  }
  if (!['revisar', 'cargar'].includes(modo)) throw new Error(USO);
  return opciones;
}

/** El origen, explícito y sin ruta; https, salvo la API local. */
export function exigirOrigen(origen) {
  if (!origen) throw new Error(`Falta --origen: la API contra la que se trabaja va siempre explícita.\n${USO}`);
  let u;
  try {
    u = new URL(origen);
  } catch {
    throw new Error(`--origen no es una dirección: ${origen}`);
  }
  const local = u.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(u.hostname);
  if (u.protocol !== 'https:' && !local) throw new Error('--origen tiene que ser https (o http://localhost en local).');
  if ((u.pathname !== '/' && u.pathname !== '') || u.search || u.hash) throw new Error('--origen es solo el origen de la API, sin ruta: la herramienta le agrega /api/v1.');
  return u.origin;
}

const espera = (ms) => new Promise((r) => setTimeout(r, ms));

/** El cliente: reintenta ante un corte de red, un 429 o un 502 a 504, sin repetir una escritura (cada una lleva su clave). */
function clienteDe(origen) {
  async function pedir(metodo, ruta, { token, cuerpo, clave, tipo } = {}) {
    const headers = { 'X-BE-Surface': 'WEB' };
    if (token) headers.Authorization = `Bearer ${token}`;
    if (cuerpo !== undefined) headers['Content-Type'] = tipo ?? 'application/json';
    if (clave) headers['Idempotency-Key'] = clave;
    const body = cuerpo === undefined ? undefined : tipo ? cuerpo : JSON.stringify(cuerpo);
    for (let intento = 1; ; intento++) {
      let r;
      try {
        r = await fetch(`${origen}/api/v1${ruta}`, { method: metodo, headers, body });
      } catch (e) {
        if (intento >= 5) throw e;
        await espera(2000 * intento);
        continue;
      }
      const texto = await r.text();
      if (r.status === 429 && intento < 8) {
        await espera(Number(r.headers.get('retry-after') ?? 15) * 1000 + 500);
        continue;
      }
      if (r.status >= 502 && r.status <= 504 && intento < 5) {
        await espera(3000 * intento);
        continue;
      }
      let json = null;
      try {
        json = texto ? JSON.parse(texto) : null;
      } catch {
        json = null;
      }
      if (!r.ok) {
        const e = new Error(`${metodo} ${ruta.replace(/\/media\/uploads\/.*/, '/media/uploads/…')}: ${r.status} ${json?.error?.code ?? ''}`.trim());
        e.status = r.status;
        e.codigo = json?.error?.code ?? null;
        throw e;
      }
      return json;
    }
  }
  return { pedir };
}

async function iniciarSesion(api, archivoDeCuentas) {
  if (!archivoDeCuentas) throw new Error(`Falta --cuentas: el archivo de cuentas de la cohorte va siempre explícito.\n${USO}`);
  if (!fs.existsSync(archivoDeCuentas)) throw new Error(`No existe ${archivoDeCuentas}.`);
  const c = leerCuentas({ cuentas: archivoDeCuentas });
  if (!c.PRO_N_CORREO || !c.PRO_N_CLAVE) throw new Error('El archivo de cuentas no tiene la cuenta PRO_N (la profesional de Nutrición).');
  const r = await api.pedir('POST', '/auth/sessions', { cuerpo: { method: 'LOCAL', identifier: c.PRO_N_CORREO, credential: c.PRO_N_CLAVE } });
  return r.data.session.accessToken;
}

async function recetasDeLaCuenta(api, token) {
  const recetas = [];
  let cursor = null;
  do {
    const r = await api.pedir('GET', `/nutrition/recipes?limit=50${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`, { token });
    recetas.push(...r.data);
    cursor = r.page?.nextCursor ?? null;
  } while (cursor);
  return recetas;
}

/** Si una receta guardada tiene exactamente los ingredientes del manifiesto (versión, cantidad y estado), en orden. */
export function mismosIngredientes(guardada, receta) {
  const a = guardada.ingredients.map((i) => [i.catalogItemVersionId, i.quantity.value, i.quantity.unit, i.preparationState]);
  const b = receta.ingredientes.map((i) => [i.catalogItemVersionId, i.cantidad.valor, i.cantidad.unidad, i.estado]);
  return JSON.stringify(a) === JSON.stringify(b) && guardada.servings === receta.porciones;
}

/** Cada alimento del manifiesto, tal como está hoy en el catálogo de la cuenta (buscador del website). */
async function alimentosEnElCatalogo(api, token, manifiesto) {
  const unicos = new Map();
  for (const r of manifiesto.recetas) for (const i of r.ingredientes) unicos.set(i.catalogItemId, i);
  const resultado = new Map();
  for (const i of unicos.values()) {
    const r = await api.pedir('POST', '/nutrition/catalog-items/search', { token, cuerpo: { q: i.nombre, limit: 50 } });
    const fila = r.data.find((x) => x.catalogItemId === i.catalogItemId) ?? null;
    const problemas = [];
    if (!fila) problemas.push(`«${i.nombre}» (FDC ${i.fdcId}) no está en el catálogo de la cuenta`);
    else {
      if (fila.versionId !== i.catalogItemVersionId) problemas.push(`«${i.nombre}» tiene una versión más nueva: «${fila.name}». El manifiesto cita otra: hay que decidir cuál`);
      if (fila.name !== i.nombre) problemas.push(`«${i.nombre}» hoy se llama «${fila.name}»`);
      if (fila.provenance !== 'CONTROLLED_IMPORT' || fila.externalSource?.provider !== 'USDA_FDC_SR_LEGACY' || fila.externalSource?.externalId !== i.fdcId) problemas.push(`«${i.nombre}» no es el registro ${i.fdcId} de USDA (procedencia ${fila.provenance})`);
      if (!fila.available) problemas.push(`«${i.nombre}» no está disponible`);
      if (fila.composition?.referenceAmount !== '100g') problemas.push(`«${i.nombre}» tiene la composición cada ${fila.composition?.referenceAmount}: el manifiesto lo pesa en gramos`);
    }
    resultado.set(i.catalogItemId, { fila, problemas });
  }
  return resultado;
}

/** Compara el cálculo de la API con el independiente, nutriente por nutriente, en el total y por porción. */
function diferencias(deLaApi, independiente) {
  const d = [];
  for (const parte of ['total', 'perServing']) {
    const propio = parte === 'total' ? independiente.total : independiente.porPorcion;
    for (const n of NUTRIENTES) if (!coinciden(deLaApi[parte][n].value, propio[n])) d.push(`${parte}.${n}: la API dice ${deLaApi[parte][n].value}, el independiente ${propio[n]}`);
  }
  return d;
}

export async function revisar(opciones, { escribir = console.log } = {}) {
  const origen = exigirOrigen(opciones.origen);
  const manifiesto = leerManifiesto();
  const deForma = problemasDelManifiesto(manifiesto);
  if (deForma.length > 0) throw new Error(`El manifiesto tiene problemas:\n- ${deForma.join('\n- ')}`);
  const api = clienteDe(origen);
  escribir(`Revisión de solo lectura contra ${origen} (cuenta PRO_N). No escribe nada.`);
  const token = await iniciarSesion(api, opciones.cuentas);

  const existentes = await recetasDeLaCuenta(api, token);
  const porNombre = new Map(existentes.map((x) => [x.name, x]));
  const alimentos = await alimentosEnElCatalogo(api, token, manifiesto);

  let fotos = [];
  const carpetaDeFotos = opciones.fotos ?? null;
  const hayCarpeta = carpetaDeFotos !== null && fs.existsSync(carpetaDeFotos);
  if (hayCarpeta) fotos = fs.readdirSync(carpetaDeFotos);

  const recetas = [];
  for (const receta of manifiesto.recetas) {
    const problemas = receta.ingredientes.flatMap((i) => alimentos.get(i.catalogItemId)?.problemas ?? []);
    const composicionDe = (i) => alimentos.get(i.catalogItemId)?.fila?.composition ?? null;
    const comprobaciones = [];
    let calculo = null;
    if (problemas.length === 0) {
      const casos = [{ nombre: 'la receta', cambios: {} }];
      if (REPRESENTATIVAS.includes(receta.numero)) {
        casos.push({ nombre: 'con 2 porciones', cambios: { porciones: 2 } });
        casos.push({ nombre: `con 50 g más de ${receta.ingredientes[0].nombre}`, cambios: { ingrediente: 0, gramos: 50 } });
      }
      for (const caso of casos) {
        const r = await api.pedir('POST', '/nutrition/recipe-calculations', { token, cuerpo: pedidoDeCalculo(receta, caso.cambios) });
        const d = diferencias(r.data, calculoIndependiente(receta, composicionDe, caso.cambios));
        comprobaciones.push({ caso: caso.nombre, coincide: d.length === 0, diferencias: d });
        if (caso.nombre === 'la receta') calculo = r.data;
      }
    }
    const archivo = hayCarpeta ? fotoDe(receta, fotos) : null;
    const problemasDeFoto = archivo ? problemasDeLaFoto(fs.readFileSync(path.join(carpetaDeFotos, archivo)), archivo) : [];
    const guardada = porNombre.get(receta.nombre) ?? null;
    recetas.push({
      numero: receta.numero,
      nombre: receta.nombre,
      problemas,
      cargable: problemas.length === 0 && comprobaciones.every((c) => c.coincide),
      verificada: comprobaciones.length > 0 && comprobaciones.every((c) => c.coincide),
      comprobaciones,
      porPorcion: calculo ? Object.fromEntries(NUTRIENTES.map((n) => [n, calculo.perServing[n].value])) : null,
      foto: archivo && problemasDeFoto.length === 0 ? archivo : null,
      problemasDeFoto,
      fotoEsperada: receta.imagen,
      enLaCuenta: guardada ? { recipeId: guardada.recipeId, conImagen: guardada.image !== null, mismosIngredientes: mismosIngredientes(guardada, receta) } : null,
    });
  }

  const resumen = {
    origen,
    revisadoEl: new Date().toISOString(),
    recetasDeLaCuenta: existentes.length,
    recetasDeLaCuentaConImagen: existentes.filter((x) => x.image !== null).length,
    preparadas: manifiesto.recetas.length,
    cargables: recetas.filter((r) => r.cargable).length,
    conFoto: recetas.filter((r) => r.foto).length,
    verificadas: recetas.filter((r) => r.verificada).length,
    yaEnLaCuenta: recetas.filter((r) => r.enLaCuenta).length,
    carpetaDeFotos: carpetaDeFotos === null ? 'no se pasó --fotos' : hayCarpeta ? carpetaDeFotos : `no existe: ${carpetaDeFotos}`,
  };
  for (const r of recetas) {
    const kcal = r.porPorcion?.energyKcal ? `${Math.round(Number(r.porPorcion.energyKcal))} kcal por porción` : 'sin cálculo';
    escribir(`${String(r.numero).padStart(2, '0')} ${r.nombre}: ${r.cargable ? 'cargable' : 'NO CARGABLE'} · ${kcal} · ${r.verificada ? 'verificada' : 'sin verificar'} · ${r.foto ? `foto ${r.foto}` : `falta la foto ${r.fotoEsperada}`}${r.enLaCuenta ? ' · ya está en la cuenta' : ''}`);
    for (const p of [...r.problemas, ...r.problemasDeFoto, ...r.comprobaciones.flatMap((c) => c.diferencias.map((d) => `${c.caso}: ${d}`))]) escribir(`   - ${p}`);
  }
  escribir(
    `\nPreparadas ${resumen.preparadas} · cargables ${resumen.cargables} · con foto ${resumen.conFoto} · verificadas ${resumen.verificadas} · ya en la cuenta ${resumen.yaEnLaCuenta}. La cuenta tiene ${resumen.recetasDeLaCuenta} recetas (${resumen.recetasDeLaCuentaConImagen} con imagen). Fotos: ${resumen.carpetaDeFotos}.`,
  );
  const informe = { resumen, recetas };
  if (opciones.informe) fs.writeFileSync(opciones.informe, `${JSON.stringify(informe, null, 2)}\n`);
  return { informe, api, token, existentes, manifiesto, origen };
}

const leerEstado = (archivo) => (fs.existsSync(archivo) ? JSON.parse(fs.readFileSync(archivo, 'utf8')) : { recetas: {} });

export async function cargar(opciones, { escribir = console.log } = {}) {
  if (!opciones.confirmoEscritura) throw new Error('«cargar» escribe en la cuenta: hace falta --confirmo-escritura, y antes la autorización de Dirección para esa cuenta.');
  if (!opciones.estado) throw new Error(`Falta --estado: la carpeta (fuera del repo) donde queda lo hecho, para retomar.\n${USO}`);
  if (!opciones.fotos) throw new Error(`Falta --fotos: la carpeta de las fotos (puede no tenerlas todas).\n${USO}`);
  const { informe, api, token, existentes, manifiesto, origen } = await revisar(opciones, { escribir });
  fs.mkdirSync(opciones.estado, { recursive: true });
  const archivoDeEstado = path.join(opciones.estado, 'recetas-de-ejemplo.json');
  const estado = leerEstado(archivoDeEstado);
  const guardar = () => fs.writeFileSync(archivoDeEstado, `${JSON.stringify(estado, null, 2)}\n`);
  const porNombre = new Map(existentes.map((x) => [x.name, x]));
  escribir(`\nCarga en ${origen} (cuenta PRO_N).`);

  for (const revisada of informe.recetas) {
    const receta = manifiesto.recetas.find((r) => r.numero === revisada.numero);
    const clave = String(receta.numero).padStart(2, '0');
    const dicho = (texto) => escribir(`${clave} ${receta.nombre}: ${texto}`);
    if (!revisada.cargable) {
      dicho('no se carga (ver la revisión)');
      continue;
    }
    if (opciones.soloConFoto && !revisada.foto) {
      dicho('sin foto: no se carga (--solo-con-foto)');
      continue;
    }
    let guardada = porNombre.get(receta.nombre) ?? null;
    if (guardada && !mismosIngredientes(guardada, receta)) {
      dicho('ya está en la cuenta con otros ingredientes o porciones: no se toca');
      continue;
    }
    if (!guardada) {
      const cuerpo = pedidoDeCreacion(receta);
      guardada = (await api.pedir('POST', '/nutrition/recipes', { token, cuerpo, clave: claveDeIdempotencia(receta, 'receta', cuerpo) })).data;
      porNombre.set(receta.nombre, guardada);
      dicho('creada');
    }
    estado.recetas[clave] = { ...estado.recetas[clave], recipeId: guardada.recipeId };
    guardar();
    if (guardada.image) {
      dicho('ya tiene su imagen');
      continue;
    }
    if (!revisada.foto) {
      dicho(`sin foto todavía: falta ${receta.imagen}`);
      continue;
    }
    const bytes = fs.readFileSync(path.join(opciones.fotos, revisada.foto));
    const { tipo } = medidasDeImagen(bytes);
    const huella = createHash('sha256').update(bytes).digest('hex');
    const pedirIntencion = (intento) =>
      api.pedir('POST', '/me/media/upload-intents', {
        token,
        cuerpo: { purpose: 'RECIPE_REFERENCE', contentType: tipo, byteSize: bytes.length, provenance: manifiesto.imagenes.procedencia, authorship: manifiesto.imagenes.autoria },
        clave: claveDeIdempotencia(receta, `imagen-${intento}`, huella),
      });
    // La intención repetida devuelve el mismo medio. Si su ruta de subida venció (10 minutos) y el medio no llegó a
    // subirse, se pide otra intención, con otra clave.
    let intento = estado.recetas[clave]?.intentoDeImagen ?? 1;
    let intencion = (await pedirIntencion(intento)).data;
    let subida = await fetch(`${origen}/api/v1${intencion.uploadPath}`, { method: 'PUT', headers: { 'Content-Type': tipo, 'X-BE-Surface': 'WEB' }, body: bytes });
    if (subida.status === 404) {
      const disponible = await api.pedir('GET', `/media/${intencion.mediaId}/access`, { token }).then(
        () => true,
        () => false,
      );
      if (!disponible) {
        intento += 1;
        intencion = (await pedirIntencion(intento)).data;
        subida = await fetch(`${origen}/api/v1${intencion.uploadPath}`, { method: 'PUT', headers: { 'Content-Type': tipo, 'X-BE-Surface': 'WEB' }, body: bytes });
      } else subida = { ok: true, status: 200 };
    }
    if (!subida.ok) throw new Error(`${clave}: la subida de la foto respondió ${subida.status}`);
    estado.recetas[clave] = { ...estado.recetas[clave], mediaId: intencion.mediaId, intentoDeImagen: intento };
    guardar();
    const asociada = await api.pedir('PUT', `/nutrition/recipes/${guardada.recipeId}/image`, {
      token,
      cuerpo: { mediaId: intencion.mediaId, expectedVersion: guardada.version },
      clave: claveDeIdempotencia(receta, 'asociar', intencion.mediaId),
    });
    porNombre.set(receta.nombre, asociada.data);
    dicho(`con su foto (${revisada.foto})`);
  }
}

// Solo corre si se la llama como programa (la prueba de contenido la importa).
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const opciones = leerArgumentos(process.argv.slice(2));
    if (opciones.modo === 'revisar') await revisar(opciones);
    else await cargar(opciones);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
