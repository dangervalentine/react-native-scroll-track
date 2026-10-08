import { advance, gestureRegistry, lastPan, lastTap, panCount, renderTrack, styleOf } from '../helpers/track';

/** Runs a gesture callback and lets what it scheduled to the JS thread land. */
const fire = (handler: (...args: any[]) => void, ...args: any[]) => {
    handler(...args);
    advance(20);
};

describe('scroll track gestures', () => {
    beforeEach(() => {
        gestureRegistry.__reset();
    });

    describe('tap', () => {
        it('jumps to the tapped position with an animated scroll', () => {
            const view = renderTrack();

            fire(lastTap().handlers.onEnd, { y: 125 }, true);

            expect(view.onScrollToPosition).toHaveBeenCalledWith(0.25, true);
        });

        it('mirrors the position when inverted', () => {
            const view = renderTrack({ inverted: true });

            fire(lastTap().handlers.onEnd, { y: 125 }, true);

            expect(view.onScrollToPosition).toHaveBeenCalledWith(0.75, true);
        });

        it('ignores a tap that did not complete', () => {
            const view = renderTrack();

            fire(lastTap().handlers.onEnd, { y: 125 }, false);

            expect(view.onScrollToPosition).not.toHaveBeenCalled();
        });

        it('clamps a tap outside the track', () => {
            const view = renderTrack();

            fire(lastTap().handlers.onEnd, { y: -40 }, true);
            fire(lastTap().handlers.onEnd, { y: 900 }, true);

            expect(view.onScrollToPosition).toHaveBeenNthCalledWith(1, 0, true);
            expect(view.onScrollToPosition).toHaveBeenNthCalledWith(2, 1, true);
        });
    });

    describe('disableTap', () => {
        it('builds no tap gesture, and keeps the drag', () => {
            const view = renderTrack({ disableTap: true });

            expect(lastTap()).toBeUndefined();

            const { handlers } = lastPan();
            fire(handlers.onBegin, { y: 100 });
            fire(handlers.onStart, { y: 110 });
            fire(handlers.onUpdate, { y: 250 });

            expect(view.onScrollToPosition).toHaveBeenCalledWith(0.5, false);
        });

        it('still reports presses', () => {
            const onPressStart = jest.fn();
            const onPressEnd = jest.fn();
            renderTrack({ disableTap: true, onPressStart, onPressEnd });
            const { handlers } = lastPan();

            fire(handlers.onBegin, { y: 100 });
            fire(handlers.onFinalize);

            expect(onPressStart).toHaveBeenCalledTimes(1);
            expect(onPressEnd).toHaveBeenCalledTimes(1);
        });
    });

    describe('touch strip', () => {
        const strip = (view: ReturnType<typeof renderTrack>) => styleOf(view.gestures());

        it('is 22pt wide on iOS by default, flush with the edge', () => {
            const view = renderTrack();

            expect(strip(view)).toMatchObject({ width: 22, right: 0 });
            expect(view.container().width).toBe(22);
        });

        it('takes its width from touchWidth', () => {
            const view = renderTrack({ touchWidth: 8 });

            expect(strip(view).width).toBe(8);
            expect(view.container().width).toBe(8);
        });

        it('is never narrower than the track', () => {
            const view = renderTrack({ touchWidth: 2, styling: { trackWidth: 6 } });

            expect(strip(view).width).toBe(6);
        });

        it('shrinks the container to the track when gestures are off', () => {
            const view = renderTrack({ disableGestures: true, styling: { trackWidth: 6 } });

            expect(view.container().width).toBe(6);
        });
    });

    describe('scrub gating', () => {
        it('sends the first update of a scrub immediately, without animation', () => {
            const view = renderTrack();
            const { handlers } = lastPan();

            fire(handlers.onBegin, { y: 100 });
            // The pan only activates past activeOffsetY, so by the time an
            // update arrives the finger has already travelled; never gate it.
            fire(handlers.onUpdate, { y: 101 });

            expect(view.onScrollToPosition).toHaveBeenCalledTimes(1);
            expect(view.onScrollToPosition).toHaveBeenCalledWith(101 / 500, false);
        });

        it('drops later updates that have not moved far enough to matter', () => {
            const view = renderTrack();
            const { handlers } = lastPan();

            fire(handlers.onBegin, { y: 100 });
            fire(handlers.onUpdate, { y: 110 });
            view.onScrollToPosition.mockClear();

            fire(handlers.onUpdate, { y: 110.5 });
            fire(handlers.onUpdate, { y: 111 });

            expect(view.onScrollToPosition).not.toHaveBeenCalled();
        });

        it('sends an update once the finger has moved a meaningful distance', () => {
            const view = renderTrack();
            const { handlers } = lastPan();

            fire(handlers.onBegin, { y: 100 });
            fire(handlers.onUpdate, { y: 110 });
            view.onScrollToPosition.mockClear();

            fire(handlers.onUpdate, { y: 160 });

            expect(view.onScrollToPosition).toHaveBeenCalledWith(160 / 500, false);
        });

        it('flushes the final position on release so the gate cannot swallow it', () => {
            const view = renderTrack();
            const { handlers } = lastPan();

            fire(handlers.onBegin, { y: 100 });
            fire(handlers.onUpdate, { y: 110 });
            fire(handlers.onUpdate, { y: 111 });
            view.onScrollToPosition.mockClear();

            fire(handlers.onFinalize);

            expect(view.onScrollToPosition).toHaveBeenCalledTimes(1);
            expect(view.onScrollToPosition).toHaveBeenCalledWith(111 / 500, false);
        });

        it('does not flush when the finger never moved', () => {
            const view = renderTrack();
            const { handlers } = lastPan();

            fire(handlers.onBegin, { y: 100 });
            fire(handlers.onFinalize);

            expect(view.onScrollToPosition).not.toHaveBeenCalled();
        });

        it('respects inverted when gating and flushing', () => {
            const view = renderTrack({ inverted: true });
            const { handlers } = lastPan();

            fire(handlers.onBegin, { y: 100 });
            fire(handlers.onUpdate, { y: 150 });
            expect(view.onScrollToPosition).toHaveBeenLastCalledWith(1 - 150 / 500, false);

            fire(handlers.onUpdate, { y: 151 });
            fire(handlers.onFinalize);
            expect(view.onScrollToPosition).toHaveBeenLastCalledWith(1 - 151 / 500, false);
        });

        it('measures against the viewport as it is now', () => {
            const view = renderTrack();
            view.geometry.containerHeight.value = 250;
            advance(20);

            fire(lastTap().handlers.onEnd, { y: 125 }, true);

            expect(view.onScrollToPosition).toHaveBeenCalledWith(0.5, true);
        });
    });

    describe('dragging', () => {
        it('shows the track for the length of a drag, then fades it out', () => {
            const view = renderTrack({ fadeOutDelay: 1000 });
            const { handlers } = lastPan();

            fire(handlers.onBegin, { y: 100 });
            fire(handlers.onStart, { y: 110 });
            advance(200);
            expect(view.thumb().opacity).toBeCloseTo(0.8);

            // Held still for longer than the fade delay: still shown.
            advance(5000);
            expect(view.thumb().opacity).toBeCloseTo(0.8);

            fire(handlers.onFinalize);
            advance(900);
            expect(view.thumb().opacity).toBeCloseTo(0.8);

            advance(1000);
            expect(view.thumb().opacity).toBe(0);
        });

        it('lifts the thumb shadow while dragging', () => {
            const view = renderTrack();
            const { handlers } = lastPan();
            expect(view.thumb()).toMatchObject({ shadowOpacity: 0.3, shadowRadius: 4 });

            fire(handlers.onBegin, { y: 100 });
            fire(handlers.onStart, { y: 110 });
            expect(view.thumb().shadowOpacity).toBeCloseTo(0.39);
            expect(view.thumb().shadowRadius).toBe(6);

            fire(handlers.onFinalize);
            expect(view.thumb()).toMatchObject({ shadowOpacity: 0.3, shadowRadius: 4 });
        });

        it('leaves a touch that never became a drag alone', () => {
            const view = renderTrack();
            const { handlers } = lastPan();

            fire(handlers.onBegin, { y: 100 });
            fire(handlers.onFinalize);
            advance(200);

            expect(view.thumb().opacity).toBe(0);
        });
    });

    describe('press callbacks', () => {
        it('calls onPressStart on touch down and onPressEnd on release, once each', () => {
            const onPressStart = jest.fn();
            const onPressEnd = jest.fn();
            renderTrack({ onPressStart, onPressEnd });
            const { handlers } = lastPan();

            fire(handlers.onBegin, { y: 100 });
            expect(onPressStart).toHaveBeenCalledTimes(1);
            expect(onPressEnd).not.toHaveBeenCalled();

            fire(handlers.onFinalize);
            expect(onPressStart).toHaveBeenCalledTimes(1);
            expect(onPressEnd).toHaveBeenCalledTimes(1);
        });

        it('works without any callbacks', () => {
            renderTrack();
            const { handlers } = lastPan();

            expect(() => {
                fire(handlers.onBegin, { y: 100 });
                fire(handlers.onStart, { y: 110 });
                fire(handlers.onUpdate, { y: 150 });
                fire(handlers.onFinalize);
            }).not.toThrow();
        });
    });

    describe('gesture overlay interactivity', () => {
        const pointerEvents = (view: ReturnType<typeof renderTrack>) =>
            view.gestures()?.props.pointerEvents;

        it('ignores touches while the track is hidden', () => {
            const view = renderTrack();

            expect(pointerEvents(view)).toBe('none');
        });

        it('accepts touches while the track is shown, and until it has faded out', () => {
            const view = renderTrack({ fadeOutDelay: 1000 });

            view.scrollTo(100);
            advance(200);
            expect(pointerEvents(view)).toBe('auto');

            // Part-way through the fade: still grabbable.
            advance(1000);
            expect(pointerEvents(view)).toBe('auto');

            advance(1000);
            expect(pointerEvents(view)).toBe('none');
        });

        it('stays interactive when alwaysVisible is set', () => {
            const view = renderTrack({ alwaysVisible: true });

            advance(5000);

            expect(pointerEvents(view)).toBe('auto');
        });

        it('renders no gesture overlay when gestures are disabled', () => {
            const view = renderTrack({ disableGestures: true });

            expect(view.gestures()).toBeNull();
        });
    });

    describe('gesture stability', () => {
        it('does not rebuild the gesture when unrelated props change', () => {
            const view = renderTrack();
            const before = panCount();

            view.update({ styling: { thumbColor: '#123456' } });
            view.scrollTo(200);

            expect(panCount()).toBe(before);
        });

        it('does not rebuild the gesture for inline callbacks', () => {
            const view = renderTrack({ onPressStart: () => {} });
            const before = panCount();

            view.update({ onPressStart: () => {}, onScrollToPosition: () => {} });

            expect(panCount()).toBe(before);
        });

        it('calls the latest callback even though the gesture is cached', () => {
            const first = jest.fn();
            const second = jest.fn();
            const view = renderTrack({ onScrollToPosition: first });

            view.update({ onScrollToPosition: second });
            fire(lastTap().handlers.onEnd, { y: 250 }, true);

            expect(first).not.toHaveBeenCalled();
            expect(second).toHaveBeenCalledWith(0.5, true);
        });
    });

    describe('edge-gesture guards', () => {
        it('fails the pan on horizontal movement so the back swipe wins', () => {
            renderTrack();

            expect(lastPan().config.failOffsetX).toEqual([-4, 4]);
        });

        it('activates only after meaningful vertical movement', () => {
            renderTrack();

            expect(lastPan().config.activeOffsetY).toEqual([-6, 6]);
        });

        it('applies hitSlop to both gestures', () => {
            renderTrack({ hitSlop: 30 });

            expect(lastPan().config.hitSlop).toBe(30);
            expect(lastTap().config.hitSlop).toBe(30);
        });
    });
});
