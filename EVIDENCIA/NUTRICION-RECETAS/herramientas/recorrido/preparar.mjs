// Prepara, por la API pública, las cuentas sintéticas del recorrido de Nutrición con recetas.
// - fase «cuentas»: registra la profesional y el asesorado (como cualquier cuenta) y guarda sus identidades en estado.json;
//   después se reinicia la API con BE_DEMO_PROFESIONALES=<id>|NUTRICION|SANITARIO|… para que la verifique (DL-036).
// - fase «vinculo»: vínculo de Nutrición aceptado, B2 y A3 del asesorado, evaluación y objetivo vigente.
// Nada se escribe en la base por fuera de la API. Las credenciales son sintéticas y no se imprimen.
// Uso: node preparar.mjs cuentas|vinculo <origen de la API>
import { REPO, enTrabajo } from './rutas.mjs';
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(`${REPO}/packages/domain/`);
const { crearClienteBe, VERSION_VIGENTE } = require(`${REPO}/packages/domain/dist/index.js`);

const [fase, origen = 'http://localhost:3001'] = process.argv.slice(2);
const ESTADO = enTrabajo('estado.json');
const CRED = 'clave-sintetica-de-prueba-01';
const api = crearClienteBe({ baseUrl: `${origen}/api/v1`, superficie: 'WEB' });
const apk = crearClienteBe({ baseUrl: `${origen}/api/v1`, superficie: 'APK' });
const clave = () => `e2e-${crypto.randomUUID()}`;
const exigir = (r, que) => {
  if (!r.ok) throw new Error(`${que}: ${r.tipo === 'API' ? `${r.status} ${r.codigo} ${JSON.stringify(r.issues)}` : 'sin respuesta'}`);
  return r.datos;
};

if (fase === 'cuentas') {
  const sufijo = Date.now().toString(36);
  const proCorreo = `pro-recetas-${sufijo}@example.invalid`;
  const aseCorreo = `ase-recetas-${sufijo}@example.invalid`;
  const otroCorreo = `otro-ase-${sufijo}@example.invalid`;
  const pro = exigir(await api.registrar({ correo: proCorreo, contrasena: CRED }, clave()), 'registro de la profesional');
  const ase = exigir(await apk.registrar({ correo: aseCorreo, contrasena: CRED }, clave()), 'registro del asesorado');
  const otro = exigir(await apk.registrar({ correo: otroCorreo, contrasena: CRED }, clave()), 'registro de otro asesorado');
  fs.writeFileSync(ESTADO, JSON.stringify({ proCorreo, proId: pro.data.identityId, aseCorreo, aseId: ase.data.identityId, otroCorreo, otroId: otro.data.identityId }, null, 2));
  console.log(`BE_DEMO_PROFESIONALES=${pro.data.identityId}|NUTRICION|SANITARIO|Lic. Demo Nutrición`);
} else if (fase === 'vinculo') {
  const estado = JSON.parse(fs.readFileSync(ESTADO, 'utf8'));
  const pro = exigir(await api.iniciarSesion(estado.proCorreo, CRED), 'sesión de la profesional').data.session.accessToken;
  const ase = exigir(await apk.iniciarSesion(estado.aseCorreo, CRED), 'sesión del asesorado').data.session.accessToken;
  const solicitud = exigir(await api.solicitarVinculo(pro, { asesoradoId: estado.aseId, alcance: 'NUTRICION' }, clave()), 'solicitud de vínculo');
  const solicitudId = solicitud.data.relationshipRequestId;
  const aceptada = exigir(await apk.aceptarSolicitud(ase, solicitudId, solicitud.data.version ?? 'v1', clave()), 'aceptación');
  const vinculoId = aceptada.data.relationshipId;
  const requisitos = exigir(await apk.consultarRequisitosDeConsentimiento(ase, vinculoId), 'requisitos de B2');
  exigir(await apk.otorgarConsentimiento(ase, vinculoId, requisitos.data.consentVersion.id, clave()), 'B2');
  const a3 = await fetch(`${origen}/api/v1/me/health-data-consents`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${ase}`, 'Content-Type': 'application/json', 'Idempotency-Key': clave(), 'X-BE-Surface': 'APK' },
    body: JSON.stringify({ consentVersionId: VERSION_VIGENTE.DATOS_SALUD_BE.id }),
  });
  if (a3.status !== 201) throw new Error(`A3: ${a3.status}`);
  const evaluacion = exigir(
    await api.crearEvaluacion(
      pro,
      estado.aseId,
      {
        occurredAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        context: 'Consulta inicial sintética del recorrido de recetas.',
        assessment: { entries: [{ concept: 'Comidas por día', value: 4, unit: 'comidas', source: 'REPORTED' }] },
        evidenceReferences: [],
        professionalNotes: 'Notas sintéticas.',
      },
      clave(),
    ),
    'evaluación',
  );
  exigir(
    await api.crearObjetivo(
      pro,
      estado.aseId,
      {
        evaluationId: evaluacion.data.evaluationId,
        effectiveFrom: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        effectiveUntil: null,
        estimatedEnergyRequirement: { value: 2200, unit: 'kcal/day' },
        macronutrientDistribution: { protein: { value: 110, unit: 'g/day' }, carbohydrate: { value: 270, unit: 'g/day' }, fat: { value: 70, unit: 'g/day' } },
        mealDistribution: 'Cuatro comidas.',
        rationale: 'Fundamento profesional sintético: decisión del profesional, sin cálculo de BE.',
        methodStatement: null,
      },
      clave(),
    ),
    'objetivo',
  );
  fs.writeFileSync(ESTADO, JSON.stringify({ ...estado, vinculoId }, null, 2));
  console.log('vínculo, B2, A3, evaluación y objetivo listos');
} else {
  console.error('uso: node preparar.mjs cuentas|vinculo <origen de la API>');
  process.exit(2);
}
