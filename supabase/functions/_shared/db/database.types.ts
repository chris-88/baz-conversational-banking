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
    PostgrestVersion: "14.18"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          auth_user_id: string
          created_at: string
          email: string | null
        }
        Insert: {
          auth_user_id: string
          created_at?: string
          email?: string | null
        }
        Update: {
          auth_user_id?: string
          created_at?: string
          email?: string | null
        }
        Relationships: []
      }
      application_confirmations: {
        Row: {
          application_id: string
          confirmed_at: string
          id: string
          kind: string
          participant_id: string
          requirement_id: string
        }
        Insert: {
          application_id: string
          confirmed_at?: string
          id?: string
          kind: string
          participant_id: string
          requirement_id: string
        }
        Update: {
          application_id?: string
          confirmed_at?: string
          id?: string
          kind?: string
          participant_id?: string
          requirement_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_confirmations_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_confirmations_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      application_requests: {
        Row: {
          application_id: string
          created_at: string
          detail: string | null
          fulfilled_at: string | null
          id: string
          kind: string
          requested_of: string | null
          requirement_id: string
          status: string
        }
        Insert: {
          application_id: string
          created_at?: string
          detail?: string | null
          fulfilled_at?: string | null
          id?: string
          kind: string
          requested_of?: string | null
          requirement_id: string
          status?: string
        }
        Update: {
          application_id?: string
          created_at?: string
          detail?: string | null
          fulfilled_at?: string | null
          id?: string
          kind?: string
          requested_of?: string | null
          requirement_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_requests_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_requests_requested_of_fkey"
            columns: ["requested_of"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          case_id: string
          created_at: string
          id: string
          product: string
          resume_to: string | null
          state: string
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          case_id: string
          created_at?: string
          id?: string
          product: string
          resume_to?: string | null
          state?: string
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          case_id?: string
          created_at?: string
          id?: string
          product?: string
          resume_to?: string | null
          state?: string
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      cases: {
        Row: {
          auth_level: string
          created_at: string
          customer_id: string | null
          id: string
          kind: string
          label: string | null
          last_seen_at: string | null
          updated_at: string
        }
        Insert: {
          auth_level?: string
          created_at?: string
          customer_id?: string | null
          id?: string
          kind?: string
          label?: string | null
          last_seen_at?: string | null
          updated_at?: string
        }
        Update: {
          auth_level?: string
          created_at?: string
          customer_id?: string | null
          id?: string
          kind?: string
          label?: string | null
          last_seen_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cases_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      consents: {
        Row: {
          case_id: string
          granted: boolean
          granted_at: string
          id: string
          kind: string
          participant_id: string
        }
        Insert: {
          case_id: string
          granted: boolean
          granted_at?: string
          id?: string
          kind: string
          participant_id: string
        }
        Update: {
          case_id?: string
          granted?: boolean
          granted_at?: string
          id?: string
          kind?: string
          participant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "consents_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consents_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          bank_reference: string
          created_at: string
          date_of_birth: string
          email: string
          existing_products: string[]
          full_name: string
          id: string
          mobile: string
        }
        Insert: {
          bank_reference: string
          created_at?: string
          date_of_birth: string
          email: string
          existing_products?: string[]
          full_name: string
          id?: string
          mobile: string
        }
        Update: {
          bank_reference?: string
          created_at?: string
          date_of_birth?: string
          email?: string
          existing_products?: string[]
          full_name?: string
          id?: string
          mobile?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          application_id: string | null
          case_id: string
          document_type: string
          file_name: string | null
          id: string
          participant_id: string | null
          requirement_id: string | null
          storage_path: string
          uploaded_at: string
          verified: boolean
        }
        Insert: {
          application_id?: string | null
          case_id: string
          document_type: string
          file_name?: string | null
          id?: string
          participant_id?: string | null
          requirement_id?: string | null
          storage_path: string
          uploaded_at?: string
          verified?: boolean
        }
        Update: {
          application_id?: string | null
          case_id?: string
          document_type?: string
          file_name?: string | null
          id?: string
          participant_id?: string | null
          requirement_id?: string | null
          storage_path?: string
          uploaded_at?: string
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "documents_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      domain_config: {
        Row: {
          categories: Json
          kill_switch: boolean
          scope: string
          updated_at: string
        }
        Insert: {
          categories?: Json
          kill_switch?: boolean
          scope?: string
          updated_at?: string
        }
        Update: {
          categories?: Json
          kill_switch?: boolean
          scope?: string
          updated_at?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          actor: string
          application_id: string | null
          case_id: string
          created_at: string
          id: string
          payload: Json
          type: string
        }
        Insert: {
          actor: string
          application_id?: string | null
          case_id: string
          created_at?: string
          id?: string
          payload?: Json
          type: string
        }
        Update: {
          actor?: string
          application_id?: string | null
          case_id?: string
          created_at?: string
          id?: string
          payload?: Json
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      facts: {
        Row: {
          captured_at: string
          captured_for: string | null
          case_id: string
          id: string
          key: string
          participant_id: string | null
          source: string
          subject_kind: string
          superseded_by: string | null
          value: Json
          verified: boolean
        }
        Insert: {
          captured_at?: string
          captured_for?: string | null
          case_id: string
          id?: string
          key: string
          participant_id?: string | null
          source: string
          subject_kind: string
          superseded_by?: string | null
          value: Json
          verified?: boolean
        }
        Update: {
          captured_at?: string
          captured_for?: string | null
          case_id?: string
          id?: string
          key?: string
          participant_id?: string | null
          source?: string
          subject_kind?: string
          superseded_by?: string | null
          value?: Json
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "facts_captured_for_fkey"
            columns: ["captured_for"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facts_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facts_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facts_superseded_by_fkey"
            columns: ["superseded_by"]
            isOneToOne: false
            referencedRelation: "facts"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          cards: Json
          case_id: string
          content: string
          created_at: string
          gate_category: string | null
          id: string
          participant_id: string | null
          role: string
        }
        Insert: {
          cards?: Json
          case_id: string
          content: string
          created_at?: string
          gate_category?: string | null
          id?: string
          participant_id?: string | null
          role: string
        }
        Update: {
          cards?: Json
          case_id?: string
          content?: string
          created_at?: string
          gate_category?: string | null
          id?: string
          participant_id?: string | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      participant_sessions: {
        Row: {
          auth_user_id: string
          created_at: string
          id: string
          participant_id: string
        }
        Insert: {
          auth_user_id: string
          created_at?: string
          id?: string
          participant_id: string
        }
        Update: {
          auth_user_id?: string
          created_at?: string
          id?: string
          participant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "participant_sessions_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      participants: {
        Row: {
          case_id: string
          created_at: string
          display_name: string | null
          id: string
          role: string
        }
        Insert: {
          case_id: string
          created_at?: string
          display_name?: string | null
          id?: string
          role: string
        }
        Update: {
          case_id?: string
          created_at?: string
          display_name?: string | null
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "participants_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      persona_config: {
        Row: {
          preset: string
          scope: string
          sliders: Json
          updated_at: string
        }
        Insert: {
          preset?: string
          scope?: string
          sliders?: Json
          updated_at?: string
        }
        Update: {
          preset?: string
          scope?: string
          sliders?: Json
          updated_at?: string
        }
        Relationships: []
      }
      product_interests: {
        Row: {
          case_id: string
          id: string
          product: string
          reason: string | null
          status: string
          updated_at: string
        }
        Insert: {
          case_id: string
          id?: string
          product: string
          reason?: string | null
          status: string
          updated_at?: string
        }
        Update: {
          case_id?: string
          id?: string
          product?: string
          reason?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_interests_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      tokens: {
        Row: {
          case_id: string
          consumed_at: string | null
          created_at: string
          expires_at: string
          id: string
          kind: string
          participant_id: string | null
          token_hash: string
        }
        Insert: {
          case_id: string
          consumed_at?: string | null
          created_at?: string
          expires_at: string
          id?: string
          kind: string
          participant_id?: string | null
          token_hash: string
        }
        Update: {
          case_id?: string
          consumed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          kind?: string
          participant_id?: string | null
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "tokens_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tokens_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_read_case: { Args: { target_case_id: string }; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
