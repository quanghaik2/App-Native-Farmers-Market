import React, { useState, useEffect, useCallback } from "react"; // Import React
import {
  View,
  Text,
  FlatList,
  Alert,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  ListRenderItem, // Import ListRenderItem for FlatList typing
  StyleSheet, // Import StyleSheet if needed for non-Tailwind styles
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext"; // Assuming AuthContext provides typed values
import { callApi } from "@/lib/api/auth";
import { URL_CONNECT } from "../../lib/constants";
import { Category, UserObject } from "../../lib/constants/constants"; // Ensure these types are defined/imported
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import Ionicons from "react-native-vector-icons/Ionicons";

// Định nghĩa kiểu cho Context nếu chưa có trong file context
interface AuthContextType {
  user: UserObject | null;
  token: string | null;
  // Add other context properties if needed
}

const AdminHome: React.FC = () => { // Define as Functional Component
  // Sử dụng kiểu đã định nghĩa cho context, hoặc dùng as nếu chắc chắn
  const { user, token } = useAuth() as AuthContextType;
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  const fetchCategories = useCallback(async () => { // useCallback for stability if passed as prop
    if (!token) {
      Alert.alert("Lỗi", "Yêu cầu xác thực.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const categoriesData: Category[] = await callApi( // Explicitly type the expected return
        `${URL_CONNECT}/api/categories`,
        { method: "GET" },
        token
      );
      setCategories(categoriesData);
    } catch (error: unknown) { // Use unknown for better type safety
      const message = error instanceof Error ? error.message : String(error);
      Alert.alert("Lỗi", "Không thể tải danh mục: " + message);
      setCategories([]); // Reset on error
    } finally {
      setIsLoading(false);
    }
  }, [token]); // Dependency: token

  useEffect(() => {
    if (!user || user.role !== "admin") {
      Alert.alert("Lỗi", "Bạn không có quyền truy cập trang này!");
      router.replace("/(auth)/login-seller");
      return;
    }
    fetchCategories();
  }, [user, router, fetchCategories]); // Dependencies: user, router, fetchCategories

  const handleDeleteCategory = (categoryId: number): void => {
    if (!token) {
       Alert.alert("Lỗi", "Yêu cầu xác thực.");
       return;
    }
    Alert.alert(
      "Xác nhận xóa",
      "Bạn có chắc chắn muốn xóa danh mục này?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          onPress: async () => {
            try {
              await callApi(
                `${URL_CONNECT}/api/categories/${categoryId}`,
                { method: "DELETE" },
                token
              );
              Alert.alert("Thành công", "Xóa danh mục thành công!");
              fetchCategories(); // Fetch lại danh sách
            } catch (error: unknown) { // Use unknown
               const message = error instanceof Error ? error.message : String(error);
              Alert.alert("Lỗi", "Xóa danh mục thất bại: " + message);
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  // Define the render function type explicitly
  const renderCategoryItem: ListRenderItem<Category> = ({ item }) => (
     <View className="bg-white rounded-lg p-4 mb-4 shadow flex-row items-center">
      {item.image_url ? (
        <Image
          source={{ uri: `${URL_CONNECT}${item.image_url}` }}
          className="w-16 h-16 rounded-md mr-4 bg-gray-200"
          resizeMode="cover"
        />
      ) : (
        <View className="w-16 h-16 rounded-md mr-4 bg-gray-200 items-center justify-center">
           <MaterialIcons name="category" size={24} color="#9CA3AF" />
        </View>
      )}
      <View className="flex-1">
        <Text className="text-base font-semibold text-gray-800 mb-1">{item.name}</Text>
        <Text className="text-xs text-gray-500">ID: {item.id}</Text>
      </View>
      <View className="flex-row gap-2 ml-2">
        <TouchableOpacity
          className="p-2 rounded-full bg-yellow-100 active:bg-yellow-200"
          onPress={() =>
            router.push({
              pathname: "/(admin)/EditCategory",
              params: { category: JSON.stringify(item) }, // Ensure EditCategory can parse this
            })
          }
          accessibilityLabel={`Sửa danh mục ${item.name}`} // Accessibility
        >
          <MaterialIcons name="edit" size={20} color="#F59E0B" />
        </TouchableOpacity>
        <TouchableOpacity
          className="p-2 rounded-full bg-red-100 active:bg-red-200"
          onPress={() => handleDeleteCategory(item.id)}
           accessibilityLabel={`Xóa danh mục ${item.name}`} // Accessibility
        >
          <MaterialIcons name="delete-outline" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-100 p-4 pt-8">
      <Text className="text-2xl font-bold text-gray-800 mb-6 text-center">
        Quản lý Danh mục
      </Text>

      {/* Action Buttons */}
      <View className="flex-row gap-3 mb-6">
        <TouchableOpacity
          className="flex-1 py-3 px-2 bg-green-600 rounded-lg flex-row justify-center items-center shadow active:bg-green-700"
          onPress={() => router.push("/(admin)/AddCategory")}
        >
          <MaterialIcons name="add" size={20} color="#fff" className="mr-2" />
          <Text className="text-white text-sm font-semibold">Thêm mới</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 py-3 px-2 bg-blue-500 rounded-lg flex-row justify-center items-center shadow active:bg-blue-600"
          onPress={fetchCategories} // Re-fetch
        >
          <MaterialIcons name="refresh" size={20} color="#fff" className="mr-2" />
          <Text className="text-white text-sm font-semibold">Làm mới</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 py-3 px-2 bg-purple-500 rounded-lg flex-row justify-center items-center shadow active:bg-purple-600"
          onPress={() => router.push("/(admin)/AdminUsers")}
        >
          <MaterialIcons name="people-outline" size={20} color="#fff" className="mr-2" />
          <Text className="text-white text-sm font-semibold">Người dùng</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 py-3 px-2 bg-orange-500 rounded-lg flex-row justify-center items-center shadow active:bg-orange-600"
          onPress={() => router.push("/(admin)/AdminReportList")}
        >
          <MaterialIcons name="list-alt" size={20} color="#fff" className="mr-2" />
          <Text className="text-white text-sm font-semibold">Báo cáo</Text>
        </TouchableOpacity>
      </View>

      {/* Content Area */}
      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#10B981" />
        </View>
      ) : categories.length === 0 ? (
         <View className="flex-1 justify-center items-center bg-gray-50 rounded-lg p-6">
            <MaterialIcons name="info-outline" size={48} color="#6B7280" />
            <Text className="text-center text-gray-500 mt-4 text-base">
             Chưa có danh mục nào.
            </Text>
            <Text className="text-center text-gray-500 text-base">
             Bấm "Thêm mới" để bắt đầu.
            </Text>
         </View>
      ) : (
        <FlatList<Category> // Specify the item type for FlatList
          data={categories}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderCategoryItem}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

export default AdminHome; // Export the component