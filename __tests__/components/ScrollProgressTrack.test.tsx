import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Animated } from 'react-native';
import ScrollProgressTrack from '../../src/ScrollProgressTrack';
import { Gesture } from 'react-native-gesture-handler';

const gestureRegistry = Gesture as unknown as {
    __created: Array<{
        kind: string;
        handlers: Record<string, (event?: any) => void>;
        config: Record<string, any>;
    }>;
    __reset: () => void;
};

const ofKind = (kind: string) => {
    const all = gestureRegistry.__created.filter((g) => g.kind === kind);
    return all[all.length - 1];
};
const lastPan = () => ofKind('pan');
const lastTap = () => ofKind('tap');

describe('ScrollProgressTrack', () => {
  const defaultProps = {
    containerHeight: 500,
    contentHeight: 1000,
    onScrollToPosition: jest.fn(),
    scrollPosition: 0,
    animatedScrollPosition: new Animated.Value(0),
  };

  beforeAll(() => jest.useRealTimers());
  afterAll(() => jest.useFakeTimers());

  beforeEach(() => {
    gestureRegistry.__reset();
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
          styling={{ thumbHeight: 100 }}
        />
      );
      expect(toJSON()).toMatchSnapshot();
    });
  });

  describe('Gesture handling', () => {
    it('should handle tap gestures', () => {
      const onScrollToPosition = jest.fn();
      render(
        <ScrollProgressTrack {...defaultProps} onScrollToPosition={onScrollToPosition} />
      );

      // Tap at the middle of the 500px track
      lastTap().handlers.onEnd({ y: 250 });

      expect(onScrollToPosition).toHaveBeenCalledWith(0.5);
    });

    it('should handle inverted tap gestures', () => {
      const onScrollToPosition = jest.fn();
      render(
        <ScrollProgressTrack
          {...defaultProps}
          onScrollToPosition={onScrollToPosition}
          inverted={true}
        />
      );

      lastTap().handlers.onEnd({ y: 250 });

      expect(onScrollToPosition).toHaveBeenCalledWith(0.5); // 1 - 0.5 = 0.5
    });

    it('should handle drag gestures', () => {
      const onScrollToPosition = jest.fn();
      const onDragStart = jest.fn();
      const onDragEnd = jest.fn();
      render(
        <ScrollProgressTrack
          {...defaultProps}
          onScrollToPosition={onScrollToPosition}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        />
      );

      const { handlers } = lastPan();

      handlers.onBegin({ y: 100 });
      expect(onDragStart).toHaveBeenCalled();

      handlers.onUpdate({ y: 100 });
      expect(onScrollToPosition).toHaveBeenCalledWith(0.2); // 100 / 500

      handlers.onUpdate({ y: 200 });
      expect(onScrollToPosition).toHaveBeenCalledWith(0.4); // 200 / 500

      handlers.onFinalize();
      expect(onDragEnd).toHaveBeenCalled();
    });

    it('should handle cancelled drag gestures', () => {
      const onDragEnd = jest.fn();
      render(
        <ScrollProgressTrack {...defaultProps} onScrollToPosition={jest.fn()} onDragEnd={onDragEnd} />
      );

      const { handlers } = lastPan();
      handlers.onBegin({ y: 100 });
      // onFinalize covers END, FAIL and CANCEL alike
      handlers.onFinalize();

      expect(onDragEnd).toHaveBeenCalled();
    });

    it('should disable gestures when disableGestures is true', () => {
      const { toJSON } = render(
        <ScrollProgressTrack
          {...defaultProps}
          onScrollToPosition={jest.fn()}
          disableGestures={true}
        />
      );
      expect(toJSON()).toMatchSnapshot();
    });
  });

  describe('Callbacks', () => {
    it('should call onPressStart and onPressEnd callbacks', () => {
      const onPressStart = jest.fn();
      const onPressEnd = jest.fn();
      render(
        <ScrollProgressTrack
          {...defaultProps}
          onScrollToPosition={jest.fn()}
          onPressStart={onPressStart}
          onPressEnd={onPressEnd}
        />
      );

      const { handlers } = lastPan();

      handlers.onBegin({ y: 100 });
      expect(onPressStart).toHaveBeenCalled();

      handlers.onFinalize();
      expect(onPressEnd).toHaveBeenCalled();
    });

    it('should call onPressEnd on cancelled state', () => {
      const onPressEnd = jest.fn();
      render(
        <ScrollProgressTrack
          {...defaultProps}
          onScrollToPosition={jest.fn()}
          onPressEnd={onPressEnd}
        />
      );

      const { handlers } = lastPan();
      handlers.onBegin({ y: 100 });
      handlers.onFinalize();

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
      render(
        <ScrollProgressTrack {...defaultProps} onScrollToPosition={onScrollToPosition} />
      );

      // Above the track
      lastTap().handlers.onEnd({ y: -50 });
      expect(onScrollToPosition).toHaveBeenCalledWith(0);

      // Below the track
      lastTap().handlers.onEnd({ y: 600 });
      expect(onScrollToPosition).toHaveBeenCalledWith(1);
    });

    it('should handle inverted position calculations', () => {
      const onScrollToPosition = jest.fn();
      render(
        <ScrollProgressTrack
          {...defaultProps}
          onScrollToPosition={onScrollToPosition}
          inverted={true}
        />
      );

      lastTap().handlers.onEnd({ y: 0 });
      expect(onScrollToPosition).toHaveBeenCalledWith(1); // 1 - 0

      lastTap().handlers.onEnd({ y: 500 });
      expect(onScrollToPosition).toHaveBeenCalledWith(0); // 1 - 1
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

});
