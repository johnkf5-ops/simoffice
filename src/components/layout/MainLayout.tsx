/**
 * SimOffice Main Layout
 * Toolbar always visible at top. Content fills remaining space.
 */
import { Outlet } from 'react-router-dom';
import { TitleBar } from './TitleBar';
import { Toolbar } from './Toolbar';
import { LicenseBanner } from '../common/LicenseBanner';

export function MainLayout() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <TitleBar />
      <LicenseBanner />
      <Toolbar />

      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
