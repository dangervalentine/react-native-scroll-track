/**
 * The proportional thumb is never allowed to cover more than this share of the
 * track, so there is always somewhere left to drag it to.
 */
export const MAX_THUMB_HEIGHT_RATIO = 0.8;

export interface ThumbHeightConfig {
    /** Height of the rendered track, in pixels. */
    availableHeight: number;
    /** Height of the scrollable viewport. */
    containerHeight: number;
    /** Total height of the scrollable content. */
    contentHeight: number;
    /** Fixed thumb height. Overrides proportional sizing entirely. */
    thumbHeight?: number;
    /** Lower bound for the proportional height. Ignored when `thumbHeight` is set. */
    minThumbHeight?: number;
}

/**
 * Resolves the height of the scroll thumb.
 *
 * Precedence:
 * 1. Nothing to scroll -> no thumb.
 * 2. `thumbHeight` -> used verbatim, clamped only to the track height.
 * 3. Otherwise the container/content ratio, capped at {@link MAX_THUMB_HEIGHT_RATIO}
 *    of the track and then raised to `minThumbHeight` if one is set.
 *
 * The result is always within `[0, availableHeight]`.
 */
export const resolveThumbHeight = ({
    availableHeight,
    containerHeight,
    contentHeight,
    thumbHeight,
    minThumbHeight,
}: ThumbHeightConfig): number => {
    if (contentHeight <= containerHeight) return 0;

    const clampToTrack = (height: number) =>
        Math.max(0, Math.min(height, availableHeight));

    // An explicit height is a command, not a hint: skip the ratio and the cap.
    if (thumbHeight !== undefined) return clampToTrack(thumbHeight);

    const ratio = containerHeight / contentHeight;
    const proportionalHeight = Math.min(
        availableHeight * ratio,
        availableHeight * MAX_THUMB_HEIGHT_RATIO
    );

    if (minThumbHeight !== undefined) {
        // An explicit minimum outranks the cap, for the same reason.
        return clampToTrack(Math.max(proportionalHeight, minThumbHeight));
    }

    return clampToTrack(proportionalHeight);
};
