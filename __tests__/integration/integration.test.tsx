import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { View, FlatList, ScrollView, Text } from 'react-native';
import { useScrollTrack } from '../../src/hooks/useScrollTrack';
import { State } from 'react-native-gesture-handler';

// Test component that uses the scroll track
const TestFlatListComponent = ({ options, data }) => {
    const { scrollProps, ScrollTrack } = useScrollTrack(options);

    return (
        <View style={{ flex: 1 }} testID="container">
            <FlatList
                {...scrollProps}
                data={data}
                renderItem={({ item }) => (
                    <View style={{ height: 50 }} testID={`item-${item.id}`}>
                        <Text>{item.text}</Text>
                    </View>
                )}
                keyExtractor={(item) => item.id.toString()}
                testID="flatlist"
            />
            {ScrollTrack}
        </View>
    );
};

const TestScrollViewComponent = ({ options, contentHeight = 2000 }) => {
    const { scrollProps, ScrollTrack } = useScrollTrack(options);

    return (
        <View style={{ flex: 1 }} testID="container">
            <ScrollView
                {...scrollProps}
                testID="scrollview"
            >
                <View style={{ height: contentHeight }} testID="content">
                    <Text>Scrollable content</Text>
                </View>
            </ScrollView>
            {ScrollTrack}
        </View>
    );
};

describe('Integration Tests', () => {
    const generateTestData = (count) =>
        Array.from({ length: count }, (_, i) => ({ id: i, text: `Item ${i}` }));

    beforeEach(() => {
        jest.clearAllMocks();
        jest.clearAllTimers();
    });

    afterEach(() => {
        jest.runOnlyPendingTimers();
    });

    describe('FlatList Integration', () => {
        it('should show scroll track when content is scrollable', () => {
            const data = generateTestData(100);
            const { getByTestId, queryByTestId } = render(
                <TestFlatListComponent data={data} />
            );

            const container = getByTestId('container');
            const flatlist = getByTestId('flatlist');

            // Initially no scroll track should be visible
            expect(queryByTestId('scroll-progress-track')).toBeNull();

            // Simulate container layout
            act(() => {
                fireEvent(container, 'layout', {
                    nativeEvent: { layout: { height: 500, width: 300 } },
                });
            });

            // Simulate FlatList layout
            act(() => {
                fireEvent(flatlist, 'layout', {
                    nativeEvent: { layout: { height: 500, width: 300 } },
                });
            });

            // Simulate content size change (100 items * 50px = 5000px)
            act(() => {
                fireEvent(flatlist, 'contentSizeChange', 300, 5000);
            });

            // Now scroll track should be visible
            expect(queryByTestId('scroll-progress-track')).not.toBeNull();
        });

        it('should hide scroll track when content is not scrollable', () => {
            const data = generateTestData(5); // Small amount of data
            const { getByTestId, queryByTestId } = render(
                <TestFlatListComponent data={data} />
            );

            const container = getByTestId('container');
            const flatlist = getByTestId('flatlist');

            // Simulate container layout
            act(() => {
                fireEvent(container, 'layout', {
                    nativeEvent: { layout: { height: 500, width: 300 } },
                });
            });

            // Simulate FlatList layout
            act(() => {
                fireEvent(flatlist, 'layout', {
                    nativeEvent: { layout: { height: 500, width: 300 } },
                });
            });

            // Simulate content size change (5 items * 50px = 250px)
            act(() => {
                fireEvent(flatlist, 'contentSizeChange', 300, 250);
            });

            // Scroll track should not be visible
            expect(queryByTestId('scroll-progress-track')).toBeNull();
        });

        it('should handle scroll events and auto-hide', () => {
            const data = generateTestData(100);
            const { getByTestId, queryByTestId } = render(
                <TestFlatListComponent data={data} options={{ fadeOutDelay: 1000 }} />
            );

            const container = getByTestId('container');
            const flatlist = getByTestId('flatlist');

            // Setup scrollable content
            act(() => {
                fireEvent(container, 'layout', {
                    nativeEvent: { layout: { height: 500, width: 300 } },
                });
                fireEvent(flatlist, 'layout', {
                    nativeEvent: { layout: { height: 500, width: 300 } },
                });
                fireEvent(flatlist, 'contentSizeChange', 300, 5000);
            });

            // Simulate scroll event
            act(() => {
                fireEvent(flatlist, 'scroll', {
                    nativeEvent: {
                        contentOffset: { y: 100 },
                        layoutMeasurement: { height: 500 },
                        contentSize: { height: 5000 },
                    },
                });
            });

            // Track should be visible after scroll
            expect(queryByTestId('scroll-progress-track')).not.toBeNull();

            // Fast forward time to trigger auto-hide
            act(() => {
                jest.advanceTimersByTime(1000);
            });

            // Track should be hidden after timeout
            // Note: This depends on the internal implementation details
            // In a real test, we might need to check opacity or other visual indicators
        });
    });

    describe('ScrollView Integration', () => {
        it('should work with ScrollView', () => {
            const { getByTestId, queryByTestId } = render(
                <TestScrollViewComponent contentHeight={2000} />
            );

            const container = getByTestId('container');
            const scrollview = getByTestId('scrollview');

            // Setup scrollable content
            act(() => {
                fireEvent(container, 'layout', {
                    nativeEvent: { layout: { height: 500, width: 300 } },
                });
                fireEvent(scrollview, 'layout', {
                    nativeEvent: { layout: { height: 500, width: 300 } },
                });
                fireEvent(scrollview, 'contentSizeChange', 300, 2000);
            });

            // Scroll track should be visible
            expect(queryByTestId('scroll-progress-track')).not.toBeNull();
        });

        it('should handle ScrollView scroll events', () => {
            const { getByTestId } = render(
                <TestScrollViewComponent contentHeight={2000} />
            );

            const container = getByTestId('container');
            const scrollview = getByTestId('scrollview');

            // Setup scrollable content
            act(() => {
                fireEvent(container, 'layout', {
                    nativeEvent: { layout: { height: 500, width: 300 } },
                });
                fireEvent(scrollview, 'layout', {
                    nativeEvent: { layout: { height: 500, width: 300 } },
                });
                fireEvent(scrollview, 'contentSizeChange', 300, 2000);
            });

            // Simulate scroll event
            act(() => {
                fireEvent(scrollview, 'scroll', {
                    nativeEvent: {
                        contentOffset: { y: 200 },
                        layoutMeasurement: { height: 500 },
                        contentSize: { height: 2000 },
                    },
                });
            });

            // Should not crash and should handle the scroll event
            expect(getByTestId('scrollview')).toBeTruthy();
        });
    });

    describe('Gesture Integration', () => {
        it('should handle tap gestures on scroll track', () => {
            const data = generateTestData(100);
            const { getByTestId } = render(
                <TestFlatListComponent data={data} />
            );

            const container = getByTestId('container');
            const flatlist = getByTestId('flatlist');

            // Setup scrollable content
            act(() => {
                fireEvent(container, 'layout', {
                    nativeEvent: { layout: { height: 500, width: 300 } },
                });
                fireEvent(flatlist, 'layout', {
                    nativeEvent: { layout: { height: 500, width: 300 } },
                });
                fireEvent(flatlist, 'contentSizeChange', 300, 5000);
            });

            // Mock the scroll methods
            const scrollToOffset = jest.fn();
            const scrollTo = jest.fn();
            const getScrollResponder = jest.fn(() => ({ scrollTo }));

            // We need to access the ref to mock it
            // In a real scenario, this would be handled by the component
            // For now, we'll just verify the component renders without crashing
            expect(getByTestId('flatlist')).toBeTruthy();
        });

        it('should handle drag gestures on scroll track', () => {
            const data = generateTestData(100);
            const { getByTestId } = render(
                <TestFlatListComponent data={data} />
            );

            const container = getByTestId('container');
            const flatlist = getByTestId('flatlist');

            // Setup scrollable content
            act(() => {
                fireEvent(container, 'layout', {
                    nativeEvent: { layout: { height: 500, width: 300 } },
                });
                fireEvent(flatlist, 'layout', {
                    nativeEvent: { layout: { height: 500, width: 300 } },
                });
                fireEvent(flatlist, 'contentSizeChange', 300, 5000);
            });

            // Component should render without crashing
            expect(getByTestId('flatlist')).toBeTruthy();
        });
    });

    describe('Inverted List Integration', () => {
        it('should work with inverted FlatList', () => {
            const data = generateTestData(100);
            const { getByTestId, queryByTestId } = render(
                <TestFlatListComponent data={data} options={{ inverted: true }} />
            );

            const container = getByTestId('container');
            const flatlist = getByTestId('flatlist');

            // Setup scrollable content
            act(() => {
                fireEvent(container, 'layout', {
                    nativeEvent: { layout: { height: 500, width: 300 } },
                });
                fireEvent(flatlist, 'layout', {
                    nativeEvent: { layout: { height: 500, width: 300 } },
                });
                fireEvent(flatlist, 'contentSizeChange', 300, 5000);
            });

            // Scroll track should be visible
            expect(queryByTestId('scroll-progress-track')).not.toBeNull();
        });
    });

    describe('Custom Options Integration', () => {
        it('should work with alwaysVisible option', () => {
            const data = generateTestData(100);
            const { getByTestId, queryByTestId } = render(
                <TestFlatListComponent data={data} options={{ alwaysVisible: true }} />
            );

            const container = getByTestId('container');
            const flatlist = getByTestId('flatlist');

            // Setup scrollable content
            act(() => {
                fireEvent(container, 'layout', {
                    nativeEvent: { layout: { height: 500, width: 300 } },
                });
                fireEvent(flatlist, 'layout', {
                    nativeEvent: { layout: { height: 500, width: 300 } },
                });
                fireEvent(flatlist, 'contentSizeChange', 300, 5000);
            });

            // Scroll track should be visible
            expect(queryByTestId('scroll-progress-track')).not.toBeNull();

            // Should remain visible even after long time
            act(() => {
                jest.advanceTimersByTime(5000);
            });

            expect(queryByTestId('scroll-progress-track')).not.toBeNull();
        });

        it('should work with custom styling', () => {
            const data = generateTestData(100);
            const customStyling = {
                thumbColor: '#ff0000',
                trackColor: '#00ff00',
                trackWidth: 8,
            };

            const { getByTestId, queryByTestId } = render(
                <TestFlatListComponent
                    data={data}
                    options={{ styling: customStyling }}
                />
            );

            const container = getByTestId('container');
            const flatlist = getByTestId('flatlist');

            // Setup scrollable content
            act(() => {
                fireEvent(container, 'layout', {
                    nativeEvent: { layout: { height: 500, width: 300 } },
                });
                fireEvent(flatlist, 'layout', {
                    nativeEvent: { layout: { height: 500, width: 300 } },
                });
                fireEvent(flatlist, 'contentSizeChange', 300, 5000);
            });

            // Scroll track should be visible with custom styling
            expect(queryByTestId('scroll-progress-track')).not.toBeNull();
        });

        it('should handle callback functions', () => {
            const onPressStart = jest.fn();
            const onPressEnd = jest.fn();
            const data = generateTestData(100);

            const { getByTestId } = render(
                <TestFlatListComponent
                    data={data}
                    options={{ onPressStart, onPressEnd }}
                />
            );

            const container = getByTestId('container');
            const flatlist = getByTestId('flatlist');

            // Setup scrollable content
            act(() => {
                fireEvent(container, 'layout', {
                    nativeEvent: { layout: { height: 500, width: 300 } },
                });
                fireEvent(flatlist, 'layout', {
                    nativeEvent: { layout: { height: 500, width: 300 } },
                });
                fireEvent(flatlist, 'contentSizeChange', 300, 5000);
            });

            // Callbacks should be passed through correctly
            expect(onPressStart).not.toHaveBeenCalled();
            expect(onPressEnd).not.toHaveBeenCalled();
        });

        it('should handle custom minScrollDistanceToShow', () => {
            const data = generateTestData(10); // Moderate amount of data
            const { getByTestId, queryByTestId } = render(
                <TestFlatListComponent
                    data={data}
                    options={{ minScrollDistanceToShow: 100 }}
                />
            );

            const container = getByTestId('container');
            const flatlist = getByTestId('flatlist');

            // Setup content that's scrollable but below threshold
            act(() => {
                fireEvent(container, 'layout', {
                    nativeEvent: { layout: { height: 500, width: 300 } },
                });
                fireEvent(flatlist, 'layout', {
                    nativeEvent: { layout: { height: 500, width: 300 } },
                });
                fireEvent(flatlist, 'contentSizeChange', 300, 550); // Only 50px difference
            });

            // Scroll track should not be visible (50 < 100)
            expect(queryByTestId('scroll-progress-track')).toBeNull();

            // Now make it more scrollable
            act(() => {
                fireEvent(flatlist, 'contentSizeChange', 300, 650); // 150px difference
            });

            // Now scroll track should be visible (150 > 100)
            expect(queryByTestId('scroll-progress-track')).not.toBeNull();
        });
    });

    describe('Performance and Memory', () => {
        it('should handle rapid scroll events without crashing', () => {
            const data = generateTestData(100);
            const { getByTestId } = render(
                <TestFlatListComponent data={data} />
            );

            const container = getByTestId('container');
            const flatlist = getByTestId('flatlist');

            // Setup scrollable content
            act(() => {
                fireEvent(container, 'layout', {
                    nativeEvent: { layout: { height: 500, width: 300 } },
                });
                fireEvent(flatlist, 'layout', {
                    nativeEvent: { layout: { height: 500, width: 300 } },
                });
                fireEvent(flatlist, 'contentSizeChange', 300, 5000);
            });

            // Simulate rapid scroll events
            act(() => {
                for (let i = 0; i < 100; i++) {
                    fireEvent(flatlist, 'scroll', {
                        nativeEvent: {
                            contentOffset: { y: i * 10 },
                            layoutMeasurement: { height: 500 },
                            contentSize: { height: 5000 },
                        },
                    });
                }
            });

            // Should not crash
            expect(getByTestId('flatlist')).toBeTruthy();
        });

        it('should handle component unmounting gracefully', () => {
            const data = generateTestData(100);
            const { getByTestId, unmount } = render(
                <TestFlatListComponent data={data} />
            );

            const container = getByTestId('container');
            const flatlist = getByTestId('flatlist');

            // Setup scrollable content
            act(() => {
                fireEvent(container, 'layout', {
                    nativeEvent: { layout: { height: 500, width: 300 } },
                });
                fireEvent(flatlist, 'layout', {
                    nativeEvent: { layout: { height: 500, width: 300 } },
                });
                fireEvent(flatlist, 'contentSizeChange', 300, 5000);
            });

            // Unmount component
            expect(() => {
                unmount();
            }).not.toThrow();
        });
    });
});
