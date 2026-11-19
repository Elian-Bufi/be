/**
 * C7 de Dirección (WP-ENTRENAMIENTO-PLANIFICACION, tramo 2) · lo escrito en la escritura rápida y todavía sin aplicar, sin
 * React. Antes vivía dentro de la línea de cada ejercicio: plegar el ejercicio, ir a otra sesión o el guardado que le daba
 * su identificador a un ejercicio nuevo (la pieza se volvía a armar) lo borraban sin decir nada, y nada lo preguntaba al
 * salir. Ahora vive en el editor, por ejercicio:
 * - **La clave es la del ejercicio:** su identificador, si ya lo tiene (`id:…`); si no, su lugar en la sesión
 *   (`pos:b0-s1-p2`). Cuando un guardado le da el identificador, lo escrito pasa a él (`lineasConLosIdentificadores`).
 * - **Lo pendiente se dice con su lugar** (`lineasPendientes`): el panel y «Antes de activar» lo listan con «Ir a…» a la
 *   línea, y no se activa sin resolverlo (aplicarlo o borrarlo); salir del editor o recargar pregunta. Se pregunta, no se
 *   pierde.
 * - Lo escrito no es parte del plan: no viaja, no se guarda y no impide guardar.
 */

/** Lo escrito sin aplicar, por ejercicio. */
export type LineasSinAplicar = Readonly<Record<string, string>>;

/** La clave de la línea de un ejercicio: por su identificador, o por su lugar en la sesión (`b0-s1`, `b0-m1-s0`). */
export const claveDeLaLinea = (sesion: string, l: number, prescriptionId: string | null | undefined): string => (prescriptionId ? `id:${prescriptionId}` : `pos:${sesion}-p${l}`);

interface Ejercicio {
  readonly prescriptionId?: string | null;
}
interface Sesion {
  readonly prescriptions: readonly Ejercicio[];
}
interface Bloque {
  readonly sessions?: readonly Sesion[] | null;
  readonly microcycles?: readonly { readonly sessions: readonly Sesion[] }[] | null;
}

/** Cada sesión con su clave (`b0-s1`, la del prefijo del editor) y su ruta (`blocks[0].sessions[1]`). */
function sesionesConClave(bloques: readonly Bloque[]): { readonly clave: string; readonly ruta: string; readonly sesion: Sesion }[] {
  return bloques.flatMap((b, i) => [
    ...(b.sessions ?? []).map((sesion, k) => ({ clave: `b${i}-s${k}`, ruta: `blocks[${i}].sessions[${k}]`, sesion })),
    ...(b.microcycles ?? []).flatMap((m, j) => m.sessions.map((sesion, k) => ({ clave: `b${i}-m${j}-s${k}`, ruta: `blocks[${i}].microcycles[${j}].sessions[${k}]`, sesion }))),
  ]);
}

/** Escribe o borra lo escrito de una clave: vacío es nada. */
export function conLaLinea(lineas: LineasSinAplicar, clave: string, texto: string): LineasSinAplicar {
  const { [clave]: _anterior, ...resto } = lineas;
  return texto.trim() === '' ? resto : { ...resto, [clave]: texto };
}

/** Lo escrito sin aplicar que todavía tiene su ejercicio, en el orden del plan, con la ruta del ejercicio. */
export function lineasPendientes(lineas: LineasSinAplicar, bloques: readonly Bloque[]): { readonly clave: string; readonly texto: string; readonly ruta: string }[] {
  return sesionesConClave(bloques).flatMap(({ clave, ruta, sesion }) =>
    sesion.prescriptions.flatMap((p, l) => {
      const k = claveDeLaLinea(clave, l, p.prescriptionId);
      const texto = lineas[k];
      return texto && texto.trim() !== '' ? [{ clave: k, texto, ruta: `${ruta}.prescriptions[${l}]` }] : [];
    }),
  );
}

/**
 * Después de adoptar un guardado (la misma estructura que se mandó, con los identificadores que puso el servidor): lo
 * escrito en un ejercicio que recién recibió su identificador pasa de su lugar a él. Lo demás queda igual.
 */
export function lineasConLosIdentificadores(lineas: LineasSinAplicar, enviados: readonly Bloque[], guardados: readonly Bloque[]): LineasSinAplicar {
  const antes = sesionesConClave(enviados);
  const despues = new Map(sesionesConClave(guardados).map((s) => [s.clave, s.sesion] as const));
  let nuevas = lineas;
  for (const { clave, sesion } of antes) {
    const guardada = despues.get(clave);
    if (!guardada || guardada.prescriptions.length !== sesion.prescriptions.length) continue;
    sesion.prescriptions.forEach((p, l) => {
      const id = guardada.prescriptions[l]?.prescriptionId;
      const deAntes = claveDeLaLinea(clave, l, p.prescriptionId);
      if (p.prescriptionId || !id || !(deAntes in nuevas)) return;
      const texto = nuevas[deAntes]!;
      nuevas = conLaLinea(conLaLinea(nuevas, deAntes, ''), claveDeLaLinea(clave, l, id), texto);
    });
  }
  return nuevas;
}

/** Los textos de la escritura rápida (C7). */
export const COPY_ESCRITURA_RAPIDA = {
  rotulo: 'Escritura rápida',
  aplicar: 'Aplicar',
  ayuda: 'Por ejemplo, 4×8-12 RIR 2 · 60 kg · 90 s. «Aplicar», o Enter, la escribe en las series de abajo.',
  sinTexto: 'Escribí algo para aplicar.',
  sinAplicar: 'Escritura rápida sin aplicar',
  pendiente: (texto: string) => `tiene escritura rápida sin aplicar («${texto.trim()}»): aplicala o borrala`,
  alSalir: 'la escritura rápida sin aplicar',
} as const;
