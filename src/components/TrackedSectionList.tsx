import React from "react";
import { SectionList, type DefaultSectionT, type SectionListProps } from "react-native";

import { useTrackedScrollable, type TrackedScrollTrackOptions } from "./useTrackedScrollable";

export type TrackedSectionListProps<ItemT, SectionT = DefaultSectionT> = SectionListProps<ItemT, SectionT> & {
    /** Options for the scroll track: styling, auto-hide, gestures. */
    scrollTrack?: TrackedScrollTrackOptions;
    ref?: React.Ref<SectionList<ItemT, SectionT>>;
};

/**
 * A `SectionList` with the scroll track attached. It takes every `SectionList` prop,
 * including your own `ref`, `onScroll`, `onLayout`, `onContentSizeChange` and
 * `inverted`, plus `scrollTrack` for the track's options.
 *
 * The track is rendered beside the list and positioned against their shared
 * parent, so that parent should be a view the list fills to its right edge.
 */
export function TrackedSectionList<ItemT, SectionT = DefaultSectionT>({
    scrollTrack,
    ref,
    inverted,
    onScroll,
    onLayout,
    onContentSizeChange,
    ...rest
}: TrackedSectionListProps<ItemT, SectionT>) {
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
            <SectionList<ItemT, SectionT> {...rest} {...scrollProps} />
            {ScrollTrack}
        </>
    );
}
