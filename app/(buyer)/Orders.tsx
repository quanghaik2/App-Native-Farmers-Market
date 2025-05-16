import React, { useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import Toast from "react-native-toast-message";
import MaterialIcons from "react-native-vector-icons/MaterialIcons"; 
import { useAuth } from "../../context/AuthContext";
import { callApi } from "../../lib/api/auth";
import { URL_CONNECT } from "../../lib/constants";
import { useRouter } from "expo-router";
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
  cancellation_requested: boolean;
  cancellation_reason?: string;
}

const Orders: React.FC = () => {
  const { token } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  

  useEffect(() => {
    fetchOrders();
  }, [token]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const result = await callApi(`${URL_CONNECT}/api/orders`, { method: "GET" }, token);
      if (result && Array.isArray(result)) {
        setOrders(result);
        Toast.show({
          type: "success",
          text1: "Thành công",
          text2: "Đã làm mới dữ liệu",
          position: "top",
        });
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error("Lỗi khi lấy đơn hàng:", error);
      setOrders([]);
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

  const requestCancellation = async (orderId: number) => {
    try {
      await callApi(`${URL_CONNECT}/api/orders/${orderId}/request-cancellation`, {
        method: "POST",
      }, token);
      Toast.show({
        type: "success",
        text1: "Thành công",
        text2: "Yêu cầu hủy đã được gửi",
        position: "top",
      });
      fetchOrders();
    } catch (error: any) {
      console.error("Lỗi khi yêu cầu hủy:", error);
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: error.message || "Không thể gửi yêu cầu hủy",
        position: "top",
      });
    }
  };

  // const formatPrice = (price: number) => {
  //   return price.toLocaleString("vi-VN", { style: "currency", currency: "VND" });
  // };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}`;
  };

  const renderOrder = ({ item }: { item: Order }) => (
    <TouchableOpacity
      className="bg-white p-4 rounded-xl mb-3 shadow-md"
      onPress={() =>
        router.push({
          pathname: "/(buyer)/OrderDetail",
          params: { orderId: item.id.toString() },
        })
      }
    >
      <Text className="text-lg font-semibold text-gray-900">Đơn hàng #{item.id}</Text>
      <Text className="text-sm text-gray-600 mt-1">
        Thời gian đặt hàng: {formatDate(item.created_at)}
      </Text>
      <Text className="text-sm text-gray-600 mt-1">
        Trạng thái: {item.status}{item.cancellation_requested ? " (Đang chờ phản hồi hủy)" : ""}
      </Text>
      <Text className="text-sm text-gray-600 mt-1">
        Tổng thanh toán: {formatPrice(item.total_amount)}
      </Text>
      {(item.status === "pending" || item.status === "confirmed") && !item.cancellation_requested && (
        <TouchableOpacity
          className="bg-red-500 p-2 rounded mt-2"
          onPress={() => requestCancellation(item.id)}
        >
          <Text className="text-white text-center">Yêu cầu hủy</Text>
        </TouchableOpacity>
      )}
      {item.cancellation_reason && (
        <Text className="text-sm text-red-600 mt-1">
          Lý do từ chối hủy: {item.cancellation_reason}
        </Text>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-100">
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-100 p-4">
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-2xl font-bold">Danh sách đơn hàng</Text>
        <TouchableOpacity onPress={fetchOrders}>
          <MaterialIcons name="refresh" size={28} color="#10B981" />
        </TouchableOpacity>
      </View>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderOrder}
        ListEmptyComponent={
          <Text className="text-gray-500 text-center mt-4">Bạn chưa có đơn hàng nào!</Text>
        }
      />
    </ScrollView>
  );
};

export default Orders;