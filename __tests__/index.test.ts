import {
    ScrollableContainer,
    ScrollProgressTrack,
    useAnimatedScrollPosition,
    useScrollTrack,
    defaultScrollTrackOptions,
} from '../src';

// Type-only imports for testing
import type {
    ScrollableContainerProps,
    ScrollProgressTrackProps,
    ScrollTrackOptions,
} from '../src';

describe('Library Exports', () => {
    describe('Component exports', () => {
        it('should export ScrollableContainer', () => {
            expect(ScrollableContainer).toBeDefined();
            expect(typeof ScrollableContainer).toBe('function');
        });

        it('should export ScrollProgressTrack', () => {
            expect(ScrollProgressTrack).toBeDefined();
            expect(typeof ScrollProgressTrack).toBe('function');
        });
    });

    describe('Hook exports', () => {
        it('should export useAnimatedScrollPosition', () => {
            expect(useAnimatedScrollPosition).toBeDefined();
            expect(typeof useAnimatedScrollPosition).toBe('function');
        });

        it('should export useScrollTrack', () => {
            expect(useScrollTrack).toBeDefined();
            expect(typeof useScrollTrack).toBe('function');
        });
    });

    describe('Configuration exports', () => {
        it('should export defaultScrollTrackOptions', () => {
            expect(defaultScrollTrackOptions).toBeDefined();
            expect(typeof defaultScrollTrackOptions).toBe('object');

            // Verify default values
            expect(defaultScrollTrackOptions.alwaysVisible).toBe(false);
            expect(defaultScrollTrackOptions.fadeOutDelay).toBe(1000);
            expect(defaultScrollTrackOptions.scrollThrottle).toBe(1);
            expect(defaultScrollTrackOptions.styling.thumbColor).toBe('#00CED1');
            expect(defaultScrollTrackOptions.styling.trackWidth).toBe(4);
        });
    });

    describe('Type exports', () => {
        it('should have proper TypeScript types', () => {
            // This test ensures TypeScript compilation works
            // Types are tested at compile time

            const mockScrollableContainerProps: ScrollableContainerProps = {
                children: () => null,
            };

            const mockScrollProgressTrackProps: ScrollProgressTrackProps = {
                containerHeight: 500,
                contentHeight: 1000,
                onScrollToPosition: jest.fn(),
                scrollPosition: 0,
            };

            const mockScrollTrackOptions: ScrollTrackOptions = {
                alwaysVisible: false,
                fadeOutDelay: 1000,
            };

            expect(mockScrollableContainerProps).toBeDefined();
            expect(mockScrollProgressTrackProps).toBeDefined();
            expect(mockScrollTrackOptions).toBeDefined();
        });
    });
});
