import { makeGeometry, renderTrack } from '../helpers/track';

describe('thumb sizing through the public styling API', () => {
    it('sizes the thumb proportionally when nothing is configured', () => {
        // 500 of 1000 visible -> half the track.
        const view = renderTrack();

        expect(view.thumb().height).toBe(250);
    });

    it('caps the proportional thumb at 80% of the track', () => {
        // 500 of 550 visible would be 91% of the track.
        const view = renderTrack({ geometry: makeGeometry({ container: 500, content: 550 }) });

        expect(view.thumb().height).toBe(400);
    });

    it('honours styling.thumbHeight', () => {
        const view = renderTrack({ styling: { thumbHeight: 60 } });

        expect(view.thumb().height).toBe(60);
    });

    it('honours styling.minThumbHeight on a long list', () => {
        // 500 of 50000 visible would be a 5pt thumb.
        const view = renderTrack({
            geometry: makeGeometry({ container: 500, content: 50000 }),
            styling: { minThumbHeight: 48 },
        });

        expect(view.thumb().height).toBe(48);
    });

    it('lets styling.thumbHeight win over styling.minThumbHeight', () => {
        const view = renderTrack({ styling: { thumbHeight: 30, minThumbHeight: 48 } });

        expect(view.thumb().height).toBe(30);
    });

    it('travels the room a fixed thumb leaves', () => {
        const view = renderTrack({ styling: { thumbHeight: 100 } });

        view.scrollTo(500);

        expect(view.thumb().transform).toEqual([{ translateY: 400 }]);
    });
});
