import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'

// Pages
import LandingPage from '@/pages/LandingPage'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import DashboardPage from '@/pages/DashboardPage'
import ProjectsPage from '@/pages/ProjectsPage'
import ProjectDetailPage from '@/pages/ProjectDetailPage'
import ProjectEditorPage from '@/pages/ProjectEditorPage'
import ExecutePage from '@/pages/ExecutePage'
import BenchmarksPage from '@/pages/BenchmarksPage'
import LanguagesPage from '@/pages/LanguagesPage'
import DevicesPage from '@/pages/DevicesPage'
import AnalyticsPage from '@/pages/AnalyticsPage'
import PluginsPage from '@/pages/PluginsPage'
import TerminalPage from '@/pages/TerminalPage'
import DocsPage from '@/pages/DocsPage'
import SettingsPage from '@/pages/SettingsPage'
import AdminPage from '@/pages/AdminPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/docs" element={<DocsPage />} />

        {/* Protected routes inside AppLayout */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:id" element={<ProjectDetailPage />} />
            <Route path="/projects/:id/editor" element={<ProjectEditorPage />} />
            <Route path="/execute" element={<ExecutePage />} />
            <Route path="/benchmarks" element={<BenchmarksPage />} />
            <Route path="/languages" element={<LanguagesPage />} />
            <Route path="/devices" element={<DevicesPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/plugins" element={<PluginsPage />} />
            <Route path="/terminal" element={<TerminalPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
