// UF-11 de WP-USO-FINAL (DL-169; UF-D12): el segundo factor del profesional en las herramientas de datos. Desde UF-11,
// una sesión de un profesional opera como profesional solo con su segundo factor verificado. Una herramienta que entra
// con una cuenta profesional lo verifica con lo que trae el archivo de cuentas (fuera del repositorio, como las claves):
//   <CUENTA>_TOTP=<la clave del autenticador, la que /pro muestra para cargarla a mano>
//   <CUENTA>_RECUPERACION=<códigos de recuperación sin usar, separados por comas> (opcional)
// - Con la clave, el código del autenticador del paso de 30 s actual o del siguiente (uno ya usado no vale otra vez).
// - Si los dos ya se usaron (otra corrida en los mismos 30 s), un código de recuperación que esta herramienta no usó.
// Lo usado se anota al lado del archivo de cuentas (`<archivo>.segundo-factor.json`), para que otra corrida no lo repita.
// Sin perfil profesional, o con el segundo factor ya verificado, no hace nada. Nunca imprime la clave ni los códigos.
import fs from 'node:fs';
import * as OTPAuth from 'otpauth';

const PERIODO_MS = 30_000;
const codigoDelPaso = (secreto, paso) =>
  new OTPAuth.TOTP({ secret: OTPAuth.Secret.fromBase32(secreto), algorithm: 'SHA1', digits: 6, period: 30 }).generate({ timestamp: paso * PERIODO_MS });

async function pedir(base, metodo, ruta, token, cuerpo) {
  const r = await fetch(`${base}${ruta}`, {
    method: metodo,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-BE-Surface': 'WEB', Authorization: `Bearer ${token}` },
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
  });
  const texto = await r.text();
  return { status: r.status, json: texto ? JSON.parse(texto) : null };
}

/**
 * Deja la sesión con el segundo factor del profesional verificado. `base` es el origen con /api/v1; `valores`, lo leído
 * del archivo de cuentas, y `archivo`, su ruta (para anotar lo usado al lado).
 */
export async function verificarSegundoFactor({ base, token, valores, archivo, cuenta }) {
  const estado = await pedir(base, 'GET', '/me/second-factor', token);
  if (estado.status !== 200) throw new Error(`No se pudo leer el segundo factor de la cuenta ${cuenta} (${estado.status}).`);
  const situacion = estado.json.data.secondFactor.state;
  if (situacion === 'VERIFIED' || situacion === 'NOT_REQUIRED') return;
  const secreto = (valores[`${cuenta}_TOTP`] ?? '').replace(/\s+/g, '');
  const recuperacion = (valores[`${cuenta}_RECUPERACION`] ?? '').split(',').map((c) => c.trim()).filter(Boolean);
  if (situacion !== 'REQUIRED' || (!secreto && recuperacion.length === 0)) {
    throw new Error(
      `La cuenta ${cuenta} es profesional y su sesión pide el segundo factor (UF-11). Entrá a /pro con esa cuenta, configuralo y agregá ${cuenta}_TOTP=<la clave para cargar a mano> al archivo de cuentas.`,
    );
  }
  const anotaciones = `${archivo}.segundo-factor.json`;
  const memoria = fs.existsSync(anotaciones) ? JSON.parse(fs.readFileSync(anotaciones, 'utf8')) : {};
  const propia = memoria[cuenta] ?? { ultimoPaso: 0, usados: [] };
  const anotar = () => {
    memoria[cuenta] = propia;
    fs.writeFileSync(anotaciones, `${JSON.stringify(memoria)}\n`);
  };
  if (secreto) {
    const paso = Math.floor(Date.now() / PERIODO_MS);
    for (const candidato of [paso, paso + 1]) {
      if (candidato <= propia.ultimoPaso) continue;
      const r = await pedir(base, 'POST', '/me/second-factor/verification', token, { code: codigoDelPaso(secreto, candidato) });
      propia.ultimoPaso = candidato;
      anotar();
      if (r.status === 200) return;
      if (r.status !== 422) throw new Error(`No se pudo verificar el segundo factor de la cuenta ${cuenta} (${r.status}).`);
    }
  }
  // A lo sumo dos códigos de recuperación por corrida: cinco intentos fallidos revocan la sesión.
  for (const codigo of recuperacion.filter((c) => !propia.usados.includes(c)).slice(0, 2)) {
    propia.usados.push(codigo);
    anotar();
    const r = await pedir(base, 'POST', '/me/second-factor/recovery-code', token, { recoveryCode: codigo });
    if (r.status === 200) return;
    if (r.status !== 422) throw new Error(`No se pudo verificar el segundo factor de la cuenta ${cuenta} (${r.status}).`);
  }
  throw new Error(`No se pudo verificar el segundo factor de la cuenta ${cuenta}: los códigos de este paso ya se usaron y no quedan códigos de recuperación sin usar.`);
}
