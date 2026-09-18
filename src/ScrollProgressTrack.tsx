import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Animated,
    Platform,
    StyleSheet,
    View,
} from "react-native";
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS, useSharedValue } from 'react-native-reanimated';

import { resolveThumbHeight } from './utils/resolveThumbHeight';

/**
 * A scrub only crosses to the JS thread once the finger has moved this far,
 * in pixels or as a fraction of the track. Every crossing costs a scrollTo and
 * a timer reset, and at 60fps most frames move the finger by less than this.
 */
const SCRUB_MIN_PX = Platform.OS === 'android' ? 12 : 4;
const SCRUB_MIN_RATIO = Platform.OS === 'android' ? 0.006 : 0.004;

/** Any horizontal movement beyond this fails the pan, so a back swipe wins. */
const FAIL_OFFSET_X = 4;
/** The pan activates only past this much vertical movement. */
const ACTIVE_OFFSET_Y = 6;

/**
 * Android reserves the right edge for the system back gesture, so the touch
 * target is shifted inward and widened to stay comfortable.
 */
const ANDROID_BACK_GUTTER = 4;
const ANDROID_TOUCH_WIDTH = 18;
const MIN_TOUCH_WIDTH = 22;

/**
 * Keeps a stable identity for a callback that may be re-created on every render
 * by the consumer, so caching a gesture does not pin it to a stale closure.
 */
const useStableCallback = <Args extends any[]>(
    callback?: (...args: Args) => void
) => {
    const ref = useRef(callback);

    useEffect(() => {
        ref.current = callback;
    });

    return useCallback((...args: Args) => {
        ref.current?.(...args);
    }, []);
};

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
    scrollPosition: number;
    /** Identifier for locating the track in tests. Default: 'scroll-progress-track' */
    testID?: string;
    styling?: {
        trackWidth?: number;
        thumbColor?: string;
        thumbHeight?: number;
        minThumbHeight?: number;
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
    hitSlop = 22,
    inverted = false,
    onDragEnd,
    onDragStart,
    onPressEnd,
    onPressStart,
    onScrollToPosition,
    scrollPosition,
    styling = {},
    testID = 'scroll-progress-track',
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

    const trackWidthProp = styling.trackWidth ?? 4;

    const [isDragging, setIsDragging] = useState(false);
    const [isPressed, setIsPressed] = useState(false);
    /**
     * Whether the gesture overlay accepts touches. The overlay spans a strip of
     * the right edge, so leaving it live while the track is faded out would
     * silently swallow taps meant for the content underneath.
     */
    const [isInteractive, setIsInteractive] = useState(alwaysVisible || visible);

    // Scrub bookkeeping, read and written from the gesture worklets.
    const gestureLastY = useSharedValue(0);
    const lastSentY = useSharedValue(0);
    const lastSentRatio = useSharedValue(-1);

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
        const shouldShow = alwaysVisible || visible;
        const targetTrackOpacity = shouldShow ? trackOpacity : 0;
        const targetThumbOpacity = shouldShow ? thumbOpacity : 0;
        // Skip fade animation during any press interaction (drag or tap)
        const duration = alwaysVisible || isPressed ? 0 : 400;

        // Accept touches as soon as the track starts appearing, but keep them
        // until it has fully faded out, so a half-visible thumb is still
        // grabbable. This flips at most twice per visibility cycle.
        if (shouldShow) setIsInteractive(true);

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
        ]).start(({ finished }) => {
            if (finished && !shouldShow) setIsInteractive(false);
        });
    }, [alwaysVisible, visible, trackOpacity, thumbOpacity, isPressed]);

    const availableHeight = Math.max(100, containerHeight);

    const currentThumbHeight = resolveThumbHeight({
        availableHeight,
        containerHeight,
        contentHeight,
        thumbHeight: styling.thumbHeight,
        minThumbHeight: styling.minThumbHeight,
    });
    const maxThumbPosition = Math.max(0, availableHeight - currentThumbHeight);
    const activeScrollPosition = animatedScrollPosition || internalScrollPosition;
    const scrollRange = Math.max(1, contentHeight - containerHeight);

    const animatedThumbPosition = activeScrollPosition.interpolate({
        inputRange: animatedScrollPosition ? [0, scrollRange] : [0, 1],
        outputRange: inverted ? [maxThumbPosition, 0] : [0, maxThumbPosition],
        extrapolate: 'clamp',
    });


    // Stable identities so an inline handler from the consumer does not
    // invalidate the cached gesture on every render.
    const scrollTo = useStableCallback<[number]>(onScrollToPosition);
    const safeOnDragStart = useStableCallback(onDragStart);
    const safeOnDragEnd = useStableCallback(onDragEnd);
    const safeOnPressStart = useStableCallback(onPressStart);
    const safeOnPressEnd = useStableCallback(onPressEnd);

    const gesture = useMemo(() => {
        const trackLength = Math.max(1, availableHeight);
        const positionAt = (y: number) => {
            'worklet';
            const raw = Math.max(0, Math.min(1, y / trackLength));
            return inverted ? 1 - raw : raw;
        };

        const pan = Gesture.Pan()
            .minPointers(1)
            .maxPointers(1)
            .hitSlop(hitSlop)
            .shouldCancelWhenOutside(false)
            // Any horizontal movement hands the gesture back, so the Android
            // back swipe along this same edge always wins.
            .failOffsetX([-FAIL_OFFSET_X, FAIL_OFFSET_X])
            // Activate only past meaningful vertical movement, so a stray touch
            // on the edge does not start a scrub.
            .activeOffsetY([-ACTIVE_OFFSET_Y, ACTIVE_OFFSET_Y])
            .onBegin((e) => {
                'worklet';
                gestureLastY.value = e.y;
                lastSentY.value = e.y;
                lastSentRatio.value = -1;
                runOnJS(safeOnDragStart)();
                runOnJS(safeOnPressStart)();
            })
            .onUpdate((e) => {
                'worklet';
                gestureLastY.value = e.y;

                const pos = positionAt(e.y);

                // Movement gate: every crossing to JS costs a scrollTo and a
                // timer reset, and most frames move the finger barely at all.
                const movedPx = Math.abs(e.y - lastSentY.value);
                const movedRatio = Math.abs(pos - lastSentRatio.value);
                if (movedPx < SCRUB_MIN_PX && movedRatio < SCRUB_MIN_RATIO) return;

                lastSentY.value = e.y;
                lastSentRatio.value = pos;
                runOnJS(scrollTo)(pos);
            })
            .onFinalize(() => {
                'worklet';
                // finalize covers END/FAIL/CANCEL. Deliver wherever the finger
                // actually ended up, since the gate may have dropped the last
                // few frames of the scrub.
                if (gestureLastY.value !== lastSentY.value) {
                    lastSentY.value = gestureLastY.value;
                    runOnJS(scrollTo)(positionAt(gestureLastY.value));
                }

                runOnJS(safeOnDragEnd)();
                runOnJS(safeOnPressEnd)();
            });

        const tap = Gesture.Tap()
            .maxDistance(20)  // matches your previous maxDist
            .hitSlop(hitSlop)
            .onBegin(() => {
                'worklet';
                runOnJS(safeOnPressStart)();
            })
            .onEnd((e) => {
                'worklet';
                runOnJS(scrollTo)(positionAt(e.y));
                runOnJS(safeOnPressEnd)();
            });

        return Gesture.Simultaneous(tap, pan);
        // The callbacks and shared values are stable by construction, so the
        // gesture only needs rebuilding when the track geometry changes.
    }, [
        availableHeight,
        hitSlop,
        inverted,
        gestureLastY,
        lastSentY,
        lastSentRatio,
        scrollTo,
        safeOnDragStart,
        safeOnDragEnd,
        safeOnPressStart,
        safeOnPressEnd,
    ]);


    if (containerHeight < 100 || contentHeight <= containerHeight) return null;

    const visualWidth = Math.max(trackWidthProp, MIN_TOUCH_WIDTH);
    const isAndroid = Platform.OS === 'android';
    const gestureWidth = isAndroid ? ANDROID_TOUCH_WIDTH : visualWidth;
    const gestureInset = isAndroid ? ANDROID_BACK_GUTTER : 0;

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
        <View style={[styles.container, { zIndex }]} testID={testID}>
            {trackVisible && (
                <Animated.View
                    style={[
                        styles.track,
                        {
                            opacity: trackOpacityValue,
                            width: trackWidthProp,
                            height: availableHeight,
                            backgroundColor: trackColor,
                        },
                    ]}
                />
            )}

            {/* Visuals only. Kept out of the gesture overlay so the thumb is
                never shifted by the platform's touch-target adjustments. */}
            <Animated.View
                style={[
                    styles.pressableArea,
                    { height: availableHeight, width: visualWidth },
                ]}
                pointerEvents="none"
            >
                {Thumb}
            </Animated.View>

            {!disableGestures && (
                <GestureDetector gesture={gesture}>
                    <Animated.View
                        style={[
                            styles.pressableArea,
                            {
                                height: availableHeight,
                                width: gestureWidth,
                                right: gestureInset,
                            },
                        ]}
                        pointerEvents={isInteractive || isPressed ? 'auto' : 'none'}
                    />
                </GestureDetector>
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
