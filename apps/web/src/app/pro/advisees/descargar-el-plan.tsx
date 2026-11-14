'use client';

/**
 * PG-17 de WP-PULIDO-GRANDES (DL-173, con PG-D12): «Descargar el plan en PDF», en la pantalla del plan activo de
 * Nutrición y en la de Entrenamiento (Dirección, 2026-11-14: «tiene que tener el QR para descargar y un botón de descarga
 * también»).
 *
 * - **Sin dependencias nuevas ni archivos en el servidor:** arma la hoja (`lib/hoja-del-plan.ts`), la monta aparte de la
 *   página y abre la ventana de impresión del navegador, donde «Guardar como PDF» la descarga. La pista del botón lo dice
 *   antes de tocarlo. Mientras se imprime, la pestaña se llama como el archivo, sin nombres (TB-05), y después vuelve.
 * - **Lo que imprime es lo que la pantalla ya leyó:** la versión activa, su número y quiénes son. Lo único que pregunta es
 *   la próxima revisión acordada hoy, con la lectura del Resumen de la ficha y el mismo permiso; si no contesta a
 *   tiempo, o la versión ya no es la activa, la hoja sale sin esa línea.
 * - **Con «Ocultar nombres» prendido, avisa antes** (TB-05): la hoja sale como la pantalla, con la referencia, y se dice
 *   cómo sacarla con el nombre.
 */
import type { PlanConObjetivos, VersionDePlan } from '@be/domain';
import { useEffect, useRef, useState } from 'react';
import { DialogoDeConfirmacion } from '../../../components/dialogo';
import { HojaDelPlanImpresa } from '../../../components/hoja-del-plan';
import { Icono } from '../../../components/icono';
import { Pista } from '../../../components/pista';
import { api, type Resultado } from '../../../lib/api';
import { hoyEnBuenosAires } from '../../../lib/fecha-en-palabras';
import { COPY_HOJA_DEL_PLAN as C, hojaDeEntrenamiento, hojaDeNutricion, type ContextoDeLaHoja, type HojaDelPlan } from '../../../lib/hoja-del-plan';
import { useNombres } from '../../../lib/nombres-ocultos';
import { usePersonaDelArea } from './marco-del-area';
import { periodoEnInstantes, restarDias } from './seguimiento/estado';

/** Cuánto se espera la próxima revisión antes de armar la hoja sin ella. */
const ESPERA_DE_LA_REVISION_MS = 8000;
/** Para saber la próxima revisión alcanza con un período corto: no se muestra nada de él (como el marco del área). */
const DIAS_DEL_RESUMEN = 7;

/** El plan activo que se descarga, con su área. */
export type PlanParaDescargar = { readonly area: 'NUTRICION'; readonly version: VersionDePlan } | { readonly area: 'ENTRENAMIENTO'; readonly version: PlanConObjetivos };

export function DescargarElPlan({
  plan,
  numero,
  token,
  asesoradoId,
  sesionPerdida,
}: {
  plan: PlanParaDescargar;
  /** El número de la versión para la persona, el mismo que dice la pantalla. */
  numero: number;
  token: string;
  asesoradoId: string;
  sesionPerdida: (r: Resultado<unknown>) => boolean;
}) {
  const persona = usePersonaDelArea();
  const { ocultos, delProfesional } = useNombres();
  const [confirmando, setConfirmando] = useState(false);
  const [preparando, setPreparando] = useState(false);
  const [hoja, setHoja] = useState<HojaDelPlan | null>(null);
  const montado = useRef(true);
  useEffect(
    () => () => {
      montado.current = false;
    },
    [],
  );

  // Con la hoja montada en <body>, la ventana de impresión. Al cerrarla (imprimir, guardar o cancelar), la hoja se va y
  // la pestaña recupera su título.
  useEffect(() => {
    if (!hoja) return;
    const titulo = document.title;
    document.title = hoja.nombreDelArchivo;
    const terminar = () => setHoja(null);
    window.addEventListener('afterprint', terminar);
    const espera = window.setTimeout(() => window.print(), 0);
    return () => {
      window.clearTimeout(espera);
      window.removeEventListener('afterprint', terminar);
      document.title = titulo;
    };
  }, [hoja]);

  /** La próxima revisión acordada hoy: la fecha, `null` sin fecha, `undefined` si no se supo. */
  async function proximaRevision(): Promise<string | null | undefined> {
    const hoy = hoyEnBuenosAires();
    const lectura = api.consultarDashboard(token, asesoradoId, periodoEnInstantes({ preset: null, desde: restarDias(hoy, DIAS_DEL_RESUMEN - 1), hasta: hoy }));
    const r = await Promise.race([lectura, new Promise<null>((resolver) => window.setTimeout(() => resolver(null), ESPERA_DE_LA_REVISION_MS))]);
    if (!r || sesionPerdida(r) || !r.ok) return undefined;
    const dominio = plan.area === 'NUTRICION' ? r.datos.data.domains.nutrition : r.datos.data.domains.training;
    if (!dominio.available) return undefined;
    const activo = dominio.summary?.activePlan ?? null;
    // La revisión es de la versión que se descarga: si mientras tanto se activó otra, no se sabe la de esta.
    if (!activo || activo.planVersionId !== plan.version.planId) return undefined;
    return activo.nextReviewAt ? activo.nextReviewAt.slice(0, 10) : null;
  }

  async function preparar() {
    setConfirmando(false);
    setPreparando(true);
    const proxima = await proximaRevision();
    if (!montado.current) return;
    setPreparando(false);
    const contexto: ContextoDeLaHoja = { numero, persona, profesional: delProfesional(plan.version.professional), proximaRevision: proxima, hoy: hoyEnBuenosAires() };
    setHoja(plan.area === 'NUTRICION' ? hojaDeNutricion(plan.version, contexto) : hojaDeEntrenamiento(plan.version, contexto));
  }

  const pedir = () => {
    // TB-05: con «Ocultar nombres», antes de descargar se dice cómo sale la hoja.
    if (ocultos) return setConfirmando(true);
    void preparar();
  };

  return (
    <>
      <Pista texto={C.ayuda}>
        <button type="button" className="boton boton--quieto" onClick={pedir} disabled={preparando} aria-busy={preparando} data-descargar-el-plan>
          <Icono nombre="descargar" tamano={18} />
          {preparando ? C.preparando : C.descargar}
        </button>
      </Pista>
      <DialogoDeConfirmacion
        abierto={confirmando}
        titulo={C.conNombresOcultosTitulo}
        textoVolver={C.volver}
        textoConfirmar={C.descargarSinNombres}
        textoEnviando={C.preparando}
        enviando={false}
        onVolver={() => setConfirmando(false)}
        onConfirmar={() => void preparar()}
      >
        <p>{C.conNombresOcultos}</p>
      </DialogoDeConfirmacion>
      {hoja ? <HojaDelPlanImpresa hoja={hoja} /> : null}
    </>
  );
}
