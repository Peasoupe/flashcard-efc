import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'

const mdComponents = {
  ul: ({ children }) => <ul className="list-disc list-inside text-left space-y-1 my-2">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal list-inside text-left space-y-1 my-2">{children}</ol>,
  li: ({ children }) => <li className="text-gray-800">{children}</li>,
  p: ({ children }) => <p className="text-gray-800 my-1">{children}</p>,
  img: ({ src, alt }) => (
    <img src={src} alt={alt || ''} className="max-w-full max-h-64 rounded-lg mx-auto my-2 object-contain" />
  ),
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
}

export default function CardRenderer({ content }) {
  const steps = content.split('\n---\n').filter(s => s.trim())
  const [step, setStep] = useState(0)

  useEffect(() => { setStep(0) }, [content])

  if (steps.length <= 1) {
    return <ReactMarkdown components={mdComponents}>{content}</ReactMarkdown>
  }

  return (
    <div>
      <ReactMarkdown components={mdComponents}>{steps[step]}</ReactMarkdown>
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
        <button
          type="button"
          onClick={() => setStep(s => s - 1)}
          disabled={step === 0}
          className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-800 disabled:opacity-30 text-xl rounded hover:bg-gray-100 transition-colors"
        >
          ‹
        </button>
        <span className="text-xs text-gray-400">{step + 1} / {steps.length}</span>
        <button
          type="button"
          onClick={() => setStep(s => s + 1)}
          disabled={step === steps.length - 1}
          className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-800 disabled:opacity-30 text-xl rounded hover:bg-gray-100 transition-colors"
        >
          ›
        </button>
      </div>
    </div>
  )
}
