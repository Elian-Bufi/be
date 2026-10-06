// Recorrido del asesorado por la API local (la que usa la APK nueva), después de recorrido-web.mjs:
// opciones con fotos y macros, registro idempotente, deshacer, rectificar, comida diferente con foto (EXIF con GPS
// eliminado), permisos con otras cuentas, compatibilidad con la APK instalada y receta modificada después.
// Uso: node recorrido-api.mjs registrar|persistencia <origen de la API>
// - «registrar»: todo lo anterior; guarda en api.json los SHA-256 de lo que leyó.
// - «persistencia»: después de reiniciar la API, vuelve a leer las mismas imágenes y compara los SHA-256.
import { REPO, enTrabajo } from './rutas.mjs';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
const require = createRequire(`${REPO}/apps/api/`);
const sharp = require('sharp');
const dominio = require(`${REPO}/packages/domain/dist/index.js`);
const { crearClienteBe, calcularNutrientes, nutrientesDelResultado, mismoValorExacto, HoyResponseSchema, ListaDeIngestasResponseSchema } = dominio;

const [fase = 'registrar', origen = 'http://localhost:3001'] = process.argv.slice(2);
const PAQUETE = `${REPO}/docs/fuente_nutricion/BE_Nutricion_Demo_2026-10-05`;
const alimentos = JSON.parse(fs.readFileSync(`${PAQUETE}/datos/alimentos_usda_100g.json`, 'utf8')).foods;
const recetas = JSON.parse(fs.readFileSync(`${PAQUETE}/datos/recetas_demo.json`, 'utf8')).recipes;
const casos = JSON.parse(fs.readFileSync(`${PAQUETE}/datos/casos_calculo.json`, 'utf8')).numeric_cases;
const estado = JSON.parse(fs.readFileSync(enTrabajo('estado.json'), 'utf8'));
const SALIDA = enTrabajo('api.json');
const CRED = 'clave-sintetica-de-prueba-01';
const apk = crearClienteBe({ baseUrl: `${origen}/api/v1`, superficie: 'APK' });
const web = crearClienteBe({ baseUrl: `${origen}/api/v1`, superficie: 'WEB' });
const clave = () => `e2e-${crypto.randomUUID()}`;
const controles = [];
const control = (nombre, ok, detalle = '') => {
  controles.push({ nombre, ok: !!ok, detalle: String(detalle).slice(0, 600) });
  console.log(`${ok ? '✓' : '✗'} ${nombre}${detalle ? ` · ${String(detalle).slice(0, 220)}` : ''}`);
};
const exigir = (r, que) => {
  if (!r.ok) throw new Error(`${que}: ${r.tipo === 'API' ? `${r.status} ${r.codigo} ${JSON.stringify(r.issues)}` : 'sin respuesta'}`);
  return r.datos;
};
const codigo = (r) => (r.ok ? 'OK' : r.tipo === 'API' ? `${r.status} ${r.codigo}` : 'RED');
const sha = (b) => createHash('sha256').update(b).digest('hex');
const nombreDe = (id) => alimentos.find((a) => a.id === id).name_es;
/** Los bytes de un medio con su acceso firmado, como lo hace la APK (API-MED-03 y la ruta temporal). */
async function bytesDe(token, cliente, medioId) {
  const acceso = await cliente.accederAMedio(token, medioId);
  if (!acceso.ok) return { codigo: codigo(acceso) };
  const r = await fetch(cliente.urlDe(acceso.datos.data.path), { cache: 'no-store' });
  const bytes = Buffer.from(await r.arrayBuffer());
  return { codigo: `${r.status}`, bytes, tipo: r.headers.get('content-type'), cache: r.headers.get('cache-control'), vence: acceso.datos.data.expiresAt, ruta: acceso.datos.data.path };
}
/** ¿Hay un segmento EXIF (APP1 «Exif») en el JPEG? */
const tieneExif = (b) => b.includes(Buffer.from('Exif\0\0', 'latin1'));

// Las sesiones se reusan entre corridas mientras valgan: el login tiene un límite de 5 intentos cada 15 minutos (DL-015).
const SESIONES = enTrabajo('.sesiones.json');
const guardadas = fs.existsSync(SESIONES) ? JSON.parse(fs.readFileSync(SESIONES, 'utf8')) : {};
const sesion = async (cliente, correo) => {
  const previa = guardadas[correo];
  if (previa && (await cliente.consultarCuenta(previa)).ok) return previa;
  const token = exigir(await cliente.iniciarSesion(correo, CRED), `sesión de ${correo}`).data.session.accessToken;
  guardadas[correo] = token;
  fs.writeFileSync(SESIONES, JSON.stringify(guardadas));
  return token;
};
const ase = await sesion(apk, estado.aseCorreo);
const otro = await sesion(apk, estado.otroCorreo);
const pro = await sesion(web, estado.proCorreo);

if (fase === 'persistencia') {
  const previo = JSON.parse(fs.readFileSync(SALIDA, 'utf8'));
  for (const [medioId, esperado] of Object.entries(previo.sha)) {
    const leido = await bytesDe(esperado.lector === 'pro' ? pro : ase, esperado.lector === 'pro' ? web : apk, medioId);
    control(`después de reiniciar la API, ${esperado.que} se lee igual (mismo SHA-256)`, leido.codigo === '200' && sha(leido.bytes) === esperado.sha, `${leido.codigo} ${leido.bytes ? sha(leido.bytes).slice(0, 16) : ''} vs ${esperado.sha.slice(0, 16)}`);
  }
  fs.writeFileSync(enTrabajo('api-persistencia.json'), JSON.stringify({ controles }, null, 2));
  const fallas = controles.filter((c) => !c.ok).length;
  console.log(`${controles.length - fallas}/${controles.length} controles OK`);
  process.exit(fallas ? 1 : 0);
}

const salida = { sha: {}, registros: {} };
try {
  // ─── Preparación: se deshace lo que dejaron corridas anteriores del mismo día (API-ING-06) ──
  const previo = exigir(await apk.hoyConOpciones(ase), 'API-ING-01 previo').data;
  for (const r of previo.records) exigir(await apk.deshacerRegistroDeComida(ase, r.recordId, { reason: 'Corrida anterior del recorrido', expectedVersion: r.version }, clave()), 'deshacer lo previo');
  if (previo.records.length) console.log(`(preparación: se deshicieron ${previo.records.length} registros de una corrida anterior)`);

  // ─── «Hoy» con opciones (API-ING-01) ────────────────────────────────────────────────────────
  const hoy = exigir(await apk.hoyConOpciones(ase), 'API-ING-01').data;
  const comida = (nombre) => hoy.meals.find((m) => m.label === nombre);
  const almuerzo = comida('Almuerzo');
  control('ING-01: el plan está disponible, con la fecha civil y las comidas del plan en su orden', hoy.planState === 'AVAILABLE' && hoy.meals.map((m) => m.label).join(',') === 'Almuerzo,Merienda,Cena', `${hoy.date} ${hoy.timeZone} · ${hoy.meals.map((m) => m.label).join(', ')}`);
  control('Almuerzo: las tres recetas del paquete como opciones, cada una con su imagen de referencia', almuerzo?.options.length === 3 && almuerzo.options.every((o) => o.recipe && o.image), almuerzo?.options.map((o) => `${o.label} (${o.image ? 'con imagen' : 'sin imagen'})`).join(' · '));
  for (const [n, receta] of recetas.entries()) {
    const opcion = almuerzo.options.find((o) => o.recipe?.name === receta.name);
    const base = casos.find((c) => c.recipe_id === receta.id && c.factor === '1' && Object.keys(c.quantity_overrides_g).length === 0);
    const iguales = ['energyKcal', 'carbohydrateG', 'fatG', 'proteinG', 'fiberG'].every((k, i) => opcion && opcion.planned[k].value !== null && mismoValorExacto(opcion.planned[k].value, base.expected[['energy_kcal', 'carbohydrate_g', 'fat_g', 'protein_g', 'fiber_g'][i]]));
    control(`${receta.name}: los macros de las porciones del plan son exactamente los del paquete`, iguales, opcion ? `${opcion.planned.energyKcal.value} kcal (paquete ${base.expected.energy_kcal})` : 'sin opción');
    control(`${receta.name}: los ingredientes con cantidad y estado, y los pasos de la receta`, opcion && opcion.items.length === receta.items.length && opcion.items.every((i) => i.quantity && i.preparationState) && opcion.recipe.steps.length === receta.preparation.length, opcion?.items.map((i) => `${i.name} ${i.quantity?.value} ${i.quantity?.unit}`).join(' · '));
    const img = await bytesDe(ase, apk, opcion.image.mediaId);
    const meta = img.bytes ? await sharp(img.bytes).metadata() : null;
    control(`${receta.name}: el asesorado lee la foto que cargó la profesional (JPEG sin EXIF, ≤ 1600 px, sin caché)`, img.codigo === '200' && img.tipo === 'image/jpeg' && meta?.format === 'jpeg' && !meta.exif && Math.max(meta.width, meta.height) <= 1600 && /no-store/.test(img.cache ?? ''), `${img.codigo} ${img.tipo} ${meta?.width}×${meta?.height} exif=${!!meta?.exif} vence ${img.vence}`);
    if (img.bytes) salida.sha[opcion.image.mediaId] = { sha: sha(img.bytes), que: `la foto de «${receta.name}»`, lector: 'ase' };
    if (n === 0) {
      const venceEn = (new Date(img.vence).getTime() - Date.now()) / 60000;
      control('la ruta de lectura vence en 15 minutos como máximo', venceEn > 0 && venceEn <= 15.1, `${venceEn.toFixed(1)} min`);
      const alterada = await fetch(`${apk.urlDe(img.ruta)}x`, { cache: 'no-store' });
      control('una ruta de lectura alterada responde 404', alterada.status === 404, alterada.status);
    }
  }
  const merienda = comida('Merienda');
  control('Merienda: una sola opción, armada a mano, sin imagen (la APK muestra el ícono)', merienda?.options.length === 1 && merienda.options[0].image === null && merienda.options[0].recipe === null, merienda?.options[0]?.label);
  control('Cena: una sola opción, de receta', comida('Cena')?.options.length === 1);

  // ─── La APK instalada sigue funcionando (API-NUT-14 con su esquema estricto) ──────────────────
  const viejo = await apk.hoyNutricional(ase);
  control('API-NUT-14 (la APK instalada) responde con su forma de siempre: el esquema estricto la acepta, sin recetas', viejo.ok && HoyResponseSchema.safeParse(viejo.datos).success && !JSON.stringify(viejo.datos).includes('"recipe"'), codigo(viejo));

  // ─── Registrar desde el carrusel: idempotente y sin duplicar ──────────────────────────────────
  const [pollo, salmon] = [recetas[0], recetas[1]].map((r) => almuerzo.options.find((o) => o.recipe?.name === r.name));
  const cuerpo = (opcion, consumo) => ({ kind: 'PLAN_OPTION', activePlanId: hoy.plan.planId, dayTypeId: hoy.selectedDayTypeId, mealId: almuerzo.mealId, optionId: opcion.optionId, occurredAt: new Date().toISOString(), consumption: consumo, observation: null });
  const k1 = clave();
  const pedido1 = cuerpo(pollo, { status: 'UNCONFIRMED' });
  const r1 = await apk.registrarComida(ase, pedido1, k1);
  const r1bis = await apk.registrarComida(ase, pedido1, k1);
  const r1otraHora = await apk.registrarComida(ase, { ...pedido1, occurredAt: new Date(Date.now() + 1000).toISOString() }, k1);
  const r1otra = await apk.registrarComida(ase, cuerpo(pollo, { status: 'UNCONFIRMED' }), clave());
  const registro = exigir(r1, 'registro rápido').data;
  control('«Comí esta opción» sin cantidades: «Cantidades sin confirmar», sin macros consumidos', registro.consumption?.status === 'UNCONFIRMED' && registro.consumed === null, codigo(r1));
  control('doble toque o reintento con la misma clave y el mismo cuerpo: el mismo registro', r1bis.ok && r1bis.datos.data.recordId === registro.recordId, codigo(r1bis));
  control('otra pantalla u otro intento (otra clave, mismo contenido): devuelve el registro existente, sin duplicar', r1otra.ok && r1otra.datos.data.recordId === registro.recordId, codigo(r1otra));
  control('la misma clave con otro cuerpo: 409 IDEMPOTENCY_KEY_REUSED (la APK repite el cuerpo idéntico)', codigo(r1otraHora) === '409 IDEMPOTENCY_KEY_REUSED', codigo(r1otraHora));
  const distinto = await apk.registrarComida(ase, cuerpo(salmon, { status: 'UNCONFIRMED' }), clave());
  control('otra opción en la misma comida y día: 409, no se pisa', !distinto.ok && distinto.tipo === 'API' && distinto.status === 409, codigo(distinto));

  // ─── Completar cantidades: porciones del plan confirmadas ────────────────────────────────────
  const conPorciones = exigir(await apk.rectificarCantidades(ase, registro.recordId, { consumption: { status: 'PLAN_PORTIONS' }, expectedVersion: registro.version }, clave()), 'rectificación').data;
  const basePollo = casos.find((c) => c.id === 'BE-DEMO-NUT-001-base');
  control('«Comí las porciones del plan», confirmado: lo consumido se calcula con las porciones del plan', conPorciones.consumption.status === 'PLAN_PORTIONS' && conPorciones.consumption.source === 'RECTIFIED' && mismoValorExacto(conPorciones.consumed?.energyKcal.value ?? 'x', basePollo.expected.energy_kcal), conPorciones.consumed?.energyKcal.value);

  // ─── Deshacer: anulación auditable que libera la comida ──────────────────────────────────────
  const deshecho = exigir(await apk.deshacerRegistroDeComida(ase, registro.recordId, { reason: null, expectedVersion: conPorciones.version }, clave()), 'anulación').data;
  const hoyDespues = exigir(await apk.hoyConOpciones(ase), 'ING-01 después').data;
  const viejoDespues = exigir(await apk.hoyNutricional(ase), 'NUT-14 después').data;
  const respuestaVieja = exigir(await apk.listarMisIngestas(ase), 'NUT-16-LISTA');
  const listaVieja = respuestaVieja.data;
  control('«Deshacer registro»: queda la anulación y la comida se libera', deshecho.annulment !== null && hoyDespues.meals.find((m) => m.label === 'Almuerzo').recordId === null, deshecho.annulment?.annulledAt);
  control('lo deshecho no cuenta en «Hoy» de la APK instalada ni en su lista', !viejoDespues.registeredIntake.some((i) => i.executionId === registro.recordId) && !listaVieja.some((i) => i.executionId === registro.recordId) && ListaDeIngestasResponseSchema.safeParse(respuestaVieja).success);
  const dosVeces = await apk.deshacerRegistroDeComida(ase, registro.recordId, { reason: null, expectedVersion: deshecho.version }, clave());
  control('deshacer dos veces: 409, la anulación es una sola', !dosVeces.ok && dosVeces.tipo === 'API' && dosVeces.status === 409, codigo(dosVeces));

  // ─── Registrar otra vez, con cantidades informadas (vacío no es cero) ─────────────────────────
  const itemDe = (id) => pollo.items.find((i) => i.name === nombreDe(id));
  const informado = {
    status: 'REPORTED',
    items: [
      { itemId: itemDe('arroz_cocido').itemId, quantity: { value: 200, unit: 'g' }, notEaten: false },
      { itemId: itemDe('aceite_oliva').itemId, quantity: null, notEaten: true },
      { itemId: itemDe('pollo_asado').itemId, quantity: null, notEaten: false },
    ],
  };
  const r2 = exigir(await apk.registrarComida(ase, cuerpo(pollo, informado), clave()), 'registro con cantidades').data;
  control('con un ingrediente vacío, la energía consumida queda desconocida y nombra lo que falta (nunca cero)', r2.consumed?.energyKcal.value === null && r2.consumed.energyKcal.missing.some((f) => f.reason === 'SIN_CANTIDAD'), JSON.stringify(r2.consumed?.energyKcal));
  const completo = {
    status: 'REPORTED',
    items: pollo.items.map((i) => (i.name === nombreDe('aceite_oliva') ? { itemId: i.itemId, quantity: null, notEaten: true } : { itemId: i.itemId, quantity: i.name === nombreDe('arroz_cocido') ? { value: 200, unit: 'g' } : i.quantity, notEaten: false })),
  };
  const r3 = exigir(await apk.rectificarCantidades(ase, r2.recordId, { consumption: completo, expectedVersion: r2.version }, clave()), 'rectificación completa').data;
  const local = nutrientesDelResultado(
    calcularNutrientes(
      pollo.items.map((i) => {
        const f = alimentos.find((a) => a.name_es === i.name);
        const ref = { referenceAmount: '100g', energyKcal: f.nutrients_per_100g.energy_kcal, carbohydrateG: f.nutrients_per_100g.carbohydrate_g, fatG: f.nutrients_per_100g.fat_g, proteinG: f.nutrients_per_100g.protein_g, fiberG: f.nutrients_per_100g.fiber_g };
        const c = completo.items.find((x) => x.itemId === i.itemId);
        return { clave: i.itemId, cantidad: c.quantity, composicion: ref, noConsumido: c.notEaten };
      }),
    ),
  );
  control('con todo informado (arroz 200 g, sin aceite), lo consumido coincide con el cálculo del paquete hecho aparte', mismoValorExacto(r3.consumed?.energyKcal.value ?? 'x', local.energyKcal.value), `${r3.consumed?.energyKcal.value} vs ${local.energyKcal.value}`);
  salida.registros.almuerzo = r3.recordId;

  // ─── Comida diferente con foto: EXIF con GPS eliminado, privada, sin macros ───────────────────
  const conGps = await sharp({ create: { width: 1200, height: 900, channels: 3, background: { r: 200, g: 120, b: 60 } } })
    .jpeg({ quality: 90 })
    .withExif({ IFD0: { Make: 'Telefono sintetico', Model: 'Prueba' }, IFD3: { GPSLatitudeRef: 'S', GPSLatitude: '34/1 36/1 0/1', GPSLongitudeRef: 'W', GPSLongitude: '58/1 22/1 0/1' } })
    .toBuffer();
  control('la foto de prueba sale de la cámara sintética con EXIF y GPS', tieneExif(conGps) && !!(await sharp(conGps).metadata()).exif);
  const intencion = exigir(await apk.crearIntencionDeSubida(ase, { purpose: 'MEAL_EVIDENCE', contentType: 'image/jpeg', byteSize: conGps.length, provenance: 'PERSON_PROVIDED', authorship: null }, clave()), 'intención de subida').data;
  const subida = exigir(await apk.subirMedio(intencion.uploadPath, conGps, 'image/jpeg'), 'subida').data;
  const cena = comida('Cena');
  const diferente = exigir(
    await apk.registrarComida(ase, { kind: 'DIFFERENT', activePlanId: hoy.plan.planId, dayTypeId: hoy.selectedDayTypeId, mealId: cena.mealId, occurredAt: new Date().toISOString(), description: 'Una tarta de verdura', approximateQuantity: '2 porciones', mediaIds: [subida.mediaId] }, clave()),
    'comida diferente',
  ).data;
  control('«Comí algo diferente» con texto y foto: guardado, con la comida de contexto y «Macros sin calcular»', diferente.kind === 'DIFFERENT' && diferente.consumed === null && diferente.evidence.length === 1 && diferente.meal?.label === 'Cena', `${diferente.description} · ${diferente.approximateQuantity}`);
  const propia = await bytesDe(ase, apk, subida.mediaId);
  const metaPropia = propia.bytes ? await sharp(propia.bytes).metadata() : null;
  control('la foto guardada no tiene EXIF ni GPS (el servidor la recodificó)', propia.codigo === '200' && !metaPropia?.exif && !tieneExif(propia.bytes), `${propia.codigo} exif=${!!metaPropia?.exif}`);
  salida.sha[subida.mediaId] = { sha: sha(propia.bytes), que: 'la foto privada de la comida diferente', lector: 'ase' };
  const delPro = await bytesDe(pro, web, subida.mediaId);
  control('la profesional del plan ve la foto (vínculo, B2 y A3 vigentes)', delPro.codigo === '200' && sha(delPro.bytes) === sha(propia.bytes), delPro.codigo);
  const deOtro = await bytesDe(otro, apk, subida.mediaId);
  control('otro asesorado no puede leer la foto privada: 404, igual que si no existiera', deOtro.codigo === '404 RESOURCE_NOT_FOUND', deOtro.codigo);
  const registroDeOtro = await apk.consultarRegistroDeComida(otro, diferente.recordId);
  control('otro asesorado no puede ver el registro: 404', codigo(registroDeOtro) === '404 RESOURCE_NOT_FOUND', codigo(registroDeOtro));
  const ajena = await apk.registrarComida(otro, { kind: 'DIFFERENT', activePlanId: hoy.plan.planId, dayTypeId: null, mealId: null, occurredAt: new Date().toISOString(), description: null, approximateQuantity: null, mediaIds: [subida.mediaId] }, clave());
  control('otro asesorado no puede usar una foto ajena en su registro', !ajena.ok, codigo(ajena));
  const comoReceta = await web.asociarImagenDeReceta(pro, Object.values(JSON.parse(fs.readFileSync(enTrabajo('recorrido-web.json'), 'utf8')).recetas)[0].recipeId, { mediaId: subida.mediaId, expectedVersion: 'v-cualquiera' }, clave());
  control('una foto de una comida no se puede usar como imagen de receta', !comoReceta.ok, codigo(comoReceta));

  // Solo foto, y vacío.
  const soloFoto = Buffer.from(await sharp({ create: { width: 640, height: 480, channels: 3, background: { r: 90, g: 160, b: 90 } } }).png().toBuffer());
  const i2 = exigir(await apk.crearIntencionDeSubida(ase, { purpose: 'MEAL_EVIDENCE', contentType: 'image/png', byteSize: soloFoto.length, provenance: 'PERSON_PROVIDED', authorship: null }, clave()), 'intención 2').data;
  const m2 = exigir(await apk.subirMedio(i2.uploadPath, soloFoto, 'image/png'), 'subida 2').data;
  const merendo = await apk.registrarComida(ase, { kind: 'DIFFERENT', activePlanId: hoy.plan.planId, dayTypeId: hoy.selectedDayTypeId, mealId: comida('Merienda').mealId, occurredAt: new Date().toISOString(), description: null, approximateQuantity: null, mediaIds: [m2.mediaId] }, clave());
  control('«Comí algo diferente» solo con foto: guardado', merendo.ok && merendo.datos.data.description === null && merendo.datos.data.evidence.length === 1, codigo(merendo));
  const vacio = await fetch(`${origen}/api/v1/me/nutrition/meal-records`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${ase}`, 'Content-Type': 'application/json', 'Idempotency-Key': clave(), 'X-BE-Surface': 'APK' },
    body: JSON.stringify({ kind: 'DIFFERENT', activePlanId: hoy.plan.planId, dayTypeId: null, mealId: null, occurredAt: new Date().toISOString(), description: null, approximateQuantity: null, mediaIds: [] }),
  });
  control('sin texto ni foto, no se guarda (400)', vacio.status === 400, vacio.status);
  const textoComoPng = Buffer.from('esto no es una imagen');
  const i3 = exigir(await apk.crearIntencionDeSubida(ase, { purpose: 'MEAL_EVIDENCE', contentType: 'image/png', byteSize: textoComoPng.length, provenance: 'PERSON_PROVIDED', authorship: null }, clave()), 'intención 3').data;
  const invalida = await apk.subirMedio(i3.uploadPath, textoComoPng, 'image/png');
  control('un archivo que no es una imagen se rechaza (422) y no queda disponible', !invalida.ok && invalida.tipo === 'API' && invalida.status === 422, codigo(invalida));

  // ─── La receta modificada después no reescribe el registro ni el plan activado ────────────────
  const recetaPollo = Object.values(JSON.parse(fs.readFileSync(enTrabajo('recorrido-web.json'), 'utf8')).recetas)[0].recipeId;
  const actual = exigir(await web.consultarReceta(pro, recetaPollo), 'receta').data;
  const editada = exigir(
    await web.editarReceta(
      pro,
      recetaPollo,
      {
        expectedVersion: actual.version,
        name: actual.name,
        description: actual.description,
        servings: actual.servings,
        steps: actual.steps,
        ingredients: actual.ingredients.map((i) => ({ catalogItemId: i.catalogItemId, catalogItemVersionId: i.catalogItemVersionId, preparationState: i.preparationState, quantity: i.name === nombreDe('arroz_cocido') ? { value: 200, unit: 'g' } : i.quantity })),
      },
      clave(),
    ),
    'edición posterior',
  ).data;
  const despues = exigir(await apk.consultarRegistroDeComida(ase, r3.recordId), 'registro después').data;
  const hoyTrasEditar = exigir(await apk.hoyConOpciones(ase), 'ING-01 tras editar').data;
  const polloEnPlan = hoyTrasEditar.meals.find((m) => m.label === 'Almuerzo').options.find((o) => o.recipe?.name === recetas[0].name);
  control('editar la receta después (arroz 200 g) emite otra versión y no cambia el registro anterior', editada.versionNumber > actual.versionNumber && despues.option.recipe.recipeVersionId === pollo.recipe.recipeVersionId && mismoValorExacto(despues.consumed?.energyKcal.value ?? 'x', r3.consumed?.energyKcal.value ?? 'y'), `versión ${editada.versionNumber}; el registro sigue en la ${despues.option.recipe.versionNumber}`);
  control('el plan activado conserva la versión de la receta que tenía', polloEnPlan.recipe.recipeVersionId === pollo.recipe.recipeVersionId && mismoValorExacto(polloEnPlan.planned.energyKcal.value ?? 'x', basePollo.expected.energy_kcal), polloEnPlan.planned.energyKcal.value);
} catch (e) {
  control('el recorrido terminó sin excepciones', false, e.stack ?? String(e));
} finally {
  salida.controles = controles;
  fs.writeFileSync(SALIDA, JSON.stringify(salida, null, 2));
  const fallas = controles.filter((c) => !c.ok).length;
  console.log(`${controles.length - fallas}/${controles.length} controles OK`);
  process.exit(fallas ? 1 : 0);
}
