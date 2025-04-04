import axios, { AxiosError } from "axios";


// Create Axios instance
const API = axios.create({
  baseURL: "http://localhost:5000/api",
  withCredentials: true,
});

export const login = async (email: string, password: string) => {
  try {
    const res = await API.post("/auth/login", { email, password });
    return res.data;
  } catch (error) {
    const axiosError = error as AxiosError<{ message: string }>; 

    if (axiosError.response) {
      throw new Error(axiosError.response.data?.message || "Something went wrong");
    } else if (axiosError.request) {
      throw new Error("No response from server. Please try again.");
    } else {
      throw new Error("An unexpected error occurred.");
    }
  }
};
