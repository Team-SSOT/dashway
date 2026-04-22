import { useEffect, useState } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_NORMAL,
  FORMAT_TEXT_COMMAND,
  SELECTION_CHANGE_COMMAND,
} from 'lexical'
import { INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND } from '@lexical/list'
import { TOGGLE_LINK_COMMAND } from '@lexical/link'
import { Bold, Code, Italic, Link2, List, ListOrdered } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip'
import { cn } from '@/shared/lib/cn'

interface FormatState {
  bold: boolean
  italic: boolean
  code: boolean
}

export function ComposerToolbar() {
  const [editor] = useLexicalComposerContext()
  const [state, setState] = useState<FormatState>({ bold: false, italic: false, code: false })

  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        const sel = $getSelection()
        if ($isRangeSelection(sel)) {
          setState({
            bold: sel.hasFormat('bold'),
            italic: sel.hasFormat('italic'),
            code: sel.hasFormat('code'),
          })
        }
        return false
      },
      COMMAND_PRIORITY_NORMAL,
    )
  }, [editor])

  const btn = (active: boolean) =>
    cn('h-7 w-7', active && 'bg-accent text-accent-foreground')

  return (
    <div className="flex items-center gap-0.5">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={btn(state.bold)}
            aria-label="Bold (Ctrl+B)"
            onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')}
          >
            <Bold className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Bold</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={btn(state.italic)}
            aria-label="Italic (Ctrl+I)"
            onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')}
          >
            <Italic className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Italic</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={btn(state.code)}
            aria-label="Code"
            onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code')}
          >
            <Code className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Inline code</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Link"
            onClick={() => {
              const url = window.prompt('URL:')
              if (url) editor.dispatchCommand(TOGGLE_LINK_COMMAND, url)
            }}
          >
            <Link2 className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Link</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Bulleted list"
            onClick={() => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)}
          >
            <List className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Bulleted list</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Numbered list"
            onClick={() => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)}
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Numbered list</TooltipContent>
      </Tooltip>
    </div>
  )
}
