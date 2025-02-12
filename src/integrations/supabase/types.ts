export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
        }
        Relationships: []
      }
      analyzed_urls: {
        Row: {
          business_type: string | null
          chat_solutions: string[] | null
          created_at: string
          description: string | null
          details: Json | null
          formatted_address: string | null
          google_business_name: string | null
          icon: string | null
          icon_background_color: string | null
          icon_mask_base_uri: string | null
          id: number
          last_checked: string | null
          location_lat: number | null
          location_lng: number | null
          opening_hours: Json | null
          phone_number: string | null
          photos: Json[] | null
          place_data: Json | null
          place_id: string | null
          place_types: string[] | null
          place_url: string | null
          rating: number | null
          result_position: number | null
          search_batch_id: string | null
          search_query: string | null
          search_region: string | null
          status: string
          technologies: string[] | null
          title: string | null
          url: string
          user_id: string | null
          user_ratings_total: number | null
          vicinity: string | null
        }
        Insert: {
          business_type?: string | null
          chat_solutions?: string[] | null
          created_at?: string
          description?: string | null
          details?: Json | null
          formatted_address?: string | null
          google_business_name?: string | null
          icon?: string | null
          icon_background_color?: string | null
          icon_mask_base_uri?: string | null
          id?: number
          last_checked?: string | null
          location_lat?: number | null
          location_lng?: number | null
          opening_hours?: Json | null
          phone_number?: string | null
          photos?: Json[] | null
          place_data?: Json | null
          place_id?: string | null
          place_types?: string[] | null
          place_url?: string | null
          rating?: number | null
          result_position?: number | null
          search_batch_id?: string | null
          search_query?: string | null
          search_region?: string | null
          status: string
          technologies?: string[] | null
          title?: string | null
          url: string
          user_id?: string | null
          user_ratings_total?: number | null
          vicinity?: string | null
        }
        Update: {
          business_type?: string | null
          chat_solutions?: string[] | null
          created_at?: string
          description?: string | null
          details?: Json | null
          formatted_address?: string | null
          google_business_name?: string | null
          icon?: string | null
          icon_background_color?: string | null
          icon_mask_base_uri?: string | null
          id?: number
          last_checked?: string | null
          location_lat?: number | null
          location_lng?: number | null
          opening_hours?: Json | null
          phone_number?: string | null
          photos?: Json[] | null
          place_data?: Json | null
          place_id?: string | null
          place_types?: string[] | null
          place_url?: string | null
          rating?: number | null
          result_position?: number | null
          search_batch_id?: string | null
          search_query?: string | null
          search_region?: string | null
          status?: string
          technologies?: string[] | null
          title?: string | null
          url?: string
          user_id?: string | null
          user_ratings_total?: number | null
          vicinity?: string | null
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          service_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          service_name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          service_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      api_logs: {
        Row: {
          created_at: string
          endpoint: string
          error: string | null
          id: number
          status: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          endpoint: string
          error?: string | null
          id?: number
          status?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          endpoint?: string
          error?: string | null
          id?: number
          status?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      api_requests: {
        Row: {
          endpoint: string
          error_message: string | null
          id: string
          metadata: Json | null
          method: string
          request_timestamp: string
          response_time_ms: number | null
          status_code: number | null
          user_id: string
        }
        Insert: {
          endpoint: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          method: string
          request_timestamp?: string
          response_time_ms?: number | null
          status_code?: number | null
          user_id: string
        }
        Update: {
          endpoint?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          method?: string
          request_timestamp?: string
          response_time_ms?: number | null
          status_code?: number | null
          user_id?: string
        }
        Relationships: []
      }
      bookmarks: {
        Row: {
          created_at: string
          description: string | null
          id: number
          name: string
          snapshot: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: number
          name: string
          snapshot?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: number
          name?: string
          snapshot?: Json
          user_id?: string
        }
        Relationships: []
      }
      cached_places: {
        Row: {
          business_name: string
          created_at: string | null
          google_business_name: string
          id: number
          last_accessed: string | null
          place_data: Json
          place_id: string
          search_batch_id: string
          user_id: string | null
        }
        Insert: {
          business_name?: string
          created_at?: string | null
          google_business_name?: string
          id?: number
          last_accessed?: string | null
          place_data: Json
          place_id: string
          search_batch_id: string
          user_id?: string | null
        }
        Update: {
          business_name?: string
          created_at?: string | null
          google_business_name?: string
          id?: number
          last_accessed?: string | null
          place_data?: Json
          place_id?: string
          search_batch_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      chatbot_detections: {
        Row: {
          address: string | null
          business_name: string | null
          chatbot_platforms: string[] | null
          created_at: string
          has_chatbot: boolean | null
          id: string
          last_checked: string
          phone: string | null
          url: string
          website_url: string | null
        }
        Insert: {
          address?: string | null
          business_name?: string | null
          chatbot_platforms?: string[] | null
          created_at?: string
          has_chatbot?: boolean | null
          id?: string
          last_checked?: string
          phone?: string | null
          url: string
          website_url?: string | null
        }
        Update: {
          address?: string | null
          business_name?: string | null
          chatbot_platforms?: string[] | null
          created_at?: string
          has_chatbot?: boolean | null
          id?: string
          last_checked?: string
          phone?: string | null
          url?: string
          website_url?: string | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          plan_name: string | null
          price_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          plan_name?: string | null
          price_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          plan_name?: string | null
          price_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      edge_function_logs: {
        Row: {
          client_info: Json | null
          context: Json | null
          created_at: string | null
          error: string | null
          function_name: string
          http_status: number | null
          id: number
          request_data: Json | null
          response_data: Json | null
          severity: string
          timestamp: string | null
        }
        Insert: {
          client_info?: Json | null
          context?: Json | null
          created_at?: string | null
          error?: string | null
          function_name: string
          http_status?: number | null
          id?: number
          request_data?: Json | null
          response_data?: Json | null
          severity?: string
          timestamp?: string | null
        }
        Update: {
          client_info?: Json | null
          context?: Json | null
          created_at?: string | null
          error?: string | null
          function_name?: string
          http_status?: number | null
          id?: number
          request_data?: Json | null
          response_data?: Json | null
          severity?: string
          timestamp?: string | null
        }
        Relationships: []
      }
      place_details: {
        Row: {
          address: string | null
          analyzed: boolean | null
          business_name: string | null
          chatbot_detection_id: string | null
          created_at: string | null
          id: string
          phone: string | null
          place_id: string | null
          updated_at: string | null
          url: string
          website_url: string | null
        }
        Insert: {
          address?: string | null
          analyzed?: boolean | null
          business_name?: string | null
          chatbot_detection_id?: string | null
          created_at?: string | null
          id?: string
          phone?: string | null
          place_id?: string | null
          updated_at?: string | null
          url: string
          website_url?: string | null
        }
        Update: {
          address?: string | null
          analyzed?: boolean | null
          business_name?: string | null
          chatbot_detection_id?: string | null
          created_at?: string | null
          id?: string
          phone?: string | null
          place_id?: string | null
          updated_at?: string | null
          url?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "place_details_chatbot_detection_id_fkey"
            columns: ["chatbot_detection_id"]
            isOneToOne: false
            referencedRelation: "chatbot_detections"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          api_key: string | null
          created_at: string
          first_name: string | null
          id: string
          last_name: string | null
        }
        Insert: {
          api_key?: string | null
          created_at?: string
          first_name?: string | null
          id: string
          last_name?: string | null
        }
        Update: {
          api_key?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
        }
        Relationships: []
      }
      search_history: {
        Row: {
          country: string
          created_at: string | null
          id: string
          query: string
          region: string
          search_batch_id: string
          user_id: string
        }
        Insert: {
          country: string
          created_at?: string | null
          id?: string
          query: string
          region: string
          search_batch_id: string
          user_id: string
        }
        Update: {
          country?: string
          created_at?: string | null
          id?: string
          query?: string
          region?: string
          search_batch_id?: string
          user_id?: string
        }
        Relationships: []
      }
      search_results: {
        Row: {
          address: string | null
          business_name: string
          business_type: string | null
          description: string | null
          id: string
          last_checked: string | null
          phone_number: string | null
          search_id: string
          website_url: string | null
        }
        Insert: {
          address?: string | null
          business_name: string
          business_type?: string | null
          description?: string | null
          id?: string
          last_checked?: string | null
          phone_number?: string | null
          search_id: string
          website_url?: string | null
        }
        Update: {
          address?: string | null
          business_name?: string
          business_type?: string | null
          description?: string | null
          id?: string
          last_checked?: string | null
          phone_number?: string | null
          search_id?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_search"
            columns: ["search_id"]
            isOneToOne: false
            referencedRelation: "search_history"
            referencedColumns: ["id"]
          },
        ]
      }
      secrets: {
        Row: {
          created_at: string
          id: number
          name: string
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          id?: number
          name: string
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          id?: number
          name?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      sessions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          last_activity: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          last_activity?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          last_activity?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      subscription_levels: {
        Row: {
          created_at: string
          features: Json
          id: string
          level: Database["public"]["Enums"]["subscription_level"]
          max_searches: number
        }
        Insert: {
          created_at?: string
          features?: Json
          id?: string
          level: Database["public"]["Enums"]["subscription_level"]
          max_searches: number
        }
        Update: {
          created_at?: string
          features?: Json
          id?: string
          level?: Database["public"]["Enums"]["subscription_level"]
          max_searches?: number
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          id: string
          level: Database["public"]["Enums"]["subscription_level"] | null
          plan_id: string | null
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          total_searches: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          level?: Database["public"]["Enums"]["subscription_level"] | null
          plan_id?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          total_searches?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          level?: Database["public"]["Enums"]["subscription_level"] | null
          plan_id?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          total_searches?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      Table1: {
        Row: {
          created_at: string
          id: number
        }
        Insert: {
          created_at?: string
          id?: number
        }
        Update: {
          created_at?: string
          id?: number
        }
        Relationships: []
      }
      website_analyses: {
        Row: {
          business_signals_found: string[] | null
          chatbot_platforms: string[] | null
          created_at: string | null
          error_message: string | null
          has_business_signals: boolean | null
          has_chatbot: boolean | null
          has_contact: boolean | null
          has_location: boolean | null
          id: string
          last_checked: string | null
          normalized_url: string
          status: Database["public"]["Enums"]["website_analysis_status"] | null
          updated_at: string | null
          url: string
        }
        Insert: {
          business_signals_found?: string[] | null
          chatbot_platforms?: string[] | null
          created_at?: string | null
          error_message?: string | null
          has_business_signals?: boolean | null
          has_chatbot?: boolean | null
          has_contact?: boolean | null
          has_location?: boolean | null
          id?: string
          last_checked?: string | null
          normalized_url: string
          status?: Database["public"]["Enums"]["website_analysis_status"] | null
          updated_at?: string | null
          url: string
        }
        Update: {
          business_signals_found?: string[] | null
          chatbot_platforms?: string[] | null
          created_at?: string | null
          error_message?: string | null
          has_business_signals?: boolean | null
          has_chatbot?: boolean | null
          has_contact?: boolean | null
          has_location?: boolean | null
          id?: string
          last_checked?: string | null
          normalized_url?: string
          status?: Database["public"]["Enums"]["website_analysis_status"] | null
          updated_at?: string | null
          url?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_sessions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_old_cached_places: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      delete_user_data: {
        Args: {
          user_id_param: string
        }
        Returns: undefined
      }
    }
    Enums: {
      subscription_level: "starter" | "pro" | "premium" | "founders" | "admin"
      website_analysis_status: "success" | "error"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
