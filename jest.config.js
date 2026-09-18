module.exports = {
    preset: 'react-native',
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
    testRegex: '(/__tests__/.*|\\.(test|spec))\\.(ts|tsx|js)$',
    testPathIgnorePatterns: ['/node_modules/', '/lib/'],
    collectCoverageFrom: [
        'src/**/*.{ts,tsx}',
        '!src/**/*.d.ts',
        '!src/index.ts',
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html'],
    transform: {
        '^.+\\.(ts|tsx)$': 'ts-jest',
    },
    transformIgnorePatterns: [
        'node_modules/(?!(react-native|@react-native|react-native-reanimated|react-native-gesture-handler)/)',
    ],
    moduleNameMapping: {
        '^@/(.*)$': '<rootDir>/src/$1',
    },
    testEnvironment: 'jsdom',
    globals: {
        'ts-jest': {
            // Inherits tsconfig.json, but overrides jsx: the build keeps
            // "react-native" so Metro/Babel handles JSX, while ts-jest has no
            // Babel step after it and must emit plain JS itself. "react-jsx"
            // (automatic runtime) matches Metro and needs no React in scope.
            tsconfig: {
                jsx: 'react-jsx',
            },
            // Dependencies are transformed (see transformIgnorePatterns) but are
            // not ours to type-check; only report diagnostics for our own code.
            diagnostics: {
                exclude: ['**/node_modules/**'],
            },
        },
    },
};
