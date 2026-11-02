/**
 * El contexto de la apariencia (Azul noche o Claro), aparte de `apariencia.tsx` para que lo pueda leer cualquier pieza
 * sin importar `ui.tsx`. El ícono de la familia (`icono.tsx`) lo lee para volver a dibujarse cuando cambia el tema, y
 * `ui.tsx` dibuja íconos: si el contexto viviera en `apariencia.tsx`, que importa `ui.tsx`, los tres se importarían en
 * círculo. `apariencia.tsx` lo reexporta: las pantallas lo siguen importando de ahí.
 */
import { createContext, useContext } from 'react';
import { TEMA_PREDETERMINADO, type Tema } from './tema';

export interface Apariencia {
  readonly tema: Tema;
  readonly cambiarTema: (tema: Tema) => void;
}

const ContextoDeApariencia = createContext<Apariencia>({ tema: TEMA_PREDETERMINADO, cambiarTema: () => undefined });
export const ProveedorDeApariencia = ContextoDeApariencia.Provider;
export const useApariencia = (): Apariencia => useContext(ContextoDeApariencia);
