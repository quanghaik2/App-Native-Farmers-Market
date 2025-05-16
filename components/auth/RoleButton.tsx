import { TouchableOpacity, Text, StyleSheet, View } from "react-native";
import { ReactNode } from "react";

interface RoleButtonProps {
  title: string;
  onPress: () => void;
  bgColor?: string; // Màu nền
  style?: object; // Kiểu bổ sung
  icon?: ReactNode; // Thêm prop icon
}

export default function RoleButton({ title, onPress, bgColor = "blue", style, icon }: RoleButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: bgColor }, style]}
      onPress={onPress}
    >
      {icon && <View className="mr-2">{icon}</View>}
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    color: "#fff",
    fontWeight: "bold",
  },
});