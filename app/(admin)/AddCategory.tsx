import { View, Text, Alert, ScrollView, Image } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { callApi } from "@/lib/api/auth";
import { URL_CONNECT } from "../../lib/constants";
import { Category, UserObject } from "../../lib/constants/constants";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import InputCustom from "@/components/ui/InputProduct";
import RoleButton from "@/components/auth/RoleButton";

export default function AddCategory() {
  const { user, token } = useAuth() as { user: UserObject; token: string };
  const [newCategory, setNewCategory] = useState<Category>({
    id: 0,
    name: "",
    image_url: "",
  });
  const [imageUploaded, setImageUploaded] = useState(false);
  const router = useRouter();

  const validateInputs = (category: Category) => {
    if (!category.name.trim()) {
      Alert.alert("Lỗi", "Tên danh mục không được để trống!");
      return false;
    }
    if (!category.image_url) {
      Alert.alert("Lỗi", "Vui lòng tải ảnh danh mục!");
      return false;
    }
    return true;
  };

  const handlePickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert("Lỗi", "Bạn cần cấp quyền để truy cập thư viện ảnh!");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        const manipulatedImage = await ImageManipulator.manipulateAsync(
          imageUri,
          [{ resize: { width: 300, height: 300 } }],
          { compress: 0.8 }
        );

        const fileExtension = manipulatedImage.uri.split(".").pop().toLowerCase();
        const mimeType = {
          jpg: "image/jpeg",
          jpeg: "image/jpeg",
          png: "image/png",
        }[fileExtension] || "image/jpeg";

        const formData = new FormData();
        formData.append("category_image", {
          uri: manipulatedImage.uri,
          type: mimeType,
          name: `category_${Date.now()}.${fileExtension}`,
        } as any);

        const response = await fetch(`${URL_CONNECT}/api/categories/upload-image`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        const data = await response.json();
        if (response.ok && data.image_url) {
          setNewCategory({ ...newCategory, image_url: data.image_url });
          setImageUploaded(true);
          Alert.alert("Thành công", "Ảnh danh mục đã được tải lên!");
        } else {
          Alert.alert("Lỗi", data.message || "Không thể tải ảnh lên!");
        }
      }
    } catch (error: any) {
      Alert.alert("Lỗi", "Đã xảy ra lỗi khi xử lý ảnh: " + error.message);
    }
  };

  const handleAddCategory = async () => {
    if (!validateInputs(newCategory)) return;

    try {
      await callApi(
        `${URL_CONNECT}/api/categories`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newCategory),
        },
        token
      );
      Alert.alert("Thành công", "Thêm danh mục thành công!");
      router.back();
    } catch (error: any) {
      Alert.alert("Lỗi", "Thêm danh mục thất bại: " + error.message);
    }
  };

  return (
    <ScrollView className="bg-white pt-4 px-4 pb-24">
      <Text className="text-2xl font-bold text-green-600 mb-4">Thêm danh mục</Text>

      <View className="mb-4">
        <Text className="text-sm font-bold text-gray-700 mb-1">Tên danh mục</Text>
        <InputCustom
          placeholder="Tên danh mục"
          value={newCategory.name}
          onChangeText={(text) => setNewCategory({ ...newCategory, name: text })}
        />
      </View>

      <View className="mb-4">
        <RoleButton
          title="Chọn ảnh danh mục"
          onPress={handlePickImage}
          bgColor="green"
        />
      </View>

      {imageUploaded && newCategory.image_url && (
        <View className="mb-4">
          <Text className="text-sm font-bold text-gray-700 mb-1">Ảnh danh mục</Text>
          <Image
            source={{ uri: `${URL_CONNECT}${newCategory.image_url}` }}
            className="w-24 h-24 rounded-lg mb-2"
          />
          <InputCustom
            placeholder="Đường dẫn ảnh"
            value={newCategory.image_url}
            onChangeText={() => {}}
            editable={false}
          />
        </View>
      )}

      <RoleButton
        title="Thêm danh mục"
        onPress={handleAddCategory}
      />
    </ScrollView>
  );
}