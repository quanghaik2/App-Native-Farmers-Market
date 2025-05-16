import { URL_CONNECT } from "../constants";

export const getProducts = async (token, seller_id) => {
  console.log({ url: `${URL_CONNECT}/api/products` });
  const response = await fetch(`${URL_CONNECT}/api/products`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message);
  return data;
};

export const getAllProducts = async () => {
  const response = await fetch(`${URL_CONNECT}/api/products/all`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message);
  return data;
};

// Các hàm khác giữ nguyên
export const addProduct = async (token, product) => {
  const response = await fetch(`${URL_CONNECT}/api/products`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(product),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message);
  return data;
};

export const updateProduct = async (token, productId, product) => {
  const response = await fetch(`${URL_CONNECT}/api/products/${productId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(product),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message);
  return data;
};

export const deleteProduct = async (token, productId) => {
  const response = await fetch(`${URL_CONNECT}/api/products/${productId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message);
  return data;
};