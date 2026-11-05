'use client';

/**
 * Los nueve tipos de respuesta de un formulario V2 (DL-164 D-1), dibujados para el escritorio del profesional: los usa
 * «Cargar con la persona» (`cargar.tsx`). Cada pieza recibe el campo de la plantilla y el valor actual (o nada) y avisa
 * el valor nuevo, o `null` para dejar la pregunta sin responder: el estado vive en quien las dibuja.
 * - **Nada viene elegido, y lo elegido se puede soltar.** Una pregunta sin responder se omite, nunca viaja vacía
 *   (09:1586-1587): por eso el Sí o no, la opción única y las varias opciones tienen «Quitar respuesta», y cada fila de
 *   la tabla, «Quitar» (DL-165 D-2: el mismo nombre que en la app). Acá se ofrece también en una obligatoria: lo que
 *   carga el profesional no exige las obligatorias, la persona las completa al confirmar.
 * - **El ejemplo de una respuesta de texto es su texto de muestra** (D-2, `ayudaDeLaPregunta`).
 * - **Un número se escribe con coma** (como en el editor de comidas). Lo que no se entiende se dice junto al campo y no
 *   se manda como cero: queda como un valor sin forma, que la revisión frena antes de enviar.
 * - Casillas y botones de opción nativos (foco visible, teclado, lector de pantalla); los alimentos sugeridos son chips
 *   con `aria-pressed`. Cada control lleva un nombre que dice la fila y la columna («Sentadilla: Con ayuda»).
 */
import { ayudaDeLaPregunta, COPY_FORMULARIOS as F, COPY_FORMULARIOS_V2 as V, LARGO_MAXIMO_DE_ALIMENTO, LARGO_MAXIMO_DE_OTRO, leerNumero, motivoDeNumeroIlegible, type CampoDePlantillaV2, type LimitesNumericos, type SubcampoDeLista, type ValorDeRespuestaV2, type ValorDeSubcampo } from '@be/domain';
import { useEffect, useRef, useState } from 'react';
import { Campo } from '../../../../components/formulario';
import { numeroEnCampo } from '../../../../lib/formato';
import { alternarOpcionMultiple } from './formulario-de-inicio';

type CampoDe<T extends CampoDePlantillaV2['dataType']> = Extract<CampoDePlantillaV2, { dataType: T }>;

export interface PropsDeCampoV2<C extends CampoDePlantillaV2 = CampoDePlantillaV2> {
  /** Base de los `id` de los controles de esta pregunta. */
  readonly id: string;
  readonly campo: C;
  readonly valor: ValorDeRespuestaV2 | undefined;
  /** El valor nuevo, o `null` para dejar la pregunta sin responder. */
  readonly onCambiar: (valor: ValorDeRespuestaV2 | null) => void;
  readonly deshabilitado: boolean;
  /** El `id` del texto de la pregunta: nombra los controles que no tienen un rótulo propio. */
  readonly labelledBy: string;
  /** Los `id` de lo que describe la pregunta (la ayuda, para qué se usa, los problemas). */
  readonly describedBy?: string;
}

const QUITAR = 'Quitar';
const SUMAR = 'Sumar';

/**
 * «¿Para qué?» (DL-165 D-2): para qué se usa el dato, plegado debajo de la pregunta. El botón dice si está desplegado y
 * de qué pregunta es; el texto desplegado describe la pregunta para el lector de pantalla (`idDelTexto`).
 */
export function ParaQueDeLaPregunta({ idDelTexto, pregunta, texto }: { idDelTexto: string; pregunta: string; texto: string }) {
  const [abierto, setAbierto] = useState(false);
  return (
    <div className="pregunta-de-inicio__para-que">
      <button type="button" className="boton boton--enlace" aria-expanded={abierto} aria-controls={idDelTexto} aria-label={V.paraQueDe(pregunta)} onClick={() => setAbierto(!abierto)}>
        {V.paraQueBoton}
      </button>
      <p id={idDelTexto} className="nota" hidden={!abierto}>
        {texto}
      </p>
    </div>
  );
}

/** Una pregunta, según su tipo. */
export function CampoV2(p: PropsDeCampoV2) {
  switch (p.campo.dataType) {
    case 'TEXT':
      return <CampoTexto {...p} campo={p.campo} />;
    case 'NUMBER':
      return <CampoNumero {...p} campo={p.campo} />;
    case 'BOOLEAN':
      return <CampoSiONo {...p} campo={p.campo} />;
    case 'CHOICE':
      return <CampoUnaOpcion {...p} campo={p.campo} />;
    case 'MULTI_CHOICE':
      return <CampoVariasOpciones {...p} campo={p.campo} />;
    case 'LIST':
      return <CampoLista {...p} campo={p.campo} />;
    case 'MATRIX':
      return <CampoTabla {...p} campo={p.campo} />;
    case 'FOODS':
      return <CampoAlimentos {...p} campo={p.campo} />;
    case 'TIMES':
      return <CampoHorarios {...p} campo={p.campo} />;
  }
}

/** «Quitar respuesta» (DL-165 D-2): la pregunta vuelve a quedar sin responder. En una fila de la tabla dice «Quitar», con la fila para el lector. */
function QuitarRespuesta({ onClick, deshabilitado, de, corto = false }: { onClick: () => void; deshabilitado: boolean; de?: string; corto?: boolean }) {
  return (
    <button type="button" className="boton boton--enlace campo-de-inicio__sin-responder" onClick={onClick} disabled={deshabilitado} aria-label={de ? V.quitarRespuestaDe(de) : undefined}>
      {corto ? QUITAR : V.quitarRespuesta}
    </button>
  );
}

// ─── Texto y número ─────────────────────────────────────────────────────────────────────────────

function CampoTexto({ id, campo, valor, onCambiar, deshabilitado, labelledBy, describedBy }: PropsDeCampoV2<CampoDe<'TEXT'>>) {
  const texto = valor?.type === 'TEXT' ? valor.text : '';
  const cambiar = (t: string) => onCambiar(t === '' ? null : { type: 'TEXT', text: t });
  // DL-165 D-2: el ejemplo es el texto de muestra; para el lector de pantalla lo describe la pregunta (`describedBy`).
  const muestra = ayudaDeLaPregunta(campo).deMuestra ?? undefined;
  const comun = { id, value: texto, maxLength: campo.maxLength, disabled: deshabilitado, placeholder: muestra, 'aria-labelledby': labelledBy, 'aria-describedby': describedBy, autoComplete: 'off' as const };
  return <div className="campo campo-de-inicio__control">{campo.multiline ? <textarea {...comun} rows={3} onChange={(e) => cambiar(e.target.value)} /> : <input {...comun} type="text" onChange={(e) => cambiar(e.target.value)} />}</div>;
}

/** Los límites de un número, en palabras: «entre 1 y 7, entero». `null` sin límites. */
function limitesEnPalabras(limites: LimitesNumericos | null): string | null {
  if (!limites) return null;
  const partes: string[] = [];
  if (limites.minimum !== undefined && limites.maximum !== undefined) partes.push(`entre ${numeroEnCampo(limites.minimum)} y ${numeroEnCampo(limites.maximum)}`);
  else if (limites.minimum !== undefined) partes.push(`desde ${numeroEnCampo(limites.minimum)}`);
  else if (limites.maximum !== undefined) partes.push(`hasta ${numeroEnCampo(limites.maximum)}`);
  if (limites.integer) partes.push('entero');
  return partes.length > 0 ? `Un número ${partes.join(', ')}.` : null;
}

/**
 * Un número escrito con coma. `numero` es lo que rige afuera (`NaN` si lo escrito no se entendió); lo escrito se
 * conserva mientras no se entienda, para corregirlo, y se resincroniza si el valor cambia desde afuera.
 */
function EntradaNumerica({
  id,
  etiqueta,
  numero,
  unidad,
  limites,
  onCambiar,
  deshabilitado,
  labelledBy,
  describedBy,
}: {
  id: string;
  etiqueta?: string;
  numero: number | null;
  unidad: string | null;
  limites: LimitesNumericos | null;
  /** `null` si quedó vacío; `NaN` si lo escrito no es un número. */
  onCambiar: (numero: number | null) => void;
  deshabilitado: boolean;
  labelledBy?: string;
  describedBy?: string;
}) {
  const [escrito, setEscrito] = useState(() => numeroEnCampo(numero));
  useEffect(() => {
    setEscrito((t) => {
      if (numero === null) return t.trim() === '' ? t : '';
      if (Number.isNaN(numero)) return t;
      return leerNumero(t) === numero ? t : numeroEnCampo(numero);
    });
  }, [numero]);
  const ilegible = escrito.trim() !== '' && leerNumero(escrito) === null ? motivoDeNumeroIlegible(escrito) : null;
  const limitesDichos = limitesEnPalabras(limites);
  const descripcion = [describedBy, limitesDichos ? `${id}-limites` : null, ilegible ? `${id}-ilegible` : null].filter(Boolean).join(' ') || undefined;
  return (
    <div className={`campo campo-de-inicio__control campo-de-inicio__numero${ilegible ? ' campo--error' : ''}`}>
      {etiqueta ? <label htmlFor={id}>{etiqueta}</label> : null}
      {limitesDichos ? (
        <p id={`${id}-limites`} className="campo__ayuda">
          {limitesDichos}
        </p>
      ) : null}
      <span className="campo-de-inicio__con-unidad">
        <input
          id={id}
          type="text"
          inputMode="decimal"
          value={escrito}
          disabled={deshabilitado}
          autoComplete="off"
          aria-labelledby={etiqueta ? undefined : labelledBy}
          aria-invalid={ilegible ? true : undefined}
          aria-describedby={descripcion}
          onChange={(e) => {
            const t = e.target.value;
            setEscrito(t);
            onCambiar(t.trim() === '' ? null : (leerNumero(t) ?? NaN));
          }}
        />
        {unidad ? <span className="campo-de-inicio__unidad">{unidad}</span> : null}
      </span>
      {ilegible ? (
        <p id={`${id}-ilegible`} className="campo__error">
          <span aria-hidden="true">⚠ </span>
          {ilegible}
        </p>
      ) : null}
    </div>
  );
}

function CampoNumero({ id, campo, valor, onCambiar, deshabilitado, labelledBy, describedBy }: PropsDeCampoV2<CampoDe<'NUMBER'>>) {
  return (
    <EntradaNumerica
      id={id}
      numero={valor?.type === 'NUMBER' ? valor.number : null}
      unidad={campo.unit}
      limites={campo.limits}
      onCambiar={(n) => onCambiar(n === null ? null : { type: 'NUMBER', number: n, unit: campo.unit })}
      deshabilitado={deshabilitado}
      labelledBy={labelledBy}
      describedBy={describedBy}
    />
  );
}

// ─── Sí o no, una opción, varias opciones ───────────────────────────────────────────────────────

function CampoSiONo({ id, valor, onCambiar, deshabilitado, labelledBy, describedBy }: PropsDeCampoV2<CampoDe<'BOOLEAN'>>) {
  const elegido = valor?.type === 'BOOLEAN' ? valor.yes : null;
  return (
    <>
      <div className="opciones-de-inicio" role="radiogroup" aria-labelledby={labelledBy} aria-describedby={describedBy}>
        {[true, false].map((v) => (
          <label key={String(v)} className="opcion-de-inicio">
            <input type="radio" name={id} checked={elegido === v} onChange={() => onCambiar({ type: 'BOOLEAN', yes: v })} disabled={deshabilitado} />
            {v ? F.si : F.no}
          </label>
        ))}
      </div>
      {elegido !== null ? <QuitarRespuesta onClick={() => onCambiar(null)} deshabilitado={deshabilitado} /> : null}
    </>
  );
}

function CampoUnaOpcion({ id, campo, valor, onCambiar, deshabilitado, labelledBy, describedBy }: PropsDeCampoV2<CampoDe<'CHOICE'>>) {
  const elegida = valor?.type === 'CHOICE' ? valor.option : null;
  const otro = valor?.type === 'CHOICE' ? (valor.otherText ?? '') : '';
  const esOtro = elegida !== null && elegida === campo.otherOptionCode;
  const elegir = (option: string, otherText: string) => onCambiar({ type: 'CHOICE', option, otherText: option === campo.otherOptionCode && otherText.trim() !== '' ? otherText : null });
  return (
    <>
      <div className="opciones-de-inicio" role="radiogroup" aria-labelledby={labelledBy} aria-describedby={describedBy}>
        {campo.options.map((o) => (
          <label key={o.code} className="opcion-de-inicio">
            <input type="radio" name={id} checked={elegida === o.code} onChange={() => elegir(o.code, otro)} disabled={deshabilitado} />
            {o.label}
          </label>
        ))}
      </div>
      {esOtro ? <Campo id={`${id}-otro`} etiqueta={V.cualOtro} value={otro} maxLength={LARGO_MAXIMO_DE_OTRO} autoComplete="off" disabled={deshabilitado} onChange={(e) => elegir(elegida, e.target.value)} /> : null}
      {elegida !== null ? <QuitarRespuesta onClick={() => onCambiar(null)} deshabilitado={deshabilitado} /> : null}
    </>
  );
}

function CampoVariasOpciones({ id, campo, valor, onCambiar, deshabilitado, labelledBy, describedBy }: PropsDeCampoV2<CampoDe<'MULTI_CHOICE'>>) {
  const elegidas = valor?.type === 'MULTI_CHOICE' ? valor.options : [];
  const otro = valor?.type === 'MULTI_CHOICE' ? (valor.otherText ?? '') : '';
  const emitir = (options: readonly string[], otherText: string) =>
    onCambiar(options.length === 0 ? null : { type: 'MULTI_CHOICE', options: [...options], otherText: campo.otherOptionCode !== null && options.includes(campo.otherOptionCode) && otherText.trim() !== '' ? otherText : null });
  const sinExclusivas = elegidas.filter((c) => !campo.exclusiveOptionCodes.includes(c));
  const tope = campo.maxSelected !== null && sinExclusivas.length >= campo.maxSelected;
  const esOtro = campo.otherOptionCode !== null && elegidas.includes(campo.otherOptionCode);
  const idTope = campo.maxSelected !== null ? `${id}-tope` : null;
  return (
    <>
      {campo.maxSelected !== null ? (
        <p id={idTope ?? undefined} className="campo__ayuda">
          Hasta {campo.maxSelected}.
        </p>
      ) : null}
      <div className="opciones-de-inicio" role="group" aria-labelledby={labelledBy} aria-describedby={[describedBy, idTope].filter(Boolean).join(' ') || undefined}>
        {campo.options.map((o) => {
          const marcada = elegidas.includes(o.code);
          return (
            <label key={o.code} className="opcion-de-inicio">
              <input type="checkbox" checked={marcada} disabled={deshabilitado || (!marcada && tope && !campo.exclusiveOptionCodes.includes(o.code))} onChange={() => emitir(alternarOpcionMultiple(campo, elegidas, o.code), otro)} />
              {o.label}
            </label>
          );
        })}
      </div>
      {esOtro ? <Campo id={`${id}-otro`} etiqueta={V.cualOtro} value={otro} maxLength={LARGO_MAXIMO_DE_OTRO} autoComplete="off" disabled={deshabilitado} onChange={(e) => emitir(elegidas, e.target.value)} /> : null}
      {elegidas.length > 0 ? <QuitarRespuesta onClick={() => onCambiar(null)} deshabilitado={deshabilitado} /> : null}
    </>
  );
}

// ─── Lista que se repite ────────────────────────────────────────────────────────────────────────

type Renglon = Readonly<Record<string, ValorDeSubcampo>>;

function Subcampo({ id, sub, valor, onCambiar, deshabilitado }: { id: string; sub: SubcampoDeLista; valor: ValorDeSubcampo | undefined; onCambiar: (v: ValorDeSubcampo | null) => void; deshabilitado: boolean }) {
  const etiqueta = sub.required ? sub.label : `${sub.label} (${V.opcional.toLowerCase()})`;
  switch (sub.dataType) {
    case 'TEXT':
      // Formato 3 (DL-165 D-2): el ejemplo del renglón es su texto de muestra.
      return (
        <Campo
          id={id}
          etiqueta={etiqueta}
          value={typeof valor === 'string' ? valor : ''}
          maxLength={sub.maxLength}
          autoComplete="off"
          placeholder={sub.helpText}
          disabled={deshabilitado}
          onChange={(e) => onCambiar(e.target.value === '' ? null : e.target.value)}
        />
      );
    case 'MULTI_CHOICE': {
      // Formato 3 (DL-165 D-6): varias opciones dentro del renglón («Qué días»), en el orden de la pregunta.
      const elegidos = Array.isArray(valor) ? valor : [];
      const alternar = (codigo: string) => {
        const nuevos = elegidos.includes(codigo) ? elegidos.filter((c) => c !== codigo) : [...elegidos, codigo];
        const enOrden = sub.options.map((o) => o.code).filter((c) => nuevos.includes(c));
        onCambiar(enOrden.length === 0 ? null : enOrden);
      };
      return (
        <fieldset className="lista-que-se-repite__varias" id={id}>
          <legend>{etiqueta}</legend>
          <div className="opciones-de-inicio">
            {sub.options.map((o) => (
              <label key={o.code} className="opcion-de-inicio">
                <input type="checkbox" checked={elegidos.includes(o.code)} onChange={() => alternar(o.code)} disabled={deshabilitado} />
                {o.label}
              </label>
            ))}
          </div>
        </fieldset>
      );
    }
    case 'NUMBER':
      return <EntradaNumerica id={id} etiqueta={etiqueta} numero={typeof valor === 'number' ? valor : null} unidad={sub.unit} limites={sub.limits} onCambiar={onCambiar} deshabilitado={deshabilitado} />;
    case 'CHOICE':
      return (
        <div className="campo">
          <label htmlFor={id}>{etiqueta}</label>
          <select id={id} value={typeof valor === 'string' ? valor : ''} disabled={deshabilitado} onChange={(e) => onCambiar(e.target.value === '' ? null : e.target.value)}>
            <option value="">{V.sinResponder}</option>
            {sub.options.map((o) => (
              <option key={o.code} value={o.code}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      );
    case 'BOOLEAN':
      return (
        <div className="campo">
          <label htmlFor={id}>{etiqueta}</label>
          <select id={id} value={valor === true ? 'si' : valor === false ? 'no' : ''} disabled={deshabilitado} onChange={(e) => onCambiar(e.target.value === '' ? null : e.target.value === 'si')}>
            <option value="">{V.sinResponder}</option>
            <option value="si">{F.si}</option>
            <option value="no">{F.no}</option>
          </select>
        </div>
      );
  }
}

function CampoLista({ id, campo, valor, onCambiar, deshabilitado, labelledBy, describedBy }: PropsDeCampoV2<CampoDe<'LIST'>>) {
  const renglones: readonly Renglon[] = valor?.type === 'LIST' ? valor.items : [];
  // Una clave estable por renglón: al quitar uno, los demás conservan lo que tienen escrito.
  const claves = useRef<number[]>([]);
  const proxima = useRef(0);
  while (claves.current.length < renglones.length) claves.current.push(proxima.current++);
  if (claves.current.length > renglones.length) claves.current.length = renglones.length;
  const emitir = (items: readonly Renglon[]) => onCambiar(items.length === 0 ? null : { type: 'LIST', items: items.map((r) => ({ ...r })) });
  const cambiar = (i: number, codigo: string, v: ValorDeSubcampo | null) =>
    emitir(
      renglones.map((r, j) => {
        if (j !== i) return r;
        const resto: Record<string, ValorDeSubcampo> = { ...r };
        delete resto[codigo];
        return v === null ? resto : { ...resto, [codigo]: v };
      }),
    );
  const quitar = (i: number) => {
    claves.current.splice(i, 1);
    emitir(renglones.filter((_, j) => j !== i));
  };
  const lleno = renglones.length >= campo.maxItems;
  return (
    <div className="lista-que-se-repite" role="group" aria-labelledby={labelledBy} aria-describedby={describedBy}>
      <p className="campo__ayuda">{campo.minItems > 0 ? `Al menos ${campo.minItems} y hasta ${campo.maxItems}.` : `Hasta ${campo.maxItems}.`}</p>
      {renglones.map((r, i) => (
        <fieldset key={claves.current[i]} className="lista-que-se-repite__renglon" data-renglon={i + 1}>
          <legend className="lista-que-se-repite__titulo">
            {campo.itemLabel} {i + 1}
          </legend>
          <div className="lista-que-se-repite__campos">
            {campo.itemFields.map((sub) => (
              <Subcampo key={sub.code} id={`${id}-${claves.current[i]}-${sub.code}`} sub={sub} valor={r[sub.code]} onCambiar={(v) => cambiar(i, sub.code, v)} deshabilitado={deshabilitado} />
            ))}
          </div>
          <button type="button" className="boton boton--enlace lista-que-se-repite__quitar" onClick={() => quitar(i)} disabled={deshabilitado} aria-label={`${V.quitarRenglon(campo.itemLabel)} ${i + 1}`}>
            {QUITAR}
          </button>
        </fieldset>
      ))}
      <button type="button" className="boton boton--secundario" onClick={() => emitir([...renglones, {}])} disabled={deshabilitado || lleno}>
        {V.sumarRenglon(campo.itemLabel)}
      </button>
    </div>
  );
}

// ─── Tabla ──────────────────────────────────────────────────────────────────────────────────────

function CampoTabla({ id, campo, valor, onCambiar, deshabilitado, labelledBy, describedBy }: PropsDeCampoV2<CampoDe<'MATRIX'>>) {
  const celdas = valor?.type === 'MATRIX' ? valor.cells : [];
  const columnaDe = (row: string) => celdas.find((c) => c.row === row)?.column ?? null;
  const elegir = (row: string, column: string | null) => {
    const otras = celdas.filter((c) => c.row !== row);
    const nuevas = column === null ? otras : [...otras, { row, column }];
    onCambiar(nuevas.length === 0 ? null : { type: 'MATRIX', cells: nuevas });
  };
  return (
    <table className="tabla tabla-de-opciones" aria-labelledby={labelledBy} aria-describedby={describedBy}>
      <thead>
        <tr>
          <th scope="col">
            <span className="visualmente-oculto">Fila</span>
          </th>
          {campo.columns.map((c) => (
            <th key={c.code} scope="col">
              {c.label}
            </th>
          ))}
          <th scope="col">
            <span className="visualmente-oculto">{V.quitarRespuesta}</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {campo.rows.map((fila) => (
          <tr key={fila.code} data-fila={fila.code} data-respondida={columnaDe(fila.code) !== null ? 'si' : undefined}>
            <th scope="row">{fila.label}</th>
            {campo.columns.map((c) => (
              <td key={c.code} className="tabla-de-opciones__celda">
                <label className="casilla-de-celda">
                  <input type="radio" name={`${id}-${fila.code}`} checked={columnaDe(fila.code) === c.code} onChange={() => elegir(fila.code, c.code)} disabled={deshabilitado} aria-label={`${fila.label}: ${c.label}`} />
                </label>
              </td>
            ))}
            <td className="tabla-de-opciones__sin-responder">{columnaDe(fila.code) !== null ? <QuitarRespuesta onClick={() => elegir(fila.code, null)} deshabilitado={deshabilitado} de={fila.label} corto /> : null}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ─── Alimentos ──────────────────────────────────────────────────────────────────────────────────

const normal = (s: string) => s.trim().toLocaleLowerCase('es-AR');

function CampoAlimentos({ id, campo, valor, onCambiar, deshabilitado, labelledBy, describedBy }: PropsDeCampoV2<CampoDe<'FOODS'>>) {
  const alimentos = valor?.type === 'FOODS' ? valor.foods : [];
  const [otro, setOtro] = useState('');
  const esta = (nombre: string) => alimentos.some((a) => normal(a.name) === normal(nombre));
  const emitir = (lista: readonly { name: string; reason: string | null }[]) => onCambiar(lista.length === 0 ? null : { type: 'FOODS', foods: [...lista] });
  const lleno = alimentos.length >= campo.maxItems;
  const alternarSugerido = (nombre: string) => emitir(esta(nombre) ? alimentos.filter((a) => normal(a.name) !== normal(nombre)) : [...alimentos, { name: nombre, reason: null }]);
  const sumarOtro = () => {
    const nombre = otro.trim();
    if (nombre === '' || esta(nombre) || lleno) return;
    emitir([...alimentos, { name: nombre, reason: null }]);
    setOtro('');
  };
  return (
    <div className="alimentos-de-inicio" role="group" aria-labelledby={labelledBy} aria-describedby={describedBy}>
      {campo.suggestions.length > 0 ? (
        <ul className="chips-de-inicio" aria-label="Sugeridos">
          {campo.suggestions.map((s) => (
            <li key={s}>
              <button type="button" className="chip" aria-pressed={esta(s)} onClick={() => alternarSugerido(s)} disabled={deshabilitado || (!esta(s) && lleno)}>
                {s}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="alimentos-de-inicio__otro">
        <Campo
          id={`${id}-otro`}
          etiqueta={V.sumarAlimento}
          value={otro}
          maxLength={LARGO_MAXIMO_DE_ALIMENTO}
          autoComplete="off"
          disabled={deshabilitado || lleno}
          onChange={(e) => setOtro(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              sumarOtro();
            }
          }}
        />
        <button type="button" className="boton boton--secundario" onClick={sumarOtro} disabled={deshabilitado || lleno || otro.trim() === ''}>
          {SUMAR}
        </button>
      </div>
      {lleno ? <p className="campo__ayuda">Hasta {campo.maxItems}.</p> : null}
      {alimentos.length > 0 ? (
        <ul className="alimentos-elegidos" aria-label="Elegidos">
          {alimentos.map((a, i) => (
            <li key={normal(a.name)}>
              <span className="alimentos-elegidos__nombre">{a.name}</span>
              {campo.reasons.length > 0 ? (
                <select className="alimentos-elegidos__motivo" value={a.reason ?? ''} disabled={deshabilitado} aria-label={`${V.motivo}: ${a.name}`} onChange={(e) => emitir(alimentos.map((x, j) => (j === i ? { ...x, reason: e.target.value === '' ? null : e.target.value } : x)))}>
                  <option value="">{V.motivo}…</option>
                  {campo.reasons.map((r) => (
                    <option key={r.code} value={r.code}>
                      {r.label}
                    </option>
                  ))}
                </select>
              ) : null}
              <button type="button" className="boton boton--enlace" onClick={() => emitir(alimentos.filter((_, j) => j !== i))} disabled={deshabilitado} aria-label={`${QUITAR}: ${a.name}`}>
                {QUITAR}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

// ─── Horarios ───────────────────────────────────────────────────────────────────────────────────

function CampoHorarios({ id, campo, valor, onCambiar, deshabilitado, labelledBy, describedBy }: PropsDeCampoV2<CampoDe<'TIMES'>>) {
  const horas = valor?.type === 'TIMES' ? valor.times : [];
  const horaDe = (part: string) => horas.find((t) => t.part === part)?.time ?? '';
  const cambiar = (part: string, time: string) => {
    const otras = horas.filter((t) => t.part !== part);
    const nuevas = time === '' ? otras : [...otras, { part, time: time.slice(0, 5) }];
    onCambiar(nuevas.length === 0 ? null : { type: 'TIMES', times: nuevas });
  };
  return (
    <div className="horarios-de-inicio" role="group" aria-labelledby={labelledBy} aria-describedby={describedBy}>
      {campo.parts.map((p) => (
        <div key={p.code} className="campo">
          <label htmlFor={`${id}-${p.code}`}>{p.label}</label>
          <input id={`${id}-${p.code}`} type="time" value={horaDe(p.code)} disabled={deshabilitado} onChange={(e) => cambiar(p.code, e.target.value)} />
        </div>
      ))}
    </div>
  );
}
