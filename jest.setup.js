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
        start: jest.fn((callback) => callback?.({ finished: true })),
    }));

    RN.Animated.parallel = jest.fn(() => ({
        start: jest.fn((callback) => callback?.({ finished: true })),
    }));

    return RN;
});

// Mock react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => {
    const View = require('react-native').View;

    const createdGestures = [];

    const makeGestureMock = (kind) => {
        const target = { kind, handlers: {}, config: {} };
        const gesture = new Proxy(target, {
            get(obj, prop) {
                if (typeof prop === 'symbol') return undefined;
                if (prop in obj) return obj[prop];
                return (...args) => {
                    if (prop.startsWith('on') && typeof args[0] === 'function') {
                        obj.handlers[prop] = args[0];
                    } else {
                        obj.config[prop] = args.length > 1 ? args : args[0];
                    }
                    return gesture;
                };
            },
        });
        createdGestures.push(gesture);
        return gesture;
    };

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
        // Modern gesture API: every builder method is chainable and returns the
        // same object, so the component can configure gestures freely.
        Gesture: {
            Pan: () => makeGestureMock('pan'),
            Tap: () => makeGestureMock('tap'),
            Simultaneous: (...composed) => {
                const gesture = makeGestureMock('simultaneous');
                gesture.composed = composed;
                return gesture;
            },
            /** Test helpers: every gesture built since the last __reset(). */
            __created: createdGestures,
            __reset: () => {
                createdGestures.length = 0;
            },
        },
        GestureDetector: ({ children }) => children,
    };
});

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
    const Reanimated = require('react-native-reanimated/mock');
    const { useRef } = require('react');

    // Mock runOnJS
    Reanimated.runOnJS = jest.fn((fn) => fn);

    // The stock mock hands back a new object every render, which would reset
    // any state a worklet keeps across gesture events. Persist it like the
    // real hook does.
    Reanimated.useSharedValue = (init) => {
        const ref = useRef(null);
        if (ref.current === null) ref.current = { value: init };
        return ref.current;
    };

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
