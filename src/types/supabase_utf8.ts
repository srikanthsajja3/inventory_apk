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
    PostgrestVersion: "14.4"
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
      app_users: {
        Row: {
          created_at: string | null
          email: string | null
          is_active: boolean | null
          password: string
          role: string
          username: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          is_active?: boolean | null
          password?: string
          role: string
          username: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          is_active?: boolean | null
          password?: string
          role?: string
          username?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          id: string
          name: string
          parent_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          parent_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          parent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      items: {
        Row: {
          barcode: string | null
          category_id: string | null
          clr_stone_pcs: number | null
          clr_stone_wt: number | null
          cost_price: number | null
          created_at: string
          dai_pcs: number | null
          dai_pear: number | null
          dai_rd: number | null
          dai_stb: number | null
          dai_wt: number | null
          description: string | null
          dia_purchase_amt: number | null
          doc_date: string | null
          doc_no: string | null
          exhibition_added_at: string | null
          gross_wt: number | null
          huid: string | null
          id: string
          igi_fee: number | null
          image_url: string | null
          image_urls: string[] | null
          in_exhibition: boolean | null
          is_remarked: boolean | null
          label_no: string | null
          labeling_date: string | null
          labour_amt: number | null
          labour_rate: number | null
          last_scanned_at: string | null
          last_scanned_by: string | null
          location: string | null
          min_stock_level: number | null
          name: string
          net_wt: number | null
          other_charges: number | null
          pcs: number | null
          prc_amount: number | null
          purch_wastage_rate: number | null
          purity: string | null
          quality: string | null
          quantity: number
          remarked_at: string | null
          remarked_weight: number | null
          size: string | null
          sku: string | null
          stone_purchase_amt: number | null
          stones_in_detail: string | null
          supplier_contact: string | null
          supplier_name: string | null
          unit: string | null
          updated_at: string
          wastage: number | null
          weight_with_tag: number | null
        }
        Insert: {
          barcode?: string | null
          category_id?: string | null
          clr_stone_pcs?: number | null
          clr_stone_wt?: number | null
          cost_price?: number | null
          created_at?: string
          dai_pcs?: number | null
          dai_pear?: number | null
          dai_rd?: number | null
          dai_stb?: number | null
          dai_wt?: number | null
          description?: string | null
          dia_purchase_amt?: number | null
          doc_date?: string | null
          doc_no?: string | null
          exhibition_added_at?: string | null
          gross_wt?: number | null
          huid?: string | null
          id?: string
          igi_fee?: number | null
          image_url?: string | null
          image_urls?: string[] | null
          in_exhibition?: boolean | null
          is_remarked?: boolean | null
          label_no?: string | null
          labeling_date?: string | null
          labour_amt?: number | null
          labour_rate?: number | null
          last_scanned_at?: string | null
          last_scanned_by?: string | null
          location?: string | null
          min_stock_level?: number | null
          name: string
          net_wt?: number | null
          other_charges?: number | null
          pcs?: number | null
          prc_amount?: number | null
          purch_wastage_rate?: number | null
          purity?: string | null
          quality?: string | null
          quantity?: number
          remarked_at?: string | null
          remarked_weight?: number | null
          size?: string | null
          sku?: string | null
          stone_purchase_amt?: number | null
          stones_in_detail?: string | null
          supplier_contact?: string | null
          supplier_name?: string | null
          unit?: string | null
          updated_at?: string
          wastage?: number | null
          weight_with_tag?: number | null
        }
        Update: {
          barcode?: string | null
          category_id?: string | null
          clr_stone_pcs?: number | null
          clr_stone_wt?: number | null
          cost_price?: number | null
          created_at?: string
          dai_pcs?: number | null
          dai_pear?: number | null
          dai_rd?: number | null
          dai_stb?: number | null
          dai_wt?: number | null
          description?: string | null
          dia_purchase_amt?: number | null
          doc_date?: string | null
          doc_no?: string | null
          exhibition_added_at?: string | null
          gross_wt?: number | null
          huid?: string | null
          id?: string
          igi_fee?: number | null
          image_url?: string | null
          image_urls?: string[] | null
          in_exhibition?: boolean | null
          is_remarked?: boolean | null
          label_no?: string | null
          labeling_date?: string | null
          labour_amt?: number | null
          labour_rate?: number | null
          last_scanned_at?: string | null
          last_scanned_by?: string | null
          location?: string | null
          min_stock_level?: number | null
          name?: string
          net_wt?: number | null
          other_charges?: number | null
          pcs?: number | null
          prc_amount?: number | null
          purch_wastage_rate?: number | null
          purity?: string | null
          quality?: string | null
          quantity?: number
          remarked_at?: string | null
          remarked_weight?: number | null
          size?: string | null
          sku?: string | null
          stone_purchase_amt?: number | null
          stones_in_detail?: string | null
          supplier_contact?: string | null
          supplier_name?: string | null
          unit?: string | null
          updated_at?: string
          wastage?: number | null
          weight_with_tag?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      master_rates: {
        Row: {
          category: string | null
          id: string
          key: string
          label: string | null
          updated_at: string
          value: number
        }
        Insert: {
          category?: string | null
          id?: string
          key: string
          label?: string | null
          updated_at?: string
          value: number
        }
        Update: {
          category?: string | null
          id?: string
          key?: string
          label?: string | null
          updated_at?: string
          value?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          full_name: string | null
          id: string
          role: string
          updated_at: string | null
        }
        Insert: {
          full_name?: string | null
          id: string
          role?: string
          updated_at?: string | null
        }
        Update: {
          full_name?: string | null
          id?: string
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      sales: {
        Row: {
          id: string
          item_id: string | null
          item_name: string
          prc_amount: number | null
          profit_loss: number | null
          sale_amount: number | null
          sku: string | null
          sold_at: string | null
          sold_by: string | null
        }
        Insert: {
          id?: string
          item_id?: string | null
          item_name: string
          prc_amount?: number | null
          profit_loss?: number | null
          sale_amount?: number | null
          sku?: string | null
          sold_at?: string | null
          sold_by?: string | null
        }
        Update: {
          id?: string
          item_id?: string | null
          item_name?: string
          prc_amount?: number | null
          profit_loss?: number | null
          sale_amount?: number | null
          sku?: string | null
          sold_at?: string | null
          sold_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "staff_items"
            referencedColumns: ["id"]
          },
        ]
      }
      stone_master: {
        Row: {
          category: string
          created_at: string | null
          id: string
          max_wt: number | null
          min_wt: number | null
          name: string
          rate: number
          sub_category: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          max_wt?: number | null
          min_wt?: number | null
          name: string
          rate: number
          sub_category?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          max_wt?: number | null
          min_wt?: number | null
          name?: string
          rate?: number
          sub_category?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          created_at: string
          id: string
          item_id: string
          quantity_changed: number
          reason: string | null
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          quantity_changed: number
          reason?: string | null
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          quantity_changed?: number
          reason?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "staff_items"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      staff_items: {
        Row: {
          barcode: string | null
          category_id: string | null
          created_at: string | null
          description: string | null
          gross_wt: number | null
          id: string | null
          image_url: string | null
          is_remarked: boolean | null
          label_no: string | null
          last_scanned_at: string | null
          last_scanned_by: string | null
          location: string | null
          min_stock_level: number | null
          name: string | null
          net_wt: number | null
          pcs: number | null
          purity: string | null
          quantity: number | null
          remarked_at: string | null
          remarked_weight: number | null
          sku: string | null
          unit: string | null
          updated_at: string | null
          weight_with_tag: number | null
        }
        Insert: {
          barcode?: string | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          gross_wt?: number | null
          id?: string | null
          image_url?: string | null
          is_remarked?: boolean | null
          label_no?: string | null
          last_scanned_at?: string | null
          last_scanned_by?: string | null
          location?: string | null
          min_stock_level?: number | null
          name?: string | null
          net_wt?: number | null
          pcs?: number | null
          purity?: string | null
          quantity?: number | null
          remarked_at?: string | null
          remarked_weight?: number | null
          sku?: string | null
          unit?: string | null
          updated_at?: string | null
          weight_with_tag?: number | null
        }
        Update: {
          barcode?: string | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          gross_wt?: number | null
          id?: string | null
          image_url?: string | null
          is_remarked?: boolean | null
          label_no?: string | null
          last_scanned_at?: string | null
          last_scanned_by?: string | null
          location?: string | null
          min_stock_level?: number | null
          name?: string | null
          net_wt?: number | null
          pcs?: number | null
          purity?: string | null
          quantity?: number | null
          remarked_at?: string | null
          remarked_weight?: number | null
          sku?: string | null
          unit?: string | null
          updated_at?: string | null
          weight_with_tag?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
