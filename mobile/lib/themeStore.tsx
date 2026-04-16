import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Palette ────────────────────────────────────────────────────────────────
export const DARK: AppTheme = {
  mode: "dark",
  bg: "#0B0F14",
  bgCard: "#111827",
  bgInput: "#1a2233",
  border: "#1e2d45",
  text: "#F9FAFB",
  textSub: "#98A2B3",
  textMuted: "#667085",
  accent: "#C9A227",
  accentText: "#111827",
  btnPrimary: "#C9A227",
  btnPrimaryText: "#111827",
  iconColor: "#C9A227",
};

export const LIGHT: AppTheme = {
  mode: "light",
  bg: "#F5F6FA",
  bgCard: "#FFFFFF",
  bgInput: "#EFF1F7",
  border: "#D1D9E0",
  text: "#111827",
  textSub: "#4B5563",
  textMuted: "#9CA3AF",
  accent: "#B8860B",
  accentText: "#FFFFFF",
  btnPrimary: "#B8860B",
  btnPrimaryText: "#FFFFFF",
  iconColor: "#B8860B",
};

export type AppTheme = {
  mode: "dark" | "light";
  bg: string;
  bgCard: string;
  bgInput: string;
  border: string;
  text: string;
  textSub: string;
  textMuted: string;
  accent: string;
  accentText: string;
  btnPrimary: string;
  btnPrimaryText: string;
  iconColor: string;
};

// ─── Context ────────────────────────────────────────────────────────────────
type ThemeCtx = {
  theme: AppTheme;
  isDark: boolean;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeCtx>({
  theme: DARK,
  isDark: true,
  toggleTheme: () => {},
});

const STORAGE_KEY = "ekel_theme";

// ─── Provider ────────────────────────────────────────────────────────────────
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(true);

  // Load persisted preference on mount
  useEffect(() => {
    (async () => {
      try {
        const stored =
          Platform.OS === "web"
            ? localStorage.getItem(STORAGE_KEY)
            : await AsyncStorage.getItem(STORAGE_KEY);
        if (stored === "light") setIsDark(false);
        else setIsDark(true); // default dark
      } catch {}
    })();
  }, []);

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      const val = next ? "dark" : "light";
      if (Platform.OS === "web") localStorage.setItem(STORAGE_KEY, val);
      else AsyncStorage.setItem(STORAGE_KEY, val).catch(() => {});
      return next;
    });
  }, []);

  const theme = isDark ? DARK : LIGHT;

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────
export function useAppTheme() {
  return useContext(ThemeContext);
}
