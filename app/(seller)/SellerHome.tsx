import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  FlatList,
  ActivityIndicator,
  Image,
} from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { callApi } from "../../lib/api/auth";
import { URL_CONNECT } from "../../lib/constants";
import BottomNavigationSeller from "@/components/ui/BottomNavigationSeller";
import { Avatar } from "react-native-elements";
import { formatPrice } from "@/lib/utils";

interface Product {
  id: number;
  name: string;
  price: string;
  image_url?: string;
  stock: number;
}

interface Stats {
  revenueToday: number;
  pendingOrders: number;
  activeProducts: number;
}

interface Profile {
  full_name: string;
  phone_number: string;
  address: string;
  avatar_url: string;
}

const SellerHome: React.FC = () => {
  const { user, token } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile>({
    full_name: "",
    phone_number: "",
    address: "",
    avatar_url: "",
  });
  const [stats, setStats] = useState<Stats>({
    revenueToday: 0,
    pendingOrders: 0,
    activeProducts: 0,
  });
  const [topProducts, setTopProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!token || !user?.id) {
        console.log("Không có token hoặc user ID, bỏ qua fetch data.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Lấy thông tin profile
        const profileResult = await callApi(
          `${URL_CONNECT}/api/auth/profile`,
          { method: "GET" },
          token
        );
        setProfile({
          full_name: profileResult.full_name || "",
          phone_number: profileResult.phone_number || "",
          address: profileResult.address || "",
          avatar_url: profileResult.avatar_url || "",
        });

        // Lấy thống kê
        const statsResult = await callApi(
          `${URL_CONNECT}/api/orders/seller/stats/revenue`,
          { method: "GET" },
          token
        );
        setStats({
          revenueToday: statsResult.revenueToday || 0,
          pendingOrders: statsResult.pendingOrders || 0,
          activeProducts: statsResult.activeProducts || 0,
        });

        // Lấy danh sách sản phẩm
        const productsResult = await callApi(
          `${URL_CONNECT}/api/products/seller/${user.id}`,
          { method: "GET" },
          token
        );
        if (Array.isArray(productsResult)) {
          setTopProducts(productsResult.slice(0, 5));
        } else {
          console.warn("Products Result không phải mảng:", productsResult);
          setTopProducts([]);
        }
      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token, user]);

  // const formatPrice = (price: number) => {
  //   return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "đ";
  // };

  const renderProduct = ({ item }: { item: Product }) => {
    const imageUri = item.image_url
      ? `${URL_CONNECT}${item.image_url}`
      : "https://via.placeholder.com/100";

    return (
      <TouchableOpacity
        className="flex-row items-center p-4 bg-white rounded-xl mb-3 shadow-md border border-gray-200"
        onPress={() => router.push(`/(seller)/ProductDetail?productId=${item.id}`)}
      >
        <View className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
          <Image
            source={{ uri: imageUri }}
            className="w-full h-full"
            resizeMode="cover"
            onError={(error) => console.log("Lỗi tải hình ảnh:", error.nativeEvent.error)}
          />
        </View>
        <View className="flex-1 ml-4">
          <Text className="text-lg font-semibold text-gray-900">
            {item.name || "Sản phẩm không xác định"}
          </Text>
          <Text className="text-md font-medium text-red-600">
            {item.price != null ? formatPrice(parseInt(item.price)) : "Giá không xác định"}
          </Text>
          {/* <Text className="text-sm text-gray-600 mt-1">
            Còn lại: {item.stock != null ? item.stock : 0} sản phẩm
          </Text> */}
        </View>
        <MaterialIcons name="chevron-right" size={24} color="#6B7280" />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <View className="bg-white p-6 rounded-b-3xl shadow-md">
          <View className="flex-row items-center mb-4">
            <Avatar
              rounded
              size="large"
              source={{
                uri: profile.avatar_url
                  ? `${URL_CONNECT}${profile.avatar_url}`
                  : "https://via.placeholder.com/150",
              }}
              containerStyle={{ borderWidth: 2, borderColor: "#10B981" }}
            />
            <View className="ml-4 flex-1">
              <Text className="text-2xl font-bold text-gray-900">
                Chào {profile.full_name || "Người bán"}!
              </Text>
              <TouchableOpacity
                className="flex-row items-center mt-2"
                onPress={() => router.push("/(seller)/profile")}
              >
                <MaterialIcons name="person" size={20} color="#10B981" />
                <Text className="ml-1 text-md font-medium text-green-600">Xem hồ sơ</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View className="px-4 mt-6">
          <View className="flex-row justify-between mb-4">
            <View className="bg-white p-4 rounded-xl flex-1 mr-2 shadow-md border border-gray-200">
              <Text className="text-sm text-gray-600">Doanh thu hôm nay</Text>
              <Text className="text-xl font-bold text-green-600 mt-1">
                {formatPrice(stats.revenueToday)}
              </Text>
            </View>
            <View className="bg-white p-4 rounded-xl flex-1 ml-2 shadow-md border border-gray-200">
              <Text className="text-sm text-gray-600">Đơn hàng chờ</Text>
              <Text className="text-xl font-bold text-yellow-600 mt-1">
                {stats.pendingOrders}
              </Text>
            </View>
          </View>
          <View className="bg-white p-4 rounded-xl shadow-md border border-gray-200">
            <Text className="text-sm text-gray-600">Sản phẩm đang bán</Text>
            <Text className="text-xl font-bold text-blue-600 mt-1">
              {stats.activeProducts}
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="px-4 mt-6">
          <Text className="text-xl font-semibold text-gray-900 mb-3">
            Hành động nhanh
          </Text>
          <View className="flex-row flex-wrap justify-between">
            <TouchableOpacity
              className="bg-green-600 p-4 rounded-xl w-[48%] mb-3 flex-row items-center justify-center shadow-md"
              onPress={() => router.push("/(seller)/AddProduct")}
            >
              <MaterialIcons name="add" size={24} color="white" />
              <Text className="text-white font-semibold text-md ml-2">Thêm sản phẩm</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-blue-600 p-4 rounded-xl w-[48%] mb-3 flex-row items-center justify-center shadow-md"
              onPress={() => router.push("/(seller)/OrderManagement")}
            >
              <MaterialIcons name="shopping-bag" size={24} color="white" />
              <Text className="text-white font-semibold text-md ml-2">Xem đơn hàng</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-yellow-600 p-4 rounded-xl w-[48%] flex-row items-center justify-center shadow-md"
              onPress={() => router.push("/(seller)/store-management")}
            >
              <MaterialIcons name="store" size={24} color="white" />
              <Text className="text-white font-semibold text-md ml-2">Quản lý cửa hàng</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Top Products */}
        <View className="px-4 mt-6 mb-6">
          <Text className="text-xl font-semibold text-gray-900 mb-3">
            Sản phẩm nổi bật
          </Text>
          {topProducts.length > 0 ? (
            <FlatList
              data={topProducts}
              renderItem={renderProduct}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
            />
          ) : (
            <Text className="text-gray-500 text-md">Chưa có sản phẩm nào.</Text>
          )}
        </View>
      </ScrollView>

      <BottomNavigationSeller />
    </View>
  );
};

export default SellerHome;