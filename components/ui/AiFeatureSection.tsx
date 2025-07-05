import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Animatable from "react-native-animatable";
import { callApi } from "../../lib/api/auth";
import { URL_CONNECT } from "../../lib/constants";

interface Product {
  id: number;
  seller_id: number;
  name: string;
  store_name: string;
  price: number;
  description: string;
  address: string;
  points: number;
  image_url: string;
  category_id: number;
}

const AiFeatureSection = ({ product, token }: { product: Product; token: string | null }) => {
  const [displayedText, setDisplayedText] = useState<string>("");
  const [isFetchingAi, setIsFetchingAi] = useState<boolean>(false);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);
  const fullMessage = useRef<string>("");
  const [customQuery, setCustomQuery] = useState<string>("");

  useEffect(() => {
    return () => {
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
    };
  }, []);

  const fetchAiInfo = async (query: string) => {
    if (isFetchingAi || !query) return;

    setIsFetchingAi(true);
    setDisplayedText("");
    if (typingTimeout.current) clearTimeout(typingTimeout.current);

    try {
      const response = await callApi(
        `${URL_CONNECT}/api/chatbot/search-product-info`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            product_name: product.name,
            address: product.address,
            query,
          }),
        },
        token
      );

      fullMessage.current = response.message ? response.message.trim().replace(/undefined/g, "") : "Không có thông tin bổ sung.";

      let index = 0;
      const typeCharacter = () => {
        if (index < fullMessage.current.length) {
          setDisplayedText(fullMessage.current.slice(0, index + 1));
          index++;
          typingTimeout.current = setTimeout(typeCharacter, 30);
        } else {
          setIsFetchingAi(false);
        }
      };
      typeCharacter();
    } catch (error: any) {
      console.error("Lỗi gọi AI:", error);
      const errorMessage = "Không thể lấy thông tin từ AI. Vui lòng thử lại!";
      setDisplayedText(errorMessage);
      setIsFetchingAi(false);
    }
  };
  
  // THAY ĐỔI 1: Cập nhật danh sách câu hỏi phụ
  const subQuestions = [
    {
      text: `Tác dụng của ${product.name}?`,
      icon: "heart-outline",
      query: `${product.name} có tác dụng gì đến sức khỏe?`,
    },
    {
      text: `Thông tin ${product.address}`,
      icon: "location-outline",
      query: `Thông tin về ${product.address}`,
    },
    {
      text: `Cách bảo quản?`,
      icon: "file-tray-full-outline",
      query: `Cách bảo quản sản phẩm ${product.name} như thế nào?`,
    },
    {
      text: `Đánh giá sản phẩm`,
      icon: "star-outline",
      query: `Đánh giá về sản phẩm ${product.name} như thế nào?`,
    },
    {
      text: `Cách sử dụng`,
      icon: "help-circle-outline",
      query: `Cách sử dụng sản phẩm ${product.name} như thế nào?`,
    },
  ];

  const cleanedText = displayedText.trim();

  const renderSubQuestionItem = ({ item }: { item: typeof subQuestions[0] }) => (
    <TouchableOpacity
      onPress={() => fetchAiInfo(item.query)}
      disabled={isFetchingAi}
      style={styles.subQuestionButton}
    >
      <Ionicons name={item.icon as any} size={16} color="#15803d" style={styles.subQuestionIcon} />
      <Text style={styles.subQuestionText}>{item.text}</Text>
    </TouchableOpacity>
  );

  const handleSendCustomQuery = () => {
    if (customQuery.trim()) {
      fetchAiInfo(customQuery.trim());
      setCustomQuery("");
    }
  };

  const isSendButtonDisabled = isFetchingAi || !customQuery.trim();

  return (
    // THAY ĐỔI 2: Bọc toàn bộ bằng KeyboardAvoidingView để input không bị che
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <View className="px-4 py-4 flex-1 justify-between">
        {/* Phần nội dung */}
        <View>
          <Animatable.View animation="fadeInUp" duration={500}>
            <TouchableOpacity onPress={() => fetchAiInfo(`Giới thiệu về ${product.name} tại ${product.address}`)} disabled={isFetchingAi}>
              <LinearGradient
                colors={isFetchingAi ? ["#a78bfa", "#7c3aed"] : ["#8b5cf6", "#4f46e5"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.aiButton}
              >
                {isFetchingAi ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Ionicons name="sparkles-outline" size={22} color="white" style={{ marginRight: 8 }} />
                    <Text style={styles.aiButtonText}>Hỏi AI về sản phẩm</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animatable.View>

          {cleanedText ? (
            <Animatable.View animation="fadeInUp" duration={500} style={{ marginTop: 16 }}>
              <View className="bg-slate-100 p-4 rounded-xl border border-slate-200">
                <Text className="text-base text-slate-800 leading-relaxed font-[monospace]">
                  {cleanedText}
                </Text>
                
                {!isFetchingAi && (
                  <View>
                    <View style={styles.subQuestionSection}>
                      <FlatList
                        data={subQuestions}
                        renderItem={renderSubQuestionItem}
                        keyExtractor={(item, index) => index.toString()}
                        horizontal={true}
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.subQuestionListContainer}
                      />
                    </View>
                    <Animatable.View animation="fadeInUp" duration={500} style={styles.customQueryContainer}>
          <TextInput
            style={styles.customQueryInput}
            value={customQuery}
            onChangeText={setCustomQuery}
            placeholder="Bạn muốn hỏi gì thêm..."
            placeholderTextColor="#9ca3af"
            editable={!isFetchingAi}
            multiline // Cho phép nhập nhiều dòng
          />
          <TouchableOpacity
            onPress={handleSendCustomQuery}
            disabled={isSendButtonDisabled}
          >
            {/* Dùng LinearGradient cho nút gửi */}
            <LinearGradient
              colors={isSendButtonDisabled ? ["#e5e7eb", "#d1d5db"] : ["#8b5cf6", "#4f46e5"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.sendButton}
            >
              {/* <Ionicons name="paper-plane-outline" size={20} color="white" /> */}
              <Ionicons name="send" size={20} color="white" />
            </LinearGradient>
          </TouchableOpacity>
        </Animatable.View>
                  </View>
                )}
              </View>
            </Animatable.View>
          ) : null}
        </View>

        
      </View>
    </KeyboardAvoidingView>
  );
};

// THAY ĐỔI 4: Cập nhật StyleSheet
const styles = StyleSheet.create({
  aiButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  aiButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  subQuestionSection: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 16,
  },
  subQuestionListContainer: {
    gap: 10,
  },
  subQuestionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: "#f0fdf4",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  subQuestionIcon: {
    marginRight: 6,
  },
  subQuestionText: {
    color: "#166534",
    fontSize: 13,
    fontWeight: "500",
  },
  // Style mới cho input và nút gửi
  customQueryContainer: {
    flexDirection: "row",
    alignItems: "flex-end", // Căn theo cuối để nút không bị kéo dãn khi input có nhiều dòng
    marginTop: 16,
    gap: 8,
  },
  customQueryInput: {
    flex: 1,
    backgroundColor: "#f1f5f9", // Màu xám nhạt (slate-100)
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 12, // Tăng padding top để chữ không bị sát
    paddingBottom: 12,
    fontSize: 15,
    color: "#1f2937",
    maxHeight: 100, // Giới hạn chiều cao khi nhập nhiều dòng
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22, // Bo tròn thành hình tròn
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000", // Thêm shadow cho đồng bộ
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
});

export default AiFeatureSection;