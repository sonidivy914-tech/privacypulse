import type {
  DigitalAccount,
  ChecklistItem,
  Reminder,
  Incident,
  DashboardSummary,
  ReportSummary,
  UserProfile,
} from '../types'

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

let currentAuthToken: string | null = null

export function setAuthToken(token: string | null) {
  currentAuthToken = token
  if (token) {
    localStorage.setItem('privacypulse_token', token)
  } else {
    localStorage.removeItem('privacypulse_token')
  }
}

export function getAuthToken(): string | null {
  if (!currentAuthToken) {
    currentAuthToken = localStorage.getItem('privacypulse_token')
  }
  return currentAuthToken
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken()
  const headers = new Headers(options.headers || {})
  headers.set('Content-Type', 'application/json')
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    let errorDetail = `Request failed: ${response.statusText}`
    try {
      const errorJson = await response.json()
      if (errorJson.detail) {
        errorDetail = typeof errorJson.detail === 'string' ? errorJson.detail : JSON.stringify(errorJson.detail)
      }
    } catch {
      // Ignore json parse error
    }
    throw new Error(errorDetail)
  }

  if (response.status === 204) {
    return {} as T
  }

  return response.json()
}

// System Health
export async function fetchHealth(): Promise<{ status: string; app: string }> {
  const res = await fetch(`${API_BASE_URL}/health`)
  if (!res.ok) throw new Error('API Health check failed')
  return res.json()
}

// User Profile
export async function getProfile(): Promise<UserProfile> {
  return request<UserProfile>('/api/v1/auth/me')
}

// Dashboard
export async function getDashboard(): Promise<DashboardSummary> {
  return request<DashboardSummary>('/api/v1/dashboard')
}

// Digital Accounts
export async function getAccounts(): Promise<DigitalAccount[]> {
  return request<DigitalAccount[]>('/api/v1/accounts')
}

export async function createAccount(data: Partial<DigitalAccount>): Promise<DigitalAccount> {
  return request<DigitalAccount>('/api/v1/accounts', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateAccount(id: string, data: Partial<DigitalAccount>): Promise<DigitalAccount> {
  return request<DigitalAccount>(`/api/v1/accounts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function deleteAccount(id: string): Promise<void> {
  return request<void>(`/api/v1/accounts/${id}`, {
    method: 'DELETE',
  })
}

// Checklist Items
export async function getChecklist(): Promise<ChecklistItem[]> {
  return request<ChecklistItem[]>('/api/v1/checklist')
}

export async function createChecklistItem(data: Partial<ChecklistItem>): Promise<ChecklistItem> {
  return request<ChecklistItem>('/api/v1/checklist', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateChecklistItem(id: string, data: Partial<ChecklistItem>): Promise<ChecklistItem> {
  return request<ChecklistItem>(`/api/v1/checklist/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function deleteChecklistItem(id: string): Promise<void> {
  return request<void>(`/api/v1/checklist/${id}`, {
    method: 'DELETE',
  })
}

// Reminders
export async function getReminders(): Promise<Reminder[]> {
  return request<Reminder[]>('/api/v1/reminders')
}

export async function createReminder(data: Partial<Reminder>): Promise<Reminder> {
  return request<Reminder>('/api/v1/reminders', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateReminder(id: string, data: Partial<Reminder>): Promise<Reminder> {
  return request<Reminder>(`/api/v1/reminders/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function deleteReminder(id: string): Promise<void> {
  return request<void>(`/api/v1/reminders/${id}`, {
    method: 'DELETE',
  })
}

// Incidents
export async function getIncidents(): Promise<Incident[]> {
  return request<Incident[]>('/api/v1/incidents')
}

export async function createIncident(data: Partial<Incident>): Promise<Incident> {
  return request<Incident>('/api/v1/incidents', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateIncident(id: string, data: Partial<Incident>): Promise<Incident> {
  return request<Incident>(`/api/v1/incidents/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function deleteIncident(id: string): Promise<void> {
  return request<void>(`/api/v1/incidents/${id}`, {
    method: 'DELETE',
  })
}

// Reports
export async function getReportSummary(): Promise<ReportSummary> {
  return request<ReportSummary>('/api/v1/reports/summary')
}
