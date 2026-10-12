import React, { useState } from 'react'
import { AuthProvider, useAuth } from './features/auth/AuthContext'
import { AuthModal } from './features/auth/AuthModal'
import { Navbar, type TabType } from './components/Navbar'
import { DashboardPage } from './pages/DashboardPage'
import { AccountsPage } from './pages/AccountsPage'
import { ChecklistPage } from './pages/ChecklistPage'
import { RemindersPage } from './pages/RemindersPage'
import { IncidentsPage } from './pages/IncidentsPage'
import { ReportsPage } from './pages/ReportsPage'
import { RefreshCw } from 'lucide-react'

const AppContent: React.FC = () => {
  const { user, loading } = useAuth()
  const [activeTab, setActiveTab] = useState<TabType>('dashboard')

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin text-emerald-400 mr-3" />
        <span className="text-sm">Initializing PrivacyPulse session...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <AuthModal isOpen={!user} />

      {user && (
        <>
          <Navbar activeTab={activeTab} onSelectTab={setActiveTab} />

          <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-8 w-full">
            {activeTab === 'dashboard' && <DashboardPage onNavigate={setActiveTab} />}
            {activeTab === 'accounts' && <AccountsPage />}
            {activeTab === 'checklist' && <ChecklistPage />}
            {activeTab === 'reminders' && <RemindersPage />}
            {activeTab === 'incidents' && <IncidentsPage />}
            {activeTab === 'reports' && <ReportsPage />}
          </main>

          <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
              <div>PrivacyPulse — Secure Personal Digital-Privacy Dashboard</div>
              <div className="text-[11px] text-slate-600">
                Rule-based Checklist Scoring • Zero Password Storage
              </div>
            </div>
          </footer>
        </>
      )}
    </div>
  )
}

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
