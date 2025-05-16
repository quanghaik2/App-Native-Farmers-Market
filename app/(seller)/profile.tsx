import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  Platform,
  StyleSheet,
} from "react-native";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { Avatar } from "react-native-elements";
import { useAuth } from "../../context/AuthContext";
import { callApi } from "../../lib/api/auth";
import { URL_CONNECT } from "@/lib/constants";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

interface Profile {
  full_name: string;
  phone_number: string;
  address: string;
  avatar_url: string;
}

const PLACEHOLDER_AVATAR = "https://via.placeholder.com/150";

export default function SellerProfile() {
  const { user, token, logout } = useAuth();
  const [profile, setProfile] = useState<Profile>({
    full_name: "",
    phone_number: "",
    address: "",
    avatar_url: "",
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [avatarCacheBuster, setAvatarCacheBuster] = useState<string>(Date.now().toString());
  const router = useRouter();

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    if (user?.id && token) {
      try {
        const result = await callApi(
          `${URL_CONNECT}/api/auth/profile`,
          { method: "GET" },
          token
        );
        setProfile({
          full_name: result.full_name || "",
          phone_number: result.phone_number || "",
          address: result.address || "",
          avatar_url: result.avatar_url || "",
        });
        setAvatarCacheBuster(Date.now().toString());
      } catch (error: any) {
        console.error("Lỗi khi lấy thông tin người bán:", error);
        Alert.alert(
          "Lỗi",
          "Không thể lấy thông tin người bán: " + error.message
        );
        if (error.message === "Không thể làm mới token!") {
          await logout();
        }
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, [token, user?.id, logout]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleUpdateProfile = async () => {
    setIsUpdating(true);
    try {
      const { full_name, phone_number, address } = profile;
      const result = await callApi(
        `${URL_CONNECT}/api/auth/update-profile`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ full_name, phone_number, address }),
        },
        token
      );
      Alert.alert("Thông báo", result.message || "Cập nhật hồ sơ thành công!");
      fetchProfile();
    } catch (error: any) {
      Alert.alert("Lỗi", "Cập nhật hồ sơ thất bại: " + error.message);
      if (error.message === "Không thể làm mới token!") {
        await logout();
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePickImage = async () => {
    setIsUploading(true);
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert("Lỗi", "Bạn cần cấp quyền để truy cập thư viện ảnh!");
        setIsUploading(false);
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        const manipulatedImage = await ImageManipulator.manipulateAsync(
          imageUri,
          [{ resize: { width: 300 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );
        const fileExtension = manipulatedImage.uri.split(".").pop()?.toLowerCase() || "jpg";
        const mimeType = `image/${fileExtension === "jpg" ? "jpeg" : fileExtension}`;
        const fileName = `avatar_${user?.id}_${Date.now()}.${fileExtension}`;
        const formData = new FormData();
        formData.append("avatar", {
          uri: manipulatedImage.uri,
          type: mimeType,
          name: fileName,
        } as any);
        const response = await callApi(
          `${URL_CONNECT}/api/auth/update-avatar`,
          { method: "PUT", body: formData },
          token
        );
        if (response.avatar_url) {
          setProfile((prevProfile) => ({
            ...prevProfile,
            avatar_url: response.avatar_url,
          }));
          setAvatarCacheBuster(Date.now().toString());
          Alert.alert("Thành công", "Ảnh đại diện đã được cập nhật!");
        } else {
          Alert.alert("Lỗi", response.message || "Không thể tải ảnh lên!");
        }
      }
    } catch (error: any) {
      console.error("Lỗi trong handlePickImage:", error);
      Alert.alert("Lỗi", "Đã xảy ra lỗi khi xử lý ảnh: " + error.message);
      if (error.message === "Không thể làm mới token!") {
        await logout();
      }
    } finally {
      setIsUploading(false);
    }
  };

  const getAvatarUrl = (): string => {
    if (!profile.avatar_url) return PLACEHOLDER_AVATAR;
    const baseUrl = profile.avatar_url.startsWith("http") ? "" : URL_CONNECT;
    return `${baseUrl}${profile.avatar_url}?cache=${avatarCacheBuster}`;
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Background View */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Cửa hàng {profile.full_name}</Text>
      </View>

      <View style={styles.content}>
        {/* Avatar Section */}
        <View style={styles.avatarContainer}>
          <Avatar
            rounded
            size={140}
            source={{ uri: getAvatarUrl() }}
            containerStyle={styles.avatar}
          />
          <TouchableOpacity
            style={styles.cameraButton}
            onPress={handlePickImage}
            disabled={isUploading}
          >
            {isUploading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <MaterialCommunityIcons name="camera-plus" size={24} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>

        {/* Profile Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Thông tin cửa hàng</Text>
          {/* Full Name Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Tên người bán / Cửa hàng</Text>
            <View style={styles.inputRow}>
              <MaterialCommunityIcons name="account-outline" size={22} color="#6B7280" style={styles.icon} />
              <TextInput
                style={styles.textInput}
                placeholder="Nhập tên"
                value={profile.full_name}
                onChangeText={(text: string) => setProfile({ ...profile, full_name: text })}
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>
          {/* Phone Number Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Số điện thoại liên hệ</Text>
            <View style={styles.inputRow}>
              <MaterialCommunityIcons name="phone-outline" size={22} color="#6B7280" style={styles.icon} />
              <TextInput
                style={styles.textInput}
                placeholder="Nhập số điện thoại"
                value={profile.phone_number}
                onChangeText={(text: string) => setProfile({ ...profile, phone_number: text })}
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
              />
            </View>
          </View>
          {/* Address Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Địa chỉ lấy hàng</Text>
            <View style={styles.inputRow}>
              <MaterialCommunityIcons name="map-marker-outline" size={22} color="#6B7280" style={styles.icon} />
              <TextInput
                style={styles.textInput}
                placeholder="Nhập địa chỉ"
                value={profile.address}
                onChangeText={(text: string) => setProfile({ ...profile, address: text })}
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>
        </View>

        {/* Actions Card */}
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push("/(seller)/ProductManagement")}
          >
            <View style={styles.actionContent}>
              <MaterialCommunityIcons name="store-edit-outline" size={24} color="#F59E0B" style={styles.icon} />
              <Text style={styles.actionText}>Quản lý sản phẩm</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Update Profile Button */}
        <TouchableOpacity
          style={styles.updateButton}
          onPress={handleUpdateProfile}
          disabled={isUpdating}
        >
          {isUpdating ? (
            <ActivityIndicator size="small" color="#FFFFFF" style={styles.buttonIcon} />
          ) : (
            <MaterialCommunityIcons name="check-circle-outline" size={20} color="#FFFFFF" style={styles.buttonIcon} />
          )}
          <Text style={styles.buttonText}>
            {isUpdating ? "Đang cập nhật..." : "Cập nhật hồ sơ"}
          </Text>
        </TouchableOpacity>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <MaterialCommunityIcons name="logout" size={20} color="#FFFFFF" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
  },
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  contentContainer: {
    paddingBottom: 30,
  },
  header: {
    backgroundColor: "#D1FAE5",
    alignItems: "center",
    height: 200,
    paddingTop: 40,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: -40,
  },
  headerText: {
    fontSize: 26,
    fontWeight: "600",
    color: "#065F46",
    marginTop: 8,
  },
  content: {
    padding: 20,
    paddingTop: 0,
  },
  avatarContainer: {
    alignItems: "center",
    marginTop: -64,
    marginBottom: 32,
  },
  avatar: {
    backgroundColor: "#E0E0E0",
    borderWidth: 4,
    borderColor: "#FFFFFF",
    elevation: 5,
  },
  cameraButton: {
    position: "absolute",
    bottom: 4,
    right: "30%",
    backgroundColor: "#4B5563",
    padding: 8,
    borderRadius: 9999,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    padding: 16,
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
    marginBottom: 4,
    marginLeft: 4,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#D1D5DB",
    paddingBottom: 8,
  },
  icon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: "#1F2937",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
  },
  actionContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionText: {
    fontSize: 16,
    color: "#374151",
    fontWeight: "500",
  },
  updateButton: {
    backgroundColor: "#3B82F6",
    paddingVertical: 12,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  logoutButton: {
    backgroundColor: "#EF4444",
    paddingVertical: 12,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonIcon: {
    marginRight: 8,
  },
});