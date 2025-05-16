import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { callApi } from "@/lib/api/auth";
import { URL_CONNECT } from "@/lib/constants";
import { disconnectSocket, initializeSocket } from "@/lib/constants/websocket";


interface User {
  id: string;
  email: string;
  role: "buyer" | "seller";
  full_name?: string;
  phone_number?: string;
  avatar_url?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  cartItemCount: number;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: {
    full_name: string;
    email: string;
    password: string;
    role: "buyer" | "seller";
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  setCartItemCount: (count: number) => void;
  setAuthData: (user: any, token: string, refreshToken: string) => Promise<void>;
  fetchCartCount: () => Promise<void>;
  setToken: (token: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [cartItemCount, setCartItemCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  // Khởi tạo WebSocket khi có token và user
  useEffect(() => {
    if (token && user) {
      initializeSocket(token, user.id);
    }
    return () => {
      disconnectSocket();
    };
  }, [token, user]);

  // Đồng bộ giỏ hàng khi token thay đổi
  useEffect(() => {
    if (token && user?.role === "buyer") {
      fetchCartCount();
    } else {
      setCartItemCount(0);
    }
  }, [token, user]);

  useEffect(() => {
    const loadStorageData = async () => {
      try {
        setIsLoading(true);
        const storedToken = await AsyncStorage.getItem("token");
        const storedRefreshToken = await AsyncStorage.getItem("refreshToken");
        const storedUser = await AsyncStorage.getItem("user");
        if (storedToken && storedRefreshToken && storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setToken(storedToken);
          setRefreshToken(storedRefreshToken);
          setUser(parsedUser);
          // Chỉ lấy số lượng giỏ hàng nếu người dùng là buyer
          if (storedToken && parsedUser.role === "buyer") {
            await fetchCartCount(storedToken);
          } else {
            setCartItemCount(0);
          }
        }
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu từ AsyncStorage:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadStorageData();
  }, []);

  // Đăng nhập
  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await callApi(`${URL_CONNECT}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (response.accessToken && response.refreshToken && response.user) {
        // Xóa dữ liệu cũ
        await AsyncStorage.multiRemove(["token", "refreshToken", "user"]);
        // Lưu dữ liệu mới
        await AsyncStorage.multiSet([
          ["token", response.accessToken],
          ["refreshToken", response.refreshToken],
          ["user", JSON.stringify(response.user)],
        ]);
        // Kiểm tra dữ liệu đã lưu
        const storedToken = await AsyncStorage.getItem("token");
        const storedRefreshToken = await AsyncStorage.getItem("refreshToken");
        console.log("Lưu token vào AsyncStorage:", {
          accessToken: storedToken,
          refreshToken: storedRefreshToken,
          user: response.user,
        });
        if (storedToken !== response.accessToken || storedRefreshToken !== response.refreshToken) {
          throw new Error("Lỗi lưu token vào AsyncStorage!");
        }
        setToken(response.accessToken);
        setRefreshToken(response.refreshToken);
        setUser(response.user);
        if (response.user.role === "buyer") {
          await fetchCartCount(response.accessToken);
          router.replace("/home");
        } else if (response.user.role === "seller") {
          setCartItemCount(0);
          router.replace("/(seller)/SellerHome");
        }
      } else {
        throw new Error(response.message || "Đăng nhập thất bại!");
      }
    } catch (error: any) {
      console.error("Lỗi đăng nhập:", error.message);
      throw new Error(error.message || "Không thể đăng nhập. Vui lòng thử lại!");
    } finally {
      setIsLoading(false);
    }
  };

  // Đăng ký
  const register = async (userData: {
    full_name: string;
    email: string;
    password: string;
    role: "buyer" | "seller";
  }) => {
    try {
      setIsLoading(true);
      const response = await callApi(`${URL_CONNECT}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      if (response.message === "Đăng ký thành công!") {
        // Tự động đăng nhập sau khi đăng ký
        await login(userData.email, userData.password);
      } else {
        throw new Error(response.message || "Đăng ký thất bại!");
      }
    } catch (error: any) {
      console.error("Lỗi đăng ký:", error);
      throw new Error(error.message || "Không thể đăng ký. Vui lòng thử lại!");
    } finally {
      setIsLoading(false);
    }
  };

  // Đăng xuất
  const logout = async () => {
    try {
      setIsLoading(true);
      setUser(null);
      setToken(null);
      setRefreshToken(null);
      setCartItemCount(0); // Đặt lại cartItemCount
      disconnectSocket(); // Ngắt kết nối WebSocket
      await AsyncStorage.clear(); // Xóa toàn bộ AsyncStorage để đảm bảo không còn dữ liệu cũ
      router.replace("/(auth)/select-role");
    } catch (error: any) {
      console.error("Lỗi đăng xuất:", error);
      throw new Error("Không thể đăng xuất. Vui lòng thử lại!");
    } finally {
      setIsLoading(false);
    }
  };

  // Làm mới token
  const refreshAccessToken = async () => {
    if (!refreshToken) {
      throw new Error("Không có refresh token!");
    }
    try {
      setIsLoading(true);
      const response = await callApi(`${URL_CONNECT}/api/auth/refresh-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.accessToken) {
        await AsyncStorage.setItem("token", response.accessToken);
        setToken(response.accessToken);
        return response.accessToken;
      } else {
        throw new Error("Không thể làm mới token!");
      }
    } catch (error: any) {
      console.error("Lỗi khi làm mới token:", error);
      // Nếu làm mới token thất bại, đăng xuất người dùng
      await logout();
      throw new Error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại!");
    } finally {
      setIsLoading(false);
    }
  };

  // Cập nhật thông tin người dùng
  const updateUser = async (userData: Partial<User>) => {
    try {
      setIsLoading(true);
      if (!user || !token) {
        throw new Error("Người dùng chưa đăng nhập!");
      }

      const response = await callApi(`${URL_CONNECT}/api/users/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(userData),
      });

      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
    } catch (error: any) {
      console.error("Lỗi khi cập nhật thông tin người dùng:", error);
      throw new Error(
        error.message || "Không thể cập nhật thông tin. Vui lòng thử lại!"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Hàm mới để cập nhật trạng thái mà không gọi API
  const setAuthData = async (user: any, token: string, refreshToken: string) => {
    try {
      setIsLoading(true);
      await AsyncStorage.setItem("token", token);
      await AsyncStorage.setItem("refreshToken", refreshToken);
      await AsyncStorage.setItem("user", JSON.stringify(user));
      setToken(token);
      setRefreshToken(refreshToken);
      setUser(user);
    } catch (error: any) {
      throw new Error("Lỗi khi lưu dữ liệu admin: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Lấy số lượng giỏ hàng
  const fetchCartCount = async (authToken: string = token) => {
    if (!authToken) return;
    try {
      const result = await callApi(
        `${URL_CONNECT}/api/cart`,
        { method: "GET", headers: { Authorization: `Bearer ${authToken}` } },
        authToken
      );
      setCartItemCount(result?.length || 0);
    } catch (error: any) {
      console.error("Lỗi khi lấy số lượng giỏ hàng:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        refreshToken,
        cartItemCount,
        isLoading,
        setToken,
        login,
        register,
        logout,
        refreshAccessToken,
        updateUser,
        setCartItemCount,
        setAuthData,
        fetchCartCount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}