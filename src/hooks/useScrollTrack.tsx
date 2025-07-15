import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import ScrollProgressTrack from "../ScrollProgressTrack";
import { useAnimatedScrollPosition } from "./useAnimatedScrollPosition";

export interface ScrollTrackOptions {
    /** Whether the scroll track should always be visible (no fade out). Default: false */
    alwaysVisible?: boolean;
    /** Disable drag and tap gestures on the scroll track. Default: false */
    disableGestures?: boolean;
    /** Delay in milliseconds before the track fades out when not alwaysVisible. Default: 1000 */
    fadeOutDelay?: number;
    /** Hit area expansion for gesture detection (in pixels). Default: 22 */
    hitSlop?: number;
    /** Whether scrolling direction is inverted (thumb moves opposite to scroll). Default: false */
    inverted?: boolean;
    /** Minimum scroll distance required before showing the track. Default: 20 */
    minScrollDistanceToShow?: number;
    /** Callback when user starts pressing/dragging the track. Default: empty function */
    onPressEnd?: () => void;
    /** Callback when user stops pressing/dragging the track. Default: empty function */
    onPressStart?: () => void;
    /** Throttle scroll events (lower = more responsive, higher = better performance). Default: 1 */
    scrollThrottle?: number;
    /** Visual styling configuration for the scroll track */
    styling?: {
        /** Color of the scroll thumb. Default: '#00CED1' */
        thumbColor?: string;
        /** Border radius of the thumb. Default: 0 */
        thumbBorderRadius?: number;
        /** Fixed height of the thumb (overrides dynamic sizing). Default: undefined */
        thumbHeight?: number;
        /** Opacity of the thumb (0-1). Default: 0.8 */
        thumbOpacity?: number;
        /** Shadow configuration for the thumb */
        thumbShadow?: {
            /** Shadow color. Default: '#000000' */
            color?: string;
            /** Shadow opacity (0-1). Default: 0.3 */
            opacity?: number;
            /** Shadow blur radius. Default: 4 */
            radius?: number;
            /** Shadow offset. Default: { width: 0, height: 2 } */
            offset?: { width: number; height: number };
        };
        /** Color of the track background. Default: '#637777' */
        trackColor?: string;
        /** Opacity of the track (0-1). Default: 0.3 */
        trackOpacity?: number;
        /** Whether to show the track background. Default: true */
        trackVisible?: boolean;
        /** Width of the track and thumb. Default: 4 */
        trackWidth?: number;
        /** Z-index for the scroll track container. Default: 1000 */
        zIndex?: number;
    };
}

/**
 * Default configuration options for the scroll track
 */
export const defaultScrollTrackOptions = {
    alwaysVisible: false,
    disableGestures: false,
    fadeOutDelay: 1000,
    hitSlop: 22,
    inverted: false,
    minScrollDistanceToShow: 20,
    onPressEnd: () => { },
    onPressStart: () => { },
    scrollThrottle: 1,
    styling: {
        thumbColor: '#00CED1',
        thumbBorderRadius: 0,
        thumbHeight: undefined as number | undefined,
        thumbOpacity: 0.8,
        thumbShadow: {
            color: '#000000',
            opacity: 0.3,
            radius: 4,
            offset: { width: 0, height: 2 },
        },
        trackColor: '#637777',
        trackOpacity: 0.3,
        trackVisible: true,
        trackWidth: 4,
        zIndex: 1000,
    },
} as const;

export const useScrollTrack = (options?: ScrollTrackOptions) => {
    const {
        alwaysVisible = defaultScrollTrackOptions.alwaysVisible,
        disableGestures = defaultScrollTrackOptions.disableGestures,
        fadeOutDelay = defaultScrollTrackOptions.fadeOutDelay,
        hitSlop = defaultScrollTrackOptions.hitSlop,
        inverted = defaultScrollTrackOptions.inverted,
        minScrollDistanceToShow = defaultScrollTrackOptions.minScrollDistanceToShow,
        onPressStart = defaultScrollTrackOptions.onPressStart,
        onPressEnd = defaultScrollTrackOptions.onPressEnd,
        scrollThrottle = defaultScrollTrackOptions.scrollThrottle,
        styling: userStyling,
    } = options || {};

    // Merge user styling with defaults, including nested thumbShadow
    const styling = useMemo(() => {
        if (!userStyling) return defaultScrollTrackOptions.styling;

        return {
            ...defaultScrollTrackOptions.styling,
            ...userStyling,
            thumbShadow: userStyling.thumbShadow
                ? { ...defaultScrollTrackOptions.styling.thumbShadow, ...userStyling.thumbShadow }
                : defaultScrollTrackOptions.styling.thumbShadow,
        };
    }, [userStyling]);

    const scrollRef = useRef<any>(null);
    const { createScrollHandler, rawScrollValue, setScrollValue } = useAnimatedScrollPosition();

    const [containerHeight, setContainerHeight] = useState(0);
    const [contentHeight, setContentHeight] = useState(0);
    const [isAutoHidden, setIsAutoHidden] = useState(true);
    const [isDragging, setIsDragging] = useState(false);

    const isScrollable = useMemo(() => {
        return contentHeight - containerHeight > minScrollDistanceToShow;
    }, [contentHeight, containerHeight, minScrollDistanceToShow]);

    const autoHideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const clearAutoHideTimer = useCallback(() => {
        if (autoHideTimer.current) {
            clearTimeout(autoHideTimer.current);
            autoHideTimer.current = null;
        }
    }, []);

    const startAutoHideTimer = useCallback(() => {
        clearAutoHideTimer();
        setIsAutoHidden(false);
        if (!alwaysVisible) {
            autoHideTimer.current = setTimeout(() => {
                setIsAutoHidden(true);
            }, fadeOutDelay);
        }
    }, [alwaysVisible, clearAutoHideTimer, fadeOutDelay]);

    useEffect(() => () => clearAutoHideTimer(), [clearAutoHideTimer]);

    const onLayout = useCallback((e: any) => {
        const height = e.nativeEvent.layout.height;
        setContainerHeight(height);
    }, []);

    const onContentSizeChange = useCallback((_: number, height: number) => {
        setContentHeight(height);
    }, []);

    const onScrollInternal = useMemo(
        () => createScrollHandler(contentHeight, containerHeight),
        [createScrollHandler, contentHeight, containerHeight]
    );

    const onScroll = useCallback(
        (event: NativeSyntheticEvent<NativeScrollEvent>) => {
            onScrollInternal(event);

            if (isScrollable) {
                alwaysVisible ? setIsAutoHidden(false) : startAutoHideTimer();
            } else {
                clearAutoHideTimer();
                setIsAutoHidden(false);
            }
        },
        [onScrollInternal, alwaysVisible, clearAutoHideTimer, startAutoHideTimer, isScrollable]
    );

    const scrollToPosition = useCallback(
        (position: number) => {
            if (!scrollRef.current) return;

            startAutoHideTimer();
            const maxOffset = Math.max(0, contentHeight - containerHeight);
            const targetOffset = position * maxOffset;
            setScrollValue(targetOffset);

            const isAnimated = !isDragging;

            if (scrollRef.current.scrollToOffset) {
                scrollRef.current.scrollToOffset({ offset: targetOffset, animated: isAnimated });
            } else if (scrollRef.current.scrollTo) {
                scrollRef.current.scrollTo({ y: targetOffset, animated: isAnimated });
            } else if (scrollRef.current.getScrollResponder?.()?.scrollTo) {
                scrollRef.current.getScrollResponder().scrollTo({ y: targetOffset, animated: isAnimated });
            } else if (scrollRef.current._listRef?.scrollToOffset) {
                scrollRef.current._listRef.scrollToOffset({ offset: targetOffset, animated: isAnimated });
            }
        },
        [containerHeight, contentHeight, isDragging, setScrollValue, startAutoHideTimer]
    );

    const handleDragStart = useCallback(() => {
        setIsDragging(true);
        clearAutoHideTimer();
        setIsAutoHidden(false);
    }, [clearAutoHideTimer]);

    const handleDragEnd = useCallback(() => {
        setIsDragging(false);
        if (!alwaysVisible) {
            // Use setTimeout to ensure state update has processed
            setTimeout(() => {
                startAutoHideTimer();
            }, 0);
        }
    }, [startAutoHideTimer, alwaysVisible]);

    const ScrollTrack = useMemo(() => {
        if (containerHeight < 100 || contentHeight <= containerHeight) return null;

        return (
            <ScrollProgressTrack
                alwaysVisible={alwaysVisible}
                animatedScrollPosition={rawScrollValue}
                containerHeight={containerHeight}
                contentHeight={contentHeight}
                disableGestures={disableGestures}
                hitSlop={hitSlop}
                inverted={inverted}
                onDragEnd={handleDragEnd}
                onDragStart={handleDragStart}
                onPressEnd={onPressEnd}
                onPressStart={onPressStart}
                onScrollToPosition={scrollToPosition}
                scrollPosition={0}
                styling={styling}
                visible={alwaysVisible || (!isAutoHidden && isScrollable)}
            />
        );
    }, [containerHeight, contentHeight, rawScrollValue, scrollToPosition, isAutoHidden, isScrollable, inverted, styling, handleDragStart, handleDragEnd, onPressStart, onPressEnd, alwaysVisible, disableGestures]);

    return {
        scrollProps: {
            ref: scrollRef,
            onScroll,
            onLayout,
            onContentSizeChange,
            scrollEventThrottle: scrollThrottle,
            showsVerticalScrollIndicator: false,
            inverted,
        },
        ScrollTrack,
        scrollToPosition,
        isScrollable,
        isVisible: isScrollable && (alwaysVisible || !isAutoHidden),
    };
};
