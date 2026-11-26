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
          discount_amount: number
          discount_code: string | null
          discount_code_id: string | null
          guests: number | null
          hours: number | null
          id: string
          inquiry_id: string | null
          kind: Database["public"]["Enums"]["booking_kind"]
          nights: number | null
          note: string | null
          paid_at: string | null
          payment_id: string | null
          payment_method: string | null
          program_id: string | null
          reference: string
          rider_id: string | null
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
          inquiry_id?: string | null
          kind: Database["public"]["Enums"]["booking_kind"]
          nights?: number | null
          note?: string | null
          paid_at?: string | null
          payment_id?: string | null
          payment_method?: string | null
          program_id?: string | null
          reference: string
          rider_id?: string | null
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
          inquiry_id?: string | null
          kind?: Database["public"]["Enums"]["booking_kind"]
          nights?: number | null
          note?: string | null
          paid_at?: string | null
          payment_id?: string | null
          payment_method?: string | null
          program_id?: string | null
          reference?: string
          rider_id?: string | null
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
            foreignKeyName: "bookings_discount_code_id_fkey"
            columns: ["discount_code_id"]
            isOneToOne: false
            referencedRelation: "discount_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_inquiry_id_fkey"
            columns: ["inquiry_id"]
            isOneToOne: false
            referencedRelation: "inquiries"
            referencedColumns: ["id"]
          },
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
            foreignKeyName: "bookings_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "riders"
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
      coupon_refunds: {
        Row: {
          amount: number
          coupon_id: string
          created_at: string
          id: string
          refunded_by: string | null
          status: string
          stripe_refund_id: string | null
        }
        Insert: {
          amount: number
          coupon_id: string
          created_at?: string
          id?: string
          refunded_by?: string | null
          status?: string
          stripe_refund_id?: string | null
        }
        Update: {
          amount?: number
          coupon_id?: string
          created_at?: string
          id?: string
          refunded_by?: string | null
          status?: string
          stripe_refund_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coupon_refunds_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: true
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
          discount_amount: number
          discount_code: string | null
          discount_code_id: string | null
          expires_at: string | null
          face_value: number
          id: string
          ip_hash: string | null
          kind: Database["public"]["Enums"]["coupon_kind"]
          last_emailed_at: string | null
          message: string
          paid_amount: number | null
          paid_at: string | null
          product_id: string
          product_name: string
          recipient_email: string
          recipient_name: string
          reference: string
          refunded_amount: number
          refunded_at: string | null
          rider_id: string | null
          service: Database["public"]["Enums"]["coupon_service"]
          status: Database["public"]["Enums"]["coupon_status"]
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          updated_at: string
        }
        Insert: {
          balance: number
          buyer_email: string
          buyer_name: string
          buyer_phone?: string | null
          code?: string | null
          created_at?: string
          discount_amount?: number
          discount_code?: string | null
          discount_code_id?: string | null
          expires_at?: string | null
          face_value: number
          id?: string
          ip_hash?: string | null
          kind: Database["public"]["Enums"]["coupon_kind"]
          last_emailed_at?: string | null
          message?: string
          paid_amount?: number | null
          paid_at?: string | null
          product_id: string
          product_name: string
          recipient_email?: string
          recipient_name?: string
          reference: string
          refunded_amount?: number
          refunded_at?: string | null
          rider_id?: string | null
          service: Database["public"]["Enums"]["coupon_service"]
          status?: Database["public"]["Enums"]["coupon_status"]
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          updated_at?: string
        }
        Update: {
          balance?: number
          buyer_email?: string
          buyer_name?: string
          buyer_phone?: string | null
          code?: string | null
          created_at?: string
          discount_amount?: number
          discount_code?: string | null
          discount_code_id?: string | null
          expires_at?: string | null
          face_value?: number
          id?: string
          ip_hash?: string | null
          kind?: Database["public"]["Enums"]["coupon_kind"]
          last_emailed_at?: string | null
          message?: string
          paid_amount?: number | null
          paid_at?: string | null
          product_id?: string
          product_name?: string
          recipient_email?: string
          recipient_name?: string
          reference?: string
          refunded_amount?: number
          refunded_at?: string | null
          rider_id?: string | null
          service?: Database["public"]["Enums"]["coupon_service"]
          status?: Database["public"]["Enums"]["coupon_status"]
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupons_discount_code_id_fkey"
            columns: ["discount_code_id"]
            isOneToOne: false
            referencedRelation: "discount_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupons_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "coupon_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupons_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "riders"
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
      event_presets: {
        Row: {
          active: boolean
          adults: number
          id: string
          kids: number
          label: string
          per_guest_max: number
          per_guest_min: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          adults: number
          id: string
          kids?: number
          label: string
          per_guest_max: number
          per_guest_min: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          adults?: number
          id?: string
          kids?: number
          label?: string
          per_guest_max?: number
          per_guest_min?: number
          sort_order?: number
          updated_at?: string
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
          paid_at: string | null
          payment_id: string | null
          payment_method: string | null
          people: number
          reference: string
          rider_id: string | null
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
          paid_at?: string | null
          payment_id?: string | null
          payment_method?: string | null
          people: number
          reference: string
          rider_id?: string | null
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
          paid_at?: string | null
          payment_id?: string | null
          payment_method?: string | null
          people?: number
          reference?: string
          rider_id?: string | null
          source?: Database["public"]["Enums"]["booking_source"]
          status?: Database["public"]["Enums"]["booking_status"]
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_tickets_discount_code_id_fkey"
            columns: ["discount_code_id"]
            isOneToOne: false
            referencedRelation: "discount_codes"
            referencedColumns: ["id"]
          },
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
          {
            foreignKeyName: "event_tickets_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "riders"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          blurb: string
          calendar_private: boolean
          capacity: number | null
          category: Database["public"]["Enums"]["event_category"]
          created_at: string
          date: string
          duration_minutes: number | null
          held: number
          id: string
          place: string
          price: number | null
          program_id: string | null
          published: boolean
          regular_price: number | null
          sauna_master_id: string | null
          sold: number
          start_time: string
          template_id: string | null
          title: string
          tour_route_id: string | null
          updated_at: string
        }
        Insert: {
          blurb: string
          calendar_private?: boolean
          capacity?: number | null
          category: Database["public"]["Enums"]["event_category"]
          created_at?: string
          date: string
          duration_minutes?: number | null
          held?: number
          id?: string
          place: string
          price?: number | null
          program_id?: string | null
          published?: boolean
          regular_price?: number | null
          sauna_master_id?: string | null
          sold?: number
          start_time: string
          template_id?: string | null
          title: string
          tour_route_id?: string | null
          updated_at?: string
        }
        Update: {
          blurb?: string
          calendar_private?: boolean
          capacity?: number | null
          category?: Database["public"]["Enums"]["event_category"]
          created_at?: string
          date?: string
          duration_minutes?: number | null
          held?: number
          id?: string
          place?: string
          price?: number | null
          program_id?: string | null
          published?: boolean
          regular_price?: number | null
          sauna_master_id?: string | null
          sold?: number
          start_time?: string
          template_id?: string | null
          title?: string
          tour_route_id?: string | null
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
            foreignKeyName: "events_sauna_master_id_fkey"
            columns: ["sauna_master_id"]
            isOneToOne: false
            referencedRelation: "sauna_masters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "sauna_event_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_tour_route_id_fkey"
            columns: ["tour_route_id"]
            isOneToOne: false
            referencedRelation: "quad_tour_routes"
            referencedColumns: ["id"]
          },
        ]
      }
      external_blocks: {
        Row: {
          calendar_id: string
          id: string
          nights: number
          starts_on: string
          uid: string
        }
        Insert: {
          calendar_id: string
          id?: string
          nights: number
          starts_on: string
          uid: string
        }
        Update: {
          calendar_id?: string
          id?: string
          nights?: number
          starts_on?: string
          uid?: string
        }
        Relationships: [
          {
            foreignKeyName: "external_blocks_calendar_id_fkey"
            columns: ["calendar_id"]
            isOneToOne: false
            referencedRelation: "external_calendars"
            referencedColumns: ["id"]
          },
        ]
      }
      external_calendar_exports: {
        Row: {
          calendar_id: string
          created_at: string
          token: string
        }
        Insert: {
          calendar_id: string
          created_at?: string
          token?: string
        }
        Update: {
          calendar_id?: string
          created_at?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "external_calendar_exports_calendar_id_fkey"
            columns: ["calendar_id"]
            isOneToOne: true
            referencedRelation: "external_calendars"
            referencedColumns: ["id"]
          },
        ]
      }
      external_calendar_feeds: {
        Row: {
          calendar_id: string
          feed_url: string
        }
        Insert: {
          calendar_id: string
          feed_url: string
        }
        Update: {
          calendar_id?: string
          feed_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "external_calendar_feeds_calendar_id_fkey"
            columns: ["calendar_id"]
            isOneToOne: true
            referencedRelation: "external_calendars"
            referencedColumns: ["id"]
          },
        ]
      }
      external_calendars: {
        Row: {
          active: boolean
          created_at: string
          id: string
          label: string
          last_error: string | null
          last_synced_at: string | null
          stay_type_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          label: string
          last_error?: string | null
          last_synced_at?: string | null
          stay_type_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          label?: string
          last_error?: string | null
          last_synced_at?: string | null
          stay_type_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "external_calendars_stay_type_id_fkey"
            columns: ["stay_type_id"]
            isOneToOne: false
            referencedRelation: "stay_types"
            referencedColumns: ["id"]
          },
        ]
      }
      inquiries: {
        Row: {
          accepted_at: string | null
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
          accepted_at?: string | null
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
          accepted_at?: string | null
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
      loyalty_settings: {
        Row: {
          earn_points_per_euro: number
          enabled: boolean
          id: boolean
          point_value_eur: number
          updated_at: string
        }
        Insert: {
          earn_points_per_euro?: number
          enabled?: boolean
          id?: boolean
          point_value_eur?: number
          updated_at?: string
        }
        Update: {
          earn_points_per_euro?: number
          enabled?: boolean
          id?: boolean
          point_value_eur?: number
          updated_at?: string
        }
        Relationships: []
      }
      notification_recipients: {
        Row: {
          active: boolean
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          topics: string[]
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          topics?: string[]
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          topics?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      page_content: {
        Row: {
          content: Json
          slug: string
          updated_at: string
        }
        Insert: {
          content?: Json
          slug: string
          updated_at?: string
        }
        Update: {
          content?: Json
          slug?: string
          updated_at?: string
        }
        Relationships: []
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
          points_discount: number
          points_rider_id: string | null
          points_spent: number
          refunded: number
          staff_created: boolean
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
          points_discount?: number
          points_rider_id?: string | null
          points_spent?: number
          refunded?: number
          staff_created?: boolean
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
          points_discount?: number
          points_rider_id?: string | null
          points_spent?: number
          refunded?: number
          staff_created?: boolean
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_points_rider_id_fkey"
            columns: ["points_rider_id"]
            isOneToOne: false
            referencedRelation: "riders"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_passes: {
        Row: {
          buyer_email: string
          buyer_name: string
          code: string | null
          created_at: string
          discount_amount: number
          discount_code: string | null
          discount_code_id: string | null
          gift: boolean
          id: string
          ip_hash: string | null
          paid_at: string | null
          plan_category: string
          plan_id: string | null
          plan_name: string
          price: number
          purchase_id: string | null
          recipient_name: string
          redeemed_at: string | null
          redeemed_by: string | null
          reference: string
          refunded_at: string | null
          rider_id: string | null
          status: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
        }
        Insert: {
          buyer_email: string
          buyer_name: string
          code?: string | null
          created_at?: string
          discount_amount?: number
          discount_code?: string | null
          discount_code_id?: string | null
          gift?: boolean
          id?: string
          ip_hash?: string | null
          paid_at?: string | null
          plan_category: string
          plan_id?: string | null
          plan_name: string
          price: number
          purchase_id?: string | null
          recipient_name?: string
          redeemed_at?: string | null
          redeemed_by?: string | null
          reference: string
          refunded_at?: string | null
          rider_id?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
        }
        Update: {
          buyer_email?: string
          buyer_name?: string
          code?: string | null
          created_at?: string
          discount_amount?: number
          discount_code?: string | null
          discount_code_id?: string | null
          gift?: boolean
          id?: string
          ip_hash?: string | null
          paid_at?: string | null
          plan_category?: string
          plan_id?: string | null
          plan_name?: string
          price?: number
          purchase_id?: string | null
          recipient_name?: string
          redeemed_at?: string | null
          redeemed_by?: string | null
          reference?: string
          refunded_at?: string | null
          rider_id?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plan_passes_discount_code_id_fkey"
            columns: ["discount_code_id"]
            isOneToOne: false
            referencedRelation: "discount_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_passes_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "ride_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_passes_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_passes_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "riders"
            referencedColumns: ["id"]
          },
        ]
      }
      points_ledger: {
        Row: {
          balance_after: number
          created_at: string
          created_by: string | null
          delta: number
          id: string
          kind: string
          parent_source_id: string | null
          reason: string
          rider_id: string
          source_id: string | null
          source_kind: string | null
        }
        Insert: {
          balance_after: number
          created_at?: string
          created_by?: string | null
          delta: number
          id?: string
          kind: string
          parent_source_id?: string | null
          reason?: string
          rider_id: string
          source_id?: string | null
          source_kind?: string | null
        }
        Update: {
          balance_after?: number
          created_at?: string
          created_by?: string | null
          delta?: number
          id?: string
          kind?: string
          parent_source_id?: string | null
          reason?: string
          rider_id?: string
          source_id?: string | null
          source_kind?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "points_ledger_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "riders"
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
      purchases: {
        Row: {
          id: string
          payment_method: string | null
          plan_category: string
          plan_id: string | null
          plan_name: string
          price: number | null
          rider_id: string
          sold_at: string
          sold_by: string | null
        }
        Insert: {
          id?: string
          payment_method?: string | null
          plan_category: string
          plan_id?: string | null
          plan_name: string
          price?: number | null
          rider_id: string
          sold_at?: string
          sold_by?: string | null
        }
        Update: {
          id?: string
          payment_method?: string | null
          plan_category?: string
          plan_id?: string | null
          plan_name?: string
          price?: number | null
          rider_id?: string
          sold_at?: string
          sold_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchases_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "ride_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "riders"
            referencedColumns: ["id"]
          },
        ]
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
          paid_at: string | null
          payment_id: string | null
          payment_method: string | null
          quad_type_id: string | null
          reference: string
          rider_id: string | null
          riders: number
          source: Database["public"]["Enums"]["booking_source"]
          start_hour: number
          status: Database["public"]["Enums"]["booking_status"]
          total: number
          tour_accessories: Json
          tour_event_id: string | null
          tour_route_id: string | null
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
          paid_at?: string | null
          payment_id?: string | null
          payment_method?: string | null
          quad_type_id?: string | null
          reference: string
          rider_id?: string | null
          riders: number
          source?: Database["public"]["Enums"]["booking_source"]
          start_hour: number
          status?: Database["public"]["Enums"]["booking_status"]
          total: number
          tour_accessories?: Json
          tour_event_id?: string | null
          tour_route_id?: string | null
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
          paid_at?: string | null
          payment_id?: string | null
          payment_method?: string | null
          quad_type_id?: string | null
          reference?: string
          rider_id?: string | null
          riders?: number
          source?: Database["public"]["Enums"]["booking_source"]
          start_hour?: number
          status?: Database["public"]["Enums"]["booking_status"]
          total?: number
          tour_accessories?: Json
          tour_event_id?: string | null
          tour_route_id?: string | null
          units?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quad_rentals_discount_code_id_fkey"
            columns: ["discount_code_id"]
            isOneToOne: false
            referencedRelation: "discount_codes"
            referencedColumns: ["id"]
          },
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
          {
            foreignKeyName: "quad_rentals_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "riders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quad_rentals_tour_event_id_fkey"
            columns: ["tour_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quad_rentals_tour_route_id_fkey"
            columns: ["tour_route_id"]
            isOneToOne: false
            referencedRelation: "quad_tour_routes"
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
          tour_cancellation_note: string
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
          tour_cancellation_note?: string
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
          tour_cancellation_note?: string
          updated_at?: string
        }
        Relationships: []
      }
      quad_tour_accessories: {
        Row: {
          active: boolean
          created_at: string
          description: string
          id: string
          name: string
          price: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string
          id: string
          name: string
          price: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string
          id?: string
          name?: string
          price?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      quad_tour_routes: {
        Row: {
          active: boolean
          badge: string | null
          created_at: string
          description: string
          duration_label: string
          hours: number
          id: string
          kilometres: number
          long_description: string
          min_units: number
          name: string
          photo: string
          price: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          badge?: string | null
          created_at?: string
          description?: string
          duration_label?: string
          hours: number
          id: string
          kilometres: number
          long_description?: string
          min_units?: number
          name: string
          photo?: string
          price: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          badge?: string | null
          created_at?: string
          description?: string
          duration_label?: string
          hours?: number
          id?: string
          kilometres?: number
          long_description?: string
          min_units?: number
          name?: string
          photo?: string
          price?: number
          sort_order?: number
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
      request_refunds: {
        Row: {
          amount: number
          created_at: string
          id: string
          kind: string
          payment_id: string
          reference: string
          refunded_by: string | null
          request_id: string
          status: string
          stripe_refund_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          kind: string
          payment_id: string
          reference: string
          refunded_by?: string | null
          request_id: string
          status?: string
          stripe_refund_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          kind?: string
          payment_id?: string
          reference?: string
          refunded_by?: string | null
          request_id?: string
          status?: string
          stripe_refund_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "request_refunds_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      ride_plans: {
        Row: {
          active: boolean
          category: string
          created_at: string
          description: string
          id: string
          name: string
          price: number | null
          sold_online: boolean
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          category?: string
          created_at?: string
          description?: string
          id?: string
          name: string
          price?: number | null
          sold_online?: boolean
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          category?: string
          created_at?: string
          description?: string
          id?: string
          name?: string
          price?: number | null
          sold_online?: boolean
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      rider_cards: {
        Row: {
          bound_at: string
          card_number: string
          rider_id: string
        }
        Insert: {
          bound_at?: string
          card_number: string
          rider_id: string
        }
        Update: {
          bound_at?: string
          card_number?: string
          rider_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rider_cards_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: true
            referencedRelation: "riders"
            referencedColumns: ["id"]
          },
        ]
      }
      rider_comments: {
        Row: {
          author_id: string | null
          author_name: string
          created_at: string
          id: string
          rider_id: string
          text: string
        }
        Insert: {
          author_id?: string | null
          author_name: string
          created_at?: string
          id?: string
          rider_id: string
          text: string
        }
        Update: {
          author_id?: string | null
          author_name?: string
          created_at?: string
          id?: string
          rider_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "rider_comments_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "riders"
            referencedColumns: ["id"]
          },
        ]
      }
      rider_documents: {
        Row: {
          file_name: string
          file_path: string
          id: string
          rider_id: string
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          file_name: string
          file_path: string
          id?: string
          rider_id: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          file_name?: string
          file_path?: string
          id?: string
          rider_id?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rider_documents_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "riders"
            referencedColumns: ["id"]
          },
        ]
      }
      rider_plan_orders: {
        Row: {
          created_at: string
          discount_amount: number
          discount_code: string | null
          discount_code_id: string | null
          id: string
          paid_at: string | null
          plan_category: string
          plan_id: string | null
          plan_name: string
          price: number
          purchase_id: string | null
          reference: string
          rider_id: string
          status: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
        }
        Insert: {
          created_at?: string
          discount_amount?: number
          discount_code?: string | null
          discount_code_id?: string | null
          id?: string
          paid_at?: string | null
          plan_category: string
          plan_id?: string | null
          plan_name: string
          price: number
          purchase_id?: string | null
          reference: string
          rider_id: string
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
        }
        Update: {
          created_at?: string
          discount_amount?: number
          discount_code?: string | null
          discount_code_id?: string | null
          id?: string
          paid_at?: string | null
          plan_category?: string
          plan_id?: string | null
          plan_name?: string
          price?: number
          purchase_id?: string | null
          reference?: string
          rider_id?: string
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rider_plan_orders_discount_code_id_fkey"
            columns: ["discount_code_id"]
            isOneToOne: false
            referencedRelation: "discount_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rider_plan_orders_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "ride_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rider_plan_orders_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rider_plan_orders_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "riders"
            referencedColumns: ["id"]
          },
        ]
      }
      rider_sessions: {
        Row: {
          card_number: string
          ended_at: string | null
          id: string
          rider_id: string
          started_at: string
        }
        Insert: {
          card_number: string
          ended_at?: string | null
          id?: string
          rider_id: string
          started_at?: string
        }
        Update: {
          card_number?: string
          ended_at?: string | null
          id?: string
          rider_id?: string
          started_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rider_sessions_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "riders"
            referencedColumns: ["id"]
          },
        ]
      }
      rider_waivers: {
        Row: {
          id: string
          rider_id: string
          signature_path: string | null
          signed_at: string
          terms_version: string
        }
        Insert: {
          id?: string
          rider_id: string
          signature_path?: string | null
          signed_at?: string
          terms_version: string
        }
        Update: {
          id?: string
          rider_id?: string
          signature_path?: string | null
          signed_at?: string
          terms_version?: string
        }
        Relationships: [
          {
            foreignKeyName: "rider_waivers_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "riders"
            referencedColumns: ["id"]
          },
        ]
      }
      riders: {
        Row: {
          avatar_path: string | null
          birthdate: string | null
          created_at: string
          duplicate_of: string | null
          email: string | null
          grabby_id: string | null
          id: string
          name: string
          needs_review: boolean
          phone: string | null
          phone2: string | null
          plan_id: string | null
          points_balance: number
          self_registered: boolean
          surname: string
          updated_at: string
        }
        Insert: {
          avatar_path?: string | null
          birthdate?: string | null
          created_at?: string
          duplicate_of?: string | null
          email?: string | null
          grabby_id?: string | null
          id?: string
          name: string
          needs_review?: boolean
          phone?: string | null
          phone2?: string | null
          plan_id?: string | null
          points_balance?: number
          self_registered?: boolean
          surname: string
          updated_at?: string
        }
        Update: {
          avatar_path?: string | null
          birthdate?: string | null
          created_at?: string
          duplicate_of?: string | null
          email?: string | null
          grabby_id?: string | null
          id?: string
          name?: string
          needs_review?: boolean
          phone?: string | null
          phone2?: string | null
          plan_id?: string | null
          points_balance?: number
          self_registered?: boolean
          surname?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "riders_duplicate_of_fkey"
            columns: ["duplicate_of"]
            isOneToOne: false
            referencedRelation: "riders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "riders_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "ride_plans"
            referencedColumns: ["id"]
          },
        ]
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
      sauna_masters: {
        Row: {
          active: boolean
          created_at: string
          description: string
          id: string
          min_hours: number
          name: string
          price: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string
          id: string
          min_hours?: number
          name: string
          price: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string
          id?: string
          min_hours?: number
          name?: string
          price?: number
          sort_order?: number
          updated_at?: string
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
          min_hours: number | null
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
          min_hours?: number | null
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
          min_hours?: number | null
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
          coming_soon: boolean
          created_at: string
          description: string
          extra_guest_fee: number
          features: string[]
          id: string
          included_guests: number
          large_group_rate: number | null
          max_hours: number
          max_party: number
          min_hours: number
          name: string
          open_hour: number
          package_hours: number | null
          package_price: number | null
          photos: string[]
          small_group_max: number | null
          small_group_rate: number | null
          sort_order: number
          turnaround_hours: number
          updated_at: string
          weekday_prices: Json
          weekend_prices: Json
        }
        Insert: {
          active?: boolean
          close_hour: number
          coming_soon?: boolean
          created_at?: string
          description?: string
          extra_guest_fee?: number
          features?: string[]
          id: string
          included_guests?: number
          large_group_rate?: number | null
          max_hours: number
          max_party: number
          min_hours: number
          name: string
          open_hour: number
          package_hours?: number | null
          package_price?: number | null
          photos?: string[]
          small_group_max?: number | null
          small_group_rate?: number | null
          sort_order?: number
          turnaround_hours?: number
          updated_at?: string
          weekday_prices?: Json
          weekend_prices?: Json
        }
        Update: {
          active?: boolean
          close_hour?: number
          coming_soon?: boolean
          created_at?: string
          description?: string
          extra_guest_fee?: number
          features?: string[]
          id?: string
          included_guests?: number
          large_group_rate?: number | null
          max_hours?: number
          max_party?: number
          min_hours?: number
          name?: string
          open_hour?: number
          package_hours?: number | null
          package_price?: number | null
          photos?: string[]
          small_group_max?: number | null
          small_group_rate?: number | null
          sort_order?: number
          turnaround_hours?: number
          updated_at?: string
          weekday_prices?: Json
          weekend_prices?: Json
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          coming_soon: boolean
          id: boolean
          updated_at: string
        }
        Insert: {
          coming_soon?: boolean
          id?: boolean
          updated_at?: string
        }
        Update: {
          coming_soon?: boolean
          id?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      space_bookings: {
        Row: {
          created_at: string
          created_by: string | null
          customer_email: string | null
          customer_name: string
          customer_phone: string
          customer_surname: string
          date: string
          end_date: string
          end_time: string
          guests: number
          id: string
          note: string
          price: number
          spaces: string[]
          start_time: string
          status: Database["public"]["Enums"]["booking_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          customer_email?: string | null
          customer_name: string
          customer_phone: string
          customer_surname?: string
          date: string
          end_date: string
          end_time: string
          guests?: number
          id?: string
          note?: string
          price?: number
          spaces: string[]
          start_time: string
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string
          customer_surname?: string
          date?: string
          end_date?: string
          end_time?: string
          guests?: number
          id?: string
          note?: string
          price?: number
          spaces?: string[]
          start_time?: string
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
        }
        Relationships: []
      }
      spaces: {
        Row: {
          active: boolean
          blurb: string
          created_at: string
          id: string
          label: string
          max_guests: number
          price_weekday: number | null
          price_weekend: number | null
          sort_order: number
          updated_at: string
          whole_park: boolean
        }
        Insert: {
          active?: boolean
          blurb?: string
          created_at?: string
          id: string
          label: string
          max_guests: number
          price_weekday?: number | null
          price_weekend?: number | null
          sort_order?: number
          updated_at?: string
          whole_park?: boolean
        }
        Update: {
          active?: boolean
          blurb?: string
          created_at?: string
          id?: string
          label?: string
          max_guests?: number
          price_weekday?: number | null
          price_weekend?: number | null
          sort_order?: number
          updated_at?: string
          whole_park?: boolean
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
      staff_notification_reads: {
        Row: {
          read_at: string
          user_id: string
        }
        Insert: {
          read_at?: string
          user_id: string
        }
        Update: {
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_notification_reads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "staff"
            referencedColumns: ["user_id"]
          },
        ]
      }
      staff_notifications: {
        Row: {
          body: string
          created_at: string
          href: string
          id: string
          kind: string
          permissions: string[]
          reference: string | null
          title: string
        }
        Insert: {
          body?: string
          created_at?: string
          href?: string
          id?: string
          kind: string
          permissions: string[]
          reference?: string | null
          title: string
        }
        Update: {
          body?: string
          created_at?: string
          href?: string
          id?: string
          kind?: string
          permissions?: string[]
          reference?: string | null
          title?: string
        }
        Relationships: []
      }
      staff_push_tokens: {
        Row: {
          active: boolean
          created_at: string
          device_name: string
          expo_push_token: string
          id: string
          topics: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          device_name?: string
          expo_push_token: string
          id?: string
          topics?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          device_name?: string
          expo_push_token?: string
          id?: string
          topics?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_push_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["user_id"]
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
      stay_room_assignments: {
        Row: {
          booking_id: string
          calendar_id: string
          created_at: string
          nights: number
          starts_on: string
          unit: number
        }
        Insert: {
          booking_id: string
          calendar_id: string
          created_at?: string
          nights: number
          starts_on: string
          unit: number
        }
        Update: {
          booking_id?: string
          calendar_id?: string
          created_at?: string
          nights?: number
          starts_on?: string
          unit?: number
        }
        Relationships: [
          {
            foreignKeyName: "stay_room_assignments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stay_room_assignments_calendar_id_fkey"
            columns: ["calendar_id"]
            isOneToOne: false
            referencedRelation: "external_calendars"
            referencedColumns: ["id"]
          },
        ]
      }
      stay_type_seasons: {
        Row: {
          created_at: string
          ends_on: string
          id: string
          price_per_night: number
          price_per_night_2: number
          price_per_night_3: number
          starts_on: string
          stay_type_id: string
        }
        Insert: {
          created_at?: string
          ends_on: string
          id?: string
          price_per_night: number
          price_per_night_2: number
          price_per_night_3: number
          starts_on: string
          stay_type_id: string
        }
        Update: {
          created_at?: string
          ends_on?: string
          id?: string
          price_per_night?: number
          price_per_night_2?: number
          price_per_night_3?: number
          starts_on?: string
          stay_type_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stay_type_seasons_stay_type_id_fkey"
            columns: ["stay_type_id"]
            isOneToOne: false
            referencedRelation: "stay_types"
            referencedColumns: ["id"]
          },
        ]
      }
      stay_types: {
        Row: {
          active: boolean
          bookable_until: string | null
          id: string
          kind: Database["public"]["Enums"]["booking_kind"]
          label: string
          max_guests: number
          note: string
          price_per_night: number
          price_per_night_2: number
          price_per_night_3: number
          sort_order: number
          units: number | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          bookable_until?: string | null
          id: string
          kind: Database["public"]["Enums"]["booking_kind"]
          label: string
          max_guests: number
          note?: string
          price_per_night: number
          price_per_night_2: number
          price_per_night_3: number
          sort_order?: number
          units?: number | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          bookable_until?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["booking_kind"]
          label?: string
          max_guests?: number
          note?: string
          price_per_night?: number
          price_per_night_2?: number
          price_per_night_3?: number
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
      abandon_coupon_order: {
        Args: { p_coupon_id: string }
        Returns: undefined
      }
      abandon_payment: { Args: { p_payment_id: string }; Returns: number }
      abandon_plan_order: { Args: { p_order_id: string }; Returns: undefined }
      abandon_plan_pass: { Args: { p_pass_id: string }; Returns: undefined }
      accept_inquiry_stays: { Args: { p_inquiry_id: string }; Returns: number }
      account_notify_email: { Args: { p_user: string }; Returns: string }
      activate_coupon: {
        Args: { p_id: string }
        Returns: {
          code: string
          expires_at: string
        }[]
      }
      adjust_rider_points: {
        Args: { p_delta: number; p_reason: string; p_rider: string }
        Returns: number
      }
      admin_login_check: {
        Args: { p_email_hash: string; p_ip_hash: string; p_kind: string }
        Returns: {
          allowed: boolean
          retry_after: number
        }[]
      }
      admin_login_record: {
        Args: {
          p_email_hash: string
          p_ip_hash: string
          p_kind: string
          p_ok: boolean
        }
        Returns: undefined
      }
      assign_stay_rooms: { Args: never; Returns: number }
      attach_coupon_session: {
        Args: { p_coupon_id: string; p_session_id: string }
        Returns: undefined
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
      attach_plan_order_session: {
        Args: { p_order_id: string; p_session_id: string }
        Returns: undefined
      }
      attach_plan_pass_session: {
        Args: { p_pass_id: string; p_session_id: string }
        Returns: undefined
      }
      auth_user_has_password: { Args: { p_user: string }; Returns: boolean }
      begin_coupon_refund: {
        Args: { p_coupon: string; p_staff: string }
        Returns: {
          amount: number
          created_at: string
          payment_intent: string
          reference: string
          refund_id: string
          resumed: boolean
        }[]
      }
      begin_request_refund: {
        Args: { p_id: string; p_kind: string; p_staff: string }
        Returns: {
          amount: number
          created_at: string
          payment_intent: string
          reference: string
          refund_id: string
          resumed: boolean
        }[]
      }
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
      complete_coupon_payment: {
        Args: {
          p_amount: number
          p_coupon_id: string
          p_payment_intent: string
          p_session_id: string
        }
        Returns: {
          amount_ok: boolean
          buyer_email: string
          buyer_name: string
          code: string
          expires_at: string
          face_value: number
          id: string
          message: string
          newly_paid: boolean
          product_name: string
          recipient_email: string
          recipient_name: string
          reference: string
          service: Database["public"]["Enums"]["coupon_service"]
          status: Database["public"]["Enums"]["coupon_status"]
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
          confirmed: boolean
          duplicate: boolean
          needs_review: boolean
          newly_paid: boolean
          payment_id: string
          phone: string
          refs: string[]
        }[]
      }
      complete_plan_order_payment: {
        Args: {
          p_amount: number
          p_order_id: string
          p_payment_intent: string
          p_session_id: string
        }
        Returns: {
          amount_ok: boolean
          newly_paid: boolean
          order_status: string
          plan_name: string
          price: number
          reference: string
          rider_email: string
          rider_id: string
          rider_name: string
        }[]
      }
      complete_plan_pass_payment: {
        Args: {
          p_amount: number
          p_pass_id: string
          p_payment_intent: string
          p_session_id: string
        }
        Returns: {
          amount_ok: boolean
          buyer_email: string
          buyer_name: string
          gift: boolean
          newly_paid: boolean
          order_status: string
          pass_code: string
          plan_name: string
          price: number
          recipient_name: string
          reference: string
        }[]
      }
      confirm_cash_request: { Args: { p_reference: string }; Returns: boolean }
      coupon_payment_state: {
        Args: { p_session_id: string }
        Returns: {
          buyer_name: string
          code: string
          expires_at: string
          face_value: number
          has_recipient: boolean
          message: string
          product_name: string
          recipient_name: string
          reference: string
          service: Database["public"]["Enums"]["coupon_service"]
          status: Database["public"]["Enums"]["coupon_status"]
        }[]
      }
      create_coupon_order: {
        Args: {
          p_buyer_email: string
          p_buyer_name: string
          p_buyer_phone: string
          p_discount_code?: string
          p_ip_hash?: string
          p_message?: string
          p_product_id: string
          p_recipient_email?: string
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
      create_plan_order: {
        Args: {
          p_discount_code?: string
          p_plan_id: string
          p_rider_id: string
        }
        Returns: {
          id: string
          plan_name: string
          price: number
          reference: string
          rider_email: string
          rider_name: string
        }[]
      }
      create_plan_pass: {
        Args: {
          p_buyer_email: string
          p_buyer_name: string
          p_discount_code?: string
          p_gift?: boolean
          p_ip_hash?: string
          p_plan_id: string
          p_recipient_name?: string
        }
        Returns: {
          id: string
          plan_name: string
          price: number
          reference: string
        }[]
      }
      create_program_booking: {
        Args: {
          p_date: string
          p_discount_code?: string
          p_email?: string
          p_master_id?: string
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
      create_quad_tour_departure_rental: {
        Args: {
          p_accessories: Json
          p_discount_code?: string
          p_email?: string
          p_event_id: string
          p_name: string
          p_note?: string
          p_phone?: string
          p_units: number
        }
        Returns: {
          code_discount: number
          id: string
          reference: string
          total: number
        }[]
      }
      create_quad_tour_rental: {
        Args: {
          p_accessories: Json
          p_date: string
          p_discount_code?: string
          p_email?: string
          p_name: string
          p_note?: string
          p_phone?: string
          p_route_id: string
          p_start_hour: number
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
              p_master_id?: string
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
      expire_coupon_session: { Args: { p_session_id: string }; Returns: number }
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
      expire_plan_order_session: {
        Args: { p_session_id: string }
        Returns: number
      }
      expire_plan_pass_session: {
        Args: { p_session_id: string }
        Returns: number
      }
      external_sync_failed: {
        Args: { p_calendar: string; p_error: string }
        Returns: undefined
      }
      external_sync_feeds: {
        Args: never
        Returns: {
          calendar_id: string
          feed_url: string
        }[]
      }
      fail_coupon_refund: { Args: { p_id: string }; Returns: undefined }
      fail_request_refund: { Args: { p_id: string }; Returns: undefined }
      finalize_rider_registration_public: {
        Args: {
          p_avatar_path: string
          p_rider_id: string
          p_signature_path: string
        }
        Returns: undefined
      }
      finish_coupon_refund: {
        Args: { p_id: string; p_stripe_refund_id: string }
        Returns: undefined
      }
      finish_request_refund: {
        Args: { p_id: string; p_stripe_refund_id: string }
        Returns: undefined
      }
      materialize_sauna_events: {
        Args: { p_days?: number; p_from: string }
        Returns: number
      }
      my_coupons: {
        Args: never
        Returns: {
          balance: number
          buyer_name: string
          code: string
          expires_at: string
          face_value: number
          message: string
          paid_at: string
          product_name: string
          recipient_name: string
          reference: string
          role: string
          service: Database["public"]["Enums"]["coupon_service"]
          session_id: string
          status: Database["public"]["Enums"]["coupon_status"]
        }[]
      }
      my_inquiries: {
        Args: never
        Returns: {
          accepted: boolean
          contact_email: string
          contact_name: string
          contact_phone: string
          created_at: string
          date: string
          estimate_max: number
          estimate_min: number
          event_type: string
          guests: number
          id: string
          lines: Json
          message: string
          space: string
          status: Database["public"]["Enums"]["inquiry_status"]
        }[]
      }
      my_points: {
        Args: never
        Returns: {
          balance: number
          entries: Json
          primary_match: boolean
          rider_id: string
          rider_name: string
        }[]
      }
      my_riders: {
        Args: never
        Returns: {
          avatar_path: string
          birthdate: string
          cards: string[]
          email: string
          id: string
          name: string
          phone: string
          phone2: string
          plan_category: string
          plan_description: string
          plan_name: string
          plan_price: number
          primary_match: boolean
          purchases: Json
          registered: boolean
          signed_at: string
          surname: string
          terms_version: string
        }[]
      }
      my_spendable_points: {
        Args: never
        Returns: {
          balance: number
          enabled: boolean
          point_value_eur: number
        }[]
      }
      online_plans: {
        Args: never
        Returns: {
          category: string
          description: string
          id: string
          name: string
          price: number
        }[]
      }
      paid_request_details: {
        Args: { p_payment_id: string }
        Returns: {
          day: string
          end_time: string
          nights: number
          reference: string
          service: string
          start_time: string
          title: string
        }[]
      }
      paid_staff_details: {
        Args: { p_payment_id: string }
        Returns: {
          customer_email: string
          customer_name: string
          customer_phone: string
          discount_code: string
          note: string
          people: number
          reference: string
          total: number
          units: number
        }[]
      }
      payment_notify_email: { Args: { p_payment_id: string }; Returns: string }
      payment_requests: {
        Args: { p_payment_id: string }
        Returns: {
          date: string
          guests: number
          hours: number
          kind: string
          nights: number
          reference: string
          start_hour: number
          start_time: string
          status: string
          title: string
          total: number
          units: number
        }[]
      }
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
      plan_order_state: {
        Args: { p_session_id: string }
        Returns: {
          discount_code: string
          gift: boolean
          kind: string
          pass_code: string
          plan_name: string
          price: number
          reference: string
          rider_email: string
          status: string
        }[]
      }
      private_event_dates: {
        Args: { p_from: string; p_to: string }
        Returns: {
          event_date: string
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
      redeem_plan_pass: {
        Args: { p_pass_id: string; p_replace?: boolean; p_rider_id: string }
        Returns: {
          plan_category: string
          plan_id: string
          plan_name: string
          price: number
          purchase_id: string
          sold_at: string
        }[]
      }
      redeem_points_on_payment: {
        Args: { p_payment_id: string; p_points: number; p_user: string }
        Returns: {
          amount: number
          points_discount: number
          points_spent: number
        }[]
      }
      refund_coupon_payment: {
        Args: { p_payment_intent: string; p_refunded: number }
        Returns: string
      }
      refund_plan_order_payment: {
        Args: { p_payment_intent: string; p_refunded: number }
        Returns: string
      }
      refund_plan_pass_payment: {
        Args: { p_payment_intent: string; p_refunded: number }
        Returns: {
          reference: string
          was_attached: boolean
        }[]
      }
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
      register_rider_public: {
        Args: {
          p_birthdate: string
          p_email: string
          p_name: string
          p_phone: string
          p_phone2: string
          p_surname: string
          p_terms_version: string
        }
        Returns: {
          already_registered: boolean
          rider_id: string
        }[]
      }
      release_inquiry_stays: { Args: { p_inquiry_id: string }; Returns: number }
      request_phone_code: {
        Args: { p_code_hash: string; p_ip_hash: string; p_phone: string }
        Returns: {
          reason: string
          retry_after: number
        }[]
      }
      resend_coupon_email: {
        Args: { p_session_id: string }
        Returns: {
          allowed: boolean
          buyer_email: string
          buyer_name: string
          code: string
          expires_at: string
          face_value: number
          message: string
          product_name: string
          recipient_name: string
          retry_in: number
          service: Database["public"]["Enums"]["coupon_service"]
        }[]
      }
      rider_accounts: {
        Args: never
        Returns: {
          rider_id: string
        }[]
      }
      rider_awaiting_photo: { Args: { p_rider_id: string }; Returns: boolean }
      rider_waiver_awaiting_signature: {
        Args: { p_rider_id: string }
        Returns: boolean
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
      save_stay_type: {
        Args: { p_seasons: Json; p_type: Json }
        Returns: undefined
      }
      set_external_feed: {
        Args: { p_calendar: string; p_url: string }
        Returns: undefined
      }
      set_purchase_payment: {
        Args: { p_method: string; p_purchase_id: string }
        Returns: boolean
      }
      staff_notify_emails_for: {
        Args: { p_topics: string[] }
        Returns: string[]
      }
      staff_notify_phones: { Args: { p_topic: string }; Returns: string[] }
      staff_notify_phones_for: {
        Args: { p_topics: string[] }
        Returns: string[]
      }
      staff_push_tokens_for: { Args: { p_topic: string }; Returns: string[] }
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
      start_staff_payment: {
        Args: { p_refs: string[] }
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
      stay_room_export_links: {
        Args: never
        Returns: {
          calendar_id: string
          label: string
          stay_type_id: string
          token: string
        }[]
      }
      stay_room_feed: { Args: { p_token: string }; Returns: Json }
      sync_external_blocks: {
        Args: { p_blocks: Json; p_calendar: string }
        Returns: number
      }
      verify_phone_code: {
        Args: { p_code_hash: string; p_phone: string }
        Returns: string
      }
      void_staff_payment: { Args: { p_payment_id: string }; Returns: undefined }
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
      inquiry_status: "nauja" | "susisiekta" | "pasiulymas"
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
      inquiry_status: ["nauja", "susisiekta", "pasiulymas"],
      price_group: ["Erdvės", "Maitinimas", "Paslaugos", "Pramogos", "Nakvynė"],
      upsell_unit: ["rezervacijai", "asmeniui", "vienetui", "valandai"],
    },
  },
} as const
