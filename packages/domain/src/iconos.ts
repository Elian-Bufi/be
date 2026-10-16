/**
 * La familia de íconos de BE, como datos: cada ícono es una lista de formas sobre un lienzo de 24 × 24.
 * El website y la APK los dibujan con su propio componente (`Icono`), así cada dibujo está escrito una sola vez.
 * Qué simboliza cada uno y dónde va: `EVIDENCIA/ESCRITORIO-AMABLE/diseno/iconos/CATALOGO.md`.
 *
 * Se escribió el 2026-10-10 desde el taller de diseño, que comprobó cada dibujo punto por punto contra su original
 * (WP-ESCRITORIO-AMABLE, E-04). Desde entonces **este archivo es la fuente:** un dibujo se cambia acá, y
 * `iconos.test.ts` cuida las reglas de la familia (un solo trazo, lo único lleno son puntos, nada que califique).
 * La APK todavía dibuja los suyos: unificarla es otro paquete.
 */

/** El lado del lienzo y el grosor del trazo de toda la familia. */
export const LIENZO_DE_ICONO = 24;
export const GROSOR_DE_ICONO = 1.75;

/**
 * Una forma de un ícono. Todas van con trazo, sin relleno, con extremos y uniones redondeados; solo el círculo
 * `lleno` se pinta entero y sin trazo (son los puntos). `guiones` es el patrón de una línea discontinua y `giro`,
 * una rotación escrita como en SVG (`rotate(grados x y)`).
 */
export type FormaDeIcono =
  | { readonly forma: 'trazo'; readonly d: string; readonly guiones?: string }
  | { readonly forma: 'circulo'; readonly cx: number; readonly cy: number; readonly r: number; readonly lleno?: true; readonly guiones?: string }
  | { readonly forma: 'rectangulo'; readonly x: number; readonly y: number; readonly ancho: number; readonly alto: number; readonly radio: number }
  | { readonly forma: 'elipse'; readonly cx: number; readonly cy: number; readonly rx: number; readonly ry: number; readonly giro?: string }
  | { readonly forma: 'grupo'; readonly giro: string; readonly formas: readonly FormaDeIcono[] };

export type GrupoDeIcono = 'Áreas' | 'Vistas' | 'Nutrición' | 'Entrenamiento' | 'Antropometría' | 'Hechos' | 'Estados' | 'Datos' | 'Gráficos' | 'Acciones' | 'Navegación' | 'Casillas' | 'Sistema' | 'Personas' | 'Biblioteca';

export interface DefinicionDeIcono {
  readonly grupo: GrupoDeIcono;
  readonly formas: readonly FormaDeIcono[];
}

/** Los 105 nombres, en el orden del catálogo. */
export const NOMBRES_DE_ICONO = [
  // Áreas
  'nutricion', 'entrenamiento', 'antropometria', 'informacion',
  // Vistas
  'resumen', 'linea-de-tiempo', 'analizar',
  // Nutrición
  'calorias', 'carbohidratos', 'grasas', 'proteinas', 'fibra', 'comida', 'alimento', 'opciones', 'a-mano',
  // Entrenamiento
  'carga', 'repetir', 'series', 'volumen', 'descanso', 'salteada',
  // Antropometría
  'peso', 'pliegue', 'perimetro', 'talla',
  // Hechos
  'hito', 'plan', 'borrador', 'objetivo', 'revision', 'reloj', 'protocolo', 'seguimiento', 'comparar', 'etapa', 'rango', 'activar', 'aplicar', 'desvio',
  // Estados
  'cargado-otro-dia', 'corregido', 'anulado', 'sin-confirmar', 'distinto',
  // Datos
  'medido', 'reportado', 'calculado', 'estimado', 'subtotal', 'hoy', 'origen', 'tabla', 'lista', 'texto',
  // Gráficos
  'separadas', 'juntas', 'cambio-relativo', 'referencia', 'acercar', 'ver-todo',
  // Acciones
  'solicitar', 'actualizar', 'buscar', 'filtros', 'calendario', 'guardar', 'descargar', 'duplicar', 'ver', 'salir', 'ordenar', 'mas', 'cerrar', 'menu',
  // Navegación
  'derecha', 'izquierda', 'abajo', 'arriba', 'volver', 'abrir',
  // Casillas
  'tilde', 'guion',
  // Sistema
  'ayuda', 'pregunta', 'info', 'aviso', 'sin-datos', 'sin-conexion', 'espera', 'servicio', 'candado', 'acceso', 'oculto', 'cargando', 'claro', 'azul-noche',
  // Personas
  'persona', 'asesorados', 'solicitud', 'pendientes',
  // Biblioteca
  'plantillas', 'habitual', 'receta', 'imagen',
] as const;
export type NombreDeIcono = (typeof NOMBRES_DE_ICONO)[number];

export const ICONOS: Readonly<Record<NombreDeIcono, DefinicionDeIcono>> = {
  nutricion: { grupo: 'Áreas', formas: [{ forma: 'trazo', d: 'M12 8.2c-1.6-1.4-4.4-1.6-6 .2-2 2.2-1.5 6.4.6 9.4 1.5 2.1 3.3 3.1 5.4 2.1 2.1 1 3.9 0 5.4-2.1 2.1-3 2.6-7.2.6-9.4-1.6-1.8-4.4-1.6-6-.2z' }, { forma: 'trazo', d: 'M12 8.2c0-2 .6-3.6 1.8-4.7' }, { forma: 'trazo', d: 'M13.4 5.6c1.6-.9 3.4-.8 4.4.2-1.2 1.2-3 1.4-4.4.6' }] },
  entrenamiento: { grupo: 'Áreas', formas: [{ forma: 'trazo', d: 'M8 12h8' }, { forma: 'trazo', d: 'M6.5 7.5v9M17.5 7.5v9' }, { forma: 'trazo', d: 'M3.5 9.5v5M20.5 9.5v5' }] },
  antropometria: { grupo: 'Áreas', formas: [{ forma: 'trazo', d: 'M3 8.5h18v7H3z' }, { forma: 'trazo', d: 'M7 8.5v3M11 8.5v4M15 8.5v3M19 8.5v2' }] },
  informacion: { grupo: 'Áreas', formas: [{ forma: 'rectangulo', x: 5.5, y: 5, ancho: 13, alto: 15.5, radio: 2.5 }, { forma: 'trazo', d: 'M9.5 3.5h5v3h-5zM9 12h6M9 16h4' }] },
  resumen: { grupo: 'Vistas', formas: [{ forma: 'rectangulo', x: 3.5, y: 3.5, ancho: 7.5, alto: 9.5, radio: 2 }, { forma: 'rectangulo', x: 13, y: 3.5, ancho: 7.5, alto: 5.5, radio: 2 }, { forma: 'rectangulo', x: 13, y: 11.5, ancho: 7.5, alto: 9, radio: 2 }, { forma: 'rectangulo', x: 3.5, y: 15.5, ancho: 7.5, alto: 5, radio: 2 }] },
  'linea-de-tiempo': { grupo: 'Vistas', formas: [{ forma: 'circulo', cx: 6.5, cy: 7, r: 2.25 }, { forma: 'circulo', cx: 6.5, cy: 16, r: 2.25 }, { forma: 'trazo', d: 'M6.5 9.25v4.5M6.5 18.25v2.25M6.5 3.5v1.25M12 7h8.5M12 16h5.5' }] },
  analizar: { grupo: 'Vistas', formas: [{ forma: 'trazo', d: 'M4 4v16h16' }, { forma: 'trazo', d: 'M7.5 15.5l4-5 3.5 3 4.5-6.5' }] },
  calorias: { grupo: 'Nutrición', formas: [{ forma: 'trazo', d: 'M13.5 3L5 13.5h6L10.5 21 19 10.5h-6z' }] },
  carbohidratos: { grupo: 'Nutrición', formas: [{ forma: 'grupo', giro: 'rotate(35 12 12)', formas: [{ forma: 'trazo', d: 'M12 21.5V4.5' }, { forma: 'trazo', d: 'M12 17.5q-2.9-.5-3.1-3.6M12 17.5q2.9-.5 3.1-3.6M12 13.3q-2.9-.5-3.1-3.6M12 13.3q2.9-.5 3.1-3.6M12 9.1q-2.9-.5-3.1-3.6M12 9.1q2.9-.5 3.1-3.6' }] }] },
  grasas: { grupo: 'Nutrición', formas: [{ forma: 'trazo', d: 'M12 3c-2 0-3.2 1.7-3.6 3.9-.3 1.7-1.6 2.9-2.3 4.6A6.4 6.4 0 0 0 12 20.5a6.4 6.4 0 0 0 5.9-9c-.7-1.7-2-2.9-2.3-4.6C15.2 4.7 14 3 12 3z' }, { forma: 'circulo', cx: 12, cy: 14, r: 2.6 }] },
  proteinas: { grupo: 'Nutrición', formas: [{ forma: 'grupo', giro: 'rotate(45 12 12)', formas: [{ forma: 'trazo', d: 'M10.7 15.1c0-1.2-.6-2.1-1.6-3-1.3-1.2-1.9-2.2-1.9-3.7A4.8 4.8 0 0 1 12 4.3a4.8 4.8 0 0 1 4.8 4.1c0 1.5-.6 2.5-1.9 3.7-1 .9-1.6 1.8-1.6 3' }, { forma: 'trazo', d: 'M10.7 15.1v1.9a1.9 1.9 0 1 0 1.3 2.6 1.9 1.9 0 1 0 1.3-2.6v-1.9' }] }] },
  fibra: { grupo: 'Nutrición', formas: [{ forma: 'trazo', d: 'M19.5 4.5C10 5 5.2 10.5 6 18c7.5.8 13-4 13.5-13.5z' }, { forma: 'trazo', d: 'M4 20l9-9' }] },
  comida: { grupo: 'Nutrición', formas: [{ forma: 'trazo', d: 'M7 3.5v17M4.5 3.5V8a2.5 2.5 0 0 0 5 0V3.5' }, { forma: 'trazo', d: 'M17 20.5v-17c-2.4 1.6-3.5 4.6-3.5 8.5H17' }] },
  alimento: { grupo: 'Nutrición', formas: [{ forma: 'trazo', d: 'M3.5 10.8h17c0 3.9-2.6 7-6.2 7.8H9.7C6.1 17.8 3.5 14.7 3.5 10.8z' }, { forma: 'trazo', d: 'M5.4 10.8c.2-1.9 1.5-3.2 3.3-3.2.7 0 1.3.2 1.8.5.7-1.4 2-2.3 3.6-2.3 1.8 0 3.3 1.2 3.8 2.9.5 0 .9.8.9 2.1' }] },
  opciones: { grupo: 'Nutrición', formas: [{ forma: 'rectangulo', x: 7, y: 5, ancho: 10, alto: 14, radio: 2.2 }, { forma: 'trazo', d: 'M3.5 8v8M20.5 8v8' }] },
  'a-mano': { grupo: 'Nutrición', formas: [{ forma: 'rectangulo', x: 3, y: 6.5, ancho: 18, alto: 11, radio: 2.5 }, { forma: 'trazo', d: 'M7.5 14h9' }, { forma: 'circulo', cx: 7, cy: 10.3, r: 1, lleno: true }, { forma: 'circulo', cx: 10.3, cy: 10.3, r: 1, lleno: true }, { forma: 'circulo', cx: 13.7, cy: 10.3, r: 1, lleno: true }, { forma: 'circulo', cx: 17, cy: 10.3, r: 1, lleno: true }] },
  carga: { grupo: 'Entrenamiento', formas: [{ forma: 'trazo', d: 'M8.6 9h6.8a1.5 1.5 0 0 1 1.46 1.16l2 8.5A1.5 1.5 0 0 1 17.4 20.5H6.6a1.5 1.5 0 0 1-1.46-1.84l2-8.5A1.5 1.5 0 0 1 8.6 9z' }, { forma: 'circulo', cx: 12, cy: 6, r: 2.5 }] },
  repetir: { grupo: 'Entrenamiento', formas: [{ forma: 'trazo', d: 'M17 3.5l3 3-3 3M4 11V9.5a3 3 0 0 1 3-3h13' }, { forma: 'trazo', d: 'M7 20.5l-3-3 3-3M20 13v1.5a3 3 0 0 1-3 3H4' }] },
  series: { grupo: 'Entrenamiento', formas: [{ forma: 'trazo', d: 'M6 6v12M10 6v12M14 6v12M18 6v12M3.5 15.5l17-7' }] },
  volumen: { grupo: 'Entrenamiento', formas: [{ forma: 'rectangulo', x: 7.5, y: 4.5, ancho: 9, alto: 4, radio: 1.6 }, { forma: 'rectangulo', x: 5.5, y: 10, ancho: 13, alto: 4, radio: 1.6 }, { forma: 'rectangulo', x: 3.5, y: 15.5, ancho: 17, alto: 4, radio: 1.6 }] },
  descanso: { grupo: 'Entrenamiento', formas: [{ forma: 'circulo', cx: 12, cy: 13.5, r: 7 }, { forma: 'trazo', d: 'M12 13.5V10M9.5 3.5h5M12 3.5v3' }] },
  salteada: { grupo: 'Entrenamiento', formas: [{ forma: 'trazo', d: 'M3.5 15a7.5 7.5 0 0 1 15 0' }, { forma: 'trazo', d: 'M15.2 12.4l3.3 2.6 2.2-3.6' }, { forma: 'circulo', cx: 11, cy: 18, r: 1.4, lleno: true }] },
  peso: { grupo: 'Antropometría', formas: [{ forma: 'rectangulo', x: 4, y: 4.5, ancho: 16, alto: 16, radio: 3 }, { forma: 'trazo', d: 'M8 10a4.3 4.3 0 0 1 8 0z' }, { forma: 'trazo', d: 'M12 10l1.3-2.4' }] },
  pliegue: { grupo: 'Antropometría', formas: [{ forma: 'trazo', d: 'M3.5 18.5H9c0-5.5.3-10 3-10s3 4.5 3 10h5.5' }, { forma: 'trazo', d: 'M4.5 8.2L7.3 11l-2.8 2.8' }, { forma: 'trazo', d: 'M19.5 8.2L16.7 11l2.8 2.8' }] },
  perimetro: { grupo: 'Antropometría', formas: [{ forma: 'circulo', cx: 9.5, cy: 10, r: 6.5 }, { forma: 'circulo', cx: 9.5, cy: 10, r: 1.6 }, { forma: 'trazo', d: 'M9.5 16.5H21M21 14.6v3.8M16.6 16.5v-2.2M19 16.5v-1.6' }] },
  talla: { grupo: 'Antropometría', formas: [{ forma: 'rectangulo', x: 13.5, y: 3.5, ancho: 6.5, alto: 17, radio: 1.8 }, { forma: 'trazo', d: 'M13.5 7.5H16M13.5 12H17M13.5 16.5H16' }, { forma: 'trazo', d: 'M6.5 5v14M4 7.5L6.5 5 9 7.5M4 16.5L6.5 19 9 16.5' }] },
  hito: { grupo: 'Hechos', formas: [{ forma: 'trazo', d: 'M6 21V4M6 4.5h11.5l-2.5 4 2.5 4H6' }] },
  plan: { grupo: 'Hechos', formas: [{ forma: 'trazo', d: 'M7 3.5h7.5L19 8v11.5a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-15a1 1 0 0 1 1-1z' }, { forma: 'trazo', d: 'M14.5 3.5V8H19M9.5 12.5H15M9.5 16H15' }] },
  borrador: { grupo: 'Hechos', formas: [{ forma: 'trazo', d: 'M11.5 20.5H7a1 1 0 0 1-1-1v-15a1 1 0 0 1 1-1h7.5L19 8v2.5' }, { forma: 'trazo', d: 'M14.5 3.5V8H19' }, { forma: 'trazo', d: 'M14.5 20.5l.8-3.3 4.5-4.5 2.5 2.5-4.5 4.5z' }] },
  objetivo: { grupo: 'Hechos', formas: [{ forma: 'circulo', cx: 12, cy: 12, r: 8.5 }, { forma: 'circulo', cx: 12, cy: 12, r: 4.5 }, { forma: 'circulo', cx: 12, cy: 12, r: 1.1, lleno: true }] },
  revision: { grupo: 'Hechos', formas: [{ forma: 'rectangulo', x: 5.5, y: 5, ancho: 13, alto: 15.5, radio: 2.5 }, { forma: 'trazo', d: 'M9.5 3.5h5v3h-5zM9 13.5l2.2 2.2 4-4.2' }] },
  reloj: { grupo: 'Hechos', formas: [{ forma: 'circulo', cx: 12, cy: 12, r: 8.5 }, { forma: 'trazo', d: 'M12 7.5V12l3 2' }] },
  protocolo: { grupo: 'Hechos', formas: [{ forma: 'trazo', d: 'M4 8.5h15M15.5 5L19 8.5 15.5 12' }, { forma: 'trazo', d: 'M20 15.5H5M8.5 12L5 15.5 8.5 19' }] },
  seguimiento: { grupo: 'Hechos', formas: [{ forma: 'trazo', d: 'M9.75 14.25l4.5-4.5' }, { forma: 'trazo', d: 'M11 6.6l1.3-1.3a4.1 4.1 0 0 1 5.8 5.8l-1.5 1.4' }, { forma: 'trazo', d: 'M13 17.4l-1.3 1.3a4.1 4.1 0 0 1-5.8-5.8l1.5-1.4' }] },
  comparar: { grupo: 'Hechos', formas: [{ forma: 'rectangulo', x: 3.5, y: 5, ancho: 17, alto: 14, radio: 2.5 }, { forma: 'trazo', d: 'M12 5v14M6.5 14.5h3M14.5 9.5h3' }] },
  etapa: { grupo: 'Hechos', formas: [{ forma: 'trazo', d: 'M4 12h16M4 7.5v9M20 7.5v9' }] },
  rango: { grupo: 'Hechos', formas: [{ forma: 'trazo', d: 'M4 4.5h16M4 19.5h16' }, { forma: 'trazo', d: 'M12 7.6v8.8M9.8 9.8L12 7.6l2.2 2.2M9.8 14.2l2.2 2.2 2.2-2.2' }] },
  activar: { grupo: 'Hechos', formas: [{ forma: 'trazo', d: 'M12 3.5v8' }, { forma: 'trazo', d: 'M7 6.6a7.5 7.5 0 1 0 10 0' }] },
  aplicar: { grupo: 'Hechos', formas: [{ forma: 'trazo', d: 'M10 3.5h5L19.5 8v11.5a1 1 0 0 1-1 1H10' }, { forma: 'trazo', d: 'M15 3.5V8h4.5' }, { forma: 'trazo', d: 'M3.5 13.5H12M9 10.5l3 3-3 3' }] },
  desvio: { grupo: 'Hechos', formas: [{ forma: 'trazo', d: 'M3.5 17.5h17', guiones: '2.2 2.6' }, { forma: 'trazo', d: 'M3.5 17.5H8c3 0 4.5-1.5 4.5-4.5V6' }, { forma: 'trazo', d: 'M9 9.5L12.5 6 16 9.5' }] },
  'cargado-otro-dia': { grupo: 'Estados', formas: [{ forma: 'trazo', d: 'M4.5 12A7.5 7.5 0 1 0 6.7 6.7' }, { forma: 'trazo', d: 'M6.7 2.6v4.1h4.1' }, { forma: 'trazo', d: 'M12 8.2V12l2.6 1.7' }] },
  corregido: { grupo: 'Estados', formas: [{ forma: 'trazo', d: 'M4 20l.9-4.4L15.9 4.6a2.1 2.1 0 0 1 3 0l.5.5a2.1 2.1 0 0 1 0 3L8.4 19.1z' }, { forma: 'trazo', d: 'M14 6.5L17.5 10' }] },
  anulado: { grupo: 'Estados', formas: [{ forma: 'circulo', cx: 12, cy: 12, r: 8.5 }, { forma: 'trazo', d: 'M6 18L18 6' }] },
  'sin-confirmar': { grupo: 'Estados', formas: [{ forma: 'circulo', cx: 12, cy: 12, r: 8.5, guiones: '3.1 3.57' }, { forma: 'circulo', cx: 12, cy: 12, r: 1.1, lleno: true }] },
  distinto: { grupo: 'Estados', formas: [{ forma: 'trazo', d: 'M5.5 9h13M5.5 15h13M15.5 5l-7 14' }] },
  medido: { grupo: 'Datos', formas: [{ forma: 'trazo', d: 'M3.5 16.5a8.5 8.5 0 0 1 17 0z' }, { forma: 'trazo', d: 'M12 16.5l3.6-5.2' }] },
  reportado: { grupo: 'Datos', formas: [{ forma: 'trazo', d: 'M5 5h14a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 19 17h-7l-4.5 3.5V17H5a1.5 1.5 0 0 1-1.5-1.5v-9A1.5 1.5 0 0 1 5 5z' }] },
  calculado: { grupo: 'Datos', formas: [{ forma: 'rectangulo', x: 5.5, y: 3.5, ancho: 13, alto: 17, radio: 2.5 }, { forma: 'trazo', d: 'M9 7.75h6' }, { forma: 'circulo', cx: 9, cy: 12.2, r: 1, lleno: true }, { forma: 'circulo', cx: 12, cy: 12.2, r: 1, lleno: true }, { forma: 'circulo', cx: 15, cy: 12.2, r: 1, lleno: true }, { forma: 'circulo', cx: 9, cy: 16.2, r: 1, lleno: true }, { forma: 'circulo', cx: 12, cy: 16.2, r: 1, lleno: true }, { forma: 'circulo', cx: 15, cy: 16.2, r: 1, lleno: true }] },
  estimado: { grupo: 'Datos', formas: [{ forma: 'trazo', d: 'M4.5 9.5c2.5-2.6 5-2.6 7.5 0s5 2.6 7.5 0M4.5 15.5c2.5-2.6 5-2.6 7.5 0s5 2.6 7.5 0' }] },
  subtotal: { grupo: 'Datos', formas: [{ forma: 'trazo', d: 'M3 12h5M16 12h5' }, { forma: 'circulo', cx: 12, cy: 12, r: 4 }] },
  hoy: { grupo: 'Datos', formas: [{ forma: 'rectangulo', x: 4, y: 5.5, ancho: 16, alto: 15, radio: 2.5 }, { forma: 'trazo', d: 'M4 10.5h16M8.5 3.5v4M15.5 3.5v4' }, { forma: 'circulo', cx: 12, cy: 15.5, r: 1.7, lleno: true }] },
  origen: { grupo: 'Datos', formas: [{ forma: 'trazo', d: 'M12.5 20.5H7a1 1 0 0 1-1-1v-15a1 1 0 0 1 1-1h7.5L19 8v3' }, { forma: 'trazo', d: 'M14.5 3.5V8H19' }, { forma: 'circulo', cx: 16.25, cy: 16.25, r: 3 }, { forma: 'trazo', d: 'M18.5 18.5l2.5 2.5' }] },
  tabla: { grupo: 'Datos', formas: [{ forma: 'rectangulo', x: 3.5, y: 5, ancho: 17, alto: 14, radio: 2.5 }, { forma: 'trazo', d: 'M3.5 9.75h17M3.5 14.4h17M9.5 5v14' }] },
  lista: { grupo: 'Datos', formas: [{ forma: 'trazo', d: 'M9 6.5h11M9 12h11M9 17.5h11' }, { forma: 'circulo', cx: 4.75, cy: 6.5, r: 1.2, lleno: true }, { forma: 'circulo', cx: 4.75, cy: 12, r: 1.2, lleno: true }, { forma: 'circulo', cx: 4.75, cy: 17.5, r: 1.2, lleno: true }] },
  texto: { grupo: 'Datos', formas: [{ forma: 'trazo', d: 'M5 6h14M5 10.5h14M5 15h14M5 19.5h8' }] },
  separadas: { grupo: 'Gráficos', formas: [{ forma: 'trazo', d: 'M3.5 12h17' }, { forma: 'trazo', d: 'M4.5 8l3.5-3 4 2.5 3.5-3 4 2' }, { forma: 'trazo', d: 'M4.5 19l3.5-2.5 4 1.5 3.5-3.5 4 3' }] },
  juntas: { grupo: 'Gráficos', formas: [{ forma: 'trazo', d: 'M4 4v16h16' }, { forma: 'trazo', d: 'M7.5 11l3.5-4 3.5 2.5 4.5-4.5' }, { forma: 'trazo', d: 'M7.5 16.5l3.5-2.5 3.5 1 4.5-3.5' }] },
  'cambio-relativo': { grupo: 'Gráficos', formas: [{ forma: 'trazo', d: 'M3.5 13h4M10 13h4M16.5 13h4' }, { forma: 'circulo', cx: 6, cy: 8.7, r: 1.7, lleno: true }, { forma: 'circulo', cx: 12, cy: 17.8, r: 1.7, lleno: true }, { forma: 'circulo', cx: 18, cy: 5.4, r: 1.7, lleno: true }] },
  referencia: { grupo: 'Gráficos', formas: [{ forma: 'circulo', cx: 12, cy: 5.5, r: 2 }, { forma: 'trazo', d: 'M12 7.5v13M8.5 11h7M5 14c.2 3.7 3.1 6.5 7 6.5s6.8-2.8 7-6.5' }] },
  acercar: { grupo: 'Gráficos', formas: [{ forma: 'circulo', cx: 11, cy: 11, r: 6.5 }, { forma: 'trazo', d: 'M16 16l4.5 4.5M11 8.2v5.6M8.2 11h5.6' }] },
  'ver-todo': { grupo: 'Gráficos', formas: [{ forma: 'trazo', d: 'M3.5 6.5v11M20.5 6.5v11M7 12h10M9.5 9.5L7 12l2.5 2.5M14.5 9.5L17 12l-2.5 2.5' }] },
  solicitar: { grupo: 'Acciones', formas: [{ forma: 'trazo', d: 'M20.5 3.5l-6 17-3.6-7.4-7.4-3.6z' }, { forma: 'trazo', d: 'M20.5 3.5l-9.6 9.6' }] },
  actualizar: { grupo: 'Acciones', formas: [{ forma: 'trazo', d: 'M19.5 12A7.5 7.5 0 1 1 17.3 6.7' }, { forma: 'trazo', d: 'M17.3 2.6v4.1h-4.1' }] },
  buscar: { grupo: 'Acciones', formas: [{ forma: 'circulo', cx: 11, cy: 11, r: 6.5 }, { forma: 'trazo', d: 'M16 16l4.5 4.5' }] },
  filtros: { grupo: 'Acciones', formas: [{ forma: 'trazo', d: 'M4 8h8.5M17.5 8H20M4 16h2.5M11.5 16H20' }, { forma: 'circulo', cx: 15, cy: 8, r: 2.5 }, { forma: 'circulo', cx: 9, cy: 16, r: 2.5 }] },
  calendario: { grupo: 'Acciones', formas: [{ forma: 'rectangulo', x: 4, y: 5.5, ancho: 16, alto: 15, radio: 2.5 }, { forma: 'trazo', d: 'M4 10.5h16M8.5 3.5v4M15.5 3.5v4' }] },
  guardar: { grupo: 'Acciones', formas: [{ forma: 'trazo', d: 'M7 4h10a1 1 0 0 1 1 1v15.5l-6-4-6 4V5a1 1 0 0 1 1-1z' }] },
  descargar: { grupo: 'Acciones', formas: [{ forma: 'trazo', d: 'M12 4v11.5M7 10.5l5 5 5-5M5 20h14' }] },
  duplicar: { grupo: 'Acciones', formas: [{ forma: 'rectangulo', x: 8.5, y: 8.5, ancho: 12, alto: 12, radio: 2.5 }, { forma: 'trazo', d: 'M15.5 8.5V6A2.5 2.5 0 0 0 13 3.5H6A2.5 2.5 0 0 0 3.5 6v7A2.5 2.5 0 0 0 6 15.5h2.5' }] },
  ver: { grupo: 'Acciones', formas: [{ forma: 'trazo', d: 'M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z' }, { forma: 'circulo', cx: 12, cy: 12, r: 2.75 }] },
  salir: { grupo: 'Acciones', formas: [{ forma: 'trazo', d: 'M10 4.5H6A1.5 1.5 0 0 0 4.5 6v12A1.5 1.5 0 0 0 6 19.5h4' }, { forma: 'trazo', d: 'M15 8l4 4-4 4M19 12H9.5' }] },
  ordenar: { grupo: 'Acciones', formas: [{ forma: 'trazo', d: 'M8 19.5v-15M4.5 8L8 4.5 11.5 8' }, { forma: 'trazo', d: 'M16 4.5v15M12.5 16l3.5 3.5 3.5-3.5' }] },
  mas: { grupo: 'Acciones', formas: [{ forma: 'trazo', d: 'M12 5.5v13M5.5 12h13' }] },
  cerrar: { grupo: 'Acciones', formas: [{ forma: 'trazo', d: 'M6.5 6.5l11 11M17.5 6.5l-11 11' }] },
  menu: { grupo: 'Acciones', formas: [{ forma: 'circulo', cx: 5.5, cy: 12, r: 1.5, lleno: true }, { forma: 'circulo', cx: 12, cy: 12, r: 1.5, lleno: true }, { forma: 'circulo', cx: 18.5, cy: 12, r: 1.5, lleno: true }] },
  derecha: { grupo: 'Navegación', formas: [{ forma: 'trazo', d: 'M9.5 6l6 6-6 6' }] },
  izquierda: { grupo: 'Navegación', formas: [{ forma: 'trazo', d: 'M14.5 6l-6 6 6 6' }] },
  abajo: { grupo: 'Navegación', formas: [{ forma: 'trazo', d: 'M6 9.5l6 6 6-6' }] },
  arriba: { grupo: 'Navegación', formas: [{ forma: 'trazo', d: 'M6 14.5l6-6 6 6' }] },
  volver: { grupo: 'Navegación', formas: [{ forma: 'trazo', d: 'M20 12H4.5M10.5 6l-6 6 6 6' }] },
  abrir: { grupo: 'Navegación', formas: [{ forma: 'trazo', d: 'M7.5 16.5l9-9M9.5 7.5h7v7' }] },
  tilde: { grupo: 'Casillas', formas: [{ forma: 'trazo', d: 'M5 12.5l4.5 4.5L19 7.5' }] },
  guion: { grupo: 'Casillas', formas: [{ forma: 'trazo', d: 'M6 12h12' }] },
  ayuda: { grupo: 'Sistema', formas: [{ forma: 'trazo', d: 'M12 6.75C10 5.4 7.5 4.9 4 5.2v13.3c3.5-.3 6 .2 8 1.5 2-1.3 4.5-1.8 8-1.5V5.2c-3.5-.3-6 .2-8 1.55z' }, { forma: 'trazo', d: 'M12 6.75V20' }] },
  pregunta: { grupo: 'Sistema', formas: [{ forma: 'circulo', cx: 12, cy: 12, r: 8.5 }, { forma: 'trazo', d: 'M9.6 9.7a2.5 2.5 0 1 1 3.6 2.2c-.8.5-1.2 1-1.2 1.9' }, { forma: 'circulo', cx: 12, cy: 16.7, r: 1, lleno: true }] },
  info: { grupo: 'Sistema', formas: [{ forma: 'circulo', cx: 12, cy: 12, r: 8.5 }, { forma: 'trazo', d: 'M12 11.2v5.3' }, { forma: 'circulo', cx: 12, cy: 7.9, r: 1, lleno: true }] },
  aviso: { grupo: 'Sistema', formas: [{ forma: 'trazo', d: 'M12 4.5l8.7 15H3.3z' }, { forma: 'trazo', d: 'M12 10.5v4' }, { forma: 'circulo', cx: 12, cy: 16.9, r: 1, lleno: true }] },
  'sin-datos': { grupo: 'Sistema', formas: [{ forma: 'trazo', d: 'M3.5 13.5l3-8.5h11l3 8.5v5A1.5 1.5 0 0 1 19 20H5a1.5 1.5 0 0 1-1.5-1.5z' }, { forma: 'trazo', d: 'M3.5 13.5h5l1.2 2.5h4.6l1.2-2.5h5' }] },
  'sin-conexion': { grupo: 'Sistema', formas: [{ forma: 'trazo', d: 'M7.2 18.5h9.6a4 4 0 0 0 .7-7.94A6 6 0 0 0 6 9.6a4.5 4.5 0 0 0 1.2 8.9z' }, { forma: 'trazo', d: 'M4 3.5l16 17' }] },
  espera: { grupo: 'Sistema', formas: [{ forma: 'trazo', d: 'M6.5 3.5h11M6.5 20.5h11' }, { forma: 'trazo', d: 'M8 3.5v3c0 2.2 4 3.4 4 5.5s-4 3.3-4 5.5v3' }, { forma: 'trazo', d: 'M16 3.5v3c0 2.2-4 3.4-4 5.5s4 3.3 4 5.5v3' }] },
  servicio: { grupo: 'Sistema', formas: [{ forma: 'rectangulo', x: 3.5, y: 4, ancho: 17, alto: 7, radio: 2 }, { forma: 'rectangulo', x: 3.5, y: 13, ancho: 17, alto: 7, radio: 2 }, { forma: 'circulo', cx: 7.5, cy: 7.5, r: 1.1, lleno: true }, { forma: 'circulo', cx: 7.5, cy: 16.5, r: 1.1, lleno: true }, { forma: 'trazo', d: 'M12 7.5h4.5M12 16.5h4.5' }] },
  candado: { grupo: 'Sistema', formas: [{ forma: 'rectangulo', x: 5.5, y: 10.5, ancho: 13, alto: 10, radio: 2.5 }, { forma: 'trazo', d: 'M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5' }] },
  acceso: { grupo: 'Sistema', formas: [{ forma: 'rectangulo', x: 5.5, y: 10.5, ancho: 13, alto: 10, radio: 2.5 }, { forma: 'trazo', d: 'M8.5 10.5V8a3.5 3.5 0 0 1 6.7-1.4' }] },
  oculto: { grupo: 'Sistema', formas: [{ forma: 'trazo', d: 'M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z' }, { forma: 'circulo', cx: 12, cy: 12, r: 2.75 }, { forma: 'trazo', d: 'M4.5 3.5l15 17' }] },
  cargando: { grupo: 'Sistema', formas: [{ forma: 'trazo', d: 'M12 3.5A8.5 8.5 0 1 1 3.5 12' }] },
  claro: { grupo: 'Sistema', formas: [{ forma: 'circulo', cx: 12, cy: 12, r: 4 }, { forma: 'trazo', d: 'M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6L7 7M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4' }] },
  'azul-noche': { grupo: 'Sistema', formas: [{ forma: 'trazo', d: 'M20 14.6A8.5 8.5 0 0 1 9.4 4 8.5 8.5 0 1 0 20 14.6z' }] },
  persona: { grupo: 'Personas', formas: [{ forma: 'circulo', cx: 12, cy: 8, r: 4 }, { forma: 'trazo', d: 'M4.5 20.5a7.5 7.5 0 0 1 15 0' }] },
  asesorados: { grupo: 'Personas', formas: [{ forma: 'circulo', cx: 9, cy: 8.5, r: 3.5 }, { forma: 'trazo', d: 'M2.5 20a6.5 6.5 0 0 1 13 0' }, { forma: 'trazo', d: 'M15.5 5.2a3.5 3.5 0 0 1 0 6.6M18 14.3a6.5 6.5 0 0 1 3.5 5.7' }] },
  solicitud: { grupo: 'Personas', formas: [{ forma: 'circulo', cx: 9.5, cy: 8, r: 4 }, { forma: 'trazo', d: 'M2.5 20.5a7 7 0 0 1 14 0' }, { forma: 'trazo', d: 'M18.5 8.5v6M15.5 11.5h6' }] },
  pendientes: { grupo: 'Personas', formas: [{ forma: 'rectangulo', x: 3.5, y: 4.5, ancho: 5.5, alto: 5.5, radio: 1.4 }, { forma: 'rectangulo', x: 3.5, y: 14, ancho: 5.5, alto: 5.5, radio: 1.4 }, { forma: 'trazo', d: 'M12.5 7.25h8M12.5 16.75h8' }] },
  plantillas: { grupo: 'Biblioteca', formas: [{ forma: 'trazo', d: 'M12 3.5l8.5 4.5-8.5 4.5L3.5 8z' }, { forma: 'trazo', d: 'M3.5 12.25l8.5 4.5 8.5-4.5M3.5 16.5L12 21l8.5-4.5' }] },
  habitual: { grupo: 'Biblioteca', formas: [{ forma: 'trazo', d: 'M8.5 3.5h7M9.7 3.5L9 9.8 6 13h12l-3-3.2-.7-6.3M12 13v7.5' }] },
  receta: { grupo: 'Biblioteca', formas: [{ forma: 'trazo', d: 'M5 11h14v5.5a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3z' }, { forma: 'trazo', d: 'M3 11h18M9.5 7.5c0-1.5 1.5-1.5 1.5-3M14 7.5c0-1.5 1.5-1.5 1.5-3' }] },
  imagen: { grupo: 'Biblioteca', formas: [{ forma: 'rectangulo', x: 3.5, y: 5, ancho: 17, alto: 14, radio: 2.5 }, { forma: 'circulo', cx: 8.5, cy: 10, r: 1.6 }, { forma: 'trazo', d: 'M4 17.5l5-5 4 4 3-3 4.5 4.5' }] },
};
