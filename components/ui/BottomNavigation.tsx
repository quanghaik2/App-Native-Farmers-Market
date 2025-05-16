import React, { useCallback } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useRouter, usePathname, useFocusEffect } from "expo-router";
import { useAuth } from "../../context/AuthContext"; // Điều chỉnh đường dẫn nếu cần
import { useSocket } from "@/lib/constants/SocketContext"; // Điều chỉnh đường dẫn nếu cần

// Import kiểu cho tên icon từ thư viện
type MaterialIconName = React.ComponentProps<typeof MaterialIcons>['name'];

interface NavItem {
  name: string;
  route: string;
  icon: MaterialIconName; // Sử dụng kiểu cụ thể hơn
}

const BottomNavigation: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  // Giả sử useAuth trả về đúng các kiểu dữ liệu này
  const { cartItemCount, fetchCartCount, token } = useAuth();
  // Giả sử useSocket trả về đúng các kiểu dữ liệu này
  const { hasNewNotification, setHasNewNotification } = useSocket();

  // Hook này fetch số lượng giỏ hàng khi màn hình được focus và có token
  useFocusEffect(
    useCallback(() => {
      if (token) {
        fetchCartCount();
      }
      // Đảm bảo fetchCartCount được bọc trong useCallback trong AuthContext nếu cần
    }, [token, fetchCartCount])
  );

  // Hook này reset trạng thái thông báo mới khi vào trang thông báo
  useFocusEffect(
    useCallback(() => {
      if (pathname === "/notifications") {
        setHasNewNotification(false);
      }
    }, [pathname, setHasNewNotification])
  );

  // Danh sách các mục điều hướng với kiểu icon đã được kiểm tra
  const navItems: NavItem[] = [
    { name: "Trang chủ", route: "/home", icon: "home" },
    { name: "Danh sách", route: "/products", icon: "list" },
    { name: "Giỏ hàng", route: "/cart", icon: "shopping-cart" }, // Đảm bảo tên icon chính xác
    { name: "Thông báo", route: "/notifications", icon: "notifications" }, // Đảm bảo tên icon chính xác
  ];

  return (
    <View className="flex-row justify-around items-center bg-white py-2 px-4 border-t border-gray-200">
      {navItems.map((item) => {
        const isActive = pathname === item.route;
        return (
          <TouchableOpacity
            key={item.name}
            className="flex-1 items-center"
            onPress={() => router.push(item.route)}
            accessibilityRole="button" // Thêm hỗ trợ tiếp cận
            accessibilityLabel={item.name} // Thêm hỗ trợ tiếp cận
          >
            <View className="relative">
              <MaterialIcons
                name={item.icon} // Giờ đây tên icon được kiểm tra kiểu chặt chẽ hơn
                size={24}
                color={isActive ? "#F5A623" : "#A0A0A0"}
              />
              {/* Badge cho giỏ hàng */}
              {item.name === "Giỏ hàng" && typeof cartItemCount === 'number' && cartItemCount > 0 && (
                <View
                  style={{
                    position: "absolute",
                    top: -5,
                    right: -10, // Điều chỉnh vị trí nếu cần
                    backgroundColor: "red",
                    borderRadius: 10,
                    minWidth: 20, // Sử dụng minWidth để badge nhỏ hơn vẫn tròn
                    height: 20,
                    justifyContent: "center",
                    alignItems: "center",
                    paddingHorizontal: 5, // Thêm padding để số không bị quá sát viền
                  }}
                >
                  <Text style={{ color: "white", fontSize: 12, fontWeight: "bold" }}>
                    {cartItemCount > 99 ? "99+" : cartItemCount}
                  </Text>
                </View>
              )}
              {/* Badge cho thông báo */}
              {item.name === "Thông báo" && hasNewNotification && (
                <View
                  style={{
                    position: "absolute",
                    top: -5, // Điều chỉnh vị trí nếu cần
                    right: -5, // Điều chỉnh vị trí nếu cần
                    backgroundColor: "red",
                    borderRadius: 6, // Làm tròn nhỏ hơn
                    width: 12,
                    height: 12,
                  }}
                /> // Dấu chấm đỏ đơn giản thường đủ
              )}
            </View>
            <Text
              className={`text-xs mt-1 ${isActive ? "text-yellow-500" : "text-gray-500"}`}
            >
              {item.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default BottomNavigation;