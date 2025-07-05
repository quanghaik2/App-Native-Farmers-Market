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
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { callApi } from "@/lib/api/auth";
import { URL_CONNECT } from "../../lib/constants";

interface ReportDetail {
  id: number;
  reason: string;
  user_email: string;
  created_at: string;
  evidence_image_url: string[] | null;
  severity: string;
}

const AdminSevereReports: React.FC = () => {
  const { user, token } = useAuth();
  const router = useRouter();
  const { productId } = useLocalSearchParams();
  const [reports, setReports] = useState<ReportDetail[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchReports = useCallback(async () => {
    // if (!token || !user || user.role !== "admin" || !productId) {
    //   Alert.alert("Lỗi", "Bạn không có quyền truy cập!");
    //   router.back();
    //   return;
    // }
    setIsLoading(true);
    try {
      const data: ReportDetail[] = await callApi(
        `${URL_CONNECT}/api/reports/product/${productId}?severity=Nghiêm trọng`,
        { method: "GET" },
        token
      );
      setReports(
        data.map((report) => ({
          ...report,
          evidence_image_url: report.evidence_image_url
            ? JSON.parse(report.evidence_image_url)
            : null,
        }))
      );
    } catch (error) {
      Alert.alert("Lỗi", "Không thể tải danh sách báo cáo nghiêm trọng!");
    } finally {
      setIsLoading(false);
    }
  }, [token, user, router, productId]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const renderReportItem = ({ item }: { item: ReportDetail }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => router.push({
        pathname: "/(admin)/AdminReportDetail",
        params: { reportId: item.id.toString(), productId: productId.toString() },
      })}
    >
      <View style={styles.textContainer}>
        <Text style={styles.reason}>Lý do: {item.reason}</Text>
        <Text style={styles.email}>Email: {item.user_email}</Text>
        <Text style={styles.date}>
          Thời gian: {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Báo cáo Nghiêm trọng - Sản phẩm ID: {productId}</Text>
      {isLoading ? (
        <ActivityIndicator size="large" color="#10B981" />
      ) : reports.length === 0 ? (
        <Text style={styles.noData}>Không có báo cáo nghiêm trọng nào.</Text>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={item => item.id.toString()}
          renderItem={renderReportItem}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>Quay lại</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f9f9f9" },
  title: { fontSize: 24, fontWeight: "bold", textAlign: "center", marginBottom: 16 },
  item: { padding: 12, backgroundColor: "#fff", borderRadius: 8, marginBottom: 8 },
  textContainer: { flex: 1 },
  reason: { fontSize: 16, fontWeight: "500", color: "#333" },
  email: { fontSize: 14, color: "#666", marginTop: 4 },
  date: { fontSize: 12, color: "#888", marginTop: 4 },
  noData: { textAlign: "center", color: "#666", marginTop: 20 },
  backButton: { backgroundColor: "#3B82F6", padding: 12, borderRadius: 8, marginTop: 16 },
  backText: { color: "#fff", textAlign: "center", fontWeight: "500" },
});

export default AdminSevereReports;