import React, { useState, useEffect } from 'react'
import { Download, Shield } from 'lucide-react'
import { getReportSummary } from '../api/client'
import type { ReportSummary } from '../types'

export const ReportsPage: React.FC = () => {
  const [report, setReport] = useState<ReportSummary | null>(null)
  const [loading, setLoading] = useState(true)

  const loadReport = async () => {
    setLoading(true)
    try {
      const data = await getReportSummary()
      setReport(data)
    } catch (err: unknown) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReport()
  }, [])

  const exportCSV = () => {
    if (!report || !report.accounts) return

    const headers = [
      'Service Name',
      'Category',
      'MFA Enabled',
      'Recovery Reviewed',
      'Last Reviewed At',
      'Account Score (pts)',
      'Notes',
    ]

    const rows = report.accounts.map((a) => [
      `"${a.service_name.replace(/"/g, '""')}"`,
      `"${a.category}"`,
      a.mfa_enabled ? 'TRUE' : 'FALSE',
      a.recovery_reviewed ? 'TRUE' : 'FALSE',
      a.last_reviewed_at || 'Never',
      a.score,
      `"${(a.notes || '').replace(/"/g, '""')}"`,
    ])

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `privacypulse-audit-${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Audit Summary & Export</h1>
          <p className="text-sm text-slate-400 mt-1">
            Generate and export personal digital-privacy audit summaries.
          </p>
        </div>
        <button
          onClick={exportCSV}
          disabled={!report || report.accounts.length === 0}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-all cursor-pointer disabled:opacity-50 w-fit"
        >
          <Download className="w-4 h-4" />
          <span>Export Accounts as CSV</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500 text-sm">Generating report...</div>
      ) : !report ? (
        <div className="text-center py-12 text-slate-500 text-sm">Failed to generate report.</div>
      ) : (
        <div className="space-y-6">
          {/* Executive Overview Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Privacy Audit Snapshot</h2>
                  <p className="text-xs text-slate-400">
                    Generated for User ID: <code className="text-slate-300 font-mono">{report.user_id}</code>
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-white">
                  {report.overall_score !== null ? `${report.overall_score} / 100` : 'N/A'}
                </div>
                <div className="text-xs text-emerald-400 font-medium">{report.score_label}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                <div className="text-xs text-slate-400">Accounts Tracked</div>
                <div className="text-xl font-bold text-white mt-1">{report.accounts.length}</div>
              </div>
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                <div className="text-xs text-slate-400">Checklist Items</div>
                <div className="text-xl font-bold text-white mt-1">
                  {report.checklist.filter((c) => c.completed).length} / {report.checklist.length}
                </div>
              </div>
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                <div className="text-xs text-slate-400">Active Reminders</div>
                <div className="text-xl font-bold text-white mt-1">
                  {report.reminders.filter((r) => !r.completed).length}
                </div>
              </div>
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                <div className="text-xs text-slate-400">Logged Incidents</div>
                <div className="text-xl font-bold text-white mt-1">{report.incidents.length}</div>
              </div>
            </div>
          </div>

          {/* Accounts Breakdown Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white">Accounts Inventory</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Service</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">MFA Status</th>
                    <th className="py-3 px-4">Recovery Status</th>
                    <th className="py-3 px-4">Last Reviewed</th>
                    <th className="py-3 px-4 text-right">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {report.accounts.map((acc) => (
                    <tr key={acc.id} className="hover:bg-slate-950/30">
                      <td className="py-3 px-4 font-semibold text-white">{acc.service_name}</td>
                      <td className="py-3 px-4 uppercase text-[10px] font-mono text-slate-400">
                        {acc.category}
                      </td>
                      <td className="py-3 px-4">
                        {acc.mfa_enabled ? (
                          <span className="text-emerald-400 font-medium">Enabled (+40)</span>
                        ) : (
                          <span className="text-rose-400 font-medium">Disabled (0)</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {acc.recovery_reviewed ? (
                          <span className="text-emerald-400 font-medium">Reviewed (+30)</span>
                        ) : (
                          <span className="text-amber-400 font-medium">Pending (0)</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {acc.last_reviewed_at
                          ? new Date(acc.last_reviewed_at).toLocaleDateString()
                          : 'Never'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                        {acc.score} pts
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
