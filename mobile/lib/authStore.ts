import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "ekel_token";
const ROLE_KEY = "ekel_role";

async function setItem(key: string, value: string) {
  if (Platform.OS === "web") localStorage.setItem(key, value);
  else await SecureStore.setItemAsync(key, value);
}

async function getItem(key: string) {
  if (Platform.OS === "web") return localStorage.getItem(key);
  return await SecureStore.getItemAsync(key);
}

async function delItem(key: string) {
  if (Platform.OS === "web") localStorage.removeItem(key);
  else await SecureStore.deleteItemAsync(key);
}

export async function saveAuth(token: string, role: string) {
  await setItem(TOKEN_KEY, token);
  await setItem(ROLE_KEY, role);
}

export async function loadAuth() {
  const token = await getItem(TOKEN_KEY);
  const role = await getItem(ROLE_KEY);
  return { token, role };
}

export async function clearAuth() {
  await delItem(TOKEN_KEY);
  await delItem(ROLE_KEY);
}
