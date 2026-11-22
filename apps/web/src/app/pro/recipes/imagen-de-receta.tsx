'use client';

/**
 * La imagen de referencia de una receta (DL-119, DL-120): elegir un archivo, verlo antes de cargarlo, cargarlo por el
 * flujo real y asociarlo; reemplazarla o retirarla.
 * - La imagen va en la receta, no en la versión: cambiarla no toca ingredientes, versiones ni registros.
 * - Se declara la procedencia (por ejemplo, «Generada por IA») y, si se quiere, la autoría. La imagen es una referencia:
 *   no mide la porción ni demuestra lo que se comió.
 * - Lo que se ve después de cargar es lo que guardó BE (recodificado, sin metadatos), leído de nuevo de la API: así se
 *   comprueba que quedó guardada y que vuelve después de recargar la página.
 * - **NUA-06 (WP-NUTRICION-ALIMENTOS):** la imagen también se elige al crear la receta (`ImagenDeLaRecetaNueva`), con el
 *   mismo control y las mismas validaciones, y se carga sola al guardarla. La elección y su carga viven en
 *   `useImagenParaCargar`, que comparten las dos; la subida y la asociación, sin React, en `cargar-la-imagen.ts`. Si la
 *   receta se guardó y la imagen no, lo elegido sigue en la receta guardada (`pendiente`), con su falla y su reintento.
 */
import {
  COPY_RECETARIO,
  COPY_RECETAS,
  COPY_REGISTRO_DE_COMIDAS,
  ETIQUETA_DE_PROCEDENCIA_DE_IMAGEN,
  ProcedenciaDeMedioSchema,
  type ProcedenciaDeMedio,
  type Receta,
  type RutasDeLaImagen,
  type VarianteDeMedio,
} from '@be/domain';
import { useId, useRef, useState, type ReactNode } from 'react';
import { DialogoDeConfirmacion } from '../../../components/dialogo';
import { Aviso, Campo } from '../../../components/formulario';
import { Icono } from '../../../components/icono';
import { api, type Resultado } from '../../../lib/api';
import { fecha } from '../../../lib/formato';
import { mensajeDeFallo, useClaveDeIntento } from '../../../lib/intento';
import { revisarImagen, subirImagen, useImagenDeMedio, type ImagenElegida } from '../../../lib/medios';
import { cargarLaImagen, laImagenSinCargar, olvidarLaImagenSinCargar, textoDeLaFalla, type ClavesDeLaImagen, type ImagenPendiente, type MotivoDeLaFalla, type ResultadoDeLaCarga } from './cargar-la-imagen';

/**
 * La imagen guardada de una receta, o su respaldo. Compartida con la lista (encargo del 2026-10-19, bloque 4):
 * - mientras carga, el indicador de siempre; sin imagen, el ícono del plato; si falló, el mismo ícono y, en el detalle, el
 *   aviso con «Reintentar» (recargar la página cerraría la sesión);
 * - se recuerda en la pestaña: ir y volver de «Mis recetas» no la pide de nuevo;
 * - en la tarjeta (`chica`) es decorativa: el nombre ya está en el título y en «Abrir», y el lector no lo repite.
 * - DL-191 (REC-02): la tarjeta pide la miniatura y el detalle, la grande. Una receta del Recetario de BE trae sus rutas ya
 *   firmadas (`rutas`): no pide un acceso por imagen.
 */
export function ImagenGuardada({
  token,
  medioId,
  nombre,
  sesionPerdida,
  chica = false,
  variante,
  rutas = null,
}: {
  token: string;
  medioId: string | null;
  nombre: string;
  sesionPerdida: (r: Resultado<unknown>) => boolean;
  chica?: boolean;
  variante?: VarianteDeMedio;
  rutas?: RutasDeLaImagen | null;
}) {
  const { estado, recargar } = useImagenDeMedio(token, medioId, sesionPerdida, { recordar: true, variante: variante ?? (chica ? 'thumbnail' : 'large'), rutas });
  const clase = `imagen-de-receta${chica ? ' imagen-de-receta--chica' : ''}`;
  if (estado.tipo === 'lista') return <img className={clase} src={estado.dataUrl} alt={chica ? '' : `${COPY_RECETAS.imagenDeReferencia}: ${nombre}`} decoding="async" />;
  const texto = estado.tipo === 'cargando' ? COPY_RECETAS.cargandoImagen : estado.tipo === 'fallo' ? `${nombre}: ${COPY_REGISTRO_DE_COMIDAS.imagenNoDisponible}` : `${nombre}: sin imagen de referencia`;
  const paraElLector = chica ? ({ 'aria-hidden': true } as const) : ({ role: 'img', 'aria-label': texto } as const);
  const respaldo = (
    <div className={`${clase} imagen-de-receta--respaldo${estado.tipo === 'cargando' ? ' imagen-de-receta--cargando' : ''}`} {...paraElLector}>
      {estado.tipo === 'cargando' ? null : <Icono nombre="comida" tamano={24} />}
    </div>
  );
  if (chica || estado.tipo !== 'fallo') return respaldo;
  return (
    <>
      {respaldo}
      <p className="nota">
        {COPY_REGISTRO_DE_COMIDAS.imagenNoDisponible}{' '}
        <button type="button" className="boton boton--enlace" onClick={() => void recargar()}>
          Reintentar
        </button>
      </p>
    </>
  );
}

/** La falla a la vista. `trasGuardar`: la receta se acaba de crear y la imagen no se pudo cargar. */
interface FallaDeLaImagen {
  readonly motivo: MotivoDeLaFalla;
  readonly trasGuardar: boolean;
}

/** Lo que devuelve `cargar`: el resultado de la carga, o que no había qué cargar. */
export type CargaDeLaImagen =
  | Exclude<ResultadoDeLaCarga, { readonly tipo: 'fallo' } | { readonly tipo: 'sesion-perdida' }>
  /** DL-180, segundo tramo: la sesión venció; lo elegido, para anotarlo y reintentarlo al volver. */
  | { readonly tipo: 'sesion-perdida'; readonly pendiente: ImagenPendiente }
  | { readonly tipo: 'sin-imagen' }
  | { readonly tipo: 'falta-la-procedencia' }
  /** Lo elegido, para que la receta ya guardada lo retome con su falla. */
  | { readonly tipo: 'fallo'; readonly pendiente: ImagenPendiente };

/**
 * NUA-06 · La imagen elegida y su carga, compartidas por la receta guardada y la nueva: el archivo revisado con
 * `revisarImagen` (las validaciones de `lib/medios`), la procedencia, la autoría, el medio ya subido y las claves de
 * intento. `pendiente`: la que se eligió al crear la receta y no se pudo cargar; se retoma tal cual, con su falla.
 */
export function useImagenParaCargar(token: string, sesionPerdida: (r: Resultado<unknown>) => boolean, pendiente: ImagenPendiente | null = null) {
  const subidaPropia = useClaveDeIntento();
  const asociacionPropia = useClaveDeIntento();
  // Las claves siguen con la imagen: si quedó pendiente con un intento incierto, el reintento reusa la suya.
  const claves = useRef<ClavesDeLaImagen>(pendiente?.claves ?? { subida: subidaPropia, asociacion: asociacionPropia }).current;
  const entrada = useRef<HTMLInputElement>(null);
  const [elegida, setElegida] = useState<ImagenElegida | null>(pendiente?.elegida ?? null);
  // El medio ya subido de la imagen elegida: si la asociación falla, el reintento no vuelve a subirla.
  const [subido, setSubido] = useState<string | null>(pendiente?.subido ?? null);
  const [procedencia, setProcedencia] = useState<ProcedenciaDeMedio | ''>(pendiente?.procedencia ?? '');
  const [autoria, setAutoria] = useState(pendiente?.autoria ?? '');
  const [falla, setFalla] = useState<FallaDeLaImagen | null>(pendiente ? { motivo: pendiente.motivo, trasGuardar: true } : null);
  const [faltaLaProcedencia, setFaltaLaProcedencia] = useState(false);
  const [cargando, setCargando] = useState(false);

  function quitar() {
    setElegida(null);
    setSubido(null);
    setProcedencia('');
    setAutoria('');
    setFalla(null);
    setFaltaLaProcedencia(false);
    claves.subida.descartar();
    claves.asociacion.descartar();
    if (entrada.current) entrada.current.value = '';
  }

  return {
    entrada,
    elegida,
    procedencia,
    autoria,
    falla,
    faltaLaProcedencia,
    cargando,
    async elegir(archivo: File | undefined) {
      setFalla(null);
      setElegida(null);
      setSubido(null);
      claves.subida.descartar();
      claves.asociacion.descartar();
      if (!archivo) return;
      const revision = await revisarImagen(archivo);
      // Tipo, peso, dimensiones o un archivo que no se lee: el mismo texto, con los límites a la vista.
      if (!revision.ok) return setFalla({ motivo: 'INVALIDA', trasGuardar: false });
      setElegida(revision.imagen);
    },
    /** La procedencia y la autoría se declaran al subir: si cambian, el medio ya subido no sirve y se sube de nuevo. */
    cambiarProcedencia(valor: string) {
      const p = ProcedenciaDeMedioSchema.safeParse(valor);
      setProcedencia(p.success ? p.data : '');
      setFaltaLaProcedencia(false);
      setSubido(null);
    },
    cambiarAutoria(valor: string) {
      setAutoria(valor);
      setSubido(null);
    },
    quitar,
    /**
     * Sube (si hace falta) y asocia la imagen elegida a `receta`, en su `version`. `trasGuardar`: la receta se acaba de
     * crear; si la imagen falla, se dice así y lo elegido vuelve como `pendiente`. Un reintento sigue diciéndolo.
     */
    async cargar(receta: Pick<Receta, 'recipeId' | 'version'>, trasGuardar = falla?.trasGuardar ?? false): Promise<CargaDeLaImagen> {
      if (!elegida) return { tipo: 'sin-imagen' };
      if (!procedencia) {
        setFaltaLaProcedencia(true);
        return { tipo: 'falta-la-procedencia' };
      }
      setFaltaLaProcedencia(false);
      setFalla(null);
      setCargando(true);
      const declarada = autoria.trim() || null;
      const r = await cargarLaImagen(
        {
          subir: (clave) => subirImagen(token, elegida, { finalidad: 'RECIPE_REFERENCE', procedencia, autoria: declarada }, clave),
          asociar: (mediaId, expectedVersion, clave) => api.asociarImagenDeReceta(token, receta.recipeId, { mediaId, expectedVersion }, clave),
        },
        { version: receta.version, subido, claves, sesionPerdida, queSeSube: JSON.stringify([elegida.archivo.name, elegida.archivo.size, procedencia, declarada]) },
      );
      setCargando(false);
      // DL-180, segundo tramo: lo elegido vuelve como pendiente, para anotarlo y reintentarlo al volver de la entrada.
      if (r.tipo === 'sesion-perdida') return { tipo: 'sesion-perdida', pendiente: { recetaId: receta.recipeId, elegida, procedencia, autoria, subido: r.subido, motivo: 'NO_CARGADA', claves } };
      if (r.tipo === 'fallo') {
        setSubido(r.subido);
        setFalla({ motivo: r.motivo, trasGuardar });
        return { tipo: 'fallo', pendiente: { recetaId: receta.recipeId, elegida, procedencia, autoria, subido: r.subido, motivo: r.motivo, claves } };
      }
      quitar();
      return r;
    },
  };
}

export type ImagenParaCargar = ReturnType<typeof useImagenParaCargar>;

/**
 * DL-180, segundo tramo: al volver de la entrada, si la sesión venció mientras se cargaba la imagen de una receta recién
 * creada, se dice y se ofrece reintentar (`alReintentar` abre esa receta con lo elegido) o dejarlo para después.
 */
export function AvisoDeLaImagenSinCargar({ alReintentar }: { alReintentar: (recetaId: string) => void }) {
  const [anotada, setAnotada] = useState(laImagenSinCargar);
  if (!anotada) return null;
  return (
    <Aviso tipo="info">
      <div data-imagen-sin-cargar>
        <p>{COPY_RECETAS.imagenSinCargarPorLaSesion(anotada.nombre)}</p>
        <div className="acciones">
          <button type="button" className="boton boton--primario" onClick={() => alReintentar(anotada.recetaId)}>
            <Icono nombre="imagen" tamano={18} />
            {COPY_RECETAS.reintentarImagen}
          </button>
          <button
            type="button"
            className="boton boton--secundario"
            onClick={() => {
              olvidarLaImagenSinCargar();
              setAnotada(null);
            }}
          >
            {COPY_RECETAS.ahoraNo}
          </button>
        </div>
      </div>
    </Aviso>
  );
}

/** El grupo de la imagen, igual al crear la receta y con la receta guardada: el título y qué es una imagen de referencia. */
function MarcoDeLaImagen({ id, titulo, children }: { id: string; titulo: string; children: ReactNode }) {
  return (
    <fieldset className="grupo" aria-describedby={`${id}-aviso`} data-imagen-de-la-receta>
      <legend>{titulo}</legend>
      <p id={`${id}-aviso`} className="nota">
        {COPY_RECETAS.avisoDeImagen}
      </p>
      {children}
    </fieldset>
  );
}

/**
 * NUA-06 · El control para elegir la imagen, el mismo al crear la receta y con la receta guardada: el archivo, la vista
 * previa, la procedencia y la autoría. `children`: lo que va debajo de la vista previa («Cargar imagen» o «Quitar»).
 */
function EleccionDeImagen({
  id,
  imagen,
  hayGuardada,
  apagado,
  errorDeProcedencia,
  alCambiar,
  children,
}: {
  id: string;
  imagen: ImagenParaCargar;
  hayGuardada: boolean;
  apagado: boolean;
  errorDeProcedencia: string | null;
  /** Al crear la receta: lo elegido cuenta como algo escrito sin guardar. */
  alCambiar?: () => void;
  children: ReactNode;
}) {
  const elegida = imagen.elegida;
  return (
    <>
      <div className="campo">
        <label htmlFor={`${id}-archivo`}>{hayGuardada ? COPY_RECETAS.reemplazarImagen : COPY_RECETAS.elegirImagen}</label>
        <p id={`${id}-archivo-ayuda`} className="campo__ayuda">
          JPG, PNG o WebP, de hasta 10 MB.
        </p>
        <input
          ref={imagen.entrada}
          id={`${id}-archivo`}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          aria-describedby={`${id}-archivo-ayuda`}
          disabled={apagado}
          onChange={(e) => {
            void imagen.elegir(e.target.files?.[0]);
            alCambiar?.();
          }}
        />
      </div>
      {elegida ? (
        <div className="vista-previa">
          <p className="lista__titulo">{COPY_RECETAS.vistaPrevia}</p>
          <img className="imagen-de-receta" src={elegida.vistaPrevia} alt={`${COPY_RECETAS.vistaPrevia}: ${elegida.archivo.name}`} decoding="async" />
          <p className="nota">
            {elegida.archivo.name} · {elegida.ancho} × {elegida.alto} px
          </p>
          <div className={`campo${errorDeProcedencia ? ' campo--error' : ''}`}>
            <label htmlFor={`${id}-procedencia`}>{COPY_RECETAS.procedenciaDeLaImagen}</label>
            <select
              id={`${id}-procedencia`}
              value={imagen.procedencia}
              disabled={apagado}
              aria-invalid={errorDeProcedencia ? true : undefined}
              aria-describedby={errorDeProcedencia ? `${id}-procedencia-error` : undefined}
              onChange={(e) => {
                imagen.cambiarProcedencia(e.target.value);
                alCambiar?.();
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
          <Campo
            id={`${id}-autoria`}
            etiqueta={COPY_RECETAS.autoria}
            value={imagen.autoria}
            disabled={apagado}
            onChange={(e) => {
              imagen.cambiarAutoria(e.target.value);
              alCambiar?.();
            }}
            maxLength={120}
          />
          {children}
        </div>
      ) : null}
      {/* Recién creada la receta, el foco va al aviso: dice que la receta quedó guardada y deja el reintento a mano. */}
      {imagen.falla ? (
        <Aviso tipo="error" enfocar={imagen.falla.trasGuardar}>
          <p>{textoDeLaFalla(imagen.falla.motivo, imagen.falla.trasGuardar)}</p>
        </Aviso>
      ) : null}
    </>
  );
}

/**
 * NUA-06 · La imagen de una receta que todavía no se guardó: el mismo control que con la receta guardada, sin «Cargar
 * imagen». La carga el editor al guardar la receta, con la versión que devuelve la creación. La procedencia, si falta, la
 * marca el formulario (`errorDeProcedencia`), con el resto de lo que falta.
 */
export function ImagenDeLaRecetaNueva({
  id,
  imagen,
  apagado,
  errorDeProcedencia,
  alCambiar,
}: {
  id: string;
  imagen: ImagenParaCargar;
  apagado: boolean;
  errorDeProcedencia: string | null;
  alCambiar: () => void;
}) {
  return (
    <MarcoDeLaImagen id={id} titulo={COPY_RECETAS.imagenDeReferenciaOpcional}>
      <EleccionDeImagen id={id} imagen={imagen} hayGuardada={false} apagado={apagado} errorDeProcedencia={errorDeProcedencia} alCambiar={alCambiar}>
        <p className="nota">{COPY_RECETAS.seCargaAlGuardar}</p>
        <div className="acciones">
          <button
            type="button"
            className="boton boton--enlace"
            disabled={apagado}
            onClick={() => {
              imagen.quitar();
              alCambiar();
              // La vista previa se va con el botón: el foco vuelve a «Elegir imagen».
              imagen.entrada.current?.focus();
            }}
          >
            {COPY_RECETAS.quitarImagenElegida}
          </button>
        </div>
      </EleccionDeImagen>
    </MarcoDeLaImagen>
  );
}

export function ImagenDeReceta({
  token,
  receta,
  sesionPerdida,
  onCambio,
  imagen: deAfuera,
  pendiente = null,
}: {
  token: string;
  receta: Receta;
  sesionPerdida: (r: Resultado<unknown>) => boolean;
  onCambio: (r: Receta, aviso: string) => void;
  /** NUA-06: la elección del que la contiene (el editor de la receta la lleva desde que se creó). */
  imagen?: ImagenParaCargar;
  /** NUA-06: la imagen elegida al crear la receta que no se pudo cargar (el paso de la foto del plan la retoma). */
  pendiente?: ImagenPendiente | null;
}) {
  const id = useId();
  const propia = useImagenParaCargar(token, sesionPerdida, deAfuera ? null : pendiente);
  const imagen = deAfuera ?? propia;
  const [retirando, setRetirando] = useState(false);
  const [confirmarRetiro, setConfirmarRetiro] = useState(false);
  const [falloDeRetiro, setFalloDeRetiro] = useState<string | null>(null);
  const intentoDeRetiro = useClaveDeIntento();
  const ocupado = imagen.cargando || retirando;

  async function cargar() {
    const r = await imagen.cargar(receta);
    if (r.tipo === 'asociada') onCambio(r.receta, COPY_RECETAS.imagenCargada);
  }

  async function retirar() {
    setRetirando(true);
    setFalloDeRetiro(null);
    const r = await api.retirarImagenDeReceta(token, receta.recipeId, receta.version, intentoDeRetiro.actual());
    intentoDeRetiro.registrar(r);
    setRetirando(false);
    if (sesionPerdida(r)) return;
    if (!r.ok) return setFalloDeRetiro(mensajeDeFallo(r));
    setConfirmarRetiro(false);
    onCambio(r.datos.data, COPY_RECETAS.imagenRetirada);
  }

  const guardada = receta.image;
  const figura = guardada ? (
    <figure className="figura-de-receta">
      <ImagenGuardada token={token} medioId={guardada.mediaId} nombre={receta.name} sesionPerdida={sesionPerdida} rutas={guardada.paths ?? null} />
      <figcaption className="nota">
        {COPY_RECETAS.imagenDeReferencia} · {ETIQUETA_DE_PROCEDENCIA_DE_IMAGEN[guardada.provenance]}
        {guardada.authorship ? ` · ${guardada.authorship}` : ''} · {guardada.width} × {guardada.height} px · {fecha(guardada.attachedAt)}
      </figcaption>
    </figure>
  ) : null;
  // DL-191: la imagen de una receta del Recetario de BE no se cambia: se muestra, con su procedencia.
  if (receta.origin === 'BE_RECIPE_BOOK') {
    return (
      <MarcoDeLaImagen id={id} titulo={COPY_RECETAS.imagenDeReferencia}>
        {figura ?? <p className="nota">{COPY_RECETARIO.sinFoto}</p>}
        <p className="nota">{COPY_RECETARIO.soloLectura}</p>
      </MarcoDeLaImagen>
    );
  }
  return (
    <MarcoDeLaImagen id={id} titulo={COPY_RECETAS.imagenDeReferencia}>
      {figura}

      <EleccionDeImagen id={id} imagen={imagen} hayGuardada={guardada !== null} apagado={ocupado} errorDeProcedencia={imagen.faltaLaProcedencia ? COPY_RECETAS.faltaLaProcedencia : null}>
        <div className="acciones">
          <button type="button" className="boton boton--primario" onClick={() => void cargar()} disabled={ocupado} data-cargar-la-imagen>
            {imagen.cargando ? COPY_RECETAS.cargandoImagen : imagen.falla?.trasGuardar ? COPY_RECETAS.reintentarImagen : COPY_RECETAS.cargarImagen}
          </button>
        </div>
      </EleccionDeImagen>
      {guardada ? (
        <div className="acciones">
          <button type="button" className="boton boton--enlace" onClick={() => setConfirmarRetiro(true)} disabled={ocupado}>
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
        enviando={retirando}
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
    </MarcoDeLaImagen>
  );
}
