import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { callApi } from "../lib/api/auth";
import { URL_CONNECT } from "../lib/constants";
import { useRouter } from "expo-router";
import { formatPrice } from "@/lib/utils";

interface CartItem {
  id: number;
  cart_id: number;
  product_id: number;
  quantity: number;
  price_at_time: number;
  name: string;
  image_url: string;
  seller_id: number;
  store_name: string;
}

const Cart = () => {
  const { user, token } = useAuth();
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [shippingFee] = useState<number>(30000);

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const result = await callApi(`${URL_CONNECT}/api/cart`, { method: "GET" }, token);
        setCartItems(result);
      } catch (error) {
        console.error("Lỗi lấy giỏ hàng:", error);
      }
    };
    fetchCart();
  }, [token]);

  const toggleSelectItem = (productId: number) => {
    if (selectedItems.includes(productId)) {
      setSelectedItems(selectedItems.filter((id) => id !== productId));
    } else {
      setSelectedItems([...selectedItems, productId]);
    }
  };

  const removeFromCart = async (productId: number) => {
    try {
      await callApi(
        `${URL_CONNECT}/api/cart/remove`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
        },
        token
      );
      setCartItems((prev) => prev.filter((item) => item.product_id !== productId));
      setSelectedItems((prev) => prev.filter((id) => id !== productId));
    } catch (error) {
      console.error("Lỗi xóa sản phẩm:", error);
    }
  };

  const updateQuantity = async (productId: number, newQuantity: number) => {
    if (newQuantity < 1) {
      Alert.alert("Thông báo", "Số lượng phải lớn hơn hoặc bằng 1!");
      return;
    }
    if (newQuantity > 100) {
      Alert.alert("Thông báo", "Số lượng tối đa là 100!");
      return;
    }

    try {
      await callApi(
        `${URL_CONNECT}/api/cart/update`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId, quantity: newQuantity }),
        },
        token
      );
      setCartItems((prev) =>
        prev.map((item) =>
          item.product_id === productId ? { ...item, quantity: newQuantity } : item
        )
      );
    } catch (error) {
      console.error("Lỗi cập nhật số lượng:", error);
      Alert.alert("Lỗi", "Không thể cập nhật số lượng sản phẩm!");
    }
  };

  const calculateTotal = () => {
    const selectedCartItems = cartItems.filter((item) =>
      selectedItems.includes(item.product_id)
    );
    const subtotal = selectedCartItems.reduce(
      (total, item) => total + item.price_at_time * item.quantity,
      0
    );
    const total = subtotal + shippingFee;
    return { subtotal, total };
  };

  const handleCheckout = () => {
    if (selectedItems.length === 0) {
      Alert.alert("Thông báo", "Vui lòng chọn ít nhất một sản phẩm để thanh toán!");
      return;
    }

    const selectedCartItems = cartItems.filter((item) =>
      selectedItems.includes(item.product_id)
    );

    router.replace({
      pathname: "/(buyer)/Checkout",
      params: { selectedItems: JSON.stringify(selectedCartItems) },
    });
  };

  // const formatPrice = (price: number) => {
  //   const priceStr = Math.floor(price).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  //   return priceStr + "đ";
  // };

  const { subtotal, total } = calculateTotal();

  return (
    <View className="flex-1 bg-gray-50 p-4">
      <Text className="text-2xl font-bold text-gray-900 mb-4">Giỏ hàng</Text>

      <FlatList
        data={cartItems}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => toggleSelectItem(item.product_id)}
            activeOpacity={0.7}
          >
            <View className="flex-row items-center bg-white p-4 rounded-xl mb-3 shadow-md border border-gray-200">
              <View className="mr-3">
                <FontAwesome
                  name={selectedItems.includes(item.product_id) ? "check-square-o" : "square-o"}
                  size={24}
                  color={selectedItems.includes(item.product_id) ? "#10B981" : "#6B7280"}
                />
              </View>
              <Image
                source={{ uri: `${URL_CONNECT}${item.image_url}` || "https://via.placeholder.com/100" }}
                className="w-20 h-20 rounded-lg"
              />
              <View className="flex-1 ml-4">
                <Text className="text-lg font-semibold text-gray-900">{item.name}</Text>
                <Text className="text-md text-green-600 font-medium mt-1">
                  {formatPrice(item.price_at_time)}
                </Text>
                <View className="flex-row items-center mt-1">
                  <Text className="text-sm text-gray-600 mr-2">Số lượng:</Text>
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      updateQuantity(item.product_id, item.quantity - 1);
                    }}
                    className="bg-gray-200 p-2 rounded-l-md"
                  >
                    <Text className="text-lg font-semibold text-gray-700">-</Text>
                  </TouchableOpacity>
                  <Text className="text-sm text-gray-600 mx-2 w-8 text-center">{item.quantity}</Text>
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      updateQuantity(item.product_id, item.quantity + 1);
                    }}
                    className="bg-gray-200 p-2 rounded-r-md"
                  >
                    <Text className="text-lg font-semibold text-gray-700">+</Text>
                  </TouchableOpacity>
                </View>
                <Text className="text-sm text-gray-600 mt-1">
                  Cửa hàng: {item.store_name}
                </Text>
              </View>
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  removeFromCart(item.product_id);
                }}
                className="p-2"
              >
                <FontAwesome name="trash" size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text className="text-gray-500 text-center mt-4">
            Giỏ hàng của bạn đang trống!
          </Text>
        }
      />

      <View className="bg-white p-4 rounded-xl mt-4 shadow-md">
        <View className="flex-row justify-between mb-2">
          <Text className="text-md text-gray-600">Tổng tiền hàng:</Text>
          <Text className="text-md font-medium text-gray-900">
            {formatPrice(subtotal)}
          </Text>
        </View>
        <View className="flex-row justify-between mb-2">
          <Text className="text-md text-gray-600">Phí vận chuyển:</Text>
          <Text className="text-md font-medium text-gray-900">
            {formatPrice(shippingFee)}
          </Text>
        </View>
        <View className="flex-row justify-between mb-4">
          <Text className="text-lg font-semibold text-gray-900">Tổng thanh toán:</Text>
          <Text className="text-lg font-bold text-red-600">{formatPrice(total)}</Text>
        </View>
        <TouchableOpacity
          className="bg-green-600 p-4 rounded-xl flex-row items-center justify-center shadow-md"
          onPress={handleCheckout}
        >
          <Text className="text-white font-semibold text-lg">Thanh toán</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Cart;