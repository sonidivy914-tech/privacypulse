import React, { useState, useEffect } from 'react'
import {
  Bell,
  Plus,
  Clock,
  AlertCircle,
  Trash2,
  Check,
} from 'lucide-react'
import {
  getReminders,
  createReminder,
  updateReminder,
  deleteReminder,
  getAccounts,
} from '../api/client'
import type { Reminder, DigitalAccount } from '../types'

export const RemindersPage: React.FC = () => {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [accounts, setAccounts] = useState<DigitalAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)

  // Form State
  const [title, setTitle] = useState('')
  const [dueAt, setDueAt] = useState('')
  const [selectedAccountId, setSelectedAccountId] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const [rems, accs] = await Promise.all([getReminders(), getAccounts()])
      setReminders(rems)
      setAccounts(accs)
    } catch (err: unknown) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleToggle = async (reminder: Reminder) => {
    const updatedStatus = !reminder.completed
    setReminders((prev) =>
      prev.map((r) => (r.id === reminder.id ? { ...r, completed: updatedStatus } : r))
    )
    try {
      await updateReminder(reminder.id, { completed: updatedStatus })
    } catch {
      loadData()
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !dueAt) return
    setSubmitting(true)
    try {
      const created = await createReminder({
        title: title.trim(),
        due_at: new Date(dueAt).toISOString(),
        account_id: selectedAccountId || undefined,
      })
      setReminders((prev) => [...prev, created])
      setModalOpen(false)
      setTitle('')
      setDueAt('')
      setSelectedAccountId('')
    } catch (err: unknown) {
      if (err instanceof Error) alert(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteReminder(id)
      setReminders((prev) => prev.filter((r) => r.id !== id))
    } catch (err: unknown) {
      if (err instanceof Error) alert(err.message)
    }
  }

  const isOverdue = (dueStr: string, completed: boolean) => {
    if (completed) return false
    return new Date(dueStr) < new Date()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Review Reminders</h1>
          <p className="text-sm text-slate-400 mt-1">
            Schedule recurring security audits and recovery review prompts.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-all cursor-pointer w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>New Reminder</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500 text-sm">Loading reminders...</div>
      ) : reminders.length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <Bell className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-semibold text-slate-300">No Reminders Scheduled</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Set a reminder to review passwords, MFA keys, or recovery email addresses.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reminders.map((rem) => {
            const overdue = isOverdue(rem.due_at, rem.completed)
            return (
              <div
                key={rem.id}
                className={`p-4 rounded-xl border transition-all flex items-start justify-between space-x-3 ${
                  rem.completed
                    ? 'bg-slate-950/60 border-slate-800/60 opacity-80'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <button
                    onClick={() => handleToggle(rem)}
                    className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                      rem.completed
                        ? 'bg-emerald-500 text-slate-950'
                        : 'border border-slate-700 hover:border-emerald-400 text-transparent'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </button>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-sm font-semibold tracking-tight ${
                          rem.completed ? 'line-through text-slate-400' : 'text-white'
                        }`}
                      >
                        {rem.title}
                      </span>
                      {rem.account_name && (
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                          {rem.account_name}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 text-xs">
                      <span
                        className={`flex items-center space-x-1 ${
                          overdue ? 'text-rose-400 font-semibold' : 'text-slate-400'
                        }`}
                      >
                        {overdue ? (
                          <AlertCircle className="w-3.5 h-3.5" />
                        ) : (
                          <Clock className="w-3.5 h-3.5" />
                        )}
                        <span>Due: {new Date(rem.due_at).toLocaleDateString()}</span>
                        {overdue && <span className="uppercase font-bold text-[10px] ml-1">(Overdue)</span>}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(rem.id)}
                  className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                  title="Delete reminder"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-5 space-y-4">
            <h2 className="text-lg font-bold text-white">Create Review Reminder</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Audit Google MFA & App Passwords"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Due Date *</label>
                <input
                  type="date"
                  required
                  value={dueAt}
                  onChange={(e) => setDueAt(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Link to Digital Account (Optional)
                </label>
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">None (General reminder)</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.service_name} ({acc.category})
                    </option>
                  ))}
                </select>
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
                  {submitting ? 'Creating...' : 'Create Reminder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
