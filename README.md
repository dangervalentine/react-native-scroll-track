# react-native-scroll-track

✨ A customizable, interactive scroll indicator for React Native. Tap or drag to scroll, with animated thumb and auto-hide behavior.

[![npm version](https://badge.fury.io/js/react-native-scroll-track.svg)](https://badge.fury.io/js/react-native-scroll-track)
[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

---

## 🚀 Features

- 🧭 **Drag or tap the scroll track** to jump to content
- 💡 **Auto-hide logic** with optional persistent mode
- 📏 **Dynamic thumb height** based on content size
- 🎨 **Customizable colors, shadows, sizes**
- 🔄 **Inverted list support** for chat-style interfaces
- ⚡ **Optimized performance** with native animations
- 🎯 **Callback functions** for haptic feedback and interaction handling
- ✅ **Supports** `FlatList`, `ScrollView`, `SectionList`, `DraggableFlatList`, etc.

## 🧪 Live Demo

Try out the scroll track interactively on **Expo Snack**:
👉 [Open in Snack](https://snack.expo.dev/@dangervalentine/scrolltrackdemo)

### Visual Demos

<table>
  <tr>
    <td align="center" style="padding: 8px;">
      <img src="https://raw.githubusercontent.com/dangervalentine/react-native-scroll-track/main/media/scroll.gif" alt="Normal Scrolling" width="200" />
      <br /><strong>Normal Scrolling</strong>
      <br />The scroll indicator syncs with native scrolling to reflect your current position.
    </td>
    <td align="center" style="padding: 8px;">
      <img src="https://raw.githubusercontent.com/dangervalentine/react-native-scroll-track/main/media/tap.gif" alt="Tap to Jump" width="200" />
      <br /><strong>Tap to Jump</strong>
      <br />Tap anywhere on the scroll track to instantly jump to that section of your content.
    </td>
    <td align="center" style="padding: 8px;">
      <img src="https://raw.githubusercontent.com/dangervalentine/react-native-scroll-track/main/media/drag.gif" alt="Drag to Scroll" width="200" />
      <br /><strong>Drag to Scroll</strong>
      <br />Drag the thumb up and down to smoothly scroll through your content.
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
npm install react-native-reanimated react-native-gesture-handler
```

### Additional Setup

For **React Native 0.60+**, you need to complete the installation of the peer dependencies:

#### react-native-reanimated
Follow the installation guide: https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/installation

#### react-native-gesture-handler
Follow the installation guide: https://docs.swmansion.com/react-native-gesture-handler/docs/installation

**Important**: Make sure `react-native-reanimated/plugin` is the **last** plugin in your `babel.config.js`.

---

## ⚠️ Required Setup

**Critical**: You must wrap your app (or at least the component using `ScrollableContainer`) with `GestureHandlerRootView` from `react-native-gesture-handler`. Without this, you'll get the error:

```
PanGestureHandler must be used as a descendant of GestureHandlerRootView
```

### Example Setup

```tsx
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* Your app content */}
      <YourComponent />
    </GestureHandlerRootView>
  );
}
```

Or if you're using Expo Router:

```tsx
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <Stack>
                <Stack.Screen name="index" options={{ headerShown: false }} />
            </Stack>
            <StatusBar style="dark" />
        </GestureHandlerRootView>
  );
}
```

---

## 📱 Usage

### Basic Usage

```tsx
import { ScrollableContainer } from 'react-native-scroll-track';

const MyScreen = () => {
  return (
    <ScrollableContainer
      scrollTrackStyling={{ thumbColor: '#AA00FF', alwaysVisible: false }}
    >
      {({
        scrollRef,
        onScroll,
        onLayout,
        onContentSizeChange,
        scrollEventThrottle,
        showsVerticalScrollIndicator,
      }) => (
        <FlatList
          ref={scrollRef}
          onScroll={onScroll}
          onLayout={onLayout}
          onContentSizeChange={onContentSizeChange}
          scrollEventThrottle={scrollEventThrottle}
          showsVerticalScrollIndicator={showsVerticalScrollIndicator}
          data={myData}
          renderItem={renderItem}
        />
      )}
    </ScrollableContainer>
  );
};
```

### With Custom Styling

```tsx
<ScrollableContainer
  scrollTrackStyling={{
    thumbColor: '#007AFF',
    trackColor: '#E5E5E5',
    trackWidth: 12,
    thumbShadow: {
      color: '#000000',
      opacity: 0.2,
      radius: 4,
      offset: { width: 0, height: 2 },
    },
    alwaysVisible: false,
  }}
>
  {/* Your scrollable content */}
</ScrollableContainer>
```

### Inverted Lists (Chat-style)

```tsx
<ScrollableContainer inverted={true}>
  {({ scrollRef, onScroll, inverted, ...props }) => (
    <FlatList
      ref={scrollRef}
      onScroll={onScroll}
      inverted={inverted}
      {...props}
      data={messages}
      renderItem={renderMessage}
    />
  )}
</ScrollableContainer>
```

### With Callback Functions

```tsx
<ScrollableContainer
  scrollTrackStyling={{ thumbColor: '#007AFF' }}
  onPressStart={() => {
    console.log('User started interacting with scroll track');
    // Handle press start - called for both taps and drag start
  }}
  onPressEnd={() => {
    console.log('User ended dragging the scroll track');
    // Handle drag end - only called when drag gesture ends
  }}
>
  {({ scrollRef, onScroll, ...props }) => (
    <FlatList
      ref={scrollRef}
      onScroll={onScroll}
      {...props}
      data={myData}
      renderItem={renderItem}
    />
  )}
</ScrollableContainer>
```

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

<ScrollableContainer
  scrollTrackStyling={{ thumbColor: '#007AFF' }}
  onPressStart={() => {
    // Trigger haptic feedback when user starts interacting
    triggerHapticFeedback('impactLight');
  }}
  onPressEnd={() => {
    // Trigger different haptic feedback when drag ends
    triggerHapticFeedback('impactMedium')
  }}
>
  {({ scrollRef, onScroll, ...props }) => (
    <FlatList
      ref={scrollRef}
      onScroll={onScroll}
      {...props}
      data={myData}
      renderItem={renderItem}
    />
  )}
</ScrollableContainer>
```

**Installation:**
```bash
npm install react-native-haptic-feedback
```

**Note:** Haptic feedback requires additional platform-specific setup. Follow the installation guide for [`react-native-haptic-feedback`](https://www.npmjs.com/package/react-native-haptic-feedback) to ensure proper functionality across iOS and Android.

### With ScrollView

```tsx
<ScrollableContainer
  scrollTrackStyling={{
    thumbColor: '#007AFF',
    trackColor: '#E5E5E5',
    trackWidth: 12,
    thumbShadow: {
      color: '#000000',
      opacity: 0.2,
      radius: 4,
      offset: { width: 0, height: 2 },
    },
    alwaysVisible: false,
  }}
>
  {({ scrollRef, onScroll, onLayout, onContentSizeChange, ...props }) => (
    <ScrollView
      ref={scrollRef}
      onScroll={onScroll}
      onLayout={onLayout}
      onContentSizeChange={onContentSizeChange}
      {...props}
    >
      {/* Your content */}
    </ScrollView>
  )}
</ScrollableContainer>
```

### With SectionList

```tsx
<ScrollableContainer>
  {({ scrollRef, onScroll, ...props }) => (
    <SectionList
      ref={scrollRef}
      onScroll={onScroll}
      {...props}
      sections={sections}
      renderItem={renderItem}
      renderSectionHeader={renderSectionHeader}
    />
  )}
</ScrollableContainer>
```

---

## 🎛️ Props

### ScrollableContainer Props

| Prop                | Type      | Required | Description                                          |
|---------------------|-----------|----------|------------------------------------------------------|
| `children`          | `function`| ✅ Yes    | Render function that receives scroll props          |
| `style`             | `any`     | ❌ No     | Style object for the container                       |
| `inverted`          | `boolean` | ❌ No     | Whether the list is inverted (useful for FlatList with inverted={true}) |
| `scrollTrackStyling`| `object`  | ❌ No     | Styling configuration for the scroll track (see below) |
| `onPressStart`      | `function`| ❌ No     | Callback fired when a press (tap or drag) starts on the scroll track |
| `onPressEnd`        | `function`| ❌ No     | Callback fired when a drag ends on the scroll track  |

#### Inverted Scroll Behavior

When `inverted` is set to `true`, the scroll track behavior is flipped:
- Tapping at the **bottom** of the track scrolls to the **beginning** of the content (position 0)
- Tapping at the **top** of the track scrolls to the **end** of the content
- The thumb position is also inverted to match this behavior

This is useful when working with inverted FlatLists or when you want the scroll track to behave in the opposite direction from the default.

**Note**: The `inverted` prop has currently only been tested with FlatLists. Behavior with other scrollable components may vary.

```tsx
<ScrollableContainer
  inverted={true}
  scrollTrackStyling={{
    thumbColor: '#AA00FF'
  }}
>
  {/* Your FlatList with inverted={true} */}
</ScrollableContainer>
```

### `scrollTrackStyling` (optional)

Customize the scrollbar's appearance and behavior. All properties are optional.

| Prop            | Type     | Required | Description                                |
|-----------------|----------|----------|--------------------------------------------|
| `thumbColor`    | `string` | ❌ No     | Color of the draggable thumb               |
| `trackColor`    | `string` | ❌ No     | Color of the scrollbar track               |
| `trackVisible`  | `boolean`| ❌ No     | Whether the track background is visible    |
| `alwaysVisible` | `boolean`| ❌ No     | Prevents the scrollbar from fading out     |
| `trackWidth`    | `number` | ❌ No     | Width of the track                         |
| `thumbHeight`   | `number` | ❌ No     | Minimum height of the thumb                |
| `thumbShadow`   | `object` | ❌ No     | Shadow configuration for the thumb         |

#### `thumbShadow` Configuration

| Prop       | Type     | Description                    |
|------------|----------|--------------------------------|
| `color`    | `string` | Shadow color                   |
| `opacity`  | `number` | Shadow opacity (0-1)           |
| `radius`   | `number` | Shadow blur radius             |
| `offset`   | `object` | Shadow offset `{width, height}`|

---

## 🎨 Advanced Usage

### Custom Styling Examples

#### iOS-style Scrollbar

```tsx
<ScrollableContainer
  scrollTrackStyling={{
    thumbColor: '#C7C7CC',
    trackColor: 'transparent',
    trackWidth: 8,
    thumbShadow: {
      color: '#000000',
      opacity: 0.1,
      radius: 2,
      offset: { width: 0, height: 1 },
    },
  }}
>
  {/* Your content */}
</ScrollableContainer>
```

#### Material Design Style

```tsx
<ScrollableContainer
  scrollTrackStyling={{
    thumbColor: '#2196F3',
    trackColor: '#E0E0E0',
    trackWidth: 12,
    thumbShadow: {
      color: '#2196F3',
      opacity: 0.3,
      radius: 6,
      offset: { width: 0, height: 2 },
    },
    alwaysVisible: true,
  }}
>
  {/* Your content */}
</ScrollableContainer>
```

### Performance Optimization

The component is optimized for performance with:
- Native animations using `react-native-reanimated`
- Efficient gesture handling with `react-native-gesture-handler`
- Minimal re-renders through memoization
- Smooth scrolling with throttled updates

---

## 🛠️ Compatibility

- **React Native**: 0.60+
- **Expo**: SDK 49+
- **iOS**: 10.0+
- **Android**: API 21+

### Supported Scroll Components

- ✅ `FlatList`
- ✅ `SectionList`
- ✅ `VirtualizedList`
- ✅ `ScrollView`
- ✅ `DraggableFlatList` (react-native-draggable-flatlist)
- ✅ Any component that exposes `scrollToOffset` or `scrollTo` methods

---

## 🚨 Troubleshooting

### Common Issues

#### "PanGestureHandler must be used as a descendant of GestureHandlerRootView"
Make sure you've wrapped your app with `GestureHandlerRootView` as shown in the setup section.

#### Scroll track not appearing
Check that your content height is greater than the container height. The scroll track only appears when content is scrollable.

#### Jerky scrolling
Ensure `react-native-reanimated/plugin` is the **last** plugin in your `babel.config.js`.

#### TypeScript errors
The package includes TypeScript definitions. Make sure your TypeScript version is compatible with React Native.

#### Haptic feedback not working
- Ensure you've installed `react-native-haptic-feedback` correctly
- Check that haptic feedback is enabled in device settings
- Test on a physical device (haptic feedback doesn't work in simulators)

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Run the example: `npm run example`

### Issues and Feature Requests

Please use the [GitHub Issues](https://github.com/dangervalentine/react-native-scroll-track/issues) page for bug reports and feature requests.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 💖 Support

If you like this package, please consider:

- ⭐ **Starring** the repository on GitHub
- 📦 **Sharing** the package with your React Native community

**Built with ❤️ for the React Native community**
