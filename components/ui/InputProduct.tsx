import { TextInput, TextInputProps, StyleSheet } from "react-native";

interface InputProductProps extends TextInputProps {
  placeholder: string;
  value: any; // Chấp nhận bất kỳ kiểu dữ liệu nào
  onChangeText: (text: string) => void;
  keyboardType?: "default" | "numeric";
  editable?: boolean;
}

export default function InputCustom({
  placeholder,
  value,
  onChangeText,
  keyboardType = "default",
  editable = true,
  ...props
}: InputProductProps) {
  return (
    <TextInput
      style={[
        styles.input,
        editable ? styles.editable : styles.nonEditable,
      ]}
      placeholder={placeholder}
      value={value !== undefined ? String(value) : ""} // Chuyển đổi thành chuỗi nếu cần
      onChangeText={onChangeText}
      keyboardType={keyboardType}
      editable={editable}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB", // Màu xám nhạt
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  editable: {
    backgroundColor: "#F9FAFB", // Màu xám nhạt khi có thể chỉnh sửa
  },
  nonEditable: {
    backgroundColor: "#E5E7EB", // Màu xám đậm hơn khi không thể chỉnh sửa
  },
});