import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import ScrollProgressTrack from "../ScrollProgressTrack";
import { useAnimatedScrollPosition } from "./useAnimatedScrollPosition";

export interface ScrollTrackOptions {
    alwaysVisible?: boolean;
    disableGestures?: boolean;
    fadeOutDelay?: number;
    hitSlop?: number;
    inverted?: boolean;
    minScrollDistanceToShow?: number;
    onPressEnd?: () => void;
    onPressStart?: () => void;
    scrollThrottle?: number;
    styling?: {
        thumbColor?: string;
        thumbBorderRadius?: number;
        thumbHeight?: number;
        thumbOpacity?: number;
        thumbShadow?: {
            color?: string;
            opacity?: number;
            radius?: number;
            offset?: { width: number; height: number };
        };
        trackColor?: string;
        trackOpacity?: number;
        trackVisible?: boolean;
        trackWidth?: number;
        zIndex?: number;
    };
}

export const useScrollTrack = (options?: ScrollTrackOptions) => {
    const {
        alwaysVisible = false,
        disableGestures = false,
        fadeOutDelay = 1000,
        hitSlop = 36,
        inverted = false,
        minScrollDistanceToShow = 20,
        onPressStart,
        onPressEnd,
        scrollThrottle = 1,
        styling = {},
    } = options || {};

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
