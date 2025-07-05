
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { callApi } from "@/lib/api/auth";
import { URL_CONNECT } from "../../lib/constants";

interface ReportSummary {
  product_id: number;
  product_name: string;
  report_count: number;
  latest_report: string;
  type: "report";
}

interface AutoHideProduct {
  product_id: number;
  product_name: string;
  reason: string;
  type: "autoHide";
}

type NotificationItem = ReportSummary | AutoHideProduct;

const AdminReportList: React.FC = () => {
  const { user, token } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);

  const fetchNotifications = useCallback(async () => {
    // if (!token || !user || user.role !== "admin") {
    //   Alert.alert("Lỗi", "Bạn không có quyền truy cập!");
    //   router.replace("/(auth)/login-seller");
    //   return;
    // }
    setIsLoading(true);
    try {
      // Lấy dữ liệu báo cáo trước
      const reportData: ReportSummary[] = await callApi(
        `${URL_CONNECT}/api/reports/summary?limit=10&page=${page}`,
        { method: "GET" },
        token
      );

      // Sau đó lấy dữ liệu sản phẩm bị ẩn tự động
      const autoHideData: AutoHideProduct[] = await callApi(
        `${URL_CONNECT}/api/products/auto-hidden`,
        { method: "GET" },
        token
      );

      // Tách biệt dữ liệu và gộp theo loại
      const updatedNotifications = [
        ...reportData.map(item => ({ ...item, type: "report" as const })),
        ...autoHideData.map(item => ({ ...item, type: "autoHide" as const }))
      ];

      // Cập nhật state chỉ khi page = 1 hoặc thêm mới
      setNotifications(prev => (page === 1 ? updatedNotifications : [...prev, ...reportData.map(item => ({ ...item, type: "report" as const }))]));
      // Kiểm tra hasMore dựa trên reportData vì autoHideData là danh sách tĩnh
      if (reportData.length < 10) setHasMore(false);
    } catch (error) {
      Alert.alert("Lỗi", "Không thể tải danh sách thông báo!");
    } finally {
      setIsLoading(false);
    }
  }, [token, user, router, page]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications, token, user]);

  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      setPage(prev => prev + 1);
    }
  };

  const renderNotificationItem = ({ item }: { item: NotificationItem }) => {
    if (item.type === "report") {
      const report = item as ReportSummary;
      return (
        <TouchableOpacity
          style={styles.item}
          onPress={() => router.push({
            pathname: "/(admin)/AdminReportDetail",
            params: { productId: report.product_id.toString() },
          })}
        >
          <View style={styles.textContainer}>
            <Text style={styles.productName}>{report.product_name}</Text>
            <Text style={styles.reportCount}>Số báo cáo: {report.report_count}</Text>
            <Text style={styles.latestReport}>
              Gần nhất: {new Date(report.latest_report).toLocaleDateString()}
            </Text>
          </View>
        </TouchableOpacity>
      );
    } else {
      const autoHide = item as AutoHideProduct;
      return (
        <TouchableOpacity
          style={[styles.item, styles.autoHideItem]}
          onPress={() => router.push({
            pathname: "/(admin)/AdminReportDetail",
            params: { productId: autoHide.product_id.toString() },
          })}
        >
          <View style={styles.textContainer}>
            <Text style={styles.productName}>{autoHide.product_name}</Text>
            <Text style={styles.autoHideText}>
              Lý do ẩn: {autoHide.reason}
            </Text>
          </View>
        </TouchableOpacity>
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Danh sách Thông báo</Text>
      {isLoading && page === 1 ? (
        <ActivityIndicator size="large" color="#10B981" />
      ) : notifications.length === 0 ? (
        <Text style={styles.noData}>Không có thông báo nào.</Text>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => `${item.type}-${item.product_id.toString()}`}
          renderItem={renderNotificationItem}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={isLoading ? <ActivityIndicator size="small" /> : null}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f9f9f9" },
  title: { fontSize: 24, fontWeight: "bold", textAlign: "center", marginBottom: 16 },
  item: { padding: 12, backgroundColor: "#fff", borderRadius: 8, marginBottom: 8, flexDirection: "row", alignItems: "center" },
  autoHideItem: { backgroundColor: "#fef3c7" },
  textContainer: { flex: 1 },
  productName: { fontSize: 18, fontWeight: "600", color: "#333" },
  reportCount: { fontSize: 14, color: "#666" },
  latestReport: { fontSize: 12, color: "#888" },
  autoHideText: { fontSize: 14, color: "#744210", fontStyle: "italic" },
  noData: { textAlign: "center", color: "#666", marginTop: 20 },
});

export default AdminReportList;
