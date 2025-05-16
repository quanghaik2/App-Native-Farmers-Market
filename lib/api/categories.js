import { URL_CONNECT } from "../constants";


export const getCategories = async () => {
  const response = await fetch(`${URL_CONNECT}/api/categories`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message);
  return data;
};