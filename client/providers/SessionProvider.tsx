'use client';

import React, { createContext, useReducer } from 'react';

export type Session =
  | {
      authenticated: true;
      did: string;
    }
  | {
      authenticated: false;
    };

export type SessionState = {
  session: Session | null;
  isLoading: boolean;
};

export type SessionAction =
  | { type: 'SET_SESSION'; payload: Session }
  | { type: 'CLEAR_SESSION' }
  | { type: 'SET_LOADING'; payload: boolean };

export type SessionContextType = {
  state: SessionState;
  dispatch: React.Dispatch<SessionAction>;
  logout: () => Promise<void>;
};

export const SessionContext = createContext<SessionContextType | undefined>(
  undefined,
);

function sessionReducer(
  state: SessionState,
  action: SessionAction,
): SessionState {
  switch (action.type) {
    case 'SET_SESSION':
      return {
        ...state,
        session: action.payload,
        isLoading: false,
      };
    case 'CLEAR_SESSION':
      return {
        ...state,
        session: { authenticated: false },
        isLoading: false,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    default:
      return state;
  }
}

type SessionProviderProps = {
  children: React.ReactNode;
  initialSession: Session | null;
};

export function SessionProvider({
  children,
  initialSession,
}: SessionProviderProps) {
  const [state, dispatch] = useReducer(sessionReducer, {
    session: initialSession,
    isLoading: false,
  });

  const logout = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/logout`,
        {
          method: 'POST',
          credentials: 'include',
        },
      );

      if (!response.ok) {
        throw new Error('Logout failed');
      }

      dispatch({ type: 'CLEAR_SESSION' });

      // Redirect to login page after logout
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  return (
    <SessionContext.Provider value={{ state, dispatch, logout }}>
      {children}
    </SessionContext.Provider>
  );
}
