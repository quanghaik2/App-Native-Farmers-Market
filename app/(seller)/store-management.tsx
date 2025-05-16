import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import Icon from "react-native-vector-icons/FontAwesome"; // Sử dụng FontAwesome

export default function StoreManagement() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-white p-4">
      <Text className="text-2xl font-bold text-emerald-600 mb-6">Quản lý cửa hàng</Text>

      {/* Menu */}
      <TouchableOpacity
        className="flex-row items-center bg-blue-100 p-4 rounded-lg mb-4"
        onPress={() => router.push("/(seller)/ProductManagement")}
      >
        <Icon name="shopping-bag" size={24} color="#3B82F6" />
        <Text className="ml-4 text-lg font-semibold text-blue-600">Quản lý sản phẩm</Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="flex-row items-center bg-green-100 p-4 rounded-lg mb-4"
        onPress={() => router.push("/(seller)/OrderManagement")}
      >
        <Icon name="list-alt" size={24} color="#10B981" />
        <Text className="ml-4 text-lg font-semibold text-green-600">Quản lý đơn hàng</Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="flex-row items-center bg-yellow-100 p-4 rounded-lg mb-4"
        onPress={() => router.push("/(seller)/Revenue")}
      >
        <Icon name="bar-chart" size={24} color="#F59E0B" />
        <Text className="ml-4 text-lg font-semibold text-yellow-600">Xem doanh thu</Text>
      </TouchableOpacity>
    </View>
  );
}