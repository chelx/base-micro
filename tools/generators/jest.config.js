const path = require('path');

module.exports = {
  displayName: 'generators',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]sx?$': [
      'ts-jest',
      { tsconfig: path.resolve(__dirname, '../../tsconfig.base.json') },
    ],
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  testMatch: ['**/*.spec.ts'],
};
