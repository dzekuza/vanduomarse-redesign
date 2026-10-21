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
  public: {
    Tables: {
      booking_extras: {
        Row: {
          booking_id: string
          id: number
          line_total: number
          name: string
          quantity: number
          unit: Database["public"]["Enums"]["upsell_unit"]
          unit_price: number
          upsell_id: string | null
        }
        Insert: {
          booking_id: string
          id?: never
          line_total: number
          name: string
          quantity: number
          unit: Database["public"]["Enums"]["upsell_unit"]
          unit_price: number
          upsell_id?: string | null
        }
        Update: {
          booking_id?: string
          id?: never
          line_total?: number
          name?: string
          quantity?: number
          unit?: Database["public"]["Enums"]["upsell_unit"]
          unit_price?: number
          upsell_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_extras_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_extras_upsell_id_fkey"
            columns: ["upsell_id"]
            isOneToOne: false
            referencedRelation: "sauna_upsells"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          created_at: string
          customer_email: string | null
          customer_name: string
          customer_phone: string | null
          date: string
          guests: number
          hours: number | null
          id: string
          kind: Database["public"]["Enums"]["booking_kind"]
          nights: number | null
          note: string | null
          reference: string
          source: Database["public"]["Enums"]["booking_source"]
          start_hour: number | null
          status: Database["public"]["Enums"]["booking_status"]
          stay_type_id: string | null
          total: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_email?: string | null
          customer_name: string
          customer_phone?: string | null
          date: string
          guests: number
          hours?: number | null
          id?: string
          kind: Database["public"]["Enums"]["booking_kind"]
          nights?: number | null
          note?: string | null
          reference: string
          source?: Database["public"]["Enums"]["booking_source"]
          start_hour?: number | null
          status?: Database["public"]["Enums"]["booking_status"]
          stay_type_id?: string | null
          total: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string | null
          date?: string
          guests?: number
          hours?: number | null
          id?: string
          kind?: Database["public"]["Enums"]["booking_kind"]
          nights?: number | null
          note?: string | null
          reference?: string
          source?: Database["public"]["Enums"]["booking_source"]
          start_hour?: number | null
          status?: Database["public"]["Enums"]["booking_status"]
          stay_type_id?: string | null
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_stay_type_fk"
            columns: ["stay_type_id", "kind"]
            isOneToOne: false
            referencedRelation: "stay_types"
            referencedColumns: ["id", "kind"]
          },
        ]
      }
      event_tickets: {
        Row: {
          created_at: string
          customer_email: string | null
          customer_name: string
          customer_phone: string | null
          event_id: string
          id: string
          people: number
          reference: string
          source: Database["public"]["Enums"]["booking_source"]
          status: Database["public"]["Enums"]["booking_status"]
          total: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_email?: string | null
          customer_name: string
          customer_phone?: string | null
          event_id: string
          id?: string
          people: number
          reference: string
          source?: Database["public"]["Enums"]["booking_source"]
          status?: Database["public"]["Enums"]["booking_status"]
          total: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string | null
          event_id?: string
          id?: string
          people?: number
          reference?: string
          source?: Database["public"]["Enums"]["booking_source"]
          status?: Database["public"]["Enums"]["booking_status"]
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_tickets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          blurb: string
          capacity: number | null
          category: Database["public"]["Enums"]["event_category"]
          created_at: string
          date: string
          duration_minutes: number | null
          id: string
          place: string
          price: number | null
          published: boolean
          sold: number
          start_time: string
          template_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          blurb: string
          capacity?: number | null
          category: Database["public"]["Enums"]["event_category"]
          created_at?: string
          date: string
          duration_minutes?: number | null
          id?: string
          place: string
          price?: number | null
          published?: boolean
          sold?: number
          start_time: string
          template_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          blurb?: string
          capacity?: number | null
          category?: Database["public"]["Enums"]["event_category"]
          created_at?: string
          date?: string
          duration_minutes?: number | null
          id?: string
          place?: string
          price?: number | null
          published?: boolean
          sold?: number
          start_time?: string
          template_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "sauna_event_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      inquiries: {
        Row: {
          calculator_input: Json | null
          created_at: string
          customer_email: string | null
          customer_name: string
          customer_phone: string | null
          date: string | null
          estimate_max: number | null
          estimate_min: number | null
          event_type: string
          guests: number
          id: string
          message: string
          source: Database["public"]["Enums"]["inquiry_source"]
          space: string
          status: Database["public"]["Enums"]["inquiry_status"]
          updated_at: string
        }
        Insert: {
          calculator_input?: Json | null
          created_at?: string
          customer_email?: string | null
          customer_name: string
          customer_phone?: string | null
          date?: string | null
          estimate_max?: number | null
          estimate_min?: number | null
          event_type: string
          guests: number
          id?: string
          message?: string
          source: Database["public"]["Enums"]["inquiry_source"]
          space?: string
          status?: Database["public"]["Enums"]["inquiry_status"]
          updated_at?: string
        }
        Update: {
          calculator_input?: Json | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string | null
          date?: string | null
          estimate_max?: number | null
          estimate_min?: number | null
          event_type?: string
          guests?: number
          id?: string
          message?: string
          source?: Database["public"]["Enums"]["inquiry_source"]
          space?: string
          status?: Database["public"]["Enums"]["inquiry_status"]
          updated_at?: string
        }
        Relationships: []
      }
      inquiry_notes: {
        Row: {
          author_id: string | null
          created_at: string
          id: number
          inquiry_id: string
          text: string
        }
        Insert: {
          author_id?: string | null
          created_at?: string
          id?: never
          inquiry_id: string
          text: string
        }
        Update: {
          author_id?: string | null
          created_at?: string
          id?: never
          inquiry_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "inquiry_notes_inquiry_id_fkey"
            columns: ["inquiry_id"]
            isOneToOne: false
            referencedRelation: "inquiries"
            referencedColumns: ["id"]
          },
        ]
      }
      price_items: {
        Row: {
          group: Database["public"]["Enums"]["price_group"]
          id: string
          label: string
          max: number | null
          sort_order: number
          unit: string
          updated_at: string
          value: number
        }
        Insert: {
          group: Database["public"]["Enums"]["price_group"]
          id: string
          label: string
          max?: number | null
          sort_order?: number
          unit: string
          updated_at?: string
          value: number
        }
        Update: {
          group?: Database["public"]["Enums"]["price_group"]
          id?: string
          label?: string
          max?: number | null
          sort_order?: number
          unit?: string
          updated_at?: string
          value?: number
        }
        Relationships: []
      }
      sauna_blocks: {
        Row: {
          created_at: string
          created_by: string | null
          date: string
          hour: number
          id: string
          reason: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          date: string
          hour: number
          id?: string
          reason?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          date?: string
          hour?: number
          id?: string
          reason?: string
        }
        Relationships: []
      }
      sauna_event_templates: {
        Row: {
          active: boolean
          blurb: string
          capacity: number
          duration_minutes: number
          host: string
          id: string
          price_per_person: number
          start_time: string
          title: string
          updated_at: string
          weekday: number
        }
        Insert: {
          active?: boolean
          blurb: string
          capacity: number
          duration_minutes: number
          host: string
          id: string
          price_per_person: number
          start_time: string
          title: string
          updated_at?: string
          weekday: number
        }
        Update: {
          active?: boolean
          blurb?: string
          capacity?: number
          duration_minutes?: number
          host?: string
          id?: string
          price_per_person?: number
          start_time?: string
          title?: string
          updated_at?: string
          weekday?: number
        }
        Relationships: []
      }
      sauna_settings: {
        Row: {
          close_hour: number
          id: boolean
          large_group_rate: number
          max_hours: number
          max_party: number
          min_hours: number
          open_hour: number
          package_hours: number
          package_price: number
          small_group_max: number
          small_group_rate: number
          updated_at: string
        }
        Insert: {
          close_hour: number
          id?: boolean
          large_group_rate: number
          max_hours: number
          max_party: number
          min_hours: number
          open_hour: number
          package_hours: number
          package_price: number
          small_group_max: number
          small_group_rate: number
          updated_at?: string
        }
        Update: {
          close_hour?: number
          id?: boolean
          large_group_rate?: number
          max_hours?: number
          max_party?: number
          min_hours?: number
          open_hour?: number
          package_hours?: number
          package_price?: number
          small_group_max?: number
          small_group_rate?: number
          updated_at?: string
        }
        Relationships: []
      }
      sauna_upsells: {
        Row: {
          active: boolean
          created_at: string
          description: string
          id: string
          max_qty: number | null
          name: string
          price: number
          sort_order: number
          unit: Database["public"]["Enums"]["upsell_unit"]
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string
          id: string
          max_qty?: number | null
          name: string
          price: number
          sort_order?: number
          unit: Database["public"]["Enums"]["upsell_unit"]
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string
          id?: string
          max_qty?: number | null
          name?: string
          price?: number
          sort_order?: number
          unit?: Database["public"]["Enums"]["upsell_unit"]
          updated_at?: string
        }
        Relationships: []
      }
      staff: {
        Row: {
          created_at: string
          display_name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string
          user_id?: string
        }
        Relationships: []
      }
      stay_types: {
        Row: {
          active: boolean
          id: string
          kind: Database["public"]["Enums"]["booking_kind"]
          label: string
          max_guests: number
          note: string
          price_per_night: number
          sort_order: number
          units: number | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          id: string
          kind: Database["public"]["Enums"]["booking_kind"]
          label: string
          max_guests: number
          note?: string
          price_per_night: number
          sort_order?: number
          units?: number | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          id?: string
          kind?: Database["public"]["Enums"]["booking_kind"]
          label?: string
          max_guests?: number
          note?: string
          price_per_night?: number
          sort_order?: number
          units?: number | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      materialize_sauna_events: {
        Args: { p_days?: number; p_from: string }
        Returns: number
      }
      sauna_taken_hours: {
        Args: { p_from: string; p_to: string }
        Returns: {
          day: string
          hour: number
        }[]
      }
      stay_occupancy: {
        Args: { p_from: string; p_to: string }
        Returns: {
          day: string
          stay_type_id: string
          taken: number
          units: number
        }[]
      }
    }
    Enums: {
      booking_kind: "pirtis" | "namelis" | "kemperis"
      booking_source: "svetaine" | "telefonu" | "vietoje"
      booking_status: "laukia" | "patvirtinta" | "ivykdyta" | "atsaukta"
      event_category: "pirtis" | "vakarai" | "akademija" | "sventes"
      inquiry_source: "skaiciuokle" | "renginys" | "kontaktai"
      inquiry_status:
        | "nauja"
        | "susisiekta"
        | "pasiulymas"
        | "laimeta"
        | "prarasta"
      price_group:
        | "Erdvės"
        | "Maitinimas"
        | "Paslaugos"
        | "Pramogos"
        | "Nakvynė"
      upsell_unit: "rezervacijai" | "asmeniui" | "vienetui" | "valandai"
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
  public: {
    Enums: {
      booking_kind: ["pirtis", "namelis", "kemperis"],
      booking_source: ["svetaine", "telefonu", "vietoje"],
      booking_status: ["laukia", "patvirtinta", "ivykdyta", "atsaukta"],
      event_category: ["pirtis", "vakarai", "akademija", "sventes"],
      inquiry_source: ["skaiciuokle", "renginys", "kontaktai"],
      inquiry_status: [
        "nauja",
        "susisiekta",
        "pasiulymas",
        "laimeta",
        "prarasta",
      ],
      price_group: ["Erdvės", "Maitinimas", "Paslaugos", "Pramogos", "Nakvynė"],
      upsell_unit: ["rezervacijai", "asmeniui", "vienetui", "valandai"],
    },
  },
} as const
