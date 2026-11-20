'use client';

/**
 * «Patrones» como pestaña del panel del editor del plan (GR-T12; WP-GRAFICOS rama E, DL-174 y DL-183), en Entrenamiento y
 * en Nutrición: los mismos gráficos que en la ficha, en densidad compacta, con su período (12 semanas, 6 meses o desde que
 * la acompañás) y, de fondo, solo las versiones del plan que se edita. Se pliega con el panel.
 *
 * Arriba, qué enfoque rige acá (GR-T09): el de este plan; si no tiene, el de la persona; si tampoco, los sugeridos para
 * tus áreas. Se elige con «Para este plan» o «Para la persona». Editar un enfoque y armar un gráfico se hace en la ficha
 * (GR-VE07): el panel es angosto y está al lado de lo que se planifica. **Nada de acá escribe en el plan.**
 */
import { eleccionDelLugar, eleccionQueRige, type LugarDelEnfoque } from '@be/domain';
import { useId, useMemo, useState } from 'react';
import { BloqueDeEstado, Cargando } from '../../../../../components/estados';
import { Icono } from '../../../../../components/icono';
import type { Resultado } from '../../../../../lib/api';
import { textoDeFalla } from '../../../../../lib/fallas';
import { mensajeDeFallo } from '../../../../../lib/intento';
import { accesoDeLosDisponibles } from '../../seguimiento/selector';
import { useInicioDelAcompanamiento } from '../entrenamiento/lecturas-del-ejercicio';
import { SelectorDePeriodoDeGraficos, useEleccionDePeriodo } from '../selector-de-periodo-de-graficos';
import { contextoDelRegistro } from '../cruces/preguntas-con-graficos';
import { REGISTRO_DE_GRAFICOS } from '../registros';
import { CuerpoDePatrones } from './cuerpo-de-patrones-en-pantalla';
import { useDisponiblesDelPeriodo, useElecciones, useEnfoques } from './lecturas-de-los-enfoques';
import { COPY_DE_PATRONES as C, sugeridosConEstaPersona, textoAlQuitarDelPlan } from './patrones';

export interface PropsDePatronesDelPlan {
  readonly token: string;
  readonly asesoradoId: string;
  readonly sesionPerdida: (r: Resultado<unknown>) => boolean;
  readonly area: 'ENTRENAMIENTO' | 'NUTRICION';
  /** La identidad del plan que se edita (`trainingPlanId` o `nutritionPlanId`), nunca una versión (GR-T60). */
  readonly planId: string | null;
}

export function PatronesDelPlan({ token, asesoradoId, sesionPerdida, area, planId }: PropsDePatronesDelPlan) {
  const id = useId();
  const [aviso, setAviso] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const inicio = useInicioDelAcompanamiento(token, asesoradoId, sesionPerdida);
  // WP-GRAFICOS-POR-FASE (GPF-01): el mismo selector que el resto de los gráficos, con las versiones del plan.
  const eleccion = useEleccionDePeriodo(token, asesoradoId, sesionPerdida, inicio);
  const periodo = eleccion.periodo;
  const lectura = useMemo(() => ({ token, asesoradoId, sesionPerdida }), [token, asesoradoId, sesionPerdida]);
  const { estado, recargar } = useDisponiblesDelPeriodo(lectura, periodo);
  const enfoques = useEnfoques(token, sesionPerdida);
  const elecciones = useElecciones(token, asesoradoId, sesionPerdida, 0, enfoques.recargar);
  const lugar: LugarDelEnfoque | null = planId ? { tipo: 'PLAN', ambito: area === 'ENTRENAMIENTO' ? 'TRAINING_PLAN' : 'NUTRITION_PLAN', planId } : null;
  const lista = elecciones.lectura.tipo === 'lista' ? elecciones.lectura.elecciones : [];
  const mios = enfoques.lectura.tipo === 'lista' ? enfoques.lectura.enfoques : [];
  const rige = eleccionQueRige(lista, lugar ?? { tipo: 'PERSONA' });
  const elegido = rige ? (mios.find((e) => e.setId === rige.eleccion.set.setId) ?? null) : null;
  const [paraElegir, setParaElegir] = useState<string>('');
  const disponibles = estado.tipo === 'listo' ? estado.disponibles : null;
  const acceso = useMemo(() => (disponibles ? accesoDeLosDisponibles(disponibles) : null), [disponibles]);
  const sugeridos = useMemo(() => (disponibles && acceso ? sugeridosConEstaPersona(contextoDelRegistro(acceso, disponibles), REGISTRO_DE_GRAFICOS) : []), [disponibles, acceso]);

  const elegirEn = async (donde: LugarDelEnfoque) => {
    const setId = paraElegir || mios[0]?.setId;
    if (!setId) return;
    setOcupado(true);
    setAviso(null);
    const r = await elecciones.elegir(donde, setId, eleccionDelLugar(lista, donde));
    setOcupado(false);
    if (!r.ok) setAviso(r.tipo === 'API' && r.codigo === 'VERSION_CONFLICT' ? C.eleccionDeOtraPestana : mensajeDeFallo(r));
  };
  const quitarDelPlan = async () => {
    const delPlan = lugar ? eleccionDelLugar(lista, lugar) : null;
    if (!delPlan) return;
    setOcupado(true);
    const r = await elecciones.quitar(delPlan);
    setOcupado(false);
    if (!r.ok) setAviso(mensajeDeFallo(r));
  };

  const queRige = rige === null ? C.rigenLosSugeridos : rige.de === 'PLAN' ? C.rigeElDelPlan : C.rigeElDeLaPersona;
  const titulo = rige?.de === 'PLAN' ? C.enfoqueDelPlan : rige ? C.enfoqueDeLaPersona : C.enfoqueDelPlan;
  const elegible = paraElegir || mios[0]?.setId || '';

  return (
    <div className="patrones-del-plan" data-patrones-del-plan>
      <div className="patrones-del-plan__arriba">
        <SelectorDePeriodoDeGraficos leida={eleccion} inicio={inicio} />
        <p className="patrones-del-plan__enfoque" data-enfoque-que-rige={rige?.de ?? 'SUGERIDOS'}>
          <Icono nombre="separadas" tamano={18} />
          <span>
            <strong>{titulo}:</strong> {elegido?.name ?? C.sugeridos}
          </span>
        </p>
        <p className="nota">{queRige}</p>
        {mios.length > 0 ? (
          <div className="patrones-del-plan__elegir" role="group" aria-label="Elegir un enfoque">
            <div className="campo">
              <label htmlFor={`${id}-enfoque`}>{C.enfoque}</label>
              <select id={`${id}-enfoque`} value={elegible} onChange={(e) => setParaElegir(e.target.value)}>
                {mios.map((e) => (
                  <option key={e.setId} value={e.setId}>
                    {e.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="patrones-del-plan__botones">
              {lugar ? (
                <button type="button" className="boton boton--secundario boton--compacto" disabled={ocupado} onClick={() => void elegirEn(lugar)} data-para-este-plan>
                  {C.paraEstePlan}
                </button>
              ) : null}
              <button type="button" className="boton boton--secundario boton--compacto" disabled={ocupado} onClick={() => void elegirEn({ tipo: 'PERSONA' })} data-para-la-persona>
                {C.paraLaPersona}
              </button>
              {rige?.de === 'PLAN' ? (
                <button type="button" className="boton boton--quieto boton--compacto" disabled={ocupado} onClick={() => void quitarDelPlan()}>
                  {textoAlQuitarDelPlan(eleccionDelLugar(lista, { tipo: 'PERSONA' }) !== null)}
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
        {aviso ? (
          <p className="campo__error" role="alert">
            {aviso}
          </p>
        ) : null}
        <p className="nota">{C.nadaSeEscribeEnElPlan}</p>
      </div>
      {estado.tipo === 'cargando' || elecciones.lectura.tipo === 'cargando' || (rige !== null && enfoques.lectura.tipo === 'cargando') || !periodo ? (
        <Cargando />
      ) : elecciones.lectura.tipo === 'error' ? (
        <BloqueDeEstado tipo="error" icono="aviso" onReintentar={() => void elecciones.recargar()} textoDelBoton="Reintentar" rol="alert">
          {textoDeFalla(elecciones.lectura.motivo, 'el enfoque elegido')}
        </BloqueDeEstado>
      ) : disponibles && acceso ? (
        disponibles.falla && disponibles.ejercicios === null && !disponibles.nutricion && disponibles.antropometria === null ? (
          <BloqueDeEstado tipo="error" icono="aviso" onReintentar={recargar} textoDelBoton="Reintentar" rol="alert">
            {textoDeFalla(disponibles.falla, C.noSeLeyo)}
          </BloqueDeEstado>
        ) : (
          <CuerpoDePatrones
            lectura={lectura}
            periodo={periodo}
            disponibles={disponibles}
            acceso={acceso}
            charts={elegido ? elegido.content.charts : sugeridos}
            densidad="COMPACTA"
            fondo={[area]}
            edicion={null}
            agregar={null}
          />
        )
      ) : null}
    </div>
  );
}
