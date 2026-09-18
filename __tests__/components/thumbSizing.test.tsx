import React from 'react';
import { render } from '@testing-library/react-native';
import { Animated, StyleSheet } from 'react-native';
import ScrollProgressTrack from '../../src/ScrollProgressTrack';

/**
 * Reads the resolved height of the rendered thumb. The thumb is the only view
 * carrying a backgroundColor, which is how we pick it out of the tree.
 */
const renderedThumbHeight = (tree: any, thumbColor: string): number => {
    const found: number[] = [];

    const walk = (node: any) => {
        if (!node || typeof node !== 'object') return;
        const flat = StyleSheet.flatten(node.props?.style) as any;
        if (flat?.backgroundColor === thumbColor) found.push(flat.height);
        (node.children || []).forEach(walk);
    };

    walk(tree);
    expect(found).toHaveLength(1);
    return found[0];
};

describe('thumb sizing through the public styling API', () => {
    // jest.setup.js installs fake timers globally, which stalls the
    // testing-library auto-cleanup hook. These are pure render assertions.
    beforeAll(() => jest.useRealTimers());
    afterAll(() => jest.useFakeTimers());

    const thumbColor = 'rgba(0,0,0,0.35)';
    const defaultProps = {
        containerHeight: 500,
        contentHeight: 1000,
        onScrollToPosition: jest.fn(),
        scrollPosition: 0,
        animatedScrollPosition: new Animated.Value(0),
    };

    it('sizes the thumb proportionally when nothing is configured', () => {
        const { toJSON } = render(
            <ScrollProgressTrack {...defaultProps} styling={{ thumbColor }} />
        );
        expect(renderedThumbHeight(toJSON(), thumbColor)).toBe(250);
    });

    it('honours styling.thumbHeight', () => {
        const { toJSON } = render(
            <ScrollProgressTrack
                {...defaultProps}
                styling={{ thumbColor, thumbHeight: 56 }}
            />
        );
        expect(renderedThumbHeight(toJSON(), thumbColor)).toBe(56);
    });

    it('honours the deprecated top-level thumbHeight prop', () => {
        const { toJSON } = render(
            <ScrollProgressTrack
                {...defaultProps}
                thumbHeight={56}
                styling={{ thumbColor }}
            />
        );
        expect(renderedThumbHeight(toJSON(), thumbColor)).toBe(56);
    });

    it('honours styling.minThumbHeight on a long list', () => {
        const { toJSON } = render(
            <ScrollProgressTrack
                {...defaultProps}
                contentHeight={10000}
                styling={{ thumbColor, minThumbHeight: 56 }}
            />
        );
        expect(renderedThumbHeight(toJSON(), thumbColor)).toBe(56);
    });

    it('lets styling.thumbHeight win over styling.minThumbHeight', () => {
        const { toJSON } = render(
            <ScrollProgressTrack
                {...defaultProps}
                styling={{ thumbColor, thumbHeight: 20, minThumbHeight: 80 }}
            />
        );
        expect(renderedThumbHeight(toJSON(), thumbColor)).toBe(20);
    });
});
