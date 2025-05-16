import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Modal,
  Alert,
  TextInput,
} from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { Picker } from "@react-native-picker/picker";
import Toast from "react-native-toast-message";
import { useAuth } from "../../context/AuthContext";
import { callApi } from "../../lib/api/auth";
import { URL_CONNECT } from "../../lib/constants";
import { getSocket } from "@/lib/constants/websocket";
import { formatPrice } from "@/lib/utils";

interface OrderItem {
  id: number;
  product_id: number;
  name: string;
  quantity: number;
  price_at_time: number;
  store_name: string;
}

interface Order {
  id: number;
  user_id: number;
  total_amount: number;
  original_amount: number;
  shipping_fee: number;
  address: string;
  status: string;
  created_at: string;
  items: OrderItem[];
  cancellation_requested: boolean;
  cancellation_reason?: string;
}

const statusSteps = [
  { label: "Tất cả", value: "all", icon: "list" },
  { label: "Đơn Hàng Đã Đặt", value: "pending", icon: "cart" },
  { label: "Đã Xác Nhận Đơn Hàng", value: "confirmed", icon: "check-circle" },
  { label: "Hàng Đang Được Giao", value: "shipped", icon: "truck" },
  { label: "Giao Hàng Thành Công", value: "delivered", icon: "account-check" },
  { label: "Đơn Hàng Đã Hủy", value: "cancelled", icon: "close-circle" },
];

const statusColors: { [key: string]: string } = {
  pending: "bg-yellow-100 border-yellow-500",
  confirmed: "bg-blue-100 border-blue-500",
  shipped: "bg-orange-100 border-orange-500",
  delivered: "bg-green-100 border-green-500",
  cancelled: "bg-red-100 border-red-500",
};

const OrderManagement: React.FC = () => {
  const { token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  // Khởi tạo newStatus với chuỗi rỗng hoặc giá trị mặc định an toàn
  const [newStatus, setNewStatus] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [showDenyModal, setShowDenyModal] = useState(false);
  const [denyReason, setDenyReason] = useState("");

  useEffect(() => {
    fetchOrders();
  }, [token, selectedStatus]);

  useEffect(() => {
    const socket = getSocket();
    socket.on("newOrder", (data) => {
      Toast.show({
        type: "success",
        text1: "Đơn hàng mới",
        text2: data.message || `Có đơn hàng mới #${data.order_id}`,
        position: "top",
      });
      fetchOrders();
    });

    socket.on("orderStatusUpdated", (data) => {
      Toast.show({
        type: "info",
        text1: "Cập nhật trạng thái",
        text2: data.message || `Đơn hàng #${data.order_id} đã cập nhật trạng thái`,
        position: "top",
      });
      fetchOrders();
    });

    socket.on("newNotification", (data) => {
      Toast.show({
        type: "info",
        text1: "Thông báo mới",
        text2: data.message,
        position: "top",
      });
      fetchOrders();
    });

    return () => {
      socket.off("newOrder");
      socket.off("orderStatusUpdated");
      socket.off("newNotification");
    };
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      let url = `${URL_CONNECT}/api/orders/seller`;
      if (selectedStatus !== "all") {
        url = `${URL_CONNECT}/api/orders/seller/orders/${selectedStatus}`;
      }
      const result = await callApi(url, { method: "GET" }, token);
      if (result && Array.isArray(result)) {
        // Kiểm tra trạng thái không hợp lệ (giữ nguyên logic này)
        result.forEach((order: Order) => {
          if (!statusSteps.some((step) => step.value === order.status)) {
            console.warn(`Trạng thái không hợp lệ cho đơn hàng #${order.id}: ${order.status}`);
          }
        });
        setOrders(result);
        // Toast.show({
        //   type: "success",
        //   text1: "Thành công",
        //   text2: "Đã làm mới dữ liệu",
        //   position: "top",
        // });
      } else {
        setOrders([]);
        Alert.alert("Thông báo", `Không có đơn hàng ở trạng thái này.`);
      }
    } catch (error: any) {
      console.error(`Lỗi khi lấy đơn hàng (trạng thái: ${selectedStatus}):`, error);
      Alert.alert("Lỗi", `Không thể lấy đơn hàng: ${error.message}`);
      setOrders([]);
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Không thể làm mới dữ liệu",
        position: "top",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId: number) => {
    // Kiểm tra newStatus có giá trị trước khi xác nhận
    if (!newStatus) {
        Alert.alert("Lỗi", "Vui lòng chọn trạng thái mới.");
        return;
    }
    const selectedStatusLabel = statusSteps.find((s) => s.value === newStatus)?.label || newStatus; // Fallback to raw value if label not found
    Alert.alert(
      "Xác nhận",
      `Bạn có chắc muốn cập nhật trạng thái đơn hàng thành "${selectedStatusLabel}"?`,
      [
        {
          text: "Hủy",
          style: "cancel",
        },
        {
          text: "Xác nhận",
          onPress: async () => {
            try {
              const response = await callApi(
                `${URL_CONNECT}/api/orders/seller/${orderId}/status`,
                {
                  method: "PUT",
                  body: JSON.stringify({ status: newStatus }),
                },
                token
              );
              Alert.alert("Thành công", response.message || "Cập nhật trạng thái thành công!");
              setModalVisible(false);
              fetchOrders();
            } catch (error: any) {
              console.error("Lỗi khi cập nhật trạng thái:", error);
              Alert.alert("Lỗi", "Không thể cập nhật trạng thái: " + error.message);
            }
          },
        },
      ]
    );
  };

  const approveCancellation = async (orderId: number) => {
    try {
      const response = await callApi(
        `${URL_CONNECT}/api/orders/seller/${orderId}/status`,
        {
          method: "PUT",
          body: JSON.stringify({ status: "cancelled" }),
        },
        token
      );
      Toast.show({
        type: "success",
        text1: "Thành công",
        text2: response.message || "Yêu cầu hủy đã được chấp nhận",
        position: "top",
      });
      setModalVisible(false);
      fetchOrders();
    } catch (error: any) {
      console.error("Lỗi khi chấp nhận hủy:", error);
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: error.message || "Không thể chấp nhận yêu cầu hủy",
        position: "top",
      });
    }
  };

  const denyCancellation = async (orderId: number) => {
    if (!denyReason.trim()) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Vui lòng nhập lý do từ chối",
        position: "top",
      });
      return;
    }
    try {
      const response = await callApi(
        `${URL_CONNECT}/api/orders/seller/${orderId}/deny-cancellation`,
        {
          method: "POST",
          body: JSON.stringify({ reason: denyReason }),
        },
        token
      );
      Toast.show({
        type: "success",
        text1: "Thành công",
        text2: response.message || "Yêu cầu hủy đã bị từ chối",
        position: "top",
      });
      setShowDenyModal(false);
      setDenyReason("");
      setModalVisible(false);
      fetchOrders();
    } catch (error: any) {
      console.error("Lỗi khi từ chối hủy:", error);
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: error.message || "Không thể từ chối yêu cầu hủy",
        position: "top",
      });
    }
  };

  // const formatPrice = (price: number | null | undefined) => {
  //   if (price === null || price === undefined) {
  //       return "N/A"; // Hoặc giá trị mặc định khác
  //   }
  //   return price.toLocaleString("vi-VN", { style: "currency", currency: "VND" });
  // };

  const renderOrder = ({ item }: { item: Order }) => {
    const currentStep = statusSteps.find((step) => step.value === item.status);
    const colorClass = statusColors[item.status] || "bg-white border-gray-200";
    return (
      <TouchableOpacity
        className={`p-4 rounded-xl mb-3 shadow-md border ${colorClass}`}
        onPress={() => {
          setSelectedOrder(item);
          // Khởi tạo newStatus bằng trạng thái hiện tại của đơn hàng, hoặc rỗng nếu null/undefined
          setNewStatus(item.status || "");
          setModalVisible(true);
        }}
      >
        {/* Thêm kiểm tra null/undefined cho các thuộc tính hiển thị */}
        <Text className="text-lg font-semibold">Đơn hàng #{item.id || "N/A"}</Text>
        <Text className="text-sm text-gray-600">
            Ngày đặt: {item.created_at ? new Date(item.created_at).toLocaleDateString() : "N/A"}
        </Text>
        <Text className="text-sm text-gray-600">
            Tổng tiền: {formatPrice(item.total_amount)}
        </Text>
        <Text className="text-sm text-gray-600">
          Trạng thái: {currentStep ? currentStep.label : "Không xác định"}
        </Text>
         {/* Kiểm tra item.items trước khi lấy length */}
        <Text className="text-sm text-gray-600">Số sản phẩm: {item.items && Array.isArray(item.items) ? item.items.length : 0}</Text>
        {/* item.cancellation_requested là boolean, không cần kiểm tra null/undefined cho hiển thị điều kiện */}
        {item.cancellation_requested && (
          <Text className="text-lg font-bold text-red-600 mt-1">Có yêu cầu hủy từ người mua</Text>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <View className="flex-row justify-between items-center p-4">
        <Text className="text-2xl font-bold text-emerald-600">Quản lý đơn hàng</Text>
        <TouchableOpacity onPress={fetchOrders}>
          <MaterialIcons name="refresh" size={28} color="#10B981" />
        </TouchableOpacity>
      </View>
      <View className="p-4">
        <Text className="text-lg font-semibold mb-2">Lọc theo trạng thái:</Text>
        <Picker
          selectedValue={selectedStatus}
          onValueChange={(value) => setSelectedStatus(value)}
          style={{ height: 50, width: "100%" }}
        >
          {statusSteps.map((step) => (
            <Picker.Item key={step.value} label={step.label} value={step.value} />
          ))}
        </Picker>
      </View>

      {orders.length === 0 ? (
        <Text className="text-center text-gray-500 mt-4">Chưa có đơn hàng nào.</Text>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrder}
          // Đảm bảo key luôn là chuỗi và duy nhất
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          contentContainerStyle={{ padding: 16 }}
        />
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <ScrollView className="flex-1 bg-white p-4">
          {/* Sử dụng optional chaining an toàn khi hiển thị ID */}
          <Text className="text-2xl font-bold text-emerald-600 mb-4">
            Chi tiết đơn hàng #{selectedOrder?.id || "N/A"}
          </Text>
          {/* Chỉ render nội dung chi tiết khi selectedOrder không null */}
          {selectedOrder && (
            <>
              <Text className="text-lg font-semibold">Thông tin đơn hàng</Text>
              <Text className="text-gray-600">
                {/* Kiểm tra thuộc tính trước khi sử dụng */}
                Ngày đặt: {selectedOrder.created_at ? new Date(selectedOrder.created_at).toLocaleDateString() : "N/A"}
              </Text>
              <Text className="text-gray-600">
                 {/* Sử dụng || để cung cấp giá trị mặc định */}
                Địa chỉ: {selectedOrder.address || "N/A"}
              </Text>
              <Text className="text-gray-600">
                {/* Kiểm tra rõ ràng cho giá trị số */}
                Tổng tiền: {selectedOrder.total_amount !== undefined && selectedOrder.total_amount !== null ? formatPrice(selectedOrder.total_amount) : "N/A"}
              </Text>
               <Text className="text-gray-600">
                {/* find()?.label || fallback đã an toàn */}
                Trạng thái: {statusSteps.find((s) => s.value === selectedOrder.status)?.label || "Không xác định"}
              </Text>

              {/* Kiểm tra cancellation_requested */}
              {selectedOrder.cancellation_requested && (
                <View className="mt-4">
                  <Text className="text-lg font-semibold text-red-600">Yêu cầu hủy đơn hàng</Text>
                  <View className="flex-row justify-between mt-2">
                    <TouchableOpacity
                      className="bg-green-600 p-3 rounded-lg"
                      // Thêm kiểm tra selectedOrder cho an toàn
                      onPress={() => selectedOrder.id && approveCancellation(selectedOrder.id)}
                    >
                      <Text className="text-white">Chấp nhận hủy</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className="bg-red-600 p-3 rounded-lg"
                      onPress={() => setShowDenyModal(true)}
                    >
                      <Text className="text-white">Từ chối hủy</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              <Text className="text-lg font-semibold mt-4">Sản phẩm</Text>
              {/* Kiểm tra selectedOrder.items có tồn tại và là mảng trước khi map */}
              {selectedOrder.items && Array.isArray(selectedOrder.items) && selectedOrder.items.map((item) => (
                <View key={item.id || Math.random().toString()} className="p-2 border-b border-gray-300"> {/* Kiểm tra key */}
                  {/* Kiểm tra thuộc tính của item */}
                  <Text className="text-gray-800">{`${item.name || "N/A"}`}</Text>
                  <Text className="text-gray-600">Số lượng: {item.quantity !== undefined && item.quantity !== null ? item.quantity : "N/A"}</Text>
                  <Text className="text-gray-600">
                    Giá: {item.price_at_time !== undefined && item.price_at_time !== null ? formatPrice(item.price_at_time) : "N/A"}
                  </Text>
                </View>
              ))}
               {/* Hiển thị thông báo nếu không có sản phẩm hoặc items không hợp lệ */}
               {(!selectedOrder.items || !Array.isArray(selectedOrder.items) || selectedOrder.items.length === 0) && (
                   <Text className="text-gray-500 italic">Đơn hàng này không có sản phẩm.</Text>
               )}


              {/* Kiểm tra cancellation_requested */}
              {!selectedOrder.cancellation_requested && (
                <View>
                  <Text className="text-lg font-semibold mt-4">Cập nhật trạng thái</Text>
                  <Picker
                    selectedValue={newStatus}
                    onValueChange={(value) => setNewStatus(value)}
                    style={{ height: 50, width: "100%" }}
                  >
                    {/* Loại bỏ trạng thái "Tất cả" khỏi tùy chọn cập nhật */}
                    {statusSteps
                      .filter((step) => step.value !== "all")
                      .map((step) => (
                        <Picker.Item key={step.value} label={step.label} value={step.value} />
                      ))}
                  </Picker>

                  <View className="flex-row justify-between mt-4">
                    <TouchableOpacity
                      className="bg-blue-600 p-3 rounded-lg"
                       // Thêm kiểm tra selectedOrder cho an toàn
                      onPress={() => selectedOrder.id && updateStatus(selectedOrder.id)}
                    >
                      <Text className="text-white">Cập nhật</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className="bg-red-600 p-3 rounded-lg"
                      onPress={() => setModalVisible(false)}
                    >
                      <Text className="text-white">Đóng</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </>
          )}
          {/* Fallback text nếu selectedOrder là null khi modal hiển thị (trường hợp hiếm) */}
          {!selectedOrder && !loading && modalVisible && (
              <Text className="text-center text-gray-500">Không thể tải chi tiết đơn hàng.</Text>
          )}
        </ScrollView>
      </Modal>

      <Modal
        visible={showDenyModal}
        animationType="slide"
        onRequestClose={() => {
          setShowDenyModal(false);
          setDenyReason(""); // Reset reason khi đóng modal
        }}
      >
        <View className="flex-1 bg-white p-4">
          <Text className="text-2xl font-bold text-emerald-600 mb-4">Từ chối hủy đơn hàng</Text>
          <Text className="text-lg mb-2">Vui lòng nhập lý do từ chối:</Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-2 mb-4 h-24"
            placeholder="Nhập lý do từ chối..."
            value={denyReason}
            onChangeText={setDenyReason}
            multiline
            textAlignVertical="top"
          />
          <View className="flex-row justify-between">
            <TouchableOpacity
              className="bg-blue-600 p-3 rounded-lg"
               // Thêm kiểm tra selectedOrder cho an toàn
              onPress={() => selectedOrder?.id && denyCancellation(selectedOrder.id)}
              disabled={!denyReason.trim()} // Disable button if reason is empty
            >
              <Text className="text-white">Xác nhận</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-red-600 p-3 rounded-lg"
              onPress={() => {
                setShowDenyModal(false);
                setDenyReason(""); // Reset reason khi hủy
              }}
            >
              <Text className="text-white">Hủy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
       {/* <Toast /> Đảm bảo Toast component được render */}
    </View>
  );
};

export default OrderManagement;