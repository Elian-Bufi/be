/**
 * Medición de rendimiento de la cartera (API-CAR-01), opcional. No es parte de la CI: su nombre no termina en
 * `.int-spec.ts`. Usa el mismo arnés que la integración (PostgreSQL 16 real, migraciones con `migrate deploy`), así que
 * corre contra un contenedor o contra `TEST_DATABASE_URL` en localhost, nunca contra una base remota.
 * Ver EVIDENCIA/RENDIMIENTO-CARTERA/LEEME.md.
 */
module.exports = {
  rootDir: '../..',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/test/rendimiento/**/*.rendimiento.ts'],
  globalSetup: '<rootDir>/test/integration/global-setup.ts',
  globalTeardown: '<rootDir>/test/integration/global-teardown.ts',
  testTimeout: 3_600_000,
  modulePathIgnorePatterns: ['<rootDir>/.claude/'],
  transform: { '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/apps/api/tsconfig.json' }] },
};
