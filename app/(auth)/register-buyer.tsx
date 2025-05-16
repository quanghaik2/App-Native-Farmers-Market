import { View, Text, TouchableOpacity, Alert } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import "../global.css";
import InputCustoms from "@/components/ui/InputCustoms";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";

export default function RegisterBuyer() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [fullNameError, setFullNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const { register } = useAuth();
  const router = useRouter();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleRegister = async () => {
    let isValid = true;

    if (!fullName) {
      setFullNameError("Họ và tên không được để trống");
      isValid = false;
    } else {
      setFullNameError("");
    }

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
      await register({
        full_name: fullName,
        email,
        password,
        role: "buyer",
      });
      Alert.alert("Thành công", "Đăng ký thành công! Vui lòng đăng nhập.");
      router.push("/login-buyer");
    } catch (error: any) {
      Alert.alert("Lỗi", error.message);
    }
  };

  return (
    <View className="flex-1 bg-white justify-center items-center p-4">
      <Text className="text-2xl font-bold mb-6">Đăng ký - Người mua</Text>

      <View className="w-full mb-4">
        <InputCustoms
          placeholder="Họ và tên"
          value={fullName}
          onChangeText={(text) => {
            setFullName(text);
            if (!text) setFullNameError("Họ và tên không được để trống");
            else setFullNameError("");
          }}
          style={{ borderColor: fullNameError ? "red" : fullName ? "green" : "#D1D5DB" }}
        />
        {fullNameError ? <Text className="text-red-500 mt-1">{fullNameError}</Text> : null}
      </View>

      <View className="w-full mb-4">
        <InputCustoms
          placeholder="Email"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            if (!text) setEmailError("Email không được để trống");
            else if (!validateEmail(text)) setEmailError("Email không đúng định dạng");
            else setEmailError("");
          }}
          keyboardType="email-address"
          style={{ borderColor: emailError ? "red" : email ? "green" : "#D1D5DB" }}
        />
        {emailError ? <Text className="text-red-500 mt-1">{emailError}</Text> : null}
      </View>

      <View className="w-full mb-4 relative">
        <InputCustoms
          placeholder="Mật khẩu"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            if (!text) setPasswordError("Mật khẩu không được để trống");
            else if (text.length < 6) setPasswordError("Mật khẩu phải có ít nhất 6 ký tự");
            else setPasswordError("");
          }}
          secureTextEntry={!showPassword}
          style={{ borderColor: passwordError ? "red" : password ? "green" : "#D1D5DB" }}
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

      <TouchableOpacity className="bg-blue-500 py-3 px-6 rounded-lg" onPress={handleRegister}>
        <Text className="text-white text-lg font-semibold">Đăng ký</Text>
      </TouchableOpacity>

      <TouchableOpacity className="mt-4" onPress={() => router.push("/login-buyer")}>
        <Text className="text-blue-500">Đã có tài khoản? Đăng nhập</Text>
      </TouchableOpacity>
    </View>
  );
}