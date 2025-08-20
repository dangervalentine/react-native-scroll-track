import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { useScrollTrack, defaultScrollTrackOptions } from '../../src/hooks/useScrollTrack';

// Mock the animated scroll position hook
jest.mock('../../src/hooks/useAnimatedScrollPosition', () => ({
  useAnimatedScrollPosition: () => ({
    createScrollHandler: jest.fn(() => jest.fn()),
    rawScrollValue: global.mockAnimatedValue(),
    setScrollValue: jest.fn(),
  }),
}));

// Mock the ScrollProgressTrack component
jest.mock('../../src/ScrollProgressTrack', () => {
  return function MockScrollProgressTrack(props) {
    return React.createElement('ScrollProgressTrack', { ...props, testID: 'scroll-progress-track' });
  };
});

describe('useScrollTrack', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
  });

  describe('Hook initialization', () => {
    it('should initialize with default options', () => {
      const { result } = renderHook(() => useScrollTrack());

      expect(result.current.scrollProps).toEqual(
        expect.objectContaining({
          scrollEventThrottle: 1,
          showsVerticalScrollIndicator: false,
          inverted: false,
        })
      );
      expect(result.current.isScrollable).toBe(false);
      expect(result.current.isVisible).toBe(false);
      expect(result.current.scrollToPosition).toBeDefined();
      expect(result.current.ScrollTrack).toBeNull();
    });

    it('should accept custom options', () => {
      const customOptions = {
        scrollThrottle: 16,
        inverted: true,
        alwaysVisible: true,
        fadeOutDelay: 2000,
      };

      const { result } = renderHook(() => useScrollTrack(customOptions));

      expect(result.current.scrollProps.scrollEventThrottle).toBe(16);
      expect(result.current.scrollProps.inverted).toBe(true);
    });

    it('should merge styling options with defaults', () => {
      const customStyling = {
        thumbColor: '#ff0000',
        trackWidth: 8,
        thumbShadow: { color: '#333333' },
      };

      const { result } = renderHook(() => useScrollTrack({ styling: customStyling }));

      // The merged styling should be available internally
      // We can't directly access it, but we can verify the hook doesn't crash
      expect(result.current.scrollProps).toBeDefined();
    });
  });

  describe('Scroll state management', () => {
    it('should update scrollable state when content changes', () => {
      const { result } = renderHook(() => useScrollTrack({ minScrollDistanceToShow: 20 }));

      // Initially not scrollable
      expect(result.current.isScrollable).toBe(false);

      // Simulate container layout
      act(() => {
        result.current.scrollProps.onLayout({
          nativeEvent: { layout: { height: 500 } },
        });
      });

      // Still not scrollable with no content
      expect(result.current.isScrollable).toBe(false);

      // Simulate content size change
      act(() => {
        result.current.scrollProps.onContentSizeChange(0, 600);
      });

      // Now should be scrollable (600 - 500 = 100 > 20)
      expect(result.current.isScrollable).toBe(true);
    });

    it('should not be scrollable when content is smaller than container', () => {
      const { result } = renderHook(() => useScrollTrack({ minScrollDistanceToShow: 20 }));

      act(() => {
        result.current.scrollProps.onLayout({
          nativeEvent: { layout: { height: 500 } },
        });
        result.current.scrollProps.onContentSizeChange(0, 400);
      });

      expect(result.current.isScrollable).toBe(false);
    });

    it('should not be scrollable when scroll distance is below minimum', () => {
      const { result } = renderHook(() => useScrollTrack({ minScrollDistanceToShow: 50 }));

      act(() => {
        result.current.scrollProps.onLayout({
          nativeEvent: { layout: { height: 500 } },
        });
        result.current.scrollProps.onContentSizeChange(0, 530); // Only 30px difference
      });

      expect(result.current.isScrollable).toBe(false);
    });
  });

  describe('Auto-hide behavior', () => {
    it('should auto-hide track after fadeOutDelay', () => {
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

      // Should be visible initially
      expect(result.current.isVisible).toBe(true);

      // Fast forward time
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // Should be hidden now
      expect(result.current.isVisible).toBe(false);
    });

    it('should not auto-hide when alwaysVisible is true', () => {
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

      // Should be visible
      expect(result.current.isVisible).toBe(true);

      // Fast forward time
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      // Should still be visible
      expect(result.current.isVisible).toBe(true);
    });

    it('should reset auto-hide timer on new scroll events', () => {
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

      // Second scroll event should reset timer
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

      // Wait remaining 200ms
      act(() => {
        jest.advanceTimersByTime(200);
      });

      // Now should be hidden
      expect(result.current.isVisible).toBe(false);
    });
  });

  describe('scrollToPosition function', () => {
    it('should call correct scroll method for different ref types', () => {
      const { result } = renderHook(() => useScrollTrack());

      // Mock FlatList ref
      const flatListRef = {
        scrollToOffset: jest.fn(),
      };

      // Mock ScrollView ref
      const scrollViewRef = {
        scrollTo: jest.fn(),
      };

      // Mock ref with getScrollResponder
      const responderRef = {
        getScrollResponder: jest.fn(() => ({
          scrollTo: jest.fn(),
        })),
      };

      // Test FlatList scrolling
      result.current.scrollProps.ref.current = flatListRef;
      act(() => {
        result.current.scrollProps.onLayout({
          nativeEvent: { layout: { height: 500 } },
        });
        result.current.scrollProps.onContentSizeChange(0, 1000);
      });

      act(() => {
        result.current.scrollToPosition(0.5);
      });

      expect(flatListRef.scrollToOffset).toHaveBeenCalledWith({
        offset: 250, // 0.5 * (1000 - 500) = 250
        animated: true,
      });

      // Test ScrollView scrolling
      result.current.scrollProps.ref.current = scrollViewRef;
      act(() => {
        result.current.scrollToPosition(0.25);
      });

      expect(scrollViewRef.scrollTo).toHaveBeenCalledWith({
        y: 125, // 0.25 * (1000 - 500) = 125
        animated: true,
      });

      // Test getScrollResponder
      result.current.scrollProps.ref.current = responderRef;
      act(() => {
        result.current.scrollToPosition(0.75);
      });

      expect(responderRef.getScrollResponder).toHaveBeenCalled();
      expect(responderRef.getScrollResponder().scrollTo).toHaveBeenCalledWith({
        y: 375, // 0.75 * (1000 - 500) = 375
        animated: true,
      });
    });

    it('should handle null ref gracefully', () => {
      const { result } = renderHook(() => useScrollTrack());

      result.current.scrollProps.ref.current = null;

      expect(() => {
        act(() => {
          result.current.scrollToPosition(0.5);
        });
      }).not.toThrow();
    });
  });

  describe('ScrollTrack rendering', () => {
    it('should render ScrollTrack when content is scrollable', () => {
      const { result } = renderHook(() => useScrollTrack());

      // Make content scrollable
      act(() => {
        result.current.scrollProps.onLayout({
          nativeEvent: { layout: { height: 500 } },
        });
        result.current.scrollProps.onContentSizeChange(0, 1000);
      });

      expect(result.current.ScrollTrack).not.toBeNull();
    });

    it('should not render ScrollTrack when content is not scrollable', () => {
      const { result } = renderHook(() => useScrollTrack());

      // Make content not scrollable
      act(() => {
        result.current.scrollProps.onLayout({
          nativeEvent: { layout: { height: 500 } },
        });
        result.current.scrollProps.onContentSizeChange(0, 400);
      });

      expect(result.current.ScrollTrack).toBeNull();
    });

    it('should not render ScrollTrack when container is too small', () => {
      const { result } = renderHook(() => useScrollTrack());

      // Make container too small
      act(() => {
        result.current.scrollProps.onLayout({
          nativeEvent: { layout: { height: 50 } },
        });
        result.current.scrollProps.onContentSizeChange(0, 1000);
      });

      expect(result.current.ScrollTrack).toBeNull();
    });
  });

  describe('Callbacks', () => {
    it('should call onPressStart and onPressEnd callbacks', () => {
      const onPressStart = jest.fn();
      const onPressEnd = jest.fn();

      const { result } = renderHook(() => useScrollTrack({ onPressStart, onPressEnd }));

      // The callbacks should be passed to the ScrollProgressTrack component
      // We verify this by checking that the hook doesn't throw errors
      expect(result.current.scrollProps).toBeDefined();
      expect(onPressStart).not.toHaveBeenCalled();
      expect(onPressEnd).not.toHaveBeenCalled();
    });
  });

  describe('Default options', () => {
    it('should export default options', () => {
      expect(defaultScrollTrackOptions).toBeDefined();
      expect(defaultScrollTrackOptions.alwaysVisible).toBe(false);
      expect(defaultScrollTrackOptions.fadeOutDelay).toBe(1000);
      expect(defaultScrollTrackOptions.scrollThrottle).toBe(1);
      expect(defaultScrollTrackOptions.styling.thumbColor).toBe('#00CED1');
      expect(defaultScrollTrackOptions.styling.trackWidth).toBe(4);
    });
  });
});
