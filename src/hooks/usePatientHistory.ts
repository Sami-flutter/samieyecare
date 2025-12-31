import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface EyeMeasurement {
  id: string;
  visual_acuity_right: string | null;
  visual_acuity_left: string | null;
  right_sph: number | null;
  right_cyl: number | null;
  right_axis: number | null;
  left_sph: number | null;
  left_cyl: number | null;
  left_axis: number | null;
  pd: number | null;
  iop_right: number | null;
  iop_left: number | null;
  notes: string | null;
  created_at: string;
}

interface PrescriptionMedicine {
  id: string;
  medicine_name: string;
  quantity: number;
  dosage: string;
}

interface Prescription {
  id: string;
  diagnosis: string;
  follow_up_note: string | null;
  dispensed: boolean;
  dispensed_at: string | null;
  created_at: string;
  prescription_medicines: PrescriptionMedicine[];
}

interface VisitWithDetails {
  id: string;
  queue_number: number;
  status: string;
  payment_method: string | null;
  payment_amount: number | null;
  created_at: string;
  completed_at: string | null;
  eye_measurement: EyeMeasurement | null;
  prescription: Prescription | null;
}

interface PatientHistory {
  totalVisits: number;
  totalPrescriptions: number;
  visits: VisitWithDetails[];
}

export function usePatientHistory(patientId: string | null) {
  return useQuery({
    queryKey: ['patient-history', patientId],
    queryFn: async (): Promise<PatientHistory | null> => {
      if (!patientId) return null;

      // Fetch all visits for this patient with eye measurements
      const { data: visits, error: visitsError } = await supabase
        .from('visits')
        .select(`
          id,
          queue_number,
          status,
          payment_method,
          payment_amount,
          created_at,
          completed_at
        `)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (visitsError) throw visitsError;

      if (!visits || visits.length === 0) {
        return {
          totalVisits: 0,
          totalPrescriptions: 0,
          visits: [],
        };
      }

      // Fetch eye measurements for all visits
      const visitIds = visits.map((v) => v.id);

      const { data: eyeMeasurements, error: emError } = await supabase
        .from('eye_measurements')
        .select('*')
        .in('visit_id', visitIds);

      if (emError) throw emError;

      // Fetch prescriptions with medicines for all visits
      const { data: prescriptions, error: prescError } = await supabase
        .from('prescriptions')
        .select(`
          *,
          prescription_medicines(*)
        `)
        .in('visit_id', visitIds);

      if (prescError) throw prescError;

      // Map eye measurements and prescriptions to visits
      const visitsWithDetails: VisitWithDetails[] = visits.map((visit) => {
        const eyeMeasurement = eyeMeasurements?.find((em) => em.visit_id === visit.id) || null;
        const prescription = prescriptions?.find((p) => p.visit_id === visit.id) || null;

        return {
          ...visit,
          eye_measurement: eyeMeasurement
            ? {
                id: eyeMeasurement.id,
                visual_acuity_right: eyeMeasurement.visual_acuity_right,
                visual_acuity_left: eyeMeasurement.visual_acuity_left,
                right_sph: eyeMeasurement.right_sph,
                right_cyl: eyeMeasurement.right_cyl,
                right_axis: eyeMeasurement.right_axis,
                left_sph: eyeMeasurement.left_sph,
                left_cyl: eyeMeasurement.left_cyl,
                left_axis: eyeMeasurement.left_axis,
                pd: eyeMeasurement.pd,
                iop_right: eyeMeasurement.iop_right,
                iop_left: eyeMeasurement.iop_left,
                notes: eyeMeasurement.notes,
                created_at: eyeMeasurement.created_at,
              }
            : null,
          prescription: prescription
            ? {
                id: prescription.id,
                diagnosis: prescription.diagnosis,
                follow_up_note: prescription.follow_up_note,
                dispensed: prescription.dispensed,
                dispensed_at: prescription.dispensed_at,
                created_at: prescription.created_at,
                prescription_medicines: prescription.prescription_medicines || [],
              }
            : null,
        };
      });

      return {
        totalVisits: visits.length,
        totalPrescriptions: prescriptions?.length || 0,
        visits: visitsWithDetails,
      };
    },
    enabled: !!patientId,
  });
}
