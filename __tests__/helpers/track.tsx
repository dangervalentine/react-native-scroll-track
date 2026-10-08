import React from 'react';
import { StyleSheet } from 'react-native';
import { act, render } from '@testing-library/react-native';
import { Gesture } from 'react-native-gesture-handler';
import { getAnimatedStyle, makeMutable, type SharedValue } from 'react-native-reanimated';

import ScrollProgressTrack, { type ScrollProgressTrackProps } from '../../src/ScrollProgressTrack';

interface RecordedGesture {
    kind: string;
    handlers: Record<string, (...args: any[]) => void>;
    config: Record<string, any>;
}

/** The gestures built through the mocked gesture-handler since the last reset. */
export const gestureRegistry = Gesture as unknown as {
    __created: RecordedGesture[];
    __reset: () => void;
};

const lastOf = (kind: string) => {
    const all = gestureRegistry.__created.filter((g) => g.kind === kind);
    return all[all.length - 1];
};

export const lastPan = () => lastOf('pan');
export const lastTap = () => lastOf('tap');
export const panCount = () => gestureRegistry.__created.filter((g) => g.kind === 'pan').length;

/** Lets animations, reactions and calls scheduled to the JS thread run. */
export const advance = (ms: number) => {
    act(() => {
        jest.advanceTimersByTime(ms);
    });
};

/** The element's static and animated styles, merged the way the view sees them. */
export const styleOf = (element: any): Record<string, any> => ({
    ...(StyleSheet.flatten(element.props.style) as object),
    ...(getAnimatedStyle(element) as object),
});

export interface TrackGeometry {
    scrollY: SharedValue<number>;
    containerHeight: SharedValue<number>;
    contentHeight: SharedValue<number>;
    containerOffsetY: SharedValue<number>;
}

export const makeGeometry = ({
    container = 500,
    content = 1000,
    scroll = 0,
    offset = 0,
} = {}): TrackGeometry => ({
    scrollY: makeMutable(scroll),
    containerHeight: makeMutable(container),
    contentHeight: makeMutable(content),
    containerOffsetY: makeMutable(offset),
});

type TrackOverrides = Partial<ScrollProgressTrackProps> & { geometry?: TrackGeometry };

/**
 * Renders the track against a 500pt viewport over 1000pt of content, and hands
 * back its shared values so a test can scroll or resize it.
 */
export const renderTrack = ({ geometry = makeGeometry(), ...props }: TrackOverrides = {}) => {
    const onScrollToPosition = jest.fn();
    const element = (extra: Partial<ScrollProgressTrackProps> = {}) => (
        <ScrollProgressTrack
            onScrollToPosition={onScrollToPosition}
            {...geometry}
            {...props}
            {...extra}
        />
    );
    const view = render(element());
    // The reactions take their first reading on the next frame.
    advance(20);

    return {
        ...view,
        geometry,
        onScrollToPosition,
        update: (extra: Partial<ScrollProgressTrackProps>) => view.rerender(element(extra)),
        thumb: () => styleOf(view.getByTestId('scroll-progress-track-thumb')),
        track: () => styleOf(view.getByTestId('scroll-progress-track-track')),
        container: () => styleOf(view.getByTestId('scroll-progress-track')),
        gestures: () => view.queryByTestId('scroll-progress-track-gestures'),
        /** Moves the scroll offset, as a scroll event would. */
        scrollTo: (y: number) => {
            act(() => {
                geometry.scrollY.value = y;
            });
            advance(20);
        },
    };
};
