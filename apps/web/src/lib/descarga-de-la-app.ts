/**
 * PG-06 de WP-PULIDO-GRANDES (DL-173): bajar la app con un QR, sin pasar por GitHub. Sin React, para las pruebas
 * (TEST-PG-005).
 *
 * PG-D5 (a ratificar; rige su recomendación): cada publicación de la APK suma una copia con un nombre fijo, `be.apk`, y
 * el enlace `releases/latest/download/be.apk` sirve siempre el archivo de la última. El QR y el botón llevan ahí: al
 * archivo, no a una página en inglés. La versión y el tamaño se leen en el navegador, de la API pública de GitHub de la
 * última publicación; si no responde, o lo que responde no tiene la forma esperada, la línea no se dibuja. Nunca se
 * escribe una versión a mano: quedaría vieja con la APK siguiente.
 */

/** El archivo de la última publicación, siempre con el mismo nombre (PG-D5). */
export const APK_DE_LA_ULTIMA = 'https://github.com/Elian-Bufi/be/releases/latest/download/be.apk';
/** La lectura pública de la última publicación: sin credenciales y sin datos de quien mira. */
export const LECTURA_DE_LA_ULTIMA = 'https://api.github.com/repos/Elian-Bufi/be/releases/latest';
/** El nombre fijo de la copia que lleva cada publicación. */
export const NOMBRE_DEL_ARCHIVO = 'be.apk';
/** Cuánto se espera a GitHub antes de dejar la línea sin dibujar. */
export const ESPERA_DE_LA_LECTURA_MS = 6000;

export type MarcaDelTelefono = 'samsung' | 'motorola' | 'xiaomi';

/** Un paso de la instalación: lo que se hace y lo que se ve en la pantalla (el dibujo lo resalta). */
export interface PasoDeLaInstalacion {
  readonly texto: string;
  /** Lo que el dibujo marca, para el nombre accesible de la figura. */
  readonly enElDibujo: string;
}

export const COPY_DESCARGA = {
  titulo: 'La app para Android',
  queEs: 'La persona usa BE desde el celular: ve el plan de hoy, registra lo que hizo, sigue su evolución y administra sus vínculos.',
  escanea: 'Escaneá para bajar BE',
  conLaCamara: 'Apuntá la cámara del teléfono al código: el archivo baja directo.',
  bajar: 'Bajar BE',
  enEstaCompu: 'O bajá el archivo en esta compu',
  /** La versión y el tamaño, en una línea: salen de la última publicación, nunca escritos a mano. */
  version: (version: string, tamano: string) => `Versión ${version} · ${tamano}`,
  etiquetaDelQr: `Código QR para bajar BE. Lleva a ${APK_DE_LA_ULTIMA}`,
  fueraDeGooglePlay: 'Se instala fuera de Google Play: la primera vez, Android te pide permiso para instalar apps de otras fuentes.',
  pasos: 'Cómo darle permiso, en tres pasos',
  tuTelefono: 'Tu teléfono',
  marcas: { samsung: 'Samsung', motorola: 'Motorola', xiaomi: 'Xiaomi' } satisfies Record<MarcaDelTelefono, string>,
  paso: (n: number) => `Paso ${n}`,
  otraMarca: 'Con otra marca, los pasos son parecidos: buscá «Instalar apps desconocidas» y permitíselo al navegador.',
} as const;

/** Los tres pasos de cada marca, en castellano y con los nombres que muestra cada una. */
export const PASOS_DE_LA_INSTALACION: Readonly<Record<MarcaDelTelefono, readonly [PasoDeLaInstalacion, PasoDeLaInstalacion, PasoDeLaInstalacion]>> = {
  samsung: [
    { texto: 'Cuando termine de bajar, tocá «be.apk» en el aviso de la descarga o abrilo desde «Mis archivos».', enElDibujo: 'el aviso de la descarga' },
    { texto: 'Si el teléfono lo frena, tocá «Ajustes» y activá «Permitir desde esta fuente».', enElDibujo: 'el interruptor «Permitir desde esta fuente»' },
    { texto: 'Volvé y tocá «Instalar». Si Play Protect pregunta, tocá «Más detalles» e «Instalar de todos modos».', enElDibujo: 'el botón «Instalar»' },
  ],
  motorola: [
    { texto: 'Cuando termine de bajar, tocá «be.apk» en el aviso de la descarga de Chrome.', enElDibujo: 'el aviso de la descarga' },
    { texto: 'Tocá «Configuración» y activá «Permitir de esta fuente».', enElDibujo: 'el interruptor «Permitir de esta fuente»' },
    { texto: 'Volvé y tocá «Instalar». Si Play Protect pregunta, tocá «Más detalles» e «Instalar de todos modos».', enElDibujo: 'el botón «Instalar»' },
  ],
  xiaomi: [
    { texto: 'Cuando termine de bajar, abrí «be.apk» desde «Descargas» o desde el aviso de la descarga.', enElDibujo: 'el aviso de la descarga' },
    { texto: 'En «Instalar apps desconocidas», tocá «Configuración» y activá «Permitir de esta fuente».', enElDibujo: 'el interruptor «Permitir de esta fuente»' },
    { texto: 'Volvé y tocá «Instalar». Si el teléfono la analiza antes, esperá a que termine y seguí.', enElDibujo: 'el botón «Instalar»' },
  ],
};

/** La versión y el tamaño de la última publicación, listos para la línea; `null` si no se pueden leer. */
export interface DatosDeLaUltima {
  readonly version: string;
  readonly tamano: string;
}

const ETIQUETA = /^be-apk-(\d+\.\d+\.\d+(?:-[0-9A-Za-z.]+)?)$/;

/**
 * «85 MB»: el tamaño como lo dice Android al bajar (megabytes de mil kilobytes), sin decimales desde los 10 MB y con
 * uno, con coma, por debajo.
 */
export function tamanoEnPalabras(bytes: number): string {
  const mb = bytes / 1_000_000;
  if (mb >= 10) return `${Math.round(mb)} MB`;
  return `${(Math.round(mb * 10) / 10).toString().replace('.', ',')} MB`;
}

/**
 * Lo que dice la lectura pública de la última publicación, si tiene la forma esperada: una etiqueta `be-apk-x.y.z` y la
 * copia `be.apk` con su tamaño. Cualquier otra cosa da `null`, y la línea no se dibuja: es preferible no decir la
 * versión a decir una que no es la del archivo que baja el QR.
 */
export function datosDeLaUltima(respuesta: unknown): DatosDeLaUltima | null {
  if (!respuesta || typeof respuesta !== 'object') return null;
  const r = respuesta as { tag_name?: unknown; assets?: unknown };
  const m = typeof r.tag_name === 'string' ? ETIQUETA.exec(r.tag_name) : null;
  if (!m || !Array.isArray(r.assets)) return null;
  const archivo = r.assets.find((a): a is { name: string; size: number } => !!a && typeof a === 'object' && (a as { name?: unknown }).name === NOMBRE_DEL_ARCHIVO);
  if (!archivo || typeof archivo.size !== 'number' || !Number.isFinite(archivo.size) || archivo.size <= 0) return null;
  return { version: m[1]!, tamano: tamanoEnPalabras(archivo.size) };
}
