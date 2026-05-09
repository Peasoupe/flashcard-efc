import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import CardEditor from '../components/CardEditor'
import CardRenderer from '../components/CardRenderer'

export default function DeckDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [deck, setDeck] = useState(null)
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCardForm, setShowCardForm] = useState(false)
  const [editingCard, setEditingCard] = useState(null)
  const [editingDeckName, setEditingDeckName] = useState(false)
  const [deckName, setDeckName] = useState('')
  const [front, setFront] = useState('')
  const [back, setBack] = useState('')
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [showPublishModal, setShowPublishModal] = useState(false)
  const [authorName, setAuthorName] = useState('')

  useEffect(() => { fetchDeck() }, [id])

  async function fetchDeck() {
    setLoading(true)
    const { data: deckData } = await supabase
      .from('decks')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!deckData) { navigate('/'); return }

    const { data: cardsData } = await supabase
      .from('cards')
      .select('*')
      .eq('deck_id', id)
      .order('created_at', { ascending: false })

    setDeck(deckData)
    setDeckName(deckData.name)
    setCards(cardsData || [])
    setLoading(false)
  }

  async function saveCard(e) {
    e.preventDefault()
    if (!front.trim() || !back.trim()) return
    setSaving(true)

    if (editingCard) {
      await supabase.from('cards').update({ front: front.trim(), back: back.trim() }).eq('id', editingCard.id)
    } else {
      await supabase.from('cards').insert({ deck_id: id, front: front.trim(), back: back.trim() })
    }

    setFront(''); setBack(''); setShowCardForm(false); setEditingCard(null)
    setSaving(false)
    fetchDeck()
  }

  async function deleteCard(cardId) {
    if (!confirm('Supprimer cette carte ?')) return
    await supabase.from('cards').delete().eq('id', cardId)
    setCards(prev => prev.filter(c => c.id !== cardId))
  }

  async function saveDeckName(e) {
    e.preventDefault()
    if (!deckName.trim()) return
    await supabase.from('decks').update({ name: deckName.trim() }).eq('id', id)
    setDeck(prev => ({ ...prev, name: deckName.trim() }))
    setEditingDeckName(false)
  }

  async function togglePublish() {
    if (!deck.is_public) {
      setShowPublishModal(true)
    } else {
      setPublishing(true)
      await supabase.from('decks').update({ is_public: false, published_at: null }).eq('id', id)
      setDeck(prev => ({ ...prev, is_public: false }))
      setPublishing(false)
    }
  }

  async function confirmPublish(e) {
    e.preventDefault()
    setPublishing(true)
    await supabase.from('decks').update({
      is_public: true,
      author_name: authorName.trim() || 'Anonyme',
      published_at: new Date().toISOString(),
    }).eq('id', id)
    setDeck(prev => ({ ...prev, is_public: true, author_name: authorName.trim() || 'Anonyme' }))
    setShowPublishModal(false)
    setPublishing(false)
  }

  async function deleteDeck() {
    if (!confirm(`Supprimer le deck "${deck.name}" et toutes ses cartes ?`)) return
    await supabase.from('cards').delete().eq('deck_id', id)
    await supabase.from('decks').delete().eq('id', id)
    navigate('/')
  }

  function startEdit(card) {
    setEditingCard(card)
    setFront(card.front)
    setBack(card.back)
    setShowCardForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelForm() {
    setShowCardForm(false)
    setEditingCard(null)
    setFront('')
    setBack('')
  }

  const today = new Date().toISOString().split('T')[0]
  const dueCount = cards.filter(c => !c.next_review_date || c.next_review_date <= today).length

  if (loading) {
    return (
      <div className="flex items-center justify-center flex-1">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 w-full">
      {/* Publish modal */}
      {showPublishModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Publier dans la bibliothèque</h2>
            <p className="text-sm text-gray-500">Ton deck sera visible par tous les utilisateurs. Ils pourront le copier dans leurs propres decks.</p>
            <form onSubmit={confirmPublish} className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Ton nom (optionnel)</label>
                <input
                  value={authorName}
                  onChange={e => setAuthorName(e.target.value)}
                  placeholder="Anonyme"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={publishing}
                  className="flex-1 bg-indigo-600 text-white text-sm py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {publishing ? 'Publication…' : 'Publier'}
                </button>
                <button type="button" onClick={() => setShowPublishModal(false)} className="flex-1 border border-gray-200 text-sm py-2 rounded-lg text-gray-600 hover:bg-gray-50">
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 mb-1">
        <Link to="/" className="text-sm text-gray-400 hover:text-gray-600">← Decks</Link>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          {editingDeckName ? (
            <form onSubmit={saveDeckName} className="flex gap-2 items-center">
              <input
                autoFocus
                value={deckName}
                onChange={e => setDeckName(e.target.value)}
                className="text-xl font-semibold border-b-2 border-indigo-500 focus:outline-none bg-transparent"
              />
              <button type="submit" className="text-sm text-indigo-600 hover:underline">Sauvegarder</button>
              <button type="button" onClick={() => { setEditingDeckName(false); setDeckName(deck.name) }} className="text-sm text-gray-400 hover:text-gray-600">Annuler</button>
            </form>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-gray-900">{deck.name}</h1>
              <button onClick={() => setEditingDeckName(true)} className="text-gray-400 hover:text-gray-600 text-sm">✏️</button>
            </div>
          )}
          <p className="text-sm text-gray-500 mt-1">{cards.length} carte{cards.length !== 1 ? 's' : ''}</p>
        </div>

        <div className="flex gap-2 flex-shrink-0">
          {cards.length > 0 && (
            <Link
              to={`/study/${id}`}
              className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Réviser {dueCount > 0 ? `(${dueCount})` : 'tout'}
            </Link>
          )}
          <button
            onClick={() => { setShowCardForm(!showCardForm); setEditingCard(null); setFront(''); setBack('') }}
            className="border border-gray-200 text-gray-700 text-sm px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            + Carte
          </button>
        </div>
      </div>

      {/* Card form */}
      {showCardForm && (
        <form onSubmit={saveCard} className="bg-white border border-indigo-200 rounded-xl p-4 mb-6 space-y-3">
          <h3 className="text-sm font-medium text-gray-700">
            {editingCard ? 'Modifier la carte' : 'Nouvelle carte'}
          </h3>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Recto (question)</label>
            <textarea
              autoFocus
              value={front}
              onChange={e => setFront(e.target.value)}
              rows={2}
              placeholder="Question…"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Verso (réponse)</label>
            <CardEditor value={back} onChange={setBack} placeholder="Réponse…" />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving || !front.trim() || !back.trim()}
              className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Sauvegarde…' : editingCard ? 'Modifier' : 'Ajouter'}
            </button>
            <button type="button" onClick={cancelForm} className="text-sm px-3 py-2 text-gray-500 hover:text-gray-700">
              Annuler
            </button>
          </div>
        </form>
      )}

      {/* Cards list */}
      {cards.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🃏</p>
          <p className="text-sm">Aucune carte. Ajoutez-en une !</p>
        </div>
      ) : (
        <div className="space-y-2">
          {cards.map(card => {
            const due = !card.next_review_date || card.next_review_date <= today
            return (
              <div key={card.id} className="bg-white border border-gray-200 rounded-xl p-4 flex gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{card.front}</p>
                  <div className="text-sm text-gray-500 mt-1 line-clamp-2">
                    <CardRenderer content={card.back} />
                  </div>
                </div>
                <div className="flex items-start gap-3 flex-shrink-0 pt-0.5">
                  {due
                    ? <span className="text-xs text-indigo-600 font-medium">À réviser</span>
                    : <span className="text-xs text-gray-400">{card.next_review_date}</span>
                  }
                  <button onClick={() => startEdit(card)} className="text-gray-400 hover:text-gray-600 text-sm">✏️</button>
                  <button onClick={() => deleteCard(card.id)} className="text-gray-400 hover:text-red-500 text-sm">🗑️</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="mt-12 pt-6 border-t border-gray-100 flex items-center justify-between">
        <button onClick={deleteDeck} className="text-sm text-red-500 hover:text-red-700 transition-colors">
          Supprimer ce deck
        </button>
        <button
          onClick={togglePublish}
          disabled={publishing}
          className={`text-sm px-4 py-2 rounded-lg transition-colors disabled:opacity-50 ${
            deck?.is_public
              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
              : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          {deck?.is_public ? '🌐 Publié · Retirer' : '🌐 Publier dans la bibliothèque'}
        </button>
      </div>
    </div>
  )
}
