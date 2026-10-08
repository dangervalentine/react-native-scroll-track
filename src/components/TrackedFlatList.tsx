import React from "react";
import { FlatList, type FlatListProps } from "react-native";

import { useTrackedScrollable, type TrackedScrollTrackOptions } from "./useTrackedScrollable";

export type TrackedFlatListProps<ItemT> = FlatListProps<ItemT> & {
    /** Options for the scroll track: styling, auto-hide, gestures. */
    scrollTrack?: TrackedScrollTrackOptions;
    ref?: React.Ref<FlatList<ItemT>>;
};

/**
 * A `FlatList` with the scroll track attached. It takes every `FlatList` prop,
 * including your own `ref`, `onScroll`, `onLayout`, `onContentSizeChange` and
 * `inverted`, plus `scrollTrack` for the track's options.
 *
 * The track is rendered beside the list and positioned against their shared
 * parent, so that parent should be a view the list fills to its right edge.
 */
export function TrackedFlatList<ItemT>({
    scrollTrack,
    ref,
    inverted,
    onScroll,
    onLayout,
    onContentSizeChange,
    ...rest
}: TrackedFlatListProps<ItemT>) {
    const { scrollProps, ScrollTrack } = useTrackedScrollable({
        scrollTrack,
        ref,
        inverted,
        onScroll,
        onLayout,
        onContentSizeChange,
    });

    return (
        <>
            <FlatList<ItemT> {...rest} {...scrollProps} />
            {ScrollTrack}
        </>
    );
}
