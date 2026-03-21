/**
 * OpenLobby — Root Application
 */
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Component, useEffect } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Toaster } from 'sonner';
import i18n from './i18n';
import { MainLayout } from './components/layout/MainLayout';
import { TooltipProvider } from '@/components/ui/tooltip';

// Pages
import { Lobby } from './pages/Lobby';
import { LobbyChat } from './pages/LobbyChat';
import { LobbyAssistants } from './pages/LobbyAssistants';
import { LobbyConnections } from './pages/LobbyConnections';
import { LobbyPowers } from './pages/LobbyPowers';
import { LobbyAutomations } from './pages/LobbyAutomations';
import { LobbyAISetup } from './pages/LobbyAISetup';
import { Settings } from './pages/Settings';
import { LobbySettings } from './pages/LobbySettings';
import { Setup } from './pages/Setup';
import { Onboarding } from './pages/Onboarding';
import { WebGLTest } from './pages/WebGLTest';
import { Office3D } from './pages/Office3D';

import { useSettingsStore } from './stores/settings';
import { useGatewayStore } from './stores/gateway';
import { applyGatewayTransportPreference } from './lib/api-client';


class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('React Error Boundary caught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '40px',
          color: '#f87171',
          background: '#0f172a',
          minHeight: '100vh',
          fontFamily: 'monospace'
        }}>
          <h1 style={{ fontSize: '24px', marginBottom: '16px' }}>Something went wrong</h1>
          <pre style={{
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
            background: '#1e293b',
            padding: '16px',
            borderRadius: '8px',
            fontSize: '14px'
          }}>
            {this.state.error?.message}
            {'\n\n'}
            {this.state.error?.stack}
          </pre>
          <button
            onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
            style={{
              marginTop: '16px',
              padding: '8px 16px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const initSettings = useSettingsStore((state) => state.init);
  const theme = useSettingsStore((state) => state.theme);
  const language = useSettingsStore((state) => state.language);
  const setupComplete = useSettingsStore((state) => state.setupComplete);
  const initGateway = useGatewayStore((state) => state.init);

  useEffect(() => { initSettings(); }, [initSettings]);

  useEffect(() => {
    if (language && language !== i18n.language) {
      i18n.changeLanguage(language);
    }
  }, [language]);

  useEffect(() => { initGateway(); }, [initGateway]);

  // Redirect to onboarding if not complete
  useEffect(() => {
    if (!setupComplete && !location.pathname.startsWith('/setup') && !location.pathname.startsWith('/onboarding')) {
      navigate('/onboarding');
    }
  }, [setupComplete, location.pathname, navigate]);

  useEffect(() => {
    const handleNavigate = (...args: unknown[]) => {
      const path = args[0];
      if (typeof path === 'string') navigate(path);
    };
    const unsubscribe = window.electron.ipcRenderer.on('navigate', handleNavigate);
    return () => { if (typeof unsubscribe === 'function') unsubscribe(); };
  }, [navigate]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  useEffect(() => { applyGatewayTransportPreference(); }, []);

  return (
    <ErrorBoundary>
      <TooltipProvider delayDuration={300}>
        <Routes>
          {/* Onboarding */}
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/setup/*" element={<Onboarding />} />

          {/* Main application */}
          <Route element={<MainLayout />}>
            {/* OpenLobby routes */}
            <Route path="/" element={<Lobby />} />
            <Route path="/chat" element={<LobbyChat />} />
            <Route path="/assistants" element={<LobbyAssistants />} />
            <Route path="/connections" element={<LobbyConnections />} />
            <Route path="/powers" element={<LobbyPowers />} />
            <Route path="/automations" element={<LobbyAutomations />} />
            <Route path="/ai-setup" element={<LobbyAISetup />} />
            <Route path="/settings" element={<LobbySettings />} />
            <Route path="/settings/*" element={<LobbySettings />} />
            <Route path="/webgl-test" element={<WebGLTest />} />
            <Route path="/office" element={<Office3D />} />
          </Route>
        </Routes>

        <Toaster
          position="bottom-right"
          richColors
          closeButton
          style={{ zIndex: 99999 }}
        />
      </TooltipProvider>
    </ErrorBoundary>
  );
}

export default App;
