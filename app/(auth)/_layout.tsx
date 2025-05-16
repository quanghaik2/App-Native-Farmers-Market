import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack>
      <Stack.Screen name="select-role" options={{ headerShown: false }} />
      <Stack.Screen name="login-buyer" options={{ title: "Đăng nhập - Người mua" }} />
      <Stack.Screen name="login-seller" options={{ title: "Đăng nhập - Người bán" }} />
      <Stack.Screen name="register-buyer" options={{ title: "Đăng ký - Người mua" }} />
      <Stack.Screen name="register-seller" options={{ title: "Đăng ký - Người bán" }} />
    </Stack>
  );
}