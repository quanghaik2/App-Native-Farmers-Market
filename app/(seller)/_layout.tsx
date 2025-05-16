import { Stack } from "expo-router";

export default function SellerLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: "#10B981", // Màu nền của header
        },
        headerTintColor: "#FFFFFF", // Màu chữ/icon của header
        headerTitleStyle: {
          fontWeight: "bold",
        }, // Ẩn tiêu đề mặc định của nút back
      }}
    >
      {/* Màn hình Seller-Home */}
      <Stack.Screen
        name="SellerHome"
        options={{
          title: "Trang chủ người bán",
        }}
      />

      {/* Màn hình AddProduct */}
      <Stack.Screen
        name="AddProduct"
        options={{
          title: "Thêm sản phẩm",
        }}
      />

      {/* Màn hình EditProduct */}
      <Stack.Screen
        name="EditProduct"
        options={{
          title: "Chỉnh sửa sản phẩm",
        }}
      />

      {/* Màn hình OrderManagement */}
      <Stack.Screen
        name="OrderManagement"
        options={{
          title: "Quản lý đơn hàng",
        }}
      />

      {/* Màn hình ProductDetail */}
      <Stack.Screen
        name="ProductDetail"
        options={{
          title: "Chi tiết sản phẩm",
        }}
      />

      {/* Màn hình ProductManagement */}
      <Stack.Screen
        name="ProductManagement"
        options={{
          title: "Quản lý sản phẩm",
        }}
      />

      {/* Màn hình profile */}
      <Stack.Screen
        name="profile"
        options={{
          title: "Hồ sơ người bán",
        }}
      />

      {/* Màn hình Revenue */}
      <Stack.Screen
        name="Revenue"
        options={{
          title: "Doanh thu",
        }}
      />

      {/* Màn hình store-management */}
      <Stack.Screen
        name="store-management"
        options={{
          title: "Quản lý cửa hàng",
        }}
      />
    </Stack>
  );
}