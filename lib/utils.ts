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

export const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return "Không có thông tin";

  console.log('datestring:', dateString); // Debug để kiểm tra dữ liệu

  // Xử lý định dạng ISO 8601 (ví dụ: "2019-12-10T17:00:00.000Z")
  const parts = dateString.split('T')[0].split('-'); // Tách ngày: "2019-12-10"
  if (parts.length < 3) return "Không có thông tin hợp lệ";

  const year = parts[0];
  const month = parts[1];
  const day = parts[2];

  // Trả về định dạng DD/MM/YYYY
  return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
};

// Bạn có thể thêm các hàm tiện ích khác tại đây, ví dụ:
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
};