import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack>
      <Stack.Screen name="Checkout" options={{ title: "Thanh toán" }} />
      <Stack.Screen name="OrderDetail" options={{ title: "Chi tiết đơn hàng" }} />
      <Stack.Screen name="Orders" options={{ title: "Danh sách đơn hàng" }} />
      <Stack.Screen name="profile" options={{ title: "Thông tin người dùng" }} />
      <Stack.Screen name="Report" options={{ title: "Báo cáo sản phẩm" }} />
      <Stack.Screen name="ProductDetail" options={{ title: "Chi tiết sản phẩm" }} />
    </Stack>
  );
}