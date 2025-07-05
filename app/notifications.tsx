import React, { useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity } from "react-native";
import Toast from "react-native-toast-message";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "@/lib/constants/SocketContext";
import { callApi } from "../lib/api/auth";
import { URL_CONNECT } from "../lib/constants";
import { useRouter } from "expo-router";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";

interface Notification {
  id: number;
  user_id: number;
  message: string;
  order_id?: number;
  created_at: string;
}

const Notifications: React.FC = () => {
  const { user, token } = useAuth();
  const { socket, setHasNewProductNotification } = useSocket();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const fetchNotifications = async () => {
    try {
      const result = await callApi(`${URL_CONNECT}/api/notifications`, { method: "GET" }, token);
      setNotifications(result);
      setHasNewProductNotification(false);
      Toast.show({
        type: "success",
        text1: "Thành công",
        text2: "Đã làm mới dữ liệu",
        position: "top",
      });
    } catch (error) {
      console.error("Lỗi lấy thông báo:", error);
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Không thể làm mới dữ liệu",
        position: "top",
      });
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [token]);

  useEffect(() => {
    if (!socket) return;

    socket.on("newNotification", (notification: Notification) => {
      setNotifications((prev) => [notification, ...prev]);
      Toast.show({
        type: "info",
        text1: "Thông báo mới",
        text2: notification.message,
        position: "top",
      });
    });

    return () => {
      socket.off("newNotification");
    };
  }, [socket]);

  const handleNotificationPress = (notification: Notification) => {
    if (notification.order_id) {
      router.push({
        pathname: "/(buyer)/OrderDetail",
        params: { orderId: notification.order_id.toString() },
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}`;
  };

  return (
    <View className="flex-1 bg-gray-100 p-4">
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-2xl font-bold">Thông báo</Text>
        <TouchableOpacity onPress={fetchNotifications}>
          <MaterialIcons name="refresh" size={28} color="#10B981" />
        </TouchableOpacity>
      </View>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            className="bg-white p-4 rounded-xl mb-3 shadow-md"
            onPress={() => handleNotificationPress(item)}
          >
            <Text className="text-lg font-semibold text-gray-900">{item.message}</Text>
            <Text className="text-sm text-gray-600 mt-1">
              {formatDate(item.created_at)}
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text className="text-gray-500 text-center mt-4">Không có thông báo nào!</Text>
        }
      />
    </View>
  );
};

export default Notifications;