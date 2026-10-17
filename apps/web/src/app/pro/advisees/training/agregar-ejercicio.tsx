'use client';

/**
 * «Agregar ejercicio» (WP-ESCRITORIO-AREAS, parte 8): el buscador del catálogo, en un cajón al costado del editor del
 * plan de entrenamiento, que sigue a la vista por detrás. Hace lo mismo que el recuadro que antes se abría dentro de
 * cada sesión —buscar en el catálogo BE, elegir un habitual, crear un ejercicio a mano e importar uno desde wger
 * (B10-06:485-498; WP-08)—, y nada más. Es el cajón de «Agregar ítem» del plan de comidas, con las mismas reglas:
 * - **Busca al enviar** (Enter o «Buscar»). Una búsqueda que falla dice su motivo y se reintenta: no es «No encontramos
 *   ejercicios con ese nombre» (B10-10:41).
 * - **Elegir no cierra el cajón:** el ejercicio se suma a la sesión, con una serie y sin criterio, y el cajón lo
 *   anuncia. Se pueden sumar varios seguidos; se cierra con «Cerrar» o con Escape.
 * - «Crear manualmente» e «Importar desde wger» se abren adentro, con «Volver a la búsqueda».
 * - Al abrirse, el foco va al campo de búsqueda; cada vez que se abre, empieza vacío.
 * - Si los ejercicios habituales no se pueden leer, se dice: no es «todavía no marcaste ninguno».
 * - Si un ejercicio apareció por un nombre alternativo, se dice cuál: «Press de banca (bench press)» (DL-141).
 */
import { COPY_ENTRENAMIENTO, COPY_HABITUALES, COPY_INTEGRACIONES, nombreAlternativoComoAclaracion, type EjercicioDeCatalogo, type EjercicioEncontrado } from '@be/domain';
import { useEffect, useId, useRef, useState, type FormEvent, type RefObject } from 'react';
import { Ayuda } from '../../../../components/ayuda';
import { Cajon } from '../../../../components/cajon';
import { Cargando } from '../../../../components/estados';
import { Aviso, Campo } from '../../../../components/formulario';
import { Icono } from '../../../../components/icono';
import { api } from '../../../../lib/api';
import { mensajeDeFallo, useClaveDeIntento } from '../../../../lib/intento';
import { useEntrenamiento } from './entrenamiento';
import type { EjerciciosHabituales } from './habituales';
import { ImportacionDeWger, procedenciaDeEjercicio } from './importacion';

type Modo = 'buscar' | 'manual' | 'importar';

type Busqueda =
  | { readonly tipo: 'sin-buscar' }
  | { readonly tipo: 'buscando'; readonly texto: string }
  | { readonly tipo: 'lista'; readonly texto: string; readonly ejercicios: readonly EjercicioEncontrado[] }
  | { readonly tipo: 'falla'; readonly texto: string; readonly motivo: string };

export function AgregarEjercicio({
  abierto,
  deDonde,
  habituales,
  onElegir,
  onCerrar,
}: {
  abierto: boolean;
  /** A qué sesión se le suma: «Fuerza: progresión · A · Tren inferior». */
  deDonde: string | null;
  habituales: EjerciciosHabituales;
  onElegir: (e: EjercicioDeCatalogo) => void;
  onCerrar: () => void;
}) {
  const [modo, setModo] = useState<Modo>('buscar');
  // El campo de búsqueda: al abrirse el cajón, el foco va ahí.
  const campo = useRef<HTMLInputElement>(null);
  // Cada vez que se abre, empieza por la búsqueda.
  useEffect(() => {
    if (abierto) setModo('buscar');
  }, [abierto]);
  return (
    <Cajon
      abierto={abierto}
      titulo={COPY_ENTRENAMIENTO.agregarEjercicio}
      sobretitulo={deDonde}
      focoInicial={campo}
      onCerrar={onCerrar}
      pie={
        modo === 'buscar' ? (
          <>
            <p className="nota agregar-item__antes">El ejercicio se agrega con una serie, sin repeticiones ni criterio: los completás en la sesión. {COPY_ENTRENAMIENTO.catalogoSintetico}</p>
            <button type="button" className="boton boton--quieto" onClick={() => setModo('manual')}>
              <Icono nombre="mas" tamano={18} />
              {COPY_ENTRENAMIENTO.crearManualmente}
            </button>
            <button type="button" className="boton boton--quieto" onClick={() => setModo('importar')}>
              <Icono nombre="descargar" tamano={18} />
              {COPY_INTEGRACIONES.importarDesdeWger}
            </button>
          </>
        ) : null
      }
    >
      <ContenidoDeAgregarEjercicio modo={modo} alCambiarDeModo={setModo} campo={campo} habituales={habituales} onElegir={onElegir} />
    </Cajon>
  );
}

/** Lo de adentro del cajón: vive solo mientras está abierto, así que cada apertura empieza con el buscador vacío. */
function ContenidoDeAgregarEjercicio({
  modo,
  alCambiarDeModo,
  campo,
  habituales,
  onElegir,
}: {
  modo: Modo;
  alCambiarDeModo: (m: Modo) => void;
  campo: RefObject<HTMLInputElement | null>;
  habituales: EjerciciosHabituales;
  onElegir: (e: EjercicioDeCatalogo) => void;
}) {
  const { token, sesionPerdida } = useEntrenamiento();
  const id = useId();
  const [texto, setTexto] = useState('');
  const [busqueda, setBusqueda] = useState<Busqueda>({ tipo: 'sin-buscar' });
  const [agregado, setAgregado] = useState<{ readonly nombre: string; readonly veces: number } | null>(null);
  const pedido = useRef(0);

  // Al volver de crear o de importar, el foco vuelve al campo. Al abrirse, lo pone el cajón (`focoInicial`).
  useEffect(() => {
    if (modo === 'buscar') campo.current?.focus({ preventScroll: true });
  }, [modo, campo]);

  const buscar = async (que: string) => {
    const esta = ++pedido.current;
    setBusqueda({ tipo: 'buscando', texto: que });
    const r = await api.buscarEjercicios(token, que);
    // Una respuesta que llega después de otra búsqueda no pisa a la más nueva.
    if (esta !== pedido.current || sesionPerdida(r)) return;
    // Un error no es un catálogo vacío (B10-10:41): se dice que no se pudo buscar, con su motivo.
    setBusqueda(r.ok ? { tipo: 'lista', texto: que, ejercicios: r.datos.data } : { tipo: 'falla', texto: que, motivo: mensajeDeFallo(r) });
  };
  const enviar = (e: FormEvent) => {
    e.preventDefault();
    void buscar(texto.trim());
  };
  const elegir = (e: EjercicioDeCatalogo) => {
    onElegir(e);
    setAgregado((a) => ({ nombre: e.name, veces: (a?.veces ?? 0) + 1 }));
  };

  if (modo === 'manual') {
    return (
      <CrearManualmente
        id={`${id}-nuevo`}
        nombreInicial={busqueda.tipo === 'lista' && busqueda.ejercicios.length === 0 ? busqueda.texto : ''}
        onCreado={(e) => {
          elegir(e);
          alCambiarDeModo('buscar');
        }}
        onVolver={() => alCambiarDeModo('buscar')}
      />
    );
  }
  if (modo === 'importar') {
    return (
      <div className="agregar-item__otro">
        <button type="button" className="boton boton--enlace agregar-item__volver" onClick={() => alCambiarDeModo('buscar')}>
          <Icono nombre="izquierda" tamano={18} />
          Volver a la búsqueda
        </button>
        <ImportacionDeWger
          id={`${id}-importar`}
          onIncorporado={(e) => {
            elegir(e);
            alCambiarDeModo('buscar');
          }}
          onCargarManualmente={() => alCambiarDeModo('manual')}
        />
      </div>
    );
  }

  const ejercicios = busqueda.tipo === 'lista' ? busqueda.ejercicios : [];
  return (
    <div className="agregar-item agregar-ejercicio">
      <form onSubmit={enviar} className="agregar-item__buscador" role="search">
        <label htmlFor={`${id}-texto`} className="visualmente-oculto">
          {COPY_ENTRENAMIENTO.buscarEjercicio}
        </label>
        <span className="agregar-item__campo">
          <Icono nombre="buscar" tamano={20} />
          <input ref={campo} id={`${id}-texto`} type="search" value={texto} maxLength={80} onChange={(e) => setTexto(e.target.value)} placeholder={COPY_ENTRENAMIENTO.buscarEjercicio} autoComplete="off" spellCheck={false} enterKeyHint="search" />
        </span>
        <button type="submit" className="boton boton--quieto agregar-item__enviar">
          Buscar
        </button>
      </form>

      {/* Lo que se acaba de sumar, dicho donde la persona está mirando: el editor quedó detrás del velo. */}
      <p className="agregar-item__agregado" role="status" aria-live="polite" data-agregado>
        {agregado ? `Agregado: ${agregado.nombre}${agregado.veces > 1 ? ` (van ${agregado.veces})` : ''}. Podés sumar otro o cerrar.` : null}
      </p>

      <section className="agregar-item__habituales" aria-labelledby={`${id}-habituales`} data-habituales="ejercicios">
        <h3 id={`${id}-habituales`} className="agregar-item__titulo">
          <Icono nombre="habitual" tamano={18} />
          {COPY_HABITUALES.misHabituales}
          {habituales.habituales.length > 0 ? <span className="nota">Los que marcaste: se agregan con un clic.</span> : null}
        </h3>
        {habituales.lectura === 'falla' ? (
          <Aviso tipo="error">
            <p>No pudimos leer tus ejercicios habituales. {habituales.motivoDeLectura}</p>
            <button type="button" className="boton boton--secundario" onClick={() => void habituales.recargar()}>
              Reintentar
            </button>
          </Aviso>
        ) : habituales.lectura === 'cargando' ? (
          <Cargando />
        ) : habituales.habituales.length === 0 ? (
          <p className="nota">{COPY_HABITUALES.sinEjerciciosHabituales}</p>
        ) : (
          <ul className="agregar-item__fichas">
            {habituales.habituales.map((h) => (
              <li key={h.exerciseId}>
                <button type="button" className="boton boton--quieto boton--compacto" aria-label={`Agregar ${h.name}`} onClick={() => elegir(h)}>
                  <Icono nombre="mas" tamano={18} />
                  {h.name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="agregar-item__resultados" aria-labelledby={`${id}-catalogo`} data-resultados={busqueda.tipo}>
        <h3 id={`${id}-catalogo`} className="agregar-item__titulo">
          <Icono nombre="entrenamiento" tamano={18} />
          En el catálogo BE
          {busqueda.tipo === 'lista' && ejercicios.length > 0 ? (
            <span className="nota">
              {ejercicios.length === 1 ? '1 ejercicio' : `${ejercicios.length} ejercicios`}
              {busqueda.texto ? ` con «${busqueda.texto}»` : ''}
            </span>
          ) : null}
        </h3>
        {busqueda.tipo === 'sin-buscar' ? <p className="nota">Escribí el nombre de un ejercicio y buscalo con Enter.</p> : null}
        {busqueda.tipo === 'buscando' ? <Cargando /> : null}
        {busqueda.tipo === 'falla' ? (
          <Aviso tipo="error">
            <p>No pudimos buscar en el catálogo. {busqueda.motivo}</p>
            <button type="button" className="boton boton--secundario" onClick={() => void buscar(busqueda.texto)}>
              Reintentar
            </button>
          </Aviso>
        ) : null}
        {busqueda.tipo === 'lista' && ejercicios.length === 0 ? <p data-sin-resultados>No encontramos ejercicios con ese nombre. Podés crearlo a mano o importarlo, con los botones de abajo.</p> : null}
        {busqueda.tipo === 'lista' && ejercicios.length > 0 ? (
          <div className="desplazable-x">
            <table className="tabla alimentos-del-catalogo ejercicios-del-catalogo">
              <caption className="visualmente-oculto">Ejercicios del catálogo BE que coinciden</caption>
              <thead>
                <tr>
                  <th scope="col">Ejercicio</th>
                  <th scope="col">
                    <span className="visualmente-oculto">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {ejercicios.map((ej) => {
                  const procedencia = [ej.provenance === 'PROFESSIONAL_MANUAL' ? 'cargado por vos' : null, procedenciaDeEjercicio(ej)].filter(Boolean).join(' · ');
                  const marcado = habituales.esHabitual(ej.exerciseId);
                  return (
                    <tr key={ej.versionId} data-ejercicio-del-catalogo={ej.versionId}>
                      <th scope="row">
                        <span className="alimentos-del-catalogo__nombre">
                          {ej.name}
                          {ej.matchedAlternativeName ? <span className="nombre-alternativo"> ({nombreAlternativoComoAclaracion(ej.matchedAlternativeName)})</span> : null}
                        </span>
                        {procedencia ? <span className="nota alimentos-del-catalogo__detalle">{procedencia}</span> : null}
                      </th>
                      <td className="alimentos-del-catalogo__acciones">
                        <button
                          type="button"
                          className="boton boton--quieto alimentos-del-catalogo__habitual"
                          aria-pressed={marcado}
                          aria-label={`${marcado ? COPY_HABITUALES.quitarMarca : COPY_HABITUALES.marcar}: ${ej.name}`}
                          title={marcado ? COPY_HABITUALES.quitarMarca : COPY_HABITUALES.marcar}
                          onClick={() => void habituales.alternar(ej)}
                        >
                          <Icono nombre="habitual" tamano={18} />
                        </button>
                        <button type="button" className="boton boton--secundario boton--compacto" aria-label={`Elegir ${ej.name}`} onClick={() => elegir(ej)}>
                          Elegir
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </div>
  );
}

/** «Crear manualmente»: un ejercicio propio. Solo se pide el nombre; lo crea y lo suma a la sesión. */
function CrearManualmente({ id, nombreInicial, onCreado, onVolver }: { id: string; nombreInicial: string; onCreado: (e: EjercicioDeCatalogo) => void; onVolver: () => void }) {
  const { token, sesionPerdida, accesoRetirado } = useEntrenamiento();
  const intento = useClaveDeIntento();
  const [nombre, setNombre] = useState(nombreInicial);
  const [falta, setFalta] = useState<string | null>(null);
  const [fallo, setFallo] = useState<string | null>(null);
  const [creando, setCreando] = useState(false);

  async function crear(e: FormEvent) {
    e.preventDefault();
    setFallo(null);
    if (!nombre.trim()) return setFalta('Escribí el nombre del ejercicio.');
    setFalta(null);
    setCreando(true);
    const r = await api.crearEjercicio(token, nombre.trim(), intento.actual());
    intento.registrar(r);
    setCreando(false);
    if (sesionPerdida(r) || accesoRetirado(r)) return;
    if (!r.ok) return setFallo(mensajeDeFallo(r));
    onCreado(r.datos.data);
  }

  return (
    <form className="agregar-item__otro" onSubmit={(e) => void crear(e)} noValidate>
      <button type="button" className="boton boton--enlace agregar-item__volver" onClick={onVolver}>
        <Icono nombre="izquierda" tamano={18} />
        Volver a la búsqueda
      </button>
      <h3 className="agregar-item__titulo">{COPY_ENTRENAMIENTO.crearManualmente}</h3>
      <p className="nota">Un ejercicio tuyo. Queda en el catálogo para volver a usarlo.</p>
      <Campo id={`${id}-nombre`} etiqueta="Nombre del ejercicio" value={nombre} maxLength={120} onChange={(e) => setNombre(e.target.value)} error={falta} />
      <Ayuda titulo="Por qué solo se pide el nombre">
        <p>Las zonas musculares y el material didáctico se suman más adelante.</p>
      </Ayuda>
      {fallo ? (
        <Aviso tipo="error">
          <p>{fallo}</p>
        </Aviso>
      ) : null}
      <div className="acciones">
        <button type="submit" className="boton boton--primario" disabled={creando}>
          {creando ? 'Creando…' : 'Crear y agregar'}
        </button>
      </div>
    </form>
  );
}
