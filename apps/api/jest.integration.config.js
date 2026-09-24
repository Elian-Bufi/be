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
  // Los worktrees de trabajo en paralelo bajo `.claude/` son copias del repo: sin esto, Jest encuentra tres
  // `package.json` con el nombre `@be/domain` y aborta por colisión de nombres. En CI el directorio no existe.
  modulePathIgnorePatterns: ['<rootDir>/.claude/'],
  transform: { '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/apps/api/tsconfig.json' }] },
};
