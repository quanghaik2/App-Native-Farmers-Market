// home.tsx
import {
  View,
  Text,
  Image,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Dimensions,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useState, useCallback, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { UserObject } from "@/lib/constants/constants";
import BottomNavigation from "@/components/ui/BottomNavigation";
import Chatbot from "@/components/ui/Chatbot";
import { getCategories } from "@/lib/api/categories";
import { getAllProducts } from "@/lib/api/products";
import { URL_CONNECT } from "@/lib/constants";
import { useAuth } from "../context/AuthContext";
import { callApi } from "@/lib/api/auth";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { formatPrice } from "@/lib/utils";
import SwiperFlatList from "react-native-swiper-flatlist"; // Import SwiperFlatList

// --- Interfaces ---
interface Category {
  id: number;
  name: string;
  image_url: string;
}

interface Product {
  id: number;
  name: string;
  price: number;
  image_url: string;
  category_id: number;
}

// --- Components Con ---

// Category Item
const CategoryItem = ({ item, onPress }: { item: Category; onPress: () => void }) => (
  <TouchableOpacity style={styles.categoryItemContainer} onPress={onPress}>
    <View style={styles.categoryImageContainer}>
      <Image
        source={{
          uri: `${URL_CONNECT}${item.image_url}` || "https://via.placeholder.com/60",
        }}
        style={styles.categoryImage}
        resizeMode="contain"
      />
    </View>
    <Text style={styles.categoryName} numberOfLines={2}>
      {item.name}
    </Text>
  </TouchableOpacity>
);

// Product Card
const ProductCard = ({ item, onAddToCart, onNavigate }: { item: Product; onAddToCart: () => void; onNavigate: () => void }) => (
  <TouchableOpacity style={styles.productCardContainer} onPress={onNavigate}>
    <View style={styles.productImageContainer}>
      <Image
        source={{
          uri: `${URL_CONNECT}${item.image_url}` || "https://via.placeholder.com/150",
        }}
        style={styles.productImage}
        resizeMode="cover"
      />
    </View>
    <View style={styles.productInfoContainer}>
      <Text style={styles.productName} numberOfLines={2}>
        {item.name}
      </Text>
      <View style={styles.priceRow}>
        <Text style={styles.productPrice}>{formatPrice(item.price)}</Text>
        <TouchableOpacity style={styles.addToCartButton} onPress={onAddToCart}>
          <Ionicons name="cart-outline" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  </TouchableOpacity>
);

// --- Main Home Component ---
export default function Home() {
  const router = useRouter();
  const { user, token, fetchCartCount } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [isChatbotVisible, setChatbotVisible] = useState(false);

  // Danh sách hình ảnh banner
  const bannerImages = [
  { id: 1, image_url: require("../assets/images/banner.jpg") },
  { id: 2, image_url: require("../assets/images/banner2.jpg") },
  { id: 3, image_url: require("../assets/images/banner3.jpg") },
];

  // --- Data Fetching ---
  const fetchCategoriesData = async () => {
    try {
      setLoadingCategories(true);
      const categoriesData = await getCategories();
      setCategories(categoriesData);
    } catch (error: any) {
      console.error("Lỗi tải danh mục:", error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchProductsData = async () => {
    try {
      setLoadingProducts(true);
      const productsData = await getAllProducts();
      const sortedProducts = productsData.sort((a: Product, b: Product) => b.id - a.id);
      setProducts(sortedProducts);
    } catch (error: any) {
      console.error("Lỗi tải sản phẩm:", error);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    if (!user) {
      router.replace("/(auth)/login-buyer");
      return;
    }
    fetchCategoriesData();
    fetchProductsData();
    if (token) fetchCartCount();
  }, [user, router, token]);

  // --- Handlers ---
  const handleProfilePress = useCallback(() => {
    if (!user) return;
    switch (user.role) {
      case "buyer": router.push("/(buyer)/profile"); break;
      case "seller": router.push("/(seller)/profile"); break;
      default: router.push("/(auth)/select-role"); break;
    }
  }, [user, router]);

  const handleCategoryPress = (categoryId: number) => {
    router.push({
      pathname: "/products",
      params: { categoryId: categoryId.toString() },
    });
  };

  const handleProductPress = (productId: number) => {
    router.push({
      pathname: "/(buyer)/ProductDetail",
      params: { productId: productId.toString() },
    });
  };

  const handleAddToCart = async (productId: number) => {
    if (!token) {
      Alert.alert("Yêu cầu đăng nhập", "Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.", [
        { text: "Đóng" },
        { text: "Đăng nhập", onPress: () => router.push("/(auth)/login-buyer") }
      ]);
      return;
    }
    try {
      await callApi(
        `${URL_CONNECT}/api/cart/add`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId, quantity: 1 }),
        },
        token
      );
      await fetchCartCount();
      Alert.alert("Thành công", "Đã thêm sản phẩm vào giỏ hàng!");
    } catch (error: any) {
      console.error("Add to cart error:", error);
      Alert.alert("Lỗi", `Thêm vào giỏ thất bại: ${error.message || 'Vui lòng thử lại.'}`);
    }
  };

  // --- Render ---
  return (
    <SafeAreaView style={styles.safeArea}>
      {/* --- Header --- */}
      <View style={styles.headerContainer}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm sản phẩm..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={styles.profileIconContainer} onPress={handleProfilePress}>
          <Ionicons name="person-circle-outline" size={32} color="#34D399" />
        </TouchableOpacity>
      </View>

      <FlatList
        style={styles.container}
        ListHeaderComponent={
          <>
            {/* --- Categories --- */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Danh Mục</Text>
              {loadingCategories ? (
                <ActivityIndicator size="small" color="#34D399" style={{ marginVertical: 20 }} />
              ) : (
                <FlatList
                  data={categories}
                  renderItem={({ item }) => (
                    <CategoryItem item={item} onPress={() => handleCategoryPress(item.id)} />
                  )}
                  keyExtractor={(item) => item.id.toString()}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10 }}
                />
              )}
            </View>

            {/* --- Banner Section --- */}
              <View style={styles.bannerContainer}>
                <SwiperFlatList
                  autoplay
                  autoplayDelay={3}
                  autoplayLoop
                  index={0}
                  showPagination
                  paginationStyle={{ bottom: 10 }}
                  paginationActiveColor="#34D399"
                  paginationDefaultColor="#D1D5DB"
                  data={bannerImages}
                  renderItem={({ item }) => (
                    <Image
                      source={item.image_url} // Sử dụng trực tiếp giá trị đã require
                      style={styles.bannerImage}
                      resizeMode="cover"
                    />
                  )}
                  keyExtractor={(item) => item.id.toString()}
                />
              </View>

            {/* --- Promotions Section --- */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Ưu Đãi Hấp Dẫn</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
                <View style={styles.promoCard}>
                  <Ionicons name="gift-outline" size={24} color="#D97706" />
                  <Text style={styles.promoText}>Giảm <Text style={{ fontWeight: "bold" }}>50K</Text> cho đơn hàng đầu tiên!</Text>
                </View>
                <View style={styles.promoCard}>
                  <Ionicons name="pricetag-outline" size={24} color="#DB2777" />
                  <Text style={styles.promoText}>Deal sốc chỉ từ <Text style={{ fontWeight: "bold" }}>1.000đ</Text></Text>
                </View>
                <View style={styles.promoCard}>
                  <Ionicons name="flash-outline" size={24} color="#1D4ED8" />
                  <Text style={styles.promoText}>Flash Sale mỗi ngày</Text>
                </View>
              </ScrollView>
            </View>

            {/* --- Products Title --- */}
            <Text style={[styles.sectionTitle, { marginLeft: 16, marginBottom: 10 }]}>Sản Phẩm Mới Nhất</Text>
          </>
        }
        data={products}
        renderItem={({ item }) => (
          <ProductCard
            item={item}
            onAddToCart={() => handleAddToCart(item.id)}
            onNavigate={() => handleProductPress(item.id)}
          />
        )}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        contentContainerStyle={{ paddingHorizontal: 8 }}
        columnWrapperStyle={{ justifyContent: "space-between" }}
        ListEmptyComponent={
          loadingProducts ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator size="large" color="#34D399" />
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="storefront-outline" size={60} color="#D1D5DB" />
              <Text style={styles.emptyText}>Chưa có sản phẩm nào.</Text>
            </View>
          )
        }
      />

      {/* --- Chatbot Button --- */}
      <TouchableOpacity style={styles.chatbotButton} onPress={() => setChatbotVisible(true)}>
        <Ionicons name="chatbubble-ellipses-outline" size={28} color="white" />
      </TouchableOpacity>

      {/* --- Chatbot Component --- */}
      <Chatbot visible={isChatbotVisible} onClose={() => setChatbotVisible(false)} />

      {/* --- Bottom Navigation --- */}
      <BottomNavigation />
    </SafeAreaView>
  );
}

// --- StyleSheet ---
const screenWidth = Dimensions.get("window").width;
const productCardWidth = (screenWidth / 2) - 16;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  container: {
    flex: 1,
  },
  // Header Styles
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#1F2937",
  },
  profileIconContainer: {
    marginLeft: 12,
    padding: 4,
  },
  // Section Styles
  sectionContainer: {
    marginBottom: 20,
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 8,
    marginTop: 12,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
      android: { elevation: 1 },
    }),
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
    marginLeft: 16,
  },
  // Category Styles
  categoryItemContainer: {
    alignItems: "center",
    marginRight: 15,
    width: 80,
  },
  categoryImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
    overflow: "hidden",
  },
  categoryImage: {
    width: "100%",
    height: "100%",
  },
  categoryName: {
    fontSize: 12,
    color: "#4B5563",
    textAlign: "center",
    marginTop: 4,
  },
  // Banner Styles
  bannerContainer: {
    marginHorizontal: 16,
    marginTop: 5,
    marginBottom: 15,
    borderRadius: 12,
    overflow: "hidden",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3 },
      android: { elevation: 4 },
    }),
  },
  bannerImage: {
    width: Dimensions.get("window").width - 32,
    height: 160,
  },
  // Promotion Styles
  promoCard: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 12,
    flexDirection: "row",
    alignItems: "center",
    minWidth: 180,
  },
  promoText: {
    marginLeft: 8,
    fontSize: 13,
    color: "#92400E",
  },
  // Product Card Styles
  productCardContainer: {
    width: productCardWidth,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    marginBottom: 16,
    overflow: "hidden",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
      android: { elevation: 3 },
    }),
  },
  productImageContainer: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#F3F4F6",
  },
  productImage: {
    flex: 1,
    width: undefined,
    height: undefined,
  },
  productInfoContainer: {
    padding: 10,
  },
  productName: {
    fontSize: 13,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 4,
    minHeight: 32,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#EF4444",
    flexShrink: 1,
    marginRight: 4,
  },
  addToCartButton: {
    backgroundColor: "#10B981",
    padding: 6,
    borderRadius: 15,
  },
  // Empty/Loading Styles
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 50,
    minHeight: 200,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: "#9CA3AF",
  },
  // Chatbot Button
  chatbotButton: {
    position: "absolute",
    bottom: 70,
    right: 20,
    backgroundColor: "#10B981",
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3 },
      android: { elevation: 6 },
    }),
  },
});