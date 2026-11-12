import { Controller, Get, Header, Inject, Query } from '@nestjs/common';
import { CACHE_DEL_CANAL_DE_CONTACTO_S, type CanalDeContactoResponse } from '@be/domain';
import type { Entorno } from '../config/entorno';
import { ENTORNO } from '../config/tokens';
import { sinParametrosDeQuery } from '../http/validacion';

/**
 * UF-07 de WP-USO-FINAL (DL-169) · API-SOP-01: el canal de ayuda y contacto, las direcciones de soporte y de privacidad que
 * Dirección cargó en la configuración (`BE_CONTACTO_SOPORTE` y `BE_CONTACTO_PRIVACIDAD`), o `null` si todavía no están.
 * Pública: la piden también quien no puede entrar (la recuperación asistida) y las páginas sin sesión. No lee la base ni
 * datos de nadie, así que no audita ni consume un cupo; la respuesta se puede guardar unos minutos (es la misma para
 * todos), y un cambio de configuración se ve sin reconstruir la APK. Prefijo global /api/v1.
 */
@Controller('support/contact')
export class ContactoController {
  constructor(@Inject(ENTORNO) private readonly entorno: Entorno) {}

  /** API-SOP-01 — PUBLIC. */
  @Get()
  @Header('Cache-Control', `public, max-age=${CACHE_DEL_CANAL_DE_CONTACTO_S}`)
  consultar(@Query() query: Record<string, unknown>): CanalDeContactoResponse {
    sinParametrosDeQuery(query);
    return { data: { supportEmail: this.entorno.contacto.soporte, privacyEmail: this.entorno.contacto.privacidad } };
  }
}
