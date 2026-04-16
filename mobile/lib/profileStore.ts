import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "ekel_student_profile";

export type LocalProfile = {
  department: string;
  yearOfStudy: string;
  bio: string;
  avatarColor: string; // persistent color for initials avatar
};

const AVATAR_COLORS = [
  "#4F46E5", "#0891B2", "#059669", "#D97706",
  "#DC2626", "#7C3AED", "#DB2777", "#0284C7",
];

function pickColor(name: string): string {
  const idx = (name.charCodeAt(0) || 0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

export async function loadLocalProfile(fullName = ""): Promise<LocalProfile> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as LocalProfile;
  } catch {}
  return { department: "", yearOfStudy: "", bio: "", avatarColor: pickColor(fullName) };
}

export async function saveLocalProfile(profile: LocalProfile): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(profile));
  } catch {}
}
