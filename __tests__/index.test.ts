import * as ScrollTrackLibrary from '../src/index';

describe('library exports', () => {
    it('exports the hook and its defaults', () => {
        expect(typeof ScrollTrackLibrary.useScrollTrack).toBe('function');
        expect(ScrollTrackLibrary.defaultScrollTrackOptions).toBeDefined();
    });

    it('exports the tracked components', () => {
        expect(typeof ScrollTrackLibrary.TrackedScrollView).toBe('function');
        expect(typeof ScrollTrackLibrary.TrackedFlatList).toBe('function');
        expect(typeof ScrollTrackLibrary.TrackedSectionList).toBe('function');
    });

    it('exports the track component', () => {
        expect(ScrollTrackLibrary.ScrollProgressTrack).toBeDefined();
    });

    it('exports nothing else', () => {
        expect(Object.keys(ScrollTrackLibrary).sort()).toEqual([
            'ScrollProgressTrack',
            'TrackedFlatList',
            'TrackedScrollView',
            'TrackedSectionList',
            'defaultScrollTrackOptions',
            'useScrollTrack',
        ]);
    });
});
