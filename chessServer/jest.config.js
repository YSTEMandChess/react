module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  // Suppress verbose output
  verbose: false,
  // Only show output for failed tests
  silent: false,
  // Suppress console output (handled in setup file)
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js']
};
