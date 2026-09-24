'use client';

/**
 * «Importar desde proveedor» del editor de plan (B10-05 §18-§20; UC-I07; WP-08). Es una opción más del editor, nunca
 * la búsqueda principal: el catálogo BE y la carga manual siguen a la vista.
 * - Consultar crea un **candidato**, no un alimento del catálogo: la pantalla no dice «Importado» hasta resolver.
 * - Cada dato muestra lo que trajo el proveedor al lado de lo que se va a incorporar, y marca lo corregido (B10-05 §19).
 *   Lo que el proveedor no trajo se dice que no vino: el campo queda vacío, nunca en cero (B10-10 §1).
 * - Si el proveedor no responde, el aviso ofrece el catálogo BE y la carga manual, y el editor sigue (B10-05 §20).
 */
import {
  cantidad,
  COPY_INTEGRACIONES,
  ETIQUETA_DE_PROVEEDOR,
  leerNumero,
  motivoDeNumeroIlegible,
  type CandidatoDeAlimento,
  type ComposicionCandidata,
  type ElementoDeCatalogo,
} from '@be/domain';
import { useState, type FormEvent } from 'react';
import { Aviso, Campo } from '../../../../components/formulario';
import { api } from '../../../../lib/api';
import { dia, numeroEnCampo } from '../../../../lib/formato';
import { mensajeDeFallo, useClaveDeIntento } from '../../../../lib/intento';
import { useNutricion } from './nutricion';

type Nutriente = 'energyKcal' | 'proteinG' | 'carbohydrateG' | 'fatG';
const NUTRIENTES: readonly { clave: Nutriente; etiqueta: string; unidad: string }[] = [
  { clave: 'energyKcal', etiqueta: 'Energía', unidad: 'kcal' },
  { clave: 'proteinG', etiqueta: 'Proteínas', unidad: 'g' },
  { clave: 'carbohydrateG', etiqueta: 'Carbohidratos', unidad: 'g' },
  { clave: 'fatG', etiqueta: 'Grasas', unidad: 'g' },
];

interface Revision {
  nombre: string;
  referencia: '100g' | '100ml';
  valores: Record<Nutriente, string>;
  fundamento: string;
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
  const intentoDeConsulta = useClaveDeIntento();
  const intentoDeResolucion = useClaveDeIntento();

  async function consultar(e: FormEvent) {
    e.preventDefault();
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
    setRevision({
      nombre: c.candidate.name ?? '',
      referencia: c.candidate.composition.referenceAmount,
      valores: Object.fromEntries(NUTRIENTES.map((n) => [n.clave, numeroEnCampo(c.candidate.composition[n.clave])])) as Record<Nutriente, string>,
      fundamento: '',
    });
  }

  async function resolver(decision: 'IMPORT' | 'REJECT') {
    if (!candidato || !revision) return;
    setAviso(null);
    let composicion: ComposicionCandidata | null = null;
    if (decision === 'IMPORT') {
      // Lo ilegible se marca en su campo antes de mandar nada; lo vacío viaja null y lo señala la API por ruta.
      const problemas: Record<string, string> = {};
      const valores = {} as Record<Nutriente, number | null>;
      for (const n of NUTRIENTES) {
        const texto = revision.valores[n.clave];
        const v = texto.trim() === '' ? null : leerNumero(texto);
        if (texto.trim() !== '' && v === null) problemas[n.clave] = motivoDeNumeroIlegible(texto);
        else if (v !== null && v < 0) problemas[n.clave] = 'El valor no puede ser menor que cero.';
        valores[n.clave] = v;
      }
      setErrores(problemas);
      if (Object.keys(problemas).length > 0) return setAviso({ tipo: 'error', texto: COPY_INTEGRACIONES.faltaCompletar });
      composicion = { referenceAmount: revision.referencia, ...valores };
    }
    setResolviendo(true);
    const fundamento = revision.fundamento.trim() || null;
    const r = await api.resolverCandidatoDeAlimento(
      token,
      candidato.candidateId,
      decision === 'IMPORT' ? { decision, reviewedContent: { name: revision.nombre.trim() || null, composition: composicion! }, rationale: fundamento } : { decision, rationale: fundamento },
      intentoDeResolucion.actual(),
    );
    intentoDeResolucion.registrar(r);
    setResolviendo(false);
    if (sesionPerdida(r) || accesoRetirado(r)) return;
    if (!r.ok) {
      if (r.tipo === 'API' && r.codigo === 'REVIEWED_CONTENT_INVALID') {
        // Cada faltante vuelve a su campo, con la ruta que devolvió la API (D-I).
        const porCampo: Record<string, string> = {};
        for (const i of r.issues) {
          if (i.path === 'reviewedContent.name') porCampo['nombre'] = 'Falta el nombre.';
          const n = NUTRIENTES.find((x) => i.path === `reviewedContent.composition.${x.clave}`);
          if (n) porCampo[n.clave] = `Falta ${n.etiqueta.toLowerCase()}: completalo o rechazá el candidato.`;
        }
        setErrores(porCampo);
        return setAviso({ tipo: 'error', texto: COPY_INTEGRACIONES.faltaCompletar });
      }
      if (r.tipo === 'API' && r.codigo === 'IMPORT_CANDIDATE_NOT_RESOLVABLE') return setAviso({ tipo: 'error', texto: COPY_INTEGRACIONES.noResoluble });
      return setAviso({ tipo: 'error', texto: mensajeDeFallo(r) });
    }
    const resultado = r.datos.data;
    if (decision === 'REJECT' || !resultado.catalogItem || !composicion) {
      setCandidato(null);
      setRevision(null);
      setCodigo('');
      return setAviso({ tipo: 'exito', texto: COPY_INTEGRACIONES.rechazado });
    }
    onIncorporado({
      catalogItemId: resultado.catalogItem.catalogItemId,
      versionId: resultado.catalogItem.versionId,
      name: revision.nombre.trim(),
      itemType: 'FOOD',
      composition: { referenceAmount: composicion.referenceAmount, energyKcal: composicion.energyKcal!, proteinG: composicion.proteinG!, carbohydrateG: composicion.carbohydrateG!, fatG: composicion.fatG! },
      provenance: 'CONTROLLED_IMPORT',
      externalSource: { provider: candidato.provider, externalId: candidato.externalId, receivedAt: candidato.receivedAt, license: candidato.provenance.license },
      available: true,
    });
  }

  const proveedor = ETIQUETA_DE_PROVEEDOR.OPEN_FOOD_FACTS;
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
        />
        <button type="submit" className="boton boton--secundario" disabled={consultando}>
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
            etiqueta="Nombre"
            ayuda={`${COPY_INTEGRACIONES.datoDelProveedor}: ${candidato.candidate.name ?? COPY_INTEGRACIONES.noVinoDelProveedor}`}
            value={revision.nombre}
            onChange={(e) => setRevision({ ...revision, nombre: e.target.value })}
            error={errores['nombre'] ?? null}
            maxLength={120}
          />
          <div className="campo">
            <label htmlFor={`${id}-referencia`}>Cantidad de referencia</label>
            <select id={`${id}-referencia`} value={revision.referencia} onChange={(e) => setRevision({ ...revision, referencia: e.target.value as '100g' | '100ml' })}>
              <option value="100g">Cada 100 g</option>
              <option value="100ml">Cada 100 ml</option>
            </select>
          </div>
          <div className="fila-de-dato">
            {NUTRIENTES.map((n) => {
              const delProveedor = candidato.candidate.composition[n.clave];
              const escrito = leerNumero(revision.valores[n.clave]);
              const corregido = revision.valores[n.clave].trim() === '' ? delProveedor !== null : escrito !== delProveedor;
              return (
                <Campo
                  key={n.clave}
                  id={`${id}-${n.clave}`}
                  etiqueta={`${n.etiqueta} (${n.unidad})${corregido ? ` · ${COPY_INTEGRACIONES.corregido}` : ''}`}
                  ayuda={`${COPY_INTEGRACIONES.datoDelProveedor}: ${delProveedor === null ? COPY_INTEGRACIONES.noVinoDelProveedor : cantidad(delProveedor, n.unidad)}`}
                  inputMode="decimal"
                  value={revision.valores[n.clave]}
                  onChange={(e) => setRevision({ ...revision, valores: { ...revision.valores, [n.clave]: e.target.value } })}
                  error={errores[n.clave] ?? null}
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
          />
          <div className="acciones">
            <button type="button" className="boton boton--primario" onClick={() => void resolver('IMPORT')} disabled={resolviendo}>
              {COPY_INTEGRACIONES.importarABe}
            </button>
            <button type="button" className="boton boton--secundario" onClick={() => void resolver('REJECT')} disabled={resolviendo}>
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

