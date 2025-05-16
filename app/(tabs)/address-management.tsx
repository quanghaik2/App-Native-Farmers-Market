import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  FlatList,
  ScrollView,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { createAddress, getUserAddresses, setDefaultAddress, deleteAddress } from "../../lib/api/auth";
import { Picker } from "@react-native-picker/picker";
import addressData from "../../lib/constants/address.json";
import Icon from 'react-native-vector-icons/MaterialIcons';

// --- Interfaces ---
interface Address {
  id: number;
  full_name: string;
  phone_number: string;
  province: string;
  district: string;
  ward: string;
  detailed_address: string;
  is_default: boolean | number;
}

interface NewAddress {
  full_name: string;
  phone_number: string;
  province: string;
  district: string;
  ward: string;
  detailed_address: string;
  is_default: boolean;
}

// --- Address Data Types ---
type ProvinceData = Record<string, Record<string, string[]>>;
const typedAddressData: ProvinceData = addressData;

// --- Component ---
export default function AddressManagement(): JSX.Element {
  const { user, token } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [newAddress, setNewAddress] = useState<NewAddress>({
    full_name: "",
    phone_number: "",
    province: "",
    district: "",
    ward: "",
    detailed_address: "",
    is_default: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof NewAddress, string>>>({});

  const router = useRouter();
  const params = useLocalSearchParams();

  // Memoize derived state
  const provinces = React.useMemo(() => Object.keys(typedAddressData), []);
  const districts = React.useMemo(() =>
    newAddress.province ? Object.keys(typedAddressData[newAddress.province] || {}) : [],
    [newAddress.province]
  );
  const wards = React.useMemo(() =>
    newAddress.province && newAddress.district
      ? typedAddressData[newAddress.province]?.[newAddress.district] || []
      : [],
    [newAddress.province, newAddress.district]
  );

  // --- API Calls ---
  const fetchAddresses = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setErrors({});
    try {
      const result = await getUserAddresses(token);
      const addressList = Array.isArray(result) ? result : [];
      const normalizedAddresses = addressList.map((addr) => ({
        ...addr,
        is_default: !!addr.is_default,
      }));
      setAddresses(normalizedAddresses);
    } catch (error: any) {
      Alert.alert("Lỗi", "Không thể tải danh sách địa chỉ.");
      console.error("Fetch addresses error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  // --- Form Validation ---
  const validateForm = (): boolean => {
    const currentErrors: Partial<Record<keyof NewAddress, string>> = {};
    let isValid = true;

    if (!newAddress.full_name.trim()) {
      currentErrors.full_name = "Vui lòng nhập họ tên";
      isValid = false;
    }
    if (!newAddress.phone_number.trim()) {
      currentErrors.phone_number = "Vui lòng nhập số điện thoại";
      isValid = false;
    } else if (!/^\d{10,}$/.test(newAddress.phone_number)) {
      currentErrors.phone_number = "Số điện thoại không hợp lệ (ít nhất 10 số)";
      isValid = false;
    }
    if (!newAddress.province) {
      currentErrors.province = "Vui lòng chọn tỉnh/thành phố";
      isValid = false;
    }
    if (!newAddress.district) {
      currentErrors.district = "Vui lòng chọn quận/huyện";
      isValid = false;
    }
    if (!newAddress.ward) {
      currentErrors.ward = "Vui lòng chọn phường/xã";
      isValid = false;
    }
    if (!newAddress.detailed_address.trim()) {
      currentErrors.detailed_address = "Vui lòng nhập địa chỉ chi tiết";
      isValid = false;
    }

    setErrors(currentErrors);
    return isValid;
  };

  // --- Event Handlers ---
  const handleInputChange = (field: keyof NewAddress, value: string) => {
    setNewAddress(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    if (field === 'province') {
      setNewAddress(prev => ({ ...prev, district: "", ward: ""}));
      if (errors.district) setErrors(prev => ({ ...prev, district: undefined }));
      if (errors.ward) setErrors(prev => ({ ...prev, ward: undefined }));
    } else if (field === 'district') {
      setNewAddress(prev => ({ ...prev, ward: ""}));
      if (errors.ward) setErrors(prev => ({ ...prev, ward: undefined }));
    }
  };

  const handleAddAddress = async () => {
    if (!validateForm() || !token) {
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await createAddress(token, newAddress);
      Alert.alert("Thành công", result.message);
      setNewAddress({
        full_name: "", phone_number: "", province: "", district: "",
        ward: "", detailed_address: "", is_default: false,
      });
      setErrors({});
      await fetchAddresses();
    } catch (error: any) {
      Alert.alert("Lỗi", "Thêm địa chỉ thất bại.");
      console.error("Add address error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetDefault = async (address_id: number) => {
    if (!token) return;
    try {
      await setDefaultAddress(token, address_id);
      Alert.alert("Thành công", "Đặt địa chỉ mặc định thành công!");
      await fetchAddresses();
      if (params.fromCheckout === "true") {
        router.back();
      }
    } catch (error: any) {
      Alert.alert("Lỗi", "Không thể đặt mặc định.");
      console.error("Set default error:", error);
    }
  };

  const handleDelete = (address_id: number) => {
    if (!token) return;
    Alert.alert("Xác nhận", "Bạn có chắc muốn xóa địa chỉ này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteAddress(token, address_id);
            Alert.alert("Thành công", "Xóa địa chỉ thành công!");
            await fetchAddresses();
          } catch (error: any) {
            Alert.alert("Lỗi", "Không thể xóa địa chỉ.");
            console.error("Delete address error:", error);
          }
        },
      },
    ]);
  };

  // --- Render Item for FlatList ---
  const renderAddressItem = ({ item }: { item: Address }) => (
    <View className="bg-white rounded-lg p-3.5 mb-3 border border-gray-200 shadow-sm">
      <View className="mb-2.5">
        <View className="flex-row justify-between items-center mb-1">
          <Text className="text-base font-semibold text-gray-800 flex-1 mr-2">
            {item.full_name || "N/A"}
          </Text>
          <Text className="text-sm text-gray-600">{item.phone_number || "N/A"}</Text>
        </View>
        <Text className="text-sm text-gray-500 leading-5">
          {item.detailed_address && item.ward && item.district && item.province
            ? `${item.detailed_address}, ${item.ward}, ${item.district}, ${item.province}`
            : "Địa chỉ không đầy đủ"}
        </Text>
        {!!item.is_default && (
          <View className="flex-row items-center bg-emerald-50 px-2 py-1 rounded-full mt-2 self-start">
            <Icon name="check-circle" size={14} color="#10B981" />
            <Text className="ml-1 text-emerald-700 text-xs font-medium">Mặc định</Text>
          </View>
        )}
      </View>
      <View className="flex-row justify-end items-center mt-2 border-t border-gray-100 pt-2.5">
        <TouchableOpacity
          className={`px-2.5 py-1.5 rounded-md flex-row items-center justify-center min-w-[90px] ${
            item.is_default ? 'bg-gray-300 opacity-70' : 'bg-blue-500 active:bg-blue-600'
          }`}
          onPress={() => !item.is_default && handleSetDefault(item.id)}
          disabled={!!item.is_default}
        >
          <Text className={`text-xs font-medium ${item.is_default ? 'text-gray-600' : 'text-white'}`}>
            {item.is_default ? "Đã mặc định" : "Đặt mặc định"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="p-1.5 rounded-md ml-2 bg-red-500 active:bg-red-600"
          onPress={() => handleDelete(item.id)}
        >
          <Icon name="delete" size={18} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );

  // --- Main Return ---
  return (
    <ScrollView className="flex-1 bg-gray-50" keyboardShouldPersistTaps="handled">
      <Text className="text-2xl font-bold text-emerald-600 mb-4 px-4 pt-4">
        Quản lý địa chỉ
      </Text>

      {/* Add Address Form */}
      <View className="bg-white p-4 mx-4 rounded-lg mb-5 shadow-sm">
        <Text className="text-lg font-semibold text-gray-800 mb-3">Thêm địa chỉ mới</Text>

        {/* Full Name Input */}
        <View className="mb-3">
          <Text className="text-sm font-medium text-gray-700 mb-1">Họ và tên</Text>
          <TextInput
            className={`border rounded-lg px-3.5 py-4 mb-1 text-base ${errors.full_name ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-gray-50'}`}
            placeholder="Nhập họ và tên"
            placeholderTextColor="#9CA3AF"
            value={newAddress.full_name}
            onChangeText={(text) => handleInputChange('full_name', text)}
          />
          {errors.full_name && <Text className="text-red-500 text-xs">{errors.full_name}</Text>}
        </View>

        {/* Phone Number Input */}
        <View className="mb-3">
          <Text className="text-sm font-medium text-gray-700 mb-1">Số điện thoại</Text>
          <TextInput
            className={`border rounded-lg px-3.5 py-4 mb-1 text-base ${errors.phone_number ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-gray-50'}`}
            placeholder="Nhập số điện thoại"
            placeholderTextColor="#9CA3AF"
            value={newAddress.phone_number}
            onChangeText={(text) => handleInputChange('phone_number', text)}
            keyboardType="phone-pad"
          />
          {errors.phone_number && <Text className="text-red-500 text-xs">{errors.phone_number}</Text>}
        </View>

        {/* Province Picker */}
        <View className="mb-3">
          <Text className="text-sm font-medium text-gray-700 mb-1">Tỉnh/Thành phố</Text>
          <View className={`border rounded-lg mb-1 justify-center ${errors.province ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-gray-50'}`}>
            <Picker
              selectedValue={newAddress.province}
              onValueChange={(value) => value && handleInputChange('province', value)}
              style={{ height: Platform.OS === 'ios' ? 140 : 60 }}
              itemStyle={{ fontSize: 16 }}
            >
              <Picker.Item label="-- Chọn tỉnh/thành phố --" value="" color="#9CA3AF" />
              {provinces.map((province) => (
                <Picker.Item key={province} label={province} value={province} />
              ))}
            </Picker>
          </View>
          {errors.province && <Text className="text-red-500 text-xs">{errors.province}</Text>}
        </View>

        {/* District Picker */}
        <View className="mb-3">
          <Text className="text-sm font-medium text-gray-700 mb-1">Quận/Huyện</Text>
          <View className={`border rounded-lg mb-1 justify-center ${errors.district ? 'border-red-500 bg-red-50' : 'border-gray-300'} ${!newAddress.province ? 'bg-gray-200' : 'bg-gray-50'}`}>
            <Picker
              selectedValue={newAddress.district}
              onValueChange={(value) => value && handleInputChange('district', value)}
              enabled={!!newAddress.province}
              style={{ height: Platform.OS === 'ios' ? 140 : 60 }}
              itemStyle={{ fontSize: 16 }}
            >
              <Picker.Item label="-- Chọn quận/huyện --" value="" color="#9CA3AF" />
              {districts.map((district) => (
                <Picker.Item key={district} label={district} value={district} />
              ))}
            </Picker>
          </View>
          {errors.district && <Text className="text-red-500 text-xs">{errors.district}</Text>}
        </View>

        {/* Ward Picker */}
        <View className="mb-3">
          <Text className="text-sm font-medium text-gray-700 mb-1">Phường/Xã</Text>
          <View className={`border rounded-lg mb-1 justify-center ${errors.ward ? 'border-red-500 bg-red-50' : 'border-gray-300'} ${!newAddress.district ? 'bg-gray-200' : 'bg-gray-50'}`}>
            <Picker
              selectedValue={newAddress.ward}
              onValueChange={(value) => value && handleInputChange('ward', value)}
              enabled={!!newAddress.district}
              style={{ height: Platform.OS === 'ios' ? 140 : 60 }}
              itemStyle={{ fontSize: 16 }}
            >
              <Picker.Item label="-- Chọn phường/xã --" value="" color="#9CA3AF"/>
              {wards.map((ward) => (
                <Picker.Item key={ward} label={ward} value={ward} />
              ))}
            </Picker>
          </View>
          {errors.ward && <Text className="text-red-500 text-xs">{errors.ward}</Text>}
        </View>

        {/* Detailed Address Input */}
        <View className="mb-3">
          <Text className="text-sm font-medium text-gray-700 mb-1">Địa chỉ chi tiết</Text>
          <TextInput
            className={`border rounded-lg px-3.5 py-4 mb-1 text-base ${errors.detailed_address ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-gray-50'}`}
            placeholder="Nhập số nhà, tên đường..."
            placeholderTextColor="#9CA3AF"
            value={newAddress.detailed_address}
            onChangeText={(text) => handleInputChange('detailed_address', text)}
          />
          {errors.detailed_address && <Text className="text-red-500 text-xs">{errors.detailed_address}</Text>}
        </View>

        <TouchableOpacity
          className={`py-3.5 rounded-lg items-center mt-2 ${isSubmitting ? 'bg-gray-400' : 'bg-emerald-500 active:bg-emerald-600'}`}
          onPress={handleAddAddress}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text className="text-white text-base font-bold">Thêm địa chỉ</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Saved Addresses List */}
      <View className="px-4 mb-5">
        <Text className="text-lg font-semibold text-gray-800 mb-3">Địa chỉ đã lưu</Text>
        {isLoading ? (
          <ActivityIndicator size="large" color="#10B981" className="mt-5" />
        ) : (
          <FlatList
            data={addresses}
            renderItem={renderAddressItem}
            keyExtractor={(item) => item.id.toString()}
            ListEmptyComponent={
              <View className="items-center mt-10 px-8">
                <Icon name="location-off" size={50} color="#9CA3AF" />
                <Text className="mt-4 text-base text-gray-500 text-center">
                  Chưa có địa chỉ nào được lưu.
                </Text>
              </View>
            }
            scrollEnabled={false}
          />
        )}
      </View>
    </ScrollView>
  );
}