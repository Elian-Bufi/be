'use client';

/**
 * La imagen de referencia de una receta (DL-119, DL-120): elegir un archivo, verlo antes de cargarlo, cargarlo por el
 * flujo real y asociarlo; reemplazarla o retirarla.
 * - La imagen va en la receta, no en la versión: cambiarla no toca ingredientes, versiones ni registros.
 * - Se declara la procedencia (por ejemplo, «Generada por IA») y, si se quiere, la autoría. La imagen es una referencia:
 *   no mide la porción ni demuestra lo que se comió.
 * - Lo que se ve después de cargar es lo que guardó BE (recodificado, sin metadatos), leído de nuevo de la API: así se
 *   comprueba que quedó guardada y que vuelve después de recargar la página.
 */
import { COPY_RECETAS, ETIQUETA_DE_PROCEDENCIA_DE_IMAGEN, ProcedenciaDeMedioSchema, type ProcedenciaDeMedio, type Receta } from '@be/domain';
import { useId, useRef, useState } from 'react';
import { DialogoDeConfirmacion } from '../../../components/dialogo';
import { Aviso, Campo } from '../../../components/formulario';
import { api, type Resultado } from '../../../lib/api';
import { fecha } from '../../../lib/formato';
import { mensajeDeFallo, useClaveDeIntento } from '../../../lib/intento';
import { revisarImagen, subirImagen, useImagenDeMedio, type ImagenElegida, type ProblemaDeImagen } from '../../../lib/medios';

const PROBLEMA: Readonly<Record<ProblemaDeImagen, string>> = {
  TIPO: COPY_RECETAS.imagenInvalida,
  TAMANO: COPY_RECETAS.imagenInvalida,
  DIMENSIONES: COPY_RECETAS.imagenInvalida,
  ILEGIBLE: COPY_RECETAS.imagenInvalida,
};

/** La imagen guardada de una receta, o el ícono de respaldo. Compartida con la lista. */
export function ImagenGuardada({ token, medioId, nombre, sesionPerdida, chica = false }: { token: string; medioId: string | null; nombre: string; sesionPerdida: (r: Resultado<unknown>) => boolean; chica?: boolean }) {
  const { estado } = useImagenDeMedio(token, medioId, sesionPerdida);
  const clase = `imagen-de-receta${chica ? ' imagen-de-receta--chica' : ''}`;
  if (estado.tipo === 'lista') return <img className={clase} src={estado.dataUrl} alt={`${COPY_RECETAS.imagenDeReferencia}: ${nombre}`} />;
  return (
    <div className={`${clase} imagen-de-receta--respaldo`} role="img" aria-label={estado.tipo === 'cargando' ? COPY_RECETAS.cargandoImagen : `${nombre}: sin imagen de referencia`}>
      <span aria-hidden="true">🍽</span>
    </div>
  );
}

export function ImagenDeReceta({ token, receta, sesionPerdida, onCambio }: { token: string; receta: Receta; sesionPerdida: (r: Resultado<unknown>) => boolean; onCambio: (r: Receta, aviso: string) => void }) {
  const id = useId();
  const entrada = useRef<HTMLInputElement>(null);
  const [elegida, setElegida] = useState<ImagenElegida | null>(null);
  // El medio ya subido de la imagen elegida: si la asociación falla, el reintento no vuelve a subirla.
  const [subido, setSubido] = useState<string | null>(null);
  const [procedencia, setProcedencia] = useState<ProcedenciaDeMedio | ''>('');
  const [autoria, setAutoria] = useState('');
  const [problema, setProblema] = useState<string | null>(null);
  const [errorDeProcedencia, setErrorDeProcedencia] = useState<string | null>(null);
  const [enviando, setEnviando] = useState<'cargando' | 'retirando' | null>(null);
  const [confirmarRetiro, setConfirmarRetiro] = useState(false);
  const [falloDeRetiro, setFalloDeRetiro] = useState<string | null>(null);
  const intentoDeCarga = useClaveDeIntento();
  const intentoDeAsociar = useClaveDeIntento();
  const intentoDeRetiro = useClaveDeIntento();

  async function elegir(archivo: File | undefined) {
    setProblema(null);
    setElegida(null);
    setSubido(null);
    intentoDeCarga.descartar();
    intentoDeAsociar.descartar();
    if (!archivo) return;
    const revision = await revisarImagen(archivo);
    if (!revision.ok) return setProblema(PROBLEMA[revision.problema]);
    setElegida(revision.imagen);
  }

  async function cargar() {
    if (!elegida) return;
    if (!procedencia) return setErrorDeProcedencia(COPY_RECETAS.faltaLaProcedencia);
    setErrorDeProcedencia(null);
    setEnviando('cargando');
    setProblema(null);
    let medioId = subido;
    if (!medioId) {
      const subida = await subirImagen(token, elegida, { finalidad: 'RECIPE_REFERENCE', procedencia, autoria: autoria.trim() || null }, intentoDeCarga.actual());
      intentoDeCarga.registrar(subida);
      if (sesionPerdida(subida)) return;
      if (!subida.ok) {
        setEnviando(null);
        const tipoInvalido = subida.tipo === 'API' && ['FILE_TYPE_NOT_ALLOWED', 'FILE_SIZE_NOT_ALLOWED', 'FILE_CONTENT_INVALID'].includes(subida.codigo);
        return setProblema(tipoInvalido ? COPY_RECETAS.imagenInvalida : COPY_RECETAS.imagenNoCargada);
      }
      medioId = subida.datos.data.mediaId;
      setSubido(medioId);
    }
    const asociada = await api.asociarImagenDeReceta(token, receta.recipeId, { mediaId: medioId, expectedVersion: receta.version }, intentoDeAsociar.actual());
    intentoDeAsociar.registrar(asociada);
    setEnviando(null);
    if (sesionPerdida(asociada)) return;
    if (!asociada.ok) return setProblema(asociada.tipo === 'API' && asociada.codigo === 'VERSION_CONFLICT' ? mensajeDeFallo(asociada) : COPY_RECETAS.imagenNoCargada);
    setElegida(null);
    setSubido(null);
    setProcedencia('');
    setAutoria('');
    if (entrada.current) entrada.current.value = '';
    onCambio(asociada.datos.data, COPY_RECETAS.imagenCargada);
  }

  async function retirar() {
    setEnviando('retirando');
    setFalloDeRetiro(null);
    const r = await api.retirarImagenDeReceta(token, receta.recipeId, receta.version, intentoDeRetiro.actual());
    intentoDeRetiro.registrar(r);
    setEnviando(null);
    if (sesionPerdida(r)) return;
    if (!r.ok) return setFalloDeRetiro(mensajeDeFallo(r));
    setConfirmarRetiro(false);
    onCambio(r.datos.data, COPY_RECETAS.imagenRetirada);
  }

  const imagen = receta.image;
  return (
    <fieldset className="grupo" aria-describedby={`${id}-aviso`}>
      <legend>{COPY_RECETAS.imagenDeReferencia}</legend>
      <p id={`${id}-aviso`} className="nota">
        {COPY_RECETAS.avisoDeImagen}
      </p>
      {imagen ? (
        <figure className="figura-de-receta">
          <ImagenGuardada token={token} medioId={imagen.mediaId} nombre={receta.name} sesionPerdida={sesionPerdida} />
          <figcaption className="nota">
            {COPY_RECETAS.imagenDeReferencia} · {ETIQUETA_DE_PROCEDENCIA_DE_IMAGEN[imagen.provenance]}
            {imagen.authorship ? ` · ${imagen.authorship}` : ''} · {imagen.width} × {imagen.height} px · {fecha(imagen.attachedAt)}
          </figcaption>
        </figure>
      ) : null}

      <div className="campo">
        <label htmlFor={`${id}-archivo`}>{imagen ? COPY_RECETAS.reemplazarImagen : COPY_RECETAS.elegirImagen}</label>
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
          <p className="lista__titulo">{COPY_RECETAS.vistaPrevia}</p>
          <img className="imagen-de-receta" src={elegida.vistaPrevia} alt={`${COPY_RECETAS.vistaPrevia}: ${elegida.archivo.name}`} />
          <p className="nota">
            {elegida.archivo.name} · {elegida.ancho} × {elegida.alto} px
          </p>
          <div className={`campo${errorDeProcedencia ? ' campo--error' : ''}`}>
            <label htmlFor={`${id}-procedencia`}>{COPY_RECETAS.procedenciaDeLaImagen}</label>
            <select
              id={`${id}-procedencia`}
              value={procedencia}
              aria-invalid={errorDeProcedencia ? true : undefined}
              aria-describedby={errorDeProcedencia ? `${id}-procedencia-error` : undefined}
              onChange={(e) => {
                const p = ProcedenciaDeMedioSchema.safeParse(e.target.value);
                setProcedencia(p.success ? p.data : '');
                setErrorDeProcedencia(null);
              }}
            >
              <option value="">{COPY_RECETAS.elegirProcedencia}</option>
              {ProcedenciaDeMedioSchema.options.map((p) => (
                <option key={p} value={p}>
                  {ETIQUETA_DE_PROCEDENCIA_DE_IMAGEN[p]}
                </option>
              ))}
            </select>
            {errorDeProcedencia ? (
              <p id={`${id}-procedencia-error`} className="campo__error">
                <span aria-hidden="true">⚠ </span>
                {errorDeProcedencia}
              </p>
            ) : null}
          </div>
          <Campo id={`${id}-autoria`} etiqueta={COPY_RECETAS.autoria} value={autoria} onChange={(e) => setAutoria(e.target.value)} maxLength={120} />
          <div className="acciones">
            <button type="button" className="boton boton--primario" onClick={() => void cargar()} disabled={enviando !== null}>
              {enviando === 'cargando' ? COPY_RECETAS.cargandoImagen : COPY_RECETAS.cargarImagen}
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
            {COPY_RECETAS.retirarImagen}
          </button>
        </div>
      ) : null}
      <DialogoDeConfirmacion
        abierto={confirmarRetiro}
        titulo={COPY_RECETAS.retirarImagen}
        textoVolver="Volver"
        textoConfirmar={COPY_RECETAS.retirarImagen}
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
        <p>{COPY_RECETAS.confirmarRetiro}</p>
      </DialogoDeConfirmacion>
    </fieldset>
  );
}
