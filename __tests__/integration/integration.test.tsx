import React from 'react';
import { FlatList, ScrollView, Text, View } from 'react-native';
import { act, render } from '@testing-library/react-native';

import { useScrollTrack, type ScrollTrackOptions } from '../../src';
import { advance, gestureRegistry, lastPan, lastTap, styleOf } from '../helpers/track';
import { scrollEvent } from '../helpers/scrollEvent';

const DATA = Array.from({ length: 50 }, (_, i) => ({ id: String(i), title: `Item ${i}` }));

/** The usage the README documents: the hook, spread onto a list, in a View. */
const ListScreen = ({ options }: { options?: ScrollTrackOptions }) => {
    const { scrollProps, ScrollTrack } = useScrollTrack(options);

    return (
        <View style={{ flex: 1 }}>
            <FlatList
                {...scrollProps}
                data={DATA}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <Text>{item.title}</Text>}
            />
            {ScrollTrack}
        </View>
    );
};

const ScrollScreen = ({ options }: { options?: ScrollTrackOptions }) => {
    const { scrollProps, ScrollTrack } = useScrollTrack(options);
    const { inverted: _inverted, ...props } = scrollProps;

    return (
        <View style={{ flex: 1 }}>
            <ScrollView {...props}>
                <Text>Content</Text>
            </ScrollView>
            {ScrollTrack}
        </View>
    );
};

const setup = (ui: React.ReactElement, type: any = FlatList) => {
    const view = render(ui);
    const scrollable = () => view.UNSAFE_getByType(type);

    return {
        ...view,
        scrollable,
        measure: ({ container = 500, content = 1000 } = {}) => {
            act(() => {
                scrollable().props.onLayout({ nativeEvent: { layout: { height: container, y: 0 } } });
                scrollable().props.onContentSizeChange(300, content);
            });
            advance(20);
        },
        scroll: (y: number) => {
            act(() => {
                scrollable().props.onScroll(scrollEvent({ y }));
            });
            advance(20);
        },
        thumb: () => styleOf(view.getByTestId('scroll-progress-track-thumb')),
        hasTrack: () => view.queryByTestId('scroll-progress-track') !== null,
    };
};

/** Runs a gesture callback and lets what it scheduled to the JS thread land. */
const fire = (handler: (...args: any[]) => void, ...args: any[]) => {
    handler(...args);
    advance(20);
};

describe('integration', () => {
    beforeEach(() => {
        gestureRegistry.__reset();
    });

    describe('with a FlatList', () => {
        it('mounts the track only while there is something to scroll', () => {
            const screen = setup(<ListScreen />);
            expect(screen.hasTrack()).toBe(false);

            screen.measure({ container: 500, content: 1000 });
            expect(screen.hasTrack()).toBe(true);

            screen.measure({ container: 500, content: 400 });
            expect(screen.hasTrack()).toBe(false);
        });

        it('shows the thumb on scroll, moves it, and hides it again', () => {
            const screen = setup(<ListScreen />);
            screen.measure();
            expect(screen.thumb().opacity).toBe(0);

            screen.scroll(250);
            advance(200);
            expect(screen.thumb().opacity).toBeCloseTo(0.8);
            expect(screen.thumb().transform).toEqual([{ translateY: 125 }]);

            advance(2000);
            expect(screen.thumb().opacity).toBe(0);
        });

        it('keeps the thumb shown through a burst of scroll events', () => {
            const screen = setup(<ListScreen />);
            screen.measure();

            for (let y = 20; y <= 500; y += 20) {
                screen.scroll(y);
                advance(100);
            }

            expect(screen.thumb().opacity).toBeCloseTo(0.8);
            expect(screen.thumb().transform).toEqual([{ translateY: 250 }]);
        });

        it('scrolls the list when the track is tapped', () => {
            const screen = setup(<ListScreen />);
            screen.measure();
            const scrollToOffset = jest
                .spyOn(FlatList.prototype, 'scrollToOffset')
                .mockImplementation(() => {});

            fire(lastTap().handlers.onEnd, { y: 250 }, true);

            expect(scrollToOffset).toHaveBeenCalledWith({ offset: 250, animated: true });
            scrollToOffset.mockRestore();
        });

        it('scrolls the list without animation, thumb under the finger, when dragged', () => {
            const screen = setup(<ListScreen />);
            screen.measure();
            const scrollToOffset = jest
                .spyOn(FlatList.prototype, 'scrollToOffset')
                .mockImplementation(() => {});
            const { handlers } = lastPan();

            fire(handlers.onBegin, { y: 100 });
            fire(handlers.onStart, { y: 110 });
            fire(handlers.onUpdate, { y: 375 });

            expect(scrollToOffset).toHaveBeenLastCalledWith({ offset: 375, animated: false });
            expect(screen.thumb().transform).toEqual([{ translateY: 187.5 }]);

            fire(handlers.onFinalize);
            scrollToOffset.mockRestore();
        });

        it('passes disableTap and touchWidth through to the track', () => {
            const screen = setup(<ListScreen options={{ disableTap: true, touchWidth: 8 }} />);
            screen.measure();

            expect(lastTap()).toBeUndefined();
            expect(styleOf(screen.getByTestId('scroll-progress-track-gestures')).width).toBe(8);
        });

        it('runs the consumer callbacks around a press', () => {
            const onPressStart = jest.fn();
            const onPressEnd = jest.fn();
            const screen = setup(<ListScreen options={{ onPressStart, onPressEnd }} />);
            screen.measure();
            const { handlers } = lastPan();

            fire(handlers.onBegin, { y: 100 });
            fire(handlers.onFinalize);

            expect(onPressStart).toHaveBeenCalledTimes(1);
            expect(onPressEnd).toHaveBeenCalledTimes(1);
        });

        it('inverts the list and the track together', () => {
            const screen = setup(<ListScreen options={{ inverted: true }} />);
            screen.measure();

            expect(screen.scrollable().props.inverted).toBe(true);
            expect(screen.thumb().transform).toEqual([{ translateY: 250 }]);
        });

        it('applies alwaysVisible and styling', () => {
            const screen = setup(
                <ListScreen options={{ alwaysVisible: true, styling: { thumbColor: '#ff0000' } }} />
            );
            screen.measure();
            advance(5000);

            expect(screen.thumb()).toMatchObject({ opacity: 0.8, backgroundColor: '#ff0000' });
        });

        it('honours minScrollDistanceToShow', () => {
            const screen = setup(<ListScreen options={{ minScrollDistanceToShow: 100 }} />);

            screen.measure({ container: 500, content: 580 });
            expect(screen.hasTrack()).toBe(false);

            screen.measure({ container: 500, content: 620 });
            expect(screen.hasTrack()).toBe(true);
        });

        it('unmounts cleanly with a fade still pending', () => {
            const screen = setup(<ListScreen />);
            screen.measure();
            screen.scroll(200);

            expect(() => {
                screen.unmount();
                advance(5000);
            }).not.toThrow();
        });
    });

    describe('with a ScrollView', () => {
        it('tracks a scroll view the same way', () => {
            const screen = setup(<ScrollScreen />, ScrollView);
            screen.measure({ container: 400, content: 1200 });

            screen.scroll(800);
            advance(200);

            // 400 of 1200 visible: a 133pt thumb at the bottom of its travel.
            expect(screen.thumb().height).toBeCloseTo(400 / 3);
            expect(screen.thumb().transform[0].translateY).toBeCloseTo(400 - 400 / 3);
            expect(screen.thumb().opacity).toBeCloseTo(0.8);
        });
    });
});
