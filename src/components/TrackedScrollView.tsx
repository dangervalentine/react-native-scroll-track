import React from "react";
import { ScrollView, type ScrollViewProps } from "react-native";

import { useTrackedScrollable, type TrackedScrollTrackOptions } from "./useTrackedScrollable";

export type TrackedScrollViewProps = ScrollViewProps & {
    /** Options for the scroll track: styling, auto-hide, gestures. */
    scrollTrack?: TrackedScrollTrackOptions;
    ref?: React.Ref<ScrollView>;
};

/**
 * A `ScrollView` with the scroll track attached. It takes every `ScrollView`
 * prop, including your own `ref`, `onScroll`, `onLayout` and
 * `onContentSizeChange`, plus `scrollTrack` for the track's options.
 *
 * The track is rendered beside the scroll view and positioned against their
 * shared parent, so that parent should be a view the scroll view fills to its
 * right edge.
 */
export function TrackedScrollView({
    scrollTrack,
    ref,
    onScroll,
    onLayout,
    onContentSizeChange,
    ...rest
}: TrackedScrollViewProps) {
    const { scrollProps, ScrollTrack } = useTrackedScrollable({
        scrollTrack,
        ref,
        onScroll,
        onLayout,
        onContentSizeChange,
    });
    // A ScrollView has no `inverted`; the track follows the content as it is.
    const { inverted: _inverted, ...trackProps } = scrollProps;

    return (
        <>
            <ScrollView {...rest} {...trackProps} />
            {ScrollTrack}
        </>
    );
}
