import { View, Text, ScrollView, Image, FlatList, ActivityIndicator, Alert } from "react-native";
import { useState, useEffect } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { URL_CONNECT } from "@/lib/constants";
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

interface Product {
  id: number;
  name: string;
  price: number;
  image_url: string;
  store_name: string;
}

export default function UserDetail() {
  const { user: userParam } = useLocalSearchParams();
  const { token } = useAuth();
  const router = useRouter();
  const [userData, setUserData] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setIsLoading(true);
        if (!userParam || typeof userParam !== "string") {
          throw new Error("Tham số người dùng không hợp lệ");
        }

        const parsedUser = JSON.parse(userParam);
        if (!parsedUser.id) {
          throw new Error("ID người dùng không hợp lệ");
        }

        if (!token) {
          throw new Error("Không tìm thấy token xác thực");
        }

        const response = await fetch(`${URL_CONNECT}/api/auth/getUsers/${parsedUser.id}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "Không thể tải thông tin người dùng");
        }
        setUserData(data);

        if (data.role === "seller") {
          fetchProducts(data.id);
        }
      } catch (error: any) {
        Alert.alert("Lỗi", "Không thể tải thông tin người dùng: " + error.message, [
          { text: "Quay lại", onPress: () => router.back() },
        ]);
        try {
          setUserData(JSON.parse(userParam as string));
        } catch (parseError) {
          setUserData(null);
        }
      } finally {
        setIsLoading(false);
      }
    };

    const fetchProducts = async (sellerId: number) => {
      setIsLoadingProducts(true);
      try {
        const response = await fetch(`${URL_CONNECT}/api/products/seller/${sellerId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "Không thể tải sản phẩm");
        }
        setProducts(data);
      } catch (error: any) {
        Alert.alert("Lỗi", "Không thể tải sản phẩm: " + error.message);
      } finally {
        setIsLoadingProducts(false);
      }
    };

    fetchUser();
  }, [userParam, token, router]);

  const renderDetailItem = (iconName: string, label: string, value: string | undefined | null) => (
    <View className="flex-row items-start mb-4 pb-4 border-b border-gray-200">
      <MaterialIcons name={iconName} size={20} color="#4B5563" className="mr-3 mt-1" />
      <View className="flex-1">
        <Text className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">{label}</Text>
        <Text className="text-base text-gray-800">{value || "Chưa cung cấp"}</Text>
      </View>
    </View>
  );

  const renderProductItem = ({ item }: { item: Product }) => (
    <View className="bg-white rounded-lg p-3 mb-3 border border-gray-200 flex-row items-center">
      {item.image_url ? (
        <Image
          source={{ uri: `${URL_CONNECT}${item.image_url}` }}
          className="w-16 h-16 rounded-md mr-3 bg-gray-200"
          resizeMode="cover"
        />
      ) : (
        <View className="w-16 h-16 rounded-md mr-3 bg-gray-200 items-center justify-center">
          <MaterialIcons name="image-not-supported" size={24} color="#9CA3AF" />
        </View>
      )}
      <View className="flex-1">
        <Text className="text-sm font-semibold text-gray-800 leading-snug">{item.name}</Text>
        <Text className="text-sm font-bold text-green-600 mt-1">{item.price.toLocaleString("vi-VN")} VNĐ</Text>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-100">
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  if (!userData) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-100 p-5">
        <MaterialIcons name="error-outline" size={48} color="#EF4444" />
        <Text className="text-red-500 text-center mt-4 text-lg">Không thể tải hoặc xử lý thông tin người dùng!</Text>
        <Text className="text-gray-600 text-center mt-2">Vui lòng kiểm tra lại hoặc thử lại.</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-100" contentContainerStyle={{ paddingBottom: 24 }}>
      <View className="bg-white p-5 rounded-b-lg shadow mb-6 mx-2">
        <View className="flex-row items-center mb-5">
          {userData.avatar_url ? (
            <Image
              source={{ uri: `${URL_CONNECT}${userData.avatar_url}` }}
              className="w-20 h-20 rounded-full mr-4 border-2 border-green-500"
            />
          ) : (
            <View className="w-20 h-20 rounded-full mr-4 bg-gray-200 items-center justify-center border-2 border-gray-300">
              <MaterialIcons name="person-outline" size={40} color="#9CA3AF" />
            </View>
          )}
          <View className="flex-1">
            <Text className="text-xl font-bold text-gray-800">{userData.full_name || "Chưa cập nhật tên"}</Text>
            <Text
              className={`text-sm font-semibold mt-1 ${
                userData.role === "buyer" ? "text-blue-600" : "text-purple-600"
              }`}
            >
              {userData.role === "buyer" ? "Khách hàng" : "Cửa hàng"}
            </Text>
          </View>
        </View>

        {renderDetailItem("email", "Email", userData.email)}
        {renderDetailItem("phone", "Số điện thoại", userData.phone_number)}
        {renderDetailItem("location-on", "Địa chỉ", userData.address)}
      </View>

      {userData.role === "seller" && (
        <View className="mt-2 mx-2">
          <Text className="text-lg font-semibold text-gray-700 mb-4 px-3">Sản phẩm của Cửa hàng</Text>
          {isLoadingProducts ? (
            <View className="items-center justify-center py-10">
              <ActivityIndicator size="large" color="#10B981" />
            </View>
          ) : products.length === 0 ? (
            <View className="items-center justify-center bg-white rounded-lg p-6 shadow">
              <MaterialIcons name="inventory-2" size={40} color="#6B7280" />
              <Text className="text-center text-gray-500 mt-3">Cửa hàng này chưa có sản phẩm nào.</Text>
            </View>
          ) : (
            <FlatList
              data={products}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderProductItem}
              scrollEnabled={false}
              contentContainerStyle={{ paddingHorizontal: 8 }}
            />
          )}
        </View>
      )}
    </ScrollView>
  );
}