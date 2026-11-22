'use client';

/**
 * «Proponer al Recetario de BE» (DL-191; WP-RECETARIO-E-IMAGENES, REC-07 y REC-D08), en una receta propia guardada:
 * - Dice en qué está la última propuesta (esperando, sumada o no sumada, con el motivo si lo hay) y, si no se puede
 *   proponer, por qué (`motivoParaNoProponer`).
 * - Proponer abre un cuadro: qué pasa al proponer y, si la receta tiene foto, **la cesión de la foto entera**, con su casilla.
 *   Sin la casilla no se envía. La API registra la versión del texto que se aceptó.
 * - Una receta con un alimento cargado a mano no se propone: la API lo dice y el cuadro lo explica.
 * - Una copia del recetario también se puede proponer (es propia), y el cuadro no lo impide.
 */
import { CESION_DE_LA_FOTO, COPY_RECETARIO, motivoParaNoProponer, type PropuestaDeLaReceta, type Receta } from '@be/domain';
import { useId, useState } from 'react';
import { DialogoDeConfirmacion } from '../../../components/dialogo';
import { Icono } from '../../../components/icono';
import { api, type Resultado } from '../../../lib/api';
import { fecha } from '../../../lib/formato';
import { mensajeDeFallo, useClaveDeIntento } from '../../../lib/intento';

export function ProponerAlRecetario({
  token,
  receta,
  sesionPerdida,
  onPropuesta,
}: {
  token: string;
  receta: Receta;
  sesionPerdida: (r: Resultado<unknown>) => boolean;
  onPropuesta: (propuesta: PropuestaDeLaReceta) => void;
}) {
  const id = useId();
  const intento = useClaveDeIntento();
  const [abierto, setAbierto] = useState(false);
  const [acepto, setAcepto] = useState(false);
  const [falta, setFalta] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [fallo, setFallo] = useState<string | null>(null);
  const motivo = motivoParaNoProponer(receta);
  const conFoto = receta.image !== null;
  const ultima = receta.proposal;

  async function enviar() {
    if (conFoto && !acepto) return setFalta(true);
    setEnviando(true);
    setFallo(null);
    const cuerpo = { expectedVersion: receta.version, photoAssignment: conFoto ? { textVersion: CESION_DE_LA_FOTO.version, accepted: true as const } : null };
    const r = await api.proponerAlRecetario(token, receta.recipeId, cuerpo, intento.actual(JSON.stringify(cuerpo)));
    intento.registrar(r);
    setEnviando(false);
    if (sesionPerdida(r)) return;
    if (!r.ok) {
      const propio = r.tipo === 'API' && r.issues.some((i) => i.code === 'OWN_FOOD_NOT_PROPOSABLE');
      return setFallo(propio ? COPY_RECETARIO.conAlimentoPropio : mensajeDeFallo(r));
    }
    const p = r.datos.data;
    setAbierto(false);
    setAcepto(false);
    onPropuesta({ proposalId: p.proposalId, status: p.status, versionNumber: p.versionNumber, proposedAt: p.proposedAt, decidedAt: p.decidedAt, reason: p.reason });
  }

  return (
    <section className="seccion" aria-labelledby={`${id}-titulo`} data-proponer-al-recetario>
      <h3 id={`${id}-titulo`}>{COPY_RECETARIO.recetarioDeBe}</h3>
      {receta.copiedFrom ? <p className="nota">{COPY_RECETARIO.copiaDe(receta.copiedFrom.name)}</p> : null}
      {/* El renglón del estado está siempre: proponer lo cambia sin correr nada (RP-19). */}
      <p className="nota" role="status" data-estado-de-la-propuesta={ultima?.status ?? 'NINGUNA'}>
        {ultima ? `${COPY_RECETARIO.estadoDeLaPropuesta[ultima.status](ultima.versionNumber)} ${fecha(ultima.decidedAt ?? ultima.proposedAt)}` : COPY_RECETARIO.sinPropuesta}
        {ultima?.status === 'REJECTED' ? ` · ${COPY_RECETARIO.motivo(ultima.reason)}` : ''}
      </p>
      <p className="nota">{COPY_RECETARIO.proponerQueEs}</p>
      <div className="acciones">
        <button type="button" className="boton boton--secundario" disabled={motivo !== null} aria-describedby={motivo ? `${id}-motivo` : undefined} onClick={() => setAbierto(true)} data-proponer>
          <Icono nombre="mas" tamano={18} />
          {COPY_RECETARIO.proponer}
        </button>
      </div>
      {motivo ? (
        <p id={`${id}-motivo`} className="nota">
          {COPY_RECETARIO.noSePuedeProponer[motivo]}
        </p>
      ) : null}
      <DialogoDeConfirmacion
        abierto={abierto}
        titulo={COPY_RECETARIO.proponer}
        textoVolver="Volver"
        textoConfirmar={COPY_RECETARIO.enviarPropuesta}
        textoEnviando={COPY_RECETARIO.enviandoPropuesta}
        enviando={enviando}
        error={fallo}
        ancho
        onVolver={() => {
          setAbierto(false);
          setFallo(null);
          setFalta(false);
          intento.descartar();
        }}
        onConfirmar={() => void enviar()}
      >
        <p>{COPY_RECETARIO.proponerQueEs}</p>
        {conFoto ? (
          <div className="cesion-de-la-foto" data-cesion-de-la-foto={CESION_DE_LA_FOTO.version}>
            <p className="lista__titulo">{CESION_DE_LA_FOTO.titulo}</p>
            <p>{CESION_DE_LA_FOTO.texto}</p>
            <p className="nota">Versión del texto: {CESION_DE_LA_FOTO.version}</p>
            <div className={`campo${falta ? ' campo--error' : ''}`}>
              <label>
                <input
                  type="checkbox"
                  checked={acepto}
                  aria-invalid={falta ? true : undefined}
                  aria-describedby={falta ? `${id}-falta` : undefined}
                  onChange={(e) => {
                    setAcepto(e.target.checked);
                    setFalta(false);
                  }}
                  data-acepto-la-cesion
                />{' '}
                {COPY_RECETARIO.aceptoLaCesion}
              </label>
              {/* El renglón del error ocupa su lugar: que aparezca no corre el botón (RP-19). */}
              <p id={`${id}-falta`} className="campo__error recetario__lugar-del-aviso" role="alert">
                {falta ? COPY_RECETARIO.faltaAceptar : ''}
              </p>
            </div>
          </div>
        ) : null}
      </DialogoDeConfirmacion>
    </section>
  );
}
