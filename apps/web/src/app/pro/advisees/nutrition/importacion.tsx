'use client';

/**
 * «Importar desde proveedor» del editor de plan (B10-05 §18-§20; UC-I07; WP-08). Es una opción más del editor, nunca
 * la búsqueda principal: el catálogo BE y la carga manual siguen a la vista.
 * - Consultar crea un **candidato**, no un alimento del catálogo: la pantalla no dice «Importado» hasta resolver.
 * - Cada dato muestra lo que trajo el proveedor al lado de lo que se va a incorporar, y marca lo corregido con la misma
 *   regla que registra la API (B10-05 §19). Lo que el proveedor no trajo se dice que no vino: el campo queda vacío,
 *   nunca en cero (B10-10 §1). La base tampoco se supone: si el proveedor no la declara sin ambigüedad, se elige.
 * - Si el proveedor no responde, el aviso ofrece el catálogo BE y la carga manual, y el editor sigue (B10-05 §20).
 * - Un resultado incierto congela el candidato: solo se puede reintentar **la misma** decisión, con la misma clave, para
 *   que el servidor devuelva lo que ya hizo en vez de incorporar dos veces (09:253-262).
 */
import {
  camposCorregidosDeAlimento,
  cantidad,
  COPY_INTEGRACIONES,
  ETIQUETA_DE_PROVEEDOR,
  leerNumero,
  motivoDeNumeroIlegible,
  type AlimentoCandidato,
  type CandidatoDeAlimento,
  type ComposicionCandidata,
  type ElementoDeCatalogo,
  type ResolverCandidatoDeAlimentoRequest,
  type ValidationIssue,
} from '@be/domain';
import { useState, type FormEvent } from 'react';
import { Aviso, Campo } from '../../../../components/formulario';
import { api } from '../../../../lib/api';
import { dia, numeroEnCampo } from '../../../../lib/formato';
import { esIncierto, mensajeDeFallo, useClaveDeIntento } from '../../../../lib/intento';
import { useNutricion } from './nutricion';

type Nutriente = 'energyKcal' | 'proteinG' | 'carbohydrateG' | 'fatG';
const NUTRIENTES: readonly { clave: Nutriente; etiqueta: string; unidad: string }[] = [
  { clave: 'energyKcal', etiqueta: 'Energía', unidad: 'kcal' },
  { clave: 'proteinG', etiqueta: 'Proteínas', unidad: 'g' },
  { clave: 'carbohydrateG', etiqueta: 'Carbohidratos', unidad: 'g' },
  { clave: 'fatG', etiqueta: 'Grasas', unidad: 'g' },
];
const LARGO_MAXIMO_DEL_NOMBRE = 120;

interface Revision {
  nombre: string;
  /** Vacío: el proveedor no declaró la base y todavía no se eligió. */
  referencia: '100g' | '100ml' | '';
  valores: Record<Nutriente, string>;
  fundamento: string;
}

/** Cómo queda el candidato después de un intento de resolución que no terminó en éxito. */
type Bloqueo = null | { tipo: 'incierto'; pedido: ResolverCandidatoDeAlimentoRequest } | { tipo: 'cerrado' };

/** Lo que el formulario diría si se enviara ahora, con la forma del candidato: para marcar lo corregido. */
function revisadoDe(r: Revision): AlimentoCandidato {
  const valores = Object.fromEntries(NUTRIENTES.map((n) => [n.clave, r.valores[n.clave].trim() === '' ? null : leerNumero(r.valores[n.clave])])) as Record<Nutriente, number | null>;
  return { name: r.nombre.trim() || null, composition: { referenceAmount: r.referencia || null, ...valores } };
}

/** Cada problema que devuelve la API vuelve a su campo, por su ruta (D-I). */
function erroresDeLaApi(issues: readonly ValidationIssue[]): Record<string, string> {
  const porCampo: Record<string, string> = {};
  for (const i of issues) {
    if (i.path === 'reviewedContent.name') porCampo['nombre'] = i.code === 'TOO_BIG' ? COPY_INTEGRACIONES.nombreLargo : 'Falta el nombre.';
    if (i.path === 'reviewedContent.composition.referenceAmount') porCampo['referencia'] = COPY_INTEGRACIONES.faltaLaBase;
    const n = NUTRIENTES.find((x) => i.path === `reviewedContent.composition.${x.clave}`);
    if (n) porCampo[n.clave] = `Falta ${n.etiqueta.toLowerCase()}: completalo o rechazá el candidato.`;
  }
  return porCampo;
}

export function ImportacionDeOpenFoodFacts({ id, onIncorporado, onCargarManualmente }: { id: string; onIncorporado: (e: ElementoDeCatalogo) => void; onCargarManualmente: () => void }) {
  const { token, sesionPerdida, accesoRetirado } = useNutricion();
  const [codigo, setCodigo] = useState('');
  const [errorDeCodigo, setErrorDeCodigo] = useState<string | null>(null);
  const [consultando, setConsultando] = useState(false);
  const [aviso, setAviso] = useState<{ tipo: 'error' | 'info' | 'exito'; texto: string; conAlternativa?: boolean } | null>(null);
  const [candidato, setCandidato] = useState<CandidatoDeAlimento | null>(null);
  const [revision, setRevision] = useState<Revision | null>(null);
  const [errores, setErrores] = useState<Record<string, string>>({});
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
    const limpio = codigo.replace(/\s+/g, '');
    if (!/^(\d{8}|\d{12,14})$/.test(limpio)) return setErrorDeCodigo('Escribí solo los dígitos del código: 8, 12, 13 o 14.');
    setErrorDeCodigo(null);
    setConsultando(true);
    const r = await api.crearCandidatoDeAlimento(token, limpio, intentoDeConsulta.actual());
    intentoDeConsulta.registrar(r);
    setConsultando(false);
    if (sesionPerdida(r) || accesoRetirado(r)) return;
    if (!r.ok) {
      if (r.tipo === 'API' && r.codigo === 'DEPENDENCY_UNAVAILABLE') return setAviso({ tipo: 'info', texto: COPY_INTEGRACIONES.proveedorCaidoAlimento, conAlternativa: true });
      if (r.tipo === 'API' && r.codigo === 'IMPORT_SOURCE_NOT_FOUND') return setAviso({ tipo: 'info', texto: COPY_INTEGRACIONES.noEncontradoAlimento });
      return setAviso({ tipo: 'error', texto: mensajeDeFallo(r) });
    }
    const c = r.datos.data;
    setCandidato(c);
    setErrores({});
    setBloqueo(null);
    setRevision({
      nombre: c.candidate.name ?? '',
      referencia: c.candidate.composition.referenceAmount ?? '',
      valores: Object.fromEntries(NUTRIENTES.map((n) => [n.clave, numeroEnCampo(c.candidate.composition[n.clave])])) as Record<Nutriente, string>,
      fundamento: '',
    });
  }

  /** Arma el pedido desde el formulario, o marca en cada campo lo que no se puede mandar. */
  function pedidoDesdeElFormulario(decision: 'IMPORT' | 'REJECT'): ResolverCandidatoDeAlimentoRequest | null {
    if (!revision) return null;
    const rationale = revision.fundamento.trim() || null;
    if (decision === 'REJECT') return { decision, rationale };
    // Lo ilegible y lo demasiado largo se marcan en su campo antes de mandar nada; lo vacío viaja null y lo señala la
    // API por ruta.
    const problemas: Record<string, string> = {};
    if (revision.nombre.trim().length > LARGO_MAXIMO_DEL_NOMBRE) problemas['nombre'] = COPY_INTEGRACIONES.nombreLargo;
    const valores = {} as Record<Nutriente, number | null>;
    for (const n of NUTRIENTES) {
      const texto = revision.valores[n.clave];
      const v = texto.trim() === '' ? null : leerNumero(texto);
      if (texto.trim() !== '' && v === null) problemas[n.clave] = motivoDeNumeroIlegible(texto);
      else if (v !== null && v < 0) problemas[n.clave] = 'El valor no puede ser menor que cero.';
      valores[n.clave] = v;
    }
    setErrores(problemas);
    if (Object.keys(problemas).length > 0) {
      setAviso({ tipo: 'error', texto: COPY_INTEGRACIONES.faltaCompletar });
      return null;
    }
    const composition: ComposicionCandidata = { referenceAmount: revision.referencia || null, ...valores };
    return { decision, reviewedContent: { name: revision.nombre.trim() || null, composition }, rationale };
  }

  async function resolver(pedido: ResolverCandidatoDeAlimentoRequest) {
    if (!candidato || !revision) return;
    setAviso(null);
    setResolviendo(true);
    const r = await api.resolverCandidatoDeAlimento(token, candidato.candidateId, pedido, intentoDeResolucion.actual());
    intentoDeResolucion.registrar(r);
    setResolviendo(false);
    if (sesionPerdida(r) || accesoRetirado(r)) return;
    if (!r.ok) {
      if (esIncierto(r)) {
        setBloqueo({ tipo: 'incierto', pedido });
        return setAviso({ tipo: 'error', texto: COPY_INTEGRACIONES.resultadoIncierto });
      }
      setBloqueo(null);
      if (r.tipo === 'API' && (r.codigo === 'REVIEWED_CONTENT_INVALID' || r.codigo === 'VALIDATION_FAILED')) {
        const porCampo = erroresDeLaApi(r.issues);
        if (Object.keys(porCampo).length > 0) {
          setErrores(porCampo);
          return setAviso({ tipo: 'error', texto: COPY_INTEGRACIONES.faltaCompletar });
        }
      }
      if (r.tipo === 'API' && r.codigo === 'IMPORT_CANDIDATE_NOT_RESOLVABLE') {
        setBloqueo({ tipo: 'cerrado' });
        return setAviso({ tipo: 'error', texto: COPY_INTEGRACIONES.noResoluble });
      }
      return setAviso({ tipo: 'error', texto: mensajeDeFallo(r) });
    }
    setBloqueo(null);
    const resultado = r.datos.data;
    if (pedido.decision === 'REJECT' || !resultado.catalogItem) {
      setCandidato(null);
      setRevision(null);
      setCodigo('');
      return setAviso({ tipo: 'exito', texto: COPY_INTEGRACIONES.rechazado });
    }
    const c = pedido.reviewedContent.composition;
    onIncorporado({
      catalogItemId: resultado.catalogItem.catalogItemId,
      versionId: resultado.catalogItem.versionId,
      name: (pedido.reviewedContent.name ?? '').trim(),
      itemType: 'FOOD',
      composition: { referenceAmount: c.referenceAmount!, energyKcal: c.energyKcal!, proteinG: c.proteinG!, carbohydrateG: c.carbohydrateG!, fatG: c.fatG! },
      provenance: 'CONTROLLED_IMPORT',
      externalSource: { provider: candidato.provider, externalId: candidato.externalId, receivedAt: candidato.receivedAt, license: candidato.provenance.license },
      available: true,
    });
  }

  function decidir(decision: 'IMPORT' | 'REJECT') {
    const pedido = pedidoDesdeElFormulario(decision);
    if (pedido) void resolver(pedido);
  }

  const proveedor = ETIQUETA_DE_PROVEEDOR.OPEN_FOOD_FACTS;
  // La misma regla que la API usa para `correctedFields`: lo que la pantalla marca es lo que queda registrado.
  const corregidos = candidato && revision ? new Set(camposCorregidosDeAlimento(candidato.candidate, revisadoDe(revision))) : new Set<string>();
  const marca = (ruta: string) => (corregidos.has(ruta) ? ` · ${COPY_INTEGRACIONES.corregido}` : '');
  const baseDelProveedor = candidato?.candidate.composition.referenceAmount ?? null;
  return (
    <fieldset className="grupo">
      <legend>{COPY_INTEGRACIONES.importarDesdeOpenFoodFacts}</legend>
      <form onSubmit={consultar} className="fila-de-dato" noValidate>
        <Campo
          id={`${id}-codigo`}
          etiqueta={COPY_INTEGRACIONES.codigoDeBarras}
          ayuda={COPY_INTEGRACIONES.ayudaCodigoDeBarras}
          inputMode="numeric"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          error={errorDeCodigo}
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
                Cargar el alimento manualmente
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

      {candidato && revision ? (
        <section className="candidato" aria-labelledby={`${id}-candidato`}>
          <h4 id={`${id}-candidato`}>{COPY_INTEGRACIONES.candidatoTitulo}</h4>
          <p className="nota">{COPY_INTEGRACIONES.candidatoAviso}</p>
          <p className="nota">
            {COPY_INTEGRACIONES.fuente}: {proveedor} · código {candidato.externalId} · {COPY_INTEGRACIONES.recibido} {dia(candidato.receivedAt)} ·{' '}
            {COPY_INTEGRACIONES.licencia}: {candidato.provenance.license.label}
            {candidato.provenance.license.attribution ? ` (${candidato.provenance.license.attribution})` : ''} · {COPY_INTEGRACIONES.vence}{' '}
            {dia(candidato.expiresAt)}
          </p>
          <Campo
            id={`${id}-nombre`}
            etiqueta={`Nombre${marca('name')}`}
            ayuda={`${COPY_INTEGRACIONES.datoDelProveedor}: ${candidato.candidate.name ?? COPY_INTEGRACIONES.noVinoDelProveedor}`}
            value={revision.nombre}
            onChange={(e) => setRevision({ ...revision, nombre: e.target.value })}
            error={errores['nombre'] ?? null}
            maxLength={LARGO_MAXIMO_DEL_NOMBRE}
            disabled={edicionBloqueada}
          />
          <div className={`campo${errores['referencia'] ? ' campo--error' : ''}`}>
            <label htmlFor={`${id}-referencia`}>
              {COPY_INTEGRACIONES.base}
              {marca('composition.referenceAmount')}
            </label>
            <p className="campo__ayuda" id={`${id}-referencia-ayuda`}>
              {COPY_INTEGRACIONES.datoDelProveedor}:{' '}
              {baseDelProveedor === null ? COPY_INTEGRACIONES.baseNoDeclarada : baseDelProveedor === '100g' ? COPY_INTEGRACIONES.cada100g.toLowerCase() : COPY_INTEGRACIONES.cada100ml.toLowerCase()}
            </p>
            <select
              id={`${id}-referencia`}
              value={revision.referencia}
              aria-describedby={`${id}-referencia-ayuda${errores['referencia'] ? ` ${id}-referencia-error` : ''}`}
              aria-invalid={errores['referencia'] ? true : undefined}
              onChange={(e) => setRevision({ ...revision, referencia: e.target.value as Revision['referencia'] })}
              disabled={edicionBloqueada}
            >
              {baseDelProveedor === null ? <option value="">{COPY_INTEGRACIONES.elegiLaBase}</option> : null}
              <option value="100g">{COPY_INTEGRACIONES.cada100g}</option>
              <option value="100ml">{COPY_INTEGRACIONES.cada100ml}</option>
            </select>
            {errores['referencia'] ? (
              <p className="campo__error" id={`${id}-referencia-error`}>
                <span aria-hidden="true">⚠ </span>
                {errores['referencia']}
              </p>
            ) : null}
          </div>
          <div className="fila-de-dato">
            {NUTRIENTES.map((n) => {
              const delProveedor = candidato.candidate.composition[n.clave];
              return (
                <Campo
                  key={n.clave}
                  id={`${id}-${n.clave}`}
                  etiqueta={`${n.etiqueta} (${n.unidad})${marca(`composition.${n.clave}`)}`}
                  ayuda={`${COPY_INTEGRACIONES.datoDelProveedor}: ${delProveedor === null ? COPY_INTEGRACIONES.noVinoDelProveedor : cantidad(delProveedor, n.unidad)}`}
                  inputMode="decimal"
                  value={revision.valores[n.clave]}
                  onChange={(e) => setRevision({ ...revision, valores: { ...revision.valores, [n.clave]: e.target.value } })}
                  error={errores[n.clave] ?? null}
                  disabled={edicionBloqueada}
                />
              );
            })}
          </div>
          <Campo
            id={`${id}-fundamento`}
            etiqueta={COPY_INTEGRACIONES.fundamento}
            value={revision.fundamento}
            onChange={(e) => setRevision({ ...revision, fundamento: e.target.value })}
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

/** «Importado de Open Food Facts · 24 sept 2026»: la procedencia de un elemento donde se lo elige (RF-060). */
export function procedenciaDeElemento(e: ElementoDeCatalogo): string | null {
  if (!e.externalSource) return null;
  return `${COPY_INTEGRACIONES.importadoDe} ${ETIQUETA_DE_PROVEEDOR[e.externalSource.provider]} · ${dia(e.externalSource.receivedAt)}`;
}
