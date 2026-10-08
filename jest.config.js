module.exports = {
    preset: '@react-native/jest-preset',
    resolver: 'react-native-worklets/jest/resolver',
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
    // only *.test.* / *.spec.* are suites; helpers and .d.ts under __tests__ are not
    testRegex: '\\.(test|spec)\\.(ts|tsx|js)$',
    testPathIgnorePatterns: ['/node_modules/', '/lib/'],
    collectCoverageFrom: [
        'src/**/*.{ts,tsx}',
        '!src/**/*.d.ts',
        '!src/index.ts',
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html'],
    transformIgnorePatterns: [
        'node_modules/(?!(react-native|@react-native|react-native-reanimated|react-native-worklets|react-native-gesture-handler)/)',
    ],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
    },
    testEnvironment: 'node',
};
