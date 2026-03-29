export type SessionResetConfig = {
  mode?: 'daily' | 'idle';
  atHour?: number;
  idleMinutes?: number;
};

export type SessionMaintenanceConfig = {
  mode?: 'enforce' | 'warn';
  pruneAfter?: string | number;
  pruneDays?: number;
  maxEntries?: number;
  rotateBytes?: string | number;
  resetArchiveRetention?: string | number | false;
  maxDiskBytes?: string | number;
  highWaterBytes?: string | number;
};

export type OpenClawControlsSnapshot = {
  configPath: string;
  sessionConfig: {
    idleMinutes?: number;
    reset?: SessionResetConfig;
    resetByType?: {
      direct?: SessionResetConfig;
      dm?: SessionResetConfig;
      group?: SessionResetConfig;
      thread?: SessionResetConfig;
    };
    resetByChannel?: Record<string, SessionResetConfig>;
    maintenance?: SessionMaintenanceConfig;
  };
  enforcedFlags: {
    toolsProfile: 'full';
    sessionsVisibility: 'all';
  };
};

export type OpenClawGlobalPatch = {
  sessionConfig?: {
    idleMinutes?: number | null;
    reset?: SessionResetConfig | null;
    resetByType?: {
      direct?: SessionResetConfig | null;
      dm?: SessionResetConfig | null;
      group?: SessionResetConfig | null;
      thread?: SessionResetConfig | null;
    } | null;
    resetByChannel?: Record<string, SessionResetConfig | null> | null;
    maintenance?: Partial<SessionMaintenanceConfig> | null;
  };
};
// null = remove field from config, undefined = leave unchanged

export type ParserPreview = {
  supported: true;
  summary: string;
  operations: string[];
  destructive: boolean;
  requiresGatewayReload: boolean;
  execute: () => Promise<void>;
} | {
  supported: false;
  message: string;
};
