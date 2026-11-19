'use client';

/**
 * PLT (DL-182) · La frontera del editor de Entrenamiento: qué se edita.
 *
 * El editor es uno solo (`editor.tsx`): fases, sesiones, bloques «Seguido» y «En vueltas», ejercicios, series con
 * calentamiento, criterio, escritura rápida, catálogo y presets. Edita **el plan de una persona** (su versión en
 * preparación, que se activa) o **la preparación de una plantilla** (sin persona, que se guarda como plantilla o como una
 * versión nueva). Lo que cambia entre los dos vive acá:
 * - **lo guardado** (`LoGuardado`): la versión del plan como la lee API-SER-01, o la preparación como la lee API-TPL-09;
 * - **la cabecera** de la plantilla: su nombre (el de una nueva se escribe acá), si son cambios sobre una versión, el
 *   interruptor de las cargas (D-2 de DL-108) y «Revisar y guardar…»;
 * - **«Antes de guardar»**: lo que impide guardar la plantilla, lo que queda para completar al usarla con una persona, lo
 *   que cambia frente a la versión de la que partió y qué queda guardado; un solo principal, «Guardar plantilla» o
 *   «Guardar nueva versión»;
 * - **descartar** lo preparado, con su consecuencia dicha.
 * Lo que depende de la persona (la agenda y sus días, el asistente, activar, «Otras áreas», la fuerza estimada, «La vez
 * pasada», el contexto de la persona) no aparece en el editor de una plantilla (PLT-D12).
 */
import {
  COPY_GUARDADO,
  COPY_PLANTILLAS,
  COPY_PREPARACION_DE_PLANTILLA as P,
  type ImagenDeEjercicio,
  type PlanConObjetivos,
  type PlantillaDeEntrenamiento,
  type PreparacionDePlantilla,
} from '@be/domain';
import type { ReactNode } from 'react';
import { DialogoDeConfirmacion } from '../../../../components/dialogo';
import { Enlace } from '../../../../components/enlace';
import { Campo } from '../../../../components/formulario';
import { Icono } from '../../../../components/icono';
import { MenuDeAcciones } from '../../../../components/menu-de-acciones';
import { CAMBIOS_A_LA_VISTA } from '../antes-de-activar';
import { textoDeLosContadores, type CambiosFrenteALaVigente } from '../comparar-versiones';
import type { CuerpoDelGuardado } from '../es-lo-que-mande';
import { RenglonDeAviso, type CosaParaRevisar } from '../renglon-de-aviso';
import type { Bloques } from './ejercicio-del-editor';

/** Qué edita el editor cuando edita una plantilla, y qué hace la página cuando se guarda o se descarta. */
export interface EdicionDePlantilla {
  readonly preparacionId: string;
  /** Guardada como plantilla (la primera vez) o como una versión nueva. */
  readonly onGuardada: (plantilla: PlantillaDeEntrenamiento, primera: boolean) => void;
  /** Lo preparado se descartó (o ya no estaba): el texto que se dice al volver. */
  readonly onDescartada: (texto: string) => void;
  /** «Mis plantillas»: adonde vuelve la cabecera. */
  readonly volver: string;
}

/** Lo guardado de la preparación de una plantilla, como lo lee el editor: su token y la preparación (API-TPL-09). */
export interface GuardadoDeLaPlantilla {
  readonly tipo: 'plantilla';
  readonly version: string;
  readonly preparacion: PreparacionDePlantilla;
}

/** Lo guardado que se edita: la versión en preparación del plan de una persona o la preparación de una plantilla. */
export type LoGuardado = PlanConObjetivos | GuardadoDeLaPlantilla;

export const esDelPlan = (v: LoGuardado): v is PlanConObjetivos => !('tipo' in v && v.tipo === 'plantilla');
export const comoPlan = (v: LoGuardado | null): PlanConObjetivos | null => (v && esDelPlan(v) ? v : null);
export const guardadoDeLaPlantilla = (p: PreparacionDePlantilla): GuardadoDeLaPlantilla => ({ tipo: 'plantilla', version: p.version, preparacion: p });

/** Los metadatos que viajan con la estructura: el nombre y la descripción (solo en una nueva) y el interruptor de las cargas. */
export interface MetadatosDeLaPlantilla {
  readonly nombre: string;
  readonly descripcion: string;
  readonly conCargas: boolean;
}
export const metadatosDe = (p: PreparacionDePlantilla): MetadatosDeLaPlantilla => ({ nombre: p.name, descripcion: p.description ?? '', conCargas: p.copySuggestedLoads });

/** La estructura de la preparación, en la forma que edita el editor (ya es la de entrada: con sus identificadores). */
export const bloquesDeLaPreparacion = (p: PreparacionDePlantilla): Bloques => structuredClone(p.structure.blocks) as Bloques;

/** Por versión de ejercicio: el nombre vigente, la imagen y el ejercicio del catálogo, como los da API-TPL-09. */
export function delCatalogoDeLaPreparacion(p: PreparacionDePlantilla): {
  readonly nombres: Record<string, string>;
  readonly imagenes: Record<string, ImagenDeEjercicio | null>;
  readonly ejercicios: Record<string, string>;
} {
  const e = Object.entries(p.exercises);
  return {
    nombres: Object.fromEntries(e.map(([id, x]) => [id, x.exerciseName])),
    imagenes: Object.fromEntries(e.map(([id, x]) => [id, x.image])),
    ejercicios: Object.fromEntries(e.map(([id, x]) => [id, x.exerciseId])),
  };
}

/** ED-61 en la plantilla: lo que se mandó (o quedó guardado), en la forma que se compara, con sus metadatos. */
export function cuerpoDeLaPreparacion(bloques: unknown, nueva: boolean, m: MetadatosDeLaPlantilla): CuerpoDelGuardado {
  return { estructura: bloques, proximaRevision: null, objetivo: null, metadatos: { ...(nueva ? { nombre: m.nombre.trim(), descripcion: m.descripcion.trim() } : {}), conCargas: m.conCargas } };
}

/** Lo que impide guardar, en palabras: los problemas propios de la plantilla, o el texto del editor para lo demás. */
export const textoDelProblemaDeLaPlantilla = (codigo: string): string | null => P.problema[codigo] ?? null;

// ─── La cabecera ──────────────────────────────────────────────────────────────────────────────────────────────────

export function CabeceraDeLaPlantilla({
  preparacion,
  metadatos,
  onMetadatos,
  cargasEscritas,
  estadoDeGuardado,
  onRevisarYGuardar,
  onDescartar,
  panelAbierto,
  onPanel,
  textosDelPanel,
}: {
  preparacion: PreparacionDePlantilla;
  metadatos: MetadatosDeLaPlantilla;
  onMetadatos: (m: MetadatosDeLaPlantilla) => void;
  /** Cuántos ejercicios tienen una carga sugerida escrita (D-2 de DL-108). */
  cargasEscritas: number;
  /** El estado del guardado y «Guardar ahora», los mismos del editor del plan. */
  estadoDeGuardado: ReactNode;
  onRevisarYGuardar: () => void;
  onDescartar: () => void;
  panelAbierto: boolean;
  onPanel: () => void;
  textosDelPanel: { readonly abrir: string; readonly cerrar: string };
}) {
  const nueva = preparacion.templateId === null;
  const base = preparacion.baseVersionNumber;
  const nombre = (nueva ? metadatos.nombre : preparacion.name).trim();
  return (
    <div className="editor-de-la-plantilla__cabecera" data-cabecera-de-la-plantilla>
      <div className="editor-del-plan__cabecera estacion__barra" data-barra-de-la-plantilla>
        <div className="editor-de-la-plantilla__titulo">
          <p className="nota editor-de-la-plantilla__que-es">
            <Enlace href={preparacion.templateId ? `/pro/templates?plantilla=${encodeURIComponent(preparacion.templateId)}` : '/pro/templates'} className="boton boton--enlace" data-volver-a-plantillas>
              <Icono nombre="izquierda" tamano={15} />
              {P.volver}
            </Enlace>
            <span aria-hidden="true"> · </span>
            {P.queEs}
          </p>
          <h2 id="titulo-borrador" data-titulo-de-la-plantilla>
            {nombre || P.sinTitulo}{' '}
            <span className="etiqueta-de-dato" data-de-donde-parte>
              <Icono nombre="borrador" tamano={15} />
              {nueva || base === null ? P.nueva : P.cambiosSobre(base)}
            </span>
            {preparacion.templateState === 'ARCHIVED' ? (
              <span className="etiqueta-de-dato" data-plantilla-archivada>
                {P.archivada}
              </span>
            ) : null}
          </h2>
        </div>
        <div className="editor-del-plan__acciones">
          {estadoDeGuardado}
          <button type="button" className="boton boton--primario" data-revisar-y-guardar onClick={onRevisarYGuardar}>
            <Icono nombre="revision" tamano={18} />
            {P.revisarYGuardar}
          </button>
          <MenuDeAcciones
            id="mas-de-la-plantilla"
            rotulo={P.masDeLaPlantilla}
            acciones={[{ clave: 'descartar', texto: nueva ? P.descartarLaNueva : P.descartarLosCambios, alElegir: onDescartar }]}
          />
          <button type="button" className="boton boton--quieto estacion__abrir-panel" aria-expanded={panelAbierto} aria-controls="zona-panel" onClick={onPanel} data-abrir-panel>
            <Icono nombre="menu" tamano={18} />
            {panelAbierto ? textosDelPanel.cerrar : textosDelPanel.abrir}
          </button>
        </div>
      </div>
      <div className="editor-de-la-plantilla__datos" data-datos-de-la-plantilla>
        {nueva ? (
          <>
            <Campo
              id="nombre-de-la-plantilla"
              etiqueta={P.nombre}
              ayuda={P.nombreAyuda}
              value={metadatos.nombre}
              maxLength={120}
              placeholder={P.sinTitulo}
              onChange={(e) => onMetadatos({ ...metadatos, nombre: e.target.value })}
            />
            <Campo id="descripcion-de-la-plantilla" etiqueta={P.descripcion} value={metadatos.descripcion} maxLength={1000} onChange={(e) => onMetadatos({ ...metadatos, descripcion: e.target.value })} />
          </>
        ) : (
          <div className="editor-de-la-plantilla__existente">
            {preparacion.description ? <p className="nota">{preparacion.description}</p> : null}
            <p className="nota">{P.nombreEnMisPlantillas}</p>
            {base !== null ? <p className="nota" data-la-version-sigue>{P.laVersionSigue(base)}</p> : null}
          </div>
        )}
        <div className="campo editor-de-la-plantilla__cargas" data-cargas-de-la-plantilla>
          <label>
            <input type="checkbox" checked={metadatos.conCargas} onChange={(e) => onMetadatos({ ...metadatos, conCargas: e.target.checked })} /> {COPY_PLANTILLAS.cargas}
          </label>
          <p className="nota">{COPY_PLANTILLAS.cargasAyuda}</p>
          {cargasEscritas > 0 ? (
            <p className="nota" data-cargas-escritas>
              <Icono nombre={metadatos.conCargas ? 'tilde' : 'aviso'} tamano={15} />
              {metadatos.conCargas ? P.cargasVan(cargasEscritas) : P.cargasEscritasNoVan(cargasEscritas)}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ─── «Antes de guardar» ──────────────────────────────────────────────────────────────────────────────────────────

/** Por qué el principal está apagado, o `null`: el mismo orden que «Antes de activar», sin la fecha de revisión. */
export function motivoParaNoGuardar(e: { readonly conflicto: boolean; readonly revisando: boolean; readonly sinGuardar: boolean; readonly impiden: number; readonly sinRevisar: boolean }): string | null {
  if (e.conflicto) return P.falta([P.cargarLaGuardada]);
  if (e.revisando) return P.revisando;
  const partes = [...(e.sinGuardar ? [P.guardarLosCambios] : []), ...(e.impiden > 0 ? [P.corregir(e.impiden)] : []), ...(!e.sinGuardar && e.sinRevisar ? [P.revisarDeNuevo] : [])];
  return partes.length > 0 ? P.falta(partes) : null;
}

export function AntesDeGuardarLaPlantilla({
  abierto,
  preparacion,
  impiden,
  paraCompletar,
  revisando,
  sinRevisar,
  onVolverARevisar,
  sinGuardar,
  guardando,
  conflicto,
  onGuardarAhora,
  cambios,
  cargas,
  guardandoLaPlantilla,
  error,
  onGuardar,
  onVolver,
}: {
  abierto: boolean;
  preparacion: PreparacionDePlantilla;
  impiden: readonly CosaParaRevisar[];
  paraCompletar: readonly CosaParaRevisar[];
  revisando: boolean;
  sinRevisar: boolean;
  onVolverARevisar: () => void;
  sinGuardar: boolean;
  guardando: boolean;
  conflicto: boolean;
  onGuardarAhora: () => void;
  /** Frente a la versión de la que partió; `null` en una nueva, o si no se pudo leer (`undefined`: se está leyendo). */
  cambios: CambiosFrenteALaVigente | null | undefined;
  /** Lo que se dice de las cargas: van como referencia o no van (D-2 de DL-108); `null` si no hay ninguna escrita. */
  cargas: string | null;
  guardandoLaPlantilla: boolean;
  error: string | null;
  onGuardar: () => void;
  onVolver: () => void;
}) {
  const nueva = preparacion.templateId === null;
  const base = preparacion.baseVersionNumber;
  const motivo = motivoParaNoGuardar({ conflicto, revisando, sinGuardar, impiden: impiden.length, sinRevisar });
  const aLaVista = cambios ? cambios.lista.slice(0, CAMBIOS_A_LA_VISTA) : [];
  return (
    <DialogoDeConfirmacion
      abierto={abierto}
      ancho
      titulo={nueva || base === null ? P.tituloNueva : P.tituloVersion(base)}
      textoVolver={P.volverAlEditor}
      textoConfirmar={nueva ? P.guardarPlantilla : P.guardarNuevaVersion}
      textoEnviando={P.guardando}
      enviando={guardandoLaPlantilla}
      error={error}
      focoEnVolver
      confirmarDeshabilitado={motivo !== null}
      motivo={motivo}
      onVolver={onVolver}
      onConfirmar={onGuardar}
    >
      <div className="antes-de-activar antes-de-guardar-la-plantilla" data-antes-de-guardar-la-plantilla>
        <div className="antes-de-activar__columna">
          {sinGuardar ? (
            <section className="antes-de-activar__parte antes-de-activar__sin-guardar" data-sin-guardar>
              <p>
                <Icono nombre="borrador" tamano={18} />
                <span>{P.cambiosSinGuardar}</span>
              </p>
              <button type="button" className="boton boton--secundario" data-guardar-ahora aria-disabled={guardando || conflicto || undefined} onClick={() => !guardando && !conflicto && onGuardarAhora()}>
                <Icono nombre="guardar" tamano={18} />
                {guardando ? COPY_GUARDADO.guardando : COPY_GUARDADO.guardarAhora}
              </button>
            </section>
          ) : null}
          <section className="antes-de-activar__parte" data-lo-que-impide aria-labelledby="antes-de-guardar-impide">
            <h3 id="antes-de-guardar-impide">
              <Icono nombre="aviso" tamano={18} />
              {P.loQueImpide}
              {impiden.length > 0 ? ` · ${impiden.length}` : ''}
            </h3>
            <p className="nota" role="status" aria-live="polite">
              {revisando ? P.revisando : sinRevisar && !sinGuardar ? P.noSePudoRevisar : impiden.length === 0 && !sinGuardar ? P.nadaImpide : ''}
            </p>
            {sinRevisar && !sinGuardar && !revisando ? (
              <button type="button" className="boton boton--quieto boton--compacto" onClick={onVolverARevisar}>
                <Icono nombre="actualizar" tamano={15} />
                {P.volverARevisar}
              </button>
            ) : null}
            {impiden.length > 0 ? (
              <ul className="antes-de-activar__lista" data-impiden>
                {impiden.map((c, n) => (
                  <li key={n}>
                    <span>{c.texto}</span>
                    {c.ir ? (
                      <button type="button" className="boton boton--quieto boton--compacto" onClick={c.ir}>
                        {P.irACorregir}
                        <Icono nombre="derecha" tamano={15} />
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : null}
            <p className="nota">{P.sinPersona}</p>
          </section>
          <section className="antes-de-activar__parte" data-para-completar aria-labelledby="antes-de-guardar-completar">
            <h3 id="antes-de-guardar-completar">
              <Icono nombre="lista" tamano={18} />
              {P.paraCompletar}
            </h3>
            <p className="nota">{P.paraCompletarAyuda}</p>
            {paraCompletar.length === 0 ? (
              <p>{P.nadaParaCompletar}</p>
            ) : (
              <ul className="antes-de-activar__lista" data-sin-completar>
                {paraCompletar.map((c) => (
                  <li key={c.texto}>
                    <RenglonDeAviso cosa={c} textoIr={P.irACorregir} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
        <div className="antes-de-activar__columna">
          {!nueva && base !== null ? (
            <section className="antes-de-activar__parte" data-lo-que-cambia aria-labelledby="antes-de-guardar-cambia">
              <h3 id="antes-de-guardar-cambia">
                <Icono nombre="comparar" tamano={18} />
                {P.loQueCambia(base)}
              </h3>
              {cambios === undefined ? (
                <p className="nota">{P.revisando}</p>
              ) : cambios === null ? (
                <p>{P.sinLaBase}</p>
              ) : cambios.lista.length === 0 ? (
                <p>{P.problema.TEMPLATE_UNCHANGED.charAt(0).toUpperCase() + P.problema.TEMPLATE_UNCHANGED.slice(1)}.</p>
              ) : (
                <>
                  <p className="antes-de-activar__contadores" data-contadores>
                    <strong>{textoDeLosContadores(cambios)}</strong>
                  </p>
                  <ul className="antes-de-activar__lista">
                    {aLaVista.map((t, n) => (
                      <li key={n}>{t}</li>
                    ))}
                  </ul>
                </>
              )}
            </section>
          ) : null}
          <section className="antes-de-activar__parte" data-que-queda aria-labelledby="antes-de-guardar-queda">
            <h3 id="antes-de-guardar-queda">
              <Icono nombre="guardar" tamano={18} />
              {P.queQueda}
            </h3>
            <p>{nueva || base === null ? P.consecuenciaNueva : P.consecuenciaVersion(base)}</p>
            {cargas ? <p className="nota">{cargas}</p> : null}
          </section>
        </div>
      </div>
    </DialogoDeConfirmacion>
  );
}

/** Descartar lo preparado: lo que se pierde y lo que queda, dichos antes. */
export function DescartarLaPreparacion({
  abierto,
  preparacion,
  enviando,
  error,
  onDescartar,
  onVolver,
}: {
  abierto: boolean;
  preparacion: PreparacionDePlantilla;
  enviando: boolean;
  error: string | null;
  onDescartar: () => void;
  onVolver: () => void;
}) {
  const nueva = preparacion.templateId === null || preparacion.baseVersionNumber === null;
  return (
    <DialogoDeConfirmacion
      abierto={abierto}
      peligro
      titulo={nueva ? P.descartarLaNueva : P.descartarLosCambios}
      textoVolver={P.volverAlEditor}
      textoConfirmar={nueva ? P.descartarLaNueva : P.descartarLosCambios}
      textoEnviando={P.descartando}
      enviando={enviando}
      error={error}
      focoEnVolver
      onVolver={onVolver}
      onConfirmar={onDescartar}
    >
      <p data-consecuencia-del-descarte>{nueva ? P.confirmarDescarteNueva : P.confirmarDescarteCambios(preparacion.baseVersionNumber ?? 1)}</p>
    </DialogoDeConfirmacion>
  );
}
