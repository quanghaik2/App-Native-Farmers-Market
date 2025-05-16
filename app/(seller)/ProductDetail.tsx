import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { callApi } from "../../lib/api/auth";
import { URL_CONNECT } from "../../lib/constants";
import BottomNavigationSeller from "@/components/ui/BottomNavigationSeller";
import { formatPrice } from "@/lib/utils";

// Giả định RoleButton component
interface RoleButtonProps {
  title: string;
  onPress: () => void;
  bgColor: string;
}

const RoleButton: React.FC<RoleButtonProps> = ({ title, onPress, bgColor }) => (
  <TouchableOpacity style={[styles.roleButton, { backgroundColor: bgColor }]} onPress={onPress}>
    <Text style={styles.roleButtonText}>{title}</Text>
  </TouchableOpacity>
);

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
}

interface Category {
  id: number;
  name: string;
}

const ProductDetail: React.FC = () => {
  const { token, user } = useAuth();
  const router = useRouter();
  const { productId } = useLocalSearchParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!token || !productId) return;

      try {
        setLoading(true);

        const productResult = await callApi(
          `${URL_CONNECT}/api/products/${productId}`,
          { method: "GET" },
          token
        );

        if (productResult.seller_id !== user?.id) {
          Alert.alert("Lỗi", "Bạn không có quyền xem sản phẩm này!");
          router.back();
          return;
        }

        setProduct(productResult);

        if (productResult.category_id) {
          const categoryResult = await callApi(
            `${URL_CONNECT}/api/categories/${productResult.category_id}`,
            { method: "GET" },
            token
          );
          setCategory(categoryResult);
        }
      } catch (error: any) {
        Alert.alert("Lỗi", "Không thể tải thông tin sản phẩm: " + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [token, productId, user]);

  const handleDeleteProduct = async () => {
    if (!product || !token) return;

    Alert.alert(
      "Xác nhận",
      "Bạn có chắc chắn muốn xóa sản phẩm này?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              await callApi(
                `${URL_CONNECT}/api/products/${product.id}`,
                { method: "DELETE" },
                token
              );
              Alert.alert("Thành công", "Sản phẩm đã được xóa!");
              router.push("/(seller)/ProductManagement");
            } catch (error: any) {
              Alert.alert("Lỗi", "Xóa sản phẩm thất bại: " + error.message);
            }
          },
        },
      ]
    );
  };

  // const formatPrice = (price: number): string => {
  //   return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "đ";
  // };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Sản phẩm không tồn tại!</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.headerText}>Chi tiết sản phẩm</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.imageContainer}>
          <Image
            source={{
              uri: product.image_url
                ? `${URL_CONNECT}${product.image_url}`
                : "https://via.placeholder.com/300",
            }}
            style={styles.productImage}
            resizeMode="cover"
          />
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.productPrice}>{formatPrice(product.price)}</Text>
          <Text style={styles.storeName}>Cửa hàng: {product.store_name}</Text>
          <Text style={styles.categoryName}>
            Danh mục: {category ? category.name : "Chưa có danh mục"}
          </Text>
          <Text style={styles.description}>{product.description}</Text>
        </View>

        <View style={styles.actionContainer}>
          <RoleButton
            title="Sửa"
            onPress={() =>
              router.push({
                pathname: "/(seller)/EditProduct",
                params: { product: JSON.stringify(product) },
              })
            }
            bgColor="#FFA955"
          />
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDeleteProduct}
          >
            <MaterialIcons name="delete" size={20} color="#FFFFFF" />
            <Text style={styles.deleteButtonText}>Xóa</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <BottomNavigationSeller />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
  },
  errorText: {
    fontSize: 18,
    color: "#4B5563",
  },
  scrollContent: {
    paddingBottom: 80,
  },
  header: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
  },
  headerSpacer: {
    width: 24,
  },
  imageContainer: {
    backgroundColor: "#FFFFFF",
    padding: 16,
  },
  productImage: {
    width: "100%",
    height: 256,
    borderRadius: 8,
  },
  infoContainer: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    marginTop: 8,
  },
  productName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
  },
  productPrice: {
    fontSize: 18,
    color: "#EF4444",
    marginTop: 4,
  },
  storeName: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },
  categoryName: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },
  description: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 8,
  },
  actionContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
  },
  roleButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  roleButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  deleteButton: {
    backgroundColor: "#EF4444",
    flex: 1,
    padding: 12,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  deleteButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});

export default ProductDetail;