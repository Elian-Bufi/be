'use client';

/**
 * Aplicar desde el cajón «De a una» (WP-TABLERO-ALTA-GAMA TB-15; DL-163 D-6; TA-42): cuando el pendiente del cuadro
 * tiene una revisión registrada y sin aplicar, el cajón pregunta si la aplicás. Es la única pieza del cajón que escribe,
 * y escribe lo mismo que la lista de Revisiones: la misma operación (API-NUT-20 o API-TRN-24), con la clave del intento,
 * los mismos conflictos y los mismos textos (`advisees/aplicar-la-revision.ts`).
 * - **Lee la revisión** (API-NUT-19 o API-TRN-23): es la segunda lectura del cuadro, en lugar de lo nuevo desde ella.
 * - **Antes del botón,** el resultado, el fundamento, la próxima acción y lo que pasa al aplicar, con la fecha que deja.
 *   Si la revisión no se pudo leer, no se ofrece aplicar: se aplica desde Revisiones.
 * - **El foco nunca va al botón:** queda en la pregunta del cuadro. Enter no es un atajo; el botón se aprieta como
 *   cualquier botón, con el foco puesto en él.
 * - **Después,** el cajón dice lo que hizo la aplicación y ofrece seguir (`cajon-de-a-una.tsx`).
 */
import { ETIQUETA_DE_RESULTADO, type Revision, type RevisionDeEntrenamiento } from '@be/domain';
import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';
import { Aviso } from '../../components/formulario';
import { api, type Resultado } from '../../lib/api';
import { diaDelAnioEnCurso, nombreDelDiaDeLaSemana } from '../../lib/formato';
import { mensajeDeFallo, useClaveDeIntento } from '../../lib/intento';
import { COPY_APLICAR, efectoDeLaFecha, efectoDelResultado, falloPropioDeAplicar, textoDeLaAplicacion, VERBO_DE_APLICAR, type AreaQueSeRevisa } from './advisees/aplicar-la-revision';
import { COPY_CAJON } from './cajon';

type Lectura = { readonly tipo: 'leyendo' } | { readonly tipo: 'error' } | { readonly tipo: 'listo'; readonly revision: Revision | RevisionDeEntrenamiento };

export function AplicarEnElCajon({
  area,
  revisionId,
  revisiones,
  token,
  sesionPerdida,
  hoy,
  alAplicar,
  alSalir,
  children,
}: {
  area: AreaQueSeRevisa;
  revisionId: string;
  /** La lista de Revisiones del área con esta revisión a la vista (TB-09), para leerla entera o aplicarla desde ahí. */
  revisiones: string;
  token: string;
  sesionPerdida: (r: Resultado<unknown>) => boolean;
  hoy: string;
  /** Salió bien: el cajón lo anota, sin nombres, y lo dice en el cuadro. */
  alAplicar: (hecho: { readonly texto: string; readonly borrador: boolean }) => void;
  /** Al salir por un enlace, el cajón guarda el lugar. */
  alSalir: () => void;
  /** Las otras salidas del cuadro, en la misma fila. */
  children: ReactNode;
}) {
  const [lectura, setLectura] = useState<Lectura>({ tipo: 'leyendo' });
  const intento = useClaveDeIntento();
  const [aplicando, setAplicando] = useState(false);
  const [fallo, setFallo] = useState<string | null>(null);
  const enPalabras = (f: string) => `${nombreDelDiaDeLaSemana(f)} ${diaDelAnioEnCurso(f, hoy)}`;

  useEffect(() => {
    let vigente = true;
    void (async () => {
      const r = area === 'nutrition' ? await api.consultarRevision(token, revisionId) : await api.consultarRevisionDeEntrenamiento(token, revisionId);
      if (!vigente || sesionPerdida(r)) return;
      setLectura(r.ok ? { tipo: 'listo', revision: r.datos.data } : { tipo: 'error' });
    })();
    return () => {
      vigente = false;
    };
    // Una lectura por cuadro: `token` y `sesionPerdida` no cambian en la visita.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [area, revisionId]);

  async function aplicar() {
    setAplicando(true);
    setFallo(null);
    const r = area === 'nutrition' ? await api.aplicarRevision(token, revisionId, intento.actual()) : await api.aplicarRevisionDeEntrenamiento(token, revisionId, intento.actual());
    intento.registrar(r);
    setAplicando(false);
    if (sesionPerdida(r)) return;
    if (!r.ok) return setFallo(falloPropioDeAplicar(r) ?? mensajeDeFallo(r));
    const a = r.datos.data.application;
    alAplicar({ texto: textoDeLaAplicacion(area, a), borrador: Boolean(a.createdPlanId) });
  }

  const revision = lectura.tipo === 'listo' ? lectura.revision : null;
  const yaAplicada = revision?.application ?? null;
  return (
    <>
      {lectura.tipo === 'leyendo' ? (
        <p className="cargando" role="status">
          {COPY_CAJON.leyendoLaRevision}
        </p>
      ) : null}
      {lectura.tipo === 'error' ? (
        <p className="nota">
          {COPY_CAJON.sinLeerLaRevision}{' '}
          <Link href={revisiones} onClick={alSalir}>
            {COPY_CAJON.verLaRevision}
          </Link>
        </p>
      ) : null}
      {revision ? (
        <div className="cajon__revision" data-revision-por-aplicar={revision.reviewId}>
          <dl className="cajon__lo-registrado">
            <div>
              <dt>Resultado</dt>
              <dd>{ETIQUETA_DE_RESULTADO[revision.result]}</dd>
            </div>
            <div>
              <dt>Fundamento</dt>
              <dd>{revision.rationale}</dd>
            </div>
            <div>
              <dt>{revision.result === 'FINALIZE' ? 'Cierre' : 'Próxima acción'}</dt>
              <dd>{revision.nextAction.description}</dd>
            </div>
          </dl>
          {yaAplicada ? (
            <p className="nota">{COPY_APLICAR.yaAplicada}</p>
          ) : (
            <p className="cajon__efecto">
              <strong>{COPY_CAJON.alAplicar}</strong> {efectoDelResultado(area, revision.result)} {efectoDeLaFecha(revision.result, revision.nextAction.nextReviewAt, enPalabras) ?? ''}
            </p>
          )}
          <p className="nota">
            <Link href={revisiones} onClick={alSalir}>
              {COPY_CAJON.verLaRevision}
            </Link>
          </p>
        </div>
      ) : null}
      {fallo ? (
        <Aviso tipo="error">
          <p>{fallo}</p>
        </Aviso>
      ) : null}
      <div className="cajon__salidas">
        {revision && !yaAplicada ? (
          <button type="button" className="boton boton--primario" data-aplicar-en-el-cajon onClick={() => void aplicar()} disabled={aplicando} aria-busy={aplicando}>
            {aplicando ? COPY_APLICAR.aplicando : VERBO_DE_APLICAR[area]}
          </button>
        ) : null}
        {children}
      </div>
    </>
  );
}
