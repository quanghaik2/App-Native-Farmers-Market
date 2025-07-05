// ProductDetail.tsx
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
  Dimensions,
  Modal,
  SafeAreaView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../../context/AuthContext";
import { callApi } from "../../lib/api/auth";
import { URL_CONNECT } from "../../lib/constants";
import { formatPrice, formatDate } from "@/lib/utils";
import AiFeatureSection from "@/components/ui/AiFeatureSection";
import ImageViewer from "react-native-image-zoom-viewer";

const { width: screenWidth } = Dimensions.get("window");

// --- Interfaces (Không thay đổi) ---
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
  origin_proof_image_url?: string;
  issued_by?: string;
  expiry_date?: string;
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

// --- Component chính ---
const ProductDetail = () => {
  const { productId } = useLocalSearchParams();
  const { token, fetchCartCount } = useAuth();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAddingToCart, setIsAddingToCart] = useState<boolean>(false);
  const [isBuyingNow, setIsBuyingNow] = useState<boolean>(false);
  const [isProofImageVisible, setProofImageVisible] = useState(false);

  // --- Các hàm xử lý logic (Không thay đổi nhiều, chỉ thêm xử lý modal) ---
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
    } finally {
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

  // --- Giao diện (Render) ---
  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#059669" />
        <Text className="mt-3 text-gray-600 font-semibold">Đang tải chi tiết...</Text>
      </View>
    );
  }

  if (!product) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center p-5">
            <Ionicons name="sad-outline" size={60} color="#71717a" />
            <Text className="mt-4 text-xl font-bold text-zinc-800">Ôi, không tìm thấy sản phẩm</Text>
            <Text className="mt-2 text-center text-gray-500">
                Có vẻ như sản phẩm bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.
            </Text>
            <TouchableOpacity
              onPress={() => router.back()}
              className="mt-8 bg-green-600 px-8 py-3 rounded-full"
            >
              <Text className="text-white font-bold text-base">Quay lại</Text>
            </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  const proofImage = product.origin_proof_image_url
    ? [{ url: `${URL_CONNECT}${product.origin_proof_image_url}` }]
    : [];

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* --- Header --- */}
      <View className="absolute top-10 left-0 right-0 z-20 flex-row justify-between items-center p-4">
        <TouchableOpacity onPress={() => router.back()} className="bg-black/40 p-2 rounded-full">
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View className="flex-row">
          <TouchableOpacity onPress={handleShare} className="bg-black/40 p-2 rounded-full mr-3">
            <Ionicons name="share-social-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push(`/(buyer)/Report?productId=${product.id}`)}
            className="bg-black/40 p-2 rounded-full"
          >
            <Ionicons name="alert-circle-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* --- Product Image --- */}
        <View className="relative">
          <Image
            source={{
              uri: `${URL_CONNECT}${product.image_url}` || "https://via.placeholder.com/400x350",
            }}
            className="w-full h-96"
            resizeMode="cover"
          />
          <LinearGradient
            colors={["rgba(0,0,0,0.6)", "transparent", "rgba(255, 255, 255, 0.5)", "#FFFFFF"]}
            locations={[0, 0.5, 0.9, 1]}
            className="absolute inset-0"
          />
        </View>

        {/* --- Main Info Section --- */}
        <View className="bg-white px-5 -mt-16">
          <Text className="text-3xl font-extrabold text-gray-900 leading-tight tracking-tight">{product.name}</Text>
          <Text className="text-3xl font-bold text-green-600 mt-3">{formatPrice(product.price)}</Text>
           <TouchableOpacity className="flex-row items-center mt-4 bg-gray-100 p-3 rounded-lg">
            <Ionicons name="storefront-outline" size={20} color="#4b5563" className="mr-3" />
            <Text className="text-base font-semibold text-gray-700">Cửa hàng: {product.store_name}</Text>
          </TouchableOpacity>
        </View>
        
        {/* --- Description Section --- */}
        <View className="px-5 py-6 mt-4">
          <Text className="text-xl font-bold text-gray-900">Mô tả sản phẩm</Text>
          <Text className="text-base text-gray-600 mt-2 leading-7">
            {product.description || "Không có mô tả chi tiết cho sản phẩm này."}
          </Text>
        </View>

        {/* --- Origin & Certificate Section --- */}
        <View className="px-5 py-6 bg-gray-50">
            <Text className="text-xl font-bold text-gray-900 mb-4">Thông tin & Nguồn gốc</Text>
            
            <View className="space-y-4">
                <InfoRow icon="globe-outline" label="Xuất xứ" value={product.address || "Không có thông tin"} />
                <InfoRow icon="calendar-outline" label="Ngày hết hạn" value={formatDate(product.expiry_date ) || "Không có thông tin"} />
                <InfoRow icon="business-outline" label="Nơi cấp" value={product.issued_by || "Không có thông tin"} />

                {product.origin_proof_image_url && (
                    <View className="flex-row items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                        <View className="flex-row items-center">
                            <Ionicons name="document-attach-outline" size={22} color="#3b82f6" />
                            <Text className="text-base text-gray-700 ml-3 font-medium">Giấy chứng nhận</Text>
                        </View>
                        <TouchableOpacity 
                            onPress={() => setProofImageVisible(true)}
                            className="bg-blue-500 px-4 py-2 rounded-md"
                        >
                            <Text className="text-white font-bold text-sm">Xem ảnh</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </View>
        
        {/* --- AI Feature Section --- */}
        <View className="mt-2">
            <AiFeatureSection product={product} token={token} />
        </View>

      </ScrollView>

      {/* --- Footer Buttons --- */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 pt-3 pb-5">
        <View className="flex-row justify-between gap-3 items-center space-x-3">
          {/* Nút Thêm vào giỏ */}
          <TouchableOpacity
            className={`flex-1 h-14 flex-row items-center justify-center bg-green-100 rounded-xl active:opacity-80 ${isAddingToCart ? "opacity-60" : ""}`}
            onPress={addToCart}
            disabled={isAddingToCart}
          >
            {isAddingToCart ? (
              <ActivityIndicator size="small" color="#047857" />
            ) : (
              <>
                <Ionicons name="cart-outline" size={24} color="#047857" />
                <Text className="text-green-800 text-base font-bold ml-2">Thêm vào giỏ</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Nút Mua ngay */}
          <TouchableOpacity
            className={`flex-1 h-14 flex-row items-center justify-center bg-green-600 rounded-xl shadow-md shadow-green-400 active:opacity-80 ${isBuyingNow ? "opacity-60" : ""}`}
            onPress={buyNow}
            disabled={isBuyingNow}
          >
            {isBuyingNow ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text className="text-white text-base font-bold">Mua ngay</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
      
      {/* --- Modal for Proof Image --- */}
      <Modal visible={isProofImageVisible} transparent={true} onRequestClose={() => setProofImageVisible(false)}>
        <ImageViewer
          imageUrls={proofImage}
          enableSwipeDown={true}
          onSwipeDown={() => setProofImageVisible(false)}
          renderHeader={() => (
            <TouchableOpacity 
              onPress={() => setProofImageVisible(false)}
              className="absolute top-10 right-5 z-10 p-2 bg-black/40 rounded-full"
            >
              <Ionicons name="close" size={28} color="white" />
            </TouchableOpacity>
          )}
        />
      </Modal>

    </SafeAreaView>
  );
};

// --- Helper Component for Info Rows ---
const InfoRow = ({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) => (
    <View className="flex-row items-start">
        <Ionicons name={icon} size={20} color="#6b7280" className="mr-4 mt-1" />
        <View className="flex-1">
            <Text className="text-sm text-gray-500">{label}</Text>
            <Text className="text-base text-gray-800 font-medium">{value}</Text>
        </View>
    </View>
);


export default ProductDetail;