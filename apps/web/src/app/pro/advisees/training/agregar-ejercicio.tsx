'use client';

/**
 * «Agregar ejercicio» (WP-ESCRITORIO-AREAS, parte 8): el buscador del catálogo, en un cajón al costado del editor del
 * plan de entrenamiento, que sigue a la vista por detrás. Hace lo mismo que el recuadro que antes se abría dentro de
 * cada sesión —buscar en el catálogo BE, elegir un habitual, crear un ejercicio a mano e importar uno desde wger
 * (B10-06:485-498; WP-08)—, y nada más. Es el cajón de «Agregar ítem» del plan de comidas, con las mismas reglas:
 * - **Busca al enviar** (Enter o «Buscar»). Una búsqueda que falla dice su motivo y se reintenta: no es «No encontramos
 *   ejercicios con ese nombre» (B10-10:41). Una sin resultados dice qué se buscó y ofrece «Limpiar búsqueda», que vacía
 *   el campo (y el filtro de los habituales) y devuelve el foco al campo (bloque 5 del encargo de consolidación).
 * - **ED-21: se marcan varios y entran juntos.** Una casilla por fila (y los habituales, con un toque); lo creado a mano
 *   o importado queda marcado. Abajo, «Agregar 3 a Piernas A», con una prescripción opcional para todos (ED-22): entran
 *   en el orden marcado, y nada entra antes de «Agregar» (`varios-a-la-vez.ts`).
 * - «Crear un ejercicio propio» (con los parecidos del catálogo antes de crear, ED-21) e «Importar desde wger» se abren
 *   adentro, con «Volver a la búsqueda».
 * - Al abrirse, el foco va al campo de búsqueda; cada vez que se abre, empieza vacío.
 * - Si los ejercicios habituales no se pueden leer, se dice: no es «todavía no marcaste ninguno».
 * - Si un ejercicio apareció por un nombre alternativo, se dice cuál: «Press de banca (bench press)» (DL-141).
 * - WP-CATALOGO-VISUAL (etapa 2; DL-081 y DL-162): cada fila dice sus zonas musculares en un renglón (vienen en la
 *   búsqueda), y el botón del ojo abre debajo el detalle del ejercicio: su imagen y la figura de sus zonas (la ficha
 *   visual, API-EJE-05). Uno abierto por vez; una búsqueda nueva lo cierra.
 * - WP-GRAFICOS GR-04 (DL-174, fase 1): si la persona ya hizo el ejercicio, la fila lo dice en un renglón más: «Con
 *   historial · 9 sesiones · la última el mar 3 nov». Sale del índice de API-PRJ-01 del último año, que se lee una vez al
 *   abrir el cajón (`historial-del-buscador.ts`). Sin flecha, sin el primer valor ni el último y sin color: la vista previa
 *   con el último valor y el mínimo y el máximo es de la fase 2. Si la lectura falla, se dice y se reintenta; los
 *   resultados se ven igual.
 */
import {
  COPY_ENTRENAMIENTO,
  COPY_FIGURA_DE_ZONAS,
  COPY_HABITUALES,
  COPY_HISTORIAL_DEL_BUSCADOR,
  COPY_INTEGRACIONES,
  historialPorEjercicio,
  marcaDeHistorial,
  type EjercicioDelPeriodo,
  habitualesQueCoinciden,
  leerPrescripcion,
  nombreDeZona,
  ordenDeZona,
  vistaPreviaDePrescripcion,
  type PrescripcionLeida,
  nombreAlternativoComoAclaracion,
  zonasEnUnRenglon,
  type EjercicioDeCatalogo,
  type EjercicioEncontrado,
} from '@be/domain';
import { Fragment, useCallback, useEffect, useId, useRef, useState, type FormEvent, type RefObject } from 'react';
import { Ayuda } from '../../../../components/ayuda';
import { Cajon } from '../../../../components/cajon';
import { Cargando } from '../../../../components/estados';
import { Aviso, Campo } from '../../../../components/formulario';
import { Icono } from '../../../../components/icono';
import { OrigenEnElCatalogo } from '../../../../components/origen-en-el-catalogo';
import { api } from '../../../../lib/api';
import { DetalleVisualPorLeer } from '../../exercises/detalle-visual';
import { unAnioAntes } from '../fuerza/lectura-de-fuerza';
import { hoyEn } from '../seguimiento/estado';
import { mensajeDeFallo, useClaveDeIntento } from '../../../../lib/intento';
import { useEntrenamiento } from './entrenamiento';
import type { EjerciciosHabituales } from './habituales';
import { ImportacionDeWger } from './importacion';
import { alternarMarcado, conLasZonas, COPY_VARIOS_A_LA_VEZ as V, sesionDeDonde, zonasDeLosResultados } from './varios-a-la-vez';
import { busquedasDeParecidos, COPY_EJERCICIO_PROPIO as EP, elQueSeLlamaIgual, haySugerencias, parecidos, PAUSA_DE_LAS_SUGERENCIAS, POCOS_RESULTADOS } from './parecidos-del-catalogo';

type Modo = 'buscar' | 'manual' | 'importar';

type Busqueda =
  | { readonly tipo: 'sin-buscar' }
  | { readonly tipo: 'buscando'; readonly texto: string }
  | { readonly tipo: 'lista'; readonly texto: string; readonly ejercicios: readonly EjercicioEncontrado[] }
  | { readonly tipo: 'falla'; readonly texto: string; readonly motivo: string };

/**
 * GR-04: lo que la persona ya hizo, por ejercicio del catálogo: el índice de API-PRJ-01 (`TRAINING_PROGRESSION_BY_EXERCISE`
 * sin ejercicio) del último año, con el «hoy» de la API para decir la fecha de la última. `sin-acceso`: con el acceso de
 * ahora no se ven los registros de Entrenamiento, y los resultados van sin marca y sin aviso.
 */
type HistorialDelBuscador =
  | { readonly tipo: 'cargando' }
  | { readonly tipo: 'listo'; readonly porEjercicio: ReadonlyMap<string, EjercicioDelPeriodo>; readonly hoy: string }
  | { readonly tipo: 'sin-acceso' }
  | { readonly tipo: 'falla' };

/** Lee el índice una vez, al abrirse el cajón (lo de adentro vive solo mientras está abierto), y con «Reintentar». */
function useHistorialDelBuscador(): { readonly historial: HistorialDelBuscador; readonly recargar: () => void } {
  const { token, asesoradoId, sesionPerdida } = useEntrenamiento();
  const [historial, setHistorial] = useState<HistorialDelBuscador>({ tipo: 'cargando' });
  const [vuelta, setVuelta] = useState(0);
  useEffect(() => {
    let vigente = true;
    setHistorial({ tipo: 'cargando' });
    // Sin `periodEnd`: la API toma su hoy (el del navegador puede ir un día adelante).
    void api.proyeccion(token, asesoradoId, 'TRAINING_PROGRESSION_BY_EXERCISE', { periodStart: unAnioAntes(hoyEn()) }).then((r) => {
      if (!vigente || sesionPerdida(r)) return;
      if (!r.ok) return setHistorial(r.tipo === 'API' && r.codigo === 'RESOURCE_NOT_FOUND' ? { tipo: 'sin-acceso' } : { tipo: 'falla' });
      const x = r.datos.data.result;
      setHistorial({ tipo: 'listo', porEjercicio: historialPorEjercicio(x?.kind === 'TRAINING_PROGRESSION_BY_EXERCISE' ? x.exercises : []), hoy: r.datos.data.period.end });
    });
    return () => {
      vigente = false;
    };
  }, [token, asesoradoId, sesionPerdida, vuelta]);
  const recargar = useCallback(() => setVuelta((v) => v + 1), []);
  return { historial, recargar };
}

/** ED-21: los textos de los chips por zona. */
const COPY_ZONAS_DEL_BUSCADOR = {
  rotulo: 'Filtrar lo encontrado por zona',
  todas: 'Todas las zonas',
  queFiltra: 'Filtra lo encontrado; la búsqueda es por nombre.',
} as const;

export function AgregarEjercicio({
  abierto,
  deDonde,
  habituales,
  onAgregar,
  onCerrar,
}: {
  abierto: boolean;
  /** A qué sesión se le suma: «Fuerza: progresión · A · Tren inferior». */
  deDonde: string | null;
  habituales: EjerciciosHabituales;
  /** ED-21: los marcados, en el orden en que se marcaron, y la prescripción para todos (o `null`). */
  onAgregar: (marcados: readonly EjercicioDeCatalogo[], prescripcion: PrescripcionLeida | null) => void;
  onCerrar: () => void;
}) {
  const [modo, setModo] = useState<Modo>('buscar');
  const [marcados, setMarcados] = useState<readonly EjercicioDeCatalogo[]>([]);
  const [linea, setLinea] = useState('');
  const [falta, setFalta] = useState(false);
  // El campo de búsqueda: al abrirse el cajón, el foco va ahí.
  const campo = useRef<HTMLInputElement>(null);
  // Cada vez que se abre, empieza por la búsqueda, sin nada marcado.
  useEffect(() => {
    if (!abierto) return;
    setModo('buscar');
    setMarcados([]);
    setLinea('');
    setFalta(false);
  }, [abierto]);
  const lectura = linea.trim() === '' ? null : leerPrescripcion(linea);
  const agregar = () => {
    if (marcados.length === 0) return setFalta(true);
    // Lo que no se entiende no se aplica: se corrige o se borra antes (ED-22, nunca adivina).
    if (lectura && !lectura.ok) return;
    onAgregar(marcados, lectura?.ok ? lectura.leida : null);
    onCerrar();
  };
  return (
    <Cajon
      abierto={abierto}
      titulo={COPY_ENTRENAMIENTO.agregarEjercicio}
      sobretitulo={deDonde}
      focoInicial={campo}
      // ED-10 (§2.3): con ejercicios marcados o una prescripción escrita, cerrar pregunta antes de perderlos.
      conCambios={marcados.length > 0 || linea.trim() !== ''}
      onCerrar={onCerrar}
      pie={
        modo === 'buscar' ? (
          <>
            <label className="agregar-ejercicio__para-todos">
              <span>{V.prescripcionParaTodos}</span>
              <input type="text" value={linea} maxLength={80} onChange={(e) => setLinea(e.target.value)} aria-invalid={lectura && !lectura.ok ? true : undefined} aria-describedby="prescripcion-para-todos" autoComplete="off" spellCheck={false} />
              <span id="prescripcion-para-todos" className={lectura && !lectura.ok ? 'campo__error' : 'nota'}>
                {!lectura ? V.prescripcionAyuda : lectura.ok ? vistaPreviaDePrescripcion(lectura.leida) : lectura.noSeEntiende}
              </span>
            </label>
            <p className="nota agregar-item__antes">{COPY_ENTRENAMIENTO.catalogoSintetico}</p>
            {falta && marcados.length === 0 ? (
              <p className="campo__error" role="alert">
                {V.sinMarcados}
              </p>
            ) : null}
            <button type="button" className="boton boton--primario" data-agregar-marcados onClick={agregar}>
              {V.agregar(marcados.length, sesionDeDonde(deDonde))}
            </button>
            <button type="button" className="boton boton--quieto" onClick={() => setModo('manual')}>
              <Icono nombre="mas" tamano={18} />
              {EP.crear}
            </button>
            <button type="button" className="boton boton--quieto" onClick={() => setModo('importar')}>
              <Icono nombre="descargar" tamano={18} />
              {COPY_INTEGRACIONES.importarDesdeWger}
            </button>
          </>
        ) : null
      }
    >
      <ContenidoDeAgregarEjercicio
        modo={modo}
        alCambiarDeModo={setModo}
        campo={campo}
        habituales={habituales}
        marcados={marcados}
        onMarcar={(e) => setMarcados((m) => alternarMarcado(m, e))}
        onCreado={(e) => setMarcados((m) => (m.some((x) => x.versionId === e.versionId) ? m : [...m, e]))}
      />
    </Cajon>
  );
}

/** Lo de adentro del cajón: vive solo mientras está abierto, así que cada apertura empieza con el buscador vacío. */
function ContenidoDeAgregarEjercicio({
  modo,
  alCambiarDeModo,
  campo,
  habituales,
  marcados,
  onMarcar,
  onCreado,
}: {
  modo: Modo;
  alCambiarDeModo: (m: Modo) => void;
  campo: RefObject<HTMLInputElement | null>;
  habituales: EjerciciosHabituales;
  marcados: readonly EjercicioDeCatalogo[];
  onMarcar: (e: EjercicioDeCatalogo) => void;
  /** Lo creado a mano o importado queda marcado. */
  onCreado: (e: EjercicioDeCatalogo) => void;
}) {
  const { token, sesionPerdida } = useEntrenamiento();
  const id = useId();
  const [texto, setTexto] = useState('');
  const [busqueda, setBusqueda] = useState<Busqueda>({ tipo: 'sin-buscar' });
  const [creado, setCreado] = useState<string | null>(null);
  const estaMarcado = (versionId: string) => marcados.some((m) => m.versionId === versionId);
  // El ejercicio cuyo detalle (imagen y zonas) está abierto debajo de su fila: uno por vez.
  const [detalle, setDetalle] = useState<string | null>(null);
  // ED-21: las zonas elegidas en los chips (sobre lo encontrado).
  const [zonasElegidas, setZonasElegidas] = useState<readonly string[]>([]);
  // GR-04: qué ejercicios ya hizo la persona, para la marca «Con historial» de cada resultado.
  const { historial, recargar: releerElHistorial } = useHistorialDelBuscador();
  const pedido = useRef(0);

  // Al volver de crear o de importar, el foco vuelve al campo. Al abrirse, lo pone el cajón (`focoInicial`).
  useEffect(() => {
    if (modo === 'buscar') campo.current?.focus({ preventScroll: true });
  }, [modo, campo]);

  const buscar = async (que: string) => {
    const esta = ++pedido.current;
    setDetalle(null);
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
  /** «Limpiar búsqueda»: el campo vacío (y con él el filtro de los habituales), el foco en él y el cajón como al abrirse. */
  const limpiar = () => {
    pedido.current += 1;
    setTexto('');
    setBusqueda({ tipo: 'sin-buscar' });
    campo.current?.focus();
  };
  const elegir = (e: EjercicioDeCatalogo) => {
    onCreado(e);
    setCreado(e.name);
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

  const encontrados = busqueda.tipo === 'lista' ? busqueda.ejercicios : [];
  // ED-21: los chips por zona filtran lo encontrado (la búsqueda sigue siendo por nombre).
  const zonasEncontradas = zonasDeLosResultados(encontrados, ordenDeZona);
  const zonasVigentes = zonasElegidas.filter((z) => zonasEncontradas.includes(z));
  const ejercicios = conLasZonas(encontrados, zonasVigentes);
  // Los habituales se filtran mientras se escribe; el catálogo, al enviar (bloque 5).
  const filtro = texto.trim();
  const alaVista = habitualesQueCoinciden(habituales.habituales, filtro);
  // Con el catálogo ya buscado con ese texto, los habituales no repiten que se busca con Enter: el resultado está debajo.
  const catalogoBuscado = busqueda.tipo !== 'sin-buscar' && busqueda.texto === filtro;
  // GR-04: la marca de cada resultado, si la persona ya lo hizo; qué cuenta se dice una vez, si alguno la lleva.
  const marcaDe = (exerciseId: string): string | null => (historial.tipo === 'listo' ? marcaDeHistorial(historial.porEjercicio, exerciseId, historial.hoy) : null);
  const algunoConHistorial = ejercicios.some((ej) => marcaDe(ej.exerciseId) !== null);
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
        {creado ? `${V.creadoYMarcado(creado)} ` : ''}
        {marcados.length > 0 ? `${V.marcados(marcados.length)}: ${marcados.map((m) => m.name).join(', ')}.` : null}
      </p>

      <section className="agregar-item__habituales" aria-labelledby={`${id}-habituales`} data-habituales="ejercicios">
        <h3 id={`${id}-habituales`} className="agregar-item__titulo">
          <Icono nombre="habitual" tamano={18} />
          {COPY_HABITUALES.misHabituales}
          {habituales.habituales.length > 0 ? (
            <span className="nota" data-habituales-coinciden={filtro ? alaVista.length : undefined}>
              {filtro ? COPY_HABITUALES.coinciden(alaVista.length, habituales.habituales.length, filtro) : 'Tocá uno para marcarlo; entran con «Agregar».'}
            </span>
          ) : null}
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
        ) : alaVista.length === 0 ? (
          <p className="nota" data-habituales-sin-coincidencias>
            {COPY_HABITUALES.ningunoCoincide(filtro, catalogoBuscado)}
          </p>
        ) : (
          <ul className="agregar-item__fichas">
            {alaVista.map((h) => (
              <li key={h.exerciseId}>
                <button type="button" className="boton boton--quieto boton--compacto" aria-pressed={estaMarcado(h.versionId)} aria-label={V.marcar(h.name)} onClick={() => onMarcar(h)}>
                  <Icono nombre={estaMarcado(h.versionId) ? 'tilde' : 'mas'} tamano={18} />
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
        {/* ED-21: los chips por zona, sobre lo encontrado. Elegir uno no desmarca nada. */}
        {busqueda.tipo === 'lista' && zonasEncontradas.length > 1 ? (
          <div className="chips-de-zona" role="group" aria-label={COPY_ZONAS_DEL_BUSCADOR.rotulo} data-chips-de-zona>
            {zonasEncontradas.map((z) => (
              <button key={z} type="button" className="chip-de-zona" aria-pressed={zonasVigentes.includes(z)} onClick={() => setZonasElegidas((x) => (x.includes(z) ? x.filter((y) => y !== z) : [...x, z]))}>
                {nombreDeZona(z) ?? z}
              </button>
            ))}
            {zonasVigentes.length > 0 ? (
              <button type="button" className="boton boton--enlace" onClick={() => setZonasElegidas([])}>
                {COPY_ZONAS_DEL_BUSCADOR.todas}
              </button>
            ) : null}
            <span className="nota">{COPY_ZONAS_DEL_BUSCADOR.queFiltra}</span>
          </div>
        ) : null}
        {busqueda.tipo === 'buscando' ? <Cargando /> : null}
        {/* GR-04: si no se pudo leer lo que ya hizo la persona, se dice: sin marca no quiere decir «nunca lo hizo». */}
        {busqueda.tipo === 'lista' && ejercicios.length > 0 && historial.tipo === 'falla' ? (
          <p className="nota ejercicios-del-catalogo__sin-historial" role="status" data-historial-sin-leer>
            {COPY_HISTORIAL_DEL_BUSCADOR.noSeLeyo}{' '}
            <button type="button" className="boton boton--enlace" onClick={releerElHistorial}>
              {COPY_HISTORIAL_DEL_BUSCADOR.reintentar}
            </button>
          </p>
        ) : null}
        {busqueda.tipo === 'lista' && algunoConHistorial ? (
          <p className="nota ejercicios-del-catalogo__que-cuenta" data-que-cuenta-el-historial>
            {COPY_HISTORIAL_DEL_BUSCADOR.queCuenta}
          </p>
        ) : null}
        {busqueda.tipo === 'falla' ? (
          <Aviso tipo="error">
            <p>No pudimos buscar en el catálogo. {busqueda.motivo}</p>
            <button type="button" className="boton boton--secundario" onClick={() => void buscar(busqueda.texto)}>
              Reintentar
            </button>
          </Aviso>
        ) : null}
        {busqueda.tipo === 'lista' && ejercicios.length === 0 ? (
          <>
            <p data-sin-resultados>
              {busqueda.texto ? `Ningún ejercicio coincide con «${busqueda.texto}».` : 'El catálogo no trajo ejercicios.'} Podés crearlo a mano o importarlo, con los botones de abajo.
            </p>
            <div className="acciones">
              <button type="button" className="boton boton--secundario boton--compacto" onClick={limpiar}>
                Limpiar búsqueda
              </button>
            </div>
          </>
        ) : null}
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
                  const marcado = habituales.esHabitual(ej.exerciseId);
                  const zonas = zonasEnUnRenglon(ej.muscleZones);
                  const abierto = detalle === ej.exerciseId;
                  const conHistorial = marcaDe(ej.exerciseId);
                  return (
                    <Fragment key={ej.versionId}>
                      <tr data-ejercicio-del-catalogo={ej.versionId} data-detalle-abierto={abierto ? '' : undefined}>
                        <th scope="row">
                          <span className="alimentos-del-catalogo__nombre">
                            {ej.name}
                            {ej.matchedAlternativeName ? <span className="nombre-alternativo"> ({nombreAlternativoComoAclaracion(ej.matchedAlternativeName)})</span> : null}
                          </span>
                          {/* DL-141 D-6: de dónde sale, breve; el detalle, en la pista del origen. */}
                          <span className="nota alimentos-del-catalogo__detalle">
                            <OrigenEnElCatalogo item={ej} />
                          </span>
                          {zonas ? (
                            <span className="nota alimentos-del-catalogo__detalle ejercicios-del-catalogo__zonas" data-zonas-del-ejercicio>
                              <span className="visualmente-oculto">{COPY_FIGURA_DE_ZONAS.titulo}: </span>
                              {zonas}
                            </span>
                          ) : null}
                          {/* GR-04: lo dice el texto, no un color ni una flecha. */}
                          {conHistorial ? (
                            <span className="nota alimentos-del-catalogo__detalle ejercicios-del-catalogo__historial" data-con-historial>
                              <Icono nombre="linea-de-tiempo" tamano={15} />
                              {conHistorial}
                            </span>
                          ) : null}
                        </th>
                        <td className="alimentos-del-catalogo__acciones">
                          <button
                            type="button"
                            className="boton boton--quieto ejercicios-del-catalogo__ver"
                            aria-expanded={abierto}
                            aria-label={`${abierto ? COPY_FIGURA_DE_ZONAS.cerrarDetalle : COPY_FIGURA_DE_ZONAS.verDetalle}: ${ej.name}`}
                            title={abierto ? COPY_FIGURA_DE_ZONAS.cerrarDetalle : COPY_FIGURA_DE_ZONAS.verDetalle}
                            onClick={() => setDetalle(abierto ? null : ej.exerciseId)}
                            data-ver-detalle
                          >
                            <Icono nombre={abierto ? 'arriba' : 'ver'} tamano={18} />
                          </button>
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
                          <label className="agregar-ejercicio__marca">
                            <input type="checkbox" checked={estaMarcado(ej.versionId)} onChange={() => onMarcar(ej)} aria-label={V.marcar(ej.name)} data-marcar-ejercicio />
                          </label>
                        </td>
                      </tr>
                      {abierto ? (
                        <tr className="ejercicios-del-catalogo__detalle">
                          <td colSpan={2}>
                            <DetalleVisualPorLeer token={token} exerciseId={ej.exerciseId} nombre={ej.name} sesionPerdida={sesionPerdida} />
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
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

/**
 * «Crear un ejercicio propio» (ED-21): solo se pide el nombre y, mientras se escribe, se muestran los parecidos del
 * catálogo, para usar uno en vez de duplicarlo (`parecidos-del-catalogo.ts`). Lo creado, o el parecido elegido, queda
 * marcado y entra con «Agregar», como lo demás (EDT-17).
 */
function CrearManualmente({ id, nombreInicial, onCreado, onVolver }: { id: string; nombreInicial: string; onCreado: (e: EjercicioDeCatalogo) => void; onVolver: () => void }) {
  const { token, sesionPerdida, accesoRetirado } = useEntrenamiento();
  const intento = useClaveDeIntento();
  const [nombre, setNombre] = useState(nombreInicial);
  const [falta, setFalta] = useState<string | null>(null);
  const [fallo, setFallo] = useState<string | null>(null);
  const [creando, setCreando] = useState(false);
  // ED-21: los parecidos del catálogo para el nombre escrito; una respuesta vieja no pisa a la nueva.
  const [sugerencias, setSugerencias] = useState<{ readonly para: string; readonly estado: 'buscando' | 'falla' | 'listas'; readonly ejercicios: readonly EjercicioDeCatalogo[] } | null>(null);
  const pedidoDeParecidos = useRef(0);
  useEffect(() => {
    const este = ++pedidoDeParecidos.current;
    if (!haySugerencias(nombre)) return setSugerencias(null);
    const espera = window.setTimeout(() => {
      const { principal, otra } = busquedasDeParecidos(nombre);
      setSugerencias({ para: nombre, estado: 'buscando', ejercicios: [] });
      void (async () => {
        const r = await api.buscarEjercicios(token, principal.slice(0, 80));
        if (este !== pedidoDeParecidos.current || sesionPerdida(r)) return;
        if (!r.ok) return setSugerencias({ para: nombre, estado: 'falla', ejercicios: [] });
        let todos: readonly EjercicioDeCatalogo[] = r.datos.data;
        if (todos.length < POCOS_RESULTADOS && otra) {
          const r2 = await api.buscarEjercicios(token, otra);
          if (este !== pedidoDeParecidos.current || sesionPerdida(r2)) return;
          if (r2.ok) todos = [...todos, ...r2.datos.data];
        }
        setSugerencias({ para: nombre, estado: 'listas', ejercicios: todos });
      })();
    }, PAUSA_DE_LAS_SUGERENCIAS);
    return () => window.clearTimeout(espera);
  }, [nombre, token, sesionPerdida]);
  const vigentes = sugerencias && sugerencias.para === nombre ? sugerencias : null;
  const losParecidos = vigentes?.estado === 'listas' ? parecidos(nombre, vigentes.ejercicios) : [];
  const igual = vigentes?.estado === 'listas' ? elQueSeLlamaIgual(nombre, vigentes.ejercicios) : null;

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
      <h3 className="agregar-item__titulo">{EP.crear}</h3>
      <p className="nota">{EP.queEs}</p>
      <Campo id={`${id}-nombre`} etiqueta="Nombre del ejercicio" value={nombre} maxLength={120} onChange={(e) => setNombre(e.target.value)} error={falta} autoComplete="off" />
      {/* ED-21: los parecidos, antes de crear. Elegir uno lo marca y vuelve a la búsqueda; crear sigue siendo un botón. */}
      {/* La sección tiene un rótulo fijo; la región viva es solo la frase de estado: en cada tecla, el lector dice una
          frase y no repite cada «Usar este». */}
      <section className="parecidos-del-catalogo" aria-label={EP.parecidosDelCatalogo}>
        <p className="nota parecidos-del-catalogo__estado" role="status">
          {vigentes?.estado === 'buscando' ? EP.buscandoParecidos : null}
          {vigentes?.estado === 'falla' ? EP.noSePudieronBuscar : null}
          {vigentes?.estado === 'listas' && losParecidos.length === 0 ? EP.sinParecidos(nombre) : null}
          {losParecidos.length > 0 ? <span className="visualmente-oculto">{EP.cuantosParecidos(losParecidos.length)}</span> : null}
        </p>
        {losParecidos.length > 0 ? (
          <>
            <h4 id={`${id}-parecidos`} className="parecidos-del-catalogo__titulo">
              {EP.antesDeCrear}
            </h4>
            {igual ? <p className="parecidos-del-catalogo__igual">{EP.yaExiste(igual.name)}</p> : null}
            <ul className="parecidos-del-catalogo__lista">
              {losParecidos.map((p) => (
                <li key={p.versionId}>
                  <span>{p.name}</span>
                  <button type="button" className="boton boton--secundario boton--compacto" aria-label={`${EP.usarEste}: ${p.name}`} onClick={() => onCreado(p)}>
                    {EP.usarEste}
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </section>
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
          {creando ? 'Creando…' : igual ? EP.crearIgual : EP.crearYMarcar}
        </button>
      </div>
    </form>
  );
}
