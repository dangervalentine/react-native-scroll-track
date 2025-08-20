# Test Suite for react-native-scroll-track

This directory contains comprehensive unit tests for the `react-native-scroll-track` library. The test suite covers all major components, hooks, and edge cases to ensure reliability and maintainability.

## Test Structure

```
__tests__/
├── README.md                              # This file
├── index.test.ts                         # Main exports tests
├── hooks/
│   ├── useAnimatedScrollPosition.test.ts # Animated scroll position hook tests
│   └── useScrollTrack.test.tsx          # Main scroll track hook tests
├── components/
│   └── ScrollProgressTrack.test.tsx     # ScrollProgressTrack component tests
├── integration/
│   └── integration.test.tsx             # Integration tests
├── behavior/
│   ├── autoHide.test.tsx               # Auto-hide behavior tests
│   └── edgeCases.test.tsx              # Edge cases and error handling
├── jest.config.js                       # Jest configuration
└── jest.setup.js                        # Jest setup and mocks
```

## Test Coverage

### 1. **Hook Tests** (`hooks/`)
- **useAnimatedScrollPosition**: Tests the animated scroll position hook
  - Animated value creation and management
  - Scroll handler generation
  - Position normalization
  - Manual scroll value setting
  - Function stability across rerenders

- **useScrollTrack**: Tests the main scroll track hook
  - Hook initialization with default and custom options
  - Scroll state management
  - Auto-hide behavior
  - ScrollToPosition functionality
  - ScrollTrack rendering logic
  - Callback handling

### 2. **Component Tests** (`components/`)
- **ScrollProgressTrack**: Tests the main scroll progress track component
  - Component rendering with various props
  - Thumb height calculations
  - Gesture handling (tap, drag, pan)
  - Animation behavior
  - Position calculations (normal and inverted)
  - Styling applications
  - Deprecated prop handling

### 3. **Integration Tests** (`integration/`)
- **FlatList Integration**: Tests with FlatList components
- **ScrollView Integration**: Tests with ScrollView components
- **Gesture Integration**: Tests gesture handling in complete system
- **Inverted List Support**: Tests inverted scrolling behavior
- **Custom Options**: Tests various configuration options
- **Performance**: Tests rapid events and memory management

### 4. **Behavior Tests** (`behavior/`)
- **Auto-hide Behavior**: Comprehensive tests for auto-hide functionality
  - Default and custom fade out delays
  - Timer reset behavior
  - Content size change handling
  - Edge cases (zero delay, large delays)
  - Component unmounting with active timers

- **Edge Cases**: Tests for error handling and extreme scenarios
  - Extreme dimension values (zero, negative, very large)
  - Invalid scroll events
  - ScrollToPosition edge cases
  - Option validation
  - Memory and performance edge cases
  - Concurrent operations
  - Type safety

### 5. **Export Tests** (`index.test.ts`)
- Tests all library exports
- Validates TypeScript types
- Ensures proper API surface

## Running Tests

### Prerequisites
Install the required dependencies:
```bash
npm install
```

### Running All Tests
```bash
npm test
```

### Running Tests in Watch Mode
```bash
npm run test:watch
```

### Running Tests with Coverage
```bash
npm run test:coverage
```

### Running Specific Test Files
```bash
# Run only hook tests
npm test -- hooks/

# Run only component tests
npm test -- components/

# Run only integration tests
npm test -- integration/

# Run only behavior tests
npm test -- behavior/

# Run a specific test file
npm test -- hooks/useScrollTrack.test.tsx
```

## Test Configuration

### Jest Configuration (`jest.config.js`)
- Configured for React Native testing
- TypeScript support with `ts-jest`
- Proper mocking of React Native components
- Coverage reporting setup

### Test Setup (`jest.setup.js`)
- Mock implementations for React Native components
- Mock implementations for `react-native-gesture-handler`
- Mock implementations for `react-native-reanimated`
- Global test utilities
- Console warning suppression for cleaner output

## Mocking Strategy

### React Native Components
- `Animated` API is mocked with functional equivalents
- Gesture handlers are mocked to simulate touch events
- Platform-specific APIs are abstracted

### External Dependencies
- `react-native-gesture-handler`: Mocked with event simulation
- `react-native-reanimated`: Mocked with worklet simulation
- Animation timing: Uses fake timers for deterministic testing

## Key Test Patterns

### 1. **Hook Testing**
```typescript
const { result } = renderHook(() => useScrollTrack(options));

act(() => {
  result.current.scrollProps.onLayout({
    nativeEvent: { layout: { height: 500 } },
  });
});

expect(result.current.isScrollable).toBe(true);
```

### 2. **Component Testing**
```typescript
const { getByTestId } = render(
  <ScrollProgressTrack {...props} testID="scroll-track" />
);

fireEvent(getByTestId('scroll-track'), 'gestureEvent', {
  nativeEvent: { state: State.END, y: 250 },
});
```

### 3. **Integration Testing**
```typescript
const TestComponent = () => {
  const { scrollProps, ScrollTrack } = useScrollTrack();
  return (
    <View>
      <FlatList {...scrollProps} data={data} />
      {ScrollTrack}
    </View>
  );
};
```

### 4. **Timer Testing**
```typescript
act(() => {
  jest.advanceTimersByTime(1000);
});
```

## Test Quality Assurance

### Coverage Goals
- **Functions**: 95%+ coverage
- **Statements**: 95%+ coverage
- **Branches**: 90%+ coverage
- **Lines**: 95%+ coverage

### Test Categories
1. **Unit Tests**: Test individual functions and components in isolation
2. **Integration Tests**: Test component interactions and complete workflows
3. **Behavior Tests**: Test complex state management and timing
4. **Edge Case Tests**: Test error conditions and extreme scenarios

## Debugging Tests

### Common Issues
1. **Timer-related tests**: Use `jest.useFakeTimers()` and `jest.advanceTimersByTime()`
2. **Animation tests**: Mock `Animated` API properly
3. **Gesture tests**: Use correct gesture state constants
4. **Async operations**: Use `act()` wrapper for state updates

### Debugging Commands
```bash
# Run tests in debug mode
npm test -- --verbose

# Run tests with coverage
npm run test:coverage

# Run specific test with detailed output
npm test -- --testNamePattern="should handle tap gestures"
```

## Contributing to Tests

### Adding New Tests
1. Follow the existing directory structure
2. Use descriptive test names
3. Group related tests with `describe` blocks
4. Include both positive and negative test cases
5. Test edge cases and error conditions

### Test Naming Convention
- Use descriptive names: `should handle tap gestures on scroll track`
- Group by functionality: `describe('Gesture handling')`
- Include context: `describe('when content is scrollable')`

### Mock Guidelines
- Mock external dependencies, not internal code
- Use realistic mock data
- Keep mocks simple and focused
- Document complex mocking scenarios

## Performance Considerations

### Test Performance
- Use `beforeEach` and `afterEach` for cleanup
- Mock expensive operations
- Use fake timers for time-dependent tests
- Avoid unnecessary DOM operations

### Memory Management
- Clean up timers and listeners
- Reset mocks between tests
- Use `jest.clearAllMocks()` consistently
- Test component unmounting scenarios

---

This comprehensive test suite ensures the reliability and maintainability of the `react-native-scroll-track` library across different platforms and usage scenarios.
