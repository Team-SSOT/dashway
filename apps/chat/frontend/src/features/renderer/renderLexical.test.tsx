import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import type { SerializedEditorState } from 'lexical'
import { renderLexical } from './renderLexical'

import boldJson from './__fixtures__/bold.json'
import boldExpected from './__fixtures__/bold.expected.txt?raw'

import italicJson from './__fixtures__/italic.json'
import italicExpected from './__fixtures__/italic.expected.txt?raw'

import codeInlineJson from './__fixtures__/code-inline.json'
import codeInlineExpected from './__fixtures__/code-inline.expected.txt?raw'

import codeBlockJson from './__fixtures__/code-block.json'
import codeBlockExpected from './__fixtures__/code-block.expected.txt?raw'

import linkJson from './__fixtures__/link.json'
import linkExpected from './__fixtures__/link.expected.txt?raw'

import bulletListJson from './__fixtures__/bullet-list.json'
import bulletListExpected from './__fixtures__/bullet-list.expected.txt?raw'

import orderedListJson from './__fixtures__/ordered-list.json'
import orderedListExpected from './__fixtures__/ordered-list.expected.txt?raw'

import headingJson from './__fixtures__/heading.json'
import headingExpected from './__fixtures__/heading.expected.txt?raw'

import emojiJson from './__fixtures__/emoji.json'
import emojiExpected from './__fixtures__/emoji.expected.txt?raw'

import mentionReadJson from './__fixtures__/mention-read.json'
import mentionReadExpected from './__fixtures__/mention-read.expected.txt?raw'

import emptyJson from './__fixtures__/empty.json'
import emptyExpected from './__fixtures__/empty.expected.txt?raw'

import nestedJson from './__fixtures__/nested.json'
import nestedExpected from './__fixtures__/nested.expected.txt?raw'

import maxLengthJson from './__fixtures__/max-length.json'
import maxLengthExpected from './__fixtures__/max-length.expected.txt?raw'

function normalize(s: string): string {
  return s.replace(/\s+/g, ' ').trim()
}

describe('renderLexical', () => {
  const cases: Array<{
    name: string
    fixture: unknown
    expected: string
    extra?: (container: HTMLElement) => void
  }> = [
    {
      name: 'bold',
      fixture: boldJson,
      expected: boldExpected,
      extra: (c) => expect(c.querySelector('strong')?.textContent).toBe('bold'),
    },
    {
      name: 'italic',
      fixture: italicJson,
      expected: italicExpected,
      extra: (c) => expect(c.querySelector('em')?.textContent).toBe('italic'),
    },
    {
      name: 'code-inline',
      fixture: codeInlineJson,
      expected: codeInlineExpected,
      extra: (c) => expect(c.querySelector('code')?.textContent).toBe('npm install'),
    },
    {
      name: 'code-block',
      fixture: codeBlockJson,
      expected: codeBlockExpected,
      extra: (c) => expect(c.querySelector('pre, [data-code-block]')).toBeTruthy(),
    },
    {
      name: 'link',
      fixture: linkJson,
      expected: linkExpected,
      extra: (c) => expect(c.querySelector('a')?.getAttribute('href')).toMatch(/^https:/),
    },
    {
      name: 'bullet-list',
      fixture: bulletListJson,
      expected: bulletListExpected,
      extra: (c) => expect(c.querySelectorAll('ul > li')).toHaveLength(3),
    },
    {
      name: 'ordered-list',
      fixture: orderedListJson,
      expected: orderedListExpected,
      extra: (c) => expect(c.querySelectorAll('ol > li')).toHaveLength(2),
    },
    {
      name: 'heading',
      fixture: headingJson,
      expected: headingExpected,
      extra: (c) => expect(c.querySelector('h1, h2, h3')).toBeTruthy(),
    },
    {
      name: 'emoji',
      fixture: emojiJson,
      expected: emojiExpected,
      extra: (c) => expect(c.querySelector('[role="img"]')?.textContent).toBe('😄'),
    },
    {
      name: 'mention-read',
      fixture: mentionReadJson,
      expected: mentionReadExpected,
      extra: (c) => {
        const span = c.querySelector('[data-mention-id="alice"]')
        expect(span).toBeTruthy()
        expect(span?.textContent).toBe('@alice')
      },
    },
    {
      name: 'empty',
      fixture: emptyJson,
      expected: emptyExpected,
    },
    {
      name: 'nested',
      fixture: nestedJson,
      expected: nestedExpected,
    },
    {
      name: 'max-length',
      fixture: maxLengthJson,
      expected: maxLengthExpected,
    },
  ]

  for (const c of cases) {
    it(`renders ${c.name}`, () => {
      const { container } = render(
        <>{renderLexical(c.fixture as SerializedEditorState)}</>,
      )
      expect(normalize(container.textContent ?? '')).toBe(normalize(c.expected))
      c.extra?.(container as HTMLElement)
    })
  }
})
