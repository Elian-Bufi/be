'use client';

/** «Mis plantillas» de comidas (PF-09; DL-108): la misma sección que la de entrenamiento, con la estructura de días tipo → comidas → opciones → alimentos. */
import { cantidad, COPY_PLANTILLAS, ETIQUETA_DE_PREPARACION, type EstructuraDePlanEntrada, type PlantillaNutricional, type ResumenDePlantillaNutricional } from '@be/domain';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AvisoFlotante } from '../../../components/ayuda';
import { Cargando, ErrorConReintento, VerMas } from '../../../components/estados';
import { Aviso, Campo } from '../../../components/formulario';
import { api, type Resultado } from '../../../lib/api';
import { fecha } from '../../../lib/formato';
import { mensajeDeFallo } from '../../../lib/intento';
import { useListaPaginada } from '../../../lib/lista';

type Estado = 'ACTIVE' | 'ARCHIVED';

export function MisPlantillasNutricionales({ token, sesionPerdida }: { token: string; sesionPerdida: (r: Resultado<unknown>) => boolean }) {
  const [estado, setEstado] = useState<Estado | ''>('');
  const [abiertaId, setAbiertaId] = useState<string | null>(null);
  const [aviso, setAviso] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);
  const lista = useListaPaginada(
    useMemo(() => (cursor?: string) => api.listarPlantillasNutricionales(token, { ...(estado ? { state: estado } : {}), ...(cursor ? { cursor } : {}) }), [token, estado]),
    sesionPerdida,
  );
  // Un profesional sin Nutrición recibe 403: la sección no es para él y no se muestra (el enlace no autoriza nada).
  if (lista.estado.tipo === 'error') return null;
  return (
    <section className="seccion" aria-labelledby="titulo-plantillas-nutricion">
      <h2 id="titulo-plantillas-nutricion">{COPY_PLANTILLAS.plantillasDeNutricion}</h2>
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
      <div className="campo">
        <label htmlFor="plantillas-nutricion-estado">Estado</label>
        <select id="plantillas-nutricion-estado" value={estado} onChange={(e) => setEstado(e.target.value as Estado | '')}>
          <option value="">Todas</option>
          <option value="ACTIVE">{COPY_PLANTILLAS.activa}</option>
          <option value="ARCHIVED">{COPY_PLANTILLAS.archivada}</option>
        </select>
      </div>
      {lista.estado.tipo === 'cargando' ? <Cargando /> : null}
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
                  Versión {p.versionNumber} · {COPY_PLANTILLAS.comidas(p.mealCount)} · {p.copiedQuantities ? COPY_PLANTILLAS.conCantidades : COPY_PLANTILLAS.sinCantidades} · {p.origin ? COPY_PLANTILLAS.origen(fecha(p.createdAt)) : COPY_PLANTILLAS.desdeCero} · actualizada el {fecha(p.updatedAt)}
                </p>
                <button type="button" className="boton boton--enlace" aria-expanded={abiertaId === p.templateId} onClick={() => setAbiertaId(abiertaId === p.templateId ? null : p.templateId)}>
                  {abiertaId === p.templateId ? 'Cerrar' : 'Ver'}
                </button>
                {abiertaId === p.templateId ? (
                  <DetalleNutricional
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
  );
}

function DetalleNutricional({ token, resumen, sesionPerdida, onCambio }: { token: string; resumen: ResumenDePlantillaNutricional; sesionPerdida: (r: Resultado<unknown>) => boolean; onCambio: (texto: string) => void }) {
  const [r, setR] = useState<Resultado<{ data: PlantillaNutricional }> | null>(null);
  const [nombre, setNombre] = useState(resumen.name);
  const [descripcion, setDescripcion] = useState(resumen.description ?? '');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cargar = useCallback(async () => {
    setR(null);
    const res = await api.consultarPlantillaNutricional(token, resumen.templateId);
    if (sesionPerdida(res)) return;
    setR(res);
  }, [token, resumen.templateId, sesionPerdida]);
  useEffect(() => {
    void cargar();
  }, [cargar]);
  if (r === null) return <Cargando />;
  if (!r.ok) return <ErrorConReintento onReintentar={cargar} />;
  const p = r.datos.data;

  async function editar(cambios: { name?: string; description?: string | null; state?: Estado }, texto: string) {
    setEnviando(true);
    setError(null);
    const res = await api.editarPlantillaNutricional(token, p.templateId, { expectedVersion: p.version, ...cambios });
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
      <EstructuraDeComidas estructura={p.structure} elementos={p.items} />
      <h4>Nombre y descripción</h4>
      <Campo id={`tpn-${p.templateId}-nombre`} etiqueta={COPY_PLANTILLAS.nombre} value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={120} />
      <Campo id={`tpn-${p.templateId}-descripcion`} etiqueta={COPY_PLANTILLAS.descripcion} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} maxLength={1000} />
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

function EstructuraDeComidas({ estructura, elementos }: { estructura: EstructuraDePlanEntrada; elementos: PlantillaNutricional['items'] }) {
  return (
    <>
      {estructura.dayTypes.map((d, i) => (
        <div key={d.dayTypeId ?? i} className="nodo nodo--dia">
          <h3>{d.label}</h3>
          {d.meals.map((m, j) => (
            <div key={m.mealId ?? j} className="nodo nodo--comida">
              <h4>
                {m.label} <span className="nota">· {m.prescriptionMode === 'DISH_OPTIONS' ? 'opciones de plato' : 'porciones de intercambio'}</span>
              </h4>
              {m.options.map((o, k) => (
                <div key={o.optionId ?? k} className="nodo nodo--opcion">
                  <p className="lista__titulo">{o.label}</p>
                  <ul className="lista-compacta">
                    {o.items.map((it, l) => {
                      const e = elementos[it.catalogItemId];
                      return (
                        <li key={it.itemId ?? l}>
                          <strong>{e ? e.name : 'Alimento no disponible en el catálogo'}</strong>
                          {it.quantity ? ` · ${cantidad(it.quantity.value, it.quantity.unit)}` : ` · ${COPY_PLANTILLAS.sinCantidades.toLowerCase()}`}
                          {it.preparationState ? ` · ${ETIQUETA_DE_PREPARACION[it.preparationState]}` : ''}
                          {it.note ? ` · ${it.note}` : ''}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}
    </>
  );
}
