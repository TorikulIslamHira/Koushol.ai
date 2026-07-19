import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/app/providers/AuthProvider'
import { Layout } from '@/app/Layout'
import { RequireAuth } from '@/features/auth/components/RequireAuth'
import { HomePage } from '@/pages/HomePage'
import { LoginPage } from '@/pages/LoginPage'
import { SignupPage } from '@/pages/SignupPage'
import { CoursesPage } from '@/pages/CoursesPage'
import { CourseDetailPage } from '@/pages/CourseDetailPage'
import { ChapterPage } from '@/pages/ChapterPage'
import { DashboardPage } from '@/pages/DashboardPage'

/** Root component: wires up auth context and Phase 1 routes (see PROJECT.md Section 8). */
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
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
