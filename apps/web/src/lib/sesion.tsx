'use client';

/**
 * Sesión del website: el Bearer vive solo en memoria de la pestaña (DL-012, T5). No hay localStorage ni cookies:
 * recargar la página exige volver a iniciar sesión. La verdad de la sesión está en la API (se verifica en cada request);
 * esto solo guarda el token para enviarlo. Nunca se guarda un «rol autorizado» en el cliente (10-B01:881-901).
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

interface Sesion {
  readonly token: string;
  readonly expiraEn: number;
}

interface ContextoDeSesion {
  readonly sesion: Sesion | null;
  readonly guardar: (token: string, expiresAt: string) => void;
  readonly olvidar: () => void;
}

const Contexto = createContext<ContextoDeSesion | null>(null);

export function ProveedorDeSesion({ children }: { children: ReactNode }) {
  const [sesion, setSesion] = useState<Sesion | null>(null);

  const guardar = useCallback((token: string, expiresAt: string) => {
    setSesion({ token, expiraEn: new Date(expiresAt).getTime() });
  }, []);
  const olvidar = useCallback(() => setSesion(null), []);

  // Al vencer, el token se descarta aunque nadie lo use (la API lo rechazaría igual).
  useEffect(() => {
    if (!sesion) return;
    const restante = sesion.expiraEn - Date.now();
    if (restante <= 0) {
      setSesion(null);
      return;
    }
    const temporizador = setTimeout(() => setSesion(null), Math.min(restante, 2_147_000_000));
    return () => clearTimeout(temporizador);
  }, [sesion]);

  const valor = useMemo(() => ({ sesion, guardar, olvidar }), [sesion, guardar, olvidar]);
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useSesion(): ContextoDeSesion {
  const contexto = useContext(Contexto);
  if (!contexto) throw new Error('useSesion fuera de ProveedorDeSesion');
  return contexto;
}
