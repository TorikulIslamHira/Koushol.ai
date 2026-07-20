import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AuthProvider } from '@/app/providers/AuthProvider'
import { Layout } from '@/app/Layout'
import { RequireAuth } from '@/features/auth/components/RequireAuth'
import { RequireTeacher } from '@/features/auth/components/RequireTeacher'
import { RequireAdmin } from '@/features/auth/components/RequireAdmin'
import { HomePage } from '@/pages/HomePage'
import { LoginPage } from '@/pages/LoginPage'
import { SignupPage } from '@/pages/SignupPage'
import { CoursesPage } from '@/pages/CoursesPage'
import { CourseDetailPage } from '@/pages/CourseDetailPage'
import { ModulePage } from '@/pages/ModulePage'
import { DashboardPage } from '@/pages/DashboardPage'
import { TeacherDashboardPage } from '@/pages/TeacherDashboardPage'
import { NewCoursePage } from '@/pages/NewCoursePage'
import { CourseEditorPage } from '@/pages/CourseEditorPage'
import { TeacherModuleEditorPage } from '@/pages/TeacherModuleEditorPage'
import { TeacherTopicEditorPage } from '@/pages/TeacherTopicEditorPage'
import { CourseAnalyticsPage } from '@/pages/CourseAnalyticsPage'
import { AdminDashboardPage } from '@/pages/AdminDashboardPage'
import { AdminUsersPage } from '@/pages/AdminUsersPage'
import { AdminCourseReviewPage } from '@/pages/AdminCourseReviewPage'
import { TermsPage } from '@/pages/TermsPage'
import { PrivacyPage } from '@/pages/PrivacyPage'
import { VerifyCertificatePage } from '@/pages/VerifyCertificatePage'
import { TeacherProfilePage } from '@/pages/TeacherProfilePage'
import { NotFoundPage } from '@/pages/NotFoundPage'

/** Root component: wires up auth context, i18n, and Phase 1-5 routes (see PROJECT.md Section 8). */
export function App() {
  const { i18n } = useTranslation()

  // Keeps <html lang> in sync with the selected UI language — matters for accessibility
  // (screen readers picking pronunciation) and gives the browser a correct script hint.
  useEffect(() => {
    document.documentElement.lang = i18n.language
  }, [i18n.language])

  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/courses" element={<CoursesPage />} />
            <Route path="/courses/:courseId" element={<CourseDetailPage />} />
            {/*
              Not wrapped in RequireAuth: the first topic of the first module is a public
              free preview (see PROJECT.md Section 10). ModulePage itself redirects away if
              a signed-out/non-enrolled visitor requests a locked module.
            */}
            <Route path="/courses/:courseId/modules/:moduleId" element={<ModulePage />} />
            <Route
              path="/dashboard"
              element={
                <RequireAuth>
                  <DashboardPage />
                </RequireAuth>
              }
            />
            <Route
              path="/teach"
              element={
                <RequireTeacher>
                  <TeacherDashboardPage />
                </RequireTeacher>
              }
            />
            <Route
              path="/teach/courses/new"
              element={
                <RequireTeacher>
                  <NewCoursePage />
                </RequireTeacher>
              }
            />
            <Route
              path="/teach/courses/:courseId"
              element={
                <RequireTeacher>
                  <CourseEditorPage />
                </RequireTeacher>
              }
            />
            <Route
              path="/teach/courses/:courseId/modules/:moduleId"
              element={
                <RequireTeacher>
                  <TeacherModuleEditorPage />
                </RequireTeacher>
              }
            />
            <Route
              path="/teach/courses/:courseId/modules/:moduleId/topics/:topicId"
              element={
                <RequireTeacher>
                  <TeacherTopicEditorPage />
                </RequireTeacher>
              }
            />
            <Route
              path="/teach/courses/:courseId/analytics"
              element={
                <RequireTeacher>
                  <CourseAnalyticsPage />
                </RequireTeacher>
              }
            />
            <Route
              path="/admin"
              element={
                <RequireAdmin>
                  <AdminDashboardPage />
                </RequireAdmin>
              }
            />
            <Route
              path="/admin/users"
              element={
                <RequireAdmin>
                  <AdminUsersPage />
                </RequireAdmin>
              }
            />
            <Route
              path="/admin/courses"
              element={
                <RequireAdmin>
                  <AdminCourseReviewPage />
                </RequireAdmin>
              }
            />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/verify/:certificateId" element={<VerifyCertificatePage />} />
            <Route path="/teachers/:teacherId" element={<TeacherProfilePage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
