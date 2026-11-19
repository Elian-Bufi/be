'use client';

/**
 * PG-16 (WP-PULIDO-GRANDES; DL-173, PG-D11, aprobada por Dirección el 2026-11-14) · Las notas propias del profesional en
 * los editores de los planes (DL-167): al lado de cada ejercicio y de cada comida, las notas que el profesional ató ahí, y
 * «Anotar sobre este ejercicio» o «… esta comida» en su menú. El bloc completo («Tus notas») vive en el Resumen de la ficha.
 * - **Una sola lectura por editor** (API-NPP-02), en el proveedor: cada ejercicio y cada comida miran la misma lista. Si no
 *   se puede leer, las notas no se dibujan y el editor sigue igual: una nota nunca traba el armado del plan.
 * - **Solo las ve quien las escribe** (PG-D11): lo dicen la marca del candado y el cuadro al anotar.
 * - **Con «Ocultar nombres»** (PG-T73), el texto no se ve hasta «Mostrar en esta pantalla».
 * - Qué nota va al lado de qué lo decide el dominio (`notas-propias.ts`, con su prueba): el ejercicio del catálogo y la
 *   comida por su nombre, sin tildes ni mayúsculas.
 */
import {
  COPY_NOTAS_PROPIAS as T,
  MAXIMO_DE_CARACTERES_DE_LA_NOTA_PROPIA,
  notasPropiasDeLaComida,
  notasPropiasDelEjercicio,
  type AgregarNotaPropiaRequest,
  type NotaPropia,
  type Resultado,
} from '@be/domain';
import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { CuadroEnfocado } from '../../../components/cuadro-enfocado';
import { Icono } from '../../../components/icono';
import { api } from '../../../lib/api';
import { diaSinElAnioEnCurso } from '../../../lib/formato';
import { mensajeDeFallo, useClaveDeIntento } from '../../../lib/intento';
import { useNombresOcultos } from '../../../lib/nombres-ocultos';

/** Dónde se ata una nota que se escribe desde un editor. */
export type LugarDeLaNota = { readonly tipo: 'EXERCISE'; readonly exerciseId: string; readonly nombre: string } | { readonly tipo: 'MEAL'; readonly nombre: string };

interface ContextoDeNotasPropias {
  /** `null`: todavía no se leyeron, o no se pudieron leer. */
  readonly notas: readonly NotaPropia[] | null;
  readonly anotar: (lugar: LugarDeLaNota) => void;
}

const Contexto = createContext<ContextoDeNotasPropias | null>(null);

/** Las notas propias del editor, o `null` si el editor no está dentro de un proveedor. */
export const useNotasPropias = (): ContextoDeNotasPropias | null => useContext(Contexto);

/** Lee las notas propias sobre la persona una vez y ofrece el cuadro para anotar, a todo el editor. */
export function ProveedorDeNotasPropias({
  token,
  asesoradoId,
  sesionPerdida,
  children,
}: {
  token: string;
  asesoradoId: string;
  sesionPerdida: (r: Resultado<unknown>) => boolean;
  children: ReactNode;
}) {
  const [notas, setNotas] = useState<readonly NotaPropia[] | null>(null);
  const [lugar, setLugar] = useState<LugarDeLaNota | null>(null);
  useEffect(() => {
    let vigente = true;
    void api.notasPropias(token, asesoradoId).then((r) => {
      if (!vigente || sesionPerdida(r)) return;
      setNotas(r.ok ? r.datos.data : null);
    });
    return () => {
      vigente = false;
    };
  }, [token, asesoradoId, sesionPerdida]);
  const guardada = useCallback((n: NotaPropia) => setNotas((anteriores) => [n, ...(anteriores ?? [])]), []);
  const valor = useMemo(() => ({ notas, anotar: setLugar }), [notas]);
  return (
    <Contexto.Provider value={valor}>
      {children}
      <CuadroDeNotaPropia token={token} asesoradoId={asesoradoId} sesionPerdida={sesionPerdida} lugar={lugar} onCerrar={() => setLugar(null)} onGuardada={guardada} />
    </Contexto.Provider>
  );
}

/** El texto de una nota propia, o «Ocultas…» con «Mostrar» si los nombres van ocultos (PG-T73). */
export function TextosDeNotasPropias({ notas, className }: { notas: readonly NotaPropia[]; className: string }) {
  const ocultos = useNombresOcultos();
  const [ver, setVer] = useState(false);
  if (ocultos && !ver) {
    return (
      <p className="nota">
        {T.ocultas}{' '}
        <button type="button" className="boton boton--enlace" onClick={() => setVer(true)}>
          {T.mostrar}
        </button>
      </p>
    );
  }
  return (
    <>
      <ul className={className}>
        {notas.map((n) => (
          <li key={n.noteId}>
            <span className="notas-al-lado__texto">{n.text}</span> <span className="nota">{T.delDia(diaSinElAnioEnCurso(n.recordedAt))}</span>
          </li>
        ))}
      </ul>
      {ocultos ? (
        <button type="button" className="boton boton--enlace" onClick={() => setVer(false)}>
          {T.volverAOcultar}
        </button>
      ) : null}
    </>
  );
}

/** Las notas atadas a un ejercicio o a una comida, al lado de ese lugar en el editor. Sin notas, nada. */
export function NotasAlLado({ ejercicio = null, comida = null }: { ejercicio?: string | null; comida?: string | null }) {
  const c = useNotasPropias();
  if (!c?.notas) return null;
  const notas = ejercicio !== null ? notasPropiasDelEjercicio(c.notas, ejercicio) : comida !== null ? notasPropiasDeLaComida(c.notas, comida) : [];
  if (notas.length === 0) return null;
  return (
    <div className="notas-al-lado" data-notas-propias>
      <p className="notas-al-lado__titulo">
        <Icono nombre="candado" tamano={15} />
        <strong>{T.tusNotas(notas.length)}</strong>
        <span className="nota">· {T.soloVos}</span>
      </p>
      <TextosDeNotasPropias notas={notas} className="notas-al-lado__lista" />
    </div>
  );
}

/** El cuadro para anotar sobre un ejercicio o una comida (API-NPP-01). Escape y «Cancelar» no escriben nada. */
function CuadroDeNotaPropia({
  token,
  asesoradoId,
  sesionPerdida,
  lugar,
  onCerrar,
  onGuardada,
}: {
  token: string;
  asesoradoId: string;
  sesionPerdida: (r: Resultado<unknown>) => boolean;
  lugar: LugarDeLaNota | null;
  onCerrar: () => void;
  onGuardada: (n: NotaPropia) => void;
}) {
  const id = useId();
  const campo = useRef<HTMLTextAreaElement>(null);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [fallo, setFallo] = useState<string | null>(null);
  const intento = useClaveDeIntento();
  useEffect(() => {
    setTexto('');
    setFallo(null);
  }, [lugar]);
  const limpio = texto.trim();
  const titulo = lugar === null ? '' : lugar.tipo === 'EXERCISE' ? T.tituloDelCuadroDelEjercicio(lugar.nombre) : T.tituloDelCuadroDeLaComida(lugar.nombre);
  const guardar = async () => {
    if (lugar === null || limpio === '' || enviando) return;
    const cuerpo: AgregarNotaPropiaRequest = { text: limpio, anchor: lugar.tipo === 'EXERCISE' ? { type: 'EXERCISE', exerciseId: lugar.exerciseId } : { type: 'MEAL', mealLabel: lugar.nombre } };
    setEnviando(true);
    setFallo(null);
    const r = await api.agregarNotaPropia(token, asesoradoId, cuerpo, intento.actual(JSON.stringify(cuerpo)));
    intento.registrar(r);
    setEnviando(false);
    if (sesionPerdida(r)) return;
    if (!r.ok) return setFallo(mensajeDeFallo(r));
    onGuardada(r.datos.data);
    onCerrar();
  };
  return (
    <CuadroEnfocado
      abierto={lugar !== null}
      forma="dialogo"
      titulo={titulo}
      ocupado={enviando}
      conCambios={limpio !== ''}
      focoInicial={campo}
      principal={{ texto: T.guardar, alTocar: () => void guardar(), apagado: limpio === '' ? T.faltaElTexto : null, alTocarApagado: () => campo.current?.focus(), enviando, textoEnviando: T.guardando }}
      onCerrar={onCerrar}
    >
      <p className="nota notas-al-lado__ayuda">
        <Icono nombre="candado" tamano={15} />
        {T.ayudaDelCuadro}
      </p>
      <div className="campo">
        <label htmlFor={`${id}-texto`}>{T.escribir}</label>
        <textarea ref={campo} id={`${id}-texto`} rows={4} value={texto} maxLength={MAXIMO_DE_CARACTERES_DE_LA_NOTA_PROPIA} aria-describedby={`${id}-cuenta`} onChange={(e) => setTexto(e.target.value)} />
        <p id={`${id}-cuenta`} className="campo__ayuda">
          {T.quedan(MAXIMO_DE_CARACTERES_DE_LA_NOTA_PROPIA - texto.length)}
        </p>
      </div>
      {fallo ? (
        <p className="campo__error" role="alert">
          {fallo}
        </p>
      ) : null}
    </CuadroEnfocado>
  );
}
