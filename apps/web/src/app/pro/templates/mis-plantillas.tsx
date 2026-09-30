'use client';

/**
 * «Mis plantillas» (PF-09; DL-108): las plantillas de plan de entrenamiento del profesional, solo las propias.
 * - Lista con estado, sesiones, cargas y fecha; filtro por estado; «Ver más» por cursor.
 * - Detalle en solo lectura: la estructura con los nombres vigentes de los ejercicios (`exercises`); un ejercicio que
 *   ya no está disponible se dice.
 * - Renombrar y describir, archivar y reactivar, con `expectedVersion`. La estructura no se edita acá: una versión
 *   nueva se guarda desde un plan («Guardar como plantilla»), que es donde el profesional la trabaja.
 */
import { COPY_PLANTILLAS, type EstructuraDePlanDeEntrenamientoEntrada, type PlantillaDeEntrenamiento, type ResumenDePlantillaDeEntrenamiento } from '@be/domain';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Cargando, ErrorConReintento, VerMas } from '../../../components/estados';
import { Aviso, Campo } from '../../../components/formulario';
import { api, type Resultado } from '../../../lib/api';
import { fecha } from '../../../lib/formato';
import { mensajeDeFallo } from '../../../lib/intento';
import { useListaPaginada } from '../../../lib/lista';
import { SinEspacioProfesional, useEspacioProfesional } from '../espacio-profesional';

type Estado = 'ACTIVE' | 'ARCHIVED';

export function MisPlantillas() {
  const { token, sesionPerdida, yo, cargarYo } = useEspacioProfesional('/pro/templates');
  const [estado, setEstado] = useState<Estado | ''>('');
  const [abiertaId, setAbiertaId] = useState<string | null>(null);
  const [aviso, setAviso] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);
  const listo = yo.tipo === 'listo';
  const lista = useListaPaginada(
    useMemo(() => (token && listo ? (cursor?: string) => api.listarPlantillasDeEntrenamiento(token, { ...(estado ? { state: estado } : {}), ...(cursor ? { cursor } : {}) }) : null), [token, listo, estado]),
    sesionPerdida,
  );

  if (!token) return <p className="nota">Redirigiendo a Iniciar sesión…</p>;
  if (yo.tipo === 'cargando') return <Cargando />;
  if (yo.tipo === 'error') return <ErrorConReintento onReintentar={cargarYo} />;
  if (yo.tipo === 'sin-espacio') return <SinEspacioProfesional />;

  return (
    <div className="secciones">
      {aviso ? (
        <Aviso tipo={aviso.tipo} enfocar>
          <p>{aviso.texto}</p>
        </Aviso>
      ) : null}
      <section className="seccion" aria-labelledby="titulo-plantillas">
        <h2 id="titulo-plantillas">{COPY_PLANTILLAS.misPlantillas}</h2>
        <p className="nota">{COPY_PLANTILLAS.soloTuya}</p>
        <div className="campo">
          <label htmlFor="plantillas-estado">Estado</label>
          <select id="plantillas-estado" value={estado} onChange={(e) => setEstado(e.target.value as Estado | '')}>
            <option value="">Todas</option>
            <option value="ACTIVE">{COPY_PLANTILLAS.activa}</option>
            <option value="ARCHIVED">{COPY_PLANTILLAS.archivada}</option>
          </select>
        </div>
        {lista.estado.tipo === 'cargando' ? <Cargando /> : null}
        {lista.estado.tipo === 'error' ? <ErrorConReintento onReintentar={lista.recargar} /> : null}
        {lista.estado.tipo === 'listo' ? (
          lista.estado.items.length === 0 ? (
            <p>{COPY_PLANTILLAS.sinPlantillas}</p>
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
                  <button type="button" className="boton boton--enlace" aria-expanded={abiertaId === p.templateId} onClick={() => setAbiertaId(abiertaId === p.templateId ? null : p.templateId)}>
                    {abiertaId === p.templateId ? 'Cerrar' : 'Ver'}
                  </button>
                  {abiertaId === p.templateId ? (
                    <DetalleDePlantilla
                      token={token}
                      resumen={p}
                      sesionPerdida={sesionPerdida}
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
    </div>
  );
}

function DetalleDePlantilla({ token, resumen, sesionPerdida, onCambio }: { token: string; resumen: ResumenDePlantillaDeEntrenamiento; sesionPerdida: (r: Resultado<unknown>) => boolean; onCambio: (texto: string) => void }) {
  const [r, setR] = useState<Resultado<{ data: PlantillaDeEntrenamiento }> | null>(null);
  const [nombre, setNombre] = useState(resumen.name);
  const [descripcion, setDescripcion] = useState(resumen.description ?? '');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
      <Estructura estructura={p.structure} ejercicios={p.exercises} />
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

/** La estructura de una plantilla, en solo lectura, con los nombres vigentes del catálogo. */
function Estructura({ estructura, ejercicios }: { estructura: EstructuraDePlanDeEntrenamientoEntrada; ejercicios: PlantillaDeEntrenamiento['exercises'] }) {
  const sesion = (s: NonNullable<EstructuraDePlanDeEntrenamientoEntrada['blocks'][number]['sessions']>[number], clave: string) => (
    <div key={clave} className="nodo nodo--comida">
      <h4>{s.label}</h4>
      {s.instructions ? <p className="nota">{s.instructions}</p> : null}
      <ul>
        {s.prescriptions.map((p, i) => {
          const e = ejercicios[p.exerciseVersionId];
          return (
            <li key={p.prescriptionId ?? `${clave}-${i}`}>
              <strong>{e ? e.exerciseName : 'Ejercicio no disponible en el catálogo'}</strong>
              {e && !e.available ? <span className="insignia"> no disponible</span> : null}
              <ul className="lista-compacta">
                <li>
                  {p.sets.length} {p.sets.length === 1 ? 'serie' : 'series'}
                  {p.sets.length > 0 ? `: ${p.sets.map((x) => (x.repetitions === null ? '—' : 'value' in x.repetitions ? String(x.repetitions.value) : `${x.repetitions.min}-${x.repetitions.max}`)).join(' · ')} repeticiones` : ''}
                </li>
                {p.intensity ? <li>Intensidad: {p.intensity.criterion} {p.intensity.target.value}</li> : null}
                {p.suggestedLoad ? (
                  <li>
                    Carga de referencia: {p.suggestedLoad.value} {p.suggestedLoad.unit}
                  </li>
                ) : null}
                {p.note ? <li>Nota: {p.note}</li> : null}
              </ul>
            </li>
          );
        })}
      </ul>
    </div>
  );
  return (
    <>
      {estructura.blocks.map((b, i) => (
        <div key={b.blockId ?? i} className="nodo nodo--dia">
          <h3>
            {b.label}
            {b.purpose ? <span className="nota"> · {b.purpose}</span> : null}
          </h3>
          {(b.microcycles ?? []).map((m, j) => (
            <div key={m.microcycleId ?? j} className="nodo nodo--opcion">
              <p className="lista__titulo">
                {m.label}
                {m.purpose ? ` · ${m.purpose}` : ''}
              </p>
              {m.sessions.map((s, k) => sesion(s, `${i}-${j}-${k}`))}
            </div>
          ))}
          {(b.sessions ?? []).map((s, k) => sesion(s, `${i}-${k}`))}
        </div>
      ))}
    </>
  );
}
