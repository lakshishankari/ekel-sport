import { Stack, usePathname } from "expo-router";
import { useEffect } from "react";
import { BackHandler } from "react-native";

export default function RootLayout() {
  const pathname = usePathname();

  useEffect(() => {
    // Role home screens where back button should be blocked
    const homeRoutes = ["/studentHome", "/adminHome", "/advisoryHome", "/advisoryWeightages"];

    // Block hardware back button on home screens to prevent unauthorized navigation
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      if (homeRoutes.includes(pathname)) {
        // Prevent going back from home screen - consume the event
        return true;
      }
      // Allow default back behavior for other screens
      return false;
    });

    return () => backHandler.remove();
  }, [pathname]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />

      <Stack.Screen name="forgotPassword" />
      <Stack.Screen name="verifyOtp" />
      <Stack.Screen name="verifyRegistrationOtp" />
      <Stack.Screen name="resetPassword" />


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
      <Stack.Screen name="studentAttendance" />
      <Stack.Screen name="studentPerformance" />
      <Stack.Screen name="studentScanAttendance" />

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
      <Stack.Screen name="adminReports" />
      <Stack.Screen name="adminCreateSession" />
      <Stack.Screen name="adminDisplayQR" />
      <Stack.Screen name="adminAttendanceList" />
      <Stack.Screen name="adminAnnouncements" />

      {/* Advisory */}
      <Stack.Screen name="createAdvisory" />
      <Stack.Screen name="advisoryEligibility" />

      {/* Shared */}
      <Stack.Screen name="reports" />
      <Stack.Screen name="help" />

      {/* Keep modal if exists */}
      <Stack.Screen name="modal" options={{ presentation: "modal" }} />
    </Stack>
  );
}
