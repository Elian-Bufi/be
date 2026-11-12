'use client';

/**
 * «Lo que contó al empezar» en el Resumen (WP-TABLERO-ALTA-GAMA TB-49; DL-165 D-8; TEST-TAG-033). Las cuentas y las
 * reglas, en `lo-que-conto.ts`; acá, las lecturas y el dibujo.
 *
 * Las lecturas son las que ya hace la pestaña Información, nada nuevo en la API (TA-23): la lista de solicitudes
 * respondidas de este profesional (API-FRM-04), y de las dos más nuevas, su detalle (API-FRI-03) y la versión de su
 * formulario (API-FRI-01), para escribir cada pregunta con sus palabras. Las demás se nombran con un enlace. Sin
 * solicitudes respondidas no hay tarjeta; si la lista no se pudo leer, se dice en su lugar.
 *
 * De solo lectura: cada solicitud abre su detalle en la pestaña Información, con el retorno a la ficha.
 */
import { COPY_FORMULARIOS as F, COPY_FORMULARIOS_V2 as V, type DetalleDeSolicitudV2, type SolicitudDeFormulario, type VersionDePlantillaV2 } from '@be/domain';
import { Enlace } from '../../../../components/enlace';
import { useId } from 'react';
import { BloqueDeEstado } from '../../../../components/estados';
import { Icono } from '../../../../components/icono';
import { api } from '../../../../lib/api';
import { diaSinElAnioEnCurso } from '../../../../lib/formato';
import { useNombres } from '../../../../lib/nombres-ocultos';
import { loDeclaradoV2 } from '../forms/lo-declarado-v2';
import { razonDeFalla, useLectura, useSeguimiento } from './contexto';
import { conRetorno, valorDeRetorno } from './estado';
import { ICONO_DE_FALLA } from './iconos-de-metrica';
import { respondidasParaLeer, solicitudQueConto } from './lo-que-conto';

/** Una página alcanza: la tarjeta lee las dos más nuevas y nombra las demás. */
const LIMITE = '20';

export function LoQueContoAlEmpezar() {
  const { token, asesoradoId, parametros } = useSeguimiento();
  const id = useId();
  const { lectura, recargar } = useLectura<{ readonly data: readonly SolicitudDeFormulario[] }>(`lo-que-conto|${asesoradoId}`, () =>
    api.listarSolicitudesDeFormulario(token, asesoradoId, { status: 'RESPONDED', limit: LIMITE }),
  );
  if (lectura.tipo === 'cargando' || lectura.tipo === 'no-disponible') return null;
  const volver = valorDeRetorno(parametros);
  const aLaPestana = (extra = '') => conRetorno(`/pro/advisees/forms?id=${encodeURIComponent(asesoradoId)}&vista=solicitudes${extra}`, volver);
  if (lectura.tipo === 'error') {
    return (
      <section className="lo-que-conto" aria-labelledby={`${id}-titulo`}>
        <h2 id={`${id}-titulo`}>Lo que contó al empezar</h2>
        <BloqueDeEstado tipo="error" icono={ICONO_DE_FALLA[lectura.motivo]} titulo="No pudimos leer sus respuestas" onReintentar={recargar} deQue="de lo que contó al empezar">
          {razonDeFalla(lectura.motivo)}
        </BloqueDeEstado>
      </section>
    );
  }
  const { leer, otras } = respondidasParaLeer(lectura.datos.data);
  if (leer.length === 0) return null;
  return (
    <section className="lo-que-conto" aria-labelledby={`${id}-titulo`}>
      <h2 id={`${id}-titulo`}>
        <Icono nombre="informacion" tamano={20} />
        Lo que contó al empezar
      </h2>
      <ul className="lo-que-conto__lista">
        {leer.map((s) => (
          <SolicitudRespondida key={s.formRequestId} solicitud={s} href={aLaPestana(`&solicitud=${encodeURIComponent(s.formRequestId)}`)} />
        ))}
      </ul>
      {otras > 0 ? (
        <p className="lo-que-conto__otras">
          <Enlace href={aLaPestana()}>{otras === 1 ? 'Ver la otra solicitud respondida' : 'Ver las otras solicitudes respondidas'}</Enlace>
        </p>
      ) : null}
    </section>
  );
}

/** Una solicitud respondida: su detalle y la versión de su formulario, leídos acá; sus respuestas que rigen, en palabras. */
function SolicitudRespondida({ solicitud, href }: { solicitud: SolicitudDeFormulario; href: string }) {
  const { token } = useSeguimiento();
  const { delProfesional } = useNombres();
  const { lectura: detalle } = useLectura<{ readonly data: DetalleDeSolicitudV2 }>(`solicitud|${solicitud.formRequestId}`, () => api.consultarVistaDeSolicitud(token, solicitud.formRequestId));
  const { lectura: formulario } = useLectura<{ readonly data: VersionDePlantillaV2 }>(`formulario|${solicitud.templateVersionId}`, () =>
    api.consultarDefinicionDePlantilla(token, solicitud.templateId, solicitud.templateVersionId),
  );
  if (detalle.tipo === 'cargando' || formulario.tipo === 'cargando') return null;
  const lista = detalle.tipo === 'listo' ? detalle.datos.data : null;
  const version = formulario.tipo === 'listo' ? formulario.datos.data : null;
  const declarado = lista ? loDeclaradoV2(solicitud, lista.response, version) : null;
  const q = solicitudQueConto(solicitud, declarado);
  // Sin una respuesta que rija para mostrar (o sin poder leerla), queda el enlace: la solicitud lo dice entera.
  if (!q) {
    return (
      <li className="lo-que-conto__solicitud">
        <h3>{solicitud.templateName}</h3>
        <Enlace href={href}>Ver la solicitud</Enlace>
      </li>
    );
  }
  const fecha = q.corrigioEl ? `respondió el ${diaSinElAnioEnCurso(q.respondioEl ?? q.corrigioEl)} y corrigió el ${diaSinElAnioEnCurso(q.corrigioEl)}` : q.respondioEl ? `respondió el ${diaSinElAnioEnCurso(q.respondioEl)}` : null;
  return (
    <li className="lo-que-conto__solicitud">
      <h3>{q.titulo}</h3>
      <p className="lo-que-conto__procedencia">
        <span className="etiqueta-de-dato">
          <Icono nombre="reportado" tamano={15} />
          {F.declaradoPorLaPersona}
        </span>
        <span className="tenue">
          {q.transcripcion ? V.web.transcripcion(delProfesional(q.transcripcion.professional), diaSinElAnioEnCurso(q.transcripcion.loadedAt), diaSinElAnioEnCurso(q.transcripcion.confirmedAt)) : fecha}
        </span>
      </p>
      <dl className="lo-que-conto__respuestas">
        {q.respuestas.map((r) => (
          <div key={r.pregunta}>
            <dt>{r.pregunta}</dt>
            <dd>{r.valor}</dd>
          </div>
        ))}
      </dl>
      <Enlace className="lo-que-conto__abrir" href={href}>
        {q.hayMas ? 'Ver todas sus respuestas' : 'Ver la solicitud'}
        <span className="visualmente-oculto"> · {q.titulo}</span>
      </Enlace>
    </li>
  );
}
