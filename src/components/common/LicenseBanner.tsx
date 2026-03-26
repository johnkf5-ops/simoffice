/**
 * License Banner
 * Non-blocking banner at top of app for non-ideal subscription states
 */
import { useLicenseStore } from '@/stores/license';

export function LicenseBanner() {
  const status = useLicenseStore((s) => s.status);
  const validUntil = useLicenseStore((s) => s.validUntil);
  const openPortal = useLicenseStore((s) => s.openPortal);

  // No banner for healthy states
  if (status === 'active' || status === 'valid' || status === 'loading' || status === 'invalid') {
    return null;
  }

  const endDate = validUntil ? new Date(validUntil * 1000).toLocaleDateString() : '';

  const config: Record<string, { message: string; action: string; bg: string; color: string; handler: () => void }> = {
    trialing: {
      message: `You're on a free trial${endDate ? `. Add a payment method to continue after ${endDate}.` : '.'}`,
      action: 'Manage',
      bg: 'rgba(59, 130, 246, 0.12)',
      color: '#3b82f6',
      handler: openPortal,
    },
    past_due: {
      message: 'Payment failed. Update your payment method to keep your subscription.',
      action: 'Manage',
      bg: 'rgba(234, 179, 8, 0.12)',
      color: '#eab308',
      handler: openPortal,
    },
    canceling: {
      message: `Your subscription ends on ${endDate}.`,
      action: 'Resubscribe',
      bg: 'rgba(249, 115, 22, 0.12)',
      color: '#f97316',
      handler: () => window.electron.openExternal('https://simoffice.xyz'),
    },
    expired: {
      message: 'Your subscription has expired.',
      action: 'Resubscribe',
      bg: 'rgba(239, 68, 68, 0.12)',
      color: '#ef4444',
      handler: () => window.electron.openExternal('https://simoffice.xyz'),
    },
  };

  const c = config[status];
  if (!c) return null;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      padding: '8px 16px',
      background: c.bg,
      borderBottom: `1px solid ${c.color}22`,
      fontSize: 13,
      color: c.color,
      flexShrink: 0,
    }}>
      <span>{c.message}</span>
      <button
        onClick={c.handler}
        style={{
          padding: '4px 12px',
          borderRadius: 6,
          border: `1px solid ${c.color}44`,
          background: `${c.color}18`,
          color: c.color,
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        {c.action}
      </button>
    </div>
  );
}
