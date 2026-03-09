module.exports = {
  displayName: 'notification-service',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  coverageDirectory: '../../coverage/apps/notification-service',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  transformIgnorePatterns: ['node_modules/(?!(uuid)/)'],
  moduleFileExtensions: ['ts', 'js', 'html'],
};
