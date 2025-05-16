import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import "../global.css";
import InputCustoms from "@/components/ui/InputCustoms";

interface LoginBuyerProps {}

const LoginBuyer: React.FC<LoginBuyerProps> = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [emailError, setEmailError] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");
  const { login } = useAuth();
  const router = useRouter();

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLogin = async () => {
    let isValid = true;

    if (!email) {
      setEmailError("Email không được để trống");
      isValid = false;
    } else if (!validateEmail(email)) {
      setEmailError("Email không đúng định dạng");
      isValid = false;
    } else {
      setEmailError("");
    }

    if (!password) {
      setPasswordError("Mật khẩu không được để trống");
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError("Mật khẩu phải có ít nhất 6 ký tự");
      isValid = false;
    } else {
      setPasswordError("");
    }

    if (!isValid) return;

    try {
      const response: any = await login(email, password);
      console.log({response});
      // Kiểm tra role của người dùng
      if (response.user.role !== "buyer") {
        Alert.alert("Lỗi", "Tài khoản này không phải là người mua. Vui lòng sử dụng trang đăng nhập người bán!");
        return; // Dừng lại, không chuyển hướng
      }
      router.push("/home");
    } catch (error: any) {
      // Alert.alert("Lỗi", error.message);
      console.log(error.message);
    }
  };

  return (
    <View className="flex-1 bg-white justify-center items-center p-4">
      <Text className="text-2xl font-bold mb-6">Đăng nhập - Người mua</Text>

      {/* Input Email */}
      <View className="w-full mb-4">
        <InputCustoms
          placeholder="Email"
          value={email}
          onChangeText={(text: string) => {
            setEmail(text);
            if (!text) {
              setEmailError("Email không được để trống");
            } else if (!validateEmail(text)) {
              setEmailError("Email không đúng định dạng");
            } else {
              setEmailError("");
            }
          }}
          keyboardType="email-address"
          error={!!emailError}
        />
        {emailError ? <Text className="text-red-500 mt-1">{emailError}</Text> : null}
      </View>

      {/* Input Mật khẩu */}
      <View className="w-full mb-4 relative">
        <InputCustoms
          placeholder="Mật khẩu"
          value={password}
          onChangeText={(text: string) => {
            setPassword(text);
            if (!text) {
              setPasswordError("Mật khẩu không được để trống");
            } else if (text.length < 6) {
              setPasswordError("Mật khẩu phải có ít nhất 6 ký tự");
            } else {
              setPasswordError("");
            }
          }}
          secureTextEntry={!showPassword}
          error={!!passwordError}
        />
        <TouchableOpacity
          className="absolute right-4 top-4"
          onPress={() => setShowPassword(!showPassword)}
        >
          {showPassword ? (
            <MaterialIcons name="visibility-off" size={24} color="#A0A0A0" />
          ) : (
            <MaterialIcons name="visibility" size={24} color="#A0A0A0" />
          )}
        </TouchableOpacity>
        {passwordError ? <Text className="text-red-500 mt-1">{passwordError}</Text> : null}
      </View>

      {/* Nút Đăng nhập */}
      <TouchableOpacity className="bg-blue-500 py-3 px-6 rounded-lg" onPress={handleLogin}>
        <Text className="text-white text-lg font-semibold">Đăng nhập</Text>
      </TouchableOpacity>

      {/* Nút Đăng ký */}
      <TouchableOpacity className="mt-4" onPress={() => router.push("/register-buyer")}>
        <Text className="text-blue-500">Chưa có tài khoản? Đăng ký</Text>
      </TouchableOpacity>
    </View>
  );
};

export default LoginBuyer;