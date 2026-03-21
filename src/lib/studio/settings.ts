// Stub — Claw3D studio settings not needed in OpenLobby
export function useStudioSettings() { return { gatewayUrl: '', token: '' }; }
export function getStudioSettings() { return { gatewayUrl: '', token: '' }; }

export type StudioAnalyticsBudgetSettings = {
  dailySpendLimitUsd: number | null;
  monthlySpendLimitUsd: number | null;
  perAgentSoftLimitUsd: number | null;
  alertThresholdPct: number;
};

export type StudioStandupPreferencePatch = any;

export type StudioStandupPreferencePublic = {
  schedule: {
    enabled: boolean;
    cronExpr: string;
    timezone: string;
    lastAutoRunAt: string | null;
    autoOpenBoard?: boolean;
  };
  manualByAgentId: Record<string, any>;
};

export function defaultStudioAnalyticsPreference() {
  return {
    budgets: {
      dailySpendLimitUsd: null,
      monthlySpendLimitUsd: null,
      perAgentSoftLimitUsd: null,
      alertThresholdPct: 80,
    } as StudioAnalyticsBudgetSettings,
  };
}

export function resolveAnalyticsPreference(_settings: any, _key: string) {
  return defaultStudioAnalyticsPreference();
}

export function resolveDeskAssignments(_settings: any, _key: string): Record<string, any> {
  return {};
}
