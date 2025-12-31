import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

// Type definitions matching database schema
export interface Patient {
  id: string;
  name: string;
  phone: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  created_at: string;
  updated_at: string;
}

export interface Visit {
  id: string;
  patient_id: string;
  queue_number: number;
  status: 'waiting' | 'eye_measurement' | 'with_doctor' | 'pharmacy' | 'completed';
  payment_method?: 'cash' | 'card' | 'mobile';
  payment_amount?: number;
  created_at: string;
  completed_at?: string;
  patient?: Patient;
}

export interface EyeMeasurement {
  id: string;
  visit_id: string;
  visual_acuity_right?: string;
  visual_acuity_left?: string;
  right_sph?: number;
  right_cyl?: number;
  right_axis?: number;
  left_sph?: number;
  left_cyl?: number;
  left_axis?: number;
  pd?: number;
  iop_right?: number;
  iop_left?: number;
  notes?: string;
  created_at: string;
  created_by: string;
}

export interface Medicine {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  low_stock_threshold: number;
  created_at: string;
  updated_at: string;
}

export interface PrescriptionMedicine {
  id: string;
  prescription_id: string;
  medicine_id: string;
  medicine_name: string;
  quantity: number;
  dosage: string;
}

export interface Prescription {
  id: string;
  visit_id: string;
  diagnosis: string;
  follow_up_note?: string;
  dispensed: boolean;
  dispensed_at?: string;
  dispensed_by?: string;
  created_at: string;
  created_by: string;
  medicines?: PrescriptionMedicine[];
}

// Patients hooks
export function usePatients() {
  return useQuery({
    queryKey: ['patients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Patient[];
    },
  });
}

export function useSearchPatients(searchTerm: string) {
  return useQuery({
    queryKey: ['patients', 'search', searchTerm],
    queryFn: async () => {
      if (!searchTerm) return [];
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .or(`name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
        .limit(10);
      if (error) throw error;
      return data as Patient[];
    },
    enabled: searchTerm.length > 0,
  });
}

export function useCreatePatient() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (patient: Omit<Patient, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('patients')
        .insert(patient)
        .select()
        .single();
      if (error) throw error;
      return data as Patient;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      toast({ title: 'Patient registered successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error registering patient', description: error.message, variant: 'destructive' });
    },
  });
}

// Visits hooks
export function useTodayVisits() {
  const today = new Date().toISOString().split('T')[0];
  
  return useQuery({
    queryKey: ['visits', 'today'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('visits')
        .select(`
          *,
          patient:patients(*)
        `)
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`)
        .order('queue_number', { ascending: true });
      if (error) throw error;
      return data as (Visit & { patient: Patient })[];
    },
  });
}

export function useVisitsByStatus(status: Visit['status']) {
  const today = new Date().toISOString().split('T')[0];
  
  return useQuery({
    queryKey: ['visits', 'status', status],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('visits')
        .select(`
          *,
          patient:patients(*)
        `)
        .eq('status', status)
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`)
        .order('queue_number', { ascending: true });
      if (error) throw error;
      return data as (Visit & { patient: Patient })[];
    },
  });
}

export function useCreateVisit() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ patientId }: { patientId: string }) => {
      // Get today's max queue number
      const today = new Date().toISOString().split('T')[0];
      const { data: existingVisits } = await supabase
        .from('visits')
        .select('queue_number')
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`)
        .order('queue_number', { ascending: false })
        .limit(1);
      
      const nextQueueNumber = (existingVisits?.[0]?.queue_number || 0) + 1;

      const { data, error } = await supabase
        .from('visits')
        .insert({
          patient_id: patientId,
          queue_number: nextQueueNumber,
          status: 'waiting' as const,
        })
        .select()
        .single();
      if (error) throw error;
      return data as Visit;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['visits'] });
      toast({ title: `Visit created - Queue #${data.queue_number}` });
    },
    onError: (error: Error) => {
      toast({ title: 'Error creating visit', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateVisitStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ visitId, status, completedAt }: { visitId: string; status: Visit['status']; completedAt?: string }) => {
      const updateData: Partial<Visit> = { status };
      if (completedAt) updateData.completed_at = completedAt;
      
      const { data, error } = await supabase
        .from('visits')
        .update(updateData)
        .eq('id', visitId)
        .select()
        .single();
      if (error) throw error;
      return data as Visit;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits'] });
    },
  });
}

export function useRecordPayment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ visitId, method, amount }: { visitId: string; method: 'cash' | 'card' | 'mobile'; amount: number }) => {
      const { data, error } = await supabase
        .from('visits')
        .update({ payment_method: method, payment_amount: amount })
        .eq('id', visitId)
        .select()
        .single();
      if (error) throw error;
      return data as Visit;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits'] });
      toast({ title: 'Payment recorded' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error recording payment', description: error.message, variant: 'destructive' });
    },
  });
}

// Eye measurements hooks
export function useEyeMeasurement(visitId: string) {
  return useQuery({
    queryKey: ['eye_measurements', visitId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('eye_measurements')
        .select('*')
        .eq('visit_id', visitId)
        .maybeSingle();
      if (error) throw error;
      return data as EyeMeasurement | null;
    },
    enabled: !!visitId,
  });
}

export function useCreateEyeMeasurement() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (measurement: Omit<EyeMeasurement, 'id' | 'created_at' | 'created_by'>) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('eye_measurements')
        .insert({ ...measurement, created_by: user.id })
        .select()
        .single();
      if (error) throw error;
      return data as EyeMeasurement;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eye_measurements'] });
      queryClient.invalidateQueries({ queryKey: ['visits'] });
      toast({ title: 'Eye measurement saved' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error saving measurement', description: error.message, variant: 'destructive' });
    },
  });
}

// Medicines hooks
export function useMedicines() {
  return useQuery({
    queryKey: ['medicines'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('medicines')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      return data as Medicine[];
    },
  });
}

export function useLowStockMedicines() {
  return useQuery({
    queryKey: ['medicines', 'low_stock'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('medicines')
        .select('*');
      if (error) throw error;
      return (data as Medicine[]).filter(m => m.stock <= m.low_stock_threshold);
    },
  });
}

export function useCreateMedicine() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (medicine: Omit<Medicine, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('medicines')
        .insert(medicine)
        .select()
        .single();
      if (error) throw error;
      return data as Medicine;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicines'] });
      toast({ title: 'Medicine added successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error adding medicine', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateMedicineStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ medicineId, stock }: { medicineId: string; stock: number }) => {
      const { data, error } = await supabase
        .from('medicines')
        .update({ stock })
        .eq('id', medicineId)
        .select()
        .single();
      if (error) throw error;
      return data as Medicine;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicines'] });
    },
  });
}

// Prescriptions hooks
export function usePrescription(visitId: string) {
  return useQuery({
    queryKey: ['prescriptions', visitId],
    queryFn: async () => {
      const { data: prescription, error } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('visit_id', visitId)
        .maybeSingle();
      if (error) throw error;
      if (!prescription) return null;

      const { data: medicines } = await supabase
        .from('prescription_medicines')
        .select('*')
        .eq('prescription_id', prescription.id);

      return { ...prescription, medicines: medicines || [] } as Prescription;
    },
    enabled: !!visitId,
  });
}

export function usePendingPrescriptions() {
  const today = new Date().toISOString().split('T')[0];
  
  return useQuery({
    queryKey: ['prescriptions', 'pending'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prescriptions')
        .select(`
          *,
          visit:visits!inner(
            *,
            patient:patients(*)
          )
        `)
        .eq('dispensed', false)
        .gte('created_at', `${today}T00:00:00`)
        .order('created_at', { ascending: true });
      if (error) throw error;

      // Fetch medicines for each prescription
      const prescriptionsWithMedicines = await Promise.all(
        (data || []).map(async (p) => {
          const { data: medicines } = await supabase
            .from('prescription_medicines')
            .select('*')
            .eq('prescription_id', p.id);
          return { ...p, medicines: medicines || [] };
        })
      );

      return prescriptionsWithMedicines;
    },
  });
}

export function useCreatePrescription() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      visitId, 
      diagnosis, 
      followUpNote, 
      medicines 
    }: { 
      visitId: string; 
      diagnosis: string; 
      followUpNote?: string; 
      medicines: Omit<PrescriptionMedicine, 'id' | 'prescription_id'>[] 
    }) => {
      if (!user) throw new Error('Not authenticated');

      // Create prescription
      const { data: prescription, error } = await supabase
        .from('prescriptions')
        .insert({
          visit_id: visitId,
          diagnosis,
          follow_up_note: followUpNote,
          created_by: user.id,
        })
        .select()
        .single();
      if (error) throw error;

      // Add medicines
      if (medicines.length > 0) {
        const { error: medError } = await supabase
          .from('prescription_medicines')
          .insert(
            medicines.map(m => ({
              prescription_id: prescription.id,
              medicine_id: m.medicine_id,
              medicine_name: m.medicine_name,
              quantity: m.quantity,
              dosage: m.dosage,
            }))
          );
        if (medError) throw medError;
      }

      return prescription as Prescription;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
      queryClient.invalidateQueries({ queryKey: ['visits'] });
      toast({ title: 'Prescription created' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error creating prescription', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDispensePrescription() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ prescriptionId, medicines }: { prescriptionId: string; medicines: PrescriptionMedicine[] }) => {
      if (!user) throw new Error('Not authenticated');

      // Mark as dispensed
      const { error } = await supabase
        .from('prescriptions')
        .update({
          dispensed: true,
          dispensed_at: new Date().toISOString(),
          dispensed_by: user.id,
        })
        .eq('id', prescriptionId);
      if (error) throw error;

      // Reduce stock for each medicine
      for (const med of medicines) {
        const { data: medicine } = await supabase
          .from('medicines')
          .select('stock')
          .eq('id', med.medicine_id)
          .single();
        
        if (medicine) {
          await supabase
            .from('medicines')
            .update({ stock: Math.max(0, medicine.stock - med.quantity) })
            .eq('id', med.medicine_id);
        }
      }

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
      queryClient.invalidateQueries({ queryKey: ['medicines'] });
      queryClient.invalidateQueries({ queryKey: ['visits'] });
      toast({ title: 'Prescription dispensed' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error dispensing prescription', description: error.message, variant: 'destructive' });
    },
  });
}

// Stats hooks
export function useDailyStats() {
  const today = new Date().toISOString().split('T')[0];
  
  return useQuery({
    queryKey: ['stats', 'daily'],
    queryFn: async () => {
      const { data: visits, error } = await supabase
        .from('visits')
        .select('*')
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`);
      if (error) throw error;

      const totalPatients = visits?.length || 0;
      const completed = visits?.filter(v => v.status === 'completed').length || 0;
      const waiting = visits?.filter(v => v.status !== 'completed').length || 0;
      const totalIncome = visits?.reduce((sum, v) => sum + (Number(v.payment_amount) || 0), 0) || 0;
      const cashPayments = visits?.filter(v => v.payment_method === 'cash').reduce((sum, v) => sum + (Number(v.payment_amount) || 0), 0) || 0;
      const cardPayments = visits?.filter(v => v.payment_method === 'card').reduce((sum, v) => sum + (Number(v.payment_amount) || 0), 0) || 0;
      const mobilePayments = visits?.filter(v => v.payment_method === 'mobile').reduce((sum, v) => sum + (Number(v.payment_amount) || 0), 0) || 0;

      return {
        totalPatients,
        completed,
        waiting,
        totalIncome,
        cashPayments,
        cardPayments,
        mobilePayments,
      };
    },
  });
}

export function useAllTimeStats() {
  return useQuery({
    queryKey: ['stats', 'all_time'],
    queryFn: async () => {
      const { data: visits, error } = await supabase
        .from('visits')
        .select('*');
      if (error) throw error;

      const { data: patients } = await supabase
        .from('patients')
        .select('id');

      const totalPatients = patients?.length || 0;
      const totalVisits = visits?.length || 0;
      const totalIncome = visits?.reduce((sum, v) => sum + (Number(v.payment_amount) || 0), 0) || 0;

      return {
        totalPatients,
        totalVisits,
        totalIncome,
      };
    },
  });
}
