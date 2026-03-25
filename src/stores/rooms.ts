/**
 * Room Store — frontend-only abstraction for group chat rooms.
 * Rooms are created from career templates and persist in localStorage.
 * No backend/Gateway changes needed.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CareerTemplate } from '@/lib/career-templates';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RoomDefinition {
  id: string;
  name: string;           // Display name, e.g. '#crypto-trading'
  careerId: string;       // Links back to CareerTemplate.id
  icon: string;           // Emoji from career template
  agentIds: string[];     // Ordered — defines meeting speaking order
  createdAt: number;
}

export type RoomMode = 'chat' | 'meeting';

export interface TeamMessage {
  id: string;
  roomId: string;
  role: 'user' | 'assistant';
  agentId?: string;
  agentName?: string;
  text: string;
  timestamp: number;
  roundId: string;
}

export interface MeetingResponse {
  agentId: string;
  agentName: string;
  text: string;
  timestamp: number;
}

export interface MeetingRound {
  id: string;
  roomId: string;
  question: string;
  agentOrder: string[];
  responses: MeetingResponse[];
  status: 'running' | 'complete' | 'aborted';
  currentAgentIndex: number;
  startedAt: number;
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

interface RoomsState {
  rooms: RoomDefinition[];
  activeRoomId: string | null;
  targetAgentId: string | null;
  mode: RoomMode;
  meetingInProgress: MeetingRound | null;
  meetings: MeetingRound[];           // completed meetings for history

  // Team mode
  teamMode: boolean;
  teamMessages: TeamMessage[];
  teamRoundInProgress: boolean;
  currentRoundAgentIndex: number;
  currentRoundAgentId: string | null;

  // Actions
  createRoomFromCareer: (career: CareerTemplate) => RoomDefinition;
  createCustomRoom: (name: string, icon: string, agentIds: string[]) => RoomDefinition;
  deleteRoom: (roomId: string) => void;
  setActiveRoom: (roomId: string | null) => void;
  setTargetAgent: (agentId: string | null) => void;
  setMode: (mode: RoomMode) => void;
  getActiveRoom: () => RoomDefinition | null;
  setMeeting: (meeting: MeetingRound | null) => void;
  addCompletedMeeting: (meeting: MeetingRound) => void;
  updateRoomAgentIds: (roomId: string, agentIds: string[]) => void;
  setTeamMode: (on: boolean) => void;
  addTeamMessage: (msg: TeamMessage) => void;
  setTeamRoundStatus: (inProgress: boolean, agentIndex?: number, agentId?: string | null) => void;
  clearTeamMessages: (roomId: string) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function careerToRoomName(label: string): string {
  return '#' + label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useRoomsStore = create<RoomsState>()(
  persist(
    (set, get) => ({
      rooms: [],
      activeRoomId: null,
      targetAgentId: null,
      mode: 'chat',
      meetingInProgress: null,
      meetings: [],
      teamMode: false,
      teamMessages: [],
      teamRoundInProgress: false,
      currentRoundAgentIndex: 0,
      currentRoundAgentId: null,

      createRoomFromCareer: (career) => {
        const existing = get().rooms.find(r => r.careerId === career.id);
        if (existing) return existing;

        const room: RoomDefinition = {
          id: `room-${career.id}`,
          name: careerToRoomName(career.label),
          careerId: career.id,
          icon: career.icon,
          agentIds: [...career.recommended],
          createdAt: Date.now(),
        };

        set((s) => ({ rooms: [...s.rooms, room] }));
        return room;
      },

      createCustomRoom: (name, icon, agentIds) => {
        const id = `room-custom-${Date.now()}`;
        const room: RoomDefinition = {
          id,
          name: name.startsWith('#') ? name : `#${name}`,
          careerId: 'custom',
          icon,
          agentIds: [...agentIds],
          createdAt: Date.now(),
        };
        set((s) => ({ rooms: [...s.rooms, room] }));
        return room;
      },

      deleteRoom: (roomId) => {
        set((s) => ({
          rooms: s.rooms.filter(r => r.id !== roomId),
          activeRoomId: s.activeRoomId === roomId ? null : s.activeRoomId,
        }));
      },

      setActiveRoom: (roomId) => {
        set({ activeRoomId: roomId, targetAgentId: null, mode: 'chat' });
      },

      setTargetAgent: (agentId) => {
        set({ targetAgentId: agentId });
      },

      setMode: (mode) => {
        set({ mode });
      },

      getActiveRoom: () => {
        const { rooms, activeRoomId } = get();
        if (!activeRoomId) return null;
        return rooms.find(r => r.id === activeRoomId) ?? null;
      },

      setMeeting: (meeting) => {
        set({ meetingInProgress: meeting });
      },

      addCompletedMeeting: (meeting) => {
        set((s) => ({
          meetings: [...s.meetings, meeting],
          meetingInProgress: null,
          mode: 'chat',
        }));
      },

      updateRoomAgentIds: (roomId, agentIds) => {
        set((s) => ({
          rooms: s.rooms.map(r => r.id === roomId ? { ...r, agentIds } : r),
        }));
      },

      setTeamMode: (on) => set({ teamMode: on }),

      addTeamMessage: (msg) => {
        set((s) => ({ teamMessages: [...s.teamMessages, msg] }));
      },

      setTeamRoundStatus: (inProgress, agentIndex = 0, agentId = null) => {
        set({ teamRoundInProgress: inProgress, currentRoundAgentIndex: agentIndex, currentRoundAgentId: agentId });
      },

      clearTeamMessages: (roomId) => {
        set((s) => ({
          teamMessages: s.teamMessages.filter(m => m.roomId !== roomId),
        }));
      },
    }),
    { name: 'simoffice:rooms' },
  ),
);
