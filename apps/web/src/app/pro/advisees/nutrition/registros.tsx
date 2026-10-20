'use client';

/**
 * NUT-13 Registros (B05:1072-1124) y NUT-12 Estructurar registro libre (B05:1014-1057).
 * - Contraste descriptivo: lo indicado y lo registrado, día por día. Sin «82 % adherencia», sin «bien» ni «mal»; una
 *   comida sin registro dice «Sin registro», nunca «0 %» ni «No cumplido» (REG-06-125; INV-06-135).
 * - Una comida fuera del plan se estructura como «Estimación profesional»: la descripción original queda en solo
 *   lectura y se conserva (INV-06-131). El botón dice «Agregar estimación», no «Corregir lo que comió».
 *
 * WP-ESCRITORIO-AREAS (parte 1; maqueta 20): **el día es la unidad.**
 * - Cada día es un renglón («3 de 4 comidas registradas · 1 sin registro») que se abre en el lugar; arrancan abiertos
 *   los que tienen una comida diferente o algo distinto de lo indicado. Plegar no esconde.
 * - Cada comida del plan es una fila: lo registrado, cómo se informaron las cantidades y la diferencia observada, con
 *   las palabras del dominio. Una comida diferente va en su comida y no la marca como registrada.
 * - Las vistas con nombre dicen cuántas comidas trae cada una, contadas sobre las filas que se ven.
 * - El registro completo se abre al costado, sin tapar la lista; en una ventana angosta, encima. La estimación del
 *   profesional se agrega desde ahí.
 * - Sale de dos lecturas (F-15): el contexto de revisión arma los días y la línea de tiempo del mismo período dice de
 *   cada registro la opción, el modo y lo comprobado. Si la segunda falla, los días se ven igual y lo que depende de
 *   ella lo dice: una falla no es una ausencia de datos.
 * - El período, la vista y el registro abierto viven en la dirección: «Actualizar» y volver atrás los conservan.
 */
import {
  cantidad,
  componerLosRegistros,
  contarLasVistas,
  COPY_NUTRICION,
  COPY_REGISTRO_PARA_EL_PROFESIONAL,
  diaAbiertoAlEntrar,
  diasSinComidasDelPlan,
  diferenciaEnUnRenglon,
  ETIQUETA_DE_UNIDAD,
  filaEnLaVista,
  frenteALoIndicadoDeUnaComida,
  leerNumero,
  modoDeUnaComida,
  MODO_EN_UN_RENGLON,
  motivoDeNumeroIlegible,
  NOMBRE_DEL_RASGO,
  nombreAlternativoComoAclaracion,
  numero,
  opcionDeUnaComida,
  rasgosDeLaFila,
  registroDeLaOpcion,
  resumenDeUnDia,
  todasLasPaginas,
  VISTAS_DE_REGISTROS,
  type ClaveDeVistaDeRegistros,
  type ContextoDeRevisionResponse,
  type DiaDeRegistros,
  type ElementoDeCatalogo,
  type ElementoEncontrado,
  type EntradaDeLineaDeTiempo,
  type FilaDeRegistro,
  type Ingesta,
  type RasgoDeUnHecho,
  type RegistroDeUnaFila,
} from '@be/domain';
import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { BloqueDeEstado, Cargando, EstadoVacio } from '../../../../components/estados';
import { Aviso, Campo } from '../../../../components/formulario';
import { Icono } from '../../../../components/icono';
import { OrigenEnElCatalogo } from '../../../../components/origen-en-el-catalogo';
import { Panel } from '../../../../components/panel';
import { BotonDeVista } from '../../../../components/vista-con-nombre';
import { api, type Resultado } from '../../../../lib/api';
import { ICONO_DE_FALLA, motivoDeFalla, razonDeFalla, type MotivoDeFalla } from '../../../../lib/fallas';
import { diaDelAnioEnCurso, fecha, nombreDelDiaDeLaSemana } from '../../../../lib/formato';
import { mensajeDeFallo, useClaveDeIntento } from '../../../../lib/intento';
import { ControlDePeriodo } from '../control-de-periodo';
import { useCambiosSinGuardar } from '../marco-del-area';
import { ATAJOS_DE_UN_AREA, cambiosDePeriodo, MAXIMO_DE_DIAS_DE_UN_AREA, periodoALaVista, periodoPedidoEnUnArea, type PeriodoDeUnArea } from '../periodo-de-un-area';
import { useDetalleAlCostado } from '../seguimiento/al-costado';
import { hoyEn } from '../seguimiento/estado';
import { ICONO_DEL_RASGO } from '../seguimiento/hecho-en-un-renglon';
import { DetalleDeRegistroDeComida } from './detalle-de-registro';
import { EstadoDeLectura, useNutricion } from './nutricion';

type Contexto = ContextoDeRevisionResponse['data'];

/** Cuántos días se muestran de una vez; «Ver días anteriores» suma otros tantos. La lectura trae el período entero. */
const DIAS_DE_UNA_VEZ = 14;
/** De a cuántos registros se lee la línea de tiempo, y hasta cuántas páginas (92 días de cuatro comidas entran). */
const POR_PAGINA = 50;
const PAGINAS = 10;

/** La vista elegida, como va en la dirección (`ver=`). Sin el parámetro, «Todas las comidas». */
const VISTA_DEL_PARAMETRO: Readonly<Record<string, ClaveDeVistaDeRegistros>> = { distintas: 'DISTINTAS', 'sin-confirmar': 'SIN_CONFIRMAR', 'comida-diferente': 'COMIDA_DIFERENTE', 'sin-registro': 'SIN_REGISTRO' };
const PARAMETRO_DE_LA_VISTA = Object.fromEntries(Object.entries(VISTA_DEL_PARAMETRO).map(([k, v]) => [v, k])) as Partial<Record<ClaveDeVistaDeRegistros, string>>;

type Linea = { readonly tipo: 'cargando' } | { readonly tipo: 'error'; readonly motivo: MotivoDeFalla } | { readonly tipo: 'listo'; readonly entradas: readonly EntradaDeLineaDeTiempo[]; readonly completa: boolean };

export function VistaDeRegistros() {
  const { token, asesoradoId, sesionPerdida, parametros, ir } = useNutricion();
  const hoy = hoyEn();
  const claveDelPeriodo = `${parametros.get('p') ?? ''}|${parametros.get('desde') ?? ''}|${parametros.get('hasta') ?? ''}`;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const pedido = useMemo(() => periodoPedidoEnUnArea(parametros, hoy), [claveDelPeriodo, hoy]);
  const [r, setR] = useState<Resultado<{ data: Contexto }> | null>(null);
  const [linea, setLinea] = useState<Linea>({ tipo: 'cargando' });
  const generacion = useRef(0);

  /** Las comidas de la línea de tiempo del mismo período, leídas enteras: dicen de cada registro lo que el contraste no trae. */
  const leerLaLinea = useCallback(
    async (periodo: Contexto['period'], esta: number) => {
      const res = await todasLasPaginas(
        async (f) => {
          const pagina = await api.lineaDeTiempo(token, asesoradoId, { periodStart: periodo.start, periodEnd: periodo.end, domain: 'NUTRITION', type: 'MEAL_RECORDED', ...f });
          // La línea de tiempo trae sus entradas adentro de `data`: se le da la forma de una lista por páginas.
          return pagina.ok ? { ok: true as const, datos: { data: pagina.datos.data.entries, page: pagina.datos.page } } : pagina;
        },
        { limite: POR_PAGINA, maximoDePaginas: PAGINAS },
      );
      if (esta !== generacion.current || sesionPerdida(res)) return;
      setLinea(res.ok ? { tipo: 'listo', entradas: res.datos.data, completa: res.datos.completa } : { tipo: 'error', motivo: motivoDeFalla(res) });
    },
    [token, asesoradoId, sesionPerdida],
  );

  /** Lee las dos cosas. En silencio (después de guardar una estimación), lo que hay sigue a la vista: la lista no salta. */
  const cargar = useCallback(
    async (enSilencio = false) => {
      const esta = ++generacion.current;
      if (!enSilencio) {
        setR(null);
        setLinea({ tipo: 'cargando' });
      }
      const res = await api.contextoDeRevision(token, asesoradoId, pedido ? { periodStart: pedido.desde, periodEnd: pedido.hasta } : {});
      if (esta !== generacion.current || sesionPerdida(res)) return;
      setR(res);
      if (res.ok) await leerLaLinea(res.datos.data.period, esta);
    },
    [token, asesoradoId, sesionPerdida, pedido, leerLaLinea],
  );
  useEffect(() => {
    void cargar();
  }, [cargar]);

  const contexto = r?.ok ? r.datos.data : null;
  const reintentarLaLinea = () => {
    if (!contexto) return;
    setLinea({ tipo: 'cargando' });
    void leerLaLinea(contexto.period, generacion.current);
  };
  // El control dice el período que se está viendo: el pedido, o el que propuso la API.
  const periodo = periodoALaVista(pedido, contexto?.period ?? null, hoy);
  const elegirPeriodo = (p: PeriodoDeUnArea) => ir({ ...cambiosDePeriodo(p), registro: null }, { agregarAlHistorial: true });

  return (
    <section className="registros" aria-labelledby="titulo-registros">
      <div className="registros__encabezado">
        <h2 id="titulo-registros">{COPY_NUTRICION.registros}</h2>
        <p className="nota registros__bajada">
          Lo indicado y lo registrado, día por día.
        </p>
        {/* El período queda fuera del estado de lectura: si no se puede leer, sigue ahí para cambiarlo (B10-10:376). */}
        {periodo ? <ControlDePeriodo periodo={periodo} atajos={ATAJOS_DE_UN_AREA} maximoDeDias={MAXIMO_DE_DIAS_DE_UN_AREA} onElegir={elegirPeriodo} /> : null}
      </div>
      <EstadoDeLectura r={r} onReintentar={() => void cargar()}>
        {contexto ? linea.tipo === 'cargando' ? <Cargando /> : <Contraste contexto={contexto} linea={linea} hoy={hoy} onReintentarLaLinea={reintentarLaLinea} onCambio={() => void cargar(true)} /> : null}
      </EstadoDeLectura>
    </section>
  );
}

const UNIDAD: readonly [string, string] = ['comida', 'comidas'];

function Contraste({ contexto, linea, hoy, onReintentarLaLinea, onCambio }: { contexto: Contexto; linea: Exclude<Linea, { tipo: 'cargando' }>; hoy: string; onReintentarLaLinea: () => void; onCambio: () => void }) {
  const { token, sesionPerdida, parametros, ir } = useNutricion();
  const id = useId();
  const conLaLinea = linea.tipo === 'listo';
  const dias = useMemo(() => componerLosRegistros(contexto.descriptiveContrast, linea.tipo === 'listo' ? linea.entradas : null), [contexto, linea]);
  const cuentas = useMemo(() => contarLasVistas(dias, conLaLinea), [dias, conLaLinea]);
  const vista: ClaveDeVistaDeRegistros = VISTA_DEL_PARAMETRO[parametros.get('ver') ?? ''] ?? 'TODAS';
  const definicion = VISTAS_DE_REGISTROS.find((v) => v.clave === vista)!;
  // Con una vista elegida, cada día muestra solo las filas que coinciden, abiertas.
  const aLaVista = useMemo(() => (vista === 'TODAS' ? dias : dias.map((d) => ({ ...d, filas: d.filas.filter((f) => filaEnLaVista(f, vista)) })).filter((d) => d.filas.length > 0)), [dias, vista]);
  const [hasta, setHasta] = useState(DIAS_DE_UNA_VEZ);
  useEffect(() => setHasta(DIAS_DE_UNA_VEZ), [vista, contexto.period.start, contexto.period.end]);
  // Los días que el profesional abrió o cerró a mano: los demás siguen la regla (`diaAbiertoAlEntrar`).
  const [alternados, setAlternados] = useState<ReadonlySet<string>>(new Set());
  const estaAbierto = (d: DiaDeRegistros) => vista !== 'TODAS' || diaAbiertoAlEntrar(d) !== alternados.has(d.fecha);
  const alternar = (fechaDelDia: string) =>
    setAlternados((a) => {
      const b = new Set(a);
      if (b.has(fechaDelDia)) b.delete(fechaDelDia);
      else b.add(fechaDelDia);
      return b;
    });

  // El registro abierto: su fila y cuál de sus registros es.
  const registroId = parametros.get('registro');
  const abierto = useMemo(() => {
    if (!registroId) return null;
    for (const d of dias) for (const f of d.filas) for (const reg of f.registros) if (reg.id === registroId) return { fila: f, registro: reg };
    return null;
  }, [dias, registroId]);
  const alCostado = useDetalleAlCostado();
  const raiz = useRef<HTMLDivElement>(null);
  const detalle = useRef<HTMLElement>(null);
  const titulo = useRef<HTMLHeadingElement>(null);
  const idDelAbierto = abierto?.registro.id ?? null;
  // Al abrir el detalle al costado, el foco va a su título: con el teclado, el detalle está después de toda la lista.
  useEffect(() => {
    if (idDelAbierto !== null && alCostado) titulo.current?.focus({ preventScroll: true });
  }, [idDelAbierto, alCostado]);
  const abrir = (reg: RegistroDeUnaFila) => ir({ registro: reg.id });
  /** Cierra el detalle. Si el foco estaba adentro, vuelve a la fila de ese registro (o al renglón de su día, si se plegó). */
  const cerrar = useCallback(
    (devolverElFoco: boolean) => {
      const anterior = idDelAbierto;
      ir({ registro: null });
      if (anterior === null || !devolverElFoco) return;
      // La dirección cambia en el próximo dibujo: el foco se devuelve después.
      requestAnimationFrame(() => {
        const fila = raiz.current?.querySelector<HTMLElement>(`[data-registro="${CSS.escape(anterior)}"]`);
        const destino = fila && fila.getClientRects().length > 0 ? fila : fila?.closest('.dia-de-registros')?.querySelector<HTMLElement>('.dia-de-registros__resumen');
        destino?.focus({ preventScroll: true });
      });
    },
    [idDelAbierto, ir],
  );
  const conDetalleAlCostado = abierto !== null && alCostado;
  useEffect(() => {
    if (!conDetalleAlCostado) return;
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || !(e.target instanceof Node) || !raiz.current?.contains(e.target)) return;
      cerrar(detalle.current?.contains(e.target) ?? false);
    };
    document.addEventListener('keydown', alTeclear);
    return () => document.removeEventListener('keydown', alTeclear);
  }, [conDetalleAlCostado, cerrar]);

  const total = cuentas.TODAS ?? 0;
  const deLaVista = cuentas[vista];
  const sinContar = diasSinComidasDelPlan(dias);
  const tituloDelAbierto = abierto ? tituloDelRegistro(abierto.fila, abierto.registro) : '';
  const contenidoDelAbierto = abierto ? (
    <DetalleDelRegistro
      key={abierto.registro.id}
      fila={abierto.fila}
      registro={abierto.registro}
      ingesta={contexto.registeredIntakes.find((i) => i.executionId === abierto.registro.id) ?? null}
      token={token}
      sesionPerdida={sesionPerdida}
      onCambio={onCambio}
    />
  ) : null;

  return (
    <>
      <div className="vistas-de-la-linea registros__vistas">
        <div className="vistas-de-la-linea__vistas" role="group" aria-labelledby={`${id}-ver`}>
          <span id={`${id}-ver`} className="vistas-de-la-linea__rotulo">
            Ver
          </span>
          {VISTAS_DE_REGISTROS.map((v) => (
            <BotonDeVista
              key={v.clave}
              clave={v.clave}
              nombre={v.nombre}
              icono={v.icono}
              elegida={vista === v.clave}
              cuenta={cuentas[v.clave]}
              unidad={UNIDAD}
              // Elegir una vista reemplaza a la que estaba; volver a tocarla deja «Todas las comidas». No le pide nada a la API.
              onElegir={() => ir({ ver: vista === v.clave ? null : (PARAMETRO_DE_LA_VISTA[v.clave] ?? null), registro: null }, { agregarAlHistorial: true })}
            />
          ))}
        </div>
      </div>

      {linea.tipo === 'error' ? (
        <BloqueDeEstado tipo="error" icono={ICONO_DE_FALLA[linea.motivo]} titulo="No pudimos traer la opción ni las cantidades de cada registro" onReintentar={onReintentarLaLinea}>
          {razonDeFalla(linea.motivo)} Los días y lo que se registró en cada comida están abajo. Falta saber qué opción fue, cómo se informaron las cantidades y si coinciden con lo indicado: por eso «{VISTAS_DE_REGISTROS[1]!.nombre}» y
          «{VISTAS_DE_REGISTROS[2]!.nombre}» no tienen cantidad.
        </BloqueDeEstado>
      ) : null}
      {linea.tipo === 'listo' && !linea.completa ? (
        <p className="nota">El período tiene más registros de los que se leyeron de una vez: en los días más viejos puede faltar la opción y el modo de algunas comidas. Probá con un período más corto.</p>
      ) : null}

      {/* Con «Todas las comidas» la cantidad ya está en la vista y los días, en el período: a la vista no se repite. */}
      <p className={vista === 'TODAS' && sinContar.sinPlan === 0 && sinContar.sinDiaTipo === 0 ? 'visualmente-oculto' : 'nota registros__cuenta'} role="status">
        {vista === 'TODAS'
          ? `${numero(total)} ${total === 1 ? UNIDAD[0] : UNIDAD[1]} en ${dias.length === 1 ? 'un día' : `${numero(dias.length)} días`}`
          : deLaVista === null
            ? `«${definicion.nombre}» no se puede contar sin esa lectura`
            : `${numero(deLaVista)} de ${numero(total)} ${total === 1 ? UNIDAD[0] : UNIDAD[1]}: ${definicion.nombre.toLowerCase()}`}
        {sinContar.sinPlan > 0 ? ` · ${sinContar.sinPlan === 1 ? 'un día' : `${sinContar.sinPlan} días`} sin plan vigente` : ''}
        {sinContar.sinDiaTipo > 0 ? ` · ${sinContar.sinDiaTipo === 1 ? 'un día' : `${sinContar.sinDiaTipo} días`} sin día tipo determinado: sus comidas no se pueden contar` : ''}
      </p>

      {/* Sin ninguna comida en el período, una vista elegida no es la que deja afuera: se dice el vacío del período, no «Hay 0». */}
      {aLaVista.length === 0 && vista !== 'TODAS' && total === 0 && deLaVista !== null ? (
        <EstadoVacio titulo="El período no tiene comidas para mostrar.">
          <p className="nota">No es un cero: no hay comidas del plan ni registros en estas fechas. Probá con un período más largo.</p>
        </EstadoVacio>
      ) : aLaVista.length === 0 ? (
        <EstadoVacio
          titulo={vista === 'TODAS' ? 'El período no tiene días para mostrar.' : deLaVista === null ? `No se puede saber qué comidas trae «${definicion.nombre}».` : `Ninguna comida del período coincide con «${definicion.nombre}».`}
          accion={
            vista === 'TODAS' ? undefined : (
              <button type="button" className="boton boton--secundario" onClick={() => ir({ ver: null }, { agregarAlHistorial: true })}>
                Ver todas las comidas
              </button>
            )
          }
        >
          {vista === 'TODAS' ? null : <p className="nota">{total === 1 ? 'Hay una comida' : `Hay ${numero(total)} comidas`} en el período elegido.</p>}
        </EstadoVacio>
      ) : (
        <div ref={raiz} className="linea__cuerpo" data-con-detalle={conDetalleAlCostado ? 'si' : undefined}>
          <div className="registros__lista">
            {/* Los nombres de las columnas, una vez. Para el lector de pantalla, cada dato lleva su rótulo en la fila. */}
            <div className="registros__columnas" aria-hidden="true">
              <span>Comida</span>
              <span>{COPY_NUTRICION.registrado}</span>
              <span>Cantidades</span>
              <span>{COPY_NUTRICION.diferenciaObservada}</span>
            </div>
            {aLaVista.slice(0, hasta).map((d) => (
              <Dia key={d.fecha} dia={d} hoy={hoy} conLaLinea={conLaLinea} conResumen={vista === 'TODAS'} abierto={estaAbierto(d)} onAlternar={() => alternar(d.fecha)} elegido={idDelAbierto} onAbrir={abrir} />
            ))}
            {aLaVista.length > hasta ? (
              <div className="acciones linea__mas">
                <button type="button" className="boton boton--secundario" onClick={() => setHasta(hasta + DIAS_DE_UNA_VEZ)}>
                  Ver días anteriores
                </button>
                <span className="nota">
                  Se ven {numero(Math.min(hasta, aLaVista.length))} de {numero(aLaVista.length)} días, hasta el {diaDelAnioEnCurso(aLaVista[Math.min(hasta, aLaVista.length) - 1]!.fecha, hoy)}.
                </span>
              </div>
            ) : null}
          </div>
          {abierto && alCostado ? (
            <aside ref={detalle} className="detalle-del-hecho" aria-labelledby={`${id}-detalle`}>
              <div className="detalle-del-hecho__cabecera">
                <p className="detalle-del-hecho__rotulo">Detalle del registro</p>
                <button type="button" className="boton boton--enlace" onClick={() => cerrar(true)}>
                  <Icono nombre="cerrar" tamano={18} />
                  Cerrar
                </button>
              </div>
              <h3 id={`${id}-detalle`} ref={titulo} tabIndex={-1}>
                {tituloDelAbierto}
              </h3>
              {contenidoDelAbierto}
            </aside>
          ) : null}
        </div>
      )}
      {/* En una ventana angosta el detalle no entra al costado: se abre encima, en un panel que retiene el foco. */}
      <Panel abierto={abierto !== null && !alCostado} titulo={tituloDelAbierto} onCerrar={() => ir({ registro: null })}>
        {abierto && !alCostado ? contenidoDelAbierto : null}
      </Panel>
    </>
  );
}

/** «Cena · comió algo diferente», «Desayuno · Tostadas con queso»: de qué comida es el registro y qué se registró. */
function tituloDelRegistro(fila: FilaDeRegistro, registro: RegistroDeUnaFila): string {
  const donde = fila.comida ?? COPY_NUTRICION.fueraDelPlan;
  if (registro.clase === 'COMIDA_DIFERENTE') return `${donde} · ${COPY_REGISTRO_PARA_EL_PROFESIONAL.algoDiferente.toLowerCase()}`;
  const opcion = registro.entrada ? opcionDeUnaComida(registro.entrada) : null;
  return opcion ? `${donde} · ${opcion}` : donde;
}

function Rasgo({ rasgo, children }: { rasgo: RasgoDeUnHecho; children: ReactNode }) {
  return (
    <span className="etiqueta-de-dato" data-rasgo={rasgo}>
      <Icono nombre={ICONO_DEL_RASGO[rasgo]} tamano={15} />
      {children}
    </span>
  );
}

function Dia({
  dia,
  hoy,
  conLaLinea,
  conResumen,
  abierto,
  onAlternar,
  elegido,
  onAbrir,
}: {
  dia: DiaDeRegistros;
  hoy: string;
  conLaLinea: boolean;
  /** Con una vista elegida el día muestra solo las filas que coinciden: su resumen hablaría de filas que no están. */
  conResumen: boolean;
  abierto: boolean;
  onAlternar: () => void;
  elegido: string | null;
  onAbrir: (r: RegistroDeUnaFila) => void;
}) {
  const id = useId();
  const resumen = resumenDeUnDia(dia, conLaLinea);
  const conFilas = dia.filas.length > 0;
  const cuerpoDelResumen = (
    <>
      <strong className="dia-de-registros__principal">{resumen.principal}</strong>
      {/* Hoy todavía no terminó: lo que falta registrar puede no haber ocurrido. */}
      {dia.fecha === hoy ? <span className="dia-de-registros__nota dia-de-registros__en-curso">hoy, día en curso</span> : null}
      {resumen.notas.map((n) =>
        n.rasgo ? (
          <Rasgo key={n.texto} rasgo={n.rasgo}>
            {n.texto}
          </Rasgo>
        ) : (
          <span key={n.texto} className="dia-de-registros__nota">
            {n.texto}
          </span>
        ),
      )}
    </>
  );
  return (
    <section className="linea-de-tiempo__dia dia-de-registros" data-fecha={dia.fecha} data-abierto={abierto && conFilas ? 'si' : undefined} aria-labelledby={`${id}-fecha`}>
      <h3 id={`${id}-fecha`} className="linea-de-tiempo__fecha">
        <span className="linea-de-tiempo__numero">{diaDelAnioEnCurso(dia.fecha, hoy)}</span>
        <span className="linea-de-tiempo__semana">{nombreDelDiaDeLaSemana(dia.fecha)}</span>
      </h3>
      <div className="dia-de-registros__cuerpo">
        {conResumen ? (
          conFilas ? (
            <button type="button" className="dia-de-registros__resumen" aria-expanded={abierto} aria-controls={`${id}-comidas`} onClick={onAlternar}>
              {cuerpoDelResumen}
              <Icono nombre={abierto ? 'arriba' : 'abajo'} tamano={18} />
            </button>
          ) : (
            // Un día sin plan vigente o sin día tipo determinado no tiene nada que abrir.
            <p className="dia-de-registros__resumen dia-de-registros__resumen--fijo">{cuerpoDelResumen}</p>
          )
        ) : null}
        {conFilas ? (
          <ul id={`${id}-comidas`} className="dia-de-registros__comidas" hidden={!abierto}>
            {abierto ? dia.filas.map((f) => <Fila key={f.clave} fila={f} conLaLinea={conLaLinea} elegido={elegido} onAbrir={onAbrir} />) : null}
          </ul>
        ) : null}
      </div>
    </section>
  );
}

/** Un dato de la fila con su rótulo para el lector de pantalla (a la vista, el rótulo está una vez, arriba de la lista). */
function Dato({ rotulo, className, children }: { rotulo: string; className?: string; children: ReactNode }) {
  return (
    <span className={className}>
      <span className="visualmente-oculto">{rotulo}: </span>
      {children}
    </span>
  );
}

function Fila({ fila, conLaLinea, elegido, onAbrir }: { fila: FilaDeRegistro; conLaLinea: boolean; elegido: string | null; onAbrir: (r: RegistroDeUnaFila) => void }) {
  const opcion = registroDeLaOpcion(fila);
  const diferentes = fila.registros.filter((r) => r.clase === 'COMIDA_DIFERENTE');
  const principal = opcion ?? diferentes[0] ?? null;
  const entrada = opcion?.entrada ?? null;
  const modo = entrada ? modoDeUnaComida(entrada) : null;
  const comoSeRegistro = modo ? MODO_EN_UN_RENGLON[modo] : undefined;
  // Los rasgos que el modo y la columna de la diferencia ya dicen no se repiten como etiqueta.
  const rasgos = rasgosDeLaFila(fila).filter((r) => r === 'RECTIFICADO' || r === 'CORREGIDO' || r === 'CARGADO_OTRO_DIA');
  const sinDato = conLaLinea ? 'Sin dato' : 'No se pudo traer';
  const cuerpo = (
    <>
      <strong className="comida-del-dia__comida">{fila.comida ?? COPY_NUTRICION.fueraDelPlan}</strong>
      <Dato rotulo={COPY_NUTRICION.registrado} className="comida-del-dia__registrado">
        {fila.estado === 'SIN_REGISTRO' ? <span className="comida-del-dia__tenue">{COPY_NUTRICION.sinRegistro}</span> : null}
        {opcion ? <span>{entrada ? (opcionDeUnaComida(entrada) ?? 'Opción del plan') : `Opción del plan · ${sinDato.toLowerCase()}`}</span> : null}
        {/* Los dos hechos: no hay una opción del plan registrada, y sí algo diferente. */}
        {fila.estado === 'COMIDA_DIFERENTE' && fila.comida !== null ? <span className="comida-del-dia__tenue">{COPY_REGISTRO_PARA_EL_PROFESIONAL.sinOpcionDelPlan}</span> : null}
        {diferentes.map((d) => (
          <span key={d.id} className="comida-del-dia__diferente">
            <Icono nombre="desvio" tamano={18} />
            {NOMBRE_DEL_RASGO.COMIDA_DIFERENTE}: {d.descripcion ? `«${d.descripcion}»` : COPY_REGISTRO_PARA_EL_PROFESIONAL.sinDescripcion.toLowerCase()}
            {aproximada(d) ? `, ${aproximada(d)}` : ''}
          </span>
        ))}
        {rasgos.map((r) => (
          <Rasgo key={r} rasgo={r}>
            {NOMBRE_DEL_RASGO[r]}
          </Rasgo>
        ))}
      </Dato>
      <Dato rotulo="Cantidades" className="comida-del-dia__cantidades">
        {comoSeRegistro ? (
          <>
            <Icono nombre={comoSeRegistro.icono} tamano={18} />
            {comoSeRegistro.texto}
          </>
        ) : opcion ? (
          <span className="comida-del-dia__tenue">{sinDato}</span>
        ) : (
          <span className="visualmente-oculto">no corresponde</span>
        )}
      </Dato>
      <Dato rotulo={COPY_NUTRICION.diferenciaObservada} className="comida-del-dia__diferencia">
        {opcion ? <span>{entrada ? frenteALoIndicadoDeUnaComida(entrada) : sinDato}</span> : null}
        {fila.diferencias.length > 0 ? <strong>{fila.diferencias.map(diferenciaEnUnRenglon).join(' · ')}</strong> : null}
        {!opcion && diferentes.length > 0 ? <span className="comida-del-dia__tenue">No se compara: fuera de lo indicado</span> : null}
        {fila.estado === 'SIN_REGISTRO' ? <span className="visualmente-oculto">no corresponde</span> : null}
      </Dato>
    </>
  );
  return (
    <li className="comida-del-dia" data-estado={fila.estado} data-clave={fila.clave}>
      {principal ? (
        <button type="button" className="comida-del-dia__fila" data-registro={principal.id} aria-current={elegido !== null && fila.registros.some((r) => r.id === elegido) ? 'true' : undefined} onClick={() => onAbrir(principal)}>
          {cuerpo}
          <Icono nombre="derecha" tamano={18} />
        </button>
      ) : (
        <div className="comida-del-dia__fila comida-del-dia__fila--sin-registro">{cuerpo}</div>
      )}
      {/* Otra comida diferente registrada en la misma comida: cada registro se abre por separado. */}
      {(opcion ? diferentes : diferentes.slice(1)).map((d) => (
        <button key={d.id} type="button" className="boton boton--enlace comida-del-dia__otro" data-registro={d.id} aria-current={elegido === d.id ? 'true' : undefined} onClick={() => onAbrir(d)}>
          Ver la comida diferente{d.descripcion ? `: «${d.descripcion}»` : ''}
        </button>
      ))}
    </li>
  );
}

/** La cantidad aproximada de una comida diferente, si la línea de tiempo la trae. */
const aproximada = (r: RegistroDeUnaFila): string | null => r.entrada?.details.find((d) => d.label === 'Cantidad aproximada')?.value ?? null;

// ─── El detalle de un registro ──────────────────────────────────────────────────────────────────────────────

function DetalleDelRegistro({
  fila,
  registro,
  ingesta,
  token,
  sesionPerdida,
  onCambio,
}: {
  fila: FilaDeRegistro;
  registro: RegistroDeUnaFila;
  /** La ingesta del contexto de revisión: trae las estimaciones del profesional, que el registro leído aparte no trae. */
  ingesta: Ingesta | null;
  token: string;
  sesionPerdida: (r: Resultado<unknown>) => boolean;
  onCambio: () => void;
}) {
  const rasgos = registro.entrada ? rasgosDeLaFila({ ...fila, registros: [registro] }) : registro.clase === 'COMIDA_DIFERENTE' ? (['COMIDA_DIFERENTE'] as const) : [];
  return (
    <>
      {rasgos.length > 0 || registro.clase === 'COMIDA_DIFERENTE' ? (
        <p className="datos-del-hecho__rasgos">
          {registro.clase === 'COMIDA_DIFERENTE' ? <span className="etiqueta-de-dato">{COPY_NUTRICION.fueraDelPlan}</span> : null}
          {rasgos
            .filter((r) => r !== 'COMIDA_DIFERENTE')
            .map((r) => (
              <Rasgo key={r} rasgo={r}>
                {NOMBRE_DEL_RASGO[r]}
              </Rasgo>
            ))}
        </p>
      ) : null}
      {/* El registro, tal como lo hizo la persona: leído por su propia operación, que vuelve a decidir con el PDP. */}
      <DetalleDeRegistroDeComida registroId={registro.id} token={token} sesionPerdida={sesionPerdida} />
      {registro.clase === 'COMIDA_DIFERENTE' && ingesta ? <EstimacionDelProfesional ingesta={ingesta} onCambio={onCambio} /> : null}
    </>
  );
}

/**
 * La estimación del profesional sobre una comida diferente (NUT-12). La descripción original no se toca: la estimación
 * se agrega, y cada una queda en la historia.
 */
function EstimacionDelProfesional({ ingesta, onCambio }: { ingesta: Ingesta; onCambio: () => void }) {
  const { token, sesionPerdida, accesoRetirado } = useNutricion();
  const intento = useClaveDeIntento();
  const [abierto, setAbierto] = useState(false);
  const [descripcion, setDescripcion] = useState('');
  const [gramos, setGramos] = useState('');
  const [alimento, setAlimento] = useState<ElementoDeCatalogo | null>(null);
  const [busqueda, setBusqueda] = useState('');
  useCambiosSinGuardar(abierto && (descripcion.trim() !== '' || gramos.trim() !== '' || alimento !== null), 'la estimación de una comida');
  const [opciones, setOpciones] = useState<ElementoEncontrado[]>([]);
  /** El mismo error que se avisa arriba se marca en su campo (B10-10:164-165; DL-091 punto 3). */
  const [errores, setErrores] = useState<{ descripcion?: string; gramos?: string }>({});
  const [fallo, setFallo] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const ultima = ingesta.corrections[ingesta.corrections.length - 1];
  const efectiva = ingesta.effectiveView.kind === 'CORRECTED' ? ingesta.corrections.find((c) => c.correctionId === (ingesta.effectiveView as { correctionId: string }).correctionId) : null;

  async function buscar() {
    const r = await api.buscarEnCatalogo(token, busqueda.trim());
    if (sesionPerdida(r)) return;
    setOpciones(r.ok ? r.datos.data : []);
  }

  async function enviar() {
    const problemas: { descripcion?: string; gramos?: string } = {};
    if (!descripcion.trim()) problemas.descripcion = 'Describí lo que estimás.';
    // `leerNumero` acepta coma o punto y devuelve `null` si no es un número (DL-091 punto 4).
    const g = gramos.trim() === '' ? null : leerNumero(gramos);
    if (gramos.trim() !== '' && g === null) problemas.gramos = motivoDeNumeroIlegible(gramos);
    else if (g !== null && !(g > 0)) problemas.gramos = 'La cantidad tiene que ser mayor que cero.';
    setErrores(problemas);
    if (problemas.descripcion || problemas.gramos) return setFallo(null);
    setEnviando(true);
    setFallo(null);
    const r = await api.corregirIngesta(
      token,
      ingesta.executionId,
      {
        reason: 'STRUCTURE_FREE_DESCRIPTION',
        structuredEstimate: { items: [{ catalogItemId: alimento?.catalogItemId ?? null, description: descripcion.trim(), quantity: g === null ? null : { value: g, unit: 'g' } }] },
        estimationStatement: 'Estimación profesional a partir del registro descriptivo.',
      },
      intento.actual(),
    );
    intento.registrar(r);
    setEnviando(false);
    // Una escritura denegada retira el contenido de la pestaña entera (B10-06:1145-1148).
    if (sesionPerdida(r) || accesoRetirado(r)) return;
    if (!r.ok) return setFallo(mensajeDeFallo(r));
    setAbierto(false);
    setDescripcion('');
    setGramos('');
    setAlimento(null);
    setOpciones([]);
    onCambio();
  }

  return (
    <div className="estimacion-del-profesional">
      <p className="lista__titulo">{COPY_NUTRICION.estimacionProfesional}</p>
      {/* La porción que describió la persona ya está arriba, en su registro («Cantidad aproximada»): no se repite. */}
      {efectiva ? (
        <p>
          {efectiva.structuredEstimate.items.map((i) => `${i.description}${i.quantity ? ` · ${cantidad(i.quantity.value, ETIQUETA_DE_UNIDAD[i.quantity.unit])}` : ''}`).join('; ')}{' '}
          <span className="nota">
            ({efectiva.author.displayName}, {fecha(efectiva.recordedAt)}
            {ingesta.corrections.length > 1 ? `; ${ingesta.corrections.length} estimaciones en la historia` : ''})
          </span>
        </p>
      ) : (
        <p className="nota">Una descripción y una foto no alcanzan para calcular calorías ni macros. Podés sumar tu estimación: el registro original queda como está.</p>
      )}
      {ultima && !efectiva ? <p className="nota">La historia de estimaciones no se puede resolver.</p> : null}
      {abierto ? (
        <fieldset className="grupo">
          <legend>{COPY_NUTRICION.agregarEstimacion}</legend>
          <Campo id={`est-${ingesta.executionId}-desc`} etiqueta="Qué estimás" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} maxLength={200} error={errores.descripcion ?? null} />
          <Campo id={`est-${ingesta.executionId}-g`} etiqueta="Cantidad estimada en gramos (opcional)" inputMode="decimal" value={gramos} onChange={(e) => setGramos(e.target.value)} error={errores.gramos ?? null} />
          <div className="fila-de-dato">
            <Campo id={`est-${ingesta.executionId}-buscar`} etiqueta="Alimento del catálogo (opcional)" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
            <button type="button" className="boton boton--secundario" onClick={() => void buscar()}>
              Buscar
            </button>
          </div>
          {alimento ? <p>Alimento elegido: {alimento.name}</p> : null}
          {opciones.length > 0 && !alimento ? (
            <ul className="lista">
              {opciones.slice(0, 6).map((o) => (
                <li key={o.catalogItemId}>
                  <button type="button" className="boton boton--enlace" onClick={() => setAlimento(o)}>
                    {o.name}
                    {/* DL-141: si apareció por un nombre alternativo, cuál: «Palta (aguacate)». */}
                    {o.matchedAlternativeName ? <span className="nombre-alternativo"> ({nombreAlternativoComoAclaracion(o.matchedAlternativeName)})</span> : null}
                  </button>
                  {/* DL-141 D-6: de dónde sale, breve; el detalle, en la pista del origen. */}
                  <span className="nota">
                    {' · '}
                    <OrigenEnElCatalogo item={o} />
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
          {fallo ? (
            <Aviso tipo="error">
              <p>{fallo}</p>
            </Aviso>
          ) : null}
          <div className="acciones">
            <button type="button" className="boton boton--primario" onClick={() => void enviar()} disabled={enviando}>
              {enviando ? 'Guardando…' : COPY_NUTRICION.agregarEstimacion}
            </button>
            <button type="button" className="boton boton--secundario" onClick={() => setAbierto(false)} disabled={enviando}>
              Cancelar
            </button>
          </div>
        </fieldset>
      ) : (
        <button type="button" className="boton boton--secundario" onClick={() => setAbierto(true)}>
          <Icono nombre="mas" tamano={18} />
          {COPY_NUTRICION.agregarEstimacion}
        </button>
      )}
    </div>
  );
}
