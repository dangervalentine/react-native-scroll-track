import { useCallback, useEffect, useRef } from "react";

/**
 * Keeps a stable identity for a callback that may be re-created on every render
 * by the consumer, so caching a gesture or a scroll handler does not pin it to
 * a stale closure.
 */
export const useStableCallback = <Args extends any[]>(
    callback?: ((...args: Args) => void) | null
) => {
    const ref = useRef(callback);

    useEffect(() => {
        ref.current = callback;
    });

    return useCallback((...args: Args) => {
        ref.current?.(...args);
    }, []);
};
