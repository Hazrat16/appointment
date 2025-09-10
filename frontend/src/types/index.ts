export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "patient" | "doctor" | "admin";
  phone: string;
  dateOfBirth: string;
  gender: "male" | "female" | "other";
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Doctor {
  id: string;
  user: User;
  specialization: string;
  licenseNumber: string;
  experience: number;
  education: Education[];
  consultationFee: number;
  bio?: string;
  languages: string[];
  isVerified: boolean;
  rating: {
    average: number;
    count: number;
  };
  totalAppointments: number;
  createdAt: string;
  updatedAt: string;
}

export interface Education {
  degree: string;
  institution: string;
  year: number;
}

export interface Availability {
  id: string;
  doctor: Doctor;
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday
  startTime: string;
  endTime: string;
  slotDuration: number; // in minutes
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  id: string;
  patient: User;
  doctor: Doctor;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: "scheduled" | "confirmed" | "completed" | "cancelled" | "no-show";
  consultationFee: number;
  notes?: string;
  symptoms?: string;
  prescription?: string;
  diagnosis?: string;
  followUpRequired: boolean;
  followUpDate?: string;
  paymentStatus: "pending" | "paid" | "refunded";
  paymentMethod?: "cash" | "card" | "online" | "insurance";
  cancellationReason?: string;
  cancelledBy?: "patient" | "doctor" | "admin";
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  user?: User;
  token?: string;
  doctors?: Doctor[];
  appointments?: Appointment[];
  availability?: TimeSlot[];
  dashboard?: any;
  count?: number;
  total?: number;
  pagination?: {
    page: number;
    pages: number;
    limit: number;
  };
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  dateOfBirth: string;
  gender: "male" | "female" | "other";
  role?: "patient" | "doctor" | "admin";
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  // Doctor specific fields
  specialization?: string;
  licenseNumber?: string;
  experience?: number;
  education?: Education[];
  consultationFee?: number;
  bio?: string;
  languages?: string[];
}

export interface CreateAppointmentRequest {
  doctorId: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  symptoms?: string;
  notes?: string;
}

export interface UpdateAppointmentRequest {
  status?: "scheduled" | "confirmed" | "completed" | "cancelled" | "no-show";
  prescription?: string;
  diagnosis?: string;
  followUpRequired?: boolean;
  followUpDate?: string;
  notes?: string;
  symptoms?: string;
}

export interface AvailabilityRequest {
  availability: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    slotDuration?: number;
  }>;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => void;
  loading: boolean;
}
