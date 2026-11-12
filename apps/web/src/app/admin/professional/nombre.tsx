'use client';

/**
 * UF-04 de WP-USO-FINAL (DL-169; UF-D7) · cambiar el nombre profesional desde la ficha (API-ADM-15). Es parte de lo
 * verificado y lo ven las personas que el profesional acompaña: se cambia con un fundamento, contra el nombre que se ve en
 * la ficha. Si cambió mientras tanto (409), la ficha se vuelve a leer y se dice.
 */
import { COPY, COPY_ADMINISTRACION, evaluarCambioDeNombre, LARGO_MAXIMO_DEL_FUNDAMENTO, type FichaDeProfesionalResponse, type ValidationIssue } from '@be/domain';
import { useId, useRef, useState, type FormEvent } from 'react';
import { Aviso, Campo, ResumenDeErrores } from '../../../components/formulario';
import { apiAdministrativa } from '../../../lib/api-administrativa';
import { nuevaClaveAdministrativa, useAdministracion } from '../../../lib/sesion-administrativa';

const N = COPY_ADMINISTRACION.nombreProfesional;
const P = COPY_ADMINISTRACION.incorporacion.problema;

export function CambioDelNombreProfesional({
  profesionalId,
  nombreDeHoy,
  alCambiar,
  alReleer,
}: {
  profesionalId: string;
  nombreDeHoy: string;
  alCambiar: (ficha: FichaDeProfesionalResponse, aviso: string) => void;
  alReleer: () => Promise<boolean>;
}) {
  const id = useId();
  const { sesion, revisar } = useAdministracion();
  const [abierto, setAbierto] = useState(false);
  const [nombre, setNombre] = useState('');
  const [fundamento, setFundamento] = useState('');
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [falla, setFalla] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [intento, setIntento] = useState(0);
  const clave = useRef<string | null>(null);
  const campoNombre = `${id}-nombre`;
  const campoFundamento = `${id}-fundamento`;

  function mostrar(issues: readonly ValidationIssue[]) {
    const porCampo: Record<string, string> = {};
    for (const i of issues) {
      const campo = i.path === 'rationale' ? campoFundamento : campoNombre;
      porCampo[campo] ??= i.code === 'SAME_DISPLAY_NAME' ? N.igual : (P[i.code] ?? COPY.noDisponible);
    }
    setErrores(porCampo);
    setIntento((n) => n + 1);
  }

  async function cambiar(e: FormEvent) {
    e.preventDefault();
    if (enviando || !sesion) return;
    setFalla(null);
    const pedido = { professionalName: nombre, expectedName: nombreDeHoy, rationale: fundamento };
    const evaluado = evaluarCambioDeNombre(pedido, nombreDeHoy);
    if (!evaluado.ok) return mostrar(evaluado.issues);
    setErrores({});
    setEnviando(true);
    clave.current ??= nuevaClaveAdministrativa();
    const r = await apiAdministrativa.cambiarNombreProfesional(sesion.token, profesionalId, pedido, clave.current);
    setEnviando(false);
    if (r.ok) {
      clave.current = null;
      setAbierto(false);
      setNombre('');
      setFundamento('');
      alCambiar(r.datos, N.cambiado(r.datos.data.professional.displayName));
      return;
    }
    if (r.tipo === 'RED' || r.codigo === 'RESPUESTA_NO_RECONOCIDA') return setFalla(COPY.resultadoIncierto);
    clave.current = null;
    if (revisar(r)) return;
    if (r.codigo === 'VERSION_CONFLICT') {
      const llego = await alReleer();
      return setFalla(llego ? N.cambioEnOtroLugar : COPY.noDisponible);
    }
    if (r.codigo === 'VALIDATION_FAILED' && r.issues.length > 0) return mostrar(r.issues);
    setFalla(COPY.noDisponible);
  }

  if (!abierto) {
    return (
      <button type="button" className="boton boton--secundario boton--compacto" onClick={() => setAbierto(true)}>
        {N.abrir}
      </button>
    );
  }

  const lista = Object.entries(errores).map(([campo, texto]) => ({ id: campo, texto }));
  return (
    <section className="panel" aria-labelledby={`${id}-titulo`}>
      <h2 id={`${id}-titulo`}>{N.titulo}</h2>
      <p className="bajada">{N.queEs}</p>
      <form className="formulario" onSubmit={cambiar} noValidate>
        <ResumenDeErrores titulo={COPY.resumenDeErrores(lista.length)} errores={lista} intento={intento} />
        {falla ? (
          <Aviso tipo="error" enfocar>
            <p>{falla}</p>
          </Aviso>
        ) : null}
        <Campo
          id={campoNombre}
          etiqueta={N.nombre}
          autoComplete="off"
          maxLength={80}
          value={nombre}
          onChange={(ev) => {
            clave.current = null;
            setNombre(ev.target.value);
          }}
          error={errores[campoNombre]}
          required
        />
        <div className={`campo${errores[campoFundamento] ? ' campo--error' : ''}`}>
          <label htmlFor={campoFundamento}>{N.fundamento}</label>
          <p id={`${campoFundamento}-ayuda`} className="campo__ayuda">
            {N.fundamentoAyuda}
          </p>
          <textarea
            id={campoFundamento}
            rows={3}
            maxLength={LARGO_MAXIMO_DEL_FUNDAMENTO}
            value={fundamento}
            aria-invalid={errores[campoFundamento] ? true : undefined}
            aria-describedby={errores[campoFundamento] ? `${campoFundamento}-ayuda ${campoFundamento}-error` : `${campoFundamento}-ayuda`}
            onChange={(ev) => {
              clave.current = null;
              setFundamento(ev.target.value);
            }}
          />
          {errores[campoFundamento] ? (
            <p id={`${campoFundamento}-error`} className="campo__error">
              {errores[campoFundamento]}
            </p>
          ) : null}
        </div>
        <div className="acciones">
          <button type="submit" className="boton boton--primario" disabled={enviando} aria-busy={enviando}>
            {enviando ? N.guardando : N.guardar}
          </button>
          <button type="button" className="boton boton--secundario" onClick={() => setAbierto(false)} disabled={enviando}>
            {N.cancelar}
          </button>
        </div>
      </form>
    </section>
  );
}
