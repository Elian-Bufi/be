'use client';

/**
 * «Mis habituales» de nutrición (PF-09 bis; DL-109), en la misma página que las plantillas:
 * - **Comidas habituales**: lista con alimentos, cantidades y fecha; detalle desplegable con las opciones y cada
 *   alimento por su nombre vigente (uno que ya no esté disponible se dice); renombrar en línea y «Quitar», con
 *   `expectedVersion`. La estructura no se edita acá: se vuelve a guardar desde una comida del borrador, que reemplaza.
 * - **Alimentos habituales**: la lista de los marcados en el buscador, con «Quitar».
 * Un profesional sin Nutrición recibe 403: la sección no es para él y se omite (mostrar u ocultar no autoriza nada).
 */
import { cantidad, COPY_HABITUALES, ETIQUETA_DE_PREPARACION, type ComidaHabitual, type ElementoDeCatalogo } from '@be/domain';
import { useEffect, useMemo, useState } from 'react';
import { Ayuda, AvisoFlotante } from '../../../components/ayuda';
import { Cargando, ErrorConReintento, VerMas } from '../../../components/estados';
import { Aviso, Campo } from '../../../components/formulario';
import { api, type Resultado } from '../../../lib/api';
import { fecha } from '../../../lib/formato';
import { mensajeDeFallo } from '../../../lib/intento';
import { useListaPaginada } from '../../../lib/lista';

const esProhibido = (r: Resultado<unknown>) => !r.ok && r.tipo === 'API' && r.codigo === 'ACTION_FORBIDDEN';
/** Referencia estable: `useListaPaginada` la tiene entre sus dependencias, y una función nueva por render recargaría sin fin. */
const NUNCA_PERDIDA = (_r: Resultado<unknown>): boolean => false;

export function MisHabitualesDeNutricion({ token, sesionPerdida = NUNCA_PERDIDA }: { token: string; sesionPerdida?: (r: Resultado<unknown>) => boolean }) {
  const [sinArea, setSinArea] = useState(false);
  const [aviso, setAviso] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);
  const [abiertaId, setAbiertaId] = useState<string | null>(null);
  const comidas = useListaPaginada(
    useMemo(
      () => (cursor?: string) =>
        api.listarComidasHabituales(token, cursor ? { cursor } : {}).then((r) => {
          if (esProhibido(r)) setSinArea(true);
          return r;
        }),
      [token],
    ),
    sesionPerdida,
  );
  const [alimentos, setAlimentos] = useState<Resultado<{ data: readonly ElementoDeCatalogo[] }> | null>(null);
  const [alimentosGeneracion, setAlimentosGeneracion] = useState(0);
  useEffect(() => {
    let vigente = true;
    setAlimentos(null);
    void api.listarAlimentosHabituales(token).then((r) => {
      if (!vigente || sesionPerdida(r)) return;
      if (esProhibido(r)) setSinArea(true);
      setAlimentos(r);
    });
    return () => {
      vigente = false;
    };
  }, [token, sesionPerdida, alimentosGeneracion]);

  if (sinArea) return null;

  async function quitarAlimento(el: ElementoDeCatalogo) {
    const r = await api.marcarAlimentoHabitual(token, el.catalogItemId, { state: 'REMOVED' });
    if (sesionPerdida(r)) return;
    if (!r.ok) return setAviso({ tipo: 'error', texto: mensajeDeFallo(r) });
    setAlimentos((a) => (a && a.ok ? { ok: true, datos: { data: a.datos.data.filter((x) => x.catalogItemId !== el.catalogItemId) } } : a));
    setAviso({ tipo: 'exito', texto: COPY_HABITUALES.quitado });
  }

  return (
    <section className="seccion" aria-labelledby="titulo-habituales-nutricion">
      <h2 id="titulo-habituales-nutricion">{COPY_HABITUALES.misHabituales} de nutrición</h2>
      <Ayuda titulo="Quién ve tus habituales">
        <p>{COPY_HABITUALES.soloTuyos}</p>
      </Ayuda>
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

      <h3 id="titulo-comidas-habituales">{COPY_HABITUALES.comidasHabituales}</h3>
      {comidas.estado.tipo === 'cargando' ? <Cargando /> : null}
      {comidas.estado.tipo === 'error' ? <ErrorConReintento onReintentar={comidas.recargar} /> : null}
      {comidas.estado.tipo === 'listo' ? (
        comidas.estado.items.length === 0 ? (
          <p>{COPY_HABITUALES.sinComidas}</p>
        ) : (
          <ul className="lista" aria-labelledby="titulo-comidas-habituales">
            {comidas.estado.items.map((c) => (
              <li key={c.presetId} className="lista__item">
                <p className="lista__titulo">{c.name}</p>
                <p className="nota">
                  {COPY_HABITUALES.alimentos(c.itemCount)} · {c.copiedQuantities ? COPY_HABITUALES.conCantidades : COPY_HABITUALES.sinCantidades} · {COPY_HABITUALES.actualizada(fecha(c.updatedAt))}
                </p>
                <button type="button" className="boton boton--enlace" aria-expanded={abiertaId === c.presetId} onClick={() => setAbiertaId(abiertaId === c.presetId ? null : c.presetId)}>
                  {abiertaId === c.presetId ? 'Cerrar' : 'Ver'}
                </button>
                {abiertaId === c.presetId ? (
                  <DetalleDeComida
                    token={token}
                    comida={c}
                    sesionPerdida={sesionPerdida}
                    onCambio={(texto) => {
                      setAviso({ tipo: 'exito', texto });
                      void comidas.recargar();
                    }}
                  />
                ) : null}
              </li>
            ))}
          </ul>
        )
      ) : null}
      <VerMas estado={comidas.estado} onVerMas={comidas.verMas} />

      <h3 id="titulo-alimentos-habituales">{COPY_HABITUALES.alimentosHabituales}</h3>
      {alimentos === null ? <Cargando /> : null}
      {alimentos && !alimentos.ok ? <ErrorConReintento onReintentar={() => setAlimentosGeneracion((g) => g + 1)} /> : null}
      {alimentos && alimentos.ok ? (
        alimentos.datos.data.length === 0 ? (
          <p>{COPY_HABITUALES.sinAlimentosHabituales}</p>
        ) : (
          <ul className="lista" aria-labelledby="titulo-alimentos-habituales">
            {alimentos.datos.data.map((el) => (
              <li key={el.catalogItemId} className="lista__item">
                <span>
                  {el.name} · {cantidad(el.composition.energyKcal, 'kcal')} cada {el.composition.referenceAmount === '100ml' ? '100 ml' : '100 g'}
                </span>
                <button type="button" className="boton boton--enlace" aria-label={`${COPY_HABITUALES.quitar}: ${el.name}`} onClick={() => void quitarAlimento(el)}>
                  {COPY_HABITUALES.quitar}
                </button>
              </li>
            ))}
          </ul>
        )
      ) : null}
    </section>
  );
}

function DetalleDeComida({ token, comida: c, sesionPerdida, onCambio }: { token: string; comida: ComidaHabitual; sesionPerdida: (r: Resultado<unknown>) => boolean; onCambio: (texto: string) => void }) {
  const [nombre, setNombre] = useState(c.name);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function editar(cambios: { name?: string; state?: 'REMOVED' }, texto: string) {
    setEnviando(true);
    setError(null);
    const r = await api.editarComidaHabitual(token, c.presetId, { expectedVersion: c.version, ...cambios });
    setEnviando(false);
    if (sesionPerdida(r)) return;
    if (!r.ok) return setError(r.tipo === 'API' && r.codigo === 'PRESET_NAME_TAKEN' ? COPY_HABITUALES.nombreTomado : mensajeDeFallo(r));
    onCambio(texto);
  }

  return (
    <div className="detalle-de-valores">
      {error ? (
        <Aviso tipo="error">
          <p>{error}</p>
        </Aviso>
      ) : null}
      <p className="nota">{c.structure.prescriptionMode === 'DISH_OPTIONS' ? 'Opciones de plato' : 'Porciones de intercambio'}</p>
      {c.structure.options.map((o, k) => (
        <div key={o.optionId ?? k} className="nodo nodo--opcion">
          <p className="lista__titulo">{o.label}</p>
          <ul className="lista-compacta">
            {o.items.map((it, l) => {
              const e = c.items[it.catalogItemId];
              return (
                <li key={it.itemId ?? l}>
                  <strong>{e ? e.name : 'Alimento no disponible en el catálogo'}</strong>
                  {e && !e.available ? ` · ${COPY_HABITUALES.elementoNoDisponible}` : ''}
                  {it.quantity ? ` · ${cantidad(it.quantity.value, it.quantity.unit)}` : ` · ${COPY_HABITUALES.sinCantidades.toLowerCase()}`}
                  {it.preparationState ? ` · ${ETIQUETA_DE_PREPARACION[it.preparationState]}` : ''}
                  {it.note ? ` · ${it.note}` : ''}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      <Campo id={`hab-${c.presetId}-nombre`} etiqueta={COPY_HABITUALES.nombre} value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={120} />
      <div className="acciones">
        <button type="button" className="boton boton--secundario" disabled={enviando || nombre.trim().length === 0 || nombre.trim() === c.name} onClick={() => void editar({ name: nombre.trim() }, 'Comida habitual renombrada.')}>
          {COPY_HABITUALES.renombrar}
        </button>
        <button type="button" className="boton boton--secundario" disabled={enviando} onClick={() => void editar({ state: 'REMOVED' }, COPY_HABITUALES.quitado)}>
          {COPY_HABITUALES.quitar}
        </button>
      </div>
    </div>
  );
}
