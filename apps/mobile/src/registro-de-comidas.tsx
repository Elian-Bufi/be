/**
 * Las escrituras del registro de comidas de la APK (WP-NUTRICION-RECETAS §7; DL-121), en un solo lugar:
 * - **Registrar** (API-ING-02): una opción, desde el carrusel o desde el detalle, o una comida diferente. Es un solo
 *   comando (`comando-de-registro.ts`), con un intento por comida y día: un doble toque o un reintento no duplican, y el
 *   reintento puede llegar desde la otra pantalla.
 * - **Completar o corregir las cantidades** (API-ING-05): una rectificación, con su propio intento por registro.
 * - **Deshacer** (API-ING-06): una anulación auditable, con confirmación. Nada se borra: queda anotado que se deshizo, y
 *   la comida se puede volver a registrar.
 * La hora de cada registro es la del servidor (`reloj-del-servidor.ts`), no la del teléfono: un teléfono adelantado no
 * registra en el futuro.
 */
import { COPY_REGISTRO_DE_COMIDAS, type RectificarCantidadesRequest, type RegistrarComidaRequest, type RegistroDeComida, type Resultado } from '@be/domain';
import { api, nuevaClaveDeIdempotencia } from './api';
import { crearComandoDeRegistro, huellaDelPedido } from './comando-de-registro';
import { DialogoDeConfirmacion, useAccionConfirmada } from './dialogo';
import { esIncierto } from './intento';
import { relojDelServidor } from './reloj-del-servidor';
import { Parrafo } from './ui';

const dependencias = { nuevaClave: nuevaClaveDeIdempotencia, esIncierto, huella: huellaDelPedido };

/** Registrar (API-ING-02): una opción o una comida diferente. */
export const comandoDeRegistro = crearComandoDeRegistro<RegistrarComidaRequest, { data: RegistroDeComida }>(dependencias);

/** Completar o corregir las cantidades de un registro (API-ING-05). */
export const comandoDeCantidades = crearComandoDeRegistro<RectificarCantidadesRequest, { data: RegistroDeComida }>(dependencias);

/** El instante de un registro: la hora del servidor, estimada con las respuestas de la API. */
export const ahoraEnElServidor = (): string => new Date(relojDelServidor.ahora()).toISOString();

/** Registra con el comando único. `intento` nombra la comida y el día (`intentoDeLaComida`). */
export function registrarComida(token: string, intento: string, cuerpo: RegistrarComidaRequest): Promise<Resultado<{ data: RegistroDeComida }>> {
  return comandoDeRegistro.enviar(intento, cuerpo, (c, clave) => api.registrarComida(token, c, clave));
}

/** Completa o corrige las cantidades de un registro, con su propio intento. */
export function rectificarCantidades(token: string, registro: { readonly recordId: string }, cuerpo: RectificarCantidadesRequest): Promise<Resultado<{ data: RegistroDeComida }>> {
  return comandoDeCantidades.enviar(`${token}|${registro.recordId}|cantidades`, cuerpo, (c, clave) => api.rectificarCantidades(token, registro.recordId, c, clave));
}

/**
 * «Deshacer registro», con su confirmación: el diálogo pregunta y dice qué queda. Un resultado incierto ofrece
 * reintentar con la misma clave; una versión vieja o un registro ya deshecho piden actualizar.
 */
export function useDeshacer({
  token,
  registro,
  sesionPerdida,
  alDeshacer,
  alActualizar,
}: {
  token: string;
  registro: Pick<RegistroDeComida, 'recordId' | 'version'> | null;
  sesionPerdida: (r: Resultado<unknown>) => boolean;
  alDeshacer: () => void;
  alActualizar: () => void;
}) {
  const accion = useAccionConfirmada({ sesionPerdida, alTerminar: alDeshacer, alRecargar: alActualizar });
  const dialogo = registro ? (
    <DialogoDeConfirmacion
      visible={accion.visible}
      titulo={COPY_REGISTRO_DE_COMIDAS.deshacer}
      textoConfirmar={COPY_REGISTRO_DE_COMIDAS.deshacer}
      textoEnviando={COPY_REGISTRO_DE_COMIDAS.deshaciendo}
      peligro
      enviando={accion.enviando}
      fallo={accion.fallo}
      onVolver={accion.volver}
      onActualizar={accion.actualizar}
      onConfirmar={() =>
        void accion.ejecutar((clave) => api.deshacerRegistroDeComida(token, registro.recordId, { reason: null, expectedVersion: registro.version }, clave))
      }
    >
      <Parrafo>{COPY_REGISTRO_DE_COMIDAS.deshacerPregunta}</Parrafo>
    </DialogoDeConfirmacion>
  ) : null;
  return { abrir: accion.abrir, dialogo };
}
