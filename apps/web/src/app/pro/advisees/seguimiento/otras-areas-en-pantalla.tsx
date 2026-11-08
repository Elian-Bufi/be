'use client';

/**
 * El panel «Otras áreas · lo comparte la persona» (WP-TABLERO-ALTA-GAMA TB-54, con TB-52, TB-53 y TB-56; DL-163 D-13,
 * ampliada por Dirección el 2026-11-07), en Nutrición · Plan y Entrenamiento · Plan (el plan vigente y el editor del
 * borrador) y en el paso 1 de la revisión nueva de las dos áreas. Las reglas viven en `otras-areas.ts`, con su prueba
 * (TEST-TAG-039).
 * - **Al abrir la página, API-RES-04,** porque sin otras áreas no hay panel (08 §11-bis.7): ni candado, ni aviso, ni
 *   un lugar vacío. Mientras se lee, o si falla, tampoco.
 * - **Plegado,** con su título y un renglón de lo que hay. Al desplegarlo por primera vez se leen los planes que la
 *   persona comparte (API-RES-06) y con quién se comparte lo propio (API-RES-07).
 * - Por área: quién la lleva y qué comparte; con «resumen y plan», el plan en una línea, lo registrado, «Ver el plan
 *   completo» y «Dejar una nota a …»; si no, «Pedir ver su plan» cuando la API lo deja, con una confirmación que dice qué
 *   le llega a la persona.
 * - **Nada escribe, salvo la nota (el redactor de siempre, API-CRD-01) y el pedido (API-RES-08).**
 * Los diálogos van fuera del árbol de la página (`createPortal`), y un envío de adentro no sube: en la revisión nueva el
 * panel está dentro de su formulario, y la nota no puede mandar la revisión.
 */
import { ETIQUETA_DE_ALCANCE, type Alcance, type AreaConPlan, type PlanCompartido } from '@be/domain';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { DialogoDeConfirmacion } from '../../../../components/dialogo';
import { Aviso } from '../../../../components/formulario';
import { Icono } from '../../../../components/icono';
import { Retrato } from '../../../../components/retrato';
import { api, type Resultado } from '../../../../lib/api';
import { diaCivil, diaSinElAnioEnCurso } from '../../../../lib/formato';
import { mensajeDeFallo, useClaveDeIntento } from '../../../../lib/intento';
import { useNombres } from '../../../../lib/nombres-ocultos';
import { DialogoDeNota } from '../nota-de-coordinacion';
import type { PedidoDeNota } from './contexto';
import { PlanCompartidoAbierto } from './plan-compartido';
import {
  COPY_OTRAS_AREAS as T,
  areaDelPedido,
  areasDelPanel,
  citaDelPlan,
  conPedidoPendiente,
  lineaDeMiArea,
  lineaDelAvance,
  lineaDelPlan,
  renglonPlegado,
  tarjetaDeOtraArea,
  tienePlan,
  trasPedirVerElPlan,
  type DatosDelPanel,
  type TarjetaDeOtraArea,
} from './otras-areas';

const fechaCorta = (iso: string) => diaSinElAnioEnCurso(iso);

/** Lo leído del plan de un área al desplegar: el plan (o `null` si no tiene uno vigente), una falla o que ya no se ve. */
type LecturaDelPlan = { readonly tipo: 'leyendo' } | { readonly tipo: 'listo'; readonly plan: PlanCompartido | null } | { readonly tipo: 'falla' } | { readonly tipo: 'no-se-ve' };
const lecturaDelPlan = (r: Resultado<{ data: PlanCompartido | null }>): LecturaDelPlan =>
  r.ok ? { tipo: 'listo', plan: r.datos.data } : r.tipo === 'API' && r.codigo === 'RESOURCE_NOT_FOUND' ? { tipo: 'no-se-ve' } : { tipo: 'falla' };

export function OtrasAreas({
  token,
  asesoradoId,
  sesionPerdida,
  area,
}: {
  token: string;
  asesoradoId: string;
  sesionPerdida: (r: Resultado<unknown>) => boolean;
  /** El área de la página (Nutrición o Entrenamiento): de ahí sale un pedido. */
  area: Alcance;
}) {
  const { delProfesional } = useNombres();
  const id = useId();
  const [datos, setDatos] = useState<DatosDelPanel | null>(null);
  const [vuelta, setVuelta] = useState(0);
  const [abierto, setAbierto] = useState(false);
  const [planes, setPlanes] = useState<ReadonlyMap<AreaConPlan, LecturaDelPlan>>(new Map());
  const [mia, setMia] = useState<string | null>(null);
  const leido = useRef(false);
  const [mirando, setMirando] = useState<AreaConPlan | null>(null);
  const [nota, setNota] = useState<PedidoDeNota | null>(null);
  const [pidiendo, setPidiendo] = useState<AreaConPlan | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [falloDelPedido, setFalloDelPedido] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const intento = useClaveDeIntento();

  // Con otra persona, nada de la anterior queda a la vista.
  useEffect(() => {
    leido.current = false;
    setDatos(null);
    setAbierto(false);
    setPlanes(new Map());
    setMia(null);
    setAviso(null);
  }, [asesoradoId]);

  // Al abrir la página: API-RES-04, porque sin otras áreas no hay panel (08 §11-bis.7). Los planes, al desplegar.
  useEffect(() => {
    let vigente = true;
    void api.resumenesCompartidos(token, asesoradoId).then((r) => {
      if (!vigente || sesionPerdida(r)) return;
      // Lo que no es un 200 no deja rastro: un 404 (sin vínculo vigente, o una API sin RES) no se distingue de «nada».
      setDatos(r.ok ? r.datos.data : null);
    });
    return () => {
      vigente = false;
    };
  }, [token, asesoradoId, sesionPerdida, vuelta]);

  const areas = useMemo(() => areasDelPanel(datos), [datos]);
  const tarjetas = useMemo(() => areas.map((a) => tarjetaDeOtraArea(a, delProfesional, fechaCorta)), [areas, delProfesional]);

  async function desplegar() {
    if (leido.current || tarjetas.length === 0) return;
    leido.current = true;
    const conPlan = tarjetas.flatMap((t) => (t.estado === 'PLAN' && tienePlan(t.area) ? [t.area] : []));
    setPlanes(new Map(conPlan.map((a) => [a, { tipo: 'leyendo' } as const])));
    const [leidos, propio] = await Promise.all([Promise.all(conPlan.map((a) => api.planCompartido(token, asesoradoId, a))), api.loQueSeComparteDeMiArea(token, asesoradoId)]);
    if (leidos.some((r) => sesionPerdida(r)) || sesionPerdida(propio)) return;
    setPlanes(new Map(conPlan.map((a, i) => [a, lecturaDelPlan(leidos[i]!)])));
    setMia(propio.ok ? lineaDeMiArea(propio.datos.data, delProfesional, fechaCorta) : null);
  }

  const releerElPlan = useCallback(
    async (deArea: AreaConPlan) => {
      setPlanes((p) => new Map(p).set(deArea, { tipo: 'leyendo' }));
      const r = await api.planCompartido(token, asesoradoId, deArea);
      if (sesionPerdida(r)) return;
      setPlanes((p) => new Map(p).set(deArea, lecturaDelPlan(r)));
    },
    [token, asesoradoId, sesionPerdida],
  );

  async function confirmarElPedido() {
    if (!pidiendo || !datos || enviando) return;
    setEnviando(true);
    setFalloDelPedido(null);
    const { scope } = areaDelPedido(datos.scopes, area);
    const r = await api.pedirVerElPlan(token, asesoradoId, { scope, area: pidiendo }, intento.actual());
    intento.registrar(r);
    setEnviando(false);
    if (sesionPerdida(r)) return;
    const que = trasPedirVerElPlan(r);
    if (que === 'otro') return setFalloDelPedido(mensajeDeFallo(r));
    setPidiendo(null);
    setAviso(que === 'enviado' ? T.pedidoEnviado : null);
    // Lo que el pedido cambió (pendiente, desde cuándo se puede volver a pedir) lo dice API-RES-04.
    setVuelta((v) => v + 1);
  }

  const notaA = (t: TarjetaDeOtraArea, plan: PlanCompartido | null) =>
    setNota({ para: { identityId: t.profesionalId, nombre: t.quien, area: t.etiqueta }, cita: plan ? citaDelPlan(plan, fechaCorta) : null });

  if (tarjetas.length === 0) return null;
  const lecturaAbierta = mirando ? planes.get(mirando) : undefined;
  const planAbierto = lecturaAbierta?.tipo === 'listo' ? lecturaAbierta.plan : undefined;
  const desdeQueArea = datos ? areaDelPedido(datos.scopes, area).aviso : null;

  return (
    // Un envío de adentro (la nota) no sube al formulario de la revisión, aunque los diálogos estén en otro lugar del DOM.
    <div className="otras-areas" data-otras-areas onSubmit={(e) => e.stopPropagation()}>
      <details
        className="otras-areas__plegado"
        open={abierto}
        onToggle={(e) => {
          const ahora = e.currentTarget.open;
          setAbierto(ahora);
          if (ahora) void desplegar();
        }}
      >
        <summary className="otras-areas__resumen">
          <Icono nombre="derecha" tamano={18} />
          <span className="otras-areas__titulo" id={`${id}-titulo`}>
            <Icono nombre="asesorados" tamano={18} />
            {T.titulo}
          </span>
          <span className="otras-areas__renglon nota">{renglonPlegado(tarjetas, conPedidoPendiente(areas))}</span>
        </summary>
        <div className="otras-areas__cuerpo">
          {aviso ? (
            <Aviso tipo="exito">
              <p data-pedido-de-plan-aviso>{aviso}</p>
            </Aviso>
          ) : null}
          <ul className="otras-areas__lista">
            {tarjetas.map((t) => {
              const lectura = tienePlan(t.area) ? planes.get(t.area) : undefined;
              return (
                <li key={t.area} className="otras-areas__area" data-area={t.area} data-estado={t.estado}>
                  <h3 className="otras-areas__area-titulo">
                    <Icono nombre={t.area === 'NUTRICION' ? 'nutricion' : t.area === 'ENTRENAMIENTO' ? 'entrenamiento' : 'antropometria'} tamano={18} />
                    {t.etiqueta}
                  </h3>
                  <p className="con-retrato otras-areas__quien">
                    <Retrato nombre={t.quien} />
                    <span>{t.lineas[0]}</span>
                  </p>
                  {t.lineas.slice(1).map((l) => (
                    <p key={l} className="nota">
                      {l}
                    </p>
                  ))}
                  {t.estado === 'PLAN' ? <LoDelPlan lectura={lectura} onReintentar={() => tienePlan(t.area) && void releerElPlan(t.area)} /> : null}
                  {t.acciones.length > 0 ? (
                    <div className="otras-areas__acciones">
                      {t.acciones.includes('ver-plan') && lectura?.tipo === 'listo' && lectura.plan ? (
                        <button type="button" className="boton boton--secundario boton--compacto" onClick={() => tienePlan(t.area) && setMirando(t.area)} data-ver-el-plan={t.area}>
                          <Icono nombre="ver" tamano={18} />
                          {T.verElPlan}
                        </button>
                      ) : null}
                      {t.acciones.includes('dejar-nota') ? (
                        <button type="button" className="boton boton--quieto boton--compacto" onClick={() => notaA(t, lectura?.tipo === 'listo' ? lectura.plan : null)} data-dejar-nota={t.area}>
                          <Icono nombre="texto" tamano={18} />
                          {T.dejarUnaNota(t.quien)}
                        </button>
                      ) : null}
                      {t.acciones.includes('pedir') && t.pedir ? (
                        <button
                          type="button"
                          className="boton boton--secundario boton--compacto"
                          onClick={() => {
                            setFalloDelPedido(null);
                            if (tienePlan(t.area)) setPidiendo(t.area);
                          }}
                          data-pedir-ver-el-plan={t.area}
                        >
                          <Icono nombre="solicitar" tamano={18} />
                          {t.pedir}
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
          {mia ? (
            <p className="nota otras-areas__lo-de-tu-area" data-lo-de-tu-area>
              {mia}
            </p>
          ) : null}
        </div>
      </details>
      {typeof document !== 'undefined'
        ? createPortal(
            <>
              <PlanCompartidoAbierto
                area={mirando && planAbierto !== undefined ? mirando : null}
                lectura={planAbierto}
                onCerrar={() => setMirando(null)}
                onDejarNota={(plan) => {
                  const t = tarjetas.find((x) => x.area === plan.area);
                  if (t) notaA(t, plan);
                }}
              />
              <DialogoDeConfirmacion
                abierto={pidiendo !== null}
                titulo={pidiendo ? T.tituloDelPedido(ETIQUETA_DE_ALCANCE[pidiendo]) : ''}
                textoVolver={T.volver}
                textoConfirmar={T.pedirVerSuPlan}
                textoEnviando={T.pidiendo}
                enviando={enviando}
                error={falloDelPedido}
                focoEnVolver
                onVolver={() => setPidiendo(null)}
                onConfirmar={() => void confirmarElPedido()}
              >
                <p>{T.queLeLlega}</p>
                <p className="nota">{T.siDiceQueSi}</p>
                {desdeQueArea ? <p className="nota">{desdeQueArea}</p> : null}
              </DialogoDeConfirmacion>
              <DialogoDeNota pedido={nota} token={token} asesoradoId={asesoradoId} nombreDelAsesorado={null} sesionPerdida={sesionPerdida} onCerrar={() => setNota(null)} onEnviada={() => {}} />
            </>,
            document.body,
          )
        : null}
    </div>
  );
}

/** El plan de un área que lo comparte, en dos renglones: el plan vigente y lo registrado. */
function LoDelPlan({ lectura, onReintentar }: { lectura: LecturaDelPlan | undefined; onReintentar: () => void }) {
  if (!lectura || lectura.tipo === 'leyendo') return <p className="nota">{T.leyendo}</p>;
  if (lectura.tipo === 'no-se-ve') return <p className="nota">{T.noSePuedeVer}</p>;
  if (lectura.tipo === 'falla')
    return (
      <p className="nota">
        {T.noSeLeyo}{' '}
        <button type="button" className="boton boton--enlace" onClick={onReintentar}>
          Reintentar<span className="visualmente-oculto"> la lectura del plan</span>
        </button>
      </p>
    );
  if (!lectura.plan) return <p className="nota">{T.sinPlanVigente}</p>;
  return (
    <div className="otras-areas__plan" data-plan-en-una-linea>
      <p>{lineaDelPlan(lectura.plan, fechaCorta)}</p>
      <p className="nota">{lineaDelAvance(lectura.plan.progress, diaCivil)}</p>
    </div>
  );
}
