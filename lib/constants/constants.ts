// Định nghĩa kiểu dữ liệu cho đối tượng người dùng
export interface UserObject {
    id: string;
    email: string;
    role: string; // Vai trò chỉ có thể là "buyer" hoặc "seller"
  }

// Định nghĩa kiểu dữ liệu cho hồ sơ người dùng
export interface UserProfile {
    full_name: string;
    phone_number?: string; // Có thể không có
    address?: string; // Có thể không có
    avatar_url?: string; // URL ảnh đại diện
  }

export interface Product {
    id: number; //,
    name: string; //,
    store_name: string; //,
    price: number; //,
    description: string; //,
    origin?: string; //,
    points?: number; //,
    image_url?: string; //,
    origin_proof_image_url?: string; //,
    category_id?: number; //,
    address?: string; //,
    issued_by?: string; //,
     expiry_date?: string; //,
}

export interface Category {
  id: number;
  name: string;
  image_url: string | null;
}