// Clasifica los modelos de datos/esquema.json según la función de cada tabla, para el cuaderno de datos («¿por qué hay
// tantas tablas?»). La regla de cada clase es explícita y se aplica por nombre y por estructura; lo que no encaja queda
// «sin clasificar» y la herramienta falla, así nada se esconde. Uso: node clasificar-tablas.mjs → datos/clases-de-tablas.json
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = dirname(fileURLToPath(import.meta.url));
const esquema = JSON.parse(readFileSync(join(aqui, '../datos/esquema.json'), 'utf8'));

// Orden de prueba: la primera regla que coincide gana.
const CLASES = [
  { clave: 'evento', nombre: 'Hechos y eventos (historia)', regla: (n) => /^(Evento|ResolucionDe|AplicacionDeRevision)/.test(n) || n === 'DecisionDeAcceso' || n === 'RegistroDeAuditoria' || n === 'LecturaDeNovedad' || n === 'AvisoPush' },
  { clave: 'correccion', nombre: 'Correcciones, anulaciones y retiros (corregir sin borrar)', regla: (n) => /^(Correccion|Anulacion|Rectificacion|Retiro)De/.test(n) },
  { clave: 'version', nombre: 'Versiones e instantáneas (cambiar sin pisar)', regla: (n) => /^(Version|Instantanea)De/.test(n) },
  { clave: 'relacion', nombre: 'Relaciones y asociaciones', regla: (n) => /^(Asociacion|Destinatario|Referencia(DeNota)?|Alcance|Cita|Entrada)De/.test(n) || ['Vinculo', 'Habilitacion'].includes(n) },
  { clave: 'catalogo', nombre: 'Catálogos y textos de referencia', regla: (n) => /^(ElementoDeCatalogo|EjercicioDeCatalogo|ItemExterno|NombreAlternativo|Especificacion|VersionDeTexto|PlantillaDe|Receta)/.test(n) || ['ActoRegistrable', 'CandidatoDeImportacion'].includes(n) },
  { clave: 'tecnica', nombre: 'Operación técnica (sesiones, seguridad, idempotencia, compatibilidad)', regla: (n) => /^(Sesion$|ReanudacionDeSesion|ControlDeSesion|RegistroDeIdempotencia|CapacidadDeCliente|SuscripcionPush|CodigoDe|FactorTotp|SegundoFactor|CredencialLocal|MetodoDeAcceso|SolicitudDeCierre|RegistroDeSupresion|Medio|ContenidoDeMedio)/.test(n) },
  { clave: 'entidad', nombre: 'Entidades del negocio (cosas que existen y cambian de estado)', regla: () => true },
];

const resultado = Object.fromEntries(CLASES.map((c) => [c.clave, { nombre: c.nombre, modelos: [] }]));
for (const m of esquema.modelos) {
  const clase = CLASES.find((c) => c.regla(m.nombre));
  resultado[clase.clave].modelos.push({ nombre: m.nombre, tabla: m.tabla, seccion: m.seccion });
}
writeFileSync(join(aqui, '../datos/clases-de-tablas.json'), JSON.stringify({ total: esquema.modelos.length, clases: resultado }, null, 1));
for (const [k, v] of Object.entries(resultado)) console.log(`${String(v.modelos.length).padStart(3)} · ${v.nombre}: ${v.modelos.map((m) => m.nombre).join(', ')}`);
