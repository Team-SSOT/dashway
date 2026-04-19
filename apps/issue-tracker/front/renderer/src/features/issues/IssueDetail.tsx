import { ArrowLeft, Calendar, Link2, MessageSquare, Paperclip } from 'lucide-react'
import type { ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AvatarStack } from '@/components/kibo-ui/avatar-stack'
import { PriorityBadge } from '@/components/kibo-ui/priority'
import { StatusBadge } from '@/components/kibo-ui/status'
import { TagList } from '@/components/kibo-ui/tags'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { mockIssues } from './mockData'

const formatDate = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '—'

export const IssueDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const issue = mockIssues.find((i) => i.id === id)

  if (!issue) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="text-sm text-t2">Issue not found.</div>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate('/table')}>
            Back to all issues
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full">
      <article className="flex-1 overflow-auto scrollbar-thin">
        <div className="mx-auto max-w-3xl p-8">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Button>

          <div className="flex items-center gap-2 text-xs text-t3">
            <span className="font-mono">{issue.key}</span>
            <span>·</span>
            <span>created {formatDate(issue.createdAt)}</span>
          </div>

          <h1 className="mt-2 text-3xl font-semibold leading-tight text-t1">{issue.title}</h1>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <StatusBadge status={issue.status} />
            <PriorityBadge priority={issue.priority} />
            {issue.labels.length > 0 && <TagList labels={issue.labels} max={6} />}
          </div>

          <Separator className="my-6" />

          <div className="prose prose-invert max-w-none">
            <p className="text-[15px] leading-relaxed text-t2">
              {issue.description ??
                'No description provided yet. This panel will host a Notion-style block editor once the Kibo `editor` component is wired in.'}
            </p>

            <h3 className="mt-8 text-sm font-semibold uppercase tracking-wide text-t3">
              Acceptance criteria
            </h3>
            <ul className="mt-2 space-y-1 text-t2">
              <li>— Renders in Electron and standalone browser identically</li>
              <li>— Uses Relay fragments, no prop-drilling</li>
              <li>— Optimistic updates survive refresh</li>
            </ul>
          </div>

          <Separator className="my-8" />

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <MessageSquare className="h-3.5 w-3.5" />
              Comment
            </Button>
            <Button variant="ghost" size="sm">
              <Paperclip className="h-3.5 w-3.5" />
              Attach
            </Button>
            <Button variant="ghost" size="sm">
              <Link2 className="h-3.5 w-3.5" />
              Copy link
            </Button>
          </div>
        </div>
      </article>

      <aside className="hidden w-[280px] shrink-0 border-l border-border bg-bg-1/60 p-5 lg:block">
        <h4 className="text-[11px] font-semibold uppercase tracking-wide text-t3">Properties</h4>
        <dl className="mt-3 space-y-4 text-sm">
          <Property label="Status" value={<StatusBadge status={issue.status} />} />
          <Property label="Priority" value={<PriorityBadge priority={issue.priority} />} />
          <Property label="Assignees" value={<AvatarStack users={issue.assignees} />} />
          <Property label="Reporter" value={<AvatarStack users={[issue.reporter]} size="sm" />} />
          <Property
            label="Due date"
            value={
              <span className="inline-flex items-center gap-1 text-t1">
                <Calendar className="h-3.5 w-3.5 text-t3" />
                {formatDate(issue.dueAt)}
              </span>
            }
          />
          <Property label="Labels" value={<TagList labels={issue.labels} max={6} />} />
        </dl>
      </aside>
    </div>
  )
}

const Property = ({ label, value }: { label: string; value: ReactNode }) => (
  <div>
    <dt className="text-[11px] uppercase tracking-wide text-t3">{label}</dt>
    <dd className="mt-1 text-t1">{value}</dd>
  </div>
)
