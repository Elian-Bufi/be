'use client';

/**
 * DL-191 (WP-RECETARIO-E-IMAGENES, REC-04 y REC-05) · las recetas en el cajón «Agregar receta como opción» del editor del
 * plan de Nutrición:
 * - **La imagen, donde se elige la receta.** Cada receta propia muestra su miniatura y «Cargar la imagen» (o «Cambiar la
 *   imagen»), que abre en el mismo renglón el recuadro de siempre (`ImagenDeReceta`). La imagen es de la receta: cambiarla
 *   acá la cambia en Mis recetas y en los planes que la ofrecen.
 * - **El Recetario de BE en el cajón**: sus recetas, con la miniatura ya firmada, para agregarlas tal cual como opción o
 *   copiarlas a Mis recetas. Se lee solo si se elige esa pestaña.
 * Lo que dice cada acción va en un renglón que ocupa su lugar desde el principio (RP-19): nada se corre al aparecer.
 */
import { COPY_RECETARIO, COPY_RECETAS, nutrienteParaMostrar, type Receta } from '@be/domain';
import { useState, type ReactNode } from 'react';
import { Cargando } from '../../../components/estados';
import { Aviso } from '../../../components/formulario';
import { Icono } from '../../../components/icono';
import type { Resultado } from '../../../lib/api';
import { recetasQueCoinciden } from '../advisees/nutrition/recetas-para-elegir';
import { ImagenDeReceta, ImagenGuardada } from './imagen-de-receta';
import { QueEsElRecetario, useCopiarDelRecetario, useRecetarioDeBe } from './recetario-de-be';

type Sesion = { readonly token: string; readonly sesionPerdida: (r: Resultado<unknown>) => boolean };

/** La miniatura de una receta en el cajón y, si es propia, cargar o cambiar su imagen sin salir del plan. */
export function ImagenEnElCajon({ token, sesionPerdida, receta, onCambio }: Sesion & { receta: Receta; onCambio: (r: Receta) => void }) {
  const [abierta, setAbierta] = useState(false);
  const propia = receta.origin === 'OWN';
  return (
    <div className="receta-en-el-cajon__imagen" data-imagen-en-el-cajon={receta.recipeId}>
      <ImagenGuardada token={token} medioId={receta.image?.mediaId ?? null} nombre={receta.name} sesionPerdida={sesionPerdida} chica rutas={receta.image?.paths ?? null} />
      {propia ? (
        <button type="button" className="boton boton--discreto boton--compacto" aria-expanded={abierta} onClick={() => setAbierta((x) => !x)} data-cargar-imagen-en-el-cajon>
          <Icono nombre="imagen" tamano={18} />
          {receta.image ? COPY_RECETARIO.cambiarImagenDeLaReceta : COPY_RECETARIO.cargarImagenDeLaReceta}
          <span className="visualmente-oculto"> de {receta.name}</span>
        </button>
      ) : null}
      {propia && abierta ? (
        <div className="receta-en-el-cajon__carga">
          <p className="nota">{COPY_RECETARIO.laImagenEsDeLaReceta}</p>
          <ImagenDeReceta token={token} receta={receta} sesionPerdida={sesionPerdida} onCambio={(r) => onCambio(r)} />
        </div>
      ) : null}
    </div>
  );
}

/**
 * El Recetario de BE dentro del cajón: la misma búsqueda (`texto`) sobre sus recetas, cada una con su miniatura, lo que
 * pone el editor (`extra`: dónde queda una porción frente al rango de la comida) y dos acciones: agregarla como opción tal
 * cual, o copiarla a Mis recetas (la copia vuelve con `onCopiada`, para sumarla a «Tus recetas»).
 */
export function RecetarioEnElCajon({
  token,
  sesionPerdida,
  texto,
  orden,
  extra,
  onElegir,
  onCopiada,
}: Sesion & {
  texto: string;
  /** El orden que pide el editor (las que entran en el rango primero), sobre las que coinciden. */
  orden: (recetas: readonly Receta[]) => readonly Receta[];
  extra: (r: Receta) => ReactNode;
  onElegir: (r: Receta) => void;
  onCopiada: (copia: Receta) => void;
}) {
  const { estado, recargar } = useRecetarioDeBe({ token, sesionPerdida });
  const [copiada, setCopiada] = useState<string | null>(null);
  const { copiar, copiando, fallo } = useCopiarDelRecetario({ token, sesionPerdida }, (copia) => {
    setCopiada(COPY_RECETARIO.copiada(copia.name));
    onCopiada(copia);
  });
  if (estado.tipo === 'cargando') return <Cargando />;
  if (estado.tipo === 'error') {
    return (
      <Aviso tipo="error">
        <p>{estado.texto}</p>
        <button type="button" className="boton boton--discreto" onClick={() => void recargar()}>
          Reintentar
        </button>
      </Aviso>
    );
  }
  const visibles = orden(recetasQueCoinciden(estado.recetas, texto));
  return (
    <div data-recetario-en-el-cajon>
      <div className="nota encabezado-con-ayuda">
        <p className="encabezado-con-ayuda__titulo">{COPY_RECETARIO.soloLectura}</p>
        <QueEsElRecetario />
      </div>
      <p className="nota" role="status" data-cuantas-del-recetario>
        {estado.recetas.length === 0 ? COPY_RECETARIO.sinRecetas : visibles.length === 0 ? COPY_RECETARIO.ninguna(texto) : `${visibles.length} de ${estado.recetas.length} recetas del ${COPY_RECETARIO.recetarioDeBe}`}
      </p>
      {/* Lo que pasó al copiar, en su renglón: no corre la lista. */}
      <p className={`nota recetario__lugar-del-aviso${fallo ? ' nota--error' : ''}`} role="status">
        {fallo ? fallo.texto : (copiada ?? '')}
      </p>
      <ul className="lista">
        {visibles.map((r) => (
          <li key={r.recipeId} className="lista__item receta-en-el-cajon" data-receta-del-recetario={r.recipeId}>
            <ImagenEnElCajon token={token} sesionPerdida={sesionPerdida} receta={r} onCambio={() => undefined} />
            <div>
              <p className="lista__titulo">
                {r.name} <span className="insignia">{COPY_RECETARIO.deBe}</span>
              </p>
              <p className="nota">
                {COPY_RECETAS.version(r.versionNumber)} · {COPY_RECETAS.porcionesYEnergia(r.servings, nutrienteParaMostrar(r.calculation.perServing.energyKcal, 'energyKcal'))}
              </p>
              {extra(r)}
              <div className="acciones acciones--compactas">
                <button type="button" className="boton boton--discreto" onClick={() => onElegir(r)} data-agregar-del-recetario>
                  {COPY_RECETAS.agregarComoOpcion}: {r.name}
                </button>
                <button type="button" className="boton boton--secundario boton--compacto" disabled={copiando !== null} onClick={() => void copiar(r)} data-copiar-a-mis-recetas>
                  {copiando === r.recipeId ? COPY_RECETARIO.copiando : COPY_RECETARIO.copiar}
                  <span className="visualmente-oculto"> {r.name}</span>
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
