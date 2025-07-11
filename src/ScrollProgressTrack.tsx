import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    Animated,
    StyleSheet,
    View,
} from "react-native";
import { PanGestureHandler, State, TapGestureHandler } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';

export interface ScrollProgressTrackProps {
    inverted?: boolean;
    scrollPosition: number;
    onScrollToPosition: (position: number) => void;
    contentHeight: number;
    containerHeight: number;
    visible?: boolean;
    trackWidth?: number;
    thumbHeight?: number;
    animatedScrollPosition?: Animated.Value;
    onDragStart?: () => void;
    onDragEnd?: () => void;
    styling?: {
        thumbColor?: string;
        trackColor?: string;
        trackVisible?: boolean;
        thumbShadow?: {
            color?: string;
            opacity?: number;
            radius?: number;
            offset?: { width: number; height: number };
        };
        alwaysVisible?: boolean;
    };
}

const ScrollProgressTrack: React.FC<ScrollProgressTrackProps> = ({
    scrollPosition,
    onScrollToPosition,
    contentHeight,
    containerHeight,
    visible = true,
    trackWidth = 4,
    thumbHeight = 24,
    animatedScrollPosition,
    onDragStart,
    onDragEnd,
    inverted = false,
    styling = {},
}) => {
    const {
        thumbColor = '#00CED1',
        trackColor = '#637777',
        trackVisible = true,
        thumbShadow = {
            color: '#000000',
            opacity: 0.3,
            radius: 4,
            offset: { width: 0, height: 2 },
        },
        alwaysVisible = false,
    } = styling;

    const [isDragging, setIsDragging] = useState(false);

    const trackOpacity = useRef(new Animated.Value(0)).current;
    const thumbOpacity = useRef(new Animated.Value(0)).current;
    const dragScale = useRef(new Animated.Value(1)).current;
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
        const duration = visible ? 0 : 400;
        Animated.parallel([
            Animated.timing(trackOpacity, {
                toValue: visible ? 0.3 : 0,
                duration,
                useNativeDriver: true,
            }),
            Animated.timing(thumbOpacity, {
                toValue: visible ? 0.8 : 0,
                duration,
                useNativeDriver: true,
            }),
        ]).start();
    }, [visible]);

    const availableHeight = Math.max(100, containerHeight);
    const calculateThumbHeight = () => {
        if (contentHeight <= containerHeight) return thumbHeight;
        const ratio = containerHeight / contentHeight;
        const dynamicHeight = Math.max(thumbHeight, availableHeight * ratio);
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
            // For inverted lists, flip the position so clicking at bottom scrolls to position 0
            const position = inverted ? 1 - rawPosition : rawPosition;

            dragStartPosition.current = touchY;
            dragScale.setValue(1.1);
            thumbOpacity.setValue(1);

            runOnJS(setIsDragging)(true);
            runOnJS(onDragStart || (() => { }))();
            runOnJS(directScrollToPosition)(position);
        } else if (state === State.ACTIVE) {
            const currentTouchY = dragStartPosition.current + translationY;
            const rawPosition = Math.max(0, Math.min(1, currentTouchY / availableHeight));
            const position = inverted ? 1 - rawPosition : rawPosition;

            runOnJS(directScrollToPosition)(position);
        } else if (state === State.END || state === State.CANCELLED) {
            dragScale.setValue(1);
            thumbOpacity.setValue(visible ? 0.8 : 0);

            runOnJS(setIsDragging)(false);
            runOnJS(onDragEnd || (() => { }))();
        }
    }, [availableHeight, directScrollToPosition, visible, onDragStart, onDragEnd, dragScale, thumbOpacity, inverted]);

    const handleTapGesture = useCallback((event: any) => {
        const { state, y } = event.nativeEvent;
        if (state === State.END) {
            const rawPosition = Math.max(0, Math.min(1, y / availableHeight));
            const position = inverted ? 1 - rawPosition : rawPosition;
            onScrollToPosition(position);
        }
    }, [availableHeight, inverted, onScrollToPosition]);

    if (containerHeight < 100 || contentHeight < containerHeight) return null;

    return (
        <View style={styles.container}>
            {trackVisible && (
                <Animated.View
                    style={[
                        styles.track,
                        {
                            opacity: trackOpacity,
                            width: trackWidth,
                            height: availableHeight,
                            backgroundColor: trackColor,
                        },
                    ]}
                />
            )}
            <TapGestureHandler
                onHandlerStateChange={handleTapGesture}
                maxDist={10}
            >
                <PanGestureHandler
                    onGestureEvent={handleTrackGesture}
                    onHandlerStateChange={handleTrackGesture}
                    shouldCancelWhenOutside={false}
                    minPointers={1}
                    maxPointers={1}
                    hitSlop={{ top: 20, bottom: 20, left: 20, right: 0 }}
                >
                    <Animated.View
                        style={[
                            styles.pressableArea,
                            {
                                width: 100,
                                height: availableHeight,
                                right: -60,
                            },
                        ]}
                    >
                        <Animated.View
                            style={[
                                styles.thumb,
                                {
                                    opacity: thumbOpacity,
                                    width: trackWidth,
                                    height: currentThumbHeight,
                                    position: "absolute",
                                    right: 60 - (trackWidth / 2),
                                    transform: [
                                        { translateY: animatedThumbPosition },
                                        { scale: dragScale },
                                    ],
                                    backgroundColor: thumbColor,
                                    shadowColor: thumbShadow.color,
                                    shadowOffset: thumbShadow.offset,
                                    shadowOpacity: isDragging ? Math.min((thumbShadow.opacity || 0.3) * 1.3, 1) : (thumbShadow.opacity || 0.3),
                                    shadowRadius: isDragging ? (thumbShadow.radius || 4) * 1.5 : (thumbShadow.radius || 4),
                                },
                            ]}
                        />
                    </Animated.View>
                </PanGestureHandler>
            </TapGestureHandler>
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
        zIndex: 1000,
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
