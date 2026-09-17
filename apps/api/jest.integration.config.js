/**
 * Pruebas de integración: PostgreSQL 16 real (Testcontainers) con migraciones aplicadas por
 * `prisma migrate deploy`, igual que en el despliegue. Ver test/integration/README.md.
 */
module.exports = {
  rootDir: '../..',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/test/integration/**/*.int-spec.ts'],
  globalSetup: '<rootDir>/test/integration/global-setup.ts',
  globalTeardown: '<rootDir>/test/integration/global-teardown.ts',
  testTimeout: 120000,
  transform: { '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/apps/api/tsconfig.json' }] },
};
