import 'react-native-gesture-handler/jestSetup';

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

// Reanimated runs for real: shared values, animated styles, reactions and
// timing animations all work under Jest, and animations advance with the fake
// timers below.
require('react-native-reanimated').setUpTests();

// Mock timers
jest.useFakeTimers();

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
