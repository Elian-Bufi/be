/**
 * UF-06 de WP-USO-FINAL (DL-169; 08 §18 y §19; 09 v0.12 §14 y §15): los derechos de la persona sobre sus datos.
 * - **Descargar lo suyo** (API-EXP-01 y 02): un archivo con lo del titular, sin datos de terceros salvo la referencia mínima
 *   de sus profesionales (su identificador y su nombre profesional). Se pide, queda registrado con su vencimiento, y se
 *   descarga por una ruta firmada que vence a los 15 minutos (08 §21). El archivo no se guarda: se arma al descargarlo.
 * - **Pedir el acceso, la rectificación o la supresión** (API-RGT-01 a 03): un pedido con su plazo, que Administración
 *   resuelve con una respuesta para la persona y un fundamento propio (API-ADM-16 y 17).
 * - **Los plazos** son los de la Ley 25.326 (art. 14: diez días corridos para el acceso; art. 16: cinco días hábiles para
 *   rectificar o suprimir), **a confirmar con la asesoría**. Los días hábiles se cuentan de lunes a viernes; los feriados
 *   no se descuentan todavía.
 */
import { z } from 'zod';
import { IdOpaco, Instante } from './contratos';
import { PaginaSchema } from './contratos-vinculo';

const FechaCivil = z.iso.date();

/** Los derechos que se piden por BE (09 v0.12 §14: DataSubjectRequestType). */
export const TIPOS_DE_PEDIDO_DE_DERECHO = ['ACCESS', 'RECTIFICATION', 'SUPPRESSION'] as const;
export type TipoDePedidoDeDerecho = (typeof TIPOS_DE_PEDIDO_DE_DERECHO)[number];

/** Diez días corridos para el acceso (art. 14) y cinco hábiles para rectificar o suprimir (art. 16): a confirmar. */
export const PLAZO_DEL_PEDIDO: Readonly<Record<TipoDePedidoDeDerecho, { readonly dias: number; readonly habiles: boolean }>> = {
  ACCESS: { dias: 10, habiles: false },
  RECTIFICATION: { dias: 5, habiles: true },
  SUPPRESSION: { dias: 5, habiles: true },
};

/** El plazo de un pedido hecho en esa fecha civil (AAAA-MM-DD): el último día en que se tiene que resolver. */
export function plazoDelPedido(tipo: TipoDePedidoDeDerecho, fechaDelPedido: string): string {
  const { dias, habiles } = PLAZO_DEL_PEDIDO[tipo];
  const d = new Date(`${fechaDelPedido}T12:00:00Z`);
  let cuenta = 0;
  while (cuenta < dias) {
    d.setUTCDate(d.getUTCDate() + 1);
    const dia = d.getUTCDay();
    if (!habiles || (dia !== 0 && dia !== 6)) cuenta++;
  }
  return d.toISOString().slice(0, 10);
}

/** Lo que la persona escribe en su pedido: qué quiere ver, corregir o suprimir. Opcional, hasta 1000 caracteres. */
export const LARGO_MAXIMO_DE_LA_NOTA_DEL_PEDIDO = 1000;
export const LARGO_MAXIMO_DE_LA_RESPUESTA_DEL_PEDIDO = 2000;

export const CrearPedidoDeDerechoRequestSchema = z.strictObject({
  type: z.enum(TIPOS_DE_PEDIDO_DE_DERECHO),
  scope: z.strictObject({ note: z.string().max(2000).optional() }),
});
export type CrearPedidoDeDerechoRequest = z.infer<typeof CrearPedidoDeDerechoRequestSchema>;

export const ESTADOS_DEL_PEDIDO_DE_DERECHO = ['RECEIVED', 'RESOLVED', 'REJECTED'] as const;

/** Un pedido, como lo ve la persona: sin el fundamento interno de Administración. */
export const PedidoDeDerechoSchema = z.strictObject({
  requestId: IdOpaco,
  type: z.enum(TIPOS_DE_PEDIDO_DE_DERECHO),
  note: z.string().nullable(),
  state: z.enum(ESTADOS_DEL_PEDIDO_DE_DERECHO),
  createdAt: Instante,
  /** El último día del plazo (fecha civil de Buenos Aires). */
  deadline: FechaCivil,
  resolvedAt: Instante.nullable(),
  /** Lo que Administración le responde a la persona al resolverlo. */
  response: z.string().nullable(),
});
export type PedidoDeDerecho = z.infer<typeof PedidoDeDerechoSchema>;
export const PedidoDeDerechoResponseSchema = z.strictObject({ data: PedidoDeDerechoSchema });
export type PedidoDeDerechoResponse = z.infer<typeof PedidoDeDerechoResponseSchema>;
export const ListaDePedidosDeDerechoResponseSchema = z.strictObject({ data: z.array(PedidoDeDerechoSchema), page: PaginaSchema });
export type ListaDePedidosDeDerechoResponse = z.infer<typeof ListaDePedidosDeDerechoResponseSchema>;

// ─── La exportación propia ─────────────────────────────────────────────────────────────────────

export const DOMINIOS_DE_LA_EXPORTACION = ['NUTRITION', 'TRAINING', 'ANTHROPOMETRY'] as const;
export type DominioDeLaExportacion = (typeof DOMINIOS_DE_LA_EXPORTACION)[number];

/** Cuánto vale una exportación pedida: dentro de ese tiempo se piden rutas de descarga nuevas. */
export const VIGENCIA_DE_LA_EXPORTACION_MS = 24 * 60 * 60 * 1000;
/** Cuánto vale una ruta de descarga (08 §21: 15 minutos como máximo). */
export const VIGENCIA_DE_LA_DESCARGA_SEGUNDOS = 15 * 60;

export const CrearExportacionRequestSchema = z.strictObject({
  scope: z.strictObject({
    domains: z.array(z.enum(DOMINIOS_DE_LA_EXPORTACION)).max(3),
    /** El 09 lo prevé; esta versión exporta todo el tiempo (`null`). */
    period: z.null(),
  }),
});
export type CrearExportacionRequest = z.infer<typeof CrearExportacionRequestSchema>;

export const ExportacionSchema = z.strictObject({
  exportId: IdOpaco,
  state: z.enum(['READY', 'EXPIRED']),
  domains: z.array(z.enum(DOMINIOS_DE_LA_EXPORTACION)),
  createdAt: Instante,
  expiresAt: Instante,
  /** La ruta firmada de la descarga (relativa a /api/v1) y cuándo vence; `null` si la exportación venció. */
  download: z.strictObject({ path: z.string().startsWith('/exports/content/'), expiresAt: Instante }).nullable(),
});
export type Exportacion = z.infer<typeof ExportacionSchema>;
export const ExportacionResponseSchema = z.strictObject({ data: ExportacionSchema });
export type ExportacionResponse = z.infer<typeof ExportacionResponseSchema>;

/** El formato del archivo descargado: la primera clave lo dice, para leerlo en otra versión. */
export const FORMATO_DE_LA_EXPORTACION = 'be-exportacion-propia/1';

// ─── Administración (API-ADM-16 y 17) ──────────────────────────────────────────────────────────

/** Un pedido como lo ve Administración: la cuenta (su correo de acceso) para contactar a la persona, nada de salud. */
export const PedidoDeDerechoAdministrativoSchema = PedidoDeDerechoSchema.extend({
  subject: z.strictObject({ identityId: IdOpaco, email: z.string().nullable() }),
  rationale: z.string().nullable(),
});
export const ConsultarPedidosDeDerechoRequestSchema = z.strictObject({
  state: z.enum(ESTADOS_DEL_PEDIDO_DE_DERECHO).optional(),
  limit: z.number().int().min(1).max(50).optional(),
  cursor: z.string().max(400).optional(),
});
export type ConsultarPedidosDeDerechoRequest = z.infer<typeof ConsultarPedidosDeDerechoRequestSchema>;
export const ListaAdministrativaDePedidosDeDerechoResponseSchema = z.strictObject({ data: z.array(PedidoDeDerechoAdministrativoSchema), page: PaginaSchema });
export type ListaAdministrativaDePedidosDeDerechoResponse = z.infer<typeof ListaAdministrativaDePedidosDeDerechoResponseSchema>;
export const ResolverPedidoDeDerechoRequestSchema = z.strictObject({
  outcome: z.enum(['RESOLVED', 'REJECTED']),
  /** Lo que recibe la persona: qué se hizo o por qué no. */
  response: z.string().max(4000),
  /** El fundamento interno: lo ve solo Administración. */
  rationale: z.string().max(2000),
});
export type ResolverPedidoDeDerechoRequest = z.infer<typeof ResolverPedidoDeDerechoRequestSchema>;
export const PedidoDeDerechoAdministrativoResponseSchema = z.strictObject({ data: PedidoDeDerechoAdministrativoSchema });
export type PedidoDeDerechoAdministrativoResponse = z.infer<typeof PedidoDeDerechoAdministrativoResponseSchema>;

// ─── Los textos (website y APK) ────────────────────────────────────────────────────────────────

export const COPY_DERECHOS = {
  titulo: 'Tus datos',
  queEs: 'Podés descargar lo que BE guarda de vos y pedir que se corrija o se suprima. Respondemos dentro de los plazos de la ley.',
  descargar: {
    titulo: 'Descargar tus datos',
    texto: 'Un archivo con tu perfil, tus vínculos y consentimientos, tus registros, los planes que recibiste, tus medidas y tus formularios. De tus profesionales va solo su nombre profesional.',
    boton: 'Descargar mis datos',
    preparando: 'Preparando el archivo…',
    listo: 'Listo: el archivo se descargó. El enlace vence a los 15 minutos.',
    /** En la APK, la descarga la hace el navegador del teléfono. */
    enElNavegador: 'Abrimos el navegador para bajar el archivo. El enlace vence a los 15 minutos.',
  },
  pedir: {
    titulo: 'Pedir algo sobre tus datos',
    tipo: 'Qué querés pedir',
    tipos: {
      ACCESS: 'Saber qué datos tiene BE de mí',
      RECTIFICATION: 'Corregir un dato',
      SUPPRESSION: 'Suprimir mis datos',
    } as Readonly<Record<TipoDePedidoDeDerecho, string>>,
    nota: 'Contanos qué necesitás (opcional)',
    notaAyuda: 'Por ejemplo, qué dato corregir. Hasta 1000 caracteres.',
    enviar: 'Enviar el pedido',
    enviando: 'Enviando…',
    enviado: (plazo: string): string => `Recibimos tu pedido. Te respondemos a más tardar el ${plazo}.`,
    supresionAyuda: 'Para suprimir todo, también podés cerrar tu cuenta. Lo que la ley obliga a conservar se conserva, y te lo decimos.',
    irAlCierre: 'Ver cómo cerrar mi cuenta',
  },
  pedidos: {
    titulo: 'Tus pedidos',
    vacio: 'Todavía no hiciste pedidos.',
    estado: { RECEIVED: 'Recibido', RESOLVED: 'Resuelto', REJECTED: 'No se pudo hacer' } as Readonly<Record<(typeof ESTADOS_DEL_PEDIDO_DE_DERECHO)[number], string>>,
    plazo: (fecha: string): string => `Plazo: ${fecha}`,
    respuesta: 'Respuesta',
  },
  plazosAConfirmar: 'Los plazos son los de la Ley 25.326 (diez días corridos para el acceso y cinco días hábiles para corregir o suprimir), a confirmar con la asesoría jurídica.',
} as const;
