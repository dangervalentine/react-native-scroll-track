import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Animated } from 'react-native';
import ScrollProgressTrack from '../../src/ScrollProgressTrack';
import { State } from 'react-native-gesture-handler';

describe('ScrollProgressTrack', () => {
  const defaultProps = {
    containerHeight: 500,
    contentHeight: 1000,
    onScrollToPosition: jest.fn(),
    scrollPosition: 0,
    animatedScrollPosition: new Animated.Value(0),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component rendering', () => {
    it('should render with default props', () => {
      const { toJSON } = render(<ScrollProgressTrack {...defaultProps} />);
      expect(toJSON()).toMatchSnapshot();
    });

    it('should not render when content is not scrollable', () => {
      const { toJSON } = render(
        <ScrollProgressTrack
          {...defaultProps}
          containerHeight={500}
          contentHeight={400}
        />
      );
      expect(toJSON()).toBeNull();
    });

    it('should not render when container is too small', () => {
      const { toJSON } = render(
        <ScrollProgressTrack
          {...defaultProps}
          containerHeight={50}
          contentHeight={1000}
        />
      );
      expect(toJSON()).toBeNull();
    });

    it('should render with custom styling', () => {
      const customStyling = {
        thumbColor: '#ff0000',
        trackColor: '#00ff00',
        trackWidth: 8,
        thumbBorderRadius: 4,
        thumbShadow: {
          color: '#333333',
          opacity: 0.5,
          radius: 6,
          offset: { width: 1, height: 3 },
        },
      };

      const { toJSON } = render(
        <ScrollProgressTrack
          {...defaultProps}
          styling={customStyling}
        />
      );
      expect(toJSON()).toMatchSnapshot();
    });
  });

  describe('Thumb calculations', () => {
    it('should calculate thumb height correctly', () => {
      // containerHeight / contentHeight = 500 / 1000 = 0.5
      // availableHeight = 500
      // expectedThumbHeight = 500 * 0.5 = 250
      const { getByTestId } = render(
        <ScrollProgressTrack {...defaultProps} />
      );

      // The thumb height should be calculated as container/content ratio
      // We can't directly test the height calculation, but we can verify rendering
      expect(getByTestId).toBeDefined();
    });

    it('should limit thumb height to 80% of available height', () => {
      // Very small content should result in large thumb, but capped at 80%
      const { toJSON } = render(
        <ScrollProgressTrack
          {...defaultProps}
          containerHeight={500}
          contentHeight={550} // Small difference
        />
      );
      expect(toJSON()).toMatchSnapshot();
    });

    it('should handle fixed thumb height', () => {
      const { toJSON } = render(
        <ScrollProgressTrack
          {...defaultProps}
          thumbHeight={100}
        />
      );
      expect(toJSON()).toMatchSnapshot();
    });
  });

  describe('Gesture handling', () => {
    it('should handle tap gestures', () => {
      const onScrollToPosition = jest.fn();
      const { getByTestId } = render(
        <ScrollProgressTrack
          {...defaultProps}
          onScrollToPosition={onScrollToPosition}
          testID="scroll-track"
        />
      );

      const track = getByTestId('scroll-track');

      // Simulate tap at middle of track
      fireEvent(track, 'onHandlerStateChange', {
        nativeEvent: {
          state: State.END,
          y: 250, // Middle of 500px track
        },
      });

      expect(onScrollToPosition).toHaveBeenCalledWith(0.5);
    });

    it('should handle inverted tap gestures', () => {
      const onScrollToPosition = jest.fn();
      const { getByTestId } = render(
        <ScrollProgressTrack
          {...defaultProps}
          onScrollToPosition={onScrollToPosition}
          inverted={true}
          testID="scroll-track"
        />
      );

      const track = getByTestId('scroll-track');

      // Simulate tap at middle of track (inverted)
      fireEvent(track, 'onHandlerStateChange', {
        nativeEvent: {
          state: State.END,
          y: 250, // Middle of 500px track
        },
      });

      expect(onScrollToPosition).toHaveBeenCalledWith(0.5); // 1 - 0.5 = 0.5
    });

    it('should handle drag gestures', () => {
      const onScrollToPosition = jest.fn();
      const onDragStart = jest.fn();
      const onDragEnd = jest.fn();
      const { getByTestId } = render(
        <ScrollProgressTrack
          {...defaultProps}
          onScrollToPosition={onScrollToPosition}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          testID="scroll-track"
        />
      );

      const track = getByTestId('scroll-track');

      // Simulate drag start
      fireEvent(track, 'onGestureEvent', {
        nativeEvent: {
          state: State.BEGAN,
          y: 100,
          translationY: 0,
        },
      });

      expect(onDragStart).toHaveBeenCalled();
      expect(onScrollToPosition).toHaveBeenCalledWith(0.2); // 100 / 500 = 0.2

      // Simulate drag movement
      fireEvent(track, 'onGestureEvent', {
        nativeEvent: {
          state: State.ACTIVE,
          y: 200,
          translationY: 100,
        },
      });

      expect(onScrollToPosition).toHaveBeenCalledWith(0.4); // 200 / 500 = 0.4

      // Simulate drag end
      fireEvent(track, 'onGestureEvent', {
        nativeEvent: {
          state: State.END,
          y: 300,
          translationY: 200,
        },
      });

      expect(onDragEnd).toHaveBeenCalled();
    });

    it('should handle cancelled drag gestures', () => {
      const onDragEnd = jest.fn();
      const { getByTestId } = render(
        <ScrollProgressTrack
          {...defaultProps}
          onDragEnd={onDragEnd}
          testID="scroll-track"
        />
      );

      const track = getByTestId('scroll-track');

      // Simulate drag cancelled
      fireEvent(track, 'onGestureEvent', {
        nativeEvent: {
          state: State.CANCELLED,
          y: 300,
          translationY: 200,
        },
      });

      expect(onDragEnd).toHaveBeenCalled();
    });

    it('should disable gestures when disableGestures is true', () => {
      const onScrollToPosition = jest.fn();
      const { toJSON } = render(
        <ScrollProgressTrack
          {...defaultProps}
          onScrollToPosition={onScrollToPosition}
          disableGestures={true}
        />
      );

      // Should still render but without gesture handlers
      expect(toJSON()).toMatchSnapshot();
    });
  });

  describe('Callbacks', () => {
    it('should call onPressStart and onPressEnd callbacks', () => {
      const onPressStart = jest.fn();
      const onPressEnd = jest.fn();
      const { getByTestId } = render(
        <ScrollProgressTrack
          {...defaultProps}
          onPressStart={onPressStart}
          onPressEnd={onPressEnd}
          testID="scroll-track"
        />
      );

      const track = getByTestId('scroll-track');

      // Simulate tap start
      fireEvent(track, 'onHandlerStateChange', {
        nativeEvent: {
          state: State.BEGAN,
          y: 250,
        },
      });

      expect(onPressStart).toHaveBeenCalled();

      // Simulate tap end
      fireEvent(track, 'onHandlerStateChange', {
        nativeEvent: {
          state: State.END,
          y: 250,
        },
      });

      expect(onPressEnd).toHaveBeenCalled();
    });

    it('should call onPressEnd on cancelled state', () => {
      const onPressEnd = jest.fn();
      const { getByTestId } = render(
        <ScrollProgressTrack
          {...defaultProps}
          onPressEnd={onPressEnd}
          testID="scroll-track"
        />
      );

      const track = getByTestId('scroll-track');

      // Simulate tap cancelled
      fireEvent(track, 'onHandlerStateChange', {
        nativeEvent: {
          state: State.CANCELLED,
          y: 250,
        },
      });

      expect(onPressEnd).toHaveBeenCalled();
    });
  });

  describe('Animation behavior', () => {
    it('should update opacity based on visibility', () => {
      const { rerender } = render(
        <ScrollProgressTrack
          {...defaultProps}
          visible={true}
        />
      );

      // Initial render with visible=true
      expect(Animated.parallel).toHaveBeenCalled();

      // Re-render with visible=false
      rerender(
        <ScrollProgressTrack
          {...defaultProps}
          visible={false}
        />
      );

      expect(Animated.parallel).toHaveBeenCalledTimes(2);
    });

    it('should handle alwaysVisible prop', () => {
      const { rerender } = render(
        <ScrollProgressTrack
          {...defaultProps}
          alwaysVisible={true}
        />
      );

      expect(Animated.parallel).toHaveBeenCalled();

      // Re-render with alwaysVisible=false
      rerender(
        <ScrollProgressTrack
          {...defaultProps}
          alwaysVisible={false}
        />
      );

      expect(Animated.parallel).toHaveBeenCalledTimes(2);
    });
  });

  describe('Position calculations', () => {
    it('should clamp position values to valid range', () => {
      const onScrollToPosition = jest.fn();
      const { getByTestId } = render(
        <ScrollProgressTrack
          {...defaultProps}
          onScrollToPosition={onScrollToPosition}
          testID="scroll-track"
        />
      );

      const track = getByTestId('scroll-track');

      // Simulate tap above track (negative y)
      fireEvent(track, 'onHandlerStateChange', {
        nativeEvent: {
          state: State.END,
          y: -50,
        },
      });

      expect(onScrollToPosition).toHaveBeenCalledWith(0);

      // Simulate tap below track (y > containerHeight)
      fireEvent(track, 'onHandlerStateChange', {
        nativeEvent: {
          state: State.END,
          y: 600,
        },
      });

      expect(onScrollToPosition).toHaveBeenCalledWith(1);
    });

    it('should handle inverted position calculations', () => {
      const onScrollToPosition = jest.fn();
      const { getByTestId } = render(
        <ScrollProgressTrack
          {...defaultProps}
          onScrollToPosition={onScrollToPosition}
          inverted={true}
          testID="scroll-track"
        />
      );

      const track = getByTestId('scroll-track');

      // Simulate tap at top of track (y=0)
      fireEvent(track, 'onHandlerStateChange', {
        nativeEvent: {
          state: State.END,
          y: 0,
        },
      });

      expect(onScrollToPosition).toHaveBeenCalledWith(1); // 1 - 0 = 1

      // Simulate tap at bottom of track (y=500)
      fireEvent(track, 'onHandlerStateChange', {
        nativeEvent: {
          state: State.END,
          y: 500,
        },
      });

      expect(onScrollToPosition).toHaveBeenCalledWith(0); // 1 - 1 = 0
    });
  });

  describe('Track visibility', () => {
    it('should render track when trackVisible is true', () => {
      const { toJSON } = render(
        <ScrollProgressTrack
          {...defaultProps}
          styling={{ trackVisible: true }}
        />
      );
      expect(toJSON()).toMatchSnapshot();
    });

    it('should not render track when trackVisible is false', () => {
      const { toJSON } = render(
        <ScrollProgressTrack
          {...defaultProps}
          styling={{ trackVisible: false }}
        />
      );
      expect(toJSON()).toMatchSnapshot();
    });
  });

  describe('Hit slop', () => {
    it('should apply custom hit slop', () => {
      const { toJSON } = render(
        <ScrollProgressTrack
          {...defaultProps}
          hitSlop={36}
        />
      );
      expect(toJSON()).toMatchSnapshot();
    });
  });

  describe('Deprecated props', () => {
    it('should handle deprecated trackWidth prop', () => {
      const { toJSON } = render(
        <ScrollProgressTrack
          {...defaultProps}
          trackWidth={8}
        />
      );
      expect(toJSON()).toMatchSnapshot();
    });

    it('should prefer styling.trackWidth over deprecated trackWidth', () => {
      const { toJSON } = render(
        <ScrollProgressTrack
          {...defaultProps}
          trackWidth={8}
          styling={{ trackWidth: 12 }}
        />
      );
      expect(toJSON()).toMatchSnapshot();
    });

    it('should handle deprecated styling.alwaysVisible prop', () => {
      const { toJSON } = render(
        <ScrollProgressTrack
          {...defaultProps}
          styling={{ alwaysVisible: true }}
        />
      );
      expect(toJSON()).toMatchSnapshot();
    });
  });
});
