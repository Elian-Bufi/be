/**
 * APK · La pantalla única de consentimiento (WP-COMPARTIR, DL-176; decisión de Dirección del 2026-11-15). Reemplaza la del
 * B2 solo (CAND-10-CON-01): conectar con el profesional (aceptar el vínculo, por Vínculos o por el enlace, el QR o el
 * código) es lo único que pide un paso aparte; después, esta pantalla, con todo lo que sirve para planificar con conciencia
 * de las otras áreas, preseleccionado, y un toque.
 *
 * - **Qué dice** (Ley 25.326, art. 5: libre, expreso e informado): en pocas líneas, qué ve el profesional y para qué; cada
 *   cosa que se comparte, en una línea (qué, de quién, para quién y para qué); el aviso del perfil del profesional
 *   (08 §12.3) y la aclaración de 10-B04:398; que las notas privadas nunca se comparten y que todo se puede retirar.
 * - **Qué trae marcado** (API-CMP-01): su área (B2), el tratamiento de los datos de salud si falta (A3), el resumen y el
 *   plan vigente de las otras áreas para este profesional y lo de su área para los demás, la historia anterior del área si
 *   la hubo y los hábitos si corresponde. Lo que la persona retiró antes no vuelve marcado.
 * - **Los botones:** «Aceptar y compartir», el principal; «Elegir qué compartir», que despliega un interruptor por cosa; y
 *   «Ahora no», que no escribe nada.
 * - **Lo que se registra** (API-CMP-02): un toque escribe todos los actos, cada uno con su texto, su versión y su
 *   auditoría, en una sola transacción. Los textos completos de lo marcado se leen acá mismo, plegados, cada uno con su
 *   versión y su huella: lo que se muestra es lo que se acepta (08 §12.2).
 * - El vínculo se acepta antes, aparte, con «Aceptar vínculo» (10-B04 prohíbe fusionar vínculo y B2 en un botón); esta
 *   pantalla aparece enseguida. Sin un componente (`vinculoId` nulo), es la de «Compartir todo con tus profesionales».
 * - Si después de compartir sigue faltando el tratamiento de datos de salud (porque se desmarcó), abajo va el último paso,
 *   con el mismo bloque de Privacidad (`PasoQueFaltaParaElAcceso`).
 */
import { COPY, COPY_COMPARTIR as C, COPY_VINCULO, type DetalleDeVinculoResponse, type Resultado } from '@be/domain';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../api';
import { LoQueSeComparte, LoQueYaSeComparte, SalidasDelRechazo, TextosCompletos } from '../compartir';
import { lineaDe, marcadasAlEntrar, partesDeLaPropuesta, pedidoDelToque, rechazoDelToque, textoDelBoton, textosParaLeer, type Propuesta, type RechazoDelToque } from '../compartir-en-el-telefono';
import { Cargando, ErrorConReintento } from '../estados';
import { useClaveDeIntento } from '../intento';
import { useSesionPerdida, type Ir, type Salida } from '../navegacion';
import { PasoQueFaltaParaElAcceso } from '../paso-que-falta';
import { Aviso, Boton, Dato, Parrafo, Subtitulo, Titulo } from '../ui';

type Vinculo = DetalleDeVinculoResponse['data'];
type Carga =
  | { readonly tipo: 'cargando' }
  | { readonly tipo: 'no-revelable' }
  | { readonly tipo: 'error'; readonly sinConexion: boolean }
  | { readonly tipo: 'listo'; readonly propuesta: Propuesta; readonly vinculo: Vinculo | null };
type Acto = { readonly tipo: 'libre' } | { readonly tipo: 'enviando' } | { readonly tipo: 'fallo'; readonly rechazo: RechazoDelToque } | { readonly tipo: 'hecho'; readonly lineas: readonly string[] };

const noRevelable = (r: Resultado<unknown>) => !r.ok && r.tipo === 'API' && r.codigo === 'RESOURCE_NOT_FOUND';
const sinConexion = (r: Resultado<unknown> | null) => r !== null && !r.ok && r.tipo === 'RED';

export function PantallaDeConsentimiento({
  token,
  vinculoId,
  recienAceptado = false,
  salir,
  ir,
  volver,
  subir,
}: {
  token: string;
  /** El componente del vínculo; `null`, «Compartir todo con tus profesionales». */
  vinculoId: string | null;
  /** Se llegó aceptando el vínculo: arriba se dice que quedó aceptado. */
  recienAceptado?: boolean;
  salir: (motivo: Salida) => void;
  ir: Ir;
  volver: () => void;
  /** Lleva la pantalla al principio, donde queda el resultado del acto. */
  subir: () => void;
}) {
  const sesionPerdida = useSesionPerdida(salir);
  const [carga, setCarga] = useState<Carga>({ tipo: 'cargando' });
  const [marcadas, setMarcadas] = useState<Set<string>>(new Set());
  const [eligiendo, setEligiendo] = useState(false);
  const [acto, setActo] = useState<Acto>({ tipo: 'libre' });
  const intento = useClaveDeIntento();
  const enCurso = useRef(false);
  const generacion = useRef(0);

  // API-CMP-01 dice qué se comparte y con qué textos; REL-06, cómo está hoy el vínculo (y con quién).
  const cargar = useCallback(async () => {
    const esta = ++generacion.current;
    setCarga({ tipo: 'cargando' });
    const [p, v] = await Promise.all([api.loQueSePuedeCompartir(token, vinculoId), vinculoId ? api.consultarVinculo(token, vinculoId) : Promise.resolve(null)]);
    if (esta !== generacion.current || sesionPerdida(p) || (v !== null && sesionPerdida(v))) return;
    if (noRevelable(p) || (v !== null && noRevelable(v))) return setCarga({ tipo: 'no-revelable' });
    if (!p.ok || (v !== null && !v.ok)) return setCarga({ tipo: 'error', sinConexion: sinConexion(p) || sinConexion(v) });
    setCarga({ tipo: 'listo', propuesta: p.datos.data, vinculo: v?.ok ? v.datos.data : null });
    setMarcadas(marcadasAlEntrar(p.datos.data.items));
    setEligiendo(false);
  }, [token, vinculoId, sesionPerdida]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  /** Lo que la pantalla mostró ya no es lo vigente: se descarta el intento y se vuelve a leer. */
  const actualizar = () => {
    intento.descartar();
    setActo({ tipo: 'libre' });
    void cargar();
  };

  async function compartir(p: Propuesta) {
    if (enCurso.current || marcadas.size === 0) return;
    enCurso.current = true;
    setActo({ tipo: 'enviando' });
    const r = await api.compartirLoElegido(token, pedidoDelToque(p, marcadas), intento.actual());
    enCurso.current = false;
    intento.registrar(r);
    if (r.ok) {
      setActo({ tipo: 'hecho', lineas: p.items.filter((i) => marcadas.has(i.key)).map(lineaDe) });
      subir();
      return;
    }
    if (sesionPerdida(r)) return;
    setActo({ tipo: 'fallo', rechazo: rechazoDelToque(r) });
  }

  // El vínculo reemplaza a esta pantalla: si se llegó desde ese vínculo, se vuelve a él; si no, hereda el origen.
  const irAlVinculo = () => (vinculoId ? ir({ nombre: 'vinculo', id: vinculoId }, 'reemplazar') : volver());
  const irAQuienVeQue = () => ir({ nombre: 'quien-ve-que' }, 'reemplazar');
  const irAPrivacidad = () => ir({ nombre: 'privacidad' });
  const vinculo = carga.tipo === 'listo' ? carga.vinculo : null;
  const nombre = vinculo?.professional.displayName ?? null;
  const titulo = nombre ? C.titulo(nombre) : C.tarjeta.titulo;
  const aceptado = recienAceptado ? <Aviso tipo="exito" titulo={COPY_VINCULO.vinculoAceptado} /> : null;

  if (acto.tipo === 'hecho') {
    return (
      <>
        <Titulo>{titulo}</Titulo>
        <Aviso tipo="exito" titulo={C.listo}>
          {acto.lineas.map((l) => (
            <Parrafo key={l}>{l}</Parrafo>
          ))}
          <Parrafo tenue>{C.listoDetalle}</Parrafo>
          {vinculoId ? <Boton texto={C.verVinculo} onPress={irAlVinculo} /> : null}
          <Boton texto={C.irAQuienVeQue} tipo="secundario" onPress={irAQuienVeQue} />
        </Aviso>
        <PasoQueFaltaParaElAcceso token={token} sesionPerdida={sesionPerdida} irAPrivacidad={irAPrivacidad} />
      </>
    );
  }

  if (carga.tipo !== 'listo') {
    return (
      <>
        <Titulo>{titulo}</Titulo>
        {aceptado}
        {carga.tipo === 'cargando' ? <Cargando /> : null}
        {carga.tipo === 'error' ? <ErrorConReintento sinConexion={carga.sinConexion} onReintentar={() => void cargar()} /> : null}
        {carga.tipo === 'no-revelable' ? (
          <Aviso tipo="info" titulo={COPY_VINCULO.noPudimosAbrir}>
            <Boton texto={COPY_VINCULO.volver} tipo="secundario" onPress={volver} />
          </Aviso>
        ) : null}
      </>
    );
  }

  const p = carga.propuesta;
  const { ofrecidas, dadas } = partesDeLaPropuesta(p);
  // 08 §12.3: el aviso del perfil de cada profesional cuya área se autoriza acá (con su nombre, si es más de uno).
  const avisosDelPerfil = p.items.flatMap((i) => (i.kind === 'AREA_CONSENT' && i.offered ? [{ key: i.key, nombre: i.professional.displayName, aviso: i.profileNotice }] : []));
  const enviando = acto.tipo === 'enviando';
  const rechazo = acto.tipo === 'fallo' ? acto.rechazo : null;

  return (
    <>
      <Titulo>{titulo}</Titulo>
      {aceptado}
      <Parrafo>{vinculo ? C.intro(vinculo.professional.displayName, vinculo.scope.code) : C.introDeTodo}</Parrafo>

      {ofrecidas.length === 0 ? (
        <>
          {vinculo && vinculo.relationshipState !== 'ACEPTADO' ? (
            <>
              <Parrafo>{C.vinculoNoAceptado}</Parrafo>
              <Dato etiqueta="Estado del vínculo" valor={COPY_VINCULO.estadoDeVinculo[vinculo.relationshipState]} />
            </>
          ) : (
            <Aviso tipo="info" titulo={C.nadaPendiente} />
          )}
          <LoQueYaSeComparte cosas={dadas} />
          {vinculoId ? <Boton texto={C.verVinculo} tipo="secundario" onPress={irAlVinculo} /> : null}
          <Boton texto={C.irAQuienVeQue} tipo="enlace" icono="derecha" iconoAlFinal onPress={irAQuienVeQue} />
        </>
      ) : (
        <>
          {avisosDelPerfil.map((a) => (
            <Parrafo key={a.key}>{avisosDelPerfil.length > 1 ? `${a.nombre}: ${a.aviso}` : a.aviso}</Parrafo>
          ))}
          {avisosDelPerfil.length > 0 ? <Aviso tipo="info" titulo={COPY_VINCULO.aclaracionDeConsentimiento} /> : null}

          <Subtitulo>{C.loQueCompartis}</Subtitulo>
          <LoQueSeComparte propuesta={p} marcadas={marcadas} eligiendo={eligiendo} alCambiar={setMarcadas} deshabilitado={enviando} />
          <LoQueYaSeComparte cosas={dadas} />
          <Parrafo>{C.nuncaSeComparte}</Parrafo>
          <Parrafo tenue>{C.podesRetirar}</Parrafo>

          {marcadas.size > 0 ? <Parrafo>{C.alTocar}</Parrafo> : null}
          <TextosCompletos textos={textosParaLeer(p, marcadas)} />

          {rechazo ? <SalidasDelRechazo rechazo={rechazo} actualizar={actualizar} irAPrivacidad={irAPrivacidad} /> : null}
          {!rechazo?.actualizar ? (
            <Boton
              texto={enviando ? C.compartiendo : rechazo?.reintentar ? COPY.reintentar : textoDelBoton(eligiendo)}
              onPress={() => void compartir(p)}
              ocupado={enviando}
              deshabilitado={marcadas.size === 0}
            />
          ) : null}
          {!eligiendo ? <Boton texto={C.elegir} tipo="secundario" onPress={() => setEligiendo(true)} deshabilitado={enviando} /> : null}
          <Boton texto={C.ahoraNo} tipo="enlace" onPress={irAlVinculo} deshabilitado={enviando} />
        </>
      )}
    </>
  );
}
