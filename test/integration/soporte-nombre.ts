/**
 * WP-USO-FINAL · UF-01 (DL-169): una cuenta anterior, sin nombre. Desde el 2026-11-11 la API no crea cuentas así (el
 * alta exige el nombre), pero existen: son las que se crearon antes, como las de `test`. Para probar «Antes de seguir»
 * (API-ACC-07) y la referencia neutral, se arman como las armaba el alta hasta ese día (UC-P25): la identidad, su perfil
 * propio sin versiones, el control de sesión, el método LOCAL con su credencial y los tres actos del alta. Sin los
 * eventos ni la auditoría del alta, que ninguna de estas pruebas lee. Solo datos sintéticos.
 */
import type { INestApplication } from '@nestjs/common';
import { ACTOS_DEL_REGISTRO, VERSION_VIGENTE } from '@be/domain';
import type { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { CredencialesService } from '../../apps/api/src/plataforma/credenciales.service';
import { PrismaService } from '../../apps/api/src/prisma/prisma.service';
import { correoSintetico, CREDENCIAL_SINTETICA, tokenDe } from './soporte-api';
import type { Parte } from './soporte-vinculo';

export async function cuentaAnteriorSinNombre(app: INestApplication, etiqueta: string, superficie: 'WEB' | 'APK' = 'APK'): Promise<Parte> {
  const prisma = app.get(PrismaService);
  const hash = await app.get(CredencialesService).generarHash(CREDENCIAL_SINTETICA);
  const correo = correoSintetico(`anterior-${etiqueta}`);
  const id = randomUUID();
  const procedencia = { fuente: 'PROPIA', casoDeUso: 'UC-P25', operacion: 'API-ACC-01', superficie, requestId: `prueba-${randomUUID()}` } as unknown as Prisma.InputJsonValue;
  const ahora = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.identidad.create({ data: { id, autoriaDeCreacionId: id, procedencia, momentoDeOcurrencia: ahora } });
    await tx.perfilPropio.create({ data: { identidadId: id, momentoDeOcurrencia: ahora } });
    await tx.controlDeSesion.create({ data: { identidadId: id } });
    const metodo = await tx.metodoDeAcceso.create({ data: { identidadId: id, tipo: 'LOCAL', referencia: correo, procedencia, momentoDeOcurrencia: ahora } });
    await tx.credencialLocal.create({ data: { metodoDeAccesoId: metodo.id, hash } });
    const versiones = await tx.versionDeTexto.findMany({ where: { id: { in: ACTOS_DEL_REGISTRO.map((tipo) => VERSION_VIGENTE[tipo].id) } } });
    for (const version of versiones) {
      await tx.actoRegistrable.create({
        data: {
          identidadId: id,
          tipo: version.tipo as (typeof ACTOS_DEL_REGISTRO)[number],
          versionDeTextoId: version.id,
          hashDelTexto: version.hash,
          finalidad: version.finalidad,
          superficie,
          actorId: id,
          autoriaId: id,
          procedencia,
          momentoDeOcurrencia: ahora,
        },
      });
    }
  });
  return { correo, id, token: await tokenDe(app, correo, superficie) };
}
