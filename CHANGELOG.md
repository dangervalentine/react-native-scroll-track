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

### Added

- `styling.minThumbHeight` — a lower bound for the proportionally sized thumb,
  so it stays grabbable on very long lists. Unset by default.

### Fixed

- `styling.thumbHeight` is now honored. It was declared in the public API but
  never implemented: the thumb was always sized from the container/content
  ratio, and the value was dropped before it reached the sizing math. An
  explicit `thumbHeight` is now exact — not subject to the 80% cap — and
  clamped only to the height of the track.

### Internal

- Thumb sizing extracted into a pure `resolveThumbHeight()` with unit tests.
- Test harness repaired: `.tsx` suites could not run at all, because
  `tsconfig.json` sets `jsx: "react-native"` (JSX preserved for Metro) with no
  Babel step after ts-jest. Added a test-only `jsx` override, excluded
  `node_modules` from ts-jest diagnostics, and mocked the modern `Gesture` API.

## 1.2.0

- External ref support, FlashList compatibility, and the modern gesture API.
