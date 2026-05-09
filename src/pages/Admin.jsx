import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { ADMIN_EMAIL } from '../lib/admin'

export default function Admin() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.email !== ADMIN_EMAIL) { navigate('/'); return }
    fetchNotifications()
  }, [user])

  async function fetchNotifications() {
    setLoading(true)
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
    setNotifications(data || [])
    setLoading(false)
  }

  async function send(e) {
    e.preventDefault()
    if (!title.trim()) return
    setSending(true)
    const { error } = await supabase
      .from('notifications')
      .insert({ title: title.trim(), body: body.trim() || null })
    if (!error) {
      setTitle('')
      setBody('')
      setSent(true)
      setTimeout(() => setSent(false), 2000)
      fetchNotifications()
    }
    setSending(false)
  }

  async function deleteNotification(id) {
    if (!confirm('Supprimer cette notification ?')) return
    await supabase.from('notifications').delete().eq('id', id)
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  if (user?.email !== ADMIN_EMAIL) return null

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 w-full">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-gray-900 mb-1">Administration</h1>
        <p className="text-sm text-gray-500">Envoyer des notifications à tous les utilisateurs</p>
      </div>

      <form onSubmit={send} className="bg-white border border-gray-200 rounded-xl p-5 mb-8 space-y-3">
        <h2 className="text-sm font-medium text-gray-700">Nouvelle notification</h2>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Titre *</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Ex: Nouvelles cartes disponibles"
            required
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Message (optionnel)</label>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Détails supplémentaires…"
            rows={3}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>
        <button
          type="submit"
          disabled={sending || !title.trim()}
          className="bg-indigo-600 text-white text-sm px-5 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {sent ? 'Envoyé ✓' : sending ? 'Envoi…' : 'Envoyer à tous'}
        </button>
      </form>

      <div>
        <h2 className="text-sm font-medium text-gray-700 mb-3">Notifications envoyées</h2>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 border-2 border-gray-300 border-t-indigo-600 rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">Aucune notification envoyée.</p>
        ) : (
          <div className="space-y-2">
            {notifications.map(n => (
              <div key={n.id} className="bg-white border border-gray-200 rounded-xl p-4 flex gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{n.title}</p>
                  {n.body && <p className="text-sm text-gray-500 mt-0.5 whitespace-pre-wrap">{n.body}</p>}
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(n.created_at).toLocaleDateString('fr-CA', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <button
                  onClick={() => deleteNotification(n.id)}
                  className="text-gray-400 hover:text-red-500 text-sm flex-shrink-0"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
