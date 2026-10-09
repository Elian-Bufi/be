'use client';

/**
 * Un registro de comida tal como lo hizo el asesorado (API-ING-03; DL-121), para el profesional del plan.
 * - El estado de las cantidades se dice como es: sin confirmar, porciones del plan confirmadas o informadas. Lo previsto
 *   nunca se muestra como consumido.
 * - La estimación de lo consumido sale de la API, con las cantidades confirmadas o informadas; sin ellas, «Macros sin
 *   calcular». Una foto no agrega macros.
 * - Las fotos son privadas (08 §21): se piden con su acceso firmado, que queda auditado, y no se guardan en el navegador.
 * - Los mismos estados que una toma o una sesión (WP-DASHBOARD-COMPRENSION, §3.B): sin acceso (el PDP ya no deja leerlo,
 *   o el registro no existe: el mismo texto, sin reintentar), y una falla recuperable con su motivo y «Reintentar».
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
  contrasteDeLaComida,
  nutrienteParaMostrar,
  type Nutrientes,
  type RegistroDeComida,
} from '@be/domain';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Cargando, ErrorConReintento } from '../../../../components/estados';
import { api, type Resultado } from '../../../../lib/api';
import { fecha } from '../../../../lib/formato';
import { useImagenDeMedio } from '../../../../lib/medios';
import { motivoDeFalla, textoDeFalla } from '../seguimiento/contexto';
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
  return <DetalleDeRegistroDeComida registroId={registroId} token={token} sesionPerdida={sesionPerdida} />;
}

/**
 * El mismo detalle, con la sesión por props: lo usa también la ficha del asesorado («Abrir registro» desde la línea de
 * tiempo y desde Analizar), fuera de la pestaña Nutrición. La lectura es la misma API-ING-03, con su PDP.
 */
export function DetalleDeRegistroDeComida({
  registroId,
  token,
  sesionPerdida,
  onNoDisponible,
}: {
  registroId: string;
  token: string;
  sesionPerdida: (r: Resultado<unknown>) => boolean;
  /** Avisa una vez que el registro ya no se puede leer con el acceso de ahora (quien lo abrió vuelve a preguntar). */
  onNoDisponible?: () => void;
}) {
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
  // Un 404 (o un 403) es «sin acceso»: el mismo texto para lo revocado y lo inexistente, y sin reintentar sin fin.
  const sinAcceso = r !== null && !r.ok && r.tipo === 'API' && (r.codigo === 'RESOURCE_NOT_FOUND' || r.status === 403);
  const aviso = useRef(onNoDisponible);
  aviso.current = onNoDisponible;
  useEffect(() => {
    if (sinAcceso) aviso.current?.();
  }, [sinAcceso]);

  if (r === null) return <Cargando />;
  if (sinAcceso) return <p className="nota">Este registro no está disponible con tu acceso actual.</p>;
  if (!r.ok) return <ErrorConReintento mensaje={textoDeFalla(motivoDeFalla(r), 'el registro de comida')} onReintentar={() => void cargar()} />;
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
              <ContrasteConLaOpcion registro={registro} />
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
              <FotoDelRegistro key={e.mediaId} medioId={e.mediaId} numero={n + 1} token={token} sesionPerdida={sesionPerdida} />
            ))}
          </div>
          <p className="nota">{COPY_REGISTRO_PARA_EL_PROFESIONAL.fotoPrivada}</p>
        </>
      ) : null}
      <p className="nota">Registrado el {fecha(registro.recordedAt)}</p>
    </div>
  );
}

/**
 * Lo indicado y lo registrado, ingrediente por ingrediente (WP-DASHBOARD-COMPRENSION, eje 2): la opción tal como estaba
 * en su versión del plan contra lo que la persona confirmó o informó. Sin confirmar sigue sin confirmar; la diferencia
 * es una resta en la misma unidad, sin porcentaje ni juicio.
 */
function ContrasteConLaOpcion({ registro }: { registro: RegistroDeComida }) {
  const c = contrasteDeLaComida(registro);
  if (c.tipo !== 'CON_LA_OPCION' || c.filas.length === 0) return null;
  return (
    <div className="desplazable-x">
      <table className="tabla tabla--compacta">
        <caption className="visualmente-oculto">Lo indicado y lo registrado, por ingrediente</caption>
        <thead>
          <tr>
            <th scope="col">Ingrediente</th>
            <th scope="col">Indicado</th>
            <th scope="col">Registrado</th>
            <th scope="col">Diferencia</th>
          </tr>
        </thead>
        <tbody>
          {c.filas.map((f) => (
            <tr key={f.itemId}>
              <th scope="row">{f.nombre}</th>
              <td>{f.indicado}</td>
              <td>{f.registrado}</td>
              <td>{f.diferencia ?? (f.estado === 'OTRA_UNIDAD' ? 'otra unidad: no se resta' : f.estado === 'IGUAL' ? 'igual' : '—')}</td>
            </tr>
          ))}
        </tbody>
      </table>
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

function FotoDelRegistro({ medioId, numero, token, sesionPerdida }: { medioId: string; numero: number; token: string; sesionPerdida: (r: Resultado<unknown>) => boolean }) {
  const { estado } = useImagenDeMedio(token, medioId, sesionPerdida);
  const texto = COPY_REGISTRO_PARA_EL_PROFESIONAL.fotoDelAsesorado(numero);
  if (estado.tipo === 'lista') return <img className="imagen-de-receta" src={estado.dataUrl} alt={texto} />;
  return (
    <div className="imagen-de-receta imagen-de-receta--respaldo" role="img" aria-label={estado.tipo === 'fallo' ? `${texto}: ${COPY_REGISTRO_PARA_EL_PROFESIONAL.fotoNoDisponible}` : texto}>
      <span aria-hidden="true">📷</span>
    </div>
  );
}
