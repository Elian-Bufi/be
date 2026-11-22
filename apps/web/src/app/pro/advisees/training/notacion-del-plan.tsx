'use client';

/**
 * DL-192 (WP-RPE-Y-MAXIMO-ESTIMADO, RPE-01 y RPE-D01) · «Cómo se escribe el esfuerzo» en el editor del plan: RIR o RPE, para
 * esta versión. Es la misma medida escrita de dos formas (RPE = 10 − RIR): lo guardado sigue siendo el RIR, y cambiar la
 * notación no cambia ningún número. La persona responde y ve todo en la que se elija (en la APK, desde la 0.32: DL-194).
 *
 * Va en la columna de las sesiones, debajo de las fechas, a la vista: define cómo se lee cada serie. Lo largo y las
 * fuentes, detrás del «?» (`ExplicacionAPedido`). El borrador nace con la última que usó el profesional (la API la pone).
 */
import { COPY_NOTACION_DEL_ESFUERZO as N, NOTACIONES_DEL_ESFUERZO, type NotacionDelEsfuerzo } from '@be/domain';
import { ExplicacionAPedido } from '../../../../components/explicacion-a-pedido';

export function NotacionDelPlan({ notacion, onCambiar }: { notacion: NotacionDelEsfuerzo; onCambiar: (n: NotacionDelEsfuerzo) => void }) {
  return (
    <fieldset className="notacion-del-plan" data-notacion-del-esfuerzo={notacion}>
      <legend>{N.titulo}</legend>
      <div className="notacion-del-plan__opciones">
        {NOTACIONES_DEL_ESFUERZO.map((n) => (
          <button
            key={n}
            type="button"
            className="estacion__chip"
            aria-pressed={n === notacion}
            title={N.nombre[n]}
            data-notacion={n}
            onClick={() => {
              if (n !== notacion) onCambiar(n);
            }}
          >
            {N.etiqueta[n]}
            <span className="visualmente-oculto">: {N.nombre[n]}</span>
          </button>
        ))}
      </div>
      {/* Un `div` y no un `p`: lo desplegado son párrafos. */}
      <div className="nota notacion-del-plan__que-es">
        <span>{N.queEs}</span>{' '}
        <ExplicacionAPedido nombre="Qué es el RPE y cómo se guarda" como="div">
          {N.explicacion.map((t) => (
            <p key={t}>{t}</p>
          ))}
          <p className="nota">{N.fuentes}</p>
        </ExplicacionAPedido>
      </div>
    </fieldset>
  );
}
