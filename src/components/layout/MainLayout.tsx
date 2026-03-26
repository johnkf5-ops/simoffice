/**
 * SimOffice Main Layout
 * Toolbar always visible at top. Sidebar hidden on SimOffice pages.
 */
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TitleBar } from './TitleBar';
import { Toolbar } from './Toolbar';
import { LicenseBanner } from '../common/LicenseBanner';

export function MainLayout() {
  const location = useLocation();
  const lobbyPages = ['/', '/chat', '/assistants', '/connections', '/powers', '/automations', '/ai-setup', '/settings', '/trading'];
  const isFullScreen = lobbyPages.includes(location.pathname);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <TitleBar />
      <LicenseBanner />
      <Toolbar />

      <div className="flex flex-1 overflow-hidden">
        {!isFullScreen && <Sidebar />}

        <main className="flex-1 overflow-hidden">
          {isFullScreen ? (
            <Outlet />
          ) : (
            <div className="min-h-full p-8 overflow-auto h-full">
              <Outlet />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
