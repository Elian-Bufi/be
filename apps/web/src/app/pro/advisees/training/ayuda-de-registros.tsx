'use client';

/**
 * «Cómo se lee esta vista», para Entrenamiento · Registros (WP-ESCRITORIO-AREAS, parte 2; F-14): qué dice cada fila,
 * qué cuenta como una diferencia y qué no dice la pantalla. Junta las ayudas que estaban repartidas por la sección («Qué
 * entra en la comparación», «Qué dice cada tiempo»). El botón y el diálogo son los de la ficha (`AyudaDeVista`); va en
 * el marco del área.
 */
import { COPY_COMPARACION, COPY_ENTRENAMIENTO_POR_SERIE, VISTAS_DE_SESIONES } from '@be/domain';
import { AyudaDeVista, RenglonDeAyuda as Renglon } from '../../../../components/ayuda-de-vista';
import { Icono } from '../../../../components/icono';

export function AyudaDeRegistrosDeEntrenamiento() {
  return (
    <AyudaDeVista titulo="Cómo se leen los Registros" deQue="entrenamiento-registros">
      <p className="nota">Lo indicado y lo registrado, serie por serie. Describe lo registrado: no califica la sesión.</p>
      <ul className="como-se-lee__lista">
        <Renglon muestra={<Icono nombre="lista" tamano={20} />}>
          <strong>Cada sesión registrada es una fila,</strong> de la más nueva a la más vieja: el día, la sesión y su condición, cuántas series se registraron y cómo quedaron frente a lo indicado. {COPY_COMPARACION.soloRegistradas}
        </Renglon>
        <Renglon muestra={<Icono nombre="plan" tamano={20} />}>
          <strong>Lo indicado es lo del plan de ese día:</strong> cada sesión se compara con la versión del plan con que se registró, no con la vigente hoy. Cambiar el plan después no cambia lo que se lee acá.
        </Renglon>
        <Renglon muestra={<Icono nombre="series" tamano={20} />}>
          <strong>«7 de 10 registradas»</strong> es una cuenta de las series indicadas que tienen registro. Una serie sin registrar no quiere decir que no se haya hecho: no hay dato. Una serie que se hizo de más se dice aparte
          («1 adicional»).
        </Renglon>
        <Renglon muestra={<Icono nombre="distinto" tamano={20} />}>
          <strong>Una serie con diferencias</strong> es una serie registrada cuyas repeticiones o cuyo RIR quedaron por encima o por debajo de lo indicado. Es un dato, no una calificación: por encima no es mejor ni peor.
        </Renglon>
        <Renglon muestra={<Icono nombre="carga" tamano={20} />}>
          <strong>La carga se dice y no cuenta como diferencia.</strong> {COPY_COMPARACION.sugeridaNoEsObligacion} Dos cargas en unidades distintas no se comparan: BE no convierte kilos y libras.
        </Renglon>
        <Renglon muestra={<Icono nombre="sin-datos" tamano={20} />}>
          <strong>Un dato que no se registró no es una diferencia:</strong> se dice aparte («RIR: sin dato»). {COPY_COMPARACION.ausenciaNoEsCero}
        </Renglon>
        <Renglon muestra={<Icono nombre="desvio" tamano={20} />}>
          <strong>La condición es lo que declaró la persona</strong> al registrar la sesión. No sale de comparar las series: una sesión puede estar registrada como realizada y tener series con diferencias, y al revés.
        </Renglon>
        <Renglon muestra={<Icono nombre="texto" tamano={20} />}>
          <strong>Una sesión resumida no tiene series:</strong> la persona escribió un resumen en lugar de registrar serie por serie. No se cuenta ni se compara, y no dice «0 de 10».
        </Renglon>
        <Renglon muestra={<Icono nombre="repetir" tamano={20} />}>
          <strong>Si se registró otro ejercicio</strong> en lugar del indicado, sus series cuentan como registradas y no se comparan con lo indicado para el original.
        </Renglon>
        <Renglon muestra={<Icono nombre="corregido" tamano={20} />}>
          <strong>Corregida:</strong> rige una corrección, y se lee esa. El registro original y cada corrección quedan en el detalle, a un clic.
        </Renglon>
        <Renglon muestra={<Icono nombre="derecha" tamano={20} />}>
          <strong>Cada fila abre su detalle:</strong> una tabla con cada serie una sola vez. En una ventana ancha se abre al costado; en una angosta, encima. Escape lo cierra. Abajo están los tiempos de la sesión y, a un clic,
          los descansos, la sesión en el plan, el gráfico por serie y el registro original.
        </Renglon>
        <Renglon muestra={<Icono nombre="reloj" tamano={20} />}>
          <strong>Los tiempos dicen su certeza</strong> (medido, estimado, incompleto o no informado). {COPY_ENTRENAMIENTO_POR_SERIE.noSonMinutosDeEsfuerzo}
        </Renglon>
        <Renglon muestra={<Icono nombre="calendario" tamano={20} />}>
          <strong>Los días sin sesión registrada</strong> se dicen como eso: el plan no fija qué días se entrena. El período admite hasta 92 días; si no elegís ninguno, BE propone los últimos siete.
        </Renglon>
        <Renglon muestra={<Icono nombre="analizar" tamano={20} />}>
          <strong>La evolución de un ejercicio</strong> a lo largo de las sesiones está en Analizar, en la ficha: desde acá hay un enlace.
        </Renglon>
      </ul>
      <details className="como-se-lee__fuentes">
        <summary>Qué trae cada vista ({VISTAS_DE_SESIONES.length})</summary>
        <dl>
          {VISTAS_DE_SESIONES.map((v) => (
            <div key={v.clave} data-vista={v.clave}>
              <dt>{v.nombre}</dt>
              <dd>{v.queTrae}</dd>
            </div>
          ))}
        </dl>
      </details>
    </AyudaDeVista>
  );
}
