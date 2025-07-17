export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      adhesive_coating: {
        Row: {
          created_at: string | null
          deckle: number
          id: string
          item_code: string
          item_name: string
          length: number
          status_adhesive: string
          substrate_gsm: number
          substrate_name: string
          uiorn: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          deckle: number
          id?: string
          item_code: string
          item_name: string
          length: number
          status_adhesive: string
          substrate_gsm: number
          substrate_name: string
          uiorn: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          deckle?: number
          id?: string
          item_code?: string
          item_name?: string
          length?: number
          status_adhesive?: string
          substrate_gsm?: number
          substrate_name?: string
          uiorn?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "adhesive_coating_uiorn_fkey"
            columns: ["uiorn"]
            isOneToOne: false
            referencedRelation: "eligible_adhesive_coating_uiorns"
            referencedColumns: ["uiorn"]
          },
          {
            foreignKeyName: "adhesive_coating_uiorn_fkey"
            columns: ["uiorn"]
            isOneToOne: false
            referencedRelation: "eligible_lamination_uiorns"
            referencedColumns: ["uiorn"]
          },
          {
            foreignKeyName: "adhesive_coating_uiorn_fkey"
            columns: ["uiorn"]
            isOneToOne: false
            referencedRelation: "eligible_slitting_uiorns"
            referencedColumns: ["uiorn"]
          },
          {
            foreignKeyName: "adhesive_coating_uiorn_fkey"
            columns: ["uiorn"]
            isOneToOne: false
            referencedRelation: "order_punching"
            referencedColumns: ["uiorn"]
          },
        ]
      }
      artwork_upload: {
        Row: {
          ai_prompt: string | null
          artwork_file: string | null
          artwork_notes: string | null
          brand_sku_ref: string | null
          created_at: string | null
          dieline_spec: string | null
          id: string
        }
        Insert: {
          ai_prompt?: string | null
          artwork_file?: string | null
          artwork_notes?: string | null
          brand_sku_ref?: string | null
          created_at?: string | null
          dieline_spec?: string | null
          id?: string
        }
        Update: {
          ai_prompt?: string | null
          artwork_file?: string | null
          artwork_notes?: string | null
          brand_sku_ref?: string | null
          created_at?: string | null
          dieline_spec?: string | null
          id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          category_name: string
          created_at: string
          description: string | null
          id: string
          updated_at: string
        }
        Insert: {
          category_name: string
          created_at?: string
          description?: string | null
          id?: string
          updated_at?: string
        }
        Update: {
          category_name?: string
          created_at?: string
          description?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      cost_mockup_estimate: {
        Row: {
          brand_sku_ref: string | null
          cost_per_kg: number | null
          cost_per_sqm: number | null
          created_at: string | null
          estimated_area_sqcm: number | null
          estimated_weight_gsm: number | null
          id: string
          mockup_file: string | null
          mockup_type: string | null
          notes: string | null
          roll_width_mm: number | null
          total_cost_estimate: number | null
          unit_yield_sq_m_per_kg: number | null
        }
        Insert: {
          brand_sku_ref?: string | null
          cost_per_kg?: number | null
          cost_per_sqm?: number | null
          created_at?: string | null
          estimated_area_sqcm?: number | null
          estimated_weight_gsm?: number | null
          id?: string
          mockup_file?: string | null
          mockup_type?: string | null
          notes?: string | null
          roll_width_mm?: number | null
          total_cost_estimate?: number | null
          unit_yield_sq_m_per_kg?: number | null
        }
        Update: {
          brand_sku_ref?: string | null
          cost_per_kg?: number | null
          cost_per_sqm?: number | null
          created_at?: string | null
          estimated_area_sqcm?: number | null
          estimated_weight_gsm?: number | null
          id?: string
          mockup_file?: string | null
          mockup_type?: string | null
          notes?: string | null
          roll_width_mm?: number | null
          total_cost_estimate?: number | null
          unit_yield_sq_m_per_kg?: number | null
        }
        Relationships: []
      }
      csv_upload_log: {
        Row: {
          created_at: string | null
          error_rows: number
          errors: Json | null
          file_name: string
          file_type: string
          id: string
          success_rows: number
          total_rows: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          error_rows: number
          errors?: Json | null
          file_name: string
          file_type: string
          id?: string
          success_rows: number
          total_rows: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          error_rows?: number
          errors?: Json | null
          file_name?: string
          file_type?: string
          id?: string
          success_rows?: number
          total_rows?: number
          user_id?: string
        }
        Relationships: []
      }
      daily_stock_snapshots: {
        Row: {
          created_at: string
          id: string
          metadata: Json | null
          record_count: number
          snapshot_data: Json
          snapshot_date: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json | null
          record_count?: number
          snapshot_data: Json
          snapshot_date: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json | null
          record_count?: number
          snapshot_data?: Json
          snapshot_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      dkegl_adhesive_coating: {
        Row: {
          created_at: string | null
          deckle: number
          id: string
          item_code: string
          item_name: string
          length: number
          status_adhesive: string
          substrate_gsm: number
          substrate_name: string
          uiorn: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          deckle: number
          id?: string
          item_code: string
          item_name: string
          length: number
          status_adhesive: string
          substrate_gsm: number
          substrate_name: string
          uiorn: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          deckle?: number
          id?: string
          item_code?: string
          item_name?: string
          length?: number
          status_adhesive?: string
          substrate_gsm?: number
          substrate_name?: string
          uiorn?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      dkegl_eligible_adhesive_coating_uiorns: {
        Row: {
          deckle: number | null
          item_code: string | null
          item_name: string | null
          length: number | null
          substrate_gsm: number | null
          substrate_name: string | null
          uiorn: string | null
        }
        Insert: {
          deckle?: number | null
          item_code?: string | null
          item_name?: string | null
          length?: number | null
          substrate_gsm?: number | null
          substrate_name?: string | null
          uiorn?: string | null
        }
        Update: {
          deckle?: number | null
          item_code?: string | null
          item_name?: string | null
          length?: number | null
          substrate_gsm?: number | null
          substrate_name?: string | null
          uiorn?: string | null
        }
        Relationships: []
      }
      dkegl_eligible_lamination_uiorns: {
        Row: {
          item_name: string | null
          uiorn: string | null
        }
        Insert: {
          item_name?: string | null
          uiorn?: string | null
        }
        Update: {
          item_name?: string | null
          uiorn?: string | null
        }
        Relationships: []
      }
      dkegl_eligible_slitting_uiorns: {
        Row: {
          deckle: number | null
          item_code: string | null
          item_name: string | null
          length: number | null
          substrate_gsm: number | null
          substrate_name: string | null
          uiorn: string | null
        }
        Insert: {
          deckle?: number | null
          item_code?: string | null
          item_name?: string | null
          length?: number | null
          substrate_gsm?: number | null
          substrate_name?: string | null
          uiorn?: string | null
        }
        Update: {
          deckle?: number | null
          item_code?: string | null
          item_name?: string | null
          length?: number | null
          substrate_gsm?: number | null
          substrate_name?: string | null
          uiorn?: string | null
        }
        Relationships: []
      }
      dkegl_gravure_printing: {
        Row: {
          created_at: string | null
          deckle: number | null
          id: string
          item_code: string | null
          item_name: string | null
          length: number | null
          status_gravure: string
          substrate_gsm: number | null
          substrate_name: string | null
          uiorn: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          deckle?: number | null
          id?: string
          item_code?: string | null
          item_name?: string | null
          length?: number | null
          status_gravure: string
          substrate_gsm?: number | null
          substrate_name?: string | null
          uiorn: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          deckle?: number | null
          id?: string
          item_code?: string | null
          item_name?: string | null
          length?: number | null
          status_gravure?: string
          substrate_gsm?: number | null
          substrate_name?: string | null
          uiorn?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      dkegl_lamination: {
        Row: {
          created_at: string | null
          deckle: number | null
          id: string
          item_code: string | null
          item_name: string | null
          length: number | null
          status_lamination: string
          substrate_gsm: number | null
          substrate_name: string | null
          uiorn: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          deckle?: number | null
          id?: string
          item_code?: string | null
          item_name?: string | null
          length?: number | null
          status_lamination: string
          substrate_gsm?: number | null
          substrate_name?: string | null
          uiorn: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          deckle?: number | null
          id?: string
          item_code?: string | null
          item_name?: string | null
          length?: number | null
          status_lamination?: string
          substrate_gsm?: number | null
          substrate_name?: string | null
          uiorn?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      dkegl_master_data: {
        Row: {
          "Coil_Width (mm)": number | null
          "Deckle (mm)": string | null
          gsm: string | null
          item_code: string
          item_name: string | null
          party_name: string | null
          product_category: string | null
          specs: string | null
          substrate: string | null
          thickness: string | null
          "Total GSM": number | null
        }
        Insert: {
          "Coil_Width (mm)"?: number | null
          "Deckle (mm)"?: string | null
          gsm?: string | null
          item_code: string
          item_name?: string | null
          party_name?: string | null
          product_category?: string | null
          specs?: string | null
          substrate?: string | null
          thickness?: string | null
          "Total GSM"?: number | null
        }
        Update: {
          "Coil_Width (mm)"?: number | null
          "Deckle (mm)"?: string | null
          gsm?: string | null
          item_code?: string
          item_name?: string | null
          party_name?: string | null
          product_category?: string | null
          specs?: string | null
          substrate?: string | null
          thickness?: string | null
          "Total GSM"?: number | null
        }
        Relationships: []
      }
      dkegl_slitting: {
        Row: {
          created_at: string | null
          deckle: number
          id: string
          item_code: string
          item_name: string
          length: number
          status_slitting: string
          substrate_gsm: number
          substrate_name: string
          uiorn: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          deckle: number
          id?: string
          item_code: string
          item_name: string
          length: number
          status_slitting: string
          substrate_gsm: number
          substrate_name: string
          uiorn: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          deckle?: number
          id?: string
          item_code?: string
          item_name?: string
          length?: number
          status_slitting?: string
          substrate_gsm?: number
          substrate_name?: string
          uiorn?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      dkegl_tape_orders: {
        Row: {
          created_at: string | null
          deckle: number
          id: string
          item_code: string
          item_name: string
          job_no: number
          length: number
          number_colours: number
          order_entry_date: string
          sr_no: number
          status: string | null
          substrate_gsm: number
          substrate_name: string
          uiorn: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          deckle: number
          id?: string
          item_code: string
          item_name: string
          job_no: number
          length: number
          number_colours: number
          order_entry_date: string
          sr_no: number
          status?: string | null
          substrate_gsm: number
          substrate_name: string
          uiorn: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          deckle?: number
          id?: string
          item_code?: string
          item_name?: string
          job_no?: number
          length?: number
          number_colours?: number
          order_entry_date?: string
          sr_no?: number
          status?: string | null
          substrate_gsm?: number
          substrate_name?: string
          uiorn?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      gravure_printing: {
        Row: {
          created_at: string | null
          deckle: number | null
          id: string
          item_code: string | null
          item_name: string | null
          length: number | null
          status_gravure: string
          substrate_gsm: number | null
          substrate_name: string | null
          uiorn: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          deckle?: number | null
          id?: string
          item_code?: string | null
          item_name?: string | null
          length?: number | null
          status_gravure: string
          substrate_gsm?: number | null
          substrate_name?: string | null
          uiorn: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          deckle?: number | null
          id?: string
          item_code?: string | null
          item_name?: string | null
          length?: number | null
          status_gravure?: string
          substrate_gsm?: number | null
          substrate_name?: string | null
          uiorn?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gravure_printing_uiorn_fkey"
            columns: ["uiorn"]
            isOneToOne: true
            referencedRelation: "eligible_adhesive_coating_uiorns"
            referencedColumns: ["uiorn"]
          },
          {
            foreignKeyName: "gravure_printing_uiorn_fkey"
            columns: ["uiorn"]
            isOneToOne: true
            referencedRelation: "eligible_lamination_uiorns"
            referencedColumns: ["uiorn"]
          },
          {
            foreignKeyName: "gravure_printing_uiorn_fkey"
            columns: ["uiorn"]
            isOneToOne: true
            referencedRelation: "eligible_slitting_uiorns"
            referencedColumns: ["uiorn"]
          },
          {
            foreignKeyName: "gravure_printing_uiorn_fkey"
            columns: ["uiorn"]
            isOneToOne: true
            referencedRelation: "order_punching"
            referencedColumns: ["uiorn"]
          },
        ]
      }
      grn_audit_log: {
        Row: {
          action: string
          created_at: string | null
          grn_id: string
          id: string
          new_values: Json | null
          old_values: Json | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          grn_id: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          grn_id?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "grn_audit_log_grn_id_fkey"
            columns: ["grn_id"]
            isOneToOne: false
            referencedRelation: "grn_log"
            referencedColumns: ["id"]
          },
        ]
      }
      grn_log: {
        Row: {
          amount_inr: number | null
          created_at: string
          date: string
          grn_number: string
          id: string
          invoice_number: string | null
          item_code: string
          qty_received: number
          remarks: string | null
          uom: string
          vendor: string | null
        }
        Insert: {
          amount_inr?: number | null
          created_at?: string
          date?: string
          grn_number: string
          id?: string
          invoice_number?: string | null
          item_code: string
          qty_received: number
          remarks?: string | null
          uom: string
          vendor?: string | null
        }
        Update: {
          amount_inr?: number | null
          created_at?: string
          date?: string
          grn_number?: string
          id?: string
          invoice_number?: string | null
          item_code?: string
          qty_received?: number
          remarks?: string | null
          uom?: string
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "grn_log_item_code_fkey"
            columns: ["item_code"]
            isOneToOne: false
            referencedRelation: "item_master"
            referencedColumns: ["item_code"]
          },
        ]
      }
      issue_audit_log: {
        Row: {
          action: string
          created_at: string | null
          id: string
          issue_id: string
          new_values: Json | null
          old_values: Json | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          issue_id: string
          new_values?: Json | null
          old_values?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          issue_id?: string
          new_values?: Json | null
          old_values?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "issue_audit_log_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issue_log"
            referencedColumns: ["id"]
          },
        ]
      }
      issue_log: {
        Row: {
          created_at: string
          date: string
          id: string
          item_code: string
          purpose: string | null
          qty_issued: number
          remarks: string | null
          total_issued_qty: number | null
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          item_code: string
          purpose?: string | null
          qty_issued: number
          remarks?: string | null
          total_issued_qty?: number | null
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          item_code?: string
          purpose?: string | null
          qty_issued?: number
          remarks?: string | null
          total_issued_qty?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "issue_log_item_code_fkey"
            columns: ["item_code"]
            isOneToOne: false
            referencedRelation: "item_master"
            referencedColumns: ["item_code"]
          },
        ]
      }
      item_master: {
        Row: {
          auto_code: string | null
          category_id: string | null
          created_at: string
          gsm: number | null
          id: string
          item_code: string
          item_name: string
          qualifier: string | null
          size_mm: string | null
          status: string
          uom: string
          updated_at: string
          usage_type: string | null
        }
        Insert: {
          auto_code?: string | null
          category_id?: string | null
          created_at?: string
          gsm?: number | null
          id?: string
          item_code: string
          item_name: string
          qualifier?: string | null
          size_mm?: string | null
          status?: string
          uom?: string
          updated_at?: string
          usage_type?: string | null
        }
        Update: {
          auto_code?: string | null
          category_id?: string | null
          created_at?: string
          gsm?: number | null
          id?: string
          item_code?: string
          item_name?: string
          qualifier?: string | null
          size_mm?: string | null
          status?: string
          uom?: string
          updated_at?: string
          usage_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "item_master_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      lamination: {
        Row: {
          created_at: string | null
          deckle: number | null
          id: string
          item_code: string | null
          item_name: string | null
          length: number | null
          status_lamination: string
          substrate_gsm: number | null
          substrate_name: string | null
          uiorn: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          deckle?: number | null
          id?: string
          item_code?: string | null
          item_name?: string | null
          length?: number | null
          status_lamination: string
          substrate_gsm?: number | null
          substrate_name?: string | null
          uiorn: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          deckle?: number | null
          id?: string
          item_code?: string | null
          item_name?: string | null
          length?: number | null
          status_lamination?: string
          substrate_gsm?: number | null
          substrate_name?: string | null
          uiorn?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lamination_uiorn_fkey"
            columns: ["uiorn"]
            isOneToOne: false
            referencedRelation: "eligible_adhesive_coating_uiorns"
            referencedColumns: ["uiorn"]
          },
          {
            foreignKeyName: "lamination_uiorn_fkey"
            columns: ["uiorn"]
            isOneToOne: false
            referencedRelation: "eligible_lamination_uiorns"
            referencedColumns: ["uiorn"]
          },
          {
            foreignKeyName: "lamination_uiorn_fkey"
            columns: ["uiorn"]
            isOneToOne: false
            referencedRelation: "eligible_slitting_uiorns"
            referencedColumns: ["uiorn"]
          },
          {
            foreignKeyName: "lamination_uiorn_fkey"
            columns: ["uiorn"]
            isOneToOne: false
            referencedRelation: "order_punching"
            referencedColumns: ["uiorn"]
          },
        ]
      }
      Master_Data: {
        Row: {
          "Coil_Width (mm)": number | null
          "Deckle (mm)": string | null
          GSM: string | null
          Item_Code: string
          Item_Name: string | null
          Party_Name: string | null
          Product_Category: string | null
          Specs: string | null
          Substrate: string | null
          Thickness: string | null
          "Total GSM": number | null
        }
        Insert: {
          "Coil_Width (mm)"?: number | null
          "Deckle (mm)"?: string | null
          GSM?: string | null
          Item_Code: string
          Item_Name?: string | null
          Party_Name?: string | null
          Product_Category?: string | null
          Specs?: string | null
          Substrate?: string | null
          Thickness?: string | null
          "Total GSM"?: number | null
        }
        Update: {
          "Coil_Width (mm)"?: number | null
          "Deckle (mm)"?: string | null
          GSM?: string | null
          Item_Code?: string
          Item_Name?: string | null
          Party_Name?: string | null
          Product_Category?: string | null
          Specs?: string | null
          Substrate?: string | null
          Thickness?: string | null
          "Total GSM"?: number | null
        }
        Relationships: []
      }
      material_selection: {
        Row: {
          barrier_material: string | null
          brand_sku_ref: string | null
          coating_type: string | null
          created_at: string | null
          gsm_estimate: number | null
          id: string
          ink_system: string | null
          micron_total: number | null
          notes: string | null
          packaging_ref: string | null
          print_surface: string | null
          recyclability: string | null
          sealing_layer: string | null
          substrate_structure: string | null
          total_layers: number | null
        }
        Insert: {
          barrier_material?: string | null
          brand_sku_ref?: string | null
          coating_type?: string | null
          created_at?: string | null
          gsm_estimate?: number | null
          id?: string
          ink_system?: string | null
          micron_total?: number | null
          notes?: string | null
          packaging_ref?: string | null
          print_surface?: string | null
          recyclability?: string | null
          sealing_layer?: string | null
          substrate_structure?: string | null
          total_layers?: number | null
        }
        Update: {
          barrier_material?: string | null
          brand_sku_ref?: string | null
          coating_type?: string | null
          created_at?: string | null
          gsm_estimate?: number | null
          id?: string
          ink_system?: string | null
          micron_total?: number | null
          notes?: string | null
          packaging_ref?: string | null
          print_surface?: string | null
          recyclability?: string | null
          sealing_layer?: string | null
          substrate_structure?: string | null
          total_layers?: number | null
        }
        Relationships: []
      }
      order_punching: {
        Row: {
          created_at: string | null
          deckle: number
          item_code: string
          item_name: string
          job_no: number
          length: number
          number_colours: number
          order_entry_date: string
          sr_no: number
          status: string | null
          substrate_gsm: number
          substrate_name: string
          uiorn: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          deckle: number
          item_code: string
          item_name: string
          job_no: number
          length: number
          number_colours: number
          order_entry_date: string
          sr_no: number
          status?: string | null
          substrate_gsm: number
          substrate_name: string
          uiorn: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          deckle?: number
          item_code?: string
          item_name?: string
          job_no?: number
          length?: number
          number_colours?: number
          order_entry_date?: string
          sr_no?: number
          status?: string | null
          substrate_gsm?: number
          substrate_name?: string
          uiorn?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      packaging_projects: {
        Row: {
          add_on_features: Json | null
          artwork_design: Json | null
          brand_info: Json | null
          cost_estimate: Json | null
          created_at: string | null
          id: string
          material_selection: Json | null
          packaging_type: Json | null
          project_name: string | null
          project_notes: string | null
          sku_code: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          add_on_features?: Json | null
          artwork_design?: Json | null
          brand_info?: Json | null
          cost_estimate?: Json | null
          created_at?: string | null
          id?: string
          material_selection?: Json | null
          packaging_type?: Json | null
          project_name?: string | null
          project_notes?: string | null
          sku_code?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          add_on_features?: Json | null
          artwork_design?: Json | null
          brand_info?: Json | null
          cost_estimate?: Json | null
          created_at?: string | null
          id?: string
          material_selection?: Json | null
          packaging_type?: Json | null
          project_name?: string | null
          project_notes?: string | null
          sku_code?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      packaging_selection: {
        Row: {
          adhesive_notes: string | null
          adhesive_type: string | null
          barrier_layer: string | null
          brand_sku_ref: string | null
          coating_type: string | null
          container_stl: string | null
          container_type: string | null
          created_at: string | null
          gusset_type: string | null
          has_spout: boolean | null
          has_valve: boolean | null
          has_zipper: boolean | null
          id: string
          ink_notes: string | null
          label_cut_length: number | null
          length_mm: number | null
          micron_thickness: number | null
          other_type_note: string | null
          pre_deform_artwork: boolean | null
          primary_type: string | null
          print_method: string | null
          roll_width_mm: number | null
          sealing_layer: string | null
          shrink_md_percent: number | null
          shrink_td_percent: number | null
          sleeve_width: number | null
          substrate: string | null
          subtype: string | null
          tube_barrier: string | null
          tube_diameter: number | null
          tube_length: number | null
          width_mm: number | null
        }
        Insert: {
          adhesive_notes?: string | null
          adhesive_type?: string | null
          barrier_layer?: string | null
          brand_sku_ref?: string | null
          coating_type?: string | null
          container_stl?: string | null
          container_type?: string | null
          created_at?: string | null
          gusset_type?: string | null
          has_spout?: boolean | null
          has_valve?: boolean | null
          has_zipper?: boolean | null
          id?: string
          ink_notes?: string | null
          label_cut_length?: number | null
          length_mm?: number | null
          micron_thickness?: number | null
          other_type_note?: string | null
          pre_deform_artwork?: boolean | null
          primary_type?: string | null
          print_method?: string | null
          roll_width_mm?: number | null
          sealing_layer?: string | null
          shrink_md_percent?: number | null
          shrink_td_percent?: number | null
          sleeve_width?: number | null
          substrate?: string | null
          subtype?: string | null
          tube_barrier?: string | null
          tube_diameter?: number | null
          tube_length?: number | null
          width_mm?: number | null
        }
        Update: {
          adhesive_notes?: string | null
          adhesive_type?: string | null
          barrier_layer?: string | null
          brand_sku_ref?: string | null
          coating_type?: string | null
          container_stl?: string | null
          container_type?: string | null
          created_at?: string | null
          gusset_type?: string | null
          has_spout?: boolean | null
          has_valve?: boolean | null
          has_zipper?: boolean | null
          id?: string
          ink_notes?: string | null
          label_cut_length?: number | null
          length_mm?: number | null
          micron_thickness?: number | null
          other_type_note?: string | null
          pre_deform_artwork?: boolean | null
          primary_type?: string | null
          print_method?: string | null
          roll_width_mm?: number | null
          sealing_layer?: string | null
          shrink_md_percent?: number | null
          shrink_td_percent?: number | null
          sleeve_width?: number | null
          substrate?: string | null
          subtype?: string | null
          tube_barrier?: string | null
          tube_diameter?: number | null
          tube_length?: number | null
          width_mm?: number | null
        }
        Relationships: []
      }
      po_logs: {
        Row: {
          created_at: string | null
          customer: string
          details: Json | null
          id: string
          po_number: string
          status: string
        }
        Insert: {
          created_at?: string | null
          customer: string
          details?: Json | null
          id?: string
          po_number: string
          status: string
        }
        Update: {
          created_at?: string | null
          customer?: string
          details?: Json | null
          id?: string
          po_number?: string
          status?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      slitting: {
        Row: {
          created_at: string | null
          deckle: number
          id: string
          item_code: string
          item_name: string
          length: number
          status_slitting: string
          substrate_gsm: number
          substrate_name: string
          uiorn: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          deckle: number
          id?: string
          item_code: string
          item_name: string
          length: number
          status_slitting: string
          substrate_gsm: number
          substrate_name: string
          uiorn: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          deckle?: number
          id?: string
          item_code?: string
          item_name?: string
          length?: number
          status_slitting?: string
          substrate_gsm?: number
          substrate_name?: string
          uiorn?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "slitting_uiorn_fkey"
            columns: ["uiorn"]
            isOneToOne: false
            referencedRelation: "eligible_adhesive_coating_uiorns"
            referencedColumns: ["uiorn"]
          },
          {
            foreignKeyName: "slitting_uiorn_fkey"
            columns: ["uiorn"]
            isOneToOne: false
            referencedRelation: "eligible_lamination_uiorns"
            referencedColumns: ["uiorn"]
          },
          {
            foreignKeyName: "slitting_uiorn_fkey"
            columns: ["uiorn"]
            isOneToOne: false
            referencedRelation: "eligible_slitting_uiorns"
            referencedColumns: ["uiorn"]
          },
          {
            foreignKeyName: "slitting_uiorn_fkey"
            columns: ["uiorn"]
            isOneToOne: false
            referencedRelation: "order_punching"
            referencedColumns: ["uiorn"]
          },
        ]
      }
      stock: {
        Row: {
          current_qty: number
          id: string
          item_code: string
          last_updated: string
          opening_qty: number
        }
        Insert: {
          current_qty?: number
          id?: string
          item_code: string
          last_updated?: string
          opening_qty?: number
        }
        Update: {
          current_qty?: number
          id?: string
          item_code?: string
          last_updated?: string
          opening_qty?: number
        }
        Relationships: [
          {
            foreignKeyName: "stock_item_code_fkey"
            columns: ["item_code"]
            isOneToOne: true
            referencedRelation: "item_master"
            referencedColumns: ["item_code"]
          },
        ]
      }
      stock_analytics_queries: {
        Row: {
          created_at: string
          date_range_end: string | null
          date_range_start: string | null
          execution_time_ms: number | null
          filters: Json | null
          id: string
          query_result: Json | null
          query_text: string
          query_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date_range_end?: string | null
          date_range_start?: string | null
          execution_time_ms?: number | null
          filters?: Json | null
          id?: string
          query_result?: Json | null
          query_text: string
          query_type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date_range_end?: string | null
          date_range_start?: string | null
          execution_time_ms?: number | null
          filters?: Json | null
          id?: string
          query_result?: Json | null
          query_text?: string
          query_type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      eligible_adhesive_coating_uiorns: {
        Row: {
          deckle: number | null
          item_code: string | null
          item_name: string | null
          length: number | null
          substrate_gsm: number | null
          substrate_name: string | null
          uiorn: string | null
        }
        Relationships: []
      }
      eligible_lamination_uiorns: {
        Row: {
          item_name: string | null
          uiorn: string | null
        }
        Relationships: []
      }
      eligible_slitting_uiorns: {
        Row: {
          deckle: number | null
          item_code: string | null
          item_name: string | null
          length: number | null
          substrate_gsm: number | null
          substrate_name: string | null
          uiorn: string | null
        }
        Relationships: []
      }
      stock_summary: {
        Row: {
          calculated_qty: number | null
          category_name: string | null
          consumption_rate_per_day: number | null
          current_qty: number | null
          days_of_cover: number | null
          issue_30d: number | null
          item_code: string | null
          item_name: string | null
          opening_qty: number | null
          stock_validation_status: string | null
          total_grn_qty: number | null
          total_issued_qty: number | null
          unique_issue_days: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_item_code_fkey"
            columns: ["item_code"]
            isOneToOne: true
            referencedRelation: "item_master"
            referencedColumns: ["item_code"]
          },
        ]
      }
    }
    Functions: {
      capture_daily_stock_snapshot: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      count_adhesive_started: {
        Args: Record<PropertyKey, never>
        Returns: {
          count: number
        }[]
      }
      count_gravure_started: {
        Args: Record<PropertyKey, never>
        Returns: {
          count: number
        }[]
      }
      count_lamination_started: {
        Args: Record<PropertyKey, never>
        Returns: {
          count: number
        }[]
      }
      count_orders: {
        Args: Record<PropertyKey, never>
        Returns: {
          count: number
        }[]
      }
      dkegl_count_adhesive_started: {
        Args: Record<PropertyKey, never>
        Returns: {
          count: number
        }[]
      }
      dkegl_count_gravure_started: {
        Args: Record<PropertyKey, never>
        Returns: {
          count: number
        }[]
      }
      dkegl_count_lamination_started: {
        Args: Record<PropertyKey, never>
        Returns: {
          count: number
        }[]
      }
      dkegl_count_orders: {
        Args: Record<PropertyKey, never>
        Returns: {
          count: number
        }[]
      }
      dkegl_get_workflow_status: {
        Args: Record<PropertyKey, never>
        Returns: {
          uiorn: string
          item_name: string
          order_punching: string
          gravure_printing: string
          coating_lamination: string
          adhesive_coating: string
          slitting: string
        }[]
      }
      generate_item_code: {
        Args: {
          category_name: string
          qualifier?: string
          size_mm?: string
          gsm?: number
        }
        Returns: string
      }
      generate_item_code_with_validation: {
        Args: {
          category_name: string
          qualifier?: string
          size_mm?: string
          gsm?: number
        }
        Returns: Json
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_workflow_status: {
        Args: Record<PropertyKey, never>
        Returns: {
          uiorn: string
          item_name: string
          order_punching: string
          gravure_printing: string
          coating_lamination: string
          adhesive_coating: string
          slitting: string
        }[]
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      validate_item_code_params: {
        Args: {
          category_name: string
          qualifier?: string
          size_mm?: string
          gsm?: number
        }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
