import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  FlatList, 
  ActivityIndicator, 
  TouchableOpacity, 
  StyleSheet,
  Alert
} from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useAuth } from "../../context/AuthContext";
import { callApi } from "../../lib/api/auth";
import { URL_CONNECT } from "../../lib/constants";
import { useRouter } from "expo-router";
import { useSocket } from "@/lib/constants/SocketContext";

interface ProductNotification {
  id: number;
  message: string;
  created_at: string;
  is_read: boolean;
  product_id: number | null;
}

const SellerNotifications: React.FC = () => {
  const { token, user } = useAuth();
  const router = useRouter();
  const { socket, hasNewProductNotification, setHasNewProductNotification } = useSocket();
  const [notifications, setNotifications] = useState<ProductNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const result = await callApi(
        `${URL_CONNECT}/api/notifications/product-removed`,
        { method: "GET" },
        token
      );
      setNotifications(result);
    } catch (error) {
      console.error("Lỗi khi lấy thông báo sản phẩm bị gỡ:", error);
    } finally {
      setLoading(false);
    }
  };

  // const markAsRead = async (id: number) => {
  //   try {
  //     await callApi(
  //       `${URL_CONNECT}/api/notifications/${id}/read`,
  //       { method: "PUT" },
  //       token
  //     );
  //     setNotifications(prev =>
  //       prev.map(n => n.id === id ? { ...n, is_read: true } : n)
  //     );
  //   } catch (error) {
  //     console.error("Lỗi khi đánh dấu đã đọc:", error);
  //   }
  // };

  useEffect(() => {
    fetchNotifications();
    
    // Lắng nghe socket khi có thông báo mới
    if (socket) {
      socket.on("productRemovedByAdmin", (data) => {
        if (data.userId === user?.id?.toString()) {
          Alert.alert("Sản phẩm bị gỡ", data.message);
          fetchNotifications(); // Làm mới danh sách
        }
      });
    }

    return () => {
      if (socket) {
        socket.off("productRemovedByAdmin");
      }
    };
  }, [socket, token, user]);

  const renderItem = ({ item }: { item: ProductNotification }) => (
    <TouchableOpacity
      style={[styles.notificationItem, !item.is_read && styles.unreadItem]}
      onPress={() => {
        // if (!item.is_read) {
        //   markAsRead(item.id);
        // }
        if (item.product_id) {
          router.push(`/(seller)/NotificationDetail?notificationId=${item.id}&productId=${item.product_id}`);
        }
      }}
    >
      <View style={styles.notificationContent}>
        <Text style={styles.notificationText} numberOfLines={2} ellipsizeMode="tail">
          {item.message}
        </Text>
        <Text style={styles.notificationTime}>
          {new Date(item.created_at).toLocaleString()}
        </Text>
      </View>
      {!item.is_read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F5A623" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Thông báo sản phẩm</Text>
        {hasNewProductNotification && (
          <View style={styles.unreadBadge}>
            <MaterialIcons name="warning" size={16} color="#fff" />
          </View>
        )}
      </View>

      <FlatList
        data={notifications}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="notifications-off" size={48} color="#A0A0A0" />
            <Text style={styles.emptyText}>Không có thông báo nào</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerText: {
    fontSize: 20,
    fontWeight: "bold",
    marginRight: 8,
  },
  unreadBadge: {
    backgroundColor: "#EF4444",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  unreadItem: {
    backgroundColor: "#FFF9E6",
  },
  notificationContent: {
    flex: 1,
  },
  notificationText: {
    fontSize: 16,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: "#A0A0A0",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#F5A623",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: "#A0A0A0",
  },
});

export default SellerNotifications;