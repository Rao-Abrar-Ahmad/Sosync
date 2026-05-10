import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#fff' } }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="get-started" />
      <Stack.Screen name="allow-gps" />
      <Stack.Screen name="complete-profile" />
    </Stack>
  );
}
