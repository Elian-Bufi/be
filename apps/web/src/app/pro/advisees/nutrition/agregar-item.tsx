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
import { COPY_NUTRICION, type ElementoDeCatalogo } from '@be/domain';
import { Icono } from '../../../../components/icono';
import { api } from '../../../../lib/api';
import { mensajeDeFallo, useClaveDeIntento } from '../../../../lib/intento';
import { ALIMENTO_EN_BLANCO, FormularioDelAlimento } from './formulario-del-alimento';
import { useNutricion } from './nutricion';

/**
 * «Crear manualmente»: un alimento propio, con sus valores cada 100 g y, desde DL-180, su grupo (NUA-05) y el aviso de que
 * lo ven los demás profesionales (NUA-D05). Lo crea y lo suma a la opción. El formulario es el común
 * (`formulario-del-alimento.tsx`), el mismo de «Corregir» en «Mis alimentos».
 */
export function CrearManualmente({
  id,
  nombreInicial,
  onCreado,
  onVolver,
  alEscribir,
}: {
  id: string;
  nombreInicial: string;
  onCreado: (e: ElementoDeCatalogo) => void;
  onVolver: () => void;
  /** NUP-11: se escribió algo en el formulario; el cuadro que lo contiene pregunta antes de cerrar. */
  alEscribir?: () => void;
}) {
  const { token, sesionPerdida, accesoRetirado } = useNutricion();
  const intento = useClaveDeIntento();

  return (
    <FormularioDelAlimento
      id={id}
      inicial={{ ...ALIMENTO_EN_BLANCO, nombre: nombreInicial }}
      textoDelBoton="Crear y agregar"
      textoEnviando="Creando…"
      alEscribir={alEscribir}
      // NUA-D14: compartirlo es un interruptor a la vista, encendido por defecto, con el aviso al lado.
      compartir={{ inicial: true }}
      cabecera={
        <>
          <button type="button" className="boton boton--enlace agregar-item__volver" onClick={onVolver}>
            <Icono nombre="izquierda" tamano={18} />
            Volver a la opción
          </button>
          <h3 className="agregar-item__titulo">{COPY_NUTRICION.crearManualmente}</h3>
        </>
      }
      nota={<p className="nota">Un alimento tuyo, con sus valores cada 100 g. Queda en el catálogo para volver a usarlo.</p>}
      alEnviar={async (v) => {
        const r = await api.crearElementoDeCatalogo(
          token,
          { name: v.nombre, itemType: 'FOOD', composition: v.composicion, ...(v.grupo ? { group: v.grupo } : {}), share: v.compartir },
          intento.actual(),
        );
        intento.registrar(r);
        if (sesionPerdida(r) || accesoRetirado(r)) return null;
        if (!r.ok) return mensajeDeFallo(r);
        // NUA-05: el grupo elegido viaja con lo creado, para el ícono de su fila.
        onCreado({ ...r.datos.data, ...(v.grupo ? { foodGroup: v.grupo } : {}) } as ElementoDeCatalogo);
        return null;
      }}
    />
  );
}
