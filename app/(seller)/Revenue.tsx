import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useAuth } from "../../context/AuthContext";
import { callApi } from "../../lib/api/auth";
import { URL_CONNECT } from "../../lib/constants";
import { PieChart } from "react-native-chart-kit";
import { Ionicons } from "@expo/vector-icons";
import { formatPrice } from "@/lib/utils";

interface ProductStat {
  product_id: number;
  name: string;
  quantity: number | string;
  revenue: number;
}

interface DailyStat {
  date: string;
  totalRevenue: number;
  products: ProductStat[];
}

interface MonthlyStat {
  month: string;
  totalRevenue: number;
  products: ProductStat[];
}

export default function Revenue() {
  const { token } = useAuth();
  const [dailyStats, setDailyStats] = useState<DailyStat[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<Date | null>(null);

  const fetchStats = async (date?: string, month?: string) => {
    try {
      setLoading(true);
      const query = date ? `?date=${date}` : month ? `?month=${month}` : "";
      const result = await callApi(
        `${URL_CONNECT}/api/orders/seller/stats/revenue${query}`,
        { method: "GET" },
        token
      );
      setDailyStats(result.daily || []);
      setMonthlyStats(result.monthly || []);
    } catch (error) {
      console.error("Lỗi khi lấy thống kê:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [token]);

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
      const formattedDate = date.toISOString().split("T")[0];
      fetchStats(formattedDate);
    }
  };

  const handleMonthChange = (event: any, date?: Date) => {
    setShowMonthPicker(false);
    if (date) {
      setSelectedMonth(date);
      const formattedMonth = `${date.getFullYear()}-${(date.getMonth() + 1)
        .toString()
        .padStart(2, "0")}`;
      fetchStats(undefined, formattedMonth);
    }
  };

  // const formatPrice = (price: number) => {
  //   return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + " VNĐ";
  // };

  // Prepare chart data
  const screenWidth = Dimensions.get("window").width;
  const chartWidth = Math.min(screenWidth - 32, 450);
  const chartHeight = screenWidth > 600 ? 300 : 260;

  const colorPalette = [
    "#FF6B6B", // Đỏ san hô
    "#4ECDC4", // Xanh ngọc
    "#45B7D1", // Xanh dương nhạt
    "#96CEB4", // Xanh lá nhạt
    "#FFEEAD", // Vàng nhạt
    "#D4A5A5", // Hồng nhạt
    "#7AE2CF",
    "#3D90D7",
    "#BBD8A3",
    "#8E7DBE",
    "#735557",
    "#9ACBD0",
    "#FFDDAB",
    "#E69DB8",
    "#EAD196",
    "#F5ECE0",
  ];

  const getChartData = () => {
    const stats = selectedDate ? dailyStats : monthlyStats;
    const productsMap: { [key: string]: { name: string; quantity: number } } = {};

    stats.forEach((stat) => {
      stat.products.forEach((product) => {
        const quantity = parseInt(product.quantity.toString(), 10);
        if (productsMap[product.name]) {
          productsMap[product.name].quantity += quantity;
        } else {
          productsMap[product.name] = { name: product.name, quantity };
        }
      });
    });

    const totalQuantity = Object.values(productsMap).reduce(
      (sum, product) => sum + product.quantity,
      0
    );

    return Object.keys(productsMap).map((name, index) => ({
      name: `${productsMap[name].name} (${productsMap[name].quantity})`,
      value: productsMap[name].quantity,
      color: colorPalette[index % colorPalette.length],
      legendFontColor: "#1F2937",
      legendFontSize: 12,
    }));
  };

  const chartData = getChartData();

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-100">
        <ActivityIndicator size="large" color="#059669" />
        <Text className="mt-4 text-gray-500 text-base">Đang tải dữ liệu...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-gray-100"
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
    >
      <Text className="text-2xl font-bold text-emerald-600 mb-4">Doanh Thu</Text>

      {/* Filter Section */}
      <View className="flex-row justify-between bg-white rounded-xl p-4 mb-4 shadow-sm">
        <TouchableOpacity
          className="flex-row items-center bg-blue-600 px-4 py-3 rounded-lg"
          onPress={() => setShowDatePicker(true)}
        >
          <Ionicons name="calendar-outline" size={20} color="#FFFFFF" />
          <Text className="text-white text-base ml-2">
            {selectedDate
              ? selectedDate.toISOString().split("T")[0]
              : "Chọn ngày"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-row items-center bg-blue-600 px-4 py-3 rounded-lg"
          onPress={() => setShowMonthPicker(true)}
        >
          <Ionicons name="calendar-outline" size={20} color="#FFFFFF" />
          <Text className="text-white text-base ml-2">
            {selectedMonth
              ? `${selectedMonth.getFullYear()}-${(selectedMonth.getMonth() + 1)
                  .toString()
                  .padStart(2, "0")}`
              : "Chọn tháng"}
          </Text>
        </TouchableOpacity>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate || new Date()}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}
      {showMonthPicker && (
        <DateTimePicker
          value={selectedMonth || new Date()}
          mode="date"
          display="default"
          onChange={handleMonthChange}
        />
      )}

      {/* Chart Section */}
      <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
        <Text className="text-lg font-semibold text-gray-800 mb-3">Thống Kê Sản Phẩm Bán Ra</Text>
        {chartData.length > 0 ? (
          <View className="items-center my-4">
            <PieChart
              data={chartData}
              width={chartWidth}
              height={chartHeight}
              chartConfig={{
                backgroundColor: "#FFFFFF",
                backgroundGradientFrom: "#FFFFFF",
                backgroundGradientTo: "#FFFFFF",
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              }}
              accessor="value"
              backgroundColor="transparent"
              paddingLeft={80}
              absolute
              hasLegend={false}
            />
            <View className="flex-row flex-wrap justify-center mt-3">
              {chartData.map((item, index) => (
                <View
                  key={index}
                  className="flex-row items-center m-1.5"
                  style={{ maxWidth: screenWidth / 2 - 24 }}
                >
                  <View className="w-3 h-3 mr-1.5" style={{ backgroundColor: item.color }} />
                  <Text className="text-xs text-gray-600" numberOfLines={1}>
                    {item.name}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <Text className="text-gray-500 text-center my-4">Không có dữ liệu để hiển thị biểu đồ</Text>
        )}
      </View>

      {/* Daily Stats */}
      <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
        <Text className="text-xl font-semibold text-gray-800 mb-3">Doanh Thu Theo Ngày</Text>
        {dailyStats.length > 0 ? (
          dailyStats.map((stat, index) => (
            <View key={index} className="mb-4">
              <View className="flex-row items-center">
                <Ionicons name="calendar-outline" size={18} color="#1D4ED8" />
                <Text className="text-base font-semibold text-blue-700 ml-1.5">
                  Ngày: {stat.date.split("T")[0]}
                </Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="cash-outline" size={18} color="#DC2626" />
                <Text className="text-base font-bold text-red-600 ml-1.5">
                  Tổng doanh thu: {formatPrice(stat.totalRevenue)}
                </Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="cart-outline" size={18} color="#4B5563" />
                <Text className="text-sm font-medium text-gray-600 ml-1.5 mt-2">
                  Sản phẩm đã bán:
                </Text>
              </View>
              {stat.products.map((product, idx) => (
                <Text key={idx} className="text-sm text-gray-600 ml-2 mt-1.5">
                  <MaterialIcons name="sell" size={14} color={"#A0C878"}/> {product.name}: {product.quantity} sản phẩm, {formatPrice(product.revenue)}
                </Text>
              ))}
            </View>
          ))
        ) : (
          <Text className="text-gray-500 text-center my-4">Không có dữ liệu</Text>
        )}
      </View>

      {/* Monthly Stats */}
      <View className="bg-white rounded-xl p-4 shadow-sm">
        <Text className="text-xl font-semibold text-gray-800 mb-3">Doanh Thu Theo Tháng</Text>
        {monthlyStats.length > 0 ? (
          monthlyStats.map((stat, index) => (
            <View key={index} className="mb-4 text-[#03A791]">
              <View className="flex-row items-center">
                <Ionicons name="calendar-outline" size={18} color="#03A791" />
                <Text className="text-base font-semibold ml-1.5 text-[#03A791]">
                  Tháng: {stat.month}
                </Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="cash-outline" size={18} color="#DC2626" />
                <Text className="text-base font-bold text-red-600 ml-1.5">
                  Tổng doanh thu: {formatPrice(stat.totalRevenue)}
                </Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="cart-outline" size={18} color="#4B5563" />
                <Text className="text-sm font-medium text-gray-600 ml-1.5 mt-2">
                  Sản phẩm đã bán:
                </Text>
              </View>
              {stat.products.map((product, idx) => (
                <Text key={idx} className="text-sm text-gray-600 ml-2 mt-1.5">
                  <MaterialIcons name="sell" size={14} color={"#A0C878"}/> {product.name}: {product.quantity} sản phẩm, {formatPrice(product.revenue)}
                </Text>
              ))}
            </View>
          ))
        ) : (
          <Text className="text-gray-500 text-center my-4">Không có dữ liệu</Text>
        )}
      </View>
    </ScrollView>
  );
}