'use client';

/**
 * Website `/pro` — espacio profesional:
 * - «Pendientes» (API-CAR-01; PF-07, DL-107): a quién mirar hoy, con hechos fechados y sin juicios (`pendientes.tsx`).
 * - «Tus asesorados» (REL-05), un directorio para entrar a la ficha de cada persona, con el estado mínimo de 10-B04
 *   §28-§29 (`asesorados.tsx`).
 * - «Solicitar vínculo» (REL-01) y «Solicitudes enviadas» (REL-02), cada una a un clic (`solicitar-vinculo.tsx`,
 *   `solicitudes-enviadas.tsx`).
 * Solo cuentas con la capacidad PROFESSIONAL_WORKSPACE que informa la API entran a este espacio (criterio 11A n.º 1);
 * la capacidad no autoriza nada: cada operación la decide la API.
 *
 * WP-ESCRITORIO-AMABLE, parte 5 (la pantalla 13 de las maquetas):
 * - **Primero lo que hay que hacer y, al lado, a quién abrir.** Dos tarjetas: los pendientes y el directorio. El
 *   formulario y la lista de solicitudes, que antes ocupaban dos tarjetas más, se abren cuando hacen falta.
 * - **Las tres listas se leen enteras** (`lista-completa.ts`, con `todasLasPaginas` del dominio): así se pueden contar y
 *   se puede buscar en ellas. La de
 *   pendientes es la única lectura protegida de la página: una al entrar, y ninguna al elegir una vista.
 * - **«Hoy» es la fecha con que la API clasificó las revisiones** (`today`), no la del navegador: sin esa lectura, no
 *   se dice.
 * - **`/pro` no lleva parámetros:** la vista elegida, los filtros y la búsqueda son de la visita (el retorno del inicio
 *   de sesión admite `/pro` a secas).
 */
import { COPY_INVITACION, COPY_VINCULO, numero } from '@be/domain';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AvisoFlotante } from '../../components/ayuda';
import { Cargando, ErrorConReintento } from '../../components/estados';
import { Aviso } from '../../components/formulario';
import { Icono } from '../../components/icono';
import { api, type Resultado } from '../../lib/api';
import { diaConSuSemana } from '../../lib/formato';
import { useListaCompleta } from '../../lib/lista-completa';
import { useSesionRequerida } from '../../lib/sesion-requerida';
import type { Periodo } from './advisees/periodo';
import { Asesorados } from './asesorados';
import { InvitarPersona } from './invitar-persona';
import { Pendientes, type PaginaDeCartera } from './pendientes';
import { SolicitarVinculo } from './solicitar-vinculo';
import { SolicitudesEnviadas, solicitudesEnviadasPor } from './solicitudes-enviadas';
import { areaUnicaDelProfesional } from './directorio';
import { EsperandoSesion } from '../../lib/sesion';

type Yo = { tipo: 'cargando' } | { tipo: 'error' } | { tipo: 'sin-espacio' } | { tipo: 'listo'; id: string };

/** Carga la cuenta y confirma que la API le informa el espacio profesional. Compartido con el workspace. */
export function useEspacioProfesional(volver: string) {
  const sesion = useSesionRequerida(volver);
  const { token, sesionPerdida } = sesion;
  const [yo, setYo] = useState<Yo>({ tipo: 'cargando' });
  const cargarYo = useCallback(async () => {
    if (!token) return;
    setYo({ tipo: 'cargando' });
    const r = await api.consultarCuenta(token);
    if (sesionPerdida(r)) return;
    if (!r.ok) return setYo({ tipo: 'error' });
    setYo(r.datos.data.actorCapabilities.includes('PROFESSIONAL_WORKSPACE') ? { tipo: 'listo', id: r.datos.data.identityId } : { tipo: 'sin-espacio' });
  }, [token, sesionPerdida]);
  useEffect(() => {
    void cargarYo();
  }, [cargarYo]);
  return { ...sesion, yo, cargarYo };
}

export function SinEspacioProfesional() {
  return (
    <Aviso tipo="info">
      <p>{COPY_VINCULO.recursoNoDisponible}</p>
      <p>
        <Link href="/account">Ir a tu cuenta</Link>
      </p>
    </Aviso>
  );
}

/** De a cuántos se lee y cuántas páginas de una vez: 200 pendientes (de a 50) y 200 vínculos o solicitudes (de a 20). */
const DE_LA_CARTERA = { limite: 50, paginas: 4 } as const;
/** Los vínculos y las solicitudes llegan de a 20: su lectura no admite otro tamaño de página. */
const DE_UNA_LISTA = { limite: 20, paginas: 10 } as const;

/** El título de la página está en todos sus estados: sin sesión, cargando, con una falla o sin espacio profesional. */
function Pagina({ children, alLado }: { children: ReactNode; alLado?: ReactNode }) {
  return (
    <div className="espacio-profesional">
      <div className="espacio-profesional__encabezado">
        <h1>Espacio profesional</h1>
        {alLado}
      </div>
      {children}
    </div>
  );
}

export function EspacioProfesional() {
  const { token, sesionPerdida, yo, cargarYo } = useEspacioProfesional('/pro');
  const id = yo.tipo === 'listo' ? yo.id : null;
  const [periodo, setPeriodo] = useState<Periodo>({});

  // Los pendientes: la cartera entera, de a 50. A la API va solo el período; la vista y los filtros se resuelven acá.
  const cartera = useListaCompleta(
    useMemo(
      () =>
        token && id
          ? (filtro: { cursor?: string; limit: string }): Promise<Resultado<PaginaDeCartera>> =>
              api.consultarCartera(token, { ...periodo, ...filtro }).then((r) => {
                if (!r.ok) return r;
                const { items, ...meta } = r.datos.data;
                return { ...r, datos: { data: items, page: r.datos.page, meta } };
              })
          : null,
      [token, id, periodo],
    ),
    sesionPerdida,
    DE_LA_CARTERA,
  );
  const vinculos = useListaCompleta(
    useMemo(() => (token && id ? (filtro: { cursor?: string }) => api.consultarVinculos(token, { cursor: filtro.cursor }) : null), [token, id]),
    sesionPerdida,
    DE_UNA_LISTA,
  );
  const enviadas = useListaCompleta(
    useMemo(() => (token && id ? (filtro: { cursor?: string }) => api.consultarSolicitudes(token, { cursor: filtro.cursor }) : null), [token, id]),
    sesionPerdida,
    DE_UNA_LISTA,
  );

  const [formulario, setFormulario] = useState(false);
  // WP-INVITACION (DL-136): invitar por enlace, QR o código es el camino principal; el identificador queda como alternativa.
  const [invitar, setInvitar] = useState(false);
  const [solicitudes, setSolicitudes] = useState<{ abiertas: boolean; aviso: string | null }>({ abiertas: false, aviso: null });
  const [aviso, setAviso] = useState<string | null>(null);

  if (!token) {
    return (
      <Pagina>
        <EsperandoSesion />
      </Pagina>
    );
  }
  if (yo.tipo !== 'listo') {
    return (
      <Pagina>
        {yo.tipo === 'cargando' ? <Cargando /> : null}
        {yo.tipo === 'error' ? <ErrorConReintento onReintentar={cargarYo} /> : null}
        {yo.tipo === 'sin-espacio' ? <SinEspacioProfesional /> : null}
      </Pagina>
    );
  }

  const actualizar = () => {
    void cartera.recargar();
    void vinculos.recargar();
    void enviadas.recargar();
  };
  const propias = enviadas.estado.tipo === 'listo' ? solicitudesEnviadasPor(enviadas.estado.items, yo.id) : null;
  // DL-146: si trabajás en una sola área, invitar y solicitar la traen elegida.
  const areaSugerida = vinculos.estado.tipo === 'listo' ? areaUnicaDelProfesional(vinculos.estado.items, yo.id) : null;
  const sinResponder = propias ? propias.filter((s) => s.state === 'PENDIENTE').length : 0;
  const hoy = cartera.estado.tipo === 'listo' ? cartera.estado.primera.meta.today : null;

  return (
    <Pagina
      alLado={
        <>
          {hoy ? <p className="espacio-profesional__hoy">Hoy, {diaConSuSemana(hoy)}</p> : null}
          <button type="button" className="boton boton--primario espacio-profesional__invitar" aria-haspopup="dialog" onClick={() => setInvitar(true)}>
            <Icono nombre="persona" tamano={20} />
            {COPY_INVITACION.invitar}
          </button>
          <button type="button" className="boton boton--secundario espacio-profesional__solicitar" aria-haspopup="dialog" onClick={() => setFormulario(true)}>
            <Icono nombre="solicitud" tamano={20} />
            {COPY_VINCULO.solicitarVinculo}
          </button>
        </>
      }
    >
      {/* Primero lo que hay que hacer (API-CAR-01, DL-107); al lado, a quién abrir. */}
      <div className="espacio-profesional__cuerpo">
        {/* Cada lista con su «Reintentar», que vuelve a leer solo esa; «Actualizar» lee las tres. */}
        <Pendientes cartera={cartera.estado} periodo={periodo} onPeriodo={setPeriodo} onActualizar={actualizar} onReintentar={() => void cartera.recargar()} onVerMas={() => void cartera.verMas()} />
        <Asesorados vinculos={vinculos.estado} profesionalId={yo.id} onReintentar={() => void vinculos.recargar()} onVerMas={() => void vinculos.verMas()}>
          <button type="button" className="boton boton--enlace directorio__solicitudes" aria-haspopup="dialog" onClick={() => setSolicitudes({ abiertas: true, aviso: null })}>
            <Icono nombre="solicitar" tamano={18} />
            Solicitudes enviadas{propias ? ` (${numero(propias.length)}${enviadas.estado.tipo === 'listo' && !enviadas.estado.completa ? '+' : ''})` : ''}
          </button>
          {/* «Pendiente» es la palabra de BE para una solicitud que el asesorado todavía no respondió (10-B04). */}
          {sinResponder > 0 ? (
            <span className="directorio__sin-responder nota">
              {numero(sinResponder)} {sinResponder === 1 ? 'pendiente de respuesta' : 'pendientes de respuesta'}
            </span>
          ) : null}
        </Asesorados>
      </div>

      <InvitarPersona
        abierto={invitar}
        areaSugerida={areaSugerida}
        token={token}
        sesionPerdida={sesionPerdida}
        onCerrar={() => setInvitar(false)}
        onConElIdentificador={() => {
          setInvitar(false);
          setFormulario(true);
        }}
      />
      <SolicitarVinculo
        abierto={formulario}
        areaSugerida={areaSugerida}
        token={token}
        sesionPerdida={sesionPerdida}
        onCerrar={() => setFormulario(false)}
        alEnviar={({ texto, deduplicada }) => {
          setFormulario(false);
          void enviadas.recargar();
          // «Te mostramos esa»: si ya había una igual pendiente, se abre la lista, que lo dice arriba.
          if (deduplicada) setSolicitudes({ abiertas: true, aviso: texto });
          else setAviso(texto);
        }}
      />
      <SolicitudesEnviadas
        abierto={solicitudes.abiertas}
        aviso={solicitudes.aviso}
        solicitudes={enviadas.estado}
        profesionalId={yo.id}
        onCerrar={() => setSolicitudes({ abiertas: false, aviso: null })}
        onReintentar={() => void enviadas.recargar()}
        onVerMas={() => void enviadas.verMas()}
      />
      {aviso ? (
        <AvisoFlotante onCerrar={() => setAviso(null)}>
          <p>{aviso}</p>
        </AvisoFlotante>
      ) : null}
    </Pagina>
  );
}
