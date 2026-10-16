// Borra y vuelve a crear la base LOCAL de estas herramientas (por omisión be_test_dashboard en :55442). Nunca otra.
import { REPO } from '../rutas.mjs';
import { createRequire } from 'node:module';

const BASE = new URL(process.env.BE_E2E_DATABASE_URL ?? 'postgresql://be_test:be_test@localhost:55442/be_test_dashboard');
if (!['localhost', '127.0.0.1'].includes(BASE.hostname)) throw new Error('Guardia: la base no es local. Abortado.');
const nombre = BASE.pathname.slice(1);
if (!/^be_test_[a-z0-9_]+$/.test(nombre)) throw new Error('Guardia: solo bases be_test_* de prueba.');
const { PrismaClient } = createRequire(`${REPO}/apps/api/`)('@prisma/client');
const servidor = new URL(BASE.href);
servidor.pathname = '/postgres';
const prisma = new PrismaClient({ datasources: { db: { url: servidor.href } } });
try {
  await prisma.$executeRawUnsafe(`DROP DATABASE IF EXISTS "${nombre}" WITH (FORCE)`);
  await prisma.$executeRawUnsafe(`CREATE DATABASE "${nombre}"`);
  console.log(`base ${nombre} vacía`);
} finally {
  await prisma.$disconnect();
}
