import { TouchableOpacity, Text } from 'react-native';

export function Button({ title, onPress }: { title: string, onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={{ padding: 10, backgroundColor: '#0A84FF', borderRadius: 8 }}>
      <Text style={{ color: 'white', textAlign: 'center' }}>{title}</Text>
    </TouchableOpacity>
  );
}
