// Prepara, por la API pública, las cuentas sintéticas del recorrido de Entrenamiento por serie.
// - fase «cuentas»: registra dos profesionales (el de la demostración y otro, para comprobar que no ve lo ajeno), el
//   asesorado y otro asesorado, como cualquier cuenta. Guarda sus identidades en estado.json. Después se reinicia la API
//   con BE_DEMO_PROFESIONALES para que los verifique como profesionales de Entrenamiento (DL-036).
// - fase «vinculo»: vínculo de Entrenamiento aceptado, B2 y A3 del asesorado, evaluación y objetivo vigente. El plan lo
//   arma después el profesional en la web (recorrido-web.mjs), como lo haría una persona.
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
  const correos = {
    proCorreo: `pro-entrenamiento-${sufijo}@example.invalid`,
    otroProCorreo: `otro-pro-entrenamiento-${sufijo}@example.invalid`,
    aseCorreo: `ase-entrenamiento-${sufijo}@example.invalid`,
    otroCorreo: `otro-ase-entrenamiento-${sufijo}@example.invalid`,
  };
  const pro = exigir(await api.registrar({ correo: correos.proCorreo, contrasena: CRED }, clave()), 'registro del profesional');
  const otroPro = exigir(await api.registrar({ correo: correos.otroProCorreo, contrasena: CRED }, clave()), 'registro del otro profesional');
  const ase = exigir(await apk.registrar({ correo: correos.aseCorreo, contrasena: CRED }, clave()), 'registro del asesorado');
  const otro = exigir(await apk.registrar({ correo: correos.otroCorreo, contrasena: CRED }, clave()), 'registro del otro asesorado');
  fs.writeFileSync(
    ESTADO,
    JSON.stringify({ ...correos, proId: pro.data.identityId, otroProId: otroPro.data.identityId, aseId: ase.data.identityId, otroId: otro.data.identityId }, null, 2),
  );
  console.log(`BE_DEMO_PROFESIONALES=${pro.data.identityId}|ENTRENAMIENTO|NO_SANITARIO|Prof. Demo Entrenamiento;${otroPro.data.identityId}|ENTRENAMIENTO|NO_SANITARIO|Prof. Otra`);
} else if (fase === 'vinculo') {
  const estado = JSON.parse(fs.readFileSync(ESTADO, 'utf8'));
  const pro = exigir(await api.iniciarSesion(estado.proCorreo, CRED), 'sesión del profesional').data.session.accessToken;
  const ase = exigir(await apk.iniciarSesion(estado.aseCorreo, CRED), 'sesión del asesorado').data.session.accessToken;
  const solicitud = exigir(await api.solicitarVinculo(pro, { asesoradoId: estado.aseId, alcance: 'ENTRENAMIENTO' }, clave()), 'solicitud de vínculo');
  const aceptada = exigir(await apk.aceptarSolicitud(ase, solicitud.data.relationshipRequestId, solicitud.data.version ?? 'v1', clave()), 'aceptación');
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
    await api.crearEvaluacionDeEntrenamiento(
      pro,
      estado.aseId,
      {
        occurredAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        assessment: {
          entries: [
            { concept: 'Experiencia en entrenamiento de fuerza', value: 'Un año, con interrupciones', source: 'REPORTED' },
            { concept: 'Sentadilla sin carga observada', value: 'Técnica estable', source: 'OBSERVED' },
          ],
        },
        evidenceReferences: [],
        professionalNotes: 'Notas sintéticas del recorrido de entrenamiento por serie.',
      },
      clave(),
    ),
    'evaluación',
  );
  exigir(
    await api.crearObjetivoDeEntrenamiento(
      pro,
      estado.aseId,
      {
        evaluationId: evaluacion.data.evaluationId,
        effectiveFrom: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        effectiveUntil: null,
        objective: { statement: 'Ganar fuerza en piernas con técnica estable (objetivo sintético de la demostración).' },
        rationale: 'Fundamento sintético: decisión del profesional, sin cálculo de BE.',
      },
      clave(),
    ),
    'objetivo',
  );
  fs.writeFileSync(ESTADO, JSON.stringify({ ...estado, vinculoId }, null, 2));
  console.log('vínculo de Entrenamiento, B2, A3, evaluación y objetivo listos');
} else {
  console.error('uso: node preparar.mjs cuentas|vinculo <origen de la API>');
  process.exit(2);
}
