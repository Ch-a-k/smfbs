export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      rooms: {
        Row: {
          id: number
          name: string
          capacity: number
          max_people: number
          is_active: boolean
          available: boolean
          work_schedule: Json | null
        }
        Insert: {
          id?: number
          name: string
          capacity: number
          max_people: number
          is_active?: boolean
          available?: boolean
          work_schedule?: Json | null
        }
        Update: {
          id?: number
          name?: string
          capacity?: number
          max_people?: number
          is_active?: boolean
          available?: boolean
          work_schedule?: Json | null
        }
      }
      packages: {
        Row: {
          id: number | string
          name: string
          description: string | null
          price: number
          deposit_amount: number | null
          duration: number
          max_people: number
          preferred_rooms: Json | null
          is_active: boolean
        }
        Insert: {
          id?: number | string
          name: string
          description?: string | null
          price: number
          deposit_amount?: number | null
          duration: number
          max_people: number
          preferred_rooms?: Json | null
          is_active?: boolean
        }
        Update: {
          id?: number | string
          name?: string
          description?: string | null
          price?: number
          deposit_amount?: number | null
          duration?: number
          max_people?: number
          preferred_rooms?: Json | null
          is_active?: boolean
        }
      }
      bookings: {
        Row: {
          id: number
          room_id: number
          package_id: number | string
          customer_name: string
          customer_email: string
          customer_phone: string
          booking_date: string
          start_time: string
          end_time: string
          num_people: number
          status: string
          total_price: number
          created_at: string
          notes: string | null
          promo_code: string | null
          payment_status: string | null
          paid_amount: number | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          room_id: number
          package_id: number | string
          customer_name: string
          customer_email: string
          customer_phone: string
          booking_date: string
          start_time: string
          end_time: string
          num_people: number
          status?: string
          total_price: number
          created_at?: string
          notes?: string | null
          promo_code?: string | null
          payment_status?: string | null
          paid_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          room_id?: number
          package_id?: number | string
          customer_name?: string
          customer_email?: string
          customer_phone?: string
          booking_date?: string
          start_time?: string
          end_time?: string
          num_people?: number
          status?: string
          total_price?: number
          created_at?: string
          notes?: string | null
          promo_code?: string | null
          payment_status?: string | null
          paid_amount?: number | null
          updated_at?: string | null
        }
      }
      promo_codes: {
        Row: {
          code: string
          discount_percent: number
          valid_until: string | null
          is_active: boolean
        }
        Insert: {
          code: string
          discount_percent: number
          valid_until?: string | null
          is_active?: boolean
        }
        Update: {
          code?: string
          discount_percent?: number
          valid_until?: string | null
          is_active?: boolean
        }
      }
    }
    Functions: {
      check_room_availability: {
        Args: {
          room_id: number
          check_date: string
          start_time: string
          end_time: string
        }
        Returns: boolean
      }
    }
  }
} 