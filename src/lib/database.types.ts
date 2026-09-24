// Hand-authored to match supabase/migrations/*.sql until
// `supabase gen types typescript` can regenerate this file from the live
// schema. Keep the two in sync in the meantime.

export type UserRole = "admin" | "sales" | "qa" | "operations";

export type SalesStage =
  | "New Lead"
  | "Contacted"
  | "Qualified"
  | "Sample"
  | "Quote Submitted"
  | "Customer Testing"
  | "Negotiation"
  | "Won"
  | "Lost";

export type LeadSource =
  | "Referral"
  | "Trade Show"
  | "Website Inquiry"
  | "Cold Outreach"
  | "Broker"
  | "Distributor Inquiry"
  | "Existing Customer"
  | "Social Media"
  | "Other";

export type CustomerType =
  | "Retail/Grocery"
  | "DTC/E-commerce"
  | "Wholesale/Foodservice"
  | "Distributor"
  | "Broker"
  | "Markets/Events"
  | "Other";

export type FreightTerms =
  | "FOB Origin"
  | "FOB Destination"
  | "Prepaid & Add"
  | "Prepaid (Free Freight)"
  | "Collect"
  | "Third Party";

export type SampleTrialStatus =
  | "Not Required"
  | "Requested"
  | "Sample Sent"
  | "In Trial"
  | "Trial Passed"
  | "Trial Failed"
  | "Approved";

export type PackSize =
  | "16 oz"
  | "32 oz"
  | "1 Gallon"
  | "2 Gallon"
  | "5 Gallon"
  | "Barrel"
  | "Tote"
  | "Other";

export type TaskStatus = "Open" | "In Progress" | "Done" | "Cancelled";
export type TaskPriority = "Low" | "Medium" | "High";
export type ActivityType =
  | "comment"
  | "stage_change"
  | "lead_created"
  | "checkin"
  | "customer_created";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          email: string | null;
          phone: string | null;
          role: UserRole;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          email?: string | null;
          phone?: string | null;
          role?: UserRole;
          is_active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          item_number: string;
          name: string;
          category: string;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          item_number: string;
          name: string;
          category?: string;
          is_active?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
        Relationships: [];
      };
      leads: {
        Row: {
          id: string;
          salesperson_id: string;
          company_name: string;
          primary_contact_name: string | null;
          contact_email: string | null;
          contact_phone: string | null;
          lead_date: string;
          lead_source: LeadSource | null;
          specific_source: string | null;
          customer_type: CustomerType | null;
          freight_terms: FreightTerms | null;
          ship_to_address: string | null;
          ship_to_city: string | null;
          ship_to_state: string | null;
          ship_to_zip: string | null;
          ship_to_country: string | null;
          distributor: string | null;
          broker_involved: boolean;
          broker_commission_pct: number | null;
          broker_name: string | null;
          broker_company: string | null;
          sample_required: boolean;
          sample_trial_status: SampleTrialStatus;
          current_supplier: string | null;
          reason_for_opportunity: string | null;
          expected_start_date: string | null;
          sales_stage: SalesStage;
          probability_to_close: number | null;
          next_action: string | null;
          next_follow_up_date: string | null;
          notes: string | null;
          lost_reason: string | null;
          converted_customer_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          salesperson_id: string;
          company_name: string;
          primary_contact_name?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          lead_date?: string;
          lead_source?: LeadSource | null;
          specific_source?: string | null;
          customer_type?: CustomerType | null;
          freight_terms?: FreightTerms | null;
          ship_to_address?: string | null;
          ship_to_city?: string | null;
          ship_to_state?: string | null;
          ship_to_zip?: string | null;
          ship_to_country?: string | null;
          distributor?: string | null;
          broker_involved?: boolean;
          broker_commission_pct?: number | null;
          broker_name?: string | null;
          broker_company?: string | null;
          sample_required?: boolean;
          sample_trial_status?: SampleTrialStatus;
          current_supplier?: string | null;
          reason_for_opportunity?: string | null;
          expected_start_date?: string | null;
          sales_stage?: SalesStage;
          probability_to_close?: number | null;
          next_action?: string | null;
          next_follow_up_date?: string | null;
          notes?: string | null;
          lost_reason?: string | null;
          converted_customer_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["leads"]["Insert"]>;
        Relationships: [];
      };
      lead_products: {
        Row: {
          id: string;
          lead_id: string;
          product_id: string | null;
          custom_product_name: string | null;
          custom_pack_size: string | null;
          custom_specs: string | null;
          pack_sizes: PackSize[];
          proposed_volume: number | null;
          volume_unit: string | null;
          estimated_annual_volume: number | null;
          estimated_annual_sales: number | null;
          target_price: number | null;
        };
        Insert: {
          id?: string;
          lead_id: string;
          product_id?: string | null;
          custom_product_name?: string | null;
          custom_pack_size?: string | null;
          custom_specs?: string | null;
          pack_sizes?: PackSize[];
          proposed_volume?: number | null;
          volume_unit?: string | null;
          estimated_annual_volume?: number | null;
          estimated_annual_sales?: number | null;
          target_price?: number | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["lead_products"]["Insert"]
        >;
        Relationships: [];
      };
      customers: {
        Row: {
          id: string;
          salesperson_id: string;
          company_name: string;
          primary_contact_name: string | null;
          contact_email: string | null;
          contact_phone: string | null;
          ship_to_locations: string | null;
          customer_type: CustomerType | null;
          distributor: string | null;
          notes: string | null;
          is_active: boolean;
          checkin_frequency_days: number;
          last_contact_date: string;
          next_action: string | null;
          next_checkin_date: string;
          sales_customer_code: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          salesperson_id: string;
          company_name: string;
          primary_contact_name?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          ship_to_locations?: string | null;
          customer_type?: CustomerType | null;
          distributor?: string | null;
          notes?: string | null;
          is_active?: boolean;
          checkin_frequency_days?: number;
          last_contact_date?: string;
          next_action?: string | null;
          next_checkin_date?: string;
          sales_customer_code?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["customers"]["Insert"]>;
        Relationships: [];
      };
      customer_products: {
        Row: {
          id: string;
          customer_id: string;
          product_id: string | null;
          custom_product_name: string | null;
          custom_specs: string | null;
        };
        Insert: {
          id?: string;
          customer_id: string;
          product_id?: string | null;
          custom_product_name?: string | null;
          custom_specs?: string | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["customer_products"]["Insert"]
        >;
        Relationships: [];
      };
      tasks: {
        Row: {
          id: string;
          lead_id: string | null;
          customer_id: string | null;
          title: string;
          description: string | null;
          assigned_to: string | null;
          created_by: string | null;
          status: TaskStatus;
          priority: TaskPriority;
          due_date: string | null;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          lead_id?: string | null;
          customer_id?: string | null;
          title: string;
          description?: string | null;
          assigned_to?: string | null;
          created_by?: string | null;
          status?: TaskStatus;
          priority?: TaskPriority;
          due_date?: string | null;
          completed_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["tasks"]["Insert"]>;
        Relationships: [];
      };
      activity: {
        Row: {
          id: string;
          lead_id: string | null;
          customer_id: string | null;
          author_id: string | null;
          activity_type: ActivityType;
          body: string | null;
          metadata: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          lead_id?: string | null;
          customer_id?: string | null;
          author_id?: string | null;
          activity_type?: ActivityType;
          body?: string | null;
          metadata?: Record<string, unknown> | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["activity"]["Insert"]>;
        Relationships: [];
      };
      sales_customers: {
        Row: {
          customer_code: string;
          customer_name: string;
        };
        Insert: {
          customer_code: string;
          customer_name: string;
        };
        Update: Partial<Database["public"]["Tables"]["sales_customers"]["Insert"]>;
        Relationships: [];
      };
      sales_invoices: {
        Row: {
          id: string;
          customer_code: string;
          invoice_number: string;
          invoice_date: string;
          sale_type: string;
          salesperson_code: string | null;
          salesperson_name: string | null;
          total: number;
          source_file: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          customer_code: string;
          invoice_number: string;
          invoice_date: string;
          sale_type: string;
          salesperson_code?: string | null;
          salesperson_name?: string | null;
          total: number;
          source_file?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["sales_invoices"]["Insert"]>;
        Relationships: [];
      };
      sales_invoice_items: {
        Row: {
          id: string;
          invoice_id: string;
          product_code: string;
          description: string;
          qty: number;
          uom: string | null;
          price: number | null;
          extension: number;
        };
        Insert: {
          id?: string;
          invoice_id: string;
          product_code: string;
          description: string;
          qty: number;
          uom?: string | null;
          price?: number | null;
          extension: number;
        };
        Update: Partial<Database["public"]["Tables"]["sales_invoice_items"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: {
      sales_customer_totals: {
        Row: {
          customer_code: string;
          customer_name: string;
          invoice_count: number;
          total_sales: number;
          first_invoice_date: string | null;
          last_invoice_date: string | null;
        };
        Relationships: [];
      };
      sales_customer_salesperson_totals: {
        Row: {
          customer_code: string;
          customer_name: string;
          salesperson_code: string | null;
          salesperson_name: string | null;
          invoice_count: number;
          total_sales: number;
          first_invoice_date: string | null;
          last_invoice_date: string | null;
        };
        Relationships: [];
      };
      sales_customer_products: {
        Row: {
          customer_code: string;
          product_code: string;
          description: string;
          total_qty: number;
          total_extension: number;
          invoice_count: number;
        };
        Relationships: [];
      };
      leads_with_totals: {
        Row: Database["public"]["Tables"]["leads"]["Row"] & {
          estimated_annual_sales: number;
        };
        Relationships: [];
      };
      dashboard_leads_by_salesperson: {
        Row: {
          salesperson_id: string;
          full_name: string | null;
          total_leads: number;
          open_leads: number;
          open_estimated_annual_sales: number;
        };
        Relationships: [];
      };
      dashboard_pipeline_summary: {
        Row: {
          open_leads: number;
          total_estimated_annual_sales: number;
          weighted_pipeline: number;
        };
        Relationships: [];
      };
      dashboard_overdue_followups: {
        Row: Database["public"]["Views"]["leads_with_totals"]["Row"] & {
          salesperson_name: string | null;
        };
        Relationships: [];
      };
      dashboard_samples_outstanding: {
        Row: Database["public"]["Views"]["leads_with_totals"]["Row"] & {
          salesperson_name: string | null;
        };
        Relationships: [];
      };
      dashboard_quotes_outstanding: {
        Row: Database["public"]["Views"]["leads_with_totals"]["Row"] & {
          salesperson_name: string | null;
        };
        Relationships: [];
      };
      dashboard_won_sales: {
        Row: {
          month: string;
          won_count: number;
          won_sales: number;
        };
        Relationships: [];
      };
      dashboard_overdue_checkins: {
        Row: Database["public"]["Tables"]["customers"]["Row"] & {
          salesperson_name: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      admin_set_role: {
        Args: { target_user_id: string; new_role: UserRole };
        Returns: undefined;
      };
      admin_set_active: {
        Args: { target_user_id: string; new_is_active: boolean };
        Returns: undefined;
      };
    };
  };
}
