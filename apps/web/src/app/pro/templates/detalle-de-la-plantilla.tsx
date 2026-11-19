'use client';

/**
 * PLT (DL-182) · El detalle de una plantilla de entrenamiento en «Mis plantillas»:
 * - **su estructura agrupada por fase, sesión y bloque**, con la misma regla que el editor, la versión activa y la APK
 *   (`partesDeLaSesion`, por `bloques-en-la-lectura.ts`): un bloque «En vueltas» se describe; cada ejercicio dice en un
 *   renglón lo que indica, como en el editor plegado (`ejercicioPlegadoDelEditor`), y lo no indicado es «Sin indicar»;
 * - **sus versiones, como lista simple** (API-TPL-14): número, fecha, sesiones, cargas y cuántos planes salieron de cada
 *   una, sin nombrar a nadie (PLT-D11). La vigente lo dice.
 */
import {
  COPY_PLANTILLAS,
  COPY_PREPARACION_DE_PLANTILLA as P,
  ejercicioPlegadoDelEditor,
  type EstructuraDePlanDeEntrenamientoEntrada,
  type PlantillaDeEntrenamiento,
  type VersionDePlantillaDeEntrenamiento,
} from '@be/domain';
import { useEffect, useState } from 'react';
import { EnPartes } from '../../../components/en-partes';
import { api, type Resultado } from '../../../lib/api';
import { fecha } from '../../../lib/formato';
import { partesParaLeer } from '../advisees/training/bloques-en-la-lectura';

type Estructura = EstructuraDePlanDeEntrenamientoEntrada;
type Sesion = NonNullable<Estructura['blocks'][number]['sessions']>[number];
type Prescripcion = Sesion['prescriptions'][number];

/** La estructura de una plantilla, en solo lectura y agrupada: fase → (microciclo) → sesión → bloque → ejercicio. */
export function EstructuraAgrupada({ estructura, ejercicios }: { estructura: Estructura; ejercicios: PlantillaDeEntrenamiento['exercises'] }) {
  const ejercicio = (p: Prescripcion, clave: string) => {
    const e = ejercicios[p.exerciseVersionId];
    // Lo que no se indicó se dice «Sin indicar», como en el editor (Dirección, 2026-11-19).
    const resumen = p.sets.length === 0 ? P.sinIndicar : ejercicioPlegadoDelEditor(p, 0).resumen;
    return (
      <li key={clave} className="detalle-de-la-plantilla__ejercicio">
        <strong>{e ? e.exerciseName : 'Ejercicio no disponible en el catálogo'}</strong>
        {e && !e.available ? <span className="insignia"> no disponible</span> : null}
        <span className="nota">
          {' · '}
          <EnPartes texto={resumen} />
        </span>
        {(p.suggestedLoad ?? null) !== null ? <span className="nota"> · Carga de referencia: {p.suggestedLoad!.value} {p.suggestedLoad!.unit}</span> : null}
        {p.note ? <span className="nota"> · Nota: {p.note}</span> : null}
      </li>
    );
  };
  const sesion = (s: Sesion, clave: string) => {
    const conOrden = s.prescriptions.map((p, n) => ({ ...p, order: n + 1 }));
    const partes = partesParaLeer({ prescriptions: conOrden, exerciseGroups: s.exerciseGroups ?? [] });
    return (
      <div key={clave} className="nodo nodo--comida detalle-de-la-plantilla__sesion" data-sesion-de-la-plantilla>
        <h5>{s.label}</h5>
        {s.instructions ? <p className="nota">{s.instructions}</p> : null}
        {s.prescriptions.length === 0 ? <p className="nota">Sin ejercicios todavía: se completan al usarla con una persona.</p> : null}
        <ul className="lista-compacta">
          {partes.map((parte, n) =>
            parte.tipo === 'suelto' ? (
              ejercicio(parte.ejercicio, `${clave}-p${parte.ejercicio.order}`)
            ) : (
              <li key={`${clave}-g${parte.encabezado.groupId}`} className="detalle-de-la-plantilla__bloque" aria-label={parte.encabezado.etiqueta} data-bloque-de-la-plantilla>
                <p>
                  <strong>{parte.encabezado.nombre}</strong>
                  {parte.encabezado.detalle ? <span className="nota"> · {parte.encabezado.detalle}</span> : null}
                </p>
                <ul className="lista-compacta">{parte.ejercicios.map((x) => ejercicio(x, `${clave}-${n}-p${x.order}`))}</ul>
              </li>
            ),
          )}
        </ul>
      </div>
    );
  };
  return (
    <section className="detalle-de-la-plantilla" aria-label={P.estructura} data-estructura-de-la-plantilla>
      <h4>{P.estructura}</h4>
      {estructura.blocks.map((b, i) => (
        <div key={b.blockId ?? i} className="nodo nodo--dia">
          <p className="lista__titulo">
            {b.label}
            {b.purpose ? <span className="nota"> · {b.purpose}</span> : null}
          </p>
          {(b.microcycles ?? []).map((m, j) => (
            <div key={m.microcycleId ?? j} className="nodo nodo--opcion">
              <p className="lista__titulo">
                {m.label}
                {m.purpose ? ` · ${m.purpose}` : ''}
              </p>
              {m.sessions.map((s, k) => sesion(s, `${i}-${j}-${k}`))}
            </div>
          ))}
          {(b.sessions ?? []).map((s, k) => sesion(s, `${i}-${k}`))}
        </div>
      ))}
    </section>
  );
}

/** Las versiones de la plantilla (API-TPL-14), de la más nueva a la primera. */
export function VersionesDeLaPlantilla({ token, templateId, sesionPerdida }: { token: string; templateId: string; sesionPerdida: (r: Resultado<unknown>) => boolean }) {
  const [lectura, setLectura] = useState<{ readonly tipo: 'cargando' } | { readonly tipo: 'listo'; readonly versiones: readonly VersionDePlantillaDeEntrenamiento[] } | { readonly tipo: 'falla' }>({ tipo: 'cargando' });
  useEffect(() => {
    let vigente = true;
    void api.versionesDePlantillaDeEntrenamiento(token, templateId).then((r) => {
      if (!vigente || sesionPerdida(r)) return;
      setLectura(r.ok ? { tipo: 'listo', versiones: r.datos.data } : { tipo: 'falla' });
    });
    return () => {
      vigente = false;
    };
  }, [token, templateId, sesionPerdida]);
  return (
    <section className="versiones-de-la-plantilla" aria-labelledby={`versiones-${templateId}`} data-versiones-de-la-plantilla>
      <h4 id={`versiones-${templateId}`}>{P.versiones}</h4>
      {lectura.tipo === 'cargando' ? <p className="nota">Leyendo las versiones…</p> : null}
      {lectura.tipo === 'falla' ? <p className="nota">{P.noSeLeyeronLasVersiones}</p> : null}
      {lectura.tipo === 'listo' ? (
        <>
          <ul className="lista-compacta versiones-de-la-plantilla__lista">
            {lectura.versiones.map((v, n) => (
              <li key={v.versionId} data-version-de-la-plantilla={v.versionNumber}>
                <strong>{P.version(v.versionNumber)}</strong>
                {n === 0 ? <span className="insignia"> {P.vigente}</span> : null}
                <span className="nota">
                  {' · '}
                  {fecha(v.createdAt)} · {COPY_PLANTILLAS.sesiones(v.sessionCount)} · {v.copiedLoads ? COPY_PLANTILLAS.conCargas : COPY_PLANTILLAS.sinCargas} · {P.planesCreados(v.plansCreated)}
                </span>
              </li>
            ))}
          </ul>
          <p className="nota">{P.planesCreadosAyuda}</p>
        </>
      ) : null}
    </section>
  );
}
