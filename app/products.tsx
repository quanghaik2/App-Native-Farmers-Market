import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { callApi } from "../lib/api/auth";
import { URL_CONNECT } from "../lib/constants";
import { Category } from "@/lib/constants/constants";
import { getAllProducts } from "@/lib/api/products";
import { getCategories } from "@/lib/api/categories";
import { useLocalSearchParams, useRouter } from "expo-router";
import BottomNavigation from "@/components/ui/BottomNavigation";
import MaterialIcons from "react-native-vector-icons/MaterialIcons"; 
import Toast from "react-native-toast-message";
import { formatPrice } from "@/lib/utils";

interface Product {
  id: number;
  seller_id: number;
  name: string;
  store_name: string;
  price: number;
  description: string;
  origin: string;
  points: number;
  image_url: string;
  category_id: number;
  quantity?: number;
}

const ProductListScreen: React.FC = () => {
  const { user, token, fetchCartCount } = useAuth();
  const { categoryId } = useLocalSearchParams();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<number | null>(
    categoryId ? parseInt(categoryId as string, 10) : null
  );
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    
    fetchData();
  }, [token, router]);

  const fetchData = async () => {
    if (!token) {
      Alert.alert("Lỗi", "Không có token, vui lòng đăng nhập lại!");
      router.push("/(auth)/login-buyer");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [productsResult, categoriesResult, cartItems] = await Promise.all([
        getAllProducts(),
        getCategories(),
        callApi(`${URL_CONNECT}/api/cart`, { method: "GET" }, token),
      ]);
      const updatedProducts = productsResult.map((product: Product) => ({
        ...product,
        quantity: cartItems.find((item: any) => item.product_id === product.id)?.quantity || 0,
      }));

      setProducts(updatedProducts || []);
      setCategories(categoriesResult || []);
      Toast.show({
        type: "success",
        text1: "Thành công",
        text2: "Đã làm mới dữ liệu",
        position: "top",
      });
    } catch (error: any) {
      console.error("Lỗi khi lấy dữ liệu:", error);
      Alert.alert("Lỗi", "Không thể tải dữ liệu: " + error.message);
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Không thể làm mới dữ liệu",
        position: "top",
      });
    } finally {
      setLoading(false);
    }
  };

  const addToCart = useCallback(async (product: Product) => {
    if (!token) {
      Alert.alert("Lỗi", "Vui lòng đăng nhập để thêm vào giỏ hàng!");
      router.push("/(auth)/login-buyer");
      return;
    }

    try {
      await callApi(
        `${URL_CONNECT}/api/cart/add`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: product.id }),
        },
        token
      );
      await fetchCartCount(); // Cập nhật số lượng giỏ hàng
      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id ? { ...p, quantity: (p.quantity || 0) + 1 } : p
        )
      );
      Alert.alert("Thành công", "Đã thêm sản phẩm vào giỏ hàng!");
    } catch (error: any) {
      Alert.alert("Lỗi", "Thêm vào giỏ thất bại: " + error.message);
    }
  }, [token, router, fetchCartCount]);

  const viewProductDetail = useCallback((product: Product) => {
    console.log("Product ID:", product.id);
    router.push({
      pathname: "/(buyer)/ProductDetail",
      params: { productId: product.id.toString() },
    });
  }, [router]);

  const filteredProducts = products.filter(
    (product) =>
      (!selectedCategory || product.category_id === selectedCategory) &&
      product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // const formatPrice = (price: number) => {
  //   const formattedPrice = price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  //   return formattedPrice.replace(/\.00$/, "");
  // };

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row justify-between items-center p-4">
        <Text className="text-2xl font-bold text-emerald-600">Sản phẩm</Text>
        <TouchableOpacity onPress={fetchData}>
          <MaterialIcons name="refresh" size={28} color="#10B981" />
        </TouchableOpacity>
      </View>
      {/* Thanh tìm kiếm */}
      <View className="flex-row items-center bg-gray-100 p-2 mx-4 mt-4 rounded-lg shadow-sm">
        <FontAwesome name="search" size={20} color="#6B7280" />
        <TextInput
          className="flex-1 ml-2 text-base text-gray-900"
          placeholder="Tìm sản phẩm..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#6B7280"
        />
      </View>

      {/* Danh mục */}
      <View className="my-2">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4">
          <TouchableOpacity
            className={`px-4 py-2 mx-1 rounded-full ${selectedCategory === null ? "bg-green-500" : "bg-gray-100"}`}
            onPress={() => setSelectedCategory(null)}
          >
            <Text
              className={`text-sm font-medium ${selectedCategory === null ? "text-white" : "text-gray-600"}`}
            >
              Tất cả
            </Text>
          </TouchableOpacity>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              className={`px-4 py-2 mx-1 rounded-full ${selectedCategory === category.id ? "bg-green-500" : "bg-gray-100"}`}
              onPress={() =>
                setSelectedCategory(category.id === selectedCategory ? null : category.id)
              }
            >
              <Text
                className={`text-sm font-medium ${selectedCategory === category.id ? "text-white" : "text-gray-600"}`}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Danh sách sản phẩm */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <Text className="mt-2 text-gray-600">Đang tải...</Text>
        </View>
      ) : filteredProducts.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <FontAwesome name="frown-o" size={50} color="#6B7280" />
          <Text className="mt-2 text-gray-600">Không tìm thấy sản phẩm nào!</Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              className="flex-row items-center bg-white p-3 mx-4 my-2 rounded-lg shadow-sm"
              onPress={() => viewProductDetail(item)}
            >
              <Image
                source={{
                  uri: `${URL_CONNECT}${item.image_url}` || "https://via.placeholder.com/100",
                }}
                className="w-20 h-20 rounded-lg"
                resizeMode="cover"
              />
              <View className="flex-1 ml-3">
                <Text className="text-base font-bold text-gray-900" numberOfLines={2}>
                  {item.name}
                </Text>
                <Text className="text-base font-bold text-red-600">{formatPrice(item.price)}</Text>
              </View>
              <TouchableOpacity
                className="bg-green-500 px-4 py-3 rounded-full"
                onPress={() => addToCart(item)}
              >
                <FontAwesome name="plus" size={18} color="white" />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}
      <BottomNavigation/>
    </View>
  );
};

export default ProductListScreen;