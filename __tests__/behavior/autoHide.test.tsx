import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { useScrollTrack } from '../../src/hooks/useScrollTrack';

// Mock the ScrollProgressTrack component and animated scroll position
jest.mock('../../src/ScrollProgressTrack', () => {
    return function MockScrollProgressTrack(props) {
        return React.createElement('ScrollProgressTrack', {
            ...props,
            testID: 'scroll-progress-track'
        });
    };
});

jest.mock('../../src/hooks/useAnimatedScrollPosition', () => ({
    useAnimatedScrollPosition: () => ({
        createScrollHandler: jest.fn(() => jest.fn()),
        rawScrollValue: global.mockAnimatedValue(),
        setScrollValue: jest.fn(),
    }),
}));

describe('Auto-hide Behavior Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.clearAllTimers();
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
    });

    describe('Default auto-hide behavior', () => {
        it('should auto-hide after default fadeOutDelay', () => {
            const { result } = renderHook(() => useScrollTrack());

            // Make content scrollable
            act(() => {
                result.current.scrollProps.onLayout({
                    nativeEvent: { layout: { height: 500 } },
                });
                result.current.scrollProps.onContentSizeChange(0, 1000);
            });

            // Initially should be hidden
            expect(result.current.isVisible).toBe(false);

            // Simulate scroll event
            act(() => {
                result.current.scrollProps.onScroll({
                    nativeEvent: {
                        contentOffset: { y: 100 },
                        layoutMeasurement: { height: 500 },
                        contentSize: { height: 1000 },
                    },
                });
            });

            // Should be visible after scroll
            expect(result.current.isVisible).toBe(true);

            // Fast forward to just before default fadeOutDelay (1000ms)
            act(() => {
                jest.advanceTimersByTime(999);
            });

            // Should still be visible
            expect(result.current.isVisible).toBe(true);

            // Fast forward past fadeOutDelay
            act(() => {
                jest.advanceTimersByTime(1);
            });

            // Should now be hidden
            expect(result.current.isVisible).toBe(false);
        });

        it('should use custom fadeOutDelay', () => {
            const { result } = renderHook(() => useScrollTrack({ fadeOutDelay: 2000 }));

            // Make content scrollable
            act(() => {
                result.current.scrollProps.onLayout({
                    nativeEvent: { layout: { height: 500 } },
                });
                result.current.scrollProps.onContentSizeChange(0, 1000);
            });

            // Simulate scroll event
            act(() => {
                result.current.scrollProps.onScroll({
                    nativeEvent: {
                        contentOffset: { y: 100 },
                        layoutMeasurement: { height: 500 },
                        contentSize: { height: 1000 },
                    },
                });
            });

            // Should be visible after scroll
            expect(result.current.isVisible).toBe(true);

            // Fast forward to just before custom fadeOutDelay (2000ms)
            act(() => {
                jest.advanceTimersByTime(1999);
            });

            // Should still be visible
            expect(result.current.isVisible).toBe(true);

            // Fast forward past custom fadeOutDelay
            act(() => {
                jest.advanceTimersByTime(1);
            });

            // Should now be hidden
            expect(result.current.isVisible).toBe(false);
        });

        it('should never auto-hide when alwaysVisible is true', () => {
            const { result } = renderHook(() => useScrollTrack({ alwaysVisible: true }));

            // Make content scrollable
            act(() => {
                result.current.scrollProps.onLayout({
                    nativeEvent: { layout: { height: 500 } },
                });
                result.current.scrollProps.onContentSizeChange(0, 1000);
            });

            // Simulate scroll event
            act(() => {
                result.current.scrollProps.onScroll({
                    nativeEvent: {
                        contentOffset: { y: 100 },
                        layoutMeasurement: { height: 500 },
                        contentSize: { height: 1000 },
                    },
                });
            });

            // Should be visible after scroll
            expect(result.current.isVisible).toBe(true);

            // Fast forward well beyond normal fadeOutDelay
            act(() => {
                jest.advanceTimersByTime(10000);
            });

            // Should still be visible
            expect(result.current.isVisible).toBe(true);
        });
    });

    describe('Timer reset behavior', () => {
        it('should reset timer on new scroll events', () => {
            const { result } = renderHook(() => useScrollTrack({ fadeOutDelay: 1000 }));

            // Make content scrollable
            act(() => {
                result.current.scrollProps.onLayout({
                    nativeEvent: { layout: { height: 500 } },
                });
                result.current.scrollProps.onContentSizeChange(0, 1000);
            });

            // First scroll event
            act(() => {
                result.current.scrollProps.onScroll({
                    nativeEvent: {
                        contentOffset: { y: 100 },
                        layoutMeasurement: { height: 500 },
                        contentSize: { height: 1000 },
                    },
                });
            });

            // Wait 800ms
            act(() => {
                jest.advanceTimersByTime(800);
            });

            // Should still be visible
            expect(result.current.isVisible).toBe(true);

            // Second scroll event - should reset timer
            act(() => {
                result.current.scrollProps.onScroll({
                    nativeEvent: {
                        contentOffset: { y: 200 },
                        layoutMeasurement: { height: 500 },
                        contentSize: { height: 1000 },
                    },
                });
            });

            // Wait another 800ms (total 1600ms from first scroll)
            act(() => {
                jest.advanceTimersByTime(800);
            });

            // Should still be visible because timer was reset
            expect(result.current.isVisible).toBe(true);

            // Wait remaining 200ms to complete the second timer
            act(() => {
                jest.advanceTimersByTime(200);
            });

            // Now should be hidden
            expect(result.current.isVisible).toBe(false);
        });

        it('should reset timer on multiple rapid scroll events', () => {
            const { result } = renderHook(() => useScrollTrack({ fadeOutDelay: 1000 }));

            // Make content scrollable
            act(() => {
                result.current.scrollProps.onLayout({
                    nativeEvent: { layout: { height: 500 } },
                });
                result.current.scrollProps.onContentSizeChange(0, 1000);
            });

            // Simulate rapid scroll events
            act(() => {
                for (let i = 0; i < 10; i++) {
                    result.current.scrollProps.onScroll({
                        nativeEvent: {
                            contentOffset: { y: i * 50 },
                            layoutMeasurement: { height: 500 },
                            contentSize: { height: 1000 },
                        },
                    });
                    jest.advanceTimersByTime(50); // Small increments
                }
            });

            // Should still be visible after rapid scrolling
            expect(result.current.isVisible).toBe(true);

            // Wait for full fadeOutDelay from the last scroll event
            act(() => {
                jest.advanceTimersByTime(1000);
            });

            // Should now be hidden
            expect(result.current.isVisible).toBe(false);
        });
    });

    describe('Content size change behavior', () => {
        it('should hide when content becomes non-scrollable', () => {
            const { result } = renderHook(() => useScrollTrack({ fadeOutDelay: 1000 }));

            // Make content scrollable
            act(() => {
                result.current.scrollProps.onLayout({
                    nativeEvent: { layout: { height: 500 } },
                });
                result.current.scrollProps.onContentSizeChange(0, 1000);
            });

            // Simulate scroll event
            act(() => {
                result.current.scrollProps.onScroll({
                    nativeEvent: {
                        contentOffset: { y: 100 },
                        layoutMeasurement: { height: 500 },
                        contentSize: { height: 1000 },
                    },
                });
            });

            // Should be visible
            expect(result.current.isVisible).toBe(true);

            // Make content non-scrollable
            act(() => {
                result.current.scrollProps.onContentSizeChange(0, 400);
            });

            // Should immediately be hidden when content becomes non-scrollable
            expect(result.current.isVisible).toBe(false);
        });

        it('should show when content becomes scrollable again', () => {
            const { result } = renderHook(() => useScrollTrack({ fadeOutDelay: 1000 }));

            // Start with non-scrollable content
            act(() => {
                result.current.scrollProps.onLayout({
                    nativeEvent: { layout: { height: 500 } },
                });
                result.current.scrollProps.onContentSizeChange(0, 400);
            });

            // Should not be visible
            expect(result.current.isVisible).toBe(false);

            // Make content scrollable
            act(() => {
                result.current.scrollProps.onContentSizeChange(0, 1000);
            });

            // Should still not be visible until there's a scroll event
            expect(result.current.isVisible).toBe(false);

            // Simulate scroll event
            act(() => {
                result.current.scrollProps.onScroll({
                    nativeEvent: {
                        contentOffset: { y: 100 },
                        layoutMeasurement: { height: 500 },
                        contentSize: { height: 1000 },
                    },
                });
            });

            // Should now be visible
            expect(result.current.isVisible).toBe(true);
        });
    });

    describe('Edge cases', () => {
        it('should handle zero fadeOutDelay', () => {
            const { result } = renderHook(() => useScrollTrack({ fadeOutDelay: 0 }));

            // Make content scrollable
            act(() => {
                result.current.scrollProps.onLayout({
                    nativeEvent: { layout: { height: 500 } },
                });
                result.current.scrollProps.onContentSizeChange(0, 1000);
            });

            // Simulate scroll event
            act(() => {
                result.current.scrollProps.onScroll({
                    nativeEvent: {
                        contentOffset: { y: 100 },
                        layoutMeasurement: { height: 500 },
                        contentSize: { height: 1000 },
                    },
                });
            });

            // Should be visible immediately after scroll
            expect(result.current.isVisible).toBe(true);

            // Should hide immediately (no delay)
            act(() => {
                jest.advanceTimersByTime(0);
            });

            expect(result.current.isVisible).toBe(false);
        });

        it('should handle very large fadeOutDelay', () => {
            const { result } = renderHook(() => useScrollTrack({ fadeOutDelay: 50000 }));

            // Make content scrollable
            act(() => {
                result.current.scrollProps.onLayout({
                    nativeEvent: { layout: { height: 500 } },
                });
                result.current.scrollProps.onContentSizeChange(0, 1000);
            });

            // Simulate scroll event
            act(() => {
                result.current.scrollProps.onScroll({
                    nativeEvent: {
                        contentOffset: { y: 100 },
                        layoutMeasurement: { height: 500 },
                        contentSize: { height: 1000 },
                    },
                });
            });

            // Should be visible after scroll
            expect(result.current.isVisible).toBe(true);

            // Fast forward 10 seconds
            act(() => {
                jest.advanceTimersByTime(10000);
            });

            // Should still be visible
            expect(result.current.isVisible).toBe(true);

            // Fast forward to just before the large delay
            act(() => {
                jest.advanceTimersByTime(39999);
            });

            // Should still be visible
            expect(result.current.isVisible).toBe(true);

            // Fast forward past the large delay
            act(() => {
                jest.advanceTimersByTime(1);
            });

            // Should now be hidden
            expect(result.current.isVisible).toBe(false);
        });

        it('should handle component unmounting with active timer', () => {
            const { result, unmount } = renderHook(() => useScrollTrack({ fadeOutDelay: 1000 }));

            // Make content scrollable
            act(() => {
                result.current.scrollProps.onLayout({
                    nativeEvent: { layout: { height: 500 } },
                });
                result.current.scrollProps.onContentSizeChange(0, 1000);
            });

            // Simulate scroll event
            act(() => {
                result.current.scrollProps.onScroll({
                    nativeEvent: {
                        contentOffset: { y: 100 },
                        layoutMeasurement: { height: 500 },
                        contentSize: { height: 1000 },
                    },
                });
            });

            // Should be visible
            expect(result.current.isVisible).toBe(true);

            // Unmount component before timer expires
            expect(() => {
                unmount();
            }).not.toThrow();

            // Fast forward time after unmount
            act(() => {
                jest.advanceTimersByTime(2000);
            });

            // Should not crash or cause memory leaks
        });
    });

    describe('ScrollToPosition interaction', () => {
        it('should prevent auto-hide during programmatic scrolling', () => {
            const { result } = renderHook(() => useScrollTrack({ fadeOutDelay: 1000 }));

            // Make content scrollable
            act(() => {
                result.current.scrollProps.onLayout({
                    nativeEvent: { layout: { height: 500 } },
                });
                result.current.scrollProps.onContentSizeChange(0, 1000);
            });

            // Mock scroll ref
            const mockScrollRef = {
                scrollToOffset: jest.fn(),
            };
            result.current.scrollProps.ref.current = mockScrollRef;

            // Call scrollToPosition
            act(() => {
                result.current.scrollToPosition(0.5);
            });

            // Should be visible after programmatic scroll
            expect(result.current.isVisible).toBe(true);

            // Fast forward less than fadeOutDelay
            act(() => {
                jest.advanceTimersByTime(500);
            });

            // Should still be visible
            expect(result.current.isVisible).toBe(true);

            // Fast forward past fadeOutDelay
            act(() => {
                jest.advanceTimersByTime(500);
            });

            // Should now be hidden
            expect(result.current.isVisible).toBe(false);
        });
    });
});
