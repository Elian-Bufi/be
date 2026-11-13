'use client';

/**
 * ED-13 (WP-EDITORES-PROFESIONAL; DL-167) · Los repartos habituales de macros, en el objetivo de Nutrición: usar uno
 * escribe sus gramos en los tres campos (se ve antes de guardar el objetivo, que sigue pidiendo su fundamento), y el
 * reparto que se escribió se puede guardar como habitual (API-HAN-07). Siempre en gramos por día: nunca en proporciones
 * antes del 25/11 (DJ-7), y BE no calcula (B05:312-318).
 *
 * Si los campos ya tenían otros gramos, el aviso dice cuáles se reemplazaron y ofrece «Deshacer» (`loQueSePisa`).
 */
import { leerNumero, nombreNormalizadoDePlantilla, type GuardarRepartoHabitualRequest, type RepartoHabitual } from '@be/domain';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { api } from '../../../../lib/api';
import { mensajeDeFallo, useClaveDeIntento } from '../../../../lib/intento';
import { numeroEnCampo } from '../../../../lib/formato';
import { useNutricion } from './nutricion';
import { loQueSePisa } from './reparto-que-se-pisa';

export const COPY_REPARTOS_HABITUALES = {
  usar: 'Usar un reparto habitual',
  elegir: 'Elegí uno de tus repartos',
  escribe: 'Escribe sus gramos en los tres campos; el objetivo se guarda con tu fundamento.',
  guardar: 'Guardar este reparto como habitual',
  nombre: 'Nombre del reparto',
  confirmar: 'Guardar el reparto',
  reemplazar: 'Reemplazar el que se llama así',
  seReemplaza: (n: string) => `Ya tenés un reparto llamado «${n}»: se reemplaza por este.`,
  guardado: (n: string) => `Se guardó «${n}» en tus repartos habituales.`,
  faltanGramos: 'Para guardarlo, escribí los gramos de los tres macronutrientes.',
  nombreTomado: 'Ya tenés un reparto con ese nombre. Elegí otro nombre o reemplazalo.',
  cancelar: 'Cancelar',
  sePiso: (nombre: string, antes: string) => `Se escribieron los gramos de «${nombre}» en lugar de ${antes}.`,
  deshacer: 'Deshacer',
} as const;

/** «P 150 · C 250 · G 70 g por día»: el reparto en una línea, en gramos. */
export const repartoEnUnaLinea = (r: RepartoHabitual): string => `P ${numeroEnCampo(r.distribution.protein.value)} · C ${numeroEnCampo(r.distribution.carbohydrate.value)} · G ${numeroEnCampo(r.distribution.fat.value)} g por día`;

const mismoNombre = (a: string, b: string): boolean => nombreNormalizadoDePlantilla(a) === nombreNormalizadoDePlantilla(b);

export function RepartosHabituales({ gramos, onUsar }: { gramos: { readonly proteina: string; readonly carbohidratos: string; readonly grasas: string }; onUsar: (g: { proteina: string; carbohidratos: string; grasas: string }) => void }) {
  const { token } = useNutricion();
  const id = useId();
  const intento = useClaveDeIntento();
  const C = COPY_REPARTOS_HABITUALES;
  const [lista, setLista] = useState<readonly RepartoHabitual[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [nombre, setNombre] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState<{ readonly tipo: 'error' | 'exito'; readonly texto: string } | null>(null);
  // Lo que había antes de usar un reparto, si pisó algo escrito: «Deshacer» lo devuelve.
  const [pisado, setPisado] = useState<{ readonly texto: string; readonly antes: typeof gramos; readonly escritos: typeof gramos } | null>(null);
  // «Deshacer» vale mientras los campos digan lo que escribió el reparto: si después se escribió otra cosa, ya no.
  const sigueEscrito = pisado !== null && pisado.escritos.proteina === gramos.proteina && pisado.escritos.carbohidratos === gramos.carbohidratos && pisado.escritos.grasas === gramos.grasas;
  const generacion = useRef(0);
  const leer = useCallback(async () => {
    const esta = ++generacion.current;
    const r = await api.listarRepartosHabituales(token);
    if (esta === generacion.current && r.ok) setLista(r.datos.data);
  }, [token]);
  useEffect(() => {
    void leer();
  }, [leer]);
  const p = leerNumero(gramos.proteina);
  const c = leerNumero(gramos.carbohidratos);
  const g = leerNumero(gramos.grasas);
  const completos = p !== null && c !== null && g !== null && p >= 0 && c >= 0 && g >= 0;
  const existente = nombre.trim() ? (lista.find((r) => mismoNombre(r.name, nombre)) ?? null) : null;

  async function guardar() {
    if (!completos || !nombre.trim()) return;
    setEnviando(true);
    setAviso(null);
    const gramo = (value: number) => ({ value, unit: 'g/day' as const });
    const cuerpo = { name: nombre.trim(), distribution: { protein: gramo(p), carbohydrate: gramo(c), fat: gramo(g) }, ...(existente ? { replaces: existente.presetId, expectedVersion: existente.version } : {}) } as GuardarRepartoHabitualRequest;
    const r = await api.guardarRepartoHabitual(token, cuerpo, intento.actual());
    intento.registrar(r);
    setEnviando(false);
    if (!r.ok) {
      if (r.tipo === 'API' && r.codigo === 'PRESET_NAME_TAKEN') void leer();
      return setAviso({ tipo: 'error', texto: r.tipo === 'API' && r.codigo === 'PRESET_NAME_TAKEN' ? C.nombreTomado : mensajeDeFallo(r) });
    }
    setAviso({ tipo: 'exito', texto: C.guardado(r.datos.data.name) });
    setGuardando(false);
    setNombre('');
    void leer();
  }

  return (
    <div className="repartos-habituales" data-repartos-habituales>
      {lista.length > 0 ? (
        <div className="campo">
          <label htmlFor={`${id}-usar`}>{C.usar}</label>
          <select
            id={`${id}-usar`}
            value=""
            aria-describedby={`${id}-usar-ayuda`}
            onChange={(e) => {
              const r = lista.find((x) => x.presetId === e.target.value);
              if (!r) return;
              const nuevos = { proteina: numeroEnCampo(r.distribution.protein.value), carbohidratos: numeroEnCampo(r.distribution.carbohydrate.value), grasas: numeroEnCampo(r.distribution.fat.value) };
              const antes = { ...gramos };
              const sePisa = loQueSePisa(antes, nuevos);
              setPisado(sePisa ? { texto: C.sePiso(r.name, sePisa), antes, escritos: nuevos } : null);
              onUsar(nuevos);
            }}
          >
            <option value="">{C.elegir}</option>
            {lista.map((r) => (
              <option key={r.presetId} value={r.presetId}>
                {r.name} · {repartoEnUnaLinea(r)}
              </option>
            ))}
          </select>
          <p id={`${id}-usar-ayuda`} className="campo__ayuda">
            {C.escribe}
          </p>
          {pisado && sigueEscrito ? (
            <p className="nota repartos-habituales__pisado" role="status" data-reparto-piso>
              {pisado.texto}{' '}
              <button
                type="button"
                className="boton boton--enlace"
                onClick={() => {
                  onUsar({ ...pisado.antes });
                  setPisado(null);
                }}
              >
                {C.deshacer}
              </button>
            </p>
          ) : null}
        </div>
      ) : null}
      {guardando ? (
        <div className="repartos-habituales__guardar">
          <div className="campo">
            <label htmlFor={`${id}-nombre`}>{C.nombre}</label>
            <input id={`${id}-nombre`} value={nombre} maxLength={120} onChange={(e) => setNombre(e.target.value)} />
          </div>
          {existente ? <p className="nota">{C.seReemplaza(existente.name)}</p> : null}
          <p className="repartos-habituales__acciones">
            <button type="button" className="boton boton--secundario boton--compacto" aria-disabled={!nombre.trim() || enviando || undefined} onClick={() => void guardar()}>
              {enviando ? 'Guardando…' : existente ? C.reemplazar : C.confirmar}
            </button>
            <button type="button" className="boton boton--enlace" onClick={() => setGuardando(false)}>
              {C.cancelar}
            </button>
          </p>
        </div>
      ) : (
        <p className="repartos-habituales__acciones">
          <button type="button" className="boton boton--enlace" aria-disabled={!completos || undefined} aria-describedby={!completos ? `${id}-falta` : undefined} onClick={() => completos && setGuardando(true)}>
            {C.guardar}
          </button>
          {!completos ? (
            <span id={`${id}-falta`} className="nota">
              {C.faltanGramos}
            </span>
          ) : null}
        </p>
      )}
      {aviso ? (
        <p className={aviso.tipo === 'error' ? 'campo__error' : 'nota'} role={aviso.tipo === 'error' ? 'alert' : 'status'}>
          {aviso.texto}
        </p>
      ) : null}
    </div>
  );
}
