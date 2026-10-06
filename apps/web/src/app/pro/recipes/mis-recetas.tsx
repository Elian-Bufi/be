'use client';

/**
 * «Mis recetas» (DL-119): las preparaciones propias del profesional de Nutrición, con su imagen de referencia, sus
 * porciones y la energía de una porción. Solo las propias: nadie más las ve, salvo el asesorado al que se le ofrecen
 * como opción de una comida del plan.
 * - La receta abierta vive en la URL (`?receta=`), así recargar la página la vuelve a mostrar con su imagen guardada.
 * - Un profesional sin el área de Nutrición recibe 403 y la página lo dice: mostrar u ocultar no autoriza nada.
 */
import { COPY_RECETAS, nutrienteParaMostrar, type Receta } from '@be/domain';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { Ayuda, AvisoFlotante } from '../../../components/ayuda';
import { Cargando, ErrorConReintento, VerMas } from '../../../components/estados';
import { Aviso } from '../../../components/formulario';
import { api } from '../../../lib/api';
import { fecha } from '../../../lib/formato';
import { useListaPaginada } from '../../../lib/lista';
import { SinEspacioProfesional, useEspacioProfesional } from '../espacio-profesional';
import { EditorDeReceta } from './editor-de-receta';
import { ImagenGuardada } from './imagen-de-receta';

export function MisRecetas() {
  const parametros = useSearchParams();
  const recetaId = parametros.get('receta');
  const nueva = parametros.get('nueva') === '1';
  const ruta = usePathname();
  const router = useRouter();
  const { token, sesionPerdida, yo, cargarYo } = useEspacioProfesional(recetaId ? `/pro/recipes?receta=${recetaId}` : '/pro/recipes');
  const [aviso, setAviso] = useState<string | null>(null);
  // Cada guardado vuelve a montar el editor con lo que respondió la API (la versión nueva y su historial).
  const [montaje, setMontaje] = useState(0);
  const [sinArea, setSinArea] = useState(false);
  const listo = yo.tipo === 'listo';
  const lista = useListaPaginada(
    useMemo(
      () =>
        token && listo && !recetaId && !nueva
          ? (cursor?: string) =>
              api.listarRecetas(token, cursor ? { cursor } : {}).then((r) => {
                if (!r.ok && r.tipo === 'API' && r.codigo === 'ACTION_FORBIDDEN') setSinArea(true);
                return r;
              })
          : null,
      [token, listo, recetaId, nueva],
    ),
    sesionPerdida,
  );
  const ir = useCallback((consulta: string) => router.push(consulta ? `${ruta}?${consulta}` : ruta), [router, ruta]);

  if (!token) return <p className="nota">Redirigiendo a Iniciar sesión…</p>;
  if (yo.tipo === 'cargando') return <Cargando />;
  if (yo.tipo === 'error') return <ErrorConReintento onReintentar={cargarYo} />;
  if (yo.tipo === 'sin-espacio') return <SinEspacioProfesional />;

  const avisoFlotante = aviso ? (
    <AvisoFlotante onCerrar={() => setAviso(null)}>
      <p>{aviso}</p>
    </AvisoFlotante>
  ) : null;

  if (recetaId || nueva) {
    return (
      <>
        {avisoFlotante}
        <EditorDeReceta
          key={`${recetaId ?? 'nueva'}-${montaje}`}
          token={token}
          sesionPerdida={sesionPerdida}
          recetaId={recetaId}
          onVolver={() => ir('')}
          onGuardada={(r: Receta, texto) => {
            setAviso(texto);
            setMontaje((n) => n + 1);
            if (r.recipeId !== recetaId) router.replace(`${ruta}?receta=${encodeURIComponent(r.recipeId)}`);
          }}
        />
      </>
    );
  }

  if (sinArea) {
    return (
      <Aviso tipo="info">
        <p>{COPY_RECETAS.soloNutricion}</p>
      </Aviso>
    );
  }

  return (
    <div className="secciones">
      {avisoFlotante}
      <section className="seccion" aria-labelledby="titulo-recetas">
        <h2 id="titulo-recetas">{COPY_RECETAS.misRecetas}</h2>
        <Ayuda titulo="Qué es una receta">
          <p>{COPY_RECETAS.sinRecetas}</p>
          <p>{COPY_RECETAS.avisoDeImagen}</p>
          <p>{COPY_RECETAS.avisoDeOpciones}</p>
        </Ayuda>
        <div className="acciones">
          <button type="button" className="boton boton--primario" onClick={() => ir('nueva=1')}>
            {COPY_RECETAS.nuevaReceta}
          </button>
        </div>
        {lista.estado.tipo === 'cargando' ? <Cargando /> : null}
        {lista.estado.tipo === 'error' ? <ErrorConReintento onReintentar={() => void lista.recargar()} /> : null}
        {lista.estado.tipo === 'listo' ? (
          lista.estado.items.length === 0 ? (
            <p>{COPY_RECETAS.sinRecetas}</p>
          ) : (
            <ul className="lista lista--recetas">
              {lista.estado.items.map((r) => (
                <li key={r.recipeId} className="lista__item tarjeta-de-receta">
                  <ImagenGuardada token={token} medioId={r.image?.mediaId ?? null} nombre={r.name} sesionPerdida={sesionPerdida} chica />
                  <div>
                    <p className="lista__titulo">{r.name}</p>
                    <p className="nota">{COPY_RECETAS.porcionesYEnergia(r.servings, nutrienteParaMostrar(r.calculation.perServing.energyKcal, 'energyKcal'))}</p>
                    <p className="nota">
                      {COPY_RECETAS.version(r.versionNumber)} · actualizada el {fecha(r.updatedAt)}
                      {r.image ? ` · ${COPY_RECETAS.imagenDeReferencia.toLowerCase()}` : ''}
                    </p>
                    <button type="button" className="boton boton--enlace" onClick={() => ir(`receta=${encodeURIComponent(r.recipeId)}`)}>
                      {COPY_RECETAS.abrir} {r.name}
                    </button>
                  </div>
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
