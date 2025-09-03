import '@react-three/fiber';

// --- ENUMS from schema.sql ---
export type UserRole = 'admin' | 'doctor' | 'patient' | 'staff';
export type ConsultStatus = 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled' | 'no_show';
export type MessageType = 'text' | 'file' | 'system';
export type AnalyzerType = 'text' | 'image' | 'multimodal';
export type SeverityLevel = 'low' | 'moderate' | 'high' | 'critical';
export type ConsentScope = 'live_interaction' | 'share_reports' | 'analysis' | 'billing' | 'research';
export type Pathy = 'Allopathic' | 'Ayurvedic' | 'Homeopathic' | 'Unani';


// --- App-specific UI types ---
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export type View = 'dashboard' | 'chatbot' | 'connect-doctor' | 'symptom-checker' | 'medicine-search' | 'xray-analyzer' | 'lab-test-analyzer' | 'prescription-analyzer' | 'pharmacies' | 'donate' | 'ct-analyzer' | 'mri-analyzer' | 'ecg-analyzer' | 'eeg-analyzer' | 'derma-scan-analyzer' | 'pain-locator' | 'settings' | 'live-chat' | 'messages' | 'prakruti-parikshana' | 'prakruti-progress' | 'diabetic-retinopathy-analyzer';
export type DoctorView = 'dashboard' | 'patients' | 'messages' | 'schedule' | 'medicine-search' | 'settings' | 'consultation-details';
export type AdminView = 'dashboard' | 'users' | 'analytics' | 'settings';

export type AuthView = {
    view: 'login' | 'signup';
    role: UserRole;
} | {
    view: 'portal';
    role: null;
};

export interface PlatformStats {
    total_patients: number;
    total_doctors: number;
    total_consultations: number;
}

export interface AnalyzerUsage {
    analyzer: string;
    count: number;
}

export interface LiveUser {
    user_id: string;
    full_name: string;
    role: UserRole;
    online_at: string;
}

export interface ManagedUser {
    id: string;
    full_name: string;
    role: UserRole;
    created_at: string;
}

// --- NEW Dashboard-specific types ---
export interface DashboardAppointment {
  id: number;
  start_at: string;
  doctor_name: string | null;
}

export interface DashboardAnalysis {
  id: number;
  created_at: string;
  analyzer_type: string;
}

export interface DashboardConsultation {
  id: number;
  subject: string | null;
  doctor_id: string;
  doctor_name: string | null;
  doctor_avatar: string | null;
}


export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// --- Supabase database types from schema.sql ---
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string,
          role: UserRole,
          full_name: string | null,
          email: string | null,
          phone: string | null,
          dob: string | null, // date
          avatar_url: string | null,
          created_at: string, // timestamptz
          updated_at: string, // timestamptz
        },
        Insert: {
          id: string, // uuid
          role?: UserRole,
          full_name?: string | null,
          email?: string | null,
          phone?: string | null,
          dob?: string | null,
          avatar_url?: string | null,
        },
        Update: {
          role?: UserRole,
          full_name?: string | null,
          email?: string | null,
          phone?: string | null,
          dob?: string | null,
          avatar_url?: string | null,
        },
      },
      prakruti_analysis: {
        Row: {
          id: number,
          user_id: string,
          prakruti_type: string | null,
          summary: string | null,
          form_responses: Json | null,
          certificate_url: string | null,
          vata_score: number | null,
          pitta_score: number | null,
          kapha_score: number | null,
          created_at: string, // timestamptz
        },
        Insert: {
          user_id: string,
          prakruti_type?: string | null,
          summary?: string | null,
          form_responses?: Json | null,
          certificate_url?: string | null,
          vata_score?: number | null,
          pitta_score?: number | null,
          kapha_score?: number | null,
        },
        Update: {
          prakruti_type?: string | null,
          summary?: string | null,
          form_responses?: Json | null,
          certificate_url?: string | null,
          vata_score?: number | null,
          pitta_score?: number | null,
          kapha_score?: number | null,
        },
      },
      prakruti_log: {
        Row: {
            id: number,
            user_id: string,
            log_date: string, // date
            entry: string,
            created_at: string, // timestamptz
        },
        Insert: {
            user_id: string,
            log_date?: string,
            entry: string,
        },
        Update: {
            entry?: string,
        },
      },
      patient_details: {
        Row: {
          patient_id: string,
          blood_group: string | null,
          height_cm: number | null,
          weight_kg: number | null,
          allergies: string[] | null,
          chronic_conditions: string[] | null,
          medications: Json | null,
          emergency_contact: Json | null,
          created_at: string,
          updated_at: string,
        },
        Insert: {
          patient_id: string,
          blood_group?: string | null,
          height_cm?: number | null,
          weight_kg?: number | null,
          allergies?: string[] | null,
          chronic_conditions?: string[] | null,
          medications?: Json | null,
          emergency_contact?: Json | null,
        },
        Update: {
          blood_group?: string | null,
          height_cm?: number | null,
          weight_kg?: number | null,
          allergies?: string[] | null,
          chronic_conditions?: string[] | null,
          medications?: Json | null,
          emergency_contact?: Json | null,
        },
      },
      doctor_details: {
        Row: {
          doctor_id: string,
          license_number: string | null,
          specialties: string[] | null,
          years_experience: number | null,
          clinic_name: string | null,
          about: string | null,
          pathy: Pathy | null,
          created_at: string,
          updated_at: string,
        },
        Insert: {
          doctor_id: string,
          license_number?: string | null,
          specialties?: string[] | null,
          years_experience?: number | null,
          clinic_name?: string | null,
          about?: string | null,
          pathy?: Pathy | null,
        },
        Update: {
          license_number?: string | null,
          specialties?: string[] | null,
          years_experience?: number | null,
          clinic_name?: string | null,
          about?: string | null,
          pathy?: Pathy | null,
        },
      },
      patient_doctor_links: {
        Row: {
          id: number,
          patient_id: string,
          doctor_id: string,
          relationship_type: string,
          active: boolean,
          created_at: string,
        },
        Insert: {
          patient_id: string,
          doctor_id: string,
          relationship_type?: string,
          active?: boolean,
        },
        Update: {
          active?: boolean,
        },
      },
      appointments: {
        Row: {
          id: number,
          patient_id: string,
          doctor_id: string,
          start_at: string,
          end_at: string | null,
          status: ConsultStatus | null,
          location: string | null,
          created_by: string | null,
          created_at: string,
          updated_at: string,
        },
        Insert: {
          patient_id: string,
          doctor_id: string,
          start_at: string,
          end_at?: string | null,
          status?: ConsultStatus | null,
          location?: string | null,
          created_by?: string | null,
        },
        Update: {
          start_at?: string,
          end_at?: string | null,
          status?: ConsultStatus | null,
          location?: string | null,
        },
      },
      consultations: {
        Row: {
          id: number,
          appointment_id: number | null,
          patient_id: string,
          doctor_id: string,
          started_at: string,
          ended_at: string | null,
          subjective: string | null,
          objective: string | null,
          assessment: string | null,
          plan: string | null,
          transcript: string | null,
          subject: string | null,
          created_by: string | null,
          created_at: string,
          updated_at: string,
          status: ConsultStatus | null,
          // For UI enrichment from joins
          patient_name?: string,
          patient_avatar?: string,
        },
        Insert: {
          appointment_id?: number | null,
          patient_id: string,
          doctor_id: string,
          subject?: string | null,
          created_by?: string | null,
          status?: ConsultStatus | null,
        },
        Update: {
          ended_at?: string | null,
          subjective?: string | null,
          objective?: string | null,
          assessment?: string | null,
          plan?: string | null,
          transcript?: string | null,
          subject?: string | null,
          status?: ConsultStatus | null,
        },
      },
      consultation_messages: {
        Row: {
          id: number,
          consultation_id: number,
          sender_id: string,
          message_type: MessageType,
          content: string | null,
          file_id: number | null,
          created_at: string,
        },
        Insert: {
          consultation_id: number,
          sender_id: string,
          message_type?: MessageType,
          content?: string | null,
          file_id?: number | null,
        },
        Update: {
          content?: string | null,
        },
      },
      ai_analysis_log: {
        Row: {
          id: number,
          user_id: string,
          analyzer_type: string,
          created_at: string,
        },
        Insert: {
          user_id: string,
          analyzer_type: string,
        },
        Update: {},
      },
      // --- LEGACY tables for existing UI ---
      medicines: {
        Row: {
          id: number,
          name: string,
          price: number | null,
          is_discontinued: boolean | null,
          manufacturer_name: string | null,
          type: string | null,
          pack_size_label: string | null,
          short_composition1: string | null,
          short_composition2: string | null,
        },
        Insert: {
          name: string,
          price?: number | null,
          is_discontinued?: boolean | null,
          manufacturer_name?: string | null,
          type?: string | null,
          pack_size_label?: string | null,
          short_composition1?: string | null,
          short_composition2?: string | null,
        },
        Update: {
          name?: string,
          price?: number | null,
          is_discontinued?: boolean | null,
          manufacturer_name?: string | null,
          type?: string | null,
          pack_size_label?: string | null,
          short_composition1?: string | null,
          short_composition2?: string | null,
        },
      },
      ayush_medicines: {
        Row: {
          id: number,
          manufacturer_name: string | null,
          brand_name: string | null,
          dosage_description: string | null,
          generic_name_and_strength: string | null,
          dar: string | null,
          medicine_type: 'Ayurvedic' | 'Homeopathic' | 'Unani',
        },
        Insert: {
          manufacturer_name?: string | null,
          brand_name?: string | null,
          dosage_description?: string | null,
          generic_name_and_strength?: string | null,
          dar?: string | null,
          medicine_type: 'Ayurvedic' | 'Homeopathic' | 'Unani',
        },
        Update: {
          manufacturer_name?: string | null,
          brand_name?: string | null,
          dosage_description?: string | null,
          generic_name_and_strength?: string | null,
          dar?: string | null,
          medicine_type?: 'Ayurvedic' | 'Homeopathic' | 'Unani',
        },
      },
    },
    Views: {
      platform_stats_view: {
        Row: {
            total_patients: number,
            total_doctors: number,
            total_consultations: number,
        },
      },
      v_doctor_dashboard_stats: {
        Row: {
            doctor_id: string,
            active_patients: number,
            consults_30d: number,
            live_consults: number,
            avg_consult_minutes: number | null,
            analyses_30d: number,
        }
      },
      v_doctor_recent_activity: {
        Row: {
            doctor_id: string,
            event_id: number,
            event_type: 'consultation_completed' | 'new_patient_assigned',
            event_timestamp: string,
            details: Json,
        }
      }
    },
    Functions: {
        handle_new_user: {
            Args: Record<string, never>,
            Returns: undefined
        }
    },
  },
}

// Exported types for components
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Consultation = Database['public']['Tables']['consultations']['Row'];
export type Medicine = Database['public']['Tables']['medicines']['Row'];
export type AyushMedicine = Database['public']['Tables']['ayush_medicines']['Row'];
export type PrakrutiAnalysis = Database['public']['Tables']['prakruti_analysis']['Row'];
export type PrakrutiLog = Database['public']['Tables']['prakruti_log']['Row'];


// New types for Doctor Dashboard enhancements
export type DoctorDashboardStats = Database['public']['Views']['v_doctor_dashboard_stats']['Row'];
export type RecentActivity = Database['public']['Views']['v_doctor_recent_activity']['Row'];
export type UpcomingAppointment = Pick<Database['public']['Tables']['appointments']['Row'], 'id' | 'start_at' | 'status'> & {
    patient_name: string;
    patient_avatar: string | null;
};