// Domain enum types — replace this whole file with `supabase gen types typescript` output once project is linked.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type UserRole = "super_admin" | "academy_manager" | "coach" | "player";
export type JoinStatus = "pending" | "approved" | "rejected";
export type PlayerStatus = "active" | "suspended" | "archived";
export type AttendanceStatus = "present" | "absent" | "late";
export type SubscriptionStatus = "unpaid" | "partial" | "paid" | "overdue";
export type AssetCondition = "good" | "maintenance" | "damaged" | "transferred";
export type InjurySource = "training" | "match";
export type NotificationChannel = "in_app" | "email" | "whatsapp";
export type NotificationStatus = "queued" | "sent" | "failed";

export interface AcademySettings {
  attendance_lock_minutes: number;
  required_fields: string[];
  notification_channels: NotificationChannel[];
  overdue_reminders: { every_days: number; before_due_days: number; final_after_days: number };
  receipt_footer: string;
  date_format: "gregorian" | "hijri";
  [k: string]: unknown;
}

export interface Academy {
  id: string;
  slug: string;
  name: string;
  logo_url: string | null;
  address: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  settings: AcademySettings;
  created_at: string;
  updated_at: string;
}

export interface Membership { id: string; user_id: string; academy_id: string | null; role: UserRole; created_at: string }
export interface Profile { id: string; full_name: string | null; phone: string | null; avatar_url: string | null; created_at: string }
export interface Category { id: string; academy_id: string; name: string; monthly_fee: number; age_min: number | null; age_max: number | null; active: boolean; created_at: string }

export interface Player {
  id: string; academy_id: string; user_id: string | null; code: string;
  category_id: string | null; full_name: string; birth_date: string | null;
  phone: string | null; email: string | null; national_id: string | null;
  guardian_name: string | null; guardian_phone: string | null;
  photo_url: string | null; id_doc_url: string | null;
  status: PlayerStatus; joined_at: string; notes: string | null;
}

export interface JoinRequest {
  id: string; academy_id: string; full_name: string; birth_date: string | null;
  phone: string | null; email: string | null; national_id: string | null;
  guardian_name: string | null; guardian_phone: string | null;
  photo_url: string | null; id_doc_url: string | null;
  desired_category_id: string | null; status: JoinStatus;
  reviewed_by: string | null; reviewed_at: string | null;
  rejection_reason: string | null; created_player_id: string | null; created_at: string;
}

export interface Training { id: string; academy_id: string; category_id: string | null; scheduled_at: string; duration_min: number; location: string | null; notes: string | null; created_at: string }
export interface AttendanceRecord { id: string; training_id: string; player_id: string; status: AttendanceStatus; recorded_by: string | null; recorded_at: string; locked_at: string }
export interface Match { id: string; academy_id: string; opponent: string; venue: string | null; match_date: string; our_score: number | null; their_score: number | null; notes: string | null; created_at: string }
export interface MatchParticipation { id: string; match_id: string; player_id: string; goals: number; yellow_cards: number; red_cards: number; sent_off: boolean; notes: string | null }
export interface Injury { id: string; player_id: string; source: InjurySource; source_match_id: string | null; source_training_id: string | null; injury_type: string | null; body_location: string | null; occurred_at: string; expected_return_at: string | null; notes: string | null; created_at: string }
export interface Subscription { id: string; academy_id: string; player_id: string; period_year: number; period_month: number; amount_due: number; amount_paid: number; status: SubscriptionStatus; due_date: string | null; created_at: string }
export interface Payment { id: string; academy_id: string; subscription_id: string; amount: number; paid_at: string; method: string | null; receipt_no: number; recorded_by: string | null; notes: string | null }
export interface Expense { id: string; academy_id: string; category_id: string | null; description: string; amount: number; spent_at: string; receipt_image_url: string | null; created_by: string | null; created_at: string }
export interface ExpenseCategory { id: string; academy_id: string; name: string }
export interface ExtraRevenue { id: string; academy_id: string; source: string; amount: number; received_at: string; notes: string | null; created_at: string }
export interface Asset { id: string; academy_id: string; name: string; quantity: number; storage_location: string | null; custodian: string | null; condition: AssetCondition; last_inventory_at: string | null; qr_token: string; notes: string | null; created_at: string }
export interface Notification { id: string; academy_id: string | null; recipient_user_id: string | null; recipient_group: string | null; channel: NotificationChannel; title: string; body: string | null; payload: Json | null; status: NotificationStatus; scheduled_at: string; sent_at: string | null; read_at: string | null; created_at: string }

// Permissive Database type for supabase-js: avoids strict per-table inference.
// Replace later via `supabase gen types`.
export type Database = any;
