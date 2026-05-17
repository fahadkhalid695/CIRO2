import { View, Text } from 'react-native';

export function AgentCard({ name }: { name: string }) {
  return (
    <View style={{ padding: 10, borderWidth: 1, borderColor: '#ccc', borderRadius: 8 }}>
      <Text>{name}</Text>
    </View>
  );
}
