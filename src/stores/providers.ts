/**
 * Provider State Store
 * Manages AI provider configurations
 */
import { create } from 'zustand';
import type {
  ProviderAccount,
  ProviderConfig,
  ProviderVendorInfo,
  ProviderWithKeyInfo,
} from '@/lib/providers';
import { hostApiFetch } from '@/lib/host-api';
import {
  buildProviderListItems,
  fetchProviderSnapshot,
  type ProviderListItem,
  type ProviderSnapshot,
} from '@/lib/provider-accounts';

// Re-export types for consumers that imported from here
export type {
  ProviderAccount,
  ProviderConfig,
  ProviderVendorInfo,
  ProviderWithKeyInfo,
} from '@/lib/providers';
export type { ProviderListItem, ProviderSnapshot } from '@/lib/provider-accounts';

interface ProviderState {
  providers: ProviderWithKeyInfo[];
  accounts: ProviderAccount[];
  vendors: ProviderVendorInfo[];
  defaultProviderId: string | null;
  defaultAccountId: string | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchProviders: () => Promise<void>;
  addProvider: (config: Omit<ProviderConfig, 'createdAt' | 'updatedAt'>, apiKey?: string) => Promise<void>;
  addAccount: (account: ProviderAccount, apiKey?: string) => Promise<void>;
  updateProvider: (providerId: string, updates: Partial<ProviderConfig>, apiKey?: string) => Promise<void>;
  updateAccount: (accountId: string, updates: Partial<ProviderAccount>, apiKey?: string) => Promise<void>;
  deleteProvider: (providerId: string) => Promise<void>;
  deleteAccount: (accountId: string) => Promise<void>;
  setApiKey: (providerId: string, apiKey: string) => Promise<void>;
  updateProviderWithKey: (
    providerId: string,
    updates: Partial<ProviderConfig>,
    apiKey?: string
  ) => Promise<void>;
  deleteApiKey: (providerId: string) => Promise<void>;
  setDefaultProvider: (providerId: string) => Promise<void>;
  setDefaultAccount: (accountId: string) => Promise<void>;
  validateApiKey: (
    providerId: string,
    apiKey: string,
    options?: { baseUrl?: string }
  ) => Promise<{ valid: boolean; error?: string }>;
  getApiKey: (providerId: string) => Promise<string | null>;
}

export function selectProviderSnapshot(state: ProviderState): ProviderSnapshot {
  return {
    accounts: state.accounts,
    statuses: state.providers,
    vendors: state.vendors,
    defaultAccountId: state.defaultAccountId,
  };
}

export function selectProviderListItems(state: ProviderState): ProviderListItem[] {
  return buildProviderListItems(
    state.accounts,
    state.providers,
    state.vendors,
    state.defaultAccountId,
  );
}

export function selectStatusByAccountId(state: ProviderState): Map<string, ProviderWithKeyInfo> {
  return new Map(state.providers.map((provider) => [provider.id, provider]));
}

export const useProviderStore = create<ProviderState>((set, get) => ({
  providers: [],
  accounts: [],
  vendors: [],
  defaultProviderId: null,
  defaultAccountId: null,
  loading: false,
  error: null,
  
  fetchProviders: async () => {
    set({ loading: true, error: null });
    
    try {
      const snapshot = await fetchProviderSnapshot();
      
      set({ 
        providers: snapshot.statuses,
        accounts: snapshot.accounts,
        vendors: snapshot.vendors,
        defaultProviderId: snapshot.defaultAccountId,
        defaultAccountId: snapshot.defaultAccountId,
        loading: false 
      });
    } catch (error) {
      set({ error: String(error), loading: false });
    }
  },
  
  addProvider: async (config, apiKey) => {
    try {
      const fullConfig: ProviderConfig = {
        ...config,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      const result = await hostApiFetch<{ success: boolean; error?: string }>('/api/providers', {
        method: 'POST',
        body: JSON.stringify({ config: fullConfig, apiKey }),
      });
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to save provider');
      }
      
      // Refresh the list
      await get().fetchProviders();
    } catch (error) {
      console.error('Failed to add provider:', error);
      throw error;
    }
  },

  addAccount: async (account, apiKey) => {
    try {
      const result = await hostApiFetch<{ success: boolean; error?: string }>('/api/provider-accounts', {
        method: 'POST',
        body: JSON.stringify({ account, apiKey }),
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to create provider account');
      }

      await get().fetchProviders();
    } catch (error) {
      console.error('Failed to add account:', error);
      throw error;
    }
  },
  
  updateProvider: async (providerId, updates, apiKey) => {
    try {
      const existing = get().providers.find((p) => p.id === providerId);
      if (!existing) {
        throw new Error('Provider not found');
      }

      const { hasKey: _hasKey, keyMasked: _keyMasked, ...providerConfig } = existing;
      
      const updatedConfig: ProviderConfig = {
        ...providerConfig,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      
      const result = await hostApiFetch<{ success: boolean; error?: string }>(`/api/providers/${encodeURIComponent(providerId)}`, {
        method: 'PUT',
        body: JSON.stringify({ updates: updatedConfig, apiKey }),
      });
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update provider');
      }
      
      // Refresh the list
      await get().fetchProviders();
    } catch (error) {
      console.error('Failed to update provider:', error);
      throw error;
    }
  },

  updateAccount: async (accountId, updates, apiKey) => {
    try {
      const result = await hostApiFetch<{ success: boolean; error?: string }>(`/api/provider-accounts/${encodeURIComponent(accountId)}`, {
        method: 'PUT',
        body: JSON.stringify({ updates, apiKey }),
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to update provider account');
      }

      await get().fetchProviders();
    } catch (error) {
      console.error('Failed to update account:', error);
      throw error;
    }
  },
  
  deleteProvider: async (providerId) => {
    try {
      const result = await hostApiFetch<{ success: boolean; error?: string }>(`/api/providers/${encodeURIComponent(providerId)}`, {
        method: 'DELETE',
      });
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete provider');
      }
      
      // Refresh the list
      await get().fetchProviders();
    } catch (error) {
      console.error('Failed to delete provider:', error);
      throw error;
    }
  },

  deleteAccount: async (accountId) => {
    try {
      const result = await hostApiFetch<{ success: boolean; error?: string }>(`/api/provider-accounts/${encodeURIComponent(accountId)}`, {
        method: 'DELETE',
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete provider account');
      }

      await get().fetchProviders();
    } catch (error) {
      console.error('Failed to delete account:', error);
      throw error;
    }
  },
  
  setApiKey: async (providerId, apiKey) => {
    try {
      const result = await hostApiFetch<{ success: boolean; error?: string }>(`/api/providers/${encodeURIComponent(providerId)}`, {
        method: 'PUT',
        body: JSON.stringify({ updates: {}, apiKey }),
      });
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to set API key');
      }
      
      // Refresh the list
      await get().fetchProviders();
    } catch (error) {
      console.error('Failed to set API key:', error);
      throw error;
    }
  },

  updateProviderWithKey: async (providerId, updates, apiKey) => {
    try {
      const result = await hostApiFetch<{ success: boolean; error?: string }>(`/api/providers/${encodeURIComponent(providerId)}`, {
        method: 'PUT',
        body: JSON.stringify({ updates, apiKey }),
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to update provider');
      }

      await get().fetchProviders();
    } catch (error) {
      console.error('Failed to update provider with key:', error);
      throw error;
    }
  },
  
  deleteApiKey: async (providerId) => {
    try {
      const result = await hostApiFetch<{ success: boolean; error?: string }>(
        `/api/providers/${encodeURIComponent(providerId)}?apiKeyOnly=1`,
        { method: 'DELETE' },
      );
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete API key');
      }
      
      // Refresh the list
      await get().fetchProviders();
    } catch (error) {
      console.error('Failed to delete API key:', error);
      throw error;
    }
  },
  
  setDefaultProvider: async (providerId) => {
    try {
      const result = await hostApiFetch<{ success: boolean; error?: string }>('/api/providers/default', {
        method: 'PUT',
        body: JSON.stringify({ providerId }),
      });
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to set default provider');
      }
      
      set({ defaultProviderId: providerId, defaultAccountId: providerId });
    } catch (error) {
      console.error('Failed to set default provider:', error);
      throw error;
    }
  },

  setDefaultAccount: async (accountId) => {
    try {
      const result = await hostApiFetch<{ success: boolean; error?: string }>('/api/provider-accounts/default', {
        method: 'PUT',
        body: JSON.stringify({ accountId }),
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to set default provider account');
      }

      set({ defaultProviderId: accountId, defaultAccountId: accountId });
    } catch (error) {
      console.error('Failed to set default account:', error);
      throw error;
    }
  },
  
  validateApiKey: async (providerId, apiKey, options) => {
    try {
      const result = await hostApiFetch<{ valid: boolean; error?: string }>('/api/providers/validate', {
        method: 'POST',
        body: JSON.stringify({ providerId, apiKey, options }),
      });
      return result;
    } catch (error) {
      return { valid: false, error: String(error) };
    }
  },
  
  getApiKey: async (providerId) => {
    try {
      const result = await hostApiFetch<{ apiKey: string | null }>(`/api/providers/${encodeURIComponent(providerId)}/api-key`);
      return result.apiKey;
    } catch {
      return null;
    }
  },
}));
