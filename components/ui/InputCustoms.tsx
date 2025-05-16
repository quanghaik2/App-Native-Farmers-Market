import React, { useState } from "react";
import { TextInput, TextInputProps, StyleSheet, View } from "react-native";

interface InputCustomsProps extends TextInputProps {
  error?: boolean;
}

export default function InputCustoms({ style, error, ...props }: InputCustomsProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View
      style={[
        styles.container,
        error ? styles.errorContainer : isFocused ? styles.successContainer : styles.defaultContainer,
      ]}
    >
      <TextInput
        style={[styles.input, style]}
        placeholderTextColor="#A0A0A0"
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  defaultContainer: {
    borderColor: "#D1D5DB", // Màu viền mặc định (xám nhạt)
  },
  errorContainer: {
    borderColor: "red", // Màu viền đỏ khi có lỗi
    shadowColor: "red",
    shadowOpacity: 0.3,
  },
  successContainer: {
    borderColor: "green", // Màu viền xanh lá khi đúng
    shadowColor: "green",
    shadowOpacity: 0.3,
  },
  input: {
    height: 48,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#333333",
  },
});
