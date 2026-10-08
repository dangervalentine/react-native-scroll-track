import { advance, gestureRegistry, makeGeometry, renderTrack } from '../helpers/track';

describe('ScrollProgressTrack', () => {
    beforeEach(() => {
        gestureRegistry.__reset();
    });

    describe('layout', () => {
        it('spans the viewport of the scrollable', () => {
            const view = renderTrack({ geometry: makeGeometry({ container: 500, offset: 64 }) });

            expect(view.container()).toMatchObject({ position: 'absolute', right: 0, top: 64, height: 500 });
        });

        it('sits at the top of its parent when given no offset', () => {
            const { containerOffsetY: _unused, ...geometry } = makeGeometry();
            const view = renderTrack({ geometry: geometry as any });

            expect(view.container().top).toBe(0);
        });

        it('follows a viewport that changes height', () => {
            const view = renderTrack();

            view.geometry.containerHeight.value = 320;
            advance(20);

            expect(view.container().height).toBe(320);
        });
    });

    describe('styling', () => {
        it('applies the defaults', () => {
            const view = renderTrack({ alwaysVisible: true });

            expect(view.container().zIndex).toBe(1000);
            expect(view.track()).toMatchObject({ width: 4, backgroundColor: '#637777', opacity: 0.3 });
            expect(view.thumb()).toMatchObject({
                width: 4,
                backgroundColor: '#00CED1',
                borderRadius: 0,
                opacity: 0.8,
                shadowColor: '#000000',
                shadowOpacity: 0.3,
                shadowRadius: 4,
            });
        });

        it('applies custom styling', () => {
            const view = renderTrack({
                alwaysVisible: true,
                styling: {
                    trackWidth: 8,
                    thumbColor: '#ff0000',
                    trackColor: '#00ff00',
                    trackOpacity: 0.5,
                    thumbOpacity: 1,
                    thumbBorderRadius: 4,
                    zIndex: 5,
                    thumbShadow: { color: '#111111', opacity: 0.6, radius: 2, offset: { width: 1, height: 1 } },
                },
            });

            expect(view.container().zIndex).toBe(5);
            expect(view.track()).toMatchObject({ width: 8, backgroundColor: '#00ff00', opacity: 0.5 });
            expect(view.thumb()).toMatchObject({
                width: 8,
                backgroundColor: '#ff0000',
                borderRadius: 4,
                opacity: 1,
                shadowColor: '#111111',
                shadowOpacity: 0.6,
                shadowRadius: 2,
            });
        });

        it('draws the track and the thumb at full width, flush with the edge', () => {
            const view = renderTrack({ styling: { trackWidth: 6 } });

            expect(view.track()).toMatchObject({ position: 'absolute', right: 0, width: 6 });
            expect(view.thumb()).toMatchObject({ position: 'absolute', right: 0, width: 6 });
            // Wide enough to hold them: nothing hangs over the edge.
            expect(view.container().width).toBeGreaterThanOrEqual(6);
        });

        it('leaves the track background out when trackVisible is false', () => {
            const view = renderTrack({ styling: { trackVisible: false } });

            expect(view.queryByTestId('scroll-progress-track-track')).toBeNull();
            expect(view.getByTestId('scroll-progress-track-thumb')).toBeTruthy();
        });

        it('uses a custom testID', () => {
            const view = renderTrack({ testID: 'my-track' });

            expect(view.getByTestId('my-track')).toBeTruthy();
            expect(view.getByTestId('my-track-thumb')).toBeTruthy();
        });
    });

    describe('thumb position', () => {
        it('starts at the top and ends at the bottom of the track', () => {
            // 500 of 1000 visible: a 250pt thumb with 250pt of travel.
            const view = renderTrack();
            expect(view.thumb()).toMatchObject({ height: 250, transform: [{ translateY: 0 }] });

            view.scrollTo(250);
            expect(view.thumb().transform).toEqual([{ translateY: 125 }]);

            view.scrollTo(500);
            expect(view.thumb().transform).toEqual([{ translateY: 250 }]);
        });

        it('clamps an overscroll at either end', () => {
            const view = renderTrack();

            view.scrollTo(-80);
            expect(view.thumb().transform).toEqual([{ translateY: 0 }]);

            view.scrollTo(900);
            expect(view.thumb().transform).toEqual([{ translateY: 250 }]);
        });

        it('runs the other way when inverted', () => {
            const view = renderTrack({ inverted: true });
            expect(view.thumb().transform).toEqual([{ translateY: 250 }]);

            view.scrollTo(500);
            expect(view.thumb().transform).toEqual([{ translateY: 0 }]);
        });

        it('resizes the thumb when the content grows', () => {
            const view = renderTrack();

            view.geometry.contentHeight.value = 2000;
            advance(20);

            expect(view.thumb().height).toBe(125);
        });
    });

    describe('showing and hiding', () => {
        it('starts hidden', () => {
            const view = renderTrack();

            expect(view.thumb().opacity).toBe(0);
            expect(view.track().opacity).toBe(0);
        });

        it('shows on scroll and fades out after fadeOutDelay', () => {
            const view = renderTrack({ fadeOutDelay: 1000 });

            view.scrollTo(100);
            advance(200);
            expect(view.thumb().opacity).toBeCloseTo(0.8);
            expect(view.track().opacity).toBeCloseTo(0.3);

            advance(700);
            expect(view.thumb().opacity).toBeCloseTo(0.8);

            advance(1000);
            expect(view.thumb().opacity).toBe(0);
            expect(view.track().opacity).toBe(0);
        });

        it('stays shown while scrolling continues', () => {
            const view = renderTrack({ fadeOutDelay: 1000 });

            view.scrollTo(100);
            advance(800);
            view.scrollTo(200);
            advance(800);
            view.scrollTo(300);
            advance(800);

            expect(view.thumb().opacity).toBeCloseTo(0.8);

            advance(1500);
            expect(view.thumb().opacity).toBe(0);
        });

        it('honours a custom fadeOutDelay', () => {
            const view = renderTrack({ fadeOutDelay: 3000 });

            view.scrollTo(100);
            advance(2500);
            expect(view.thumb().opacity).toBeCloseTo(0.8);

            advance(1500);
            expect(view.thumb().opacity).toBe(0);
        });

        it('ignores a scroll too small to matter', () => {
            const view = renderTrack();

            view.scrollTo(5);
            advance(200);

            expect(view.thumb().opacity).toBe(0);
        });

        it('never hides when alwaysVisible is set', () => {
            const view = renderTrack({ alwaysVisible: true });
            expect(view.thumb().opacity).toBeCloseTo(0.8);

            view.scrollTo(100);
            advance(10000);

            expect(view.thumb().opacity).toBeCloseTo(0.8);
        });

        it('follows alwaysVisible when it changes', () => {
            const view = renderTrack();
            expect(view.thumb().opacity).toBe(0);

            view.update({ alwaysVisible: true });
            advance(20);
            expect(view.thumb().opacity).toBeCloseTo(0.8);

            view.update({ alwaysVisible: false });
            advance(20);
            expect(view.thumb().opacity).toBe(0);
        });
    });
});
