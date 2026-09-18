/**
 * Test-only globals installed by jest.setup.js.
 */
declare global {
    /** Builds a stand-in for an Animated.Value that records listeners. */
    function mockAnimatedValue(initialValue?: number): {
        setValue: (value: number) => void;
        addListener: (listener: (state: { value: number }) => void) => number;
        removeListener: (id: number) => void;
        interpolate: (...args: any[]) => any;
        getValue: () => number;
    };
}

export {};
