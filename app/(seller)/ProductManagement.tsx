import { View, Text, FlatList, Alert, ActivityIndicator } from "react-native";
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { getProducts, deleteProduct } from "../../lib/api/products";
import { Product, UserObject } from "../../lib/constants/constants";
import RoleButton from "@/components/auth/RoleButton"; // Đảm bảo RoleButton có thể nhận className
import { formatPrice } from "@/lib/utils";

export default function ProductManagement() {
  const { user, token } = useAuth() as { user: UserObject; token: string };
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Thêm state cho trạng thái loading
  const router = useRouter();

  useEffect(() => {
    if (token && user?.id) {
      fetchProducts();
    } else {
      // Xử lý trường hợp token hoặc user chưa có sẵn nếu cần
      setIsLoading(false); // Ngừng loading nếu không có token/user
    }
  }, [token, user?.id]); // Thêm user.id vào dependency array

  const fetchProducts = async () => {
    setIsLoading(true); // Bắt đầu loading
    try {
      const productData = await getProducts(token, user.id);
      setProducts(productData);
    } catch (error: any) {
      Alert.alert("Lỗi", "Không thể tải sản phẩm: " + error.message);
    } finally {
      setIsLoading(false); // Kết thúc loading dù thành công hay thất bại
    }
  };

  // const formatPrice = (price: number) => {
  //   return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  // };

  const handleDeleteProduct = (productId: number) => {
    // Thêm Alert xác nhận trước khi xóa
    Alert.alert(
      "Xác nhận xóa",
      "Bạn có chắc chắn muốn xóa sản phẩm này?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          onPress: async () => {
            try {
              await deleteProduct(token, productId);
              Alert.alert("Thành công", "Xóa sản phẩm thành công!");
              fetchProducts(); // Tải lại danh sách sau khi xóa
            } catch (error: any) {
              Alert.alert("Lỗi", "Xóa sản phẩm thất bại: " + error.message);
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  const renderProductItem = ({ item }: { item: Product }) => (
    <View className="bg-white rounded-lg p-4 mb-4 shadow-md flex-row justify-between items-center">
      {/* Thông tin sản phẩm */}
      <View className="flex-1 mr-3">
        <Text className="text-base font-semibold text-gray-800">{item.name}</Text>
        <Text className="text-sm text-green-600">{formatPrice(item.price)} VND</Text>
      </View>

      {/* Nút hành động */}
      <View className="flex-row gap-2">
        <RoleButton
          title="Sửa"
          onPress={() =>
            router.push({
              pathname: "/(seller)/EditProduct",
              params: { product: JSON.stringify(item) },
            })
          }
          // Giả định RoleButton nhận className
          bgColor="#FFA955"
        />
        <RoleButton
          title="Xóa"
          onPress={() => handleDeleteProduct(item.id)}
          // Giả định RoleButton nhận className
          bgColor="#FF0B55"
        />
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-100 p-4 pt-6">
      <Text className="text-3xl font-bold text-green-600 mb-6 text-center">
        Quản lý Sản phẩm
      </Text>

      <RoleButton
        title="Thêm sản phẩm mới"
        onPress={() => router.push("/(seller)/AddProduct")}
        // Giả định RoleButton nhận className
        bgColor="green"
      />

      {isLoading ? (
        // Hiển thị khi đang tải dữ liệu
        <ActivityIndicator size="large" color="#10B981" className="mt-10" />
      ) : products.length === 0 ? (
        // Hiển thị khi không có sản phẩm
        <Text className="text-center text-gray-500 mt-10 text-base">
          Bạn chưa có sản phẩm nào. Bấm "Thêm sản phẩm mới" để bắt đầu.
        </Text>
      ) : (
        // Hiển thị danh sách sản phẩm
        <FlatList
          data={products}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderProductItem}
          contentContainerStyle={{ paddingBottom: 20 }} // Thêm padding dưới cùng cho FlatList
        />
      )}
    </View>
  );
}

// Không cần StyleSheet nữa vì đã dùng NativeWind