import { Module } from '@nestjs/common';
import { ContactoController } from './contacto.controller';

/** UF-07 de WP-USO-FINAL (DL-169): el canal de ayuda y contacto (API-SOP-01), leído de la configuración. */
@Module({
  controllers: [ContactoController],
})
export class ContactoModule {}
