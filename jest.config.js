module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/*.spec.ts'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['lcov', 'text', 'text-summary'],
  reporters: [
  'default',
  ['jest-html-reporters', {
    publicPath: './test-report',
    filename: 'report.html',
    openReport: false,
    inlineSource: true, // ← todo el JS/CSS queda dentro del HTML
  }],
],
  moduleNameMapper: {
    '^~/(.*)$': '<rootDir>/src/$1',
  },
};