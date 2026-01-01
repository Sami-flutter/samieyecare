export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      eye_measurements: {
        Row: {
          created_at: string
          created_by: string
          id: string
          iop_left: number | null
          iop_right: number | null
          left_axis: number | null
          left_cyl: number | null
          left_sph: number | null
          notes: string | null
          pd: number | null
          right_axis: number | null
          right_cyl: number | null
          right_sph: number | null
          visit_id: string
          visual_acuity_left: string | null
          visual_acuity_right: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          iop_left?: number | null
          iop_right?: number | null
          left_axis?: number | null
          left_cyl?: number | null
          left_sph?: number | null
          notes?: string | null
          pd?: number | null
          right_axis?: number | null
          right_cyl?: number | null
          right_sph?: number | null
          visit_id: string
          visual_acuity_left?: string | null
          visual_acuity_right?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          iop_left?: number | null
          iop_right?: number | null
          left_axis?: number | null
          left_cyl?: number | null
          left_sph?: number | null
          notes?: string | null
          pd?: number | null
          right_axis?: number | null
          right_cyl?: number | null
          right_sph?: number | null
          visit_id?: string
          visual_acuity_left?: string | null
          visual_acuity_right?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "eye_measurements_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      medicines: {
        Row: {
          category: string
          created_at: string
          id: string
          low_stock_threshold: number
          name: string
          price: number
          stock: number
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          low_stock_threshold?: number
          name: string
          price: number
          stock?: number
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          low_stock_threshold?: number
          name?: string
          price?: number
          stock?: number
          updated_at?: string
        }
        Relationships: []
      }
      patients: {
        Row: {
          age: number
          created_at: string
          gender: Database["public"]["Enums"]["gender"]
          id: string
          name: string
          phone: string
          updated_at: string
        }
        Insert: {
          age: number
          created_at?: string
          gender: Database["public"]["Enums"]["gender"]
          id?: string
          name: string
          phone: string
          updated_at?: string
        }
        Update: {
          age?: number
          created_at?: string
          gender?: Database["public"]["Enums"]["gender"]
          id?: string
          name?: string
          phone?: string
          updated_at?: string
        }
        Relationships: []
      }
      pharmacy_sale_items: {
        Row: {
          id: string
          medicine_id: string
          medicine_name: string
          quantity: number
          sale_id: string
          total_price: number
          unit_price: number
        }
        Insert: {
          id?: string
          medicine_id: string
          medicine_name: string
          quantity: number
          sale_id: string
          total_price: number
          unit_price: number
        }
        Update: {
          id?: string
          medicine_id?: string
          medicine_name?: string
          quantity?: number
          sale_id?: string
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "pharmacy_sale_items_medicine_id_fkey"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pharmacy_sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "pharmacy_sales"
            referencedColumns: ["id"]
          },
        ]
      }
      pharmacy_sales: {
        Row: {
          created_at: string
          created_by: string
          id: string
          paid: boolean
          paid_at: string | null
          patient_id: string
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          prescription_id: string
          total_amount: number
          visit_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          paid?: boolean
          paid_at?: string | null
          patient_id: string
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          prescription_id: string
          total_amount?: number
          visit_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          paid?: boolean
          paid_at?: string | null
          patient_id?: string
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          prescription_id?: string
          total_amount?: number
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pharmacy_sales_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pharmacy_sales_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pharmacy_sales_prescription_id_fkey"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "prescriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pharmacy_sales_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      prescription_medicines: {
        Row: {
          dosage: string
          id: string
          medicine_id: string
          medicine_name: string
          prescription_id: string
          quantity: number
        }
        Insert: {
          dosage: string
          id?: string
          medicine_id: string
          medicine_name: string
          prescription_id: string
          quantity: number
        }
        Update: {
          dosage?: string
          id?: string
          medicine_id?: string
          medicine_name?: string
          prescription_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "prescription_medicines_medicine_id_fkey"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescription_medicines_prescription_id_fkey"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "prescriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      prescriptions: {
        Row: {
          buy_from_clinic: boolean
          created_at: string
          created_by: string
          diagnosis: string
          dispensed: boolean
          dispensed_at: string | null
          dispensed_by: string | null
          follow_up_note: string | null
          id: string
          visit_id: string
        }
        Insert: {
          buy_from_clinic?: boolean
          created_at?: string
          created_by: string
          diagnosis: string
          dispensed?: boolean
          dispensed_at?: string | null
          dispensed_by?: string | null
          follow_up_note?: string | null
          id?: string
          visit_id: string
        }
        Update: {
          buy_from_clinic?: boolean
          created_at?: string
          created_by?: string
          diagnosis?: string
          dispensed?: boolean
          dispensed_at?: string | null
          dispensed_by?: string | null
          follow_up_note?: string | null
          id?: string
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prescriptions_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          id: string
          name: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      visits: {
        Row: {
          completed_at: string | null
          created_at: string
          doctor_id: string | null
          id: string
          patient_id: string
          payment_amount: number | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          queue_number: number
          room_number: string | null
          status: Database["public"]["Enums"]["visit_status"]
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          doctor_id?: string | null
          id?: string
          patient_id: string
          payment_amount?: number | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          queue_number: number
          room_number?: string | null
          status?: Database["public"]["Enums"]["visit_status"]
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          doctor_id?: string | null
          id?: string
          patient_id?: string
          payment_amount?: number | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          queue_number?: number
          room_number?: string | null
          status?: Database["public"]["Enums"]["visit_status"]
        }
        Relationships: [
          {
            foreignKeyName: "visits_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_clinic_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "reception"
        | "eye_measurement"
        | "doctor"
        | "pharmacy"
        | "admin"
      gender: "male" | "female" | "other"
      payment_method: "cash" | "card" | "mobile"
      visit_status:
        | "waiting"
        | "eye_measurement"
        | "with_doctor"
        | "pharmacy"
        | "completed"
        | "registered"
        | "in_consultation"
        | "prescribed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["reception", "eye_measurement", "doctor", "pharmacy", "admin"],
      gender: ["male", "female", "other"],
      payment_method: ["cash", "card", "mobile"],
      visit_status: [
        "waiting",
        "eye_measurement",
        "with_doctor",
        "pharmacy",
        "completed",
        "registered",
        "in_consultation",
        "prescribed",
      ],
    },
  },
} as const
