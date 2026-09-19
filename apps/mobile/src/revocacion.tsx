/**
 * Revocación de B2 (CAND-10-CON-04; 10-B04 §17-§19), igual desde el detalle del vínculo y desde Privacidad:
 * «Revocar acceso de [Profesional]» → explicación obligatoria → «Volver» / «Revocar acceso». Tan localizable como
 * otorgar (CAND-10-CON-B). CON-04 no lleva Idempotency-Key (09v8:1758): reintentar repite el POST y el servidor
 * devuelve la misma revocación. Revocar no finaliza el vínculo ni borra el historial (REG-06-51, REG-06-52).
 */
import { COPY_VINCULO, type Resultado } from '@be/domain';
import type { ReactNode } from 'react';
import { api } from './api';
import { DialogoDeConfirmacion, useAccionConfirmada } from './dialogo';
import { Aviso, Boton, Parrafo } from './ui';

export function RevocarConsentimiento({
  token,
  consentId,
  profesional,
  sesionPerdida,
  alRevocar,
  alRecargar,
}: {
  token: string;
  consentId: string;
  profesional: string;
  sesionPerdida: (r: Resultado<unknown>) => boolean;
  alRevocar: () => void;
  alRecargar: () => void;
}) {
  const a = useAccionConfirmada({ sesionPerdida, alTerminar: alRevocar, alRecargar });
  const titulo = COPY_VINCULO.revocarAccesoDe(profesional);
  return (
    <>
      <Boton texto={titulo} tipo="peligroSecundario" onPress={a.abrir} />
      <DialogoDeConfirmacion
        visible={a.visible}
        titulo={titulo}
        textoConfirmar={COPY_VINCULO.revocarAcceso}
        textoEnviando="Revocando acceso…"
        peligro
        enviando={a.enviando}
        fallo={a.fallo}
        onVolver={a.volver}
        onActualizar={a.actualizar}
        onConfirmar={() => void a.ejecutar(() => api.revocarConsentimiento(token, consentId))}
      >
        <Parrafo>{COPY_VINCULO.explicacionDeRevocacion}</Parrafo>
      </DialogoDeConfirmacion>
    </>
  );
}

/** Éxito de la revocación (10-B04 §19). «debe» es literal: la UI no afirma lo que decide el servidor. */
export function AvisoDeAccesoRevocado({ children }: { children?: ReactNode }) {
  return (
    <Aviso tipo="exito" titulo={COPY_VINCULO.accesoRevocado}>
      <Parrafo>{COPY_VINCULO.accesoRevocadoDetalle}</Parrafo>
      <Parrafo>{COPY_VINCULO.vinculoContinua}</Parrafo>
      {children}
    </Aviso>
  );
}
