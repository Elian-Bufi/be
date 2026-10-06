'use client';

/**
 * Un registro de comida tal como lo hizo el asesorado (API-ING-03; DL-121), para el profesional del plan.
 * - El estado de las cantidades se dice como es: sin confirmar, porciones del plan confirmadas o informadas. Lo previsto
 *   nunca se muestra como consumido.
 * - La estimación de lo consumido sale de la API, con las cantidades confirmadas o informadas; sin ellas, «Macros sin
 *   calcular». Una foto no agrega macros.
 * - Las fotos son privadas (08 §21): se piden con su acceso firmado, que queda auditado, y no se guardan en el navegador.
 */
import {
  COPY_RECETAS,
  COPY_REGISTRO_DE_COMIDAS,
  COPY_REGISTRO_PARA_EL_PROFESIONAL,
  ETIQUETA_DE_NUTRIENTE,
  ETIQUETA_DE_UNIDAD,
  NUTRIENTES_CALCULADOS,
  UNIDAD_DE_NUTRIENTE,
  cantidad,
  nutrienteParaMostrar,
  type Nutrientes,
  type RegistroDeComida,
} from '@be/domain';
import { useCallback, useEffect, useState } from 'react';
import { Cargando, ErrorConReintento } from '../../../../components/estados';
import { api, type Resultado } from '../../../../lib/api';
import { fecha } from '../../../../lib/formato';
import { useImagenDeMedio } from '../../../../lib/medios';
import { useNutricion } from './nutricion';

export function VerRegistro({ registroId }: { registroId: string }) {
  const [abierto, setAbierto] = useState(false);
  return (
    <div className="ver-registro">
      <button type="button" className="boton boton--enlace" aria-expanded={abierto} onClick={() => setAbierto(!abierto)}>
        {abierto ? COPY_REGISTRO_PARA_EL_PROFESIONAL.ocultarRegistro : COPY_REGISTRO_PARA_EL_PROFESIONAL.verRegistro}
      </button>
      {abierto ? <DetalleDeRegistro registroId={registroId} /> : null}
    </div>
  );
}

function DetalleDeRegistro({ registroId }: { registroId: string }) {
  const { token, sesionPerdida } = useNutricion();
  const [r, setR] = useState<Resultado<{ data: RegistroDeComida }> | null>(null);
  const cargar = useCallback(async () => {
    setR(null);
    const res = await api.consultarRegistroDeComida(token, registroId);
    if (sesionPerdida(res)) return;
    setR(res);
  }, [token, registroId, sesionPerdida]);
  useEffect(() => {
    void cargar();
  }, [cargar]);

  if (r === null) return <Cargando />;
  if (!r.ok) return <ErrorConReintento onReintentar={() => void cargar()} />;
  const registro = r.datos.data;
  const nombreDeItem = new Map((registro.option?.items ?? []).map((i) => [i.itemId, i.name]));
  return (
    <div className="detalle-de-valores">
      {registro.annulment ? <p className="insignia">{COPY_REGISTRO_PARA_EL_PROFESIONAL.deshecho(fecha(registro.annulment.annulledAt))}</p> : null}
      {registro.kind === 'PLAN_OPTION' && registro.option ? (
        <>
          <p>
            <strong>{COPY_REGISTRO_PARA_EL_PROFESIONAL.opcionRegistrada}:</strong> {registro.option.label}
          </p>
          {registro.consumption ? (
            <>
              <p>{COPY_REGISTRO_PARA_EL_PROFESIONAL.estadoDeCantidades[registro.consumption.status]}</p>
              {registro.consumption.status === 'REPORTED' ? (
                <ul className="lista-compacta">
                  {registro.consumption.items.map((i) => (
                    <li key={i.itemId}>
                      {nombreDeItem.get(i.itemId) ?? 'Ingrediente'}:{' '}
                      {i.notEaten
                        ? COPY_REGISTRO_PARA_EL_PROFESIONAL.noLoComio
                        : i.quantity
                          ? cantidad(i.quantity.value, ETIQUETA_DE_UNIDAD[i.quantity.unit])
                          : COPY_REGISTRO_PARA_EL_PROFESIONAL.sinCantidad}
                    </li>
                  ))}
                </ul>
              ) : null}
              {registro.consumption.source === 'RECTIFIED' && registro.consumption.rectifiedAt ? (
                <p className="nota">{COPY_REGISTRO_PARA_EL_PROFESIONAL.rectificado(fecha(registro.consumption.rectifiedAt))}</p>
              ) : null}
            </>
          ) : null}
        </>
      ) : (
        <>
          <p>
            <strong>{COPY_REGISTRO_PARA_EL_PROFESIONAL.algoDiferente}:</strong> {registro.description ? `«${registro.description}»` : COPY_REGISTRO_PARA_EL_PROFESIONAL.sinDescripcion}
          </p>
          {registro.meal ? <p className="nota">{COPY_REGISTRO_PARA_EL_PROFESIONAL.comidaDeContexto(registro.meal.label)}</p> : null}
          {registro.approximateQuantity ? (
            <p>
              {COPY_REGISTRO_PARA_EL_PROFESIONAL.cantidadAproximada}: {registro.approximateQuantity}
            </p>
          ) : null}
        </>
      )}
      {registro.consumed ? <LoConsumido nutrientes={registro.consumed} nombres={nombreDeItem} /> : <p className="nota">{COPY_REGISTRO_DE_COMIDAS.macrosSinCalcular}</p>}
      {registro.observation ? <p className="nota">«{registro.observation}»</p> : null}
      {registro.evidence.length > 0 ? (
        <>
          <p className="lista__titulo">{COPY_REGISTRO_PARA_EL_PROFESIONAL.fotos}</p>
          <div className="fotos-del-registro">
            {registro.evidence.map((e, n) => (
              <FotoDelRegistro key={e.mediaId} medioId={e.mediaId} numero={n + 1} />
            ))}
          </div>
          <p className="nota">{COPY_REGISTRO_PARA_EL_PROFESIONAL.fotoPrivada}</p>
        </>
      ) : null}
      <p className="nota">Registrado el {fecha(registro.recordedAt)}</p>
    </div>
  );
}

function LoConsumido({ nutrientes, nombres }: { nutrientes: Nutrientes; nombres: ReadonlyMap<string, string> }) {
  const faltan = [...new Set(NUTRIENTES_CALCULADOS.flatMap((n) => nutrientes[n].missing.map((f) => nombres.get(f.key) ?? 'Ingrediente')))];
  return (
    <>
      <p className="lista__titulo">{COPY_REGISTRO_PARA_EL_PROFESIONAL.estimacionDeLoConsumido}</p>
      <ul className="lista-compacta">
        {NUTRIENTES_CALCULADOS.map((n) => {
          const texto = nutrienteParaMostrar(nutrientes[n], n);
          return (
            <li key={n}>
              {ETIQUETA_DE_NUTRIENTE[n]}: {texto === null ? COPY_RECETAS.sinDato : `${texto} ${UNIDAD_DE_NUTRIENTE[n]}`}
            </li>
          );
        })}
      </ul>
      {faltan.length > 0 ? <p className="nota">Sin cantidad o sin dato: {faltan.join(', ')}.</p> : null}
    </>
  );
}

function FotoDelRegistro({ medioId, numero }: { medioId: string; numero: number }) {
  const { token, sesionPerdida } = useNutricion();
  const { estado } = useImagenDeMedio(token, medioId, sesionPerdida);
  const texto = COPY_REGISTRO_PARA_EL_PROFESIONAL.fotoDelAsesorado(numero);
  if (estado.tipo === 'lista') return <img className="imagen-de-receta" src={estado.dataUrl} alt={texto} />;
  return (
    <div className="imagen-de-receta imagen-de-receta--respaldo" role="img" aria-label={estado.tipo === 'fallo' ? `${texto}: ${COPY_REGISTRO_PARA_EL_PROFESIONAL.fotoNoDisponible}` : texto}>
      <span aria-hidden="true">📷</span>
    </div>
  );
}
