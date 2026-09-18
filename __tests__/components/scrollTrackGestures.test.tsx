import React from 'react';
import { render } from '@testing-library/react-native';
import { Animated } from 'react-native';
import { Gesture } from 'react-native-gesture-handler';
import ScrollProgressTrack from '../../src/ScrollProgressTrack';

const gestureRegistry = Gesture as unknown as {
    __created: Array<{
        kind: string;
        handlers: Record<string, (event?: any) => void>;
        config: Record<string, any>;
    }>;
    __reset: () => void;
};

const panGestures = () => gestureRegistry.__created.filter((g) => g.kind === 'pan');
const lastPan = () => panGestures()[panGestures().length - 1];

/**
 * The gesture overlay is the childless node declaring pointerEvents; the
 * visuals layer declares it too, but holds the thumb.
 */
const overlayPointerEvents = (tree: any): string | undefined => {
    const found: string[] = [];
    const walk = (node: any) => {
        if (!node || typeof node !== 'object') return;
        const children = node.children || [];
        if (node.props?.pointerEvents && children.length === 0) {
            found.push(node.props.pointerEvents);
        }
        children.forEach(walk);
    };
    walk(tree);
    expect(found).toHaveLength(1);
    return found[0];
};

describe('scroll track gestures', () => {
    beforeAll(() => jest.useRealTimers());
    afterAll(() => jest.useFakeTimers());

    const defaultProps = {
        containerHeight: 500,
        contentHeight: 1000,
        scrollPosition: 0,
        animatedScrollPosition: new Animated.Value(0),
    };

    beforeEach(() => {
        gestureRegistry.__reset();
        jest.clearAllMocks();
    });

    describe('scrub gating', () => {
        it('sends the first update of a scrub immediately', () => {
            const onScrollToPosition = jest.fn();
            render(
                <ScrollProgressTrack {...defaultProps} onScrollToPosition={onScrollToPosition} />
            );

            const { handlers } = lastPan();
            handlers.onBegin({ y: 100 });
            onScrollToPosition.mockClear();

            // The pan only activates past activeOffsetY, so by the time an
            // update arrives the finger has already travelled; never gate it.
            handlers.onUpdate({ y: 101 });

            expect(onScrollToPosition).toHaveBeenCalledTimes(1);
        });

        it('drops later updates that have not moved far enough to matter', () => {
            const onScrollToPosition = jest.fn();
            render(
                <ScrollProgressTrack {...defaultProps} onScrollToPosition={onScrollToPosition} />
            );

            const { handlers } = lastPan();
            handlers.onBegin({ y: 100 });
            handlers.onUpdate({ y: 150 });
            onScrollToPosition.mockClear();

            // 1px and 1.5px on a 500px track: under both the pixel and ratio gates.
            handlers.onUpdate({ y: 151 });
            handlers.onUpdate({ y: 151.5 });

            expect(onScrollToPosition).not.toHaveBeenCalled();
        });

        it('sends an update once the finger has moved a meaningful distance', () => {
            const onScrollToPosition = jest.fn();
            render(
                <ScrollProgressTrack {...defaultProps} onScrollToPosition={onScrollToPosition} />
            );

            const { handlers } = lastPan();
            handlers.onBegin({ y: 100 });
            onScrollToPosition.mockClear();

            handlers.onUpdate({ y: 150 });

            expect(onScrollToPosition).toHaveBeenCalledTimes(1);
            expect(onScrollToPosition).toHaveBeenCalledWith(0.3);
        });

        it('flushes the final position on release so the gate cannot swallow it', () => {
            const onScrollToPosition = jest.fn();
            render(
                <ScrollProgressTrack {...defaultProps} onScrollToPosition={onScrollToPosition} />
            );

            const { handlers } = lastPan();
            handlers.onBegin({ y: 100 });
            handlers.onUpdate({ y: 150 });
            onScrollToPosition.mockClear();

            handlers.onUpdate({ y: 151 }); // gated
            expect(onScrollToPosition).not.toHaveBeenCalled();

            handlers.onFinalize();
            expect(onScrollToPosition).toHaveBeenCalledWith(151 / 500);
        });

        it('does not flush when the finger never moved', () => {
            const onScrollToPosition = jest.fn();
            render(
                <ScrollProgressTrack {...defaultProps} onScrollToPosition={onScrollToPosition} />
            );

            const { handlers } = lastPan();
            handlers.onBegin({ y: 100 });
            onScrollToPosition.mockClear();

            handlers.onFinalize();
            expect(onScrollToPosition).not.toHaveBeenCalled();
        });

        it('respects inverted when gating and flushing', () => {
            const onScrollToPosition = jest.fn();
            render(
                <ScrollProgressTrack
                    {...defaultProps}
                    inverted
                    onScrollToPosition={onScrollToPosition}
                />
            );

            const { handlers } = lastPan();
            handlers.onBegin({ y: 100 });
            handlers.onUpdate({ y: 150 });

            expect(onScrollToPosition).toHaveBeenCalledWith(1 - 0.3);
        });
    });

    describe('gesture overlay interactivity', () => {
        it('accepts touches while the track is visible', () => {
            const { toJSON } = render(
                <ScrollProgressTrack {...defaultProps} onScrollToPosition={jest.fn()} visible />
            );
            expect(overlayPointerEvents(toJSON())).toBe('auto');
        });

        it('goes inert once the track has faded out', () => {
            const { toJSON } = render(
                <ScrollProgressTrack
                    {...defaultProps}
                    onScrollToPosition={jest.fn()}
                    visible={false}
                />
            );
            expect(overlayPointerEvents(toJSON())).toBe('none');
        });

        it('stays interactive when alwaysVisible is set', () => {
            const { toJSON } = render(
                <ScrollProgressTrack
                    {...defaultProps}
                    onScrollToPosition={jest.fn()}
                    alwaysVisible
                    visible={false}
                />
            );
            expect(overlayPointerEvents(toJSON())).toBe('auto');
        });
    });

    describe('gesture stability', () => {
        it('does not rebuild the gesture when unrelated props change', () => {
            const { rerender } = render(
                <ScrollProgressTrack
                    {...defaultProps}
                    onScrollToPosition={jest.fn()}
                    styling={{ thumbColor: 'red' }}
                />
            );
            expect(panGestures()).toHaveLength(1);

            rerender(
                <ScrollProgressTrack
                    {...defaultProps}
                    onScrollToPosition={jest.fn()}
                    styling={{ thumbColor: 'blue' }}
                />
            );

            expect(panGestures()).toHaveLength(1);
        });

        it('does not rebuild the gesture for inline callbacks', () => {
            const { rerender } = render(
                <ScrollProgressTrack
                    {...defaultProps}
                    onScrollToPosition={() => { }}
                    onPressStart={() => { }}
                />
            );
            expect(panGestures()).toHaveLength(1);

            rerender(
                <ScrollProgressTrack
                    {...defaultProps}
                    onScrollToPosition={() => { }}
                    onPressStart={() => { }}
                />
            );

            expect(panGestures()).toHaveLength(1);
        });

        it('calls the latest callback even though the gesture is cached', () => {
            const first = jest.fn();
            const second = jest.fn();

            const { rerender } = render(
                <ScrollProgressTrack {...defaultProps} onScrollToPosition={first} />
            );
            rerender(<ScrollProgressTrack {...defaultProps} onScrollToPosition={second} />);

            const { handlers } = lastPan();
            handlers.onBegin({ y: 100 });
            handlers.onUpdate({ y: 150 });

            expect(second).toHaveBeenCalledWith(0.3);
            expect(first).not.toHaveBeenCalled();
        });
    });

    describe('edge-gesture guards', () => {
        it('fails the pan on horizontal movement so the back swipe wins', () => {
            render(<ScrollProgressTrack {...defaultProps} onScrollToPosition={jest.fn()} />);
            expect(lastPan().config.failOffsetX).toEqual([-4, 4]);
        });

        it('activates only after meaningful vertical movement', () => {
            render(<ScrollProgressTrack {...defaultProps} onScrollToPosition={jest.fn()} />);
            expect(lastPan().config.activeOffsetY).toEqual([-6, 6]);
        });
    });
});
