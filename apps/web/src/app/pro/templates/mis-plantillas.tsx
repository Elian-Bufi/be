'use client';

/**
 * «Mis plantillas» (PF-09; DL-108): las plantillas de plan de entrenamiento del profesional, solo las propias.
 * - Lista con estado, sesiones, cargas y fecha; filtro por estado; «Ver más» por cursor. Con el filtro puesto y nada que
 *   coincida se dice eso, con «Ver todas» (no «todavía no guardaste ninguna»); una lectura que falla se dice como falla.
 * - Detalle en solo lectura: la estructura con los nombres vigentes de los ejercicios (`exercises`); un ejercicio que
 *   ya no está disponible se dice.
 * - Renombrar y describir, archivar y reactivar, con `expectedVersion`.
 * - PLT (DL-182): una plantilla se crea y se edita acá, sin persona: «Nueva plantilla» (en blanco), «Crear otra desde
 *   esta» (una copia) y «Editar» (sus cambios, que se guardan como una versión nueva) abren el mismo editor del plan
 *   (`/pro/templates/training`). Lo que está en preparación se ve en la lista: una nueva, «Sin título» hasta tener
 *   nombre, y los cambios de una existente, junto a su versión disponible. El detalle agrupa la estructura por fase,
 *   sesión y bloque, y lista las versiones con cuántos planes salieron de cada una.
 */
import {
  COPY_PLANTILLAS,
  COPY_PREPARACION_DE_PLANTILLA as PLT,
  todasLasPaginas,
  type PlantillaDeEntrenamiento,
  type ResumenDePlantillaDeEntrenamiento,
  type ResumenDePreparacionDePlantilla,
} from '@be/domain';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Enlace } from '../../../components/enlace';
import { Icono } from '../../../components/icono';
import { tomarAvisoPara } from '../../../lib/aviso-al-llegar';
import { useClaveDeIntento } from '../../../lib/intento';
import { EstructuraAgrupada, VersionesDeLaPlantilla } from './detalle-de-la-plantilla';
import { hrefDelEditor } from './training/editor-de-la-plantilla';
import { AvisoFlotante } from '../../../components/ayuda';
import { useAntesDeSalir, useAvisarALaLista, useCambiosParaSalir, useDetalleConGuardia } from '../../../components/salida-segura';
import { Cargando, ErrorConReintento, EstadoVacio, VerMas } from '../../../components/estados';
import { Aviso, Campo } from '../../../components/formulario';
import { api, type Resultado } from '../../../lib/api';
import { fecha } from '../../../lib/formato';
import { mensajeDeFallo } from '../../../lib/intento';
import { useListaPaginada } from '../../../lib/lista';
import { SinEspacioProfesional, useEspacioProfesional } from '../espacio-profesional';
import { MisHabitualesDeEntrenamiento } from './mis-habituales';
import { MisHabitualesDeNutricion } from './mis-habituales-nutricion';
import { MisPlantillasNutricionales } from './mis-plantillas-nutricion';
import { EsperandoSesion } from '../../../lib/sesion';

type Estado = 'ACTIVE' | 'ARCHIVED';

export function MisPlantillas() {
  const { token, sesionPerdida, yo, cargarYo } = useEspacioProfesional('/pro/templates');
  const [estado, setEstado] = useState<Estado | ''>('');
  // PLT (DL-182): al volver del editor, la plantilla guardada queda abierta (`?plantilla=`), con su aviso.
  const pedida = useSearchParams().get('plantilla');
  const [abiertaId, setAbiertaId] = useState<string | null>(pedida);
  // ED-65: cerrar el detalle, abrir otra o cambiar el filtro (la lista vuelve a leerse) lo desmontan: con el nombre o la
  // descripción sin guardar, pregunta.
  const detalle = useDetalleConGuardia();
  const [aviso, setAviso] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);
  useEffect(() => {
    const llegada = tomarAvisoPara('/pro/templates');
    if (llegada) setAviso({ tipo: 'exito', texto: llegada });
  }, []);
  // «Ver todas» desaparece al quitar el filtro: el foco va al filtro, que es lo que cambió.
  const filtroDeEstado = useRef<HTMLSelectElement>(null);
  const verTodas = () => {
    setEstado('');
    filtroDeEstado.current?.focus();
  };
  const listo = yo.tipo === 'listo';
  // Un profesional sin Entrenamiento recibe 403: la sección no es para él y se omite (mostrar u ocultar no autoriza nada).
  const [sinArea, setSinArea] = useState(false);
  const lista = useListaPaginada(
    useMemo(
      () =>
        token && listo
          ? (cursor?: string) =>
              api.listarPlantillasDeEntrenamiento(token, { ...(estado ? { state: estado } : {}), ...(cursor ? { cursor } : {}) }).then((r) => {
                if (!r.ok && r.tipo === 'API' && r.codigo === 'ACTION_FORBIDDEN') setSinArea(true);
                return r;
              })
          : null,
      [token, listo, estado],
    ),
    sesionPerdida,
  );

  // PLT (DL-182): lo que está en preparación, para la lista: las nuevas arriba y los cambios junto a su plantilla.
  const preparaciones = usePreparaciones(token && listo && !sinArea ? token : null, sesionPerdida);
  const abrirElEditor = useAbrirElEditor(token, sesionPerdida, (texto) => setAviso({ tipo: 'error', texto }));

  if (!token) return <EsperandoSesion />;
  if (yo.tipo === 'cargando') return <Cargando />;
  if (yo.tipo === 'error') return <ErrorConReintento onReintentar={cargarYo} />;
  if (yo.tipo === 'sin-espacio') return <SinEspacioProfesional />;

  return (
    <div className="secciones plantillas-y-habituales">
      {aviso && aviso.tipo === 'exito' ? (
        <AvisoFlotante onCerrar={() => setAviso(null)}>
          <p>{aviso.texto}</p>
        </AvisoFlotante>
      ) : null}
      {aviso && aviso.tipo === 'error' ? (
        <Aviso tipo="error" enfocar>
          <p>{aviso.texto}</p>
        </Aviso>
      ) : null}
      {sinArea ? null : (
      <section className="seccion" aria-labelledby="titulo-plantillas">
        <div className="plantillas-y-habituales__cabecera">
          <h2 id="titulo-plantillas">{COPY_PLANTILLAS.plantillasDeEntrenamiento}</h2>
          {/* PLT (DL-182): una plantilla nueva, sin persona: abre el editor en blanco, sin pedir nada antes. */}
          <button type="button" className="boton boton--primario" data-nueva-plantilla disabled={abrirElEditor.abriendo} onClick={() => void abrirElEditor.nueva()}>
            <Icono nombre="mas" tamano={18} />
            {abrirElEditor.abriendo ? PLT.creandoLaPlantilla : PLT.nuevaPlantilla}
          </button>
        </div>
        <p className="nota">{PLT.queSeHaceAca}</p>
        <p className="nota">{COPY_PLANTILLAS.soloTuya}</p>
        <EnPreparacion preparaciones={preparaciones} />
        {/* Sin plantillas y sin filtro, el filtro no tiene nada que filtrar: aparece cuando hay alguna. */}
        {estado === '' && lista.estado.tipo === 'listo' && lista.estado.items.length === 0 ? null : (
        <div className="campo">
          <label htmlFor="plantillas-estado">Estado</label>
          <select
            ref={filtroDeEstado}
            id="plantillas-estado"
            value={estado}
            onChange={(e) => {
              const nuevo = e.target.value as Estado | '';
              detalle.antes(() => setEstado(nuevo));
            }}
          >
            <option value="">Todas</option>
            <option value="ACTIVE">{COPY_PLANTILLAS.activa}</option>
            <option value="ARCHIVED">{COPY_PLANTILLAS.archivada}</option>
          </select>
        </div>
        )}
        {lista.estado.tipo === 'cargando' ? <Cargando /> : null}
        {lista.estado.tipo === 'error' ? <ErrorConReintento mensaje={COPY_PLANTILLAS.noSeLeyeronLasDeEntrenamiento} onReintentar={lista.recargar} /> : null}
        {lista.estado.tipo === 'listo' ? (
          lista.estado.items.length === 0 ? (
            estado === '' ? (
              <p>{PLT.sinPlantillasDeEntrenamiento}</p>
            ) : (
              // Con el filtro puesto, lo que no hay es una plantilla con ese estado: el filtro sigue a la vista, arriba.
              <EstadoVacio
                titulo={estado === 'ACTIVE' ? COPY_PLANTILLAS.ningunaActiva : COPY_PLANTILLAS.ningunaArchivada}
                accion={
                  <button type="button" className="boton boton--secundario" onClick={verTodas}>
                    {COPY_PLANTILLAS.verTodas}
                    <span className="visualmente-oculto"> las {COPY_PLANTILLAS.plantillasDeEntrenamiento.toLowerCase()}</span>
                  </button>
                }
              />
            )
          ) : (
            <ul className="lista">
              {lista.estado.items.map((p) => (
                <li key={p.templateId} className="lista__item">
                  <p className="lista__titulo">
                    {p.name} <span className="insignia">{p.state === 'ACTIVE' ? COPY_PLANTILLAS.activa : COPY_PLANTILLAS.archivada}</span>
                  </p>
                  {p.description ? <p>{p.description}</p> : null}
                  <p className="nota">
                    Versión {p.versionNumber} · {COPY_PLANTILLAS.sesiones(p.sessionCount)} · {p.copiedLoads ? COPY_PLANTILLAS.conCargas : COPY_PLANTILLAS.sinCargas} · {p.origin ? COPY_PLANTILLAS.origen(fecha(p.createdAt)) : COPY_PLANTILLAS.desdeCero} · actualizada el {fecha(p.updatedAt)}
                  </p>
                  <CambiosEnPreparacion preparacion={cambiosDe(preparaciones, p.templateId)} version={p.versionNumber} />
                  <div className="acciones lista__acciones">
                  <button type="button" className="boton boton--enlace" aria-expanded={abiertaId === p.templateId} onClick={() => detalle.antes(() => setAbiertaId(abiertaId === p.templateId ? null : p.templateId))}>
                    {abiertaId === p.templateId ? 'Cerrar' : 'Ver'}
                  </button>
                  <AccionesDeEdicion plantilla={p} preparacion={cambiosDe(preparaciones, p.templateId)} editor={abrirElEditor} />
                  </div>
                  {abiertaId === p.templateId ? (
                    <DetalleDePlantilla
                      token={token}
                      resumen={p}
                      sesionPerdida={sesionPerdida}
                      avisarSinGuardar={detalle.anotar}
                      onCambio={(texto) => {
                        setAviso({ tipo: 'exito', texto });
                        void lista.recargar();
                      }}
                    />
                  ) : null}
                </li>
              ))}
            </ul>
          )
        ) : null}
        <VerMas estado={lista.estado} onVerMas={lista.verMas} />
      </section>
      )}
      <MisPlantillasNutricionales token={token} sesionPerdida={sesionPerdida} />
      <MisHabitualesDeEntrenamiento token={token} sesionPerdida={sesionPerdida} />
      <MisHabitualesDeNutricion token={token} sesionPerdida={sesionPerdida} />
    </div>
  );
}

function DetalleDePlantilla({
  token,
  resumen,
  sesionPerdida,
  avisarSinGuardar,
  onCambio,
}: {
  token: string;
  resumen: ResumenDePlantillaDeEntrenamiento;
  sesionPerdida: (r: Resultado<unknown>) => boolean;
  avisarSinGuardar: (hay: boolean) => void;
  onCambio: (texto: string) => void;
}) {
  const [r, setR] = useState<Resultado<{ data: PlantillaDeEntrenamiento }> | null>(null);
  const [nombre, setNombre] = useState(resumen.name);
  const [descripcion, setDescripcion] = useState(resumen.description ?? '');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // ED-65: con el nombre o la descripción cambiados y sin guardar, salir pregunta, y cerrarlo desde la lista también.
  const sinGuardar = !!r?.ok && (nombre.trim() !== r.datos.data.name || (descripcion.trim() || null) !== r.datos.data.description);
  useCambiosParaSalir(sinGuardar, 'el nombre o la descripción de la plantilla');
  useAvisarALaLista(sinGuardar, avisarSinGuardar);
  // La carga va en un efecto: un estado que se cambia durante el render vuelve a renderizar sin fin.
  const cargar = useCallback(async () => {
    setR(null);
    const res = await api.consultarPlantillaDeEntrenamiento(token, resumen.templateId);
    if (sesionPerdida(res)) return;
    setR(res);
  }, [token, resumen.templateId, sesionPerdida]);
  useEffect(() => {
    void cargar();
  }, [cargar]);
  if (r === null) return <Cargando />;
  if (!r.ok) return <ErrorConReintento onReintentar={cargar} />;
  const p = r.datos.data;

  async function editar(cambios: { name?: string; description?: string | null; state?: 'ACTIVE' | 'ARCHIVED' }, texto: string) {
    setEnviando(true);
    setError(null);
    const res = await api.editarPlantillaDeEntrenamiento(token, p.templateId, { expectedVersion: p.version, ...cambios });
    setEnviando(false);
    if (sesionPerdida(res)) return;
    if (!res.ok) return setError(!res.ok && res.tipo === 'API' && res.codigo === 'TEMPLATE_NAME_TAKEN' ? COPY_PLANTILLAS.nombreTomado : mensajeDeFallo(res));
    onCambio(texto);
  }

  return (
    <div className="detalle-de-valores">
      {error ? (
        <Aviso tipo="error">
          <p>{error}</p>
        </Aviso>
      ) : null}
      <EstructuraAgrupada estructura={p.structure} ejercicios={p.exercises} />
      <VersionesDeLaPlantilla token={token} templateId={p.templateId} sesionPerdida={sesionPerdida} />
      <p className="nota" data-usar-con-una-persona>
        {PLT.usarConUnaPersona}
      </p>
      <h4>Nombre y descripción</h4>
      <Campo id={`tpl-${p.templateId}-nombre`} etiqueta={COPY_PLANTILLAS.nombre} value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={120} />
      <Campo id={`tpl-${p.templateId}-descripcion`} etiqueta={COPY_PLANTILLAS.descripcion} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} maxLength={1000} />
      <div className="acciones">
        <button type="button" className="boton boton--secundario" disabled={enviando || nombre.trim().length === 0 || (nombre.trim() === p.name && (descripcion.trim() || null) === p.description)} onClick={() => void editar({ name: nombre.trim(), description: descripcion.trim() || null }, 'Plantilla actualizada.')}>
          Guardar nombre y descripción
        </button>
        {p.state === 'ACTIVE' ? (
          <button type="button" className="boton boton--secundario" disabled={enviando} onClick={() => void editar({ state: 'ARCHIVED' }, 'Plantilla archivada. No se puede aplicar hasta reactivarla; los planes ya creados no cambian.')}>
            {COPY_PLANTILLAS.archivar}
          </button>
        ) : (
          <button type="button" className="boton boton--secundario" disabled={enviando} onClick={() => void editar({ state: 'ACTIVE' }, 'Plantilla reactivada.')}>
            {COPY_PLANTILLAS.reactivar}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── PLT (DL-182): lo que está en preparación y cómo se abre el editor ─────────────────────────────────────────────

type LecturaDePreparaciones = { readonly tipo: 'cargando' } | { readonly tipo: 'listo'; readonly lista: readonly ResumenDePreparacionDePlantilla[] } | { readonly tipo: 'falla' };

/** Las plantillas en preparación del profesional (API-TPL-08), todas: son pocas y la lista las necesita a todas. */
function usePreparaciones(token: string | null, sesionPerdida: (r: Resultado<unknown>) => boolean): LecturaDePreparaciones {
  const [lectura, setLectura] = useState<LecturaDePreparaciones>({ tipo: 'cargando' });
  useEffect(() => {
    if (!token) return;
    let vigente = true;
    void todasLasPaginas((f) => api.listarPreparacionesDePlantilla(token, f)).then((r) => {
      if (!vigente || sesionPerdida(r)) return;
      setLectura(r.ok ? { tipo: 'listo', lista: r.datos.data } : { tipo: 'falla' });
    });
    return () => {
      vigente = false;
    };
  }, [token, sesionPerdida]);
  return lectura;
}

const cambiosDe = (l: LecturaDePreparaciones, templateId: string): ResumenDePreparacionDePlantilla | null =>
  l.tipo === 'listo' ? (l.lista.find((x) => x.templateId === templateId) ?? null) : null;

/**
 * Abrir el editor: una plantilla nueva (API-TPL-06, en blanco o como copia de una versión) o los cambios de una existente
 * (API-TPL-07, que retoma los que ya hay). Cada pedido con su clave: un doble toque no crea dos.
 */
function useAbrirElEditor(token: string | null, sesionPerdida: (r: Resultado<unknown>) => boolean, alFallar: (texto: string) => void) {
  const router = useRouter();
  const antesDeSalir = useAntesDeSalir();
  const intento = useClaveDeIntento();
  const [abriendo, setAbriendo] = useState(false);
  const ir = (r: Resultado<{ data: { draftId: string } }>) => {
    intento.registrar(r);
    setAbriendo(false);
    if (sesionPerdida(r)) return;
    if (!r.ok) return alFallar(r.tipo === 'API' && r.codigo === 'TEMPLATE_ARCHIVED' ? PLT.archivada : mensajeDeFallo(r));
    antesDeSalir(() => router.push(hrefDelEditor(r.datos.data.draftId)));
  };
  return {
    abriendo,
    nueva: async (fromTemplateVersionId?: string) => {
      if (!token || abriendo) return;
      setAbriendo(true);
      ir(await api.crearPreparacionDePlantilla(token, fromTemplateVersionId ? { fromTemplateVersionId } : {}, intento.actual(fromTemplateVersionId ?? 'en-blanco')));
    },
    editar: async (templateId: string) => {
      if (!token || abriendo) return;
      setAbriendo(true);
      ir(await api.abrirPreparacionDePlantilla(token, templateId));
    },
  };
}
type AbrirElEditor = ReturnType<typeof useAbrirElEditor>;

/** Las plantillas nuevas en preparación: «Sin título» hasta tener nombre, con «Retomar». */
function EnPreparacion({ preparaciones }: { preparaciones: LecturaDePreparaciones }) {
  if (preparaciones.tipo === 'falla') return <p className="nota">{PLT.noSeLeyeronLasEnPreparacion}</p>;
  if (preparaciones.tipo !== 'listo') return null;
  const nuevas = preparaciones.lista.filter((x) => x.templateId === null);
  if (nuevas.length === 0) return null;
  return (
    <section className="plantillas-en-preparacion" aria-labelledby="titulo-en-preparacion" data-plantillas-en-preparacion>
      <h3 id="titulo-en-preparacion">{PLT.enPreparacion}</h3>
      <ul className="lista">
        {nuevas.map((x) => (
          <li key={x.draftId} className="lista__item" data-preparacion-nueva>
            <p className="lista__titulo">
              {x.name.trim() || PLT.sinTitulo} <span className="insignia">{PLT.nuevaEnPreparacion}</span>
            </p>
            <p className="nota">
              {COPY_PLANTILLAS.sesiones(x.sessionCount)} · {PLT.guardadaEl(fecha(x.updatedAt))}
            </p>
            <Enlace className="boton boton--secundario boton--compacto" href={hrefDelEditor(x.draftId)} data-retomar>
              {PLT.retomar}
            </Enlace>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Junto a una plantilla con cambios en preparación: la versión que se sigue usando y que hay cambios. */
function CambiosEnPreparacion({ preparacion, version }: { preparacion: ResumenDePreparacionDePlantilla | null; version: number }) {
  return preparacion ? (
    <p className="nota" data-cambios-en-preparacion>
      <Icono nombre="borrador" tamano={15} />
      {PLT.cambiosEnPreparacion(preparacion.baseVersionNumber ?? version)} · {PLT.guardadaEl(fecha(preparacion.updatedAt))}
    </p>
  ) : null;
}

/** «Editar» (o «Retomar los cambios») y «Crear otra desde esta». Una archivada se copia, pero no se edita. */
function AccionesDeEdicion({ plantilla, preparacion, editor }: { plantilla: ResumenDePlantillaDeEntrenamiento; preparacion: ResumenDePreparacionDePlantilla | null; editor: AbrirElEditor }) {
  return (
    <>
      {preparacion ? (
        <Enlace className="boton boton--secundario boton--compacto" href={hrefDelEditor(preparacion.draftId)} data-retomar-los-cambios>
          {PLT.retomarLosCambios}
        </Enlace>
      ) : plantilla.state === 'ACTIVE' ? (
        <button type="button" className="boton boton--secundario boton--compacto" disabled={editor.abriendo} onClick={() => void editor.editar(plantilla.templateId)} data-editar-la-plantilla>
          <Icono nombre="abrir" tamano={15} />
          {PLT.editar}
        </button>
      ) : null}
      <button type="button" className="boton boton--quieto boton--compacto" disabled={editor.abriendo} onClick={() => void editor.nueva(plantilla.versionId)} data-crear-otra-desde-esta>
        <Icono nombre="duplicar" tamano={15} />
        {PLT.crearOtraDesdeEsta}
      </button>
    </>
  );
}
