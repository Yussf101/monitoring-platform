import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Navbar } from './components/Navbar'
import { TargetsPage } from './pages/TargetsPage'
import { AlertsPage } from './pages/AlertsPage'
import { DashboardPage } from './pages/DashboardPage'

function App() {
  return (
    <BrowserRouter>
      <div className="relative flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="flex-1">
          <div className="container py-6">
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
