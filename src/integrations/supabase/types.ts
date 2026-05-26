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
      body_locations: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      exercises: {
        Row: {
          body_region: string | null
          common_mistakes: string | null
          created_at: string
          description: string | null
          diagnosis_tags: string[] | null
          difficulty: string | null
          equipment: string | null
          exercise_type: string | null
          id: string
          image_url: string | null
          instructions: string | null
          joint_health_category: string | null
          name: string
          published: boolean
          purpose: string | null
          related_exercises: string[] | null
          safety_tips: string | null
          sets_reps_or_hold_time: string | null
          slug: string
          stop_if: string | null
          updated_at: string
          video_url: string | null
          you_should_feel: string | null
        }
        Insert: {
          body_region?: string | null
          common_mistakes?: string | null
          created_at?: string
          description?: string | null
          diagnosis_tags?: string[] | null
          difficulty?: string | null
          equipment?: string | null
          exercise_type?: string | null
          id?: string
          image_url?: string | null
          instructions?: string | null
          joint_health_category?: string | null
          name: string
          published?: boolean
          purpose?: string | null
          related_exercises?: string[] | null
          safety_tips?: string | null
          sets_reps_or_hold_time?: string | null
          slug: string
          stop_if?: string | null
          updated_at?: string
          video_url?: string | null
          you_should_feel?: string | null
        }
        Update: {
          body_region?: string | null
          common_mistakes?: string | null
          created_at?: string
          description?: string | null
          diagnosis_tags?: string[] | null
          difficulty?: string | null
          equipment?: string | null
          exercise_type?: string | null
          id?: string
          image_url?: string | null
          instructions?: string | null
          joint_health_category?: string | null
          name?: string
          published?: boolean
          purpose?: string | null
          related_exercises?: string[] | null
          safety_tips?: string | null
          sets_reps_or_hold_time?: string | null
          slug?: string
          stop_if?: string | null
          updated_at?: string
          video_url?: string | null
          you_should_feel?: string | null
        }
        Relationships: []
      }
      injuries: {
        Row: {
          body_region: string | null
          causes: string | null
          cover_image_url: string | null
          created_at: string
          id: string
          name: string
          overview: string | null
          published: boolean
          slug: string
          summary: string | null
          symptoms: string | null
          treatment_overview: string | null
          updated_at: string
          when_to_see_doctor: string | null
        }
        Insert: {
          body_region?: string | null
          causes?: string | null
          cover_image_url?: string | null
          created_at?: string
          id?: string
          name: string
          overview?: string | null
          published?: boolean
          slug: string
          summary?: string | null
          symptoms?: string | null
          treatment_overview?: string | null
          updated_at?: string
          when_to_see_doctor?: string | null
        }
        Update: {
          body_region?: string | null
          causes?: string | null
          cover_image_url?: string | null
          created_at?: string
          id?: string
          name?: string
          overview?: string | null
          published?: boolean
          slug?: string
          summary?: string | null
          symptoms?: string | null
          treatment_overview?: string | null
          updated_at?: string
          when_to_see_doctor?: string | null
        }
        Relationships: []
      }
      injury_exercises: {
        Row: {
          exercise_id: string
          injury_id: string
          notes: string | null
          sort_order: number
        }
        Insert: {
          exercise_id: string
          injury_id: string
          notes?: string | null
          sort_order?: number
        }
        Update: {
          exercise_id?: string
          injury_id?: string
          notes?: string | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "injury_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "injury_exercises_injury_id_fkey"
            columns: ["injury_id"]
            isOneToOne: false
            referencedRelation: "injuries"
            referencedColumns: ["id"]
          },
        ]
      }
      pathologies: {
        Row: {
          body_location_id: string | null
          created_at: string
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          body_location_id?: string | null
          created_at?: string
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          body_location_id?: string | null
          created_at?: string
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pathologies_body_location_id_fkey"
            columns: ["body_location_id"]
            isOneToOne: false
            referencedRelation: "body_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      pt_locations: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          id: string
          lat: number | null
          lng: number | null
          name: string
          notes: string | null
          phone: string | null
          region: string | null
          specialties: string[] | null
          state: string | null
          updated_at: string
          website: string | null
          zip: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          name: string
          notes?: string | null
          phone?: string | null
          region?: string | null
          specialties?: string[] | null
          state?: string | null
          updated_at?: string
          website?: string | null
          zip?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          name?: string
          notes?: string | null
          phone?: string | null
          region?: string | null
          specialties?: string[] | null
          state?: string | null
          updated_at?: string
          website?: string | null
          zip?: string | null
        }
        Relationships: []
      }
      rehab_exercise_locations: {
        Row: {
          body_location_id: string
          exercise_id: string
        }
        Insert: {
          body_location_id: string
          exercise_id: string
        }
        Update: {
          body_location_id?: string
          exercise_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rehab_exercise_locations_body_location_id_fkey"
            columns: ["body_location_id"]
            isOneToOne: false
            referencedRelation: "body_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rehab_exercise_locations_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "rehab_exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      rehab_exercise_pathologies: {
        Row: {
          exercise_id: string
          pathology_id: string
        }
        Insert: {
          exercise_id: string
          pathology_id: string
        }
        Update: {
          exercise_id?: string
          pathology_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rehab_exercise_pathologies_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "rehab_exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rehab_exercise_pathologies_pathology_id_fkey"
            columns: ["pathology_id"]
            isOneToOne: false
            referencedRelation: "pathologies"
            referencedColumns: ["id"]
          },
        ]
      }
      rehab_exercises: {
        Row: {
          created_at: string
          difficulty: string | null
          equipment_needed: string | null
          full_instructions: string | null
          id: string
          image_url: string | null
          is_active: boolean
          precautions: string | null
          rehab_phase: string | null
          short_description: string | null
          slug: string
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          created_at?: string
          difficulty?: string | null
          equipment_needed?: string | null
          full_instructions?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          precautions?: string | null
          rehab_phase?: string | null
          short_description?: string | null
          slug: string
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          created_at?: string
          difficulty?: string | null
          equipment_needed?: string | null
          full_instructions?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          precautions?: string | null
          rehab_phase?: string | null
          short_description?: string | null
          slug?: string
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
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
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
