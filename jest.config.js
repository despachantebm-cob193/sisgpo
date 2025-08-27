module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  globalSetup: './__tests__/globalSetup.js',
  globalTeardown: './__tests__/teardown.js',
  setupFilesAfterEnv: [],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['json', 'lcov', 'text', 'clover'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/app.js',
    '!src/server.js',
    '!src/config/database.js',
    '!src/utils/AppError.js',
    '!src/routes/adminRoutes.js',
    '!src/middlewares/errorMiddleware.js',
    '!src/updatePassword.js' // Excluir scripts utilitários
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/__tests__/globalSetup.js',
    '/__tests__/teardown.js'
  ]
};
