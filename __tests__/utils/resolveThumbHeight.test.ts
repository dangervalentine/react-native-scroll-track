import { resolveThumbHeight, MAX_THUMB_HEIGHT_RATIO } from '../../src/utils/resolveThumbHeight';

describe('resolveThumbHeight', () => {
    const base = { availableHeight: 500, containerHeight: 500, contentHeight: 1000 };

    describe('proportional sizing (no overrides)', () => {
        it('sizes the thumb by the container/content ratio', () => {
            // 500 / 1000 = 0.5 -> 500 * 0.5 = 250
            expect(resolveThumbHeight(base)).toBe(250);
        });

        it('caps the proportional height at 80% of the track', () => {
            // 500 / 550 = 0.909 -> 454.5, capped to 500 * 0.8 = 400
            expect(
                resolveThumbHeight({ ...base, contentHeight: 550 })
            ).toBe(500 * MAX_THUMB_HEIGHT_RATIO);
        });

        it('returns 0 when the content is not scrollable', () => {
            expect(resolveThumbHeight({ ...base, contentHeight: 400 })).toBe(0);
        });
    });

    describe('thumbHeight (fixed)', () => {
        it('uses the exact value instead of the proportional height', () => {
            expect(resolveThumbHeight({ ...base, thumbHeight: 56 })).toBe(56);
        });

        it('is not subject to the 80% cap', () => {
            expect(resolveThumbHeight({ ...base, thumbHeight: 450 })).toBe(450);
        });

        it('clamps to the track height so the thumb cannot overflow', () => {
            expect(resolveThumbHeight({ ...base, thumbHeight: 900 })).toBe(500);
        });

        it('never returns a negative height', () => {
            expect(resolveThumbHeight({ ...base, thumbHeight: -10 })).toBe(0);
        });

        it('still returns 0 when the content is not scrollable', () => {
            expect(
                resolveThumbHeight({ ...base, contentHeight: 400, thumbHeight: 56 })
            ).toBe(0);
        });

        it('takes precedence over minThumbHeight', () => {
            expect(
                resolveThumbHeight({ ...base, thumbHeight: 20, minThumbHeight: 80 })
            ).toBe(20);
        });
    });

    describe('minThumbHeight', () => {
        it('raises a thumb that the ratio would make too small', () => {
            // 500 / 10000 = 0.05 -> 25, raised to 56
            expect(
                resolveThumbHeight({ ...base, contentHeight: 10000, minThumbHeight: 56 })
            ).toBe(56);
        });

        it('leaves a larger proportional thumb untouched', () => {
            expect(resolveThumbHeight({ ...base, minThumbHeight: 56 })).toBe(250);
        });

        it('wins over the 80% cap when explicitly set above it', () => {
            expect(
                resolveThumbHeight({ ...base, contentHeight: 10000, minThumbHeight: 450 })
            ).toBe(450);
        });

        it('clamps to the track height', () => {
            expect(
                resolveThumbHeight({ ...base, contentHeight: 10000, minThumbHeight: 900 })
            ).toBe(500);
        });

        it('returns 0 when the content is not scrollable', () => {
            expect(
                resolveThumbHeight({ ...base, contentHeight: 400, minThumbHeight: 56 })
            ).toBe(0);
        });
    });
});
