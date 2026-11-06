'use client';

/**
 * La carga de una toma: «Toma en preparación» (B10-07; API-ANT-07/08/09/10/11). Es donde se captura, y donde el legajo
 * pone la frontera:
 * - lo que se guarda acá **no es historia**: no alimenta la evolución ni figura como última toma registrada
 *   (REG-06-215). La pantalla lo dice, no lo deja implícito;
 * - **registrar es un acto aparte de guardar** (REG-06-214 inciso 4), con su propia confirmación que explica que
 *   después no se edita;
 * - cada medición declara protocolo, unidad de origen y cómo se obtuvo: medido, reportado o importado. La **clase**
 *   del dato se deriva del origen, no la elige quien carga (04:1090).
 *
 * Qué se mide lo declara el protocolo elegido (B10-07 §18). La pantalla sigue la maqueta 23 (WP-ESCRITORIO-AREAS, parte
 * 9): arriba, el título con la cuenta, el estado del guardado y los dos actos; a la izquierda, **la figura de Dirección
 * con cada campo unido a su sitio** (`figura-de-la-carga.tsx`), de a una familia —perímetros o pliegues— y con la figura
 * de hombre o de mujer, que no son un dato y no se guardan; a la derecha, los datos de la toma y lo que el protocolo
 * declara sin sitio en la figura (masa y estatura, diámetros…), más lo de fuera del protocolo, como antes.
 * Los contratos de WP-05 no cambian: la pantalla cambia dónde se escribe el valor, no qué se manda.
 */
import {
  COPY_ANTROPOMETRIA,
  COPY_GUARDADO,
  ETIQUETA_DE_FAMILIA,
  ETIQUETA_DE_ORIGEN,
  leerNumero,
  metricasDelProtocolo,
  metricasPorFamilia,
  motivoDeNumeroIlegible,
  repartirEnElProtocolo,
  type Especificacion,
  type MedicionEscrita,
  type MetricaDelProtocolo,
  type SexoDeLaLamina,
} from '@be/domain';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AvisoFlotante } from '../../../../components/ayuda';
import { DialogoDeConfirmacion } from '../../../../components/dialogo';
import { EnPartes, conNumerosPegados } from '../../../../components/en-partes';
import { Aviso, Campo } from '../../../../components/formulario';
import { Icono } from '../../../../components/icono';
import { api, type Resultado } from '../../../../lib/api';
import { fecha, numeroEnCampo } from '../../../../lib/formato';
import { mensajeDeFallo, useClaveDeIntento } from '../../../../lib/intento';
import { useCambiosSinGuardar } from '../marco-del-area';
import { EstadoDeLectura, useAntropometria } from './antropometria';
import { clavesConSitio, clavesDeLaFamilia, type FamiliaDeLaCarga } from './composicion-de-la-carga';
import { CampoDeMedicion, FiguraDeLaCarga, idDelValor, type CampoDeLaCarga } from './figura-de-la-carga';
import { esFechaFutura, FECHA_DE_TOMA_FUTURA, motivoDelRechazo } from './rechazos-de-antropometria';

/** El aviso de la toma. Un error de validación lista los campos que corregir, con un enlace a cada uno. */
type AvisoDeLaToma = { tipo: 'exito' | 'error' | 'info'; texto: string; campos?: readonly { id: string; texto: string }[]; vez?: number };

type Borrador = {
  evaluationId: string;
  version: string;
  context: string | null;
  recordedAt: string;
  /** El momento de la toma: lo trae la toma aunque todavía no tenga mediciones. */
  occurredAt?: string;
  measurements: {
    measurementId: string;
    metric: string;
    magnitude: { value: number; unit: string };
    dataClass: string;
    origin: string;
    occurredAt: string;
    recordedAt: string;
    protocol: { protocolVersionId: string };
  }[];
};

/**
 * Cuándo se guardó el borrador por última vez, con lo que dice la API y nunca con la hora de la pantalla. Cada guardado
 * reescribe las mediciones (API-ANT-10), así que la registrada más recientemente es la del último guardado. Sin
 * mediciones, lo único que se sabe es cuándo se abrió. Una hora inventada sería presentar como guardado lo que no
 * consta (B10-07 §8.1).
 */
function ultimoGuardado(b: Borrador): { guardado: boolean; momento: string } {
  const masReciente = b.measurements.map((m) => m.recordedAt).sort().at(-1);
  return masReciente ? { guardado: true, momento: masReciente } : { guardado: false, momento: b.recordedAt };
}

/** Una medición que el protocolo no declara: se carga libre, como en WP-05. */
interface FilaLibre {
  readonly clave: string;
  metric: string;
  value: string;
  unit: string;
}

/** El valor escrito para una métrica del protocolo, tal como lo lee una persona, y su unidad de origen. */
interface Escrito {
  valor: string;
  unidad: string;
}

/** ISO → `YYYY-MM-DDTHH:mm` en hora local, que es lo que entiende `datetime-local`. */
const paraElCampo = (iso: string): string => {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

const filaNueva = (): FilaLibre => ({ clave: `m-${Math.random().toString(36).slice(2, 9)}`, metric: '', value: '', unit: '' });

/** Una medición escrita para repartir entre los campos y lo de fuera del protocolo; `fila` es la clave de su fila. */
type MedicionConFila = MedicionEscrita & { readonly fila: string };
const deLaFila = (f: FilaLibre): MedicionConFila => ({ fila: f.clave, metrica: f.metric, valor: f.value, unidad: f.unit });
const aLaFila = (m: MedicionConFila): FilaLibre => ({ clave: m.fila, metric: m.metrica, value: m.valor, unit: m.unidad });
const aLosCampos = (enSuCampo: Map<string, MedicionConFila>): Record<string, Escrito> =>
  Object.fromEntries([...enSuCampo].map(([clave, m]) => [clave, { valor: m.valor, unidad: m.unidad.trim() }]));

/** Lo que la pantalla tiene escrito, para saber si hay cambios sin guardar: se compara con lo que dice el borrador. */
interface LoEscrito {
  readonly momento: string;
  readonly protocolo: string;
  readonly origen: string;
  readonly contexto: string;
  readonly escritos: Readonly<Record<string, Escrito>>;
  readonly libres: readonly FilaLibre[];
}
const firma = (x: LoEscrito): string =>
  JSON.stringify([
    x.momento,
    x.protocolo,
    x.origen,
    x.contexto.trim(),
    Object.entries(x.escritos)
      .filter(([, e]) => e.valor.trim() !== '')
      .map(([clave, e]) => [clave, e.valor.trim(), e.unidad])
      .sort(),
    x.libres.map((f) => [f.metric.trim(), f.value.trim(), f.unit.trim()]),
  ]);

/** @param vuelta el enlace a «Tomas»: mientras se lee va arriba; con la toma a la vista, en su cabecera (maqueta 23). */
export function VistaDePreparacion({ vuelta }: { vuelta: ReactNode }) {
  const { token, asesoradoId, sesionPerdida, irA, avisarEnTomas } = useAntropometria();
  const [r, setR] = useState<Resultado<{ borrador: Borrador | null; especificaciones: Especificacion[] }> | null>(null);
  const [aviso, setAviso] = useState<AvisoDeLaToma | null>(null);

  const cargar = useCallback(async () => {
    setR(null);
    const [borradores, especificaciones] = await Promise.all([
      api.listarBorradoresAntropometricos(token, asesoradoId),
      api.listarEspecificaciones(token, { kind: 'PROTOCOL' }),
    ]);
    if (sesionPerdida(borradores) || sesionPerdida(especificaciones)) return;
    if (!borradores.ok) return setR(borradores as Resultado<never>);
    if (!especificaciones.ok) return setR(especificaciones as Resultado<never>);
    const resumen = borradores.datos.data[0];
    if (!resumen) return setR({ ok: true, datos: { borrador: null, especificaciones: especificaciones.datos.data } });
    // El borrador se lee en su propia colección (API-ANT-09): la de las registradas no lo devuelve (09v16:1718).
    const completo = await api.consultarBorradorAntropometrico(token, resumen.evaluationId);
    if (sesionPerdida(completo)) return;
    if (!completo.ok) return setR(completo as Resultado<never>);
    setR({ ok: true, datos: { borrador: completo.datos.data as Borrador, especificaciones: especificaciones.datos.data } });
  }, [token, asesoradoId, sesionPerdida]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  return (
    <>
      {r?.ok ? null : <p className="vuelta-a-la-seccion">{vuelta}</p>}
      <EstadoDeLectura r={r} onReintentar={cargar}>
      {r?.ok ? (
        <Preparacion
          vuelta={vuelta}
          borrador={r.datos.borrador}
          especificaciones={r.datos.especificaciones}
          aviso={aviso}
          onAviso={setAviso}
          onCambio={cargar}
          onRegistrada={(evaluationId) => {
            // El aviso se dice en «Tomas», adonde se vuelve con la toma recién registrada abierta: dicho acá, esta vista se
            // desmontaba antes de que llegara a verse.
            avisarEnTomas(COPY_ANTROPOMETRIA.registroHecho);
            irA('evaluaciones', evaluationId);
          }}
        />
      ) : null}
      </EstadoDeLectura>
    </>
  );
}

function Preparacion({
  vuelta,
  borrador,
  especificaciones,
  aviso,
  onAviso,
  onCambio,
  onRegistrada,
}: {
  vuelta: ReactNode;
  borrador: Borrador | null;
  especificaciones: Especificacion[];
  aviso: AvisoDeLaToma | null;
  onAviso: (a: AvisoDeLaToma | null) => void;
  onCambio: () => Promise<void>;
  onRegistrada: (evaluationId: string) => void;
}) {
  const { token, asesoradoId, sesionPerdida, accesoRetirado, parametros, ir } = useAntropometria();
  const intento = useClaveDeIntento();
  const protocoloPorDefecto = especificaciones[0]?.versionId ?? '';
  const [escritos, setEscritos] = useState<Record<string, Escrito>>({});
  const [libres, setLibres] = useState<FilaLibre[]>([]);
  const [contexto, setContexto] = useState('');
  /**
   * El momento de la toma y la especificación son de la **toma**: una evaluación es una toma, con su protocolo y su
   * origen (09v11 §6). Son de la toma, no del guardado: si cada «Guardar» los reescribiera, la serie se correría sola y
   * la evolución mostraría un día que no fue (REG-06-152).
   */
  const [momento, setMomento] = useState(paraElCampo(new Date().toISOString()));
  const [protocolo, setProtocolo] = useState('');
  const [origen, setOrigen] = useState<'DIRECT_CAPTURE' | 'SELF_REPORTED'>('DIRECT_CAPTURE');
  const [enviando, setEnviando] = useState(false);
  // El último intento de guardar falló: lo escrito sigue en pantalla, y la línea de estado lo dice.
  const [falloAlGuardar, setFalloAlGuardar] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [activa, setActiva] = useState<string | null>(null);
  const [errores, setErrores] = useState<Record<string, string>>({});
  /** Lo que dice el borrador leído, en la forma de lo escrito: con eso se sabe si hay cambios sin guardar. */
  const [guardadoComo, setGuardadoComo] = useState<string | null>(null);
  const momentoActual = useRef(momento);
  momentoActual.current = momento;

  /** Las métricas que declara el protocolo elegido (B10-07 §18): lo que la figura y la lista ofrecen. */
  const metricas = useMemo(() => metricasDelProtocolo(especificaciones.find((e) => e.versionId === protocolo)?.content), [especificaciones, protocolo]);

  useEffect(() => {
    setProtocolo((p) => p || protocoloPorDefecto);
    if (!borrador) {
      setEscritos({});
      setLibres([]);
      setGuardadoComo(null);
      return;
    }
    const primera = borrador.measurements[0];
    const protocoloDelBorrador = primera?.protocol?.protocolVersionId ?? protocoloPorDefecto;
    // El momento es el de la toma, también sin mediciones (antes se perdía: se reconstruía desde la primera medición).
    const momentoDelBorrador = primera ? paraElCampo(primera.occurredAt) : borrador.occurredAt ? paraElCampo(borrador.occurredAt) : momentoActual.current;
    const origenDelBorrador = primera?.origin === 'SELF_REPORTED' ? 'SELF_REPORTED' : 'DIRECT_CAPTURE';
    // Lo que el protocolo del borrador declara, en una unidad que admite, va a su campo; lo demás, fuera del protocolo.
    // El valor se muestra como lo lee una persona, con coma decimal; `leerNumero` lo vuelve a aceptar (DL-091 punto 4).
    const { enSuCampo, fuera } = repartirEnElProtocolo(
      borrador.measurements.map((m): MedicionConFila => ({ fila: m.measurementId, metrica: m.metric, valor: numeroEnCampo(m.magnitude.value), unidad: m.magnitude.unit })),
      metricasDelProtocolo(especificaciones.find((e) => e.versionId === protocoloDelBorrador)?.content),
    );
    const enLosCampos = aLosCampos(enSuCampo);
    const deFuera = fuera.map(aLaFila);
    setContexto(borrador.context ?? '');
    setMomento(momentoDelBorrador);
    setProtocolo(protocoloDelBorrador);
    if (primera) setOrigen(origenDelBorrador);
    setEscritos(enLosCampos);
    setLibres(deFuera);
    setGuardadoComo(
      firma({ momento: momentoDelBorrador, protocolo: protocoloDelBorrador, origen: primera ? origenDelBorrador : 'DIRECT_CAPTURE', contexto: borrador.context ?? '', escritos: enLosCampos, libres: deFuera }),
    );
  }, [borrador, protocoloPorDefecto, especificaciones]);

  const escritoDe = useCallback((m: MetricaDelProtocolo): Escrito => escritos[m.clave] ?? { valor: '', unidad: m.unidades[0]! }, [escritos]);
  const conDato = new Set(metricas.filter((m) => leerNumero(escritoDe(m).valor) !== null).map((m) => m.clave));
  const libresConValor = libres.filter((f) => f.metric.trim() && leerNumero(f.value) !== null).length;
  const algoEscrito = Object.values(escritos).some((e) => e.valor.trim() !== '') || libres.length > 0 || contexto.trim() !== '';
  const hayCambios = borrador ? guardadoComo !== null && firma({ momento, protocolo, origen, contexto, escritos, libres }) !== guardadoComo : algoEscrito;
  useCambiosSinGuardar(hayCambios, 'la toma en preparación');

  // ── La figura: qué familia y qué figura se miran (en la dirección; no son un dato y no se guardan) ─────────────────
  const claves = useMemo(() => metricas.map((m) => m.clave), [metricas]);
  const sexo: SexoDeLaLamina = parametros.get('figura') === 'mujer' ? 'MUJER' : 'HOMBRE';
  const familias = (['PERIMETROS', 'PLIEGUES'] as const).filter((f) => clavesDeLaFamilia(sexo, f, claves).length > 0);
  const pedida: FamiliaDeLaCarga | null = parametros.get('medidas') === 'pliegues' ? 'PLIEGUES' : parametros.get('medidas') === 'perimetros' ? 'PERIMETROS' : null;
  const familia: FamiliaDeLaCarga | null = pedida && familias.includes(pedida) ? pedida : (familias[0] ?? null);
  const conSitio = clavesConSitio(sexo);
  const fueraDeLaFigura = metricas.filter((m) => !conSitio.has(m.clave));
  const cuentaDe = (f: FamiliaDeLaCarga) => {
    const deLaFamilia = clavesDeLaFamilia(sexo, f, claves);
    return { cargadas: deLaFamilia.filter((c) => conDato.has(c)).length, total: deLaFamilia.length };
  };
  const campos = new Map<string, CampoDeLaCarga>(
    metricas.map((m) => [m.clave, { metrica: m, valor: escritoDe(m).valor, unidad: escritoDe(m).unidad, conDato: conDato.has(m.clave), error: errores[idDelValor(m.clave)] ?? null }]),
  );

  /**
   * Cambiar de protocolo no pierde nada, en ninguna dirección (`repartirEnElProtocolo`): lo que el nuevo no declara —o
   * declara en otra unidad— pasa a las mediciones fuera del protocolo, y una medición cargada fuera del protocolo que
   * el nuevo declara en esa unidad pasa a su campo. Lo que ya estaba en un campo va primero: si el nuevo lo declara,
   * conserva su campo. La unidad nunca se convierte (B10-07 §17).
   */
  function cambiarProtocolo(nuevo: string) {
    const deLosCampos = Object.entries(escritos)
      .filter(([, e]) => e.valor.trim() !== '')
      .map(([clave, e]): MedicionConFila => ({ fila: filaNueva().clave, metrica: clave, valor: e.valor, unidad: e.unidad }));
    const { enSuCampo, fuera } = repartirEnElProtocolo(
      [...deLosCampos, ...libres.map(deLaFila)],
      metricasDelProtocolo(especificaciones.find((e) => e.versionId === nuevo)?.content),
    );
    // Las filas que ya estaban fuera del protocolo conservan su lugar; las que salen de un campo se suman al final.
    const salen = new Set(deLosCampos.map((m) => m.fila));
    setEscritos(aLosCampos(enSuCampo));
    setLibres([...fuera.filter((m) => !salen.has(m.fila)), ...fuera.filter((m) => salen.has(m.fila))].map(aLaFila));
    setErrores({});
    setProtocolo(nuevo);
  }

  /**
   * Lo que le falta a cada medición, por campo: guardar con una a medias las perdería en silencio. El mismo aviso que
   * se da arriba se marca en el campo que falta (B10-10:164-165; DL-091 punto 3).
   */
  function revisar(): Record<string, string> {
    const problemas: Record<string, string> = {};
    // Una fecha futura la rechaza la API; dicha acá, va a su campo antes de escribir nada (antes decía «El servicio no
    // está disponible»).
    if (esFechaFutura(momento)) problemas['ant-momento'] = FECHA_DE_TOMA_FUTURA;
    for (const m of metricas) {
      const texto = escritoDe(m).valor;
      // `leerNumero` acepta coma o punto y devuelve `null` si no es un número (DL-091 punto 4).
      if (texto.trim() !== '' && leerNumero(texto) === null) problemas[idDelValor(m.clave)] = motivoDeNumeroIlegible(texto);
    }
    libres.forEach((f, i) => {
      if (!f.metric.trim()) problemas[`ant-metrica-${i}`] = 'Falta la métrica.';
      if (!f.value.trim()) problemas[`ant-valor-libre-${i}`] = 'Falta el valor.';
      else if (leerNumero(f.value) === null) problemas[`ant-valor-libre-${i}`] = motivoDeNumeroIlegible(f.value);
      if (!f.unit.trim()) problemas[`ant-unidad-${i}`] = 'Falta la unidad.';
    });
    setErrores(problemas);
    return problemas;
  }

  /** Los campos con algo para corregir, en el orden del protocolo, con su nombre y qué les pasa. */
  function camposDelAviso(problemas: Record<string, string>): { id: string; texto: string }[] {
    const deLosCampos = metricasPorFamilia(metricas)
      .flatMap((g) => g.metricas)
      .filter((m) => problemas[idDelValor(m.clave)])
      .map((m) => ({ id: idDelValor(m.clave), texto: `${m.nombre}: ${problemas[idDelValor(m.clave)]}` }));
    const partes = [
      ['ant-metrica', COPY_ANTROPOMETRIA.metrica],
      ['ant-valor-libre', COPY_ANTROPOMETRIA.valor],
      ['ant-unidad', COPY_ANTROPOMETRIA.unidad],
    ] as const;
    const deLasFilas = libres.flatMap((_, i) =>
      partes
        .filter(([prefijo]) => problemas[`${prefijo}-${i}`])
        .map(([prefijo, rotulo]) => ({ id: `${prefijo}-${i}`, texto: `Fuera del protocolo, fila ${i + 1} (${rotulo.toLocaleLowerCase('es-AR')}): ${problemas[`${prefijo}-${i}`]}` })),
    );
    const delMomento = problemas['ant-momento'] ? [{ id: 'ant-momento', texto: `${COPY_ANTROPOMETRIA.momentoDeLaToma}: ${problemas['ant-momento']}` }] : [];
    return [...delMomento, ...deLosCampos, ...deLasFilas];
  }

  const contenido = () => ({
    occurredAt: new Date(momento).toISOString(),
    specificationVersionId: protocolo,
    source: { type: origen },
    directMeasurements: [
      ...metricas
        .filter((m) => leerNumero(escritoDe(m).valor) !== null)
        .map((m) => ({ metricCode: m.clave, value: leerNumero(escritoDe(m).valor)!, unit: escritoDe(m).unidad })),
      ...libres
        .filter((f) => f.metric.trim() && leerNumero(f.value) !== null && f.unit.trim())
        .map((f) => ({ metricCode: f.metric.trim(), value: leerNumero(f.value)!, unit: f.unit.trim() })),
    ],
    professionalNotes: contexto.trim() || null,
  });

  /**
   * Guarda el contenido tal como está en la pantalla y devuelve el borrador que la API confirmó, o `null` si no se
   * pudo guardar (ya avisado). La usan «Guardar» y «Registrar toma» por igual: registrar sin pasar por acá registraría
   * lo último que quedó guardado en el servidor, no lo que la pantalla muestra —una sorpresa que REG-06-214 inciso 4 no
   * admite. Guardar y registrar siguen siendo dos actos y dos llamadas separadas; esto solo asegura que el segundo parta
   * siempre del primero.
   */
  async function guardarContenido(): Promise<Borrador | null> {
    const problemas = revisar();
    if (Object.keys(problemas).length > 0) {
      avisar({ tipo: 'error', texto: COPY_ANTROPOMETRIA.revisarAntesDeGuardar, campos: camposDelAviso(problemas) });
      return null;
    }
    const res = borrador
      ? await api.guardarBorradorAntropometrico(token, borrador.evaluationId, { expectedVersion: borrador.version, ...contenido() })
      : await api.crearBorradorAntropometrico(token, asesoradoId, contenido(), intento.actual());
    if (!borrador) intento.registrar(res);
    // Una escritura denegada retira el contenido de la pestaña entera (B10-06:1145-1148).
    if (sesionPerdida(res) || accesoRetirado(res)) return null;
    if (!res.ok) {
      setFalloAlGuardar(true);
      // Otra pestaña u otro equipo guardó esta toma antes: no se pisa; «Actualizar» trae lo guardado.
      if (res.tipo === 'API' && res.codigo === 'VERSION_CONFLICT') avisar({ tipo: 'error', texto: COPY_GUARDADO.conflicto });
      else avisarDelRechazo(res);
      return null;
    }
    setFalloAlGuardar(false);
    return res.datos.data as Borrador;
  }

  async function guardar() {
    setEnviando(true);
    onAviso(null);
    const fresco = await guardarContenido();
    setEnviando(false);
    if (!fresco) return;
    avisar({ tipo: 'exito', texto: COPY_ANTROPOMETRIA.guardado });
    await onCambio();
  }

  async function registrar() {
    if (!borrador) return;
    setEnviando(true);
    onAviso(null);
    const fresco = await guardarContenido();
    if (!fresco) {
      setEnviando(false);
      setConfirmando(false);
      return;
    }
    // Lo que había en pantalla pudo vaciarse al guardar (la última fila libre, quitada; el último campo, borrado).
    if (fresco.measurements.length === 0) {
      setEnviando(false);
      setConfirmando(false);
      avisar({ tipo: 'error', texto: COPY_ANTROPOMETRIA.sinContenidoRegistrable });
      await onCambio();
      return;
    }
    const res = await api.registrarEvaluacionAntropometrica(token, fresco.evaluationId, fresco.version, intento.actual());
    intento.registrar(res);
    setEnviando(false);
    setConfirmando(false);
    if (sesionPerdida(res) || accesoRetirado(res)) return;
    if (!res.ok) return avisarDelRechazo(res);
    onRegistrada(res.datos.data.evaluationId);
  }

  /**
   * Lleva a un campo y lo deja en el centro de la ventana. Si el campo es de la otra familia de la figura (el aviso de lo
   * que hay que corregir lista todos), primero se elige esa familia y el foco llega cuando el campo ya está.
   */
  const [campoPendiente, setCampoPendiente] = useState<string | null>(null);
  useEffect(() => {
    if (!campoPendiente) return;
    const campo = document.getElementById(campoPendiente);
    if (!campo) return;
    (campo.closest('.medicion-de-la-carga, .campo') ?? campo).scrollIntoView({ block: 'center', behavior: 'smooth' });
    campo.focus({ preventScroll: true });
    setCampoPendiente(null);
  });
  function irAlCampo(id: string) {
    const clave = metricas.find((m) => idDelValor(m.clave) === id)?.clave;
    const suFamilia = clave ? (['PERIMETROS', 'PLIEGUES'] as const).find((f) => clavesDeLaFamilia(sexo, f, [clave]).length > 0) : undefined;
    if (suFamilia && suFamilia !== familia) elegirFamilia(suFamilia);
    setCampoPendiente(id);
  }
  const elegirFamilia = (f: FamiliaDeLaCarga) => ir({ medidas: f === 'PLIEGUES' ? 'pliegues' : 'perimetros' });

  // Cada aviso nuevo es otro aviso: vuelve a tomar el foco aunque ya hubiera uno a la vista. Un segundo «Guardar» con
  // algo para corregir no puede quedar mudo, lejos del aviso.
  const vez = useRef(0);
  const avisar = (a: AvisoDeLaToma | null) => onAviso(a ? { ...a, vez: ++vez.current } : null);
  /** Un rechazo de la API: con su motivo si se puede explicar (y su campo, si es la fecha); si no, el mensaje general. */
  function avisarDelRechazo(res: Resultado<unknown>) {
    const motivo = motivoDelRechazo(res);
    if (motivo?.campo === 'momento') {
      setErrores((e) => ({ ...e, 'ant-momento': motivo.texto }));
      return avisar({ tipo: 'error', texto: COPY_ANTROPOMETRIA.revisarAntesDeGuardar, campos: [{ id: 'ant-momento', texto: `${COPY_ANTROPOMETRIA.momentoDeLaToma}: ${motivo.texto}` }] });
    }
    avisar({ tipo: 'error', texto: motivo?.texto ?? mensajeDeFallo(res) });
  }

  const escribir = (clave: string, cambio: Partial<Escrito>) => {
    const m = metricas.find((x) => x.clave === clave);
    if (m) setEscritos((xs) => ({ ...xs, [clave]: { ...(xs[clave] ?? { valor: '', unidad: m.unidades[0]! }), ...cambio } }));
  };
  const ultimo = borrador ? ultimoGuardado(borrador) : null;
  // Los cuatro estados de escritura (bloque 3 del encargo): guardando, no se pudo, pendiente y guardado, con su fecha.
  const estado = enviando
    ? COPY_GUARDADO.guardando
    : falloAlGuardar
      ? COPY_GUARDADO.noSePudo
      : hayCambios
        ? COPY_GUARDADO.pendiente
        : ultimo
          ? ultimo.guardado
            ? `${COPY_ANTROPOMETRIA.guardado} · ${fecha(ultimo.momento)}`
            : `Abierta el ${fecha(ultimo.momento)}`
          : 'Todavía no se guardó.';
  const cargadas = conDato.size;
  const cuenta =
    metricas.length > 0
      ? `${cargadas} de ${metricas.length} ${metricas.length === 1 ? 'medición cargada' : 'mediciones cargadas'}${libresConValor > 0 ? `, y ${libresConValor} fuera del protocolo` : ''}.`
      : `${libresConValor} ${libresConValor === 1 ? 'medición cargada' : 'mediciones cargadas'}.`;
  const sePuedeRegistrar = !!borrador && (borrador.measurements.length > 0 || cargadas + libresConValor > 0);

  return (
    <div className="carga-de-la-toma">
      {aviso && aviso.tipo === 'exito' ? (
        <AvisoFlotante onCerrar={() => onAviso(null)}>
          <p>{aviso.texto}</p>
        </AvisoFlotante>
      ) : null}

      {/* El título y los dos actos, arriba y a la vista mientras se recorre la figura (maqueta 23). */}
      <div className="carga-de-la-toma__cabecera">
        <p className="vuelta-a-la-seccion carga-de-la-toma__vuelta">{vuelta}</p>
        <h2 id="titulo-preparacion">{borrador ? COPY_ANTROPOMETRIA.borradorEnCurso : COPY_ANTROPOMETRIA.nuevaEvaluacion}</h2>
        {borrador ? (
          <span className="etiqueta-de-dato">
            <Icono nombre="borrador" tamano={18} />
            Borrador
          </span>
        ) : null}
        <p className="carga-de-la-toma__cuenta">{conNumerosPegados(`${cuenta} No es historia hasta que la registres.`)}</p>
        <div className="carga-de-la-toma__acciones">
          <p className={`carga-de-la-toma__estado${hayCambios ? ' carga-de-la-toma__estado--cambios' : ''}${falloAlGuardar && !enviando ? ' carga-de-la-toma__estado--fallo' : ''}`} aria-live="polite">
            {estado}
          </p>
          {borrador ? (
            <button
              type="button"
              className={`boton ${hayCambios ? 'boton--secundario' : 'boton--primario'}`}
              onClick={() => setConfirmando(true)}
              disabled={enviando || !sePuedeRegistrar}
            >
              {COPY_ANTROPOMETRIA.registrarEvaluacion}
            </button>
          ) : null}
          {/* Un solo botón lleno: «Guardar» si hay algo sin guardar (o todavía no hay borrador); si no, «Registrar toma». */}
          <button type="button" className={`boton ${!borrador || hayCambios ? 'boton--primario' : 'boton--secundario'}`} onClick={() => void guardar()} disabled={enviando}>
            {COPY_ANTROPOMETRIA.guardarBorrador}
          </button>
        </div>
      </div>

      {aviso && aviso.tipo !== 'exito' ? (
        <Aviso key={aviso.vez ?? 0} tipo={aviso.tipo} enfocar>
          <p>{aviso.texto}</p>
          {aviso.campos && aviso.campos.length > 0 ? (
            <ul>
              {aviso.campos.map((c) => (
                <li key={c.id}>
                  <a
                    href={`#${c.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      irAlCampo(c.id);
                    }}
                  >
                    {c.texto}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </Aviso>
      ) : null}
      {borrador && borrador.measurements.length === 0 && !algoEscrito ? <p className="nota">{COPY_ANTROPOMETRIA.sinContenidoRegistrable}</p> : null}

      <div className={`carga-de-la-toma__cuerpo${familia ? '' : ' carga-de-la-toma__cuerpo--sin-figura'}`}>
        {familia ? (
          <section className="tarjeta taller-de-la-carga" aria-labelledby="titulo-de-la-figura">
            <div className="taller-de-la-carga__cabecera">
              <h3 id="titulo-de-la-figura" className="taller-de-la-carga__titulo">
                {COPY_ANTROPOMETRIA.medidasDeLaFigura}
              </h3>
              {familias.length > 1 ? (
                <fieldset className="segmentos">
                  <legend className="visualmente-oculto">Qué medidas se ven en la figura</legend>
                  <div className="segmentos__fila">
                    {familias.map((f) => {
                      const { cargadas: n, total } = cuentaDe(f);
                      return (
                        <label key={f} className="segmento">
                          <input type="radio" name="medidas-de-la-figura" checked={familia === f} onChange={() => elegirFamilia(f)} />
                          <Icono nombre={f === 'PLIEGUES' ? 'pliegue' : 'perimetro'} tamano={18} />
                          {f === 'PLIEGUES' ? COPY_ANTROPOMETRIA.plieguesEnLaFigura : COPY_ANTROPOMETRIA.perimetrosEnLaFigura}
                          <span className="segmento__cuenta">
                            {n} de {total}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              ) : (
                <p className="taller-de-la-carga__familia">
                  <Icono nombre={familia === 'PLIEGUES' ? 'pliegue' : 'perimetro'} tamano={18} />
                  {familia === 'PLIEGUES' ? COPY_ANTROPOMETRIA.plieguesEnLaFigura : COPY_ANTROPOMETRIA.perimetrosEnLaFigura}{' '}
                  <span className="segmento__cuenta">
                    {cuentaDe(familia).cargadas} de {cuentaDe(familia).total}
                  </span>
                </p>
              )}
              <fieldset className="segmentos taller-de-la-carga__figura">
                <legend>{COPY_ANTROPOMETRIA.figura}</legend>
                <div className="segmentos__fila">
                  {(['HOMBRE', 'MUJER'] as const).map((s) => (
                    <label key={s} className="segmento">
                      <input type="radio" name="figura-de-la-carga" checked={sexo === s} onChange={() => ir({ figura: s === 'MUJER' ? 'mujer' : null })} />
                      {s === 'MUJER' ? COPY_ANTROPOMETRIA.figuraMujer : COPY_ANTROPOMETRIA.figuraHombre}
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
            <FiguraDeLaCarga sexo={sexo} familia={familia} claves={claves} campos={campos} activa={activa} onActiva={setActiva} onEscribir={escribir} />
          </section>
        ) : null}

        <div className="carga-de-la-toma__datos">
          {/* El momento, el protocolo y el origen son de la toma entera: una evaluación es una toma (09v11 §6). */}
          <section className="tarjeta datos-de-la-carga" aria-labelledby="titulo-datos-de-la-toma">
            <h3 id="titulo-datos-de-la-toma">Datos de la toma</h3>
            <div className="datos-de-la-carga__campos">
              <Campo
                id="ant-momento"
                etiqueta={COPY_ANTROPOMETRIA.momentoDeLaToma}
                type="datetime-local"
                value={momento}
                max={paraElCampo(new Date().toISOString())}
                onChange={(e) => setMomento(e.target.value)}
                error={errores['ant-momento'] ?? null}
              />
              <div className="campo">
                <label htmlFor="ant-origen">{COPY_ANTROPOMETRIA.origenDelDato}</label>
                <select id="ant-origen" value={origen} onChange={(e) => setOrigen(e.target.value as 'DIRECT_CAPTURE' | 'SELF_REPORTED')}>
                  <option value="DIRECT_CAPTURE">{ETIQUETA_DE_ORIGEN.DIRECT_CAPTURE}</option>
                  <option value="SELF_REPORTED">{ETIQUETA_DE_ORIGEN.SELF_REPORTED}</option>
                </select>
              </div>
              <div className="campo">
                <label htmlFor="ant-protocolo">{COPY_ANTROPOMETRIA.protocolo}</label>
                <select id="ant-protocolo" value={protocolo} onChange={(e) => cambiarProtocolo(e.target.value)}>
                  {especificaciones.map((e) => (
                    <option key={e.versionId} value={e.versionId}>
                      {e.name}
                    </option>
                  ))}
                </select>
              </div>
              <Campo id="ant-contexto" etiqueta="Contexto (opcional)" value={contexto} onChange={(e) => setContexto(e.target.value)} maxLength={2000} />
            </div>
          </section>

          <section className="tarjeta datos-de-la-carga" aria-labelledby="titulo-fuera-de-la-figura">
            <h3 id="titulo-fuera-de-la-figura">{familia ? 'Fuera de la figura' : 'Mediciones'}</h3>
            {metricasPorFamilia(fueraDeLaFigura).map((g) => {
              const unidades = new Set(g.metricas.map((m) => m.unidades.join('|')));
              const unidad = unidades.size === 1 && g.metricas[0]!.unidades.length === 1 ? g.metricas[0]!.unidades[0] : null;
              const cargadasDelGrupo = g.metricas.filter((m) => conDato.has(m.clave)).length;
              return (
                <fieldset key={g.familia} className="familia-de-la-carga">
                  <legend>
                    <EnPartes texto={[ETIQUETA_DE_FAMILIA[g.familia], unidad, `${cargadasDelGrupo} de ${g.metricas.length}`].filter(Boolean).join(' · ')} />
                  </legend>
                  {g.metricas.map((m) => (
                    <CampoDeMedicion key={m.clave} campo={campos.get(m.clave)!} activa={activa === m.clave} onActiva={setActiva} onEscribir={escribir} />
                  ))}
                </fieldset>
              );
            })}
            {libres.map((f, i) => (
              <div key={f.clave} className="medicion-libre">
                <p className="medicion-libre__titulo">Fuera del protocolo, fila {i + 1}</p>
                <Campo
                  id={`ant-metrica-${i}`}
                  etiqueta={COPY_ANTROPOMETRIA.metrica}
                  value={f.metric}
                  onChange={(e) => setLibres((xs) => xs.map((x) => (x.clave === f.clave ? { ...x, metric: e.target.value } : x)))}
                  maxLength={60}
                  error={errores[`ant-metrica-${i}`] ?? null}
                />
                <Campo
                  id={`ant-valor-libre-${i}`}
                  etiqueta={COPY_ANTROPOMETRIA.valor}
                  inputMode="decimal"
                  value={f.value}
                  onChange={(e) => setLibres((xs) => xs.map((x) => (x.clave === f.clave ? { ...x, value: e.target.value } : x)))}
                  maxLength={12}
                  error={errores[`ant-valor-libre-${i}`] ?? null}
                />
                <Campo
                  id={`ant-unidad-${i}`}
                  etiqueta={COPY_ANTROPOMETRIA.unidad}
                  value={f.unit}
                  onChange={(e) => setLibres((xs) => xs.map((x) => (x.clave === f.clave ? { ...x, unit: e.target.value } : x)))}
                  maxLength={24}
                  error={errores[`ant-unidad-${i}`] ?? null}
                />
                <button
                  type="button"
                  className="boton boton--enlace"
                  onClick={() => {
                    // Los avisos van por posición: al quitar una fila las demás se corren, así que se descartan y se
                    // recalculan en el próximo guardado, en vez de quedar pegados a la fila equivocada.
                    setErrores({});
                    setLibres((xs) => xs.filter((x) => x.clave !== f.clave));
                  }}
                >
                  {COPY_ANTROPOMETRIA.quitarMedicion}
                </button>
              </div>
            ))}
            {libres.length === 0 && metricas.length === 0 && !(borrador && borrador.measurements.length > 0) ? <p className="nota">{COPY_ANTROPOMETRIA.sinBorrador}</p> : null}
            {/* Una medición fuera del protocolo es la excepción: va junto a los campos, no entre los actos de la toma. */}
            <p className="datos-de-la-carga__agregar">
              <button type="button" className="boton boton--enlace" onClick={() => setLibres((xs) => [...xs, filaNueva()])} disabled={!protocolo}>
                <Icono nombre="mas" tamano={18} />
                {metricas.length > 0 ? 'Agregar otra medición' : COPY_ANTROPOMETRIA.agregarMedicion}
              </button>
              <span className="nota">Lo que el protocolo no declara, con qué se midió y su unidad.</span>
            </p>
          </section>
        </div>
      </div>

      <DialogoDeConfirmacion
        abierto={confirmando && !!borrador}
        titulo={COPY_ANTROPOMETRIA.registrarEvaluacion}
        textoVolver="Volver"
        textoConfirmar={COPY_ANTROPOMETRIA.confirmarRegistro}
        textoEnviando="Registrando…"
        enviando={enviando}
        onVolver={() => setConfirmando(false)}
        onConfirmar={() => void registrar()}
      >
        <p>{COPY_ANTROPOMETRIA.explicacionDeRegistro}</p>
      </DialogoDeConfirmacion>
    </div>
  );
}
