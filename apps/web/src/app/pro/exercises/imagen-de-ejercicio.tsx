'use client';

/**
 * La imagen de un ejercicio propio (DL-123): elegirla, verla antes de guardarla, guardarla por el flujo real
 * (API-MED-01 y 02 con finalidad EXERCISE_REFERENCE, y API-EJE-02), reemplazarla o retirarla (API-EJE-03).
 * - Se declara todo lo que la imagen necesita para ser honesta: procedencia, autoría, texto alternativo, licencia y
 *   revisión técnica. Nada se completa solo: no hay licencia por defecto y la revisión empieza sin marcar.
 * - La imagen ilustra para reconocer el ejercicio: no certifica la técnica, y se dice.
 * - Retirar no borra el medio: lo ya registrado conserva la imagen que tenía.
 * - Lo que se ve después de guardar es lo que guardó BE (recodificado, sin metadatos), leído de nuevo de la API.
 */
import {
  COPY_EJERCICIOS_PROPIOS,
  ETIQUETA_DE_PROCEDENCIA_DE_IMAGEN,
  ETIQUETA_DE_REVISION_TECNICA,
  ProcedenciaDeMedioSchema,
  ROL_DE_LA_IMAGEN,
  textoDeLicencia,
  type EjercicioPropio,
  type LicenciaDeImagen,
  type ProcedenciaDeMedio,
} from '@be/domain';
import { useId, useRef, useState } from 'react';
import { DialogoDeConfirmacion } from '../../../components/dialogo';
import { Aviso, Campo } from '../../../components/formulario';
import { api, type Resultado } from '../../../lib/api';
import { fecha } from '../../../lib/formato';
import { mensajeDeFallo, useClaveDeIntento } from '../../../lib/intento';
import { revisarImagen, subirImagen, useImagenDeMedio, type ImagenElegida } from '../../../lib/medios';

/** La imagen guardada de un ejercicio, o el ícono de respaldo si no tiene o si no se puede leer. */
export function ImagenGuardadaDeEjercicio({
  token,
  medioId,
  nombre,
  textoAlternativo,
  sesionPerdida,
  chica = false,
}: {
  token: string;
  medioId: string | null;
  nombre: string;
  textoAlternativo?: string;
  sesionPerdida: (r: Resultado<unknown>) => boolean;
  chica?: boolean;
}) {
  const { estado } = useImagenDeMedio(token, medioId, sesionPerdida);
  const clase = `imagen-de-receta imagen-de-ejercicio${chica ? ' imagen-de-receta--chica' : ''}`;
  if (estado.tipo === 'lista') return <img className={clase} src={estado.dataUrl} alt={textoAlternativo || `${COPY_EJERCICIOS_PROPIOS.imagen}: ${nombre}`} />;
  return (
    <div className={`${clase} imagen-de-receta--respaldo`} role="img" aria-label={estado.tipo === 'cargando' ? 'Cargando la imagen…' : `${nombre}: ${COPY_EJERCICIOS_PROPIOS.sinImagen.toLowerCase()}`}>
      <span aria-hidden="true">🏋</span>
    </div>
  );
}

type TipoDeLicencia = '' | 'NO_EXTERNAL_LICENSE' | 'EXTERNAL';

export function ImagenDeEjercicio({ token, ejercicio, sesionPerdida, onCambio }: { token: string; ejercicio: EjercicioPropio; sesionPerdida: (r: Resultado<unknown>) => boolean; onCambio: (e: EjercicioPropio, aviso: string) => void }) {
  const id = useId();
  const entrada = useRef<HTMLInputElement>(null);
  const [elegida, setElegida] = useState<ImagenElegida | null>(null);
  // El medio ya subido de la imagen elegida: si la asociación falla, el reintento no vuelve a subirla.
  const [subido, setSubido] = useState<string | null>(null);
  const [procedencia, setProcedencia] = useState<ProcedenciaDeMedio | ''>('');
  const [autoria, setAutoria] = useState('');
  const [alternativo, setAlternativo] = useState('');
  const [tipoDeLicencia, setTipoDeLicencia] = useState<TipoDeLicencia>('');
  const [terminos, setTerminos] = useState('');
  const [licencia, setLicencia] = useState({ id: '', label: '', url: '' });
  const [revisada, setRevisada] = useState(false);
  const [problema, setProblema] = useState<string | null>(null);
  const [enviando, setEnviando] = useState<'guardando' | 'retirando' | null>(null);
  const [confirmarRetiro, setConfirmarRetiro] = useState(false);
  const [falloDeRetiro, setFalloDeRetiro] = useState<string | null>(null);
  const intentoDeSubida = useClaveDeIntento();
  const intentoDeAsociar = useClaveDeIntento();
  const intentoDeRetiro = useClaveDeIntento();

  async function elegir(archivo: File | undefined) {
    setProblema(null);
    setElegida(null);
    setSubido(null);
    intentoDeSubida.descartar();
    intentoDeAsociar.descartar();
    if (!archivo) return;
    const revision = await revisarImagen(archivo);
    if (!revision.ok) return setProblema(COPY_EJERCICIOS_PROPIOS.imagenInvalida);
    setElegida(revision.imagen);
  }

  /** La licencia declarada, o `null` si falta algo: nunca se completa sola. */
  function licenciaDeclarada(): LicenciaDeImagen | null {
    if (tipoDeLicencia === 'NO_EXTERNAL_LICENSE') return terminos.trim() ? { kind: 'NO_EXTERNAL_LICENSE', usage: terminos.trim() } : null;
    if (tipoDeLicencia === 'EXTERNAL') return licencia.id.trim() && licencia.label.trim() ? { kind: 'EXTERNAL', id: licencia.id.trim(), label: licencia.label.trim(), url: licencia.url.trim() || null } : null;
    return null;
  }

  async function guardar() {
    if (!elegida) return;
    const declarada = licenciaDeclarada();
    if (!procedencia || !autoria.trim() || !alternativo.trim() || !declarada) return setProblema(COPY_EJERCICIOS_PROPIOS.faltaUnDato);
    setEnviando('guardando');
    setProblema(null);
    let medioId = subido;
    if (!medioId) {
      const subida = await subirImagen(token, elegida, { finalidad: 'EXERCISE_REFERENCE', procedencia, autoria: autoria.trim() }, intentoDeSubida.actual());
      intentoDeSubida.registrar(subida);
      if (sesionPerdida(subida)) return;
      if (!subida.ok) {
        setEnviando(null);
        const invalida = subida.tipo === 'API' && ['FILE_TYPE_NOT_ALLOWED', 'FILE_SIZE_NOT_ALLOWED', 'FILE_CONTENT_INVALID'].includes(subida.codigo);
        return setProblema(invalida ? COPY_EJERCICIOS_PROPIOS.imagenInvalida : COPY_EJERCICIOS_PROPIOS.imagenNoGuardada);
      }
      medioId = subida.datos.data.mediaId;
      setSubido(medioId);
    }
    const asociada = await api.asociarImagenDeEjercicio(
      token,
      ejercicio.exerciseId,
      {
        exerciseVersionId: ejercicio.versionId,
        mediaId: medioId,
        expectedImageVersion: ejercicio.imageVersion,
        altText: alternativo.trim(),
        license: declarada,
        technicalReview: revisada ? 'REVIEWED_BY_PROFESSIONAL' : 'PENDING_PROFESSIONAL_REVIEW',
      },
      intentoDeAsociar.actual(),
    );
    intentoDeAsociar.registrar(asociada);
    setEnviando(null);
    if (sesionPerdida(asociada)) return;
    if (!asociada.ok) return setProblema(asociada.tipo === 'API' && asociada.codigo === 'VERSION_CONFLICT' ? COPY_EJERCICIOS_PROPIOS.cambioEnOtraPestana : COPY_EJERCICIOS_PROPIOS.imagenNoGuardada);
    setElegida(null);
    setSubido(null);
    setProcedencia('');
    setAutoria('');
    setAlternativo('');
    setTipoDeLicencia('');
    setTerminos('');
    setLicencia({ id: '', label: '', url: '' });
    setRevisada(false);
    if (entrada.current) entrada.current.value = '';
    onCambio(asociada.datos.data, COPY_EJERCICIOS_PROPIOS.imagenGuardada);
  }

  async function retirar() {
    setEnviando('retirando');
    setFalloDeRetiro(null);
    const r = await api.retirarImagenDeEjercicio(token, ejercicio.exerciseId, ejercicio.imageVersion, intentoDeRetiro.actual());
    intentoDeRetiro.registrar(r);
    setEnviando(null);
    if (sesionPerdida(r)) return;
    if (!r.ok) return setFalloDeRetiro(r.tipo === 'API' && r.codigo === 'VERSION_CONFLICT' ? COPY_EJERCICIOS_PROPIOS.cambioEnOtraPestana : mensajeDeFallo(r));
    setConfirmarRetiro(false);
    onCambio(r.datos.data, COPY_EJERCICIOS_PROPIOS.imagenRetirada);
  }

  const imagen = ejercicio.image;
  return (
    <fieldset className="grupo" aria-describedby={`${id}-rol`}>
      <legend>{COPY_EJERCICIOS_PROPIOS.imagen}</legend>
      <p id={`${id}-rol`} className="nota">
        {ROL_DE_LA_IMAGEN}
      </p>
      {imagen ? (
        <figure className="figura-de-receta">
          <ImagenGuardadaDeEjercicio token={token} medioId={imagen.mediaId} nombre={ejercicio.name} textoAlternativo={imagen.altText} sesionPerdida={sesionPerdida} />
          <figcaption className="nota">
            {ETIQUETA_DE_PROCEDENCIA_DE_IMAGEN[imagen.provenance]} · {imagen.authorship} · {textoDeLicencia(imagen.license)} · {ETIQUETA_DE_REVISION_TECNICA[imagen.technicalReview]} · {fecha(imagen.associatedAt)}
          </figcaption>
        </figure>
      ) : (
        <p className="nota">{COPY_EJERCICIOS_PROPIOS.sinImagen}.</p>
      )}

      <div className="campo">
        <label htmlFor={`${id}-archivo`}>{imagen ? COPY_EJERCICIOS_PROPIOS.reemplazarImagen : COPY_EJERCICIOS_PROPIOS.elegirImagen}</label>
        <p id={`${id}-archivo-ayuda`} className="campo__ayuda">
          JPG, PNG o WebP, de hasta 10 MB.
        </p>
        <input
          ref={entrada}
          id={`${id}-archivo`}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          aria-describedby={`${id}-archivo-ayuda`}
          disabled={enviando !== null}
          onChange={(e) => void elegir(e.target.files?.[0])}
        />
      </div>
      {elegida ? (
        <div className="vista-previa">
          <p className="lista__titulo">{COPY_EJERCICIOS_PROPIOS.vistaPrevia}</p>
          <img className="imagen-de-receta imagen-de-ejercicio" src={elegida.vistaPrevia} alt={`${COPY_EJERCICIOS_PROPIOS.vistaPrevia}: ${elegida.archivo.name}`} />
          <p className="nota">
            {elegida.archivo.name} · {elegida.ancho} × {elegida.alto} px
          </p>
          <div className="campo">
            <label htmlFor={`${id}-procedencia`}>{COPY_EJERCICIOS_PROPIOS.procedencia}</label>
            <select
              id={`${id}-procedencia`}
              value={procedencia}
              onChange={(e) => {
                const p = ProcedenciaDeMedioSchema.safeParse(e.target.value);
                setProcedencia(p.success ? p.data : '');
              }}
            >
              <option value="">{COPY_EJERCICIOS_PROPIOS.elegirProcedencia}</option>
              {ProcedenciaDeMedioSchema.options.map((p) => (
                <option key={p} value={p}>
                  {ETIQUETA_DE_PROCEDENCIA_DE_IMAGEN[p]}
                </option>
              ))}
            </select>
          </div>
          <Campo id={`${id}-autoria`} etiqueta={COPY_EJERCICIOS_PROPIOS.autoria} ayuda={COPY_EJERCICIOS_PROPIOS.ayudaDeAutoria} value={autoria} onChange={(e) => setAutoria(e.target.value)} maxLength={120} />
          <Campo id={`${id}-alternativo`} etiqueta={COPY_EJERCICIOS_PROPIOS.textoAlternativo} ayuda={COPY_EJERCICIOS_PROPIOS.ayudaDeTextoAlternativo} value={alternativo} onChange={(e) => setAlternativo(e.target.value)} maxLength={300} />
          <fieldset className="grupo">
            <legend>{COPY_EJERCICIOS_PROPIOS.licencia}</legend>
            {(
              [
                ['NO_EXTERNAL_LICENSE', COPY_EJERCICIOS_PROPIOS.sinLicenciaExterna],
                ['EXTERNAL', COPY_EJERCICIOS_PROPIOS.licenciaExterna],
              ] as const
            ).map(([valor, texto]) => (
              <label key={valor} className="acto">
                <input type="radio" name={`${id}-licencia`} value={valor} checked={tipoDeLicencia === valor} onChange={() => setTipoDeLicencia(valor)} /> {texto}
              </label>
            ))}
            {tipoDeLicencia === 'NO_EXTERNAL_LICENSE' ? (
              <div className="campo">
                <label htmlFor={`${id}-terminos`}>{COPY_EJERCICIOS_PROPIOS.terminosDeUso}</label>
                <p id={`${id}-terminos-ayuda`} className="campo__ayuda">
                  {COPY_EJERCICIOS_PROPIOS.ayudaDeTerminos}
                </p>
                <textarea id={`${id}-terminos`} rows={2} value={terminos} aria-describedby={`${id}-terminos-ayuda`} onChange={(e) => setTerminos(e.target.value)} maxLength={300} />
              </div>
            ) : null}
            {tipoDeLicencia === 'EXTERNAL' ? (
              <div className="campos-del-ingrediente">
                <Campo id={`${id}-licencia-id`} etiqueta={COPY_EJERCICIOS_PROPIOS.identificadorDeLicencia} value={licencia.id} onChange={(e) => setLicencia((l) => ({ ...l, id: e.target.value }))} maxLength={80} />
                <Campo id={`${id}-licencia-nombre`} etiqueta={COPY_EJERCICIOS_PROPIOS.nombreDeLicencia} value={licencia.label} onChange={(e) => setLicencia((l) => ({ ...l, label: e.target.value }))} maxLength={200} />
                <Campo id={`${id}-licencia-url`} etiqueta={COPY_EJERCICIOS_PROPIOS.urlDeLicencia} type="url" value={licencia.url} onChange={(e) => setLicencia((l) => ({ ...l, url: e.target.value }))} maxLength={500} />
              </div>
            ) : null}
          </fieldset>
          <div className="campo">
            <label>
              <input type="checkbox" checked={revisada} onChange={(e) => setRevisada(e.target.checked)} /> {COPY_EJERCICIOS_PROPIOS.revisada}
            </label>
          </div>
          <div className="acciones">
            <button type="button" className="boton boton--primario" onClick={() => void guardar()} disabled={enviando !== null}>
              {enviando === 'guardando' ? COPY_EJERCICIOS_PROPIOS.guardandoImagen : COPY_EJERCICIOS_PROPIOS.guardarImagen}
            </button>
          </div>
        </div>
      ) : null}
      {problema ? (
        <Aviso tipo="error">
          <p>{problema}</p>
        </Aviso>
      ) : null}
      {imagen ? (
        <div className="acciones">
          <button type="button" className="boton boton--enlace" onClick={() => setConfirmarRetiro(true)} disabled={enviando !== null}>
            {COPY_EJERCICIOS_PROPIOS.retirarImagen}
          </button>
        </div>
      ) : null}
      <DialogoDeConfirmacion
        abierto={confirmarRetiro}
        titulo={COPY_EJERCICIOS_PROPIOS.retirarImagen}
        textoVolver="Volver"
        textoConfirmar={COPY_EJERCICIOS_PROPIOS.retirarImagen}
        textoEnviando="Retirando…"
        enviando={enviando === 'retirando'}
        error={falloDeRetiro}
        onVolver={() => {
          setConfirmarRetiro(false);
          setFalloDeRetiro(null);
          intentoDeRetiro.descartar();
        }}
        onConfirmar={() => void retirar()}
      >
        <p>{COPY_EJERCICIOS_PROPIOS.confirmarRetiro}</p>
      </DialogoDeConfirmacion>
    </fieldset>
  );
}
