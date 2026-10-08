import React, { useEffect, useMemo, useState } from "react";
import { Platform, StyleSheet } from "react-native";
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    Easing,
    Extrapolation,
    cancelAnimation,
    interpolate,
    useAnimatedReaction,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSequence,
    withTiming,
    type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { useStableCallback } from './hooks/useStableCallback';
import { resolveThumbHeight } from './utils/resolveThumbHeight';

/**
 * A scrub only crosses to the JS thread once the finger has moved this far,
 * in pixels or as a fraction of the track. Every crossing costs a scrollTo,
 * and at 60fps most frames move the finger by less than this.
 */
const SCRUB_MIN_PX = Platform.OS === 'android' ? 12 : 4;
const SCRUB_MIN_RATIO = Platform.OS === 'android' ? 0.006 : 0.004;

/** Any horizontal movement beyond this fails the pan, so a back swipe wins. */
const FAIL_OFFSET_X = 4;
/** The pan activates only past this much vertical movement. */
const ACTIVE_OFFSET_Y = 6;

/**
 * Android reserves the right edge for the system back gesture, so the touch
 * target is shifted inward by this much.
 */
const ANDROID_BACK_GUTTER = 4;
/** The width of the strip that takes touches when `touchWidth` is not set. */
const DEFAULT_TOUCH_WIDTH = Platform.OS === 'android' ? 18 : 22;

/** Fade timings, in milliseconds. */
const SHOW_DURATION = 120;
const HIDE_DURATION = 400;

/**
 * The scroll offset has to move this far before the show/hide animation is
 * re-armed, so a scroll does not start a new animation on every frame.
 */
const SHOW_MIN_SCROLL_PX = 12;

export interface ScrollProgressTrackProps {
    /** Current scroll offset of the scrollable, in pixels. */
    scrollY: SharedValue<number>;
    /** Height of the scrollable's viewport. */
    containerHeight: SharedValue<number>;
    /** Total height of the scrollable's content. */
    contentHeight: SharedValue<number>;
    /** Top of the scrollable inside the view the track is positioned against. Default: 0 */
    containerOffsetY?: SharedValue<number>;
    /**
     * Called on the JS thread with a position from 0 to 1. `animated` is false
     * while the thumb is being dragged and true for a tap on the track.
     */
    onScrollToPosition: (position: number, animated: boolean) => void;
    alwaysVisible?: boolean;
    /** Turns off both the tap and the drag. Default: false */
    disableGestures?: boolean;
    /** Turns off tapping the track to jump; the thumb can still be dragged. Default: false */
    disableTap?: boolean;
    /**
     * Width in pixels of the strip along the edge that takes touches, never
     * narrower than the track. Default: 22 on iOS, 18 on Android
     */
    touchWidth?: number;
    /** Delay in milliseconds before the track fades out. Default: 1000 */
    fadeOutDelay?: number;
    hitSlop?: number;
    inverted?: boolean;
    onPressStart?: () => void;
    onPressEnd?: () => void;
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
}

const ScrollProgressTrack: React.FC<ScrollProgressTrackProps> = ({
    scrollY,
    containerHeight,
    contentHeight,
    containerOffsetY,
    onScrollToPosition,
    alwaysVisible = false,
    disableGestures = false,
    disableTap = false,
    touchWidth,
    fadeOutDelay = 1000,
    hitSlop = 22,
    inverted = false,
    onPressEnd,
    onPressStart,
    styling = {},
    testID = 'scroll-progress-track',
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
        thumbHeight: fixedThumbHeight,
        minThumbHeight,
    } = styling;

    const trackWidth = styling.trackWidth ?? 4;
    const shadowOpacity = thumbShadow.opacity || 0.3;
    const shadowRadius = thumbShadow.radius || 4;

    /** 0 = faded out, 1 = fully shown. Scales the track and thumb opacity. */
    const visibility = useSharedValue(alwaysVisible ? 1 : 0);
    /** 1 while the thumb is being dragged. */
    const isDragging = useSharedValue(0);

    // Scrub bookkeeping, read and written from the gesture worklets.
    const gestureLastY = useSharedValue(0);
    const lastSentY = useSharedValue(0);
    const lastSentRatio = useSharedValue(-1);
    const lastShownScroll = useSharedValue(0);

    /**
     * Whether the gesture overlay accepts touches. The overlay spans a strip of
     * the right edge, so leaving it live while the track is faded out would
     * silently swallow taps meant for the content underneath.
     */
    const [isInteractive, setIsInteractive] = useState(alwaysVisible);

    useEffect(() => {
        cancelAnimation(visibility);
        visibility.value = alwaysVisible ? 1 : 0;
    }, [alwaysVisible, visibility]);

    // Show on scroll, then fade out once scrolling stops. A scrub and a
    // programmatic scroll both move the offset, so they show the track too.
    useAnimatedReaction(
        () => scrollY.value,
        (current, previous) => {
            // The first reading only records where the scrollable starts.
            if (previous === null) {
                lastShownScroll.value = current;
                return;
            }
            if (current === previous || alwaysVisible) return;
            if (isDragging.value === 1) return;
            if (Math.abs(current - lastShownScroll.value) < SHOW_MIN_SCROLL_PX) return;
            lastShownScroll.value = current;

            const hide = withDelay(
                fadeOutDelay,
                withTiming(0, { duration: HIDE_DURATION, easing: Easing.in(Easing.quad) })
            );
            visibility.value =
                visibility.value < 1
                    ? withSequence(
                          withTiming(1, { duration: SHOW_DURATION, easing: Easing.out(Easing.quad) }),
                          hide
                      )
                    : hide;
        },
        [alwaysVisible, fadeOutDelay]
    );

    // Accept touches as soon as the track starts appearing and until it has
    // fully faded out, so a half-visible thumb is still grabbable. This crosses
    // to JS at most twice per visibility cycle.
    useAnimatedReaction(
        () => visibility.value > 0,
        (shown, wasShown) => {
            if (shown === wasShown) return;
            scheduleOnRN(setIsInteractive, shown);
        }
    );

    const containerStyle = useAnimatedStyle(() => ({
        top: containerOffsetY ? containerOffsetY.value : 0,
        height: containerHeight.value,
    }));

    const trackStyle = useAnimatedStyle(() => ({
        opacity: visibility.value * trackOpacity,
    }));

    const thumbStyle = useAnimatedStyle(() => {
        const available = containerHeight.value;
        const height = resolveThumbHeight({
            availableHeight: available,
            containerHeight: containerHeight.value,
            contentHeight: contentHeight.value,
            thumbHeight: fixedThumbHeight,
            minThumbHeight,
        });
        const maxThumbPosition = Math.max(0, available - height);
        const scrollRange = Math.max(1, contentHeight.value - containerHeight.value);
        const dragging = isDragging.value === 1;

        return {
            height,
            opacity: visibility.value * thumbOpacity,
            transform: [
                {
                    translateY: interpolate(
                        scrollY.value,
                        [0, scrollRange],
                        inverted ? [maxThumbPosition, 0] : [0, maxThumbPosition],
                        Extrapolation.CLAMP
                    ),
                },
            ],
            shadowOpacity: dragging ? Math.min(shadowOpacity * 1.3, 1) : shadowOpacity,
            shadowRadius: dragging ? shadowRadius * 1.5 : shadowRadius,
        };
    });

    // Stable identities so an inline handler from the consumer does not
    // invalidate the cached gesture on every render.
    const scrollTo = useStableCallback<[number, boolean]>(onScrollToPosition);
    const safeOnPressStart = useStableCallback(onPressStart);
    const safeOnPressEnd = useStableCallback(onPressEnd);

    const gesture = useMemo(() => {
        const positionAt = (y: number) => {
            'worklet';
            const trackLength = Math.max(1, containerHeight.value);
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
                scheduleOnRN(safeOnPressStart);
            })
            .onStart(() => {
                'worklet';
                isDragging.value = 1;
                if (!alwaysVisible) {
                    visibility.value = withTiming(1, {
                        duration: SHOW_DURATION,
                        easing: Easing.out(Easing.quad),
                    });
                }
            })
            .onUpdate((e) => {
                'worklet';
                gestureLastY.value = e.y;
                const pos = positionAt(e.y);

                // Movement gate: every crossing to JS costs a scrollTo, and
                // most frames move the finger barely at all.
                const movedPx = Math.abs(e.y - lastSentY.value);
                const movedRatio = Math.abs(pos - lastSentRatio.value);
                if (movedPx < SCRUB_MIN_PX && movedRatio < SCRUB_MIN_RATIO) return;

                lastSentY.value = e.y;
                lastSentRatio.value = pos;
                scheduleOnRN(scrollTo, pos, false);
            })
            .onFinalize(() => {
                'worklet';
                // finalize covers END/FAIL/CANCEL. Deliver wherever the finger
                // actually ended up, since the gate may have dropped the last
                // few frames of the scrub.
                if (gestureLastY.value !== lastSentY.value) {
                    lastSentY.value = gestureLastY.value;
                    scheduleOnRN(scrollTo, positionAt(gestureLastY.value), false);
                }

                if (isDragging.value === 1) {
                    isDragging.value = 0;
                    if (!alwaysVisible) {
                        visibility.value = withDelay(
                            fadeOutDelay,
                            withTiming(0, { duration: HIDE_DURATION, easing: Easing.in(Easing.quad) })
                        );
                    }
                }
                scheduleOnRN(safeOnPressEnd);
            });

        if (disableTap) return pan;

        const tap = Gesture.Tap()
            .maxDistance(20)
            .hitSlop(hitSlop)
            .onEnd((e, success) => {
                'worklet';
                if (!success) return;
                scheduleOnRN(scrollTo, positionAt(e.y), true);
            });

        return Gesture.Simultaneous(tap, pan);
        // The callbacks and shared values are stable by construction, so the
        // gesture only needs rebuilding when its configuration changes.
    }, [
        alwaysVisible,
        disableTap,
        fadeOutDelay,
        hitSlop,
        inverted,
        containerHeight,
        gestureLastY,
        isDragging,
        lastSentY,
        lastSentRatio,
        visibility,
        scrollTo,
        safeOnPressStart,
        safeOnPressEnd,
    ]);

    const gestureWidth = Math.max(trackWidth, touchWidth ?? DEFAULT_TOUCH_WIDTH);
    const gestureInset = Platform.OS === 'android' ? ANDROID_BACK_GUTTER : 0;
    // The container is as wide as everything inside it: Android does not
    // deliver touches to a child that overflows its parent.
    const containerWidth = disableGestures ? trackWidth : gestureWidth + gestureInset;

    return (
        <Animated.View
            style={[styles.container, { zIndex, width: containerWidth }, containerStyle]}
            testID={testID}
            pointerEvents="box-none"
        >
            {trackVisible && (
                <Animated.View
                    testID={`${testID}-track`}
                    pointerEvents="none"
                    style={[
                        styles.track,
                        { width: trackWidth, backgroundColor: trackColor },
                        trackStyle,
                    ]}
                />
            )}

            {/* The thumb sits flush with the edge, outside the gesture overlay,
                so it is never shifted by the platform's touch-target adjustments. */}
            <Animated.View
                testID={`${testID}-thumb`}
                pointerEvents="none"
                style={[
                    styles.thumb,
                    {
                        width: trackWidth,
                        backgroundColor: thumbColor,
                        borderRadius: thumbBorderRadius,
                        shadowColor: thumbShadow.color,
                        shadowOffset: thumbShadow.offset,
                    },
                    thumbStyle,
                ]}
            />

            {!disableGestures && (
                <GestureDetector gesture={gesture}>
                    <Animated.View
                        testID={`${testID}-gestures`}
                        style={[
                            styles.touchStrip,
                            { width: gestureWidth, right: gestureInset },
                        ]}
                        pointerEvents={isInteractive ? 'auto' : 'none'}
                    />
                </GestureDetector>
            )}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        right: 0,
    },
    track: {
        position: "absolute",
        top: 0,
        bottom: 0,
        right: 0,
    },
    touchStrip: {
        position: "absolute",
        top: 0,
        bottom: 0,
    },
    thumb: {
        position: "absolute",
        top: 0,
        right: 0,
        elevation: 4,
    },
});

export default ScrollProgressTrack;
