export type AdminUser = {
  id: string;
  email: string;
  role: "admin";
};

export type Doctor = {
  _id: string;
  name: string;
  specialization: string;
  hospital: string;
  phone: string;
  email: string;
  createdAt: string;
  updatedAt?: string;
};

export type DoctorSummary = Pick<Doctor, "_id" | "name" | "specialization" | "hospital">;
export type PatientDoctor = string | DoctorSummary;

export type Patient = {
  _id: string;
  name: string;
  dateOfBirth?: string | null;
  gender?: "female" | "male" | "non-binary" | "prefer-not-to-say" | "unspecified" | string;
  condition: string;
  phone?: string;
  email?: string;
  doctor: PatientDoctor;
  createdAt: string;
  updatedAt?: string;
};

export type Pagination = { page: number; limit: number; total: number; totalPages: number };
export type Paginated<T> = { data: T[]; pagination: Pagination };

export type AnalyticsSummary = {
  totalDoctors: number;
  totalPatients: number;
  patientsPerDoctor: Array<{
    doctorId: string;
    doctorName: string;
    specialization: string;
    patientCount: number;
  }>;
  registrationsByDay: Array<{ date: string; count: number }>;
};
