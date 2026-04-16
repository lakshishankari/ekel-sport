import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const TOKEN_KEY    = "ekel_token";
const ROLE_KEY     = "ekel_role";
const NAME_KEY     = "ekel_fullname";
const EMAIL_KEY    = "ekel_email";

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

export async function saveAuth(
  token: string,
  role: string,
  fullName?: string,
  email?: string
) {
  await setItem(TOKEN_KEY, token);
  await setItem(ROLE_KEY, role);
  if (fullName) await setItem(NAME_KEY, fullName);
  if (email)    await setItem(EMAIL_KEY, email);
}

export async function loadAuth() {
  const token    = await getItem(TOKEN_KEY);
  const role     = await getItem(ROLE_KEY);
  const fullName = await getItem(NAME_KEY);
  const email    = await getItem(EMAIL_KEY);
  return { token, role, fullName, email };
}

export async function clearAuth() {
  await delItem(TOKEN_KEY);
  await delItem(ROLE_KEY);
  await delItem(NAME_KEY);
  await delItem(EMAIL_KEY);
}
