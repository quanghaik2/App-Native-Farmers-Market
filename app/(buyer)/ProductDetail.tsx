import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Share,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../../context/AuthContext";
import { callApi } from "../../lib/api/auth";
import { URL_CONNECT } from "../../lib/constants";
import { formatPrice } from "@/lib/utils";


interface Product {
  id: number;
  seller_id: number;
  name: string;
  store_name: string;
  price: number;
  description: string;
  address: string;
  points: number;
  image_url: string;
  category_id: number;
}

interface CartItem {
  id: string | number;
  product_id: number;
  quantity: number;
  price_at_time: number;
  name: string;
  image_url: string;
  seller_id: number;
  store_name: string;
}

const ProductDetail = () => {
  const { productId } = useLocalSearchParams();
  const { token, fetchCartCount } = useAuth();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAddingToCart, setIsAddingToCart] = useState<boolean>(false);
  const [isBuyingNow, setIsBuyingNow] = useState<boolean>(false);

  const fetchProduct = async () => {
    if (!productId) {
      Alert.alert("Lỗi", "Không tìm thấy ID sản phẩm!");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await callApi(
        `${URL_CONNECT}/api/products/${productId}`,
        { method: "GET" },
        token
      );
      setProduct(data);
    } catch (error: any) {
      console.error("Lỗi lấy chi tiết sản phẩm:", error);
      Alert.alert("Lỗi", "Không thể tải chi tiết sản phẩm. Vui lòng thử lại.");
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [productId, token]);

  const addToCart = async () => {
    if (!token) {
      Alert.alert("Lỗi", "Vui lòng đăng nhập để thêm vào giỏ hàng!", [
        { text: "Đóng", style: "cancel" },
        { text: "Đăng nhập", onPress: () => router.push("/(auth)/login-buyer") },
      ]);
      return;
    }

    if (!product || isAddingToCart) return;

    setIsAddingToCart(true);
    try {
      await callApi(
        `${URL_CONNECT}/api/cart/add`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: product.id, quantity: 1 }),
        },
        token
      );
      await fetchCartCount();
      Alert.alert("Thành công", "Đã thêm sản phẩm vào giỏ hàng!");
    } catch (error: any) {
      Alert.alert("Lỗi", "Thêm vào giỏ thất bại: " + error.message);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const buyNow = () => {
    if (!token) {
      Alert.alert("Lỗi", "Vui lòng đăng nhập để mua hàng!", [
        { text: "Đóng", style: "cancel" },
        { text: "Đăng nhập", onPress: () => router.push("/(auth)/login-buyer") },
      ]);
      return;
    }

    if (!product || isBuyingNow) return;

    setIsBuyingNow(true);
    const buyNowItem: CartItem = {
      id: `buy-now-${product.id}`,
      product_id: product.id,
      quantity: 1,
      price_at_time: product.price,
      name: product.name,
      image_url: product.image_url,
      seller_id: product.seller_id,
      store_name: product.store_name,
    };

    try {
      router.push({
        pathname: "/Checkout",
        params: {
          selectedItems: JSON.stringify([buyNowItem]),
          isBuyNow: "true",
        },
      });
    } catch (error: any) {
      Alert.alert("Lỗi", "Không thể chuyển đến trang thanh toán: " + error.message);
      setIsBuyingNow(false);
    }
  };

  const handleShare = async () => {
    if (!product) return;
    try {
      await Share.share({
        message: `Xem sản phẩm này: ${product.name} tại ${product.store_name}! Giá: ${formatPrice(product.price)}. Link: ${URL_CONNECT}/products/${product.id}`,
        title: `Chia sẻ sản phẩm: ${product.name}`,
      });
    } catch (error: any) {
      Alert.alert("Lỗi", "Không thể chia sẻ sản phẩm.");
    }
  };

  // const formatPrice = (price: number) => {
  //   return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "đ";
  // };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#6B7280" />
        <Text className="mt-2 text-gray-600">Đang tải...</Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Ionicons name="sad-outline" size={50} color="#6B7280" />
        <Text className="mt-2 text-gray-600">Không tìm thấy sản phẩm!</Text>
        <TouchableOpacity
          onPress={fetchProduct}
          className="mt-4 bg-blue-500 px-6 py-2 rounded-lg"
        >
          <Text className="text-white font-bold">Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      {/* Thanh điều hướng cố định */}
      <View className="absolute top-0 left-0 right-0 z-10 flex-row justify-between items-center p-4">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleShare}>
          <Ionicons name="share-social-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hình ảnh sản phẩm với gradient */}
        <View className="relative">
          <Image
            source={{
              uri: `${URL_CONNECT}${product.image_url}` || "https://via.placeholder.com/300",
            }}
            className="w-full h-80 rounded-b-lg"
            resizeMode="contain"
          />
          <LinearGradient
            colors={["rgba(0,0,0,0.3)", "transparent"]}
            className="absolute inset-0"
          />
        </View>

        {/* Phần thông tin chính */}
        <View className="px-4 py-4">
          <Text className="text-3xl font-bold text-gray-900 leading-tight">{product.name}</Text>
          <View className="flex-row items-center mt-2">
            <Ionicons name="pricetag-outline" size={20} color="#EF4444" className="mr-2" />
            <Text className="text-2xl font-bold text-red-600">{formatPrice(product.price)}</Text>
          </View>
        </View>

        {/* Đường phân cách */}
        <View className="h-2 bg-gray-100" />

        {/* Phần thông tin bổ sung */}
        <View className="px-4 py-4">
          <View className="flex-row items-center mb-2">
            <Ionicons name="storefront-outline" size={18} color="#6B7280" className="mr-2" />
            <Text className="text-base text-gray-600">Cửa hàng: {product.store_name}</Text>
          </View>
          <View className="flex-row items-center mb-2">
            <Ionicons name="globe-outline" size={18} color="#6B7280" className="mr-2" />
            <Text className="text-base text-gray-600">
              Xuất xứ: {product.address || "Không có thông tin xuất xứ"}
            </Text>
          </View>
          {/* <View className="flex-row items-center mb-2">
            <Ionicons name="star-outline" size={18} color="#6B7280" className="mr-2" />
            <Text className="text-base text-gray-600">Điểm: {product.points || 0}</Text>
          </View> */}
        </View>

        {/* Đường phân cách */}
        <View className="h-2 bg-gray-100" />

        {/* Phần mô tả sản phẩm */}
        <View className="px-4 py-4">
          <Text className="text-lg font-bold text-gray-900">Mô tả sản phẩm</Text>
          <Text className="text-base text-gray-600 mt-2 leading-6">
            {product.description || "Không có mô tả."}
          </Text>
        </View>

        {/* Phần sản phẩm tương tự (placeholder) */}
        {/* <View className="px-4 py-4">
          <View className="flex-row items-center mb-2">
            <Ionicons name="list-outline" size={20} color="#1F2937" className="mr-2" />
            <Text className="text-lg font-bold text-gray-900">Sản phẩm tương tự</Text>
          </View>
          <Text className="text-base text-gray-600">Chưa có sản phẩm tương tự.</Text>
        </View> */}
      </ScrollView>

      {/* Thanh nút giữ nguyên */}
      <View className="absolute bottom-0 left-0 right-0 bg-white p-4 border-t border-gray-200 shadow-lg flex-row justify-between">
        <TouchableOpacity
          className={`flex-1 flex-row items-center justify-center bg-gray-600 py-3 rounded-lg mr-2 ${isAddingToCart ? "opacity-60" : ""}`}
          onPress={addToCart}
          disabled={isAddingToCart}
        >
          {isAddingToCart ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Ionicons name="cart-outline" size={24} color="white" />
              <Text className="text-white text-base font-bold ml-2">Thêm vào giỏ</Text>
            </>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 flex-row items-center justify-center bg-green-500 py-3 rounded-lg ${isBuyingNow ? "opacity-60" : ""}`}
          onPress={buyNow}
          disabled={isBuyingNow}
        >
          {isBuyingNow ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Ionicons name="flash-outline" size={24} color="white" className="mr-2" />
              <Text className="text-white text-base font-bold">Mua ngay</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ProductDetail;