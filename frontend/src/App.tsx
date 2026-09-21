import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Navbar } from './components/Navbar'
import { TargetsPage } from './pages/TargetsPage'

function App() {
  return (
    <BrowserRouter>
      <div className="relative flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="flex-1">
          <div className="container py-6">
            <Routes>
              <Route path="/" element={<Navigate to="/targets" replace />} />
              <Route path="/targets" element={<TargetsPage />} />
              <Route path="/alerts" element={<div>Alerts Page Placeholder</div>} />

            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
