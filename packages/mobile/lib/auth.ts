import { createAuthClient } from "better-auth/react";
import { managedAuthExpoClient } from "@runablehq/managed-auth/native";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";
const extra = Constants.expoConfig?.extra ?? {};
export function getToken(): string {
  try {
    return Platform.OS === "web"
      ? (globalThis.localStorage?.getItem("gp-token") ?? "")
      : (SecureStore.getItem("gp-token") ?? "");
  } catch {
    return "";
  }
}
function setToken(token: string) {
  if (Platform.OS === "web") globalThis.localStorage?.setItem("gp-token", token);
  else SecureStore.setItem("gp-token", token);
}
export const authClient = createAuthClient({
  baseURL: extra.apiUrl ?? process.env.EXPO_PUBLIC_API_URL,
  basePath: "/api/auth",
  plugins: [
    managedAuthExpoClient({
      applicationId: extra.applicationId,
      issuer: extra.runableAuthIssuer,
      storage: { getToken, setToken, clearToken: () => setToken("") },
    }),
  ],
  fetchOptions: {
    ...(Platform.OS === "web" ? { credentials: "omit" as const } : {}),
    auth: { type: "Bearer", token: getToken },
    headers: Platform.OS === "web" ? {} : { "expo-origin": `${Constants.expoConfig?.scheme}://` },
  },
});
export function captureToken(ctx: { response: Response }) {
  const token = ctx.response.headers.get("set-auth-token");
  if (token) setToken(token);
}
