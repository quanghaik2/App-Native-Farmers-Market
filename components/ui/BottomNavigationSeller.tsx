import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useRouter, usePathname } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "@/lib/constants/SocketContext";

interface NavItem {
  name: string;
  route: string;
  icon: string;
}

const BottomNavigationSeller: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { hasNewProductNotification } = useSocket();

  const navItems: NavItem[] = [
    { name: "Cửa hàng", route: "/(seller)/store-management", icon: "store" },
    { name: "Sản phẩm", route: "/(seller)/ProductManagement", icon: "inventory" },
    { name: "Đơn hàng", route: "/(seller)/OrderManagement", icon: "shopping-bag" },
    { name: "Thống kê", route: "/(seller)/Revenue", icon: "bar-chart" },
    { 
      name: "Thông báo", 
      route: "/(seller)/SellerNotifications", 
      icon: "notifications" 
    },
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
              {item.name === "Thông báo" && hasNewProductNotification && (
                <View className="absolute -top-1 -right-1 bg-red-500 rounded-full w-4 h-4 justify-center items-center">
                  <MaterialIcons name="warning" size={10} color="#fff" />
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