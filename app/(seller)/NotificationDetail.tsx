import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator,
  TouchableOpacity
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { callApi } from "../../lib/api/auth";
import { URL_CONNECT } from "../../lib/constants";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";

interface NotificationDetail {
  id: number;
  message: string;
  created_at: string;
  product_id: number | null;
}

const NotificationDetail: React.FC = () => {
  const { notificationId, productId } = useLocalSearchParams();
  console.log(notificationId);
  const { token } = useAuth();
  const router = useRouter();
  const [notification, setNotification] = useState<NotificationDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotificationDetail = async () => {
      try {
        setLoading(true);
        const result = await callApi(
          `${URL_CONNECT}/api/notifications/${notificationId}`,
          { method: "GET" },
        );
        console.log("Notification Detail:", result);
        setNotification(result[0]);
      } catch (error) {
        console.error("Lỗi khi lấy chi tiết thông báo:", error);
      } finally {
        setLoading(false);
      }
    };

    if (notificationId) {
      fetchNotificationDetail();
    }
  }, [notificationId, token]);

  const handleBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F5A623" />
      </View>
    );
  }

  if (!notification) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Không tìm thấy thông báo</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <MaterialIcons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết thông báo</Text>
        <View style={{ width: 24 }} /> {/* For alignment */}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.senderContainer}>
          <Text style={styles.senderLabel}>Người gửi:</Text>
          <Text style={styles.senderValue}>Quản trị viên hệ thống</Text>
        </View>

        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Thời gian:</Text>
          <Text style={styles.detailValue}>
            {new Date(notification.created_at).toLocaleString()}
          </Text>
        </View>

        {notification.product_id && (
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Mã sản phẩm:</Text>
            <Text style={styles.detailValue}>{notification.product_id}</Text>
          </View>
        )}

        <View style={styles.messageContainer}>
          <Text style={styles.messageLabel}>Nội dung:</Text>
          <Text style={styles.messageText}>{notification.message}</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  content: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#A0A0A0",
  },
  senderContainer: {
    flexDirection: "row",
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  senderLabel: {
    fontWeight: "bold",
    marginRight: 8,
    fontSize: 16,
  },
  senderValue: {
    fontSize: 16,
    color: "#333",
  },
  detailItem: {
    flexDirection: "row",
    marginBottom: 12,
  },
  detailLabel: {
    fontWeight: "bold",
    width: 100,
    fontSize: 15,
  },
  detailValue: {
    flex: 1,
    fontSize: 15,
  },
  messageContainer: {
    marginTop: 20,
  },
  messageLabel: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 8,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
});

export default NotificationDetail;