import { View, Text, TouchableOpacity, Alert } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import "../global.css";
import InputCustoms from "@/components/ui/InputCustoms";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";

export default function RegisterSeller() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [fullNameError, setFullNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [phoneNumberError, setPhoneNumberError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const { register } = useAuth();
  const router = useRouter();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleRegister = async () => {
    let isValid = true;

    // Kiểm tra họ và tên
    if (!fullName) {
      setFullNameError("Họ và tên không được để trống");
      isValid = false;
    } else {
      setFullNameError("");
    }

    // Kiểm tra email
    if (!email) {
      setEmailError("Email không được để trống");
      isValid = false;
    } else if (!validateEmail(email)) {
      setEmailError("Email không đúng định dạng");
      isValid = false;
    } else {
      setEmailError("");
    }

    // Kiểm tra số điện thoại
    if (!phoneNumber) {
      setPhoneNumberError("Số điện thoại không được để trống");
      isValid = false;
    } else if (!/^\d{10,11}$/.test(phoneNumber)) {
      setPhoneNumberError("Số điện thoại không hợp lệ");
      isValid = false;
    } else {
      setPhoneNumberError("");
    }

    // Kiểm tra mật khẩu
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
        phone_number: phoneNumber,
        address,
        password,
        role: "seller",
      });
      Alert.alert("Thành công", "Đăng ký thành công! Vui lòng đăng nhập.");
      router.push("/login-seller");
    } catch (error: any) {
      Alert.alert("Lỗi", error.message);
    }
  };

  return (
    <View className="flex-1 bg-white justify-center items-center p-4">
      <Text className="text-2xl font-bold mb-6">Đăng ký - Người bán</Text>

      {/* Input Họ và tên */}
      <View className="w-full mb-4">
        <InputCustoms
          placeholder="Tên cửa hàng"
          value={fullName}
          onChangeText={(text) => {
            setFullName(text);
            if (!text) {
              setFullNameError("Họ và tên không được để trống");
            } else {
              setFullNameError("");
            }
          }}
          style={{
            borderColor: fullNameError ? "red" : fullName ? "green" : "#D1D5DB",
          }}
        />
        {fullNameError ? <Text className="text-red-500 mt-1">{fullNameError}</Text> : null}
      </View>

      {/* Input Email */}
      <View className="w-full mb-4">
        <InputCustoms
          placeholder="Email"
          value={email}
          onChangeText={(text) => {
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
          style={{
            borderColor: emailError ? "red" : email ? "green" : "#D1D5DB",
          }}
        />
        {emailError ? <Text className="text-red-500 mt-1">{emailError}</Text> : null}
      </View>

      {/* Input Số điện thoại */}
      <View className="w-full mb-4">
        <InputCustoms
          placeholder="Số điện thoại"
          value={phoneNumber}
          onChangeText={(text) => {
            setPhoneNumber(text);
            if (!text) {
              setPhoneNumberError("Số điện thoại không được để trống");
            } else if (!/^\d{10,11}$/.test(text)) {
              setPhoneNumberError("Số điện thoại không hợp lệ");
            } else {
              setPhoneNumberError("");
            }
          }}
          keyboardType="phone-pad"
          style={{
            borderColor: phoneNumberError ? "red" : phoneNumber ? "green" : "#D1D5DB",
          }}
        />
        {phoneNumberError ? <Text className="text-red-500 mt-1">{phoneNumberError}</Text> : null}
      </View>

      {/* Input Địa chỉ */}
      <View className="w-full mb-4">
        <InputCustoms
          placeholder="Địa chỉ"
          value={address}
          onChangeText={setAddress}
          style={{
            borderColor: address ? "green" : "#D1D5DB",
          }}
        />
      </View>

      {/* Input Mật khẩu */}
      <View className="w-full mb-4 relative">
        <InputCustoms
          placeholder="Mật khẩu"
          value={password}
          onChangeText={(text) => {
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
          style={{
            borderColor: passwordError ? "red" : password ? "green" : "#D1D5DB",
          }}
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

      {/* Nút Đăng ký */}
      <TouchableOpacity className="bg-green-500 py-3 px-6 rounded-lg" onPress={handleRegister}>
        <Text className="text-white text-lg font-semibold">Đăng ký</Text>
      </TouchableOpacity>

      {/* Nút Đăng nhập */}
      <TouchableOpacity className="mt-4" onPress={() => router.push("/login-seller")}>
        <Text className="text-blue-500">Đã có tài khoản? Đăng nhập</Text>
      </TouchableOpacity>
    </View>
  );
}