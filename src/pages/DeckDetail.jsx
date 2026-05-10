import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Document, HeadingLevel, Paragraph, TextRun, Packer } from 'docx'
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
      .from('decks').select('*').eq('id', id).eq('user_id', user.id).single()

    if (!deckData) { navigate('/'); return }

    const { data: cardsData } = await supabase
      .from('cards').select('*').eq('deck_id', id).order('created_at', { ascending: false })

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

  async function exportToWord() {
    const children = []
    for (const card of cards) {
      children.push(
        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(card.front)] })
      )
      for (const line of card.back.split('\n')) {
        children.push(new Paragraph({ children: [new TextRun(line)] }))
      }
      children.push(new Paragraph({}))
    }
    const doc = new Document({ sections: [{ properties: {}, children }] })
    const blob = await Packer.toBlob(doc)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${deck.name}.docx`
    a.click()
    URL.revokeObjectURL(url)
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
        <div className="w-6 h-6 border-2 border-rule border-t-foret rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 w-full" style={{ paddingTop: '48px', paddingBottom: '80px' }}>
      {/* Publish modal */}
      {showPublishModal && (
        <div className="fixed inset-0 bg-ink/40 flex items-center justify-center z-50 px-4">
          <div
            className="bg-ivoire-2 rounded-2xl w-full max-w-sm border border-rule p-6 space-y-4"
            style={{ boxShadow: '0 12px 28px -16px rgba(28,24,20,0.18)' }}
          >
            <h2 className="font-display font-semibold text-foret" style={{ fontSize: '22px' }}>
              Publier dans la bibliothèque
            </h2>
            <p className="text-sm text-ink-3">
              Ton deck sera visible par tous les utilisateurs. Ils pourront le copier dans leurs propres decks.
            </p>
            <form onSubmit={confirmPublish} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-[1.5px] text-ink-3 mb-2">
                  Ton nom (optionnel)
                </label>
                <input
                  value={authorName}
                  onChange={e => setAuthorName(e.target.value)}
                  placeholder="Anonyme"
                  className="w-full border-b border-rule bg-transparent text-ink text-sm py-1.5 focus:outline-none focus:border-foret transition-colors placeholder:text-ink-3"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={publishing}
                  className="flex-1 bg-foret text-ivoire text-sm py-2.5 rounded-[18px] hover:brightness-90 disabled:opacity-40 transition-all font-bold"
                >
                  {publishing ? 'Publication…' : 'Publier'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPublishModal(false)}
                  className="flex-1 border border-foret text-foret text-sm py-2.5 rounded-[18px] hover:bg-foret/5 transition-colors font-bold"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="mb-1">
        <Link to="/" className="text-xs font-bold uppercase tracking-[1.5px] text-ink-3 hover:text-ink transition-colors">
          ← Decks
        </Link>
      </div>

      <div className="flex items-start justify-between mb-8">
        <div className="flex-1">
          {editingDeckName ? (
            <form onSubmit={saveDeckName} className="flex gap-3 items-center">
              <input
                autoFocus
                value={deckName}
                onChange={e => setDeckName(e.target.value)}
                className="font-display font-semibold text-foret border-b-2 border-foret focus:outline-none bg-transparent"
                style={{ fontSize: '28px' }}
              />
              <button type="submit" className="text-sm font-bold text-laiton hover:text-foret transition-colors">
                Sauvegarder
              </button>
              <button
                type="button"
                onClick={() => { setEditingDeckName(false); setDeckName(deck.name) }}
                className="text-sm text-ink-3 hover:text-ink transition-colors"
              >
                Annuler
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-3">
              <h1 className="font-display font-semibold text-foret" style={{ fontSize: '32px', lineHeight: '1.05' }}>
                {deck.name}
              </h1>
              <button
                onClick={() => setEditingDeckName(true)}
                className="text-ink-3 hover:text-laiton transition-colors text-sm"
                title="Renommer"
              >
                ✏️
              </button>
            </div>
          )}
          <p className="text-xs font-bold uppercase tracking-[2px] text-ink-3 mt-1">
            {cards.length} carte{cards.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex gap-2 flex-shrink-0">
          {cards.length > 0 && (
            <Link
              to={`/study/${id}`}
              className="bg-foret text-ivoire text-sm px-4 py-2 rounded-[18px] hover:brightness-90 transition-all font-bold"
            >
              Réviser {dueCount > 0 ? `(${dueCount})` : 'tout'}
            </Link>
          )}
          {cards.length > 0 && (
            <button
              onClick={exportToWord}
              className="border border-rule text-ink-2 text-sm px-4 py-2 rounded-[18px] hover:border-laiton transition-colors font-bold"
              title="Exporter en Word (.docx)"
            >
              ↓ Word
            </button>
          )}
          <button
            onClick={() => { setShowCardForm(!showCardForm); setEditingCard(null); setFront(''); setBack('') }}
            className="border border-rule text-ink-2 text-sm px-4 py-2 rounded-[18px] hover:border-laiton transition-colors font-bold"
          >
            + Carte
          </button>
        </div>
      </div>

      {/* Card form */}
      {showCardForm && (
        <form
          onSubmit={saveCard}
          className="bg-ivoire-2 border border-rule rounded-2xl p-5 mb-6 space-y-4"
          style={{ boxShadow: '0 12px 28px -16px rgba(28,24,20,0.18)' }}
        >
          <h3 className="text-xs font-bold uppercase tracking-[1.5px] text-ink-3">
            {editingCard ? 'Modifier la carte' : 'Nouvelle carte'}
          </h3>
          <div>
            <label className="block text-xs text-ink-3 mb-1">Recto (question)</label>
            <textarea
              autoFocus
              value={front}
              onChange={e => setFront(e.target.value)}
              rows={2}
              placeholder="Question…"
              className="w-full border border-rule rounded-[14px] px-3 py-2 text-sm bg-ivoire focus:outline-none focus:border-foret transition-colors resize-none placeholder:text-ink-3"
            />
          </div>
          <div>
            <label className="block text-xs text-ink-3 mb-1">Verso (réponse)</label>
            <CardEditor value={back} onChange={setBack} placeholder="Réponse…" />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving || !front.trim() || !back.trim()}
              className="bg-foret text-ivoire text-sm px-4 py-2 rounded-[18px] hover:brightness-90 disabled:opacity-40 transition-all font-bold"
            >
              {saving ? 'Sauvegarde…' : editingCard ? 'Modifier' : 'Ajouter'}
            </button>
            <button
              type="button"
              onClick={cancelForm}
              className="text-sm px-3 py-2 text-ink-3 hover:text-ink transition-colors"
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      {/* Cards list */}
      {cards.length === 0 ? (
        <div className="text-center py-16 text-ink-3">
          <p className="font-display text-xl mb-2" style={{ fontStyle: 'italic' }}>Aucune carte.</p>
          <p className="text-sm">Ajoutez-en une pour commencer.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {cards.map(card => {
            const due = !card.next_review_date || card.next_review_date <= today
            return (
              <div key={card.id} className="bg-ivoire-2 border border-rule rounded-2xl p-4 flex gap-4 hover:border-laiton transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-ink">{card.front}</p>
                  <div className="text-sm text-ink-3 mt-1 line-clamp-2">
                    <CardRenderer content={card.back} />
                  </div>
                </div>
                <div className="flex items-start gap-3 flex-shrink-0 pt-0.5">
                  {due
                    ? <span className="text-xs font-bold uppercase tracking-[1px] text-seal">À réviser</span>
                    : <span className="text-xs text-ink-3">{card.next_review_date}</span>
                  }
                  <button
                    onClick={() => startEdit(card)}
                    className="text-ink-3 hover:text-laiton transition-colors text-sm"
                    title="Modifier"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => deleteCard(card.id)}
                    className="text-ink-3 hover:text-seal transition-colors text-sm"
                    title="Supprimer"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="mt-12 pt-6 border-t border-rule flex items-center justify-between">
        <button
          onClick={deleteDeck}
          className="text-sm text-seal hover:brightness-75 transition-all font-bold"
        >
          Supprimer ce deck
        </button>
        <button
          onClick={togglePublish}
          disabled={publishing}
          className={`text-sm px-4 py-2 rounded-[18px] transition-all disabled:opacity-40 font-bold ${
            deck?.is_public
              ? 'bg-rate-good/20 text-rate-good border border-rate-good/30 hover:brightness-95'
              : 'border border-foret text-foret hover:bg-foret/5'
          }`}
        >
          {deck?.is_public ? 'Publié · Retirer' : 'Publier dans la bibliothèque'}
        </button>
      </div>
    </div>
  )
}
