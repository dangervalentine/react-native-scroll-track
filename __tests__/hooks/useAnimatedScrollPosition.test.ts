import { renderHook, act } from '@testing-library/react-hooks';
import { Animated } from 'react-native';
import { useAnimatedScrollPosition } from '../../src/hooks/useAnimatedScrollPosition';

describe('useAnimatedScrollPosition', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Hook initialization', () => {
        it('should initialize with default values', () => {
            const { result } = renderHook(() => useAnimatedScrollPosition());

            expect(result.current.createScrollHandler).toBeDefined();
            expect(result.current.getNormalizedScrollPosition).toBeDefined();
            expect(result.current.rawScrollValue).toBeDefined();
            expect(result.current.setScrollValue).toBeDefined();
            expect(typeof result.current.createScrollHandler).toBe('function');
            expect(typeof result.current.getNormalizedScrollPosition).toBe('function');
            expect(typeof result.current.setScrollValue).toBe('function');
        });

        it('should create a stable animated value instance', () => {
            const { result, rerender } = renderHook(() => useAnimatedScrollPosition());

            const firstValue = result.current.rawScrollValue;
            rerender();
            const secondValue = result.current.rawScrollValue;

            expect(firstValue).toBe(secondValue);
        });
    });

    describe('createScrollHandler', () => {
        it('should create a scroll handler function', () => {
            const { result } = renderHook(() => useAnimatedScrollPosition());

            const handler = result.current.createScrollHandler(1000, 500);

            expect(handler).toBeDefined();
            expect(typeof handler).toBe('function');
            expect(Animated.event).toHaveBeenCalledWith(
                [{ nativeEvent: { contentOffset: { y: expect.any(Object) } } }],
                expect.objectContaining({
                    useNativeDriver: false,
                    listener: expect.any(Function),
                })
            );
        });

        it('should handle different content and container heights', () => {
            const { result } = renderHook(() => useAnimatedScrollPosition());

            const handler1 = result.current.createScrollHandler(2000, 800);
            const handler2 = result.current.createScrollHandler(500, 400);

            expect(handler1).toBeDefined();
            expect(handler2).toBeDefined();
            expect(Animated.event).toHaveBeenCalledTimes(2);
        });

        it('should create different handlers for different parameters', () => {
            const { result } = renderHook(() => useAnimatedScrollPosition());

            const handler1 = result.current.createScrollHandler(1000, 500);
            const handler2 = result.current.createScrollHandler(1000, 500);

            // Should create new handlers each time
            expect(handler1).not.toBe(handler2);
        });
    });

    describe('getNormalizedScrollPosition', () => {
        it('should return interpolated animated value', () => {
            const { result } = renderHook(() => useAnimatedScrollPosition());

            const normalizedValue = result.current.getNormalizedScrollPosition(1000, 500);

            expect(normalizedValue).toBeDefined();
            expect(result.current.rawScrollValue.interpolate).toHaveBeenCalledWith({
                inputRange: [0, 500], // maxScrollDistance = 1000 - 500 = 500
                outputRange: [0, 1],
                extrapolate: 'clamp',
            });
        });

        it('should handle edge case where content equals container height', () => {
            const { result } = renderHook(() => useAnimatedScrollPosition());

            const normalizedValue = result.current.getNormalizedScrollPosition(500, 500);

            expect(result.current.rawScrollValue.interpolate).toHaveBeenCalledWith({
                inputRange: [0, 1], // maxScrollDistance = Math.max(1, 500 - 500) = 1
                outputRange: [0, 1],
                extrapolate: 'clamp',
            });
        });

        it('should handle edge case where content is smaller than container', () => {
            const { result } = renderHook(() => useAnimatedScrollPosition());

            const normalizedValue = result.current.getNormalizedScrollPosition(300, 500);

            expect(result.current.rawScrollValue.interpolate).toHaveBeenCalledWith({
                inputRange: [0, 1], // maxScrollDistance = Math.max(1, 300 - 500) = 1
                outputRange: [0, 1],
                extrapolate: 'clamp',
            });
        });
    });

    describe('setScrollValue', () => {
        it('should manually set the animated value', () => {
            const { result } = renderHook(() => useAnimatedScrollPosition());
            const mockSetValue = jest.fn();

            // Mock the setValue method
            result.current.rawScrollValue.setValue = mockSetValue;

            act(() => {
                result.current.setScrollValue(250);
            });

            expect(mockSetValue).toHaveBeenCalledWith(250);
        });

        it('should handle zero value', () => {
            const { result } = renderHook(() => useAnimatedScrollPosition());
            const mockSetValue = jest.fn();

            result.current.rawScrollValue.setValue = mockSetValue;

            act(() => {
                result.current.setScrollValue(0);
            });

            expect(mockSetValue).toHaveBeenCalledWith(0);
        });

        it('should handle negative values', () => {
            const { result } = renderHook(() => useAnimatedScrollPosition());
            const mockSetValue = jest.fn();

            result.current.rawScrollValue.setValue = mockSetValue;

            act(() => {
                result.current.setScrollValue(-50);
            });

            expect(mockSetValue).toHaveBeenCalledWith(-50);
        });

        it('should handle large values', () => {
            const { result } = renderHook(() => useAnimatedScrollPosition());
            const mockSetValue = jest.fn();

            result.current.rawScrollValue.setValue = mockSetValue;

            act(() => {
                result.current.setScrollValue(10000);
            });

            expect(mockSetValue).toHaveBeenCalledWith(10000);
        });
    });

    describe('Function stability', () => {
        it('should maintain function references across rerenders', () => {
            const { result, rerender } = renderHook(() => useAnimatedScrollPosition());

            const firstRenderFunctions = {
                createScrollHandler: result.current.createScrollHandler,
                getNormalizedScrollPosition: result.current.getNormalizedScrollPosition,
                setScrollValue: result.current.setScrollValue,
            };

            rerender();

            const secondRenderFunctions = {
                createScrollHandler: result.current.createScrollHandler,
                getNormalizedScrollPosition: result.current.getNormalizedScrollPosition,
                setScrollValue: result.current.setScrollValue,
            };

            expect(firstRenderFunctions.createScrollHandler).toBe(secondRenderFunctions.createScrollHandler);
            expect(firstRenderFunctions.getNormalizedScrollPosition).toBe(secondRenderFunctions.getNormalizedScrollPosition);
            expect(firstRenderFunctions.setScrollValue).toBe(secondRenderFunctions.setScrollValue);
        });
    });
});
