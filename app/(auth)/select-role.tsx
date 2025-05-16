import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import RoleButton from "../../components/auth/RoleButton";
import "../global.css";

export default function SelectRole() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-white justify-center items-center p-4">
      <Text className="text-2xl font-bold mb-8">Bạn là ai?</Text>

      {/* Nút Người mua hàng */}
      <TouchableOpacity
        className="bg-white border-2 border-blue-500 py-4 px-12 rounded-lg mb-4 active:bg-blue-500 flex justify-center items-center"
        onPress={() => router.push("/login-buyer")}
      >
        <Text className="text-blue-500 text-lg font-semibold active:text-white">
          Người mua hàng
        </Text>
      </TouchableOpacity>


      {/* Nút Người bán hàng */}
      <TouchableOpacity
        className="bg-white border-2 border-green-500 py-4 px-12 rounded-lg mb-4 active:bg-green-500 flex justify-center items-center"
        onPress={() => router.push("/login-seller")}
      >
        <Text className="text-green-500 text-lg font-semibold active:text-white">
          Người bán hàng
        </Text>
      </TouchableOpacity>

      {/* Đăng ký */}
      {/* <View className="mt-6 items-center">
        <Text className="text-gray-600">Chưa có tài khoản?</Text>
        <View className="flex-row mt-2 space-x-4">
          <RoleButton
            title="Đăng ký người mua"
            color="#1E90FF"
            onPress={() => router.push("/register-buyer")}
          />
          <RoleButton
            title="Đăng ký người bán"
            color="#2ECC71"
            onPress={() => router.push("/register-seller")}
          />
        </View>
      </View> */}
    </View>
  );
}