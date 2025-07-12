import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    StyleSheet,
    View,
} from "react-native";
import ScrollProgressTrack from "./ScrollProgressTrack";
import { useAnimatedScrollPosition } from "./hooks/useAnimatedScrollPosition";

export interface ScrollableContainerProps {
    children: (props: {
        scrollRef: React.RefObject<any>;
        onScroll: (event: any) => void;
        onLayout: (event: any) => void;
        onContentSizeChange: (width: number, height: number) => void;
        scrollEventThrottle: number;
        showsVerticalScrollIndicator: boolean;
        inverted: boolean;
        onDragStart?: () => void;
        onDragEnd?: () => void;
    }) => React.ReactNode;
    style?: any;
    /** Whether the list is inverted (useful for FlatList with inverted={true}) */
    inverted?: boolean;
    /** Scroll track styling configuration */
    scrollTrackStyling?: {
        /** Color of the scroll thumb */
        thumbColor?: string;
        /** Color of the track background */
        trackColor?: string;
        /** Whether the track background is visible */
        trackVisible?: boolean;
        /** Track width */
        trackWidth?: number;
        /** Thumb height */
        thumbHeight?: number;
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
    /** Callback fired when a press (tap or drag) starts on the scroll track */
    onPressStart?: () => void;
    /** Callback fired when a drag ends on the scroll track */
    onPressEnd?: () => void;
}

const ScrollableContainer: React.FC<ScrollableContainerProps> = ({
    children,
    style,
    scrollTrackStyling = {},
    inverted = false,
    onPressStart,
    onPressEnd,
}) => {
    // Extract alwaysVisible from scrollTrackStyling
    const { alwaysVisible = false } = scrollTrackStyling;

    // Scroll tracking state
    const scrollRef = useRef<any>(null);
    const { createScrollHandler, rawScrollValue, setScrollValue } = useAnimatedScrollPosition();
    const [containerHeight, setContainerHeight] = useState(0);
    const [contentHeight, setContentHeight] = useState(0);
    const [isScrollTrackVisible, setIsScrollTrackVisible] = useState(false);
    const [isTrackAutoHidden, setIsTrackAutoHidden] = useState(true);
    const [isDragInProgress, setIsDragInProgress] = useState(false);
    const autoHideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Auto-hide timer functions
    const startAutoHideTimer = useCallback(() => {
        if (autoHideTimer.current) {
            clearTimeout(autoHideTimer.current);
        }
        if (isTrackAutoHidden) {
            setIsTrackAutoHidden(false);
        }
        // Don't start auto-hide timer during drag or if alwaysVisible is true
        if (!isDragInProgress && !alwaysVisible) {
            autoHideTimer.current = setTimeout(() => {
                setIsTrackAutoHidden(true);
            }, 1000);
        }
    }, [isTrackAutoHidden, isDragInProgress, alwaysVisible]);

    const clearAutoHideTimer = useCallback(() => {
        if (autoHideTimer.current) {
            clearTimeout(autoHideTimer.current);
            autoHideTimer.current = null;
        }
    }, []);

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (autoHideTimer.current) {
                clearTimeout(autoHideTimer.current);
            }
        };
    }, []);

    // Create smooth animated scroll handler
    const animatedScrollHandler = useMemo(() => {
        return createScrollHandler(contentHeight, containerHeight);
    }, [createScrollHandler, contentHeight, containerHeight]);

    // Scroll tracking handlers for visibility and layout
    const handleScrollForVisibility = useCallback((event: any) => {
        if (!event?.nativeEvent) return;

        const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
        const currentOffset = Math.max(0, contentOffset?.y || 0);
        const containerHeight = layoutMeasurement?.height || 0;
        const totalContentHeight = contentSize?.height || 0;
        const maxOffset = Math.max(0, totalContentHeight - containerHeight);

        setContentHeight(totalContentHeight);
        setContainerHeight(containerHeight);

        // Show track when content is scrollable
        const shouldShowTrack = maxOffset > 20;
        setIsScrollTrackVisible(shouldShowTrack);

        // Start auto-hide timer when scrolling (unless alwaysVisible is true)
        if (shouldShowTrack && !alwaysVisible) {
            startAutoHideTimer();
        } else if (shouldShowTrack && alwaysVisible) {
            // If alwaysVisible is true, keep track visible
            clearAutoHideTimer();
            setIsTrackAutoHidden(false);
        } else {
            clearAutoHideTimer();
            setIsTrackAutoHidden(false);
        }
    }, [startAutoHideTimer, clearAutoHideTimer, alwaysVisible]);

    // Combined scroll handler
    const handleScroll = useCallback((event: any) => {
        animatedScrollHandler(event);
        handleScrollForVisibility(event);
    }, [animatedScrollHandler, handleScrollForVisibility]);

    // Handle scroll track taps - optimized for immediate response
    const handleScrollToPosition = useCallback((position: number) => {
        if (!scrollRef.current) return;

        startAutoHideTimer();

        const maxOffset = Math.max(0, contentHeight - containerHeight);
        // Since position now directly represents visual position (0 = top, 1 = bottom),
        // we use the same calculation for both inverted and non-inverted lists
        const targetOffset = position * maxOffset;

        // Sync the animated value immediately to prevent double-tap issue
        setScrollValue(targetOffset);

        // Handle different scroll component types with non-animated scrolling for drag responsiveness
        const isAnimated = !isDragInProgress; // Don't animate during drag for smoother experience

        if (scrollRef.current.scrollToOffset) {
            // FlatList/DragList
            scrollRef.current.scrollToOffset({
                offset: targetOffset,
                animated: isAnimated,
            });
        } else if (scrollRef.current.scrollTo) {
            // ScrollView
            scrollRef.current.scrollTo({
                y: targetOffset,
                animated: isAnimated,
            });
        } else if (scrollRef.current.getScrollResponder) {
            // DragList fallback
            const scrollResponder = scrollRef.current.getScrollResponder();
            if (scrollResponder?.scrollTo) {
                scrollResponder.scrollTo({
                    y: targetOffset,
                    animated: isAnimated,
                });
            }
        } else if (scrollRef.current._listRef?.scrollToOffset) {
            // DragList underlying FlatList fallback
            scrollRef.current._listRef.scrollToOffset({
                offset: targetOffset,
                animated: isAnimated,
            });
        }
    }, [contentHeight, containerHeight, startAutoHideTimer, setScrollValue, isDragInProgress]);

    // Handle container layout
    const handleContainerLayout = useCallback((event: any) => {
        const { height } = event.nativeEvent.layout;
        setContainerHeight(height);

        if (contentHeight > 0 && height > 0) {
            const maxOffset = Math.max(0, contentHeight - height);
            setIsScrollTrackVisible(maxOffset > 20);
        }
    }, [contentHeight]);

    // Handle content size changes
    const handleContentSizeChange = useCallback((width: number, height: number) => {
        setContentHeight(height);

        if (containerHeight > 0 && height > 0) {
            const maxOffset = Math.max(0, height - containerHeight);
            setIsScrollTrackVisible(maxOffset > 20);
        }
    }, [containerHeight]);

    // Drag callbacks
    const handleDragStart = useCallback(() => {
        setIsDragInProgress(true);
        clearAutoHideTimer();
        setIsTrackAutoHidden(false);

    }, [clearAutoHideTimer]);

    const handleDragEnd = useCallback(() => {
        setIsDragInProgress(false);
        startAutoHideTimer();

    }, [startAutoHideTimer]);

    // Computed visibility
    const isTrackCurrentlyVisible = isScrollTrackVisible && (alwaysVisible || !isTrackAutoHidden);

    return (
        <View style={[styles.container, style]}>
            <View style={styles.scrollWrapper} onLayout={handleContainerLayout}>
                {children({
                    scrollRef,
                    onScroll: handleScroll,
                    onLayout: handleContainerLayout,
                    onContentSizeChange: handleContentSizeChange,
                    scrollEventThrottle: 1, // Maximum responsiveness
                    showsVerticalScrollIndicator: false,
                    inverted: inverted,
                })}

                {/* Scroll Progress Track */}
                <ScrollProgressTrack
                    inverted={inverted}
                    scrollPosition={0} // Fallback for non-animated usage
                    onScrollToPosition={handleScrollToPosition}
                    contentHeight={contentHeight}
                    containerHeight={containerHeight}
                    visible={isTrackCurrentlyVisible}
                    animatedScrollPosition={rawScrollValue}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    trackWidth={scrollTrackStyling.trackWidth}
                    thumbHeight={scrollTrackStyling.thumbHeight}
                    onPressStart={onPressStart}
                    onPressEnd={onPressEnd}
                    styling={{
                        thumbColor: scrollTrackStyling.thumbColor,
                        trackColor: scrollTrackStyling.trackColor,
                        trackVisible: scrollTrackStyling.trackVisible,
                        thumbShadow: scrollTrackStyling.thumbShadow,
                        alwaysVisible: scrollTrackStyling.alwaysVisible,
                    }}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollWrapper: {
        flex: 1,
        position: "relative",
    },
});

export default ScrollableContainer;
