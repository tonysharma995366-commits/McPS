import React, { useState, useEffect, lazy, Suspense, useCallback } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import TopBar from './components/TopBar.jsx';
import BottomNav from './components/BottomNav.jsx';
import Drawer from './components/Drawer.jsx';
import Toast from './components/Toast.jsx';
import OperationToast from './components/OperationToast.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import NetworkBanner from './components/NetworkBanner.jsx';
import PageWrapper from './components/PageWrapper.jsx';
import { OperationsProvider } from './lib/operations.js';
import { api } from './lib/api.js';

// Direct import for initial Dashboard view, lazy for remaining routes
import Dashboard from './pages/Dashboard.jsx';
const Console = lazy(() => import('./pages/Console.jsx'));
const Players = lazy(() => import('./pages/Players.jsx'));
const Plugins = lazy(() => import('./pages/Plugins.jsx'));
const Settings = lazy(() => import('./pages/Settings.jsx'));
const Backups = lazy(() => import('./pages/Backups.jsx'));
const Properties = lazy(() => import('./pages/Properties.jsx'));
const About = lazy(() => import('./pages/About.jsx'));
const Diagnostics = lazy(() => import('./pages/Diagnostics.jsx'));

/**
 * Route title mapping for dynamic TopBar
 */
function getRouteTitle(pathname) {
  switch (pathname) {
    case '/':
      return 'Dashboard';
    case '/console':
      return 'Console';
    case '/players':
      return 'Players';
    case '/plugins':
      return 'Plugins';
    case '/settings':
      return 'World & Settings';
    case '/backups':
      return 'Backups';
    case '/properties':
      return 'Server Properties';
    case '/about':
      return 'App Info';
    case '/diagnostics':
      return 'Diagnostics';
    default:
      return 'Dashboard';
  }
}

function MainLayout() {
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [serverStatus, setServerStatus] = useState('running');
  const [consoleConnection, setConsoleConnection] = useState('live');
  const [toasts, setToasts] = useState([]);

  // Stack up to 3 toasts with auto-dismiss
  const showToast = useCallback((message, type = 'success') => {
    setToasts((prev) => [
      ...prev.slice(-2),
      { id: Date.now() + Math.random(), message, type },
    ]);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => (id ? prev.filter((t) => t.id !== id) : []));
  }, []);

  const handleLogout = () => {
    showToast('Logged out of admin session', 'success');
  };

  // Light route prefetching after Dashboard initial load
  useEffect(() => {
    const timer = setTimeout(() => {
      api.getOnlinePlayers().catch(() => null);
      api.getPlugins().catch(() => null);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  const pageTitle = getRouteTitle(location.pathname);
  const isConsoleRoute = location.pathname === '/console';

  return (
    <div className="min-h-screen bg-[#0f1115] text-[#e5e7eb] flex justify-center">
      {/* 480px Centered Mobile Frame */}
      <div className="w-full max-w-[480px] min-h-screen flex flex-col relative bg-[#0f1115]">
        {/* Fixed Top Bar (52px) */}
        <TopBar
          title={pageTitle}
          status={serverStatus}
          connectionIndicator={isConsoleRoute ? consoleConnection : null}
          onOpenDrawer={() => setDrawerOpen(true)}
        />

        {/* Global Network Status Banner */}
        <NetworkBanner />

        {/* Drawer Component */}
        <Drawer
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          onLogout={handleLogout}
        />

        {/* Main Content Area */}
        <main className={`flex-1 ${isConsoleRoute ? 'p-0' : 'px-3 pt-[64px] pb-[72px]'}`}>
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-24 select-none">
                <Loader2 className="animate-spin text-[#4ade80]" size={24} />
              </div>
            }
          >
            <Routes>
              <Route
                path="/"
                element={
                  <PageWrapper>
                    <Dashboard
                      showToast={showToast}
                      onStatusChange={(newStatus) => setServerStatus(newStatus)}
                    />
                  </PageWrapper>
                }
              />
              <Route
                path="/console"
                element={
                  <PageWrapper>
                    <Console
                      showToast={showToast}
                      onConnectionChange={setConsoleConnection}
                    />
                  </PageWrapper>
                }
              />
              <Route
                path="/players"
                element={
                  <PageWrapper>
                    <Players showToast={showToast} />
                  </PageWrapper>
                }
              />
              <Route
                path="/plugins"
                element={
                  <PageWrapper>
                    <Plugins showToast={showToast} />
                  </PageWrapper>
                }
              />
              <Route
                path="/settings"
                element={
                  <PageWrapper>
                    <Settings showToast={showToast} />
                  </PageWrapper>
                }
              />
              <Route
                path="/backups"
                element={
                  <PageWrapper>
                    <Backups showToast={showToast} />
                  </PageWrapper>
                }
              />
              <Route
                path="/properties"
                element={
                  <PageWrapper>
                    <Properties showToast={showToast} />
                  </PageWrapper>
                }
              />
              <Route
                path="/about"
                element={
                  <PageWrapper>
                    <About showToast={showToast} />
                  </PageWrapper>
                }
              />
              <Route
                path="/diagnostics"
                element={
                  <PageWrapper>
                    <Diagnostics showToast={showToast} />
                  </PageWrapper>
                }
              />
              <Route
                path="*"
                element={
                  <PageWrapper>
                    <Dashboard
                      showToast={showToast}
                      onStatusChange={(newStatus) => setServerStatus(newStatus)}
                    />
                  </PageWrapper>
                }
              />
            </Routes>
          </Suspense>
        </main>

        {/* Global Toast Component */}
        <Toast toasts={toasts} onDismiss={dismissToast} />

        {/* Global Long-Running Operation Progress Toast */}
        <OperationToast />

        {/* Fixed Bottom Nav (60px) */}
        <BottomNav />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <OperationsProvider>
        <HashRouter>
          <MainLayout />
        </HashRouter>
      </OperationsProvider>
    </ErrorBoundary>
  );
}
