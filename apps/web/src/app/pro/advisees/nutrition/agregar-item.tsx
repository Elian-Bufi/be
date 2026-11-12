'use client';

/**
 * «Crear manualmente» (WP-ESCRITORIO-AREAS, parte 7): un alimento propio, con sus valores cada 100 g, que queda en el
 * catálogo para volver a usarlo. Se abre adentro del cuadro de la opción (ED-31, `cuadro-de-la-opcion.tsx`), en el lugar
 * de la opción y con «Volver a la opción»: no hay un cuadro encima de otro.
 *
 * Hasta ED-31, este archivo era además el cajón «Agregar ítem», con el buscador que buscaba al enviar. El buscador pasó
 * al cuadro de la opción, que busca mientras se escribe y suma con Enter (maqueta 06). Las tres vías del legajo siguen
 * (B05:535-552; B10-05 §18): el catálogo BE, los habituales y lo creado a mano o importado, que nunca es la búsqueda
 * principal obligatoria (WP-08).
 */
import { COPY_NUTRICION, leerNumero, motivoDeNumeroIlegible, type ElementoDeCatalogo } from '@be/domain';
import { useState, type FormEvent } from 'react';
import { Aviso, Campo } from '../../../../components/formulario';
import { Icono } from '../../../../components/icono';
import { api } from '../../../../lib/api';
import { mensajeDeFallo, useClaveDeIntento } from '../../../../lib/intento';
import { useNutricion } from './nutricion';

/** «Crear manualmente»: un alimento propio, con sus valores cada 100 g. Lo crea y lo suma a la opción. */
export function CrearManualmente({ id, nombreInicial, onCreado, onVolver }: { id: string; nombreInicial: string; onCreado: (e: ElementoDeCatalogo) => void; onVolver: () => void }) {
  const { token, sesionPerdida, accesoRetirado } = useNutricion();
  const intento = useClaveDeIntento();
  const [nuevo, setNuevo] = useState({ nombre: nombreInicial, kcal: '', c: '', g: '', p: '' });
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [fallo, setFallo] = useState<string | null>(null);
  const [creando, setCreando] = useState(false);

  async function crear(e: FormEvent) {
    e.preventDefault();
    // Los mismos requisitos de siempre, señalados en el campo que falta (B10-10:164-165).
    const problemas: Record<string, string> = {};
    if (!nuevo.nombre.trim()) problemas['nombre'] = 'Falta el nombre del alimento.';
    const valores: Record<string, number> = {};
    for (const [clave, texto] of [
      ['kcal', nuevo.kcal],
      ['c', nuevo.c],
      ['g', nuevo.g],
      ['p', nuevo.p],
    ] as const) {
      const n = leerNumero(texto);
      if (n === null) problemas[clave] = texto.trim() === '' ? 'Falta el valor cada 100 g.' : motivoDeNumeroIlegible(texto);
      else if (n < 0) problemas[clave] = 'El valor no puede ser menor que cero.';
      else valores[clave] = n;
    }
    setErrores(problemas);
    if (Object.keys(problemas).length > 0) return setFallo(null);
    setCreando(true);
    const r = await api.crearElementoDeCatalogo(
      token,
      { name: nuevo.nombre.trim(), itemType: 'FOOD', composition: { referenceAmount: '100g', energyKcal: valores['kcal']!, proteinG: valores['p']!, carbohydrateG: valores['c']!, fatG: valores['g']! } },
      intento.actual(),
    );
    intento.registrar(r);
    setCreando(false);
    if (sesionPerdida(r) || accesoRetirado(r)) return;
    if (!r.ok) return setFallo(mensajeDeFallo(r));
    onCreado(r.datos.data);
  }

  return (
    <form className="agregar-item__otro" onSubmit={(e) => void crear(e)} noValidate>
      <button type="button" className="boton boton--enlace agregar-item__volver" onClick={onVolver}>
        <Icono nombre="izquierda" tamano={18} />
        Volver a la opción
      </button>
      <h3 className="agregar-item__titulo">{COPY_NUTRICION.crearManualmente}</h3>
      <p className="nota">Un alimento tuyo, con sus valores cada 100 g. Queda en el catálogo para volver a usarlo.</p>
      <Campo id={`${id}-nombre`} etiqueta="Nombre" value={nuevo.nombre} maxLength={120} onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })} error={errores['nombre'] ?? null} />
      <div className="agregar-item__valores">
        <Campo id={`${id}-kcal`} etiqueta="Calorías (kcal)" inputMode="decimal" value={nuevo.kcal} onChange={(e) => setNuevo({ ...nuevo, kcal: e.target.value })} error={errores['kcal'] ?? null} />
        <Campo id={`${id}-c`} etiqueta="Carbohidratos (g)" inputMode="decimal" value={nuevo.c} onChange={(e) => setNuevo({ ...nuevo, c: e.target.value })} error={errores['c'] ?? null} />
        <Campo id={`${id}-g`} etiqueta="Grasas (g)" inputMode="decimal" value={nuevo.g} onChange={(e) => setNuevo({ ...nuevo, g: e.target.value })} error={errores['g'] ?? null} />
        <Campo id={`${id}-p`} etiqueta="Proteínas (g)" inputMode="decimal" value={nuevo.p} onChange={(e) => setNuevo({ ...nuevo, p: e.target.value })} error={errores['p'] ?? null} />
      </div>
      {fallo ? (
        <Aviso tipo="error">
          <p>{fallo}</p>
        </Aviso>
      ) : null}
      <div className="acciones">
        <button type="submit" className="boton boton--primario" disabled={creando}>
          {creando ? 'Creando…' : 'Crear y agregar'}
        </button>
      </div>
    </form>
  );
}
