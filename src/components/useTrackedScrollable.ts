import type { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent } from "react-native";

import { useScrollTrack, type ScrollTrackOptions } from "../hooks/useScrollTrack";

/**
 * The options a tracked component takes through its `scrollTrack` prop. The
 * ref, the handlers and `inverted` are left out: a tracked component reads
 * those from its own props, exactly where the plain scrollable takes them.
 */
export type TrackedScrollTrackOptions = Omit<
    ScrollTrackOptions,
    "externalRef" | "onScroll" | "onLayout" | "onContentSizeChange" | "inverted"
>;

interface TrackedScrollableProps {
    scrollTrack?: TrackedScrollTrackOptions;
    ref?: React.Ref<any>;
    inverted?: boolean | null;
    onScroll?: ((event: NativeSyntheticEvent<NativeScrollEvent>) => void) | null;
    onLayout?: ((event: LayoutChangeEvent) => void) | null;
    onContentSizeChange?: ((width: number, height: number) => void) | null;
}

/**
 * Shared by the tracked components: runs the hook with the scrollable's own
 * ref and handlers, so they keep working alongside the track's.
 */
export const useTrackedScrollable = ({
    scrollTrack,
    ref,
    inverted,
    onScroll,
    onLayout,
    onContentSizeChange,
}: TrackedScrollableProps) =>
    useScrollTrack({
        ...scrollTrack,
        externalRef: ref ?? undefined,
        inverted: inverted ?? undefined,
        onScroll: onScroll ?? undefined,
        onLayout: onLayout ?? undefined,
        onContentSizeChange: onContentSizeChange ?? undefined,
    });
