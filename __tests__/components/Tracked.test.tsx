import React from 'react';
import { FlatList, ScrollView, SectionList, Text, View } from 'react-native';
import { act, render } from '@testing-library/react-native';

import { TrackedFlatList, TrackedScrollView, TrackedSectionList } from '../../src';
import { advance, styleOf } from '../helpers/track';
import { scrollEvent } from '../helpers/scrollEvent';

const DATA = Array.from({ length: 40 }, (_, i) => ({ id: String(i), title: `Item ${i}` }));
const renderItem = ({ item }: { item: { title: string } }) => <Text>{item.title}</Text>;

/** Feeds the scrollable the layout and content size a device would report. */
const measure = (scrollable: any, { container = 500, content = 1000, y = 0 } = {}) => {
    act(() => {
        scrollable.props.onLayout({ nativeEvent: { layout: { height: container, y } } });
        scrollable.props.onContentSizeChange(300, content);
    });
    advance(20);
};

const scroll = (scrollable: any, y: number) => {
    act(() => {
        scrollable.props.onScroll(scrollEvent({ y }));
    });
    advance(20);
};

describe('tracked components', () => {
    describe('TrackedScrollView', () => {
        it('renders the scroll view with the track beside it once it overflows', () => {
            const view = render(
                <View>
                    <TrackedScrollView testID="scroll">
                        <Text>Content</Text>
                    </TrackedScrollView>
                </View>
            );
            const scrollView = view.UNSAFE_getByType(ScrollView);

            expect(view.getByText('Content')).toBeTruthy();
            expect(scrollView.props.showsVerticalScrollIndicator).toBe(false);
            expect(view.queryByTestId('scroll-progress-track')).toBeNull();

            measure(scrollView);

            expect(view.getByTestId('scroll-progress-track')).toBeTruthy();
        });

        it('moves the thumb as the scroll view scrolls', () => {
            const view = render(<TrackedScrollView />);
            const scrollView = view.UNSAFE_getByType(ScrollView);
            measure(scrollView);

            scroll(scrollView, 500);

            expect(styleOf(view.getByTestId('scroll-progress-track-thumb')).transform).toEqual([
                { translateY: 250 },
            ]);
        });

        it('places the track over the scroll view when a header sits above it', () => {
            const view = render(<TrackedScrollView />);
            const scrollView = view.UNSAFE_getByType(ScrollView);

            measure(scrollView, { container: 500, content: 1000, y: 88 });

            expect(styleOf(view.getByTestId('scroll-progress-track'))).toMatchObject({ top: 88, height: 500 });
        });

        it('still calls the handlers and ref set on the scroll view', () => {
            const onScroll = jest.fn();
            const onLayout = jest.fn();
            const onContentSizeChange = jest.fn();
            const ref = React.createRef<ScrollView>();
            const view = render(
                <TrackedScrollView
                    ref={ref}
                    onScroll={onScroll}
                    onLayout={onLayout}
                    onContentSizeChange={onContentSizeChange}
                />
            );
            const scrollView = view.UNSAFE_getByType(ScrollView);

            measure(scrollView);
            scroll(scrollView, 120);

            expect(ref.current).not.toBeNull();
            expect(onLayout).toHaveBeenCalledTimes(1);
            expect(onContentSizeChange).toHaveBeenCalledWith(300, 1000);
            expect(onScroll).toHaveBeenCalledTimes(1);
        });

        it('passes scrollTrack options to the track', () => {
            const view = render(
                <TrackedScrollView
                    scrollTrack={{ alwaysVisible: true, styling: { thumbColor: '#ff0000', trackWidth: 6 } }}
                />
            );
            measure(view.UNSAFE_getByType(ScrollView));

            expect(styleOf(view.getByTestId('scroll-progress-track-thumb'))).toMatchObject({
                backgroundColor: '#ff0000',
                width: 6,
                opacity: 0.8,
            });
        });

        it('does not put an inverted prop on the scroll view', () => {
            const view = render(<TrackedScrollView />);

            expect(view.UNSAFE_getByType(ScrollView).props).not.toHaveProperty('inverted');
        });
    });

    describe('TrackedFlatList', () => {
        it('renders the list with the track beside it once it overflows', () => {
            const view = render(<TrackedFlatList data={DATA} renderItem={renderItem} />);
            const list = view.UNSAFE_getByType(FlatList);

            expect(view.getByText('Item 0')).toBeTruthy();
            expect(view.queryByTestId('scroll-progress-track')).toBeNull();

            measure(list);

            expect(view.getByTestId('scroll-progress-track')).toBeTruthy();
        });

        it('inverts the track along with the list', () => {
            const view = render(<TrackedFlatList data={DATA} renderItem={renderItem} inverted />);
            const list = view.UNSAFE_getByType(FlatList);
            measure(list);

            expect(list.props.inverted).toBe(true);
            // At offset 0 an inverted thumb sits at the bottom of its travel.
            expect(styleOf(view.getByTestId('scroll-progress-track-thumb')).transform).toEqual([
                { translateY: 250 },
            ]);
        });

        it('gives the caller the list through its ref', () => {
            const ref = React.createRef<FlatList<(typeof DATA)[number]>>();
            render(<TrackedFlatList ref={ref} data={DATA} renderItem={renderItem} />);

            expect(typeof ref.current?.scrollToOffset).toBe('function');
        });
    });

    describe('TrackedSectionList', () => {
        it('renders the list with the track beside it once it overflows', () => {
            const view = render(
                <TrackedSectionList
                    sections={[{ title: 'A', data: DATA }]}
                    renderItem={renderItem}
                    renderSectionHeader={({ section }) => <Text>{section.title}</Text>}
                />
            );
            const list = view.UNSAFE_getByType(SectionList);

            expect(view.getByText('A')).toBeTruthy();

            measure(list);

            expect(view.getByTestId('scroll-progress-track')).toBeTruthy();
        });
    });
});
