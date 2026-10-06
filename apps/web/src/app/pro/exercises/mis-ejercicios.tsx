'use client';

/**
 * «Mis ejercicios» (DL-123): los ejercicios que el profesional de Entrenamiento cargó a mano, con su imagen.
 * - La imagen se asocia al ejercicio y a su versión por identidad, nunca por nombre.
 * - Crear un ejercicio acá es lo mismo que hacerlo desde el editor del plan (API-INT-TRN-01).
 * - Un profesional sin el área de Entrenamiento recibe 403 y la página lo dice: mostrar u ocultar no autoriza nada.
 */
import { COPY_EJERCICIOS_PROPIOS, type EjercicioPropio } from '@be/domain';
import { useCallback, useEffect, useState } from 'react';
import { Ayuda, AvisoFlotante } from '../../../components/ayuda';
import { Cargando, ErrorConReintento } from '../../../components/estados';
import { Aviso, Campo } from '../../../components/formulario';
import { api } from '../../../lib/api';
import { fecha } from '../../../lib/formato';
import { mensajeDeFallo, useClaveDeIntento } from '../../../lib/intento';
import { SinEspacioProfesional, useEspacioProfesional } from '../espacio-profesional';
import { ImagenDeEjercicio } from './imagen-de-ejercicio';

type Estado = { tipo: 'cargando' } | { tipo: 'error' } | { tipo: 'sin-area' } | { tipo: 'listo'; ejercicios: EjercicioPropio[] };

export function MisEjercicios() {
  const { token, sesionPerdida, yo, cargarYo } = useEspacioProfesional('/pro/exercises');
  const [estado, setEstado] = useState<Estado>({ tipo: 'cargando' });
  const [aviso, setAviso] = useState<string | null>(null);
  const [nombre, setNombre] = useState('');
  const [fallo, setFallo] = useState<string | null>(null);
  const [creando, setCreando] = useState(false);
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
  };

  if (!token) return <p className="nota">Redirigiendo a Iniciar sesión…</p>;
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
        <Ayuda titulo="Qué son tus ejercicios">
          <p>{COPY_EJERCICIOS_PROPIOS.queEs}</p>
        </Ayuda>
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
            <ul className="lista">
              {estado.ejercicios.map((e) => (
                <li key={e.exerciseId} className="lista__item">
                  <p className="lista__titulo">{e.name}</p>
                  <p className="nota">
                    Cargado el {fecha(e.createdAt)}
                    {e.available ? '' : ' · retirado del catálogo'}
                  </p>
                  <ImagenDeEjercicio token={token} ejercicio={e} sesionPerdida={sesionPerdida} onCambio={actualizar} />
                </li>
              ))}
            </ul>
          )
        ) : null}
      </section>
    </div>
  );
}
