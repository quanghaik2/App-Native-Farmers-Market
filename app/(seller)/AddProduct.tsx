import { View, Text, Alert, ScrollView, Image, StyleSheet, Platform } from "react-native";
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { addProduct } from "../../lib/api/products";
import { getUserProfile } from "../../lib/api/auth";
import { getCategories } from "../../lib/api/categories";
import { Product, UserObject, Category } from "../../lib/constants/constants";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { URL_CONNECT } from "../../lib/constants";
import InputCustom from "@/components/ui/InputProduct";
import RoleButton from "@/components/auth/RoleButton";
import RNPickerSelect from "react-native-picker-select";
import addressData from "../../lib/constants/address.json";
import { Picker } from "@react-native-picker/picker";

// --- Address Data Types ---
type ProvinceData = Record<string, Record<string, string[]>>;
const typedAddressData: ProvinceData = addressData;

// --- Address State Interface ---
interface AddressState {
  province: string;
  district: string;
  ward: string;
}

export default function AddProduct() {
  const { user, token } = useAuth() as { user: UserObject; token: string };
  const [newProduct, setNewProduct] = useState<Product>({
    id: 0,
    name: "",
    store_name: "",
    price: 0,
    description: "",
    address: "",
    image_url: "",
    category_id: undefined,
  });
  const [imageUploaded, setImageUploaded] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const router = useRouter();

  // State cho địa chỉ
  const [addressState, setAddressState] = useState<AddressState>({
    province: "Tỉnh Thái Nguyên", // Mặc định là Thái Nguyên
    district: "",
    ward: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof AddressState, string>>>({});

  // Memoize derived state cho địa chỉ
  const provinces = Object.keys(typedAddressData);
  const districts = addressState.province ? Object.keys(typedAddressData[addressState.province] || {}) : [];
  const wards = addressState.province && addressState.district
    ? typedAddressData[addressState.province]?.[addressState.district] || []
    : [];

  // Ghép chuỗi địa chỉ và gán vào newProduct.address (bỏ detailed_address)
  useEffect(() => {
    const address = `${addressState.ward}, ${addressState.district}, ${addressState.province}`.trim();
    setNewProduct((prev) => ({ ...prev, address }));
  }, [addressState]);

  useEffect(() => {
    fetchProfile();
    fetchCategories();
  }, [token]);

  const fetchProfile = async () => {
    try {
      const profileData = await getUserProfile(token);
      setNewProduct((prev) => ({ ...prev, store_name: profileData.full_name }));
    } catch (error: any) {
      Alert.alert("Lỗi", "Không thể tải thông tin: " + error.message);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await getCategories(token);
      setCategories(data);
    } catch (error: any) {
      Alert.alert("Lỗi", "Không thể tải danh mục: " + error.message);
    }
  };

  const validateInputs = (product: Product) => {
    if (!product.name.trim()) {
      Alert.alert("Lỗi", "Tên sản phẩm không được để trống!");
      return false;
    }
    if (isNaN(product.price) || product.price < 1000) {
      Alert.alert("Lỗi", "Giá phải là số và lớn hơn hoặc bằng 1000!");
      return false;
    }
    if (!product.image_url) {
      Alert.alert("Lỗi", "Vui lòng tải ảnh sản phẩm!");
      return false;
    }
    if (!product.category_id) {
      Alert.alert("Lỗi", "Vui lòng chọn danh mục sản phẩm!");
      return false;
    }
    if (!product.address || !addressState.district || !addressState.ward) {
      Alert.alert("Lỗi", "Vui lòng chọn đầy đủ thông tin địa chỉ (Quận/Huyện và Phường/Xã)!");
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
        formData.append("product_image", {
          uri: manipulatedImage.uri,
          type: mimeType,
          name: `product_${Date.now()}.${fileExtension}`,
        } as any);

        const response = await fetch(`${URL_CONNECT}/api/products/upload-image`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        const data = await response.json();
        if (response.ok && data.image_url) {
          setNewProduct({ ...newProduct, image_url: data.image_url });
          setImageUploaded(true);
          Alert.alert("Thành công", "Ảnh sản phẩm đã được tải lên!");
        } else {
          Alert.alert("Lỗi", data.message || "Không thể tải ảnh lên!");
        }
      }
    } catch (error: any) {
      Alert.alert("Lỗi", "Đã xảy ra lỗi khi xử lý ảnh: " + error.message);
    }
  };

  const handleAddProduct = async () => {
    const productToAdd = { ...newProduct, seller_id: user.id };
    if (!validateInputs(productToAdd)) return;

    try {
      await addProduct(token, productToAdd);
      Alert.alert("Thành công", "Thêm sản phẩm thành công!");
      router.back();
    } catch (error: any) {
      Alert.alert("Lỗi", "Thêm sản phẩm thất bại: " + error.message);
    }
  };

  // Handler cho địa chỉ
  const handleAddressChange = (field: keyof AddressState, value: string) => {
    setAddressState((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (field === "district") {
      setAddressState((prev) => ({ ...prev, ward: "" }));
      if (errors.ward) setErrors((prev) => ({ ...prev, ward: undefined }));
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Thêm sản phẩm</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Tên sản phẩm</Text>
        <InputCustom
          placeholder="Tên sản phẩm"
          value={newProduct.name}
          onChangeText={(text) => setNewProduct({ ...newProduct, name: text })}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Tên cửa hàng</Text>
        <InputCustom
          placeholder="Tên cửa hàng"
          value={newProduct.store_name}
          onChangeText={() => {}} // Không cho chỉnh sửa
          editable={false}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Giá (VND)</Text>
        <InputCustom
          placeholder="Giá (VND)"
          value={newProduct.price.toString()}
          onChangeText={(text) => {
            const numericValue = parseInt(text.replace(/\D/g, ""), 10);
            setNewProduct({ ...newProduct, price: isNaN(numericValue) ? 0 : numericValue });
          }}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Mô tả sản phẩm</Text>
        <InputCustom
          placeholder="Mô tả sản phẩm"
          value={newProduct.description}
          onChangeText={(text) => setNewProduct({ ...newProduct, description: text })}
        />
      </View>

      {/* Phần địa chỉ mới (bỏ ô nhập địa chỉ chi tiết) */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Địa chỉ</Text>

        {/* Province Picker (Không cho phép sửa) */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tỉnh/Thành phố</Text>
          <View style={[styles.pickerContainer, errors.province ? styles.errorBorder : styles.normalBorder]}>
            <Picker
              selectedValue={addressState.province}
              onValueChange={() => {}} // Không cho phép thay đổi
              enabled={false} // Vô hiệu hóa Picker
              style={styles.picker}
              itemStyle={styles.pickerItem}
            >
              <Picker.Item label={addressState.province} value={addressState.province} />
            </Picker>
          </View>
          {errors.province && <Text style={styles.errorText}>{errors.province}</Text>}
        </View>

        {/* District Picker */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Quận/Huyện</Text>
          <View style={[styles.pickerContainer, errors.district ? styles.errorBorder : styles.normalBorder, !addressState.province ? styles.disabledBackground : {}]}>
            <Picker
              selectedValue={addressState.district}
              onValueChange={(value) => value && handleAddressChange('district', value)}
              enabled={!!addressState.province}
              style={styles.picker}
              itemStyle={styles.pickerItem}
            >
              <Picker.Item label="-- Chọn quận/huyện --" value="" color="#9CA3AF" />
              {districts.map((district) => (
                <Picker.Item key={district} label={district} value={district} />
              ))}
            </Picker>
          </View>
          {errors.district && <Text style={styles.errorText}>{errors.district}</Text>}
        </View>

        {/* Ward Picker */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phường/Xã</Text>
          <View style={[styles.pickerContainer, errors.ward ? styles.errorBorder : styles.normalBorder, !addressState.district ? styles.disabledBackground : {}]}>
            <Picker
              selectedValue={addressState.ward}
              onValueChange={(value) => value && handleAddressChange('ward', value)}
              enabled={!!addressState.district}
              style={styles.picker}
              itemStyle={styles.pickerItem}
            >
              <Picker.Item label="-- Chọn phường/xã --" value="" color="#9CA3AF"/>
              {wards.map((ward) => (
                <Picker.Item key={ward} label={ward} value={ward} />
              ))}
            </Picker>
          </View>
          {errors.ward && <Text style={styles.errorText}>{errors.ward}</Text>}
        </View>
      </View>

      {/* Dropdown chọn danh mục */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Danh mục sản phẩm</Text>
        <RNPickerSelect
          onValueChange={(value) =>
            setNewProduct({ ...newProduct, category_id: value })
          }
          items={categories.map((category) => ({
            label: category.name,
            value: category.id,
          }))}
          placeholder={{ label: "Chọn danh mục", value: null }}
          style={{
            inputIOS: {
              fontSize: 16,
              paddingVertical: 12,
              paddingHorizontal: 10,
              borderWidth: 1,
              borderColor: "gray",
              borderRadius: 4,
              color: "black",
              paddingRight: 30,
            },
            inputAndroid: {
              fontSize: 16,
              paddingHorizontal: 10,
              paddingVertical: 8,
              borderWidth: 0.5,
              borderColor: "gray",
              borderRadius: 8,
              color: "black",
              paddingRight: 30,
            },
          }}
        />
      </View>

      <View style={styles.inputGroup}>
        <RoleButton
          title="Chọn ảnh sản phẩm"
          onPress={handlePickImage}
          bgColor="green"
        />
      </View>

      {imageUploaded && newProduct.image_url && (
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Ảnh sản phẩm</Text>
          <Image
            source={{ uri: `${URL_CONNECT}${newProduct.image_url}` }}
            style={styles.previewImage}
          />
          <InputCustom
            placeholder="Đường dẫn ảnh"
            value={newProduct.image_url}
            onChangeText={() => {}} // Không cho chỉnh sửa
            editable={false}
          />
        </View>
      )}

      <RoleButton
        title="Thêm sản phẩm"
        onPress={handleAddProduct}
        disabled={!imageUploaded}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    paddingTop: 16,
    paddingLeft: 16,
    paddingRight: 16,
    paddingBottom: 100, // Đảm bảo đủ khoảng trống cho thanh Bottom Navigation
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#10B981",
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#374151",
    marginBottom: 4,
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginBottom: 8,
  },
  pickerContainer: {
    borderRadius: 8,
    marginBottom: 4,
    justifyContent: "center",
  },
  normalBorder: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "#F9FAFB",
  },
  errorBorder: {
    borderWidth: 1,
    borderColor: "#EF4444",
    backgroundColor: "#FEF2F2",
  },
  disabledBackground: {
    backgroundColor: "#E5E7EB",
  },
  picker: {
    height: Platform.OS === "ios" ? 140 : 60,
  },
  pickerItem: {
    fontSize: 16,
  },
  errorText: {
    color: "#EF4444",
    fontSize: 12,
  },
});