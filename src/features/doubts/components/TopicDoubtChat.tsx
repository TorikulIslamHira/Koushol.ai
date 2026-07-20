import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MessageCircleQuestion, Send } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { useTopicChat } from '@/features/doubts/hooks/useTopicChat'

/** AI doubt-solving chat for the current topic — enrolled students only (a real Groq call per message, unlike free reading). */
export function TopicDoubtChat({ topicId }: { topicId: string }) {
  const { t } = useTranslation()
  const { messages, loading, asking, error, askQuestion } = useTopicChat(topicId)
  const [question, setQuestion] = useState('')

  async function handleAsk() {
    if (!question.trim()) return
    const q = question
    setQuestion('')
    await askQuestion(q)
  }

  if (loading) return null

  return (
    <Card className="flex flex-col gap-3">
      <h3 className="flex items-center gap-1.5 font-display text-sm font-semibold text-brand-ink">
        <MessageCircleQuestion className="h-4 w-4 text-brand-green" aria-hidden="true" />
        {t('doubts.heading')}
      </h3>

      {messages.length === 0 && <p className="text-xs text-slate-500">{t('doubts.empty')}</p>}

      {messages.length > 0 && (
        <div className="flex max-h-80 flex-col gap-2 overflow-y-auto">
          {messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                'max-w-[85%] rounded-lg px-3 py-2 text-sm',
                m.role === 'user'
                  ? 'self-end bg-brand-green/10 text-brand-ink'
                  : 'self-start bg-slate-100 text-slate-700',
              )}
            >
              {m.content}
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <Input
          type="text"
          placeholder={t('doubts.placeholder')}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAsk()
          }}
          disabled={asking}
          className="flex-1 text-sm"
        />
        <Button type="button" onClick={handleAsk} disabled={asking || !question.trim()} className="gap-1.5">
          <Send className="h-4 w-4" aria-hidden="true" />
          {asking ? t('doubts.asking') : t('doubts.ask')}
        </Button>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
    </Card>
  )
}
