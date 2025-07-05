import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { callApi } from "../../lib/api/auth";
import { URL_CONNECT } from "../../lib/constants";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { getUserAddresses } from "../../lib/api/auth";
import { formatPrice } from "@/lib/utils";

interface CartItem {
  id: number;
  product_id: number;
  quantity: number;
  price_at_time: number;
  name: string;
  image_url: string;
  seller_id: number;
  store_name: string;
}

interface Address {
  id: number;
  full_name: string;
  phone_number: string;
  province: string;
  district: string;
  ward: string;
  detailed_address: string;
  is_default: boolean;
}

const Checkout = () => {
  const { user, token, setCartItemCount, fetchCartCount } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  const isBuyNow = params.isBuyNow === "true";

  const selectedItems: CartItem[] = useMemo(() => {
    try {
      return params.selectedItems ? JSON.parse(params.selectedItems as string) : [];
    } catch (error) {
      console.error("Lỗi khi parse selectedItems:", error);
      return [];
    }
  }, [params.selectedItems]);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [shippingFee] = useState<number>(30000);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState<boolean>(false);

  useEffect(() => {
    if (token) {
      fetchAddresses();
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      if (token) {
        fetchAddresses();
      }
    }, [token])
  );

  useEffect(() => {
    console.log("Sản phẩm đã chọn trong Checkout:", selectedItems);
    if (selectedItems.length === 0) {
      Alert.alert("Thông báo", "Không có sản phẩm nào được chọn để thanh toán!", [
        { text: "Quay lại", onPress: () => router.back() },
      ]);
    }
  }, [selectedItems]);

  const fetchAddresses = async () => {
    setIsLoadingAddresses(true);
    try {
      const result = await getUserAddresses(token);
      setAddresses((prev) => {
        const newAddresses = result as Address[];
        if (JSON.stringify(prev) !== JSON.stringify(newAddresses)) {
          return newAddresses;
        }
        return prev;
      });
      if (!selectedAddress || !result.some((addr: Address) => addr.id === selectedAddress.id)) {
        const defaultAddress = (result as Address[]).find((addr) => addr.is_default) || result[0] || null;
        setSelectedAddress(defaultAddress);
      }
    } catch (error: any) {
      Alert.alert("Lỗi", "Không thể lấy danh sách địa chỉ: " + error.message);
    } finally {
      setIsLoadingAddresses(false);
    }
  };

  const fetchSellerIdAndStoreName = async (productId: number) => {
    try {
      console.log(`Gọi API lấy seller_id và store_name cho product_id: ${productId}`);
      const response = await callApi(
        `${URL_CONNECT}/api/products/${productId}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        },
        token
      );
      console.log(`seller_id cho product_id ${productId}:`, response.seller_id);
      console.log(`store_name cho product_id ${productId}:`, response.store_name);
      if (!response.seller_id) {
        throw new Error(`Sản phẩm ${productId} không có seller_id!`);
      }
      if (!response.store_name) {
        throw new Error(`Sản phẩm ${productId} không có store_name!`);
      }
      return { seller_id: response.seller_id, store_name: response.store_name };
    } catch (error: any) {
      console.error(`Lỗi khi lấy thông tin cho sản phẩm ${productId}:`, error.message);
      throw new Error(`Không thể lấy thông tin cho sản phẩm ${productId}: ${error.message}`);
    }
  };

  const calculateTotal = () => {
    const subtotal = selectedItems.reduce((total, item) => total + Number(item.price_at_time) * item.quantity, 0);
    const total = subtotal + shippingFee;
    return { subtotal, total };
  };

  const handlePlaceOrder = async () => {
    console.log("Nút Đặt hàng được nhấn!");
    console.log("selectedAddress:", selectedAddress);
    if (!selectedAddress) {
      Alert.alert("Thông báo", "Vui lòng chọn địa chỉ nhận hàng!");
      return;
    }

    console.log("selectedItems:", selectedItems);
    let updatedItems;
    try {
      updatedItems = await Promise.all(
        selectedItems.map(async (item) => {
          try {
            if (
              !item.seller_id ||
              item.seller_id === null ||
              item.seller_id === undefined ||
              !item.store_name ||
              item.store_name === null ||
              item.store_name === undefined
            ) {
              const { seller_id, store_name } = await fetchSellerIdAndStoreName(item.product_id);
              return { ...item, seller_id, store_name };
            }
            return item;
          } catch (error) {
            console.error(`Lỗi khi xử lý item ${item.product_id}:`, error.message);
            throw error;
          }
        })
      );
    } catch (error: any) {
      Alert.alert("Lỗi", `Không thể lấy thông tin người bán: ${error.message}`);
      return;
    }

    console.log("updatedItems:", updatedItems);

    try {
      const response = await callApi(
        `${URL_CONNECT}/api/orders/create${isBuyNow ? "-buy-now" : ""}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: updatedItems.map((item) => ({
              product_id: item.product_id,
              quantity: item.quantity,
              price_at_time: Number(item.price_at_time),
              seller_id: item.seller_id,
              name: item.name,
              store_name: item.store_name,
            })),
            address_id: selectedAddress.id,
            shippingFee,
          }),
        },
        token
      );

      // Cập nhật số lượng giỏ hàng (chỉ cho thanh toán thông thường)
      if (!isBuyNow) {
        await fetchCartCount();
      }

      Alert.alert("Thành công", "Đặt hàng thành công!", [
        {
          text: "OK",
          onPress: () =>
            router.replace({
              pathname: "/(buyer)/OrderDetail",
              params: { orderId: response.orderIds[0].toString() },
            }),
        },
      ]);
    } catch (error: any) {
      Alert.alert("Lỗi", "Đặt hàng thất bại: " + error.message);
    }
  };

  // const formatPrice = (price: number) => {
  //   return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "đ";
  // };

  const { subtotal, total } = calculateTotal();

  return (
    <ScrollView className="flex-1 bg-gray-50 p-4">
      <Text className="text-2xl font-bold text-gray-900 mb-4">Thanh toán</Text>

      <View className="bg-white p-4 rounded-xl mb-4 shadow-md">
        <Text className="text-lg font-semibold text-gray-900 mb-3">
          Sản phẩm đã chọn ({selectedItems.length})
        </Text>
        <FlatList
          data={selectedItems}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View className="flex-row items-center bg-gray-50 p-3 rounded-lg mb-2 border border-gray-200">
              <Image
                source={{ uri: `${URL_CONNECT}${item.image_url}` || "https://via.placeholder.com/100" }}
                className="w-16 h-16 rounded-lg"
                resizeMode="cover"
              />
              <View className="flex-1 ml-3">
                <Text className="text-md font-semibold text-gray-900" numberOfLines={1}>
                  {item.name}
                </Text>
                <Text className="text-sm text-green-600 font-medium mt-1">
                  {formatPrice(Number(item.price_at_time))}
                </Text>
                <Text className="text-sm text-gray-600 mt-1">Số lượng: {item.quantity}</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <Text className="text-gray-500 text-center mt-4">Không có sản phẩm nào để thanh toán!</Text>
          }
          scrollEnabled={false}
        />
      </View>

      <View className="bg-white p-4 rounded-xl mb-4 shadow-md">
        <Text className="text-lg font-semibold text-gray-900 mb-2">Địa chỉ nhận hàng</Text>
        {isLoadingAddresses ? (
          <Text className="text-sm text-gray-600 mb-4">Đang tải địa chỉ...</Text>
        ) : selectedAddress ? (
          <View className="mb-4">
            <Text className="text-md font-medium">
              {selectedAddress.full_name} | {selectedAddress.phone_number}
            </Text>
            <Text className="text-sm text-gray-600">
              {selectedAddress.detailed_address}, {selectedAddress.ward}, {selectedAddress.district}, {selectedAddress.province}
            </Text>
          </View>
        ) : (
          <Text className="text-sm text-gray-600 mb-4">Chưa chọn địa chỉ</Text>
        )}
        <TouchableOpacity
          className="bg-blue-600 p-3 rounded-xl"
          onPress={() => router.push({ pathname: "/address-management", params: { fromCheckout: "true" } })}
        >
          <Text className="text-white font-semibold text-center">Chọn địa chỉ</Text>
        </TouchableOpacity>
      </View>

      <View className="bg-white p-4 rounded-xl mb-4 shadow-md">
        <View className="flex-row justify-between mb-2">
          <Text className="text-md text-gray-600">Tổng tiền hàng:</Text>
          <Text className="text-md font-medium text-gray-900">{formatPrice(subtotal)}</Text>
        </View>
        <View className="flex-row justify-between mb-2">
          <Text className="text-md text-gray-600">Phí vận chuyển:</Text>
          <Text className="text-md font-medium text-gray-900">{formatPrice(shippingFee)}</Text>
        </View>
        <View className="flex-row justify-between mb-4">
          <Text className="text-lg font-semibold text-gray-900">Tổng thanh toán:</Text>
          <Text className="text-lg font-bold text-red-600">{formatPrice(total)}</Text>
        </View>
        <TouchableOpacity
          className="bg-green-600 p-4 rounded-xl"
          onPress={handlePlaceOrder}
        >
          <Text className="text-white font-semibold text-lg text-center">Đặt hàng</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default Checkout;