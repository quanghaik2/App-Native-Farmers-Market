import { View, Image, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import "./global.css";
import { URL_CONNECT } from "@/lib/constants";

export default function Index() {
  const router = useRouter();
  const { user, token, isLoading } = useAuth(); // Sử dụng isLoading từ AuthContext

  useEffect(() => {
    const checkUser = async () => {
      try {
        console.log({ user, token });

        // Nếu không có user hoặc token, điều hướng đến select-role
        if (!user || !token) {
          console.log("Không tìm thấy user hoặc token, điều hướng đến select-role");
          router.replace("/select-role");
          return;
        }

        // Kiểm tra vai trò và điều hướng
        switch (user.role) {
          case "buyer":
            console.log("Điều hướng đến trang home của người mua");
            router.replace("/home");
            break;
          case "seller":
            console.log("Điều hướng đến trang home của người bán");
            router.replace("/(seller)/SellerHome");
            break;
          default:
            console.warn("Vai trò không hợp lệ:", {
              role: user.role,
              user: JSON.stringify(user),
            });
            router.replace("/select-role");
            break;
        }
      } catch (error) {
        console.error("Lỗi khi kiểm tra user:", error);
        router.replace("/select-role");
      }
    };

    // Chỉ gọi checkUser khi AuthContext đã load xong
    if (!isLoading) {
      checkUser();
    }
  }, [user, token, router, isLoading]); // Thêm isLoading vào dependency array

  if (isLoading) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white justify-center items-center">
      {/* Hiển thị logo */}
      <Image
        source={require("../assets/images/logoApp.jpeg")}
        style={{ width: 150, height: 150 }}
        resizeMode="contain"
      />
    </View>
  );
}