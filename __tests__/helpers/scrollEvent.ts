import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

interface ScrollEventOptions {
    /** Current vertical scroll offset. */
    y?: number;
    /** Height of the visible viewport. */
    containerHeight?: number;
    /** Total height of the scrollable content. */
    contentHeight?: number;
}

/**
 * Builds the scroll event the track actually reads.
 *
 * React's synthetic event carries a great deal the scroll handler never
 * touches, so the type is asserted once here rather than at every call site.
 */
export const scrollEvent = ({
    y = 0,
    containerHeight = 500,
    contentHeight = 1000,
}: ScrollEventOptions = {}): NativeSyntheticEvent<NativeScrollEvent> =>
    ({
        nativeEvent: {
            contentOffset: { x: 0, y },
            layoutMeasurement: { width: 300, height: containerHeight },
            contentSize: { width: 300, height: contentHeight },
            contentInset: { top: 0, left: 0, bottom: 0, right: 0 },
            zoomScale: 1,
        },
    } as NativeSyntheticEvent<NativeScrollEvent>);
