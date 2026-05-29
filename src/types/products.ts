export interface Product {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  category?: string;
  service_track_position?: number;
  status: 'ativo' | 'inativo';
  consultant_hours?: number;
  silvane_hours?: number;
  created_at?: string;
  updated_at?: string;
}

export interface MethodologyPlan {
  id: string;
  product_id: string;
  name: string;
  description?: string;
  objective?: string;
  status: string;
  order_index: number;
}

export interface MethodologyPhase {
  id: string;
  methodology_plan_id: string;
  name: string;
  subtitle?: string;
  description?: string;
  objective?: string;
  strategic_name?: string;
  result_summary?: string;
  order_index: number;
  status: string;
}

export interface MethodologyModule {
  id: string;
  phase_id: string;
  name: string;
  description?: string;
  objective?: string;
  responsible_role?: string;
  estimated_hours?: number;
  estimated_meetings?: number;
  order_index: number;
  status: string;
}

export interface MethodologyMeeting {
  id: string;
  module_id: string;
  meeting_number?: number;
  title: string;
  area?: string;
  theme?: string;
  objective?: string;
  what_is_structured?: string;
  duration_meeting?: number;
  duration_development?: number;
  order_index: number;
  status: string;
}

export interface MethodologyDeliverable {
  id: string;
  meeting_id: string;
  title: string;
  description?: string;
  type?: string;
  is_required: boolean;
  order_index: number;
}
