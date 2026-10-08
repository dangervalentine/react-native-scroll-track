import React from 'react';
import { act, renderHook } from '@testing-library/react-native';
import { makeMutable } from 'react-native-reanimated';

import { useScrollTrack, defaultScrollTrackOptions } from '../../src/hooks/useScrollTrack';
import { renderScrollTrack } from '../helpers/hook';
import { scrollEvent } from '../helpers/scrollEvent';

/** Attaches a stand-in scrollable to the hook's own ref. */
const attach = (hook: ReturnType<typeof renderScrollTrack>, node: unknown) => {
    (hook.current().scrollRef as React.MutableRefObject<unknown>).current = node;
};

describe('useScrollTrack', () => {
    describe('initialization', () => {
        it('starts with the default options and nothing to scroll', () => {
            const hook = renderScrollTrack();

            expect(hook.current().scrollProps).toEqual(
                expect.objectContaining({
                    scrollEventThrottle: 16,
                    showsVerticalScrollIndicator: false,
                    inverted: false,
                })
            );
            expect(hook.current().isScrollable).toBe(false);
            expect(hook.current().ScrollTrack).toBeNull();
            expect(hook.current().scrollY.value).toBe(0);
        });

        it('accepts custom options', () => {
            const hook = renderScrollTrack({ scrollThrottle: 32, inverted: true });

            expect(hook.current().scrollProps.scrollEventThrottle).toBe(32);
            expect(hook.current().scrollProps.inverted).toBe(true);
        });

        it.each([undefined, null, {}])('tolerates %p for options', (options) => {
            expect(() => renderHook(() => useScrollTrack(options as any))).not.toThrow();
        });

        it('exports its defaults', () => {
            expect(defaultScrollTrackOptions).toEqual(
                expect.objectContaining({
                    alwaysVisible: false,
                    disableGestures: false,
                    disableTap: false,
                    fadeOutDelay: 1000,
                    hitSlop: 22,
                    inverted: false,
                    minScrollDistanceToShow: 20,
                    scrollThrottle: 16,
                })
            );
            expect(defaultScrollTrackOptions.styling.trackWidth).toBe(4);
        });
    });

    describe('whether there is anything to scroll', () => {
        it('becomes scrollable once the content outgrows the viewport', () => {
            const hook = renderScrollTrack();

            hook.measure({ container: 500, content: 1000 });

            expect(hook.current().isScrollable).toBe(true);
            expect(hook.current().ScrollTrack).not.toBeNull();
        });

        it('is not scrollable when the content fits', () => {
            const hook = renderScrollTrack();

            hook.measure({ container: 500, content: 400 });

            expect(hook.current().isScrollable).toBe(false);
            expect(hook.current().ScrollTrack).toBeNull();
        });

        it('is not scrollable below minScrollDistanceToShow', () => {
            const hook = renderScrollTrack({ minScrollDistanceToShow: 50 });

            hook.measure({ container: 500, content: 530 });
            expect(hook.current().isScrollable).toBe(false);

            hook.measure({ container: 500, content: 560 });
            expect(hook.current().isScrollable).toBe(true);
        });

        it('mounts no track for a viewport under 100pt', () => {
            const hook = renderScrollTrack();

            hook.measure({ container: 80, content: 1000 });

            expect(hook.current().isScrollable).toBe(false);
            expect(hook.current().ScrollTrack).toBeNull();
        });

        it('follows the content as it shrinks and grows again', () => {
            const hook = renderScrollTrack();

            hook.measure({ container: 500, content: 1000 });
            hook.measure({ container: 500, content: 300 });
            expect(hook.current().ScrollTrack).toBeNull();

            hook.measure({ container: 500, content: 1200 });
            expect(hook.current().ScrollTrack).not.toBeNull();
        });

        it.each([
            ['zero', 0, 0],
            ['negative', -100, -50],
            ['fractional', 500.5, 500.75],
        ])('does not throw on %s dimensions', (_name, container, content) => {
            const hook = renderScrollTrack();

            expect(() => hook.measure({ container, content })).not.toThrow();
            expect(hook.current().isScrollable).toBe(false);
        });
    });

    describe('scroll offset', () => {
        it('tracks the offset in a shared value', () => {
            const hook = renderScrollTrack();
            hook.measure();

            hook.scroll(240);

            expect(hook.current().scrollY.value).toBe(240);
        });

        it('does not re-render the host while scrolling', () => {
            const hook = renderScrollTrack();
            hook.measure();
            const before = hook.renders();

            for (let y = 0; y <= 500; y += 10) hook.scroll(y);
            act(() => {
                jest.advanceTimersByTime(5000);
            });

            expect(hook.renders()).toBe(before);
        });

        it('does not re-render the host when the content size changes but still scrolls', () => {
            const hook = renderScrollTrack();
            hook.measure({ container: 500, content: 1000 });
            const before = hook.renders();

            hook.measure({ container: 500, content: 1400 });
            hook.measure({ container: 500, content: 2600 });

            expect(hook.renders()).toBe(before);
        });

        it.each([
            ['no nativeEvent', {}],
            ['no contentOffset', { nativeEvent: {} }],
            ['a null offset', { nativeEvent: { contentOffset: { y: null } } }],
            ['an undefined offset', { nativeEvent: { contentOffset: {} } }],
            ['NaN', { nativeEvent: { contentOffset: { y: NaN } } }],
        ])('ignores a scroll event with %s', (_name, event) => {
            const hook = renderScrollTrack();
            hook.measure();
            hook.scroll(120);

            expect(() => {
                act(() => {
                    hook.current().scrollProps.onScroll(event as any);
                });
            }).not.toThrow();
            expect(hook.current().scrollY.value).toBe(120);
        });

        it('reads a scrollY the caller keeps up to date, and leaves it alone', () => {
            const scrollY = makeMutable(75);
            const onScroll = jest.fn();
            const hook = renderScrollTrack({ scrollY, onScroll });
            hook.measure();

            expect(hook.current().scrollY).toBe(scrollY);

            hook.scroll(300);

            // The caller owns the value: the scroll event is only passed on.
            expect(scrollY.value).toBe(75);
            expect(onScroll).toHaveBeenCalledTimes(1);
        });
    });

    describe('scrollToPosition', () => {
        it('uses whichever scroll method the node has', () => {
            const hook = renderScrollTrack();
            hook.measure({ container: 500, content: 1000 });

            const flatList = { scrollToOffset: jest.fn() };
            attach(hook, flatList);
            act(() => hook.current().scrollToPosition(0.5));
            expect(flatList.scrollToOffset).toHaveBeenCalledWith({ offset: 250, animated: true });

            const scrollView = { scrollTo: jest.fn() };
            attach(hook, scrollView);
            act(() => hook.current().scrollToPosition(0.25));
            expect(scrollView.scrollTo).toHaveBeenCalledWith({ y: 125, animated: true });

            const responder = { scrollTo: jest.fn() };
            attach(hook, { getScrollResponder: () => responder });
            act(() => hook.current().scrollToPosition(0.75));
            expect(responder.scrollTo).toHaveBeenCalledWith({ y: 375, animated: true });

            const inner = { scrollToOffset: jest.fn() };
            attach(hook, { _listRef: inner });
            act(() => hook.current().scrollToPosition(1));
            expect(inner.scrollToOffset).toHaveBeenCalledWith({ offset: 500, animated: true });
        });

        it('scrolls without animation, moving the thumb at once, while scrubbing', () => {
            const hook = renderScrollTrack();
            hook.measure({ container: 500, content: 1000 });
            const node = { scrollToOffset: jest.fn() };
            attach(hook, node);

            act(() => hook.current().scrollToPosition(0.5, false));

            expect(node.scrollToOffset).toHaveBeenCalledWith({ offset: 250, animated: false });
            expect(hook.current().scrollY.value).toBe(250);
        });

        it('leaves the offset to the scroll events for an animated jump', () => {
            const hook = renderScrollTrack();
            hook.measure({ container: 500, content: 1000 });
            attach(hook, { scrollToOffset: jest.fn() });

            act(() => hook.current().scrollToPosition(0.5));

            expect(hook.current().scrollY.value).toBe(0);
        });

        it('clamps a position outside 0 to 1', () => {
            const hook = renderScrollTrack();
            hook.measure({ container: 500, content: 1000 });
            const node = { scrollToOffset: jest.fn() };
            attach(hook, node);

            act(() => hook.current().scrollToPosition(-0.5));
            act(() => hook.current().scrollToPosition(1.5));
            act(() => hook.current().scrollToPosition(Infinity));

            expect(node.scrollToOffset).toHaveBeenNthCalledWith(1, { offset: 0, animated: true });
            expect(node.scrollToOffset).toHaveBeenNthCalledWith(2, { offset: 500, animated: true });
            expect(node.scrollToOffset).toHaveBeenNthCalledWith(3, { offset: 500, animated: true });
        });

        it('ignores NaN', () => {
            const hook = renderScrollTrack();
            hook.measure();
            const node = { scrollToOffset: jest.fn() };
            attach(hook, node);

            act(() => hook.current().scrollToPosition(NaN));

            expect(node.scrollToOffset).not.toHaveBeenCalled();
        });

        it('does nothing without a node, or with one that cannot scroll', () => {
            const hook = renderScrollTrack();
            hook.measure();

            expect(() => act(() => hook.current().scrollToPosition(0.5))).not.toThrow();

            attach(hook, {});
            expect(() => act(() => hook.current().scrollToPosition(0.5))).not.toThrow();
        });
    });

    describe('handler pass-through', () => {
        it('calls the consumer handlers after reading the event itself', () => {
            const onScroll = jest.fn();
            const onLayout = jest.fn();
            const onContentSizeChange = jest.fn();
            const hook = renderScrollTrack({ onScroll, onLayout, onContentSizeChange });

            const layoutEvent = { nativeEvent: { layout: { height: 500, y: 0 } } };
            const event = scrollEvent({ y: 100 });

            act(() => {
                hook.current().scrollProps.onLayout(layoutEvent);
                hook.current().scrollProps.onContentSizeChange(300, 1000);
                hook.current().scrollProps.onScroll(event);
            });

            expect(onLayout).toHaveBeenCalledWith(layoutEvent);
            expect(onContentSizeChange).toHaveBeenCalledWith(300, 1000);
            expect(onScroll).toHaveBeenCalledWith(event);
            // The track still read the same events.
            expect(hook.current().isScrollable).toBe(true);
            expect(hook.current().scrollY.value).toBe(100);
        });

        it('keeps handler identities stable when the consumer passes inline handlers', () => {
            const first = jest.fn();
            const second = jest.fn();
            const hook = renderScrollTrack({ onLayout: first, onScroll: () => {} });

            const before = hook.current().scrollProps;
            hook.rerender({ onLayout: second, onScroll: () => {} });

            expect(hook.current().scrollProps.onLayout).toBe(before.onLayout);
            expect(hook.current().scrollProps.onScroll).toBe(before.onScroll);
            expect(hook.current().scrollProps.onContentSizeChange).toBe(before.onContentSizeChange);

            hook.measure();

            expect(first).not.toHaveBeenCalled();
            expect(second).toHaveBeenCalledTimes(1);
        });
    });

    describe('externalRef', () => {
        it('hands a ref object straight to the scrollable', () => {
            const externalRef = { current: null };
            const hook = renderScrollTrack({ externalRef });

            expect(hook.current().scrollProps.ref).toBe(externalRef);
            expect(hook.current().scrollRef).toBe(externalRef);
        });

        it('accepts a ref that arrives after the first render', () => {
            const externalRef = { current: null };
            const hook = renderScrollTrack();

            // A change in hook order throws out of the render.
            expect(() => hook.rerender({ externalRef })).not.toThrow();

            expect(hook.current().scrollProps.ref).toBe(externalRef);
        });

        it('forwards the node to a callback ref and still scrolls it', () => {
            const externalRef = jest.fn();
            const node = { scrollToOffset: jest.fn() };
            const hook = renderScrollTrack({ externalRef });

            const setRef = hook.current().scrollProps.ref as (node: unknown) => void;
            expect(typeof setRef).toBe('function');

            act(() => {
                setRef(node);
            });
            hook.measure({ container: 500, content: 1000 });

            expect(externalRef).toHaveBeenCalledWith(node);
            expect(hook.current().scrollRef.current).toBe(node);

            act(() => hook.current().scrollToPosition(0.5));

            expect(node.scrollToOffset).toHaveBeenCalledWith({ offset: 250, animated: true });
        });

        it('runs the cleanup a callback ref returns', () => {
            const cleanup = jest.fn();
            const externalRef = jest.fn(() => cleanup);
            const node = { scrollToOffset: jest.fn() };
            const hook = renderScrollTrack({ externalRef });

            const setRef = hook.current().scrollProps.ref as (node: unknown) => (() => void) | undefined;
            const release = setRef(node);

            expect(hook.current().scrollRef.current).toBe(node);

            release?.();

            expect(cleanup).toHaveBeenCalledTimes(1);
            expect(hook.current().scrollRef.current).toBeNull();
        });
    });
});
