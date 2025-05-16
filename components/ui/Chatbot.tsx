import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Image,
} from "react-native";
import { callApi } from "@/lib/api/auth";
import { URL_CONNECT } from "@/lib/constants";
import { useAuth } from "../../context/AuthContext";
import { FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router"; // Thêm useRouter

interface Message {
  id: string;
  text: string;
  createdAt: Date;
  user: { id: number; name: string };
  products?: any[]; // Thêm trường products để lưu danh sách sản phẩm gợi ý
}

interface ChatbotProps {
  visible: boolean;
  onClose: () => void;
}

const Chatbot: React.FC<ChatbotProps> = ({ visible, onClose }) => {
  const { token } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter(); // Khởi tạo router

  useEffect(() => {
    if (visible) {
      setMessages([
        {
          id: "1",
          text: "Xin chào! Tôi có thể giúp bạn tìm sản phẩm, kiểm tra nguồn gốc hoặc thêm vào giỏ hàng. Bạn muốn gì?",
          createdAt: new Date(),
          user: { id: 2, name: "Chatbot" },
        },
      ]);
    }
  }, [visible]);

  useEffect(() => {
    if (flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const onSend = useCallback(async () => {
    if (!inputText.trim()) return;

    const newMessage: Message = {
      id: Math.random().toString(),
      text: inputText,
      createdAt: new Date(),
      user: { id: 1, name: "User" },
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputText("");

    try {
      const response = await callApi(
        `${URL_CONNECT}/api/chatbot`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: newMessage.text }),
        },
        token
      );

      const botMessage: Message = {
        id: Math.random().toString(),
        text: response.message || "Tôi không hiểu, bạn có thể nói lại không?",
        createdAt: new Date(),
        user: { id: 2, name: "Chatbot" },
        products: response.products || [], // Lưu danh sách sản phẩm gợi ý
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error: any) {
      const errorMessage: Message = {
        id: Math.random().toString(),
        text: "Có lỗi xảy ra, vui lòng thử lại!",
        createdAt: new Date(),
        user: { id: 2, name: "Chatbot" },
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  }, [inputText, token]);

  const viewProductDetail = useCallback((productId: number) => {
    router.push({
      pathname: "/(buyer)/ProductDetail",
      params: { productId: productId.toString() },
    });
  }, [router]);

  const renderMessage = ({ item }: { item: Message }) => (
    <View
      style={[
        styles.messageContainer,
        item.user.id === 1 ? styles.userMessage : styles.botMessage,
      ]}
    >
      <Text style={styles.messageText}>{item.text}</Text>
      {/* Hiển thị danh sách sản phẩm gợi ý nếu có */}
      {item.products && item.products.length > 0 && (
        <View >
          {item.products.map((product, index) => (
            <View key={index} >
              <Text >
                - {product.name}: {product.price}đ
              </Text>
              <TouchableOpacity
                onPress={() => viewProductDetail(product.id)}
                style={styles.productLink}
              >
                <Text style={styles.linkText}>Xem sản phẩm tại đây</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
      <Text style={styles.messageTime}>
        {item.createdAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </Text>
    </View>
  );

  if (!visible) return null;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.header}>
        <Image
          source={require("../../assets/images/LogoAi.png")}
          style={styles.headerImage}
        />
        <Text style={styles.headerTitle}>Chat tư vấn với AI</Text>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <FontAwesome name="close" size={20} color="white" />
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Nhập tin nhắn..."
          placeholderTextColor="#888"
        />
        <TouchableOpacity style={styles.sendButton} onPress={onSend}>
          <FontAwesome name="send" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 50,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4CAF50",
    padding: 12,
    elevation: 2,
  },
  headerImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
  closeButton: {
    backgroundColor: "",
    padding: 8,
    borderRadius: 20,
  },
  messageList: {
    padding: 16,
    flexGrow: 1, // Đảm bảo FlatList chiếm toàn bộ không gian còn lại
  },
  messageContainer: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 12,
    marginVertical: 4,
  },
  userMessage: {
    backgroundColor: "#4CAF50",
    alignSelf: "flex-end",
  },
  botMessage: {
    backgroundColor: "#e0f7fa",
    alignSelf: "flex-start",
  },
  messageText: {
    color: "#000",
    fontSize: 16,
  },
  messageTime: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
    textAlign: "right",
  },
  inputContainer: {
    flexDirection: "row",
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    backgroundColor: "white",
  },
  input: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    borderRadius: 20,
    padding: 12,
    fontSize: 16,
    color: "black",
  },
  sendButton: {
    backgroundColor: "#4CAF50",
    padding: 12,
    borderRadius: 20,
    marginLeft: 8,
    justifyContent: "center",
  },
  productLink: {
    marginTop: 4,
  },
  linkText: {
    color: "#1E90FF", // Màu xanh dương nổi bật
    fontSize: 14,
    fontWeight: "bold",
  },
});

export default Chatbot;