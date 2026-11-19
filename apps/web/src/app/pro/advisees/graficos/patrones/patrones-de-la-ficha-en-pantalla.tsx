'use client';

/**
 * «Patrones» en la ficha (`vista=patrones`, entre «Resumen» y «Línea de tiempo»: GR-T12; WP-GRAFICOS rama E, DL-174 y
 * DL-183): los gráficos de esta persona en el mismo tiempo, con lo que pasó en cada momento, sobre el período de la
 * ficha (acortado al inicio del acompañamiento: TB-16).
 *
 * Arriba, «Enfoque: Foco en fuerza ▾» (GR-27): tus enfoques, «Sugeridos para tus áreas», «Guardar lo que ves como
 * enfoque…», «Editar este enfoque» y «Mis enfoques…». Elegir uno lo guarda para la persona en el momento, con «Deshacer».
 * Editar no escribe nada hasta «Guardar»; si el enfoque está elegido en otros lugares, se avisa antes y se ofrece
 * guardarlo como uno nuevo (GR-T10). «Agregar un gráfico» suma un sugerido que falta o uno armado con «Armá tu gráfico»
 * (GR-26) al enfoque que se está editando (o empieza uno, desde lo que se ve).
 *
 * Lo que lee: lo mismo que «Analizar» (lo disponible del período, con el acceso propio), los enfoques (API-GRF-01) y la
 * elección (API-GRF-05); cada gráfico pide lo suyo. Nunca lo que la persona comparte de otras áreas (DL-176).
 */
import {
  agregarGrafico,
  avisoAlCambiar,
  contenidoCon,
  eleccionDelLugar,
  eleccionQueRige,
  LARGO_MAXIMO_DEL_NOMBRE_DEL_ENFOQUE,
  MAXIMO_DE_ENFOQUES,
  nombreDeLaCopia,
  otrosLugares,
  quitarGrafico,
  textoDeLosLugares,
  type ContenidoDelEnfoque,
  type Enfoque,
  type GraficoDelEnfoque,
  type LugarDelEnfoque,
  type Resultado,
} from '@be/domain';
import { useId, useMemo, useState } from 'react';
import { AvisoFlotante } from '../../../../../components/ayuda';
import { CuadroEnfocado } from '../../../../../components/cuadro-enfocado';
import { BloqueDeEstado, Cargando } from '../../../../../components/estados';
import { Icono } from '../../../../../components/icono';
import { MenuDeAcciones, type AccionDelMenu } from '../../../../../components/menu-de-acciones';
import { mensajeDeFallo } from '../../../../../lib/intento';
import { textoDeFalla, useSeguimiento } from '../../seguimiento/contexto';
import { hoyEn } from '../../seguimiento/estado';
import { accesoDeLosDisponibles } from '../../seguimiento/selector';
import { useDisponibles } from '../../seguimiento/series';
import { CompositorDeGraficos } from '../arma-tu-grafico/compositor-en-pantalla';
import { contextoDelRegistro } from '../cruces/preguntas-con-graficos';
import type { PeriodoDelGrafico } from '../eje-de-fechas';
import { REGISTRO_DE_GRAFICOS } from '../registros';
import { CuerpoDePatrones } from './cuerpo-de-patrones-en-pantalla';
import { useElecciones, useEnfoques } from './lecturas-de-los-enfoques';
import { MisEnfoques } from './mis-enfoques-en-pantalla';
import { COPY_DE_PATRONES as C, graficosQueSeVen, intercambiarGraficos, sugeridosConEstaPersona } from './patrones';

const EN_LA_FICHA: LugarDelEnfoque = { tipo: 'PERSONA' };

/** Una elección que no se pudo hacer: si otra pestaña la cambió antes (409), se dice así; si no, la falla. */
const textoDelFalloAlElegir = (r: Resultado<unknown>): string => (!r.ok && r.tipo === 'API' && r.codigo === 'VERSION_CONFLICT' ? C.eleccionDeOtraPestana : mensajeDeFallo(r));

/** Lo que se está editando: un enfoque tuyo (`setId`) o uno nuevo (`null`), con su nombre y su contenido sin guardar. */
interface Borrador {
  readonly setId: string | null;
  readonly nombre: string;
  readonly contenido: ContenidoDelEnfoque | null;
  readonly aviso: string | null;
}

interface AvisoConDeshacer {
  readonly texto: string;
  readonly deshacer: (() => Promise<void>) | null;
}

export function PatronesDeLaFicha() {
  const { token, asesoradoId, periodo, sesionPerdida, versionDeAcceso, acompanamiento, nombreDelAsesorado } = useSeguimiento();
  const disponibles = useDisponibles();
  const acceso = useMemo(() => accesoDeLosDisponibles(disponibles), [disponibles]);
  const enfoques = useEnfoques(token, sesionPerdida);
  const elecciones = useElecciones(token, asesoradoId, sesionPerdida, versionDeAcceso, enfoques.recargar);
  const lectura = useMemo(() => ({ token, asesoradoId, sesionPerdida }), [token, asesoradoId, sesionPerdida]);
  const periodoDelGrafico: PeriodoDelGrafico = useMemo(
    () => ({ desde: periodo.desde, hasta: periodo.hasta, hoy: hoyEn(), desdeElVinculo: acompanamiento.inicio }),
    [periodo.desde, periodo.hasta, acompanamiento.inicio],
  );
  const [borrador, setBorrador] = useState<Borrador | null>(null);
  const [aviso, setAviso] = useState<AvisoConDeshacer | null>(null);
  const [nombrando, setNombrando] = useState<ContenidoDelEnfoque | null>(null);
  const [armando, setArmando] = useState(false);
  const [conMisEnfoques, setConMisEnfoques] = useState(false);
  const [ocupado, setOcupado] = useState(false);

  const lista = elecciones.lectura.tipo === 'lista' ? elecciones.lectura.elecciones : [];
  const mios = enfoques.lectura.tipo === 'lista' ? enfoques.lectura.enfoques : [];
  const rige = eleccionQueRige(lista, EN_LA_FICHA);
  const elegido = rige ? (mios.find((e) => e.setId === rige.eleccion.set.setId) ?? null) : null;
  const contexto = useMemo(() => contextoDelRegistro(acceso, disponibles), [acceso, disponibles]);
  const sugeridos = useMemo(() => sugeridosConEstaPersona(contexto, REGISTRO_DE_GRAFICOS), [contexto]);
  const base = borrador?.setId ? (mios.find((e) => e.setId === borrador.setId) ?? null) : null;
  const charts: readonly GraficoDelEnfoque[] = borrador ? (borrador.contenido?.charts ?? []) : elegido ? elegido.content.charts : sugeridos;
  // «Guardar lo que ves» guarda lo que se dibuja: nada de un área sin acceso ni lo que no aplica en el período.
  const queSeVen = useMemo(() => graficosQueSeVen(charts, contexto, REGISTRO_DE_GRAFICOS), [charts, contexto]);

  // ─── Elegir, volver a los sugeridos y deshacer ────────────────────────────────────────────────────────────
  const elegir = async (e: Pick<Enfoque, 'setId' | 'name'>, conDeshacer = true) => {
    const actual = eleccionDelLugar(lista, EN_LA_FICHA);
    const anterior = actual?.set ?? null;
    setOcupado(true);
    const r = await elecciones.elegir(EN_LA_FICHA, e.setId, actual);
    setOcupado(false);
    if (!r.ok) return setAviso({ texto: textoDelFalloAlElegir(r), deshacer: null });
    const nueva = r.datos.data;
    setAviso({
      texto: `${C.elegido(e.name)}. ${C.elegidoParaLaPersona}`,
      deshacer: conDeshacer
        ? async () => {
            const vuelta = anterior ? await elecciones.elegir(EN_LA_FICHA, anterior.setId, nueva) : await elecciones.quitar(nueva);
            setAviso(vuelta.ok ? null : { texto: textoDelFalloAlElegir(vuelta), deshacer: null });
          }
        : null,
    });
  };
  // «Deshacer» va de a uno: un segundo toque mientras vuelve no manda otra elección (que respondería 409 y taparía el aviso).
  const deshacer = async (f: (() => Promise<void>) | null) => {
    if (!f || ocupado) return;
    setOcupado(true);
    try {
      await f();
    } finally {
      setOcupado(false);
    }
  };
  const volverALosSugeridos = async () => {
    const actual = eleccionDelLugar(lista, EN_LA_FICHA);
    if (!actual) return;
    setOcupado(true);
    const r = await elecciones.quitar(actual);
    setOcupado(false);
    if (!r.ok) return setAviso({ texto: mensajeDeFallo(r), deshacer: null });
    setAviso({
      texto: C.volvioALosSugeridos,
      deshacer: async () => {
        const vuelta = await elecciones.elegir(EN_LA_FICHA, actual.set.setId, null);
        setAviso(vuelta.ok ? null : { texto: textoDelFalloAlElegir(vuelta), deshacer: null });
      },
    });
  };

  // ─── Editar ───────────────────────────────────────────────────────────────────────────────────────────────
  const empezarABorrador = (): Borrador => borrador ?? (elegido ? { setId: elegido.setId, nombre: elegido.name, contenido: elegido.content, aviso: null } : { setId: null, nombre: '', contenido: contenidoCon(sugeridos), aviso: null });
  const agregar = (g: GraficoDelEnfoque) => {
    const b = empezarABorrador();
    const r = agregarGrafico(b.contenido, g);
    setBorrador(r.tipo === 'AGREGADO' ? { ...b, contenido: r.contenido, aviso: null } : { ...b, aviso: r.tipo === 'TOPE' ? C.tope : C.repetido });
  };
  const cambiar = (f: (c: ContenidoDelEnfoque) => ContenidoDelEnfoque | null) =>
    setBorrador((b) => {
      if (!b?.contenido) return b;
      const c = f(b.contenido);
      return c ? { ...b, contenido: c, aviso: null } : { ...b, aviso: C.noSeQuitaElUltimo };
    });
  const edicion = borrador?.contenido
    ? {
        intercambiar: (a: number, b: number) => cambiar((c) => intercambiarGraficos(c, a, b)),
        quitar: (i: number) => cambiar((c) => quitarGrafico(c, i)),
        total: borrador.contenido.charts.length,
      }
    : null;

  /** Guarda el borrador: cambia el enfoque (`nuevo: false`) o crea uno nuevo y lo elige para la persona. */
  const guardar = async (nuevo: boolean) => {
    if (!borrador?.contenido || borrador.nombre.trim() === '') return;
    setOcupado(true);
    let r: Resultado<{ data: Enfoque }>;
    if (!nuevo && base) r = await enfoques.reemplazar(base, borrador.nombre, borrador.contenido);
    else {
      const nombre = base && borrador.nombre.trim() === base.name ? nombreDeLaCopia(base.name, mios.map((x) => x.name)) : borrador.nombre;
      r = await enfoques.crear(nombre, borrador.contenido);
    }
    setOcupado(false);
    if (!r.ok) {
      const texto = r.tipo === 'API' && r.codigo === 'VERSION_CONFLICT' ? C.cambioDeOtraPestana : r.tipo === 'API' && r.codigo === 'TOO_MANY_SETS' ? C.tantosEnfoques : mensajeDeFallo(r);
      return setBorrador({ ...borrador, aviso: texto });
    }
    const guardado = r.datos.data;
    setBorrador(null);
    // Lo guardado rige con esta persona: si es nuevo (o no estaba elegido acá), se elige.
    if (rige?.eleccion.set.setId !== guardado.setId) await elegir(guardado, false);
    setAviso({ texto: C.guardado(guardado.name), deshacer: null });
  };

  const guardarLoQueSeVe = async (nombre: string) => {
    if (!nombrando) return;
    setOcupado(true);
    const r = await enfoques.crear(nombre, nombrando);
    setOcupado(false);
    if (!r.ok) return setAviso({ texto: r.tipo === 'API' && r.codigo === 'TOO_MANY_SETS' ? C.tantosEnfoques : mensajeDeFallo(r), deshacer: null });
    setNombrando(null);
    await elegir(r.datos.data, false);
    setAviso({ texto: C.guardado(r.datos.data.name), deshacer: null });
  };

  // ─── Lo que se lee primero ────────────────────────────────────────────────────────────────────────────────
  if (disponibles.cargando || elecciones.lectura.tipo === 'cargando' || (rige !== null && enfoques.lectura.tipo === 'cargando')) return <Cargando />;
  if (elecciones.lectura.tipo === 'error') {
    // Una falla no es una ausencia: sin saber qué enfoque eligió, no se dibujan los sugeridos como si no hubiera ninguno.
    return (
      <BloqueDeEstado tipo="error" icono="aviso" onReintentar={() => void elecciones.recargar()} textoDelBoton="Reintentar" rol="alert">
        {textoDeFalla(elecciones.lectura.motivo, 'el enfoque elegido para esta persona')}
      </BloqueDeEstado>
    );
  }
  if (rige !== null && enfoques.lectura.tipo === 'error') {
    return (
      <BloqueDeEstado tipo="error" icono="aviso" onReintentar={() => void enfoques.recargar()} textoDelBoton="Reintentar" rol="alert">
        {textoDeFalla(enfoques.lectura.motivo, 'el enfoque elegido para esta persona')}
      </BloqueDeEstado>
    );
  }
  if (disponibles.falla && disponibles.ejercicios === null && !disponibles.nutricion && disponibles.antropometria === null) {
    return (
      <BloqueDeEstado tipo="error" icono="aviso" onReintentar={disponibles.recargar} textoDelBoton="Reintentar" rol="alert">
        {textoDeFalla(disponibles.falla, C.noSeLeyo)}
      </BloqueDeEstado>
    );
  }

  const nombreDelElegido = elegido?.name ?? C.sugeridos;
  const acciones: AccionDelMenu[] = [
    {
      clave: 'sugeridos',
      texto: C.sugeridos,
      detalle: elegido ? C.sugeridosDetalle : 'Es lo que ves ahora.',
      icono: <Icono nombre={elegido ? 'resumen' : 'tilde'} tamano={18} />,
      alElegir: () => void (elegido ? volverALosSugeridos() : undefined),
    },
    ...mios.map(
      (e): AccionDelMenu => ({
        clave: e.setId,
        texto: e.name,
        detalle: `${e.content.charts.length === 1 ? '1 gráfico' : `${e.content.charts.length} gráficos`} · ${e.setId === elegido?.setId ? 'Es lo que ves ahora' : textoDeLosLugares(e.choices)}`,
        icono: <Icono nombre={e.setId === elegido?.setId ? 'tilde' : 'separadas'} tamano={18} />,
        alElegir: () => void (e.setId === elegido?.setId ? undefined : elegir(e)),
      }),
    ),
    {
      clave: 'guardar',
      texto: C.guardarComoEnfoque,
      icono: <Icono nombre="guardar" tamano={18} />,
      alElegir: () => setNombrando(contenidoCon(queSeVen)),
      noSePuede: mios.length >= MAXIMO_DE_ENFOQUES ? C.tantosEnfoques : queSeVen.length === 0 ? C.sinGraficos : null,
    },
    {
      clave: 'editar',
      texto: C.editarEsteEnfoque,
      icono: <Icono nombre="texto" tamano={18} />,
      alElegir: () => setBorrador(empezarABorrador()),
      noSePuede: elegido ? null : 'Elegí uno de tus enfoques para editarlo, o guardá lo que ves como enfoque.',
    },
    { clave: 'mis', texto: C.misEnfoques, icono: <Icono nombre="lista" tamano={18} />, alElegir: () => setConMisEnfoques(true) },
  ];

  return (
    <section className="seccion patrones-de-la-ficha" aria-label={C.vista} data-vista-patrones>
      <div className="patrones__enfoque" data-enfoque-elegido={elegido?.setId ?? 'sugeridos'}>
        <MenuDeAcciones rotulo="Cambiar el enfoque" texto={C.elegido(nombreDelElegido)} acciones={acciones} icono="separadas" conFlecha alineado="izquierda" />
        <p className="nota patrones__que-rige">{elegido ? C.elegidoParaLaPersona : C.sugeridosDetalle}</p>
      </div>
      {borrador ? (
        <BarraDeEdicion
          borrador={borrador}
          base={base}
          otros={base ? otrosLugares(base.choices, rige?.eleccion.set.setId === base.setId) : 0}
          ocupado={ocupado}
          onNombre={(nombre) => setBorrador({ ...borrador, nombre })}
          onGuardar={(nuevo) => void guardar(nuevo)}
          onCancelar={() => setBorrador(null)}
        />
      ) : null}
      <CuerpoDePatrones
        lectura={lectura}
        periodo={periodoDelGrafico}
        disponibles={disponibles}
        acceso={acceso}
        charts={charts}
        densidad="COMPLETA"
        fondo={['NUTRICION', 'ENTRENAMIENTO']}
        edicion={edicion}
        agregar={{ sugerido: agregar, armar: () => setArmando(true) }}
      />
      <CompositorDeGraficos
        abierto={armando}
        acceso={acceso}
        ejercicios={disponibles.ejercicios}
        medidas={disponibles.antropometria}
        lectura={lectura}
        periodo={periodoDelGrafico}
        sobretitulo={nombreDelAsesorado}
        onAgregar={(g) => {
          setArmando(false);
          if (g.series.length > 0) agregar({ kind: 'CUSTOM', title: g.title, series: [...g.series], mode: g.mode });
        }}
        onCerrar={() => setArmando(false)}
      />
      <MisEnfoques
        abierto={conMisEnfoques}
        lectura={enfoques.lectura}
        recargar={() => void enfoques.recargar()}
        elegidoId={elegido?.setId ?? null}
        sobretitulo={nombreDelAsesorado}
        onElegir={(e) => void elegir(e)}
        crear={enfoques.crear}
        reemplazar={enfoques.reemplazar}
        borrar={async (setId) => {
          const r = await enfoques.borrar(setId);
          // Borrar un enfoque quita sus elecciones: la de esta persona también.
          void elecciones.recargar();
          return r;
        }}
        onCerrar={() => setConMisEnfoques(false)}
      />
      <DialogoDelNombre key={nombrando ? 'nombrando' : 'cerrado'} contenido={nombrando} ocupado={ocupado} onGuardar={(n) => void guardarLoQueSeVe(n)} onCerrar={() => setNombrando(null)} />
      {aviso ? (
        // Un aviso nuevo es otro aviso (su reloj empieza de nuevo); el aviso flotante ya se anuncia como estado.
        <AvisoFlotante key={aviso.texto} onCerrar={() => setAviso(null)} seQueda={aviso.deshacer !== null}>
          <p>
            {aviso.texto}{' '}
            {aviso.deshacer ? (
              <button type="button" className="boton boton--enlace" disabled={ocupado} onClick={() => void deshacer(aviso.deshacer)} data-deshacer-el-enfoque>
                <Icono nombre="deshacer" tamano={18} />
                {C.deshacer}
              </button>
            ) : null}
          </p>
        </AvisoFlotante>
      ) : null}
    </section>
  );
}

function BarraDeEdicion({
  borrador,
  base,
  otros,
  ocupado,
  onNombre,
  onGuardar,
  onCancelar,
}: {
  borrador: Borrador;
  base: Enfoque | null;
  otros: number;
  ocupado: boolean;
  onNombre: (nombre: string) => void;
  onGuardar: (nuevo: boolean) => void;
  onCancelar: () => void;
}) {
  const id = useId();
  const sinNombre = borrador.nombre.trim() === '';
  const sinGraficos = (borrador.contenido?.charts.length ?? 0) === 0;
  const sinCambios = base !== null && borrador.nombre.trim() === base.name && JSON.stringify(borrador.contenido) === JSON.stringify(base.content);
  const motivo = sinGraficos ? C.sinGraficos : sinNombre ? C.faltaNombre : null;
  return (
    <div className="patrones__editando tarjeta" role="region" aria-labelledby={`${id}-titulo`} data-editando-el-enfoque>
      <p id={`${id}-titulo`} className="patrones__editando-titulo">
        <Icono nombre="texto" tamano={18} />
        <strong>{C.editando(base?.name ?? null)}</strong>
      </p>
      <p className="nota">{C.editandoDetalle}</p>
      <div className="campo">
        <label htmlFor={`${id}-nombre`}>{C.nombreDelEnfoque}</label>
        <input id={`${id}-nombre`} type="text" maxLength={LARGO_MAXIMO_DEL_NOMBRE_DEL_ENFOQUE} value={borrador.nombre} aria-describedby={`${id}-pista`} onChange={(e) => onNombre(e.target.value)} />
        <p id={`${id}-pista`} className="campo__pista">
          {C.pistaDelNombre}
        </p>
      </div>
      {base && otros > 0 ? (
        <p className="patrones__otros-lugares" data-otros-lugares={otros}>
          <Icono nombre="info" tamano={18} />
          {avisoAlCambiar(otros)}
        </p>
      ) : null}
      {borrador.aviso ? (
        <p className="campo__error" role="alert">
          {borrador.aviso}
        </p>
      ) : null}
      {motivo ? <p className="nota">{motivo}</p> : null}
      <div className="patrones__editando-acciones">
        <button type="button" className="boton boton--primario boton--compacto" disabled={ocupado || motivo !== null || sinCambios} onClick={() => onGuardar(false)} data-guardar-el-enfoque>
          <Icono nombre="guardar" tamano={18} />
          {C.guardar}
        </button>
        {base ? (
          <button type="button" className="boton boton--secundario boton--compacto" disabled={ocupado || motivo !== null} onClick={() => onGuardar(true)} data-guardar-como-nuevo>
            <Icono nombre="duplicar" tamano={18} />
            {C.guardarComoNuevo}
          </button>
        ) : null}
        <button type="button" className="boton boton--quieto boton--compacto" disabled={ocupado} onClick={onCancelar}>
          {C.cancelar}
        </button>
        {sinCambios ? <span className="nota">{C.sinCambios}</span> : null}
      </div>
    </div>
  );
}

/** «Guardar lo que ves como enfoque…»: el nombre, con la pista de no poner datos de salud. */
function DialogoDelNombre({ contenido, ocupado, onGuardar, onCerrar }: { contenido: ContenidoDelEnfoque | null; ocupado: boolean; onGuardar: (nombre: string) => void; onCerrar: () => void }) {
  const id = useId();
  const [nombre, setNombre] = useState('');
  const n = contenido?.charts.length ?? 0;
  return (
    <CuadroEnfocado
      abierto={contenido !== null}
      forma="dialogo"
      titulo="Guardar lo que ves como enfoque"
      ocupado={ocupado}
      conCambios={nombre.trim() !== ''}
      principal={{ texto: C.guardar, apagado: nombre.trim() === '' ? C.faltaNombre : null, enviando: ocupado, alTocar: () => onGuardar(nombre) }}
      onCerrar={() => {
        setNombre('');
        onCerrar();
      }}
    >
      <p className="nota">{n === 1 ? 'Guarda el gráfico que estás viendo' : `Guarda los ${n} gráficos que estás viendo`}, en este orden, y lo elige para esta persona. Después lo podés elegir para otras personas o para un plan.</p>
      <div className="campo">
        <label htmlFor={`${id}-nombre`}>{C.nombreDelEnfoque}</label>
        <input id={`${id}-nombre`} type="text" maxLength={LARGO_MAXIMO_DEL_NOMBRE_DEL_ENFOQUE} value={nombre} placeholder="Por ejemplo: Foco en fuerza" aria-describedby={`${id}-pista`} onChange={(e) => setNombre(e.target.value)} />
        <p id={`${id}-pista`} className="campo__pista">
          {C.pistaDelNombre}
        </p>
      </div>
    </CuadroEnfocado>
  );
}
