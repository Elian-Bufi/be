'use client';

/**
 * «Mis alimentos» (DL-180; WP-NUTRICION-ALIMENTOS): los alimentos que el profesional de Nutrición cargó a mano, también
 * los retirados, con su versión, su grupo y lo que decidió Administración.
 * - **Corregir (NUA-01):** el formulario común del alimento, en un cuadro. Nace una versión nueva: los planes activados,
 *   las recetas y los registros conservan la que citaban. Una verificación de Administración vale para la versión que
 *   revisó.
 * - **Retirar (NUA-02):** se confirma diciendo qué pasa; no se borra nada.
 * - **Compartir y dejar de compartir (segundo tramo, NUA-D14 a D16):** cada alimento dice si lo ven los demás profesionales
 *   de Nutrición y ofrece cambiarlo, con una confirmación que dice qué pasa («Los planes que ya lo usan lo conservan»).
 *   Corregir nunca comparte solo: si no se comparte, el formulario trae el interruptor apagado.
 * - Contra la versión que se vio: si cambió mientras tanto (otra pestaña), se dice y se vuelve a leer la lista.
 * - Un profesional sin el área de Nutrición recibe 403 y la página lo dice: mostrar u ocultar no autoriza nada.
 */
import { COPY_MIS_ALIMENTOS as C, cantidad as formatearCantidad, NOMBRE_DEL_GRUPO, type AlimentoPropio } from '@be/domain';
import { useMemo, useState } from 'react';
import { Ayuda, AvisoFlotante } from '../../../components/ayuda';
import { CuadroEnfocado } from '../../../components/cuadro-enfocado';
import { DialogoDeConfirmacion } from '../../../components/dialogo';
import { Cargando, ErrorConReintento, VerMas } from '../../../components/estados';
import { Aviso } from '../../../components/formulario';
import { Icono } from '../../../components/icono';
import { api } from '../../../lib/api';
import { fecha } from '../../../lib/formato';
import { mensajeDeFallo, useClaveDeIntento } from '../../../lib/intento';
import { useListaPaginada } from '../../../lib/lista';
import { EsperandoSesion } from '../../../lib/sesion';
import { iconoDeLaFila } from '../advisees/nutrition/alimentos-del-catalogo';
import { alimentoEscrito, FormularioDelAlimento } from '../advisees/nutrition/formulario-del-alimento';
import { accionDeCompartir, compartidoEnPalabras, interruptorAlCorregir, revisionEnPalabras } from '../advisees/nutrition/valores-del-alimento';
import { SinEspacioProfesional, useEspacioProfesional } from '../espacio-profesional';

/** Un valor cada 100 g: lo que no hay es «sin dato», nunca cero. */
const valor = (v: number | null | undefined, unidad: string): string => (v === null || v === undefined ? 'sin dato' : formatearCantidad(v, unidad));

export function MisAlimentos() {
  const { token, sesionPerdida, yo, cargarYo } = useEspacioProfesional('/pro/foods');
  const [sinArea, setSinArea] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [corrigiendo, setCorrigiendo] = useState<AlimentoPropio | null>(null);
  const [escrito, setEscrito] = useState(false);
  const [retirando, setRetirando] = useState<AlimentoPropio | null>(null);
  const [enviandoRetiro, setEnviandoRetiro] = useState(false);
  const [falloDelRetiro, setFalloDelRetiro] = useState<string | null>(null);
  const [compartiendo, setCompartiendo] = useState<{ readonly alimento: AlimentoPropio; readonly compartir: boolean } | null>(null);
  const [enviandoCompartir, setEnviandoCompartir] = useState(false);
  const [falloDeCompartir, setFalloDeCompartir] = useState<string | null>(null);
  const intentoDeCorregir = useClaveDeIntento();
  const intentoDeRetirar = useClaveDeIntento();
  const intentoDeCompartir = useClaveDeIntento();
  const listo = yo.tipo === 'listo';
  const lista = useListaPaginada(
    useMemo(
      () =>
        token && listo
          ? (cursor?: string) =>
              api.alimentosPropios(token, cursor).then((r) => {
                if (!r.ok && r.tipo === 'API' && r.codigo === 'ACTION_FORBIDDEN') setSinArea(true);
                return r;
              })
          : null,
      [token, listo],
    ),
    sesionPerdida,
  );

  if (!token) return <EsperandoSesion />;
  if (yo.tipo === 'cargando') return <Cargando />;
  if (yo.tipo === 'error') return <ErrorConReintento onReintentar={cargarYo} />;
  if (yo.tipo === 'sin-espacio') return <SinEspacioProfesional />;
  if (sinArea) {
    return (
      <Aviso tipo="info">
        <p>{C.soloNutricion}</p>
      </Aviso>
    );
  }

  const cerrarCorreccion = () => {
    setCorrigiendo(null);
    setEscrito(false);
  };

  async function retirar() {
    if (!retirando || !token) return;
    setEnviandoRetiro(true);
    setFalloDelRetiro(null);
    const r = await api.retirarAlimento(token, retirando.catalogItemId, { expectedVersion: retirando.version }, intentoDeRetirar.actual(retirando.catalogItemId));
    intentoDeRetirar.registrar(r);
    setEnviandoRetiro(false);
    if (sesionPerdida(r)) return;
    if (!r.ok) {
      if (r.tipo === 'API' && r.codigo === 'VERSION_CONFLICT') {
        setRetirando(null);
        setAviso(C.cambioMientras);
        return void lista.recargar();
      }
      return setFalloDelRetiro(mensajeDeFallo(r));
    }
    setRetirando(null);
    setAviso(C.retiradoAviso(r.datos.data.name));
    void lista.recargar();
  }

  async function cambiarCompartido() {
    if (!compartiendo || !token) return;
    const { alimento, compartir } = compartiendo;
    setEnviandoCompartir(true);
    setFalloDeCompartir(null);
    const r = await api.compartirAlimento(token, alimento.catalogItemId, { shared: compartir }, intentoDeCompartir.actual(`${alimento.catalogItemId}:${compartir}`));
    intentoDeCompartir.registrar(r);
    setEnviandoCompartir(false);
    if (sesionPerdida(r)) return;
    if (!r.ok) return setFalloDeCompartir(mensajeDeFallo(r));
    setCompartiendo(null);
    setAviso(compartir ? C.compartidoAviso(r.datos.data.name) : C.dejadoDeCompartirAviso(r.datos.data.name));
    void lista.recargar();
  }

  return (
    <div className="secciones mis-alimentos">
      {aviso ? (
        <AvisoFlotante onCerrar={() => setAviso(null)}>
          <p>{aviso}</p>
        </AvisoFlotante>
      ) : null}
      <section className="seccion" aria-labelledby="titulo-alimentos">
        <h2 id="titulo-alimentos">{C.titulo}</h2>
        <Ayuda titulo="Corregir, retirar y compartir">
          <p>{C.queEs}</p>
        </Ayuda>
        {lista.estado.tipo === 'cargando' ? <Cargando /> : null}
        {lista.estado.tipo === 'error' ? <ErrorConReintento onReintentar={() => void lista.recargar()} /> : null}
        {lista.estado.tipo === 'listo' ? (
          lista.estado.items.length === 0 ? (
            <p>{C.sinAlimentos}</p>
          ) : (
            <ul className="lista mis-alimentos__lista">
              {lista.estado.items.map((a) => {
                const c = a.composition;
                const accion = accionDeCompartir(a);
                return (
                  <li key={a.catalogItemId} className="lista__item mis-alimentos__item" data-alimento-propio={a.catalogItemId} data-retirado={a.available ? undefined : ''}>
                    <span className="mis-alimentos__icono" aria-hidden="true">
                      <Icono nombre={iconoDeLaFila({ grupo: a.foodGroup })} tamano={24} />
                    </span>
                    <div className="mis-alimentos__cuerpo">
                      <p className="lista__titulo">
                        {a.name}
                        {a.available ? null : <span className="etiqueta-de-dato">{C.retirado}</span>}
                        {a.review.state === 'CERTIFIED' ? <span className="etiqueta-de-dato">{COPY_NIVEL_VERIFICADO}</span> : null}
                      </p>
                      <p className="nota">
                        {valor(c.energyKcal, 'kcal')} · carbohidratos {valor(c.carbohydrateG, 'g')} · grasas {valor(c.fatG, 'g')} · proteínas {valor(c.proteinG, 'g')} · fibra{' '}
                        {valor(c.fiberG, 'g')} · {C.cadaCien(c.referenceAmount === '100ml')}
                      </p>
                      <p className="nota">
                        {a.foodGroup ? NOMBRE_DEL_GRUPO[a.foodGroup] : 'Sin grupo'} · {C.version(a.versionNumber)} · {fecha(a.updatedAt)}
                      </p>
                      {a.available ? (
                        <p className="nota" data-revision>
                          {revisionEnPalabras(a)}
                        </p>
                      ) : (
                        <p className="nota" data-retirado-nota>
                          {C.retiradoNota}
                        </p>
                      )}
                      {a.available || a.shared ? (
                        <p className="nota" data-compartido={a.shared ? 'si' : a.stoppedSharing ? 'dejado' : 'no'}>
                          {compartidoEnPalabras(a)}
                        </p>
                      ) : null}
                    </div>
                    {a.available || accion ? (
                      <div className="mis-alimentos__acciones">
                        {a.available ? (
                          <button type="button" className="boton boton--secundario" onClick={() => setCorrigiendo(a)} data-corregir>
                            <Icono nombre="corregido" tamano={18} />
                            {C.corregir}
                            <span className="visualmente-oculto"> {a.name}</span>
                          </button>
                        ) : null}
                        {accion ? (
                          <button
                            type="button"
                            className="boton boton--quieto"
                            onClick={() => (setFalloDeCompartir(null), setCompartiendo({ alimento: a, compartir: accion.compartir }))}
                            data-compartir={accion.compartir ? 'compartir' : 'dejar'}
                          >
                            {accion.texto}
                            <span className="visualmente-oculto"> {a.name}</span>
                          </button>
                        ) : null}
                        {a.available ? (
                          <button type="button" className="boton boton--quieto" onClick={() => (setFalloDelRetiro(null), setRetirando(a))} data-retirar>
                            {C.retirar}
                            <span className="visualmente-oculto"> {a.name}</span>
                          </button>
                        ) : null}
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )
        ) : null}
        <VerMas estado={lista.estado} onVerMas={lista.verMas} />
      </section>

      <CuadroEnfocado abierto={corrigiendo !== null} forma="dialogo" titulo={corrigiendo ? C.corregirTitulo(corrigiendo.name) : ''} conCambios={escrito} onCerrar={cerrarCorreccion}>
        {corrigiendo ? (
          <FormularioDelAlimento
            key={corrigiendo.catalogItemId}
            id="corregir-alimento"
            inicial={alimentoEscrito(corrigiendo)}
            textoDelBoton={C.guardarCorreccion}
            textoEnviando={C.guardando}
            alEscribir={() => setEscrito(true)}
            // NUA-D14: guardar una corrección nunca comparte solo; si no se comparte, el interruptor viene apagado.
            compartir={interruptorAlCorregir(corrigiendo)}
            nota={
              <>
                <p className="nota">{C.corregirQuePasa(corrigiendo.versionNumber + 1)}</p>
                {corrigiendo.review.state === 'CERTIFIED' ? <p className="nota">{C.verificadoVuelveARevision}</p> : null}
                {corrigiendo.shared ? (
                  <p className="nota" data-corregir-compartido>
                    {C.corregirCompartido}
                  </p>
                ) : null}
              </>
            }
            pie={
              <button type="button" className="boton boton--secundario" onClick={cerrarCorreccion}>
                {C.volver}
              </button>
            }
            alEnviar={async (v) => {
              const r = await api.corregirAlimento(
                token,
                corrigiendo.catalogItemId,
                { expectedVersion: corrigiendo.version, name: v.nombre, composition: v.composicion, ...(v.grupo ? { group: v.grupo } : {}), ...(v.compartir ? { share: true } : {}) },
                intentoDeCorregir.actual(corrigiendo.catalogItemId),
              );
              intentoDeCorregir.registrar(r);
              if (sesionPerdida(r)) return null;
              if (!r.ok) {
                if (r.tipo === 'API' && r.codigo === 'VERSION_CONFLICT') {
                  cerrarCorreccion();
                  setAviso(C.cambioMientras);
                  void lista.recargar();
                  return null;
                }
                return mensajeDeFallo(r);
              }
              const nueva = r.datos.data;
              cerrarCorreccion();
              const recienCompartido = nueva.shared && !corrigiendo.shared ? C.compartidoAviso(nueva.name) : null;
              setAviso(
                nueva.versionNumber > corrigiendo.versionNumber
                  ? [C.corregido(nueva.name, nueva.versionNumber), recienCompartido].filter(Boolean).join(' ')
                  : (recienCompartido ?? C.sinCambios(nueva.name)),
              );
              void lista.recargar();
              return null;
            }}
          />
        ) : null}
      </CuadroEnfocado>

      <DialogoDeConfirmacion
        abierto={retirando !== null}
        titulo={retirando ? C.retirarTitulo(retirando.name) : ''}
        textoVolver={C.volver}
        textoConfirmar={C.retirar}
        textoEnviando={C.retirando}
        peligro
        enviando={enviandoRetiro}
        error={falloDelRetiro}
        onVolver={() => setRetirando(null)}
        onConfirmar={() => void retirar()}
      >
        <p>{C.retirarQuePasa}</p>
      </DialogoDeConfirmacion>

      <DialogoDeConfirmacion
        abierto={compartiendo !== null}
        titulo={compartiendo ? (compartiendo.compartir ? C.compartirTitulo(compartiendo.alimento.name) : C.dejarDeCompartirTitulo(compartiendo.alimento.name)) : ''}
        textoVolver={C.volver}
        textoConfirmar={compartiendo?.compartir ? C.compartir : C.dejarDeCompartir}
        textoEnviando={compartiendo?.compartir ? C.compartiendo : C.dejandoDeCompartir}
        enviando={enviandoCompartir}
        error={falloDeCompartir}
        onVolver={() => setCompartiendo(null)}
        onConfirmar={() => void cambiarCompartido()}
      >
        <p data-compartir-que-pasa>{compartiendo?.compartir ? C.compartirQuePasa : C.dejarDeCompartirQuePasa}</p>
      </DialogoDeConfirmacion>
    </div>
  );
}

const COPY_NIVEL_VERIFICADO = 'Verificado';
