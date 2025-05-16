// utils.ts

// Hàm định dạng giá tiền
export const formatPrice = (value: string | number): string => {
  const numberValue = parseInt(String(value), 10);
  if (isNaN(numberValue)) {
    return "0đ";
  }
  const formattedValue = numberValue
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${formattedValue}đ`;
};

// Bạn có thể thêm các hàm tiện ích khác tại đây, ví dụ:
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
};