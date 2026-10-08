# Changelog

All notable changes to this project are documented in this file.

This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 3.0.0 (unreleased)

The track now runs on Reanimated shared values. The thumb is sized, positioned
and faded on the UI thread, and scrolling no longer re-renders the component
that calls the hook.

### Changed (breaking)

- **Requirements.** React 19, React Native 0.78 or newer on the New
  Architecture, Reanimated 4 with `react-native-worklets`, and Gesture Handler
  2.24 or newer. The Babel plugin to list last is now
  `react-native-worklets/plugin`. Older setups stay on 2.x.
- **`useScrollTrack` no longer returns `isVisible`.** Whether the track is
  showing lived in React state, which re-rendered the host twice for every
  burst of scrolling. It is a shared value inside the track now and does not
  pass through React.
- **`useAnimatedScrollPosition` is removed.** It wrapped a React Native
  `Animated.Value`. The hook returns `scrollY`, a shared value, in its place.
- **`ScrollProgressTrack` takes shared values.** `scrollY`, `containerHeight`,
  `contentHeight` and the optional `containerOffsetY` replace
  `animatedScrollPosition`, `scrollPosition`, `visible`, `onDragStart`,
  `onDragEnd` and the numeric heights. `onScrollToPosition` receives
  `(position, animated)`, and `fadeOutDelay` is a prop of the track.
- **`scrollThrottle` defaults to 16**, down from one event per millisecond.
- **`scrollProps.ref` may be a function.** It is when `externalRef` is a
  callback ref. Read the node from the returned `scrollRef`, which is always a
  ref object.
- **The track follows its scrollable.** It was pinned to the top and bottom of
  the parent view, so a header in the same parent pushed the track up behind
  it. It now starts at the scrollable's own top and is exactly as tall.
- **The track and thumb are drawn at full width.** They were centred on the
  edge of the parent view, so half of `trackWidth` hung off the screen: the
  default of 4 showed as 2 points. They now sit flush with the edge, fully on
  screen. If you tuned `trackWidth` by eye, halve it to keep the same look.
- **A small first scroll no longer shows the track.** The offset has to move
  12 points before the track fades in.

### Added

- **Tracked components.** `TrackedScrollView`, `TrackedFlatList` and
  `TrackedSectionList` take the props of the component they replace, plus
  `scrollTrack` for the options, and render the track beside it. State the
  track needs stays inside the component, away from your screen.
- **`disableTap`.** Turns off tap-to-jump and keeps the drag. `disableGestures`
  still turns off both.
- **`touchWidth`.** The width of the strip along the edge that takes touches,
  22 points on iOS and 18 on Android unless set. It is never narrower than the
  track, and `hitSlop` still extends around it.
- **`scrollY` option.** Pass a shared value you already keep up to date and
  the track reads it, adding no scroll handling of its own.
- **`scrollY` returned by the hook**, the scroll offset as a shared value.
- **Handler pass-through.** `useScrollTrack` takes `onScroll`, `onLayout` and
  `onContentSizeChange`. Spreading `scrollProps` replaces those three props on
  the scrollable, so there was no way to keep your own short of composing them
  by hand. Each is called after the track has read the event, and may be an
  inline function without giving the scrollable a new prop every render.
- **Callback refs for `externalRef`.** It accepted only a ref object. A
  callback ref now receives the node as well, including a cleanup returned
  from it.
- **`scrollToPosition(position, animated)`.** The second argument defaults to
  `true`. The position is clamped to 0 to 1, and `NaN` is ignored.

### Fixed

- **`externalRef` no longer changes the order of hooks.** The hook's own ref
  was created only when `externalRef` was missing, so a ref that was undefined
  on one render and set on the next broke the rules of hooks.
- **`onPressStart` and `onPressEnd` fire once per touch.** The tap and the pan
  each called them, so a single touch reported two presses.
- **Content that changes size no longer re-renders the host** unless it
  changes whether there is anything to scroll.

### Internal

- The tests run Reanimated for real under Jest in place of a mock, so the
  fade timings and the thumb's position are asserted, not assumed. Sources go
  through Babel with the worklets plugin; `tsc` type-checks the tests.
- Development moved to React 19.2, React Native 0.86, Reanimated 4.5 and
  `@testing-library/react-native` 13. `@testing-library/react-hooks`,
  `@types/react-native` and `ts-jest` are gone.

## 2.0.2

Documentation only. No runtime changes — `lib/` is byte-identical to 2.0.1.

### Changed

- **The demo app is linked alongside the Snack.** Expo Snack was the only
  advertised way to try the package. [ScrollTrackDemo][demo] now sits beside it
  as an equal option, in both the header links and the Live Demo section.

Each option notes what it is good for: the Snack runs in a browser with nothing
to install but needs an Expo Go matching its SDK on a device, while the demo app
tracks the current Expo SDK and runs natively.

[demo]: https://github.com/dangervalentine/ScrollTrackDemo

## 2.0.1

Documentation only. No runtime changes — `lib/` is byte-identical to 2.0.0.

### Changed

- **README has artwork.** Added a title card, a package logo, and a three-up
  table of the scroll / tap / drag interactions. The npm page previously
  carried no images at all.
- **Interaction GIFs re-recorded.** The originals predated the demo app's dark
  theme and were encoded at 720x1620 while being displayed at 200px. Re-shot
  against the current theme and encoded at display size: 48 MB down to 4.9 MB
  across the three.

Images are linked from `raw.githubusercontent.com` at `main` rather than
bundled, since `files` ships only `lib`, `README.md`, `CHANGELOG.md` and
`LICENSE`. Replacing the artwork on `main` therefore updates the npm page
without a release.

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
