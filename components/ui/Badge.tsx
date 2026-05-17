import { View, Text } from 'react-native';

export function Badge({ text }: { text: string }) {
  return (
    <View style={{ paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#32D74B', borderRadius: 12 }}>
      <Text style={{ color: 'white', fontSize: 12 }}>{text}</Text>
    </View>
  );
}
