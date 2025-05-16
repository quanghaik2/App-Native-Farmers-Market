import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Platform,
} from "react-native";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { Avatar } from "react-native-elements";
import { useAuth } from "../../context/AuthContext";
import { callApi, updateProfile, uploadAvatar } from "../../lib/api/auth";
import { URL_CONNECT } from "../../lib/constants";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

interface Profile {
  full_name: string;
  phone_number: string;
  avatar_url: string;
}

const PLACEHOLDER_AVATAR = "https://via.placeholder.com/150";

export default function BuyerProfile() {
  const { user, token, logout } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<Profile>({
    full_name: "",
    phone_number: "",
    avatar_url: "",
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [avatarCacheBuster, setAvatarCacheBuster] = useState<string>(
    Date.now().toString()
  );

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    if (token) {
      try {
        const result = await callApi(
          `${URL_CONNECT}/api/auth/profile`,
          { method: "GET" },
          token
        );
        setProfile({
          full_name: result.full_name || "",
          phone_number: result.phone_number || "",
          avatar_url: result.avatar_url || "",
        });
        setAvatarCacheBuster(Date.now().toString());
      } catch (error: any) {
        Alert.alert(
          "Lỗi",
          "Không thể lấy thông tin người dùng: " + (error.message || "Lỗi không xác định")
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
  }, [token, logout]);

  const handleUpdateProfile = async () => {
    if (!profile.full_name || !profile.phone_number) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ họ tên và số điện thoại.");
      return;
    }
    setIsUpdating(true);
    try {
      const { full_name, phone_number } = profile;
      const result = await updateProfile(token!, { full_name, phone_number });
      Alert.alert("Thông báo", result.message || "Cập nhật hồ sơ thành công!");
    } catch (error: any) {
      Alert.alert("Lỗi", "Cập nhật hồ sơ thất bại: " + (error.message || "Lỗi không xác định"));
      if (error.message === "Không thể làm mới token!") {
        await logout();
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Lỗi", "Bạn cần cấp quyền để truy cập thư viện ảnh!");
      return;
    }

    setIsUploading(true);

    try {
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

        const fileExtension = manipulatedImage.uri.split(".").pop()?.toLowerCase() || 'jpg';
        const mimeType = `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}`;
        const fileName = `avatar_${user?.id}_${Date.now()}.${fileExtension}`;

        const formData = new FormData();
        formData.append("avatar", {
          uri: manipulatedImage.uri,
          type: mimeType,
          name: fileName,
        } as any);

        const response = await uploadAvatar(token!, formData);

        if (response.avatar_url) {
          setProfile((prev) => ({ ...prev, avatar_url: response.avatar_url }));
          setAvatarCacheBuster(Date.now().toString());
          Alert.alert("Thành công", "Ảnh đại diện đã được cập nhật!");
        } else {
          Alert.alert("Lỗi", response.message || "Cập nhật ảnh đại diện thất bại.");
        }
      }
    } catch (error: any) {
      Alert.alert("Lỗi", "Đã xảy ra lỗi khi xử lý ảnh: " + (error.message || "Lỗi không xác định"));
      if (error.message === "Không thể làm mới token!") {
        await logout();
      }
    } finally {
      setIsUploading(false);
    }
  };

  const getAvatarUrl = () => {
    if (!profile.avatar_url) return PLACEHOLDER_AVATAR;
    const baseUrl = profile.avatar_url.startsWith('http') ? '' : URL_CONNECT;
    return `${baseUrl}${profile.avatar_url}?cache=${avatarCacheBuster}`;
  };

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-100">
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-gray-100"
      contentContainerStyle={{ paddingBottom: 30 }}
      showsVerticalScrollIndicator={false}
    >
      <View className="bg-green-100 h-[130px] rounded-b-3xl -mb-[60px]" />
      <View className="px-5">
        <View className="items-center mb-8 relative z-20">
          <Avatar
            rounded
            size={140}
            source={{ uri: getAvatarUrl() }}
            containerStyle={{
              backgroundColor: '#E5E7EB',
              borderWidth: 4,
              borderColor: 'white',
              elevation: 8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 6,
            }}
          />
          <TouchableOpacity
            className="absolute bottom-1 right-[30%] bg-gray-700 p-2.5 rounded-full border-2 border-white elevation-10 shadow-md"
            onPress={handlePickImage}
            disabled={isUploading}
            activeOpacity={0.7}
          >
            {isUploading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <MaterialCommunityIcons name="camera-plus" size={24} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>

        <View className="bg-white rounded-xl p-5 mb-6 z-10 shadow-md elevation-5">
          <Text className="text-xl font-semibold text-gray-700 mb-4">Thông tin cá nhân</Text>
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-500 mb-1 ml-1">Họ và tên</Text>
            <View className="flex-row items-center border-b border-gray-300 pb-2">
              <MaterialCommunityIcons name="account-outline" size={22} color="#6B7280" className="mr-3" />
              <TextInput
                className="flex-1 text-base text-gray-800 py-1"
                value={profile.full_name}
                onChangeText={(text) => setProfile({ ...profile, full_name: text })}
                placeholder="Nhập họ và tên"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="words"
              />
            </View>
          </View>
          <View className="mb-2">
            <Text className="text-sm font-medium text-gray-500 mb-1 ml-1">Số điện thoại</Text>
            <View className="flex-row items-center border-b border-gray-300 pb-2">
              <MaterialCommunityIcons name="phone-outline" size={22} color="#6B7280" className="mr-3" />
              <TextInput
                className="flex-1 text-base text-gray-800 py-1"
                value={profile.phone_number}
                onChangeText={(text) => setProfile({ ...profile, phone_number: text })}
                placeholder="Nhập số điện thoại"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
              />
            </View>
          </View>
        </View>

        <View className="bg-white rounded-xl py-2 px-1 mb-6 shadow-md elevation-5">
          <TouchableOpacity
            className="flex-row items-center justify-between py-3.5 px-4"
            onPress={() => router.push("/(buyer)/Orders")}
            activeOpacity={0.6}
          >
            <View className="flex-row items-center">
              <MaterialCommunityIcons name="clipboard-list-outline" size={24} color="#F59E0B" className="mr-4" />
              <Text className="text-base text-gray-700 font-medium">Danh sách đơn hàng</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#9CA3AF" />
          </TouchableOpacity>
          <View className="h-px bg-gray-200 mx-3" />
          <TouchableOpacity
            className="flex-row items-center justify-between py-3.5 px-4"
            onPress={() => router.push("/address-management")}
            activeOpacity={0.6}
          >
            <View className="flex-row items-center">
              <MaterialCommunityIcons name="map-marker-outline" size={24} color="#10B981" className="mr-4" />
              <Text className="text-base text-gray-700 font-medium">Quản lý địa chỉ</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          className="bg-blue-500 py-3.5 rounded-lg flex-row items-center justify-center mb-4 shadow-md elevation-4"
          onPress={handleUpdateProfile}
          disabled={isUpdating}
          activeOpacity={0.8}
        >
          {isUpdating ? (
            <ActivityIndicator size="small" color="#FFFFFF" className="mr-2" />
          ) : (
            <MaterialCommunityIcons name="check-circle-outline" size={20} color="#FFFFFF" className="mr-2" />
          )}
          <Text className="text-white text-base font-semibold">
            {isUpdating ? 'Đang cập nhật...' : 'Cập nhật hồ sơ'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-red-500 py-3.5 rounded-lg flex-row items-center justify-center shadow-md elevation-4"
          onPress={logout}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="logout" size={20} color="#FFFFFF" className="mr-2" />
          <Text className="text-white text-base font-semibold">Đăng xuất</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}