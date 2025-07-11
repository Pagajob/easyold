import { Stack } from 'expo-router';

export default function ReservationsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="add" />
      <Stack.Screen name="details/[id]" />
      <Stack.Screen name="edl/[id]" />
    </Stack>
  );
}