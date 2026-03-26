/**
 * Cron State Store
 * Manages scheduled task state
 */
import { create } from 'zustand';
import { hostApiFetch } from '@/lib/host-api';
import type { CronJob, CronJobCreateInput, CronJobUpdateInput, CronRunEntry } from '../types/cron';

interface CronState {
  jobs: CronJob[];
  loading: boolean;
  error: string | null;
  runHistory: Record<string, CronRunEntry[]>; // jobId → runs (newest first)
  runHistoryLoading: Record<string, boolean>;

  // Actions
  fetchJobs: () => Promise<void>;
  createJob: (input: CronJobCreateInput) => Promise<CronJob>;
  updateJob: (id: string, input: CronJobUpdateInput) => Promise<void>;
  deleteJob: (id: string) => Promise<void>;
  toggleJob: (id: string, enabled: boolean) => Promise<void>;
  triggerJob: (id: string) => Promise<void>;
  fetchRunHistory: (jobId: string) => Promise<void>;
  setJobs: (jobs: CronJob[]) => void;
}

export const useCronStore = create<CronState>((set) => ({
  jobs: [],
  loading: false,
  error: null,
  runHistory: {},
  runHistoryLoading: {},

  fetchJobs: async () => {
    set({ loading: true, error: null });

    try {
      const result = await hostApiFetch<CronJob[]>('/api/cron/jobs');
      set({ jobs: result, loading: false });
    } catch (error) {
      set({ error: String(error), loading: false });
    }
  },

  createJob: async (input) => {
    try {
      const job = await hostApiFetch<CronJob>('/api/cron/jobs', {
        method: 'POST',
        body: JSON.stringify(input),
      });
      set((state) => ({ jobs: [...state.jobs, job] }));
      return job;
    } catch (error) {
      console.error('Failed to create cron job:', error);
      throw error;
    }
  },

  updateJob: async (id, input) => {
    try {
      await hostApiFetch(`/api/cron/jobs/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(input),
      });
      // Refresh from server to get properly-transformed schedule/sessionTarget
      try {
        const jobs = await hostApiFetch<CronJob[]>('/api/cron/jobs');
        set({ jobs });
      } catch {
        // Fallback: optimistic update
        set((state) => ({
          jobs: state.jobs.map((job) =>
            job.id === id ? { ...job, name: input.name ?? job.name, message: input.message ?? job.message, agentId: input.agentId ?? job.agentId, updatedAt: new Date().toISOString() } : job
          ),
        }));
      }
    } catch (error) {
      console.error('Failed to update cron job:', error);
      throw error;
    }
  },

  deleteJob: async (id) => {
    try {
      await hostApiFetch(`/api/cron/jobs/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      set((state) => ({
        jobs: state.jobs.filter((job) => job.id !== id),
        runHistory: (() => { const h = { ...state.runHistory }; delete h[id]; return h; })(),
      }));
    } catch (error) {
      console.error('Failed to delete cron job:', error);
      throw error;
    }
  },

  toggleJob: async (id, enabled) => {
    try {
      await hostApiFetch('/api/cron/toggle', {
        method: 'POST',
        body: JSON.stringify({ id, enabled }),
      });
      set((state) => ({
        jobs: state.jobs.map((job) =>
          job.id === id ? { ...job, enabled } : job
        ),
      }));
    } catch (error) {
      console.error('Failed to toggle cron job:', error);
      throw error;
    }
  },

  triggerJob: async (id) => {
    try {
      const result = await hostApiFetch('/api/cron/trigger', {
        method: 'POST',
        body: JSON.stringify({ id }),
      });
      console.log('Cron trigger result:', result);
      // Refresh jobs after trigger to update lastRun/nextRun state
      try {
        const jobs = await hostApiFetch<CronJob[]>('/api/cron/jobs');
        set({ jobs });
      } catch {
        // Ignore refresh error
      }
    } catch (error) {
      console.error('Failed to trigger cron job:', error);
      throw error;
    }
  },

  fetchRunHistory: async (jobId) => {
    set((state) => ({ runHistoryLoading: { ...state.runHistoryLoading, [jobId]: true } }));
    try {
      const result = await hostApiFetch<{ runs: CronRunEntry[] }>(`/api/cron/runs/${encodeURIComponent(jobId)}`);
      set((state) => ({
        runHistory: { ...state.runHistory, [jobId]: result.runs },
        runHistoryLoading: { ...state.runHistoryLoading, [jobId]: false },
      }));
    } catch {
      set((state) => ({
        runHistory: { ...state.runHistory, [jobId]: [] },
        runHistoryLoading: { ...state.runHistoryLoading, [jobId]: false },
      }));
    }
  },

  setJobs: (jobs) => set({ jobs }),
}));
