import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import * as XLSX from 'xlsx'
import JSZip from 'jszip'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

function parseCSV(text) {
  const cards = []
  let pos = 0
  const len = text.length

  function parseField(sep) {
    if (pos < len && text[pos] === '"') {
      // Quoted field — collect until closing quote (handles embedded newlines)
      pos++ // skip opening quote
      let value = ''
      while (pos < len) {
        if (text[pos] === '"') {
          if (text[pos + 1] === '"') { value += '"'; pos += 2 } // escaped quote
          else { pos++; break } // closing quote
        } else {
          value += text[pos++]
        }
      }
      // skip separator after field
      if (pos < len && (text[pos] === sep || text[pos] === ';' || text[pos] === ',')) pos++
      return value
    } else {
      // Unquoted field — read until separator or newline
      let start = pos
      while (pos < len && text[pos] !== sep && text[pos] !== '\n' && text[pos] !== '\r') pos++
      const value = text.slice(start, pos).trim()
      if (pos < len && (text[pos] === sep || text[pos] === ';' || text[pos] === ',')) pos++
      return value
    }
  }

  while (pos < len) {
    // Skip blank lines
    while (pos < len && (text[pos] === '\r' || text[pos] === '\n')) pos++
    if (pos >= len) break

    // Detect separator from this row's first unquoted separator character
    const rowStart = pos
    let sep = ','
    {
      let p = pos
      if (text[p] === '"') { p++; while (p < len && !(text[p] === '"' && text[p+1] !== '"')) p++; p += 2 }
      else { while (p < len && text[p] !== ',' && text[p] !== ';' && text[p] !== '\n') p++ }
      if (p < len && text[p] === ';') sep = ';'
    }
    pos = rowStart

    const front = parseField(sep)
    const back = parseField(sep)

    // Consume rest of the row (any extra fields or trailing CRLF)
    while (pos < len && text[pos] !== '\n') pos++

    if (front && back) cards.push({ front, back })
  }

  return cards
}

function parseExcel(buffer) {
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })
  const cards = []
  for (const row of rows) {
    const front = String(row[0] ?? '').trim()
    const back = String(row[1] ?? '').trim()
    if (front && back) cards.push({ front, back })
  }
  return cards
}

async function parseWord(buffer) {
  const zip = await JSZip.loadAsync(buffer)
  const xmlFile = zip.files['word/document.xml']
  if (!xmlFile) return []
  const xml = await xmlFile.async('string')

  const doc = new DOMParser().parseFromString(xml, 'application/xml')
  const WNS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
  const paragraphs = doc.getElementsByTagNameNS(WNS, 'p')

  const cards = []
  let currentFront = null
  let backLines = []

  function flushCard() {
    if (currentFront && backLines.length > 0) {
      cards.push({ front: currentFront, back: backLines.join('\n').trim() })
    }
    backLines = []
    currentFront = null
  }

  for (const p of paragraphs) {
    // Get paragraph style
    const pPr = p.getElementsByTagNameNS(WNS, 'pPr')[0]
    const pStyle = pPr?.getElementsByTagNameNS(WNS, 'pStyle')[0]?.getAttribute(`${WNS.replace('http://schemas.openxmlformats.org/wordprocessingml/2006/main', '')}val`)
      ?? pPr?.getElementsByTagNameNS(WNS, 'pStyle')[0]?.getAttributeNS(WNS, 'val')
      ?? pPr?.getElementsByTagNameNS(WNS, 'pStyle')[0]?.getAttribute('w:val')
      ?? ''

    // Extract text runs, preserving line breaks
    const tNodes = p.getElementsByTagNameNS(WNS, 't')
    const text = Array.from(tNodes).map(t => t.textContent).join('').trim()

    const isHeading = /^(Heading|Titre|heading|titre)\d?$/i.test(pStyle) || /^heading/i.test(pStyle)

    if (isHeading) {
      flushCard()
      if (text) currentFront = text
    } else if (currentFront !== null) {
      if (text === '---') {
        backLines.push('---')
      } else if (text) {
        backLines.push(text)
      }
    }
  }
  flushCard()

  return cards
}

async function parsePPTX(buffer) {
  const zip = await JSZip.loadAsync(buffer)

  // Collect slide files in order
  const slideEntries = Object.keys(zip.files)
    .filter(name => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => {
      const n = s => parseInt(s.match(/\d+/)[0])
      return n(a) - n(b)
    })

  function extractShapeTexts(xml) {
    const parser = new DOMParser()
    const doc = parser.parseFromString(xml, 'application/xml')
    const NS = { sp: 'http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing' }

    // Collect all <p:sp> shapes with their placeholder type and text
    const shapes = []
    const spNodes = doc.getElementsByTagNameNS('http://schemas.openxmlformats.org/presentationml/2006/main', 'sp')

    for (const sp of spNodes) {
      // Detect placeholder type (title, body, etc.)
      const phNodes = sp.getElementsByTagNameNS('http://schemas.openxmlformats.org/presentationml/2006/main', 'ph')
      const phType = phNodes.length > 0 ? (phNodes[0].getAttribute('type') || 'body') : 'body'

      // Extract all text runs
      const tNodes = sp.getElementsByTagNameNS('http://schemas.openxmlformats.org/drawingml/2006/main', 't')
      const pNodes = sp.getElementsByTagNameNS('http://schemas.openxmlformats.org/drawingml/2006/main', 'p')

      // Reconstruct paragraphs to preserve line breaks
      const paragraphs = []
      for (const p of pNodes) {
        const runs = p.getElementsByTagNameNS('http://schemas.openxmlformats.org/drawingml/2006/main', 't')
        const line = Array.from(runs).map(t => t.textContent).join('')
        if (line.trim()) paragraphs.push(line)
      }

      const text = paragraphs.join('\n').trim()
      if (text) shapes.push({ type: phType, text })
    }

    return shapes
  }

  const cards = []
  for (const slidePath of slideEntries) {
    const xml = await zip.files[slidePath].async('string')
    const shapes = extractShapeTexts(xml)

    // Title placeholder → front; everything else → back
    const titleShape = shapes.find(s => s.type === 'title' || s.type === 'ctrTitle')
    const bodyShapes = shapes.filter(s => s !== titleShape)

    const front = titleShape ? titleShape.text : (shapes[0]?.text ?? '')
    const back = bodyShapes.length > 0
      ? bodyShapes.map(s => s.text).join('\n')
      : (shapes[1]?.text ?? '')

    if (front && back) cards.push({ front, back })
  }

  return cards
}

const AI_PROMPTS = {
  excel: `Tu vas reformater un fichier Excel pour qu'il soit compatible avec l'application de flashcards FlashEFC.

STRUCTURE REQUISE :
- Colonne A : question / recto de la carte
- Colonne B : réponse / verso de la carte
- Une carte par ligne, pas d'en-tête obligatoire

SAUTS DE LIGNE DANS UNE CELLULE :
Dans Excel, les sauts de ligne à l'intérieur d'une cellule se font avec Alt+Entrée. Dans le fichier .xlsx généré, ils apparaissent comme des retours à la ligne normaux dans la cellule.

BULLET POINTS :
Commence chaque point par • ou - suivi d'un espace. Chaque point sur sa propre ligne (Alt+Entrée entre chaque).
Exemple dans la cellule B2 :
• Premier critère
• Deuxième critère
• Troisième critère

CARROUSEL PAR ÉTAPES :
Pour diviser une réponse en plusieurs étapes affichées l'une après l'autre, sépare chaque étape par --- seul sur une ligne.
Exemple dans la cellule B2 :
**Étape 1 — Identifier l'enjeu :**
Texte de l'étape 1
---
**Étape 2 — Évaluer les critères :**
• Critère A
• Critère B
---
**Étape 3 — Conclure :**
Texte de conclusion

MISE EN FORME :
- Gras : **texte**
- Les titres d'étapes en gras sont recommandés

Reformate maintenant le fichier Excel fourni en respectant ces règles. Conserve le contenu original, adapte uniquement la structure et la mise en forme.`,

  csv: `Tu vas reformater un fichier en CSV pour qu'il soit compatible avec l'application de flashcards FlashEFC.

STRUCTURE REQUISE :
- Deux colonnes séparées par une virgule ou un point-virgule
- Colonne 1 : question / recto de la carte
- Colonne 2 : réponse / verso de la carte
- Une carte par ligne, pas d'en-tête obligatoire
- Les cellules contenant des sauts de ligne ou des virgules doivent être entourées de guillemets doubles

BULLET POINTS :
Commence chaque point par • ou - suivi d'un espace, séparés par des sauts de ligne à l'intérieur de la cellule (la cellule doit être entre guillemets doubles).
Exemple :
"Qu'est-ce que le goodwill ?","• Excédent du coût d'acquisition sur la JV des actifs nets
• Comptabilisé uniquement lors d'un regroupement
• Soumis à un test de dépréciation annuel"

CARROUSEL PAR ÉTAPES :
Pour diviser une réponse en plusieurs étapes, sépare chaque étape par --- seul sur une ligne à l'intérieur de la cellule (entre guillemets doubles).
Exemple :
"Étapes de comptabilisation","**Étape 1 — Identifier l'enjeu :**
Texte de l'étape 1
---
**Étape 2 — Évaluer les critères :**
• Critère A
• Critère B
---
**Étape 3 — Conclure :**
Texte de conclusion"

MISE EN FORME :
- Gras : **texte**
- Les titres d'étapes en gras sont recommandés
- Encodage : UTF-8

Génère maintenant le fichier CSV en respectant ces règles. Conserve le contenu original, adapte uniquement la structure et la mise en forme.`,

  word: `Tu vas reformater un document Word pour qu'il soit compatible avec l'application de flashcards FlashEFC.

STRUCTURE REQUISE :
- Chaque carte commence par un titre en style "Titre 2" (Heading 2) → ce sera le recto (question)
- Le texte en style "Normal" qui suit → ce sera le verso (réponse)
- La prochaine ligne "Titre 2" démarre une nouvelle carte automatiquement

BULLET POINTS :
Utilise les listes à puces normales de Word. Chaque point sera converti automatiquement.
Tu peux aussi écrire • ou - en début de ligne dans un paragraphe Normal.
Exemple :
[Titre 2] Quels sont les critères de comptabilisation ?
[Normal] • Premier critère
[Normal] • Deuxième critère
[Normal] • Troisième critère

CARROUSEL PAR ÉTAPES :
Pour diviser le verso en plusieurs étapes affichées l'une après l'autre, ajoute un paragraphe Normal contenant uniquement --- entre chaque étape.
Exemple :
[Titre 2] Étapes de comptabilisation des apports
[Normal] **Étape 1 — Identifier l'enjeu :**
[Normal] Texte de l'étape 1
[Normal] ---
[Normal] **Étape 2 — Évaluer les critères :**
[Normal] • Critère A
[Normal] • Critère B
[Normal] ---
[Normal] **Étape 3 — Conclure :**
[Normal] Texte de conclusion

MISE EN FORME :
- Gras : **texte** ou gras natif de Word
- Les titres d'étapes en gras sont recommandés
- Ne pas utiliser Titre 1 (réservé au titre du document)
- Encodage : UTF-8

Reformate maintenant le document Word en respectant ces règles. Conserve le contenu original, adapte uniquement la structure et la mise en forme.`,

  pptx: `Tu vas reformater une présentation PowerPoint pour qu'elle soit compatible avec l'application de flashcards FlashEFC.

STRUCTURE REQUISE :
- Une carte par slide
- Titre de la slide → recto de la carte (question)
- Contenu / corps de la slide → verso de la carte (réponse)
- Les slides sans titre ou sans contenu seront ignorées

BULLET POINTS :
Utilise les listes à puces normales de PowerPoint. Chaque point sera automatiquement converti en liste dans l'application.
Tu peux aussi utiliser • ou - en début de ligne dans une zone de texte.

CARROUSEL PAR ÉTAPES :
Pour diviser le verso en plusieurs étapes affichées l'une après l'autre, place le texte --- seul sur une ligne dans la zone de contenu de la slide.
Exemple de contenu d'une slide :
**Étape 1 — Identifier l'enjeu :**
Texte de l'étape 1
---
**Étape 2 — Évaluer les critères :**
• Critère A
• Critère B
---
**Étape 3 — Conclure :**
Texte de conclusion

MISE EN FORME :
- Gras : **texte** ou utilise le gras natif de PowerPoint
- Les titres d'étapes en gras sont recommandés
- Une seule zone de titre et une seule zone de contenu par slide

Reformate maintenant la présentation PowerPoint en respectant ces règles. Conserve le contenu original, adapte uniquement la structure et la mise en forme.`,
}

function CopyPromptBox() {
  const [mode, setMode] = useState('excel')
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(AI_PROMPTS[mode]).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="border border-indigo-100 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between bg-indigo-50 px-3 py-2 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-medium text-indigo-700 shrink-0">Prompt IA — reformater en</span>
          <div className="flex rounded-md overflow-hidden border border-indigo-200 text-xs shrink-0">
            <button
              type="button"
              onClick={() => { setMode('excel'); setCopied(false) }}
              className={`px-2 py-0.5 transition-colors ${mode === 'excel' ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-600 hover:bg-indigo-50'}`}
            >Excel</button>
            <button
              type="button"
              onClick={() => { setMode('csv'); setCopied(false) }}
              className={`px-2 py-0.5 transition-colors ${mode === 'csv' ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-600 hover:bg-indigo-50'}`}
            >CSV</button>
            <button
              type="button"
              onClick={() => { setMode('pptx'); setCopied(false) }}
              className={`px-2 py-0.5 transition-colors ${mode === 'pptx' ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-600 hover:bg-indigo-50'}`}
            >PowerPoint</button>
            <button
              type="button"
              onClick={() => { setMode('word'); setCopied(false) }}
              className={`px-2 py-0.5 transition-colors ${mode === 'word' ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-600 hover:bg-indigo-50'}`}
            >Word</button>
          </div>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="text-xs px-2.5 py-1 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shrink-0"
        >
          {copied ? '✓ Copié !' : 'Copier'}
        </button>
      </div>
      <textarea
        readOnly
        value={AI_PROMPTS[mode]}
        rows={5}
        className="w-full text-xs text-gray-600 px-3 py-2 resize-none bg-white focus:outline-none font-mono leading-relaxed"
      />
    </div>
  )
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
    setDeckName(file.name.replace(/\.(csv|xlsx|xls|pptx|docx)$/i, ''))

    const isPPTX = /\.pptx$/i.test(file.name)
    const isExcel = /\.(xlsx|xls)$/i.test(file.name)
    const isWord = /\.docx$/i.test(file.name)
    const reader = new FileReader()

    reader.onload = async (evt) => {
      try {
        let cards
        if (isPPTX) cards = await parsePPTX(evt.target.result)
        else if (isWord) cards = await parseWord(evt.target.result)
        else if (isExcel) cards = parseExcel(evt.target.result)
        else cards = parseCSV(evt.target.result)

        if (cards.length === 0) {
          setError('Aucune carte trouvée. Vérifiez le format du fichier.')
          setPreview(null)
        } else {
          setPreview(cards)
        }
      } catch {
        setError('Erreur lors de la lecture du fichier.')
        setPreview(null)
      }
    }
    if (isPPTX || isExcel || isWord) reader.readAsArrayBuffer(file)
    else reader.readAsText(file, 'UTF-8')
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
          <h2 className="font-semibold text-gray-900">Importer un fichier</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <div className="p-5 space-y-4">
          {/* Format hint */}
          <div className="bg-gray-50 rounded-lg px-4 py-3 text-xs text-gray-500 space-y-1">
            <p className="font-medium text-gray-700">Format attendu :</p>
            <p>Excel (.xlsx) et CSV (.csv) : colonne A = question, colonne B = réponse.</p>
            <p>PowerPoint (.pptx) : titre de la slide = question, contenu = réponse.</p>
            <p>Word (.docx) : Titre 2 = question, paragraphes suivants = réponse.</p>
            <p className="font-mono bg-white border border-gray-200 rounded px-2 py-1 mt-1">
              question &nbsp;&nbsp;&nbsp; réponse<br />
              Capitale du Québec &nbsp;&nbsp;&nbsp; Québec City<br />
              Qu'est-ce que le PIB? &nbsp;&nbsp;&nbsp; Produit intérieur brut
            </p>
          </div>

          {/* AI prompt */}
          <CopyPromptBox />

          {/* File picker */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">Fichier Excel, CSV, PowerPoint ou Word</label>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.xlsx,.xls,.pptx,.docx,text/csv"
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
            Importer
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
          <p className="text-sm">Aucun deck. Créez-en un ou importez un fichier Excel, CSV, PowerPoint ou Word !</p>
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
