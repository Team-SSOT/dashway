import { type MentionQuery, type MentionTarget, UniversalMessageComposer } from '@/features/composer/ui'
import { LexicalComposer as LexicalComposerProvider } from '@lexical/react/LexicalComposer'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { $createParagraphNode, $createTextNode, $getRoot } from 'lexical'
import { useEffect } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { MentionNode } from '@dashway/rich-text'
import { MentionTypeaheadPlugin } from '../ui/composer/lexical/plugins/MentionTypeaheadPlugin'

const ALICE: MentionTarget = {
  type: 'person',
  id: 'alice',
  label: 'Alice',
  description: 'Alice from the current workspace',
  source: 'People',
}

const BOB: MentionTarget = {
  type: 'person',
  id: 'bob',
  label: 'Bob',
  description: 'Bob from the current workspace',
  source: 'People',
}

function renderComposer(onFilesSelected = vi.fn()) {
  render(
    <UniversalMessageComposer
      autoFocus={false}
      composerId="test-composer"
      mentionSearch={async () => []}
      onFilesSelected={onFilesSelected}
      onSend={vi.fn()}
    />,
  )

  const composer = screen.getByLabelText('Message composer').closest('[data-file-drag-active]')
  if (!(composer instanceof HTMLElement)) {
    throw new Error('Composer drop target was not rendered')
  }

  return { composer, onFilesSelected }
}

function renderMentionHarness(initialText = '@') {
  const targets = [ALICE, BOB]
  const mentionSearch = vi.fn(async ({ query }: MentionQuery) => {
    const normalized = query.trim().toLowerCase()
    return normalized
      ? targets.filter((target) => target.label.toLowerCase().includes(normalized))
      : targets
  })

  render(
    <LexicalComposerProvider
      initialConfig={{
        namespace: 'mention-picker-test',
        nodes: [MentionNode],
        onError(error) {
          throw error
        },
        theme: {
          paragraph: 'mb-1 last:mb-0',
        },
      }}
    >
      <div className="relative">
        <MentionTypeaheadPlugin mentionSearch={mentionSearch} />
        <RichTextPlugin
          contentEditable={<ContentEditable aria-label="Mention harness editor" />}
          placeholder={null}
          ErrorBoundary={LexicalErrorBoundary}
        />
        <SeedEditorText text={initialText} />
      </div>
    </LexicalComposerProvider>,
  )

  return { mentionSearch }
}

function SeedEditorText({ text }: { text: string }) {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    editor.update(() => {
      const root = $getRoot()
      root.clear()
      const paragraph = $createParagraphNode()
      const textNode = $createTextNode(text)
      paragraph.append(textNode)
      root.append(paragraph)
      textNode.select(text.length, text.length)
    })
  }, [editor, text])

  return null
}

function fileDataTransfer(file: File) {
  return {
    dropEffect: 'none',
    files: [file],
    types: ['Files'],
  }
}

function textDataTransfer() {
  return {
    dropEffect: 'none',
    files: [],
    types: ['text/plain'],
  }
}

describe('UniversalMessageComposer drag and drop attachments', () => {
  it('shows the file drop affordance and attaches dropped files', async () => {
    const { composer, onFilesSelected } = renderComposer()
    const file = new File(['hello'], 'drop-test.txt', { type: 'text/plain' })
    const dataTransfer = fileDataTransfer(file)

    fireEvent.dragEnter(composer, { dataTransfer })

    expect(composer.getAttribute('data-file-drag-active')).toBe('true')
    expect(screen.getByText('Drop files to attach')).toBeTruthy()

    fireEvent.drop(composer, { dataTransfer })

    await waitFor(() => expect(screen.getByText('drop-test.txt')).toBeTruthy())
    expect(onFilesSelected).toHaveBeenCalledWith([file])
    expect(composer.getAttribute('data-file-drag-active')).toBe('false')
    expect(screen.queryByText('Drop files to attach')).toBeNull()
  })

  it('ignores non-file drags', () => {
    const { composer, onFilesSelected } = renderComposer()
    const dataTransfer = textDataTransfer()

    fireEvent.dragEnter(composer, { dataTransfer })
    fireEvent.drop(composer, { dataTransfer })

    expect(composer.getAttribute('data-file-drag-active')).toBe('false')
    expect(screen.queryByText('Drop files to attach')).toBeNull()
    expect(onFilesSelected).not.toHaveBeenCalled()
  })
})

describe('UniversalMessageComposer inline mention picker', () => {
  it('opens a Notion-like inline search input outside the suggestion listbox', async () => {
    renderMentionHarness()

    const input = await screen.findByLabelText('Search mentions')
    expect(input).toHaveValue('')
    expect(input.closest('[role="listbox"]')).toBeNull()
    expect(screen.queryByText('Search all matches')).toBeNull()

    await waitFor(() => {
      expect(screen.getByRole('option', { name: /Alice/ })).toBeTruthy()
    })
  })

  it('filters from the inline input and inserts at the captured @ token', async () => {
    const user = userEvent.setup()
    const { mentionSearch } = renderMentionHarness()

    const input = await screen.findByLabelText('Search mentions')
    await user.click(input)
    await user.type(input, 'ali')

    await waitFor(() => {
      expect(mentionSearch).toHaveBeenLastCalledWith({ query: 'ali', limit: 8 })
      expect(screen.getByRole('option', { name: /Alice/ })).toBeTruthy()
    })

    await user.keyboard('{Enter}')

    await waitFor(() => {
      expect(screen.queryByLabelText('Search mentions')).toBeNull()
      expect(screen.getByText('@Alice')).toBeTruthy()
    })
  })

  it('handles arrow navigation and ignores Enter while composing in the inline input', async () => {
    const user = userEvent.setup()
    renderMentionHarness()

    const input = await screen.findByLabelText('Search mentions')
    await user.click(input)

    await waitFor(() => {
      expect(screen.getByRole('option', { name: /Alice/ })).toHaveAttribute('aria-selected', 'true')
    })

    fireEvent.keyDown(input, { key: 'ArrowDown' })

    await waitFor(() => {
      expect(screen.getByRole('option', { name: /Bob/ })).toHaveAttribute('aria-selected', 'true')
    })

    fireEvent.keyDown(input, { key: 'Enter', isComposing: true })
    expect(screen.queryByText('@Bob')).toBeNull()

    fireEvent.keyDown(input, { key: 'Enter' })

    await waitFor(() => {
      expect(screen.getByText('@Bob')).toBeTruthy()
    })
  })
})
