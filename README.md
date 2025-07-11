# react-native-scroll-track

✨ A customizable, interactive scroll indicator for React Native. Tap or drag to scroll, with animated thumb and auto-hide behavior.

---

## Features

- 🧭 Drag or tap the scroll track to jump to content
- 💡 Auto-hide logic with optional persistent mode
- 📏 Dynamic thumb height based on content size
- 🎨 Customizable colors, shadows, sizes
- ✅ Supports `FlatList`, `ScrollView`, `DraggableFlatList`, etc.

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
