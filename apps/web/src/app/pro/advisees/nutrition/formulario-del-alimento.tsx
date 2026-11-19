'use client';

/**
 * WP-NUTRICION-ALIMENTOS (DL-180) · El formulario de un alimento cargado a mano: el nombre, los valores cada 100 g, la
 * fibra (opcional: vacía es «sin dato», nunca cero) y el grupo (NUA-05, para su ícono). Lo usan «Crearlo a mano» (en el
 * cuadro de la opción) y «Corregir» (en «Mis alimentos», NUA-01). Desde el segundo tramo, las medidas caseras con su
 * equivalencia (NUA-08), y dice, a la vista, que lo cargado es de quien lo carga y que Administración lo ve con su nombre
 * de profesional (NUA-D14 y D15; decisión de Dirección del 2026-11-19).
 * - Los requisitos de siempre, señalados en el campo que falta (B10-10:164-165); Enter pasa al siguiente que falta (NUP-09).
 * - La lógica de los valores está en `valores-del-alimento.ts` (`valoresDelAlimento`), sin React, para probarla.
 */
import { COPY_ALIMENTOS, GRUPOS_DE_ALIMENTO, NOMBRE_DE_LA_MEDIDA, NOMBRE_DEL_GRUPO, TIPOS_DE_MEDIDA_CASERA, type Composicion, type GrupoDeAlimento, type MedidaCasera } from '@be/domain';
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
}: {
  id: string;
  inicial: AlimentoEscrito;
  textoDelBoton: string;
  textoEnviando: string;
  cabecera?: ReactNode;
  nota?: ReactNode;
  alEnviar: (v: { readonly nombre: string; readonly composicion: Composicion; readonly grupo: GrupoDeAlimento | null; readonly medidas: readonly MedidaCasera[] }) => Promise<string | null>;
  /** NUP-11: se escribió algo; quien lo contiene pregunta antes de cerrar. */
  alEscribir?: () => void;
  pie?: ReactNode;
}) {
  const [escrito, setEscrito] = useState<AlimentoEscrito>(inicial);
  const [errores, setErrores] = useState<Readonly<Record<string, string>>>({});
  const [fallo, setFallo] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
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
    const problema = await alEnviar(v);
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
      {/* NUA-08: cuánto pesa cada medida casera; vacía, el alimento no la tiene. */}
      <fieldset className="formulario-del-alimento__medidas" data-medidas-caseras>
        <legend>{COPY_ALIMENTOS.medidasCaseras}</legend>
        <p className="campo__ayuda">{COPY_ALIMENTOS.medidasCaserasAyuda}</p>
        <div className="agregar-item__valores">
          {TIPOS_DE_MEDIDA_CASERA.map((tipo) => (
            <Campo
              key={tipo}
              id={`${id}-medida-${tipo}`}
              etiqueta={COPY_ALIMENTOS.medidaCaseraCampo(NOMBRE_DE_LA_MEDIDA[tipo].una, false)}
              inputMode="decimal"
              value={escrito.medidas?.[tipo] ?? ''}
              onChange={(e) => cambiar({ medidas: { ...escrito.medidas, [tipo]: e.target.value } })}
              error={errores[`medida-${tipo}`] ?? null}
            />
          ))}
        </div>
      </fieldset>
      {/* NUA-D14 y D15: lo cargado es de quien lo carga; Administración lo ve con su nombre de profesional. */}
      <p className="nota formulario-del-alimento__es-tuyo" data-es-tuyo>
        <Icono nombre="info" tamano={18} />
        {COPY_ALIMENTOS.esTuyo}
      </p>
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
