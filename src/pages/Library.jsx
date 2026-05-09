import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export default function Library() {
  const { user } = useAuth()
  const [decks, setDecks] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [copying, setCopying] = useState(null)
  const [copied, setCopied] = useState({})

  useEffect(() => { fetchPublicDecks() }, [])

  async function fetchPublicDecks() {
    setLoading(true)
    const { data } = await supabase
      .from('decks')
      .select('id, name, author_name, published_at, user_id, cards(id)')
      .eq('is_public', true)
      .order('published_at', { ascending: false })

    setDecks(data || [])
    setLoading(false)
  }

  async function copyDeck(deck) {
    setCopying(deck.id)

    const { data: newDeck, error } = await supabase
      .from('decks')
      .insert({ name: deck.name, user_id: user.id })
      .select()
      .single()

    if (error) { setCopying(null); return }

    const { data: cards } = await supabase
      .from('cards')
      .select('front, back')
      .eq('deck_id', deck.id)

    if (cards?.length) {
      await supabase.from('cards').insert(
        cards.map(c => ({ deck_id: newDeck.id, front: c.front, back: c.back }))
      )
    }

    setCopied(prev => ({ ...prev, [deck.id]: true }))
    setCopying(null)
  }

  const filtered = decks.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    (d.author_name || '').toLowerCase().includes(search.toLowerCase())
  )

  const isOwnDeck = (deck) => deck.user_id === user.id

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 w-full">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900 mb-1">Bibliothèque</h1>
        <p className="text-sm text-gray-500">Decks partagés par la communauté</p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher un deck…"
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-sm">
            {search ? 'Aucun deck trouvé pour cette recherche.' : 'Aucun deck publié pour l\'instant.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map(deck => (
            <div key={deck.id} className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0 mr-3">
                  <h3 className="font-medium text-gray-900 truncate">{deck.name}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    par {deck.author_name || 'Anonyme'} · {deck.cards?.length ?? 0} carte{(deck.cards?.length ?? 0) !== 1 ? 's' : ''}
                  </p>
                </div>

                {isOwnDeck(deck) ? (
                  <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full flex-shrink-0">
                    Mon deck
                  </span>
                ) : copied[deck.id] ? (
                  <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full flex-shrink-0">
                    Copié ✓
                  </span>
                ) : (
                  <button
                    onClick={() => copyDeck(deck)}
                    disabled={copying === deck.id}
                    className="text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
                  >
                    {copying === deck.id ? 'Copie…' : 'Copier'}
                  </button>
                )}
              </div>

              {deck.published_at && (
                <p className="text-xs text-gray-300 mt-2">
                  {new Date(deck.published_at).toLocaleDateString('fr-CA', { year: 'numeric', month: 'short', day: 'numeric' })}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
