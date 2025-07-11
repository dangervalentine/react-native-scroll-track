import React from 'react';
import { View, Text, FlatList } from 'react-native';
import { ScrollableContainer } from '../src/index';

const data = Array.from({ length: 100 }, (_, i) => ({
    id: i,
    title: `Item ${i + 1}`,
    description: `This is the description for item ${i + 1}`,
}));

const BasicExample = () => {
    return (
        <ScrollableContainer
            scrollTrackStyling={{
                thumbColor: '#007AFF',
                trackColor: '#E5E5E5',
                alwaysVisible: false,
                trackWidth: 4,
                thumbHeight: 30,
                thumbShadow: {
                    color: '#000000',
                    opacity: 0.2,
                    radius: 4,
                    offset: { width: 0, height: 2 },
                },
            }}
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
                    data={data}
                    onScroll={onScroll}
                    onLayout={onLayout}
                    onContentSizeChange={onContentSizeChange}
                    scrollEventThrottle={scrollEventThrottle}
                    showsVerticalScrollIndicator={showsVerticalScrollIndicator}
                    renderItem={({ item }) => (
                        <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E5E5' }}>
                            <Text style={{ fontSize: 16, fontWeight: 'bold' }}>{item.title}</Text>
                            <Text style={{ fontSize: 14, color: '#666', marginTop: 4 }}>
                                {item.description}
                            </Text>
                        </View>
                    )}
                    keyExtractor={(item) => item.id.toString()}
                />
            )}
        </ScrollableContainer>
    );
};

export default BasicExample;
