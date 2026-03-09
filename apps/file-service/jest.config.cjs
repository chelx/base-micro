module.exports = {
  displayName: 'file-service',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  coverageDirectory: '../../coverage/apps/file-service',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  transformIgnorePatterns: ['node_modules/(?!(uuid)/)'],
  moduleFileExtensions: ['ts', 'js', 'html'],
};
