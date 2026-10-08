import { useCallback, useMemo, useRef, useState } from "react";
import { useAnimatedRef, useSharedValue, type SharedValue } from "react-native-reanimated";

import type {
    FlatList,
    LayoutChangeEvent,
    NativeScrollEvent,
    NativeSyntheticEvent,
    SectionList,
    ScrollView as RNScrollView,
} from "react-native";
import type { ScrollView as RNGHScrollView } from "react-native-gesture-handler";


import ScrollProgressTrack from "../ScrollProgressTrack";
import { useStableCallback } from "./useStableCallback";

export interface ScrollTrackOptions {
    /** Whether the scroll track should always be visible (no fade out). Default: false */
    alwaysVisible?: boolean;
    /** Disable drag and tap gestures on the scroll track. Default: false */
    disableGestures?: boolean;
    /** Disable tapping the track to jump, keeping the drag. Default: false */
    disableTap?: boolean;
    /** Delay in milliseconds before the track fades out when not alwaysVisible. Default: 1000 */
    fadeOutDelay?: number;
    /** Hit area expansion for gesture detection (in pixels), added around `touchWidth`. Default: 22 */
    hitSlop?: number;
    /**
     * Width in pixels of the strip along the edge that takes touches, never
     * narrower than the track. Default: 22 on iOS, 18 on Android
     */
    touchWidth?: number;
    /** Whether scrolling direction is inverted (thumb moves opposite to scroll). Default: false */
    inverted?: boolean;
    /** Minimum scroll distance required before showing the track. Default: 20 */
    minScrollDistanceToShow?: number;
    /**
     * Your own content-size handler. `scrollProps.onContentSizeChange` replaces
     * the one on the scrollable, so pass it here and it is called after the
     * track has read the size.
     */
    onContentSizeChange?: (width: number, height: number) => void;
    /**
     * Your own layout handler. `scrollProps.onLayout` replaces the one on the
     * scrollable, so pass it here and it is called after the track has read
     * the layout.
     */
    onLayout?: (event: LayoutChangeEvent) => void;
    /** Callback when user starts pressing/dragging the track. Default: empty function */
    onPressEnd?: () => void;
    /** Callback when user stops pressing/dragging the track. Default: empty function */
    onPressStart?: () => void;
    /**
     * Your own scroll handler. `scrollProps.onScroll` replaces the one on the
     * scrollable, so pass it here and it is called after the track has read
     * the event.
     */
    onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
    /** Throttle scroll events, in milliseconds between events. Default: 16 */
    scrollThrottle?: number;
    /**
     * A scroll offset you already keep up to date, for example from a worklet
     * scroll handler or a list that reports its offset through its own
     * callback. The track reads it, and `scrollProps.onScroll` then only
     * forwards to your `onScroll`.
     */
    scrollY?: SharedValue<number>;
    /** Visual styling configuration for the scroll track */
    styling?: {
        /** Color of the scroll thumb. Default: '#00CED1' */
        thumbColor?: string;
        /** Border radius of the thumb. Default: 0 */
        thumbBorderRadius?: number;
        /** Fixed height of the thumb in pixels. Overrides dynamic sizing and `minThumbHeight`; clamped to the track height. Default: undefined */
        thumbHeight?: number;
        /** Minimum height of the dynamically sized thumb in pixels. Ignored when `thumbHeight` is set. Default: undefined */
        minThumbHeight?: number;
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
    /**
     * Your own ref to the scrollable component: a ref object or a callback
     * ref. Default: null
     */
    externalRef?: React.Ref<SupportedScrollRef> | React.Ref<any>;
}

export type SupportedScrollRef =
    | RNScrollView
    | RNGHScrollView
    | FlatList<any>
    | SectionList<any>;

/**
 * Default configuration options for the scroll track
 */
export const defaultScrollTrackOptions = {
    alwaysVisible: false,
    disableGestures: false,
    disableTap: false,
    fadeOutDelay: 1000,
    hitSlop: 22,
    inverted: false,
    minScrollDistanceToShow: 20,
    onPressEnd: () => { },
    onPressStart: () => { },
    scrollThrottle: 16,
    styling: {
        thumbColor: '#00CED1',
        thumbBorderRadius: 0,
        thumbHeight: undefined as number | undefined,
        minThumbHeight: undefined as number | undefined,
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

/**
 * The track is not mounted for a viewport shorter than this: there is no room
 * for a thumb worth dragging.
 */
const MIN_CONTAINER_HEIGHT = 100;

export const useScrollTrack = (options?: ScrollTrackOptions) => {
    const {
        alwaysVisible = defaultScrollTrackOptions.alwaysVisible,
        disableGestures = defaultScrollTrackOptions.disableGestures,
        disableTap = defaultScrollTrackOptions.disableTap,
        touchWidth,
        fadeOutDelay = defaultScrollTrackOptions.fadeOutDelay,
        hitSlop = defaultScrollTrackOptions.hitSlop,
        inverted = defaultScrollTrackOptions.inverted,
        minScrollDistanceToShow = defaultScrollTrackOptions.minScrollDistanceToShow,
        onPressStart = defaultScrollTrackOptions.onPressStart,
        onPressEnd = defaultScrollTrackOptions.onPressEnd,
        scrollThrottle = defaultScrollTrackOptions.scrollThrottle,
        styling: userStyling,
        externalRef,
        scrollY: callerScrollY,
        onScroll: userOnScroll,
        onLayout: userOnLayout,
        onContentSizeChange: userOnContentSizeChange,
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

    // The scrollable's node is reached through one of three refs: the caller's
    // ref object, our own, or (for a callback ref, which holds nothing we can
    // read) a holder filled in as the node is handed on to the caller.
    const ownRef = useAnimatedRef<any>();
    const callbackNodeRef = useRef<any>(null);
    const hasCallbackRef = typeof externalRef === "function";

    const setCallbackRef = useCallback(
        (node: any) => {
            callbackNodeRef.current = node;
            if (typeof externalRef !== "function") return undefined;

            // React 19 lets a callback ref return a cleanup, which then runs in
            // place of the call with null.
            const cleanup: unknown = externalRef(node);
            if (typeof cleanup !== "function") return undefined;
            return () => {
                callbackNodeRef.current = null;
                cleanup();
            };
        },
        [externalRef]
    );

    const scrollRef: React.RefObject<any> = hasCallbackRef
        ? callbackNodeRef
        : (externalRef as React.RefObject<any> | null | undefined) ?? ownRef;

    // Stable identities, so an inline handler from the consumer does not hand
    // the scrollable a new prop on every render.
    const notifyScroll = useStableCallback<[NativeSyntheticEvent<NativeScrollEvent>]>(userOnScroll);
    const notifyLayout = useStableCallback<[LayoutChangeEvent]>(userOnLayout);
    const notifyContentSizeChange = useStableCallback<[number, number]>(userOnContentSizeChange);

    // Geometry and the offset live in shared values: the track reads them on
    // the UI thread, and a change re-renders nothing.
    const ownScrollY = useSharedValue(0);
    const scrollY = callerScrollY ?? ownScrollY;
    const containerHeight = useSharedValue(0);
    const contentHeight = useSharedValue(0);
    const containerOffsetY = useSharedValue(0);

    // JS copies of the same heights, for the scrollTo arithmetic.
    const containerHeightRef = useRef(0);
    const contentHeightRef = useRef(0);

    // The one piece of React state: whether there is enough to scroll for the
    // track to be mounted at all. It changes only when that answer does.
    const [isScrollable, setIsScrollable] = useState(false);
    const isScrollableRef = useRef(false);

    const updateScrollable = useCallback(() => {
        const container = containerHeightRef.current;
        const content = contentHeightRef.current;
        // A container with no height cannot scroll, and reports no height until
        // it has been laid out, so guard against saying otherwise too early.
        const scrollable =
            container >= MIN_CONTAINER_HEIGHT && content - container > minScrollDistanceToShow;

        // Only a changed answer reaches React: setting state to its current
        // value can still cost the host a render.
        if (scrollable === isScrollableRef.current) return;
        isScrollableRef.current = scrollable;
        setIsScrollable(scrollable);
    }, [minScrollDistanceToShow]);

    const onLayout = useCallback((e: any) => {
        const { height, y } = e.nativeEvent.layout;
        containerHeightRef.current = height;
        containerHeight.value = height;
        containerOffsetY.value = y ?? 0;
        updateScrollable();
        notifyLayout(e);
    }, [containerHeight, containerOffsetY, notifyLayout, updateScrollable]);

    const onContentSizeChange = useCallback((width: number, height: number) => {
        contentHeightRef.current = height;
        contentHeight.value = height;
        updateScrollable();
        notifyContentSizeChange(width, height);
    }, [contentHeight, notifyContentSizeChange, updateScrollable]);

    const ownsScrollY = !callerScrollY;

    const onScroll = useCallback(
        (event: NativeSyntheticEvent<NativeScrollEvent>) => {
            if (ownsScrollY) {
                const y = event?.nativeEvent?.contentOffset?.y;
                if (typeof y === "number" && !Number.isNaN(y)) ownScrollY.value = y;
            }
            notifyScroll(event);
        },
        [notifyScroll, ownScrollY, ownsScrollY]
    );

    const scrollToPosition = useCallback(
        (position: number, animated: boolean = true) => {
            const node = scrollRef.current;
            if (!node || Number.isNaN(position)) return;

            const maxOffset = Math.max(0, contentHeightRef.current - containerHeightRef.current);
            const targetOffset = Math.max(0, Math.min(1, position)) * maxOffset;

            // While scrubbing, move the thumb with the finger rather than
            // waiting for the scroll event to come back round.
            if (!animated && ownsScrollY) ownScrollY.value = targetOffset;

            if (node.scrollToOffset) {
                node.scrollToOffset({ offset: targetOffset, animated });
            } else if (node.scrollTo) {
                node.scrollTo({ y: targetOffset, animated });
            } else if (node.getScrollResponder?.()?.scrollTo) {
                node.getScrollResponder().scrollTo({ y: targetOffset, animated });
            } else if (node._listRef?.scrollToOffset) {
                node._listRef.scrollToOffset({ offset: targetOffset, animated });
            }
        },
        [ownScrollY, ownsScrollY, scrollRef]
    );

    const ScrollTrack = useMemo(() => {
        if (!isScrollable) return null;

        return (
            <ScrollProgressTrack
                alwaysVisible={alwaysVisible}
                containerHeight={containerHeight}
                containerOffsetY={containerOffsetY}
                contentHeight={contentHeight}
                disableGestures={disableGestures}
                disableTap={disableTap}
                fadeOutDelay={fadeOutDelay}
                hitSlop={hitSlop}
                inverted={inverted}
                onPressEnd={onPressEnd}
                onPressStart={onPressStart}
                onScrollToPosition={scrollToPosition}
                scrollY={scrollY}
                styling={styling}
                touchWidth={touchWidth}
            />
        );
    }, [isScrollable, alwaysVisible, containerHeight, containerOffsetY, contentHeight, disableGestures, disableTap, touchWidth, fadeOutDelay, hitSlop, inverted, onPressEnd, onPressStart, scrollToPosition, scrollY, styling]);

    return {
        scrollProps: {
            ref: (hasCallbackRef ? setCallbackRef : scrollRef) as React.Ref<any>,
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
        scrollRef,
        scrollY,
    };
};
