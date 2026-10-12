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

// Mock Sandbox Data & In-Browser Store
function getMockData<T>(key: string, initial: T): T {
  try {
    const raw = localStorage.getItem(`privacypulse_mock_${key}`)
    return raw ? JSON.parse(raw) : initial
  } catch {
    return initial
  }
}

function setMockData<T>(key: string, data: T): void {
  try {
    localStorage.setItem(`privacypulse_mock_${key}`, JSON.stringify(data))
  } catch {
    // Ignore storage quota errors
  }
}

function computeScore(accs: DigitalAccount[]) {
  if (!accs.length) return null
  const now = Date.now()
  const ninetyDays = 90 * 86400000
  let total = 0
  for (const a of accs) {
    let s = 0
    if (a.mfa_enabled) s += 40
    if (a.recovery_reviewed) s += 30
    if (a.last_reviewed_at && now - new Date(a.last_reviewed_at).getTime() < ninetyDays) s += 30
    a.score = s
    total += s
  }
  return Math.round(total / accs.length)
}

function handleMockRequest<T>(endpoint: string, options: RequestInit = {}): T {
  const method = (options.method || 'GET').toUpperCase()
  const body = options.body ? JSON.parse(options.body as string) : {}

  if (endpoint === '/api/v1/auth/me') {
    return {
      id: 'sandbox-user-1',
      email: 'demo@privacypulse.local',
      display_name: 'Demo Explorer',
      timezone: 'Asia/Kolkata',
    } as T
  }

  // Accounts
  if (endpoint.startsWith('/api/v1/accounts')) {
    let accounts = getMockData<DigitalAccount[]>('accounts', [
      {
        id: 'acc-1',
        user_id: 'sandbox-user-1',
        service_name: 'Google Workspace',
        category: 'work',
        mfa_enabled: true,
        recovery_reviewed: true,
        last_reviewed_at: new Date().toISOString(),
        notes: 'Passkey + Authenticator app',
        score: 100,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'acc-2',
        user_id: 'sandbox-user-1',
        service_name: 'GitHub Enterprise',
        category: 'work',
        mfa_enabled: true,
        recovery_reviewed: true,
        last_reviewed_at: new Date().toISOString(),
        notes: 'Hardware security key',
        score: 100,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'acc-3',
        user_id: 'sandbox-user-1',
        service_name: 'Primary Banking',
        category: 'finance',
        mfa_enabled: true,
        recovery_reviewed: false,
        last_reviewed_at: new Date(Date.now() - 100 * 86400000).toISOString(),
        notes: 'Recovery email needs audit',
        score: 40,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'acc-4',
        user_id: 'sandbox-user-1',
        service_name: 'Netflix & Streaming',
        category: 'entertainment',
        mfa_enabled: false,
        recovery_reviewed: false,
        last_reviewed_at: null,
        notes: 'Household sharing',
        score: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ])
    computeScore(accounts)

    if (method === 'GET') return accounts as T
    if (method === 'POST') {
      const newAcc: DigitalAccount = {
        id: `acc-${Date.now()}`,
        user_id: 'sandbox-user-1',
        service_name: body.service_name || 'New Account',
        category: body.category || 'other',
        mfa_enabled: Boolean(body.mfa_enabled),
        recovery_reviewed: Boolean(body.recovery_reviewed),
        last_reviewed_at: body.last_reviewed_at || new Date().toISOString(),
        notes: body.notes || '',
        score: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      accounts.push(newAcc)
      computeScore(accounts)
      setMockData('accounts', accounts)
      return newAcc as T
    }
    if (method === 'PATCH') {
      const id = endpoint.split('/').pop()
      const idx = accounts.findIndex((a) => a.id === id)
      if (idx !== -1) {
        accounts[idx] = { ...accounts[idx], ...body, updated_at: new Date().toISOString() }
        computeScore(accounts)
        setMockData('accounts', accounts)
        return accounts[idx] as T
      }
    }
    if (method === 'DELETE') {
      const id = endpoint.split('/').pop()
      accounts = accounts.filter((a) => a.id !== id)
      setMockData('accounts', accounts)
      return {} as T
    }
  }

  // Checklist
  if (endpoint.startsWith('/api/v1/checklist')) {
    let checklist = getMockData<ChecklistItem[]>('checklist', [
      {
        id: 'chk-1',
        user_id: 'sandbox-user-1',
        title: 'Enable Full-Disk Device Encryption (BitLocker / FileVault)',
        description: 'Protects offline theft of storage partition.',
        category: 'device',
        completed: true,
        completed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      },
      {
        id: 'chk-2',
        user_id: 'sandbox-user-1',
        title: 'Audit Third-Party OAuth App Authorizations',
        description: 'Remove legacy apps granted Google or GitHub account access.',
        category: 'privacy',
        completed: true,
        completed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      },
      {
        id: 'chk-3',
        user_id: 'sandbox-user-1',
        title: 'Review Browser Extensions Hygiene',
        description: 'Delete extensions that require broad reading permissions.',
        category: 'browser',
        completed: false,
        completed_at: null,
        created_at: new Date().toISOString(),
      },
    ])

    if (method === 'GET') return checklist as T
    if (method === 'POST') {
      const item: ChecklistItem = {
        id: `chk-${Date.now()}`,
        user_id: 'sandbox-user-1',
        title: body.title || 'Checklist item',
        description: body.description || '',
        category: body.category || 'general',
        completed: Boolean(body.completed),
        completed_at: body.completed ? new Date().toISOString() : null,
        created_at: new Date().toISOString(),
      }
      checklist.push(item)
      setMockData('checklist', checklist)
      return item as T
    }
    if (method === 'PATCH') {
      const id = endpoint.split('/').pop()
      const idx = checklist.findIndex((c) => c.id === id)
      if (idx !== -1) {
        checklist[idx] = { ...checklist[idx], ...body }
        if (body.completed !== undefined) {
          checklist[idx].completed_at = body.completed ? new Date().toISOString() : null
        }
        setMockData('checklist', checklist)
        return checklist[idx] as T
      }
    }
    if (method === 'DELETE') {
      const id = endpoint.split('/').pop()
      checklist = checklist.filter((c) => c.id !== id)
      setMockData('checklist', checklist)
      return {} as T
    }
  }

  // Reminders
  if (endpoint.startsWith('/api/v1/reminders')) {
    let reminders = getMockData<Reminder[]>('reminders', [
      {
        id: 'rem-1',
        user_id: 'sandbox-user-1',
        account_id: 'acc-3',
        account_name: 'Primary Banking',
        title: 'Review 2FA & alerts settings',
        due_at: new Date(Date.now() + 7 * 86400000).toISOString(),
        completed: false,
        created_at: new Date().toISOString(),
      },
    ])
    if (method === 'GET') return reminders as T
    if (method === 'POST') {
      const rem: Reminder = {
        id: `rem-${Date.now()}`,
        user_id: 'sandbox-user-1',
        account_id: body.account_id || null,
        account_name: body.account_name || null,
        title: body.title || 'Review Reminder',
        due_at: body.due_at || new Date().toISOString(),
        completed: Boolean(body.completed),
        created_at: new Date().toISOString(),
      }
      reminders.push(rem)
      setMockData('reminders', reminders)
      return rem as T
    }
    if (method === 'PATCH') {
      const id = endpoint.split('/').pop()
      const idx = reminders.findIndex((r) => r.id === id)
      if (idx !== -1) {
        reminders[idx] = { ...reminders[idx], ...body }
        setMockData('reminders', reminders)
        return reminders[idx] as T
      }
    }
    if (method === 'DELETE') {
      const id = endpoint.split('/').pop()
      reminders = reminders.filter((r) => r.id !== id)
      setMockData('reminders', reminders)
      return {} as T
    }
  }

  // Incidents
  if (endpoint.startsWith('/api/v1/incidents')) {
    let incidents = getMockData<Incident[]>('incidents', [
      {
        id: 'inc-1',
        user_id: 'sandbox-user-1',
        title: 'Suspicious 2FA SMS notification',
        description: 'Received unsolicited OTP. Rotated password and renewed passkeys.',
        severity: 'medium',
        occurred_at: new Date(Date.now() - 2 * 86400000).toISOString(),
        status: 'resolved',
        created_at: new Date().toISOString(),
      },
    ])
    if (method === 'GET') return incidents as T
    if (method === 'POST') {
      const inc: Incident = {
        id: `inc-${Date.now()}`,
        user_id: 'sandbox-user-1',
        title: body.title || 'Security incident',
        description: body.description || '',
        severity: body.severity || 'medium',
        occurred_at: body.occurred_at || new Date().toISOString(),
        status: body.status || 'open',
        created_at: new Date().toISOString(),
      }
      incidents.push(inc)
      setMockData('incidents', incidents)
      return inc as T
    }
    if (method === 'PATCH') {
      const id = endpoint.split('/').pop()
      const idx = incidents.findIndex((i) => i.id === id)
      if (idx !== -1) {
        incidents[idx] = { ...incidents[idx], ...body }
        setMockData('incidents', incidents)
        return incidents[idx] as T
      }
    }
    if (method === 'DELETE') {
      const id = endpoint.split('/').pop()
      incidents = incidents.filter((i) => i.id !== id)
      setMockData('incidents', incidents)
      return {} as T
    }
  }

  // Dashboard Summary
  if (endpoint === '/api/v1/dashboard') {
    const accs = getMockData<DigitalAccount[]>('accounts', [])
    const rems = getMockData<Reminder[]>('reminders', [])
    const incs = getMockData<Incident[]>('incidents', [])
    const chks = getMockData<ChecklistItem[]>('checklist', [])
    const score = computeScore(accs)
    const openReminders = rems.filter((r) => !r.completed).length
    const openIncidents = incs.filter((i) => i.status !== 'resolved').length
    const completedChks = chks.filter((c) => c.completed).length
    const ratio = chks.length ? Math.round((completedChks / chks.length) * 100) : 0

    let label = 'Good'
    if (score === null) label = 'Not Calculated'
    else if (score >= 80) label = 'Excellent'
    else if (score >= 60) label = 'Good'
    else if (score >= 40) label = 'Fair'
    else label = 'Action Required'

    return {
      account_count: accs.length,
      overall_score: score,
      score_label: label,
      open_reminders_count: openReminders,
      open_incidents_count: openIncidents,
      checklist_completion_ratio: ratio,
      next_action: 'Audit Primary Banking credentials review interval',
    } as T
  }

  // Report Summary
  if (endpoint === '/api/v1/reports/summary') {
    const accs = getMockData<DigitalAccount[]>('accounts', [])
    const score = computeScore(accs)
    let label = 'Good'
    if (score === null) label = 'Not Calculated'
    else if (score >= 80) label = 'Excellent'
    else if (score >= 60) label = 'Good'
    else if (score >= 40) label = 'Fair'
    else label = 'Action Required'

    return {
      user_id: 'sandbox-user-1',
      overall_score: score,
      score_label: label,
      accounts: accs,
      checklist: getMockData<ChecklistItem[]>('checklist', []),
      reminders: getMockData<Reminder[]>('reminders', []),
      incidents: getMockData<Incident[]>('incidents', []),
    } as T
  }

  return {} as T
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken()

  // If running in sandbox client mode, handle immediately via mock store
  if (token === 'sandbox-client-token') {
    return handleMockRequest<T>(endpoint, options)
  }

  const headers = new Headers(options.headers || {})
  headers.set('Content-Type', 'application/json')
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  try {
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
  } catch (err: unknown) {
    // If backend connection fails (e.g. Mixed content on Vercel or server offline), fallback gracefully in demo mode
    if (token?.startsWith('sandbox-') || !token) {
      console.warn(`API call ${endpoint} failed, falling back to mock sandbox store`, err)
      return handleMockRequest<T>(endpoint, options)
    }
    throw err
  }
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
