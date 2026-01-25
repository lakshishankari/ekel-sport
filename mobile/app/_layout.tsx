import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />

      {/* Role-based home screens */}
      <Stack.Screen name="studentHome" />
      <Stack.Screen name="adminHome" />
      <Stack.Screen name="advisoryHome" />

      {/* Keep modal if it already exists */}
      <Stack.Screen name="modal" options={{ presentation: "modal" }} />
    </Stack>
  );
}
