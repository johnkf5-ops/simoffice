/**
 * OpenClaw Controls Store — Zustand store for the OpenClaw Controls page.
 * Loads config snapshot via IPC, owns draft state for global config forms.
 */
import { create } from 'zustand';
import { invokeIpc } from '@/lib/api-client';
import type {
  OpenClawControlsSnapshot,
  OpenClawGlobalPatch,
  SessionResetConfig,
  SessionMaintenanceConfig,
} from '../../shared/openclaw-controls';

interface OpenClawControlsState {
  // Snapshot from main process
  snapshot: OpenClawControlsSnapshot | null;
  loading: boolean;
  error: string | null;

  // Draft state for global config form (batched edits, explicit Save)
  draftIdleMinutes: number | null;
  draftReset: SessionResetConfig | null;
  draftMaintenance: Partial<SessionMaintenanceConfig> | null;
  dirty: boolean;
  saving: boolean;

  // Actions
  loadSnapshot: () => Promise<void>;
  setDraftIdleMinutes: (value: number | null) => void;
  setDraftReset: (value: SessionResetConfig | null) => void;
  setDraftMaintenance: (value: Partial<SessionMaintenanceConfig> | null) => void;
  resetDraft: () => void;
  saveGlobalConfig: () => Promise<{ success: boolean; error?: string }>;
}

export const useOpenClawControlsStore = create<OpenClawControlsState>((set, get) => ({
  snapshot: null,
  loading: false,
  error: null,

  draftIdleMinutes: null,
  draftReset: null,
  draftMaintenance: null,
  dirty: false,
  saving: false,

  loadSnapshot: async () => {
    set({ loading: true, error: null });
    try {
      const snapshot = await invokeIpc<OpenClawControlsSnapshot>('openclawControls:getSnapshot');
      set({
        snapshot,
        loading: false,
        // Seed draft from snapshot
        draftIdleMinutes: snapshot.sessionConfig.idleMinutes ?? null,
        draftReset: snapshot.sessionConfig.reset ?? null,
        draftMaintenance: snapshot.sessionConfig.maintenance ?? null,
        dirty: false,
      });
    } catch (error) {
      set({ loading: false, error: String(error) });
    }
  },

  setDraftIdleMinutes: (value) => set({ draftIdleMinutes: value, dirty: true }),
  setDraftReset: (value) => set({ draftReset: value, dirty: true }),
  setDraftMaintenance: (value) => set({ draftMaintenance: value, dirty: true }),

  resetDraft: () => {
    const { snapshot } = get();
    if (!snapshot) return;
    set({
      draftIdleMinutes: snapshot.sessionConfig.idleMinutes ?? null,
      draftReset: snapshot.sessionConfig.reset ?? null,
      draftMaintenance: snapshot.sessionConfig.maintenance ?? null,
      dirty: false,
    });
  },

  saveGlobalConfig: async () => {
    const { draftIdleMinutes, draftReset, draftMaintenance, snapshot } = get();
    set({ saving: true });
    try {
      const patch: OpenClawGlobalPatch = { sessionConfig: {} };

      // Compare with snapshot to only send changes
      const prev = snapshot?.sessionConfig;

      // idleMinutes: null in draft means remove
      if (draftIdleMinutes !== (prev?.idleMinutes ?? null)) {
        patch.sessionConfig!.idleMinutes = draftIdleMinutes ?? null;
      }

      // reset
      if (JSON.stringify(draftReset) !== JSON.stringify(prev?.reset ?? null)) {
        patch.sessionConfig!.reset = draftReset ?? null;
      }

      // maintenance
      if (JSON.stringify(draftMaintenance) !== JSON.stringify(prev?.maintenance ?? null)) {
        patch.sessionConfig!.maintenance = draftMaintenance ?? null;
      }

      const result = await invokeIpc<{ success: boolean; error?: string }>(
        'openclawControls:applyGlobalPatch',
        patch,
      );

      if (result.success) {
        // Refresh snapshot after successful save
        await get().loadSnapshot();
      }

      set({ saving: false });
      return result;
    } catch (error) {
      set({ saving: false });
      return { success: false, error: String(error) };
    }
  },
}));
