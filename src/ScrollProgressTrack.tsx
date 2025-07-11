import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    View,
    StyleSheet,
    Animated,
} from "react-native";
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';



export interface ScrollProgressTrackProps {
    /** Current scroll position (0 to 1) */
    scrollPosition: number;
    /** Callback when user taps on track to scroll */
    onScrollToPosition: (position: number) => void;
    /** Total content height */
    contentHeight: number;
    /** Visible container height */
    containerHeight: number;
    /** Whether the track should be visible */
    visible?: boolean;
    /** Track width */
    trackWidth?: number;
    /** Thumb height */
    thumbHeight?: number;
    /** Optional animated scroll position for smoother tracking */
    animatedScrollPosition?: Animated.Value;
    /** Callback when drag starts */
    onDragStart?: () => void;
    /** Callback when drag ends */
    onDragEnd?: () => void;
    /** Styling configuration */
    styling?: {
        /** Color of the scroll thumb */
        thumbColor?: string;
        /** Color of the track background */
        trackColor?: string;
        /** Whether the track background is visible */
        trackVisible?: boolean;
        /** Shadow configuration for the thumb */
        thumbShadow?: {
            color?: string;
            opacity?: number;
            radius?: number;
            offset?: { width: number; height: number };
        };
        /** Whether the track should always be visible (no auto-hide) */
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
    styling = {},
}) => {
    // Default styling values
    const {
        thumbColor = '#00CED1', // Default cyan
        trackColor = '#637777', // Default gray
        trackVisible = true,
        thumbShadow = {
            color: '#000000',
            opacity: 0.3,
            radius: 4,
            offset: { width: 0, height: 2 },
        },
        alwaysVisible = false, // Default to false
    } = styling;

    const [isDragging, setIsDragging] = useState(false);

    // Animation values
    const trackOpacity = useRef(new Animated.Value(0)).current;
    const thumbOpacity = useRef(new Animated.Value(0)).current;
    const dragScale = useRef(new Animated.Value(1)).current;

    // Internal animated scroll position - falls back to prop-based updates if no animated value provided
    const internalScrollPosition = useRef(new Animated.Value(scrollPosition)).current;

    // Update internal scroll position when prop changes (fallback for non-animated usage)
    useEffect(() => {
        if (!animatedScrollPosition) {
            Animated.timing(internalScrollPosition, {
                toValue: scrollPosition,
                duration: 0, // Immediate update, but still benefits from native driver
                useNativeDriver: false, // translateY needs to run on JS thread for layout calculations
            }).start();
        }
    }, [scrollPosition, animatedScrollPosition]);

    // Show/hide track based on visibility
    useEffect(() => {
        const duration = visible ? 0 : 400; // Fast fade-in, slower fade-out

        Animated.parallel([
            Animated.timing(trackOpacity, {
                toValue: visible ? 0.3 : 0,
                duration: duration,
                useNativeDriver: true,
            }),
            Animated.timing(thumbOpacity, {
                toValue: visible ? 0.8 : 0,
                duration: duration,
                useNativeDriver: true,
            }),
        ]).start();
    }, [visible]);

    // Calculate track dimensions
    const availableHeight = Math.max(100, containerHeight); // Minimum height

    // Calculate dynamic thumb height based on content ratio
    const calculateThumbHeight = () => {
        if (contentHeight <= containerHeight) {
            return thumbHeight; // Use minimum height when content fits
        }

        // Calculate proportional height: visible area / total content * track height
        const ratio = containerHeight / contentHeight;
        const dynamicHeight = Math.max(thumbHeight, availableHeight * ratio);

        // Ensure thumb doesn't exceed track height and has reasonable bounds
        return Math.min(dynamicHeight, availableHeight * 0.8); // Max 80% of track
    };

    const currentThumbHeight = calculateThumbHeight();
    const maxThumbPosition = Math.max(0, availableHeight - currentThumbHeight);

    // Use the provided animated value or fall back to internal one
    const activeScrollPosition = animatedScrollPosition || internalScrollPosition;

    // Create animated thumb position with proper normalization
    const animatedThumbPosition = animatedScrollPosition ?
        // For raw scroll values, normalize based on content dimensions
        animatedScrollPosition.interpolate({
            inputRange: [0, Math.max(1, contentHeight - containerHeight)],
            outputRange: [0, maxThumbPosition],
            extrapolate: 'clamp',
        }) :
        // For normalized values (0-1), use directly
        activeScrollPosition.interpolate({
            inputRange: [0, 1],
            outputRange: [0, maxThumbPosition],
            extrapolate: 'clamp',
        });



    // Drag state management
    const dragStartPosition = useRef(0);
    const dragStartScrollValue = useRef(0);
    const currentScrollValue = useRef(0);

    // Track current scroll value for drag calculations
    useEffect(() => {
        if (animatedScrollPosition) {
            const listener = animatedScrollPosition.addListener(({ value }) => {
                currentScrollValue.current = value;
            });
            return () => animatedScrollPosition.removeListener(listener);
        } else {
            currentScrollValue.current = scrollPosition * Math.max(0, contentHeight - containerHeight);
        }
    }, [animatedScrollPosition, scrollPosition, contentHeight, containerHeight]);

    // Direct scroll callback for maximum responsiveness
    const directScrollToPosition = useCallback((position: number) => {
        onScrollToPosition(position);
    }, [onScrollToPosition]);

    // Optimized native-thread gesture handling
    const handleTrackGesture = useCallback((event: any) => {
        'worklet';
        const { translationY, y, state } = event.nativeEvent;

        if (state === State.BEGAN) {
            // Calculate position on native thread
            const touchY = y;
            const position = Math.max(0, Math.min(1, touchY / availableHeight));

            // Store initial values
            dragStartPosition.current = touchY;

            // Start drag animations on native thread
            dragScale.setValue(1.1);
            thumbOpacity.setValue(1);

            // JavaScript operations
            runOnJS(setIsDragging)(true);
            runOnJS(onDragStart || (() => { }))();
            runOnJS(directScrollToPosition)(position);

        } else if (state === State.ACTIVE) {
            // Calculate position on native thread for maximum smoothness
            const currentTouchY = dragStartPosition.current + translationY;
            const position = Math.max(0, Math.min(1, currentTouchY / availableHeight));

            // Direct scroll update on native thread
            runOnJS(directScrollToPosition)(position);

        } else if (state === State.END || state === State.CANCELLED) {
            // Animate values back on native thread
            dragScale.setValue(1);
            thumbOpacity.setValue(visible ? 0.8 : 0);

            // JavaScript cleanup
            runOnJS(setIsDragging)(false);
            runOnJS(onDragEnd || (() => { }))();
        }
    }, [availableHeight, directScrollToPosition, visible, onDragStart, onDragEnd,
        dragScale, thumbOpacity]);

    // Enhanced gesture handler for smooth track interaction
    const handleTrackStateChange = useCallback((event: any) => {
        handleTrackGesture(event);
    }, [handleTrackGesture]);

    if (containerHeight < 100 || contentHeight < containerHeight) return null;

    return (
        <View style={styles.container} >
            {/* Track */}
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

            {/* Draggable Track Area - Expanded for easy access */}
            <PanGestureHandler
                onGestureEvent={handleTrackGesture}
                onHandlerStateChange={handleTrackStateChange}
                shouldCancelWhenOutside={false}
                minPointers={1}
                maxPointers={1}
                hitSlop={{ top: 20, bottom: 20, left: 20, right: 0 }}
            >
                <Animated.View
                    style={[
                        styles.pressableArea,
                        {
                            width: 100, // Much wider touch area
                            height: availableHeight,
                            right: -60, // Extend 60px to the left of center
                        },
                    ]}
                >
                    {/* Visual Thumb Indicator */}
                    <Animated.View
                        style={[
                            styles.thumb,
                            {
                                opacity: thumbOpacity,
                                width: trackWidth,
                                height: currentThumbHeight,
                                position: "absolute",
                                right: 60 - (trackWidth / 2), // Align with track center
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
        right: 0, // Anchor to right edge
    },
    thumb: {
        position: "absolute",
        elevation: 4,
    },
});

export default ScrollProgressTrack;
