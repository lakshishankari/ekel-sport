import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  StatusBar,
  Dimensions,
} from "react-native";
import { useRouter, type Href } from "expo-router";
import { loadAuth } from "../lib/authStore";
import { useAppTheme } from "../lib/themeStore";

const { width } = Dimensions.get("window");

// ─── Sun / Moon SVG-free icon using emoji + animated pill toggle ─────────────
function ThemeToggle() {
  const { isDark, toggleTheme, theme } = useAppTheme();

  // Animate the thumb position
  const thumbAnim = useRef(new Animated.Value(isDark ? 0 : 1)).current;

  useEffect(() => {
    Animated.spring(thumbAnim, {
      toValue: isDark ? 0 : 1,
      useNativeDriver: false,
      speed: 20,
      bounciness: 6,
    }).start();
  }, [isDark]);

  const thumbLeft = thumbAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [3, 27],
  });

  return (
    <TouchableOpacity
      onPress={toggleTheme}
      activeOpacity={0.8}
      style={styles.toggleWrap}
      accessibilityLabel={isDark ? "Switch to light mode" : "Switch to dark mode"}
      accessibilityRole="switch"
    >
      {/* Moon */}
      <Text style={styles.toggleEmoji}>🌙</Text>

      {/* Pill track */}
      <View
        style={[
          styles.track,
          { backgroundColor: isDark ? "#1e2d45" : "#D1D9E0" },
        ]}
      >
        <Animated.View
          style={[
            styles.thumb,
            {
              left: thumbLeft,
              backgroundColor: theme.accent,
            },
          ]}
        />
      </View>

      {/* Sun */}
      <Text style={styles.toggleEmoji}>☀️</Text>
    </TouchableOpacity>
  );
}

// ─── Welcome Screen ──────────────────────────────────────────────────────────
export default function IndexScreen() {
  const router = useRouter();
  const { theme, isDark } = useAppTheme();

  // Fade-in animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Auto-redirect if already logged in
  useEffect(() => {
    (async () => {
      const { token, role } = await loadAuth();
      if (token && role) {
        if (role === "STUDENT") router.replace("/studentHome" as Href);
        else if (role === "ADMIN") router.replace("/adminHome" as Href);
        else router.replace("/advisoryHome" as Href);
      }
    })();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={theme.bg}
      />

      {/* ── Theme Toggle (top-right) ── */}
      <View style={styles.topBar}>
        <ThemeToggle />
      </View>

      {/* ── Decorative accent blob ── */}
      <View
        style={[
          styles.blob,
          {
            backgroundColor: theme.accent,
            opacity: isDark ? 0.08 : 0.12,
          },
        ]}
      />

      {/* ── Content ── */}
      <Animated.View
        style={[
          styles.content,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        {/* Badge */}
        <View
          style={[
            styles.badge,
            {
              backgroundColor: isDark ? "#1a2233" : "#FEF9EC",
              borderColor: theme.accent,
            },
          ]}
        >
          <Text style={[styles.badgeText, { color: theme.accent }]}>
            ⚽  Sports Management System
          </Text>
        </View>

        {/* Heading */}
        <Text style={[styles.title, { color: theme.text }]}>
          Welcome to{"\n"}
          <Text style={{ color: theme.accent }}>EKEL-Sport</Text>
        </Text>

        <Text style={[styles.sub, { color: theme.textSub }]}>
          University of Kelaniya official{"\n"}sports management platform
        </Text>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        {/* Login button */}
        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: theme.btnPrimary }]}
          onPress={() => router.push("/login" as Href)}
          activeOpacity={0.85}
        >
          <Text style={[styles.primaryBtnText, { color: theme.btnPrimaryText }]}>
            Login
          </Text>
        </TouchableOpacity>

        {/* Register link */}
        <TouchableOpacity
          style={[
            styles.outlineBtn,
            {
              borderColor: theme.accent,
              backgroundColor: isDark ? "transparent" : "#FEF9EC",
            },
          ]}
          onPress={() => router.push("/register" as Href)}
          activeOpacity={0.85}
        >
          <Text style={[styles.outlineBtnText, { color: theme.accent }]}>
            Student Register
          </Text>
        </TouchableOpacity>

        {/* Note */}
        <Text style={[styles.note, { color: theme.textMuted }]}>
          🔒  Admin & Advisory accounts are provided by the system.
        </Text>
      </Animated.View>

      {/* ── Bottom decoration ── */}
      <View
        style={[
          styles.bottomBar,
          { backgroundColor: theme.accent, opacity: isDark ? 0.18 : 0.25 },
        ]}
      />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    position: "absolute",
    top: 52,
    right: 20,
    zIndex: 10,
  },
  // Toggle
  toggleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  toggleEmoji: {
    fontSize: 16,
  },
  track: {
    width: 52,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    position: "relative",
  },
  thumb: {
    position: "absolute",
    width: 22,
    height: 22,
    borderRadius: 11,
    top: 3,
  },
  // Blob
  blob: {
    position: "absolute",
    top: -80,
    right: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
  },
  // Content
  content: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: "center",
    paddingBottom: 40,
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    marginBottom: 22,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  title: {
    fontSize: 42,
    fontWeight: "900",
    lineHeight: 50,
    marginBottom: 14,
    letterSpacing: -0.5,
  },
  sub: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400",
  },
  divider: {
    height: 1,
    marginVertical: 32,
    borderRadius: 999,
    opacity: 0.5,
  },
  primaryBtn: {
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: "center",
    marginBottom: 14,
    shadowColor: "#C9A227",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  primaryBtnText: {
    fontWeight: "800",
    fontSize: 16,
    letterSpacing: 0.3,
  },
  outlineBtn: {
    paddingVertical: 15,
    borderRadius: 999,
    alignItems: "center",
    borderWidth: 1.5,
    marginBottom: 28,
  },
  outlineBtnText: {
    fontWeight: "700",
    fontSize: 16,
  },
  note: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },
  // Bottom accent
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
  },
});
