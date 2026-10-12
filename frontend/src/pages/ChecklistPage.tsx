import React, { useState, useEffect } from 'react'
import { CheckSquare, Plus, Check, Trash2, Calendar } from 'lucide-react'
import {
  getChecklist,
  createChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
} from '../api/client'
import type { ChecklistItem } from '../types'

const DEFAULT_RECOMMENDED_HABITS = [
  {
    title: 'Audit browser extensions',
    description: 'Remove inactive or suspicious Chrome/Firefox extensions that have read access.',
    category: 'browsing',
  },
  {
    title: 'Enable Full Disk Encryption',
    description: 'Ensure BitLocker (Windows) or FileVault (macOS) is active on primary laptop.',
    category: 'devices',
  },
  {
    title: 'Review Google / Apple Location History',
    description: 'Set location history auto-delete to 3 months and prune sensitive timeline data.',
    category: 'privacy',
  },
  {
    title: 'Prune third-party OAuth app authorizations',
    description: 'Check Google/GitHub/Apple "Sign in with" permissions and revoke unused apps.',
    category: 'accounts',
  },
  {
    title: 'Freeze or lock credit reports',
    description: 'Freeze credit reporting bureaus to prevent unauthorized identity inquiries.',
    category: 'finance',
  },
]

export const ChecklistPage: React.FC = () => {
  const [items, setItems] = useState<ChecklistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newCategory, setNewCategory] = useState('general')
  const [isAdding, setIsAdding] = useState(false)

  const loadChecklist = async () => {
    setLoading(true)
    try {
      let data = await getChecklist()
      // If list is empty, pre-populate default recommended items
      if (data.length === 0) {
        for (const habit of DEFAULT_RECOMMENDED_HABITS) {
          await createChecklistItem(habit)
        }
        data = await getChecklist()
      }
      setItems(data)
    } catch (err: unknown) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadChecklist()
  }, [])

  const handleToggle = async (item: ChecklistItem) => {
    const updatedStatus = !item.completed
    // Optimistic UI update
    setItems((prev) =>
      prev.map((i) =>
        i.id === item.id
          ? {
              ...i,
              completed: updatedStatus,
              completed_at: updatedStatus ? new Date().toISOString() : null,
            }
          : i
      )
    )

    try {
      await updateChecklistItem(item.id, { completed: updatedStatus })
    } catch {
      // Revert if failed
      loadChecklist()
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return
    try {
      const created = await createChecklistItem({
        title: newTitle.trim(),
        description: newDescription.trim() || undefined,
        category: newCategory,
      })
      setItems((prev) => [...prev, created])
      setNewTitle('')
      setNewDescription('')
      setIsAdding(false)
    } catch (err: unknown) {
      if (err instanceof Error) alert(err.message)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteChecklistItem(id)
      setItems((prev) => prev.filter((i) => i.id !== id))
    } catch (err: unknown) {
      if (err instanceof Error) alert(err.message)
    }
  }

  const completedCount = items.filter((i) => i.completed).length
  const totalCount = items.length
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Privacy Checklist</h1>
          <p className="text-sm text-slate-400 mt-1">
            Standard baseline security hygiene tasks and periodic audit checklists.
          </p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-all cursor-pointer w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>Add Custom Task</span>
        </button>
      </div>

      {/* Progress Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
              Checklist Completion
            </span>
            <div className="text-xl font-bold text-white mt-1">
              {completedCount} of {totalCount} items completed ({percentage}%)
            </div>
          </div>
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
            <CheckSquare className="w-6 h-6" />
          </div>
        </div>
        <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
          <div
            className="bg-emerald-500 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>

      {/* Add Custom Form */}
      {isAdding && (
        <form
          onSubmit={handleAdd}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4"
        >
          <h3 className="text-sm font-bold text-white">Add New Hygiene Item</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs text-slate-400">Item Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Turn off personalized ad tracking in OS"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-400">Category</label>
              <input
                type="text"
                placeholder="e.g. privacy, devices, accounts"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-400">Description / Rationale</label>
            <input
              type="text"
              placeholder="Why this item matters or how to perform it"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg cursor-pointer"
            >
              Add Item
            </button>
          </div>
        </form>
      )}

      {/* Items List */}
      {loading ? (
        <div className="text-center py-12 text-slate-500 text-sm">Loading checklist...</div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-xl border transition-all flex items-start justify-between space-x-3 ${
                item.completed
                  ? 'bg-slate-950/60 border-slate-800/60 opacity-80'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start space-x-3">
                <button
                  onClick={() => handleToggle(item)}
                  className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                    item.completed
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
                        item.completed ? 'line-through text-slate-400' : 'text-white'
                      }`}
                    >
                      {item.title}
                    </span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      {item.category}
                    </span>
                  </div>
                  {item.description && (
                    <p className="text-xs text-slate-400">{item.description}</p>
                  )}
                  {item.completed && item.completed_at && (
                    <div className="flex items-center space-x-1 text-[11px] text-emerald-400/80 pt-1">
                      <Calendar className="w-3 h-3" />
                      <span>Completed {new Date(item.completed_at).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => handleDelete(item.id)}
                className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                title="Delete item"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

