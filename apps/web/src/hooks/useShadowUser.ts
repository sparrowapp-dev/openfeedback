import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { createOrUpdateUser } from '../services/api';

const STORAGE_KEY = 'openfeedback_guest_id';
const USER_ID_KEY = 'openfeedback_user_id';

interface ShadowUser {
  /** Internal OpenFeedback user ID (MongoDB ObjectID) */
  userId: string | null;
  /** External guest ID (UUID stored in localStorage) */
  guestId: string;
  /** Whether user is a guest/shadow user */
  isGuest: boolean;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: string | null;
}

/**
 * Shadow User Hook
 * 
 * Enables guest feedback without requiring authentication.
 * 
 * How it works:
 * 1. Check localStorage for existing guest ID
 * 2. If none exists, generate a UUID
 * 3. Call /users/create_or_update with { userID: "guest_xxx", name: "Guest", email: null }
 * 4. Store the returned internal user ID for voting/commenting
 * 
 * Usage:
 * ```tsx
 * const { userId, isGuest, isLoading, ensureUser } = useShadowUser();
 * 
 * // User can vote immediately
 * if (userId) {
 *   await vote({ postID, voterID: userId });
 * }
 * ```
 */
export function useShadowUser(): ShadowUser & { 
  ensureUser: () => Promise<string | null>;
  setAuthenticatedUser: (userId: string) => void;
  logout: () => void;
} {
  const [state, setState] = useState<ShadowUser>({
    userId: null,
    guestId: '',
    isGuest: true,
    isLoading: true,
    error: null,
  });

  // Initialize on mount - but only create guest user when needed
  useEffect(() => {
    // Check if we have a stored user ID
    const storedUserId = localStorage.getItem(USER_ID_KEY);
    const storedGuestId = localStorage.getItem(STORAGE_KEY);
    
    if (storedUserId && !storedUserId.startsWith('guest_')) {
      // Authenticated user
      setState({
        userId: storedUserId,
        guestId: storedGuestId || '',
        isGuest: false,
        isLoading: false,
        error: null,
      });
    } else if (storedUserId && storedGuestId) {
      // Existing guest user
      setState({
        userId: storedUserId,
        guestId: storedGuestId,
        isGuest: true,
        isLoading: false,
        error: null,
      });
    } else {
      // No user yet - will be created when needed
      setState(prev => ({
        ...prev,
        isLoading: false,
      }));
    }
  }, []);

  const initializeUser = async () => {
    try {
      // Check for authenticated user first
      const storedUserId = localStorage.getItem(USER_ID_KEY);
      if (storedUserId && !storedUserId.startsWith('guest_')) {
        setState({
          userId: storedUserId,
          guestId: '',
          isGuest: false,
          isLoading: false,
          error: null,
        });
        return;
      }

      // Get or create guest ID
      let guestId = localStorage.getItem(STORAGE_KEY);
      if (!guestId) {
        guestId = `guest_${uuidv4().replace(/-/g, '').substring(0, 16)}`;
        localStorage.setItem(STORAGE_KEY, guestId);
      }

      // Create shadow user in backend
      const { id: userId } = await createOrUpdateUser({
        userID: guestId,
        name: 'Guest',
        email: null,
      });

      // Store the internal user ID
      localStorage.setItem(USER_ID_KEY, userId);

      setState({
        userId,
        guestId,
        isGuest: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Failed to initialize shadow user:', error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to initialize user',
      }));
    }
  };

  /**
   * Ensure user exists and return the user ID
   * Call this before any action that requires a user
   * Only creates guest user on demand
   */
  const ensureUser = useCallback(async (): Promise<string | null> => {
    if (state.userId) {
      return state.userId;
    }

    if (state.isLoading) {
      // Wait for initialization
      await new Promise<void>((resolve) => {
        const checkInterval = setInterval(() => {
          if (!state.isLoading) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
      });
      return state.userId;
    }

    // Create guest user now
    await initializeUser();
    return state.userId;
  }, [state.userId, state.isLoading]);

  /**
   * Set an authenticated user (after Google SSO or other auth)
   */
  const setAuthenticatedUser = useCallback((userId: string) => {
    localStorage.setItem(USER_ID_KEY, userId);
    setState({
      userId,
      guestId: '',
      isGuest: false,
      isLoading: false,
      error: null,
    });
  }, []);

  /**
   * Logout and reset to guest mode
   */
  const logout = useCallback(() => {
    localStorage.removeItem(USER_ID_KEY);
    // Keep guest ID for continuity
    setState((prev) => ({
      ...prev,
      userId: null,
      isGuest: true,
    }));
    // Re-initialize as guest
    initializeUser();
  }, []);

  return {
    ...state,
    ensureUser,
    setAuthenticatedUser,
    logout,
  };
}

export default useShadowUser;
