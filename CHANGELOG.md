# Changelog

All notable changes to this project are documented in this file.

This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 2.0.0

### Removed (breaking)

The deprecated styling API is gone. `useScrollTrack` is now the only supported
entry point, and all visual configuration lives on its `styling` object.

| Removed | Replacement |
|---------|-------------|
| `ScrollableContainer` component | `useScrollTrack` |
| `ScrollableContainerProps` type | `ScrollTrackOptions` |
| `ScrollProgressTrack` prop `trackWidth` | `styling.trackWidth` |
| `ScrollProgressTrack` prop `thumbHeight` | `styling.thumbHeight` |
| `styling.alwaysVisible` | the `alwaysVisible` prop |

`styling.alwaysVisible` never took effect: the `alwaysVisible` prop is
defaulted, so the fallback chain could not reach it. Anything relying on it was
already getting the default.

### Changed

Gesture handling on the scroll track, ported from a divergent implementation
that had been tuned in the field.

- **Scrub updates are movement-gated.** A drag now crosses to the JS thread
  only once the finger has moved 4px (12px on Android) or 0.4% of the track
  (0.6% on Android). Previously every pan frame ran a `scrollTo` plus an
  auto-hide timer reset. The final position is always flushed on release, so
  the gate can never leave the list short of where the finger stopped.
- **The gesture strip is inert while the track is hidden.** It spans roughly
  44px of the right edge and used to accept touches whenever the component was
  mounted — including at zero opacity — so taps near the right edge of content
  silently jumped the list. It now accepts touches from the moment the track
  starts appearing until it has fully faded out.
- **The gesture is cached.** Three gesture objects were being rebuilt and
  re-attached on every render; they are now rebuilt only when the track
  geometry changes. Consumer callbacks are held by stable identity, so passing
  inline handlers no longer invalidates the cache.
- **The pan yields to the Android back gesture.** It fails on more than 4px of
  horizontal movement and activates only past 6px of vertical movement. On
  Android the touch target is shifted 4px inward, away from the edge the system
  reserves, and widened to 18px.

Thumb visuals were split out of the gesture overlay so platform touch-target
adjustments cannot shift the thumb. Rendered position is unchanged.

### Added

- `styling.minThumbHeight` — a lower bound for the proportionally sized thumb,
  so it stays grabbable on very long lists. Unset by default.
- `testID` on `ScrollProgressTrack`, defaulting to `'scroll-progress-track'`,
  so the track can be located in consuming apps' tests.
- A `LICENSE` file. The package declared MIT but shipped no licence text.

### Fixed

- `isScrollable` no longer reports `true` for a container of zero or negative
  height. It also no longer claims the content is scrollable before the
  container has been laid out.
- `styling.thumbHeight` is now honored. It was declared in the public API but
  never implemented: the thumb was always sized from the container/content
  ratio, and the value was dropped before it reached the sizing math. An
  explicit `thumbHeight` is now exact — not subject to the 80% cap — and
  clamped only to the height of the track.

### Internal

- Removed ~70 lines of dead code left behind by the gesture-API migration:
  two orphaned legacy handlers and a scroll listener that fired on every frame
  to populate a value nothing read.
- Thumb sizing extracted into a pure `resolveThumbHeight()` with unit tests.
- Test harness repaired: `.tsx` suites could not run at all, because
  `tsconfig.json` sets `jsx: "react-native"` (JSX preserved for Metro) with no
  Babel step after ts-jest. Added a test-only `jsx` override and excluded
  `node_modules` from ts-jest diagnostics.
- Test mocks made faithful enough to drive a gesture: `Animated` animations
  invoke their completion callbacks, the `Gesture` builders record handlers and
  config, and `useSharedValue`/`useAnimatedRef` persist across renders.
- The whole suite runs again: 146 tests across 10 suites, up from 13. Five
  suites had been unable to compile since the gesture-API migration. Their
  gesture tests were rewritten against the modern API, scroll-event fixtures
  moved behind a typed helper, and the environment corrected to `node`
  (`jsdom` omits `setImmediate`, which React Native needs).

## 1.2.0

- External ref support, FlashList compatibility, and the modern gesture API.
