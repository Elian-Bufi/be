/**
 * Pruebas de la lógica pura de la APK (sin React Native): node y ts-jest, con el jest del monorepo.
 * Uso: cd apps/mobile && npx jest --runInBand (después de construir @be/domain, que se lee desde dist).
 */
module.exports = {
  rootDir: '.',
  testEnvironment: 'node',
  testTimeout: 30000,
  testMatch: ['<rootDir>/src/**/*.test.ts'],
  // La configuración de Expo (`module: preserve`, `moduleResolution: bundler`) es para Metro; acá se compila a CommonJS.
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: { module: 'commonjs', moduleResolution: 'node', esModuleInterop: true, strict: true, target: 'es2022', skipLibCheck: true, types: ['jest'] } }],
  },
};
