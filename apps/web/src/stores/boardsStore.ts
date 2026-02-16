import { create } from 'zustand';
import type { IBoard } from '@openfeedback/shared';
import { useAuthStore } from './authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

interface BoardsState {
  boards: IBoard[];
  isLoading: boolean;
  error: string | null;

  fetchBoards: () => Promise<void>;
  createBoard: (data: CreateBoardData) => Promise<IBoard>;
  updateBoard: (id: string, data: Partial<CreateBoardData>) => Promise<IBoard>;
  deleteBoard: (id: string) => Promise<void>;
}

export interface CreateBoardData {
  name: string;
  isPrivate?: boolean;
}

export const useBoardsStore = create<BoardsState>((set, get) => ({
  boards: [],
  isLoading: false,
  error: null,

  fetchBoards: async () => {
    set({ isLoading: true, error: null });
    try {
      const { accessToken } = useAuthStore.getState();
      
      const response = await fetch(`${API_URL}/boards/list`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch boards');
      }

      set({ boards: data.boards, isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch boards',
      });
    }
  },

  createBoard: async (data) => {
    const { accessToken } = useAuthStore.getState();
    
    const response = await fetch(`${API_URL}/boards/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to create board');
    }

    set((state) => ({ boards: [...state.boards, result] }));
    return result;
  },

  updateBoard: async (id, data) => {
    const { accessToken } = useAuthStore.getState();
    
    const response = await fetch(`${API_URL}/boards/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      },
      body: JSON.stringify({ boardID: id, ...data }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to update board');
    }

    set((state) => ({
      boards: state.boards.map((b) => (b.id === id ? result : b)),
    }));
    return result;
  },

  deleteBoard: async (id) => {
    const { accessToken } = useAuthStore.getState();
    
    const response = await fetch(`${API_URL}/boards/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      },
      body: JSON.stringify({ boardID: id }),
    });

    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.error || 'Failed to delete board');
    }

    set((state) => ({
      boards: state.boards.filter((b) => b.id !== id),
    }));
  },
}));
