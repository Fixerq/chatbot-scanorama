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
      ai_analysis_insights: {
        Row: {
          analysis_type: string
          applied_recommendations: boolean | null
          batch_id: string | null
          created_at: string
          id: string
          insights: Json | null
          performance_impact: Json | null
          success_rate: number | null
          updated_at: string | null
          url: string
        }
        Insert: {
          analysis_type: string
          applied_recommendations?: boolean | null
          batch_id?: string | null
          created_at?: string
          id?: string
          insights?: Json | null
          performance_impact?: Json | null
          success_rate?: number | null
          updated_at?: string | null
          url: string
        }
        Update: {
          analysis_type?: string
          applied_recommendations?: boolean | null
          batch_id?: string | null
          created_at?: string
          id?: string
          insights?: Json | null
          performance_impact?: Json | null
          success_rate?: number | null
          updated_at?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_analysis_insights_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "analysis_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      alert_thresholds: {
        Row: {
          alert_type: string
          created_at: string | null
          id: number
          metric_name: string
          threshold_value: number
          updated_at: string | null
        }
        Insert: {
          alert_type: string
          created_at?: string | null
          id?: number
          metric_name: string
          threshold_value: number
          updated_at?: string | null
        }
        Update: {
          alert_type?: string
          created_at?: string | null
          id?: number
          metric_name?: string
          threshold_value?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      allowed_origins: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          origin: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          origin: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          origin?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      analysis_alerts: {
        Row: {
          alert_message: string
          alert_type: string
          batch_id: string | null
          created_at: string | null
          id: string
          pattern_details: Json | null
          shown: boolean | null
          updated_at: string | null
          url: string
          user_id: string | null
        }
        Insert: {
          alert_message: string
          alert_type: string
          batch_id?: string | null
          created_at?: string | null
          id?: string
          pattern_details?: Json | null
          shown?: boolean | null
          updated_at?: string | null
          url: string
          user_id?: string | null
        }
        Update: {
          alert_message?: string
          alert_type?: string
          batch_id?: string | null
          created_at?: string | null
          id?: string
          pattern_details?: Json | null
          shown?: boolean | null
          updated_at?: string | null
          url?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analysis_alerts_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "analysis_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      analysis_batches: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          id: string
          last_processed_at: string | null
          processed_urls: number | null
          request_id: string
          status: Database["public"]["Enums"]["batch_status"] | null
          total_urls: number
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          last_processed_at?: string | null
          processed_urls?: number | null
          request_id: string
          status?: Database["public"]["Enums"]["batch_status"] | null
          total_urls: number
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          last_processed_at?: string | null
          processed_urls?: number | null
          request_id?: string
          status?: Database["public"]["Enums"]["batch_status"] | null
          total_urls?: number
          user_id?: string | null
        }
        Relationships: []
      }
      analysis_cache: {
        Row: {
          analysis_result: Json | null
          cache_valid_until: string
          chatbot_solutions: string[] | null
          details: Json | null
          has_chatbot: boolean
          last_checked: string
          openai_analysis_date: string | null
          openai_analysis_status: string | null
          openai_response: Json | null
          processed_at: string | null
          status: string | null
          url: string
        }
        Insert: {
          analysis_result?: Json | null
          cache_valid_until?: string
          chatbot_solutions?: string[] | null
          details?: Json | null
          has_chatbot?: boolean
          last_checked?: string
          openai_analysis_date?: string | null
          openai_analysis_status?: string | null
          openai_response?: Json | null
          processed_at?: string | null
          status?: string | null
          url: string
        }
        Update: {
          analysis_result?: Json | null
          cache_valid_until?: string
          chatbot_solutions?: string[] | null
          details?: Json | null
          has_chatbot?: boolean
          last_checked?: string
          openai_analysis_date?: string | null
          openai_analysis_status?: string | null
          openai_response?: Json | null
          processed_at?: string | null
          status?: string | null
          url?: string
        }
        Relationships: []
      }
      analysis_job_queue: {
        Row: {
          batch_id: string | null
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          id: string
          max_retries: number | null
          metadata: Json | null
          priority: number | null
          retry_count: number | null
          started_at: string | null
          status: Database["public"]["Enums"]["job_status"] | null
          updated_at: string | null
          url: string
          worker_id: string | null
        }
        Insert: {
          batch_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          max_retries?: number | null
          metadata?: Json | null
          priority?: number | null
          retry_count?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_status"] | null
          updated_at?: string | null
          url: string
          worker_id?: string | null
        }
        Update: {
          batch_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          max_retries?: number | null
          metadata?: Json | null
          priority?: number | null
          retry_count?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_status"] | null
          updated_at?: string | null
          url?: string
          worker_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analysis_job_queue_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "analysis_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analysis_job_queue_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "worker_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      analysis_jobs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error: string | null
          id: string
          metadata: Json | null
          priority: number | null
          result: Json | null
          retry_count: number | null
          started_at: string | null
          status: Database["public"]["Enums"]["job_status"] | null
          updated_at: string | null
          url: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error?: string | null
          id?: string
          metadata?: Json | null
          priority?: number | null
          result?: Json | null
          retry_count?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_status"] | null
          updated_at?: string | null
          url: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error?: string | null
          id?: string
          metadata?: Json | null
          priority?: number | null
          result?: Json | null
          retry_count?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_status"] | null
          updated_at?: string | null
          url?: string
        }
        Relationships: []
      }
      analysis_queue: {
        Row: {
          batch_id: string | null
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          id: string
          max_retries: number | null
          metadata: Json | null
          priority: number | null
          retry_count: number | null
          started_at: string | null
          status: string
          url: string
          user_id: string | null
        }
        Insert: {
          batch_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          max_retries?: number | null
          metadata?: Json | null
          priority?: number | null
          retry_count?: number | null
          started_at?: string | null
          status?: string
          url: string
          user_id?: string | null
        }
        Update: {
          batch_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          max_retries?: number | null
          metadata?: Json | null
          priority?: number | null
          retry_count?: number | null
          started_at?: string | null
          status?: string
          url?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analysis_queue_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "search_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      analysis_requests: {
        Row: {
          analysis_result: Json | null
          analysis_step: string | null
          batch_id: string | null
          completed_at: string | null
          created_at: string | null
          error_details: Json | null
          error_message: string | null
          html_content_length: number | null
          html_fetch_status: string | null
          id: string
          processed: boolean | null
          retry_count: number | null
          search_batch_id: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["analysis_status"] | null
          updated_at: string | null
          url: string
          user_id: string | null
        }
        Insert: {
          analysis_result?: Json | null
          analysis_step?: string | null
          batch_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          error_details?: Json | null
          error_message?: string | null
          html_content_length?: number | null
          html_fetch_status?: string | null
          id?: string
          processed?: boolean | null
          retry_count?: number | null
          search_batch_id?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["analysis_status"] | null
          updated_at?: string | null
          url: string
          user_id?: string | null
        }
        Update: {
          analysis_result?: Json | null
          analysis_step?: string | null
          batch_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          error_details?: Json | null
          error_message?: string | null
          html_content_length?: number | null
          html_fetch_status?: string | null
          id?: string
          processed?: boolean | null
          retry_count?: number | null
          search_batch_id?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["analysis_status"] | null
          updated_at?: string | null
          url?: string
          user_id?: string | null
        }
        Relationships: []
      }
      analysis_results: {
        Row: {
          batch_id: string | null
          chatbot_solutions: string[] | null
          created_at: string | null
          details: Json | null
          error: string | null
          has_chatbot: boolean
          id: string
          last_checked: string | null
          match_patterns: Json[] | null
          match_types: Json | null
          pattern_details: Json | null
          processing_end_time: string | null
          processing_start_time: string | null
          request_id: string | null
          status: Database["public"]["Enums"]["analysis_status"] | null
          updated_at: string | null
          url: string | null
          user_id: string | null
        }
        Insert: {
          batch_id?: string | null
          chatbot_solutions?: string[] | null
          created_at?: string | null
          details?: Json | null
          error?: string | null
          has_chatbot?: boolean
          id?: string
          last_checked?: string | null
          match_patterns?: Json[] | null
          match_types?: Json | null
          pattern_details?: Json | null
          processing_end_time?: string | null
          processing_start_time?: string | null
          request_id?: string | null
          status?: Database["public"]["Enums"]["analysis_status"] | null
          updated_at?: string | null
          url?: string | null
          user_id?: string | null
        }
        Update: {
          batch_id?: string | null
          chatbot_solutions?: string[] | null
          created_at?: string | null
          details?: Json | null
          error?: string | null
          has_chatbot?: boolean
          id?: string
          last_checked?: string | null
          match_patterns?: Json[] | null
          match_types?: Json | null
          pattern_details?: Json | null
          processing_end_time?: string | null
          processing_start_time?: string | null
          request_id?: string | null
          status?: Database["public"]["Enums"]["analysis_status"] | null
          updated_at?: string | null
          url?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analysis_results_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "analysis_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analysis_results_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "analysis_results_with_requests"
            referencedColumns: ["request_id"]
          },
        ]
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
      blocked_requests: {
        Row: {
          block_reason: string
          created_at: string
          error_details: string | null
          headers: Json | null
          id: string
          proxy_used: string | null
          resolved: boolean
          retry_count: number
          updated_at: string
          user_agent: string | null
          website_url: string
        }
        Insert: {
          block_reason: string
          created_at?: string
          error_details?: string | null
          headers?: Json | null
          id?: string
          proxy_used?: string | null
          resolved?: boolean
          retry_count?: number
          updated_at?: string
          user_agent?: string | null
          website_url: string
        }
        Update: {
          block_reason?: string
          created_at?: string
          error_details?: string | null
          headers?: Json | null
          id?: string
          proxy_used?: string | null
          resolved?: boolean
          retry_count?: number
          updated_at?: string
          user_agent?: string | null
          website_url?: string
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
          id: number
          last_accessed: string | null
          place_data: Json
          place_id: string
          search_batch_id: string
          user_id: string | null
        }
        Insert: {
          business_name: string
          created_at?: string | null
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
          id?: number
          last_accessed?: string | null
          place_data?: Json
          place_id?: string
          search_batch_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      chatbot_detection_patterns: {
        Row: {
          category: string
          confidence_score: number
          created_at: string
          enabled: boolean
          examples: Json | null
          false_positive_count: number | null
          id: string
          last_match_date: string | null
          match_count: number | null
          pattern_type: string
          pattern_value: string
          subcategory: string | null
          updated_at: string
          validation_rules: Json | null
        }
        Insert: {
          category?: string
          confidence_score?: number
          created_at?: string
          enabled?: boolean
          examples?: Json | null
          false_positive_count?: number | null
          id?: string
          last_match_date?: string | null
          match_count?: number | null
          pattern_type: string
          pattern_value: string
          subcategory?: string | null
          updated_at?: string
          validation_rules?: Json | null
        }
        Update: {
          category?: string
          confidence_score?: number
          created_at?: string
          enabled?: boolean
          examples?: Json | null
          false_positive_count?: number | null
          id?: string
          last_match_date?: string | null
          match_count?: number | null
          pattern_type?: string
          pattern_value?: string
          subcategory?: string | null
          updated_at?: string
          validation_rules?: Json | null
        }
        Relationships: []
      }
      crawl_results: {
        Row: {
          analyzed: boolean | null
          completed_at: string | null
          created_at: string | null
          error: string | null
          id: string
          result: Json | null
          started_at: string | null
          status: Database["public"]["Enums"]["crawl_status"] | null
          updated_at: string | null
          url: string
          user_id: string | null
        }
        Insert: {
          analyzed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          error?: string | null
          id?: string
          result?: Json | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["crawl_status"] | null
          updated_at?: string | null
          url: string
          user_id?: string | null
        }
        Update: {
          analyzed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          error?: string | null
          id?: string
          result?: Json | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["crawl_status"] | null
          updated_at?: string | null
          url?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crawl_results_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      firecrawl_analysis: {
        Row: {
          analyzed_at: string | null
          content: string | null
          created_at: string | null
          detected_platforms: string[] | null
          error_message: string | null
          has_chatbot: boolean | null
          id: string
          metadata: Json | null
          url: string
        }
        Insert: {
          analyzed_at?: string | null
          content?: string | null
          created_at?: string | null
          detected_platforms?: string[] | null
          error_message?: string | null
          has_chatbot?: boolean | null
          id?: string
          metadata?: Json | null
          url: string
        }
        Update: {
          analyzed_at?: string | null
          content?: string | null
          created_at?: string | null
          detected_platforms?: string[] | null
          error_message?: string | null
          has_chatbot?: boolean | null
          id?: string
          metadata?: Json | null
          url?: string
        }
        Relationships: []
      }
      function_executions: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          execution_time: string | null
          function_name: string
          id: string
          request_body: Json | null
          response_body: Json | null
          started_at: string
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          execution_time?: string | null
          function_name: string
          id?: string
          request_body?: Json | null
          response_body?: Json | null
          started_at?: string
          status: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          execution_time?: string | null
          function_name?: string
          id?: string
          request_body?: Json | null
          response_body?: Json | null
          started_at?: string
          status?: string
        }
        Relationships: []
      }
      live_element_patterns: {
        Row: {
          created_at: string | null
          description: string | null
          id: number
          is_active: boolean | null
          pattern: string
          priority: number | null
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: number
          is_active?: boolean | null
          pattern: string
          priority?: number | null
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: number
          is_active?: boolean | null
          pattern?: string
          priority?: number | null
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      monitoring_alerts: {
        Row: {
          alert_type: string
          created_at: string | null
          current_value: number
          id: number
          metric_name: string
          threshold_value: number
        }
        Insert: {
          alert_type: string
          created_at?: string | null
          current_value: number
          id?: number
          metric_name: string
          threshold_value: number
        }
        Update: {
          alert_type?: string
          created_at?: string | null
          current_value?: number
          id?: number
          metric_name?: string
          threshold_value?: number
        }
        Relationships: []
      }
      monitoring_errors: {
        Row: {
          affected_urls: string[] | null
          created_at: string | null
          error_count: number
          id: number
          time_bucket: string
          unique_errors: string
        }
        Insert: {
          affected_urls?: string[] | null
          created_at?: string | null
          error_count?: number
          id?: number
          time_bucket: string
          unique_errors: string
        }
        Update: {
          affected_urls?: string[] | null
          created_at?: string | null
          error_count?: number
          id?: number
          time_bucket?: string
          unique_errors?: string
        }
        Relationships: []
      }
      monitoring_providers: {
        Row: {
          created_at: string | null
          detection_count: number
          detection_rate: number
          id: number
          provider_name: string
          unique_sites: number
        }
        Insert: {
          created_at?: string | null
          detection_count?: number
          detection_rate?: number
          id?: number
          provider_name: string
          unique_sites?: number
        }
        Update: {
          created_at?: string | null
          detection_count?: number
          detection_rate?: number
          id?: number
          provider_name?: string
          unique_sites?: number
        }
        Relationships: []
      }
      pattern_matches: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          id: string
          matched_content: string | null
          pattern_type: string
          pattern_value: string
          queue_id: string | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          matched_content?: string | null
          pattern_type: string
          pattern_value: string
          queue_id?: string | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          matched_content?: string | null
          pattern_type?: string
          pattern_value?: string
          queue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pattern_matches_queue_id_fkey"
            columns: ["queue_id"]
            isOneToOne: false
            referencedRelation: "analysis_queue"
            referencedColumns: ["id"]
          },
        ]
      }
      pattern_metrics: {
        Row: {
          created_at: string | null
          id: string
          last_matched: string | null
          match_rate: number | null
          pattern: string
          total_attempts: number | null
          total_matches: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_matched?: string | null
          match_rate?: number | null
          pattern: string
          total_attempts?: number | null
          total_matches?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          last_matched?: string | null
          match_rate?: number | null
          pattern?: string
          total_attempts?: number | null
          total_matches?: number | null
          updated_at?: string | null
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
        Relationships: []
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
      proxy_pool: {
        Row: {
          created_at: string | null
          failure_count: number | null
          id: string
          is_active: boolean | null
          proxy_url: string
          success_count: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          failure_count?: number | null
          id?: string
          is_active?: boolean | null
          proxy_url: string
          success_count?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          failure_count?: number | null
          id?: string
          is_active?: boolean | null
          proxy_url?: string
          success_count?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          id: number
          ip: string
          last_request: string
          requests_count: number
          updated_at: string
          window_start: string
        }
        Insert: {
          id?: number
          ip: string
          last_request?: string
          requests_count?: number
          updated_at?: string
          window_start?: string
        }
        Update: {
          id?: number
          ip?: string
          last_request?: string
          requests_count?: number
          updated_at?: string
          window_start?: string
        }
        Relationships: []
      }
      request_limits: {
        Row: {
          ip: string
          last_request: string
          requests_count: number
          window_start: string
        }
        Insert: {
          ip: string
          last_request?: string
          requests_count?: number
          window_start?: string
        }
        Update: {
          ip?: string
          last_request?: string
          requests_count?: number
          window_start?: string
        }
        Relationships: []
      }
      runtime_config: {
        Row: {
          created_at: string | null
          description: string | null
          id: number
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: number
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: number
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      search_batches: {
        Row: {
          country: string | null
          created_at: string | null
          id: string
          query: string
          region: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          country?: string | null
          created_at?: string | null
          id?: string
          query: string
          region?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          country?: string | null
          created_at?: string | null
          id?: string
          query?: string
          region?: string | null
          updated_at?: string | null
          user_id?: string
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
          user_id?: string
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
      url_analysis_cache: {
        Row: {
          chatbot_solutions: string[] | null
          created_at: string | null
          details: Json | null
          has_chatbot: boolean | null
          last_checked: string | null
          updated_at: string | null
          url: string
        }
        Insert: {
          chatbot_solutions?: string[] | null
          created_at?: string | null
          details?: Json | null
          has_chatbot?: boolean | null
          last_checked?: string | null
          updated_at?: string | null
          url: string
        }
        Update: {
          chatbot_solutions?: string[] | null
          created_at?: string | null
          details?: Json | null
          has_chatbot?: boolean | null
          last_checked?: string | null
          updated_at?: string | null
          url?: string
        }
        Relationships: []
      }
      worker_config: {
        Row: {
          batch_size: number | null
          created_at: string
          id: string
          optimization_source: string | null
          timeout_settings: Json | null
          updated_at: string
          worker_id: string
        }
        Insert: {
          batch_size?: number | null
          created_at?: string
          id?: string
          optimization_source?: string | null
          timeout_settings?: Json | null
          updated_at?: string
          worker_id: string
        }
        Update: {
          batch_size?: number | null
          created_at?: string
          id?: string
          optimization_source?: string | null
          timeout_settings?: Json | null
          updated_at?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "worker_config_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "worker_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      worker_instances: {
        Row: {
          created_at: string | null
          current_job_id: string | null
          id: string
          last_heartbeat: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_job_id?: string | null
          id?: string
          last_heartbeat?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_job_id?: string | null
          id?: string
          last_heartbeat?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      admin_users_mv: {
        Row: {
          user_id: string | null
        }
        Relationships: []
      }
      analysis_results_with_requests: {
        Row: {
          batch_id: string | null
          chatbot_solutions: string[] | null
          created_at: string | null
          error: string | null
          has_chatbot: boolean | null
          request_id: string | null
          request_status: Database["public"]["Enums"]["analysis_status"] | null
          result_id: string | null
          status: Database["public"]["Enums"]["analysis_status"] | null
          updated_at: string | null
          url: string | null
        }
        Relationships: []
      }
      pattern_performance_metrics: {
        Row: {
          accuracy_score: number | null
          category: string | null
          confidence_score: number | null
          enabled: boolean | null
          false_positive_count: number | null
          id: string | null
          last_match_date: string | null
          match_count: number | null
          pattern_type: string | null
          pattern_value: string | null
          subcategory: string | null
        }
        Insert: {
          accuracy_score?: never
          category?: string | null
          confidence_score?: number | null
          enabled?: boolean | null
          false_positive_count?: number | null
          id?: string | null
          last_match_date?: string | null
          match_count?: number | null
          pattern_type?: string | null
          pattern_value?: string | null
          subcategory?: string | null
        }
        Update: {
          accuracy_score?: never
          category?: string | null
          confidence_score?: number | null
          enabled?: boolean | null
          false_positive_count?: number | null
          id?: string | null
          last_match_date?: string | null
          match_count?: number | null
          pattern_type?: string | null
          pattern_value?: string | null
          subcategory?: string | null
        }
        Relationships: []
      }
      rate_limit_status: {
        Row: {
          client_ip: string | null
          remaining_requests: number | null
          request_count: number | null
          reset_time: string | null
          status: string | null
          window_start: string | null
        }
        Insert: {
          client_ip?: string | null
          remaining_requests?: never
          request_count?: number | null
          reset_time?: never
          status?: never
          window_start?: string | null
        }
        Update: {
          client_ip?: string | null
          remaining_requests?: never
          request_count?: number | null
          reset_time?: never
          status?: never
          window_start?: string | null
        }
        Relationships: []
      }
      subscriptions_with_user: {
        Row: {
          created_at: string | null
          current_period_end: string | null
          id: string | null
          level: Database["public"]["Enums"]["subscription_level"] | null
          status: string | null
          stripe_customer_id: string | null
          total_searches: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          current_period_end?: string | null
          id?: string | null
          level?: Database["public"]["Enums"]["subscription_level"] | null
          status?: string | null
          stripe_customer_id?: string | null
          total_searches?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          current_period_end?: string | null
          id?: string | null
          level?: Database["public"]["Enums"]["subscription_level"] | null
          status?: string | null
          stripe_customer_id?: string | null
          total_searches?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_admin_direct: {
        Args: {
          user_id: string
        }
        Returns: boolean
      }
      check_admin_mv: {
        Args: {
          uid: string
        }
        Returns: boolean
      }
      check_alert_thresholds: {
        Args: Record<PropertyKey, never>
        Returns: {
          metric_name: string
          current_value: number
          threshold_value: number
          alert_type: string
        }[]
      }
      check_rate_limit: {
        Args: {
          p_client_id: string
          p_window_minutes?: number
          p_max_requests?: number
        }
        Returns: Json
      }
      check_subscription_status: {
        Args: {
          p_user_id: string
        }
        Returns: Json
      }
      check_worker_health: {
        Args: Record<PropertyKey, never>
        Returns: {
          total_workers: number
          active_workers: number
          stalled_workers: number
          jobs_in_progress: number
        }[]
      }
      citext:
        | {
            Args: {
              "": boolean
            }
            Returns: string
          }
        | {
            Args: {
              "": string
            }
            Returns: string
          }
        | {
            Args: {
              "": unknown
            }
            Returns: string
          }
      citext_hash: {
        Args: {
          "": string
        }
        Returns: number
      }
      citextin: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      citextout: {
        Args: {
          "": string
        }
        Returns: unknown
      }
      citextrecv: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      citextsend: {
        Args: {
          "": string
        }
        Returns: string
      }
      cleanup_expired_sessions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_old_analyses: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_old_cached_places: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_old_crawl_results: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_old_executions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_old_rate_limits: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_stale_analyses: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_stale_workers: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_stalled_workers: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_stuck_analyses: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_url_analysis_cache: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      clear_search_cache: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      delete_user_data: {
        Args: {
          user_id_param: string
        }
        Returns: undefined
      }
      get_available_worker: {
        Args: Record<PropertyKey, never>
        Returns: {
          worker_id: string
          last_heartbeat: string
        }[]
      }
      get_next_available_proxy: {
        Args: Record<PropertyKey, never>
        Returns: {
          proxy_id: string
          proxy_url: string
        }[]
      }
      get_next_job: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          url: string
          retry_count: number
        }[]
      }
      get_or_create_analysis: {
        Args: {
          url_param: string
        }
        Returns: {
          url: string
          has_chatbot: boolean
          chatbot_solutions: string[]
          status: Database["public"]["Enums"]["analysis_status"]
          last_checked: string
        }[]
      }
      get_performance_metrics:
        | {
            Args: Record<PropertyKey, never>
            Returns: {
              metric_name: string
              metric_value: number
            }[]
          }
        | {
            Args: {
              time_window?: unknown
            }
            Returns: {
              metric_name: string
              metric_value: number
            }[]
          }
      get_test_user_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_status: {
        Args: {
          user_uid: string
        }
        Returns: Json
      }
      increment_retry_count: {
        Args: {
          request_id: string
        }
        Returns: undefined
      }
      is_admin: {
        Args: {
          user_id: string
        }
        Returns: boolean
      }
      is_admin_direct_v2: {
        Args: {
          user_id: string
        }
        Returns: boolean
      }
      refresh_admin_users_mv: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      refresh_monitoring_views: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_pattern_metrics: {
        Args: {
          p_pattern: string
          p_matched: boolean
        }
        Returns: undefined
      }
      update_proxy_status: {
        Args: {
          p_proxy_id: string
          p_success: boolean
        }
        Returns: undefined
      }
    }
    Enums: {
      alert_severity: "error" | "warning" | "info"
      analysis_status: "pending" | "processing" | "completed" | "failed"
      batch_status: "pending" | "processing" | "completed" | "failed"
      block_reason_type:
        | "forbidden_403"
        | "rate_limit_429"
        | "timeout"
        | "connection_refused"
        | "dns_error"
        | "other"
      crawl_status: "pending" | "processing" | "completed" | "failed"
      detection_method: "selector" | "script" | "iframe" | "text" | "mutation"
      job_status: "pending" | "processing" | "completed" | "failed"
      request_status: "pending" | "processing" | "completed" | "failed"
      subscription_level: "starter" | "pro" | "premium" | "founders" | "admin"
      website_analysis_status: "success" | "error"
      worker_status: "idle" | "processing" | "completed" | "failed"
    }
    CompositeTypes: {
      search_response_type: {
        data: Json | null
      }
      search_result_type: {
        title: string | null
        description: string | null
        url: string | null
      }
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
