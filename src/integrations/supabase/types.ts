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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          actor: string | null
          created_at: string | null
          entity: string | null
          entity_id: string | null
          id: string
          meta: Json | null
        }
        Insert: {
          action: string
          actor?: string | null
          created_at?: string | null
          entity?: string | null
          entity_id?: string | null
          id?: string
          meta?: Json | null
        }
        Update: {
          action?: string
          actor?: string | null
          created_at?: string | null
          entity?: string | null
          entity_id?: string | null
          id?: string
          meta?: Json | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string | null
          icon: string | null
          id: string
          name: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          icon?: string | null
          id?: string
          name: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          icon?: string | null
          id?: string
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      daily_order_counter: {
        Row: {
          counter_date: string
          last_sequence: number | null
        }
        Insert: {
          counter_date?: string
          last_sequence?: number | null
        }
        Update: {
          counter_date?: string
          last_sequence?: number | null
        }
        Relationships: []
      }
      modifier_sets: {
        Row: {
          created_at: string | null
          id: string
          is_required: boolean | null
          name: string
          type: Database["public"]["Enums"]["modifier_type"] | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_required?: boolean | null
          name: string
          type?: Database["public"]["Enums"]["modifier_type"] | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_required?: boolean | null
          name?: string
          type?: Database["public"]["Enums"]["modifier_type"] | null
        }
        Relationships: []
      }
      modifiers: {
        Row: {
          id: string
          is_active: boolean | null
          modifier_set_id: string | null
          name: string
          price_delta_mmk: number | null
          sort_order: number | null
        }
        Insert: {
          id?: string
          is_active?: boolean | null
          modifier_set_id?: string | null
          name: string
          price_delta_mmk?: number | null
          sort_order?: number | null
        }
        Update: {
          id?: string
          is_active?: boolean | null
          modifier_set_id?: string | null
          name?: string
          price_delta_mmk?: number | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "modifiers_modifier_set_id_fkey"
            columns: ["modifier_set_id"]
            isOneToOne: false
            referencedRelation: "modifier_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      order_item_modifiers: {
        Row: {
          id: string
          modifier_name_snapshot: string
          order_item_id: string
          price_delta_mmk: number | null
        }
        Insert: {
          id?: string
          modifier_name_snapshot: string
          order_item_id: string
          price_delta_mmk?: number | null
        }
        Update: {
          id?: string
          modifier_name_snapshot?: string
          order_item_id?: string
          price_delta_mmk?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "order_item_modifiers_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          id: string
          line_total_mmk: number | null
          notes: string | null
          order_id: string
          product_id: string | null
          product_name_snapshot: string
          qty: number | null
          unit_price_mmk: number | null
        }
        Insert: {
          id?: string
          line_total_mmk?: number | null
          notes?: string | null
          order_id: string
          product_id?: string | null
          product_name_snapshot: string
          qty?: number | null
          unit_price_mmk?: number | null
        }
        Update: {
          id?: string
          line_total_mmk?: number | null
          notes?: string | null
          order_id?: string
          product_id?: string | null
          product_name_snapshot?: string
          qty?: number | null
          unit_price_mmk?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          change_mmk: number | null
          created_at: string | null
          created_by: string | null
          customer_name: string | null
          customer_phone: string | null
          discount_mmk: number | null
          id: string
          order_no: string
          order_type: Database["public"]["Enums"]["order_type"] | null
          paid_mmk: number | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          status: Database["public"]["Enums"]["order_status"] | null
          subtotal_mmk: number | null
          tax_mmk: number | null
          total_mmk: number | null
          updated_at: string | null
        }
        Insert: {
          change_mmk?: number | null
          created_at?: string | null
          created_by?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          discount_mmk?: number | null
          id?: string
          order_no?: string
          order_type?: Database["public"]["Enums"]["order_type"] | null
          paid_mmk?: number | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          status?: Database["public"]["Enums"]["order_status"] | null
          subtotal_mmk?: number | null
          tax_mmk?: number | null
          total_mmk?: number | null
          updated_at?: string | null
        }
        Update: {
          change_mmk?: number | null
          created_at?: string | null
          created_by?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          discount_mmk?: number | null
          id?: string
          order_no?: string
          order_type?: Database["public"]["Enums"]["order_type"] | null
          paid_mmk?: number | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          status?: Database["public"]["Enums"]["order_status"] | null
          subtotal_mmk?: number | null
          tax_mmk?: number | null
          total_mmk?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      product_modifier_sets: {
        Row: {
          modifier_set_id: string
          product_id: string
        }
        Insert: {
          modifier_set_id: string
          product_id: string
        }
        Update: {
          modifier_set_id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_modifier_sets_modifier_set_id_fkey"
            columns: ["modifier_set_id"]
            isOneToOne: false
            referencedRelation: "modifier_sets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_modifier_sets_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string | null
          created_at: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_popular: boolean | null
          name: string
          name_mm: string | null
          price_mmk: number
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_popular?: boolean | null
          name: string
          name_mm?: string | null
          price_mmk?: number
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_popular?: boolean | null
          name?: string
          name_mm?: string | null
          price_mmk?: number
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
      shop_settings: {
        Row: {
          address: string | null
          created_at: string | null
          currency: string | null
          currency_symbol: string | null
          id: string
          name: string | null
          phone: string | null
          receipt_footer: string | null
          receipt_header: string | null
          tax_enabled: boolean | null
          tax_inclusive: boolean | null
          tax_rate: number | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          currency?: string | null
          currency_symbol?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          receipt_footer?: string | null
          receipt_header?: string | null
          tax_enabled?: boolean | null
          tax_inclusive?: boolean | null
          tax_rate?: number | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          currency?: string | null
          currency_symbol?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          receipt_footer?: string | null
          receipt_header?: string | null
          tax_enabled?: boolean | null
          tax_inclusive?: boolean | null
          tax_rate?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_order_number: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "cashier" | "supervisor" | "admin"
      modifier_type: "single" | "multiple"
      order_status:
        | "paid"
        | "in_progress"
        | "ready"
        | "completed"
        | "voided"
        | "refunded"
      order_type: "dine_in" | "takeaway"
      payment_method: "cash" | "card" | "mobile"
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
      app_role: ["cashier", "supervisor", "admin"],
      modifier_type: ["single", "multiple"],
      order_status: [
        "paid",
        "in_progress",
        "ready",
        "completed",
        "voided",
        "refunded",
      ],
      order_type: ["dine_in", "takeaway"],
      payment_method: ["cash", "card", "mobile"],
    },
  },
} as const
