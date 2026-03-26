/**
 * License State Store
 * Manages subscription license validation and activation
 */
import { create } from 'zustand';
import { toast } from 'sonner';
import { invokeIpc } from '@/lib/api-client';

export type LicenseStatus =
  | 'loading'
  | 'valid'
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceling'
  | 'expired'
  | 'invalid';

interface LicenseState {
  key: string | null;
  status: LicenseStatus;
  validUntil: number | null;
  email: string | null;
  error: string | null;
  checking: boolean;
  initialized: boolean;

  init: () => Promise<void>;
  activate: (key: string) => Promise<boolean>;
  validate: () => Promise<void>;
  deactivate: () => void;
  openPortal: () => Promise<void>;
}

export const useLicenseStore = create<LicenseState>((set, get) => ({
  key: null,
  status: 'loading',
  validUntil: null,
  email: null,
  error: null,
  checking: false,
  initialized: false,

  init: async () => {
    if (get().initialized) return;

    try {
      const cached = await invokeIpc<{
        key: string | null;
        status: string | null;
        validUntil: number | null;
        email: string | null;
      }>('license:get');

      if (!cached?.key) {
        // No license key stored — show activation screen
        set({ status: 'invalid', initialized: true });
        return;
      }

      // Set from cache immediately (so app renders without waiting for network)
      const cachedStatus = mapServerStatus(cached.status);
      set({
        key: cached.key,
        status: cachedStatus,
        validUntil: cached.validUntil,
        email: cached.email,
        initialized: true,
      });

      // Background validate against server
      get().validate();
    } catch {
      set({ status: 'invalid', initialized: true });
    }
  },

  activate: async (key: string) => {
    set({ checking: true, error: null });

    try {
      // Store key locally first
      await invokeIpc('license:store', key);

      // Validate with server
      const result = await invokeIpc<{
        valid: boolean;
        status?: string;
        valid_until?: number;
        email?: string | null;
        reason?: string;
      }>('license:validate', key);

      if (result?.valid) {
        set({
          key,
          status: mapServerStatus(result.status ?? null),
          validUntil: result.valid_until ?? null,
          email: result.email ?? null,
          checking: false,
          error: null,
        });
        return true;
      }

      // Invalid — clear and show error
      await invokeIpc('license:clear');
      const errorMsg = getErrorMessage(result?.reason);
      set({ key: null, status: 'invalid', checking: false, error: errorMsg });
      return false;
    } catch {
      await invokeIpc('license:clear').catch(() => {});
      set({ key: null, status: 'invalid', checking: false, error: 'Could not verify license. Check your internet connection.' });
      return false;
    }
  },

  validate: async () => {
    const { key } = get();
    if (!key) return;

    set({ checking: true });

    try {
      const result = await invokeIpc<{
        valid: boolean;
        status?: string;
        valid_until?: number;
        email?: string | null;
        reason?: string;
      }>('license:validate', key);

      if (result?.valid) {
        set({
          status: mapServerStatus(result.status ?? null),
          validUntil: result.valid_until ?? null,
          email: result.email ?? null,
          checking: false,
          error: null,
        });
      } else if (result?.reason === 'network_error') {
        // Network error — use cached validUntil for offline fallback
        const { validUntil } = get();
        const now = Math.floor(Date.now() / 1000);
        if (validUntil && validUntil > now) {
          // Still within grace period — keep current status
          set({ checking: false });
        } else {
          // Past grace or no cache — fail closed
          set({ status: 'expired', checking: false });
        }
      } else {
        // Server says invalid — license is dead regardless of reason
        set({ status: 'expired', checking: false });
      }
    } catch {
      // Unexpected error — use cache fallback
      const { validUntil } = get();
      const now = Math.floor(Date.now() / 1000);
      if (validUntil && validUntil > now) {
        set({ checking: false });
      } else {
        set({ status: 'expired', checking: false });
      }
    }
  },

  deactivate: () => {
    invokeIpc('license:clear').catch(() => {});
    set({
      key: null,
      status: 'invalid',
      validUntil: null,
      email: null,
      error: null,
    });
  },

  openPortal: async () => {
    const { key } = get();
    if (!key) return;

    try {
      const result = await invokeIpc<{ url?: string; error?: string }>('license:portal', key);
      if (result?.url) {
        window.electron.openExternal(result.url);
      } else {
        toast.error('Could not open billing portal. Check your internet connection and try again.');
      }
    } catch {
      toast.error('Could not open billing portal. Check your internet connection and try again.');
    }
  },
}));

/** Map server status string to our LicenseStatus type */
function mapServerStatus(status: string | null): LicenseStatus {
  switch (status) {
    case 'trialing': return 'trialing';
    case 'active': return 'active';
    case 'past_due': return 'past_due';
    case 'canceling': return 'canceling';
    case 'canceled': return 'expired';
    default: return 'valid';
  }
}

/** Map server reason to user-facing error message */
function getErrorMessage(reason?: string): string {
  switch (reason) {
    case 'not_found':
      return 'Invalid license key. Check your email for the correct key.';
    case 'expired':
      return 'This license has expired. Renew at simoffice.xyz';
    case 'canceled':
      return 'This subscription was canceled. Resubscribe at simoffice.xyz';
    case 'network_error':
      return 'Could not reach the license server. Check your internet connection.';
    default:
      return 'Invalid license key.';
  }
}
