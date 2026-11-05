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
          discount_amount: number
          discount_code: string | null
          discount_code_id: string | null
          guests: number | null
          hours: number | null
          id: string
          kind: Database["public"]["Enums"]["booking_kind"]
          nights: number | null
          note: string | null
          payment_id: string | null
          program_id: string | null
          reference: string
          sauna_id: string | null
          source: Database["public"]["Enums"]["booking_source"]
          start_hour: number | null
          status: Database["public"]["Enums"]["booking_status"]
          stay_type_id: string | null
          stay_units: number
          total: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          customer_email?: string | null
          customer_name: string
          customer_phone?: string | null
          date: string
          discount_amount?: number
          discount_code?: string | null
          discount_code_id?: string | null
          guests?: number | null
          hours?: number | null
          id?: string
          kind: Database["public"]["Enums"]["booking_kind"]
          nights?: number | null
          note?: string | null
          payment_id?: string | null
          program_id?: string | null
          reference: string
          sauna_id?: string | null
          source?: Database["public"]["Enums"]["booking_source"]
          start_hour?: number | null
          status?: Database["public"]["Enums"]["booking_status"]
          stay_type_id?: string | null
          stay_units?: number
          total: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string | null
          date?: string
          discount_amount?: number
          discount_code?: string | null
          discount_code_id?: string | null
          guests?: number | null
          hours?: number | null
          id?: string
          kind?: Database["public"]["Enums"]["booking_kind"]
          nights?: number | null
          note?: string | null
          payment_id?: string | null
          program_id?: string | null
          reference?: string
          sauna_id?: string | null
          source?: Database["public"]["Enums"]["booking_source"]
          start_hour?: number | null
          status?: Database["public"]["Enums"]["booking_status"]
          stay_type_id?: string | null
          stay_units?: number
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "sauna_programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_sauna_id_fkey"
            columns: ["sauna_id"]
            isOneToOne: false
            referencedRelation: "saunas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_stay_type_fk"
            columns: ["stay_type_id", "kind"]
            isOneToOne: false
            referencedRelation: "stay_types"
            referencedColumns: ["id", "kind"]
          },
        ]
      }
      coupon_products: {
        Row: {
          active: boolean
          created_at: string
          description: string
          id: string
          kind: Database["public"]["Enums"]["coupon_kind"]
          name: string
          service: Database["public"]["Enums"]["coupon_service"]
          sort_order: number
          updated_at: string
          value: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string
          id: string
          kind: Database["public"]["Enums"]["coupon_kind"]
          name: string
          service?: Database["public"]["Enums"]["coupon_service"]
          sort_order?: number
          updated_at?: string
          value: number
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string
          id?: string
          kind?: Database["public"]["Enums"]["coupon_kind"]
          name?: string
          service?: Database["public"]["Enums"]["coupon_service"]
          sort_order?: number
          updated_at?: string
          value?: number
        }
        Relationships: []
      }
      coupon_redemptions: {
        Row: {
          amount: number
          booking_id: string | null
          coupon_id: string
          created_at: string
          id: string
          note: string
          redeemed_by: string | null
        }
        Insert: {
          amount: number
          booking_id?: string | null
          coupon_id: string
          created_at?: string
          id?: string
          note?: string
          redeemed_by?: string | null
        }
        Update: {
          amount?: number
          booking_id?: string | null
          coupon_id?: string
          created_at?: string
          id?: string
          note?: string
          redeemed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coupon_redemptions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_redemptions_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          balance: number
          buyer_email: string
          buyer_name: string
          buyer_phone: string | null
          code: string | null
          created_at: string
          expires_at: string | null
          face_value: number
          id: string
          kind: Database["public"]["Enums"]["coupon_kind"]
          message: string
          paid_at: string | null
          product_id: string
          product_name: string
          recipient_name: string
          reference: string
          service: Database["public"]["Enums"]["coupon_service"]
          status: Database["public"]["Enums"]["coupon_status"]
          updated_at: string
        }
        Insert: {
          balance: number
          buyer_email: string
          buyer_name: string
          buyer_phone?: string | null
          code?: string | null
          created_at?: string
          expires_at?: string | null
          face_value: number
          id?: string
          kind: Database["public"]["Enums"]["coupon_kind"]
          message?: string
          paid_at?: string | null
          product_id: string
          product_name: string
          recipient_name?: string
          reference: string
          service: Database["public"]["Enums"]["coupon_service"]
          status?: Database["public"]["Enums"]["coupon_status"]
          updated_at?: string
        }
        Update: {
          balance?: number
          buyer_email?: string
          buyer_name?: string
          buyer_phone?: string | null
          code?: string | null
          created_at?: string
          expires_at?: string | null
          face_value?: number
          id?: string
          kind?: Database["public"]["Enums"]["coupon_kind"]
          message?: string
          paid_at?: string | null
          product_id?: string
          product_name?: string
          recipient_name?: string
          reference?: string
          service?: Database["public"]["Enums"]["coupon_service"]
          status?: Database["public"]["Enums"]["coupon_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupons_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "coupon_products"
            referencedColumns: ["id"]
          },
        ]
      }
      discount_codes: {
        Row: {
          active: boolean
          code: string
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["discount_kind"]
          max_uses: number | null
          note: string | null
          services: string[]
          updated_at: string
          valid_from: string | null
          valid_until: string | null
          value: number
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          id?: string
          kind: Database["public"]["Enums"]["discount_kind"]
          max_uses?: number | null
          note?: string | null
          services: string[]
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
          value: number
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["discount_kind"]
          max_uses?: number | null
          note?: string | null
          services?: string[]
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
          value?: number
        }
        Relationships: []
      }
      event_tickets: {
        Row: {
          children: number
          created_at: string
          customer_email: string | null
          customer_name: string
          customer_phone: string | null
          discount_amount: number
          discount_code: string | null
          discount_code_id: string | null
          event_id: string
          id: string
          payment_id: string | null
          people: number
          reference: string
          source: Database["public"]["Enums"]["booking_source"]
          status: Database["public"]["Enums"]["booking_status"]
          total: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          children?: number
          created_at?: string
          customer_email?: string | null
          customer_name: string
          customer_phone?: string | null
          discount_amount?: number
          discount_code?: string | null
          discount_code_id?: string | null
          event_id: string
          id?: string
          payment_id?: string | null
          people: number
          reference: string
          source?: Database["public"]["Enums"]["booking_source"]
          status?: Database["public"]["Enums"]["booking_status"]
          total: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          children?: number
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string | null
          discount_amount?: number
          discount_code?: string | null
          discount_code_id?: string | null
          event_id?: string
          id?: string
          payment_id?: string | null
          people?: number
          reference?: string
          source?: Database["public"]["Enums"]["booking_source"]
          status?: Database["public"]["Enums"]["booking_status"]
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_tickets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_tickets_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
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
          program_id: string | null
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
          program_id?: string | null
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
          program_id?: string | null
          published?: boolean
          sold?: number
          start_time?: string
          template_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "sauna_programs"
            referencedColumns: ["id"]
          },
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
      payments: {
        Row: {
          amount: number
          created_at: string
          customer_email: string | null
          customer_phone: string | null
          expires_at: string | null
          id: string
          needs_review: boolean
          paid_at: string | null
          refunded: number
          status: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          customer_email?: string | null
          customer_phone?: string | null
          expires_at?: string | null
          id?: string
          needs_review?: boolean
          paid_at?: string | null
          refunded?: number
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          customer_email?: string | null
          customer_phone?: string | null
          expires_at?: string | null
          id?: string
          needs_review?: boolean
          paid_at?: string | null
          refunded?: number
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
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
      quad_rental_items: {
        Row: {
          quad_type_id: string
          rental_id: string
          units: number
        }
        Insert: {
          quad_type_id: string
          rental_id: string
          units: number
        }
        Update: {
          quad_type_id?: string
          rental_id?: string
          units?: number
        }
        Relationships: [
          {
            foreignKeyName: "quad_rental_items_quad_type_id_fkey"
            columns: ["quad_type_id"]
            isOneToOne: false
            referencedRelation: "quad_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quad_rental_items_rental_id_fkey"
            columns: ["rental_id"]
            isOneToOne: false
            referencedRelation: "quad_rentals"
            referencedColumns: ["id"]
          },
        ]
      }
      quad_rentals: {
        Row: {
          created_at: string
          customer_email: string | null
          customer_name: string
          customer_phone: string | null
          date: string
          discount_amount: number
          discount_code: string | null
          discount_code_id: string | null
          hours: number
          id: string
          note: string | null
          payment_id: string | null
          quad_type_id: string | null
          reference: string
          riders: number
          source: Database["public"]["Enums"]["booking_source"]
          start_hour: number
          status: Database["public"]["Enums"]["booking_status"]
          total: number
          units: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          customer_email?: string | null
          customer_name: string
          customer_phone?: string | null
          date: string
          discount_amount?: number
          discount_code?: string | null
          discount_code_id?: string | null
          hours: number
          id?: string
          note?: string | null
          payment_id?: string | null
          quad_type_id?: string | null
          reference: string
          riders: number
          source?: Database["public"]["Enums"]["booking_source"]
          start_hour: number
          status?: Database["public"]["Enums"]["booking_status"]
          total: number
          units: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string | null
          date?: string
          discount_amount?: number
          discount_code?: string | null
          discount_code_id?: string | null
          hours?: number
          id?: string
          note?: string | null
          payment_id?: string | null
          quad_type_id?: string | null
          reference?: string
          riders?: number
          source?: Database["public"]["Enums"]["booking_source"]
          start_hour?: number
          status?: Database["public"]["Enums"]["booking_status"]
          total?: number
          units?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quad_rentals_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quad_rentals_quad_type_id_fkey"
            columns: ["quad_type_id"]
            isOneToOne: false
            referencedRelation: "quad_types"
            referencedColumns: ["id"]
          },
        ]
      }
      quad_settings: {
        Row: {
          close_hour: number
          deposit: number
          id: boolean
          max_hours: number
          min_age: number
          open_hour: number
          rules: string
          updated_at: string
        }
        Insert: {
          close_hour: number
          deposit?: number
          id?: boolean
          max_hours: number
          min_age: number
          open_hour: number
          rules?: string
          updated_at?: string
        }
        Update: {
          close_hour?: number
          deposit?: number
          id?: boolean
          max_hours?: number
          min_age?: number
          open_hour?: number
          rules?: string
          updated_at?: string
        }
        Relationships: []
      }
      quad_types: {
        Row: {
          active: boolean
          created_at: string
          description: string
          id: string
          name: string
          price_per_hour: number
          seats: number
          sort_order: number
          units: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string
          id: string
          name: string
          price_per_hour: number
          seats: number
          sort_order?: number
          units: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string
          id?: string
          name?: string
          price_per_hour?: number
          seats?: number
          sort_order?: number
          units?: number
          updated_at?: string
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
          sauna_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          date: string
          hour: number
          id?: string
          reason?: string
          sauna_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          date?: string
          hour?: number
          id?: string
          reason?: string
          sauna_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sauna_blocks_sauna_id_fkey"
            columns: ["sauna_id"]
            isOneToOne: false
            referencedRelation: "saunas"
            referencedColumns: ["id"]
          },
        ]
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
      sauna_programs: {
        Row: {
          active: boolean
          capacity: number | null
          child_price: number | null
          created_at: string
          description: string
          duration_minutes: number
          id: string
          kind: string
          label: string
          name: string
          price: number
          pricing: string
          sauna_id: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          capacity?: number | null
          child_price?: number | null
          created_at?: string
          description?: string
          duration_minutes: number
          id: string
          kind: string
          label?: string
          name: string
          price: number
          pricing: string
          sauna_id?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          capacity?: number | null
          child_price?: number | null
          created_at?: string
          description?: string
          duration_minutes?: number
          id?: string
          kind?: string
          label?: string
          name?: string
          price?: number
          pricing?: string
          sauna_id?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sauna_programs_sauna_id_fkey"
            columns: ["sauna_id"]
            isOneToOne: false
            referencedRelation: "saunas"
            referencedColumns: ["id"]
          },
        ]
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
      sauna_upsell_links: {
        Row: {
          sauna_id: string
          upsell_id: string
        }
        Insert: {
          sauna_id: string
          upsell_id: string
        }
        Update: {
          sauna_id?: string
          upsell_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sauna_upsell_links_sauna_id_fkey"
            columns: ["sauna_id"]
            isOneToOne: false
            referencedRelation: "saunas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sauna_upsell_links_upsell_id_fkey"
            columns: ["upsell_id"]
            isOneToOne: false
            referencedRelation: "sauna_upsells"
            referencedColumns: ["id"]
          },
        ]
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
      saunas: {
        Row: {
          active: boolean
          close_hour: number
          created_at: string
          description: string
          features: string[]
          id: string
          large_group_rate: number
          max_hours: number
          max_party: number
          min_hours: number
          name: string
          open_hour: number
          package_hours: number
          package_price: number
          photos: string[]
          small_group_max: number
          small_group_rate: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          close_hour: number
          created_at?: string
          description?: string
          features?: string[]
          id: string
          large_group_rate: number
          max_hours: number
          max_party: number
          min_hours: number
          name: string
          open_hour: number
          package_hours: number
          package_price: number
          photos?: string[]
          small_group_max: number
          small_group_rate: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          close_hour?: number
          created_at?: string
          description?: string
          features?: string[]
          id?: string
          large_group_rate?: number
          max_hours?: number
          max_party?: number
          min_hours?: number
          name?: string
          open_hour?: number
          package_hours?: number
          package_price?: number
          photos?: string[]
          small_group_max?: number
          small_group_rate?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      staff: {
        Row: {
          active: boolean
          created_at: string
          display_name: string
          email: string
          role_id: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          display_name: string
          email?: string
          role_id: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          display_name?: string
          email?: string
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "staff_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_roles: {
        Row: {
          created_at: string
          description: string
          id: string
          is_owner: boolean
          name: string
          permissions: string[]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          is_owner?: boolean
          name: string
          permissions?: string[]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          is_owner?: boolean
          name?: string
          permissions?: string[]
          updated_at?: string
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
      abandon_payment: { Args: { p_payment_id: string }; Returns: number }
      activate_coupon: {
        Args: { p_id: string }
        Returns: {
          code: string
          expires_at: string
        }[]
      }
      attach_payment_session: {
        Args: {
          p_expected_session_id?: string
          p_expires_at: string
          p_payment_id: string
          p_session_id: string
        }
        Returns: undefined
      }
      account_notify_email: { Args: { p_user: string }; Returns: string }
      cancel_phone_code: {
        Args: { p_code_hash: string; p_phone: string }
        Returns: undefined
      }
      cancel_unpaid_requests: {
        Args: { p_refs: string[]; p_user: string }
        Returns: number
      }
      check_coupon: {
        Args: { p_code: string }
        Returns: {
          balance: number
          expires_at: string
          product_name: string
          service: Database["public"]["Enums"]["coupon_service"]
        }[]
      }
      check_discount_code: {
        Args: { p_code: string }
        Returns: {
          code: string
          kind: Database["public"]["Enums"]["discount_kind"]
          services: string[]
          value: number
        }[]
      }
      complete_payment: {
        Args: {
          p_amount: number
          p_payment_id?: string
          p_payment_intent: string
          p_session_id: string
        }
        Returns: {
          amount: number
          duplicate: boolean
          needs_review: boolean
          newly_paid: boolean
          payment_id: string
          phone: string
          refs: string[]
        }[]
      }
      create_coupon_order: {
        Args: {
          p_buyer_email: string
          p_buyer_name: string
          p_buyer_phone: string
          p_message?: string
          p_product_id: string
          p_recipient_name?: string
        }
        Returns: {
          amount: number
          id: string
          product_name: string
          reference: string
        }[]
      }
      create_event_ticket: {
        Args: {
          p_email?: string
          p_event_id: string
          p_name: string
          p_people: number
          p_phone?: string
        }
        Returns: {
          id: string
          reference: string
          total: number
        }[]
      }
      create_inquiry: {
        Args: {
          p_date: string | null
          p_email?: string
          p_estimate_max: number
          p_estimate_min: number
          p_event_type: string
          p_guests: number
          p_input: Json
          p_message: string
          p_name: string
          p_phone?: string
          p_space: string
        }
        Returns: {
          id: string
        }[]
      }
      create_mixed_quad_rental: {
        Args: {
          p_allocations: Json
          p_date: string
          p_discount_code?: string
          p_email?: string
          p_hours: number
          p_name: string
          p_note?: string
          p_phone?: string
          p_riders: number
          p_start_hour: number
        }
        Returns: {
          code_discount: number
          id: string
          reference: string
          total: number
        }[]
      }
      create_program_booking: {
        Args: {
          p_date: string
          p_discount_code?: string
          p_email?: string
          p_name: string
          p_note?: string
          p_party: number
          p_phone?: string
          p_program_id: string
          p_start_hour: number
        }
        Returns: {
          code_discount: number
          id: string
          reference: string
          total: number
        }[]
      }
      create_program_ticket: {
        Args: {
          p_adults: number
          p_children: number
          p_discount_code?: string
          p_email?: string
          p_event_id: string
          p_name: string
          p_phone?: string
        }
        Returns: {
          code_discount: number
          id: string
          reference: string
          total: number
        }[]
      }
      create_quad_rental: {
        Args: {
          p_date: string
          p_discount_code?: string
          p_email?: string
          p_hours: number
          p_name: string
          p_note?: string
          p_phone?: string
          p_riders: number
          p_start_hour: number
          p_type_id: string
          p_units: number
        }
        Returns: {
          code_discount: number
          id: string
          reference: string
          total: number
        }[]
      }
      create_sauna_booking:
        | {
            Args: {
              p_coupon?: string
              p_date: string
              p_email?: string
              p_extras: Json
              p_hours: number
              p_name: string
              p_note?: string
              p_party: number
              p_phone?: string
              p_start_hour: number
            }
            Returns: {
              discount: number
              id: string
              reference: string
              total: number
            }[]
          }
        | {
            Args: {
              p_coupon?: string
              p_date: string
              p_discount_code?: string
              p_email?: string
              p_extras: Json
              p_hours: number
              p_name: string
              p_note?: string
              p_party: number
              p_phone?: string
              p_sauna_id: string
              p_start_hour: number
            }
            Returns: {
              code_discount: number
              discount: number
              id: string
              reference: string
              total: number
            }[]
          }
      create_stay_booking: {
        Args: {
          p_coupon?: string
          p_date: string
          p_discount_code?: string
          p_email?: string
          p_guests: number
          p_name: string
          p_nights: number
          p_note?: string
          p_phone?: string
          p_stay_type_id: string
        }
        Returns: {
          code_discount: number
          discount: number
          id: string
          reference: string
          total: number
        }[]
      }
      create_stay_booking_with_units: {
        Args: {
          p_coupon?: string
          p_date: string
          p_discount_code?: string
          p_email?: string
          p_guests?: number
          p_name: string
          p_nights: number
          p_note?: string
          p_phone?: string
          p_stay_type_id: string
          p_units: number
        }
        Returns: {
          code_discount: number
          discount: number
          id: string
          reference: string
          total: number
        }[]
      }
      create_tour_ticket: {
        Args: {
          p_email?: string
          p_event_id: string
          p_name: string
          p_people: number
          p_phone?: string
        }
        Returns: {
          id: string
          reference: string
          total: number
        }[]
      }
      discount_code_usage: {
        Args: never
        Returns: {
          code_id: string
          discount_total: number
          uses: number
        }[]
      }
      expire_payment: {
        Args: { p_failed?: boolean; p_session_id: string }
        Returns: number
      }
      expire_pending_requests: {
        Args: never
        Returns: {
          bookings: number
          rentals: number
          tickets: number
        }[]
      }
      materialize_sauna_events: {
        Args: { p_days?: number; p_from: string }
        Returns: number
      }
      payment_notify_email: { Args: { p_payment_id: string }; Returns: string }
      payment_state: {
        Args: { p_payment_id: string }
        Returns: {
          amount: number
          customer_email: string
          items: Json
          needs_review: boolean
          paid_at: string
          refs: string[]
          status: string
          stripe_session_id: string
        }[]
      }
      quad_taken: {
        Args: { p_from: string; p_to: string }
        Returns: {
          day: string
          hour: number
          quad_type_id: string
          taken: number
        }[]
      }
      record_refund: {
        Args: { p_payment_intent: string; p_refunded: number }
        Returns: undefined
      }
      record_skipped_phone: { Args: { p_phone: string }; Returns: undefined }
      register_for_event: {
        Args: {
          p_email?: string
          p_event_id: string
          p_message?: string
          p_name: string
          p_people: number
          p_phone?: string
        }
        Returns: {
          id: string
        }[]
      }
      request_phone_code: {
        Args: { p_code_hash: string; p_ip_hash: string; p_phone: string }
        Returns: {
          reason: string
          retry_after: number
        }[]
      }
      sauna_taken: {
        Args: { p_from: string; p_to: string }
        Returns: {
          day: string
          hour: number
          sauna_id: string
        }[]
      }
      sauna_taken_hours: {
        Args: { p_from: string; p_to: string }
        Returns: {
          day: string
          hour: number
        }[]
      }
      start_payment: {
        Args: { p_refs: string[]; p_user: string }
        Returns: {
          amount: number
          customer_email: string
          expires_at: string
          items: Json
          payment_id: string
          stripe_session_id: string
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
      verify_phone_code: {
        Args: { p_code_hash: string; p_phone: string }
        Returns: string
      }
    }
    Enums: {
      booking_kind: "pirtis" | "namelis" | "kemperis"
      booking_source: "svetaine" | "telefonu" | "vietoje"
      booking_status: "laukia" | "patvirtinta" | "ivykdyta" | "atsaukta"
      coupon_kind: "verte" | "paslauga"
      coupon_service: "visi" | "kabelis" | "pirtis" | "miegas"
      coupon_status:
        | "laukia_apmokejimo"
        | "aktyvus"
        | "panaudotas"
        | "atsauktas"
      discount_kind: "procentai" | "suma"
      event_category:
        | "pirtis"
        | "vakarai"
        | "akademija"
        | "sventes"
        | "keturratis"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      booking_kind: ["pirtis", "namelis", "kemperis"],
      booking_source: ["svetaine", "telefonu", "vietoje"],
      booking_status: ["laukia", "patvirtinta", "ivykdyta", "atsaukta"],
      coupon_kind: ["verte", "paslauga"],
      coupon_service: ["visi", "kabelis", "pirtis", "miegas"],
      coupon_status: [
        "laukia_apmokejimo",
        "aktyvus",
        "panaudotas",
        "atsauktas",
      ],
      discount_kind: ["procentai", "suma"],
      event_category: [
        "pirtis",
        "vakarai",
        "akademija",
        "sventes",
        "keturratis",
      ],
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
