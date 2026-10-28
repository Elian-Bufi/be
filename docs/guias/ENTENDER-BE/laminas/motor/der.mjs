// Ayudas para las vistas del DER: las filas de cada entidad y las relaciones salen de datos/esquema.json (lectura de
// prisma/schema.prisma), así la figura no puede contradecir al esquema.
// Convenciones de la figura (nivel lógico):
//   · columna de clave: PK, FK, UK, PK·FK o FK U1 (U1 = parte de la unicidad compuesta 1);
//   · obligatoriedad (notación de Barker): * obligatorio, o opcional;
//   · ↗ = la clave foránea apunta a una entidad de otra vista (se nombra en la nota de la vista);
//   · se omiten los atributos de patrón comunes (momentoDeOcurrencia, momentoDeRegistro, procedencia) y, si la entidad
//     supera el máximo de filas, los de menor valor explicativo; la caja dice cuántos omite. Todos están en el diccionario.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const esquema = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../../datos/esquema.json'), 'utf8'));
export const ESQUEMA = esquema;
const enums = new Set(esquema.enums.map((e) => e.nombre));
export const PATRON = new Set(['momentoDeOcurrencia', 'momentoDeRegistro', 'procedencia']);
const PRIORIDAD = [
  'estado', 'situacion', 'situacionResultante', 'estadoOperativoDeCuenta', 'tipo', 'decision', 'resultado', 'version', 'numero',
  'alcance', 'finalidad', 'iniciador', 'operacion', 'nombre', 'etiqueta', 'venceEn', 'vigenteDesde', 'vigenteHasta',
];

export function modelo(nombre) {
  const m = esquema.modelos.find((x) => x.nombre === nombre);
  if (!m) throw new Error(`no existe el modelo ${nombre}`);
  return m;
}

/** Atributos (columnas) de un modelo: escalares, enums y claves foráneas; sin los campos de relación ni las listas. */
export function columnas(nombre) {
  return modelo(nombre).campos.filter((c) => !c.lista && (c.escalar || enums.has(c.tipo)));
}

/**
 * Filas para L.entidad(). vista: nombres de los modelos dibujados en la vista (para marcar ↗ lo externo).
 * maximo: filas visibles (sin contar la de omitidos). incluir/excluir: nombres forzados.
 */
export function filasDe(nombre, { vista = [], maximo = 10, incluir = [], excluir = [] } = {}) {
  const m = modelo(nombre);
  const compuestas = m.unicos.filter((u) => u.columnas.length > 1);
  const marcaCompuesta = (c) => {
    const i = compuestas.findIndex((u) => u.columnas.includes(c));
    return i < 0 ? '' : `U${i + 1}`;
  };
  const cols = columnas(nombre).filter((c) => !excluir.includes(c.nombre));
  const clave = (c) => {
    const partes = [];
    if (c.clavePrimaria || m.clavePrimariaCompuesta?.includes(c.nombre)) partes.push('PK');
    if (c.claveForanea) partes.push('FK');
    if (c.unico && !c.clavePrimaria) partes.push('UK');
    const u = marcaCompuesta(c.nombre);
    if (u) partes.push(u);
    return partes.join(partes.length === 2 && partes[0] === 'PK' ? '·' : ' ');
  };
  const esClave = (c) => !!clave(c);
  const elegidas = [];
  for (const c of cols) if (esClave(c) || incluir.includes(c.nombre)) elegidas.push(c);
  const resto = cols
    .filter((c) => !elegidas.includes(c) && !PATRON.has(c.nombre))
    .sort((a, b) => {
      const pa = PRIORIDAD.indexOf(a.nombre);
      const pb = PRIORIDAD.indexOf(b.nombre);
      return (pa < 0 ? 99 : pa) - (pb < 0 ? 99 : pb);
    });
  for (const c of resto) if (elegidas.length < maximo) elegidas.push(c);
  // Mantener el orden del esquema.
  const visibles = cols.filter((c) => elegidas.includes(c));
  const omitidos = cols.length - visibles.length;
  return {
    filas: visibles.map((c) => ({
      clave: clave(c),
      nulo: c.opcional ? 'o' : '*',
      nombre: c.nombre,
      externo: !!(c.claveForanea && !vista.includes(c.claveForanea.modelo)),
      destino: c.claveForanea?.modelo ?? null,
    })),
    omitidos,
  };
}

/** Relaciones (con su cardinalidad según el esquema) entre modelos de la misma vista. */
export function relacionesEntre(vista) {
  return esquema.relaciones.filter((r) => vista.includes(r.desde) && vista.includes(r.hacia));
}

/** Referencias de la vista hacia entidades de otras vistas, agrupadas por destino (para la nota). */
export function referenciasExternas(vista) {
  const porDestino = new Map();
  for (const r of esquema.relaciones)
    if (vista.includes(r.desde) && !vista.includes(r.hacia)) {
      if (!porDestino.has(r.hacia)) porDestino.set(r.hacia, new Set());
      for (const fk of r.clavesForaneas) porDestino.get(r.hacia).add(fk);
    }
  return [...porDestino.entries()].map(([destino, fks]) => ({ destino, campos: [...fks] }));
}

/** Puntas de pata de gallo para una relación del esquema: en la hija (la que tiene la FK) y en el padre. */
export function puntas(rel) {
  return {
    hija: rel.cardinalidadHija === '0..1' ? 'cero_o_uno' : 'cero_o_muchos',
    padre: rel.cardinalidadPadre === '1' ? 'uno' : 'cero_o_uno',
  };
}
