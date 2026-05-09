import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/)
  const cards = []

  for (const line of lines) {
    if (!line.trim()) continue

    // Support comma and semicolon separators, handle quoted fields
    let cols
    if (line.includes('"')) {
      const regex = /("([^"]*)"|([^,;]+))[,;]?/g
      cols = []
      let match
      while ((match = regex.exec(line)) !== null) {
        cols.push((match[2] ?? match[3] ?? '').trim())
      }
    } else {
      const sep = line.includes(';') ? ';' : ','
      cols = line.split(sep).map(c => c.trim())
    }

    if (cols.length >= 2 && cols[0] && cols[1]) {
      cards.push({ front: cols[0], back: cols[1] })
    }
  }

  return cards
}

function ImportModal({ onClose, onImported }) {
  const { user } = useAuth()
  const fileRef = useRef()
  const [deckName, setDeckName] = useState('')
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState('')
  const [importing, setImporting] = useState(false)

  function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    setError('')
    setDeckName(file.name.replace(/\.csv$/i, ''))

    const reader = new FileReader()
    reader.onload = (evt) => {
      const cards = parseCSV(evt.target.result)
      if (cards.length === 0) {
        setError('Aucune carte trouvée. Vérifiez que le fichier a deux colonnes (question, réponse).')
        setPreview(null)
      } else {
        setPreview(cards)
      }
    }
    reader.readAsText(file, 'UTF-8')
  }

  async function handleImport() {
    if (!deckName.trim() || !preview?.length) return
    setImporting(true)

    const { data: deck, error: deckErr } = await supabase
      .from('decks')
      .insert({ name: deckName.trim(), user_id: user.id })
      .select()
      .single()

    if (deckErr) { setError('Erreur lors de la création du deck.'); setImporting(false); return }

    const cardRows = preview.map(c => ({ deck_id: deck.id, front: c.front, back: c.back }))
    const { error: cardsErr } = await supabase.from('cards').insert(cardRows)

    if (cardsErr) { setError('Erreur lors de l\'import des cartes.'); setImporting(false); return }

    onImported()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Importer un CSV</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <div className="p-5 space-y-4">
          {/* Format hint */}
          <div className="bg-gray-50 rounded-lg px-4 py-3 text-xs text-gray-500 space-y-1">
            <p className="font-medium text-gray-700">Format attendu :</p>
            <p>Deux colonnes séparées par une virgule ou un point-virgule.</p>
            <p className="font-mono bg-white border border-gray-200 rounded px-2 py-1 mt-1">
              question,réponse<br />
              Capitale du Québec,Québec City<br />
              Qu'est-ce que le PIB?,Produit intérieur brut
            </p>
            <p>La première ligne peut être un en-tête (elle sera ignorée si elle ne ressemble pas à une carte).</p>
          </div>

          {/* File picker */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">Fichier CSV</label>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFile}
              className="w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-700 file:text-sm hover:file:bg-indigo-100 cursor-pointer"
            />
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          {/* Deck name */}
          {preview && (
            <div>
              <label className="block text-sm text-gray-600 mb-1">Nom du deck</label>
              <input
                value={deckName}
                onChange={e => setDeckName(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          {/* Preview */}
          {preview && (
            <div>
              <p className="text-sm text-gray-600 mb-2">{preview.length} carte{preview.length !== 1 ? 's' : ''} détectée{preview.length !== 1 ? 's' : ''}</p>
              <div className="max-h-48 overflow-y-auto space-y-1 border border-gray-100 rounded-lg p-2">
                {preview.slice(0, 20).map((c, i) => (
                  <div key={i} className="flex gap-2 text-xs bg-gray-50 rounded px-2 py-1.5">
                    <span className="text-gray-800 flex-1 truncate">{c.front}</span>
                    <span className="text-gray-400">→</span>
                    <span className="text-gray-600 flex-1 truncate">{c.back}</span>
                  </div>
                ))}
                {preview.length > 20 && (
                  <p className="text-xs text-gray-400 text-center py-1">+ {preview.length - 20} autres…</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 p-5 border-t border-gray-100">
          <button onClick={onClose} className="text-sm px-4 py-2 text-gray-500 hover:text-gray-700">Annuler</button>
          <button
            onClick={handleImport}
            disabled={importing || !preview?.length || !deckName.trim()}
            className="bg-indigo-600 text-white text-sm px-5 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {importing ? 'Import en cours…' : `Importer ${preview?.length ?? ''} cartes`}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const { user } = useAuth()
  const [decks, setDecks] = useState([])
  const [stats, setStats] = useState({ total: 0, due: 0, mastered: 0 })
  const [loading, setLoading] = useState(true)
  const [newDeckName, setNewDeckName] = useState('')
  const [creating, setCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [showImport, setShowImport] = useState(false)

  useEffect(() => { fetchDecks() }, [])

  async function fetchDecks() {
    setLoading(true)
    const { data } = await supabase
      .from('decks')
      .select('*, cards(id, next_review_date, repetitions)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (data) {
      const today = new Date().toISOString().split('T')[0]
      const processed = data.map(deck => {
        const cards = deck.cards || []
        const due = cards.filter(c => !c.next_review_date || c.next_review_date <= today).length
        const mastered = cards.filter(c => c.repetitions >= 3).length
        return { ...deck, cardCount: cards.length, due, mastered }
      })
      setDecks(processed)
      const total = processed.reduce((a, d) => a + d.cardCount, 0)
      const due = processed.reduce((a, d) => a + d.due, 0)
      const mastered = processed.reduce((a, d) => a + d.mastered, 0)
      setStats({ total, due, mastered })
    }
    setLoading(false)
  }

  async function createDeck(e) {
    e.preventDefault()
    if (!newDeckName.trim()) return
    setCreating(true)
    await supabase.from('decks').insert({ name: newDeckName.trim(), user_id: user.id })
    setNewDeckName('')
    setShowForm(false)
    setCreating(false)
    fetchDecks()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center flex-1">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 w-full">
      {showImport && (
        <ImportModal onClose={() => setShowImport(false)} onImported={fetchDecks} />
      )}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Mes decks</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowImport(true)}
            className="border border-gray-200 text-gray-700 text-sm px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Importer CSV
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            + Nouveau deck
          </button>
        </div>
      </div>

      {/* Global stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
          <p className="text-xs text-gray-500 mt-1">Cartes totales</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-semibold text-indigo-600">{stats.due}</p>
          <p className="text-xs text-gray-500 mt-1">À réviser</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-semibold text-emerald-600">{stats.mastered}</p>
          <p className="text-xs text-gray-500 mt-1">Maîtrisées</p>
        </div>
      </div>

      {/* New deck form */}
      {showForm && (
        <form onSubmit={createDeck} className="bg-white border border-indigo-200 rounded-xl p-4 mb-4 flex gap-2">
          <input
            autoFocus
            type="text"
            value={newDeckName}
            onChange={e => setNewDeckName(e.target.value)}
            placeholder="Nom du deck…"
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={creating || !newDeckName.trim()}
            className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            Créer
          </button>
          <button
            type="button"
            onClick={() => setShowForm(false)}
            className="text-sm px-3 py-2 text-gray-500 hover:text-gray-700"
          >
            Annuler
          </button>
        </form>
      )}

      {/* Deck list */}
      {decks.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📚</p>
          <p className="text-sm">Aucun deck. Créez-en un ou importez un CSV !</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {decks.map(deck => (
            <Link
              key={deck.id}
              to={`/decks/${deck.id}`}
              className="bg-white border border-gray-200 rounded-xl p-5 hover:border-indigo-300 hover:shadow-sm transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">
                  {deck.name}
                </h3>
                {deck.due > 0 && (
                  <span className="bg-indigo-100 text-indigo-700 text-xs font-medium px-2 py-0.5 rounded-full">
                    {deck.due} à réviser
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>{deck.cardCount} carte{deck.cardCount !== 1 ? 's' : ''}</span>
                <span>{deck.mastered} maîtrisée{deck.mastered !== 1 ? 's' : ''}</span>
              </div>
              {deck.cardCount > 0 && (
                <div className="mt-3 bg-gray-100 rounded-full h-1.5">
                  <div
                    className="bg-emerald-500 h-1.5 rounded-full transition-all"
                    style={{ width: `${Math.round((deck.mastered / deck.cardCount) * 100)}%` }}
                  />
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
