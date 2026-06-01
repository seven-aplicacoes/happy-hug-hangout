-- Update foreign key constraints for contracts and related tables to use ON DELETE CASCADE

-- meetings
ALTER TABLE public.meetings DROP CONSTRAINT IF EXISTS meetings_contract_id_fkey;
ALTER TABLE public.meetings ADD CONSTRAINT meetings_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON DELETE CASCADE;

ALTER TABLE public.meetings DROP CONSTRAINT IF EXISTS meetings_contract_product_id_fkey;
ALTER TABLE public.meetings ADD CONSTRAINT meetings_contract_product_id_fkey FOREIGN KEY (contract_product_id) REFERENCES public.contract_products(id) ON DELETE CASCADE;

-- tasks
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_contract_id_fkey;
ALTER TABLE public.tasks ADD CONSTRAINT tasks_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON DELETE CASCADE;

ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_contract_product_id_fkey;
ALTER TABLE public.tasks ADD CONSTRAINT tasks_contract_product_id_fkey FOREIGN KEY (contract_product_id) REFERENCES public.contract_products(id) ON DELETE CASCADE;

-- legacy_projects
ALTER TABLE public.legacy_projects DROP CONSTRAINT IF EXISTS projects_contract_id_fkey;
ALTER TABLE public.legacy_projects ADD CONSTRAINT projects_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON DELETE CASCADE;

-- meeting_scheduling_events
ALTER TABLE public.meeting_scheduling_events DROP CONSTRAINT IF EXISTS meeting_scheduling_events_contract_id_fkey;
ALTER TABLE public.meeting_scheduling_events ADD CONSTRAINT meeting_scheduling_events_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON DELETE CASCADE;

-- meeting_csat_responses
ALTER TABLE public.meeting_csat_responses DROP CONSTRAINT IF EXISTS meeting_csat_responses_contract_id_fkey;
ALTER TABLE public.meeting_csat_responses ADD CONSTRAINT meeting_csat_responses_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON DELETE CASCADE;

-- client_products
ALTER TABLE public.client_products DROP CONSTRAINT IF EXISTS client_products_contract_id_fkey;
ALTER TABLE public.client_products ADD CONSTRAINT client_products_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON DELETE CASCADE;

-- contract_products
ALTER TABLE public.contract_products DROP CONSTRAINT IF EXISTS contract_products_contract_id_fkey;
ALTER TABLE public.contract_products ADD CONSTRAINT contract_products_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON DELETE CASCADE;

-- documents
ALTER TABLE public.documents DROP CONSTRAINT IF EXISTS documents_contract_id_fkey;
ALTER TABLE public.documents ADD CONSTRAINT documents_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON DELETE CASCADE;

ALTER TABLE public.documents DROP CONSTRAINT IF EXISTS documents_contract_product_id_fkey;
ALTER TABLE public.documents ADD CONSTRAINT documents_contract_product_id_fkey FOREIGN KEY (contract_product_id) REFERENCES public.contract_products(id) ON DELETE CASCADE;

-- consultant_availability
ALTER TABLE public.consultant_availability DROP CONSTRAINT IF EXISTS consultant_availability_contract_id_fkey;
ALTER TABLE public.consultant_availability ADD CONSTRAINT consultant_availability_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON DELETE CASCADE;

ALTER TABLE public.consultant_availability DROP CONSTRAINT IF EXISTS consultant_availability_contract_product_id_fkey;
ALTER TABLE public.consultant_availability ADD CONSTRAINT consultant_availability_contract_product_id_fkey FOREIGN KEY (contract_product_id) REFERENCES public.contract_products(id) ON DELETE CASCADE;

-- consultant_available_slots
ALTER TABLE public.consultant_available_slots DROP CONSTRAINT IF EXISTS consultant_available_slots_contract_id_fkey;
ALTER TABLE public.consultant_available_slots ADD CONSTRAINT consultant_available_slots_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON DELETE CASCADE;

ALTER TABLE public.consultant_available_slots DROP CONSTRAINT IF EXISTS consultant_available_slots_contract_product_id_fkey;
ALTER TABLE public.consultant_available_slots ADD CONSTRAINT consultant_available_slots_contract_product_id_fkey FOREIGN KEY (contract_product_id) REFERENCES public.contract_products(id) ON DELETE CASCADE;

-- contract_module_meetings
ALTER TABLE public.contract_module_meetings DROP CONSTRAINT IF EXISTS contract_module_meetings_contract_id_fkey;
ALTER TABLE public.contract_module_meetings ADD CONSTRAINT contract_module_meetings_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON DELETE CASCADE;

ALTER TABLE public.contract_module_meetings DROP CONSTRAINT IF EXISTS contract_module_meetings_contract_product_id_fkey;
ALTER TABLE public.contract_module_meetings ADD CONSTRAINT contract_module_meetings_contract_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.contract_products(id) ON DELETE CASCADE;

-- contract_module_documents
ALTER TABLE public.contract_module_documents DROP CONSTRAINT IF EXISTS contract_module_documents_contract_id_fkey;
ALTER TABLE public.contract_module_documents ADD CONSTRAINT contract_module_documents_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON DELETE CASCADE;

ALTER TABLE public.contract_module_documents DROP CONSTRAINT IF EXISTS contract_module_documents_product_id_fkey;
ALTER TABLE public.contract_module_documents ADD CONSTRAINT contract_module_documents_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.contract_products(id) ON DELETE CASCADE;

-- meeting_csat
ALTER TABLE public.meeting_csat DROP CONSTRAINT IF EXISTS meeting_csat_contract_id_fkey;
ALTER TABLE public.meeting_csat ADD CONSTRAINT meeting_csat_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON DELETE CASCADE;

ALTER TABLE public.meeting_csat DROP CONSTRAINT IF EXISTS meeting_csat_contract_product_id_fkey;
ALTER TABLE public.meeting_csat ADD CONSTRAINT meeting_csat_contract_product_id_fkey FOREIGN KEY (contract_product_id) REFERENCES public.contract_products(id) ON DELETE CASCADE;

-- contract_product_phase_consultants
ALTER TABLE public.contract_product_phase_consultants DROP CONSTRAINT IF EXISTS contract_product_phase_consultants_contract_product_id_fkey;
ALTER TABLE public.contract_product_phase_consultants ADD CONSTRAINT contract_product_phase_consultants_contract_product_id_fkey FOREIGN KEY (contract_product_id) REFERENCES public.contract_products(id) ON DELETE CASCADE;

-- contract_product_phases
ALTER TABLE public.contract_product_phases DROP CONSTRAINT IF EXISTS contract_product_phases_contract_product_id_fkey;
ALTER TABLE public.contract_product_phases ADD CONSTRAINT contract_product_phases_contract_product_id_fkey FOREIGN KEY (contract_product_id) REFERENCES public.contract_products(id) ON DELETE CASCADE;

-- Methodology
ALTER TABLE public.contract_methodology_phases DROP CONSTRAINT IF EXISTS contract_methodology_phases_contract_id_fkey;
ALTER TABLE public.contract_methodology_phases ADD CONSTRAINT contract_methodology_phases_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON DELETE CASCADE;

ALTER TABLE public.contract_methodology_modules DROP CONSTRAINT IF EXISTS contract_methodology_modules_contract_phase_id_fkey;
ALTER TABLE public.contract_methodology_modules ADD CONSTRAINT contract_methodology_modules_contract_phase_id_fkey FOREIGN KEY (contract_phase_id) REFERENCES public.contract_methodology_phases(id) ON DELETE CASCADE;

ALTER TABLE public.contract_methodology_meetings DROP CONSTRAINT IF EXISTS contract_methodology_meetings_contract_module_id_fkey;
ALTER TABLE public.contract_methodology_meetings ADD CONSTRAINT contract_methodology_meetings_contract_module_id_fkey FOREIGN KEY (contract_module_id) REFERENCES public.contract_methodology_modules(id) ON DELETE CASCADE;

ALTER TABLE public.contract_methodology_deliverables DROP CONSTRAINT IF EXISTS contract_methodology_deliverables_contract_meeting_id_fkey;
ALTER TABLE public.contract_methodology_deliverables ADD CONSTRAINT contract_methodology_deliverables_contract_meeting_id_fkey FOREIGN KEY (contract_meeting_id) REFERENCES public.contract_methodology_meetings(id) ON DELETE CASCADE;
