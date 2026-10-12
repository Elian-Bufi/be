'use client';

/**
 * «Pedir información» (API-FRM-01, 02 y 03). El profesional elige un formulario del catálogo, marca **qué campos**
 * pide de ese formulario y declara para qué los necesita.
 *
 * **Al elegir un formulario vienen todas sus preguntas marcadas,** y el profesional desmarca las que no necesita
 * (decisión de Dirección del 2026-10-12; F-05 de WP-ESCRITORIO-AREAS, registrada en `docs/DEUDA_LEGAJO.md`). Hasta
 * entonces no venía ninguna, y había que marcarlas de a una. La minimización sigue siendo del profesional, no del
 * catálogo: la cuenta de las elegidas está a la vista, ninguna viene como requerida, y la API sigue evaluando la
 * pertinencia de cada pregunta al crear la solicitud (FRM-03): marcarlas todas no amplía lo que se puede pedir.
 *
 * Lo que la pantalla no hace, a propósito: **no promete el dato.** El aviso dice que pedir no amplía el acceso y que
 * hasta que la persona responda no hay nada nuevo (05:15098-15099).
 *
 * Con una plantilla transversal (sin dominio) se ofrecen los tres alcances: la UI no adivina cuál está autorizado. Si
 * no lo está, la API responde el mismo 404 neutral que ante un asesorado inexistente, y eso es lo que se muestra. Una
 * plantilla con dominio se pide solo en su Alcance (FRM-03; UC-P32, precondición 7): la pantalla fija ese Alcance.
 *
 * PF-02 (DL-100): si el profesional llega desde la evaluación de entrenamiento (`plantilla=FRM-ENTRENAMIENTO` y
 * `volver=entrenamiento`), la pantalla precarga la plantilla ratificada, sus campos y el alcance, y al enviar vuelve a
 * Entrenamiento. Es una propuesta editable, no una excepción a la minimización: se puede desmarcar antes de enviar.
 */
import { ALCANCES, CONTEXTO_DE_ENTRENAMIENTO, COPY_FORMULARIOS, COPY_SOLICITUDES, ETIQUETA_DE_ALCANCE, type Alcance, type CampoDePlantilla, type Plantilla, type VersionDePlantilla } from '@be/domain';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Aviso, Campo } from '../../../../components/formulario';
import { api, type Resultado } from '../../../../lib/api';
import { mensajeDeFallo, useClaveDeIntento } from '../../../../lib/intento';
import { useCambiosSinGuardar } from '../marco-del-area';
import { EstadoDeLectura, useFormularios } from './formularios';

/** Los rechazos de FRM-03 que dependen de lo elegido: se dicen, en vez de «el servicio no está disponible». */
const RECHAZO_DE_SOLICITUD: Readonly<Record<string, string>> = {
  FORM_TEMPLATE_NOT_SELECTABLE: COPY_FORMULARIOS.plantillaNoSeleccionable,
  FORM_REQUEST_NOT_ALLOWED: COPY_FORMULARIOS.campoNoPertinente,
  FORM_REQUEST_INVALID: COPY_FORMULARIOS.solicitudInvalida,
};

export function VistaDePedido() {
  const { token, asesoradoId, sesionPerdida, irA, avisar } = useFormularios();
  const [r, setR] = useState<Resultado<readonly Plantilla[]> | null>(null);
  const [elegida, setElegida] = useState<VersionDePlantilla | null>(null);
  const [pedidos, setPedidos] = useState<readonly string[]>([]);
  const [requeridos, setRequeridos] = useState<readonly string[]>([]);
  const [proposito, setProposito] = useState('');
  const [alcance, setAlcance] = useState<Alcance>('ENTRENAMIENTO');
  const [aviso, setAviso] = useState<{ tipo: 'error'; texto: string } | null>(null);
  const [enviando, setEnviando] = useState(false);
  const clave = useClaveDeIntento();
  const parametros = useSearchParams();
  const router = useRouter();
  const desdeEntrenamiento = parametros.get('volver') === 'entrenamiento';
  // Lo que viene marcado al elegir un formulario, o precargado al llegar desde Entrenamiento, no es algo escrito: vuelve
  // a venir igual. Hay algo que perder recién cuando el profesional cambia una casilla, el propósito o el área.
  const [tocado, setTocado] = useState(false);
  useCambiosSinGuardar(tocado, 'el pedido de información');
  const precargar = desdeEntrenamiento && parametros.get('plantilla') === CONTEXTO_DE_ENTRENAMIENTO.clavePlantilla;
  const precargada = useRef(false);
  const rutaDeEntrenamiento = `/pro/advisees/training?id=${encodeURIComponent(asesoradoId)}`;

  const cargar = useCallback(async () => {
    setR(null);
    const lista = await api.listarPlantillasDeFormulario(token);
    if (sesionPerdida(lista)) return;
    setR(lista.ok ? { ok: true, datos: lista.datos.data } : (lista as Resultado<never>));
  }, [token, sesionPerdida]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const abrir = useCallback(
    async (p: Plantilla, conPrecarga = false) => {
      setAviso(null);
      const v = await api.consultarVersionDePlantilla(token, p.templateId, p.latestVersionId);
      if (sesionPerdida(v)) return;
      if (!v.ok) return setAviso({ tipo: 'error', texto: mensajeDeFallo(v) });
      setElegida(v.datos.data);
      setTocado(false);
      // Una plantilla con dominio se pide solo en su Alcance (FRM-03 lo exige): se fija acá, no se deja elegir otro.
      if (v.datos.data.domain) setAlcance(v.datos.data.domain);
      const preguntas = v.datos.data.sections.flatMap((s) => s.fields.map((c) => c.fieldCode));
      if (!conPrecarga) {
        // F-05: vienen todas marcadas, y ninguna como requerida. El profesional desmarca lo que no necesita.
        setPedidos(preguntas);
        setRequeridos([]);
        return;
      }
      // DL-100: solo lo que la versión elegida realmente tiene; si el catálogo cambiara, no se pide un campo inexistente.
      const disponibles = new Set(preguntas);
      setPedidos(CONTEXTO_DE_ENTRENAMIENTO.campos.filter((c) => disponibles.has(c)));
      setRequeridos(CONTEXTO_DE_ENTRENAMIENTO.requeridos.filter((c) => disponibles.has(c)));
      setProposito(COPY_FORMULARIOS.propositoDeContextoDeEntrenamiento);
      setAlcance('ENTRENAMIENTO');
    },
    [token, sesionPerdida],
  );

  // Al llegar desde Entrenamiento, abrir una sola vez la plantilla ratificada con su precarga.
  useEffect(() => {
    if (!precargar || precargada.current || !r?.ok) return;
    const plantilla = r.datos.find((p) => p.key === CONTEXTO_DE_ENTRENAMIENTO.clavePlantilla);
    if (!plantilla) return;
    precargada.current = true;
    void abrir(plantilla, true);
  }, [precargar, r, abrir]);

  const alternar = (codigo: string, lista: readonly string[], set: (v: readonly string[]) => void) => {
    setTocado(true);
    set(lista.includes(codigo) ? lista.filter((c) => c !== codigo) : [...lista, codigo]);
  };

  async function enviar() {
    if (!elegida) return;
    setAviso(null);
    if (pedidos.length === 0) return setAviso({ tipo: 'error', texto: COPY_FORMULARIOS.sinCamposElegidos });
    setEnviando(true);
    const r = await api.crearSolicitudDeFormulario(
      token,
      asesoradoId,
      {
        templateVersionId: elegida.templateVersionId,
        purpose: proposito,
        scope: alcance,
        requestedFieldCodes: [...pedidos],
        // Requerido ⊆ solicitado: si se desmarcó un campo, deja de estar requerido (REG-06-212).
        requiredFieldCodes: requeridos.filter((c) => pedidos.includes(c)),
      },
      clave.actual(),
    );
    clave.registrar(r);
    setEnviando(false);
    if (sesionPerdida(r)) return;
    if (!r.ok) return setAviso({ tipo: 'error', texto: RECHAZO_DE_SOLICITUD[r.tipo === 'API' ? r.codigo : ''] ?? mensajeDeFallo(r) });
    setElegida(null);
    setProposito('');
    setTocado(false);
    // DL-113: el éxito lo muestra la pestaña: esta vista pasa enseguida a «Solicitudes» y un aviso suyo se iría con ella.
    avisar(COPY_FORMULARIOS.solicitudEnviada);
    // CA-FOR-06: si el pedido salió de la evaluación, se vuelve a ella para seguir trabajando.
    if (desdeEntrenamiento) return router.push(rutaDeEntrenamiento);
    irA('solicitudes');
  }

  return (
    <EstadoDeLectura r={r} onReintentar={cargar}>
      {r?.ok ? (
        <div className="secciones">
          {aviso ? (
            <Aviso tipo={aviso.tipo} enfocar>
              <p>{aviso.texto}</p>
            </Aviso>
          ) : null}

          {desdeEntrenamiento ? (
            <Aviso tipo="info">
              <p>{COPY_FORMULARIOS.pedidoDesdeEntrenamiento}</p>
              <p>
                <Link href={rutaDeEntrenamiento}>{COPY_FORMULARIOS.volverAEntrenamiento}</Link>
              </p>
            </Aviso>
          ) : null}

          <Aviso tipo="info">
            <p>{COPY_FORMULARIOS.solicitarNoEsAcceder}</p>
          </Aviso>

          <section className="seccion" aria-labelledby="titulo-catalogo">
            <h2 id="titulo-catalogo">{COPY_FORMULARIOS.catalogo}</h2>
            <p className="nota">{COPY_FORMULARIOS.plantillaDemostracion}</p>
            {r.datos.length === 0 ? <p>{COPY_FORMULARIOS.sinPlantillas}</p> : null}
            <ul className="historial">
              {r.datos.map((p) => (
                <li key={p.templateId}>
                  <p>
                    <strong>{p.name}</strong>
                  </p>
                  <p className="nota">{p.purpose}</p>
                  <button type="button" className="boton boton--secundario" onClick={() => void abrir(p)} disabled={enviando}>
                    {elegida?.templateId === p.templateId ? 'Elegido' : 'Elegir'}
                  </button>
                </li>
              ))}
            </ul>
          </section>

          {elegida ? (
            <section className="seccion" aria-labelledby="titulo-armar">
              <h2 id="titulo-armar">{elegida.name}</h2>
              <p>{COPY_FORMULARIOS.elegirCampos}</p>
              {/* Vienen todas marcadas (F-05): la cuenta dice cuántas se van a pedir, y cambia con cada casilla. */}
              <p className="nota" data-elegidas>
                {COPY_SOLICITUDES.elegidas(pedidos.length, elegida.sections.reduce((n, s) => n + s.fields.length, 0))} {COPY_SOLICITUDES.vienenTodasElegidas}
              </p>
              <p className="nota">{COPY_FORMULARIOS.ayudaRequerido}</p>
              {elegida.sections.map((s) => (
                <fieldset key={s.sectionCode}>
                  <legend>{s.title}</legend>
                  {s.fields.map((c: CampoDePlantilla) => (
                    <div key={c.fieldCode} className="campo-de-plantilla">
                      <input
                        type="checkbox"
                        id={`pedir-${c.fieldCode}`}
                        checked={pedidos.includes(c.fieldCode)}
                        onChange={() => alternar(c.fieldCode, pedidos, setPedidos)}
                        aria-describedby={c.helpText ? `ayuda-${c.fieldCode}` : undefined}
                      />
                      <label htmlFor={`pedir-${c.fieldCode}`}>{c.label}</label>
                      {c.helpText ? (
                        <p className="nota" id={`ayuda-${c.fieldCode}`}>
                          {c.helpText}
                        </p>
                      ) : null}
                      {pedidos.includes(c.fieldCode) ? (
                        <>
                          <input
                            type="checkbox"
                            id={`requerido-${c.fieldCode}`}
                            checked={requeridos.includes(c.fieldCode)}
                            onChange={() => alternar(c.fieldCode, requeridos, setRequeridos)}
                          />
                          <label htmlFor={`requerido-${c.fieldCode}`} className="nota">
                            {`${COPY_FORMULARIOS.marcarRequerido}: ${c.label}`}
                          </label>
                        </>
                      ) : null}
                    </div>
                  ))}
                </fieldset>
              ))}

              <Campo
                id="proposito"
                etiqueta={COPY_FORMULARIOS.proposito}
                ayuda={COPY_FORMULARIOS.ayudaProposito}
                value={proposito}
                onChange={(e) => {
                  setTocado(true);
                  setProposito(e.target.value);
                }}
                maxLength={300}
              />

              <div className="campo">
                <label htmlFor="alcance">{COPY_FORMULARIOS.alcance}</label>
                {elegida.domain ? <p className="campo__ayuda">{COPY_FORMULARIOS.alcanceDeLaPlantilla}</p> : null}
                <select
                  id="alcance"
                  value={alcance}
                  onChange={(e) => {
                    setTocado(true);
                    setAlcance(e.target.value as Alcance);
                  }}
                >
                  {(elegida.domain ? [elegida.domain] : ALCANCES).map((a) => (
                    <option key={a} value={a}>
                      {ETIQUETA_DE_ALCANCE[a]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="acciones">
                <button type="button" className="boton" onClick={() => void enviar()} disabled={enviando || proposito.trim().length === 0}>
                  {COPY_FORMULARIOS.enviarSolicitud}
                </button>
              </div>
            </section>
          ) : null}
        </div>
      ) : null}
    </EstadoDeLectura>
  );
}
