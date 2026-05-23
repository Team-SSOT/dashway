import { useEffect, useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { cn } from '@/shared/lib/cn'

type HighlighterLike = {
  codeToHtml: (code: string, options: { lang: string; theme: string }) => string
}

let highlighterPromise: Promise<HighlighterLike> | null = null

async function getHighlighter(): Promise<HighlighterLike> {
  if (!highlighterPromise) {
    highlighterPromise = (async () => {
      const shiki = await import('shiki')
      return shiki.createHighlighter({
        themes: ['github-light', 'github-dark'],
        langs: ['typescript', 'tsx', 'javascript', 'jsx', 'json', 'html', 'css', 'shell', 'bash', 'markdown', 'python', 'sql', 'yaml'],
      })
    })()
  }
  return highlighterPromise
}

const SUPPORTED_LANGS = new Set([
  'typescript', 'tsx', 'javascript', 'jsx', 'json', 'html', 'css', 'shell', 'bash', 'markdown', 'python', 'sql', 'yaml',
])

interface Props {
  code: string
  language?: string | null
}

export function CodeBlockRender({ code, language }: Props) {
  const [html, setHtml] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const safeLang = language && SUPPORTED_LANGS.has(language) ? language : 'text'

  useEffect(() => {
    let cancelled = false
    if (safeLang === 'text') {
      setHtml(null)
      return
    }
    getHighlighter()
      .then((h) => {
        if (cancelled) return
        const out = h.codeToHtml(code, { lang: safeLang, theme: 'github-dark' })
        setHtml(out)
      })
      .catch((err) => {
        console.warn('[CodeBlockRender] shiki failed', err)
        setHtml(null)
      })
    return () => {
      cancelled = true
    }
  }, [code, safeLang])

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* ignore */
    }
  }

  return (
    <div
      className="group relative my-2 overflow-hidden rounded-md border border-border bg-muted"
      data-code-block
    >
      <div className="flex items-center justify-between border-b border-border bg-muted/70 px-3 py-1 text-[11px] text-muted-foreground">
        <span className="font-mono">{safeLang}</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          aria-label={copied ? 'Copied' : 'Copy code'}
          onClick={onCopy}
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </Button>
      </div>
      {html ? (
        <div
          className={cn('overflow-x-auto px-3 py-2 text-sm font-mono')}
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <pre className="overflow-x-auto px-3 py-2 text-sm font-mono">
          <code>{code}</code>
        </pre>
      )}
    </div>
  )
}
