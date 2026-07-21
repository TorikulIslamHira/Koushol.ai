import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { HelpCircle } from 'lucide-react'
import { useMyDoubts } from '@/features/doubts/hooks/useMyDoubts'
import { AccountNav } from '@/features/account/components/AccountNav'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'

/** Student's doubt-chat conversations, grouped by topic ("/doubts"). */
export function DoubtsPage() {
  const { threads, loading } = useMyDoubts()
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-6">
      <AccountNav />
      <h1 className="font-display text-xl font-semibold text-brand-ink">{t('doubtsPage.title')}</h1>

      {loading ? (
        <Spinner />
      ) : threads.length === 0 ? (
        <EmptyState icon={HelpCircle} title={t('doubtsPage.emptyState')} />
      ) : (
        <div className="flex flex-col gap-4">
          {threads.map((thread) => (
            <Link
              key={thread.topicId}
              to={`/courses/${thread.courseId}/modules/${thread.moduleId}?topic=${thread.topicId}`}
              className="group block"
            >
              <Card className="flex flex-col gap-2 transition-shadow duration-150 group-hover:shadow-md">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="font-display font-semibold text-brand-ink group-hover:text-brand-green">
                    {thread.topicTitle}
                  </h2>
                  <Badge tone="neutral">{t('doubtsPage.messageCount', { count: thread.messageCount })}</Badge>
                </div>
                <p className="text-xs text-slate-400">{thread.courseTitle}</p>
                <p className="line-clamp-2 text-sm text-slate-600">{thread.lastMessage.content}</p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
