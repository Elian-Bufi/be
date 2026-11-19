'use client';

/**
 * WP-NUTRICION-ALIMENTOS (DL-180) · El formulario de un alimento cargado a mano: el nombre, los valores cada 100 g, la
 * fibra (opcional: vacía es «sin dato», nunca cero) y el grupo (NUA-05, para su ícono). Lo usan «Crearlo a mano» (en el
 * cuadro de la opción) y «Corregir» (en «Mis alimentos», NUA-01). Compartirlo con los demás profesionales de Nutrición es
 * un interruptor a la vista, con el aviso al lado (NUA-D05; segundo tramo, NUA-D14): encendido al cargar uno nuevo,
 * apagado al corregir uno que no se comparte. Sin interruptor (al corregir uno que ya se comparte), quien lo usa lo dice.
 * - Los requisitos de siempre, señalados en el campo que falta (B10-10:164-165); Enter pasa al siguiente que falta (NUP-09).
 * - La lógica de los valores está en `valores-del-alimento.ts` (`valoresDelAlimento`), sin React, para probarla.
 */
import { COPY_ALIMENTOS, GRUPOS_DE_ALIMENTO, NOMBRE_DEL_GRUPO, type Composicion, type GrupoDeAlimento } from '@be/domain';
import { useState, type FormEvent, type ReactNode } from 'react';
import { Aviso, Campo, enterAlQueFalta } from '../../../../components/formulario';
import { Icono } from '../../../../components/icono';
import { iconoDeLaFila } from './alimentos-del-catalogo';
import { valoresDelAlimento, type AlimentoEscrito } from './valores-del-alimento';

export { ALIMENTO_EN_BLANCO, alimentoEscrito, type AlimentoEscrito } from './valores-del-alimento';

/** El grupo: una lista con los de BE y su ícono al lado, para ver qué se eligió. */
export function SelectorDeGrupo({ id, valor, alCambiar, apagado = false }: { id: string; valor: GrupoDeAlimento | ''; alCambiar: (g: GrupoDeAlimento | '') => void; apagado?: boolean }) {
  return (
    <div className="campo formulario-del-alimento__grupo">
      <label htmlFor={id}>{COPY_ALIMENTOS.grupo}</label>
      <span className="formulario-del-alimento__grupo-fila">
        <Icono nombre={iconoDeLaFila({ grupo: valor || null })} tamano={20} />
        <select id={id} value={valor} disabled={apagado} onChange={(e) => alCambiar(e.target.value as GrupoDeAlimento | '')}>
          <option value="">{COPY_ALIMENTOS.elegirGrupo}</option>
          {GRUPOS_DE_ALIMENTO.map((g) => (
            <option key={g} value={g}>
              {NOMBRE_DEL_GRUPO[g]}
            </option>
          ))}
        </select>
      </span>
    </div>
  );
}

/**
 * El formulario. `alEnviar` recibe los valores ya leídos y devuelve el fallo para mostrar (o `null`). `cabecera` va
 * arriba (el «Volver» y el título de quien lo usa).
 */
export function FormularioDelAlimento({
  id,
  inicial,
  textoDelBoton,
  textoEnviando,
  cabecera,
  nota,
  alEnviar,
  alEscribir,
  pie,
  compartir = null,
}: {
  id: string;
  inicial: AlimentoEscrito;
  textoDelBoton: string;
  textoEnviando: string;
  cabecera?: ReactNode;
  nota?: ReactNode;
  /** NUA-D14: el interruptor de compartir y cómo empieza; `null` u omitido, sin interruptor. */
  compartir?: { readonly inicial: boolean } | null;
  alEnviar: (v: { readonly nombre: string; readonly composicion: Composicion; readonly grupo: GrupoDeAlimento | null; readonly compartir: boolean }) => Promise<string | null>;
  /** NUP-11: se escribió algo; quien lo contiene pregunta antes de cerrar. */
  alEscribir?: () => void;
  pie?: ReactNode;
}) {
  const [escrito, setEscrito] = useState<AlimentoEscrito>(inicial);
  const [errores, setErrores] = useState<Readonly<Record<string, string>>>({});
  const [fallo, setFallo] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [compartido, setCompartido] = useState(compartir?.inicial ?? false);
  const cambiar = (c: Partial<AlimentoEscrito>) => setEscrito((e) => ({ ...e, ...c }));
  // NUP-09: Enter, mientras falte algún valor obligatorio, pasa al siguiente campo vacío; con todo escrito, envía.
  const loQueFalta = (): string[] =>
    ([['nombre', escrito.nombre], ['kcal', escrito.kcal], ['c', escrito.c], ['g', escrito.g], ['p', escrito.p]] as const).filter(([, v]) => v.trim() === '').map(([clave]) => `${id}-${clave}`);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    const v = valoresDelAlimento(escrito);
    if (v.tipo === 'faltan') {
      setErrores(v.problemas);
      return setFallo(null);
    }
    setErrores({});
    setEnviando(true);
    const problema = await alEnviar({ ...v, compartir: compartir !== null && compartido });
    setEnviando(false);
    setFallo(problema);
  }

  return (
    <form className="agregar-item__otro formulario-del-alimento" onSubmit={(e) => void enviar(e)} onKeyDown={(e) => enterAlQueFalta(e, loQueFalta())} onInput={alEscribir} noValidate>
      {cabecera}
      {nota}
      <Campo id={`${id}-nombre`} etiqueta="Nombre" value={escrito.nombre} maxLength={120} onChange={(e) => cambiar({ nombre: e.target.value })} error={errores['nombre'] ?? null} />
      <div className="agregar-item__valores">
        <Campo id={`${id}-kcal`} etiqueta="Calorías (kcal)" inputMode="decimal" value={escrito.kcal} onChange={(e) => cambiar({ kcal: e.target.value })} error={errores['kcal'] ?? null} />
        <Campo id={`${id}-c`} etiqueta="Carbohidratos (g)" inputMode="decimal" value={escrito.c} onChange={(e) => cambiar({ c: e.target.value })} error={errores['c'] ?? null} />
        <Campo id={`${id}-g`} etiqueta="Grasas (g)" inputMode="decimal" value={escrito.g} onChange={(e) => cambiar({ g: e.target.value })} error={errores['g'] ?? null} />
        <Campo id={`${id}-p`} etiqueta="Proteínas (g)" inputMode="decimal" value={escrito.p} onChange={(e) => cambiar({ p: e.target.value })} error={errores['p'] ?? null} />
        <Campo id={`${id}-fibra`} etiqueta="Fibra (g), si la sabés" inputMode="decimal" value={escrito.fibra} onChange={(e) => cambiar({ fibra: e.target.value })} error={errores['fibra'] ?? null} />
      </div>
      <SelectorDeGrupo id={`${id}-grupo`} valor={escrito.grupo} alCambiar={(grupo) => cambiar({ grupo })} apagado={enviando} />
      {compartir ? (
        <div className="formulario-del-alimento__compartir" data-compartir>
          <label className="capa formulario-del-alimento__interruptor">
            <input
              type="checkbox"
              role="switch"
              checked={compartido}
              disabled={enviando}
              aria-describedby={`${id}-aviso-de-compartir`}
              onChange={(e) => {
                setCompartido(e.target.checked);
                alEscribir?.();
              }}
              data-interruptor-de-compartir
            />
            <span>{COPY_ALIMENTOS.compartirInterruptor}</span>
          </label>
          <p className="nota formulario-del-alimento__aviso" id={`${id}-aviso-de-compartir`} data-aviso-de-compartir>
            <Icono nombre="info" tamano={18} />
            {compartido ? COPY_ALIMENTOS.avisoDeCompartir : COPY_ALIMENTOS.noSeComparte}
          </p>
        </div>
      ) : null}
      {fallo ? (
        <Aviso tipo="error">
          <p>{fallo}</p>
        </Aviso>
      ) : null}
      <div className="acciones">
        <button type="submit" className="boton boton--primario" disabled={enviando}>
          {enviando ? textoEnviando : textoDelBoton}
        </button>
        {pie}
      </div>
    </form>
  );
}
