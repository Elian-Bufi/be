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
import { claveDeNombreParecido, COPY_ALIMENTOS, COPY_NUTRICION, type Composicion, type ElementoDeCatalogo, type ElementoEncontrado, type GrupoDeAlimento, type MedidaCasera } from '@be/domain';
import { useEffect, useRef, useState } from 'react';
import { Aviso } from '../../../../components/formulario';
import { Icono } from '../../../../components/icono';
import { api } from '../../../../lib/api';
import { mensajeDeFallo, useClaveDeIntento } from '../../../../lib/intento';
import { ALIMENTO_EN_BLANCO, FormularioDelAlimento } from './formulario-del-alimento';
import { useNutricion } from './nutricion';

/** Lo escrito en el formulario, listo para crear. */
interface AlimentoParaCrear {
  readonly nombre: string;
  readonly composicion: Composicion;
  readonly grupo: GrupoDeAlimento | null;
  readonly medidas: readonly MedidaCasera[];
}

/**
 * NUA-D16 (segundo tramo): un verificado con el mismo nombre (sin tildes, mayúsculas, espacios de más ni plurales simples)
 * entre las filas del buscador, si lo hay. Solo los verificados: lo propio repetido no se avisa acá.
 */
export function verificadoConElMismoNombre(nombre: string, filas: readonly ElementoEncontrado[]): ElementoEncontrado | null {
  const clave = claveDeNombreParecido(nombre);
  if (!clave) return null;
  return filas.find((f) => f.originLevel === 'VERIFIED' && claveDeNombreParecido(f.name) === clave) ?? null;
}

/**
 * «Crear manualmente»: un alimento propio, con sus valores cada 100 g y, desde DL-180, su grupo (NUA-05). Desde el segundo
 * tramo, sus medidas caseras (NUA-08) y el aviso de que es de quien lo carga (NUA-D14); si ya hay uno verificado con ese
 * nombre, lo dice antes de guardar y ofrece usarlo, sin impedir crear el propio (NUA-D16). Lo crea y lo suma a la opción.
 * El formulario es el común (`formulario-del-alimento.tsx`), el mismo de «Corregir» en «Mis alimentos».
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
  // NUA-D16: el verificado con el mismo nombre y lo que se iba a crear, mientras se decide.
  const [igual, setIgual] = useState<{ readonly verificado: ElementoEncontrado; readonly escrito: AlimentoParaCrear } | null>(null);
  const [falloAlCrear, setFalloAlCrear] = useState<string | null>(null);
  const aviso = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (igual) aviso.current?.focus();
  }, [igual]);

  async function crear(v: AlimentoParaCrear): Promise<string | null> {
    const r = await api.crearElementoDeCatalogo(
      token,
      { name: v.nombre, itemType: 'FOOD', composition: v.composicion, ...(v.grupo ? { group: v.grupo } : {}), ...(v.medidas.length > 0 ? { householdMeasures: [...v.medidas] } : {}) },
      intento.actual(),
    );
    intento.registrar(r);
    if (sesionPerdida(r) || accesoRetirado(r)) return null;
    if (!r.ok) return mensajeDeFallo(r);
    // NUA-05 y NUA-08: el grupo y las medidas elegidas viajan con lo creado, para su fila.
    onCreado({ ...r.datos.data, ...(v.grupo ? { foodGroup: v.grupo } : {}), ...(v.medidas.length > 0 ? { householdMeasures: v.medidas } : {}) } as ElementoDeCatalogo);
    return null;
  }

  return (
    <FormularioDelAlimento
      id={id}
      inicial={{ ...ALIMENTO_EN_BLANCO, nombre: nombreInicial }}
      textoDelBoton="Crear y agregar"
      textoEnviando="Creando…"
      alEscribir={() => {
        setIgual(null);
        alEscribir?.();
      }}
      cabecera={
        <>
          <button type="button" className="boton boton--enlace agregar-item__volver" onClick={onVolver}>
            <Icono nombre="izquierda" tamano={18} />
            Volver a la opción
          </button>
          <h3 className="agregar-item__titulo">{COPY_NUTRICION.crearManualmente}</h3>
        </>
      }
      nota={
        <>
          <p className="nota">Un alimento tuyo, con sus valores cada 100 g. Queda en el catálogo para volver a usarlo.</p>
          {igual ? (
            <div ref={aviso} tabIndex={-1} data-ya-existe-verificado>
              <Aviso tipo="info">
                <p>{COPY_ALIMENTOS.yaExisteVerificado(igual.verificado.name)}</p>
                <div className="acciones">
                  <button type="button" className="boton boton--primario" onClick={() => onCreado(igual.verificado)} data-usar-el-verificado>
                    {COPY_ALIMENTOS.usarElVerificado}
                  </button>
                  <button type="button" className="boton boton--secundario" onClick={() => void crear(igual.escrito).then(setFalloAlCrear)} data-crear-el-mio>
                    {COPY_ALIMENTOS.crearElMioIgual}
                  </button>
                </div>
                {falloAlCrear ? <p role="alert">{falloAlCrear}</p> : null}
              </Aviso>
            </div>
          ) : null}
        </>
      }
      alEnviar={async (v) => {
        // NUA-D16: antes de crear, si hay uno verificado con el mismo nombre, se dice y se ofrece usarlo. Si la búsqueda
        // falla, se crea igual: el aviso ayuda, no frena.
        const busqueda = await api.buscarEnCatalogo(token, v.nombre);
        if (sesionPerdida(busqueda)) return null;
        const verificado = busqueda.ok ? verificadoConElMismoNombre(v.nombre, busqueda.datos.data) : null;
        if (verificado) {
          setFalloAlCrear(null);
          setIgual({ verificado, escrito: v });
          return null;
        }
        return crear(v);
      }}
    />
  );
}
