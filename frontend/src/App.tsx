import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Sidebar } from './components/Sidebar'
import { TargetsPage } from './pages/TargetsPage'
import { AlertsPage } from './pages/AlertsPage'
import { DashboardPage } from './pages/DashboardPage'

function App() {
  return (
    <BrowserRouter>
      <div className="relative flex min-h-screen bg-background font-sans font-antialiased">
        <Sidebar />
        <main className="flex-1 ml-64">
          <div className="container max-w-6xl py-8 px-8">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/targets" element={<TargetsPage />} />
              <Route path="/alerts" element={<AlertsPage />} />

            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
