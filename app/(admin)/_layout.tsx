import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack>
      <Stack.Screen name="AddCategory" options={{ title: "Thêm Danh mục" }} />
      <Stack.Screen name="AdminDashboard" options={{ title: "Welcome" }} />
      <Stack.Screen name="AdminHome" options={{ title: "Trang chủ" }} />
      <Stack.Screen name="AdminUsers" options={{ title: "Danh Sách Người Dùng" }} />
      <Stack.Screen name="EditCategory" options={{ title: "Sửa Danh Mục" }} />
      <Stack.Screen name="UserDetail" options={{ title: "Chi tiết Người Dùng" }} />
    </Stack>
  );
}