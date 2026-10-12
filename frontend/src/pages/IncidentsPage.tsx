import React, { useState, useEffect } from 'react'
import { Plus, ShieldAlert, Clock, Trash2 } from 'lucide-react'
import {
  getIncidents,
  createIncident,
  updateIncident,
  deleteIncident,
} from '../api/client'
import type { Incident, IncidentSeverity, IncidentStatus } from '../types'

export const IncidentsPage: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)

  // Form
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [severity, setSeverity] = useState<IncidentSeverity>('medium')
  const [status, setStatus] = useState<IncidentStatus>('open')
  const [submitting, setSubmitting] = useState(false)

  const loadIncidents = async () => {
    setLoading(true)
    try {
      const data = await getIncidents()
      setIncidents(data)
    } catch (err: unknown) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadIncidents()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setSubmitting(true)
    try {
      const created = await createIncident({
        title: title.trim(),
        description: description.trim() || undefined,
        severity,
        status,
        occurred_at: new Date().toISOString(),
      })
      setIncidents((prev) => [created, ...prev])
      setModalOpen(false)
      setTitle('')
      setDescription('')
      setSeverity('medium')
      setStatus('open')
    } catch (err: unknown) {
      if (err instanceof Error) alert(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleStatusChange = async (id: string, newStatus: IncidentStatus) => {
    setIncidents((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: newStatus } : i))
    )
    try {
      await updateIncident(id, { status: newStatus })
    } catch {
      loadIncidents()
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteIncident(id)
      setIncidents((prev) => prev.filter((i) => i.id !== id))
    } catch (err: unknown) {
      if (err instanceof Error) alert(err.message)
    }
  }

  const severityBadge = (sev: IncidentSeverity) => {
    switch (sev) {
      case 'high':
        return 'bg-rose-500/10 border-rose-500/30 text-rose-400'
      case 'medium':
        return 'bg-amber-500/10 border-amber-500/30 text-amber-400'
      default:
        return 'bg-blue-500/10 border-blue-500/30 text-blue-400'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Incident Journal</h1>
          <p className="text-sm text-slate-400 mt-1">
            Private log of suspicious emails, compromised passwords, or credential alerts.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-all cursor-pointer w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>Log Security Event</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500 text-sm">Loading incident journal...</div>
      ) : incidents.length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <ShieldAlert className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-semibold text-slate-300">Clean Journal</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No security incidents or suspicious occurrences logged. Keep vigilance!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {incidents.map((inc) => (
            <div
              key={inc.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-bold text-white">{inc.title}</h3>
                    <span
                      className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded border ${severityBadge(
                        inc.severity
                      )}`}
                    >
                      {inc.severity} Severity
                    </span>
                  </div>
                  {inc.occurred_at && (
                    <div className="flex items-center space-x-1 text-xs text-slate-500 mt-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(inc.occurred_at).toLocaleString()}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <select
                    value={inc.status}
                    onChange={(e) => handleStatusChange(inc.id, e.target.value as IncidentStatus)}
                    className="text-xs px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="open">Open</option>
                    <option value="investigating">Investigating</option>
                    <option value="resolved">Resolved</option>
                  </select>
                  <button
                    onClick={() => handleDelete(inc.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {inc.description && (
                <p className="text-xs text-slate-400 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                  {inc.description}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-5 space-y-4">
            <h2 className="text-lg font-bold text-white">Log Security Incident</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Incident Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Credential stuffing alert on Netflix"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Severity</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as IncidentSeverity)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as IncidentStatus)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="open">Open</option>
                    <option value="investigating">Investigating</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Description / Actions Taken</label>
                <textarea
                  rows={3}
                  placeholder="Describe suspicious sender, what password was reset, etc."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Logging...' : 'Log Incident'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
