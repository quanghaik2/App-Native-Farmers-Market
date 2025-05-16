

import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../constants";

// Hàm callApi để gọi API với cơ chế làm mới token
export const callApi = async (url, options = {}, token) => {
  console.log("Gọi API:", { url, method: options.method, token });
  options.headers = {
    ...options.headers,
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
  const response = await fetch(url, options);
  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (error) {
    console.log("Dữ liệu không phải JSON:", { url, text: text.slice(0, 160) });
    throw new Error(`Dữ liệu trả về không phải JSON: ${url}`);
  }
  if (response.status === 401 && data.expired) {
    console.log("Token hết hạn, thử làm mới...");
    const refreshToken = await AsyncStorage.getItem("refreshToken");
    if (!refreshToken) {
      console.log("Không tìm thấy refresh token trong AsyncStorage");
      throw new Error("Không tìm thấy refresh token!");
    }
    const refreshResponse = await fetch(`${API_URL}/auth/refresh-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    const refreshText = await refreshResponse.text();
    let refreshData;
    try {
      refreshData = JSON.parse(refreshText);
    } catch (error) {
      console.log("Refresh response không phải JSON:", refreshText.slice(0, 100));
      throw new Error(`Refresh token response không phải JSON`);
    }
    if (refreshResponse.ok) {
      console.log("Làm mới token thành công:", refreshData.accessToken);
      await AsyncStorage.setItem("token", refreshData.accessToken);
      options.headers.Authorization = `Bearer ${refreshData.accessToken}`;
      const retryResponse = await fetch(url, options);
      const retryText = await retryResponse.text();
      try {
        const retryData = JSON.parse(retryText);
        if (!retryResponse.ok) {
          console.log("Retry API thất bại:", retryData.message);
          throw new Error(retryData.message || "Lỗi sau khi làm mới token");
        }
        return retryData;
      } catch (error) {
        console.log("Retry response không phải JSON:", retryText.slice(0, 100));
        throw new Error(`Retry response không phải JSON`);
      }
    } else {
      console.log("Làm mới token thất bại:", refreshData.message);
      throw new Error(refreshData.message || "Không thể làm mới token!");
    }
  }
  if (!response.ok) {
    console.log("API lỗi:", { status: response.status, message: data.message });
    throw new Error(data.message || "Lỗi không xác định từ server");
  }
  return data;
};

export const register = async (userData) => {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });
  return response.json();
};

export const login = async (email, password) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return response.json();
};

export const getUserProfile = async (token) => {
  return callApi(`${API_URL}/auth/profile`, { method: "GET" }, token);
};

export const uploadAvatar = async (token, formData) => {
  return callApi(
    `${API_URL}/auth/update-avatar`,
    { method: "PUT", body: formData },
    token
  );
};

export const updateProfile = async (token, userData) => {
  return callApi(
    `${API_URL}/auth/update-profile`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    },
    token
  );
};

export const createAddress = async (token, addressData) => {
  return callApi(
    `${API_URL}/addresses/create`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(addressData),
    },
    token
  );
};

export const getUserAddresses = async (token) => {
  return callApi(`${API_URL}/addresses`, { method: "GET" }, token);
};

export const setDefaultAddress = async (token, address_id) => {
  return callApi(
    `${API_URL}/addresses/set-default`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address_id }),
    },
    token
  );
};

export const deleteAddress = async (token, address_id) => {
  return callApi(
    `${API_URL}/addresses/delete`,
    {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address_id }),
    },
    token
  );
};