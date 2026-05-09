import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { sm2, isDue } from '../lib/sm2'
import CardRenderer from '../components/CardRenderer'

const QUALITY_LABELS = [
  { q: 0, label: 'Raté', color: 'bg-red-100 text-red-700 hover:bg-red-200' },
  { q: 3, label: 'Difficile', color: 'bg-orange-100 text-orange-700 hover:bg-orange-200' },
  { q: 4, label: 'Bien', color: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
  { q: 5, label: 'Facile', color: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' },
]

export default function Study() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [deck, setDeck] = useState(null)
  const [queue, setQueue] = useState([])
  const [current, setCurrent] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sessionResults, setSessionResults] = useState([])
  const [done, setDone] = useState(false)

  useEffect(() => { fetchSession() }, [id])

  async function fetchSession() {
    const { data: deckData } = await supabase
      .from('decks').select('*').eq('id', id).eq('user_id', user.id).single()

    if (!deckData) { navigate('/'); return }
    setDeck(deckData)

    const { data: cards } = await supabase
      .from('cards').select('*').eq('deck_id', id)

    const due = (cards || []).filter(isDue)
    const shuffled = due.sort(() => Math.random() - 0.5)
    setQueue(shuffled.length > 0 ? shuffled : (cards || []).sort(() => Math.random() - 0.5))
    setLoading(false)
  }

  async function handleQuality(quality) {
    const card = queue[current]
    const result = sm2(card, quality)

    await supabase.from('cards').update(result).eq('id', card.id)

    setSessionResults(prev => [...prev, { card, quality }])

    if (current + 1 >= queue.length) {
      setDone(true)
    } else {
      setCurrent(prev => prev + 1)
      setFlipped(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center flex-1">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (queue.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <p className="text-4xl mb-4">🎉</p>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Rien à réviser !</h2>
        <p className="text-sm text-gray-500 mb-6">Toutes les cartes sont à jour pour aujourd'hui.</p>
        <Link to={`/decks/${id}`} className="text-sm text-indigo-600 hover:underline">← Retour au deck</Link>
      </div>
    )
  }

  if (done) {
    const correct = sessionResults.filter(r => r.quality >= 3).length
    const pct = Math.round((correct / sessionResults.length) * 100)

    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <p className="text-4xl mb-4">{pct >= 80 ? '🏆' : pct >= 50 ? '👍' : '📖'}</p>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Session terminée !</h2>
        <p className="text-sm text-gray-500 mb-6">
          {correct} / {sessionResults.length} correctes — {pct}%
        </p>

        <div className="space-y-2 text-left mb-8">
          {sessionResults.map(({ card, quality }, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex justify-between items-center">
              <p className="text-sm text-gray-800 truncate flex-1 mr-4">{card.front}</p>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${quality >= 4 ? 'bg-emerald-100 text-emerald-700' : quality === 3 ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                {quality >= 4 ? 'Bien' : quality === 3 ? 'Difficile' : 'Raté'}
              </span>
            </div>
          ))}
        </div>

        <div className="flex gap-3 justify-center">
          <Link to={`/decks/${id}`} className="text-sm text-indigo-600 hover:underline">← Retour au deck</Link>
          <button
            onClick={() => { setCurrent(0); setFlipped(false); setDone(false); setSessionResults([]); fetchSession() }}
            className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Recommencer
          </button>
        </div>
      </div>
    )
  }

  const card = queue[current]
  const progress = Math.round((current / queue.length) * 100)

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Link to={`/decks/${id}`} className="text-sm text-gray-400 hover:text-gray-600">← {deck?.name}</Link>
        <span className="text-sm text-gray-500">{current + 1} / {queue.length}</span>
      </div>

      {/* Progress bar */}
      <div className="bg-gray-100 rounded-full h-1.5 mb-8">
        <div
          className="bg-indigo-500 h-1.5 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Flashcard */}
      <div
        onClick={() => setFlipped(true)}
        className={`bg-white border-2 rounded-2xl p-8 min-h-64 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 mb-6 ${
          flipped ? 'border-indigo-200' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
        }`}
      >
        {!flipped ? (
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-4 uppercase tracking-wide">Question</p>
            <p className="text-lg text-gray-900 leading-relaxed whitespace-pre-wrap">{card.front}</p>
            <p className="text-xs text-gray-400 mt-6">Cliquez pour révéler la réponse</p>
          </div>
        ) : (
          <div className="text-center w-full">
            <p className="text-xs text-gray-400 mb-3 uppercase tracking-wide">Question</p>
            <p className="text-base text-gray-600 mb-6 whitespace-pre-wrap">{card.front}</p>
            <div className="border-t border-gray-100 pt-6">
              <p className="text-xs text-gray-400 mb-3 uppercase tracking-wide">Réponse</p>
              <div className="text-left text-gray-900 leading-relaxed">
                <CardRenderer content={card.back} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Rating buttons */}
      {flipped && (
        <div className="grid grid-cols-4 gap-2">
          {QUALITY_LABELS.map(({ q, label, color }) => (
            <button
              key={q}
              onClick={() => handleQuality(q)}
              className={`${color} rounded-xl py-3 text-sm font-medium transition-colors`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {!flipped && (
        <div className="text-center">
          <button
            onClick={() => setFlipped(true)}
            className="bg-indigo-600 text-white text-sm px-8 py-3 rounded-xl hover:bg-indigo-700 transition-colors"
          >
            Voir la réponse
          </button>
        </div>
      )}
    </div>
  )
}
