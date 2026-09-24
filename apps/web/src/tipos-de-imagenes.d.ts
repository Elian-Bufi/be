// Los tipos de las imágenes importadas (el isotipo del encabezado y de la landing). `next-env.d.ts` los trae, pero lo
// genera Next al compilar y no está versionado: sin esta referencia, el typecheck de la CI —que corre antes del
// build— no los encuentra.
/// <reference types="next/image-types/global" />
