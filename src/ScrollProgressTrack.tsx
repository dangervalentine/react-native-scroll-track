import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    Animated,
    StyleSheet,
    View,
} from "react-native";
import { PanGestureHandler, State, TapGestureHandler } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';

export interface ScrollProgressTrackProps {
    alwaysVisible?: boolean;
    animatedScrollPosition?: Animated.Value;
    containerHeight: number;
    contentHeight: number;
    disableGestures?: boolean;
    hitSlop?: number;
    inverted?: boolean;
    onDragStart?: () => void;
    onDragEnd?: () => void;
    onPressStart?: () => void;
    onPressEnd?: () => void;
    onScrollToPosition: (position: number) => void;
    /**
     * @deprecated Use `trackWidth` in the in the styling object instead. This will be removed in the next major version.
     */
    trackWidth?: number;
    thumbHeight?: number;
    scrollPosition: number;
    styling?: {
        /**
         * @deprecated Use `alwaysVisible` in the parent prop (outside of the styling object) instead. This will be removed in the next major version.
         */
        alwaysVisible?: boolean;
        trackWidth?: number;
        thumbColor?: string;
        trackColor?: string;
        trackVisible?: boolean;
        trackOpacity?: number;
        thumbOpacity?: number;
        thumbBorderRadius?: number;
        zIndex?: number;
        thumbShadow?: {
            color?: string;
            opacity?: number;
            radius?: number;
            offset?: { width: number; height: number };
        };
    };
    visible?: boolean;
}

const ScrollProgressTrack: React.FC<ScrollProgressTrackProps> = ({
    alwaysVisible = false,
    animatedScrollPosition,
    containerHeight,
    contentHeight,
    disableGestures = false,
    hitSlop = 36,
    inverted = false,
    onDragEnd,
    onDragStart,
    onPressEnd,
    onPressStart,
    onScrollToPosition,
    scrollPosition,
    styling = {},
    thumbHeight,
    trackWidth,
    visible = true,
}) => {
    const {
        thumbBorderRadius = 0,
        thumbColor = '#00CED1',
        thumbOpacity = 0.8,
        trackColor = '#637777',
        trackOpacity = 0.3,
        thumbShadow = {
            color: '#000000',
            opacity: 0.3,
            radius: 4,
            offset: { width: 0, height: 2 },
        },
        trackVisible = true,
        zIndex = 1000,
    } = styling;

    const trackWidthProp = styling.trackWidth ?? trackWidth ?? 4;
    const alwaysVisibleProp = alwaysVisible ?? styling.alwaysVisible ?? false;

    const [isDragging, setIsDragging] = useState(false);
    const [isPressed, setIsPressed] = useState(false);

    const trackOpacityValue = useRef(new Animated.Value(0)).current;
    const thumbOpacityValue = useRef(new Animated.Value(0)).current;
    const internalScrollPosition = useRef(new Animated.Value(scrollPosition)).current;

    useEffect(() => {
        if (!animatedScrollPosition) {
            Animated.timing(internalScrollPosition, {
                toValue: scrollPosition,
                duration: 0,
                useNativeDriver: false,
            }).start();
        }
    }, [scrollPosition, animatedScrollPosition]);

    useEffect(() => {
        const targetTrackOpacity = alwaysVisibleProp || visible ? trackOpacity : 0;
        const targetThumbOpacity = alwaysVisibleProp || visible ? thumbOpacity : 0;
        // Skip fade animation during any press interaction (drag or tap)
        const duration = alwaysVisibleProp || isPressed ? 0 : 400;

        Animated.parallel([
            Animated.timing(trackOpacityValue, {
                toValue: targetTrackOpacity,
                duration,
                useNativeDriver: true,
            }),
            Animated.timing(thumbOpacityValue, {
                toValue: targetThumbOpacity,
                duration,
                useNativeDriver: true,
            }),
        ]).start();
    }, [alwaysVisibleProp, visible, trackOpacity, thumbOpacity, isPressed]);

    const availableHeight = Math.max(100, containerHeight);
    const calculateThumbHeight = () => {
        if (contentHeight <= containerHeight) return 0;
        const ratio = containerHeight / contentHeight;
        const dynamicHeight = availableHeight * ratio;
        return Math.min(dynamicHeight, availableHeight * 0.8);
    };

    const currentThumbHeight = calculateThumbHeight();
    const maxThumbPosition = Math.max(0, availableHeight - currentThumbHeight);
    const activeScrollPosition = animatedScrollPosition || internalScrollPosition;
    const scrollRange = Math.max(1, contentHeight - containerHeight);

    const animatedThumbPosition = activeScrollPosition.interpolate({
        inputRange: animatedScrollPosition ? [0, scrollRange] : [0, 1],
        outputRange: inverted ? [maxThumbPosition, 0] : [0, maxThumbPosition],
        extrapolate: 'clamp',
    });

    const dragStartPosition = useRef(0);
    const currentScrollValue = useRef(0);

    useEffect(() => {
        if (animatedScrollPosition) {
            const listener = animatedScrollPosition.addListener(({ value }) => {
                currentScrollValue.current = value;
            });
            return () => animatedScrollPosition.removeListener(listener);
        } else {
            currentScrollValue.current = scrollPosition * scrollRange;
        }
    }, [animatedScrollPosition, scrollPosition, scrollRange]);

    const directScrollToPosition = useCallback((position: number) => {
        onScrollToPosition(position);
    }, [onScrollToPosition]);

    const handleTrackGesture = useCallback((event: any) => {
        'worklet';
        const { translationY, y, state } = event.nativeEvent;

        if (state === State.BEGAN) {
            const touchY = y;
            const rawPosition = Math.max(0, Math.min(1, touchY / availableHeight));
            const position = inverted ? 1 - rawPosition : rawPosition;

            dragStartPosition.current = touchY;
            thumbOpacityValue.setValue(1);

            runOnJS(setIsDragging)(true);
            runOnJS(setIsPressed)(true);
            runOnJS(onDragStart || (() => { }))();
            runOnJS(onPressStart || (() => { }))();
            runOnJS(directScrollToPosition)(position);
        } else if (state === State.ACTIVE) {
            const currentTouchY = dragStartPosition.current + translationY;
            const rawPosition = Math.max(0, Math.min(1, currentTouchY / availableHeight));
            const position = inverted ? 1 - rawPosition : rawPosition;

            runOnJS(directScrollToPosition)(position);
        } else if (state === State.END || state === State.CANCELLED) {
            thumbOpacityValue.setValue(visible ? thumbOpacity : 0);

            runOnJS(setIsDragging)(false);
            runOnJS(setIsPressed)(false);
            runOnJS(onDragEnd || (() => { }))();
            runOnJS(onPressEnd || (() => { }))();
        }
    }, [availableHeight, directScrollToPosition, visible, thumbOpacity, onDragStart, onDragEnd, thumbOpacityValue, inverted, onPressStart, onPressEnd]);

    const handleTapGesture = useCallback((event: any) => {
        const { state, y } = event.nativeEvent;
        if (state === State.BEGAN) {
            setIsPressed(true);
            onPressStart?.();
        } else if (state === State.END) {
            const rawPosition = Math.max(0, Math.min(1, y / availableHeight));
            const position = inverted ? 1 - rawPosition : rawPosition;
            onScrollToPosition(position);
            setIsPressed(false);
            onPressEnd?.();
        } else if (state === State.CANCELLED || state === State.FAILED) {
            setIsPressed(false);
            onPressEnd?.();
        }
    }, [availableHeight, inverted, onScrollToPosition, onPressStart, onPressEnd]);

    if (containerHeight < 100 || contentHeight <= containerHeight) return null;

    const Thumb = (
        <Animated.View
            style={[
                styles.thumb,
                {
                    opacity: thumbOpacityValue,
                    width: trackWidthProp,
                    height: currentThumbHeight,
                    position: "absolute",
                    right: 0 - trackWidthProp / 2,
                    transform: [
                        { translateY: animatedThumbPosition },
                    ],
                    backgroundColor: thumbColor,
                    borderRadius: thumbBorderRadius,
                    shadowColor: thumbShadow.color,
                    shadowOffset: thumbShadow.offset,
                    shadowOpacity: isDragging ? Math.min((thumbShadow.opacity || 0.3) * 1.3, 1) : (thumbShadow.opacity || 0.3),
                    shadowRadius: isDragging ? (thumbShadow.radius || 4) * 1.5 : (thumbShadow.radius || 4),
                },
            ]}
        />
    );

    return (
        <View style={[styles.container, { zIndex }]}>
            {trackVisible && (
                <Animated.View
                    style={[styles.track, {
                        opacity: trackOpacityValue,
                        width: trackWidthProp,
                        height: availableHeight,
                        backgroundColor: trackColor,
                    }]}
                />
            )}
            {disableGestures ? (
                <Animated.View style={[styles.pressableArea, { height: availableHeight }]}>
                    {Thumb}
                </Animated.View>
            ) : (
                <TapGestureHandler onHandlerStateChange={handleTapGesture} maxDist={10}>
                    <PanGestureHandler
                        onGestureEvent={handleTrackGesture}
                        onHandlerStateChange={handleTrackGesture}
                        shouldCancelWhenOutside={false}
                        minPointers={1}
                        maxPointers={1}
                        hitSlop={hitSlop}
                    >
                        <Animated.View style={[styles.pressableArea, { height: availableHeight }]}>
                            {Thumb}
                        </Animated.View>
                    </PanGestureHandler>
                </TapGestureHandler>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        right: 0,
        top: 0,
        bottom: 0,
        alignItems: "center",
    },
    track: {
        position: "absolute",
    },
    pressableArea: {
        position: "absolute",
        justifyContent: "flex-start",
        alignItems: "center",
        right: 0,
    },
    thumb: {
        position: "absolute",
        elevation: 4,
    },
});

export default ScrollProgressTrack;
