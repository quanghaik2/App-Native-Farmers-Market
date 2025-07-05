import React, { useState, useEffect } from "react";
import { View, Text, FlatList, ScrollView, Image } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { callApi } from "../../lib/api/auth";
import { URL_CONNECT } from "../../lib/constants";
import { useLocalSearchParams } from "expo-router";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { formatPrice } from "@/lib/utils";

interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  price_at_time: number;
  name: string;
  store_name: string;
}

interface Order {
  id: number;
  user_id: number;
  total_amount: number;
  original_amount: number;
  shipping_fee: number;
  address: string;
  status: string;
  created_at: string;
  items: OrderItem[];
}

const OrderDetail = () => {
  const { token } = useAuth();
  const params = useLocalSearchParams();
  const orderId = params.orderId as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [imageUrls, setImageUrls] = useState<{ [key: number]: string }>({});

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const result = await callApi(
          `${URL_CONNECT}/api/orders/create-detail/${orderId}`,
          { method: "GET" },
          token
        );
        setOrder(result);
      } catch (error) {
        console.error("Lỗi lấy chi tiết đơn hàng:", error);
      }
    };
    fetchOrder();
  }, [token, orderId]);

  useEffect(() => {
    const loadImages = async () => {
      if (order) {
        const urls: { [key: number]: string } = {};
        try {
          for (const item of order.items) {
            const url = await fetchProductImage(item.product_id);
            urls[item.product_id] = url;
          }
          setImageUrls(urls);
        } catch (error) {
          console.error("Lỗi khi tải hình ảnh:", error);
        }
      }
    };
    loadImages();
  }, [order]);

  const fetchProductImage = async (productId: number) => {
    try {
      const result = await callApi(
        `${URL_CONNECT}/api/products/${productId}`,
        { method: "GET" },
        token
      );
      console.log(`${URL_CONNECT}${result.image_url}`);
      return `${URL_CONNECT}${result.image_url}`;
    } catch (error) {
      console.error("Lỗi lấy hình ảnh:", error);
      return "https://via.placeholder.com/100";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}`;
  };

  const renderOrderStatus = () => {
    const statuses = [
      { label: "Đơn Hàng Đã Đặt", icon: "cart", completed: true },
      { label: "Đã Xác Nhận Đơn Hàng", icon: "check-circle", completed: order?.status !== "pending" },
      { label: "Hàng đang được giao", icon: "truck", completed: order?.status === "shipped" || order?.status === "delivered" },
      { label: "Giao Hàng Thành Công", icon: "account-check", completed: order?.status === "delivered" },
    ];

    return (
      <View className="mb-6">
        <View className="flex-row justify-between items-center">
          {statuses.map((status, index) => (
            <View key={index} className="flex-1 items-center">
              <MaterialCommunityIcons
                name={status.icon}
                size={24}
                color={status.completed ? "#10B981" : "#D1D5DB"}
              />
              <Text className={`text-xs mt-1 text-center ${status.completed ? "text-gray-900" : "text-gray-400"}`}>
                {status.label}
              </Text>
              {status.completed && index < statuses.length - 1 && (
                <View className="absolute top-3 left-1/2 w-full h-1 bg-green-500" style={{ marginLeft: 12 }} />
              )}
              {index < statuses.length - 1 && !status.completed && (
                <View className="absolute top-3 left-1/2 w-full h-1 bg-gray-300" style={{ marginLeft: 12 }} />
              )}
            </View>
          ))}
        </View>
      </View>
    );
  };

  if (!order) {
    return (
      <View className="flex-1 bg-gray-100 p-4">
        <Text className="text-lg text-gray-600">Đang tải...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-100 p-4">
      <Text className="text-2xl font-bold mb-4">Chi tiết đơn hàng #{order.id}</Text>

      {/* Trạng thái đơn hàng */}
      <View className="bg-white p-4 rounded-xl mb-4 shadow-md">
        <Text className="text-lg font-semibold mb-2">Trạng thái đơn hàng</Text>
        {renderOrderStatus()}
        <Text className="text-sm text-gray-600">
          Thời gian đặt hàng: {formatDate(order.created_at)}
        </Text>
      </View>

      {/* Danh sách sản phẩm */}
      <View className="bg-white p-4 rounded-xl mb-4 shadow-md">
        <Text className="text-lg font-semibold mb-3">
          Sản phẩm ({order.items.length})
        </Text>
        <FlatList
          data={order.items}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View className="flex-row items-center bg-gray-50 p-3 rounded-lg mb-2 border border-gray-200">
              <Image
                source={{ uri: imageUrls[item.product_id] || "https://via.placeholder.com/100" }}
                className="w-16 h-16 rounded-lg"
                resizeMode="cover"
              />
              <View className="flex-1 ml-3">
                <Text className="text-md font-semibold text-gray-900" numberOfLines={1}>
                  {item.name}
                </Text>
                <Text className="text-sm text-gray-600 mt-1">
                  Cửa hàng: {item.store_name}
                </Text>
                <Text className="text-sm text-green-600 font-medium mt-1">
                  {formatPrice(item.price_at_time)}
                </Text>
                <Text className="text-sm text-gray-600 mt-1">Số lượng: {item.quantity}</Text>
              </View>
            </View>
          )}
          scrollEnabled={false}
        />
      </View>

      {/* Thông tin giao hàng */}
      <View className="bg-white p-4 rounded-xl mb-4 shadow-md">
        <Text className="text-lg font-semibold mb-2">Thông tin giao hàng</Text>
        <Text className="text-sm text-gray-600">Địa chỉ: {order.address}</Text>
      </View>

      {/* Tổng tiền */}
      <View className="bg-white p-4 rounded-xl mb-4 shadow-md">
        <View className="flex-row justify-between mb-2">
          <Text className="text-md text-gray-600">Tổng tiền hàng:</Text>
          <Text className="text-md font-medium text-gray-900">
            {formatPrice(order.original_amount)}
          </Text>
        </View>
        <View className="flex-row justify-between mb-2">
          <Text className="text-md text-gray-600">Phí vận chuyển:</Text>
          <Text className="text-md font-medium text-gray-900">
            {formatPrice(order.shipping_fee)}
          </Text>
        </View>
        <View className="flex-row justify-between">
          <Text className="text-lg font-semibold text-gray-900">Tổng thanh toán:</Text>
          <Text className="text-lg font-bold text-red-600">
            {formatPrice(order.total_amount)}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default OrderDetail;