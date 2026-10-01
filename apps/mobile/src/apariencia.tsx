/**
 * Apariencia de la APK (Dirección, 2026-09-30): «Azul noche» (predeterminada) o «Claro», como el website. La elige la
 * persona en Cuenta y queda guardada en este teléfono (no viaja a la cuenta ni a otros dispositivos).
 *
 * El estado vive en la raíz de la app: al cambiarlo, la raíz se vuelve a dibujar y con ella toda la app, sin perder la
 * pantalla en la que está la persona ni su sesión. Si el teléfono no deja leer o guardar la preferencia, se usa la
 * predeterminada y el cambio vale mientras la app esté abierta: nunca se rompe por eso.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { esTema, fijarTema, TEMA_PREDETERMINADO, TEMAS, temaVigente, type Tema } from './tema';
import { CampoSiONo } from './ui';

/** La misma clave que el website (`apps/web/src/lib/apariencia.ts`). */
export const CLAVE_DE_APARIENCIA = 'be-apariencia';
export const NOMBRE_DEL_TEMA: Readonly<Record<Tema, string>> = { 'azul-noche': 'Azul noche', claro: 'Claro' };
/** Cuánto se espera la preferencia guardada antes de dibujar con la predeterminada. */
const ESPERA_MAXIMA_MS = 1500;

export interface Apariencia {
  readonly tema: Tema;
  readonly cambiarTema: (tema: Tema) => void;
}

const ContextoDeApariencia = createContext<Apariencia>({ tema: TEMA_PREDETERMINADO, cambiarTema: () => undefined });
export const ProveedorDeApariencia = ContextoDeApariencia.Provider;
export const useApariencia = (): Apariencia => useContext(ContextoDeApariencia);

/**
 * Para la raíz: lee la preferencia guardada antes del primer dibujo (`lista`), y cambia y guarda el tema. Una
 * preferencia que llega después de la espera máxima no se aplica: el tema no cambia solo a mitad de uso.
 */
export function useAparienciaGuardada(): Apariencia & { readonly lista: boolean } {
  const [tema, setTema] = useState<Tema>(temaVigente());
  const [lista, setLista] = useState(false);
  const yaLista = useRef(false);
  useEffect(() => {
    const terminar = () => {
      if (yaLista.current) return;
      yaLista.current = true;
      setLista(true);
    };
    const limite = setTimeout(terminar, ESPERA_MAXIMA_MS);
    AsyncStorage.getItem(CLAVE_DE_APARIENCIA)
      .then((guardado) => {
        if (!yaLista.current && esTema(guardado)) {
          fijarTema(guardado);
          setTema(guardado);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        clearTimeout(limite);
        terminar();
      });
    return () => clearTimeout(limite);
  }, []);
  const cambiarTema = useCallback((nuevo: Tema) => {
    // Primero el tema vigente: el dibujo que dispara `setTema` ya lee los colores nuevos.
    fijarTema(nuevo);
    setTema(nuevo);
    AsyncStorage.setItem(CLAVE_DE_APARIENCIA, nuevo).catch(() => undefined);
  }, []);
  return { tema, cambiarTema, lista };
}

/**
 * El selector de Cuenta: el mismo grupo de opciones accesible del resto de la app (rol radiogroup). Tocar la opción ya
 * elegida no la suelta: siempre hay un tema.
 */
export function SelectorDeApariencia() {
  const { tema, cambiarTema } = useApariencia();
  return (
    <CampoSiONo
      etiqueta="Colores de la app"
      ayuda="Azul noche es la predeterminada. Lo que elijas se guarda en este teléfono."
      opciones={TEMAS.map((t) => ({ valor: t, texto: NOMBRE_DEL_TEMA[t] }))}
      valor={tema}
      onCambio={(valor) => {
        if (esTema(valor)) cambiarTema(valor);
      }}
    />
  );
}
