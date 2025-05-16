import { View, Text, Alert } from "react-native";
import { useEffect } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { UserObject } from "../../lib/constants/constants";

export default function AdminDashboard() {
  const { user } = useAuth() as { user: UserObject };
  const router = useRouter();

  useEffect(() => {
    if (!user || user.role !== "admin") {
      Alert.alert("Lỗi", "Bạn không có quyền truy cập trang này!");
      router.replace("/(auth)/login-seller");
    }
  }, [user, router]);

  return (
    <View className="flex-1 bg-gray-100 justify-center items-center p-4">
      <Text className="text-3xl font-bold text-green-600 mb-6 text-center">
        Tổng quan Admin
      </Text>
      <Text className="text-base text-gray-700 text-center">
        Chào mừng bạn đến với bảng điều khiển quản trị! Sử dụng menu dưới để quản lý danh mục và người dùng.
      </Text>
    </View>
  );
}