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
 */
import { COPY_EJERCICIOS_PROPIOS, COPY_FIGURA_DE_ZONAS, zonasEnUnRenglon, type EjercicioPropio } from '@be/domain';
import { useCallback, useEffect, useState } from 'react';
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
import { EsperandoSesion } from '../../../lib/sesion';

type Estado = { tipo: 'cargando' } | { tipo: 'error' } | { tipo: 'sin-area' } | { tipo: 'listo'; ejercicios: EjercicioPropio[] };

export function MisEjercicios() {
  const { token, sesionPerdida, yo, cargarYo } = useEspacioProfesional('/pro/exercises');
  const [estado, setEstado] = useState<Estado>({ tipo: 'cargando' });
  const [aviso, setAviso] = useState<string | null>(null);
  const [nombre, setNombre] = useState('');
  const [fallo, setFallo] = useState<string | null>(null);
  const [creando, setCreando] = useState(false);
  // El ejercicio cuya imagen se está editando: uno por vez.
  const [editando, setEditando] = useState<string | null>(null);
  // El ejercicio cuyo detalle (imagen y zonas) está abierto: uno por vez.
  const [detalle, setDetalle] = useState<string | null>(null);
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

  async function crear() {
    if (!token) return;
    if (!nombre.trim()) return setFallo('Escribí el nombre del ejercicio.');
    setCreando(true);
    setFallo(null);
    const r = await api.crearEjercicio(token, nombre.trim(), intento.actual());
    intento.registrar(r);
    setCreando(false);
    if (sesionPerdida(r)) return;
    if (!r.ok) return setFallo(mensajeDeFallo(r));
    setNombre('');
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

  return (
    <div className="secciones">
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
                editando === e.exerciseId ? (
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
                    <div className="ejercicio-propio__acciones">
                      <button
                        type="button"
                        className="boton boton--quieto boton--compacto"
                        onClick={() => {
                          setEditando(null);
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
                          setEditando(e.exerciseId);
                        }}
                      >
                        <Icono nombre="imagen" tamano={18} />
                        {e.image ? COPY_EJERCICIOS_PROPIOS.cambiarImagen : COPY_EJERCICIOS_PROPIOS.agregarImagen}
                      </button>
                    </div>
                  </li>
                ),
              )}
            </ul>
          )
        ) : null}
      </section>
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
