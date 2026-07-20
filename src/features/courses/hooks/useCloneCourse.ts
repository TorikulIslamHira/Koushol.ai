import { useCallback, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth/hooks/useAuth'
import type { CourseRow, ModuleRow, TopicRow, QuizRow } from '@/types/database'

/**
 * Deep-copies a course (modules -> topics -> quiz) as a starting point for a new one. Pure
 * app-level inserts under the teacher's own account — no new schema or RLS needed, since
 * "create your own course/module/topic/quiz" is already exactly what the existing
 * owner-only insert policies allow. Deliberately doesn't copy enrollments, progress,
 * reviews, certificates, or topic_audio — those are either student data that shouldn't
 * follow a template, or generated content (audio) cheap enough to regenerate for the copy.
 */
export function useCloneCourse() {
  const { session } = useAuth()
  const [cloning, setCloning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cloneCourse = useCallback(
    async (courseId: string): Promise<CourseRow | null> => {
      if (!session) return null
      setCloning(true)
      setError(null)
      try {
        const [{ data: sourceCourse, error: courseError }, { data: sourceModules, error: modulesError }] =
          await Promise.all([
            supabase.from('courses').select('*').eq('id', courseId).single(),
            supabase.from('modules').select('*').eq('course_id', courseId).order('order_index'),
          ])
        if (courseError || !sourceCourse) {
          setError(courseError?.message ?? 'Course not found.')
          return null
        }
        if (modulesError) {
          setError(modulesError.message)
          return null
        }
        const modules = (sourceModules as ModuleRow[]) ?? []

        const moduleIds = modules.map((m) => m.id)
        const [{ data: allTopics }, { data: allQuizzes }] = await Promise.all([
          moduleIds.length > 0
            ? supabase.from('topics').select('*').in('module_id', moduleIds).order('order_index')
            : Promise.resolve({ data: [] as TopicRow[] }),
          moduleIds.length > 0
            ? supabase.from('quizzes').select('*').in('module_id', moduleIds)
            : Promise.resolve({ data: [] as QuizRow[] }),
        ])
        const topicsByModule = new Map<string, TopicRow[]>()
        for (const topic of (allTopics as TopicRow[]) ?? []) {
          const list = topicsByModule.get(topic.module_id) ?? []
          list.push(topic)
          topicsByModule.set(topic.module_id, list)
        }
        const quizByModule = new Map<string, QuizRow>()
        for (const quiz of (allQuizzes as QuizRow[]) ?? []) {
          quizByModule.set(quiz.module_id, quiz)
        }

        const src = sourceCourse as CourseRow
        const { data: newCourse, error: newCourseError } = await supabase
          .from('courses')
          .insert({
            teacher_id: session.user.id,
            title: `Copy of ${src.title}`,
            description: src.description,
            price: src.price,
            category: src.category,
            status: 'draft',
          })
          .select('*')
          .single()
        if (newCourseError || !newCourse) {
          setError(newCourseError?.message ?? 'Failed to create the cloned course.')
          return null
        }
        const createdCourse = newCourse as CourseRow

        for (const module of modules) {
          const { data: newModule, error: newModuleError } = await supabase
            .from('modules')
            .insert({ course_id: createdCourse.id, order_index: module.order_index, title: module.title })
            .select('id')
            .single()
          if (newModuleError || !newModule) {
            setError(newModuleError?.message ?? `Failed to clone module "${module.title}".`)
            return createdCourse
          }

          const topics = topicsByModule.get(module.id) ?? []
          if (topics.length > 0) {
            const { error: topicsError } = await supabase.from('topics').insert(
              topics.map((topic) => ({
                module_id: newModule.id,
                order_index: topic.order_index,
                title: topic.title,
                content: topic.content,
              })),
            )
            if (topicsError) {
              setError(topicsError.message)
              return createdCourse
            }
          }

          const quiz = quizByModule.get(module.id)
          if (quiz) {
            const { error: quizError } = await supabase
              .from('quizzes')
              .insert({ module_id: newModule.id, questions: quiz.questions })
            if (quizError) {
              setError(quizError.message)
              return createdCourse
            }
          }
        }

        return createdCourse
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to clone course.')
        return null
      } finally {
        setCloning(false)
      }
    },
    [session],
  )

  return { cloneCourse, cloning, error }
}
