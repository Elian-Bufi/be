import { api } from './api';
import { inicioPropio } from './copy';

/**
 * Pregunta a la API (ACC-05) qué puede abrir la cuenta y devuelve su inicio: el espacio profesional o Cuenta
 * (`inicioPropio`). Si la API no responde, Cuenta, que se ocupa de reintentar.
 */
export async function buscarInicioPropio(token: string): Promise<'/pro' | '/account'> {
  const r = await api.consultarCuenta(token);
  return inicioPropio(r.ok ? r.datos.data.actorCapabilities : null);
}
