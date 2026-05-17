import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: 'Home',
          tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="input" 
        options={{ 
          title: 'Input',
          tabBarIcon: ({ color }) => <Ionicons name="create" size={24} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="analysis" 
        options={{ 
          title: 'Analysis',
          tabBarIcon: ({ color }) => <Ionicons name="analytics" size={24} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="actions" 
        options={{ 
          title: 'Actions',
          tabBarIcon: ({ color }) => <Ionicons name="list" size={24} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="simulation" 
        options={{ 
          title: 'Simulation',
          tabBarIcon: ({ color }) => <Ionicons name="play" size={24} color={color} />
        }} 
      />
    </Tabs>
  );
}
