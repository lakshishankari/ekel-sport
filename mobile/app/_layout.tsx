import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />

      {/* Role-based home */}
      <Stack.Screen name="studentHome" />
      <Stack.Screen name="adminHome" />
      <Stack.Screen name="advisoryHome" />

      {/* Advisory */}
      <Stack.Screen name="advisoryWeightages" />
      <Stack.Screen name="advisoryDashboard" />

      {/* Student */}
      <Stack.Screen name="studentSports" />
      <Stack.Screen name="mySports" />
      <Stack.Screen name="studentNotifications" />
      <Stack.Screen name="studentProfile" />

      {/* Admin */}
      <Stack.Screen name="adminUsers" />
      <Stack.Screen name="adminSports" />
      <Stack.Screen name="adminEnrollments" />
      <Stack.Screen name="adminSquadPool" />
      <Stack.Screen name="adminEvents" />
      <Stack.Screen name="adminAddMarks" />


       <Stack.Screen name="adminMatchPerformance" />
<Stack.Screen name="adminFitnessPerformance" />
<Stack.Screen name="adminDisciplinePerformance" />


      {/* Shared */}
      <Stack.Screen name="reports" />

      {/* Keep modal if exists */}
      <Stack.Screen name="modal" options={{ presentation: "modal" }} />
    </Stack>
  );
}
