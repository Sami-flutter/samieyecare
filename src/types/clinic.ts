export type UserRole = 'reception' | 'eye_measurement' | 'doctor' | 'pharmacy' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface Patient {
  id: string;
  name: string;
  phone: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  createdAt: Date;
}

export type VisitStatus = 'waiting' | 'eye_measurement' | 'with_doctor' | 'pharmacy' | 'completed';
export type PaymentMethod = 'cash' | 'card' | 'mobile';

export interface Visit {
  id: string;
  patientId: string;
  patient?: Patient;
  queueNumber: number;
  status: VisitStatus;
  paymentMethod?: PaymentMethod;
  paymentAmount?: number;
  createdAt: Date;
  completedAt?: Date;
}

export interface EyeMeasurement {
  id: string;
  visitId: string;
  visualAcuityRight?: string;
  visualAcuityLeft?: string;
  rightEye: {
    sph?: number;
    cyl?: number;
    axis?: number;
  };
  leftEye: {
    sph?: number;
    cyl?: number;
    axis?: number;
  };
  pd?: number;
  iopRight?: number;
  iopLeft?: number;
  notes?: string;
  createdAt: Date;
  createdBy: string;
}

export interface Prescription {
  id: string;
  visitId: string;
  diagnosis: string;
  medicines: PrescriptionMedicine[];
  followUpNote?: string;
  createdAt: Date;
  createdBy: string;
  dispensed: boolean;
  dispensedAt?: Date;
  dispensedBy?: string;
}

export interface PrescriptionMedicine {
  medicineId: string;
  medicineName: string;
  quantity: number;
  dosage: string;
}

export interface Medicine {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  lowStockThreshold: number;
}
