/**
 * «Tus asesorados» en forma de directorio (WP-ESCRITORIO-AMABLE, parte 5): una persona por renglón, con sus áreas.
 * - El vínculo es por alcance (DL-039): la lista de la API trae un renglón por alcance, de todos los estados y de los dos
 *   roles de la cuenta. Acá se juntan por persona los vínculos donde la cuenta es la profesional.
 * - Un área con acceso se nombra sola. Una sin acceso se dice con las palabras de BE (`estadoParaMostrar`, 10-B04 §28,
 *   H10-04-04): «Pausado · sin acceso» no es «Finalizado», ni «Acceso pendiente de autorización del asesorado».
 * - Nada se pierde: cada vínculo, con su finalidad, su estado y desde cuándo, queda en el detalle de la persona.
 * - El asesorado no tiene alias (DL-040): su nombre visible es su referencia, y se busca por ella.
 */
import { ALCANCES, ETIQUETA_DE_FINALIDAD, estadoParaMostrar, normalizarTexto, type Alcance, type Vinculo } from '@be/domain';

export interface VinculoDelDirectorio {
  readonly relationshipId: string;
  readonly alcance: Alcance;
  /** El nombre del área, como lo dice la API («Nutrición»). */
  readonly area: string;
  readonly finalidad: string;
  readonly conAcceso: boolean;
  /** El estado con las palabras de BE y, si lo hay, su detalle. */
  readonly estado: string;
  readonly detalle: string | null;
  /** El instante en que se aceptó el vínculo. */
  readonly desde: string;
}

export interface PersonaDelDirectorio {
  readonly identityId: string;
  readonly nombre: string;
  /** Todos sus vínculos con este profesional: en el orden de las áreas de BE y, dentro de un área, el más nuevo primero. */
  readonly vinculos: readonly VinculoDelDirectorio[];
  /** Las áreas con acceso activo, en el orden de BE, sin repetir. */
  readonly conAcceso: readonly string[];
  /** Las áreas sin acceso activo: una por área (el vínculo que más dice), con las palabras de BE. */
  readonly sinAcceso: readonly { readonly area: string; readonly estado: string }[];
}

/** El acceso activo, con la misma regla que `estadoParaMostrar` para «Activo · acceso contextual». */
const tieneAcceso = (v: Pick<Vinculo, 'relationshipState' | 'consentState' | 'accessMode'>): boolean => v.relationshipState === 'ACEPTADO' && v.consentState === 'ACTIVE' && v.accessMode === 'CONTEXTUAL';

/** De varios vínculos de un área sin acceso, cuál se dice en el resumen: el vigente antes que el pausado, y este antes que el finalizado. */
const PESO_DEL_ESTADO: Readonly<Record<Vinculo['relationshipState'], number>> = { ACEPTADO: 0, PAUSADO: 1, FINALIZADO: 2 };

function vinculoDelDirectorio(v: Vinculo): VinculoDelDirectorio {
  const e = estadoParaMostrar(v, 'PROFESSIONAL');
  return {
    relationshipId: v.relationshipId,
    alcance: v.scope.code,
    area: v.scope.label,
    finalidad: ETIQUETA_DE_FINALIDAD[v.purpose],
    conAcceso: tieneAcceso(v),
    estado: e.estado,
    detalle: e.detalle,
    desde: v.acceptedAt,
  };
}

/** El estado de un vínculo en una frase: las palabras de BE, con su detalle si lo tiene. */
export const estadoEnUnaFrase = (v: Pick<VinculoDelDirectorio, 'estado' | 'detalle'>): string => (v.detalle ? `${v.estado} · ${v.detalle}` : v.estado);

/**
 * Las personas del directorio, en el orden en que llegan de la API (el vínculo más nuevo primero). `profesionalId` es la
 * cuenta que mira: los vínculos donde esa cuenta es la asesorada no son de este directorio.
 */
export function armarElDirectorio(vinculos: readonly Vinculo[], profesionalId: string): PersonaDelDirectorio[] {
  const porPersona = new Map<string, { nombre: string; vinculos: Vinculo[] }>();
  for (const v of vinculos) {
    if (v.professional.identityId !== profesionalId) continue;
    const persona = porPersona.get(v.advisee.identityId) ?? { nombre: v.advisee.displayName, vinculos: [] };
    persona.vinculos.push(v);
    porPersona.set(v.advisee.identityId, persona);
  }
  return [...porPersona.entries()].map(([identityId, { nombre, vinculos: suyos }]) => {
    const ordenados = [...suyos].sort((a, b) => ALCANCES.indexOf(a.scope.code) - ALCANCES.indexOf(b.scope.code) || b.acceptedAt.localeCompare(a.acceptedAt));
    const conAcceso: string[] = [];
    const sinAcceso: { area: string; estado: string }[] = [];
    for (const alcance of ALCANCES) {
      const delArea = ordenados.filter((v) => v.scope.code === alcance);
      if (delArea.length === 0) continue;
      const activo = delArea.find(tieneAcceso);
      if (activo) {
        conAcceso.push(activo.scope.label);
        continue;
      }
      // Ya vienen del más nuevo al más viejo: entre los de igual peso queda el más nuevo.
      const elQueMasDice = [...delArea].sort((a, b) => PESO_DEL_ESTADO[a.relationshipState] - PESO_DEL_ESTADO[b.relationshipState])[0] as Vinculo;
      sinAcceso.push({ area: elQueMasDice.scope.label, estado: estadoEnUnaFrase(vinculoDelDirectorio(elQueMasDice)) });
    }
    return { identityId, nombre, vinculos: ordenados.map(vinculoDelDirectorio), conAcceso, sinAcceso };
  });
}

/** Letras y números, sin acentos ni signos: «Asesorado · a9be23» y «asesorado a9be23» coinciden. */
const llano = (texto: string): string =>
  normalizarTexto(texto)
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/** Las personas cuya referencia contiene todas las palabras buscadas. Sin nada que buscar, todas. */
export function buscarEnElDirectorio<P extends Pick<PersonaDelDirectorio, 'nombre'>>(personas: readonly P[], buscado: string): P[] {
  const palabras = llano(buscado).split(' ').filter(Boolean);
  if (palabras.length === 0) return [...personas];
  return personas.filter((p) => {
    const nombre = llano(p.nombre);
    return palabras.every((palabra) => nombre.includes(palabra));
  });
}
