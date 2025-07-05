import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Alert,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { callApi } from "@/lib/api/auth";
import { URL_CONNECT } from "../../lib/constants";
import ImageViewing from "react-native-image-viewing";

interface ReportDetail {
  id: number;
  reason: string;
  user_email: string;
  created_at: string;
  evidence_image_url: string[] | null;
}

const AdminReportDetail: React.FC = () => {
  const { productId } = useLocalSearchParams();
  const { user, token } = useAuth();
  const router = useRouter();
  const [reports, setReports] = useState<ReportDetail[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isVisible, setIsVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [hideModalVisible, setHideModalVisible] = useState(false);
  const [restoreModalVisible, setRestoreModalVisible] = useState(false); // Modal cho khôi phục
  const [hideReason, setHideReason] = useState("");
  const [currentReportId, setCurrentReportId] = useState<number | null>(null);

  const fetchReports = useCallback(async () => {
    // if (!token || !user || user.role !== "admin" || !productId) {
    //   Alert.alert("Lỗi", "Bạn không có quyền truy cập!");
    //   router.back();
    //   return;
    // }
    setIsLoading(true);
    try {
      const data: ReportDetail[] = await callApi(
        `${URL_CONNECT}/api/reports/product/${productId}`,
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
      Alert.alert("Lỗi", "Không thể tải chi tiết báo cáo!");
    } finally {
      setIsLoading(false);
    }
  }, [token, user, router, productId]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleHideProduct = async () => {
    if (!hideReason.trim() || !currentReportId || !productId) {
      Alert.alert("Lỗi", "Vui lòng nhập lý do ẩn sản phẩm!");
      return;
    }

    try {
      await callApi(
        `${URL_CONNECT}/api/products/${productId}/hide`,
        {
          method: "PUT",
          body: JSON.stringify({ 
            reason: hideReason,
            report_id: currentReportId 
          }),
        },
        token
      );

      setReports((prev) => prev.filter((r) => r.id !== currentReportId));
      setHideModalVisible(false);
      setHideReason("");
      Alert.alert("Thành công", "Sản phẩm đã được ẩn và báo cáo đã xử lý!");
    } catch (error) {
      console.error("Lỗi khi ẩn sản phẩm:", error);
      Alert.alert("Lỗi", "Không thể ẩn sản phẩm!");
    }
  };

  const handleRestoreProduct = async () => {
    if (!productId) {
      Alert.alert("Lỗi", "Không tìm thấy ID sản phẩm!");
      return;
    }

    try {
      await callApi(
        `${URL_CONNECT}/api/products/${productId}/restore`,
        {
          method: "PUT",
        },
        token
      );

      setRestoreModalVisible(false);
      Alert.alert("Thành công", `Sản phẩm với ID ${productId} đã được khôi phục!`);
      router.back(); // Quay lại trang danh sách sau khi khôi phục
    } catch (error) {
      console.error("Lỗi khi khôi phục sản phẩm:", error);
      Alert.alert("Lỗi", "Không thể khôi phục sản phẩm!");
    }
  };

  const openImageViewer = (reportIndex: number, imageIndex: number) => {
    let globalIndex = 0;
    for (let i = 0; i < reportIndex; i++) {
      if (reports[i].evidence_image_url) {
        globalIndex += reports[i].evidence_image_url!.length;
      }
    }
    globalIndex += imageIndex;
    setCurrentImageIndex(globalIndex);
    setIsVisible(true);
  };

  const allImages = reports.flatMap((report) =>
    report.evidence_image_url
      ? report.evidence_image_url.map((url) => ({ uri: `${URL_CONNECT}${url}` }))
      : []
  );

  const renderReportItem = ({
    item: report,
    index: reportIndex,
  }: {
    item: ReportDetail;
    index: number;
  }) => (
    <View style={styles.item}>
      <Text style={styles.reason}>Lý do: {report.reason}</Text>
      <Text style={styles.email}>Email: {report.user_email}</Text>
      <Text style={styles.date}>
        Thời gian: {new Date(report.created_at).toLocaleDateString()}
      </Text>
      {report.evidence_image_url && report.evidence_image_url.length > 0 ? (
        <FlatList
          data={report.evidence_image_url}
          keyExtractor={(url, index) => `${report.id}-${index}`}
          renderItem={({ item: url, index: imageIndex }) => (
            <TouchableOpacity
              onPress={() => openImageViewer(reportIndex, imageIndex)}
            >
              <Image
                source={{ uri: `${URL_CONNECT}${url}` }}
                style={styles.image}
                resizeMode="contain"
              />
            </TouchableOpacity>
          )}
          horizontal
          showsHorizontalScrollIndicator={false}
        />
      ) : (
        <Text style={styles.noImage}>Không có ảnh minh chứng</Text>
      )}
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => {
          setCurrentReportId(report.id);
          setHideModalVisible(true);
        }}
      >
        <Text style={styles.deleteText}>Ẩn sản phẩm</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chi tiết Báo cáo - Sản phẩm ID: {productId}</Text>
      {isLoading ? (
        <ActivityIndicator size="large" color="#10B981" />
      ) : reports.length === 0 ? (
        <Text style={styles.noData}>Không có báo cáo cho sản phẩm này.</Text>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderReportItem}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
      {/* Nút khôi phục sản phẩm riêng biệt */}
      <TouchableOpacity
        style={styles.restoreButton}
        onPress={() => setRestoreModalVisible(true)}
        disabled={!productId}
      >
        <Text style={styles.restoreText}>Khôi phục sản phẩm</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>Quay lại</Text>
      </TouchableOpacity>
      
      <ImageViewing
        images={allImages}
        imageIndex={currentImageIndex}
        visible={isVisible}
        onRequestClose={() => setIsVisible(false)}
      />

      {/* Modal ẩn sản phẩm */}
      <Modal
        visible={hideModalVisible}
        animationType="slide"
        onRequestClose={() => {
          setHideModalVisible(false);
          setHideReason("");
        }}
      >
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Ẩn sản phẩm</Text>
          <Text style={styles.modalText}>
            Vui lòng nhập lý do ẩn sản phẩm này. Lý do này sẽ được gửi tới cửa hàng.
          </Text>
          
          <TextInput
            style={styles.reasonInput}
            placeholder="Nhập lý do ẩn sản phẩm..."
            value={hideReason}
            onChangeText={setHideReason}
            multiline
            numberOfLines={4}
          />
          
          <View style={styles.modalButtonContainer}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => {
                setHideModalVisible(false);
                setHideReason("");
              }}
            >
              <Text style={styles.buttonText}>Hủy</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modalButton, styles.confirmButton]}
              onPress={handleHideProduct}
              disabled={!hideReason.trim()}
            >
              <Text style={styles.buttonText}>Xác nhận</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal khôi phục sản phẩm */}
      <Modal
        visible={restoreModalVisible}
        animationType="slide"
        onRequestClose={() => setRestoreModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Khôi phục sản phẩm</Text>
          <Text style={styles.modalText}>
            Bạn có chắc chắn muốn khôi phục sản phẩm này? Hành động này sẽ đưa sản phẩm trở lại trạng thái hiển thị.
          </Text>
          
          <View style={styles.modalButtonContainer}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setRestoreModalVisible(false)}
            >
              <Text style={styles.buttonText}>Hủy</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modalButton, styles.confirmButton]}
              onPress={handleRestoreProduct}
            >
              <Text style={styles.buttonText}>Xác nhận</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f9f9f9" },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
  },
  item: { padding: 12, backgroundColor: "#fff", borderRadius: 8, marginBottom: 8 },
  reason: { fontSize: 16, fontWeight: "500", color: "#333" },
  email: { fontSize: 14, color: "#666", marginTop: 4 },
  date: { fontSize: 12, color: "#888", marginTop: 4 },
  image: { width: 100, height: 100, marginRight: 8 },
  noImage: { fontSize: 14, color: "#666", marginTop: 8 },
  deleteButton: {
    backgroundColor: "#EF4444",
    padding: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  deleteText: { color: "#fff", textAlign: "center" },
  restoreButton: {
    backgroundColor: "#10B981",
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    alignItems: "center",
  },
  restoreText: { color: "#fff", textAlign: "center", fontWeight: "500" },
  backButton: {
    backgroundColor: "#3B82F6",
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  backText: { color: "#fff", textAlign: "center", fontWeight: "500" },
  noData: { textAlign: "center", color: "#666", marginTop: 20 },
  // Modal styles
  modalContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
    color: '#555',
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    padding: 15,
    borderRadius: 5,
    width: '48%',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#e74c3c',
  },
  confirmButton: {
    backgroundColor: '#2ecc71',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default AdminReportDetail;