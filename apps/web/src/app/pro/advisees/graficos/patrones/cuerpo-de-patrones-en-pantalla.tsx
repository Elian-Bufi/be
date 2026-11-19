'use client';

/**
 * El cuerpo de «Patrones» (WP-GRAFICOS fase 2, rama E; DL-174 y DL-183), el mismo en la ficha y en el editor del plan, de
 * arriba abajo:
 * 1. la cinta del tiempo (GR-23), fija arriba al desplazar;
 * 2. «En el tiempo»: los gráficos del enfoque que van sobre fechas, cada uno en su tarjeta a todo el ancho, con el mismo
 *    eje y un solo cursor para toda la columna (`ProveedorDelCursor`);
 * 3. «Comparaciones»: lo que no va sobre el tiempo, con su propio eje;
 * 4. «Ver la relación»: los cruces preparados del caso 1, cada uno a pedido (se lee al abrirlo: GR-VE05);
 * 5. «Agregar un gráfico», si la pantalla deja editar;
 * 6. lo que falta, dicho.
 *
 * Cada tarjeta tiene la pregunta como título, el ejercicio si lo lleva, «Abrir en Analizar» y, al editar, «Subir», «Bajar»
 * y «Quitar». El método, la cobertura y «Ver la tabla» los pone cada gráfico (el nivel «Datos»: GR-VE06). Un área sin
 * acceso no aparece (`tarjetasDelEnfoque`), y nada de acá escribe en un plan.
 */
import type { AccesoDeLaPersona, GraficoDelEnfoque, VigenciaDePlan } from '@be/domain';
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { Enlace } from '../../../../../components/enlace';
import { Icono } from '../../../../../components/icono';
import { bandasDeVersion } from '../adaptadores';
import { GraficoArmadoEnPantalla } from '../arma-tu-grafico/grafico-armado';
import { CintaDelTiempoLeida } from '../cinta-del-tiempo-en-pantalla';
import { contextoDelRegistro } from '../cruces/preguntas-con-graficos';
import { ProveedorDelCursor } from '../cursor-de-fechas';
import { empiezaAntesDelVinculo, type PeriodoDelGrafico } from '../eje-de-fechas';
import { useBandasDelHistorial } from '../entrenamiento/historial-del-ejercicio';
import { ProveedorDelComparador } from '../entrenamiento/lecturas-del-ejercicio';
import type { DisponiblesLeidos, ParametrosDeLectura } from '../lecturas';
import type { DensidadDelGrafico } from '../paneles-alineados';
import { REGISTRO_DE_GRAFICOS } from '../registros';
import { COPY_DE_PATRONES as C, crucesDeLaRelacion, enlaceEnAnalizar, loQueFalta, sugeridosQueFaltan, tarjetasDelEnfoque, type Tarjeta, type TarjetaSugerida } from './patrones';

/** Lo que la pantalla deja hacer con las tarjetas mientras se edita un enfoque. */
export interface EdicionDeLasTarjetas {
  readonly subir: (indice: number) => void;
  readonly bajar: (indice: number) => void;
  readonly quitar: (indice: number) => void;
  readonly total: number;
}

export interface PropsDelCuerpo {
  readonly lectura: Omit<ParametrosDeLectura, 'periodo'>;
  readonly periodo: PeriodoDelGrafico;
  readonly disponibles: DisponiblesLeidos;
  readonly acceso: AccesoDeLaPersona;
  readonly charts: readonly GraficoDelEnfoque[];
  readonly densidad: DensidadDelGrafico;
  /** Las versiones de qué áreas van de fondo: en el editor, solo las del plan que se edita. */
  readonly fondo: readonly ('NUTRICION' | 'ENTRENAMIENTO')[];
  readonly edicion: EdicionDeLasTarjetas | null;
  /** «Agregar un gráfico»: un sugerido que falta, o abrir «Armá tu gráfico». Sin esto, la sección no está. */
  readonly agregar: { readonly sugerido: (g: GraficoDelEnfoque) => void; readonly armar: () => void } | null;
}

export function CuerpoDePatrones({ lectura, periodo, disponibles, acceso, charts, densidad, fondo, edicion, agregar }: PropsDelCuerpo) {
  const contexto = useMemo(() => contextoDelRegistro(acceso, disponibles), [acceso, disponibles]);
  const tarjetas = useMemo(() => tarjetasDelEnfoque(charts, contexto, REGISTRO_DE_GRAFICOS), [charts, contexto]);
  const relacion = useMemo(() => crucesDeLaRelacion(tarjetas.relacion, contexto, REGISTRO_DE_GRAFICOS), [tarjetas.relacion, contexto]);
  const faltan = useMemo(() => (agregar ? sugeridosQueFaltan(charts, contexto, REGISTRO_DE_GRAFICOS) : []), [agregar, charts, contexto]);
  const vigencias = useMemo(
    () => ({
      nutricion: fondo.includes('NUTRICION') ? disponibles.vigencias.nutricion : [],
      entrenamiento: fondo.includes('ENTRENAMIENTO') ? disponibles.vigencias.entrenamiento : [],
    }),
    [fondo, disponibles.vigencias],
  );
  const nombres = useMemo(() => new Map((disponibles.ejercicios ?? []).map((x): [string, string] => [x.exerciseKey, x.name])), [disponibles.ejercicios]);
  const conEntrenamiento = [...tarjetas.enElTiempo, ...tarjetas.comparaciones].some((t) => t.tipo === 'SUGERIDO' && t.grafico.area === 'ENTRENAMIENTO');
  const falta = loQueFalta({ noAplican: tarjetas.noAplican, empiezaAntesDelVinculo: empiezaAntesDelVinculo(periodo) });
  const sinNada = tarjetas.enElTiempo.length === 0 && tarjetas.comparaciones.length === 0 && relacion.length === 0;
  const props = { lectura, periodo, densidad, acceso, nombres, vigencias, asesoradoId: lectura.asesoradoId, edicion };

  const contenido = (
    <ProveedorDelCursor>
      <CintaQueSePega densidad={densidad}>
        <CintaDelTiempoLeida lectura={lectura} alcances={acceso.alcances} vigencias={[...vigencias.nutricion, ...vigencias.entrenamiento]} periodo={periodo} densidad={densidad} />
      </CintaQueSePega>
      {sinNada ? (
        <p className="nota patrones__vacio" data-patrones-vacio>
          {acceso.alcances.length === 0 ? C.sinAreas : C.sinGraficos}
        </p>
      ) : null}
      {tarjetas.enElTiempo.length > 0 ? (
        <Seccion titulo={C.enElTiempo} detalle={C.enElTiempoDetalle} clave="en-el-tiempo">
          {tarjetas.enElTiempo.map((t) => (
            <TarjetaDePatrones key={t.clave} t={t} {...props} />
          ))}
        </Seccion>
      ) : null}
      {tarjetas.comparaciones.length > 0 ? (
        <Seccion titulo={C.comparaciones} detalle={C.comparacionesDetalle} clave="comparaciones">
          {tarjetas.comparaciones.map((t) => (
            <TarjetaDePatrones key={t.clave} t={t} {...props} />
          ))}
        </Seccion>
      ) : null}
      {relacion.length > 0 ? (
        <Seccion titulo={C.verLaRelacion} detalle={C.verLaRelacionDetalle} clave="ver-la-relacion">
          {relacion.map((t) => (
            <CruceAPedido key={t.clave} t={t} {...props} />
          ))}
        </Seccion>
      ) : null}
      {agregar ? (
        <Seccion titulo={C.agregarUnGrafico} detalle={C.agregarDetalle} clave="agregar">
          <ul className="patrones__agregar">
            {faltan.map(({ grafico, referencia }) => (
              <li key={grafico.id}>
                <button type="button" className="boton boton--secundario boton--compacto" data-agregar-grafico={grafico.id} onClick={() => agregar.sugerido(referencia)}>
                  <Icono nombre="mas" tamano={18} />
                  {grafico.titulo}
                </button>
              </li>
            ))}
            <li>
              <button type="button" className="boton boton--secundario boton--compacto" data-arma-tu-grafico onClick={agregar.armar}>
                <Icono nombre="separadas" tamano={18} />
                {C.armaTuGrafico}
              </button>
              <span className="nota"> {C.armaTuGraficoDetalle}</span>
            </li>
          </ul>
        </Seccion>
      ) : null}
      {falta.length > 0 ? (
        <Seccion titulo={C.loQueFalta} clave="lo-que-falta">
          <ul className="patrones__falta">
            {falta.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </Seccion>
      ) : null}
    </ProveedorDelCursor>
  );
  // El comparador de Entrenamiento se lee una vez para todas las tarjetas que lo usan (sin pedir dos veces lo que está en vuelo).
  return (
    <div className={`patrones patrones--${densidad.toLowerCase()}`} data-patrones>
      {conEntrenamiento ? (
        <ProveedorDelComparador lectura={lectura} periodo={periodo}>
          {contenido}
        </ProveedorDelComparador>
      ) : (
        contenido
      )}
    </div>
  );
}

/**
 * La cinta, fija arriba al desplazar (GR-VE14): pegada, muestra solo el dibujo y lo elegido, para no tapar los gráficos;
 * la explicación, la leyenda y «Ver la lista» vuelven al subir. En el panel del editor no se pega (es angosto y corto).
 */
function CintaQueSePega({ densidad, children }: { densidad: DensidadDelGrafico; children: ReactNode }) {
  const marca = useRef<HTMLDivElement>(null);
  const [pegada, setPegada] = useState(false);
  useEffect(() => {
    const m = marca.current;
    if (!m || densidad === 'COMPACTA' || typeof IntersectionObserver === 'undefined') return;
    const o = new IntersectionObserver(([e]) => setPegada(e ? !e.isIntersecting && e.boundingClientRect.top < 0 : false));
    o.observe(m);
    return () => o.disconnect();
  }, [densidad]);
  return (
    <>
      <div ref={marca} className="patrones__marca-de-la-cinta" aria-hidden="true" />
      <div className="patrones__cinta" data-pegada={pegada ? '' : undefined}>
        {children}
      </div>
    </>
  );
}

function Seccion({ titulo, detalle = null, clave, children }: { titulo: string; detalle?: string | null; clave: string; children: ReactNode }) {
  const id = useId();
  return (
    <section className="patrones__seccion" aria-labelledby={id} data-seccion-de-patrones={clave}>
      <div className="patrones__titulo-de-seccion">
        <h3 id={id}>{titulo}</h3>
        {detalle ? <p className="nota">{detalle}</p> : null}
      </div>
      <div className="patrones__lista">{children}</div>
    </section>
  );
}

interface PropsDeLaTarjeta {
  readonly t: Tarjeta;
  readonly lectura: Omit<ParametrosDeLectura, 'periodo'>;
  readonly periodo: PeriodoDelGrafico;
  readonly densidad: DensidadDelGrafico;
  readonly acceso: AccesoDeLaPersona;
  readonly nombres: ReadonlyMap<string, string>;
  readonly vigencias: { readonly nutricion: readonly VigenciaDePlan[]; readonly entrenamiento: readonly VigenciaDePlan[] };
  readonly asesoradoId: string;
  readonly edicion: EdicionDeLasTarjetas | null;
}

/** El ejercicio de una tarjeta, en palabras: «Sentadilla trasera · serie 2 (kg)». */
const detalleDelEjercicio = (t: TarjetaSugerida): string | null => (t.ejercicio ? `${t.ejercicio.nombre}${t.ejercicio.serie !== null ? ` · serie ${t.ejercicio.serie}` : ''}` : null);

export function TarjetaDePatrones(p: PropsDeLaTarjeta) {
  const { t, periodo, asesoradoId, edicion } = p;
  const id = useId();
  const href = enlaceEnAnalizar(t, asesoradoId, periodo);
  const detalle = t.tipo === 'SUGERIDO' ? detalleDelEjercicio(t) : null;
  return (
    <article className="tarjeta patrones__tarjeta" aria-labelledby={id} data-tarjeta={t.clave} data-grafico={t.tipo === 'SUGERIDO' ? t.grafico.id : 'armado'}>
      <header className="patrones__cabecera">
        <div className="patrones__pregunta">
          <h4 id={id}>{t.titulo}</h4>
          {detalle ? <p className="nota">{detalle}</p> : null}
        </div>
        <div className="patrones__acciones">
          {href ? (
            <Enlace href={href} className="boton boton--enlace" data-abrir-en-analizar>
              <Icono nombre="analizar" tamano={18} />
              {C.abrirEnAnalizar}
              <span className="visualmente-oculto">: {t.titulo}</span>
            </Enlace>
          ) : null}
          {edicion ? <ControlesDeEdicion t={t} edicion={edicion} /> : null}
        </div>
      </header>
      <div className="patrones__grafico">{t.tipo === 'ARMADO' ? <GraficoArmadoEnPantalla grafico={t.armado} lectura={p.lectura} periodo={periodo} densidad={p.densidad} ejercicios={p.nombres} acceso={p.acceso} /> : <GraficoSugerido {...p} t={t} />}</div>
    </article>
  );
}

function ControlesDeEdicion({ t, edicion }: { t: Tarjeta; edicion: EdicionDeLasTarjetas }) {
  const ultimo = edicion.total <= 1;
  return (
    <span className="patrones__edicion" role="group" aria-label={`Ordenar o quitar: ${t.titulo}`}>
      <button type="button" className="boton boton--quieto boton--compacto" disabled={t.indice <= 0} onClick={() => edicion.subir(t.indice)} data-subir>
        <Icono nombre="arriba" tamano={18} />
        {C.subir}
      </button>
      <button type="button" className="boton boton--quieto boton--compacto" disabled={t.indice >= edicion.total - 1} onClick={() => edicion.bajar(t.indice)} data-bajar>
        <Icono nombre="abajo" tamano={18} />
        {C.bajar}
      </button>
      <button type="button" className="boton boton--quieto boton--compacto" disabled={ultimo} onClick={() => edicion.quitar(t.indice)} data-quitar>
        <Icono nombre="cerrar" tamano={18} />
        {C.quitar}
      </button>
      {ultimo ? <span className="nota">{C.noSeQuitaElUltimo}</span> : null}
    </span>
  );
}

/** Un gráfico del registro con sus versiones de fondo: las de su área, si van de fondo en esta pantalla. */
function GraficoSugerido(p: PropsDeLaTarjeta & { t: TarjetaSugerida }) {
  if (p.t.grafico.area === 'ENTRENAMIENTO' && p.t.ejercicio && p.vigencias.entrenamiento.length > 0) return <GraficoDeEntrenamiento {...p} />;
  const bandas = p.t.grafico.area === 'NUTRICION' ? bandasDeVersion(p.vigencias.nutricion, 'NUTRICION') : p.t.grafico.area === 'ENTRENAMIENTO' ? bandasDeVersion(p.vigencias.entrenamiento, 'ENTRENAMIENTO') : [];
  const G = p.t.grafico.Grafico;
  return <G lectura={p.lectura} periodo={p.periodo} densidad={p.densidad} ejercicio={p.t.ejercicio} medida={p.t.medida} bandas={bandas} acceso={p.acceso} />;
}

/**
 * Los de Entrenamiento llevan las versiones con el cambio de lo indicado, como en el historial del ejercicio (GR-VB01):
 * GR-02, de todas las series; GR-03, GR-05 y GR-06, de la serie del gráfico. Del comparador que ya se leyó para todos.
 */
function GraficoDeEntrenamiento(p: PropsDeLaTarjeta & { t: TarjetaSugerida }) {
  const ejercicio = p.t.ejercicio!;
  const bandas = useBandasDelHistorial(p.lectura, p.periodo, p.vigencias.entrenamiento, ejercicio.exerciseKey, ejercicio.serie ?? 1);
  const G = p.t.grafico.Grafico;
  return (
    <G
      lectura={p.lectura}
      periodo={p.periodo}
      densidad={p.densidad}
      ejercicio={ejercicio}
      medida={p.t.medida}
      bandas={p.t.grafico.id === 'entrenamiento.fuerza-estimada' ? bandas.delEjercicio : bandas.deLaSerie}
      acceso={p.acceso}
    />
  );
}

/**
 * Un cruce de «Ver la relación», a pedido: la tarjeta dice qué junta y se lee recién al abrirla (GR-VE05). Así «Patrones»
 * queda lejos del límite de lecturas, y lo que se ve primero son los gráficos del enfoque.
 */
function CruceAPedido(p: PropsDeLaTarjeta & { t: TarjetaSugerida }) {
  const [abierto, setAbierto] = useState(false);
  if (abierto) return <TarjetaDePatrones {...p} edicion={null} />;
  return (
    <article className="tarjeta patrones__tarjeta patrones__tarjeta--a-pedido" data-tarjeta={p.t.clave} data-grafico={p.t.grafico.id}>
      <header className="patrones__cabecera">
        <div className="patrones__pregunta">
          <h4>{p.t.titulo}</h4>
          {detalleDelEjercicio(p.t) ? <p className="nota">{detalleDelEjercicio(p.t)}</p> : null}
        </div>
        <div className="patrones__acciones">
          <button type="button" className="boton boton--secundario boton--compacto" onClick={() => setAbierto(true)} data-ver-el-cruce>
            <Icono nombre="comparar" tamano={18} />
            {C.abrirLaRelacion}
            <span className="visualmente-oculto">: {p.t.titulo}</span>
          </button>
        </div>
      </header>
    </article>
  );
}
