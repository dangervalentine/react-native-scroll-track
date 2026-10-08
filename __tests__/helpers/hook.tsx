import { act, renderHook } from '@testing-library/react-native';

import { useScrollTrack, type ScrollTrackOptions } from '../../src/hooks/useScrollTrack';
import { scrollEvent } from './scrollEvent';

/**
 * Renders the hook and hands back helpers that feed it what a scrollable would:
 * its layout, its content size and its scroll events.
 */
export const renderScrollTrack = (initial: ScrollTrackOptions = {}) => {
    let renders = 0;
    const hook = renderHook(
        (options: ScrollTrackOptions) => {
            renders += 1;
            return useScrollTrack(options);
        },
        { initialProps: initial }
    );

    return {
        ...hook,
        current: () => hook.result.current,
        renders: () => renders,
        /** Lays the scrollable out and reports its content size. */
        measure: ({ container = 500, content = 1000, y = 0 } = {}) => {
            act(() => {
                hook.result.current.scrollProps.onLayout({ nativeEvent: { layout: { height: container, y } } });
                hook.result.current.scrollProps.onContentSizeChange(300, content);
            });
        },
        scroll: (y: number) => {
            act(() => {
                hook.result.current.scrollProps.onScroll(scrollEvent({ y }));
            });
        },
    };
};
