'use client';

/**
 * El centro de novedades del website (WP-NOVEDADES-Y-AVISOS, DL-133; RF-061, UC-P30), el mismo para el profesional y
 * para la persona, cada uno en su espacio.
 * - De la más nueva a la más vieja, de a 30, con «Ver más». Cada una dice qué pasó, quién y cuándo; nunca el contenido:
 *   eso está en la pantalla que la resuelve, que vuelve a autorizar.
 * - «Abrir» la marca leída (la API registra la primera lectura) y lleva a esa pantalla. Si en el website no hay una
 *   (un plan o un recordatorio, que viven en la app), queda leída y se dice dónde verla.
 * - Una novedad sin leer se distingue por el texto «Sin leer», no solo por el color (B10-10 §43).
 * - Cargando, error con «Reintentar» y vacío, como el resto (10-B10:343-378).
 */
import { COPY_NOVEDADES, type Novedad } from '@be/domain';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { fecha } from '../lib/formato';
import { useSesionRequerida } from '../lib/sesion-requerida';
import { Cargando, ErrorConReintento } from './estados';
import { Icono } from './icono';

export type EspacioDeNovedades = 'pro' | 'cuenta';

const POR_PAGINA = '30';

/**
 * Adónde lleva cada novedad en el website; `null` cuando se ve en la app (un plan, una revisión, un recordatorio). La API
 * ya eligió la vista según quién la lee (la ficha o el espacio profesional para el profesional, los vínculos para la
 * persona): el destino no depende de en qué página está abierta la lista.
 */
export function destinoDeNovedad(n: Novedad): string | null {
  if (n.open.view === 'ADVISEE') return n.open.referenceId ? `/pro/advisees?id=${encodeURIComponent(n.open.referenceId)}` : '/pro';
  if (n.open.view === 'PRO_HOME') return '/pro';
  if (n.open.view === 'RELATIONSHIPS') return '/account/relationships';
  return null;
}

type Estado = { tipo: 'cargando' } | { tipo: 'error' } | { tipo: 'listo'; items: Novedad[]; cursor: string | null; sinLeer: number };

export function CentroDeNovedades({ espacio }: { espacio: EspacioDeNovedades }) {
  const router = useRouter();
  const volver = espacio === 'pro' ? '/pro/news' : '/account/news';
  const { token, sesionPerdida } = useSesionRequerida(volver);
  const [estado, setEstado] = useState<Estado>({ tipo: 'cargando' });
  const [masCargando, setMasCargando] = useState(false);
  const [abriendo, setAbriendo] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    if (!token) return;
    setEstado({ tipo: 'cargando' });
    const r = await api.consultarNovedades(token, { limit: POR_PAGINA });
    if (sesionPerdida(r)) return;
    setEstado(r.ok ? { tipo: 'listo', items: r.datos.data, cursor: r.datos.page.nextCursor, sinLeer: r.datos.unreadCount } : { tipo: 'error' });
  }, [token, sesionPerdida]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  async function verMas() {
    if (!token || estado.tipo !== 'listo' || !estado.cursor) return;
    setMasCargando(true);
    const r = await api.consultarNovedades(token, { limit: POR_PAGINA, cursor: estado.cursor });
    setMasCargando(false);
    if (sesionPerdida(r)) return;
    if (r.ok) setEstado({ tipo: 'listo', items: [...estado.items, ...r.datos.data], cursor: r.datos.page.nextCursor, sinLeer: r.datos.unreadCount });
    else setAviso(COPY_NOVEDADES.errorAlCargar);
  }

  async function abrir(n: Novedad) {
    if (!token || abriendo) return;
    setAbriendo(n.newsId);
    setAviso(null);
    const r = await api.abrirNovedad(token, n.newsId);
    setAbriendo(null);
    if (sesionPerdida(r)) return;
    if (!r.ok) {
      setAviso(COPY_NOVEDADES.errorAlCargar);
      return;
    }
    const destino = destinoDeNovedad(r.datos.data);
    if (destino) {
      router.push(destino);
      return;
    }
    // Sin pantalla en el website: queda leída acá mismo.
    setEstado((e) =>
      e.tipo === 'listo'
        ? { ...e, items: e.items.map((x) => (x.newsId === n.newsId ? r.datos.data : x)), sinLeer: n.readAt ? e.sinLeer : Math.max(0, e.sinLeer - 1) }
        : e,
    );
  }

  if (estado.tipo === 'cargando') return <Cargando />;
  if (estado.tipo === 'error') return <ErrorConReintento mensaje={COPY_NOVEDADES.errorAlCargar} onReintentar={() => void cargar()} />;
  if (estado.items.length === 0) {
    return <p className="novedades__vacio">{espacio === 'pro' ? COPY_NOVEDADES.vacioProfesional : COPY_NOVEDADES.vacio}</p>;
  }
  return (
    <section className="novedades" aria-labelledby="novedades-titulo">
      <p id="novedades-titulo" className="nota">
        {estado.sinLeer === 0 ? 'Leíste todas tus novedades.' : estado.sinLeer === 1 ? 'Tenés una novedad sin leer.' : `Tenés ${estado.sinLeer} novedades sin leer.`}
      </p>
      <ul className="novedades__lista">
        {estado.items.map((n) => {
          const destino = destinoDeNovedad(n);
          return (
            <li key={n.newsId} className={`novedad${n.readAt ? '' : ' novedad--sin-leer'}`}>
              <span className="novedad__icono">
                <Icono nombre={iconoDe(n)} />
              </span>
              <div className="novedad__texto">
                <p className="novedad__titulo">
                  {n.title}
                  {n.readAt ? null : <span className="novedad__marca">{COPY_NOVEDADES.noLeida}</span>}
                </p>
                <p>{n.body}</p>
                <p className="nota">
                  {fecha(n.occurredAt ?? n.recordedAt)}
                  {destino === null && n.open.view !== 'NEWS' ? ' · Se ve en la app de BE.' : ''}
                </p>
              </div>
              <button type="button" className="boton boton--secundario novedad__abrir" onClick={() => void abrir(n)} disabled={abriendo !== null}>
                {abriendo === n.newsId ? 'Abriendo…' : destino ? COPY_NOVEDADES.abrir : n.readAt ? 'Leída' : 'Marcar leída'}
              </button>
            </li>
          );
        })}
      </ul>
      {aviso ? (
        <p className="campo__error" role="alert">
          {aviso}
        </p>
      ) : null}
      {estado.cursor ? (
        <button type="button" className="boton boton--secundario" onClick={() => void verMas()} disabled={masCargando}>
          {masCargando ? 'Cargando…' : 'Ver más'}
        </button>
      ) : null}
    </section>
  );
}

function iconoDe(n: Novedad) {
  if (n.kind === 'MEAL_LOG_REMINDER' || n.kind === 'TRAINING_LOG_REMINDER') return 'calendario' as const;
  if (n.scope === 'NUTRICION') return 'nutricion' as const;
  if (n.scope === 'ENTRENAMIENTO') return 'entrenamiento' as const;
  if (n.scope === 'ANTROPOMETRIA') return 'antropometria' as const;
  return 'novedades' as const;
}
