'use client';

/**
 * «Mis recetas» (DL-119): las preparaciones propias del profesional de Nutrición, con su imagen de referencia, sus
 * porciones y la energía de una porción. Solo las propias: nadie más las ve, salvo el asesorado al que se le ofrecen
 * como opción de una comida del plan.
 * - La receta abierta vive en la URL (`?receta=`), así recargar la página la vuelve a mostrar con su imagen guardada.
 * - Un profesional sin el área de Nutrición recibe 403 y la página lo dice: mostrar u ocultar no autoriza nada.
 * - NUA-06: si la receta nueva quedó guardada y su imagen no, la receta guardada se abre con la imagen elegida, su falla
 *   y «Reintentar la imagen» (`imagenPendiente`).
 * - DL-191: dos pestañas, «Mis recetas» y «Recetario de BE» (`?vista=recetario`). Del recetario se abre el detalle de solo
 *   lectura y se copia a Mis recetas: la copia se abre en el editor, con el aviso flotante, que no corre nada. Cada
 *   tarjeta propia dice si es una copia del recetario y en qué está su propuesta.
 */
import { COPY_RECETARIO, COPY_RECETAS, nutrienteParaMostrar, type Receta } from '@be/domain';
import { usePathname, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Ayuda, AvisoFlotante } from '../../../components/ayuda';
import { Cargando, ErrorConReintento, VerMas } from '../../../components/estados';
import { Aviso } from '../../../components/formulario';
import { Pestanas } from '../../../components/pestanas';
import { api } from '../../../lib/api';
import { cambiarLaDireccion } from '../../../lib/direccion';
import { fecha } from '../../../lib/formato';
import { useListaPaginada } from '../../../lib/lista';
import { SinEspacioProfesional, useEspacioProfesional } from '../espacio-profesional';
import { tomarLaImagenSinCargar, type ImagenPendiente } from './cargar-la-imagen';
import { EditorDeReceta } from './editor-de-receta';
import { AvisoDeLaImagenSinCargar, ImagenGuardada } from './imagen-de-receta';
import { DetalleDelRecetario, QueEsElRecetario, RecetarioDeBe } from './recetario-de-be';
import { EsperandoSesion } from '../../../lib/sesion';

type Vista = 'propias' | 'recetario';

export function MisRecetas() {
  const parametros = useSearchParams();
  const recetaId = parametros.get('receta');
  const nueva = parametros.get('nueva') === '1';
  const vista: Vista = parametros.get('vista') === 'recetario' ? 'recetario' : 'propias';
  const ruta = usePathname();
  const deVuelta = [vista === 'recetario' ? 'vista=recetario' : '', recetaId ? `receta=${recetaId}` : ''].filter(Boolean).join('&');
  const { token, sesionPerdida, yo, cargarYo } = useEspacioProfesional(deVuelta ? `/pro/recipes?${deVuelta}` : '/pro/recipes');
  const [aviso, setAviso] = useState<string | null>(null);
  // Cada guardado vuelve a montar el editor con lo que respondió la API (la versión nueva y su historial).
  const [montaje, setMontaje] = useState(0);
  const [sinArea, setSinArea] = useState(false);
  // NUA-06: la imagen elegida al crear la receta que no se pudo cargar. Se entrega una sola vez, al editor de esa receta
  // (que la toma al montarse); después se olvida, para que volver a abrirla no muestre una falla vieja.
  // DL-180, segundo tramo: si se vuelve de la entrada directo a la receta cuya imagen quedó sin cargar, la toma.
  const [imagenPendiente, setImagenPendiente] = useState<ImagenPendiente | null>(() => (recetaId ? tomarLaImagenSinCargar(recetaId) : null));
  useEffect(() => {
    if (imagenPendiente && imagenPendiente.recetaId === recetaId) setImagenPendiente(null);
  }, [imagenPendiente, recetaId]);
  const listo = yo.tipo === 'listo';
  const lista = useListaPaginada(
    useMemo(
      () =>
        token && listo && !recetaId && !nueva && vista === 'propias'
          ? (cursor?: string) =>
              api.listarRecetas(token, cursor ? { cursor } : {}).then((r) => {
                if (!r.ok && r.tipo === 'API' && r.codigo === 'ACTION_FORBIDDEN') setSinArea(true);
                return r;
              })
          : null,
      [token, listo, recetaId, nueva, vista],
    ),
    sesionPerdida,
  );
  // La receta abierta vive en la dirección: se cambia sin pedido al servidor, como en la ficha (bloque 3).
  const ir = useCallback((consulta: string) => cambiarLaDireccion(consulta ? `${ruta}?${consulta}` : ruta, { agregarAlHistorial: true }), [ruta]);

  if (!token) return <EsperandoSesion />;
  if (yo.tipo === 'cargando') return <Cargando />;
  if (yo.tipo === 'error') return <ErrorConReintento onReintentar={cargarYo} />;
  if (yo.tipo === 'sin-espacio') return <SinEspacioProfesional />;

  const avisoFlotante = (
    <>
      {aviso ? (
        <AvisoFlotante onCerrar={() => setAviso(null)}>
          <p>{aviso}</p>
        </AvisoFlotante>
      ) : null}
      {/* DL-180, segundo tramo: la sesión venció mientras se cargaba la imagen de una receta recién creada. */}
      <AvisoDeLaImagenSinCargar
        key={recetaId ?? 'lista'}
        alReintentar={(id) => {
          setImagenPendiente(tomarLaImagenSinCargar(id));
          setMontaje((n) => n + 1);
          ir(`receta=${encodeURIComponent(id)}`);
        }}
      />
    </>
  );

  // DL-191: lo que pasa al copiar del recetario: la copia se abre en el editor, y el aviso flotante lo dice.
  const alCopiar = (copia: Receta) => {
    setAviso(COPY_RECETARIO.copiada(copia.name));
    setMontaje((n) => n + 1);
    ir(`receta=${encodeURIComponent(copia.recipeId)}`);
  };
  const pestanas = (
    <Pestanas<Vista>
      etiqueta="Recetas"
      vistas={[
        { clave: 'propias', texto: COPY_RECETARIO.misRecetas, icono: 'comida' },
        { clave: 'recetario', texto: COPY_RECETARIO.recetarioDeBe, icono: 'tilde' },
      ]}
      actual={vista}
      href={(c) => (c === 'recetario' ? `${ruta}?vista=recetario` : ruta)}
    />
  );

  if (vista === 'recetario') {
    return (
      <div className="secciones">
        {avisoFlotante}
        {pestanas}
        {recetaId ? (
          <DetalleDelRecetario key={recetaId} token={token} sesionPerdida={sesionPerdida} recetaId={recetaId} onVolver={() => ir('vista=recetario')} onCopiada={alCopiar} />
        ) : (
          <section className="seccion" aria-labelledby="titulo-recetario">
            <h2 id="titulo-recetario">
              {COPY_RECETARIO.recetarioDeBe} <QueEsElRecetario />
            </h2>
            <RecetarioDeBe token={token} sesionPerdida={sesionPerdida} onAbrir={(id) => ir(`vista=recetario&receta=${encodeURIComponent(id)}`)} onCopiada={alCopiar} />
          </section>
        )}
      </div>
    );
  }

  if (recetaId || nueva) {
    return (
      <>
        {avisoFlotante}
        <EditorDeReceta
          key={`${recetaId ?? 'nueva'}-${montaje}`}
          token={token}
          sesionPerdida={sesionPerdida}
          recetaId={recetaId}
          imagenPendiente={imagenPendiente && imagenPendiente.recetaId === recetaId ? imagenPendiente : null}
          onVolver={() => ir('')}
          onGuardada={(r: Receta, texto, _agregar, imagen) => {
            setAviso(texto);
            setImagenPendiente(imagen.tipo === 'pendiente' ? imagen.pendiente : null);
            setMontaje((n) => n + 1);
            if (r.recipeId !== recetaId) cambiarLaDireccion(`${ruta}?receta=${encodeURIComponent(r.recipeId)}`);
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
      {pestanas}
      <section className="seccion" aria-labelledby="titulo-recetas">
        <h2 id="titulo-recetas">Tus recetas</h2>
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
                  <ImagenGuardada token={token} medioId={r.image?.mediaId ?? null} nombre={r.name} sesionPerdida={sesionPerdida} chica rutas={r.image?.paths ?? null} />
                  <div>
                    <p className="lista__titulo">{r.name}</p>
                    <p className="nota">{COPY_RECETAS.porcionesYEnergia(r.servings, nutrienteParaMostrar(r.calculation.perServing.energyKcal, 'energyKcal'))}</p>
                    <p className="nota">
                      {COPY_RECETAS.version(r.versionNumber)} · actualizada el {fecha(r.updatedAt)}
                      {r.image ? ` · ${COPY_RECETAS.imagenDeReferencia.toLowerCase()}` : ''}
                    </p>
                    {r.copiedFrom ? <p className="nota">{COPY_RECETARIO.copiaDe(r.copiedFrom.name)}</p> : null}
                    {r.proposal ? <p className="nota" data-estado-de-la-propuesta={r.proposal.status}>{COPY_RECETARIO.estadoDeLaPropuesta[r.proposal.status](r.proposal.versionNumber)}</p> : null}
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
