'use client';

/**
 * El Recetario de BE en el website (DL-191; WP-RECETARIO-E-IMAGENES, REC-05 y REC-06): las recetas que curó BE, a la vista
 * de todos los profesionales de Nutrición y de solo lectura.
 * - **La lista** lee todo el recetario (API-RCT-01, de a 50) y lo filtra por nombre mientras se escribe, sin tildes ni
 *   mayúsculas, como el cajón del plan. Cada tarjeta muestra la miniatura con la ruta que vino firmada en la lista: no
 *   pide un acceso por imagen (REC-D10). Sin foto, el ícono de la comida.
 * - **El detalle** (API-REC-03) muestra la receta entera, con la imagen grande y su procedencia, y no se edita.
 * - **«Copiar a Mis recetas»** (API-RCT-02) crea una receta propia con la misma imagen (el mismo medio): la copia se edita
 *   como cualquier receta propia y la del recetario no cambia. Con su clave de intento: un reintento no crea otra.
 * - Lo que dice al copiar va en el aviso flotante de la página, que no corre nada (RP-19); un error, en un renglón que
 *   ocupa su lugar desde el principio.
 * Lo largo («Qué es el Recetario de BE») va detrás de «?».
 */
import {
  COPY_RECETARIO,
  COPY_RECETAS,
  ETIQUETA_DE_PREPARACION,
  ETIQUETA_DE_PROCEDENCIA_DE_IMAGEN,
  cantidad,
  nutrienteParaMostrar,
  type DetalleDeRecetaResponse,
  type Receta,
} from '@be/domain';
import { useCallback, useEffect, useState } from 'react';
import { Cargando, ErrorConReintento } from '../../../components/estados';
import { ExplicacionAPedido } from '../../../components/explicacion-a-pedido';
import { Campo } from '../../../components/formulario';
import { Icono } from '../../../components/icono';
import { api, type Resultado } from '../../../lib/api';
import { mensajeDeFallo, useClaveDeIntento } from '../../../lib/intento';
import { recetasQueCoinciden } from '../advisees/nutrition/recetas-para-elegir';
import { TablaDeCalculo } from './calculo-de-receta';
import { ImagenGuardada } from './imagen-de-receta';

/** Cuántas páginas de 50 se leen como mucho: el recetario de BE no es un inventario infinito. */
const PAGINAS_DEL_RECETARIO = 6;

type Sesion = { readonly token: string; readonly sesionPerdida: (r: Resultado<unknown>) => boolean };

/** Todo el recetario, de a 50, hasta `PAGINAS_DEL_RECETARIO` páginas. */
export function useRecetarioDeBe({ token, sesionPerdida }: Sesion) {
  const [estado, setEstado] = useState<{ tipo: 'cargando' } | { tipo: 'error'; texto: string } | { tipo: 'lista'; recetas: readonly Receta[] }>({ tipo: 'cargando' });
  const cargar = useCallback(async () => {
    setEstado({ tipo: 'cargando' });
    const leidas: Receta[] = [];
    let cursor: string | undefined;
    for (let pagina = 0; pagina < PAGINAS_DEL_RECETARIO; pagina++) {
      const r = await api.recetarioDeBe(token, { limit: '50', ...(cursor ? { cursor } : {}) });
      if (sesionPerdida(r)) return;
      if (!r.ok) return setEstado({ tipo: 'error', texto: r.tipo === 'API' && r.codigo === 'ACTION_FORBIDDEN' ? COPY_RECETAS.soloNutricion : mensajeDeFallo(r) });
      leidas.push(...r.datos.data);
      cursor = r.datos.page.hasMore ? (r.datos.page.nextCursor ?? undefined) : undefined;
      if (!cursor) break;
    }
    setEstado({ tipo: 'lista', recetas: leidas });
  }, [token, sesionPerdida]);
  useEffect(() => {
    void cargar();
  }, [cargar]);
  return { estado, recargar: cargar };
}

/**
 * «Copiar a Mis recetas», con una clave de intento por receta: el reintento de un resultado incierto reusa la suya y la
 * API responde la misma copia.
 */
export function useCopiarDelRecetario({ token, sesionPerdida }: Sesion, alCopiar: (copia: Receta, origen: Receta) => void) {
  const intento = useClaveDeIntento();
  const [copiando, setCopiando] = useState<string | null>(null);
  const [fallo, setFallo] = useState<{ readonly recetaId: string; readonly texto: string } | null>(null);
  async function copiar(origen: Receta) {
    setCopiando(origen.recipeId);
    setFallo(null);
    const r = await api.copiarRecetaDelRecetario(token, origen.recipeId, intento.actual(origen.recipeId));
    intento.registrar(r);
    setCopiando(null);
    if (sesionPerdida(r)) return;
    if (!r.ok) return setFallo({ recetaId: origen.recipeId, texto: mensajeDeFallo(r) });
    alCopiar(r.datos.data, origen);
  }
  return { copiar, copiando, fallo };
}

/** Lo que explica el recetario, a pedido. */
export function QueEsElRecetario() {
  return (
    <ExplicacionAPedido nombre={`Qué es el ${COPY_RECETARIO.recetarioDeBe}`} como="div">
      <p>{COPY_RECETARIO.queEs}</p>
      <p>{COPY_RECETAS.avisoDeImagen}</p>
    </ExplicacionAPedido>
  );
}

export function RecetarioDeBe({ token, sesionPerdida, onAbrir, onCopiada }: Sesion & { onAbrir: (recetaId: string) => void; onCopiada: (copia: Receta, origen: Receta) => void }) {
  const { estado, recargar } = useRecetarioDeBe({ token, sesionPerdida });
  const { copiar, copiando, fallo } = useCopiarDelRecetario({ token, sesionPerdida }, onCopiada);
  const [texto, setTexto] = useState('');
  if (estado.tipo === 'cargando') return <Cargando />;
  if (estado.tipo === 'error') return <ErrorConReintento onReintentar={() => void recargar()} />;
  if (estado.recetas.length === 0) return <p>{COPY_RECETARIO.sinRecetas}</p>;
  const visibles = recetasQueCoinciden(estado.recetas, texto);
  return (
    <div className="recetario" data-recetario-de-be>
      <Campo id="buscar-en-el-recetario" type="search" autoComplete="off" etiqueta={COPY_RECETARIO.buscar} ayuda="Por su nombre. No importan las tildes." value={texto} onChange={(e) => setTexto(e.target.value)} />
      <p className="nota" role="status">
        {visibles.length === 0 ? COPY_RECETARIO.ninguna(texto) : visibles.length === estado.recetas.length ? `${estado.recetas.length} recetas` : `${visibles.length} de ${estado.recetas.length} recetas`}
      </p>
      <ul className="lista lista--recetas">
        {visibles.map((r) => (
          <li key={r.recipeId} className="lista__item tarjeta-de-receta" data-receta-del-recetario={r.recipeId}>
            <ImagenGuardada token={token} medioId={r.image?.mediaId ?? null} nombre={r.name} sesionPerdida={sesionPerdida} chica rutas={r.image?.paths ?? null} />
            <div>
              <p className="lista__titulo">{r.name}</p>
              <p className="nota">{COPY_RECETAS.porcionesYEnergia(r.servings, nutrienteParaMostrar(r.calculation.perServing.energyKcal, 'energyKcal'))}</p>
              <div className="acciones acciones--compactas">
                <button type="button" className="boton boton--enlace" onClick={() => onAbrir(r.recipeId)}>
                  {COPY_RECETAS.abrir} {r.name}
                </button>
                <button type="button" className="boton boton--secundario boton--compacto" disabled={copiando !== null} onClick={() => void copiar(r)} data-copiar-a-mis-recetas>
                  <Icono nombre="mas" tamano={18} />
                  {copiando === r.recipeId ? COPY_RECETARIO.copiando : COPY_RECETARIO.copiar}
                  <span className="visualmente-oculto"> {r.name}</span>
                </button>
              </div>
              {/* El renglón del error ocupa su lugar desde el principio: que aparezca no corre la lista (RP-19). */}
              <p className="nota nota--error recetario__lugar-del-aviso" role="alert">
                {fallo?.recetaId === r.recipeId ? fallo.texto : ''}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** El detalle de una receta del Recetario de BE, de solo lectura, con «Copiar a Mis recetas». */
export function DetalleDelRecetario({ token, sesionPerdida, recetaId, onVolver, onCopiada }: Sesion & { recetaId: string; onVolver: () => void; onCopiada: (copia: Receta, origen: Receta) => void }) {
  const [estado, setEstado] = useState<{ tipo: 'cargando' } | { tipo: 'error' } | { tipo: 'no-disponible' } | { tipo: 'lista'; receta: DetalleDeRecetaResponse['data'] }>({ tipo: 'cargando' });
  const { copiar, copiando, fallo } = useCopiarDelRecetario({ token, sesionPerdida }, onCopiada);
  const cargar = useCallback(async () => {
    setEstado({ tipo: 'cargando' });
    const r = await api.consultarReceta(token, recetaId);
    if (sesionPerdida(r)) return;
    if (!r.ok) return setEstado(r.tipo === 'API' && r.codigo === 'RESOURCE_NOT_FOUND' ? { tipo: 'no-disponible' } : { tipo: 'error' });
    setEstado({ tipo: 'lista', receta: r.datos.data });
  }, [token, recetaId, sesionPerdida]);
  useEffect(() => {
    void cargar();
  }, [cargar]);
  const volver = (
    <p>
      <button type="button" className="boton boton--enlace" onClick={onVolver}>
        ← Volver al {COPY_RECETARIO.recetarioDeBe}
      </button>
    </p>
  );
  if (estado.tipo === 'cargando') return <Cargando />;
  if (estado.tipo === 'error') return <ErrorConReintento onReintentar={() => void cargar()} />;
  if (estado.tipo === 'no-disponible') return <>{volver}<p>No pudimos abrir esta receta.</p></>;
  const r = estado.receta;
  const nombres = Object.fromEntries(r.ingredients.map((i) => [String(i.order), i.name]));
  return (
    <div className="secciones" data-detalle-del-recetario>
      {volver}
      <h2>
        {r.name} <span className="insignia">{COPY_RECETARIO.deBe}</span>
      </h2>
      <p className="nota">
        {COPY_RECETARIO.soloLectura} <QueEsElRecetario />
      </p>
      <div className="acciones">
        <button type="button" className="boton boton--primario" disabled={copiando !== null} onClick={() => void copiar(r)} data-copiar-a-mis-recetas>
          {copiando ? COPY_RECETARIO.copiando : COPY_RECETARIO.copiar}
        </button>
      </div>
      <p className="nota nota--error recetario__lugar-del-aviso" role="alert">
        {fallo ? fallo.texto : ''}
      </p>
      <section className="seccion" aria-label={COPY_RECETAS.imagenDeReferencia}>
        {r.image ? (
          <figure className="figura-de-receta">
            <ImagenGuardada token={token} medioId={r.image.mediaId} nombre={r.name} sesionPerdida={sesionPerdida} variante="large" rutas={r.image.paths ?? null} />
            <figcaption className="nota">
              {COPY_RECETAS.imagenDeReferencia} · {ETIQUETA_DE_PROCEDENCIA_DE_IMAGEN[r.image.provenance]}
              {r.image.authorship ? ` · ${r.image.authorship}` : ''}
            </figcaption>
          </figure>
        ) : (
          <ImagenGuardada token={token} medioId={null} nombre={r.name} sesionPerdida={sesionPerdida} />
        )}
      </section>
      <section className="seccion" aria-labelledby="recetario-datos">
        <h3 id="recetario-datos">Datos</h3>
        <p>{r.description ?? 'Sin indicar'}</p>
        <p className="nota">{COPY_RECETAS.porcionesYEnergia(r.servings, nutrienteParaMostrar(r.calculation.perServing.energyKcal, 'energyKcal'))}</p>
      </section>
      <section className="seccion" aria-labelledby="recetario-ingredientes">
        <h3 id="recetario-ingredientes">{COPY_RECETAS.ingredientes}</h3>
        <ul className="lista-compacta">
          {r.ingredients.map((i) => (
            <li key={i.order}>
              {i.name} · {cantidad(i.quantity.value, i.quantity.unit)} · {ETIQUETA_DE_PREPARACION[i.preparationState]}
            </li>
          ))}
        </ul>
      </section>
      <section className="seccion" aria-labelledby="recetario-calculo">
        <h3 id="recetario-calculo">{COPY_RECETAS.calculo}</h3>
        <TablaDeCalculo calculo={r.calculation} nombres={nombres} />
      </section>
      <section className="seccion" aria-labelledby="recetario-pasos">
        <h3 id="recetario-pasos">Preparación</h3>
        {r.steps.length === 0 ? (
          <p>Sin indicar</p>
        ) : (
          <ol>
            {r.steps.map((p, n) => (
              <li key={n}>{p}</li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
