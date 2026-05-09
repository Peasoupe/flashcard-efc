import ReactMarkdown from 'react-markdown'

export default function CardRenderer({ content }) {
  return (
    <ReactMarkdown
      components={{
        ul: ({ children }) => (
          <ul className="list-disc list-inside text-left space-y-1 my-2">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-inside text-left space-y-1 my-2">{children}</ol>
        ),
        li: ({ children }) => (
          <li className="text-gray-800">{children}</li>
        ),
        p: ({ children }) => (
          <p className="text-gray-800 my-1">{children}</p>
        ),
        img: ({ src, alt }) => (
          <img
            src={src}
            alt={alt || ''}
            className="max-w-full max-h-64 rounded-lg mx-auto my-2 object-contain"
          />
        ),
        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
      }}
    >
      {content}
    </ReactMarkdown>
  )
}
