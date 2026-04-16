import { Link } from "expo-router";
import { View, Text } from "react-native";
import { useAppTheme } from "../lib/themeStore";

export default function ModalScreen() {
  const { theme } = useAppTheme();
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 20, backgroundColor: theme.bg }}>
      <Text style={{ fontSize: 24, fontWeight: "900", color: theme.text, marginBottom: 16 }}>Modal</Text>
      <Link href="/" dismissTo>
        <Text style={{ color: theme.accent, textDecorationLine: "underline", fontWeight: "700" }}>Go to home screen</Text>
      </Link>
    </View>
  );
}
