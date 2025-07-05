import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator, 
  ScrollView, 
  Image,
  TextInput,
  StyleSheet
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { useAuth } from "../../context/AuthContext";
import { URL_CONNECT } from "@/lib/constants";

const Report = () => {
  const { productId } = useLocalSearchParams();
  const { token } = useAuth();
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!productId) {
      Alert.alert("Lỗi", "Không tìm thấy ID sản phẩm!");
      router.back();
    }
    console.log("Token:", token); // Debug token
  }, [productId, router, token]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Lỗi", "Quyền truy cập ảnh bị từ chối!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      allowsMultipleSelection: true,
    });

    if (!result.canceled && result.assets) {
      const manipulatedImages = await Promise.all(
        result.assets.map(async (asset) => {
          const manipulatedImage = await ImageManipulator.manipulateAsync(
            asset.uri,
            [],
            { compress: 0.7, format: ImageManipulator.SaveFormat.PNG }
          );
          return manipulatedImage.uri;
        })
      );
      setImageUris(prev => [...prev, ...manipulatedImages]);
    }
  };

  const handleSubmit = async () => {
    if (!token) {
      Alert.alert("Lỗi", "Vui lòng đăng nhập để gửi báo cáo!", [
        { text: "Đóng", style: "cancel" },
        { text: "Đăng nhập", onPress: () => router.push("/(auth)/login-buyer") },
      ]);
      return;
    }

    if (!productId || !reason.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập lý do báo cáo và chọn sản phẩm!");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("product_id", productId as string);
    formData.append("reason", reason);
    
    imageUris.forEach((uri, index) => {
      const fileName = uri.split("/").pop() || `report_image_${Date.now()}_${index}.png`;
      formData.append("evidence_images", {
        uri,
        type: "image/png",
        name: fileName,
      } as any);
    });

    try {
      const response = await fetch(`${URL_CONNECT}/api/reports`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
        },
        body: formData,
      });

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (error) {
        throw new Error(`Dữ liệu trả về không phải JSON: ${text.slice(0, 300)}`);
      }

      if (!response.ok) {
        throw new Error(data.message || "Lỗi không xác định từ server");
      }

      Alert.alert("Thành công", data.message || "Báo cáo đã được gửi!");
      router.back();
    } catch (error: any) {
      console.error("API Error:", error);
      Alert.alert("Lỗi", "Gửi báo cáo thất bại: " + (error.message || "Vui lòng thử lại sau"));
    } finally {
      setLoading(false);
    }
  };

  if (!productId) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="#000" />
      </TouchableOpacity>

      <Text style={styles.title}>Báo cáo sản phẩm</Text>

      <Text style={styles.sectionTitle}>Lý do báo cáo</Text>
      <View style={styles.inputContainer}>
        <TextInput
          multiline
          numberOfLines={10}
          onChangeText={setReason}
          value={reason}
          placeholder="Nhập lý do báo cáo..."
          placeholderTextColor="#888"
          style={styles.textInput}
        />
      </View>

      <TouchableOpacity
        onPress={pickImage}
        style={styles.imageButton}
      >
        <Ionicons name="image-outline" size={20} color="white" />
        <Text style={styles.imageButtonText}>Chọn ảnh minh chứng</Text>
      </TouchableOpacity>

      {imageUris.map((uri, index) => (
        <View key={index} style={styles.imageContainer}>
          <Image source={{ uri }} style={styles.imagePreview} />
          <TouchableOpacity
            onPress={() => setImageUris(prev => prev.filter((_, i) => i !== index))}
            style={styles.deleteImageButton}
          >
            <Text style={styles.deleteImageButtonText}>Xóa ảnh</Text>
          </TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity
        onPress={handleSubmit}
        style={[styles.submitButton, loading && styles.disabledButton]}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Text style={styles.submitButtonText}>Gửi báo cáo</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    color: '#666',
    fontSize: 16,
  },
  backButton: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#333',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#444',
  },
  inputContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 24,
    padding: 12,
  },
  textInput: {
    minHeight: 200,
    textAlignVertical: 'top',
    fontSize: 16,
    color: '#333',
  },
  imageButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
  },
  imageContainer: {
    marginBottom: 24,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  deleteImageButton: {
    marginTop: 8,
    backgroundColor: '#ef4444',
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  deleteImageButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default Report;