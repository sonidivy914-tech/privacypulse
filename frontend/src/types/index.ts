export type AccountCategory = 'social' | 'finance' | 'shopping' | 'work' | 'entertainment' | 'other'
export type IncidentSeverity = 'low' | 'medium' | 'high'
export type IncidentStatus = 'open' | 'investigating' | 'resolved'

export interface UserProfile {
  id: string
  email?: string
  display_name?: string
  timezone: string
}

export interface DigitalAccount {
  id: string
  user_id: string
  service_name: string
  category: AccountCategory
  mfa_enabled: boolean
  recovery_reviewed: boolean
  last_reviewed_at: string | null
  notes: string | null
  score: number
  created_at: string
  updated_at: string
}

export interface ChecklistItem {
  id: string
  user_id: string
  title: string
  description?: string
  category: string
  completed: boolean
  completed_at?: string | null
  created_at: string
}

export interface Reminder {
  id: string
  user_id: string
  account_id?: string | null
  account_name?: string | null
  title: string
  due_at: string
  completed: boolean
  created_at: string
}

export interface Incident {
  id: string
  user_id: string
  title: string
  description?: string
  severity: IncidentSeverity
  occurred_at?: string | null
  status: IncidentStatus
  created_at: string
}

export interface DashboardSummary {
  account_count: number
  overall_score: number | null
  score_label: string
  open_reminders_count: number
  open_incidents_count: number
  checklist_completion_ratio: number
  next_action?: string
}

export interface ReportSummary {
  user_id: string
  overall_score: number | null
  score_label: string
  accounts: DigitalAccount[]
  checklist: ChecklistItem[]
  reminders: Reminder[]
  incidents: Incident[]
}
