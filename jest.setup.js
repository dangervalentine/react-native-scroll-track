import 'react-native-gesture-handler/jestSetup';

// Mock React Native components
jest.mock('react-native', () => {
    const RN = jest.requireActual('react-native');

    // Mock Animated
    RN.Animated.Value = jest.fn(() => ({
        setValue: jest.fn(),
        addListener: jest.fn(() => 'mock-listener-id'),
        removeListener: jest.fn(),
        interpolate: jest.fn(() => ({
            setValue: jest.fn(),
            addListener: jest.fn(() => 'mock-listener-id'),
            removeListener: jest.fn(),
        })),
    }));

    RN.Animated.event = jest.fn((config, nativeConfig) => {
        return jest.fn();
    });

    RN.Animated.timing = jest.fn(() => ({
        start: jest.fn(),
    }));

    RN.Animated.parallel = jest.fn(() => ({
        start: jest.fn(),
    }));

    return RN;
});

// Mock react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => {
    const View = require('react-native').View;

    return {
        PanGestureHandler: ({ children, onGestureEvent, onHandlerStateChange, ...props }) =>
            View({ ...props, onGestureEvent, onHandlerStateChange, children }),
        TapGestureHandler: ({ children, onHandlerStateChange, ...props }) =>
            View({ ...props, onHandlerStateChange, children }),
        State: {
            BEGAN: 1,
            ACTIVE: 2,
            END: 3,
            CANCELLED: 4,
            FAILED: 5,
            UNDETERMINED: 0,
        },
        Directions: {
            RIGHT: 1,
            LEFT: 2,
            UP: 4,
            DOWN: 8,
        },
        GestureHandlerRootView: ({ children }) => children,
    };
});

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
    const Reanimated = require('react-native-reanimated/mock');

    // Mock runOnJS
    Reanimated.runOnJS = jest.fn((fn) => fn);

    return Reanimated;
});

// Mock timers
jest.useFakeTimers();

// Global test utilities
global.mockAnimatedValue = (initialValue = 0) => {
    const listeners = [];
    let currentValue = initialValue;

    return {
        setValue: jest.fn((value) => {
            currentValue = value;
            listeners.forEach(listener => listener({ value }));
        }),
        addListener: jest.fn((listener) => {
            listeners.push(listener);
            return listeners.length - 1;
        }),
        removeListener: jest.fn((id) => {
            listeners.splice(id, 1);
        }),
        interpolate: jest.fn(() => global.mockAnimatedValue()),
        getValue: () => currentValue,
    };
};

// Mock console warnings for cleaner test output
const originalWarn = console.warn;
console.warn = (message) => {
    if (message.includes('componentWillReceiveProps') ||
        message.includes('componentWillMount') ||
        message.includes('componentWillUpdate')) {
        return;
    }
    originalWarn(message);
};
