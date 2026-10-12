import React, { useEffect, useState } from 'react'
import {
  Shield,
  KeyRound,
  Bell,
  AlertTriangle,
  CheckSquare,
  ArrowRight,
  Info,
  RefreshCw,
  PlusCircle,
} from 'lucide-react'
import { getDashboard } from '../api/client'
import type { DashboardSummary } from '../types'
import type { TabType } from '../components/Navbar'

interface DashboardPageProps {
  onNavigate: (tab: TabType) => void
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const [data, setData] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadDashboard = async () => {
    setLoading(true)
    setError(null)
    try {
      const summary = await getDashboard()
      setData(summary)
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message)
      else setError('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin text-emerald-400 mr-3" />
        <span>Computing privacy scores & metrics...</span>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Top Welcome / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Security Overview
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Track digital accounts, review hygiene, and self-reported posture.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onNavigate('accounts')}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium shadow-md shadow-emerald-950/50 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Account</span>
          </button>
          <button
            onClick={loadDashboard}
            title="Refresh"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
          {error}
        </div>
      )}

      {/* Main Score & Next Action Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Score Card */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Shield className="w-36 h-36 text-emerald-400" />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
                Checklist Posture
              </span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                RULE-BASED
              </span>
            </div>

            <div className="pt-2">
              {data?.overall_score !== null && data?.overall_score !== undefined ? (
                <div className="flex items-baseline space-x-2">
                  <span className="text-5xl font-black tracking-tight text-white">
                    {data.overall_score}
                  </span>
                  <span className="text-xl text-slate-500 font-semibold">/ 100</span>
                </div>
              ) : (
                <div className="text-2xl font-bold text-slate-300 py-3">
                  No Accounts Added
                </div>
              )}
              <div className="text-xs font-medium text-emerald-400 mt-1">
                {data?.score_label || 'Self-reported checklist score'}
              </div>
            </div>
          </div>

          {/* Breakdown criteria */}
          <div className="pt-6 mt-6 border-t border-slate-800 space-y-2 text-xs text-slate-400">
            <div className="font-semibold text-slate-300 text-[11px] uppercase tracking-wider">
              Scoring Weights:
            </div>
            <div className="flex justify-between">
              <span>MFA Enabled</span>
              <span className="font-mono text-emerald-400">+40 pts</span>
            </div>
            <div className="flex justify-between">
              <span>Recovery Settings Reviewed</span>
              <span className="font-mono text-emerald-400">+30 pts</span>
            </div>
            <div className="flex justify-between">
              <span>Reviewed in Last 90 Days</span>
              <span className="font-mono text-emerald-400">+30 pts</span>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-start space-x-2 text-[11px] text-slate-500">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>
              Self-reported metrics measure checklist adherence, not guarantees against breaches.
            </span>
          </div>
        </div>

        {/* Next Action & Key Guidance */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-xs uppercase font-bold tracking-wider text-slate-400 mb-4">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>Recommended Next Action</span>
            </div>
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 mb-6">
              <h3 className="text-lg font-semibold text-white">
                {data?.next_action || 'Review and update account security settings'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Keeping accounts audited within 90 days prevents dormant vulnerabilities and unauthorized recovery drift.
              </p>
            </div>
          </div>

          {/* Action Navigation Shortcuts */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-800">
            <button
              onClick={() => onNavigate('accounts')}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 text-left transition-colors cursor-pointer group"
            >
              <div>
                <div className="text-xs font-semibold text-slate-200">Digital Accounts</div>
                <div className="text-[11px] text-slate-500">Manage {data?.account_count || 0} accounts</div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
            </button>

            <button
              onClick={() => onNavigate('reminders')}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 text-left transition-colors cursor-pointer group"
            >
              <div>
                <div className="text-xs font-semibold text-slate-200">Reminders</div>
                <div className="text-[11px] text-slate-500">{data?.open_reminders_count || 0} pending review</div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
            </button>

            <button
              onClick={() => onNavigate('checklist')}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 text-left transition-colors cursor-pointer group"
            >
              <div>
                <div className="text-xs font-semibold text-slate-200">Checklist</div>
                <div className="text-[11px] text-slate-500">
                  {Math.round((data?.checklist_completion_ratio || 0) * 100)}% complete
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Accounts */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Accounts</span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <KeyRound className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white mt-3">{data?.account_count || 0}</div>
          <div className="text-[11px] text-slate-500 mt-1">Tracked services</div>
        </div>

        {/* Metric 2: Open Reminders */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Open Reminders</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Bell className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white mt-3">{data?.open_reminders_count || 0}</div>
          <div className="text-[11px] text-slate-500 mt-1">Due for review</div>
        </div>

        {/* Metric 3: Active Incidents */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Active Incidents</span>
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white mt-3">{data?.open_incidents_count || 0}</div>
          <div className="text-[11px] text-slate-500 mt-1">Open journal logs</div>
        </div>

        {/* Metric 4: Checklist */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Checklist Done</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white mt-3">
            {Math.round((data?.checklist_completion_ratio || 0) * 100)}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Habits completed</div>
        </div>
      </div>
    </div>
  )
}

