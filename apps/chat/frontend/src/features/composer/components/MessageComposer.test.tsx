import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { UniversalMessageComposer } from '@dashway/chat-ui'

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
