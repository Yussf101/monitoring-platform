import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { TargetsPage } from './pages/TargetsPage';
import { AlertsPage } from './pages/AlertsPage';
import { DashboardPage } from './pages/DashboardPage';
import { DiscoveryPage } from './pages/DiscoveryPage';
import { getTargets, getAlerts } from './lib/api';

function AnimatedRoutes({ refreshTrigger }: { refreshTrigger: number }) {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        className="w-full"
      >
        <Routes location={location}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage refreshTrigger={refreshTrigger} />} />
          <Route path="/targets" element={<TargetsPage refreshTrigger={refreshTrigger} />} />
          <Route path="/alerts" element={<AlertsPage refreshTrigger={refreshTrigger} />} />
          <Route path="/discovery" element={<DiscoveryPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

function App() {
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(30); // 30s default
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [targetCount, setTargetCount] = useState<number>(0);
  const [firingCount, setFiringCount] = useState<number>(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  const fetchGlobalStats = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [tList, aList] = await Promise.all([
        getTargets().catch(() => []),
        getAlerts(50, 0).catch(() => []),
      ]);
      setTargetCount(tList.length);
      setFiringCount(aList.filter(a => a.status === 'firing').length);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const triggerRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
    fetchGlobalStats();
  }, [fetchGlobalStats]);

  useEffect(() => {
    fetchGlobalStats();
  }, [fetchGlobalStats]);

  // Handle auto-refresh interval
  useEffect(() => {
    if (autoRefreshInterval <= 0) return;
    const interval = setInterval(() => {
      triggerRefresh();
    }, autoRefreshInterval * 1000);
    return () => clearInterval(interval);
  }, [autoRefreshInterval, triggerRefresh]);

  return (
    <BrowserRouter>
      <div className="min-h-dvh bg-[#0d1117] font-sans antialiased text-[#e6edf3] flex flex-col">
        {/* GitHub Slide-over Drawer */}
        <Sidebar 
          targetCount={targetCount} 
          firingCount={firingCount} 
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Global GitHub Header + Repository UnderlineNav */}
        <Header
          autoRefreshInterval={autoRefreshInterval}
          onAutoRefreshChange={setAutoRefreshInterval}
          onRefresh={triggerRefresh}
          isRefreshing={isRefreshing}
          totalTargets={targetCount}
          firingAlerts={firingCount}
          onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
        />

        {/* Repository Content Canvas with Page Transitions */}
        <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 md:px-8 py-6">
          <AnimatedRoutes refreshTrigger={refreshTrigger} />
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
