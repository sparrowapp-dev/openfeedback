import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { initOpenFeedback, type OpenFeedbackConfig } from '../services/api';
import { useShadowUser } from './useShadowUser';
import { useFeedbackStore } from '../stores/feedbackStore';
import { useAuthStore } from '../stores/authStore';

interface OpenFeedbackContextValue {
  // User
  userId: string | null;
  isGuest: boolean;
  isUserLoading: boolean;
  ensureUser: () => Promise<string | null>;
  setAuthenticatedUser: (userId: string) => void;
  logout: () => void;
  
  // Config
  config: OpenFeedbackConfig;
}

const OpenFeedbackContext = createContext<OpenFeedbackContextValue | null>(null);

export interface OpenFeedbackProviderProps {
  children: ReactNode;
  /** API base URL (e.g., "http://localhost:3000/api/v1") */
  apiUrl: string;
  /** Your OpenFeedback API key */
  apiKey: string;
  /** Optional: Pre-authenticated user ID (skips shadow user creation) */
  userId?: string;
  /** Optional: Default board ID to load */
  defaultBoardId?: string;
}

/**
 * OpenFeedback Provider
 * 
 * Wrap your app or component tree with this provider to enable feedback functionality.
 * 
 * @example
 * ```tsx
 * import { OpenFeedbackProvider, FeedbackBoard } from '@openfeedback/web';
 * 
 * function App() {
 *   return (
 *     <OpenFeedbackProvider 
 *       apiUrl="http://localhost:3000/api/v1" 
 *       apiKey="of_your_api_key"
 *     >
 *       <FeedbackBoard boardId="..." />
 *     </OpenFeedbackProvider>
 *   );
 * }
 * ```
 */
export function OpenFeedbackProvider({ 
  children, 
  apiUrl, 
  apiKey, 
  userId: preAuthUserId,
  defaultBoardId,
}: OpenFeedbackProviderProps) {
  const shadowUser = useShadowUser();
  const { fetchBoards, setCurrentBoard, boards } = useFeedbackStore();

  // Initialize API client
  useEffect(() => {
    initOpenFeedback({ apiUrl, apiKey });
    fetchBoards();
  }, [apiUrl, apiKey]);

  // Set pre-authenticated user if provided
  useEffect(() => {
    if (preAuthUserId) {
      shadowUser.setAuthenticatedUser(preAuthUserId);
    }
  }, [preAuthUserId]);

  // Set default board when boards are loaded
  useEffect(() => {
    if (defaultBoardId && boards.length > 0) {
      const board = boards.find(b => b.id === defaultBoardId);
      if (board) {
        setCurrentBoard(board);
      }
    }
  }, [defaultBoardId, boards]);

  const config: OpenFeedbackConfig = { apiUrl, apiKey };

  // Check if user is authenticated via JWT (main app)
  const { user: authUser } = useAuthStore();
  const effectiveUserId = authUser?.id || preAuthUserId || shadowUser.userId;
  const effectiveIsGuest = !authUser && shadowUser.isGuest;

  const contextValue: OpenFeedbackContextValue = {
    userId: effectiveUserId,
    isGuest: effectiveIsGuest,
    isUserLoading: shadowUser.isLoading,
    ensureUser: async () => {
      // If logged in via JWT, return that user's ID
      if (authUser) return authUser.id;
      // Otherwise use guest/shadow user
      return shadowUser.ensureUser();
    },
    setAuthenticatedUser: shadowUser.setAuthenticatedUser,
    logout: shadowUser.logout,
    config,
  };

  return (
    <OpenFeedbackContext.Provider value={contextValue}>
      {children}
    </OpenFeedbackContext.Provider>
  );
}

/**
 * Hook to access OpenFeedback context
 */
export function useOpenFeedback(): OpenFeedbackContextValue {
  const context = useContext(OpenFeedbackContext);
  if (!context) {
    throw new Error('useOpenFeedback must be used within an OpenFeedbackProvider');
  }
  return context;
}

export default OpenFeedbackProvider;
