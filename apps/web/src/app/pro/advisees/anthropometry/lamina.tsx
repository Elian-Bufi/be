'use client';

/**
 * «Lámina» (DL-111): la lámina antropométrica del compositor de Dirección (`docs/direccion/BE-VIS-Compositor_v13.3.html`)
 * armada con los datos registrados del asesorado. Los mismos controles del compositor —Circunferencias, Pliegues y
 * Conclusiones; Medición y Serie; Entero, Tren superior y Tren inferior; Hombre y Mujer; Claro, Oscuro y Azul— y
 * «Descargar imagen». Sin endpoints nuevos:
 * - **Medición**: una evaluación registrada (API-ANT-04), con sus mediciones vigentes;
 * - **Conclusiones**: las corridas vigentes de esa evaluación (API-CAL-02 y API-MTH-01, completas con
 *   `todasLasPaginas`), cada valor con su método, agrupadas por la categoría del método;
 * - **Serie**: varias evaluaciones registradas, cada sitio con su valor por toma y la diferencia como resta.
 *
 * La lámina ubica, nunca califica (RF-048; INV-06-06; DL-073; TEST-PRJ-009). Lo que la figura no ubica no se pierde:
 * va al pie de la lámina o en la lista de abajo, y los datos completos siguen en el detalle de la evaluación. El tema es
 * de la lámina: no toca la apariencia del website. La figura (hombre o mujer) la elige el profesional; no se deduce de
 * ningún dato y no se guarda.
 */
import {
  agruparPorCategoria,
  componerMedicion,
  componerSerie,
  corridasSinEfecto,
  COPY,
  COPY_ANTROPOMETRIA,
  COPY_EVOLUCION,
  clavesSinLugarEnLaLamina,
  DATOS_DE_LA_TOMA,
  DIAMETROS_DE_LA_LAMINA,
  enOrdenDeFecha,
  encuadreEnSerie,
  ETIQUETA_DE_CLASE_DE_DATO,
  ETIQUETA_DEL_ENCUADRE,
  FAMILIA_DE_LA_HOJA,
  FRANJA_DE_LA_SERIE,
  MAXIMO_DE_TOMAS_EN_SERIE,
  nombreDeMetrica,
  nombreDelArchivoDeLaLamina,
  repartirConclusiones,
  resultadosDeLaToma,
  ROTULO_EN_LA_LAMINA,
  SERIES_EN_EVOLUCION,
  seriesDeEvolucion,
  sumasDelPieDePliegues,
  textoDelValor,
  todasLasPaginas,
  tomasPorDefecto,
  unidadVisible,
  valoresDeLaToma,
  type CorridaDeCalculoApi,
  type EncuadreDeLaLamina,
  type EvaluacionAntropometricaApi,
  type HojaDeLaLamina,
  type MetodoApi,
  type ModoDeLaLamina,
  type ResumenDeEvaluacionApi,
  type SexoDeLaLamina,
  type TemaDeLaLamina,
  type ValorDeLaLamina,
} from '@be/domain';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Ayuda } from '../../../../components/ayuda';
import { Cargando, ErrorConReintento } from '../../../../components/estados';
import { Aviso } from '../../../../components/formulario';
import { api, type Resultado } from '../../../../lib/api';
import { dia, fecha as fechaYHora } from '../../../../lib/formato';
import { EstadoDeLectura, NoDisponible, useAntropometria } from './antropometria';
import { descargarLamina } from './lamina-descarga';
import { HojaConNota, HojaDeConclusiones, HojaDeEvolucion, HojaDeMedicion, HojaDeSerie, LaminaSvg, type DatosDelEncabezado, type SeccionDeLaLamina } from './lamina-dibujo';

const C = COPY_ANTROPOMETRIA;
const SEPARADOR = '\u00a0\u00a0·\u00a0\u00a0';
const mayusculas = (texto: string) => texto.toLocaleUpperCase('es-AR');

/** El tema de la lámina se recuerda en este navegador; es una preferencia de presentación, no un dato. */
const CLAVE_DEL_TEMA = 'be-lamina-tema';
const TEMAS: readonly TemaDeLaLamina[] = ['CLARO', 'OSCURO', 'AZUL'];
function temaGuardado(): TemaDeLaLamina {
  try {
    const guardado = window.localStorage.getItem(CLAVE_DEL_TEMA);
    if (TEMAS.includes(guardado as TemaDeLaLamina)) return guardado as TemaDeLaLamina;
  } catch {
    // Sin almacenamiento: el tema del compositor por defecto.
  }
  return 'CLARO';
}

/** La fecha civil de un instante en la zona del navegador (`AAAA-MM-DD`), para el nombre del archivo. */
function fechaCivil(instante: string): string {
  const d = new Date(instante);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

type EstadoDeDetalle = { tipo: 'cargando' } | { tipo: 'listo'; evaluacion: EvaluacionAntropometricaApi } | { tipo: 'no-disponible' } | { tipo: 'error' };
type EstadoDeCalculos = { tipo: 'cargando' } | { tipo: 'error' } | { tipo: 'listo'; corridas: readonly CorridaDeCalculoApi[]; metodos: readonly MetodoApi[]; completa: boolean };

export function VistaDeLamina() {
  const { token, asesoradoId, sesionPerdida } = useAntropometria();
  const pedida = useSearchParams().get('evaluacion');
  const [lista, setLista] = useState<Resultado<{ evaluaciones: ResumenDeEvaluacionApi[]; nombre: string | null }> | null>(null);

  const cargar = useCallback(async () => {
    setLista(null);
    const [evaluaciones, vinculos] = await Promise.all([todasLasPaginas((f) => api.listarEvaluacionesAntropometricas(token, asesoradoId, f)), api.consultarVinculos(token)]);
    if (sesionPerdida(evaluaciones) || sesionPerdida(vinculos)) return;
    if (!evaluaciones.ok) return setLista(evaluaciones as Resultado<never>);
    // El nombre va en el encabezado de la lámina, como en el compositor; si no se puede leer, la lámina va sin nombre.
    const nombre = vinculos.ok ? (vinculos.datos.data.find((v) => v.advisee.identityId === asesoradoId)?.advisee.displayName ?? null) : null;
    setLista({ ok: true, datos: { evaluaciones: evaluaciones.datos.data.filter((e) => e.state === 'REGISTERED'), nombre } });
  }, [token, asesoradoId, sesionPerdida]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  return (
    <EstadoDeLectura r={lista} onReintentar={cargar}>
      {lista?.ok ? (
        lista.datos.evaluaciones.length === 0 ? (
          <section className="seccion">
            <h2>{C.lamina}</h2>
            <p>{C.sinEvaluaciones}</p>
          </section>
        ) : (
          <Lamina evaluaciones={lista.datos.evaluaciones} nombre={lista.datos.nombre} pedida={pedida} />
        )
      ) : null}
    </EstadoDeLectura>
  );
}

/** Las evaluaciones pedidas, cada una leída una sola vez (y otra vez solo si falló). */
function useDetalles(ids: readonly string[]) {
  const { token, sesionPerdida } = useAntropometria();
  const [estados, setEstados] = useState<Readonly<Record<string, EstadoDeDetalle>>>({});
  const pedidos = useRef(new Set<string>());

  const cargar = useCallback(
    async (id: string) => {
      pedidos.current.add(id);
      setEstados((e) => ({ ...e, [id]: { tipo: 'cargando' } }));
      const r = await api.consultarEvaluacionAntropometrica(token, id);
      if (sesionPerdida(r)) return;
      const estado: EstadoDeDetalle = r.ok ? { tipo: 'listo', evaluacion: r.datos.data } : r.tipo === 'API' && r.codigo === 'RESOURCE_NOT_FOUND' ? { tipo: 'no-disponible' } : { tipo: 'error' };
      setEstados((e) => ({ ...e, [id]: estado }));
    },
    [token, sesionPerdida],
  );

  const clave = ids.join('|');
  useEffect(() => {
    for (const id of clave ? clave.split('|') : []) if (!pedidos.current.has(id)) void cargar(id);
  }, [clave, cargar]);

  const reintentar = () => {
    for (const [id, e] of Object.entries(estados)) if (e.tipo === 'error') void cargar(id);
  };
  const estadoDe = (id: string): EstadoDeDetalle => estados[id] ?? { tipo: 'cargando' };
  return { estadoDe, reintentar };
}

/** Las corridas del asesorado y los métodos del catálogo, completos: las dos listas vienen paginadas. */
function useCalculos() {
  const { token, asesoradoId, sesionPerdida } = useAntropometria();
  const [estado, setEstado] = useState<EstadoDeCalculos>({ tipo: 'cargando' });
  const cargar = useCallback(async () => {
    setEstado({ tipo: 'cargando' });
    const [metodos, corridas] = await Promise.all([todasLasPaginas((f) => api.listarMetodos(token, f)), todasLasPaginas((f) => api.listarCalculos(token, asesoradoId, f))]);
    if (sesionPerdida(metodos) || sesionPerdida(corridas)) return;
    if (!metodos.ok || !corridas.ok) return setEstado({ tipo: 'error' });
    setEstado({ tipo: 'listo', metodos: metodos.datos.data as MetodoApi[], corridas: corridas.datos.data as CorridaDeCalculoApi[], completa: metodos.datos.completa && corridas.datos.completa });
  }, [token, asesoradoId, sesionPerdida]);
  useEffect(() => {
    void cargar();
  }, [cargar]);
  return { estado, reintentar: cargar };
}

/** Un grupo de botones del compositor (`.seg`): uno apretado a la vez, con `aria-pressed`. */
function Opciones<T extends string>({ id, titulo, opciones, elegida, onElegir }: { id: string; titulo: string; opciones: readonly { valor: T; texto: string }[]; elegida: T; onElegir: (v: T) => void }) {
  return (
    <div className="lamina__grupo" role="group" aria-labelledby={`${id}-titulo`}>
      <span id={`${id}-titulo`} className="lamina__grupo-titulo">
        {titulo}
      </span>
      <div className="lamina__opciones">
        {opciones.map((o) => (
          <button key={o.valor} type="button" className="chip" aria-pressed={o.valor === elegida} onClick={() => onElegir(o.valor)}>
            {o.texto}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Una nota de lo que no está en la lámina: «Título: a · b · c». */
function Nota({ titulo, items }: { titulo: string; items: readonly string[] }) {
  if (items.length === 0) return null;
  return (
    <p className="nota">
      <strong>{titulo}:</strong> {items.join(' · ')}
    </p>
  );
}

/** Un valor con su unidad (ninguna si es sin dimensión), como en la lámina. */
const conUnidad = (v: ValorDeLaLamina) => [textoDelValor(v), unidadVisible(v.unidad)].filter(Boolean).join(' ');

function Lamina({ evaluaciones, nombre, pedida }: { evaluaciones: readonly ResumenDeEvaluacionApi[]; nombre: string | null; pedida: string | null }) {
  const { irA } = useAntropometria();
  const [modo, setModo] = useState<ModoDeLaLamina>('MEDICION');
  const [hoja, setHoja] = useState<HojaDeLaLamina>('CIRCUNFERENCIAS');
  const [encuadre, setEncuadre] = useState<EncuadreDeLaLamina>('ENTERO');
  const [sexo, setSexo] = useState<SexoDeLaLamina>('HOMBRE');
  const [tema, setTema] = useState<TemaDeLaLamina>(temaGuardado);
  const [tomasElegidas, setTomasElegidas] = useState<readonly string[] | null>(null);
  const [seriesElegidas, setSeriesElegidas] = useState<readonly string[] | null>(null);
  const [descarga, setDescarga] = useState<'quieta' | 'preparando' | 'hecha' | 'error'>('quieta');
  const svg = useRef<SVGSVGElement | null>(null);

  // Las tomas, de la más antigua a la más reciente: así se numeran T1…Tn y la más reciente es la última.
  const ordenadas = enOrdenDeFecha(evaluaciones);
  const pedidaValida = pedida !== null && ordenadas.some((e) => e.evaluationId === pedida) ? pedida : null;
  const evaluacionId = pedidaValida ?? ordenadas[ordenadas.length - 1]!.evaluationId;
  const elegidas = new Set(tomasElegidas ?? tomasPorDefecto(ordenadas));
  const idsDeLaSerie = ordenadas.filter((e) => elegidas.has(e.evaluationId)).map((e) => e.evaluationId);

  const detalles = useDetalles(modo === 'MEDICION' ? [evaluacionId] : idsDeLaSerie);
  const calculos = useCalculos();

  const elegirModo = (m: ModoDeLaLamina) => {
    setModo(m);
    // Serie no tiene cuerpo entero: el compositor pasa a tren superior.
    if (m === 'SERIE' && encuadre === 'ENTERO') setEncuadre('TREN_SUPERIOR');
  };
  const elegirTema = (t: TemaDeLaLamina) => {
    setTema(t);
    try {
      window.localStorage.setItem(CLAVE_DEL_TEMA, t);
    } catch {
      // Sin almacenamiento: el tema vale hasta salir de la vista.
    }
  };
  const alternarToma = (id: string) =>
    setTomasElegidas((previas) => {
      const actuales = previas ?? idsDeLaSerie;
      return actuales.includes(id) ? actuales.filter((x) => x !== id) : [...actuales, id];
    });

  const claveDeLaLamina = [modo, hoja, encuadre, sexo, tema, evaluacionId, idsDeLaSerie.join('|')].join('/');
  useEffect(() => {
    setDescarga('quieta');
  }, [claveDeLaLamina]);

  const tercera = modo === 'SERIE' ? C.evolucion : C.laminaHojas.CONCLUSIONES;
  const nombreDeLaHoja = hoja === 'CONCLUSIONES' ? tercera : C.laminaHojas[hoja];
  const encuadreVisible = modo === 'SERIE' ? encuadreEnSerie(encuadre) : encuadre;
  const encuadres: readonly EncuadreDeLaLamina[] = modo === 'SERIE' ? ['TREN_SUPERIOR', 'TREN_INFERIOR'] : ['ENTERO', 'TREN_SUPERIOR', 'TREN_INFERIOR'];

  // ─── Lo que se dibuja ───────────────────────────────────────────────────────────────────────
  let contenido: ReactNode = null;
  let espera: ReactNode = null;
  let descripcion = '';
  let fechas: string[] = [];
  const notas: ReactNode[] = [];
  let selectorDeSeries: ReactNode = null;
  let calculosPendientes = false;

  if (modo === 'MEDICION') {
    const detalle = detalles.estadoDe(evaluacionId);
    if (detalle.tipo === 'cargando') espera = <Cargando />;
    else if (detalle.tipo === 'error') espera = <ErrorConReintento onReintentar={detalles.reintentar} />;
    else if (detalle.tipo === 'no-disponible') espera = <NoDisponible />;
    else {
      const toma = detalle.evaluacion;
      const valores = valoresDeLaToma(toma.measurements);
      const fecha = dia(toma.occurredAt);
      fechas = [fechaCivil(toma.occurredAt)];
      const linea = [nombre, C.pestana, fecha].filter((p): p is string => Boolean(p)).map(mayusculas).join(SEPARADOR);
      const resultados = calculos.estado.tipo === 'listo' ? resultadosDeLaToma(calculos.estado.corridas, calculos.estado.metodos, toma.evaluationId) : [];

      if (hoja === 'CONCLUSIONES') {
        if (calculos.estado.tipo === 'cargando') espera = <Cargando />;
        else if (calculos.estado.tipo === 'error') espera = <ErrorConReintento onReintentar={calculos.reintentar} />;
        else {
          const datos = DATOS_DE_LA_TOMA.flatMap((clave) => {
            const v = valores.porClave.get(clave);
            return v ? [{ clave, rotulo: nombreDeMetrica(clave), detalle: ETIQUETA_DE_CLASE_DE_DATO[v.clase], valor: textoDelValor(v), unidad: unidadVisible(v.unidad) }] : [];
          });
          const secciones: SeccionDeLaLamina[] = [
            ...(datos.length > 0 ? [{ titulo: C.laminaDatosDeLaToma, filas: datos }] : []),
            ...agruparPorCategoria(resultados).map((s) => ({
              titulo: s.categoria ? (C.categoriaDeMetodo[s.categoria] ?? s.categoria) : C.laminaOtrosCalculos,
              // Cada valor con su método. La categoría ya dice qué es; sin categoría, la métrica va debajo. Dos corridas
              // vigentes del mismo método se distinguen por la versión y, si es la misma, por cuándo se calcularon.
              filas: s.resultados.map((r) => {
                const mismoMetodo = s.resultados.filter((o) => o.metodo === r.metodo);
                const mismaVersion = mismoMetodo.filter((o) => o.version === r.version);
                const detalle = [s.categoria ? null : r.nombre, mismoMetodo.length > 1 ? `${C.versionDelMetodo} ${r.version}` : null, mismaVersion.length > 1 ? fechaYHora(r.registradoEn) : null]
                  .filter((p): p is string => p !== null)
                  .join(' · ');
                return { clave: r.corridaId, rotulo: r.metodo, detalle: detalle || null, valor: textoDelValor(r.valor), unidad: unidadVisible(r.valor.unidad) };
              }),
            })),
          ];
          contenido = (
            <HojaDeConclusiones
              tema={tema}
              secciones={secciones}
              sinResultados={resultados.length === 0}
              encabezado={{ titulo: mayusculas(nombreDeLaHoja), linea, fecha, nombre, etiqueta: null }}
            />
          );
          descripcion = `${C.laminaImagen} «${nombreDeLaHoja}»: ${C.tomaDel} ${fecha}; ${resultados.length} ${C.laminaResultadosEnLaImagen}. ${C.laminaDatosEnElDetalle}`;
          const reparto = repartirConclusiones(secciones.map((s) => s.filas.length));
          const mostradas = new Map(reparto.tarjetas.map((t) => [t.indice, t.filas]));
          const fuera = secciones.flatMap((s, i) => s.filas.slice(mostradas.get(i) ?? 0).map((f) => (f.detalle ? `${f.rotulo} (${f.detalle})` : f.rotulo)));
          notas.push(<Nota key="no-entran" titulo={C.laminaNoEntran} items={fuera} />);
          const sinEfecto = corridasSinEfecto(calculos.estado.corridas, toma.evaluationId);
          if (sinEfecto > 0) notas.push(<p key="sin-efecto" className="nota">{`${C.laminaCalculosSinEfecto} (${sinEfecto})`}</p>);
          if (!calculos.estado.completa) notas.push(<p key="incompleta" className="nota">{C.laminaListaIncompleta}</p>);
        }
      } else {
        const comp = componerMedicion(sexo, encuadre, FAMILIA_DE_LA_HOJA[hoja], valores.porClave);
        const sumas = hoja === 'PLIEGUES' ? sumasDelPieDePliegues(resultados).map((s) => ({ rotulo: s.rotulo, valor: s.resultado?.valor ?? null })) : [];
        calculosPendientes = hoja === 'PLIEGUES' && calculos.estado.tipo === 'cargando';
        contenido = (
          <HojaDeMedicion
            tema={tema}
            comp={comp}
            hoja={hoja}
            valores={valores.porClave}
            sumas={sumas}
            encabezado={{ titulo: mayusculas(nombreDeLaHoja), linea, fecha, nombre, etiqueta: ETIQUETA_DEL_ENCUADRE[encuadre] }}
          />
        );
        descripcion = `${C.laminaImagen} «${nombreDeLaHoja}»: ${C.tomaDel} ${fecha}, ${C.figura.toLowerCase()} ${(sexo === 'HOMBRE' ? C.figuraHombre : C.figuraMujer).toLowerCase()}, ${C.laminaEncuadres[encuadre].toLowerCase()}; ${comp.sitios.length} ${C.laminaMedidasEnLaFigura}. ${C.laminaDatosEnElDetalle}`;
        notas.push(<Nota key="otro-encuadre" titulo={C.laminaEnOtroEncuadre} items={comp.fueraDelEncuadre.map((k) => ROTULO_EN_LA_LAMINA[k])} />);
        if (hoja === 'PLIEGUES' && calculos.estado.tipo === 'error') {
          notas.push(
            <p key="calculos" className="nota">
              {COPY.errorDeVista}{' '}
              <button type="button" className="boton boton--enlace" onClick={() => void calculos.reintentar()}>
                {COPY.reintentar}
              </button>
            </p>,
          );
        }
      }

      const sinSitio = [...DATOS_DE_LA_TOMA, ...DIAMETROS_DE_LA_LAMINA, ...clavesSinLugarEnLaLamina(valores.porClave)].flatMap((clave) => {
        const v = valores.porClave.get(clave);
        return v ? [`${nombreDeMetrica(clave)} ${conUnidad(v)}`] : [];
      });
      notas.push(<Nota key="sin-sitio" titulo={C.laminaSinSitio} items={sinSitio} />);
      notas.push(<Nota key="repetidas" titulo={C.laminaRepetidas} items={valores.repetidas.map(nombreDeMetrica)} />);
    }
  } else {
    const estados = idsDeLaSerie.map((id) => ({ id, estado: detalles.estadoDe(id) }));
    const cargadas = enOrdenDeFecha(estados.flatMap((e) => (e.estado.tipo === 'listo' ? [e.estado.evaluacion] : [])));
    const tomas = cargadas.map((e) => ({ evaluacionId: e.evaluationId, valores: valoresDeLaToma(e.measurements).porClave }));
    const textosDeFecha = cargadas.map((e) => dia(e.occurredAt));
    fechas = cargadas.map((e) => fechaCivil(e.occurredAt));
    const rango = textosDeFecha.length > 1 ? `${textosDeFecha[0]} → ${textosDeFecha[textosDeFecha.length - 1]}` : (textosDeFecha[0] ?? '');
    const encabezado = (etiqueta: string): DatosDelEncabezado => ({
      titulo: mayusculas(nombreDeLaHoja),
      linea: [nombre, C.laminaEvolucionAntropometrica, rango].filter((p): p is string => Boolean(p)).map(mayusculas).join(SEPARADOR),
      fecha: rango,
      nombre,
      etiqueta,
    });
    const etiquetaDeSerie = mayusculas(C.laminaModos.SERIE);

    if (estados.some((e) => e.estado.tipo === 'cargando')) espera = <Cargando />;
    else if (estados.some((e) => e.estado.tipo === 'error')) espera = <ErrorConReintento mensaje={C.laminaTomaNoCargo} onReintentar={detalles.reintentar} />;
    else if (tomas.length === 0) {
      contenido = <HojaConNota tema={tema} titulo={C.laminaElegiTomasTitulo} texto={C.laminaElegiTomas} encabezado={encabezado(etiquetaDeSerie)} />;
      descripcion = `${C.laminaImagen} «${nombreDeLaHoja}»: ${C.laminaElegiTomas}`;
    } else if (hoja === 'CONCLUSIONES') {
      if (calculos.estado.tipo === 'cargando') espera = <Cargando />;
      else if (calculos.estado.tipo === 'error') espera = <ErrorConReintento onReintentar={calculos.reintentar} />;
      else {
        const todas = seriesDeEvolucion(tomas, calculos.estado.corridas, calculos.estado.metodos);
        const claves = new Set(seriesElegidas ?? todas.slice(0, SERIES_EN_EVOLUCION.porDefecto).map((s) => s.clave));
        const series = todas.filter((s) => claves.has(s.clave)).slice(0, SERIES_EN_EVOLUCION.maximo);
        const pie = `${tomas.length} ${mayusculas(C.laminaTomas)}${SEPARADOR}T1 ${textosDeFecha[0]} → T${tomas.length} ${textosDeFecha[textosDeFecha.length - 1]}`;
        contenido = <HojaDeEvolucion tema={tema} series={series} fechas={textosDeFecha} pie={pie} encabezado={encabezado(etiquetaDeSerie)} />;
        descripcion = `${C.laminaImagen} «${nombreDeLaHoja}»: ${tomas.length} ${C.laminaTomas}, ${rango}; ${series.length} ${C.laminaSeriesEnLaImagen}. ${C.laminaDatosEnElDetalle}`;
        selectorDeSeries = (
          <SelectorDeSeries
            series={todas.map((s) => ({ clave: s.clave, texto: s.metodo ? `${s.nombre} · ${s.metodo}` : s.nombre }))}
            elegidas={series.map((s) => s.clave)}
            onCambiar={setSeriesElegidas}
          />
        );
        if (!calculos.estado.completa) notas.push(<p key="incompleta" className="nota">{C.laminaListaIncompleta}</p>);
      }
    } else {
      const comp = componerSerie(sexo, encuadreEnSerie(encuadre), FAMILIA_DE_LA_HOJA[hoja], tomas.map((t) => t.valores));
      const franja = FRANJA_DE_LA_SERIE[hoja]
        .map((f) => ({ rotulo: f.rotulo, valores: tomas.map((t) => t.valores.get(f.clave) ?? null) }))
        .filter((f) => f.valores.some((v) => v !== null));
      contenido = (
        <HojaDeSerie tema={tema} comp={comp} fechas={textosDeFecha} franja={franja} encabezado={encabezado(`${etiquetaDeSerie} · ${ETIQUETA_DEL_ENCUADRE[encuadreEnSerie(encuadre)]}`)} />
      );
      descripcion = `${C.laminaImagen} «${nombreDeLaHoja}»: ${tomas.length} ${C.laminaTomas}, ${rango}, ${C.figura.toLowerCase()} ${(sexo === 'HOMBRE' ? C.figuraHombre : C.figuraMujer).toLowerCase()}, ${C.laminaEncuadres[encuadreEnSerie(encuadre)].toLowerCase()}; ${comp.tarjetas.length} ${C.laminaSeriesEnLaImagen}. ${C.laminaDatosEnElDetalle}`;
      notas.push(<Nota key="otro-encuadre" titulo={C.laminaEnOtroEncuadre} items={comp.fueraDelEncuadre.map((k) => ROTULO_EN_LA_LAMINA[k])} />);
    }
    if (estados.some((e) => e.estado.tipo === 'no-disponible')) notas.push(<p key="no-disponibles" className="nota">{COPY_EVOLUCION.evaluacionNoDisponible}</p>);
  }

  const nombreDelArchivo = nombreDelArchivoDeLaLamina({ modo, hoja, encuadre, fechas });
  const sePuedeDescargar = contenido !== null && !calculosPendientes && descarga !== 'preparando';

  async function descargar() {
    if (!svg.current) return;
    setDescarga('preparando');
    try {
      await descargarLamina(svg.current, nombreDelArchivo);
      setDescarga('hecha');
    } catch {
      setDescarga('error');
    }
  }

  return (
    <section className="seccion lamina" aria-labelledby="titulo-lamina">
      <h2 id="titulo-lamina">{C.lamina}</h2>
      {pedida !== null && pedidaValida === null ? (
        <Aviso tipo="info">
          <p>{C.laminaEvaluacionPedidaNoEsta}</p>
        </Aviso>
      ) : null}

      {/*
        Pulido del 2026-10-03 (prueba de Dirección con la 0.13.1: en el teléfono, los controles empujaban la imagen hacia
        abajo). El orden es el de la tarea:
        - qué se muestra: la toma, o las tomas de la serie, y la hoja;
        - la imagen con «Descargar imagen»;
        - los ajustes de cómo se ve;
        - al final, las notas y la explicación.
        En el teléfono la imagen entra en la primera pantalla. En una pantalla ancha va a la derecha y queda fija mientras
        se ajusta. El orden del documento es el del teléfono, y el foco lo sigue.
      */}
      <div className="lamina__disposicion">
      <div className="lamina__que">
      {modo === 'MEDICION' ? (
        <div className="campo lamina__toma">
          <label htmlFor="lamina-toma">{C.laminaToma}</label>
          <select id="lamina-toma" value={evaluacionId} onChange={(e) => irA('lamina', e.target.value)}>
            {[...ordenadas].reverse().map((e) => (
              <option key={e.evaluationId} value={e.evaluationId}>
                {`${dia(e.occurredAt)} · ${e.summary.measurementCount} mediciones`}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <fieldset className="lamina__tomas">
          <legend>{C.laminaTomasDeLaSerie}</legend>
          <p className="nota">{C.laminaAyudaDeLaSerie}</p>
          <ul>
            {[...ordenadas].reverse().map((e) => {
              const marcada = idsDeLaSerie.includes(e.evaluationId);
              return (
                <li key={e.evaluationId}>
                  <label>
                    <input type="checkbox" checked={marcada} disabled={!marcada && idsDeLaSerie.length >= MAXIMO_DE_TOMAS_EN_SERIE} onChange={() => alternarToma(e.evaluationId)} />{' '}
                    {dia(e.occurredAt)}
                    {marcada ? ` · T${idsDeLaSerie.indexOf(e.evaluationId) + 1}` : ''}
                  </label>
                </li>
              );
            })}
          </ul>
        </fieldset>
      )}
      <Opciones
        id="lamina-hoja"
        titulo={C.lamina}
        opciones={(['CIRCUNFERENCIAS', 'PLIEGUES', 'CONCLUSIONES'] as const).map((h) => ({ valor: h, texto: h === 'CONCLUSIONES' ? tercera : C.laminaHojas[h] }))}
        elegida={hoja}
        onElegir={setHoja}
      />
      </div>

      <div className="lamina__vista">
        {espera ?? (
          <div className="lamina__lienzo">
            <LaminaSvg tema={tema} descripcion={descripcion} refDelSvg={svg}>
              {contenido}
            </LaminaSvg>
          </div>
        )}
        <div className="acciones lamina__acciones">
          <button type="button" className="boton boton--primario" onClick={() => void descargar()} disabled={!sePuedeDescargar} aria-busy={descarga === 'preparando'}>
            {descarga === 'preparando' ? C.preparandoImagen : C.descargarImagen}
          </button>
          <p className="nota" role="status">
            {descarga === 'hecha' ? C.imagenDescargada : descarga === 'error' ? C.imagenNoSePudo : ''}
          </p>
        </div>
      </div>

      <div className="lamina__ajustes" role="group" aria-labelledby="titulo-ajustes-de-la-lamina">
        <h3 id="titulo-ajustes-de-la-lamina" className="lamina__ajustes-titulo">
          {C.laminaAjustes}
        </h3>
        <div className="lamina__controles">
          <Opciones id="lamina-modo" titulo={C.laminaModo} opciones={(['MEDICION', 'SERIE'] as const).map((m) => ({ valor: m, texto: C.laminaModos[m] }))} elegida={modo} onElegir={elegirModo} />
          {hoja !== 'CONCLUSIONES' ? (
            <>
              <Opciones
                id="lamina-encuadre"
                titulo={C.laminaEncuadre}
                opciones={encuadres.map((e) => ({ valor: e, texto: C.laminaEncuadres[e] }))}
                elegida={encuadreVisible}
                onElegir={setEncuadre}
              />
              <Opciones
                id="lamina-figura"
                titulo={C.figura}
                opciones={[
                  { valor: 'HOMBRE' as const, texto: C.figuraHombre },
                  { valor: 'MUJER' as const, texto: C.figuraMujer },
                ]}
                elegida={sexo}
                onElegir={setSexo}
              />
            </>
          ) : null}
          <Opciones id="lamina-tema" titulo={C.laminaTema} opciones={TEMAS.map((t) => ({ valor: t, texto: C.laminaTemas[t] }))} elegida={tema} onElegir={elegirTema} />
        </div>
        {selectorDeSeries}
      </div>

      <div className="lamina__pie">
        <div className="lamina__notas">{notas}</div>
        {/* DL-113 · qué es la lámina y cómo se lee, plegado y al final: arriba quedan lo que se muestra y la imagen. */}
        <Ayuda>
          <p>{C.explicacionDeLamina}</p>
          {hoja !== 'CONCLUSIONES' ? <p>{C.explicacionDeFigura}</p> : null}
          {modo === 'SERIE' ? <p>{C.laminaExplicacionDeResta}</p> : null}
          {modo === 'SERIE' && hoja !== 'CONCLUSIONES' ? <p>{C.laminaSerieSinEntero}</p> : null}
          <p>{C.laminaTemaPropio}</p>
        </Ayuda>
      </div>
      </div>
    </section>
  );
}

/** Qué series van en la lámina «Evolución» (hasta ocho): casillas, porque se eligen varias. */
function SelectorDeSeries({ series, elegidas, onCambiar }: { series: readonly { clave: string; texto: string }[]; elegidas: readonly string[]; onCambiar: (claves: readonly string[]) => void }) {
  const marcadas = new Set(elegidas);
  return (
    <fieldset className="lamina__tomas">
      <legend>{C.laminaSeriesEnLaLamina}</legend>
      <p className="nota">{C.laminaAyudaDeSeries}</p>
      <ul>
        {series.map((s) => {
          const marcada = marcadas.has(s.clave);
          return (
            <li key={s.clave}>
              <label>
                <input
                  type="checkbox"
                  checked={marcada}
                  disabled={!marcada && marcadas.size >= SERIES_EN_EVOLUCION.maximo}
                  onChange={() => onCambiar(marcada ? elegidas.filter((c) => c !== s.clave) : [...elegidas, s.clave])}
                />{' '}
                {s.texto}
              </label>
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}
