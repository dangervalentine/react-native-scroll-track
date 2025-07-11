# react-native-scroll-track

✨ A customizable, interactive scroll indicator for React Native. Tap or drag to scroll, with animated thumb and auto-hide behavior.

---

## Features

- 🧭 Drag or tap the scroll track to jump to content
- 💡 Auto-hide logic with optional persistent mode
- 📏 Dynamic thumb height based on content size
- 🎨 Customizable colors, shadows, sizes
- ✅ Supports `FlatList`, `ScrollView`, `DraggableFlatList`, etc.

## 🧪 Live Demo

Try out the scroll track interactively on **Expo Snack**:
👉 [Open in Snack](https://snack.expo.dev/@dangervalentine/scrolltrackdemo)

### Normal Scrolling
The scroll indicator syncs with native scrolling to reflect your current position.

![Normal Scrolling](https://raw.githubusercontent.com/dangervalentine/react-native-scroll-track/main/media/scroll.gif)

### Tap to Jump
Tap anywhere on the scroll track to instantly jump to that section of your content.

![Tap to Jump](https://raw.githubusercontent.com/dangervalentine/react-native-scroll-track/main/media/tap.gif)

### Drag to Scroll
Drag the thumb up and down to smoothly scroll through your content.

![Drag to Scroll](https://raw.githubusercontent.com/dangervalentine/react-native-scroll-track/main/media/drag.gif)

---

## Installation

```bash
npm install react-native-scroll-track
```

### Peer dependencies:

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

## Usage

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
          renderItem={...}
        />
      )}
    </ScrollableContainer>
  );
};
```

---

## Props

### `scrollTrackStyling` (optional)

Customize the scrollbar's appearance and behavior.

| Prop            | Type     | Description                                |
|-----------------|----------|--------------------------------------------|
| `thumbColor`    | `string` | Color of the draggable thumb               |
| `trackColor`    | `string` | Color of the scrollbar track               |
| `alwaysVisible` | `boolean`| Prevents the scrollbar from fading out     |
| `trackWidth`    | `number` | Width of the track                         |
| `thumbHeight`   | `number` | Minimum height of the thumb                |

---

## License

MIT
