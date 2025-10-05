import {
  ApiResponse,
  AvailabilityRequest,
  CreateAppointmentRequest,
  LoginRequest,
  RegisterRequest,
  UpdateAppointmentRequest,
  UpdateProfileRequest,
} from "@/types";
import axios, { AxiosResponse } from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/auth/login";
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (data: LoginRequest): Promise<ApiResponse> =>
    api.post("/auth/login", data).then((res) => res.data),

  register: (data: RegisterRequest): Promise<ApiResponse> =>
    api.post("/auth/register", data).then((res) => res.data),

  getMe: (): Promise<ApiResponse> =>
    api.get("/auth/me").then((res) => res.data),

  updateProfile: (data: UpdateProfileRequest): Promise<ApiResponse> =>
    api.put("/auth/profile", data).then((res) => res.data),

  changePassword: (data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<ApiResponse> =>
    api.put("/auth/change-password", data).then((res) => res.data),
};

// Doctors API
export const doctorsAPI = {
  getDoctors: (params?: {
    specialization?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse> =>
    api.get("/doctors", { params }).then((res) => res.data),

  getDoctor: (id: string): Promise<ApiResponse> =>
    api.get(`/doctors/${id}`).then((res) => res.data),

  getDoctorAvailability: (id: string, date: string): Promise<ApiResponse> =>
    api
      .get(`/doctors/${id}/availability`, { params: { date } })
      .then((res) => res.data),

  updateAvailability: (data: AvailabilityRequest): Promise<ApiResponse> =>
    api.put("/doctors/availability", data).then((res) => res.data),

  getDashboard: (): Promise<ApiResponse> =>
    api.get("/doctors/dashboard").then((res) => res.data),

  // Admin endpoints
  getAllDoctorsAdmin: (params?: {
    verificationStatus?: boolean;
    specialization?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse> =>
    api.get("/doctors/admin/all", { params }).then((res) => res.data),

  verifyDoctor: (id: string, isVerified: boolean): Promise<ApiResponse> =>
    api
      .put(`/doctors/admin/${id}/verify`, { isVerified })
      .then((res) => res.data),

  getDoctorStats: (): Promise<ApiResponse> =>
    api.get("/doctors/admin/stats").then((res) => res.data),
};

// Appointments API
export const appointmentsAPI = {
  getAppointments: (params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse> =>
    api.get("/appointments", { params }).then((res) => res.data),

  getAppointment: (id: string): Promise<ApiResponse> =>
    api.get(`/appointments/${id}`).then((res) => res.data),

  createAppointment: (data: CreateAppointmentRequest): Promise<ApiResponse> =>
    api.post("/appointments", data).then((res) => res.data),

  updateAppointment: (
    id: string,
    data: UpdateAppointmentRequest
  ): Promise<ApiResponse> =>
    api.put(`/appointments/${id}`, data).then((res) => res.data),

  cancelAppointment: (id: string, reason?: string): Promise<ApiResponse> =>
    api
      .delete(`/appointments/${id}`, { data: { cancellationReason: reason } })
      .then((res) => res.data),
};

export default api;
