import { useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import CardRenderer from './CardRenderer'

export default function CardEditor({ value, onChange, placeholder = 'Réponse…' }) {
  const textareaRef = useRef()
  const fileRef = useRef()
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(false)

  function insertAtCursor(before, after = '') {
    const el = textareaRef.current
    const start = el.selectionStart
    const end = el.selectionEnd
    const selected = value.slice(start, end)
    const newVal = value.slice(0, start) + before + selected + after + value.slice(end)
    onChange(newVal)
    setTimeout(() => {
      el.focus()
      el.setSelectionRange(start + before.length, start + before.length + selected.length)
    }, 0)
  }

  function insertBulletList() {
    const el = textareaRef.current
    const start = el.selectionStart
    const lineStart = value.lastIndexOf('\n', start - 1) + 1
    const prefix = value.slice(lineStart, start).startsWith('- ') ? '' : '- '
    if (prefix) {
      insertAtCursor('- ')
    } else {
      const newVal = value.slice(0, start) + '\n- ' + value.slice(start)
      onChange(newVal)
    }
  }

  function insertNumberedList() {
    const lines = value.split('\n')
    const el = textareaRef.current
    const cursorLine = value.slice(0, el.selectionStart).split('\n').length - 1
    const isAlreadyNumbered = /^\d+\.\s/.test(lines[cursorLine] || '')
    if (!isAlreadyNumbered) {
      insertAtCursor('1. ')
    }
  }

  async function handleImageUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)

    const ext = file.name.split('.').pop()
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { error } = await supabase.storage.from('card-images').upload(path, file)
    if (error) {
      alert('Erreur upload image. Vérifiez que le bucket "card-images" existe dans Supabase Storage.')
      setUploading(false)
      return
    }

    const { data } = supabase.storage.from('card-images').getPublicUrl(path)
    const markdown = `\n![](${data.publicUrl})\n`
    onChange(value + markdown)
    setUploading(false)
    e.target.value = ''
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-2 py-1.5 border-b border-gray-100 bg-gray-50">
        <button
          type="button"
          title="Liste à puces"
          onClick={insertBulletList}
          className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-200 rounded transition-colors font-mono"
        >
          • Liste
        </button>
        <button
          type="button"
          title="Liste numérotée"
          onClick={insertNumberedList}
          className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-200 rounded transition-colors font-mono"
        >
          1. Liste
        </button>
        <button
          type="button"
          title="Gras"
          onClick={() => insertAtCursor('**', '**')}
          className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-200 rounded transition-colors font-bold"
        >
          G
        </button>
        <div className="w-px h-4 bg-gray-200 mx-1" />
        <button
          type="button"
          onClick={() => fileRef.current.click()}
          disabled={uploading}
          className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-200 rounded transition-colors disabled:opacity-50"
        >
          {uploading ? 'Upload…' : '🖼 Image'}
        </button>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => setPreview(!preview)}
          className={`px-2 py-1 text-xs rounded transition-colors ${preview ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-200'}`}
        >
          {preview ? 'Éditer' : 'Aperçu'}
        </button>
      </div>

      {/* Editor / Preview */}
      {preview ? (
        <div className="px-3 py-2 min-h-20 text-sm">
          {value ? <CardRenderer content={value} /> : <span className="text-gray-400 text-sm">{placeholder}</span>}
        </div>
      ) : (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full px-3 py-2 text-sm focus:outline-none resize-none bg-white"
        />
      )}
    </div>
  )
}
