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
      client_alerts: {
        Row: {
          client_id: string | null
          consultant_id: string | null
          created_at: string | null
          evidence: string | null
          id: string
          next_action: string | null
          reason: string
          severity: string
          status: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          client_id?: string | null
          consultant_id?: string | null
          created_at?: string | null
          evidence?: string | null
          id?: string
          next_action?: string | null
          reason: string
          severity: string
          status?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          client_id?: string | null
          consultant_id?: string | null
          created_at?: string | null
          evidence?: string | null
          id?: string
          next_action?: string | null
          reason?: string
          severity?: string
          status?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_alerts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_alerts_consultant_id_fkey"
            columns: ["consultant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      client_contacts: {
        Row: {
          area: string | null
          client_id: string
          created_at: string | null
          email: string | null
          id: string
          is_decision_maker: boolean | null
          is_financial: boolean | null
          is_primary: boolean | null
          name: string
          notes: string | null
          phone: string | null
          portal_access: boolean | null
          role: string | null
          status: string | null
          updated_at: string | null
          whatsapp: string | null
        }
        Insert: {
          area?: string | null
          client_id: string
          created_at?: string | null
          email?: string | null
          id?: string
          is_decision_maker?: boolean | null
          is_financial?: boolean | null
          is_primary?: boolean | null
          name: string
          notes?: string | null
          phone?: string | null
          portal_access?: boolean | null
          role?: string | null
          status?: string | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Update: {
          area?: string | null
          client_id?: string
          created_at?: string | null
          email?: string | null
          id?: string
          is_decision_maker?: boolean | null
          is_financial?: boolean | null
          is_primary?: boolean | null
          name?: string
          notes?: string | null
          phone?: string | null
          portal_access?: boolean | null
          role?: string | null
          status?: string | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_contacts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_indicators: {
        Row: {
          category: string | null
          client_id: string | null
          created_at: string | null
          date: string
          id: string
          is_baseline: boolean | null
          name: string
          unit: string | null
          value: number
        }
        Insert: {
          category?: string | null
          client_id?: string | null
          created_at?: string | null
          date: string
          id?: string
          is_baseline?: boolean | null
          name: string
          unit?: string | null
          value: number
        }
        Update: {
          category?: string | null
          client_id?: string | null
          created_at?: string | null
          date?: string
          id?: string
          is_baseline?: boolean | null
          name?: string
          unit?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "client_indicators_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_products: {
        Row: {
          client_id: string
          client_notes: string | null
          client_visible: boolean | null
          consultant_id: string | null
          contract_id: string | null
          created_at: string | null
          created_by: string | null
          current_phase_id: string | null
          current_week_id: string | null
          current_week_number: number | null
          duration_weeks: number | null
          end_date: string | null
          id: string
          internal_notes: string | null
          legacy_project_id: string | null
          methodology_plan_id: string | null
          product_id: string
          start_date: string | null
          status: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          client_id: string
          client_notes?: string | null
          client_visible?: boolean | null
          consultant_id?: string | null
          contract_id?: string | null
          created_at?: string | null
          created_by?: string | null
          current_phase_id?: string | null
          current_week_id?: string | null
          current_week_number?: number | null
          duration_weeks?: number | null
          end_date?: string | null
          id?: string
          internal_notes?: string | null
          legacy_project_id?: string | null
          methodology_plan_id?: string | null
          product_id: string
          start_date?: string | null
          status?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          client_id?: string
          client_notes?: string | null
          client_visible?: boolean | null
          consultant_id?: string | null
          contract_id?: string | null
          created_at?: string | null
          created_by?: string | null
          current_phase_id?: string | null
          current_week_id?: string | null
          current_week_number?: number | null
          duration_weeks?: number | null
          end_date?: string | null
          id?: string
          internal_notes?: string | null
          legacy_project_id?: string | null
          methodology_plan_id?: string | null
          product_id?: string
          start_date?: string | null
          status?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_products_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_products_consultant_id_fkey"
            columns: ["consultant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_products_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_products_current_phase_id_fkey"
            columns: ["current_phase_id"]
            isOneToOne: false
            referencedRelation: "methodology_plan_phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_products_methodology_plan_id_fkey"
            columns: ["methodology_plan_id"]
            isOneToOne: false
            referencedRelation: "methodology_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          auth_user_id: string | null
          avatar_path: string | null
          avatar_url: string | null
          briefing: string | null
          cep: string | null
          clinic_specialty: string | null
          cnpj: string
          company_size: string | null
          complement: string | null
          consultant_id: string | null
          contact_name: string | null
          contact_phone: string | null
          corporate_name: string
          created_at: string | null
          created_by: string | null
          current_objective: string | null
          deleted_at: string | null
          email: string | null
          id: string
          institutional_email: string | null
          last_interaction: string | null
          methodology_phase:
            | Database["public"]["Enums"]["methodology_phase"]
            | null
          monthly_revenue: number | null
          neighborhood: string | null
          number: string | null
          pains: string[] | null
          portal_access_enabled: boolean | null
          region: string | null
          segment: string | null
          seven_index: number | null
          start_date: string | null
          status: Database["public"]["Enums"]["contract_status"] | null
          street: string | null
          success_factors: string[] | null
          trade_name: string
          updated_at: string | null
          updated_by: string | null
          upsell_potential: boolean | null
        }
        Insert: {
          auth_user_id?: string | null
          avatar_path?: string | null
          avatar_url?: string | null
          briefing?: string | null
          cep?: string | null
          clinic_specialty?: string | null
          cnpj: string
          company_size?: string | null
          complement?: string | null
          consultant_id?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          corporate_name: string
          created_at?: string | null
          created_by?: string | null
          current_objective?: string | null
          deleted_at?: string | null
          email?: string | null
          id?: string
          institutional_email?: string | null
          last_interaction?: string | null
          methodology_phase?:
            | Database["public"]["Enums"]["methodology_phase"]
            | null
          monthly_revenue?: number | null
          neighborhood?: string | null
          number?: string | null
          pains?: string[] | null
          portal_access_enabled?: boolean | null
          region?: string | null
          segment?: string | null
          seven_index?: number | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["contract_status"] | null
          street?: string | null
          success_factors?: string[] | null
          trade_name: string
          updated_at?: string | null
          updated_by?: string | null
          upsell_potential?: boolean | null
        }
        Update: {
          auth_user_id?: string | null
          avatar_path?: string | null
          avatar_url?: string | null
          briefing?: string | null
          cep?: string | null
          clinic_specialty?: string | null
          cnpj?: string
          company_size?: string | null
          complement?: string | null
          consultant_id?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          corporate_name?: string
          created_at?: string | null
          created_by?: string | null
          current_objective?: string | null
          deleted_at?: string | null
          email?: string | null
          id?: string
          institutional_email?: string | null
          last_interaction?: string | null
          methodology_phase?:
            | Database["public"]["Enums"]["methodology_phase"]
            | null
          monthly_revenue?: number | null
          neighborhood?: string | null
          number?: string | null
          pains?: string[] | null
          portal_access_enabled?: boolean | null
          region?: string | null
          segment?: string | null
          seven_index?: number | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["contract_status"] | null
          street?: string | null
          success_factors?: string[] | null
          trade_name?: string
          updated_at?: string | null
          updated_by?: string | null
          upsell_potential?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_consultant_id_fkey"
            columns: ["consultant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      consultant_availability: {
        Row: {
          client_id: string | null
          consultant_id: string
          contract_id: string | null
          contract_module_meeting_id: string | null
          contract_phase_id: string | null
          contract_product_id: string | null
          created_at: string
          end_date: string
          end_time: string
          id: string
          is_active: boolean
          slot_duration_minutes: number
          start_date: string
          start_time: string
          updated_at: string
          weekday: number
        }
        Insert: {
          client_id?: string | null
          consultant_id: string
          contract_id?: string | null
          contract_module_meeting_id?: string | null
          contract_phase_id?: string | null
          contract_product_id?: string | null
          created_at?: string
          end_date: string
          end_time: string
          id?: string
          is_active?: boolean
          slot_duration_minutes?: number
          start_date: string
          start_time: string
          updated_at?: string
          weekday: number
        }
        Update: {
          client_id?: string | null
          consultant_id?: string
          contract_id?: string | null
          contract_module_meeting_id?: string | null
          contract_phase_id?: string | null
          contract_product_id?: string | null
          created_at?: string
          end_date?: string
          end_time?: string
          id?: string
          is_active?: boolean
          slot_duration_minutes?: number
          start_date?: string
          start_time?: string
          updated_at?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "consultant_availability_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultant_availability_consultant_id_fkey"
            columns: ["consultant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultant_availability_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultant_availability_contract_module_meeting_id_fkey"
            columns: ["contract_module_meeting_id"]
            isOneToOne: false
            referencedRelation: "contract_module_meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultant_availability_contract_phase_id_fkey"
            columns: ["contract_phase_id"]
            isOneToOne: false
            referencedRelation: "contract_product_phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultant_availability_contract_product_id_fkey"
            columns: ["contract_product_id"]
            isOneToOne: false
            referencedRelation: "contract_products"
            referencedColumns: ["id"]
          },
        ]
      }
      consultant_available_slots: {
        Row: {
          available_date: string
          client_id: string | null
          consultant_id: string
          contract_id: string | null
          contract_module_meeting_id: string | null
          contract_phase_id: string | null
          contract_product_id: string | null
          created_at: string
          duration_minutes: number
          end_time: string
          id: string
          is_booked: boolean
          meeting_id: string | null
          start_time: string
          updated_at: string
        }
        Insert: {
          available_date: string
          client_id?: string | null
          consultant_id: string
          contract_id?: string | null
          contract_module_meeting_id?: string | null
          contract_phase_id?: string | null
          contract_product_id?: string | null
          created_at?: string
          duration_minutes: number
          end_time: string
          id?: string
          is_booked?: boolean
          meeting_id?: string | null
          start_time: string
          updated_at?: string
        }
        Update: {
          available_date?: string
          client_id?: string | null
          consultant_id?: string
          contract_id?: string | null
          contract_module_meeting_id?: string | null
          contract_phase_id?: string | null
          contract_product_id?: string | null
          created_at?: string
          duration_minutes?: number
          end_time?: string
          id?: string
          is_booked?: boolean
          meeting_id?: string | null
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "consultant_available_slots_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultant_available_slots_consultant_id_fkey"
            columns: ["consultant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultant_available_slots_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultant_available_slots_contract_module_meeting_id_fkey"
            columns: ["contract_module_meeting_id"]
            isOneToOne: false
            referencedRelation: "contract_module_meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultant_available_slots_contract_phase_id_fkey"
            columns: ["contract_phase_id"]
            isOneToOne: false
            referencedRelation: "contract_product_phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultant_available_slots_contract_product_id_fkey"
            columns: ["contract_product_id"]
            isOneToOne: false
            referencedRelation: "contract_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultant_available_slots_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      consultant_calendly_event_types: {
        Row: {
          calendly_url: string
          consultant_id: string
          created_at: string | null
          description: string | null
          event_category: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          meeting_template_id: string | null
          module_id: string | null
          name: string
          product_id: string | null
          updated_at: string | null
        }
        Insert: {
          calendly_url: string
          consultant_id: string
          created_at?: string | null
          description?: string | null
          event_category?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          meeting_template_id?: string | null
          module_id?: string | null
          name: string
          product_id?: string | null
          updated_at?: string | null
        }
        Update: {
          calendly_url?: string
          consultant_id?: string
          created_at?: string | null
          description?: string | null
          event_category?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          meeting_template_id?: string | null
          module_id?: string | null
          name?: string
          product_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consultant_calendly_event_types_consultant_id_fkey"
            columns: ["consultant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultant_calendly_event_types_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      consultant_indicator_goals: {
        Row: {
          comparison_operator: string
          consultant_id: string
          created_at: string | null
          created_by: string | null
          goal_type: string
          goal_value: number | null
          id: string
          indicator_key: string
          indicator_label: string
          is_active: boolean | null
          is_per_client: boolean | null
          period_type: string | null
          updated_at: string | null
        }
        Insert: {
          comparison_operator: string
          consultant_id: string
          created_at?: string | null
          created_by?: string | null
          goal_type: string
          goal_value?: number | null
          id?: string
          indicator_key: string
          indicator_label: string
          is_active?: boolean | null
          is_per_client?: boolean | null
          period_type?: string | null
          updated_at?: string | null
        }
        Update: {
          comparison_operator?: string
          consultant_id?: string
          created_at?: string | null
          created_by?: string | null
          goal_type?: string
          goal_value?: number | null
          id?: string
          indicator_key?: string
          indicator_label?: string
          is_active?: boolean | null
          is_per_client?: boolean | null
          period_type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consultant_indicator_goals_consultant_id_fkey"
            columns: ["consultant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultant_indicator_goals_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      consultant_permissions: {
        Row: {
          can_create: boolean
          can_delete: boolean
          can_edit: boolean
          can_export: boolean
          can_view: boolean
          consultant_id: string
          created_at: string
          created_by: string | null
          id: string
          module_key: string
          module_name: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          can_create?: boolean
          can_delete?: boolean
          can_edit?: boolean
          can_export?: boolean
          can_view?: boolean
          consultant_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          module_key: string
          module_name: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          can_create?: boolean
          can_delete?: boolean
          can_edit?: boolean
          can_export?: boolean
          can_view?: boolean
          consultant_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          module_key?: string
          module_name?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consultant_permissions_consultant_id_fkey"
            columns: ["consultant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_methodology_deliverables: {
        Row: {
          contract_meeting_id: string | null
          created_at: string | null
          description: string | null
          id: string
          status: string | null
          title: string
        }
        Insert: {
          contract_meeting_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          status?: string | null
          title: string
        }
        Update: {
          contract_meeting_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          status?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_methodology_deliverables_contract_meeting_id_fkey"
            columns: ["contract_meeting_id"]
            isOneToOne: false
            referencedRelation: "contract_methodology_meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_methodology_meetings: {
        Row: {
          area: string | null
          completed_at: string | null
          contract_module_id: string | null
          created_at: string | null
          duration_development: number | null
          duration_meeting: number | null
          id: string
          meeting_number: number | null
          notes: string | null
          objective: string | null
          order_index: number | null
          scheduled_at: string | null
          status: string | null
          theme: string | null
          title: string
          what_is_structured: string | null
        }
        Insert: {
          area?: string | null
          completed_at?: string | null
          contract_module_id?: string | null
          created_at?: string | null
          duration_development?: number | null
          duration_meeting?: number | null
          id?: string
          meeting_number?: number | null
          notes?: string | null
          objective?: string | null
          order_index?: number | null
          scheduled_at?: string | null
          status?: string | null
          theme?: string | null
          title: string
          what_is_structured?: string | null
        }
        Update: {
          area?: string | null
          completed_at?: string | null
          contract_module_id?: string | null
          created_at?: string | null
          duration_development?: number | null
          duration_meeting?: number | null
          id?: string
          meeting_number?: number | null
          notes?: string | null
          objective?: string | null
          order_index?: number | null
          scheduled_at?: string | null
          status?: string | null
          theme?: string | null
          title?: string
          what_is_structured?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_methodology_meetings_contract_module_id_fkey"
            columns: ["contract_module_id"]
            isOneToOne: false
            referencedRelation: "contract_methodology_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_methodology_modules: {
        Row: {
          contract_phase_id: string | null
          created_at: string | null
          description: string | null
          estimated_hours: number | null
          estimated_meetings: number | null
          id: string
          name: string
          objective: string | null
          order_index: number | null
          responsible_role: string | null
          status: string | null
        }
        Insert: {
          contract_phase_id?: string | null
          created_at?: string | null
          description?: string | null
          estimated_hours?: number | null
          estimated_meetings?: number | null
          id?: string
          name: string
          objective?: string | null
          order_index?: number | null
          responsible_role?: string | null
          status?: string | null
        }
        Update: {
          contract_phase_id?: string | null
          created_at?: string | null
          description?: string | null
          estimated_hours?: number | null
          estimated_meetings?: number | null
          id?: string
          name?: string
          objective?: string | null
          order_index?: number | null
          responsible_role?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_methodology_modules_contract_phase_id_fkey"
            columns: ["contract_phase_id"]
            isOneToOne: false
            referencedRelation: "contract_methodology_phases"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_methodology_phases: {
        Row: {
          contract_id: string
          created_at: string | null
          description: string | null
          id: string
          name: string
          objective: string | null
          order_index: number | null
          original_phase_id: string | null
          result_summary: string | null
          status: string | null
          strategic_name: string | null
          subtitle: string | null
        }
        Insert: {
          contract_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          objective?: string | null
          order_index?: number | null
          original_phase_id?: string | null
          result_summary?: string | null
          status?: string | null
          strategic_name?: string | null
          subtitle?: string | null
        }
        Update: {
          contract_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          objective?: string | null
          order_index?: number | null
          original_phase_id?: string | null
          result_summary?: string | null
          status?: string | null
          strategic_name?: string | null
          subtitle?: string | null
        }
        Relationships: []
      }
      contract_module_documents: {
        Row: {
          client_id: string
          contract_id: string
          created_at: string
          description: string | null
          file_name: string | null
          file_path: string | null
          file_size: number | null
          file_type: string | null
          file_url: string | null
          id: string
          module_id: string
          product_id: string | null
          title: string | null
          updated_at: string
          uploaded_by: string | null
          visibility_type: string
        }
        Insert: {
          client_id: string
          contract_id: string
          created_at?: string
          description?: string | null
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          module_id: string
          product_id?: string | null
          title?: string | null
          updated_at?: string
          uploaded_by?: string | null
          visibility_type?: string
        }
        Update: {
          client_id?: string
          contract_id?: string
          created_at?: string
          description?: string | null
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          module_id?: string
          product_id?: string | null
          title?: string | null
          updated_at?: string
          uploaded_by?: string | null
          visibility_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_module_documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_module_documents_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_module_documents_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "contract_product_phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_module_documents_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "contract_products"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_module_meetings: {
        Row: {
          available_from: string | null
          available_until: string | null
          cancel_url: string | null
          client_id: string
          completed_at: string | null
          consultant_id: string | null
          contract_id: string
          created_at: string
          id: string
          meeting_number: number
          microsoft_event_id: string | null
          module_id: string
          order_index: number
          product_id: string
          reschedule_url: string | null
          scheduled_at: string | null
          scheduled_meeting_id: string | null
          status: string
          teams_join_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          available_from?: string | null
          available_until?: string | null
          cancel_url?: string | null
          client_id: string
          completed_at?: string | null
          consultant_id?: string | null
          contract_id: string
          created_at?: string
          id?: string
          meeting_number: number
          microsoft_event_id?: string | null
          module_id: string
          order_index?: number
          product_id: string
          reschedule_url?: string | null
          scheduled_at?: string | null
          scheduled_meeting_id?: string | null
          status?: string
          teams_join_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          available_from?: string | null
          available_until?: string | null
          cancel_url?: string | null
          client_id?: string
          completed_at?: string | null
          consultant_id?: string | null
          contract_id?: string
          created_at?: string
          id?: string
          meeting_number?: number
          microsoft_event_id?: string | null
          module_id?: string
          order_index?: number
          product_id?: string
          reschedule_url?: string | null
          scheduled_at?: string | null
          scheduled_meeting_id?: string | null
          status?: string
          teams_join_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_module_meetings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_module_meetings_consultant_id_fkey"
            columns: ["consultant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_module_meetings_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_module_meetings_contract_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "contract_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_module_meetings_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "contract_product_phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_module_meetings_scheduled_meeting_id_fkey"
            columns: ["scheduled_meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_product_phase_consultants: {
        Row: {
          assigned_by: string | null
          consultant_id: string
          contract_product_id: string
          created_at: string | null
          end_date: string | null
          id: string
          is_primary: boolean | null
          methodology_phase_id: string
          role: string | null
          start_date: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_by?: string | null
          consultant_id: string
          contract_product_id: string
          created_at?: string | null
          end_date?: string | null
          id?: string
          is_primary?: boolean | null
          methodology_phase_id: string
          role?: string | null
          start_date?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_by?: string | null
          consultant_id?: string
          contract_product_id?: string
          created_at?: string | null
          end_date?: string | null
          id?: string
          is_primary?: boolean | null
          methodology_phase_id?: string
          role?: string | null
          start_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_product_phase_consultants_consultant_id_fkey"
            columns: ["consultant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_product_phase_consultants_contract_product_id_fkey"
            columns: ["contract_product_id"]
            isOneToOne: false
            referencedRelation: "contract_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_product_phase_consultants_methodology_phase_id_fkey"
            columns: ["methodology_phase_id"]
            isOneToOne: false
            referencedRelation: "methodology_plan_phases"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_product_phases: {
        Row: {
          client_notes: string | null
          client_visible: boolean | null
          contract_product_id: string
          created_at: string | null
          created_by: string | null
          duration_minutes: number | null
          end_date: string | null
          executor_type: string | null
          id: string
          internal_notes: string | null
          meetings_count: number | null
          methodology_phase_id: string | null
          name: string
          order_index: number
          responsible_consultant_id: string | null
          start_date: string | null
          status: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          client_notes?: string | null
          client_visible?: boolean | null
          contract_product_id: string
          created_at?: string | null
          created_by?: string | null
          duration_minutes?: number | null
          end_date?: string | null
          executor_type?: string | null
          id?: string
          internal_notes?: string | null
          meetings_count?: number | null
          methodology_phase_id?: string | null
          name: string
          order_index: number
          responsible_consultant_id?: string | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          client_notes?: string | null
          client_visible?: boolean | null
          contract_product_id?: string
          created_at?: string | null
          created_by?: string | null
          duration_minutes?: number | null
          end_date?: string | null
          executor_type?: string | null
          id?: string
          internal_notes?: string | null
          meetings_count?: number | null
          methodology_phase_id?: string | null
          name?: string
          order_index?: number
          responsible_consultant_id?: string | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_product_phases_contract_product_id_fkey"
            columns: ["contract_product_id"]
            isOneToOne: false
            referencedRelation: "contract_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_product_phases_methodology_phase_id_fkey"
            columns: ["methodology_phase_id"]
            isOneToOne: false
            referencedRelation: "methodology_plan_phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_product_phases_responsible_consultant_id_fkey"
            columns: ["responsible_consultant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_products: {
        Row: {
          client_notes: string | null
          client_visible: boolean | null
          consultant_hours: number | null
          contract_id: string
          created_at: string | null
          created_by: string | null
          current_phase_id: string | null
          end_date: string | null
          id: string
          internal_notes: string | null
          product_category: string | null
          product_description: string | null
          product_id: string
          product_name: string | null
          silvane_hours: number | null
          start_date: string | null
          status: string
          updated_at: string | null
          updated_by: string | null
          value: number | null
        }
        Insert: {
          client_notes?: string | null
          client_visible?: boolean | null
          consultant_hours?: number | null
          contract_id: string
          created_at?: string | null
          created_by?: string | null
          current_phase_id?: string | null
          end_date?: string | null
          id?: string
          internal_notes?: string | null
          product_category?: string | null
          product_description?: string | null
          product_id: string
          product_name?: string | null
          silvane_hours?: number | null
          start_date?: string | null
          status?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: number | null
        }
        Update: {
          client_notes?: string | null
          client_visible?: boolean | null
          consultant_hours?: number | null
          contract_id?: string
          created_at?: string | null
          created_by?: string | null
          current_phase_id?: string | null
          end_date?: string | null
          id?: string
          internal_notes?: string | null
          product_category?: string | null
          product_description?: string | null
          product_id?: string
          product_name?: string | null
          silvane_hours?: number | null
          start_date?: string | null
          status?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_products_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_products_current_phase_id_fkey"
            columns: ["current_phase_id"]
            isOneToOne: false
            referencedRelation: "methodology_plan_phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          client_id: string | null
          consultant_id: string | null
          contract_number: string | null
          created_at: string | null
          created_by: string | null
          current_phase: Database["public"]["Enums"]["methodology_phase"] | null
          end_date: string
          id: string
          product_id: string | null
          risk_level: Database["public"]["Enums"]["risk_level"] | null
          start_date: string
          status: Database["public"]["Enums"]["contract_status"] | null
          type: string
          updated_at: string | null
          updated_by: string | null
          value: number
        }
        Insert: {
          client_id?: string | null
          consultant_id?: string | null
          contract_number?: string | null
          created_at?: string | null
          created_by?: string | null
          current_phase?:
            | Database["public"]["Enums"]["methodology_phase"]
            | null
          end_date: string
          id?: string
          product_id?: string | null
          risk_level?: Database["public"]["Enums"]["risk_level"] | null
          start_date: string
          status?: Database["public"]["Enums"]["contract_status"] | null
          type: string
          updated_at?: string | null
          updated_by?: string | null
          value: number
        }
        Update: {
          client_id?: string | null
          consultant_id?: string | null
          contract_number?: string | null
          created_at?: string | null
          created_by?: string | null
          current_phase?:
            | Database["public"]["Enums"]["methodology_phase"]
            | null
          end_date?: string
          id?: string
          product_id?: string | null
          risk_level?: Database["public"]["Enums"]["risk_level"] | null
          start_date?: string
          status?: Database["public"]["Enums"]["contract_status"] | null
          type?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "contracts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_consultant_id_fkey"
            columns: ["consultant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      csat_surveys: {
        Row: {
          client_id: string | null
          comment: string | null
          date: string | null
          id: string
          meeting_id: string | null
          score: number | null
        }
        Insert: {
          client_id?: string | null
          comment?: string | null
          date?: string | null
          id?: string
          meeting_id?: string | null
          score?: number | null
        }
        Update: {
          client_id?: string | null
          comment?: string | null
          date?: string | null
          id?: string
          meeting_id?: string | null
          score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "csat_surveys_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "csat_surveys_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      default_indicator_goals: {
        Row: {
          comparison_operator: string
          created_at: string | null
          default_goal_value: number | null
          goal_type: string
          id: string
          indicator_key: string
          indicator_label: string
          is_active: boolean | null
          period_type: string | null
          updated_at: string | null
        }
        Insert: {
          comparison_operator: string
          created_at?: string | null
          default_goal_value?: number | null
          goal_type: string
          id?: string
          indicator_key: string
          indicator_label: string
          is_active?: boolean | null
          period_type?: string | null
          updated_at?: string | null
        }
        Update: {
          comparison_operator?: string
          created_at?: string | null
          default_goal_value?: number | null
          goal_type?: string
          id?: string
          indicator_key?: string
          indicator_label?: string
          is_active?: boolean | null
          period_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      document_links: {
        Row: {
          created_at: string | null
          description: string | null
          document_id: string | null
          entity_id: string
          entity_type: string
          id: string
          is_required: boolean | null
          order_index: number | null
          title: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          document_id?: string | null
          entity_id: string
          entity_type: string
          id?: string
          is_required?: boolean | null
          order_index?: number | null
          title?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          document_id?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          is_required?: boolean | null
          order_index?: number | null
          title?: string | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          author_id: string | null
          client_id: string | null
          contract_id: string | null
          contract_product_id: string | null
          contract_product_phase_id: string | null
          created_at: string | null
          created_by: string | null
          feedbacks: Json | null
          file_name: string | null
          file_path: string | null
          file_size: number | null
          file_type: string | null
          file_url: string | null
          id: string
          methodology_phase_id: string | null
          module_id: string | null
          product_id: string | null
          status: string | null
          title: string
          type: string | null
          type_label: string | null
          updated_at: string | null
          updated_by: string | null
          uploaded_at: string | null
          uploaded_by: string | null
          visibility: string | null
          visibility_type: string | null
        }
        Insert: {
          author_id?: string | null
          client_id?: string | null
          contract_id?: string | null
          contract_product_id?: string | null
          contract_product_phase_id?: string | null
          created_at?: string | null
          created_by?: string | null
          feedbacks?: Json | null
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          methodology_phase_id?: string | null
          module_id?: string | null
          product_id?: string | null
          status?: string | null
          title: string
          type?: string | null
          type_label?: string | null
          updated_at?: string | null
          updated_by?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
          visibility?: string | null
          visibility_type?: string | null
        }
        Update: {
          author_id?: string | null
          client_id?: string | null
          contract_id?: string | null
          contract_product_id?: string | null
          contract_product_phase_id?: string | null
          created_at?: string | null
          created_by?: string | null
          feedbacks?: Json | null
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          methodology_phase_id?: string | null
          module_id?: string | null
          product_id?: string | null
          status?: string | null
          title?: string
          type?: string | null
          type_label?: string | null
          updated_at?: string | null
          updated_by?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
          visibility?: string | null
          visibility_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_contract_product_id_fkey"
            columns: ["contract_product_id"]
            isOneToOne: false
            referencedRelation: "contract_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_contract_product_phase_id_fkey"
            columns: ["contract_product_phase_id"]
            isOneToOne: false
            referencedRelation: "contract_product_phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_methodology_phase_id_fkey"
            columns: ["methodology_phase_id"]
            isOneToOne: false
            referencedRelation: "methodology_phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "contract_product_phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      ia_insights: {
        Row: {
          client_id: string | null
          confidence: number | null
          created_at: string | null
          description: string | null
          id: string
          title: string
          type: string
          variant: string | null
        }
        Insert: {
          client_id?: string | null
          confidence?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          title: string
          type: string
          variant?: string | null
        }
        Update: {
          client_id?: string | null
          confidence?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          title?: string
          type?: string
          variant?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ia_insights_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_events: {
        Row: {
          detail: string | null
          id: string
          integration_id: string | null
          occurred_at: string | null
          title: string
        }
        Insert: {
          detail?: string | null
          id?: string
          integration_id?: string | null
          occurred_at?: string | null
          title: string
        }
        Update: {
          detail?: string | null
          id?: string
          integration_id?: string | null
          occurred_at?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_events_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations: {
        Row: {
          benefits: string[] | null
          capabilities: string[] | null
          category: string
          connected_at: string | null
          created_at: string | null
          description: string | null
          documentation_url: string | null
          id: string
          last_sync: string | null
          linked_account: string | null
          name: string
          provider: string
          scopes: string[] | null
          status: string
          synced_items_count: number | null
        }
        Insert: {
          benefits?: string[] | null
          capabilities?: string[] | null
          category: string
          connected_at?: string | null
          created_at?: string | null
          description?: string | null
          documentation_url?: string | null
          id?: string
          last_sync?: string | null
          linked_account?: string | null
          name: string
          provider: string
          scopes?: string[] | null
          status: string
          synced_items_count?: number | null
        }
        Update: {
          benefits?: string[] | null
          capabilities?: string[] | null
          category?: string
          connected_at?: string | null
          created_at?: string | null
          description?: string | null
          documentation_url?: string | null
          id?: string
          last_sync?: string | null
          linked_account?: string | null
          name?: string
          provider?: string
          scopes?: string[] | null
          status?: string
          synced_items_count?: number | null
        }
        Relationships: []
      }
      legacy_projects: {
        Row: {
          client_id: string | null
          consultant_id: string | null
          contract_id: string | null
          created_at: string | null
          created_by: string | null
          current_phase: Database["public"]["Enums"]["methodology_phase"] | null
          end_date: string | null
          id: string
          name: string | null
          product_id: string | null
          start_date: string | null
          status: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          client_id?: string | null
          consultant_id?: string | null
          contract_id?: string | null
          created_at?: string | null
          created_by?: string | null
          current_phase?:
            | Database["public"]["Enums"]["methodology_phase"]
            | null
          end_date?: string | null
          id?: string
          name?: string | null
          product_id?: string | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          client_id?: string | null
          consultant_id?: string | null
          contract_id?: string | null
          created_at?: string | null
          created_by?: string | null
          current_phase?:
            | Database["public"]["Enums"]["methodology_phase"]
            | null
          end_date?: string | null
          id?: string
          name?: string | null
          product_id?: string | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_consultant_id_fkey"
            columns: ["consultant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_csat: {
        Row: {
          client_id: string
          comment: string | null
          consultant_id: string
          contract_id: string
          contract_module_meeting_id: string | null
          contract_product_id: string | null
          created_at: string | null
          id: string
          meeting_id: string
          nps_score: number | null
          rating_clarity: number | null
          rating_consultant: number | null
          rating_meeting: number | null
          released_at: string | null
          status: string | null
          submitted_at: string | null
          updated_at: string | null
        }
        Insert: {
          client_id: string
          comment?: string | null
          consultant_id: string
          contract_id: string
          contract_module_meeting_id?: string | null
          contract_product_id?: string | null
          created_at?: string | null
          id?: string
          meeting_id: string
          nps_score?: number | null
          rating_clarity?: number | null
          rating_consultant?: number | null
          rating_meeting?: number | null
          released_at?: string | null
          status?: string | null
          submitted_at?: string | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          comment?: string | null
          consultant_id?: string
          contract_id?: string
          contract_module_meeting_id?: string | null
          contract_product_id?: string | null
          created_at?: string | null
          id?: string
          meeting_id?: string
          nps_score?: number | null
          rating_clarity?: number | null
          rating_consultant?: number | null
          rating_meeting?: number | null
          released_at?: string | null
          status?: string | null
          submitted_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meeting_csat_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_csat_consultant_id_fkey"
            columns: ["consultant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_csat_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_csat_contract_module_meeting_id_fkey"
            columns: ["contract_module_meeting_id"]
            isOneToOne: false
            referencedRelation: "contract_module_meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_csat_contract_product_id_fkey"
            columns: ["contract_product_id"]
            isOneToOne: false
            referencedRelation: "contract_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_csat_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: true
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_csat_responses: {
        Row: {
          client_id: string
          comment: string | null
          consultant_id: string | null
          contract_id: string | null
          created_at: string | null
          id: string
          meeting_id: string
          nps_score: number | null
          rating_clarity: number | null
          rating_consultant: number | null
          rating_meeting: number | null
          submitted_at: string | null
        }
        Insert: {
          client_id: string
          comment?: string | null
          consultant_id?: string | null
          contract_id?: string | null
          created_at?: string | null
          id?: string
          meeting_id: string
          nps_score?: number | null
          rating_clarity?: number | null
          rating_consultant?: number | null
          rating_meeting?: number | null
          submitted_at?: string | null
        }
        Update: {
          client_id?: string
          comment?: string | null
          consultant_id?: string | null
          contract_id?: string | null
          created_at?: string | null
          id?: string
          meeting_id?: string
          nps_score?: number | null
          rating_clarity?: number | null
          rating_consultant?: number | null
          rating_meeting?: number | null
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meeting_csat_responses_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_csat_responses_consultant_id_fkey"
            columns: ["consultant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_csat_responses_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_csat_responses_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_history: {
        Row: {
          changed_by: string | null
          created_at: string
          id: string
          meeting_id: string
          new_date: string | null
          new_start_time: string | null
          new_status: string | null
          previous_date: string | null
          previous_start_time: string | null
          previous_status: string | null
          reason: string | null
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          id?: string
          meeting_id: string
          new_date?: string | null
          new_start_time?: string | null
          new_status?: string | null
          previous_date?: string | null
          previous_start_time?: string | null
          previous_status?: string | null
          reason?: string | null
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          id?: string
          meeting_id?: string
          new_date?: string | null
          new_start_time?: string | null
          new_status?: string | null
          previous_date?: string | null
          previous_start_time?: string | null
          previous_status?: string | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meeting_history_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_history_events: {
        Row: {
          client_id: string | null
          consultant_id: string | null
          created_at: string | null
          description: string | null
          event_type: string
          id: string
          meeting_id: string
          metadata: Json | null
          new_start_time: string | null
          previous_start_time: string | null
          scheduling_event_id: string | null
          title: string
        }
        Insert: {
          client_id?: string | null
          consultant_id?: string | null
          created_at?: string | null
          description?: string | null
          event_type: string
          id?: string
          meeting_id: string
          metadata?: Json | null
          new_start_time?: string | null
          previous_start_time?: string | null
          scheduling_event_id?: string | null
          title: string
        }
        Update: {
          client_id?: string | null
          consultant_id?: string | null
          created_at?: string | null
          description?: string | null
          event_type?: string
          id?: string
          meeting_id?: string
          metadata?: Json | null
          new_start_time?: string | null
          previous_start_time?: string | null
          scheduling_event_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_history_events_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_history_events_consultant_id_fkey"
            columns: ["consultant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_history_events_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "contract_module_meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_history_events_scheduling_event_id_fkey"
            columns: ["scheduling_event_id"]
            isOneToOne: false
            referencedRelation: "meeting_scheduling_events"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_scheduling_events: {
        Row: {
          calendly_event_uri: string | null
          calendly_event_uuid: string | null
          calendly_invitee_uri: string | null
          calendly_invitee_uuid: string | null
          cancel_url: string | null
          canceled_at: string | null
          cancellation_reason: string | null
          client_id: string
          consultant_id: string
          contract_id: string | null
          created_at: string | null
          event_name: string | null
          event_uuid: string | null
          id: string
          invitee_email: string | null
          invitee_name: string | null
          invitee_uuid: string | null
          meeting_id: string
          module_id: string | null
          previous_event_uri: string | null
          previous_event_uuid: string | null
          product_id: string | null
          provider: string
          raw_payload: Json | null
          reschedule_url: string | null
          rescheduled: boolean | null
          scheduled_end_time: string | null
          scheduled_start_time: string | null
          status: string
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          calendly_event_uri?: string | null
          calendly_event_uuid?: string | null
          calendly_invitee_uri?: string | null
          calendly_invitee_uuid?: string | null
          cancel_url?: string | null
          canceled_at?: string | null
          cancellation_reason?: string | null
          client_id: string
          consultant_id: string
          contract_id?: string | null
          created_at?: string | null
          event_name?: string | null
          event_uuid?: string | null
          id?: string
          invitee_email?: string | null
          invitee_name?: string | null
          invitee_uuid?: string | null
          meeting_id: string
          module_id?: string | null
          previous_event_uri?: string | null
          previous_event_uuid?: string | null
          product_id?: string | null
          provider?: string
          raw_payload?: Json | null
          reschedule_url?: string | null
          rescheduled?: boolean | null
          scheduled_end_time?: string | null
          scheduled_start_time?: string | null
          status?: string
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          calendly_event_uri?: string | null
          calendly_event_uuid?: string | null
          calendly_invitee_uri?: string | null
          calendly_invitee_uuid?: string | null
          cancel_url?: string | null
          canceled_at?: string | null
          cancellation_reason?: string | null
          client_id?: string
          consultant_id?: string
          contract_id?: string | null
          created_at?: string | null
          event_name?: string | null
          event_uuid?: string | null
          id?: string
          invitee_email?: string | null
          invitee_name?: string | null
          invitee_uuid?: string | null
          meeting_id?: string
          module_id?: string | null
          previous_event_uri?: string | null
          previous_event_uuid?: string | null
          product_id?: string | null
          provider?: string
          raw_payload?: Json | null
          reschedule_url?: string | null
          rescheduled?: boolean | null
          scheduled_end_time?: string | null
          scheduled_start_time?: string | null
          status?: string
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meeting_scheduling_events_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_scheduling_events_consultant_id_fkey"
            columns: ["consultant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_scheduling_events_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_scheduling_events_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "contract_module_meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meetings: {
        Row: {
          calendly_cancel_url: string | null
          calendly_event_type_uri: string | null
          calendly_event_uri: string | null
          calendly_invitee_uri: string | null
          calendly_reschedule_url: string | null
          cancel_reason: string | null
          cancel_url: string | null
          canceled_at: string | null
          canceled_by: string | null
          client_id: string | null
          consultant_id: string | null
          contract_id: string | null
          contract_module_meeting_id: string | null
          contract_product_id: string | null
          contract_product_phase_id: string | null
          created_at: string | null
          created_by: string | null
          csat_enabled: boolean | null
          csat_submitted: boolean | null
          csat_submitted_at: string | null
          description: string | null
          duration: number | null
          external_cancel_url: string | null
          external_event_type_uri: string | null
          external_event_uri: string | null
          external_id: string | null
          external_invitee_uri: string | null
          external_payload: Json | null
          external_provider: string | null
          external_reschedule_url: string | null
          id: string
          location: string | null
          meeting_date: string
          meeting_minutes: string | null
          meeting_url: string | null
          methodology_phase_id: string | null
          microsoft_event_id: string | null
          participants: Json | null
          reschedule_url: string | null
          scheduled_by: string | null
          source: string | null
          start_time: string
          status: string | null
          teams_join_url: string | null
          title: string | null
          type: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          calendly_cancel_url?: string | null
          calendly_event_type_uri?: string | null
          calendly_event_uri?: string | null
          calendly_invitee_uri?: string | null
          calendly_reschedule_url?: string | null
          cancel_reason?: string | null
          cancel_url?: string | null
          canceled_at?: string | null
          canceled_by?: string | null
          client_id?: string | null
          consultant_id?: string | null
          contract_id?: string | null
          contract_module_meeting_id?: string | null
          contract_product_id?: string | null
          contract_product_phase_id?: string | null
          created_at?: string | null
          created_by?: string | null
          csat_enabled?: boolean | null
          csat_submitted?: boolean | null
          csat_submitted_at?: string | null
          description?: string | null
          duration?: number | null
          external_cancel_url?: string | null
          external_event_type_uri?: string | null
          external_event_uri?: string | null
          external_id?: string | null
          external_invitee_uri?: string | null
          external_payload?: Json | null
          external_provider?: string | null
          external_reschedule_url?: string | null
          id?: string
          location?: string | null
          meeting_date: string
          meeting_minutes?: string | null
          meeting_url?: string | null
          methodology_phase_id?: string | null
          microsoft_event_id?: string | null
          participants?: Json | null
          reschedule_url?: string | null
          scheduled_by?: string | null
          source?: string | null
          start_time: string
          status?: string | null
          teams_join_url?: string | null
          title?: string | null
          type?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          calendly_cancel_url?: string | null
          calendly_event_type_uri?: string | null
          calendly_event_uri?: string | null
          calendly_invitee_uri?: string | null
          calendly_reschedule_url?: string | null
          cancel_reason?: string | null
          cancel_url?: string | null
          canceled_at?: string | null
          canceled_by?: string | null
          client_id?: string | null
          consultant_id?: string | null
          contract_id?: string | null
          contract_module_meeting_id?: string | null
          contract_product_id?: string | null
          contract_product_phase_id?: string | null
          created_at?: string | null
          created_by?: string | null
          csat_enabled?: boolean | null
          csat_submitted?: boolean | null
          csat_submitted_at?: string | null
          description?: string | null
          duration?: number | null
          external_cancel_url?: string | null
          external_event_type_uri?: string | null
          external_event_uri?: string | null
          external_id?: string | null
          external_invitee_uri?: string | null
          external_payload?: Json | null
          external_provider?: string | null
          external_reschedule_url?: string | null
          id?: string
          location?: string | null
          meeting_date?: string
          meeting_minutes?: string | null
          meeting_url?: string | null
          methodology_phase_id?: string | null
          microsoft_event_id?: string | null
          participants?: Json | null
          reschedule_url?: string | null
          scheduled_by?: string | null
          source?: string | null
          start_time?: string
          status?: string | null
          teams_join_url?: string | null
          title?: string | null
          type?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meetings_canceled_by_fkey"
            columns: ["canceled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_consultant_id_fkey"
            columns: ["consultant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_contract_module_meeting_id_fkey"
            columns: ["contract_module_meeting_id"]
            isOneToOne: false
            referencedRelation: "contract_module_meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_contract_product_id_fkey"
            columns: ["contract_product_id"]
            isOneToOne: false
            referencedRelation: "contract_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_contract_product_phase_id_fkey"
            columns: ["contract_product_phase_id"]
            isOneToOne: false
            referencedRelation: "contract_product_phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_scheduled_by_fkey"
            columns: ["scheduled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      methodology_materials: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          duration: string | null
          file_name: string | null
          file_path: string | null
          file_size: number | null
          file_type: string | null
          file_url: string | null
          id: string
          is_essential: boolean | null
          is_general: boolean | null
          is_updated: boolean | null
          order_index: number | null
          pages: number | null
          phase_id: string | null
          status: string | null
          tag: string | null
          title: string
          type: string
          updated_at: string | null
          uploaded_by: string | null
          url: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          duration?: string | null
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_essential?: boolean | null
          is_general?: boolean | null
          is_updated?: boolean | null
          order_index?: number | null
          pages?: number | null
          phase_id?: string | null
          status?: string | null
          tag?: string | null
          title: string
          type: string
          updated_at?: string | null
          uploaded_by?: string | null
          url?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          duration?: string | null
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_essential?: boolean | null
          is_general?: boolean | null
          is_updated?: boolean | null
          order_index?: number | null
          pages?: number | null
          phase_id?: string | null
          status?: string | null
          tag?: string | null
          title?: string
          type?: string
          updated_at?: string | null
          uploaded_by?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "methodology_materials_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "methodology_phases"
            referencedColumns: ["id"]
          },
        ]
      }
      methodology_phase_deliverables: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          order_index: number | null
          phase_id: string
          title: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          order_index?: number | null
          phase_id: string
          title: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          order_index?: number | null
          phase_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "methodology_phase_deliverables_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "methodology_phases"
            referencedColumns: ["id"]
          },
        ]
      }
      methodology_phase_objectives: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          order_index: number | null
          phase_id: string
          title: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          order_index?: number | null
          phase_id: string
          title: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          order_index?: number | null
          phase_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "methodology_phase_objectives_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "methodology_phases"
            referencedColumns: ["id"]
          },
        ]
      }
      methodology_phase_tools: {
        Row: {
          created_at: string | null
          id: string
          name: string
          order_index: number | null
          phase_id: string
          type: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          order_index?: number | null
          phase_id: string
          type?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          order_index?: number | null
          phase_id?: string
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "methodology_phase_tools_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "methodology_phases"
            referencedColumns: ["id"]
          },
        ]
      }
      methodology_phases: {
        Row: {
          alerts: string[] | null
          average_duration: string | null
          created_at: string | null
          deliverables: string[] | null
          id: string
          name: string
          objectives: string[] | null
          order_index: number
          phase_key: string
          purpose: string | null
          status: string | null
          subtitle: string | null
          tools: string[] | null
          updated_at: string | null
        }
        Insert: {
          alerts?: string[] | null
          average_duration?: string | null
          created_at?: string | null
          deliverables?: string[] | null
          id?: string
          name: string
          objectives?: string[] | null
          order_index: number
          phase_key: string
          purpose?: string | null
          status?: string | null
          subtitle?: string | null
          tools?: string[] | null
          updated_at?: string | null
        }
        Update: {
          alerts?: string[] | null
          average_duration?: string | null
          created_at?: string | null
          deliverables?: string[] | null
          id?: string
          name?: string
          objectives?: string[] | null
          order_index?: number
          phase_key?: string
          purpose?: string | null
          status?: string | null
          subtitle?: string | null
          tools?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      methodology_plan_deliverables: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_required: boolean | null
          meeting_id: string | null
          order_index: number | null
          title: string
          type: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_required?: boolean | null
          meeting_id?: string | null
          order_index?: number | null
          title: string
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_required?: boolean | null
          meeting_id?: string | null
          order_index?: number | null
          title?: string
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "methodology_plan_deliverables_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "methodology_plan_meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      methodology_plan_meetings: {
        Row: {
          area: string | null
          created_at: string | null
          duration_development: number | null
          duration_meeting: number | null
          id: string
          meeting_number: number | null
          module_id: string | null
          objective: string | null
          order_index: number | null
          status: string | null
          theme: string | null
          title: string
          updated_at: string | null
          what_is_structured: string | null
        }
        Insert: {
          area?: string | null
          created_at?: string | null
          duration_development?: number | null
          duration_meeting?: number | null
          id?: string
          meeting_number?: number | null
          module_id?: string | null
          objective?: string | null
          order_index?: number | null
          status?: string | null
          theme?: string | null
          title: string
          updated_at?: string | null
          what_is_structured?: string | null
        }
        Update: {
          area?: string | null
          created_at?: string | null
          duration_development?: number | null
          duration_meeting?: number | null
          id?: string
          meeting_number?: number | null
          module_id?: string | null
          objective?: string | null
          order_index?: number | null
          status?: string | null
          theme?: string | null
          title?: string
          updated_at?: string | null
          what_is_structured?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "methodology_plan_meetings_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "methodology_plan_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      methodology_plan_modules: {
        Row: {
          created_at: string | null
          description: string | null
          estimated_hours: number | null
          estimated_meetings: number | null
          id: string
          name: string
          objective: string | null
          order_index: number | null
          phase_id: string | null
          responsible_role: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          estimated_hours?: number | null
          estimated_meetings?: number | null
          id?: string
          name: string
          objective?: string | null
          order_index?: number | null
          phase_id?: string | null
          responsible_role?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          estimated_hours?: number | null
          estimated_meetings?: number | null
          id?: string
          name?: string
          objective?: string | null
          order_index?: number | null
          phase_id?: string | null
          responsible_role?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "methodology_plan_modules_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "methodology_plan_phases"
            referencedColumns: ["id"]
          },
        ]
      }
      methodology_plan_phases: {
        Row: {
          alerts: string[] | null
          average_duration: string | null
          created_at: string | null
          deliverables: string[] | null
          description: string | null
          duration_minutes: number | null
          executor_type: string | null
          id: string
          meetings_count: number | null
          methodology_plan_id: string | null
          name: string
          objective: string | null
          objectives: string[] | null
          order_index: number
          phase_key: string | null
          plan_id: string | null
          product_id: string | null
          purpose: string | null
          result_summary: string | null
          status: string | null
          strategic_name: string | null
          subtitle: string | null
          tools: string[] | null
          updated_at: string | null
        }
        Insert: {
          alerts?: string[] | null
          average_duration?: string | null
          created_at?: string | null
          deliverables?: string[] | null
          description?: string | null
          duration_minutes?: number | null
          executor_type?: string | null
          id?: string
          meetings_count?: number | null
          methodology_plan_id?: string | null
          name: string
          objective?: string | null
          objectives?: string[] | null
          order_index?: number
          phase_key?: string | null
          plan_id?: string | null
          product_id?: string | null
          purpose?: string | null
          result_summary?: string | null
          status?: string | null
          strategic_name?: string | null
          subtitle?: string | null
          tools?: string[] | null
          updated_at?: string | null
        }
        Update: {
          alerts?: string[] | null
          average_duration?: string | null
          created_at?: string | null
          deliverables?: string[] | null
          description?: string | null
          duration_minutes?: number | null
          executor_type?: string | null
          id?: string
          meetings_count?: number | null
          methodology_plan_id?: string | null
          name?: string
          objective?: string | null
          objectives?: string[] | null
          order_index?: number
          phase_key?: string | null
          plan_id?: string | null
          product_id?: string | null
          purpose?: string | null
          result_summary?: string | null
          status?: string | null
          strategic_name?: string | null
          subtitle?: string | null
          tools?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "methodology_plan_phases_methodology_plan_id_fkey"
            columns: ["methodology_plan_id"]
            isOneToOne: false
            referencedRelation: "methodology_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "methodology_plan_phases_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "methodology_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "methodology_plan_phases_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      methodology_plans: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          objective: string | null
          order_index: number | null
          product_id: string | null
          status: string | null
          updated_at: string | null
          version: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          objective?: string | null
          order_index?: number | null
          product_id?: string | null
          status?: string | null
          updated_at?: string | null
          version?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          objective?: string | null
          order_index?: number | null
          product_id?: string | null
          status?: string | null
          updated_at?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "methodology_plans_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      methodology_questions: {
        Row: {
          created_at: string | null
          id: string
          objective: string | null
          phase_id: string | null
          question: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          objective?: string | null
          phase_id?: string | null
          question: string
        }
        Update: {
          created_at?: string | null
          id?: string
          objective?: string | null
          phase_id?: string | null
          question?: string
        }
        Relationships: [
          {
            foreignKeyName: "methodology_questions_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "methodology_phases"
            referencedColumns: ["id"]
          },
        ]
      }
      methodology_templates: {
        Row: {
          created_at: string | null
          description: string | null
          examples: string[] | null
          format: string | null
          id: string
          phase_id: string | null
          title: string
          url: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          examples?: string[] | null
          format?: string | null
          id?: string
          phase_id?: string | null
          title: string
          url?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          examples?: string[] | null
          format?: string | null
          id?: string
          phase_id?: string | null
          title?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "methodology_templates_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "methodology_phases"
            referencedColumns: ["id"]
          },
        ]
      }
      methodology_transversal_materials: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          file_name: string | null
          file_path: string | null
          file_size: number | null
          file_type: string | null
          file_url: string | null
          id: string
          is_preview: boolean | null
          order_index: number | null
          status: string | null
          title: string
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_preview?: boolean | null
          order_index?: number | null
          status?: string | null
          title: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_preview?: boolean | null
          order_index?: number | null
          status?: string | null
          title?: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: []
      }
      module_documents: {
        Row: {
          created_at: string
          document_id: string
          id: string
          module_id: string
          order_index: number
          updated_at: string
          visibility_type: string
        }
        Insert: {
          created_at?: string
          document_id: string
          id?: string
          module_id: string
          order_index?: number
          updated_at?: string
          visibility_type?: string
        }
        Update: {
          created_at?: string
          document_id?: string
          id?: string
          module_id?: string
          order_index?: number
          updated_at?: string
          visibility_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "module_documents_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "module_documents_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "methodology_plan_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      nps_surveys: {
        Row: {
          client_id: string | null
          comment: string | null
          consultant_id: string | null
          date: string | null
          id: string
          score: number | null
          status: string | null
        }
        Insert: {
          client_id?: string | null
          comment?: string | null
          consultant_id?: string | null
          date?: string | null
          id?: string
          score?: number | null
          status?: string | null
        }
        Update: {
          client_id?: string | null
          comment?: string | null
          consultant_id?: string | null
          date?: string | null
          id?: string
          score?: number | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nps_surveys_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nps_surveys_consultant_id_fkey"
            columns: ["consultant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string | null
          consultant_hours: number | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          name: string
          service_track_position: number | null
          silvane_hours: number | null
          slug: string | null
          status: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          category?: string | null
          consultant_hours?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          service_track_position?: number | null
          silvane_hours?: number | null
          slug?: string | null
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          category?: string | null
          consultant_hours?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          service_track_position?: number | null
          silvane_hours?: number | null
          slug?: string | null
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          calendly_url: string | null
          city: string | null
          created_at: string | null
          email: string
          entry_date: string | null
          full_name: string
          hours_available: number | null
          id: string
          max_clients: number | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          specialty: string | null
          state: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          calendly_url?: string | null
          city?: string | null
          created_at?: string | null
          email: string
          entry_date?: string | null
          full_name: string
          hours_available?: number | null
          id: string
          max_clients?: number | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          specialty?: string | null
          state?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          calendly_url?: string | null
          city?: string | null
          created_at?: string | null
          email?: string
          entry_date?: string | null
          full_name?: string
          hours_available?: number | null
          id?: string
          max_clients?: number | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          specialty?: string | null
          state?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      subtasks: {
        Row: {
          completed: boolean | null
          id: string
          task_id: string | null
          title: string
        }
        Insert: {
          completed?: boolean | null
          id?: string
          task_id?: string | null
          title: string
        }
        Update: {
          completed?: boolean | null
          id?: string
          task_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "subtasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          client_id: string | null
          completed_at: string | null
          consultant_id: string | null
          contract_id: string | null
          contract_product_id: string | null
          contract_product_phase_id: string | null
          created_at: string | null
          created_by: string | null
          created_by_name: string | null
          created_by_role: string | null
          delegated_by: string | null
          demand_type: string | null
          description: string | null
          due_date: string | null
          id: string
          impeded_at: string | null
          impeded_by: string | null
          impediment_history: Json | null
          impediment_reason: string | null
          methodology_phase_id: string | null
          origin: string | null
          priority: Database["public"]["Enums"]["risk_level"] | null
          status: Database["public"]["Enums"]["task_status"] | null
          title: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          client_id?: string | null
          completed_at?: string | null
          consultant_id?: string | null
          contract_id?: string | null
          contract_product_id?: string | null
          contract_product_phase_id?: string | null
          created_at?: string | null
          created_by?: string | null
          created_by_name?: string | null
          created_by_role?: string | null
          delegated_by?: string | null
          demand_type?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          impeded_at?: string | null
          impeded_by?: string | null
          impediment_history?: Json | null
          impediment_reason?: string | null
          methodology_phase_id?: string | null
          origin?: string | null
          priority?: Database["public"]["Enums"]["risk_level"] | null
          status?: Database["public"]["Enums"]["task_status"] | null
          title: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          client_id?: string | null
          completed_at?: string | null
          consultant_id?: string | null
          contract_id?: string | null
          contract_product_id?: string | null
          contract_product_phase_id?: string | null
          created_at?: string | null
          created_by?: string | null
          created_by_name?: string | null
          created_by_role?: string | null
          delegated_by?: string | null
          demand_type?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          impeded_at?: string | null
          impeded_by?: string | null
          impediment_history?: Json | null
          impediment_reason?: string | null
          methodology_phase_id?: string | null
          origin?: string | null
          priority?: Database["public"]["Enums"]["risk_level"] | null
          status?: Database["public"]["Enums"]["task_status"] | null
          title?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_consultant_id_fkey"
            columns: ["consultant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_contract_product_id_fkey"
            columns: ["contract_product_id"]
            isOneToOne: false
            referencedRelation: "contract_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_contract_product_phase_id_fkey"
            columns: ["contract_product_phase_id"]
            isOneToOne: false
            referencedRelation: "contract_product_phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_delegated_by_fkey"
            columns: ["delegated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_methodology_phase_id_fkey"
            columns: ["methodology_phase_id"]
            isOneToOne: false
            referencedRelation: "methodology_phases"
            referencedColumns: ["id"]
          },
        ]
      }
      timeline_events: {
        Row: {
          client_id: string | null
          date: string | null
          description: string | null
          evidence_urls: string[] | null
          ia_status: string | null
          ia_summary: string | null
          id: string
          phase: Database["public"]["Enums"]["methodology_phase"] | null
          title: string
          type: string
        }
        Insert: {
          client_id?: string | null
          date?: string | null
          description?: string | null
          evidence_urls?: string[] | null
          ia_status?: string | null
          ia_summary?: string | null
          id?: string
          phase?: Database["public"]["Enums"]["methodology_phase"] | null
          title: string
          type: string
        }
        Update: {
          client_id?: string | null
          date?: string | null
          description?: string | null
          evidence_urls?: string[] | null
          ia_status?: string | null
          ia_summary?: string | null
          id?: string
          phase?: Database["public"]["Enums"]["methodology_phase"] | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "timeline_events_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_client_access_to_profile: {
        Args: { p_profile_id: string }
        Returns: boolean
      }
      check_consultant_client_access: {
        Args: { p_client_id: string }
        Returns: boolean
      }
      current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      current_user_status: { Args: never; Returns: string }
      is_admin: { Args: never; Returns: boolean }
      is_client: { Args: never; Returns: boolean }
      is_consultant: { Args: never; Returns: boolean }
      list_team_members: {
        Args: never
        Returns: {
          avatar_url: string
          city: string
          full_name: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          specialty: string
          state: string
          status: string
        }[]
      }
      seed_consultant_goals: { Args: { c_id: string }; Returns: undefined }
      seed_default_consultant_permissions: {
        Args: { p_consultant_id: string }
        Returns: undefined
      }
      sync_contract_module_meetings_manual: {
        Args: { phase_id: string }
        Returns: undefined
      }
    }
    Enums: {
      contract_status:
        | "ativo"
        | "em_onboarding"
        | "em_renovacao"
        | "renovado"
        | "bloqueado"
        | "suspenso"
        | "cancelado"
        | "churn"
        | "encerrado"
      methodology_phase:
        | "diagnostico"
        | "planejamento"
        | "estruturacao"
        | "monitoramento"
        | "encerramento"
      risk_level: "baixo" | "medio" | "alto" | "critico"
      task_status:
        | "a_fazer"
        | "em_andamento"
        | "impedida"
        | "concluida"
        | "atrasada"
      user_role: "admin" | "consultor" | "cliente"
      user_status: "active" | "inactive" | "pending"
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
      contract_status: [
        "ativo",
        "em_onboarding",
        "em_renovacao",
        "renovado",
        "bloqueado",
        "suspenso",
        "cancelado",
        "churn",
        "encerrado",
      ],
      methodology_phase: [
        "diagnostico",
        "planejamento",
        "estruturacao",
        "monitoramento",
        "encerramento",
      ],
      risk_level: ["baixo", "medio", "alto", "critico"],
      task_status: [
        "a_fazer",
        "em_andamento",
        "impedida",
        "concluida",
        "atrasada",
      ],
      user_role: ["admin", "consultor", "cliente"],
      user_status: ["active", "inactive", "pending"],
    },
  },
} as const
