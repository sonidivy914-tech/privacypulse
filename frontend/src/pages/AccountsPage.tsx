import React, { useState, useEffect } from 'react'
import {
  KeyRound,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Calendar,
  Trash2,
  Edit2,
  ShieldCheck,
  AlertCircle,
  Clock,
} from 'lucide-react'
import {
  getAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
} from '../api/client'
import type { DigitalAccount, AccountCategory } from '../types'

export const AccountsPage: React.FC = () => {
  const [accounts, setAccounts] = useState<DigitalAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  // Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<DigitalAccount | null>(null)
  const [serviceName, setServiceName] = useState('')
  const [category, setCategory] = useState<AccountCategory>('social')
  const [mfaEnabled, setMfaEnabled] = useState(false)
  const [recoveryReviewed, setRecoveryReviewed] = useState(false)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const loadAccounts = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getAccounts()
      setAccounts(data)
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message)
      else setError('Failed to load accounts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAccounts()
  }, [])

  const openCreateModal = () => {
    setEditingAccount(null)
    setServiceName('')
    setCategory('social')
    setMfaEnabled(false)
    setRecoveryReviewed(false)
    setNotes('')
    setModalOpen(true)
  }

  const openEditModal = (acc: DigitalAccount) => {
    setEditingAccount(acc)
    setServiceName(acc.service_name)
    setCategory(acc.category)
    setMfaEnabled(acc.mfa_enabled)
    setRecoveryReviewed(acc.recovery_reviewed)
    setNotes(acc.notes || '')
    setModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (editingAccount) {
        await updateAccount(editingAccount.id, {
          service_name: serviceName,
          category,
          mfa_enabled: mfaEnabled,
          recovery_reviewed: recoveryReviewed,
          notes,
        })
      } else {
        await createAccount({
          service_name: serviceName,
          category,
          mfa_enabled: mfaEnabled,
          recovery_reviewed: recoveryReviewed,
          last_reviewed_at: new Date().toISOString(),
          notes,
        })
      }
      setModalOpen(false)
      loadAccounts()
    } catch (err: unknown) {
      if (err instanceof Error) alert(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return
    try {
      await deleteAccount(id)
      setAccounts((prev) => prev.filter((a) => a.id !== id))
    } catch (err: unknown) {
      if (err instanceof Error) alert(err.message)
    }
  }

  const handleMarkReviewedNow = async (acc: DigitalAccount) => {
    try {
      const updated = await updateAccount(acc.id, {
        last_reviewed_at: new Date().toISOString(),
      })
      setAccounts((prev) => prev.map((a) => (a.id === acc.id ? updated : a)))
    } catch (err: unknown) {
      if (err instanceof Error) alert(err.message)
    }
  }

  const isReviewOverdue = (dateStr: string | null) => {
    if (!dateStr) return true
    const date = new Date(dateStr)
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    return date < ninetyDaysAgo
  }

  const filteredAccounts = accounts.filter((acc) => {
    const matchesSearch = acc.service_name.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || acc.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Digital Accounts</h1>
          <p className="text-sm text-slate-400 mt-1">
            Monitor self-reported credentials security, MFA enforcement, and audit intervals.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold shadow-lg shadow-emerald-950/40 transition-all cursor-pointer w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>Add Digital Account</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search accounts by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-emerald-500"
        >
          <option value="all">All Categories</option>
          <option value="social">Social</option>
          <option value="finance">Finance</option>
          <option value="shopping">Shopping</option>
          <option value="work">Work</option>
          <option value="entertainment">Entertainment</option>
          <option value="other">Other</option>
        </select>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
          {error}
        </div>
      )}

      {/* Accounts List */}
      {loading ? (
        <div className="text-center py-12 text-slate-500 text-sm">Loading accounts...</div>
      ) : filteredAccounts.length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <KeyRound className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-semibold text-slate-300">
            {search ? 'No accounts match your search' : 'Add your first account'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {search
              ? 'Try adjusting your search filter or category.'
              : 'Add an account (like email, bank, or social) to track your MFA and security review schedule.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAccounts.map((acc) => {
            const overdue = isReviewOverdue(acc.last_reviewed_at)
            return (
              <div
                key={acc.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between hover:border-slate-700 transition-colors"
              >
                <div className="space-y-4">
                  {/* Top: Service name, category, and score */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-bold text-white tracking-tight">
                        {acc.service_name}
                      </h3>
                      <span className="inline-block text-[10px] uppercase font-mono px-2 py-0.5 mt-1 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        {acc.category}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-bold">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{acc.score} pts</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Pills */}
                  <div className="space-y-2 text-xs pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Two-Factor Auth (MFA):</span>
                      {acc.mfa_enabled ? (
                        <span className="flex items-center space-x-1 text-emerald-400 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Enabled (+40)</span>
                        </span>
                      ) : (
                        <span className="flex items-center space-x-1 text-rose-400 font-medium">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Disabled (0)</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Recovery Reviewed:</span>
                      {acc.recovery_reviewed ? (
                        <span className="flex items-center space-x-1 text-emerald-400 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Reviewed (+30)</span>
                        </span>
                      ) : (
                        <span className="flex items-center space-x-1 text-amber-400 font-medium">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Pending (0)</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Last Reviewed:</span>
                      <span
                        className={`flex items-center space-x-1 font-medium ${
                          overdue ? 'text-amber-400' : 'text-slate-300'
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        <span>
                          {acc.last_reviewed_at
                            ? new Date(acc.last_reviewed_at).toLocaleDateString()
                            : 'Never'}
                          {overdue ? ' (>90d)' : ' (+30)'}
                        </span>
                      </span>
                    </div>
                  </div>

                  {acc.notes && (
                    <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400">
                      {acc.notes}
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between text-xs">
                  <button
                    onClick={() => handleMarkReviewedNow(acc)}
                    className="text-emerald-400 hover:text-emerald-300 flex items-center space-x-1 cursor-pointer font-medium"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Review Now</span>
                  </button>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => openEditModal(acc)}
                      className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      title="Edit Account"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(acc.id, acc.service_name)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      title="Delete Account"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 bg-slate-950/40">
              <h2 className="text-lg font-bold text-white">
                {editingAccount ? 'Edit Digital Account' : 'Add Digital Account'}
              </h2>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Service Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GitHub, ProtonMail, Google"
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as AccountCategory)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="social">Social</option>
                  <option value="finance">Finance</option>
                  <option value="shopping">Shopping</option>
                  <option value="work">Work</option>
                  <option value="entertainment">Entertainment</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="space-y-3 pt-2">
                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mfaEnabled}
                    onChange={(e) => setMfaEnabled(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-500 bg-slate-950 border-slate-800 focus:ring-0"
                  />
                  <div>
                    <span className="text-xs font-medium text-slate-200">
                      Two-Factor Authentication (MFA) Enabled
                    </span>
                    <span className="block text-[11px] text-slate-500">
                      Authenticator app or hardware key active (+40 pts)
                    </span>
                  </div>
                </label>

                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={recoveryReviewed}
                    onChange={(e) => setRecoveryReviewed(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-500 bg-slate-950 border-slate-800 focus:ring-0"
                  />
                  <div>
                    <span className="text-xs font-medium text-slate-200">
                      Account Recovery Settings Reviewed
                    </span>
                    <span className="block text-[11px] text-slate-500">
                      Backup email, recovery codes stored securely (+30 pts)
                    </span>
                  </div>
                </label>
              </div>

              <div className="space-y-1 pt-2">
                <label className="text-xs font-semibold text-slate-300">Notes (Non-sensitive)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Hardware YubiKey attached to primary login"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[10px] text-rose-400 font-medium">
                  ⚠️ Never store passwords, recovery codes, or authentication secrets in notes.
                </p>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

