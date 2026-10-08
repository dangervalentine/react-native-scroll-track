<p align="center">
  <img src="https://raw.githubusercontent.com/dangervalentine/react-native-scroll-track/main/media/icon.png" width="80" alt="react-native-scroll-track" />
</p>

<h1 align="center">react-native-scroll-track</h1>

<p align="center">
  <strong>A customizable, interactive scroll indicator for React Native. Tap or drag the track to jump, with an animated thumb and auto-hide behavior.</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/react-native-scroll-track">npm</a>
  &nbsp;·&nbsp;
  <a href="https://snack.expo.dev/@dangervalentine/scrolltrackdemo">Try in Snack</a>
  &nbsp;·&nbsp;
  <a href="https://github.com/dangervalentine/ScrollTrackDemo">Demo app</a>
  &nbsp;·&nbsp;
  <a href="./CHANGELOG.md">Changelog</a>
</p>

<p align="center">
  <a href="https://snack.expo.dev/@dangervalentine/scrolltrackdemo">
    <img
      src="https://raw.githubusercontent.com/dangervalentine/react-native-scroll-track/main/media/key-art.png"
      width="720"
      alt="react-native-scroll-track title art: the wordmark above a list tile with a mint scroll thumb on its track, a tap ripple further down the track with a dashed line showing the jump, and a faint compressed column beside it bracketing where the visible rows sit in the whole list."
    />
  </a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/react-native-scroll-track">
    <img src="https://img.shields.io/npm/v/react-native-scroll-track?color=7FDBCA" alt="npm version" />
  </a>
  <img src="https://img.shields.io/npm/dm/react-native-scroll-track?color=82AAFF" alt="npm downloads" />
  <img src="https://img.shields.io/badge/react_native-0.78+-61DAFB?logo=react&logoColor=white" alt="React Native 0.78+" />
  <img src="https://img.shields.io/badge/typescript-ready-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/license-MIT-C3E88D" alt="MIT License" />
</p>

---

The track is a scale model of your list: the thumb is sized to how much of the content fits on screen, and it moves as you scroll. Drag it to move through the content directly, or tap anywhere on the track to jump straight there.

## 🚀 Features

- 🧭 **Drag or tap the scroll track** to jump to content
- 💡 **Auto-hide logic** with optional persistent mode
- 📏 **Dynamic thumb height** based on content size
- 🎨 **Customizable colors, shadows, sizes**
- 🔄 **Inverted list support** for chat-style interfaces
- ⚡ **Optimized performance** with native animations
- 🎯 **Callback functions** for haptic feedback and interaction handling
- ✅ **Supports** `ScrollView`, `FlatList`, `SectionList`, `FlashList`, `DraggableFlatList`, etc.
- 🆕 **Ref forwarding support** – integrate cleanly with parent gestures and carousels

---

## 🧪 Live Demo

Two ways to try it, whichever suits you:

- 🌐 **[Open in Expo Snack](https://snack.expo.dev/@dangervalentine/scrolltrackdemo)** — runs in the browser, nothing to
  install. Needs an Expo Go matching the Snack's SDK if you open it on a device.
- 📱 **[ScrollTrackDemo](https://github.com/dangervalentine/ScrollTrackDemo)** — the full demo app this package is
  developed against, tracking the current Expo SDK. Clone it, `npm install`, `npm start`.

<table>
  <tr>
    <td align="center" width="33%">
      <img src="https://raw.githubusercontent.com/dangervalentine/react-native-scroll-track/main/media/scroll.gif" alt="Normal scrolling" width="200" />
      <br /><strong>Scroll</strong>
      <br />The thumb syncs with native scrolling to reflect your position.
    </td>
    <td align="center" width="33%">
      <img src="https://raw.githubusercontent.com/dangervalentine/react-native-scroll-track/main/media/tap.gif" alt="Tap to jump" width="200" />
      <br /><strong>Tap</strong>
      <br />Tap anywhere on the track to jump to that part of the content.
    </td>
    <td align="center" width="33%">
      <img src="https://raw.githubusercontent.com/dangervalentine/react-native-scroll-track/main/media/drag.gif" alt="Drag to scroll" width="200" />
      <br /><strong>Drag</strong>
      <br />Drag the thumb to scroll smoothly through the list.
    </td>
  </tr>
</table>

---

## 📦 Installation

```bash
npm install react-native-scroll-track
```

### Peer Dependencies

```bash
npm install react-native-reanimated react-native-worklets react-native-gesture-handler
```

Version 3 needs React 19, React Native 0.78 or newer on the New Architecture,
Reanimated 4 and `react-native-worklets`. On an older setup, stay on
`react-native-scroll-track@2`.

### Additional Setup

- Make sure `react-native-worklets/plugin` is the **last** plugin in your `babel.config.js`
- Follow the setup guides for:
  - [`react-native-reanimated`](https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/getting-started)
  - [`react-native-gesture-handler`](https://docs.swmansion.com/react-native-gesture-handler/docs/installation)

## ⚠️ Required Setup

**Critical**: You must wrap your app (or at least the component rendering the scroll track) with `GestureHandlerRootView` from `react-native-gesture-handler`. Without this, you'll get the error:
```
PanGestureHandler must be used as a descendant of GestureHandlerRootView
```

Wrap your app with `GestureHandlerRootView`:

```tsx
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <YourComponent />
    </GestureHandlerRootView>
  );
}
```

---

## ✅ Usage

### Tracked components

The quickest way in: swap your scrollable for its tracked twin. Each takes
every prop of the component it replaces, including your own `ref`, `onScroll`,
`onLayout` and `onContentSizeChange`, plus a `scrollTrack` prop for the
[options](#-usescrolltrack-hook-options) below.

```tsx
import { TrackedFlatList } from 'react-native-scroll-track';

const MyScreen = () => (
    <View style={{ flex: 1 }}>
        <TrackedFlatList
            data={data}
            renderItem={renderItem}
            scrollTrack={{ styling: { thumbColor: 'white', trackColor: 'steelblue' } }}
        />
    </View>
);
```

| Component | Replaces |
|-----------|----------|
| `TrackedScrollView` | `ScrollView` |
| `TrackedFlatList` | `FlatList` (set `inverted` on the list and the track follows) |
| `TrackedSectionList` | `SectionList` |

A tracked component renders the track beside the scrollable, positioned
against their shared parent. Give them a parent `View` that the scrollable
fills to its right edge; anything else in that parent, a header above the list
for example, is accounted for.

### Hook

For any other scrollable (`FlashList`, `DraggableFlatList`, an
`Animated.ScrollView`, gesture-handler's `ScrollView`) use the hook, which is
what the tracked components are built on:

```tsx
import { useScrollTrack } from 'react-native-scroll-track';

const MyScreen = () => {
    const { scrollProps, ScrollTrack } = useScrollTrack({
        styling: { thumbColor: 'white', trackColor: 'steelblue' },
        onPressStart: () => console.log("on press start event"),
        onPressEnd: () => console.log("on press end event"),
    });

    return (
        <View style={{ flex: 1 }}>
            <FlashList {...scrollProps} data={data} renderItem={renderItem} />
            {ScrollTrack}
        </View>
    );
};
```

Spread `scrollProps` last, so its handlers are the ones the scrollable gets,
and pass your own handlers to the hook (see
[Keeping your own scroll handlers](#keeping-your-own-scroll-handlers)).

The hook also returns `scrollToPosition(position, animated?)`, `isScrollable`,
`scrollRef` and `scrollY`, the scroll offset as a Reanimated shared value.

#### A wrapper for another list

A tracked component for a third-party list is a few lines. With FlashList:

```tsx
import { FlashList, type FlashListProps, type FlashListRef } from '@shopify/flash-list';
import { useScrollTrack, type ScrollTrackOptions } from 'react-native-scroll-track';

type Props<T> = FlashListProps<T> & {
    scrollTrack?: ScrollTrackOptions;
    ref?: React.Ref<FlashListRef<T>>;
};

export function TrackedFlashList<T>({
    scrollTrack, ref, onScroll, onLayout, onContentSizeChange, ...rest
}: Props<T>) {
    const { scrollProps, ScrollTrack } = useScrollTrack({
        ...scrollTrack,
        externalRef: ref,
        onScroll: onScroll ?? undefined,
        onLayout,
        onContentSizeChange,
    });
    const { inverted, ...trackProps } = scrollProps;

    return (
        <>
            <FlashList<T> {...rest} {...trackProps} />
            {ScrollTrack}
        </>
    );
}
```

---

## ⬆️ Upgrading from 2.x

Version 3 moves the track onto Reanimated shared values: the thumb is
positioned and faded on the UI thread, and scrolling no longer re-renders the
component that calls the hook. See [CHANGELOG.md](./CHANGELOG.md) for the full
list.

| 2.x | 3.0 |
|-----|-----|
| React 17+, any architecture, Reanimated 2+ | React 19, New Architecture, Reanimated 4 + `react-native-worklets` |
| `isVisible` returned by the hook | removed; visibility no longer passes through React |
| `useAnimatedScrollPosition` | removed; use the `scrollY` the hook returns |
| `scrollThrottle` default `1` | default `16` |
| half of `trackWidth` hung off the edge of the screen | the track and thumb are drawn at their full width |
| `ScrollProgressTrack` props `animatedScrollPosition`, `scrollPosition`, `visible`, numeric `containerHeight` / `contentHeight` | shared values: `scrollY`, `containerHeight`, `contentHeight`, `containerOffsetY` |
| `onPressStart` / `onPressEnd` could fire twice per touch | once each |

---

## 🎛️ `useScrollTrack` Hook Options

| Option                     | Type       | Default     | Description |
|----------------------------|------------|-------------|-------------|
| `alwaysVisible`            | `boolean`  | `false`     | Prevents auto-hide behavior |
| `disableGestures`          | `boolean`  | `false`     | Disables tap/drag on scrollbar |
| `disableTap`               | `boolean`  | `false`     | Disables tap-to-jump only; the thumb can still be dragged |
| `fadeOutDelay`             | `number`   | `1000`      | Delay before fading track (ms) |
| `hitSlop`                  | `number`   | `22`        | Extra touchable area around the touch strip |
| `touchWidth`               | `number`   | `22` iOS, `18` Android | Width of the strip along the edge that takes touches, never narrower than the track |
| `inverted`                 | `boolean`  | `false`     | Reverses track direction (chat-style) |
| `minScrollDistanceToShow`  | `number`   | `20`        | Min scrollable height before track appears |
| `scrollThrottle`           | `number`   | `16`        | Milliseconds between scroll events |
| `scrollY`                  | `SharedValue<number>` |  | A scroll offset you already keep up to date; the track reads it and adds no scroll handling of its own |
| `styling`                  | `object`   | `{}`        | Styling for track and thumb |
| `onPressStart`             | `function` |             | Callback when interaction starts |
| `onPressEnd`               | `function` |             | Callback when interaction ends |
| `externalRef`              | `ref`      |             | Supply your own list ref (FlatList, ScrollView, FlashList): a ref object or a callback ref |
| `onScroll`                 | `function` |             | Your own scroll handler, called after the track's |
| `onLayout`                 | `function` |             | Your own layout handler, called after the track's |
| `onContentSizeChange`      | `function` |             | Your own content-size handler, called after the track's |

#### Keeping your own scroll handlers

`scrollProps` carries `onScroll`, `onLayout` and `onContentSizeChange`, and
spreading it replaces any of those you set on the scrollable yourself. Pass
yours to the hook instead and each is called after the track has read the event:

```tsx
const { scrollProps, ScrollTrack } = useScrollTrack({
    onScroll: (e) => setScrolled(e.nativeEvent.contentOffset.y > 0),
    onContentSizeChange: (_w, h) => console.log("content height", h),
});

<FlatList {...scrollProps} data={data} renderItem={renderItem} />
```

They can be inline functions: the handlers in `scrollProps` keep their identity
between renders.

The tracked components do this for you: set the handlers on the component as
you would on the plain scrollable.

#### Bringing your own scroll offset

If the scroll offset is already in a shared value, because the list runs a
worklet scroll handler or reports its offset through its own callback, pass it
as `scrollY`. The track then reads that value and `scrollProps.onScroll` only
forwards to your `onScroll`:

```tsx
const scrollY = useSharedValue(0);
const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
});
const { scrollProps, ScrollTrack } = useScrollTrack({ scrollY });

<Animated.ScrollView {...scrollProps} onScroll={onScroll} />
```

#### Tuning what the edge responds to

The track takes touches along a strip of the right edge, but only while it is
showing. Three options shape that:

- `touchWidth` is the width of the strip itself.
- `hitSlop` extends the gestures beyond the strip. Set it to `0` to keep
  touches strictly inside `touchWidth`.
- `disableTap` drops tap-to-jump and keeps the drag, for lists whose rows have
  controls near the right edge.

```tsx
// A slim scrubber that only responds to a deliberate drag.
useScrollTrack({ touchWidth: 8, hitSlop: 0, disableTap: true });
```

On Android the strip sits 4 points in from the edge, clear of the system back
gesture.

#### `styling` Options

| Key                | Type     | Description |
|--------------------|----------|-------------|
| `thumbColor`       | `string` | Thumb color |
| `trackColor`       | `string` | Track background color |
| `trackVisible`     | `boolean`| Show/hide track background |
| `trackOpacity`     | `number` | Opacity of the track |
| `thumbOpacity`     | `number` | Opacity of the thumb |
| `trackWidth`       | `number` | Width of the track |
| `thumbHeight`      | `number` | Fixed height for the thumb, in pixels. Overrides proportional sizing and `minThumbHeight` |
| `minThumbHeight`   | `number` | Minimum height for the proportionally sized thumb, in pixels. Ignored when `thumbHeight` is set |
| `thumbBorderRadius`| `number` | Border radius of the thumb |
| `thumbShadow`      | `object` | Shadow style for thumb |
| `zIndex`           | `number` | z-index of the track |

##### Thumb height

By default the thumb is sized in proportion to how much of the content fits on
screen, capped at 80% of the track so there is always somewhere to drag it to.
Two options override that:

- `thumbHeight` pins the thumb to an exact height, ignoring both the proportion
  and the 80% cap. It is only clamped to the height of the track.
- `minThumbHeight` keeps the proportional sizing but stops the thumb from
  shrinking below the given height, which keeps it grabbable on very long lists.

```tsx
const options = {
    styling: {
        // Always at least 48px tall, however long the list gets.
        minThumbHeight: 48,
    },
};
```

Both are unset by default. If both are set, `thumbHeight` wins.

#### `thumbShadow` Options

| Key     | Type     | Description |
|---------|----------|-------------|
| `color`| `string` | Shadow color |
| `opacity` | `number` | Shadow opacity |
| `radius` | `number` | Blur radius |
| `offset` | `object` | `{ width, height }` offset |

---

#### Inverted Scroll Behavior

When `inverted` is set to `true`, the scroll track behavior is flipped:
- Tapping at the **bottom** of the track scrolls to the **beginning** of the content (position 0)
- Tapping at the **top** of the track scrolls to the **end** of the content
- The thumb position is also inverted to match this behavior

This is useful when working with inverted FlatLists or when you want the scroll track to behave in the opposite direction from the default.

**Note**: The `inverted` prop has currently only been tested with FlatLists. Behavior with other scrollable components may vary.

```tsx
    // These are optional, displayed for illustrative purposes.
    const scrollTrackOptions: ScrollTrackOptions = {
        inverted: true,
    };

    const { scrollProps, ScrollTrack } = useScrollTrack(scrollTrackOptions);

    return (
        <View style={{ flex: 1 }}>
            <FlatList {...scrollProps} data={data} renderItem={renderItem} />
            {ScrollTrack}
        </View>
    );
};
```


## 🎯 Haptic Feedback Example

### With Haptic Feedback

The `onPressStart` and `onPressEnd` callbacks are perfect for implementing haptic feedback to provide tactile responses when users interact with the scroll track. You can use packages like [`react-native-haptic-feedback`](https://www.npmjs.com/package/react-native-haptic-feedback) to add native haptic responses:

```tsx
import ReactNativeHapticFeedback from "react-native-haptic-feedback";
import { Platform, Vibration } from "react-native";

// Optional: Configure haptic feedback options
const hapticOptions = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};

// Custom vibration patterns for Android
const ANDROID_VIBRATION_PATTERNS: Record<HapticType, number[]> = {
    impactLight: [0, 5], // 5ms vibration - extremely subtle
    impactMedium: [0, 10], // 10ms vibration - very light
    impactHeavy: [0, 20], // 20ms vibration - medium
    notificationSuccess: [0, 20, 50, 20], // Success pattern
    notificationWarning: [0, 30, 50, 30], // Warning pattern
    notificationError: [0, 40, 50, 40], // Error pattern
    selection: [0, 5], // Selection - extra light
};

// Define haptic types for different interactions
export type HapticType =
    | "impactLight" // Light tap, for subtle UI interactions
    | "impactMedium" // Medium tap, for more significant actions
    | "impactHeavy" // Strong tap, for important or destructive actions
    | "notificationSuccess" // Success notification pattern
    | "notificationWarning" // Warning notification pattern
    | "notificationError" // Error notification pattern
    | "selection"; // Selection feedback pattern

/**
 * Triggers haptic feedback using native APIs when available
 * @param type The type of haptic feedback to trigger
 * @param options Optional configuration for the haptic feedback
 */
export const triggerHapticFeedback = (
    type: HapticType = "impactLight",
    options = hapticOptions
) => {
    try {
        if (Platform.OS === "android") {
            // Use custom vibration patterns for Android
            const pattern = ANDROID_VIBRATION_PATTERNS[type];
            Vibration.vibrate(pattern, false);
        } else {
            // Use standard haptic feedback for iOS
            ReactNativeHapticFeedback.trigger(type, {
                ...options,
                ignoreAndroidSystemSettings: false,
            });
        }
    } catch (error) {
        console.warn("Haptic feedback not available:", error);
    }
};

// Helper functions for common haptic patterns
export const HapticFeedback = {
    light: () => triggerHapticFeedback("impactLight"),
    medium: () => triggerHapticFeedback("impactMedium"),
    heavy: () => triggerHapticFeedback("impactHeavy"),
    success: () => triggerHapticFeedback("notificationSuccess"),
    warning: () => triggerHapticFeedback("notificationWarning"),
    error: () => triggerHapticFeedback("notificationError"),
    selection: () => triggerHapticFeedback("selection"),
};

import ReactNativeHapticFeedback from "react-native-haptic-feedback";
import { useScrollTrack } from "react-native-scroll-track";

const MyScreen = () => {
  const { scrollProps, ScrollTrack } = useScrollTrack({
    styling: { thumbColor: '#007AFF' },
    onPressStart: () => triggerHapticFeedback("impactLight"),
    onPressEnd: () => triggerHapticFeedback("impactMedium"),
  });

  return (
    <View style={{ flex: 1 }}>
      <FlatList {...scrollProps} data={myData} renderItem={renderItem} />
      {ScrollTrack}
    </View>
  );
};
```

**Installation:**
```bash
npm install react-native-haptic-feedback
```

**Note:** Haptic feedback requires additional platform-specific setup. Follow the installation guide for [`react-native-haptic-feedback`](https://www.npmjs.com/package/react-native-haptic-feedback) to ensure proper functionality across iOS and Android.

## 🚨 Troubleshooting

### Common Issues

#### "PanGestureHandler must be used as a descendant of GestureHandlerRootView"
Make sure you've wrapped your app with `GestureHandlerRootView` as shown in the setup section.

#### Scroll track not appearing
The track is mounted only when there is something to scroll: the content must
be taller than the viewport by more than `minScrollDistanceToShow` (20 by
default), and the viewport at least 100 points tall. Once mounted it stays
hidden until the list scrolls 12 points, unless `alwaysVisible` is set.

#### Track in the wrong place
The track is positioned against the parent of the scrollable. Wrap the
scrollable and `{ScrollTrack}` in a `View` that the scrollable fills to its
right edge.

#### Worklet errors
Make sure `react-native-worklets/plugin` is the **last** plugin in your `babel.config.js`.

#### TypeScript errors
The package includes TypeScript definitions. Make sure your TypeScript version is compatible with React Native.

#### Haptic feedback not working
- Ensure you've installed `react-native-haptic-feedback` correctly
- Check that haptic feedback is enabled in device settings
- Test on a physical device (haptic feedback doesn't work in simulators)

---

### Performance

- The scroll offset, the viewport and the content size are Reanimated shared
  values. The thumb's size, position and fade are worked out from them on the
  UI thread.
- Scrolling does not re-render the component that calls the hook. Its only
  React state is whether there is anything to scroll.
- The track is not mounted until the content overflows.
- A drag crosses to the JS thread only when the finger has moved far enough to
  matter, and the gesture is built once, however often your callbacks change.
- Pass `scrollY` when you already have the offset in a shared value, and the
  track adds no scroll handling of its own.

---

## 🛠️ Compatibility

- **React**: 19+
- **React Native**: 0.78+, New Architecture
- **Reanimated**: 4+, with `react-native-worklets`
- **Gesture Handler**: 2.24+

For React Native on the old architecture, or Reanimated 2 or 3, use
`react-native-scroll-track@2`.

---

## 📄 License

MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction...

---

## 💖 Support

If you like this package:

- ⭐ **Starring** the repository on GitHub
- 📦 **Sharing** the package with your React Native community

**Built with ❤️ for the React Native community**
