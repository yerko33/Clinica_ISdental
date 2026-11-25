export enum Specialty {
  Estetica = "Estética Dental",
  Implantologia = "Implantología 3D",
  Ortodoncia = "Ortodoncia Invisible",
  LaserPreventiva = "Láser & Preventiva"
}

export interface SpecialtyItem {
  id: string;
  name: string;
  description: string;
  isDefault?: boolean;
}

export type DayOfWeek =
  | "Lunes"
  | "Martes"
  | "Miércoles"
  | "Jueves"
  | "Viernes"
  | "Sábado";

export interface DaySchedule {
  enabled: boolean;
  slots: string[];
}

export type DoctorSchedule = Record<DayOfWeek, DaySchedule>;

export interface Treatment {
  id: string;
  name: string;
  specialty: string;
  description: string;
  duration: string;
  highlight: string;
  techUsed: string;
  estimatedCost: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  experienceYears: number;
  image: string;
  bio: string;
  education: string;
  rating: number;
  schedule: DoctorSchedule;
  isDefault?: boolean;
}

export type AppointmentStatus = "confirmada" | "atendida" | "cancelada";

export interface Appointment {
  id: string;
  patientName: string;
  patientRut: string;
  patientEmail: string;
  patientPhone: string;
  treatmentId: string;
  treatmentName?: string;
  doctorId: string;
  doctorName?: string;
  date: string;
  timeSlot: string;
  status: AppointmentStatus;
  notes?: string;
  createdAt: string;
}

export interface StaffRoleRecord {
  uid: string;
  email: string;
  isAdmin: boolean;
  isRecepcionista: boolean;
}

export interface Testimonial {
  id: string;
  name: string;
  treatment: string;
  text: string;
  rating: number;
  date: string;
  verified: boolean;
}
