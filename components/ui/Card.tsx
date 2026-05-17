import { View, Text } from 'react-native';

export function Card({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ padding: 15, backgroundColor: 'white', borderRadius: 10, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 }}>
      {children}
    </View>
  );
}
