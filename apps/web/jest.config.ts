import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts', 'tsx'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.(ts|tsx)$',
  transform: {
    '^.+\\.(t|j)sx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
  transformIgnorePatterns: ['/node_modules/(?!(jose)/)'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testEnvironment: 'jsdom',
  collectCoverageFrom: ['middleware.ts', 'lib/auth/**/*.ts', 'components/shared/error-state.tsx', 'components/shared/not-found-state.tsx'],
};

export default config;
