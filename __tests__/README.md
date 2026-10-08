# Tests

```bash
npm test                 # everything
npm run test:watch
npm run test:coverage
npx jest __tests__/components/scrollTrackGestures.test.tsx
npx tsc --noEmit         # type-checks src and the tests
```

## Layout

| Path | Covers |
|------|--------|
| `hooks/useScrollTrack.test.tsx` | The hook: options, when there is anything to scroll, the scroll offset, `scrollToPosition`, handler pass-through, `externalRef`, and that scrolling does not re-render the host |
| `components/ScrollProgressTrack.test.tsx` | The track: layout, styling, thumb position, showing and hiding |
| `components/scrollTrackGestures.test.tsx` | Tap, scrub gating, dragging, press callbacks, when the overlay accepts touches, gesture stability |
| `components/thumbSizing.test.tsx` | Thumb height through the `styling` options |
| `components/Tracked.test.tsx` | `TrackedScrollView`, `TrackedFlatList`, `TrackedSectionList` |
| `integration/integration.test.tsx` | The documented usage end to end, with a real `FlatList` and `ScrollView` |
| `utils/resolveThumbHeight.test.ts` | The thumb height rules |
| `index.test.ts` | What the package exports |
| `helpers/` | `renderTrack`, `renderScrollTrack`, `scrollEvent` and friends |

## How they run

- **Reanimated is real.** `jest.setup.js` calls Reanimated's `setUpTests()`.
  Shared values, animated styles, reactions and `withTiming` / `withDelay` all
  run, so a test can scroll, advance the clock and read the thumb's actual
  opacity and position. Read a view's style with `styleOf(element)` from
  `helpers/track`, which merges its static and animated styles.
- **Timers are fake.** Animations and anything a worklet schedules to the JS
  thread only move when the clock does. Use `advance(ms)` from
  `helpers/track`; a reaction takes its first reading one frame after mount,
  which `renderTrack` already waits for.
- **Gesture Handler is mocked.** The mock in `jest.setup.js` records each
  gesture's configuration and callbacks. `lastPan()` and `lastTap()` return
  them, so a test calls `handlers.onBegin({ y })`, `onUpdate`, `onFinalize`
  directly and checks `config.failOffsetX` and the like.
- **Sources go through Babel** with `react-native-worklets/plugin`, as they do
  in an app, so worklets are real worklets. Jest does not type-check; `tsc`
  does.

## Adding a test

Drive the track the way a scrollable would: report a layout and a content
size, send scroll events, then assert on what the user would see. Prefer the
helpers to reaching into shared values, and keep assertions on behaviour
(position, opacity, calls to `scrollToOffset`) over implementation.
