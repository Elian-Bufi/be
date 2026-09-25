'use client';

/**
 * «Importar desde wger» del editor de plan (B10-06 §19 y §22; UC-I07; WP-08). Una opción más del editor, junto al
 * catálogo BE y la carga manual.
 * - Consultar crea un **candidato**: nada dice «Importado» hasta resolver (B10-05 §19, por homología).
 * - Los músculos y el material que declara wger se muestran como **dato del proveedor**: nunca se copian como zonas BE
 *   (09v12:397-401). El ejercicio entra al catálogo sin zonas, como uno cargado a mano (REG-06-139).
 * - Si wger no responde, el aviso ofrece el catálogo BE y la carga manual (UC-I08).
 * - «Corregido» se marca con la misma regla que registra la API, y un resultado incierto congela el candidato: solo se
 *   reintenta la misma decisión, con la misma clave (09:253-262).
 */
import {
  camposCorregidosDeEjercicio,
  COPY_INTEGRACIONES,
  ETIQUETA_DE_PROVEEDOR,
  type CandidatoDeEjercicio,
  type EjercicioDeCatalogo,
  type ResolverCandidatoDeEjercicioRequest,
} from '@be/domain';
import { useState, type FormEvent } from 'react';
import { Aviso, Campo } from '../../../../components/formulario';
import { api } from '../../../../lib/api';
import { dia } from '../../../../lib/formato';
import { esIncierto, mensajeDeFallo, useClaveDeIntento } from '../../../../lib/intento';
import { useEntrenamiento } from './entrenamiento';

const LARGO_MAXIMO_DEL_NOMBRE = 120;
type Bloqueo = null | { tipo: 'incierto'; pedido: ResolverCandidatoDeEjercicioRequest } | { tipo: 'cerrado' };

export function ImportacionDeWger({ id, onIncorporado, onCargarManualmente }: { id: string; onIncorporado: (e: EjercicioDeCatalogo) => void; onCargarManualmente: () => void }) {
  const { token, sesionPerdida, accesoRetirado } = useEntrenamiento();
  const [numero, setNumero] = useState('');
  const [errorDeNumero, setErrorDeNumero] = useState<string | null>(null);
  const [consultando, setConsultando] = useState(false);
  const [aviso, setAviso] = useState<{ tipo: 'error' | 'info' | 'exito'; texto: string; conAlternativa?: boolean } | null>(null);
  const [candidato, setCandidato] = useState<CandidatoDeEjercicio | null>(null);
  const [nombre, setNombre] = useState('');
  const [fundamento, setFundamento] = useState('');
  const [errorDeNombre, setErrorDeNombre] = useState<string | null>(null);
  const [resolviendo, setResolviendo] = useState(false);
  const [bloqueo, setBloqueo] = useState<Bloqueo>(null);
  const intentoDeConsulta = useClaveDeIntento();
  const intentoDeResolucion = useClaveDeIntento();
  // Mientras se resuelve o el resultado es incierto, no se consulta otro: el candidato en curso no se reemplaza.
  const consultaBloqueada = consultando || resolviendo || bloqueo?.tipo === 'incierto';
  const edicionBloqueada = resolviendo || bloqueo !== null;

  async function consultar(e: FormEvent) {
    e.preventDefault();
    if (consultaBloqueada) return;
    setAviso(null);
    const limpio = numero.trim();
    if (!/^[1-9]\d{0,8}$/.test(limpio)) return setErrorDeNumero('Escribí el número del ejercicio, sin letras ni espacios.');
    setErrorDeNumero(null);
    setConsultando(true);
    const r = await api.crearCandidatoDeEjercicio(token, limpio, intentoDeConsulta.actual());
    intentoDeConsulta.registrar(r);
    setConsultando(false);
    if (sesionPerdida(r) || accesoRetirado(r)) return;
    if (!r.ok) {
      if (r.tipo === 'API' && r.codigo === 'DEPENDENCY_UNAVAILABLE') return setAviso({ tipo: 'info', texto: COPY_INTEGRACIONES.proveedorCaidoEjercicio, conAlternativa: true });
      if (r.tipo === 'API' && r.codigo === 'IMPORT_SOURCE_NOT_FOUND') return setAviso({ tipo: 'info', texto: COPY_INTEGRACIONES.noEncontradoEjercicio });
      return setAviso({ tipo: 'error', texto: mensajeDeFallo(r) });
    }
    setCandidato(r.datos.data);
    setNombre(r.datos.data.candidate.name ?? '');
    setErrorDeNombre(null);
    setBloqueo(null);
  }

  function decidir(decision: 'IMPORT' | 'REJECT') {
    const rationale = fundamento.trim() || null;
    if (decision === 'REJECT') return void resolver({ decision, rationale });
    if (nombre.trim() === '') {
      setErrorDeNombre('Falta el nombre del ejercicio.');
      return setAviso({ tipo: 'error', texto: COPY_INTEGRACIONES.faltaCompletar });
    }
    if (nombre.trim().length > LARGO_MAXIMO_DEL_NOMBRE) {
      setErrorDeNombre(COPY_INTEGRACIONES.nombreLargo);
      return setAviso({ tipo: 'error', texto: COPY_INTEGRACIONES.faltaCompletar });
    }
    void resolver({ decision, reviewedContent: { name: nombre.trim() }, rationale });
  }

  async function resolver(pedido: ResolverCandidatoDeEjercicioRequest) {
    if (!candidato) return;
    setAviso(null);
    setErrorDeNombre(null);
    setResolviendo(true);
    const r = await api.resolverCandidatoDeEjercicio(token, candidato.candidateId, pedido, intentoDeResolucion.actual());
    intentoDeResolucion.registrar(r);
    setResolviendo(false);
    if (sesionPerdida(r) || accesoRetirado(r)) return;
    if (!r.ok) {
      if (esIncierto(r)) {
        setBloqueo({ tipo: 'incierto', pedido });
        return setAviso({ tipo: 'error', texto: COPY_INTEGRACIONES.resultadoIncierto });
      }
      setBloqueo(null);
      if (r.tipo === 'API' && r.codigo === 'IMPORT_CANDIDATE_NOT_RESOLVABLE') {
        setBloqueo({ tipo: 'cerrado' });
        return setAviso({ tipo: 'error', texto: COPY_INTEGRACIONES.noResoluble });
      }
      if (r.tipo === 'API' && (r.codigo === 'REVIEWED_CONTENT_INVALID' || r.codigo === 'VALIDATION_FAILED') && r.issues.some((i) => i.path === 'reviewedContent.name')) {
        const largo = r.issues.some((i) => i.path === 'reviewedContent.name' && i.code === 'TOO_BIG');
        setErrorDeNombre(largo ? COPY_INTEGRACIONES.nombreLargo : 'Falta el nombre del ejercicio.');
        return setAviso({ tipo: 'error', texto: COPY_INTEGRACIONES.faltaCompletar });
      }
      return setAviso({ tipo: 'error', texto: mensajeDeFallo(r) });
    }
    setBloqueo(null);
    const resultado = r.datos.data;
    if (pedido.decision === 'REJECT' || !resultado.exercise) {
      setCandidato(null);
      setNumero('');
      return setAviso({ tipo: 'exito', texto: COPY_INTEGRACIONES.rechazado });
    }
    onIncorporado({
      exerciseId: resultado.exercise.exerciseId,
      versionId: resultado.exercise.versionId,
      name: (pedido.reviewedContent.name ?? '').trim(),
      provenance: 'CONTROLLED_IMPORT',
      externalSource: { provider: candidato.provider, externalId: candidato.externalId, receivedAt: candidato.receivedAt, license: candidato.provenance.license },
      muscleZones: [],
      didacticResources: [],
      available: true,
    });
  }

  const c = candidato?.candidate;
  const lista = (xs: readonly string[]) => (xs.length > 0 ? xs.join(', ') : COPY_INTEGRACIONES.noVinoDelProveedor);
  return (
    <fieldset className="grupo">
      <legend>{COPY_INTEGRACIONES.importarDesdeWger}</legend>
      <form onSubmit={consultar} className="fila-de-dato" noValidate>
        <Campo
          id={`${id}-numero`}
          etiqueta={COPY_INTEGRACIONES.numeroDeWger}
          ayuda={COPY_INTEGRACIONES.ayudaNumeroDeWger}
          inputMode="numeric"
          value={numero}
          onChange={(e) => setNumero(e.target.value)}
          error={errorDeNumero}
          disabled={consultaBloqueada}
        />
        <button type="submit" className="boton boton--secundario" disabled={consultaBloqueada}>
          {consultando ? 'Consultando…' : COPY_INTEGRACIONES.consultar}
        </button>
      </form>

      {aviso ? (
        <Aviso tipo={aviso.tipo}>
          <p>{aviso.texto}</p>
          {aviso.conAlternativa ? (
            <p>
              <button type="button" className="boton boton--enlace" onClick={onCargarManualmente}>
                Cargar el ejercicio manualmente
              </button>
            </p>
          ) : null}
          {bloqueo?.tipo === 'incierto' ? (
            <p>
              <button type="button" className="boton boton--secundario" onClick={() => void resolver(bloqueo.pedido)} disabled={resolviendo}>
                {COPY_INTEGRACIONES.reintentar}
              </button>
            </p>
          ) : null}
        </Aviso>
      ) : null}

      {candidato && c ? (
        <section className="candidato" aria-labelledby={`${id}-candidato`}>
          <h4 id={`${id}-candidato`}>{COPY_INTEGRACIONES.candidatoTitulo}</h4>
          <p className="nota">{COPY_INTEGRACIONES.candidatoAviso}</p>
          <p className="nota">
            {COPY_INTEGRACIONES.fuente}: {ETIQUETA_DE_PROVEEDOR.WGER} · ejercicio {candidato.externalId} · {COPY_INTEGRACIONES.recibido} {dia(candidato.receivedAt)} ·{' '}
            {COPY_INTEGRACIONES.licencia}: {candidato.provenance.license.label}
            {candidato.provenance.license.attribution ? ` (${candidato.provenance.license.attribution})` : ''} · {COPY_INTEGRACIONES.vence} {dia(candidato.expiresAt)}
          </p>
          {c.nameLanguage === 'en' ? <p className="nota">{COPY_INTEGRACIONES.nombreEnIngles}</p> : null}
          <Campo
            id={`${id}-nombre`}
            etiqueta={`Nombre del ejercicio${camposCorregidosDeEjercicio(c, { name: nombre }).includes('name') ? ` · ${COPY_INTEGRACIONES.corregido}` : ''}`}
            ayuda={`${COPY_INTEGRACIONES.datoDelProveedor}: ${c.name ?? COPY_INTEGRACIONES.noVinoDelProveedor}`}
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            error={errorDeNombre}
            maxLength={LARGO_MAXIMO_DEL_NOMBRE}
            disabled={edicionBloqueada}
          />
          <dl className="datos datos--compactos">
            <div>
              <dt>{COPY_INTEGRACIONES.categoriaDelProveedor}</dt>
              <dd>{c.category ?? COPY_INTEGRACIONES.noVinoDelProveedor}</dd>
            </div>
            <div>
              <dt>{COPY_INTEGRACIONES.musculosDelProveedor}</dt>
              <dd>{lista([...c.primaryMuscles, ...c.secondaryMuscles])}</dd>
            </div>
            <div>
              <dt>{COPY_INTEGRACIONES.materialDelProveedor}</dt>
              <dd>{lista(c.equipment)}</dd>
            </div>
          </dl>
          <Campo
            id={`${id}-fundamento`}
            etiqueta={COPY_INTEGRACIONES.fundamento}
            value={fundamento}
            onChange={(e) => setFundamento(e.target.value)}
            maxLength={500}
            disabled={edicionBloqueada}
          />
          <div className="acciones">
            <button type="button" className="boton boton--primario" onClick={() => decidir('IMPORT')} disabled={edicionBloqueada}>
              {COPY_INTEGRACIONES.importarABe}
            </button>
            <button type="button" className="boton boton--secundario" onClick={() => decidir('REJECT')} disabled={edicionBloqueada}>
              {COPY_INTEGRACIONES.rechazar}
            </button>
          </div>
          <p className="nota">{COPY_INTEGRACIONES.noVerificadoPorBe}</p>
        </section>
      ) : null}
    </fieldset>
  );
}

/** «Importado de wger · 24 sept 2026»: la procedencia de un ejercicio donde se lo elige (RF-060). */
export function procedenciaDeEjercicio(e: EjercicioDeCatalogo): string | null {
  if (!e.externalSource) return null;
  return `${COPY_INTEGRACIONES.importadoDe} ${ETIQUETA_DE_PROVEEDOR[e.externalSource.provider]} · ${dia(e.externalSource.receivedAt)}`;
}
