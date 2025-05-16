// home.tsx
import {
  View,
  Text,
  Image,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet, // Import StyleSheet
  FlatList,   // Import FlatList
  ActivityIndicator, // Import ActivityIndicator
  Dimensions, // Import Dimensions
  Platform,   // Import Platform
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
import { FontAwesome, Ionicons } from "@expo/vector-icons"; // Import icons
import { SafeAreaView } from 'react-native-safe-area-context'; // Import SafeAreaView
import { formatPrice } from "@/lib/utils";

// --- Interfaces (Giữ nguyên) ---
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
  <TouchableOpacity
    style={styles.categoryItemContainer}
    onPress={onPress}
  >
    <View style={styles.categoryImageContainer}>
      <Image
        source={{
          uri: `${URL_CONNECT}${item.image_url}` || "https://via.placeholder.com/60",
        }}
        style={styles.categoryImage}
        resizeMode="contain" // hoặc "cover" tùy vào ảnh
      />
    </View>
    <Text style={styles.categoryName} numberOfLines={2}>
      {item.name}
    </Text>
  </TouchableOpacity>
);

// Product Card
const ProductCard = ({ item, onAddToCart, onNavigate }: { item: Product; onAddToCart: () => void; onNavigate: () => void }) => {
  // const formatPrice = (price: number) => {
  //    // Định dạng tiền tệ Việt Nam
  //    return price.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
  // };

  return (
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
};


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

  // --- Data Fetching ---
  const fetchCategoriesData = async () => {
    try {
      setLoadingCategories(true);
      const categoriesData = await getCategories();
      setCategories(categoriesData); // Lấy hết hoặc slice tùy ý
    } catch (error: any) {
      console.error("Lỗi tải danh mục:", error);
      // Alert.alert("Lỗi", "Không thể tải danh mục: " + error.message);
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchProductsData = async () => {
     try {
       setLoadingProducts(true);
       const productsData = await getAllProducts();
       // Sắp xếp hoặc lọc nếu cần
       const sortedProducts = productsData
         .sort((a: Product, b: Product) => b.id - a.id); // Mới nhất trước
         // .slice(0, 10); // Giới hạn nếu cần
       setProducts(sortedProducts);
     } catch (error: any) {
       console.error("Lỗi tải sản phẩm:", error);
       // Alert.alert("Lỗi", "Không thể tải sản phẩm: " + error.message);
     } finally {
       setLoadingProducts(false);
     }
   };

  useEffect(() => {
    if (!user) {
      router.replace("/(auth)/login-buyer"); // Dùng replace để không quay lại được màn home khi chưa login
      return;
    }
    fetchCategoriesData();
    fetchProductsData();
    // Gọi fetchCartCount nếu cần cập nhật số lượng giỏ hàng ban đầu
    if(token) fetchCartCount();
  }, [user, router, token]); // Thêm token vào dependency

  // --- Handlers ---
  const handleProfilePress = useCallback(() => {
    // Logic điều hướng profile giữ nguyên
    if (!user) return;
    switch (user.role) {
      case "buyer": router.push("/(buyer)/profile"); break;
      case "seller": router.push("/(seller)/profile"); break;
      default: router.push("/(auth)/select-role"); break;
    }
  }, [user, router]);

  const handleCategoryPress = (categoryId: number) => {
    // Logic điều hướng category giữ nguyên
    router.push({
      pathname: "/products", // Đảm bảo đúng đường dẫn
      params: { categoryId: categoryId.toString() },
    });
  };

  const handleProductPress = (productId: number) => {
     router.push({
       pathname: "/(buyer)/ProductDetail", // Đảm bảo đúng đường dẫn
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
      // Hiện indicator loading nhỏ trên nút hoặc toàn màn hình nếu cần
      await callApi(
        `${URL_CONNECT}/api/cart/add`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId, quantity: 1 }), // Luôn thêm số lượng là 1
        },
        token
      );
      await fetchCartCount(); // Cập nhật số lượng trên icon giỏ hàng
      // Có thể thay Alert bằng thông báo nhẹ nhàng hơn (toast/snackbar)
      Alert.alert("Thành công", "Đã thêm sản phẩm vào giỏ hàng!");
    } catch (error: any) {
      console.error("Add to cart error:", error)
      Alert.alert("Lỗi", `Thêm vào giỏ thất bại: ${error.message || 'Vui lòng thử lại.'}`);
    } finally {
        // Ẩn indicator loading
    }
  };

  // --- Render ---
  return (
    // Sử dụng SafeAreaView để tránh bị đè bởi tai thỏ, status bar
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
            // onSubmitEditing={() => console.log("Perform search")} // Thêm hành động khi submit search
          />
        </View>
        {/* Thay bằng icon user chuẩn */}
        <TouchableOpacity style={styles.profileIconContainer} onPress={handleProfilePress}>
          <Ionicons name="person-circle-outline" size={32} color="#34D399" />
        </TouchableOpacity>
      </View>

      <FlatList
        style={styles.container}
        ListHeaderComponent={ // Các thành phần phía trên danh sách sản phẩm
          <>
            {/* --- Categories --- */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Danh Mục</Text>
              {loadingCategories ? (
                <ActivityIndicator size="small" color="#34D399" style={{ marginVertical: 20 }}/>
              ) : (
                <FlatList
                  data={categories}
                  renderItem={({ item }) => (
                    <CategoryItem item={item} onPress={() => handleCategoryPress(item.id)} />
                  )}
                  keyExtractor={(item) => item.id.toString()}
                  horizontal={true} // Hiển thị dạng cuộn ngang
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10 }} // Thêm padding cho list ngang
                />
              )}
            </View>

            {/* --- Banner Section --- */}
            {/* Thay bằng Carousel nếu có nhiều banner */}
            <View style={styles.bannerContainer}>
              <Image
                source={require("../assets/images/banner.jpg")} // Đảm bảo đường dẫn đúng
                style={styles.bannerImage}
                resizeMode="cover"
              />
            </View>

            {/* --- Promotions Section (Ví dụ thiết kế lại) --- */}
            <View style={styles.sectionContainer}>
               <Text style={styles.sectionTitle}>Ưu Đãi Hấp Dẫn</Text>
               {/* Nên dùng Carousel hoặc thiết kế card đẹp hơn ở đây */}
               <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
                   <View style={styles.promoCard}>
                       <Ionicons name="gift-outline" size={24} color="#D97706"/>
                       <Text style={styles.promoText}>Giảm <Text style={{fontWeight: 'bold'}}>50K</Text> cho đơn hàng đầu tiên!</Text>
                   </View>
                   <View style={styles.promoCard}>
                       <Ionicons name="pricetag-outline" size={24} color="#DB2777"/>
                       <Text style={styles.promoText}>Deal sốc chỉ từ <Text style={{fontWeight: 'bold'}}>1.000đ</Text></Text>
                   </View>
                   <View style={styles.promoCard}>
                        <Ionicons name="flash-outline" size={24} color="#1D4ED8"/>
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
             onAddToCart={() => handleAddToCart(item.id, )}
             onNavigate={() => handleProductPress(item.id)}
           />
         )}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2} // Hiển thị 2 cột
        contentContainerStyle={{ paddingHorizontal: 8 }} // Padding cho grid sản phẩm
        columnWrapperStyle={{ justifyContent: 'space-between' }} // Đảm bảo khoảng cách giữa 2 cột
        ListEmptyComponent={ // Component hiển thị khi không có sản phẩm hoặc đang tải
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
      <TouchableOpacity
         style={styles.chatbotButton}
         onPress={() => setChatbotVisible(true)}
       >
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
const screenWidth = Dimensions.get('window').width;
const productCardWidth = (screenWidth / 2) - 16; // Chiều rộng mỗi card sản phẩm (trừ padding)

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB', // Màu nền chính (xám rất nhạt)
  },
  container: {
    flex: 1,
  },
  // Header Styles
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF', // Nền trắng cho header
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB', // Đường kẻ mờ
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6', // Nền xám nhạt cho ô search
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40, // Chiều cao cố định
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
  },
  profileIconContainer: {
    marginLeft: 12,
    padding: 4,
  },
  // Section Styles
  sectionContainer: {
    marginBottom: 20, // Khoảng cách giữa các section
    backgroundColor: '#FFFFFF', // Nền trắng cho các section như Danh mục, Ưu đãi
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 8, // Tạo khoảng cách với lề
    marginTop: 12,
     ...Platform.select({
        ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
        android: { elevation: 1 },
      }),
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600', // Semibold
    color: '#111827', // Màu chữ đậm
    marginBottom: 12,
    marginLeft: 16, // Thụt lề tiêu đề
  },
  // Category Styles
  categoryItemContainer: {
    alignItems: 'center',
    marginRight: 15, // Khoảng cách giữa các item danh mục
    width: 80, // Chiều rộng cố định cho category item
  },
  categoryImageContainer: {
      width: 60,
      height: 60,
      borderRadius: 30, // Bo tròn ảnh
      backgroundColor: '#E5E7EB', // Màu nền chờ ảnh load
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 6,
      overflow: 'hidden', // Đảm bảo ảnh không bị tràn
  },
  categoryImage: {
    width: '100%',
    height: '100%',
  },
  categoryName: {
    fontSize: 12,
    color: '#4B5563', // Gray-600
    textAlign: 'center',
    marginTop: 4,
  },
  // Banner Styles
  bannerContainer: {
    marginHorizontal: 16, // Khoảng cách lề cho banner
    marginTop: 5, // Giảm khoảng cách trên nếu section Danh mục đã có nền trắng
    marginBottom: 15,
    borderRadius: 12, // Bo góc nhiều hơn cho banner
    overflow: 'hidden', // Đảm bảo ảnh nằm trong border radius
     ...Platform.select({
        ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3 },
        android: { elevation: 4 },
      }),
  },
  bannerImage: {
    width: '100%',
    height: 160, // Chiều cao cố định cho banner
  },
  // Promotion Styles
  promoCard: {
      backgroundColor: '#FEF3C7', // Nền vàng nhạt hơn
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 8,
      marginRight: 12,
      flexDirection: 'row',
      alignItems: 'center',
      minWidth: 180, // Chiều rộng tối thiểu
  },
  promoText: {
      marginLeft: 8,
      fontSize: 13,
      color: '#92400E', // Màu chữ đậm hơn trên nền vàng
  },
  // Product Card Styles
  productCardContainer: {
    width: productCardWidth,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden', // Quan trọng để bo góc ảnh
     ...Platform.select({
        ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
        android: { elevation: 3 },
      }),
  },
  productImageContainer: {
    width: '100%',
    aspectRatio: 1, // Giữ tỷ lệ vuông cho ảnh
    backgroundColor: '#F3F4F6', // Màu nền chờ ảnh load
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
    fontWeight: '500', // Medium
    color: '#374151', // Gray-700
    marginBottom: 4, // Khoảng cách giữa tên và giá
    minHeight: 32, // Đảm bảo chiều cao tối thiểu cho 2 dòng
  },
  priceRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 4,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#EF4444', // Màu đỏ cho giá
    flexShrink: 1, // Cho phép giá co lại nếu cần
    marginRight: 4,
  },
  addToCartButton: {
    backgroundColor: '#10B981', // Màu xanh lá cây
    padding: 6,
    borderRadius: 15, // Bo tròn nút thêm giỏ hàng
  },
  // Empty/Loading Styles
   emptyContainer: {
     flex: 1,
     justifyContent: 'center',
     alignItems: 'center',
     marginTop: 50, // Khoảng cách từ trên xuống
     minHeight: 200, // Chiều cao tối thiểu để căn giữa tốt hơn
   },
   emptyText: {
     marginTop: 12,
     fontSize: 16,
     color: '#9CA3AF', // Màu chữ xám nhạt
   },
   // Chatbot Button
   chatbotButton: {
     position: 'absolute',
     bottom: 70, // Nâng lên trên BottomNavigation
     right: 20,
     backgroundColor: '#10B981', // Màu xanh lá
     width: 56,
     height: 56,
     borderRadius: 28,
     justifyContent: 'center',
     alignItems: 'center',
     ...Platform.select({ // Thêm bóng đổ
        ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3 },
        android: { elevation: 6 },
      }),
   },
});