import { Stack } from 'expo-router';

export default function VehiclesLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="add" />
      <Stack.Screen name="edit/[id]" />
    </Stack>
  );
}