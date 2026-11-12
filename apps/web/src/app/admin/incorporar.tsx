'use client';

/**
 * UF-04 de WP-USO-FINAL (DL-169; UF-D6 y UF-D8) · incorporar a un profesional real (API-ADM-14) desde la lista de la
 * consola. La persona creó su cuenta con su nombre y pidió entrar como profesional por el canal de ayuda; Administración
 * verificó la matrícula o la formación fuera de BE, y acá la incorpora con su nombre profesional, su tipo, su matrícula si
 * es de la salud, las áreas y dónde se verificó.
 * - **Antes de enviar,** la misma regla que la API (`evaluarIncorporacion`): cada problema va a su campo y al resumen.
 * - **Un intento, una clave de idempotencia:** el doble clic o el reintento de un resultado incierto reusan la misma.
 * - **Al incorporar,** se abre la ficha del profesional.
 */
import { ALCANCES, COPY, COPY_ADMINISTRACION, ETIQUETA_DE_ALCANCE, evaluarIncorporacion, LARGO_MAXIMO_DEL_FUNDAMENTO, type Alcance, type IncorporarProfesionalRequest, type ValidationIssue } from '@be/domain';
import { useRouter } from 'next/navigation';
import { useId, useRef, useState, type FormEvent } from 'react';
import { Aviso, Campo, ResumenDeErrores } from '../../components/formulario';
import { apiAdministrativa } from '../../lib/api-administrativa';
import { nuevaClaveAdministrativa, useAdministracion } from '../../lib/sesion-administrativa';

const I = COPY_ADMINISTRACION.incorporacion;

/** Cada issue de la regla o de la API, en su campo del formulario. */
const CAMPO_DEL_ISSUE = (i: ValidationIssue): string => {
  if (i.path.startsWith('license.number')) return 'inc-matricula-numero';
  if (i.path.startsWith('license.jurisdiction')) return 'inc-matricula-jurisdiccion';
  if (i.path === 'license') return 'inc-matricula-numero';
  if (i.path === 'professionalName') return 'inc-nombre';
  if (i.path === 'scopes') return 'inc-areas';
  if (i.path === 'rationale') return 'inc-fundamento';
  return 'inc-correo';
};

export function IncorporarProfesional() {
  const id = useId();
  const router = useRouter();
  const { sesion, revisar } = useAdministracion();
  const [abierto, setAbierto] = useState(false);
  const [correo, setCorreo] = useState('');
  const [nombre, setNombre] = useState('');
  const [sanitario, setSanitario] = useState(true);
  const [numero, setNumero] = useState('');
  const [jurisdiccion, setJurisdiccion] = useState('');
  const [areas, setAreas] = useState<readonly Alcance[]>([]);
  const [fundamento, setFundamento] = useState('');
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [falla, setFalla] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [intento, setIntento] = useState(0);
  const clave = useRef<string | null>(null);

  /** Editar lo escrito es otro intento: la clave anterior se descarta. */
  const editar = <T,>(fijar: (v: T) => void) => (v: T) => {
    clave.current = null;
    fijar(v);
  };

  const pedido = (): IncorporarProfesionalRequest => ({
    email: correo,
    professionalName: nombre,
    profileType: sanitario ? 'HEALTH_PROFESSIONAL' : 'NON_HEALTH_PROFESSIONAL',
    license: sanitario ? { number: numero, jurisdiction: jurisdiccion } : null,
    scopes: [...areas],
    rationale: fundamento,
  });

  function mostrar(issues: readonly ValidationIssue[]) {
    const porCampo: Record<string, string> = {};
    for (const i of issues) porCampo[CAMPO_DEL_ISSUE(i)] ??= I.problema[i.code] ?? COPY.noDisponible;
    setErrores(porCampo);
    setIntento((n) => n + 1);
  }

  async function incorporar(e: FormEvent) {
    e.preventDefault();
    if (enviando || !sesion) return;
    setFalla(null);
    const evaluada = evaluarIncorporacion(pedido());
    if (!evaluada.ok) return mostrar(evaluada.issues);
    setErrores({});
    setEnviando(true);
    clave.current ??= nuevaClaveAdministrativa();
    const r = await apiAdministrativa.incorporarProfesional(sesion.token, pedido(), clave.current);
    setEnviando(false);
    if (r.ok) {
      clave.current = null;
      router.push(`/admin/professional?id=${encodeURIComponent(r.datos.data.professional.professionalId)}`);
      return;
    }
    // Sin respuesta (o una que no se reconoce): no se sabe si se incorporó. El reintento usa la misma clave.
    if (r.tipo === 'RED' || r.codigo === 'RESPUESTA_NO_RECONOCIDA') return setFalla(COPY.resultadoIncierto);
    clave.current = null;
    if (revisar(r)) return;
    if (r.codigo === 'VALIDATION_FAILED' && r.issues.length > 0) return mostrar(r.issues);
    if (r.codigo === 'RESOURCE_NOT_FOUND') {
      setErrores({ 'inc-correo': I.sinCuenta });
      setIntento((n) => n + 1);
      return;
    }
    setFalla(COPY.noDisponible);
  }

  if (!abierto) {
    return (
      <button type="button" className="boton boton--primario boton--compacto" onClick={() => setAbierto(true)}>
        {I.abrir}
      </button>
    );
  }

  const lista = Object.entries(errores).map(([campo, texto]) => ({ id: campo, texto }));
  return (
    <section className="panel incorporar-profesional" aria-labelledby={`${id}-titulo`}>
      <h2 id={`${id}-titulo`}>{I.titulo}</h2>
      <p className="bajada">{I.queEs}</p>
      <form className="formulario" onSubmit={incorporar} noValidate>
        <ResumenDeErrores titulo={COPY.resumenDeErrores(lista.length)} errores={lista} intento={intento} />
        {falla ? (
          <Aviso tipo="error" enfocar>
            <p>{falla}</p>
          </Aviso>
        ) : null}
        <Campo id="inc-correo" etiqueta={I.correo} ayuda={I.correoAyuda} type="email" autoComplete="off" value={correo} onChange={(ev) => editar(setCorreo)(ev.target.value)} error={errores['inc-correo']} required />
        <Campo id="inc-nombre" etiqueta={I.nombre} ayuda={I.nombreAyuda} autoComplete="off" maxLength={80} value={nombre} onChange={(ev) => editar(setNombre)(ev.target.value)} error={errores['inc-nombre']} required />
        <fieldset className="campo">
          <legend>{I.tipo}</legend>
          <label className="opcion">
            <input type="radio" name="inc-tipo" checked={sanitario} onChange={() => editar(setSanitario)(true)} /> {I.sanitario}
          </label>
          <label className="opcion">
            <input type="radio" name="inc-tipo" checked={!sanitario} onChange={() => editar(setSanitario)(false)} /> {I.noSanitario}
          </label>
        </fieldset>
        {sanitario ? (
          <>
            <Campo id="inc-matricula-numero" etiqueta={I.matriculaNumero} ayuda={I.matriculaNumeroAyuda} autoComplete="off" maxLength={60} value={numero} onChange={(ev) => editar(setNumero)(ev.target.value)} error={errores['inc-matricula-numero']} required />
            <Campo id="inc-matricula-jurisdiccion" etiqueta={I.matriculaJurisdiccion} autoComplete="off" maxLength={100} value={jurisdiccion} onChange={(ev) => editar(setJurisdiccion)(ev.target.value)} error={errores['inc-matricula-jurisdiccion']} required />
          </>
        ) : null}
        <fieldset className="campo" id="inc-areas" aria-describedby={errores['inc-areas'] ? 'inc-areas-error' : undefined}>
          <legend>{I.areas}</legend>
          {ALCANCES.map((a) => (
            <label key={a} className="opcion">
              <input type="checkbox" checked={areas.includes(a)} onChange={(ev) => editar(setAreas)(ev.target.checked ? [...areas, a] : areas.filter((x) => x !== a))} /> {ETIQUETA_DE_ALCANCE[a]}
            </label>
          ))}
          {errores['inc-areas'] ? (
            <p className="campo__error" id="inc-areas-error">
              {errores['inc-areas']}
            </p>
          ) : null}
        </fieldset>
        <div className={`campo${errores['inc-fundamento'] ? ' campo--error' : ''}`}>
          <label htmlFor="inc-fundamento">{I.fundamento}</label>
          <p id="inc-fundamento-ayuda" className="campo__ayuda">
            {I.fundamentoAyuda}
          </p>
          <textarea
            id="inc-fundamento"
            rows={3}
            maxLength={LARGO_MAXIMO_DEL_FUNDAMENTO}
            value={fundamento}
            aria-invalid={errores['inc-fundamento'] ? true : undefined}
            aria-describedby={errores['inc-fundamento'] ? 'inc-fundamento-ayuda inc-fundamento-error' : 'inc-fundamento-ayuda'}
            onChange={(ev) => editar(setFundamento)(ev.target.value)}
          />
          {errores['inc-fundamento'] ? (
            <p id="inc-fundamento-error" className="campo__error">
              {errores['inc-fundamento']}
            </p>
          ) : null}
        </div>
        <div className="acciones">
          <button type="submit" className="boton boton--primario" disabled={enviando} aria-busy={enviando}>
            {enviando ? I.incorporando : I.incorporar}
          </button>
          <button type="button" className="boton boton--secundario" onClick={() => setAbierto(false)} disabled={enviando}>
            {I.cancelar}
          </button>
        </div>
      </form>
    </section>
  );
}
