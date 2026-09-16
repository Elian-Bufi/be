import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Conexión perezosa: el proceso arranca aunque la base no esté disponible, para que
 * /health/live responda y /health/ready informe 503 DB_UNAVAILABLE (07 §30).
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
