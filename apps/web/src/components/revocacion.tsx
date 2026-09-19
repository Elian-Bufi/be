'use client';

/**
 * Revocación de B2 (CAND-10-CON-04; 10-B04 §18-§19), igual desde el detalle del vínculo y desde Privacidad:
 * «Revocar acceso de [Profesional]» → explicación obligatoria → «Volver» / «Revocar acceso».
 * CON-04 es idempotente por semántica y no lleva Idempotency-Key (09v8:1758): reintentar repite el POST y el servidor
 * devuelve la misma revocación. La revocación no finaliza el vínculo ni borra historial (REG-06-52).
 */
import { COPY, COPY_VINCULO } from '@be/domain';
import Link from 'next/link';
import { useState } from 'react';
import { api, type Resultado } from '../lib/api';
import { esIncierto, mensajeDeFallo } from '../lib/intento';
import { DialogoDeConfirmacion } from './dialogo';
import { Aviso } from './formulario';

type Estado = { tipo: 'cerrado' } | { tipo: 'abierto' } | { tipo: 'enviando' } | { tipo: 'error'; mensaje: string; incierto: boolean };

export function RevocarConsentimiento({
  token,
  consentId,
  profesional,
  sesionPerdida,
  alRevocar,
}: {
  token: string;
  consentId: string;
  profesional: string;
  sesionPerdida: (r: Resultado<unknown>) => boolean;
  alRevocar: () => void;
}) {
  const [estado, setEstado] = useState<Estado>({ tipo: 'cerrado' });

  async function confirmar() {
    if (estado.tipo === 'enviando') return;
    setEstado({ tipo: 'enviando' });
    const r = await api.revocarConsentimiento(token, consentId);
    if (r.ok) {
      setEstado({ tipo: 'cerrado' });
      alRevocar();
      return;
    }
    if (sesionPerdida(r)) return;
    setEstado({ tipo: 'error', mensaje: mensajeDeFallo(r), incierto: esIncierto(r) });
  }

  const titulo = COPY_VINCULO.revocarAccesoDe(profesional);
  return (
    <>
      <button type="button" className="boton boton--peligro-secundario" onClick={() => setEstado({ tipo: 'abierto' })}>
        {titulo}
      </button>
      <DialogoDeConfirmacion
        abierto={estado.tipo !== 'cerrado'}
        titulo={titulo}
        textoVolver={COPY_VINCULO.volver}
        textoConfirmar={estado.tipo === 'error' && estado.incierto ? COPY.reintentar : COPY_VINCULO.revocarAcceso}
        textoEnviando="Revocando acceso…"
        peligro
        enviando={estado.tipo === 'enviando'}
        error={estado.tipo === 'error' ? estado.mensaje : null}
        onVolver={() => setEstado({ tipo: 'cerrado' })}
        onConfirmar={confirmar}
      >
        <p>{COPY_VINCULO.explicacionDeRevocacion}</p>
      </DialogoDeConfirmacion>
    </>
  );
}

/** Éxito de la revocación (10-B04 §19). «debe» es literal: la UI no afirma lo que decide el servidor. */
export function AvisoDeAccesoRevocado({ vinculoId }: { vinculoId?: string }) {
  return (
    <Aviso tipo="exito" enfocar>
      <p className="aviso__titulo">{COPY_VINCULO.accesoRevocado}</p>
      <p>{COPY_VINCULO.accesoRevocadoDetalle}</p>
      <p>{COPY_VINCULO.vinculoContinua}</p>
      {vinculoId ? (
        <p>
          <Link href={`/account/relationships/detail?id=${encodeURIComponent(vinculoId)}`}>{COPY_VINCULO.verVinculo}</Link>
        </p>
      ) : null}
    </Aviso>
  );
}
