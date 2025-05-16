import { View, Text, TouchableOpacity, Alert } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import InputCustoms from "@/components/ui/InputCustoms";
import "../global.css";
import { URL_CONNECT } from "@/lib/constants";

interface ForgotPasswordProps {}

const ForgotPassword: React.FC<ForgotPasswordProps> = () => {
  const [email, setEmail] = useState<string>("");
  const [otp, setOtp] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [otpToken, setOtpToken] = useState<string>("");
  const [emailError, setEmailError] = useState<string>("");
  const [otpError, setOtpError] = useState<string>("");
  const [newPasswordError, setNewPasswordError] = useState<string>("");
  const [step, setStep] = useState<"request" | "reset">("request");
  const router = useRouter();

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleRequestOTP = async () => {
    if (!email) {
      setEmailError("Email không được để trống");
      return;
    }
    if (!validateEmail(email)) {
      setEmailError("Email không đúng định dạng");
      return;
    }
    setEmailError("");

    try {
      const response = await fetch(`${URL_CONNECT}/api/auth/request-password-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (response.ok) {
        Alert.alert("Thành công", data.message);
        setOtpToken(data.otpToken); // Lưu otpToken
        setStep("reset");
      } else {
        Alert.alert("Lỗi", data.message);
      }
    } catch (error: any) {
      Alert.alert("Lỗi", "Không thể kết nối đến server!");
    }
  };

  const handleResetPassword = async () => {
    let isValid = true;

    if (!otp) {
      setOtpError("Mã OTP không được để trống");
      isValid = false;
    } else {
      setOtpError("");
    }

    if (!newPassword) {
      setNewPasswordError("Mật khẩu mới không được để trống");
      isValid = false;
    } else if (newPassword.length < 6) {
      setNewPasswordError("Mật khẩu phải có ít nhất 6 ký tự");
      isValid = false;
    } else {
      setNewPasswordError("");
    }

    if (!isValid) return;

    try {
      const response = await fetch(`${URL_CONNECT}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otpToken, otp, newPassword }),
      });
      const data = await response.json();
      if (response.ok) {
        Alert.alert("Thành công", data.message);
        router.push("/(auth)/select-role");
      } else {
        Alert.alert("Lỗi", data.message);
      }
    } catch (error: any) {
      Alert.alert("Lỗi", "Không thể kết nối đến server!");
    }
  };

  return (
    <View className="flex-1 bg-white justify-center items-center p-4">
      <Text className="text-2xl font-bold mb-6">Quên mật khẩu</Text>

      {step === "request" ? (
        <>
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
            {emailError ? (
              <Text className="text-red-500 mt-1">{emailError}</Text>
            ) : null}
          </View>

          <TouchableOpacity
            className="bg-blue-500 py-3 px-6 rounded-lg"
            onPress={handleRequestOTP}
          >
            <Text className="text-white text-lg font-semibold">Gửi mã OTP</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <View className="w-full mb-4">
            <InputCustoms
              placeholder="Mã OTP"
              value={otp}
              onChangeText={(text: string) => {
                setOtp(text);
                if (!text) {
                  setOtpError("Mã OTP không được để trống");
                } else {
                  setOtpError("");
                }
              }}
              keyboardType="numeric"
              error={!!otpError}
            />
            {otpError ? (
              <Text className="text-red-500 mt-1">{otpError}</Text>
            ) : null}
          </View>

          <View className="w-full mb-4">
            <InputCustoms
              placeholder="Mật khẩu mới"
              value={newPassword}
              onChangeText={(text: string) => {
                setNewPassword(text);
                if (!text) {
                  setNewPasswordError("Mật khẩu mới không được để trống");
                } else if (text.length < 6) {
                  setNewPasswordError("Mật khẩu phải có ít nhất 6 ký tự");
                } else {
                  setNewPasswordError("");
                }
              }}
              secureTextEntry
              error={!!newPasswordError}
            />
            {newPasswordError ? (
              <Text className="text-red-500 mt-1">{newPasswordError}</Text>
            ) : null}
          </View>

          <TouchableOpacity
            className="bg-blue-500 py-3 px-6 rounded-lg"
            onPress={handleResetPassword}
          >
            <Text className="text-white text-lg font-semibold">
              Đặt lại mật khẩu
            </Text>
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity
        className="mt-4"
        onPress={() => router.push("/(auth)/select-role")}
      >
        <Text className="text-blue-500">Quay lại</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ForgotPassword;