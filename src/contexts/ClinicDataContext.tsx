import React, { createContext, useContext, useState, useCallback } from 'react';
import { Patient, Visit, EyeMeasurement, Prescription, Medicine, VisitStatus, PaymentMethod } from '@/types/clinic';

interface ClinicDataContextType {
  patients: Patient[];
  visits: Visit[];
  eyeMeasurements: EyeMeasurement[];
  prescriptions: Prescription[];
  medicines: Medicine[];
  
  // Patient operations
  addPatient: (patient: Omit<Patient, 'id' | 'createdAt'>) => Patient;
  searchPatients: (query: string) => Patient[];
  
  // Visit operations
  createVisit: (patientId: string) => Visit;
  updateVisitStatus: (visitId: string, status: VisitStatus) => void;
  recordPayment: (visitId: string, method: PaymentMethod, amount: number) => void;
  getVisitsByStatus: (status: VisitStatus) => Visit[];
  getTodayVisits: () => Visit[];
  
  // Eye measurement operations
  addEyeMeasurement: (measurement: Omit<EyeMeasurement, 'id' | 'createdAt'>) => void;
  getEyeMeasurementByVisit: (visitId: string) => EyeMeasurement | undefined;
  
  // Prescription operations
  addPrescription: (prescription: Omit<Prescription, 'id' | 'createdAt' | 'dispensed'>) => void;
  getPrescriptionByVisit: (visitId: string) => Prescription | undefined;
  dispensePrescription: (prescriptionId: string, dispensedBy: string) => void;
  
  // Medicine operations
  addMedicine: (medicine: Omit<Medicine, 'id'>) => void;
  updateMedicineStock: (medicineId: string, quantity: number) => void;
  getLowStockMedicines: () => Medicine[];
}

const ClinicDataContext = createContext<ClinicDataContextType | undefined>(undefined);

// Initial mock data
const initialPatients: Patient[] = [
  { id: '1', name: 'John Smith', phone: '+1234567890', age: 45, gender: 'male', createdAt: new Date() },
  { id: '2', name: 'Maria Garcia', phone: '+1234567891', age: 32, gender: 'female', createdAt: new Date() },
  { id: '3', name: 'David Lee', phone: '+1234567892', age: 58, gender: 'male', createdAt: new Date() },
];

const initialMedicines: Medicine[] = [
  { id: '1', name: 'Artificial Tears', category: 'Eye Drops', price: 15.00, stock: 50, lowStockThreshold: 10 },
  { id: '2', name: 'Antibiotic Eye Drops', category: 'Antibiotics', price: 25.00, stock: 30, lowStockThreshold: 10 },
  { id: '3', name: 'Anti-inflammatory Drops', category: 'Anti-inflammatory', price: 35.00, stock: 8, lowStockThreshold: 10 },
  { id: '4', name: 'Glaucoma Drops', category: 'Glaucoma', price: 45.00, stock: 20, lowStockThreshold: 10 },
  { id: '5', name: 'Vitamin A Supplements', category: 'Vitamins', price: 12.00, stock: 5, lowStockThreshold: 15 },
];

const initialVisits: Visit[] = [
  { id: 'v1', patientId: '1', queueNumber: 1, status: 'eye_measurement', createdAt: new Date() },
  { id: 'v2', patientId: '2', queueNumber: 2, status: 'with_doctor', createdAt: new Date() },
];

const initialEyeMeasurements: EyeMeasurement[] = [
  {
    id: 'em1',
    visitId: 'v2',
    visualAcuityRight: '20/40',
    visualAcuityLeft: '20/30',
    rightEye: { sph: -1.5, cyl: -0.5, axis: 90 },
    leftEye: { sph: -1.25, cyl: -0.75, axis: 85 },
    pd: 62,
    createdAt: new Date(),
    createdBy: '2',
  },
];

export const ClinicDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [patients, setPatients] = useState<Patient[]>(initialPatients);
  const [visits, setVisits] = useState<Visit[]>(initialVisits);
  const [eyeMeasurements, setEyeMeasurements] = useState<EyeMeasurement[]>(initialEyeMeasurements);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>(initialMedicines);
  const [queueCounter, setQueueCounter] = useState(3);

  const addPatient = useCallback((patientData: Omit<Patient, 'id' | 'createdAt'>): Patient => {
    const newPatient: Patient = {
      ...patientData,
      id: `p${Date.now()}`,
      createdAt: new Date(),
    };
    setPatients(prev => [...prev, newPatient]);
    return newPatient;
  }, []);

  const searchPatients = useCallback((query: string): Patient[] => {
    const loweredQuery = query.toLowerCase();
    return patients.filter(p => 
      p.name.toLowerCase().includes(loweredQuery) || 
      p.phone.includes(query)
    );
  }, [patients]);

  const createVisit = useCallback((patientId: string): Visit => {
    const newVisit: Visit = {
      id: `v${Date.now()}`,
      patientId,
      queueNumber: queueCounter,
      status: 'waiting',
      createdAt: new Date(),
    };
    setVisits(prev => [...prev, newVisit]);
    setQueueCounter(prev => prev + 1);
    return newVisit;
  }, [queueCounter]);

  const updateVisitStatus = useCallback((visitId: string, status: VisitStatus) => {
    setVisits(prev => prev.map(v => 
      v.id === visitId 
        ? { ...v, status, completedAt: status === 'completed' ? new Date() : v.completedAt }
        : v
    ));
  }, []);

  const recordPayment = useCallback((visitId: string, method: PaymentMethod, amount: number) => {
    setVisits(prev => prev.map(v =>
      v.id === visitId ? { ...v, paymentMethod: method, paymentAmount: amount } : v
    ));
  }, []);

  const getVisitsByStatus = useCallback((status: VisitStatus): Visit[] => {
    return visits
      .filter(v => v.status === status)
      .map(v => ({ ...v, patient: patients.find(p => p.id === v.patientId) }));
  }, [visits, patients]);

  const getTodayVisits = useCallback((): Visit[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return visits
      .filter(v => new Date(v.createdAt) >= today)
      .map(v => ({ ...v, patient: patients.find(p => p.id === v.patientId) }));
  }, [visits, patients]);

  const addEyeMeasurement = useCallback((measurement: Omit<EyeMeasurement, 'id' | 'createdAt'>) => {
    const newMeasurement: EyeMeasurement = {
      ...measurement,
      id: `em${Date.now()}`,
      createdAt: new Date(),
    };
    setEyeMeasurements(prev => [...prev, newMeasurement]);
  }, []);

  const getEyeMeasurementByVisit = useCallback((visitId: string): EyeMeasurement | undefined => {
    return eyeMeasurements.find(em => em.visitId === visitId);
  }, [eyeMeasurements]);

  const addPrescription = useCallback((prescription: Omit<Prescription, 'id' | 'createdAt' | 'dispensed'>) => {
    const newPrescription: Prescription = {
      ...prescription,
      id: `rx${Date.now()}`,
      createdAt: new Date(),
      dispensed: false,
    };
    setPrescriptions(prev => [...prev, newPrescription]);
  }, []);

  const getPrescriptionByVisit = useCallback((visitId: string): Prescription | undefined => {
    return prescriptions.find(p => p.visitId === visitId);
  }, [prescriptions]);

  const dispensePrescription = useCallback((prescriptionId: string, dispensedBy: string) => {
    setPrescriptions(prev => prev.map(p => {
      if (p.id === prescriptionId) {
        // Reduce stock for each medicine
        p.medicines.forEach(med => {
          setMedicines(meds => meds.map(m =>
            m.id === med.medicineId ? { ...m, stock: Math.max(0, m.stock - med.quantity) } : m
          ));
        });
        return { ...p, dispensed: true, dispensedAt: new Date(), dispensedBy };
      }
      return p;
    }));
  }, []);

  const addMedicine = useCallback((medicine: Omit<Medicine, 'id'>) => {
    const newMedicine: Medicine = {
      ...medicine,
      id: `med${Date.now()}`,
    };
    setMedicines(prev => [...prev, newMedicine]);
  }, []);

  const updateMedicineStock = useCallback((medicineId: string, quantity: number) => {
    setMedicines(prev => prev.map(m =>
      m.id === medicineId ? { ...m, stock: m.stock + quantity } : m
    ));
  }, []);

  const getLowStockMedicines = useCallback((): Medicine[] => {
    return medicines.filter(m => m.stock <= m.lowStockThreshold);
  }, [medicines]);

  return (
    <ClinicDataContext.Provider value={{
      patients,
      visits,
      eyeMeasurements,
      prescriptions,
      medicines,
      addPatient,
      searchPatients,
      createVisit,
      updateVisitStatus,
      recordPayment,
      getVisitsByStatus,
      getTodayVisits,
      addEyeMeasurement,
      getEyeMeasurementByVisit,
      addPrescription,
      getPrescriptionByVisit,
      dispensePrescription,
      addMedicine,
      updateMedicineStock,
      getLowStockMedicines,
    }}>
      {children}
    </ClinicDataContext.Provider>
  );
};

export const useClinicData = () => {
  const context = useContext(ClinicDataContext);
  if (!context) {
    throw new Error('useClinicData must be used within a ClinicDataProvider');
  }
  return context;
};
