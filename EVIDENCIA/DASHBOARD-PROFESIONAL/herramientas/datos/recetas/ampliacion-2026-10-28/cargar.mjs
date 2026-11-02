#!/usr/bin/env node
// La carga de la ampliación de las recetas de ejemplo (encargo nocturno de Dirección del 2026-10-28), desde su manifiesto
// (`manifiesto.json`, que arma `armar.mjs`). Tres modos; **por omisión no escribe nada**:
//
//   node cargar.mjs [preparar] [--fotos <carpeta>] [--informe <archivo.json>]
//   node cargar.mjs revisar --origen <API> --cuentas <cuentas.env> [--cuenta PRO_N] [--fotos <carpeta>] [--informe <archivo.json>]
//   node cargar.mjs cargar  --origen <API> --cuentas <cuentas.env> [--cuenta PRO_N] --fotos <carpeta> --estado <carpeta> --confirmo-escritura [--solo-con-foto]
//
// - **preparar** (el modo por omisión) no usa la red: comprueba el paquete contra los datos del catálogo del repositorio
//   (cada alimento con su identidad, su versión, su nombre y su preparación), rehace el cálculo y lo compara con la
//   composición guardada, revisa las fotos que haya en --fotos y dice qué receta está lista para cargar.
// - **revisar** solo lee en la API: inicia una sesión con la cuenta (eso deja la sesión y su auditoría, como cualquier
//   ingreso), mira qué recetas tiene, busca cada alimento en el catálogo de esa API, calcula cada receta con API-REC-07
//   (que no guarda) y lo compara con el cálculo hecho de nuevo y con la composición del manifiesto. No crea ni cambia nada.
// - **cargar** escribe en la cuenta y necesita la autorización de Dirección para esa cuenta y `--confirmo-escritura`.
//   Repite la revisión y, si no hay problemas, crea cada receta que falte y le asocia su foto. Se puede cortar y retomar
//   sin duplicar: una receta que ya está con su nombre no se crea de nuevo (si está con otros ingredientes, no se toca),
//   cada escritura lleva una clave de idempotencia del paquete, la foto se sube una vez por receta y lo hecho queda en
//   --estado. Nunca reemplaza la imagen que ya tiene una receta.
//
// El origen de la API y el archivo de cuentas van siempre explícitos: no hay valores por omisión, así que la herramienta
// no puede caer en silencio en otra API. Las credenciales se leen con `leerCuentas` y nunca se imprimen. Solo módulos
// nativos de Node 22: no necesita compilar el dominio.
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { leerCuentas } from '../../cohorte/destino.mjs';
import { calculoIndependiente, coinciden, leerManifiesto, medidasDeImagen, NUTRIENTES, pedidoDeCalculo, pedidoDeCreacion, problemasDeLaFoto } from '../manifiesto.mjs';
import { exigirOrigen, mismosIngredientes } from '../recetas.mjs';
import { claveDeIdempotencia, fotoDe, ID_DEL_PAQUETE, leerAmpliacion, problemasDeLaAmpliacion } from './ampliacion.mjs';
import { alimentoPorFdc } from './catalogo.mjs';

const USO = `Uso:
  node cargar.mjs [preparar] [--fotos <carpeta>] [--informe <archivo.json>]
  node cargar.mjs revisar --origen <API> --cuentas <cuentas.env> [--cuenta PRO_N] [--fotos <carpeta>] [--informe <archivo.json>]
  node cargar.mjs cargar  --origen <API> --cuentas <cuentas.env> [--cuenta PRO_N] --fotos <carpeta> --estado <carpeta> --confirmo-escritura [--solo-con-foto]
Por omisión («preparar») no usa la red ni escribe. El origen es la API sin ruta (https://…, o http://localhost en local).`;

/** Las recetas que se calculan además con otra cantidad de porciones y con un ingrediente cambiado. */
export const REPRESENTATIVAS = ['R017', 'R034', 'R061'];
/** Los momentos de la carga de una receta en los que una prueba puede cortar la herramienta para simular un corte. */
export const MOMENTOS_DE_CORTE = ['creada', 'intencion', 'subida'];

export function leerArgumentos(argv) {
  const lista = [...argv];
  const modo = lista[0] && !lista[0].startsWith('--') ? lista.shift() : 'preparar';
  const opciones = { modo, cuenta: 'PRO_N' };
  for (let k = 0; k < lista.length; k++) {
    const a = lista[k];
    if (a === '--confirmo-escritura') opciones.confirmoEscritura = true;
    else if (a === '--solo-con-foto') opciones.soloConFoto = true;
    else if (['--origen', '--cuentas', '--cuenta', '--fotos', '--informe', '--estado', '--cortar-en'].includes(a)) {
      const valor = lista[++k];
      if (valor === undefined || valor.startsWith('--')) throw new Error(`Falta el valor de ${a}.\n${USO}`);
      opciones[a.slice(2).replace(/-([a-z])/g, (_, l) => l.toUpperCase())] = valor;
    } else throw new Error(`No conozco «${a}».\n${USO}`);
  }
  if (!['preparar', 'revisar', 'cargar'].includes(modo)) throw new Error(USO);
  if (!/^[A-Z][A-Z0-9_]*$/.test(opciones.cuenta)) throw new Error('--cuenta es el prefijo de la cuenta en el archivo de cuentas (por ejemplo, PRO_N).');
  return opciones;
}

/**
 * El corte para la prueba de reanudación: `--cortar-en R030:subida` termina el proceso de golpe después de ese momento de
 * esa receta, como si se cortara la luz. Solo contra una API local: nunca contra test.
 */
function corteDe(opciones, origen) {
  if (!opciones.cortarEn) return null;
  const local = ['localhost', '127.0.0.1'].includes(new URL(origen).hostname);
  if (!local) throw new Error('--cortar-en es solo para las pruebas, contra una API local.');
  const [codigo, momento] = opciones.cortarEn.split(':');
  if (!/^R\d{3}$/.test(codigo ?? '') || !MOMENTOS_DE_CORTE.includes(momento)) throw new Error(`--cortar-en es «R030:creada», «R030:intencion» o «R030:subida».`);
  return { codigo, momento };
}

const espera = (ms) => new Promise((r) => setTimeout(r, ms));

/** El cliente: reintenta ante un corte de red, un 429 o un 502 a 504, sin repetir una escritura (cada una lleva su clave). */
function clienteDe(origen) {
  async function pedir(metodo, ruta, { token, cuerpo, clave } = {}) {
    const headers = { 'X-BE-Surface': 'WEB' };
    if (token) headers.Authorization = `Bearer ${token}`;
    if (cuerpo !== undefined) headers['Content-Type'] = 'application/json';
    if (clave) headers['Idempotency-Key'] = clave;
    for (let intento = 1; ; intento++) {
      let r;
      try {
        r = await fetch(`${origen}/api/v1${ruta}`, { method: metodo, headers, body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo) });
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

async function iniciarSesion(api, opciones) {
  if (!opciones.cuentas) throw new Error(`Falta --cuentas: el archivo de cuentas va siempre explícito.\n${USO}`);
  if (!fs.existsSync(opciones.cuentas)) throw new Error(`No existe ${opciones.cuentas}.`);
  const c = leerCuentas({ cuentas: opciones.cuentas });
  const correo = c[`${opciones.cuenta}_CORREO`];
  const clave = c[`${opciones.cuenta}_CLAVE`];
  if (!correo || !clave) throw new Error(`El archivo de cuentas no tiene la cuenta ${opciones.cuenta} (${opciones.cuenta}_CORREO y ${opciones.cuenta}_CLAVE).`);
  const r = await api.pedir('POST', '/auth/sessions', { cuerpo: { method: 'LOCAL', identifier: correo, credential: clave } });
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

/** Si la composición guardada en el manifiesto es la del cálculo, nutriente por nutriente, en el total y por porción. */
function diferenciasConElManifiesto(receta, calculo, etiqueta) {
  const d = [];
  for (const [parte, propio] of [
    ['total', calculo.total],
    ['porPorcion', calculo.porPorcion],
  ])
    for (const n of NUTRIENTES) if (!coinciden(String(receta.composicion[parte][n]), propio[n])) d.push(`${etiqueta} ${parte}.${n}: el manifiesto dice ${receta.composicion[parte][n]}, el cálculo ${propio[n]}`);
  return d;
}

function fotosDe(carpeta) {
  if (carpeta === null || carpeta === undefined) return { hayCarpeta: false, archivos: [], texto: 'no se pasó --fotos' };
  if (!fs.existsSync(carpeta)) return { hayCarpeta: false, archivos: [], texto: `no existe: ${carpeta}` };
  return { hayCarpeta: true, archivos: fs.readdirSync(carpeta), texto: carpeta };
}

function revisarFoto(receta, carpeta, fotos) {
  const archivo = fotos.hayCarpeta ? fotoDe(receta, fotos.archivos) : null;
  const problemas = archivo ? problemasDeLaFoto(fs.readFileSync(path.join(carpeta, archivo)), archivo) : [];
  return { foto: archivo && problemas.length === 0 ? archivo : null, problemasDeFoto: problemas };
}

/** «preparar»: sin red ni escritura. Lo que se puede comprobar con los datos del repositorio. */
export function preparar(opciones = {}, { escribir = console.log } = {}) {
  const manifiesto = leerAmpliacion();
  const deForma = problemasDeLaAmpliacion(manifiesto, leerManifiesto());
  const fotos = fotosDe(opciones.fotos);
  const recetas = manifiesto.recetas.map((receta) => {
    const problemas = [];
    for (const i of receta.ingredientes) {
      const a = alimentoPorFdc(i.fdcId);
      if (!a) problemas.push(`${i.nombre}: el FDC ${i.fdcId} no está en los datos del catálogo`);
      else if (a.catalogItemId !== i.catalogItemId || a.catalogItemVersionId !== i.catalogItemVersionId || a.nombre !== i.nombre || a.preparacionDeLaFuente !== i.preparacionDeLaFuente)
        problemas.push(`${i.nombre}: no es el alimento que sembró la migración (identidad, versión, nombre o preparación)`);
    }
    const composicionDe = (i) => alimentoPorFdc(i.fdcId)?.composicion ?? null;
    const diferencias = problemas.length === 0 ? diferenciasConElManifiesto(receta, calculoIndependiente(receta, composicionDe), 'cálculo local') : [];
    return { codigo: receta.codigo, nombre: receta.nombre, problemas: [...problemas, ...diferencias], listaParaCargar: problemas.length === 0 && diferencias.length === 0, ...revisarFoto(receta, opciones.fotos, fotos), fotoEsperada: receta.foto.archivo };
  });
  const resumen = {
    paquete: ID_DEL_PAQUETE,
    modo: 'preparar (sin red, sin escribir)',
    revisadoEl: new Date().toISOString(),
    problemasDelPaquete: deForma,
    preparadas: recetas.length,
    listasParaCargar: recetas.filter((r) => r.listaParaCargar).length,
    conFoto: recetas.filter((r) => r.foto).length,
    carpetaDeFotos: fotos.texto,
  };
  for (const r of recetas) {
    escribir(`${r.codigo} ${r.nombre}: ${r.listaParaCargar ? 'lista para cargar' : 'NO ESTÁ LISTA'} · ${r.foto ? `foto ${r.foto}` : `falta la foto ${r.fotoEsperada}`}`);
    for (const p of [...r.problemas, ...r.problemasDeFoto]) escribir(`   - ${p}`);
  }
  for (const p of deForma) escribir(`Paquete: ${p}`);
  escribir(`\nPreparadas ${resumen.preparadas} · listas para cargar ${resumen.listasParaCargar} · con foto ${resumen.conFoto}. Fotos: ${resumen.carpetaDeFotos}. No se usó la red ni se escribió nada.`);
  const informe = { resumen, recetas };
  if (opciones.informe) fs.writeFileSync(opciones.informe, `${JSON.stringify(informe, null, 2)}\n`);
  return informe;
}

/** Cada alimento del manifiesto, tal como está hoy en el catálogo de la cuenta (el buscador del website). */
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
  const manifiesto = leerAmpliacion();
  const deForma = problemasDeLaAmpliacion(manifiesto, leerManifiesto());
  if (deForma.length > 0) throw new Error(`El paquete tiene problemas:\n- ${deForma.join('\n- ')}`);
  const api = clienteDe(origen);
  escribir(`Revisión de solo lectura contra ${origen} (cuenta ${opciones.cuenta}). No crea ni cambia nada.`);
  const token = await iniciarSesion(api, opciones);
  const existentes = await recetasDeLaCuenta(api, token);
  const porNombre = new Map(existentes.map((x) => [x.name, x]));
  const alimentos = await alimentosEnElCatalogo(api, token, manifiesto);
  const fotos = fotosDe(opciones.fotos);

  const recetas = [];
  for (const receta of manifiesto.recetas) {
    const problemas = receta.ingredientes.flatMap((i) => alimentos.get(i.catalogItemId)?.problemas ?? []);
    const composicionDe = (i) => alimentos.get(i.catalogItemId)?.fila?.composition ?? null;
    const comprobaciones = [];
    let calculo = null;
    if (problemas.length === 0) {
      const casos = [{ nombre: 'la receta', cambios: {} }];
      if (REPRESENTATIVAS.includes(receta.codigo)) {
        casos.push({ nombre: 'con 2 porciones', cambios: { porciones: 2 } });
        casos.push({ nombre: `con 50 g más de ${receta.ingredientes[0].nombre}`, cambios: { ingrediente: 0, gramos: 50 } });
      }
      for (const caso of casos) {
        const r = await api.pedir('POST', '/nutrition/recipe-calculations', { token, cuerpo: pedidoDeCalculo(receta, caso.cambios) });
        const independiente = calculoIndependiente(receta, composicionDe, caso.cambios);
        const d = [...diferencias(r.data, independiente), ...(caso.nombre === 'la receta' ? diferenciasConElManifiesto(receta, independiente, 'manifiesto') : [])];
        comprobaciones.push({ caso: caso.nombre, coincide: d.length === 0, diferencias: d });
        if (caso.nombre === 'la receta') calculo = r.data;
      }
    }
    const guardada = porNombre.get(receta.nombre) ?? null;
    recetas.push({
      codigo: receta.codigo,
      nombre: receta.nombre,
      problemas,
      cargable: problemas.length === 0 && comprobaciones.every((c) => c.coincide),
      verificada: comprobaciones.length > 0 && comprobaciones.every((c) => c.coincide),
      comprobaciones,
      porPorcion: calculo ? Object.fromEntries(NUTRIENTES.map((n) => [n, calculo.perServing[n].value])) : null,
      ...revisarFoto(receta, opciones.fotos, fotos),
      fotoEsperada: receta.foto.archivo,
      enLaCuenta: guardada ? { recipeId: guardada.recipeId, conImagen: guardada.image !== null, mismosIngredientes: mismosIngredientes(guardada, receta) } : null,
    });
  }

  const resumen = {
    paquete: ID_DEL_PAQUETE,
    origen,
    revisadoEl: new Date().toISOString(),
    recetasDeLaCuenta: existentes.length,
    recetasDeLaCuentaConImagen: existentes.filter((x) => x.image !== null).length,
    preparadas: manifiesto.recetas.length,
    cargables: recetas.filter((r) => r.cargable).length,
    conFoto: recetas.filter((r) => r.foto).length,
    verificadas: recetas.filter((r) => r.verificada).length,
    yaEnLaCuenta: recetas.filter((r) => r.enLaCuenta).length,
    carpetaDeFotos: fotos.texto,
  };
  for (const r of recetas) {
    const kcal = r.porPorcion?.energyKcal ? `${Math.round(Number(r.porPorcion.energyKcal))} kcal por porción` : 'sin cálculo';
    escribir(`${r.codigo} ${r.nombre}: ${r.cargable ? 'cargable' : 'NO CARGABLE'} · ${kcal} · ${r.verificada ? 'verificada' : 'sin verificar'} · ${r.foto ? `foto ${r.foto}` : `falta la foto ${r.fotoEsperada}`}${r.enLaCuenta ? ' · ya está en la cuenta' : ''}`);
    for (const p of [...r.problemas, ...r.problemasDeFoto, ...r.comprobaciones.flatMap((c) => c.diferencias.map((d) => `${c.caso}: ${d}`))]) escribir(`   - ${p}`);
  }
  escribir(
    `\nPreparadas ${resumen.preparadas} · cargables ${resumen.cargables} · con foto ${resumen.conFoto} · verificadas ${resumen.verificadas} · ya en la cuenta ${resumen.yaEnLaCuenta}. La cuenta tiene ${resumen.recetasDeLaCuenta} recetas (${resumen.recetasDeLaCuentaConImagen} con imagen). Fotos: ${resumen.carpetaDeFotos}.`,
  );
  const informe = { resumen, recetas };
  if (opciones.informe) fs.writeFileSync(opciones.informe, `${JSON.stringify(informe, null, 2)}\n`);
  return { informe, api, token, existentes, manifiesto, origen };
}

const leerEstado = (archivo) => (fs.existsSync(archivo) ? JSON.parse(fs.readFileSync(archivo, 'utf8')) : { paquete: ID_DEL_PAQUETE, recetas: {} });

export async function cargar(opciones, { escribir = console.log } = {}) {
  if (!opciones.confirmoEscritura) throw new Error('«cargar» escribe en la cuenta: hace falta --confirmo-escritura, y antes la autorización de Dirección para esa cuenta.');
  if (!opciones.estado) throw new Error(`Falta --estado: la carpeta (fuera del repo) donde queda lo hecho, para retomar.\n${USO}`);
  if (!opciones.fotos) throw new Error(`Falta --fotos: la carpeta de las fotos (puede no tenerlas todas).\n${USO}`);
  const corte = corteDe(opciones, exigirOrigen(opciones.origen));
  const { informe, api, token, existentes, manifiesto, origen } = await revisar(opciones, { escribir });
  fs.mkdirSync(opciones.estado, { recursive: true });
  const archivoDeEstado = path.join(opciones.estado, `${ID_DEL_PAQUETE}.json`);
  const estado = leerEstado(archivoDeEstado);
  const guardar = () => fs.writeFileSync(archivoDeEstado, `${JSON.stringify(estado, null, 2)}\n`);
  const cortarSi = (codigo, momento) => {
    if (corte && corte.codigo === codigo && corte.momento === momento) {
      escribir(`${codigo}: corte de prueba después de «${momento}».`);
      process.exit(75);
    }
  };
  const porNombre = new Map(existentes.map((x) => [x.name, x]));
  escribir(`\nCarga en ${origen} (cuenta ${opciones.cuenta}).`);

  for (const revisada of informe.recetas) {
    const receta = manifiesto.recetas.find((r) => r.codigo === revisada.codigo);
    const dicho = (texto) => escribir(`${receta.codigo} ${receta.nombre}: ${texto}`);
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
    estado.recetas[receta.codigo] = { ...estado.recetas[receta.codigo], recipeId: guardada.recipeId };
    guardar();
    cortarSi(receta.codigo, 'creada');
    if (guardada.image) {
      dicho('ya tiene su imagen');
      continue;
    }
    if (!revisada.foto) {
      dicho(`sin foto todavía: falta ${receta.foto.archivo}`);
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
    let intento = estado.recetas[receta.codigo]?.intentoDeImagen ?? 1;
    let intencion = (await pedirIntencion(intento)).data;
    estado.recetas[receta.codigo] = { ...estado.recetas[receta.codigo], mediaId: intencion.mediaId, intentoDeImagen: intento, sha256DeLaFoto: huella };
    guardar();
    cortarSi(receta.codigo, 'intencion');
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
    if (!subida.ok) throw new Error(`${receta.codigo}: la subida de la foto respondió ${subida.status}`);
    estado.recetas[receta.codigo] = { ...estado.recetas[receta.codigo], mediaId: intencion.mediaId, intentoDeImagen: intento };
    guardar();
    cortarSi(receta.codigo, 'subida');
    const asociada = await api.pedir('PUT', `/nutrition/recipes/${guardada.recipeId}/image`, {
      token,
      cuerpo: { mediaId: intencion.mediaId, expectedVersion: guardada.version },
      clave: claveDeIdempotencia(receta, 'asociar', intencion.mediaId),
    });
    porNombre.set(receta.nombre, asociada.data);
    estado.recetas[receta.codigo] = { ...estado.recetas[receta.codigo], asociada: true };
    guardar();
    dicho(`con su foto (${revisada.foto})`);
  }
}

// Solo corre si se la llama como programa (la prueba de contenido la importa).
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const opciones = leerArgumentos(process.argv.slice(2));
    if (opciones.modo === 'preparar') {
      const informe = preparar(opciones);
      if (informe.resumen.problemasDelPaquete.length > 0 || informe.resumen.listasParaCargar !== informe.resumen.preparadas) process.exit(1);
    } else if (opciones.modo === 'revisar') await revisar(opciones);
    else await cargar(opciones);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
