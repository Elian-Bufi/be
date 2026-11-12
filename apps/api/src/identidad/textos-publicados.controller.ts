import { Controller, Get, Header, Param, Query } from '@nestjs/common';
import { textoPublicadoApi, versionPublicada, type TextoPublicadoResponse } from '@be/domain';
import { errores } from '../http/errores';
import { sinParametrosDeQuery } from '../http/validacion';

/** Una versión publicada no cambia nunca: se puede guardar un día. */
const CACHE_DEL_TEXTO_S = 24 * 60 * 60;

/**
 * UF-05 de WP-USO-FINAL (DL-169; UF-T57, revisión adversarial de la etapa 2) · API-ACC-09: el texto de una versión
 * publicada, por su id. La APK que se congela el 25/11 no trae las versiones que se publiquen después (siguen en
 * `textos-sin-publicar.ts`, fuera del catálogo); cuando API-ACC-07 le pide aceptar una que no tiene, la lee acá en vez de
 * pedir actualizar. Pública: los textos legales publicados no son de nadie. Lee el catálogo del servidor (el mismo que
 * sembró la base, lo exige la prueba del esquema), nunca la base ni datos de nadie; una versión sin publicar es el mismo
 * 404 que una inexistente. Prefijo global /api/v1.
 */
@Controller('legal-texts')
export class TextosPublicadosController {
  /** API-ACC-09 — PUBLIC. */
  @Get(':versionId')
  @Header('Cache-Control', `public, max-age=${CACHE_DEL_TEXTO_S}`)
  leer(@Param('versionId') versionId: string, @Query() query: Record<string, unknown>): TextoPublicadoResponse {
    sinParametrosDeQuery(query);
    const version = versionId.length <= 200 ? versionPublicada(versionId) : null;
    if (!version) throw errores.recursoNoEncontrado();
    return textoPublicadoApi(version);
  }
}
