/** Pruebas unitarias: sin base de datos ni red. */
module.exports = {
  rootDir: '.',
  testEnvironment: 'node',
  testTimeout: 30000,
  testMatch: ['<rootDir>/src/**/*.spec.ts'],
  transform: { '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }] },
};
