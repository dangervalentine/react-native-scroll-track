import { useCallback, useRef } from "react";
import { Animated } from "react-native";

/**
* Hook for creating smooth animated scroll position values
* Use this in parent components for optimal scroll tracking performance
*/
export const useAnimatedScrollPosition = () => {
    const animatedValue = useRef(new Animated.Value(0)).current;

    /**
     * Returns an onScroll handler that updates the animated value
     * @param contentHeight - Total scrollable content height
     * @param containerHeight - Visible container height
     */
    const createScrollHandler = useCallback((contentHeight: number, containerHeight: number) => {
        const maxScrollDistance = Math.max(0, contentHeight - containerHeight);

        return Animated.event(
            [{ nativeEvent: { contentOffset: { y: animatedValue } } }],
            {
                useNativeDriver: false, // Required for layout calculations
                listener: (event: any) => {
                    // Optional: Add any additional scroll handling here
                    // The animated value is automatically updated by Animated.event
                }
            }
        );
    }, [animatedValue]);

    /**
     * Returns normalized scroll position (0-1) as an animated value
     */
    const getNormalizedScrollPosition = useCallback((contentHeight: number, containerHeight: number) => {
        const maxScrollDistance = Math.max(1, contentHeight - containerHeight);

        return animatedValue.interpolate({
            inputRange: [0, maxScrollDistance],
            outputRange: [0, 1],
            extrapolate: 'clamp',
        });
    }, [animatedValue]);

    /**
     * Manually set the animated scroll value (useful for programmatic scrolling)
     * @param value - The new scroll offset value
     */
    const setScrollValue = useCallback((value: number) => {
        animatedValue.setValue(value);
    }, [animatedValue]);

    return {
        createScrollHandler,
        getNormalizedScrollPosition,
        rawScrollValue: animatedValue,
        setScrollValue,
    };
};
