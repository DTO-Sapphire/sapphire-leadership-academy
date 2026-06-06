import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import NavBar from '../../components/NavBar'
import toast from 'react-hot-toast'
import { Trash2 } from 'lucide-react'

const AREAS = [
  'Communication', 'Delegation', 'Accountability', 'Planning',
  'Emotional Intelligence', 'Coaching & Mentoring', 'Decision Making', 'Conflict Resolution',
  'Team Development', 'Strategic Thinking', 'Other',
]

export default function Commit() {
  const { participant } = useAuth()
  const [commitments, setCommitments] = useState([])
  const [form, setForm] = useState({ commitment_area: '', description: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!participant) return
    load()
  }, [participant])

  async function load() {
    const { data } = await supabase.from('commitments').select('*')
      .eq('participant_id', participant.id).order('created_at', { ascending: false })
    setCommitments(data || [])
    setLoading(false)
  }

  async function add(e) {
    e.preventDefault()
    if (!form.commitment_area) { toast.error('Select a commitment area'); return }
    setSaving(true)
    try {
      const { error } = await supabase.from('commitments').insert({
        participant_id: participant.id, ...form
      })
      if (error) throw error
      toast.success('Commitment added!')
      setForm({ commitment_area: '', description: '' })
      await load()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function remove(id) {
    const { error } = await supabase.from('commitments').delete().eq('id', id)
    if (error) toast.error(error.message)
    else { toast.success('Commitment removed'); await load() }
  }

  if (loading) return <div className="min-h-screen bg-gray-50"><NavBar /><div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1F4E79]" /></div></div>

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="max-w-xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Leadership Commitments</h1>
        <p className="text-gray-500 text-sm mb-6">What will you commit to changing as a result of this programme?</p>

        <div className="card mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Add a Commitment</h2>
          <form onSubmit={add} className="space-y-3">
            <div>
              <label className="label">Commitment Area *</label>
              <select className="input" value={form.commitment_area}
                onChange={e => setForm(f => ({ ...f, commitment_area: e.target.value }))}>
                <option value="">Select area...</option>
                {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Description (optional)</label>
              <textarea className="input" rows={3} value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Specifically, I will..." />
            </div>
            <button type="submit" disabled={saving} className="btn-primary w-full">
              {saving ? 'Saving...' : 'Add Commitment'}
            </button>
          </form>
        </div>

        <div className="space-y-3">
          {commitments.length === 0 ? (
            <div className="card text-center text-gray-500">
              <p className="text-3xl mb-2">🎯</p>
              <p>No commitments yet. Add your first leadership commitment above.</p>
            </div>
          ) : commitments.map(c => (
            <div key={c.id} className="card flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-[#1F4E79] mt-2 shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-gray-900 text-sm">{c.commitment_area}</p>
                {c.description && <p className="text-gray-600 text-sm mt-1">{c.description}</p>}
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(c.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <button onClick={() => remove(c.id)} className="text-gray-300 hover:text-red-400 transition-colors">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
