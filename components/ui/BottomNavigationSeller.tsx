import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useRouter, usePathname } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { callApi } from "../../lib/api/auth";
import { URL_CONNECT } from "../../lib/constants";
import { getSocket } from "@/lib/constants/websocket";

interface NavItem {
  name: string;
  route: string;
  icon: string;
}

const BottomNavigationSeller: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { token } = useAuth();
  const [pendingOrders, setPendingOrders] = useState<number>(0);

  const fetchPendingOrders = async () => {
    try {
      const result = await callApi(`${URL_CONNECT}/api/orders/seller/orders/pending`, { method: "GET" }, token);
      setPendingOrders(result?.length || 0);
    } catch (error) {
      console.error("Lỗi lấy đơn hàng đang chờ:", error);
    }
  };

  useEffect(() => {
    fetchPendingOrders();
  }, [token]);

  // Lắng nghe WebSocket để cập nhật số lượng đơn hàng đang chờ
  useEffect(() => {
    const socket = getSocket();
    socket.on("newOrder", (data) => {
      console.log("Có đơn hàng mới:", data);
      fetchPendingOrders(); // Làm mới số lượng đơn hàng đang chờ
    });

    socket.on("orderStatusUpdated", (data) => {
      console.log("Trạng thái đơn hàng được cập nhật:", data);
      fetchPendingOrders(); // Làm mới số lượng đơn hàng đang chờ
    });

    return () => {
      socket.off("newOrder");
      socket.off("orderStatusUpdated");
    };
  }, []);

  const navItems: NavItem[] = [
    { name: "Cửa hàng", route: "/(seller)/store-management", icon: "store" },
    { name: "Sản phẩm", route: "/(seller)/ProductManagement", icon: "inventory" },
    { name: "Đơn hàng", route: "/(seller)/OrderManagement", icon: "shopping-bag" },
    { name: "Thống kê", route: "/(seller)/Revenue", icon: "bar-chart" },
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
          >
            <View className="relative">
              <MaterialIcons
                name={item.icon}
                size={24}
                color={isActive ? "#F5A623" : "#A0A0A0"}
              />
              {item.name === "Đơn hàng" && pendingOrders > 0 && (
                <View className="absolute -top-2 -right-2 bg-red-500 p-[4px] rounded-full justify-center items-center">
                  <Text className="text-white text-xs font-bold">
                    {pendingOrders > 99 ? "99+" : pendingOrders}
                  </Text>
                </View>
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

export default BottomNavigationSeller;