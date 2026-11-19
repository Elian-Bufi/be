'use client';

/**
 * PLT (DL-182) · `/pro/templates/training?preparacion=…` — el editor de una plantilla de entrenamiento, sin persona.
 *
 * Es el mismo editor del plan (`advisees/training/editor.tsx`, con `EditorDePlantilla`): la página le da lo que el editor
 * lee (la sesión, la dirección y `asesoradoId: null`) y qué hacer al guardar o al descartar. Lo que se mira (la fase, la
 * sesión, los ejercicios abiertos) vive en la dirección, como en el plan: «Actualizar» y volver atrás lo conservan.
 * Guardada o descartada, vuelve a «Plantillas y habituales» con el aviso, y la plantilla guardada queda abierta.
 */
import type { PlantillaDeEntrenamiento } from '@be/domain';
import { COPY_PREPARACION_DE_PLANTILLA as P } from '@be/domain';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { Cargando, ErrorConReintento } from '../../../../components/estados';
import type { Resultado } from '../../../../lib/api';
import { dejarAvisoPara } from '../../../../lib/aviso-al-llegar';
import { cambiarLaDireccion } from '../../../../lib/direccion';
import { EsperandoSesion } from '../../../../lib/sesion';
import { hrefConCambios } from '../../advisees/seguimiento/estado';
import type { EdicionDePlantilla } from '../../advisees/training/edicion-de-plantilla';
import { PreparacionQueYaNoEsta } from '../../advisees/training/edicion-de-plantilla';
import { EditorDePlantilla } from '../../advisees/training/editor';
import { ProveedorDelEditorSinPersona, type ContextoDelEditorDeEntrenamiento } from '../../advisees/training/entrenamiento';
import { useAntesDeSalir } from '../../../../components/salida-segura';
import { SinEspacioProfesional, useEspacioProfesional } from '../../espacio-profesional';

const COLECCION = '/pro/templates';

/** Adónde vuelve: a la colección, con la plantilla abierta si ya existe. */
export const hrefDeLaPlantilla = (templateId: string): string => `${COLECCION}?plantilla=${encodeURIComponent(templateId)}`;
/** El editor de una preparación. */
export const hrefDelEditor = (draftId: string): string => `/pro/templates/training?preparacion=${encodeURIComponent(draftId)}`;

export function EditorDeLaPlantillaEnSuPagina() {
  const parametros = useSearchParams();
  const preparacionId = parametros.get('preparacion') ?? '';
  const ruta = usePathname();
  const router = useRouter();
  const antesDeSalir = useAntesDeSalir();
  const sesion = useEspacioProfesional(hrefDelEditor(preparacionId));
  const { token, sesionPerdida, yo, cargarYo } = sesion;
  // Una escritura con 404 (se guardó o se descartó en otra pestaña): lo preparado ya no está.
  const [yaNoEsta, setYaNoEsta] = useState(false);
  const accesoRetirado = useCallback((r: Resultado<unknown>) => {
    if (r.ok || r.tipo !== 'API' || r.codigo !== 'RESOURCE_NOT_FOUND') return false;
    setYaNoEsta(true);
    return true;
  }, []);
  const enLaDireccion = parametros.toString();
  const ir = useCallback(
    (cambios: Readonly<Record<string, string | null>>, opciones?: { readonly agregarAlHistorial?: boolean }) =>
      cambiarLaDireccion(hrefConCambios(ruta, new URLSearchParams(enLaDireccion), cambios), { agregarAlHistorial: opciones?.agregarAlHistorial }),
    [ruta, enLaDireccion],
  );
  const contexto = useMemo<ContextoDelEditorDeEntrenamiento | null>(
    () => (token ? { token, asesoradoId: null, sesionPerdida, accesoRetirado, parametros, ir } : null),
    [token, sesionPerdida, accesoRetirado, parametros, ir],
  );
  const plantilla = useMemo<EdicionDePlantilla>(
    () => ({
      preparacionId,
      volver: COLECCION,
      onGuardada: (p: PlantillaDeEntrenamiento, primera: boolean) => {
        dejarAvisoPara(COLECCION, primera ? P.guardadaPrimera : P.guardadaVersion(p.versionNumber));
        antesDeSalir(() => router.push(hrefDeLaPlantilla(p.templateId)));
      },
      onDescartada: (texto: string) => {
        dejarAvisoPara(COLECCION, texto);
        antesDeSalir(() => router.push(COLECCION));
      },
    }),
    [preparacionId, router, antesDeSalir],
  );

  if (!token) return <EsperandoSesion />;
  if (yo.tipo === 'cargando') return <Cargando />;
  if (yo.tipo === 'error') return <ErrorConReintento onReintentar={cargarYo} />;
  if (yo.tipo === 'sin-espacio') return <SinEspacioProfesional />;
  if (!preparacionId || yaNoEsta) return <PreparacionQueYaNoEsta volver={COLECCION} />;
  return contexto ? (
    <ProveedorDelEditorSinPersona value={contexto}>
      <EditorDePlantilla key={preparacionId} plantilla={plantilla} />
    </ProveedorDelEditorSinPersona>
  ) : null;
}
