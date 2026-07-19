import { BrowserRouter, Routes, Route } from 'react-router-dom'
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
import { ChapterPage } from '@/pages/ChapterPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { TeacherDashboardPage } from '@/pages/TeacherDashboardPage'
import { NewCoursePage } from '@/pages/NewCoursePage'
import { CourseEditorPage } from '@/pages/CourseEditorPage'
import { TeacherChapterEditorPage } from '@/pages/TeacherChapterEditorPage'
import { CourseAnalyticsPage } from '@/pages/CourseAnalyticsPage'
import { AdminDashboardPage } from '@/pages/AdminDashboardPage'
import { AdminUsersPage } from '@/pages/AdminUsersPage'
import { AdminCourseReviewPage } from '@/pages/AdminCourseReviewPage'

/** Root component: wires up auth context and Phase 1-5 routes (see PROJECT.md Section 8). */
export function App() {
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
              Not wrapped in RequireAuth: chapter order_index 0 is a public free
              preview (see PROJECT.md Section 10). ChapterPage itself redirects
              away if a signed-out/non-enrolled visitor requests a locked chapter.
            */}
            <Route path="/courses/:courseId/chapters/:chapterId" element={<ChapterPage />} />
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
              path="/teach/courses/:courseId/chapters/:chapterId"
              element={
                <RequireTeacher>
                  <TeacherChapterEditorPage />
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
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
