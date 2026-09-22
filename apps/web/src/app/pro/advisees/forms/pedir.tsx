'use client';

/**
 * «Pedir información» (API-FRM-01, 02 y 03). El profesional elige un formulario del catálogo, marca **qué campos**
 * pide de ese formulario y declara para qué los necesita.
 *
 * Dos cosas que la pantalla no hace, a propósito:
 * - **no pide el formulario entero por defecto**: hay que elegir campo por campo, porque «una plantilla con campos
 *   más amplios no amplía B2» (09:1528) y la minimización es del profesional, no del catálogo;
 * - **no promete el dato**: el aviso dice que pedir no amplía el acceso y que hasta que la persona responda no hay
 *   nada nuevo (05:15098-15099).
 *
 * Los alcances se ofrecen los tres: la UI no adivina cuál está autorizado. Si no lo está, la API responde el mismo
 * 404 neutral que ante un asesorado inexistente, y eso es lo que se muestra.
 */
import { ALCANCES, COPY_FORMULARIOS, ETIQUETA_DE_ALCANCE, type Alcance, type CampoDePlantilla, type Plantilla, type VersionDePlantilla } from '@be/domain';
import { useCallback, useEffect, useState } from 'react';
import { Aviso, Campo } from '../../../../components/formulario';
import { api, type Resultado } from '../../../../lib/api';
import { mensajeDeFallo, useClaveDeIntento } from '../../../../lib/intento';
import { EstadoDeLectura, useFormularios } from './formularios';

export function VistaDePedido() {
  const { token, asesoradoId, sesionPerdida, irA } = useFormularios();
  const [r, setR] = useState<Resultado<readonly Plantilla[]> | null>(null);
  const [elegida, setElegida] = useState<VersionDePlantilla | null>(null);
  const [pedidos, setPedidos] = useState<readonly string[]>([]);
  const [requeridos, setRequeridos] = useState<readonly string[]>([]);
  const [proposito, setProposito] = useState('');
  const [alcance, setAlcance] = useState<Alcance>('ENTRENAMIENTO');
  const [aviso, setAviso] = useState<{ tipo: 'error' | 'exito'; texto: string } | null>(null);
  const [enviando, setEnviando] = useState(false);
  const clave = useClaveDeIntento();

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
    async (p: Plantilla) => {
      setAviso(null);
      const v = await api.consultarVersionDePlantilla(token, p.templateId, p.latestVersionId);
      if (sesionPerdida(v)) return;
      if (!v.ok) return setAviso({ tipo: 'error', texto: mensajeDeFallo(v) });
      setElegida(v.datos.data);
      setPedidos([]);
      setRequeridos([]);
    },
    [token, sesionPerdida],
  );

  const alternar = (codigo: string, lista: readonly string[], set: (v: readonly string[]) => void) =>
    set(lista.includes(codigo) ? lista.filter((c) => c !== codigo) : [...lista, codigo]);

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
    if (!r.ok) return setAviso({ tipo: 'error', texto: mensajeDeFallo(r) });
    setElegida(null);
    setProposito('');
    setAviso({ tipo: 'exito', texto: COPY_FORMULARIOS.solicitudEnviada });
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
                onChange={(e) => setProposito(e.target.value)}
                maxLength={300}
              />

              <div className="campo">
                <label htmlFor="alcance">{COPY_FORMULARIOS.alcance}</label>
                <select id="alcance" value={alcance} onChange={(e) => setAlcance(e.target.value as Alcance)}>
                  {ALCANCES.map((a) => (
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
