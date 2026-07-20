import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'
import { useCourse } from '@/features/courses/hooks/useCourse'
import { useTopicMutations } from '@/features/chapters/hooks/useTopicMutations'
import { TopicForm } from '@/features/chapters/components/TopicForm'
import { GenerateAudioPanel } from '@/features/chapters/components/GenerateAudioPanel'
import { VideoPanel } from '@/features/chapters/components/VideoPanel'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'

/** Topic content editor ("/teach/courses/:courseId/modules/:moduleId/topics/:topicId"). */
export function TeacherTopicEditorPage() {
  const { courseId, moduleId, topicId } = useParams<{
    courseId: string
    moduleId: string
    topicId: string
  }>()
  const { course, modules, loading, refetch } = useCourse(courseId)
  const { updateTopic, saving: savingTopic } = useTopicMutations(moduleId ?? '', refetch)
  const { t } = useTranslation()

  if (loading) return <Spinner />
  if (!course || !courseId || !moduleId || !topicId) {
    return <p className="text-slate-500">{t('topics.notFound')}</p>
  }

  const module = modules.find((m) => m.id === moduleId)
  const topic = module?.topics.find((tp) => tp.id === topicId)
  if (!module || !topic) return <p className="text-slate-500">{t('topics.topicNotFound')}</p>

  return (
    <div className="flex flex-col gap-6">
      <Link
        to={`/teach/courses/${courseId}/modules/${moduleId}`}
        className="flex items-center gap-1 text-sm text-brand-green transition-colors duration-150 hover:underline"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        {module.title}
      </Link>
      <h1 className="font-display text-2xl font-semibold text-brand-ink">
        {topic.title || t('topics.untitled')}
      </h1>

      <Card>
        <TopicForm
          topic={topic}
          saving={savingTopic}
          onSave={(title, content) => updateTopic(topicId, title, content)}
        />
      </Card>

      <Card>
        <h2 className="mb-4 font-display text-lg font-semibold text-brand-ink">
          {t('topics.audioHeading')}
        </h2>
        <GenerateAudioPanel topicId={topicId} />
      </Card>

      <Card>
        <h2 className="mb-4 font-display text-lg font-semibold text-brand-ink">
          {t('video.heading')}
        </h2>
        <VideoPanel topicId={topicId} videoPath={topic.video_path} onChanged={refetch} />
      </Card>
    </div>
  )
}
