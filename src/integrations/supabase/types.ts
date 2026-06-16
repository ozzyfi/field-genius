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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ai_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          metadata: Json
          org_id: string
          role: string
          work_record_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          metadata?: Json
          org_id: string
          role: string
          work_record_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          metadata?: Json
          org_id?: string
          role?: string
          work_record_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_messages_work_record_id_fkey"
            columns: ["work_record_id"]
            isOneToOne: false
            referencedRelation: "work_records"
            referencedColumns: ["id"]
          },
        ]
      }
      evidence: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          kind: Database["public"]["Enums"]["evidence_kind"]
          metadata: Json
          org_id: string
          storage_path: string | null
          text_value: string | null
          work_record_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          kind: Database["public"]["Enums"]["evidence_kind"]
          metadata?: Json
          org_id: string
          storage_path?: string | null
          text_value?: string | null
          work_record_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["evidence_kind"]
          metadata?: Json
          org_id?: string
          storage_path?: string | null
          text_value?: string | null
          work_record_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "evidence_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evidence_work_record_id_fkey"
            columns: ["work_record_id"]
            isOneToOne: false
            referencedRelation: "work_records"
            referencedColumns: ["id"]
          },
        ]
      }
      interventions: {
        Row: {
          category: string
          created_at: string
          duration_minutes: number | null
          id: string
          notes: string | null
          org_id: string
          part_code: string | null
          part_name: string | null
          quantity: number | null
          work_record_id: string
        }
        Insert: {
          category: string
          created_at?: string
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          org_id: string
          part_code?: string | null
          part_name?: string | null
          quantity?: number | null
          work_record_id: string
        }
        Update: {
          category?: string
          created_at?: string
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          org_id?: string
          part_code?: string | null
          part_name?: string | null
          quantity?: number | null
          work_record_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interventions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interventions_work_record_id_fkey"
            columns: ["work_record_id"]
            isOneToOne: false
            referencedRelation: "work_records"
            referencedColumns: ["id"]
          },
        ]
      }
      machines: {
        Row: {
          created_at: string
          id: string
          location: string | null
          model: string | null
          name: string
          org_id: string
          qr_code: string | null
          serial: string | null
          site_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          location?: string | null
          model?: string | null
          name: string
          org_id: string
          qr_code?: string | null
          serial?: string | null
          site_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          location?: string | null
          model?: string | null
          name?: string
          org_id?: string
          qr_code?: string | null
          serial?: string | null
          site_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "machines_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "machines_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          org_id: string
        }
        Insert: {
          created_at?: string
          full_name?: string
          id: string
          org_id: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      sites: {
        Row: {
          address: string | null
          created_at: string
          id: string
          name: string
          org_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          name: string
          org_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          name?: string
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sites_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
      voice_closures: {
        Row: {
          audio_path: string | null
          confirmed: boolean
          confirmed_at: string | null
          created_at: string
          created_by: string | null
          id: string
          org_id: string
          structured: Json
          transcript: string | null
          work_record_id: string
        }
        Insert: {
          audio_path?: string | null
          confirmed?: boolean
          confirmed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          org_id: string
          structured?: Json
          transcript?: string | null
          work_record_id: string
        }
        Update: {
          audio_path?: string | null
          confirmed?: boolean
          confirmed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          org_id?: string
          structured?: Json
          transcript?: string | null
          work_record_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "voice_closures_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_closures_work_record_id_fkey"
            columns: ["work_record_id"]
            isOneToOne: false
            referencedRelation: "work_records"
            referencedColumns: ["id"]
          },
        ]
      }
      work_records: {
        Row: {
          assigned_to: string | null
          closed_at: string | null
          code: string
          created_at: string
          created_by: string | null
          description: string | null
          final_state: string | null
          follow_up_needed: boolean
          follow_up_reason: string | null
          id: string
          initial_state: string | null
          location_note: string | null
          machine_id: string | null
          org_id: string
          priority: Database["public"]["Enums"]["work_priority"]
          root_cause: string | null
          root_cause_status: string | null
          site_id: string | null
          source: Database["public"]["Enums"]["work_source"]
          status: Database["public"]["Enums"]["work_status"]
          title: string
          type: Database["public"]["Enums"]["work_type"]
          updated_at: string
          work_performed: string | null
        }
        Insert: {
          assigned_to?: string | null
          closed_at?: string | null
          code: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          final_state?: string | null
          follow_up_needed?: boolean
          follow_up_reason?: string | null
          id?: string
          initial_state?: string | null
          location_note?: string | null
          machine_id?: string | null
          org_id: string
          priority?: Database["public"]["Enums"]["work_priority"]
          root_cause?: string | null
          root_cause_status?: string | null
          site_id?: string | null
          source?: Database["public"]["Enums"]["work_source"]
          status?: Database["public"]["Enums"]["work_status"]
          title: string
          type: Database["public"]["Enums"]["work_type"]
          updated_at?: string
          work_performed?: string | null
        }
        Update: {
          assigned_to?: string | null
          closed_at?: string | null
          code?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          final_state?: string | null
          follow_up_needed?: boolean
          follow_up_reason?: string | null
          id?: string
          initial_state?: string | null
          location_note?: string | null
          machine_id?: string | null
          org_id?: string
          priority?: Database["public"]["Enums"]["work_priority"]
          root_cause?: string | null
          root_cause_status?: string | null
          site_id?: string | null
          source?: Database["public"]["Enums"]["work_source"]
          status?: Database["public"]["Enums"]["work_status"]
          title?: string
          type?: Database["public"]["Enums"]["work_type"]
          updated_at?: string
          work_performed?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "work_records_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_records_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_records_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_org_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "technician" | "supervisor" | "admin"
      evidence_kind:
        | "foto_oncesi"
        | "foto_sonrasi"
        | "video_oncesi"
        | "video_sonrasi"
        | "ses"
        | "olcum_oncesi"
        | "olcum_sonrasi"
        | "hata_kodu"
        | "diger"
      work_priority: "dusuk" | "normal" | "yuksek" | "kritik"
      work_source: "atanan" | "teknisyen"
      work_status:
        | "beklemede"
        | "devam_ediyor"
        | "kapanis_eksik"
        | "tamamlandi"
        | "iptal"
      work_type: "ariza" | "bakim" | "test" | "kurulum" | "parca" | "diger"
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
      app_role: ["technician", "supervisor", "admin"],
      evidence_kind: [
        "foto_oncesi",
        "foto_sonrasi",
        "video_oncesi",
        "video_sonrasi",
        "ses",
        "olcum_oncesi",
        "olcum_sonrasi",
        "hata_kodu",
        "diger",
      ],
      work_priority: ["dusuk", "normal", "yuksek", "kritik"],
      work_source: ["atanan", "teknisyen"],
      work_status: [
        "beklemede",
        "devam_ediyor",
        "kapanis_eksik",
        "tamamlandi",
        "iptal",
      ],
      work_type: ["ariza", "bakim", "test", "kurulum", "parca", "diger"],
    },
  },
} as const
