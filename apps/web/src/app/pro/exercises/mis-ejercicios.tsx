'use client';

/**
 * «Mis ejercicios» (DL-123): los ejercicios que el profesional de Entrenamiento cargó a mano, con su imagen.
 * - La imagen se asocia al ejercicio y a su versión por identidad, nunca por nombre.
 * - Crear un ejercicio acá es lo mismo que hacerlo desde el editor del plan (API-INT-TRN-01).
 * - Un profesional sin el área de Entrenamiento recibe 403 y la página lo dice: mostrar u ocultar no autoriza nada.
 * - DL-146 (hallazgo 8 del análisis del 2026-10-18): los ejercicios van en una grilla, cada uno con su imagen, su nombre y
 *   su fecha. El formulario de la imagen se abre solo en el que se edita: antes, cuatro ejercicios ocupaban 3.124 px.
 * - WP-CATALOGO-VISUAL (etapa 2; DL-081): cada tarjeta dice sus zonas musculares en un renglón, y «Ver detalle» la abre a
 *   todo el ancho con la imagen y la figura de las zonas (la ficha visual, API-EJE-05). Uno abierto por vez, como la
 *   imagen que se edita.
 * - WP-TABLERO-ALTA-GAMA TB-48: «Cargar las zonas» (o «Cambiar las zonas») en cada tarjeta, con la ficha visual ya
 *   leída: las 17 zonas del catálogo con su rol y la figura de siempre al lado (`zonas-del-ejercicio.tsx`, API-EJE-04).
 *   Al cerrar, el foco vuelve a ese botón.
 */
import {
  ARTICULACIONES,
  COPY_EJERCICIOS_PROPIOS,
  COPY_FIGURA_DE_ZONAS,
  EQUIPAMIENTOS,
  GRUPOS_MUSCULARES,
  NOMBRE_DE_LAS_ARTICULACIONES,
  NOMBRE_DEL_EQUIPAMIENTO,
  NOMBRE_DEL_GRUPO_MUSCULAR,
  NOMBRE_DEL_PATRON,
  PATRONES_DE_MOVIMIENTO,
  clasificacionEnUnRenglon,
  zonasEnUnRenglon,
  type Articulaciones,
  type ClasificacionDeEjercicio,
  type EjercicioPropio,
  type Equipamiento,
  type GrupoMuscular,
  type PatronDeMovimiento,
} from '@be/domain';
import { usePathname, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Pestanas } from '../../../components/pestanas';
import { CatalogoDeBe } from './catalogo-de-be';
import { AvisoFlotante } from '../../../components/ayuda';
import { Cargando, ErrorConReintento } from '../../../components/estados';
import { Aviso, Campo } from '../../../components/formulario';
import { Icono } from '../../../components/icono';
import { api } from '../../../lib/api';
import { fecha } from '../../../lib/formato';
import { useFichasVisuales, type LecturaDeFichas } from '../../../lib/fichas-visuales';
import { mensajeDeFallo, useClaveDeIntento } from '../../../lib/intento';
import { SinEspacioProfesional, useEspacioProfesional } from '../espacio-profesional';
import { DetalleVisualDeEjercicio } from './detalle-visual';
import { ImagenDeEjercicio, ImagenGuardadaDeEjercicio } from './imagen-de-ejercicio';
import { ZonasDelEjercicio } from './zonas-del-ejercicio';
import { COPY_ZONAS_PROPIAS } from './zonas-propias';
import { EsperandoSesion } from '../../../lib/sesion';
import { COPY_CLASIFICACION_DEL_PROPIO, CuadroDeLaClasificacion } from './clasificacion-del-propio';
import { invalidarElCatalogo } from '../advisees/training/catalogo-en-la-sesion';

type Estado = { tipo: 'cargando' } | { tipo: 'error' } | { tipo: 'sin-area' } | { tipo: 'listo'; ejercicios: EjercicioPropio[] };

type Vista = 'propios' | 'catalogo';

/** DL-197 (ET1-D14): la clasificación opcional de un ejercicio propio, al crearlo. */
const SIN_CLASIFICAR: ClasificacionDeEjercicio = { muscleGroup: null, equipment: [], movementPattern: null, joints: null };

export function MisEjercicios() {
  const { token, sesionPerdida, yo, cargarYo } = useEspacioProfesional('/pro/exercises');
  // DL-197 (F23): la pestaña, en la dirección, como en Recetas.
  const parametros = useSearchParams();
  const ruta = usePathname();
  const vista: Vista = parametros.get('vista') === 'catalogo' ? 'catalogo' : 'propios';
  const [clasificacion, setClasificacion] = useState<ClasificacionDeEjercicio>(SIN_CLASIFICAR);
  const [estado, setEstado] = useState<Estado>({ tipo: 'cargando' });
  const [aviso, setAviso] = useState<string | null>(null);
  const [nombre, setNombre] = useState('');
  const [fallo, setFallo] = useState<string | null>(null);
  const [creando, setCreando] = useState(false);
  // El ejercicio cuya imagen se está editando: uno por vez.
  const [editando, setEditando] = useState<string | null>(null);
  // El ejercicio cuyo detalle (imagen y zonas) está abierto: uno por vez.
  const [detalle, setDetalle] = useState<string | null>(null);
  // TB-48: el ejercicio cuyas zonas se están cargando o cambiando: uno por vez, como la imagen.
  const [zonas, setZonas] = useState<string | null>(null);
  const [paraEnfocar, setParaEnfocar] = useState<string | null>(null);
  // DL-198 (ET2-11): el ejercicio cuya clasificación se cambia, en su cuadro.
  const [clasificando, setClasificando] = useState<EjercicioPropio | null>(null);
  const intento = useClaveDeIntento();
  const listo = yo.tipo === 'listo';

  const cargar = useCallback(async () => {
    if (!token || !listo) return;
    setEstado({ tipo: 'cargando' });
    const r = await api.ejerciciosPropios(token);
    if (sesionPerdida(r)) return;
    if (!r.ok) return setEstado(r.tipo === 'API' && r.codigo === 'ACTION_FORBIDDEN' ? { tipo: 'sin-area' } : { tipo: 'error' });
    setEstado({ tipo: 'listo', ejercicios: r.datos.data });
  }, [token, listo, sesionPerdida]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  // Las zonas y la imagen de cada ejercicio, de la ficha visual: una lectura aparte, que puede fallar sola.
  const { lectura: fichas, releer: releerFichas } = useFichasVisuales(listo ? token : null, estado.tipo === 'listo' ? estado.ejercicios.map((e) => e.exerciseId) : [], sesionPerdida);
  const fichaDe = (exerciseId: string) => (fichas.tipo === 'lista' ? fichas.fichas.get(exerciseId) : undefined);

  // Al cerrar las zonas, el foco vuelve al botón que las abrió, en cuanto la tarjeta está dibujada.
  useEffect(() => {
    if (!paraEnfocar) return;
    const boton = document.getElementById(paraEnfocar);
    if (!boton) return;
    boton.focus();
    setParaEnfocar(null);
  });
  const cerrarZonas = (exerciseId: string) => {
    setZonas(null);
    setParaEnfocar(`zonas-de-${exerciseId}`);
  };

  async function crear() {
    if (!token) return;
    if (!nombre.trim()) return setFallo('Escribí el nombre del ejercicio.');
    setCreando(true);
    setFallo(null);
    const conAlgo = clasificacion.muscleGroup || clasificacion.equipment.length > 0 || clasificacion.movementPattern || clasificacion.joints;
    const r = await api.crearEjercicio(token, nombre.trim(), intento.actual(), conAlgo ? clasificacion : undefined);
    intento.registrar(r);
    setCreando(false);
    if (sesionPerdida(r)) return;
    if (!r.ok) return setFallo(mensajeDeFallo(r));
    // DL-199 (ET3-24): el catálogo de la sesión se vuelve a leer con el nuevo.
    invalidarElCatalogo();
    setNombre('');
    setClasificacion(SIN_CLASIFICAR);
    setAviso(COPY_EJERCICIOS_PROPIOS.ejercicioCreado);
    await cargar();
  }

  /** Lo que respondió la API después de asociar o retirar: reemplaza ese ejercicio en la lista, sin recargar todo. */
  const actualizar = (e: EjercicioPropio, texto: string) => {
    setEstado((s) => (s.tipo === 'listo' ? { tipo: 'listo', ejercicios: s.ejercicios.map((x) => (x.exerciseId === e.exerciseId ? e : x)) } : s));
    setAviso(texto);
    setEditando(null);
    // La imagen nueva también es la de la ficha visual del detalle.
    releerFichas();
  };

  if (!token) return <EsperandoSesion />;
  if (yo.tipo === 'cargando') return <Cargando />;
  if (yo.tipo === 'error') return <ErrorConReintento onReintentar={cargarYo} />;
  if (yo.tipo === 'sin-espacio') return <SinEspacioProfesional />;
  if (estado.tipo === 'sin-area') {
    return (
      <Aviso tipo="info">
        <p>{COPY_EJERCICIOS_PROPIOS.soloEntrenamiento}</p>
      </Aviso>
    );
  }

  const pestanas = (
    <Pestanas<Vista>
      etiqueta="Ejercicios"
      vistas={[
        { clave: 'propios', texto: 'Mis ejercicios', icono: 'entrenamiento' },
        { clave: 'catalogo', texto: 'Catálogo de BE', icono: 'tilde' },
      ]}
      actual={vista}
      href={(c) => (c === 'catalogo' ? `${ruta}?vista=catalogo` : ruta)}
    />
  );
  if (vista === 'catalogo') {
    return (
      <div className="secciones">
        {pestanas}
        <CatalogoDeBe token={token} sesionPerdida={sesionPerdida} />
      </div>
    );
  }
  const elegir = <K extends string>(clave: string, rotulo: string, valores: readonly K[], nombres: Readonly<Record<K, string>>, valor: K | null, alElegir: (v: K | null) => void) => (
    <div className="campo">
      <label htmlFor={`ejercicio-nuevo-${clave}`}>{rotulo}</label>
      <select id={`ejercicio-nuevo-${clave}`} value={valor ?? ''} onChange={(e) => alElegir((e.target.value || null) as K | null)} data-clasificacion-nueva={clave}>
        <option value="">Sin indicar</option>
        {valores.map((v) => (
          <option key={v} value={v}>
            {nombres[v]}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="secciones">
      {pestanas}
      {aviso ? (
        <AvisoFlotante onCerrar={() => setAviso(null)}>
          <p>{aviso}</p>
        </AvisoFlotante>
      ) : null}
      <section className="seccion" aria-labelledby="titulo-ejercicios">
        <h2 id="titulo-ejercicios">{COPY_EJERCICIOS_PROPIOS.tusEjercicios}</h2>
        {/* Quién los ve es parte de decidir qué cargar: va a la vista, en una línea (GUIA-UX-UI I.2). */}
        <p className="nota">{COPY_EJERCICIOS_PROPIOS.queEs}</p>
        <fieldset className="grupo">
          <legend>{COPY_EJERCICIOS_PROPIOS.crearEjercicio}</legend>
          <div className="fila-de-dato">
            <Campo id="ejercicio-nuevo" etiqueta={COPY_EJERCICIOS_PROPIOS.nombreDelEjercicio} value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={120} error={fallo ?? undefined} />
          </div>
          {/* DL-197 (ET1-D14): la clasificación, opcional: la usan los filtros de «Agregar ejercicios». */}
          <div className="clasificacion-nueva" data-clasificacion-del-propio>
            {elegir<GrupoMuscular>('grupo', 'Grupo muscular', GRUPOS_MUSCULARES, NOMBRE_DEL_GRUPO_MUSCULAR, clasificacion.muscleGroup, (v) => setClasificacion((c) => ({ ...c, muscleGroup: v })))}
            {elegir<Equipamiento>('equipamiento', 'Equipamiento', EQUIPAMIENTOS, NOMBRE_DEL_EQUIPAMIENTO, clasificacion.equipment[0] ?? null, (v) => setClasificacion((c) => ({ ...c, equipment: v ? [v] : [] })))}
            {elegir<PatronDeMovimiento>('patron', 'Patrón', PATRONES_DE_MOVIMIENTO, NOMBRE_DEL_PATRON, clasificacion.movementPattern, (v) => setClasificacion((c) => ({ ...c, movementPattern: v })))}
            {elegir<Articulaciones>('articulaciones', 'Articulaciones', ARTICULACIONES, NOMBRE_DE_LAS_ARTICULACIONES, clasificacion.joints, (v) => setClasificacion((c) => ({ ...c, joints: v })))}
          </div>
          <div className="fila-de-dato">
            <div className="acciones">
              <button type="button" className="boton boton--primario" onClick={() => void crear()} disabled={creando}>
                {COPY_EJERCICIOS_PROPIOS.crearEjercicio}
              </button>
            </div>
          </div>
        </fieldset>
        {estado.tipo === 'cargando' ? <Cargando /> : null}
        {estado.tipo === 'error' ? <ErrorConReintento onReintentar={() => void cargar()} /> : null}
        {estado.tipo === 'listo' ? (
          estado.ejercicios.length === 0 ? (
            <p>{COPY_EJERCICIOS_PROPIOS.sinEjercicios}</p>
          ) : (
            <ul className="grilla-de-ejercicios">
              {estado.ejercicios.map((e) =>
                zonas === e.exerciseId && fichaDe(e.exerciseId) ? (
                  <li key={e.exerciseId} className="ejercicio-propio ejercicio-propio--editando ejercicio-propio--detalle">
                    <ZonasDelEjercicio
                      token={token}
                      nombre={e.name}
                      ficha={fichaDe(e.exerciseId)!}
                      sesionPerdida={sesionPerdida}
                      onCancelar={() => cerrarZonas(e.exerciseId)}
                      onGuardadas={() => {
                        cerrarZonas(e.exerciseId);
                        setAviso(COPY_ZONAS_PROPIAS.guardadas(e.name));
                        // La ficha nueva es la que muestran la tarjeta y el detalle.
                        releerFichas();
                      }}
                    />
                  </li>
                ) : editando === e.exerciseId ? (
                  <li key={e.exerciseId} className="ejercicio-propio ejercicio-propio--editando">
                    <div className="ejercicio-propio__encabezado">
                      <p className="lista__titulo">{e.name}</p>
                      <button type="button" className="boton boton--enlace" onClick={() => setEditando(null)}>
                        {COPY_EJERCICIOS_PROPIOS.cerrarImagen}
                      </button>
                    </div>
                    <ImagenDeEjercicio token={token} ejercicio={e} sesionPerdida={sesionPerdida} onCambio={actualizar} />
                  </li>
                ) : detalle === e.exerciseId ? (
                  <li key={e.exerciseId} className="ejercicio-propio ejercicio-propio--editando ejercicio-propio--detalle">
                    <div className="ejercicio-propio__encabezado">
                      <p className="lista__titulo">{e.name}</p>
                      <button type="button" className="boton boton--enlace" onClick={() => setDetalle(null)}>
                        {COPY_FIGURA_DE_ZONAS.cerrarDetalle}
                      </button>
                    </div>
                    <DetalleDeLaTarjeta token={token} ejercicio={e} fichas={fichas} onReleer={releerFichas} sesionPerdida={sesionPerdida} />
                  </li>
                ) : (
                  <li key={e.exerciseId} className="ejercicio-propio">
                    <ImagenGuardadaDeEjercicio token={token} medioId={e.image?.mediaId ?? null} nombre={e.name} textoAlternativo={e.image?.altText} sesionPerdida={sesionPerdida} />
                    <p className="lista__titulo">{e.name}</p>
                    <p className="nota">
                      Cargado el {fecha(e.createdAt)}
                      {e.available ? '' : ' · retirado del catálogo'}
                    </p>
                    <ZonasDeLaTarjeta exerciseId={e.exerciseId} fichas={fichas} />
                    {/* DL-198 (ET2-11): la clasificación, en un renglón (o «Sin indicar»). */}
                    <p className="nota ejercicio-propio__clasificacion" data-clasificacion-en-la-tarjeta>
                      {clasificacionEnUnRenglon(e.classification) ?? `Clasificación: ${COPY_CLASIFICACION_DEL_PROPIO.sinIndicar}`}
                    </p>
                    <div className="ejercicio-propio__acciones">
                      <button
                        type="button"
                        className="boton boton--quieto boton--compacto"
                        onClick={() => {
                          setEditando(null);
                          setZonas(null);
                          setDetalle(e.exerciseId);
                        }}
                      >
                        <Icono nombre="ver" tamano={18} />
                        {COPY_FIGURA_DE_ZONAS.verDetalle}
                      </button>
                      <button
                        type="button"
                        className="boton boton--quieto boton--compacto"
                        onClick={() => {
                          setDetalle(null);
                          setZonas(null);
                          setEditando(e.exerciseId);
                        }}
                      >
                        <Icono nombre="imagen" tamano={18} />
                        {e.image ? COPY_EJERCICIOS_PROPIOS.cambiarImagen : COPY_EJERCICIOS_PROPIOS.agregarImagen}
                      </button>
                      <button
                        type="button"
                        id={`clasificacion-de-${e.exerciseId}`}
                        className="boton boton--quieto boton--compacto"
                        data-cambiar-clasificacion
                        onClick={() => setClasificando(e)}
                      >
                        <Icono nombre="filtros" tamano={18} />
                        {clasificacionEnUnRenglon(e.classification) ? COPY_CLASIFICACION_DEL_PROPIO.cambiar : COPY_CLASIFICACION_DEL_PROPIO.clasificar}
                      </button>
                      {/* TB-48: con la ficha visual leída (sus zonas de hoy y el número de la última asignación). */}
                      {fichaDe(e.exerciseId) ? (
                        <button
                          type="button"
                          id={`zonas-de-${e.exerciseId}`}
                          className="boton boton--quieto boton--compacto"
                          data-cambiar-zonas
                          onClick={() => {
                            setDetalle(null);
                            setEditando(null);
                            setZonas(e.exerciseId);
                          }}
                        >
                          <Icono nombre="entrenamiento" tamano={18} />
                          {fichaDe(e.exerciseId)!.muscleZones.length > 0 ? COPY_ZONAS_PROPIAS.cambiar : COPY_ZONAS_PROPIAS.cargar}
                        </button>
                      ) : null}
                    </div>
                  </li>
                ),
              )}
            </ul>
          )
        ) : null}
      </section>
      {clasificando ? (
        <CuadroDeLaClasificacion
          abierto
          token={token}
          ejercicio={clasificando}
          sesionPerdida={sesionPerdida}
          onCerrar={() => {
            setParaEnfocar(`clasificacion-de-${clasificando.exerciseId}`);
            setClasificando(null);
          }}
          onGuardada={(x) => {
            invalidarElCatalogo();
            setEstado((s) => (s.tipo === 'listo' ? { tipo: 'listo', ejercicios: s.ejercicios.map((y) => (y.exerciseId === x.exerciseId ? x : y)) } : s));
            setAviso(COPY_CLASIFICACION_DEL_PROPIO.guardada(x.name));
            setParaEnfocar(`clasificacion-de-${x.exerciseId}`);
            setClasificando(null);
          }}
        />
      ) : null}
    </div>
  );
}

/** Las zonas de un ejercicio en un renglón, en su tarjeta. Mientras se leen, o si no tiene, no dice nada: el detalle sí. */
function ZonasDeLaTarjeta({ exerciseId, fichas }: { exerciseId: string; fichas: LecturaDeFichas }) {
  const ficha = fichas.tipo === 'lista' ? fichas.fichas.get(exerciseId) : undefined;
  const renglon = ficha ? zonasEnUnRenglon(ficha.muscleZones) : null;
  if (!renglon) return null;
  return (
    <p className="nota ejercicio-propio__zonas" data-zonas-del-ejercicio>
      <span className="visualmente-oculto">{COPY_FIGURA_DE_ZONAS.titulo}: </span>
      <Icono nombre="entrenamiento" tamano={15} />
      {renglon}
    </p>
  );
}

/** El detalle abierto: la imagen y la figura de las zonas, o lo que pasó con la lectura de la ficha. */
function DetalleDeLaTarjeta({
  token,
  ejercicio,
  fichas,
  onReleer,
  sesionPerdida,
}: {
  token: string;
  ejercicio: EjercicioPropio;
  fichas: LecturaDeFichas;
  onReleer: () => void;
  sesionPerdida: Parameters<typeof useFichasVisuales>[2];
}) {
  if (fichas.tipo === 'cargando') return <Cargando />;
  if (fichas.tipo === 'falla') {
    return (
      <Aviso tipo="error">
        <p>
          {COPY_FIGURA_DE_ZONAS.noSePudieronLeer} {fichas.motivo}
        </p>
        <button type="button" className="boton boton--secundario" onClick={onReleer}>
          Reintentar
        </button>
      </Aviso>
    );
  }
  const ficha = fichas.tipo === 'lista' ? fichas.fichas.get(ejercicio.exerciseId) : undefined;
  if (!ficha) return <ImagenGuardadaDeEjercicio token={token} medioId={ejercicio.image?.mediaId ?? null} nombre={ejercicio.name} textoAlternativo={ejercicio.image?.altText} sesionPerdida={sesionPerdida} />;
  return <DetalleVisualDeEjercicio token={token} ficha={ficha} nombre={ejercicio.name} sesionPerdida={sesionPerdida} />;
}
