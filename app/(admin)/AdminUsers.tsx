import { View, Text, FlatList, Alert, ActivityIndicator, TouchableOpacity } from "react-native";
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { URL_CONNECT } from "../../lib/constants";
import { UserObject } from "../../lib/constants/constants";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";

interface User {
  id: number;
  email: string;
  full_name: string;
  role: "buyer" | "seller";
  phone_number?: string;
  address?: string;
  avatar_url?: string;
}

export default function AdminUsers() {
  const { user, token } = useAuth() as { user: UserObject; token: string };
  const [users, setUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<"buyers" | "sellers">("buyers");
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!user || user.role !== "admin") {
      Alert.alert("Lỗi", "Bạn không có quyền truy cập trang này!");
      router.replace("/(auth)/login-seller");
      return;
    }
    fetchUsers();
  }, [user, router, token]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${URL_CONNECT}/api/auth/AllForAdmin`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Không thể tải danh sách người dùng");
      }
      setUsers(data);
    } catch (error: any) {
      Alert.alert("Lỗi", "Không thể tải danh sách người dùng: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter((u) =>
    activeTab === "buyers" ? u.role === "buyer" : u.role === "seller"
  );

  const renderUserItem = ({ item }: { item: User }) => (
    <TouchableOpacity
      onPress={() => {
        try {
          router.push({
            pathname: "/(admin)/UserDetail",
            params: { user: JSON.stringify(item) },
          });
        } catch (error: any) {
          Alert.alert("Lỗi", "Không thể điều hướng: " + error.message);
        }
      }}
    >
      <View className="bg-white rounded-lg p-4 mb-4 shadow-md flex-row justify-between items-center">
        <View className="flex-1 mr-3">
          <Text className="text-base font-semibold text-gray-800">{item.full_name}</Text>
          <Text className="text-sm text-gray-500">Email: {item.email}</Text>
          <Text className="text-sm text-gray-500">
            Vai trò: {item.role === "buyer" ? "Khách hàng" : "Cửa hàng"}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-gray-100 p-4 pt-6">
      <Text className="text-3xl font-bold text-green-600 mb-6 text-center">
        Quản lý Người dùng
      </Text>

      <View className="flex-row mb-4">
        <TouchableOpacity
          className={`flex-1 p-3 rounded-l-lg ${activeTab === "buyers" ? "bg-green-600 text-white" : "bg-gray-200"}`}
          onPress={() => setActiveTab("buyers")}
        >
          <Text className="text-center font-semibold">Khách hàng</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 p-3 rounded-r-lg ${activeTab === "sellers" ? "bg-green-600 text-white" : "bg-gray-200"}`}
          onPress={() => setActiveTab("sellers")}
        >
          <Text className="text-center font-semibold">Cửa hàng</Text>
        </TouchableOpacity>
      </View>

      <View className="flex-row gap-2 mb-4">
        <TouchableOpacity
          className="flex-1 py-3 rounded-lg flex-row justify-center items-center"
          style={{ backgroundColor: "blue" }}
          onPress={fetchUsers}
        >
          <MaterialIcons name="refresh" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text className="text-white text-base font-semibold">Làm mới</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 py-3 rounded-lg flex-row justifying-center items-center"
          style={{ backgroundColor: "purple" }}
          onPress={() => router.push("/(admin)/AdminHome")}
        >
          <Text className="text-white text-base font-semibold">Quản lý Danh mục</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#10B981" className="mt-10" />
      ) : filteredUsers.length === 0 ? (
        <Text className="text-center text-gray-500 mt-10 text-base">
          Không có {activeTab === "buyers" ? "khách hàng" : "cửa hàng"} nào.
        </Text>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderUserItem}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
}